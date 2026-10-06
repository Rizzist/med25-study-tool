"use client";
import {useCallback,useEffect,useMemo,useState} from 'react';
import dynamic from 'next/dynamic';
import {cachedJson} from '@/src/lib/mcq/client-cache';
import type {ExamId} from '@/src/lib/mcq/exams.mjs';
import {PastPaperCard} from './PastPaperCard';
import {PaperDownloads,DownloadLibrary,paperSource,type DownloadCollection} from './PaperDownloads';
import {PaperPdfDownload} from './PaperPdfDownload';
import {StudyIcon} from './StudyIcon';
import {CachedPdfDownload} from './CachedPdfDownload';
import {FINAL_EXAM_STORAGE_KEY,parseFinalExamProgress} from '@/src/lib/mcq/final-exam-state.mjs';
import {combinedSourceSelection,finalPaperKey,paperAttemptSummary,readCombinedSelections,COMBINED_PAPER_SELECTIONS_KEY} from '@/src/lib/mcq/paper-selection.mjs';
import type {ExamCollection} from '@/src/lib/mcq/curated-core.mjs';
import {supportsGuidedExam,type GuidanceMode} from '@/src/lib/mcq/guided-exam.mjs';
import {ExamModeChooser} from './ExamModeChooser';
import {scopeLimbPaper,limbBankSelection,type LimbScope} from '@/src/lib/mcq/limb-paper-scope.mjs';
import {scopeRetakePaper,retakeBankSelection,type RetakePaperScope} from '@/src/lib/mcq/retake-paper-scope.mjs';
const BiochemistryCoreCard=dynamic(()=>import('./BiochemistryCoreCard').then(m=>m.BiochemistryCoreCard),{loading:()=> <p role="status" className="mcq-loading">Loading Core Exam…</p>});
const CvsPastExams=dynamic(()=>import('./CvsPastExams').then(m=>m.CvsPastExams),{loading:()=> <p role="status" className="mcq-loading">Loading CVS paper tools…</p>});
const FinalExam=dynamic(()=>import('./FinalExam').then(m=>m.FinalExam),{loading:()=> <p role="status" className="mcq-loading">Loading selected paper…</p>});
const NutritionArchive=dynamic(()=>import('./NutritionExam').then(m=>m.NutritionPaperArchive));
const ReligionArchive=dynamic(()=>import('./ReligionExam').then(m=>m.ReligionPaperArchive));
type Collection=DownloadCollection;
type Catalog={courses:Array<{id:string;title:string;emptyReason:string|null;collections:Collection[]}>};
type Selection=ExamCollection;
/** Toolbar shared by every course: bundle PDF and the all-downloads panel toggle. */
function HubTools({course,open,onToggle,children,limbScope='all'}:{course:Catalog['courses'][number];open:boolean;onToggle:()=>void;children?:React.ReactNode;limbScope?:LimbScope}) {
  const label=limbScope==='all'?'All papers':limbScope==='upper'?'Upper-only papers':'Lower-only papers';
  const suffix=limbScope==='all'?'':`-${limbScope}-only`;
  const source=(c:Collection,url:string)=>({...paperSource(c,url),...(limbScope==='all'?{}:{limbScope})});
  return <div className="pill-row hub-tools">
    {children}
    {course.collections.some(c=>c.sourceRecordCount)&&<PaperPdfDownload sources={course.collections.map(c=>source(c,c.downloads.questions))} variant="questions" filename={`${course.id}-all-papers${suffix}-without-keys.pdf`} courseTitle={course.title} footerLabel={`MED//25 · ${course.title} · ${label} without answer keys`}><StudyIcon name="download"/>{label} without keys<small>PDF</small></PaperPdfDownload>}
    {course.collections.some(c=>c.gradedQuestionCount)&&<PaperPdfDownload sources={course.collections.map(c=>source(c,c.downloads.questionsAndKey))} variant="both" filename={`${course.id}-all-papers${suffix}.pdf`} courseTitle={course.title} footerLabel={`MED//25 · ${course.title} · ${label} with answer keys`}><StudyIcon name="download"/>{label} + keys<small>PDF</small></PaperPdfDownload>}
    <button type="button" className="pill" aria-expanded={open} onClick={onToggle}><StudyIcon name="download"/>{open?'Hide downloads':'All downloads'}</button>
  </div>;
}
export function PastExamHub({exam,onSessionActiveChange}:{exam:ExamId;onSessionActiveChange?:(active:boolean)=>void}) {
  const [catalog,setCatalog]=useState<Catalog|null>(null),[error,setError]=useState(''),[selected,setSelected]=useState<string|null>(null),[active,setActive]=useState(false),[archive,setArchive]=useState(false),[library,setLibrary]=useState(false);
  const [selectedPapers,setSelectedPapers]=useState<string[]>([]),[combined,setCombined]=useState<Selection|null>(null),[combining,setCombining]=useState(false),[selectionError,setSelectionError]=useState('');
  const [intent,setIntent]=useState<'start'|'new'|'review'>('start'),[saved,setSaved]=useState<unknown>(null);
  const [pendingStart,setPendingStart]=useState<{id:string;intent:'start'|'new'}|null>(null);
  const [launchGuidance,setLaunchGuidance]=useState<GuidanceMode|undefined>();
  const [limbScope,setLimbScope]=useState<LimbScope>('all');
  const [retakeScope,setRetakeScope]=useState<RetakePaperScope>('biochemistry');
  const [savedCombinations,setSavedCombinations]=useState<ReturnType<typeof readCombinedSelections>>([]);
  const refreshSaved=useCallback(()=>{try{setSaved(parseFinalExamProgress(localStorage.getItem(FINAL_EXAM_STORAGE_KEY)));setSavedCombinations(readCombinedSelections(localStorage.getItem(COMBINED_PAPER_SELECTIONS_KEY)));}catch{setSaved(null);}},[]);
  useEffect(()=>{queueMicrotask(refreshSaved);window.addEventListener('storage',refreshSaved);return()=>window.removeEventListener('storage',refreshSaved);},[refreshSaved]);
  useEffect(()=>{let cancelled=false;void cachedJson<Catalog>('/study/past-paper-downloads/catalog.json').then(c=>{if(!cancelled)setCatalog(c);}).catch(e=>{if(!cancelled)setError(e.message);});return()=>{cancelled=true;};},[]);
  useEffect(()=>{onSessionActiveChange?.(active);return()=>onSessionActiveChange?.(false);},[active,onSessionActiveChange]);
  const originalCourse=catalog?.courses.find(c=>c.id===exam);
  const fullRetakeAvailable=Boolean(originalCourse?.collections.length&&originalCourse.collections.every(c=>c.fullPaper));
  // Stable collection identity prevents progress-save renders from restarting FinalExam's loading effect.
  const course=useMemo(()=>{
    if(!originalCourse)return originalCourse;
    if(exam==='term1-biochemistry-retake')return {...originalCourse,collections:originalCourse.collections.map(c=>scopeRetakePaper(c,fullRetakeAvailable?retakeScope:'biochemistry'))};
    if(exam==='term2-limbs')return {...originalCourse,collections:originalCourse.collections.map(c=>scopeLimbPaper(c,limbScope)).filter(c=>limbScope==='all'||c.sourceRecordCount>0).sort((a,b)=>Number(b.defaultEligible)-Number(a.defaultEligible))};
    return originalCourse;
  },[originalCourse,exam,limbScope,retakeScope,fullRetakeAvailable]);
  const visibleCombinations=savedCombinations.filter(r=>r.exam===exam&&r.sourcePaperIds.every(id=>course?.collections.some(c=>c.id===id)));
  const sourceCollection=course?.collections.find(c=>c.id===selected),collection=sourceCollection??(combined?.id===selected?combined:undefined);
  if(error)return <p role="alert" className="mcq-alert error">{error}</p>;
  if(!course)return <p role="status" className="mcq-loading">Loading sourced past papers and downloads…</p>;
  const head=<div className="section-head"><h2>Past papers<span>{course.collections.length} sourced</span></h2><p>Past-paper questions, with any study repairs clearly identified and original wording preserved in downloads. Take a paper, resume a saved attempt, or combine several into one session.</p></div>;
  if(exam==='term2-cvs')return <section className="past-exam-hub">
    {!active&&<>{head}<HubTools course={course} open={library} onToggle={()=>setLibrary(v=>!v)}/>{library&&<DownloadLibrary collections={course.collections} courseTitle={course.title}/>}</>}
    <CvsPastExams onSessionActiveChange={setActive} downloads={Object.fromEntries(course.collections.map(item=>[item.id,item]))}/>
  </section>;
  const supported=exam==='term2-divine-ethics'||exam==='term1-biochemistry-retake'||exam==='july25'||exam==='july29'||exam==='term2-nutrition'||exam==='term2-religion'||exam==='term2-biochemistry'||exam==='term2-respiratory'||exam==='term2-limbs';
  if(selected&&supported)return <>{!active&&<div className="paper-view">
    <div className="paper-view-head"><button type="button" className="pill" onClick={()=>setSelected(null)}><StudyIcon name="arrow" className="flip"/>All papers</button>{collection&&<h2>{collection.title}</h2>}</div>
    {sourceCollection&&<><p className="paper-note">{sourceCollection.note}</p><PaperDownloads item={originalCourse?.collections.find(c=>c.downloads.questions===sourceCollection.downloads.questions)??sourceCollection} courseTitle={course.title}/></>}
  </div>}<FinalExam key={selected} exam={exam} bridgeUrl="" collection={collection} initialIntent={intent} initialGuidance={launchGuidance} onProgressSaved={refreshSaved} onExit={()=>{setActive(false);setSelected(null);}} onSessionActiveChange={setActive}/></>;
  const selectedIds=[...new Set(course.collections.filter(c=>selectedPapers.includes(c.id)).flatMap(c=>c.gradedQuestionIds))];
  function requestOpen(id:string,nextIntent:'start'|'new'|'review') {
    let savedGuidance:GuidanceMode|undefined;
    try {
      const sessions=parseFinalExamProgress(localStorage.getItem(FINAL_EXAM_STORAGE_KEY)).sessions as Record<string,{guidance?:GuidanceMode}|null>;
      savedGuidance=sessions[finalPaperKey(exam,id)]?.guidance;
    }catch{/* Ask before a fresh start when saved preferences cannot be read. */}
    if(supportsGuidedExam(exam)&&nextIntent!=='review'&&(nextIntent==='new'||!savedGuidance)) {
      // Keep the paper picker mounted. Do not load or create an attempt yet.
      setPendingStart({id,intent:nextIntent});return;
    }
    setLaunchGuidance(undefined);setIntent(nextIntent);setSelected(id);window.scrollTo({top:0,behavior:'instant'});
  }
  function openPaper(item:Collection,fresh=false) {
    if(fresh&&!window.confirm('Start a new attempt for this paper? Its current answers will be replaced. Other papers are unaffected.'))return;
    const previous=paperAttemptSummary(saved,exam,item);
    requestOpen(item.id,fresh?'new':previous?.completedAt?'review':'start');
  }
  function openCore(selection:Selection,fresh=false) {
    if(fresh&&!window.confirm('Start a new attempt for this Core scope? Its current answers will be replaced; source-paper attempts are unaffected.'))return;
    setCombined(selection);requestOpen(selection.id,fresh?'new':paperAttemptSummary(saved,exam,selection)?.completedAt?'review':'start');
  }
  async function openCombined(ids=selectedPapers) {
    if(!course)return;
    setCombining(true);setSelectionError('');
    try {
      const selection=await combinedSourceSelection(course.collections,ids);
      const records=[...savedCombinations.filter(r=>r.id!==selection.id||r.exam!==exam),{id:selection.id,exam,sourcePaperIds:selection.sourcePaperIds}].slice(-100);
      try{localStorage.setItem(COMBINED_PAPER_SELECTIONS_KEY,JSON.stringify(records));setSavedCombinations(records);}catch{/* Session still works if storage is unavailable. */}
      setCombined(selection);setSelectedPapers(selection.sourcePaperIds);requestOpen(selection.id,paperAttemptSummary(saved,exam,selection)?.completedAt?'review':'start');
    }catch(e){setSelectionError(e instanceof Error?e.message:'Could not prepare the combined session.');}
    finally{setCombining(false);}
  }
  const archived=exam==='term2-nutrition'||exam==='term2-religion';
  return <section className="past-exam-hub">
    {pendingStart&&<ExamModeChooser onCancel={()=>setPendingStart(null)} onChoose={mode=>{
      setLaunchGuidance(mode);setIntent(pendingStart.intent);setSelected(pendingStart.id);setPendingStart(null);window.scrollTo({top:0,behavior:'instant'});
    }}/>}
    {head}
    {exam==='term1-biochemistry-retake'&&<fieldset className="pill-row limb-paper-scope"><legend>Questions to include</legend>{(['biochemistry','full'] as RetakePaperScope[]).map(scope=><button type="button" key={scope} disabled={scope==='full'&&!fullRetakeAvailable} className={retakeScope===scope?'primary':'pill'} aria-pressed={retakeScope===scope} onClick={()=>{setRetakeScope(scope);setSelectedPapers([]);setCombined(null);setSelectionError('');}}>{scope==='biochemistry'?'Biochemistry only':'Full paper'}</button>)}<small>{!fullRetakeAvailable?'Reconnect and reload to download the full-paper catalog. ':''}Full paper includes the original physiology and histology questions where present. Both options support guided or unguided study, scoped downloads and separate saved results. Practice remains biochemistry only.</small></fieldset>}
    {exam==='term2-limbs'&&<fieldset className="pill-row limb-paper-scope"><legend>Questions to include</legend>{(['all','upper','lower'] as LimbScope[]).map(scope=><button type="button" key={scope} className={limbScope===scope?'primary':'pill'} aria-pressed={limbScope===scope} onClick={()=>{setLimbScope(scope);setSelectedPapers([]);setCombined(null);setSelectionError('');}}>{scope==='all'?'Full':scope==='upper'?'Upper only':'Lower only'}</button>)}<small>Full includes every scored question, including spine and general anatomy in mixed papers. Upper/Lower filters questions and bundle PDFs; each scope saves separate results. Individual paper downloads and original scans remain complete.</small></fieldset>}
    {!course.collections.length?<div className="mcq-empty"><StudyIcon name="papers"/><b>No past papers imported yet</b><p>{course.emptyReason||'Practice MCQs are available, but they are not past-exam questions.'}</p></div>:<>
      <HubTools course={course} limbScope={exam==='term2-limbs'?limbScope:'all'} open={library} onToggle={()=>setLibrary(v=>!v)}>
        {supported&&<button type="button" className="pill" onClick={()=>{setIntent('review');if(exam==='term2-limbs'||exam==='term1-biochemistry-retake'){const scope=exam==='term2-limbs'?limbBankSelection(course.collections,limbScope):retakeBankSelection(course.collections,retakeScope);setCombined(scope);setSelected(scope.id);}else setSelected('all');}}><StudyIcon name="results"/>All-paper bank &amp; saved results</button>}
        {archived&&<button type="button" className="pill" aria-expanded={archive} onClick={()=>setArchive(!archive)}><StudyIcon name="book"/>{archive?'Close':'Open'} source archive</button>}
      </HubTools>
      {exam==='term2-divine-ethics'&&<div className="mcq-note"><b>Divine Ethics · source-checked, course-relevant selections</b><p>Includes the photographed paper and relevant selections from the reports and compilations. Content-matched papers are labelled separately from the explicit Ethics 1 cover. Duplicate versions, unsupported medical rulings and unclear items are excluded. The review covers selected chapters; questions outside its coverage link to the first-term notes and supporting evidence.</p><div className="pill-row"><CachedPdfDownload href="/study/divine-ethics/references/first-term-lessons.pdf"><StudyIcon name="book"/>First-term lesson notes</CachedPdfDownload><a className="pill" href="/study/divine-ethics/paper-audit.md" target="_blank" rel="noreferrer">Source comparison &amp; exclusions</a></div></div>}
      {library&&<DownloadLibrary collections={(exam==='term1-biochemistry-retake'?course:originalCourse??course).collections} courseTitle={course.title}/>}
      {exam==='july29'&&<p className="mcq-note">The authored “Core Distilled” questions are now in Practice MCQs, not Final Exam. The separate PharmD paper below is cross-course material, not confirmed medical-exam scope. The all-bank option retains legacy answers and includes both source groups.</p>}
      {archive&&(exam==='term2-nutrition'?<NutritionArchive/>:<ReligionArchive/>)}
      <section className="paper-combiner" aria-label="Combine past papers">
        <div className="section-head compact"><h3><StudyIcon name="layers"/>Combine papers</h3><p>One continuous session; repeated question IDs count once. Results map to your review sections.</p><div className="pill-row"><button type="button" className="pill small" onClick={()=>setSelectedPapers(course.collections.filter(c=>c.gradedQuestionCount&&c.defaultEligible).map(c=>c.id))}>Select all</button><button type="button" className="pill small" onClick={()=>setSelectedPapers([])}>Clear</button></div></div>
        {exam==='term2-limbs'&&<p className="paper-note">Select all includes the main paper collections. Midterms and scope-unconfirmed supplements are optional: tick them individually to add them.</p>}
        <div className="paper-selection">{course.collections.map(item=><label key={item.id}><input type="checkbox" disabled={!item.gradedQuestionCount||combining} checked={selectedPapers.includes(item.id)} onChange={e=>setSelectedPapers(current=>e.target.checked?[...current,item.id]:current.filter(id=>id!==item.id))}/>{item.title}<small>{item.gradedQuestionCount}{!item.defaultEligible?' · supplement':''}</small></label>)}</div>
        <div className="paper-combiner-footer"><span>{selectedPapers.length} papers · {selectedIds.length} scored questions</span><button type="button" className="primary" disabled={!selectedIds.length||combining} onClick={()=>void openCombined()}>{combining?'Preparing…':'Start combined session'}<StudyIcon name="arrow"/></button></div>
        {selectionError&&<p role="alert" className="mcq-alert error">{selectionError}</p>}
        {visibleCombinations.length>0&&<details className="paper-saved-combinations"><summary>Saved combined sessions</summary>{visibleCombinations.map(row=>{const included=course.collections.filter(c=>row.sourcePaperIds.includes(c.id)),summary=paperAttemptSummary(saved,exam,{id:row.id,gradedQuestionIds:[...new Set(included.flatMap(c=>c.gradedQuestionIds))]});return <article key={row.id}><b>{included.map(c=>c.title).join(' + ')}</b><p>{summary?`${summary.answered}/${summary.total} answered · ${summary.correct} correct`:'Ready to resume'}{summary?.completedAt?' · Completed':''}</p><button type="button" className="pill small" disabled={combining||!included.length} onClick={()=>void openCombined(row.sourcePaperIds)}>{summary?.completedAt?'Results & review':'Resume'}</button></article>;})}</details>}
      </section>
      <div className="paper-grid">
      {exam==='term2-biochemistry'&&<BiochemistryCoreCard saved={saved} onOpen={openCore}/>}
      {exam==='term2-nutrition'&&<BiochemistryCoreCard exam="term2-nutrition" saved={saved} onOpen={openCore}/>}
      {exam==='term2-respiratory'&&<BiochemistryCoreCard exam="term2-respiratory" saved={saved} onOpen={openCore}/>}
      {course.collections.map(item=>{
        const previous=paperAttemptSummary(saved,exam,item);
        const referenceOnly=exam==='term2-respiratory'&&!item.sourceRecordCount&&!item.gradedQuestionCount;
        return <PastPaperCard key={item.id} title={item.title} label={referenceOnly?'Reference only':item.defaultEligible?'Source paper':'Supplement · scope unconfirmed'} note={item.note}>
          {referenceOnly?<p className="paper-counts">Original reference retained · no standalone MCQs</p>:<p className="paper-counts"><b>{item.gradedQuestionCount}</b> scored<i>·</i>{item.sourceRecordCount} source items{item.ungradedCount?<><i>·</i>{item.ungradedCount} ungraded</>:null}</p>}
          {!referenceOnly&&(previous?.completedAt
            ?<p className="paper-saved-result"><strong>{Math.round(previous.correct/Math.max(1,previous.total)*100)}%</strong><span>{previous.correct}/{previous.total} correct · {new Date(previous.completedAt).toLocaleDateString()}</span></p>
            :<p className="paper-saved-result">{previous?`${previous.answered}/${previous.total} answered · saved on this device`:'Not attempted yet'}</p>)}
          {!referenceOnly&&<div className="paper-card-actions"><button type="button" className="primary" disabled={!item.gradedQuestionCount} onClick={()=>openPaper(item)}>{previous?previous.completedAt?'Results & review':'Resume paper':'Take paper'}</button>{previous&&<button type="button" className="pill" onClick={()=>openPaper(item,true)}>New attempt</button>}</div>}
          <PaperDownloads item={originalCourse?.collections.find(c=>c.downloads.questions===item.downloads.questions)??item} courseTitle={course.title}/>
        </PastPaperCard>;
      })}</div>
    </>}
  </section>;
}
