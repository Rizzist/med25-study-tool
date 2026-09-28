export const GUIDED_SPLIT_KEY = 'med25-guided-split-v1';
export const DEFAULT_SPLIT = 54;
export function clampSplit(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(30, Math.min(70, number)) : DEFAULT_SPLIT;
}
export function readSplit(raw) {
  return raw === null || raw === '' ? DEFAULT_SPLIT : clampSplit(raw);
}
export function splitAtPointer(clientX, left, width) {
  return width > 0 ? clampSplit((clientX - left) / width * 100) : DEFAULT_SPLIT;
}
