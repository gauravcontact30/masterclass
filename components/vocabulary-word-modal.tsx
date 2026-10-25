"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Volume2, BookOpen, Quote, Plus, Minus, Bookmark, BookmarkCheck, ArrowUpRight, X, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { WordLookup, EnglishWord } from "@/lib/english-word";
import {
  fetchWordDetails,
  getCachedWordLookup,
  prefetchWordDetails,
  saveWordToVocabulary,
  removeWordFromVocabulary,
  isWordSavedInVocabulary,
  VOCABULARY_UPDATED_EVENT,
} from "@/lib/vocabulary-storage";
import styles from "./vocabulary-word-modal.module.css";
import { ListenButton } from "./listen-button";

export interface VocabularyWordModalProps {
  word: string | null;
  initialLookup?: WordLookup | null;
  isOpen: boolean;
  onClose: () => void;
  onWordChange?: (word: string) => void;
}

export function VocabularyWordModal({
  word,
  initialLookup,
  isOpen,
  onClose,
  onWordChange,
}: VocabularyWordModalProps) {
  const [currentWord, setCurrentWord] = useState<string>(word ?? "");
  const [lookup, setLookup] = useState<WordLookup | null>(
    () => initialLookup ?? (word ? getCachedWordLookup(word) : null)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [audioMessage, setAudioMessage] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const speakingRef = useRef(false);

  // Sync internal state when prop changes
  useEffect(() => {
    if (word && word !== currentWord) {
      queueMicrotask(() => {
        setCurrentWord(word);
        const cached = initialLookup ?? getCachedWordLookup(word);
        if (cached) {
          setLookup(cached);
          setLoading(false);
          setError(null);
        }
      });
    }
  }, [word, currentWord, initialLookup]);

  useEffect(() => {
    if (initialLookup) {
      queueMicrotask(() => {
        setLookup(initialLookup);
        setLoading(false);
        setError(null);
      });
    }
  }, [initialLookup]);

  // Warm-up cache for related synonyms/antonyms in the background
  useEffect(() => {
    if (lookup?.entry) {
      for (const item of lookup.entry.synonyms.slice(0, 3)) {
        prefetchWordDetails(item.word).catch(() => {});
      }
      for (const item of lookup.entry.antonyms.slice(0, 3)) {
        prefetchWordDetails(item.word).catch(() => {});
      }
    }
  }, [lookup]);

  // Check saved state whenever word or storage changes
  const checkSaved = useCallback((targetWord: string) => {
    if (!targetWord) return;
    setIsSaved(isWordSavedInVocabulary(targetWord));
  }, []);

  useEffect(() => {
    if (currentWord) {
      queueMicrotask(() => checkSaved(currentWord));
    }

    function handleVocabChange() {
      if (currentWord) {
        checkSaved(currentWord);
      }
    }

    window.addEventListener(VOCABULARY_UPDATED_EVENT, handleVocabChange);
    return () => window.removeEventListener(VOCABULARY_UPDATED_EVENT, handleVocabChange);
  }, [currentWord, checkSaved]);

  // Fetch word details if initialLookup doesn't match current word
  const loadWord = useCallback(
    async (targetWord: string) => {
      const clean = targetWord.trim();
      if (!clean) return;

      if (
        initialLookup &&
        initialLookup.entry.word.toLowerCase() === clean.toLowerCase()
      ) {
        setLookup(initialLookup);
        setLoading(false);
        setError(null);
        return;
      }

      const cached = getCachedWordLookup(clean);
      if (cached) {
        setLookup(cached);
        setLoading(false);
        setError(null);
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      setAudioMessage("");

      try {
        const data = await fetchWordDetails(clean, controller.signal);
        if (!controller.signal.aborted) {
          setLookup(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Unable to look up word details right now."
          );
          setLoading(false);
        }
      }
    },
    [initialLookup]
  );

  useEffect(() => {
    if (isOpen && currentWord) {
      queueMicrotask(() => {
        loadWord(currentWord);
      });
    } else if (!isOpen) {
      abortControllerRef.current?.abort();
      queueMicrotask(() => {
        setLoading(false);
        setError(null);
        setAudioMessage("");
      });
      if (speakingRef.current && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        speakingRef.current = false;
      }
    }
  }, [isOpen, currentWord, loadWord]);

  // Keyboard navigation: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Audio pronunciation
  function hear(textToSpeak: string) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setAudioMessage("Audio playback is not supported in this browser.");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = "en-US";
      utterance.rate = 0.82;
      utterance.onend = () => {
        speakingRef.current = false;
      };
      utterance.onerror = (e) => {
        speakingRef.current = false;
        if (e.error !== "canceled" && e.error !== "interrupted") {
          setAudioMessage("Audio playback failed. Please try again.");
        }
      };
      setAudioMessage("");
      speakingRef.current = true;
      window.speechSynthesis.speak(utterance);
    } catch {
      speakingRef.current = false;
      setAudioMessage("Audio playback failed. Please try again.");
    }
  }

  // Bookmark toggle
  function handleBookmarkToggle() {
    if (!lookup) return;
    const wordKey = lookup.entry.word;
    if (isSaved) {
      const removed = removeWordFromVocabulary(wordKey);
      if (removed) {
        setIsSaved(false);
        toast(`Removed “${wordKey}” from Vocabulary`, {
          action: {
            label: "Undo",
            onClick: () => {
              saveWordToVocabulary(lookup);
              setIsSaved(true);
            },
          },
        });
      }
    } else {
      const saved = saveWordToVocabulary(lookup);
      if (saved) {
        setIsSaved(true);
        toast.success(`Bookmarked “${wordKey}” to Vocabulary page!`);
      } else {
        toast.error("Could not save to Vocabulary. Storage may be full.");
      }
    }
  }

  function handleSubWordClick(subWord: string) {
    setCurrentWord(subWord);
    onWordChange?.(subWord);
  }

  if (!isOpen) return null;

  const entry: EnglishWord | undefined = lookup?.entry;
  const titledWord = currentWord ? currentWord.charAt(0).toUpperCase() + currentWord.slice(1) : "";

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vocab-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconCircle} aria-hidden="true">
              <BookOpen size={20} />
            </div>
            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h2 id="vocab-modal-title" className={styles.title}>
                  {entry?.word ? entry.word.charAt(0).toUpperCase() + entry.word.slice(1) : titledWord}
                </h2>
                {entry?.hindi && (
                  <span className={styles.hindiBadge} lang="hi">
                    {entry.hindi}
                  </span>
                )}
                {(entry?.word || currentWord) && (
                  <button
                    type="button"
                    className={styles.titleHearButton}
                    onClick={() => hear(entry?.word || currentWord)}
                    aria-label={`Hear pronunciation of ${entry?.word || currentWord}`}
                    title={`Listen to pronunciation of ${entry?.word || currentWord}`}
                  >
                    <Volume2 size={15} aria-hidden="true" />
                    <span className={styles.hearButtonLabel}>Hear it</span>
                  </button>
                )}
                {entry?.word && <ListenButton id={`word:${entry.word}`} title={entry.word} text={button => (button.closest("[aria-labelledby='vocab-modal-title']") as HTMLElement | null)?.innerText.replace(/Hear it|Listen|Pause|Resume/g, " ") ?? entry.word} compact />}
              </div>
              <div className={styles.subMeta}>
                {entry?.pronunciation && (
                  <span className={styles.pronunciationText} title="Pronunciation">
                    /{entry.pronunciation}/
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close word details"
          >
            <X size={18} />
          </button>
        </header>

        {/* Body */}
        <div className={styles.body}>
          {loading && (
            <div className={styles.loadingBox} role="status">
              <Loader2 size={26} className={styles.spinner} />
              <span>Looking up “{currentWord}” details…</span>
            </div>
          )}

          {error && !loading && (
            <div className={styles.errorBox} role="alert">
              <p>{error}</p>
              <button
                type="button"
                className={styles.hearButton}
                onClick={() => loadWord(currentWord)}
              >
                <RefreshCw size={13} />
                Try again
              </button>
            </div>
          )}

          {!loading && !error && entry && (
            <>
              {/* Meaning Section */}
              <section className={styles.meaningCard}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardHeadTitle}>
                    <BookOpen size={13} aria-hidden="true" />
                    Meaning · अर्थ
                  </h3>
                  <button
                    type="button"
                    className={styles.hearButton}
                    onClick={() => hear(entry.word)}
                    aria-label={`Hear pronunciation of ${entry.word}`}
                  >
                    <Volume2 size={13} aria-hidden="true" />
                    Hear pronunciation
                  </button>
                </div>
                {audioMessage && (
                  <small style={{ color: "#a8631c", fontSize: 11 }}>{audioMessage}</small>
                )}
                <p className={styles.meaningEnglish}>{entry.meaning}</p>
                {entry.hindi && (
                  <p className={styles.meaningHindi} lang="hi">
                    {entry.hindi}
                  </p>
                )}
              </section>

              {/* Example Sentence Section */}
              <section className={styles.sentenceCard}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardHeadTitle} style={{ color: "#8a5a12" }}>
                    <Quote size={13} aria-hidden="true" />
                    Example Sentence · वाक्य में प्रयोग
                  </h3>
                  {entry.sentence && (
                    <button
                      type="button"
                      className={styles.hearButton}
                      onClick={() => hear(entry.sentence)}
                      aria-label="Hear example sentence"
                    >
                      <Volume2 size={13} aria-hidden="true" />
                      Hear sentence
                    </button>
                  )}
                </div>
                <p className={styles.sentenceEnglish}>
                  “{entry.sentence || "No example sentence recorded for this word."}”
                </p>
                {entry.sentenceHindi && (
                  <p className={styles.sentenceHindi} lang="hi">
                    “{entry.sentenceHindi}”
                  </p>
                )}
              </section>

              {/* Synonyms & Antonyms Grid */}
              <div className={styles.pairsGrid}>
                {/* Synonyms */}
                <section className={styles.relationCard} data-kind="synonyms">
                  <div className={styles.cardHead}>
                    <h3 className={styles.relationTitle}>
                      <Plus size={13} aria-hidden="true" />
                      Synonyms · समानार्थी
                    </h3>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#4f6536" }}>
                      {entry.synonyms.length}
                    </span>
                  </div>
                  {entry.synonyms.length > 0 ? (
                    <ul className={styles.pillsList}>
                      {entry.synonyms.map((item, index) => (
                        <li key={index} className={styles.pillGroup}>
                          <button
                            type="button"
                            className={styles.pillItem}
                            onClick={() => handleSubWordClick(item.word)}
                            title={`Click to explore ${item.word}`}
                          >
                            <strong>{item.word}</strong>
                            {item.hindi && <span lang="hi">({item.hindi})</span>}
                          </button>
                          <button
                            type="button"
                            className={styles.pillAudioButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              hear(item.word);
                            }}
                            aria-label={`Hear pronunciation of ${item.word}`}
                            title={`Hear pronunciation: ${item.word}`}
                          >
                            <Volume2 size={12} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptyText}>No direct synonyms recorded.</p>
                  )}
                </section>

                {/* Antonyms */}
                <section className={styles.relationCard} data-kind="antonyms">
                  <div className={styles.cardHead}>
                    <h3 className={styles.relationTitle}>
                      <Minus size={13} aria-hidden="true" />
                      Antonyms · विलोम शब्द
                    </h3>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#93473b" }}>
                      {entry.antonyms.length}
                    </span>
                  </div>
                  {entry.antonyms.length > 0 ? (
                    <ul className={styles.pillsList}>
                      {entry.antonyms.map((item, index) => (
                        <li key={index} className={styles.pillGroup}>
                          <button
                            type="button"
                            className={styles.pillItem}
                            onClick={() => handleSubWordClick(item.word)}
                            title={`Click to explore ${item.word}`}
                          >
                            <strong>{item.word}</strong>
                            {item.hindi && <span lang="hi">({item.hindi})</span>}
                          </button>
                          <button
                            type="button"
                            className={styles.pillAudioButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              hear(item.word);
                            }}
                            aria-label={`Hear pronunciation of ${item.word}`}
                            title={`Hear pronunciation: ${item.word}`}
                          >
                            <Volume2 size={12} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptyText}>No direct antonyms recorded.</p>
                  )}
                </section>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <div>
            <button
              type="button"
              className={styles.bookmarkButton}
              data-bookmarked={isSaved ? "true" : undefined}
              onClick={handleBookmarkToggle}
              disabled={loading || !lookup}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck size={16} aria-hidden="true" />
                  Saved in Vocabulary
                </>
              ) : (
                <>
                  <Bookmark size={16} aria-hidden="true" />
                  Bookmark to Vocabulary Page
                </>
              )}
            </button>
          </div>

          <div className={styles.footerActions}>
            <Link
              href="/learning/vocabulary"
              className={styles.vocabPageLink}
              onClick={onClose}
            >
              <Sparkles size={14} aria-hidden="true" />
              Go to Vocabulary Page
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className={styles.closeSecondary}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
