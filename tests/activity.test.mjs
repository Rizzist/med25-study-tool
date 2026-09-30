import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createActivity,activityStore,RETENTION_MS,MAX_VISITS} from '../src/lib/server/activity.mjs';
import {createActivityMeter,IDLE_MS,REPORT_INTERVAL_MS} from '../src/lib/client/activity-meter.mjs';
import {authStore} from '../src/lib/server/auth-store.mjs';

const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
function fixture(){
  let time=1_000_000;const values=new Map();let reads=0,writes=0;
  const accounts=[{userId:'40000000001',displayName:'Owner',active:true},{userId:'40000000002',displayName:'Student',active:true}];
  const auth={session:async token=>token==='expired'?null:{...accounts[token==='owner'?0:1],isOwner:token==='owner',role:token,mustChangePassword:token==='limited'},listAccounts:async()=>accounts};
  const storeFor=key=>({read:async()=>{reads++;return values.get(key)??null;},cas:async(before,after)=>{if((values.get(key)??null)!==before)return false;values.set(key,after);writes++;return true;}});
  const service=createActivity({auth,storeFor,now:()=>time});
  return {service,values,storeFor,advance:ms=>time+=ms,readCount:()=>reads,writeCount:()=>writes};
}
test('Activity owner-only access is enforced before any telemetry reads',async()=>{
  const f=fixture();for(const token of ['student','admin','moderator','limited'])await assert.rejects(f.service.report(token),{status:403,code:'OWNER_REQUIRED'});
  await assert.rejects(f.service.report('expired'),{status:401});assert.equal(f.readCount(),0);
});
test('Reports accept authenticated identity only, reject arbitrary fields and limited/expired sessions',async()=>{
  const f=fixture(),body={id:id(1),sequence:1,activeMs:0};
  for(const key of ['userId','path','answer','displayName','startedAt'])await assert.rejects(f.service.record('student',{...body,[key]:'private'}),{status:400});
  for(const payload of [{...body,id:'../other'},{...body,activeMs:Infinity},{...body,sequence:-1},{...body,activeMs:1.5},null])await assert.rejects(f.service.record('student',payload),{status:400});
  await assert.rejects(f.service.record('limited',body),{status:403});await assert.rejects(f.service.record('expired',body),{status:401});
  assert.equal(f.writeCount(),0);await f.service.record('student',body);assert.equal(f.values.has('40000000002'),true);assert.equal(f.values.has('40000000001'),false);
});
test('Durations are server bounded; duplicate/out-of-order retries never inflate time or last seen',async()=>{
  const f=fixture();await f.service.record('student',{id:id(1),sequence:1,activeMs:100_000});
  f.advance(10_000);await f.service.record('student',{id:id(1),sequence:2,activeMs:90_000});
  let row=(await f.service.report('owner')).users.find(u=>u.userId==='40000000002');assert.equal(row.activeMs,10_000);const last=row.lastSeenAt,writes=f.writeCount();
  f.advance(5_000);await f.service.record('student',{id:id(1),sequence:2,activeMs:999_999});await f.service.record('student',{id:id(1),sequence:1,activeMs:999_999});assert.equal(f.writeCount(),writes);
  row=(await f.service.report('owner')).users.find(u=>u.userId==='40000000002');assert.equal(row.lastSeenAt,last);assert.equal(row.activeMs,10_000);
  assert.equal('sequence' in row.visits[0],false);
});
test('Retention and visit caps are bounded; stale records are pruned on access',async()=>{
  const f=fixture();for(let i=1;i<=MAX_VISITS+5;i++){f.advance(300_001);await f.service.record('student',{id:id(i),sequence:1,activeMs:0});}
  assert.equal((await f.service.report('owner')).users.find(u=>u.userId==='40000000002').visits.length,MAX_VISITS);
  f.advance(RETENTION_MS+1);assert.equal((await f.service.report('owner')).users.every(u=>u.visits.length===0),true);
  assert.equal(JSON.parse(f.values.get('40000000002')).visits.length,0);
});
test('Excess activity reports are throttled and cannot grow storage without bounds',async()=>{
  const f=fixture();for(let i=1;i<=30;i++)await f.service.record('student',{id:id(i),sequence:1,activeMs:0});
  await assert.rejects(f.service.record('student',{id:id(31),sequence:1,activeMs:0}),{status:429});
  assert.equal(f.writeCount(),30);f.advance(300_001);await f.service.record('student',{id:id(31),sequence:1,activeMs:0});
});
test('Concurrent visits are retained and corrupted activity is never silently overwritten',async()=>{
  const f=fixture();await Promise.all([f.service.record('student',{id:id(1),sequence:1,activeMs:0}),f.service.record('student',{id:id(2),sequence:1,activeMs:0})]);
  assert.equal((await f.service.report('owner')).users[0].visits.length,2);
  f.values.set('40000000002','{"schema":999}');const before=f.writeCount();await assert.rejects(f.service.record('student',{id:id(3),sequence:1,activeMs:0}));assert.equal(f.writeCount(),before);
});
test('Local activity and auth records are isolated even with an explicit auth file',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'med25-activity-')),env={NODE_ENV:'test',MED25_AUTH_STORAGE:'file',MED25_AUTH_FILE:path.join(dir,'state.json')};
  const auth=authStore(env),activity=activityStore('40000000001',env);await auth.cas(null,'{"auth":"untouched"}');await activity.cas(null,'{"activity":"separate"}');
  assert.equal(await auth.read(),'{"auth":"untouched"}');assert.equal(await activity.read(),'{"activity":"separate"}');assert.throws(()=>activityStore('../../state',env));
});
test('Meter excludes hidden/blurred time, idle time and browser sleep; actions contain no content',()=>{
  let now=0;const meter=createActivityMeter({now:()=>now});now=30_000;assert.equal(meter.snapshot(),30_000);
  meter.setActive(false);now+=600_000;assert.equal(meter.snapshot(),30_000);meter.setActive(true);now+=10_000;meter.interact();now+=500_000;
  assert.equal(meter.snapshot(),40_000+IDLE_MS);meter.interact();now+=10_000;assert.equal(meter.snapshot(),50_000+IDLE_MS);
  now-=10_000;assert.equal(meter.snapshot(),50_000+IDLE_MS,'Clock rollback never subtracts time');
  assert.equal(REPORT_INTERVAL_MS,300_000);
});
test('Tracking stays separate from authentication, discloses collection, and never intercepts answers',async()=>{
  const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
  const tracker=await read('src/components/ActivityTracker.tsx');assert.doesNotMatch(tracker,/\/api\/auth\/session|localStorage|event\.key|event\.target|location\./);
  assert.match(await read('src/components/AuthForm.tsx'),/owner can see visit times/);
  assert.match(await read('src/components/StudyShell.tsx'),/Activity privacy/);
  assert.match(await read('app/api/activity/route.ts'),/await readAuthBody\(request\)/);
  assert.match(await read('app/api/admin/activity/route.ts'),/\.report\(requestToken\(request\)\)/);
});
