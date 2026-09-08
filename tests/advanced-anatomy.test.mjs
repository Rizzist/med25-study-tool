import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {anatomyPracticeExclusion,includeAdvancedAnatomyPractice,isFoundationTarget} from '../src/lib/mcq/advanced-anatomy.mjs';
import {listAnatomyModules} from '../src/lib/anatomy3d/registry.ts';
import {buildAnatomyQuiz} from '../src/lib/anatomy3d/quiz.mjs';
import {buildModelLocationQuestions} from '../src/lib/mcq/anatomy-location.mjs';

const bank=JSON.parse(readFileSync(new URL('../data/bank/embedded-bank.json',import.meta.url)));
const retirements=JSON.parse(readFileSync(new URL('../data/term2/anatomy-practice-retirements.json',import.meta.url))).questions;
test('audited elementary practice is retired without discarding clinical anatomy or any genuine past exam',()=>{
  assert.equal(Object.keys(retirements).length,354);
  for(const [exam,count] of [['cvs',218],['respiratory',49],['limbs',87]]){
    assert.equal(bank.questions.filter(q=>q.tags.includes(`exam-term2-${exam}`)&&anatomyPracticeExclusion(q)).length,count);
  }
  for(const q of bank.questions)assert.equal(retirements[q.id],anatomyPracticeExclusion(q));
  for(const id of ['cvs-anat-003','cvs-anat-gap-015','cvs-anat-022','cvs-anat-023','depth-cvs-anat-017','depth-cvs-anat-018','depth-cvs-anat-020','depth-resp-anat-004','depth-limbs-anat-006','limb-ul-009','limb-ul-039']){
    const q=bank.questions.find(q=>q.id===id);assert(q,id);assert(includeAdvancedAnatomyPractice(q),id);
  }
  assert.equal(Object.values(bank.finalExams).flat().length,518);
  assert(Object.values(bank.finalExams).flat().every(q=>includeAdvancedAnatomyPractice(q)));
  assert(bank.questions.filter(q=>q.subject!=='anatomy').every(q=>includeAdvancedAnatomyPractice(q)));
});

test('fine anatomy and named nerves remain eligible; only exact coarse recognition targets are excluded',()=>{
  for(const label of ['Trachea','Ascending aorta','Superior vena cava','Left ventricle','Right lung','Humerus'])assert(isFoundationTarget(label),label);
  for(const label of ['Internal laryngeal nerve','Radial nerve','Femoral artery','Long head of biceps brachii','Tricuspid valve','Coronary sinus','Transverse pericardial sinus','Thyroid cartilage','Sternal angle','Right anterior basal bronchus (B8)','Left inferior pulmonary vein','Valve of inferior vena cava'])assert(!isFoundationTarget(label),label);
  const manifests=listAnatomyModules().map(m=>m.manifest);
  const modelQuestions=manifests.flatMap(m=>buildAnatomyQuiz(m,{seed:'advanced'}).map(q=>({...q,tags:['anatomy-visual-atlas'],subject:'anatomy',anatomy3d:{modelKey:m.modelKey,structureId:q.structureId}})));
  const locate=buildModelLocationQuestions(modelQuestions,manifests);
  assert.equal(modelQuestions.length,477);assert.equal(locate.length,477);
  assert(modelQuestions.every(q=>q.kind==='identify'));
  assert(locate.every(q=>includeAdvancedAnatomyPractice(q)));
  assert.equal(manifests.reduce((sum,m)=>sum+m.structures.filter(s=>s.quizable!==false).length,0),529,'All anatomical context is still present');
});

async function route(path,body){
  const {default:worker}=await import(new URL('../dist/server/index.js',import.meta.url));
  return worker.fetch(new Request('http://localhost'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:undefined),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
}

test('practice query, sprint, by-ID repair and resume exclude easy items; history and media remain accessible',async()=>{
  for(const exam of ['term2-cvs','term2-respiratory','term2-limbs']){
    const easy=bank.questions.find(q=>q.tags.includes(`exam-${exam}`)&&retirements[q.id]&&q.media);
    const advanced=bank.questions.find(q=>q.tags.includes(`exam-${exam}`)&&!retirements[q.id]);
    const body={exam,ids:[easy.id,advanced.id],limit:2,preserveOrder:true};
    const live=await(await route('/api/questions/by-ids',body)).json();
    assert.deepEqual(live.questions.map(q=>q.id),[advanced.id]);
    const history=await(await route('/api/questions/by-ids',{...body,purpose:'history'})).json();
    assert.deepEqual(history.questions.map(q=>q.id),body.ids);
    const sprint=await(await route('/api/questions/sprint',{exam,collection:'anatomy',limit:250,repairIds:[easy.id]})).json();
    assert(sprint.questions.every(q=>!retirements[q.id]));
    const query=await(await route(`/api/questions?exam=${exam}&collection=anatomy&limit=250`)).json();
    assert(query.questions.every(q=>!retirements[q.id]));
  }
  const summary=await(await route('/api/bank/summary')).json();
  for(const [id,count] of [['term2-cvs',750],['term2-respiratory',868],['term2-limbs',1154]]) {
    const added = bank.questions.filter(q => q.tags.includes(`exam-${id}`) && q.tags.includes('comprehensive-expansion') && q.status === 'verified' && !retirements[q.id]);
    assert.equal(summary.exams.find(e=>e.id===id).questionCount,count + added.length);
  }
});
