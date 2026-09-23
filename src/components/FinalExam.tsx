"use client";
/* eslint-disable @next/next/no-img-element -- final-exam images are streamed from the local study bridge */

import { useEffect, useMemo, useState } from "react";
import { filterFinalExamQuestions } from "@/src/lib/mcq/final-exam-scope.mjs";
import {
  FINAL_EXAM_STORAGE_KEY,
  emptyFinalExamProgress,
  parseFinalExamProgress,
  reconcileFinalExamSession,
  isFinalAnswerCorrect,
} from "@/src/lib/mcq/final-exam-state.mjs";
import {cachedJson} from '@/src/lib/mcq/client-cache';
import {selectCollectionQuestions,finalSessionSeed,type ExamCollection} from '@/src/lib/mcq/curated-core.mjs';
import {QuestionMedia} from './QuestionMedia';
import {CourseReviewReport} from './CourseReview';
import {FinalExamStatusBanner} from './FinalExamStatusBanner';
import {WrongAnswerReview} from './WrongAnswerReview';
import {mcqReviewQuestions} from '@/src/lib/mcq/wrong-answer-review.mjs';
import type { MCQQuestion } from "@/src/lib/mcq/types";

type ExamId = "july25" | "july29" | "term2-nutrition" | "term2-religion" | "term2-biochemistry";
type FinalExamBankId = "telegram-past-papers" | "downloaded-core" | "nutrition-past-papers" | "religion-past-papers" | "biochemistry-metabolism-past-papers";
type FinalBaseSessionKey = `${ExamId}:${FinalExamBankId}`;
type FinalSessionKey = string;
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
  "term2-nutrition": { date: "Nutrition · date TBA", title: "Nutrition · downloaded past papers" },
  "term2-biochemistry": { date: "Biochemistry II · past finals", title: "Biochemistry II · Metabolism past papers" },
  "term2-religion": { date: "Religion · date TBA", title: "Religion · downloaded past papers" },
};

function mediaUrl(bridgeUrl: string, question: MCQQuestion, mediaId: string) {
  const query = new URLSearchParams({ questionId: question.id, mediaId });
  return `${bridgeUrl}/api/media?${query}`;
}

