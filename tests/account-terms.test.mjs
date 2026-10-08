import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createAuth,hashPassword,verifyPassword} from '../src/lib/server/auth-core.mjs';
import {LEGACY_ACADEMIC_TERM_ANCHOR} from '../src/lib/academic-term.mjs';

// These accounts and tokens are synthetic. Every test injects its store,
// administrator configuration, and clock; no deployed account store is used.
const IDS={owner:'00000000071',admin:'00000000072',moderator:'00000000073',student:'00000000074',archived:'00000000075'};
const TOKENS=Object.fromEntries(Object.keys(IDS).map((role,index)=>[role,Buffer.alloc(32,index+1).toString('base64url')]));
const BASE_TIME=Date.parse('2026-10-08T12:00:00Z');
const EXPIRY=Date.parse('2035-01-01T00:00:00Z');
const FIXTURE_PASSWORD='Synthetic-term-test-passphrase!';
const FIXTURE_HASH=await hashPassword(FIXTURE_PASSWORD);
const digest=value=>createHash('sha256').update(value).digest('hex');
const copy=value=>structuredClone(value);

function fixtureState({legacy=false}={}){
  return {
    schema:2,
    accounts:Object.fromEntries(Object.entries(IDS).map(([role,userId])=>[userId,{
      userId,
      displayName:`Fixture ${role}`,
      role:role==='admin'?'admin':'student',
      moderator:role==='moderator',
      active:role!=='archived',
      passwordHash:FIXTURE_HASH,
      mustChangePassword:false,
      sessions:[{hash:digest(TOKENS[role]),limited:false,expiresAt:EXPIRY}],
      attempts:{start:BASE_TIME-1000,count:2},
      createdBy:{userId:IDS.owner,displayName:'Original Fixture Owner'},
      createdAt:Date.parse('2026-03-04T12:00:00Z'),
      ...(legacy?{}:{termAnchor:copy(LEGACY_ACADEMIC_TERM_ANCHOR)}),
    }])),
    unsupportedAttempts:{start:BASE_TIME-2000,count:1},
  };
}

function memory(state){
  let value=state===null?null:JSON.stringify(state),writes=0,attempts=0;
  return {
    read:async()=>value,
    cas:async(before,after)=>{attempts++;if(value!==before)return false;value=after;writes++;return true;},
    get writes(){return writes;},
    get attempts(){return attempts;},
  };
}

function authFor(store,clock={value:BASE_TIME}){
  return createAuth({store,now:()=>clock.value,accounts:[{id:IDS.owner,name:'Fixture owner'}],adminId:IDS.owner});
}

const readState=async store=>JSON.parse(await store.read());
const listedAccount=async(auth,userId,token=TOKENS.owner)=>(await auth.listAccounts(token)).find(account=>account.userId===userId);

test('Legacy migration adds the fixed anchor to every account and preserves credentials, sessions, roles, and creation history',async()=>{
  const original=fixtureState({legacy:true}),store=memory(original),auth=authFor(store);
  const accounts=await auth.listAccounts(TOKENS.owner);
  assert.equal(accounts.length,Object.keys(IDS).length);
  for(const account of accounts){
    assert.equal(account.currentTerm,3);
    assert.deepEqual(account.termAnchor,LEGACY_ACADEMIC_TERM_ANCHOR);
  }
  const migrated=await readState(store);
  for(const [id,before] of Object.entries(original.accounts)){
    const {termAnchor,...preserved}=migrated.accounts[id];
    assert.deepEqual(termAnchor,LEGACY_ACADEMIC_TERM_ANCHOR,id);
    assert.deepEqual(preserved,before,`Only term metadata may change for ${id}`);
  }
  assert.deepEqual(migrated.unsupportedAttempts,original.unsupportedAttempts);
  assert.equal(store.writes,1);
  assert.equal((await auth.session(TOKENS.student)).userId,IDS.student,'An existing full session survives migration');
  assert.equal(await auth.session(TOKENS.archived),null,'Migration cannot reactivate removed accounts');
  assert.equal(await verifyPassword(FIXTURE_PASSWORD,migrated.accounts[IDS.student].passwordHash),true);
  for(let count=0;count<3;count++)await auth.listAccounts(TOKENS.owner);
  assert.equal(store.writes,1,'Reading migrated accounts does not write again');
});

test('A first read years later migrates to the fixed cohort anchor, not to the deployment semester',async()=>{
  const store=memory(fixtureState({legacy:true})),clock={value:Date.parse('2028-02-10T12:00:00Z')},auth=authFor(store,clock);
  const student=await listedAccount(auth,IDS.student);
  assert.equal(student.currentTerm,6);
  assert.deepEqual(student.termAnchor,{term:3,semesterIndex:4053});
});

