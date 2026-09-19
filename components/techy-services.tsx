"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useMemo, useState } from "react";
import { serviceCards, servicePriority, type ServiceScope } from "@/lib/techy-services";
import styles from "./techy.module.css";

export function TechyServices({ scope }: { scope: ServiceScope }) {
  const all = useMemo(() => serviceCards(scope), [scope]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("popular");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const categories = [...new Set(all.map(entry => entry.category))].sort();
  const visible = all.filter(entry => (category === "all" || entry.category === category) && `${entry.name} ${entry.summary} ${entry.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (sort === "az") visible.sort((a, b) => a.name.localeCompare(b.name));
  const card = visible[index];
  function reset() { setIndex(0); setRevealed(false); }
  return <section className={styles.atlas} aria-label="AWS service atlas">
    <h3>Service atlas <small>{all.length} services &amp; API capabilities</small></h3>
    <p className={styles.hint}>Popular foundations first, then specialist entries. This is an editorial learning order, not measured adoption data. Unranked entries follow alphabetically; lifecycle-affected entries appear last. Availability varies by region and feature.</p>
    <div className={styles.atlasFilters}><Label>Find a service<Input type="search" value={query} placeholder="Bedrock, CodeBuild, storage…" onChange={event => { setQuery(event.target.value); reset(); }}/></Label><Label>Category<NativeSelect value={category} onChange={event => { setCategory(event.target.value); reset(); }}><NativeSelectOption value="all">All categories</NativeSelectOption>{categories.map(item => <NativeSelectOption key={item}>{item}</NativeSelectOption>)}</NativeSelect></Label><Label>Order<NativeSelect value={sort} onChange={event => { setSort(event.target.value); reset(); }}><NativeSelectOption value="popular">Popular first (editorial)</NativeSelectOption><NativeSelectOption value="az">Name A–Z</NativeSelectOption></NativeSelect></Label></div>
    <p className={styles.hint} role="status">{visible.length} matching cards · Reference review: 15 September 2026</p>
    {card ? <><Label className={styles.serviceJump}>Jump to service<NativeSelect value={card.id} onChange={event => { setIndex(visible.findIndex(entry => entry.id === event.target.value)); setRevealed(false); }}>{visible.map((entry, position) => <NativeSelectOption value={entry.id} key={entry.id}>{position + 1}. {entry.name}</NativeSelectOption>)}</NativeSelect></Label><article className={styles.flashcard}><div className={styles.cardTop}><span className={styles.cardLabel}>{card.category}</span><span className={styles.hint}>{card.kind}</span></div><h3>{card.name}</h3><p className={styles.hint}>{servicePriority(card.name, scope) < Number.MAX_SAFE_INTEGER ? "Priority learning service" : "Specialist / unranked offering"}</p><p>What does this service do, and when would you use it?</p>{card.lifecycle && <p className={styles.lifecycle}>{card.lifecycle} · <a href={card.lifecycleUrl} target="_blank" rel="noreferrer">Lifecycle source ↗</a></p>}{revealed && <div className={styles.answer}><p>{card.summary}</p><ul>{card.points.map(point => <li key={point}>{point}</li>)}</ul><a href={card.sourceUrl} target="_blank" rel="noreferrer">Official service reference ↗</a></div>}<button className={styles.reveal} aria-expanded={revealed} onClick={() => setRevealed(value => !value)}>{revealed ? "Hide service notes" : "Reveal service notes"}</button></article><div className={styles.controls}><button disabled={index === 0} onClick={() => { setIndex(index - 1); setRevealed(false); }}>Previous service</button><span className={styles.counter}>Service {index + 1} of {visible.length}</span><button disabled={index === visible.length - 1} onClick={() => { setIndex(index + 1); setRevealed(false); }}>Next service</button></div></> : <div className={styles.empty}>No services match. <button onClick={() => { setQuery(""); setCategory("all"); reset(); }}>Clear service filters</button></div>}
  </section>;
}
