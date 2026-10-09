// Read-only checks for the reviewed source-family and paraphrase sidecars.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const papers=read('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id==='term1-biochemistry-retake').collections;
const families=read('data/biochemistry-retake/source-families.json');
const repeats=read('data/biochemistry-retake/repeat-groups.json');
const bank=new Map(Object.values(read('data/term1-telegram/banks.json')).flat().map(q=>[q.id,q]));
for(const line of fs.readFileSync(path.join(root,'data/final-exams/biochemistry-retake-past-papers.jsonl'),'utf8').trim().split('\n')){const q=JSON.parse(line);bank.set(q.id,q);}
assert.deepEqual(Object.keys(families.papers).sort(),papers.map(p=>p.id).sort(),'Every main retake paper needs exactly one family entry');
const sourceByQuestion=new Map();
for(const paper of papers){
 const family=families.papers[paper.id];
 assert(family.familyId&&family.reason&&['exam','recall','practice'].includes(family.role),paper.id);
 for(const id of paper.takeableQuestionIds??paper.questionIds??paper.gradedQuestionIds){
  assert(bank.has(id),`Unknown source occurrence ${id}`);
  assert.equal(bank.get(id).subject,'biochemistry',`Outside Biochem I scope: ${id}`);
  assert(!sourceByQuestion.has(id),`Occurrence is in multiple main collections: ${id}`);
  sourceByQuestion.set(id,paper.id);
 }
}
const seen=new Set(),labels=new Set();let members=0,multiFamilyGroups=0;
for(const group of repeats.groups){
 assert(group.label&&group.reason&&group.questionIds.length>=2,'A reviewed group needs a label, rationale and at least two occurrences');
 assert(!labels.has(group.label),`Duplicate group label: ${group.label}`);labels.add(group.label);
 const votes=new Set();
 for(const id of group.questionIds){
  assert(sourceByQuestion.has(id),`Group member not in source papers: ${id}`);
  assert(!seen.has(id),`Question in multiple manual groups: ${id}`);seen.add(id);members++;
  const q=bank.get(id);
  assert(q.correctOptionId&&q.answerReview?.basis!=='unresolved',`Ungraded group member: ${id}`);
  assert(!q.media?.length,`Media requires separate visual-equivalence review: ${id}`);
  for(const answer of q.acceptedOptionIds??[q.correctOptionId])assert(q.options.some(o=>o.id===answer),`Missing answer option: ${id}`);
  const family=families.papers[sourceByQuestion.get(id)];if(family.role==='exam')votes.add(family.familyId);
 }
 if(votes.size>=2)multiFamilyGroups++;
}
console.log(JSON.stringify({status:'passed',papers:papers.length,families:new Set(Object.values(families.papers).map(p=>p.familyId)).size,examFamilies:new Set(Object.values(families.papers).filter(p=>p.role==='exam').map(p=>p.familyId)).size,supportPapers:Object.values(families.papers).filter(p=>p.role!=='exam').length,manualGroups:repeats.groups.length,manualMembers:members,manualGroupsWithAtLeastTwoExamFamilies:multiFamilyGroups},null,2));
