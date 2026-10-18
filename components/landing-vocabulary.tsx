"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Equal, EqualNot, Quote, Sparkles, Volume2 } from "lucide-react";
import type { DailyWord, LockedTeaser, RelatedWord } from "@/lib/landing-daily-types";
import { DashboardMore } from "./dashboard-more";
import { LockedCard } from "./landing-locked-card";
import { vocabularyImageUrl } from "@/lib/vocabulary-image";
import { useLanguage } from "./language-provider";
import { usePagedCarousel } from "./use-paged-carousel";
import { AUTOPLAY_MS, Controls, Dots, dayLabel, PREVIEW_COUNT } from "./landing-ai-pulse";
import home from "./landing-home.module.css";
import pulse from "./landing-ai-pulse.module.css";
import styles from "./landing-vocabulary.module.css";

const headword = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * Today's twelve English words, three cards a screen, chosen afresh each day on the server
 * (lib/server/landing-daily.ts): picture, pronunciation with audio, meaning, sentence, synonyms and antonyms.
 */
/** `preview` (the landing page) shows three words and a link to the day's full list on /dashboard. */
export function LandingVocabulary({ words: all, day, locked: lockedCard, preview = false }: { words: DailyWord[]; day: string; locked?: LockedTeaser | null; preview?: boolean }) {
  const { language } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const words = preview ? all.slice(0, PREVIEW_COUNT) : all;
  const locked = preview ? null : lockedCard;
  const { track, page, pages, playing, setPlaying, running, goTo, holdProps } = usePagedCarousel<HTMLUListElement>(words.length + (locked ? 1 : 0), preview ? 3 : 2, AUTOPLAY_MS);
  const [speaking, setSpeaking] = useState<string | null>(null);
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  function hear(word: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US"; utterance.rate = 0.82;
    utterance.onend = utterance.onerror = () => setSpeaking(current => current === word ? null : current);
    setSpeaking(word); window.speechSynthesis.speak(utterance);
  }

  return <section id="vocabulary" className={`${pulse.pulse} ${styles.section}`} aria-labelledby="vocabulary-title"><div className={home.inner}>
    {preview && <DashboardMore href="/dashboard#vocabulary" title={text(`See all ${all.length + (lockedCard ? 1 : 0)} words`, `सभी ${all.length + (lockedCard ? 1 : 0)} शब्द देखें`)} detail={text("Pronunciation, Hindi meaning, synonyms and antonyms for every word.", "हर शब्द का उच्चारण, हिन्दी अर्थ, पर्यायवाची और विलोम।")} />}
    <div className={pulse.head} data-learning-header>
      <div className={pulse.headCopy} data-learning-copy>
        <p className={pulse.kicker}><span className={styles.aa} aria-hidden="true">Aa</span>{text("Word power", "शब्द शक्ति")}<span className={pulse.today}>{text("New today", "आज नया")} · {dayLabel(day, hi)}</span></p>
        <h2 id="vocabulary-title">{text("Today's English words, ", "आज के अंग्रेज़ी शब्द, ")}<em>{text("said and used well", "सही उच्चारण और प्रयोग")}</em></h2>
        <p className={pulse.lede} data-learning-intro>{text("Twelve new words every day. Hear each one, see what it means, read it in a real sentence and learn the words around it: what to say instead, and what it isn't.", "हर दिन बारह नए शब्द। हर शब्द सुनें, उसका अर्थ देखें, असली वाक्य में पढ़ें और उसके आसपास के शब्द सीखें: इसके बदले क्या कहें, और इसका उल्टा क्या है।")}</p>
      </div>
      <Controls text={text} playing={playing} onPlay={() => setPlaying(p => !p)} page={page} pages={pages} goTo={goTo} previous={text("Previous words", "पिछले शब्द")} next={text("Next words", "अगले शब्द")} />
    </div>
    <ul ref={track} className={preview ? pulse.track : `${pulse.track} ${pulse.twoUp}`} aria-roledescription="carousel" aria-label={text("Today's English words", "आज के अंग्रेज़ी शब्द")} {...holdProps}>
      {words.map((entry, i) => <WordCard key={entry.word} entry={entry} index={i} total={words.length + (locked ? 1 : 0)} speaking={speaking} onHear={hear} />)}
      {locked && <LockedCard teaser={locked} index={words.length} total={words.length + 1} text={text} render={full => <WordCard entry={{ ...(full as DailyWord), tone: locked.tone }} index={words.length} total={words.length + 1} speaking={speaking} onHear={hear} />} />}
    </ul>
    <Dots pages={pages} page={page} running={running} goTo={goTo} label={n => text(`Show words page ${n}`, `शब्द पृष्ठ ${n} दिखाएँ`)} />
  </div></section>;
}

/** Card furniture in the card's own language; the English words being learned are never translated. */
const CARD_TEXT = {
  en: { hear: "Hear it", meaning: "Meaning", sentence: "In a sentence", synonyms: "Synonyms", antonyms: "Antonyms", language: "Language", wordOfDay: "Word of the day" },
  hi: { hear: "सुनें", meaning: "अर्थ", sentence: "वाक्य में", synonyms: "समानार्थी", antonyms: "विलोम", language: "भाषा", wordOfDay: "आज का शब्द" },
};

