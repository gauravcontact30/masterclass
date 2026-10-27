"use client";

import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useState, useSyncExternalStore, type ReactNode } from "react";

import { PRO_LEVELS, PRO_TRACKS, trackById, type ProTrack } from "@/lib/pro-learn/tracks";
import styles from "./pro-learn.module.css";
import { DashboardPageHeader } from "./dashboard-page-header";
import { TrackPicker } from "./track-picker";

/* Preferences shared by Lessons, Quiz, Interview and Mentors, kept in this browser. */
const TRACK_KEY = "masterclass:pro-track";
const LEVEL_KEY = "masterclass:pro-level";
const listeners = new Set<() => void>();
function read(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* optional */ } listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); window.addEventListener("storage", listener); return () => { listeners.delete(listener); window.removeEventListener("storage", listener); }; }

export function useProTrack(preferred?: string | null): [ProTrack, (id: string) => void] {
  const stored = useSyncExternalStore(subscribe, () => read(TRACK_KEY), () => null);
  // A ?track= deep link picks the starting track, but must not outrank a choice made
  // on the page afterwards — otherwise the selector looks broken on a linked-to page.
  const [chosen, setChosen] = useState<string | null>(null);
  const track = trackById(chosen) ?? trackById(preferred) ?? trackById(stored) ?? PRO_TRACKS.find(item => item.id === "react") ?? PRO_TRACKS[0];
  return [track, id => { setChosen(id); write(TRACK_KEY, id); }];
}
export function useProLevel(): [typeof PRO_LEVELS[number], (level: string) => void] {
  const stored = useSyncExternalStore(subscribe, () => read(LEVEL_KEY), () => null);
  const level = PRO_LEVELS.find(item => item === stored) ?? "Intermediate";
  return [level, value => write(LEVEL_KEY, value)];
}

/** JSON list persisted in localStorage, capped so it never grows without bound. */
export function readList<T>(key: string): T[] { try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } }
export function writeList<T>(key: string, items: T[], cap = 40) { try { localStorage.setItem(key, JSON.stringify(items.slice(0, cap))); } catch { /* optional */ } }

/** The Technology picker (components/track-picker.tsx): search with suggestions, clear search and family icon filters. */
export function TrackSelect({ value, onChange, label = "Technology", tracks = PRO_TRACKS }: { value: string; onChange: (id: string) => void; label?: string; tracks?: ProTrack[] }) {
  return <TrackPicker value={value} onChange={onChange} tracks={tracks} label={label}/>;
}
export function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly (string | { value: string; label: string })[]; onChange: (value: string) => void }) {
  return <Label className={styles.field}><span>{label}</span><div className={styles.select}><NativeSelect aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{options.map(option => typeof option === "string" ? <NativeSelectOption key={option}>{option}</NativeSelectOption> : <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>)}</NativeSelect></div></Label>;
}

export function ProHero({ eyebrow, title, children, icon, aside }: { eyebrow: string; title: ReactNode; children?: ReactNode; icon?: ReactNode; aside?: ReactNode }) {
  return <DashboardPageHeader eyebrow={eyebrow} title={title} description={children} icon={icon} actions={aside}/>;
}

export function SourceBadge({ source }: { source: "ai" | "library" }) {
  return <span className={styles.sourceBadge} data-source={source}>{source === "ai" ? "AI generated" : "MasterClass library"}</span>;
}

export const dayIndex = () => Math.floor(Date.now() / 864e5);
