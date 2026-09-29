"use client";

import { useId, useState } from "react";
import { z } from "zod";
import { englishWordSchema, type WordLookup } from "@/lib/english-word";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { VocabularyWordCard } from "./vocabulary-word-card";
import { Button } from "./ui/button";
import { Popover, PopoverTrigger, PopoverContent, PopoverTitle } from "./ui/popover";
import { Label } from "./ui/label";
import { NativeSelect, NativeSelectOption } from "./ui/native-select";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "./ui/input-group";
import searchStyles from "./answer-search.module.css";
import { Pager } from "./pager";
import styles from "./vocabulary-history.module.css";

const cardSchema = z.object({ entry: englishWordSchema, source: z.enum(["library", "dictionary", "ai"]), notice: z.string().optional(), at: z.number().finite(), checked: z.boolean().optional(), language: z.enum(["en", "hi"]).optional() });
export type WordHistoryCard = WordLookup & { at: number; checked?: boolean; language?: "en" | "hi" };

export function readWordHistory(key: string): WordHistoryCard[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(stored)) return [];
    const seen = new Set<string>();
    return stored.flatMap(value => {
      const card = cardSchema.safeParse(value);
      if (!card.success) return [];
      const word = card.data.entry.word.toLowerCase();
      if (seen.has(word)) return [];
      seen.add(word);
      return [card.data];
    }).slice(0, 150);
  } catch { return []; }
}

export function saveWordHistory(key: string, cards: WordHistoryCard[]) {
  if (!cards.length) {
    try { localStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
    return;
  }
  // Keep the newest words even when the browser's storage is nearly full.
  for (let count = cards.length; count > 0; count--) {
    try { localStorage.setItem(key, JSON.stringify(cards.slice(0, count))); return; }
    catch { /* Retry with fewer cards; the current session retains them all. */ }
  }
}

export function VocabularyHistory({ cards, selectedWord, onOpen, onUpdate, onDelete }: {
  cards: WordHistoryCard[]; selectedWord?: string; onOpen: (card: WordLookup) => void; onUpdate: (word: string, changes: { checked?: boolean; language?: "en" | "hi" }) => void; onDelete: (word: string) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [details, setDetails] = useState("all");
  const [sort, setSort] = useState("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const needle = query.trim().toLowerCase();
  const found = cards.filter(card => {
    const entry = card.entry;
    const text = [entry.word, entry.meaning, entry.hindi, entry.sentence, ...entry.synonyms.flatMap(pair => [pair.word, pair.hindi]), ...entry.antonyms.flatMap(pair => [pair.word, pair.hindi])].join(" ").toLowerCase();
    return text.includes(needle)
      && (details === "all" || (details === "hindi" ? !!entry.hindi : details === "synonyms" ? entry.synonyms.length > 0 : entry.antonyms.length > 0));
  }).sort((a, b) => sort === "az" ? a.entry.word.localeCompare(b.entry.word) : sort === "oldest" ? a.at - b.at : b.at - a.at);
  const CARDS_PER_PAGE = 2;
  const pages = Math.max(1, Math.ceil(found.length / CARDS_PER_PAGE));
  const current = Math.min(page, pages - 1);
  const activeFilters = Number(details !== "all") + Number(sort !== "recent");
  const filtered = query !== "" || details !== "all" || sort !== "recent";

  return <section className={`${searchStyles.history} ${styles.history}`} aria-labelledby={`${id}-heading`}>
    <header className={`${searchStyles.historyHead} ${styles.historyHead}`}><div><h2 id={`${id}-heading`}>Your vocabulary</h2><p>Two words at a time. Listen, explore, and mark what you’ve learned.</p></div><span className={searchStyles.historyCount}>{found.length} of {cards.length} saved · {cards.filter(card => card.checked).length} learned</span></header>
    <div className={styles.toolbar}>
      <div className={styles.search}>
        <Label className={searchStyles.srOnly} htmlFor={`${id}-search`}>Search cards</Label>
        <InputGroup className={styles.searchField}>
          <InputGroupAddon><Search size={15} aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput id={`${id}-search`} type="search" placeholder="Word, meaning or Hindi…" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} />
          {query && <InputGroupAddon align="inline-end"><InputGroupButton aria-label="Clear search" size="icon-xs" onClick={() => { setQuery(""); setPage(0); }}><X size={14} /></InputGroupButton></InputGroupAddon>}
        </InputGroup>
      </div>
      <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
        <PopoverTrigger render={<Button type="button" variant="outline" size="icon" className={styles.filterTrigger} aria-label="Filters" title="Filters" />}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          {activeFilters > 0 && <span className={styles.filterBadge} aria-hidden="true">{activeFilters}</span>}
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className={styles.filterPanel}>
          <div className={styles.filterPanelHead}><PopoverTitle>Filters</PopoverTitle><Button type="button" variant="ghost" size="icon-xs" aria-label="Close filters" onClick={() => setFiltersOpen(false)}><X size={14} /></Button></div>
      <Label className={styles.filter}>Word details<NativeSelect value={details} onChange={event => { setDetails(event.target.value); setPage(0); }}><NativeSelectOption value="all">All words</NativeSelectOption><NativeSelectOption value="hindi">With Hindi meaning</NativeSelectOption><NativeSelectOption value="synonyms">With synonyms</NativeSelectOption><NativeSelectOption value="antonyms">With antonyms</NativeSelectOption></NativeSelect></Label>
      <Label className={styles.filter}>Sort by<NativeSelect value={sort} onChange={event => { setSort(event.target.value); setPage(0); }}><NativeSelectOption value="recent">Newest first</NativeSelectOption><NativeSelectOption value="oldest">Oldest first</NativeSelectOption><NativeSelectOption value="az">A–Z</NativeSelectOption></NativeSelect></Label>
      <div className={styles.filterPanelActions}>{filtered && <Button type="button" variant="ghost" size="sm" className={styles.clearFilters} onClick={() => { setQuery(""); setDetails("all"); setSort("recent"); setPage(0); }}>Clear filters</Button>}<Button type="button" size="sm" onClick={() => setFiltersOpen(false)}>Done</Button></div>
        </PopoverContent>
      </Popover>
    </div>
    {found.length ? <ul className={styles.cardGrid} key={current}>{found.slice(current * CARDS_PER_PAGE, current * CARDS_PER_PAGE + CARDS_PER_PAGE).map(card => <li className={styles.cardShell} key={card.entry.word.toLowerCase()}>
      <VocabularyWordCard card={card} selected={selectedWord?.toLowerCase() === card.entry.word.toLowerCase()} onOpen={() => onOpen(card)} onUpdate={changes => onUpdate(card.entry.word, changes)} onDelete={() => onDelete(card.entry.word)} />
    </li>)}</ul> : <div className={styles.empty} role="status"><Search size={20} aria-hidden="true" /><p>{cards.length ? "No words match these filters. Try another search or clear the filters." : "Look up your first word below to start your vocabulary collection."}</p></div>}
    {pages > 1 && <Pager page={current} pages={pages} onPage={setPage} label="Vocabulary history pages" />}
  </section>;
}
