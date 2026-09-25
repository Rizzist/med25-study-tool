import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const data=read('data/biochemistry/past-papers.json');
const audit=read('data/biochemistry/izam-source-audit.json');
const core=read('public/study/biochemistry/core-exam.json');
const bank=fs.readFileSync(new URL('../data/final-exams/biochemistry-metabolism-past-papers.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
const q=(p,n)=>bank.find(q=>q.id===`biochemistry-${p}-izam-q${String(n).padStart(3,'0')}`);

test('IZAM source ledger covers all 166 downloaded files plus 24 archive members without deletion',()=>{
 assert.equal(audit.records.length,163);
 assert.equal(new Set(audit.records.map(r=>r.sha256)).size,163);
 const paths=audit.records.flatMap(r=>r.files);
 assert.equal(paths.length,190);assert.equal(new Set(paths).size,190);
 assert.equal(paths.filter(p=>!p.startsWith('Archives/')||p.endsWith('.zip')).length,166);
 assert(audit.records.every(r=>r.disposition&&r.note));
});
test('only three newly dated papers and one explicitly optional report; no duplicate sitting cards',()=>{
 const imported=data.papers.filter(p=>p.id.endsWith('-izam'));
 assert.equal(imported.length,4);
 assert.deepEqual(imported.map(p=>[p.date,p.questions.length,p.defaultEligible]),[
  ['2021-06-23',40,true],['2024-07-13',52,true],['2024-12-05',36,true],[null,50,false]
 ]);
 for(const p of imported){assert.deepEqual(p.questions.map(q=>q.number),Array.from({length:p.questions.length},(_,i)=>i+1));assert.equal(p.missingSourceNumbers.length,0);}
 const hashes=new Map();
 for(const p of data.papers)for(const s of p.sources){assert(!hashes.has(s.sha256)||hashes.get(s.sha256)===p.id,`Same source appears as two papers: ${s.originalFilename}`);hashes.set(s.sha256,p.id);}
 for(const r of audit.records.filter(r=>r.disposition==='duplicate-source'))assert(hashes.get(r.sha256)===r.canonicalPaperId);
 for(const [prefix,id] of [['7501ac','2017-kish'],['f7ef17','2022-jan-26'],['8e44e8','2023-jan-29']])assert.equal(audit.records.find(r=>r.sha256.startsWith(prefix)).canonicalPaperId,'biochemistry-'+id);
 const keyDoc=audit.records.find(r=>r.sha256.startsWith('2cb23a'));assert.equal(keyDoc.disposition,'reference-not-pyq');assert.equal(keyDoc.canonicalPaperId,null);
});
test('the roster and incomplete answer-only export do not silently become official keyed MCQs',()=>{
 const privateRows=audit.records.filter(r=>r.disposition==='private-answer-sheet');assert.equal(privateRows.length,2);
 for(const r of privateRows)assert(!data.papers.some(p=>p.sources.some(s=>s.sha256===r.sha256)));
 assert.equal(audit.records.filter(r=>r.disposition==='incomplete-source').length,1);
 assert(!core.papers.some(p=>p.id.includes('undated')));
 assert(core.questions.every(r=>r.members.every(m=>!m.paperId.includes('undated')&&!m.paperId.includes('reconstruction'))));
 assert.match(core.exclusionNote,/undated/);
});
test('new answer qualifications survive export and use existing inferred-answer color provenance',()=>{
 for(const row of bank.filter(q=>q.id.includes('-izam-q')))assert.equal(row.answerReview.basis,'ai-inferred');
 assert.deepEqual(q('2021-june-23',21).acceptedOptionIds,['A','B','D']);
 assert.deepEqual(q('2021-june-23',25).acceptedOptionIds,['A','C']);
 assert.deepEqual(q('2024-july-13',23).acceptedOptionIds,['A','D']);
 assert.deepEqual(q('undated-50',39).acceptedOptionIds,['A','C']);
 assert.deepEqual(q('undated-50',43).acceptedOptionIds,['A','B']);
 assert.equal(q('2024-july-13',19).correctOptionId,'A');assert.match(q('2024-july-13',19).explanation,/legacy/);
 assert.equal(q('2024-dec-05',30).correctOptionId,'C');assert.match(q('2024-dec-05',30).explanation,/120 ATP/);
 assert.equal(q('2021-june-23',37).correctOptionId,'E');assert.match(q('2021-june-23',37).options[4].text,/5 or 7/);
 assert(q('2024-july-13',33).qualityFlags.includes('editorially-repaired-source-question'));
 assert.match(q('undated-50',18).options[2].text,/Visible blue/);
});
test('expanded Core keeps independent repeats while preserving distinct ATP/polarity questions',()=>{
 const group=id=>core.questions.find(r=>r.members.some(m=>m.questionId===id));
 const plp=group(q('2024-july-13',43).id);
 assert(plp.members.some(m=>m.questionId===q('2024-dec-05',3).id));
 assert.equal(new Set(plp.sourcePaperIds).size,plp.sourceCollectionCount);
 assert(!core.questions.filter(r=>r.kind==='repeat').some(r=>r.members.some(m=>m.questionId===q('2021-june-23',37).id)));
 assert.notEqual(group(q('2024-dec-05',30).id)?.questionId,group(q('2024-july-13',19).id)?.questionId,'Stearate and oleate retain distinct calculations');
 assert.notEqual(group(q('2021-june-23',1).id)?.questionId,group(q('2024-july-13',3).id)?.questionId,'Not an enzyme differs from ATP-generating glycolytic enzyme');
});
