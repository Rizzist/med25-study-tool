import { createHash } from "node:crypto";
import embeddedBankData from "@/data/bank/embedded-bank.json";
import {
  biochemistryChapterIdForQuestion,
  biochemistryChapters,
  isBiochemistryChapterId,
} from "@/src/lib/biochemistry/chapters";
import { isCuratedBiochemistryQuestion } from "@/src/lib/biochemistry/concepts";
import type { MCQQuestion } from "@/src/lib/mcq/types";
import { selectCoverageSprint } from "@/src/lib/mcq/sprint-selection.mjs";
import { selectRespiratorySprint } from "@/src/lib/mcq/respiratory-selection.mjs";
import { isExamId, isTerm2Exam, isTerm2Question, matchesTerm2Exam, isImageQuestion, term2Exams, type ExamId } from "@/src/lib/mcq/exams.mjs";

export { isExamId };
export type { ExamId };
export type FinalExamBankId = "telegram-past-papers" | "downloaded-core";
type FinalExamBankKey = `${ExamId}:${FinalExamBankId}`;
export type CollectionId =
  | "all"
  | "anatomy"
  | "dynamic-anatomy"
  | "histology"
  | "embryology"
  | "physiology"
  | "biochemistry"
  | "images"
  | "stains"
  | "histo-practical"
  | "histo-identification"
  | "histo-transfer"
  | "practical";

const COLLECTIONS: CollectionId[] = [
  "all",
  "anatomy",
  "dynamic-anatomy",
  "histology",
  "embryology",
  "physiology",
  "biochemistry",
  "images",
  "stains",
  "histo-practical",
  "histo-identification",
  "histo-transfer",
  "practical",
];

const JULY_29_PHYSIOLOGY_TOPICS = new Set([
  "Cell physiology and homeostasis",
  "Membrane transport",
  "Membrane potentials",
  "Action potentials",
]);

const JULY_25_PHYSIOLOGY_TOPICS = new Set([
  "Cell physiology and homeostasis",
  "Membrane transport",
  "Membrane potentials",
  "Action potentials",
  "Skeletal muscle",
  "Neuromuscular junction",
  "Excitation-contraction coupling",
  "Smooth muscle",
  "Neurotransmission and neurotransmitters",
]);

const JULY_25_HISTOLOGY_TOPICS = new Set([
  "Histological methods and stains",
  "Histology methods and stains",
  "Histology methods",
  "Microscopy",
  "Cytoplasm",
  "Nucleus",
  "Cell membrane",
  "Membrane transport",
  "Cell signaling",
  "Cytoplasmic organelles",
  "Cytoskeleton",
  "Cytoplasmic inclusions",
  "Cell cycle",
  "Cell death",
  "Cell division",
  "Epithelial tissue",
  "Connective tissue",
  "Adipose tissue",
  "Cartilage",
  "Cartilage and bone",
  "Bone",
  "Bone and joint tissue",
  "Nerve tissue and nervous system",
  "Nervous tissue",
  "Muscle tissue",
  "Blood",
  "Blood and hemopoiesis",
  "Hemopoiesis",
  "Skin",
  "Male reproductive system",
  "Female reproductive system",
]);

const JULY_29_HISTOLOGY_TOPICS = new Set([
  "Histological methods and stains",
  "Histology methods and stains",
  "Histology methods",
  "Microscopy",
  "Cytoplasm",
  "Nucleus",
  "Cell membrane",
  "Membrane transport",
  "Cell signaling",
  "Cytoplasmic organelles",
  "Cytoskeleton",
  "Cytoplasmic inclusions",
  "Cell cycle",
  "Cell death",
  "Cell division",
]);

const JULY_25_EMBRYOLOGY_TOPICS = new Set([
  "Molecular regulation and signaling",
  "Gametogenesis",
  "Gametogenesis and first week",
  "Chromosomal abnormalities",
  "First week of development",
  "Second week of development",
  "Second week: bilaminar disc and implantation",
  "Third week of development",
  "Third week: gastrulation and axial patterning",
  "Fourth week: body folding",
  "Embryonic period",
  "Embryonic period and germ-layer derivatives",
  "Neurulation, gut tube, and body cavities",
  "Fetal period, placenta, and fetal membranes",
  "Birth defects and prenatal diagnosis",
]);

