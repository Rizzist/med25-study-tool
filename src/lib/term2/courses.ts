import biochemistryCatalog from "@/data/term2/biochemistry-course.json";
import cvsCatalog from "@/data/term2/cvs-course.json";
import limbsCatalog from "@/data/term2/limbs-course.json";
import type { Term2ExamId } from "@/src/lib/mcq/exams.mjs";
import type { Term2CourseCatalog } from "./course";

const catalogs: Partial<Record<Term2ExamId, Term2CourseCatalog>> = {
  "term2-cvs": cvsCatalog as Term2CourseCatalog,
  "term2-limbs": limbsCatalog as Term2CourseCatalog,
  "term2-biochemistry": biochemistryCatalog as Term2CourseCatalog,
};

export function term2CourseCatalog(examId: Term2ExamId): Term2CourseCatalog | undefined {
  return catalogs[examId];
}

export function hasTerm2CourseCatalog(examId: Term2ExamId): boolean {
  return Boolean(catalogs[examId]);
}
