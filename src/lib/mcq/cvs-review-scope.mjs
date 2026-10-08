import physiology from '../../../public/study/reviews/cvs-physio.json' with {type:'json'};

export const CVS_PHYSIO_REVIEW=physiology;
const physiologyIds=new Set(physiology.sections.map(section=>section.id));
export function reviewVolumes(course,cvsScope='all'){
  if(course.examId!=='term2-cvs'||cvsScope==='all')return course.volumes;
  return cvsScope==='physio'?[physiology.volume]:[];
}
export function reviewSectionUrl(course,sectionId,cvsScope='all'){
  if(course.examId==='term2-cvs'&&cvsScope==='non-physio')return undefined;
  const section=course.examId==='term2-cvs'&&cvsScope==='physio'?physiology.sections.find(item=>item.id===sectionId):course.sections.find(item=>item.id===sectionId);
  const volume=reviewVolumes(course,cvsScope).find(item=>item.id===section?.volumeId);
  return section&&volume?volume.url+'#page='+section.pdfPage:undefined;
}
export function reviewSections(course,cvsScope='all',allowedQuestionIds){
  if(course.examId!=='term2-cvs'||cvsScope==='all')return course.sections;
  const mapped=new Set((allowedQuestionIds??[]).map(id=>course.questions[id]).filter(mapping=>mapping?.livePractice).map(mapping=>mapping.sectionId));
  if(cvsScope==='non-physio')return course.sections.filter(section=>!physiologyIds.has(section.id)||mapped.has(section.id));
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
