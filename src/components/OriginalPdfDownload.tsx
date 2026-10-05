"use client";
import {PillStatus,useDownloadPill} from './CachedPdfDownload';
import {StudyIcon} from './StudyIcon';

/** One original download, independent of the active question/limb filter. */
export function OriginalPdfDownload({collectionId,title}:{collectionId:string;title:string}){
 const pill=useDownloadPill();
 return <button type="button" className={`dl-pill is-${pill.state}`} {...pill.props} onClick={()=>void pill.run('Preparing original PDF…',async()=>{
  const {originalPdf}=await import('@/src/lib/original-pdf/client');
  const result=await originalPdf({collectionId,title});
  pill.save(result.blob,`${collectionId}-original.pdf`);
  return result.fromCache?'Downloaded from device cache':result.cached?'Original pages combined · saved on this device':'Original pages combined · browser storage unavailable';
 },'The original PDF could not be prepared. Please retry.')}><StudyIcon name="download"/>Original<small>PDF</small><PillStatus state={pill.state} detail={pill.detail}/></button>;
}
