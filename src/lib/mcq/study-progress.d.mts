import type { ExamId } from "./exams.mjs";
export type StudyProgress = { version: 1; exams: Record<ExamId, { wrongIds: string[]; flaggedIds: string[] }> };
export function createEmptyProgress(): StudyProgress;
export function parseProgress(raw: string | null): StudyProgress;
