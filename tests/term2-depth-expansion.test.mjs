import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=file=>JSON.parse(fs.readFileSync(new URL(file,root),'utf8'));
const lanes=['histology','embryology','anatomy','physio-biochem'];
const questions=lanes.flatMap(lane=>fs.readFileSync(new URL(`data/bank/questions/term2-depth-${lane}.jsonl`,root),'utf8').trim().split('\n').map(JSON.parse));
const manifest=read('data/term2/provenance/depth-expansion/manifest.json');

test('depth additions have independent review gates and stay out of genuine past papers',()=>{
  assert.equal(questions.length,manifest.questions);
  assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
  const approved=new Set();
  for(const lane of manifest.lanes){
    assert.equal(lane.gate.status,'approved');
    assert(lane.gate.independentReviewer);
    assert.equal(lane.gate.approvedQuestionIds.length,lane.questionCount);
    for(const name of ['questions.jsonl','concepts.json','modules.json','coverage.json'])assert.match(lane.gate.sha256[name],/^[a-f0-9]{64}$/);
    lane.gate.approvedQuestionIds.forEach(id=>approved.add(id));
    const ids=new Set(lane.gate.approvedQuestionIds);
    const rows=questions.filter(q=>ids.has(q.id));
    const counts=['A','B','C','D'].map(id=>rows.filter(q=>q.correctOptionId===id).length);
    assert(counts.every(count=>count>0&&count<rows.length/2),`${lane.lane}: avoid a dominant answer-letter shortcut`);
  }
  for(const q of questions){
    assert(approved.has(q.id),q.id);
    assert.equal(q.status,'verified');
    assert(q.qualityFlags.includes('independent-agent-source-review'));
    assert(q.tags.includes(q.difficulty>=4?'knowledge-challenge':'knowledge-core'));
    assert(!q.tags.some(tag=>/past|final|official-exam/.test(tag)));
    assert(q.source.page||q.source.slide);
    assert.equal(q.options.length,4);
    for(const o of q.options)assert(o.id===q.correctOptionId?q.explanation:q.distractorExplanations[o.id]);
  }
});

test('CVS histology and embryology gain substantial distinct written knowledge, not anatomy variants',()=>{
  const cvs=questions.filter(q=>q.tags.includes('exam-term2-cvs'));
  for(const subject of ['histology','embryology']){
    const rows=cvs.filter(q=>q.subject===subject);
    assert(rows.length>=60,subject);
    assert(rows.some(q=>q.difficulty<=3),`${subject}: core questions`);
    assert(rows.some(q=>q.difficulty>=4),`${subject}: challenge questions`);
    assert(rows.every(q=>!q.kind.startsWith('dynamic_anatomy')));
  }
  for(const exam of ['cvs','respiratory','limbs','biochemistry']){
    const catalog=read(`data/term2/${exam}-concepts.json`);
    const index=read(`data/term2/${exam}-question-index.json`);
    const mapped=new Set(catalog.concepts.flatMap(c=>c.objectives.flatMap(o=>o.questionIds)));
    const rows=questions.filter(q=>q.tags.includes(`exam-term2-${exam}`));
    assert(rows.length>0);
    for(const q of rows){assert(mapped.has(q.id),`${q.id}: no concept`);assert(index[q.id],`${q.id}: no index`);}
  }
});

test('reviewed histology images exist locally and match the import provenance',()=>{
  assert(manifest.assets.length>=6);
  for(const asset of manifest.assets){
    const bytes=fs.readFileSync(new URL(asset.path,root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
  }
  for(const q of questions)for(const media of q.media??[])assert(fs.existsSync(new URL(`public/study/${media.path}`,root)),q.id);
});
