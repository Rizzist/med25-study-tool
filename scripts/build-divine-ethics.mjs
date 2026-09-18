import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { divineEthicsSource as source, divineEthicsModules as modules } from './content/divine-ethics-teaching.mjs';
import { divineEthicsPractice } from './content/divine-ethics-practice.mjs';

const root=resolve(import.meta.dirname,'..');
const letters=['A','B','C','D'];
const questions=divineEthicsPractice.map((r,i)=>{
  const module=modules.find(m=>m.id===r.module);
  const page=source.pages.find(p=>p.pdf===r.page);
  assert(module && module.pages.includes(r.page),`${r.id}: invalid module/page`);
  assert(page?.kind==='teaching',`${r.id}: contents are not teaching pages`);
  assert.equal(r.distractors.length,3);
  assert(r.why.length>40 && r.distractors.every(d=>d[1].length>20));
  const entries=[[r.answer,r.why],...r.distractors];
  const shift=i%4;
  const ordered=entries.map((_,j)=>entries[(j+4-shift)%4]);
  assert.equal(new Set(ordered.map(o=>o[0])).size,4);
  return {schemaVersion:'1.0.0',id:`divine-ethics-practice-${r.id}`,revision:1,status:'verified',kind:'single_best_answer',
    subject:'religion',topic:module.title,chapter:`Divine Ethics · ${module.title}`,difficulty:r.difficulty,prompt:r.prompt,
    options:ordered.map((o,j)=>({id:letters[j],text:o[0]})),correctOptionId:letters[shift],explanation:r.why,
    distractorExplanations:Object.fromEntries(ordered.flatMap((o,j)=>j===shift?[]:[[letters[j],o[1]]])),
    learningObjective:module.takeaway,
    source:{title:source.title,chapter:module.title,page:`PDF page ${r.page} · printed page ${page.printed}`,
      lecture:'Newly authored practice from the supplied teaching extract, not a past-paper question or official answer key.',
      excerpt:`Checked against the page image. ${module.takeaway}`},
    tags:['term-2','exam-term2-divine-ethics','divine-ethics-practice',`divine-ethics-module-${module.id}`,'source-based'],
    examPriority:r.difficulty>=4?'high':'core',qualityFlags:['newly-authored','source-page-checked','course-framework-qualified']};
});
assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
assert.equal(new Set(questions.map(q=>q.prompt)).size,questions.length);
assert(source.pages.filter(p=>p.kind==='teaching').every(p=>divineEthicsPractice.some(q=>q.page===p.pdf)));
assert(modules.every(m=>divineEthicsPractice.filter(q=>q.module===m.id).length>=6));
const catalog={version:1,examId:'term2-divine-ethics',source,
  counts:{practice:questions.length,topics:modules.length,teachingPages:source.pages.filter(p=>p.kind==='teaching').length,pastPaper:0},
  modules:modules.map(m=>({...m,questionIds:questions.filter(q=>q.tags.includes(`divine-ethics-module-${m.id}`)).map(q=>q.id)}))};
function output(path,value){
  const file=resolve(root,path),text=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';
  if(process.argv.includes('--check')) assert.equal(readFileSync(file,'utf8'),text,`${path} is stale`);
  else {mkdirSync(resolve(file,'..'),{recursive:true});writeFileSync(file,text);}
}
output('data/bank/questions/term2-divine-ethics.jsonl',questions.map(q=>JSON.stringify(q)).join('\n')+'\n');
output('data/divine-ethics/catalog.json',catalog);
output('data/divine-ethics/coverage.json',{source:source.title,pages:source.pages.map(p=>({...p,questionIds:divineEthicsPractice.filter(q=>q.page===p.pdf).map(q=>`divine-ethics-practice-${q.id}`)})),limits:source.limits});
console.log(`Divine Ethics: ${questions.length} practice MCQs, ${modules.length} topics, ${catalog.counts.teachingPages} teaching pages; no past-paper bank.`);
