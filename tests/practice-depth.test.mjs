import test from 'node:test';
import assert from 'node:assert/strict';
import { depthSummary, filterDepthIds, questionDepth } from '../src/lib/term2/practice-depth.mjs';

const index = {
  a: { subject: 'histology', kind: 'single_best_answer', difficulty: 2 },
  b: { subject: 'histology', kind: 'image_single_best_answer', difficulty: 4 },
  c: { subject: 'anatomy', kind: 'dynamic_anatomy', difficulty: 2, dedupeKey: 'plate:target' },
  d: { subject: 'anatomy', kind: 'dynamic_anatomy', difficulty: 2, dedupeKey: 'plate:target' },
};

test('depth filters retain only explicitly supplied and indexed study IDs', () => {
  assert.deepEqual(filterDepthIds(['a', 'b', 'b', 'unknown'], index, 'challenge'), ['b']);
  assert.deepEqual(filterDepthIds(['a', 'b', 'c'], index, 'core'), ['a', 'c']);
  assert.deepEqual(filterDepthIds(['a', 'a', 'b'], index), ['a', 'b']);
  assert.deepEqual(filterDepthIds(['a'], index, 'challenge'), []);
  assert.equal(questionDepth({ difficulty: 5 }), 'challenge');
});

test('written depth is not inflated by multiple anatomy target variants', () => {
  const rows = depthSummary(index);
  const hist = rows.find(row => row.subject === 'histology');
  assert.equal(hist.written, 2);
  assert.deepEqual(hist.challenge, ['b']);
  const anatomy = rows.find(row => row.subject === 'anatomy');
  assert.equal(anatomy.total, 2);
  assert.equal(anatomy.distinctTargets, 1);
  assert.equal(anatomy.written, 0);
});
