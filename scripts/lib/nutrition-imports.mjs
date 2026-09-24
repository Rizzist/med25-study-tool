import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const exam='term2-nutrition',bank='nutrition-past-papers';
const hash=x=>createHash('sha256').update(x).digest('hex');
const letters='ABCDE';
/** Preserve legacy IDs and saved attempts; the source ledger remains immutable. */
export function extendNutrition(root,sources,baseFinal,baseCatalog,output) {
  const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const directory=path.join(root,'data/nutrition/imports');
  const imports=fs.existsSync(directory)?fs.readdirSync(directory).filter(f=>f.endsWith('.json')).sort().map(f=>read('data/nutrition/imports/'+f)):[];
  const resolutions=fs.existsSync(path.join(root,'data/nutrition/legacy-resolutions.json'))?read('data/nutrition/legacy-resolutions.json'):{questions:{},duplicates:{}};
  const finalById=new Map(baseFinal.map(q=>[q.id,q]));
  const catalog=structuredClone(baseCatalog);
  const sectionFor=id=>{const s=sources.sections.find(s=>s.id===id);assert(s,'Unknown nutrition section '+id);return s;};
  function make(id,row,paper,section) {
    assert(row.options.length>=4&&row.options.length<=5,id);
    assert(row.options.every(o=>typeof o==='string'&&o.trim()),id);
    const duplicateChoices=new Set(row.options.map(o=>o.toLowerCase().trim())).size!==row.options.length;
    assert(row.key&&letters.slice(0,row.options.length).includes(row.key),id);
    assert((row.acceptedOptionIds??[]).every(k=>letters.slice(0,row.options.length).includes(k)),id+' invalid accepted answer');
    for(let i=0;i<row.options.length;i++)for(let j=i+1;j<row.options.length;j++)if(row.options[i].toLowerCase().trim()===row.options[j].toLowerCase().trim()){
      const accepted=k=>k===row.key||row.acceptedOptionIds?.includes(k);
      assert.equal(Boolean(accepted(letters[i])),Boolean(accepted(letters[j])),id+' identical choices cannot be graded differently');
    }
    assert(row.explanation?.length>30&&row.evidence?.length,id+' requires reviewed evidence');
    assert(!row.repair||row.originalQuestion,id+' repair must retain original');
    const options=row.options.map((text,i)=>({id:letters[i],text}));
    const inferred=Boolean(row.repair)||paper.providedKeyKind==='student-mark'||['F','N','D'].includes(paper.id)||!row.providedKey||row.providedKey!==row.key;
    const original=row.originalQuestion;
    return {schemaVersion:'1.0.0',id,revision:row.repair||finalById.has(id)?2:1,status:'verified',kind:'single_best_answer',subject:'biochemistry',
      topic:section.title,chapter:`Nutrition Review §${section.reviewSection}: ${section.title}`,difficulty:2,prompt:row.prompt,options,correctOptionId:row.key,
      ...(row.acceptedOptionIds?.length?{acceptedOptionIds:row.acceptedOptionIds}:{}),explanation:row.explanation,
      distractorExplanations:row.distractorExplanations??{},learningObjective:`Explain ${paper.title}, question ${row.number}: ${section.title}`,
      source:{title:paper.originalFilename,chapter:`${paper.title} · Q${row.number}`,page:String(row.page),lecture:paper.scopeNote??'Source order retained; source marks are not authenticated official keys.',
        excerpt:`${row.providedKey?`Source mark: ${row.providedKey}. `:''}${row.note??''}${original?` Original stem: ${original.prompt} Original choices: ${original.options.map((s,i)=>`${letters[i]}) ${s}`).join(' | ')}`:''}`.trim()||'Editorial study key; no authenticated official key.'},
      answerReview:{basis:inferred?'ai-inferred':'source-reviewed',confidence:row.note||row.repair?'medium':'high',canonicalSourceId:id,auditedAt:'2026-09-24',evidence:row.evidence},
      tags:['term-2','exam-term2-nutrition','nutrition-past-paper',`final-bank-${bank}`,`nutrition-section-${section.id}`],examPriority:'standard',
      qualityFlags:['past-paper-key-not-official',...(inferred?['ai-inferred-answer']:['source-key-transcribed']),...(row.note?['qualified-source-wording']:[]),...(duplicateChoices?['duplicate-source-distractor']:[]),...(row.repair?['editorially-repaired-source-question']:[])]};
  }
  for(const [id,row] of Object.entries(resolutions.questions??{})){
    const record=catalog.archive.find(r=>r.id===id);assert(record,'Missing legacy item '+id);
    const paper=catalog.papers.find(p=>p.id===record.paperId),section=sectionFor(row.sectionId??record.sectionId);
    row.number=record.number;row.page=record.page;
    const qid='nutrition-past-'+id.toLowerCase();
    const q=row.key?make(qid,row,paper,section):null;
    if(q)finalById.set(qid,q);else finalById.delete(qid);
    Object.assign(record,{sectionId:section.id,topic:section.title,explanation:row.explanation,status:row.repair?'study-repair':row.key?'supported':'unresolved',
      gradedQuestionId:q?.id??null,gradingStatus:q?'scored':'ungraded',checkedAnswer:q?q.options.find(o=>o.id===q.correctOptionId).text:null,
      originalQuestion:q??{prompt:row.prompt,options:row.options.map((text,i)=>({id:letters[i],text})),explanation:row.explanation,distractorExplanations:{}},
      sourceOriginal:row.originalQuestion??{prompt:row.prompt,options:row.options},providedKey:row.providedKey??null,evidence:row.evidence,ungradedReason:q?null:row.note??row.explanation});
  }
  for(const [id,target] of Object.entries(resolutions.duplicates??{})){
    const record=catalog.archive.find(r=>r.id===id);assert(record&&catalog.archive.some(r=>r.id===target));
    finalById.delete('nutrition-past-'+id.toLowerCase());
    Object.assign(record,{gradedQuestionId:null,gradingStatus:'duplicate-source',checkedAnswer:null,duplicateOf:target,ungradedReason:`Repeated scan of ${target}; preserved without extra scored weight.`});
  }
  for(const paper of imports){
    assert(!catalog.papers.some(p=>p.id===paper.id),'Duplicate paper ID '+paper.id);
    assert.equal(hash(fs.readFileSync(path.join(root,'public',paper.file))),paper.sha256,'Source PDF drift '+paper.id);
    catalog.papers.push({...paper,questions:undefined,itemCount:paper.questions.length,courseConfirmed:false});
    const numbers=new Set();
    for(const row of paper.questions){
      assert(!numbers.has(row.number));numbers.add(row.number);
      assert(Number.isInteger(row.page)&&row.page>0);
      const section=sectionFor(row.sectionId),id=`${paper.id}-q${String(row.number).padStart(3,'0')}`,qid='nutrition-past-'+id;
      const q=row.key?make(qid,row,paper,section):null;if(q)finalById.set(qid,q);
      catalog.archive.push({id,paperId:paper.id,number:row.number,page:row.page,locator:`PDF p. ${row.page}`,topic:section.title,sectionId:section.id,courseMatch:'Nutrition theory; current syllabus unconfirmed',
        explanation:row.explanation,status:row.repair?'study-repair':row.key?'supported':'unresolved',gradingStatus:q?'scored':'ungraded',gradedQuestionId:q?.id??null,
        checkedAnswer:q?q.options.find(o=>o.id===q.correctOptionId).text:null,providedKey:row.providedKey??null,evidence:row.evidence,
        originalQuestion:q??{prompt:row.prompt,options:row.options.map((text,i)=>({id:letters[i],text})),explanation:row.explanation,distractorExplanations:{}},
        sourceOriginal:row.originalQuestion??{prompt:row.prompt,options:row.options},ungradedReason:q?null:row.note??'No defensible single key; original retained.'});
    }
  }
  const final=catalog.archive.flatMap(r=>r.gradedQuestionId?[finalById.get(r.gradedQuestionId)]:[]);assert(final.every(Boolean));
  assert.equal(new Set(final.map(q=>q.id)).size,final.length);
  catalog.counts={...catalog.counts,scoredPastPaper:final.length,allSourceItems:catalog.archive.length};
  syncMetadata(root,catalog,final,output);
  return {final,catalog};
}