export function FinalExam({ exam, bridgeUrl, collection, onSessionActiveChange,initialIntent='review',onProgressSaved,onExit }: { exam: ExamId; bridgeUrl: string; collection?: ExamCollection; onSessionActiveChange?:(active:boolean)=>void;initialIntent?:'start'|'new'|'review';onProgressSaved?:()=>void;onExit?:()=>void }) {
  const [bank, setBank] = useState<FinalExamBankId>(exam === "term2-biochemistry" ? "biochemistry-metabolism-past-papers" : exam === "term2-religion" ? "religion-past-papers" : exam === "term2-nutrition" ? "nutrition-past-papers" : "telegram-past-papers");
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [fingerprint, setFingerprint] = useState("");
  const [bankLabel, setBankLabel] = useState(exam === "term2-biochemistry" ? "Biochemistry II · Metabolism Past Papers" : exam === "term2-religion" ? "Religion · Downloaded Past Papers" : exam === "term2-nutrition" ? "Nutrition · Downloaded Past Papers" : "Telegram Past Papers");
  const [bankDescription, setBankDescription] = useState("The original source-traceable past-paper bank.");
  const [excludeCarbohydrateLipidMetabolism, setExcludeCarbohydrateLipidMetabolism] = useState(!collection);
  const [filteredOutCount, setFilteredOutCount] = useState(0);
  const [progress, setProgress] = useState<FinalProgress>(() => emptyFinalExamProgress() as FinalProgress);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);
  useEffect(()=>{onSessionActiveChange?.(active);return()=>onSessionActiveChange?.(false);},[active,onSessionActiveChange]);

  const byId = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const baseSessionKey = `${exam}:${bank}` as FinalBaseSessionKey;
  const metabolismFilterActive = exam === "july29" && excludeCarbohydrateLipidMetabolism;
  const sessionKey = `${baseSessionKey}${collection ? ":collection:"+collection.id : ""}${metabolismFilterActive ? ":no-carb-lipid-metabolism" : ""}` as FinalSessionKey;
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);setError('');
    void cachedJson<{questions:MCQQuestion[];fingerprint:string;label:string;description:string}>(`${bridgeUrl}/api/final-exam?exam=${exam}&bank=${bank}`,true)
      .then((payload) => {
        if (cancelled) return;
        const allLoaded = selectCollectionQuestions(payload.questions ?? [],collection);
        const loaded = filterFinalExamQuestions(allLoaded, metabolismFilterActive);
        const rawFingerprint = payload.fingerprint ?? `${exam}-${allLoaded.length}`;
        const nextFingerprint = `${rawFingerprint}:${collection?.id??"all"}:${metabolismFilterActive ? "without-carb-lipid-metabolism" : "all-topics"}`;
        let stored = emptyFinalExamProgress() as FinalProgress;
        try {
          stored = parseFinalExamProgress(window.localStorage.getItem(FINAL_EXAM_STORAGE_KEY)) as FinalProgress;
        } catch { /* Continue with an empty final-exam record. */ }
        const migrationSeed = finalSessionSeed(stored.sessions,sessionKey,baseSessionKey,collection,initialIntent,metabolismFilterActive);
        const nextSession = migrationSeed||initialIntent!=='review' ? reconcileFinalExamSession(migrationSeed, loaded, nextFingerprint) as FinalSession : null;
        setQuestions(loaded);
        setFilteredOutCount(allLoaded.length - loaded.length);
        setFingerprint(nextFingerprint);
        setBankLabel(collection?.title ?? payload.label ?? "Sourced past papers");
        setBankDescription(payload.description ?? "A source-traceable final-exam bank.");
        setProgress({ ...stored, sessions: { ...stored.sessions, [sessionKey]: nextSession } });
        setReady(true);
        if(initialIntent!=='review'&&loaded.length)setActive(true);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load the final-exam bank.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [bank, baseSessionKey, bridgeUrl, exam, metabolismFilterActive, sessionKey, collection,initialIntent]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(FINAL_EXAM_STORAGE_KEY, JSON.stringify(progress));onProgressSaved?.(); }
    catch { /* The exam remains usable if browser storage is unavailable. */ }
  }, [progress, ready,onProgressSaved]);

  function chooseMetabolismScope(exclude: boolean) {
    if (exclude === excludeCarbohydrateLipidMetabolism) return;
    setLoading(true);
    setReady(false);
    setError("");
    setActive(false);
    setQuestions([]);
    setFilteredOutCount(0);
    setExcludeCarbohydrateLipidMetabolism(exclude);
  }

  function startOrResume() {
    if (!questions.length) return;
    if (!session) {
      const next = reconcileFinalExamSession(null, questions, fingerprint) as FinalSession;
      setProgress((current) => ({ ...current, sessions: { ...current.sessions, [sessionKey]: next } }));
    } else if (completed) {
      // Completed attempts open as a locked answer review, not at the last
      // question as if there were still work to resume. Keep every answer.
      moveTo(0);
    }
    setActive(true);
  }

  function resetProgress() {
    if (!window.confirm(`Delete all saved ${bankLabel} answers for ${examLabels[exam].date} and restart from question 1?`)) return;
    const next = reconcileFinalExamSession(null, questions, fingerprint) as FinalSession;
    setProgress((current) => ({ ...current, sessions: { ...current.sessions, [sessionKey]: next } }));
    setActive(true);
  }

  function moveTo(index: number) {
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
      correct: isFinalAnswerCorrect(question, optionId),
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
    const coreEvidence=collection?.coreEvidence?.[question.id];
    const chosen = question.options.find((option) => option.id === answer?.selectedOptionId);
    const correct = question.options.find((option) => option.id === question.correctOptionId);
    const inferred = question.answerReview?.basis === 'ai-inferred';
    const provisional = question.qualityFlags.includes('provisional-answer');
    return <main className="final-exam-shell">
      <header className="final-exam-header">
        <div className="session-mark"><b>MED//25</b><span>{examLabels[exam].date} · {completed ? 'Answer review' : 'Final exam'}</span></div>
        <div className="final-live-progress">
          <span>{session.currentIndex + 1} / {session.questionIds.length}</span>
          <div><i style={{ width: `${(answeredCount / session.questionIds.length) * 100}%` }} /></div>
          <small>{answeredCount} answered · {correctCount} correct</small>
        </div>
        <button onClick={() => {setActive(false);onExit?.();}}>Save & exit</button>
      </header>
      <section className="final-exam-body">
        <div className="final-question-scroll">
          <article className="final-question-card">
            <div className="question-meta"><span>{coreEvidence?'Core · '+(coreEvidence.kind==='repeat'?`${coreEvidence.sourceCollectionCount} source collections`:'Additional coverage'):'Past paper'}</span><span>{question.subject}</span><span>{question.topic}</span></div>
            <h1>{question.prompt}</h1>
            {question.qualityFlags.includes('editorially-repaired-source-question') && <p className="term2-scope-note">Edited study version · the original item had a wording or choice defect. Original text is retained in Sources &amp; answer notes and downloads.</p>}
            {exam === "term2-religion" && <p className="term2-scope-note">Original wording · source-reviewed editorial key, not an official answer. Interpret within the source framework; qualifications and corrections appear with feedback.</p>}
            {exam === "term2-nutrition" && question.qualityFlags.includes("qualified-source-wording") && <p className="term2-scope-note">Historical / qualified wording: scoring uses the source's intended convention. Read the explanation for its limits; a marked answer is not an official key.</p>}
            <QuestionMedia question={question} review={Boolean(answer)}/>
            <div className={`final-options ${answer ? "locked" : ""} ${answer && inferred ? "inferred-answer" : ""}`}>
              {question.options.map((option) => {
                const state = answer
                  ? isFinalAnswerCorrect(question, option.id) ? "correct" : option.id === answer.selectedOptionId ? "wrong" : ""
                  : "";
                return <button key={option.id} className={state} disabled={Boolean(answer)} onClick={() => answerQuestion(option.id)}><span>{option.id}</span><b>{option.text}</b></button>;
              })}
            </div>
            {answer && <section className={`instant-feedback ${answer.correct ? "correct" : "wrong"} ${inferred ? "inferred-answer" : ""}`}>
              <div className="instant-feedback-title"><b>{answer.correct ? provisional ? "✓ Best available choice" : "✓ Correct" : "× Repair this"}</b><span>{question.source.title}{question.source.page ? ` · page ${question.source.page}` : ""}</span></div>
              <div className="answer-comparison"><div><span>Your answer</span><b>{chosen ? `${chosen.id}. ${chosen.text}` : answer.selectedOptionId}</b></div><div><span>{provisional ? 'Best available choice · wording uncertain' : (question.acceptedOptionIds?.length ?? 0) > 1 ? 'Preferred answer' : 'Correct answer'}</span><b>{correct ? `${correct.id}. ${correct.text}` : question.correctOptionId}</b>{(question.acceptedOptionIds?.length ?? 0) > 1 && <small>Accepted choices: {question.acceptedOptionIds!.join(', ')}</small>}</div></div>
              <div className="explanation"><span>Why it wins</span><p>{question.explanation}</p>{!answer.correct && question.distractorExplanations[answer.selectedOptionId] && <p className="distractor-note"><b>Why {answer.selectedOptionId} loses:</b> {question.distractorExplanations[answer.selectedOptionId]}</p>}</div>
              {coreEvidence&&<details className="answer-review-evidence"><summary>Core selection &amp; source occurrences</summary><p>{coreEvidence.reason}. {coreEvidence.kind==='repeat'?`${coreEvidence.sourceCollectionCount} source collections, one representative.`:'Supplemental coverage, not counted as a repeated pattern.'} Historical evidence, not an exam prediction.</p><p>{coreEvidence.sectionTitle} · PDF p. {coreEvidence.pdfPage}</p><ul>{coreEvidence.members.map(m=><li key={m.questionId}><a href={m.sourceUrl} target="_blank" rel="noreferrer">{m.paperId} · original Q{m.sourceNumber}</a></li>)}</ul></details>}
              {question.answerReview && <details className="answer-review-evidence"><summary>Sources & answer notes</summary><p>Editorial review · {question.answerReview.confidence} confidence · {question.answerReview.auditedAt}. Not an official university key.</p>{question.answerReview.evidence.map(ref=><p key={ref}>{ref}</p>)}<p>{question.source.excerpt}</p></details>}
            </section>}
          </article>
        </div>
        <footer className="final-exam-nav">
          <button disabled={session.currentIndex === 0} onClick={() => moveTo(session.currentIndex - 1)}>← Previous</button>
          <div><b>{answeredCount}/{session.questionIds.length}</b><span>{wrongCount} to repair</span></div>
          {session.currentIndex < session.questionIds.length - 1
            ? <button className="primary" onClick={() => moveTo(session.currentIndex + 1)}>Next question →</button>
            : completed
              ? <button className="primary" onClick={() => setActive(false)}>Results &amp; review →</button>
              : answer
                ? <button className="primary" onClick={nextUnanswered}>Next unanswered →</button>
                : <button className="next-unanswered" onClick={nextUnanswered}>Next unanswered</button>}
        </footer>
      </section>
    </main>;
  }

  return <section className="final-exam-home">
    <div className="final-exam-copy">
      {!collection && <><span className="eyebrow">{bankLabel} · {examLabels[exam].date}</span><h1>Final exam mode.</h1></>}
      <p>{completed ? 'This paper is complete. Your saved score and review topics are below; you can revisit the locked answers without changing your result.' : <>{collection ? "" : bankDescription + " "}Each answer locks immediately, shows the explanation, and stays saved on this device so you can leave and resume at the same question.</>}</p>
    </div>
    {exam === "july29" && <button
      type="button"
      role="switch"
      aria-checked={excludeCarbohydrateLipidMetabolism}
      className={`final-metabolism-filter ${excludeCarbohydrateLipidMetabolism ? "active" : ""}`}
      onClick={() => chooseMetabolismScope(!excludeCarbohydrateLipidMetabolism)}
    >
      <span className="final-metabolism-filter-copy"><small>EXAM-SCOPE FILTER</small><b>Exclude carbohydrate, lipid + oxidative metabolism</b><em>{excludeCarbohydrateLipidMetabolism ? `${filteredOutCount} off-syllabus questions hidden` : "All topics included"}</em></span>
      <i aria-hidden="true"><span /></i>
    </button>}
    {loading && <div className="final-exam-empty"><b>Loading checked past-paper questions…</b><span>Keeping source-based practice separate.</span></div>}
    {!loading && error && <div className="final-exam-empty error"><b>Final exam bank is unavailable.</b><span>{error}</span></div>}
    {!loading && !error && !questions.length && <div className="final-exam-empty"><b>No verified past-paper questions have been imported yet.</b><span>Book- and lecture-based questions remain in Practice MCQs.</span></div>}
    {!loading && !error && questions.length > 0 && <div className="final-exam-launch">
      <div className="final-exam-stats">
        <article><span>PAST-PAPER QUESTIONS</span><strong>{questions.length}</strong><small>Relevant to {examLabels[exam].date}</small></article>
        <article><span>ANSWERED</span><strong>{answeredCount}</strong><small>{questions.length - answeredCount} remaining</small></article>
        <article><span>CORRECT</span><strong>{correctCount}</strong><small>{wrongCount} need repair</small></article>
        <article><span>STATUS</span><strong>{completed ? "Done" : session ? "Saved" : "New"}</strong><small>{completed ? 'All questions answered' : session ? `Question ${session.currentIndex + 1}` : "Ready to begin"}</small></article>
      </div>
      <FinalExamStatusBanner title={bankLabel} completed={completed} hasSession={Boolean(session)} answeredCount={answeredCount} correctCount={correctCount} total={questions.length} currentIndex={session?.currentIndex ?? 0} onOpen={startOrResume} onRestart={resetProgress}/>
    </div>}
    {session&&answeredCount>0&&(completed?<WrongAnswerReview exam={exam} attemptId={`${sessionKey}:${session.startedAt}`} questions={mcqReviewQuestions(orderedQuestions)} outcomes={orderedQuestions.map(q=>({questionId:q.id,answered:Boolean(session.answers[q.id]),correct:Boolean(session.answers[q.id]?.correct),topic:q.topic}))}/>:<CourseReviewReport exam={exam} outcomes={orderedQuestions.filter(q=>session.answers[q.id]).map(q=>({questionId:q.id,answered:true,correct:Boolean(session.answers[q.id]?.correct),topic:q.topic}))}/>)}
  </section>;
}
