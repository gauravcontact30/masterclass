"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Binary, Bookmark, BookmarkCheck, BookOpen, Bot, Building2, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Cloud, Clock,
  Compass, FlaskConical, Flame, Hash, Heart, Layers, LayoutGrid, LayoutList, Maximize2, MessageCircle, Minimize2, Network,
  PanelsTopLeft, Rocket, Search, Server, ShieldCheck, Sparkles, Star, TrendingUp, Trophy, X, Zap, type LucideIcon,
} from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { BrandMark } from "./brand-mark";
import { useLanguage } from "./language-provider";
import { getDiwaliFestiveSaleInfo } from "@/lib/festive-sale";
import { DEFAULT_READING_FONT_ID, popularity, READING_FONTS, techLogo, type TechBuzzCard } from "@/lib/tech-buzz-public";
import { isUnsplash, unsplashLoader } from "@/lib/image-loaders";
import { loadGoogleFont } from "@/lib/google-fonts";
import { FontFamilyDropdown } from "./font-family-dropdown";
import styles from "./tech-buzz-blog.module.css";
import { TechBuzzShowcase } from "./tech-buzz-showcase";

/**
 * The Tech Buzz blog: an elite, reading-first technology publication.
 * Contains only technology-related blogs with rich high-resolution thumbnails,
 * interactive learning tracks (Agentic AI, LangChain, LangGraph, LangSmith, LangFlow,
 * n8n, Next.js 16+, React 19+, System Design), and curated learning roadmaps.
 */
type Feed = "for-you" | "latest" | "popular" | "rated" | "saved";
const FEEDS: { id: Feed; label: string; icon: LucideIcon }[] = [
  { id: "for-you", label: "For you", icon: Sparkles },
  { id: "latest", label: "Latest", icon: Clock },
  { id: "popular", label: "Most popular", icon: Flame },
  { id: "rated", label: "Top rated", icon: Star },
  { id: "saved", label: "Reading list", icon: Bookmark },
];
const PAGE = 12;
const SAVED_KEY = "masterclass:tech-buzz-bookmarks";
const TONES = ["#fdf0e6", "#e7f5ee", "#f0ecfb", "#e8f2fb", "#fdf6dc", "#fcebef", "#eef3e6", "#e4f5f5"];

const VIEW_KEY = "masterclass:tech-buzz-view";
const STORE_EVENT = "masterclass:tech-buzz-storage";
const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORE_EVENT, onChange);
  return () => { window.removeEventListener("storage", onChange); window.removeEventListener(STORE_EVENT, onChange); };
};
const readStored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeStored = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(STORE_EVENT));
};
const useStored = (key: string) => useSyncExternalStore(subscribe, () => readStored(key), () => null);
const never = () => () => {};

export type TechBuzzTopic = { id: string; label: string; count: number };
export type TechBuzzGroup = { category: string; count: number; topics: TechBuzzTopic[] };

/** High-priority technology tracks highlighted for developers */
export interface FeaturedTrack {
  id: string;
  label: string;
  techId: string;
  tagline: string;
  badge?: string;
}

export const FEATURED_TRACKS: FeaturedTrack[] = [
  // Page 1: Agentic AI & Orchestration
  { id: "agentic-ai", label: "Agentic AI", techId: "agentic-ai", tagline: "Autonomous Agents & MCP", badge: "Trending" },
  { id: "langchain", label: "LangChain", techId: "langchain", tagline: "Production LLM Agents" },
  { id: "langgraph", label: "LangGraph", techId: "langgraph", tagline: "Stateful Graph Workflows", badge: "Hot" },
  { id: "langsmith", label: "LangSmith", techId: "langsmith", tagline: "Tracing & Evals" },
  { id: "langflow", label: "LangFlow", techId: "langflow", tagline: "Visual AI Prototyping" },
  { id: "n8n", label: "n8n Automation", techId: "n8n", tagline: "AI Webhooks & Workflows" },
  // Page 2: Modern Full-Stack & Systems
  { id: "nextjs", label: "Next.js 16+", techId: "nextjs", tagline: "Cache Components & PPR", badge: "Core" },
  { id: "react", label: "React 19+", techId: "react", tagline: "Actions & Compiler" },
  { id: "system-design", label: "System Design", techId: "system-design", tagline: "Scalable Architecture", badge: "Interview" },
  { id: "typescript", label: "TypeScript 5.8", techId: "typescript", tagline: "Strict Types & AOT" },
  { id: "postgresql", label: "PostgreSQL 17", techId: "postgresql", tagline: "pgvector & Sharding" },
  { id: "redis", label: "Redis Caching", techId: "redis", tagline: "Low-Latency State" },
  // Page 3: Cloud Infrastructure & Distributed Scale
  { id: "kubernetes", label: "Kubernetes & eBPF", techId: "kubernetes", tagline: "Cloud-Native Infra" },
  { id: "docker", label: "Docker Microservices", techId: "docker", tagline: "Containerization" },
  { id: "aws", label: "AWS Architecture", techId: "aws", tagline: "Distributed Cloud" },
  { id: "playwright", label: "Playwright Testing", techId: "playwright", tagline: "End-to-End Automation" },
  { id: "graphql", label: "GraphQL Federation", techId: "graphql", tagline: "Unified API Gateway" },
  { id: "rust", label: "Rust Systems", techId: "rust", tagline: "Memory-Safe Systems" },
];

/** Curated Learning Roadmaps */
interface LearningRoadmap {
  id: string;
  title: string;
  kicker: string;
  description: string;
  techIds: string[];
  steps: string[];
  icon: LucideIcon;
  badge: string;
}

