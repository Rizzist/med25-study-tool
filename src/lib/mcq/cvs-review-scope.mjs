import physiology from '../../../public/study/reviews/cvs-physio.json' with {type:'json'};
import nonPhysiology from '../../../public/study/reviews/cvs-nonphysio.json' with {type:'json'};

export const CVS_PHYSIO_REVIEW=physiology;
export const CVS_NONPHYSIO_REVIEW=nonPhysiology;
const physiologyIds=new Set(physiology.sections.map(section=>section.id));
const nonPhysiologyIds=new Set(nonPhysiology.sections.map(section=>section.id));
const scopedReview=cvsScope=>cvsScope==='physio'?physiology:cvsScope==='non-physio'?nonPhysiology:null;
export function reviewVolumes(course,cvsScope='all'){
  if(course.examId!=='term2-cvs'||cvsScope==='all')return course.volumes;
  return [scopedReview(cvsScope).volume];
}
export function reviewSectionUrl(course,sectionId,cvsScope='all'){
  const scoped=course.examId==='term2-cvs'?scopedReview(cvsScope):null;
  const section=(scoped?scoped.sections:course.sections).find(item=>item.id===sectionId);
  const volume=reviewVolumes(course,cvsScope).find(item=>item.id===section?.volumeId);
  return section&&volume?volume.url+'#page='+section.pdfPage:undefined;
}
export function reviewSections(course,cvsScope='all',allowedQuestionIds){
  if(course.examId!=='term2-cvs'||cvsScope==='all')return course.sections;
  const mapped=new Set((allowedQuestionIds??[]).map(id=>course.questions[id]).filter(mapping=>mapping?.livePractice).map(mapping=>mapping.sectionId));
  if(cvsScope==='non-physio'){
    // Book order first, then canonical sections the book does not cover (kept for practice labels only).
    const uncovered=course.sections.filter(section=>!nonPhysiologyIds.has(section.id)&&(!physiologyIds.has(section.id)||mapped.has(section.id)));
    return [...nonPhysiology.sections,...uncovered.map(section=>({...section,volumeId:nonPhysiology.volume.id}))];
  }
  // A physiology question can map to an integrated anatomy section. Preserve its
  // practice label without ever linking that section to the full review PDF.
  return [...physiology.sections,...course.sections.filter(section=>!physiologyIds.has(section.id)&&mapped.has(section.id)).map(section=>({...section,volumeId:physiology.volume.id}))];
}
export function reviewPracticeBySection(course,allowedQuestionIds){
  const allowed=allowedQuestionIds===undefined?null:new Set(allowedQuestionIds),grouped=new Map();
  for(const [id,mapping] of Object.entries(course?.questions??{})){
    if(!mapping.livePractice||!mapping.sectionId||allowed&&!allowed.has(id))continue;
    const row=grouped.get(mapping.sectionId)??{ids:[],suggested:0};
    row.ids.push(id);if(mapping.uncertain)row.suggested++;grouped.set(mapping.sectionId,row);
  }
  return grouped;
}
/** Page link into the non-physiology book for a bare topic/section id (past-paper topics share these ids). */
export function nonPhysioReviewLink(sectionId){
  const section=sectionId?nonPhysiology.sections.find(item=>item.id==='cvs/'+sectionId):undefined;
  return section?{title:section.bookTitle,page:section.pdfPage,url:nonPhysiology.volume.url+'#page='+section.pdfPage,documentTitle:nonPhysiology.volume.title}:undefined;
}
