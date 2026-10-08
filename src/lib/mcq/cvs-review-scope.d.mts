import type {ReviewCourse} from './review-results.mjs';
import type {CvsScope} from './cvs-scope.mjs';
export const CVS_PHYSIO_REVIEW:{schemaVersion:number;examId:string;scope:string;sourceVolumeId:string;sourcePdfSha256:string;authoringSha256:string;contentSha256:string;rendererSha256:string;volume:ReviewCourse['volumes'][number];sections:ReviewCourse['sections']};
export function reviewVolumes(course:ReviewCourse,cvsScope?:CvsScope):ReviewCourse['volumes'];
export function reviewSectionUrl(course:ReviewCourse,sectionId:string,cvsScope?:CvsScope):string|undefined;
export function reviewSections(course:ReviewCourse,cvsScope?:CvsScope,allowedQuestionIds?:string[]):ReviewCourse['sections'];
export function reviewPracticeBySection(course:ReviewCourse|null,allowedQuestionIds?:string[]):Map<string,{ids:string[];suggested:number}>;
