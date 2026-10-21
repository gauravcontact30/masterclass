"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import { PAPER_COLORS } from "@/lib/notepad";
import styles from "./super-admin-notepad.module.css";

/** Document background as a dropdown of named swatches: arrows move, Enter picks, Escape or a click outside closes. */
export function PaperPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const current = PAPER_COLORS.find(color => color.value === value) ?? PAPER_COLORS[0];
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    list.current?.focus();
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  useEffect(() => { if (open) document.getElementById(`notepad-paper-${highlight}`)?.scrollIntoView?.({ block: "nearest" }); }, [open, highlight]);
  const pick = (color: string) => { onChange(color); setOpen(false); };
  const toggle = () => { setHighlight(Math.max(0, PAPER_COLORS.indexOf(current))); setOpen(value => !value); };
  return <div ref={box} className={styles.paperPicker}>
    <button type="button" className={styles.paperTrigger} aria-label={`Document background: ${current.name}`} data-tooltip="Document background" aria-haspopup="listbox" aria-expanded={open} aria-controls="notepad-paper-colors" onClick={toggle}>
      <Palette size={16} aria-hidden="true"/><i style={{ backgroundColor: current.value }} aria-hidden="true"/><span>{current.name}</span><ChevronDown size={14} aria-hidden="true"/>
    </button>
    {open && <ul ref={list} id="notepad-paper-colors" role="listbox" tabIndex={-1} aria-label="Document background color" aria-activedescendant={`notepad-paper-${highlight}`} className={styles.paperList} onKeyDown={e => {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); box.current?.querySelector("button")?.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); setHighlight(index => Math.min(index + 1, PAPER_COLORS.length - 1)); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); setHighlight(index => Math.max(index - 1, 0)); }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(PAPER_COLORS[highlight].value); box.current?.querySelector("button")?.focus(); }
    }}>{PAPER_COLORS.map((color, index) => <li key={color.value} id={`notepad-paper-${index}`} role="option" aria-selected={color.value === current.value} data-highlight={index === highlight || undefined} onMouseEnter={() => setHighlight(index)} onClick={() => pick(color.value)}>
      <i style={{ backgroundColor: color.value }} aria-hidden="true"/><span>{color.name}</span>{color.value === current.value && <Check size={13} aria-hidden="true"/>}
    </li>)}</ul>}
  </div>;
}
