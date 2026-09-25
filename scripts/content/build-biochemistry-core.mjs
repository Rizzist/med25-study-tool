import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {revision,merges,supplements} from '../../data/biochemistry/core-selection.mjs';
const root=new URL('../../',import.meta.url),check=process.argv.includes('--check');
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const hash=v=>createHash('sha256').update(v).digest('hex');
const emit=(p,v)=>{const text=typeof v==='string'?v:JSON.stringify(v,null,2)+'\n';if(check)assert.equal(fs.readFileSync(new URL(p,root),'utf8'),text,`Stale ${p}`);else{fs.mkdirSync(new URL('./',new URL(p,root)),{recursive:true});fs.writeFileSync(new URL(p,root),text);}};
const source=read('data/biochemistry/past-papers.json');
const papers=source.papers.filter(p=>p.defaultEligible);
const all=fs.readFileSync(new URL('data/final-exams/biochemistry-metabolism-past-papers.jsonl',root),'utf8').trim().split('\n').map(JSON.parse);
const curriculum=read('data/review-curriculum/courses/term2-biochemistry.json');
const paperFor=new Map(papers.flatMap(p=>p.questions.map(q=>[`${p.id}-q${String(q.number).padStart(3,'0')}`,p])));
const questions=all.filter(q=>paperFor.has(q.id)),byId=new Map(questions.map(q=>[q.id,q]));
const expand=short=>'biochemistry-'+short.replace(':','-q');
const normalize=s=>s.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const answers=q=>q.options.filter(o=>o.id===q.correctOptionId||q.acceptedOptionIds?.includes(o.id)).map(o=>normalize(o.text)).sort();
const original=q=>!q.qualityFlags.includes('editorially-repaired-source-question');
const parent=new Map(questions.map(q=>[q.id,q.id]));
function find(id){const p=parent.get(id);assert(p,`Missing question ${id}`);if(p!==id)parent.set(id,find(p));return parent.get(id);}
function join(a,b){parent.set(find(b),find(a));}
// Exact wording AND the same accepted answer text. Preserve numbers, polarity,
// anatomical/chemical entities and media identity. No fuzzy automatic merging.
const exact=new Map();
for(const q of questions.filter(original)){
  const signature=JSON.stringify([normalize(q.prompt),answers(q),q.media??null]);
  if(exact.has(signature))join(exact.get(signature),q.id);else exact.set(signature,q.id);
}
const preferences=[],labels=new Map();
for(const [label,members] of merges){
  const ids=members.split(' ').map(expand);
  for(const id of ids)assert(original(byId.get(id)),`An editorial repair is not independent recurrence evidence: ${id}`);
  ids.slice(1).forEach(id=>join(ids[0],id));preferences.push(ids[0]);labels.set(ids[0],label);
}
const grouped=new Map();
for(const q of questions){const id=find(q.id);if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(q);}
const repeated=[...grouped.values()].filter(qs=>new Set(qs.map(q=>paperFor.get(q.id).id)).size>=2);
const frequencies=new Map();
for(const q of questions){const id=curriculum.questions[q.id]?.sectionId;assert(id,`No review mapping ${q.id}`);if(!frequencies.has(id))frequencies.set(id,new Set());frequencies.get(id).add(paperFor.get(q.id).id);}
function row(q,kind,reason,members=[q]){
  const section=curriculum.sections.find(s=>s.id===curriculum.questions[q.id].sectionId);
  assert(section&&q.options.some(o=>o.id===q.correctOptionId));
  if(/\b(in the structure below|in the diagram|in the figure)\b/i.test(q.prompt))assert(q.media?.length,`Missing source figure ${q.id}`);
  const sourcePaper=paperFor.get(q.id);
  const sourcePaperIds=[...new Set(members.map(m=>paperFor.get(m.id).id))].sort();
  return {questionId:q.id,kind,reason,paperId:sourcePaper.id,sectionId:section.id,sectionTitle:section.title,pdfPage:section.pdfPage,
    sourcePaperIds,sourceCollectionCount:sourcePaperIds.length,topicCollectionCount:frequencies.get(section.id).size,
    members:members.map(m=>({questionId:m.id,paperId:paperFor.get(m.id).id,sourceNumber:Number(m.id.slice(-3)),sourceUrl:paperFor.get(m.id).original.url+'#page='+m.source.page}))};
}
const rows=repeated.map(members=>{
  const preferred=preferences.find(id=>members.some(q=>q.id===id));
  const q=preferred?byId.get(preferred):[...members].sort((a,b)=>answers(a).length-answers(b).length||a.id.localeCompare(b.id))[0];
  return row(q,'repeat',labels.get(preferred)||'Same question wording and accepted answer across source collections',members);
}).sort((a,b)=>b.sourceCollectionCount-a.sourceCollectionCount||a.sectionId.localeCompare(b.sectionId)||a.questionId.localeCompare(b.questionId));
const usedGroups=new Set(rows.map(r=>find(r.questionId)));
for(const [short,reason] of supplements){const id=expand(short),q=byId.get(id);assert(q,`Missing supplement ${id}`);if(usedGroups.has(find(id)))continue;rows.push(row(q,'coverage',reason));usedGroups.add(find(id));}
assert.equal(new Set(rows.map(r=>r.questionId)).size,rows.length);
const sections=curriculum.sections.filter(s=>rows.some(r=>r.sectionId===s.id)).map(s=>({id:s.id,title:s.title,pdfPage:s.pdfPage,count:rows.filter(r=>r.sectionId===s.id).length,repeated:rows.filter(r=>r.sectionId===s.id&&r.kind==='repeat').length,sourceCollectionCount:frequencies.get(s.id).size}));
const result={revision,title:'Biochemistry Core Exam',sourceFingerprint:hash(JSON.stringify([questions,curriculum.sections,merges,supplements])),
  sourceQuestionCount:questions.length,sourceCollectionCount:papers.length,optionalQuestionCount:all.length-questions.length,
  repeatedPatternCount:repeated.length,repeatedSourceOccurrenceCount:repeated.reduce((n,g)=>n+g.length,0),supplementalCount:rows.filter(r=>r.kind==='coverage').length,
  exclusionNote:'The optional reconstruction and undated question-bank report are excluded from recurrence counts. Alternate scans and reordered copies count as one source paper.',
  methodology:'One representative per detected repeated question pattern, followed by explicitly selected core-coverage questions. Exact stem/answer matching plus reviewed relationship groups; never whole-topic matching alone. Each main collection counts once, including when a question occurs twice within it. Alternate scans/translations are already grouped by source. Counts describe source collections, not authenticated independent sittings or exam probabilities. The optional reconstruction and edited study repairs do not establish recurrence. Detection is conservative; unrecognized paraphrases may remain.',
  papers:papers.map(p=>({id:p.id,title:p.title,url:p.original.url})),sections,questions:rows};
