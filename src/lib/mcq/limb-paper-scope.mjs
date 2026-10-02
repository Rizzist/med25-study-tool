export const LIMB_SCOPES = ['all', 'upper', 'lower'];

/** Scope individual questions, not file names. Each scope has independent progress. */
export function scopeLimbPaper(paper, scope = 'all') {
  if (!LIMB_SCOPES.includes(scope)) throw new Error('Invalid limb scope');
  if (scope === 'all') return paper;
  const ids = new Set(paper.limbQuestionIds?.[scope] ?? []);
  const gradedQuestionIds = paper.gradedQuestionIds.filter(id => ids.has(id));
  const sourceRecordCount = paper.limbSourceCounts?.[scope] ?? gradedQuestionIds.length;
  return {
    ...paper,
    id: `${paper.id}--${scope}`,
    title: `${paper.title} · ${scope === 'upper' ? 'Upper' : 'Lower'} only`,
    gradedQuestionIds,
    gradedQuestionCount: gradedQuestionIds.length,
    sourceRecordCount,
    ungradedCount: sourceRecordCount - gradedQuestionIds.length,
  };
}

export function limbBankSelection(papers, scope) {
  return {
    id: `limbs-all-${scope}`,
    title: `All limb papers · ${scope === 'all' ? 'Full' : scope === 'upper' ? 'Upper only' : 'Lower only'}`,
    gradedQuestionIds: [...new Set(papers.filter(p => p.defaultEligible).flatMap(p => p.gradedQuestionIds))],
  };
}
