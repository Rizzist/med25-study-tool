import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseExport} from '../src/lib/paper-pdf/parse-export.mjs';
import {finalPaperKey,combinedSourceSelection,readCombinedSelections} from '../src/lib/mcq/paper-selection.mjs';
import {parseFinalExamProgress,isFinalAnswerCorrect} from '../src/lib/mcq/final-exam-state.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const data=read('data/biochemistry/past-papers.json');
const questions=fs.readFileSync(new URL('../data/final-exams/biochemistry-metabolism-past-papers.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
const collections=read('data/mcq-refactor/past-source-catalog.json').collections.filter(c=>c.courseId===data.courseId);
const question=(src,n)=>questions.find(q=>q.id===data.papers.find(p=>p.sourceId===src).id+'-q'+String(n).padStart(3,'0'));

test('metabolism-only import groups alternate files, preserves all source occurrences and missing numbers',()=>{
 assert.equal(data.papers.length,15);assert.equal(data.papers.flatMap(p=>p.questions).length,641);
 assert.equal(data.papers.find(p=>p.sourceId==='photos').questions.length,64);
 assert.deepEqual(data.papers.find(p=>p.sourceId==='39').missingSourceNumbers,[26,29]);
 assert.equal(data.papers.find(p=>p.sourceId==='18').sources.length,3);
 assert(!data.papers.some(p=>p.sourceId==='9'));
 assert.equal(data.excluded.length,8);assert(data.excluded.some(e=>e.reason.includes('foundations')));
 assert(data.excluded.filter(e=>e.reason.includes('Practical')).length===6);
 assert(!collections.find(c=>c.id.includes('reconstruction')).defaultEligible);
 assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
});
test('all usable answers and only usable answers reach the scored bank',()=>{
 assert.equal(questions.length,data.papers.flatMap(p=>p.questions).filter(q=>q.key).length);
 for(const p of data.papers)for(const r of p.questions){
  const q=question(p.sourceId,r.number);assert.equal(Boolean(q),Boolean(r.key),`${p.id}/${r.number}`);
  if(!q){assert(r.note);continue;}
  assert.equal(q.prompt,r.prompt);assert.deepEqual(q.options.map(o=>o.text),r.options);
  assert(q.options.some(o=>o.id===q.correctOptionId));assert(q.answerReview.evidence.length);
  assert(q.tags.includes('exam-term2-biochemistry'));assert(q.tags.includes('biochemistry-metabolism-past-paper'));
  if(!r.providedKey||r.providedKey!==r.key)assert.equal(q.answerReview.basis,'ai-inferred');
 }
});
test('key corrections, flawed source items and original diagram cannot regress',()=>{
 assert.equal(question('photos',27).correctOptionId,'C');
 assert.equal(question('23',24).correctOptionId,'C');
 assert.equal(question('23',2).correctOptionId,'A');
 assert.equal(question('12',8).correctOptionId,'A');
 assert.equal(question('2',8).correctOptionId,'D');
 assert.equal(question('photos',18).correctOptionId,'C');
 assert(isFinalAnswerCorrect(question('photos',18),'D'));
 assert(!isFinalAnswerCorrect(question('photos',18),'B'));
 assert.equal(question('39',3),undefined);assert.equal(question('12',10),undefined);
 assert.equal(question('photos',4),undefined);assert.equal(question('photos',9),undefined);
 assert.equal(question('18',38).options[2].text,'Δ12 double bond is inserted');
 assert.match(question('12',23).explanation,/129.*106/);
 const media=question('41',16).media[0];assert.match(media.alt,/pyrimidine/);
 assert(fs.statSync(new URL('../public/study/'+media.path,import.meta.url)).size>1000);
});
test('downloads retain every source item; source hashes and PDF-export parsing agree',()=>{
 const publicCourse=read('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id===data.courseId);
 assert.equal(publicCourse.collections.length,collections.length);
 assert.equal(publicCourse.gradedQuestionCount,questions.length);
 for(const c of collections){
  const p=data.papers.find(p=>p.id===c.id);assert.equal(c.sourceRecordCount,p.questions.length);
  assert.equal(c.gradedQuestionCount,c.gradedQuestionIds.length);assert.equal(c.ungradedCount,c.sourceRecordCount-c.gradedQuestionCount);
  for(const s of c.sources)assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../public'+s.publicUrl,import.meta.url))).digest('hex'),s.sha256);
  const doc=parseExport(fs.readFileSync(new URL('../public'+c.downloads.questionsAndKey,import.meta.url),'utf8'));
  assert.equal(doc.questions.length,c.sourceRecordCount);assert.equal(doc.keys.length,c.sourceRecordCount);
  assert(doc.questions.every(q=>q.options.length>=4));
 }
});
test('every scored final has an honest existing review section or explicit unmapped status',()=>{
 const curriculum=read('data/review-curriculum/courses/term2-biochemistry.json');
 for(const q of questions){const m=curriculum.questions[q.id];assert(m);assert.equal(m.livePractice,false);
  if(m.sectionId)assert(curriculum.sections.some(s=>s.id===m.sectionId));else assert(m.uncertain);
 }
});
test('per-paper and combined biochemistry sessions survive reload without touching original scores',async()=>{
 const key=finalPaperKey(data.courseId,collections[0].id);
 assert.equal(key,`${data.courseId}:${data.bankId}:collection:${collections[0].id}`);
 const session={questionIds:collections[0].gradedQuestionIds,answers:{},completedAt:null};
 const restored=parseFinalExamProgress(JSON.stringify({version:2,sessions:{[key]:session}}));
 assert.deepEqual(restored.sessions[key],session);
 const combined=await combinedSourceSelection(collections,collections.slice(0,2).map(c=>c.id));
 assert.equal(combined.gradedQuestionIds.length,collections.slice(0,2).reduce((n,c)=>n+c.gradedQuestionCount,0));
 assert.equal(readCombinedSelections(JSON.stringify([{...combined,exam:data.courseId}])).length,1);
});