const JULY_29_BIOCHEMISTRY_TOPICS = new Set([
  "Biochemical foundations",
  "Metabolism, ATP, functional groups, and bonds",
  "Water and body-fluid compartments",
  "pH, acids, bases, Ka, and pKa",
  "Titration, Henderson-Hasselbalch, and buffer capacity",
  "Physiological buffer systems",
  "Water-soluble vitamins",
  "Fat-soluble vitamins",
  "lipids",
  "fatty acids",
  "lipid oxidation",
  "eicosanoids",
  "lipid structure",
  "cholesterol",
  "lipid classification",
  "triacylglycerol",
  "phospholipids",
  "sphingolipids",
  "lipoproteins",
  "amino acids",
  "protein structure",
  "protein denaturation",
  "enzyme kinetics",
  "enzyme inhibition",
  "enzyme regulation",
  "dna structure",
  "nucleotides",
  "dna conformation",
  "dna denaturation",
  "chromatin",
  "dna replication",
  "telomeres",
  "rna",
  "transcription",
  "transcription inhibitors",
  "gene regulation",
  "lac operon",
  "trp operon",
  "translation",
  "mutations",
  "translation inhibitors",
  "Practical biochemistry",
  "hemoglobin structure and function",
  "carbohydrate structure",
  "glycoconjugates",
  "dna repair mechanisms",
  "Practical amino acid and protein tests",
  "Practical enzyme assays",
  "Spectrophotometry",
  "DNA extraction",
  "Chromatography",
  "Flame photometry",
  "Osmosis practical",
  "bioenergetics",
  "fibrous proteins",
  "glycosaminoglycans and proteoglycans",
  "dietary lipid metabolism",
  "fatty acid and ketone metabolism",
  "complex lipid metabolism",
  "cholesterol and lipoprotein metabolism",
  "metabolic effects of insulin and glucagon",
  "feed-fast cycle",
  "diabetes mellitus",
  "obesity",
  "nutrition",
  "biotechnology and molecular techniques",
]);

type BankManifest = {
  schemaVersion: string;
  bankId: string;
  title: string;
  subjects: Array<{ id: string; title: string }>;
};

type EmbeddedBank = {
  manifest: BankManifest;
  questions: MCQQuestion[];
  finalExams: Partial<Record<FinalExamBankKey, MCQQuestion[]>>;
};

const embeddedBank = embeddedBankData as unknown as EmbeddedBank;
let verifiedCache: MCQQuestion[] | null = null;
const finalCache: Partial<Record<FinalExamBankKey, MCQQuestion[]>> = {};

const FINAL_EXAM_BANKS = [
  {
    id: "telegram-past-papers" as const,
    exam: "july25" as const,
    label: "Telegram Past Papers",
    description: "The original source-traceable July 25 past-paper bank.",
    requiredTag: "telegram-final",
  },
  {
    id: "telegram-past-papers" as const,
    exam: "july29" as const,
    label: "Telegram Past Papers",
    description: "The original 199-question August 25 Telegram archive.",
    requiredTag: "telegram-final",
  },
  {
    id: "downloaded-core" as const,
    exam: "july29" as const,
    label: "New Downloads · Core Distilled",
    description: "Scientifically re-keyed core questions distilled from the newly downloaded past papers and exam photos.",
    requiredTag: "final-bank-aug25-downloaded-core",
  },
] as const;

export function isFinalExamBankId(value: unknown): value is FinalExamBankId {
  return value === "telegram-past-papers" || value === "downloaded-core";
}

export function defaultFinalExamBank(): FinalExamBankId {
  return "telegram-past-papers";
}

function finalExamBankDefinition(exam: ExamId, bank: FinalExamBankId) {
  const definition = FINAL_EXAM_BANKS.find((candidate) => candidate.exam === exam && candidate.id === bank);
  if (!definition) throw new Error("That final-exam bank is not available for this exam");
  return definition;
}

export function isCollectionId(value: unknown): value is CollectionId {
  return typeof value === "string" && COLLECTIONS.includes(value as CollectionId);
}

export function loadVerifiedQuestions(): MCQQuestion[] {
  if (!verifiedCache) {
    verifiedCache = embeddedBank.questions
      .filter((question) => question.status === "verified");
  }
  return verifiedCache;
}

