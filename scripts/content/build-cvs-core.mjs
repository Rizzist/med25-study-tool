// A curated revision composite of original questions, never another alleged past paper.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {applyAnswerOverlay, answerResolution} from '../../src/lib/mcq/cvs-paper-enhancements.mjs';
import {repeatedQuestionGroups} from './cvs-core-repeats.mjs';
const root = new URL('../../', import.meta.url);
const read = path => JSON.parse(fs.readFileSync(new URL(path, root), 'utf8'));
const selection = read('data/cvs-core-selection.json');
const dir = 'public/study/cvs-past-papers/';
const catalog = read(dir + 'index.json');
const mapping = read(dir + 'topic-map.json');
const overlay = read(dir + 'ai-answers.json');
const papers = await Promise.all(catalog.papers.map(e => applyAnswerOverlay(read('public' + e.file), overlay)));
const byId = new Map(papers.map(p => [p.id, p]));
const frequencies = new Map();
for (const id of selection.evidencePaperIds) {
  const p = byId.get(id);
  if (!p) throw Error('Missing evidence paper ' + id);
  for (const q of p.questions) {
    const topic = mapping.questions[q.id]?.topicId;
    if (!topic) continue;
    if (!frequencies.has(topic)) frequencies.set(topic, new Set());
    frequencies.get(topic).add(id);
  }
}
const rows = [];
function rowFor(q,paperId) {
  const mapped=mapping.questions[q.id],topic=mapping.topics.find(t=>t.id===mapped.topicId);
  const evidencePaperIds=[...(frequencies.get(mapped.topicId)||[])];
  return {questionId:q.id,paperId,subjectId:mapped.subjectId,topicId:mapped.topicId,topicTitle:topic.title,evidencePaperIds,topicPaperCount:evidencePaperIds.length};
}
for (const [subjectId, groups] of Object.entries(selection.selection)) {
  for (const [paperId, numbers] of Object.entries(groups)) {
    const paper = byId.get(paperId);
    for (const number of numbers) {
      const q = paper?.questions.find(q => q.number === String(number));
      if (!q || !answerResolution(q).key) throw Error('Missing/unguarded core item ' + paperId + ' Q' + number);
      const mapped = mapping.questions[q.id];
      if (mapped?.subjectId !== subjectId) throw Error('Wrong subject ' + q.id);
      rows.push(rowFor(q,paperId));
    }
  }
}
// The original curated core is a foundation, not a cap. Include every detected
// repeated pattern with a usable representative, rather than truncating at 100.
const groups=repeatedQuestionGroups(papers.filter(p=>p.id!=='cvs-2021-practical'),mapping,selection.evidencePaperIds,selection.manualRepeatGroups);
const byQuestionId=new Map(papers.flatMap(p=>p.questions.map(q=>[q.id,{q,p}])));
const excludedRepeats=[];
for(const group of groups) {
  let matches=rows.filter(row=>group.members.some(m=>m.questionId===row.questionId));
  if(!matches.length) {
    const candidates=group.members.map(member=>byQuestionId.get(member.questionId)).filter(({q})=>
      q.media || !/\b(figure|graph|diagram|question mark)\b/i.test(q.prompt));
    const reviewScore=q=>q.aiAnswer?.confidence==='high'?2:q.aiAnswer?.confidence==='moderate'?1:0;
    candidates.sort((a,b)=>
      reviewScore(b.q)-reviewScore(a.q) ||
      a.q.issues.length-b.q.issues.length || a.q.prompt.length-b.q.prompt.length);
    if(!candidates.length){excludedRepeats.push({reason:'Required source figure missing',members:group.members});continue;}
    const {q,p}=candidates[0];const row=rowFor(q,p.id);rows.push(row);matches=[row];
  }
  for(const row of matches) Object.assign(row,{
    questionRepeatPaperIds:group.evidencePaperIds,repeatSourceIds:group.sourcePaperIds,
    repeatMatches:group.members,
  });
}
for(const row of rows) {
  row.questionRepeatPaperIds??=[];row.repeatSourceIds??=[];row.repeatMatches??=[];
}
if(new Set(rows.map(r=>r.questionId)).size!==rows.length) throw Error('Duplicate core item');
// Actual repeated patterns first, with anatomy first at equal repetition strength.
const order = Object.keys(selection.selection);
rows.sort((a,b) => Number(b.repeatSourceIds.length>=2)-Number(a.repeatSourceIds.length>=2) ||
  b.questionRepeatPaperIds.length-a.questionRepeatPaperIds.length ||
  Number(b.subjectId==='anatomy')-Number(a.subjectId==='anatomy') ||
  b.repeatSourceIds.length-a.repeatSourceIds.length ||
  order.indexOf(a.subjectId)-order.indexOf(b.subjectId) || b.topicPaperCount-a.topicPaperCount);
const result = {
  revision:selection.revision, title:'Core Exam',
  description:rows.length+' sourced questions: repeated question patterns first, then core coverage. No 100-question cap.',
  limitation:'Historical topic coverage is not the probability of a repeat. These six papers are a small, non-random archive; there is no defensible prediction of tomorrow’s questions or a guaranteed number of matches.',
  evidencePaperIds:selection.evidencePaperIds,
  methodology:'A manually curated foundation plus every detected answerable repeat group, without a question limit. Conservative wording matching and reviewed anatomy groups identify repeated question patterns; different wording can remain within a pattern. Each source set counts once, not each file/page. Dated-paper repeat counts and topic coverage use six dated TUMS theory papers. Undated and IZAM/IUMS collections are separately included in source-set counts, not treated as additional dated TUMS exams. Repetition detection is conservative, not a claim to recognize every semantic paraphrase.',
  repeatedPatternCount:groups.length-excludedRepeats.length,
  excludedRepeats,
  subjects:order.map(id => ({id,title:mapping.subjects.find(s => s.id===id).title,count:rows.filter(r => r.subjectId===id).length})),
  questions:rows,
};
result.fingerprint = createHash('sha256').update(JSON.stringify(result)).digest('hex');
fs.writeFileSync(new URL(dir + 'core-exam.json', root), JSON.stringify(result,null,2)+'\n');
console.log('Core Exam: '+rows.length+' questions; '+result.subjects.map(s=>s.title+' '+s.count).join(', '));
