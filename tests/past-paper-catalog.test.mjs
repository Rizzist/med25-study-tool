import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mergePastPaperSources,filterPastPapers} from '../src/lib/mcq/past-paper-catalog.mjs';
import {combinedSourceSelection,paperAttemptSummary,finalPaperKey} from '../src/lib/mcq/paper-selection.mjs';
import {scopeRetakePaper} from '../src/lib/mcq/retake-paper-scope.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../public/study/past-paper-downloads/catalog.json',import.meta.url)));
const originals=JSON.parse(fs.readFileSync(new URL('../public/study/term1-telegram/catalog.json',import.meta.url)));
const get=id=>catalog.courses.find(c=>c.id===id);

test('one catalog includes every scan, groups matching versions and retains scored identities',()=>{
  for(const [id,count] of [['july25',12],['july29',25],['term1-biochemistry-retake',27]]){
    const raw=get(id),before=JSON.stringify(raw),merged=mergePastPaperSources(raw,originals);
    assert.equal(merged.collections.length,count);
    assert.equal(new Set(merged.collections.map(p=>p.id)).size,count);
    assert.equal(merged.collections.flatMap(p=>p.sourcePapers).length,id==='july25'?12:24);
    assert.equal(JSON.stringify(raw),before,'merging must not mutate scored catalog');
    for(const old of raw.collections){
      const current=merged.collections.find(p=>p.id===old.id);
      assert.deepEqual(current.gradedQuestionIds,old.gradedQuestionIds);
      assert.deepEqual(current.downloads,old.downloads);
    }
    for(const scan of merged.collections.filter(p=>p.sourceOnly)){
      assert.equal(scan.gradedQuestionCount,0);
      assert.deepEqual(scan.gradedQuestionIds,[]);
      assert.equal(scan.downloads.questions,'');
    }
  }
  const tissue=mergePastPaperSources(get('july25'),originals);
  assert.deepEqual(tissue.collections.find(p=>p.id==='july25-tdf-2022').sourcePapers.map(p=>p.id),['tissue-2023-annotated','tissue-jan2023']);
  assert(!tissue.collections.some(p=>p.id==='tissue-test20162'));
  const linked=mergePastPaperSources(get('july29'),originals).collections[0].sourcePapers[0];
  assert.deepEqual(fs.readFileSync(new URL('../public'+linked.url,import.meta.url)),fs.readFileSync(new URL('../public'+linked.duplicateOfUrl,import.meta.url)));
  assert.equal(mergePastPaperSources(get('term2-divine-ethics'),originals),get('term2-divine-ethics'));
});

test('search and filters operate across scored papers, original scans and supplements',()=>{
  const tissue=mergePastPaperSources(get('july25'),originals).collections;
  assert.deepEqual(filterPastPapers(tissue,'20162').map(p=>p.id),['july25-test-20162']);
  assert.deepEqual(filterPastPapers(tissue,'Tehran 2026').map(p=>p.id),['tissue-tehran2026']);
  assert.equal(filterPastPapers(tissue,'','scored').length,4);
  const bio=mergePastPaperSources(get('july29'),originals).collections;
  assert.equal(filterPastPapers(bio,'','practical').length,7);
  assert.equal(filterPastPapers(bio,'','scored').length,2);
  assert(filterPastPapers(bio,'','supplement').every(p=>!p.defaultEligible));
  assert(!filterPastPapers(bio,'nonexistent title').length);
});

test('combined sessions and completed attempts are unchanged by adding scans',async()=>{
  for(const id of ['july25','july29','term1-biochemistry-retake']){
    const raw=get(id),merged=mergePastPaperSources(raw,originals);
    assert.deepEqual(await combinedSourceSelection(merged.collections,merged.collections.map(p=>p.id)),await combinedSourceSelection(raw.collections,raw.collections.map(p=>p.id)));
    const paper=raw.collections[0],completedAt='2026-10-09T00:00:00Z';
    const progress={sessions:{[finalPaperKey(id,paper.id)]:{questionIds:paper.gradedQuestionIds,answers:Object.fromEntries(paper.gradedQuestionIds.map(q=>[q,{selectedOptionId:'a',correct:true}])),completedAt}}};
    assert.deepEqual(paperAttemptSummary(progress,id,merged.collections[0]),paperAttemptSummary(progress,id,paper));
    assert.equal(paperAttemptSummary(progress,id,merged.collections[0]).completedAt,completedAt);
  }
});

test('full retake scope groups the same source without changing full-paper question IDs',()=>{
  const raw=get('term1-biochemistry-retake');
  const scoped={...raw,collections:raw.collections.map(p=>scopeRetakePaper(p,'full'))};
  const merged=mergePastPaperSources(scoped,originals);
  const matched=merged.collections.find(p=>p.id==='retake-february-2021--full');
  assert.equal(matched.sourcePapers[0].id,'cell-feb2021-answers');
  assert(!merged.collections.some(p=>p.id==='cell-feb2021-answers'));
  assert.deepEqual(matched.gradedQuestionIds,scoped.collections.find(p=>p.id===matched.id).gradedQuestionIds);
});
