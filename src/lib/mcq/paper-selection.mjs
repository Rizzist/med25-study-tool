export function finalPaperKey(exam, collectionId) {
  const bank=exam==='term2-biochemistry'?'biochemistry-metabolism-past-papers':exam==='term2-nutrition'?'nutrition-past-papers':exam==='term2-religion'?'religion-past-papers':'telegram-past-papers';
  return `${exam}:${bank}${collectionId?':collection:'+collectionId:''}`;
}
export const COMBINED_PAPER_SELECTIONS_KEY='med25-combined-paper-selections-v1';
export function readCombinedSelections(raw) {
  try {
    const rows=JSON.parse(raw??'[]');if(!Array.isArray(rows))return [];
    return rows.filter(r=>r&&['july25','july29','term2-nutrition','term2-religion','term2-biochemistry'].includes(r.exam)&&/^combined-[a-f0-9]{64}$/.test(r.id)&&Array.isArray(r.sourcePaperIds)&&r.sourcePaperIds.length>0&&r.sourcePaperIds.length<=100&&r.sourcePaperIds.every(id=>typeof id==='string'&&/^[a-z0-9-]{1,180}$/.test(id))).slice(-100).map(r=>({id:r.id,exam:r.exam,sourcePaperIds:[...new Set(r.sourcePaperIds)]}));
  }catch{return [];}
}
export function paperAttemptSummary(progress,exam,collection) {
  const saved=progress?.sessions?.[finalPaperKey(exam,collection.id)];
  if(!saved||!Array.isArray(saved.questionIds)||!saved.answers||typeof saved.answers!=='object')return null;
  const ids=new Set(collection.gradedQuestionIds);
  const answers=Object.entries(saved.answers).filter(([id,a])=>ids.has(id)&&a&&typeof a.selectedOptionId==='string'&&typeof a.correct==='boolean');
  return {answered:answers.length,correct:answers.filter(([,a])=>a.correct).length,total:ids.size,completedAt:typeof saved.completedAt==='string'&&answers.length===ids.size?saved.completedAt:null};
}
export async function combinedSourceSelection(collections, selectedIds) {
  const selected=collections.filter(c=>selectedIds.includes(c.id)&&c.gradedQuestionIds.length).sort((a,b)=>a.id.localeCompare(b.id));
  if(!selected.length)throw new Error('Select at least one paper with scored questions.');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(selected.map(c=>c.id))));
  const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  return {id:'combined-'+hash,title:`Combined papers · ${selected.length} source collections`,gradedQuestionIds:[...new Set(selected.flatMap(c=>c.gradedQuestionIds))],sourcePaperIds:selected.map(c=>c.id)};
}
