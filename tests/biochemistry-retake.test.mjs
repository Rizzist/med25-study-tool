import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import {isExamId,isTerm2Exam,examTerm,hasReviewCurriculum} from '../src/lib/mcq/exams.mjs';
import {scopeRetakePaper,retakeBankSelection} from '../src/lib/mcq/retake-paper-scope.mjs';
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
test('Retake appears in Term 2 but preserves its original source identity and guidance modes',()=>{
 assert(isExamId(exam));assert(!isTerm2Exam(exam));assert(hasReviewCurriculum(exam));assert(supportsGuidedExam(exam));
 assert.equal(examTerm(exam),2);assert.equal(examTerm('july29'),1);assert.equal(examTerm('term2-biochemistry'),2);
 assert.match(text('src/components/StudyShell.tsx'),/examTerm\(c.id\)===term/);
 assert.equal(guidanceMode(exam,'guided'),'guided');assert.equal(guidanceMode(exam,'unguided'),'unguided');
 assert.match(text('app/page.tsx'),/reviewEnabled\?<ReviewTopics/);assert.match(text('src/components/CourseReview.tsx'),/hasReviewCurriculum\(exam\)/);
 assert(!text('src/components/ExamModeChooser.tsx').includes('Respiratory · exam mode'));
});
test('Practice reuses all and only existing Cells & Molecules biochemistry questions',()=>{
 assert.equal(practice.length,703);assert.equal(course.sections.length,36);assert.equal(audit.conceptCount,256);
 const old=new Map(read('data/mcq-runtime/july29.json').filter(q=>q.subject==='biochemistry').map(q=>[q.id,q]));
 assert.equal(old.size,practice.length);
 for(const q of practice){assert.equal(q.subject,'biochemistry');assert(q.id.startsWith('retake-practice-'));assert(!old.has(q.id));assert(q.tags.includes('exam-'+exam));assert(!q.tags.some(t=>t.startsWith('exam-term2')));assert(!q.tags.includes('past-paper'));const original=old.get(q.id.slice('retake-practice-'.length));assert(original,q.id);assert.equal(q.prompt,original.prompt);assert.deepEqual(q.options,original.options);assert.equal(q.correctOptionId,original.correctOptionId);}
 const runtime=read(`data/mcq-runtime/${exam}.json`);assert.deepEqual(runtime.map(q=>q.id).sort(),practice.map(q=>q.id).sort());
});
test('All 1017 exported MCQs satisfy the current strict schema',()=>{
 const validate=new Ajv2020({allErrors:true}).compile(read('schemas/mcq-question.schema.json'));
 for(const q of [...practice,...finals]){assert(validate(q),q.id+' '+JSON.stringify(validate.errors));assert(q.options.some(o=>o.id===q.correctOptionId));for(const id of q.acceptedOptionIds??[])assert(q.options.some(o=>o.id===id));}
});
test('Four complete source papers have contiguous numbering; biochemistry excludes other subjects',()=>{
 assert.equal(finals.length,314);assert.equal(papers.collections.length,4);
 const extracts=read('data/biochemistry-retake/full-source-extract.json');
 for(const p of extracts){const exported=finals.filter(q=>q.id.startsWith(`retake-final-${p.id}-q`));assert.deepEqual(exported.map(q=>Number(q.id.match(/q(\d+)$/)[1])).sort((a,b)=>a-b),p.questions.map(r=>r.number));const c=papers.collections.find(c=>c.id===`retake-${p.id}`);assert.equal(c.gradedQuestionCount,p.questions.filter(q=>q.biochemistry).length);assert.equal(c.fullPaper.gradedQuestionCount,p.questions.length);assert(c.fullPaper.independent);for(const id of c.gradedQuestionIds)assert.equal(finals.find(q=>q.id===id).subject,'biochemistry');}
 for(const q of finals){assert(q.tags.includes('past-paper'));assert(!q.source.title.includes('PharmD'));assert(!q.tags.includes('distilled-core'));}
 assert.equal(finals.filter(q=>q.subject==='biochemistry').length,243);
 assert.equal(finals.filter(q=>q.media?.length).length,8);
 for(const q of finals)for(const m of q.media??[])assert(fs.existsSync(new URL('../public/study/'+m.path,import.meta.url)));
});
test('Ambiguous source keys accept valid alternatives; defective source questions are repaired explicitly',()=>{
 const multi=finals.filter(q=>q.acceptedOptionIds?.length>1);assert(multi.length>=8);
 for(const q of multi)for(const id of q.acceptedOptionIds)assert(isFinalAnswerCorrect(q,id),q.id+' '+id);
 for(const id of ['retake-final-biochemistry-2022-q016','retake-final-september-2021-q008']){const q=finals.find(q=>q.id===id);assert(q.options.find(o=>o.id===q.correctOptionId).text.includes('kcat/Km'));assert.match(q.explanation,/repair/i);}
 const xp=finals.find(q=>q.prompt.includes('Xeroderma'));assert.match(xp.options.find(o=>o.id===xp.correctOptionId).text,/Human nucleotide/);assert.match(xp.explanation,/bacterial/);
 const irreversibles=finals.filter(q=>q.prompt.includes('already irreversibly'));assert.equal(irreversibles.length,2);assert(irreversibles.every(q=>q.correctOptionId==='E'));
});
test('Existing paragraph anchors are preserved; expanded scope never invents review references',()=>{
 const bytes=fs.readFileSync(new URL('../public/study/reviews/biochemistry-retake.pdf',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),anchors.pdfSha256);
 assert.equal(course.volumes[0].sha256,anchors.pdfSha256);
 assert.equal(Object.keys(anchors.questions).length,946);
 for(const q of practice)assert(anchors.questions[q.id],"every practice question opens an exact review paragraph: "+q.id);
 for(const q of [...practice,...finals]){const ref=resolveGuidedReference(course,anchors,q.id);if(anchors.questions[q.id]){assert.equal(ref.precision,'paragraph',q.id);assert(ref.quote.length>20);assert(ref.page<=course.volumes[0].pageCount);assert(ref.top>=0&&ref.top<1);}else if(course.questions[q.id].sectionId){assert.equal(ref.precision,'section');}else{assert.equal(ref,null);assert(course.questions[q.id].uncertain);}}
 for(const q of finals.filter(q=>q.subject!=='biochemistry'))assert.equal(resolveGuidedReference(course,anchors,q.id),null);
 assert.equal(resolveGuidedReference(course,{...anchors,pdfSha256:'outdated'},practice[0].id).precision,'section');
});
test('Paper downloads parse into exactly the scored rows and keep provenance and images',()=>{
 for(const p of papers.collections.flatMap(p=>[p,p.fullPaper])){const q=parseExport(text('public'+p.downloads.questions)),both=parseExport(text('public'+p.downloads.questionsAndKey));assert.equal(q.questions.length,p.gradedQuestionCount);assert.equal(both.keys.length,p.gradedQuestionCount);assert.deepEqual(q.questions.map(q=>q.id),p.gradedQuestionIds);assert(q.intro.join(' ').includes('not certified university keys'));for(const r of q.questions)assert(r.fields.Source);}
});
test('Guided paper and combined attempts persist independently and report review sections',async()=>{
 const combined=await combinedSourceSelection(papers.collections,papers.collections.map(p=>p.id));assert.equal(combined.gradedQuestionIds.length,243);
 const saved={id:combined.id,exam,sourcePaperIds:combined.sourcePaperIds};assert.deepEqual(readCombinedSelections(JSON.stringify([saved])),[saved]);
 for(const id of [undefined,papers.collections[0].id,combined.id]){
  const q=finals[0],stamp='2026-09-30T12:00:00Z',key=finalPaperKey(exam,id);
  const session=reconcileFinalExamSession({guidance:'guided',questionIds:[q.id],answers:{[q.id]:{selectedOptionId:q.correctOptionId,correct:true,questionRevision:q.revision,correctOptionId:q.correctOptionId,answeredAt:stamp}},completedAt:stamp},[q],'fixture');
  const parsed=parseFinalExamProgress(JSON.stringify({version:2,sessions:{[key]:session}}));assert.equal(parsed.sessions[key].guidance,'guided');assert.equal(parsed.sessions[key].completedAt,stamp);
  assert.equal(parsed.sessions['july29:telegram-past-papers'],null);
 }
 const bio=finals.filter(q=>q.subject==='biochemistry');
 const outcomes=[{questionId:bio[0].id,answered:true,correct:false},{questionId:bio[1].id,answered:true,correct:true}];
 const rows=reviewBreakdown(outcomes,course);assert(rows.every(r=>r.sectionId?.startsWith('biochemistry-retake/')));
 assert.equal(rows.reduce((n,r)=>n+r.correct,0),1);
});
test('Full and biochemistry scopes keep separate paper, combined and all-bank results',async()=>{
 const bio=papers.collections.map(p=>scopeRetakePaper(p,'biochemistry')),full=papers.collections.map(p=>scopeRetakePaper(p,'full'));
 assert.deepEqual(bio.map(p=>p.id),['retake-cell-block','retake-february-2021','retake-biochemistry-2022','retake-september-2021']);
 for(let i=0;i<4;i++)assert.notEqual(finalPaperKey(exam,bio[i].id),finalPaperKey(exam,full[i].id));
 const combined=await combinedSourceSelection(full,full.map(p=>p.id));assert.equal(combined.gradedQuestionIds.length,314);
 assert.notEqual(combined.id,(await combinedSourceSelection(bio,bio.map(p=>p.id))).id);
 assert.equal(retakeBankSelection(bio).gradedQuestionIds.length,243);assert.equal(retakeBankSelection(full,'full').gradedQuestionIds.length,314);
 assert.notEqual(retakeBankSelection(bio).id,retakeBankSelection(full,'full').id);
 assert.equal(retakeBankSelection(full,'full').independent,true);
 assert.throws(()=>scopeRetakePaper({id:'missing'},'full'),/unavailable/);
});
test('Full-paper results retain non-biochemistry topic breakdown without false PDF links',()=>{
 const nonBio=finals.filter(q=>q.subject!=='biochemistry');
 const rows=reviewBreakdown(nonBio.map(q=>({questionId:q.id,topic:q.topic,answered:true,correct:false})),course);
 assert(rows.length>2);assert(rows.every(r=>!r.sectionId&&r.title.includes('no linked review section')));
 assert.equal(rows.reduce((n,r)=>n+r.total,0),71);
 assert.equal(finals.find(q=>q.id==='retake-final-cell-block-q004').correctOptionId,'B');
 assert.deepEqual(finals.find(q=>q.id==='retake-final-february-2021-q058').acceptedOptionIds,['A','B']);
 assert.equal(finals.find(q=>q.id==='retake-final-february-2021-q079').correctOptionId,'D');
});
