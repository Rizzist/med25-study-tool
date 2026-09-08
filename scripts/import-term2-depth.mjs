import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';

// Content is authored/reviewed outside the checkout; only this single-owner import
// writes the live catalogs. A review gate pins every source payload by digest.
const root=path.resolve(import.meta.dirname,'..');
const staging=process.argv[2];
if(!staging) throw new Error('Usage: node scripts/import-term2-depth.mjs /absolute/reviewed-staging-directory');
const lanes=['histology','embryology','anatomy','physio-biochem'];
const provenance=path.join(root,'data/term2/provenance/depth-expansion');
const exams=['cvs','respiratory','limbs','biochemistry'];
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const ajv=new Ajv2020({allErrors:true});
const validateQuestion=ajv.compile(read(path.join(root,'schemas/mcq-question.schema.json')));
const validateCatalog=ajv.compile(read(path.join(root,'schemas/term2-concepts.schema.json')));
const validateRespiratory=ajv.compile(read(path.join(root,'schemas/respiratory-concepts.schema.json')));
const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const stripped=value=>Object.fromEntries(Object.entries(value).filter(([key])=>key!=='examId'));
const catalogId=id=>id.startsWith('depth-')?id:`depth-${id}`;
const all={questions:[],concepts:[],modules:[],coverage:[]};
const manifests=[];
const assetCopies=[];
for(const lane of lanes){
  const directory=path.join(staging,lane);
  const gate=read(path.join(directory,'review-gate.json'));
  if(gate.status!=='approved' || !gate.independentReviewer) throw new Error(`${lane}: independent review gate missing`);
  for(const name of ['questions.jsonl','concepts.json','modules.json','coverage.json']) if(gate.sha256?.[name]!==digest(path.join(directory,name))) throw new Error(`${lane}: review gate stale for ${name}`);
  const questions=fs.readFileSync(path.join(directory,'questions.jsonl'),'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
  if(questions.some(q=>!gate.approvedQuestionIds.includes(q.id))) throw new Error(`${lane}: an unreviewed question cannot be imported`);
  for(const q of questions){
    if(!validateQuestion(q))throw new Error(`${lane}: invalid question ${q.id}: ${JSON.stringify(validateQuestion.errors)}`);
    if(!q.id.startsWith('depth-')||q.tags.some(t=>/(?:^|-)past(?:-|$)|final-bank|official-exam/.test(t))) throw new Error(`${lane}: namespace/assessment violation ${q.id}`);
    q.status='verified';
    // Difficulty was recalibrated by the reviewer; derive the UI bucket from
    // that final rating rather than retaining an earlier draft's bucket tag.
    q.tags=[...new Set([...q.tags.filter(tag=>!['knowledge-core','knowledge-challenge'].includes(tag)),q.difficulty>=4?'knowledge-challenge':'knowledge-core','source-grounded','study-practice','depth-expansion'])];
    q.qualityFlags=[...new Set(q.qualityFlags.filter(f=>!f.includes('pending')).concat('independent-agent-source-review','original-not-past-question'))];
  }
  const concepts=read(path.join(directory,'concepts.json'));
  const modules=read(path.join(directory,'modules.json'));
  const coverage=read(path.join(directory,'coverage.json'));
  if(![concepts,modules,coverage].every(Array.isArray)) throw new Error(`${lane}: expected flat arrays with examId on content rows`);
  for(const c of concepts){c.id=catalogId(c.id);c.moduleId=catalogId(c.moduleId);for(const objective of c.objectives)objective.id=catalogId(objective.id);}
  for(const m of modules)m.id=catalogId(m.id);
  for(const row of coverage)row.conceptIds=row.conceptIds.map(catalogId);
  for(const q of questions) for(const media of q.media??[]){
    if(path.isAbsolute(media.path)||media.path.split('/').includes('..'))throw new Error(`Unsafe media path: ${q.id}`);
    const destination=path.join(root,'public/study',media.path);
    const source=path.join(directory,'assets',path.basename(media.path));
    if(fs.existsSync(source))assetCopies.push({source,destination,sha256:digest(source)});
    else if(!fs.existsSync(destination))throw new Error(`Missing reviewed media: ${q.id} ${media.path}`);
  }
  all.questions.push(...questions);all.concepts.push(...concepts);all.modules.push(...modules);all.coverage.push(...coverage);
  manifests.push({lane,gate,questionCount:questions.length});
}
if(new Set(all.questions.map(q=>q.id)).size!==all.questions.length)throw new Error('Duplicate depth question IDs');
const catalogs=[];
for(const exam of exams){
  const examId=`term2-${exam}`;
  const file=path.join(root,`data/term2/${exam}-concepts.json`);
  const catalog=read(file);
  const chosen=all.concepts.filter(c=>c.examId===examId);
  const moduleIds=new Set(chosen.map(c=>c.moduleId));
  const concepts=chosen.map(c=>{
    const value=stripped(c);
    if(exam==='respiratory' && ['course','book-extension'].includes(value.scope)){
      const bases=new Set(value.sources.map(s=>s.basis));
      if(bases.size===1&&bases.has('book'))value.scope='book-only';
      else if(bases.size===1&&bases.has('slides'))value.scope='slide-only';
      else if(bases.has('book')&&bases.has('slides'))value.scope='book-and-slides';
      else value.scope=bases.has('book')?'book-and-course':'course-only';
    }
    return value;
  });
  const modules=all.modules.filter(m=>moduleIds.has(m.id)).map(({id,subject,title,description,order})=>({id,subject,title,description,order}));
  const conceptIds=new Set(chosen.map(c=>c.id));
  const coverage=all.coverage.filter(row=>row.examId===examId||row.conceptIds?.some(id=>conceptIds.has(id))).map(({source,locator,topic,conceptIds,status,note})=>({source,locator,topic,conceptIds,status:status==='mapped-depth-expansion'?'mapped':status,note:`Depth expansion · ${note}`}));
  // The depth namespace is reserved for this auditable expansion; unrelated data remains intact.
  catalog.modules=catalog.modules.filter(m=>!m.id.startsWith('depth-')).concat(modules);
  catalog.concepts=catalog.concepts.filter(c=>!c.id.startsWith('depth-')).concat(concepts);
  catalog.sourceAudit=catalog.sourceAudit.filter(row=>!row.note?.startsWith('Depth expansion · ')&&!row.conceptIds.some(id=>id.startsWith('depth-'))).concat(coverage);
  catalog.updatedAt='2026-09-07';
  const validate=exam==='respiratory'?validateRespiratory:validateCatalog;
  if(!validate(catalog))throw new Error(`${examId}: invalid combined catalog: ${JSON.stringify(validate.errors)}`);
  catalogs.push({file,catalog});
}
// Read/validate the full input first; no partial import on a missing review gate.
fs.mkdirSync(provenance,{recursive:true});
for(const lane of lanes){
  const ids=new Set(manifests.find(m=>m.lane===lane).gate.approvedQuestionIds);
  const questions=all.questions.filter(q=>ids.has(q.id));
  fs.writeFileSync(path.join(root,`data/bank/questions/term2-depth-${lane}.jsonl`),questions.map(q=>JSON.stringify(q)).join('\n')+'\n');
  fs.mkdirSync(path.join(provenance,lane),{recursive:true});
  for(const name of ['verification.json','review-gate.json','independent-review.json','review-resolution.json','coverage.json','coverage-details.json','SOURCE_GAPS.md']){
    const source=path.join(staging,lane,name);if(fs.existsSync(source))fs.copyFileSync(source,path.join(provenance,lane,name));
  }
}
for(const {source,destination} of assetCopies){fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(source,destination);}
for(const {file,catalog} of catalogs)fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
const manifest={date:'2026-09-07',lanes:manifests,questions:all.questions.length,normalization:'Reviewed payloads retain their pinned source digests. Import promotes approved status, adds review provenance, and derives core/challenge tags from final reviewed difficulty (1–3 core, 4–5 challenge); clinical wording and keyed answers are unchanged.',assets:[...new Map(assetCopies.map(asset=>[asset.destination,{path:path.relative(root,asset.destination),sha256:asset.sha256}])).values()],conceptIds:all.concepts.map(c=>c.id),moduleIds:all.modules.map(m=>m.id),interpretation:'Source-mapped original practice, with independent agent review. Not faculty-validated, not actual past examinations, and not a guarantee of complete exam coverage.'};
fs.writeFileSync(path.join(provenance,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Imported ${all.questions.length} independently reviewed original questions and ${all.concepts.length} concept/QA modules. Run build-embedded-bank next.`);
