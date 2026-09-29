"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { BookOpen, LoaderCircle, Search, Volume2, X, CornerDownLeft } from "lucide-react";
import { englishWordSchema, isPhrase, wordQuerySchema, MAX_PHRASE_TERMS, type WordLookup } from "@/lib/english-word";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "./ui/input-group";
import styles from "./english-word-search.module.css";
import { VocabularyHistory, readWordHistory, saveWordHistory, type WordHistoryCard } from "./vocabulary-history";
import { VOCABULARY_UPDATED_EVENT } from "@/lib/vocabulary-storage";
import { triggerWordLookup } from "./vocabulary-lookup-provider";

// Headwords, phrases and related words arrive lowercase from every source; the
// card presents them sentence-cased, as the saved word cards already do. Only
// the first letter is raised, so "break the ice" reads as a phrase rather than
// as a title.
const titled = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

const errors: Record<string, string> = {
  word_not_found: "That word was not found. Check the spelling and try again.",
  phrase_not_found: "That phrase was not recognised. Check the wording, or look the words up one at a time.",
  phrase_lookup_unavailable: "Phrase meanings are unavailable right now. A single word will still look up.",
  invalid_request: `Enter an English word, or a phrase of up to ${MAX_PHRASE_TERMS} words, using letters, hyphens or apostrophes.`,
  rate_limited: "You’ve looked up several words. Please wait a minute and try again.",
  signin_required: "Please sign in again to look up a word.",
};