result.fingerprint=hash(JSON.stringify(result));
emit('public/study/biochemistry/core-exam.json',result);
const report=['# Biochemistry Core Exam','',`${rows.length} selected = ${result.repeatedPatternCount} repeated patterns + ${result.supplementalCount} supplemental core-coverage questions.`,
  '',`${questions.length} is the total main source-item count, NOT the repeat count. ${result.repeatedSourceOccurrenceCount} source occurrences are represented by the repeated patterns. ${result.optionalQuestionCount} optional reconstruction/report items are excluded.`,
  '',result.methodology,'','## Selection audit','','| Representative | Basis | Source collections | Review section | PDF page |','|---|---|---:|---|---:|',
  ...rows.map(r=>`| ${r.questionId} | ${r.kind}: ${r.reason} | ${r.sourceCollectionCount} | ${r.sectionTitle} | ${r.pdfPage} |`),
  '','## Regeneration','','Edit `data/biochemistry/core-selection.mjs`; run `npm run biochemistry:core:generate`, then `npm run biochemistry:core:check`. The generated manifest retains every repeat member and original source-page link. The question bank and original answers are not copied or rewritten by this selector.',
  '', '## UI / attempts','','The gold first card offers Full Core, Repeats Only, and individual review sections. Attempts use separate collection keys and never inherit another paper’s answers. Original scores remain unchanged during yellow-bar mistake review. PDF links use the current versioned review file.',''];
emit('docs/biochemistry-core-exam.md',report.join('\n'));
console.log(JSON.stringify({selected:rows.length,repeatedPatterns:repeated.length,repeatSourceOccurrences:result.repeatedSourceOccurrenceCount,supplements:result.supplementalCount,sections:sections.length,totalSourceItems:questions.length}));
