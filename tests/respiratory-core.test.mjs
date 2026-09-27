import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {coreSelection,selectCollectionQuestions,finalSessionSeed} from '../src/lib/mcq/curated-core.mjs';
import {finalPaperKey,paperAttemptSummary} from '../src/lib/mcq/paper-selection.mjs';
import {parseFinalExamProgress,reconcileFinalExamSession} from '../src/lib/mcq/final-exam-state.mjs';
import {resolveGuidedReference,guidanceMode} from '../src/lib/mcq/guided-exam.mjs';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const core=read('public/study/respiratory/core-exam.json');
const catalog=read('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id==='term2-respiratory');
const papers=new Map(catalog.collections.filter(p=>p.defaultEligible).map(p=>[p.id,{...p,records:read(`data/respiratory/papers/${p.id}.json`).questions}]));
const bank=fs.readFileSync(new URL('data/final-exams/respiratory-past-papers.jsonl',root),'utf8').trim().split('\n').map(JSON.parse);
const course=read('public/study/reviews/term2-respiratory.json'),anchors=read('public/study/guided/term2-respiratory.json');
const full=coreSelection(core),repeat=coreSelection(core,'repeats');
const id=short=>'respiratory-'+short.replace(':','-q');

test('Respiratory Core selects audited original PYQs, with honest separate recurrence and coverage counts',()=>{
  assert.equal(core.sourceQuestionCount,475);assert.equal(core.sourceCollectionCount,14);assert.equal(core.optionalQuestionCount,104);
  assert.equal(core.questions.length,193);assert.equal(core.repeatedPatternCount,99);assert.equal(core.supplementalCount,94);
  assert.equal(core.repeatedSourceOccurrenceCount,265);
  assert.equal(core.questions.length,core.repeatedPatternCount+core.supplementalCount);
  assert.equal(core.questions.filter(r=>r.kind==='repeat').reduce((n,r)=>n+r.members.length,0),265);
  assert.equal(new Set(full.gradedQuestionIds).size,193);
  assert.deepEqual(core.subjects.map(s=>[s.id,s.count]),[['anatomy',59],['physiology',102],['histology',20],['embryology',12]]);
  assert.match(core.exclusionNote,/not authenticated independent sittings/);
  assert.match(core.methodology,/not a prediction/);
});

test('Every group traces to actual scored main-paper records and live source pages, not aliases or repairs',()=>{
  const seen=new Set();
  for(const row of core.questions){
    assert(row.members.some(m=>m.questionId===row.questionId));
    const unique=[...new Set(row.members.map(m=>m.paperId))].sort();
    assert.deepEqual(unique,row.sourcePaperIds);assert.equal(unique.length,row.sourceCollectionCount);
    assert.equal(row.kind==='repeat',unique.length>=2);
    for(const m of row.members){
      assert(!seen.has(m.questionId),m.questionId);seen.add(m.questionId);
      const p=papers.get(m.paperId);assert(p);
      const r=p.records.find(q=>q.canonicalQuestionId===m.questionId&&q.graded);assert(r);
      assert.equal(m.sourceNumber,r.sourceNumber);
      if(row.kind==='repeat')assert(!r.sourceOptions,'Edited choices are not recurrence evidence');
      const first=p.originals[0];
      assert.equal(m.sourceUrl,first.url.endsWith('.pdf')?first.url+'#page='+r.page:p.originals[r.page-1].url);
      assert(fs.existsSync(new URL('public'+m.sourceUrl.split('#')[0],root)));
    }
  }
  assert(!seen.has(id('22:001')));assert(!seen.has(id('06:030')));assert(!seen.has(id('12:038')));
  const co=core.questions.find(r=>r.questionId===id('06:013'));
  assert.equal(co.sourceCollectionCount,4);assert.equal(co.members.length,5,'Two occurrences within source 15 count once');
});

test('Reviewed equivalents merge; distinct boundaries, pressures, settings and numerical problems remain distinct',()=>{
  const pattern=short=>{const row=core.questions.find(r=>r.members.some(m=>m.questionId===id(short)));assert(row,short);return row.questionId;};
  assert.equal(pattern('09:035'),pattern('01:034'));
  assert.equal(pattern('15:040'),pattern('11:anatomy-7'));
  assert.equal(pattern('12:040'),pattern('15:029'),'Reverse gland/muscle order preserves the relationship, not answer letters');
  assert.notEqual(pattern('07:005'),pattern('12:028'),'Pleural rib 8 differs from lung rib 6');
  assert.notEqual(pattern('01:028'),pattern('09:032'),'Roof + medial differs from roof + lateral');
  assert.notEqual(pattern('01:017'),pattern('03:005'),'Rest differs from exercise');
  assert.notEqual(pattern('01:008'),pattern('03:003'),'Initial gradient differs from mean gradient');
  assert.notEqual(pattern('06:012'),pattern('07:027'),'Maximum Hb capacity differs from incompletely saturated content');
  assert.notEqual(pattern('02:012'),pattern('05:004'),'Different Laplace calculation inputs');
  assert.notEqual(pattern('15:031'),pattern('09:036'),'External motor branch differs from internal sensory branch');
});

test('The manifest points to existing bank objects and never changes the question, key, provenance or media',()=>{
  const selected=selectCollectionQuestions([...bank].reverse(),full);
  assert.deepEqual(selected.map(q=>q.id),full.gradedQuestionIds);
  for(const q of selected){assert.equal(q,bank.find(v=>v.id===q.id));assert(q.options.some(o=>o.id===q.correctOptionId));assert(q.answerReview.evidence.length);}
  assert.throws(()=>selectCollectionQuestions(bank.filter(q=>q.id!==selected[0].id),full),/versions differ/);
  assert.equal(selectCollectionQuestions(bank).length,579);
});

test('All Core questions and section scopes resolve to the current Guided review PDF',()=>{
  assert.equal(core.sections.length,66);assert.equal(core.sections.reduce((n,s)=>n+s.count,0),193);
  for(const row of core.questions){
    const section=course.sections.find(s=>s.id===row.sectionId);assert(section);
    assert.equal(row.pdfPage,section.pdfPage);assert.equal(course.questions[row.questionId].sectionId,section.id);
    const reference=resolveGuidedReference(course,anchors,row.questionId);assert(reference);
    assert(reference.page>=1&&reference.page<=186);assert(['paragraph','section'].includes(reference.precision));
  }
  for(const s of core.sections){const scope=coreSelection(core,s.id);assert.equal(scope.gradedQuestionIds.length,s.count);assert(scope.gradedQuestionIds.every(id=>course.questions[id].sectionId===s.id));}
  assert.throws(()=>coreSelection(core,'bad-section'));
});

test('Full, repeated, section, combined and original-paper attempts are isolated and retain Guided choice',()=>{
  const exam='term2-respiratory',base=finalPaperKey(exam),key=finalPaperKey(exam,full.id);
  const keys=[base,key,finalPaperKey(exam,repeat.id),finalPaperKey(exam,coreSelection(core,core.sections[0].id).id),finalPaperKey(exam,'respiratory-01')];
  assert.equal(new Set(keys).size,keys.length);
  const legacy={questionIds:[bank[0].id],answers:{},completedAt:null};
  assert.equal(finalSessionSeed({[base]:legacy},key,base,full,'start'),null);
  assert.equal(finalSessionSeed({[key]:legacy},key,base,full,'new'),null);
  const questions=selectCollectionQuestions(bank,full);
  const session={...reconcileFinalExamSession(null,questions,core.fingerprint),guidance:'guided'};
  const parsed=parseFinalExamProgress(JSON.stringify({version:2,sessions:{[key]:session,[base]:legacy}}));
  assert.equal(parsed.sessions[key].guidance,'guided');assert.deepEqual(parsed.sessions[base],legacy);
  assert.equal(paperAttemptSummary(parsed,exam,full).total,193);
  assert.equal(guidanceMode(exam,'guided'),'guided');
  assert.equal(guidanceMode(exam,'unguided'),'unguided');
});

test('Completed Core results and original score survive reload and a separate mistake-review subset',()=>{
  const exam='term2-respiratory',questions=selectCollectionQuestions(bank,repeat),key=finalPaperKey(exam,repeat.id);
  const answers=Object.fromEntries(questions.map(q=>[q.id,{selectedOptionId:q.correctOptionId,correct:true,questionRevision:q.revision,correctOptionId:q.correctOptionId,answeredAt:'2026-09-27T10:00:00Z'}]));
  const session=reconcileFinalExamSession({questionIds:questions.map(q=>q.id),answers,completedAt:'2026-09-27T10:00:00Z',guidance:'guided'},questions,core.fingerprint);
  const before=JSON.stringify(session);
  const restored=parseFinalExamProgress(JSON.stringify({version:2,sessions:{[key]:session}}));
  assert.equal(paperAttemptSummary(restored,exam,repeat).correct,99);
  assert.equal(paperAttemptSummary(restored,exam,repeat).completedAt,session.completedAt);
  const subset=reconcileFinalExamSession(session,questions.slice(0,1),core.fingerprint);
  assert.equal(Object.keys(subset.answers).length,1);assert.equal(JSON.stringify(session),before);
});
