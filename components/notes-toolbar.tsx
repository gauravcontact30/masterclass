"use client";

import { Code2, Info, Layers, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { STUDY_FILTERS, type NotesTechnology } from "@/lib/notes-study";
import { SearchFilterPanel, type PanelOption } from "./search-filter-panel";
import styles from "./notes-toolbar.module.css";

type Props = {
  query: string; onQueryChange: (value: string) => void;
  technology: string; onTechnologyChange: (value: string) => void;
  kind: string; onKindChange: (value: string) => void;
  priority: number; onPriorityChange: (value: number) => void;
  technologies: NotesTechnology[]; counts: Record<string, number>;
  resultCount: number; technologyCount: number; onClear: () => void;
};

export function NotesToolbar(props: Props) {
  const { query, onQueryChange, technology, onTechnologyChange, kind, onKindChange, priority, onPriorityChange, technologies, counts, resultCount, technologyCount, onClear } = props;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const priorityOptions: PanelOption[] = [
    { value: "", label: "All priorities", detail: "Explore the complete reference library" },
    { value: "4", label: "4–5 star priority", detail: "Core ideas and practical workflows" },
    { value: "5", label: "5 star essentials", detail: "Start with foundational concepts" },
  ];
  return <SearchFilterPanel label="Notes search and filters" searchId="notes-search" query={query} onQueryChange={onQueryChange} onClear={onClear}
    text={{
      title: "Find your next topic", description: "Search the details. Focus your learning.", size: `${total} study cards`,
      searchLabel: "Search all notes", searchPlaceholder: "Search a topic, function, service or word…", clearSearch: "Clear global search",
      results: `${resultCount} ${resultCount === 1 ? "topic" : "topics"} · ${technologyCount} ${technologyCount === 1 ? "technology" : "technologies"}`,
      clear: "Clear all", active: count => `${count} active`, activeFilters: "Active notes filters", removeSearch: "Remove search", remove: label => `Remove ${label}`,
      searchOption: label => `Search ${label}`, optionPlaceholder: label => `Find ${label.toLowerCase()}…`, noOptions: "No matching options. Try another search.",
    }}
    filters={[
      { id: "technology", label: "Technology", icon: Layers, value: technology, onChange: onTechnologyChange, options: [{ value: "", label: "All technologies", count: technologies.length, group: "Browse" }, ...technologies.map(item => ({ value: item.id, label: item.title, count: counts[item.id] ?? 0, group: item.category.replace(/^web$/, "Web development").replace(/^cloud$/, "Cloud & infrastructure") || "Technologies" }))] },
      { id: "kind", label: "Content type", icon: Code2, value: kind, onChange: onKindChange, options: STUDY_FILTERS.map((label, index) => ({ value: index ? label : "", label, group: index === 0 ? "Browse" : ["Interview questions", "Objective questions", "Vocabulary", "Synonyms", "Antonyms"].includes(label) ? "Practice & preparation" : "Concepts & reference" })) },
      { id: "priority", label: "Interview priority", icon: Star, value: priority ? String(priority) : "", onChange: value => onPriorityChange(Number(value)), options: priorityOptions },
    ]}
    footerActions={<Popover><PopoverTrigger render={<Button variant="ghost" size="sm" />} className={styles.priorityHelp} aria-label="About interview priorities"><Info size={14} />About the stars</PopoverTrigger><PopoverContent className={styles.priorityPopup} align="end"><strong>Prepare with a clear priority</strong><p>5 stars: foundational concepts.<br />4 stars: implementation workflows.<br />3 stars: supporting reference material.</p><p>These are editorial study priorities, not measured interview frequency or company-specific statistics.</p></PopoverContent></Popover>}
  />;
}
