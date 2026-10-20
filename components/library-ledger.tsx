"use client";

import { useCallback, useDeferredValue, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, BookA, Code2, FileCode2, LayoutDashboard, Lock, RotateCcw, Search, SlidersHorizontal, X, type LucideIcon } from "lucide-react";
import type { LandingLibrary, LibraryEntry, LibraryKind } from "@/lib/landing-library";
import { useLanguage } from "./language-provider";
import styles from "./landing-library.module.css";

type Filter = "all" | LibraryKind;
type Sort = "featured" | "az" | "za";
const VISIBLE_ROWS = 40;
const SUGGESTIONS = 6;
/** Shelves whose `meta` is a real category, so it can be offered as a group filter. */
const GROUPED: LibraryKind[] = ["course", "word"];
/** Offered as "try" chips; only those that match a real entry are shown. */
const EXAMPLES = ["react", "succinct", "SSC CGL", "boto3", "git"];

/** Where each kind of entry opens inside the dashboard, in both languages. */
const OPENS_IN: Record<LibraryKind, [string, string]> = {
  technology: ["On The Go · Class Room", "On The Go · क्लास रूम"],
  api: ["API Docs", "API Docs"],
  course: ["Your exam & class space", "आपका परीक्षा व कक्षा क्षेत्र"],
  word: ["Vocabulary", "शब्दावली"],
  techy: ["Techy code lab", "Techy कोड लैब"],
};

/** The dashboard page each kind of entry lives on, shown in the tablet's address bar. */
const ROUTES: Record<LibraryKind, string> = {
  technology: "/dashboard/search", api: "/dashboard/api-docs", course: "/dashboard", word: "/dashboard/vocabulary", techy: "/dashboard/techy",
};

/** The dashboard's own collapsed sidebar, in its order, so the tablet reads as the real app. */
const RAIL: { route: string; icon: LucideIcon; label: [string, string] }[] = [
  { route: "/dashboard", icon: LayoutDashboard, label: ["Dashboard", "डैशबोर्ड"] },
  { route: "/dashboard/search", icon: Search, label: ["Search", "खोज"] },
  { route: "/dashboard/api-docs", icon: FileCode2, label: ["API Docs", "API Docs"] },
  { route: "/dashboard/vocabulary", icon: BookA, label: ["Vocabulary", "शब्दावली"] },
  { route: "/dashboard/techy", icon: Code2, label: ["Techy", "Techy"] },
];

const normalise = (value: string) => value.toLocaleLowerCase("en").normalize("NFKD").replace(/[̀-ͯ]/g, "");
const haystack = (entry: LibraryEntry) => normalise(`${entry.title} ${entry.hi ?? ""} ${entry.note} ${entry.meta}`);

/**
 * The dashboard's real catalogue, searchable in place, in one compact panel:
 * a pill search field (a combobox with typed-ahead suggestions) and Filters
 * button, shelf pills carrying each shelf's true size in its own colour, then
 * a short list beside a preview card that says where the entry opens after
 * sign-up, shown on a light tablet with the site open in a browser. "Try"
 * chips under the list run real searches.
 */
