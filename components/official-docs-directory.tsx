"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";

import learningCard from "./learning-card.module.css";
import { useId, useState } from "react";
import { DOCS_DIRECTORIES } from "@/lib/official-docs-directories";
import styles from "./official-docs-directory.module.css";

const PAGE_SIZE = 9;

export function OfficialDocsDirectory({ docId }: { docId: string }) {
  const directory = DOCS_DIRECTORIES[docId];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(0);
  const id = useId();
  if (!directory) return null;
  const categories = [...new Set(directory.entries.map(entry => entry.category))].sort();
  const matches = directory.entries.filter(entry => (category === "All" || entry.category === category) && `${entry.name} ${entry.summary} ${entry.category} ${entry.kind}`.toLowerCase().includes(query.trim().toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  return <section className={styles.directory} aria-labelledby={`${id}-title`}>
    <header><h3 id={`${id}-title`}>{directory.title}</h3><p>{directory.note}</p><a href={directory.sourceUrl} target="_blank" rel="noopener noreferrer">Official reference index ↗</a></header>
    <div className={styles.filters}>
      <label htmlFor={`${id}-search`}>Search references<input id={`${id}-search`} type="search" value={query} placeholder="Search a name or concept" onChange={e => { setQuery(e.target.value); setPage(0); }} /></label>
      <label htmlFor={`${id}-category`}>Category<select id={`${id}-category`} value={category} onChange={e => { setCategory(e.target.value); setPage(0); }}><option>All</option>{categories.map(name => <option key={name}>{name}</option>)}</select></label>
    </div>
    {docId === "aws" && <p className={styles.orderNote}>Popular services first <span>· Curated learning order, not measured usage. Service guides precede detailed API references.</span></p>}
    <p className={styles.count} role="status">{matches.length} references{matches.length > 0 && ` · ${current * PAGE_SIZE + 1}–${Math.min((current + 1) * PAGE_SIZE, matches.length)}`}</p>
    {matches.length ? <ul className={styles.entries}>{matches.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map(entry => <li key={`${entry.kind}-${entry.name}-${entry.category}`} className={learningCard.card}>
      <span className={styles.category}>{entry.category} · {entry.kind}</span>
      <h4><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.name} <span aria-hidden="true">↗</span></a></h4><p>{entry.summary}</p>
      {!!entry.points?.length && <details><AccordionSummary>Key points</AccordionSummary><ul>{entry.points.map(point => <li key={point}>{point}</li>)}</ul></details>}
    </li>)}</ul> : <p>No references match. Try a shorter search or another category.</p>}
    <nav className={styles.pagination} aria-label={`${directory.title} pagination`}>
      <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
      <span>Page {current + 1} of {pageCount}</span>
      <button type="button" disabled={current + 1 >= pageCount} onClick={() => setPage(current + 1)}>Next</button>
    </nav>
  </section>;
}
