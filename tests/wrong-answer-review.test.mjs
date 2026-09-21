import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {answerWrongReview,emptyWrongReview,mcqReviewQuestions,paperReviewQuestions,readWrongReview,startWrongReview,wrongQuestionIds,wrongReviewStats,wrongReviewStorageKey} from '../src/lib/mcq/wrong-answer-review.mjs';
import {reviewBreakdown} from '../src/lib/mcq/review-results.mjs';

const question=id=>({id,prompt:'Question '+id,options:[{id:'A',text:'First'},{id:'B',text:'Second'}],correctIds:['B'],revision:1});
const questions=['one','two','three','skip','unknown'].map(question);
const outcomes=questions.map(q=>({questionId:q.id,answered:q.id!=='skip',correct:q.id==='three',gradable:q.id!=='unknown',topic:q.id==='two'?'Section B':'Section A'}));
const original={id:'attempt',startedAt:'2026-09-21T00:00:00Z',completedAt:'2026-09-21T01:00:00Z',answers:{one:'A',two:'A',three:'B',unknown:'A'},score:33};

test('all-wrong and section review exclude correct, skipped, ungraded and duplicate IDs',()=>{
  assert.deepEqual(wrongQuestionIds(outcomes),['one','two']);
  const all=startWrongReview(emptyWrongReview(),[...questions.map(q=>q.id),'one'],'All',questions,outcomes);
  assert.deepEqual(all.run.ids,['one','two']);
  const rows=reviewBreakdown(outcomes);
  const section=rows.find(r=>r.id==='Section A');
  assert.deepEqual(section.wrongIds,['one']);assert(section.missedIds.includes('skip'));
  const subset=startWrongReview(all,section.wrongIds,section.title,questions,outcomes);
  assert.deepEqual(subset.run.ids,['one']);
});
test('review updates only its own record; initial scores, section bars and first answers remain immutable',()=>{
  const before=JSON.stringify(original),beforeRows=reviewBreakdown(outcomes);
  const state=startWrongReview(emptyWrongReview(),wrongQuestionIds(outcomes),'All',questions,outcomes);
  const next=answerWrongReview(state,questions[0],'B');
  assert.notEqual(next,state);assert.deepEqual(state.answers,{});
  assert.equal(JSON.stringify(original),before);assert.deepEqual(reviewBreakdown(outcomes),beforeRows);
  assert.deepEqual(wrongReviewStats(['one','two'],next.answers),{correct:1,reviewed:1,total:2,percent:50});
  assert.equal(answerWrongReview(next,questions[0],'A'),next,'first review answer is locked within this run');
  assert.equal(answerWrongReview(next,questions[2],'B'),next,'correct original question is not in retry');
  assert.equal(answerWrongReview(next,questions[1],'invalid'),next);
});
test('latest review is counted once per question across section and all-wrong repeats',()=>{
  let state=startWrongReview(emptyWrongReview(),['one','two'],'All',questions,outcomes);
  state=answerWrongReview(state,questions[0],'B');state=answerWrongReview(state,questions[1],'A');
  assert.equal(wrongReviewStats(['one','two'],state.answers).percent,50);
  state=startWrongReview(state,['two'],'B section',questions,outcomes);
  assert.deepEqual(state.run.answers,{});state=answerWrongReview(state,questions[1],'B');
  assert.equal(wrongReviewStats(['one','two','two'],state.answers).percent,100);
  state=startWrongReview(state,['one'],'A section',questions,outcomes);
  state=answerWrongReview(state,questions[0],'A');
  assert.equal(wrongReviewStats(['one','two'],state.answers).percent,50,'latest review answer, not inflated lifetime credit');
});
test('partial review resumes after reload; new attempts and course/paper combinations are isolated',()=>{
  let state=startWrongReview(emptyWrongReview(),['one','two'],'All',questions,outcomes);
  state=answerWrongReview(state,questions[0],'B');state={...state,run:{...state.run,index:1}};
  assert.deepEqual(readWrongReview(JSON.stringify(state),questions,outcomes),state);
  assert.notEqual(wrongReviewStorageKey('paper:attempt1'),wrongReviewStorageKey('paper:attempt2'));
  assert.notEqual(wrongReviewStorageKey('paper:attempt1'),wrongReviewStorageKey('combined:attempt1'));
  assert(!wrongReviewStorageKey('paper:attempt1').startsWith('med25-final-exam'));
  state={...state,run:null};assert.deepEqual(readWrongReview(JSON.stringify(state),questions,outcomes),state);
});
test('changed question content invalidates only its review answer, and corrupted storage is harmless',()=>{
  let state=startWrongReview(emptyWrongReview(),['one','two'],'All',questions,outcomes);
  state=answerWrongReview(state,questions[0],'B');state=answerWrongReview(state,questions[1],'B');
  const updated=questions.map(q=>q.id==='one'?{...q,revision:2}:q);
  const restored=readWrongReview(JSON.stringify(state),updated,outcomes);
  assert.deepEqual(Object.keys(restored.answers),['two']);assert.deepEqual(Object.keys(restored.run.answers),['two']);
  for(const raw of ['invalid',null,'[]','{}','{"version":1,"answers":null}'])assert.deepEqual(readWrongReview(raw,questions,outcomes),emptyWrongReview());
  state.answers.one.correct=false;
  assert.equal(readWrongReview(JSON.stringify(state),questions,outcomes).answers.one.correct,true,'never trust persisted score');
});
test('MCQ and CVS adapters preserve alternative keys, inference shading, figures and unresolved status',()=>{
  const q=mcqReviewQuestions([{...question('generic'),correctOptionId:'A',acceptedOptionIds:['B'],answerReview:{basis:'ai-inferred'},media:[{type:'audio',url:'/sound.mp3'}]}])[0];
  assert.deepEqual(q.correctIds,['A','B']);assert.equal(q.inferred,true);assert(q.mediaQuestion.media.length);
  const paper=paperReviewQuestions([{id:'cvs',prompt:'CVS',options:['First','Second'],scoringKey:null,issues:[],media:'/scan.png',aiAnswer:{answer:'B',confidence:'high',reviewStatus:'verified',explanation:'Because'}},{id:'ungraded',prompt:'Unknown',options:['First','Second'],issues:[]}]);
  assert.deepEqual(paper[0].correctIds,['B']);assert.equal(paper[0].imageUrl,'/scan.png');assert(paper[0].inferred);
  assert.deepEqual(paper[1].correctIds,[]);
  assert.equal(startWrongReview(emptyWrongReview(),['ungraded'],'Unkeyed',paper,[{questionId:'ungraded',answered:true,correct:false}]).run,null);
});

