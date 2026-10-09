import type {DownloadCollection} from '../../components/PaperDownloads';
export type SourcePaper={id:string;title:string;course:'tissue'|'biochemistry';kind:string;scope:'course'|'supplement';note:string;source:string;date:string|null;url:string;format:string;pages:number|null;duplicateOfUrl?:string};
export type SourcePaperCatalog={papers:SourcePaper[]};
export function hasAdditionalPastPapers(exam:string):boolean;
export function mergePastPaperSources<T extends {id:string;collections:DownloadCollection[]}>(course:T|undefined,catalog:SourcePaperCatalog|null):T|undefined;
export function filterPastPapers(papers:DownloadCollection[],query?:string,filter?:string):DownloadCollection[];
