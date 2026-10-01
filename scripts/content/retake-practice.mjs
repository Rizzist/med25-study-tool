import assert from 'node:assert/strict';

// Original question identities survive chapter expansion and editorial repairs.
// Only the retake copies change; other courses and source papers remain intact.
export function expandRetakePractice(originals, additions, repairs, definitions) {
  const titles = new Map(definitions.map(([id, title]) => [id, title]));
  const links = new Map();
  const originalIds = new Set(originals.map(q => q.id));
  for (const id of Object.keys(repairs)) assert(originalIds.has(id), `Unknown repair: ${id}`);
  const practice = originals.map(q => {
    const repair = repairs[q.id];
    if (!repair) return q;
    const {auditNote, sourceEvidence, ...changes} = repair;
    assert(auditNote && sourceEvidence?.length, `Repair requires evidence: ${q.id}`);
    const allowed = new Set(['prompt', 'options', 'correctOptionId', 'explanation', 'distractorExplanations', 'source']);
    for (const key of Object.keys(changes)) assert(allowed.has(key), `Unexpected repair field: ${key}`);
    const result = {...q, ...changes, revision: q.revision + 1,
      qualityFlags: [...q.qualityFlags, 'single-best-answer-options-reviewed'],
      source: {...q.source, ...changes.source, excerpt: `${q.source.excerpt ?? ''} Retake editorial review: ${auditNote} Evidence: ${sourceEvidence.join('; ')}`.trim()}};
    delete result.acceptedFreeText;
    delete result.acceptedOptionIds;
    return result;
  });
  for (const item of additions) {
    const {chapterId, conceptId, ...fields} = item;
    assert(titles.has(chapterId), `Unknown practice chapter: ${chapterId}`);
    assert(/^retake-depth-/.test(item.id), `New practice ID: ${item.id}`);
    if (conceptId) links.set(item.id, conceptId);
    practice.push({schemaVersion: '1.0.0', revision: 1, status: 'verified', kind: 'single_best_answer',
      subject: 'biochemistry', topic: titles.get(chapterId), chapter: chapterId,
      learningObjective: `Apply ${item.subtopic} within ${titles.get(chapterId)}.`,
      examPriority: 'standard', ...fields,
      tags: ['term-1', 'exam-term1-biochemistry-retake', 'authored-practice', 'retake-chapter-depth',
        ...(chapterId === 'lab-practical' ? ['biochemistry-lab'] : []),
        `review-section-biochemistry-retake/${chapterId}`],
      qualityFlags: ['authored-practice-not-past-paper', 'chapter-source-checked', 'single-best-answer-options-reviewed']});
  }
  const prompts = new Set();
  const ids = new Set();
  for (const q of practice) {
    assert(!ids.has(q.id), `Duplicate practice ID: ${q.id}`); ids.add(q.id);
    const prompt = q.prompt.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!originalIds.has(q.id)) assert(!prompts.has(prompt), `Repeated practice stem: ${q.id}`);
    prompts.add(prompt);
    if (!originalIds.has(q.id) || repairs[q.id]) {
      assert.equal(q.options.length, 4, `Four options required: ${q.id}`);
      // Keep mathematical signs: +1 and -1 are genuinely different choices.
      assert.equal(new Set(q.options.map(o => o.text.toLowerCase().replace(/\s+/g, ' ').trim())).size, 4, `Duplicate option: ${q.id}`);
      assert.deepEqual(q.options.map(o => o.id), ['A', 'B', 'C', 'D']);
      assert(q.options.some(o => o.id === q.correctOptionId), `Missing key: ${q.id}`);
      for (const option of q.options.filter(o => o.id !== q.correctOptionId)) assert(q.distractorExplanations[option.id]?.length >= 20, `Missing option reasoning: ${q.id}:${option.id}`);
    }
  }
  return {practice, links};
}
