import assert from 'node:assert/strict';

// Apply an editorial study layer without modifying the source transcription.
export function resolveBiochemistryItem(original, resolution) {
  if (!resolution) return original;
  assert(!original.key, 'AI repair must not replace an already-scored question');
  assert(['inferred', 'repaired'].includes(resolution.kind));
  assert(resolution.evidence?.length && resolution.explanation);
  const options = [...original.options];
  for (const [letter, text] of Object.entries(resolution.optionPatches ?? {})) {
    const index = letter.charCodeAt(0) - 65;
    assert(index >= 0 && index <= options.length && index < 5 && text.trim());
    options[index] = text;
  }
  assert(options[resolution.key.charCodeAt(0) - 65], 'Missing resolved choice');
  const changed = Boolean(resolution.prompt || resolution.optionPatches);
  assert.equal(resolution.kind === 'repaired', changed);
  return {...original, prompt: resolution.prompt ?? original.prompt, options,
    key: resolution.key, acceptedOptionIds: resolution.acceptedOptionIds ?? [],
    note: resolution.explanation, aiResolution: resolution,
    originalQuestion: {prompt: original.prompt, options: original.options, providedKey: original.providedKey, key: original.key, note: original.note}};
}
