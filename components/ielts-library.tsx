"use client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BarChart3, BookA, CheckCircle2, Circle, Eye, EyeOff, Layers, Link2, Mail, Mic, PenLine, Quote, Repeat, Search, Shuffle, SpellCheck, TrendingUp } from "lucide-react";
import { useLanguage } from "./language-provider";
import { chartAlt, chartImage, chartKind, TASK1_CHARTS } from "@/lib/ielts/charts";
import { ACADEMIC_WORDS, COLLOCATIONS, CUE_CARDS, GT_LETTERS, IDIOMS, PHRASAL_VERBS, SPELLING, SYNONYMS, TASK2_ESSAYS, TREND_LANGUAGE, type Entry } from "@/lib/ielts/library";
import styles from "./ielts-library.module.css";

/*
 * IELTS Achievers · IELTS Dashboard · Learning Library (2026-11-26): word lists (academic words, idioms, phrasal
 * verbs, collocations, synonyms, spelling) as cards with search, a flashcard mode and "learnt" ticks kept in this
 * browser, the language of Task 1 data, and model answers: Task 1 with its chart, Task 2 essays, General Training
 * letters and Speaking Part 2. Data: lib/ielts/library.ts and lib/ielts/charts.ts.
 */
type Shelf = "words" | "idioms" | "phrasal" | "collocations" | "synonyms" | "spelling" | "data" | "task1" | "task2" | "letters" | "speaking";
const LEARNT_KEY = "mc:ielts:library:learnt:v1";
const PAGE = 24;
const COLLOCATION_CARDS: Entry[] = COLLOCATIONS.map(c => ({ term: c.phrase, meaning: c.meaning, example: c.blank.replace("____", `[${c.right}]`) }));
const SYNONYM_CARDS: Entry[] = SYNONYMS.map(([word, syn]) => ({ term: word, meaning: syn, example: `Paraphrase “${word}” as “${syn}”.` }));
const SPELLING_CARDS: Entry[] = SPELLING.map(([right, wrong]) => ({ term: right, meaning: `Not: ${wrong.join(", ")}`, example: "Spelling must be exact in Listening and Reading answers." }));
const LISTS: Partial<Record<Shelf, Entry[]>> = { words: ACADEMIC_WORDS, idioms: IDIOMS, phrasal: PHRASAL_VERBS, collocations: COLLOCATION_CARDS, synonyms: SYNONYM_CARDS, spelling: SPELLING_CARDS };
const wordCount = (text: string) => text.trim().split(/\s+/).length;

function useLearnt() {
  const [learnt, setLearnt] = useState<Record<string, true>>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restores the saved ticks after hydration (as StudyPlan does).
    try { const saved = window.localStorage.getItem(LEARNT_KEY); if (saved) setLearnt(JSON.parse(saved)); } catch { /* storage blocked: start empty */ } }, []);
  const toggle = (id: string) => setLearnt(current => {
    const next = { ...current }; if (next[id]) delete next[id]; else next[id] = true;
    try { window.localStorage.setItem(LEARNT_KEY, JSON.stringify(next)); } catch { /* not saved */ }
    return next;
  });
  return [learnt, toggle] as const;
}

