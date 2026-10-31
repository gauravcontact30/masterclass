"use client";
import { ContentImage } from "./content-image";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Volume2, Trash2, Plus, Minus, GripVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { VocabularyWordIcon } from "./vocabulary-word-icon";
import { vocabularyImageUrl } from "@/lib/vocabulary-image";
import type { WordHistoryCard } from "./vocabulary-history";
import styles from "./vocabulary-history.module.css";
import searchStyles from "./answer-search.module.css";

/**
 * A picture flashcard: a scene that shows the word's meaning on top, and a dark
 * caption underneath with the word, its meaning in both languages and the
 * sentence. The picture does the remembering; the caption does the explaining.
 */
export function VocabularyWordCard({ card, selected, onOpen, onUpdate, onDelete, dragProps }: {
  card: WordHistoryCard; selected: boolean; onOpen: () => void;
  onUpdate: (changes: { checked?: boolean; language?: "en" | "hi" }) => void;
  onDelete: () => void;
  dragProps?: {
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
  };
}) {
  const id = useId();
  const { entry } = card;
  const hindi = card.language === "hi";
  const titled = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
  const title = titled(entry.word);
  const imageUrl = vocabularyImageUrl(entry.word);
  // A word that has no picture yet (a dictionary or AI lookup, or a library
  // word the generator has not reached) keeps its icon instead of a broken image.
  const [imageFailed, setImageFailed] = useState(false);
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
    <div className={styles.flashPicture}>
      {imageUrl && !imageFailed
        ? <ContentImage src={imageUrl} alt={`A scene showing the meaning of “${entry.word}”`} loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
        : <div className={styles.flashFallback} aria-hidden="true"><VocabularyWordIcon word={entry.word} meaning={entry.meaning} size={56} /></div>}
      <div className={styles.flashOverlay}>
        <div
          className={styles.cardDragHandle}
          title="Drag to reposition card"
          aria-label="Drag to reposition card"
          draggable
          onDragStart={dragProps?.onDragStart}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} aria-hidden="true" />
        </div>
        <label className={styles.learnedToggle} title={hindi ? "सीख लिया" : "Learned"}>
          <Checkbox className={styles.headerCheckbox} id={`${id}-checkbox`} checked={card.checked ?? false} onCheckedChange={checked => onUpdate({ checked })} aria-label={`Mark ${entry.word} as learned`} />
          <span className={styles.learnedLabelText}>{card.checked ? (hindi ? "सीख लिया" : "Learned") : (hindi ? "सीखें" : "Learned")}</span>
        </label>
      </div>
    </div>
    <div className={styles.flashCaption}>
      <header className={styles.flashHead}>
        <h3 id={`${id}-word`} title={title} className={styles.wordTitle}>{title}</h3>
        <p className={styles.pronunciation} title={`${hindi ? "उच्चारण" : "Pronunciation"}: ${entry.pronunciation || "Unavailable"}`}>
          <span className={searchStyles.srOnly}>{hindi ? "उच्चारण" : "Pronunciation"}: </span><span lang="en" className={styles.pronunciationText}>{entry.pronunciation || "Unavailable"}</span>
        </p>
      </header>
      <div className={styles.cardBody} tabIndex={0} role="region" aria-label={`Details for ${entry.word}`}>
        {audioMessage && <p className={styles.audioStatus} role="status">{audioMessage}</p>}
        {hindi ? (
          <p lang="hi" className={styles.flashMeaning}>{entry.hindi || "हिन्दी अर्थ अभी उपलब्ध नहीं है।"}</p>
        ) : (
          <>
            <p lang="en" className={styles.flashMeaning}>{entry.meaning}</p>
            {entry.hindi && <p lang="hi" className={styles.hindiSubMeaning}>{entry.hindi}</p>}
          </>
        )}
        <div className={styles.sentence}>
          <span className={searchStyles.srOnly}>{hindi ? "वाक्य में" : "Sentence"}: </span>
          {hindi && entry.sentenceHindi ? (
            <p lang="hi">{entry.sentenceHindi}</p>
          ) : (
            <>
              <p lang="en">{entry.sentence || "An example sentence is unavailable for this entry."}</p>
              {entry.sentenceHindi && <p lang="hi" className={styles.hindiSubSentence}>{entry.sentenceHindi}</p>}
            </>
          )}
        </div>
        {(["synonyms", "antonyms"] as const).map(kind => entry[kind].length > 0 && <section className={styles.relatedWords} data-kind={kind} key={kind}>
          <h4>{kind === "synonyms" ? <Plus size={12} aria-hidden="true" /> : <Minus size={12} aria-hidden="true" />}{kind === "synonyms" ? (hindi ? "समानार्थी" : "Synonyms") : (hindi ? "विलोम" : "Antonyms")} <span>{entry[kind].length}</span></h4>
          <ul>{entry[kind].map(pair => <li key={pair.word}>
            {/* In Hindi the gloss leads and the English word follows it, so the
                list reads in the card's own language. */}
            {hindi && pair.hindi
              ? <><strong lang="hi">{pair.hindi}</strong><span lang="en">{titled(pair.word)}</span></>
              : <strong lang="en">{titled(pair.word)}</strong>}
          </li>)}</ul>
        </section>)}
      </div>
      <footer className={styles.cardFooter}>
        <div className={styles.cardControls}>
          <Button type="button" variant="outline" size="xs" onClick={hear} aria-label={`Hear it: ${entry.word}`} title="Hear it" className={styles.hearButton}><Volume2 size={13} aria-hidden="true" /><span>Hear it</span></Button>
          <Button type="button" variant="outline" size="xs" role="switch" aria-checked={hindi} aria-label={`Hindi for ${entry.word}`} onClick={() => onUpdate({ language: hindi ? "en" : "hi" })} className={styles.languageSwitch} title={hindi ? "अंग्रेज़ी में देखें" : "Switch to Hindi"}>
            <span data-active={!hindi || undefined}>EN</span><span data-active={hindi || undefined}>HI</span>
          </Button>
        </div>
        <div className={styles.cardActions}>
          <Button type="button" variant="ghost" size="xs" aria-label={`Open ${entry.word}`} onClick={onOpen}>Open<ArrowUpRight size={13} aria-hidden="true" /></Button>
          <Button type="button" variant="ghost" size="xs" className={styles.deleteCard} aria-label={`Delete ${entry.word}`} onClick={onDelete}><Trash2 size={13} aria-hidden="true" />{hindi ? "हटाएँ" : "Delete"}</Button>
        </div>
      </footer>
    </div>
  </article>;
}
