"use client";
/* eslint-disable @next/next/no-img-element -- original paper figures */
import {useEffect,useRef,useState} from 'react';
import {CourseReviewReport} from './CourseReview';
import {QuestionMedia} from './QuestionMedia';
import {isLocationQuestion,locationOptionId} from '@/src/lib/mcq/anatomy-location.mjs';
import type {ReviewOutcome} from '@/src/lib/mcq/review-results.mjs';
import {answerWrongReview,canRetryQuestion,emptyWrongReview,readWrongReview,startWrongReview,wrongQuestionIds,wrongReviewStats,wrongReviewStorageKey,type RetryQuestion,type WrongReviewState} from '@/src/lib/mcq/wrong-answer-review.mjs';

type Props={exam:string;attemptId:string;questions:RetryQuestion[];outcomes:ReviewOutcome[]};
// Key the controller by attempt identity so a new attempt cannot inherit a review.
export function WrongAnswerReview(props:Props) {return <ReviewController key={props.attemptId} {...props}/>;}
function ReviewController({exam,attemptId,questions,outcomes}:Props) {
  const [state,setState]=useState<WrongReviewState>(emptyWrongReview);
  const [ready,setReady]=useState(false),[warning,setWarning]=useState(''),[open,setOpen]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null);
  const key=wrongReviewStorageKey(attemptId);
  const wrongIds=wrongQuestionIds(outcomes),eligible=wrongIds.filter(id=>questions.some(q=>q.id===id&&canRetryQuestion(q)));
  const eligibleSet=new Set(eligible),stats=wrongReviewStats(eligible,state.answers);
  // Input content can change following a bank refresh: drop only stale review answers.
  const inputs=JSON.stringify([questions.map(q=>[q.id,q.revision,q.prompt,q.options,q.correctIds]),outcomes]);
  useEffect(()=>{
    // Browser-only hydration: the server cannot read this device's saved review.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try {setState(readWrongReview(localStorage.getItem(key),questions,outcomes));}
    catch {setWarning('Browser storage is unavailable. Review progress will stay in this tab only.');}
    setReady(true);
    // Serialized content is the dependency, not freshly allocated adapter arrays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[key,inputs]);
  useEffect(()=>{
    const element=dialog.current;
    if(open)element?.showModal();else element?.close();
    return ()=>element?.close();
  },[open]);
  useEffect(()=>{if(open)heading.current?.focus();},[open,state.run?.index]);
  function save(next:WrongReviewState) {
    setState(next);
    try {localStorage.setItem(key,JSON.stringify(next));setWarning('');}
    catch {setWarning('Review progress remains in this tab, but could not be saved on this device.');}
  }
  function start(ids:string[],title:string) {
    const next=startWrongReview(state,ids,title,questions,outcomes);
    if(next!==state){save(next);setOpen(true);}
  }
  const run=state.run,q=run?questions.find(item=>item.id===run.ids[run.index]):undefined;
  const answer=q?run?.answers[q.id]:undefined;
  const answered=run?Object.keys(run.answers).length:0;
  const location=Boolean(q?.mediaQuestion&&isLocationQuestion(q.mediaQuestion));
  function submit(optionId?:string) {if(q&&optionId)save(answerWrongReview(state,q,optionId));}
  function close() {setOpen(false);}
  return <>
    <section className="wrong-review-summary" aria-label="Wrong-answer review">
      <div><h2>Redo your wrong answers</h2><p>Your original result stays unchanged. Yellow shows the latest review answer for each originally missed question; unreviewed questions do not count as corrected.</p></div>
      {!ready?<p role="status">Loading saved review progress…</p>:<>
        <div className="wrong-review-tools"><button className="primary" disabled={!eligible.length} onClick={()=>start(eligible,'All wrong answers')}>Redo all wrong ({eligible.length})</button>
          {run&&<button className="pill" onClick={()=>setOpen(true)}>Resume review ({Object.keys(run.answers).length}/{run.ids.length})</button>}
          {stats.total>0&&<span>{stats.correct}/{stats.total} corrected in review · {stats.reviewed} reviewed</span>}</div>
        {!wrongIds.length&&<p>No wrong answers to redo in this attempt.</p>}
        {wrongIds.length>eligible.length&&<p>{wrongIds.length-eligible.length} manually marked item(s) have no usable answer key. Inspect their original answers instead; they are not automatically scored in review.</p>}
      </>}
      {warning&&<p role="alert">{warning}</p>}
    </section>
    <CourseReviewReport exam={exam} outcomes={outcomes} reviewAnswers={state.answers} retryableIds={eligible} onRetryWrong={ready?(ids,title)=>start(ids.filter(id=>eligibleSet.has(id)),title):undefined}/>
    <dialog ref={dialog} className="wrong-review-dialog" aria-labelledby="wrong-review-title" onCancel={close} onClose={close}>
      {open&&run&&q&&<div className="wrong-review-page">
        <header><div><span className="eyebrow">Review only · original score unchanged</span><h1 id="wrong-review-title">{run.title}</h1><p>Question {run.index+1}/{run.ids.length} · {answered} answered in this review</p></div><button className="pill" onClick={close}>Save &amp; return to results</button></header>
        {warning&&<p role="alert">{warning}</p>}
        <progress value={answered} max={run.ids.length} aria-label="Review questions answered"/>
        <article className="wrong-review-question" key={q.id}>
          <h2 ref={heading} tabIndex={-1} dir="auto">{q.prompt}</h2>
          {q.imageUrl&&<img className="wrong-review-image" src={q.imageUrl} alt="Original question figure"/>}
          {q.mediaQuestion&&<QuestionMedia question={q.mediaQuestion} review={Boolean(answer)} locationAnswered={Boolean(answer)} onLocationSubmit={regionId=>submit(locationOptionId(q.mediaQuestion!,regionId))}/>}
          {location?<p>Choose the location on the image, then submit it.</p>:<div className={'options'+(answer?' locked':'')}>
            {q.options.map(option=><button type="button" key={option.id} disabled={Boolean(answer)} className={(answer?(q.correctIds.includes(option.id)?'correct':answer.optionId===option.id?'wrong':''):'')+(q.inferred?' inferred-answer':'')} onClick={()=>submit(option.id)}><span className="option-letter">{option.id}</span><span className="option-copy"><b>{option.text}</b></span></button>)}
          </div>}
          {answer&&<section className={'instant-feedback '+(answer.correct?'correct':'wrong')+(q.inferred?' inferred-answer':'')} aria-live="polite"><b>{answer.correct?'Correct in review':'Not correct yet'}</b><p>Correct answer: {q.options.filter(o=>q.correctIds.includes(o.id)).map(o=>o.text).join(' / ')}</p>{q.explanation&&<p>{q.explanation}</p>}</section>}
          <footer><button className="pill" disabled={run.index===0} onClick={()=>save({...state,run:{...run,index:run.index-1}})}>← Previous</button>
            {run.index<run.ids.length-1?<button className="primary" onClick={()=>save({...state,run:{...run,index:run.index+1}})}>Next question →</button>:<button className="primary" onClick={()=>{if(answered<run.ids.length){const index=run.ids.findIndex(id=>!run.answers[id]);save({...state,run:{...run,index}});}else{save({...state,run:null});close();}}}>{answered<run.ids.length?'Go to unanswered':'Finish review & see results'}</button>}</footer>
        </article>
      </div>}
    </dialog>
  </>;
}
