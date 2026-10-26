"use client";

import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Binary, Bookmark, BookmarkCheck, Bot, Building2, Cloud, Clock, FlaskConical, Flame, Hash, Heart, Layers, LayoutGrid,
  LayoutList, MessageCircle, Network, Newspaper, PanelsTopLeft, Rocket, Search, Server, Sparkles, Star, TrendingUp, Trophy, X, type LucideIcon,
} from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { getDiwaliFestiveSaleInfo } from "@/lib/festive-sale";
import { popularity, techLogo, type TechBuzzCard } from "@/lib/tech-buzz-public";
import { isUnsplash, unsplashLoader } from "@/lib/image-loaders";
import styles from "./tech-buzz-blog.module.css";

/**
 * The Tech Buzz blog: a reading-first story list with member stories, feed tabs and a card grid, tinted tags and
 * reactions, and builder milestones, over technology stories only. Every story arrives as a
 * light card (lib/tech-buzz-public.ts); bodies stay on the server behind the member paywall.
 */
type Feed = "for-you" | "latest" | "popular" | "rated" | "saved";
const FEEDS: { id: Feed; label: string; icon: LucideIcon }[] = [
  { id: "for-you", label: "For you", icon: Sparkles },
  { id: "latest", label: "Latest", icon: Clock },
  { id: "popular", label: "Most popular", icon: Flame },
  { id: "rated", label: "Top rated", icon: Star },
  { id: "saved", label: "Reading list", icon: Bookmark },
];
const PAGE = 10;
const SAVED_KEY = "masterclass:tech-buzz-bookmarks";
const TONES = ["#fdf0e6", "#e7f5ee", "#f0ecfb", "#e8f2fb", "#fdf6dc", "#fcebef", "#eef3e6", "#e4f5f5"];

const VIEW_KEY = "masterclass:tech-buzz-view";
/** Reading list and layout live in this browser's storage, read through useSyncExternalStore so the server render
 *  (no storage) and the first client render agree, and writes in another tab show up here too. */
const STORE_EVENT = "masterclass:tech-buzz-storage";
const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORE_EVENT, onChange);
  return () => { window.removeEventListener("storage", onChange); window.removeEventListener(STORE_EVENT, onChange); };
};
const readStored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeStored = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* storage blocked: kept for this visit only */ }
  window.dispatchEvent(new Event(STORE_EVENT));
};
const useStored = (key: string) => useSyncExternalStore(subscribe, () => readStored(key), () => null);
const never = () => () => {};

export type TechBuzzTopic = { id: string; label: string; count: number };
/** A category in the left rail with the technologies written about in it. */
export type TechBuzzGroup = { category: string; count: number; topics: TechBuzzTopic[] };

/** Each category's colour and icon, shared by the rail and the "Explore by category" cards. */
const CATEGORY_STYLE: Record<string, { icon: LucideIcon; tone: string; ink: string }> = {
  "Artificial Intelligence": { icon: Bot, tone: "#f0ecfb", ink: "#5a3fa8" },
  "Frontend Engineering": { icon: PanelsTopLeft, tone: "#e8f2fb", ink: "#245d8f" },
  "Backend & APIs": { icon: Server, tone: "#e7f5ee", ink: "#1f6a4a" },
  "Cloud & DevOps": { icon: Cloud, tone: "#e4f5f5", ink: "#16696b" },
  "Testing & Quality": { icon: FlaskConical, tone: "#fdf6dc", ink: "#86610b" },
  "Computer Science": { icon: Binary, tone: "#fcebef", ink: "#a32c4f" },
  "System Architecture": { icon: Network, tone: "#f5efe6", ink: "#7a5530" },
  "Full-Stack Development": { icon: Layers, tone: "#fdf0e6", ink: "#a5461f" },
  "Enterprise Platforms": { icon: Building2, tone: "#eef3e6", ink: "#4d6b22" },
};
const styleOf = (category: string) => CATEGORY_STYLE[category] ?? { icon: Hash, tone: "#f1efe7", ink: "#3d3d3a" };

