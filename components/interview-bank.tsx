"use client";
import { RouteH1 } from "@/components/route-heading";
import { Pager } from "@/components/pager";
import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Flame, Hash, Layers, MessagesSquare, RotateCcw, Search, SlidersHorizontal, Tag, X } from "lucide-react";
import styles from "./interview-bank.module.css";

/*
 * The Learning Dashboard's Interview page: one tab per technology (four tabs per page of tabs), questions with
 * answers in an accordion with their own pager, a search box with live suggestions (technologies, topics and
 * questions), and a filter panel (frequency, topic, sort, answers open). The bank (lib/interview-digest-bank.json, built
 * from the Tech Daily Digest PDF by scripts/build-interview-bank.mjs) is a separate chunk, loaded after the shell.
 */
type Level = "high" | "medium";
type Item = { id: string; q: string; a: string; topic: string; level: Level; askedAt?: string };
type Tech = { id: string; name: string; code: string; items: Item[] };
type Sort = "default" | "frequent";
type Suggestion = { kind: "tech" | "topic" | "question"; label: string; hint: string; tech: Tech; topic?: string; item?: Item };

const TABS_PER_PAGE = 4;
const PER_PAGE = 8;
const LEVELS: { id: Level; label: string }[] = [{ id: "high", label: "Frequently asked" }, { id: "medium", label: "Commonly asked" }];

const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);
function Mark({ text, terms }: { text: string; terms: string[] }): ReactNode {
  if (!terms.length) return text;
  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(pattern).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part);
}

