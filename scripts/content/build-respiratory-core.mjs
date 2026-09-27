import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {revision,merges,supplements} from '../../data/respiratory/core-selection.mjs';

const root=new URL('../../',import.meta.url),check=process.argv.includes('--check');
const read=path=>JSON.parse(fs.readFileSync(new URL(path,root),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function emit(path,value){
  const text=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';
  if(check)assert.equal(fs.readFileSync(new URL(path,root),'utf8'),text,`Stale ${path}`);
  else{fs.mkdirSync(new URL('./',new URL(path,root)),{recursive:true});fs.writeFileSync(new URL(path,root),text);}
}
const catalog=read('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id==='term2-respiratory');
const papers=catalog.collections.filter(p=>p.defaultEligible===true);
const curriculum=read('data/review-curriculum/courses/term2-respiratory.json');
const all=fs.readFileSync(new URL('data/final-exams/respiratory-past-papers.jsonl',root),'utf8').trim().split('\n').map(JSON.parse);
const recordFor=new Map();
for(const p of papers)for(const q of read(`data/respiratory/papers/${p.id}.json`).questions.filter(q=>q.graded)){
  assert(!recordFor.has(q.canonicalQuestionId),`Alias source must not count twice: ${q.id}`);
  recordFor.set(q.canonicalQuestionId,{...q,paperId:p.id});
}
const questions=all.filter(q=>recordFor.has(q.id)),byId=new Map(questions.map(q=>[q.id,q]));
assert.equal(questions.length,recordFor.size,'Every scored source must exist in the bank');
const normalize=s=>s.toLowerCase().normalize('NFKC').replace(/[−-](?=\s*\d)/g,' minus ').replace(/\+(?=\s*\d)/g,' plus ').replace(/(\d)\.(\d)/g,'$1 decimal $2').replace(/%/g,' percent ').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const answers=q=>q.options.filter(o=>o.id===q.correctOptionId||q.acceptedOptionIds?.includes(o.id)).map(o=>normalize(o.text)).sort();
const original=q=>!recordFor.get(q.id).sourceOptions&&!q.qualityFlags?.includes('editorially-repaired-source-question');
const idFor=short=>{const id='respiratory-'+short.replace(':','-q');assert(byId.has(id),`Missing scored main-paper item: ${short}`);return id;};
const parent=new Map(questions.map(q=>[q.id,q.id]));
function find(id){assert(parent.has(id),id);const p=parent.get(id);if(p!==id)parent.set(id,find(p));return parent.get(id);}
function join(a,b){parent.set(find(b),find(a));}
const exact=new Map();
for(const q of questions.filter(original)){
  const signature=JSON.stringify([normalize(q.prompt),answers(q),q.options.map(o=>normalize(o.text)).sort(),q.media??null]);
  if(exact.has(signature))join(exact.get(signature),q.id);else exact.set(signature,q.id);
}
const preferences=[],labels=new Map();
for(const [label,shortIds] of merges){
  const ids=shortIds.split(' ').map(idFor);assert(ids.length>1);
  assert.equal(new Set(ids.map(id=>byId.get(id).subject)).size,1,`Cross-subject merge: ${label}`);
  for(const id of ids)assert(original(byId.get(id)),`Editorial repair cannot establish recurrence: ${id}`);
  ids.slice(1).forEach(id=>join(ids[0],id));preferences.push(ids[0]);labels.set(ids[0],label);
}
const groups=new Map();
for(const q of questions){const id=find(q.id);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(q);}
const repeated=[...groups.values()].filter(qs=>new Set(qs.map(q=>recordFor.get(q.id).paperId)).size>=2);
const frequencies=new Map();
for(const q of questions){const id=curriculum.questions[q.id]?.sectionId;assert(id,`No current review mapping: ${q.id}`);if(!frequencies.has(id))frequencies.set(id,new Set());frequencies.get(id).add(recordFor.get(q.id).paperId);}
function sourceUrl(record){
  const paper=papers.find(p=>p.id===record.paperId);
  const first=paper.originals[0];assert(first);
  if(first.url.endsWith('.pdf'))return first.url+'#page='+record.page;
  const image=paper.originals[record.page-1];assert(image,`Missing source image for ${record.id}`);return image.url;
}
function row(q,kind,reason,members=[q]){
  const section=curriculum.sections.find(s=>s.id===curriculum.questions[q.id].sectionId);assert(section);
  const record=recordFor.get(q.id),sourcePaperIds=[...new Set(members.map(m=>recordFor.get(m.id).paperId))].sort();
  return {questionId:q.id,kind,reason,paperId:record.paperId,subject:q.subject,sectionId:section.id,sectionTitle:section.title,pdfPage:section.pdfPage,sourcePaperIds,sourceCollectionCount:sourcePaperIds.length,topicCollectionCount:frequencies.get(section.id).size,
    members:members.map(m=>{const r=recordFor.get(m.id);return {questionId:m.id,paperId:r.paperId,sourceNumber:r.sourceNumber,sourceUrl:sourceUrl(r)};})};
}
const rows=repeated.map(members=>{
  const preferred=preferences.find(id=>members.some(q=>q.id===id));
  const q=preferred?byId.get(preferred):[...members].sort((a,b)=>a.id.localeCompare(b.id))[0];
  return row(q,'repeat',labels.get(preferred)||'Same question wording, choices and accepted answer across source collections',members);
}).sort((a,b)=>b.sourceCollectionCount-a.sourceCollectionCount||a.sectionId.localeCompare(b.sectionId)||a.questionId.localeCompare(b.questionId));
const used=new Set(rows.map(r=>find(r.questionId)));
for(const [short,reason] of supplements){const id=idFor(short);if(used.has(find(id)))continue;rows.push(row(byId.get(id),'coverage',reason));used.add(find(id));}
assert(rows.length);assert.equal(new Set(rows.map(r=>r.questionId)).size,rows.length);
const sections=curriculum.sections.filter(s=>rows.some(r=>r.sectionId===s.id)).map(s=>({id:s.id,title:s.title,pdfPage:s.pdfPage,count:rows.filter(r=>r.sectionId===s.id).length,repeated:rows.filter(r=>r.sectionId===s.id&&r.kind==='repeat').length,sourceCollectionCount:frequencies.get(s.id).size}));
const subjects=['anatomy','physiology','histology','embryology'].map(id=>({id,title:id[0].toUpperCase()+id.slice(1),count:rows.filter(r=>r.subject===id).length}));
const result={revision,idPrefix:'respiratory-core',title:'Respiratory Core Exam',sourceFingerprint:hash([questions,[...recordFor.values()],papers,curriculum.questions,curriculum.sections,merges,supplements]),sourceQuestionCount:questions.length,sourceCollectionCount:papers.length,optionalQuestionCount:all.length-questions.length,
  repeatedPatternCount:repeated.length,repeatedSourceOccurrenceCount:repeated.reduce((n,g)=>n+g.length,0),supplementalCount:rows.filter(r=>r.kind==='coverage').length,
  exclusionNote:'Duplicate screenshots, practical/reference supplements and ungraded questions do not count as extra theory repeats. Edited-choice repairs cannot establish recurrence. Dated reports and photographed collections may overlap; they are not authenticated independent sittings.',
  methodology:'One original PYQ per detected repeated pattern, followed by selected coverage gaps in anatomy, physiology, histology and embryology. Exact matches preserve stems, choices, accepted answers and media; additional merges are explicitly reviewed equivalent relationships. Each collection counts once per pattern. No fuzzy topic-only matching or 100-question cap. Original study keys and source qualifications are retained. Historical recurrence is study priority, not a prediction of your exam.',
  papers:papers.map(p=>({id:p.id,title:p.title,url:p.originals[0].url})),subjects,sections,questions:rows};
result.fingerprint=hash(result);
emit('public/study/respiratory/core-exam.json',result);
emit('docs/respiratory-core-exam.md',[
  '# Respiratory Core Exam','',`${rows.length} selected original PYQs = ${result.repeatedPatternCount} repeated patterns + ${result.supplementalCount} coverage questions. ${result.repeatedSourceOccurrenceCount} source occurrences collapse into the repeated patterns.`,
  '',`${questions.length} scored theory questions across ${papers.length} main collections were considered. ${result.optionalQuestionCount} distinct supplementary questions are not used for this theory Core.`,
  '',result.methodology,'',result.exclusionNote,'','## Coverage','','| Discipline | Selected |','|---|---:|',...subjects.map(s=>`| ${s.title} | ${s.count} |`),
  '',`${sections.length} current review sections are represented. Guided mode uses each original question ID to resolve a paragraph where verified, otherwise its mapped section.`,
  '','## Auditable selection','','| Representative | Basis | Collections | Review section | PDF page |','|---|---|---:|---|---:|',
  ...rows.map(r=>`| ${r.questionId} | ${r.kind}: ${r.reason} | ${r.sourceCollectionCount} | ${r.sectionTitle} | ${r.pdfPage} |`),
  '','## Maintenance','','Edit `data/respiratory/core-selection.mjs`, then run `npm run respiratory:core:generate` and `npm run respiratory:core:check`. Rebuild the Core after changing source keys, source papers or review mappings. Build/deployment rejects stale manifests.',
  '', 'Full Core, Repeats Only and section scopes have separate saved attempts. Guided/Unguided selection precedes a new attempt. Wrong-answer review preserves original scores. Full source evidence is available on the Core card; question wording and answers are loaded from the original bank, not duplicated in this manifest.','',
].join('\n'));
console.log(JSON.stringify({core:rows.length,repeats:result.repeatedPatternCount,coverage:result.supplementalCount,occurrences:result.repeatedSourceOccurrenceCount,sections:sections.length,subjects}));
