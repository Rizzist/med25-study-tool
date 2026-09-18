import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const hash = file => createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const audit = read('data/term2/limbs-science-audit.json');
const catalog = read('data/term2/limbs-concepts.json');
const index = read('data/term2/limbs-question-index.json');
const questions = fs.readFileSync(path.join(root, 'data/bank/questions/term2-limbs-science-audit.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);

test('limb science audit preserves independent source-review gates and exact content', () => {
  assert.equal(questions.length, audit.totalAdded);
  assert.deepEqual(audit.subjects.map(s => s.before), [17, 10, 5]);
  assert.deepEqual(audit.subjects.map(s => s.subject), ['embryology', 'histology', 'physiology']);
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  for (const row of audit.subjects) {
    const directory = `data/term2/provenance/limb-science-audit/${row.subject}`;
    const gate = read(`${directory}/review-gate.json`);
    assert.equal(gate.status, 'approved');
    assert.notEqual(gate.author, gate.independentReviewer);
    assert.equal(gate.independentReviewer, row.independentReviewer);
    for (const file of ['questions.jsonl', 'concepts.json', 'modules.json', 'source-audit.json', 'coverage.json']) assert.equal(hash(`${directory}/${file}`), gate.sha256[file], `${row.subject}: review digest drift ${file}`);
    const drafts = fs.readFileSync(path.join(root, directory, 'questions.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(drafts.length, row.added);
    assert.equal(row.after, row.before + row.added);
    assert.equal(row.after, row.core + row.challenge);
    assert.equal(row.added, row.courseCarryoverAdded + row.bookExtensionAdded);
    assert.deepEqual(new Set(row.questionIds), new Set(gate.approvedQuestionIds));
    for (const draft of drafts) {
      const published = questions.find(q => q.id === draft.id);
      assert(published, draft.id);
      for (const key of ['prompt', 'options', 'correctOptionId', 'explanation', 'distractorExplanations', 'source', 'learningObjective', 'media']) assert.deepEqual(published[key], draft[key], `${draft.id}: reviewed ${key} changed`);
    }
  }
});

test('every new limb question is useful, mapped practice with explicit scope and option rationales', () => {
  const normalized = new Set();
  for (const q of questions) {
    assert.equal(q.status, 'verified');
    assert(q.tags.includes('study-practice') && q.tags.includes('exam-term2-limbs'));
    assert(q.qualityFlags.includes('independent-agent-source-review'));
    assert(!q.tags.some(t => /past|final|official-exam/.test(t)));
    assert.equal(['course', 'book-extension'].filter(t => q.tags.includes(t)).length, 1);
    assert(q.source.page || q.source.slide);
    assert.equal(q.options.length, 4);
    assert(q.options.some(o => o.id === q.correctOptionId));
    for (const o of q.options) assert((o.id === q.correctOptionId ? q.explanation : q.distractorExplanations[o.id])?.length >= 20, `${q.id}: missing teaching rationale ${o.id}`);
    const key = q.prompt.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    assert(!normalized.has(key), `${q.id}: duplicate stem`); normalized.add(key);
    assert(index[q.id]?.addedForGap);
    assert(index[q.id]?.expandedForDepth);
    assert(index[q.id].conceptIds.length > 0);
    const concepts = index[q.id].conceptIds.map(id => catalog.concepts.find(c => c.id === id));
    assert(concepts.every(c => c?.subject === q.subject));
    if (q.tags.includes('course')) {
      assert(concepts.some(c => c.scope === 'course' && /carryover/i.test(c.summary) && /unconfirmed/i.test(c.summary)), `${q.id}: carryover is not exam confirmation`);
    }
  }
  assert(audit.sourceGaps.some(s => s.status === 'source-missing'), 'Unrecovered teaching evidence must not disappear');
  assert(catalog.scopeNote.includes('exam inclusion unconfirmed'));
});

test('source images remain reviewed assets and limb subjects are directly accessible', () => {
  for (const media of audit.media) {
    assert.equal(hash(`public/${media.publicPath}`), media.sha256);
    for (const q of questions.filter(q => q.media?.some(m => `study/${m.path}` === media.publicPath))) {
      assert.equal(q.kind, 'image_single_best_answer');
      assert(q.media.every(m => m.attribution && m.alt));
    }
  }
  const page = fs.readFileSync(path.join(root, 'app/page.tsx'), 'utf8');
  const config = page.split('"term2-limbs": { date:')[1].split('\n')[0];
  for (const subject of ['embryology', 'histology', 'physiology']) assert(config.includes(`"${subject}"`));
  for (const title of ['Limb development', 'Limb tissues & repair', 'Nerve, muscle & movement']) assert(page.includes(title));
});

test('built API serves all reviewed questions in limbs and resolves the actual image paths', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const route = (url, body) => worker.fetch(new Request(`http://localhost${url}`, body ? {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  } : undefined), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  const response = await route('/api/questions/by-ids', { exam: 'term2-limbs', ids: questions.map(q => q.id), limit: 250, preserveOrder: true });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result.questions.map(q => q.id), questions.map(q => q.id));
  for (const row of audit.subjects) {
    const response = await route(`/api/questions?exam=term2-limbs&collection=${row.subject}&limit=250`);
    const result = await response.json();
    assert.equal(result.questions.length, row.after, `${row.subject}: subject collection`);
    assert(result.questions.every(q => q.subject === row.subject));
  }
  const outside = await (await route('/api/questions/by-ids', { exam: 'term2-cvs', ids: questions.map(q => q.id), limit: 250 })).json();
  assert.deepEqual(outside.questions, []);
  for (const q of questions.filter(q => q.media?.length)) for (const media of q.media) {
    const response = await route(`/api/media?questionId=${q.id}&mediaId=${media.id}`);
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get('location')).pathname, `/study/${media.path}`);
    assert(fs.existsSync(path.join(root, 'public/study', media.path)));
  }
});