test('Schema-one migration keeps the existing password and session and does not invent creation history',async()=>{
  const original={schema:1,userId:IDS.owner,passwordHash:FIXTURE_HASH,mustChangePassword:false,sessions:[{hash:digest(TOKENS.owner),limited:false,expiresAt:EXPIRY}],attempts:{start:BASE_TIME-1000,count:3}};
  const store=memory(original),auth=authFor(store);
  assert.equal((await auth.session(TOKENS.owner)).userId,IDS.owner);
  const persisted=(await readState(store)).accounts[IDS.owner];
  for(const key of ['userId','passwordHash','mustChangePassword','sessions','attempts'])assert.deepEqual(persisted[key],original[key],key);
  assert.deepEqual(persisted.termAnchor,LEGACY_ACADEMIC_TERM_ANCHOR);
  assert.equal(persisted.createdBy,undefined);
  assert.equal(persisted.createdAt,undefined);
  const managed=await listedAccount(auth,IDS.owner);
  assert.equal(managed.currentTerm,3);
  assert.equal(managed.createdBy,null);
  assert.equal(managed.createdAt,null);
});

test('New students use the selected current term and advance at the next Tehran boundary',async()=>{
  const store=memory(fixtureState()),clock={value:Date.parse('2026-08-31T20:29:59.999Z')},auth=authFor(store,clock),userId='40000000071';
  const created=await auth.addAccount(TOKENS.owner,userId,'Selected Term Student',7);
  assert.equal(created.currentTerm,7);
  assert.deepEqual(created.termAnchor,{term:7,semesterIndex:4052});
  assert.equal(created.mustChangePassword,true);
  assert.deepEqual(created.createdBy,{userId:IDS.owner,displayName:'Fixture owner'});
  assert.equal(created.createdAt,clock.value);
  const initial=(await readState(store)).accounts[userId];
  clock.value=Date.parse('2026-08-31T20:30:00.000Z');
  assert.equal((await listedAccount(auth,userId)).currentTerm,8);
  clock.value=Date.parse('2027-01-31T20:29:59.999Z');
  assert.equal((await listedAccount(auth,userId)).currentTerm,8);
  clock.value++;
  assert.equal((await listedAccount(auth,userId)).currentTerm,9);
  assert.deepEqual((await readState(store)).accounts[userId],initial,'Automatic advancement is derived without rewriting the account');
});

test('Omitted new-student terms default to the current cohort term and anchor the current semester',async()=>{
  const clock={value:Date.parse('2027-03-01T12:00:00Z')},store=memory(fixtureState()),auth=authFor(store,clock);
  const created=await auth.addAccount(TOKENS.owner,'40000000072','Default Term Student');
  assert.equal(created.currentTerm,4);
  assert.deepEqual(created.termAnchor,{term:4,semesterIndex:4054});
  assert.deepEqual((await readState(store)).accounts[IDS.owner].termAnchor,LEGACY_ACADEMIC_TERM_ANCHOR);
});

test('Name-only edits preserve the anchor; explicit term edits reanchor without changing credentials or history',async()=>{
  const store=memory(fixtureState()),clock={value:Date.parse('2027-02-01T12:00:00Z')},auth=authFor(store,clock);
  const before=copy((await readState(store)).accounts[IDS.student]);
  await auth.updateAccount(TOKENS.owner,IDS.student,'Renamed Fixture');
  assert.deepEqual((await readState(store)).accounts[IDS.student].termAnchor,before.termAnchor);
  assert.equal((await listedAccount(auth,IDS.student)).currentTerm,4);
  await auth.updateAccount(TOKENS.owner,IDS.student,'Assigned Fixture',9);
  const after=(await readState(store)).accounts[IDS.student];
  assert.deepEqual(after,{...before,displayName:'Assigned Fixture',termAnchor:{term:9,semesterIndex:4054}});
  assert.equal((await listedAccount(auth,IDS.student)).currentTerm,9);
  assert.equal((await auth.session(TOKENS.student)).displayName,'Assigned Fixture');
  clock.value=Date.parse('2027-09-01T12:00:00Z');
  assert.equal((await listedAccount(auth,IDS.student)).currentTerm,10);
});

