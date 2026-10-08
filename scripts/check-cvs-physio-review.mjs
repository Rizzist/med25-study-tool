import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),data=path.join(root,'data/review-variants/cvs-physio');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest=read(path.join(root,'public/study/reviews/cvs-physio.json')),provenance=read(path.join(data,'provenance.json')),source=read(path.join(data,'source.json'));
const canonical=read(path.join(root,'data/review-curriculum/courses/term2-cvs.json'));
const lock=read(path.join(root,'data/review-curriculum/source-locks.json')).volumes.find(volume=>volume.id==='cvs');
assert.equal(manifest.schemaVersion,1);assert.equal(manifest.examId,'term2-cvs');assert.equal(manifest.scope,'physio');
assert.equal(manifest.sourcePdfSha256,lock.sha256);assert.equal(hash(path.join(root,'public/study/reviews/cvs.pdf')),lock.sha256,'Full review changed');
assert.equal(manifest.authoringSha256,lock.authoringJson.sha256);assert.equal(provenance.authoringSha256,manifest.authoringSha256);
assert.equal(manifest.contentSha256,hash(path.join(data,'source.json')),'Variant source changed; rebuild its PDF');
assert.equal(manifest.rendererSha256,hash(path.join(root,'scripts/review-variants/render_review.py')),'Renderer changed; rebuild the variant');
assert.equal(manifest.volume.sha256,hash(path.join(root,'public/study/reviews/cvs-physio.pdf')),'Derived PDF changed');
assert.equal(manifest.volume.url,'/study/reviews/cvs-physio.pdf?v='+manifest.volume.sha256);
assert.equal(source.sections.length,27);assert.deepEqual(source.sections.map(section=>section.id),provenance.sectionIds);
assert.deepEqual(manifest.sections.map(section=>section.id),provenance.sectionIds.map(id=>'cvs/'+id));
assert.equal(new Set(manifest.sections.map(section=>section.id)).size,27);
for(const section of manifest.sections){
  const original=canonical.sections.find(item=>item.id===section.id);
  assert(original);assert.equal(section.title,original.title);assert.equal(section.volumeId,'cvs-physio');
  assert(Number.isInteger(section.pdfPage)&&section.pdfPage>=1&&section.pdfPage<=manifest.volume.pageCount);
}
for(const asset of provenance.assets)assert.equal(hash(path.join(data,asset.path)),asset.sha256,asset.path);
for(const value of [manifest,source,provenance])assert(!/\/Users\/|\/home\/|file:\/\//.test(JSON.stringify(value)),'Private path in public/build metadata');
console.log(`CVS physiology review verified: ${manifest.sections.length} sections, ${manifest.volume.pageCount} pages; full review unchanged.`);
