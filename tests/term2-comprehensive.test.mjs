import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { anatomyPracticeExclusion } from '../src/lib/mcq/advanced-anatomy.mjs';
import { isImageQuestion } from '../src/lib/mcq/exams.mjs';
const root = new URL('../', import.meta.url);
const read = file => JSON.parse(fs.readFileSync(new URL(file, root), 'utf8'));
const manifest = read('data/term2/provenance/comprehensive-expansion/manifest.json');
const questions = manifest.lanes.flatMap(({ lane }) => fs.readFileSync(new URL(`data/bank/questions/term2-comprehensive-${lane}.jsonl`, root), 'utf8').trim().split('\n').map(JSON.parse));

test('comprehensive original practice is independently reviewed, sourced and explanation-complete', () => {
  assert.equal(questions.length, manifest.questions);
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  for (const { lane, gate, questionCount } of manifest.lanes) {
    assert.equal(gate.status, 'approved');
    assert(gate.author);
    assert(gate.independentReviewer);
    assert.notEqual(gate.author, gate.independentReviewer);
    assert.equal(gate.approvedQuestionIds.length, questionCount);
    for (const file of ['questions.jsonl', 'concepts.json', 'modules.json', 'coverage.json', 'source-audit.json']) {
      assert.match(gate.sha256[file], /^[a-f0-9]{64}$/);
      const payload = fs.readFileSync(new URL(`data/term2/provenance/comprehensive-expansion/${lane}/reviewed/${file}`, root));
      assert.equal(createHash('sha256').update(payload).digest('hex'), gate.sha256[file], `${lane}/${file}: signed source changed`);
    }
    const rows = questions.filter(q => gate.approvedQuestionIds.includes(q.id));
    assert.equal(rows.length, questionCount);
    const signed = fs.readFileSync(new URL(`data/term2/provenance/comprehensive-expansion/${lane}/reviewed/questions.jsonl`, root), 'utf8').trim().split('\n').map(JSON.parse);
    for (const question of signed) {
      const live = rows.find(q => q.id === question.id);
      const clinicalPayload = value => Object.fromEntries(Object.entries(value).filter(([key]) => !['status', 'tags', 'qualityFlags'].includes(key)));
      assert.deepEqual(clinicalPayload(live), clinicalPayload(question), `${question.id}: reviewed content changed at publication`);
    }
    for (const letter of 'ABCD') {
      const count = rows.filter(q => q.correctOptionId === letter).length;
      assert(count > 0 && count < rows.length / 2, 'Avoid an answer-letter shortcut.');
    }
  }
  for (const q of questions) {
    assert.equal(anatomyPracticeExclusion(q), undefined, `${q.id}: new question was excluded from active advanced practice`);
    assert.equal(q.status, 'verified');
    assert.match(q.id, /^comp-/);
    assert(q.tags.includes('comprehensive-expansion'));
    assert(q.tags.includes('study-practice'));
    assert(q.tags.includes(q.difficulty >= 4 ? 'knowledge-challenge' : 'knowledge-core'));
    assert(q.qualityFlags.includes('independent-agent-source-review'));
    assert(q.source.page || q.source.slide);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map(o => o.text.trim().toLowerCase())).size, 4);
    for (const option of q.options) assert((option.id === q.correctOptionId ? q.explanation : q.distractorExplanations[option.id])?.length >= 15);
    assert(!q.tags.some(tag => /(?:^|-)past(?:-|$)|final-bank|official-exam/.test(tag)));
  }
});

test('CVS back/spinal practice and all new disciplines are discoverable through linked theory objectives', () => {
  const back = questions.filter(q => q.id.startsWith('comp-cvs-back-'));
  assert(back.length >= 40, 'Substantive back/spinal coverage, not a handful of gross labels.');
  assert(back.every(q => q.tags.includes('exam-term2-cvs')));
  assert(back.some(q => q.difficulty >= 4));
  for (const exam of ['cvs', 'respiratory', 'limbs']) {
    const catalog = read(`data/term2/${exam}-concepts.json`);
    const index = read(`data/term2/${exam}-question-index.json`);
    const mapped = new Set(catalog.concepts.flatMap(c => c.objectives.flatMap(o => o.questionIds)));
    const relevant = questions.filter(q => q.tags.includes(`exam-term2-${exam}`));
    assert(relevant.length > 0);
    for (const q of relevant) {
      assert(mapped.has(q.id), `${q.id}: missing theory objective`);
      assert(index[q.id], `${q.id}: missing active question index`);
      assert(index[q.id].addedForGap, `${q.id}: not recognized by gap reporting`);
      assert.equal(index[q.id].knowledgeLevel, q.difficulty >= 4 ? 'challenge' : 'core');
    }
  }
  for (const subject of ['anatomy', 'physiology', 'embryology', 'histology']) assert(questions.some(q => q.subject === subject), subject);
});

test('new source images are pinned and genuine past papers are byte-for-byte unchanged', () => {
  for (const asset of manifest.assets) {
    assert.equal(createHash('sha256').update(fs.readFileSync(new URL(asset.path, root))).digest('hex'), asset.sha256);
  }
  for (const q of questions) for (const media of q.media ?? []) {
    assert(fs.existsSync(new URL(`public/study/${media.path}`, root)), q.id);
    assert(isImageQuestion(q), `${q.id}: image is missing from the Images collection`);
  }
  const bank = read('data/bank/embedded-bank.json');
  assert.equal(createHash('sha256').update(JSON.stringify(bank.finalExams)).digest('hex'), '68c584c09b5216980e882145039bd0d76bb5736991ded6949a7d348e77331051');
  assert.equal(Object.values(bank.finalExams).flat().length, 518);
  for (const q of questions) assert(bank.questions.some(row => row.id === q.id), `${q.id}: not shipped in active bank`);
});
