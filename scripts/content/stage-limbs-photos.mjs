import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {photoPapers} from './limbs-photo-review.mjs';
import {supplementalPapers} from './limbs-supplemental-review.mjs';
const root=path.resolve(import.meta.dirname,'../..'),input=JSON.parse(fs.readFileSync('/tmp/med25-limbs-import/input.json'));
for(const {rows,files,region,...definition} of [...photoPapers,...supplementalPapers]){
 const questions=rows.trim().split('\n').map(line=>{
  const [n,p,s,k,prompt,...tail]=line.split('|');assert.equal(tail.length,5,definition.id+' '+n);
  return {number:+n,sourceNumber:n,page:+p,sectionOrder:+s,key:k==='-'?null:k[0],...(k.length>1?{acceptedOptionIds:k.split('')}:{}),prompt,options:tail.slice(0,4),note:tail[4],region:region??(+s<21?'upper':'lower'),subject:'anatomy',providedKey:null};
 });
 fs.writeFileSync(path.join(root,'data/limbs/imports',definition.id+'.json'),JSON.stringify({...definition,originalFiles:files.map(i=>Array.isArray(i)?JSON.parse(fs.readFileSync(`/tmp/med25-limbs-import/${i[0]}.json`))[i[1]-1]:input[i-1]),questions,excludedItems:[],audit:{status:'reviewed',method:'Source photograph transcription; anatomy review; original defects preserved, multiple defensible choices accepted.'}},null,2)+'\n');
 console.log(definition.id,questions.length);
}
