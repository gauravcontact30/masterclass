"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, Crown, Flame, Heart, Sparkles, Star, Sunrise, ThumbsDown, ThumbsUp, Workflow, Zap } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { pageWindow } from "./pager";
import { DAILY_TRACKS, OTHER_GROUP, TECH_BUZZ_TRACKED, TECH_GROUPS, dailyTrackTechIds, techGroupOf, type DailyTrack, type TechGroup } from "@/lib/tech-buzz-sections";
import { logoOf, techLogo, type TechBuzzCard } from "@/lib/tech-buzz-public";
import { TechIcon } from "./tech-icon";
import { FAVOURITE_TOPICS } from "@/lib/tech-buzz-favourites";
import styles from "./tech-buzz-showcase.module.css";
import { ReviewStars } from "./tech-buzz-review-stars";
import Image from "@/components/responsive-image";
import { isUnsplash, unoptimizedRemote, unsplashLoader } from "@/lib/image-loaders";
import { ClapButton, useClaps } from "./clap-button";

/*
 * The curated half of /tech-buzz, above the searchable feed: the weekly Monday 00:00 (IST) edition, Fresh & Latest (earlier
 * editions, by technology), Star
 * Rated, n8n Workflow Blogs and Most Liked, then one section per technology group (lib/tech-buzz-sections.ts) with
 * every story landed in its group. Each block has its own look. Likes, dislikes and claps are shared by every copy of
 * a story on the page and posted to /api/tech-buzz/action; this browser's own votes are remembered locally.
 */

type Counts = { likes: number; dislikes: number; claps: number };
type Vote = "like" | "dislike";

const DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const formatDate = (iso: string) => { const t = Date.parse(iso); return Number.isFinite(t) ? DATE.format(t) : ""; };
const compact = (n: number) => n >= 10_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

/* ── This browser's likes and dislikes (localStorage; claps are per reader in Supabase), read through useSyncExternalStore so SSR and hydration agree ── */
// v2: counters were reset on 2026-10-27, so votes saved before then no longer match a count and are forgotten.
const VOTES_KEY = "mcb:tech-buzz-votes:v2";
type Mine = Record<string, { vote?: Vote }>;
const listeners = new Set<() => void>();
let cache: string | null = null;
const readMine = () => { try { return cache ??= localStorage.getItem(VOTES_KEY) ?? "{}"; } catch { return "{}"; } };
const writeMine = (next: Mine) => { cache = JSON.stringify(next); try { localStorage.setItem(VOTES_KEY, cache); } catch { /* private mode */ } listeners.forEach(fn => fn()); };
const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
const parseMine = (raw: string): Mine => { try { return JSON.parse(raw) as Mine; } catch { return {}; } };

type ReactionApi = { counts: (card: TechBuzzCard) => Counts; mine: Mine; vote: (card: TechBuzzCard, vote: Vote) => void };
const Reactions = createContext<ReactionApi | null>(null);

function ReactionProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readMine, () => "{}");
  const mine = useMemo(() => parseMine(raw), [raw]);
  const [overrides, setOverrides] = useState<Record<string, Counts>>({});
  const counts = useCallback((card: TechBuzzCard) => overrides[card.id] ?? { likes: card.likes, dislikes: card.dislikes, claps: card.claps }, [overrides]);

  const send = useCallback(async (card: TechBuzzCard, body: Record<string, unknown>, optimistic: Counts) => {
    setOverrides(current => ({ ...current, [card.id]: optimistic }));
    try {
      const response = await fetch("/api/tech-buzz/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId: card.id, ...body }) });
      const data = await response.json().catch(() => null) as Partial<Counts> | null;
      if (response.ok && data) setOverrides(current => ({ ...current, [card.id]: { likes: data.likes ?? optimistic.likes, dislikes: data.dislikes ?? optimistic.dislikes, claps: data.claps ?? optimistic.claps } }));
    } catch { /* offline: keep the optimistic count */ }
  }, []);

  const vote = useCallback((card: TechBuzzCard, next: Vote) => {
    const all = parseMine(readMine());
    const previous = all[card.id]?.vote;
    const now = counts(card);
    const optimistic = { ...now };
    // Pressing the same vote again takes it back; switching moves it.
    if (previous === next) {
      optimistic[next === "like" ? "likes" : "dislikes"] = Math.max(0, optimistic[next === "like" ? "likes" : "dislikes"] - 1);
      writeMine({ ...all, [card.id]: { ...all[card.id], vote: undefined } });
      void send(card, { action: next, delta: -1 }, optimistic);
      return;
    }
    if (previous) {
      optimistic[previous === "like" ? "likes" : "dislikes"] = Math.max(0, optimistic[previous === "like" ? "likes" : "dislikes"] - 1);
      void send(card, { action: previous, delta: -1 }, { ...optimistic });
    }
    optimistic[next === "like" ? "likes" : "dislikes"] += 1;
    writeMine({ ...all, [card.id]: { ...all[card.id], vote: next } });
    void send(card, { action: next, delta: 1 }, optimistic);
  }, [counts, send]);

  const api = useMemo(() => ({ counts, mine, vote }), [counts, mine, vote]);
  return <Reactions.Provider value={api}>{children}</Reactions.Provider>;
}

