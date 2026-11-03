"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";
import Link from "@/components/site-link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bookmark, Flame, GraduationCap, Menu, PenLine, Search, X } from "lucide-react";
import { Wordmark } from "@/components/brand-mark";
import { writeStoredValue } from "@/lib/local-store";
import { PUBLIC_PAGES } from "@/lib/seo";
import { RAIL_KEY } from "@/lib/tech-buzz-outline";
import { searchStories, type TechBuzzSearchStory } from "@/lib/tech-buzz-search";
import { onFeedPage, openFeedView, replaceFeedParams, subscribeUrl, urlParam } from "@/lib/tech-buzz-url";
import { TechBuzzSideNav } from "./tech-buzz-side-nav";
import styles from "./tech-buzz-header.module.css";

/*
 * The header on every /tech-buzz page: menu, brand, story search, writing and the reader's account. The search lists
 * matching stories under the box as the reader types, on every page, and filters the feed behind it when the feed is
 * open; Enter shows every match on the feed. The menu button folds the rail beside an open story
 * on wide screens and opens the drawer otherwise. Whether anyone is signed in comes from the session cookie after
 * hydration, so the header stays prerendered.
 */
const NAV = PUBLIC_PAGES.filter(page => ["/courses", "/library", "/about", "/contact"].includes(page.path));
const never = () => () => {};
const hasSession = () => /(?:^|;\s*)sb-[^=]+-auth-token/.test(document.cookie);
const readQuery = () => urlParam("q") ?? "";
/** Results listed under the box; the last row opens all of them on the feed. */
const LIVE_RESULTS = 6;

