import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { selectPracticalSprint } from '../src/lib/mcq/practical-selection.mjs';
import { filterPracticalQuestions } from '../src/lib/mcq/practical-filter.mjs';
const root=new URL('../',import.meta.url);
const read=(path)=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const catalog=read('data/term2/physiology-practical.json');
const bank=readFileSync(new URL('data/bank/questions/term2-physiology-practical.jsonl',root),'utf8').trim().split('\n').map(JSON.parse);
const answer=(q)=>q.options.find((o)=>o.id===q.correctOptionId).text;

test('visual coverage is 31 independently keyed cases and 124 image questions across all stations',()=>{
 assert.equal(catalog.visualCases.length,31);
 assert.equal(catalog.visualCases.filter((c)=>c.stationId==='ecg').length,22);
 assert.equal(catalog.totals.webEcgImages,20);
 assert.equal(new Set(catalog.visualCases.map((c)=>c.path)).size,31);
 for(const station of catalog.stations)assert(catalog.visualCases.some((c)=>c.stationId===station.id));
 const ids=catalog.visualCases.flatMap((c)=>c.questionIds);
 assert.equal(ids.length,124);assert.equal(new Set(ids).size,124);
 for(const c of catalog.visualCases){
  assert.equal(c.questionIds.length,4);assert(c.overview.length>=2);assert(c.annotations.length);
  for(const a of [...c.annotations,...c.masks]){assert(a.x>=0&&a.y>=0&&a.width>0&&a.height>0);assert(a.x+a.width<=1.001&&a.y+a.height<=1.001);}
  for(const id of c.questionIds){const q=bank.find((q)=>q.id===id);assert.equal(q.media[0].path,c.path);assert.equal(q.kind,'image_single_best_answer');assert(q.tags.includes(`practical-case-${c.id}`));assert.equal(q.examPriority,c.scope==='extension'?'standard':'core');}
 }
});
test('web ECG originals are unique, attributed and byte-for-byte unchanged',()=>{
 const assets=read('data/term2/practical/web-assets.json');assert.equal(assets.length,20);
 assert.equal(new Set(assets.map((a)=>a.sha256)).size,20);
 for(const a of assets){assert.match(a.sourceUrl,/^https:\/\/en.ecgpedia.org\/wiki\//);assert(a.fileUrl&&a.permissionUrl&&a.license);assert.equal(createHash('sha256').update(readFileSync(new URL(`public/study/${a.path}`,root))).digest('hex'),a.sha256);}
 for(const id of ['ecg-08','ecg-10','ecg-11','ecg-12','ecg-13','ecg-14','ecg-22'])assert(catalog.visualCases.find((c)=>c.id===id).masks.length>0,`Missing printed-answer mask: ${id}`);
});
test('all 320 previous correct answers and option identities survive the review',()=>{
 const old=read('tests/fixtures/physiology-practical-v2-answers.json');assert.equal(old.length,320);
 for(const previous of old){const q=bank.find((q)=>q.id===previous.id);assert(q);assert.equal(q.correctOptionId,previous.correctOptionId);assert.equal(answer(q),previous.answer);}
 assert(catalog.qualityAudit.revisedQuestions>=45);
 assert.equal(bank.filter((q)=>q.revision===2).length,catalog.qualityAudit.revisedQuestions);
 for(const item of catalog.qualityAudit.revisions)assert(bank.find((q)=>q.id===item.id).tags.includes('practical-quality-revised'));
});
test('image mocks diversify figures, while explicit case practice retains its four questions',()=>{
 const items=bank.filter((q)=>q.tags.includes('practical-station-ecg')&&q.tags.includes('practical-visual-case'));
 const picked=selectPracticalSprint(items,{studyMode:'exam',limit:20,random:()=>.43}).questions;
 assert.equal(new Set(picked.map((q)=>q.tags.find((t)=>t.startsWith('practical-case-')))).size,20);
 const first=items.filter((q)=>catalog.visualCases[0].questionIds.includes(q.id));
 assert.equal(selectPracticalSprint(first,{studyMode:'exam',limit:4}).questions.length,4);
});
test('scope and quality filters isolate exactly the intended questions',()=>{
 const ids=bank.map((q)=>q.id);
 const extension=filterPracticalQuestions(catalog.questionIndex,ids,{filter:'extension'});
 const course=filterPracticalQuestions(catalog.questionIndex,ids,{filter:'course'});
 assert(extension.length>0);assert.equal(extension.length+course.length,444);assert(!course.some((id)=>extension.includes(id)));
 assert.equal(filterPracticalQuestions(catalog.questionIndex,ids,{filter:'revised'}).length,catalog.qualityAudit.revisedQuestions);
});
test('source explanations, annotations and diagnosis links are gated in rendered image components',async()=>{
 const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {PracticalCaseFigure} from './src/components/PracticalCaseFigure';export const render=(item,revealed)=>renderToStaticMarkup(<PracticalCaseFigure item={item} src="/safe-image.png" revealed={revealed}/>);`,loader:'tsx',resolveDir:fileURLToPath(root)},platform:'node',format:'cjs',bundle:true,packages:'external',write:false,alias:{'@':fileURLToPath(root)}});
 const compiled={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),compiled,compiled.exports);
 for(const c of catalog.visualCases){
  const before=compiled.exports.render(c,false);const after=compiled.exports.render(c,true);
  assert.doesNotMatch(before,/Connect it to the theory|Read the evidence|pp-case-marker|Source interpretation/);
  assert.match(after,/Connect it to the theory/);assert.match(after,/pp-case-marker/);assert.match(after,/Highlight region/);
  if(c.masks.length){assert.match(before,/pp-case-mask/);assert.doesNotMatch(after,/class="pp-case-mask"/);}
  assert.match(before,/Zoom image in/);assert.match(before,/Scrollable source image/);
 }
 const page=readFileSync(new URL('app/page.tsx',root),'utf8');
 assert.match(page,/PracticalCaseFigure[^\n]+revealed=\{review\}/);
 assert.match(page,/studyMode === "learn" && hasAnswer/);
});
test('new worked calculations and user-supplied theory traps have independently checked answers',()=>{
 const expected={
 'pp-ecg-visual-ecg-21-2':'0.02 seconds','pp-ecg-visual-ecg-21-3':'150 beats/min',
 'pp-ecg-visual-ecg-22-1':'−60° and +120°','pp-ecg-visual-ecg-22-2':'Approximately −60°',
 'pp-bp-visual-bp-gap-1':'180/80 mmHg','pp-rbc-visual-rbc-regions-2':'4.8 million cells/µL',
 'pp-wbc-visual-wbc-depth-2':'8,800 cells/µL','pp-differential-visual-dlc-transfer-3':'2,100 cells/µL',
 'pp-hematocrit-visual-hct-reader-2':'46%',
 };
 for(const [id,value]of Object.entries(expected))assert.equal(answer(bank.find((q)=>q.id===id)),value,id);
 assert(catalog.visualCases.find((c)=>c.id==='ecg-22').overview.some((t)=>t.includes('−40°')));
 assert(catalog.visualCases.find((c)=>c.id==='ecg-09').overview.some((t)=>t.includes('no printed time calibration')));
 assert(bank.find((q)=>q.id==='pp-ecg-visual-ecg-10-2').explanation.includes('Consecutive conducted PR'));
});
