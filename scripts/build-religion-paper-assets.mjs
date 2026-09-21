import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

// Refresh only Religion's memberships and exports; do not reclassify other
// courses or alter original documents. The source catalogs are shared inputs.
export function buildReligionPaperAssets({root,catalog,finalQuestions,check=false}) {
  const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
  const emit=(p,text)=>check?assert.equal(readFileSync(resolve(root,p),'utf8'),text,`${p} is stale`):writeFileSync(resolve(root,p),text);
  const source=read('data/mcq-refactor/past-source-catalog.json');
  const publicCatalog=read('public/study/past-paper-downloads/catalog.json');
  const course=publicCatalog.courses.find(c=>c.id==='term2-religion');
  for(const paper of catalog.papers) {
    const id=`religion-${paper.id.toLowerCase()}`;
    const records=catalog.archive.filter(r=>r.paperId===paper.id);
    assert(records.every(r=>r.gradedQuestionId&&r.checkedKey),`${id}: incomplete answer audit`);
    const counts={gradedQuestionCount:records.length,editorialKeyCount:records.length,ungradedCount:0,
      inferredKeyCount:records.filter(r=>r.answerReview.basis==='ai-inferred').length,
      gradedQuestionIds:records.map(r=>r.gradedQuestionId)};
    const internal=source.collections.find(c=>c.id===id);
    const published=course.collections.find(c=>c.id===id);
    Object.assign(internal,counts);Object.assign(published,counts);
    const intro=`# ${internal.title}\n\nOriginal questions and choice order. Editorial study answers, not an official university key. Inferred and corrected answers retain confidence, evidence and wording limitations. Repeated items remain in each complete source paper.\n\nCollection ID: ${id}\nCourse: Religion\n\n## Original sources\n\n${internal.sources.map(s=>`- ${s.title}: ${s.publicUrl} — Original document; visible marks are not authoritative.`).join('\n')}\n\n`;
    const questions=`## Questions\n\n${records.map(r=>`### ${r.number} · ${r.id}\n\n${r.prompt}\n\n${Object.entries(r.options).map(([key,text])=>`${key}. ${text}`).join('\n')}\n\nSource: ${r.locator}\n${r.media?`\nOriginal figure: /study/${r.media.path}\n`:''}`).join('\n')}`;
    const keys=`## Answer key and provenance\n\n${records.map(r=>`### ${r.number} · ${r.id}\n\nKey: ${r.checkedKey} — ${r.options[r.checkedKey]}\n\nKey provenance: ${r.answerReview.basis==='ai-inferred'?'AI-inferred editorial answer':'Source-reviewed editorial answer'}; ${r.answerReview.confidence} confidence; audited ${r.answerReview.auditedAt}. Not an official university key.\n\n${r.acceptedOptionIds.length>1?`Note: Accepted choices: ${r.acceptedOptionIds.join(', ')} (overlapping source alternatives).\n\n`:''}Existing answer note: ${r.explanation}\n\nProvenance note: ${r.providedAnswer?`Source sheet/mark: ${r.providedAnswer}; retained separately from reviewed answer. `:''}${r.sameItemAs?`Repeated source item: ${r.sameItemAs}; canonical review ${r.canonicalSourceId}. `:''}Original wording has not been rewritten.\n\nSource: ${r.locator}\n\nEvidence:\n${r.answerReview.evidence.map(ref=>`- ${ref}`).join('\n')}\n`).join('\n')}`;
    const files={questions:intro+questions,answerKey:intro+keys,questionsAndKey:intro+questions+'\n'+keys};
    for(const [kind,text] of Object.entries(files)) {
      const url=internal.downloads[kind];emit('public'+url,text);
      const asset=source.assets.find(a=>a.url===url);assert(asset,`Missing asset ${url}`);
      asset.bytes=Buffer.byteLength(text);asset.sha256=createHash('sha256').update(text).digest('hex');
    }
  }
  course.gradedQuestionCount=course.collections.reduce((n,c)=>n+c.gradedQuestionCount,0);
  emit('data/mcq-refactor/past-source-catalog.json',JSON.stringify(source,null,2)+'\n');
  emit('public/study/past-paper-downloads/catalog.json',JSON.stringify(publicCatalog,null,2)+'\n');
  // Each newly scored source occurrence must also appear in post-exam topic
  // feedback. Reuse its explicit source section; never guess a PDF heading.
  const evidence=read('data/review-curriculum/evidence/question-review-map-v2.json');
  const occurrence=read('data/review-curriculum/evidence/source-occurrence-review-map.json');
  const curriculum=read('data/review-curriculum/courses/term2-religion.json');
  for(const r of catalog.archive) {
    const sectionId=`religion/${r.sectionId}`;
    assert(curriculum.sections.some(s=>s.id===sectionId),`Unknown review section ${sectionId}`);
    const q=finalQuestions.find(q=>q.id===r.gradedQuestionId);assert(q);
    evidence.questions[q.id]={...evidence.questions[q.id],examId:'term2-religion',bankId:'religion-past-papers',kind:q.kind,
      sectionId,uncertain:false,status:'mapped',specificity:'section',method:'explicit-review-section-tag',
      evidence:`religion-section-${r.sectionId}`,sourceQualityFlags:q.qualityFlags};
    curriculum.questions[q.id]={sectionId,uncertain:false,status:'mapped',livePractice:false,bankId:'religion-past-papers'};
    const alias=occurrence.occurrences[`religion/${r.id}`];assert(alias);
    Object.assign(alias,{questionId:q.id,gradingStatus:'scored',ungradedReason:null});
  }
  for(const [file,value] of [
    ['data/review-curriculum/evidence/question-review-map-v2.json',evidence],
    ['data/review-curriculum/evidence/source-occurrence-review-map.json',occurrence],
    ['data/review-curriculum/courses/term2-religion.json',curriculum],
  ])emit(file,JSON.stringify(value,null,2)+'\n');
}
