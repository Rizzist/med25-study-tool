"use client";
/* eslint-disable @next/next/no-img-element -- original source image, not decorative media */
import { useMemo, useState, useSyncExternalStore } from "react";
import catalog from "@/data/religion/catalog.json";
import { FinalExam } from "./FinalExam";
import styles from "./ReligionExam.module.css";

export { catalog as religionCatalog };
const reviewStorageKey='med25-religion-source-review-v1';
const reviewEvent='med25-religion-source-review-change';
let memoryReview='[]';
function subscribeReview(onChange:()=>void) {
  window.addEventListener('storage',onChange);
  window.addEventListener(reviewEvent,onChange);
  return ()=>{window.removeEventListener('storage',onChange);window.removeEventListener(reviewEvent,onChange);};
}
function reviewSnapshot() { try{return localStorage.getItem(reviewStorageKey)??memoryReview;}catch{return memoryReview;} }
function serverReviewSnapshot(){return '[]';}
function readReviewed(raw:string):string[]{try{const data:unknown=JSON.parse(raw);return Array.isArray(data)?[...new Set(data.filter((id):id is string=>typeof id==='string'&&catalog.archive.some(r=>r.id===id)))]:[];}catch{return [];}}
export function ReligionPracticeTopics({onStart}:{onStart:(ids:string[],mode:"learn"|"exam")=>void}) {
  const [mode,setMode]=useState<"learn"|"exam">("learn");
  const [search,setSearch]=useState("");
  const topics=catalog.modules.filter(m=>m.title.toLowerCase().includes(search.toLowerCase().trim()));
  return <section className={styles.root} aria-label="Religion review practice">
    <header className={styles.heading}><div><span className="eyebrow">Newly authored · review, lecture & reference based</span><h1>Religion question sets</h1><p>{catalog.counts.practice} MCQs across {catalog.modules.length} teaching topics, with explanations for every option. Source questions belong exclusively to Final Exam.</p></div><button className="primary" onClick={()=>onStart(catalog.modules.flatMap(m=>m.questionIds),mode)}>Practise all topics →</button></header>
    <p className={styles.note}>Based on your expanded 41-page Religion Review. Yazdi’s <i>Theological Instructions</i> supports the matched theological topics; biography, scripture comparison and ethics use separately identified references. These are not all confirmed lecture chapters, nor an official exam blueprint.</p>
    <div className={styles.filters}><fieldset><legend>Feedback</legend><button aria-pressed={mode==='learn'} onClick={()=>setMode('learn')}>Learn · immediate</button><button aria-pressed={mode==='exam'} onClick={()=>setMode('exam')}>Test · after grading</button></fieldset><label>Find a topic<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="e.g. decree, biography, scripture" /></label></div>
    <div className={styles.topics}>{topics.map(m=><article key={m.id}><span className={styles.badge}>{m.questionIds.length} MCQs · Review §{m.reviewSection} · PDF p. {m.reviewPage}</span><h2>{m.title}</h2><p>{m.basis}</p><details><summary>Source map</summary><ul>{m.references.map((r,i)=><li key={i}>{'url' in r && r.url?<a href={r.url} target="_blank" rel="noreferrer">{r.title}</a>:r.title}<br/>{r.locator}</li>)}</ul></details><button onClick={()=>onStart(m.questionIds,mode)}>Practise this topic →</button></article>)}</div>
    {!topics.length && <p role="status">No topic matches that search.</p>}
  </section>;
}

export function ReligionFinalExam({bridgeUrl}:{bridgeUrl:string}) {
  const [view,setView]=useState<'scored'|'archive'>('scored');
  return <section className={styles.root}>
    <nav className={styles.tabs} aria-label="Religion final exam views"><button aria-pressed={view==='scored'} onClick={()=>setView('scored')}><b>Scored past-paper MCQs</b><span>{catalog.counts.scoredPastPaper} source-reviewed keys · saved progress</span></button><button aria-pressed={view==='archive'} onClick={()=>setView('archive')}><b>All papers + answer notes</b><span>All {catalog.counts.allSourceItems} original occurrences · four papers</span></button></nav>
    <p className={styles.note}>Past papers only. Keys are editorial reviews, not official university answers. Each paper can be taken in full, including its repeated questions ({catalog.counts.duplicateSource} overlapping copies across papers). Original spelling and choice order are retained. Read the correction and uncertainty notes for disputed items.</p>
    {view==='scored'?<FinalExam key="religion" exam="term2-religion" bridgeUrl={bridgeUrl}/>:<ReligionPaperArchive/>}
  </section>;
}

