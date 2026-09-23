import fs from 'node:fs';
import path from 'node:path';
import runtimeData from '@/data/mcq-runtime/index.json';
import compactCatalog from '@/public/study/runtime/catalog.json';
import type {MCQQuestion} from '@/src/lib/mcq/types';
import {biochemistryChapterIdForQuestion,isBiochemistryChapterId} from '@/src/lib/biochemistry/chapters';
import {selectCoverageSprint} from '@/src/lib/mcq/sprint-selection.mjs';
import {selectRespiratorySprint} from '@/src/lib/mcq/respiratory-selection.mjs';
import {selectPracticalSprint} from '@/src/lib/mcq/practical-selection.mjs';
import {selectTerm2Sprint} from '@/src/lib/mcq/term2-selection.mjs';
import {isExamId,isTerm2Exam,isImageQuestion,type ExamId} from '@/src/lib/mcq/exams.mjs';
export {isExamId};export type {ExamId};
export type FinalExamBankId='telegram-past-papers'|'nutrition-past-papers'|'religion-past-papers'|'biochemistry-metabolism-past-papers';
export type CollectionId='all'|'anatomy'|'dynamic-anatomy'|'histology'|'embryology'|'physiology'|'biochemistry'|'images'|'stains'|'histo-practical'|'histo-identification'|'histo-transfer'|'practical';
const COLLECTIONS:CollectionId[]=['all','anatomy','dynamic-anatomy','histology','embryology','physiology','biochemistry','images','stains','histo-practical','histo-identification','histo-transfer','practical'];
type Runtime={version:string;courses:Record<ExamId,{file:string;historyFile:string;version:string;count:number}>;finals:Record<string,{file:string;version:string;count:number}>};
const runtime=runtimeData as Runtime;
// Bound hot data to two selected course/paper files. No monolithic corpus import.
const hot=new Map<string,MCQQuestion[]>();
function readQuestions(file:string):MCQQuestion[] {
  const saved=hot.get(file);if(saved){hot.delete(file);hot.set(file,saved);return saved;}
  const data=JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/mcq-runtime',path.basename(file)),'utf8')) as MCQQuestion[];
  hot.set(file,data);if(hot.size>2)hot.delete(hot.keys().next().value!);return data;
}
export function loadVerifiedQuestions(exam:ExamId):MCQQuestion[]{return readQuestions(runtime.courses[exam].file);}
export function isCollectionId(value:unknown):value is CollectionId{return typeof value==='string'&&COLLECTIONS.includes(value as CollectionId);}
export function isFinalExamBankId(value:unknown):value is FinalExamBankId{return value==='biochemistry-metabolism-past-papers'||value==='telegram-past-papers'||value==='nutrition-past-papers'||value==='religion-past-papers';}
export function defaultFinalExamBank(exam?:ExamId):FinalExamBankId{return exam==='term2-biochemistry'?'biochemistry-metabolism-past-papers':exam==='term2-religion'?'religion-past-papers':exam==='term2-nutrition'?'nutrition-past-papers':'telegram-past-papers';}
export function loadFinalExamQuestions(exam:ExamId,bank:FinalExamBankId=defaultFinalExamBank(exam)){
  const record=runtime.finals[exam+':'+bank];if(!record)throw Error('No sourced past-paper bank exists for this course.');
  return readQuestions(record.file);
}
export function finalExamSet(exam:ExamId,bank:FinalExamBankId=defaultFinalExamBank(exam)){
  const questions=loadFinalExamQuestions(exam,bank);
  return {exam,bank,label:'Sourced past papers',description:'Original past-paper questions. Answer notes distinguish supplied and reviewed keys.',availableCount:questions.length,fingerprint:runtime.finals[exam+':'+bank].version,questions};
}
export function bankSummary(){return compactCatalog;}
function isPracticalDerived(question: MCQQuestion): boolean {
  const tags = (question.tags ?? []).map((tag) => tag.toLowerCase());
  // Keep the Biochemistry II practical collection separate from its pathway images.
  if (tags.includes("exam-term2-biochemistry")) return tags.includes("biochemistry-practical");
  return question.kind === "image_single_best_answer"
    || tags.includes("physiology-practical")
    || tags.includes("biochemistry-lab")
    || tags.includes("stains")
    || [
      "Histological methods and stains",
      "Histology methods and stains",
      "Histology methods",
      "Microscopy",
      "Practical biochemistry",
    ].includes(question.topic);
}

export function matchesCollection(question: MCQQuestion, collection: CollectionId): boolean {
  if (collection === "all") return true;
  if (["anatomy", "histology", "embryology", "physiology", "biochemistry"].includes(collection)) {
    return question.subject === collection;
  }
  if (collection === "images") return isImageQuestion(question);
  if (collection === "dynamic-anatomy") return question.kind === "dynamic_anatomy" || question.kind === "dynamic_anatomy_3d";
  if (collection === "stains") return (question.tags ?? []).some((tag) => tag.toLowerCase().includes("stain"));
  if (collection === "histo-identification") return (question.tags ?? []).includes("histo-identification-15");
  if (collection === "histo-transfer") return (question.tags ?? []).includes("histo-transfer-100");
  if (collection === "histo-practical") return (question.tags ?? []).includes("histo-practical") && !(question.tags ?? []).some((tag) => tag === "histo-identification-15" || tag === "histo-transfer-100");
  return isPracticalDerived(question);
}

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function cappedLimit(value: unknown, fallback: number, maximum = 250): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(maximum, Math.floor(parsed))) : fallback;
}

