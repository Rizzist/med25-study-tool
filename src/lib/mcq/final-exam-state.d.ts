import type { MCQQuestion } from "@/src/lib/mcq/types";

export const FINAL_EXAM_STORAGE_KEY: "med25-final-exam-v1";
export const FINAL_EXAM_SESSION_KEYS: {
  readonly july25Telegram: "july25:telegram-past-papers";
  readonly july29Telegram: "july29:telegram-past-papers";
  readonly july29Downloaded: "july29:downloaded-core";
  readonly july29TelegramWithoutCarbLipidMetabolism: "july29:telegram-past-papers:no-carb-lipid-metabolism";
  readonly july29DownloadedWithoutCarbLipidMetabolism: "july29:downloaded-core:no-carb-lipid-metabolism";
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
    | "july25:telegram-past-papers"
    | "july29:telegram-past-papers"
    | "july29:downloaded-core"
    | "july29:telegram-past-papers:no-carb-lipid-metabolism"
    | "july29:downloaded-core:no-carb-lipid-metabolism",
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
    | "july25:telegram-past-papers"
    | "july29:telegram-past-papers"
    | "july29:downloaded-core"
    | "july29:telegram-past-papers:no-carb-lipid-metabolism"
    | "july29:downloaded-core:no-carb-lipid-metabolism",
    { questions: MCQQuestion[]; fingerprint: string }
  >>,
): StoredFinalExamProgress;
