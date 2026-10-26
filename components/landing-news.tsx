"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { useNearViewport } from "./use-near-viewport";
import { useVisiblePlayback } from "./use-visible-playback";
import { ArrowUpRight, Bot, CircleHelp, Hammer, GraduationCap, Lightbulb, ListChecks, Boxes, BrainCircuit, ChevronLeft, ChevronRight, Cloud, Code2, MessagesSquare, Newspaper, Pause, Play, Rocket, ShoppingCart, Sparkles, Star, TrendingUp, type LucideIcon } from "lucide-react";
import { NEWS_BASICS, NEWS_PER_SLIDE, NEWS_PRACTICE, NEWS_SLIDES, QUESTIONS_PER_SLIDE, type InterviewAsk, type LandingNews as LandingNewsData, type NewsLogo, type NewsSlideData, type NewsSlideId, type NewsSlideMeta, type NewsStory } from "@/lib/landing-news";
import { DEFAULT_LANDING_NEWS } from "@/lib/landing-news-fallback";
import { NEWS_MORE_BASICS, NEWS_QUICK_CHECKS } from "@/lib/landing-news-study";
import Image from "next/image";
import Link from "next/link";
import { ListenButton } from "./listen-button";
import { useLanguage } from "./language-provider";
import styles from "./landing-news.module.css";

