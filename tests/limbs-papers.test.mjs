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
import {parseExport,keyOf,scopeLimbExport} from '../src/lib/paper-pdf/parse-export.mjs';

const root=path.resolve(import.meta.dirname,'..');
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const read=p=>JSON.parse(text(p));
const exam='term2-limbs',bank='limbs-past-papers';
const catalog=read('data/mcq-refactor/past-source-catalog.json');
const cards=catalog.collections.filter(c=>c.courseId===exam);
const questions=text(`data/final-exams/${bank}.jsonl`).trim().split('\n').map(JSON.parse);
const papers=cards.map(c=>read(`data/limbs/papers/${c.id}.json`));

test('all collected files are classified; distinct collections retain 547 source items',()=>{
 const manifest=read('data/limbs/source-manifest.json');
 for(const source of manifest.collections.flatMap(c=>c.sources)){
  assert(source.bytes<50*1024*1024,`${source.url} exceeds web asset size budget`);
  if(source.processing){assert(source.originalSha256);assert(source.originalBytes>source.bytes);}
 }
 const inventory=read('data/limbs/collection-inventory.json').inventory;
 assert.equal(inventory.length,154);
 assert(inventory.every(s=>s.sha256&&(s.collection||s.archivePath)&&s.classification));
 assert.equal(cards.length,23);assert.equal(papers.flatMap(p=>p.questions).length,547);
 assert.equal(questions.length,537);assert.equal(new Set(questions.map(q=>q.id)).size,537);
 assert.equal(cards.reduce((n,c)=>n+c.ungradedCount,0),10);
 assert.equal(cards.filter(c=>c.defaultEligible).length,17);
 assert.equal(limbBankSelection(cards,'all').gradedQuestionIds.length,410);
 assert.equal(cards.find(c=>c.id==='limbs-upper-online-screenshots').originalOrderClaim,false);
});

