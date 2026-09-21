import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import {religionPractice} from '../scripts/content/religion-practice.mjs';
import {religionPastReview} from '../scripts/content/religion-past-papers.mjs';
import {isExamId,matchesTerm2Exam,examIds} from '../src/lib/mcq/exams.mjs';
import {createEmptyProgress,parseProgress} from '../src/lib/mcq/study-progress.mjs';
import {emptyFinalExamProgress,parseFinalExamProgress,reconcileFinalExamSession,isFinalAnswerCorrect} from '../src/lib/mcq/final-exam-state.mjs';
import {parseExport,keyOf} from '../src/lib/paper-pdf/parse-export.mjs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const json=p=>JSON.parse(read(p)),jsonl=p=>read(p).trim().split('\n').map(JSON.parse);
const sources=json('data/religion/sources.json'),catalog=json('data/religion/catalog.json');
const practice=jsonl('data/bank/questions/term2-religion.jsonl'),final=jsonl('data/final-exams/religion-past-papers.jsonl');
const validate=new Ajv2020({allErrors:true}).compile(json('schemas/mcq-question.schema.json'));
test('religion: valid schema, keys, explanations and isolated subject',()=>{
 for(const q of [...practice,...final]){assert(validate(q),`${q.id}: ${JSON.stringify(validate.errors)}`);assert.equal(q.subject,'religion');assert(q.options.some(o=>o.id===q.correctOptionId));assert(q.source.page&&q.source.excerpt);assert(q.explanation.length>40);for(const o of q.options.filter(o=>o.id!==q.correctOptionId))assert(q.distractorExplanations[o.id]?.length>20);for(const exam of examIds)assert.equal(matchesTerm2Exam(q,exam),exam==='term2-religion');}
});
test('religion: practice maps to every review module and rotates option rationales with keys',()=>{
 assert.equal(catalog.modules.length,25);assert.equal(practice.length,75);assert.equal(practice.length,religionPractice.length);
 assert(catalog.modules.every(m=>m.questionIds.length>=3));assert.equal(new Set(catalog.modules.flatMap(m=>m.questionIds)).size,practice.length);
 for(const row of religionPractice){const q=practice.find(q=>q.id===`religion-practice-${row.id}`);assert.equal(q.options.find(o=>o.id===q.correctOptionId).text,row.answer);for(const [text,why]of row.distractors){const option=q.options.find(o=>o.text===text);assert.equal(q.distractorExplanations[option.id],why);}}
 const keys=[...'ABCD'].map(k=>practice.filter(q=>q.correctOptionId===k).length);assert(Math.max(...keys)-Math.min(...keys)<=1);assert(practice.filter(q=>q.difficulty>=4).length>=30);
 for(const q of practice){assert(!q.tags.some(t=>/past-paper|final-bank|telegram-final/.test(t)));assert(!sources.records.some(r=>r.prompt===q.prompt));}
});
test('religion: all 180 original occurrences have wording, choices, provenance and answer notes',()=>{
 assert.equal(catalog.archive.length,180);assert.equal(new Set(catalog.archive.map(r=>r.id)).size,180);
 for(const [prefix,count]of [['O',40],['D',100],['A',20],['F',20]])for(let i=1;i<=count;i++)assert(catalog.archive.some(r=>r.id===`${prefix}${i}`));
 for(const r of sources.records){const a=catalog.archive.find(a=>a.id===r.id);assert.equal(a.prompt,r.prompt);assert.deepEqual(a.options,r.options);assert.equal(Object.keys(a.options).length,4);assert(a.explanation.length>40);assert(a.page>=1);assert(a.page<=catalog.papers.find(p=>p.id===a.paperId).pages);assert(a.references.length);if(!a.gradedQuestionId)assert(a.ungradedReason);}
 assert.equal(catalog.counts.scoredPastPaper,180);assert.equal(catalog.counts.ungraded,0);assert.equal(catalog.counts.duplicateSource,26);
 for(const paper of catalog.papers){const bytes=readFileSync(new URL(`../public${paper.file}`,import.meta.url));assert.equal(bytes.subarray(0,4).toString(),'%PDF');assert.equal(createHash('sha256').update(bytes).digest('hex'),paper.sha256);assert.equal(paper.officialKey,false);}
});
test('religion: every full paper preserves original option order and inherits canonical duplicate reviews',()=>{
 for(const q of final){const id=q.id.replace('religion-past-','').toUpperCase(),r=sources.records.find(r=>r.id===id);assert(r);assert.equal(q.prompt,r.prompt);assert.deepEqual(q.options.map(o=>o.text),Object.values(r.options));assert.equal(q.correctOptionId,religionPastReview[q.answerReview.canonicalSourceId].key);assert(q.tags.includes('final-bank-religion-past-papers'));assert(!q.tags.includes('religion-practice'));assert(q.qualityFlags.includes('answer-key-audited'));assert(q.answerReview.evidence.length);}
 assert(catalog.archive.filter(r=>r.sameItemAs).every(r=>r.gradedQuestionId));assert.equal(final.filter(q=>q.id.startsWith('religion-past-f')).length,20);
 for(const r of sources.records.filter(r=>r.sameItemAs)){const q=final.find(q=>q.id===`religion-past-${r.id.toLowerCase()}`),canonical=sources.records.find(r=>r.id===q.answerReview.canonicalSourceId);for(const k of ['A','B','C','D'])assert.equal(r.options[k].toLowerCase().replace(/[^a-z0-9]/g,''),canonical.options[k].toLowerCase().replace(/[^a-z0-9]/g,''),r.id+' '+k);}
});
test('religion: corrections, inferred answers and low-confidence choices remain distinguished',()=>{
 for(const [id,key]of [['D11','A'],['D60','A'],['A11','B']]){const q=final.find(q=>q.id===`religion-past-${id.toLowerCase()}`);assert.equal(q.correctOptionId,key);assert(q.qualityFlags.includes('corrected-source-key'));}
 for(const [id,key] of [['O17','B'],['O27','C'],['D66','A'],['D78','D'],['A6','C'],['D95','A'],['D96','B'],['A20','B']]){const q=final.find(q=>q.id===`religion-past-${id.toLowerCase()}`);assert.equal(q.correctOptionId,key,id);assert.equal(q.answerReview.basis,'ai-inferred');assert(q.qualityFlags.includes('ai-inferred-answer'));}
 for(const id of ['O29','D19','D64','A14'])assert(final.find(q=>q.id===`religion-past-${id.toLowerCase()}`).qualityFlags.includes('provisional-answer'));
 assert.equal(final.find(q=>q.id==='religion-past-o1').answerReview.basis,'source-reviewed');
 assert.match(catalog.archive.find(r=>r.id==='A20').explanation,/psychological/);assert.match(catalog.archive.find(r=>r.id==='D76').explanation,/not a blanket/);
 const verse=final.find(q=>q.id==='religion-past-d100');assert.equal(verse.kind,'image_single_best_answer');assert.equal(verse.media.length,1);assert(readFileSync(new URL(`../public/study/${verse.media[0].path}`,import.meta.url)).length>1000);
});
test('religion: equivalent alternatives grade consistently live and when restoring saved attempts',()=>{
 for(const id of ['d20','d24','d54','d98']){const q=final.find(q=>q.id===`religion-past-${id}`);assert(q.acceptedOptionIds.length>1);for(const option of q.options){const expected=q.acceptedOptionIds.includes(option.id);assert.equal(isFinalAnswerCorrect(q,option.id),expected);const prior={questionIds:[q.id],answers:{[q.id]:{selectedOptionId:option.id,correct:false,questionRevision:q.revision,correctOptionId:q.correctOptionId}}};assert.equal(reconcileFinalExamSession(prior,[q],'new').answers[q.id].correct,expected);}assert(!isFinalAnswerCorrect(q,'X'));}
 const old=final.find(q=>q.id==='religion-past-o1');const session=reconcileFinalExamSession({questionIds:[old.id],answers:{[old.id]:{selectedOptionId:old.correctOptionId,correct:true,questionRevision:1,correctOptionId:old.correctOptionId}}},final,'new');assert(session.answers[old.id].correct);assert.equal(session.questionIds.length,180);
});
test('religion: runtime memberships and all three downloadable exports contain every paper item',()=>{
 const publicCatalog=json('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id==='term2-religion');assert.equal(publicCatalog.gradedQuestionCount,180);
 for(const c of publicCatalog.collections){const expected=catalog.archive.filter(r=>`religion-${r.paperId.toLowerCase()}`===c.id);assert.equal(c.gradedQuestionCount,expected.length);assert.equal(c.ungradedCount,0);assert.deepEqual(c.gradedQuestionIds,expected.map(r=>r.gradedQuestionId));for(const [kind,url]of Object.entries(c.downloads)){const parsed=parseExport(read('public'+url));if(kind!=='answerKey')assert.equal(parsed.questions.length,expected.length);if(kind!=='questions'){assert.equal(parsed.keys.length,expected.length);for(const r of expected){const k=parsed.keys.find(k=>k.id===r.id);assert.equal(keyOf(k).letter,r.checkedKey);assert(k.fields['Key provenance'].includes(r.answerReview.confidence));}}}}
});
test('religion: progress round-trips without replacing nutrition or old finals',()=>{
 assert(isExamId('term2-religion'));const p=createEmptyProgress();p.exams['term2-religion'].wrongIds=[practice[0].id];assert.deepEqual(parseProgress(JSON.stringify(p)),p);assert.deepEqual(p.exams['term2-nutrition'].wrongIds,[]);
 const progress=emptyFinalExamProgress();progress.sessions['term2-nutrition:nutrition-past-papers']={sentinel:'preserved'};const key='term2-religion:religion-past-papers';progress.sessions[key]=reconcileFinalExamSession(null,final,'religion-fixture');assert.deepEqual(parseFinalExamProgress(JSON.stringify(progress)),progress);
});
test('religion: embedded banks and UI entrypoints preserve practice/final separation',()=>{
 const embedded=json('data/bank/embedded-bank.json');assert.deepEqual(embedded.questions.filter(q=>q.tags.includes('exam-term2-religion')),practice);assert.deepEqual(embedded.finalExams['term2-religion:religion-past-papers'],final);
 const page=read('app/page.tsx');assert.match(page,/<PastExamHub key=\{exam\} exam=\{exam\}/);const hub=read('src/components/PastExamHub.tsx');assert.match(hub,/exam==='term2-religion'/);assert.match(hub,/<ReligionArchive/);
 const ui=read('src/components/ReligionExam.tsx');assert.match(ui,/med25-religion-source-review-v1/);assert.match(ui,/Reveal answer \/ correction notes/);assert.match(ui,/Object.entries\(selected.options\)/);assert.match(ui,/aria-pressed/);assert.match(read('src/components/ReligionExam.module.css'),/@media\(max-width:760px\)/);
});
