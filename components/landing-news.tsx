"use client";

import { useEffect, useState, type FocusEvent } from "react";
import { preload } from "react-dom";
import { ArrowUpRight, Bot, GraduationCap, Lightbulb, ListChecks, Boxes, BrainCircuit, ChevronLeft, ChevronRight, Cloud, Code2, MessagesSquare, Newspaper, Pause, Play, Rocket, ShoppingCart, Sparkles, Star, TrendingUp, type LucideIcon } from "lucide-react";
import { NEWS_SLIDES, type InterviewAsk, type LandingNews as LandingNewsData, type NewsLogo, type NewsSlideData, type NewsSlideId, type NewsSlideMeta, type NewsStory } from "@/lib/landing-news";
import Image from "next/image";
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
 * Stories are searched live on the server (lib/server/landing-news.ts) and each links to its source. The carousel
 * moves on every 25 seconds, and previous / next move by hand; it waits while the pointer is over it or focus is inside it, and the pause control
 * stops it.
 */
export function LandingNews() {
  // A <link rel=preload> in the page head starts the download with the HTML, before this script has even run; the
  // fetch below then picks the response up. The stories live in a server-side store, so this is quick even when
  // the searches behind them are being refreshed.
  preload(NEWS_URL, { as: "fetch", crossOrigin: "anonymous" });
  const [news, setNews] = useState<LandingNewsData | null>(null);
  useEffect(() => {
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
  }, []);
  const { language } = useLanguage();
  const hi = language === "hi";
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rotating = playing && !hovered && !focused;
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
    <section id="fresh-in-tech" data-own-heading className={styles.news} aria-labelledby="fresh-title" aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={leaveFocus}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.eyebrow}><Newspaper size={14} aria-hidden="true" />{text("Fresh in tech", "टेक में नया")}
            {news?.updatedAt && <span>{text("Updated", "अपडेट")} {istTime(news.updatedAt)}</span>}</p>
          <h2 id="fresh-title">{text("What changed in tech this week", "इस हफ़्ते टेक में क्या बदला")}</h2>
          <p className={styles.lede}>{text("Ten slides of real news with links to the source, plus the interview questions candidates are being asked right now.", "स्रोत के लिंक के साथ असली खबरों की दस स्लाइड, और वे इंटरव्यू प्रश्न जो अभी पूछे जा रहे हैं।")}</p>
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
            const data = news?.slides.find(slide => slide.id === meta.id);
            return <article key={meta.id} className={styles.slide} data-tone={TONES[i % TONES.length]} hidden={i !== index} aria-roledescription="slide" aria-label={`${i + 1} / ${total}: ${hi ? meta.hiTitle : meta.title}`}>
              <Cover meta={meta} hi={hi} eager={i === 0} data={data} />
              <div className={styles.body}>
                {data?.kind === "news" && data.stories.length > 0 && <Stories stories={data.stories} hi={hi} slide={i} />}
                {data?.kind === "questions" && data.questions.length > 0 && <Questions questions={data.questions} hi={hi} slide={i} />}
                {!news && <div className={styles.loading} role="status">{hi ? "ताज़ा खबरें लोड हो रही हैं…" : "Loading this week's stories…"}<span /><span /><span /></div>}
                {news && !(data?.kind === "news" ? data.stories.length : data?.kind === "questions" ? data.questions.length : 0) && <Newsrooms meta={meta} hi={hi} />}
              </div>
            </article>;
          })}
        </div>
      </div>
    </section>
  );
}

