import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'public/study/term1-telegram/catalog.json'),'utf8'));

test('every published source has intact bytes, provenance and a safe local download',()=>{
  const ids=new Set(),hashes=new Set();
  for(const paper of catalog.papers){
    assert(!ids.has(paper.id),`Duplicate id ${paper.id}`);ids.add(paper.id);
    assert.match(paper.url,/^\/study\/term1-telegram\/[a-z0-9-]+\.(pdf|docx)$/);
    const bytes=fs.readFileSync(path.join(root,'public',paper.url));
    assert.equal(bytes.length,paper.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),paper.sha256);
    assert(!hashes.has(paper.sha256),`Duplicate content ${paper.id}`);hashes.add(paper.sha256);
    assert.equal(paper.mode,'source-only');
    assert(['tissue','biochemistry'].includes(paper.course));
    assert(['course','supplement'].includes(paper.scope));
    assert(paper.note&&paper.source&&paper.sourceFiles.length);
    for(const file of paper.sourceFiles)assert.match(file.sha256,/^[a-f0-9]{64}$/);
    if(paper.format==='PDF'){assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert(paper.pages>0);}
  }
  assert.deepEqual(catalog,JSON.parse(fs.readFileSync(path.join(root,'data/term1-telegram/catalog.json'),'utf8')));
});

test('other-program papers are labelled supplements, not scored MD sittings',()=>{
  for(const id of ['bio-dds-t2','bio-dds-jul2023','bio-practical-dds2023','bio-pharmd-jan2024','tissue-dds-compilation']){
    assert.equal(catalog.papers.find(p=>p.id===id)?.scope,'supplement',id);
  }
  assert.equal(catalog.papers.find(p=>p.id==='tissue-jan2025').date,'2025-01-20');
  assert.equal(catalog.papers.find(p=>p.id==='tissue-tehran2026').date,null);
  assert(!catalog.papers.some(p=>p.sourceFiles.some(f=>f.name==='Biochemistry- f.pdf')));
});
