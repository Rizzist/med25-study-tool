"use client";
import {useCallback,useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {PDFDocumentProxy,RenderTask} from 'pdfjs-dist';
import {cachedJson} from '@/src/lib/mcq/client-cache';
import type {ReviewCourse} from '@/src/lib/mcq/review-results.mjs';
import {resolveGuidedReference,type GuidedAnchors} from '@/src/lib/mcq/guided-exam.mjs';
import {loadCachedPdf} from '../../public/med25-pdf-cache.mjs';
import {StudyIcon} from './StudyIcon';

function PdfPage({pdf,page,root,width,ratio,highlight}:{pdf:PDFDocumentProxy;page:number;root:HTMLDivElement|null;width:number;ratio:number;highlight?:number}) {
  const element=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const [visible,setVisible]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{root,rootMargin:'400px'});
    if(element.current)observer.observe(element.current);return()=>observer.disconnect();
  },[root]);
  useEffect(()=>{
    if(!visible||!canvas.current||!width)return;
    let cancelled=false,render:RenderTask|undefined;
    const target=canvas.current;setError('');
    void pdf.getPage(page).then(async source=>{
      if(cancelled)return;
      const viewport=source.getViewport({scale:width/source.getViewport({scale:1}).width});
      const dpr=Math.min(window.devicePixelRatio||1,1.5);
      target.width=Math.floor(viewport.width*dpr);target.height=Math.floor(viewport.height*dpr);
      render=source.render({canvas:target,viewport,transform:[dpr,0,0,dpr,0,0]});
      await render.promise;
    }).catch(e=>{if(!cancelled&&e.name!=='RenderingCancelledException')setError('Page could not render. Use Open PDF to read it.');});
    return()=>{cancelled=true;render?.cancel();};
  },[pdf,page,width,visible]);
  return <div ref={element} className="guided-pdf-page" data-page={page} style={{aspectRatio:ratio,width}} aria-label={`Review PDF page ${page}`}>
    {visible?<canvas ref={canvas} role="img" aria-label={`Course review, page ${page}`}/>:<span className="guided-page-placeholder">Page {page}</span>}
    {error&&<p role="alert">{error}</p>}
    {highlight!==undefined&&<span className="guided-paragraph-marker" style={{top:`${highlight*100}%`}} aria-label="Linked paragraph starts here"/>}
    <small className="guided-page-number">{page}</small>
  </div>;
}