export function TechBuzzHeader() {
  const router = useRouter();
  const signedIn = useSyncExternalStore(never, hasSession, () => false);
  const urlQuery = useSyncExternalStore(subscribeUrl, readQuery, () => "");
  const [draft, setDraft] = useState("");
  const [seenQuery, setSeenQuery] = useState("");
  if (urlQuery !== seenQuery) { setSeenQuery(urlQuery); setDraft(urlQuery); }
  const [searchOpen, setSearchOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stories, setStories] = useState<TechBuzzSearchStory[] | null>(null);
  const [indexFailed, setIndexFailed] = useState(false);
  const indexRequested = useRef(false);
  const [listOpen, setListOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const deferredDraft = useDeferredValue(draft);
  const matches = useMemo(() => (stories ? searchStories(stories, deferredDraft) : []), [stories, deferredDraft]);
  const results = matches.slice(0, LIVE_RESULTS);
  const showList = listOpen && draft.trim() !== "";

  useEffect(() => { if (searchOpen) input.current?.focus(); }, [searchOpen]);

  /** The stories load the first time the box is used, so the header stays light for readers who never search. */
  const loadStories = () => {
    if (indexRequested.current) return;
    indexRequested.current = true;
    setIndexFailed(false);
    fetch("/api/tech-buzz/search-index")
      .then(response => response.ok ? response.json() as Promise<{ stories: TechBuzzSearchStory[] }> : Promise.reject(new Error("search index")))
      .then(body => setStories(body.stories), () => { indexRequested.current = false; setIndexFailed(true); });
  };

  const closeDrawer = () => drawer.current?.close();
  const pressMenu = () => {
    const rail = document.querySelector("[data-tb-rail]");
    if (rail && window.matchMedia("(min-width: 1100px)").matches) {
      writeStoredValue(RAIL_KEY, rail.getAttribute("data-tb-rail") === "off" ? "on" : "off");
      return;
    }
    setDrawerOpen(true);
    drawer.current?.showModal();
  };
  // A press on the dimmed area outside the panel lands on the dialog itself.
  const pressDrawer = (event: MouseEvent) => { if (event.target === drawer.current) closeDrawer(); };

  const type = (value: string) => {
    setDraft(value);
    setListOpen(true);
    setHighlighted(-1);
    loadStories();
    if (onFeedPage()) replaceFeedParams({ q: value || null });
  };
  /** Every match on the feed. The feed drops its curated sections while searching, so its results are at the top. */
  const showAll = () => {
    const query = draft.trim();
    if (onFeedPage()) { replaceFeedParams({ q: query || null }); window.scrollTo({ top: 0 }); }
    else router.push(query ? `/tech-buzz?q=${encodeURIComponent(query)}` : "/tech-buzz");
    setListOpen(false);
    setSearchOpen(false);
  };
  const openStory = (story: TechBuzzSearchStory) => {
    setListOpen(false);
    setSearchOpen(false);
    if (onFeedPage()) replaceFeedParams({ q: null });
    setDraft("");
    router.push(`/tech-buzz/${story.slug}`);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const story = showList ? results[highlighted] : undefined;
    if (story) openStory(story); else showAll();
  };
  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { setListOpen(false); return; }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    setListOpen(true);
    // Positions: each result, then "all results". -1 is the box itself.
    const positions = results.length + 2;
    setHighlighted(current => ((current + 1 + (event.key === "ArrowDown" ? 1 : -1) + positions) % positions) - 1);
  };

  return <>
    <header className={styles.header} data-search={searchOpen || undefined}>
      <button type="button" className={styles.iconButton} onClick={pressMenu} aria-label="Open the Tech Buzz menu" title="Menu"><Menu size={20} aria-hidden="true" /></button>
      <Link href="/" prefetch={false} aria-label="MasterClass Buddy home" className={styles.brand}><Wordmark /></Link>
      <Link href="/tech-buzz" className={styles.buzz} aria-label="Tech Buzz: 5 fresh blogs every Monday at 00:00 AM IST" title="5 fresh blogs every Monday"><Flame size={15} aria-hidden="true" /><span>Tech Buzz</span></Link>

      <form role="search" className={styles.search} onSubmit={submit}>
        <Search size={16} aria-hidden="true" />
        <label htmlFor="tb-search" className={styles.srOnly}>Search stories</label>
        <input ref={input} id="tb-search" type="search" role="combobox" aria-expanded={showList} aria-controls="tb-search-results" aria-autocomplete="list" aria-activedescendant={showList && highlighted >= 0 ? `tb-search-option-${highlighted}` : undefined} value={draft} placeholder="Search stories" autoComplete="off"
          onChange={event => type(event.target.value)} onFocus={() => { loadStories(); setListOpen(true); }} onBlur={() => setListOpen(false)} onKeyDown={onSearchKey} />
        <button type="button" className={styles.searchClose} onClick={() => { type(""); setSearchOpen(false); }} aria-label="Close search"><X size={18} aria-hidden="true" /></button>
        {showList && <div className={styles.results}>
          <ul id="tb-search-results" role="listbox" aria-label="Matching stories">
            {results.map((story, at) => <li key={story.slug} id={`tb-search-option-${at}`} role="option" aria-selected={highlighted === at}>
              {/* Keeps focus in the box, whose blur would close this list before the click lands. */}
              <button type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => openStory(story)}>
                <b>{story.title}</b><small>{story.technology} · {story.minutes} min read</small>
              </button>
            </li>)}
            {matches.length > 0 && <li id={`tb-search-option-${results.length}`} role="option" aria-selected={highlighted === results.length} className={styles.resultsAll}>
              <button type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={showAll}>See all {matches.length} {matches.length === 1 ? "story" : "stories"} for &ldquo;{draft.trim()}&rdquo;<ArrowRight size={14} aria-hidden="true" /></button>
            </li>}
          </ul>
          {!matches.length && <p className={styles.resultsNote} role="status">{indexFailed ? "Search could not load. Press Enter to search the feed." : stories ? <>No story matches &ldquo;{draft.trim()}&rdquo;. Try a technology, such as React or Docker.</> : "Searching stories…"}</p>}
        </div>}
      </form>

      <div className={styles.actions}>
        <button type="button" className={`${styles.iconButton} ${styles.searchOpen}`} onClick={() => setSearchOpen(true)} aria-label="Search stories"><Search size={19} aria-hidden="true" /></button>
        <Link href="/tech-buzz/write" prefetch={false} className={styles.write} aria-label="Slate - Ink: write a story" title="Write a story"><PenLine size={16} aria-hidden="true" /><span>Slate - Ink</span></Link>
        <Link href="/tech-buzz?feed=saved" className={`${styles.iconButton} ${styles.saved}`} aria-label="Your reading list" title="Your reading list" onClick={event => { if (openFeedView("/tech-buzz?feed=saved")) event.preventDefault(); }}><Bookmark size={18} aria-hidden="true" /></Link>
        {signedIn
          ? <Link href="/learning" prefetch={false} className={styles.primary}><GraduationCap size={16} aria-hidden="true" /><span>My learning</span></Link>
          : <>
            <Link href="/sign-in" prefetch={false} className={styles.signIn}>Sign in</Link>
            <Link href="/sign-up" prefetch={false} className={styles.primary}><span>Start learning</span><ArrowRight size={15} aria-hidden="true" /></Link>
          </>}
      </div>
    </header>

    <dialog ref={drawer} className={styles.drawer} aria-label="Tech Buzz menu" onClick={pressDrawer} onClose={() => setDrawerOpen(false)}>
      {drawerOpen && <div className={styles.drawerPanel}>
        <div className={styles.drawerHead}>
          <Link href="/" prefetch={false} aria-label="MasterClass Buddy home" className={styles.drawerBrand} onClick={closeDrawer}><Wordmark /></Link>
          <button type="button" className={styles.iconButton} onClick={closeDrawer} aria-label="Close the menu"><X size={20} aria-hidden="true" /></button>
        </div>
        <TechBuzzSideNav onNavigate={closeDrawer} />
        <nav className={styles.drawerLinks} aria-label="More from MasterClass Buddy">
          {NAV.map(page => <Link key={page.path} href={page.path} onClick={closeDrawer}>{page.label}</Link>)}
          {!signedIn && <Link href="/sign-in" prefetch={false} onClick={closeDrawer}>Sign in</Link>}
        </nav>
        <div className={styles.drawerFoot}><small>5 fresh blogs every Monday</small></div>
      </div>}
    </dialog>
  </>;
}
