"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "@/components/responsive-image";
import Link from "@/components/site-link";
import { ArrowRight, ArrowUpRight, Bot, Braces, BrainCircuit, Check, ChevronLeft, ChevronRight, Cloud, Code2, Database, FileCode2, FlaskConical, LayoutTemplate, Lightbulb, Lock, Pause, Play, Puzzle, Search, Server, ShieldCheck, Sparkles, Star, X, type LucideIcon } from "lucide-react";
import type { LandingApiGuide, LandingApiTech, LandingProPreview } from "@/lib/landing-pro-preview";
import { ExpandedText } from "./expanded-text";
import { useLanguage } from "./language-provider";
import { useVisiblePlayback } from "./use-visible-playback";
import { PillPager } from "./pill-pager";
import { useStudyBuddyAccess } from "@/lib/study-buddy-access";
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
/** Each API Docs tab keeps its own icon and light colour on every page of tabs. Labels are short so a tab stays on one line; the full name is its tooltip. */
const API_TAB_LOOK: Record<string, { icon: LucideIcon; tone: string; short: string }> = {
  popular: { icon: Star, tone: "butter", short: "Most popular" }, agentic: { icon: Bot, tone: "lavender", short: "Agentic AI" }, ai: { icon: BrainCircuit, tone: "sky", short: "AI & data" }, languages: { icon: Code2, tone: "mint", short: "Languages" },
  frontend: { icon: LayoutTemplate, tone: "rose", short: "Frontend" }, backend: { icon: Server, tone: "peach", short: "Backend" }, auth: { icon: ShieldCheck, tone: "sage", short: "Security" }, data: { icon: Database, tone: "aqua", short: "Databases" },
  testing: { icon: FlaskConical, tone: "lilac", short: "Testing" }, platform: { icon: Cloud, tone: "sand", short: "Cloud & tools" },
};
const API_TABS_PER_PAGE = 4;
const API_MEMBER_FEATURES = ["Parameters and return values", "Worked code examples", "Common mistakes", "Interview practice"];

function useText() {
  const { language } = useLanguage();
  return { locale: language === "hi" ? "hi-IN" : "en-IN", text: (en: string, hindi: string) => language === "hi" ? hindi : en };
}


/**
 * Techy, laid out like the dashboard's Coffee & Code page: search and topic chips over a grid of tone-covered topic
 * cards that turn a page every nine seconds (held while hovered or focused). Picking a card opens its interview question
 * of the week. Beside it, the week's "predict the output" puzzles and one everyday task written in five languages,
 * which cycle on their own until the visitor picks one. Fresh Tech Buzz stories on the same technologies close it.
 */
export function LandingTechy({ data }: Readonly<{ data: LandingProPreview["techy"] }>) {
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

    <div className={frame.actions}><Link className={frame.cta} href="/learning/techy">{text("Open Techy", "Techy खोलें")}<ArrowRight size={16} aria-hidden="true" /></Link><small>{text("Included with your account. Sign in to start practising.", "आपके खाते में शामिल। अभ्यास के लिए साइन इन करें।")}</small></div>
  </div></section>;
}

/**
 * The locked part of API Docs, as a members' library: how many APIs wait behind the membership, and the page each one
 * opens. The sheet's lines are drawn, never text, so no in-depth content is in this section's data. It pages through
 * the locked names while on screen, and follows the name under the pointer.
 */
