import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {reviewBreakdown} from '../src/lib/mcq/review-results.mjs';
import {parseFinalExamProgress,reconcileFinalExamSession} from '../src/lib/mcq/final-exam-state.mjs';
import {combinedSourceSelection,paperAttemptSummary,finalPaperKey,readCombinedSelections} from '../src/lib/mcq/paper-selection.mjs';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),modules=new Map();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
function load(file){
  if(modules.has(file))return modules.get(file).exports;
  if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
  if(file.endsWith('.mjs'))return require(file);
  const m={exports:{}};modules.set(file,m);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const local=id=>{if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);return load([base,base+'.ts',base+'.tsx',base+'.json'].find(p=>fs.existsSync(p)));};
  new Function('require','module','exports',code)(local,m,m.exports);return m.exports;
}
const server=load(path.join(root,'src/lib/server/study-bank.ts')),runtime=read('data/mcq-runtime/index.json');

test('navigation retains source-style course cards and only the four MCQ destinations',()=>{
  const {StudyShell}=load(path.join(root,'src/components/StudyShell.tsx'));
  const html=renderToStaticMarkup(createElement(StudyShell,{exam:'term2-cvs',activeSection:'Practice MCQs',onCourseChange:()=>{},onSectionChange:()=>{},status:'Loading catalog…',immersive:false,courses:[{id:'term2-cvs',title:'CVS',date:'Date TBA'},{id:'term2-religion',title:'Religion',date:'Date TBA',count:75},{id:'july25',title:'Term one',date:'July 25',count:713}]},'Study content'));
  assert.match(html,/Choose term/);assert.match(html,/Term 2 courses/);assert.match(html,/Date TBA/);assert.match(html,/75 MCQs/);assert.match(html,/Loading questions/);
  assert(!html.includes('Term one'));assert(!html.includes('0 MCQs'));assert.match(html,/aria-current="page"/);
  for(const label of ['Practice MCQs','Past exams','Review topics','Results'])assert(html.includes(label));
  const css=fs.readFileSync(path.join(root,'app/mcq.css'),'utf8');
  assert.match(css,/\.mcq-sidebar\{position:fixed/);assert.match(css,/\.mcq-topbar\{position:sticky/);
  assert.match(css,/body:has\(\.mcq-app\),body:has\(\.review-shell\)\{[^}]*overflow:visible/);
  assert.match(css,/mcq-app:has\(\[data-cvs-paper-session="active"\]\)>\.mcq-sidebar/);
});
test('combined paper selections are stable, unique, source bounded and persist separately',async()=>{
  const collections=[{id:'a',gradedQuestionIds:['q1','q2']},{id:'b',gradedQuestionIds:['q2','q3']},{id:'ungraded',gradedQuestionIds:[]}];
  const a=await combinedSourceSelection(collections,['a','b','not-in-catalog']);
  const b=await combinedSourceSelection(collections,['b','a']);
  assert.deepEqual(a,b);assert.deepEqual(a.gradedQuestionIds,['q1','q2','q3']);
  assert.notEqual(a.id,(await combinedSourceSelection(collections,['a'])).id);
  await assert.rejects(()=>combinedSourceSelection(collections,['ungraded']));
  const key=finalPaperKey('term2-nutrition',a.id),stored={version:2,sessions:{[key]:{questionIds:a.gradedQuestionIds,answers:{}}}};
  assert.deepEqual(parseFinalExamProgress(JSON.stringify(stored)).sessions[key],stored.sessions[key]);
  const remembered={id:a.id,exam:'term2-nutrition',sourcePaperIds:a.sourcePaperIds};
  assert.deepEqual(readCombinedSelections(JSON.stringify([remembered,{id:'bad',exam:'term2-cvs',sourcePaperIds:[]}])) ,[remembered]);
  assert.deepEqual(readCombinedSelections('broken'),[]);
});
test('paper summary excludes unrelated or malformed answers and incomplete results',()=>{
  const c={id:'a',gradedQuestionIds:['q1','q2']},key=finalPaperKey('term2-nutrition',c.id);
  const progress={sessions:{[key]:{questionIds:c.gradedQuestionIds,answers:{q1:{selectedOptionId:'A',correct:true},q2:null,unrelated:{selectedOptionId:'A',correct:true}},completedAt:'2026-09-20'}}};
  assert.deepEqual(paperAttemptSummary(progress,'term2-nutrition',c),{answered:1,correct:1,total:2,completedAt:null});
  assert.equal(paperAttemptSummary({sessions:{[key]:{questionIds:'corrupt'}}},'term2-nutrition',c),null);
});
test('CVS and other past-paper selectors share the same source-card component',()=>{
  const {PastPaperCard}=load(path.join(root,'src/components/PastPaperCard.tsx'));
  const html=renderToStaticMarkup(createElement(PastPaperCard,{title:'Source paper',label:'Dated paper',note:'Unconfirmed date'},'Saved result'));
  assert.match(html,/past-paper-card/);assert.match(html,/<details/);assert.match(html,/Saved result/);
  for(const file of ['CvsPastExams.tsx','PastExamHub.tsx'])assert(fs.readFileSync(path.join(root,'src/components',file),'utf8').includes('<PastPaperCard'));
});

test('compact initial catalog has no question IDs and no retired UI imports',()=>{
  const catalog=read('public/study/runtime/catalog.json');assert(fs.statSync(path.join(root,'public/study/runtime/catalog.json')).size<15000);
  assert(catalog.exams.every(c=>!c.collectionQuestionIds&&!c.biochemistryChapters));
  const source=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');
  assert(!/from.*(lessons|concepts|Anatomy3D|Atlas|codex)/i.test(source));
  assert(!fs.readFileSync(path.join(root,'src/lib/server/study-bank.ts'),'utf8').includes('embedded-bank'));
});
test('all course data retain live 2D but never 3D; history covers every current ID',()=>{
  let dynamic2d=0;
  for(const [id,entry] of Object.entries(runtime.courses)){
    const questions=read(entry.file),history=new Set(read(entry.historyFile).map(q=>q.id));
    assert.equal(questions.length,entry.count);assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
    for(const q of questions){assert.notEqual(q.kind,'dynamic_anatomy_3d');assert(history.has(q.id));if(q.kind==='dynamic_anatomy')dynamic2d++;}
    if(id.startsWith('term2-')){const c=read('public/study/reviews/'+id+'.json');assert.deepEqual(Object.entries(c.questions).filter(([,q])=>q.livePractice).map(([id])=>id).sort(),questions.map(q=>q.id).sort());}
  }
  assert.equal(dynamic2d,3915);
});
test('final API refuses authored bank; source banks match approved IDs exactly',()=>{
  assert.equal(server.isFinalExamBankId('downloaded-core'),false);assert.throws(()=>server.finalExamSet('july29','downloaded-core'));
  assert.throws(()=>server.finalExamSet('term2-limbs'));
  const catalog=read('data/mcq-refactor/past-source-catalog.json');
  for(const [key,entry] of Object.entries(runtime.finals)){
    const expected=new Set(catalog.collections.filter(c=>c.bankKey===key).flatMap(c=>c.gradedQuestionIds));
    assert.deepEqual(read(entry.file).map(q=>q.id).sort(),[...expected].sort());
  }
  assert.equal(server.loadVerifiedQuestions('july29').filter(q=>q.qualityFlags.includes('not-a-past-paper-question')).length,151);
});
test('by-ID lists validate over 500 saved IDs without duplicating historical questions',()=>{
  const ids=server.loadVerifiedQuestions('term2-limbs').slice(0,620).map(q=>q.id);
  const response=server.questionSetByIds({exam:'term2-limbs',ids,limit:20,purpose:'history'});
  assert.equal(response.availableCount,620);assert.equal(new Set(response.validIds).size,620);assert.equal(response.questions.length,20);
  assert.equal(server.questionSetByIds({exam:'term2-cvs',ids,limit:20}).availableCount,0);
});
test('sprints remain fresh, selected-course-only, and source media are versioned',()=>{
  const signatures=new Set();const ids=new Set(server.loadVerifiedQuestions('term2-cvs').map(q=>q.id));
  for(let i=0;i<5;i++){const set=server.coverageQuestionSet({exam:'term2-cvs',limit:20,studyMode:'exam'});assert(set.questions.every(q=>ids.has(q.id)));signatures.add(set.questions.map(q=>q.id).join('|'));}
  assert(signatures.size>1);
  const q=server.loadVerifiedQuestions('aug22').find(q=>q.media?.length);assert(server.resolveMedia(q.id,q.media[0].id).url.includes('?v='));
});
test('section feedback distinguishes skips, ungraded, suggested and unmapped data',()=>{
  const course={sections:[{id:'a',title:'Section A'}],questions:{one:{sectionId:'a',uncertain:false},two:{sectionId:'a',uncertain:true}}};
  const rows=reviewBreakdown([{questionId:'one',answered:false,correct:false,gradable:false},{questionId:'two',answered:true,correct:true},{questionId:'three',answered:true,correct:false,gradable:false},{questionId:'two',answered:true,correct:true}],course);
  assert.equal(rows.find(r=>r.id==='a').skipped,1);assert.equal(rows.find(r=>r.id==='a').ungraded,0);assert.equal(rows.find(r=>r.id==='a').percent,null);
  assert.equal(rows.find(r=>r.id==='suggested:a').percent,100);assert.equal(rows.find(r=>r.id==='suggested:a').total,1);
  assert.equal(rows.find(r=>r.id==='unmapped').ungraded,1);
});
test('collection sessions and retired legacy sessions survive parse',()=>{
  const key='july29:telegram-past-papers:collection:july29-telegram-multisource';
  const q={id:'q',revision:1,correctOptionId:'A',options:[{id:'A'}]},session=reconcileFinalExamSession(null,[q],'f');
  const parsed=parseFinalExamProgress(JSON.stringify({version:2,sessions:{[key]:session,'july29:downloaded-core':session,'july29:telegram-past-papers:no-carb-lipid-metabolism':session}}));
  assert.deepEqual(parsed.sessions[key],session);assert.deepEqual(parsed.sessions['july29:downloaded-core'],session);assert(parsed.sessions['july29:telegram-past-papers:no-carb-lipid-metabolism']);
});
test('all source download URLs resolve, and none exposes local paths',()=>{
  const c=read('public/study/past-paper-downloads/catalog.json');assert(!/\/Users\/|\/tmp\//.test(JSON.stringify(c)));
  assert.equal(c.courses.flatMap(c=>c.collections).length,50); // 45 existing + 5 distinct Nutrition imports
  assert.equal(c.courses.find(c=>c.id==='term2-nutrition').collections.length,9);
  for(const item of c.courses.flatMap(c=>c.collections))for(const url of [...Object.values(item.downloads),...item.originals.map(o=>o.url)])assert(fs.statSync(path.join(root,'public',url.split(/[?#]/)[0])).size>0,url);
});
test('image markers remain visible before feedback without revealing anatomy names',()=>{
  const {QuestionMedia}=load(path.join(root,'src/components/QuestionMedia.tsx'));
  const original=server.loadVerifiedQuestions('aug22').find(q=>q.id==='hpi15-trachea-respiratory-epithelium');assert(original);
  const html=renderToStaticMarkup(createElement(QuestionMedia,{question:original}));assert.match(html,/mcq-image-marker/);assert.match(html,/Marker A/);
  const q={...original,media:[{id:'a',type:'image',path:'foo.png',alt:'Secret',annotations:[{id:'x',label:'Secret anatomical answer',x:.1,y:.1,width:.2,height:.2}]}]};
  assert(!renderToStaticMarkup(createElement(QuestionMedia,{question:q})).includes('Secret anatomical answer'));
});
test('audio/video question rendering is on demand, supported by source schema',()=>{
  const {QuestionMedia}=load(path.join(root,'src/components/QuestionMedia.tsx'));
  const schema=read('schemas/mcq-question.schema.json');assert.deepEqual(schema.$defs.media.properties.type.enum,['image','audio','video']);
  for(const type of ['audio','video']){
    const html=renderToStaticMarkup(createElement(QuestionMedia,{question:{id:'sample',media:[{id:'clip',type,path:'sample.mp4',alt:'Question recording',transcript:'Answer-bearing transcript'}]}}));
    assert(html.includes('<'+type));assert(html.includes('preload="none"'));assert(!html.includes('Answer-bearing transcript'));
  }
});
