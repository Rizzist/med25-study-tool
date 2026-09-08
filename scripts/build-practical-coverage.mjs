import fs from 'node:fs';
import path from 'node:path';
import {upperLimbManifest} from '../src/lib/anatomy3d/manifests/upper-limb/upper-limb-real.manifest.mjs';
import {lowerLimbManifest} from '../src/lib/anatomy3d/manifests/lower-limb/lower-limb-real.manifest.mjs';
const root=path.resolve(import.meta.dirname,'..');
const audit=process.argv[2];if(!audit)throw new Error('Provide independently reviewed audit directory');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const images=[...read(path.join(root,'data/term2/anatomy-visual-images.json')).images,...read(path.join(root,'data/term2/anatomy-practical-images.json')).images];
const lower=read(path.join(audit,'lower/practical-checklist.json'));
const reviewed=read(path.join(audit,'lower/remaining-3d-versus-gallery-coverage.json'));
const upper=read(path.join(audit,'upper/practical-checklist.json'));
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const modules={};
for(const manifest of [upperLimbManifest,lowerLimbManifest]){
  const isLower=manifest.modelKey==='lower-limb';
  const seen=new Set();
  const candidates=isLower?lower.rows:upper.compartments.flatMap(group=>group.structures.map(row=>({...row,group:group.name,sourceRefs:(group.source.pdfPages??[]).map(pdfPage=>({pdfPage}))})));
  const rows=[];
  for(const row of candidates){
    if(seen.has(row.id))continue;seen.add(row.id);
    const structure=manifest.structures.find(item=>item.id===row.id);
    const residual=isLower?reviewed.rows.find(item=>item.id===row.id):undefined;
    const label=structure?.label??row.label??row.id.replace(/-muscle$/,'').replaceAll('-',' ');
    const exact=images.filter(image=>image.moduleKey===manifest.modelKey).flatMap(image=>image.regions.filter(region=>region.structureId===row.id||normalize(region.label)===normalize(label)).map(region=>({imageId:image.id,title:image.title,path:image.path,label:region.label})));
    const matches=[...exact,...(residual?.galleryMatches??[]).map(match=>({imageId:match.imageId,title:match.imageTitle,path:match.imagePath,label:match.label}))];
    const figures=[...new Map(matches.map(match=>[match.imageId,match])).values()];
    const status=structure?(structure.schematic?'3d-schematic':'3d-scan'):figures.length?'2d-callout':residual?.regionalContext.length?'regional-context':'book-reference';
    const sourceRefs=row.sourceRefs??[];
    rows.push({id:row.id,label,tissue:structure?.tissue??row.tissue??'muscle',group:row.group??'',status,landmarkOf:structure?.landmarkOf??null,figures,chapters:residual?.bookChapters??[...new Set(sourceRefs.map(ref=>ref.chapter).filter(Boolean))],pdfPages:[...new Set(sourceRefs.map(ref=>ref.pdfPage).filter(Boolean))],note:structure?.landmarkOf?'Surface marker only; learn the full extent from the source figure.':structure?.schematic?'Diagrammatic location/route, not a separately scanned anatomical surface.':residual?.note??''});
  }
  modules[manifest.modelKey]={scope:isLower?lower.scope:'Upper-limb muscle-compartment checklist. Humeral landmarks and carpals are additionally available in the atlas and source figures; this is not an institution-certified exam syllabus.',rows};
}
const destination=path.join(root,'data/term2/anatomy-practical-coverage.json');
fs.writeFileSync(destination,JSON.stringify({modules},null,2)+'\n');
fs.mkdirSync(path.join(root,'data/term2/provenance/practical-anatomy'),{recursive:true});
for(const relative of ['upper/practical-checklist.json','upper/joint-reference-proposals.json','upper/final-interaction-review.json','lower/practical-checklist.json','lower/remaining-3d-versus-gallery-coverage.json','lower/sesamoid-final-verification.json','lower/upper-independent-review.json','independent-verification.json','connective-review/independent-review.json','connective-review/runtime-checks.json','images/grading-eligibility.json','images/lower-bone-final/coordinate-qa.json','images/lower-bone-final/coverage-delta.json','images/lower-bone-final/duplicate-figure-audit.json','images/lower-connective-final/verification.json','images/lower-connective-final/coverage-mapping.json','images/lower-neuro-final/grading-eligibility.json']){
  const file=path.join(audit,relative);if(fs.existsSync(file))fs.copyFileSync(file,path.join(root,'data/term2/provenance/practical-anatomy',relative.replaceAll('/','-')));
}
console.log(Object.entries(modules).map(([key,value])=>`${key}: ${value.rows.length} audited checklist rows`).join('\n'));
