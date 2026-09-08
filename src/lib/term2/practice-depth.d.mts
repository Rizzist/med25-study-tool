export type PracticeDepth = 'all' | 'core' | 'challenge';
export type DepthEntry = { subject: string; kind: string; dedupeKey?: string; difficulty?: number; knowledgeLevel?: 'core' | 'challenge'; tags?: string[] };
export function questionDepth(question: DepthEntry): 'core' | 'challenge';
export function filterDepthIds(ids: string[], index: Record<string, DepthEntry>, depth?: PracticeDepth): string[];
export function depthSummary(index: Record<string, DepthEntry>): Array<{subject: string; total: number; core: string[]; challenge: string[]; distinctTargets: number; written: number}>;
