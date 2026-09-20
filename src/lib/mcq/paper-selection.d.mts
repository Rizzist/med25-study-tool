type Collection={id:string;gradedQuestionIds:string[]};
export const COMBINED_PAPER_SELECTIONS_KEY:string;
export function readCombinedSelections(raw:string|null):Array<{id:string;exam:string;sourcePaperIds:string[]}>;
export function finalPaperKey(exam:string,collectionId?:string):string;
export function paperAttemptSummary(progress:unknown,exam:string,collection:Collection):null|{answered:number;correct:number;total:number;completedAt:string|null};
export function combinedSourceSelection(collections:Collection[],selectedIds:string[]):Promise<{id:string;title:string;gradedQuestionIds:string[];sourcePaperIds:string[]}>;
