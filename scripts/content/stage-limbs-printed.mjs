import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {printedPapers} from './limbs-printed-review.mjs';
const root=path.resolve(import.meta.dirname,'../..');
for(const definition of printedPapers){
 const {rows,region,files,accepted,...paper}=definition;
 const questions=rows.trim().split('\n').map(line=>{
  const [number,page,sectionOrder,key,prompt,...tail]=line.trim().split('|');
  assert.equal(tail.length,5,`${paper.id} ${number}`);
  return {number:Number(number),sourceNumber:number,page:Number(page),sectionOrder:Number(sectionOrder),key:key==='-'?null:key,prompt,options:tail.slice(0,4),note:tail[4],region,subject:'anatomy',providedKey:null,...(accepted?.[number]?{acceptedOptionIds:accepted[number]}:{})};
 });
 const originalFiles=files.map(([set,n])=>JSON.parse(fs.readFileSync(`/tmp/med25-limbs-import/${set}.json`))[n-1]);
 const value={...paper,originalFiles,questions,excludedItems:[],audit:{status:'reviewed',method:'Printed source transcription in option-letter order; course-linked anatomical study answers. Handwritten marks are not treated as authenticated answer keys.'}};
 fs.writeFileSync(path.join(root,'data/limbs/imports',paper.id+'.json'),JSON.stringify(value,null,2)+'\n');
 console.log(paper.id,questions.length);
}
