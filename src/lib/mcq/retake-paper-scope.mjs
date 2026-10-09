/** Separate saved attempts while retaining the original biochemistry-only IDs. */
export function scopeRetakePaper(paper,scope='biochemistry') {
 if(scope==='distilled'&&!paper.distilled)throw new Error(`Distilled paper is unavailable: ${paper.id}`);
 if(scope==='full') {
  if(!paper.fullPaper)throw new Error(`Full paper is unavailable: ${paper.id}`);
  return paper.fullPaper;
 }
 return paper;
}
export function retakeBankSelection(papers,scope='biochemistry') {
 if(scope==='distilled'&&papers.some(p=>!p.distilled))throw new Error('The distilled paper catalog is unavailable.');
 return {id:`retake-all-${scope}`,title:scope==='distilled'?'All Biochem I papers · Distilled':scope==='full'?'All full Cells & Molecules papers':'All biochemistry-only papers',gradedQuestionIds:[...new Set(papers.flatMap(p=>p.gradedQuestionIds))],independent:true,...(papers.some(p=>p.takeableQuestionIds)?{takeableQuestionIds:[...new Set(papers.flatMap(p=>p.takeableQuestionIds??p.gradedQuestionIds))]}:{})};
}

/** Reject mixed/legacy catalog payloads; the retake hub must never fall back to them. */
export function assertDistilledRetakeCourse(course) {
 if(course?.id!=='term1-biochemistry-retake'||!Array.isArray(course.collections)||!course.collections.length)throw new Error('The distilled retake catalog is unavailable. Reconnect and reload.');
 const seen=new Set();
 for(const paper of course.collections){
  if(!paper.distilled||!paper.independent||!paper.originalCollectionId||paper.id!==paper.originalCollectionId+'-distilled'||paper.fullPaper||!paper.title?.endsWith(' · Distilled')||seen.has(paper.id)||!['questions','answerKey','questionsAndKey'].every(k=>typeof paper.downloads?.[k]==='string'&&paper.downloads[k].endsWith('-distilled.md')))throw new Error('The distilled retake catalog is incomplete. Reconnect and reload.');
  seen.add(paper.id);
 }
 return course;
}
/** Generated paper PDFs have an explicit trailing scope marker; originals keep their names. */
export function retakePdfFilename(stem,distilled=false) {
 return `${stem}${distilled&&!stem.endsWith('-distilled')?'-distilled':''}.pdf`;
}
