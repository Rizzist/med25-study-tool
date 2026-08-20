"use client";
/* eslint-disable @next/next/no-img-element -- question images are streamed from the local study bridge */

import { useCallback, useEffect, useState } from "react";
import { FinalExam } from "@/src/components/FinalExam";
import { LessonGuide } from "@/src/components/LessonGuide";
import { LessonSlide } from "@/src/components/LessonSlide";
import { allLessons, histologyPracticalLessons, lessonsForExam } from "@/src/lib/lessons";
import { lessonForQuestion } from "@/src/lib/lessons/types";
import type { CodexGrade, MCQQuestion, StudentAnswer } from "@/src/lib/mcq/types";

type BridgeHealth = {
  ok: boolean;
  service: string;
  codex: { available: boolean; version: string | null };
};

type BankSummary = {
  bankId: string;
  title: string;
  schemaVersion: string;
  questionCount: number;
  imageQuestionCount: number;
  subjects: Array<{ id: string; title: string; questionCount: number }>;
  tags?: Record<string, number>;
  exams?: Array<{
    id: ExamId;
    date: string;
    title: string;
    questionCount: number;
    finalExamQuestionCount: number;
    imageQuestionCount: number;
    collectionCounts: Partial<Record<CollectionId, number>>;
    collectionQuestionIds?: Partial<Record<CollectionId, string[]>>;
  }>;
};

type SessionAnswer = StudentAnswer & { flagged: boolean };
type ExamId = "july25" | "aug22" | "july29";
type CollectionId = "all" | "histology" | "embryology" | "physiology" | "biochemistry" | "images" | "stains" | "histo-practical" | "practical" | "wrong" | "flagged";
type SavedCollectionId = "wrong" | "flagged";
type SessionPhase = "setup" | "loading" | "active" | "review";
type ReviewFilter = "all" | "wrong" | "flagged";
type ExamProgress = { wrongIds: string[]; flaggedIds: string[] };
type StudyProgress = { version: 1; exams: Record<ExamId, ExamProgress> };
type ActiveSessionSnapshot = {
  exam: ExamId;
  collection: CollectionId;
  sessionSize: number;
  questionIds: string[];
  answers: Record<string, SessionAnswer>;
  questionIndex: number;
  startedAt: string;
};
type CompletedSession = ActiveSessionSnapshot & {
  id: string;
  completedAt: string;
  correctCount: number;
  answeredCount: number;
  flaggedCount: number;
};
type SessionArchive = { version: 1; active: ActiveSessionSnapshot | null; history: CompletedSession[] };

const bridgeUrl = process.env.NEXT_PUBLIC_CODEX_BRIDGE_URL
  ?? (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:4111");
const progressStorageKey = "med25-study-progress-v1";
const sessionArchiveStorageKey = "med25-session-archive-v1";
const tabs = ["Overview", "Final exam", "Topics", "Practical Atlas", "Visual Guide", "Results", "Codex tutor"] as const;
const sprintLengths = [10, 20, 40, 60, 100, 150, 200, 250] as const;
const examConfig: Record<ExamId, {
  date: string;
  title: string;
  focus: string;
  collections: CollectionId[];
}> = {
  july25: {
    date: "July 25",
    title: "Tissue Development & Function",
    focus: "Histology I, cellular histology, early embryology, congenital malformations, Guyton Chapters 1–8 and stains",
    collections: ["all", "wrong", "flagged", "histology", "embryology", "physiology", "images", "stains", "practical"],
  },
  aug22: {
    date: "Aug 22",
    title: "Histology Practical",
    focus: "55 microscope specimens, tissue orientation, defining architecture, characteristic cell identification and closest-slide discrimination",
    collections: ["histo-practical", "wrong", "flagged"],
  },
  july29: {
    date: "Aug 25",
    title: "Cell & Molecules",
    focus: "Lippincott Chapters 1–7, 14–18 and 23–33, cellular histology, membrane physiology and all confirmed laboratory methods",
    collections: ["all", "wrong", "flagged", "biochemistry", "histology", "physiology", "images", "stains", "practical"],
  },
};
const collectionLabel: Record<CollectionId, string> = {
  all: "Mixed",
  histology: "Histology",
  embryology: "Embryology",
  physiology: "Physiology",
  biochemistry: "Biochemistry",
  images: "Images",
  stains: "Stains",
  "histo-practical": "Histology practicals",
  practical: "Practical + spotters",
  wrong: "Wrong answers",
  flagged: "Flagged",
};
type Tab = (typeof tabs)[number];

function createEmptyProgress(): StudyProgress {
  return {
    version: 1,
    exams: {
      july25: { wrongIds: [], flaggedIds: [] },
      aug22: { wrongIds: [], flaggedIds: [] },
      july29: { wrongIds: [], flaggedIds: [] },
    },
  };
}

function cleanIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 160))];
}

function parseProgress(raw: string | null): StudyProgress {
  if (!raw) return createEmptyProgress();
  try {
    const value = JSON.parse(raw) as Partial<StudyProgress>;
    const oldJuly25WrongIds = cleanIds(value.exams?.july25?.wrongIds);
    const oldJuly25FlaggedIds = cleanIds(value.exams?.july25?.flaggedIds);
    return {
      version: 1,
      exams: {
        july25: {
          wrongIds: oldJuly25WrongIds.filter((id) => !id.startsWith("hpr-")),
          flaggedIds: oldJuly25FlaggedIds.filter((id) => !id.startsWith("hpr-")),
        },
        aug22: {
          wrongIds: cleanIds([...(value.exams?.aug22?.wrongIds ?? []), ...oldJuly25WrongIds.filter((id) => id.startsWith("hpr-"))]),
          flaggedIds: cleanIds([...(value.exams?.aug22?.flaggedIds ?? []), ...oldJuly25FlaggedIds.filter((id) => id.startsWith("hpr-"))]),
        },
        july29: {
          wrongIds: cleanIds(value.exams?.july29?.wrongIds),
          flaggedIds: cleanIds(value.exams?.july29?.flaggedIds),
        },
      },
    };
  } catch {
    return createEmptyProgress();
  }
}

function isExamId(value: unknown): value is ExamId {
  return value === "july25" || value === "aug22" || value === "july29";
}

