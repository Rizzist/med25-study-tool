"use client";
import dynamic from 'next/dynamic';
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {guidanceMode,type GuidanceMode} from '@/src/lib/mcq/guided-exam.mjs';
import {GUIDED_SPLIT_KEY,DEFAULT_SPLIT,clampSplit,readSplit,splitAtPointer} from '@/src/lib/mcq/guided-split.mjs';
const GuidedReviewPane=dynamic(()=>import('./GuidedReviewPane').then(m=>m.GuidedReviewPane),{ssr:false,loading:()=> <aside className="guided-review-pane" role="status">Loading review reader…</aside>});
/** Question engines supply only their current ID and committed-answer state.
 * Source-paper IDs can use the same review map and paragraph sidecar as practice IDs. */
export function GuidedExamLayout({exam,mode,questionId,answered,children}:{exam:string;mode:GuidanceMode;questionId:string;answered:boolean;children:ReactNode}) {
  const container=useRef<HTMLDivElement>(null);
  const dragging=useRef(false);
  const [split,setSplit]=useState(DEFAULT_SPLIT);
  const [resizing,setResizing]=useState(false);
  useEffect(()=>{try{setSplit(readSplit(localStorage.getItem(GUIDED_SPLIT_KEY)));}catch{/* Private storage is optional. */}},[]);
  function update(value:number){
    const next=clampSplit(value);setSplit(next);
    try{localStorage.setItem(GUIDED_SPLIT_KEY,String(next));}catch{/* Resizing still works without storage. */}
  }
  if(guidanceMode(exam,mode)!=='guided')return <>{children}</>;
  return <div ref={container} className={`guided-exam-layout${resizing?' is-resizing':''}`} style={{'--guided-question-share':`${split}%`} as CSSProperties}>
    <div className="guided-question-pane" id="guided-questions">{children}</div>
    <div className="guided-splitter" role="separator" tabIndex={0} aria-label="Resize questions and review" aria-orientation="vertical" aria-controls="guided-questions" aria-valuemin={30} aria-valuemax={70} aria-valuenow={Math.round(split)} aria-valuetext={`${Math.round(split)} percent questions`} title="Drag to resize · arrow keys adjust · double-click to reset"
      onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();dragging.current=true;setResizing(true);event.currentTarget.setPointerCapture(event.pointerId);}}
      onPointerMove={event=>{if(!dragging.current||!container.current)return;const bounds=container.current.getBoundingClientRect();update(splitAtPointer(event.clientX,bounds.left,bounds.width));}}
      onPointerUp={event=>{dragging.current=false;setResizing(false);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
      onPointerCancel={()=>{dragging.current=false;setResizing(false);}}
      onLostPointerCapture={()=>{dragging.current=false;setResizing(false);}}
      onDoubleClick={()=>update(DEFAULT_SPLIT)}
      onKeyDown={event=>{const delta=event.shiftKey?10:2;if(event.key==='ArrowLeft'){event.preventDefault();update(split-delta);}else if(event.key==='ArrowRight'){event.preventDefault();update(split+delta);}else if(event.key==='Home'){event.preventDefault();update(30);}else if(event.key==='End'){event.preventDefault();update(70);}else if(event.key==='Enter'){event.preventDefault();update(DEFAULT_SPLIT);}}}>
      <span aria-hidden="true"/>
    </div>
    <GuidedReviewPane exam={exam} questionId={questionId} answered={answered}/>
  </div>;
}
