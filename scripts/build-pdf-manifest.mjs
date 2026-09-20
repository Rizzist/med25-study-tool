// Content hashes, not app timestamps: unchanged PDF bytes keep the same cache key.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),base=path.join(root,'public/study');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):entry.isFile()&&/\.pdf$/i.test(entry.name)?[path.join(dir,entry.name)]:[]);}
const files=Object.fromEntries(walk(base).sort().map(file=>{
  const bytes=fs.readFileSync(file),relative=path.relative(base,file).split(path.sep).map(encodeURIComponent).join('/');
  return ['/study/'+relative,{version:sha(bytes),bytes:bytes.length}];
}));
const content=JSON.stringify({version:sha(JSON.stringify(files)),files},null,2)+'\n',output=path.join(base,'pdf-manifest.json');
if(process.argv.includes('--check')){
  if(fs.readFileSync(output,'utf8')!==content)throw Error('PDF manifest is stale. Run node scripts/build-pdf-manifest.mjs.');
}else fs.writeFileSync(output,content);
console.log(`PDF manifest ${process.argv.includes('--check')?'verified':'built'}: ${Object.keys(files).length} on-demand PDFs.`);
