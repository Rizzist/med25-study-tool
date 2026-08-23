import conceptCatalogData from "@/data/bank/biochemistry-core-concepts.json";

export type BiochemistryConceptPriority = "exam-core" | "medical-core" | "supplement";

export type BiochemistryConcept = {
  id: string;
  chapterId: string;
  title: string;
  priority: BiochemistryConceptPriority;
  rationale: string;
  summary: string;
  keyPoints: string[];
  clinicalLinks: string[];
  sourceEvidence: string[];
  selectedQuestionIds: string[];
};

type BiochemistryConceptCatalog = {
  schemaVersion: string;
  chapterCount: number;
  conceptCount: number;
  questionCount: number;
  chapters: Array<{ chapterId: string; concepts: BiochemistryConcept[] }>;
};

export const biochemistryConceptCatalog = conceptCatalogData as BiochemistryConceptCatalog;
export const biochemistryConcepts = biochemistryConceptCatalog.chapters.flatMap((chapter) => chapter.concepts);

const conceptsByChapter = new Map<string, BiochemistryConcept[]>();
const conceptByQuestion = new Map<string, BiochemistryConcept>();

for (const concept of biochemistryConcepts) {
  conceptsByChapter.set(concept.chapterId, [...(conceptsByChapter.get(concept.chapterId) ?? []), concept]);
  for (const questionId of concept.selectedQuestionIds) conceptByQuestion.set(questionId, concept);
}

export const biochemistryCoreQuestionIds = biochemistryConcepts.flatMap((concept) => concept.selectedQuestionIds);
export const biochemistryCoreQuestionIdSet = new Set(biochemistryCoreQuestionIds);

export function biochemistryConceptsForChapter(chapterId: string | undefined): BiochemistryConcept[] {
  return chapterId ? conceptsByChapter.get(chapterId) ?? [] : [];
}

export function biochemistryConceptForQuestion(questionId: string | undefined): BiochemistryConcept | undefined {
  return questionId ? conceptByQuestion.get(questionId) : undefined;
}

export function isCuratedBiochemistryQuestion(questionId: string): boolean {
  return biochemistryCoreQuestionIdSet.has(questionId);
}

export function biochemistryConceptQuestionPosition(concept: BiochemistryConcept, questionId: string) {
  const index = concept.selectedQuestionIds.indexOf(questionId);
  return index < 0 ? undefined : { current: index + 1, total: concept.selectedQuestionIds.length };
}
