import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PDFDocument,PDFName,degrees} from 'pdf-lib';
import {renderOriginalPdf} from '../src/lib/original-pdf/render.mjs';

const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map();
function load(file){
 if(modules.has(file))return modules.get(file).exports;
 if(file.endsWith('.mjs'))return require(file);
 const m={exports:{}};modules.set(file,m);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const local=id=>{if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);return load([base,base+'.ts',base+'.tsx'].find(p=>fs.existsSync(p)));};
 new Function('require','module','exports',code)(local,m,m.exports);return m.exports;
}
const {createOriginalPdf,ORIGINAL_PDF_CACHE}=load(path.join(root,'src/lib/original-pdf/client.ts'));
const {PaperDownloads}=load(path.join(root,'src/components/PaperDownloads.tsx'));
const read=url=>fs.readFileSync(path.join(root,'public',url));
const manifest=JSON.parse(read('/study/originals-manifest.json'));
const catalog=JSON.parse(read('/study/past-paper-downloads/catalog.json'));
const items=catalog.courses.flatMap(c=>c.collections.flatMap(i=>i.fullPaper?[i,i.fullPaper]:[i]));
const sha=b=>createHash('sha256').update(b).digest('hex');
const origin='https://study.test',request={collectionId:'fixture',title:'Original scans'};
function fixture(options={}){
 const store=new Map(),calls=[],files=new Map([['/study/a.jpg',Buffer.from('source A')],['/study/b.png',Buffer.from('source B')]]);
 let urls=[...files.keys()],offline=false,denied=0,pageStatus=200,damage=false,renders=0;
 const key=k=>typeof k==='string'?k:k.url;
 const cache={match:async k=>store.get(key(k))?.clone(),put:async(k,r)=>{if(options.quota)throw Error('quota');store.set(key(k),r.clone());},delete:async k=>store.delete(key(k)),keys:async()=>[...store.keys()].map(url=>new Request(url))};
 const fetch=async(url,init)=>{
  calls.push({url,init});if(offline)throw Error('offline');if(denied)return new Response(null,{status:denied});
  const p=new URL(url).pathname;
  if(p==='/study/originals-manifest.json'){
   const value={collections:{fixture:{sources:urls}},files:Object.fromEntries([...files].map(([p,b])=>[p,{version:sha(b),bytes:b.length,kind:p.endsWith('.png')?'png':'jpeg'}]))};
   const etag='"'+sha(JSON.stringify(value))+'"';
   return init?.headers?.['if-none-match']===etag?new Response(null,{status:304,headers:{etag}}):Response.json(value,{headers:{etag}});
  }
  return new Response(damage?'changed':files.get(p),{status:pageStatus});
 };
 const render=async inputs=>{renders++;return new Blob(inputs.map(i=>i.bytes),{type:'application/pdf'});};
 const make=createOriginalPdf({origin,crypto:webcrypto,authorize:async()=>{},fetch,caches:{open:async name=>{assert.equal(name,ORIGINAL_PDF_CACHE);if(options.noStorage)throw Error('no storage');return cache;}},render,...options});
 return {make,store,calls,files,get renders(){return renders;},setUrls:v=>{urls=v;},offline:()=>{offline=true;},deny:s=>{denied=s;},partial:()=>{pageStatus=206;},damage:()=>{damage=true;}};
}
test('every public original is versioned, deduplicated and ordered, including full-retake papers',()=>{
 for(const item of items){
  const originals=item.originals.filter(o=>/\.(pdf|jpe?g|png)$/i.test(o.url));
  if(!originals.length){assert(!manifest.collections[item.id]);continue;}
  const sources=manifest.collections[item.id].sources,seen=new Set();
  for(const url of sources){const b=read(url);assert.equal(manifest.files[url].version,sha(b));assert.equal(manifest.files[url].bytes,b.length);assert(!seen.has(sha(b)));seen.add(sha(b));}
  for(const original of originals)assert(seen.has(sha(read(original.url))));
  if(item.courseId!=='term2-cvs')assert.deepEqual(sources,originals.map(o=>o.url).filter((url,i,all)=>all.findIndex(p=>sha(read(p))===sha(read(url)))===i));
 }
 const cvs=catalog.courses.find(c=>c.id==='term2-cvs');
 for(const item of cvs.collections.filter(i=>i.originals.some(o=>/\.jpg$/.test(o.url))&&!i.originals.some(o=>/\.pdf$/.test(o.url)))){
  const paper=JSON.parse(read(`/study/cvs-past-papers/${item.id}/paper.json`));
  const hashes=new Set(manifest.collections[item.id].sources.map(u=>manifest.files[u].version));
  for(const q of paper.questions)if(q.sourcePage)assert(hashes.has(sha(read(q.sourcePage))),q.sourcePage);
 }
});
test('12-image card renders one Original PDF button, not twelve downloads; private originals stay hidden',()=>{
 const item=items.find(i=>i.id==='limbs-mixed-photographed-fragment');assert.equal(item.originals.length,12);
 const html=renderToStaticMarkup(React.createElement(PaperDownloads,{item,courseTitle:'Limbs'}));
 assert.equal((html.match(/<button/g)??[]).length,4);assert.equal((html.match(/Original/g)??[]).length,1);assert(!/Original \d/.test(html));assert.match(html,/Original<small>PDF/);
 const noOriginal=renderToStaticMarkup(React.createElement(PaperDownloads,{item:{...item,originals:[]},courseTitle:'Limbs'}));assert(!noOriginal.includes('Original'));
 const pdfItem=items.find(i=>i.originals.length===1&&i.originals[0].url.endsWith('.pdf'));
 const pdf=renderToStaticMarkup(React.createElement(PaperDownloads,{item:pdfItem,courseTitle:'Source'}));assert.match(pdf,/<a[^>]+download/);assert.equal((pdf.match(/Original/g)??[]).length,1);
});
test('actual 12-image paper becomes twelve uncropped pages with original JPEG bytes in the same order',async()=>{
 const sources=manifest.collections['limbs-mixed-photographed-fragment'].sources;
 const blob=await renderOriginalPdf(sources.map(url=>({kind:manifest.files[url].kind,bytes:read(url)})),'Twelve original pages');
 const pdf=await PDFDocument.load(await blob.arrayBuffer());assert.equal(pdf.getPageCount(),12);assert.equal(blob.type,'application/pdf');assert.equal(pdf.getTitle(),'Twelve original pages');
 for(const [i,page] of pdf.getPages().entries()){
  const resources=page.node.Resources().lookup(PDFName.of('XObject'));
  const embedded=resources.lookup(resources.keys()[0]);
  assert.equal(sha(embedded.contents),sha(read(sources[i])),'Full JPEG bytes preserved, page '+(i+1));
  const width=embedded.dict.lookup(PDFName.of('Width')).asNumber(),height=embedded.dict.lookup(PDFName.of('Height')).asNumber();
  assert(Math.abs(page.getWidth()/page.getHeight()-width/height)<1e-8);
 }
});
test('mixed PDF/image sources preserve every PDF page, rotation, geometry, and relative order',async()=>{
 const original=await PDFDocument.create();original.addPage([400,600]).setRotation(degrees(90));original.addPage([200,300]);
 const jpg=read(manifest.collections['limbs-mixed-photographed-fragment'].sources[0]);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const blob=await renderOriginalPdf([{kind:'pdf',bytes:await original.save()},{kind:'jpeg',bytes:jpg},{kind:'png',bytes:png}],'Mixed');
 const result=await PDFDocument.load(await blob.arrayBuffer());assert.equal(result.getPageCount(),4);assert.deepEqual(result.getPage(0).getSize(),{width:400,height:600});assert.equal(result.getPage(0).getRotation().angle,90);assert.deepEqual(result.getPage(1).getSize(),{width:200,height:300});assert.deepEqual(result.getPage(3).getSize(),{width:1,height:1});
 await assert.rejects(renderOriginalPdf([],'Empty'),/No original/);
});
test('repeat downloads use cached PDF, and source updates download only changed files',async()=>{
 const f=fixture(),first=await f.make(request);assert(first.cached&&!first.fromCache);assert.equal(f.renders,1);
 const second=await f.make(request);assert(second.fromCache);assert.equal(second.key,first.key);assert.equal(f.calls.filter(c=>!c.url.includes('manifest')).length,2);assert(f.calls.at(-1).init.headers['if-none-match']);
 f.files.set('/study/b.png',Buffer.from('updated B'));const changed=await f.make(request);assert.notEqual(changed.key,first.key);assert.equal(f.renders,2);assert.equal(f.calls.filter(c=>!c.url.includes('manifest')).length,3);assert(!f.store.has(first.key));
 f.setUrls(['/study/b.png','/study/a.jpg']);const reordered=await f.make(request);assert.notEqual(reordered.key,changed.key);assert.equal(await reordered.blob.text(),'updated Bsource A');assert.equal(f.calls.filter(c=>!c.url.includes('manifest')).length,3);
 f.offline();assert((await f.make(request)).fromCache);
});
test('concurrent requests share downloads and rendering; quota/private mode still permit saving',async()=>{
 const f=fixture();const results=await Promise.all([f.make(request),f.make(request),f.make(request)]);assert.equal(f.renders,1);assert.equal(f.calls.filter(c=>!c.url.includes('manifest')).length,2);assert(results.every(r=>r.key===results[0].key));
 for(const options of [{quota:true},{noStorage:true},{maxBytes:1}]){const f=fixture(options);const result=await f.make(request);assert(!result.cached);assert.equal(await result.blob.text(),'source Asource B');}
});
test('authentication failures, partial or corrupt sources never return/cache a misleading partial bundle',async()=>{
 for(const status of [401,403]){const f=fixture();await f.make(request);f.deny(status);await assert.rejects(f.make(request),{code:'AUTH_REQUIRED'});}
 for(const mode of ['partial','damage']){const f=fixture();f[mode]();await assert.rejects(f.make(request));assert.equal(f.renders,0);assert(![...f.store.keys()].some(k=>k.includes('/original-bundle/')));}
 const denied=fixture({authorize:async()=>{throw Error('login required');}});await assert.rejects(denied.make(request),/login/);assert.equal(denied.calls.length,0);
 const bad=fixture();bad.setUrls(['https://evil.test/source.jpg']);await assert.rejects(bad.make(request),/Invalid original/);assert.equal(bad.calls.length,1);
});
test('cache budget stays bounded, and a slow old render cannot overwrite the latest bundle',async()=>{
 const small=fixture({maxFiles:1});await small.make(request);assert.equal([...small.store.keys()].filter(k=>!k.includes('manifest')).length,1);assert((await small.make(request)).fromCache);
 const gates=[],f=fixture({render:()=>new Promise(resolve=>gates.push(()=>resolve(new Blob(['%PDF test'],{type:'application/pdf'}))))});
 const slow=f.make(request);while(gates.length<1)await new Promise(r=>setTimeout(r,5));
 f.files.set('/study/b.png',Buffer.from('newer B'));const fresh=f.make(request);while(gates.length<2)await new Promise(r=>setTimeout(r,5));
 gates[1]();const current=await fresh;gates[0]();const old=await slow;assert(current.cached);assert(!old.cached);assert(!f.store.has(old.key));assert(f.store.has(current.key));assert((await f.make(request)).fromCache);
});
