import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyAnswerOverlay,answerResolution} from '../src/lib/mcq/cvs-paper-enhancements.mjs';
import {coreExamId,createCoreExam} from '../src/lib/mcq/cvs-core-exam.mjs';
import {newPaperAttempt,answerPaperQuestion,gradePaperBreakdown,readPaperProgress,emptyPaperProgress} from '../src/lib/mcq/cvs-paper-state.mjs';
const root = new URL('../public/study/cvs-past-papers/',import.meta.url);
const read = p => JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const manifest = read('core-exam.json'), overlay = read('ai-answers.json'), topics = read('topic-map.json');
const papers = await Promise.all(read('index.json').papers.map(async e => applyAnswerOverlay(read(e.id+'/paper.json'),overlay)));

test('Core Exam retains 100 sourced, answerable questions, with 50 anatomy items',()=>{
  const core = createCoreExam(manifest,papers);
  assert.equal(core.questions.length,100);
  assert.equal(new Set(core.questions.map(q=>q.id)).size,100);
  assert.equal(core.id,coreExamId());
  assert(!core.sourcePaperIds,'Core is not restored as a full-source aggregate');
  assert.equal(core.questions.filter(q=>topics.questions[q.id].subjectId==='anatomy').length,50);
  for(const q of core.questions){
    const original = papers.find(p=>p.id===q.originPaper.id)?.questions.find(item=>item.id===q.id);
    assert(original);
    assert.equal(q.prompt,original.prompt);
    assert.deepEqual(q.options,original.options);
    assert(answerResolution(q).key,q.id);
    assert(q.originPaper.sourceUrl && q.originPaper.transcriptUrl);
  }
});

test('Recurrence counts are reproducible per-topic/per-paper, not duplicate-file or probability counts',()=>{
  assert.equal(manifest.evidencePaperIds.length,6);
  assert(!manifest.evidencePaperIds.some(id=>/izam|undated|practical/.test(id)));
  for(const row of manifest.questions){
    const expected = papers.filter(p=>manifest.evidencePaperIds.includes(p.id) && p.questions.some(q=>topics.questions[q.id]?.topicId===row.topicId)).map(p=>p.id).sort();
    assert.deepEqual([...row.evidencePaperIds].sort(),expected);
    assert.equal(row.topicPaperCount,expected.length);
  }
});

test('Anatomy-only core has a separate attempt and section report',()=>{
  const core = createCoreExam(manifest,papers,'anatomy');
  assert.equal(core.questions.length,50);
  assert(core.questions.every(q=>topics.questions[q.id].subjectId==='anatomy'));
  let attempt = newPaperAttempt(core);
  const q=core.questions[0];
  attempt=answerPaperQuestion(core,attempt,q.id,answerResolution(q).key);
  const progress=emptyPaperProgress();progress.attempts[core.id]=attempt;
  assert.deepEqual(readPaperProgress(JSON.stringify(progress)).attempts[core.id],attempt);
  const report=gradePaperBreakdown(core,attempt,topics);
  assert.equal(report.overall.correct,1);
  assert.equal(report.subjects.length,1);
  assert.equal(report.subjects[0].id,'anatomy');
  assert.notEqual(core.id,coreExamId('all'));
});

test('Missing or ungraded sources fail explicitly instead of diluting the core',()=>{
  assert.throws(()=>createCoreExam(manifest,[]),/could not load/);
  const broken = papers.map(p=>({...p,questions:p.questions.map(q=>({...q,scoringKey:null,aiAnswer:undefined}))}));
  assert.throws(()=>createCoreExam(manifest,broken),/could not load/);
});
