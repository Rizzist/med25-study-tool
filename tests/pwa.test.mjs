import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import sharp from 'sharp';
import {SHELL_CACHE,SHELL_ASSETS,OFFLINE_URL,installPublicShell,removeOldShells,networkPageOrOffline} from '../public/med25-pwa-shell.mjs';
import {clearStudyCaches} from '../public/med25-auth-cache.mjs';
const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
test('Manifest provides stable identity, standalone scope, and real correctly sized any/maskable icons',async()=>{
  const manifest=JSON.parse(await read('public/manifest.webmanifest'));
  assert.equal(manifest.id,'/');assert.equal(manifest.scope,'/');assert.equal(manifest.start_url,'/');assert.equal(manifest.display,'standalone');assert.equal(manifest.prefer_related_applications,false);
  assert.ok(manifest.name&&manifest.short_name&&manifest.theme_color&&manifest.background_color);
  for(const size of [192,512])assert.ok(manifest.icons.some(icon=>icon.sizes===`${size}x${size}`&&icon.purpose==='any'));
  assert.ok(manifest.icons.some(icon=>icon.purpose==='maskable'));
  for(const icon of [...manifest.icons,{src:'/pwa/apple-touch-icon-v1.png',sizes:'180x180'}]){
    const metadata=await sharp(new URL('../public'+icon.src,import.meta.url).pathname).metadata();assert.equal(metadata.format,'png');assert.equal(`${metadata.width}x${metadata.height}`,icon.sizes);assert.equal(metadata.hasAlpha,false,'Maskable/full icons have an opaque background');
  }
});
test('Every PWA bootstrap asset is explicitly public without allowing private study paths',async()=>{
  const proxy=await read('proxy.ts'),layout=await read('app/layout.tsx');
  for(const url of [...SHELL_ASSETS,'/med25-pwa-shell.mjs','/med25-sw.js'])assert.ok(proxy.includes("'"+url+"'"),url);
  assert.match(layout,/manifest:'\/manifest.webmanifest'/);assert.match(layout,/appleWebApp:/);assert.match(layout,/viewportFit:'cover'/);
  assert.ok(SHELL_ASSETS.every(url=>!url.startsWith('/study/')&&!url.startsWith('/api/')&&url!=='/'));
  const offline=await read('public/pwa/offline.html');assert.match(offline,/saved study progress/);assert.doesNotMatch(offline,/script|studentId|session_token|localStorage/);
});
test('Public shell install sends no credentials and fetches no course content',async()=>{
  const put=[],requests=[];
  await installPublicShell({caches:{open:async name=>{assert.equal(name,SHELL_CACHE);return {put:async(url)=>put.push(url)};}},fetch:async(url,options)=>{requests.push(url);assert.equal(options.credentials,'omit');assert.equal(options.cache,'reload');return new Response('public');}});
  assert.deepEqual(requests,SHELL_ASSETS);assert.equal(put.length,SHELL_ASSETS.length);
});
test('Navigation uses network without saving private HTML, and auth denial never falls back to offline',async()=>{
  let cacheRead=false;const caches={open:async()=>{cacheRead=true;throw Error('private HTML must not enter cache');}};
  for(const status of [200,401,403,503]){
    const response=await networkPageOrOffline(new Request('https://med25.test/admin'),{caches,fetch:async()=>new Response('server',{status})});
    assert.equal(response.status,status);assert.equal(await response.text(),'server');assert.equal(cacheRead,false);
  }
});
test('Offline navigation gets only the generic offline document; eviction has a safe inline fallback',async()=>{
  const request=new Request('https://med25.test/admin?private=query'),fetch=async()=>{throw Error('offline');};
  const response=await networkPageOrOffline(request,{fetch,caches:{open:async name=>{assert.equal(name,SHELL_CACHE);return {match:async key=>{assert.equal(key,OFFLINE_URL);return new Response('Generic public offline page');}};}}});assert.equal(await response.text(),'Generic public offline page');
  const fallback=await networkPageOrOffline(request,{fetch,caches:{open:async()=>{throw Error('storage disabled');}}});assert.equal(fallback.status,503);assert.match(fallback.headers.get('content-type'),/text\/html/);assert.doesNotMatch(await fallback.text(),/private=query/);
});
test('App update cleans only old public shells; logout cleans private caches but keeps the public offline screen',async()=>{
  const names=[SHELL_CACHE,'med25-public-shell-old','med25-pdfs-v1','med25-requested-media-v1','med25-json-v1','unrelated'],removed=[];
  const caches={keys:async()=>names,delete:async name=>{removed.push(name);return true;}};
  await removeOldShells(caches);assert.deepEqual(removed,['med25-public-shell-old']);removed.length=0;
  const before=globalThis.caches;globalThis.caches=caches;
  try{await clearStudyCaches();assert.deepEqual(removed,['med25-pdfs-v1','med25-requested-media-v1','med25-json-v1']);}finally{if(before===undefined)delete globalThis.caches;else globalThis.caches=before;}
});
test('Service worker handles only safe same-origin GETs; PDF navigations retain auth-aware caching',async()=>{
  const listeners=new Map();let pages=0,pdfs=0;
  const code=(await read('public/med25-sw.js')).replace(/^import .*;$/gm,'');
  vm.runInNewContext(code,{URL,Response,caches:{},fetch:()=>{},installPublicShell:async()=>{},removeOldShells:async()=>{},clearStudyCaches:async()=>{},requireStudySession:async()=>{},denyStudySession:()=>{},loadCachedPdf:async()=>{pdfs++;return {response:new Response('PDF')};},pdfRangeResponse:async response=>response,networkPageOrOffline:async()=>{pages++;return new Response('offline');},self:{location:{origin:'https://med25.test'},addEventListener:(name,callback)=>listeners.set(name,callback)}});
  const handler=listeners.get('fetch');
  async function dispatch(path,{method='GET',mode='navigate'}={}){let handled=false,task;handler({request:{url:path,method,mode,headers:new Headers()},respondWith(p){handled=true;task=p;}});if(task)await task;return handled;}
  assert.equal(await dispatch('https://external.test/'),false);assert.equal(await dispatch('https://med25.test/api/activity',{method:'POST'}),false);assert.equal(await dispatch('https://med25.test/api/admin/activity',{mode:'cors'}),false);
  assert.equal(await dispatch('https://med25.test/admin'),true);assert.equal(pages,1);
  assert.equal(await dispatch('https://med25.test/study/source.pdf'),true);assert.equal(pdfs,1);assert.equal(pages,1);
});
test('Single registration and user-controlled installation never force a reload during an exam',async()=>{
  const provider=await read('src/components/PwaProvider.tsx');assert.match(provider,/beforeinstallprompt/);assert.match(provider,/Add to Home Screen/);assert.match(provider,/prompt\.prompt\(\)/);assert.doesNotMatch(provider,/location\.reload|setInterval|requestPermission/);
  for(const file of ['src/components/AuthBoundary.tsx','src/components/AuthForm.tsx','app/page.tsx'])assert.doesNotMatch(await read(file),/serviceWorker\.register/);
});
