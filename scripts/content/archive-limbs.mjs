import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../..');
const archive='/Users/rizzist/Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Past Exams';
const imports=path.join(root,'data/limbs/imports');
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest={version:1,collectedAt:'2026-09-30',channels:['McQ 🇦🇷 🇦🇷 — Anatomy limbs topic','TUMS MCQ BANK (@TUMS_2020)','McQ_ANS (@mcqtums)'],collections:[]};
for(const filename of fs.readdirSync(imports).filter(f=>f.endsWith('.json')).sort()){
 const paper=JSON.parse(fs.readFileSync(path.join(imports,filename)));
 const folder=path.join(archive,paper.id);fs.mkdirSync(folder,{recursive:true});
 const sources=[],privateSources=[];
 for(const [i,file]of paper.originalFiles.entries()){
  const bytes=fs.readFileSync(file),ext=path.extname(file).toLowerCase();
  const basename=`${String(i+1).padStart(2,'0')}-${i===0?'paper':'related-source'}${ext}`;
  fs.copyFileSync(file,path.join(folder,basename));
  if(paper.privateOriginals){privateSources.push({title:path.basename(file),archiveName:basename,sha256:hash(bytes),bytes:bytes.length,reason:'Source contains student-identifying information; local archive only.'});continue;}
  const url=`/study/limbs/past-papers/${paper.id}/${basename}`,destination=path.join(root,'public',url);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  const optimized=ext==='.pdf'&&bytes.length>50*1024*1024;
  if(optimized)execFileSync(process.env.MED25_PDF_PYTHON??'python3',[path.join(root,'scripts/content/optimize-limbs-pdf.py'),file,destination],{stdio:'inherit'});
  else fs.writeFileSync(destination,bytes);
  const webBytes=fs.readFileSync(destination);
  sources.push({title:path.basename(file)+(optimized?' (web-optimized scan)':''),archiveName:basename,url,sha256:hash(webBytes),bytes:webBytes.length,...(optimized?{originalSha256:hash(bytes),originalBytes:bytes.length,processing:'Full-resolution scan images JPEG-reencoded at quality 90; all pages, page dimensions and text preserved. Untouched original retained in local archive.'}:{})});
 }
 const record={id:paper.id,title:paper.title,note:paper.note,sources};
 fs.writeFileSync(path.join(folder,'source-manifest.json'),JSON.stringify({...record,privateSources,channels:manifest.channels},null,2)+'\n');
 manifest.collections.push(record);
}
fs.writeFileSync(path.join(root,'data/limbs/source-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Archived',manifest.collections.length,'collections at',archive);