/** How long each slide stays before the carousel moves on. */
export const NEWS_AUTOPLAY_MS = 25 * 1000;
/** A slide still being searched is asked for again this often, a few times, until every slide has its stories. */
const REFILL_MS = 30 * 1000, REFILLS = 4;
const NEWS_URL = "/api/landing/news";
const ICONS: Record<NewsSlideId, LucideIcon> = {
  "ai-labs": Sparkles, agentic: Bot, "system-design": Boxes, frontend: Code2, aws: Cloud, musk: Rocket,
  "amazon-ai": ShoppingCart, "questions-tech": MessagesSquare, "questions-agentic": BrainCircuit, trending: TrendingUp,
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Formatted by hand rather than with Intl, so the server's and the browser's text always match at hydration.
const shortDate = (day: string) => { const [, m, d] = day.split("-").map(Number); return `${d} ${MONTHS[m - 1]}`; };
function istTime(iso: string) {
  const at = new Date(Date.parse(iso) + 5.5 * 3600_000);
  const h = at.getUTCHours(), m = String(at.getUTCMinutes()).padStart(2, "0");
  return `${at.getUTCDate()} ${MONTHS[at.getUTCMonth()]}, ${h % 12 || 12}:${m} ${h < 12 ? "am" : "pm"} IST`;
}
const two = (n: number) => String(n).padStart(2, "0");
/** Light tints, one per slide for the cover and one per story or question card, in turn (components/landing-news.module.css). */
const TONES = ["peach", "sage", "sky", "lavender", "butter"] as const;
/** The cards inside a slide start one tint after its cover, so no card matches the cover beside it. */
const cardTone = (slide: number, card: number) => TONES[(slide + 1 + card) % TONES.length];

/**
 * "Fresh in tech": ten slides under the hero, one subject each (AI labs, agentic AI, system design, Next.js and
 * React, AWS, Musk's ventures, Amazon's AI, two sets of most-asked interview questions, and what is trending).
 * Stories are searched live on the server (lib/server/landing-news.ts) and each names its source. Both columns of a
 * slide end level: each closes with study material (<Fit>) that shows as many items as the other column leaves room for. The carousel
 * moves on every 25 seconds, and previous / next move by hand; it waits while the pointer is over it or focus is inside it, and the pause control
 * stops it.
 */
export function LandingNews() {
  const sectionRef = useRef<HTMLElement>(null);
  const nearViewport = useNearViewport(sectionRef);
  const visible = useVisiblePlayback(sectionRef);
  const [news, setNews] = useState<LandingNewsData | null>(null);
  useEffect(() => {
    // Keep offscreen news requests and JSON parsing out of the hero critical path.
    if (!nearViewport) return;
    const controller = new AbortController();
    let timer = 0, tries = 0;
    // Later tries add a query so neither the browser nor the CDN hands back the same still-empty answer.
    const load = () => fetch(tries ? `${NEWS_URL}?refill=${tries}` : NEWS_URL, { signal: controller.signal })
      .then(response => response.ok ? response.json() as Promise<LandingNewsData> : null)
      // Anything that is not a set of slides (an error page, a proxy's JSON) counts as no answer.
      .then(body => Array.isArray(body?.slides) ? body : null)
      .then(data => {
        // A later answer only replaces slides it actually filled, so nothing on screen goes blank.
        setNews(held => !data ? held ?? { updatedAt: null, slides: [] } : !held ? data : {
          updatedAt: data.updatedAt ?? held.updatedAt,
          slides: data.slides.map(slide => slide.fresh ? slide : held.slides.find(old => old.id === slide.id) ?? slide),
        });
        // Ask again while any slide is still empty (its search timed out or the cache was cold).
        if ((!data || data.slides.some(slide => !slide.fresh)) && ++tries <= REFILLS) timer = window.setTimeout(load, REFILL_MS);
      })
      .catch(error => { if ((error as Error).name !== "AbortError") setNews(held => held ?? { updatedAt: null, slides: [] }); });
    void load();
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [nearViewport]);
  const { language } = useLanguage();
  const hi = language === "hi";
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rotating = nearViewport && visible && playing && !hovered && !focused;
  const total = NEWS_SLIDES.length;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setIndex(i => (i + 1) % total), NEWS_AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [rotating, index, total]);

  const go = (to: number) => setIndex((to + total) % total);
  function leaveFocus(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  }

  return (
    <section ref={sectionRef} id="fresh-in-tech" data-own-heading className={styles.news} aria-labelledby="fresh-title" aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={leaveFocus}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.eyebrow}><Newspaper size={14} aria-hidden="true" />{text("Fresh in tech", "टेक में नया")}
            {news?.updatedAt && <span>{text("Updated", "अपडेट")} {istTime(news.updatedAt)}</span>}</p>
          <h2 id="fresh-title">{text("What changed in tech this week", "इस हफ़्ते टेक में क्या बदला")}</h2>
          <p className={styles.lede}>{text("Ten slides of real news explained for learners, the interview questions candidates are being asked right now, and a quick check on each subject.", "सीखने वालों के लिए समझाई गई असली खबरों की दस स्लाइड, वे इंटरव्यू प्रश्न जो अभी पूछे जा रहे हैं, और हर विषय पर एक त्वरित जाँच।")}</p>
        </header>
        <div className={styles.bar}>
          {(() => {
            const current = NEWS_SLIDES[index], Icon = ICONS[current.id];
            return <p className={styles.current}><Icon size={15} aria-hidden="true" />{hi ? current.hiTitle : current.title}</p>;
          })()}
          <div className={styles.controls}>
            <button type="button" onClick={() => go(index - 1)} aria-label={text("Previous slide", "पिछली स्लाइड")}><ChevronLeft size={18} aria-hidden="true" /></button>
            <button type="button" onClick={() => { if (!playing) setFocused(false); setPlaying(!playing); }} aria-label={playing ? text("Pause slideshow", "स्लाइड शो रोकें") : text("Play slideshow", "स्लाइड शो चलाएँ")}>
              {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label={text("Next slide", "अगली स्लाइड")}><ChevronRight size={18} aria-hidden="true" /></button>
            <span className={styles.count} aria-hidden="true">{two(index + 1)} / {two(total)}</span>
          </div>
        </div>
        <div className={styles.progress} aria-hidden="true">{rotating && <span key={index} style={{ animationDuration: `${NEWS_AUTOPLAY_MS}ms` }} />}</div>

        <div className={styles.slides} aria-live={rotating ? "off" : "polite"}>
          {NEWS_SLIDES.map((meta, i) => {
            const fallbackSlide = DEFAULT_LANDING_NEWS.slides.find(s => s.id === meta.id);
            const data = news?.slides.find(slide => slide.id === meta.id) ?? fallbackSlide;
            return <article key={meta.id} className={styles.slide} data-tone={TONES[i % TONES.length]} hidden={i !== index} aria-roledescription="slide" aria-label={`${i + 1} / ${total}: ${hi ? meta.hiTitle : meta.title}`}>
              {/* Only the slide on show is built: the hidden ones were ~3,000 nodes to hydrate on every visit. */}
              {i === index && <><Cover meta={meta} hi={hi} eager={false} data={data} />
              <div className={styles.body}>
                {data?.kind === "news" && data.stories.length > 0 && <Stories stories={data.stories.slice(0, NEWS_PER_SLIDE)} hi={hi} slide={i} />}
                {data?.kind === "questions" && data.questions.length > 0 && <Questions questions={data.questions.slice(0, QUESTIONS_PER_SLIDE)} hi={hi} slide={i} />}
                {data?.kind === "news" && data.stories.length > NEWS_PER_SLIDE && <Headlines stories={data.stories.slice(NEWS_PER_SLIDE)} hi={hi} />}
                {data?.kind === "questions" && data.questions.length > QUESTIONS_PER_SLIDE && <AlsoAsked questions={data.questions.slice(QUESTIONS_PER_SLIDE)} hi={hi} />}
                <Practice id={meta.id} hi={hi} />
                <QuickCheck id={meta.id} hi={hi} />
                {!news && <div className={styles.loading} role="status">{hi ? "ताज़ा खबरें लोड हो रही हैं…" : "Loading this week's stories…"}<span /><span /><span /></div>}
                {news && !(data?.kind === "news" ? data.stories.length : data?.kind === "questions" ? data.questions.length : 0) && <Newsrooms meta={meta} hi={hi} />}
              </div></>}
            </article>;
          })}
        </div>
      </div>
    </section>
  );
}

function Cover({ meta, hi, eager, data }: { meta: NewsSlideMeta; hi: boolean; eager: boolean; data?: NewsSlideData }) {
  // The cover's lower half indexes what the slide holds, sums it up, teaches the basics (as many as fit beside the
  // stories) and ends with where to go deeper on MasterClass Buddy.
  const items: { title: string; source: string | null; date: string | null; logo: NewsLogo | null }[] = data?.kind === "news"
    ? data.stories.slice(0, NEWS_PER_SLIDE).map(story => ({ title: story.title, source: story.source, date: story.date, logo: story.logo }))
    : data?.kind === "questions" ? data.questions.slice(0, QUESTIONS_PER_SLIDE).map(ask => ({ title: ask.question, source: ask.source, date: null, logo: ask.companies[0] ?? null })) : [];
  const sources = [...new Set(items.flatMap(item => item.source ? [item.source] : []))];
  const dates = items.flatMap(item => item.date ? [item.date] : []).sort();
  const companies = data?.kind === "questions" ? [...new Set(data.questions.flatMap(ask => ask.companies.map(company => company.name)))] : [];
  const glance: [string, string][] = items.length ? [
    [String(items.length), meta.kind === "questions" ? (hi ? "प्रश्न" : "questions") : (hi ? "खबरें" : "stories")],
    meta.kind === "questions" ? [String(companies.length || "—"), hi ? "कंपनियाँ" : "companies"] : [String(sources.length), hi ? "स्रोत" : "sources"],
    dates.length ? [dates[0] === dates.at(-1) ? shortDate(dates[0]) : `${shortDate(dates[0])} – ${shortDate(dates.at(-1)!)}`, hi ? "तारीख़ें" : "dates"]
      : [String(data?.kind === "questions" ? Math.round(data.questions.reduce((sum, ask) => sum + ask.rating, 0) / Math.max(1, data.questions.length) * 10) / 10 : "—"), hi ? "औसत रेटिंग" : "avg. asked"],
  ] : [];
  const Icon = ICONS[meta.id];
  const [failed, setFailed] = useState(false);
  return <div className={styles.cover}>
    {/* Painted through the AI Gateway: this 21-day set's own cover when it has one, else the standing cover (scripts/generate-news-covers.ts). */}
    <div className={styles.picture} data-empty={failed}>
      {!failed && <Image src={data?.cover ?? `/images/news/${meta.id}.webp`} unoptimized={Boolean(data?.cover)} alt="" fill sizes="(max-width: 899px) calc(100vw - 60px), 480px" preload={eager} loading={eager ? undefined : "lazy"} onError={() => setFailed(true)} />}
      <Icon className={styles.pictureIcon} size={56} strokeWidth={1.2} aria-hidden="true" />
      <span className={styles.kicker}><Icon size={12} aria-hidden="true" />{meta.kind === "questions" ? (hi ? "इंटरव्यू" : "Interviews") : (hi ? "खबरें" : "News")}</span>
    </div>
    <h3>{hi ? meta.hiTitle : meta.title}</h3>
    <p>{hi ? meta.hiBlurb : meta.blurb}</p>
    <ul className={styles.topics}>{meta.topics.map(topic => <li key={topic}>{topic}</li>)}</ul>
    {items.length > 0 && <div className={styles.index}>
      <dl className={styles.glance} aria-label={hi ? "एक नज़र में" : "At a glance"}>{glance.map(([value, label]) => <div key={label}><dd>{value}</dd><dt>{label}</dt></div>)}</dl>
      <h5>{hi ? "इस स्लाइड में" : "In this slide"}</h5>
      <ol>{items.map(item => <li key={item.title}>
        <span>{item.title}</span>
        {(item.source || item.date) && <small>{item.logo && <Logo logo={item.logo} />}{[item.source, item.date ? shortDate(item.date) : null].filter(Boolean).join(" · ")}</small>}
      </li>)}</ol>
    </div>}
    <Fit className={`${styles.extra} ${styles.basics}`} as="dl" keep={4} watch={hi}
      heading={<h5><Sparkles size={14} aria-hidden="true" />{hi ? "बुनियादी बातें समझें" : "Learn the basics"}</h5>}>
      {[...NEWS_BASICS[meta.id], ...NEWS_MORE_BASICS[meta.id]].map(basic => <div key={basic.term}><dt>{basic.term}</dt><dd>{hi ? basic.hiExplain : basic.explain}</dd></div>)}
    </Fit>
    <div className={`${styles.extra} ${styles.deeper}`}>
      <h5><GraduationCap size={14} aria-hidden="true" />{hi ? "MasterClass Buddy पर आगे सीखें" : "Keep learning on MasterClass Buddy"}</h5>
      <ul>{meta.learn.map(link => <li key={link.href}><Link href={link.href}>{hi ? link.hiLabel : link.label}<ArrowUpRight size={13} aria-hidden="true" /></Link></li>)}</ul>
    </div>
  </div>;
}

export function Logo({ logo }: { logo: NewsLogo }) {
  return <span className={styles.logo} title={logo.name} style={logo.path ? undefined : { background: `#${logo.hex}` }}>
    {logo.path
      ? <svg viewBox="0 0 24 24" aria-hidden="true" fill={`#${logo.hex}`}><path d={logo.path} /></svg>
      : <b aria-hidden="true">{logo.name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean).map(word => word[0]).join("").slice(0, 2).toUpperCase() || "•"}</b>}
  </span>;
}