function ApiVault({ guide, visible }: Readonly<{ guide: LandingApiGuide; visible: boolean }>) {
  const [peek, setPeek] = useState(0);
  const [held, setHeld] = useState(false);
  const names = guide.locked;
  const name = names[peek % Math.max(1, names.length)]?.name ?? guide.name;
  const more = guide.count - guide.free.length;
  useEffect(() => {
    if (!visible || held || names.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setPeek(value => (value + 1) % names.length), 2600);
    return () => clearTimeout(timer);
  }, [peek, visible, held, names.length]);
  return <div className={styles.vault}>
    <div className={styles.vaultCopy}>
      <p className={styles.vaultKicker}><Lock size={14} aria-hidden="true" />The members&apos; library</p>
      <div className={styles.vaultCount}><b>{more.toLocaleString("en-IN")}</b><span>more {guide.name} APIs, in depth</span></div>
      <p className={styles.vaultLine}>In-depth API docs are only for subscribers. Subscribe to open every API on this platform in full.</p>
      <Link className={styles.vaultCta} href="/subscribe">Subscribe<ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
    <div className={styles.vaultStage} role="img" aria-label={`A locked page for ${name}: ${API_MEMBER_FEATURES.join(", ")}`}>
      <i className={styles.vaultBack} aria-hidden="true" /><i className={styles.vaultBack} aria-hidden="true" />
      <div className={styles.vaultSheet}>
        <div className={styles.vaultSheetHead} key={name}><code>{name}</code><span><Lock size={13} aria-hidden="true" /></span></div>
        {API_MEMBER_FEATURES.map((feature, at) => <div className={styles.vaultRow} key={feature} data-code={at === 1 || undefined}>
          <span>{feature}</span>
          <i aria-hidden="true" /><i aria-hidden="true" />{at === 1 && <i aria-hidden="true" />}
        </div>)}
      </div>
    </div>
    <ul className={styles.vaultIndex} aria-label={`Locked ${guide.name} APIs`} onMouseLeave={() => setHeld(false)}>
      {names.map((item, at) => <li key={item.name} title="Subscribers only" data-on={at === peek % names.length || undefined} onMouseEnter={() => { setHeld(true); setPeek(at); }}><Lock size={12} aria-hidden="true" /><code>{item.name}</code></li>)}
      {more > names.length && <li className={styles.vaultMore}>+{(more - names.length).toLocaleString("en-IN")} more</li>}
    </ul>
  </div>;
}

/**
 * API Docs as a field guide: choose any technology, read five short descriptions, and see the rest of its APIs locked
 * in the members' library. The page is cached for everyone, so a member's rows open after the access check; the full
 * pages are gated on the server either way, and no in-depth content is in this section's data.
 */
