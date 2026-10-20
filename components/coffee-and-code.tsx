"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock, Coffee, Search } from "lucide-react";
import type { BlogPost } from "@/lib/coffee-and-code";
import { contentKey } from "@/lib/content-overrides";
import { Editable, useContentEditing, useContentItem } from "./content-editing";
import { BlogCover } from "./coffee-article";
import styles from "./coffee-and-code.module.css";

export const blogKey = (post: BlogPost) => contentKey("blog", post.slug);
export const blogDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * Coffee & Code in the Learning Dashboard: short engineering articles as cards, each in its own light colour, with
 * search and topic filters. A card opens the full article. The Super Admin can edit a card's text or remove a post
 * for everyone (content overrides, migration 0032).
 */
export function CoffeeAndCode({ posts, topics }: Readonly<{ posts: BlogPost[]; topics: string[] }>) {
  const { overrides, editing } = useContentEditing();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const shown = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter(post => {
      if (!editing && overrides[blogKey(post)]?.deleted) return false;
      if (topic !== "All" && post.topic !== topic) return false;
      const haystack = [overrides[blogKey(post)]?.fields.title ?? post.title, overrides[blogKey(post)]?.fields.dek ?? post.dek, post.topic, ...post.tags].join(" ").toLowerCase();
      return words.every(word => haystack.includes(word));
    });
  }, [posts, query, topic, overrides, editing]);

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
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search articles, topics or tags" />
      </label>
      <div className={styles.topics} role="group" aria-label="Filter by topic">
        {["All", ...topics].map(name => <button key={name} type="button" aria-pressed={topic === name} onClick={() => setTopic(name)}>{name}</button>)}
      </div>
    </div>
    <p className={styles.count} aria-live="polite">{shown.length} article{shown.length === 1 ? "" : "s"}{topic !== "All" ? ` in ${topic}` : ""}</p>
    {shown.length
      ? <ul className={styles.grid}>{shown.map(post => <BlogCard key={post.slug} post={post} />)}</ul>
      : <div className={styles.empty}><p>No articles match “{query}”.</p><button type="button" onClick={() => { setQuery(""); setTopic("All"); }}>Show all articles</button></div>}
  </section>;
}

function BlogCard({ post }: Readonly<{ post: BlogPost }>) {
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
      <Link className={styles.read} href={`/dashboard/coffee-and-code/${post.slug}`} prefetch={false} data-editing={editing}>
        Read article<ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </div>
  </li>;
}
