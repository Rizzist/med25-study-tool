import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
import ts from 'typescript';
import {parseExport,keyOf} from '../src/lib/paper-pdf/parse-export.mjs';

const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map();
function load(file){
  if(modules.has(file))return modules.get(file).exports;
  if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
  if(file.endsWith('.mjs'))return require(file);
  const m={exports:{}};modules.set(file,m);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const local=id=>{if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);return load([base,base+'.ts',base+'.tsx',base+'.json'].find(p=>fs.existsSync(p)));};
  new Function('require','module','exports',code)(local,m,m.exports);return m.exports;
}
const catalog=JSON.parse(fs.readFileSync(path.join(root,'public/study/past-paper-downloads/catalog.json'),'utf8'));
const collections=catalog.courses.flatMap(c=>c.collections.map(item=>({...item,courseTitle:c.title})));
const read=url=>fs.readFileSync(path.join(root,'public',url),'utf8');
const {buildPaperDocument,runs,glyphSafe,PAPER_PDF_TEMPLATE,paperFonts}=load(path.join(root,'src/lib/paper-pdf/document.ts'));
const {createPaperPdf,PAPER_PDF_CACHE}=load(path.join(root,'src/lib/paper-pdf/client.ts'));

test('every published export parses into its transcribed questions and graded keys',()=>{
  assert.equal(collections.length,30);
  for(const item of collections){
    const questions=parseExport(read(item.downloads.questions)),keys=parseExport(read(item.downloads.answerKey)),both=parseExport(read(item.downloads.questionsAndKey));
    assert.equal(questions.title,item.title,item.id);
    // Nutrition exports list every source record (untranscribed ones carry only their source line); the rest list transcribed prompts.
    assert.ok([item.transcribedQuestionCount,item.sourceRecordCount].includes(questions.questions.length),item.id+' questions '+questions.questions.length);
    assert.ok(keys.keys.length>=item.gradedQuestionCount,item.id+' keys');
    assert.equal(both.questions.length,questions.questions.length);assert.equal(both.keys.length,keys.keys.length);
    assert.ok(both.sources.length>0&&both.sources.length===questions.sources.length,item.id+' sources listed once');
    const graded=both.keys.filter(k=>keyOf(k).letter).length;
    assert.equal(graded,item.gradedQuestionCount,item.id+' graded letters');
    assert.ok(questions.questions.filter(q=>q.paragraphs.length).length>=item.transcribedQuestionCount,item.id+' prompts');
    for(const q of questions.questions)assert.ok(q.options.every(o=>/^[A-F]$/.test(o.letter)&&o.text.length),q.id+' options');
  }
});
test('document builder mirrors the export: cover, cards with inline keys, key table, bundles page-break',()=>{
  const item=collections.find(c=>c.id==='religion-o');
  const part={doc:parseExport(read(item.downloads.questionsAndKey)),courseTitle:'Religion',collection:item};
  const both=buildPaperDocument([part],'both','MED//25 · Religion · test');
  const json=JSON.stringify(both.content);
  assert.equal(both.pageSize,'A4');assert.match(json,/Original 40-item paper/);assert.match(json,/"Answer C"/);assert.ok(!json.includes('Not graded'));
  const ungraded=structuredClone(part);ungraded.doc.keys[0].fields.Key='Not graded';
  assert.match(JSON.stringify(buildPaperDocument([ungraded],'both','fixture').content),/Not graded/);
  assert.ok(!json.includes('"pageBreak"'));
  const key=JSON.stringify(buildPaperDocument([part],'key','x').content);
  assert.match(key,/NOTES AND PROVENANCE/);assert.ok(!key.includes('"Answer C"'));
  const questions=JSON.stringify(buildPaperDocument([part],'questions','x').content);
  assert.ok(!questions.includes('Answer C')&&!questions.includes('NOTES AND PROVENANCE'));
  const bundle=buildPaperDocument([part,{...part,collection:{...item,id:'second'}}],'both','x');
  assert.equal(JSON.stringify(bundle.content).split('"pageBreak":"before"').length-1,1);
  assert.deepEqual(both.footer(3,9).columns[1].text,'Page 3 of 9');
  const mixed=runs('Latin then عربي then Latin');
  assert.equal(mixed.text.length,3);assert.equal(mixed.text[1].font,'NotoSansArabic');assert.equal(mixed.text[0].font,undefined);
  assert.equal(typeof PAPER_PDF_TEMPLATE,'string');
  assert.equal(runs('A → B ≈ C').text,'A -> B ~ C');
  assert.equal(glyphSafe('x'),'x');
});
test('browser generator caches by content hash, serves repeats from cache, and evicts stale versions',async()=>{
  const store=new Map();
  const fakeCaches={open:async()=>({match:async key=>store.get(key),put:async(key,response)=>{store.set(key,response);},keys:async()=>[...store.keys()].map(url=>({url})),delete:async request=>store.delete(request.url)})};
  let markdown=read(collections[0].downloads.questions),renders=0,fetches=0;
  const env={origin:'https://study.test',crypto:webcrypto,caches:fakeCaches,fetch:async url=>{fetches++;assert.match(String(url),/^https:\/\/study\.test\/study\//);return new Response(markdown);},render:async definition=>{renders++;assert.ok(definition.content.length>1);return new Blob(['%PDF-fake-'+renders],{type:'application/pdf'});}};
  const paperPdf=createPaperPdf(env);
  const request={sources:[{url:collections[0].downloads.questions,collection:collections[0]}],variant:'questions',courseTitle:'T',footerLabel:'f'};
  const first=await paperPdf(request);
  assert.equal(first.fromCache,false);assert.equal(first.cached,true);assert.equal(renders,1);assert.match(first.key,/^https:\/\/study\.test\/study\/paper-pdf\/[^?]+-questions\.pdf\?v=[a-f0-9]{64}$/);
  const second=await paperPdf(request);
  assert.equal(second.fromCache,true);assert.equal(renders,1);assert.equal(second.key,first.key);assert.equal(await second.blob.text(),'%PDF-fake-1');
  markdown+='\n\n### 999 · edited\n\nA changed question.\n\nA. yes\nB. no\n';
  const third=await paperPdf(request);
  assert.notEqual(third.key,first.key);assert.equal(renders,2);assert.equal(store.size,1,'stale version evicted');
  const other=await paperPdf({...request,variant:'key'});
  assert.notEqual(other.key,third.key);assert.equal(store.size,2,'different variants coexist');
  await assert.rejects(()=>paperPdf({...request,sources:[{url:'https://evil.test/x.md',collection:collections[0]}]}),/local study exports/);
  await assert.rejects(()=>paperPdf({...request,sources:[]}));
  assert.equal(PAPER_PDF_CACHE,'med25-paper-pdfs-v1');
  assert.ok(fetches>=3);
});
test('generated PDFs are no longer published files; catalogs point at the Markdown exports',()=>{
  for(const item of collections)for(const url of Object.values(item.downloads)){assert.match(url,/\.md$/);assert.ok(fs.existsSync(path.join(root,'public',url)),url);}
  assert.ok(!fs.existsSync(path.join(root,'public/study/past-paper-downloads/bundles')));
  for(const font of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf','NotoSansArabic-Regular.ttf'])assert.ok(fs.statSync(path.join(root,'public/fonts',font)).size>100000,font);
});

test('every character of every built document exists in the bundled fonts',()=>{
  const fontkit=require('fontkit');
  const fonts={[paperFonts.latin]:{normal:'NotoSans-Regular.ttf',bold:'NotoSans-Bold.ttf'},[paperFonts.arabic]:{normal:'NotoSansArabic-Regular.ttf',bold:'NotoSansArabic-Regular.ttf'}};
  const faces=Object.fromEntries(Object.entries(fonts).map(([name,f])=>[name,{normal:fontkit.openSync(path.join(root,'public/fonts',f.normal)),bold:fontkit.openSync(path.join(root,'public/fonts',f.bold))}]));
  const missing=new Map();
  function walk(node,font,bold,where){
    if(node==null)return;
    if(typeof node==='string'){for(const ch of new Set(node)){const cp=ch.codePointAt(0);if(cp<0x20)continue;if(!faces[font][bold?'bold':'normal'].hasGlyphForCodePoint(cp))missing.set(ch+' '+font,where);}return;}
    if(Array.isArray(node)){for(const n of node)walk(n,font,bold,where);return;}
    const f=node.font??font,b=node.bold??bold;
    if('text' in node)walk(node.text,f,b,where);
    if(node.stack)walk(node.stack,f,b,where);if(node.columns)walk(node.columns,f,b,where);
    if(node.table)for(const row of node.table.body)walk(row,f,b,where);
  }
  const parts=collections.map(item=>({doc:parseExport(read(item.downloads.questionsAndKey)),courseTitle:item.courseTitle,collection:item}));
  for(const variant of ['questions','key','both'])for(const p of parts){const def=buildPaperDocument([p],variant,'MED//25 · '+p.courseTitle+' · '+p.collection.title);walk(def.content,paperFonts.latin,false,p.collection.id+' '+variant);walk(def.footer(1,2),paperFonts.latin,false,p.collection.id+' footer');}
  walk(buildPaperDocument(parts,'both','bundle').content,paperFonts.latin,false,'bundle');
  assert.deepEqual([...missing],[],'unrenderable characters');
  // The raw exports do contain characters the fonts lack; the fallbacks are what keep the documents clean.
  const raw=collections.flatMap(item=>Object.values(item.downloads).map(read)).join('');
  assert.ok(/[→≈]/.test(raw),'exports still carry the characters the fallbacks cover');
});
test('a slow render that finishes after a fresher one does not evict the fresher copy',async()=>{
  const store=new Map();
  const fakeCaches={open:async()=>({match:async key=>store.get(key),put:async(key,response)=>{store.set(key,response);},keys:async()=>[...store.keys()].map(url=>({url})),delete:async request=>store.delete(request.url)})};
  let markdown=read(collections[1].downloads.questions);const gates=[];
  const env={origin:'https://study.test',crypto:webcrypto,caches:fakeCaches,fetch:async()=>new Response(markdown),render:()=>new Promise(resolve=>gates.push(()=>resolve(new Blob(['%PDF'],{type:'application/pdf'}))))};
  const paperPdf=createPaperPdf(env);
  const request={sources:[{url:collections[1].downloads.questions,collection:collections[1]}],variant:'questions',courseTitle:'T',footerLabel:'f'};
  const slow=paperPdf(request);
  while(gates.length<1)await new Promise(r=>setTimeout(r,5));
  markdown+='\n\n### 999 · edited\n\nA changed question.\n\nA. yes\nB. no\n';
  const fresh=paperPdf(request);
  while(gates.length<2)await new Promise(r=>setTimeout(r,5));
  gates[1]();const freshResult=await fresh;assert.equal(freshResult.cached,true);assert.equal(store.size,1);
  gates[0]();const slowResult=await slow;
  assert.notEqual(slowResult.key,freshResult.key);
  assert.ok(store.has(freshResult.key),'fresh version survived the slow render\'s prune');
  const again=await paperPdf(request);
  assert.equal(again.fromCache,true);assert.equal(again.key,freshResult.key);assert.equal(store.size,1,'the stale copy was pruned by the next request');
});
test('pills announce their status in a live region and keep their visible label as the accessible name',()=>{
  const shared=fs.readFileSync(path.join(root,'src/components/CachedPdfDownload.tsx'),'utf8'),paper=fs.readFileSync(path.join(root,'src/components/PaperPdfDownload.tsx'),'utf8');
  assert.match(shared,/role="status"/);assert.match(shared,/mcq-sr-only/);assert.ok(!shared.includes('aria-label'));assert.ok(!paper.includes('aria-label'));
  assert.match(shared,/alive\.current=false/);assert.match(paper,/useDownloadPill\(\)/);
  assert.match(fs.readFileSync(path.join(root,'app/mcq.css'),'utf8'),/\.mcq-sr-only\{position:absolute/);
});
