"use client";

import { useCallback, useSyncExternalStore } from "react";
import { TOOL_HISTORY_MAX_ENTRIES, TOOL_HISTORY_STORAGE_KEY } from "@/lib/constants";
import type { ToolHistoryEntry } from "@/types/tool";

const HISTORY_UPDATED_EVENT = "dailydocs:history-updated";

// Cache the parsed result so repeated getSnapshot() calls return the same
// reference when the underlying storage value hasn't changed, as required
// by useSyncExternalStore.
let cachedRaw: string | null = null;
let cachedEntries: ToolHistoryEntry[] = [];

function readHistory(): ToolHistoryEntry[] {
  if (typeof window === "undefined") return cachedEntries;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(TOOL_HISTORY_STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedEntries = raw ? (JSON.parse(raw) as ToolHistoryEntry[]) : [];
    } catch {
      cachedEntries = [];
    }
  }

  return cachedEntries;
}

function writeHistory(entries: ToolHistoryEntry[]) {
  try {
    window.localStorage.setItem(TOOL_HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded) — history is non-critical.
  }
  window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(HISTORY_UPDATED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(HISTORY_UPDATED_EVENT, callback);
  };
}

export function useToolHistory(toolSlug?: string) {
  const entries = useSyncExternalStore(
    subscribe,
    readHistory,
    () => cachedEntries
  );

  const addEntry = useCallback((entry: Omit<ToolHistoryEntry, "timestamp">) => {
    const next = [{ ...entry, timestamp: Date.now() }, ...readHistory()].slice(
      0,
      TOOL_HISTORY_MAX_ENTRIES
    );
    writeHistory(next);
  }, []);

  const clearHistory = useCallback(() => {
    const next = toolSlug ? readHistory().filter((entry) => entry.tool !== toolSlug) : [];
    writeHistory(next);
  }, [toolSlug]);

  const filtered = toolSlug ? entries.filter((entry) => entry.tool === toolSlug) : entries;

  return { entries: filtered, addEntry, clearHistory };
}