function ReactionBar({ card, tone = "light" }: { card: TechBuzzCard; tone?: "light" | "dark" }) {
  const api = useContext(Reactions)!;
  const counts = api.counts(card);
  const mine = api.mine[card.id];
  return <div className={styles.reactions} data-tone={tone} role="group" aria-label={`Reactions to ${card.title}`}>
    <button type="button" aria-pressed={mine?.vote === "like"} onClick={() => api.vote(card, "like")} aria-label={`Like, ${counts.likes} likes`}><ThumbsUp size={14} aria-hidden="true" /><span>{compact(counts.likes)}</span></button>
    <button type="button" aria-pressed={mine?.vote === "dislike"} onClick={() => api.vote(card, "dislike")} aria-label={`Dislike, ${counts.dislikes} dislikes`}><ThumbsDown size={14} aria-hidden="true" /><span>{compact(counts.dislikes)}</span></button>
    <CardClap card={card} tone={tone} />
  </div>;
}

/** Medium-style claps, stored per signed-in reader (components/clap-button.tsx). Cards skip the live fetch; the
 *  reader's own count arrives with their first clap. */
function CardClap({ card, tone }: { card: TechBuzzCard; tone: "light" | "dark" }) {
  const claps = useClaps(card.slug, card.claps, { live: false });
  return <ClapButton slug={card.slug} claps={claps} size="small" tone={tone} label={`Clap for ${card.title}`} />;
}

/** A story cover through next/image, so each card downloads a picture sized for it (`sizes`), not the stored original. */
function Cover({ card, className, sizes, eager = false }: { card: TechBuzzCard; className?: string; sizes: string; eager?: boolean }) {
  const logo = logoOf(card);
  return <span className={`${styles.cover} ${className ?? ""}`} style={{ "--tone": card.color } as CSSProperties}>
    {card.coverImage ? <Image src={card.coverImage} alt="" fill sizes={sizes} quality={75} loading={eager ? "eager" : undefined} fetchPriority={eager ? "high" : undefined} loader={isUnsplash(card.coverImage) ? unsplashLoader : undefined} unoptimized={unoptimizedRemote(card.coverImage)} /> : null}
    {logo && <span className={styles.coverLogo}><Image src={logo} alt="" width={20} height={20} /></span>}
  </span>;
}

function RatingBadge({ card }: { card: TechBuzzCard }) {
  if (card.review) return <ReviewStars review={card.review} />;
  if (!card.rating.count) return <span className={styles.newBadge}>New</span>;
  return <span className={styles.rating} aria-label={`Rated ${card.rating.average.toFixed(1)} out of 5`}><Star size={12} fill="currentColor" aria-hidden="true" />{card.rating.average.toFixed(1)}</span>;
}

/* ── 1. This week's 5: only the newest edition (this week's, once the Monday 00:00 IST run has written it; daily
   editions until 2026-10-31). Earlier editions move down to Fresh & Latest. Until any edition exists, each track shows
   its newest story as a stand-in. ─────── */
/** The newest edition on the page (YYYY-MM-DD; a weekly edition is dated by its Monday), or undefined before the first one. */
const latestEdition = (cards: TechBuzzCard[]) => cards.map(card => card.daily?.date).filter((date): date is string => !!date).sort().at(-1);
const newestFirst = (a: TechBuzzCard, b: TechBuzzCard) => b.publishedAt.localeCompare(a.publishedAt);

function TrackLogos({ track }: { track: string }) {
  const logos = dailyTrackTechIds(track).map(id => techLogo(id)).filter((src): src is string => !!src);
  return logos.length ? <span className={styles.trackLogos} aria-hidden="true">{logos.map(src => <Image key={src} src={src} alt="" width={16} height={16} />)}</span> : null;
}

function DailyEdition({ cards }: { cards: TechBuzzCard[] }) {
  const edition = latestEdition(cards);
  // A track whose story is missing from the newest edition (it timed out or stayed below the editor's bar) keeps its
  // slot with its own latest earlier daily story, then its newest story of any kind, so all five tracks always show.
  const picks = DAILY_TRACKS.map(track => {
    const stand = (edition && cards.filter(card => card.daily?.date === edition && card.daily.track === track.id).sort(newestFirst)[0])
      || cards.filter(card => card.daily?.track === track.id).sort(newestFirst)[0]
      || cards.filter(card => card.techId && track.techIds.includes(card.techId)).sort(newestFirst)[0];
    return stand ? { track, card: stand } : null;
  }).filter((pick): pick is NonNullable<typeof pick> => !!pick);
  if (!picks.length) return null;
  const [lead, ...rest] = picks;
  return <section data-track-topic={TECH_BUZZ_TRACKED.daily} className={styles.daily} aria-labelledby="tb-daily">
    <div className={styles.dailyGlow} aria-hidden="true" />
    <header className={styles.dailyHead}>
      <p className={styles.dailyKicker}><Sunrise size={15} aria-hidden="true" />Fresh every week · Monday 00:00 AM IST</p>
      <h2 id="tb-daily">This week&rsquo;s <em>5</em></h2>
      <p>Five new blogs every week on Agentic AI with LangChain, LangGraph, LangSmith, LangFlow and n8n, System Design, AWS &amp; DevOps, Kubernetes &amp; Docker, and Next.js &amp; React.</p>
      {edition && <span className={styles.edition}><CalendarDays size={13} aria-hidden="true" />Week of {formatDate(`${edition}T00:00:00+05:30`)}</span>}
    </header>
    <div className={styles.dailyGrid}>
      <article className={styles.dailyLead} style={{ "--tone": lead.track.color } as CSSProperties}>
        <Link href={`/tech-buzz/${lead.card.slug}`} className={styles.dailyLeadLink}>
          <Cover card={lead.card} className={styles.dailyLeadCover} sizes="(max-width: 900px) 92vw, (max-width: 1600px) 680px, 840px" eager />
          <span className={styles.trackChip}>01 · {lead.track.short}<TrackLogos track={lead.track.id} /></span>
          <h3>{lead.card.title}</h3>
          <p>{lead.card.subtitle}</p>
        </Link>
        <footer><span className={styles.meta}><CalendarDays size={12} aria-hidden="true" />{formatDate(lead.card.publishedAt)}<Clock size={12} aria-hidden="true" />{lead.card.readTimeMinutes} min</span><ReactionBar card={lead.card} tone="dark" /></footer>
      </article>
      {rest.map(({ track, card }, i) => <article key={track.id} className={styles.dailyCard} style={{ "--tone": track.color } as CSSProperties}>
        <Link href={`/tech-buzz/${card.slug}`} className={styles.dailyCardLink}>
          <Cover card={card} className={styles.dailyCardCover} sizes="96px" />
          <span className={styles.dailyCardBody}>
            <span className={styles.trackChip}>{String(i + 2).padStart(2, "0")} · {track.short}<TrackLogos track={track.id} /></span>
            <strong>{card.title}</strong>
            <span className={styles.meta}><CalendarDays size={12} aria-hidden="true" />{formatDate(card.publishedAt)}<Clock size={12} aria-hidden="true" />{card.readTimeMinutes} min</span>
          </span>
        </Link>
        <ReactionBar card={card} tone="dark" />
      </article>)}
    </div>
  </section>;
}