function Concept({ concept, hi }: { concept: NonNullable<NewsStory["concept"]>; hi: boolean }) {
  return <p className={styles.concept}><GraduationCap size={14} aria-hidden="true" /><span><b>{hi ? "सीखें" : "Learn"}: {concept.term}</b> — {concept.explain}</span></p>;
}

function Stories({ stories, hi, slide }: { stories: NewsStory[]; hi: boolean; slide: number }) {
  const [lead, ...rest] = stories;
  const byline = (story: NewsStory) => <span className={styles.byline}>{story.logo && <Logo logo={story.logo} />}<span className={styles.source}>{story.source}</span><time dateTime={story.date}>{shortDate(story.date)}</time></span>;
  return <>
    <div className={styles.lead} data-tone={cardTone(slide, 0)}>
      <div className={styles.leadHead}>{byline(lead)}<ListenButton id={`news:${lead.url}`} title={lead.title} compact
        text={() => [lead.title, lead.summary, ...lead.points, lead.why ? `${hi ? "क्यों ज़रूरी है" : "Why it matters"}: ${lead.why}` : "", lead.concept ? `${lead.concept.term}: ${lead.concept.explain}` : ""].filter(Boolean).join(". ")} /></div>
      <h4>{lead.title}</h4>
      <p>{lead.summary}</p>
      {lead.points.length > 0 && <div className={styles.facts}>
        <h5><ListChecks size={14} aria-hidden="true" />{hi ? "मुख्य बातें" : "Key facts"}</h5>
        <ul>{lead.points.map(point => <li key={point}>{point}</li>)}</ul>
      </div>}
      {lead.why && <p className={styles.why}><Lightbulb size={14} aria-hidden="true" /><span><b>{hi ? "क्यों ज़रूरी है" : "Why it matters"}:</b> {lead.why}</span></p>}
      {lead.concept && <Concept concept={lead.concept} hi={hi} />}
    </div>
    {rest.length > 0 && <ul className={styles.more}>{rest.map((story, k) => <li key={story.url} data-tone={cardTone(slide, k + 1)}>
      {byline(story)}
      <b className={styles.storyTitle}>{story.title}</b>
      <p>{story.summary}</p>
      {story.points.length > 0 && <ul className={styles.points}>{story.points.slice(0, 2).map(point => <li key={point}>{point}</li>)}</ul>}
      {story.why && <p className={styles.why}><Lightbulb size={13} aria-hidden="true" /><span>{story.why}</span></p>}
      {story.concept && <Concept concept={story.concept} hi={hi} />}
    </li>)}</ul>}
  </>;
}