export function IeltsLibrary() {
  const { language } = useLanguage(); const tr = (en: string, hindi: string) => language === "hi" ? hindi : en;
  const [shelf, setShelf] = useState<Shelf>("words");
  const SHELVES: { id: Shelf; label: string; count: number; icon: typeof BookA; group: "lists" | "answers" }[] = [
    { id: "words", label: tr("Academic words", "अकादमिक शब्द"), count: ACADEMIC_WORDS.length, icon: BookA, group: "lists" },
    { id: "idioms", label: tr("Idioms", "मुहावरे"), count: IDIOMS.length, icon: Quote, group: "lists" },
    { id: "phrasal", label: tr("Phrasal verbs", "फ़्रेज़ल वर्ब"), count: PHRASAL_VERBS.length, icon: Layers, group: "lists" },
    { id: "collocations", label: tr("Collocations", "कोलोकेशन"), count: COLLOCATIONS.length, icon: Link2, group: "lists" },
    { id: "synonyms", label: tr("Synonyms", "समानार्थी शब्द"), count: SYNONYMS.length, icon: Repeat, group: "lists" },
    { id: "spelling", label: tr("Spelling", "वर्तनी"), count: SPELLING.length, icon: SpellCheck, group: "lists" },
    { id: "data", label: tr("Describing data", "डेटा का वर्णन"), count: TREND_LANGUAGE.length, icon: TrendingUp, group: "lists" },
    { id: "task1", label: tr("Task 1 models", "टास्क 1 आदर्श उत्तर"), count: TASK1_CHARTS.length, icon: BarChart3, group: "answers" },
    { id: "task2", label: tr("Task 2 essays", "टास्क 2 निबंध"), count: TASK2_ESSAYS.length, icon: PenLine, group: "answers" },
    { id: "letters", label: tr("GT letters", "GT पत्र"), count: GT_LETTERS.length, icon: Mail, group: "answers" },
    { id: "speaking", label: tr("Speaking Part 2", "स्पीकिंग भाग 2"), count: CUE_CARDS.length, icon: Mic, group: "answers" },
  ];
  const list = LISTS[shelf];

  return <div className={styles.wrap}>
    <p className={styles.lede}>{tr("Everything to learn before the test: word lists with meanings and examples, the language of Task 1 charts, and band 8–9 model answers for every Writing and Speaking task. Tick cards as you learn them; your progress stays in this browser.",
      "परीक्षा से पहले सीखने के लिए सब कुछ: अर्थ और उदाहरण सहित शब्द-सूचियाँ, टास्क 1 चार्ट की भाषा, और Writing व Speaking के हर टास्क के बैंड 8–9 आदर्श उत्तर। सीखे गए कार्ड पर टिक करें; प्रगति इसी ब्राउज़र में रहती है।")}</p>
    {(["lists", "answers"] as const).map(group => <div key={group} className={styles.shelfRow}>
      <span className={styles.shelfLabel}>{group === "lists" ? tr("Learn", "सीखें") : tr("Model answers", "आदर्श उत्तर")}</span>
      <div className={styles.shelves} role="tablist" aria-label={group === "lists" ? "Word lists" : "Model answers"}>
        {SHELVES.filter(s => s.group === group).map(s => <button key={s.id} type="button" role="tab" aria-selected={shelf === s.id} onClick={() => setShelf(s.id)}><s.icon size={15} aria-hidden="true" />{s.label}<b>{s.count}</b></button>)}
      </div>
    </div>)}
    <div role="tabpanel" aria-label={SHELVES.find(s => s.id === shelf)!.label}>
      {list && <WordList key={shelf} id={shelf} entries={list} tr={tr} />}
      {shelf === "data" && <DataLanguage tr={tr} />}
      {shelf === "task1" && <Answers items={TASK1_CHARTS.map(c => ({ id: c.id, tag: chartKind(c), title: c.title, prompt: c.task, image: { src: chartImage(c), alt: chartAlt(c) }, answer: c.model }))} tr={tr} />}
      {shelf === "task2" && <Answers items={TASK2_ESSAYS.map(e => ({ id: e.id, tag: e.type, title: e.question, prompt: "Write at least 250 words.", notes: e.notes, answer: e.answer }))} tr={tr} />}
      {shelf === "letters" && <Answers items={GT_LETTERS.map(l => ({ id: l.id, tag: `${l.tone} letter`, title: l.prompt, prompt: `In your letter: ${l.bullets.join("; ")}. Write at least 150 words.`, answer: l.answer }))} tr={tr} />}
      {shelf === "speaking" && <Answers items={CUE_CARDS.map(c => ({ id: c.id, tag: "Cue card", title: c.title, prompt: `You should say: ${c.points.join("; ")}.`, answer: c.answer }))} tr={tr} />}
    </div>
  </div>;
}

type Tr = (en: string, hindi: string) => string;

function WordList({ id, entries, tr }: { id: Shelf; entries: Entry[]; tr: Tr }) {
  const [query, setQuery] = useState(""); const deferred = useDeferredValue(query);
  const [cards, setCards] = useState(false); const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [order, setOrder] = useState<Entry[]>(entries); const [hideLearnt, setHideLearnt] = useState(false); const [limit, setLimit] = useState(PAGE);
  const [learnt, toggle] = useLearnt();
  const key = (e: Entry) => `${id}:${e.term}`;
  const terms = deferred.trim().toLowerCase();
  const shown = useMemo(() => order.filter(e => (!terms || `${e.term} ${e.meaning} ${e.example}`.toLowerCase().includes(terms)) && !(hideLearnt && learnt[`${id}:${e.term}`])), [order, terms, hideLearnt, learnt, id]);
  const done = entries.filter(e => learnt[key(e)]).length;
  const shuffleCards = () => { const next = [...entries]; for (let i = next.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]]; } setOrder(next); setFlipped({}); };

  return <>
    <div className={styles.tools}>
      <label className={styles.search}><Search size={15} aria-hidden="true" /><span className={styles.sr}>{tr("Search this list", "इस सूची में खोजें")}</span>
        <input type="search" value={query} onChange={e => { setQuery(e.target.value); setLimit(PAGE); }} placeholder={tr("Search words, meanings or examples…", "शब्द, अर्थ या उदाहरण खोजें…")} /></label>
      <button type="button" aria-pressed={cards} onClick={() => { setCards(c => !c); setFlipped({}); }}>{cards ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}{tr("Flashcards", "फ़्लैशकार्ड")}</button>
      <button type="button" onClick={shuffleCards}><Shuffle size={14} aria-hidden="true" />{tr("Shuffle", "मिलाएँ")}</button>
      <button type="button" aria-pressed={hideLearnt} onClick={() => setHideLearnt(h => !h)}><CheckCircle2 size={14} aria-hidden="true" />{tr("Hide learnt", "सीखे हुए छिपाएँ")}</button>
      <span className={styles.progress} aria-live="polite"><span style={{ width: `${(done / entries.length) * 100}%` }} />{done}/{entries.length} {tr("learnt", "सीखे")}</span>
    </div>
    {cards && <p className={styles.hint}>{tr("Say the meaning aloud, then tap a card to check it.", "अर्थ बोलें, फिर कार्ड पर टैप करके जाँचें।")}</p>}
    {shown.length === 0 ? <p className={styles.empty}>{tr("Nothing matches.", "कुछ नहीं मिला।")}</p> :
      <ul className={styles.grid}>{shown.slice(0, limit).map(e => { const k = key(e), hidden = cards && !flipped[k]; return <li key={k} className={styles.card} data-learnt={learnt[k] || undefined}>
        <button type="button" className={styles.face} aria-expanded={cards ? !hidden : undefined} onClick={() => cards && setFlipped(f => ({ ...f, [k]: !f[k] }))} disabled={!cards}>
          <strong>{e.term}</strong>
          {hidden ? <span className={styles.tap}>{tr("Tap to reveal", "देखने के लिए टैप करें")}</span> : <><span className={styles.meaning}>{e.meaning}</span><em>{e.example}</em>{e.note && <small>{e.note}</small>}</>}
        </button>
        <button type="button" className={styles.tick} aria-pressed={Boolean(learnt[k])} onClick={() => toggle(k)}>{learnt[k] ? <CheckCircle2 size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}{learnt[k] ? tr("Learnt", "सीखा") : tr("Mark learnt", "सीखा हुआ चिह्नित करें")}</button>
      </li>; })}</ul>}
    {shown.length > limit && <button type="button" className={styles.more} onClick={() => setLimit(l => l + PAGE)}>{tr(`Show more (${shown.length - limit} left)`, `और दिखाएँ (${shown.length - limit} शेष)`)}</button>}
  </>;
}

