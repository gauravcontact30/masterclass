"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "@/components/responsive-image";
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { ShowcaseSlide } from "@/lib/landing-showcase/types";
import { useVisiblePlayback } from "./use-visible-playback";
import styles from "./landing-showcase.module.css";

/** Time each showcase slide stays on screen. */
export const SHOWCASE_MS = 5000;

/**
 * State for one showcase section: the slide on show (shared by the carousel and the panel beside it) and autoplay
 * every five seconds (user request 2026-11-24: it must keep playing). It waits only while the section is off screen,
 * while the pointer or keyboard focus is in the panel (someone is reading), or after the visitor opens an answer or
 * presses pause; the play button resumes it. Pictures load for the slide on show and the next one only.
 */
export function useShowcase(count: number) {
  const ref = useRef<HTMLElement>(null);
  const visible = useVisiblePlayback(ref);
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState(() => new Set([0, 1 % Math.max(count, 1)]));
  const [playing, setPlaying] = useState(true);
  const [reading, setReading] = useState(false);
  const running = playing && !reading && visible && count > 1;
  const go = useCallback((next: number) => {
    const target = ((next % count) + count) % count;
    setSeen(previous => previous.has(target) && previous.has((target + 1) % count) ? previous : new Set([...previous, target, (target + 1) % count]));
    setIndex(target);
  }, [count]);
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => go(index + 1), SHOWCASE_MS);
    return () => clearTimeout(timer);
  }, [running, index, go]);
  const pause = useCallback(() => setPlaying(false), []);
  const panelProps = {
    onMouseEnter: () => setReading(true), onMouseLeave: () => setReading(false),
    onFocus: (event: React.FocusEvent) => { if (event.target.matches(":focus-visible")) setReading(true); },
    onBlur: (event: React.FocusEvent<HTMLElement>) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setReading(false); },
  };
  return { ref, index, seen, go, pause, playing, setPlaying, running, panelProps };
}

type CarouselState = { index: number; seen: Set<number>; go: (index: number) => void; playing: boolean; setPlaying: (update: (playing: boolean) => boolean) => void; running: boolean };

/** The picture side: slides cross-fade with a slow zoom; segments show progress and pick a slide; arrows and play/pause below. */
export function ShowcaseCarousel({ slides, label, index, seen, go, playing, setPlaying, running }: Readonly<CarouselState & { slides: ShowcaseSlide[]; label: string }>) {
  // A painted picture that is missing or fails falls back to the slide's local picture.
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  return <div className={styles.stage} aria-roledescription="carousel" aria-label={label}>
    <div className={styles.frames} aria-live={running ? "off" : "polite"}>
      {slides.map((slide, i) => {
        const src = failed.has(slide.id) && slide.fallback ? slide.fallback : slide.image;
        return <figure key={slide.id} className={styles.frame} data-active={i === index || undefined} aria-roledescription="slide" aria-label={`${i + 1} / ${slides.length}: ${slide.kicker}`} aria-hidden={i !== index} inert={i !== index}>
          {seen.has(i) && <Image key={src} src={src} alt={slide.alt} fill sizes="(max-width: 960px) 100vw, 46vw" className={styles.frameImage} style={{ objectPosition: slide.focus ?? "50% 50%" }} loading="lazy"
            onError={() => setFailed(previous => previous.has(slide.id) ? previous : new Set([...previous, slide.id]))} />}
          <figcaption className={styles.caption}>
            <p className={styles.captionKicker}>{slide.logo && <Image src={slide.logo} alt="" width={22} height={22} unoptimized />}{slide.kicker}</p>
            <h3 className={styles.captionTitle}>{slide.title}</h3>
            <p className={styles.captionText}>{slide.text}</p>
            <ul className={styles.captionFacts}>{slide.facts.map(fact => <li key={fact}>{fact}</li>)}</ul>
          </figcaption>
        </figure>;
      })}
    </div>
    <div className={styles.chrome}>
      <div className={styles.segments}>{slides.map((slide, i) => <button key={slide.id} type="button" aria-label={`Show ${slide.kicker}`} aria-current={i === index || undefined} onClick={() => go(i)}>
        <span key={i === index ? `on-${index}` : "off"} data-running={(i === index && running) || undefined} style={{ animationDuration: `${SHOWCASE_MS}ms` }} />
      </button>)}</div>
      <div className={styles.buttons}>
        <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => setPlaying(p => !p)} aria-label={playing ? "Pause autoplay" : "Start autoplay"}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
        <button type="button" onClick={() => go(index + 1)} aria-label="Next slide"><ChevronRight size={18} /></button>
        <span className={styles.status}>{playing ? (running ? "Auto · 5 s" : "Paused while you read") : "Paused"}</span>
        <span className={styles.count}>{String(index + 1).padStart(2, "0")}<i>/</i>{String(slides.length).padStart(2, "0")}</span>
      </div>
    </div>
  </div>;
}