/** Stories beyond the slide's four cards: a compact two-column list, each naming its source, with its concept. */
function Headlines({ stories, hi }: { stories: NewsStory[]; hi: boolean }) {
  return <section className={styles.headlines} aria-label={hi ? "और सुर्ख़ियाँ" : "More headlines"}>
    <h5><Newspaper size={14} aria-hidden="true" />{hi ? "और सुर्ख़ियाँ" : "More headlines"}</h5>
    <ol>{stories.map(story => <li key={story.url}>
      <small>{story.logo && <Logo logo={story.logo} />}{story.source} · <time dateTime={story.date}>{shortDate(story.date)}</time></small>
      <span>{story.title}</span>
      <p>{story.summary}</p>
      {story.concept && <p className={styles.headlineConcept}><GraduationCap size={13} aria-hidden="true" /><span><b>{story.concept.term}</b>: {story.concept.explain}</span></p>}
    </li>)}</ol>
  </section>;
}

/** Eight short questions with answers on the slide's subject, closing the stories column (as many as fit). */
function QuickCheck({ id, hi }: { id: NewsSlideId; hi: boolean }) {
  return <Fit className={styles.quick} as="ol" keep={2} watch={hi}
    heading={<h5><CircleHelp size={14} aria-hidden="true" />{hi ? "त्वरित जाँच" : "Quick check"}</h5>}>
    {NEWS_QUICK_CHECKS[id].map(check => <li key={check.q}><b>{hi ? check.hiQ : check.q}</b><p>{hi ? check.hiA : check.a}</p></li>)}
  </Fit>;
}