export function EnglishWordSearch({ historyKey }: { historyKey?: string } = {}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<WordLookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [audioMessage, setAudioMessage] = useState("");
  const request = useRef<AbortController | null>(null);
  const speaking = useRef(false);
  const [history, setHistory] = useState<WordHistoryCard[]>([]);
  const historyRef = useRef<WordHistoryCard[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  useEffect(() => {
    historyRef.current = historyKey ? readWordHistory(historyKey) : [];
    // Restore only after hydration, when browser storage is available.
    setHistory(historyRef.current);
  }, [historyKey]);

  useEffect(() => {
    function handleVocabUpdated() {
      if (historyKey) {
        const next = readWordHistory(historyKey);
        historyRef.current = next;
        setHistory(next);
        setHistoryVersion(v => v + 1);
      }
    }
    window.addEventListener(VOCABULARY_UPDATED_EVENT, handleVocabUpdated);
    return () => window.removeEventListener(VOCABULARY_UPDATED_EVENT, handleVocabUpdated);
  }, [historyKey]);

  function updateHistory(word: string, changes: { checked?: boolean; language?: "en" | "hi" }) {
    const next = historyRef.current.map(card => card.entry.word === word ? { ...card, ...changes } : card);
    historyRef.current = next;
    setHistory(next);
    if (historyKey) saveWordHistory(historyKey, next);
  }

  function deleteHistory(word: string) {
    const removed = historyRef.current.find(card => card.entry.word === word);
    if (!removed || !historyKey) return;
    const next = historyRef.current.filter(card => card !== removed);
    historyRef.current = next;
    setHistory(next);
    saveWordHistory(historyKey, next);
    if (result?.entry.word === word) setResult(null);
    toast(`Removed ${word} from your vocabulary`, {
      duration: 8000,
      action: { label: "Undo", onClick: () => {
        // Keep changes made after deletion, including a fresh lookup of this word.
        if (historyRef.current.some(card => card.entry.word.toLowerCase() === word.toLowerCase())) return;
        const restored = [...historyRef.current, removed].sort((a, b) => b.at - a.at).slice(0, 150);
        historyRef.current = restored;
        setHistory(restored);
        saveWordHistory(historyKey, restored);
      } },
    });
  }

  function openSaved(saved: WordLookup) {
    request.current?.abort();
    setBusy(false); setError(""); setAudioMessage("");
    setQuery(saved.entry.word); setResult(saved);
    triggerWordLookup(saved.entry.word, saved);
  }
  useEffect(() => () => {
    request.current?.abort();
    if (speaking.current && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  async function lookup(event: FormEvent) {
    event.preventDefault();
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const parsed = wordQuerySchema.safeParse({ word: query });
    setResult(null); setAudioMessage(""); setError("");
    if (!parsed.success) { setError(errors.invalid_request); setBusy(false); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/pro-learn/word", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data), signal: controller.signal,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "word_lookup_unavailable");
      const entry = englishWordSchema.parse(body.entry);
      if (!controller.signal.aborted) {
        const lookup: WordLookup = { entry, source: body.source, notice: body.notice };
        setResult(lookup);
        if (historyKey) {
          const previous = historyRef.current.find(item => item.entry.word.toLowerCase() === entry.word.toLowerCase());
          const card = { ...lookup, at: Date.now(), checked: previous?.checked, language: previous?.language };
          const next = [card, ...historyRef.current.filter(item => item.entry.word.toLowerCase() !== entry.word.toLowerCase())].slice(0, 150);
          historyRef.current = next;
          setHistory(next);
          saveWordHistory(historyKey, next);
          setHistoryVersion(version => version + 1);
        }
      }
    } catch (failure) {
      if (!controller.signal.aborted) setError(errors[failure instanceof Error ? failure.message : ""] ?? "Word lookup is unavailable right now. Please try again.");
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }

  function hearWord() {
    if (!result) return;
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setAudioMessage("Audio playback is not supported in this browser."); return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(result.entry.word);
      utterance.lang = "en-US"; utterance.rate = 0.82;
      utterance.onend = () => { speaking.current = false; };
      utterance.onerror = event => {
        speaking.current = false;
        if (event.error !== "canceled" && event.error !== "interrupted") setAudioMessage("Audio could not play. Please try Hear it again.");
      };
      speaking.current = true; setAudioMessage("");
      window.speechSynthesis.speak(utterance);
    } catch { speaking.current = false; setAudioMessage("Audio could not play in this browser."); }
  }

  const entry = result?.entry;
  return <>
    {historyKey && <VocabularyHistory key={historyVersion} cards={history} selectedWord={result?.entry.word} onOpen={openSaved} onUpdate={updateHistory} onDelete={deleteHistory} />}
    <section className={styles.panel} aria-labelledby={`${id}-heading`}>
    <header className={styles.header}><h2 id={`${id}-heading`}><BookOpen size={17} aria-hidden="true" />English word finder</h2><span>English <span aria-hidden="true">↔</span> <span lang="hi">हिन्दी</span></span></header>
    <p className={styles.intro}>Look up a word — or several together, such as <em>break the ice</em> — hear it, and build your vocabulary.</p>
    <form className={styles.form} onSubmit={lookup} role="search" aria-label="English word or phrase lookup">
      <InputGroup className={styles.field}>
        <InputGroupAddon><Search size={18} aria-hidden="true" /></InputGroupAddon>
        <InputGroupInput type="search" aria-label="Search an English word or phrase" value={query} maxLength={80} onChange={event => setQuery(event.target.value)} placeholder="Try articulate, resilient, or break the ice" autoCapitalize="none" spellCheck={false} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
        {query && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear word search" onClick={() => setQuery("")}><X size={14} /></InputGroupButton></InputGroupAddon>}
      </InputGroup>
      <Button className={styles.search} type="submit" disabled={!query.trim()}>{busy ? <LoaderCircle size={15} className={styles.spinner} aria-hidden="true" /> : null}Look up<CornerDownLeft size={15} aria-hidden="true" /></Button>
    </form>
    {busy && <p className={styles.status} role="status">{isPhrase(query) ? "Looking up the phrase" : "Looking up"} “{query.trim().replace(/\s+/g, " ")}”…</p>}
    {error && <p className={styles.error} id={`${id}-error`} role="alert">{error}</p>}
    {entry && <section className={styles.result} aria-live="polite" aria-labelledby={`${id}-result`}>
      <div className={styles.wordHead}>
        <div className={styles.headText}>
          <h3 id={`${id}-result`}>{titled(entry.word)}</h3>
          {isPhrase(entry.word) && <p className={styles.phraseNote}>Meaning of these words together</p>}
          <p className={styles.phonetic}><span>Pronunciation</span><span>{entry.pronunciation || "Unavailable"}</span></p>
        </div>
        <Button type="button" variant="outline" className={styles.hear} onClick={hearWord} aria-label={`Hear it: ${entry.word}`}><Volume2 size={15} aria-hidden="true" />Hear it</Button>
      </div>
      <div className={styles.body}>
        {audioMessage && <p role="status" className={styles.status}>{audioMessage}</p>}
        <section className={styles.meaning}><h4>Meaning</h4><p>{entry.meaning}</p><p lang="hi">{entry.hindi || "हिन्दी अर्थ अभी उपलब्ध नहीं है।"}</p></section>
        <section className={styles.sentence}><h4>In a sentence</h4><p>{entry.sentence || "An example sentence is unavailable for this entry."}</p></section>
        <div className={styles.pairs}>{(["synonyms", "antonyms"] as const).map(kind => <section key={kind} className={styles.related} data-kind={kind}>
          <h4>{kind === "synonyms" ? "Synonyms" : "Antonyms"} <span lang="hi">{kind === "synonyms" ? "समानार्थी" : "विलोम"}</span> <span>{entry[kind].length}</span></h4>
          {entry[kind].length ? <ul>{entry[kind].map(pair => <li key={pair.word}><strong>{titled(pair.word)}</strong><span lang="hi">{pair.hindi || "हिन्दी अर्थ उपलब्ध नहीं है"}</span></li>)}</ul>
            : <p>No {kind} listed for this meaning.</p>}
        </section>)}</div>
      </div>
    </section>}
  </section></>;
}
