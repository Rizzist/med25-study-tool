// AI teaching annotations are a separate layer: original papers and source keys stay intact.
export function answerResolution(question) {
  if (question.scoringKey && Array.isArray(question.issues) && !question.issues.length) {
    return { key: question.scoringKey, kind: 'source' };
  }
  const ai = question.aiAnswer;
  if (ai?.reviewStatus === 'verified' && ['high', 'moderate'].includes(ai.confidence)
    && typeof ai.answer === 'string' && /^[A-F]$/.test(ai.answer)
    && question.options?.['ABCDEF'.indexOf(ai.answer)]?.trim()) {
    return { key: ai.answer, kind: 'ai' };
  }
  return { key: null, kind: 'unresolved' };
}

export async function questionContentHash(question) {
  const bytes = new TextEncoder().encode(JSON.stringify({ prompt: question.prompt, options: question.options, issues: question.issues }));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export async function applyAnswerOverlay(paper, overlay) {
  if (!overlay?.questions || !overlay.revision) return paper;
  const questions = await Promise.all(paper.questions.map(async question => {
    const ai = overlay.questions[question.id];
    if (!ai || ai.reviewStatus !== 'verified' || answerResolution(question).kind === 'source'
      || ai.questionHash !== await questionContentHash(question)) return question;
    const optionsCorrected = ai.sourcePageVerified === true && Array.isArray(ai.correctedOptions)
      && ai.correctedOptions.length >= 2 && ai.correctedOptions.length <= 6
      && ai.correctedOptions.every(option => typeof option === 'string' && option.trim());
    const promptCorrected = ai.sourcePageVerified === true && typeof ai.correctedPrompt === 'string' && ai.correctedPrompt.trim();
    const corrected = optionsCorrected || promptCorrected;
    const prompt = promptCorrected ? ai.correctedPrompt : question.prompt;
    const options = optionsCorrected ? ai.correctedOptions : question.options;
    return { ...question, aiAnswer: ai, ...(corrected ? {
      originalPrompt: question.prompt, originalOptions: question.options,
      prompt, options,
      correctionRevision: JSON.stringify([prompt, options]),
    } : {}) };
  }));
  return { ...paper, questions, aiRevision: overlay.revision };
}

export function combinedPaperId(paperIds) {
  return 'cvs-combined:' + [...new Set(paperIds)].sort().join('+');
}

export function createCombinedPaper(papers) {
  const unique = [...new Map(papers.map(paper => [paper.id, paper])).values()].sort((a, b) => a.id.localeCompare(b.id));
  if (!unique.length) throw new Error('Choose at least one past paper.');
  const questions = unique.flatMap(paper => paper.questions.map(question => ({ ...question,
    originPaper: { id: paper.id, title: paper.title, sourceUrl: paper.sourceUrl, transcriptUrl: paper.transcriptUrl },
  })));
  if (new Set(questions.map(q => q.id)).size !== questions.length) throw new Error('Repeated question IDs in the selected sources.');
  return { id: combinedPaperId(unique.map(p => p.id)), title: `Combined CVS · ${unique.length} ${unique.length === 1 ? 'paper' : 'papers'}`,
    fingerprint: unique.map(p => `${p.id}:${p.fingerprint}`).join('|'), questions,
    sourcePaperIds: unique.map(p => p.id), aiRevision: unique.map(p => p.aiRevision || '').join('|'),
    note: 'Original past-paper questions in one continuous session. Similar questions in different papers are retained.',
    keyStatus: 'mixed', sourceUrl: '', transcriptUrl: '',
  };
}
