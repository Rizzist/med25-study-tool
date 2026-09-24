import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {coreSelection,selectCollectionQuestions,finalSessionSeed} from '../src/lib/mcq/curated-core.mjs';
import {finalPaperKey,paperAttemptSummary} from '../src/lib/mcq/paper-selection.mjs';
import {parseExport} from '../src/lib/paper-pdf/parse-export.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const catalog=read('data/nutrition/catalog.json'),course=read('data/review-curriculum/courses/term2-nutrition.json');
const imports=fs.readdirSync(new URL('../data/nutrition/imports/',import.meta.url)).filter(f=>f.endsWith('.json')).map(f=>read('data/nutrition/imports/'+f));
const core=read('public/study/nutrition/core-exam.json');
const bank=fs.readFileSync(new URL('../data/final-exams/nutrition-past-papers.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
const downloads=read('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id==='term2-nutrition');
test('duplicate scans preserve their own reordered choices but never add scored weight',()=>{
 const n18=catalog.archive.find(r=>r.id==='N18'),n24=catalog.archive.find(r=>r.id==='N24');
 assert.equal(n18.duplicateOf,'N6');assert.equal(n24.duplicateOf,'N3');
 assert.match(n18.sourceOriginal.options[3],/pectin/i);assert.match(n24.sourceOriginal.options[0],/gluconeogenesis/i);
 for(const r of [n18,n24]){assert.equal(r.gradedQuestionId,null);assert.equal(r.gradingStatus,'duplicate-source');assert(!bank.some(q=>q.id==='nutrition-past-'+r.id.toLowerCase()));}
 const archive=fs.readFileSync(new URL('../src/components/NutritionExam.tsx',import.meta.url),'utf8');assert.match(archive,/Edited study version/);assert.match(archive,/sourceOriginal\.options/);
 const finalUI=fs.readFileSync(new URL('../src/components/FinalExam.tsx',import.meta.url),'utf8');assert(!finalUI.includes("scoring uses the source's intended convention"));
});
test('all five distinct new papers are retained, aliases are not duplicate collections',()=>{
 assert.equal(imports.length,5);assert.equal(catalog.papers.length,9);
 assert.equal(catalog.archive.length,128+imports.reduce((n,p)=>n+p.questions.length,0));
 assert.equal(new Set(imports.map(p=>p.sha256)).size,5);
 assert.equal(downloads.collections.length,9);
 for(const p of imports){
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../public'+p.file,import.meta.url))).digest('hex'),p.sha256);
  for(const r of p.questions){const qid=`nutrition-past-${p.id}-q${String(r.number).padStart(3,'0')}`,q=bank.find(q=>q.id===qid),a=catalog.archive.find(a=>a.id===qid.replace('nutrition-past-',''));assert(a);assert.equal(Boolean(q),Boolean(r.key));assert.equal(a.page,r.page);
   if(!q){assert(a.ungradedReason);continue;}assert.equal(q.prompt,r.prompt);assert.deepEqual(q.options.map(o=>o.text),r.options);assert.equal(q.correctOptionId,r.key);assert(q.answerReview.evidence.length);assert.equal(course.questions[qid].sectionId,'nutrition/'+r.sectionId);
   if(r.repair){assert(r.originalQuestion);assert(q.qualityFlags.includes('editorially-repaired-source-question'));assert(q.source.excerpt.includes(r.originalQuestion.prompt));assert.equal(q.answerReview.basis,'ai-inferred');}
  }
 }
 assert(!catalog.papers.some(p=>p.originalFilename==='nutrition-f-questions-and-answer-key.pdf'));
});
test('all question/key downloads parse and retained source counts agree',()=>{
 for(const c of downloads.collections){const text=fs.readFileSync(new URL('../public'+c.downloads.questionsAndKey,import.meta.url),'utf8'),doc=parseExport(text);assert.equal(doc.questions.length,c.sourceRecordCount,c.id);assert.equal(doc.keys.length,c.sourceRecordCount,c.id);assert.equal(c.gradedQuestionCount,c.gradedQuestionIds.length);assert(c.gradedQuestionIds.every(id=>bank.some(q=>q.id===id)));}
});
test('Core is a smaller traceable selection: unique representative per repeat and distinct coverage',()=>{
 assert.equal(core.idPrefix,'nutrition-core');assert.equal(core.sourceCollectionCount,8);assert(core.repeatedPatternCount>0);assert(core.supplementalCount>0);assert(core.questions.length<core.scoredSourceQuestionCount);
 assert.equal(core.questions.length,core.repeatedPatternCount+core.supplementalCount);assert.equal(new Set(core.questions.map(q=>q.questionId)).size,core.questions.length);
 const memberIds=new Set();
 for(const r of core.questions){assert(r.members.some(m=>m.questionId===r.questionId));assert.equal(r.sourceCollectionCount,new Set(r.members.map(m=>m.paperId)).size);assert.equal(r.kind==='repeat',r.sourceCollectionCount>=2);const s=course.sections.find(s=>s.id===r.sectionId);assert(s);assert.equal(s.pdfPage,r.pdfPage);
  for(const m of r.members){assert(!memberIds.has(m.questionId));memberIds.add(m.questionId);const q=bank.find(q=>q.id===m.questionId);assert(q);const a=catalog.archive.find(a=>a.gradedQuestionId===q.id),p=catalog.papers.find(p=>p.id===a.paperId);assert.notEqual(p.id,'O');assert.equal(m.sourceUrl,p.file+'#page='+a.page);if(r.kind==='repeat')assert(!q.qualityFlags.includes('editorially-repaired-source-question'));}
 }
 assert.equal(core.repeatedSourceOccurrenceCount,core.questions.filter(q=>q.kind==='repeat').reduce((n,q)=>n+q.members.length,0));
});
test('Nutrition Core, sections, repetitions and Biochemistry Core use isolated state and immutable ordering',()=>{
 const full=coreSelection(core),repeat=coreSelection(core,'repeats'),section=coreSelection(core,core.sections[0].id),bio=coreSelection(read('public/study/biochemistry/core-exam.json'));
 assert.equal(new Set([full.id,repeat.id,section.id,bio.id]).size,4);assert.equal(full.id,'nutrition-core-all');
 const selected=selectCollectionQuestions([...bank].reverse(),full);assert.deepEqual(selected.map(q=>q.id),full.gradedQuestionIds);assert.throws(()=>selectCollectionQuestions([],full),/versions differ/);
 const base=finalPaperKey('term2-nutrition'),key=finalPaperKey('term2-nutrition',full.id),legacy={questionIds:[bank[0].id],answers:{},completedAt:null};assert.equal(finalSessionSeed({[base]:legacy},key,base,full,'start'),null);
 assert.equal(finalSessionSeed({[key]:legacy},key,base,full,'start'),legacy);
 const completed={questionIds:selected.map(q=>q.id),answers:Object.fromEntries(selected.map(q=>[q.id,{selectedOptionId:q.correctOptionId,correct:true}])),completedAt:'2026-09-24T00:00:00Z'};
 assert.equal(paperAttemptSummary({sessions:{[key]:completed}},'term2-nutrition',full).correct,selected.length);const before=JSON.stringify(completed);selectCollectionQuestions(bank,repeat);assert.equal(JSON.stringify(completed),before);
});
