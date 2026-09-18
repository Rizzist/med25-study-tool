import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
const catalog=JSON.parse(readFileSync(new URL("../data/nutrition/catalog.json",import.meta.url),"utf8"));
async function route(path,body){
  const {default:worker}=await import("../dist/server/index.js");
  return worker.fetch(new Request(`http://localhost${path}`,body===undefined?undefined:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},{waitUntil(){},passThroughOnException(){}});
}
test("Nutrition routes: summary separates practice counts from genuine final papers",async()=>{
  const response=await route("/api/bank/summary");assert.equal(response.status,200);
  const body=await response.json(), exam=body.exams.find(e=>e.id==="term2-nutrition");
  assert(exam);assert.equal(exam.questionCount,catalog.counts.practice);
  assert.equal(exam.finalExamQuestionCount,catalog.counts.scoredPastPaper);
  assert.equal(exam.finalExamBanks[0].id,"nutrition-past-papers");
});
test("Nutrition routes: default final bank is Nutrition, never a generated-question fallback",async()=>{
  const response=await route("/api/final-exam?exam=term2-nutrition");assert.equal(response.status,200);
  const body=await response.json();assert.equal(body.questions.length,catalog.counts.scoredPastPaper);
  assert(body.questions.every(q=>q.tags.includes("final-bank-nutrition-past-papers")&&!q.tags.includes("nutrition-practice")));
  const explicit=await route("/api/final-exam?exam=term2-nutrition&bank=nutrition-past-papers");
  assert.deepEqual((await explicit.json()).questions,body.questions);
  assert.equal((await route("/api/final-exam?exam=term2-nutrition&bank=telegram-past-papers")).status,400);
  assert.equal((await route("/api/final-exam?exam=term2-cvs&bank=nutrition-past-papers")).status,400);
});
test("Nutrition routes: targeted Practice cannot load Nutrition final-paper IDs",async()=>{
  const ids=catalog.modules.find(m=>m.id==="vitamin-d").questionIds;
  const response=await route("/api/questions/by-ids",{exam:"term2-nutrition",ids:[...ids,"nutrition-past-f1"],limit:20,preserveOrder:true,purpose:"practice"});
  assert.equal(response.status,200);
  const body=await response.json();assert.deepEqual(body.questions.map(q=>q.id),ids);
  const other=await route("/api/questions/by-ids",{exam:"term2-biochemistry",ids,limit:20,preserveOrder:true,purpose:"practice"});
  assert.equal(other.status,200);assert.equal((await other.json()).questions.length,0);
});
