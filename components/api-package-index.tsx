"use client";
import { AccordionChevron } from "@/components/ui/accordion-chevron";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  BrainCircuit,
  Boxes,
  Cloud,
  Code2,
  Database,
  FlaskConical,
  Layers,
  ListFilter,
  LayoutTemplate,
  type LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { API_STATUSES, API_TYPES, type ApiPackage } from "@/lib/api-docs";
import ref from "./api-reference.module.css";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  agentic: Sparkles,
  ai: BrainCircuit,
  languages: Code2,
  frontend: LayoutTemplate,
  backend: Server,
  auth: ShieldCheck,
  data: Database,
  testing: FlaskConical,
  platform: Cloud,
};

const PREFS_KEY = "masterclass:api-index";

type Category = { id: string; label: string; packages: ApiPackage[] };

/**
 * Tooltips are drawn in a portal at fixed coordinates, because the index
 * scrolls on its own and would clip anything positioned inside it. Any
 * element inside the index with data-tip gets one on hover or keyboard focus.
 */
function useIndexTooltip(container: React.RefObject<HTMLElement | null>) {
  const [tip, setTip] = useState<{ text: string; top: number; left: number } | null>(null);
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    let active: HTMLElement | null = null;
    const hide = () => {
      active = null;
      setTip(null);
    };
    const show = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-tip]") : null;
      if (!target || !root.contains(target) || target === active) return;
      // Keyboard focus shows the tooltip only for visible focus, not after a mouse click.
      if (event.type === "focusin" && !target.matches(":focus-visible")) return;
      active = target;
      const rect = target.getBoundingClientRect();
      setTip({
        text: target.dataset.tip ?? "",
        top: Math.max(16, Math.min(window.innerHeight - 16, rect.top + rect.height / 2)),
        left: rect.right + 10,
      });
    };
    const leave = (event: Event) => {
      const next = (event as MouseEvent | FocusEvent).relatedTarget;
      if (active && !(next instanceof Node && active.contains(next))) hide();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    root.addEventListener("mouseover", show);
    root.addEventListener("focusin", show);
    root.addEventListener("mouseout", leave);
    root.addEventListener("focusout", leave);
    root.addEventListener("click", hide);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("keydown", escape);
    return () => {
      root.removeEventListener("mouseover", show);
      root.removeEventListener("focusin", show);
      root.removeEventListener("mouseout", leave);
      root.removeEventListener("focusout", leave);
      root.removeEventListener("click", hide);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("keydown", escape);
    };
  }, [container]);
  return tip;
}

type Suggestion = { key: string; label: string; detail: string; packageId: string; entry?: string };

/** Up to eight matches: packages first, then names that start with the text, then names that contain it. */
function suggestionsFor(text: string, categories: Category[]): Suggestion[] {
  const q = text.trim().toLowerCase();
  if (!q) return [];
  const packages: Suggestion[] = [], starts: Suggestion[] = [], contains: Suggestion[] = [];
  for (const category of categories) for (const pkg of category.packages) {
    if (pkg.name.toLowerCase().includes(q)) packages.push({ key: `p:${pkg.id}`, label: pkg.name, detail: `Package, ${pkg.entries.length} identifiers`, packageId: pkg.id });
    for (const entry of pkg.entries) {
      const name = entry.name.toLowerCase();
      if (!name.includes(q)) continue;
      (name.startsWith(q) ? starts : contains).push({ key: `e:${pkg.id}:${entry.name}`, label: entry.name, detail: pkg.name, packageId: pkg.id, entry: entry.name });
    }
  }
  return [...packages.slice(0, 3), ...starts, ...contains].slice(0, 8);
}

function Match({ text, query }: { text: string; query: string }) {
  const at = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (at < 0 || !query.trim()) return <>{text}</>;
  const end = at + query.trim().length;
  return <>{text.slice(0, at)}<mark>{text.slice(at, end)}</mark>{text.slice(end)}</>;
}

