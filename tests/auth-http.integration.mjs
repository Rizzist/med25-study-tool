// Run after npm run build. Uses an isolated credential file, never the student's account.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp} from 'node:fs/promises';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';
const STUDENT_ID='00000000001'; // Synthetic fixture, not the owner's private configuration.

const directory=await mkdtemp(path.join(os.tmpdir(),'med25-auth-http-'));
const DISPLAY_NAME='HTTP Fixture';
const env={...process.env,NODE_ENV:'production',MED25_STUDENT_ID:STUDENT_ID,MED25_AUTH_ACCOUNTS:JSON.stringify([{id:STUDENT_ID,name:DISPLAY_NAME}]),MED25_AUTH_STORAGE:'file',MED25_AUTH_FILE:path.join(directory,'state.json')};
for(const key of ['VERCEL','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','KV_REST_API_URL','KV_REST_API_TOKEN'])delete env[key];
const port=3911,origin=`http://localhost:${port}`;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
let log='';child.stdout.on('data',v=>{log+=v;});child.stderr.on('data',v=>{log+=v;});
const get=(url,cookie,extra={})=>fetch(origin+url,{redirect:'manual',headers:{...(cookie?{cookie}:{}),...extra}});
const post=(url,body,cookie,extra={})=>fetch(origin+url,{method:'POST',redirect:'manual',headers:{origin,'content-type':'application/json','x-med25-auth':'1',...(cookie?{cookie}:{}),...extra},body:JSON.stringify(body)});
const cookieOf=response=>{const raw=response.headers.get('set-cookie');assert.ok(raw);assert.match(raw,/HttpOnly/i);assert.match(raw,/Secure/i);assert.match(raw,/SameSite=strict/i);return raw.split(';')[0];};
try{
  let ready=false;
  for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('Test server failed: '+log);try{const r=await get('/login');if(r.status===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,'Test server must start');
  const anonymous=await get('/?exam=term2-cvs');assert.equal(anonymous.status,307);assert.match(anonymous.headers.get('location'),/\/login/);
  for(const url of ['/api/bank/summary','/api/questions?exam=term2-cvs','/study/runtime/catalog.json','/study/religion/past-papers/original-40.pdf','/study/school-map/campus.json','/_next/image?url=%2Fstudy%2Fprivate.png&w=640&q=75'])assert.equal((await get(url)).status,401,url);
  assert.equal((await get('/study/religion/past-papers/original-40.pdf',null,{range:'bytes=0-100'})).status,401);
  assert.equal((await get('/?exam=term2-cvs',null,{rsc:'1','x-middleware-subrequest':'proxy:proxy:proxy:proxy:proxy'})).status,307);
  const credentials={username:STUDENT_ID,password:STUDENT_ID};
  assert.equal((await post('/api/auth/login',credentials,null,{origin:'https://evil.invalid'})).status,403);
  const unsupported=await post('/api/auth/login',{...credentials,username:'not-the-student'});
  assert.equal(unsupported.status,401);assert.equal(unsupported.headers.get('set-cookie'),null);
  const unsupportedError=await unsupported.json();assert.equal(unsupportedError.code,'UNSUPPORTED_ACCOUNT');assert.match(unsupportedError.error,/not supported/);assert.equal(unsupportedError.error.includes(STUDENT_ID),false);
  const wrongPassword=await post('/api/auth/login',{...credentials,password:'wrong-password'});
  assert.equal(wrongPassword.status,401);assert.equal((await wrongPassword.json()).code,'INCORRECT_PASSWORD');
  const first=await post('/api/auth/login',credentials);assert.equal(first.status,200);assert.equal((await first.json()).next,'/change-password');const limited=cookieOf(first);
  for(const url of ['/api/bank/summary','/study/runtime/catalog.json','/study/religion/past-papers/original-40.pdf'])assert.equal((await get(url,limited)).status,403,url);
  assert.match((await get('/',limited)).headers.get('location'),/\/change-password/);
  const passwordPage=await (await get('/change-password',limited)).text();assert.match(passwordPage,/Set your private password/);assert.match(passwordPage,/Full name/);assert.match(passwordPage,/HTTP Fixture/);
  assert.equal((await post('/api/auth/password',{password:STUDENT_ID,confirmation:STUDENT_ID},limited)).status,400);
  const testPassword='HTTP-fixture-only-password!672';
  assert.equal((await post('/api/auth/password',{password:testPassword,confirmation:testPassword,displayName:''},limited)).status,400);
  const change=await post('/api/auth/password',{password:testPassword,confirmation:testPassword,displayName:DISPLAY_NAME},limited);assert.equal(change.status,200);const full=cookieOf(change);
  assert.equal((await get('/api/auth/session',limited)).status,401);
  assert.equal((await (await get('/api/auth/session',full)).json()).displayName,DISPLAY_NAME);
  const page=await get('/',full);assert.equal(page.status,200);assert.match(page.headers.get('cache-control'),/no-store/);assert.doesNotMatch(await page.text(),/id="auth-title"/,'Authorized page must not be a cached login form');
  const summary=await get('/api/bank/summary',full);assert.equal(summary.status,200);assert.ok(await summary.json());
  assert.equal((await get('/study/runtime/catalog.json',full)).status,200);
  const pdf=await fetch(origin+'/study/religion/past-papers/original-40.pdf',{method:'HEAD',headers:{cookie:full}});assert.equal(pdf.status,200);assert.match(pdf.headers.get('cache-control'),/no-store/);
  assert.equal((await post('/api/auth/login',credentials)).status,401);
  const returning=await post('/api/auth/login',{username:STUDENT_ID,password:testPassword,next:'//evil.invalid'});assert.equal(returning.status,200);assert.equal((await returning.json()).next,'/');const returningCookie=cookieOf(returning);
  assert.equal((await post('/api/auth/logout',{},returningCookie)).status,200);assert.equal((await get('/api/auth/session',returningCookie)).status,401);assert.equal((await get('/study/runtime/catalog.json',returningCookie)).status,401);
  console.log('PASS: production HTTP auth gate, forced change, PDF/API/static protection, secure cookies, password rotation, CSRF checks and logout. Student credential store untouched.');
}finally{child.kill('SIGTERM');if(child.exitCode===null)await once(child,'exit');}
