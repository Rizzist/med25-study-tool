import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {guidanceMode,supportsGuidedExam,resolveGuidedReference} from '../src/lib/mcq/guided-exam.mjs';
import {parseFinalExamProgress,reconcileFinalExamSession} from '../src/lib/mcq/final-exam-state.mjs';
import {finalPaperKey,paperAttemptSummary,readCombinedSelections} from '../src/lib/mcq/paper-selection.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const course=JSON.parse(read('public/study/reviews/term2-respiratory.json'));
const anchors=JSON.parse(read('public/study/guided/term2-respiratory.json'));
const bank=JSON.parse(read('data/mcq-runtime/term2-respiratory.json'));

test('Guided rollout supports Respiratory and the retake; legacy attempts remain Unguided',()=>{
  assert.equal(supportsGuidedExam('term1-biochemistry-retake'),true);
  assert.equal(supportsGuidedExam('term2-respiratory'),true);
  assert.equal(guidanceMode('term2-respiratory','guided'),'guided');
  for(const value of [undefined,null,'invalid','unguided'])assert.equal(guidanceMode('term2-respiratory',value),'unguided');
  for(const exam of ['term2-cvs','term2-biochemistry','term2-nutrition','july25'])assert.equal(guidanceMode(exam,'guided'),'unguided');
});
test('All live Respiratory questions resolve to current PDF review locations',()=>{
  assert.ok(bank.length>0);
  for(const question of bank){
    const ref=resolveGuidedReference(course,anchors,question.id);
    assert.ok(ref,question.id);
    assert.ok(ref.page>=1&&ref.page<=course.volumes[0].pageCount,question.id);
    assert.ok(ref.top>=0&&ref.top<1,question.id);
    assert.equal(ref.url,course.volumes[0].url);
  }
  assert.equal(resolveGuidedReference(course,anchors,'future-unmapped-question'),null);
  assert.equal(resolveGuidedReference(null,anchors,'resp-anat-006'),null);
});
test('Paragraph anchors match the actual review file hash and remain explicit',()=>{
  const hash=createHash('sha256').update(readFileSync(new URL('../public/study/reviews/respiratory.pdf',import.meta.url))).digest('hex');
  assert.equal(anchors.pdfSha256,hash);assert.equal(course.volumes[0].sha256,hash);
  assert.ok(Object.keys(anchors.questions).length>0);
  for(const id of Object.keys(anchors.questions)){
    const ref=resolveGuidedReference(course,anchors,id);
    assert.equal(ref.precision,'paragraph');assert.ok(ref.quote.length>20);
  }
  assert.ok(Object.keys(anchors.sections).length>0);
});
test('Missing, stale or invalid paragraph metadata falls back to the current section, not a guessed paragraph',()=>{
  const id='resp-anat-006';
  const expected=resolveGuidedReference(course,null,id);
  for(const changed of [null,{...anchors,pdfSha256:'stale'}, {...anchors,questions:{[id]:{...anchors.questions[id],page:999}}}, {...anchors,questions:{[id]:{...anchors.questions[id],top:2}}}]){
    const ref=resolveGuidedReference(course,changed,id);
    assert.equal(ref.precision,'section');assert.equal(ref.page,expected.page);assert.equal(ref.quote,null);
  }
  const stale={...anchors,pdfSha256:'old',questions:{[id]:{...anchors.questions[id],sectionId:course.sections.at(-1).id}}};
  assert.equal(resolveGuidedReference(course,stale,id).sectionId,expected.sectionId);
  // A newly audited mapping can change while the underlying PDF remains unchanged.
  const remapped={...course,questions:{...course.questions,[id]:{sectionId:course.sections.at(-1).id}}};
  const updated=resolveGuidedReference(remapped,anchors,id);
  assert.equal(updated.sectionId,course.sections.at(-1).id);
  assert.equal(updated.precision,'section');
});
test('Future paper IDs can use explicit, versioned references without a practice-bank identity',()=>{
  const future={...anchors,questions:{'resp-paper-2026-q1':anchors.questions['resp-anat-006']}};
  assert.equal(resolveGuidedReference(course,future,'resp-paper-2026-q1').precision,'paragraph');
});
test('Future Respiratory paper attempts preserve Guided choice, score and collection on reload',()=>{
  const q={id:'resp-paper-1',revision:1,correctOptionId:'A',options:[{id:'A'},{id:'B'}]};
  const date='2026-09-27T10:00:00Z';
  const attempt={guidance:'guided',questionIds:[q.id],answers:{[q.id]:{selectedOptionId:'A',correct:true,questionRevision:1,correctOptionId:'A',answeredAt:date}},completedAt:date};
  const restored=reconcileFinalExamSession(attempt,[q],'hash');
  assert.equal(restored.guidance,'guided');assert.equal(restored.completedAt,date);assert.deepEqual(restored.answers,attempt.answers);
  assert.equal(reconcileFinalExamSession({...attempt,guidance:'bogus'},[q],'hash').guidance,undefined);
  const key='term2-respiratory:respiratory-past-papers:collection:future-2026';
  const parsed=parseFinalExamProgress(JSON.stringify({version:2,sessions:{[key]:restored}}));
  assert.equal(parsed.sessions[key].guidance,'guided');
});
test('PDF renderer is lazy and mode chooser is available from setup and post-test new sprint',()=>{
  const wrapper=read('src/components/GuidedExamLayout.tsx');
  assert.match(wrapper,/dynamic\(/);assert.match(wrapper,/guidanceMode\(exam,mode\)!=='guided'/);
  const page=read('app/page.tsx');
  assert.match(page,/<main className="review-shell">\s*\{pendingGuidance&&<ExamModeChooser/);
  assert.ok((page.match(/<ExamModeChooser/g)||[]).length>=2);
  assert.match(page,/setGuidance\(guidanceMode\(saved.exam,saved.guidance\)\)/);
});
test('Guided mobile shells shrink to the viewport and put the PDF below questions in portrait',()=>{
  const css=read('app/guided-exam.css').replace(/\s+/g,'');
  // Both levels need a zero minimum: an auto-min grid track previously stretched
  // a 390px final-exam viewport to 588px despite the portrait flex layout.
  assert(css.includes('.session-shell.is-guided,.final-exam-shell.is-guided{grid-template-columns:minmax(0,1fr)}'));
  assert(css.includes('.guided-exam-layout{min-width:0;max-width:100%}'));
  const portrait=css.split('@media(max-width:700px)and(orientation:portrait){')[1]?.split('@media')[0];
  assert(portrait);assert(portrait.includes('.guided-exam-layout{display:flex;flex-direction:column;'));
  assert(portrait.includes('.guided-review-pane{border-left:0;border-top:'));
  const landscape=css.split('@media(min-width:701px),(orientation:landscape){')[1]?.split('@media')[0];
  assert(landscape);assert(landscape.includes('grid-template-columns:minmax(0,1fr)minmax(280px,46%)'));
  assert.match(read('src/components/GuidedExamLayout.tsx'),/guided-question-pane[^]*\{children\}[^]*<GuidedReviewPane/);
});
test('Respiratory paper cards find saved unfinished and completed attempts under the runtime bank key',()=>{
  const exam='term2-respiratory',collection={id:'respiratory-07',gradedQuestionIds:['q1','q2']};
  const key='term2-respiratory:respiratory-past-papers:collection:respiratory-07';
  assert.equal(finalPaperKey(exam,collection.id),key);
  assert.equal(finalPaperKey(exam),'term2-respiratory:respiratory-past-papers');
  const attempt={questionIds:['q1','q2'],answers:{q1:{selectedOptionId:'A',correct:true}},completedAt:null};
  assert.deepEqual(paperAttemptSummary({sessions:{[key]:attempt}},exam,collection),{answered:1,correct:1,total:2,completedAt:null});
  const complete={...attempt,answers:{...attempt.answers,q2:{selectedOptionId:'B',correct:false}},completedAt:'2026-09-27T10:00:00Z'};
  assert.deepEqual(paperAttemptSummary({sessions:{[key]:complete}},exam,collection),{answered:2,correct:1,total:2,completedAt:complete.completedAt});
});
test('Respiratory combined selections survive reload without weakening stored-selection validation',()=>{
  const saved={id:'combined-'+'a'.repeat(64),exam:'term2-respiratory',sourcePaperIds:['respiratory-07','respiratory-15','respiratory-07']};
  const invalid=[{...saved,exam:'unsupported'},{...saved,id:'combined-invalid'},{...saved,sourcePaperIds:['../outside']}];
  assert.deepEqual(readCombinedSelections(JSON.stringify([saved,...invalid])),[{...saved,sourcePaperIds:['respiratory-07','respiratory-15']}]);
});
test('Biochemistry Core uses the shared exam card in the paper grid',()=>{
  const card=read('src/components/BiochemistryCoreCard.tsx'),hub=read('src/components/PastExamHub.tsx');
  assert.match(card,/return <PastPaperCard/);
  assert.match(hub,/<div className="paper-grid">\s*\{exam==='term2-biochemistry'/);
  assert.match(card,/core-section-details/);
});

test('Mode choice stays on the paper picker and precedes attempt creation',()=>{
  const hub=read('src/components/PastExamHub.tsx'),exam=read('src/components/FinalExam.tsx');
  assert.match(hub,/setPendingStart\(\{id,intent:nextIntent\}\);return;/);
  assert.match(hub,/pendingStart&&<ExamModeChooser/);
  assert.match(hub,/initialGuidance=\{launchGuidance\}/);
  assert.match(hub,/requestOpen\(item.id/);
  assert.match(hub,/requestOpen\(selection.id/);
  assert.match(exam,/!needsChoice&&\(migrationSeed\|\|initialIntent!=='review'\)/);
  assert.match(exam,/setProgress\(needsChoice\?stored:/);
  assert.match(exam,/if\(supportsGuidedExam\(exam\)\)\{setRestartPending\(true\);setChooseGuidance\(true\);return;\}/);
  const css=read('app/guided-exam.css').replace(/\s+/g,'');
  assert(css.includes('.exam-mode-dialog{position:fixed;inset:0;margin:auto;'));
});

test('Review controls stay in one constant row; settings and passage details overlay PDF content',()=>{
  const css=read('app/guided-exam.css').replace(/\s+/g,''),pane=read('src/components/GuidedReviewPane.tsx');
  assert(css.includes('.guided-review-header{box-sizing:border-box;height:44px;flex:0044px;display:flex;'));
  assert(css.includes('.guided-reference-popover{position:absolute;top:44px;'));
  assert(css.includes('.guided-reader-settings.guided-settings-popover{position:absolute;top:44px;'));
  assert.match(pane,/aria-label="PDF reader settings"/);
  assert.match(pane,/aria-expanded=\{detailsOpen\}/);
  assert.match(pane,/detailsFor===questionId/);
  assert.doesNotMatch(pane,/className="guided-reference-status"|className="guided-cache-status"/);
  assert.match(pane,/className="guided-pdf-scroll"[^]*className="guided-load-status"/);
});