export function ApiPackageIndex({
  categories,
  packageId,
  total,
  rail,
  onRailChange,
  onChoose,
  renderMark,
  entryHref,
  onSearch,
  types,
  statuses,
  onToggleType,
  onToggleStatus,
  onClearFilters,
}: {
  categories: Category[];
  packageId: string;
  total: number;
  rail: boolean;
  onRailChange: (rail: boolean) => void;
  onChoose: (id: string) => void;
  renderMark: (pkg: ApiPackage) => ReactNode;
  entryHref: (packageId: string, name: string) => string;
  onSearch: (text: string) => void;
  types: string[];
  statuses: string[];
  onToggleType: (kind: string) => void;
  onToggleStatus: (id: string) => void;
  onClearFilters: () => void;
}) {
  const navRef = useRef<HTMLElement>(null);
  const tip = useIndexTooltip(navRef);
  const router = useRouter();
  const activeCategory = categories.find(category => category.packages.some(pkg => pkg.id === packageId))?.id;
  // One category at a time, the first by default; choosing a package from elsewhere on the page opens its category.
  const [openId, setOpenId] = useState<string | null>(categories[0]?.id ?? null);
  const [seenActive, setSeenActive] = useState(activeCategory);
  if (activeCategory !== seenActive) {
    setSeenActive(activeCategory);
    if (activeCategory) setOpenId(activeCategory);
  }
  const [term, setTerm] = useState("");
  const deferredTerm = useDeferredValue(term);
  const [suggesting, setSuggesting] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const loaded = useRef(false);

  const suggestions = useMemo(() => suggestionsFor(deferredTerm, categories), [deferredTerm, categories]);
  const q = deferredTerm.trim().toLowerCase();
  // While searching, the list narrows to the packages that match and all of them show.
  const shown = useMemo(() => (q
    ? categories.map(category => ({ ...category, packages: category.packages.filter(pkg => pkg.name.toLowerCase().includes(q) || pkg.entries.some(entry => entry.name.toLowerCase().includes(q))) })).filter(category => category.packages.length > 0)
    : categories), [categories, q]);
  const showSuggestions = suggesting && term.trim() !== "";
  // The last option applies the text to the whole reference on the right.
  const optionCount = suggestions.length + 1;
  const activeFilters = types.length + (API_STATUSES.length - statuses.length);

  // Restore the rail preference after mount so the server render and first client render match.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as { rail?: boolean };
      if (typeof saved.rail === "boolean") onRailChange(saved.rail);
    } catch {}
    loaded.current = true;
    // Runs once on mount by design; onRailChange is a stable state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ rail }));
    } catch {}
  }, [rail]);

  function toggleGroup(id: string) {
    setOpenId(current => (current === id ? null : id));
  }

  function openFromRail(id: string) {
    setOpenId(id);
    onRailChange(false);
    requestAnimationFrame(() => document.getElementById(`api-index-group-${id}`)?.scrollIntoView({ block: "nearest" }));
  }

  function clearSearch() {
    setTerm("");
    setSuggesting(false);
    setHighlighted(-1);
    onSearch("");
    searchInput.current?.focus();
  }

  function applySearch() {
    setSuggesting(false);
    onSearch(term.trim());
    document.getElementById("api-reference-results")?.scrollIntoView({ block: "start" });
  }

  function pick(item: Suggestion) {
    setSuggesting(false);
    if (item.entry) router.push(entryHref(item.packageId, item.entry));
    else { setTerm(""); onChoose(item.packageId); }
  }

  function onSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { if (showSuggestions) setSuggesting(false); else if (term) clearSearch(); return; }
    if (event.key === "Enter") {
      event.preventDefault();
      if (showSuggestions && highlighted >= 0 && highlighted < suggestions.length) pick(suggestions[highlighted]);
      else if (term.trim()) applySearch();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setSuggesting(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlighted(current => (current + step + optionCount + 1) % (optionCount + 1));
    }
  }

  return (
    <nav ref={navRef} className={ref.index} data-rail={rail || undefined} aria-label="Browse packages">
      {!rail && (
        <div className={ref.indexSearch} role="search">
          <div className={ref.indexSearchRow}>
            <div className={ref.indexSearchBox}>
              <Search size={15} aria-hidden="true" />
              <input
                ref={searchInput}
                type="search"
                role="combobox"
                aria-label="Search packages and identifiers"
                aria-expanded={showSuggestions}
                aria-controls="api-index-suggestions"
                aria-autocomplete="list"
                aria-activedescendant={showSuggestions && highlighted >= 0 ? `api-index-option-${highlighted}` : undefined}
                placeholder="Search packages, APIs"
                autoComplete="off"
                value={term}
                onChange={event => { setTerm(event.target.value); setSuggesting(true); setHighlighted(-1); }}
                onFocus={() => setSuggesting(true)}
                onBlur={() => setSuggesting(false)}
                onKeyDown={onSearchKey}
              />
              {term && <button type="button" className={ref.indexClear} onClick={clearSearch} aria-label="Clear search" title="Clear search"><X size={13} aria-hidden="true" /></button>}
            </div>
            <button type="button" className={ref.indexFilterButton} aria-expanded={filtersOpen} aria-controls="api-index-filters" aria-label={activeFilters ? `Filters, ${activeFilters} on` : "Filters"} title="Filters" onClick={() => setFiltersOpen(current => !current)}>
              <ListFilter size={16} aria-hidden="true" />
              {activeFilters > 0 && <small aria-hidden="true">{activeFilters}</small>}
            </button>
          </div>

          {showSuggestions && (
            <ul id="api-index-suggestions" className={ref.indexSuggestions} role="listbox" aria-label="Suggestions">
              {suggestions.map((item, index) => (
                <li key={item.key} id={`api-index-option-${index}`} role="option" aria-selected={highlighted === index}>
                  {/* Keeps focus in the search box, whose blur would close this list before the click lands. */}
                  <button type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => pick(item)}>
                    <b><Match text={item.label} query={deferredTerm} /></b>
                    <small>{item.detail}</small>
                  </button>
                </li>
              ))}
              <li id={`api-index-option-${suggestions.length}`} role="option" aria-selected={highlighted === suggestions.length}>
                <button type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={applySearch}>
                  <b>Search the reference for &ldquo;{term.trim()}&rdquo;</b>
                  <small>{suggestions.length ? "Shows every match on the right" : "No direct matches. Try the whole reference"}</small>
                </button>
              </li>
            </ul>
          )}

          <div id="api-index-filters" className={ref.indexPanel} data-open={filtersOpen || undefined} inert={!filtersOpen}>
            <div>
              <div className={ref.indexFilters}>
                <h3>Status</h3>
                <div className={ref.indexFilterChips} role="group" aria-label="Status">
                  {API_STATUSES.map(item => <button key={item.id} type="button" aria-pressed={statuses.includes(item.id)} onClick={() => onToggleStatus(item.id)}>{item.label}</button>)}
                </div>
                <h3>Identifier types</h3>
                <div className={ref.indexFilterChips} role="group" aria-label="Identifier types">
                  {API_TYPES.map(item => <button key={item.k} type="button" aria-pressed={types.includes(item.k)} onClick={() => onToggleType(item.k)}>{item.label}</button>)}
                </div>
                {activeFilters > 0 && <button type="button" className={ref.indexFilterClear} onClick={onClearFilters}>Clear filters</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={ref.indexTop}>
        {!rail && <span className={ref.indexTitle}>Packages</span>}
        <button
          type="button"
          className={ref.indexIconButton}
          aria-expanded={!rail}
          aria-label={rail ? "Expand package list" : "Collapse package list"}
          data-tip={rail ? "Expand package list" : "Collapse package list"}
          onClick={() => onRailChange(!rail)}
        >
          {rail ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
        </button>
      </div>

      <button
        type="button"
        className={ref.indexAll}
        aria-pressed={packageId === "all"}
        aria-label={rail ? `All packages, ${total.toLocaleString("en-US")} identifiers` : undefined}
        data-tip={`All packages · ${total.toLocaleString("en-US")} identifiers`}
        onClick={() => onChoose("all")}
      >
        <Layers size={16} aria-hidden="true" className={ref.indexIcon} />
        {!rail && (
          <>
            <span className={ref.indexName}>All packages</span>
            <span className={ref.count}>{total.toLocaleString("en-US")}</span>
          </>
        )}
      </button>

      {!rail && q && shown.length === 0 && <p className={ref.indexEmpty}>No package has that name. Check the spelling, or search the whole reference.</p>}

      {(rail ? categories : shown).map(category => {
        const Icon = CATEGORY_ICONS[category.id] ?? Boxes;
        const open = q !== "" || openId === category.id;
        const identifiers = category.packages.reduce((sum, pkg) => sum + pkg.entries.length, 0);
        const summary = `${category.label} · ${category.packages.length} packages, ${identifiers.toLocaleString("en-US")} identifiers`;
        if (rail) {
          return (
            <button
              key={category.id}
              type="button"
              className={ref.railCategory}
              data-active={activeCategory === category.id || undefined}
              aria-label={`${category.label}, ${category.packages.length} packages. Expand the package list to browse`}
              data-tip={summary}
              onClick={() => openFromRail(category.id)}
            >
              <Icon size={17} aria-hidden="true" />
            </button>
          );
        }
        return (
          <div className={ref.indexGroup} key={category.id} id={`api-index-group-${category.id}`}>
            <button
              type="button"
              className={ref.indexHeading}
              aria-expanded={open}
              aria-controls={`api-index-list-${category.id}`}
              data-active={activeCategory === category.id || undefined}
              data-tip={summary}
              onClick={() => toggleGroup(category.id)}
            >
              <Icon size={15} aria-hidden="true" className={ref.indexIcon} />
              <span className={ref.indexName}>{category.label}</span>
              <span className={ref.count}>{category.packages.length}</span>
              <AccordionChevron />
            </button>
            <div className={ref.indexPanel} data-open={open || undefined} inert={!open}>
            <ul id={`api-index-list-${category.id}`} aria-label={category.label}>
              {category.packages.map(pkg => (
                <li key={pkg.id}>
                  <button
                    type="button"
                    className={ref.indexItem}
                    aria-pressed={packageId === pkg.id}
                    data-tip={`${pkg.name} · ${pkg.entries.length} identifiers`}
                    onClick={() => onChoose(packageId === pkg.id ? "all" : pkg.id)}
                  >
                    <span className={ref.indexMark} aria-hidden="true">
                      {renderMark(pkg)}
                    </span>
                    <span className={ref.indexName}>{pkg.name}</span>
                    <span className={ref.count}>{pkg.entries.length}</span>
                  </button>
                </li>
              ))}
            </ul>
            </div>
          </div>
        );
      })}

      {tip &&
        createPortal(
          <div className={ref.indexTooltip} style={{ top: tip.top, left: tip.left }} aria-hidden="true">
            {tip.text}
          </div>,
          document.body
        )}
    </nav>
  );
}
