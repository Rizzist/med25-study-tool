import {answerResolution} from './cvs-paper-enhancements.mjs';
export const NON_CORE_ANATOMY_ID='cvs-noncore-anatomy';
export function createNonCoreAnatomyExam(manifest,papers,core) {
  if(manifest.coreFingerprint!==core.fingerprint) throw Error('The anatomy selection needs a refresh after the Core Exam update.');
  if(!manifest.questions.length) throw Error('The non-core anatomy selection is unavailable.');
  const coreIds=new Set(core.questions.flatMap(row=>[row.questionId,...row.repeatMatches.map(m=>m.questionId)]));
  const sources=new Map(papers.map(p=>[p.id,p]));
  const questions=manifest.questions.map(row=>{
    const source=sources.get(row.paperId),q=source?.questions.find(q=>q.id===row.questionId);
    if(row.subjectId!=='anatomy'||coreIds.has(row.questionId)) throw Error('An overlapping or non-anatomy question cannot enter this set.');
    if(!q||!answerResolution(q).key||source.fingerprint!==manifest.sourceFingerprints[source.id]) throw Error('A non-core anatomy source or answer could not load. Please retry; no ungraded substitute will be used.');
    return {...q,originPaper:{id:source.id,title:source.title,sourceUrl:source.sourceUrl,transcriptUrl:source.transcriptUrl}};
  });
  if(new Set(questions.map(q=>q.id)).size!==questions.length) throw Error('Duplicate non-core anatomy question.');
  return {id:NON_CORE_ANATOMY_ID,title:`Non-core Anatomy · ${questions.length} questions`,
    fingerprint:manifest.fingerprint,questions,aiRevision:papers.map(p=>p.aiRevision||'').join('|'),
    note:'Complementary past-paper revision, excluding Core and known repeated variants. Not a separate historical exam.',
    keyStatus:'mixed',sourceUrl:'',transcriptUrl:''};
}
