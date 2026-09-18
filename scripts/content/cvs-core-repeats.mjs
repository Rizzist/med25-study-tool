// Conservative wording-pattern matching. Does not equate topic frequency with repeats.
import {answerResolution} from '../../src/lib/mcq/cvs-paper-enhancements.mjs';
export function normalizeQuestionText(text) {
  return text.normalize('NFKD').toLowerCase()
    .replace(/\b(aries|arise|arises)\b/g,'arise')
    .replace(/\b(ventericle|ventricle)\b/g,'ventricle')
    .replace(/\b(champer|chamber)\b/g,'chamber')
    .replace(/\b(hemizygous|hemiazygous|hemiazygos)\b/g,'hemiazygos')
    .replace(/\b(azygous|azygos)\b/g,'azygos')
    .replace(/\b(sin[uoa][ -]?atrial|sinu-atrial|sinoatrial)\b/g,'sinoatrial')
    .replace(/\b(greater cardiac|great cardiac)\b/g,'great cardiac')
    .replace(/\b(costotransvers|costotransverse|costo transvers|costo transverse)\b/g,'costotransverse')
    .replace(/\b(innervate|innervates|innervated)\b/g,'innervate')
    .replace(/\b(drain|drains|drained|drainage)\b/g,'drain')
    .replace(/\b(attached|attaches|attach)\b/g,'attach')
    .replace(/\b(visible|seen|observed)\b/g,'seen')
    .replace(/\b(is|are|was|were|has|have|the|a|an)\b/g,' ')
    .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
const stop = new Set('all following which what where statements statement correct incorrect true false except option options of to in on for and or from by with about that this one found find structure structures its it not most considered regarding'.split(' '));
const tokens = text => new Set(normalizeQuestionText(text).split(' ').filter(w=>w && !stop.has(w)));
const jaccard = (a,b) => {
  const union=new Set([...a,...b]);
  return union.size ? [...a].filter(w=>b.has(w)).length/union.size : 0;
};
const choiceSignature = q => q.options.map(normalizeQuestionText).sort().join('|');
function signature(q) {
  const key=answerResolution(q).key;
  return {q,answer:normalizeQuestionText(q.options['ABCDEF'.indexOf(key)]||''),stem:tokens(q.prompt),choices:tokens(q.options.join(' ')),full:normalizeQuestionText(q.prompt)+'|'+choiceSignature(q)};
}
export function sameQuestionPattern(a,b) {
  // Different developmental subdivisions must not be merged by similar distractors.
  const pair=[a.q.id,b.q.id].sort().join('|');
  if(['cvs-2021-september-q95|cvs-2022-may-q84','cvs-2021-september-q96|cvs-2022-may-q87'].includes(pair)) return false;
  // Wording alone cannot establish that two differently stored graphs are the same.
  if(/\b(figure|graph|diagram|question mark)\b/i.test(a.q.prompt+' '+b.q.prompt)
      && a.q.media!==b.q.media) return false;
  if(a.full===b.full) return Boolean(a.answer && a.answer===b.answer);
  if(!a.answer || a.answer!==b.answer) return false;
  // Do not merge opposing prompts solely because distractors are shared.
  const negative = text => /\b(except|not|incorrect|false)\b/i.test(text);
  if(negative(a.q.prompt)!==negative(b.q.prompt)) return false;
  const stem=jaccard(a.stem,b.stem), choices=jaccard(a.choices,b.choices);
  if(Math.min(a.stem.size,b.stem.size)<3) return choices>=.88;
  return (stem>=.62 && choices>=.45) || (stem>=.84 && choices>=.25) || (stem>=.42 && choices>=.86);
}
export function repeatedQuestionGroups(papers,mapping,evidenceIds,manualGroups=[]) {
  const groups=[];
  const manuallyGrouped=new Set(manualGroups.flat());
  for(const paper of papers) for(const q of paper.questions) {
    if(!answerResolution(q).key) continue;
    const topicId=mapping.questions[q.id]?.topicId;
    if(!topicId || topicId==='unclassified') continue;
    const entry={...signature(q),paperId:paper.id,topicId};
    // Complete-link grouping avoids chains of weakly related questions.
    if(manuallyGrouped.has(q.id)) continue;
    const group=groups.find(g=>g[0].topicId===topicId && g.every(item=>sameQuestionPattern(entry,item)));
    if(group) group.push(entry); else groups.push([entry]);
  }
  for(const ids of manualGroups) {
    const group=[];
    for(const id of ids) for(const paper of papers) {
      const q=paper.questions.find(q=>q.id===id);
      if(q && answerResolution(q).key) group.push({...signature(q),paperId:paper.id,topicId:mapping.questions[q.id]?.topicId});
    }
    if(group.length) groups.push(group);
  }
  return groups.map(group=>({
    members:group.map(item=>({questionId:item.q.id,paperId:item.paperId,prompt:item.q.prompt,sourcePage:item.q.sourcePage})),
    evidencePaperIds:[...new Set(group.filter(item=>evidenceIds.includes(item.paperId)).map(item=>item.paperId))],
    sourcePaperIds:[...new Set(group.map(item=>item.paperId))],
  })).filter(g=>g.sourcePaperIds.length>=2);
}
