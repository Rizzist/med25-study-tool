import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { religionPractice } from './content/religion-practice.mjs';
import { religionPastReview } from './content/religion-past-papers.mjs';
const root=resolve(import.meta.dirname,'..');
const sources=JSON.parse(readFileSync(resolve(root,'data/religion/sources.json'),'utf8'));
const modules=new Map(sources.modules.map(m=>[m.id,m]));
const records=new Map(sources.records.map(r=>[r.id,r]));
const letters=['A','B','C','D'];
function reviewed(r,seen=new Set()) {
  assert(!seen.has(r.id),`Cyclic duplicate ${r.id}`); seen.add(r.id);
  const result=religionPastReview[r.id];
  if(result) return result;
  assert(r.sameItemAs && records.has(r.sameItemAs),`Missing editorial review: ${r.id}`);
  return reviewed(records.get(r.sameItemAs),seen);
}
const evidence=m=>m.references.map(r=>`${r.title} (${r.locator})${r.url?` — ${r.url}`:''}`).join('; ');
function make({id,sectionId,difficulty,prompt,options,key,why,wrong,record}) {
  const m=modules.get(sectionId); assert(m,`Unknown topic ${sectionId}`);
  assert.equal(options.length,4); assert.equal(wrong.length,3,`${id} needs three option explanations`);
  assert(letters.includes(key)); assert.equal(new Set(options).size,4);
  assert(why.length>40); assert(wrong.every(s=>s.length>20));
  let wi=0;
  const paper=record && sources.papers.find(p=>p.id===record.paperId);
  return {schemaVersion:'1.0.0',id,revision:1,status:'verified',kind:record?.media?'image_single_best_answer':'single_best_answer',
    subject:'religion',topic:m.title,chapter:`Religion Review §${m.reviewSection}: ${m.title}`,difficulty,prompt,
    options:options.map((text,i)=>({id:letters[i],text})),correctOptionId:key,explanation:why,
    distractorExplanations:Object.fromEntries(letters.flatMap(k=>k===key?[]:[[k,wrong[wi++]]])),
    learningObjective:`${m.title}: ${record?`explain original item ${record.id}`:id.replace('religion-practice-','').replaceAll('-',' ')}`,
    source:record?{title:paper.originalFilename,chapter:`Original ${record.id} · ${m.title}`,page:record.locator,
      lecture:'Original wording and option order retained; editorial key, not an official university key.',
      excerpt:`Religion Review §${m.reviewSection}, PDF page ${m.reviewPage}. ${evidence(m)}${record.providedAnswer?` Original marked/sheet key: ${record.providedAnswer}; not authoritative.`:''}`}
      :{title:'Religion Review',chapter:`§${m.reviewSection} · ${m.title}`,page:`PDF page ${m.reviewPage}`,
      excerpt:`Newly authored review practice, not a recovered exam question. ${m.basis}. ${evidence(m)}`},
    tags:['term-2','exam-term2-religion',`religion-section-${sectionId}`,...(record?['religion-past-paper','final-bank-religion-past-papers',`religion-source-${record.id.toLowerCase()}`]:['religion-practice','review-derived'])],
    examPriority:record?'standard':difficulty>=4?'high':'core',
    qualityFlags:record?['past-paper-key-not-official','course-framework-qualified',...(why.startsWith('CORRECTED')?['corrected-source-key']:[])]:['review-derived','source-scope-qualified'],
    ...(record?.media?{media:[{id:'source-verse',type:'image',...record.media}]}:{}),
  };
}
const practice=religionPractice.map((r,index)=>{
  assert.equal(r.distractors.length,3);
  const entries=[[r.answer,r.why],...r.distractors];
  const shift=index%4,ordered=entries.map((_,i)=>entries[(i+4-shift)%4]);
  return make({id:`religion-practice-${r.id}`,sectionId:r.section,difficulty:r.difficulty,prompt:r.prompt,
    options:ordered.map(e=>e[0]),key:letters[shift],why:r.why,wrong:ordered.filter((_,i)=>i!==shift).map(e=>e[1])});
});
const archive=sources.records.map(r=>{
  const review=reviewed(r); const m=modules.get(r.sectionId); assert(m);
  const score=Boolean(review.key && !r.sameItemAs);
  return {id:r.id,paperId:r.paperId,number:r.number,page:r.page,locator:r.locator,prompt:r.prompt,options:r.options,
    sectionId:r.sectionId,topic:m.title,providedAnswer:r.providedAnswer,providedAnswerKind:r.providedAnswerKind,
    checkedKey:review.key,checkedAnswer:review.key?`${review.key}. ${r.options[review.key]}`:null,
    explanation:review.why,qualification:r.qualification,sameItemAs:r.sameItemAs,
    gradingStatus:score?'scored':r.sameItemAs?'duplicate-source':'ungraded',
    gradedQuestionId:score?`religion-past-${r.id.toLowerCase()}`:null,
    optionNotes:review.key?Object.fromEntries(letters.map(k=>[k,k===review.key?review.why:review.wrong[letters.filter(l=>l!==review.key).indexOf(k)]])):null,
    media:r.media??null,reviewPage:m.reviewPage,references:m.references,
    ungradedReason:score?null:r.sameItemAs?`Repeated source item: ${r.sameItemAs}. Retained here without extra scored weight.`:'Original retained with answer notes; wording, source certainty or single-best-answer status does not justify automatic scoring.',
  };
});
const final=archive.filter(r=>r.gradedQuestionId).map(r=>{
  const review=reviewed(records.get(r.id));
  return make({id:r.gradedQuestionId,sectionId:r.sectionId,difficulty:2,prompt:r.prompt,options:letters.map(k=>r.options[k]),
    key:review.key,why:review.why,wrong:review.wrong,record:records.get(r.id)});
});
assert.equal(archive.length,180); assert.equal(new Set(archive.map(r=>r.id)).size,180);
assert.equal(new Set([...practice,...final].map(q=>q.id)).size,practice.length+final.length);
assert.equal(new Set(practice.map(q=>q.prompt)).size,practice.length);
assert(sources.modules.every(m=>practice.filter(q=>q.tags.includes(`religion-section-${m.id}`)).length>=3));
const catalog={version:1,examId:'term2-religion',review:{title:sources.review.title,scope:sources.review.scope,pages:sources.review.pages},
  counts:{practice:practice.length,scoredPastPaper:final.length,allSourceItems:archive.length,duplicateSource:archive.filter(r=>r.sameItemAs).length,ungraded:archive.filter(r=>r.gradingStatus==='ungraded').length},
  modules:sources.modules.map(m=>({...Object.fromEntries(Object.entries(m).filter(([key])=>key!=='blocks')),questionIds:practice.filter(q=>q.tags.includes(`religion-section-${m.id}`)).map(q=>q.id)})),
  papers:sources.papers,archive};
function output(path,value){const file=resolve(root,path),text=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';
  if(process.argv.includes('--check')) assert.equal(readFileSync(file,'utf8'),text,`${path} is stale`);
  else{mkdirSync(resolve(file,'..'),{recursive:true});writeFileSync(file,text);}}
output('data/bank/questions/term2-religion.jsonl',practice.map(q=>JSON.stringify(q)).join('\n')+'\n');
output('data/final-exams/religion-past-papers.jsonl',final.map(q=>JSON.stringify(q)).join('\n')+'\n');
output('data/religion/catalog.json',catalog);
console.log(`Religion: ${practice.length} practice; ${final.length} scored source items; all ${archive.length} original occurrences retained (${catalog.counts.duplicateSource} repeats, ${catalog.counts.ungraded} ungraded originals).`);
