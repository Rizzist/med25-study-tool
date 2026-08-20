/* eslint-disable @next/next/no-img-element -- lesson images are verified local study assets */

import type { ReactNode } from "react";
import type { CoreLesson } from "@/src/lib/lessons/types";

const examBadge = { july25: "JUL 25", aug22: "AUG 22", july29: "AUG 25", both: "BOTH" } as const;

export function LessonSlide({ lesson, compact = false, actions }: { lesson: CoreLesson; compact?: boolean; actions?: ReactNode }) {
  return <article className={`lesson-slide ${compact ? "compact" : ""}`}>
    <header className="lesson-slide-header">
      <div>
        <span>{lesson.subject} · {lesson.kind}</span>
        <h2>{lesson.title}</h2>
        <p>{lesson.subtitle}</p>
      </div>
      <div className="lesson-slide-actions">{actions}<b>{examBadge[lesson.exam]}</b></div>
    </header>

    <div className={`lesson-main ${lesson.asset ? "with-asset" : ""}`}>
      {lesson.asset && <figure className="lesson-asset"><img src={lesson.asset} alt={`${lesson.title} study diagram`} /><figcaption>{lesson.visual.caption}</figcaption></figure>}
      <figure className={`lesson-visual ${lesson.visual.type}`}>
        {!lesson.asset && <figcaption>{lesson.visual.caption}</figcaption>}
        <div className="lesson-visual-items">
          {lesson.visual.items.map((item, index) => <div className="lesson-visual-item" key={`${lesson.id}-${item.label}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><b>{item.label}</b><p>{item.detail}</p><em>{item.cue}</em></div>
          </div>)}
        </div>
      </figure>
    </div>

    <div className="lesson-notes">
      <section><h3>Must know</h3><ul>{lesson.essentials.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section><h3>Recognize it</h3><ul>{lesson.recognition.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section className="lesson-traps"><h3>Exam traps</h3>{lesson.traps.map((trap) => <p key={`${trap.wrong}-${trap.right}`}><s>{trap.wrong}</s><b>{trap.right}</b></p>)}</section>
    </div>

    <footer><span>{lesson.topic}</span><small>{lesson.source.label} · {lesson.source.detail}</small></footer>
  </article>;
}
