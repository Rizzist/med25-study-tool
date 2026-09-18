import type {Paper} from './cvs-paper-state.mjs';
export type CoreExamManifest = {
  revision:string;fingerprint:string;title:string;description:string;limitation:string;methodology:string;
  evidencePaperIds:string[];subjects:Array<{id:string;title:string;count:number}>;
  questions:Array<{questionId:string;paperId:string;subjectId:string;topicId:string;topicTitle:string;evidencePaperIds:string[];topicPaperCount:number}>;
};
export function coreExamId(scope?:'all'|'anatomy'):string;
export function createCoreExam(manifest:CoreExamManifest,papers:Paper[],scope?:'all'|'anatomy'):Paper;
