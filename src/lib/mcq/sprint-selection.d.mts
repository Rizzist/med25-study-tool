export type SprintQuestion = { id: string };

export type SprintSelectionOptions = {
  limit: number;
  seenIds?: string[];
  repairIds?: string[];
  random?: () => number;
};

export type SprintSelection<T extends SprintQuestion> = {
  questions: T[];
  repairCount: number;
  unseenCount: number;
  reviewCount: number;
  ordinaryReviewCount: number;
};

export function selectCoverageSprint<T extends SprintQuestion>(
  items: T[],
  options: SprintSelectionOptions,
): SprintSelection<T>;

export type SessionCompletion = {
  seenIds: string[];
  untouchedIds: string[];
  unansweredIds: string[];
  repairIds: string[];
  correctIds: string[];
};

export function classifySessionCompletion(
  questionIds: string[],
  options?: {
    visitedIds?: string[];
    answeredIds?: string[];
    correctIds?: string[];
  },
): SessionCompletion;