export function GuidedReviewPane({exam,questionId,answered}:{exam:string;questionId:string;answered:boolean}) {
  const [course,setCourse]=useState<ReviewCourse|null>(null),[anchors,setAnchors]=useState<GuidedAnchors|null>(null);
  const [pdf,setPdf]=useState<PDFDocumentProxy|null>(null),[error,setError]=useState(''),[status,setStatus]=useState('Loading review index…');
  const [retry,setRetry]=useState(0),[fitWidth,setFitWidth]=useState(400),[zoom,setZoom]=useState(1),[ratio,setRatio]=useState(0.707),[pageNumber,setPageNumber]=useState('1');
  const width=fitWidth*zoom;
  const [root,setRoot]=useState<HTMLDivElement|null>(null),[autoJump,setAutoJump]=useState(true);
  const [detailsFor,setDetailsFor]=useState<string|null>(null);
  const detailsId=useId(),referenceButton=useRef<HTMLButtonElement>(null);
  const jumped=useRef('');
  const resizeAnchor=useRef<{page:number;top:number}|null>(null);
  const reference=useMemo(()=>resolveGuidedReference(course,anchors,questionId),[course,anchors,questionId]);
  const url=course?.volumes[0]?.url;
  useEffect(()=>{
    let cancelled=false;setCourse(null);setAnchors(null);setError('');setStatus('Loading review index…');
    void cachedJson<ReviewCourse>(`/study/reviews/${exam}.json`).then(c=>{if(!cancelled)setCourse(c);}).catch(()=>{if(!cancelled)setError('Review index could not load. Your answers are safe; retry when connected.');});
    void cachedJson<GuidedAnchors>(`/study/guided/${exam}.json`).then(a=>{if(!cancelled)setAnchors(a);}).catch(()=>{/* Current section links remain usable without paragraph metadata. */});
    return()=>{cancelled=true;};
  },[exam,retry]);
  useEffect(()=>{
    if(!url)return;
    let cancelled=false,task:ReturnType<typeof import('pdfjs-dist')['getDocument']>|undefined;
    setPdf(null);setStatus('Downloading review PDF · checking device cache…');jumped.current='';
    void Promise.all([import('pdfjs-dist'),loadCachedPdf(url)]).then(async([engine,result])=>{
      if(cancelled)return;
      engine.GlobalWorkerOptions.workerSrc=`/vendor/pdfjs/pdf.worker-${engine.version}.min.mjs`;
      const data=new Uint8Array(await result.response.arrayBuffer());if(cancelled)return;
      setStatus(result.fromCache?'Opening cached PDF…':'Preparing PDF pages…');
      task=engine.getDocument({data});
      const document=await task.promise;
      const first=await document.getPage(1);if(cancelled)return;
      const viewport=first.getViewport({scale:1});setRatio(viewport.width/viewport.height);setPdf(document);
      setStatus(result.fromCache?'PDF loaded from device cache':result.cached?'PDF saved on this device':'PDF ready · device cache unavailable');
    }).catch(()=>{if(!cancelled)setError('PDF could not open. Retry, or use Open PDF. Your exam answers are unaffected.');});
    return()=>{cancelled=true;void task?.destroy();};
  },[url,retry]);
  const rememberPosition=useCallback(()=>{
    if(!root)return;
    const y=root.getBoundingClientRect().top;
    const current=Array.from(root.querySelectorAll<HTMLElement>('[data-page]')).find(el=>el.getBoundingClientRect().bottom>y);
    if(current)resizeAnchor.current={page:Number(current.dataset.page),top:(y-current.getBoundingClientRect().top)/current.clientHeight};
  },[root]);
  useEffect(()=>{
    if(!root)return;
    const observer=new ResizeObserver(()=>{const next=Math.max(140,root.clientWidth-24);if(Math.abs(next-fitWidth)<1)return;rememberPosition();setFitWidth(next);});
    observer.observe(root);return()=>observer.disconnect();
  },[root,fitWidth,rememberPosition]);
  useLayoutEffect(()=>{
    const anchor=resizeAnchor.current,element=root?.querySelector<HTMLElement>(`[data-page="${anchor?.page}"]`);
    if(anchor&&element&&root){root.scrollTop=element.offsetTop+anchor.top*element.clientHeight;resizeAnchor.current=null;}
  },[root,width,ratio]);
  const jump=useCallback((page:number,top=0)=>{
    const element=root?.querySelector<HTMLElement>(`[data-page="${page}"]`);
    if(!element||!root)return;
    // Use viewport-relative rectangles: this remains correct if the scroll
    // container's offset parent changes between portrait and split layouts.
    root.scrollTo({top:root.scrollTop+element.getBoundingClientRect().top-root.getBoundingClientRect().top+top*element.clientHeight-16,behavior:'instant'});setPageNumber(String(page));
  },[root]);
  useEffect(()=>{
    if(!pdf||!answered||!reference||!autoJump)return;
    const key=`${questionId}:${reference.page}:${reference.top}`;
    if(jumped.current===key)return;jumped.current=key;jump(reference.page,reference.top);
  },[pdf,answered,reference,autoJump,questionId,jump]);
  // A new unanswered item leaves the reader at the student's position; only a committed answer navigates it.
  useEffect(()=>{if(!answered)jumped.current='';},[questionId,answered]);
  const linked=answered&&reference;
  const detailsOpen=Boolean(linked&&detailsFor===questionId);
  const referenceLabel=linked?`${reference.uncertain?'Suggested section':reference.precision==='paragraph'?'Paragraph':'Section'} · p. ${reference.page}`:answered?'No linked section':'Reference after answer';
  function closeDetails(){setDetailsFor(null);referenceButton.current?.focus();}
  return <aside className="guided-review-pane" aria-label="Guided review PDF">
    <header className="guided-review-header">
      <b className="guided-review-title" title="Review PDF"><StudyIcon name="book"/><span>Review</span></b>
      <div className="guided-review-controls guided-page-controls">
        <form onSubmit={e=>{e.preventDefault();const p=Number(pageNumber);if(pdf&&Number.isInteger(p)&&p>0&&p<=pdf.numPages)jump(p);}}><label><span className="mcq-sr-only">Page</span><input aria-label="PDF page number" type="number" min="1" max={pdf?.numPages??1} value={pageNumber} onChange={e=>setPageNumber(e.target.value)}/></label><span>/ {pdf?.numPages??'…'}</span><button type="submit" aria-label="Go to PDF page" disabled={!pdf}>↵</button></form>
      </div>
      <button ref={referenceButton} type="button" className="guided-reference-trigger" disabled={!linked} aria-expanded={detailsOpen} aria-controls={detailsId} aria-label={referenceLabel} title={linked?reference.title:'Browse freely. A review reference appears after you answer.'} onClick={()=>setDetailsFor(detailsOpen?null:questionId)}><span role="status">{linked?`Reference · ${reference.page}`:'Reference'}</span>{linked&&<span aria-hidden="true">⌄</span>}</button>
      <span className={`guided-cache-indicator ${pdf?'ready':''} ${error?'error':''}`} role="status" aria-label={error||status} title={error||status}/>
      <details className="guided-reader-settings" onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary')?.focus();}}}>
        <summary aria-label="PDF reader settings" title="Zoom & auto-jump">⋯</summary>
        <div className="guided-settings-popover guided-review-controls">
          <label className="guided-auto-jump"><input type="checkbox" checked={autoJump} onChange={e=>setAutoJump(e.target.checked)}/>Auto-jump after answering</label>
          <div className="guided-zoom"><span>Zoom</span><button type="button" aria-label="Zoom PDF out" disabled={zoom<=1} onClick={()=>{rememberPosition();setZoom(z=>Math.max(1,z-.25));}}>−</button><span>{Math.round(zoom*100)}%</span><button type="button" aria-label="Zoom PDF in" disabled={zoom>=2} onClick={()=>{rememberPosition();setZoom(z=>Math.min(2,z+.25));}}>+</button></div>
          <small>{error||status}</small>
        </div>
      </details>
      {url&&<a href={url} target="_blank" rel="noreferrer" aria-label="Open review PDF in a new tab" title="Open review PDF">↗</a>}
    </header>
    {detailsOpen&&linked&&<section id={detailsId} className="guided-reference-popover" aria-label="Question review reference" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();closeDetails();}}}>
      <div><b>{referenceLabel}</b><button type="button" aria-label="Close reference details" onClick={closeDetails}>×</button></div>
      <h3>{reference.title}</h3>{reference.quote&&<p>{reference.quote}</p>}
      <button type="button" disabled={!pdf} onClick={()=>{jump(reference.page,reference.top);closeDetails();}}>Back to question reference ↗</button>
    </section>}
    <div className="guided-pdf-scroll" ref={setRoot} tabIndex={0} aria-label="Scrollable review pages" onScroll={()=>{if(!root)return;const y=root.getBoundingClientRect().top+24;const page=Array.from(root.querySelectorAll<HTMLElement>('[data-page]')).find(el=>el.getBoundingClientRect().bottom>y);if(page)setPageNumber(page.dataset.page!);}}>
      {error?<div role="alert" className="guided-load-status"><p>{error}</p><button type="button" onClick={()=>setRetry(n=>n+1)}>Retry PDF</button></div>:!pdf&&<p role="status" className="guided-load-status">{status}</p>}
      {pdf&&Array.from({length:pdf.numPages},(_,i)=><PdfPage key={i+1} pdf={pdf} page={i+1} root={root} width={width} ratio={ratio} highlight={answered&&reference?.precision==='paragraph'&&reference.page===i+1?reference.top:undefined}/>)}</div>
  </aside>;
}