export function InterviewBank() {
  const [bank, setBank] = useState<Tech[] | null>(null);
  const [techId, setTechId] = useState("");
  const [tabPage, setTabPage] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level | "all">("all");
  const [topic, setTopic] = useState("");
  const [sort, setSort] = useState<Sort>("default");
  const [openAll, setOpenAll] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputId = useId(); const listId = useId(); const filterId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const deferred = useDeferredValue(query);

  useEffect(() => {
    let live = true;
    import("@/lib/interview-digest-bank.json").then(module => {
      if (!live) return;
      const data = (module.default ?? module) as unknown as Tech[];
      setBank(data);
      const wanted = new URLSearchParams(window.location.search).get("tech");
      const start = data.find(t => t.id === wanted) ?? data[0];
      setTechId(start.id); setTabPage(Math.floor(data.indexOf(start) / TABS_PER_PAGE));
    });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (!filtersOpen) return;
    const away = (event: PointerEvent) => { if (!filterRef.current?.contains(event.target as Node)) setFiltersOpen(false); };
    const esc = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setFiltersOpen(false); };
    document.addEventListener("pointerdown", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [filtersOpen]);

  const terms = useMemo(() => words(deferred), [deferred]);
  const total = useMemo(() => bank?.reduce((sum, t) => sum + t.items.length, 0) ?? 0, [bank]);
  const highTotal = useMemo(() => bank?.reduce((sum, t) => sum + t.items.filter(i => i.level === "high").length, 0) ?? 0, [bank]);

  const matches = useCallback((item: Item, tech: Tech) => {
    if (level !== "all" && item.level !== level) return false;
    if (topic && item.topic !== topic) return false;
    if (!terms.length) return true;
    const hay = `${item.q} ${item.a} ${item.topic} ${tech.name}`.toLowerCase();
    return terms.every(term => hay.includes(term));
  }, [level, topic, terms]);
  // A topic belongs to one technology, so it only narrows that technology's list.
  const counts = useMemo(() => new Map((bank ?? []).map(t => [t.id, t.items.filter(i => matches(i, t)).length])), [bank, matches]);
  const filtering = level !== "all" || !!topic || terms.length > 0;
  // While anything narrows the list, tabs with nothing left are hidden rather than greyed out.
  const tabs = useMemo(() => (bank ?? []).filter(t => !filtering || counts.get(t.id)), [bank, filtering, counts]);
  const tabPages = Math.max(1, Math.ceil(tabs.length / TABS_PER_PAGE));
  const safeTabPage = Math.min(tabPage, tabPages - 1);
  const shownTabs = tabs.slice(safeTabPage * TABS_PER_PAGE, (safeTabPage + 1) * TABS_PER_PAGE);
  const tech = shownTabs.find(t => t.id === techId) ?? shownTabs[0] ?? null;

  const matched = tech ? tech.items.filter(i => matches(i, tech)) : [];
  const rows = sort === "frequent" ? matched.toSorted((a, b) => Number(b.level === "high") - Number(a.level === "high")) : matched;
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const visible = rows.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);
  const topics = tech ? [...new Set(tech.items.map(i => i.topic))].toSorted() : [];

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase(); if (!bank || !q) return [];
    const t = words(q);
    const techOnes: Suggestion[] = bank.filter(x => t.every(w => x.name.toLowerCase().includes(w))).slice(0, 3)
      .map(x => ({ kind: "tech", label: x.name, hint: `${x.items.length} questions`, tech: x }));
    const topicOnes: Suggestion[] = []; const seen = new Set<string>();
    for (const x of bank) for (const i of x.items) {
      if (topicOnes.length < 3 && !seen.has(x.id + i.topic) && t.every(w => i.topic.toLowerCase().includes(w))) { seen.add(x.id + i.topic); topicOnes.push({ kind: "topic", label: i.topic, hint: x.name, tech: x, topic: i.topic }); }
    }
    const qs: Suggestion[] = [];
    outer: for (const x of bank) for (const i of x.items) if (t.every(w => i.q.toLowerCase().includes(w))) { qs.push({ kind: "question", label: i.q, hint: x.name, tech: x, item: i }); if (qs.length >= 40) break outer; }
    qs.sort((a, b) => Number(b.item!.level === "high") - Number(a.item!.level === "high") || a.label.length - b.label.length);
    return [...techOnes, ...topicOnes, ...qs.slice(0, 5)];
  }, [bank, query]);

  const pickTech = (id: string, scroll = false) => {
    setTechId(id); setPage(0); setOpen(new Set());
    const url = new URL(window.location.href); url.searchParams.set("tech", id); window.history.replaceState(window.history.state, "", url);
    if (scroll) requestAnimationFrame(() => document.getElementById("interview-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const goTabPage = (next: number) => {
    const clamped = Math.max(0, Math.min(tabPages - 1, next)); setTabPage(clamped);
    const first = tabs[clamped * TABS_PER_PAGE]; if (first) { setTopic(""); pickTech(first.id); }
  };
  const choose = (s: Suggestion) => {
    setSuggestOpen(false); setActive(-1); setLevel("all");
    // Reveal the technology's tab: with no search left it sits at its place among all 21.
    const all = bank ?? [];
    setTabPage(Math.floor(all.indexOf(s.tech) / TABS_PER_PAGE));
    if (s.kind === "tech") { setQuery(""); setTopic(""); pickTech(s.tech.id, true); }
    else if (s.kind === "topic") { setQuery(""); setTopic(s.topic!); pickTech(s.tech.id, true); }
    else {
      setQuery(s.item!.q); setTopic(""); pickTech(s.tech.id, true); setOpen(new Set([s.item!.id]));
    }
  };
  const clear = () => { setQuery(""); setSuggestOpen(false); setActive(-1); inputRef.current?.focus(); };
  const resetFilters = () => { setLevel("all"); setTopic(""); setSort("default"); setOpenAll(false); setPage(0); };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setSuggestOpen(true); setActive(a => (a + 1) % suggestions.length); }
    else if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setActive(a => (a <= 0 ? suggestions.length : a) - 1); }
    else if (event.key === "Enter" && suggestOpen && active >= 0 && suggestions[active]) { event.preventDefault(); choose(suggestions[active]); }
    else if (event.key === "Escape") { if (suggestOpen) setSuggestOpen(false); else if (query) clear(); }
  };
  const toggle = (id: string) => setOpen(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const activeFilters = (level !== "all" ? 1 : 0) + (topic ? 1 : 0) + (sort !== "default" ? 1 : 0) + (openAll ? 1 : 0);
  const showSuggest = suggestOpen && suggestions.length > 0;

  return <div className={styles.page}>
    <header className={styles.hero}>
      <div className={styles.heroText}>
        <p className={styles.eyebrow}><MessagesSquare size={14} aria-hidden="true" />Professional Learn · Interview</p>
        <RouteH1>Interview questions, <em>with answers</em></RouteH1>
        <p>Pick a technology, search across every question or narrow by how often it is asked, then open a question to read a short, interview-ready answer.</p>
      </div>
      <dl className={styles.stats}>
        <div><dt>Technologies</dt><dd>{bank?.length ?? "–"}</dd></div>
        <div><dt>Questions</dt><dd>{bank ? total : "–"}</dd></div>
        <div><dt>Frequently asked</dt><dd>{bank ? highTotal : "–"}</dd></div>
      </dl>
    </header>

    <section className={styles.toolbar} aria-label="Search and filter questions">
      <div className={styles.search} role="search">
        <label htmlFor={inputId} className={styles.srOnly}>Search interview questions</label>
        <Search size={17} aria-hidden="true" />
        <input id={inputId} ref={inputRef} type="search" autoComplete="off" spellCheck={false} placeholder="Search questions, answers, topics or technologies…" value={query}
          role="combobox" aria-expanded={showSuggest} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          onChange={event => { setQuery(event.target.value); setPage(0); setSuggestOpen(true); setActive(-1); }} onFocus={() => setSuggestOpen(true)} onBlur={() => setSuggestOpen(false)} onKeyDown={onKey} />
        {query && <button type="button" className={styles.clear} onClick={clear} aria-label="Clear search"><X size={15} aria-hidden="true" /></button>}
        {showSuggest && <ul id={listId} className={styles.suggest} role="listbox" aria-label="Suggestions" onMouseDown={event => event.preventDefault()}>
          {suggestions.map((s, index) => <li key={`${s.kind}-${s.label}-${index}`} id={`${listId}-${index}`} role="option" aria-selected={index === active} className={index === active ? styles.suggestActive : undefined}
            onMouseEnter={() => setActive(index)} onClick={() => choose(s)}>
            <span className={`${styles.kind} ${styles[`kind_${s.kind}`]}`}>{s.kind === "tech" ? <Layers size={13} aria-hidden="true" /> : s.kind === "topic" ? <Hash size={13} aria-hidden="true" /> : <BookOpen size={13} aria-hidden="true" />}{s.kind === "tech" ? "Technology" : s.kind === "topic" ? "Topic" : "Question"}</span>
            <span className={styles.suggestText}><Mark text={s.label} terms={words(query)} /></span>
            <small>{s.hint}</small>
          </li>)}
        </ul>}
      </div>

      <div className={styles.filterWrap} ref={filterRef}>
        <button type="button" className={styles.filterBtn} aria-expanded={filtersOpen} aria-controls={filterId} onClick={() => setFiltersOpen(v => !v)} data-on={activeFilters > 0 || undefined}>
          <SlidersHorizontal size={17} aria-hidden="true" /><span>Filters</span>{activeFilters > 0 && <b aria-label={`${activeFilters} active`}>{activeFilters}</b>}
        </button>
        {filtersOpen && <div id={filterId} className={styles.filterPanel} role="dialog" aria-label="Filter questions">
          <div className={styles.filterHead}><strong><SlidersHorizontal size={15} aria-hidden="true" />Refine</strong>
            <button type="button" onClick={resetFilters} disabled={!activeFilters}><RotateCcw size={13} aria-hidden="true" />Reset</button></div>
          <fieldset><legend><Flame size={13} aria-hidden="true" />How often it is asked</legend>
            <div className={styles.seg}>
              {([{ id: "all", label: "All" }, ...LEVELS] as { id: Level | "all"; label: string }[]).map(l => <button key={l.id} type="button" aria-pressed={level === l.id} onClick={() => { setLevel(l.id); setPage(0); }}>{l.label}</button>)}
            </div></fieldset>
          <fieldset><legend><Tag size={13} aria-hidden="true" />Topic in {tech?.name ?? "this technology"}</legend>
            <div className={styles.topicList}>
              <button type="button" aria-pressed={!topic} onClick={() => { setTopic(""); setPage(0); }}>Any topic</button>
              {topics.map(t => <button key={t} type="button" aria-pressed={topic === t} onClick={() => { setTopic(t); setPage(0); }}>{t}</button>)}
            </div></fieldset>
          <fieldset><legend>Order</legend>
            <div className={styles.seg}>
              <button type="button" aria-pressed={sort === "default"} onClick={() => setSort("default")}>Study order</button>
              <button type="button" aria-pressed={sort === "frequent"} onClick={() => setSort("frequent")}>Most asked first</button>
            </div></fieldset>
          <label className={styles.switch}><input type="checkbox" checked={openAll} onChange={event => setOpenAll(event.target.checked)} /><span aria-hidden="true" />Show every answer open</label>
        </div>}
      </div>
    </section>

    {(topic || level !== "all") && <div className={styles.applied} aria-label="Applied filters">
      {level !== "all" && <button type="button" onClick={() => setLevel("all")}>{LEVELS.find(l => l.id === level)?.label}<X size={13} aria-hidden="true" /></button>}
      {topic && <button type="button" onClick={() => setTopic("")}>{topic}<X size={13} aria-hidden="true" /></button>}
    </div>}

    {!bank ? <div className={styles.skeleton} aria-busy="true" aria-label="Loading questions"><span /><span /><span /></div> : <>
      <nav className={styles.tabsBar} aria-label="Technologies">
        <button type="button" className={styles.tabStep} onClick={() => goTabPage(safeTabPage - 1)} disabled={safeTabPage === 0} aria-label="Previous technologies"><ChevronLeft size={18} aria-hidden="true" /></button>
        <div className={styles.tabs} role="tablist" aria-label="Technology">
          {shownTabs.map(t => <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tech?.id === t.id} aria-controls="interview-panel" tabIndex={tech?.id === t.id ? 0 : -1} className={styles.tab} onClick={() => { setTopic(""); pickTech(t.id); }}>
            <span className={styles.badge} aria-hidden="true">{t.code}</span><span className={styles.tabName}>{t.name}</span><b>{counts.get(t.id)}</b></button>)}
        </div>
        <button type="button" className={styles.tabStep} onClick={() => goTabPage(safeTabPage + 1)} disabled={safeTabPage >= tabPages - 1} aria-label="Next technologies"><ChevronRight size={18} aria-hidden="true" /></button>
        <p className={styles.tabCount} aria-live="polite">{tabs.length ? `${safeTabPage + 1} / ${tabPages}` : ""}</p>
      </nav>

      <section id="interview-panel" className={styles.panel} role="tabpanel" aria-labelledby={tech ? `tab-${tech.id}` : undefined}>
        {!tech || !rows.length ? <p className={styles.empty}>No question matches{query ? <> “{query}”</> : " these filters"}.
          <button type="button" onClick={() => { setQuery(""); resetFilters(); }}>Clear search and filters</button></p> : <>
          <div className={styles.panelHead}>
            <h2>{tech.name}</h2>
            <p aria-live="polite">{rows.length === tech.items.length ? `${rows.length} questions` : `${rows.length} of ${tech.items.length} questions`}{pages > 1 && ` · page ${safePage + 1} of ${pages}`}</p>
          </div>
          <ol className={styles.list}>
            {visible.map((item, index) => {
              const isOpen = openAll || open.has(item.id);
              return <li key={item.id} className={styles.card} data-open={isOpen || undefined}>
                <h3><button type="button" aria-expanded={isOpen} aria-controls={`a-${item.id}`} onClick={() => toggle(item.id)}>
                  <span className={styles.num}>{safePage * PER_PAGE + index + 1}</span>
                  <span className={styles.qText}><Mark text={item.q} terms={terms} />
                    <span className={styles.metaRow}><span className={`${styles.level} ${styles[`level_${item.level}`]}`}>{item.level === "high" && <Flame size={12} aria-hidden="true" />}{item.level === "high" ? "Frequently asked" : "Commonly asked"}</span><span className={styles.topicTag}>{item.topic}</span></span></span>
                  <ChevronDown size={18} aria-hidden="true" className={styles.chev} /></button></h3>
                {isOpen && <div id={`a-${item.id}`} className={styles.answer}>
                  <p><Mark text={item.a} terms={terms} /></p>
                  {item.askedAt && <small>Asked at: {item.askedAt}</small>}
                </div>}
              </li>;
            })}
          </ol>
          {pages > 1 && <Pager page={safePage} pages={pages} label="Questions pages" onPage={next => { setPage(next); document.getElementById("interview-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />}
        </>}
      </section>
    </>}
  </div>;
}
