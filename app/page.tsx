"use client";
/* eslint-disable @next/next/no-img-element -- question images are streamed from the local study bridge */

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  BiochemistryChapterHub,
  BiochemistryMasteryGrid,
  type BiochemistryChapterProgress,
  type BiochemistryStudyMode,
} from "@/src/components/BiochemistryChapterHub";
import { FinalExam } from "@/src/components/FinalExam";
import { AnatomyImage } from "@/src/components/AnatomyImage";
import { Term2Guide } from "@/src/components/Term2Guide";
import { Term2CourseHub } from "@/src/components/Term2CourseHub";
import { PhysiologyPracticalHub } from "@/src/components/PhysiologyPracticalHub";
import { cleanPracticalIds, practicalCatalog, practicalCaseForQuestion } from "@/src/lib/physiology-practical";
import { PracticalCaseFigure } from '@/src/components/PracticalCaseFigure';
import { RespiratoryConceptHub, RespiratoryConceptFeedback } from "@/src/components/RespiratoryConceptHub";
import { respiratoryConcepts, respiratoryModules, respiratoryScope, respiratoryQuestionIndex } from "@/src/lib/respiratory/concepts";
import { normalizeRespiratoryPractice } from "@/src/lib/respiratory/progress.mjs";
import { LessonGuide } from "@/src/components/LessonGuide";
import { LessonSlide } from "@/src/components/LessonSlide";
import {
  biochemistryChapterById,
  biochemistryChapters,
  isBiochemistryChapterId,
} from "@/src/lib/biochemistry/chapters";
import {
  biochemistryConceptForQuestion,
  biochemistryConceptQuestionPosition,
} from "@/src/lib/biochemistry/concepts";
import { allLessons, histologyPracticalLessons, lessonsForExam } from "@/src/lib/lessons";
import { lessonForQuestion } from "@/src/lib/lessons/types";
import { classifySessionCompletion } from "@/src/lib/mcq/sprint-selection.mjs";
import type { CodexGrade, MCQMedia, MCQQuestion, StudentAnswer } from "@/src/lib/mcq/types";
import { isExamId, isTerm2Exam, term2Exams, type ExamId } from "@/src/lib/mcq/exams.mjs";
import { createEmptyProgress, parseProgress, type StudyProgress } from "@/src/lib/mcq/study-progress.mjs";
import { hasTerm2CourseCatalog, term2CourseCatalog } from "@/src/lib/term2/courses";