/* ── Pagination shared by every section: first, previous, numbered pages, next, last, a page-size choice and a
   "Showing x–y of z" line. Changing page brings the section's top back into view and moves focus onto its heading. ── */
function usePaged<T>(items: T[], initialSize: number) {
  const [size, setSize] = useState(initialSize);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages - 1);
  return { page: current, pages, size, rows: items.slice(current * size, current * size + size), offset: current * size, total: items.length, setPage, setSize: (next: number) => { setSize(next); setPage(0); } };
}
type Paged = { page: number; pages: number; size: number; offset: number; total: number; setPage: (page: number) => void; setSize: (size: number) => void };

function Pagination({ paged, label, anchor, sizes, tone = "light" }: { paged: Paged; label: string; anchor: string; sizes?: number[]; tone?: "light" | "dark" }) {
  if (paged.total <= Math.min(paged.size, ...(sizes ?? [paged.size]))) return null;
  const go = (next: number) => {
    paged.setPage(Math.max(0, Math.min(paged.pages - 1, next)));
    const heading = document.getElementById(anchor);
    if (heading && heading.getBoundingClientRect().top < 0) heading.scrollIntoView({ behavior: "smooth", block: "start" });
    heading?.focus({ preventScroll: true });
  };
  const from = paged.offset + 1, to = Math.min(paged.total, paged.offset + paged.size);
  return <nav className={styles.pagination} data-tone={tone} aria-label={`${label} pages`}>
    <p className={styles.pageInfo} aria-live="polite">Showing <b>{from}–{to}</b> of <b>{paged.total}</b></p>
    <div className={styles.pageButtons}>
      <button type="button" onClick={() => go(0)} disabled={paged.page === 0} aria-label="First page"><ChevronsLeft size={15} aria-hidden="true" /></button>
      <button type="button" onClick={() => go(paged.page - 1)} disabled={paged.page === 0} aria-label="Previous page"><ChevronLeft size={15} aria-hidden="true" /><span className={styles.pageWord}>Prev</span></button>
      {pageWindow(paged.page, paged.pages).map((index, position) => index === "gap"
        ? <span key={`gap-${position}`} className={styles.pageGap} aria-hidden="true">…</span>
        : <button key={index} type="button" onClick={() => go(index)} aria-label={`Page ${index + 1}`} aria-current={index === paged.page ? "page" : undefined}>{index + 1}</button>)}
      <button type="button" onClick={() => go(paged.page + 1)} disabled={paged.page === paged.pages - 1} aria-label="Next page"><span className={styles.pageWord}>Next</span><ChevronRight size={15} aria-hidden="true" /></button>
      <button type="button" onClick={() => go(paged.pages - 1)} disabled={paged.page === paged.pages - 1} aria-label="Last page"><ChevronsRight size={15} aria-hidden="true" /></button>
    </div>
    {sizes && <label className={styles.pageSize}>Per page
      <select value={paged.size} onChange={event => paged.setSize(Number(event.target.value))}>{sizes.map(size => <option key={size} value={size}>{size}</option>)}</select>
    </label>}
  </nav>;
}

/* ── 2. Fresh & Latest: every earlier edition, kept for later reading, one block per daily track so each
   technology holds only its own stories (newest first, paginated per block). ────────────────────────────────── */
