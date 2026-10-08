// One-time, explicit import from the locked editable manuscript, never from sliced PDF pages.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..'),sourceFile=process.argv[2];
assert(sourceFile,'Usage: node scripts/import-cvs-physio-review.mjs /path/to/_build/content/cvs.json');
const sourceRoot=path.resolve(path.dirname(sourceFile),'..'),output=path.join(root,'data/review-variants/cvs-physio');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const raw=fs.readFileSync(sourceFile),source=JSON.parse(raw);
const locked=JSON.parse(fs.readFileSync(path.join(root,'data/review-curriculum/source-locks.json'),'utf8')).volumes.find(volume=>volume.id==='cvs');
assert.equal(hash(raw),locked.authoringJson.sha256,'Authoring source must match the full-review source lock');
const ids=['cardiac-ap','conduction-phys','cycle','pv-loop','flow-laws','velocity-turbulence','measurement-special-circulations','arterial-pressure','venous-return','advanced-return-pressure','microexchange','local-regulation','neural-pressure','longterm-pressure','coronary-exercise','shock-failure','advanced-failure-shock','ecg-foundations','ecg-axis','ecg-patterns','advanced-excitation','rbc','erythropoiesis','wbc','platelets','coagulation','blood-groups'];
const assets=[];
const sections=ids.map(id=>{
  const original=source.sections.find(section=>section.id===id);assert(original,'Missing '+id);
  const section=structuredClone(original);
  section.sources=section.sources.map(({path:privatePath,...reference})=>reference);
  section.blocks=section.blocks.map(block=>{
    if(block.type!=='figure')return block;
    const {originalPath,sourcePdf,...figure}=block;
    const bytes=fs.readFileSync(path.join(sourceRoot,figure.path));
    assert.equal(hash(bytes),figure.sha256,'Frozen figure changed');
    const destination=path.join(output,figure.path);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);
    assets.push({path:figure.path,sha256:hash(bytes)});
    return figure;
  });
  return section;
});
for(const name of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf','DejaVuSans.ttf','DejaVuSans-Bold.ttf']){
  const relative='assets/fonts/'+name,bytes=fs.readFileSync(path.join(sourceRoot,relative));
  fs.mkdirSync(path.join(output,'assets/fonts'),{recursive:true});fs.writeFileSync(path.join(output,relative),bytes);assets.push({path:relative,sha256:hash(bytes)});
}
const content={id:'cvs-physio',title:'Cardiovascular Physiology',subtitle:'Cardiac function, circulation, ECG and blood physiology',updated:'8 October 2026',scope:'Physiology-only selection from the existing Cardiovascular System review. The 27 original physiology and blood sections are preserved with their figures, self-checks and source references. Anatomy, histology, embryology, mixed appendices and transcript attachments are excluded.',sections,sourceFiles:[],transcriptFiles:[],gaps:[]};
const provenance={schemaVersion:1,sourceVolumeId:'cvs',sourcePdfSha256:locked.sha256,authoringSha256:hash(raw),sectionIds:ids,assets};
for(const [name,data] of [['source.json',content],['provenance.json',provenance]]){
  const serialized=JSON.stringify(data,null,2)+'\n';assert(!/\/Users\/|\/home\/|file:\/\//.test(serialized),'Private source path leaked');fs.writeFileSync(path.join(output,name),serialized);
}
console.log(`Imported ${sections.length} physiology sections and ${assets.length} frozen assets.`);
