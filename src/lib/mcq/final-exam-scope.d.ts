import type { MCQQuestion } from "@/src/lib/mcq/types";

export function isCarbohydrateOrLipidMetabolism(question: MCQQuestion): boolean;
export function filterFinalExamQuestions(
  questions: MCQQuestion[],
  excludeCarbohydrateLipidMetabolism: boolean,
): MCQQuestion[];