export function ReligionPaperArchive() {
  const [paper,setPaper]=useState('all'),[search,setSearch]=useState(''),[selectedId,setSelectedId]=useState('O1');
  const [revealed,setRevealed]=useState(false),[documentOpen,setDocumentOpen]=useState(false);
  const rawReview=useSyncExternalStore(subscribeReview,reviewSnapshot,serverReviewSnapshot);
  const reviewed=useMemo(()=>readReviewed(rawReview),[rawReview]);
  function toggleReviewed(id:string){
    const current=readReviewed(reviewSnapshot());
    memoryReview=JSON.stringify(current.includes(id)?current.filter(value=>value!==id):[...current,id]);
    try{localStorage.setItem(reviewStorageKey,memoryReview);}catch{/* In-memory progress remains usable when storage is unavailable. */}
    window.dispatchEvent(new Event(reviewEvent));
  }
  const visible=useMemo(()=>catalog.archive.filter(r=>(paper==='all'||r.paperId===paper)&&`${r.id} ${r.topic} ${r.prompt}`.toLowerCase().includes(search.toLowerCase().trim())),[paper,search]);
  const selected=visible.find(r=>r.id===selectedId)??visible[0];
  const source=catalog.papers.find(p=>p.id===selected?.paperId),index=visible.findIndex(r=>r.id===selected?.id);
  function choose(id:string){setSelectedId(id);setRevealed(false);setDocumentOpen(false);}
  const pdfUrl=source&&selected?`${source.file}#page=${selected.page}&view=FitH`:'';
  return <section aria-label="Complete religion source archive"><header className={styles.heading}><div><h1>Every source question, with answer notes</h1><p>O: 40 · D: 100 · A: 20 · F: 20. The A/F papers overlap, but every source occurrence remains accessible.</p></div><span>{reviewed.length}/{catalog.counts.allSourceItems} reviewed</span></header>
    <div className={styles.filters}><label>Paper<select value={paper} onChange={e=>{setPaper(e.target.value);choose('');}}><option value="all">All four papers · 180 items</option>{catalog.papers.map(p=><option key={p.id} value={p.id}>{p.id} · {p.title} ({p.itemCount})</option>)}</select></label><label>Find a question<input type="search" value={search} onChange={e=>{setSearch(e.target.value);choose('');}} placeholder="Question ID, words or topic"/></label></div>
    <div className={styles.archiveLayout}><div className={styles.roster} aria-label="Source question list">{visible.map(r=><button key={r.id} onClick={()=>choose(r.id)} aria-current={selected?.id===r.id?'true':undefined}><strong>{r.id} {reviewed.includes(r.id)?'✓':''}</strong><span>{r.topic}<small>{r.gradingStatus==='scored'?'Scored · editorial key':r.sameItemAs?`Repeat of ${r.sameItemAs}`:'Answer notes · ungraded'}</small></span></button>)}</div>
      {selected&&source?<article className={styles.item} key={selected.id}><div className={styles.itemMeta}><b>{selected.id} · {source.originalFilename} · {selected.locator}</b><span>{index+1}/{visible.length} in this view</span></div><h2>{selected.prompt}</h2>
        {selected.ungradedReason&&<p className={styles.warning}>{selected.ungradedReason}</p>}
        {selected.media&&<figure><img className={styles.sourceImage} src={`/study/${selected.media.path}`} alt={selected.media.alt}/><figcaption>{selected.media.attribution}</figcaption></figure>}
        <ol type="A" className={styles.originalOptions}>{Object.entries(selected.options).map(([key,text])=><li key={key}>{text}</li>)}</ol>
        <p className={styles.note}>Source PDFs can contain highlighted choices or an answer sheet. They are evidence of the paper, not an official key. Some questions continue onto the following page. February’s unlabeled choices are assigned A–D here in their original order.</p>
        <div className={styles.actions}><button onClick={()=>setDocumentOpen(v=>!v)}>{documentOpen?'Hide PDF':'Read original PDF'}</button><a href={pdfUrl} target="_blank" rel="noreferrer">Open source · p. {selected.page} ↗</a></div>
        {documentOpen&&<iframe className={styles.pdf} src={pdfUrl} title={`${selected.id} original source page`}/>}
        {!revealed?<button className="primary" onClick={()=>setRevealed(true)}>Reveal answer / correction notes</button>:<section className={styles.answer} aria-label="Source answer notes"><b>{selected.checkedAnswer?`Reviewed answer: ${selected.checkedAnswer}`:'Not automatically scored'}</b>
          <p>{selected.explanation}</p>{selected.providedAnswer&&<p><strong>Original mark / sheet:</strong> {selected.providedAnswer}. {selected.providedAnswerKind}.</p>}{selected.qualification&&<p><strong>Source qualification:</strong> {selected.qualification}</p>}
          {selected.optionNotes&&<details><summary>Explanation for each choice</summary>{Object.entries(selected.optionNotes).map(([key,value])=><p key={key}><b>{key}.</b> {value}</p>)}</details>}
          <details><summary>Review &amp; reference map · PDF p. {selected.reviewPage}</summary><ul>{selected.references.map((r,i)=><li key={i}>{'url' in r&&r.url?<a href={r.url} target="_blank" rel="noreferrer">{r.title}</a>:r.title} · {r.locator}</li>)}</ul></details>
        </section>}
        <footer className={styles.actions}><button disabled={index<=0} onClick={()=>choose(visible[index-1].id)}>← Previous</button><button aria-pressed={reviewed.includes(selected.id)} onClick={()=>toggleReviewed(selected.id)}>{reviewed.includes(selected.id)?'✓ Reviewed':'Mark reviewed'}</button><button disabled={index>=visible.length-1} onClick={()=>choose(visible[index+1].id)}>Next item →</button></footer>
      </article>:<p role="status">No matching questions. Clear the search or select another paper.</p>}
    </div>
  </section>;
}
