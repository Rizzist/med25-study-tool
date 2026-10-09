import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map();
function load(file){
 if(modules.has(file))return modules.get(file).exports;
 if(file.endsWith('.mjs'))return require(file);
 const m={exports:{}};modules.set(file,m);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const local=id=>{if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);return load([base,base+'.ts'].find(p=>fs.existsSync(p)));};
 new Function('require','module','exports',code)(local,m,m.exports);return m.exports;
}
const {createPaperPdf}=load(path.join(root,'src/lib/paper-pdf/client.ts'));
const markdown='# Figure paper\n\n## Questions\n\n### 1 · q1\n\nIdentify the structure.\n\nA. First\nB. Second\n\nImage: /study/figure.png?v=abc\n\n## Answer key and provenance\n\n### 1 · q1\n\nKey: B — Second\n\nHidden explanation.';
const request={sources:[{url:'/study/paper.md',collection:{id:'paper',title:'Figure paper'}}],courseTitle:'Tissue',footerLabel:'MED25'};
function fixture({imageStatus=200,image='/study/figure.png?v=abc'}={}){
 const docs=[],calls=[];
 const make=createPaperPdf({origin:'https://study.test',authorize:async()=>{},caches:{open:async()=>{throw Error('no cache');}},fetch:async url=>{calls.push(url);return new URL(url).pathname.endsWith('.md')?new Response(markdown.replace('/study/figure.png?v=abc',image)):new Response(new Uint8Array([1,2,3]),{status:imageStatus});},render:async doc=>{docs.push(doc);return new Blob(['%PDF-test']);}});
 return {make,docs,calls};
}
test('question and Q+A PDFs embed required figures; only Q+A contains the answer',async()=>{
 for(const variant of ['questions','both']){const f=fixture();await f.make({...request,variant});const body=JSON.stringify(f.docs[0]);assert(body.includes('data:image/png;base64,AQID'));assert.equal(body.includes('Hidden explanation'),variant==='both');assert.equal(body.includes('Answer B'),variant==='both');assert.equal(f.calls.length,2);}
 const f=fixture();await f.make({...request,variant:'key'});assert.equal(f.calls.length,1);assert(JSON.stringify(f.docs[0]).includes('Hidden explanation'));
});
test('missing, denied or external figures fail instead of generating an incomplete paper',async()=>{
 for(const imageStatus of [404,401,403]){const f=fixture({imageStatus});await assert.rejects(f.make({...request,variant:'questions'}));assert.equal(f.docs.length,0);}
 const f=fixture({image:'https://outside.test/figure.png'});await assert.rejects(f.make({...request,variant:'questions'}),/Invalid paper figure/);assert.equal(f.docs.length,0);
});

test('Q+A highlights all accepted alternatives and the standalone key lists them',()=>{
 const {buildPaperDocument}=load(path.join(root,'src/lib/paper-pdf/document.ts'));
 const {parseExport}=require('../src/lib/paper-pdf/parse-export.mjs');
 const doc=parseExport(markdown+'\n\nKey provenance: Editorial study answer; accepted choices: A, B\n');
 const part={doc,collection:request.sources[0].collection,courseTitle:'Tissue'};
 const both=JSON.stringify(buildPaperDocument([part],'both','test').content);
 assert.match(both,/Answer A \/ B/);
 assert.equal((both.match(/"fillColor":"#126747"/g)??[]).length,2);
 assert.match(JSON.stringify(buildPaperDocument([part],'key','test').content),/A \/ B/);
 const questions=JSON.stringify(buildPaperDocument([part],'questions','test').content);
 assert(!questions.includes('accepted alternatives'));assert(!questions.includes('"fillColor":"#126747"'));
});
