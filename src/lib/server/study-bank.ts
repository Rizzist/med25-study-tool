import { createHash } from "node:crypto";
import embeddedBankData from "@/data/bank/embedded-bank.json";
import type { MCQQuestion } from "@/src/lib/mcq/types";

export type ExamId = "july25" | "july29";
export type CollectionId =
  | "all"
  | "histology"
  | "embryology"
  | "physiology"
  | "biochemistry"
  | "images"
  | "stains"
  | "practical";

const COLLECTIONS: CollectionId[] = [
  "all",
  "histology",
  "embryology",
  "physiology",
  "biochemistry",
  "images",
  "stains",
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
  finalExams: Record<ExamId, MCQQuestion[]>;
};

const embeddedBank = embeddedBankData as unknown as EmbeddedBank;
let verifiedCache: MCQQuestion[] | null = null;
const finalCache: Partial<Record<ExamId, MCQQuestion[]>> = {};

export function isExamId(value: unknown): value is ExamId {
  return value === "july25" || value === "july29";
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

export function loadFinalExamQuestions(exam: ExamId): MCQQuestion[] {
  if (!finalCache[exam]) {
    finalCache[exam] = embeddedBank.finalExams[exam].filter((question) => {
      const tags = new Set(question.tags ?? []);
      return question.status === "verified"
        && tags.has("telegram-final")
        && tags.has(`exam-${exam}`)
        && Boolean(question.source?.title)
        && Boolean(question.source?.chapter);
    });
  }
  return finalCache[exam] ?? [];
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
  if (exam === "july25") {
    if (["histology", "embryology"].includes(question.subject) && isPracticalDerived(question)) return true;
    if (question.subject === "histology") return JULY_25_HISTOLOGY_TOPICS.has(question.topic);
    if (question.subject === "embryology") return JULY_25_EMBRYOLOGY_TOPICS.has(question.topic);
    return question.subject === "physiology" && JULY_25_PHYSIOLOGY_TOPICS.has(question.topic);
  }
  if (question.subject === "biochemistry") return JULY_29_BIOCHEMISTRY_TOPICS.has(question.topic);
  return question.subject === "physiology" && JULY_29_PHYSIOLOGY_TOPICS.has(question.topic);
}

export function matchesCollection(question: MCQQuestion, collection: CollectionId): boolean {
  if (collection === "all") return true;
  if (["histology", "embryology", "physiology", "biochemistry"].includes(collection)) {
    return question.subject === collection;
  }
  if (collection === "images") return question.kind === "image_single_best_answer";
  if (collection === "stains") return (question.tags ?? []).some((tag) => tag.toLowerCase().includes("stain"));
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
    { id: "july29" as const, date: "2026-07-29", title: "Cell & Molecules" },
  ]).map((exam) => {
    const questions = verified.filter((question) => matchesExam(question, exam.id));
    return {
      ...exam,
      questionCount: questions.length,
      finalExamQuestionCount: loadFinalExamQuestions(exam.id).length,
      imageQuestionCount: questions.filter((question) => question.kind === "image_single_best_answer").length,
      collectionCounts: Object.fromEntries(COLLECTIONS.map((collection) => [
        collection,
        questions.filter((question) => matchesCollection(question, collection)).length,
      ])),
      collectionQuestionIds: Object.fromEntries(COLLECTIONS.map((collection) => [
        collection,
        questions.filter((question) => matchesCollection(question, collection)).map((question) => question.id),
      ])),
    };
  });

  return {
    bankId: manifest.bankId,
    title: manifest.title,
    schemaVersion: manifest.schemaVersion,
    questionCount: allQuestions.length,
    imageQuestionCount: allQuestions.filter((question) => question.kind === "image_single_best_answer").length,
    subjects: manifest.subjects.map((subject) => ({
      ...subject,
      questionCount: subjectCounts.get(subject.id) ?? 0,
    })),
    tags: Object.fromEntries([...tagCounts.entries()].sort(([left], [right]) => left.localeCompare(right))),
    exams,
  };
}

export function finalExamSet(exam: ExamId) {
  const questions = loadFinalExamQuestions(exam);
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(questions.map((question) => [
      question.id,
      question.revision,
      question.correctOptionId,
      question.source,
    ])))
    .digest("hex")
    .slice(0, 20);
  return { exam, availableCount: questions.length, fingerprint, questions };
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
  const limit = cappedLimit(searchParams.get("limit"), 20);
  const filtered = loadVerifiedQuestions().filter((question) => {
    if (exam && !matchesExam(question, exam)) return false;
    if (collection && !matchesCollection(question, collection)) return false;
    if (subject && question.subject !== subject) return false;
    if (kind && question.kind !== kind) return false;
    if (topic && question.topic.toLowerCase() !== topic) return false;
    if (tag && !(question.tags ?? []).some((value) => value.toLowerCase() === tag)) return false;
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
  const seen = new Set(cleanIds(input.seenIds, 5_000));
  const repair = new Set(cleanIds(input.repairIds, 5_000));
  const filtered = loadVerifiedQuestions()
    .filter((question) => matchesExam(question, exam) && matchesCollection(question, collection));
  const capped = Math.min(limit, filtered.length);
  const unseenPool = shuffle(filtered.filter((question) => !seen.has(question.id)));
  const repairPool = shuffle(filtered.filter((question) => seen.has(question.id) && repair.has(question.id)));
  const ordinaryReviewPool = shuffle(filtered.filter((question) => seen.has(question.id) && !repair.has(question.id)));
  const reviewPool = [...repairPool, ...ordinaryReviewPool];
  const unseenTarget = Math.min(unseenPool.length, Math.ceil(capped * 0.8));
  const selectedUnseen = unseenPool.slice(0, unseenTarget);
  const selectedReview = reviewPool.slice(0, Math.min(reviewPool.length, capped - unseenTarget));
  let remaining = capped - selectedUnseen.length - selectedReview.length;
  if (remaining > 0) {
    const fill = unseenPool.slice(unseenTarget, unseenTarget + remaining);
    selectedUnseen.push(...fill);
    remaining -= fill.length;
  }
  if (remaining > 0) selectedReview.push(...reviewPool.slice(selectedReview.length, selectedReview.length + remaining));

  return {
    availableCount: filtered.length,
    questions: shuffle([...selectedUnseen, ...selectedReview]),
    coverage: { unseenCount: selectedUnseen.length, reviewCount: selectedReview.length },
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
  const ordered = input.preserveOrder === true
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
  ].find((candidate) => candidate.id === questionId);
  const media = question?.media?.find((candidate) => candidate.id === mediaId);
  if (!media || media.type !== "image") return null;
  const cleanPath = media.path.replace(/^\/+/, "");
  if (!cleanPath || cleanPath.split("/").some((segment) => segment === "..")) return null;
  return { path: cleanPath, alt: media.alt };
}
