import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import { auditTerm2ConceptCatalog } from '../src/lib/term2/concept-audit.mjs';

// The Site owner imports only independently reviewed research bundles.
// Re-running replaces this expansion, not earlier questions or past papers.
const root = path.resolve(import.meta.dirname, '..');
const staging = process.argv[2];
if (!staging || !path.isAbsolute(staging)) throw new Error('Supply an absolute reviewed staging directory.');
const prefix = 'limb-audit-';
const lanes = { embryology: 'emb', histology: 'hist', physiology: 'phys' };
const payloads = ['questions.jsonl', 'modules.json', 'concepts.json', 'source-audit.json', 'coverage.json'];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const lines = file => fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const ajv = new Ajv2020({ allErrors: true });
const validateQuestion = ajv.compile(read(path.join(root, 'schemas/mcq-question.schema.json')));
const validateCatalog = ajv.compile(read(path.join(root, 'schemas/term2-concepts.schema.json')));
const provenance = path.join(root, 'data/term2/provenance/limb-science-audit');
const fileName = 'term2-limbs-science-audit.jsonl';
const bankDir = path.join(root, 'data/bank/questions');
const previousQuestions = fs.readdirSync(bankDir).filter(f => f.endsWith('.jsonl') && f !== fileName).sort().flatMap(f => lines(path.join(bankDir, f)));
const existingLimb = previousQuestions.filter(q => q.tags?.includes('exam-term2-limbs'));
const newQuestions = [], newModules = [], newConcepts = [], newSources = [], reviewed = [], media = [];

for (const [subject, short] of Object.entries(lanes)) {
  const directory = path.join(staging, subject);
  const gate = read(path.join(directory, 'review-gate.json'));
  if (gate.status !== 'approved' || !gate.author || !gate.independentReviewer || gate.author === gate.independentReviewer) throw new Error(`${subject}: independent approval required`);
  for (const file of payloads) if (gate.sha256?.[file] !== digest(path.join(directory, file))) throw new Error(`${subject}: stale or absent review digest: ${file}`);
  const questions = lines(path.join(directory, 'questions.jsonl'));
  const approved = new Set(gate.approvedQuestionIds);
  if (approved.size !== questions.length || questions.some(q => !approved.has(q.id))) throw new Error(`${subject}: approved inventory mismatch`);
  for (const q of questions) {
    if (!q.id.startsWith(`${prefix}${short}-`) || q.subject !== subject || !['single_best_answer', 'image_single_best_answer'].includes(q.kind)) throw new Error(`${q.id}: incorrect subject/namespace/kind`);
    if (!q.source?.page && !q.source?.slide) throw new Error(`${q.id}: missing source locator`);
    if (q.tags.some(t => /past|final|official-exam/.test(t))) throw new Error(`${q.id}: assessment boundary violation`);
    if (['course', 'book-extension'].filter(t => q.tags.includes(t)).length !== 1) throw new Error(`${q.id}: one explicit source scope required`);
    const rationale = option => option.id === q.correctOptionId ? q.explanation : q.distractorExplanations?.[option.id];
    if (q.options.length !== 4 || q.options.some(o => typeof rationale(o) !== 'string' || rationale(o).length < 20)) throw new Error(`${q.id}: four teaching rationales required`);
    q.status = 'verified';
    q.tags = [...new Set(q.tags.filter(t => !['knowledge-core', 'knowledge-challenge'].includes(t)).concat('exam-term2-limbs', 'term-2', 'study-practice', 'limb-science-audit', q.difficulty >= 4 ? 'knowledge-challenge' : 'knowledge-core'))];
    q.qualityFlags = [...new Set((q.qualityFlags ?? []).filter(f => !/pending|draft/.test(f)).concat('independent-agent-source-review', 'original-not-past-question'))];
    if (!validateQuestion(q)) throw new Error(`${q.id}: ${JSON.stringify(validateQuestion.errors)}`);
  }
  const modules = read(path.join(directory, 'modules.json'));
  const concepts = read(path.join(directory, 'concepts.json'));
  for (const x of [...modules, ...concepts, ...concepts.flatMap(c => c.objectives)]) if (!x.id.startsWith(`${prefix}${short}-`)) throw new Error(`${subject}: unsafe merge ID ${x.id}`);
  const manifestPath = path.join(directory, 'media-manifest.json');
  const assets = fs.existsSync(manifestPath) ? read(manifestPath) : [];
  if (assets.length && gate.sha256?.['media-manifest.json'] !== digest(manifestPath)) throw new Error(`${subject}: unsigned media manifest`);
  for (const asset of assets) {
    if (path.basename(asset.file) !== asset.file || asset.publicPath !== `study/limb-science-audit/${asset.file}`) throw new Error(`${subject}: unsafe asset path`);
    const source = path.join(directory, 'media', asset.file);
    if (gate.assetSha256?.[asset.file] !== digest(source)) throw new Error(`${subject}: unsigned asset ${asset.file}`);
    media.push({ ...asset, inputFile: source, sha256: digest(source) });
  }
  for (const q of questions) for (const m of q.media ?? []) {
    if (!media.some(a => a.publicPath === `study/${m.path}`)) throw new Error(`${q.id}: media is not in reviewed manifest`);
  }
  const before = existingLimb.filter(q => q.subject === subject);
  const coverage = read(path.join(directory, 'coverage.json'));
  if (!Array.isArray(coverage)) throw new Error(`${subject}: coverage must be an objective array`);
  const oldIds = new Set(before.map(q => q.id)), newIds = new Set(questions.map(q => q.id));
  const mappedOld = new Set(coverage.flatMap(c => c.existingQuestionIds ?? []));
  const mappedNew = new Set(coverage.flatMap(c => c.newQuestionIds ?? []));
  if ([...oldIds].some(id => !mappedOld.has(id)) || [...newIds].some(id => !mappedNew.has(id)) || [...mappedNew].some(id => !newIds.has(id))) throw new Error(`${subject}: incomplete objective reconciliation`);
  reviewed.push({ subject, author: gate.author, independentReviewer: gate.independentReviewer,
    before: before.length, added: questions.length, after: before.length + questions.length,
    core: before.concat(questions).filter(q => q.difficulty <= 3).length,
    challenge: before.concat(questions).filter(q => q.difficulty >= 4).length,
    courseCarryoverAdded: questions.filter(q => q.tags.includes('course')).length,
    bookExtensionAdded: questions.filter(q => q.tags.includes('book-extension')).length,
    imageQuestionsAdded: questions.filter(q => q.media?.length).length,
    questionIds: questions.map(q => q.id), coverage });
  newQuestions.push(...questions); newModules.push(...modules); newConcepts.push(...concepts);
  newSources.push(...read(path.join(directory, 'source-audit.json')));
}