const NARROW = "(max-width: 899px)";
/**
 * Study material that fills what is left of a slide column. On the two-column layout it takes the height the
 * other column sets and shows only the items that fit whole (always at least `keep`, which also set its minimum
 * height), stretching them slightly so the column ends level; on one column it shows `keep + 1`.
 * Item heights are measured once per width (or language), then the count follows the space available.
 */
function Fit({ as: List, keep, watch, heading, className, children }: { as: "dl" | "ol"; keep: number; watch: unknown; heading: ReactNode; className?: string; children: ReactNode[] }) {
  const box = useRef<HTMLDivElement>(null), list = useRef<HTMLElement>(null);
  const sizes = useRef<{ heights: number[]; gap: number; head: number; pad: number; width: number }>({ heights: [], gap: 0, head: 0, pad: 0, width: -1 });
  const [count, setCount] = useState<number | null>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const total = children.length;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      if (window.matchMedia(NARROW).matches) { setMinHeight(undefined); setCount(Math.min(total, keep + 1)); return; }
      const { heights, gap, head, pad } = sizes.current;
      const room = el.clientHeight - head - pad;
      let used = 0, n = 0;
      for (const h of heights) { const next = used + (n ? gap : 0) + h; if (next > room) break; used = next; n++; }
      setCount(Math.max(Math.min(keep, total), n));
    };
    const measure = () => {
      const items = list.current ? [...list.current.children] as HTMLElement[] : [];
      const style = list.current ? getComputedStyle(list.current) : null;
      const gap = style ? parseFloat(style.rowGap) || 0 : 0;
      const heights = items.map(item => item.getBoundingClientRect().height);
      const head = el.clientHeight && list.current ? list.current.getBoundingClientRect().top - el.getBoundingClientRect().top : 0;
      const pad = parseFloat(getComputedStyle(el).paddingBottom) || 0;
      sizes.current = { heights, gap, head, pad, width: el.clientWidth };
      const kept = heights.slice(0, keep);
      setMinHeight(window.matchMedia(NARROW).matches || !kept.length ? undefined : Math.ceil(head + pad + kept.reduce((sum, h) => sum + h, 0) + gap * (kept.length - 1)));
      fit();
    };
    if (count === null) { measure(); return; }
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      // A new width rewraps every item, so they are measured again; a new height only changes how many fit.
      if (el.clientWidth !== sizes.current.width) setCount(null); else fit();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [count, keep, total]);
  // A language switch changes every item's text: measure again (state adjusted while rendering, as React advises).
  const [measuredFor, setMeasuredFor] = useState(watch);
  if (measuredFor !== watch) { setMeasuredFor(watch); setCount(null); }

  const shown = count === null ? children : children.slice(0, count);
  return <div ref={box} className={`${styles.fit} ${className ?? ""}`} data-measuring={count === null || undefined} style={{ minHeight }}>
    {heading}
    <List ref={list as never}>{shown}</List>
  </div>;
}

