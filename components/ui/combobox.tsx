"use client";
import { lazy, Suspense, useState, type ReactNode } from "react";
import { ChevronsUpDown, X, type LucideIcon } from "lucide-react";

export type ComboboxOption = { value: string; label: string };
export type ComboboxGroup = { label: string; options: ComboboxOption[] };
export type ComboboxProps = {
  value: string; onChange: (value: string) => void; groups: ComboboxGroup[];
  placeholder: string; searchPlaceholder: string; emptyText: string; clearLabel: string; ariaLabel: string; icon?: LucideIcon; disabled?: boolean; id?: string;
};

const loadPopover = () => import("./combobox-popover");
const ComboboxPopover = lazy(loadPopover);

/**
 * A searchable, groupable select for catalogues too long to scan. Until someone reaches for it, this renders
 * only the trigger (same markup and classes as the live one); the popover, search and cmdk load on the first
 * hover or focus and open on the first tap, which keeps ~170 KB of JS out of the landing page's first load.
 */
export function Combobox(props: ComboboxProps) {
  const [live, setLive] = useState(false);
  // Hover and focus only prefetch; the swap to the live popover happens on activation, which then opens it and
  // moves focus into its search box (and back to the live trigger on close), so keyboard focus is never dropped.
  const trigger = <Trigger {...props} onPrefetch={() => { void loadPopover(); }} onActivate={() => setLive(true)} />;
  if (!live) return trigger;
  return <Suspense fallback={trigger}><ComboboxPopover {...props} defaultOpen /></Suspense>;
}

function Trigger({ value, onChange, groups, placeholder, clearLabel, ariaLabel, icon: Icon, disabled, id, onPrefetch, onActivate }: ComboboxProps & { onPrefetch: () => void; onActivate: () => void }) {
  const selected = groups.flatMap(g => g.options).find(o => o.value === value);
  let end: ReactNode = <ChevronsUpDown size={15} className="combobox-chevron" aria-hidden="true" />;
  if (selected) end = <span role="button" tabIndex={0} className="combobox-clear-value" aria-label={clearLabel} onClick={e => { e.stopPropagation(); onChange(""); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); onChange(""); } }}><X size={14} /></span>;
  return <button id={id} type="button" disabled={disabled} aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={false} className="combobox-trigger"
    onPointerEnter={onPrefetch} onFocus={onPrefetch} onClick={onActivate}>
    {Icon && <span className="combobox-icon" aria-hidden="true"><Icon size={15} /></span>}
    <span className={selected ? "combobox-value" : "combobox-placeholder"}>{selected ? selected.label : placeholder}</span>
    {end}
  </button>;
}