const time = (iso: string) => Date.parse(iso) || 0;
const dateLabel = (iso: string) => {
  const date = new Date(`${iso.length === 10 ? `${iso}T00:00:00` : iso}`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
/** Local images go through the optimizer, Unsplash through its own CDN (unsplashLoader); any other remote host as is. */
const remote = (src: string) => /^https?:/.test(src) && !isUnsplash(src);
const loaderFor = (src: string) => (isUnsplash(src) ? unsplashLoader : undefined);
const toneOf = (key: string) => TONES[[...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TONES.length];

function Stars({ rating }: { rating: TechBuzzCard["rating"] }) {
  if (!rating.count) return <span className={styles.newBadge} title="No reader ratings yet">New</span>;
  return <span className={styles.stars} title={`Rated ${rating.average} out of 5 by ${rating.count.toLocaleString("en-IN")} readers`}>
    <span className={styles.starTrack} aria-hidden="true">★★★★★<span style={{ width: `${(rating.average / 5) * 100}%` }}>★★★★★</span></span>
    <b>{rating.average.toFixed(1)}</b><span className={styles.muted}>({compact(rating.count)})</span>
    <span className={styles.srOnly}>{`Rated ${rating.average} out of 5`}</span>
  </span>;
}

function Thumb({ card, size }: { card: TechBuzzCard; size: "list" | "grid" | "hero" }) {
  const logo = techLogo(card.techId);
  return <span className={styles.thumb} data-size={size} style={{ "--tone": toneOf(card.technology) } as CSSProperties} title={card.photoCredit}>
    <Image src={card.coverImage} loader={loaderFor(card.coverImage)} alt="" fill sizes={size === "hero" ? "(max-width: 900px) 100vw, 640px" : size === "grid" ? "(max-width: 640px) 100vw, 320px" : "120px"}
      unoptimized={remote(card.coverImage)} className={styles.thumbImage} preload={size === "hero"} />
    {logo && <span className={styles.thumbLogo}><Image src={logo} alt="" width={28} height={28} /></span>}
    {size === "hero" && card.photoCredit && <small className={styles.credit}>{card.photoCredit}</small>}
  </span>;
}

function Meta({ card }: { card: TechBuzzCard }) {
  return <span className={styles.meta}>
    <span className={styles.member} title="Member-only story"><Sparkles size={13} aria-hidden="true" />Member</span>
    <span>{dateLabel(card.publishedAt)}</span>
    <span><Clock size={13} aria-hidden="true" />{card.readTimeMinutes} min</span>
    <Stars rating={card.rating} />
    {card.claps > 0 && <span title="Claps">👏 {compact(card.claps)}</span>}
    {card.reactions > 0 && <span title="Reactions"><Heart size={13} aria-hidden="true" />{compact(card.reactions)}</span>}
    {card.commentsCount > 0 && <span title="Comments"><MessageCircle size={13} aria-hidden="true" />{compact(card.commentsCount)}</span>}
  </span>;
}

function SaveButton({ saved, onToggle, title }: { saved: boolean; onToggle: () => void; title: string }) {
  return <button type="button" className={styles.save} aria-pressed={saved} onClick={onToggle} aria-label={`${saved ? "Remove" : "Save"} ${title} ${saved ? "from" : "to"} your reading list`}>
    {saved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
  </button>;
}

export function TechBuzzBlog({ cards, groups }: { cards: TechBuzzCard[]; groups: TechBuzzGroup[] }) {
  const [feed, setFeed] = useState<Feed>("for-you");
  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  // Fallbacks for a browser that blocks storage, so saving and switching layout still work for the visit.
  const [savedThisVisit, setSavedThisVisit] = useState<Record<string, boolean> | null>(null);
  const [viewThisVisit, setViewThisVisit] = useState<"list" | "grid" | null>(null);
  const storedSaved = useStored(SAVED_KEY);
  const storedView = useStored(VIEW_KEY);
  const saved = useMemo<Record<string, boolean>>(() => {
    if (savedThisVisit) return savedThisVisit;
    try { return JSON.parse(storedSaved ?? "{}"); } catch { return {}; }
  }, [savedThisVisit, storedSaved]);
  const view = viewThisVisit ?? (storedView === "grid" ? "grid" : "list");
  // The sale banner shows on the server render; the browser's clock hides it once the sale has ended.
  const saleEnded = useSyncExternalStore(never, () => !getDiwaliFestiveSaleInfo(Date.now()).active, () => false);
  const sale = getDiwaliFestiveSaleInfo();

  const toggleSaved = (id: string) => {
    const next = { ...saved, [id]: !saved[id] };
    setSavedThisVisit(next);
    writeStored(SAVED_KEY, JSON.stringify(next));
  };
  const chooseView = (next: "list" | "grid") => { setViewThisVisit(next); writeStored(VIEW_KEY, next); };

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = cards.filter(card =>
      (!topic || card.techId === topic || card.category === topic) &&
      (feed !== "saved" || saved[card.id]) &&
      (!q || [card.title, card.subtitle, card.technology, card.category, card.author.name, ...card.tags].some(text => text.toLowerCase().includes(q))));
    const newest = Math.max(...cards.map(card => time(card.publishedAt)), 0);
    const freshness = (card: TechBuzzCard) => Math.max(0, 30 - (newest - time(card.publishedAt)) / 86400000) * 40;
    const score: Record<Feed, (card: TechBuzzCard) => number> = {
      "for-you": card => popularity(card) * 0.4 + freshness(card) + (card.featured ? 400 : 0),
      latest: card => time(card.publishedAt),
      popular: popularity,
      rated: card => (card.rating.count ? card.rating.average * 1000 + Math.log10(card.rating.count) : 0),
      saved: card => time(card.publishedAt),
    };
    return [...list].sort((a, b) => score[feed](b) - score[feed](a));
  }, [cards, feed, topic, query, saved]);

  const filtered = !!(topic || query.trim()) || feed !== "for-you";
  const hero = filtered ? null : ranked[0];
  const stories = hero ? ranked.slice(1) : ranked;
  const visible = stories.slice(0, shown);
  const staffPicks = useMemo(() => [...cards].filter(card => card.rating.count).sort((a, b) => b.rating.average - a.rating.average).slice(0, 4), [cards]);
  const trending = useMemo(() => [...cards].sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99) || popularity(b) - popularity(a)).slice(0, 5), [cards]);
  const milestones = useMemo(() => cards.filter(card => card.milestone && card.claps > 0).slice(0, 3), [cards]);
  const topicLabel = groups.flatMap(group => group.topics).find(item => item.id === topic)?.label ?? topic;
  const savedCount = cards.filter(card => saved[card.id]).length;
  // One picture per category for the "Explore by category" row: its most popular story's cover.
  const spotlight = useMemo(() => groups.map(group => ({ ...group, cover: [...cards].filter(card => card.category === group.category).sort((a, b) => popularity(b) - popularity(a))[0] })), [groups, cards]);
  const resetTo = (next: () => void) => { next(); setShown(PAGE); };

  return <div className={styles.blog}>
    <header className={styles.masthead}>
      <div className={styles.brand}>
        <p className={styles.kicker}><Newspaper size={15} aria-hidden="true" />Tech Buzz</p>
        <h1>Technology stories worth your time</h1>
        <p className={styles.lede}>Practical deep dives on every technology in the Learning Dashboard, rated by readers. Members read every story in full.</p>
      </div>
      <div className={styles.tools}>
        <label className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <span className={styles.srOnly}>Search stories</span>
          <input type="search" value={query} placeholder="Search stories, technologies, tags…" onChange={event => resetTo(() => setQuery(event.target.value))} />
          {query && <button type="button" onClick={() => resetTo(() => setQuery(""))} aria-label="Clear search"><X size={15} /></button>}
        </label>
        <div className={styles.viewToggle} role="group" aria-label="Layout">
          <button type="button" aria-pressed={view === "list"} onClick={() => chooseView("list")} aria-label="List view"><LayoutList size={17} /></button>
          <button type="button" aria-pressed={view === "grid"} onClick={() => chooseView("grid")} aria-label="Card view"><LayoutGrid size={17} /></button>
        </div>
        <LanguageSwitcher />
      </div>
    </header>

    {!saleEnded && <Link href="/subscribe" className={styles.sale}>
      <Sparkles size={16} aria-hidden="true" />
      <span><b>{sale.title}:</b> {sale.discountPercent}% off membership until {sale.validTill}. Read every story in full.</span>
      <ArrowRight size={16} aria-hidden="true" />
    </Link>}

    <nav className={styles.feeds} aria-label="Story feeds">
      {FEEDS.map(item => { const Icon = item.icon; return <button key={item.id} type="button" aria-pressed={feed === item.id} onClick={() => resetTo(() => setFeed(item.id))}>
        <Icon size={15} aria-hidden="true" />{item.label}
      </button>; })}
    </nav>

    <div className={styles.layout}>
      <aside className={styles.topics} aria-label="Topics">
        <button type="button" className={styles.readingCard} aria-pressed={feed === "saved"} onClick={() => resetTo(() => { setTopic(null); setFeed(feed === "saved" ? "for-you" : "saved"); })}>
          <span className={styles.readingIcon} aria-hidden="true"><BookmarkCheck size={18} /></span>
          <span><b>Your reading list</b><small>{savedCount ? `${savedCount} saved ${savedCount === 1 ? "story" : "stories"}` : "Save stories to read later"}</small></span>
        </button>
        <h2><Hash size={15} aria-hidden="true" />Browse topics</h2>
        <button type="button" className={styles.allTopics} aria-pressed={!topic} onClick={() => resetTo(() => setTopic(null))}>
          <Sparkles size={15} aria-hidden="true" /><span>All technologies</span><small>{cards.length}</small>
        </button>
        <div className={styles.groups}>{groups.map(group => {
          const { icon: Icon, tone, ink } = styleOf(group.category);
          return <section key={group.category} className={styles.group} style={{ "--tone": tone, "--ink": ink } as CSSProperties}>
            <button type="button" className={styles.groupHead} aria-pressed={topic === group.category} onClick={() => resetTo(() => setTopic(topic === group.category ? null : group.category))}>
              <span className={styles.groupIcon} aria-hidden="true"><Icon size={16} /></span><span>{group.category}</span><small>{group.count}</small>
            </button>
            {group.topics.length > 0 && <ul>{group.topics.map(item => <li key={item.id}><button type="button" aria-pressed={topic === item.id} onClick={() => resetTo(() => setTopic(topic === item.id ? null : item.id))}>
              {techLogo(item.id) ? <Image src={techLogo(item.id)!} alt="" width={18} height={18} /> : <span className={styles.dot} aria-hidden="true" />}
              <span>{item.label}</span><small>{item.count}</small>
            </button></li>)}</ul>}
          </section>;
        })}</div>
      </aside>

      <main className={styles.feed} aria-label="Stories">
        {(topic || query.trim()) && <p className={styles.filterNote} role="status">
          {ranked.length} {ranked.length === 1 ? "story" : "stories"}{topicLabel ? ` on ${topicLabel}` : ""}{query.trim() ? ` matching “${query.trim()}”` : ""}
          <button type="button" onClick={() => resetTo(() => { setTopic(null); setQuery(""); })}>Clear</button>
        </p>}

        {hero && <article className={styles.hero}>
          <Link href={`/tech-buzz/${hero.slug}`} className={styles.heroLink}>
            <Thumb card={hero} size="hero" />
            <span className={styles.heroBody}>
              <span className={styles.eyebrow} style={{ color: hero.color }}>{hero.technology} · {hero.category}</span>
              <h2>{hero.title}</h2>
              <p>{hero.subtitle}</p>
              <span className={styles.byline}><Image src={hero.author.avatar} alt="" width={26} height={26} loader={loaderFor(hero.author.avatar)} unoptimized={remote(hero.author.avatar)} />{hero.author.name}</span>
              <Meta card={hero} />
            </span>
          </Link>
          <SaveButton saved={!!saved[hero.id]} onToggle={() => toggleSaved(hero.id)} title={hero.title} />
        </article>}

        {!filtered && <section className={styles.spotlight} aria-labelledby="explore-heading">
          <h2 id="explore-heading">Explore by category</h2>
          <ul>{spotlight.map(group => {
            const { icon: Icon, tone, ink } = styleOf(group.category);
            return <li key={group.category} style={{ "--tone": tone, "--ink": ink } as CSSProperties}>
              <button type="button" onClick={() => resetTo(() => setTopic(group.category))}>
                {group.cover && <Thumb card={group.cover} size="grid" />}
                <span className={styles.spotlightBody}><span className={styles.groupIcon} aria-hidden="true"><Icon size={15} /></span><b>{group.category}</b><small>{group.count} {group.count === 1 ? "story" : "stories"}</small></span>
              </button>
            </li>;
          })}</ul>
        </section>}

        {visible.length === 0 ? <div className={styles.empty}>
          <Bookmark size={28} aria-hidden="true" />
          <p>{feed === "saved" ? "Your reading list is empty. Tap the bookmark on any story to save it here." : "No stories match yet. Try another topic or search."}</p>
        </div> : <ol className={styles.stories} data-view={view}>
          {visible.map((card, index) => <li key={card.id} style={{ "--i": index % PAGE } as CSSProperties}>
            <article className={styles.story}>
              <Link href={`/tech-buzz/${card.slug}`} className={styles.storyLink}>
                <span className={styles.storyText}>
                  <span className={styles.byline}>
                    <Image src={card.author.avatar} alt="" width={22} height={22} loader={loaderFor(card.author.avatar)} unoptimized={remote(card.author.avatar)} />
                    <span>{card.author.name}</span>
                    <span className={styles.muted}>in</span>
                    <span className={styles.eyebrow} style={{ color: card.color }}>{card.technology}</span>
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.subtitle}</p>
                  <span className={styles.tags}>{card.tags.slice(0, 3).map(tag => <span key={tag} style={{ "--tone": toneOf(tag) } as CSSProperties}>#{tag.toLowerCase().replace(/[^a-z0-9.+]+/g, "")}</span>)}</span>
                  <Meta card={card} />
                </span>
                <Thumb card={card} size={view === "grid" ? "grid" : "list"} />
              </Link>
              <SaveButton saved={!!saved[card.id]} onToggle={() => toggleSaved(card.id)} title={card.title} />
            </article>
          </li>)}
        </ol>}

        {stories.length > shown && <button type="button" className={styles.more} onClick={() => setShown(count => count + PAGE)}>
          Show more stories <small>{stories.length - shown} left</small>
        </button>}

      </main>

      <aside className={styles.sidebar} aria-label="Highlights">
        {staffPicks.length > 0 && <section>
          <h2><Trophy size={16} aria-hidden="true" />Top rated</h2>
          <ol className={styles.picks}>{staffPicks.map(card => <li key={card.id}><Link href={`/tech-buzz/${card.slug}`}>
            <span className={styles.byline}><Image src={card.author.avatar} alt="" width={18} height={18} loader={loaderFor(card.author.avatar)} unoptimized={remote(card.author.avatar)} />{card.author.name}</span>
            <b>{card.title}</b><Stars rating={card.rating} />
          </Link></li>)}</ol>
        </section>}
        <section>
          <h2><TrendingUp size={16} aria-hidden="true" />Trending now</h2>
          <ol className={styles.trending}>{trending.map((card, index) => <li key={card.id}><Link href={`/tech-buzz/${card.slug}`}>
            <span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span>
            <span><b>{card.title}</b><small>{card.technology} · {card.readTimeMinutes} min{card.likes ? ` · ▲ ${compact(card.likes)}` : ""}</small></span>
          </Link></li>)}</ol>
        </section>
        {milestones.length > 0 && <section>
          <h2><Rocket size={16} aria-hidden="true" />Builder milestones</h2>
          <ul className={styles.milestones}>{milestones.map(card => <li key={card.id}><Link href={`/tech-buzz/${card.slug}`}>
            <small>{card.milestone!.label}</small><b>{card.milestone!.value}</b><span>{card.technology}</span>
          </Link></li>)}</ul>
        </section>}
        <section className={styles.memberCard}>
          <h2><Sparkles size={16} aria-hidden="true" />Become a member</h2>
          <p>Read every story in full with code, audio and discussion, plus every course, quiz and interview set.</p>
          <Link href="/subscribe">See plans<ArrowRight size={15} aria-hidden="true" /></Link>
        </section>
      </aside>
    </div>
  </div>;
}
