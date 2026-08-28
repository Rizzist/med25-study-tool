import catalog from "@/data/term2/respiratory-concepts.json";
import index from "@/data/term2/respiratory-question-index.json";
import { distinctQuestionIds, questionProgress } from "./progress.mjs";

export type RespiratorySubject = "anatomy" | "histology" | "embryology" | "physiology";
export type RespiratorySource = { title: string; edition?: string; chapter?: string; locator: string; basis: "book" | "slides" };
export type RespiratoryObjective = { id: string; text: string; questionIds: string[] };
export type RespiratoryConcept = {
  id: string; moduleId: string; subject: RespiratorySubject; title: string; summary: string;
  keyPoints: string[]; examTraps: string[]; retrievalPrompts: Array<{ prompt: string; answer: string }>;
  sources: RespiratorySource[]; scope: "book-and-slides" | "book-only" | "slide-only"; objectives: RespiratoryObjective[];
};
export type RespiratoryModule = { id: string; subject: RespiratorySubject; title: string; description: string; order: number };
export type RespiratoryAuditEntry = { source: string; locator: string; topic: string; conceptIds: string[]; status: "mapped" | "outside-scope" | "source-missing"; note: string };
export type RespiratoryQuestionIndex = Record<string, { subject: RespiratorySubject; kind: string; moduleId: string; moduleIds: string[]; conceptIds: string[]; primaryConceptId: string; dedupeKey: string; prompt: string; learningObjective: string; addedForGap: boolean }>;

export const respiratoryConcepts = catalog.concepts as RespiratoryConcept[];
export const respiratoryModules = (catalog.modules as RespiratoryModule[]).slice().sort((a, b) => a.order - b.order);
export const respiratorySourceAudit = catalog.sourceAudit as RespiratoryAuditEntry[];
export const respiratoryScopeNote = catalog.scopeNote;
export const respiratoryQuestionIndex = index as RespiratoryQuestionIndex;
export const respiratorySubjectLabels: Record<RespiratorySubject, string> = { anatomy: "Anatomy", histology: "Histology", embryology: "Embryology", physiology: "Physiology" };
export const respiratoryScopeLabels = { "book-and-slides": "Book + slides", "book-only": "Book only", "slide-only": "Slides only" };

export function respiratoryScope(id?: string) {
  return respiratoryConcepts.find((item) => item.id === id) ?? respiratoryModules.find((item) => item.id === id);
}

export function respiratoryScopeConcepts(id?: string) {
  if (!id || id === "all") return respiratoryConcepts;
  return respiratoryConcepts.filter((concept) => concept.id === id || concept.moduleId === id);
}

export function respiratoryScopeQuestionIds(id?: string) {
  return [...new Set(respiratoryScopeConcepts(id).flatMap((concept) => concept.objectives.flatMap((objective) => objective.questionIds)))];
}

export function respiratoryConceptsForQuestion(id: string) {
  const ids = new Set(respiratoryQuestionIndex[id]?.conceptIds ?? []);
  return respiratoryConcepts.filter((concept) => ids.has(concept.id));
}

export function respiratoryDistinctIds(ids: string[]) { return distinctQuestionIds(ids, respiratoryQuestionIndex); }

export function respiratoryQuestionProgress(ids: string[], attemptedIds: string[], repairIds: string[]) {
  return questionProgress(ids, attemptedIds, repairIds, respiratoryQuestionIndex);
}

export function respiratorySourceText(source: RespiratorySource) {
  return [source.title, source.edition, source.chapter, source.locator].filter(Boolean).join(" · ");
}
