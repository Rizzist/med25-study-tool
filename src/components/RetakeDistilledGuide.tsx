"use client";
import {useEffect,useState} from 'react';
import {cachedJson} from '@/src/lib/mcq/client-cache';
import {RETAKE_GUIDE_URL,type RetakeDistilledGuide as Guide} from '@/src/lib/biochemistry/retake-distilled';
import {PillStatus,useDownloadPill} from './CachedPdfDownload';
import {StudyIcon} from './StudyIcon';

export function RetakeDistilledGuide(){
  const [guide,setGuide]=useState<Guide|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);const pill=useDownloadPill();
  useEffect(()=>{let active=true;setError('');void cachedJson<Guide>(RETAKE_GUIDE_URL).then(data=>{if(active)setGuide(data);}).catch(error=>{if(active)setError(error instanceof Error?error.message:'Guide could not load.');});return()=>{active=false;};},[retry]);
  if(error)return <div className="mcq-alert error" role="alert">The distilled guide could not load. <button type="button" className="pill" onClick={()=>setRetry(value=>value+1)}>Retry</button></div>;
  if(!guide)return <p className="mcq-loading" role="status">Loading the distilled Biochemistry I guide…</p>;
  return <section className="retake-distilled-guide" aria-labelledby="retake-guide-title">
    <div className="retake-guide-heading"><div><p className="retake-guide-kicker">Past-paper review</p><h2 id="retake-guide-title">{guide.title}</h2><p>{guide.conceptCount} reviewed concepts · {guide.sections.length} sections</p></div>
      <button type="button" className={`dl-pill is-${pill.state}`} disabled={pill.state==='busy'} {...pill.props} onClick={()=>void pill.run('Preparing the distilled guide…',async()=>{
        const {retakeGuidePdf}=await import('@/src/lib/biochemistry/retake-distilled');
        const blob=await retakeGuidePdf(guide);pill.save(blob,'biochemistry-retake-guide-distilled.pdf');return 'Distilled guide downloaded';
      },'The guide PDF could not be prepared. Please retry.')}><StudyIcon name="download"/>Guide PDF<PillStatus state={pill.state} detail={pill.detail}/></button>
    </div>
    {pill.state==='error'&&<p role="alert" className="mcq-alert error">{pill.detail}</p>}
    <p className="retake-guide-scope">{guide.scope}</p>
    <p className="retake-guide-full"><a href={guide.reviewUrl} target="_blank" rel="noreferrer">Open the complete reviewed course PDF</a></p>
    <details className="retake-guide-reader"><summary>Read distilled guide <small>{guide.conceptCount} concepts · {guide.sections.length} sections</small></summary>
    <div className="retake-guide-sections">{guide.sections.map(section=><details key={section.chapterId} className="retake-guide-section">
      <summary><span>{section.title}</span><small>{section.concepts.length} {section.concepts.length===1?'concept':'concepts'}</small></summary>
      <p className="retake-guide-focus">{section.focus}</p>
      {section.concepts.map(concept=><article key={concept.id} className="retake-guide-concept"><h3>{concept.title}</h3><ul>{concept.keyPoints.map((point,index)=><li key={index}>{point}</li>)}</ul>
        <details className="retake-guide-explanation"><summary>Explanation</summary><p>{concept.summary}</p>{concept.correctionSourceUrl&&<p><a href={concept.correctionSourceUrl} target="_blank" rel="noreferrer">Reviewed clarification · clinical guideline</a></p>}</details>
      </article>)}
      <details className="retake-guide-evidence"><summary>Original question evidence · {section.sourceQuestions.length}</summary><ul>{section.sourceQuestions.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} · Q{source.number}</a></li>)}</ul></details>
      {section.reviewUrl&&<a className="retake-guide-review-link" href={section.reviewUrl} target="_blank" rel="noreferrer"><StudyIcon name="book"/>Complete review · p. {section.pdfPage}</a>}
    </details>)}</div></details>
  </section>;
}
