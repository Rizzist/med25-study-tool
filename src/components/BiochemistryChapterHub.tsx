"use client";

import { useMemo, useState } from "react";
import type { BiochemistryChapterDefinition, BiochemistryCoverage } from "@/src/lib/biochemistry/chapters";

export type BiochemistryStudyMode = "learn" | "exam";

export type BiochemistryChapterProgress = BiochemistryChapterDefinition & {
  questionCount: number;
  questionIds: string[];
  seenCount: number;
  unseenCount: number;
  wrongCount: number;
  repairCount: number;
  masteredCount: number;
  mastery: number;
};

type ChapterHubProps = {
  chapters: BiochemistryChapterProgress[];
  loading?: boolean;
  onStart: (chapterId: string, mode: BiochemistryStudyMode, length: number) => void;
};

const coverageLabels: Record<BiochemistryCoverage, string> = {
  confirmed: "Teacher-confirmed",
  partial: "Partial / historical",
  supplement: "Lippincott supplement",
};

const coverageNotes: Record<BiochemistryCoverage, string> = {
  confirmed: "Directly represented in the downloaded teacher material or current exam scope.",
  partial: "Useful chapter coverage, but the local teacher evidence is incomplete or older.",
  supplement: "Extra Lippincott coverage for transfer and integration; lower priority than confirmed modules.",
};

export function BiochemistryChapterHub({ chapters, loading = false, onStart }: ChapterHubProps) {
  const [mode, setMode] = useState<BiochemistryStudyMode>("learn");
  const [length, setLength] = useState<10 | 20 | 40 | "all">(20);
  const [coverage, setCoverage] = useState<BiochemistryCoverage | "all">("all");

  const visible = useMemo(
    () => chapters.filter((chapter) => coverage === "all" || chapter.coverage === coverage),
    [chapters, coverage],
  );
  const units = useMemo(() => [...new Set(visible.map((chapter) => chapter.unit))], [visible]);
  const visibleQuestionCount = visible.reduce((sum, chapter) => sum + chapter.questionCount, 0);
  const visibleMasteredCount = visible.reduce((sum, chapter) => sum + chapter.masteredCount, 0);

  return <section className="biochem-hub" aria-labelledby="biochem-chapter-heading">
    <div className="chapter-hub-head">
      <div>
        <span className="eyebrow">Lippincott + teacher slides</span>
        <h2 id="biochem-chapter-heading">Biochemistry chapter exams</h2>
        <p>Learn gives feedback inside every option immediately. Chapter exam hides the key and explanations until you finish.</p>
      </div>
      <div className="chapter-hub-summary" aria-label="Visible chapter progress">
        <strong>{visibleMasteredCount}<small> / {visibleQuestionCount}</small></strong>
        <span>questions mastered</span>
      </div>
    </div>

    <div className="chapter-controls">
      <fieldset>
        <legend>Mode</legend>
        <div className="chapter-segmented">
          <button className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}><b>Learn</b><small>instant teaching</small></button>
          <button className={mode === "exam" ? "active" : ""} onClick={() => setMode("exam")}><b>Chapter exam</b><small>feedback at finish</small></button>
        </div>
      </fieldset>
      <fieldset>
        <legend>Questions</legend>
        <div className="chapter-segmented compact">
          {([10, 20, 40, "all"] as const).map((value) => <button key={value} className={length === value ? "active" : ""} onClick={() => setLength(value)}>{value === "all" ? "All" : value}</button>)}
        </div>
      </fieldset>
      <fieldset className="coverage-control">
        <legend>Scope</legend>
        <div className="chapter-segmented compact">
          {(["all", "confirmed", "partial", "supplement"] as const).map((value) => <button key={value} className={coverage === value ? "active" : ""} onClick={() => setCoverage(value)}>{value === "all" ? "All" : value === "confirmed" ? "Confirmed" : value === "partial" ? "Partial" : "Supplement"}</button>)}
        </div>
      </fieldset>
    </div>

    <div className="coverage-key">
      {(["confirmed", "partial", "supplement"] as const).map((value) => <span key={value} className={value}><i /> <b>{coverageLabels[value]}</b> — {coverageNotes[value]}</span>)}
    </div>

    <div className="chapter-units">
      {units.map((unit) => <section className="chapter-unit" key={unit}>
        <div className="chapter-unit-title"><h3>{unit}</h3><span>{visible.filter((chapter) => chapter.unit === unit).reduce((sum, chapter) => sum + chapter.questionCount, 0)} questions</span></div>
        <div className="chapter-grid">
          {visible.filter((chapter) => chapter.unit === unit).map((chapter) => {
            const requestedLength = length === "all" ? chapter.questionCount : Math.min(length, chapter.questionCount);
            return <article className={`chapter-card coverage-${chapter.coverage}`} key={chapter.id}>
              <div className="chapter-card-top">
                <span>{chapter.chapterLabel}</span>
                <i className={`coverage-badge ${chapter.coverage}`}>{coverageLabels[chapter.coverage]}</i>
              </div>
              <h4>{chapter.title}</h4>
              <p>{chapter.description}</p>
              <div className="chapter-progress-row">
                <div><span style={{ width: `${chapter.mastery}%` }} /></div>
                <b>{chapter.mastery}% mastered</b>
              </div>
              <div className="chapter-stats">
                <span><b>{chapter.questionCount}</b> total</span>
                <span><b>{chapter.unseenCount}</b> unseen</span>
                <span className={chapter.repairCount ? "needs-repair" : ""}><b>{chapter.repairCount}</b> repair</span>
              </div>
              <button className="chapter-start" disabled={loading || !chapter.questionCount} onClick={() => onStart(chapter.id, mode, requestedLength)}>
                {loading ? "Loading…" : mode === "learn" ? `Learn ${requestedLength} →` : `Exam ${requestedLength} →`}
              </button>
            </article>;
          })}
        </div>
      </section>)}
    </div>
  </section>;
}

