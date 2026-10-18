"use client";
import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { siAngular, siNodedotjs, siOpenrouter, siVercel, siVuedotjs } from "simple-icons";
import {
  ArrowUpRight, BookOpen, Bot, Building2, Check, ChevronLeft, ChevronRight, Cloud, Code2, Copy, FileCode2, GraduationCap,
  LayoutGrid, Megaphone, MonitorSmartphone, Pause, Play, RotateCcw, Rocket, Search, Server, SlidersHorizontal, Sprout, TrendingUp, X, type LucideIcon,
} from "lucide-react";
import { MATERIAL_KINDS, MATERIAL_LEVELS, TECH_DOC_CATEGORIES, TECH_DOCS, type MaterialKind, type MaterialLevel, type TechDoc, type TechDocCategory, type TechMaterial } from "@/lib/tech-docs";
import type { OfficialPage, OfficialTechDocs } from "@/lib/tech-docs-official";
import { useLanguage } from "./language-provider";
import { DashboardMore } from "./dashboard-more";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./landing-tech-docs.module.css";

/** Autoplay: one platform every two minutes. */
const SLIDE_MS = 120_000;
/** Learning materials per page inside a slide. */
const MATERIAL_PAGE = 4;
const BRAND: Record<string, { path: string } | null> = { angular: siAngular, vue: siVuedotjs, node: siNodedotjs, openrouter: siOpenrouter, "ai-gateway": siVercel, salesforce: null };
const CATEGORY_ICON: Record<TechDocCategory | "all", LucideIcon> = { all: LayoutGrid, frontend: MonitorSmartphone, backend: Server, enterprise: Building2, ai: Bot };
const LEVEL_ICON: Record<MaterialLevel, LucideIcon> = { beginner: Sprout, intermediate: TrendingUp, advanced: Rocket };
const KIND_ICON: Record<MaterialKind, LucideIcon> = { guide: BookOpen, tutorial: GraduationCap, reference: FileCode2, release: Megaphone };
type Sort = "recommended" | "quick" | "az";
type Suggestion = { key: string; kind: "tech" | "material" | "feature"; label: string; detail: string; tech: TechDoc; value: string };

const norm = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}.+#@ ]/gu, " ").replace(/\s+/g, " ").trim();
const host = (url: string) => { try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; } };
const shortDate = (iso?: string) => iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "";

