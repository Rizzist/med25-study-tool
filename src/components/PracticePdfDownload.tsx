"use client";
import {useEffect,useRef,useState} from 'react';
import type {MCQQuestion} from '../lib/mcq/types';
import type {PracticePdfVariant} from '../lib/practice-pdf/document';
import {PillStatus,useDownloadPill} from './CachedPdfDownload';
import {StudyIcon} from './StudyIcon';

type Props={exam:string;title:string;version?:string;questionIds?:string[];scope?:'all'|'physio'|'non-physio';loadQuestions:(ids:string[])=>Promise<MCQQuestion[]>};
function PracticePdfPill({exam,title,version,questionIds,loadQuestions,variant,scope='all'}:{variant:PracticePdfVariant}&Props){
  const pill=useDownloadPill(),[progress,setProgress]=useState('');
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const ready=Boolean(version&&questionIds?.length),busy=pill.state==='busy';
  return <div className="practice-pdf-download">
    <button type="button" className={`dl-pill is-${pill.state}`} disabled={!ready||busy} {...pill.props}
      title={pill.detail||`Download all course practice questions ${variant==='both'?'with inline answers and explanations':'without answers'}`}
      onClick={()=>void pill.run('Preparing practice PDF…',async()=>{
        // Neither pdfmake nor the complete question bank is loaded until requested.
        const {practicePdf}=await import('../lib/practice-pdf/client');
        const result=await practicePdf({exam,title,version:version!,variant,questionIds:questionIds!,scope,loadQuestions,progress:text=>{if(mounted.current)setProgress(text);}});
        pill.save(result.blob,`${exam}${scope==='all'?'':`-${scope}`}-practice-mcqs-${variant==='both'?'with-answers':'without-answers'}.pdf`);
        return result.fromCache?'Downloaded from device cache':result.cached?'Downloaded · saved on this device':'Downloaded · device cache unavailable';
      },'Practice PDF could not download. Please retry.')}>
      <StudyIcon name="download"/>{variant==='both'?'Questions + key':'Questions'}<small>PDF</small><PillStatus state={pill.state} detail={pill.detail}/>
    </button>
    {busy&&<span className="practice-pdf-status" role="status">{progress||'Preparing full course bank…'}</span>}
    {pill.state==='error'&&<span className="practice-pdf-status error" role="alert">{pill.detail}</span>}
  </div>;
}
export function PracticePdfDownload(props:Props){
  return <div className="pill-row practice-pdf-downloads" role="group" aria-label="Practice MCQ PDF downloads">
    <span className="pill-note">Practice MCQs</span>
    <PracticePdfPill {...props} variant="questions"/>
    <PracticePdfPill {...props} variant="both"/>
  </div>;
}
