import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {reviews} from './limbs-native-review.mjs';
// Run only while importing: portable JSON output is subsequently the build input.
const root=path.resolve(import.meta.dirname,'../..');
const definitions={
 upper2021:{id:'limbs-upper-theory-2021',title:'Upper limb theory · report dated 17 April 2021',kind:'dated-paper',region:'upper',input:['input',29],note:'TUMS report TestId 19619. The report date is 17 April 2021; this does not independently establish the sitting date.'},
 lower2021:{id:'limbs-lower-theory-2021',title:'Lower limb theory · report dated 17 April 2021',kind:'dated-paper',region:'lower',input:['input',30],note:'TUMS report TestId 20333. The report date is 17 April 2021; this does not independently establish the sitting date.'},
 theory2022:{id:'limbs-mixed-theory-2022',title:'Upper & lower limb theory · 19 January 2022 (filename)',kind:'dated-paper',input:['extra',4],note:'The downloaded filename supplies 19 January 2022; the body identifies an upper/lower anatomy paper but does not independently print the sitting date. Q1–20 lower limb; Q21–45 upper limb.'}
};
for(const [name,paper]of Object.entries(definitions)){
 const r=reviews[name],rows=JSON.parse(fs.readFileSync(`/tmp/med25-limbs-import/${name}-rows.json`));
 assert.equal(rows.length,r.keys.length);assert.equal(rows.length,r.notes.length);assert.equal(rows.length,r.sections.length);
 const questions=rows.map((q,i)=>({...q,...r.fixes?.[q.number],key:r.keys[i],sectionOrder:r.sections[i],note:r.notes[i],region:paper.region??(q.number<=20?'lower':'upper'),subject:'anatomy',...(r.accepted?.[q.number]?{acceptedOptionIds:r.accepted[q.number]}:{})}));
 // q3's tick was vertically displaced by a PDF page-layout artifact, checked visually.
 if(name==='upper2021')questions[2].providedKey='C';
 const source=JSON.parse(fs.readFileSync(`/tmp/med25-limbs-import/${paper.input[0]}.json`))[paper.input[1]-1];
 const result={...paper,originalFiles:[source],defaultEligible:true,questions,excludedItems:[],audit:{status:'reviewed',method:'Native text + rendered source inspection; independently reviewed anatomical answers and course-section mapping.'}};
 delete result.input;delete result.region;
 const dest=path.join(root,'data/limbs/imports',paper.id+'.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
 console.log(paper.id,questions.length);
}
