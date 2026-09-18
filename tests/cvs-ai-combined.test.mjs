import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { answerResolution, applyAnswerOverlay, createCombinedPaper, combinedPaperId, questionContentHash } from '../src/lib/mcq/cvs-paper-enhancements.mjs';
import { newPaperAttempt, answerPaperQuestion, restorePaperAttempt, gradePaperBreakdown, gradePaper, readPaperProgress } from '../src/lib/mcq/cvs-paper-state.mjs';

const q = {id:'p1-q1', number:'1', prompt:'Which?', options:['One','Two','Three','Four'], scoringKey:null, issues:['OCR provisional']};
const p = {id:'p1',title:'First paper',fingerprint:'original',questions:[q],sourceUrl:'/p1.pdf',transcriptUrl:'/p1.md'};
const ai = {answer:'B', confidence:'high', explanation:'Reason.',references:[{title:'Reference',url:'https://example.org'}],reviewStatus:'verified'};
const overlay = async entry => ({revision:'v1',questions:{[q.id]:{...ai,questionHash:await questionContentHash(q),...entry}}});

test('reviewed AI is a distinct provenance, never overwrites a reliable source key', async () => {
  const before = JSON.stringify(p);
  const proposed = await applyAnswerOverlay(p, await overlay());
  assert.deepEqual(answerResolution(proposed.questions[0]), {key:'B',kind:'ai'});
  assert.equal(JSON.stringify(p), before);
  const source = {...q,scoringKey:'A',issues:[]};
  assert.deepEqual(answerResolution({...source,aiAnswer:ai}), {key:'A',kind:'source'});
  for (const amendment of [{reviewStatus:'pending'},{confidence:'unresolved'},{answer:null},{answer:'E'}]) {
    assert.equal(answerResolution({...q,aiAnswer:{...ai,...amendment}}).key,null);
  }
  const stale = await applyAnswerOverlay(p, await overlay({questionHash:'stale'}));
  assert.equal(stale.questions[0].aiAnswer,undefined);
});

test('AI grades persist separately in section reports with source and manual counts', async () => {
  const paper = await applyAnswerOverlay({...p,questions:[q,{...q,id:'p1-q2',scoringKey:'A',issues:[]},{...q,id:'p1-q3'}]},await overlay());
  let attempt = newPaperAttempt(paper);
  attempt = answerPaperQuestion(paper,attempt,q.id,'A');
  attempt = answerPaperQuestion(paper,attempt,'p1-q2','A');
  attempt = answerPaperQuestion(paper,attempt,'p1-q3','C');
  const report = gradePaperBreakdown(paper,attempt);
  assert.equal(report.overall.sourceKeyed,1);
  assert.equal(report.overall.aiKeyed,1);
  assert.equal(report.overall.aiIncorrect,1);
  assert.equal(report.overall.ungraded,1);
  assert.equal(report.overall.percentage,50);
  assert.deepEqual(report.wrongQuestionIds,[q.id]);
  const result = {...gradePaper(paper,attempt),sectionStats:report};
  const stored = {version:1,attempts:{p1:attempt},latest:{p1:result}};
  assert.deepEqual(readPaperProgress(JSON.stringify(stored)),stored);
  assert.equal(result.keyed,1);
  assert.equal(result.aiKeyed,1);
  assert.equal(result.aiMatched,0);
});

test('source-verified OCR corrections invalidate only affected previous responses', async () => {
  const base = {...p,questions:[q,{...q,id:'p1-q2'}]};
  const attempt = newPaperAttempt(base);
  attempt.answers = {[q.id]:'B','p1-q2':'A'};
  attempt.completedAt = new Date().toISOString();
  const paper = await applyAnswerOverlay(base,await overlay({sourcePageVerified:true,correctedOptions:['New first','New second']}));
  assert.deepEqual(paper.questions[0].options,['New first','New second']);
  assert.deepEqual(paper.questions[0].originalOptions,q.options);
  const restored = restorePaperAttempt(attempt,paper);
  assert.deepEqual(restored.answers,{'p1-q2':'A'});
  assert.equal(restored.completedAt,null);
  const answered = answerPaperQuestion(paper,restored,q.id,'B');
  assert.deepEqual(restorePaperAttempt(answered,paper).answers,answered.answers);
});

test('combined sessions preserve source identity, continuous items, and independent storage', async () => {
  const p2 = {...p,id:'p2',title:'Second paper',fingerprint:'other',questions:[{...q,id:'p2-q1'}]};
  const combined = createCombinedPaper([p2,p,p]);
  assert.equal(combined.id,combinedPaperId(['p1','p2']));
  assert.equal(combined.id,createCombinedPaper([p,p2]).id);
  assert.deepEqual(combined.sourcePaperIds,['p1','p2']);
  assert.deepEqual(combined.questions.map(q=>q.id),['p1-q1','p2-q1']);
  assert.equal(combined.questions[1].originPaper.title,'Second paper');
  assert.equal(combined.questions[0].originPaper.sourceUrl,'/p1.pdf');
  assert.equal(combined.questions[1].number,'1');
  const attempt = answerPaperQuestion(combined,newPaperAttempt(combined),'p1-q1','B');
  assert.equal(restorePaperAttempt(attempt,p),null);
  const report = gradePaperBreakdown(combined,attempt);
  assert.equal(report.overall.total,2);
  assert.deepEqual(report.missedQuestionIds,['p2-q1']);
  assert.throws(()=>createCombinedPaper([]));
  assert.throws(()=>createCombinedPaper([p,{...p2,questions:[q]}]));
  assert.notEqual(createCombinedPaper([p,{...p2,fingerprint:'updated'}]).fingerprint,combined.fingerprint);
});

