"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";
import { Input } from "@/components/ui/input";
import { BookmarkButton, BookmarkPoint, BookmarkSection } from "./bookmarks";
import { ExpandedText } from "@/components/expanded-text";


import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Layers, Search, X, ExternalLink } from "lucide-react";
import type { ServiceEntry } from "@/lib/domain";
import { serviceDepth } from "@/lib/generation/guides/aws-service-depth";
import { KnowledgeCheck } from "./knowledge-check";
import styles from "./service-catalog.module.css";

/** Two cards per row, two rows per page — the rest is paged. */
const PAGE_SIZE = 4;
/** Stable, distinct light tints even when every service belongs to one category. */
const TINTS = 8;

const fold = (value: string) => value.toLocaleLowerCase().replace(/\s+/g, " ").trim();

/**
 * Every term a search can match: the service name, its category and the
 * significant words of its summary. Suggestions are drawn from this, so typing
 * "queue", "ddos" or "warehouse" proposes the services that actually mention it
 * rather than only matching names.
 */
function searchIndex(services: ServiceEntry[]) {
  const index = new Map<string, { term: string; kind: "service" | "category" | "topic"; matches: number }>();
  const add = (term: string, kind: "service" | "category" | "topic") => {
    const key = fold(term);
    if (key.length < 3) return;
    const existing = index.get(key);
    if (existing) existing.matches += 1;
    else index.set(key, { term, kind, matches: 1 });
  };
  for (const service of services) {
    add(service.name, "service");
    add(service.category, "category");
    for (const word of service.summary.split(/[^A-Za-z0-9+-]+/)) {
      if (word.length > 4 && !/^(which|their|there|these|those|about|where|while|being|other|rather|without|through)$/i.test(word)) add(word.toLowerCase(), "topic");
    }
  }
  return [...index.values()];
}

function matches(service: ServiceEntry, terms: string[]) {
  if (!terms.length) return true;
  const haystack = fold([service.name, service.category, service.summary, service.points.join(" ")].join(" "));
  return terms.every(term => haystack.includes(term));
}