const FRESH_TABS_PER_PAGE = 6;
function FreshLatest({ cards }: { cards: TechBuzzCard[] }) {
  const [selectedTrack, setSelectedTrack] = useState<string | null>("all");
  const tracks = useMemo(() => {
    const edition = latestEdition(cards);
    const past = edition ? cards.filter(card => card.daily && card.daily.date < edition).sort(newestFirst) : [];
    if (!past.length) return [];
    return [{ track: { ...DAILY_TRACKS[0], id: "all", short: "All", color: "#b5573a" }, items: past }, ...DAILY_TRACKS.map(track => ({ track, items: past.filter(card => card.daily?.track === track.id) })).filter(entry => entry.items.length)];
  }, [cards]);
  const active = tracks.find(({ track }) => track.id === selectedTrack) ?? tracks[0];
  const tabPage = Math.floor(Math.max(0, tracks.indexOf(active)) / FRESH_TABS_PER_PAGE);
  const tabPages = Math.ceil(tracks.length / FRESH_TABS_PER_PAGE);
  const shownTracks = tracks.slice(tabPage * FRESH_TABS_PER_PAGE, (tabPage + 1) * FRESH_TABS_PER_PAGE);
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? tracks.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const { track } = tracks[(next + tracks.length) % tracks.length];
    setSelectedTrack(track.id);
    requestAnimationFrame(() => document.getElementById(`tb-fresh-tab-${track.id}`)?.focus());
  };
  if (!tracks.length && !latestEdition(cards)) return null;
  return <section data-track-topic={TECH_BUZZ_TRACKED.fresh} className={styles.fresh} aria-labelledby="tb-fresh">
    <SectionHead id="tb-fresh" icon={<Zap size={16} aria-hidden="true" />} kicker="From earlier editions" title="Fresh & Latest" lede="Every edition's blogs move here when the next week's edition is published, and stay for later reading, sorted by technology." />
    {!tracks.length && <p className={styles.freshEmpty}><Sunrise size={15} aria-hidden="true" />This week&rsquo;s 5 blogs move here next Monday at 00:00 AM IST, when the next edition is published.</p>}
    {tracks.length > 0 && <>
      {tabPages > 1 && <nav className={styles.freshTabPager} aria-label="Earlier edition technology pages">
        <span className={styles.pageInfo} aria-live="polite">Technologies {tabPage * FRESH_TABS_PER_PAGE + 1}–{Math.min((tabPage + 1) * FRESH_TABS_PER_PAGE, tracks.length)} of {tracks.length}</span>
        <div className={styles.pageButtons}>
          <button type="button" disabled={tabPage === 0} onClick={() => setSelectedTrack(tracks[(tabPage - 1) * FRESH_TABS_PER_PAGE].track.id)} aria-label="Previous technology tabs"><ChevronLeft size={15} aria-hidden="true" />Previous</button>
          <span className={styles.pageInfo}>{tabPage + 1} / {tabPages}</span>
          <button type="button" disabled={tabPage === tabPages - 1} onClick={() => setSelectedTrack(tracks[(tabPage + 1) * FRESH_TABS_PER_PAGE].track.id)} aria-label="Next technology tabs">Next<ChevronRight size={15} aria-hidden="true" /></button>
        </div>
      </nav>}
      <div className={styles.freshTabs} role="tablist" aria-label="Fresh & Latest technologies">
        {shownTracks.map(({ track, items }, index) => <button key={track.id} id={`tb-fresh-tab-${track.id}`} type="button" role="tab"
          aria-selected={track.id === active.track.id} aria-controls={`tb-fresh-panel-${track.id}`} tabIndex={track.id === active.track.id ? 0 : -1}
          style={{ "--tone": track.color } as CSSProperties} onClick={() => setSelectedTrack(track.id)} onKeyDown={event => onKey(event, tabPage * FRESH_TABS_PER_PAGE + index)}>
          <TrackLogos track={track.id} />{track.id === "agentic-ai" ? "Agentic AI" : track.short}<span className={styles.freshCount}>{items.length}</span>
        </button>)}
      </div>
      {tracks.map(({ track, items }) => <div key={track.id} id={`tb-fresh-panel-${track.id}`} role="tabpanel"
        aria-labelledby={`tb-fresh-tab-${track.id}`} hidden={track.id !== active.track.id}>
        {track.id === active.track.id && <FreshTrack key={track.id} track={track} items={items} showAll={track.id === "all"} />}
      </div>)}
    </>}
  </section>;
}

function FreshTrack({ track, items, showAll = false }: { track: DailyTrack; items: TechBuzzCard[]; showAll?: boolean }) {
  const paged = usePaged(items, 4);
  const heading = `tb-fresh-${track.id}-title`;
  return <section id={`tb-fresh-${track.id}`} className={styles.freshTrack} style={{ "--tone": track.color } as CSSProperties} aria-labelledby={heading}>
    <h3 id={heading} tabIndex={-1} className={styles.freshTrackHead}><TrackLogos track={track.id} />{track.short}<span>{items.length} {items.length === 1 ? "blog" : "blogs"}</span></h3>
    <ol className={styles.timeline}>
      {(showAll ? items : paged.rows).map(card => <li key={card.id} style={{ "--tone": card.color } as CSSProperties}>
        <span className={styles.timelineHead}><span className={styles.timelineDot} aria-hidden="true" /><time dateTime={card.publishedAt}>{formatDate(card.publishedAt)}</time></span>
        <Link href={`/tech-buzz/${card.slug}`} className={styles.freshCard}>
          <Cover card={card} className={styles.freshCover} sizes="(max-width: 640px) 90vw, (max-width: 1100px) 320px, 240px" />
          <span className={styles.freshTech}><TechIcon item={card} />{card.technology}</span>
          <strong className={styles.cardTitle}>{card.title}</strong>
        </Link>
        <ReactionBar card={card} />
      </li>)}
    </ol>
    {!showAll && <Pagination paged={paged} label={`Fresh & Latest: ${track.short}`} anchor={heading} sizes={[4, 8, 12]} />}
  </section>;
}

