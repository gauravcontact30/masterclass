"use client";
import { ExpandedText } from "@/components/expanded-text";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Layers, RotateCcw, Search, SlidersHorizontal, X, type LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import styles from "./notes-toolbar.module.css";

export type PanelOption = { value: string; label: string; detail?: string; count?: number; group?: string };
export type PanelFilter = { id: string; label: string; icon: LucideIcon; value: string; defaultValue?: string; options: PanelOption[]; onChange: (value: string) => void };
export type PanelText = {
  title: string; description: string; size?: string;
  searchLabel: string; searchPlaceholder: string; clearSearch: string;
  results: string; clear: string; active: (count: number) => string; activeFilters: string;
  removeSearch: string; remove: (label: string) => string;
  searchOption: (label: string) => string; optionPlaceholder: (label: string) => string; noOptions: string; pickerHint?: [string, string, string];
};

/**
 * The "Find your next topic" search and filters panel shared by Notes, the
 * Dashboard and My Library, so every learning page searches the same way.
 */
export function SearchFilterPanel({ label, text, query, onQueryChange, filters, onClear, searchId, footerActions }: {
  label: string; text: PanelText; query: string; onQueryChange: (value: string) => void;
  filters: PanelFilter[]; onClear: () => void; searchId?: string; footerActions?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !document.querySelector('[role="dialog"]')) { event.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const active = filters.filter(filter => filter.value !== (filter.defaultValue ?? ""));
  const activeCount = Number(Boolean(query.trim())) + active.length;
  return <form className={styles.panel} role="search" aria-label={label} onSubmit={event => event.preventDefault()}>
    <header className={styles.header}><div><span className={styles.headerIcon}><SlidersHorizontal size={17} /></span><div><h2><ExpandedText text={text.title} /></h2><p><ExpandedText text={text.description} /></p></div></div>{text.size && <span className={styles.librarySize}><Layers size={13} /><ExpandedText text={text.size} /></span>}</header>
    <InputGroup className={styles.searchGroup}><InputGroupAddon><Search size={20} aria-hidden="true" /></InputGroupAddon><InputGroupInput ref={input} id={searchId} type="search" aria-label={text.searchLabel} aria-keyshortcuts="Control+k Meta+k" placeholder={text.searchPlaceholder} value={query} onChange={event => onQueryChange(event.target.value)} /><InputGroupAddon align="inline-end">{query && <Button type="button" variant="ghost" size="icon-sm" aria-label={text.clearSearch} onClick={() => { onQueryChange(""); input.current?.focus(); }}><X size={15} /></Button>}<kbd title="Control K or Command K" aria-hidden="true">⌘ / Ctrl K</kbd></InputGroupAddon></InputGroup>
    <div className={styles.fields} data-count={filters.length}>{filters.map(filter => <FilterPicker key={filter.id} filter={filter} text={text} />)}</div>
    {activeCount > 0 && <div className={styles.chips} aria-label={text.activeFilters}><span><ExpandedText text={text.active(activeCount)} /></span>
      {query.trim() && <Button type="button" size="sm" variant="secondary" aria-label={text.removeSearch} onClick={() => onQueryChange("")}><Search size={12} /><span>“<ExpandedText text={query} />”</span><X size={12} /></Button>}
      {active.map(filter => { const Icon = filter.icon; return <Button key={filter.id} type="button" size="sm" variant="secondary" aria-label={text.remove(filter.label)} onClick={() => filter.onChange(filter.defaultValue ?? "")}><Icon size={12} /><span><ExpandedText text={filter.options.find(option => option.value === filter.value)?.label ?? filter.value} /></span><X size={12} /></Button>; })}
    </div>}
    <footer className={styles.footer}><span className={styles.results} role="status" aria-live="polite"><i aria-hidden="true" /><ExpandedText text={text.results} /></span><div>{footerActions}<Button type="button" variant="ghost" size="sm" className={styles.reset} onClick={onClear}><RotateCcw size={13} /><ExpandedText text={text.clear} /></Button></div></footer>
  </form>;
}

function FilterPicker({ filter, text }: { filter: PanelFilter; text: PanelText }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const { label, icon: Icon, value, options, onChange } = filter;
  const selected = options.find(option => option.value === value) ?? options[0];
  const groups = [...new Set(options.map(option => option.group ?? "Options"))];
  const hint = text.pickerHint ?? ["↑ ↓ Navigate", "↵ Select", "Esc Close"];
  return <div className={styles.field}>
    <label htmlFor={id}><ExpandedText text={label} /></label>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" />} id={id} role="combobox" aria-label={label} aria-expanded={open} aria-haspopup="listbox" aria-controls={`${id}-list`} className={styles.trigger} data-active={value !== (filter.defaultValue ?? "")}>
        <span className={styles.fieldIcon}><Icon size={17} aria-hidden="true" /></span><span className={styles.selectedLabel}><ExpandedText text={selected?.label ?? ""} /></span>{selected?.count !== undefined && <small>{selected.count}</small>}<ChevronDown size={14} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className={styles.pickerPopup} align="start" sideOffset={8}>
        <Command><CommandInput aria-label={text.searchOption(label)} placeholder={text.optionPlaceholder(label)} /><CommandList id={`${id}-list`} aria-label={label}><CommandEmpty>{text.noOptions}</CommandEmpty>
          {groups.map(group => <CommandGroup key={group} heading={groups.length > 1 ? group : undefined}>{options.filter(option => (option.group ?? "Options") === group).map(option => <CommandItem key={option.value} value={option.value || "__all"} keywords={[option.label, option.group ?? ""]} data-checked={option.value === value} onSelect={() => { onChange(option.value); setOpen(false); }} className={styles.option}><span><strong><ExpandedText text={option.label} /></strong>{option.detail && <small><ExpandedText text={option.detail} /></small>}</span>{option.count !== undefined && <em>{option.count}</em>}</CommandItem>)}</CommandGroup>)}
        </CommandList></Command><div className={styles.pickerHint}>{hint.map(item => <span key={item}>{item}</span>)}</div>
      </PopoverContent>
    </Popover>
  </div>;
}