const catalogFile = path.join(root, 'data/term2/limbs-concepts.json');
const catalog = read(catalogFile);
// Other generators move their own visual modules to the end. Preserve the live
// ordering while replacing this expansion so --check is stable after a build.
function mergeOwned(existing, incoming, key, owned) {
  const remaining = new Map(incoming.map(item => [key(item), item]));
  const merged = existing.flatMap(item => {
    if (!owned(item)) return [item];
    const replacement = remaining.get(key(item));
    remaining.delete(key(item));
    return replacement ? [replacement] : [];
  });
  return merged.concat([...remaining.values()]);
}
catalog.modules = mergeOwned(catalog.modules, newModules, x => x.id, x => x.id.startsWith(prefix));
catalog.concepts = mergeOwned(catalog.concepts, newConcepts, x => x.id, x => x.id.startsWith(prefix));
catalog.sourceAudit = mergeOwned(catalog.sourceAudit, newSources.map(a => ({ ...a, note: `[limb-science-audit] ${a.note}` })),
  a => [a.source, a.locator, a.topic].join('\0'), a => a.conceptIds.some(id => id.startsWith(prefix)) || a.note.includes('[limb-science-audit]'));
catalog.updatedAt = '2026-09-13';
catalog.scopeNote = 'Both limbs are confirmed exam regions. Available upper-limb transcripts support regional anatomy; dedicated later-hand and lower-limb lecture detail remains incomplete. Related sciences are now mapped to the local review, Langman 15e, Junqueira 16e and Guyton (2026), with Foundations slides labelled lecture-supported carryover, exam inclusion unconfirmed. Book extensions are not evidence of a separate faculty syllabus. Question links sample the audited objectives, not every paragraph or official exam weighting; genuine past papers remain separate.';
if (!validateCatalog(catalog)) throw new Error(JSON.stringify(validateCatalog.errors));
const ids = new Set(previousQuestions.map(q => q.id));
for (const q of newQuestions) { if (ids.has(q.id)) throw new Error(`Duplicate global ID ${q.id}`); ids.add(q.id); }
const { errors } = auditTerm2ConceptCatalog(catalog, existingLimb.concat(newQuestions));
if (errors.length) throw new Error(errors.join('\n'));
const audit = { schemaVersion: '1.0.0', examId: 'term2-limbs', updatedAt: catalog.updatedAt,
  totalAdded: newQuestions.length, conceptsAdded: newConcepts.length, modulesAdded: newModules.length,
  scopeNote: catalog.scopeNote, subjects: reviewed,
  sourceGaps: newSources.filter(s => s.status !== 'mapped'),
  media: media.map(asset => Object.fromEntries(Object.entries(asset).filter(([key]) => key !== 'inputFile'))) };

