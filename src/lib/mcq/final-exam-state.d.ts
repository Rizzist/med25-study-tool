import type { MCQQuestion } from "@/src/lib/mcq/types";

export const FINAL_EXAM_STORAGE_KEY: "med25-final-exam-v1";
export const FINAL_EXAM_SESSION_KEYS: {
  readonly july25Telegram: "july25:telegram-past-papers";
  readonly july29Telegram: "july29:telegram-past-papers";
  readonly july29Downloaded: "july29:downloaded-core";
};

export type StoredFinalAnswer = {
  selectedOptionId: string;
  correct: boolean;
  answeredAt: string;
  questionRevision: number;
  correctOptionId: string;
};

export type StoredFinalExamSession = {
  bankFingerprint: string;
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, StoredFinalAnswer>;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type StoredFinalExamProgress = {
  version: 2;
  sessions: Record<
    "july25:telegram-past-papers" | "july29:telegram-past-papers" | "july29:downloaded-core",
    StoredFinalExamSession | null
  >;
};

export function emptyFinalExamProgress(): StoredFinalExamProgress;
export function reconcileFinalExamSession(
  value: Partial<StoredFinalExamSession> | null | undefined,
  questions: MCQQuestion[],
  fingerprint: string,
): StoredFinalExamSession;
export function parseFinalExamProgress(
  raw: string | null,
  banks?: Partial<Record<
    "july25:telegram-past-papers" | "july29:telegram-past-papers" | "july29:downloaded-core",
    { questions: MCQQuestion[]; fingerprint: string }
  >>,
): StoredFinalExamProgress;