function isCollectionId(value: unknown): value is CollectionId {
  return typeof value === "string" && value in collectionLabel;
}

function cleanAnswers(value: unknown, questionIds: string[]) {
  const source = value && typeof value === "object" ? value as Record<string, Partial<SessionAnswer>> : {};
  return Object.fromEntries(questionIds.map((questionId) => {
    const answer = source[questionId] ?? {};
    const confidence = answer.confidence === "guess" || answer.confidence === "confident" ? answer.confidence : "unsure";
    const normalized: SessionAnswer = {
      questionId,
      mode: answer.mode === "write" ? "write" : "select",
      reasoning: typeof answer.reasoning === "string" ? answer.reasoning.slice(0, 6000) : "",
      confidence,
      flagged: Boolean(answer.flagged),
    };
    if (typeof answer.selectedOptionId === "string") normalized.selectedOptionId = answer.selectedOptionId.slice(0, 8);
    if (typeof answer.writtenAnswer === "string") normalized.writtenAnswer = answer.writtenAnswer.slice(0, 6000);
    return [questionId, normalized];
  }));
}

function cleanActiveSession(value: unknown): ActiveSessionSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<ActiveSessionSnapshot>;
  if (!isExamId(session.exam) || !isCollectionId(session.collection)) return null;
  const questionIds = cleanIds(session.questionIds).slice(0, 250);
  if (!questionIds.length) return null;
  const requestedSize = Number(session.sessionSize);
  const migratedExam = session.exam === "july25" && (session.collection === "histo-practical" || questionIds.every((id) => id.startsWith("hpr-")))
    ? "aug22"
    : session.exam;
  return {
    exam: migratedExam,
    collection: session.collection,
    sessionSize: Number.isFinite(requestedSize) ? Math.max(1, Math.min(250, Math.floor(requestedSize))) : questionIds.length,
    questionIds,
    answers: cleanAnswers(session.answers, questionIds),
    questionIndex: Math.max(0, Math.min(questionIds.length - 1, Math.floor(Number(session.questionIndex) || 0))),
    startedAt: typeof session.startedAt === "string" ? session.startedAt : new Date().toISOString(),
  };
}

function parseSessionArchive(raw: string | null): SessionArchive {
  if (!raw) return { version: 1, active: null, history: [] };
  try {
    const value = JSON.parse(raw) as Partial<SessionArchive>;
    const history = Array.isArray(value.history) ? value.history.flatMap((item) => {
      const active = cleanActiveSession(item);
      if (!active || !item || typeof item !== "object") return [];
      const completed = item as Partial<CompletedSession>;
      return [{
        ...active,
        id: typeof completed.id === "string" ? completed.id : `${completed.completedAt ?? active.startedAt}-${active.questionIds[0]}`,
        completedAt: typeof completed.completedAt === "string" ? completed.completedAt : active.startedAt,
        correctCount: Math.max(0, Math.min(active.questionIds.length, Math.floor(Number(completed.correctCount) || 0))),
        answeredCount: Math.max(0, Math.min(active.questionIds.length, Math.floor(Number(completed.answeredCount) || 0))),
        flaggedCount: Math.max(0, Math.min(active.questionIds.length, Math.floor(Number(completed.flaggedCount) || 0))),
      } satisfies CompletedSession];
    }) : [];
    return { version: 1, active: cleanActiveSession(value.active), history };
  } catch {
    return { version: 1, active: null, history: [] };
  }
}

function formatSessionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved session";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function isSavedCollection(value: CollectionId): value is SavedCollectionId {
  return value === "wrong" || value === "flagged";
}

const emptyAnswer = (questionId: string, flagged = false): SessionAnswer => ({
  questionId,
  mode: "select",
  reasoning: "",
  confidence: "unsure",
  flagged,
});

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ").trim();
}

function writtenOptionId(question: MCQQuestion, answer: SessionAnswer) {
  const raw = answer.writtenAnswer?.trim() ?? "";
  const leadingLetter = raw.match(/^(?:option\s*)?([a-f])(?:\b|[).:\-])/i)?.[1]?.toUpperCase();
  if (leadingLetter && question.options.some((option) => option.id.toUpperCase() === leadingLetter)) return leadingLetter;
  const normalized = normalize(raw);
  if (!normalized) return undefined;
  const aliases = [...(question.acceptedFreeText ?? []), question.options.find((option) => option.id === question.correctOptionId)?.text ?? ""];
  if (aliases.some((alias) => normalize(alias) === normalized || (normalize(alias).length > 3 && normalized.startsWith(`${normalize(alias)} `)))) return question.correctOptionId;
  const optionMatch = question.options.find((option) => normalize(option.text) === normalized);
  return optionMatch?.id;
}

function selectedOptionId(question: MCQQuestion, answer?: SessionAnswer) {
  if (!answer) return undefined;
  return answer.mode === "select" ? answer.selectedOptionId : writtenOptionId(question, answer);
}

function isAnswered(answer?: SessionAnswer) {
  return Boolean(answer && (answer.mode === "select" ? answer.selectedOptionId : answer.writtenAnswer?.trim()));
}

function isCorrect(question: MCQQuestion, answer?: SessionAnswer) {
  return selectedOptionId(question, answer) === question.correctOptionId;
}

