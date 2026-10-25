"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock, Coffee, Search, X } from "lucide-react";
import type { BlogPost } from "@/lib/coffee-and-code";
import { contentKey } from "@/lib/content-overrides";
import { Editable, useContentEditing, useContentItem } from "./content-editing";
import { BlogCover, CoffeeArticle } from "./coffee-article";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { AUTOPLAY_MS, Controls, Dots } from "./landing-ai-pulse";
import styles from "./coffee-and-code.module.css";

export const blogKey = (post: BlogPost) => contentKey("blog", post.slug);
/** Articles per page: two rows of the three-column grid. */
const PAGE_SIZE = 6;
export const blogDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * Coffee & Code in the Learning Dashboard: short engineering articles as cards, each in its own light colour, with
 * search and topic filters, six to a page with the same paging as the dashboard's AI & agentic pulse (play/pause,
 * previous, counter and next at the top, dots below). Read article opens the full article in a modal. The Super Admin can edit a card's text or remove a post
 * for everyone (content overrides, migration 0032).
 */
export function CoffeeAndCode({ posts, topics }: Readonly<{ posts: BlogPost[]; topics: string[] }>) {
  const { overrides, editing } = useContentEditing();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [held, setHeld] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter(post => {
      if (!editing && overrides[blogKey(post)]?.deleted) return false;
      if (topic !== "All" && post.topic !== topic) return false;
      const haystack = [overrides[blogKey(post)]?.fields.title ?? post.title, overrides[blogKey(post)]?.fields.dek ?? post.dek, post.topic, ...post.tags].join(" ").toLowerCase();
      return words.every(word => haystack.includes(word));
    });
  }, [posts, query, topic, overrides, editing]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = shown.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const goTo = (next: number) => { setPage((next + pages) % pages); list.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
  const running = playing && !held && pages > 1;
  // Autoplay turns the page while it runs; hovering or focusing inside the grid holds it (WCAG 2.2.2).
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setPage(current + 1 >= pages ? 0 : current + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [running, current, pages]);
  const text = (en: string) => en;
  const open = posts.find(post => post.slug === reading) ?? null;
  // "Keep reading" in the modal: same topic first, then the newest others, never a removed one.
  const related = open ? [...posts.filter(p => p.slug !== open.slug && p.topic === open.topic), ...posts.filter(p => p.slug !== open.slug && p.topic !== open.topic)]
    .filter(p => !overrides[blogKey(p)]?.deleted).slice(0, 2) : [];

  return <section className={styles.page} aria-labelledby="coffee-title">
    <header className={styles.hero}>
      <span className={styles.mark} aria-hidden="true"><Coffee size={22} /></span>
      <div>
        <h1 id="coffee-title">Coffee & Code</h1>
        <p>Short, practical articles you can finish over a coffee: one idea, real code, and the questions interviewers ask about it.</p>
      </div>
    </header>
    <div className={styles.filters}>
      <label className={styles.search}>
        <Search size={16} aria-hidden="true" />
        <span className={styles.srOnly}>Search articles</span>
        <input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Search articles, topics or tags" />
      </label>
      <div className={styles.topics} role="group" aria-label="Filter by topic">
        {["All", ...topics].map(name => <button key={name} type="button" aria-pressed={topic === name} onClick={() => { setTopic(name); setPage(0); }}>{name}</button>)}
      </div>
    </div>
    <div ref={list} className={styles.countRow}>
      <p className={styles.count} aria-live="polite">{shown.length} article{shown.length === 1 ? "" : "s"}{topic !== "All" ? ` in ${topic}` : ""}</p>
      {pages > 1 && <Controls text={text} playing={playing} onPlay={() => setPlaying(value => !value)} page={current} pages={pages} goTo={goTo} previous="Previous articles" next="Next articles" />}
    </div>
    {shown.length
      ? <><ul className={styles.grid} aria-label={`Articles, page ${current + 1} of ${pages}`} onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHeld(false); }}>{visible.map(post => <BlogCard key={post.slug} post={post} onRead={() => setReading(post.slug)} />)}</ul>
        {pages > 1 && <div className={styles.pager}><Dots pages={pages} page={current} running={running} goTo={goTo} label={n => `Show articles page ${n}`} /></div>}</>
      : <div className={styles.empty}><p>No articles match “{query}”.</p><button type="button" onClick={() => { setQuery(""); setTopic("All"); setPage(0); }}>Show all articles</button></div>}
    <Dialog open={!!open} onOpenChange={value => { if (!value) setReading(null); }}>
      <DialogContent className={styles.reader} showCloseButton={false}>
        <div className={styles.readerBar}>
          <DialogTitle render={<p />}>{open ? `${open.topic} · ${open.minutes} min read` : ""}</DialogTitle>
          {open && <Link href={`/learning/coffee-and-code/${open.slug}`} prefetch={false}>Open as a page</Link>}
          <button type="button" aria-label="Close article" onClick={() => setReading(null)}><X size={18} /></button>
        </div>
        {/* key: a "Keep reading" choice starts the next article from its top. */}
        {open && <div key={open.slug} className={styles.readerBody}><CoffeeArticle post={open} related={related} onOpen={setReading} /></div>}
      </DialogContent>
    </Dialog>
  </section>;
}

function BlogCard({ post, onRead }: Readonly<{ post: BlogPost; onRead: () => void }>) {
  const k = blogKey(post);
  const item = useContentItem(k, "article");
  const { editing } = useContentEditing();
  return <li className={styles.card} data-tone={post.tone} {...item.props}>
    {item.toolbar}
    <BlogCover post={post} className={styles.cardCover} />
    <div className={styles.cardBody}>
      <p className={styles.topic}>{post.topic}</p>
      <h2><Editable k={k} f="title">{post.title}</Editable></h2>
      <p className={styles.dek}><Editable k={k} f="dek" multiline>{post.dek}</Editable></p>
      <ul className={styles.tags} aria-label="Tags">{post.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
      <div className={styles.cardFoot}>
        <span><Clock size={13} aria-hidden="true" />{post.minutes} min read</span>
        <time dateTime={post.published}>{blogDate(post.published)}</time>
      </div>
      {/* In edit mode the card text is edited in place, so the whole-card link would get in the way. */}
      <button type="button" className={styles.read} onClick={onRead} data-editing={editing} aria-haspopup="dialog">
        Read article<ArrowUpRight size={15} aria-hidden="true" />
      </button>
    </div>
  </li>;
}
