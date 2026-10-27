"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Type } from "lucide-react";
import styles from "./super-admin-notepad.module.css";

/** Text colors in rows of six: neutrals, then each hue from deep to light, so a row reads as one family. */
export const TEXT_COLORS = [
  { name: "Default ink", value: "#262624" }, { name: "Charcoal", value: "#3d3d3a" }, { name: "Slate", value: "#475569" }, { name: "Gray", value: "#73726c" }, { name: "Silver", value: "#a8a29e" }, { name: "Black", value: "#000000" },
  { name: "Crimson", value: "#b91c1c" }, { name: "Red", value: "#dc2626" }, { name: "Coral", value: "#f97316" }, { name: "Terracotta", value: "#c6613f" }, { name: "Amber", value: "#d97706" }, { name: "Gold", value: "#ca8a04" },
  { name: "Forest", value: "#166534" }, { name: "Green", value: "#16a34a" }, { name: "Emerald", value: "#059669" }, { name: "Teal", value: "#0f766e" }, { name: "Cyan", value: "#0891b2" }, { name: "Olive", value: "#65a30d" },
  { name: "Navy", value: "#1e3a8a" }, { name: "Blue", value: "#2563eb" }, { name: "Sky", value: "#0284c7" }, { name: "Indigo", value: "#4f46e5" }, { name: "Violet", value: "#7c3aed" }, { name: "Purple", value: "#9333ea" },
  { name: "Plum", value: "#86198f" }, { name: "Magenta", value: "#c026d3" }, { name: "Pink", value: "#db2777" }, { name: "Rose", value: "#e11d48" }, { name: "Maroon", value: "#7f1d1d" }, { name: "Brown", value: "#78350f" },
  { name: "Light red", value: "#f87171" }, { name: "Peach", value: "#fdba74" }, { name: "Light green", value: "#4ade80" }, { name: "Light blue", value: "#60a5fa" }, { name: "Lavender", value: "#a78bfa" }, { name: "Light pink", value: "#f9a8d4" },
];

/**
 * Text color as a swatch grid with a custom picker: arrows move, Enter applies, Escape or a click outside closes.
 * Swatches never take focus from the page on click, so the editor's selection is still there when the color lands.
 */
export function TextColorPicker({ onPick }: { onPick: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(TEXT_COLORS[0].value);
  const [highlight, setHighlight] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const pick = (color: string, keepOpen = false) => { setCurrent(color); onPick(color); if (!keepOpen) setOpen(false); };
  const name = TEXT_COLORS.find(color => color.value === current)?.name ?? current;
  return <div ref={box} className={styles.paperPicker}>
    <button type="button" className={styles.paperTrigger} aria-label={`Text color: ${name}`} data-tooltip="Text color" aria-haspopup="dialog" aria-expanded={open}
      onMouseDown={e => e.preventDefault()} onClick={() => { setHighlight(Math.max(0, TEXT_COLORS.findIndex(color => color.value === current))); setOpen(value => !value); }}>
      <Type size={16} aria-hidden="true"/><i style={{ backgroundColor: current }} aria-hidden="true"/><ChevronDown size={14} aria-hidden="true"/>
    </button>
    {open && <div className={styles.colorPanel} role="dialog" aria-label="Text color">
      <div ref={grid} className={styles.colorGrid} role="listbox" tabIndex={0} aria-label="Text colors" aria-activedescendant={`notepad-text-color-${highlight}`} onKeyDown={e => {
        const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 6, ArrowUp: -6 }[e.key];
        if (step) { e.preventDefault(); setHighlight(index => Math.min(TEXT_COLORS.length - 1, Math.max(0, index + step))); }
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(TEXT_COLORS[highlight].value); }
        if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
      }}>
        {TEXT_COLORS.map((color, index) => <button key={color.value} id={`notepad-text-color-${index}`} type="button" role="option" tabIndex={-1} title={color.name} aria-label={color.name}
          aria-selected={color.value === current} data-highlight={index === highlight || undefined} style={{ backgroundColor: color.value }}
          onMouseDown={e => e.preventDefault()} onMouseEnter={() => setHighlight(index)} onClick={() => pick(color.value)}>
          {color.value === current && <Check size={13} aria-hidden="true"/>}
        </button>)}
      </div>
      <div className={styles.colorFoot}>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick(TEXT_COLORS[0].value)}>Default</button>
        <label>Custom<input type="color" aria-label="Custom text color" value={current} onChange={e => pick(e.target.value, true)}/></label>
      </div>
    </div>}
  </div>;
}
