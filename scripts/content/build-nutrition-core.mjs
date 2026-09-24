import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {revision,merges,supplements} from '../../data/nutrition/core-selection.mjs';
const root=new URL('../../',import.meta.url),check=process.argv.includes('--check');
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const hash=v=>createHash('sha256').update(v).digest('hex');
const emit=(p,v)=>{const text=typeof v==='string'?v:JSON.stringify(v,null,2)+'\n';if(check)assert.equal(fs.readFileSync(new URL(p,root),'utf8'),text,`Stale ${p}`);else{fs.mkdirSync(new URL('./',new URL(p,root)),{recursive:true});fs.writeFileSync(new URL(p,root),text);}};
const catalog=read('data/nutrition/catalog.json'),curriculum=read('data/review-curriculum/courses/term2-nutrition.json');
const all=fs.readFileSync(new URL('data/final-exams/nutrition-past-papers.jsonl',root),'utf8').trim().split('\n').map(JSON.parse);
const papers=catalog.papers.filter(p=>p.id!=='O'&&p.defaultEligible!==false),paperIds=new Set(papers.map(p=>p.id));
const records=catalog.archive.filter(r=>paperIds.has(r.paperId)),recordFor=new Map(records.filter(r=>r.gradedQuestionId).map(r=>[r.gradedQuestionId,r]));
const bySource=new Map(records.filter(r=>r.gradedQuestionId).map(r=>[r.id,r.gradedQuestionId]));
const questions=all.filter(q=>recordFor.has(q.id)),byId=new Map(questions.map(q=>[q.id,q]));
const normalize=s=>s.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const answers=q=>q.options.filter(o=>o.id===q.correctOptionId||q.acceptedOptionIds?.includes(o.id)).map(o=>normalize(o.text)).sort();
const original=q=>q&&!q.qualityFlags.includes('editorially-repaired-source-question');
const parent=new Map(questions.map(q=>[q.id,q.id]));
function find(id){assert(parent.has(id),'Missing question '+id);const p=parent.get(id);if(p!==id)parent.set(id,find(p));return parent.get(id);}
function join(a,b){parent.set(find(b),find(a));}
const exact=new Map();
for(const q of questions.filter(original)){
 const signature=JSON.stringify([normalize(q.prompt),answers(q),q.options.map(o=>normalize(o.text)).sort(),q.media??null]);
 if(exact.has(signature))join(exact.get(signature),q.id);else exact.set(signature,q.id);
}
const preferences=[],labels=new Map();
for(const [label,members]of merges){
 const ids=members.map(id=>{assert(bySource.has(id),'Unscored/missing source '+id);return bySource.get(id);});
 assert(ids.length>1);for(const id of ids)assert(original(byId.get(id)),'Repair cannot count as a repeat '+id);
 ids.slice(1).forEach(id=>join(ids[0],id));preferences.push(ids[0]);labels.set(ids[0],label);
}
const groups=new Map();for(const q of questions){const id=find(q.id);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(q);}
const repeated=[...groups.values()].filter(qs=>new Set(qs.map(q=>recordFor.get(q.id).paperId)).size>=2);
const frequencies=new Map();
for(const q of questions){const id=curriculum.questions[q.id]?.sectionId;assert(id,'No review destination '+q.id);if(!frequencies.has(id))frequencies.set(id,new Set());frequencies.get(id).add(recordFor.get(q.id).paperId);}
function row(q,kind,reason,members=[q]){
 const section=curriculum.sections.find(s=>s.id===curriculum.questions[q.id].sectionId);assert(section);
 const record=recordFor.get(q.id),sourcePaperIds=[...new Set(members.map(m=>recordFor.get(m.id).paperId))].sort();
 return {questionId:q.id,kind,reason,paperId:record.paperId,sectionId:section.id,sectionTitle:section.title,pdfPage:section.pdfPage,sourcePaperIds,sourceCollectionCount:sourcePaperIds.length,topicCollectionCount:frequencies.get(section.id).size,
 members:members.map(m=>{const r=recordFor.get(m.id),p=papers.find(p=>p.id===r.paperId);return {questionId:m.id,paperId:p.id,sourceNumber:r.number,sourceUrl:p.file+'#page='+r.page};})};
}
const rows=repeated.map(members=>{const preferred=preferences.find(id=>members.some(q=>q.id===id));const q=preferred?byId.get(preferred):[...members].sort((a,b)=>answers(a).length-answers(b).length||a.id.localeCompare(b.id))[0];return row(q,'repeat',labels.get(preferred)||'Same question wording and accepted answer across source collections',members);}).sort((a,b)=>b.sourceCollectionCount-a.sourceCollectionCount||a.sectionId.localeCompare(b.sectionId)||a.questionId.localeCompare(b.questionId));
const used=new Set(rows.map(r=>find(r.questionId)));
for(const [sourceId,reason]of supplements){const id=bySource.get(sourceId);assert(id,'Missing scored supplement '+sourceId);if(used.has(find(id)))continue;rows.push(row(byId.get(id),'coverage',reason));used.add(find(id));}
assert(rows.length,'Core selection is empty');assert.equal(new Set(rows.map(r=>r.questionId)).size,rows.length);
const sections=curriculum.sections.filter(s=>rows.some(r=>r.sectionId===s.id)).map(s=>({id:s.id,title:s.title,pdfPage:s.pdfPage,count:rows.filter(r=>r.sectionId===s.id).length,repeated:rows.filter(r=>r.sectionId===s.id&&r.kind==='repeat').length,sourceCollectionCount:frequencies.get(s.id).size}));
const result={revision,idPrefix:'nutrition-core',title:'Nutrition Core Exam',sourceFingerprint:hash(JSON.stringify([questions,curriculum.sections,merges,supplements])),sourceQuestionCount:records.length,scoredSourceQuestionCount:questions.length,sourceCollectionCount:papers.length,optionalQuestionCount:catalog.archive.length-records.length,
 repeatedPatternCount:repeated.length,repeatedSourceOccurrenceCount:repeated.reduce((n,g)=>n+g.length,0),supplementalCount:rows.filter(r=>r.kind==='coverage').length,
 exclusionNote:'Duplicate file aliases and our own exported answer PDF are not extra papers. Oral-health supplements are excluded. Edited study repairs do not establish recurrence.',
 methodology:'One representative per detected repeated question pattern, then explicitly selected core-coverage items. Only exact normalized stems, choices and accepted answers or manually reviewed equivalent relationships are merged. Each source collection counts once; shared or copied questions do not prove independent exam sittings. Repaired questions and ungraded items cannot establish repeats. Historical frequency is not an exam probability. Detection is conservative; unrecognized paraphrases may remain.',
 papers:papers.map(p=>({id:p.id,title:p.title,url:p.file})),sections,questions:rows};result.fingerprint=hash(JSON.stringify(result));
