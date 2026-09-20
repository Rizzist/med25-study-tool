import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import { nutritionPastPapers } from "../scripts/content/nutrition-past-papers.mjs";
import { nutritionPractice } from "../scripts/content/nutrition-practice.mjs";
import { nutritionFinalBank } from "../src/lib/mcq/nutrition-final-bank.mjs";
import { isExamId, matchesTerm2Exam } from "../src/lib/mcq/exams.mjs";
import { createEmptyProgress, parseProgress } from "../src/lib/mcq/study-progress.mjs";
import { emptyFinalExamProgress, parseFinalExamProgress, reconcileFinalExamSession } from "../src/lib/mcq/final-exam-state.mjs";
const json = path => JSON.parse(readFileSync(new URL(`../${path}`,import.meta.url),"utf8"));
const jsonl = path => readFileSync(new URL(`../${path}`,import.meta.url),"utf8").trim().split("\n").map(JSON.parse);
const practice=jsonl("data/bank/questions/term2-nutrition.jsonl"), final=jsonl("data/final-exams/nutrition-past-papers.jsonl");
const catalog=json("data/nutrition/catalog.json"), sources=json("data/nutrition/sources.json");
const validate=new Ajv2020({allErrors:true}).compile(json("schemas/mcq-question.schema.json"));

test("nutrition: all items satisfy schema, key membership and per-option teaching",()=>{
  for(const q of [...practice,...final]){
    assert(validate(q),`${q.id}: ${JSON.stringify(validate.errors)}`);
    assert(q.options.some(o=>o.id===q.correctOptionId));
    assert.equal(new Set(q.options.map(o=>o.text.toLowerCase())).size,4);
    for(const o of q.options.filter(o=>o.id!==q.correctOptionId)) assert(q.distractorExplanations[o.id]?.length>20,`${q.id}/${o.id}`);
    assert(q.source.page && q.source.chapter && q.source.excerpt);
    assert(matchesTerm2Exam(q,"term2-nutrition"));
    assert(!matchesTerm2Exam(q,"term2-biochemistry"));
  }
});
test("nutrition: original final options/order and keys match the hand-checked transcription",()=>{
  assert.equal(final.length,nutritionPastPapers.length);
  for(const [id,section,prompt,options,key] of nutritionPastPapers){
    const q=final.find(q=>q.id===`nutrition-past-${id.toLowerCase()}`);
    assert.equal(q.prompt,prompt);assert.deepEqual(q.options.map(o=>o.text),options);
    assert.equal(q.correctOptionId,"ABCD"[key]);
    assert(q.tags.includes(nutritionFinalBank.requiredTag));
    assert(sources.records.some(r=>r.id===id));
  }
});
test("nutrition: every one of the 128 source items remains accessible in Final Exam",()=>{
  assert.equal(catalog.archive.length,128);assert.equal(new Set(catalog.archive.map(r=>r.id)).size,128);
  for(const [prefix,count] of [["F",24],["N",28],["D",40],["O",36]]){
    for(let n=1;n<=count;n++) assert(catalog.archive.some(r=>r.id===`${prefix}${n}`));
  }
  for(const r of catalog.archive){
    assert(r.explanation.length>20);assert(r.page>=1);
    assert(catalog.papers.some(p=>p.id===r.paperId));
    if(r.gradedQuestionId) assert(final.some(q=>q.id===r.gradedQuestionId));
    else { assert(r.ungradedReason);assert.equal(r.checkedAnswer,null); }
  }
  for(const paper of catalog.papers){
    const data=readFileSync(new URL(`../public${paper.file}`,import.meta.url));
    assert.equal(data.subarray(0,4).toString(),"%PDF");
    assert.equal(createHash("sha256").update(data).digest("hex"),paper.sha256);
  }
  assert.equal(catalog.archive.find(r=>r.id==="N18").gradingStatus,"duplicate-source");
  assert.equal(catalog.archive.find(r=>r.id==="N24").gradingStatus,"duplicate-source");
});
test("nutrition: uncertain keys are visible but never forced into the scored bank",()=>{
  for(const id of ["F4","F11","F13","F16","F19","F21","D14","D21","D24","D28","D29","D30"]){
    const item=catalog.archive.find(r=>r.id===id);
    assert(item && !item.gradedQuestionId, id);
  }
  assert.match(catalog.archive.find(r=>r.id==="F21").explanation,/24-hydroxylation/);
  assert.match(catalog.archive.find(r=>r.id==="F11").explanation,/2\.4/);
});
test("nutrition: practice is separately sourced, balanced and covers all 23 review modules",()=>{
  assert.equal(practice.length,nutritionPractice.length);assert(practice.length>=80);
  assert.equal(catalog.modules.length,23);
  const mapped=catalog.modules.flatMap(m=>m.questionIds);
  assert.equal(new Set(mapped).size,practice.length);
  assert(catalog.modules.every(m=>m.questionIds.length>=3));
  const finalIds=new Set(final.map(q=>q.id));
  const finalPrompts=new Set(final.map(q=>q.prompt));
  for(const q of practice){assert(!finalIds.has(q.id));assert(!finalPrompts.has(q.prompt));assert(!q.tags.some(t=>/past-paper|final-bank|telegram-final/.test(t)));}
  const keys=[..."ABCD"].map(k=>practice.filter(q=>q.correctOptionId===k).length);
  assert(Math.max(...keys)-Math.min(...keys)<=1);
  assert(practice.filter(q=>q.difficulty>=4).length>=35);
  for(const q of practice.filter(q=>q.tags.includes("nutrition-section-oral"))) assert(q.tags.includes("scope-unconfirmed-oral-health"));
});
test("nutrition: exam and saved progress stay isolated from old exams",()=>{
  assert(isExamId("term2-nutrition"));
  const state=createEmptyProgress();state.exams["term2-nutrition"].wrongIds=[practice[0].id];
  assert.deepEqual(parseProgress(JSON.stringify(state)),state);
  assert.equal(state.exams["term2-biochemistry"].wrongIds.length,0);
  const old=emptyFinalExamProgress();old.sessions["july29:telegram-past-papers"]={sentinel:"keep"};
  const migrated=parseFinalExamProgress(JSON.stringify(old));
  assert.deepEqual(migrated.sessions["july29:telegram-past-papers"],{sentinel:"keep"});
  const key="term2-nutrition:nutrition-past-papers";
  assert.equal(migrated.sessions[key],null);
  migrated.sessions[key]=reconcileFinalExamSession(null,final,"nutrition-fixture");
  assert.deepEqual(parseFinalExamProgress(JSON.stringify(migrated)),migrated);
});
test("nutrition: embedded practice/final separation and UI entrypoints",()=>{
  const embedded=json("data/bank/embedded-bank.json");
  assert.deepEqual(embedded.finalExams["term2-nutrition:nutrition-past-papers"],final);
  assert.deepEqual(embedded.questions.filter(q=>q.tags.includes("exam-term2-nutrition")),practice);
  const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
  // MCQ-only shell: the shared past-exam hub serves the Nutrition source papers and archive.
  assert.match(page,/<PastExamHub key=\{exam\} exam=\{exam\}/);
  const hub=readFileSync(new URL("../src/components/PastExamHub.tsx",import.meta.url),"utf8");assert.match(hub,/exam==='term2-nutrition'/);assert.match(hub,/<NutritionArchive/);
});