/** Highlights each search term inside a title. */
function Marked({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return <>{text.split(pattern).map((part, i) => i % 2 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>)}</>;
}

function BrandIcon({ tech, size = 28 }: { tech: TechDoc; size?: number }) {
  const icon = BRAND[tech.id];
  if (!icon) return <Cloud size={size} aria-hidden="true" />;
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor"><path d={icon.path} /></svg>;
}

/**
 * Technology docs: Angular 22+, Vue 3.5, Salesforce API 68+, Node.js 26, OpenRouter and the Vercel AI Gateway.
 * A carousel (one platform per slide, autoplay every two minutes) with numbered pagination, suggestion search,
 * icon filters and a "More options" menu. Titles, summaries and section lists come from each official page.
 * `preview` (the landing page, or a learner without a membership) shows only the first platform's panel and links on.
 */
export function LandingTechDocs({ official, preview = false, locked = false }: Readonly<{ official?: OfficialTechDocs | null; preview?: boolean; locked?: boolean }>) {
  const { language } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const uid = useId();
  const [query, setQuery] = useState("");
  const [focusSuggest, setFocusSuggest] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [category, setCategory] = useState<TechDocCategory | "all">("all");
  const [levels, setLevels] = useState<MaterialLevel[]>([]);
  const [kind, setKind] = useState<MaterialKind | "all">("all");
  const [sort, setSort] = useState<Sort>("recommended");
  const [showCode, setShowCode] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [held, setHeld] = useState(false);
  const [menu, setMenu] = useState(false);
  // The visible platform, by id: it stays put while filters change, and falls back to the first match.
  const [activeId, setActiveId] = useState(TECH_DOCS[0].id);
  const [copied, setCopied] = useState("");
  // Each platform remembers which page of its materials is open.
  const [materialPage, setMaterialPage] = useState<Record<string, number>>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const page = (url: string): OfficialPage | undefined => official?.pages[url];

  const terms = norm(query).split(" ").filter(t => t.length > 1);
  const matches = (haystack: string) => terms.every(term => haystack.includes(term));
  const materialText = (m: TechMaterial) => { const p = page(m.url); return norm([m.title, m.summary, p?.title, p?.description, ...(p?.sections ?? []), ...m.topics].join(" ")); };
  const techText = (t: TechDoc) => norm([t.name, t.version, t.release, t.tagline, page(t.docs)?.description, ...t.aliases, ...t.features].join(" "));

  const slides = (preview ? TECH_DOCS.slice(0, 1) : TECH_DOCS)
    .filter(tech => category === "all" || tech.category === category)
    .map(tech => {
      const techHit = !terms.length || matches(techText(tech));
      let items = tech.materials.filter(m => (!levels.length || levels.includes(m.level)) && (kind === "all" || m.kind === kind) && (techHit || matches(materialText(m))));
      if (sort === "quick") items = [...items].sort((a, b) => a.minutes - b.minutes);
      if (sort === "az") items = [...items].sort((a, b) => (page(a.url)?.title || a.title).localeCompare(page(b.url)?.title || b.title));
      return { tech, items, techHit };
    })
    .filter(slide => slide.items.length > 0 || (slide.techHit && !levels.length && kind === "all"));

  const total = slides.length;
  const current = Math.max(0, slides.findIndex(s => s.tech.id === activeId));
  const slide = slides[current];
  const running = !preview && autoplay && !held && !menu && total > 1;
  const nextId = slides[(current + 1) % Math.max(1, total)]?.tech.id;
  useEffect(() => {
    if (!running || !nextId) return;
    const timer = window.setTimeout(() => setActiveId(nextId), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [running, activeId, nextId]);
  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(false); };
    const esc = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setMenu(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [menu]);

  const suggestions: Suggestion[] = [];
  if (terms.length) {
    for (const tech of TECH_DOCS) {
      if (matches(norm([tech.name, ...tech.aliases].join(" ")))) suggestions.push({ key: `t:${tech.id}`, kind: "tech", label: tech.name, detail: tech.release, tech, value: tech.name });
      for (const feature of tech.features) if (matches(norm(feature))) suggestions.push({ key: `f:${tech.id}:${feature}`, kind: "feature", label: feature, detail: tech.name, tech, value: feature });
      for (const m of tech.materials) { const title = page(m.url)?.title || m.title; if (matches(materialText(m))) suggestions.push({ key: `m:${m.id}`, kind: "material", label: title, detail: `${tech.name} · ${host(m.url)}`, tech, value: title }); }
    }
    const rank = { tech: 0, feature: 1, material: 2 };
    suggestions.sort((a, b) => rank[a.kind] - rank[b.kind]).splice(8);
  }
  const listOpen = focusSuggest && suggestions.length > 0;

  // A suggestion fills the search and brings its platform into view.
  const choose = (s: Suggestion) => { setQuery(s.value); setFocusSuggest(false); setCursor(-1); setCategory("all"); setActiveId(s.tech.id); };

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setFocusSuggest(true); setCursor(c => (c + 1) % suggestions.length); }
    else if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setCursor(c => (c <= 0 ? suggestions.length : c) - 1); }
    else if (event.key === "Enter" && listOpen && cursor >= 0) { event.preventDefault(); choose(suggestions[cursor]); }
    else if (event.key === "Escape") { if (listOpen) setFocusSuggest(false); else setQuery(""); }
  };
  const go = (step: number) => { if (total) setActiveId(slides[(current + step + total) % total].tech.id); };
  const toggleLevel = (level: MaterialLevel) => setLevels(list => list.includes(level) ? list.filter(l => l !== level) : [...list, level]);
  const filtered = !!query || category !== "all" || levels.length > 0 || kind !== "all" || sort !== "recommended";
  const reset = () => { setQuery(""); setCategory("all"); setLevels([]); setKind("all"); setSort("recommended"); setMenu(false); };
  const copy = async (tech: TechDoc) => { try { await navigator.clipboard.writeText(tech.quickStart.code); setCopied(tech.id); window.setTimeout(() => setCopied(""), 1600); } catch { /* clipboard blocked */ } };
  const versionOf = (tech: TechDoc) => official?.versions[tech.id];
  const categoryCount = (id: TechDocCategory | "all") => TECH_DOCS.filter(t => id === "all" || t.category === id).length;

  let body: ReactNode;
  if (!slide) body = <div className={styles.empty} role="status">
    <Search size={22} aria-hidden="true" />
    <p><strong>{text("No documentation matches these filters.", "इन फ़िल्टरों से कोई दस्तावेज़ नहीं मिला।")}</strong> {text("Try another word, or clear the filters.", "दूसरा शब्द आज़माएँ या फ़िल्टर हटाएँ।")}</p>
    <button type="button" className={styles.resetButton} onClick={reset}><RotateCcw size={14} aria-hidden="true" />{text("Clear search and filters", "खोज और फ़िल्टर हटाएँ")}</button>
  </div>;
  else {
    const { tech, items } = slide;
    const docsPage = page(tech.docs);
    const version = versionOf(tech);
    const pages = Math.max(1, Math.ceil(items.length / MATERIAL_PAGE));
    const at = preview ? 1 : Math.min(materialPage[tech.id] ?? 1, pages);
    const shown = items.slice((at - 1) * MATERIAL_PAGE, at * MATERIAL_PAGE);
    const turn = (n: number) => setMaterialPage(map => ({ ...map, [tech.id]: n }));
    body = <article key={tech.id} className={styles.slide} style={{ "--ink": tech.tone.ink, "--tint": tech.tone.tint, "--glow": tech.tone.glow } as React.CSSProperties}
      aria-roledescription="slide" aria-label={`${current + 1} / ${total}: ${tech.name}`}>
      <div className={styles.overview}>
        <div className={styles.brandRow}>
          <span className={styles.brand}><BrandIcon tech={tech} /></span>
          <div>
            <h3>{tech.name}</h3>
            <p className={styles.release}>{tech.release}</p>
          </div>
        </div>
        <p className={styles.version} title={version ? `${text("Current release from", "वर्तमान संस्करण स्रोत")} ${version.source}` : undefined}>
          <span>{text("Current", "वर्तमान")}</span><b>{version?.version ?? tech.version}</b>{version?.date && <small>{shortDate(version.date)}</small>}
        </p>
        <p className={styles.tagline}>{docsPage?.complete && docsPage.description ? docsPage.description : tech.tagline}</p>
        <ul className={styles.features} aria-label={text("Core features", "मुख्य विशेषताएँ")}>{tech.features.map(f => <li key={f}><Marked text={f} terms={terms} /></li>)}</ul>
        {showCode && <figure className={styles.code}>
          <figcaption><Code2 size={14} aria-hidden="true" /><span>{tech.quickStart.file}</span>
            <button type="button" onClick={() => void copy(tech)} aria-label={text("Copy quick start code", "क्विक स्टार्ट कोड कॉपी करें")}>{copied === tech.id ? <Check size={14} /> : <Copy size={14} />}{copied === tech.id ? text("Copied", "कॉपी हुआ") : text("Copy", "कॉपी")}</button>
          </figcaption>
          <pre tabIndex={0}><code>{tech.quickStart.code}</code></pre>
        </figure>}
        <a className={styles.docsLink} href={tech.docs} target="_blank" rel="noopener noreferrer">{text("Open the official docs", "आधिकारिक डॉक्स खोलें")} · {host(tech.docs)}<ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
      <div className={styles.materials}>
        <p className={styles.materialsHead}><span>{text("Learning materials", "अध्ययन सामग्री")}</span><b>{items.length}</b>{pages > 1 && <small>{text(`Showing ${(at - 1) * MATERIAL_PAGE + 1}–${(at - 1) * MATERIAL_PAGE + shown.length}`, `${(at - 1) * MATERIAL_PAGE + 1}–${(at - 1) * MATERIAL_PAGE + shown.length} दिखाए गए`)}</small>}</p>
        {items.length ? <ol key={at}>{shown.map(m => {
          const p = page(m.url); const KindIcon = KIND_ICON[m.kind]; const LevelIcon = LEVEL_ICON[m.level];
          const title = p?.complete ? p.title : m.title;
          return <li key={m.id}>
            <a href={m.url} target="_blank" rel="noopener noreferrer" className={styles.material}>
              <span className={styles.materialMeta}>
                <span className={styles.kind}><KindIcon size={13} aria-hidden="true" />{MATERIAL_KINDS.find(k => k.id === m.kind)?.label.replace(/s$/, "")}</span>
                <span className={styles.level} data-level={m.level}><LevelIcon size={12} aria-hidden="true" />{MATERIAL_LEVELS.find(l => l.id === m.level)?.label}</span>
                <span className={styles.minutes}>{m.minutes} min</span>
              </span>
              <strong><Marked text={title} terms={terms} /></strong>
              <span className={styles.summary}>{p?.description || m.summary}</span>
              {!!p?.sections.length && <span className={styles.sections}><span>{text("Inside:", "अंदर:")}</span>{p.sections.slice(0, 4).map(s => <i key={s}>{s}</i>)}</span>}
              <span className={styles.source}>
                {p?.complete ? <span className={styles.official}><Check size={12} aria-hidden="true" />{text("From", "स्रोत")} {host(m.url)}</span> : <span>{host(m.url)}</span>}
                {p?.fetchedAt && <span>{text("Fetched", "प्राप्त")} {shortDate(p.fetchedAt)}</span>}
                <ArrowUpRight size={14} aria-hidden="true" className={styles.out} />
              </span>
            </a>
          </li>;
        })}</ol> : null}
        {!preview && pages > 1 && <div className={styles.materialPager} role="group" aria-label={text("Materials pages", "सामग्री पेज")}>
          <button type="button" onClick={() => turn(at - 1)} disabled={at === 1} aria-label={text("Previous materials", "पिछली सामग्री")}><ChevronLeft size={15} /></button>
          {Array.from({ length: pages }, (_, i) => <button key={i} type="button" aria-current={at === i + 1 ? "page" : undefined} onClick={() => turn(i + 1)} aria-label={text(`Materials page ${i + 1}`, `सामग्री पेज ${i + 1}`)}>{i + 1}</button>)}
          <button type="button" onClick={() => turn(at + 1)} disabled={at === pages} aria-label={text("Next materials", "अगली सामग्री")}><ChevronRight size={15} /></button>
        </div>}
        {items.length ? null : <p className={styles.noItems}>{text("This platform matches your search; its materials are hidden by the level or type filter.", "यह प्लेटफ़ॉर्म खोज से मेल खाता है; स्तर या प्रकार फ़िल्टर से सामग्री छिपी है।")}</p>}
      </div>
    </article>;
  }

  return <section id="tech-docs" className={`${frame.section} ${styles.section}`} data-ground="paper" aria-labelledby={`${uid}-title`}><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><BookOpen size={14} aria-hidden="true" />{text("Technology docs", "तकनीकी डॉक्स")}<span>{TECH_DOCS.length} {text("platforms", "प्लेटफ़ॉर्म")}</span></p>
        <h2 id={`${uid}-title`}>{text("Learn from the source, ", "स्रोत से सीखें, ")}<em>{text("latest releases.", "नवीनतम संस्करण।")}</em></h2>
      </div>
      <p className={frame.lede}>{text("Angular 22, Vue 3.5, Salesforce API 68, Node.js 26, OpenRouter and the Vercel AI Gateway: every guide below is read from its official website, with the current release from the official registry.", "Angular 22, Vue 3.5, Salesforce API 68, Node.js 26, OpenRouter और Vercel AI Gateway: नीचे हर गाइड उसकी आधिकारिक वेबसाइट से ली गई है, और वर्तमान संस्करण आधिकारिक रजिस्ट्री से।")}</p>
    </header>

    {!preview && <div className={styles.toolbar}>
      <div className={styles.searchWrap}>
        <div className={styles.search}>
          <Search size={17} aria-hidden="true" className={styles.searchIcon} />
          <input type="search" role="combobox" aria-expanded={listOpen} value={query} placeholder={text("Search docs, features or guides, e.g. signals, Temporal, fallbacks…", "डॉक्स, फ़ीचर या गाइड खोजें…")}
            aria-label={text("Search technology docs", "तकनीकी डॉक्स खोजें")} aria-autocomplete="list" aria-controls={`${uid}-list`}
            aria-activedescendant={listOpen && cursor >= 0 ? `${uid}-opt-${cursor}` : undefined}
            onChange={e => { setQuery(e.target.value); setFocusSuggest(true); setCursor(-1); }} onKeyDown={onSearchKey}
            onFocus={() => setFocusSuggest(true)} onBlur={() => window.setTimeout(() => setFocusSuggest(false), 120)} />
          {query && <button type="button" className={styles.clear} onClick={() => { setQuery(""); setCursor(-1); }} aria-label={text("Clear search", "खोज साफ़ करें")}><X size={15} /></button>}
        </div>
        {listOpen && <ul id={`${uid}-list`} role="listbox" className={styles.suggestions} aria-label={text("Suggestions", "सुझाव")}>
          {suggestions.map((s, i) => <li key={s.key} id={`${uid}-opt-${i}`} role="option" aria-selected={i === cursor} onMouseDown={e => { e.preventDefault(); choose(s); }} onMouseEnter={() => setCursor(i)}>
            <span className={styles.suggestIcon} style={{ color: s.tech.tone.ink, background: s.tech.tone.tint }}>{s.kind === "tech" ? <BrandIcon tech={s.tech} size={15} /> : s.kind === "feature" ? <Code2 size={14} /> : <BookOpen size={14} />}</span>
            <span><b><Marked text={s.label} terms={terms} /></b><small>{s.kind === "tech" ? text("Platform", "प्लेटफ़ॉर्म") : s.kind === "feature" ? text("Feature", "फ़ीचर") : text("Guide", "गाइड")} · {s.detail}</small></span>
          </li>)}
        </ul>}
      </div>

      <div className={styles.filters}>
        <div className={styles.chips} role="group" aria-label={text("Platform type", "प्लेटफ़ॉर्म प्रकार")}>
          {(["all", ...TECH_DOC_CATEGORIES.map(c => c.id)] as const).map(id => { const Icon = CATEGORY_ICON[id]; const label = id === "all" ? text("All", "सभी") : TECH_DOC_CATEGORIES.find(c => c.id === id)!.label;
            return <button key={id} type="button" className={styles.chip} aria-pressed={category === id} onClick={() => setCategory(id)} title={label} aria-label={`${label} (${categoryCount(id)})`}><Icon size={15} aria-hidden="true" /><span>{label}</span><small>{categoryCount(id)}</small></button>; })}
        </div>
        <div className={styles.chips} role="group" aria-label={text("Level", "स्तर")}>
          {MATERIAL_LEVELS.map(level => { const Icon = LEVEL_ICON[level.id];
            return <button key={level.id} type="button" className={styles.chip} data-level={level.id} aria-pressed={levels.includes(level.id)} onClick={() => toggleLevel(level.id)} title={level.label} aria-label={level.label}><Icon size={15} aria-hidden="true" /><span>{level.label}</span></button>; })}
        </div>
        <div className={styles.more} ref={menuRef}>
          <button type="button" className={styles.chip} aria-expanded={menu} aria-haspopup="true" onClick={() => setMenu(m => !m)} title={text("More options", "और विकल्प")} aria-label={text("More options", "और विकल्प")}><SlidersHorizontal size={15} aria-hidden="true" /><span>{text("More options", "और विकल्प")}</span>{(kind !== "all" || sort !== "recommended") && <i className={styles.dot} aria-hidden="true" />}</button>
          {menu && <div className={styles.menu} role="group" aria-label={text("More options", "और विकल्प")}>
            <p className={styles.menuLabel}>{text("Material type", "सामग्री प्रकार")}</p>
            <div className={styles.menuGrid}>
              <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")}><LayoutGrid size={14} aria-hidden="true" />{text("All types", "सभी प्रकार")}</button>
              {MATERIAL_KINDS.map(k => { const Icon = KIND_ICON[k.id]; return <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}><Icon size={14} aria-hidden="true" />{k.label}</button>; })}
            </div>
            <p className={styles.menuLabel}>{text("Sort guides", "गाइड क्रम")}</p>
            <div className={styles.menuGrid}>
              {([["recommended", text("Recommended", "सुझाया क्रम")], ["quick", text("Quickest first", "सबसे छोटे पहले")], ["az", "A–Z"]] as [Sort, string][]).map(([id, label]) =>
                <button key={id} type="button" aria-pressed={sort === id} onClick={() => setSort(id)}>{label}</button>)}
            </div>
            <label className={styles.toggle}><input type="checkbox" checked={showCode} onChange={e => setShowCode(e.target.checked)} />{text("Show quick-start code", "क्विक-स्टार्ट कोड दिखाएँ")}</label>
            <label className={styles.toggle}><input type="checkbox" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} />{text("Autoplay every 2 minutes", "हर 2 मिनट में ऑटोप्ले")}</label>
            <button type="button" className={styles.resetButton} onClick={reset} disabled={!filtered}><RotateCcw size={14} aria-hidden="true" />{text("Reset search and filters", "खोज और फ़िल्टर रीसेट करें")}</button>
          </div>}
        </div>
      </div>
      {filtered && <p className={styles.active} role="status">{text(`${total} of ${TECH_DOCS.length} platforms shown`, `${TECH_DOCS.length} में से ${total} प्लेटफ़ॉर्म`)} <button type="button" onClick={reset}>{text("Clear all", "सब हटाएँ")}</button></p>}
    </div>}

    <div className={styles.carousel} aria-roledescription="carousel" aria-label={text("Technology documentation", "तकनीकी दस्तावेज़")}
      onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocusCapture={() => setHeld(true)} onBlurCapture={() => setHeld(false)}>
      <div className={styles.stage} aria-live={running ? "off" : "polite"}>{body}</div>
      {!preview && total > 0 && <nav className={styles.pager} aria-label={text("Technology docs pages", "तकनीकी डॉक्स पेज")}>
        <button type="button" className={styles.arrow} onClick={() => go(-1)} disabled={total < 2} aria-label={text("Previous platform", "पिछला प्लेटफ़ॉर्म")}><ChevronLeft size={18} /></button>
        <ol className={styles.pages}>{slides.map((s, i) => <li key={s.tech.id}>
          <button type="button" aria-current={i === current ? "page" : undefined} onClick={() => setActiveId(s.tech.id)} style={{ "--ink": s.tech.tone.ink, "--tint": s.tech.tone.tint } as React.CSSProperties}>
            <span className={styles.pageIcon}><BrandIcon tech={s.tech} size={15} /></span><span className={styles.pageName}>{s.tech.name}</span><span className={styles.pageNo}>{i + 1}</span>
            {i === current && running && <i key={`run-${current}`} className={styles.progress} style={{ animationDuration: `${SLIDE_MS}ms` }} aria-hidden="true" />}
          </button>
        </li>)}</ol>
        <span className={styles.count} aria-live="polite">{current + 1} / {total}</span>
        <button type="button" className={styles.arrow} onClick={() => setAutoplay(a => !a)} aria-pressed={!autoplay} aria-label={autoplay ? text("Pause autoplay", "ऑटोप्ले रोकें") : text("Start autoplay", "ऑटोप्ले चलाएँ")}>{autoplay ? <Pause size={16} /> : <Play size={16} />}</button>
        <button type="button" className={styles.arrow} onClick={() => go(1)} disabled={total < 2} aria-label={text("Next platform", "अगला प्लेटफ़ॉर्म")}><ChevronRight size={18} /></button>
      </nav>}
    </div>
    {preview && <DashboardMore href={locked ? "/dashboard?tab=plans" : "/dashboard#tech-docs"} title={locked ? text(`Subscribe to open all ${TECH_DOCS.length} platforms`, `सभी ${TECH_DOCS.length} प्लेटफ़ॉर्म खोलने के लिए सदस्यता लें`) : text(`See all ${TECH_DOCS.length} platforms`, `सभी ${TECH_DOCS.length} प्लेटफ़ॉर्म देखें`)} detail={text("Every platform, guide, search and filter is in your dashboard.", "हर प्लेटफ़ॉर्म, गाइड, खोज और फ़िल्टर आपके डैशबोर्ड में है।")} />}
    <p className={styles.footnote}>{official ? text(`Guides read from the official websites, last refreshed ${shortDate(official.fetchedAt)}. Versions from npm and nodejs.org.`, `गाइड आधिकारिक वेबसाइटों से, अंतिम अपडेट ${shortDate(official.fetchedAt)}। संस्करण npm और nodejs.org से।`) : text("Links go to each platform's official documentation.", "लिंक हर प्लेटफ़ॉर्म के आधिकारिक दस्तावेज़ पर जाते हैं।")}</p>
  </div></section>;
}
