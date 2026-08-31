import type { Term2ExamId } from "@/src/lib/mcq/exams.mjs";

export type Term2ConceptSubject = "anatomy" | "histology" | "embryology" | "physiology" | "biochemistry";
export type Term2ConceptSource = {
  title: string;
  edition?: string;
  chapter?: string;
  locator: string;
  basis: "book" | "slides" | "transcript" | "notes" | "media";
};
export type Term2ConceptObjective = { id: string; text: string; questionIds: string[] };
export type Term2Concept = {
  id: string;
  moduleId: string;
  subject: Term2ConceptSubject;
  title: string;
  summary: string;
  keyPoints: string[];
  examTraps: string[];
  retrievalPrompts: Array<{ prompt: string; answer: string }>;
  sources: Term2ConceptSource[];
  scope: "course" | "book-extension";
  objectives: Term2ConceptObjective[];
};
export type Term2ConceptModule = {
  id: string;
  subject: Term2ConceptSubject;
  title: string;
  description: string;
  order: number;
};
export type Term2ConceptAuditEntry = {
  source: string;
  locator: string;
  topic: string;
  conceptIds: string[];
  status: "mapped" | "outside-scope" | "source-missing";
  note: string;
};
export type Term2ConceptCatalog = {
  schemaVersion: "1.0.0";
  examId: Extract<Term2ExamId, "term2-cvs" | "term2-limbs" | "term2-biochemistry">;
  title: string;
  updatedAt: string;
  scopeNote: string;
  modules: Term2ConceptModule[];
  concepts: Term2Concept[];
  sourceAudit: Term2ConceptAuditEntry[];
};
export type Term2QuestionConceptIndex = Record<string, {
  subject: Term2ConceptSubject;
  kind: string;
  moduleId: string;
  moduleIds: string[];
  conceptIds: string[];
  primaryConceptId: string;
  dedupeKey: string;
  prompt: string;
  learningObjective: string;
  addedForGap: boolean;
}>;
export type Term2ConceptCoverage = {
  moduleCount: number;
  conceptCount: number;
  objectiveCount: number;
  questionCount: number;
  addedQuestionCount: number;
  distinctPracticeItems: number;
  objectivesFirstSampledByExpansion: number;
  unsampledObjectiveIds: string[];
};
export type Term2ConceptDataset = {
  catalog: Term2ConceptCatalog;
  index: Term2QuestionConceptIndex;
  coverage: Term2ConceptCoverage;
};
