import type {Paper} from './cvs-paper-state.mjs';
import type {CoreExamManifest} from './cvs-core-exam.mjs';
type SourceItem={questionId:string;paperId:string;prompt:string;sourcePage:string};
export type NonCoreAnatomyManifest={
  revision:string;title:string;fingerprint:string;coreFingerprint:string;
  description:string;methodology:string;limitation:string;candidateCount:number;
  sourceFingerprints:Record<string,string>;
  questions:Array<{questionId:string;paperId:string;subjectId:string;topicId:string;topicTitle:string;hasImage:boolean;duplicateMatches:SourceItem[]}>;
  excludedCore:Array<SourceItem & {representedBy:string;reason:string}>;
  duplicates:Array<SourceItem & {representedBy:string}>;
  withheld:Array<SourceItem & {reason:string}>;
};
export const NON_CORE_ANATOMY_ID:string;
export function createNonCoreAnatomyExam(manifest:NonCoreAnatomyManifest,papers:Paper[],core:CoreExamManifest):Paper;