export function LibraryLedger({ library: initial }: { library: LandingLibrary }) {
  // The page ships the first rows only; the full ledger loads once, the first time a visitor searches or filters.
  const [entries, setEntries] = useState(initial.entries);
  const total = initial.total ?? initial.entries.length;
  const loading = useRef(false);
  const loadAll = useCallback(() => {
    if (loading.current || entries.length >= total) return;
    loading.current = true;
    fetch("/api/landing/library").then(response => response.ok ? response.json() : null)
      .then((full: { entries?: LibraryEntry[] } | null) => { if (full?.entries?.length) setEntries(full.entries); })
      .catch(() => { loading.current = false; });
  }, [entries.length, total]);
  const library = useMemo(() => ({ ...initial, entries, total }), [initial, entries, total]);
  const { language } = useLanguage();
  const hi = language === "hi";
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const ids = useId();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");
  const [hindiOnly, setHindiOnly] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const format = (value: number) => new Intl.NumberFormat(hi ? "hi-IN" : "en-IN").format(value);
  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: text("Everything", "सब कुछ"), count: library.total },
    { id: "technology", label: text("Technologies", "तकनीकें"), count: library.counts.technology },
    { id: "api", label: text("API reference", "API संदर्भ"), count: library.counts.api },
    { id: "course", label: text("Exams & classes", "परीक्षा व कक्षाएँ"), count: library.counts.course },
    { id: "word", label: text("Words", "शब्द"), count: library.counts.word },
    { id: "techy", label: "Techy", count: library.counts.techy },
  ];
  const kindLabel = (kind: LibraryKind) => tabs.find(tab => tab.id === kind)!.label;

  const shelf = useMemo(() => library.entries.filter(entry => filter === "all" || entry.kind === filter), [library.entries, filter]);
  const groups = useMemo(() => filter !== "all" && GROUPED.includes(filter) ? [...new Set(shelf.map(entry => entry.meta).filter(Boolean))] : [], [shelf, filter]);
  const matches = useMemo(() => {
    const needle = normalise(deferred.trim());
    const found = shelf.filter(entry => (!needle || haystack(entry).includes(needle)) && (!hindiOnly || entry.hi) && (!group || entry.meta === group));
    if (sort === "featured") return found;
    const order = sort === "az" ? 1 : -1;
    return [...found].sort((a, b) => order * a.title.localeCompare(b.title, "en", { sensitivity: "base" }));
  }, [shelf, deferred, hindiOnly, group, sort]);
  // Suggestions follow the live query, not the deferred one: titles that start with it first, then any title containing it.
  const suggestions = useMemo(() => {
    const needle = normalise(query.trim());
    if (!needle) return [];
    const starts: LibraryEntry[] = [];
    const contains: LibraryEntry[] = [];
    for (const entry of shelf) {
      const title = normalise(entry.title);
      if (title.startsWith(needle)) starts.push(entry);
      else if (title.includes(needle) || normalise(entry.hi ?? "").includes(needle)) contains.push(entry);
      if (starts.length >= SUGGESTIONS) break;
    }
    return [...starts, ...contains].slice(0, SUGGESTIONS);
  }, [shelf, query]);
  const examples = useMemo(() => EXAMPLES.filter(example => library.entries.some(entry => haystack(entry).includes(normalise(example)))), [library.entries]);
  const selected = matches.find(entry => entry.id === selectedId) ?? matches[0] ?? null;
  const shelfTotal = filter === "all" ? null : tabs.find(tab => tab.id === filter)!.count;
  const activeFilters = (sort !== "featured" ? 1 : 0) + (hindiOnly ? 1 : 0) + (group ? 1 : 0);
  const showSuggestions = suggestOpen && suggestions.length > 0 && !(suggestions.length === 1 && suggestions[0].title === query);

  const choose = (entry: LibraryEntry) => { setQuery(entry.title); setSelectedId(entry.id); setSuggestOpen(false); setCursor(-1); };
  const tryExample = (example: string) => { setFilter("all"); setGroup(null); setQuery(example); setSelectedId(null); inputRef.current?.focus(); };
  const resetFilters = () => { setSort("featured"); setHindiOnly(false); setGroup(null); };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setSuggestOpen(true); setCursor(value => (value + 1) % suggestions.length); }
    else if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setSuggestOpen(true); setCursor(value => (value <= 0 ? suggestions.length : value) - 1); }
    else if (event.key === "Enter" && showSuggestions && cursor >= 0) { event.preventDefault(); choose(suggestions[cursor]); }
    else if (event.key === "Escape") { if (showSuggestions) setSuggestOpen(false); else if (query) setQuery(""); }
  };

  return <section className={styles.ledger} aria-labelledby={`${ids}-title`} onPointerEnter={loadAll} onFocusCapture={loadAll}>
    <h2 id={`${ids}-title`} className={styles.srOnly}>{text("Search the MasterClass library", "MasterClass लाइब्रेरी खोजें")}</h2>
    <div className={styles.top}>
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <label className={styles.search} htmlFor={`${ids}-q`}>
            <Search size={19} strokeWidth={2} aria-hidden="true" className={styles.searchIcon} />
            <span className={styles.srOnly}>{text("Search the library", "लाइब्रेरी खोजें")}</span>
            <input ref={inputRef} id={`${ids}-q`} type="text" role="combobox" value={query} autoComplete="off" spellCheck={false}
              aria-autocomplete="list" aria-expanded={showSuggestions} aria-controls={`${ids}-suggest`}
              aria-activedescendant={showSuggestions && cursor >= 0 ? `${ids}-s-${cursor}` : undefined}
              placeholder={text("Search topics, exams, packages or words", "विषय, परीक्षा, पैकेज या शब्द खोजें")}
              onChange={event => { setQuery(event.target.value); setSelectedId(null); setSuggestOpen(true); setCursor(-1); }}
              onFocus={() => setSuggestOpen(true)} onBlur={() => setSuggestOpen(false)} onKeyDown={onKey} />
            {query && <button type="button" className={styles.clear} onClick={() => { setQuery(""); setSelectedId(null); }} aria-label={text("Clear search", "खोज साफ़ करें")}>
              <X size={15} aria-hidden="true" />
            </button>}
          </label>
          <ul id={`${ids}-suggest`} role="listbox" aria-label={text("Suggestions", "सुझाव")} className={styles.suggest} hidden={!showSuggestions}>
            {showSuggestions && suggestions.map((entry, index) =>
              <li key={entry.id} id={`${ids}-s-${index}`} role="option" aria-selected={index === cursor} data-kind={entry.kind} className={styles.suggestion}
                onMouseDown={event => event.preventDefault()} onClick={() => choose(entry)} onMouseEnter={() => setCursor(index)}>
                <span className={styles.suggestTitle} lang={entry.kind === "word" ? "en" : undefined}><Highlight value={entry.title} query={query} /></span>
                <span className={styles.suggestKind}>{kindLabel(entry.kind)}</span>
              </li>)}
          </ul>
        </div>
        <button type="button" className={styles.filterToggle} aria-expanded={panelOpen} aria-controls={`${ids}-filters`} onClick={() => setPanelOpen(value => !value)}>
          <SlidersHorizontal size={16} aria-hidden="true" /><span>{text("Filters", "फ़िल्टर")}</span>
          {activeFilters > 0 && <b aria-label={text(`${activeFilters} active`, `${activeFilters} सक्रिय`)}>{activeFilters}</b>}
        </button>
      </div>

      <div id={`${ids}-filters`} className={styles.panel} data-open={panelOpen || undefined} inert={!panelOpen} role="region" aria-label={text("Filters", "फ़िल्टर")}>
        <div className={styles.panelInner}><div className={styles.panelBody}>
          <fieldset className={styles.field}>
            <legend>{text("Sort", "क्रम")}</legend>
            <div className={styles.chips}>{([["featured", text("Featured", "चुनिंदा")], ["az", "A to Z"], ["za", "Z to A"]] as [Sort, string][]).map(([id, label]) =>
              <button key={id} type="button" className={styles.chip} aria-pressed={sort === id} onClick={() => setSort(id)}>{label}</button>)}</div>
          </fieldset>
          <fieldset className={styles.field}>
            <legend>{text("Language", "भाषा")}</legend>
            <div className={styles.chips}><button type="button" className={styles.chip} aria-pressed={hindiOnly} onClick={() => setHindiOnly(value => !value)}>{text("Has a Hindi meaning", "हिन्दी अर्थ सहित")}</button></div>
          </fieldset>
          {groups.length > 1 && <fieldset className={`${styles.field} ${styles.groupField}`}>
            <legend>{text("Group", "समूह")}</legend>
            <div className={styles.chips}>{groups.map(name =>
              <button key={name} type="button" className={styles.chip} aria-pressed={group === name} onClick={() => setGroup(value => value === name ? null : name)}>{name}</button>)}</div>
          </fieldset>}
          <button type="button" className={styles.reset} onClick={resetFilters} disabled={!activeFilters}><RotateCcw size={13} aria-hidden="true" />{text("Reset filters", "फ़िल्टर हटाएँ")}</button>
        </div></div>
      </div>

      <div className={styles.tabs} role="group" aria-label={text("Library shelves", "लाइब्रेरी की शेल्फ़")}>
        {tabs.map(tab => <button key={tab.id} type="button" className={styles.tab} data-kind={tab.id} aria-pressed={filter === tab.id} onClick={() => { setFilter(tab.id); setSelectedId(null); setGroup(null); }}>
          <span>{tab.label}</span><b>{format(tab.count)}</b>
        </button>)}
      </div>
    </div>

    <div className={styles.body}>
      <div className={styles.shelf}>
        {matches.length ? <ul className={styles.rows} aria-label={text("Library entries", "लाइब्रेरी प्रविष्टियाँ")}>
          {matches.slice(0, VISIBLE_ROWS).map(entry => <Row key={entry.id} entry={entry} active={selected?.id === entry.id} hi={hi} onSelect={() => setSelectedId(entry.id)} />)}
        </ul> : <p className={styles.empty} role="status">
          {query.trim()
            ? text(`Nothing on this shelf matches “${query.trim()}”.`, `इस शेल्फ़ पर “${query.trim()}” से कुछ नहीं मिला।`)
            : text("Nothing on this shelf matches these filters.", "इन फ़िल्टर से इस शेल्फ़ पर कुछ नहीं मिला।")}{" "}
          {activeFilters > 0 && <><button type="button" className={styles.inlineReset} onClick={resetFilters}>{text("Reset filters", "फ़िल्टर हटाएँ")}</button>{" "}</>}
          <Link href="/sign-up">{text("Ask it in Search once you’re in", "साइन अप के बाद इसे सर्च में पूछें")}<ArrowUpRight size={13} aria-hidden="true" /></Link>
        </p>}
      </div>
      <Tablet route={selected ? ROUTES[selected.kind] : "/dashboard/search"} hi={hi}>
        {selected ? <Preview entry={selected} hi={hi} text={text} kindLabel={kindLabel(selected.kind)} /> : <div className={styles.previewEmpty} aria-hidden="true"><Search size={26} strokeWidth={1.5} /></div>}
      </Tablet>
    </div>

    <div className={styles.foot}>
      {examples.length > 0 && <div className={styles.try} role="group" aria-label={text("Try a search", "कोई खोज आज़माएँ")}>
        <span aria-hidden="true">{text("Try", "आज़माएँ")}</span>
        {examples.map(example => <button key={example} type="button" onClick={() => tryExample(example)}>{example}</button>)}
      </div>}
      <p className={styles.tally} aria-live="polite">
        {text(
          `${format(Math.min(matches.length, VISIBLE_ROWS))} shown of ${format(matches.length)} matching${shelfTotal && shelfTotal > matches.length && !deferred && !activeFilters ? `, ${format(shelfTotal)} on this shelf in the dashboard` : ""}`,
          `${format(matches.length)} मिलानों में से ${format(Math.min(matches.length, VISIBLE_ROWS))} दिख रहे हैं${shelfTotal && shelfTotal > matches.length && !deferred && !activeFilters ? `, डैशबोर्ड में इस शेल्फ़ पर ${format(shelfTotal)}` : ""}`,
        )}
      </p>
    </div>
  </section>;
}