/** Star rating, read out as "n out of 5 stars". */
export const StarRating = ({ count }: { count: number }) => <span className={styles.stars} role="img" aria-label={`${count} out of 5 stars`}>{[1, 2, 3, 4, 5].map(n => <i key={n} aria-hidden="true" data-on={n <= count || undefined}>★</i>)}</span>;

/**
 * The paginated row of choices that drives a section (technology, board, exam): `perPage` pills a page, the page that
 * holds the current choice shown by default. ‹ › step to the previous or next choice (moving the carousel with it), the
 * counter says which one of how many, and the dots turn pages without changing the choice.
 */
export function ShowcasePicker({ items, index, onPick, label, perPage = 3 }: Readonly<{ items: { id: string; label: string; logo?: string; sub?: string }[]; index: number; onPick: (index: number) => void; label: string; perPage?: number }>) {
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const own = Math.floor(index / perPage);
  // A page turned with the dots holds until the choice changes, then the pager follows the choice again.
  const [browse, setBrowse] = useState<{ index: number; page: number } | null>(null);
  const page = browse && browse.index === index ? browse.page : own;
  const shown = items.slice(page * perPage, page * perPage + perPage);
  return <div className={styles.pager} role="group" aria-label={label}>
    <div className={styles.pagerRow}>
      <button type="button" className={styles.pagerStep} onClick={() => onPick((index - 1 + items.length) % items.length)} aria-label={`Previous ${label.toLowerCase()}`}><ChevronLeft size={17} /></button>
      <div className={styles.pills} style={{ "--per": perPage } as React.CSSProperties}>
        {shown.map((item, k) => { const i = page * perPage + k; return <button key={item.id} type="button" className={styles.pill} aria-pressed={i === index} onClick={() => onPick(i)}>
          {item.logo ? <Image src={item.logo} alt="" width={22} height={22} unoptimized /> : <span className={styles.pillNumber} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>}
          <span className={styles.pillText}><b>{item.label}</b>{item.sub && <small>{item.sub}</small>}</span>
        </button>; })}
      </div>
      <button type="button" className={styles.pagerStep} onClick={() => onPick((index + 1) % items.length)} aria-label={`Next ${label.toLowerCase()}`}><ChevronRight size={17} /></button>
    </div>
    <div className={styles.pagerFoot}>
      <span className={styles.pagerCount}>{label} <b>{String(index + 1).padStart(2, "0")}</b> of {String(items.length).padStart(2, "0")}</span>
      {pages > 1 && <span className={styles.pagerDots}>{Array.from({ length: pages }, (_, p) => <button key={p} type="button" aria-label={`${label} page ${p + 1} of ${pages}`} aria-current={p === page || undefined} onClick={() => setBrowse({ index, page: p })} />)}</span>}
    </div>
  </div>;
}

export type AccordionItem = { id: string; q: string; meta?: ReactNode; points: string[]; label?: string };

/**
 * Questions with model answers, one open at a time: a numbered header with the rating and level, a rotating chevron,
 * and an answer that slides open as numbered key points. Opening an answer pauses the carousel (`onOpen`), so the
 * question being read does not change under the reader.
 */
export function ShowcaseAccordion({ items, onOpen, answerLabel = "Model answer" }: Readonly<{ items: AccordionItem[]; onOpen?: () => void; answerLabel?: string }>) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return <ol className={styles.accordion}>
    {items.map((item, i) => { const expanded = open === item.id; const panel = `acc-${item.id}`; return <li key={item.id} className={styles.accItem} data-open={expanded || undefined}>
      <h4 className={styles.accHeading}>
        <button type="button" className={styles.accButton} aria-expanded={expanded} aria-controls={panel} onClick={() => { setOpen(expanded ? null : item.id); if (!expanded) onOpen?.(); }}>
          <span className={styles.accNumber} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
          <span className={styles.accTitle}>{item.meta && <span className={styles.accMeta}>{item.meta}</span>}<span className={styles.accQuestion}>{item.q}</span></span>
          <ChevronDown size={18} className={styles.accChevron} aria-hidden="true" />
        </button>
      </h4>
      <div id={panel} className={styles.accPanel} role="region" aria-label={`${answerLabel}: ${item.q}`} hidden={!expanded}>
        <div className={styles.accBody}>
          <p className={styles.accLabel}><CheckCircle2 size={14} aria-hidden="true" />{item.label ?? answerLabel}</p>
          <ol className={styles.accPoints}>{item.points.map(point => <li key={point}>{point}</li>)}</ol>
        </div>
      </div>
    </li>; })}
  </ol>;
}
