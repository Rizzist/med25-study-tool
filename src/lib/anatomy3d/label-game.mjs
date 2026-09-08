// Labels are IDs, never trusted drop text; grading is derived from the source catalog.
export function placeAnatomyLabel(assignments, locationId, labelId, locations, labels) {
  if (!locations.some(r=>r.id===locationId) || !labels.some(r=>r.id===labelId)) return assignments;
  const next=Object.fromEntries(Object.entries(assignments).filter(([id,label])=>id!==locationId&&label!==labelId));
  next[locationId]=labelId;
  return next;
}

export function gradeAnatomyLabels(assignments, locations, labels) {
  return labels.map(label=>{
    const locationId=Object.keys(assignments).find(id=>assignments[id]===label.id);
    const location=locations.find(item=>item.id===locationId);
    // Identically worded source labels are interchangeable, not arbitrary ID puzzles.
    const correct=Boolean(location&&(location.id===label.id||location.label.trim().toLowerCase()===label.label.trim().toLowerCase()));
    return {labelId:label.id,locationId,correct};
  });
}

export function restoreLabelBoard(raw, boardId, locations, labels) {
  try {
    const saved=JSON.parse(raw??'null');
    if(saved?.version!==1||saved.boardId!==boardId||!saved.assignments||typeof saved.assignments!=='object')return null;
    let assignments={};
    for(const [location,label] of Object.entries(saved.assignments))assignments=placeAnatomyLabel(assignments,location,label,locations,labels);
    const labelIds=labels.map(label=>label.id);
    const sameInventory=Array.isArray(saved.labelIds)&&saved.labelIds.length===labelIds.length&&saved.labelIds.every(id=>labelIds.includes(id))&&new Set(saved.labelIds).size===labelIds.length;
    return {assignments,graded:saved.graded===true&&sameInventory};
  }catch{return null;}
}