/** The typed part of a suggestion, marked; the rest in plain weight. */
function Highlight({ value, query }: { value: string; query: string }) {
  const needle = query.trim();
  const at = needle ? normalise(value).indexOf(normalise(needle)) : -1;
  if (at < 0) return <>{value}</>;
  const end = at + needle.length;
  return <>{value.slice(0, at)}<mark>{value.slice(at, end)}</mark>{value.slice(end)}</>;
}

function Row({ entry, active, hi, onSelect }: { entry: LibraryEntry; active: boolean; hi: boolean; onSelect: () => void }) {
  return <li>
    <button type="button" className={styles.row} aria-pressed={active} onClick={onSelect} data-kind={entry.kind}>
      <span className={styles.rowTitle} lang={entry.kind === "word" ? "en" : undefined}>{hi && entry.kind === "course" && entry.hi ? entry.hi : entry.title}</span>
      <span className={styles.rowMeta}>{entry.meta}</span>
    </button>
  </li>;
}

/**
 * A light tablet with the dashboard open in a browser: the app's collapsed
 * sidebar (the entry's page highlighted), its breadcrumb bar and language
 * toggle, and the entry as the page. The chrome is decoration; the page inside
 * is real content.
 */
function Tablet({ route, hi, children }: { route: string; hi: boolean; children: ReactNode }) {
  const page = RAIL.find(item => item.route === route) ?? RAIL[0];
  return <div className={styles.tablet}>
    <div className={styles.screen}>
      <div className={styles.browser} aria-hidden="true">
        <span className={styles.lights}><i /><i /><i /></span>
        <span className={styles.url}><Lock size={9} strokeWidth={2.4} />masterclass{route}</span>
      </div>
      <div className={styles.appShell}>
        <nav className={styles.rail} aria-hidden="true">
          <b className={styles.railMark}>M<em>c</em></b>
          {RAIL.map(({ route: href, icon: Icon }) => <span key={href} data-on={href === route || undefined}><Icon size={13} strokeWidth={2} /></span>)}
        </nav>
        <div className={styles.appMain}>
          <div className={styles.appTop} aria-hidden="true">
            <span>MasterClass <b>/ {hi ? page.label[1] : page.label[0]}</b></span>
            <span className={styles.appLang}><i data-on={!hi || undefined}>EN</i><i data-on={hi || undefined}>हि</i></span>
          </div>
          {children}
        </div>
      </div>
    </div>
  </div>;
}

function Preview({ entry, hi, text, kindLabel }: { entry: LibraryEntry; hi: boolean; text: (en: string, hindi: string) => string; kindLabel: string }) {
  const [en, hindi] = OPENS_IN[entry.kind];
  // Keyed on the entry so the enter transition replays for each selection.
  return <article key={entry.id} className={styles.preview} aria-label={text(`Preview: ${entry.title}`, `पूर्वावलोकन: ${entry.title}`)} data-kind={entry.kind}>
    <p className={styles.kind}><span>{kindLabel}</span>{entry.meta && <small>{entry.meta}</small>}</p>
    <h3 lang={entry.kind === "word" ? "en" : undefined}>{entry.title}</h3>
    {entry.hi && (entry.kind === "word" || hi) && <p lang="hi" className={styles.previewHindi}>{entry.hi}</p>}
    <p className={styles.previewNote}>{entry.note}</p>
    <Link className={styles.opens} href="/sign-up">
      <small>{text("Opens in", "यहाँ खुलता है")}</small>
      <span>{hi ? hindi : en}</span>
    </Link>
  </article>;
}
