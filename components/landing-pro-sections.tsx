"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "@/components/responsive-image";
import Link from "@/components/site-link";
import { ArrowRight, ArrowUpRight, Braces, Check, ChevronLeft, ChevronRight, Code2, FileCode2, Lightbulb, Pause, Play, Puzzle, Search, Server, Sparkles, X } from "lucide-react";
import type { LandingProPreview } from "@/lib/landing-pro-preview";
import type { LandingBuzz } from "@/lib/landing-buzz-types";
import { ExpandedText } from "./expanded-text";
import { useLanguage } from "./language-provider";
import { useVisiblePlayback } from "./use-visible-playback";
import { BuzzStrip } from "./landing-buzz-strip";
import { CodeFiles } from "./code-files";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./landing-pro-sections.module.css";

/** Short pill label and logo (public/images/tech) per Techy topic id. */
const TECH_PILLS: Record<string, { label: string; icon: string }> = {
  aws: { label: "AWS", icon: "aws" }, "agentic-ai": { label: "Agentic AI", icon: "claude" }, nextjs: { label: "Next.js", icon: "nextjs" },
  tanstack: { label: "TanStack", icon: "tanstack" }, zustand: { label: "Zustand", icon: "zustand" }, vitest: { label: "Vitest", icon: "vitest" },
  playwright: { label: "Playwright", icon: "playwright" }, react: { label: "React", icon: "react" }, typescript: { label: "TypeScript", icon: "typescript" },
  docker: { label: "Docker", icon: "docker" }, python: { label: "Python", icon: "python" }, javascript: { label: "JS Puzzles", icon: "javascript" },
  "aws-ai": { label: "AWS AI", icon: "aws" }, "aws-all": { label: "AWS Atlas", icon: "aws" }, "aws-devops": { label: "AWS DevOps", icon: "aws" },
};
/** The Coffee & Code page's cover tones, so Techy's cards read as the same family. */
const TONES = ["mint", "sky", "butter", "rose", "lavender", "peach", "sage", "sand"] as const;
const CARDS_PER_PAGE = 6;
const AUTOPLAY_MS = 9000;
const LANGUAGE_MS = 4500;
const STATUS_TONE: Record<string, string> = { s: "#2f7d4f", p: "#2f6db5", x: "#b07a12", d: "#b23b2f" };

function useText() {
  const { language } = useLanguage();
  return { locale: language === "hi" ? "hi-IN" : "en-IN", text: (en: string, hindi: string) => language === "hi" ? hindi : en };
}

/** File extensions for the API of the week's example, by the language API Docs records. */
const EXTENSIONS: Record<string, string> = { tsx: "tsx", jsx: "jsx", typescript: "ts", javascript: "js", python: "py", bash: "sh", shell: "sh", json: "json", yaml: "yaml", sql: "sql", go: "go", rust: "rs", java: "java", css: "css", html: "html" };

/**
 * Techy, laid out like the dashboard's Coffee & Code page: search and topic chips over a grid of tone-covered topic
 * cards that turn a page every nine seconds (held while hovered or focused). Picking a card opens its interview question
 * of the week. Beside it, the week's "predict the output" puzzles and one everyday task written in five languages,
 * which cycle on their own until the visitor picks one. Fresh Tech Buzz stories on the same technologies close it.
 */