test('Restoring without a term preserves academic progress and attribution; an explicit term reanchors the restored account',async()=>{
  const state=fixtureState();state.accounts[IDS.student].termAnchor={term:2,semesterIndex:4052};
  const store=memory(state),auth=authFor(store),initial=copy(state.accounts[IDS.student]);
  // Restorable IDs follow the same student ID validation as newly added accounts.
  const userId='40000000073',raw=await store.read(),prepared=await readState(store);
  prepared.accounts[userId]={...prepared.accounts[IDS.student],userId};
  await store.cas(raw,JSON.stringify(prepared));
  await auth.removeAccount(TOKENS.owner,userId);
  const restored=await auth.addAccount(TOKENS.owner,userId,'Restored Fixture');
  assert.equal(restored.currentTerm,3);
  assert.deepEqual(restored.termAnchor,initial.termAnchor);
  assert.deepEqual(restored.createdBy,initial.createdBy);
  assert.equal(restored.createdAt,initial.createdAt);
  assert.equal(restored.active,true);
  assert.equal(restored.mustChangePassword,true);
  const persisted=(await readState(store)).accounts[userId];
  assert.deepEqual(persisted.sessions,[]);
  assert.equal(await verifyPassword(userId,persisted.passwordHash),true);
  await auth.removeAccount(TOKENS.owner,userId);
  const reassigned=await auth.addAccount(TOKENS.owner,userId,'Reassigned Fixture',7);
  assert.equal(reassigned.currentTerm,7);
  assert.deepEqual(reassigned.termAnchor,{term:7,semesterIndex:4053});
  assert.deepEqual(reassigned.createdBy,initial.createdBy);
  assert.equal(reassigned.createdAt,initial.createdAt);
});

test('Password resets preserve the academic anchor and current term',async()=>{
  const store=memory(fixtureState()),auth=authFor(store),before=(await readState(store)).accounts[IDS.student];
  await auth.resetAccount(TOKENS.owner,IDS.student);
  const after=(await readState(store)).accounts[IDS.student];
  assert.deepEqual(after.termAnchor,before.termAnchor);
  assert.deepEqual(after.createdBy,before.createdBy);
  assert.equal((await listedAccount(auth,IDS.student)).currentTerm,3);
});

test('Invalid explicit terms reject additions and updates without silently defaulting or changing state',async()=>{
  const store=memory(fixtureState()),auth=authFor(store),before=await store.read();
  for(const currentTerm of [null,'','3',0,-1,31,3.5,NaN,Infinity,true,[],{},Number.MAX_SAFE_INTEGER]){
    await assert.rejects(auth.addAccount(TOKENS.owner,'40000000074','Invalid Term Fixture',currentTerm),{status:400,code:'INVALID_ACADEMIC_TERM'});
    await assert.rejects(auth.updateAccount(TOKENS.owner,IDS.student,'Invalid Term Fixture',currentTerm),{status:400,code:'INVALID_ACADEMIC_TERM'});
    assert.equal(await store.read(),before,`Rejected ${String(currentTerm)} must not modify the account store`);
  }
});

test('Term assignment follows existing owner, administrator, moderator, and student permissions',async()=>{
  const store=memory(fixtureState()),auth=authFor(store);
  assert.equal((await auth.addAccount(TOKENS.admin,'40000000075','Admin Added Fixture',8)).currentTerm,8);
  await auth.updateAccount(TOKENS.admin,IDS.student,'Admin Updated Fixture',6);
  assert.equal((await listedAccount(auth,IDS.student)).currentTerm,6);
  assert.equal((await auth.addAccount(TOKENS.moderator,'40000000076','Moderator Added Fixture',5)).currentTerm,5);
  for(const target of [IDS.owner,IDS.admin,IDS.moderator]){
    await assert.rejects(auth.updateAccount(TOKENS.admin,target,'Unauthorized Fixture',9),{status:403,code:'OWNER_REQUIRED'});
  }
  await assert.rejects(auth.updateAccount(TOKENS.moderator,IDS.student,'Unauthorized Fixture',9),{status:403,code:'ADMIN_REQUIRED'});
  await assert.rejects(auth.updateAccount(TOKENS.student,IDS.student,'Unauthorized Fixture',9),{status:403,code:'ADMIN_REQUIRED'});
  await assert.rejects(auth.addAccount(TOKENS.student,'40000000077','Unauthorized Fixture',9),{status:403,code:'ADMIN_REQUIRED'});
  await auth.removeAccount(TOKENS.owner,'40000000076');
  await assert.rejects(auth.addAccount(TOKENS.moderator,'40000000076','Unauthorized Restore',9),{code:'ACCOUNT_EXISTS'});
  await auth.updateAccount(TOKENS.owner,IDS.admin,'Owner Updated Admin',10);
  assert.equal((await listedAccount(auth,IDS.admin)).currentTerm,10);
  const moderatorView=await listedAccount(auth,IDS.student,TOKENS.moderator);
  assert.equal(moderatorView.currentTerm,6);
  assert.equal(moderatorView.sessionCount,null);
});