export function ServiceCatalog({ services, hi, grouped = false, topics = false, showReferences = true, renderDetails }: { services: ServiceEntry[]; hi: boolean; grouped?: boolean; topics?: boolean; showReferences?: boolean; renderDetails?: (entry: ServiceEntry) => ReactNode }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const deferred = useDeferredValue(query);

  const categories = useMemo(() => [...new Set(services.map(service => service.category))], [services]);
  const index = useMemo(() => searchIndex(services), [services]);

  const terms = useMemo(() => fold(deferred).split(" ").filter(Boolean), [deferred]);
  const filtered = useMemo(
    () => services.filter(service => (category === "all" || service.category === category) && matches(service, terms)),
    [services, category, terms],
  );

  const suggestions = useMemo(() => {
    const typed = fold(query);
    return index
      .filter(entry => (!typed ? entry.kind === "service" : fold(entry.term).includes(typed) && fold(entry.term) !== typed))
      .sort((a, b) => (a.kind === b.kind ? b.matches - a.matches : a.kind === "service" ? -1 : b.kind === "service" ? 1 : a.kind === "category" ? -1 : 1))
      .slice(0, 7);
  }, [index, query]);


  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!boxRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const updateQuery = (value: string) => { setQuery(value); setActive(-1); };
  const choose = (value: string) => { updateQuery(value); inputRef.current?.focus(); setOpen(false); };
  const clear = () => { updateQuery(""); setCategory("all"); inputRef.current?.focus(); setOpen(false); };

  return <section className={styles.catalog} aria-label={topics ? (hi ? "विषय निर्देशिका" : "Topic directory") : hi ? "सेवा निर्देशिका" : "Service directory"}>
    <header className={styles.head}>
      <span className={styles.eyebrow}><Layers size={14} aria-hidden="true" /><ExpandedText text={topics ? (hi ? "विषय निर्देशिका" : "TOPIC DIRECTORY") : hi ? "सेवा निर्देशिका" : "SERVICE DIRECTORY"} /></span>
      <span className={styles.count}>{filtered.length} <ExpandedText text={topics ? (hi ? "विषय" : "topics") : hi ? "संदर्भ" : grouped ? "references" : filtered.length === 1 ? "service" : "services"} /></span>
    </header>

    <div className={styles.searchRow} ref={boxRef}>
      <div className={styles.searchBox}>
        <Search size={15} aria-hidden="true" />
        <Input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label={topics ? (hi ? "विषय खोजें" : "Search topics") : hi ? "सेवाएँ खोजें" : "Search services"}
          aria-activedescendant={open && active >= 0 && suggestions[active] ? `${id}-suggestion-${active}` : undefined}
          aria-expanded={open && suggestions.length > 0}
          aria-controls={`${id}-suggestions`}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={topics ? (hi ? "विषय, API या मुख्य विचार खोजें" : "Search a topic, API or key idea") : hi ? "सेवा, श्रेणी या विषय खोजें — जैसे queue, DDoS, warehouse" : "Search a service, category or topic — try queue, DDoS, warehouse"}
          value={query}
          onChange={event => { updateQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={event => { if (!boxRef.current?.contains(event.relatedTarget)) setOpen(false); }}
          onKeyDown={event => {
            if (event.key === "Escape") { setOpen(false); setActive(-1); }
            if ((event.key === "ArrowDown" || event.key === "ArrowUp") && suggestions.length) {
              event.preventDefault(); setOpen(true);
              setActive(previous => event.key === "ArrowDown" ? (previous + 1) % suggestions.length : (previous <= 0 ? suggestions.length - 1 : previous - 1));
            }
            if (event.key === "Enter" && open && suggestions[active]) { event.preventDefault(); choose(suggestions[active].term); }
          }}
        />
        {(query || category !== "all") && <button type="button" className={styles.clear} onClick={clear} aria-label={hi ? "खोज हटाएँ" : "Clear search"}>
          <X size={14} aria-hidden="true" /><ExpandedText text={hi ? "हटाएँ" : "Clear"} />
        </button>}
      </div>
      {open && suggestions.length > 0 && <ul className={styles.suggestions} id={`${id}-suggestions`} role="listbox">
        {suggestions.map((entry, index) => <li key={entry.term} id={`${id}-suggestion-${index}`} role="option" aria-selected={active === index}
          onMouseDown={event => event.preventDefault()} onClick={() => choose(entry.term)} onMouseEnter={() => setActive(index)}>
            <span className={styles.suggestionTerm}><ExpandedText text={entry.term} /></span>
            <span className={styles.suggestionKind} data-kind={entry.kind}>
              <ExpandedText text={entry.kind === "service" ? topics ? (hi ? "विषय" : "topic") : hi ? "सेवा" : "service" : entry.kind === "category" ? hi ? "श्रेणी" : "category" : hi ? "विषय" : "topic"} />
            </span>
        </li>)}
      </ul>}
    </div>

    <div className={styles.filters} role="group" aria-label={hi ? "श्रेणी" : "Category"}>
      <button type="button" aria-pressed={category === "all"} onClick={() => { setCategory("all"); }}><ExpandedText text={hi ? "सभी" : "All"} /></button>
      {categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => { setCategory(item); }}><ExpandedText text={item} /></button>)}
    </div>

    {!filtered.length ? <p className={styles.empty}><ExpandedText text={topics ? (hi ? "कोई विषय नहीं मिला। खोज हटाकर फिर देखें।" : "No topic matches that search. Clear the search to see them all.") : hi ? "कोई सेवा नहीं मिली। खोज हटाकर फिर देखें।" : "No service matches that search. Clear the search to see them all."} /></p>
      : grouped ? categories.map(title => {
        const entries = filtered.filter(service => service.category === title);
        return entries.length ? <ServicePage key={`${title}:${deferred}:${category}`} title={title} services={entries} hi={hi} topics={topics} showReferences={showReferences} renderDetails={renderDetails} /> : null;
      }) : <ServicePage key={`${deferred}:${category}`} services={filtered} hi={hi} topics={topics} showReferences={showReferences} renderDetails={renderDetails} />}
  </section>;
}

/**
 * Interview depth for the services that have it. Nothing is rendered for a
 * service without authored content, rather than an empty or invented section.
 */
