"use client";

import { useState } from "react";
import catalog from "@/data/term2/biochemistry-practical.json";
import styles from "./BiochemistryPracticalHub.module.css";

export { default as biochemistryPracticalCatalog } from "@/data/term2/biochemistry-practical.json";

export function BiochemistryPracticalHub({ seenIds, repairIds, disabled, error, onPractice }: {
  seenIds: string[];
  repairIds: string[];
  disabled: boolean;
  error?: string;
  onPractice: (ids: string[], mode: "learn" | "exam", limit: number) => void;
}) {
  const [stationId, setStationId] = useState("all");
  const [filter, setFilter] = useState("all");
  const [mode, setMode] = useState<"learn" | "exam">("learn");
  const [length, setLength] = useState(20);
  const selected = catalog.stations.filter(station => stationId === "all" || station.id === stationId);
  const seen = new Set(seenIds);
  const repairs = new Set(repairIds);
  const eligible = (station: typeof catalog.stations[number]) => {
    const ids = filter === "challenge" ? station.challengeIds : filter === "images" ? station.imageIds : station.questionIds;
    return ids.filter(id => filter === "unseen" ? !seen.has(id) : filter === "repair" ? repairs.has(id) : true);
  };
  const selectedIds = selected.flatMap(eligible);
  const launchCount = Math.min(length || selectedIds.length, selectedIds.length);
  const run = (ids: string[]) => onPractice(ids, mode, Math.min(length || ids.length, ids.length));

  return <div className={styles.hub}>
    <header>
      <p className="eyebrow">Biochemistry II · laboratory practice</p>
      <h1>Biochemistry practicals</h1>
      <p>{catalog.totals.questions} questions · {catalog.totals.stations} stations · {catalog.totals.challenge} challenge questions · {catalog.totals.images} image questions</p>
      <p className={styles.note}>{catalog.scopeNote}</p>
    </header>
    <section className={styles.controls} aria-label="Practical session settings">
      <label>Station<select value={stationId} onChange={event => setStationId(event.target.value)}>
        <option value="all">All six stations</option>
        {catalog.stations.map(station => <option key={station.id} value={station.id}>{station.title}</option>)}
      </select></label>
      <label>Question selection<select value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="all">All questions</option><option value="challenge">Challenge only</option>
        <option value="images">Slide-image questions</option><option value="unseen">Not yet seen</option><option value="repair">Wrong or flagged</option>
      </select></label>
      <label>Feedback<select value={mode} onChange={event => setMode(event.target.value as "learn" | "exam")}>
        <option value="learn">Learn · after each answer</option><option value="exam">Test · after grading</option>
      </select></label>
      <label>Session length<select value={length} onChange={event => setLength(Number(event.target.value))}>
        <option value={10}>10 questions</option><option value={20}>20 questions</option><option value={40}>40 questions</option><option value={0}>All selected questions</option>
      </select></label>
      <button className="primary" disabled={disabled || !selectedIds.length} onClick={() => run(selectedIds)}>
        Start {launchCount} {launchCount === 1 ? "question" : "questions"} →
      </button>
      <small role="status">{disabled ? "Preparing your practical session…" : `${selectedIds.length} matching ${selectedIds.length === 1 ? "question" : "questions"}. Progress, wrong answers and flags use your existing saved study history.`}</small>
    </section>
    {error && <p role="alert" className="session-error">{error}</p>}
    {!selectedIds.length && <p role="status">No questions match this selection. Choose another station or filter.</p>}
    <div className={styles.stations}>
      {selected.map((station) => {
        const ids = eligible(station);
        return <article key={station.id}>
          <p className="eyebrow">{station.questionIds.length} questions · {station.challengeIds.length} challenge · {station.questionIds.filter(id => seen.has(id)).length} seen</p>
          <h2>{station.title}</h2><p>{station.summary}</p>
          <button className="primary" disabled={disabled || !ids.length} onClick={() => run(ids)}>Practise this station · {Math.min(length || ids.length, ids.length)} →</button>
          <details><summary>Review essentials & source map</summary>
            <ul>{station.checkpoints.map(point => <li key={point}>{point}</li>)}</ul>
            <h3>Watch for these errors</h3>
            <ul>{station.traps.map(trap => <li key={trap}>{trap}</li>)}</ul>
            <h3>Local sources</h3>
            <ul className={styles.sources}>{station.sources.map(source => <li key={source.title}>{source.title}<br /><small>{source.locator}</small></li>)}</ul>
          </details>
        </article>;
      })}
    </div>
    <p className={styles.note}>For the complete linked recall prompts, open Study concepts and select a “Practical” module. The Past exams section remains separate and contains no generated practical questions.</p>
  </div>;
}