/* ── 3. Star Rated (a gold leaderboard): each page's top story is a feature card, the rest a ranked list beside it,
   with medals for ranks 2 and 3. ───────────────────────────────────────────────────────────────────────────────── */
const bayes = (card: TechBuzzCard) => (card.rating.average * card.rating.count + 4.5 * 20) / (card.rating.count + 20);
function StarScore({ card }: { card: TechBuzzCard }) {
  const { average, count } = card.rating;
  return <span className={styles.starScore} aria-label={`Rated ${average.toFixed(2)} out of 5 by ${count} ${count === 1 ? "reader" : "readers"}`}>
    <span className={styles.starRow} style={{ "--fill": `${(average / 5) * 100}%` } as CSSProperties} aria-hidden="true">★★★★★</span>
    <b aria-hidden="true">{average.toFixed(2)}</b><small aria-hidden="true">{compact(count)} {count === 1 ? "rating" : "ratings"}</small>
  </span>;
}
function StarRated({ cards }: { cards: TechBuzzCard[] }) {
  const rated = useMemo(() => cards.filter(card => card.rating.count > 0).sort((a, b) => bayes(b) - bayes(a)), [cards]);
  const paged = usePaged(rated, 5);
  if (!rated.length) return null;
  return <section data-track-topic={TECH_BUZZ_TRACKED.stars} className={styles.stars} aria-labelledby="tb-stars">
    <SectionHead id="tb-stars" icon={<Star size={16} fill="currentColor" aria-hidden="true" />} kicker="Reader rated" title="Star Rating Blogs" lede="Ranked by readers' stars, weighted by how many rated them." />
    <ol className={styles.starBoard} start={paged.offset + 1} style={{ "--rest": Math.max(1, paged.rows.length - 1) } as CSSProperties}>
      {paged.rows.map((card, i) => {
        const rank = paged.offset + i + 1;
        if (i === 0) return <li key={card.id} data-rank={rank} className={styles.starFeature}>
          <Link href={`/tech-buzz/${card.slug}`} className={styles.starFeatureLink}>
            <span className={styles.starFeatureMedia}>
              <Cover card={card} className={styles.starFeatureCover} sizes="(max-width: 900px) 92vw, (max-width: 1600px) 620px, 820px" />
              <span className={styles.starRibbon}>{rank === 1 ? <><Crown size={15} aria-hidden="true" />Readers&rsquo; #1</> : `#${rank}`}</span>
            </span>
            <span className={styles.starFeatureBody}>
              <StarScore card={card} />
              <strong className={styles.cardTitle}>{card.title}</strong>
              <span className={styles.meta}><TechIcon item={card} />{card.technology} · {formatDate(card.publishedAt)} · {card.readTimeMinutes} min read</span>
            </span>
          </Link>
          <ReactionBar card={card} />
        </li>;
        return <li key={card.id} data-rank={rank} className={styles.starItem}>
          <span className={styles.starRank} aria-hidden="true">{rank}</span>
          <Link href={`/tech-buzz/${card.slug}`} className={styles.starCard}>
            <Cover card={card} className={styles.starCover} sizes="64px" />
            <span className={styles.starBody}>
              <StarScore card={card} />
              <strong className={styles.cardTitle}>{card.title}</strong>
              <span className={styles.meta}>{card.technology} · {formatDate(card.publishedAt)}</span>
            </span>
          </Link>
          <ReactionBar card={card} />
        </li>;
      })}
    </ol>
    <Pagination paged={paged} label="Star Rating Blogs" anchor="tb-stars" />
  </section>;
}

/* ── 4. n8n Workflow Blogs (nodes joined like an n8n canvas) ───────────────────────────────────────────────────── */
function N8nWorkflows({ cards }: { cards: TechBuzzCard[] }) {
  const flows = useMemo(() => cards.filter(card => card.techId === "n8n" || /n8n/i.test(`${card.technology} ${card.tags.join(" ")}`)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)), [cards]);
  const paged = usePaged(flows, 6);
  if (!flows.length) return null;
  return <section data-track-topic={TECH_BUZZ_TRACKED.n8n} className={styles.n8n} aria-labelledby="tb-n8n">
    <SectionHead id="tb-n8n" icon={<Workflow size={16} aria-hidden="true" />} kicker="Automation" title="n8n Workflow Blogs" lede="Triggers, AI agent nodes and production workflows, step by step." />
    <ol className={styles.canvas}>
      {paged.rows.map((card, i) => { const step = paged.offset + i; return <li key={card.id} className={styles.node}>
        <span className={styles.nodePort} data-side="in" aria-hidden="true" />
        <Link href={`/tech-buzz/${card.slug}`} className={styles.nodeLink}>
          <span className={styles.nodeHead}><span className={styles.nodeIcon} aria-hidden="true">{step === 0 ? <Zap size={14} /> : <Workflow size={14} />}</span>{step === 0 ? "Trigger" : `Step ${step + 1}`}<RatingBadge card={card} /></span>
          <strong className={styles.cardTitle}>{card.title}</strong>
          <span className={styles.meta}>{formatDate(card.publishedAt)} · {card.readTimeMinutes} min</span>
        </Link>
        <ReactionBar card={card} tone="dark" />
        <span className={styles.nodePort} data-side="out" aria-hidden="true" />
      </li>; })}
    </ol>
    <Pagination paged={paged} label="n8n Workflow Blogs" anchor="tb-n8n" tone="dark" />
  </section>;
}

