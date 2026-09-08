import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';

// Single-owner import: independent review signs the staged clinical payloads.
// Re-running replaces only this expansion, never previous courses or past papers.
const root = path.resolve(import.meta.dirname, '..');
const staging = process.argv[2];
if (!staging || !path.isAbsolute(staging)) throw new Error('Pass an absolute reviewed staging directory.');
const lanes = ['back-cvs', 'respiratory', 'limbs', 'cvs-foundations'];
const prefix = 'comp-';
const provenance = path.join(root, 'data/term2/provenance/comprehensive-expansion');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const ajv = new Ajv2020({ allErrors: true });
const questionSchema = ajv.compile(read(path.join(root, 'schemas/mcq-question.schema.json')));
const catalogSchemas = Object.fromEntries(['term2', 'respiratory'].map(name => [name, ajv.compile(read(path.join(root, `schemas/${name}-concepts.schema.json`)))]));
const all = { questions: [], concepts: [], modules: [], coverage: [] };
const reviewed = [];
const assets = new Map();
for (const lane of lanes) {
  const directory = path.join(staging, lane);
  const gate = read(path.join(directory, 'review-gate.json'));
  if (gate.status !== 'approved' || !gate.independentReviewer || gate.independentReviewer === gate.author) throw new Error(`${lane}: independent review is required.`);
  for (const name of ['questions.jsonl', 'concepts.json', 'modules.json', 'coverage.json', 'source-audit.json']) {
    if (gate.sha256?.[name] !== hash(path.join(directory, name))) throw new Error(`${lane}: missing or stale review digest for ${name}`);
  }
  const questions = fs.readFileSync(path.join(directory, 'questions.jsonl'), 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const approved = new Set(gate.approvedQuestionIds);
  if (questions.length !== approved.size || questions.some(q => !approved.has(q.id))) throw new Error(`${lane}: approved question inventory mismatch.`);
  for (const q of questions) {
    if (!questionSchema(q)) throw new Error(`${q.id}: ${JSON.stringify(questionSchema.errors)}`);
    if (!q.id.startsWith(prefix) || q.tags.some(t => /(?:^|-)past(?:-|$)|final-bank|official-exam/.test(t))) throw new Error(`${q.id}: invalid practice namespace.`);
    if (!q.source.page && !q.source.slide) throw new Error(`${q.id}: missing source locator.`);
    q.status = 'verified';
    q.tags = [...new Set([...q.tags.filter(t => !['knowledge-core', 'knowledge-challenge'].includes(t)), q.difficulty >= 4 ? 'knowledge-challenge' : 'knowledge-core', 'source-grounded', 'study-practice', 'comprehensive-expansion'])];
    q.qualityFlags = [...new Set(q.qualityFlags.filter(f => !f.includes('pending')).concat('independent-agent-source-review', 'original-not-past-question'))];
    for (const media of q.media ?? []) {
      if (path.isAbsolute(media.path) || media.path.split('/').includes('..')) throw new Error(`${q.id}: unsafe media path.`);
      const destination = path.join(root, 'public/study', media.path);
      const source = path.join(directory, 'assets', path.basename(media.path));
      if (!fs.existsSync(source) && !fs.existsSync(destination)) throw new Error(`${q.id}: missing image ${media.path}`);
      if (fs.existsSync(source)) {
        const digest = hash(source);
        if (gate.assetSha256?.[path.basename(media.path)] !== digest) throw new Error(`${q.id}: unreviewed image.`);
        if (assets.has(destination) && assets.get(destination).sha256 !== digest) throw new Error(`Conflicting image ${media.path}`);
        assets.set(destination, { source, destination, sha256: digest });
      }
    }
  }
  const concepts = read(path.join(directory, 'concepts.json'));
  const modules = read(path.join(directory, 'modules.json'));
  const coverage = read(path.join(directory, 'coverage.json'));
  const sourceAudit = read(path.join(directory, 'source-audit.json'));
  if (![concepts, modules, coverage, sourceAudit].every(Array.isArray)) throw new Error(`${lane}: expected flat arrays.`);
  const ids = new Set(questions.map(q => q.id));
  const linked = new Set();
  for (const c of concepts) {
    if (!c.id.startsWith(prefix) || !c.moduleId.startsWith(prefix)) throw new Error(`${c.id}: namespace violation.`);
    for (const o of c.objectives) for (const id of o.questionIds) {
      if (!ids.has(id)) throw new Error(`${c.id}: question reference outside this reviewed lane: ${id}`);
      linked.add(id);
    }
  }
  if (questions.some(q => !linked.has(q.id))) throw new Error(`${lane}: a question is missing its theory-map objective.`);
  all.questions.push(...questions); all.concepts.push(...concepts); all.modules.push(...modules); all.coverage.push(...coverage);
  reviewed.push({ lane, gate, sourceAudit, questionCount: questions.length });
}
for (const key of ['questions', 'concepts', 'modules']) {
  if (new Set(all[key].map(row => row.id)).size !== all[key].length) throw new Error(`Duplicate ${key} IDs.`);
}
const catalogs = [];
const reconciliations = [];
const previousManifest = path.join(provenance, 'manifest.json');
const previousReconciliations = fs.existsSync(previousManifest) ? read(previousManifest).reconciliations ?? [] : [];
for (const exam of ['cvs', 'respiratory', 'limbs']) {
  const file = path.join(root, `data/term2/${exam}-concepts.json`);
  const catalog = read(file);
  const previousLymphaticGap = catalog.sourceAudit.find(r => r.topic === 'Lymphatic system' && r.note?.startsWith('Depth expansion · '));
  const concepts = all.concepts.filter(c => c.examId === `term2-${exam}`).map(c => {
    const value = { ...c };
    delete value.examId;
    if (exam === 'respiratory' && ['course', 'book-extension'].includes(value.scope)) {
      const bases = new Set(value.sources.map(s => s.basis));
      value.scope = bases.size === 1 && bases.has('book') ? 'book-only' : bases.size === 1 && bases.has('slides') ? 'slide-only' : bases.has('book') && bases.has('slides') ? 'book-and-slides' : bases.has('book') ? 'book-and-course' : 'course-only';
    }
    return value;
  });
  const moduleIds = new Set(concepts.map(c => c.moduleId));
  const conceptIds = new Set(concepts.map(c => c.id));
  const modules = all.modules.filter(m => moduleIds.has(m.id)).map(({ id, subject, title, description, order }) => ({ id, subject, title, description, order }));
  if (modules.length !== moduleIds.size) throw new Error(`${exam}: unresolved module.`);
  const coverage = all.coverage.filter(r => r.examId === `term2-${exam}`).map(({ source, locator, topic, conceptIds: links, status, note }) => {
    if (links.some(id => !conceptIds.has(id))) throw new Error(`${exam}: invalid coverage reference.`);
    return { source, locator, topic, conceptIds: links, status, note: `Comprehensive expansion · ${note}` };
  });
  catalog.modules = catalog.modules.filter(m => !m.id.startsWith(prefix)).concat(modules);
  catalog.concepts = catalog.concepts.filter(c => !c.id.startsWith(prefix)).concat(concepts);
  catalog.sourceAudit = catalog.sourceAudit.filter(r => !r.note?.startsWith('Comprehensive expansion · ') && !r.conceptIds.some(id => id.startsWith(prefix))).concat(coverage);
  if (exam === 'cvs' && conceptIds.has('comp-cvs-lymphatic-development') && all.questions.some(q => q.id === 'comp-cvs-emb-005')) {
    // Resolve an explicit earlier gap without implying that missing lectures
    // or other genuinely unsampled source material have become available.
    const prior = previousReconciliations.find(r => r.examId === 'term2-cvs' && r.topic === 'Lymphatic system')?.previous ?? previousLymphaticGap;
    if (prior) {
      reconciliations.push({ examId: 'term2-cvs', topic: prior.topic, previous: { ...prior }, resolvedBy: 'comp-cvs-lymphatic-development' });
      catalog.sourceAudit = catalog.sourceAudit.filter(r => !(r.topic === prior.topic && r.source === prior.source));
      catalog.sourceAudit.push({ ...prior, status: 'mapped', conceptIds: ['comp-cvs-lymphatic-development'], note: 'Comprehensive expansion · Previously under-sampled primary lymph-sac relationships, composite thoracic/right lymphatic duct remodeling, and PROX1–VEGFR3–VEGFC specification now have five linked book-based questions. This resolves that specific sampling gap, not confirmation of lecture weighting.' });
    }
  }
  catalog.updatedAt = '2026-09-08';
  if (exam === 'cvs') {
    catalog.title = 'Term 2 Cardiovascular, Back and Spinal Concept Curriculum';
    catalog.scopeNote = 'Course-supported cardiovascular material is retained alongside independently agent-reviewed book extensions in anatomy, physiology, histology and embryology. Back and spinal anatomy are grouped into CVS at the user’s request and cited primarily to Gray’s Student Chapter 2; this is not evidence of lecturer assignment. New questions sample source-grounded objectives and are not a guarantee of every textbook fact or the actual exam. Missing source material remains visible in the coverage audit. Genuine past papers are separate.';
  }
  if (exam === 'limbs') {
    catalog.title = 'Upper and lower limbs — anatomy and related sciences';
    catalog.scopeNote = 'Both limbs are in scope per the user’s exam confirmation. Existing anatomy follows the local Gray’s Student checklist and available upper-limb transcripts. New regional detail is checked against cited Gray’s 42nd-edition pages, with related limb development, histology and muscle physiology from Langman, Junqueira and Guyton. Missing lower-limb/later-hand teacher material and unconfirmed related-science lecture detail remain book extensions. Source links sample objectives, not every paragraph or official exam weighting; genuine past papers remain separate.';
  }
  const validate = catalogSchemas[exam === 'respiratory' ? 'respiratory' : 'term2'];
  if (!validate(catalog)) throw new Error(`${exam}: ${JSON.stringify(validate.errors)}`);
  catalogs.push({ file, catalog });
}
// All validation completes before any live data changes.
fs.mkdirSync(provenance, { recursive: true });
for (const { lane, gate } of reviewed) {
  const ids = new Set(gate.approvedQuestionIds);
  fs.writeFileSync(path.join(root, `data/bank/questions/term2-comprehensive-${lane}.jsonl`), all.questions.filter(q => ids.has(q.id)).map(q => JSON.stringify(q)).join('\n') + '\n');
  fs.mkdirSync(path.join(provenance, lane), { recursive: true });
  // Preserve the exact signed payloads so the independent review is reproducible
  // after import adds publication-only status and practice tags.
  fs.mkdirSync(path.join(provenance, lane, 'reviewed'), { recursive: true });
  for (const name of ['questions.jsonl', 'concepts.json', 'modules.json', 'coverage.json', 'source-audit.json']) {
    fs.copyFileSync(path.join(staging, lane, name), path.join(provenance, lane, 'reviewed', name));
  }
  for (const name of ['review-gate.json', 'independent-review.json', 'review-resolution.json', 'source-audit.json', 'coverage.json', 'SOURCE_GAPS.md']) {
    const source = path.join(staging, lane, name);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(provenance, lane, name));
  }
}
for (const { source, destination } of assets.values()) { fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.copyFileSync(source, destination); }
for (const { file, catalog } of catalogs) fs.writeFileSync(file, JSON.stringify(catalog, null, 2) + '\n');
const manifest = {
  date: '2026-09-08', questions: all.questions.length, conceptIds: all.concepts.map(c => c.id), moduleIds: all.modules.map(m => m.id),
  byExam: ['cvs', 'respiratory', 'limbs'].map(name => {
    const examId = `term2-${name}`;
    const questions = all.questions.filter(q => q.tags.includes(`exam-${examId}`));
    return { examId, questions: questions.length, core: questions.filter(q => q.difficulty <= 3).length, challenge: questions.filter(q => q.difficulty >= 4).length,
      bySubject: Object.fromEntries(['anatomy', 'physiology', 'embryology', 'histology'].map(subject => [subject, questions.filter(q => q.subject === subject).length])),
      concepts: all.concepts.filter(c => c.examId === examId).length,
      imageQuestions: questions.filter(q => q.media?.length).length };
  }),
  lanes: reviewed, reconciliations, assets: [...assets.values()].map(({ destination, sha256 }) => ({ path: path.relative(root, destination), sha256 })),
  interpretation: 'Original book/slide-mapped practice, independently agent-reviewed. Book extensions are not confirmation of faculty exam scope. Not actual past papers; not a guarantee of exhaustive exam coverage.',
};
fs.writeFileSync(path.join(provenance, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Imported ${all.questions.length} reviewed questions / ${all.concepts.length} concepts. Run build-embedded-bank next.`);