export function BiochemistryMasteryGrid({ chapters, onRepair }: {
  chapters: BiochemistryChapterProgress[];
  onRepair: (chapterId: string, questionIds: string[]) => void;
}) {
  const repairTotal = chapters.reduce((sum, chapter) => sum + chapter.repairCount, 0);
  const masteredTotal = chapters.reduce((sum, chapter) => sum + chapter.masteredCount, 0);
  const questionTotal = chapters.reduce((sum, chapter) => sum + chapter.questionCount, 0);

  return <section className="mastery-panel" aria-labelledby="mastery-heading">
    <div className="mastery-panel-head">
      <div><span className="eyebrow">Long-term chapter map</span><h2 id="mastery-heading">Biochemistry mastery</h2></div>
      <p><b>{masteredTotal}</b> of {questionTotal} mastered · <strong>{repairTotal}</strong> currently need repair</p>
    </div>
    <div className="mastery-grid">
      {chapters.map((chapter) => <article key={chapter.id} className={`mastery-tile coverage-${chapter.coverage}`}>
        <div><span>{chapter.chapterLabel}</span><i>{chapter.coverage === "confirmed" ? "Confirmed" : chapter.coverage === "partial" ? "Partial" : "Supplement"}</i></div>
        <h3>{chapter.shortTitle}</h3>
        <div className="mastery-bar"><span style={{ width: `${chapter.mastery}%` }} /></div>
        <p><b>{chapter.mastery}%</b><span>{chapter.seenCount}/{chapter.questionCount} seen</span></p>
        <button disabled={!chapter.repairCount} onClick={() => onRepair(chapter.id, chapter.questionIds)}>{chapter.repairCount ? `Repair ${chapter.repairCount} →` : "No repairs"}</button>
      </article>)}
    </div>
  </section>;
}
