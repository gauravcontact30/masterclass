"use client";

import { englishWordSchema, type WordLookup, type EnglishWord } from "./english-word";
import type { WordHistoryCard } from "@/components/vocabulary-history";

export const VOCABULARY_UPDATED_EVENT = "masterclass:vocabulary-updated";

/**
 * Returns the localStorage key for the given user, or the current guest session.
 */
export function getVocabularyStorageKey(userId?: string | null): string {
  if (userId) return `masterclass:vocabulary:${userId}`;
  if (typeof window !== "undefined") {
    // If a non-guest user key exists, reuse it
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("masterclass:vocabulary:") && key !== "masterclass:vocabulary:guest") {
        return key;
      }
    }
  }
  return "masterclass:vocabulary:guest";
}

/**
 * Reads all saved vocabulary cards for the user.
 */
export function getSavedVocabularyWords(key?: string): WordHistoryCard[] {
  if (typeof window === "undefined") return [];
  const storageKey = key ?? getVocabularyStorageKey();
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const results: WordHistoryCard[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const validEntry = englishWordSchema.safeParse((item as Record<string, unknown>).entry);
      if (!validEntry.success) continue;
      const wordKey = validEntry.data.word.toLowerCase();
      if (seen.has(wordKey)) continue;
      seen.add(wordKey);
      results.push({
        entry: validEntry.data,
        source: (item as Record<string, unknown>).source as "library" | "dictionary" | "ai" ?? "library",
        notice: (item as Record<string, unknown>).notice as string | undefined,
        at: typeof (item as Record<string, unknown>).at === "number" ? (item as Record<string, unknown>).at as number : Date.now(),
        checked: Boolean((item as Record<string, unknown>).checked),
        language: ((item as Record<string, unknown>).language as "en" | "hi") ?? "en",
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Checks if a word is already saved in the vocabulary.
 */
export function isWordSavedInVocabulary(word: string, key?: string): boolean {
  if (!word || typeof window === "undefined") return false;
  const target = word.trim().toLowerCase();
  const list = getSavedVocabularyWords(key);
  return list.some(item => item.entry.word.toLowerCase() === target);
}

/**
 * Saves a WordLookup entry to the user's vocabulary collection.
 */
export function saveWordToVocabulary(lookup: WordLookup, key?: string): boolean {
  if (typeof window === "undefined" || !lookup?.entry?.word) return false;
  const storageKey = key ?? getVocabularyStorageKey();
  const existing = getSavedVocabularyWords(storageKey);
  const target = lookup.entry.word.toLowerCase();

  const prev = existing.find(item => item.entry.word.toLowerCase() === target);
  const newCard: WordHistoryCard = {
    ...lookup,
    at: Date.now(),
    checked: prev?.checked ?? false,
    language: prev?.language ?? "en",
  };

  const nextList = [newCard, ...existing.filter(item => item.entry.word.toLowerCase() !== target)].slice(0, 200);

  try {
    localStorage.setItem(storageKey, JSON.stringify(nextList));
    window.dispatchEvent(
      new CustomEvent(VOCABULARY_UPDATED_EVENT, {
        detail: { word: lookup.entry.word, action: "save", card: newCard },
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a word from the user's vocabulary collection.
 */
export function removeWordFromVocabulary(word: string, key?: string): boolean {
  if (typeof window === "undefined" || !word) return false;
  const storageKey = key ?? getVocabularyStorageKey();
  const existing = getSavedVocabularyWords(storageKey);
  const target = word.trim().toLowerCase();
  const filtered = existing.filter(item => item.entry.word.toLowerCase() !== target);

  try {
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    window.dispatchEvent(
      new CustomEvent(VOCABULARY_UPDATED_EVENT, {
        detail: { word, action: "remove" },
      })
    );
    return true;
  } catch {
    return false;
  }
}

// In-memory cache for fast instant pre-population
const lookupCache = new Map<string, WordLookup>();
const pendingLookups = new Map<string, Promise<WordLookup>>();

/**
 * Returns cached word lookup if available in memory or saved history.
 */
export function getCachedWordLookup(word: string): WordLookup | null {
  if (!word) return null;
  const key = word.trim().toLowerCase();
  if (lookupCache.has(key)) return lookupCache.get(key)!;
  const saved = getSavedVocabularyWords();
  const match = saved.find(item => item.entry.word.toLowerCase() === key);
  if (match) {
    const lookup: WordLookup = { entry: match.entry, source: match.source, notice: match.notice };
    lookupCache.set(key, lookup);
    return lookup;
  }
  return null;
}

/**
 * Prefetches word details in background so they are ready before the modal opens.
 */
export function prefetchWordDetails(word: string): Promise<WordLookup> {
  const key = word.trim().toLowerCase();
  const cached = getCachedWordLookup(key);
  if (cached) return Promise.resolve(cached);

  const pending = pendingLookups.get(key);
  if (pending) return pending;

  const promise = fetchWordDetails(word)
    .then(data => {
      lookupCache.set(key, data);
      pendingLookups.delete(key);
      return data;
    })
    .catch(err => {
      pendingLookups.delete(key);
      throw err;
    });

  pendingLookups.set(key, promise);
  return promise;
}

/**
 * Looks up a word from the backend /api/pro-learn/word endpoint with caching.
 */
export async function fetchWordDetails(word: string, signal?: AbortSignal): Promise<WordLookup> {
  const key = word.trim().toLowerCase();
  const cached = lookupCache.get(key);
  if (cached) return cached;

  const response = await fetch("/api/pro-learn/word", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word: word.trim() }),
    signal,
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Word lookup is unavailable right now.");
  }

  const entry: EnglishWord = englishWordSchema.parse(body.entry);
  const result: WordLookup = {
    entry,
    source: body.source ?? "library",
    notice: body.notice,
  };
  lookupCache.set(key, result);
  return result;
}