export function LandingTechy({ data, buzz }: Readonly<{ data: LandingProPreview["techy"]; buzz?: LandingBuzz[] }>) {
  const { text, locale } = useText();
  const count = (value: number) => value.toLocaleString(locale);
  const section = useRef<HTMLElement>(null); const visible = useVisiblePlayback(section);
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("All");
  const [page, setPage] = useState(0); const [playing, setPlaying] = useState(true); const [held, setHeld] = useState(false);
  const [topicId, setTopicId] = useState(data.topics[0]?.id); const [revealed, setRevealed] = useState(false);
  const [puzzle, setPuzzle] = useState(0); const [solved, setSolved] = useState(false);
  const [lang, setLang] = useState(0); const [langPinned, setLangPinned] = useState(false);
  const categories = useMemo(() => ["All", ...new Set(data.topics.map(topic => topic.category))], [data.topics]);
  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return data.topics.filter(topic => (category === "All" || topic.category === category) && words.every(word => `${topic.title} ${topic.summary} ${topic.category}`.toLowerCase().includes(word)));
  }, [data.topics, query, category]);
  const pages = Math.max(1, Math.ceil(shown.length / CARDS_PER_PAGE));
  const current = Math.min(page, pages - 1);
  const running = playing && !held && visible && pages > 1;
  useEffect(() => { if (!running) return; const timer = setTimeout(() => setPage(value => (Math.min(value, pages - 1) + 1) % pages), AUTOPLAY_MS); return () => clearTimeout(timer); }, [running, current, pages]);
  const polyglot = data.polyglot;
  useEffect(() => { if (langPinned || !visible || !polyglot) return; const timer = setTimeout(() => setLang(value => (value + 1) % polyglot.snippets.length), LANGUAGE_MS); return () => clearTimeout(timer); }, [lang, langPinned, visible, polyglot]);
  const topic = data.topics.find(item => item.id === topicId) ?? data.topics[0];
  const quiz = data.puzzles[puzzle];
  const goPuzzle = (index: number) => { setPuzzle(Math.max(0, Math.min(data.puzzles.length - 1, index))); setSolved(false); };
  const snippet = polyglot?.snippets[lang];
  if (!topic) return null;
  const filter = (next: () => void) => { next(); setPage(0); };
  return <section ref={section} id="techy" className={frame.section} data-ground="wash" aria-labelledby="landing-techy-title"><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><Code2 size={14} aria-hidden="true" />Techy<span>{text(`${count(data.topics.length)} topics · new questions every week`, `${count(data.topics.length)} विषय`)}</span></p>
        <h3 data-h2="" id="landing-techy-title">{text("One topic, real code, ", "एक विषय, असली कोड, ")}<em>{text("read over a coffee.", "एक कप कॉफ़ी के साथ।")}</em></h3>
      </div>
      <div>
        <p className={frame.lede}><ExpandedText text={text("The frameworks, cloud services and testing tools teams hire for, each explained, questioned and coded. Browse the topics like articles, open one for this week's interview question, then try a code puzzle and see one idea written in five languages.", "वे फ़्रेमवर्क, क्लाउड सेवाएँ और टेस्टिंग टूल जिनके लिए टीमें भर्ती करती हैं, हर एक समझाया, पूछा और कोड किया गया।")} /></p>
        <dl className={frame.facts}>
          <div><dt>{text("Practice questions", "अभ्यास प्रश्न")}</dt><dd>{count(data.questionCount)}</dd></div>
          <div><dt>{text("Code puzzles", "कोड पहेलियाँ")}</dt><dd>{count(data.puzzleCount)}</dd></div>
          <div><dt>{text("Workplace words", "कार्यस्थल शब्द")}</dt><dd>{count(data.vocabularyCount)}</dd></div>
        </dl>
      </div>
    </header>

    <div className={styles.toolbar}>
      <label className={styles.find}><Search size={16} aria-hidden="true" /><input type="search" value={query} onChange={event => filter(() => setQuery(event.target.value))} placeholder={text("Search topics, e.g. Docker or hooks", "विषय खोजें")} aria-label={text("Search Techy topics", "Techy विषय खोजें")} />{query && <button type="button" onClick={() => filter(() => setQuery(""))} aria-label={text("Clear search", "खोज साफ़ करें")}><X size={14} /></button>}</label>
      <div className={styles.chips} role="group" aria-label={text("Topic category", "विषय श्रेणी")}>{categories.map(name => <button type="button" key={name} aria-pressed={category === name} onClick={() => filter(() => setCategory(name))}>{name}</button>)}</div>
    </div>

    <div className={styles.cards} onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false); }}>
      {shown.length ? <ul key={`${current}-${category}-${query}`} className={styles.cardGrid}>
        {shown.slice(current * CARDS_PER_PAGE, (current + 1) * CARDS_PER_PAGE).map((item, i) => { const pill = TECH_PILLS[item.id]; return <li key={item.id} style={{ "--i": i } as CSSProperties}>
          <button type="button" className={styles.topicCard} data-tone={TONES[data.topics.indexOf(item) % TONES.length]} aria-pressed={item.id === topic.id} onClick={() => { setTopicId(item.id); setRevealed(false); document.getElementById("landing-techy-question")?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }}>
            <span className={styles.cover}>{pill ? <Image src={`/images/tech/${pill.icon}.png`} alt={`${pill.label} logo`} aria-hidden="true" width={28} height={28} /> : <Code2 size={22} aria-hidden="true" />}<small>{item.category}</small></span>
            <strong>{item.title}</strong>
            <span className={styles.cardSummary}>{item.summary}</span>
            <span className={styles.cardMeta}>{text(`${count(item.questionCount)} questions`, `${count(item.questionCount)} प्रश्न`)}<span aria-hidden="true">·</span>{item.id === topic.id ? text("Open below", "नीचे खुला") : text("Open question", "प्रश्न खोलें")}</span>
          </button>
        </li>; })}
      </ul> : <p className={styles.noMatch} role="status">{text("No topic matches that search.", "इस खोज से कोई विषय नहीं मिला।")}</p>}
      {pages > 1 && <nav className={styles.pager} aria-label={text("Topic pages", "विषय पृष्ठ")}>
        <button type="button" onClick={() => setPage((current - 1 + pages) % pages)} aria-label={text("Previous topics", "पिछले विषय")}><ChevronLeft size={16} /></button>
        {Array.from({ length: pages }, (_, index) => <button type="button" key={index} className={styles.dot} aria-label={text(`Topics page ${index + 1}`, `पृष्ठ ${index + 1}`)} aria-current={current === index ? "page" : undefined} onClick={() => setPage(index)}>{current === index && running && <i key={current} style={{ animationDuration: `${AUTOPLAY_MS}ms` }} aria-hidden="true" />}</button>)}
        <button type="button" onClick={() => setPage((current + 1) % pages)} aria-label={text("Next topics", "अगले विषय")}><ChevronRight size={16} /></button>
        <button type="button" onClick={() => setPlaying(value => !value)} aria-label={playing ? text("Pause topic pages", "रोकें") : text("Play topic pages", "चलाएँ")}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
        <span role="status">{text(`Page ${current + 1} of ${pages}`, `पृष्ठ ${current + 1} / ${pages}`)}</span>
      </nav>}
    </div>

    <div className={styles.labGrid}>
      <article id="landing-techy-question" className={styles.questionCard} aria-label={text("Interview question of the week", "इस सप्ताह का इंटरव्यू प्रश्न")}>
        <p className={styles.labKicker}><Sparkles size={14} aria-hidden="true" />{text("Interview question of the week", "इस सप्ताह का इंटरव्यू प्रश्न")} · {TECH_PILLS[topic.id]?.label ?? topic.title}</p>
        <div className={styles.questionTitle}>{topic.title}</div>
        {topic.feature && <p className={styles.feature}><Check size={15} aria-hidden="true" /><ExpandedText text={topic.feature} /></p>}
        <p className={styles.qLabel}>{text(`Question ${count(topic.questionNumber)} of ${count(topic.questionCount)}`, `प्रश्न ${count(topic.questionNumber)} / ${count(topic.questionCount)}`)}</p>
        <div className={styles.questionText}><ExpandedText text={topic.question} /></div>
        <button type="button" className={styles.reveal} aria-expanded={revealed} aria-controls="landing-techy-answer" onClick={() => setRevealed(value => !value)}>{revealed ? text("Hide answer", "उत्तर छिपाएँ") : text("Answer it yourself, then reveal", "आदर्श उत्तर देखें")}</button>
        <p id="landing-techy-answer" className={styles.answer} hidden={!revealed}><ExpandedText text={topic.answer} /></p>
      </article>

      {quiz && <article className={styles.puzzleCard} aria-label={text("Predict the output", "आउटपुट का अनुमान")}>
        <p className={styles.labKicker}><Puzzle size={14} aria-hidden="true" />{text("Predict the output", "आउटपुट का अनुमान")}</p>
        <div className={styles.puzzleTitle}>{quiz.title}</div>
        <CodeFiles key={quiz.title} files={[{ path: "puzzle.js", code: quiz.code, note: quiz.title }]} label={quiz.title} skin="apple" annotate={false} explainFormatting={false} className={styles.editor} />
        <button type="button" className={styles.reveal} aria-expanded={solved} aria-controls="landing-techy-output" onClick={() => setSolved(value => !value)}>{solved ? text("Hide output", "आउटपुट छिपाएँ") : text("I have a guess: show the output", "आउटपुट दिखाएँ")}</button>
        <div id="landing-techy-output" className={styles.output} hidden={!solved}><code>{quiz.output}</code><p>{quiz.explanation}</p></div>
        {data.puzzles.length > 1 && <nav className={styles.puzzlePager} aria-label={text("This week's puzzles", "इस सप्ताह की पहेलियाँ")}>
          <button type="button" className={styles.step} onClick={() => goPuzzle(puzzle - 1)} disabled={puzzle === 0} aria-label={text("Previous puzzle", "पिछली पहेली")}><ChevronLeft size={16} /></button>
          <div className={styles.puzzleTabs}>{data.puzzles.map((item, i) => <button type="button" key={item.title} aria-pressed={puzzle === i} aria-label={`${text("Puzzle", "पहेली")} ${i + 1}: ${item.title}`} title={item.title} onClick={() => goPuzzle(i)}>{i + 1}</button>)}</div>
          <button type="button" className={styles.step} onClick={() => goPuzzle(puzzle + 1)} disabled={puzzle === data.puzzles.length - 1} aria-label={text("Next puzzle", "अगली पहेली")}><ChevronRight size={16} /></button>
          <span role="status">{text(`Puzzle ${puzzle + 1} of ${data.puzzles.length}`, `पहेली ${puzzle + 1} / ${data.puzzles.length}`)}</span>
        </nav>}
      </article>}
    </div>

    {polyglot && snippet && <article className={styles.polyglot} aria-label={text("Same idea, five languages", "एक विचार, पाँच भाषाएँ")}>
      <div className={styles.polyHead}>
        <div><p className={styles.labKicker}><Braces size={14} aria-hidden="true" />{text("Same idea, five languages · this week", "एक विचार, पाँच भाषाएँ")}</p><div className={styles.polyTitle}>{polyglot.title}</div><p>{polyglot.idea}</p></div>
        {/* Picks the file the editor opens on; it steps through the languages on its own until the visitor takes over. */}
        <div className={styles.langTabs} role="group" aria-label={text("Open a language", "भाषा खोलें")}>{polyglot.snippets.map((item, i) => <button type="button" key={item.language} aria-pressed={lang === i} onClick={() => { setLang(i); setLangPinned(true); }}>
          <Image src={`/images/tech/${item.logo}.png`} alt={`${item.language} logo`} aria-hidden="true" width={16} height={16} />{item.language}
          {lang === i && !langPinned && visible && <i key={lang} style={{ animationDuration: `${LANGUAGE_MS}ms` }} aria-hidden="true" />}
        </button>)}</div>
      </div>
      <div className={styles.polyBody} onPointerDownCapture={() => setLangPinned(true)} onFocusCapture={() => setLangPinned(true)}>
        <CodeFiles key={snippet.path} files={polyglot.files} initialPath={snippet.path} label={`${polyglot.title} · 5 languages`} skin="apple" annotate={false} explainFormatting={false} />
        <p className={styles.polyNote}><Lightbulb size={15} aria-hidden="true" /><b>{snippet.language}:</b> {snippet.note}</p>
      </div>
    </article>}

    <BuzzStrip stories={buzz} label={text("the technologies in Techy", "Techy तकनीकें")} keywords={data.topics.map(item => TECH_PILLS[item.id]?.label ?? item.title)} />
    <div className={frame.actions}><Link className={frame.cta} href="/learning/techy">{text("Open Techy", "Techy खोलें")}<ArrowRight size={16} aria-hidden="true" /></Link><small>{text("Included with your account. Sign in to start practising.", "आपके खाते में शामिल। अभ्यास के लिए साइन इन करें।")}</small></div>
  </div></section>;
}

