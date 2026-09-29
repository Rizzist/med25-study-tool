import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createAuth as createAuthCore,verifyPassword,passwordProblem,displayNameProblem,parseAccountConfig,requestToken,safeReturnTo} from '../src/lib/server/auth-core.mjs';
import {authStore} from '../src/lib/server/auth-store.mjs';
import {postgresAuthStore} from '../src/lib/server/auth-postgres.mjs';
import {createPdfCache} from '../public/med25-pdf-cache.mjs';

const STUDENT_ID='00000000001'; // Synthetic fixture; never use the owner's account in tests.
const FRIEND_ID='00000000002';
const TEST_ACCOUNTS=[{id:STUDENT_ID,name:'Primary Fixture'},{id:FRIEND_ID,name:null}];
const createAuth=options=>createAuthCore({accounts:TEST_ACCOUNTS,...options});
function memory(){let value=null;return {read:async()=>value,cas:async(before,after)=>{if(value!==before)return false;value=after;return true;}};}
test('Missing or invalid authorized-account configuration fails closed',()=>{
  for(const studentId of ['',null,'not-an-id','1234'])assert.throws(()=>createAuthCore({store:memory(),studentId}),{status:503,code:'AUTH_UNAVAILABLE'});
  assert.throws(()=>parseAccountConfig('[{"id":"12345"},{"id":"12345"}]',''),{status:503,code:'AUTH_UNAVAILABLE'});
  assert.ok(passwordProblem('prefix-'+STUDENT_ID+'-suffix',STUDENT_ID));
  assert.ok(displayNameProblem('1 invalid'));assert.equal(displayNameProblem('Test Student'),null);
});
const replacement='Only-for-automated-tests!7294';
test('Only authorized ID can log in, first session is restricted, password change rotates sessions',async()=>{
  const store=memory();let clock=1000000;const auth=createAuth({store,now:()=>clock});
  await assert.rejects(auth.login('someone-else',STUDENT_ID),{status:401,code:'UNSUPPORTED_ACCOUNT',message:'This student account is not supported. Ask the MED25 owner to add your student ID.'});
  await assert.rejects(auth.login(STUDENT_ID,'wrong'),{status:401,code:'INCORRECT_PASSWORD',message:'Incorrect password. Please try again.'});
  assert.equal(JSON.parse(await store.read()).accounts[STUDENT_ID].sessions.length,0);
  const first=await auth.login(STUDENT_ID,STUDENT_ID),other=await auth.login(STUDENT_ID,STUDENT_ID);
  assert.equal(first.mustChangePassword,true);assert.equal((await auth.session(first.token)).mustChangePassword,true);
  const before=JSON.parse(await store.read()),beforeAccount=before.accounts[STUDENT_ID];assert.equal(beforeAccount.sessions.some(s=>s.hash===first.token),false);assert.notEqual(beforeAccount.passwordHash,STUDENT_ID);assert.equal(await verifyPassword(STUDENT_ID,beforeAccount.passwordHash),true);
  assert.equal((await auth.session(first.token)).displayName,'Primary Fixture');
  await assert.rejects(auth.changePassword(first.token,STUDENT_ID,STUDENT_ID,'','Primary Fixture'));
  await assert.rejects(auth.changePassword(first.token,replacement,'does not match','','Primary Fixture'));
  assert.equal((await auth.session(first.token)).mustChangePassword,true);
  const changed=await auth.changePassword(first.token,replacement,replacement,'','Primary Fixture');
  assert.equal(changed.mustChangePassword,false);assert.equal(await auth.session(first.token),null);assert.equal(await auth.session(other.token),null);
  await assert.rejects(auth.login(STUDENT_ID,STUDENT_ID),{status:401});
  const normal=await auth.login(STUDENT_ID,replacement);assert.equal(normal.mustChangePassword,false);
  const state=JSON.parse(await store.read()).accounts[STUDENT_ID];assert.equal(state.mustChangePassword,false);assert.equal(await verifyPassword(replacement,state.passwordHash),true);assert.equal((await store.read()).includes(replacement),false);
  await assert.rejects(auth.changePassword(normal.token,replacement+'new',replacement+'new','wrong','Primary Fixture'));
  await auth.logout(normal.token);assert.equal(await auth.session(normal.token),null);
  assert.equal(await auth.session(changed.token+'forged'),null);
  clock+=8*24*60*60*1000;assert.equal(await auth.session(changed.token),null);
});
test('Rate limit persists across auth instances; corrupt state never resets to bootstrap credentials',async()=>{
  const store=memory();const auth=createAuth({store});await assert.rejects(auth.login('invalid','wrong'));
  const raw=await store.read(),state=JSON.parse(raw);state.accounts[STUDENT_ID].attempts.count=12;await store.cas(raw,JSON.stringify(state));
  await assert.rejects(createAuth({store}).login(STUDENT_ID,STUDENT_ID),{status:429});
  const unsupportedRaw=await store.read(),unsupportedState=JSON.parse(unsupportedRaw);unsupportedState.unsupportedAttempts.count=12;await store.cas(unsupportedRaw,JSON.stringify(unsupportedState));
  await assert.rejects(createAuth({store}).login('unsupported-account','wrong'),{status:429});
  const corrupt={read:async()=>'{"schema":999}',cas:async()=>{assert.fail('Must not overwrite corrupt account');}};
  await assert.rejects(createAuth({store:corrupt}).login(STUDENT_ID,STUDENT_ID));
});
test('Concurrent password changes cannot both win or keep the old limited token',async()=>{
  const auth=createAuth({store:memory()});const first=await auth.login(STUDENT_ID,STUDENT_ID);
  const results=await Promise.allSettled([auth.changePassword(first.token,replacement,replacement,'','Primary Fixture'),auth.changePassword(first.token,replacement+'a',replacement+'a','','Primary Fixture')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(await auth.session(first.token),null);
});
test('Each configured account has an isolated name, password and session set',async()=>{
  const store=memory(),auth=createAuth({store});
  const owner=await auth.login(STUDENT_ID,STUDENT_ID),friend=await auth.login(FRIEND_ID,FRIEND_ID);
  await assert.rejects(auth.changePassword(friend.token,replacement,replacement,'',''),/full name/i);
  const friendChanged=await auth.changePassword(friend.token,replacement,replacement,'','Second Fixture');
  assert.equal((await auth.session(friendChanged.token)).displayName,'Second Fixture');
  assert.equal((await auth.session(owner.token)).displayName,'Primary Fixture');
  assert.equal((await auth.session(owner.token)).mustChangePassword,true);
  assert.equal((await auth.login(FRIEND_ID,replacement)).displayName,'Second Fixture');
  await assert.rejects(auth.login(FRIEND_ID,FRIEND_ID),{status:401,code:'INCORRECT_PASSWORD'});
});
test('Schema-one account migrates without resetting its password and adds configured friends explicitly',async()=>{
  const oldHash=await (await import('../src/lib/server/auth-core.mjs')).hashPassword(replacement);
  const old=JSON.stringify({schema:1,userId:STUDENT_ID,passwordHash:oldHash,mustChangePassword:false,sessions:[],attempts:{start:1,count:0}}),store=memory();
  await store.cas(null,old);const auth=createAuth({store});const summary=await auth.configureAccounts();
  assert.equal(summary.accountCount,2);assert.equal(await verifyPassword(replacement,JSON.parse(await store.read()).accounts[STUDENT_ID].passwordHash),true);
  assert.equal((await auth.login(STUDENT_ID,replacement)).displayName,'Primary Fixture');
  assert.equal((await auth.login(FRIEND_ID,FRIEND_ID)).mustChangePassword,true);
});
test('Local store survives a new instance, serializes races and restricts file permissions',async()=>{
  const directory=await mkdtemp(path.join(os.tmpdir(),'med25-auth-test-'));const file=path.join(directory,'state.json');const env={NODE_ENV:'test',MED25_AUTH_FILE:file};
  const store=authStore(env);assert.equal(await store.read(),null);assert.equal(await store.cas(null,'first'),true);
  assert.equal(await authStore(env).read(),'first');const values=await Promise.all([store.cas('first','second'),authStore(env).cas('first','third')]);assert.equal(values.filter(Boolean).length,1);
  assert.equal((await stat(file)).mode&0o777,0o600);assert.ok(['second','third'].includes(await readFile(file,'utf8')));
});
test('Production refuses ephemeral storage, defaults never allow extra accounts or open redirects',()=>{
  assert.throws(()=>authStore({VERCEL:'1',NODE_ENV:'production',MED25_AUTH_STORAGE:'file'}));assert.throws(()=>authStore({NODE_ENV:'production'}));
  assert.throws(()=>authStore({UPSTASH_REDIS_REST_URL:'http://bad',UPSTASH_REDIS_REST_TOKEN:'test'}));
  for(const v of ['//evil.test','/\\evil.test','https://evil.test','/login','/api/questions'])assert.equal(safeReturnTo(v),'/');
  assert.equal(safeReturnTo('/?exam=term2-cvs'),'/?exam=term2-cvs');assert.equal(passwordProblem('abcdefghijkl')!==null,true);assert.equal(passwordProblem(replacement),null);
  assert.equal(requestToken(new Request('http://test',{headers:{cookie:'unrelated=x; med25_session=abc'}})),'abc');
});
test('Cached PDFs cannot be served when session authorization is denied',async()=>{
  let touched=false;const pdf=createPdfCache({origin:'https://test',authorize:async()=>{throw new Error('not signed in');},caches:{open:async()=>{touched=true;throw Error('should not open');}}});
  await assert.rejects(pdf.load('https://test/study/test.pdf?v=123'),/not signed in/);assert.equal(touched,false);
});
test('Every content API, static content proxy and server-rendered template has an auth guard',async()=>{
  const routes=['bank/summary','questions','questions/by-ids','questions/sprint','final-exam','media','health','tutor/grade'];
  for(const route of routes)assert.match(await readFile(new URL(`../app/api/${route}/route.ts`,import.meta.url),'utf8'),/await requireApiSession\(request\)/);
  const proxy=await readFile(new URL('../proxy.ts',import.meta.url),'utf8');assert.match(proxy,/createAuth\(\)\.session/);assert.match(proxy,/mustChangePassword/);assert.match(proxy,/private, no-store/);
  assert.match(await readFile(new URL('../app/template.tsx',import.meta.url),'utf8'),/await pageSession\(\)/);
  const client=await readFile(new URL('../src/components/AuthForm.tsx',import.meta.url),'utf8');assert.equal(client.includes(STUDENT_ID),false);
});

test('Neon adapter parameterizes account data, uses atomic CAS and never silently falls back',async()=>{
  let stored=null;const calls=[];
  const sqlFactory=()=>({query:async(text,values,options)=>{
    calls.push({text,values,options});
    assert.equal(options.fetchOptions.cache,'no-store');
    if(text.startsWith('SELECT'))return stored===null?[]:[{state_json:stored}];
    if(text.startsWith('INSERT')){if(stored!==null)return [];stored=values[1];return [{record_key:values[0]}];}
    if(text.startsWith('UPDATE')){assert.match(text,/state_json = \$3/);if(stored!==values[2])return [];stored=values[1];return [{record_key:values[0]}];}
    return [];
  }});
  const store=postgresAuthStore({connectionString:'postgresql://fixture:fixture@ep-test.neon.tech/neondb?sslmode=require',sqlFactory});
  assert.equal(await store.read(),null);assert.equal(await store.cas(null,'{"test":"first"}'),true);assert.equal(await store.cas(null,'{"test":"wrong"}'),false);
  assert.equal(await store.cas('{"test":"stale"}','{"test":"wrong"}'),false);assert.equal(await store.cas('{"test":"first"}','{"test":"second"}'),true);assert.equal(await store.read(),'{"test":"second"}');
  assert.ok(calls.every(c=>!c.text.includes('"test"')));
  assert.throws(()=>authStore({NODE_ENV:'production',MED25_DATABASE_URL:'not-a-connection-string'}));
  assert.throws(()=>authStore({NODE_ENV:'production',DATABASE_URL:'postgresql://unrelated-project'}));
  assert.throws(()=>authStore({NODE_ENV:'development',MED25_AUTH_STORAGE:'neon'}));
  assert.throws(()=>postgresAuthStore({connectionString:'postgresql://u:p@example.com/db'}));
  assert.throws(()=>postgresAuthStore({connectionString:'postgresql://u:p@ep-test.neon.tech/db?sslmode=disable'}));
  const failed=postgresAuthStore({connectionString:'postgresql://u:p@ep-test.neon.tech/db',sqlFactory:()=>({query:async()=>{throw Error('credential must not leak');}})});
  await assert.rejects(failed.read(),{message:'Authentication database unavailable.'});
  assert.equal(await authStore({NODE_ENV:'test',MED25_AUTH_STORAGE:'file',MED25_AUTH_FILE:path.join(os.tmpdir(),'med25-missing-fixture-file'),MED25_DATABASE_URL:'ignored-during-tests'}).read(),null);
});
