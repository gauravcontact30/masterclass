"use client";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "@/components/responsive-image";
import { ArrowRight, ArrowUpRight, BookOpenCheck, Gauge, Layers, Lightbulb, Search, Sparkles, TrendingUp, X } from "lucide-react";
import type { LandingSearchIndex } from "@/lib/landing-search-types";
import type { FreshDocTip } from "@/lib/landing-fresh-types";
import type { LandingBuzz } from "@/lib/landing-buzz-types";
import { useContentItem } from "./content-editing";
import { useNearViewport } from "./use-near-viewport";
import { useVisiblePlayback } from "./use-visible-playback";
import { BuzzStrip } from "./landing-buzz-strip";
import { CodeFiles } from "./code-files";
import { PillPager } from "./pill-pager";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./landing-search-docs.module.css";

/** Filter chips: one per logo, so the three Next.js handbooks (or the four LangChain-family ones) share a chip. */
const LOGO_LABELS: Record<string, string> = {
  nextjs: "Next.js", react: "React", typescript: "TypeScript", javascript: "JavaScript", python: "Python", nodejs: "Node.js", nestjs: "NestJS",
  docker: "Docker", kubernetes: "Kubernetes", git: "Git", langchain: "LangChain", langgraph: "LangGraph", langsmith: "LangSmith", langflow: "Langflow",
  n8n: "n8n", "agentic-ai": "Agentic AI", aws: "AWS", redis: "Redis", postgresql: "Databases", tanstack: "TanStack", zustand: "Zustand",
  playwright: "Playwright", vitest: "Vitest", graphql: "GraphQL", "system-design": "System Design",
};
const RESULTS = 8;
/** Popular searches and technology filters per page (user request 2026-11-01: three a page). */
const PILLS_PER_PAGE = 3;
const TIP_EXTENSIONS: Record<string, string> = { tsx: "tsx", jsx: "jsx", typescript: "ts", ts: "ts", javascript: "js", js: "js", python: "py", bash: "sh", shell: "sh", json: "json", yaml: "yaml", sql: "sql", go: "go", rust: "rs", css: "css", html: "html" };
type Hit = { name: string; category: string; book: number; score: number };
type Result = { hits: Hit[]; searched: number; ms: number; words: string[]; logo: string | null };

/** Every topic matching all the query's words (within one technology when `logo` is set), timed in this browser. */
function search(index: LandingSearchIndex, query: string, logo: string | null): Result {
  const started = performance.now();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits: Hit[] = [];
  let searched = 0;
  for (const [name, category, book] of index.topics) {
    if (logo && index.handbooks[book].logo !== logo) continue;
    searched++;
    if (!words.length) continue;
    const lower = name.toLowerCase(), haystack = `${lower} ${index.categories[category].toLowerCase()} ${index.handbooks[book].title.toLowerCase()}`;
    if (!words.every(word => haystack.includes(word))) continue;
    // Names that start with the query first, then names containing it, then category or handbook matches.
    const score = words.reduce((sum, word) => sum + (lower.startsWith(word) ? 3 : lower.includes(word) ? 2 : 0), 0);
    hits.push({ name, category: index.categories[category], book, score });
  }
  hits.sort((a, b) => b.score - a.score || a.name.length - b.name.length || a.name.localeCompare(b.name));
  return { hits, searched, ms: performance.now() - started, words, logo };
}

