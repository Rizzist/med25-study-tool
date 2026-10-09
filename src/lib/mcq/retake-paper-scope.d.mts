import type {ExamCollection} from './curated-core.mjs';
export type RetakePaperScope='biochemistry'|'full'|'distilled';
export function scopeRetakePaper<T extends ExamCollection>(paper:T & {fullPaper?:T},scope?:RetakePaperScope):T;
export function retakeBankSelection(papers:ExamCollection[],scope?:RetakePaperScope):ExamCollection;

export function assertDistilledRetakeCourse<T extends {id:string;collections:import('../../components/PaperDownloads').DownloadCollection[]}>(course:T):T;
export function retakePdfFilename(stem:string,distilled?:boolean):string;
