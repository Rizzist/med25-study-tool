"use client";
/* eslint-disable @next/next/no-img-element -- final-exam images are streamed from the local study bridge */

import { useEffect, useMemo, useState } from "react";
import { LessonSlide } from "@/src/components/LessonSlide";
import { allLessons } from "@/src/lib/lessons";
import { lessonForQuestion } from "@/src/lib/lessons/types";
import { filterFinalExamQuestions } from "@/src/lib/mcq/final-exam-scope.mjs";
import {
  FINAL_EXAM_STORAGE_KEY,
  emptyFinalExamProgress,
  parseFinalExamProgress,
  reconcileFinalExamSession,
} from "@/src/lib/mcq/final-exam-state.mjs";
import type { MCQQuestion } from "@/src/lib/mcq/types";

type ExamId = "july25" | "july29";
type FinalExamBankId = "telegram-past-papers" | "downloaded-core";
type FinalBaseSessionKey = `${ExamId}:${FinalExamBankId}`;
type FinalSessionKey = FinalBaseSessionKey
  | "july29:telegram-past-papers:no-carb-lipid-metabolism"
  | "july29:downloaded-core:no-carb-lipid-metabolism";
type FinalAnswer = {
  selectedOptionId: string;
  correct: boolean;
  answeredAt: string;
  questionRevision: number;
  correctOptionId: string;
};
type FinalSession = {
  bankFingerprint: string;
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, FinalAnswer>;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
};
type FinalProgress = { version: 2; sessions: Record<FinalSessionKey, FinalSession | null> };

const examLabels: Record<ExamId, { date: string; title: string }> = {
  july25: { date: "July 25", title: "Tissue Development & Function" },
  july29: { date: "Aug 25", title: "Cell & Molecules" },
};

function mediaUrl(bridgeUrl: string, question: MCQQuestion, mediaId: string) {
  const query = new URLSearchParams({ questionId: question.id, mediaId });
  return `${bridgeUrl}/api/media?${query}`;
}