function DataLanguage({ tr }: { tr: Tr }) {
  const sample = TASK1_CHARTS[0];
  return <div className={styles.data}>
    <figure className={styles.figure}>
      {/* eslint-disable-next-line @next/next/no-img-element -- an SVG data URI drawn from the chart's data */}
      <img src={chartImage(sample)} alt={chartAlt(sample)} width={640} height={400} loading="lazy" decoding="async" />
      <figcaption>{tr("Example: “Internet access in Country B rose dramatically, from just 5% in 2000 to 82% in 2020, while growth in Country C was far more gradual.”", "उदाहरण: “Internet access in Country B rose dramatically, from just 5% in 2000 to 82% in 2020, while growth in Country C was far more gradual.”")}</figcaption>
    </figure>
    <dl className={styles.trends}>{TREND_LANGUAGE.map(group => <div key={group.group}><dt>{group.group}</dt><dd>{group.items.map(item => <span key={item}>{item}</span>)}</dd></div>)}</dl>
    <p className={styles.hint}>{tr("Two patterns cover most sentences: “X rose sharply to 82%” (verb + adverb) and “there was a sharp rise in X” (adjective + noun). Use both for range.", "दो ढाँचे अधिकांश वाक्यों में काम आते हैं: “X rose sharply to 82%” (क्रिया + क्रिया-विशेषण) और “there was a sharp rise in X” (विशेषण + संज्ञा)। विविधता के लिए दोनों का प्रयोग करें।")}</p>
  </div>;
}

type Model = { id: string; tag: string; title: string; prompt: string; answer: string; notes?: string[]; image?: { src: string; alt: string } };
function Answers({ items, tr }: { items: Model[]; tr: Tr }) {
  const [open, setOpen] = useState<string | null>(null);
  return <ol className={styles.answers}>{items.map(item => <li key={item.id} className={styles.answer}>
    <p className={styles.tag}>{item.tag}</p>
    <h3>{item.title}</h3>
    <p className={styles.prompt}>{item.prompt}</p>
    {/* eslint-disable-next-line @next/next/no-img-element -- an SVG data URI drawn from the chart's data */}
    {item.image && <img className={styles.chart} src={item.image.src} alt={item.image.alt} width={640} height={400} loading="lazy" decoding="async" />}
    {item.notes && <ul className={styles.notes}>{item.notes.map(note => <li key={note}>{note}</li>)}</ul>}
    <button type="button" className={styles.reveal} aria-expanded={open === item.id} onClick={() => setOpen(o => o === item.id ? null : item.id)}>
      {open === item.id ? tr("Hide model answer", "आदर्श उत्तर छिपाएँ") : tr("Show model answer", "आदर्श उत्तर दिखाएँ")}</button>
    {open === item.id && <div className={styles.model}><p>{item.answer}</p><small>{wordCount(item.answer)} {tr("words · original model answer, not an official IELTS script", "शब्द · मौलिक आदर्श उत्तर, आधिकारिक IELTS उत्तर नहीं")}</small></div>}
  </li>)}</ol>;
}
