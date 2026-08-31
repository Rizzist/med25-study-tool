"use client";

import { useMemo, useState } from "react";
import type {
  Term2Concept,
  Term2ConceptDataset,
  Term2ConceptSource,
  Term2ConceptSubject,
} from "@/src/lib/term2/concept-types";
import { toggleTerm2ConceptRead, useTerm2ConceptReading } from "@/src/lib/term2/concept-reading";

type Practice = (scopeId: string, ids: string[], mode: "learn" | "exam", limit: number) => void;
const subjectLabels: Record<Term2ConceptSubject, string> = {
  anatomy: "Anatomy",
  histology: "Histology",
  embryology: "Embryology",
  physiology: "Physiology",
  biochemistry: "Biochemistry",
};
const basisLabels: Record<Term2ConceptSource["basis"], string> = {
  book: "Book",
  slides: "Slides",
  transcript: "Transcript",
  notes: "Notes",
  media: "Media",
};

function sourceText(source: Term2ConceptSource) {
  return [source.title, source.edition, source.chapter, source.locator].filter(Boolean).join(" · ");
}

function conceptQuestionIds(concept: Term2Concept) {
  return [...new Set(concept.objectives.flatMap((objective) => objective.questionIds))];
}

function distinctIds(ids: string[], dataset: Term2ConceptDataset) {
  const seen = new Set<string>();
  return ids.filter((id) => {
    const key = dataset.index[id]?.dedupeKey ?? id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function progress(ids: string[], attemptedIds: string[], repairIds: string[], dataset: Term2ConceptDataset) {
  const key = (id: string) => dataset.index[id]?.dedupeKey ?? id;
  const attempted = new Set(attemptedIds.map(key));
  const repair = new Set(repairIds.map(key));
  const unique = distinctIds(ids, dataset);
  return {
    total: unique.length,
    attempted: unique.filter((id) => attempted.has(key(id))).length,
    repair: unique.filter((id) => repair.has(key(id))).length,
  };
}

export function Term2ConceptFeedback({ dataset, questionId }: { dataset: Term2ConceptDataset; questionId: string }) {
  const ids = new Set(dataset.index[questionId]?.conceptIds ?? []);
  const concepts = dataset.catalog.concepts.filter((concept) => ids.has(concept.id));
  if (!concepts.length) return null;
  return <section className="resp-feedback" aria-label={`Related ${dataset.catalog.title} study concepts`}>
    <p className="eyebrow">Connect the answer to the theory</p>
    {concepts.map((concept) => <details key={concept.id}>
      <summary>{concept.title}</summary>
      <p>{concept.summary}</p>
      <ul>{concept.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
      <p><b>Avoid this trap:</b> {concept.examTraps.join(" ")}</p>
      <small>{concept.sources.map(sourceText).join(" | ")}</small>
    </details>)}
  </section>;
}

export function Term2ConceptHub({ dataset, attemptedIds, repairIds, disabled, onPractice, initialScopeId }: {
  dataset: Term2ConceptDataset;
  attemptedIds: string[];
  repairIds: string[];
  disabled: boolean;
  onPractice: Practice;
  initialScopeId?: string;
}) {
  const { catalog, index, coverage } = dataset;
  const modules = useMemo(() => catalog.modules.slice().sort((a, b) => a.order - b.order), [catalog.modules]);
  const initialModule = initialScopeId === "all"
    ? "all"
    : catalog.concepts.find((concept) => concept.id === initialScopeId)?.moduleId
      ?? modules.find((courseModule) => courseModule.id === initialScopeId)?.id
      ?? modules[0]?.id
      ?? "all";
  const [moduleId, setModuleId] = useState(initialModule);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [view, setView] = useState<"study" | "audit">("study");
  const [mode, setMode] = useState<"learn" | "exam">("learn");
  const [limit, setLimit] = useState(20);
  const validConceptIds = useMemo(() => catalog.concepts.map((concept) => concept.id), [catalog.concepts]);
  const { readIds, ready: readingReady, storageError } = useTerm2ConceptReading(catalog.examId, validConceptIds);

  const read = new Set(readIds);
  const allIds = Object.keys(index);
  const allObjectives = catalog.concepts.flatMap((concept) => concept.objectives);
  const unlinked = allObjectives.filter((objective) => !objective.questionIds.length);
  const allStats = progress(allIds, attemptedIds, repairIds, dataset);
  const selectedModule = modules.find((courseModule) => courseModule.id === moduleId);
  const search = query.toLowerCase().trim();
  const visible = catalog.concepts.filter((concept) => {
    if (moduleId !== "all" && concept.moduleId !== moduleId) return false;
    if (scopeFilter !== "all" && concept.scope !== scopeFilter) return false;
    if (filter === "unread" && read.has(concept.id)) return false;
    if (filter === "repair" && !progress(conceptQuestionIds(concept), attemptedIds, repairIds, dataset).repair) return false;
    if (filter === "gap-added" && !conceptQuestionIds(concept).some((id) => index[id]?.addedForGap)) return false;
    return !search || [
      concept.title,
      concept.summary,
      ...concept.keyPoints,
      ...concept.examTraps,
      ...concept.objectives.map((objective) => objective.text),
      ...concept.sources.map(sourceText),
      ...concept.retrievalPrompts.flatMap((prompt) => [prompt.prompt, prompt.answer]),
    ].join(" ").toLowerCase().includes(search);
  });
  const selectedIds = [...new Set(visible.flatMap(conceptQuestionIds))];
  const subjects = [...new Set(modules.map((courseModule) => courseModule.subject))];

  function practice(scopeId: string, ids: string[], requestedLimit = limit) {
    onPractice(scopeId, ids, mode, Math.min(requestedLimit, distinctIds(ids, dataset).length, 250));
  }

  function toggleRead(id: string) {
    toggleTerm2ConceptRead(catalog.examId, id, validConceptIds);
  }

  return <div className="resp-concept-hub">
    <header className="resp-hub-head">
      <p className="eyebrow">{catalog.title} · Theory → recall → application</p>
      <h1>Study concepts</h1>
      <p>Read each source-mapped concept, explain it from memory, then practise the objectives that sample it. Course material and book-only extensions stay visibly separate.</p>
    </header>
    <div className="resp-hub-metrics">
      <div><strong>{catalog.concepts.length}</strong><span>Study concepts</span><small>{read.size} marked read</small></div>
      <div><strong>{allObjectives.length}</strong><span>Learning objectives</span><small>{allObjectives.length - unlinked.length} MCQ-linked · {unlinked.length} unsampled</small></div>
      <div><strong>{allIds.length}</strong><span>Question records</span><small>{allStats.total} distinct items / anatomy targets</small></div>
      <div><strong>{allStats.attempted}/{allStats.total}</strong><span>Answered in finished sessions</span><small>{allStats.repair} to repair or flagged</small></div>
    </div>
    <aside className="resp-coverage-note"><b>What “coverage” means here</b><p>{catalog.scopeNote} A linked MCQ samples an objective; it does not prove mastery or official exam weighting. “Read” is a device-local bookmark, not a score.</p></aside>
    <div className="resp-view-controls">
      <button aria-pressed={view === "study"} onClick={() => setView("study")}>Concepts & linked MCQs</button>
      <button aria-pressed={view === "audit"} onClick={() => setView("audit")}>Coverage & source audit</button>
    </div>
    {storageError && <p role="status" className="session-error">Reading checkmarks cannot be saved in this browser. Studying and practice still work.</p>}
    {view === "audit" ? <section className="resp-audit">
      <h2>Source → concept → question map</h2>
      <p><b>{coverage.addedQuestionCount} gap questions</b> were added after cross-referencing the original bank. <b>{coverage.objectivesFirstSampledByExpansion} objectives</b> received their first direct sample. <b>{coverage.unsampledObjectiveIds.length} objectives</b> remain unsampled.</p>
      <p>These are source-coverage counts, never a claim of faculty weighting or a past-paper distribution.</p>
      <div className="resp-table-scroll"><table><caption>Module coverage</caption><thead><tr><th>Reading module</th><th>Concepts</th><th>Linked objectives</th><th>Distinct items</th><th>Read</th></tr></thead><tbody>
        {modules.map((courseModule) => {
          const concepts = catalog.concepts.filter((concept) => concept.moduleId === courseModule.id);
          const objectives = concepts.flatMap((concept) => concept.objectives);
          const ids = [...new Set(objectives.flatMap((objective) => objective.questionIds))];
          return <tr key={courseModule.id}><th><button onClick={() => { setModuleId(courseModule.id); setView("study"); }}>{courseModule.title}</button><small>{subjectLabels[courseModule.subject]}</small></th><td>{concepts.length}</td><td>{objectives.filter((objective) => objective.questionIds.length).length}/{objectives.length}</td><td>{distinctIds(ids, dataset).length}</td><td>{concepts.filter((concept) => read.has(concept.id)).length}/{concepts.length}</td></tr>;
        })}
      </tbody></table></div>
      <h2>Remaining limits</h2>
      <ul className="resp-limit-list">{catalog.sourceAudit.filter((entry) => entry.status !== "mapped").map((entry) => <li key={`${entry.source}:${entry.locator}:${entry.topic}`}><b>{entry.topic}</b><span>{entry.note}</span><small>{entry.source} · {entry.locator} · {entry.status.replaceAll("-", " ")}</small></li>)}</ul>
      <h2>Audited source inventory</h2>
      <div className="resp-table-scroll"><table><caption>Mapped headings, tables, figures, and course material</caption><thead><tr><th>Source / location</th><th>Topic</th><th>Concept destination</th><th>Audit note</th></tr></thead><tbody>
        {catalog.sourceAudit.filter((entry) => entry.status === "mapped").map((entry) => <tr key={`${entry.source}:${entry.locator}:${entry.topic}`}><td>{entry.source}<small>{entry.locator}</small></td><th>{entry.topic}</th><td>{entry.conceptIds.map((id) => <button key={id} onClick={() => { setView("study"); setModuleId(catalog.concepts.find((concept) => concept.id === id)?.moduleId ?? "all"); setQuery(catalog.concepts.find((concept) => concept.id === id)?.title ?? id); }}>{catalog.concepts.find((concept) => concept.id === id)?.title ?? id}</button>)}</td><td>{entry.note}</td></tr>)}
      </tbody></table></div>
    </section> : <>
      <div className="resp-study-controls">
        <label className="resp-search"><span>Find a concept, mechanism, structure, or source</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setModuleId("all"); }} placeholder="Search the complete theory map…" /></label>
        <label><span>Show</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All concepts</option><option value="unread">Not marked read</option><option value="repair">Questions to repair / flagged</option><option value="gap-added">Concepts with gap additions</option></select></label>
        <label><span>Source scope</span><select value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value)}><option value="all">Course + book extensions</option><option value="course">Course-supported</option><option value="book-extension">Book extension</option></select></label>
      </div>
      <div className="resp-study-layout">
        <nav className="resp-module-nav" aria-label={`${catalog.title} reading modules`}><button aria-current={moduleId === "all" ? "true" : undefined} onClick={() => setModuleId("all")}>All modules <small>{catalog.concepts.length} concepts</small></button>
          {subjects.map((subject) => <div key={subject}><h2>{subjectLabels[subject]}</h2>{modules.filter((courseModule) => courseModule.subject === subject).map((courseModule) => {
            const concepts = catalog.concepts.filter((concept) => concept.moduleId === courseModule.id);
            return <button key={courseModule.id} aria-current={moduleId === courseModule.id ? "true" : undefined} onClick={() => setModuleId(courseModule.id)}>{courseModule.title}<small>{concepts.filter((concept) => read.has(concept.id)).length}/{concepts.length} read</small></button>;
          })}</div>)}
        </nav>
        <section className="resp-study-main">
          <header className="resp-module-head"><h2>{selectedModule?.title ?? "All reading modules"}</h2><p>{selectedModule?.description ?? "Search or select a module to narrow the study map."}</p><small>{visible.length} concepts · {distinctIds(selectedIds, dataset).length} distinct practice items</small></header>
          <div className="resp-practice-controls"><label><span>Practice mode</span><select value={mode} onChange={(event) => setMode(event.target.value as "learn" | "exam")}><option value="learn">Learn · immediate explanations</option><option value="exam">Source-based test · feedback after grading</option></select></label><label><span>Session size</span><select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>{[10, 20, 40, 60, 100, 250].map((value) => <option key={value} value={value}>{value === 250 ? "All available (up to 250)" : value}</option>)}</select></label><button className="primary" disabled={disabled || !selectedIds.length} onClick={() => practice(moduleId, selectedIds)}>Practice shown concepts →</button></div>
          <p className="resp-small-note">Learn prioritizes repair, then unseen questions. Source-based tests balance practice; they are not past papers or an official blueprint.</p>
          {!visible.length && <div className="resp-empty"><h3>No concepts match these filters.</h3><button onClick={() => { setModuleId("all"); setQuery(""); setFilter("all"); setScopeFilter("all"); }}>Show all concepts</button></div>}
          <div className="resp-concept-list">{visible.map((concept) => {
            const ids = conceptQuestionIds(concept);
            const stats = progress(ids, attemptedIds, repairIds, dataset);
            return <details className="resp-concept-card" key={concept.id} id={concept.id}><summary><div><span>{subjectLabels[concept.subject]} · {concept.scope === "course" ? "Course-supported" : "Book extension"}{read.has(concept.id) ? " · Read ✓" : ""}</span><h3>{concept.title}</h3><small>{concept.objectives.length} linked objectives · {stats.total} distinct items · {stats.attempted} answered{stats.repair ? ` · ${stats.repair} to repair / flagged` : ""}</small></div></summary>
              <div className="resp-concept-body"><p className="resp-concept-summary">{concept.summary}</p><h4>Understand & remember</h4><ul className="resp-key-points">{concept.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul><aside className="resp-exam-traps"><h4>Distinctions exam questions can exploit</h4><ul>{concept.examTraps.map((trap) => <li key={trap}>{trap}</li>)}</ul></aside><h4>Recall it before looking</h4><div className="resp-retrieval">{concept.retrievalPrompts.map((item) => <article key={item.prompt}><p>{item.prompt}</p><details><summary>Reveal model answer</summary><p>{item.answer}</p></details></article>)}</div><h4>Learning objectives ↔ MCQs</h4><ul className="resp-objectives">{concept.objectives.map((objective) => <li key={objective.id}><p>{objective.text}</p><div><span>{distinctIds(objective.questionIds, dataset).length} distinct items</span><button disabled={disabled} onClick={() => practice(concept.id, objective.questionIds)}>Practice objective</button></div><details className="resp-question-map"><summary>Inspect linked questions ({objective.questionIds.length})</summary>{objective.questionIds.map((id) => <button disabled={disabled} key={id} onClick={() => practice(concept.id, [id], 1)}><span>{index[id]?.prompt ?? id}</span><small>{id} · {index[id]?.addedForGap ? "added after gap audit" : index[id]?.kind === "dynamic_anatomy_3d" ? "interactive 3D" : "existing verified bank"}</small></button>)}</details></li>)}</ul><div className="resp-concept-actions"><label><input type="checkbox" checked={read.has(concept.id)} disabled={!readingReady} onChange={() => toggleRead(concept.id)} /> Mark theory as read</label><button className="primary" disabled={disabled || !ids.length} onClick={() => practice(concept.id, ids)}>Practice this concept →</button>{stats.repair > 0 && <button disabled={disabled} onClick={() => onPractice(concept.id, ids.filter((id) => repairIds.includes(id)), "learn", 250)}>Repair linked questions</button>}</div><footer className="resp-concept-sources"><h4>Read at the source</h4>{concept.sources.map((source) => <p key={`${source.title}:${source.locator}`}><b>{basisLabels[source.basis]}</b> {sourceText(source)}</p>)}</footer></div>
            </details>;
          })}</div>
        </section>
      </div>
    </>}
  </div>;
}