test('Limited sessions cannot assign terms even when their account has a management role',async()=>{
  const state=fixtureState();state.accounts[IDS.owner].sessions[0].limited=true;
  const store=memory(state),auth=authFor(store),before=await store.read();
  await assert.rejects(auth.addAccount(TOKENS.owner,'40000000078','Limited Fixture',7),{code:'PASSWORD_CHANGE_REQUIRED'});
  await assert.rejects(auth.updateAccount(TOKENS.owner,IDS.student,'Limited Fixture',7),{code:'PASSWORD_CHANGE_REQUIRED'});
  assert.equal(await store.read(),before);
});

test('Concurrent legacy migrations use CAS and converge on one idempotent write',async()=>{
  const original=fixtureState({legacy:true}),base=memory(original);
  let entrants=0,release;
  const barrier=new Promise(resolve=>{release=resolve;});
  const store={read:base.read,cas:async(before,after)=>{
    entrants++;
    if(entrants<=2){if(entrants===2)release();await barrier;}
    return base.cas(before,after);
  }};
  const first=authFor(store),second=authFor(store);
  const results=await Promise.all([first.listAccounts(TOKENS.owner),second.listAccounts(TOKENS.owner)]);
  assert.deepEqual(results[0],results[1]);
  assert.equal(base.attempts,2,'Both instances tried the same stale state');
  assert.equal(base.writes,1,'The losing instance observes the completed migration');
  for(const account of Object.values((await readState(base)).accounts))assert.deepEqual(account.termAnchor,LEGACY_ACADEMIC_TERM_ANCHOR);
  await first.listAccounts(TOKENS.owner);await second.session(TOKENS.student);
  assert.equal(base.attempts,2,'Subsequent reads never rewrite migrated metadata');
});

test('A losing migration preserves a concurrent term assignment, credential change, and session revocation',async()=>{
  const base=memory(fixtureState({legacy:true}));let intercept=true,concurrent;
  const store={read:base.read,cas:async(before,after)=>{
    if(intercept){
      intercept=false;concurrent=JSON.parse(before);
      Object.assign(concurrent.accounts[IDS.student],{displayName:'Concurrent Fixture',passwordHash:'concurrently-replaced-fixture-hash',sessions:[],termAnchor:{term:8,semesterIndex:4053}});
      concurrent.accounts[IDS.student].createdBy.displayName='Preserved Creator Update';
      await base.cas(before,JSON.stringify(concurrent));
    }
    return base.cas(before,after);
  }};
  const auth=authFor(store),student=await listedAccount(auth,IDS.student);
  assert.equal(student.currentTerm,8);
  assert.deepEqual((await readState(base)).accounts[IDS.student],concurrent.accounts[IDS.student]);
  assert.equal(await auth.session(TOKENS.student),null,'A revoked session cannot reappear after migration retries');
  for(const [id,account] of Object.entries((await readState(base)).accounts)){
    if(id!==IDS.student)assert.deepEqual(account.termAnchor,LEGACY_ACADEMIC_TERM_ANCHOR);
  }
});

test('A term edit rechecks administrator permissions after a concurrent demotion',async()=>{
  const base=memory(fixtureState());let intercept=null;
  const store={read:base.read,cas:async(before,after)=>{if(intercept){const action=intercept;intercept=null;await action();}return base.cas(before,after);}};
  const auth=authFor(store),before=copy((await readState(base)).accounts[IDS.student]);
  intercept=()=>auth.setAccountRole(TOKENS.owner,IDS.admin,'student');
  await assert.rejects(auth.updateAccount(TOKENS.admin,IDS.student,'Concurrent Unauthorized Fixture',8),{status:403,code:'ADMIN_REQUIRED'});
  assert.deepEqual((await readState(base)).accounts[IDS.student],before);
});

test('Malformed persisted academic metadata fails closed without overwriting the store',async()=>{
  for(const termAnchor of [null,{},[],{term:3},{semesterIndex:4053},{term:0,semesterIndex:4053},{term:3,semesterIndex:-1},{term:'3',semesterIndex:4053},{term:3,semesterIndex:4053.5}]){
    const state=fixtureState();state.accounts[IDS.student].termAnchor=termAnchor;
    const raw=JSON.stringify(state),store={read:async()=>raw,cas:async()=>assert.fail('Malformed metadata must never be overwritten')};
    await assert.rejects(authFor(store).listAccounts(TOKENS.owner),/Invalid authentication state/);
  }
});
