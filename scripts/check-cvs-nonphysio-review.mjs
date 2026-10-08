import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest=read(path.join(root,'public/study/reviews/cvs-nonphysio.json'));
const layoutFile=path.join(root,'data/review-variants/cvs-nonphysio/layout.json'),layout=read(layoutFile);
const course=read(path.join(root,'public/study/reviews/term2-cvs.json'));
const physioIds=new Set(read(path.join(root,'public/study/reviews/cvs-physio.json')).sections.map(section=>section.id));
assert.equal(manifest.schemaVersion,1);assert.equal(manifest.examId,'term2-cvs');assert.equal(manifest.scope,'non-physio');
assert.equal(manifest.layoutSha256,hash(layoutFile),'Layout changed; re-import the review');
assert.equal(manifest.volume.sha256,hash(path.join(root,'public/study/reviews/cvs-nonphysio.pdf')),'PDF changed; re-import the review');
assert.equal(manifest.volume.url,'/study/reviews/cvs-nonphysio.pdf?v='+manifest.volume.sha256);
assert.equal(manifest.volume.pageCount,layout.pageCount);
const pages=new Map(layout.sections.map(chapter=>['cvs/'+chapter.id,chapter.page]));
assert.equal(new Set(manifest.sections.map(section=>section.id)).size,manifest.sections.length,'Duplicate section');
for(const section of manifest.sections){
  const original=course.sections.find(item=>item.id===section.id);
  assert(original,'Unknown section '+section.id);assert.equal(section.title,original.title);
  assert(!physioIds.has(section.id),'Physiology section mapped to the non-physiology book');
  assert.equal(section.volumeId,'cvs-nonphysio');
  assert(Number.isInteger(section.pdfPage)&&section.pdfPage>=1&&section.pdfPage<=manifest.volume.pageCount);
  if(section.id!=='cvs/orientation')assert.equal(section.pdfPage,pages.get(section.id),'Page drifted for '+section.id);
}
assert(!/\/Users\/|\/home\/|file:\/\//.test(JSON.stringify(manifest)+JSON.stringify(layout)),'Private path in public/build metadata');
console.log(`CVS non-physiology review verified: ${manifest.sections.length} sections, ${manifest.volume.pageCount} pages.`);
