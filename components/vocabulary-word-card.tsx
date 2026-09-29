"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Volume2, Trash2, BookOpen, Quote, Plus, Minus, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import type { WordHistoryCard } from "./vocabulary-history";
import styles from "./vocabulary-history.module.css";
import searchStyles from "./answer-search.module.css";

export function VocabularyWordCard({ card, selected, onOpen, onUpdate, onDelete }: {
  card: WordHistoryCard; selected: boolean; onOpen: () => void;
  onUpdate: (changes: { checked?: boolean; language?: "en" | "hi" }) => void;
  onDelete: () => void;
}) {
  const id = useId();
  const { entry } = card;
  const hindi = card.language === "hi";
  const titled = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
  const title = titled(entry.word);
  const [audioMessage, setAudioMessage] = useState("");
  const speaking = useRef(false);
  useEffect(() => () => {
    if (speaking.current && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function hear() {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setAudioMessage("Audio playback is not supported in this browser."); return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(entry.word);
      utterance.lang = "en-US"; utterance.rate = 0.82;
      utterance.onend = () => { speaking.current = false; };
      utterance.onerror = event => {
        speaking.current = false;
        if (event.error !== "canceled" && event.error !== "interrupted") setAudioMessage("Audio could not play. Please try again.");
      };
      setAudioMessage(""); speaking.current = true;
      window.speechSynthesis.speak(utterance);
    } catch { speaking.current = false; setAudioMessage("Audio could not play. Please try again."); }
  }

  return <article className={styles.wordCard} data-selected={selected || undefined} data-learned={card.checked || undefined} aria-labelledby={`${id}-word`}>
    <header className={styles.wordHeader}>
      <h3 id={`${id}-word`} title={title}>{title}</h3>
      {entry.hindi && <span className={styles.headerHindiBadge} lang="hi">{entry.hindi}</span>}
      <p className={styles.pronunciation} title={`${hindi ? "उच्चारण" : "Pronunciation"}: ${entry.pronunciation || "Unavailable"}`}>
        <span className={searchStyles.srOnly}>{hindi ? "उच्चारण" : "Pronunciation"}: </span><span lang="en">{entry.pronunciation || "Unavailable"}</span>
      </p>
      <div className={styles.cardControls}>
        <Button type="button" variant="ghost" size="icon-xs" onClick={hear} aria-label={`Hear it: ${entry.word}`} title="Hear it"><Volume2 size={14} aria-hidden="true" /></Button>
        <Button type="button" variant="outline" size="xs" role="switch" aria-checked={hindi} aria-label={`Hindi for ${entry.word}`} onClick={() => onUpdate({ language: hindi ? "en" : "hi" })} className={styles.languageSwitch}>
          <span data-active={!hindi || undefined}>EN</span><span data-active={hindi || undefined}>HI</span>
        </Button>
      </div>
      <Checkbox className={styles.headerCheckbox} checked={card.checked ?? false} onCheckedChange={checked => onUpdate({ checked })} aria-label={`Mark ${entry.word} as learned`} title={hindi ? "सीख लिया" : "Learned"} />
    </header>
    <div className={styles.cardBody} tabIndex={0} role="region" aria-label={`Details for ${entry.word}`}>
    {audioMessage && <p className={styles.audioStatus} role="status">{audioMessage}</p>}
    <section className={styles.cardSection}>
      <h4><BookOpen size={13} aria-hidden="true" />{hindi ? "अर्थ" : "Meaning"}</h4>
      {hindi ? (
        <p lang="hi">{entry.hindi || "हिन्दी अर्थ अभी उपलब्ध नहीं है।"}</p>
      ) : (
        <>
          <p lang="en">{entry.meaning}</p>
          {entry.hindi && <p lang="hi" className={styles.hindiSubMeaning}>{entry.hindi}</p>}
        </>
      )}
    </section>
    <section className={`${styles.cardSection} ${styles.sentence}`}>
      <h4><Quote size={13} aria-hidden="true" />{hindi ? (entry.sentenceHindi ? "वाक्य में" : "अंग्रेज़ी वाक्य") : "Sentence"}</h4>
      {hindi && entry.sentenceHindi ? (
        <p lang="hi">{entry.sentenceHindi}</p>
      ) : (
        <>
          <p lang="en">{entry.sentence || "An example sentence is unavailable for this entry."}</p>
          {entry.sentenceHindi && <p lang="hi" className={styles.hindiSubSentence}>{entry.sentenceHindi}</p>}
        </>
      )}
    </section>
    {(["synonyms", "antonyms"] as const).map(kind => <section className={`${styles.cardSection} ${styles.relatedWords}`} data-kind={kind} key={kind}>
      <h4>{kind === "synonyms" ? <Plus size={13} aria-hidden="true" /> : <Minus size={13} aria-hidden="true" />}{kind === "synonyms" ? (hindi ? "समानार्थी" : "Synonyms") : (hindi ? "विलोम" : "Antonyms")} <span>{entry[kind].length}</span></h4>
      {entry[kind].length ? <ul>{entry[kind].map(pair => <li key={pair.word}>
        {/* In Hindi the gloss leads and the English word follows it, so the
            list reads in the card's own language; a word with no gloss keeps
            the English word as its heading rather than showing a blank. */}
        {hindi && pair.hindi
          ? <><strong lang="hi">{pair.hindi}</strong><span lang="en">{titled(pair.word)}</span></>
          : <><strong lang="en">{titled(pair.word)}</strong>{hindi && <span lang="hi">हिन्दी अर्थ उपलब्ध नहीं है</span>}</>}
      </li>)}</ul> : <p>{hindi ? "इस अर्थ के लिए कोई शब्द सूचीबद्ध नहीं है।" : `No ${kind} listed for this meaning.`}</p>}
    </section>)}
    </div>
    <footer className={styles.cardFooter}>
      <div className={styles.cardMeta}>
        <span className={styles.learningStatus} data-learned={card.checked || undefined}>{card.checked ? <Check size={12} aria-hidden="true" /> : <BookOpen size={12} aria-hidden="true" />}{card.checked ? (hindi ? "सीख लिया" : "Learned") : (hindi ? "अभ्यास करें" : "Practicing")}</span>
      </div>
      <div className={styles.cardActions}>
      <Button type="button" variant="ghost" size="xs" aria-label={`Open ${entry.word}`} onClick={onOpen}>Open<ArrowUpRight size={13} aria-hidden="true" /></Button>
      <Button type="button" variant="ghost" size="xs" className={styles.deleteCard} aria-label={`Delete ${entry.word}`} onClick={onDelete}><Trash2 size={13} aria-hidden="true" />{hindi ? "हटाएँ" : "Delete"}</Button>
      </div>
    </footer>
  </article>;
}
