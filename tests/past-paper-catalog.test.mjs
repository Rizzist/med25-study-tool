import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mergePastPaperSources,filterPastPapers} from '../src/lib/mcq/past-paper-catalog.mjs';
import {combinedSourceSelection,paperAttemptSummary,finalPaperKey} from '../src/lib/mcq/paper-selection.mjs';
import {scopeRetakePaper} from '../src/lib/mcq/retake-paper-scope.mjs';
import {selectCollectionQuestions} from '../src/lib/mcq/curated-core.mjs';
import {parseExport} from '../src/lib/paper-pdf/parse-export.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const catalog=read('public/study/past-paper-downloads/catalog.json');
const originals=read('public/study/term1-telegram/catalog.json');
const banks=read('data/term1-telegram/banks.json');
const get=id=>catalog.courses.find(c=>c.id===id);

test('every imported original maps to a takeable canonical paper with all three exports',()=>{
 for(const id of ['july25','july29','term1-biochemistry-retake']){
  const raw=get(id),before=JSON.stringify(raw),merged=mergePastPaperSources(raw,originals);
  assert.equal(JSON.stringify(raw),before);
  assert(!merged.collections.some(p=>p.sourceOnly),'no original-only substitute for imported papers');
  assert.equal(new Set(merged.collections.map(p=>p.id)).size,merged.collections.length);
  assert.equal(merged.collections.flatMap(p=>p.sourcePapers).length,id==='july25'?12:24);
  for(const paper of merged.collections.filter(p=>p.importBatch)){
   assert(paper.takeableQuestionIds.length>0,paper.id);
   assert.equal(paper.takeableQuestionIds.length,paper.sourceRecordCount);
   assert.equal(paper.gradedQuestionCount+paper.ungradedCount,paper.sourceRecordCount);
   const questions=selectCollectionQuestions(banks[paper.bankKey],paper);
   assert.equal(questions.length,paper.sourceRecordCount);
   assert.deepEqual(questions.filter(q=>q.correctOptionId).map(q=>q.id),paper.gradedQuestionIds);
   for(const [variant,url] of Object.entries(paper.downloads)){
    const parsed=parseExport(fs.readFileSync(new URL('../public'+url,import.meta.url),'utf8'));
    if(variant!=='answerKey')assert.deepEqual(parsed.questions.map(q=>q.id),paper.questionIds);
    if(variant!=='questions')assert.deepEqual(parsed.keys.map(q=>q.id),paper.questionIds);
    if(variant==='questions')assert.equal(parsed.keys.length,0);
   }
  }
 }
 const tissue=mergePastPaperSources(get('july25'),originals);
 assert.deepEqual(new Set(tissue.collections.find(p=>p.id==='tissue-jan2023').sourcePapers.map(p=>p.id)),new Set(['tissue-2023-annotated','tissue-jan2023']));
 assert(!tissue.collections.some(p=>p.id==='tissue-2023-annotated'));
});

test('search and filters span imported papers and supplements',()=>{
 const tissue=mergePastPaperSources(get('july25'),originals).collections;
 assert(filterPastPapers(tissue,'20162').some(p=>p.id==='tissue-test20162'));
 assert.deepEqual(filterPastPapers(tissue,'Tehran 2026').map(p=>p.id),['tissue-tehran2026']);
 const bio=mergePastPaperSources(get('july29'),originals).collections;
 assert.equal(filterPastPapers(bio,'','practical').length,7);
 assert(filterPastPapers(bio,'','supplement').every(p=>!p.defaultEligible));
 assert(!filterPastPapers(bio,'nonexistent title').length);
 assert.equal(filterPastPapers([{title:'Unkeyed recall',takeableQuestionIds:['q'],gradedQuestionCount:0}],'','scored').length,1);
});

test('all new papers combine, including unkeyed occurrences, while legacy attempts retain their identities',async()=>{
 for(const id of ['july25','july29','term1-biochemistry-retake']){
  const collections=mergePastPaperSources(get(id),originals).collections;
  const combined=await combinedSourceSelection(collections,collections.map(p=>p.id));
  assert.deepEqual(new Set(combined.takeableQuestionIds),new Set(collections.flatMap(p=>p.takeableQuestionIds??p.gradedQuestionIds)));
  const paper=collections.find(p=>!p.importBatch),completedAt='2026-10-09T00:00:00Z';
  const saved={sessions:{[finalPaperKey(id,paper.id)]:{questionIds:paper.gradedQuestionIds,answers:Object.fromEntries(paper.gradedQuestionIds.map(q=>[q,{selectedOptionId:'A',correct:true}])),completedAt}}};
  assert.equal(paperAttemptSummary(saved,id,paper).completedAt,completedAt);
 }
});

test('retake full and biochemistry scopes include imports and have separate saved identities',()=>{
 const raw=get('term1-biochemistry-retake');
 for(const paper of raw.collections){
  const full=scopeRetakePaper(paper,'full');assert.notEqual(full.id,paper.id);
  assert(full.gradedQuestionCount>=paper.gradedQuestionCount);
  if(paper.importBatch){
   const bank=banks[paper.bankKey];
   assert(selectCollectionQuestions(bank,paper).every(q=>q.subject==='biochemistry'),paper.id);
   assert(full.takeableQuestionIds.length>=paper.takeableQuestionIds.length);
  }
 }
});
