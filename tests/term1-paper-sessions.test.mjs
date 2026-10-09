import test from 'node:test';
import assert from 'node:assert/strict';
import {isFinalAnswerCorrect,isFinalQuestionGraded,reconcileFinalExamSession,parseFinalExamProgress} from '../src/lib/mcq/final-exam-state.mjs';
import {selectCollectionQuestions} from '../src/lib/mcq/curated-core.mjs';
import {combinedSourceSelection,paperAttemptSummary,finalPaperKey} from '../src/lib/mcq/paper-selection.mjs';
import {wrongQuestionIds} from '../src/lib/mcq/wrong-answer-review.mjs';
const scored={id:'scored',revision:1,correctOptionId:'A',options:[{id:'A',text:'Alpha'},{id:'B',text:'Beta'}]};
const unkeyed={id:'unkeyed',revision:1,correctOptionId:'',options:[{id:'A',text:'Alpha'},{id:'B',text:'Beta'}]};
const written={id:'written',revision:1,correctOptionId:'',options:[]};
const questions=[scored,unkeyed,written];
const paper={id:'bio-source-paper',title:'Source paper',gradedQuestionIds:['scored'],takeableQuestionIds:questions.map(q=>q.id),independent:true};

test('taking and combining preserves source order, includes ungraded questions and rejects missing members',async()=>{
 assert.deepEqual(selectCollectionQuestions([...questions].reverse(),paper),questions);
 assert.throws(()=>selectCollectionQuestions([scored],paper),/no partial test/);
 const combined=await combinedSourceSelection([paper,{id:'second',gradedQuestionIds:['scored'],takeableQuestionIds:['scored','another']}],['second',paper.id]);
 assert.deepEqual(combined.takeableQuestionIds,['scored','unkeyed','written','another']);
 assert.deepEqual(combined.gradedQuestionIds,['scored']);
 const onlyUngraded=await combinedSourceSelection([{id:'unkeyed-paper',gradedQuestionIds:[],takeableQuestionIds:['unkeyed','written']}],['unkeyed-paper']);
 assert.deepEqual(onlyUngraded.takeableQuestionIds,['unkeyed','written']);
 assert.equal((await combinedSourceSelection([paper],[paper.id])).id,(await combinedSourceSelection([paper],[paper.id])).id);
});
test('unkeyed and written responses resume, complete the paper and never count as wrong',()=>{
 const at='2026-10-09T01:00:00Z';
 const answers=Object.fromEntries(questions.map(q=>[q.id,{selectedOptionId:q.options.length?'A':'response',...(q.options.length?{}:{responseText:'A detailed written response that survives a reload.'}),correct:q.id==='scored',...(!q.correctOptionId?{graded:false}:{}),correctOptionId:q.correctOptionId,questionRevision:q.revision,answeredAt:at}]));
 const restored=reconcileFinalExamSession({questionIds:paper.takeableQuestionIds,answers,completedAt:at},questions,'source-v1');
 assert.equal(restored.completedAt,at);assert.deepEqual(restored.answers,answers);
 assert.equal(isFinalQuestionGraded(unkeyed),false);assert.equal(isFinalAnswerCorrect(unkeyed,'A'),false);
 const key=finalPaperKey('july29',paper.id),saved={version:2,sessions:{[key]:restored}};
 assert.deepEqual(paperAttemptSummary(saved,'july29',paper),{answered:3,correct:1,total:3,gradedTotal:1,ungraded:2,completedAt:at});
 assert.deepEqual(parseFinalExamProgress(JSON.stringify(saved)).sessions[key],restored);
 assert.deepEqual(wrongQuestionIds(questions.map(q=>({questionId:q.id,answered:true,correct:restored.answers[q.id].correct,gradable:isFinalQuestionGraded(q)}))),[]);
});
test('a changed answer key or invalid written response invalidates only that answer',()=>{
 const value={questionIds:['written','unkeyed'],answers:{written:{selectedOptionId:'response',responseText:'',questionRevision:1,correctOptionId:''},unkeyed:{selectedOptionId:'A',questionRevision:1,correctOptionId:'',correct:false,graded:false}}};
 assert.deepEqual(reconcileFinalExamSession(value,[written,{...unkeyed,correctOptionId:'A'}],'v2').answers,{});
});
