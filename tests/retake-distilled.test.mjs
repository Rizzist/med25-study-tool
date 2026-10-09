import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {parseExport, keyOf} from '../src/lib/paper-pdf/parse-export.mjs';
import {combinedSourceSelection, finalPaperKey} from '../src/lib/mcq/paper-selection.mjs';
import {isFinalAnswerCorrect} from '../src/lib/mcq/final-exam-state.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const read=p=>JSON.parse(text(p));
const exam='term1-biochemistry-retake';
const sources=[...text('data/final-exams/biochemistry-retake-past-papers.jsonl').trim().split('\n').map(JSON.parse),...read('data/term1-telegram/banks.json')[`${exam}:biochemistry-retake-past-papers`]];
const byId=new Map(sources.map(q=>[q.id,q]));
const scope=read('data/biochemistry-retake/source-topic-map.json').questions;
const families=read('data/biochemistry-retake/source-families.json').papers;
const originals=read('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id===exam).collections;
const distilled=read('public/study/biochemistry-retake/past-papers-distilled.json');
const core=read('public/study/biochemistry-retake/core-exam-distilled.json');
const guide=read('public/study/biochemistry-retake/guide-distilled.json');
const compact=s=>s.replace(/\s+/g,' ').trim();

test('All 28 distilled papers preserve every eligible source occurrence and exclude the rest',()=>{
 assert.equal(distilled.collections.length,28);
 assert.equal(distilled.sourceQuestionCount,1393);
 assert.equal(distilled.retainedQuestionCount,1194);
 const retained=[];
 for(const paper of originals){
  const selected=distilled.collections.find(p=>p.originalCollectionId===paper.id);
  assert(selected,paper.id);
  assert.equal(selected.id,paper.id+'-distilled');
  assert.equal(selected.fullPaper,undefined);
  const expected=(paper.fullPaper??paper).questionIds.filter(id=>scope[id].inScope);
  assert.deepEqual(selected.questionIds,expected,paper.id);
  assert.deepEqual(selected.takeableQuestionIds,expected,paper.id);
  assert.deepEqual(selected.gradedQuestionIds,expected.filter(id=>byId.get(id).correctOptionId));
  assert.equal(selected.sourceRecordCount,expected.length);
  assert.equal(selected.ungradedCount,expected.length-selected.gradedQuestionIds.length);
  assert.deepEqual(selected.originals,paper.originals,'Original downloads remain complete');
  assert(selected.independent&&selected.distilled);
  for(const id of expected){
   assert.equal(byId.get(id).subject,'biochemistry',id);
   assert(!/^ch-(8|9|10|11|12|13|19|20|21|22)$/.test(scope[id].chapterId),id);
  }
  retained.push(...expected);
 }
 assert.equal(new Set(retained).size,retained.length,'Source occurrences belong to one paper each');
 assert.deepEqual(retained.slice().sort(),sources.filter(q=>scope[q.id].inScope).map(q=>q.id).sort());
 assert(!retained.includes('term1-bio-sep2019-004'),'Mislabeled cell-cycle histology excluded');
 assert(!retained.includes('term1-bio-sep2019-006'),'Mislabeled Goldman physiology excluded');
 assert(!retained.includes('term1-bio-jan2023-001'),'PPP reaction excluded');
 assert(retained.includes('retake-final-cell-block-q037'),'Reviewed ch7 dietary digestion retained');
 assert(retained.includes('term1-bio-dds-jul2023-011'),'Reviewed biochemical fluid composition retained');
});

test('Distilled exports preserve source content; Core numbers sequentially with original-number provenance',()=>{
 const sourceBlocks=new Map(originals.flatMap(p=>parseExport(text('public'+(p.fullPaper??p).downloads.questionsAndKey)).questions.map(q=>[q.id,q])));
 for(const collection of [...distilled.collections,core.downloadCollection]){
  for(const url of Object.values(collection.downloads))assert.match(url,/-distilled\.md$/);
  const qdoc=parseExport(text('public'+collection.downloads.questions));
  const kdoc=parseExport(text('public'+collection.downloads.answerKey));
  const both=parseExport(text('public'+collection.downloads.questionsAndKey));
  assert.deepEqual(qdoc.questions.map(q=>q.id),collection.questionIds);
  assert.deepEqual(kdoc.keys.map(q=>q.id),collection.questionIds);
  assert.deepEqual(both.questions,qdoc.questions);
  assert.deepEqual(both.keys,kdoc.keys);
  assert.equal(qdoc.keys.length,0,'Question-only exports cannot contain answers');
  const isCore=collection.id===core.downloadCollection.id;
  for(const [index,block] of qdoc.questions.entries()){
   const q=byId.get(block.id),original=sourceBlocks.get(q.id);
   assert.equal(compact(block.paragraphs.join(' ')),compact(q.prompt),q.id);
   assert.deepEqual(block.options,q.options.map(o=>({letter:o.id,text:o.text})),q.id);
   assert.equal(block.number,isCore?String(index+1):original.number,q.id);
   assert(block.fields.Source.includes(`original Q${original.number} ·`),q.id+' original number');
   assert(!block.fields.Key&&!block.fields['Key provenance']);
   for(const image of q.media??[])assert(block.fields.Image.includes(image.path),q.id);
   const key=kdoc.keys.find(k=>k.id===q.id);
   assert.equal(key.number,block.number,q.id+' question/key numbering');
   assert(key.fields['Question source'].includes(`original Q${original.number} ·`),q.id+' key original number');
   if(isCore){
    const evidence=core.questions.find(row=>row.questionId===q.id).members.find(member=>member.questionId===q.id);
    assert.equal(evidence.sourceNumber,original.number,q.id+' source evidence number');
   }
   assert.equal(keyOf(key).letter,q.correctOptionId,q.id);
   assert.equal(compact(key.paragraphs.join(' ')),compact(q.explanation),q.id);
   if(q.acceptedOptionIds?.length){
    assert(key.fields['Key provenance'].includes('accepted choices: '+q.acceptedOptionIds.join(', ')),q.id);
    for(const choice of q.acceptedOptionIds)assert(isFinalAnswerCorrect(q,choice),q.id);
   }
  }
 }
});

test('Core counts independent exam families once and cannot use supporting compilations as votes',()=>{
 assert.equal(core.supplementalCount,0);
 assert.equal(core.sourceFamilyCount,19);
 assert.equal(core.questions.length,core.repeatedPatternCount);
 const seen=new Set();
 for(const row of core.questions){
  assert(scope[row.questionId].inScope&&byId.get(row.questionId).correctOptionId);
  assert.equal(row.questionText,byId.get(row.questionId).prompt);
  assert.equal(row.sectionId,`biochemistry-retake/${scope[row.questionId].chapterId}`);
  assert.equal(families[row.paperId].role,'exam','Representative must be an exam occurrence');
  const votes=new Set();
  for(const member of row.members){
   assert(!seen.has(member.questionId),'A source occurrence cannot enter two Core patterns');seen.add(member.questionId);
   assert(scope[member.questionId].inScope&&byId.get(member.questionId).correctOptionId);
   assert.equal(member.familyId,families[member.paperId].familyId);
   assert.equal(member.role,families[member.paperId].role);
   if(member.role==='exam')votes.add(member.familyId);
   assert(fs.existsSync(path.join(root,'public',member.sourceUrl.split('#')[0])));
  }
  assert(votes.size>=2);
  assert.equal(row.sourceCollectionCount,votes.size);
  assert.deepEqual(row.sourceFamilyIds,[...votes].sort());
 }
 for(let i=1;i<core.questions.length;i++)assert(core.questions[i-1].sourceCollectionCount>=core.questions[i].sourceCollectionCount);
 const gamma=core.questions.find(r=>r.members.some(m=>m.questionId==='term1-cell-jan2024-060'));
 assert.equal(gamma.members.length,5);
 assert.equal(gamma.sourceCollectionCount,3,'Two January occurrences and February copies cannot inflate votes');
 const titration=core.questions.find(r=>r.members.some(m=>m.questionId==='term1-bio-practical-jan2024-018'));
 assert.equal(titration.members.length,7);
 assert.equal(titration.sourceCollectionCount,6,'Reordered 27-question practical versions count once');
 assert(!seen.has('term1-bio-jan2023-001'),'An explicit repeat group outside scope must still be excluded');
});

test('Paper, combined and Core session identities remain separate from historical full-paper attempts',async()=>{
 for(const paper of distilled.collections){
  assert.notEqual(finalPaperKey(exam,paper.id),finalPaperKey(exam,paper.originalCollectionId));
  assert.notEqual(finalPaperKey(exam,paper.id),finalPaperKey(exam,paper.originalCollectionId+'--full'));
  assert.notEqual(finalPaperKey(exam,paper.id),finalPaperKey(exam,core.downloadCollection.id));
 }
 const combined=await combinedSourceSelection(distilled.collections,distilled.collections.map(p=>p.id));
 const historical=await combinedSourceSelection(originals,originals.map(p=>p.id));
 assert.notEqual(combined.id,historical.id);
 assert.equal(combined.takeableQuestionIds.length,1194);
 assert.equal(combined.gradedQuestionIds.length,1068);
 assert(combined.takeableQuestionIds.every(id=>scope[id].inScope));
 assert.notEqual(finalPaperKey(exam,combined.id),finalPaperKey(exam,core.downloadCollection.id));
});

test('Guide uses selected existing concepts and reviewed source evidence, including the explicit clinical correction',()=>{
 const selection=read('data/biochemistry-retake/distilled-guide.json');
 const review=read('data/biochemistry-retake/review.json');
 const concepts=new Map(review.sections.flatMap(s=>s.concepts.map(c=>[c.id,c])));
 assert.equal(guide.sections.length,selection.sections.length);
 assert.equal(guide.conceptCount,selection.sections.reduce((n,s)=>n+s.conceptIds.length,0));
 for(const section of guide.sections){
  const chosen=selection.sections.find(s=>s.chapterId===section.chapterId);
  assert.deepEqual(section.concepts.map(c=>c.id),chosen.conceptIds);
  assert.deepEqual(section.sourceQuestions.map(q=>q.id),chosen.sourceQuestionIds);
  for(const q of section.sourceQuestions){assert(scope[q.id].inScope);assert.equal(scope[q.id].chapterId,section.chapterId);}
  for(const concept of section.concepts){
   assert.equal(concept.summary,selection.conceptOverrides?.[concept.id]?.summary??concepts.get(concept.id).summary);
   assert.deepEqual(concept.keyPoints,concepts.get(concept.id).keyPoints);
  }
 }
 const thiamine=guide.sections.flatMap(s=>s.concepts).find(c=>c.id==='ch28-thiamine');
 assert.match(thiamine.summary,/do not delay urgent glucose/);
 assert.match(thiamine.correctionSourceUrl,/asam\.org/);
 assert(!thiamine.summary.includes('requires thiamine before glucose'));
});

// Mirror only ancestors of mutable files; everything else is read-only symlinks.
// The generator itself is copied so import.meta.url resolves to the temporary root.
function isolatedCheck(relative,mutate){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'retake-distilled-check-'));
 const script='scripts/content/build-retake-distilled.mjs';
 const changed=new Map([[script,s=>s],[relative,mutate]]);
 function mirror(prefix=''){
  fs.mkdirSync(path.join(temp,prefix),{recursive:true});
  for(const entry of fs.readdirSync(path.join(root,prefix))){
   const name=prefix?prefix+'/'+entry:entry,dest=path.join(temp,name);
   if(changed.has(name))fs.writeFileSync(dest,changed.get(name)(text(name)));
   else if([...changed.keys()].some(p=>p.startsWith(name+'/')))mirror(name);
   else fs.symlinkSync(path.join(root,name),dest);
  }
 }
 try{mirror();return spawnSync(process.execPath,[path.join(temp,script),'--check'],{encoding:'utf8',timeout:30000});}
 finally{fs.rmSync(temp,{recursive:true,force:true});}
}
test('Check mode rejects stale exports and stale reviewed source hashes without editing the working tree',()=>{
 const staleExport=isolatedCheck('public'+distilled.collections[0].downloads.questions,body=>body+'\nUnreviewed output drift\n');
 assert.notEqual(staleExport.status,0);assert.match(staleExport.stderr,/Stale public\/study\/biochemistry-retake/);
 const staleMap=isolatedCheck('data/biochemistry-retake/source-topic-map.json',body=>{
  const value=JSON.parse(body);value.questions['retake-final-cell-block-q027'].sourceHash='0'.repeat(64);return JSON.stringify(value);
 });
 assert.notEqual(staleMap.status,0);assert.match(staleMap.stderr,/Stale scope decision: retake-final-cell-block-q027/);
});