function ServiceDepthSections({ name, hi }: { name: string; hi: boolean }) {
  const depth = serviceDepth(name);
  if (!depth) return null;
  return <>
    <div className={styles.block}><span className={styles.blockLabel}><ExpandedText text={hi ? "मुख्य अवधारणाएँ" : "Concepts"} /></span>
      <ul className={styles.points}>{depth.concepts.map((concept, index) => <li key={index}><ExpandedText text={concept} /></li>)}</ul>
    </div>
    <div className={styles.useCase}><span className={styles.blockLabel}><ExpandedText text={hi ? "उपयोग" : "Use case"} /></span><p><ExpandedText text={depth.useCase} /></p></div>
    <details className={styles.qa}><AccordionSummary><ExpandedText text={hi ? "इंटरव्यू प्रश्न (विषयनिष्ठ)" : "Interview questions · subjective"} /> <small>{depth.subjective.length}</small></AccordionSummary>
      {depth.subjective.map((item, index) => <section key={index}><h5>{index + 1}. <ExpandedText text={item.question} /></h5><p><ExpandedText text={item.answer} /></p></section>)}
    </details>
    <details className={styles.qa}><AccordionSummary><ExpandedText text={hi ? "वस्तुनिष्ठ प्रश्न" : "Objective questions"} /> <small>{depth.objective.length}</small></AccordionSummary>
      {depth.objective.map((item, index) => <KnowledgeCheck key={index} question={{ ...item, shortAnswer: item.options[item.correct] }} />)}
    </details>
  </>;
}

function ServicePage({ services, hi, title, topics, showReferences, renderDetails }: { services: ServiceEntry[]; hi: boolean; title?: string; topics?: boolean; showReferences?: boolean; renderDetails?: (entry: ServiceEntry) => ReactNode }) {
  const [page, setPage] = useState(0);
  const id = useId();
  const section = useRef<HTMLElement>(null);
  const pages = Math.ceil(services.length / PAGE_SIZE);
  const current = Math.min(page, pages - 1);
  const shown = services.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const changePage = (next: number) => { setPage(next); if (title) section.current?.scrollIntoView({ behavior: "auto", block: "start" }); };
  return <section ref={section} className={title ? styles.categorySection : undefined} aria-labelledby={title ? id : undefined}>
    {title && <header className={styles.categoryHeading}><div><span><ExpandedText text={hi ? "अध्ययन श्रेणी" : "EXPLORE CATEGORY"} /></span><h3 id={id}><ExpandedText text={title} /></h3></div><small>{services.length} <ExpandedText text={topics ? (hi ? "विषय" : "topics") : hi ? "संदर्भ" : "references"} /></small></header>}
    <div className={styles.grid}>
      {shown.map((service, index) => <BookmarkSection key={`${service.awsId ?? service.name}-${index}`} title={service.name}><article aria-label={service.name} className={styles.card} data-tint={services.indexOf(service) % TINTS}>
        <header><h4><ExpandedText text={service.name} /></h4><span className={styles.badge}><ExpandedText text={topics ? (hi ? "विषय" : "Topic") : service.kind === "capability" ? (hi ? "क्षमता" : "Capability") : (title ? (hi ? "सेवा" : "Service") : service.category)} /></span></header>
        <div className={styles.purpose}><span><ExpandedText text={topics ? (hi ? "मुख्य विचार" : "Key idea") : hi ? "मुख्य उद्देश्य" : "Core purpose"} /></span><p className={styles.summary}><ExpandedText text={service.summary} /></p></div>
        <div className={styles.block}><span className={styles.blockLabel}><ExpandedText text={hi ? "मुख्य विशेषताएँ" : "Key features"} /></span>
          <BookmarkButton points={[service.summary, ...service.points]} /><ul className={`${styles.points} learning-key-points pointwise`}>{service.points.map((point, index) => <li key={index}><BookmarkPoint text={point}><ExpandedText text={point} /></BookmarkPoint></li>)}</ul>
        </div>
        <ServiceDepthSections name={service.name} hi={hi} />
        {showReferences && service.sourceUrl && <a className={styles.source} href={service.sourceUrl} target="_blank" rel="noreferrer"><ExpandedText text={hi ? "आधिकारिक संदर्भ" : "Official reference"} /><ExternalLink size={12} aria-hidden="true" /></a>}
        {renderDetails?.(service)}
      </article></BookmarkSection>)}
    </div>
    {pages > 1 && <nav className={styles.pager} aria-label={title ? `${title} pages` : topics ? (hi ? "विषय पृष्ठ" : "Topic pages") : hi ? "सेवा पृष्ठ" : "Service pages"}>
      <button type="button" onClick={() => changePage(current - 1)} disabled={current === 0}><ChevronLeft size={14} aria-hidden="true" /><ExpandedText text={hi ? "पिछला" : "Previous"} /></button>
      <span className={styles.pagerCount} aria-live="polite">{current * PAGE_SIZE + 1}–{current * PAGE_SIZE + shown.length} / {services.length}</span>
      <button type="button" onClick={() => changePage(current + 1)} disabled={current === pages - 1}><ExpandedText text={hi ? "अगला" : "Next"} /><ChevronRight size={14} aria-hidden="true" /></button>
    </nav>}
  </section>;
}
