/** A review section is a navigation link, not evidence that untested material is mastered. */
export function reviewBreakdown(outcomes,course) {
  const groups=new Map(),seen=new Set();
  for(const item of outcomes) {
    if(seen.has(item.questionId))continue;seen.add(item.questionId);
    const mapping=course?.questions?.[item.questionId];
    const section=course?.sections?.find(s=>s.id===mapping?.sectionId);
    const uncertain=Boolean(mapping?.uncertain);
    const id=course?(section?(uncertain?'suggested:':'')+section.id:'unmapped'):(item.topic||'Other topics');
    let row=groups.get(id);
    if(!row){row={id,sectionId:section?.id,title:section?.title||(course?'Not yet matched to a review section':item.topic||'Other topics'),uncertain,correct:0,answered:0,skipped:0,ungraded:0,total:0,missedIds:[],wrongIds:[]};groups.set(id,row);}
    row.total++;
    if(!item.answered){row.skipped++;row.missedIds.push(item.questionId);continue;}
    if(item.gradable===false){row.ungraded++;continue;}
    row.answered++;if(item.correct)row.correct++;else {row.missedIds.push(item.questionId);row.wrongIds.push(item.questionId);}
  }
  return [...groups.values()].map(row=>({...row,percent:row.answered?Math.round(row.correct/row.answered*100):null})).sort((a,b)=>((a.percent??-1)-(b.percent??-1))||b.total-a.total);
}
