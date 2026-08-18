"use client";

import { useEffect, useMemo, useState } from "react";
import { LessonSlide } from "@/src/components/LessonSlide";
import type { CoreLesson, LessonExamId } from "@/src/lib/lessons/types";

const subjectTitle = {
  histology: "Histology",
  embryology: "Embryology",
  physiology: "Physiology",
  biochemistry: "Biochemistry",
} as const;

export function LessonGuide({ exam, lessons, onStartLesson }: { exam: LessonExamId; lessons: CoreLesson[]; onStartLesson?: (lesson: CoreLesson) => void }) {
  const examLessons = useMemo(() => lessons.filter((lesson) => lesson.exam === exam), [exam, lessons]);
  const subjects = [...new Set(examLessons.map((lesson) => lesson.subject))];
  const [subject, setSubject] = useState<string>("all");
  const [search, setSearch] = useState("");
  const filtered = examLessons.filter((lesson) => {
    const subjectMatch = subject === "all" || lesson.subject === subject;
    const query = search.trim().toLowerCase();
    const searchMatch = !query || [lesson.title, lesson.topic, lesson.subtitle, ...lesson.topicPatterns].join(" ").toLowerCase().includes(query);
    return subjectMatch && searchMatch;
  });
  const [selectedId, setSelectedId] = useState(examLessons[0]?.id ?? "");
  const [focusMode, setFocusMode] = useState(false);
  const selected = filtered.find((lesson) => lesson.id === selectedId) ?? filtered[0] ?? examLessons[0];

  useEffect(() => {
    if (!focusMode) return;
    document.body.classList.add("lesson-focus-open");
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setFocusMode(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("lesson-focus-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [focusMode]);

  return <div className={`lesson-guide ${focusMode ? "focus-mode" : ""}`}>
    <aside className="lesson-library">
      <div className="lesson-library-tools">
        <label><span>Find a lesson</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search process, tissue or pathway" /></label>
        <div className="lesson-subjects">
          <button className={subject === "all" ? "active" : ""} onClick={() => setSubject("all")}>All <b>{examLessons.length}</b></button>
          {subjects.map((value) => <button key={value} className={subject === value ? "active" : ""} onClick={() => setSubject(value)}>{subjectTitle[value]} <b>{examLessons.filter((lesson) => lesson.subject === value).length}</b></button>)}
        </div>
      </div>
      <div className="lesson-index">
        {filtered.map((lesson, index) => <button key={lesson.id} className={selected?.id === lesson.id ? "active" : ""} onClick={() => setSelectedId(lesson.id)}>
          <span>{String(index + 1).padStart(2, "0")}</span><div><b>{lesson.title}</b><small>{lesson.topic}</small></div><i>→</i>
        </button>)}
        {!filtered.length && <p>No lessons match this search.</p>}
      </div>
    </aside>
    <section className="lesson-stage">{selected && <LessonSlide lesson={selected} actions={<>
      {onStartLesson && <button className="lesson-test-button" onClick={() => onStartLesson(selected)}>Test this slide →</button>}
      <button className="lesson-focus-button" onClick={() => setFocusMode((current) => !current)}>{focusMode ? "× Exit focus" : "⛶ Full screen"}</button>
    </>} />}</section>
  </div>;
}