test('correction removal invalidates answers and self-marks symmetrically', async () => {
  const corrected = await applyAnswerOverlay(p,await overlay({sourcePageVerified:true,correctedOptions:['New first','New second'],answer:null,confidence:'unresolved'}));
  const attempt = newPaperAttempt(corrected);
  attempt.answers[q.id]='A'; attempt.manual[q.id]='correct'; attempt.completedAt=new Date().toISOString();
  const restored = restorePaperAttempt(attempt,p);
  assert.deepEqual(restored.answers,{});
  assert.deepEqual(restored.manual,{});
  assert.equal(restored.completedAt,null);
  assert.equal(gradePaper(p,restored).manualGraded,0);
  const answered = answerPaperQuestion(p,restored,q.id,'B');
  assert.equal(gradePaperBreakdown(p,answered).overall.ungraded,1);
});

test('a source-verified prompt-only correction is displayed and revision tracked', async () => {
  const corrected = await applyAnswerOverlay(p,await overlay({sourcePageVerified:true,correctedPrompt:'Corrected question?'}));
  assert.equal(corrected.questions[0].prompt,'Corrected question?');
  assert.deepEqual(corrected.questions[0].options,q.options);
  assert.ok(corrected.questions[0].correctionRevision);
  const unsupported = await applyAnswerOverlay(p,await overlay({correctedPrompt:'Do not apply unverified edit'}));
  assert.equal(unsupported.questions[0].prompt,q.prompt);
});

test('an AI answer supersedes old optional self-marks, not source keys', async () => {
  const paper = await applyAnswerOverlay(p,await overlay());
  const attempt = newPaperAttempt(p);
  attempt.answers[q.id]='A';attempt.manual[q.id]='correct';
  const result = gradePaper(paper,attempt);
  assert.equal(result.manualGraded,0);
  assert.equal(result.aiMatched,0);
  assert.equal(gradePaperBreakdown(paper,attempt).overall.manualCorrect,0);
});

test('malformed optional persisted combined and AI metadata is discarded safely', () => {
  const attempt = {...newPaperAttempt(p),sourcePaperIds:'p1',correctionRevisions:42};
  const result = {...gradePaper(p,attempt),sourcePaperIds:'p1',aiKeyed:3,aiMatched:100};
  const read = readPaperProgress(JSON.stringify({version:1,attempts:{p1:attempt},latest:{p1:result}}));
  assert.equal(read.attempts.p1.sourcePaperIds,undefined);
  assert.equal(read.attempts.p1.correctionRevisions,undefined);
  assert.equal(read.latest.p1.sourcePaperIds,undefined);
  assert.equal(read.latest.p1.aiMatched,undefined);
});

test('every missing-key question has a second-reviewed, current, source-referenced annotation', async () => {
  const root=new URL('../public/study/cvs-past-papers/',import.meta.url);
  const data=JSON.parse(fs.readFileSync(new URL('ai-answers.json',root)));
  const summary=JSON.parse(fs.readFileSync(new URL('ai-summary.json',root)));
  const catalog=JSON.parse(fs.readFileSync(new URL('index.json',root)));
  const missing=[];
  for(const entry of catalog.papers){
    const paper=JSON.parse(fs.readFileSync(new URL(entry.id+'/paper.json',root)));
    const enriched=await applyAnswerOverlay(paper,data);
    assert.equal(summary[paper.id].proposed,enriched.questions.filter(q=>answerResolution(q).kind==='ai').length,paper.id);
    assert.equal(summary[paper.id].unresolved,enriched.questions.filter(q=>answerResolution(q).kind==='unresolved').length,paper.id);
    assert.equal(summary[paper.id].corrections,enriched.questions.filter(q=>q.correctionRevision).length,paper.id);
    for(const question of paper.questions){
      if(question.scoringKey && !question.issues.length) continue;
      missing.push(question.id);
      const review=data.questions[question.id];
      assert.ok(review,question.id);
      assert.equal(review.questionHash,await questionContentHash(question),question.id);
      assert.equal(review.reviewStatus,'verified',question.id);
      assert.ok(review.reviewer,question.id);
      assert.ok(review.explanation.length>15,question.id);
      assert.ok(review.references.length,question.id);
      assert.ok(review.references.every(ref=>/^https:\/\//.test(ref.url)&&ref.title),question.id);
      const enrichedQuestion=enriched.questions.find(q=>q.id===question.id);
      if(review.answer) assert.equal(answerResolution(enrichedQuestion).kind,'ai',question.id);
      else assert.equal(answerResolution(enrichedQuestion).kind,'unresolved',question.id);
      if(review.correctedOptions) assert.equal(review.sourcePageVerified,true,question.id);
    }
  }
  assert.equal(missing.length,657);
  assert.deepEqual(Object.keys(data.questions).sort(),missing.sort());
});
