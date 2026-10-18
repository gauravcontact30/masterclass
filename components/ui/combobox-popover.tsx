"use client";
import { useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import type { ComboboxProps } from "./combobox";

/**
 * The full searchable, groupable select (Popover + Command/cmdk). Loaded on demand by ./combobox, which renders
 * an identical trigger until the first hover, focus or tap, so cmdk and the popover stay out of first-load JS.
 * The trigger carries an inline clear (X) once something is chosen; the popover's search box has its own
 * "Clear search" affordance so a mistyped query never has to be backspaced character by character.
 */
export default function ComboboxPopover({ value, onChange, groups, placeholder, searchPlaceholder, emptyText, clearLabel, ariaLabel, icon: Icon, disabled, id, defaultOpen = false }: ComboboxProps & { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const selected = groups.flatMap(g => g.options).find(o => o.value === value);
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (!next) setQuery(""); }}>
    <PopoverTrigger id={id} type="button" disabled={disabled} aria-label={ariaLabel} data-open={open || undefined} className="combobox-trigger">
      {Icon && <span className="combobox-icon" aria-hidden="true"><Icon size={15} /></span>}
      <span className={selected ? "combobox-value" : "combobox-placeholder"}>{selected ? selected.label : placeholder}</span>
      {selected
        ? <span role="button" tabIndex={0} className="combobox-clear-value" aria-label={clearLabel} onClick={e => { e.stopPropagation(); onChange(""); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); onChange(""); } }}><X size={14} /></span>
        : <ChevronsUpDown size={15} className="combobox-chevron" aria-hidden="true" />}
    </PopoverTrigger>
    <PopoverContent align="start" className="combobox-content" sideOffset={6}>
      <Command>
        <div className="combobox-search-row">
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          {query && <button type="button" className="combobox-clear-search" onClick={() => setQuery("")}><X size={12} />{clearLabel}</button>}
        </div>
        <CommandList>
          <CommandEmpty>{emptyText}</CommandEmpty>
          {groups.map(group => group.options.length ? <CommandGroup key={group.label} heading={group.label}>
            {group.options.map(opt => <CommandItem key={opt.value} value={opt.value} keywords={[opt.label]} data-checked={opt.value === value || undefined} onSelect={() => { onChange(opt.value); setQuery(""); setOpen(false); }}>{opt.label}</CommandItem>)}
          </CommandGroup> : null)}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}
