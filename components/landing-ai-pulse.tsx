"use client";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, BookOpen, Bot, Boxes, Braces, ChevronLeft, ChevronRight, Cloud, Code2, Database, FlaskConical, GitBranch, Layers, Network, Pause, Play, Puzzle, Server, Sparkles, Workflow, Zap, type LucideIcon } from "lucide-react";
import { problemPoints } from "@/lib/problem-points";
import type { LockedTeaser, PulseCard } from "@/lib/landing-daily-types";
import { DashboardMore } from "./dashboard-more";
import { LockedCard } from "./landing-locked-card";
import { useLanguage } from "./language-provider";
import { usePagedCarousel } from "./use-paged-carousel";
import home from "./landing-home.module.css";
import styles from "./landing-ai-pulse.module.css";

/** How long a screen of three cards stays before the carousel turns the page. */
export const AUTOPLAY_MS = 2 * 60 * 1000;
/** An icon per technology tag, for the tag chip and for a card whose picture is not painted yet. */
const TAG_ICON: Record<string, LucideIcon> = {
  "Agentic AI": Bot, LangChain: Network, LangGraph: GitBranch, LangSmith: FlaskConical, LangFlow: Workflow, "Next.js 16+": Code2, "React 19+": Code2,
  AWS: Cloud, "Automation · n8n": Workflow, Python: Code2, Playwright: FlaskConical, Cypress: FlaskConical, "GitHub Actions": GitBranch,
  "System Design": Boxes, Redis: Database, Inngest: Zap, "Agentic AI terms": BookOpen, Git: GitBranch, JavaScript: Braces, "JavaScript puzzles": Puzzle,
  TypeScript: Braces, NestJS: Server, Jest: FlaskConical, "React Testing Library": FlaskConical, TanStack: Layers, Zustand: Layers, Redux: Layers,
  "Redux Toolkit": Layers, Vitest: FlaskConical, GraphQL: Network, "Node.js": Server, Express: Server, "Key TanStack libraries": Layers,
};
export const dayLabel = (day: string, hi: boolean) => new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

/**
 * Today's learning pulse: twelve cards, three a screen, chosen afresh each day on the server
 * (lib/server/landing-daily.ts), each in its own light tone. Every card has the same blocks, cards in a row
 * are the same height, and the industry panels hug their text.
 */
/** Cards a landing-page preview shows; the rest of each learning section lives on /dashboard. */
export const PREVIEW_COUNT = 3;

/**
 * `preview` (the landing page) shows the first three cards and a link to the full set on /dashboard, where the
 * same section renders every card of the day, the locked bonus card included.
 */
export function LandingAiPulse({ cards: all, day, locked: lockedCard, preview = false }: { cards: PulseCard[]; day: string; locked?: LockedTeaser | null; preview?: boolean }) {
  const { language } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const cards = preview ? all.slice(0, PREVIEW_COUNT) : all;
  const locked = preview ? null : lockedCard;
  const { track, page, pages, playing, setPlaying, running, goTo, holdProps } = usePagedCarousel<HTMLUListElement>(cards.length + (locked ? 1 : 0), preview ? 3 : 2, AUTOPLAY_MS);

  return <section id="ai-pulse" className={styles.pulse} aria-labelledby="ai-pulse-title"><div className={home.inner}>
    {preview && <DashboardMore href="/dashboard#ai-pulse" title={text(`See all ${all.length + (lockedCard ? 1 : 0)} cards`, `सभी ${all.length + (lockedCard ? 1 : 0)} कार्ड देखें`)} detail={text("Every technology, every day: the full pulse lives in your dashboard.", "हर तकनीक, हर दिन: पूरा पल्स आपके डैशबोर्ड में है।")} />}
    <div className={styles.head}>
      <div className={styles.headCopy}>
        <p className={styles.kicker}><Sparkles size={14} aria-hidden="true" />{text("AI & agentic pulse", "AI और एजेंटिक हलचल")}<span className={styles.today}>{text("New today", "आज नया")} · {dayLabel(day, hi)}</span></p>
        <h2 id="ai-pulse-title">{text("Today's learning across ", "आज की पढ़ाई: ")}<em>{text("AI, agents & the modern stack", "AI, एजेंट और आधुनिक स्टैक")}</em></h2>
        <p className={styles.lede}>{text("A fresh set every day across 33 technologies: agentic AI and its terms, LangChain, LangGraph, LangSmith, LangFlow, Next.js, React, JavaScript, TypeScript, Node.js, Express, NestJS, GraphQL, the TanStack libraries, Redux, Zustand, testing with Jest, Vitest, RTL, Playwright and Cypress, AWS, Git, GitHub Actions, system design, Redis and more, each card linked to its official source.", "हर दिन एक नया सेट: एजेंटिक AI, LangChain, LangGraph, LangSmith, LangFlow, Next.js, React, AWS, n8n, Python, Playwright, Cypress, GitHub Actions, सिस्टम डिज़ाइन, Redis और Inngest, हर कार्ड अपने आधिकारिक स्रोत से जुड़ा।")}</p>
      </div>
      <Controls text={text} playing={playing} onPlay={() => setPlaying(p => !p)} page={page} pages={pages} goTo={goTo} previous={text("Previous cards", "पिछले कार्ड")} next={text("Next cards", "अगले कार्ड")} />
    </div>
    <ul ref={track} className={preview ? styles.track : `${styles.track} ${styles.twoUp}`} aria-roledescription="carousel" aria-label={text("Today's learning cards", "आज के अध्ययन कार्ड")} {...holdProps}>
      {cards.map((card, i) => <PulseCardItem key={card.id} card={card} index={i} total={cards.length + (locked ? 1 : 0)} hi={hi} text={text} />)}
      {locked && <LockedCard teaser={locked} index={cards.length} total={cards.length + 1} text={text} render={full => <PulseCardItem card={full as PulseCard} index={cards.length} total={cards.length + 1} hi={hi} text={text} />} />}
    </ul>
    <Dots pages={pages} page={page} running={running} goTo={goTo} label={n => text(`Show cards page ${n}`, `कार्ड पृष्ठ ${n} दिखाएँ`)} />
  </div></section>;
}

