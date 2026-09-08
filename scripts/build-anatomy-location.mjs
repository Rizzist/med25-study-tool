import fs from 'node:fs';
import path from 'node:path';
import { buildLocationQuestions } from '../src/lib/mcq/anatomy-location.mjs';
const root = path.resolve(import.meta.dirname,'..');
const filename = 'term2-anatomy-location.jsonl';
const directory = path.join(root,'data/bank/questions');
const original = fs.readdirSync(directory).filter(n => n.endsWith('.jsonl') && n !== filename).sort().flatMap(n => fs.readFileSync(path.join(directory,n),'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse));
const questions = buildLocationQuestions(original);
const output = questions.map(q=>JSON.stringify(q)).join('\n')+'\n';
function save(file, value) {
  if(process.argv.includes('--check')) { if(!fs.existsSync(file) || fs.readFileSync(file,'utf8')!==value) throw new Error(`Stale anatomy location output: ${file}`); }
  else fs.writeFileSync(file,value);
}
save(path.join(directory,filename),output);
for(const exam of ['cvs','respiratory','limbs']) {
  const file=path.join(root,`data/term2/${exam}-concepts.json`);
  const catalog=JSON.parse(fs.readFileSync(file,'utf8'));
  const selected=questions.filter(q=>q.tags.includes(`exam-term2-${exam}`));
  const byId=new Map(original.map(q=>[q.id,q]));
  for(const concept of catalog.concepts) for(const objective of concept.objectives){
    objective.questionIds=objective.questionIds.filter(id=>!id.startsWith('locate-'));
    const targets=new Set(objective.questionIds.flatMap(id=>{ const q=byId.get(id); return q?.anatomy?[`${q.anatomy.imageId}:${q.anatomy.targetRegionId}`]:[]; }));
    objective.questionIds.push(...selected.filter(q=>targets.has(`${q.anatomy.imageId}:${q.anatomy.targetRegionId}`)).map(q=>q.id));
  }
  save(file,JSON.stringify(catalog,null,2)+'\n');
}
console.log(`Two-way anatomy: ${questions.length} name-to-location questions; separate IDs and saved scores from identification variants.`);
