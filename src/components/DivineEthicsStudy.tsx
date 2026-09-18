"use client";
import { useState } from "react";
import catalog from "@/data/divine-ethics/catalog.json";
import styles from "./DivineEthicsStudy.module.css";

export { catalog as divineEthicsCatalog };
export function DivineEthicsStudy({onStart,study=false,error,disabled=false}:{onStart:(ids:string[],mode:"learn"|"exam")=>void;study?:boolean;error?:string;disabled?:boolean}) {
  const [mode,setMode]=useState<"learn"|"exam">("learn");
  const [search,setSearch]=useState("");
  const modules=catalog.modules.filter(m=>`${m.title} ${m.takeaway}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className={styles.root} aria-label="Divine Ethics study and practice">
    <header><p className="eyebrow">Divine Ethics · supplied course extract</p><h1>{study?"Understand the distinctions. Then test them.":"Nine focused question sets."}</h1>
      <p>{catalog.counts.practice} newly authored MCQs with explanations for every option. Each question points to its PDF page and printed book page.</p>
      <div className={styles.links}><a href={catalog.source.reviewFile} target="_blank" rel="noreferrer">Read the review PDF ↗</a><a href={catalog.source.file} target="_blank" rel="noreferrer">Open the original scan ↗</a></div>
    </header>
    <details className={styles.scope}><summary>What this covers — and what it does not</summary><p>{catalog.source.scope}</p><ul>{catalog.source.limits.map(t=><li key={t}>{t}</li>)}</ul><p>Final Exam stays empty until genuine past papers are supplied. These are practice questions, not predictions of an official examination.</p></details>
    <div className={styles.controls}>
      <label>Find a topic<input type="search" placeholder="Trust, gratitude, planning…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <label>Practice mode<select value={mode} onChange={e=>setMode(e.target.value as "learn"|"exam")}><option value="learn">Learn · immediate explanations</option><option value="exam">Test · grade at the end</option></select></label>
      <button disabled={disabled} onClick={()=>onStart(catalog.modules.flatMap(m=>m.questionIds),mode)}>Practise all {catalog.counts.practice} questions →</button>
    </div>
    {error&&<p role="alert">{error}</p>}
    <div className={styles.grid}>{modules.map(m=><article className={styles.card} key={m.id}>
      <div className={styles.meta}>{m.questionIds.length} MCQs · PDF {m.pages.join(", ")}</div><h2>{m.title}</h2><p className={styles.takeaway}>{m.takeaway}</p>
      <details open={study?true:undefined}><summary>Review notes & active recall</summary>
        {m.paragraphs.map(p=><p key={p}>{p}</p>)}
        <dl className={styles.comparison}>{m.comparisons.map(([term,definition])=><div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl>
        <aside className={styles.trap}><b>Watch the distinction</b><p>{m.trap}</p></aside>
        {m.recall.map(([q,a])=><details className={styles.recall} key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </details>
      <div className={styles.cardFooter}><div>{m.pages.map(page=><a key={page} href={`${catalog.source.file}#page=${page}`} target="_blank" rel="noreferrer">Source p. {page} ↗</a>)}</div><button disabled={disabled} onClick={()=>onStart(m.questionIds,mode)}>Practise this topic →</button></div>
    </article>)}</div>
    {!modules.length&&<p>No topic matches. Try a shorter search or clear the search field.</p>}
  </section>;
}
