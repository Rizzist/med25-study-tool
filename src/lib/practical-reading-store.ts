"use client";
import { useSyncExternalStore } from "react";
import { practicalCatalog } from "./physiology-practical";

const key = "med25-physiology-practical-reading-v1";
const eventName = "med25-practical-reading-change";
const valid = new Set(practicalCatalog.stations.map((station) => station.id));
type Snapshot = { readIds: string[]; selectedId: string; ready: boolean; storageError: boolean };
const server: Snapshot = { readIds: [], selectedId: "bp", ready: false, storageError: false };
let cached = server;
let rawCache: string | null | undefined;
function getSnapshot() {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== rawCache || !cached.ready) {
      rawCache = raw;
      let parsed: { version?: number; readIds?: unknown; selectedId?: string } = {};
      try { parsed = JSON.parse(raw || "{}") || {}; } catch { /* Invalid saved data starts a fresh checklist. */ }
      cached = { ready: true, storageError: false,
        readIds: parsed.version === 1 && Array.isArray(parsed.readIds) ? [...new Set(parsed.readIds.filter((id): id is string => typeof id === "string" && valid.has(id)))] : [],
        selectedId: parsed.version === 1 && valid.has(parsed.selectedId ?? "") ? parsed.selectedId! : "bp",
      };
    }
  } catch { if (!cached.ready || !cached.storageError) cached = { ...cached, ready: true, storageError: true }; }
  return cached;
}
function subscribe(callback: () => void) {
  const changed = (event: StorageEvent) => { if (event.key === key || event.key === null) callback(); };
  window.addEventListener("storage", changed);
  window.addEventListener(eventName, callback);
  return () => { window.removeEventListener("storage", changed); window.removeEventListener(eventName, callback); };
}
function save(next: Snapshot) {
  cached = next;
  try { rawCache = JSON.stringify({ version: 1, readIds: next.readIds, selectedId: next.selectedId }); localStorage.setItem(key, rawCache); cached = { ...next, storageError: false }; }
  catch { cached = { ...next, storageError: true }; }
  window.dispatchEvent(new Event(eventName));
}
export function selectPracticalStation(id: string) { if (valid.has(id)) save({ ...getSnapshot(), selectedId: id }); }
export function togglePracticalRead(id: string) {
  if (!valid.has(id)) return;
  const current = getSnapshot();
  save({ ...current, readIds: current.readIds.includes(id) ? current.readIds.filter((value) => value !== id) : [...current.readIds, id] });
}
export function usePracticalReading() { return useSyncExternalStore(subscribe, getSnapshot, () => server); }