/* ── 5. Community favourites: the most liked stories, by topic (lib/tech-buzz-favourites.ts). A tab per topic
   (WAI-ARIA tabs: arrow keys, Home and End); the topic's #1 is featured, the rest ranked beside it. Readers' likes
   rank each topic; stories nobody has liked yet follow, by the editor's score, then rating, then date. ──────────── */
const ALL_TOPICS = "all";
/** Topic pills shown per page; the rest are reached with the arrows beside them. */
const TABS_PER_PAGE = 5;
function CommunityFavourites({ cards }: { cards: TechBuzzCard[] }) {
  const api = useContext(Reactions)!;
  const [topic, setTopic] = useState(ALL_TOPICS);
  const [tabPage, setTabPage] = useState(0);
  const ranked = useMemo(() => cards.map(card => ({ card, likes: api.counts(card).likes })).sort((a, b) =>
    b.likes - a.likes || (b.card.editorScore ?? 0) - (a.card.editorScore ?? 0) || b.card.rating.average - a.card.rating.average || b.card.publishedAt.localeCompare(a.card.publishedAt)), [cards, api]);
  const tabs = useMemo(() => [
    { id: ALL_TOPICS, label: "All topics", color: "#be123c", logo: undefined as string | undefined, items: ranked.filter(item => item.likes > 0 || item.card.topics.length) },
    ...FAVOURITE_TOPICS.map(entry => ({ id: entry.id, label: entry.label, color: entry.color, logo: techLogo(entry.techId), items: ranked.filter(item => item.card.topics.includes(entry.id)) })),
  ].filter(tab => tab.items.length), [ranked]);
  const active = tabs.find(tab => tab.id === topic) ?? tabs[0];
  const rest = useMemo(() => active?.items.slice(1) ?? [], [active]);
  const paged = usePaged(rest, 5);
  if (!active) return null;
  const [first] = active.items;
  const top = Math.max(1, active.items[0].likes);
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next == null) return;
    event.preventDefault();
    const targetIndex = (next + tabs.length) % tabs.length;
    const target = tabs[targetIndex];
    pick(target.id);
    // Keyboard moves can cross a page of pills: show that page, then focus the pill once it is rendered.
    setTabPage(Math.floor(targetIndex / TABS_PER_PAGE));
    requestAnimationFrame(() => document.getElementById(`tb-fav-tab-${target.id}`)?.focus());
  };
  const tabPages = Math.ceil(tabs.length / TABS_PER_PAGE);
  const shownPage = Math.min(tabPage, tabPages - 1);
  const shownTabs = tabs.slice(shownPage * TABS_PER_PAGE, shownPage * TABS_PER_PAGE + TABS_PER_PAGE);
  const pick = (id: string) => { setTopic(id); paged.setPage(0); };
  const share = (likes: number) => `${Math.max(6, (likes / top) * 100)}%`;
  const likesLine = (likes: number) => likes ? `${compact(likes)} ${likes === 1 ? "like" : "likes"}` : "No likes yet · be the first";
  return <section data-track-topic={TECH_BUZZ_TRACKED.favourites} className={styles.favourites} aria-labelledby="tb-liked">
    <SectionHead id="tb-liked" icon={<Heart size={16} fill="currentColor" aria-hidden="true" />} kicker="Community favourites" title={<>Most Liked on <span className={styles.mcb}><BrandMark size={22} />MCB - Tech Buzz</span></>}
      lede="The topics engineers read most, from React and Next.js to Claude Code, OpenAI, Google and Microsoft AI. Pick a topic; readers' likes rank its stories." />
    <div className={styles.favTabRow}>
      {tabPages > 1 && <button type="button" className={styles.favTabArrow} onClick={() => setTabPage(shownPage - 1)} disabled={shownPage === 0} aria-label="Previous topics"><ChevronLeft size={16} aria-hidden="true" /></button>}
      <div className={styles.favTabs} role="tablist" aria-label="Favourite topics">
        {shownTabs.map(tab => { const index = tabs.indexOf(tab); return <button key={tab.id} id={`tb-fav-tab-${tab.id}`} type="button" role="tab" aria-selected={tab.id === active.id} aria-controls="tb-fav-panel"
          tabIndex={tab.id === active.id || (!shownTabs.some(item => item.id === active.id) && tab === shownTabs[0]) ? 0 : -1} style={{ "--tone": tab.color } as CSSProperties} onClick={() => pick(tab.id)} onKeyDown={event => onKey(event, index)}>
          {tab.logo ? <Image src={tab.logo} alt="" width={16} height={16} /> : <i aria-hidden="true" />}{tab.label}<span>{tab.items.length}</span>
        </button>; })}
      </div>
      {tabPages > 1 && <button type="button" className={styles.favTabArrow} onClick={() => setTabPage(shownPage + 1)} disabled={shownPage >= tabPages - 1} aria-label="More topics"><ChevronRight size={16} aria-hidden="true" /></button>}
      {tabPages > 1 && <span className={styles.favTabCount} aria-live="polite">{shownPage + 1} / {tabPages}</span>}
    </div>
    <div id="tb-fav-panel" role="tabpanel" aria-labelledby={`tb-fav-tab-${active.id}`} className={styles.favBody}>
      <article className={styles.favFeature} style={{ "--tone": first.card.color, "--share": share(first.likes) } as CSSProperties}>
        <Link href={`/tech-buzz/${first.card.slug}`} className={styles.favFeatureLink}>
          <Cover card={first.card} className={styles.favCover} sizes="(max-width: 960px) 100vw, (max-width: 1600px) 600px, 780px" />
          <span className={styles.favCrown}><Crown size={14} aria-hidden="true" />#1 in {active.id === ALL_TOPICS ? "the community" : active.label}</span>
          <strong className={styles.favTitle}>{first.card.title}</strong>
          <span className={styles.favSubtitle}>{first.card.subtitle}</span>
          <span className={styles.favMeter}><span className={styles.likedBar} aria-hidden="true"><i /></span><small>{likesLine(first.likes)}</small></span>
          <span className={styles.meta}>{first.card.technology} · {formatDate(first.card.publishedAt)} · {first.card.readTimeMinutes} min <RatingBadge card={first.card} /></span>
        </Link>
        <ReactionBar card={first.card} />
      </article>
      {rest.length > 0 && <div className={styles.favSide}>
        <ol className={styles.likedList} start={paged.offset + 2}>
          {paged.rows.map(({ card, likes }, i) => { const logo = logoOf(card); return <li key={card.id} style={{ "--share": share(likes), "--tone": card.color } as CSSProperties}>
            <span className={styles.likedRank}>#{paged.offset + i + 2}</span>
            <span className={styles.likedLogo} title={card.technology}>{logo ? <Image src={logo} alt={card.technology} width={26} height={26} /> : <b aria-hidden="true">{card.technology.charAt(0)}</b>}</span>
            <Link href={`/tech-buzz/${card.slug}`} className={styles.likedLink}>
              <strong className={styles.cardTitle}>{card.title}</strong>
              <span className={styles.likedBar} aria-hidden="true"><i /></span>
              <span className={styles.meta}>{card.technology} · {likesLine(likes)}</span>
            </Link>
            <ReactionBar card={card} />
          </li>; })}
        </ol>
        <Pagination paged={paged} label={`${active.label} favourites`} anchor="tb-liked" sizes={[5, 10, 20]} />
      </div>}
    </div>
  </section>;
}

