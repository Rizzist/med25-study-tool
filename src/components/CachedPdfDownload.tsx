"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {loadCachedPdf} from '../../public/med25-pdf-cache.mjs';
import {StudyIcon} from './StudyIcon';

export type PillState='idle'|'busy'|'done'|'error';
/** In-pill progress marker: a spinner while busy, a check once saved, a warning on failure. The text lives in the tooltip and a live region. */
export function PillStatus({state,detail}:{state:PillState;detail:string}) {
  return <>
    {state==='busy'&&<span className="pill-status busy" aria-hidden="true"/>}
    {state==='done'&&<StudyIcon name="check" className="pill-status done"/>}
    {state==='error'&&<span className="pill-status error" aria-hidden="true">!</span>}
    <span className="mcq-sr-only" role="status">{detail}</span>
  </>;
}
/** Shared pill lifecycle: one job at a time, no state updates after unmount, Blob saved through a temporary object URL. */
export function useDownloadPill() {
  const [state,setState]=useState<PillState>('idle'),[detail,setDetail]=useState('');
  const alive=useRef(true),busy=useRef(false);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const set=(next:PillState,text:string)=>{if(!alive.current)return;setState(next);setDetail(text);};
  const save=(blob:Blob,filename:string)=>{
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;
    document.body.appendChild(link);link.click();link.remove();
    // Revoked after the browser has had time to read the Blob; an early revoke can cancel the save in some browsers.
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  };
  const run=async(busyText:string,job:()=>Promise<string>,fallback:string)=>{
    if(busy.current)return;busy.current=true;set('busy',busyText);
    try{set('done',await job());}
    catch(error){set('error',error instanceof Error&&error.message?error.message:fallback);}
    finally{busy.current=false;}
  };
  const props={'aria-busy':state==='busy','aria-disabled':state==='busy'||undefined,title:detail||undefined};
  return {state,detail,run,save,props};
}
/** A download pill for a local PDF. Explicit Blob saving also covers browsers that bypass SW for download links. */
export function CachedPdfDownload({href,children,className='dl-pill'}:{href:string;children:ReactNode;className?:string}) {
  const pill=useDownloadPill();
  return <a className={`${className} is-${pill.state}`} href={href} download {...pill.props} onClick={event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    void pill.run('Preparing PDF…',async()=>{
      const result=await loadCachedPdf(href);
      pill.save(await result.response.blob(),decodeURIComponent(new URL(href,location.origin).pathname.split('/').pop()||'review.pdf'));
      return result.fromCache?'Downloaded from device cache':result.cached?'Downloaded · saved on this device':'Downloaded · browser storage unavailable';
    },'PDF could not download. Please retry.');
  }}>{children}<PillStatus state={pill.state} detail={pill.detail}/></a>;
}
