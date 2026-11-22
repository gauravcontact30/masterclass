"use client";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { BookOpen, CornerDownLeft, Search, X } from "lucide-react";
import styles from "./exam-search.module.css";

/** One suggestion: a chapter or subject (applied as a filter) or a matching question (searched for). */
export type Suggestion = { kind: "topic" | "question"; label: string; value: string };

/**
 * The exam pages' search box with live suggestions (ARIA combobox with a listbox). Typing shows up to eight matches:
 * chapters or subjects first, then questions. Arrow keys move through them, Enter picks one, Escape closes the list,
 * and the clear button empties the search.
 */
export function ExamSearch({ value, onChange, onTopic, topics, questions, placeholder, label = "Search questions" }: {
  value: string; onChange: (value: string) => void;
  /** Picking a topic suggestion: apply it as the chapter (or subject) filter. */
  onTopic: (topic: string) => void;
  topics: string[]; questions: string[]; placeholder: string; label?: string;
}) {
  const id = useId(); const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = useMemo<Suggestion[]>(() => {
    const q = value.trim().toLowerCase(); if (q.length < 2) return [];
    const words = q.split(/\s+/);
    const hit = (text: string) => { const t = text.toLowerCase(); return words.every(w => t.includes(w)); };
    const topicHits = topics.filter(hit).slice(0, 3).map(label => ({ kind: "topic" as const, label, value: label }));
    const seen = new Set<string>(); const questionHits: Suggestion[] = [];
    for (const text of questions) {
      if (questionHits.length >= 8 - topicHits.length) break;
      if (!hit(text) || seen.has(text)) continue;
      seen.add(text); questionHits.push({ kind: "question", label: text.length > 110 ? `${text.slice(0, 107)}…` : text, value: text.length > 60 ? text.slice(0, 60).replace(/\s+\S*$/, "") : text });
    }
    return [...topicHits, ...questionHits];
  }, [value, topics, questions]);
  const shown = open && suggestions.length > 0;

  const choose = (suggestion: Suggestion) => {
    if (suggestion.kind === "topic") { onTopic(suggestion.value); onChange(""); } else onChange(suggestion.value);
    setOpen(false); setActive(-1);
  };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setOpen(true); setActive(i => (i + 1) % suggestions.length); }
    else if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setOpen(true); setActive(i => (i <= 0 ? suggestions.length - 1 : i - 1)); }
    else if (event.key === "Enter" && shown && active >= 0) { event.preventDefault(); choose(suggestions[active]); }
    else if (event.key === "Escape") { setOpen(false); setActive(-1); }
  };

  return <div className={styles.box} role="search">
    <label htmlFor={id} className={styles.srOnly}>{label}</label>
    <Search size={17} aria-hidden="true" className={styles.icon} />
    <input id={id} type="search" role="combobox" aria-expanded={shown} aria-controls={listId} aria-autocomplete="list"
      aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
      autoComplete="off" spellCheck={false} placeholder={placeholder} value={value}
      onChange={event => { onChange(event.target.value); setOpen(true); setActive(-1); }}
      onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)} onKeyDown={onKey} />
    {value && <button type="button" className={styles.clear} onClick={() => { onChange(""); setOpen(false); }} aria-label="Clear search"><X size={15} aria-hidden="true" /></button>}
    {shown && <ul id={listId} role="listbox" className={styles.list} aria-label="Suggestions">
      {suggestions.map((suggestion, index) => <li key={`${suggestion.kind}-${suggestion.label}`} id={`${listId}-${index}`} role="option" aria-selected={index === active}
        className={styles.option} data-kind={suggestion.kind} onMouseDown={event => { event.preventDefault(); choose(suggestion); }} onMouseEnter={() => setActive(index)}>
        {suggestion.kind === "topic" ? <BookOpen size={14} aria-hidden="true" /> : <Search size={14} aria-hidden="true" />}
        <span>{suggestion.label}</span>
        <small>{suggestion.kind === "topic" ? "Filter" : "Search"}</small>
        {index === active && <CornerDownLeft size={12} aria-hidden="true" className={styles.enter} />}
      </li>)}
    </ul>}
  </div>;
}
