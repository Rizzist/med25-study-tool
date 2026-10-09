// Publish imported source occurrences through the same catalog, bank and PDF exports as existing papers.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,value)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');};
const sha=value=>createHash('sha256').update(value).digest('hex');
const batch='term1-2026-10-09';
const sources=read('data/term1-telegram/catalog.json');
const canonical=read('data/mcq-refactor/past-source-catalog.json');
const download=read('public/study/past-paper-downloads/catalog.json');
const sourceById=new Map(sources.papers.map(p=>[p.id,p]));
const banks={};
const imported=[];
const outputs=[];
const allQuestions=new Map();
const complete=!process.argv.includes('--allow-incomplete');
const collectionSources=id=>id==='tissue-jan2023'?[sourceById.get(id),sourceById.get('tissue-2023-annotated')]:[sourceById.get(id)];
for(const paper of sources.papers){
  // Alternate annotated scan of the same 80-item sitting: one session, both original downloads.
  if(paper.id==='tissue-2023-annotated')continue;
  const filename=`data/term1-telegram/questions/${paper.id}.json`;
  if(!fs.existsSync(path.join(root,filename))){assert(!complete,`Missing extraction: ${paper.id}`);continue;}
  const data=read(filename);assert.equal(data.paperId,paper.id);assert(data.questions.length,`${paper.id}: empty paper`);
  const notes=Array.isArray(data.notes)?data.notes.join(' '):data.notes??'';
  const rows=data.questions.map((q,index)=>{
    const id=`term1-${paper.id}-${String(q.sourceOrdinal??index+1).padStart(3,'0')}`;
    assert(!allQuestions.has(id),`Duplicate ${id}`);
    assert(q.prompt?.trim(),`${id}: missing prompt`);
    const options=q.options??[];
    assert(new Set(options.map(o=>o.id)).size===options.length,`${id}: duplicate options`);
    assert(options.every(o=>o.text?.trim()&&/^[A-F]$/.test(o.id)),`${id}: invalid option`);
    const key=q.correctOptionId??'';
    assert(!key||options.some(o=>o.id===key),`${id}: missing keyed option`);
    assert(!key||q.answerBasis!=='unresolved',`${id}: unresolved key cannot score`);
    const media=(q.media??[]).map((m,i)=>{
      const mediaPath=(m.src??m.path).replace(/^\/study\//,'');
      assert(!mediaPath.includes('..')&&fs.existsSync(path.join(root,'public/study',mediaPath)),`${id}: missing media ${mediaPath}`);
      return {id:`source-figure-${i+1}`,type:'image',path:mediaPath,alt:m.alt??`Figure for original question ${q.number}`};
    });
    const question={schemaVersion:'1.0.0',id,revision:q.revision??1,status:'verified',kind:media.length?'image_single_best_answer':'single_best_answer',subject:q.subject??(paper.course==='tissue'?'histology':'biochemistry'),topic:q.topic??(paper.kind==='practical'?'Practical '+(paper.course==='tissue'?'histology':'biochemistry'):paper.course==='tissue'?'Tissue development':'Cell & molecules'),chapter:paper.title,difficulty:2,prompt:q.prompt,options,correctOptionId:key,...(q.acceptedOptionIds?.length?{acceptedOptionIds:q.acceptedOptionIds}:{}),explanation:q.explanation||'No reliable answer key is available for this source item.',distractorExplanations:{},learningObjective:'Review the original past-paper question and its answer evidence.',source:{title:paper.title,chapter:paper.kind,page:String(q.page??''),excerpt:`Original ${q.section?q.section+' ':''}question ${q.number}; source occurrence ${q.sourceOrdinal??index+1}. ${paper.url}${q.page?'#page='+q.page:''}`},answerReview:{basis:!key?'unresolved':q.answerBasis==='source-reviewed'?'source-reviewed':'ai-inferred',confidence:!key?'low':'medium',canonicalSourceId:paper.id,auditedAt:'2026-10-09',evidence:[...(q.answerEvidence??[]),...(q.answerReferences??[]).map(r=>typeof r==='string'?r:JSON.stringify(r)),...(q.sourceAnswer?[`Source answer: ${typeof q.sourceAnswer==='string'?q.sourceAnswer:JSON.stringify(q.sourceAnswer)}`]:[]),key?(q.answerBasis==='source-reviewed'?'Key transcribed from source answer markings; not an independent university-key certification.':'Editorial study answer; not an official university key.'):'No reliable scored key. Response is saved without affecting the score.']},...(media.length?{media}:{}),tags:['past-paper','telegram-final','term1-import',paper.id],examPriority:'standard',qualityFlags:['source-occurrence-preserved',...(!key?['ungraded-source-question']:[])]};
    allQuestions.set(id,question);
    return {question,number:(q.section?q.section+' ':'')+String(q.number??index+1),page:q.page};
  });
  for(const courseId of paper.course==='tissue'?['july25']:['july29','term1-biochemistry-retake']){
    const bankId=courseId==='term1-biochemistry-retake'?'biochemistry-retake-past-papers':'telegram-past-papers';
    const bankKey=`${courseId}:${bankId}`;
    banks[bankKey]??=[];banks[bankKey].push(...rows.map(r=>r.question));
    const makeCollection=(id,selection,title)=>{
      const originals=collectionSources(paper.id).filter(Boolean).map(p=>({name:p.title,url:p.url}));
      const urls={questions:`/study/past-paper-downloads/${id}/questions.md`,answerKey:`/study/past-paper-downloads/${id}/answer-key.md`,questionsAndKey:`/study/past-paper-downloads/${id}/questions-and-key.md`};
      const graded=selection.filter(r=>r.question.correctOptionId);
      const item={id,courseId,bankId,bankKey,importBatch:batch,title,note:[paper.note,notes].filter(Boolean).join(' '),kind:paper.kind,date:paper.date,dateEvidence:paper.date?'source cover':'unconfirmed',courseMatch:paper.scope==='course'?'source-course':'supplement',defaultEligible:paper.scope==='course',originalOrderClaim:true,independent:true,sourcePaperIds:collectionSources(paper.id).filter(Boolean).map(p=>p.id),sources:collectionSources(paper.id).filter(Boolean).map(p=>({name:p.title,publicUrl:p.url,proposedPublicUrl:p.url,bytes:p.bytes,sha256:p.sha256})),sourceRecordCount:selection.length,transcribedQuestionCount:selection.length,gradedQuestionCount:graded.length,ungradedCount:selection.length-graded.length,sourceKeyCount:graded.filter(r=>r.question.answerReview.basis==='source-reviewed').length,editorialKeyCount:graded.filter(r=>r.question.answerReview.basis==='ai-inferred').length,questionIds:selection.map(r=>r.question.id),takeableQuestionIds:selection.map(r=>r.question.id),gradedQuestionIds:graded.map(r=>r.question.id),downloads:urls,originals};
      const intro=`# ${title}\n\n${item.note}\n\n${selection.length} retained source records; ${graded.length} scored and ${item.ungradedCount} ungraded. Original numbering is retained, including repeated numbers.\n\nCollection ID: ${id}\nCourse: ${courseId}\n\n## Original sources\n\n${originals.map(o=>`- ${o.name}: ${o.url}`).join('\n')}\n\n`;
      const questions='## Questions\n\n'+selection.map(({question:q,number,page})=>`### ${number} · ${q.id}\n\n${q.prompt}\n\n${q.options.map(o=>`${o.id}. ${o.text}`).join('\n')}\n\n${q.media?.length?'Image: '+q.media.map(m=>'/study/'+m.path+'?v='+sha(fs.readFileSync(path.join(root,'public/study',m.path))).slice(0,16)).join(' | ')+'\n\n':''}Source: ${paper.title} · PDF page ${page??'unconfirmed'}\n`).join('\n');
      const keys='## Answer key and provenance\n\nSource markings and editorial study answers are distinguished below. Ungraded items do not affect scores.\n\n'+selection.map(({question:q,number,page})=>`### ${number} · ${q.id}\n\nKey: ${q.correctOptionId?`${q.correctOptionId} — ${q.options.find(o=>o.id===q.correctOptionId).text}`:'Not graded — no reliable scored key'}\n\n${q.explanation}\n\nKey provenance: ${q.answerReview.basis==='source-reviewed'?'Source marking':q.answerReview.basis==='ai-inferred'?'Editorial study answer':'Unresolved / written response'}${q.acceptedOptionIds?.length?'; accepted choices: '+q.acceptedOptionIds.join(', '):''}\n\nProvenance note: ${q.answerReview.evidence.join(' | ')}\n\nQuestion source: ${paper.title} · page ${page??'unconfirmed'}\n`).join('\n');
      for(const [key,rawBody] of Object.entries({questions:intro+questions,answerKey:intro+keys,questionsAndKey:intro+questions+'\n'+keys})){const body=rawBody.replace(/[ \t]+$/gm,'');write('public'+urls[key],body);outputs.push({importBatch:batch,collectionId:id,url:urls[key],bytes:Buffer.byteLength(body),sha256:sha(body)});}
      imported.push(item);return item;
    };
    const prefix=courseId==='term1-biochemistry-retake'?'retake-import-':'';
    let main;
    if(courseId==='term1-biochemistry-retake'){
      const bio=rows.filter(r=>r.question.subject==='biochemistry');
      // Mixed-source papers retain the established Biochemistry-only / Full-paper controls.
      main=makeCollection(prefix+paper.id,bio.length?bio:rows,paper.title+(bio.length&&bio.length<rows.length?' · Biochemistry only':''));
      main.fullPaper=makeCollection(prefix+paper.id+'--full',rows,paper.title+' · Full paper');
    }else main=makeCollection(paper.id,rows,paper.title);
    const course=download.courses.find(c=>c.id===courseId);assert(course,courseId);
    course.collections=course.collections.filter(c=>c.importBatch!==batch||c.id!==main.id);
    course.collections.push(main);
  }
}
// Keep old IDs, question revisions and saved-attempt identities intact.
canonical.collections=canonical.collections.filter(c=>c.importBatch!==batch).concat(imported);
canonical.assets=canonical.assets.filter(a=>a.importBatch!==batch).concat(outputs);
for(const course of download.courses)course.collections=course.collections.filter(c=>c.importBatch!==batch||imported.some(x=>x.id===c.id));
write('data/term1-telegram/banks.json',banks);
write('data/mcq-refactor/past-source-catalog.json',canonical);
write('public/study/past-paper-downloads/catalog.json',download);
// Review reports must recognize every new retake source ID. A new transcription
// does not establish a bookmark in the separately reviewed textbook PDF.
const reviewPath='data/review-curriculum/courses/term1-biochemistry-retake.json';
const evidencePath='data/review-curriculum/evidence/question-review-map-v2.json';
const review=read(reviewPath),evidence=read(evidencePath);
const importedIds=new Set([...allQuestions.keys()]);
for(const [id,value] of Object.entries(evidence.questions))if(value.examId==='term1-biochemistry-retake'&&value.method==='reviewed-source-occurrence'&&!importedIds.has(id)){delete review.questions[id];delete evidence.questions[id];}
for(const q of banks['term1-biochemistry-retake:biochemistry-retake-past-papers']??[]){
  const mapping={sectionId:null,uncertain:true,status:'needs-crosswalk',livePractice:false,bankId:'biochemistry-retake-past-papers'};
  review.questions[q.id]=mapping;
  evidence.questions[q.id]={examId:'term1-biochemistry-retake',...mapping,kind:q.kind,specificity:'unmapped',method:'reviewed-source-occurrence',evidence:'Original source question retained. No independently verified section or paragraph in the version-locked retake review has been assigned.'};
}
write(reviewPath,review);write(evidencePath,evidence);
console.log(`Term 1 papers: ${new Set(imported.flatMap(c=>c.sourcePaperIds)).size}/${sources.papers.length} originals mapped; ${allQuestions.size} source occurrences; ${[...allQuestions.values()].filter(q=>q.correctOptionId).length} keyed.`);