const LEARNING_ROADMAPS: LearningRoadmap[] = [
  {
    id: "ai-agents-roadmap",
    title: "Agentic AI & Orchestration Track",
    kicker: "Autonomous AI Architecture",
    description: "Master autonomous multi-agent systems from prompt tools to stateful persistence and webhook automation.",
    techIds: ["agentic-ai", "langchain", "langgraph", "langsmith", "langflow", "n8n"],
    steps: ["Agentic AI & MCP", "LangChain Agents", "LangGraph State Machines", "LangSmith Observability", "LangFlow Visuals", "n8n Automation"],
    icon: Bot,
    badge: "Most Popular",
  },
  {
    id: "modern-fullstack-roadmap",
    title: "Next.js 16+ & React 19+ Masterclass",
    kicker: "Modern Full-Stack Stack",
    description: "Build zero-waterfall, compiler-optimized apps with Server Actions, Cache Components, and optimistic UI.",
    techIds: ["nextjs", "react", "typescript", "tanstack"],
    steps: ["React 19 Actions", "Next.js 16 Caching", "TypeScript 5.8 Types", "TanStack Start"],
    icon: PanelsTopLeft,
    badge: "Production Ready",
  },
  {
    id: "system-design-roadmap",
    title: "System Design & Distributed Scalability",
    kicker: "High-Throughput Engineering",
    description: "Scale from 10k to 10M requests with token bucket rate limiters, vector indexes, Redis, and event streams.",
    techIds: ["system-design", "postgresql", "redis", "kubernetes", "aws"],
    steps: ["Rate Limiter Design", "PostgreSQL 17 Vector", "Redis In-Memory", "Distributed Kafka", "K8s Microservices"],
    icon: Network,
    badge: "Architectural",
  },
];

/** Each category's colour and icon */
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
    <Image src={card.coverImage} loader={loaderFor(card.coverImage)} alt="" fill sizes={size === "hero" ? "(max-width: 900px) 100vw, 640px" : size === "grid" ? "(max-width: 640px) 100vw, 360px" : "140px"}
      unoptimized={remote(card.coverImage)} className={styles.thumbImage} preload={size === "hero"} />
    {logo && <span className={styles.thumbLogo} title={card.technology}><Image src={logo} alt={card.technology} width={size === "hero" ? 34 : 26} height={size === "hero" ? 34 : 26} /></span>}
    {size === "grid" && <span className={styles.thumbReadTime}><Clock size={11} aria-hidden="true" />{card.readTimeMinutes} min</span>}
    {size === "hero" && card.photoCredit && <small className={styles.credit}>{card.photoCredit}</small>}
  </span>;
}