const AnatomyTrainer = dynamic(() => import("@/src/components/anatomy3d/AnatomyTrainer"), { ssr: false });
const AnatomyQuestion3D = dynamic(() => import("@/src/components/anatomy3d/AnatomyQuestion"), { ssr: false });

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
    date: string | null;
    title: string;
    questionCount: number;
    finalExamQuestionCount: number;
    finalExamBanks?: Array<{
      id: "telegram-past-papers" | "downloaded-core";
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

const bridgeUrl = process.env.NEXT_PUBLIC_CODEX_BRIDGE_URL
  ?? (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:4111");
const progressStorageKey = "med25-study-progress-v1";
const sessionArchiveStorageKey = "med25-session-archive-v1";
const tabs = ["Overview", "Study concepts", "3D Anatomy", "Final exam", "Topics", "Practical Atlas", "Visual Guide", "Results", "Codex tutor"] as const;
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
  "term2-limbs": { date: "Date TBA", title: "Upper & Lower Limbs", focus: term2Exams[2].scope, collections: ["all", "anatomy", "dynamic-anatomy", "images", "wrong", "flagged"] },
  "term2-biochemistry": { date: "Date TBA", title: "Biochemistry II", focus: term2Exams[3].scope, collections: ["all", "biochemistry", "images", "wrong", "flagged"] },
  "term2-physiology-practical": { date: "Aug 31 · user-reported", title: "Physiology Practical", focus: term2Exams[4].scope, collections: ["all", "images", "wrong", "flagged"] },
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

// Exams that carry an interactive 3D anatomy atlas, mapped to the anatomy3d regions they surface.
const anatomy3dRegions: Partial<Record<ExamId, string[]>> = {
  "term2-respiratory": ["respiratory"],
  "term2-cvs": ["cvs"],
  "term2-limbs": ["upper-limb", "lower-limb"],
};
function examHasAnatomy3d(examId: ExamId): boolean {
  return Object.hasOwn(anatomy3dRegions, examId);
}
function regionsFor(examId: ExamId): string[] {
  return anatomy3dRegions[examId] ?? [];
}
function isTerm2CourseExam(examId: ExamId): boolean {
  return examId === "term2-cvs" || examId === "term2-limbs" || examId === "term2-biochemistry";
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
    ...normalizeRespiratoryPractice(migratedExam, session.respiratoryScopeId, session.respiratoryPracticeIds, respiratoryQuestionIndex),
    practicalPracticeIds: cleanPracticalIds(migratedExam, session.practicalPracticeIds),
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
  return session.respiratoryScopeId ? respiratoryScope(session.respiratoryScopeId)?.title ?? "Selected respiratory concepts"
    : biochemistryChapterById(session.biochemistryChapterId)?.shortTitle ?? collectionLabel[session.collection];
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
  return answer.mode === "select" ? answer.selectedOptionId : writtenOptionId(question, answer);
}

function isAnswered(answer?: SessionAnswer) {
  return Boolean(answer && (answer.mode === "select" ? answer.selectedOptionId : answer.writtenAnswer?.trim() && answer.writtenSubmitted !== false));
}

function isCorrect(question: MCQQuestion, answer?: SessionAnswer) {
  if (answer?.mode === "write" && answer.writtenSubmitted === false) return false;
  return selectedOptionId(question, answer) === question.correctOptionId;
}

function mediaUrl(question: MCQQuestion, mediaId: string) {
  const query = new URLSearchParams({ questionId: question.id, mediaId });
  return `${bridgeUrl}/api/media?${query}`;
}

function StudyImage({ question, media, review = false }: { question: MCQQuestion; media: MCQMedia; review?: boolean }) {
  const practicalCase = practicalCaseForQuestion(question.id);
  if (practicalCase) return <PracticalCaseFigure key={question.id} item={practicalCase} src={mediaUrl(question, media.id)} revealed={review} />;
  if (question.kind === "dynamic_anatomy") return <AnatomyImage key={question.id} question={question} media={media} src={mediaUrl(question, media.id)} revealed={review} />;
  return <figure className={`study-image ${review ? "review-image" : ""}`}>
    <div className="study-image-stage">
      <img src={mediaUrl(question, media.id)} alt={review ? media.alt : "Unlabeled source image for this question"} />
      {!review && media.labelMasks?.map((mask, index) => <span key={index} className="source-label-mask" aria-hidden="true" style={{ left: `${mask.x * 100}%`, top: `${mask.y * 100}%`, width: `${mask.width * 100}%`, height: `${mask.height * 100}%` }} />)}
      {media.annotations?.map((annotation) => <span
        className="study-image-marker"
        key={annotation.id}
        aria-label={`Marker ${annotation.label}`}
        style={{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%`, width: `${annotation.width * 100}%`, height: `${annotation.height * 100}%` }}
      ><i>{annotation.label}</i></span>)}
    </div>
    <figcaption>{review ? [media.caption ?? "Image recognition", media.attribution].filter(Boolean).join(" · ") : media.annotations?.length ? "Structure identification · name marker A" : "Specimen identification · inspect before answering"}</figcaption>
  </figure>;
}

function QuestionSource({ question }: { question: MCQQuestion }) {
  const source = question.source;
  return <p className="question-source"><b>Source</b> {[source.title, source.edition, source.chapter, source.page, source.figure, source.lecture, source.slide ? `Slide ${source.slide}` : null].filter(Boolean).join(" · ")}</p>;
}

function StudyMedia({ question, review = false }: { question: MCQQuestion; review?: boolean }) {
  if (question.kind === "dynamic_anatomy_3d") return <AnatomyQuestion3D question={question} revealed={review} />;
  if (!question.media?.length) return null;
  return <div className={question.media.length > 1 ? "study-image-pair" : "study-image-single"}>{question.media.map((media) => <StudyImage question={question} media={media} review={review} key={media.id} />)}</div>;
}

function BiochemistryConceptFeedback({ questionId }: { questionId: string }) {
  const concept = biochemistryConceptForQuestion(questionId);
  if (!concept) return null;
  const position = biochemistryConceptQuestionPosition(concept, questionId);
  return <section className="question-concept-link" aria-label={`Chapter concept: ${concept.title}`}>
    <div className="question-concept-head"><span>Chapter concept</span><i className={`concept-priority ${concept.priority}`}>{concept.priority.replace("-", " ")}</i>{position && <small>Question {position.current} of {position.total} for this idea</small>}</div>
    <h3>{concept.title}</h3>
    <p>{concept.summary}</p>
    <div className="question-concept-points"><span>Connect this answer back to:</span><ul>{concept.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul></div>
    {concept.clinicalLinks.length > 0 && <p className="question-clinical-link"><b>Why a doctor cares:</b> {concept.clinicalLinks.join(" ")}</p>}
  </section>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [health, setHealth] = useState<BridgeHealth | null>(null);
  const [bank, setBank] = useState<BankSummary | null>(null);
  const [checking, setChecking] = useState(false);
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
  const [grades, setGrades] = useState<Record<string, CodexGrade>>({});
  const [grading, setGrading] = useState<Record<string, boolean>>({});
  const [gradeErrors, setGradeErrors] = useState<Record<string, string>>({});
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
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
    const requestedExam = new URLSearchParams(window.location.search).get("exam");
    if (isExamId(requestedExam)) {
      setExam(requestedExam);
      setCollection(examConfig[requestedExam].collections[0]);
      if (requestedExam === "term2-physiology-practical") { setTab("Study concepts"); setSessionSize(36); }
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
  const selectedConfig = examConfig[exam];
  const selectedCourseCatalog = isTerm2Exam(exam) ? term2CourseCatalog(exam) : undefined;
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
    setExam(nextExam);
    setCollection(examConfig[nextExam].collections[0]);
    setSessionError("");
    setExpandedLessons({});
    setStudyMode("learn");
    setActiveBiochemistryChapterId(undefined);
    setActiveRespiratoryScopeId(undefined);
    setActiveRespiratoryPracticeIds(undefined);
    setActivePracticalPracticeIds(undefined);
    setActiveCoursePracticeIds(undefined);
    if (tab === "Study concepts" && nextExam !== "term2-respiratory" && nextExam !== "term2-physiology-practical" && !(isTerm2Exam(nextExam) && hasTerm2CourseCatalog(nextExam))) setTab("Overview");
    // Keep the 3D Anatomy tab when moving between 3D-anatomy exams; only leave it for exams without one.
    if (tab === "3D Anatomy" && !examHasAnatomy3d(nextExam)) setTab("Overview");
    if (nextExam === "term2-physiology-practical") { setTab("Study concepts"); setSessionSize(36); }
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
    const requestedLimit = options.limit ?? (exactIds ? exactIds.length : sessionSize);
    const nextStudyMode = options.mode ?? "learn";
    setCollection(nextCollection);
    setSessionSize(requestedLimit);
    setStudyMode(nextStudyMode);
    setActiveBiochemistryChapterId(options.biochemistryChapterId);
    setActivePracticalPracticeIds(cleanPracticalIds(exam, exactIds));
    setActiveCoursePracticeIds(isTerm2CourseExam(exam) && exactIds ? cleanIds(exactIds) : undefined);
    const respiratoryPractice = normalizeRespiratoryPractice(exam, options.respiratoryScopeId, exactIds, respiratoryQuestionIndex);
    setActiveRespiratoryScopeId(respiratoryPractice.respiratoryScopeId);
    setActiveRespiratoryPracticeIds(respiratoryPractice.respiratoryPracticeIds);
    if (respiratoryPractice.respiratoryScopeId) setLastRespiratoryScopeId(respiratoryPractice.respiratoryScopeId);
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
      setAnswers(Object.fromEntries(payload.questions.map((question) => [question.id, answerForQuestion(question, undefined, flaggedIds.has(question.id))])));
      setVisitedQuestionIds(payload.questions[0] ? [payload.questions[0].id] : []);
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

  function submitWrittenAnswer(questionId: string) {
    if (!answers[questionId]?.writtenAnswer?.trim()) return;
    updateAnswer(questionId, { writtenSubmitted: true });
    setGrades((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== questionId)));
    setGradeErrors((current) => ({ ...current, [questionId]: "" }));
  }

  function reviseWrittenAnswer(questionId: string) {
    updateAnswer(questionId, { writtenSubmitted: false });
    setGrades((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== questionId)));
    setGradeErrors((current) => ({ ...current, [questionId]: "" }));
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
    if (activeRespiratoryScopeId) setTab("Study concepts");
    if (exam === "term2-physiology-practical") setTab("Study concepts");
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
    setActivePracticalPracticeIds(cleanPracticalIds(saved.exam, saved.practicalPracticeIds));
    setActiveCoursePracticeIds(saved.coursePracticeIds);
    if (saved.respiratoryScopeId) setLastRespiratoryScopeId(saved.respiratoryScopeId);
    try {
      const restoredQuestions = await loadQuestionsByIds(saved.exam, saved.questionIds);
      const restoredIds = new Set(restoredQuestions.map((question) => question.id));
      setQuestions(restoredQuestions);
      setAnswers(Object.fromEntries(restoredQuestions.map((question) => [question.id, answerForQuestion(question, saved.answers[question.id])])));
      setVisitedQuestionIds(saved.visitedQuestionIds.filter((id) => restoredIds.has(id)));
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
    setActivePracticalPracticeIds(cleanPracticalIds(saved.exam, saved.practicalPracticeIds));
    setActiveCoursePracticeIds(saved.coursePracticeIds);
    if (saved.respiratoryScopeId) setLastRespiratoryScopeId(saved.respiratoryScopeId);
    try {
      const restoredQuestions = await loadQuestionsByIds(saved.exam, saved.questionIds);
      setQuestions(restoredQuestions);
      setAnswers(Object.fromEntries(restoredQuestions.map((question) => [question.id, answerForQuestion(question, saved.answers[question.id])])));
      setVisitedQuestionIds(restoredQuestions.map((question) => question.id));
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
    const answer = answers[question.id] ?? answerForQuestion(question);
    const chosenId = selectedOptionId(question, answer);
    const chosen = question.options.find((option) => option.id === chosenId);
    const correct = question.options.find((option) => option.id === question.correctOptionId);
    const isWrittenPractical = isWrittenPracticalQuestion(question);
    const hasAnswer = answer.mode === "select" ? Boolean(answer.selectedOptionId) : answer.writtenSubmitted === true;
    const hasImmediateFeedback = studyMode === "learn" && hasAnswer;
    const hasSavedWrittenAnswer = answer.mode === "write" && answer.writtenSubmitted === true;
    const activeChapter = biochemistryChapterById(activeBiochemistryChapterId);
    const sessionLabel = activeRespiratoryScopeId ? respiratoryScope(activeRespiratoryScopeId)?.title ?? "Selected respiratory concepts" : activeChapter ? `${activeChapter.chapterLabel} · ${activeChapter.shortTitle}` : collectionLabel[collection];
    const writtenInterpretation = answer.mode === "write" ? interpretWrittenAnswer(question, answer) : undefined;
    const grade = grades[question.id];
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
              <h1>{question.prompt}</h1>
              <StudyMedia question={question} review={hasImmediateFeedback} />

              {hasImmediateFeedback && <QuestionSource question={question} />}
              {!isWrittenPractical && <div className="mode-switch" aria-label="Answer mode">
                <button disabled={hasImmediateFeedback} className={answer.mode === "select" ? "selected" : ""} onClick={() => updateAnswer(question.id, { mode: "select" })}>Choose option</button>
                <button disabled={hasImmediateFeedback} className={answer.mode === "write" ? "selected" : ""} onClick={() => updateAnswer(question.id, { mode: "write" })}>Type my answer</button>
              </div>}

              {answer.mode === "select" ? <div className={`options ${hasImmediateFeedback ? "locked has-explanations" : ""}`}>
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
                <div className="tutor-review immediate-tutor">
                  {!grade && <button disabled={grading[question.id] || !health?.codex.available} onClick={() => void requestCodexGrade(question)}>{grading[question.id] ? "Codex is comparing the fields…" : health?.codex.available ? "Ask Codex: why my tissue differs →" : "Codex comparison unavailable"}</button>}
                  {gradeErrors[question.id] && <p className="tutor-error">{gradeErrors[question.id]} Deterministic tissue grading remains available.</p>}
                  {grade && <div className="tutor-result"><span>CODEX MICROSCOPE COMPARISON · {grade.verdict}</span><p>{grade.teachingNote}</p>{grade.whyCorrectAnswerWins && <p><b>Decisive clue:</b> {grade.whyCorrectAnswerWins}</p>}{grade.misconception && <p><b>Repair:</b> {grade.misconception}</p>}<blockquote>{grade.reflectionQuestion}</blockquote></div>}
                </div>
              </section>}

              {hasImmediateFeedback && !isWrittenPractical && <section className={`instant-feedback ${isCorrect(question, answer) ? "correct" : "wrong"}`} aria-live="polite">
                <div className="instant-feedback-title"><b>{isCorrect(question, answer) ? "✓ Correct" : "× Repair this"}</b><span>{question.source.title}{question.source.page ? ` · ${question.source.page}` : ""}</span></div>
                <div className="answer-comparison"><div><span>Your answer</span><b>{chosen ? `${chosen.id}. ${chosen.text}` : chosenId}</b></div><div><span>Correct answer</span><b>{correct ? `${correct.id}. ${correct.text}` : question.correctOptionId}</b></div></div>
                <p className="feedback-key-rule"><b>Fast rule:</b> Read the green option as the key concept, then compare each red/neutral option with the chapter checkpoint it actually describes.</p>
                {answer.mode === "write" && <div className="explanation"><span>Why this answer is correct</span><p>{question.explanation}</p></div>}
              </section>}

              {hasImmediateFeedback && question.subject === "biochemistry" && <BiochemistryConceptFeedback questionId={question.id} />}
              {hasImmediateFeedback && exam === "term2-respiratory" && <RespiratoryConceptFeedback questionId={question.id} />}

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
    const missedIds = questions.filter((question) => !isCorrect(question, answers[question.id])).map((question) => question.id);
    const visible = questions.filter((question) => reviewFilter === "all" || (reviewFilter === "wrong" ? !isCorrect(question, answers[question.id]) : answers[question.id]?.flagged));
    const score = Math.round((correctCount / questions.length) * 100);
    return <main className="review-shell">
      <header className="review-header"><div className="session-mark"><b>MED//25</b><span>Session review{activeRespiratoryScopeId ? ` · ${respiratoryScope(activeRespiratoryScopeId)?.title ?? "Selected concepts"}` : ""}</span></div><button onClick={resetSession}>{activeRespiratoryScopeId ? "Return to study concepts" : "Return to dashboard"}</button></header>
      <section className="review-page">
        <div className="score-hero"><div><span className="eyebrow">{studyMode === "exam" ? isTerm2Exam(exam) ? "Source-based test complete" : "Chapter exam complete" : "Learning sprint complete"}{activeBiochemistryChapterId ? ` · ${biochemistryChapterById(activeBiochemistryChapterId)?.shortTitle}` : ""}</span><h1>{score}%</h1><p>{correctCount} correct out of {questions.length}. Every option now explains the concept it represents, so repair the misses while your reasoning is fresh.</p></div><div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><span>{score}<small>%</small></span></div></div>
        <div className="result-stats"><div><strong>{correctCount}</strong><span>Correct</span></div><div><strong>{questions.length - correctCount}</strong><span>To repair</span></div><div><strong>{questions.length - answeredCount}</strong><span>Unanswered</span></div><div><strong>{flaggedCount}</strong><span>Flagged</span></div></div>
        <div className="review-toolbar"><div className="review-filters">{(["wrong", "flagged", "all"] as const).map((value) => <button key={value} className={reviewFilter === value ? "active" : ""} onClick={() => setReviewFilter(value)}>{value === "wrong" ? `Wrong (${questions.length - correctCount})` : value === "flagged" ? `Flagged (${flaggedCount})` : `All (${questions.length})`}</button>)}</div><div className="review-actions">{missedIds.length > 0 && <button className="retry-button" onClick={() => void startSession("wrong", missedIds, { biochemistryChapterId: activeBiochemistryChapterId, respiratoryScopeId: activeRespiratoryScopeId, mode: "learn", limit: missedIds.length })}>Retry these {missedIds.length}</button>}<button className="primary" onClick={() => void startSession(collection, activeRespiratoryPracticeIds ?? activePracticalPracticeIds ?? activeCoursePracticeIds, { biochemistryChapterId: activeBiochemistryChapterId, respiratoryScopeId: activeRespiratoryScopeId, mode: studyMode, limit: sessionSize })}>New sprint</button></div></div>
        <div className="review-list">
          {!visible.length && <div className="empty-review"><b>Nothing in this view.</b><span>Switch the filter to inspect all answers.</span></div>}
          {visible.map((question) => {
            const answer = answers[question.id];
            const chosenId = selectedOptionId(question, answer);
            const chosen = question.options.find((option) => option.id === chosenId);
            const correct = question.options.find((option) => option.id === question.correctOptionId);
            const grade = grades[question.id];
            const linkedLesson = lessonForQuestion(question, exam, allLessons);
            const isWrittenPractical = isWrittenPracticalQuestion(question);
            const writtenInterpretation = isWrittenPractical ? interpretWrittenAnswer(question, answer) : undefined;
            return <article className={`review-item ${isCorrect(question, answer) ? "correct" : "wrong"}`} key={question.id}>
              <div className="review-item-head"><span>{isCorrect(question, answer) ? "✓ Correct" : "× Repair"}</span><div><small>{question.subject} · {question.topic}</small><button className={answer?.flagged ? "active" : ""} onClick={() => toggleFlag(question.id)}>{answer?.flagged ? "★ Unflag" : "☆ Flag"}</button></div></div>
              <h2>{question.prompt}</h2>
              <StudyMedia question={question} review />
              <QuestionSource question={question} />
              <div className="answer-comparison"><div><span>Your answer</span><b>{answer?.mode === "write" ? answer.writtenAnswer || "No answer" : chosen ? `${chosen.id}. ${chosen.text}` : "No answer"}</b>{writtenInterpretation?.label && <small>Interpreted as {writtenInterpretation.label}</small>}</div><div><span>Correct answer</span><b>{correct ? correct.text : question.correctOptionId}</b></div></div>
              {!isWrittenPractical && <div className="options locked has-explanations review-inline-options">{question.options.map((option) => <button disabled key={option.id} className={option.id === question.correctOptionId ? "correct" : option.id === chosenId ? "wrong" : ""}>
                <span className="option-letter">{option.id}</span>
                <span className="option-copy"><b>{option.text}</b><small className={`option-inline-explanation ${option.id === question.correctOptionId ? "right" : "wrong"}`}><em>{option.id === question.correctOptionId ? "Why this is right" : "Why this is wrong"}</em>{option.id === question.correctOptionId ? question.explanation : question.distractorExplanations[option.id]}</small></span>
              </button>)}</div>}
              {isWrittenPractical && <><div className="explanation"><span>{question.media?.length === 1 ? "What confirms it in this field" : "What confirms it across the fields"}</span><p>{question.explanation}</p></div><div className="written-lookalikes"><span>High-yield look-alikes</span>{question.options.filter((option) => option.id !== question.correctOptionId).map((option) => <p key={option.id} className={option.id === writtenInterpretation?.optionId ? "student-match" : ""}><b>{option.text}</b><small>{question.distractorExplanations[option.id]}</small></p>)}</div></>}
              {question.subject === "biochemistry" && <BiochemistryConceptFeedback questionId={question.id} />}
              {exam === "term2-respiratory" && <RespiratoryConceptFeedback questionId={question.id} />}
              {answer?.reasoning && <div className="student-reasoning"><span>Your reasoning</span><p>{answer.reasoning}</p></div>}
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
    { id: "wrong", title: "Wrong answers", detail: "Incorrect and opened-unanswered questions stay here until corrected.", count: savedCount("wrong") },
    { id: "flagged", title: "Flagged", detail: "Manual flags stay saved until you remove them.", count: savedCount("flagged") },
  ];
  const topicCards: Array<{ id: CollectionId; title: string; scope: string; detail: string; count: number }> = exam === "term2-cvs" ? [
    { id: "anatomy", title: "Cardiovascular anatomy", scope: "Local thorax/heart decks + Gray’s", detail: "Thoracic wall, mediastinum, heart, great vessels and autonomic pathways", count: examCount("anatomy") },
    { id: "histology", title: "Circulatory histology", scope: "Local lecture material + Junqueira", detail: "Heart, vessel classes, microcirculation and lymphatic/immune structures in the confirmed source set", count: examCount("histology") },
    { id: "embryology", title: "Cardiovascular development", scope: "Local transcripts + Langman", detail: "Heart tube, looping, septation, arch derivatives, fetal circulation and source-confirmed defects", count: examCount("embryology") },
    { id: "physiology", title: "Cardiovascular physiology", scope: "Local lecture pack + Guyton", detail: "Cardiac mechanics, excitation, ECG, haemodynamics and integrated circulation", count: examCount("physiology") },
    { id: "dynamic-anatomy", title: "Interactive 3D CVS", scope: `${selectedExam?.interactive3dCount ?? 0} highlighted 3D questions`, detail: "Rotate the model before answering; labels and free exploration unlock after feedback.", count: examCount("dynamic-anatomy") },
    { id: "images", title: "CVS image questions", scope: "Course figures and source diagrams", detail: "Only locally supported visual cases; answer-bearing labels stay gated.", count: examCount("images") },
  ] : exam === "term2-limbs" ? [
    { id: "anatomy", title: "Upper & lower limb anatomy", scope: "Local carryover material + Gray’s", detail: "Bones, compartments, muscles, joints, vessels, nerves and clinical relationships", count: examCount("anatomy") },
    { id: "dynamic-anatomy", title: "Interactive 3D limbs", scope: `${selectedExam?.interactive3dCount ?? 0} highlighted 3D questions`, detail: "Right upper-limb and left lower-limb models with answer-gated labels and exploration.", count: examCount("dynamic-anatomy") },
    { id: "images", title: "Limb image questions", scope: "Verified local visual material", detail: "Spotters and applied anatomy only where a source image is available and attributable.", count: examCount("images") },
  ] : exam === "term2-biochemistry" ? [
    { id: "biochemistry", title: "Biochemistry II", scope: "Reconciled Lippincott + local metabolism material", detail: "Only concepts supported by the Term 2 source set, with exclusions kept visible.", count: examCount("biochemistry") },
    { id: "images", title: "Pathway and data questions", scope: "Local figures and diagrams", detail: "Interpretation questions use answer-gated source figures when the local material supports them.", count: examCount("images") },
  ] : isTerm2Exam(exam) ? exam === "term2-respiratory" ? [
    { id: "anatomy", title: "Respiratory anatomy", scope: "Gray’s 3e + 11 local decks", detail: "Nasal cavity, larynx, trachea, lungs, pleura and thoracic relationships", count: examCount("anatomy") },
    { id: "histology", title: "Respiratory histology", scope: "Junqueira 16e · Chapter 17", detail: "Conducting airways, respiratory zone, cells and source micrographs", count: examCount("histology") },
    { id: "embryology", title: "Lung development", scope: "Langman 15e · Chapter 14 + E1/E2", detail: "Respiratory diverticulum, airway branching, maturation and congenital defects", count: examCount("embryology") },
    { id: "physiology", title: "Respiratory physiology", scope: "Guyton 15e · Chapters 38–42", detail: "Ventilation, pulmonary circulation, gas exchange and transport, control of breathing · book-only", count: examCount("physiology") },
    { id: "dynamic-anatomy", title: "Dynamic anatomy lab", scope: `${selectedExam?.dynamicImageCount ?? 0} source diagrams + ${selectedExam?.interactive3dCount ?? 0} 3D questions`, detail: "Different targets on images and rotatable models. Labels unlock only after feedback.", count: examCount("dynamic-anatomy") },
    { id: "images", title: "All visual questions", scope: "Source diagrams + micrographs", detail: "Mix anatomy targets with respiratory histology identification", count: examCount("images") },
  ] : [] : exam === "july25" ? [
    { id: "histology", title: "Histology I", scope: "Core tissues + reproductive", detail: "Cells, basic tissues, skin, ovary, uterus and male reproductive histology", count: examCount("histology") },
    { id: "embryology", title: "Embryology", scope: "General embryology + teratology", detail: "Gametogenesis through weeks 1–8, fetal period, placenta and congenital malformations", count: examCount("embryology") },
    { id: "physiology", title: "Guyton Chapters 1–8", scope: "Confirmed July 25 physiology", detail: "Homeostasis, cell physiology, transport, potentials, skeletal and smooth muscle, NMJ and synapses", count: examCount("physiology") },
    { id: "stains", title: "Stains", scope: "Dedicated recall", detail: "Target, color, preparation and exclusions", count: examCount("stains") },
    { id: "images", title: "Image recognition", scope: "Exam-specific", detail: "Histology fields and embryo diagrams", count: examCount("images") },
    { id: "practical", title: "Practical + spotters", scope: "Still theory-relevant", detail: "Methods, stains, slides and recognition questions kept in the exam bank", count: examCount("practical") },
  ] : exam === "aug22" ? [
    { id: "histo-transfer", title: "110+ field unfamiliar-slide transfer lab", scope: `${examCount("histo-transfer")} written drills`, detail: "Licensed internet micrographs across joint classes, cartilage, bone maturity, ganglion/nerve/fat, tendon/ligament, muscle, skin and high-yield epithelia", count: examCount("histo-transfer") },
    { id: "histo-identification", title: "15-slide written microscope identification", scope: `${examCount("histo-identification")} written drills`, detail: "Paired wide/close fields, typed tissue names, tolerant spelling correction, marked parts and priority look-alike comparisons", count: examCount("histo-identification") },
    { id: "histo-practical", title: "55-specimen practical bank", scope: `${examCount("histo-practical")} microscope questions`, detail: "Full deck: epithelium, connective tissue, blood, muscle, nerve, digestive, endocrine, urinary, vessels and lymphoid organs", count: examCount("histo-practical") },
  ] : [
    { id: "biochemistry", title: "Mixed biochemistry", scope: "All available chapters", detail: "A shuffled comprehensive sprint after you have worked through the chapter map above", count: examCount("biochemistry") },
    { id: "histology", title: "Cell + Intro Histology", scope: "Mandatory safety block", detail: "Methods, stains, membranes, organelles, cytoskeleton, nucleus, cell cycle and death", count: examCount("histology") },
    { id: "physiology", title: "Membrane physiology", scope: "Guyton + teacher slides", detail: "Homeostasis, transport, resting voltage and action potentials", count: examCount("physiology") },
    { id: "images", title: "Image recognition", scope: "Exam-specific", detail: "Cell, molecular and laboratory figures", count: examCount("images") },
    { id: "practical", title: "Practical + spotters", scope: "Still theory-relevant", detail: "Equipment, carbohydrate tests, titration and image analysis", count: examCount("practical") },
  ];

  if (tab === "3D Anatomy" && examHasAnatomy3d(exam)) {
    return (
      <main className="anatomy3d-immersive">
        <button type="button" className="anatomy3d-exit" onClick={() => setTab("Overview")}>
          <span aria-hidden="true">←</span> Back to study
        </button>
        <AnatomyTrainer regions={regionsFor(exam)} />
      </main>
    );
  }

  const examSwitcher = <div className="exam-switcher-shell"><div className="term-switcher" aria-label="Choose term"><button className={!isTerm2Exam(exam) ? "active" : ""} aria-pressed={!isTerm2Exam(exam)} onClick={() => chooseExam("july25")}>Term 1</button><button className={isTerm2Exam(exam) ? "active" : ""} aria-pressed={isTerm2Exam(exam)} onClick={() => chooseExam("term2-respiratory")}>Term 2</button></div><div className={`exam-switcher ${isTerm2Exam(exam) ? "term2-exams" : ""}`} aria-label="Choose exam">
    {(Object.keys(examConfig) as ExamId[]).filter((value) => isTerm2Exam(value) === isTerm2Exam(exam)).map((value) => {
      const item = examConfig[value];
      const summary = bank?.exams?.find((candidate) => candidate.id === value);
      return <button key={value} className={exam === value ? "active" : ""} onClick={() => chooseExam(value)} aria-pressed={exam === value}>
        <span>{item.date}</span><b>{item.title}</b><small>{isTerm2Exam(value) ? summary?.questionCount ? `${summary.questionCount} source-based questions` : "Section ready · bank planned" : value === "aug22" ? `${summary?.questionCount ?? "—"} practical questions` : tab === "Final exam" ? value === "july29" ? `${summary?.finalExamBanks?.length ?? "—"} final banks` : `${summary?.finalExamQuestionCount ?? "—"} past-paper questions` : `${summary?.questionCount ?? "—"} focused questions`}</small>
      </button>;
    })}
  </div></div>;

  const metricCards = exam === "term2-physiology-practical" ? [
    ["PRACTICAL MCQs", selectedExam?.questionCount ?? "—", "Local pack + checked corrections"],
    ["STATIONS", practicalCatalog.totals.stations, "Technique, reasoning and calculations"],
    ["THEORY SETS", practicalCatalog.totals.theorySets, `${practicalCatalog.totals.newQuestions} new source-linked MCQs`],
    ["FIGURES", practicalCatalog.totals.images, "Original course visuals"],
    ["VIDEO LINKS", practicalCatalog.totals.videos, "YouTube demonstrations"],
    ["TO REPAIR", savedCount("wrong"), "Saved for this exam"],
  ] : isTerm2Exam(exam) ? [
    ["STUDY BANK", selectedExam?.questionCount ?? "—", "Slides, books and verified media"],
    ["ANATOMY", examCount("anatomy"), "Text + image targets"],
    ["HISTOLOGY", examCount("histology"), "Junqueira + micrographs"],
    ["EMBRYOLOGY", examCount("embryology"), "Langman + E1/E2"],
    ["PHYSIOLOGY", examCount("physiology"), "Guyton · book-only"],
    ["INTERACTIVE 3D", selectedExam?.interactive3dCount ?? 0, "Rotate first · labels after answering"],
    ["SOURCE IMAGES", selectedExam?.imageQuestionCount ?? 0, "Annotations after answering"],
    ["TO REPAIR", savedCount("wrong"), "Saved for this exam"],
  ] : exam === "july25" ? [
    ["FOCUSED BANK", selectedExam?.questionCount ?? "—", "This exam only"],
    ["HISTOLOGY", examCount("histology"), "Junqueira + lectures"],
    ["EMBRYOLOGY", examCount("embryology"), "General + images"],
    ["GUYTON 1–8", examCount("physiology"), "Complete chapter set"],
    ["VISUAL LESSONS", lessonsForExam(exam).length, "Core reference guide"],
    ["WRONG", savedCount("wrong"), "Saved for repair"],
    ["FLAGGED", savedCount("flagged"), "Manual review list"],
  ] : exam === "aug22" ? [
    ["PRACTICAL BANK", selectedExam?.questionCount ?? "—", "This exam only"],
    ["TRANSFER FIELDS", examCount("histo-transfer"), "112 internet + 2 textbook"],
    ["15-SLIDE IDENTIFICATION", examCount("histo-identification"), "Specimen + structure ID"],
    ["FULL ATLAS", examCount("histo-practical"), "55-specimen bank"],
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

  function startChapterRepair(chapterId: string, chapterQuestionIds: string[]) {
    const repairSet = new Set([...examProgress.wrongIds, ...examProgress.flaggedIds]);
    const repairIds = chapterQuestionIds.filter((id) => repairSet.has(id));
    if (!repairIds.length) return;
    void startSession("wrong", repairIds, { biochemistryChapterId: chapterId, mode: "learn", limit: repairIds.length });
  }

  return (
    <main className="setup-shell">
      <aside className="setup-sidebar">
        <div className="brand"><span>MED//25</span><small>Term 1 + Term 2</small><small>July 25 · Aug 22 · Aug 25</small></div>
        <nav className="setup-nav" aria-label="Application sections">{tabs.filter((item) => {
          if (item === "3D Anatomy") return examHasAnatomy3d(exam);
          if (item === "Study concepts") return exam === "term2-respiratory" || exam === "term2-physiology-practical" || Boolean(selectedCourseCatalog);
          return true;
        }).map((item) => <button key={item} className={`${tab === item ? "active" : ""} ${item === "Final exam" ? "final-tab" : ""}`} onClick={() => setTab(item)}>{isTerm2Exam(exam) && item === "Final exam" ? "Past exams" : exam === "term2-physiology-practical" ? item === "Study concepts" ? "Practical lessons" : item === "Practical Atlas" ? "Figures & videos" : item : item}</button>)}</nav>
        <div className="session-rule"><span>SESSION RULE</span><b>Tabs disappear during MCQs</b><p>Once the sprint starts, only the question, progress, answer controls and end-session action remain.</p></div>
      </aside>

      <section className="setup-workspace">
        <header className="setup-topbar"><span className="topbar-label">Exam engine</span><div className="header-exam-switcher">{examSwitcher}</div><span className={health?.ok ? "connection good" : "connection waiting"}>● {health?.ok ? (health.codex.available ? "Codex ready" : "Study engine ready") : "Study engine offline"}</span></header>
        <section className={`setup-content ${isTerm2Exam(exam) ? "term2-view" : ""} ${tab === "Overview" ? "overview-view" : ""} ${tab === "Final exam" ? "final-exam-view" : ""} ${tab === "Topics" ? "topics-view" : ""} ${tab === "Practical Atlas" || tab === "Visual Guide" ? "lesson-guide-view" : ""} ${tab === "Practical Atlas" ? "practical-atlas-view" : ""} ${tab === "Results" ? "results-view" : ""}`}>
          {exam === "term2-physiology-practical" && ["Study concepts", "Practical Atlas", "Topics", "Visual Guide"].includes(tab) && <>
            <PhysiologyPracticalHub key={tab} initialPanel={tab === "Practical Atlas" ? "watch" : tab === "Topics" ? "recall" : "questions"}
              attemptedIds={cleanIds(sessionArchive.history.filter((session) => session.exam === exam).flatMap((session) => session.questionIds.filter((id) => isAnswered(session.answers[id]))))}
              repairIds={cleanIds([...examProgress.wrongIds, ...examProgress.flaggedIds])}
              disabled={phase === "loading" || !selectedExam?.questionCount}
              onPractice={(ids, mode, limit) => void startSession("all", ids, { mode, limit })} />
            {phase === "loading" && <p role="status">Preparing practical questions…</p>}
            {sessionError && <p role="alert" className="session-error">{sessionError}</p>}
          </>}
          {tab === "Study concepts" && exam === "term2-respiratory" && <>
            <RespiratoryConceptHub
              initialScopeId={lastRespiratoryScopeId}
              attemptedIds={cleanIds(sessionArchive.history.filter((session) => session.exam === "term2-respiratory").flatMap((session) => session.questionIds.filter((id) => isAnswered(session.answers[id]))))}
              repairIds={cleanIds([...examProgress.wrongIds, ...examProgress.flaggedIds])}
              disabled={phase === "loading" || !selectedExam?.questionCount}
              onPractice={(scopeId, ids, mode, limit) => void startSession(respiratoryScope(scopeId)?.subject ?? "all", ids, { respiratoryScopeId: scopeId, mode, limit })}
            />
            {phase === "loading" && <p role="status" className="resp-session-alert">Preparing your concept practice…</p>}
            {sessionError && <p role="alert" className="session-error resp-session-alert">{sessionError}</p>}
          </>}
          {tab === "Study concepts" && selectedCourseCatalog && <Term2CourseHub
            catalog={selectedCourseCatalog}
            attemptedIds={[...seenQuestionIds]}
            repairIds={cleanIds([...examProgress.wrongIds, ...examProgress.flaggedIds])}
            disabled={phase === "loading"}
            onPractice={(ids, mode, limit) => void startSession("all", ids, { mode, limit })}
          />}
          {tab === "Overview" && <>
            <p className="eyebrow">{isTerm2Exam(exam) ? "Term 2 exam" : "Priority exam"} · {selectedConfig.date}</p><h1>{selectedConfig.title}</h1>
            <p className="lede">{selectedConfig.focus}. Every sprint and topic below is restricted to this exam.</p>
            {isTerm2Exam(exam) && <Term2Guide exam={exam} compact />}
            {exam === "term2-physiology-practical" && <button className="resp-overview-entry" onClick={() => setTab("Study concepts")}><span><b>Practise the slide theory, station by station</b><small>{practicalCatalog.totals.questions} MCQs · {practicalCatalog.totals.theorySets} focused theory sets · {practicalCatalog.totals.imageQuestions} image questions · {practicalCatalog.totals.videos} demonstrations</small></span><strong>Open question sets →</strong></button>}
            {exam === "term2-respiratory" && <button className="resp-overview-entry" onClick={() => setTab("Study concepts")}><span><b>Start with the theory</b><small>{respiratoryConcepts.length} concepts · {respiratoryModules.length} reading modules · recall prompts, linked MCQs and a source audit</small></span><strong>Open study concepts →</strong></button>}
            {selectedCourseCatalog && <button className="resp-overview-entry" onClick={() => setTab("Study concepts")}><span><b>Study the reconciled curriculum first</b><small>{selectedCourseCatalog.modules.length} modules · {new Set(selectedCourseCatalog.modules.flatMap((module) => module.questionIds)).size} linked MCQs · retrieval prompts and visible source boundaries</small></span><strong>Open study concepts →</strong></button>}
            <div className="metric-grid">{metricCards.map(([label, value, detail]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div>
            {resumableSession ? <div className="resume-sprint"><div><span>UNFINISHED {resumableSession.studyMode === "exam" ? "EXAM" : "SPRINT"} SAVED</span><h2>{examConfig[resumableSession.exam].title} · {savedScopeLabel(resumableSession)}</h2><p>{resumableAnsweredCount} of {resumableSession.questionIds.length} answered · last position question {resumableSession.questionIndex + 1}</p></div><div><button className="primary" disabled={resumingSession} onClick={() => void continueSavedSprint()}>{resumingSession ? "Restoring…" : "Continue sprint →"}</button><button className="delete-sprint" onClick={deleteSavedSprint}>Delete unfinished sprint</button></div></div> : <div className="sprint-builder"><div><span className="builder-label">Collection</span><div className="choice-row collection-row">{selectedConfig.collections.map((value) => <button key={value} className={collection === value ? "active" : ""} onClick={() => setCollection(value)}>{collectionLabel[value]}</button>)}</div></div><div><span className="builder-label">Sprint length</span><div className="choice-row length-row">{sprintLengths.map((value) => <button key={value} className={sessionSize === value ? "active" : ""} onClick={() => setSessionSize(value)}>{value}</button>)}</div></div><div className="builder-summary"><div className="builder-coverage"><article><span>Total</span><strong>{collectionCount}</strong></article><article><span>Seen</span><strong>{seenCollectionCount}</strong></article><article><span>Unseen</span><strong>{unseenCollectionCount}</strong></article></div><span>Up to {Math.min(sessionSize, collectionCount)} questions · repair → unseen → mastered</span><button className="primary start-sprint" disabled={!collectionCount || phase === "loading"} onClick={() => void startSession()}>{phase === "loading" ? "Loading sprint…" : `Start ${examLabel} sprint →`}</button><button className="clear-progress" disabled={!savedCount("wrong") && !savedCount("flagged")} onClick={clearSavedProgress}>Clear {examLabel} saved progress</button></div></div>}
            {sessionError && <p className="session-error">{sessionError}</p>}
          </>}

          {tab === "Final exam" && (exam === "july25" || exam === "july29") && <FinalExam key={exam} exam={exam} bridgeUrl={bridgeUrl} />}
          {tab === "Final exam" && isTerm2Exam(exam) && <section className="term2-mock"><p className="eyebrow">Term 2 · Past exams only</p><h1>No verified {selectedConfig.title} past-paper bank yet.</h1><p className="lede">This section is deliberately empty. Book-, slide-, transcript-, image-, and 3D-derived questions remain in learning and topic practice and are never presented as past-exam questions.</p><p>When you add genuine past papers later, they will be imported here with their original provenance and kept separate from the source-based study bank.</p><button onClick={() => setTab("Overview")}>Return to source-based practice →</button></section>}
          {tab === "Final exam" && exam === "aug22" && <div className="practical-atlas-empty"><span className="eyebrow">Aug 22 microscope practical</span><h1>Use one of the focused practical modes.</h1><p>The 15-slide collection mirrors the teacher list, the 110+ transfer lab tests unfamiliar internet fields, and the full atlas adds the broader 55-specimen bank and visual lessons. Open Overview, Topics, or Practical Atlas to choose.</p></div>}

          {tab === "Topics" && exam !== "term2-physiology-practical" && <>
            <p className="eyebrow">{selectedConfig.date} collections</p><h1>{exam === "july29" ? "Choose a biochemistry chapter." : "Choose a focused collection."}</h1><p className="lede">Only {selectedConfig.title} material appears here. Topic controls vanish as soon as the first MCQ opens.</p>
            <div className="saved-review-grid">{savedReviewCards.map((item) => <button key={item.id} disabled={!item.count} onClick={() => void startSession(item.id)}><strong>{item.count}</strong><span><b>{item.title}</b><small>{item.detail}</small></span><i>{item.count ? "Start →" : "Empty"}</i></button>)}</div>
            {exam === "july29" && <BiochemistryChapterHub chapters={biochemistryChapterProgress} loading={phase === "loading"} onStart={(chapterId, mode, length) => void startSession("biochemistry", undefined, { biochemistryChapterId: chapterId, mode, limit: length })} />}
            <div className={`topic-grid ${exam === "july29" ? "secondary-topic-grid" : ""}`}>{topicCards.map((item) => <article key={item.id}><span>{item.count} QUESTIONS</span><h2>{item.title}</h2><b>{item.scope}</b><p>{item.detail}</p><button disabled={!item.count} onClick={() => void startSession(item.id)}>{item.count ? "Start focused sprint →" : "Being assembled"}</button></article>)}</div>
            {sessionError && <p className="session-error">{sessionError}</p>}
          </>}

          {tab === "Practical Atlas" && exam === "aug22" && <div className="practical-atlas-shell">
            <div className="practical-atlas-actions">
              <div className="practical-atlas-head identification-head"><div><span>TRANSFER LAB · 100+ UNFAMILIAR FIELDS</span><b>Write the tissue yourself across different stains, species and magnifications; repair the closest high-yield look-alikes after each answer.</b></div><button className="primary" disabled={!examCount("histo-transfer")} onClick={() => void startSession("histo-transfer", selectedExam?.collectionQuestionIds?.["histo-transfer"] ?? [])}>Write all {examCount("histo-transfer")} →</button></div>
              <div className="practical-atlas-head identification-head"><div><span>EXAM MODE · CONFIRMED 15 SLIDES</span><b>Write the answer yourself from paired wide/close fields; then compare the decisive morphology.</b></div><button className="primary" disabled={!examCount("histo-identification")} onClick={() => void startSession("histo-identification", selectedExam?.collectionQuestionIds?.["histo-identification"] ?? [])}>Write all {examCount("histo-identification")} →</button></div>
              <div className="practical-atlas-head"><div><span>SUPPLEMENT · 55-SPECIMEN ATLAS</span><b>Broader transfer practice, cell recognition and closest-slide discrimination.</b></div><button className="primary" disabled={!examCount("histo-practical")} onClick={() => void startSession("histo-practical", selectedExam?.collectionQuestionIds?.["histo-practical"] ?? [])}>Test all {examCount("histo-practical")} →</button></div>
            </div>
            <LessonGuide exam="aug22" lessons={histologyPracticalLessons} onStartLesson={(lesson) => void startSession("histo-practical", (selectedExam?.collectionQuestionIds?.["histo-practical"] ?? []).filter((id) => id.startsWith(`${lesson.id}-`)))} />
          </div>}

          {tab === "Practical Atlas" && examHasAnatomy3d(exam) && <section className="term2-mock"><p className="eyebrow">{selectedConfig.title} · Multimodal anatomy lab</p><h1>Images and rotatable 3D targets.</h1><p className="lede">Inspect the highlighted structure before choosing. Source-image annotations and 3D labels remain hidden until feedback; closed-book test review waits until grading.</p><button className="primary" disabled={!examCount("dynamic-anatomy")} onClick={() => void startSession("dynamic-anatomy")}>Start dynamic anatomy →</button><p>{selectedExam?.dynamicImageCount ?? 0} annotated source diagrams · {selectedExam?.interactive3dCount ?? 0} 3D questions · {examCount("dynamic-anatomy")} total dynamic questions</p>{sessionError && <p className="session-error">{sessionError}</p>}</section>}
          {tab === "Practical Atlas" && exam !== "aug22" && !examHasAnatomy3d(exam) && exam !== "term2-physiology-practical" && <div className="practical-atlas-empty"><span className="eyebrow">Image study</span><h1>{isTerm2Exam(exam) ? "Use the verified image questions in Topics." : "This atlas belongs to Histology Practical."}</h1><p>{isTerm2Exam(exam) ? "Only source figures with clear provenance are added; no decorative or invented scientific images are used." : "Switch to Term 1 · Aug 22 above to study and test the 55 microscope specimens."}</p></div>}

          {tab === "Visual Guide" && !isTerm2Exam(exam) && <LessonGuide key={exam} exam={exam} lessons={allLessons} />}
          {tab === "Visual Guide" && isTerm2Exam(exam) && exam !== "term2-physiology-practical" && <Term2Guide exam={exam} />}

          {tab === "Results" && <>
            <p className="eyebrow">Saved on this device · {examConfig[exam].date}</p><h1>Past sprint results.</h1>
            <p className="lede">Every completed sprint stays here with its original answers. Open any result to revisit the full repair review.</p>
            {sessionError && <p className="session-error">{sessionError}</p>}
            {exam === "july29" && <BiochemistryMasteryGrid chapters={biochemistryChapterProgress} onRepair={startChapterRepair} />}
            <div className="results-list">
              {!examHistory.length && <div className="empty-review"><b>No completed {examConfig[exam].date} sprints yet.</b><span>Finish a sprint and its score and full review will appear here automatically.</span></div>}
              {examHistory.map((saved) => {
                const score = Math.round((saved.correctCount / saved.questionIds.length) * 100);
                return <article className="saved-result" key={saved.id}>
                  <div className="saved-result-copy"><span>{formatSessionDate(saved.completedAt)} · {saved.studyMode === "exam" ? isTerm2Exam(saved.exam) ? "Source-based test" : "Chapter exam" : "Learn"}</span><h2>{savedScopeLabel(saved)} · {saved.questionIds.length} questions</h2><p>{saved.correctCount} correct · {saved.questionIds.length - saved.correctCount} to repair · {saved.flaggedCount} flagged</p></div>
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
