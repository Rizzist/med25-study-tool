"use client";

import { useEffect, useMemo, useState } from "react";
import catalog from "@/data/nutrition/catalog.json";
import { FinalExam } from "./FinalExam";
import styles from "./NutritionExam.module.css";

export function NutritionPracticeTopics({ onStart }: { onStart: (ids: string[]) => void }) {
  const coreIds = catalog.modules.filter(m => !m.supplementary).flatMap(m => m.questionIds);
  return <section className={styles.root} aria-label="Nutrition practice topics">
    <header className={styles.heading}><div><span className="eyebrow">Review + book · newly authored practice</span><h1>Nutrition question sets</h1><p>{catalog.counts.practice} MCQs across {catalog.modules.length} review topics. Core knowledge, numerical work and applied reasoning, with an explanation for every option.</p></div><button className="primary" onClick={() => onStart(coreIds)}>Mixed core practice →</button></header>
    <p className={styles.note}>Source: DeBruyne, Pinna & Whitney, <i>Nutrition &amp; Diet Therapy</i>, 9th edition (2016), and your Nutrition Review. Page numbers below are the PDF counter, not printed folios. These are not recovered exam questions. The oral-health supplement is excluded from Mixed core practice.</p>
    <div className={styles.topics}>{catalog.modules.map(m => <article key={m.id}>
      <span className={styles.badge}>{m.questionIds.length} MCQs · Review §{m.reviewSection}</span>
      <h2>{m.title}</h2>{m.supplementary && <b className={styles.warning}>Book supplement · exam scope unconfirmed</b>}
      <p>{m.bookLocator}</p>
      <button onClick={() => onStart(m.questionIds)} disabled={!m.questionIds.length}>Practice this topic →</button>
    </article>)}</div>
  </section>;
}

export function NutritionFinalExam({ bridgeUrl }: { bridgeUrl: string }) {
  const [view, setView] = useState<"scored" | "archive">("scored");
  return <section className={styles.root}>
    <nav className={styles.tabs} aria-label="Nutrition final exam views">
      <button aria-pressed={view === "scored"} className={view === "scored" ? styles.active : ""} onClick={() => setView("scored")}><b>Scored past-paper MCQs</b><span>{catalog.counts.scoredPastPaper} checked items · saved progress</span></button>
      <button aria-pressed={view === "archive"} className={view === "archive" ? styles.active : ""} onClick={() => setView("archive")}><b>All papers + answer notes</b><span>All {catalog.counts.allSourceItems} source items · nothing omitted</span></button>
    </nav>
    <p className={styles.note}>Only past papers belong here. Every original item is retained in All papers, including repeated scans and items that cannot yet be scored reliably. Marked selections are not an official answer key. The separate Oral Health paper is included, with its course match explicitly unconfirmed.</p>
    {view === "scored" ? <FinalExam key="term2-nutrition" exam="term2-nutrition" bridgeUrl={bridgeUrl} /> : <NutritionPaperArchive />}
  </section>;
}

