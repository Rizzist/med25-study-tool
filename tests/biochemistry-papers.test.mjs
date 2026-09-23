import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseExport} from '../src/lib/paper-pdf/parse-export.mjs';
import {finalPaperKey,combinedSourceSelection,readCombinedSelections} from '../src/lib/mcq/paper-selection.mjs';
import {parseFinalExamProgress,isFinalAnswerCorrect} from '../src/lib/mcq/final-exam-state.mjs';
import {resolveBiochemistryItem} from '../scripts/lib/biochemistry-resolution.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const data=read('data/biochemistry/past-papers.json');
const resolutions=read('data/biochemistry/ai-resolutions.json').questions;
const resolved=(p,r)=>resolveBiochemistryItem(r,resolutions[`${p.id}-q${String(r.number).padStart(3,'0')}`]);
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
 assert.equal(questions.length,641);
 for(const p of data.papers)for(const original of p.questions){
  const r=resolved(p,original);
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
 assert.equal(question('39',3).correctOptionId,'B');assert.match(question('39',3).prompt,/A and B chains/);
 assert.equal(question('12',10).options[2].text,'UDP');
 assert.equal(question('photos',4).correctOptionId,'D');assert.equal(question('photos',9).correctOptionId,'A');
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
test('expanded review locks 641 conceptual destinations and identifies the 23 study resolutions',()=>{
 const audit=read('data/biochemistry/review-coverage.json');
 const curriculum=read('data/review-curriculum/courses/term2-biochemistry.json');
 const pdf=fs.readFileSync(new URL('../public/study/reviews/biochemistry.pdf',import.meta.url));
 assert.equal(createHash('sha256').update(pdf).digest('hex'),audit.reviewSha256);
 assert.equal(audit.questionDestinations.length,641);
 assert.equal(new Set(audit.questionDestinations.map(r=>r.questionId)).size,641);
 assert.equal(audit.ungradedItems,0);assert.equal(audit.aiResolvedItems,23);assert.equal(audit.reviewSections,36);
 for(const r of audit.questionDestinations){
  const section=curriculum.sections.find(s=>s.id===r.sectionId);
  assert(section,r.questionId);assert.equal(r.pdfPage,section.pdfPage);
  assert(r.references.length>0,r.questionId);
  assert.equal(Boolean(questions.find(q=>q.id===r.questionId)),r.graded);
  if(r.graded){assert.equal(curriculum.questions[r.questionId].sectionId,r.sectionId);assert.equal(curriculum.questions[r.questionId].uncertain,false);}
 }
 for(const [src,n,id] of [['23',36,'ppp'],['23',37,'other-sugars'],['2',21,'lipoprotein-map'],['2',22,'liver-tests'],['2',30,'pdh-tca'],['39',34,'aa-carbon'],['3',31,'thyroid'],['photos',55,'endocrine-signaling']]){
  const p=data.papers.find(p=>p.sourceId===src);
  assert.equal(audit.questionDestinations.find(r=>r.questionId===`${p.id}-q${String(n).padStart(3,'0')}`).sectionId,`biochemistry/biochem-${id}`);
 }
});
test('AI study repairs preserve originals and use darker-answer provenance even when matching printed keys',()=>{
 assert.equal(Object.keys(resolutions).length,23);
 assert.equal(Object.values(resolutions).filter(r=>r.kind==='repaired').length,22);
 for(const p of data.papers)for(const row of p.questions){
  const id=`${p.id}-q${String(row.number).padStart(3,'0')}`;
  const resolution=resolutions[id];
  if(!resolution){assert(row.key);continue;}
  assert.equal(row.key,null,'Original withheld editorial decision remains in source');
  const before=JSON.stringify(row), effective=resolved(p,row), q=question(p.sourceId,row.number);
  assert.equal(JSON.stringify(row),before,'Resolver must not mutate the source');
  assert.equal(q.answerReview.basis,'ai-inferred');assert.equal(q.revision,2);
  assert(q.source.excerpt.includes(row.prompt));
  for(const text of row.options)assert(q.source.excerpt.includes(text));
  assert(q.answerReview.evidence.some(e=>resolution.evidence.includes(e)));
  assert.equal(q.qualityFlags.includes('editorially-repaired-source-question'),resolution.kind==='repaired');
  assert.equal(effective.originalQuestion.providedKey,row.providedKey);
  const generated=read(`data/biochemistry/papers/${p.id}.json`).questions.find(r=>r.id===id);
  assert.deepEqual(generated.originalQuestion.options,row.options);
 }
 for(const option of ['A','C'])assert(isFinalAnswerCorrect(question('2',22),option));
 assert(!isFinalAnswerCorrect(question('2',22),'B'));
 for(const [src,n]of [['27',10],['41',13],['14',9],['2',19],['39',11]])assert.equal(question(src,n).correctOptionId,'E');
 assert.throws(()=>resolveBiochemistryItem({key:'A'},Object.values(resolutions)[0]));
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