function Meta({ card }: { card: TechBuzzCard }) {
  return <span className={styles.meta}>
    <span className={styles.member} title="Member-only deep dive"><Sparkles size={13} aria-hidden="true" />Member</span>
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

const READING_FONT_STORAGE_KEY = "masterclass:tech-buzz-reading-font";
const READING_FONT_EVENT = "masterclass-reading-font";
function subscribeReadingFont(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(READING_FONT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(READING_FONT_EVENT, callback);
  };
}
/** The reading font id the reader saved, when it is still on the list; null otherwise or when storage is unavailable. */
function readSavedReadingFont(): string | null {
  try {
    const stored = localStorage.getItem(READING_FONT_STORAGE_KEY);
    return stored && READING_FONTS.some(f => f.id === stored) ? stored : null;
  } catch {
    return null;
  }
}

/** `showcase`: show the curated sections (components/tech-buzz-showcase.tsx) between the masthead and the feed. Rendered
 *  here rather than passed in as an element, which React's dev key check flags when it crosses the server boundary. */
export function TechBuzzBlog({ cards, groups, showcase = false }: { cards: TechBuzzCard[]; groups: TechBuzzGroup[]; showcase?: boolean }) {
  const { t } = useLanguage();
  const [feed, setFeed] = useState<Feed>("for-you");
  const [topic, setTopic] = useState<string | null>(null);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [savedThisVisit, setSavedThisVisit] = useState<Record<string, boolean> | null>(null);
  const [viewThisVisit, setViewThisVisit] = useState<"list" | "grid" | null>(null);
  const storedSaved = useStored(SAVED_KEY);
  const storedView = useStored(VIEW_KEY);
  const saved = useMemo<Record<string, boolean>>(() => {
    if (savedThisVisit) return savedThisVisit;
    try { return JSON.parse(storedSaved ?? "{}"); } catch { return {}; }
  }, [savedThisVisit, storedSaved]);
  const view = viewThisVisit ?? (storedView === "grid" ? "grid" : "list");
  const saleEnded = useSyncExternalStore(never, () => !getDiwaliFestiveSaleInfo(Date.now()).active, () => false);
  const sale = getDiwaliFestiveSaleInfo();

  // Popular Learning Tracks Pagination
  const TRACKS_PER_PAGE = 5;
  const [tracksPage, setTracksPage] = useState<number>(1);
  const totalTracksPages = Math.ceil(FEATURED_TRACKS.length / TRACKS_PER_PAGE);
  const startTrackIndex = (tracksPage - 1) * TRACKS_PER_PAGE;
  const endTrackIndex = startTrackIndex + TRACKS_PER_PAGE;
  const currentTracks = FEATURED_TRACKS.slice(startTrackIndex, endTrackIndex);

  const toggleSaved = (id: string) => {
    const next = { ...saved, [id]: !saved[id] };
    setSavedThisVisit(next);
    writeStored(SAVED_KEY, JSON.stringify(next));
  };
  const chooseView = (next: "list" | "grid") => { setViewThisVisit(next); writeStored(VIEW_KEY, next); };

  const activeRoadmap = useMemo(() => LEARNING_ROADMAPS.find(r => r.id === activeRoadmapId) ?? null, [activeRoadmapId]);

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = cards.filter(card => {
      // Roadmap filter
      if (activeRoadmap && (!card.techId || !activeRoadmap.techIds.includes(card.techId))) {
        return false;
      }
      // Topic/Category filter
      if (topic && card.techId !== topic && card.category !== topic) {
        return false;
      }
      // Feed saved filter
      if (feed === "saved" && !saved[card.id]) {
        return false;
      }
      // Search query filter
      if (q && ![card.title, card.subtitle, card.technology, card.category, card.author.name, ...card.tags].some(text => text.toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });

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
  }, [cards, feed, topic, activeRoadmap, query, saved]);

  const filtered = !!(topic || activeRoadmapId || query.trim()) || feed !== "for-you";
  const hero = filtered ? null : ranked[0];
  const stories = hero ? ranked.slice(1) : ranked;
  const visible = stories.slice(0, shown);
  const staffPicks = useMemo(() => [...cards].filter(card => card.rating.count).sort((a, b) => b.rating.average - a.rating.average).slice(0, 4), [cards]);
  const trending = useMemo(() => [...cards].sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99) || popularity(b) - popularity(a)).slice(0, 5), [cards]);
  const milestones = useMemo(() => cards.filter(card => card.milestone && card.claps > 0).slice(0, 3), [cards]);
  const topicLabel = groups.flatMap(group => group.topics).find(item => item.id === topic)?.label ?? topic;
  const savedCount = cards.filter(card => saved[card.id]).length;
  const spotlight = useMemo(() => groups.map(group => ({ ...group, cover: [...cards].filter(card => card.category === group.category).sort((a, b) => popularity(b) - popularity(a))[0] })), [groups, cards]);
  const resetTo = (next: () => void) => { next(); setShown(PAGE); };

  // Collapsible sidebars for full-width reading experience (collapsed by default for full-width reading)
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(true);
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(true);

  // Explore By Category Pagination: 3 tabs per page when both sidebars are expanded, 5 otherwise
  const bothSidebarsExpanded = !leftCollapsed && !rightCollapsed;
  const categoriesPerPage = bothSidebarsExpanded ? 3 : 5;
  const [categoriesPage, setCategoriesPage] = useState<number>(1);
  const totalCategoriesPages = Math.max(1, Math.ceil(spotlight.length / categoriesPerPage));
  const safeCategoriesPage = Math.min(categoriesPage, totalCategoriesPages);
  const startCategoryIndex = (safeCategoriesPage - 1) * categoriesPerPage;
  const endCategoryIndex = startCategoryIndex + categoriesPerPage;
  const currentCategories = spotlight.slice(startCategoryIndex, endCategoryIndex);

  const selectRoadmap = (roadmapId: string) => {
    resetTo(() => {
      setTopic(null);
      setActiveRoadmapId(prev => (prev === roadmapId ? null : roadmapId));
    });
  };

  const selectTrack = (trackId: string) => {
    resetTo(() => {
      setActiveRoadmapId(null);
      setTopic(prev => (prev === trackId ? null : trackId));
    });
    const trackIndex = FEATURED_TRACKS.findIndex(t => t.techId === trackId);
    if (trackIndex !== -1) {
      setTracksPage(Math.floor(trackIndex / TRACKS_PER_PAGE) + 1);
    }
  };

  const selectCategory = (categoryName: string) => {
    resetTo(() => {
      setActiveRoadmapId(null);
      setTopic(prev => (prev === categoryName ? null : categoryName));
    });
    const catIndex = spotlight.findIndex(s => s.category === categoryName);
    if (catIndex !== -1) {
      setCategoriesPage(Math.floor(catIndex / categoriesPerPage) + 1);
    }
  };

  // Left Sidebar Category Accordion: first is expanded by default, others collapsed
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const isCategoryExpanded = (catName: string, index: number) => {
    if (expandedCategories[catName] !== undefined) {
      return expandedCategories[catName];
    }
    return index === 0;
  };

  const toggleCategoryAccordion = (catName: string, index: number) => {
    setExpandedCategories(prev => {
      const current = isCategoryExpanded(catName, index);
      return { ...prev, [catName]: !current };
    });
  };

  // Reading font: the reader's saved pick, read straight from storage (no state copied in an effect). None saved means
  // the default, and a saved pick wins over the application font inside the blog (data-own-font).
  const savedFontId = useSyncExternalStore(subscribeReadingFont, readSavedReadingFont, () => null);
  const readingChosen = savedFontId !== null;
  const currentFont = useMemo(() => {
    return READING_FONTS.find(f => f.id === (savedFontId ?? DEFAULT_READING_FONT_ID)) ?? READING_FONTS[0];
  }, [savedFontId]);

  // Loading the font's stylesheet is the only side effect; it sets no React state.
  useEffect(() => {
    if (readingChosen) loadGoogleFont(currentFont.name);
  }, [readingChosen, currentFont.name]);

  const handleFontChange = (fontId: string) => {
    try {
      localStorage.setItem(READING_FONT_STORAGE_KEY, fontId);
    } catch {
      /* ignore storage error */
    }
    window.dispatchEvent(new Event(READING_FONT_EVENT));
  };

  return <div
    className={styles.blog}
    data-full-width={leftCollapsed && rightCollapsed ? "true" : "false"}
    data-own-font={readingChosen || undefined}
    style={{ "--reading-font": currentFont.stack } as CSSProperties}
  >
    {/* 1. Masthead */}
    <header className={styles.masthead}>
      <div className={styles.brand}>
        <div className={styles.badgeRow}>
          <p className={styles.kicker}><BrandMark size={18} />MCB - Tech Buzz</p>
          <span className={styles.verifiedKicker}><Sparkles size={13} aria-hidden="true" />Engineering Masterclasses</span>
        </div>
        <h1>{t("techBuzzTitle")}</h1>
        <p className={styles.lede}>
          {t("techBuzzSubtitle")}
        </p>
      </div>

      {/* Modern Compact Deck: Cards & Tools arranged below the lede paragraph */}
      <div className={styles.mastheadDeck}>
        <div className={styles.metricsRibbon}>
          <div className={styles.metricItem}>
            <BookOpen size={14} className={styles.metricIcon} aria-hidden="true" />
            <span className={styles.metricValue}>{cards.length}+</span>
            <span className={styles.metricLabel}>Engineering Guides</span>
          </div>
          <span className={styles.metricDivider} aria-hidden="true" />
          <div className={styles.metricItem}>
            <ShieldCheck size={14} className={styles.metricIcon} aria-hidden="true" />
            <span className={styles.metricValue}>100%</span>
            <span className={styles.metricLabel}>Code & Architecture Verified</span>
          </div>
          <span className={styles.metricDivider} aria-hidden="true" />
          <div className={styles.metricItem}>
            <Layers size={14} className={styles.metricIcon} aria-hidden="true" />
            <span className={styles.metricValue}>18</span>
            <span className={styles.metricLabel}>Technology Tracks</span>
          </div>
          <span className={styles.metricDivider} aria-hidden="true" />
          <div className={styles.metricItem}>
            <Star size={13} className={styles.metricStarIcon} aria-hidden="true" />
            <span className={styles.metricValue}>4.9★</span>
            <span className={styles.metricLabel}>Developer Rated</span>
          </div>
        </div>

        <div className={styles.tools}>
          <label className={styles.search}>
            <Search size={16} aria-hidden="true" />
            <span className={styles.srOnly}>Search stories</span>
            <input
              type="search"
              value={query}
              placeholder={t("techBuzzSearchPlaceholder")}
              onChange={event => resetTo(() => setQuery(event.target.value))}
            />
            {query && <button type="button" onClick={() => resetTo(() => setQuery(""))} aria-label={t("techBuzzClearSearch")}><X size={14} /></button>}
          </label>

          {/* Creative & Professional Shadcn UI Reading Font Dropdown (75+ Google Fonts) */}
          <FontFamilyDropdown
            value={currentFont.id}
            onChange={handleFontChange}
            fonts={READING_FONTS}
            ariaLabel="Select reading font family"
            variant="pill"
            valueType="id"
            defaultVal={DEFAULT_READING_FONT_ID}
          />

          <div className={styles.viewToggle} role="group" aria-label="Layout">
            <button type="button" aria-pressed={view === "list"} onClick={() => chooseView("list")} aria-label="List view" title="List View"><LayoutList size={16} /></button>
            <button type="button" aria-pressed={view === "grid"} onClick={() => chooseView("grid")} aria-label="Card view" title="Grid View"><LayoutGrid size={16} /></button>
          </div>
          <button
            type="button"
            className={styles.fullWidthToggle}
            aria-pressed={leftCollapsed && rightCollapsed}
            onClick={() => {
              const next = !(leftCollapsed && rightCollapsed);
              setLeftCollapsed(next);
              setRightCollapsed(next);
            }}
            aria-label={leftCollapsed && rightCollapsed ? "Standard width view" : "Full width reading view"}
            title={leftCollapsed && rightCollapsed ? "Exit full width reading (Expand sidebars)" : "Full width reading mode (Collapse sidebars)"}
          >
            {leftCollapsed && rightCollapsed ? <Minimize2 size={15} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />}
            <span>{leftCollapsed && rightCollapsed ? "Standard" : "Full width"}</span>
          </button>
          <div className={styles.langWrapper}>
            <LanguageSwitcher size="sm" />
          </div>
        </div>
      </div>
    </header>

    {showcase && <TechBuzzShowcase cards={cards} />}

    {/* 2. Featured Technology Learning Tracks Bar with Proper Pagination */}
    <section className={styles.techTracksSection} aria-label={t("techBuzzPopularTracks")}>
      <div className={styles.techTracksHeader}>
        <div className={styles.techTracksTitleGroup}>
          <span className={styles.techTracksTitle}><Zap size={15} aria-hidden="true" />{t("techBuzzPopularTracks")}</span>
          <span className={styles.techTracksSubtitle}>{t("techBuzzPopularTracksSubtitle")}</span>
        </div>

        {/* Proper Pagination Controls */}
        <div className={styles.tracksPagination} role="navigation" aria-label="Learning tracks pagination">
          <span className={styles.tracksPageText} aria-live="polite">
            {t("techBuzzTracksShowing")} {startTrackIndex + 1}–{Math.min(endTrackIndex, FEATURED_TRACKS.length)} {t("techBuzzTracksOf")} {FEATURED_TRACKS.length}
          </span>
          <div className={styles.tracksNavButtons}>
            <button
              type="button"
              className={styles.tracksNavBtn}
              onClick={() => setTracksPage(p => Math.max(1, p - 1))}
              disabled={tracksPage === 1}
              aria-label={t("techBuzzPrevTracks")}
              title={t("techBuzzPrevTracks")}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <div className={styles.tracksPageNumbers}>
              {Array.from({ length: totalTracksPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  type="button"
                  className={styles.tracksPageNumBtn}
                  aria-current={tracksPage === num ? "page" : undefined}
                  onClick={() => setTracksPage(num)}
                  aria-label={`${t("techBuzzTracksPage")} ${num}`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.tracksNavBtn}
              onClick={() => setTracksPage(p => Math.min(totalTracksPages, p + 1))}
              disabled={tracksPage === totalTracksPages}
              aria-label={t("techBuzzNextTracks")}
              title={t("techBuzzNextTracks")}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.techTracksGrid} role="region" aria-label="Learning tracks list">
        {currentTracks.map(track => {
          const logo = techLogo(track.techId);
          const isSelected = topic === track.techId;
          const count = cards.filter(c => c.techId === track.techId).length;
          return (
            <button
              key={track.id}
              type="button"
              className={styles.techTrackPill}
              aria-pressed={isSelected}
              onClick={() => selectTrack(track.techId)}
              title={`${track.label} — ${track.tagline}`}
            >
              {logo && <Image src={logo} alt="" width={22} height={22} className={styles.trackPillLogo} />}
              <span className={styles.trackPillLabel}>{track.label}</span>
              {track.badge && !isSelected && <span className={styles.trackPillBadge}>{track.badge}</span>}
              {count > 0 && <span className={styles.trackPillCount}>{count}</span>}
            </button>
          );
        })}
      </div>
    </section>

    {/* 3. Curated Learning Roadmaps */}
    {!filtered && (
      <section className={styles.roadmapsSection} aria-label="Curated technology learning roadmaps">
        <div className={styles.roadmapsHeader}>
          <div>
            <span className={styles.roadmapsKicker}><Compass size={14} aria-hidden="true" />{t("techBuzzRoadmapsKicker")}</span>
            <h2>{t("techBuzzRoadmapsTitle")}</h2>
          </div>
          <span className={styles.roadmapsSubtitle}>{t("techBuzzRoadmapsSubtitle")}</span>
        </div>

        <div className={styles.roadmapsGrid}>
          {LEARNING_ROADMAPS.map(roadmap => {
            const Icon = roadmap.icon;
            const isSelected = activeRoadmapId === roadmap.id;
            const count = cards.filter(c => c.techId && roadmap.techIds.includes(c.techId)).length;
            return (
              <div
                key={roadmap.id}
                className={styles.roadmapCard}
                data-selected={isSelected}
                onClick={() => selectRoadmap(roadmap.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { selectRoadmap(roadmap.id); e.preventDefault(); } }}
                aria-pressed={isSelected}
              >
                <div className={styles.roadmapCardTop}>
                  <span className={styles.roadmapBadge}>{roadmap.badge}</span>
                  <span className={styles.roadmapCount}>{count} masterclasses</span>
                </div>
                <div className={styles.roadmapTitleRow}>
                  <span className={styles.roadmapIcon}><Icon size={18} /></span>
                  <div>
                    <span className={styles.roadmapKickerText}>{roadmap.kicker}</span>
                    <h3>{roadmap.title}</h3>
                  </div>
                </div>
                <p className={styles.roadmapDescription}>{roadmap.description}</p>
                <div className={styles.roadmapSteps}>
                  {roadmap.steps.map((step, idx) => (
                    <span key={step} className={styles.roadmapStepChip}>
                      <span className={styles.stepNum}>{idx + 1}</span> {step}
                    </span>
                  ))}
                </div>
                <div className={styles.roadmapActionRow}>
                  <span>{isSelected ? "Active Path (Click to clear)" : "Explore Learning Path"}</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    )}

    {!saleEnded && <Link href="/subscribe" className={styles.sale}>
      <Sparkles size={16} aria-hidden="true" />
      <span><b>{sale.title}:</b> {sale.discountPercent}% off membership until {sale.validTill}. Read every story in full with interactive code & audio.</span>
      <ArrowRight size={16} aria-hidden="true" />
    </Link>}

    {/* 4. Feeds Pills */}
    <nav className={styles.feeds} aria-label="Story feeds">
      {FEEDS.map(item => {
        const Icon = item.icon;
        return <button key={item.id} type="button" aria-pressed={feed === item.id} onClick={() => resetTo(() => setFeed(item.id))}>
          <Icon size={15} aria-hidden="true" />{item.label}
          {item.id === "saved" && savedCount > 0 && <span className={styles.savedPillCount}>{savedCount}</span>}
        </button>;
      })}
    </nav>

    {/* 5. Main Content Grid Layout */}
    <div
      className={styles.layout}
      data-left-collapsed={leftCollapsed ? "true" : "false"}
      data-right-collapsed={rightCollapsed ? "true" : "false"}
    >
      {/* Left Sidebar: Categories & Topic Navigation with Collapse / Expand */}
      <aside
        className={`${styles.topics} ${leftCollapsed ? styles.railCollapsed : ""}`}
        data-collapsed={leftCollapsed ? "true" : "false"}
        aria-label="Topics and reading list"
      >
        {leftCollapsed ? (
          <div className={styles.railContent}>
            <button
              type="button"
              className={styles.railToggleBtn}
              onClick={() => setLeftCollapsed(false)}
              aria-label="Expand left sidebar"
              title="Expand left sidebar (Reading list & topics)"
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>

            {/* Your reading list icon with count badge */}
            <button
              type="button"
              className={`${styles.railItemBtn} ${feed === "saved" ? styles.railItemActive : ""}`}
              onClick={() => resetTo(() => { setTopic(null); setActiveRoadmapId(null); setFeed(feed === "saved" ? "for-you" : "saved"); })}
              aria-label={`Your reading list: ${savedCount} saved ${savedCount === 1 ? "story" : "stories"}`}
              title={`Your reading list (${savedCount} saved ${savedCount === 1 ? "story" : "stories"})`}
            >
              <BookmarkCheck size={18} aria-hidden="true" />
              {savedCount > 0 && <span className={styles.railBadge}>{savedCount}</span>}
            </button>

            <span className={styles.railDivider} aria-hidden="true" />

            {/* All technologies icon button */}
            <button
              type="button"
              className={`${styles.railItemBtn} ${!topic && !activeRoadmapId ? styles.railItemActive : ""}`}
              onClick={() => resetTo(() => { setTopic(null); setActiveRoadmapId(null); })}
              aria-label={`All technologies (${cards.length} stories)`}
              title={`All technologies (${cards.length} stories)`}
            >
              <Sparkles size={17} aria-hidden="true" />
            </button>

            {/* Category Icons Rail */}
            <div className={styles.railCategoriesList}>
              {groups.map(group => {
                const { icon: Icon, tone, ink } = styleOf(group.category);
                const isSelected = topic === group.category;
                return (
                  <button
                    key={group.category}
                    type="button"
                    className={`${styles.railItemBtn} ${isSelected ? styles.railItemActive : ""}`}
                    style={{ "--tone": tone, "--ink": ink } as CSSProperties}
                    onClick={() => resetTo(() => { setActiveRoadmapId(null); setTopic(topic === group.category ? null : group.category); })}
                    aria-label={`${group.category} (${group.count} stories)`}
                    title={`${group.category} (${group.count} stories)`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {group.count > 0 && <span className={styles.railCountDot}>{group.count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.railHeaderRow}>
              <span className={styles.railHeaderLabel}>Reading List & Topics</span>
              <button
                type="button"
                className={styles.railCollapseBtn}
                onClick={() => setLeftCollapsed(true)}
                aria-label="Collapse left sidebar"
                title="Collapse left sidebar"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
            </div>

            <button type="button" className={styles.readingCard} aria-pressed={feed === "saved"} onClick={() => resetTo(() => { setTopic(null); setActiveRoadmapId(null); setFeed(feed === "saved" ? "for-you" : "saved"); })}>
              <span className={styles.readingIcon} aria-hidden="true"><BookmarkCheck size={18} /></span>
              <span><b>Your reading list</b><small>{savedCount ? `${savedCount} saved ${savedCount === 1 ? "story" : "stories"}` : "Save stories to read later"}</small></span>
            </button>

            <h2><Hash size={15} aria-hidden="true" />Browse by technology</h2>
            <button type="button" className={styles.allTopics} aria-pressed={!topic && !activeRoadmapId} onClick={() => resetTo(() => { setTopic(null); setActiveRoadmapId(null); })}>
              <Sparkles size={15} aria-hidden="true" /><span>{t("techBuzzAllTechnologies")}</span><small>{cards.length}</small>
            </button>

            <div className={styles.groups}>
              {groups.map((group, index) => {
                const { icon: Icon, tone, ink } = styleOf(group.category);
                const isExpanded = isCategoryExpanded(group.category, index);

                return <section key={group.category} className={styles.group} data-expanded={isExpanded ? "true" : "false"} style={{ "--tone": tone, "--ink": ink } as CSSProperties}>
                  <div className={styles.groupHeaderRow}>
                    <button
                      type="button"
                      className={styles.groupHead}
                      aria-pressed={topic === group.category}
                      onClick={() => resetTo(() => { setActiveRoadmapId(null); setTopic(topic === group.category ? null : group.category); })}
                    >
                      <span className={styles.groupIcon} aria-hidden="true"><Icon size={16} /></span>
                      <span>{group.category}</span>
                      <small>{group.count}</small>
                    </button>
                    <button
                      type="button"
                      className={styles.groupAccordionToggle}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? `Collapse ${group.category}` : `Expand ${group.category}`}
                      title={isExpanded ? "Collapse" : "Expand"}
                      onClick={() => toggleCategoryAccordion(group.category, index)}
                    >
                      {isExpanded ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}
                    </button>
                  </div>
                  {isExpanded && group.topics.length > 0 && <ul>
                    {group.topics.map(item => <li key={item.id}>
                      <button
                        type="button"
                        aria-pressed={topic === item.id}
                        onClick={() => resetTo(() => { setActiveRoadmapId(null); setTopic(topic === item.id ? null : item.id); })}
                      >
                        {techLogo(item.id) ? <Image src={techLogo(item.id)!} alt="" width={18} height={18} /> : <span className={styles.dot} aria-hidden="true" />}
                        <span>{item.label}</span>
                        <small>{item.count}</small>
                      </button>
                    </li>)}
                  </ul>}
                </section>;
              })}
            </div>
          </>
        )}
      </aside>

      {/* Main Feed */}
      <main className={styles.feed} aria-label="Stories">
        {/* Active Filter Notification */}
        {(topic || activeRoadmap || query.trim()) && (
          <div className={styles.filterNote} role="status">
            <span>
              <b>{ranked.length}</b> {ranked.length === 1 ? "masterclass guide" : "masterclass guides"}
              {activeRoadmap ? ` in “${activeRoadmap.title}”` : topicLabel ? ` on ${topicLabel}` : ""}
              {query.trim() ? ` matching “${query.trim()}”` : ""}
            </span>
            <button type="button" onClick={() => resetTo(() => { setTopic(null); setActiveRoadmapId(null); setQuery(""); })}>
              {t("techBuzzResetFilters")}
            </button>
          </div>
        )}

        {/* Hero Featured Masterclass Card */}
        {hero && (
          <article className={styles.hero}>
            <div className={styles.heroBadgeRow}>
              <span className={styles.heroFeaturedPill}><Flame size={13} />Featured Masterclass</span>
              <span className={styles.heroEyebrow} style={{ color: hero.color }}>{hero.technology} · {hero.category}</span>
            </div>

            <Link href={`/tech-buzz/${hero.slug}`} className={styles.heroLink}>
              <Thumb card={hero} size="hero" />
              <div className={styles.heroBody}>
                <h2>{hero.title}</h2>
                <p className={styles.heroSubtitle}>{hero.subtitle}</p>

                {/* Key takeaways bullet preview */}
                {hero.summary.length > 0 && (
                  <ul className={styles.heroBullets}>
                    {hero.summary.map(bullet => (
                      <li key={bullet}>
                        <CheckCircle2 size={15} className={styles.bulletCheckIcon} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className={styles.heroFooter}>
                  <div className={styles.byline}>
                    <Image
                      src={hero.author.avatar}
                      alt=""
                      width={28}
                      height={28}
                      loader={loaderFor(hero.author.avatar)}
                      unoptimized={remote(hero.author.avatar)}
                      style={{ width: "auto", height: "auto" }}
                    />
                    <span>{hero.author.name}</span>
                    {hero.author.verified && <CheckCircle2 size={13} color="#059669" />}
                  </div>

                  <Meta card={hero} />

                  <span className={styles.heroCta}>
                    <span>{t("techBuzzReadDeepDive")}</span>
                    <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
            <SaveButton saved={!!saved[hero.id]} onToggle={() => toggleSaved(hero.id)} title={hero.title} />
          </article>
        )}

        {/* Explore By Category: Tabs format with pagination (5 tabs per page) */}
        {!filtered && spotlight.length > 0 && (
          <section className={styles.categorySection} aria-labelledby="explore-heading">
            <div className={styles.categorySectionHeader}>
              <div className={styles.categoryTitleGroup}>
                <h2 id="explore-heading" className={styles.categorySectionTitle}>
                  <Compass size={17} aria-hidden="true" />
                  Explore By Category
                </h2>
                <span className={styles.categorySectionSubtitle}>
                  Select a domain specialization tab to filter engineering guides
                </span>
              </div>

              {/* Category Pagination Controls */}
              <div className={styles.categoryPagination} role="navigation" aria-label="Explore categories pagination">
                <span className={styles.categoryPageText} aria-live="polite">
                  Showing {startCategoryIndex + 1}–{Math.min(endCategoryIndex, spotlight.length)} of {spotlight.length}
                </span>
                <div className={styles.categoryNavButtons}>
                  <button
                    type="button"
                    className={styles.categoryNavBtn}
                    onClick={() => setCategoriesPage(p => Math.max(1, p - 1))}
                    disabled={safeCategoriesPage === 1}
                    aria-label="Previous categories page"
                    title="Previous categories page"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <div className={styles.categoryPageNumbers}>
                    {Array.from({ length: totalCategoriesPages }, (_, i) => i + 1).map(num => (
                      <button
                        key={num}
                        type="button"
                        className={styles.categoryPageNumBtn}
                        aria-current={safeCategoriesPage === num ? "page" : undefined}
                        onClick={() => setCategoriesPage(num)}
                        aria-label={`Categories Page ${num}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.categoryNavBtn}
                    onClick={() => setCategoriesPage(p => Math.min(totalCategoriesPages, p + 1))}
                    disabled={safeCategoriesPage === totalCategoriesPages}
                    aria-label="Next categories page"
                    title="Next categories page"
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Tabs: 3 tabs per page when both sidebars are expanded, 5 tabs per page otherwise */}
            <div
              className={styles.categoryTabsList}
              data-cols={bothSidebarsExpanded ? "3" : "5"}
              role="tablist"
              aria-label="Explore by category tabs"
            >
              {currentCategories.map(group => {
                const { icon: Icon, tone, ink } = styleOf(group.category);
                const isSelected = topic === group.category;
                return (
                  <button
                    key={group.category}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`${styles.categoryTabBtn} ${isSelected ? styles.categoryTabActive : ""}`}
                    style={{ "--tone": tone, "--ink": ink } as CSSProperties}
                    onClick={() => selectCategory(group.category)}
                    title={`Explore ${group.category} (${group.count} ${group.count === 1 ? "story" : "stories"})`}
                  >
                    {group.cover && (
                      <div className={styles.categoryTabCover}>
                        <Image
                          src={group.cover.coverImage}
                          alt={group.category}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1140px) 50vw, 320px"
                          loader={loaderFor(group.cover.coverImage)}
                          unoptimized={remote(group.cover.coverImage)}
                          className={styles.categoryTabImage}
                        />
                      </div>
                    )}
                    <div className={styles.categoryTabMeta}>
                      <span className={styles.categoryTabIconWrap} aria-hidden="true">
                        <Icon size={16} />
                      </span>
                      <div className={styles.categoryTabDetails}>
                        <span className={styles.categoryTabLabel}>{group.category}</span>
                        <span className={styles.categoryTabBadge}>
                          {group.count} {group.count === 1 ? "story" : "stories"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Stories List / Grid */}
        {visible.length === 0 ? (
          <div className={styles.empty}>
            <Bookmark size={28} aria-hidden="true" />
            <p>{feed === "saved" ? "Your reading list is empty. Tap the bookmark on any story to save it here." : "No technology stories match yet. Try another technology, roadmap, or search term."}</p>
          </div>
        ) : (
          <ol className={styles.stories} data-view={view}>
            {visible.map((card, index) => (
              <li key={card.id} style={{ "--i": index % PAGE } as CSSProperties}>
                <article className={styles.story}>
                  <Link href={`/tech-buzz/${card.slug}`} className={styles.storyLink}>
                    <Thumb card={card} size={view === "grid" ? "grid" : "list"} />
                    <span className={styles.storyText}>
                      <div className={styles.storyHeader}>
                        <span className={styles.byline}>
                          <Image
                            src={card.author.avatar}
                            alt=""
                            width={22}
                            height={22}
                            loader={loaderFor(card.author.avatar)}
                            unoptimized={remote(card.author.avatar)}
                            style={{ width: "auto", height: "auto" }}
                          />
                          <span>{card.author.name}</span>
                        </span>
                        <span className={styles.eyebrow} style={{ color: card.color }}>{card.technology}</span>
                      </div>

                      <h3>{card.title}</h3>
                      <p>{card.subtitle}</p>

                      <span className={styles.tags}>
                        {card.tags.slice(0, 3).map(tag => (
                          <span key={tag} style={{ "--tone": toneOf(tag) } as CSSProperties}>
                            #{tag.toLowerCase().replace(/[^a-z0-9.+]+/g, "")}
                          </span>
                        ))}
                      </span>

                      <Meta card={card} />
                    </span>
                  </Link>
                  <SaveButton saved={!!saved[card.id]} onToggle={() => toggleSaved(card.id)} title={card.title} />
                </article>
              </li>
            ))}
          </ol>
        )}

        {stories.length > shown && (
          <button type="button" className={styles.more} onClick={() => setShown(count => count + PAGE)}>
            Show more technology masterclasses <small>{stories.length - shown} left</small>
          </button>
        )}
      </main>

      {/* Right Sidebar: Highlights & Top Rated with Collapse / Expand */}
      <aside
        className={`${styles.sidebar} ${rightCollapsed ? styles.railCollapsed : ""}`}
        data-collapsed={rightCollapsed ? "true" : "false"}
        aria-label="Highlights and top rated"
      >
        {rightCollapsed ? (
          <div className={styles.railContent}>
            <button
              type="button"
              className={styles.railToggleBtn}
              onClick={() => setRightCollapsed(false)}
              aria-label="Expand highlights sidebar"
              title="Expand highlights and top rated masterclasses"
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>

            {/* Top rated masterclasses icon */}
            <button
              type="button"
              className={styles.railItemBtn}
              onClick={() => setRightCollapsed(false)}
              aria-label="Top rated masterclasses"
              title="Top rated masterclasses (Click to expand)"
            >
              <Trophy size={18} aria-hidden="true" />
            </button>

            {/* Quick avatar links to top rated stories */}
            <div className={styles.railTopRatedPicks}>
              {staffPicks.map(card => (
                <Link
                  key={card.id}
                  href={`/tech-buzz/${card.slug}`}
                  className={styles.railAvatarLink}
                  aria-label={`${card.title} by ${card.author.name}`}
                  title={`★ ${card.rating.average} · ${card.title} (${card.author.name})`}
                >
                  <Image
                    src={card.author.avatar}
                    alt=""
                    width={24}
                    height={24}
                    loader={loaderFor(card.author.avatar)}
                    unoptimized={remote(card.author.avatar)}
                    style={{ width: "auto", height: "auto" }}
                  />
                </Link>
              ))}
            </div>

            <span className={styles.railDivider} aria-hidden="true" />

            {/* Trending icon button */}
            <button
              type="button"
              className={styles.railItemBtn}
              onClick={() => setRightCollapsed(false)}
              aria-label="Trending technologies"
              title="Trending technologies (Click to expand)"
            >
              <TrendingUp size={18} aria-hidden="true" />
            </button>

            {/* Hands-on practice icon button */}
            <button
              type="button"
              className={styles.railItemBtn}
              onClick={() => setRightCollapsed(false)}
              aria-label="Hands-on practice milestones"
              title="Hands-on practice (Click to expand)"
            >
              <Rocket size={18} aria-hidden="true" />
            </button>

            <span className={styles.railDivider} aria-hidden="true" />

            {/* Pro Membership icon button */}
            <Link
              href="/subscribe"
              className={`${styles.railItemBtn} ${styles.railProBtn}`}
              aria-label="Pro Membership"
              title="Pro Membership: Unlock full blueprints & code"
            >
              <Sparkles size={17} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.railHeaderRow}>
              <span className={styles.railHeaderLabel}>Top Rated & Highlights</span>
              <button
                type="button"
                className={styles.railCollapseBtn}
                onClick={() => setRightCollapsed(true)}
                aria-label="Collapse right sidebar"
                title="Collapse right sidebar"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>

            {staffPicks.length > 0 && (
              <section>
                <h2><Trophy size={16} aria-hidden="true" />Top rated masterclasses</h2>
                <ol className={styles.picks}>
                  {staffPicks.map(card => (
                    <li key={card.id}>
                      <Link href={`/tech-buzz/${card.slug}`}>
                        <span className={styles.byline}>
                          <Image src={card.author.avatar} alt="" width={18} height={18} loader={loaderFor(card.author.avatar)} unoptimized={remote(card.author.avatar)} style={{ width: "auto", height: "auto" }} />
                          {card.author.name}
                        </span>
                        <b>{card.title}</b>
                        <Stars rating={card.rating} />
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section>
              <h2><TrendingUp size={16} aria-hidden="true" />Trending technologies</h2>
              <ol className={styles.trending}>
                {trending.map((card, index) => (
                  <li key={card.id}>
                    <Link href={`/tech-buzz/${card.slug}`}>
                      <span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span>
                      <span>
                        <b>{card.title}</b>
                        <small>{card.technology} · {card.readTimeMinutes} min{card.likes ? ` · ▲ ${compact(card.likes)}` : ""}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            {milestones.length > 0 && (
              <section>
                <h2><Rocket size={16} aria-hidden="true" />Hands-on practice</h2>
                <ul className={styles.milestones}>
                  {milestones.map(card => (
                    <li key={card.id}>
                      <Link href={`/tech-buzz/${card.slug}`}>
                        <small>{card.milestone!.label}</small>
                        <b>{card.milestone!.value}</b>
                        <span>{card.technology}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className={styles.memberCard}>
              <div className={styles.memberCardHeader}>
                <Sparkles size={18} className={styles.memberCardSparkle} />
                <h2>Pro Membership</h2>
              </div>
              <p>
                Unlock all full-length articles, executable code samples, interactive speech voiceovers, and community discussion for every modern technology.
              </p>
              <ul className={styles.memberCardBullets}>
                <li>Complete code repositories & blueprints</li>
                <li>Interactive audio voiceovers</li>
                <li>Learning dashboard quiz & handbook access</li>
              </ul>
              <Link href="/subscribe">
                Explore Pro Plans <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </section>
          </>
        )}
      </aside>
    </div>
  </div>;
}
