"use client";

import { useEffect, useState } from "react";
import {
  respiratoryConcepts, respiratoryModules, respiratoryQuestionIndex, respiratoryScopeNote,
  respiratoryScopeQuestionIds, respiratoryDistinctIds, respiratoryQuestionProgress,
  respiratorySourceAudit, respiratorySourceText, respiratorySubjectLabels, respiratoryScopeLabels,
  respiratoryConceptsForQuestion, type RespiratoryConcept, type RespiratorySubject,
} from "@/src/lib/respiratory/concepts";
import { useRespiratoryReading, toggleRespiratoryRead } from "@/src/lib/respiratory/reading-store";
import { filterDepthIds, type PracticeDepth } from "@/src/lib/term2/practice-depth.mjs";
import { PracticeDepthSelect } from "./PracticeDepthSelect";

const subjects = Object.keys(respiratorySubjectLabels) as RespiratorySubject[];
type Practice = (scopeId: string, ids: string[], mode: "learn" | "exam", limit: number) => void;

function conceptIds(concept: RespiratoryConcept) {
  return [...new Set(concept.objectives.flatMap((objective) => objective.questionIds))];
}

export function RespiratoryConceptFeedback({ questionId }: { questionId: string }) {
  const concepts = respiratoryConceptsForQuestion(questionId);
  if (!concepts.length) return null;
  return <section className="resp-feedback" aria-label="Related respiratory study concepts">
    <p className="eyebrow">Connect the answer to the theory</p>
    {concepts.map((concept) => <details key={concept.id}>
      <summary>{concept.title}</summary>
      <p>{concept.summary}</p>
      <ul>{concept.keyPoints.map((point, index) => <li key={index}>{point}</li>)}</ul>
      <p><b>Avoid this trap:</b> {concept.examTraps.join(" ")}</p>
      <small>{concept.sources.map(respiratorySourceText).join(" | ")}</small>
    </details>)}
  </section>;
}