export function loadFinalExamQuestions(exam: ExamId, bank: FinalExamBankId = defaultFinalExamBank()): MCQQuestion[] {
  const definition = finalExamBankDefinition(exam, bank);
  const key: FinalExamBankKey = `${exam}:${bank}`;
  if (!finalCache[key]) {
    finalCache[key] = (embeddedBank.finalExams[key] ?? []).filter((question) => {
      const tags = new Set(question.tags ?? []);
      return question.status === "verified"
        && tags.has(definition.requiredTag)
        && tags.has(`exam-${exam}`)
        && Boolean(question.source?.title)
        && Boolean(question.source?.chapter);
    });
  }
  return finalCache[key] ?? [];
}

function isPracticalDerived(question: MCQQuestion): boolean {
  const tags = (question.tags ?? []).map((tag) => tag.toLowerCase());
  return question.kind === "image_single_best_answer"
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

export function matchesExam(question: MCQQuestion, exam: ExamId): boolean {
  if (isTerm2Exam(exam)) return matchesTerm2Exam(question, exam);
  if (isTerm2Question(question)) return false;
  const isHistologyPractical = (question.tags ?? []).includes("histo-practical");
  if (isHistologyPractical) return exam === "aug22";
  if (exam === "aug22") return false;
  if (exam === "july25") {
    if (["histology", "embryology"].includes(question.subject) && isPracticalDerived(question)) return true;
    if (question.subject === "histology") return JULY_25_HISTOLOGY_TOPICS.has(question.topic);
    if (question.subject === "embryology") return JULY_25_EMBRYOLOGY_TOPICS.has(question.topic);
    return question.subject === "physiology" && JULY_25_PHYSIOLOGY_TOPICS.has(question.topic);
  }
  if (question.subject === "biochemistry") return isCuratedBiochemistryQuestion(question.id)
    && (Boolean(biochemistryChapterIdForQuestion(question)) || JULY_29_BIOCHEMISTRY_TOPICS.has(question.topic));
  if (question.subject === "histology") return JULY_29_HISTOLOGY_TOPICS.has(question.topic);
  return question.subject === "physiology" && JULY_29_PHYSIOLOGY_TOPICS.has(question.topic);
}

export function matchesCollection(question: MCQQuestion, collection: CollectionId): boolean {
  if (collection === "all") return true;
  if (["anatomy", "histology", "embryology", "physiology", "biochemistry"].includes(collection)) {
    return question.subject === collection;
  }
  if (collection === "images") return isImageQuestion(question);
  if (collection === "dynamic-anatomy") return question.kind === "dynamic_anatomy";
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

export function bankSummary() {
  const manifest = embeddedBank.manifest;
  const allQuestions = embeddedBank.questions;
  const verified = loadVerifiedQuestions();
  const subjectCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  for (const question of allQuestions) {
    subjectCounts.set(question.subject, (subjectCounts.get(question.subject) ?? 0) + 1);
    for (const tag of question.tags ?? []) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  const exams = ([
    { id: "july25" as const, date: "2026-07-25", title: "Tissue Development & Function" },
    { id: "aug22" as const, date: "2026-08-22", title: "Histology Practical" },
    { id: "july29" as const, date: "2026-08-25", title: "Cell & Molecules" },
    ...term2Exams,
  ]).map((exam) => {
    const questions = verified.filter((question) => matchesExam(question, exam.id));
    const chapterSummaries = exam.id === "july29"
      ? biochemistryChapters.map((chapter) => {
        const chapterQuestions = questions.filter((question) => biochemistryChapterIdForQuestion(question) === chapter.id);
        return { ...chapter, questionCount: chapterQuestions.length, questionIds: chapterQuestions.map((question) => question.id) };
      }).filter((chapter) => chapter.questionCount > 0)
      : [];
    return {
      ...exam,
      questionCount: questions.length,
      finalExamQuestionCount: FINAL_EXAM_BANKS
        .filter((bank) => bank.exam === exam.id)
        .reduce((total, bank) => total + loadFinalExamQuestions(exam.id, bank.id).length, 0),
      finalExamBanks: FINAL_EXAM_BANKS
        .filter((bank) => bank.exam === exam.id)
        .map((bank) => ({
          id: bank.id,
          label: bank.label,
          description: bank.description,
          questionCount: loadFinalExamQuestions(exam.id, bank.id).length,
        })),
      imageQuestionCount: questions.filter(isImageQuestion).length,
      dynamicImageCount: new Set(questions.filter((question) => question.kind === "dynamic_anatomy").map((question) => question.anatomy?.imageId)).size,
      collectionCounts: Object.fromEntries(COLLECTIONS.map((collection) => [
        collection,
        questions.filter((question) => matchesCollection(question, collection)).length,
      ])),
      collectionQuestionIds: Object.fromEntries(COLLECTIONS.map((collection) => [
        collection,
        questions.filter((question) => matchesCollection(question, collection)).map((question) => question.id),
      ])),
      biochemistryChapters: chapterSummaries,
    };
  });

  return {
    bankId: manifest.bankId,
    title: manifest.title,
    schemaVersion: manifest.schemaVersion,
    questionCount: allQuestions.length,
    imageQuestionCount: allQuestions.filter(isImageQuestion).length,
    subjects: manifest.subjects.map((subject) => ({
      ...subject,
      questionCount: subjectCounts.get(subject.id) ?? 0,
    })),
    tags: Object.fromEntries([...tagCounts.entries()].sort(([left], [right]) => left.localeCompare(right))),
    exams,
  };
}

export function finalExamSet(exam: ExamId, bank: FinalExamBankId = defaultFinalExamBank()) {
  const definition = finalExamBankDefinition(exam, bank);
  const questions = loadFinalExamQuestions(exam, bank);
  const fingerprint = createHash("sha256")
    .update(JSON.stringify([exam, bank, ...questions.map((question) => [
      question.id,
      question.revision,
      question.correctOptionId,
      question.source,
    ])]))
    .digest("hex")
    .slice(0, 20);
  return {
    exam,
    bank,
    label: definition.label,
    description: definition.description,
    availableCount: questions.length,
    fingerprint,
    questions,
  };
}

export function questionSet(searchParams: URLSearchParams) {
  const exam = searchParams.get("exam");
  const collection = searchParams.get("collection");
  if (exam !== null && !isExamId(exam)) throw new Error("A valid exam is required");
  if (collection !== null && !isCollectionId(collection)) throw new Error("A valid collection is required");

  const subject = searchParams.get("subject");
  const kind = searchParams.get("kind");
  const topic = searchParams.get("topic")?.trim().toLowerCase();
  const tag = searchParams.get("tag")?.trim().toLowerCase();
  const chapterId = searchParams.get("biochemistryChapterId")?.trim();
  if (chapterId && !isBiochemistryChapterId(chapterId)) throw new Error("A valid biochemistry chapter is required");
  const limit = cappedLimit(searchParams.get("limit"), 20);
  const filtered = loadVerifiedQuestions().filter((question) => {
    if (exam && !matchesExam(question, exam)) return false;
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
  const filtered = loadVerifiedQuestions()
    .filter((question) => matchesExam(question, exam)
      && matchesCollection(question, collection)
      && (!chapterId || biochemistryChapterIdForQuestion(question) === chapterId));
  const selection = exam === "term2-respiratory"
    ? selectRespiratorySprint(filtered, { limit, seenIds, repairIds, studyMode: input.studyMode === "exam" ? "exam" : "learn" })
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
  const ids = cleanIds(input.ids, 500);
  const limit = cappedLimit(input.limit, ids.length || 1);
  const idSet = new Set(ids);
  const filtered = loadVerifiedQuestions()
    .filter((question) => idSet.has(question.id) && matchesExam(question, exam));
  const byId = new Map(filtered.map((question) => [question.id, question]));
  const ordered = input.prioritize === true
    ? selectCoverageSprint(filtered, {
      limit,
      seenIds: cleanIds(input.seenIds, 5_000),
      repairIds: cleanIds(input.repairIds, 5_000),
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

export function resolveMedia(questionId: string | null, mediaId: string | null) {
  if (!questionId || !mediaId) return null;
  const question = [
    ...loadVerifiedQuestions(),
    ...loadFinalExamQuestions("july25"),
    ...loadFinalExamQuestions("july29"),
    ...loadFinalExamQuestions("july29", "downloaded-core"),
  ].find((candidate) => candidate.id === questionId);
  const media = question?.media?.find((candidate) => candidate.id === mediaId);
  if (!media || media.type !== "image") return null;
  const cleanPath = media.path.replace(/^\/+/, "");
  if (!cleanPath || cleanPath.split("/").some((segment) => segment === "..")) return null;
  return { path: cleanPath, alt: media.alt };
}