export function FinalExam({ exam, bridgeUrl }: { exam: ExamId; bridgeUrl: string }) {
  const [bank, setBank] = useState<FinalExamBankId>("telegram-past-papers");
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [fingerprint, setFingerprint] = useState("");
  const [bankLabel, setBankLabel] = useState("Telegram Past Papers");
  const [bankDescription, setBankDescription] = useState("The original source-traceable past-paper bank.");
  const [excludeCarbohydrateLipidMetabolism, setExcludeCarbohydrateLipidMetabolism] = useState(true);
  const [filteredOutCount, setFilteredOutCount] = useState(0);
  const [progress, setProgress] = useState<FinalProgress>(() => emptyFinalExamProgress() as FinalProgress);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);

  const byId = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const baseSessionKey = `${exam}:${bank}` as FinalBaseSessionKey;
  const metabolismFilterActive = exam === "july29" && excludeCarbohydrateLipidMetabolism;
  const sessionKey = `${baseSessionKey}${metabolismFilterActive ? ":no-carb-lipid-metabolism" : ""}` as FinalSessionKey;
  const session = progress.sessions[sessionKey];
  const orderedQuestions = useMemo(
    () => session?.questionIds.flatMap((id) => byId.get(id) ?? []) ?? questions,
    [byId, questions, session],
  );
  const question = orderedQuestions[session?.currentIndex ?? 0];
  const answer = question && session ? session.answers[question.id] : undefined;
  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const correctCount = session ? Object.values(session.answers).filter((item) => item.correct).length : 0;
  const wrongCount = answeredCount - correctCount;
  const completed = Boolean(session?.completedAt);
  const linkedLesson = question && bank !== "downloaded-core" ? lessonForQuestion(question, exam, allLessons) : undefined;

  useEffect(() => {
    let cancelled = false;
    void fetch(`${bridgeUrl}/api/final-exam?exam=${exam}&bank=${bank}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { questions?: MCQQuestion[]; fingerprint?: string; label?: string; description?: string; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Could not load the final-exam bank.");
        if (cancelled) return;
        const allLoaded = payload.questions ?? [];
        const loaded = filterFinalExamQuestions(allLoaded, metabolismFilterActive);
        const rawFingerprint = payload.fingerprint ?? `${exam}-${allLoaded.length}`;
        const nextFingerprint = `${rawFingerprint}:${metabolismFilterActive ? "without-carb-lipid-metabolism" : "all-topics"}`;
        let stored = emptyFinalExamProgress() as FinalProgress;
        try {
          stored = parseFinalExamProgress(window.localStorage.getItem(FINAL_EXAM_STORAGE_KEY)) as FinalProgress;
        } catch { /* Continue with an empty final-exam record. */ }
        const saved = stored.sessions[sessionKey];
        const migrationSeed = saved ?? (metabolismFilterActive ? stored.sessions[baseSessionKey] : null);
        const nextSession = migrationSeed ? reconcileFinalExamSession(migrationSeed, loaded, nextFingerprint) as FinalSession : null;
        setQuestions(loaded);
        setFilteredOutCount(allLoaded.length - loaded.length);
        setFingerprint(nextFingerprint);
        setBankLabel(payload.label ?? (bank === "downloaded-core" ? "New Downloads · Core Distilled" : "Telegram Past Papers"));
        setBankDescription(payload.description ?? "A source-traceable final-exam bank.");
        setProgress({ ...stored, sessions: { ...stored.sessions, [sessionKey]: nextSession } });
        setReady(true);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load the final-exam bank.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [bank, baseSessionKey, bridgeUrl, exam, metabolismFilterActive, sessionKey]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(FINAL_EXAM_STORAGE_KEY, JSON.stringify(progress)); }
    catch { /* The exam remains usable if browser storage is unavailable. */ }
  }, [progress, ready]);

  function chooseBank(nextBank: FinalExamBankId) {
    if (nextBank === bank) return;
    setLoading(true);
    setReady(false);
    setError("");
    setActive(false);
    setLessonOpen(false);
    setQuestions([]);
    setFilteredOutCount(0);
    setBankLabel(nextBank === "downloaded-core" ? "New Downloads · Core Distilled" : "Telegram Past Papers");
    setBank(nextBank);
  }

  function chooseMetabolismScope(exclude: boolean) {
    if (exclude === excludeCarbohydrateLipidMetabolism) return;
    setLoading(true);
    setReady(false);
    setError("");
    setActive(false);
    setLessonOpen(false);
    setQuestions([]);
    setFilteredOutCount(0);
    setExcludeCarbohydrateLipidMetabolism(exclude);
  }

  function startOrResume() {
    if (!questions.length) return;
    if (!session) {
      const next = reconcileFinalExamSession(null, questions, fingerprint) as FinalSession;
      setProgress((current) => ({ ...current, sessions: { ...current.sessions, [sessionKey]: next } }));
    }
    setLessonOpen(false);
    setActive(true);
  }

  function resetProgress() {
    if (!window.confirm(`Delete all saved ${bankLabel} answers for ${examLabels[exam].date} and restart from question 1?`)) return;
    const next = reconcileFinalExamSession(null, questions, fingerprint) as FinalSession;
    setProgress((current) => ({ ...current, sessions: { ...current.sessions, [sessionKey]: next } }));
    setLessonOpen(false);
    setActive(true);
  }

  function moveTo(index: number) {
    setLessonOpen(false);
    setProgress((current) => {
      const existing = current.sessions[sessionKey];
      if (!existing) return current;
      return {
        ...current,
        sessions: {
          ...current.sessions,
          [sessionKey]: {
            ...existing,
            currentIndex: Math.max(0, Math.min(existing.questionIds.length - 1, index)),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }

  function answerQuestion(optionId: string) {
    if (!session || !question || session.answers[question.id]) return;
    const nextAnswer: FinalAnswer = {
      selectedOptionId: optionId,
      correct: optionId === question.correctOptionId,
      answeredAt: new Date().toISOString(),
      questionRevision: question.revision,
      correctOptionId: question.correctOptionId,
    };
    setProgress((current) => {
      const existing = current.sessions[sessionKey];
      if (!existing || existing.answers[question.id]) return current;
      const answers = { ...existing.answers, [question.id]: nextAnswer };
      return {
        ...current,
        sessions: {
          ...current.sessions,
          [sessionKey]: {
            ...existing,
            answers,
            updatedAt: nextAnswer.answeredAt,
            completedAt: Object.keys(answers).length === existing.questionIds.length ? nextAnswer.answeredAt : null,
          },
        },
      };
    });
  }

  function nextUnanswered() {
    if (!session) return;
    const next = session.questionIds.findIndex((id, index) => index > session.currentIndex && !session.answers[id]);
    if (next >= 0) return moveTo(next);
    const wrapped = session.questionIds.findIndex((id) => !session.answers[id]);
    if (wrapped >= 0) moveTo(wrapped);
  }

  if (active && session && question) {
    const chosen = question.options.find((option) => option.id === answer?.selectedOptionId);
    const correct = question.options.find((option) => option.id === question.correctOptionId);
    return <main className="final-exam-shell">
      <header className="final-exam-header">
        <div className="session-mark"><b>MED//25</b><span>{examLabels[exam].date} · Final exam</span></div>
        <div className="final-live-progress">
          <span>{session.currentIndex + 1} / {session.questionIds.length}</span>
          <div><i style={{ width: `${(answeredCount / session.questionIds.length) * 100}%` }} /></div>
          <small>{answeredCount} answered · {correctCount} correct</small>
        </div>
        <button onClick={() => setActive(false)}>Save & exit</button>
      </header>
      <section className="final-exam-body">
        <div className="final-question-scroll">
          <article className="final-question-card">
            <div className="question-meta"><span>{bank === "downloaded-core" ? "Distilled core" : "Past paper"}</span><span>{question.subject}</span><span>{question.topic}</span></div>
            <h1>{question.prompt}</h1>
            {question.media?.map((media) => <figure className="study-image" key={media.id}><img src={mediaUrl(bridgeUrl, question, media.id)} alt={media.alt} /><figcaption>{media.caption ?? "Past-paper image"}</figcaption></figure>)}
            <div className={`final-options ${answer ? "locked" : ""}`}>
              {question.options.map((option) => {
                const state = answer
                  ? option.id === question.correctOptionId ? "correct" : option.id === answer.selectedOptionId ? "wrong" : ""
                  : "";
                return <button key={option.id} className={state} disabled={Boolean(answer)} onClick={() => answerQuestion(option.id)}><span>{option.id}</span><b>{option.text}</b></button>;
              })}
            </div>
            {answer && <section className={`instant-feedback ${answer.correct ? "correct" : "wrong"}`}>
              <div className="instant-feedback-title"><b>{answer.correct ? "✓ Correct" : "× Repair this"}</b><span>{question.source.title}{question.source.page ? ` · page ${question.source.page}` : ""}</span></div>
              <div className="answer-comparison"><div><span>Your answer</span><b>{chosen ? `${chosen.id}. ${chosen.text}` : answer.selectedOptionId}</b></div><div><span>Correct answer</span><b>{correct ? `${correct.id}. ${correct.text}` : question.correctOptionId}</b></div></div>
              <div className="explanation"><span>Why it wins</span><p>{question.explanation}</p>{!answer.correct && question.distractorExplanations[answer.selectedOptionId] && <p className="distractor-note"><b>Why {answer.selectedOptionId} loses:</b> {question.distractorExplanations[answer.selectedOptionId]}</p>}</div>
              {linkedLesson && <div className="linked-lesson"><button onClick={() => setLessonOpen((value) => !value)}><b>{lessonOpen ? "Close visual lesson" : "Open matching visual lesson"}</b><span>{linkedLesson.title} {lessonOpen ? "↑" : "↓"}</span></button>{lessonOpen && <LessonSlide lesson={linkedLesson} compact />}</div>}
            </section>}
          </article>
        </div>
        <footer className="final-exam-nav">
          <button disabled={session.currentIndex === 0} onClick={() => moveTo(session.currentIndex - 1)}>← Previous</button>
          <div><b>{answeredCount}/{session.questionIds.length}</b><span>{wrongCount} to repair</span></div>
          {session.currentIndex < session.questionIds.length - 1
            ? <button className="primary" onClick={() => moveTo(session.currentIndex + 1)}>Next question →</button>
            : completed
              ? <button className="primary" onClick={() => setActive(false)}>Exam complete →</button>
              : answer
                ? <button className="primary" onClick={nextUnanswered}>Next unanswered →</button>
                : <button className="next-unanswered" onClick={nextUnanswered}>Next unanswered</button>}
        </footer>
      </section>
    </main>;
  }

  return <section className="final-exam-home">
    <div className="final-exam-copy">
      <span className="eyebrow">{bankLabel} · {examLabels[exam].date}</span>
      <h1>Final exam mode.</h1>
      <p>{bankDescription} Each answer locks immediately, shows the repair lesson, and stays saved on this device so you can leave and resume at the same question.</p>
    </div>
    {exam === "july29" && <div className="final-bank-chooser" aria-label="Choose August 25 final-exam bank">
      <button className={bank === "telegram-past-papers" ? "active" : ""} aria-pressed={bank === "telegram-past-papers"} onClick={() => chooseBank("telegram-past-papers")}><b>Telegram Past Papers</b><span>Original 199-question archive</span></button>
      <button className={bank === "downloaded-core" ? "active" : ""} aria-pressed={bank === "downloaded-core"} onClick={() => chooseBank("downloaded-core")}><b>New Downloads · Core Distilled</b><span>Deduplicated and scientifically re-keyed</span></button>
    </div>}
    {exam === "july29" && <button
      type="button"
      role="switch"
      aria-checked={excludeCarbohydrateLipidMetabolism}
      className={`final-metabolism-filter ${excludeCarbohydrateLipidMetabolism ? "active" : ""}`}
      onClick={() => chooseMetabolismScope(!excludeCarbohydrateLipidMetabolism)}
    >
      <span className="final-metabolism-filter-copy"><small>EXAM-SCOPE FILTER</small><b>Exclude carbohydrate + lipid metabolism</b><em>{excludeCarbohydrateLipidMetabolism ? `${filteredOutCount} off-syllabus questions hidden` : "All topics included"}</em></span>
      <i aria-hidden="true"><span /></i>
    </button>}
    {loading && <div className="final-exam-empty"><b>Loading verified past papers…</b><span>Filtering to the confirmed syllabus.</span></div>}
    {!loading && error && <div className="final-exam-empty error"><b>Final exam bank is unavailable.</b><span>{error}</span></div>}
    {!loading && !error && !questions.length && <div className="final-exam-empty"><b>No verified past-paper questions have been imported yet.</b><span>The ordinary study bank is still available in Overview and Topics.</span></div>}
    {!loading && !error && questions.length > 0 && <div className="final-exam-launch">
      <div className="final-exam-stats">
        <article><span>VERIFIED QUESTIONS</span><strong>{questions.length}</strong><small>Relevant to {examLabels[exam].date}</small></article>
        <article><span>ANSWERED</span><strong>{answeredCount}</strong><small>{questions.length - answeredCount} remaining</small></article>
        <article><span>CORRECT</span><strong>{correctCount}</strong><small>{wrongCount} need repair</small></article>
        <article><span>STATUS</span><strong>{completed ? "Done" : session ? "Saved" : "New"}</strong><small>{session ? `Question ${session.currentIndex + 1}` : "Ready to begin"}</small></article>
      </div>
      <div className="final-exam-resume">
        <div><span>{completed ? "FINAL EXAM COMPLETE" : session ? "PROGRESS SAVED AUTOMATICALLY" : "SOURCE-TRACEABLE BANK"}</span><h2>{examLabels[exam].title}</h2><p>{session ? `${answeredCount} of ${questions.length} answered. Resume at question ${session.currentIndex + 1}.` : "Start the complete past-paper bank. Feedback appears immediately after every choice."}</p></div>
        <div><button className="primary" onClick={startOrResume}>{session ? "Continue final exam →" : "Start final exam →"}</button>{session && <button className="delete-sprint" onClick={resetProgress}>Delete progress & restart</button>}</div>
      </div>
    </div>}
  </section>;
}
