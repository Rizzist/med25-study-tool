import type { Paper, PaperTopicMap } from './cvs-paper-state.mjs';

export type CvsScope = 'all' | 'physio' | 'non-physio';
export const CVS_SCOPES: Array<{ id: CvsScope; label: string }>;
export function isCvsScope(value: unknown): value is CvsScope;
export function normalizeCvsScope(value: unknown): CvsScope;
export function savedCvsScope(exam: string, value: unknown): CvsScope;
export function requestedCvsScope(exam: string, value: unknown): CvsScope;
export function cvsScopeLabel(scope?: CvsScope): string;
export function matchesCvsPracticeScope(question: { subject?: string } | null | undefined, scope?: CvsScope): boolean;
export function matchesCvsPaperScope(mapping: { subjectId?: string; topicId?: string } | null | undefined, scope?: CvsScope): boolean;
export function scopedCvsPaperId(id: string, scope?: CvsScope): string;
export function cvsPaperScopeFingerprint(fingerprint: string, questionIds: readonly string[], scope?: CvsScope): string;
export function scopeCvsPaper(paper: Paper, scope?: CvsScope, topicMap?: Pick<PaperTopicMap, 'questions'> | null): Paper;
