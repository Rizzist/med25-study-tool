"use client";
import type {ReactNode} from 'react';
import {paperPdf,type PaperSource} from '@/src/lib/paper-pdf/client';
import type {PaperVariant} from '@/src/lib/paper-pdf/document';
import {PillStatus,useDownloadPill} from './CachedPdfDownload';

/** A pill that typesets a past-paper PDF in the browser on demand and saves it. */
export function PaperPdfDownload({sources,variant,filename,courseTitle,footerLabel,children,className='dl-pill'}:{
  sources:PaperSource[];variant:PaperVariant;filename:string;courseTitle:string;footerLabel:string;children:ReactNode;className?:string;
}) {
  const pill=useDownloadPill();
  return <button type="button" className={`${className} is-${pill.state}`} {...pill.props} onClick={()=>void pill.run(sources.length>1?'Typesetting every paper…':'Typesetting PDF…',async()=>{
    const result=await paperPdf({sources,variant,courseTitle,footerLabel});
    pill.save(result.blob,filename);
    return result.fromCache?'Opened from device cache':result.cached?'Typeset · saved on this device':'Typeset · browser storage unavailable';
  },'The PDF could not be prepared. Please retry.')}>{children}<PillStatus state={pill.state} detail={pill.detail}/></button>;
}