function mediaUrl(question: MCQQuestion, mediaId: string) {
  const query = new URLSearchParams({ questionId: question.id, mediaId });
  return `${bridgeUrl}/api/media?${query}`;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [health, setHealth] = useState<BridgeHealth | null>(null);
  const [bank, setBank] = useState<BankSummary | null>(null);
  const [checking, setChecking] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>("setup");
  const [exam, setExam] = useState<ExamId>("july25");
  const [collection, setCollection] = useState<CollectionId>("all");
  const [sessionSize, setSessionSize] = useState(20);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, SessionAnswer>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionError, setSessionError] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("wrong");
  const [grades, setGrades] = useState<Record<string, CodexGrade>>({});
  const [grading, setGrading] = useState<Record<string, boolean>>({});
  const [gradeErrors, setGradeErrors] = useState<Record<string, string>>({});
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<StudyProgress>(createEmptyProgress);
  const [progressReady, setProgressReady] = useState(false);
  const [sessionArchive, setSessionArchive] = useState<SessionArchive>({ version: 1, active: null, history: [] });
  const [sessionArchiveReady, setSessionArchiveReady] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState("");
  const [historyLoadingId, setHistoryLoadingId] = useState("");
  const [resumingSession, setResumingSession] = useState(false);

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const [healthResponse, bankResponse] = await Promise.all([
        fetch(`${bridgeUrl}/api/health`, { cache: "no-store" }),
        fetch(`${bridgeUrl}/api/bank/summary`, { cache: "no-store" }),
      ]);
      if (!healthResponse.ok || !bankResponse.ok) throw new Error("Local services unavailable");
      setHealth(await healthResponse.json());
      setBank(await bankResponse.json());
    } catch {
      setHealth(null);
      setBank(null);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadQuestionsByIds = useCallback(async (examId: ExamId, questionIds: string[]) => {
    const response = await fetch(`${bridgeUrl}/api/questions/by-ids`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exam: examId, ids: questionIds, limit: questionIds.length, preserveOrder: true }),
    });
    if (!response.ok) throw new Error("Could not reload the saved questions.");
    const payload = await response.json() as { questions: MCQQuestion[] };
    if (!payload.questions.length) throw new Error("The saved questions are no longer available.");
    return payload.questions;
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    try { setProgress(parseProgress(window.localStorage.getItem(progressStorageKey))); }
    catch { setProgress(createEmptyProgress()); }
    finally { setProgressReady(true); }
  }, []);

  useEffect(() => {
    if (!progressReady) return;
    try { window.localStorage.setItem(progressStorageKey, JSON.stringify(progress)); }
    catch { /* Study sessions continue even if browser storage is unavailable. */ }
  }, [progress, progressReady]);

  useEffect(() => {
    let archive: SessionArchive = { version: 1, active: null, history: [] };
    try { archive = parseSessionArchive(window.localStorage.getItem(sessionArchiveStorageKey)); }
    catch { /* Start with an empty archive if browser storage is unavailable. */ }
    setSessionArchive(archive);
    setSessionArchiveReady(true);
  }, []);

  useEffect(() => {
    if (!sessionArchiveReady) return;
    try { window.localStorage.setItem(sessionArchiveStorageKey, JSON.stringify(sessionArchive)); }
    catch { /* The active sprint continues even if browser storage becomes unavailable. */ }
  }, [sessionArchive, sessionArchiveReady]);

  useEffect(() => {
    if (!sessionArchiveReady || phase !== "active" || !questions.length) return;
    const startedAt = sessionStartedAt || new Date().toISOString();
    if (!sessionStartedAt) setSessionStartedAt(startedAt);
    setSessionArchive((current) => ({
      ...current,
      active: {
        exam,
        collection,
        sessionSize,
        questionIds: questions.map((question) => question.id),
        answers,
        questionIndex,
        startedAt,
      },
    }));
  }, [answers, collection, exam, phase, questionIndex, questions, sessionArchiveReady, sessionSize, sessionStartedAt]);

  const selectedExam = bank?.exams?.find((item) => item.id === exam);
  const selectedConfig = examConfig[exam];
  const examProgress = progress.exams[exam];
  const savedCount = (id: SavedCollectionId) => id === "wrong" ? examProgress.wrongIds.length : examProgress.flaggedIds.length;
  const collectionCount = isSavedCollection(collection) ? savedCount(collection) : selectedExam?.collectionCounts[collection] ?? 0;
  const seenQuestionIds = new Set(cleanIds([
    ...sessionArchive.history
      .filter((session) => session.exam === exam)
      .flatMap((session) => session.questionIds),
    ...examProgress.wrongIds,
    ...examProgress.flaggedIds,
  ]));
  const selectedCollectionQuestionIds = isSavedCollection(collection)
    ? examProgress[`${collection}Ids`]
    : selectedExam?.collectionQuestionIds?.[collection] ?? [];
  const seenCollectionCount = selectedCollectionQuestionIds.filter((id) => seenQuestionIds.has(id)).length;
  const unseenCollectionCount = Math.max(0, collectionCount - seenCollectionCount);

  function chooseExam(nextExam: ExamId) {
    setExam(nextExam);
    setCollection(examConfig[nextExam].collections[0]);
    setSessionError("");
    setExpandedLessons({});
  }

  async function startSession(nextCollection: CollectionId = collection, exactIds?: string[]) {
    setCollection(nextCollection);
    setPhase("loading");
    setSessionError("");
    try {
      const requestedIds = exactIds
        ? cleanIds(exactIds)
        : nextCollection === "wrong"
          ? examProgress.wrongIds
          : nextCollection === "flagged"
            ? examProgress.flaggedIds
            : [];
      let response: Response;
      if (exactIds || isSavedCollection(nextCollection)) {
        if (!requestedIds.length) throw new Error(`No ${collectionLabel[nextCollection].toLowerCase()} are saved for ${selectedConfig.date}.`);
        response = await fetch(`${bridgeUrl}/api/questions/by-ids`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ exam, ids: requestedIds, limit: exactIds ? requestedIds.length : sessionSize }),
        });
      } else {
        const repairIds = cleanIds([...examProgress.wrongIds, ...examProgress.flaggedIds]);
        const historicalSeenIds = cleanIds(sessionArchive.history
          .filter((session) => session.exam === exam)
          .flatMap((session) => session.questionIds));
        const seenIds = cleanIds([...historicalSeenIds, ...repairIds]);
        response = await fetch(`${bridgeUrl}/api/questions/sprint`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ limit: sessionSize, exam, collection: nextCollection, seenIds, repairIds }),
        });
      }
      if (!response.ok) throw new Error("Could not load the question bank.");
      const payload = await response.json() as { questions: MCQQuestion[]; validIds?: string[] };
      if (!payload.questions.length) throw new Error("This collection has no verified questions yet.");
      if (!exactIds && isSavedCollection(nextCollection) && payload.validIds) {
        const validIds = new Set(payload.validIds);
        setProgress((current) => ({
          ...current,
          exams: {
            ...current.exams,
            [exam]: {
              ...current.exams[exam],
              [`${nextCollection}Ids`]: current.exams[exam][`${nextCollection}Ids`].filter((id) => validIds.has(id)),
            },
          },
        }));
      }
      const flaggedIds = new Set(progress.exams[exam].flaggedIds);
      setQuestions(payload.questions);
      setAnswers(Object.fromEntries(payload.questions.map((question) => [question.id, emptyAnswer(question.id, flaggedIds.has(question.id))])));
      setQuestionIndex(0);
      setGrades({});
      setGradeErrors({});
      setExpandedLessons({});
      setReviewFilter("wrong");
      setSessionStartedAt(new Date().toISOString());
      setPhase("active");
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : "Could not start the session.");
      setPhase("setup");
    }
  }

  function updateAnswer(questionId: string, patch: Partial<SessionAnswer>) {
    setAnswers((current) => ({ ...current, [questionId]: { ...(current[questionId] ?? emptyAnswer(questionId)), ...patch } }));
  }

  function toggleFlag(questionId: string) {
    const currentlyFlagged = answers[questionId]?.flagged ?? progress.exams[exam].flaggedIds.includes(questionId);
    const flagged = !currentlyFlagged;
    updateAnswer(questionId, { flagged });
    setProgress((current) => {
      const existing = current.exams[exam].flaggedIds.filter((id) => id !== questionId);
      return {
        ...current,
        exams: {
          ...current.exams,
          [exam]: { ...current.exams[exam], flaggedIds: flagged ? [...existing, questionId] : existing },
        },
      };
    });
  }

  function finishSession() {
    const correctIds = new Set(questions.filter((question) => isCorrect(question, answers[question.id])).map((question) => question.id));
    const missedIds = questions.filter((question) => !correctIds.has(question.id)).map((question) => question.id);
    const completedAt = new Date().toISOString();
    const answeredCount = questions.filter((question) => isAnswered(answers[question.id])).length;
    const flaggedCount = questions.filter((question) => answers[question.id]?.flagged).length;
    const completedSession: CompletedSession = {
      id: `${Date.now()}-${questions[0]?.id ?? "session"}`,
      exam,
      collection,
      sessionSize,
      questionIds: questions.map((question) => question.id),
      answers,
      questionIndex,
      startedAt: sessionStartedAt || completedAt,
      completedAt,
      correctCount: correctIds.size,
      answeredCount,
      flaggedCount,
    };
    setProgress((current) => {
      const retainedWrong = current.exams[exam].wrongIds.filter((id) => !correctIds.has(id));
      return {
        ...current,
        exams: {
          ...current.exams,
          [exam]: { ...current.exams[exam], wrongIds: [...new Set([...retainedWrong, ...missedIds])] },
        },
      };
    });
    setSessionArchive((current) => ({ version: 1, active: null, history: [completedSession, ...current.history] }));
    setConfirmEnd(false);
    setExpandedLessons({});
    setPhase("review");
    setReviewFilter("wrong");
  }

  function clearSavedProgress() {
    if (!window.confirm(`Clear saved wrong answers and flags for ${selectedConfig.date}? Your question bank will not be changed.`)) return;
    setProgress((current) => ({
      ...current,
      exams: { ...current.exams, [exam]: { wrongIds: [], flaggedIds: [] } },
    }));
    if (isSavedCollection(collection)) setCollection("all");
    setSessionError("");
  }

  function resetSession() {
    setQuestions([]);
    setAnswers({});
    setQuestionIndex(0);
    setSessionStartedAt("");
    setConfirmEnd(false);
    setSessionArchive((current) => ({ ...current, active: null }));
    setPhase("setup");
    void refresh();
  }

  async function continueSavedSprint() {
    const saved = sessionArchive.active;
    if (!saved) return;
    setResumingSession(true);
    setSessionError("");
    setPhase("loading");
    setExam(saved.exam);
    setCollection(saved.collection);
    setSessionSize(saved.sessionSize);
    setSessionStartedAt(saved.startedAt);
    try {
      const restoredQuestions = await loadQuestionsByIds(saved.exam, saved.questionIds);
      const restoredIds = new Set(restoredQuestions.map((question) => question.id));
      setQuestions(restoredQuestions);
      setAnswers(Object.fromEntries(restoredQuestions.map((question) => [question.id, saved.answers[question.id] ?? emptyAnswer(question.id)])));
      setQuestionIndex(Math.min(saved.questionIndex, restoredQuestions.length - 1));
      setGrades({});
      setGradeErrors({});
      setExpandedLessons({});
      setSessionArchive((current) => ({ ...current, active: current.active ? { ...current.active, questionIds: current.active.questionIds.filter((id) => restoredIds.has(id)) } : null }));
      setPhase("active");
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : "Could not resume the saved sprint.");
      setPhase("setup");
    } finally {
      setResumingSession(false);
    }
  }

  function deleteSavedSprint() {
    if (!window.confirm("Delete this unfinished sprint? Completed results, wrong answers and flags will stay saved.")) return;
    setSessionArchive((current) => ({ ...current, active: null }));
    setQuestions([]);
    setAnswers({});
    setQuestionIndex(0);
    setSessionStartedAt("");
    setSessionError("");
    setPhase("setup");
  }

  async function openSavedReview(saved: CompletedSession) {
    setHistoryLoadingId(saved.id);
    setSessionError("");
    setPhase("loading");
    setExam(saved.exam);
    setCollection(saved.collection);
    setSessionSize(saved.sessionSize);
    setSessionStartedAt(saved.startedAt);
    try {
      const restoredQuestions = await loadQuestionsByIds(saved.exam, saved.questionIds);
      setQuestions(restoredQuestions);
      setAnswers(Object.fromEntries(restoredQuestions.map((question) => [question.id, saved.answers[question.id] ?? emptyAnswer(question.id)])));
      setQuestionIndex(0);
      setGrades({});
      setGradeErrors({});
      setExpandedLessons({});
      setReviewFilter("wrong");
      setPhase("review");
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : "Could not open this saved review.");
      setPhase("setup");
    } finally {
      setHistoryLoadingId("");
    }
  }

  async function requestCodexGrade(question: MCQQuestion) {
    const studentAnswer = answers[question.id];
    if (!studentAnswer) return;
    setGrading((current) => ({ ...current, [question.id]: true }));
    setGradeErrors((current) => ({ ...current, [question.id]: "" }));
    try {
      const response = await fetch(`${bridgeUrl}/api/tutor/grade`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, studentAnswer }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Codex tutor could not grade this response.");
      setGrades((current) => ({ ...current, [question.id]: payload as CodexGrade }));
    } catch (error) {
      setGradeErrors((current) => ({ ...current, [question.id]: error instanceof Error ? error.message : "Tutor unavailable" }));
    } finally {
      setGrading((current) => ({ ...current, [question.id]: false }));
    }
  }

  if (phase === "active") {
    const question = questions[questionIndex];
    const answer = answers[question.id] ?? emptyAnswer(question.id);
    const answeredCount = questions.filter((item) => isAnswered(answers[item.id])).length;
    return (
      <main className="session-shell">
        <header className="session-header">
          <div className="session-mark"><b>MED//25</b><span>{examConfig[exam].date} · {collectionLabel[collection]}</span></div>
          <div className="session-progress"><span>Question {questionIndex + 1} of {questions.length}</span><div><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><small>{answeredCount} answered</small></div>
          <button className="end-button" onClick={() => setConfirmEnd(true)}>End session</button>
        </header>

        <section className="session-body">
          <div className="question-scroll">
            <article className="question-card">
              <div className="question-meta">
                <span>{question.subject}</span><span>{question.topic}</span><span>Difficulty {question.difficulty}/5</span>
              </div>
              <h1>{question.prompt}</h1>
              {question.media?.map((media) => <figure className="study-image" key={media.id}><img src={mediaUrl(question, media.id)} alt="Question image" /><figcaption>Image recognition · inspect before choosing</figcaption></figure>)}

              <div className="mode-switch" aria-label="Answer mode">
                <button className={answer.mode === "select" ? "selected" : ""} onClick={() => updateAnswer(question.id, { mode: "select" })}>Choose option</button>
                <button className={answer.mode === "write" ? "selected" : ""} onClick={() => updateAnswer(question.id, { mode: "write" })}>Type my answer</button>
              </div>

              {answer.mode === "select" ? <div className="options">
                {question.options.map((option) => <button key={option.id} className={answer.selectedOptionId === option.id ? "chosen" : ""} onClick={() => updateAnswer(question.id, { selectedOptionId: option.id })}><span>{option.id}</span><b>{option.text}</b></button>)}
              </div> : <label className="written-label"><span>Your answer</span><textarea className="answer-box" value={answer.writtenAnswer ?? ""} onChange={(event) => updateAnswer(question.id, { writtenAnswer: event.target.value })} placeholder="Type the option letter or the answer in your own words…" /></label>}

              <label className="reasoning-label"><span>Reasoning <em>optional · reviewed after the sprint</em></span><textarea value={answer.reasoning} onChange={(event) => updateAnswer(question.id, { reasoning: event.target.value })} placeholder="Why does this answer win? What clue ruled out the alternatives?" /></label>
              <div className="answer-tools">
                <div className="confidence"><span>Confidence</span>{(["guess", "unsure", "confident"] as const).map((value) => <button key={value} className={answer.confidence === value ? "selected" : ""} onClick={() => updateAnswer(question.id, { confidence: value })}>{value}</button>)}</div>
                <button className={`flag-button ${answer.flagged ? "active" : ""}`} onClick={() => toggleFlag(question.id)}>{answer.flagged ? "★ Flagged" : "☆ Flag for review"}</button>
              </div>
            </article>
          </div>

          <footer className="session-nav">
            <button disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}>← Previous</button>
            <div className="question-dots" aria-label="Question navigation">{questions.map((item, index) => <button key={item.id} aria-label={`Question ${index + 1}`} className={`${index === questionIndex ? "current" : ""} ${isAnswered(answers[item.id]) ? "answered" : ""} ${answers[item.id]?.flagged ? "flagged" : ""}`} onClick={() => setQuestionIndex(index)} />)}</div>
            {questionIndex === questions.length - 1 ? <button className="primary" onClick={() => setConfirmEnd(true)}>Finish & grade</button> : <button className="primary" onClick={() => setQuestionIndex((index) => Math.min(questions.length - 1, index + 1))}>Next question →</button>}
          </footer>
        </section>

        {confirmEnd && <div className="modal-backdrop"><div className="end-modal" role="dialog" aria-modal="true"><span className="eyebrow">Finish sprint</span><h2>Ready to reveal the review?</h2><p>{questions.length - answeredCount ? `${questions.length - answeredCount} questions are unanswered and will count as incorrect.` : "Every question has an answer."} Answers cannot be changed after grading.</p><div><button onClick={() => setConfirmEnd(false)}>Keep working</button><button className="primary" onClick={finishSession}>Grade session</button></div></div></div>}
      </main>
    );
  }

  if (phase === "review") {
    const correctCount = questions.filter((question) => isCorrect(question, answers[question.id])).length;
    const answeredCount = questions.filter((question) => isAnswered(answers[question.id])).length;
    const flaggedCount = questions.filter((question) => answers[question.id]?.flagged).length;
    const missedIds = questions.filter((question) => !isCorrect(question, answers[question.id])).map((question) => question.id);
    const visible = questions.filter((question) => reviewFilter === "all" || (reviewFilter === "wrong" ? !isCorrect(question, answers[question.id]) : answers[question.id]?.flagged));
    const score = Math.round((correctCount / questions.length) * 100);
    return <main className="review-shell">
      <header className="review-header"><div className="session-mark"><b>MED//25</b><span>Session review</span></div><button onClick={resetSession}>Return to dashboard</button></header>
      <section className="review-page">
        <div className="score-hero"><div><span className="eyebrow">Sprint complete</span><h1>{score}%</h1><p>{correctCount} correct out of {questions.length}. Review the misses now, while your reasoning is still fresh.</p></div><div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><span>{score}<small>%</small></span></div></div>
        <div className="result-stats"><div><strong>{correctCount}</strong><span>Correct</span></div><div><strong>{questions.length - correctCount}</strong><span>To repair</span></div><div><strong>{questions.length - answeredCount}</strong><span>Unanswered</span></div><div><strong>{flaggedCount}</strong><span>Flagged</span></div></div>
        <div className="review-toolbar"><div className="review-filters">{(["wrong", "flagged", "all"] as const).map((value) => <button key={value} className={reviewFilter === value ? "active" : ""} onClick={() => setReviewFilter(value)}>{value === "wrong" ? `Wrong (${questions.length - correctCount})` : value === "flagged" ? `Flagged (${flaggedCount})` : `All (${questions.length})`}</button>)}</div><div className="review-actions">{missedIds.length > 0 && <button className="retry-button" onClick={() => void startSession("wrong", missedIds)}>Retry these {missedIds.length}</button>}<button className="primary" onClick={() => void startSession(collection)}>New sprint</button></div></div>
        <div className="review-list">
          {!visible.length && <div className="empty-review"><b>Nothing in this view.</b><span>Switch the filter to inspect all answers.</span></div>}
          {visible.map((question) => {
            const answer = answers[question.id];
            const chosenId = selectedOptionId(question, answer);
            const chosen = question.options.find((option) => option.id === chosenId);
            const correct = question.options.find((option) => option.id === question.correctOptionId);
            const grade = grades[question.id];
            const linkedLesson = lessonForQuestion(question, exam, allLessons);
            return <article className={`review-item ${isCorrect(question, answer) ? "correct" : "wrong"}`} key={question.id}>
              <div className="review-item-head"><span>{isCorrect(question, answer) ? "✓ Correct" : "× Repair"}</span><div><small>{question.subject} · {question.topic}</small><button className={answer?.flagged ? "active" : ""} onClick={() => toggleFlag(question.id)}>{answer?.flagged ? "★ Unflag" : "☆ Flag"}</button></div></div>
              <h2>{question.prompt}</h2>
              {question.media?.map((media) => <figure className="study-image review-image" key={media.id}><img src={mediaUrl(question, media.id)} alt={media.alt} /><figcaption>{media.caption ?? "Image recognition"}</figcaption></figure>)}
              <div className="answer-comparison"><div><span>Your answer</span><b>{chosen ? `${chosen.id}. ${chosen.text}` : answer?.writtenAnswer || "No answer"}</b></div><div><span>Correct answer</span><b>{correct ? `${correct.id}. ${correct.text}` : question.correctOptionId}</b></div></div>
              {answer?.reasoning && <div className="student-reasoning"><span>Your reasoning</span><p>{answer.reasoning}</p></div>}
              <div className="explanation"><span>Why it wins</span><p>{question.explanation}</p>{chosenId && chosenId !== question.correctOptionId && question.distractorExplanations[chosenId] && <p className="distractor-note"><b>Why {chosenId} loses:</b> {question.distractorExplanations[chosenId]}</p>}</div>
              {linkedLesson && <div className="linked-lesson"><button onClick={() => setExpandedLessons((current) => ({ ...current, [question.id]: !current[question.id] }))}><b>{expandedLessons[question.id] ? "Close visual lesson" : "Open 90-second visual lesson"}</b><span>{linkedLesson.title} {expandedLessons[question.id] ? "↑" : "↓"}</span></button>{expandedLessons[question.id] && <LessonSlide lesson={linkedLesson} compact />}</div>}
              {(answer?.mode === "write" || answer?.reasoning) && <div className="tutor-review">
                {!grade && <button disabled={grading[question.id]} onClick={() => void requestCodexGrade(question)}>{grading[question.id] ? "Codex is analyzing…" : "Ask Codex to audit my reasoning"}</button>}
                {gradeErrors[question.id] && <p className="tutor-error">{gradeErrors[question.id]} Ordinary grading is unaffected.</p>}
                {grade && <div className="tutor-result"><span>CODEX REASONING AUDIT · {grade.reasoningQuality}</span><p>{grade.teachingNote}</p>{grade.misconception && <p><b>Repair:</b> {grade.misconception}</p>}<blockquote>{grade.reflectionQuestion}</blockquote></div>}
              </div>}
            </article>;
          })}
        </div>
      </section>
    </main>;
  }

  const examCount = (id: CollectionId) => isSavedCollection(id) ? savedCount(id) : selectedExam?.collectionCounts[id] ?? 0;
  const savedReviewCards: Array<{ id: SavedCollectionId; title: string; detail: string; count: number }> = [
    { id: "wrong", title: "Wrong answers", detail: "Incorrect and unanswered questions stay here until corrected.", count: savedCount("wrong") },
    { id: "flagged", title: "Flagged", detail: "Manual flags stay saved until you remove them.", count: savedCount("flagged") },
  ];
  const topicCards: Array<{ id: CollectionId; title: string; scope: string; detail: string; count: number }> = exam === "july25" ? [
    { id: "histology", title: "Histology I", scope: "Core tissues + reproductive", detail: "Cells, basic tissues, skin, ovary, uterus and male reproductive histology", count: examCount("histology") },
    { id: "embryology", title: "Embryology", scope: "General embryology + teratology", detail: "Gametogenesis through weeks 1–8, fetal period, placenta and congenital malformations", count: examCount("embryology") },
    { id: "physiology", title: "Guyton Chapters 1–8", scope: "Confirmed July 25 physiology", detail: "Homeostasis, cell physiology, transport, potentials, skeletal and smooth muscle, NMJ and synapses", count: examCount("physiology") },
    { id: "stains", title: "Stains", scope: "Dedicated recall", detail: "Target, color, preparation and exclusions", count: examCount("stains") },
    { id: "images", title: "Image recognition", scope: "Exam-specific", detail: "Histology fields and embryo diagrams", count: examCount("images") },
    { id: "practical", title: "Practical + spotters", scope: "Still theory-relevant", detail: "Methods, stains, slides and recognition questions kept in the exam bank", count: examCount("practical") },
  ] : exam === "aug22" ? [
    { id: "histo-practical", title: "55-specimen practical bank", scope: `${examCount("histo-practical")} microscope questions`, detail: "Full deck: epithelium, connective tissue, blood, muscle, nerve, digestive, endocrine, urinary, vessels and lymphoid organs", count: examCount("histo-practical") },
  ] : [
    { id: "biochemistry", title: "Biochemistry", scope: "Lippincott 1–7, 14–18, 23–33", detail: "Molecules, enzymes, integrated metabolism, genetics, nutrition and laboratory reasoning", count: examCount("biochemistry") },
    { id: "histology", title: "Cell + Intro Histology", scope: "Mandatory safety block", detail: "Methods, stains, membranes, organelles, cytoskeleton, nucleus, cell cycle and death", count: examCount("histology") },
    { id: "physiology", title: "Membrane physiology", scope: "Guyton + teacher slides", detail: "Homeostasis, transport, resting voltage and action potentials", count: examCount("physiology") },
    { id: "images", title: "Image recognition", scope: "Exam-specific", detail: "Cell, molecular and laboratory figures", count: examCount("images") },
    { id: "practical", title: "Practical + spotters", scope: "Still theory-relevant", detail: "Equipment, carbohydrate tests, titration and image analysis", count: examCount("practical") },
  ];

  const examSwitcher = <div className="exam-switcher" aria-label="Choose exam">
    {(Object.keys(examConfig) as ExamId[]).map((value) => {
      const item = examConfig[value];
      const summary = bank?.exams?.find((candidate) => candidate.id === value);
      return <button key={value} className={exam === value ? "active" : ""} onClick={() => chooseExam(value)} aria-pressed={exam === value}>
        <span>{item.date}</span><b>{item.title}</b><small>{value === "aug22" ? `${summary?.questionCount ?? "—"} practical questions` : tab === "Final exam" ? `${summary?.finalExamQuestionCount ?? "—"} past-paper questions` : `${summary?.questionCount ?? "—"} focused questions`}</small>
      </button>;
    })}
  </div>;

  const metricCards = exam === "july25" ? [
    ["FOCUSED BANK", selectedExam?.questionCount ?? "—", "This exam only"],
    ["HISTOLOGY", examCount("histology"), "Junqueira + lectures"],
    ["EMBRYOLOGY", examCount("embryology"), "General + images"],
    ["GUYTON 1–8", examCount("physiology"), "Complete chapter set"],
    ["VISUAL LESSONS", lessonsForExam(exam).length, "Core reference guide"],
    ["WRONG", savedCount("wrong"), "Saved for repair"],
    ["FLAGGED", savedCount("flagged"), "Manual review list"],
  ] : exam === "aug22" ? [
    ["PRACTICAL BANK", selectedExam?.questionCount ?? "—", "This exam only"],
    ["MICROSCOPE SPECIMENS", 55, "Complete full deck"],
    ["IMAGE QUESTIONS", examCount("images"), "Three per specimen"],
    ["ATLAS LESSONS", histologyPracticalLessons.length, "One per specimen"],
    ["WRONG", savedCount("wrong"), "Saved for repair"],
    ["FLAGGED", savedCount("flagged"), "Manual review list"],
  ] : [
    ["FOCUSED BANK", selectedExam?.questionCount ?? "—", "This exam only"],
    ["BIOCHEMISTRY", examCount("biochemistry"), "Lippincott + lectures"],
    ["CELL + HISTOLOGY", examCount("histology"), "Required safety block"],
    ["MEMBRANE PHYSIOLOGY", examCount("physiology"), "Muscle moved to July 25"],
    ["VISUAL LESSONS", lessonsForExam(exam).length, "Core reference guide"],
    ["WRONG", savedCount("wrong"), "Saved for repair"],
    ["FLAGGED", savedCount("flagged"), "Manual review list"],
  ];
  const examHistory = sessionArchive.history.filter((session) => session.exam === exam);
  const resumableSession = sessionArchive.active;
  const resumableAnsweredCount = resumableSession ? Object.values(resumableSession.answers).filter((answer) => isAnswered(answer)).length : 0;

  return (
    <main className="setup-shell">
      <aside className="setup-sidebar">
        <div className="brand"><span>MED//25</span><small>July 25 · Aug 22 · Aug 25</small></div>
        <nav className="setup-nav" aria-label="Application sections">{tabs.map((item) => <button key={item} className={`${tab === item ? "active" : ""} ${item === "Final exam" ? "final-tab" : ""}`} onClick={() => setTab(item)}>{item}</button>)}</nav>
        <div className="session-rule"><span>SESSION RULE</span><b>Tabs disappear during MCQs</b><p>Once the sprint starts, only the question, progress, answer controls and end-session action remain.</p></div>
      </aside>

      <section className="setup-workspace">
        <header className="setup-topbar"><span className="topbar-label">Exam engine</span><div className="header-exam-switcher">{examSwitcher}</div><span className={health?.ok ? "connection good" : "connection waiting"}>● {health?.ok ? (health.codex.available ? "Codex ready" : "Study engine ready") : "Study engine offline"}</span></header>
        <section className={`setup-content ${tab === "Overview" ? "overview-view" : ""} ${tab === "Final exam" ? "final-exam-view" : ""} ${tab === "Topics" ? "topics-view" : ""} ${tab === "Practical Atlas" || tab === "Visual Guide" ? "lesson-guide-view" : ""} ${tab === "Practical Atlas" ? "practical-atlas-view" : ""} ${tab === "Results" ? "results-view" : ""}`}>
          {tab === "Overview" && <>
            <p className="eyebrow">Priority exam · {selectedConfig.date}</p><h1>{selectedConfig.title}</h1>
            <p className="lede">{selectedConfig.focus}. Every sprint and topic below is restricted to this exam until you switch dates.</p>
            <div className="metric-grid">{metricCards.map(([label, value, detail]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div>
            {resumableSession ? <div className="resume-sprint"><div><span>UNFINISHED SPRINT SAVED</span><h2>{examConfig[resumableSession.exam].date} · {collectionLabel[resumableSession.collection]}</h2><p>{resumableAnsweredCount} of {resumableSession.questionIds.length} answered · last position question {resumableSession.questionIndex + 1}</p></div><div><button className="primary" disabled={resumingSession} onClick={() => void continueSavedSprint()}>{resumingSession ? "Restoring…" : "Continue sprint →"}</button><button className="delete-sprint" onClick={deleteSavedSprint}>Delete unfinished sprint</button></div></div> : <div className="sprint-builder"><div><span className="builder-label">Collection</span><div className="choice-row collection-row">{selectedConfig.collections.map((value) => <button key={value} className={collection === value ? "active" : ""} onClick={() => setCollection(value)}>{collectionLabel[value]}</button>)}</div></div><div><span className="builder-label">Sprint length</span><div className="choice-row length-row">{sprintLengths.map((value) => <button key={value} className={sessionSize === value ? "active" : ""} onClick={() => setSessionSize(value)}>{value}</button>)}</div></div><div className="builder-summary"><div className="builder-coverage"><article><span>Total</span><strong>{collectionCount}</strong></article><article><span>Seen</span><strong>{seenCollectionCount}</strong></article><article><span>Unseen</span><strong>{unseenCollectionCount}</strong></article></div><span>{Math.min(sessionSize, collectionCount)}-question sprint · 80% unseen / 20% review</span><button className="primary start-sprint" disabled={!collectionCount || phase === "loading"} onClick={() => void startSession()}>{phase === "loading" ? "Loading sprint…" : `Start ${selectedConfig.date} sprint →`}</button><button className="clear-progress" disabled={!savedCount("wrong") && !savedCount("flagged")} onClick={clearSavedProgress}>Clear {selectedConfig.date} saved progress</button></div></div>}
            {sessionError && <p className="session-error">{sessionError}</p>}
          </>}

          {tab === "Final exam" && exam !== "aug22" && <FinalExam key={exam} exam={exam} bridgeUrl={bridgeUrl} />}
          {tab === "Final exam" && exam === "aug22" && <div className="practical-atlas-empty"><span className="eyebrow">Aug 22 microscope practical</span><h1>Use the focused practical bank.</h1><p>This date has 165 image questions and 55 atlas lessons rather than a separate past-paper final. Open Overview, Topics, or Practical Atlas to test it.</p></div>}

          {tab === "Topics" && <><p className="eyebrow">{selectedConfig.date} collections</p><h1>Choose a focused collection.</h1><p className="lede">Only {selectedConfig.title} material appears here. Topic controls vanish as soon as the first MCQ opens.</p><div className="saved-review-grid">{savedReviewCards.map((item) => <button key={item.id} disabled={!item.count} onClick={() => void startSession(item.id)}><strong>{item.count}</strong><span><b>{item.title}</b><small>{item.detail}</small></span><i>{item.count ? "Start →" : "Empty"}</i></button>)}</div><div className="topic-grid">{topicCards.map((item) => <article key={item.id}><span>{item.count} QUESTIONS</span><h2>{item.title}</h2><b>{item.scope}</b><p>{item.detail}</p><button disabled={!item.count} onClick={() => void startSession(item.id)}>{item.count ? "Start focused sprint →" : "Being assembled"}</button></article>)}</div>{sessionError && <p className="session-error">{sessionError}</p>}</>}

          {tab === "Practical Atlas" && exam === "aug22" && <div className="practical-atlas-shell">
            <div className="practical-atlas-head"><div><span>HISTOLOGY PRACTICALS · 55 SPECIMENS</span><b>Orient first. Identify the cells. Name the discriminator.</b></div><button className="primary" disabled={!examCount("histo-practical")} onClick={() => void startSession("histo-practical", selectedExam?.collectionQuestionIds?.["histo-practical"] ?? [])}>Test all {examCount("histo-practical")} →</button></div>
            <LessonGuide exam="aug22" lessons={histologyPracticalLessons} onStartLesson={(lesson) => void startSession("histo-practical", (selectedExam?.collectionQuestionIds?.["histo-practical"] ?? []).filter((id) => id.startsWith(`${lesson.id}-`)))} />
          </div>}

          {tab === "Practical Atlas" && exam !== "aug22" && <div className="practical-atlas-empty"><span className="eyebrow">Aug 22 practical</span><h1>This atlas belongs to Histology Practical.</h1><p>Switch to Aug 22 above to study and test the 55 microscope specimens.</p></div>}

          {tab === "Visual Guide" && <LessonGuide key={exam} exam={exam} lessons={allLessons} />}

          {tab === "Results" && <>
            <p className="eyebrow">Saved on this device · {examConfig[exam].date}</p><h1>Past sprint results.</h1>
            <p className="lede">Every completed sprint stays here with its original answers. Open any result to revisit the full repair review.</p>
            {sessionError && <p className="session-error">{sessionError}</p>}
            <div className="results-list">
              {!examHistory.length && <div className="empty-review"><b>No completed {examConfig[exam].date} sprints yet.</b><span>Finish a sprint and its score and full review will appear here automatically.</span></div>}
              {examHistory.map((saved) => {
                const score = Math.round((saved.correctCount / saved.questionIds.length) * 100);
                return <article className="saved-result" key={saved.id}>
                  <div className="saved-result-copy"><span>{formatSessionDate(saved.completedAt)}</span><h2>{collectionLabel[saved.collection]} · {saved.questionIds.length} questions</h2><p>{saved.correctCount} correct · {saved.questionIds.length - saved.correctCount} to repair · {saved.flaggedCount} flagged</p></div>
                  <strong>{score}%</strong>
                  <button className="primary" disabled={historyLoadingId === saved.id} onClick={() => void openSavedReview(saved)}>{historyLoadingId === saved.id ? "Opening…" : "Open full review →"}</button>
                </article>;
              })}
            </div>
          </>}

          {tab === "Codex tutor" && <><p className="eyebrow">Optional end-of-session layer</p><h1>Audit the thinking behind the answer.</h1><p className="lede">The answer key grades choices deterministically. At review time, Codex can separately analyze typed reasoning, confidence and misconceptions.</p><div className={`codex-status ${health?.codex.available ? "ready" : "offline"}`}><span className="pulse">●</span><div><b>{health?.codex.available ? "Codex CLI detected" : "Bridge not connected"}</b><small>{health?.codex.version ?? "Start the local bridge to enable reasoning audits."}</small></div><button onClick={() => void refresh()}>{checking ? "Checking…" : "Check again"}</button></div><div className="tutor-flow"><div><span>01</span><b>Answer privately</b><small>No answer key or hints appear during the sprint.</small></div><div><span>02</span><b>Grade deterministically</b><small>Your selected or typed answer is checked against the verified key.</small></div><div><span>03</span><b>Repair reasoning</b><small>Ask Codex about individual wrong or flagged responses.</small></div></div><p className="privacy-note">If the tutor is unavailable, MCQ scoring and explanations continue to work normally.</p></>}
        </section>
      </section>
    </main>
  );
}
