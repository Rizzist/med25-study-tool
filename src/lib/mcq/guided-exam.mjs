/** Rollout gate shared by practice and the future sourced-paper adapter. */
export const GUIDED_COURSES = ['term2-respiratory','term1-biochemistry-retake'];
export function supportsGuidedExam(exam) { return GUIDED_COURSES.includes(exam); }
export function guidanceMode(exam, value) { return supportsGuidedExam(exam) && value === 'guided' ? 'guided' : 'unguided'; }

/** Explicit paragraph references are PDF-version-bound. A stale/missing anchor falls
 * back to the course's current section, never to a guessed paragraph or source scan. */
export function resolveGuidedReference(course, anchors, questionId) {
  if (!course || !questionId) return null;
  const explicit = anchors?.questions?.[questionId];
  const mapping = course.questions[questionId];
  const explicitSection = course.sections.find(s => s.id === explicit?.sectionId);
  const explicitVolume = course.volumes.find(v => v.id === explicitSection?.volumeId);
  const volumeHash = volume => volume?.sha256 ?? (volume?.url ? new URL(volume.url, 'https://med25.local').searchParams.get('v') : null);
  // Version-bound overrides must not override a newer course's section mapping.
  const currentExplicit = explicitVolume && anchors?.pdfSha256 === volumeHash(explicitVolume)
    && (!mapping?.sectionId || mapping.sectionId === explicit.sectionId);
  const section = currentExplicit ? explicitSection : course.sections.find(s => s.id === mapping?.sectionId);
  const volume = course.volumes.find(v => v.id === section?.volumeId);
  if (!section || !volume) return null;
  const hash = volumeHash(volume);
  const valid = currentExplicit && explicit && anchors.pdfSha256 === hash && Number.isInteger(explicit.page)
    && explicit.page >= 1 && explicit.page <= volume.pageCount && Number.isFinite(explicit.top)
    && explicit.top >= 0 && explicit.top < 1 && typeof explicit.quote === 'string' && explicit.quote.length > 0;
  const heading=anchors?.pdfSha256===hash ? anchors.sections?.[section.id] : null;
  const headingTop=heading?.page===section.pdfPage && Number.isFinite(heading.top) && heading.top>=0 && heading.top<1 ? heading.top : 0;
  return {sectionId:section.id, title:section.title, url:volume.url, page:valid ? explicit.page : section.pdfPage,
    top:valid ? explicit.top : headingTop, quote:valid ? explicit.quote : null,
    precision:valid ? 'paragraph' : 'section', uncertain:!valid && Boolean(mapping?.uncertain)};
}
