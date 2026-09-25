import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {coreSelection,selectCollectionQuestions,finalSessionSeed} from '../src/lib/mcq/curated-core.mjs';
import {finalPaperKey,paperAttemptSummary} from '../src/lib/mcq/paper-selection.mjs';
import {parseFinalExamProgress,reconcileFinalExamSession} from '../src/lib/mcq/final-exam-state.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const core=read('public/study/biochemistry/core-exam.json');
const source=read('data/biochemistry/past-papers.json');
const course=read('data/review-curriculum/courses/term2-biochemistry.json');
const bank=fs.readFileSync(new URL('../data/final-exams/biochemistry-metabolism-past-papers.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
const full=coreSelection(core),repeats=coreSelection(core,'repeats');
const id=s=>'biochemistry-'+s.replace(':','-q');

test('honest smaller selection: total archive, repeat patterns, source occurrences and supplements are distinct',()=>{
 assert.equal(core.sourceQuestionCount,717);assert.equal(core.sourceCollectionCount,17);assert.equal(core.optionalQuestionCount,102);
 assert.equal(core.repeatedPatternCount,97);assert.equal(core.supplementalCount,106);assert.equal(core.questions.length,203);
 assert.equal(core.questions.length,core.repeatedPatternCount+core.supplementalCount);
 const repeatRows=core.questions.filter(q=>q.kind==='repeat');
 assert.equal(repeatRows.length,core.repeatedPatternCount);
 assert.equal(repeatRows.reduce((n,r)=>n+r.members.length,0),core.repeatedSourceOccurrenceCount);
 assert.equal(core.repeatedSourceOccurrenceCount,321);
 assert(core.questions.length<core.sourceQuestionCount);
 assert.equal(new Set(core.questions.map(q=>q.questionId)).size,core.questions.length);
});

test('every recurrence is traceable to unique main collections; no repairs or reconstructions manufacture repeats',()=>{
 const used=new Set();
 for(const row of core.questions){
  assert(row.members.some(m=>m.questionId===row.questionId));
  const paperIds=[...new Set(row.members.map(m=>m.paperId))].sort();
  assert.deepEqual(paperIds,row.sourcePaperIds);assert.equal(row.sourceCollectionCount,paperIds.length);
  assert.equal(row.kind==='repeat',paperIds.length>=2);
  for(const m of row.members){
   assert(!used.has(m.questionId),`Duplicate member in selection: ${m.questionId}`);used.add(m.questionId);
   const paper=source.papers.find(p=>p.id===m.paperId);assert(paper?.defaultEligible);
   const original=paper.questions.find(q=>q.number===m.sourceNumber);assert(original);
   assert.equal(m.sourceUrl,`${paper.original.url}#page=${original.page}`);
   const q=bank.find(q=>q.id===m.questionId);assert(q);
   if(row.kind==='repeat')assert(!q.qualityFlags.includes('editorially-repaired-source-question'));
  }
 }
 const aldolase=core.questions.find(r=>r.questionId===id('2025-feb-dds:024'));
 assert.equal(aldolase.members.length,5);assert.equal(aldolase.sourceCollectionCount,4,'Two occurrences in January 2023 count as one collection');
});

test('distinct entities, counts and pathways are not fuzzy-merged; reviewed equivalents are collapsed',()=>{
 const pattern=s=>core.questions.find(r=>r.members.some(m=>m.questionId===id(s)))?.questionId;
 assert.notEqual(pattern('2025-feb-dds:031'),pattern('2025-feb-dds:052'),'Liver GLUT2 differs from muscle GLUT4');
 assert.notEqual(pattern('2025-feb-dds:030'),pattern('2025-feb-dds:032'),'Glycogenolysis is not gluconeogenesis');
 assert.notEqual(pattern('2025-feb-dds:033'),pattern('2023-july-23:043'),'ATP count differs from pyruvate count');
 assert.notEqual(pattern('2023-jan-29:034'),pattern('theory-53:014'),'IMP differs from OMP');
 assert.equal(pattern('2025-feb-dds:044'),pattern('1401-metabolism:030'),'5-FU picks the source with correct enzyme spelling');
 assert.equal(pattern('2025-feb-dds:052'),pattern('theory-42:041'));
 assert(!core.questions.some(r=>r.members.some(m=>m.questionId.includes('reconstruction'))));
});

test('all selected questions preserve current original IDs, options, accepted keys, provenance and media',()=>{
 const selected=selectCollectionQuestions([...bank].reverse(),full);
 assert.deepEqual(selected.map(q=>q.id),full.gradedQuestionIds,'Manifest order, not API bank order');
 for(const q of selected){assert.equal(q,bank.find(v=>v.id===q.id));assert(q.options.some(o=>o.id===q.correctOptionId));assert(q.answerReview.evidence.length);}
 assert(selected.find(q=>q.id===id('theory-53:016')).media?.length);
 assert.throws(()=>selectCollectionQuestions(bank.slice(1),full),/versions differ/);
 assert.equal(selectCollectionQuestions(bank).length,819);
});

test('PDF page metadata and all 32 review-section starts agree with current curriculum',()=>{
 const pdf=fs.readFileSync(new URL('../public/study/reviews/biochemistry.pdf',import.meta.url));
 const audit=read('data/biochemistry/review-coverage.json');
 assert.equal(createHash('sha256').update(pdf).digest('hex'),audit.reviewSha256);assert.equal(audit.reviewPages,56);
 assert.equal(core.sections.length,32);
 assert.equal(core.sections.reduce((n,s)=>n+s.count,0),core.questions.length);
 for(const s of core.sections){const selection=coreSelection(core,s.id);assert.equal(selection.gradedQuestionIds.length,s.count);assert(selection.gradedQuestionIds.every(id=>core.questions.find(q=>q.questionId===id).sectionId===s.id));}
 for(const q of core.questions){const s=course.sections.find(s=>s.id===q.sectionId);assert(s);assert.equal(q.pdfPage,s.pdfPage);assert.equal(course.questions[q.questionId].sectionId,s.id);}
 assert.throws(()=>coreSelection(core,'unknown'));
});

test('full/repeats/sections persist separately and never inherit all-bank or source-paper answers',()=>{
 const exam='term2-biochemistry',base=finalPaperKey(exam),fullKey=finalPaperKey(exam,full.id),repeatKey=finalPaperKey(exam,repeats.id);
 const sectionKey=finalPaperKey(exam,coreSelection(core,core.sections[0].id).id);
 assert.equal(new Set([base,fullKey,repeatKey,sectionKey]).size,4);
 const legacy={questionIds:[bank[0].id],answers:{},completedAt:null};
 assert.equal(finalSessionSeed({[base]:legacy},fullKey,base,full,'start'),null);
 assert.equal(finalSessionSeed({[fullKey]:legacy},fullKey,base,full,'start'),legacy);
 assert.equal(finalSessionSeed({[fullKey]:legacy},fullKey,base,full,'new'),null);
 const session=reconcileFinalExamSession(null,selectCollectionQuestions(bank,full),core.fingerprint);
 const parsed=parseFinalExamProgress(JSON.stringify({version:2,sessions:{[fullKey]:session,[base]:legacy}}));
 assert.deepEqual(parsed.sessions[fullKey],session);assert.deepEqual(parsed.sessions[base],legacy);
 assert.equal(paperAttemptSummary(parsed,exam,full).total,203);
});

test('representative results remain complete after reload and core routes do not change the original score',()=>{
 const questions=selectCollectionQuestions(bank,repeats),q=questions[0],key=finalPaperKey('term2-biochemistry',repeats.id);
 const answers=Object.fromEntries(questions.map(q=>[q.id,{selectedOptionId:q.correctOptionId,correct:true,questionRevision:q.revision,correctOptionId:q.correctOptionId,answeredAt:'2026-09-23T10:00:00Z'}]));
 const completed=reconcileFinalExamSession({questionIds:questions.map(q=>q.id),answers,completedAt:'2026-09-23T10:00:00Z'},questions,core.fingerprint);
 const raw=JSON.stringify({version:2,sessions:{[key]:completed}});
 const restored=parseFinalExamProgress(raw);assert.equal(paperAttemptSummary(restored,'term2-biochemistry',repeats).completedAt,completed.completedAt);
 const reviewSession=reconcileFinalExamSession(completed,[q],core.fingerprint);
 assert.equal(Object.keys(completed.answers).length,97);assert.equal(Object.keys(reviewSession.answers).length,1);
 assert.equal(JSON.stringify({version:2,sessions:{[key]:completed}}),raw);
});