export function NutritionPaperArchive() {
  const [paperId, setPaperId] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("F1");
  const [revealed, setRevealed] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const data: unknown = JSON.parse(localStorage.getItem("med25-nutrition-source-review-v1") ?? "[]");
      if (Array.isArray(data)) setReviewed(data.filter((id): id is string => typeof id === "string" && catalog.archive.some(r => r.id === id)));
    } catch { /* Source review remains usable without storage. */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem("med25-nutrition-source-review-v1", JSON.stringify(reviewed)); } catch { /* Optional progress only. */ } } }, [reviewed,ready]);
  const visible = useMemo(() => catalog.archive.filter(r => (paperId === "all" || r.paperId === paperId) && `${r.id} ${r.topic} ${r.sectionId} ${r.originalQuestion?.prompt ?? ""}`.toLowerCase().includes(search.toLowerCase().trim())), [paperId,search]);
  const selected = visible.find(r => r.id === selectedId) ?? visible[0];
  const source = catalog.papers.find(p => p.id === selected?.paperId);
  const sourceOriginal = selected && 'sourceOriginal' in selected ? selected.sourceOriginal : null;
  const index = visible.findIndex(r => r.id === selected?.id);
  function choose(id: string) { setSelectedId(id); setRevealed(false); setDocumentOpen(false); }
  const pdfUrl = source && selected ? `${source.file}#page=${selected.page}&view=FitH` : "";
  return <section aria-label="Complete nutrition source archive">
    <header className={styles.heading}><div><h1>Every original question, with answer notes</h1><p>{catalog.counts.allSourceItems} source items across {catalog.papers.length} collections, including the separately labelled oral-health supplement. Duplicate scans remain visible without extra scored weight.</p></div><span>{reviewed.length}/{catalog.counts.allSourceItems} reviewed</span></header>
    <div className={styles.filters}>
      <label>Paper<select value={paperId} onChange={e => { setPaperId(e.target.value); choose(""); }}><option value="all">All {catalog.papers.length} collections · {catalog.counts.allSourceItems} items</option>{catalog.papers.map(p => <option key={p.id} value={p.id}>{p.id} · {p.title} ({p.itemCount})</option>)}</select></label>
      <label>Find a question<input type="search" placeholder="ID or topic, e.g. F21, iron" value={search} onChange={e => { setSearch(e.target.value); choose(""); }} /></label>
    </div>
    <div className={styles.archiveLayout}>
      <div className={styles.roster} aria-label="Original source items">{visible.map(r => <button key={r.id} onClick={() => choose(r.id)} aria-current={selected?.id === r.id ? "true" : undefined} className={selected?.id === r.id ? styles.selected : ""}><strong>{r.id} {reviewed.includes(r.id) ? "✓" : ""}</strong><span>{r.topic}<small>{r.gradedQuestionId ? "Checked MCQ" : r.gradingStatus === "duplicate-source" ? "Repeated source" : r.paperId === "O" ? "Oral health · ungraded" : "Answer notes · ungraded"}</small></span></button>)}</div>
      {selected && source ? <article className={styles.item} key={selected.id}>
        <div className={styles.itemMeta}><b>{selected.id} · {source.originalFilename} · {selected.locator}</b><span>{index+1}/{visible.length} in this view</span></div>
        <h2>{selected.originalQuestion?.prompt ?? selected.topic}</h2>
        {selected.status==='study-repair'&&<section className={styles.warning}><b>Edited study version</b><p>The original item had a wording or choice defect. The question above uses the documented study repair, not the original wording.</p>{sourceOriginal&&<details><summary>Read the original stem and choices</summary><p>{sourceOriginal.prompt}</p><ol type="A">{sourceOriginal.options.map((text,index)=><li key={index}>{text}</li>)}</ol></details>}</section>}
        {!selected.gradedQuestionId && <p className={styles.warning}>{selected.ungradedReason}</p>}
        {selected.originalQuestion && <ol type="A" className={styles.originalOptions}>{selected.originalQuestion.options.map(o => <li key={o.id}>{o.text}</li>)}</ol>}
        <p className={styles.note}>The original PDF contains the complete source wording and choices. Original pages may already show a student's selected option; treat those marks as source evidence, not proof of correctness. Some questions span pages.</p>
        <div className={styles.actions}><button onClick={() => setDocumentOpen(v => !v)}>{documentOpen ? "Hide original page" : "Read original question + options"}</button><a href={pdfUrl} target="_blank" rel="noreferrer">Open PDF at page {selected.page} ↗</a></div>
        {documentOpen && <iframe key={pdfUrl} className={styles.pdf} src={pdfUrl} title={`${selected.id}: original question and choices`} />}
        {!revealed ? <button className="primary" onClick={() => setRevealed(true)}>Show answer / correction notes</button> : <section className={styles.answer} aria-label="Source answer notes">
          <b>{selected.checkedAnswer ? `Checked answer: ${selected.checkedAnswer}` : "Answer review · not automatically graded"}</b>
          <p>{selected.originalQuestion?.explanation ?? selected.explanation}</p>
          {selected.originalQuestion && <details><summary>Why the other choices do not win</summary>{Object.entries(selected.originalQuestion.distractorExplanations).map(([key,value]) => <p key={key}><b>{key}.</b> {value}</p>)}</details>}
          <small>Review section: {catalog.modules.find(m => m.id === selected.sectionId)?.title ?? selected.sectionId}. Evidence status: {selected.status}. {selected.courseMatch}.</small>
        </section>}
        <footer className={styles.actions}><button disabled={index <= 0} onClick={() => choose(visible[index-1].id)}>← Previous</button><button disabled={!ready} aria-pressed={reviewed.includes(selected.id)} onClick={() => setReviewed(ids => ids.includes(selected.id) ? ids.filter(id => id !== selected.id) : [...ids,selected.id])}>{reviewed.includes(selected.id) ? "✓ Reviewed" : "Mark reviewed"}</button><button disabled={index >= visible.length-1} onClick={() => choose(visible[index+1].id)}>Next item →</button></footer>
      </article> : <p role="status">No matching source items. Clear the search or choose another paper.</p>}
    </div>
  </section>;
}
