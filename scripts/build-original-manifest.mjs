// Small on-demand index. No combined PDFs are uploaded or downloaded at startup.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const supported=url=>/\.(pdf|jpe?g|png)$/i.test(url);
const collections={},files={};
for(const course of read('public/study/past-paper-downloads/catalog.json').courses){
 for(const item of course.collections.flatMap(item=>item.fullPaper?[item,item.fullPaper]:[item])){
  let urls=item.originals.map(o=>o.url).filter(supported);
  // Legacy CVS cards pointed only to the first image and a text transcript.
  // Use every already-published question source page, not private/unindexed scans.
  if(course.id==='term2-cvs'&&urls.some(u=>/\.jpe?g$/i.test(u))&&!urls.some(u=>/\.pdf$/i.test(u))){
   const paper=read(`public/study/cvs-past-papers/${item.id}/paper.json`);
   urls=[...urls,...paper.questions.map(q=>q.sourcePage).filter(u=>u&&supported(u))];
   urls=[...new Set(urls)].sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
  }
  const sources=[],seen=new Set();
  for(const url of urls){
   assert(url.startsWith('/study/')&&!url.includes('..')&&!/[?#]/.test(url),url);
   const sourcePath=path.resolve(root,'public','.'+decodeURIComponent(url));
   assert(sourcePath.startsWith(path.join(root,'public/study')+path.sep),url);
   const bytes=fs.readFileSync(sourcePath),version=sha(bytes);
   const kind=/\.pdf$/i.test(url)?'pdf':/\.png$/i.test(url)?'png':'jpeg';
   files[url]={version,bytes:bytes.length,kind};
   // One copy per exact source, retaining the catalog's existing order.
   if(!seen.has(version)){sources.push(url);seen.add(version);}
  }
  if(sources.length)collections[item.id]={sources};
 }
}
const body={collections,files},manifest={version:sha(JSON.stringify(body)),...body};
const output=path.join(root,'public/study/originals-manifest.json'),text=JSON.stringify(manifest,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(output,'utf8'),text,'Original-source manifest is stale.');
else fs.writeFileSync(output,text);
console.log(`Original-source manifest: ${Object.keys(collections).length} collections; ${Object.keys(files).length} versioned assets.`);