export function RespiratoryConceptHub({ attemptedIds, repairIds, disabled, onPractice, initialScopeId }: {
  attemptedIds: string[]; repairIds: string[]; disabled: boolean; onPractice: Practice; initialScopeId?: string;
}) {
  const [moduleId, setModuleId] = useState(initialScopeId === "all" ? "all" : respiratoryConcepts.find((concept) => concept.id === initialScopeId)?.moduleId ?? respiratoryModules.find((module) => module.id === initialScopeId)?.id ?? respiratoryModules[0]?.id ?? "all");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [view, setView] = useState<"study" | "audit">("study");
  const [mode, setMode] = useState<"learn" | "exam">("learn");
  const [limit, setLimit] = useState(20);
  const [depth, setDepth] = useState<PracticeDepth>("all");
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(respiratoryConcepts.some((concept) => concept.id === initialScopeId) ? { id: initialScopeId! } : null);
  const { readIds, ready, storageError } = useRespiratoryReading();

  useEffect(() => {
    if (!focusRequest) return;
    const card = document.getElementById(focusRequest.id);
    if (!(card instanceof HTMLDetailsElement)) return;
    card.open = true;
    card.scrollIntoView({ block: "start" });
    card.querySelector("summary")?.focus({ preventScroll: true });
  }, [focusRequest]);

  const read = new Set(readIds);
  const allIds = Object.keys(respiratoryQuestionIndex);
  const allObjectives = respiratoryConcepts.flatMap((concept) => concept.objectives);
  const unlinked = allObjectives.filter((objective) => !objective.questionIds.length);
  const questionStats = respiratoryQuestionProgress(allIds, attemptedIds, repairIds);
  const addedQuestionCount = allIds.filter((id) => respiratoryQuestionIndex[id].addedForGap).length;
  const newlySampledObjectives = allObjectives.filter((objective) => objective.questionIds.length && objective.questionIds.every((id) => respiratoryQuestionIndex[id]?.addedForGap)).length;
  const selectedModule = respiratoryModules.find((module) => module.id === moduleId);
  const search = query.toLowerCase().trim();
  const visible = respiratoryConcepts.filter((concept) => {
    if (moduleId !== "all" && concept.moduleId !== moduleId) return false;
    if (scopeFilter !== "all" && concept.scope !== scopeFilter) return false;
    if (filter === "unread" && read.has(concept.id)) return false;
    if (filter === "repair" && !respiratoryQuestionProgress(conceptIds(concept), attemptedIds, repairIds).repair) return false;
    if (filter === "unsampled" && concept.objectives.every((objective) => objective.questionIds.length)) return false;
    return !search || [concept.title, concept.summary, ...concept.keyPoints, ...concept.examTraps,
      ...concept.objectives.map((objective) => objective.text), ...concept.sources.map(respiratorySourceText),
      ...concept.retrievalPrompts.flatMap((prompt) => [prompt.prompt, prompt.answer]),
    ].join(" ").toLowerCase().includes(search);
  });
  const selectedIds = filterDepthIds(visible.flatMap(conceptIds), respiratoryQuestionIndex, depth);
  const selectedDistinct = respiratoryDistinctIds(selectedIds).length;

  function practice(id: string, ids: string[], requestedLimit = limit) {
    const chosen = requestedLimit === 1 ? ids : filterDepthIds(ids, respiratoryQuestionIndex, depth);
    if (chosen.length) onPractice(id, chosen, mode, Math.min(requestedLimit, respiratoryDistinctIds(chosen).length, 250));
  }

  return <div className="resp-concept-hub">
    <header className="resp-hub-head"><p className="eyebrow">Respiratory · Theory → recall → application</p>
      <h1>Study concepts</h1><p>Work through the reading modules, explain each idea from memory, then test it. Every MCQ has a concept home; each objective shows exactly which questions sample it.</p>
    </header>
    <div className="resp-hub-metrics">
      <div><strong>{respiratoryConcepts.length}</strong><span>Study concepts</span><small>{read.size} marked read</small></div>
      <div><strong>{allObjectives.length}</strong><span>Learning objectives</span><small>{allObjectives.length - unlinked.length} MCQ-linked · {unlinked.length} unsampled</small></div>
      <div><strong>{allIds.length}</strong><span>Question records</span><small>{questionStats.total} distinct items / image targets</small></div>
      <div><strong>{questionStats.attempted}/{questionStats.total}</strong><span>Answered in finished sessions</span><small>{questionStats.repair} to repair or flagged</small></div>
    </div>
    <aside className="resp-coverage-note"><b>What “coverage” means here</b><p>{respiratoryScopeNote} A linked MCQ samples an objective, not every statement in the notes. Anatomy variants share one target count. “Read” is a bookmark, not a mastery score. Bookmarks and results are saved locally in this browser, not synced between devices.</p></aside>
    <div className="resp-view-controls" aria-label="Respiratory study views">
      <button aria-pressed={view === "study"} onClick={() => setView("study")}>Concepts & linked MCQs</button>
      <button aria-pressed={view === "audit"} onClick={() => setView("audit")}>Coverage & source audit</button>
    </div>
    {storageError && <p role="status" className="session-error">Reading checkmarks cannot be saved in this browser right now. You can still study and practice.</p>}
    {view === "audit" ? <section className="resp-audit">
      <h2>Source-to-concept-to-question map</h2>
      <p><b>{addedQuestionCount} new MCQs</b> were added after cross-referencing the original {allIds.length - addedQuestionCount} question records. In this concept map, <b>{newlySampledObjectives} objectives</b> received their first direct question through the expansion. <b>{unlinked.length} objectives</b> currently have no linked MCQ.</p>
      <p>Counts below describe the available source set. They are not teacher-confirmed exam weightings. Questions linked across concepts are counted once within each module; shared anatomy targets count once.</p>
      <div className="resp-table-scroll"><table><caption>Module coverage</caption><thead><tr><th scope="col">Reading module</th><th scope="col">Concepts</th><th scope="col">MCQ-linked objectives</th><th scope="col">Distinct items</th><th scope="col">Read</th></tr></thead><tbody>
        {respiratoryModules.map((module) => {
          const concepts = respiratoryConcepts.filter((concept) => concept.moduleId === module.id);
          const objectives = concepts.flatMap((concept) => concept.objectives);
          return <tr key={module.id}><th scope="row"><button onClick={() => { setModuleId(module.id); setView("study"); setQuery(""); setFilter("all"); setScopeFilter("all"); }}>{module.title}</button><small>{respiratorySubjectLabels[module.subject]}</small></th><td>{concepts.length}</td><td>{objectives.filter((objective) => objective.questionIds.length).length}/{objectives.length}</td><td>{respiratoryDistinctIds(respiratoryScopeQuestionIds(module.id)).length}</td><td>{concepts.filter((concept) => read.has(concept.id)).length}/{concepts.length}</td></tr>;
        })}
      </tbody></table></div>
      <h2>Remaining limits</h2>
      <ul className="resp-limit-list">{respiratorySourceAudit.filter((entry) => entry.status !== "mapped").map((entry, index) => <li key={index}><b>{entry.topic}</b><span>{entry.note}</span><small>{entry.source} · {entry.locator} · {entry.status.replaceAll("-", " ")}</small></li>)}</ul>
      <h2>Audited source inventory</h2><p>Substantive headings, tables and clinical applications were checked against the local editions and decks. This inventory makes the scope inspectable instead of treating a large question count as proof of completeness.</p>
      <div className="resp-table-scroll"><table><caption>Source headings and their concept destinations</caption><thead><tr><th scope="col">Source / location</th><th scope="col">Topic</th><th scope="col">Mapped concepts</th><th scope="col">Audit note</th></tr></thead><tbody>
        {respiratorySourceAudit.filter((entry) => entry.status === "mapped").map((entry, index) => <tr key={index}><td>{entry.source}<small>{entry.locator}</small></td><th scope="row">{entry.topic}</th><td>{entry.conceptIds.map((id) => {
          const concept = respiratoryConcepts.find((candidate) => candidate.id === id);
          return <button key={id} onClick={() => { setView("study"); setModuleId(concept?.moduleId ?? "all"); setQuery(""); setFilter("all"); setScopeFilter("all"); setFocusRequest({ id }); }}>{concept?.title ?? id}</button>;
        })}</td><td>{entry.note}</td></tr>)}
      </tbody></table></div>
    </section> : <>
      <div className="resp-study-controls">
        <label className="resp-search"><span>Find a concept, mechanism or source</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setModuleId("all"); }} placeholder="e.g. shunt, olfactory cells, sinus drainage…" /></label>
        <label><span>Show</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All concepts</option><option value="unread">Not marked read</option><option value="repair">Questions to repair / flagged</option><option value="unsampled">Objectives without MCQs</option></select></label>
        <label><span>Source basis</span><select value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value)}><option value="all">All source types</option>{Object.entries(respiratoryScopeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </div>
      <div className="resp-study-layout">
        <nav className="resp-module-nav" aria-label="Respiratory reading modules"><button aria-current={moduleId === "all" ? "true" : undefined} onClick={() => setModuleId("all")}>All modules <small>{respiratoryConcepts.length} concepts</small></button>
          {subjects.map((subject) => <div key={subject}><h2>{respiratorySubjectLabels[subject]}</h2>{respiratoryModules.filter((module) => module.subject === subject).map((module) => {
            const concepts = respiratoryConcepts.filter((concept) => concept.moduleId === module.id);
            return <button key={module.id} aria-current={moduleId === module.id ? "true" : undefined} onClick={() => setModuleId(module.id)}>{module.title}<small>{concepts.filter((concept) => read.has(concept.id)).length}/{concepts.length} read</small></button>;
          })}</div>)}
        </nav>
        <section className="resp-study-main" aria-label="Concept notes and practice">
          <header className="resp-module-head"><h2>{selectedModule?.title ?? "All reading modules"}</h2><p>{selectedModule?.description ?? "Search or select a module to narrow the study map."}</p><small aria-live="polite">{visible.length} concepts shown · {selectedDistinct} distinct practice items</small></header>
          <div className="resp-practice-controls"><label><span>Practice mode</span><select value={mode} onChange={(event) => setMode(event.target.value as "learn" | "exam")}><option value="learn">Learn · immediate explanations</option><option value="exam">Mock · explanations after grading</option></select></label><label><span>Session size</span><select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>{[10, 20, 40, 60, 100, 250].map((value) => <option key={value} value={value}>{value === 250 ? "All available (up to 250)" : value}</option>)}</select></label>
            <button className="primary" disabled={disabled || !selectedIds.length} onClick={() => practice(moduleId, selectedIds)}>Practice shown concepts →</button>
          </div>
          <PracticeDepthSelect value={depth} onChange={setDepth} />
          <p className="resp-small-note">Question depth filters practice, not the theory notes. Core = difficulty 1–3; challenge = 4–5 (editorial, not faculty-calibrated). Inspecting a single linked question opens it regardless of this filter. Mock is source-based practice, not a past paper.</p>
          {!visible.length && <div className="resp-empty"><h3>No concepts match these filters.</h3><p>{filter === "unsampled" ? "Every objective in this selection has at least one linked MCQ. Use the source audit to see remaining source limits." : "Try another module or clear the filters."}</p><button onClick={() => { setModuleId("all"); setQuery(""); setFilter("all"); setScopeFilter("all"); }}>Show all concepts</button></div>}
          <div className="resp-concept-list">{visible.map((concept) => {
            const ids = filterDepthIds(conceptIds(concept), respiratoryQuestionIndex, depth);
            const stats = respiratoryQuestionProgress(ids, attemptedIds, repairIds);
            const linkedObjectives = concept.objectives.filter((objective) => objective.questionIds.length).length;
            return <details className="resp-concept-card" key={concept.id} id={concept.id}>
              <summary><div><span>{respiratorySubjectLabels[concept.subject]} · {respiratoryScopeLabels[concept.scope]}{read.has(concept.id) ? " · Read ✓" : ""}</span><h3>{concept.title}</h3><small>{linkedObjectives}/{concept.objectives.length} objectives MCQ-linked · {stats.total} distinct items · {stats.attempted} answered{stats.repair ? ` · ${stats.repair} to repair / flagged` : ""}</small></div></summary>
              <div className="resp-concept-body"><p className="resp-concept-summary">{concept.summary}</p>
                <h4>Understand & remember</h4><ul className="resp-key-points">{concept.keyPoints.map((point, index) => <li key={index}>{point}</li>)}</ul>
                <aside className="resp-exam-traps"><h4>Distinctions exam questions can exploit</h4><ul>{concept.examTraps.map((trap, index) => <li key={index}>{trap}</li>)}</ul></aside>
                <h4>Recall it before looking</h4><div className="resp-retrieval">{concept.retrievalPrompts.map((prompt, index) => <article key={index}><p>{prompt.prompt}</p><details><summary>Reveal model answer</summary><p>{prompt.answer}</p></details></article>)}</div>
                <h4>Learning objectives ↔ MCQs</h4><p className="resp-small-note">These links identify what a question directly samples. Work through the notes and recall prompts as well; a correct MCQ does not demonstrate every detail.</p>
                <ul className="resp-objectives">{concept.objectives.map((objective) => <li key={objective.id}><p>{objective.text}</p>
                  <div><span>{respiratoryDistinctIds(objective.questionIds).length} distinct items</span><button disabled={disabled || !filterDepthIds(objective.questionIds, respiratoryQuestionIndex, depth).length} onClick={() => practice(concept.id, objective.questionIds)}>Practice objective</button></div>
                  {objective.questionIds.length > 0 ? <details className="resp-question-map"><summary>Inspect linked questions ({objective.questionIds.length} records)</summary>{objective.questionIds.map((id) => <button disabled={disabled} key={id} onClick={() => practice(concept.id, [id], 1)}><span>{respiratoryQuestionIndex[id]?.prompt ?? id}</span><small>{id} · {respiratoryQuestionIndex[id]?.knowledgeLevel === "challenge" ? "Challenge" : "Core"} · {respiratoryQuestionIndex[id]?.kind === "dynamic_anatomy" ? "dynamic anatomy variant" : respiratoryQuestionIndex[id]?.addedForGap ? "added after gap audit" : "existing bank"}</small></button>)}</details> : <small className="resp-unsampled">Study notes present; no direct MCQ yet.</small>}
                </li>)}</ul>
                <div className="resp-concept-actions"><label><input type="checkbox" checked={read.has(concept.id)} disabled={!ready} onChange={() => toggleRespiratoryRead(concept.id)} /> Mark theory as read</label><button className="primary" disabled={disabled || !ids.length} onClick={() => practice(concept.id, ids)}>Practice this concept →</button>{stats.repair > 0 && <button disabled={disabled} onClick={() => onPractice(concept.id, ids.filter((id) => repairIds.includes(id)), "learn", 250)}>Repair linked questions</button>}</div>
                <footer className="resp-concept-sources"><h4>Read at the source</h4>{concept.sources.map((source, index) => <p key={index}><b>{source.basis.charAt(0).toUpperCase() + source.basis.slice(1)}</b> {respiratorySourceText(source)}</p>)}</footer>
              </div>
            </details>;
          })}</div>
        </section>
      </div>
    </>}
  </div>;
}
