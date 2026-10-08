import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CVS_PHYSIO_REVIEW,CVS_NONPHYSIO_REVIEW,nonPhysioReviewLink,reviewVolumes,reviewSections,reviewSectionUrl,reviewPracticeBySection} from '../src/lib/mcq/cvs-review-scope.mjs';
import {reviewBreakdown} from '../src/lib/mcq/review-results.mjs';
const course=JSON.parse(fs.readFileSync(new URL('../public/study/reviews/term2-cvs.json',import.meta.url),'utf8'));

test('Default and All preserve the original course volumes, sections and exact PDF page URLs',()=>{
  for(const scope of [undefined,'all']){
    assert.equal(reviewVolumes(course,scope),course.volumes);assert.equal(reviewSections(course,scope),course.sections);
    for(const section of course.sections)assert.equal(reviewSectionUrl(course,section.id,scope),course.volumes.find(volume=>volume.id===section.volumeId).url+'#page='+section.pdfPage);
  }
});
test('Physiology links use only the new hashed 27-section PDF and regenerated page map',()=>{
  assert.equal(reviewVolumes(course,'physio').length,1);
  assert.equal(reviewSections(course,'physio').length,27);
  assert.equal(reviewSections(course,'physio').at(-1).id,'cvs/blood-groups');
  assert.equal(reviewSections(course,'physio').some(section=>section.id==='cvs/immune-foundations'),false);
  for(const section of reviewSections(course,'physio'))assert.equal(reviewSectionUrl(course,section.id,'physio'),CVS_PHYSIO_REVIEW.volume.url+'#page='+section.pdfPage);
  assert.equal(reviewSectionUrl(course,'cvs/heart-histo','physio'),undefined);
  assert.equal(reviewSectionUrl(course,'cvs/pericardium','physio'),undefined);
});
test('Non-Physio links only to its own hashed book, in book order, at its measured pages',()=>{
  assert.deepEqual(reviewVolumes(course,'non-physio'),[CVS_NONPHYSIO_REVIEW.volume]);
  assert.match(CVS_NONPHYSIO_REVIEW.volume.url,/^\/study\/reviews\/cvs-nonphysio\.pdf\?v=[0-9a-f]{64}$/);
  const sections=reviewSections(course,'non-physio');
  assert.deepEqual(sections.slice(0,CVS_NONPHYSIO_REVIEW.sections.length).map(section=>section.id),CVS_NONPHYSIO_REVIEW.sections.map(section=>section.id));
  for(const section of CVS_NONPHYSIO_REVIEW.sections)assert.equal(reviewSectionUrl(course,section.id,'non-physio'),CVS_NONPHYSIO_REVIEW.volume.url+'#page='+section.pdfPage);
  assert.equal(reviewSectionUrl(course,'cvs/cycle','non-physio'),undefined);
  assert.equal(reviewSectionUrl(course,'cvs/correction-ledger','non-physio'),undefined);
  assert.ok(!sections.some(section=>section.id==='cvs/cycle'));
  assert.ok(sections.some(section=>section.id==='cvs/correction-ledger'));
  for(const section of CVS_NONPHYSIO_REVIEW.sections)assert.ok(!reviewSections(course,'physio').some(item=>item.id===section.id&&reviewSectionUrl(course,item.id,'physio')));
  const [id,mapping]=Object.entries(course.questions).find(([,mapping])=>mapping.sectionId==='cvs/heart-histo');
  assert.equal(reviewBreakdown([{questionId:id,answered:true,correct:false}],course)[0].title,course.sections.find(section=>section.id===mapping.sectionId).title);
});
test('Past-paper topics resolve to book pages; physiology topics do not',()=>{
  const link=nonPhysioReviewLink('pericardium');
  assert.equal(link.url,CVS_NONPHYSIO_REVIEW.volume.url+'#page='+link.page);
  assert.equal(nonPhysioReviewLink('cycle'),undefined);
  assert.equal(nonPhysioReviewLink(undefined),undefined);
  const topics=JSON.parse(fs.readFileSync(new URL('../public/study/cvs-past-papers/topic-map.json',import.meta.url),'utf8')).topics;
  for(const topic of topics)if(topic.subjectId!=='physiology'&&topic.subjectId!=='blood-immune'&&topic.id!=='unclassified')assert.ok(nonPhysioReviewLink(topic.id),topic.id);
});
test('Allowed IDs restrict every practice choice, including an explicit empty scope',()=>{
  const ids=Object.entries(course.questions).filter(([,mapping])=>mapping.livePractice).slice(0,3).map(([id])=>id);
  assert.deepEqual([...reviewPracticeBySection(course,ids).values()].flatMap(row=>row.ids).sort(),ids.sort());
  assert.equal(reviewPracticeBySection(course,[]).size,0);
  assert.equal([...reviewPracticeBySection(course).values()].flatMap(row=>row.ids).length,Object.values(course.questions).filter(mapping=>mapping.livePractice).length);
});
test('A cross-discipline mapping retains its permitted practice label but cannot leak a full-PDF link',()=>{
  const id='depth-cvs-phys-017';assert.equal(course.questions[id].sectionId,'cvs/pericardium');
  assert.ok(reviewSections(course,'physio',[id]).some(section=>section.id==='cvs/pericardium'));
  assert.deepEqual(reviewPracticeBySection(course,[id]).get('cvs/pericardium').ids,[id]);
  assert.equal(reviewSectionUrl(course,'cvs/pericardium','physio'),undefined);
});
test('Every live practice question remains reachable exactly once in its scoped topic list',()=>{
  const questions=JSON.parse(fs.readFileSync(new URL('../data/mcq-runtime/term2-cvs.json',import.meta.url),'utf8'));
  for(const [scope,count] of [['physio',135],['non-physio',794]]){
    const allowed=questions.filter(q=>scope==='physio'?q.subject==='physiology':q.subject!=='physiology').map(q=>q.id);
    const sections=reviewSections(course,scope,allowed),grouped=reviewPracticeBySection(course,allowed);
    const reachable=sections.flatMap(section=>grouped.get(section.id)?.ids??[]);
    assert.equal(reachable.length,count);
    assert.equal(new Set(reachable).size,count);
    assert.deepEqual([...reachable].sort(),[...allowed].sort());
    assert.equal(sections.filter(section=>reviewSectionUrl(course,section.id,scope)).length,scope==='physio'?27:CVS_NONPHYSIO_REVIEW.sections.length);
  }
});
test('CVS scope flags do not change other courses',()=>{
  const other={...course,examId:'term2-limbs'};
  for(const scope of ['physio','non-physio']){
    assert.equal(reviewVolumes(other,scope),other.volumes);assert.equal(reviewSections(other,scope),other.sections);
    assert.equal(reviewSectionUrl(other,other.sections[0].id,scope),reviewSectionUrl(other,other.sections[0].id));
  }
});
test('Frozen physiology source, assets, PDF hash and section mapping pass the independent build check',()=>{
  execFileSync(process.execPath,['scripts/check-cvs-physio-review.mjs'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
});
test('Non-physiology book hash, layout and page map pass the independent build check',()=>{
  execFileSync(process.execPath,['scripts/check-cvs-nonphysio-review.mjs'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
});
