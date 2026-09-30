import type {DownloadCollection} from '@/src/components/PaperDownloads';
export type LimbScope = 'all'|'upper'|'lower';
export const LIMB_SCOPES: LimbScope[];
export function scopeLimbPaper(paper:DownloadCollection,scope?:LimbScope):DownloadCollection;
export function limbBankSelection(papers:DownloadCollection[],scope:LimbScope):{id:string;title:string;gradedQuestionIds:string[]};
