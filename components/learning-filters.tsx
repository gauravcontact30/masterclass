"use client";


import { useEffect, useRef } from "react";
import { Search, X, type LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useLanguage } from "./language-provider";
import { SearchFilterPanel, type PanelText } from "./search-filter-panel";
import styles from "./learning-filters.module.css";

export type LearningFilter = {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

export function LearningSearch({ value, onChange, label }: { value: string; onChange: (value: string) => void; label?: string }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !document.querySelector('[role="dialog"]')) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  return <div className={styles.search}>
    <Search size={21} aria-hidden="true" />
    <Input ref={inputRef} type="search" aria-label={label ?? (hi ? "अपने सभी नोट्स खोजें" : "Search all your learning")} placeholder={hi ? "कक्षा, विषय, परीक्षा या कोर्स खोजें…" : "Search class, subject, examination or course…"} value={value} onChange={event => onChange(event.target.value)} className={styles.searchInput} />
    {value && <Button type="button" variant="ghost" size="icon-sm" className={styles.clearSearch} aria-label={hi ? "खोज साफ़ करें" : "Clear learning search"} onClick={() => { onChange(""); inputRef.current?.focus(); }}><X size={16} /></Button>}
    <kbd aria-hidden="true">Ctrl K</kbd>
  </div>;
}

/** Bilingual labels for the shared search and filters panel on learning pages. */
export function learningPanelText(hi: boolean, { searchLabel, results, size }: { searchLabel: string; results: string; size?: string }): PanelText {
  return {
    title: hi ? "अपना अगला विषय खोजें" : "Find your next topic",
    description: hi ? "विवरण खोजें। अपनी पढ़ाई पर ध्यान दें।" : "Search the details. Focus your learning.",
    size, searchLabel, results,
    searchPlaceholder: hi ? "कक्षा, विषय, तकनीक, परीक्षा या कोर्स खोजें…" : "Search class, subject, technology, examination or course…",
    clearSearch: hi ? "खोज साफ़ करें" : "Clear learning search",
    clear: hi ? "फ़िल्टर साफ़ करें" : "Clear filters",
    active: count => hi ? `${count} सक्रिय` : `${count} active`,
    activeFilters: hi ? "सक्रिय फ़िल्टर" : "Active learning filters",
    removeSearch: hi ? "खोज हटाएँ" : "Remove search",
    remove: label => `${hi ? "हटाएँ" : "Remove"} ${label}`,
    searchOption: label => `${hi ? "खोजें" : "Search"} ${label}`,
    optionPlaceholder: () => hi ? "विकल्प खोजें…" : "Find an option…",
    noOptions: hi ? "कोई विकल्प नहीं मिला।" : "No options found.",
    pickerHint: hi ? ["↑ ↓ चुनें", "↵ लागू करें", "Esc बंद करें"] : undefined,
  };
}

export function LearningFilters({ search, onSearchChange, searchLabel, filters, loading, total, size, onReset }: {
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  filters: LearningFilter[];
  loading: boolean;
  total: number;
  size?: string;
  onReset: () => void;
}) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const results = loading ? hi ? "लोड हो रहा है…" : "Loading…" : hi ? `${total} गाइड मिले` : `${total} ${total === 1 ? "guide" : "guides"} found`;
  return <SearchFilterPanel label={hi ? "अध्ययन खोज और फ़िल्टर" : "Learning search and filters"} query={search} onQueryChange={onSearchChange} filters={filters} onClear={onReset} text={learningPanelText(hi, { searchLabel, results, size })} />;
}
