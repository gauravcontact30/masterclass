"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { BookOpen, Loader2 } from "lucide-react";
import type { WordLookup } from "@/lib/english-word";
import styles from "./vocabulary-lookup-floating.module.css";

// This provider wraps every page from the root layout. vocabulary-storage pulls
// in zod (~400 KB raw), so it and the modal load on the first lookup, never up front.
const loadStorage = () => import("@/lib/vocabulary-storage");
const VocabularyWordModal = dynamic(() => import("./vocabulary-word-modal").then(m => m.VocabularyWordModal), { ssr: false });

export const OPEN_WORD_LOOKUP_EVENT = "masterclass:open-word-lookup";

export interface VocabularyLookupContextValue {
  openWordLookup: (word: string, initialLookup?: WordLookup | null) => Promise<void> | void;
  closeWordLookup: () => void;
}

const VocabularyLookupContext = createContext<VocabularyLookupContextValue | null>(null);

export function useVocabularyLookup() {
  const context = useContext(VocabularyLookupContext);
  if (!context) {
    return {
      openWordLookup: (word: string) => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(OPEN_WORD_LOOKUP_EVENT, { detail: { word } })
          );
        }
      },
      closeWordLookup: () => {},
    };
  }
  return context;
}

/**
 * Global trigger that can be called from anywhere without hooks.
 */
export function triggerWordLookup(word: string, initialLookup?: WordLookup | null) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(OPEN_WORD_LOOKUP_EVENT, { detail: { word, initialLookup } })
    );
  }
}

export function VocabularyLookupProvider({ children }: { children: ReactNode }) {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [initialLookup, setInitialLookup] = useState<WordLookup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pillLoading, setPillLoading] = useState(false);

  // Floating selection pill state
  const [selectionWord, setSelectionWord] = useState<string | null>(null);
  const [pillCoords, setPillCoords] = useState<{ x: number; y: number } | null>(null);
  const pillRef = useRef<HTMLButtonElement | null>(null);

  const openWordLookup = useCallback(async (word: string, lookup?: WordLookup | null) => {
    const clean = word.trim().replace(/[.,!?;:()"'“”‘’]/g, "");
    if (!clean) return;

    const { getCachedWordLookup, prefetchWordDetails } = await loadStorage();
    // Check if details are already provided or in cache
    const existing = lookup ?? getCachedWordLookup(clean);
    if (existing) {
      setActiveWord(clean);
      setInitialLookup(existing);
      setIsModalOpen(true);
      setSelectionWord(null);
      setPillCoords(null);
      setPillLoading(false);
      return;
    }

    // Prefetch/fetch first so the modal opens with all details already pre-populated
    setPillLoading(true);
    try {
      const data = await prefetchWordDetails(clean);
      setActiveWord(clean);
      setInitialLookup(data);
      setIsModalOpen(true);
    } catch {
      // In case of error, still open so user sees error and retry button
      setActiveWord(clean);
      setInitialLookup(null);
      setIsModalOpen(true);
    } finally {
      setPillLoading(false);
      setSelectionWord(null);
      setPillCoords(null);
    }
  }, []);

  const closeWordLookup = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Listen to custom global events
  useEffect(() => {
    function handleEvent(event: Event) {
      const custom = event as CustomEvent<{ word?: string; initialLookup?: WordLookup }>;
      if (custom.detail?.word) {
        openWordLookup(custom.detail.word, custom.detail.initialLookup);
      }
    }

    window.addEventListener(OPEN_WORD_LOOKUP_EVENT, handleEvent);
    return () => window.removeEventListener(OPEN_WORD_LOOKUP_EVENT, handleEvent);
  }, [openWordLookup]);

  // Handle text selection in learning views
  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      // Don't trigger if clicked inside the floating pill or modal
      if (pillRef.current?.contains(e.target as Node)) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionWord(null);
        setPillCoords(null);
        return;
      }

      const raw = selection.toString().trim();
      // Valid words: 1 to 4 words, 2 to 45 chars, letters/hyphens/spaces/apostrophes
      const words = raw.split(/\s+/);
      const isEnglishWordOrPhrase =
        words.length <= 4 &&
        raw.length >= 2 &&
        raw.length <= 45 &&
        /^[a-zA-Z\s'-]+$/.test(raw);

      if (isEnglishWordOrPhrase) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          setPillCoords({
            x: Math.round(rect.left + rect.width / 2),
            y: Math.max(12, Math.round(rect.top)),
          });
          setSelectionWord(raw);
          // Prefetch in background during user reaction time so modal opens pre-populated
          loadStorage().then(({ prefetchWordDetails }) => prefetchWordDetails(raw)).catch(() => {});
          return;
        }
      }

      setSelectionWord(null);
      setPillCoords(null);
    }

    function handleMouseDown(e: MouseEvent) {
      if (pillRef.current?.contains(e.target as Node)) {
        return;
      }
      setSelectionWord(null);
      setPillCoords(null);
    }

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return (
    <VocabularyLookupContext.Provider value={{ openWordLookup, closeWordLookup }}>
      {children}

      {/* Floating selection lookup pill */}
      {selectionWord && pillCoords && (
        <button
          ref={pillRef}
          type="button"
          className={styles.floatingPill}
          disabled={pillLoading}
          style={{
            left: `${pillCoords.x}px`,
            top: `${pillCoords.y}px`,
          }}
          onMouseDown={(e) => {
            // Prevent clearing the selection before click fires
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!pillLoading) {
              openWordLookup(selectionWord);
            }
          }}
          aria-label={`Look up “${selectionWord}” in Vocabulary`}
        >
          <span className={styles.pillIcon}>
            {pillLoading ? (
              <Loader2 size={14} className={styles.spinner} aria-hidden="true" />
            ) : (
              <BookOpen size={14} aria-hidden="true" />
            )}
          </span>
          <span className={styles.pillText}>“{selectionWord}”</span>
          <span className={styles.pillSub}>
            {pillLoading ? "· अर्थ लोड हो रहा है…" : "· अर्थ व विवरण देखें"}
          </span>
        </button>
      )}

      {/* On-the-fly Vocabulary Modal: mounted from the first lookup on, so its chunk loads only then */}
      {activeWord !== null && <VocabularyWordModal
        word={activeWord}
        initialLookup={initialLookup}
        isOpen={isModalOpen}
        onClose={closeWordLookup}
        onWordChange={(newWord) => setActiveWord(newWord)}
      />}
    </VocabularyLookupContext.Provider>
  );
}
