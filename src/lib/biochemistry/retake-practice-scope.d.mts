export type RetakePracticeChapter = {id: string; chapterLabel: string; title: string; coverage: 'confirmed' | 'supplementary'};
export type RetakePracticeChapterIndex = {id: string; questionCount: number; questionIds: string[]}[];
export const RETAKE_PRACTICE_CHAPTERS: RetakePracticeChapter[];
export const DEFAULT_RETAKE_CHAPTER_IDS: string[];
export function isRetakeChapterIndexReady(value: unknown): value is RetakePracticeChapterIndex;
export function sanitizeRetakeChapterIds(value: unknown): string[] | undefined;
export function retakeChapterQuestionIds(index: RetakePracticeChapterIndex | undefined, selectedIds: string[]): string[];
export function retakeChapterSelectionLabel(ids: string[] | undefined): string | undefined;
