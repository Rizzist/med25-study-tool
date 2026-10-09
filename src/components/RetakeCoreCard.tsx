"use client";
import {useEffect,useState} from 'react';
import {cachedJson} from '@/src/lib/mcq/client-cache';
import {coreSelection,type ExamCollection} from '@/src/lib/mcq/curated-core.mjs';
import {paperAttemptSummary} from '@/src/lib/mcq/paper-selection.mjs';
import {RETAKE_CORE_URL,type RetakeCoreManifest} from '@/src/lib/biochemistry/retake-distilled';
import {PastPaperCard} from './PastPaperCard';
import {PaperPdfDownload} from './PaperPdfDownload';
import {CachedPdfDownload} from './CachedPdfDownload';
import {StudyIcon} from './StudyIcon';

function useRetakeCore(){
  const [manifest,setManifest]=useState<RetakeCoreManifest|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{let active=true;setError('');
    void cachedJson<RetakeCoreManifest>(RETAKE_CORE_URL).then(data=>{if(active)setManifest(data);}).catch(error=>{if(active)setError(error instanceof Error?error.message:'Core Exam could not load.');});
    return()=>{active=false;};
  },[retry]);
  return {manifest,error,retry:()=>setRetry(value=>value+1)};
}
function CoreDownloadPills({manifest,selection}:{manifest:RetakeCoreManifest;selection:ExamCollection}){
  const item=manifest.downloadCollection;
  const ids=selection.gradedQuestionIds;
  return <div className="paper-downloads" aria-label="Core Exam downloads">
    {(['questions','key','both'] as const).map(variant=><PaperPdfDownload key={variant}
      sources={[{url:item.downloads[variant==='questions'?'questions':variant==='key'?'answerKey':'questionsAndKey'],collection:{id:selection.id,title:selection.title,gradedQuestionCount:ids.length,sourceRecordCount:ids.length,ungradedCount:0},questionSelection:{ids,label:'Distilled Core'}}]}
      variant={variant} filename={`${selection.id}-${variant}-distilled.pdf`} courseTitle="Biochemistry I Retake" footerLabel={`MED//25 · ${selection.title} · Distilled`}>
      <StudyIcon name="download"/>{variant==='questions'?'Questions':variant==='key'?'Answer key':'Questions + key'}<small>PDF</small>
    </PaperPdfDownload>)}
  </div>;
}
export function RetakeCoreDownloads({selection}:{selection:ExamCollection}){
  const {manifest,error,retry}=useRetakeCore();
  if(error)return <p role="alert" className="mcq-alert error">Core downloads could not load. <button className="pill" type="button" onClick={retry}>Retry</button></p>;
  if(!manifest)return <p role="status" className="mcq-loading">Loading Core downloads…</p>;
  return <CoreDownloadPills manifest={manifest} selection={selection}/>;
}
export function RetakeCoreCard({saved,onOpen}:{saved:unknown;onOpen:(selection:ExamCollection,fresh?:boolean)=>void}){
  const {manifest,error,retry}=useRetakeCore();const [scope,setScope]=useState('');
  if(error)return <div className="mcq-alert error" role="alert">Core Exam could not load. <button className="pill" type="button" onClick={retry}>Retry</button></div>;
  if(!manifest)return <p role="status" className="mcq-loading">Loading Biochemistry I Core Exam…</p>;
  const full=coreSelection(manifest),section=scope&&manifest.sections.some(s=>s.id===scope)?coreSelection(manifest,scope):null;
  function launch(selection:ExamCollection,main=false){
    const previous=paperAttemptSummary(saved,'term1-biochemistry-retake',selection);
    return <div className="core-scope-launch">
      <button type="button" className={main?'primary':'pill'} onClick={()=>onOpen(selection)}>{previous?previous.completedAt?'Results & review':'Resume':'Take exam'} · {selection.gradedQuestionIds.length}</button>
      {previous&&<><small>{previous.completedAt?`${previous.correct}/${previous.total} correct`:`${previous.answered}/${previous.total} answered`}</small><button type="button" className="pill small" onClick={()=>onOpen(selection,true)}>New attempt</button></>}
    </div>;
  }
  return <div className="retake-core-card"><PastPaperCard featured badge="Start here" label="Core exam · repeated past questions" title={manifest.title??'Biochemistry I Core Exam'} note={manifest.methodology}>
    <p className="paper-lead"><b>{manifest.questions.length} distinct repeated questions</b>. {manifest.sourceFamilyCount} exam source families reviewed; each repeated question appears once.</p>
    <div className="paper-card-actions">{launch(full,true)}</div>
    <CoreDownloadPills manifest={manifest} selection={full}/>
    <details className="core-section-details"><summary>Focus a chapter</summary><div className="core-section-picker">
      <label className="mcq-sr-only" htmlFor="retake-core-chapter">Core Exam chapter</label>
      <select id="retake-core-chapter" value={scope} onChange={event=>setScope(event.target.value)}><option value="">Choose a chapter…</option>{manifest.sections.filter(s=>s.count>0).map(s=><option key={s.id} value={s.id}>{s.title} · {s.count}</option>)}</select>
      {section&&launch(section)}
    </div>{section&&<CoreDownloadPills manifest={manifest} selection={section}/>}</details>
    <details className="core-evidence"><summary>Repeated questions and source evidence</summary>
      <p>{manifest.sourceQuestionCount} in-scope source questions were reviewed. Reordered copies count as one family; recall notes and student practice do not add exam recurrence votes. Counts describe these sources, not exam predictions.</p>
      <div className="core-pattern-list">{manifest.questions.map(row=><details key={row.questionId}><summary><span>{row.sourceCollectionCount} source families</span>{row.questionText||row.reason}</summary>
        <p>{row.sectionTitle} · {row.reason}</p><ul>{row.members.map(member=><li key={member.questionId}><a href={member.sourceUrl} target="_blank" rel="noreferrer">{manifest.papers.find(p=>p.id===member.paperId)?.title??member.paperId} · Q{member.sourceNumber}</a></li>)}</ul>
      </details>)}</div>
    </details>
    <details className="retake-core-originals"><summary>Complete source originals</summary><p>Full source papers retain their original questions and annotations.</p><ul>{manifest.papers.map(paper=><li key={paper.id}>
      <a href={paper.url} target="_blank" rel="noreferrer">{paper.title}</a>
      {/\.pdf(?:[?#]|$)/i.test(paper.url)?<CachedPdfDownload href={paper.url}><StudyIcon name="download"/>Original PDF</CachedPdfDownload>:<a className="pill" href={paper.url} download><StudyIcon name="download"/>Original document</a>}
    </li>)}</ul></details>
  </PastPaperCard></div>;
}
