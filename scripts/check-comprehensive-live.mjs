import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Read-only API/asset acceptance check. This does not use browser automation,
// submit answers, mutate progress, or publish the application.
const root = path.resolve(import.meta.dirname, '..');
const origin = new URL(process.argv[2] ?? 'http://127.0.0.1:3000');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/term2/provenance/comprehensive-expansion/manifest.json'), 'utf8'));
const get = async (pathname, options = {}) => {
  const response = await fetch(new URL(pathname, origin), { signal: AbortSignal.timeout(30_000), ...options });
  assert.equal(response.status, 200, `${pathname}: HTTP ${response.status}`);
  return response;
};
const summaries = await Promise.all(manifest.lanes.map(async ({ lane }) => {
  const expected = fs.readFileSync(path.join(root, `data/bank/questions/term2-comprehensive-${lane}.jsonl`), 'utf8').trim().split('\n').map(JSON.parse);
  const exam = expected[0].tags.find(tag => /^exam-term2-/.test(tag)).slice(5);
  const response = await get('/api/questions/by-ids', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exam, ids: expected.map(q => q.id), limit: expected.length, preserveOrder: true }),
  });
  const actual = await response.json();
  assert.equal(actual.availableCount, expected.length, `${lane}: inactive or unroutable questions`);
  assert.deepEqual(actual.questions, expected, `${lane}: stale or altered served payload`);
  for (const question of expected) for (const media of question.media ?? []) {
    const image = await get(`/api/media?${new URLSearchParams({ questionId: question.id, mediaId: media.id })}`);
    assert.match(image.headers.get('content-type') ?? '', /^image\//);
    const asset = manifest.assets.find(asset => asset.path === `public/study/${media.path}`);
    assert(asset, `${question.id}: unregistered asset`);
    assert.equal(createHash('sha256').update(Buffer.from(await image.arrayBuffer())).digest('hex'), asset.sha256);
  }
  return { lane, served: actual.availableCount, imageQuestions: expected.filter(q => q.media?.length).length };
}));
const bankSummary = await (await get('/api/bank/summary')).json();
for (const { examId } of manifest.byExam) {
  await get(`/?exam=${examId}`);
  assert.equal(bankSummary.exams.find(exam => exam.id === examId)?.finalExamQuestionCount, 0, `${examId}: study questions must not populate genuine past papers`);
  // No genuine Term 2 bank exists: the endpoint deliberately rejects it.
  const final = await fetch(new URL(`/api/final-exam?exam=${examId}`, origin), { signal: AbortSignal.timeout(30_000) });
  assert.equal(final.status, 400);
  assert.deepEqual(await final.json(), { error: 'That final-exam bank is not available for this exam' });
}
console.log(JSON.stringify({ origin: origin.origin, status: 'passed', studyQuestions: summaries.reduce((n, row) => n + row.served, 0), lanes: summaries, term2PastPapersEmpty: true }, null, 2));