emit('public/study/nutrition/core-exam.json',result);
emit('docs/nutrition-core-exam.md',['# Nutrition Core Exam','',`${rows.length} selected questions = ${result.repeatedPatternCount} repeated patterns + ${result.supplementalCount} additional coverage items. ${result.repeatedSourceOccurrenceCount} scored source occurrences are represented by repeated patterns.`,
 '',`${records.length} source occurrences (${questions.length} scored) across ${papers.length} main collections. This is not a count of independent concepts or authenticated independent examinations.`, '',result.methodology,'',result.exclusionNote,'','## Auditable selection','','| Representative | Basis | Collections | Review section | PDF page |','|---|---|---:|---|---:|',...rows.map(r=>`| ${r.questionId} | ${r.kind}: ${r.reason} | ${r.sourceCollectionCount} | ${r.sectionTitle} | ${r.pdfPage} |`),'','## Regenerate','','`npm run nutrition:generate` updates papers, archive, downloads and curriculum mappings. `npm run nutrition:core:generate` updates this selection. `npm run nutrition:check` checks data, source downloads, provenance, isolation and Core reproducibility.','', 'Full Core, Repeats Only and section scopes use independent saved attempts. Mistake review preserves initial scores. Original source PDFs are retained unchanged except explicitly documented privacy redactions in derived public copies.',''].join('\n'));
console.log(JSON.stringify({core:rows.length,repeats:repeated.length,supplements:result.supplementalCount,sourceItems:records.length,scored:questions.length,sections:sections.length}));