/** The query's words highlighted in a result name. */
function highlight(text: string, words: string[]): ReactNode {
  if (!words.length) return text;
  const pattern = new RegExp(`(${words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(pattern).map((part, i) => i % 2 ? <mark key={i}>{part}</mark> : part);
}

/**
 * Technology docs, as the dashboard's Search page works: one field searches every topic of the technology handbooks
 * (about 2,800), technology icons filter them, and popular searches start you off. The topic index (~27 KB) is a static
 * file fetched only as the section nears the screen, and the search runs in the browser, so the "searched N topics
 * in X ms" proof is measured, not claimed. Each result opens on the Search page after sign-in. Today's AI-written doc
 * tip (lib/server/landing-fresh.ts) and fresh Tech Buzz stories sit beside it.
 */
export function LandingSearchDocs({ fresh, buzz, week = 0 }: Readonly<{ fresh?: FreshDocTip | null; buzz?: LandingBuzz[]; week?: number }>) {
  const section = useContentItem("section:tech-docs", "section");
  const ref = useRef<HTMLElement>(null);
  const near = useNearViewport(ref); const visible = useVisiblePlayback(ref);
  const [index, setIndex] = useState<LandingSearchIndex | null>(null); const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState(""); const [logo, setLogo] = useState<string | null>(null);
  // Keep typing urgent; sorting the topic matches can yield to the next keystroke on slower devices.
  const deferredQuery = useDeferredValue(query);
  const deferredLogo = useDeferredValue(logo);
  const result = useMemo(() => index ? search(index, deferredQuery, deferredLogo) : null, [index, deferredQuery, deferredLogo]);
  const update = (next: { query?: string; logo?: string | null }) => {
    if (next.query !== undefined) setQuery(next.query);
    if (next.logo !== undefined) setLogo(next.logo);
  };
  const [placeholder, setPlaceholder] = useState(0);
  const [popularPage, setPopularPage] = useState(0); const [filterPage, setFilterPage] = useState(0);
  useEffect(() => {
    if (!near || index) return;
    const controller = new AbortController();
    fetch("/api/landing/search-index", { signal: controller.signal }).then(response => response.ok ? response.json() : Promise.reject(new Error(String(response.status))))
      .then((body: LandingSearchIndex) => { setIndex(body); }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [near, index]);
  // Popular searches: one real topic from each technology, turning over weekly, shown three per page.
  const popular = useMemo(() => {
    if (!index) return [];
    const seen = new Set<string>(), picks: { name: string; logo: string }[] = [];
    index.handbooks.forEach((book, h) => {
      if (!book.logo || seen.has(book.logo)) return;
      const topics = index.topics.filter(topic => topic[2] === h);
      if (!topics.length) return;
      seen.add(book.logo); picks.push({ name: topics[(week + h) % topics.length][0], logo: book.logo });
    });
    return picks;
  }, [index, week]);
  useEffect(() => { if (query || !visible || popular.length < 2) return; const timer = setTimeout(() => setPlaceholder(value => (value + 1) % popular.length), 2800); return () => clearTimeout(timer); }, [placeholder, query, visible, popular.length]);
  const filters = useMemo(() => {
    if (!index) return [];
    const counts = new Map<string, number>();
    for (const book of index.handbooks) if (book.logo) counts.set(book.logo, (counts.get(book.logo) ?? 0) + book.topics);
    return [...counts].sort((a, b) => b[1] - a[1]).map(([id, topics]) => ({ id, label: LOGO_LABELS[id] ?? id, topics }));
  }, [index]);
  const words = result?.words ?? [];
  if (section.hidden) return null;
  const total = index?.topics.length ?? 0;
  const searchHref = (q: string) => `/learning/search${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  const shownLogoLabel = logo ? LOGO_LABELS[logo] ?? logo : null;
  return <section ref={ref} id="tech-docs" className={frame.section} data-ground="paper" aria-labelledby="landing-search-title" {...section.props}>{section.toolbar}<div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><BookOpenCheck size={14} aria-hidden="true" />Technology docs<span>{index ? `${total.toLocaleString("en-IN")} topics · ${index.handbooks.length} handbooks` : "Search every handbook"}</span></p>
        <h3 data-h2="" id="landing-search-title">Ask the docs. <em>Answers in milliseconds.</em></h3>
      </div>
      <div>
        <p className={frame.lede}>The dashboard&apos;s Search covers every technology handbook, from React hooks and Docker to LangGraph, Kubernetes and system design. Try it here on the real topic index: type, filter by technology, and open any result with its explanation and worked code after signing in.</p>
        <dl className={frame.facts}>
          <div><dt>Topics indexed</dt><dd>{index ? total.toLocaleString("en-IN") : "…"}</dd></div>
          <div><dt>Handbooks</dt><dd>{index ? index.handbooks.length : "…"}</dd></div>
          <div><dt>Technologies</dt><dd>{index ? filters.length : "…"}</dd></div>
        </dl>
      </div>
    </header>

    <div className={styles.layout}>
      <article className={styles.searchCard} aria-label="Technology docs search">
        <form className={styles.bar} role="search" onSubmit={event => { event.preventDefault(); window.location.assign(searchHref(query.trim())); }}>
          <Search size={20} aria-hidden="true" />
          <input type="search" value={query} onChange={event => update({ query: event.target.value })} aria-label="Search technology docs" placeholder={popular.length ? `Try “${popular[placeholder % popular.length].name}”` : "Search React hooks, Docker, LangGraph…"} disabled={!index && !failed} />
          {query && <button type="button" className={styles.clear} onClick={() => update({ query: "" })} aria-label="Clear search"><X size={15} /></button>}
          <button type="submit" className={styles.go}>Search<ArrowRight size={15} aria-hidden="true" /></button>
        </form>

        {popular.length > 0 && <div className={styles.pillBlock}>
          <div className={styles.popular} id="landing-popular"><span><TrendingUp size={14} aria-hidden="true" />Popular this week</span>{popular.slice(popularPage * PILLS_PER_PAGE, (popularPage + 1) * PILLS_PER_PAGE).map(item => <button type="button" key={item.name} onClick={() => update({ query: item.name, logo: null })}><Image src={`/images/tech/${item.logo}.png`} alt={`${item.name} logo`} aria-hidden="true" width={14} height={14} />{item.name}</button>)}</div>
          <PillPager className={styles.pager} page={Math.min(popularPage, Math.ceil(popular.length / PILLS_PER_PAGE) - 1)} pages={Math.ceil(popular.length / PILLS_PER_PAGE)} total={popular.length} perPage={PILLS_PER_PAGE} onPage={setPopularPage} label="Popular searches" noun="popular searches" controls="landing-popular" />
        </div>}

        {filters.length > 0 && <div className={styles.pillBlock}>
          <div className={styles.filters} id="landing-tech-filters" role="group" aria-label="Filter by technology">
            <button type="button" aria-pressed={!logo} onClick={() => update({ logo: null })}><Layers size={15} aria-hidden="true" />All</button>
            {filters.slice(filterPage * PILLS_PER_PAGE, (filterPage + 1) * PILLS_PER_PAGE).map(item => <button type="button" key={item.id} aria-pressed={logo === item.id} onClick={() => update({ logo: logo === item.id ? null : item.id })} title={`${item.label}: ${item.topics} topics`}>
              <Image src={`/images/tech/${item.id}.png`} alt={`${item.label} logo`} aria-hidden="true" width={18} height={18} /><span>{item.label}</span><small>{item.topics}</small>
            </button>)}
          </div>
          <PillPager className={styles.pager} page={Math.min(filterPage, Math.ceil(filters.length / PILLS_PER_PAGE) - 1)} pages={Math.ceil(filters.length / PILLS_PER_PAGE)} total={filters.length} perPage={PILLS_PER_PAGE} onPage={setFilterPage} label="Technologies" noun="technologies" controls="landing-tech-filters" />
        </div>}

        {/* Proof: what was searched and how long it took, measured in this browser. */}
        <p className={styles.proof} role="status" aria-live="polite">
          <Gauge size={15} aria-hidden="true" />
          {failed ? "The topic index could not load. The full Search is one click away." : !result ? "Loading the topic index…" : words.length
            ? <><b>{result.hits.length.toLocaleString("en-IN")}</b> {result.hits.length === 1 ? "match" : "matches"} in <b>{result.searched.toLocaleString("en-IN")}</b> topics{shownLogoLabel ? ` of ${shownLogoLabel}` : ""} · searched in <b>{result.ms < 1 ? "<1" : result.ms.toFixed(1)} ms</b> in your browser</>
            : <><b>{result.searched.toLocaleString("en-IN")}</b> topics{shownLogoLabel ? ` in ${shownLogoLabel}` : ""} ready to search · type to see results as you go</>}
        </p>

        {result && words.length > 0 && (result.hits.length ? <ol className={styles.results}>{result.hits.slice(0, RESULTS).map((hit, i) => { const book = index!.handbooks[hit.book]; return <li key={`${hit.name}-${hit.book}`} style={{ "--i": i } as React.CSSProperties}>
          <Link href={searchHref(hit.name)}>
            {book.logo ? <Image src={`/images/tech/${book.logo}.png`} alt={`${book.title} logo`} aria-hidden="true" width={22} height={22} /> : <BookOpenCheck size={20} aria-hidden="true" />}
            <span><strong>{highlight(hit.name, words)}</strong><small>{hit.category} · {book.title}</small></span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </li>; })}</ol> : <p className={styles.empty}>No topic matches “{query}”{shownLogoLabel ? ` in ${shownLogoLabel}` : ""}. {logo ? <button type="button" onClick={() => update({ logo: null })}>Search every technology</button> : "Try a shorter word, or ask the AI search in the dashboard."}</p>)}
        {result && words.length > 0 && result.hits.length > RESULTS && <Link className={styles.more} href={searchHref(query.trim())}>See all {result.hits.length.toLocaleString("en-IN")} matches on the Search page<ArrowRight size={15} aria-hidden="true" /></Link>}
      </article>

      <aside className={styles.side}>
        {fresh ? <article className={styles.tip} aria-labelledby="landing-doc-tip">
          <p className={styles.tipKicker}><Sparkles size={14} aria-hidden="true" />Today&apos;s doc tip · {fresh.doc}</p>
          <h3 id="landing-doc-tip">{fresh.title}</h3>
          <p>{fresh.summary}</p>
          {fresh.steps.length > 0 && <ol>{fresh.steps.slice(0, 4).map(step => <li key={step}>{step}</li>)}</ol>}
          {fresh.code && <CodeFiles files={[{ path: `tip.${TIP_EXTENSIONS[fresh.code.language] ?? "txt"}`, code: fresh.code.code, note: fresh.title }]} label={fresh.title} skin="apple" annotate={false} explainFormatting={false} />}
        </article> : <article className={styles.tip} data-tone="butter">
          <p className={styles.tipKicker}><Lightbulb size={14} aria-hidden="true" />How Search helps</p>
          <h3>From a word to working code</h3>
          <ol><li>Search a topic across every handbook</li><li>Read the explanation and key points</li><li>Copy the worked example</li><li>Ask a follow-up in AI search</li></ol>
        </article>}
        <ul className={styles.howList}>
          <li><Search size={16} aria-hidden="true" /><span><b>Instant results</b>Matches appear as you type, ranked by name first.</span></li>
          <li><Layers size={16} aria-hidden="true" /><span><b>Filter by technology</b>Narrow to one stack with its icon.</span></li>
          <li><Sparkles size={16} aria-hidden="true" /><span><b>AI search too</b>Ask in your own words on the dashboard.</span></li>
        </ul>
      </aside>
    </div>

    <BuzzStrip stories={buzz} label={shownLogoLabel ?? "technology docs"} keywords={shownLogoLabel ? [shownLogoLabel, ...words] : words.length ? words : filters.slice(0, 8).map(item => item.label)} />
    <div className={frame.actions}><Link className={frame.cta} href={searchHref(query.trim())}>Open Search<ArrowRight size={16} aria-hidden="true" /></Link><small>Every result opens with its explanation and code after you sign in.</small></div>
  </div></section>;
}
