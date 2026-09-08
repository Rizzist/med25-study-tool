"use client";

import { depthSummary, type DepthEntry } from "@/src/lib/term2/practice-depth.mjs";

export function DepthPracticePanel({ index, disabled, onPractice }: {
  index: Record<string, DepthEntry>;
  disabled: boolean;
  onPractice: (ids: string[]) => void;
}) {
  const rows = depthSummary(index);
  return <section className="depth-practice-panel" aria-label="Practice by discipline and difficulty">
    <h2>Core knowledge & hard questions</h2>
    <p>Build recall, then practise multi-step applications. Difficulty is editorial, not calibrated to a faculty exam. The theory map contains short-answer Q&As and source references.</p>
    <div className="resp-table-scroll"><table><caption>Question depth by subject</caption><thead><tr><th>Subject</th><th>Theory / image questions</th><th>Core · 1–3</th><th>Challenge · 4–5</th></tr></thead><tbody>{rows.map((row) => <tr key={row.subject}><th>{row.subject[0].toUpperCase() + row.subject.slice(1)}</th><td>{row.written}<small>+ {row.total - row.written} dynamic records; {row.distinctTargets} distinct items overall</small></td><td><button disabled={disabled || !row.core.length} onClick={() => onPractice(row.core)}>Practice core ({row.core.length})</button></td><td><button disabled={disabled || !row.challenge.length} onClick={() => onPractice(row.challenge)}>Practice challenge ({row.challenge.length})</button></td></tr>)}</tbody></table></div>
    <small>Source-based practice only. Past Exams remains reserved for genuine papers.</small>
  </section>;
}
