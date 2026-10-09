/** Separate saved attempts while retaining the original biochemistry-only IDs. */
export function scopeRetakePaper(paper,scope='biochemistry') {
 if(scope==='full') {
  if(!paper.fullPaper)throw new Error(`Full paper is unavailable: ${paper.id}`);
  return paper.fullPaper;
 }
 return paper;
}
export function retakeBankSelection(papers,scope='biochemistry') {
 return {id:`retake-all-${scope}`,title:scope==='full'?'All full Cells & Molecules papers':'All biochemistry-only papers',gradedQuestionIds:[...new Set(papers.flatMap(p=>p.gradedQuestionIds))],independent:true,...(papers.some(p=>p.takeableQuestionIds)?{takeableQuestionIds:[...new Set(papers.flatMap(p=>p.takeableQuestionIds??p.gradedQuestionIds))]}:{})};
}
