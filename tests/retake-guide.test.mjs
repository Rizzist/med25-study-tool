import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
import ts from 'typescript';
import {coreSelection,selectCollectionQuestions,finalSessionSeed} from '../src/lib/mcq/curated-core.mjs';
import {parseExport} from '../src/lib/paper-pdf/parse-export.mjs';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map();
function load(file){
 if(modules.has(file))return modules.get(file).exports;
 if(file.endsWith('.mjs'))return require(file);
 const m={exports:{}};modules.set(file,m);
 let source=fs.readFileSync(file,'utf8');
 if(file.endsWith('RetakeCoreCard.tsx'))source+='\nexport {CoreDownloadPills};';
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const local=id=>{
  if(file.endsWith('RetakeCoreCard.tsx')&&id.startsWith('./'))return new Proxy({},{get:(_,name)=>Object.defineProperty(()=>null,'name',{value:String(name)})});
  if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);
  const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
  return load([base,base+'.ts',base+'.tsx',base+'.json'].find(p=>fs.existsSync(p)));
 };
 new Function('require','module','exports',code)(local,m,m.exports);return m.exports;
}
const read=url=>fs.readFileSync(path.join(root,'public',url),'utf8');
const guide=JSON.parse(read('/study/biochemistry-retake/guide-distilled.json'));
const core=JSON.parse(read('/study/biochemistry-retake/core-exam-distilled.json'));
const {buildRetakeGuideDocument,retakeGuidePdf}=load(path.join(root,'src/lib/biochemistry/retake-distilled.ts'));
const {glyphSafe}=load(path.join(root,'src/lib/paper-pdf/document.ts'));
const {createPaperPdf}=load(path.join(root,'src/lib/paper-pdf/client.ts'));
function textOf(node){if(node==null)return '';if(typeof node==='string'||typeof node==='number')return String(node);if(Array.isArray(node))return node.map(textOf).join(' ');return textOf(node.text??node.stack??node.columns??node.ul??node.table?.body??'');}
function nodes(tree,name,out=[]){if(!tree)return out;if(Array.isArray(tree)){tree.forEach(n=>nodes(n,name,out));return out;}if(typeof tree==='object'){if(tree.type?.name===name)out.push(tree.props);nodes(tree.props?.children,name,out);}return out;}

test('guide document renders every selected concept and evidence with preserved clinical clarification',()=>{
 const before=JSON.stringify(guide),definition=buildRetakeGuideDocument(guide,'https://study.test');
 assert.equal(JSON.stringify(guide),before);assert.equal(definition.pageSize,'A4');
 const output=textOf(definition.content),serialized=JSON.stringify(definition.content);
 for(const section of guide.sections){
  assert(output.includes(glyphSafe(section.title)),section.title);
  for(const concept of section.concepts){
   assert(output.includes(glyphSafe(concept.title)),concept.id);
   assert(output.includes(glyphSafe(concept.summary)),concept.id+' summary');
   for(const point of concept.keyPoints)assert(output.includes(glyphSafe(point)),concept.id+' point');
  }
  for(const source of section.sourceQuestions)assert(serialized.includes(new URL(source.url,'https://study.test').href),source.id);
 }
 assert(output.includes('do not delay urgent glucose while waiting for thiamine'));
 assert(serialized.includes('downloads.asam.org'));
 assert.equal(textOf(definition.footer(3,24)).includes('3 / 24'),true);
});

test('guide PDF authorizes before rendering and again before returning a downloadable Blob',async()=>{
 const events=[];const blob=new Blob(['%PDF-fixture']);
 const result=await retakeGuidePdf(guide,{origin:'https://study.test',authorize:async()=>events.push('auth'),render:async definition=>{events.push('render');assert.equal(definition.info.title,guide.title);return blob;}});
 assert.equal(result,blob);assert.deepEqual(events,['auth','render','auth']);
 let renders=0;
 await assert.rejects(retakeGuidePdf(guide,{authorize:async()=>{throw Error('signed out');},render:async()=>{renders++;return blob;}}),/signed out/);
 assert.equal(renders,0);
 let authorizations=0;
 await assert.rejects(retakeGuidePdf(guide,{origin:'https://study.test',authorize:async()=>{if(++authorizations===2)throw Error('signed out during render');},render:async()=>blob}),/signed out during render/);
 await assert.rejects(retakeGuidePdf({...guide,fingerprint:''},{authorize:async()=>{},render:async()=>{renders++;return blob;}}),/not loaded completely/);
 assert.equal(renders,0);
});

test('every chapter Core launch and PDF contains exactly its selected questions, keys and counts',async()=>{
 const {CoreDownloadPills}=load(path.join(root,'src/components/RetakeCoreCard.tsx'));
 const full=coreSelection(core),sourceIds=parseExport(read(core.downloadCollection.downloads.questions)).questions.map(q=>q.id);
 assert.equal(full.gradedQuestionIds.length,111);
 const ids=new Set();
 for(const section of core.sections.filter(s=>s.count)){
  const selection=coreSelection(core,section.id);assert.equal(selection.gradedQuestionIds.length,section.count);
  assert(!ids.has(selection.id));ids.add(selection.id);assert(selection.independent);
  assert.equal(finalSessionSeed({old:{answers:{}}},selection.id,'old',selection,'start'),null);
  assert.throws(()=>selectCollectionQuestions([],selection),/versions differ/);
  for(const props of nodes(CoreDownloadPills({manifest:core,selection}),'PaperPdfDownload')){
   const source=props.sources[0];assert.deepEqual(source.questionSelection.ids,selection.gradedQuestionIds);
   assert.equal(source.collection.sourceRecordCount,section.count);assert.equal(source.collection.gradedQuestionCount,section.count);assert.equal(source.collection.ungradedCount,0);
   assert(props.filename.endsWith('-distilled.pdf'));
   let definition;
   const make=createPaperPdf({authorize:async()=>{},origin:'https://study.test',crypto:webcrypto,fetch:async url=>new Response(read(new URL(url).pathname)),render:async d=>{definition=d;return new Blob(['%PDF-fixture']);}});
   await make(props);
   const serialized=JSON.stringify(definition.content);
   for(const id of sourceIds)assert.equal(serialized.includes(id),selection.gradedQuestionIds.includes(id),section.id+' '+props.variant+' '+id);
   const output=textOf(definition.content).replace(/\s+/g,' ');
   assert(output.includes(`${section.count} graded`));assert(output.includes(`${section.count} source items`));
  }
 }
});
