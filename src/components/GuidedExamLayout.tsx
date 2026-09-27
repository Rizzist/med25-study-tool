"use client";
import dynamic from 'next/dynamic';
import type {ReactNode} from 'react';
import {guidanceMode,type GuidanceMode} from '@/src/lib/mcq/guided-exam.mjs';
const GuidedReviewPane=dynamic(()=>import('./GuidedReviewPane').then(m=>m.GuidedReviewPane),{ssr:false,loading:()=> <aside className="guided-review-pane" role="status">Loading review reader…</aside>});
/** Question engines supply only their current ID and committed-answer state.
 * Source-paper IDs can use the same review map and paragraph sidecar as practice IDs. */
export function GuidedExamLayout({exam,mode,questionId,answered,children}:{exam:string;mode:GuidanceMode;questionId:string;answered:boolean;children:ReactNode}) {
  if(guidanceMode(exam,mode)!=='guided')return <>{children}</>;
  return <div className="guided-exam-layout"><div className="guided-question-pane">{children}</div><GuidedReviewPane exam={exam} questionId={questionId} answered={answered}/></div>;
}
