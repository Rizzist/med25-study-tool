import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {applyAnswerOverlay,answerResolution} from '../src/lib/mcq/cvs-paper-enhancements.mjs';
import {NON_CORE_ANATOMY_ID,createNonCoreAnatomyExam} from '../src/lib/mcq/cvs-noncore-anatomy.mjs';
import {coreExamId} from '../src/lib/mcq/cvs-core-exam.mjs';
import {questionsSharePattern} from '../scripts/content/cvs-core-repeats.mjs';
import {newPaperAttempt,answerPaperQuestion,gradePaperBreakdown,readPaperProgress,emptyPaperProgress,restorePaperAttempt} from '../src/lib/mcq/cvs-paper-state.mjs';
const root=new URL('../',import.meta.url),dir=new URL('public/study/cvs-past-papers/',root);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,dir),'utf8'));
const manifest=read('noncore-anatomy.json'),core=read('core-exam.json'),mapping=read('topic-map.json');
const overlay=read('ai-answers.json');
const papers=await Promise.all(read('index.json').papers.map(e=>applyAnswerOverlay(read(e.id+'/paper.json'),overlay)));
const byId=new Map(papers.flatMap(p=>p.questions.map(q=>[q.id,q])));
const coreIds=new Set(core.questions.flatMap(r=>[r.questionId,...r.repeatMatches.map(m=>m.questionId)]));

test('All source anatomy is partitioned into Core, secondary, duplicates or held items',()=>{
  const eligible=[...byId.values()].filter(q=>mapping.questions[q.id]?.subjectId==='anatomy').map(q=>q.id).sort();
  const accounted=[...manifest.questions,...manifest.excludedCore,...manifest.duplicates,...manifest.withheld].map(row=>row.questionId);
  assert.equal(new Set(accounted).size,accounted.length);
  assert.deepEqual(accounted.sort(),eligible);
  assert.equal(manifest.candidateCount,eligible.length);
  const selected=new Set(manifest.questions.map(q=>q.questionId));
  for(const row of manifest.duplicates) assert(selected.has(row.representedBy));
  for(const row of manifest.excludedCore) assert(coreIds.has(row.representedBy));
  assert(manifest.withheld.every(row=>row.reason && row.sourcePage));
});

test('Secondary is anatomy only, disjoint from Core and known repeated patterns',()=>{
  const paper=createNonCoreAnatomyExam(manifest,papers,core);
  assert(paper.questions.length>100);
  assert(!paper.sourcePaperIds);
  for(const [index,q] of paper.questions.entries()) {
    assert(!coreIds.has(q.id),q.id);
    assert.equal(mapping.questions[q.id].subjectId,'anatomy');
    assert(answerResolution(q).key,q.id);
    assert(q.originPaper.sourceUrl && q.originPaper.transcriptUrl);
    assert.equal(q.prompt,byId.get(q.id).prompt);
    assert.deepEqual(q.options,byId.get(q.id).options);
    for(const coreId of coreIds) assert(!questionsSharePattern(q,byId.get(coreId)),q.id+' overlaps '+coreId);
    for(const other of paper.questions.slice(index+1)) assert(!questionsSharePattern(q,other),q.id+' duplicates '+other.id);
    if(q.media) assert(fs.existsSync(new URL('public'+q.media,root)));
  }
  const review=JSON.parse(fs.readFileSync(new URL('data/cvs-noncore-anatomy-review.json',root),'utf8'));
  for(const id of Object.keys(review.coreEquivalents)) assert(!paper.questions.some(q=>q.id===id));
  for(const group of review.duplicateGroups) assert(paper.questions.filter(q=>group.includes(q.id)).length<=1);
});

test('Separate saved attempts retain answer provenance and anatomy section reports',()=>{
  const paper=createNonCoreAnatomyExam(manifest,papers,core);
  assert.equal(paper.id,NON_CORE_ANATOMY_ID);
  assert.notEqual(paper.id,coreExamId('all'));assert.notEqual(paper.id,coreExamId('anatomy'));
  const q=paper.questions[0];
  const attempt=answerPaperQuestion(paper,newPaperAttempt(paper),q.id,answerResolution(q).key);
  const progress=emptyPaperProgress();progress.attempts[paper.id]=attempt;
  const restored=readPaperProgress(JSON.stringify(progress));
  assert.deepEqual(restorePaperAttempt(restored.attempts[paper.id],paper),attempt);
  const report=gradePaperBreakdown(paper,attempt,mapping);
  assert.equal(report.overall.correct,1);
  assert.equal(report.subjects.length,1);assert.equal(report.subjects[0].id,'anatomy');
  assert(report.topics.length>1);
});

test('Missing sources, outdated Core and overlapping records fail closed',()=>{
  assert.throws(()=>createNonCoreAnatomyExam(manifest,[],core),/could not load/);
  assert.throws(()=>createNonCoreAnatomyExam({...manifest,coreFingerprint:'outdated'},papers,core),/refresh/);
  assert.throws(()=>createNonCoreAnatomyExam({...manifest,questions:[core.questions[0]]},papers,core),/overlapping/);
  assert.throws(()=>createNonCoreAnatomyExam({...manifest,questions:[manifest.questions[0],manifest.questions[0]]},papers,core),/Duplicate/);
});

test('Generated selection is reproducible from current source and Core manifests',()=>{
  execFileSync(process.execPath,['scripts/content/build-cvs-noncore-anatomy.mjs','--check'],{cwd:root});
});