test('all scored items validate, have a review section and retain valid answer provenance',()=>{
 const validate=new Ajv2020({allErrors:true}).compile(read('schemas/mcq-question.schema.json'));
 const course=read('data/review-curriculum/courses/term2-limbs.json');
 for(const q of questions){
  assert(validate(q),`${q.id}: ${JSON.stringify(validate.errors)}`);
  const mapping=course.questions[q.id];
  assert(mapping,q.id);
  if(!mapping.sectionId){
   assert(q.tags.includes('limb-region-axial'),q.id);
   assert(mapping.uncertain&&mapping.status==='needs-crosswalk');
   assert(q.answerReview.evidence.some(e=>/cvs.pdf|Langman's/.test(e)),q.id);
  }
  assert(['ai-inferred','source-reviewed'].includes(q.answerReview.basis));
  assert(q.explanation.trim());assert(q.options.some(o=>o.id===q.correctOptionId));
  assert.equal(q.tags.filter(t=>/^limb-region-/.test(t)).length,1);
 }
});

test('Full keeps axial/general items while Upper/Lower partition limb items without mutation',()=>{
 let upper=0,lower=0;
 for(const c of cards){
  const before=JSON.stringify(c),u=scopeLimbPaper(c,'upper'),l=scopeLimbPaper(c,'lower');
  assert.equal(scopeLimbPaper(c),c);assert.equal(JSON.stringify(c),before);
  assert(!u.gradedQuestionIds.some(id=>l.gradedQuestionIds.includes(id)));
  const extra=[...(c.limbQuestionIds.axial??[]),...(c.limbQuestionIds.general??[])];
  assert.deepEqual(new Set([...u.gradedQuestionIds,...l.gradedQuestionIds,...extra]),new Set(c.gradedQuestionIds));
  assert(!extra.some(id=>u.gradedQuestionIds.includes(id)||l.gradedQuestionIds.includes(id)));
  assert.equal(u.sourceRecordCount+l.sourceRecordCount+(c.limbSourceCounts.axial??0)+(c.limbSourceCounts.general??0),c.sourceRecordCount);
  assert.equal(u.ungradedCount+l.ungradedCount,c.ungradedCount);
  upper+=u.gradedQuestionCount;lower+=l.gradedQuestionCount;
 }
 assert.equal(upper,296);assert.equal(lower,228);
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
 assert.equal(questions.filter(q=>q.media?.length).length,48);
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
 assert.equal(runtime.count,537);
 const course=read('public/study/runtime/catalog.json').exams.find(c=>c.id===exam);
 assert.equal(course.finalExamQuestionCount,537);
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

test('PDF document definitions contain 537 graded answers and 10 explicit withheld entries',()=>{
 const {buildPaperDocument}=load(path.join(root,'src/lib/paper-pdf/document.ts'));
 let scored=0,ungraded=0;
 for(const card of cards){
  const doc=parseExport(text('public'+card.downloads.questionsAndKey));
  const content=JSON.stringify(buildPaperDocument([{doc,courseTitle:'Upper & Lower Limbs',collection:card}],'both','MED25').content);
  scored+=(content.match(/"Answer [A-F]"/g)??[]).length;
  ungraded+=(content.match(/"Not graded"/g)??[]).length;
 }
 assert.equal(scored,537);assert.equal(ungraded,10);
});

test('5 October audit deduplicates 51 downloads and imports only one optional new question',()=>{
 const audit=read('data/limbs/download-audit-2026-10-05.json');
 assert.equal(audit.files,51);assert.equal(audit.newCanonicalFiles,15);
 assert.deepEqual(audit.summary,{'exact-duplicate':36,'reference-reformat':1,'reference-only':6,'same-paper-repost':6,'new-question':1,'question-duplicate':1});
 assert.equal(new Set(audit.rows.map(r=>r.originalName)).size,51);
 assert.equal(audit.rows.length,51);
 const inventory=read('data/limbs/collection-inventory.json').inventory;
 assert.deepEqual(inventory.filter(r=>r.set===audit.batch),audit.rows);
 const c=cards.find(c=>c.id==='limbs-lower-attachment-screenshot');
 assert(c&&!c.defaultEligible&&!c.originalOrderClaim);
 assert.equal(c.gradedQuestionCount,1);
 assert.equal(scopeLimbPaper(c,'lower').gradedQuestionCount,1);
 assert.equal(scopeLimbPaper(c,'upper').gradedQuestionCount,0);
 assert.deepEqual(c.gradedQuestionIds,audit.newQuestionIds);
 const q=questions.find(q=>q.id===audit.newQuestionIds[0]);
 assert.equal(q.correctOptionId,'C');assert.equal(q.options[2].text,'Gemellus superior');
 assert.equal(q.answerReview.basis,'ai-inferred');
 assert(q.answerReview.evidence.some(e=>e.includes('rad.uw.edu/muscle-atlas/superior-gemellus')));
 assert.equal(questions.filter(q=>q.id.startsWith(c.id)).length,1);
 const duplicate=audit.rows.find(r=>r.disposition==='question-duplicate');
 assert(questions.some(q=>q.id===duplicate.duplicateQuestionId));
 assert.equal(papers.find(p=>p.id==='limbs-lower-midterm-2023').questions.find(q=>q.number===31).graded,false);
 for(const row of audit.rows.filter(r=>r.disposition==='reference-only'))assert(!row.collection);
 assert.equal(audit.rows.find(r=>r.disposition==='reference-reformat').duplicateOfArchivePath,'_reference-only/lower-revision-book/01-source.pdf');
});

test('October imports retain complete source sets, deduplicate reposts and disclose defective answers',()=>{
 const expected=[['limbs-iums-upper-2021',25,23,20,0,3],['limbs-upper-axial-fragment',27,26,21,0,5],['limbs-lower-axial-fragment',19,19,0,14,5]];
 for(const[id,source,scored,upper,lower,fullOnly]of expected){
  const c=cards.find(c=>c.id===id),p=papers.find(p=>p.id===id);
  assert.equal(c.sourceRecordCount,source);assert.equal(c.gradedQuestionCount,scored);
  assert.equal(scopeLimbPaper(c,'upper').gradedQuestionCount,upper);
  assert.equal(scopeLimbPaper(c,'lower').gradedQuestionCount,lower);
  assert.equal(c.gradedQuestionCount-upper-lower,fullOnly);
  const doc=parseExport(text('public'+c.downloads.questionsAndKey));
  for(const scope of ['upper','lower']){
   const part=scopeLimbExport(doc,scope),scoped=scopeLimbPaper(c,scope);
   assert.equal(part.questions.length,scoped.sourceRecordCount);
   assert.deepEqual(part.keys.filter(k=>keyOf(k).letter).map(k=>k.id),scoped.gradedQuestionIds);
  }
  for(const r of p.questions.filter(r=>r.sourcePrompt)){
   assert(text('public'+c.downloads.questions).includes(r.sourcePrompt));
   assert(questions.find(q=>q.id===r.id).source.excerpt.includes(r.sourcePrompt));
  }
 }
 assert.equal(papers.find(p=>p.id==='limbs-iums-upper-2021').questions.find(q=>q.number===15).providedKey,'B');
 assert.equal(papers.find(p=>p.id==='limbs-iums-upper-2021').questions.find(q=>q.number===15).graded,false);
 assert.equal(papers.find(p=>p.id==='limbs-upper-axial-fragment').questions.find(q=>q.number===19).graded,false);
 assert.deepEqual(papers.find(p=>p.id==='limbs-upper-axial-fragment').missingSourceNumbers,['11']);
});
