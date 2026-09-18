import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { nutritionPractice } from "./content/nutrition-practice.mjs";
import { nutritionPastPapers } from "./content/nutrition-past-papers.mjs";
const root = resolve(import.meta.dirname,"..");
const sources = JSON.parse(readFileSync(resolve(root,"data/nutrition/sources.json"),"utf8"));
const modules = new Map(sources.sections.map(s => [s.id,s]));
const sourceRecords = new Map(sources.records.map(r => [r.id,r]));
const letters = ["A","B","C","D"];
function make(row, index, past) {
  let id, sectionId, difficulty, prompt, options, key, explanation, wrong;
  if (past) {
    [id,sectionId,prompt,options,key,explanation,wrong] = row;
    difficulty = 2;
  } else {
    let correct, distractors;
    [id,sectionId,difficulty,prompt,correct,distractors,explanation,wrong] = row;
    const shift = index % 4;
    const original = [correct,...distractors];
    options = original.map((_,i)=>original[(i+4-shift)%4]);
    key = shift;
    const originalWhy = [explanation,...wrong];
    wrong = options.flatMap((_,i)=>i === key ? [] : [originalWhy[(i+4-shift)%4]]);
  }
  const section = modules.get(sectionId);
  assert(section, `Unknown section ${sectionId}`);
  assert.equal(options.length,4);
  assert.equal(wrong.length,3);
  assert.equal(new Set(options).size,4);
  assert(explanation.length > 40);
  const sourceItem = past ? sourceRecords.get(id) : null;
  if (past) assert(sourceItem,`Not an original paper item: ${id}`);
  const paper = past ? sources.papers.find(p=>p.id===sourceItem.paperId) : null;
  let cursor = 0;
  return {
    schemaVersion:"1.0.0", id:past ? `nutrition-past-${id.toLowerCase()}` : `nutrition-practice-${id}`,
    revision:1,status:"verified",kind:"single_best_answer",subject:"biochemistry",
    topic:section.title,chapter:`Nutrition Review §${section.reviewSection}: ${section.title}`,difficulty,prompt,
    options:options.map((text,i)=>({id:letters[i],text})),correctOptionId:letters[key],explanation,
    distractorExplanations:Object.fromEntries(options.flatMap((_,i)=>i===key?[]:[[letters[i],wrong[cursor++]]])),
    learningObjective:`${section.title}: ${past ? `explain original source item ${id}` : id.replaceAll("-"," ")}`,
    source:past ? {
      title:paper.originalFilename,chapter:`Original ${id} · ${section.title}`,page:sourceItem.locator,
      lecture:`${id.startsWith("N") && id!=="N15" ? "English translation; original Persian choices preserved in source order. " : "English source; original option order retained. "}Student marks are not an official key.`,
      excerpt:`Checked against Nutrition Review §${section.reviewSection}; Nutrition & Diet Therapy, 9th ed., ${section.bookLocator}. ${sourceItem.status === "qualified" ? "Historical or qualified wording: read the explanation." : ""}`,
    } : {
      title:"Nutrition Review + Nutrition & Diet Therapy",edition:"DeBruyne, Pinna & Whitney · 9th (2016)",
      chapter:`Review §${section.reviewSection} · ${section.title}`,page:section.bookLocator,
      excerpt:`Newly authored practice, not a past-paper question. ${section.supplementary ? "Oral-health book supplement; exam inclusion unconfirmed. " : ""}${section.references.map(r=>`${r.title}: ${r.url}`).join("; ")}`,
    },
    tags:["term-2","exam-term2-nutrition",`nutrition-section-${sectionId}`,...(past ? ["nutrition-past-paper","final-bank-nutrition-past-papers",`nutrition-source-${id.toLowerCase()}`] : ["nutrition-practice","book-extension",...(section.supplementary?["scope-unconfirmed-oral-health"]:[])])],
    examPriority:past?"standard":difficulty>=4?"high":"core",
    qualityFlags:past?["past-paper-key-not-official",...(sourceItem.status==="qualified"?["qualified-source-wording"]:[])]:["book-review-derived","lecture-scope-unconfirmed",...(section.supplementary?["supplementary-scope"]:[])],
  };
}
const practice = nutritionPractice.map((r,i)=>make(r,i,false));
const final = nutritionPastPapers.map((r,i)=>make(r,i,true)).sort((a,b)=>{
  const aid=a.id.replace("nutrition-past-",""), bid=b.id.replace("nutrition-past-","");
  return "fndo".indexOf(aid[0])-"fndo".indexOf(bid[0]) || Number(aid.slice(1))-Number(bid.slice(1));
});
assert.equal(new Set([...practice,...final].map(q=>q.id)).size,practice.length+final.length);
assert.equal(new Set(practice.map(q=>q.prompt)).size,practice.length);
const finalBySource = new Map(final.map(q=>[q.id.replace("nutrition-past-","").toUpperCase(),q]));
const corrections = {
  F21:"The renal ACTIVATING step is 1-alpha-hydroxylation of an already 25-hydroxylated substrate. But renal 24-hydroxylation also occurs. The unqualified original stem permits more than one renal reaction, so it is shown here without a forced single key.",
  O15:"Thiamin (vitamin B1) deficiency underlies Wernicke encephalopathy and the associated Korsakoff amnestic syndrome. Risk and presentation require clinical assessment; the original oral-health paper is retained here as supplementary source evidence.",
};
const catalog = {
  version:1,examId:"term2-nutrition",counts:{practice:practice.length,scoredPastPaper:final.length,allSourceItems:sources.records.length},
  scope:sources.review.scope,book:sources.book,
  modules:sources.sections.map(s=>({...s,questionIds:practice.filter(q=>q.tags.includes(`nutrition-section-${s.id}`)).map(q=>q.id)})),
  papers:sources.papers,
  archive:sources.records.map(r=>({...r,explanation:corrections[r.id]??finalBySource.get(r.id)?.explanation??r.explanation,
    gradedQuestionId:finalBySource.get(r.id)?.id??null,
    gradingStatus:finalBySource.has(r.id)?"scored":r.status==="duplicate"?"duplicate-source":r.paperId==="O"?"supplementary-ungraded":"ungraded",
    checkedAnswer:finalBySource.has(r.id)?finalBySource.get(r.id).options.find(o=>o.id===finalBySource.get(r.id).correctOptionId).text:null,
    originalQuestion:finalBySource.get(r.id)??null,
    ungradedReason:finalBySource.has(r.id)?null:r.paperId==="O"?"Separate oral-health paper: retained in full; current course match and original keys are not confirmed.":r.status==="duplicate"?"Repeated source item retained in the archive without giving it extra scored weight.":"Original retained below. Wording, key, historical convention, choice legibility or single-best-answer status requires clarification before automated scoring.",
  })),
};
function output(path,value){
  const file=resolve(root,path), text=typeof value==="string"?value:JSON.stringify(value,null,2)+"\n";
  if(process.argv.includes("--check")){ assert.equal(readFileSync(file,"utf8"),text,`${path} is stale`); }
  else { mkdirSync(resolve(file,".."),{recursive:true});writeFileSync(file,text); }
}
output("data/bank/questions/term2-nutrition.jsonl",practice.map(q=>JSON.stringify(q)).join("\n")+"\n");
output("data/final-exams/nutrition-past-papers.jsonl",final.map(q=>JSON.stringify(q)).join("\n")+"\n");
output("data/nutrition/catalog.json",catalog);
console.log(`Nutrition: ${practice.length} review/book practice MCQs; ${final.length} scored original-paper MCQs; all ${catalog.archive.length} source items retained in Final Exam.`);
