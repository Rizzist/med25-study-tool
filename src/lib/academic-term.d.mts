export type AcademicTermAnchor={term:number;semesterIndex:number};
export type AcademicTermMetadata={termAnchor?:AcademicTermAnchor};
export const MAX_ACADEMIC_TERM:number;
export const LEGACY_ACADEMIC_TERM_ANCHOR:Readonly<AcademicTermAnchor>;
export function academicSemesterIndex(now?:number|Date):number;
export function academicTermProblem(value:unknown):string|null;
export function isAcademicTermAnchor(value:unknown):value is AcademicTermAnchor;
export function currentAcademicTerm(metadata?:AcademicTermMetadata|null,now?:number|Date):number;
export function defaultAcademicTerm(now?:number|Date):number;
