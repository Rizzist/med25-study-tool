import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../data/divine-ethics/catalog.json',import.meta.url),'utf8'));
async function route(path,body){const {default:worker}=await import('../dist/server/index.js');return worker.fetch(new Request(`http://localhost${path}`,body===undefined?undefined:{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),{ASSETS:{fetch:async()=>new Response('not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});}
test('Divine Ethics routes: correct practice count, empty finals and source isolation',async()=>{
 const summary=await route('/api/bank/summary');assert.equal(summary.status,200);
 const exam=(await summary.json()).exams.find(e=>e.id==='term2-divine-ethics');assert(exam);assert.equal(exam.questionCount,75);assert.equal(exam.finalExamQuestionCount,0);
 const ids=catalog.modules[0].questionIds;
 const focused=await route('/api/questions/by-ids',{exam:'term2-divine-ethics',ids,limit:75,preserveOrder:true,purpose:'practice'});assert.equal(focused.status,200);assert.deepEqual((await focused.json()).questions.map(q=>q.id),ids);
 const other=await route('/api/questions/by-ids',{exam:'term2-religion',ids,limit:75,purpose:'practice'});assert.equal((await other.json()).questions.length,0);
 const sprint=await route('/api/questions/sprint',{exam:'term2-divine-ethics',collection:'all',limit:20});assert.equal(sprint.status,200);const qs=(await sprint.json()).questions;assert.equal(qs.length,20);assert(qs.every(q=>q.tags.includes('divine-ethics-practice')));
 assert.equal((await route('/api/final-exam?exam=term2-divine-ethics')).status,400);
});