function syncMetadata(root,catalog,final,output) {
  const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const sourceCatalog=read('data/mcq-refactor/past-source-catalog.json'),downloadCatalog=read('public/study/past-paper-downloads/catalog.json');
  const curriculum=read('data/review-curriculum/courses/term2-nutrition.json'),evidence=read('data/review-curriculum/evidence/question-review-map-v2.json'),occurrence=read('data/review-curriculum/evidence/source-occurrence-review-map.json');
  const collections=[],assets=[];
  for(const paper of catalog.papers){
    const id='nutrition-'+paper.id.toLowerCase(),old=sourceCatalog.collections.find(c=>c.id===id),rows=catalog.archive.filter(r=>r.paperId===paper.id);
    const source={title:paper.originalFilename,publicUrl:paper.file,sha256:paper.sha256,exists:true,note:'Source marks retained separately from editorial study keys.'};
    const downloads=old?.downloads??{questions:`/study/past-paper-downloads/${id}/questions.md`,answerKey:`/study/past-paper-downloads/${id}/answer-key.md`,questionsAndKey:`/study/past-paper-downloads/${id}/questions-and-answer-key.md`};
    const note=paper.scopeNote??old?.note??'Supplied nutrition theory paper; dates are filename labels unless confirmed on the original.';
    const intro=`# ${paper.title}\n\n${note}\n\nCollection ID: ${id}\nCourse: Nutrition\n\nStudy answers are editorial, not authenticated official university keys. Explicit repairs preserve original wording and options.\n\n## Original sources\n\n- ${paper.originalFilename}: ${paper.file}\n\n`;
    const questions='## Questions\n\n'+rows.map(r=>{
      const q=r.originalQuestion;
      return `### ${r.number} · ${r.id}\n\n${r.status==='study-repair'?'Edited study version; original wording is retained below.\n\n':''}${q?.prompt??r.topic}\n\n${q?.options.map(o=>`${o.id}. ${o.text}`).join('\n')??'Original question and options: consult the source PDF; not fully transcribed.'}\n\nSource: Original Q${r.number}; page ${r.page}.\n\n${r.sourceOriginal&&r.status==='study-repair'?`Note: Original stem: ${r.sourceOriginal.prompt} Original choices: ${r.sourceOriginal.options.map((s,i)=>`${letters[i]}) ${s}`).join(' | ')}\n\n`:''}${r.ungradedReason?`Status: Ungraded - ${r.ungradedReason}\n\n`:''}`;
    }).join('\n');
    const keys='## Answer key and provenance\n\n'+rows.map(r=>{
      const q=final.find(q=>q.id===r.gradedQuestionId);
      return `### ${r.number} · ${r.id}\n\nKey: ${q?`${q.correctOptionId} — ${r.checkedAnswer}`:'Ungraded - '+(r.ungradedReason??'source only')}\n\nKey provenance: ${q?.answerReview?.basis==='source-reviewed'?'Source mark with editorial review':'Editorial study answer / source review note'}; not an official university key.\n\nExisting answer note: ${r.explanation}\n\n${q?.acceptedOptionIds?.length?`Accepted alternatives: ${q.acceptedOptionIds.join(', ')}\n\n`:''}Source: Original Q${r.number}; page ${r.page}.\n\n${(q?.answerReview?.evidence??r.evidence??[]).join('\n')}\n`;
    }).join('\n');
    for(const [kind,content]of Object.entries({questions:intro+questions,answerKey:intro+keys,questionsAndKey:intro+questions+'\n'+keys})){
      const text=content.trimEnd()+'\n';
      output('public'+downloads[kind],text);assets.push({collectionId:id,url:downloads[kind],bytes:Buffer.byteLength(text),sha256:hash(text)});
    }
    const original=fs.readFileSync(path.join(root,'public',paper.file));assert.equal(hash(original),paper.sha256);
    assets.push({collectionId:id,url:paper.file,bytes:original.length,sha256:paper.sha256});
    const graded=rows.filter(r=>r.gradedQuestionId);
    collections.push({...old,id,courseId:exam,bankId:bank,bankKey:exam+':'+bank,title:paper.title,note,kind:'supplied-source-paper',date:old?.date??null,dateEvidence:'Filename/source label only; no invented date',courseMatch:paper.id==='O'?'supplementary-oral-health':'nutrition-theory',defaultEligible:paper.id!=='O'&&paper.defaultEligible!==false,originalOrderClaim:true,sources:[source],sourceRecordCount:rows.length,transcribedQuestionCount:rows.filter(r=>r.originalQuestion).length,gradedQuestionCount:graded.length,sourceKeyCount:rows.filter(r=>r.providedKey).length,editorialKeyCount:graded.length,ungradedCount:rows.length-graded.length,questionIds:rows.map(r=>r.id),gradedQuestionIds:graded.map(r=>r.gradedQuestionId),downloads,originals:[{name:paper.originalFilename,url:paper.file}]});
  }
  for(const q of final){
    const sectionId='nutrition/'+q.tags.find(t=>t.startsWith('nutrition-section-')).slice('nutrition-section-'.length);assert(curriculum.sections.some(s=>s.id===sectionId));
    const mapping={sectionId,uncertain:false,status:'mapped',livePractice:false,bankId:bank};curriculum.questions[q.id]=mapping;
    evidence.questions[q.id]={examId:exam,bankId:bank,kind:q.kind,sectionId,uncertain:false,status:'mapped',specificity:'section',method:'source-question-topic-audit',evidence:`Source item matched to ${sectionId}; thematic routing does not authenticate the answer.`,sourceQualityFlags:q.qualityFlags};
  }
  const finalIds=new Set(final.map(q=>q.id));
  for(const [id,q]of Object.entries(curriculum.questions))if(q.bankId===bank&&!finalIds.has(id)){delete curriculum.questions[id];delete evidence.questions[id];}
  for(const r of catalog.archive){
    const sectionId=r.sectionId?'nutrition/'+r.sectionId:null;assert(!sectionId||curriculum.sections.some(s=>s.id===sectionId));
    occurrence.occurrences['nutrition/'+r.id]={examId:exam,sourceOccurrenceId:r.id,paperId:r.paperId,questionId:r.gradedQuestionId,sectionId,uncertain:!sectionId,method:'explicit-source-archive-sectionId',gradingStatus:r.gradingStatus,sourceStatus:r.status,sameItemAs:r.duplicateOf??null,sourceQuestionLocator:r.locator,ungradedReason:r.ungradedReason};
    curriculum.questions[r.id]={sectionId,uncertain:!sectionId,status:sectionId?'mapped':'needs-crosswalk',livePractice:false,bankId:'nutrition-source-archive'};
  }
  // Other course builders share these catalogs. Replace our rows in place so a
  // later Biochemistry build cannot cause an endless append-order/check cycle.
  const replaceOwned=(previous,next,owned,key)=>{
    const remaining=new Map(next.map(r=>[key(r),r]));
    const result=previous.flatMap(r=>{if(!owned(r))return [r];const value=remaining.get(key(r));remaining.delete(key(r));return value?[value]:[];});
    return [...result,...remaining.values()];
  };
  sourceCatalog.collections=replaceOwned(sourceCatalog.collections,collections,c=>c.courseId===exam,c=>c.id);
  sourceCatalog.assets=replaceOwned(sourceCatalog.assets,assets,a=>a.collectionId?.startsWith('nutrition-'),a=>a.url);
  const summary={emptyReason:null,collectionIds:collections.map(c=>c.id),defaultCollectionIds:collections.filter(c=>c.defaultEligible).map(c=>c.id),hasSourceCollections:true,sourceRecordCount:catalog.archive.length,gradedQuestionCount:final.length};
  Object.assign(sourceCatalog.courses.find(c=>c.id===exam),summary);Object.assign(downloadCatalog.courses.find(c=>c.id===exam),summary,{collections});
  for(const [file,value]of Object.entries({'data/mcq-refactor/past-source-catalog.json':sourceCatalog,'public/study/past-paper-downloads/catalog.json':downloadCatalog,'data/review-curriculum/courses/term2-nutrition.json':curriculum,'data/review-curriculum/evidence/question-review-map-v2.json':evidence,'data/review-curriculum/evidence/source-occurrence-review-map.json':occurrence}))output(file,value);
}
