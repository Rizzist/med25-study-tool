export const MAX_ACADEMIC_TERM=30;
// This cohort was in Term 3 in September 2026. Keep the anchor fixed so a
// deployment or a delayed migration cannot restart its semester progression.
export const LEGACY_ACADEMIC_TERM_ANCHOR=Object.freeze({term:3,semesterIndex:2026*2+1});

const tehranCalendar=new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn',{timeZone:'Asia/Tehran',year:'numeric',month:'numeric'});

/** February starts the spring semester; September starts the fall semester. */
export function academicSemesterIndex(now=Date.now()){
  const parts=tehranCalendar.formatToParts(now),year=Number(parts.find(part=>part.type==='year').value),month=Number(parts.find(part=>part.type==='month').value);
  return year*2+(month>=9?1:month>=2?0:-1);
}

export function academicTermProblem(value){
  return Number.isInteger(value)&&value>=1&&value<=MAX_ACADEMIC_TERM?null:`Choose a whole-number term from 1 to ${MAX_ACADEMIC_TERM}.`;
}

export function isAcademicTermAnchor(value){
  return value!==null&&typeof value==='object'&&!Array.isArray(value)&&Number.isSafeInteger(value.term)&&value.term>=1&&Number.isSafeInteger(value.semesterIndex)&&value.semesterIndex>=0;
}

export function currentAcademicTerm(metadata,now=Date.now()){
  const anchor=metadata?.termAnchor===undefined?LEGACY_ACADEMIC_TERM_ANCHOR:metadata.termAnchor;
  if(!isAcademicTermAnchor(anchor))throw new TypeError('Invalid academic term anchor.');
  return anchor.term+Math.max(0,academicSemesterIndex(now)-anchor.semesterIndex);
}

export function defaultAcademicTerm(now=Date.now()){
  return currentAcademicTerm({termAnchor:LEGACY_ACADEMIC_TERM_ANCHOR},now);
}
