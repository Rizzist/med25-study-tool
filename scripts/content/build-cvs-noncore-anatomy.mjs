// Complement the Core Exam with every remaining usable, distinct anatomy item.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {applyAnswerOverlay,answerResolution} from '../../src/lib/mcq/cvs-paper-enhancements.mjs';
import {questionsSharePattern} from './cvs-core-repeats.mjs';
const root=new URL('../../',import.meta.url);
const read=path=>JSON.parse(fs.readFileSync(new URL(path,root),'utf8'));
const dir='public/study/cvs-past-papers/';
const core=read(dir+'core-exam.json'), mapping=read(dir+'topic-map.json');
const review=read('data/cvs-noncore-anatomy-review.json');
const overlay=read(dir+'ai-answers.json'), catalog=read(dir+'index.json');
const papers=await Promise.all(catalog.papers.map(e=>applyAnswerOverlay(read('public'+e.file),overlay)));
const entries=papers.flatMap(p=>p.questions.map(q=>({q,p})));
const byId=new Map(entries.map(e=>[e.q.id,e]));
const candidates=entries.filter(({q})=>mapping.questions[q.id]?.subjectId==='anatomy');
const coreIds=new Set(core.questions.flatMap(row=>[row.questionId,...row.repeatMatches.map(m=>m.questionId)]));
const coreEntries=[...coreIds].map(id=>byId.get(id)).filter(Boolean);
const excludedCore=[],withheld=[],duplicates=[],available=[];
const locator=({q,p})=>({questionId:q.id,paperId:p.id,prompt:q.prompt,sourcePage:q.sourcePage});
for(const [id,target] of Object.entries(review.coreEquivalents)) {
  if(!byId.has(id)||!coreIds.has(target)) throw Error('Stale Core equivalence: '+id+' -> '+target);
}
for(const group of review.duplicateGroups) for(const id of group) if(!byId.has(id)) throw Error('Missing duplicate member '+id);
for(const id of Object.keys(review.holds)) if(!byId.has(id)) throw Error('Missing held question '+id);
for(const entry of candidates) {
  const {q}=entry;
  const manualCore=review.coreEquivalents[q.id];
  const matchedCore=coreIds.has(q.id)?q.id:manualCore || coreEntries.find(e=>questionsSharePattern(e.q,q))?.q.id;
  if(matchedCore) {excludedCore.push({...locator(entry),representedBy:matchedCore,reason:manualCore?'Reviewed equivalent tested fact':'Core question or repeated wording pattern'});continue;}
  const resolution=answerResolution(q);
  let reason=review.holds[q.id];
  if(!reason&&!resolution.key) reason=q.aiAnswer?.caveat || q.aiAnswer?.explanation || 'No defensible answer is currently available; original source retained for review.';
  if(!reason&&(q.options.length<2 || q.options.length>6 || q.options.some(option=>!option.trim()))) reason='Incomplete multiple-choice options.';
  if(!reason&&!q.media&&/\b(arrow|figure|diagram|question mark)\b/i.test(q.prompt)) reason='Required question figure is unavailable.';
  if(reason) {withheld.push({...locator(entry),reason});continue;}
  if(q.media&&!fs.existsSync(new URL('public'+q.media,root))) throw Error('Missing source figure '+q.media);
  available.push(entry);
}
// Prefer reviewed representatives; never inflate the set with duplicate copies.
const score=q=>q.aiAnswer?.confidence==='high'?2:q.aiAnswer?.confidence==='moderate'?1:0;
available.sort((a,b)=>score(b.q)-score(a.q)||a.q.issues.length-b.q.issues.length||a.q.id.localeCompare(b.q.id,undefined,{numeric:true}));
const groups=[];
for(const entry of available) {
  const manual=review.duplicateGroups.find(ids=>ids.includes(entry.q.id));
  const group=groups.find(g=>g.every(e=>
    Boolean(manual?.includes(e.q.id)) || questionsSharePattern(e.q,entry.q)));
  if(group) group.push(entry);else groups.push([entry]);
}
const questions=groups.map(([entry,...copies])=>{
  for(const copy of copies) duplicates.push({...locator(copy),representedBy:entry.q.id});
  const mapped=mapping.questions[entry.q.id];
  return {questionId:entry.q.id,paperId:entry.p.id,subjectId:'anatomy',topicId:mapped.topicId,
    topicTitle:mapping.topics.find(t=>t.id===mapped.topicId).title,hasImage:Boolean(entry.q.media),
    duplicateMatches:copies.map(locator)};
});
// Stable review-section order, theory followed by the original image spotters.
questions.sort((a,b)=>Number(a.hasImage)-Number(b.hasImage)||mapping.topics.findIndex(t=>t.id===a.topicId)-mapping.topics.findIndex(t=>t.id===b.topicId)||a.questionId.localeCompare(b.questionId,undefined,{numeric:true}));
const accounted=[...questions,...excludedCore,...duplicates,...withheld].map(r=>r.questionId);
if(accounted.length!==candidates.length||new Set(accounted).size!==candidates.length) throw Error('Incomplete or overlapping anatomy partition');
const result={revision:review.revision,title:'Non-core Anatomy',coreFingerprint:core.fingerprint,
  description:'Distinct anatomy past questions beyond Core: unusual relations, attachments, exceptions and original image spotters.',
  methodology:'All catalogued questions mapped to anatomy are accounted for. Core IDs and their known repeat variants are excluded, followed by reviewed same-fact equivalents and conservative wording-pattern matching. Remaining duplicate copies are represented once. Different tested details within the same topic are retained; image spotters remain separate. This is an archive complement, not a prediction of exam rarity or a claim to detect every semantic paraphrase.',
  limitation:'Scoring uses the existing supplied keys or reference-reviewed answers, not a new certified answer-key audit. Ambiguous, unkeyed or image-incomplete items are listed separately and are not scored. Original papers and Core attempts are unchanged.',
  candidateCount:candidates.length,questions,excludedCore,duplicates,withheld,
  sourceFingerprints:Object.fromEntries(papers.map(p=>[p.id,p.fingerprint])),
};
result.fingerprint=createHash('sha256').update(JSON.stringify(result)).digest('hex');
const output=JSON.stringify(result,null,2)+'\n';
const destination=new URL(dir+'noncore-anatomy.json',root);
if(process.argv.includes('--check')) {
  if(fs.readFileSync(destination,'utf8')!==output) throw Error('Non-core anatomy manifest is stale; regenerate it.');
} else fs.writeFileSync(destination,output);
console.log(`Non-core Anatomy: ${questions.length} questions (${questions.filter(q=>q.hasImage).length} image spotters); ${excludedCore.length} Core overlaps, ${duplicates.length} duplicate copies, ${withheld.length} withheld; ${candidates.length} accounted for.`);
