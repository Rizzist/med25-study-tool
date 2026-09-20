import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import {divineEthicsPractice} from '../scripts/content/divine-ethics-practice.mjs';
import {examIds,isExamId,matchesTerm2Exam} from '../src/lib/mcq/exams.mjs';
import {createEmptyProgress,parseProgress} from '../src/lib/mcq/study-progress.mjs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const json=p=>JSON.parse(read(p));
const catalog=json('data/divine-ethics/catalog.json'),coverage=json('data/divine-ethics/coverage.json');
const questions=read('data/bank/questions/term2-divine-ethics.jsonl').trim().split('\n').map(JSON.parse);
const embedded=json('data/bank/embedded-bank.json');
const validate=new Ajv2020({allErrors:true}).compile(json('schemas/mcq-question.schema.json'));
test('Divine Ethics: schema, exact keys, all-option rationales and isolated membership',()=>{
 assert.equal(questions.length,75);assert.equal(new Set(questions.map(q=>q.id)).size,75);assert.equal(new Set(questions.map(q=>q.prompt)).size,75);
 for(const q of questions){
  assert(validate(q),`${q.id}: ${JSON.stringify(validate.errors)}`);
  const r=divineEthicsPractice.find(r=>q.id===`divine-ethics-practice-${r.id}`);
  assert.equal(q.options.find(o=>o.id===q.correctOptionId).text,r.answer);
  for(const [text,why] of r.distractors){const option=q.options.find(o=>o.text===text);assert.equal(q.distractorExplanations[option.id],why);}
  for(const exam of examIds) assert.equal(matchesTerm2Exam(q,exam),exam==='term2-divine-ethics');
  assert.match(q.source.page,/PDF page \d+ · printed page \d+/);
  assert(!q.tags.some(t=>/past-paper|final-bank|telegram-final/.test(t)));
 }
 const counts=[...'ABCD'].map(k=>questions.filter(q=>q.correctOptionId===k).length);assert(Math.max(...counts)-Math.min(...counts)<=1);
});
test('Divine Ethics: every teaching page and topic covered without inventing contents-only chapters',()=>{
 assert.equal(catalog.modules.length,9);assert.equal(catalog.counts.teachingPages,12);
 assert.equal(new Set(catalog.modules.flatMap(m=>m.questionIds)).size,75);
 assert(catalog.modules.every(m=>m.questionIds.length>=6&&m.paragraphs.length>=3&&m.recall.length>=2));
 assert.equal(coverage.pages.length,15);
 assert(coverage.pages.filter(p=>p.kind==='contents').every(p=>p.questionIds.length===0));
 assert(coverage.pages.filter(p=>p.kind==='teaching').every(p=>p.questionIds.length>0));
 assert.deepEqual(coverage.pages.map(p=>p.printed),[5,6,7,59,60,56,58,52,32,46,47,49,54,40,35]);
});
test('Divine Ethics: embedded practice and saved progress separate from Religion and finals',()=>{
 assert(isExamId('term2-divine-ethics'));
 assert.deepEqual(embedded.questions.filter(q=>matchesTerm2Exam(q,'term2-divine-ethics')),questions);
 assert(!Object.values(embedded.finalExams).flat().some(q=>matchesTerm2Exam(q,'term2-divine-ethics')));
 const progress=createEmptyProgress();progress.exams['term2-divine-ethics'].wrongIds=[questions[0].id];
 assert.deepEqual(parseProgress(JSON.stringify(progress)),progress);assert.deepEqual(progress.exams['term2-religion'].wrongIds,[]);
});
test('Divine Ethics: study source and review are real PDFs with mobile-friendly entrypoints',()=>{
 for(const path of [catalog.source.file,catalog.source.reviewFile])assert.equal(readFileSync(new URL(`../public${path}`,import.meta.url)).subarray(0,4).toString(),'%PDF');
 // MCQ-only shell: Divine Ethics uses the shared destinations (practice, past-exam hub, review topics from the review PDF).
 const page=read('app/page.tsx');assert.match(page,/"term2-divine-ethics": \{ date:/);assert.match(page,/<PastExamHub key=\{exam\} exam=\{exam\}/);assert.match(page,/<ReviewTopics/);
 assert.ok(JSON.parse(readFileSync(new URL('../public/study/reviews/index.json',import.meta.url),'utf8')).courses['term2-divine-ethics']);
 assert.match(read('src/components/CourseReview.tsx'),/\/study\/reviews\/index\.json/);
});
