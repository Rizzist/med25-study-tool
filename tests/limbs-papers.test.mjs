import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import Ajv2020 from 'ajv/dist/2020.js';
import ts from 'typescript';
import {scopeLimbPaper,limbBankSelection} from '../src/lib/mcq/limb-paper-scope.mjs';
import {combinedSourceSelection,finalPaperKey,readCombinedSelections} from '../src/lib/mcq/paper-selection.mjs';
import {parseFinalExamProgress} from '../src/lib/mcq/final-exam-state.mjs';
import {parseExport,keyOf} from '../src/lib/paper-pdf/parse-export.mjs';

const root=path.resolve(import.meta.dirname,'..');
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const read=p=>JSON.parse(text(p));
const exam='term2-limbs',bank='limbs-past-papers';
const catalog=read('data/mcq-refactor/past-source-catalog.json');
const cards=catalog.collections.filter(c=>c.courseId===exam);
const questions=text(`data/final-exams/${bank}.jsonl`).trim().split('\n').map(JSON.parse);
const papers=cards.map(c=>read(`data/limbs/papers/${c.id}.json`));

test('all collected files are classified; distinct collections retain 475 source items',()=>{
 const manifest=read('data/limbs/source-manifest.json');
 for(const source of manifest.collections.flatMap(c=>c.sources)){
  assert(source.bytes<50*1024*1024,`${source.url} exceeds web asset size budget`);
  if(source.processing){assert(source.originalSha256);assert(source.originalBytes>source.bytes);}
 }
 const inventory=read('data/limbs/collection-inventory.json').inventory;
 assert.equal(inventory.length,96);
 assert(inventory.every(s=>s.sha256&&(s.collection||s.archivePath)&&s.classification));
 assert.equal(cards.length,19);assert.equal(papers.flatMap(p=>p.questions).length,475);
 assert.equal(questions.length,468);assert.equal(new Set(questions.map(q=>q.id)).size,468);
 assert.equal(cards.reduce((n,c)=>n+c.ungradedCount,0),7);
 assert.equal(cards.filter(c=>c.defaultEligible).length,15);
 assert.equal(limbBankSelection(cards,'all').gradedQuestionIds.length,365);
 assert.equal(cards.find(c=>c.id==='limbs-upper-online-screenshots').originalOrderClaim,false);
});

test('all scored items validate, have a review section and retain valid answer provenance',()=>{
 const validate=new Ajv2020({allErrors:true}).compile(read('schemas/mcq-question.schema.json'));
 const course=read('data/review-curriculum/courses/term2-limbs.json');
 for(const q of questions){
  assert(validate(q),`${q.id}: ${JSON.stringify(validate.errors)}`);
  assert(course.questions[q.id]?.sectionId,q.id);
  assert(['ai-inferred','source-reviewed'].includes(q.answerReview.basis));
  assert(q.explanation.trim());assert(q.options.some(o=>o.id===q.correctOptionId));
  assert.equal(q.tags.filter(t=>/^limb-region-/.test(t)).length,1);
 }
});

test('upper/lower filtering partitions each mixed paper without mutating original content',()=>{
 let upper=0,lower=0;
 for(const c of cards){
  const before=JSON.stringify(c),u=scopeLimbPaper(c,'upper'),l=scopeLimbPaper(c,'lower');
  assert.equal(scopeLimbPaper(c),c);assert.equal(JSON.stringify(c),before);
  assert(!u.gradedQuestionIds.some(id=>l.gradedQuestionIds.includes(id)));
  assert.deepEqual(new Set([...u.gradedQuestionIds,...l.gradedQuestionIds]),new Set(c.gradedQuestionIds));
  assert.equal(u.sourceRecordCount+l.sourceRecordCount,c.sourceRecordCount);
  assert.equal(u.ungradedCount+l.ungradedCount,c.ungradedCount);
  upper+=u.gradedQuestionCount;lower+=l.gradedQuestionCount;
 }
 assert.equal(upper,255);assert.equal(lower,213);
 const mixed=cards.find(c=>c.id==='limbs-mixed-theory-2022');
 assert.equal(scopeLimbPaper(mixed,'upper').gradedQuestionCount,25);
 assert.equal(scopeLimbPaper(mixed,'lower').gradedQuestionCount,20);
 assert.throws(()=>scopeLimbPaper(mixed,'invalid'));
});

test('individual scopes and combined selections retain separate restored progress keys',async()=>{
 const mixed=cards.filter(c=>c.id.startsWith('limbs-mixed'));
 const scopes=['all','upper','lower'];
 const combinations=[];
 for(const scope of scopes){
  const scoped=mixed.map(c=>scopeLimbPaper(c,scope));
  combinations.push(await combinedSourceSelection(scoped,scoped.map(c=>c.id)));
 }
 assert.equal(new Set(combinations.map(c=>c.id)).size,3);
 const saved=combinations.map(c=>({...c,exam}));
 assert.equal(readCombinedSelections(JSON.stringify(saved)).length,3);
 const keys=scopes.map(s=>finalPaperKey(exam,scopeLimbPaper(mixed[0],s).id));
 assert.equal(new Set(keys).size,3);
 const sessions=Object.fromEntries([...keys,...combinations.map(c=>finalPaperKey(exam,c.id))].map(k=>[k,{questionIds:['test'],answers:{},currentIndex:0}]));
 const restored=parseFinalExamProgress(JSON.stringify({version:2,sessions}));
 for(const k of Object.keys(sessions))assert(restored.sessions[k],k);
});