const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url),cache=new Map();
function load(file){
  if(cache.has(file))return cache.get(file).exports;
  if(file.endsWith('.mjs'))return require(file);
  const module={exports:{}};cache.set(file,module);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const local=id=>{if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);const base=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);return load([base,base+'.ts',base+'.tsx'].find(p=>fs.existsSync(p)));};
  new Function('require','module','exports',code)(local,module,module.exports);return module.exports;
}
test('rendered final sections retain original bars and add labeled yellow review bars and per-section redo',()=>{
  const {CourseReviewReport}=load(path.join(root,'src/components/CourseReview.tsx'));
  let state=startWrongReview(emptyWrongReview(),['one'],'All',questions,outcomes);state=answerWrongReview(state,questions[0],'B');
  const html=renderToStaticMarkup(createElement(CourseReviewReport,{exam:'july25',outcomes,reviewAnswers:state.answers,retryableIds:['one','two'],onRetryWrong(){}}));
  assert.match(html,/Original attempt: 1 correct of 2 answered/);assert.match(html,/Review: 1 of 1 originally wrong questions corrected/);
  assert.match(html,/review-bar-yellow/);assert.match(html,/Redo wrong \(1\)/);assert.match(html,/50%/);assert.match(html,/Review · 100% corrected/);
});
test('past paper, CVS and saved practice reports all use isolated reviews, not re-scored original attempts',()=>{
  for(const file of ['src/components/FinalExam.tsx','src/components/CvsPastExams.tsx','app/page.tsx']){
    const code=fs.readFileSync(path.join(root,file),'utf8');assert.match(code,/<WrongAnswerReview /);assert.match(code,/attemptId=/);
  }
  const code=fs.readFileSync(path.join(root,'src/components/WrongAnswerReview.tsx'),'utf8');
  assert.doesNotMatch(code,/FINAL_EXAM_STORAGE_KEY|CVS_PAPER_STORAGE_KEY|updateAttempt|setProgress/);
  assert.match(code,/showModal/);assert.match(code,/Resume review/);
});
