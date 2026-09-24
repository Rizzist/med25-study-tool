"use client";
import {useEffect,useState} from 'react';
import {cachedJson} from '@/src/lib/mcq/client-cache';
import {coreSelection,type CoreManifest,type ExamCollection} from '@/src/lib/mcq/curated-core.mjs';
import {paperAttemptSummary} from '@/src/lib/mcq/paper-selection.mjs';
import {PastPaperCard} from './PastPaperCard';

export function BiochemistryCoreCard({saved,onOpen,exam='term2-biochemistry'}:{saved:unknown;onOpen:(selection:ExamCollection,fresh?:boolean)=>void;exam?:'term2-biochemistry'|'term2-nutrition'}) {
  const subject=exam==='term2-nutrition'?'Nutrition':'Biochemistry';
  const manifestUrl=exam==='term2-nutrition'?'/study/nutrition/core-exam.json':'/study/biochemistry/core-exam.json';
  const [manifest,setManifest]=useState<CoreManifest|null>(null),[error,setError]=useState(''),[scope,setScope]=useState('');
  const [retry,setRetry]=useState(0);
  useEffect(()=>{let cancelled=false;setError('');setManifest(null);setScope('');void cachedJson<CoreManifest>(manifestUrl).then(data=>{if(!cancelled)setManifest(data);}).catch(e=>{if(!cancelled)setError(e.message);});return()=>{cancelled=true;};},[retry,manifestUrl]);
  if(error)return <div role="alert" className="mcq-alert error">Core Exam could not load. <button type="button" className="pill" onClick={()=>setRetry(v=>v+1)}>Retry</button></div>;
  if(!manifest)return <p role="status" className="mcq-loading">Loading {subject} Core selection and repeat counts…</p>;
  const full=coreSelection(manifest),repeat=coreSelection(manifest,'repeats');
  function launch(selection:ExamCollection) {
    const previous=paperAttemptSummary(saved,exam,selection);
    return <div className="core-scope-launch" key={selection.id}>
      <button type="button" className={selection.id===full.id?'primary':'pill'} onClick={()=>onOpen(selection)}>{previous?previous.completedAt?'Results & review':'Resume':'Start'} · {selection.id===full.id?'Full Core':selection.id===repeat.id?'Repeats Only':'Section'} · {selection.gradedQuestionIds.length}</button>
      {previous&&<><small>{previous.completedAt?`${Math.round(previous.correct/Math.max(1,previous.total)*100)}% · ${previous.correct}/${previous.total} correct`:`${previous.answered}/${previous.total} answered`}</small><button type="button" className="pill small" onClick={()=>onOpen(selection,true)}>New attempt</button></>}
    </div>;
  }
  return <div className="biochemistry-core-card"><PastPaperCard featured badge="★ Start here" label="Core exam · selected PYQs" title={`${subject} Core Exam`} note={manifest.methodology}>
    <p className="paper-lead"><b>{manifest.questions.length} selected questions</b> = <b>{manifest.repeatedPatternCount} repeated patterns</b> + {manifest.supplementalCount} additional core-coverage questions.</p>
    <p>{manifest.sourceQuestionCount} is the total across {manifest.sourceCollectionCount} main source collections—not the number of repeats. One representative per detected pattern; no 100-question cap. {manifest.exclusionNote??`The ${manifest.optionalQuestionCount}-item reconstruction is excluded.`}</p>
    <div className="paper-card-actions">{launch(full)}{launch(repeat)}</div>
    <div className="core-section-picker"><label htmlFor={`${exam}-core-section`}>Or focus a review section</label><select id={`${exam}-core-section`} value={scope} onChange={e=>setScope(e.target.value)}><option value="">Choose a section…</option>{manifest.sections.map(s=><option key={s.id} value={s.id}>{s.title} · {s.count}</option>)}</select>{scope&&launch(coreSelection(manifest,scope))}</div>
    <details className="core-evidence"><summary>Why these questions? Repeat evidence &amp; coverage</summary>
      <p>{manifest.repeatedSourceOccurrenceCount} source occurrences collapse into {manifest.repeatedPatternCount} repeated patterns. Collection counts are historical evidence, not predicted exam probabilities. A repeated topic alone is not counted as a repeated question.</p>
      <div className="core-pattern-list">{manifest.questions.map(row=><details key={row.questionId}><summary><span>{row.kind==='repeat'?`${row.sourceCollectionCount} collections`:'Additional coverage'}</span>{row.kind==='repeat'&&row.reason.startsWith('Same question')?row.sectionTitle+' · '+row.questionId:row.reason}</summary><p>Review: {row.sectionTitle}, PDF p. {row.pdfPage}.</p><ul>{row.members.map(m=><li key={m.questionId}><a href={m.sourceUrl} target="_blank" rel="noreferrer">{manifest.papers.find(p=>p.id===m.paperId)?.title} · Q{m.sourceNumber}</a></li>)}</ul></details>)}</div>
    </details>
  </PastPaperCard></div>;
}
