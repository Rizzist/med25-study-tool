export type PaperQuestion = {id:string;number:string;page:number;prompt:string;options:string[];providedKey:string|null;scoringKey:string|null;keyNote:string;issues:string[];sourcePage:string;media?:string};
export type Paper = {id:string;title:string;fingerprint:string;questions:PaperQuestion[];note:string;sourceUrl:string;keyStatus:string;transcriptUrl:string};
export type PaperFeedbackMode = 'instant'|'deferred';
export type PaperQuestionFeedback = 'unanswered'|'correct'|'incorrect'|'ungraded';
export type PaperAttempt = {paperId:string;fingerprint:string;answers:Record<string,string>;index:number;startedAt:string;completedAt:string|null;manual:Record<string,string>;feedbackMode?:PaperFeedbackMode};
export type PaperCounts = {
  total:number; answered:number; correct:number; incorrect:number; unanswered:number; ungraded:number;
  manualCorrect:number; manualIncorrect:number; sourceKeyed:number; percentage:number|null;
};
export type PaperReviewIds = {wrongQuestionIds:string[];missedQuestionIds:string[];ungradedQuestionIds:string[]};
export type PaperSectionStats = PaperCounts & PaperReviewIds & {id:string;label:string;title:string;subjectId?:string;questionIds:string[]};
export type PaperBreakdown = PaperReviewIds & {overall:PaperCounts;subjects:PaperSectionStats[];topics:PaperSectionStats[]};
export type PaperTopicMap = {
  subjects:Array<{id:string;label?:string;title?:string}>;
  topics:Array<{id:string;label?:string;title?:string;subjectId?:string;reviewLocator?:{documentTitle?:string;sectionId?:string;sectionTitle?:string}}>;
  questions:Record<string,{subjectId?:string;topicId?:string}>;
};
export type PaperResult = {paperId:string;fingerprint:string;completedAt:string;total:number;keyed:number;matched:number;unanswered:number;manualCorrect:number;manualGraded:number;ungraded:number;percentage:number|null;sectionStats?:PaperBreakdown};
export type PaperProgress = {version:1;attempts:Record<string,PaperAttempt>;latest:Record<string,PaperResult>};
export const CVS_PAPER_STORAGE_KEY:string;
export function emptyPaperProgress():PaperProgress;
export function readPaperProgress(raw:string|null):PaperProgress;
export function newPaperAttempt(paper:Paper,now?:string,feedbackMode?:PaperFeedbackMode):PaperAttempt;
export function restorePaperAttempt(saved:PaperAttempt|undefined,paper:Paper):PaperAttempt|null;
export function answerPaperQuestion(paper:Paper,attempt:PaperAttempt,questionId:string,value:string):PaperAttempt;
export function questionFeedback(question:PaperQuestion,answer:string|undefined):PaperQuestionFeedback;
export function gradePaperBreakdown(paper:Paper,attempt:PaperAttempt,topicMap?:PaperTopicMap|null):PaperBreakdown;
export function gradePaper(paper:Paper,attempt:PaperAttempt,now?:string):PaperResult;
