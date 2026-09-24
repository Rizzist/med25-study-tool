export function coreSelection(manifest,scope='all') {
  const section=manifest.sections.find(s=>s.id===scope);
  if(!['all','repeats'].includes(scope)&&!section)throw Error('Unknown Core Exam section.');
  const rows=manifest.questions.filter(q=>scope==='all'||(scope==='repeats'?q.kind==='repeat':q.sectionId===scope));
  if(!rows.length)throw Error('No Core Exam questions in this section.');
  const ids=rows.map(r=>r.questionId);
  if(new Set(ids).size!==ids.length)throw Error('Duplicate Core Exam representative.');
  const suffix=section?section.id.split('/').at(-1):scope;
  return {id:`${manifest.idPrefix??'biochemistry-core'}-${suffix}`,title:`${manifest.title?.replace(/ Exam$/,'')??'Biochemistry Core'} · ${section?.title??(scope==='repeats'?'Repeated patterns':'Full core')} · ${rows.length}`,
    gradedQuestionIds:ids,independent:true,coreEvidence:Object.fromEntries(rows.map(r=>[r.questionId,r]))};
}
/** Curated ordering is authoritative. Missing members must not silently shorten a test. */
export function selectCollectionQuestions(questions,collection) {
  if(!collection)return questions;
  const byId=new Map(questions.map(q=>[q.id,q]));
  const selected=collection.gradedQuestionIds.map(id=>byId.get(id));
  if(collection.independent&&selected.some(q=>!q))throw Error('Core Exam and question bank versions differ. Reload when online to update both; no partial test was started.');
  return selected.filter(Boolean);
}
export function finalSessionSeed(sessions,key,baseKey,collection,initialIntent,filtered=false) {
  if(initialIntent==='new')return null;
  return sessions[key]??(!collection?.independent&&(collection||filtered)?sessions[baseKey]??sessions[baseKey+':no-carb-lipid-metabolism']:null);
}
