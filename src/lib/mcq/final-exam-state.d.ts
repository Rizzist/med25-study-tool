import type { MCQQuestion } from "@/src/lib/mcq/types";

export const FINAL_EXAM_STORAGE_KEY: "med25-final-exam-v1";

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
  version: 1;
  exams: Record<"july25" | "july29", StoredFinalExamSession | null>;
};

export function emptyFinalExamProgress(): StoredFinalExamProgress;
export function reconcileFinalExamSession(
  value: Partial<StoredFinalExamSession> | null | undefined,
  questions: MCQQuestion[],
  fingerprint: string,
): StoredFinalExamSession;
export function parseFinalExamProgress(
  raw: string | null,
  banks?: Partial<Record<"july25" | "july29", { questions: MCQQuestion[]; fingerprint: string }>>,
): StoredFinalExamProgress;
