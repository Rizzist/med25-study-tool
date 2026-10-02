// Append the October downloads without rebuilding/reclassifying the September archive.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'../..');
const archive=path.join(os.homedir(),'Documents/MED SLIDES/TERM 2/04 Upper Limb Carryover/Past Exams');
const ids=['limbs-iums-upper-2021','limbs-upper-axial-fragment','limbs-lower-axial-fragment'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
const write=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);};
const json=(file,data)=>write(file,JSON.stringify(data,null,2)+'\n');
const copyNew=(file,dest)=>{
 const bytes=fs.readFileSync(file);
 if(fs.existsSync(dest))assert.equal(digest(fs.readFileSync(dest)),digest(bytes),'Refusing to replace a different archived source: '+dest);
 else write(dest,bytes);
 return bytes;
};
const manifest=read(path.join(root,'data/limbs/source-manifest.json'));
const inventory=read(path.join(root,'data/limbs/collection-inventory.json'));
let index=0;
const addInventory=row=>{
 const i=inventory.inventory.findIndex(x=>x.set==='october-downloads'&&x.originalName===row.originalName);
 if(i<0)inventory.inventory.push(row);else inventory.inventory[i]=row;
};
for(const id of ids){
 const paper=read(path.join(root,'data/limbs/imports',id+'.json'));
 const folder=path.join(archive,id),sources=[],privateSources=[];
 for(const [i,file]of paper.originalFiles.entries()){
  const archiveName=`${String(i+1).padStart(2,'0')}-${i?'related-source':'paper'}.pdf`;
  const bytes=copyNew(file,path.join(folder,archiveName));
  const record={title:path.basename(file),archiveName,sha256:digest(bytes),bytes:bytes.length};
  if(paper.privateOriginals)privateSources.push({...record,reason:'Cover includes a student name; originals retained locally only.'});
  else{
   const url=`/study/limbs/past-papers/${id}/${archiveName}`;
   copyNew(file,path.join(root,'public',url));sources.push({...record,url});
  }
  addInventory({set:'october-downloads',index:++index,originalName:path.basename(file),sha256:digest(bytes),collection:id,archivePath:`${id}/${archiveName}`,classification:i?'Companion key / duplicate subset of same source questions':'Imported source; distinct questions consolidated'});
 }
 const entry={id,title:paper.title,note:paper.note,sources};
 const existing=manifest.collections.findIndex(c=>c.id===id);
 if(existing<0)manifest.collections.push(entry);else manifest.collections[existing]=entry;
 json(path.join(folder,'source-manifest.json'),{...entry,privateSources,collectedAt:'2026-10-02'});
 const exported=path.join(root,'public/study/past-paper-downloads',id,'questions-and-key.md');
 if(fs.existsSync(exported))write(path.join(folder,'exam-and-answer-key.md'),fs.readFileSync(exported));
}
// A cleaner PDF of the already-imported 25-question midterm is not a new paper.
const midterm=path.join(os.homedir(),'Downloads/upper-limb mid term.pdf');
const midtermArchive='limbs-upper-midterm-2025/99-consolidated-source.pdf';
const midtermBytes=copyNew(midterm,path.join(archive,midtermArchive));
addInventory({set:'october-downloads',index:++index,originalName:path.basename(midterm),sha256:digest(midtermBytes),collection:'limbs-upper-midterm-2025',archivePath:midtermArchive,classification:'Already imported as 25 source-photo questions; consolidated PDF retained, no duplicate exam'});
const book=path.join(os.homedir(),'Downloads/Upper_limb_mcqs (1).pdf');
const bookBytes=fs.readFileSync(book),bookArchive='_reference-only/upper-revision-book/01-source.pdf';
assert.equal(digest(bookBytes),digest(fs.readFileSync(path.join(archive,bookArchive))),'Revision booklet is no longer the known duplicate');
addInventory({set:'october-downloads',index:++index,originalName:path.basename(book),sha256:digest(bookBytes),archivePath:bookArchive,classification:'Exact duplicate generic revision booklet; reference-only, not a verified past exam'});
manifest.updatedAt='2026-10-02';inventory.updatedAt='2026-10-02';
json(path.join(root,'data/limbs/source-manifest.json'),manifest);
json(path.join(root,'data/limbs/collection-inventory.json'),inventory);
json(path.join(archive,'source-inventory.json'),inventory.inventory);
console.log('October sources archived:',ids.join(', '));
