import type { MCQQuestion } from "./types";

export function selectTerm2Sprint(
  items: MCQQuestion[],
  options?: {
    limit?: number;
    seenIds?: string[];
    repairIds?: string[];
    studyMode?: string;
    random?: () => number;
  },
): {
  questions: MCQQuestion[];
  repairCount: number;
  unseenCount: number;
  reviewCount: number;
  ordinaryReviewCount: number;
};