function WordCard({ entry, index, total, speaking, onHear }: { entry: DailyWord; index: number; total: number; speaking: string | null; onHear: (word: string) => void }) {
  const [failed, setFailed] = useState(false);
  // Each card starts in English and switches on its own, so a reader can check one word in Hindi without changing the rest.
  const [lang, setLang] = useState<"en" | "hi">("en");
  const t = CARD_TEXT[lang];
  const src = vocabularyImageUrl(entry.word);
  // The sentence shows the word in place, so the reader sees its form and position, not just its meaning.
  const escaped = entry.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = entry.sentence.split(new RegExp(`(\\b${escaped}\\w*)`, "i"));
  return <li className={`${pulse.card} ${styles.card}`} data-tone={entry.tone} aria-roledescription="slide" aria-label={`${index + 1} / ${total}: ${entry.word}`}>
    <div className={styles.picture} data-empty={!src || failed}>
      {src && !failed && /* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP from the vocabulary bucket, as on the Search cards. */
        <img src={src} alt={`Picture showing the meaning of ${entry.word}`} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
      <span className={styles.category}>{entry.category}</span>
      {index === 0 && <span className={styles.ribbon}><Sparkles size={12} aria-hidden="true" />{t.wordOfDay}</span>}
      <div className={styles.langToggle} role="group" aria-label={`${t.language}: ${entry.word}`}>
        {(["en", "hi"] as const).map(choice => <button key={choice} type="button" aria-pressed={lang === choice} onClick={() => setLang(choice)} lang={choice}>{choice === "en" ? "English" : "हिन्दी"}</button>)}
      </div>
    </div>
    <div className={`${pulse.body} ${styles.body}`}>
      <div className={styles.wordRow}>
        <div className={styles.wordHead}>
          <h3 className={styles.word} lang="en"><span>{headword(entry.word)}</span></h3>
          <span className={styles.respell}>/{entry.pronunciation}/</span>
        </div>
        <button type="button" className={styles.hear} data-speaking={speaking === entry.word} onClick={() => onHear(entry.word)} aria-label={`${t.hear}: ${entry.word}`}>
          <Volume2 size={16} aria-hidden="true" /><span>{t.hear}</span>
        </button>
      </div>
      <div className={pulse.block}>
        <span className={pulse.label}>{t.meaning}</span>
        <p className={`${pulse.definition} ${styles.meaning}`} lang={lang}>{lang === "hi" ? entry.hindi : entry.meaning}</p>
        <p className={styles.gloss} lang={lang === "hi" ? "en" : "hi"}>{lang === "hi" ? entry.meaning : entry.hindi}</p>
      </div>
      <figure className={styles.sentence}>
        <span className={pulse.label}>{t.sentence}</span>
        <Quote size={16} aria-hidden="true" />
        <blockquote lang="en">{parts.map((part, i) => i % 2 ? <mark key={i}>{part}</mark> : part)}</blockquote>
      </figure>
      <div className={styles.lists}>
        <RelatedColumn kind="synonyms" title={t.synonyms} icon={<Equal size={13} aria-hidden="true" />} words={entry.synonyms} speaking={speaking} onHear={onHear} t={t} />
        <RelatedColumn kind="antonyms" title={t.antonyms} icon={<EqualNot size={13} aria-hidden="true" />} words={entry.antonyms} speaking={speaking} onHear={onHear} t={t} />
      </div>
    </div>
  </li>;
}

/** One column of related words, stacked: each word in its own colour, with its pronunciation, a hear button and its own English/Hindi switch. */
function RelatedColumn({ kind, title, icon, words, speaking, onHear, t }: { kind: "synonyms" | "antonyms"; title: string; icon: ReactNode; words: RelatedWord[]; speaking: string | null; onHear: (word: string) => void; t: typeof CARD_TEXT["en"] }) {
  return <div className={styles.column} data-kind={kind}>
    <span className={styles.columnHead}><span className={styles.columnIcon}>{icon}</span>{title}</span>
    <ul className={styles.related}>{words.slice(0, 4).map(item => <RelatedRow key={item.word} item={item} speaking={speaking === item.word} onHear={onHear} t={t} />)}</ul>
  </div>;
}

function RelatedRow({ item, speaking, onHear, t }: { item: RelatedWord; speaking: boolean; onHear: (word: string) => void; t: typeof CARD_TEXT["en"] }) {
  // Each word starts in English (its respelling) and switches to its Hindi meaning on its own.
  const [lang, setLang] = useState<"en" | "hi">("en");
  const second = lang === "hi" ? item.hindi ?? "—" : item.pronunciation ? `/${item.pronunciation}/` : "—";
  return <li data-speaking={speaking}>
    <span className={styles.relatedTop}>
      <span className={styles.relatedWord} lang="en">{item.word}</span>
      <button type="button" className={styles.relatedHear} onClick={() => onHear(item.word)} aria-label={`${t.hear}: ${item.word}`} title={t.hear}><Volume2 size={13} aria-hidden="true" /></button>
    </span>
    <span className={styles.relatedBottom}>
      <span className={styles.relatedSecond} lang={lang === "hi" ? "hi" : "en"} data-lang={lang}>{second}</span>
      <span className={styles.miniToggle} role="group" aria-label={`${t.language}: ${item.word}`}>
        {(["en", "hi"] as const).map(choice => <button key={choice} type="button" aria-pressed={lang === choice} disabled={choice === "hi" && !item.hindi} onClick={() => setLang(choice)}>{choice === "en" ? "EN" : "हि"}</button>)}
      </span>
    </span>
  </li>;
}
