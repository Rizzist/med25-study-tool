// One-time ingestion of already-downloaded sources. Normal builds use committed
// source assets and their hashes, never a personal filesystem path.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
import {expandedPapers} from './content/divine-ethics-expanded-papers.mjs';
const root=path.resolve(import.meta.dirname,'..');
const input=process.argv[2];
if(!input||!path.isAbsolute(input))throw Error('Pass the absolute source Downloads directory.');
const manifestPath=path.join(root,'data/divine-ethics/paper-source-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const jobs=[
 {id:'divine-ethics-first-term-photo-30',title:'Original five photographs, Q1–30',name:'first-term-photo-30-original.pdf',photos:['1951','1952','1953','1955','1956'].map(n=>`photo_527404065390866${n}_y.jpg`)},
 {id:'divine-ethics-2021-report-selection',title:'September 2021 tagged report, original 20 questions',name:'2021-report-original.pdf',file:'4_6037512510981015930.PDF'},
 {id:'divine-ethics-2021-report-selection',title:'Alternate report TestId 20146, reordered version',name:'2021-report-alternate.pdf',file:'divine ethics final.pdf'},
 {id:'divine-ethics-compilation-99-selection',title:'Original 99-item compilation and answer sheet',name:'compilation-99-original.pdf',file:'Devine-Ethics-MCQs[1] (1).pdf'},
 {id:'divine-ethics-2017-additional-selection',title:'Original 2017 compilation, de-identified version',name:'2017-compilation-original.pdf',file:'Divine Ethics EXAM QUESTIONS_Filtered_Edited.pdf'},
 {id:'divine-ethics-photo-20-additional-selection',title:'Original four photographs, Q1–20',name:'photo-20-original.pdf',photos:['3195','3194','3193','3192'].map(n=>`photo_621750222130680${n}_y.jpg`)},
];
for(const p of expandedPapers)manifest.collections=manifest.collections.filter(c=>c.id!==p.id);
for(const job of jobs){
 let bytes;
 if(job.photos){
  const doc=await PDFDocument.create();
  for(const file of job.photos){
   const image=await doc.embedJpg(fs.readFileSync(path.join(input,file)));
   const scale=595/image.width,page=doc.addPage([595,image.height*scale]);
   page.drawImage(image,{x:0,y:0,width:595,height:image.height*scale});
  }
  doc.setTitle(job.title);doc.setAuthor('MED25 source archive');
  doc.setCreationDate(new Date('2026-10-06T00:00:00Z'));doc.setModificationDate(new Date('2026-10-06T00:00:00Z'));
  bytes=Buffer.from(await doc.save());
 }else bytes=fs.readFileSync(path.join(input,job.file));
 const url='/study/divine-ethics/past-papers/'+job.name;
 fs.writeFileSync(path.join(root,'public',url),bytes);
 let collection=manifest.collections.find(c=>c.id===job.id);
 if(!collection){collection={id:job.id,sources:[]};manifest.collections.push(collection);}
 collection.sources.push({title:job.title,url,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),...(job.photos?{photos:job.photos}:{})});
}
manifest.policy='Question-level content admission against the review and first-term lessons. Explicit course labels and content-inferred relevance are distinguished. Missing review content is not proof of Ethics 2. Medical rulings, other named courses, authored practice, ambiguous unsupported items and duplicate versions are excluded from selected collections.';
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('Archived sources for',expandedPapers.length,'additional collections.');
