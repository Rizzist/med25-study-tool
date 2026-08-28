"use client";

import { useSyncExternalStore } from "react";
import { respiratoryConcepts } from "./concepts";
import { parseConceptReading } from "./progress.mjs";

const storageKey = "med25-respiratory-concept-reading-v1";
const eventName = "med25-respiratory-reading-change";
const validIds = respiratoryConcepts.map((concept) => concept.id);
type ReadingSnapshot = { readIds: string[]; ready: boolean; storageError: boolean };
const serverSnapshot: ReadingSnapshot = { readIds: [], ready: false, storageError: false };
let cachedSnapshot = serverSnapshot;
let cachedRaw: string | null | undefined;

function getSnapshot() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw !== cachedRaw || !cachedSnapshot.ready) {
      cachedRaw = raw;
      cachedSnapshot = { readIds: parseConceptReading(raw, validIds), ready: true, storageError: false };
    }
  } catch {
    if (!cachedSnapshot.ready || !cachedSnapshot.storageError) cachedSnapshot = { ...cachedSnapshot, ready: true, storageError: true };
  }
  return cachedSnapshot;
}

function subscribe(callback: () => void) {
  const storageChanged = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) callback(); };
  window.addEventListener("storage", storageChanged);
  window.addEventListener(eventName, callback);
  return () => { window.removeEventListener("storage", storageChanged); window.removeEventListener(eventName, callback); };
}

export function toggleRespiratoryRead(id: string) {
  if (!validIds.includes(id)) return;
  const current = getSnapshot().readIds;
  const readIds = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
  let storageError = false;
  try {
    const raw = JSON.stringify({ version: 1, readIds });
    window.localStorage.setItem(storageKey, raw);
    cachedRaw = raw;
  } catch { storageError = true; }
  cachedSnapshot = { readIds, ready: true, storageError };
  window.dispatchEvent(new Event(eventName));
}

export function useRespiratoryReading() {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}
