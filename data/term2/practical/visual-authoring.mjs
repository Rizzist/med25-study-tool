import { Q, U } from './authoring.mjs';
// Cases are independent of their four questions, so the same inspected image
// supports observation, calculation and explanation without duplicating files.
export const P = (id, prompt, answer, explanation, wrong, style = 'application') => Q(id, prompt, answer, explanation, wrong, undefined, style);
export const mark = (label, x, y, width, height, text) => ({ label, x, y, width, height, text });
export const mask = (x, y, width, height) => ({ x, y, width, height });
export function visualCase(id, stationId, title, scope, path, source, pages, overview, annotations, questions, masks = []) {
  return { id, stationId, title, scope, path, source, pages, overview, annotations, masks,
    questions: questions.map((q, i) => ({ ...q, id: `visual-${id}-${i + 1}`, prompt: `${title} — ${q.prompt}`, caseId: id, mediaPath: path })) };
}
export const toUnit = (c) => ({ ...U(`visual-${c.id}`, c.stationId, c.title, c.source.localKey ?? 'ecg', c.pages, c.questions), visualCaseId: c.id, scope: c.scope, externalSource: c.source });
export const ecgpedia = (page, file, author = 'Cardionetworks Foundation / ECGpedia contributors') => ({
  title: 'ECGpedia educational case', provider: 'ECGpedia', url: `https://en.ecgpedia.org/wiki/${page}`, fileUrl: `https://en.ecgpedia.org/wiki/File:${file}`,
  attribution: author, license: 'CC BY-NC-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/3.0/',
  note: 'Original image unchanged. MED25 questions and optional explanatory overlays are educational adaptations under the same licence. Not an official TUMS answer key.',
});
export const course = (localKey, title, url = '') => ({ localKey, title, provider: 'Your course material', url, fileUrl: '', attribution: title, license: 'User-provided course reference', licenseUrl: '', note: 'Course image unchanged; MED25 explanations are not an official marking key.' });
