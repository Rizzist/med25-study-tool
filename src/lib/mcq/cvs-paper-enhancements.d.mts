import type { Paper, PaperQuestion } from './cvs-paper-state.mjs';
export type AiAnswer = {answer:string|null;explanation:string;confidence:'high'|'moderate'|'unresolved';references:Array<{title:string;url:string}>;caveat?:string;questionHash:string;reviewStatus:'verified';reviewer?:string;correctedPrompt?:string;correctedOptions?:string[];sourcePageVerified?:boolean};
export type AnswerOverlay = {revision:string;questions:Record<string,AiAnswer>};
export function answerResolution(question:PaperQuestion):{key:string|null;kind:'source'|'ai'|'unresolved'};
export function questionContentHash(question:PaperQuestion):Promise<string>;
export function applyAnswerOverlay(paper:Paper,overlay:AnswerOverlay|null):Promise<Paper>;
export function combinedPaperId(paperIds:string[]):string;
export function createCombinedPaper(papers:Paper[]):Paper;
