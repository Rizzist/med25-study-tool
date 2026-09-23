"use client";
import {useCallback,useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
import {cachedJson} from '@/src/lib/mcq/client-cache';
import type {ExamId} from '@/src/lib/mcq/exams.mjs';
import {PastPaperCard} from './PastPaperCard';
import {PaperDownloads,DownloadLibrary,paperSource,type DownloadCollection} from './PaperDownloads';
import {PaperPdfDownload} from './PaperPdfDownload';
import {StudyIcon} from './StudyIcon';
import {FINAL_EXAM_STORAGE_KEY,parseFinalExamProgress} from '@/src/lib/mcq/final-exam-state.mjs';
import {combinedSourceSelection,paperAttemptSummary,readCombinedSelections,COMBINED_PAPER_SELECTIONS_KEY} from '@/src/lib/mcq/paper-selection.mjs';
const CvsPastExams=dynamic(()=>import('./CvsPastExams').then(m=>m.CvsPastExams),{loading:()=> <p role="status" className="mcq-loading">Loading CVS paper tools…</p>});
const FinalExam=dynamic(()=>import('./FinalExam').then(m=>m.FinalExam),{loading:()=> <p role="status" className="mcq-loading">Loading selected paper…</p>});
const NutritionArchive=dynamic(()=>import('./NutritionExam').then(m=>m.NutritionPaperArchive));
const ReligionArchive=dynamic(()=>import('./ReligionExam').then(m=>m.ReligionPaperArchive));
type Collection=DownloadCollection;
type Catalog={courses:Array<{id:string;title:string;emptyReason:string|null;collections:Collection[]}>};
type Selection={id:string;title:string;gradedQuestionIds:string[]};
/** Toolbar shared by every course: bundle PDF and the all-downloads panel toggle. */
function HubTools({course,open,onToggle,children}:{course:Catalog['courses'][number];open:boolean;onToggle:()=>void;children?:React.ReactNode}) {
  return <div className="pill-row hub-tools">
    {children}
    {course.collections.some(c=>c.gradedQuestionCount)&&<PaperPdfDownload sources={course.collections.map(c=>paperSource(c,c.downloads.questionsAndKey))} variant="both" filename={`${course.id}-all-papers.pdf`} courseTitle={course.title} footerLabel={`MED//25 · ${course.title} · every sourced past paper with answer keys`}><StudyIcon name="download"/>All papers + keys<small>PDF</small></PaperPdfDownload>}
    <button type="button" className="pill" aria-expanded={open} onClick={onToggle}><StudyIcon name="download"/>{open?'Hide downloads':'All downloads'}</button>
  </div>;
}
export function PastExamHub({exam,onSessionActiveChange}:{exam:ExamId;onSessionActiveChange?:(active:boolean)=>void}) {
  const [catalog,setCatalog]=useState<Catalog|null>(null),[error,setError]=useState(''),[selected,setSelected]=useState<string|null>(null),[active,setActive]=useState(false),[archive,setArchive]=useState(false),[library,setLibrary]=useState(false);
  const [selectedPapers,setSelectedPapers]=useState<string[]>([]),[combined,setCombined]=useState<Selection|null>(null),[combining,setCombining]=useState(false),[selectionError,setSelectionError]=useState('');
  const [intent,setIntent]=useState<'start'|'new'|'review'>('start'),[saved,setSaved]=useState<unknown>(null);
  const [savedCombinations,setSavedCombinations]=useState<ReturnType<typeof readCombinedSelections>>([]);
  const refreshSaved=useCallback(()=>{try{setSaved(parseFinalExamProgress(localStorage.getItem(FINAL_EXAM_STORAGE_KEY)));setSavedCombinations(readCombinedSelections(localStorage.getItem(COMBINED_PAPER_SELECTIONS_KEY)));}catch{setSaved(null);}},[]);
  useEffect(()=>{queueMicrotask(refreshSaved);window.addEventListener('storage',refreshSaved);return()=>window.removeEventListener('storage',refreshSaved);},[refreshSaved]);
  useEffect(()=>{let cancelled=false;void cachedJson<Catalog>('/study/past-paper-downloads/catalog.json').then(c=>{if(!cancelled)setCatalog(c);}).catch(e=>{if(!cancelled)setError(e.message);});return()=>{cancelled=true;};},[]);
  useEffect(()=>{onSessionActiveChange?.(active);return()=>onSessionActiveChange?.(false);},[active,onSessionActiveChange]);
  const course=catalog?.courses.find(c=>c.id===exam),sourceCollection=course?.collections.find(c=>c.id===selected),collection=sourceCollection??(combined?.id===selected?combined:undefined);
  if(error)return <p role="alert" className="mcq-alert error">{error}</p>;
  if(!course)return <p role="status" className="mcq-loading">Loading sourced past papers and downloads…</p>;
  const head=<div className="section-head"><h2>Past papers<span>{course.collections.length} sourced</span></h2><p>Original sourced questions only; ungraded items stay in the source archive. Take a paper, resume a saved attempt, or combine several into one session.</p></div>;
  if(exam==='term2-cvs')return <section className="past-exam-hub">
    {!active&&<>{head}<HubTools course={course} open={library} onToggle={()=>setLibrary(v=>!v)}/>{library&&<DownloadLibrary collections={course.collections} courseTitle={course.title}/>}</>}
    <CvsPastExams onSessionActiveChange={setActive} downloads={Object.fromEntries(course.collections.map(item=>[item.id,item]))}/>
  </section>;
  const supported=exam==='july25'||exam==='july29'||exam==='term2-nutrition'||exam==='term2-religion'||exam==='term2-biochemistry';
  if(selected&&supported)return <>{!active&&<div className="paper-view">
    <div className="paper-view-head"><button type="button" className="pill" onClick={()=>setSelected(null)}><StudyIcon name="arrow" className="flip"/>All papers</button>{collection&&<h2>{collection.title}</h2>}</div>
    {sourceCollection&&<><p className="paper-note">{sourceCollection.note}</p><PaperDownloads item={sourceCollection} courseTitle={course.title}/></>}
  </div>}<FinalExam key={selected} exam={exam} bridgeUrl="" collection={collection} initialIntent={intent} onProgressSaved={refreshSaved} onExit={()=>{setActive(false);setSelected(null);}} onSessionActiveChange={setActive}/></>;
  const selectedIds=[...new Set(course.collections.filter(c=>selectedPapers.includes(c.id)).flatMap(c=>c.gradedQuestionIds))];
  function openPaper(item:Collection,fresh=false) {
    if(fresh&&!window.confirm('Start a new attempt for this paper? Its current answers will be replaced. Other papers are unaffected.'))return;
    const previous=paperAttemptSummary(saved,exam,item);
    setIntent(fresh?'new':previous?.completedAt?'review':'start');setSelected(item.id);window.scrollTo({top:0,behavior:'instant'});
  }
  async function openCombined(ids=selectedPapers) {
    if(!course)return;
    setCombining(true);setSelectionError('');
    try {
      const selection=await combinedSourceSelection(course.collections,ids);
      const records=[...savedCombinations.filter(r=>r.id!==selection.id||r.exam!==exam),{id:selection.id,exam,sourcePaperIds:selection.sourcePaperIds}].slice(-100);
      try{localStorage.setItem(COMBINED_PAPER_SELECTIONS_KEY,JSON.stringify(records));setSavedCombinations(records);}catch{/* Session still works if storage is unavailable. */}
      setCombined(selection);setSelectedPapers(selection.sourcePaperIds);setIntent(paperAttemptSummary(saved,exam,selection)?.completedAt?'review':'start');setSelected(selection.id);window.scrollTo({top:0,behavior:'instant'});
    }catch(e){setSelectionError(e instanceof Error?e.message:'Could not prepare the combined session.');}
    finally{setCombining(false);}
  }
  const archived=exam==='term2-nutrition'||exam==='term2-religion';
  return <section className="past-exam-hub">
    {head}
    {!course.collections.length?<div className="mcq-empty"><StudyIcon name="papers"/><b>No past papers imported yet</b><p>{course.emptyReason||'Practice MCQs are available, but they are not past-exam questions.'}</p></div>:<>
      <HubTools course={course} open={library} onToggle={()=>setLibrary(v=>!v)}>
        {supported&&<button type="button" className="pill" onClick={()=>{setIntent('review');setSelected('all');}}><StudyIcon name="results"/>All-paper bank &amp; saved results</button>}
        {archived&&<button type="button" className="pill" aria-expanded={archive} onClick={()=>setArchive(!archive)}><StudyIcon name="book"/>{archive?'Close':'Open'} source archive</button>}
      </HubTools>
      {library&&<DownloadLibrary collections={course.collections} courseTitle={course.title}/>}
      {exam==='july29'&&<p className="mcq-note">The authored “Core Distilled” questions are now in Practice MCQs, not Final Exam. The separate PharmD paper below is cross-course material, not confirmed medical-exam scope. The all-bank option retains legacy answers and includes both source groups.</p>}
      {archive&&(exam==='term2-nutrition'?<NutritionArchive/>:<ReligionArchive/>)}
      <section className="paper-combiner" aria-label="Combine past papers">
        <div className="section-head compact"><h3><StudyIcon name="layers"/>Combine papers</h3><p>One continuous session; repeated question IDs count once. Results map to your review sections.</p><div className="pill-row"><button type="button" className="pill small" onClick={()=>setSelectedPapers(course.collections.filter(c=>c.gradedQuestionCount&&c.defaultEligible).map(c=>c.id))}>Select all</button><button type="button" className="pill small" onClick={()=>setSelectedPapers([])}>Clear</button></div></div>
        <div className="paper-selection">{course.collections.map(item=><label key={item.id}><input type="checkbox" disabled={!item.gradedQuestionCount||combining} checked={selectedPapers.includes(item.id)} onChange={e=>setSelectedPapers(current=>e.target.checked?[...current,item.id]:current.filter(id=>id!==item.id))}/>{item.title}<small>{item.gradedQuestionCount}{!item.defaultEligible?' · supplement':''}</small></label>)}</div>
        <div className="paper-combiner-footer"><span>{selectedPapers.length} papers · {selectedIds.length} scored questions</span><button type="button" className="primary" disabled={!selectedIds.length||combining} onClick={()=>void openCombined()}>{combining?'Preparing…':'Start combined session'}<StudyIcon name="arrow"/></button></div>
        {selectionError&&<p role="alert" className="mcq-alert error">{selectionError}</p>}
        {savedCombinations.some(r=>r.exam===exam)&&<details className="paper-saved-combinations"><summary>Saved combined sessions</summary>{savedCombinations.filter(r=>r.exam===exam).map(row=>{const included=course.collections.filter(c=>row.sourcePaperIds.includes(c.id)),summary=paperAttemptSummary(saved,exam,{id:row.id,gradedQuestionIds:[...new Set(included.flatMap(c=>c.gradedQuestionIds))]});return <article key={row.id}><b>{included.map(c=>c.title).join(' + ')}</b><p>{summary?`${summary.answered}/${summary.total} answered · ${summary.correct} correct`:'Ready to resume'}{summary?.completedAt?' · Completed':''}</p><button type="button" className="pill small" disabled={combining||!included.length} onClick={()=>void openCombined(row.sourcePaperIds)}>{summary?.completedAt?'Results & review':'Resume'}</button></article>;})}</details>}
      </section>
      <div className="paper-grid">{course.collections.map(item=>{
        const previous=paperAttemptSummary(saved,exam,item);
        return <PastPaperCard key={item.id} title={item.title} label={item.defaultEligible?'Source paper':'Supplement · scope unconfirmed'} note={item.note}>
          <p className="paper-counts"><b>{item.gradedQuestionCount}</b> scored<i>·</i>{item.sourceRecordCount} source items{item.ungradedCount?<><i>·</i>{item.ungradedCount} ungraded</>:null}</p>
          {previous?.completedAt
            ?<p className="paper-saved-result"><strong>{Math.round(previous.correct/Math.max(1,previous.total)*100)}%</strong><span>{previous.correct}/{previous.total} correct · {new Date(previous.completedAt).toLocaleDateString()}</span></p>
            :<p className="paper-saved-result">{previous?`${previous.answered}/${previous.total} answered · saved on this device`:'Not attempted yet'}</p>}
          <div className="paper-card-actions"><button type="button" className="primary" disabled={!item.gradedQuestionCount} onClick={()=>openPaper(item)}>{previous?previous.completedAt?'Results & review':'Resume paper':'Take paper'}</button>{previous&&<button type="button" className="pill" onClick={()=>openPaper(item,true)}>New attempt</button>}</div>
          <PaperDownloads item={item} courseTitle={course.title}/>
        </PastPaperCard>;
      })}</div>
    </>}
  </section>;
}
