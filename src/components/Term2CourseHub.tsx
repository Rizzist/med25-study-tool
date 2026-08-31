"use client";

import { useMemo, useState } from "react";
import type { Term2CourseCatalog } from "@/src/lib/term2/course";

type Props = {
  catalog: Term2CourseCatalog;
  attemptedIds: string[];
  repairIds: string[];
  disabled: boolean;
  onPractice: (ids: string[], mode: "learn" | "exam", limit: number) => void;
};

const subjectLabel: Record<Term2CourseCatalog["modules"][number]["subject"], string> = {
  anatomy: "Anatomy", histology: "Histology", embryology: "Embryology", physiology: "Physiology", biochemistry: "Biochemistry",
};

export function Term2CourseHub({ catalog, attemptedIds, repairIds, disabled, onPractice }: Props) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [showExtensions, setShowExtensions] = useState(true);
  const attempted = useMemo(() => new Set(attemptedIds), [attemptedIds]);
  const repair = useMemo(() => new Set(repairIds), [repairIds]);
  const modules = catalog.modules.filter((module) => {
    if (subject !== "all" && module.subject !== subject) return false;
    if (!showExtensions && module.scope === "book-extension") return false;
    const needle = query.trim().toLowerCase();
    return !needle || [module.title, module.summary, module.sourceLocator, ...module.keyPoints].join(" ").toLowerCase().includes(needle);
  });
  const visibleIds = [...new Set(modules.flatMap((module) => module.questionIds))];
  const subjects = [...new Set(catalog.modules.map((module) => module.subject))];
  return <section className="t2-course-hub">
    <header className="t2-course-hero"><div><p className="eyebrow">Term 2 · Source-grounded curriculum</p><h1>{catalog.title}</h1><p>{catalog.scopeNote}</p></div><div><strong>{catalog.modules.length}</strong><span>study modules</span><b>{new Set(catalog.modules.flatMap((module) => module.questionIds)).size} linked questions</b></div></header>
    <div className="t2-course-filters"><label>Search concepts<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Structure, pathway, mechanism…" /></label><label>Subject<select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="all">All subjects</option>{subjects.map((id) => <option key={id} value={id}>{subjectLabel[id]}</option>)}</select></label><label className="t2-extension-toggle"><input type="checkbox" checked={showExtensions} onChange={(event) => setShowExtensions(event.target.checked)} /> Include book-only extensions</label></div>
    <div className="t2-course-actions"><p>{modules.length} modules shown · {visibleIds.length} questions · {visibleIds.filter((id) => attempted.has(id)).length} attempted · {visibleIds.filter((id) => repair.has(id)).length} to repair</p><div><button className="primary" disabled={disabled || !visibleIds.length} onClick={() => onPractice(visibleIds, "learn", Math.min(40, visibleIds.length))}>Start 40-question study sprint →</button><button disabled={disabled || !visibleIds.length} onClick={() => onPractice(visibleIds, "exam", Math.min(40, visibleIds.length))}>Test without feedback</button></div></div>
    <div className="t2-module-grid">{modules.map((module) => {
      const repairs = module.questionIds.filter((id) => repair.has(id));
      return <article key={module.id}><div className="t2-module-meta"><span>{subjectLabel[module.subject]}</span><i>{module.scope === "course" ? "COURSE" : "BOOK EXTENSION"}</i></div><h2>{module.title}</h2><p>{module.summary}</p><small>{module.sourceLocator}</small><ul>{module.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>{module.retrieval.length > 0 && <details><summary>Active recall ({module.retrieval.length})</summary>{module.retrieval.map((item) => <details key={item.prompt}><summary>{item.prompt}</summary><p>{item.answer}</p></details>)}</details>}<div className="t2-module-progress"><span>{module.questionIds.filter((id) => attempted.has(id)).length}/{module.questionIds.length} attempted</span><span>{repairs.length} to repair</span></div><div className="t2-module-actions"><button className="primary" disabled={disabled || !module.questionIds.length} onClick={() => onPractice(module.questionIds, "learn", module.questionIds.length)}>Practise module →</button><button disabled={disabled || !repairs.length} onClick={() => onPractice(repairs, "learn", repairs.length)}>Repair {repairs.length}</button></div></article>;
    })}</div>
    <details className="t2-source-audit"><summary>Source map and unresolved limits</summary><div>{catalog.sources.map((source) => <article key={`${source.title}:${source.locator}`}><span>{source.kind} · {source.status}</span><b>{source.title}</b><p>{source.locator}</p></article>)}</div>{catalog.unresolved.length > 0 && <><h3>Still unresolved</h3><ul>{catalog.unresolved.map((item) => <li key={item}>{item}</li>)}</ul></>}</details>
  </section>;
}
