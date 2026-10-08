// Import the separately authored CVS non-physiology review (anatomy, histology, embryology).
// Its renderer lives with the authoring sources (MED SLIDES/.../_build/cvs-np/render.py) and writes
// the web-edition PDF plus a page layout measured from that PDF. This script copies both in and
// maps the course's canonical section IDs onto the new book's pages.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..'),[pdfFile,layoutFile]=process.argv.slice(2);
assert(pdfFile&&layoutFile,'Usage: node scripts/import-cvs-nonphysio-review.mjs /path/to/cvs-nonphysio.pdf /path/to/cvs-nonphysio.layout.json');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const pdf=fs.readFileSync(pdfFile),layoutRaw=fs.readFileSync(layoutFile),layout=JSON.parse(layoutRaw);
const course=read(path.join(root,'public/study/reviews/term2-cvs.json'));
const physioIds=new Set(read(path.join(root,'public/study/reviews/cvs-physio.json')).sections.map(section=>section.id));

// Book chapters reuse the canonical section IDs. Orientation maps to the book's overview page.
const OVERVIEW_PAGE=4;
const canonical=new Map(course.sections.map(section=>[section.id,section]));
const sections=[];
const orientation=canonical.get('cvs/orientation');
if(orientation)sections.push({...orientation,volumeId:'cvs-nonphysio',bookTitle:'At a glance',pdfPage:OVERVIEW_PAGE});
for(const chapter of layout.sections){
  const id='cvs/'+chapter.id,original=canonical.get(id);
  if(!original)continue; // Book-only chapters (e.g. conduction anatomy) have no mapped questions.
  assert(!physioIds.has(id),'Physiology section in the non-physiology book: '+id);
  assert(Number.isInteger(chapter.page),'Unlocated chapter '+id);
  sections.push({...original,volumeId:'cvs-nonphysio',bookTitle:chapter.title,pdfPage:chapter.page});
}
const sha=hash(pdf);
const manifest={
  schemaVersion:1,examId:'term2-cvs',scope:'non-physio',
  author:'Rizzist (Syed-Mohammad Raza)',
  layoutSha256:hash(layoutRaw),
  volume:{id:'cvs-nonphysio',title:'CVS Non-Physiology Review',url:'/study/reviews/cvs-nonphysio.pdf?v='+sha,sha256:sha,pageCount:layout.pageCount},
  sections,
};
const serialized=JSON.stringify(manifest,null,2)+'\n';
assert(!/\/Users\/|\/home\/|file:\/\//.test(serialized),'Private source path leaked');
const variant=path.join(root,'data/review-variants/cvs-nonphysio');
fs.mkdirSync(variant,{recursive:true});
fs.writeFileSync(path.join(variant,'layout.json'),layoutRaw);
fs.writeFileSync(path.join(root,'public/study/reviews/cvs-nonphysio.pdf'),pdf);
fs.writeFileSync(path.join(root,'public/study/reviews/cvs-nonphysio.json'),serialized);
console.log(`Imported CVS non-physiology review: ${layout.pageCount} pages, ${sections.length} mapped sections.`);
