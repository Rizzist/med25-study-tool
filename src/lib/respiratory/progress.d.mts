type QuestionIndex = Record<string, { dedupeKey?: string }>;
export function distinctQuestionIds(ids: string[], index?: QuestionIndex): string[];
export function questionProgress(ids: string[], attemptedIds?: string[], repairIds?: string[], index?: QuestionIndex): { total: number; attempted: number; repair: number };
export function parseConceptReading(raw: string | null, validIds: string[]): string[];
export function normalizeRespiratoryPractice(exam: unknown, scopeId: unknown, poolIds: unknown, index: Record<string, { conceptIds: string[]; moduleIds: string[] }>): { respiratoryScopeId?: string; respiratoryPracticeIds?: string[] };
