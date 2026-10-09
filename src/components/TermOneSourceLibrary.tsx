"use client";
import {useEffect,useMemo,useState} from 'react';
import {cachedJson} from '@/src/lib/mcq/client-cache';
import {CachedPdfDownload} from './CachedPdfDownload';
import {StudyIcon} from './StudyIcon';
import styles from './TermOneSourceLibrary.module.css';

type SourcePaper={id:string;title:string;course:'tissue'|'biochemistry';kind:string;scope:'course'|'supplement';note:string;source:string;date:string|null;url:string;format:string;pages:number|null;bytes:number;mode:'source-only'};
type Catalog={collectedOn:string;papers:SourcePaper[]};
const labels:Record<string,string>={theory:'Theory',practical:'Practical',midterm:'Midterm',quiz:'Quiz',recall:'Recall / answer notes',practice:'Student compilation'};

/** Source scans are independent of scored collections, so importing them never resets saved attempts. */
export function TermOneSourceLibrary({exam}:{exam:string}) {
  const [catalog,setCatalog]=useState<Catalog|null>(null),[error,setError]=useState(false);
  const [query,setQuery]=useState(''),[filter,setFilter]=useState('all');
  const course=exam==='july25'?'tissue':'biochemistry';
  useEffect(()=>{let cancelled=false;void cachedJson<Catalog>('/study/term1-telegram/catalog.json').then(value=>{if(!cancelled)setCatalog(value);}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[]);
  const papers=useMemo(()=>catalog?.papers.filter(p=>p.course===course)??[],[catalog,course]);
  const shown=useMemo(()=>papers.filter(p=>{
    const matches=filter==='all'||(filter==='supplement'?p.scope==='supplement':filter==='course'?p.scope==='course':p.kind===filter);
    return matches&&`${p.title} ${p.note} ${p.source}`.toLowerCase().includes(query.toLowerCase().trim());
  }),[papers,filter,query]);
  if(error)return <p className="mcq-alert error">The original-paper library could not load. Reload to retry.</p>;
  if(!catalog)return <p role="status" className="mcq-loading">Loading original paper library…</p>;
  return <details className={styles.library}>
    <summary><StudyIcon name="papers"/><span><b>Telegram original-paper library</b><small>{papers.length} source entries · theory, practicals and supplements · added 9 Oct 2026</small></span></summary>
    <div className={styles.body}>
      <p className={styles.intro}>Read and download {course==='tissue'?'Tissue Development theory and practical papers':'Biochemistry I and Cell & Molecules papers'}. These scans preserve the supplied questions and answer marks. They are not additional scored attempts; source annotations may be wrong. The scored papers below retain your saved progress.</p>
      <div className={styles.controls}>
        <label>Find a paper<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Title, year or source…"/></label>
        <label>Show<select value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">All original sources</option><option value="course">Course papers</option><option value="theory">Theory</option><option value="practical">Practicals</option><option value="supplement">Supplements / other programs</option></select></label>
      </div>
      <p className={styles.count} role="status">{shown.length} of {papers.length} source entries</p>
      <div className={styles.grid}>{shown.map(paper=><article className={styles.paper} key={paper.id}>
        <div className={styles.meta}><span>{labels[paper.kind]??paper.kind}</span>{paper.scope==='supplement'&&<span>Supplement</span>}<span>{paper.pages?`${paper.pages} pages`:'Word document'}</span></div>
        <h3>{paper.title}</h3><p>{paper.note}</p>
        <small className={styles.source}>Source: {paper.source}</small>
        <div className="pill-row">
          {paper.format==='PDF'?<><a className="pill" href={paper.url} target="_blank" rel="noreferrer"><StudyIcon name="book"/>Read scan</a><CachedPdfDownload href={paper.url}><StudyIcon name="download"/>Download<small>PDF</small></CachedPdfDownload></>:<a className="pill" href={paper.url} download><StudyIcon name="download"/>Original document<small>DOCX</small></a>}
        </div>
      </article>)}</div>
      {!shown.length&&<p>No papers match this search.</p>}
      <p className={styles.foot}>Dates follow covers where available. Filename, repost and report-print dates are labelled separately. Repeated copies are grouped; DDS, PharmD, recall and student compilations are labelled as supplements. Password-protected material and personal student screenshots were not published.</p>
    </div>
  </details>;
}
