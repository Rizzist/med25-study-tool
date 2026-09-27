import type {ReviewCourse} from './review-results.mjs';
export type GuidanceMode = 'guided' | 'unguided';
export type GuidedAnchors = {pdfSha256:string;sections?:Record<string,{page:number;top:number}>;questions:Record<string,{sectionId:string;page:number;top:number;quote:string}>};
export type GuidedReference = {sectionId:string;title:string;url:string;page:number;top:number;quote:string|null;precision:string;uncertain:boolean};
export const GUIDED_COURSES:string[];
export function supportsGuidedExam(exam:string):boolean;
export function guidanceMode(exam:string,value:unknown):GuidanceMode;
export function resolveGuidedReference(course:ReviewCourse|null,anchors:GuidedAnchors|null,questionId:string):GuidedReference|null;
