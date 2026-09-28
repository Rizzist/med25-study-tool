export const GUIDED_SPLIT_KEY: string;
export const DEFAULT_SPLIT: number;
export function clampSplit(value: unknown): number;
export function readSplit(raw: string | null): number;
export function splitAtPointer(clientX: number, left: number, width: number): number;
