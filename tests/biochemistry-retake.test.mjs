import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import {isExamId,isTerm2Exam,hasReviewCurriculum} from '../src/lib/mcq/exams.mjs';
import {supportsGuidedExam,guidanceMode,resolveGuidedReference} from '../src/lib/mcq/guided-exam.mjs';
import {parseFinalExamProgress,reconcileFinalExamSession} from '../src/lib/mcq/final-exam-state.mjs';
import {isFinalAnswerCorrect} from '../src/lib/mcq/final-exam-state.mjs';
import {combinedSourceSelection,finalPaperKey,paperAttemptSummary,readCombinedSelections} from '../src/lib/mcq/paper-selection.mjs';
import {parseExport} from '../src/lib/paper-pdf/parse-export.mjs';
import {reviewBreakdown} from '../src/lib/mcq/review-results.mjs';
const exam='term1-biochemistry-retake',bank='biochemistry-retake-past-papers';
const text=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(text(p));
const jsonl=p=>text(p).trim().split('\n').map(JSON.parse);
const practice=jsonl('data/bank/questions/biochemistry-retake.jsonl'),finals=jsonl(`data/final-exams/${bank}.jsonl`);
const course=read(`public/study/reviews/${exam}.json`),anchors=read(`public/study/guided/${exam}.json`);
const audit=read('data/biochemistry-retake/audit.json');
const papers=read('public/study/past-paper-downloads/catalog.json').courses.find(c=>c.id===exam);
test('Retake is separate Term 1 with its own review and both guidance modes',()=>{
 assert(isExamId(exam));assert(!isTerm2Exam(exam));assert(hasReviewCurriculum(exam));assert(supportsGuidedExam(exam));
 assert.equal(guidanceMode(exam,'guided'),'guided');assert.equal(guidanceMode(exam,'unguided'),'unguided');
 assert.match(text('app/page.tsx'),/reviewEnabled\?<ReviewTopics/);assert.match(text('src/components/CourseReview.tsx'),/hasReviewCurriculum\(exam\)/);
 assert(!text('src/components/ExamModeChooser.tsx').includes('Respiratory · exam mode'));
});
test('Practice is confirmed biochemistry, with isolated IDs and no unauthorised chapters',()=>{
 assert.equal(practice.length,478);assert.equal(course.sections.length,26);assert.equal(audit.conceptCount,171);
 const old=new Set(read('data/mcq-runtime/july29.json').map(q=>q.id));
 for(const q of practice){assert.equal(q.subject,'biochemistry');assert(q.id.startsWith('retake-practice-'));assert(!old.has(q.id));assert(q.tags.includes('exam-'+exam));assert(!q.tags.some(t=>t.startsWith('exam-term2')));const section=course.questions[q.id].sectionId.split('/')[1];assert(audit.scope.includes(section));assert(!/^ch-(8|9|10|11|12|13|19|20|21|22)$/.test(section));}
 const runtime=read(`data/mcq-runtime/${exam}.json`);assert.deepEqual(runtime.map(q=>q.id).sort(),practice.map(q=>q.id).sort());
});
test('All 720 exported MCQs satisfy the current strict schema',()=>{
 const validate=new Ajv2020({allErrors:true}).compile(read('schemas/mcq-question.schema.json'));
 for(const q of [...practice,...finals]){assert(validate(q),q.id+' '+JSON.stringify(validate.errors));assert(q.options.some(o=>o.id===q.correctOptionId));for(const id of q.acceptedOptionIds??[])assert(q.options.some(o=>o.id===id));}
});
test('Four source selections account for every biochemistry source number, not other subjects',()=>{
 assert.equal(finals.length,242);assert.equal(papers.collections.length,4);
 const extracts=read('data/biochemistry-retake/source-extract.json');
 for(const p of extracts){assert.equal(p.questions.length,p.last-p.first+1);const exported=finals.filter(q=>q.id.startsWith(`retake-final-${p.id}-q`));assert.deepEqual(exported.map(q=>Number(q.id.match(/q(\d+)$/)[1])).sort((a,b)=>a-b),Array.from({length:p.last-p.first+1},(_,i)=>p.first+i));}
 for(const q of finals){assert.equal(q.subject,'biochemistry');assert(q.tags.includes('past-paper'));assert(!q.source.title.includes('PharmD'));assert(!q.tags.includes('distilled-core'));}
 assert.equal(finals.filter(q=>q.media?.length).length,3);
});
test('Ambiguous source keys accept valid alternatives; defective source questions are repaired explicitly',()=>{
 const multi=finals.filter(q=>q.acceptedOptionIds?.length>1);assert(multi.length>=8);
 for(const q of multi)for(const id of q.acceptedOptionIds)assert(isFinalAnswerCorrect(q,id),q.id+' '+id);
 for(const id of ['retake-final-biochemistry-2022-q016','retake-final-september-2021-q008']){const q=finals.find(q=>q.id===id);assert(q.options.find(o=>o.id===q.correctOptionId).text.includes('kcat/Km'));assert.match(q.explanation,/repair/i);}
 const xp=finals.find(q=>q.prompt.includes('Xeroderma'));assert.match(xp.options.find(o=>o.id===xp.correctOptionId).text,/Human nucleotide/);assert.match(xp.explanation,/bacterial/);
 const irreversibles=finals.filter(q=>q.prompt.includes('already irreversibly'));assert.equal(irreversibles.length,2);assert(irreversibles.every(q=>q.correctOptionId==='E'));
});
test('Every MCQ resolves to its exact current review paragraph, with safe stale-version fallback',()=>{
 const bytes=fs.readFileSync(new URL('../public/study/reviews/biochemistry-retake.pdf',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),anchors.pdfSha256);
 assert.equal(course.volumes[0].sha256,anchors.pdfSha256);
 for(const q of [...practice,...finals]){const ref=resolveGuidedReference(course,anchors,q.id);assert.equal(ref.precision,'paragraph',q.id);assert(ref.quote.length>20);assert(ref.page<=course.volumes[0].pageCount);assert(ref.top>=0&&ref.top<1);}
 assert.equal(resolveGuidedReference(course,{...anchors,pdfSha256:'outdated'},practice[0].id).precision,'section');
});
test('Paper downloads parse into exactly the scored rows and keep provenance and images',()=>{
 for(const p of papers.collections){const q=parseExport(text('public'+p.downloads.questions)),both=parseExport(text('public'+p.downloads.questionsAndKey));assert.equal(q.questions.length,p.gradedQuestionCount);assert.equal(both.keys.length,p.gradedQuestionCount);assert.deepEqual(q.questions.map(q=>q.id),p.gradedQuestionIds);assert(q.intro.join(' ').includes('not certified university keys'));for(const r of q.questions)assert(r.fields.Source);}
});
test('Guided paper and combined attempts persist independently and report review sections',async()=>{
 const combined=await combinedSourceSelection(papers.collections,papers.collections.map(p=>p.id));assert.equal(combined.gradedQuestionIds.length,242);
 const saved={id:combined.id,exam,sourcePaperIds:combined.sourcePaperIds};assert.deepEqual(readCombinedSelections(JSON.stringify([saved])),[saved]);
 for(const id of [undefined,papers.collections[0].id,combined.id]){
  const q=finals[0],stamp='2026-09-30T12:00:00Z',key=finalPaperKey(exam,id);
  const session=reconcileFinalExamSession({guidance:'guided',questionIds:[q.id],answers:{[q.id]:{selectedOptionId:q.correctOptionId,correct:true,questionRevision:q.revision,correctOptionId:q.correctOptionId,answeredAt:stamp}},completedAt:stamp},[q],'fixture');
  const parsed=parseFinalExamProgress(JSON.stringify({version:2,sessions:{[key]:session}}));assert.equal(parsed.sessions[key].guidance,'guided');assert.equal(parsed.sessions[key].completedAt,stamp);
  assert.equal(parsed.sessions['july29:telegram-past-papers'],null);
 }
 const outcomes=[{questionId:finals[0].id,answered:true,correct:false},{questionId:finals[1].id,answered:true,correct:true}];
 const rows=reviewBreakdown(outcomes,course);assert(rows.every(r=>r.sectionId?.startsWith('biochemistry-retake/')));
 assert.equal(rows.reduce((n,r)=>n+r.correct,0),1);
});