export function LandingApiDocs({ data }: Readonly<{ data: LandingProPreview["api"] }>) {
  const section = useRef<HTMLElement>(null); const visible = useVisiblePlayback(section);
  const [seen, setSeen] = useState(false);
  if (visible && !seen) setSeen(true);
  const member = useStudyBuddyAccess(seen) === "member";
  const [category, setCategory] = useState("popular");
  const [tabPage, setTabPage] = useState(0);
  const tabs = useMemo(() => [{ id: "popular", label: "Most popular" }, ...data.categories], [data.categories]);
  const tabPages = Math.max(1, Math.ceil(tabs.length / API_TABS_PER_PAGE));
  // The server puts this week's technology first (landingProPreview rotates them).
  const [guideId, setGuideId] = useState(data.guides[0]?.id);
  // Technologies without a field guide arrive together, the first time a visitor opens one.
  const [extra, setExtra] = useState<Record<string, Pick<LandingApiGuide, "tagline" | "count" | "free" | "locked">> | null>(null);
  const [failed, setFailed] = useState(false);
  const loading = useRef(false);
  const featured = useMemo(() => new Set(data.guides.map(item => item.id)), [data.guides]);
  const rail = useMemo(() => category === "popular"
    ? data.guides.map(item => data.technologies.find(tech => tech.id === item.id)).filter((tech): tech is LandingApiTech => Boolean(tech))
    : data.technologies.filter(tech => tech.category === category), [category, data.guides, data.technologies]);
  const tech = data.technologies.find(item => item.id === guideId);
  const guide: LandingApiGuide | undefined = data.guides.find(item => item.id === guideId) ?? (tech && extra?.[tech.id] ? { id: tech.id, name: tech.name, logo: tech.logo ?? "", ...extra[tech.id] } : undefined);
  const choose = (id: string) => {
    setGuideId(id);
    if (featured.has(id) || extra || loading.current) return;
    loading.current = true;
    setFailed(false);
    fetch("/api/landing/api-guides").then(response => response.ok ? response.json() : Promise.reject(new Error("api guides"))).then(setExtra, () => setFailed(true)).finally(() => { loading.current = false; });
  };
  const chooseCategory = (id: string) => {
    setCategory(id);
    const first = id === "popular" ? data.guides[0]?.id : data.technologies.find(item => item.category === id)?.id;
    if (first) choose(first);
  };
  const typeOf = (k: string) => data.types.find(type => type.k === k);
  const entryHref = (name: string) => `/learning/api-docs/${encodeURIComponent(guideId ?? "")}/${encodeURIComponent(name)}`;
  const count = (value: number) => value.toLocaleString("en-IN");
  return <section ref={section} id="api-docs" className={frame.section} data-ground="paper" aria-labelledby="landing-api-title"><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><FileCode2 size={14} aria-hidden="true" />API Docs<span>{count(data.identifierCount)} APIs · {count(data.technologyCount)} technologies</span></p>
        <h3 data-h2="" id="landing-api-title">The APIs that matter, <em>without the noise.</em></h3>
      </div>
      <div>
        <p className={frame.lede}>A field guide to the tools you build with, written from each project&apos;s official documentation. Learn what an API does in one line, then go as deep as you need.</p>
        <dl className={frame.facts}>
          <div><dt>Technologies</dt><dd>{count(data.technologyCount)}</dd></div>
          <div><dt>Free per technology</dt><dd>5</dd></div>
          <div><dt>APIs for members</dt><dd>{count(data.identifierCount)}</dd></div>
        </dl>
      </div>
    </header>
    <div className={styles.guideDock}>
      <div id="api-docs-tabs" key={tabPage} className={styles.guideCats} role="group" aria-label="Technology categories">
        {tabs.slice(tabPage * API_TABS_PER_PAGE, (tabPage + 1) * API_TABS_PER_PAGE).map(item => {
          const look = API_TAB_LOOK[item.id];
          const Icon = look?.icon ?? FileCode2;
          const techCount = item.id === "popular" ? data.guides.length : data.technologies.filter(tech => tech.category === item.id).length;
          return <button type="button" key={item.id} data-tone={look?.tone} title={item.label} aria-pressed={item.id === category} onClick={() => chooseCategory(item.id)}>
            <span className={styles.guideCatIcon} aria-hidden="true"><Icon size={16} /></span>
            <span className={styles.guideCatLabel}>{look?.short ?? item.label}</span>
            <small aria-label={`${techCount} technologies`}>{techCount}</small>
          </button>;
        })}
      </div>
      <PillPager className={styles.guideCatPager} page={tabPage} pages={tabPages} total={tabs.length} perPage={API_TABS_PER_PAGE} onPage={setTabPage} label="Technology categories" noun="categories" controls="api-docs-tabs" />
    </div>
    <article className={styles.guide} aria-label="API Docs preview">
      <div className={styles.guideRail} role="group" aria-label="Technologies">
        {rail.map(item => <button type="button" key={item.id} aria-pressed={item.id === guideId} onClick={() => choose(item.id)}>
          {item.logo ? <Image src={item.logo} alt="" width={22} height={22} loading="lazy" unoptimized={item.logo.endsWith(".svg")} /> : <em aria-hidden="true">{item.icon}</em>}<span>{item.name}</span><small>{count(item.count)}</small>
        </button>)}
      </div>
      <div className={styles.guideSheet}>
        {!guide && <p className={styles.guideWait} role="status">{failed ? "This technology could not load. Choose it again to retry." : `Opening ${tech?.name ?? "this technology"}…`}</p>}
        {guide && <>
          <div className={styles.guideHead}>
            <div className={styles.guideName}>{guide.name}{guide.version && <small>{guide.version}</small>}</div>
            <p>{guide.tagline}</p>
            {guide.install && <code>{guide.install}</code>}
          </div>
          {guide.free.length > 0
            ? <><p className={styles.guideLabel}><Sparkles size={14} aria-hidden="true" />Start with {guide.free.length === 5 ? "these five" : "these"}, free to read</p>
              <ol className={styles.guideFree} key={guide.id}>{guide.free.map((item, index) => { const type = typeOf(item.kind); return <li key={item.name}>
                <span className={styles.guideIndex} aria-hidden="true">{index + 1}</span>
                <div>
                  <p className={styles.guideApi}><code>{item.name}</code><small style={{ "--badge": type?.c ?? "#87867f" } as CSSProperties}>{type?.label}</small></p>
                  <p>{item.summary}</p>
                  {item.signature && <code className={styles.guideSignature}>{item.signature}</code>}
                </div>
              </li>; })}</ol></>
            : <p className={styles.guideWait}>Short descriptions for {guide.name} are being written from its official documentation.</p>}
          {member
            ? <>
              <p className={styles.guideLabel}><Sparkles size={14} aria-hidden="true" />All {count(guide.count)} {guide.name} APIs are open to you</p>
              <ul className={styles.guideLocked}>{guide.locked.map(item => <li key={item.name}><Link href={entryHref(item.name)}><code>{item.name}</code><ArrowUpRight size={14} aria-hidden="true" /></Link></li>)}</ul>
              <Link className={frame.cta} href={`/learning/api-docs/${guide.id}`}>Open {guide.name} in API Docs<ArrowRight size={16} aria-hidden="true" /></Link>
            </>
            : <ApiVault key={guide.id} guide={guide} visible={visible} />}
        </>}
      </div>
    </article>
  </div></section>;
}
