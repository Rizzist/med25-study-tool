import biochemistryCatalog from "@/data/term2/biochemistry-concepts.json";
import biochemistryCoverage from "@/data/term2/biochemistry-coverage.json";
import biochemistryIndex from "@/data/term2/biochemistry-question-index.json";
import cvsCatalog from "@/data/term2/cvs-concepts.json";
import cvsCoverage from "@/data/term2/cvs-coverage.json";
import cvsIndex from "@/data/term2/cvs-question-index.json";
import limbsCatalog from "@/data/term2/limbs-concepts.json";
import limbsCoverage from "@/data/term2/limbs-coverage.json";
import limbsIndex from "@/data/term2/limbs-question-index.json";
import type { Term2ExamId } from "@/src/lib/mcq/exams.mjs";
import type { Term2ConceptDataset } from "./concept-types";

const datasets: Partial<Record<Term2ExamId, Term2ConceptDataset>> = {
  "term2-cvs": { catalog: cvsCatalog, index: cvsIndex, coverage: cvsCoverage } as Term2ConceptDataset,
  "term2-limbs": { catalog: limbsCatalog, index: limbsIndex, coverage: limbsCoverage } as Term2ConceptDataset,
  "term2-biochemistry": {
    catalog: biochemistryCatalog,
    index: biochemistryIndex,
    coverage: biochemistryCoverage,
  } as Term2ConceptDataset,
};

export function term2ConceptDataset(examId: Term2ExamId): Term2ConceptDataset | undefined {
  return datasets[examId];
}

export function hasTerm2ConceptDataset(examId: Term2ExamId): boolean {
  return Boolean(datasets[examId]);
}
