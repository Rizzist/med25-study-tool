// Verified source relationships, not title/date guesses. Keep the scored IDs so saved attempts survive.
const links={
  july25:{
    'tissue-test20162':'july25-test-20162',
    'tissue-test22204':'july25-test-22204',
    // The original term1-source-8 cover and first questions match both new versions.
    'tissue-jan2023':'july25-tdf-2022',
    'tissue-2023-annotated':'july25-tdf-2022',
  },
  july29:{'cell-feb2021-answers':'july29-telegram-source-collection'},
  'term1-biochemistry-retake':{'cell-feb2021-answers':'retake-february-2021'},
};
// This downloaded version is byte-identical to the existing original.
const equivalentOriginals={'cell-feb2021-answers':'/study/past-paper-downloads/originals/term1-source-3.pdf'};
export function hasAdditionalPastPapers(exam){return Object.hasOwn(links,exam);}

/** Attach original provenance to canonical paper collections; preserve legacy IDs and attempts. */
export function mergePastPaperSources(course,catalog){
  if(!course||!hasAdditionalPastPapers(course.id)||!catalog)return course;
  const collections=course.collections.map(item=>({...item,sourcePapers:[]}));
  for(const paper of catalog.papers.filter(p=>p.course===(course.id==='july25'?'tissue':'biochemistry'))){
    const linkedId=links[course.id][paper.id];
    const existing=collections.find(item=>item.sourcePaperIds?.includes(paper.id))??collections.find(item=>item.id===linkedId||item.id===`${linkedId}--full`);
    if(existing){existing.sourcePapers.push({...paper,duplicateOfUrl:equivalentOriginals[paper.id]});continue;}
    collections.push({
      id:paper.id,courseId:course.id,title:paper.title,note:paper.note,kind:paper.kind,
      courseMatch:paper.scope==='supplement'?'supplement':'source-course',defaultEligible:paper.scope==='course',
      sourceOnly:true,sourceRecordCount:0,gradedQuestionCount:0,ungradedCount:0,gradedQuestionIds:[],questionIds:[],
      date:paper.date,downloads:{questions:'',answerKey:'',questionsAndKey:''},originals:[],sourcePapers:[paper],
    });
  }
  return {...course,collections};
}

export function filterPastPapers(papers,query='',filter='all'){
  const needle=query.trim().toLowerCase();
  return papers.filter(paper=>{
    const sources=paper.sourcePapers??[];
    const kind=paper.kind==='source-collection'||paper.kind==='source-paper-selection'?'theory':paper.kind;
    const matches=filter==='all'||(filter==='scored'?(paper.takeableQuestionIds?.length??paper.gradedQuestionCount)>0:filter==='supplement'?!paper.defaultEligible:filter==='course'?paper.defaultEligible:kind===filter||sources.some(p=>p.kind===filter));
    return matches&&[paper.title,paper.note,...sources.flatMap(p=>[p.title,p.note,p.source])].join(' ').toLowerCase().includes(needle);
  });
}
