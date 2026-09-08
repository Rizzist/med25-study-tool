import fs from 'node:fs';
import path from 'node:path';
import {buildAnatomyQuestions,anatomyValidationErrors} from '../src/lib/mcq/dynamic-anatomy.mjs';
const root=path.resolve(import.meta.dirname,'..');
const inputs=process.argv.slice(2);
if(!inputs.length)throw new Error('Provide reviewed image manifest(s)');
const images=[];
const overrides=[];
for(const input of inputs){
  const source=JSON.parse(fs.readFileSync(input,'utf8'));
  if(source.imageId&&source.operation){
    const original=JSON.parse(fs.readFileSync(path.join(root,'data/term2/anatomy-visual-images.json'),'utf8')).images.find(image=>image.id===source.imageId);
    if(!original)throw new Error('Unknown source for added callouts '+source.imageId);
    const names=new Set(original.regions.map(region=>region.label.toLowerCase()));
    // Expanded view gets new question IDs; old distractors, answer letters and
    // saved scores remain stable. Both views reference the same original PNG.
    images.push({...original,id:original.id+'-expanded',supersedesImageIds:[original.id],practicalExpansion:true,regions:[...original.regions,...source.regions.filter(region=>!names.has(region.label.toLowerCase()))]});
    continue;
  }
  for(const image of source.images){
    if(image.imageId){overrides.push(image);continue;}
    if(images.some(i=>i.id===image.id))throw new Error('Duplicate image '+image.id);
    const destination=path.resolve(root,'public/study',image.path);
    if(!destination.startsWith(path.resolve(root,'public/study')+path.sep))throw new Error('Invalid asset path');
    const sourceFile=path.join(path.dirname(input),path.basename(image.path));
    if(!fs.existsSync(sourceFile))throw new Error('Missing reviewed image '+sourceFile);
    fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(sourceFile,destination);
    images.push({...image,practicalExpansion:true,anatomy3d:{modelKey:image.moduleKey,structureIds:[]}});
  }
}
for(const override of overrides){
  const image=images.find(item=>item.id===override.imageId);
  if(!image)throw new Error('Unknown reviewed image '+override.imageId);
  // The same bone feature may appear in both A/B panels. Keep every callout in
  // the study record, but only one click target per name so grading is unambiguous.
  const names=new Set();
  image.studyRegions=override.regions;
  image.regions=override.regions.filter(region=>{const name=region.label.toLowerCase();if(names.has(name))return false;names.add(name);return true;});
  image.galleryOnly=false;image.studyOnly=false;image.markerMode='label';
  image.practiceNote='These are left-sided source specimens. Click the numbered callout, not the answer key. Only one callout per repeated structure is tested.';
  image.alt+=' Source specimen is left-sided; upper-limb 3D context is right-sided.';
}
fs.writeFileSync(path.join(root,'data/term2/anatomy-practical-images.json'),JSON.stringify({images},null,2)+'\n');
const candidates=images.filter(image=>image.regions.length>=4&&!image.galleryOnly&&!image.studyOnly);
const questions=buildAnatomyQuestions(candidates);
for(const q of questions){
  const errors=anatomyValidationErrors(q);if(errors.length)throw new Error(`${q.id}: ${errors}`);
  q.qualityFlags.push('regional-3d-context-only');
}
// The existing visual-bank and location-bank builders own persisted questions and concept links.
// Keep this importer additive and avoid storing a second copy of reverse-direction IDs.
console.log(`${images.length} study figures; ${questions.length} identification candidates for the visual-bank builder`);
