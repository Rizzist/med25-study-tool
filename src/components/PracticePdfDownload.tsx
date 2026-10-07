"use client";
import {useEffect,useRef,useState} from 'react';
import type {MCQQuestion} from '../lib/mcq/types';
import {PillStatus,useDownloadPill} from './CachedPdfDownload';
import {StudyIcon} from './StudyIcon';

export function PracticePdfDownload({exam,title,version,questionIds,loadQuestions}:{exam:string;title:string;version?:string;questionIds?:string[];loadQuestions:(ids:string[])=>Promise<MCQQuestion[]>}){
  const pill=useDownloadPill(),[progress,setProgress]=useState('');
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const ready=Boolean(version&&questionIds?.length),busy=pill.state==='busy';
  return <div className="practice-pdf-download">
    <button type="button" className={`dl-pill is-${pill.state}`} disabled={!ready||busy} {...pill.props}
      title={pill.detail||'Download all course practice questions, with answer key and explanations at the end'}
      onClick={()=>void pill.run('Preparing practice PDF…',async()=>{
        // Neither pdfmake nor the complete question bank is loaded until requested.
        const {practicePdf}=await import('../lib/practice-pdf/client');
        const result=await practicePdf({exam,title,version:version!,questionIds:questionIds!,loadQuestions,progress:text=>{if(mounted.current)setProgress(text);}});
        pill.save(result.blob,`${exam}-practice-mcqs.pdf`);
        return result.fromCache?'Downloaded from device cache':result.cached?'Downloaded · saved on this device':'Downloaded · device cache unavailable';
      },'Practice PDF could not download. Please retry.')}>
      <StudyIcon name="download"/>{busy?'Preparing PDF…':'Practice PDF'}<PillStatus state={pill.state} detail={pill.detail}/>
    </button>
    {busy&&<span className="practice-pdf-status" role="status">{progress||'Preparing full course bank…'}</span>}
    {pill.state==='error'&&<span className="practice-pdf-status error" role="alert">{pill.detail}</span>}
  </div>;
}