/* ── 6. Technology: a tab per group (WAI-ARIA tabs: arrow keys, Home and End), "All" showing every group's own
   section; each section is paginated. ──────────────────────────────────────────────────────────────────────────── */
const ALL_TAB = "all";
const TECH_TABS_PER_PAGE = 4;
// "All technologies" stacks every group (half of the page's 4,500 elements): the first two render at once, the rest
// mount as they near the viewport, so the server HTML and hydration carry only what is on screen.
const EAGER_GROUPS = 2;

/** Renders its children once the placeholder comes within 600 px of the viewport; the placeholder holds their space. */
function WhenNear({ id, children }: { id: string; children: ReactNode }) {
  const [near, setNear] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) setNear(true); }, { rootMargin: "600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [near]);
  // The placeholder keeps the group's id, so a link to #tb-group-… still lands in the right place.
  return near ? children : <div ref={ref} id={id} className={styles.groupPlaceholder} aria-hidden="true" />;
}
function TechnologySections({ cards }: { cards: TechBuzzCard[] }) {
  const groups = useMemo(() => {
    const byGroup = new Map<string, TechBuzzCard[]>();
    for (const card of cards) {
      const group = techGroupOf(card);
      byGroup.set(group.id, [...(byGroup.get(group.id) ?? []), card]);
    }
    return [...TECH_GROUPS, OTHER_GROUP].map(group => ({ group, items: (byGroup.get(group.id) ?? []).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)) })).filter(entry => entry.items.length);
  }, [cards]);
  const [tab, setTab] = useState(ALL_TAB);
  // Tabs show TECH_TABS_PER_PAGE at a time; the page holding the selected tab is shown until the reader pages away.
  const [manualPage, setManualPage] = useState<{ tab: string; page: number } | null>(null);
  if (!groups.length) return null;
  const tabs = [{ id: ALL_TAB, label: "All technologies", count: cards.length, color: "#1f1e1c", tint: "#f0eee6", logo: undefined as string | undefined }, ...groups.map(({ group, items }) => ({ id: group.id, label: group.label, count: items.length, color: group.color, tint: group.tint, logo: techLogo(group.techIds[0]) }))];
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? index + 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next == null) return;
    event.preventDefault();
    const target = tabs[(next + tabs.length) % tabs.length];
    setTab(target.id);
    document.getElementById(`tb-tab-${target.id}`)?.focus();
  };
  const shown = tab === ALL_TAB ? groups : groups.filter(entry => entry.group.id === tab);
  const tabPages = Math.ceil(tabs.length / TECH_TABS_PER_PAGE);
  const homePage = Math.floor(Math.max(0, tabs.findIndex(item => item.id === tab)) / TECH_TABS_PER_PAGE);
  const tabPage = Math.min(tabPages - 1, manualPage?.tab === tab ? manualPage.page : homePage);
  const goTabs = (page: number) => setManualPage({ tab, page: Math.max(0, Math.min(tabPages - 1, page)) });
  return <section data-track-topic={TECH_BUZZ_TRACKED.technologies} className={styles.groups} aria-labelledby="tb-groups">
    <SectionHead id="tb-groups" icon={<Sparkles size={16} aria-hidden="true" />} kicker="Browse by technology" title="Blogs by Technology" lede="Every blog lands in its technology's own section. Pick a technology, or browse them all." />
    <div className={styles.groupTabsRow}>
    <div className={styles.groupTabs} role="tablist" aria-label="Technologies">
      {tabs.map((item, index) => Math.floor(index / TECH_TABS_PER_PAGE) !== tabPage ? null : <button key={item.id} id={`tb-tab-${item.id}`} type="button" role="tab" aria-selected={tab === item.id} aria-controls="tb-tabpanel" tabIndex={tab === item.id ? 0 : -1}
        style={{ "--tone": item.color, "--tint": item.tint } as CSSProperties} onClick={() => setTab(item.id)} onKeyDown={event => onKey(event, index)}>
        {item.logo && <Image src={item.logo} alt="" width={16} height={16} />}{item.label}<span>{item.count}</span>
      </button>)}
    </div>
    {tabPages > 1 && <nav className={styles.tabPager} aria-label="Technology tab pages">
      <button type="button" onClick={() => goTabs(0)} disabled={tabPage === 0} aria-label="First tabs"><ChevronsLeft size={15} aria-hidden="true" /></button>
      <button type="button" onClick={() => goTabs(tabPage - 1)} disabled={tabPage === 0} aria-label="Previous tabs"><ChevronLeft size={15} aria-hidden="true" /></button>
      {Array.from({ length: tabPages }, (_, page) => <button key={page} type="button" onClick={() => goTabs(page)} aria-current={page === tabPage ? "page" : undefined} aria-label={`Tabs page ${page + 1} of ${tabPages}`}>{page + 1}</button>)}
      <button type="button" onClick={() => goTabs(tabPage + 1)} disabled={tabPage >= tabPages - 1} aria-label="Next tabs"><ChevronRight size={15} aria-hidden="true" /></button>
      <button type="button" onClick={() => goTabs(tabPages - 1)} disabled={tabPage >= tabPages - 1} aria-label="Last tabs"><ChevronsRight size={15} aria-hidden="true" /></button>
    </nav>}
    </div>
    <div id="tb-tabpanel" role="tabpanel" aria-labelledby={`tb-tab-${tab}`} className={styles.groupPanel}>
      {shown.map(({ group, items }, index) => index < EAGER_GROUPS ? <TechGroupSection key={group.id} group={group} items={items} />
        : <WhenNear key={group.id} id={`tb-group-${group.id}`}><TechGroupSection group={group} items={items} /></WhenNear>)}
    </div>
  </section>;
}

