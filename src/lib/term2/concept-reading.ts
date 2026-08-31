"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

type Snapshot = { readIds: string[]; ready: boolean; storageError: boolean };
const serverSnapshot: Snapshot = { readIds: [], ready: false, storageError: false };
const eventName = "med25-term2-concept-reading-change";
const cache = new Map<string, { raw: string | null | undefined; snapshot: Snapshot }>();

function storageKey(examId: string) {
  return `med25-term2-concept-reading-v1:${examId}`;
}

function readSnapshot(key: string, valid: Set<string>): Snapshot {
  try {
    const raw = window.localStorage.getItem(key);
    const cached = cache.get(key);
    if (cached?.raw === raw && cached.snapshot.ready) return cached.snapshot;
    const parsed = JSON.parse(raw ?? "null");
    const candidates: unknown[] = parsed?.version === 1 && Array.isArray(parsed.readIds) ? parsed.readIds : [];
    const readIds: string[] = parsed?.version === 1
      ? [...new Set(candidates.filter((id): id is string => typeof id === "string" && valid.has(id)))]
      : [];
    const snapshot = { readIds, ready: true, storageError: false };
    cache.set(key, { raw, snapshot });
    return snapshot;
  } catch {
    const snapshot = { readIds: cache.get(key)?.snapshot.readIds ?? [], ready: true, storageError: true };
    cache.set(key, { raw: undefined, snapshot });
    return snapshot;
  }
}

export function useTerm2ConceptReading(examId: string, validIds: string[]) {
  const key = storageKey(examId);
  const valid = useMemo(() => new Set(validIds), [validIds]);
  const getSnapshot = useCallback(() => readSnapshot(key, valid), [key, valid]);
  const subscribe = useCallback((callback: () => void) => {
    const storageChanged = (event: StorageEvent) => { if (event.key === key || event.key === null) callback(); };
    window.addEventListener("storage", storageChanged);
    window.addEventListener(eventName, callback);
    return () => {
      window.removeEventListener("storage", storageChanged);
      window.removeEventListener(eventName, callback);
    };
  }, [key]);
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}

export function toggleTerm2ConceptRead(examId: string, id: string, validIds: string[]) {
  const key = storageKey(examId);
  const valid = new Set(validIds);
  if (!valid.has(id)) return;
  const current = readSnapshot(key, valid).readIds;
  const readIds = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
  let storageError = false;
  let raw: string | undefined;
  try {
    raw = JSON.stringify({ version: 1, readIds });
    window.localStorage.setItem(key, raw);
  } catch {
    storageError = true;
  }
  cache.set(key, { raw, snapshot: { readIds, ready: true, storageError } });
  window.dispatchEvent(new Event(eventName));
}