test('question/key exports join by stable IDs and expose every source and correction',()=>{
 for(const c of cards){
  const doc=parseExport(text('public'+c.downloads.questionsAndKey));
  const paper=papers.find(p=>p.id===c.id);
  assert.equal(doc.questions.length,c.sourceRecordCount,c.id);
  assert.equal(doc.keys.length,c.sourceRecordCount,c.id);
  assert.equal(doc.sources.length,c.sources.length,c.id);
  assert.equal(doc.meta['Collection ID'],c.id);
  for(const row of paper.questions){
   const q=doc.questions.find(q=>q.id===row.id),k=doc.keys.find(k=>k.id===row.id);
   assert(q&&k,row.id);
   assert.deepEqual(q.options.map(o=>o.text),row.sourceOptions??row.options);
   assert.equal(keyOf(k).letter,row.graded?row.key:'',row.id);
   assert(k.fields['Existing answer note']);
  }
 }
});

test('all public sources and practical figures exist and match their fingerprints',()=>{
 const assets=catalog.assets.filter(a=>a.collectionId?.startsWith('limbs-'));
 for(const a of assets){
  const bytes=fs.readFileSync(path.join(root,'public',a.url));
  assert.equal(bytes.length,a.bytes,a.url);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,a.url);
 }
 assert.equal(questions.filter(q=>q.media?.length).length,45);
 for(const q of questions)for(const m of q.media??[]){
  assert(!path.isAbsolute(m.path)&&!m.path.includes('..'));
  assert(fs.statSync(path.join(root,'public/study',m.path)).size>1000);
 }
 for(const p of papers.filter(p=>p.privateOriginals)){
  assert.equal(cards.find(c=>c.id===p.id).sources.length,0);
  assert(!JSON.stringify(p).includes('/Users/'));
 }
});

test('runtime catalog exposes the source-only bank and all practical assets',()=>{
 const runtime=read('data/mcq-runtime/index.json').finals[`${exam}:${bank}`];
 assert.equal(runtime.count,468);
 const course=read('public/study/runtime/catalog.json').exams.find(c=>c.id===exam);
 assert.equal(course.finalExamQuestionCount,468);
 const media=read('data/mcq-runtime/media.json');
 for(const q of questions)for(const m of q.media??[])assert.equal(media[q.id+'::'+m.id].path,m.path);
});

// Use the actual handlers and PDF document builder without booting a real user's account.
const require=createRequire(import.meta.url),modules=new Map();
function load(file){
 // Auth itself is covered by auth-http.integration; this test exercises authenticated content handlers.
 if(file===path.join(root,'src/lib/server/auth.ts'))return {requireApiSession:async()=>null};
 if(modules.has(file))return modules.get(file).exports;
 if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
 if(file.endsWith('.mjs'))return require(file);
 const module={exports:{}};modules.set(file,module);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const local=id=>{
  if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);
  const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
  return load([base,base+'.ts',base+'.json'].find(p=>fs.existsSync(p)));
 };
 new Function('require','module','exports',code)(local,module,module.exports);return module.exports;
}

test('final API defaults to limb sources only, honors ETags and rejects cross-course banks',async()=>{
 const route=load(path.join(root,'app/api/final-exam/route.ts'));
 const request=(query,headers)=>route.GET(new Request('http://localhost/api/final-exam?'+query,{headers}));
 const response=await request('exam='+exam),body=await response.json();
 assert.equal(response.status,200);assert.equal(body.bank,bank);
 assert.deepEqual(body.questions.map(q=>q.id),questions.map(q=>q.id));
 assert.equal((await request('exam='+exam+'&bank=telegram-past-papers')).status,400);
 assert.equal((await request('exam=term2-cvs&bank='+bank)).status,400);
 assert.equal((await request('exam='+exam,{'if-none-match':response.headers.get('etag')})).status,304);
 const routeMedia=load(path.join(root,'app/api/media/route.ts'));
 for(const q of body.questions)for(const media of q.media??[]){
  const r=await routeMedia.GET(new Request(`http://localhost/api/media?questionId=${q.id}&mediaId=${media.id}`));
  assert.equal(r.status,307);assert.equal(r.headers.get('location'),'http://localhost'+media.url);
 }
});

test('PDF document definitions contain 468 graded answers and 7 explicit withheld entries',()=>{
 const {buildPaperDocument}=load(path.join(root,'src/lib/paper-pdf/document.ts'));
 let scored=0,ungraded=0;
 for(const card of cards){
  const doc=parseExport(text('public'+card.downloads.questionsAndKey));
  const content=JSON.stringify(buildPaperDocument([{doc,courseTitle:'Upper & Lower Limbs',collection:card}],'both','MED25').content);
  scored+=(content.match(/"Answer [A-F]"/g)??[]).length;
  ungraded+=(content.match(/"Not graded"/g)??[]).length;
 }
 assert.equal(scored,468);assert.equal(ungraded,7);
});
