"use client";
/* eslint-disable @next/next/no-img-element -- question images are streamed from the local study bridge */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { QuestionMedia } from '@/src/components/QuestionMedia';
import { StudyShell } from '@/src/components/StudyShell';
import { StudyIcon } from '@/src/components/StudyIcon';
import { isLocationQuestion, locationOptionId, locationLabel, restoredLocationResponse, canRevealAnatomyFigure } from '@/src/lib/mcq/anatomy-location.mjs';
import { biochemistryChapterById, biochemistryChapters, isBiochemistryChapterId } from '@/src/lib/biochemistry/chapters';
import { classifySessionCompletion } from '@/src/lib/mcq/sprint-selection.mjs';
import type { MCQMedia, MCQQuestion, StudentAnswer } from '@/src/lib/mcq/types';
import { isExamId, isTerm2Exam, term2Exams, type ExamId } from '@/src/lib/mcq/exams.mjs';
import { createEmptyProgress, parseProgress, type StudyProgress } from '@/src/lib/mcq/study-progress.mjs';
import { cachedJson, rememberQuestions, recallQuestions, setQuestionCacheVersion } from '@/src/lib/mcq/client-cache';
import {mcqReviewQuestions} from '@/src/lib/mcq/wrong-answer-review.mjs';
const PastExamHub = dynamic(() => import('@/src/components/PastExamHub').then(m=>m.PastExamHub), {loading:()=> <p role="status">Loading past papers…</p>});
const ReviewTopics = dynamic(() => import('@/src/components/CourseReview').then(m=>m.ReviewTopics), {loading:()=> <p role="status">Loading review sections…</p>});
const ReviewDownloads = dynamic(() => import('@/src/components/CourseReview').then(m=>m.ReviewDownloads), {loading:()=> <p role="status">Loading review PDFs…</p>});
const WrongAnswerReview = dynamic(() => import('@/src/components/WrongAnswerReview').then(m=>m.WrongAnswerReview));
type BiochemistryStudyMode = 'learn' | 'exam';
type BiochemistryChapterProgress = (typeof biochemistryChapters)[number] & {questionCount:number;questionIds:string[];seenCount:number;unseenCount:number;wrongCount:number;repairCount:number;masteredCount:number;mastery:number};

type BankSummary = {
  bankId: string;
  title: string;
  schemaVersion: string;
  questionCount: number;
  version?: string;
  imageQuestionCount: number;
  subjects: Array<{ id: string; title: string; questionCount: number }>;
  tags?: Record<string, number>;
  exams?: Array<{
    id: ExamId;
    version?: string; detailUrl?: string; topics?: Array<{id:string;title:string;questionIds:string[]}>;
    date: string | null;
    title: string;
    questionCount: number;
    finalExamQuestionCount: number;
    finalExamBanks?: Array<{
      id: "telegram-past-papers" | "downloaded-core" | "nutrition-past-papers" | "religion-past-papers";
      label: string;
      description: string;
      questionCount: number;
    }>;
    imageQuestionCount: number;
    dynamicImageCount?: number;
    interactive3dCount?: number;
    collectionCounts: Partial<Record<CollectionId, number>>;
    collectionQuestionIds?: Partial<Record<CollectionId, string[]>>;
    biochemistryChapters?: Array<{ id: string; questionCount: number; questionIds: string[] }>;
  }>;
};

type SessionAnswer = StudentAnswer & { flagged: boolean; writtenSubmitted?: boolean };
type CollectionId = "all" | "anatomy" | "dynamic-anatomy" | "histology" | "embryology" | "physiology" | "biochemistry" | "images" | "stains" | "histo-practical" | "histo-identification" | "histo-transfer" | "practical" | "wrong" | "flagged";
type SavedCollectionId = "wrong" | "flagged";
type SessionPhase = "setup" | "loading" | "active" | "review";
type ReviewFilter = "all" | "wrong" | "flagged";
type ActiveSessionSnapshot = {
  exam: ExamId;
  collection: CollectionId;
  sessionSize: number;
  questionIds: string[];
  answers: Record<string, SessionAnswer>;
  visitedQuestionIds: string[];
  questionIndex: number;
  startedAt: string;
  studyMode: BiochemistryStudyMode;
  biochemistryChapterId?: string;
  respiratoryScopeId?: string;
  respiratoryPracticeIds?: string[];
  practicalPracticeIds?: string[];
  coursePracticeIds?: string[];
};
type CompletedSession = ActiveSessionSnapshot & {
  id: string;
  completedAt: string;
  correctCount: number;
  answeredCount: number;
  flaggedCount: number;
};
type SessionArchive = { version: 1; active: ActiveSessionSnapshot | null; history: CompletedSession[] };

const bridgeUrl = ''; // Same-origin Next APIs; no tutor/CLI bridge dependency.
const progressStorageKey = "med25-study-progress-v1";
const sessionArchiveStorageKey = "med25-session-archive-v1";
const tabs = ["Practice MCQs", "Past exams", "Review topics", "Results"] as const;
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
    focus: "Written microscope identification for the confirmed slides, a 100+ unfamiliar-field transfer bank, and the complete 55-specimen atlas",
    collections: ["histo-transfer", "histo-identification", "histo-practical", "wrong", "flagged"],
  },
  july29: {
    date: "Aug 25",
    title: "Cell & Molecules",
    focus: "Teacher-confirmed Lippincott chapters, chapter-by-chapter self-testing, cellular histology, membrane physiology and confirmed laboratory methods; partial, supplementary and unconfirmed chapters are labeled clearly",
    collections: ["all", "wrong", "flagged", "biochemistry", "histology", "physiology", "images", "stains", "practical"],
  },
  "term2-cvs": { date: "Date TBA", title: "CVS", focus: term2Exams[0].scope, collections: ["all", "anatomy", "histology", "embryology", "physiology", "dynamic-anatomy", "images", "wrong", "flagged"] },
  "term2-respiratory": { date: "Date TBA", title: "Respiratory", focus: term2Exams[1].scope, collections: ["all", "anatomy", "histology", "embryology", "physiology", "dynamic-anatomy", "images", "wrong", "flagged"] },
  "term2-limbs": { date: "Date TBA", title: "Upper & Lower Limbs", focus: term2Exams[2].scope, collections: ["all", "anatomy", "histology", "embryology", "physiology", "dynamic-anatomy", "images", "wrong", "flagged"] },
  "term2-biochemistry": { date: "Date TBA", title: "Biochemistry II", focus: term2Exams[3].scope, collections: ["all", "biochemistry", "practical", "images", "wrong", "flagged"] },
  "term2-physiology-practical": { date: "Aug 31 · user-reported", title: "Physiology Practical", focus: term2Exams[4].scope, collections: ["all", "images", "wrong", "flagged"] },
  "term2-nutrition": { date: "Date TBA", title: "Nutrition", focus: term2Exams[5].scope, collections: ["all", "biochemistry", "wrong", "flagged"] },
  "term2-religion": { date: "Date TBA", title: "Religion", focus: term2Exams[6].scope, collections: ["all", "wrong", "flagged"] },
  "term2-divine-ethics": { date: "Date TBA", title: "Divine Ethics", focus: term2Exams[7].scope, collections: ["all", "wrong", "flagged"] },
};
const collectionLabel: Record<CollectionId, string> = {
  all: "Mixed",
  anatomy: "Anatomy",
  "dynamic-anatomy": "Dynamic anatomy",
  histology: "Histology",
  embryology: "Embryology",
  physiology: "Physiology",
  biochemistry: "Biochemistry",
  images: "Images",
  stains: "Stains",
  "histo-practical": "Histology practicals",
  "histo-identification": "15-slide identification",
  "histo-transfer": "110+ field transfer lab",
  practical: "Practical + spotters",
  wrong: "Wrong answers",
  flagged: "Flagged",
};
type Tab = (typeof tabs)[number];

function isTerm2CourseExam(examId: ExamId): boolean {
  return examId === "term2-cvs" || examId === "term2-limbs" || examId === "term2-biochemistry" || examId === "term2-nutrition" || examId === "term2-religion" || examId === "term2-divine-ethics";
}

function cleanIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 160))];
}

function isCollectionId(value: unknown): value is CollectionId {
  return typeof value === "string" && Object.hasOwn(collectionLabel, value);
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
    if (typeof answer.selectedRegionId === "string") normalized.selectedRegionId = answer.selectedRegionId.slice(0, 160);
    if (typeof answer.writtenAnswer === "string") normalized.writtenAnswer = answer.writtenAnswer.slice(0, 6000);
    if (typeof answer.writtenSubmitted === "boolean") normalized.writtenSubmitted = answer.writtenSubmitted;
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
  const questionIndex = Math.max(0, Math.min(questionIds.length - 1, Math.floor(Number(session.questionIndex) || 0)));
  const answers = cleanAnswers(session.answers, questionIds);
  const validQuestionIds = new Set(questionIds);
  const explicitVisitedIds = cleanIds(session.visitedQuestionIds).filter((id) => validQuestionIds.has(id));
  const visitedQuestionIds = explicitVisitedIds.length
    ? explicitVisitedIds
    : cleanIds([
      ...questionIds.slice(0, questionIndex + 1),
      ...questionIds.filter((id) => isAnswered(answers[id])),
    ]);
  return {
    exam: migratedExam,
    collection: session.collection,
    sessionSize: Number.isFinite(requestedSize) ? Math.max(1, Math.min(250, Math.floor(requestedSize))) : questionIds.length,
    questionIds,
    answers,
    visitedQuestionIds,
    questionIndex,
    startedAt: typeof session.startedAt === "string" ? session.startedAt : new Date().toISOString(),
    studyMode: session.studyMode === "exam" ? "exam" : "learn",
    biochemistryChapterId: isBiochemistryChapterId(session.biochemistryChapterId) ? session.biochemistryChapterId : undefined,
    respiratoryScopeId: typeof session.respiratoryScopeId === "string" ? session.respiratoryScopeId : undefined,
    respiratoryPracticeIds: cleanIds(session.respiratoryPracticeIds),
    practicalPracticeIds: cleanIds(session.practicalPracticeIds),
    coursePracticeIds: isTerm2CourseExam(migratedExam) ? cleanIds(session.coursePracticeIds).slice(0, 500) : undefined,
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
      const completedQuestionIds = active.visitedQuestionIds.length ? active.visitedQuestionIds : active.questionIds;
      return [{
        ...active,
        questionIds: completedQuestionIds,
        answers: cleanAnswers(completed.answers, completedQuestionIds),
        visitedQuestionIds: completedQuestionIds,
        id: typeof completed.id === "string" ? completed.id : `${completed.completedAt ?? active.startedAt}-${active.questionIds[0]}`,
        completedAt: typeof completed.completedAt === "string" ? completed.completedAt : active.startedAt,
        correctCount: Math.max(0, Math.min(completedQuestionIds.length, Math.floor(Number(completed.correctCount) || 0))),
        answeredCount: Math.max(0, Math.min(completedQuestionIds.length, Math.floor(Number(completed.answeredCount) || 0))),
        flaggedCount: Math.max(0, Math.min(completedQuestionIds.length, Math.floor(Number(completed.flaggedCount) || 0))),
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

function savedScopeLabel(session: ActiveSessionSnapshot) {
  return biochemistryChapterById(session.biochemistryChapterId)?.shortTitle ?? collectionLabel[session.collection];
}

function isSavedCollection(value: CollectionId): value is SavedCollectionId {
  return value === "wrong" || value === "flagged";
}

const emptyAnswer = (questionId: string, flagged = false, mode: StudentAnswer["mode"] = "select"): SessionAnswer => ({
  questionId,
  mode,
  reasoning: "",
  confidence: "unsure",
  flagged,
  ...(mode === "write" ? { writtenSubmitted: false } : {}),
});

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ").trim();
}

const practicalTissueVocabulary = [
  ["Trachea / pseudostratified respiratory epithelium", ["trachea", "tracheal wall", "respiratory epithelium", "pseudostratified", "pseudostratified epithelium", "pseudostratified ciliated epithelium", "pseudostratified ciliated columnar epithelium", "ciliated pseudostratified columnar epithelium"]],
  ["Urinary bladder / transitional epithelium", ["bladder", "urinary bladder", "urothelium", "transitional", "transitional epithelium"]],
  ["Spongy (trabecular) bone", ["spongy bone", "trabecular bone", "cancellous bone", "bone"]],
  ["Hyaline cartilage", ["hyaline cartilage", "cartilage"]],
  ["Synovial joint", ["joint", "synovial joint", "diarthrosis", "diarthrodial joint"]],
  ["Cartilaginous symphysis (amphiarthrosis)", ["cartilaginous joint", "symphysis", "pubic symphysis", "amphiarthrosis", "secondary cartilaginous joint"]],
  ["Fibrous joint (synarthrosis)", ["fibrous joint", "synarthrosis", "suture", "syndesmosis", "gomphosis"]],
  ["Elastic cartilage", ["elastic cartilage"]],
  ["Fibrocartilage", ["fibrocartilage", "fibrous cartilage"]],
  ["Compact (cortical) bone", ["compact bone", "cortical bone", "lamellar bone", "osteon", "haversian system"]],
  ["Woven (immature) bone", ["woven bone", "immature bone", "primary bone", "ossification"]],
  ["Peripheral nerve", ["nerve", "peripheral nerve"]],
  ["Sensory ganglion", ["ganglion", "sensory ganglion", "dorsal root ganglion", "drg"]],
  ["Autonomic ganglion", ["autonomic ganglion", "parasympathetic ganglion", "sympathetic ganglion"]],
  ["Thin skin (skin with hair)", ["thin skin", "skin with hair", "hairy skin"]],
  ["Thick skin (skin without hair)", ["thick skin", "skin without hair", "glabrous skin", "hairless skin"]],
  ["White adipose tissue", ["white adipose", "white adipose tissue", "white fat", "unilocular adipose", "unilocular adipose tissue"]],
  ["Brown adipose tissue", ["brown adipose", "brown adipose tissue", "brown fat", "multilocular adipose", "multilocular adipose tissue"]],
  ["Thyroid / simple cuboidal epithelium", ["thyroid", "thyroid gland", "cuboidal epithelium", "simple cuboidal", "simple cuboidal epithelium"]],
  ["Skeletal muscle", ["skeletal muscle", "striated skeletal muscle"]],
  ["Cardiac muscle", ["cardiac muscle", "myocardium", "heart muscle"]],
  ["Tendon", ["tendon", "dense regular connective tissue", "dense regular collagenous connective tissue"]],
  ["Ligament", ["ligament", "enthesis"]],
  ["Simple cuboidal epithelium", ["simple cuboidal", "simple cuboidal epithelium", "cuboidal epithelium"]],
  ["Transitional epithelium (urothelium)", ["transitional", "transitional epithelium", "urothelium", "urinary epithelium"]],
  ["Pseudostratified columnar epithelium", ["pseudostratified", "pseudostratified epithelium", "pseudostratified columnar epithelium", "pseudostratified ciliated columnar epithelium", "respiratory epithelium"]],
] as const;

function isWrittenPracticalQuestion(question: MCQQuestion) {
  return (question.tags ?? []).includes("written-answer");
}

function answerForQuestion(question: MCQQuestion, saved?: SessionAnswer, flagged = false): SessionAnswer {
  if (isLocationQuestion(question)) {
    const response = restoredLocationResponse(question, saved?.selectedRegionId);
    return { ...emptyAnswer(question.id, flagged), ...saved, mode: "select", selectedOptionId: response?.selectedOptionId, selectedRegionId: response?.selectedRegionId };
  }
  if (!isWrittenPracticalQuestion(question)) return saved ?? emptyAnswer(question.id, flagged);
  if (saved?.mode === "write") return { ...saved, mode: "write", writtenSubmitted: saved.writtenSubmitted ?? Boolean(saved.writtenAnswer?.trim()) };
  return emptyAnswer(question.id, saved?.flagged ?? flagged, "write");
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function writtenSimilarity(input: string, candidate: string) {
  if (!input || !candidate) return 0;
  if (input === candidate) return 1;
  const inputTokens = input.split(" ");
  const candidateTokens = candidate.split(" ");
  const shorter = inputTokens.length <= candidateTokens.length ? inputTokens : candidateTokens;
  const longer = shorter === inputTokens ? candidateTokens : inputTokens;
  if (shorter.length >= 2 && shorter.every((token) => longer.includes(token))) return 0.94;
  const longest = Math.max(input.length, candidate.length);
  if (longest < 5) return 0;
  return 1 - editDistance(input, candidate) / longest;
}

type WrittenInterpretation = { optionId?: string; label?: string; autocorrected: boolean };

function interpretWrittenAnswer(question: MCQQuestion, answer?: SessionAnswer): WrittenInterpretation {
  const raw = answer?.writtenAnswer?.trim() ?? "";
  const input = normalize(raw);
  if (!input) return { autocorrected: false };
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);
  const candidates: Array<{ optionId?: string; label: string; alias: string }> = [];
  for (const option of question.options) {
    const aliases = [option.text];
    if (option.id === question.correctOptionId) aliases.push(...(question.acceptedFreeText ?? []));
    const vocabulary = practicalTissueVocabulary.find(([, groupAliases]) => groupAliases.some((alias) => normalize(alias) === normalize(option.text)));
    if (vocabulary) aliases.push(...vocabulary[1]);
    for (const alias of aliases) candidates.push({ optionId: option.id, label: option.text, alias });
  }
  if ((question.tags ?? []).includes("specimen-identification")) {
    for (const [label, aliases] of practicalTissueVocabulary) {
      for (const alias of aliases) candidates.push({ label, alias });
    }
  }
  const ranked = candidates
    .map((candidate) => ({ ...candidate, score: writtenSimilarity(input, normalize(candidate.alias)) }))
    .filter((candidate) => candidate.score >= 0.76)
    .sort((left, right) => right.score - left.score || left.alias.length - right.alias.length);
  const best = ranked[0];
  if (!best) return { autocorrected: false };
  const tiedLabels = new Set(ranked.filter((candidate) => candidate.score === best.score).map((candidate) => normalize(candidate.label)));
  if (tiedLabels.size > 1 && best.score < 1) return { autocorrected: false };
  const label = best.optionId === question.correctOptionId && correctOption ? correctOption.text : best.label;
  return { optionId: best.optionId, label, autocorrected: normalize(label) !== input };
}

function writtenOptionId(question: MCQQuestion, answer: SessionAnswer) {
  const raw = answer.writtenAnswer?.trim() ?? "";
  const leadingLetter = raw.match(/^(?:option\s*)?([a-f])(?:\b|[).:\-])/i)?.[1]?.toUpperCase();
  if (leadingLetter && question.options.some((option) => option.id.toUpperCase() === leadingLetter)) return leadingLetter;
  return interpretWrittenAnswer(question, answer).optionId;
}

function selectedOptionId(question: MCQQuestion, answer?: SessionAnswer) {
  if (!answer) return undefined;
  if (isLocationQuestion(question)) return restoredLocationResponse(question, answer.selectedRegionId)?.selectedOptionId;
  return answer.mode === "select" ? answer.selectedOptionId : writtenOptionId(question, answer);
}

function isAnswered(answer?: SessionAnswer) {
  return Boolean(answer && (answer.mode === "select" ? answer.selectedOptionId : answer.writtenAnswer?.trim() && answer.writtenSubmitted !== false));
}

function isCorrect(question: MCQQuestion, answer?: SessionAnswer) {
  if (answer?.mode === "write" && answer.writtenSubmitted === false) return false;
  return selectedOptionId(question, answer) === question.correctOptionId;
}

function QuestionSource({question}:{question:MCQQuestion}) { const source=question.source; return <p className="question-source"><b>Source</b> {[source.title,source.chapter,source.page,source.figure,source.slide].filter(Boolean).join(' · ')}</p>; }
function StudyMedia(props:{question:MCQQuestion;review?:boolean;onLocationSubmit?:(regionId?:string)=>void;locationAnswered?:boolean;savedRegionId?:string}) { return <QuestionMedia {...props}/>; }

export default function Home() {
  const [tab, setTab] = useState<Tab>("Practice MCQs");
  const [cvsPaperActive, setCvsPaperActive] = useState(false);
  const [bank, setBank] = useState<BankSummary | null>(null);
  const [checking, setChecking] = useState(true);
  const [bankStatus, setBankStatus] = useState<"loading" | "ready" | "error">("loading");
  const [phase, setPhase] = useState<SessionPhase>("setup");
  const [exam, setExam] = useState<ExamId>("term2-respiratory");
  const [collection, setCollection] = useState<CollectionId>("all");
  const [sessionSize, setSessionSize] = useState(20);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, SessionAnswer>>({});
  const [visitedQuestionIds, setVisitedQuestionIds] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionError, setSessionError] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("wrong");
  const [progress, setProgress] = useState<StudyProgress>(createEmptyProgress);
  const [progressReady, setProgressReady] = useState(false);
  const [sessionArchive, setSessionArchive] = useState<SessionArchive>({ version: 1, active: null, history: [] });
  const [sessionArchiveReady, setSessionArchiveReady] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState("");
  const [studyMode, setStudyMode] = useState<BiochemistryStudyMode>("learn");
  const [activeBiochemistryChapterId, setActiveBiochemistryChapterId] = useState<string>();
  const [activeRespiratoryScopeId, setActiveRespiratoryScopeId] = useState<string>();
  const [activeRespiratoryPracticeIds, setActiveRespiratoryPracticeIds] = useState<string[]>();
  const [activePracticalPracticeIds, setActivePracticalPracticeIds] = useState<string[]>();
  const [activeCoursePracticeIds, setActiveCoursePracticeIds] = useState<string[]>();
  const [lastRespiratoryScopeId, setLastRespiratoryScopeId] = useState<string>();
  const [historyLoadingId, setHistoryLoadingId] = useState("");
  const [resumingSession, setResumingSession] = useState(false);
  const sessionRequest=useRef(0);

  const refresh = useCallback(async () => {
    setChecking(true);
    setBankStatus("loading");
    try {
      const summary = await cachedJson<BankSummary>('/study/runtime/catalog.json', true);
      if (!Array.isArray(summary.exams)) throw new Error('Question catalog unavailable');
      for(const course of summary.exams)if(course.version)setQuestionCacheVersion(course.id,course.version);
      setBank(summary); setBankStatus('ready');
    } catch { setBankStatus('error');
    } finally {
      setChecking(false);
    }
  }, []);

  const loadQuestionsByIds = useCallback(async (examId: ExamId, questionIds: string[], purpose = "practice") => {
    const cached = await recallQuestions(examId,questionIds,purpose);
    if (cached) return cached;
    const response = await fetch('/api/questions/by-ids', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({exam:examId,ids:questionIds,limit:questionIds.length,preserveOrder:true,purpose})});
    if(!response.ok) throw new Error('Could not reload saved questions. Connect once to cache this session.');
    const payload = await response.json() as {questions:MCQQuestion[]};
    void rememberQuestions(examId,payload.questions,purpose);
    return payload.questions;
  }, []);

  useEffect(() => { void refresh(); if('serviceWorker' in navigator) void navigator.serviceWorker.register('/med25-sw.js',{type:'module',updateViaCache:'none'}).catch(()=>{}); }, [refresh]);
  const detailUrl = bank?.exams?.find(item=>item.id===exam)?.detailUrl;
  useEffect(()=>{let cancelled=false;if(detailUrl) void cachedJson<NonNullable<BankSummary['exams']>[number]>(detailUrl).then(detail=>{if(!cancelled)setBank(current=>current?{...current,exams:current.exams?.map(c=>c.id===exam?{...c,...detail}:c)}:current);}).catch(()=>{});return()=>{cancelled=true;};},[exam,detailUrl]);

  useEffect(() => {
    const requestedExam = new URLSearchParams(window.location.search).get("exam");
    if (isExamId(requestedExam)) {
      setExam(requestedExam);
      setCollection(examConfig[requestedExam].collections[0]);

    }
  }, []);

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
    if (phase !== "active") return;
    const currentQuestionId = questions[questionIndex]?.id;
    if (!currentQuestionId) return;
    setVisitedQuestionIds((current) => current.includes(currentQuestionId) ? current : [...current, currentQuestionId]);
  }, [phase, questionIndex, questions]);

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
        visitedQuestionIds,
        questionIndex,
        startedAt,
        studyMode,
        biochemistryChapterId: activeBiochemistryChapterId,
        respiratoryScopeId: activeRespiratoryScopeId,
        respiratoryPracticeIds: activeRespiratoryPracticeIds,
        practicalPracticeIds: activePracticalPracticeIds,
        coursePracticeIds: activeCoursePracticeIds,
      },
    }));
  }, [activeBiochemistryChapterId, activeRespiratoryScopeId, activeRespiratoryPracticeIds, activePracticalPracticeIds, activeCoursePracticeIds, answers, collection, exam, phase, questionIndex, questions, sessionArchiveReady, sessionSize, sessionStartedAt, studyMode, visitedQuestionIds]);

  const selectedExam = bank?.exams?.find((item) => item.id === exam);
  const subjectIds = selectedExam?.collectionQuestionIds;
  // Keep setup helpers above the active/review returns: every render must run the same hooks.
  const subjectOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const subject of ['anatomy', 'histology', 'embryology', 'physiology', 'biochemistry'] as const) {
      for (const id of subjectIds?.[subject] ?? []) map.set(id, subject);
    }
    return (id: string) => map.get(id);
  }, [subjectIds]);
  const statsReady = Boolean(bank) && progressReady && sessionArchiveReady;
  const displayCount = (value: string | number) => statsReady ? value : bankStatus === "error" ? "—" : <span className="loading-stat" aria-label="Loading count">…</span>;
  const selectedConfig = examConfig[exam];
  const examLabel = isTerm2Exam(exam) ? selectedConfig.title : selectedConfig.date;
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
  const biochemistryChapterProgress: BiochemistryChapterProgress[] = biochemistryChapters.flatMap((definition) => {
    const summary = selectedExam?.biochemistryChapters?.find((chapter) => chapter.id === definition.id);
    if (!summary?.questionCount) return [];
    const ids = summary.questionIds ?? [];
    const seenCount = ids.filter((id) => seenQuestionIds.has(id)).length;
    const wrongIds = new Set(ids.filter((id) => examProgress.wrongIds.includes(id)));
    const repairIds = new Set(ids.filter((id) => wrongIds.has(id) || examProgress.flaggedIds.includes(id)));
    const masteredCount = ids.filter((id) => seenQuestionIds.has(id) && !wrongIds.has(id)).length;
    return [{
      ...definition,
      questionCount: summary.questionCount,
      questionIds: ids,
      seenCount,
      unseenCount: Math.max(0, summary.questionCount - seenCount),
      wrongCount: wrongIds.size,
      repairCount: repairIds.size,
      masteredCount,
      mastery: Math.round((masteredCount / summary.questionCount) * 100),
    }];
  });

  function chooseExam(nextExam: ExamId) {
    sessionRequest.current++;
    setPhase('setup');
    setExam(nextExam);
    setCollection(examConfig[nextExam].collections[0]);
    setSessionError("");
    setStudyMode("learn");
    setActiveBiochemistryChapterId(undefined);
    setActiveRespiratoryScopeId(undefined);
    setActiveRespiratoryPracticeIds(undefined);
    setActivePracticalPracticeIds(undefined);
    setActiveCoursePracticeIds(undefined);
    const url = new URL(window.location.href);
    url.searchParams.set("exam", nextExam);
    window.history.replaceState(null, "", url);
  }

  async function startSession(nextCollection: CollectionId = collection, exactIds?: string[], options: {
    biochemistryChapterId?: string;
    respiratoryScopeId?: string;
    mode?: BiochemistryStudyMode;
    limit?: number;
  } = {}) {
    if (phase === "setup" && sessionArchive.active && !window.confirm("Starting a new session replaces your unfinished sprint. Completed results and progress stay saved. Start the new session?")) return;
    const requestId=++sessionRequest.current;
    const requestedLimit = options.limit ?? (exactIds ? exactIds.length : sessionSize);
    const nextStudyMode = options.mode ?? "learn";
    setCollection(nextCollection);
    setSessionSize(requestedLimit);
    setStudyMode(nextStudyMode);
    setActiveBiochemistryChapterId(options.biochemistryChapterId);
    setActivePracticalPracticeIds(exactIds ? cleanIds(exactIds) : undefined);
    setActiveCoursePracticeIds(isTerm2CourseExam(exam) && exactIds ? cleanIds(exactIds) : undefined);
    setActiveRespiratoryScopeId(options.respiratoryScopeId);
    setActiveRespiratoryPracticeIds(exam === 'term2-respiratory' && exactIds ? cleanIds(exactIds) : undefined);
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
      const repairIds = cleanIds([...examProgress.wrongIds, ...examProgress.flaggedIds]);
      const historicalSeenIds = cleanIds(sessionArchive.history
        .filter((session) => session.exam === exam)
        .flatMap((session) => session.questionIds));
      const seenIds = cleanIds([...historicalSeenIds, ...repairIds]);
      let response: Response;
      if (exactIds || isSavedCollection(nextCollection)) {
        if (!requestedIds.length) throw new Error(`No ${collectionLabel[nextCollection].toLowerCase()} are saved for ${selectedConfig.date}.`);
        response = await fetch(`${bridgeUrl}/api/questions/by-ids`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ exam, ids: requestedIds, limit: requestedLimit, prioritize: true, seenIds, repairIds, studyMode: nextStudyMode }),
        });
      } else {
        response = await fetch(`${bridgeUrl}/api/questions/sprint`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ limit: requestedLimit, exam, collection: nextCollection, seenIds, repairIds, studyMode: nextStudyMode, biochemistryChapterId: options.biochemistryChapterId }),
        });
      }
      if (!response.ok) throw new Error("Could not load the question bank.");
      const payload = await response.json() as { questions: MCQQuestion[]; validIds?: string[] };
      if(requestId!==sessionRequest.current)return;
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
      void rememberQuestions(exam,payload.questions);
      setQuestions(payload.questions);
      setAnswers(Object.fromEntries(payload.questions.map((question) => [question.id, answerForQuestion(question, undefined, flaggedIds.has(question.id))])));
      setVisitedQuestionIds(payload.questions[0] ? [payload.questions[0].id] : []);
      setQuestionIndex(0);
      setReviewFilter("wrong");
      setSessionStartedAt(new Date().toISOString());
      setPhase("active");
    } catch (error) {
      if(requestId!==sessionRequest.current)return;
      setSessionError(error instanceof Error ? error.message : "Could not start the session.");
      setPhase("setup");
    }
  }

  function updateAnswer(questionId: string, patch: Partial<SessionAnswer>) {
    setAnswers((current) => ({ ...current, [questionId]: { ...(current[questionId] ?? emptyAnswer(questionId)), ...patch } }));
  }

  function submitWrittenAnswer(questionId: string) {
    if (!answers[questionId]?.writtenAnswer?.trim()) return;
    updateAnswer(questionId, { writtenSubmitted: true });
  }

  function reviseWrittenAnswer(questionId: string) {
    updateAnswer(questionId, { writtenSubmitted: false });
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
    const currentQuestionId = questions[questionIndex]?.id;
    const answeredIds = questions.filter((question) => isAnswered(answers[question.id])).map((question) => question.id);
    const effectiveVisitedIds = cleanIds([...visitedQuestionIds, currentQuestionId, ...answeredIds]);
    const correctAnswerIds = questions.filter((question) => isCorrect(question, answers[question.id])).map((question) => question.id);
    const completion = classifySessionCompletion(questions.map((question) => question.id), {
      visitedIds: effectiveVisitedIds,
      answeredIds,
      correctIds: correctAnswerIds,
    });
    const completedIdSet = new Set(completion.seenIds);
    const completedQuestions = questions.filter((question) => completedIdSet.has(question.id));
    const completedAnswers = Object.fromEntries(completion.seenIds.map((id) => [id, answers[id] ?? emptyAnswer(id)]));
    const correctIds = new Set(completion.correctIds);
    const missedIds = completion.repairIds;
    const completedAt = new Date().toISOString();
    const answeredCount = completion.seenIds.filter((id) => isAnswered(answers[id])).length;
    const flaggedCount = completion.seenIds.filter((id) => answers[id]?.flagged).length;
    const completedSession: CompletedSession = {
      id: `${Date.now()}-${questions[0]?.id ?? "session"}`,
      exam,
      collection,
      sessionSize,
      questionIds: completion.seenIds,
      answers: completedAnswers,
      visitedQuestionIds: completion.seenIds,
      questionIndex: Math.max(0, completion.seenIds.length - 1),
      startedAt: sessionStartedAt || completedAt,
      studyMode,
      biochemistryChapterId: activeBiochemistryChapterId,
      respiratoryScopeId: activeRespiratoryScopeId,
      respiratoryPracticeIds: activeRespiratoryPracticeIds,
      practicalPracticeIds: activePracticalPracticeIds,
      coursePracticeIds: activeCoursePracticeIds,
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
    setQuestions(completedQuestions);
    setAnswers(completedAnswers);
    setVisitedQuestionIds(completion.seenIds);
    setQuestionIndex(0);
    setConfirmEnd(false);
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
    sessionRequest.current++;


    setActivePracticalPracticeIds(undefined);
    setQuestions([]);
    setAnswers({});
    setVisitedQuestionIds([]);
    setQuestionIndex(0);
    setSessionStartedAt("");
    setStudyMode("learn");
    setActiveBiochemistryChapterId(undefined);
    setActiveRespiratoryScopeId(undefined);
    setActiveRespiratoryPracticeIds(undefined);
    setActivePracticalPracticeIds(undefined);
    setActiveCoursePracticeIds(undefined);
    setConfirmEnd(false);
    setSessionArchive((current) => ({ ...current, active: null }));
    setPhase("setup");
    void refresh();
  }

  async function continueSavedSprint() {
    const saved = sessionArchive.active;
    if (!saved) return;
    const requestId=++sessionRequest.current;
    setResumingSession(true);
    setSessionError("");
    setPhase("loading");
    setExam(saved.exam);
    setCollection(saved.collection);
    setSessionSize(saved.sessionSize);
    setSessionStartedAt(saved.startedAt);
    setStudyMode(saved.studyMode);
    setActiveBiochemistryChapterId(saved.biochemistryChapterId);
    setActiveRespiratoryScopeId(saved.respiratoryScopeId);
    setActiveRespiratoryPracticeIds(saved.respiratoryPracticeIds);
    setActivePracticalPracticeIds(cleanIds(saved.practicalPracticeIds));
    setActiveCoursePracticeIds(saved.coursePracticeIds);
    if (saved.respiratoryScopeId) setLastRespiratoryScopeId(saved.respiratoryScopeId);
    try {
      const restoredQuestions = await loadQuestionsByIds(saved.exam, saved.questionIds);
      if(requestId!==sessionRequest.current)return;
      if (!restoredQuestions.length) {
        setSessionArchive(current=>({...current,active:null}));
        setSessionError("This unfinished sprint contained questions removed from practice. Start a new advanced anatomy session; completed results are preserved.");
        setPhase("setup");
        return;
      }
      const restoredIds = new Set(restoredQuestions.map((question) => question.id));
      setQuestions(restoredQuestions);
      setAnswers(Object.fromEntries(restoredQuestions.map((question) => [question.id, answerForQuestion(question, saved.answers[question.id])])));
      setVisitedQuestionIds(saved.visitedQuestionIds.filter((id) => restoredIds.has(id)));
      const previousId=saved.questionIds[saved.questionIndex];
      const survivingIndex=restoredQuestions.findIndex(question=>question.id===previousId);
      setQuestionIndex(survivingIndex>=0?survivingIndex:Math.min(saved.questionIds.slice(0,saved.questionIndex).filter(id=>restoredIds.has(id)).length,restoredQuestions.length-1));
      setSessionArchive((current) => ({ ...current, active: current.active ? { ...current.active, questionIds: current.active.questionIds.filter((id) => restoredIds.has(id)) } : null }));
      setPhase("active");
    } catch (error) {
      if(requestId!==sessionRequest.current)return;
      setSessionError(error instanceof Error ? error.message : "Could not resume the saved sprint.");
      setPhase("setup");
    } finally {
      if(requestId===sessionRequest.current)setResumingSession(false);
    }
  }

  function deleteSavedSprint() {
    if (!window.confirm("Delete this unfinished sprint? Completed results, wrong answers and flags will stay saved.")) return;
    sessionRequest.current++;
    setSessionArchive((current) => ({ ...current, active: null }));
    setQuestions([]);
    setAnswers({});
    setVisitedQuestionIds([]);
    setQuestionIndex(0);
    setSessionStartedAt("");
    setStudyMode("learn");
    setActiveBiochemistryChapterId(undefined);
    setActiveRespiratoryScopeId(undefined);
    setActiveRespiratoryPracticeIds(undefined);
    setActivePracticalPracticeIds(undefined);
    setActiveCoursePracticeIds(undefined);
    setSessionError("");
    setPhase("setup");
  }

  async function openSavedReview(saved: CompletedSession) {
    const requestId=++sessionRequest.current;
    setHistoryLoadingId(saved.id);
    setSessionError("");
    setPhase("loading");
    setExam(saved.exam);
    setCollection(saved.collection);
    setSessionSize(saved.sessionSize);
    setSessionStartedAt(saved.startedAt);
    setStudyMode(saved.studyMode);
    setActiveBiochemistryChapterId(saved.biochemistryChapterId);
    setActiveRespiratoryScopeId(saved.respiratoryScopeId);
    setActiveRespiratoryPracticeIds(saved.respiratoryPracticeIds);
    setActivePracticalPracticeIds(cleanIds(saved.practicalPracticeIds));
    setActiveCoursePracticeIds(saved.coursePracticeIds);
    if (saved.respiratoryScopeId) setLastRespiratoryScopeId(saved.respiratoryScopeId);
    try {
      const restoredQuestions = await loadQuestionsByIds(saved.exam, saved.questionIds, "history");
      if(requestId!==sessionRequest.current)return;
      if (!restoredQuestions.length) throw new Error("The saved questions are no longer available.");
      setQuestions(restoredQuestions);
      setAnswers(Object.fromEntries(restoredQuestions.map((question) => [question.id, answerForQuestion(question, saved.answers[question.id])])));
      setVisitedQuestionIds(restoredQuestions.map((question) => question.id));
      setQuestionIndex(0);
      setReviewFilter("wrong");
      setPhase("review");
    } catch (error) {
      if(requestId!==sessionRequest.current)return;
      setSessionError(error instanceof Error ? error.message : "Could not open this saved review.");
      setPhase("setup");
    } finally {
      if(requestId===sessionRequest.current)setHistoryLoadingId("");
    }
  }

  if (phase === "active") {
    const question = questions[questionIndex];
    const answer = answers[question.id] ?? answerForQuestion(question);
    const chosenId = selectedOptionId(question, answer);
    const chosen = question.options.find((option) => option.id === chosenId);
    const correct = question.options.find((option) => option.id === question.correctOptionId);
    const isWrittenPractical = isWrittenPracticalQuestion(question);
    const hasAnswer = answer.mode === "select" ? Boolean(answer.selectedOptionId) : answer.writtenSubmitted === true;
    const figureReady = canRevealAnatomyFigure(question, questions, q => isAnswered(answers[q.id]));
    const hasImmediateFeedback = studyMode === "learn" && hasAnswer && figureReady;
    const hasSavedWrittenAnswer = answer.mode === "write" && answer.writtenSubmitted === true;
    const activeChapter = biochemistryChapterById(activeBiochemistryChapterId);
    const sessionLabel = activeChapter ? `${activeChapter.chapterLabel} · ${activeChapter.shortTitle}` : collectionLabel[collection];
    const writtenInterpretation = answer.mode === "write" ? interpretWrittenAnswer(question, answer) : undefined;
    const answeredCount = questions.filter((item) => isAnswered(answers[item.id])).length;
    const effectiveVisitedIds = new Set([...visitedQuestionIds, question.id]);
    const openedUnansweredCount = questions.filter((item) => effectiveVisitedIds.has(item.id) && !isAnswered(answers[item.id])).length;
    const untouchedCount = questions.filter((item) => !effectiveVisitedIds.has(item.id)).length;
    return (
      <main className="session-shell">
        <header className="session-header">
          <div className="session-mark"><b>MED//25</b><span>{examLabel} · {sessionLabel}</span></div>
          <div className="session-progress"><span>Question {questionIndex + 1} of {questions.length}</span><div><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><small>{answeredCount} answered</small></div>
          <div className="session-end-stack"><span className={`session-mode-badge ${studyMode}`}>{studyMode === "exam" ? "Exam · answers hidden" : "Learn · instant teaching"}</span><button className="end-button" onClick={() => setConfirmEnd(true)}>End session</button></div>
        </header>

        <section className="session-body">
          <div className="question-scroll">
            <article className="question-card">
              <div className="question-meta">
                <span>{question.subject}</span><span>{question.topic}</span><span>Difficulty {question.difficulty}/5</span>
              </div>
              {isLocationQuestion(question) && <h1>{question.prompt}</h1>}
              {question.subject === "anatomy" && <StudyMedia question={question} review={hasImmediateFeedback} locationAnswered={hasAnswer} savedRegionId={answer.selectedRegionId} onLocationSubmit={(regionId) => { if (!hasImmediateFeedback) updateAnswer(question.id, { mode: "select", selectedOptionId: locationOptionId(question, regionId), selectedRegionId: regionId }); }} />}
              {studyMode === "learn" && hasAnswer && !figureReady && <p className="anatomy-location-instruction">Answer saved. Feedback waits until the other targets on this figure are answered, or until session review, so labels do not give away later answers.</p>}
              {!isLocationQuestion(question) && <h1>{question.prompt}</h1>}
              {question.subject !== "anatomy" && <StudyMedia question={question} review={hasImmediateFeedback} />}

              {hasImmediateFeedback && <QuestionSource question={question} />}
              {!isWrittenPractical && !isLocationQuestion(question) && <div className="mode-switch" aria-label="Answer mode">
                <button disabled={hasImmediateFeedback} className={answer.mode === "select" ? "selected" : ""} onClick={() => updateAnswer(question.id, { mode: "select" })}>Choose option</button>
                <button disabled={hasImmediateFeedback} className={answer.mode === "write" ? "selected" : ""} onClick={() => updateAnswer(question.id, { mode: "write" })}>Type my answer</button>
              </div>}

              {isLocationQuestion(question) ? <p className="anatomy-location-instruction">Answer by selecting a location on the image and submitting it. Numbered areas are authored hotspots or masked callouts, not whole-structure segmentation.</p> : answer.mode === "select" ? <div className={`options ${hasImmediateFeedback ? "locked has-explanations" : ""}`}>
                {question.options.map((option) => {
                  const state = hasImmediateFeedback
                    ? option.id === question.correctOptionId ? "correct" : option.id === answer.selectedOptionId ? "wrong" : ""
                    : answer.selectedOptionId === option.id ? "chosen" : "";
                  const inlineExplanation = option.id === question.correctOptionId
                    ? question.explanation
                    : question.distractorExplanations[option.id];
                  return <button key={option.id} className={state} disabled={hasImmediateFeedback} onClick={() => updateAnswer(question.id, { selectedOptionId: option.id })}>
                    <span className="option-letter">{option.id}</span>
                    <span className="option-copy"><b>{option.text}</b>{hasImmediateFeedback && <small className={`option-inline-explanation ${option.id === question.correctOptionId ? "right" : "wrong"}`}><em>{option.id === question.correctOptionId ? "Why this is right" : "Why this is wrong"}</em>{inlineExplanation}</small>}</span>
                  </button>;
                })}
              </div> : isWrittenPractical ? <div className="written-identification">
                <label><span>Write the tissue or marked structure <em>no word bank</em></span><input autoComplete="off" disabled={hasImmediateFeedback} value={answer.writtenAnswer ?? ""} onChange={(event) => updateAnswer(question.id, { writtenAnswer: event.target.value, writtenSubmitted: false })} onKeyDown={(event) => { if (event.key === "Enter") submitWrittenAnswer(question.id); }} placeholder="e.g. sensory ganglion, hyaline cartilage, transitional epithelium…" /></label>
                <button className={hasImmediateFeedback ? "revise-answer" : "primary"} disabled={!hasImmediateFeedback && !answer.writtenAnswer?.trim()} onClick={() => hasImmediateFeedback ? reviseWrittenAnswer(question.id) : submitWrittenAnswer(question.id)}>{hasImmediateFeedback ? "Revise answer" : "Check tissue →"}</button>
              </div> : <div className="written-response">
                <label className="written-label"><span>Your answer</span><textarea className="answer-box" disabled={hasImmediateFeedback} value={answer.writtenAnswer ?? ""} onChange={(event) => updateAnswer(question.id, { writtenAnswer: event.target.value, writtenSubmitted: false })} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submitWrittenAnswer(question.id); }} placeholder="Type the option letter or the answer in your own words…" /></label>
                <button className={hasImmediateFeedback ? "revise-answer" : "primary"} disabled={(!hasImmediateFeedback && !answer.writtenAnswer?.trim()) || (studyMode === "exam" && hasSavedWrittenAnswer)} onClick={() => hasImmediateFeedback ? reviseWrittenAnswer(question.id) : submitWrittenAnswer(question.id)}>{hasImmediateFeedback ? "Revise answer" : studyMode === "exam" && hasSavedWrittenAnswer ? "Saved ✓" : studyMode === "exam" ? "Save answer" : "Check answer →"}</button>
              </div>}

              {hasImmediateFeedback && isWrittenPractical && <section className={`instant-feedback written-feedback ${isCorrect(question, answer) ? "correct" : "wrong"}`} aria-live="polite">
                <div className="instant-feedback-title"><b>{isCorrect(question, answer) ? "✓ Correct identification" : "× Compare and repair"}</b><span>{question.source.title}{question.source.page ? ` · ${question.source.page}` : ""}</span></div>
                <div className="written-match-grid"><div><span>You wrote</span><b>{answer.writtenAnswer}</b></div><div><span>Interpreted as</span><b>{writtenInterpretation?.label ?? "No confident tissue match"}{writtenInterpretation?.autocorrected && writtenInterpretation.label ? " · spelling normalized" : ""}</b></div><div><span>Expected</span><b>{correct?.text ?? question.correctOptionId}</b><small>Also accepted: {(question.acceptedFreeText ?? []).slice(0, 5).join(" · ")}</small></div></div>
                <div className="explanation"><span>{question.media?.length === 1 ? "What confirms it in this field" : "What confirms it across both magnifications"}</span><p>{question.explanation}</p></div>
                <div className="written-lookalikes"><span>High-yield look-alikes from the practical list</span>{question.options.filter((option) => option.id !== question.correctOptionId).map((option) => <p key={option.id} className={option.id === writtenInterpretation?.optionId ? "student-match" : ""}><b>{option.text}</b><small>{question.distractorExplanations[option.id]}</small></p>)}</div>
              </section>}

              {hasImmediateFeedback && !isWrittenPractical && <section className={`instant-feedback ${isCorrect(question, answer) ? "correct" : "wrong"}`} aria-live="polite">
                <div className="instant-feedback-title"><b>{isCorrect(question, answer) ? "✓ Correct" : "× Repair this"}</b><span>{question.source.title}{question.source.page ? ` · ${question.source.page}` : ""}</span></div>
                <div className="answer-comparison"><div><span>Your answer</span><b>{isLocationQuestion(question) ? locationLabel(question, answer.selectedRegionId) ?? chosen?.text ?? "No location recorded" : chosen ? `${chosen.id}. ${chosen.text}` : chosenId}</b></div><div><span>Correct answer</span><b>{correct ? isLocationQuestion(question) ? correct.text : `${correct.id}. ${correct.text}` : question.correctOptionId}</b></div></div>
                <p className="feedback-key-rule"><b>Key explanation:</b> {question.explanation}</p>
                {answer.mode === "write" && <div className="explanation"><span>Why this answer is correct</span><p>{question.explanation}</p></div>}
              </section>}


              <label className="reasoning-label"><span>Reasoning <em>optional · saved for review</em></span><textarea value={answer.reasoning} onChange={(event) => updateAnswer(question.id, { reasoning: event.target.value })} placeholder="Why does this answer win? What clue ruled out the alternatives?" /></label>
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

        {confirmEnd && <div className="modal-backdrop"><div className="end-modal" role="dialog" aria-modal="true"><span className="eyebrow">Finish sprint</span><h2>Ready to save this review?</h2><p>{openedUnansweredCount ? `${openedUnansweredCount} opened but unanswered ${openedUnansweredCount === 1 ? "question" : "questions"} will be saved for repair. ` : ""}{untouchedCount ? `${untouchedCount} untouched ${untouchedCount === 1 ? "question remains" : "questions remain"} unseen and will return with priority.` : "Every question in this sprint was opened."}</p><div><button onClick={() => setConfirmEnd(false)}>Keep working</button><button className="primary" onClick={finishSession}>Grade seen questions</button></div></div></div>}
      </main>
    );
  }

  if (phase === "review") {
    const correctCount = questions.filter((question) => isCorrect(question, answers[question.id])).length;
    const answeredCount = questions.filter((question) => isAnswered(answers[question.id])).length;
    const flaggedCount = questions.filter((question) => answers[question.id]?.flagged).length;
    const visible = questions.filter((question) => reviewFilter === "all" || (reviewFilter === "wrong" ? !isCorrect(question, answers[question.id]) : answers[question.id]?.flagged));
    const score = Math.round((correctCount / questions.length) * 100);
    return <main className="review-shell">
      <header className="review-header"><div className="session-mark"><b>MED//25</b><span>Session review</span></div><button onClick={resetSession}>Return to practice</button></header>
      <section className="review-page">
        <div className="score-hero"><div><span className="eyebrow">{studyMode === "exam" ? isTerm2Exam(exam) ? "Source-based test complete" : "Chapter exam complete" : "Learning sprint complete"}{activeBiochemistryChapterId ? ` · ${biochemistryChapterById(activeBiochemistryChapterId)?.shortTitle}` : ""}</span><h1>{score}%</h1><p>{correctCount} correct out of {questions.length}. Every option now explains the concept it represents, so repair the misses while your reasoning is fresh.</p></div><div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><span>{score}<small>%</small></span></div></div>
        <div className="result-stats"><div><strong>{correctCount}</strong><span>Correct</span></div><div><strong>{questions.length - correctCount}</strong><span>To repair</span></div><div><strong>{questions.length - answeredCount}</strong><span>Unanswered</span></div><div><strong>{flaggedCount}</strong><span>Flagged</span></div></div>
        <WrongAnswerReview exam={exam} attemptId={`practice:${exam}:${sessionStartedAt}`} questions={mcqReviewQuestions(questions)} outcomes={questions.map(q=>({questionId:q.id,answered:isAnswered(answers[q.id]),correct:isCorrect(q,answers[q.id]),topic:q.topic}))}/>
        <div className="review-toolbar"><div className="review-filters">{(["wrong", "flagged", "all"] as const).map((value) => <button key={value} className={reviewFilter === value ? "active" : ""} onClick={() => setReviewFilter(value)}>{value === "wrong" ? `Wrong (${questions.length - correctCount})` : value === "flagged" ? `Flagged (${flaggedCount})` : `All (${questions.length})`}</button>)}</div><div className="review-actions"><button className="primary" onClick={() => void startSession(collection, activeRespiratoryPracticeIds ?? activePracticalPracticeIds ?? activeCoursePracticeIds, { biochemistryChapterId: activeBiochemistryChapterId, respiratoryScopeId: activeRespiratoryScopeId, mode: studyMode, limit: sessionSize })}>New sprint</button></div></div>
        <div className="review-list">
          {!visible.length && <div className="empty-review"><b>Nothing in this view.</b><span>Switch the filter to inspect all answers.</span></div>}
          {visible.map((question) => {
            const answer = answers[question.id];
            const chosenId = selectedOptionId(question, answer);
            const chosen = question.options.find((option) => option.id === chosenId);
            const correct = question.options.find((option) => option.id === question.correctOptionId);
            const isWrittenPractical = isWrittenPracticalQuestion(question);
            const writtenInterpretation = isWrittenPractical ? interpretWrittenAnswer(question, answer) : undefined;
            return <article className={`review-item ${isCorrect(question, answer) ? "correct" : "wrong"}`} key={question.id}>
              <div className="review-item-head"><span>{isCorrect(question, answer) ? "✓ Correct" : "× Repair"}</span><div><small>{question.subject} · {question.topic}</small><button className={answer?.flagged ? "active" : ""} onClick={() => toggleFlag(question.id)}>{answer?.flagged ? "★ Unflag" : "☆ Flag"}</button></div></div>
              <h2>{question.prompt}</h2>
              <StudyMedia question={question} review savedRegionId={answer?.selectedRegionId} />
              <QuestionSource question={question} />
              <div className="answer-comparison"><div><span>Your answer</span><b>{isLocationQuestion(question) ? locationLabel(question, answer?.selectedRegionId) ?? chosen?.text ?? "No location recorded" : answer?.mode === "write" ? answer.writtenAnswer || "No answer" : chosen ? `${chosen.id}. ${chosen.text}` : "No answer"}</b>{writtenInterpretation?.label && <small>Interpreted as {writtenInterpretation.label}</small>}</div><div><span>Correct answer</span><b>{correct ? correct.text : question.correctOptionId}</b></div></div>
              {isLocationQuestion(question) && <p className="feedback-key-rule">{question.explanation}</p>}
              {!isWrittenPractical && !isLocationQuestion(question) && <div className="options locked has-explanations review-inline-options">{question.options.map((option) => <button disabled key={option.id} className={option.id === question.correctOptionId ? "correct" : option.id === chosenId ? "wrong" : ""}>
                <span className="option-letter">{option.id}</span>
                <span className="option-copy"><b>{option.text}</b><small className={`option-inline-explanation ${option.id === question.correctOptionId ? "right" : "wrong"}`}><em>{option.id === question.correctOptionId ? "Why this is right" : "Why this is wrong"}</em>{option.id === question.correctOptionId ? question.explanation : question.distractorExplanations[option.id]}</small></span>
              </button>)}</div>}
              {isWrittenPractical && <><div className="explanation"><span>{question.media?.length === 1 ? "What confirms it in this field" : "What confirms it across the fields"}</span><p>{question.explanation}</p></div><div className="written-lookalikes"><span>High-yield look-alikes</span>{question.options.filter((option) => option.id !== question.correctOptionId).map((option) => <p key={option.id} className={option.id === writtenInterpretation?.optionId ? "student-match" : ""}><b>{option.text}</b><small>{question.distractorExplanations[option.id]}</small></p>)}</div></>}
              {answer?.reasoning && <div className="student-reasoning"><span>Your reasoning</span><p>{answer.reasoning}</p></div>}
            </article>;
          })}
        </div>
      </section>
    </main>;
  }

  const examHistory=sessionArchive.history.filter(s=>s.exam===exam);
  const resumable=sessionArchive.active;
  const term2=isTerm2Exam(exam);
  const collectionChips=selectedConfig.collections.map(id=>({id,label:collectionLabel[id],count:isSavedCollection(id)?savedCount(id):statsReady?selectedExam?.collectionCounts[id]??0:undefined}));
  const resumeAnswered=resumable?Object.values(resumable.answers).filter(isAnswered).length:0;
  const scoreTone=(value:number)=>value>=75?'good':value>=50?'mid':'low';
  return <StudyShell exam={exam} activeSection={tab} onCourseChange={chooseExam} onSectionChange={section=>setTab(section as Tab)} immersive={cvsPaperActive} status={bankStatus==='loading'?'Loading catalog…':bankStatus==='error'?'Offline · cached sessions available':'Saved on this device'} courses={Object.entries(examConfig).map(([id,c])=>({id:id as ExamId,title:c.title,date:c.date,count:bank?.exams?.find(e=>e.id===id)?.questionCount}))}>
    {!cvsPaperActive&&<header className="course-head">
      <div className="course-head-copy"><span className="eyebrow">{term2?'Term 2 exam':'Term 1 exam'} · {selectedConfig.date}</span><h1>{selectedConfig.title}</h1><p>{selectedConfig.focus}</p></div>
      <div className="course-head-side">
        <div className="course-stat"><strong>{displayCount((selectedExam?.questionCount??0).toLocaleString())}</strong><span>practice MCQs</span></div>
        <div className="pill-row">{term2&&<ReviewDownloads key={exam} exam={exam}/>}{tab!=='Past exams'&&<button type="button" className="pill" onClick={()=>setTab('Past exams')}><StudyIcon name="papers"/>Past papers</button>}</div>
      </div>
    </header>}
    {sessionError&&<p role="alert" className="mcq-alert error">{sessionError}</p>}
    {bankStatus==='error'&&<p role="alert" className="mcq-alert">Catalog could not refresh. <button type="button" className="pill small" onClick={()=>void refresh()}>Retry</button></p>}
    {phase==='loading'&&<p role="status" className="mcq-loading">Loading your question set and saving it on this device…</p>}
    {tab==='Practice MCQs'&&<>
      {resumable&&<section className="resume-strip" aria-label="Unfinished session"><StudyIcon name="practice"/><div><b>Unfinished session</b><span>{examConfig[resumable.exam].title} · {resumeAnswered}/{resumable.questionIds.length} answered</span></div><div className="pill-row"><button type="button" className="primary small" disabled={phase==='loading'} onClick={()=>void continueSavedSprint()}>Resume</button><button type="button" className="pill small" onClick={deleteSavedSprint}>Discard</button></div></section>}
      <section className="launch" aria-label="Start a practice session">
        <div className="launch-row"><span className="launch-label">Collection</span><div className="chip-set" role="group" aria-label="Question collection">{collectionChips.map(c=><button key={c.id} type="button" aria-pressed={collection===c.id} disabled={phase==='loading'||c.count===0} onClick={()=>setCollection(c.id)}>{c.label}<b>{c.count===undefined?'…':c.count.toLocaleString()}</b></button>)}</div></div>
        <div className="launch-row">
          <div className="launch-group"><span className="launch-label">Questions</span><div className="seg" role="group" aria-label="Questions per session">{sprintLengths.map(n=><button key={n} type="button" aria-pressed={sessionSize===n} disabled={phase==='loading'} onClick={()=>setSessionSize(n)}>{n}</button>)}</div></div>
          <div className="launch-group"><span className="launch-label">Feedback</span><div className="seg" role="group" aria-label="Feedback timing"><button type="button" aria-pressed={studyMode==='learn'} disabled={phase==='loading'} onClick={()=>setStudyMode('learn')}>Learn · instant</button><button type="button" aria-pressed={studyMode==='exam'} disabled={phase==='loading'} onClick={()=>setStudyMode('exam')}>Test · at the end</button></div></div>
          <button type="button" className="primary launch-start" disabled={phase==='loading'||!bank||!collectionCount} onClick={()=>void startSession(collection,undefined,{mode:studyMode})}>Start practice<StudyIcon name="arrow"/></button>
        </div>
        <p className="launch-hint">{statsReady?collectionCount?`${Math.min(sessionSize,collectionCount)} ${collectionLabel[collection].toLowerCase()} questions · ${unseenCollectionCount} unseen · ${seenCollectionCount} seen before`:'Nothing saved in this collection yet.':'Counting questions…'}</p>
      </section>
      <div className="pill-row quick-row" aria-label="Quick actions">
        <button type="button" className="pill" disabled={!savedCount('wrong')||phase==='loading'} onClick={()=>void startSession('wrong')}><StudyIcon name="practice"/>Review mistakes<b>{displayCount(savedCount('wrong'))}</b></button>
        <button type="button" className="pill" disabled={!savedCount('flagged')||phase==='loading'} onClick={()=>void startSession('flagged')}><StudyIcon name="flag"/>Flagged<b>{displayCount(savedCount('flagged'))}</b></button>
        <button type="button" className="pill" onClick={()=>setTab('Review topics')}><StudyIcon name="layers"/>{term2?'Practise a review section':'Practise a topic'}<StudyIcon name="arrow"/></button>
        {examHistory.length>0&&<button type="button" className="pill" onClick={()=>setTab('Results')}><StudyIcon name="results"/>Results<b>{examHistory.length}</b></button>}
      </div>
    </>}
    {tab==='Review topics'&&(term2?<ReviewTopics key={exam} exam={exam} subjectOf={subjectOf} disabled={phase==='loading'} onPractice={ids=>void startSession('all',ids,{mode:studyMode,limit:sessionSize})}/>:<section className="topic-section"><div className="section-head"><h2>Topics</h2><p>Term 1 keeps its question topics and chapter breakdown. Each opens a session in the current feedback mode.</p></div>{exam==='july29'&&<div className="mcq-topic-grid">{biochemistryChapterProgress.map(ch=><button key={ch.id} type="button" disabled={phase==='loading'} onClick={()=>void startSession('biochemistry',undefined,{biochemistryChapterId:ch.id,mode:studyMode})}><StudyIcon name="book"/><b>{ch.chapterLabel} · {ch.title}</b><span>{ch.questionCount} questions</span></button>)}</div>}<div className="mcq-topic-grid">{selectedExam?.topics?.map(topic=><button key={topic.id} type="button" disabled={phase==='loading'} onClick={()=>void startSession('all',topic.questionIds,{mode:studyMode,limit:sessionSize})}><StudyIcon name="layers"/><b>{topic.title}</b><span>{topic.questionIds.length} questions</span></button>)}</div></section>)}
    {tab==='Past exams'&&<PastExamHub key={exam} exam={exam} onSessionActiveChange={setCvsPaperActive}/>}
    {tab==='Results'&&<section className="results-section"><div className="section-head"><h2>Practice results<span>{examHistory.length} session{examHistory.length===1?'':'s'}</span></h2><p>Saved on this device. Past-paper results stay with each paper.</p></div>{!examHistory.length&&<div className="mcq-empty"><StudyIcon name="results"/><b>No completed sessions yet</b><p>Finish a practice session and its review will appear here.</p></div>}<div className="result-rows">{examHistory.map(saved=>{const score=Math.round(saved.correctCount/Math.max(1,saved.answeredCount)*100);return <article className="result-row" key={saved.id}><span className="result-date">{formatSessionDate(saved.completedAt)}</span><div className="result-copy"><b>{savedScopeLabel(saved)} · {saved.questionIds.length} questions</b><small>{saved.correctCount} correct · {saved.answeredCount} answered · {saved.studyMode==='exam'?'Test mode':'Learn mode'}</small></div><strong className={`score-pill ${scoreTone(score)}`}>{score}%</strong><button type="button" className="pill small" disabled={phase==='loading'} onClick={()=>void openSavedReview(saved)}>Open review<StudyIcon name="arrow"/></button></article>;})}</div></section>}
    </StudyShell>;
}