/**
 * API Docs, as the dashboard's API Docs page works: one field filters technologies and identifiers, then type and
 * status (stable, preview, experimental, deprecated) narrow a technology's identifiers. Every row is a real entry.
 * Under it, the API of the week in full (signature, parameters, return value, notes and example code) and fresh
 * Tech Buzz stories on the same technology.
 */
export function LandingApiDocs({ data, buzz }: Readonly<{ data: LandingProPreview["api"]; buzz?: LandingBuzz[] }>) {
  const { text, locale } = useText();
  const section = useRef<HTMLElement>(null); const visible = useVisiblePlayback(section);
  const [query, setQuery] = useState("");
  // The server puts this week's technology first (landingProPreview rotates them).
  const [packageId, setPackageId] = useState(data.packages[0]?.id);
  const [kind, setKind] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  // A hint under the field cycles through real identifiers until the visitor types.
  const hints = useMemo(() => data.packages.slice(0, 8).map(pkg => pkg.sample[0]?.name).filter((name): name is string => Boolean(name)), [data.packages]);
  const [hint, setHint] = useState(0);
  useEffect(() => { if (query || !visible || hints.length < 2) return; const timer = setTimeout(() => setHint(value => (value + 1) % hints.length), 3000); return () => clearTimeout(timer); }, [hint, query, visible, hints.length]);
  const normalized = query.trim().toLowerCase();
  const matches = data.packages.filter(pkg => !normalized || pkg.name.toLowerCase().includes(normalized) || pkg.sample.some(entry => entry.name.toLowerCase().includes(normalized)));
  const selected = matches.find(pkg => pkg.id === packageId) ?? matches[0];
  const typeOf = (k: string) => data.types.find(type => type.k === k);
  const statusOf = (id: string) => data.statuses.find(item => item.id === id);
  const usedKinds = data.types.filter(type => selected?.sample.some(entry => entry.kind === type.k));
  const usedStatuses = data.statuses.filter(item => selected?.sample.some(entry => entry.status === item.id));
  const activeKind = usedKinds.some(type => type.k === kind) ? kind : "all";
  const activeStatus = usedStatuses.some(item => item.id === status) ? status : "all";
  const nameMatches = !!selected && !!normalized && !selected.name.toLowerCase().includes(normalized);
  const entries = (selected?.sample ?? []).filter(entry => (activeKind === "all" || entry.kind === activeKind) && (activeStatus === "all" || entry.status === activeStatus) && (!nameMatches || entry.name.toLowerCase().includes(normalized)));
  const count = (value: number) => value.toLocaleString(locale);
  const choose = (id: string) => { setPackageId(id); setKind("all"); setStatus("all"); };
  const spot = data.spotlight;
  // The API of the week as a small project: the example, and a README with the reference it was written from.
  const spotFiles = useMemo(() => spot ? [
    { path: `src/example.${EXTENSIONS[spot.language] ?? "txt"}`, code: spot.code, note: spot.description },
    { path: "README.md", note: "Reference", code: [`# ${spot.name}`, "", spot.description, "", "## Signature", "", "```", spot.signature, "```",
      ...(spot.parameters.length ? ["", "## Parameters", "", ...spot.parameters.map(param => `- \`${param.name}\` (${param.type}): ${param.description}`)] : []),
      "", "## Returns", "", spot.returns, ...(spot.notes.length ? ["", "## Notes", "", ...spot.notes.map(note => `- ${note}`)] : [])].join("\n") },
  ] : [], [spot]);
  const points = [
    { icon: Search, title: text("Search across every stack", "हर स्टैक में खोजें"), body: text("Filter by technology, identifier type and status in one place.", "तकनीक, पहचानकर्ता प्रकार और स्थिति से एक जगह फ़िल्टर करें।") },
    { icon: Braces, title: text("Signatures you can read", "पढ़ने योग्य सिग्नेचर"), body: text("Parameters, return values, key points and focused usage code.", "पैरामीटर, रिटर्न वैल्यू, मुख्य बिंदु और केंद्रित उपयोग कोड।") },
    { icon: Server, title: text("Status on every entry", "हर प्रविष्टि पर स्थिति"), body: text("Stable, preview, experimental or deprecated, so you know what is safe to ship.", "स्थिर, प्रीव्यू, प्रायोगिक या अप्रचलित।") },
  ];
  return <section ref={section} id="api-docs" className={frame.section} data-ground="paper" aria-labelledby="landing-api-title"><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><FileCode2 size={14} aria-hidden="true" />API Docs<span>{text(`${count(data.identifierCount)} identifiers · API of the week`, `${count(data.identifierCount)} पहचानकर्ता`)}</span></p>
        <h3 data-h2="" id="landing-api-title">{text("Every identifier, ", "हर पहचानकर्ता, ")}<em>{text("one calm reference.", "एक शांत संदर्भ में।")}</em></h3>
      </div>
      <div>
        <p className={frame.lede}>{text("Hooks, classes, functions and CLI commands, from AI tooling to databases, testing and cloud, organised so you find the right API in seconds. Search the real index below, filter it by type and status, and read this week's API in full.", "AI टूलिंग से डेटाबेस, टेस्टिंग और क्लाउड तक hooks, classes, functions और CLI कमांड। नीचे असली सूची खोजें।")}</p>
        <dl className={frame.facts}>
          <div><dt>{text("Technologies", "तकनीकें")}</dt><dd>{count(data.packages.length)}</dd></div>
          <div><dt>{text("Identifier types", "प्रकार")}</dt><dd>{count(data.types.length)}</dd></div>
          <div><dt>{text("Status labels", "स्थिति लेबल")}</dt><dd>{count(data.statusCount)}</dd></div>
        </dl>
      </div>
    </header>
    <article className={styles.palette} aria-label={text("API reference preview", "API संदर्भ पूर्वावलोकन")}>
      <div className={styles.paletteSearch}>
        <Search size={18} aria-hidden="true" />
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={text("Filter technologies or identifiers", "तकनीक या पहचानकर्ता खोजें")} aria-label={text("Filter technologies or identifiers", "तकनीक खोजें")} />
        {!query && hints.length > 0 && <button type="button" className={styles.hint} key={hint} onClick={() => setQuery(hints[hint])}>{text("Try", "आज़माएँ")} <code>{hints[hint]}</code></button>}
        {query && <button type="button" onClick={() => setQuery("")} aria-label={text("Clear search", "खोज साफ़ करें")}><X size={15} /></button>}
      </div>
      <div className={styles.paletteBody}>
        <div className={styles.packages} role="group" aria-label={text("Technologies", "तकनीकें")}>
          {matches.map(pkg => <button type="button" key={pkg.id} aria-pressed={pkg.id === selected?.id} onClick={() => choose(pkg.id)} style={{ "--accent": pkg.accent } as CSSProperties}><span aria-hidden="true">{pkg.icon}</span><b>{pkg.name}</b><small>{count(pkg.count)}</small></button>)}
          {!matches.length && <p className={styles.noMatch} role="status">{text("No technology matches that search.", "इस खोज से कोई तकनीक नहीं मिली।")}</p>}
        </div>
        {selected && <div className={styles.entries}>
          <div className={styles.entriesHead}>
            <div className={styles.entriesTitle}><span aria-hidden="true">{selected.icon}</span>{selected.name}</div>
            <span role="status">{text(`${count(entries.length)} of ${count(selected.sample.length)} shown · ${count(selected.count)} in the reference`, `${count(selected.count)} पहचानकर्ता`)}</span>
          </div>
          {usedKinds.length > 1 && <div className={styles.kinds} role="group" aria-label={text("Identifier type", "पहचानकर्ता प्रकार")}>
            <button type="button" aria-pressed={activeKind === "all"} onClick={() => setKind("all")}>{text("All types", "सभी प्रकार")}</button>
            {usedKinds.map(type => <button type="button" key={type.k} aria-pressed={activeKind === type.k} onClick={() => setKind(type.k)} style={{ "--badge": type.c } as CSSProperties}><i aria-hidden="true" />{type.label}</button>)}
          </div>}
          {usedStatuses.length > 0 && <div className={styles.kinds} role="group" aria-label={text("Status", "स्थिति")}>
            <button type="button" aria-pressed={activeStatus === "all"} onClick={() => setStatus("all")}>{text("Any status", "कोई भी स्थिति")}</button>
            {usedStatuses.map(item => <button type="button" key={item.id} aria-pressed={activeStatus === item.id} onClick={() => setStatus(item.id)} style={{ "--badge": STATUS_TONE[item.id] ?? "#87867f" } as CSSProperties}><i aria-hidden="true" />{item.label}</button>)}
          </div>}
          <ul className={styles.entryList}>{entries.map(entry => { const type = typeOf(entry.kind), state = statusOf(entry.status); return <li key={entry.name} style={{ "--badge": type?.c ?? "#87867f", "--status": STATUS_TONE[entry.status] ?? "#87867f" } as CSSProperties}><span className={styles.badge} title={type?.label}>{entry.kind}</span><code>{entry.name}</code><small><i className={styles.statusDot} aria-hidden="true" />{state?.label ?? type?.label}</small></li>; })}</ul>
          {!entries.length && <p className={styles.noMatch} role="status">{text("No identifier in this sample matches. The full reference has the rest.", "इस नमूने में कोई पहचानकर्ता नहीं मिला।")}</p>}
        </div>}
      </div>
      <ul className={styles.points}>{points.map(point => <li key={point.title}><point.icon size={17} aria-hidden="true" /><div><div className={styles.pointTitle}>{point.title}</div><p>{point.body}</p></div></li>)}</ul>
    </article>

    {spot && <article className={styles.spotlight} aria-labelledby="landing-api-spotlight">
      <div className={styles.spotInfo}>
        <p className={styles.labKicker}><Sparkles size={14} aria-hidden="true" />{text("API of the week", "इस सप्ताह का API")} · <code>{spot.packageName}</code></p>
        <div id="landing-api-spotlight" className={styles.spotTitle}><code>{spot.name}</code></div>
        <p className={styles.spotDesc}>{spot.description}</p>
        <pre className={styles.signature}><code>{spot.signature}</code></pre>
        {spot.parameters.length > 0 && <dl className={styles.params}>{spot.parameters.map(param => <div key={param.name}><dt><code>{param.name}</code><small>{param.type}</small></dt><dd>{param.description}</dd></div>)}</dl>}
        <p className={styles.returns}><b>{text("Returns", "लौटाता है")}</b> {spot.returns}</p>
        {spot.notes.length > 0 && <ul className={styles.notes}>{spot.notes.map(note => <li key={note}><Check size={14} aria-hidden="true" />{note}</li>)}</ul>}
        {spot.related.length > 0 && <p className={styles.related}>{text("Related", "संबंधित")}: {spot.related.map(name => <button type="button" key={name} onClick={() => { setQuery(name); document.getElementById("api-docs")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><code>{name}</code></button>)}</p>}
      </div>
      <div className={styles.spotCode}>
        <CodeFiles files={spotFiles} label={text(`${spot.name} example`, "उदाहरण")} skin="apple" annotate={false} explainFormatting={false} />
      </div>
    </article>}

    <BuzzStrip stories={buzz} label={selected?.name ?? "API Docs"} keywords={[selected?.name ?? "", spot?.name ?? "", spot?.packageName ?? "", ...data.packages.slice(0, 6).map(pkg => pkg.name)]} />
    <div className={frame.actions}><Link className={frame.cta} href="/learning/api-docs">{text("Browse the API reference", "API संदर्भ देखें")}<ArrowUpRight size={16} aria-hidden="true" /></Link><small>{text("Each entry is marked stable, preview, experimental or deprecated.", "हर प्रविष्टि स्थिर, प्रीव्यू, प्रायोगिक या अप्रचलित चिह्नित है।")}</small></div>
  </div></section>;
}