/** One topic card: picture, definition, key points (or the two sides of a comparison), use cases, industry problems and its source. */
export function PulseCardItem({ card, index, total, hi, text }: { card: PulseCard; index: number; total: number; hi: boolean; text: (en: string, hindi: string) => string }) {
  const Icon = TAG_ICON[card.tag] ?? Sparkles;
  return <li className={styles.card} data-tone={card.tone} data-compare={!!card.compare} aria-roledescription="slide" aria-label={`${index + 1} / ${total}: ${card.title}`}>
        <PulsePicture src={card.image} alt={`Illustration of how ${card.title} works`} icon={<Icon size={44} strokeWidth={1.4} aria-hidden="true" />}>
          <span className={styles.kind}><Icon size={12} aria-hidden="true" />{card.tag}</span>
          <span className={styles.index} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        </PulsePicture>
        <div className={styles.body}>
          <p className={styles.category}>{card.category}</p>
          <h3>{card.compare ? <>{card.compare[0].heading} <span className={styles.vs}>vs.</span> {card.compare[1].heading}</> : card.title}</h3>
          <div className={styles.block}><span className={styles.label}>{text("Definition", "परिभाषा")}</span><p className={styles.definition}>{hi && card.hiDefinition ? card.hiDefinition : card.definition}</p></div>
          {card.compare
            ? <div className={styles.block}><span className={styles.label}>{text("Each one, explained", "हर एक, अलग से")}</span>
              <div className={styles.compare}>{card.compare.map((side, n) => <section key={side.heading} className={styles.side} aria-label={side.heading}>
                <header><span className={styles.sideMark} aria-hidden="true">{n ? "B" : "A"}</span><div><h4>{side.heading}</h4><p className={styles.sideTitle}>{side.title}</p></div></header>
                <p className={styles.sideSummary}>{side.summary}</p>
                <p className={styles.useWhen}><b>{text("Use when", "कब चुनें")}</b> {side.useWhen}</p>
              </section>)}</div></div>
            : <>
              <div className={styles.block}><span className={styles.label}>{text("Core features & key points", "मुख्य विशेषताएँ और बिंदु")}</span><ul className={styles.points}>{card.points.slice(0, 3).map(point => <li key={point}>{point}</li>)}</ul></div>
              <div className={styles.block}><span className={styles.label}>{text("Real use cases", "वास्तविक उपयोग")}</span><ul className={styles.uses}>{card.useCases.slice(0, 2).map(use => <li key={use}>{use}</li>)}</ul></div>
            </>}
          <div className={styles.block}><span className={styles.label}>{text("Real problems it solves, by industry", "उद्योग के अनुसार हल की गई समस्याएँ")}</span>
            <dl className={styles.industries}>{card.industries.slice(0, 2).map(entry => <div key={entry.industry}><dt>{entry.industry}</dt><dd><ul>{problemPoints(entry.problem).map(point => <li key={point}>{point}</li>)}</ul></dd></div>)}</dl></div>
          <a className={styles.source} href={card.source.href} target="_blank" rel="noopener noreferrer"><span>{text("Learn from", "यहाँ सीखें:")} {card.source.label}</span><ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </li>;
}

/** Play/pause, previous, the page counter and next; shared with the Word power carousel. */
export function Controls({ text, playing, onPlay, page, pages, goTo, previous, next }: { text: (en: string, hindi: string) => string; playing: boolean; onPlay: () => void; page: number; pages: number; goTo: (page: number) => void; previous: string; next: string }) {
  return <div className={styles.controls}>
    <button type="button" onClick={onPlay} aria-label={playing ? text("Pause autoplay", "ऑटोप्ले रोकें") : text("Start autoplay", "ऑटोप्ले चलाएँ")}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
    <button type="button" onClick={() => goTo(page - 1)} aria-label={previous}><ChevronLeft size={18} /></button>
    <span className={styles.count} aria-live="polite">{String(page + 1).padStart(2, "0")}<i>/</i>{String(pages).padStart(2, "0")}</span>
    <button type="button" onClick={() => goTo(page + 1)} aria-label={next}><ChevronRight size={18} /></button>
  </div>;
}

/** One dot per screen; the current one fills over the autoplay wait. */
export function Dots({ pages, page, running, goTo, label }: { pages: number; page: number; running: boolean; goTo: (page: number) => void; label: (n: number) => string }) {
  return <div className={styles.dots}>{Array.from({ length: pages }, (_, i) => <button key={i} type="button" aria-label={label(i + 1)} aria-current={i === page} onClick={() => goTo(i)}>{i === page && running && <span key={page} className={styles.timer} style={{ animationDuration: `${AUTOPLAY_MS}ms` }} />}</button>)}</div>;
}

/** The card's picture, with the tag and number laid over it; a missing one becomes a patterned panel with the tag's icon. */
function PulsePicture({ src, alt, icon, children }: { src: string | null; alt: string; icon: ReactNode; children: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const empty = !src || failed;
  return <div className={styles.picture} data-empty={empty}>
    {empty ? <span className={styles.placeholder}>{icon}</span> : /* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP from the storage bucket, as on the Search cards. */
      <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
    {children}
  </div>;
}