function TechGroupSection({ group, items }: { group: TechGroup; items: TechBuzzCard[] }) {
  const paged = usePaged(items, 6);
  const heading = `tb-group-${group.id}-title`;
  return <section id={`tb-group-${group.id}`} className={styles.group} style={{ "--tone": group.color, "--tint": group.tint } as CSSProperties} aria-labelledby={heading}>
    <header className={styles.groupHead}>
      <h3 id={heading} tabIndex={-1}>{group.label}<span>{items.length} {items.length === 1 ? "blog" : "blogs"}</span></h3>
      <p>{group.blurb}</p>
    </header>
    <ul className={styles.groupGrid}>
      {paged.rows.map(card => <li key={card.id}>
        <Link href={`/tech-buzz/${card.slug}`} className={styles.groupCard}>
          <Cover card={card} className={styles.groupCover} sizes="(max-width: 640px) 80vw, (max-width: 1100px) 320px, 280px" />
          <span className={styles.groupBody}>
            <span className={styles.groupTech}><TechIcon item={card} />{card.technology}<RatingBadge card={card} /></span>
            <strong className={styles.cardTitle}>{card.title}</strong>
            <span className={styles.meta}><CalendarDays size={12} aria-hidden="true" />{formatDate(card.publishedAt)}<Clock size={12} aria-hidden="true" />{card.readTimeMinutes} min</span>
          </span>
        </Link>
        <ReactionBar card={card} />
      </li>)}
    </ul>
    <Pagination paged={paged} label={group.label} anchor={heading} sizes={[6, 9, 12]} />
  </section>;
}

function SectionHead({ id, icon, kicker, title, lede }: { id: string; icon: ReactNode; kicker: string; title: ReactNode; lede: string }) {
  return <header className={styles.head}>
    <p className={styles.kicker}>{icon}{kicker}</p>
    <h2 id={id} tabIndex={-1}>{title}</h2>
    <p className={styles.lede}>{lede}</p>
  </header>;
}

export function TechBuzzShowcase({ cards }: { cards: TechBuzzCard[] }) {
  return <ReactionProvider>
    <div className={styles.showcase}>
      <DailyEdition cards={cards} />
      <div className={styles.duo}>
        <FreshLatest cards={cards} />
      </div>
      <div className={styles.duo}>
        <StarRated cards={cards} />
      </div>
      <CommunityFavourites cards={cards} />
      <N8nWorkflows cards={cards} />
      <TechnologySections cards={cards} />
      <p className={styles.allStories}><Flame size={15} aria-hidden="true" />Search, filter and save every story below<ArrowRight size={15} aria-hidden="true" /></p>
    </div>
  </ReactionProvider>;
}
