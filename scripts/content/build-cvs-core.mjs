// A curated revision composite of original questions, never another alleged past paper.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {applyAnswerOverlay, answerResolution} from '../../src/lib/mcq/cvs-paper-enhancements.mjs';
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
for (const [subjectId, groups] of Object.entries(selection.selection)) {
  for (const [paperId, numbers] of Object.entries(groups)) {
    const paper = byId.get(paperId);
    for (const number of numbers) {
      const q = paper?.questions.find(q => q.number === String(number));
      if (!q || !answerResolution(q).key) throw Error('Missing/unguarded core item ' + paperId + ' Q' + number);
      const mapped = mapping.questions[q.id];
      if (mapped?.subjectId !== subjectId) throw Error('Wrong subject ' + q.id);
      const topic = mapping.topics.find(t => t.id === mapped.topicId);
      const evidencePaperIds = [...(frequencies.get(mapped.topicId) || [])];
      rows.push({questionId:q.id, paperId, subjectId, topicId:mapped.topicId,
        topicTitle:topic.title, evidencePaperIds, topicPaperCount:evidencePaperIds.length});
    }
  }
}
if (rows.length !== 100 || new Set(rows.map(r => r.questionId)).size !== 100) throw Error('Core requires 100 distinct items');
// Anatomy first; within each subject, prioritize repeatedly examined topics.
const order = Object.keys(selection.selection);
rows.sort((a,b) => order.indexOf(a.subjectId)-order.indexOf(b.subjectId) || b.topicPaperCount-a.topicPaperCount);
const result = {
  revision:selection.revision, title:'Core Exam',
  description:'100 curated past-paper questions, with 50 anatomy questions. Repeated concepts first; original sources retained.',
  limitation:'Historical topic coverage is not the probability of a repeat. These six papers are a small, non-random archive; there is no defensible prediction of tomorrow’s questions or a guaranteed number of matches.',
  evidencePaperIds:selection.evidencePaperIds,
  methodology:'Manually selected, answerable source questions for breadth and anatomy emphasis. Recurrence counts each review topic once per dated theory paper (2021–2025). Undated fragments, alternate copies, IZAM/IUMS tests and practical papers do not increase the denominator. Exact question repeats are not implied.',
  subjects:order.map(id => ({id,title:mapping.subjects.find(s => s.id===id).title,count:rows.filter(r => r.subjectId===id).length})),
  questions:rows,
};
result.fingerprint = createHash('sha256').update(JSON.stringify(result)).digest('hex');
fs.writeFileSync(new URL(dir + 'core-exam.json', root), JSON.stringify(result,null,2)+'\n');
console.log('Core Exam: '+rows.length+' questions; '+result.subjects.map(s=>s.title+' '+s.count).join(', '));