function cleanIds(value: unknown, maximum: number): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => (
    typeof id === "string" && id.length > 0 && id.length <= 160
  )))].slice(0, maximum);
}

export function questionSet(searchParams: URLSearchParams) {
  const exam = searchParams.get("exam");
  const collection = searchParams.get("collection");
  if (!isExamId(exam)) throw new Error("A valid exam is required");
  if (collection !== null && !isCollectionId(collection)) throw new Error("A valid collection is required");

  const subject = searchParams.get("subject");
  const kind = searchParams.get("kind");
  const topic = searchParams.get("topic")?.trim().toLowerCase();
  const tag = searchParams.get("tag")?.trim().toLowerCase();
  const chapterId = searchParams.get("biochemistryChapterId")?.trim();
  if (chapterId && !isBiochemistryChapterId(chapterId)) throw new Error("A valid biochemistry chapter is required");
  const limit = cappedLimit(searchParams.get("limit"), 20);
  const filtered = loadVerifiedQuestions(exam).filter((question) => {
    if (collection && !matchesCollection(question, collection)) return false;
    if (subject && question.subject !== subject) return false;
    if (kind && question.kind !== kind) return false;
    if (topic && question.topic.toLowerCase() !== topic) return false;
    if (tag && !(question.tags ?? []).some((value) => value.toLowerCase() === tag)) return false;
    if (chapterId && biochemistryChapterIdForQuestion(question) !== chapterId) return false;
    return true;
  });
  return { availableCount: filtered.length, questions: shuffle(filtered).slice(0, limit) };
}

export function coverageQuestionSet(body: unknown) {
  const input = body as Record<string, unknown> | null;
  if (!input || !isExamId(input.exam)) throw new Error("A valid exam is required");
  const exam = input.exam;
  const collection = typeof input.collection === "string" ? input.collection : "all";
  if (!isCollectionId(collection)) throw new Error("A valid collection is required");

  const limit = cappedLimit(input.limit, 20);
  const chapterId = typeof input.biochemistryChapterId === "string" ? input.biochemistryChapterId : undefined;
  if (chapterId && !isBiochemistryChapterId(chapterId)) throw new Error("A valid biochemistry chapter is required");
  const seenIds = cleanIds(input.seenIds, 5_000);
  const repairIds = cleanIds(input.repairIds, 5_000);
  const filtered = loadVerifiedQuestions(exam)
    .filter((question) => matchesCollection(question, collection)
      && (!chapterId || biochemistryChapterIdForQuestion(question) === chapterId));
  const selection = exam === "term2-respiratory"
    ? selectRespiratorySprint(filtered, { limit, seenIds, repairIds, studyMode: input.studyMode === "exam" ? "exam" : "learn" })
    : exam === "term2-physiology-practical" ? selectPracticalSprint(filtered, { limit, seenIds, repairIds, studyMode: input.studyMode === "exam" ? "exam" : "learn" })
    : isTerm2Exam(exam) ? selectTerm2Sprint(filtered, { limit, seenIds, repairIds, studyMode: input.studyMode === "exam" ? "exam" : "learn" })
    : selectCoverageSprint(filtered, { limit, seenIds, repairIds });

  return {
    availableCount: filtered.length,
    questions: selection.questions,
    coverage: {
      repairCount: selection.repairCount,
      unseenCount: selection.unseenCount,
      reviewCount: selection.reviewCount,
      ordinaryReviewCount: selection.ordinaryReviewCount,
    },
    biochemistryChapterId: chapterId,
  };
}

export function questionSetByIds(body: unknown) {
  const input = body as Record<string, unknown> | null;
  if (!input || !Array.isArray(input.ids)) throw new Error("Question ids are required");
  if (!isExamId(input.exam)) throw new Error("A valid exam is required");
  const exam = input.exam;
  const ids = cleanIds(input.ids, 10_000);
  const limit = cappedLimit(input.limit, ids.length || 1);
  const idSet = new Set(ids);
  const pool = input.purpose === "history" ? readQuestions(runtime.courses[exam].historyFile) : loadVerifiedQuestions(exam);
  const filtered = pool
    .filter((question) => idSet.has(question.id));
  const byId = new Map(filtered.map((question) => [question.id, question]));
  const ordered = input.prioritize === true
    ? (exam === "term2-respiratory" ? selectRespiratorySprint : exam === "term2-physiology-practical" ? selectPracticalSprint : isTerm2Exam(exam) ? selectTerm2Sprint : selectCoverageSprint)(filtered, {
      limit,
      seenIds: cleanIds(input.seenIds, 5_000),
      repairIds: cleanIds(input.repairIds, 5_000),
      studyMode: input.studyMode === "exam" ? "exam" : "learn",
    }).questions
    : input.preserveOrder === true
      ? ids.flatMap((id) => {
        const question = byId.get(id);
        return question ? [question] : [];
      })
      : shuffle(filtered);
  return {
    availableCount: filtered.length,
    validIds: filtered.map((question) => question.id),
    questions: ordered.slice(0, limit),
  };
}


let mediaIndex:Record<string,{path:string;alt:string;type:string;url:string}>|undefined;
export function resolveMedia(questionId:string|null,mediaId:string|null) {
  if(!questionId||!mediaId)return null;
  mediaIndex??=JSON.parse(fs.readFileSync(path.join(process.cwd(),'data/mcq-runtime/media.json'),'utf8'));
  const media=mediaIndex![questionId+'::'+mediaId];
  if(!media||!['image','audio','video'].includes(media.type)||media.path.split('/').includes('..'))return null;
  return media;
}