const cell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
const reportLines = [
  '# Upper & Lower Limbs — related-science gap audit', '',
  `Updated ${catalog.updatedAt}. ${newQuestions.length} new original MCQs, ${newConcepts.length} source-mapped concepts and ${newModules.length} reading modules.`, '',
  'These are source-based practice questions, not recovered past papers. Difficulty is editorial; linked questions sample objectives, not every possible faculty question.', '',
  '| Subject | Before | Added | Now | Core / challenge now | Carryover / book additions |',
  '| --- | ---: | ---: | ---: | --- | --- |',
  ...reviewed.map(s => `| ${s.subject} | ${s.before} | ${s.added} | ${s.after} | ${s.core} / ${s.challenge} | ${s.courseCarryoverAdded} / ${s.bookExtensionAdded} |`), '',
  '## Source boundaries', '', catalog.scopeNote, '',
  'The local Upper and Lower Limbs Review and its underlying notes were reconciled with seven upper-limb transcripts, Foundations carryover slides, and the primary books. Review summaries and ASR transcripts are secondary/noisy evidence, not an independent faculty syllabus. The Downloads embryology summary is also distinguished from a dedicated limb lecture.', '',
  '## Reading routes', '',
  '| Subject | Primary book route | Local corroboration |',
  '| --- | --- | --- |',
  '| Embryology | Langman 15e Ch12, printed169–180 / physical PDF181–192; relevant myogenesis/tendon material Ch11 and appendicular dysplasia comparisons Ch10 | Limb review development sections; condensed Downloads embryology notes, teaching provenance unconfirmed |',
  '| Histology | Junqueira 16e Ch5,7,8,9,10: connective tissue, cartilage, bone, nerve, muscle | BONE&JOINT TISSUE and NERVOUS TISSUE carryover; Foundations and limb reviews |',
  '| Physiology | Guyton (2026 local file) Ch5–7 and selected Ch55 spinal-reflex material; narrow active-lengthening corroboration in Ch85 | Cell4 carryover; limb review movement/mechanics section |', '',
  'Book PDF offsets vary. Use each question’s precise locator rather than applying one offset to the entire book.', '',
  '## Missing evidence / exclusions', '',
  ...audit.sourceGaps.map(s => `- **${s.topic}** (${s.status}): ${s.note} ${s.source} — ${s.locator}`), '',
  '## Objective-by-objective reconciliation', '',
  'Existing IDs show earlier direct/related samples. New IDs link to the addition; “covered” means sampled in practice, not guaranteed mastery or exam inclusion.', '',
];
for (const row of reviewed) {
  reportLines.push(`### ${row.subject}`, '', `Author: ${row.author}. Independent reviewer: ${row.independentReviewer}.`, '',
    '| Objective / gap | Source / locator | Existing questions | New questions | Scope / audit status |',
    '| --- | --- | --- | --- | --- |');
  if (!Array.isArray(row.coverage)) throw new Error(`${row.subject}: coverage must be an objective array`);
  for (const c of row.coverage) reportLines.push(`| ${cell(c.title ?? c.objective)} | ${cell(c.primarySource)} · ${cell(c.locator)} | ${cell((c.existingQuestionIds ?? []).join(', ') || '—')} | ${cell((c.newQuestionIds ?? []).join(', ') || '—')} | ${cell(c.sourceScope)} · ${cell(c.gapStatus)} |`);
  reportLines.push('');
}
reportLines.push('## Verification', '', 'Each lane has an independent review report and SHA-256-signed payload inventory under data/term2/provenance/limb-science-audit. The importer checks those signatures, source locators, answer rationales, scope, image assets and all concept/objective links before changing the live bank. Existing question files and past-exam banks are not rewritten by this importer.', '');

// Validate everything before writing live content. --check is read-only.
const outputs = [
  [path.join(bankDir, fileName), newQuestions.map(q => JSON.stringify(q)).join('\n') + '\n'],
  [catalogFile, JSON.stringify(catalog, null, 2) + '\n'],
  [path.join(root, 'data/term2/limbs-science-audit.json'), JSON.stringify(audit, null, 2) + '\n'],
  [path.join(root, 'docs/limb-science-gap-audit.md'), reportLines.join('\n')],
];
if (process.argv.includes('--check')) {
  for (const [file, content] of outputs) if (fs.readFileSync(file, 'utf8') !== content) throw new Error(`Stale import ${file}`);
} else {
  for (const subject of Object.keys(lanes)) {
    const destination = path.join(provenance, subject);
    fs.mkdirSync(destination, { recursive: true });
    for (const file of payloads.concat('review-gate.json', 'independent-review.json', 'audit.md', 'media-manifest.json')) {
      const source = path.join(staging, subject, file);
      if (fs.existsSync(source)) fs.copyFileSync(source, path.join(destination, file));
    }
  }
  for (const asset of media) { const destination = path.join(root, 'public', asset.publicPath); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.copyFileSync(asset.inputFile, destination); }
  for (const [file, content] of outputs) fs.writeFileSync(file, content);
}
console.log(JSON.stringify({ added: audit.totalAdded, concepts: audit.conceptsAdded, subjects: reviewed.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => !['coverage', 'questionIds'].includes(key)))), sourceGaps: audit.sourceGaps.length }, null, 2));