/** Three hands-on tasks for the slide's subject, so the week's news ends in something to practise. */
function Practice({ id, hi }: { id: NewsSlideId; hi: boolean }) {
  return <section className={styles.practice} aria-label={hi ? "इस हफ़्ते आज़माएँ" : "Try this week"}>
    <h5><Hammer size={14} aria-hidden="true" />{hi ? "इस हफ़्ते आज़माएँ" : "Try this week"}</h5>
    <ol>{NEWS_PRACTICE[id].map((item, at) => <li key={item.title}>
      <span className={styles.practiceNumber} aria-hidden="true">{at + 1}</span>
      <div><b>{item.title}</b><p>{hi ? item.hiTask : item.task}</p></div>
    </li>)}</ol>
  </section>;
}

/** Interview questions beyond the slide's five cards, with their short answers. */
function AlsoAsked({ questions, hi }: { questions: InterviewAsk[]; hi: boolean }) {
  return <section className={styles.headlines} aria-label={hi ? "ये भी पूछे गए" : "Also asked"}>
    <h5><MessagesSquare size={14} aria-hidden="true" />{hi ? "ये भी पूछे गए" : "Also asked"}</h5>
    <ol>{questions.map(ask => <li key={ask.question}>
      {ask.url && <small>{ask.companies[0] && <Logo logo={ask.companies[0]} />}{ask.source}</small>}
      <span>{ask.question}</span>
      <p>{ask.answer}</p>
    </li>)}</ol>
  </section>;
}

function Stars({ rating, hi }: { rating: number; hi: boolean }) {
  return <span className={styles.stars} role="img" aria-label={hi ? `${rating} में से 5 — कितनी बार पूछा जाता है` : `Asked often: ${rating} of 5`}>
    {Array.from({ length: 5 }, (_, i) => <Star key={i} size={13} aria-hidden="true" data-on={i < rating} />)}
  </span>;
}

function Questions({ questions, hi, slide }: { questions: InterviewAsk[]; hi: boolean; slide: number }) {
  return <ol className={styles.questions}>{questions.map((ask, i) => <li key={ask.question} data-tone={cardTone(slide, i)}>
    <span className={styles.qNumber} aria-hidden="true">{two(i + 1)}</span>
    <div>
      <h4>{ask.question}</h4>
      <p>{ask.answer}</p>
      <div className={styles.qMeta}>
        <Stars rating={ask.rating} hi={hi} />
        <ListenButton id={`news-ask:${ask.question}`} title={ask.question} text={() => `${ask.question} ${ask.answer}`} compact className={styles.askListen} />
        {ask.companies.length > 0 && <span className={styles.companies}><span>{hi ? "पूछा गया:" : "Asked at"}</span>{ask.companies.map(company => <span key={company.name} className={styles.company}><Logo logo={company} />{company.name}</span>)}</span>}
        {ask.url && <span>{ask.source}</span>}
      </div>
    </div>
  </li>)}</ol>;
}

function Newsrooms({ meta, hi }: { meta: NewsSlideMeta; hi: boolean }) {
  const inPage = meta.newsrooms.filter(room => room.href.startsWith("#"));
  return <div className={styles.empty}>
    <p>{hi ? "ताज़ा खबरें अभी लोड हो रही हैं। थोड़ी देर में फिर देखें।" : "Fresh stories are being refreshed. Check back in a moment."}</p>
    {inPage.length > 0 && <ul>{inPage.map(room => <li key={room.href}><a href={room.href}>{room.label}<ArrowUpRight size={13} aria-hidden="true" /></a></li>)}</ul>}
  </div>;
}
