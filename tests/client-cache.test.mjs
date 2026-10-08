import test from 'node:test';
import assert from 'node:assert/strict';
import {seedStudySession} from '../public/med25-auth-cache.mjs';

// A Cache Storage and fetch double: records network calls and serves a mutable "deployed" file.
const stores=new Map(),calls=[];
let deployed={body:'{"v":1}',etag:'"one"'};
globalThis.caches={async open(){return {
  async match(key){const entry=stores.get(typeof key==='string'?key:key.url);return entry?new Response(entry.body,{headers:entry.headers}):undefined;},
  async put(key,response){stores.set(typeof key==='string'?key:key.url,{body:await response.text(),headers:Object.fromEntries(response.headers)});},
  async keys(){return [...stores.keys()];},async delete(key){stores.delete(key);},
};}};
globalThis.window={location:{origin:'https://med25.test'},dispatchEvent(){}};
globalThis.location=globalThis.window.location;
globalThis.fetch=async(url,init={})=>{
  const path=new URL(url).pathname;calls.push(path);
  if(init.headers?.['if-none-match']===deployed.etag)return new Response(null,{status:304});
  return new Response(deployed.body,{status:200,headers:{'content-type':'application/json',etag:deployed.etag}});
};
const load=async build=>{process.env.NEXT_PUBLIC_MED25_BUILD=build;return import('../src/lib/mcq/client-cache.ts?build='+build);};
seedStudySession({authenticated:true,mustChangePassword:false,expiresAt:Date.now()+3600e3});
const network=path=>calls.filter(call=>call===path).length;

test('Within one deploy a cached /study/ file is served without any network request',async()=>{
  const {cachedJson}=await load('deploy-a');
  assert.deepEqual(await cachedJson('/study/cvs-past-papers/topic-map.json'),{v:1});
  const before=network('/study/cvs-past-papers/topic-map.json');
  assert.deepEqual(await cachedJson('/study/cvs-past-papers/topic-map.json'),{v:1});
  assert.equal(network('/study/cvs-past-papers/topic-map.json'),before,'second read must not touch the network');
});
test('A new deploy revalidates once, then serves the refreshed copy from cache',async()=>{
  deployed={body:'{"v":2}',etag:'"two"'};
  const {cachedJson}=await load('deploy-b');
  const before=network('/study/cvs-past-papers/topic-map.json');
  assert.deepEqual(await cachedJson('/study/cvs-past-papers/topic-map.json'),{v:2});
  assert.equal(network('/study/cvs-past-papers/topic-map.json'),before+1);
  assert.deepEqual(await cachedJson('/study/cvs-past-papers/topic-map.json'),{v:2});
  assert.equal(network('/study/cvs-past-papers/topic-map.json'),before+1);
});
test('An unchanged file after a deploy is re-stamped from a 304 and then served locally',async()=>{
  const {cachedJson}=await load('deploy-c');
  const before=network('/study/cvs-past-papers/topic-map.json');
  assert.deepEqual(await cachedJson('/study/cvs-past-papers/topic-map.json'),{v:2});
  assert.deepEqual(await cachedJson('/study/cvs-past-papers/topic-map.json'),{v:2});
  assert.equal(network('/study/cvs-past-papers/topic-map.json'),before+1);
});
test('Explicit revalidation and non-/study/ URLs keep checking the network',async()=>{
  const {cachedJson}=await load('deploy-c');
  const before=network('/study/cvs-past-papers/topic-map.json');
  await cachedJson('/study/cvs-past-papers/topic-map.json',true);
  assert.equal(network('/study/cvs-past-papers/topic-map.json'),before+1);
  await cachedJson('/api/final-exam?exam=x');await cachedJson('/api/final-exam?exam=x');
  assert.equal(network('/api/final-exam'),2);
});
test('Without a build id (local dev) every unversioned read revalidates',async()=>{
  const {cachedJson}=await load('');
  const before=network('/study/cvs-past-papers/index.json');
  await cachedJson('/study/cvs-past-papers/index.json');await cachedJson('/study/cvs-past-papers/index.json');
  assert.equal(network('/study/cvs-past-papers/index.json'),before+2);
});