function Cover({ meta, hi, eager, data }: { meta: NewsSlideMeta; hi: boolean; eager: boolean; data?: NewsSlideData }) {
  // The cover is as tall as the stories beside it, so its lower half indexes what the slide holds.
  const items = data?.kind === "news" ? data.stories.map(story => story.title) : data?.kind === "questions" ? data.questions.map(ask => ask.question) : [];
  const sources = data?.kind === "news" ? data.stories.map(story => story.source) : data?.kind === "questions" ? data.questions.flatMap(ask => ask.source ? [ask.source] : []) : [];
  const Icon = ICONS[meta.id];
  const [failed, setFailed] = useState(false);
  return <div className={styles.cover}>
    {/* Full-HD 16:9 cover painted through the AI Gateway (scripts/generate-news-covers.ts), shown whole in a 16:9 frame. */}
    <div className={styles.picture} data-empty={failed}>
      {!failed && <Image src={`/images/news/${meta.id}.webp`} alt="" fill sizes="(max-width: 899px) calc(100vw - 60px), 480px" preload={eager} loading={eager ? undefined : "lazy"} onError={() => setFailed(true)} />}
      <Icon className={styles.pictureIcon} size={56} strokeWidth={1.2} aria-hidden="true" />
      <span className={styles.kicker}><Icon size={12} aria-hidden="true" />{meta.kind === "questions" ? (hi ? "इंटरव्यू" : "Interviews") : (hi ? "खबरें" : "News")}</span>
    </div>
    <h3>{hi ? meta.hiTitle : meta.title}</h3>
    <p>{hi ? meta.hiBlurb : meta.blurb}</p>
    <ul className={styles.topics}>{meta.topics.map(topic => <li key={topic}>{topic}</li>)}</ul>
    {items.length > 0 && <div className={styles.index}>
      <h5>{hi ? "इस स्लाइड में" : "In this slide"}</h5>
      <ol>{items.map(item => <li key={item}>{item}</li>)}</ol>
      {sources.length > 0 && <p>{hi ? "स्रोत" : "Sources"}: {[...new Set(sources)].join(" · ")}</p>}
    </div>}
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
      {byline(lead)}
      <h4><a href={lead.url} target="_blank" rel="noopener noreferrer">{lead.title}</a></h4>
      <p>{lead.summary}</p>
      {lead.points.length > 0 && <div className={styles.facts}>
        <h5><ListChecks size={14} aria-hidden="true" />{hi ? "मुख्य बातें" : "Key facts"}</h5>
        <ul>{lead.points.map(point => <li key={point}>{point}</li>)}</ul>
      </div>}
      {lead.why && <p className={styles.why}><Lightbulb size={14} aria-hidden="true" /><span><b>{hi ? "क्यों ज़रूरी है" : "Why it matters"}:</b> {lead.why}</span></p>}
      {lead.concept && <Concept concept={lead.concept} hi={hi} />}
      <a className={styles.read} href={lead.url} target="_blank" rel="noopener noreferrer">{hi ? "पूरी खबर पढ़ें" : "Read the full story"}<ArrowUpRight size={14} aria-hidden="true" /></a>
    </div>
    {rest.length > 0 && <ul className={styles.more}>{rest.map((story, k) => <li key={story.url} data-tone={cardTone(slide, k + 1)}>
      {byline(story)}
      <a href={story.url} target="_blank" rel="noopener noreferrer">{story.title}</a>
      <p>{story.summary}</p>
      {story.why && <p className={styles.why}><Lightbulb size={13} aria-hidden="true" /><span>{story.why}</span></p>}
      {story.concept && <Concept concept={story.concept} hi={hi} />}
    </li>)}</ul>}
  </>;
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
        {ask.companies.length > 0 && <span className={styles.companies}><span>{hi ? "पूछा गया:" : "Asked at"}</span>{ask.companies.map(company => <span key={company.name} className={styles.company}><Logo logo={company} />{company.name}</span>)}</span>}
        {ask.url && <a href={ask.url} target="_blank" rel="noopener noreferrer">{ask.source}<ArrowUpRight size={12} aria-hidden="true" /></a>}
      </div>
    </div>
  </li>)}</ol>;
}

function Newsrooms({ meta, hi }: { meta: NewsSlideMeta; hi: boolean }) {
  return <div className={styles.empty}>
    <p>{hi ? "ताज़ा खबरें अभी लोड हो रही हैं। तब तक यहाँ से पढ़ें:" : "Fresh stories are being refreshed. Until then, read the latest at:"}</p>
    <ul>{meta.newsrooms.map(room => <li key={room.href}><a href={room.href} {...(room.href.startsWith("#") ? {} : { target: "_blank", rel: "noopener noreferrer" })}>{room.label}<ArrowUpRight size={13} aria-hidden="true" /></a></li>)}</ul>
  </div>;
}
