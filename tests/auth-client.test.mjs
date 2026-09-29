import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSessionCache,SESSION_LEASE_MS} from '../public/med25-auth-cache.mjs';
const session=expiresAt=>({authenticated:true,displayName:'Fixture',isOwner:false,isAdmin:false,mustChangePassword:false,expiresAt});

test('Server-verified hydration and repeated asset access reuse a bounded in-memory lease',async()=>{
  let clock=1000000,calls=0;
  const auth=createSessionCache({now:()=>clock,fetch:async()=>{calls++;return Response.json(session(clock+86400000));}});
  assert.equal(auth.seed(session(clock+86400000)),true);
  for(let i=0;i<50;i++)await auth.require();assert.equal(calls,0);
  clock+=SESSION_LEASE_MS-1;await auth.require();assert.equal(calls,0);
  clock+=1;await Promise.all(Array.from({length:30},()=>auth.require()));assert.equal(calls,1);
  await auth.require();assert.equal(calls,1);
});
test('No stored browser authorization; cold contexts require the server and leases respect session expiry',async()=>{
  let clock=100,calls=0;
  const auth=createSessionCache({now:()=>clock,fetch:async()=>{calls++;return Response.json(session(clock+1000));}});
  await auth.require();assert.equal(calls,1);clock+=1001;await auth.require();assert.equal(calls,2);
  for(const value of [{authenticated:false},session(clock-1),{...session(clock+1000),mustChangePassword:true}])assert.equal(auth.seed(value),false);
  auth.clear();await auth.require();assert.equal(calls,3);
});
test('Logout invalidates pending validation so late responses cannot restore cache access',async()=>{
  let resolve,calls=0;
  const auth=createSessionCache({fetch:()=>{calls++;return new Promise(r=>{resolve=r;});}});
  const pending=auth.require();await Promise.resolve();assert.equal(calls,1);
  auth.clear();resolve(Response.json(session(Date.now()+86400000)));
  await assert.rejects(pending,{code:'AUTH_REQUIRED'});
  const next=auth.require();await Promise.resolve();assert.equal(calls,2);resolve(new Response(null,{status:401}));await assert.rejects(next,{code:'AUTH_REQUIRED'});
});
test('Explicit denial locks cached access; outages never silently authorize or report logout',async()=>{
  let mode=503,denied=0,clock=1000;
  const auth=createSessionCache({now:()=>clock,onUnauthorized:()=>{denied++;},fetch:async()=>new Response(null,{status:mode})});
  auth.seed(session(clock+86400000));clock+=SESSION_LEASE_MS;
  await assert.rejects(auth.require(),{code:'AUTH_UNAVAILABLE'});assert.equal(denied,0);
  mode=401;await assert.rejects(auth.require(),{code:'AUTH_REQUIRED'});assert.equal(denied,1);
  mode=403;await assert.rejects(auth.require(),{code:'AUTH_REQUIRED'});assert.equal(denied,2);
});
test('The auth boundary renders trusted content immediately without focus checks, polling or a loading gate',async()=>{
  const source=await readFile(new URL('../src/components/AuthBoundary.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(source,/setInterval|visibilitychange|requireStudySession|Checking your secure session|setReady|hidden=/);
  assert.match(source,/seedStudySession/);assert.match(source,/BroadcastChannel/);assert.match(source,/med25-auth-required/);assert.match(source,/med25-auth-logout/);
  const worker=await readFile(new URL('../public/med25-sw.js',import.meta.url),'utf8');
  assert.match(worker,/med25-auth-clear/);assert.match(worker,/clearStudyCaches/);
});
