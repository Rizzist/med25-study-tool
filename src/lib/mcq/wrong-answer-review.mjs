import {answerResolution} from './cvs-paper-enhancements.mjs';

// Reviews have their own storage namespace. They never write to an exam/sprint record.
export const wrongReviewStorageKey = attemptId => 'med25-wrong-review-v1:' + encodeURIComponent(attemptId);
export const emptyWrongReview = () => ({version:1, answers:{}, run:null});
const record = value => value && typeof value === 'object' && !Array.isArray(value);
export const reviewQuestionSignature = q => JSON.stringify([q.prompt,q.options,q.correctIds,q.revision]);
export const wrongQuestionIds = outcomes => [...new Set(outcomes.filter(o => o.answered && !o.correct && o.gradable !== false).map(o => o.questionId))];
export const canRetryQuestion = q => q.options.length > 1 && q.correctIds.some(id => q.options.some(o => o.id === id));

export function mcqReviewQuestions(questions) {
  return questions.map(q => ({id:q.id,prompt:q.prompt,options:q.options,correctIds:[q.correctOptionId,...q.acceptedOptionIds??[]],revision:q.revision,
    explanation:q.explanation,inferred:q.answerReview?.basis === 'ai-inferred',mediaQuestion:q}));
}
export function paperReviewQuestions(questions) {
  return questions.map(q => {
    const answer=answerResolution(q);
    return {id:q.id,prompt:q.prompt,options:q.options.map((text,i)=>({id:'ABCDEF'[i],text})),correctIds:answer.key?[answer.key]:[],
      revision:q.correctionRevision??'',explanation:q.aiAnswer?.explanation||q.keyNote||'',inferred:answer.kind==='ai',imageUrl:q.media};
  });
}
export function readWrongReview(raw, questions, outcomes) {
  const empty=emptyWrongReview(), wrong=new Set(wrongQuestionIds(outcomes));
  const byId=new Map(questions.filter(q=>wrong.has(q.id)&&canRetryQuestion(q)).map(q=>[q.id,q]));
  try {
    const value=JSON.parse(raw);
    if(value?.version!==1 || !record(value.answers))return empty;
    const cleanAnswers = answers => Object.fromEntries(Object.entries(record(answers)?answers:{}).flatMap(([id,a])=>{
      const q=byId.get(id);
      if(!q || !record(a) || a.signature!==reviewQuestionSignature(q) || !q.options.some(o=>o.id===a.optionId) || typeof a.answeredAt!=='string')return [];
      return [[id,{optionId:a.optionId,correct:q.correctIds.includes(a.optionId),signature:a.signature,answeredAt:a.answeredAt}]];
    }));
    const answers=cleanAnswers(value.answers);
    const ids=Array.isArray(value.run?.ids)?[...new Set(value.run.ids.filter(id=>byId.has(id)))]:[];
    const run=ids.length?{ids,title:typeof value.run.title==='string'?value.run.title:'Wrong-answer review',index:Math.max(0,Math.min(ids.length-1,Number.isInteger(value.run.index)?value.run.index:0)),answers:Object.fromEntries(Object.entries(cleanAnswers(value.run.answers)).filter(([id])=>ids.includes(id)))}:null;
    return {version:1,answers,run};
  } catch {return empty;}
}
export function startWrongReview(state, ids, title, questions, outcomes) {
  const eligible=new Set(wrongQuestionIds(outcomes));
  const available=new Set(questions.filter(canRetryQuestion).map(q=>q.id));
  const selected=[...new Set(ids)].filter(id=>eligible.has(id)&&available.has(id));
  return selected.length?{...state,run:{ids:selected,title,index:0,answers:{}}}:state;
}
export function answerWrongReview(state, question, optionId, now=new Date().toISOString()) {
  if(!state.run?.ids.includes(question.id) || state.run.answers[question.id] || !canRetryQuestion(question) || !question.options.some(o=>o.id===optionId))return state;
  const answer={optionId,correct:question.correctIds.includes(optionId),signature:reviewQuestionSignature(question),answeredAt:now};
  return {...state,answers:{...state.answers,[question.id]:answer},run:{...state.run,answers:{...state.run.answers,[question.id]:answer}}};
}
export function wrongReviewStats(ids, answers) {
  const unique=[...new Set(ids)],reviewed=unique.filter(id=>answers[id]).length,correct=unique.filter(id=>answers[id]?.correct).length;
  return {total:unique.length,reviewed,correct,percent:unique.length?Math.round(correct/unique.length*100):0};
}
