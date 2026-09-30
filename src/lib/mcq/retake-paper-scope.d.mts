import type {ExamCollection} from './curated-core.mjs';
export type RetakePaperScope='biochemistry'|'full';
export function scopeRetakePaper<T extends ExamCollection>(paper:T & {fullPaper?:T},scope?:RetakePaperScope):T;
export function retakeBankSelection(papers:ExamCollection[],scope?:RetakePaperScope):ExamCollection;
