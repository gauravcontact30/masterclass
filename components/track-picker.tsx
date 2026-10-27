"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, History, Search, Sparkles, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { BrandOrGlyph } from "./topic-media";
import { TRACK_FAMILIES, familyOfTrack } from "@/lib/pro-learn/families";
import type { ProTrack } from "@/lib/pro-learn/tracks";
import styles from "./track-picker.module.css";

/*
 * The Technology picker for Lessons, Quiz and Mentors (shadcn Popover + Command). Search ranks every track by its
 * name, focus, syllabus and family, and offers "Did you mean" corrections when nothing matches; family icons filter
 * the list; recent and popular technologies are suggested before anything is typed. A clear button empties the search.
 */

const RECENT_KEY = "mcb:track-recent:v1";
const POPULAR = ["core-java", "dsa", "spring-boot", "cpp", "react", "nextjs", "python", "systemdesign"];

const readRecent = (): string[] => { try { const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(value) ? value.filter(item => typeof item === "string") : []; } catch { return []; } };
const remember = (id: string) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...readRecent().filter(item => item !== id)].slice(0, 5))); } catch { /* optional */ } };

const normalise = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^\w+#. ]/g, " ").replace(/\s+/g, " ").trim();

/** Edit distance, capped: used only for "Did you mean" when nothing matches. */
function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

function score(track: ProTrack, query: string) {
  const name = normalise(track.name), id = track.id.replace(/-/g, " ");
  if (name === query || id === query) return 100;
  if (name.startsWith(query) || id.startsWith(query)) return 80;
  if (name.split(" ").some(word => word.startsWith(query))) return 70;
  if (name.includes(query)) return 60;
  const family = familyOfTrack(track.id);
  const words = query.split(" ");
  const haystack = normalise(`${track.focus} ${track.syllabus.join(" ")} ${family?.name ?? ""}`);
  const hits = words.filter(word => haystack.includes(word)).length;
  return hits === words.length ? 30 + Math.min(hits, 5) : 0;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query) : -1;
  if (at < 0) return <>{text}</>;
  return <>{text.slice(0, at)}<mark className={styles.mark}>{text.slice(at, at + query.length)}</mark>{text.slice(at + query.length)}</>;
}

export function TrackPicker({ value, onChange, tracks, label = "Technology" }: { value: string; onChange: (id: string) => void; tracks: ProTrack[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const selected = tracks.find(track => track.id === value);
  const q = normalise(query);

  const families = useMemo(() => TRACK_FAMILIES.filter(item => item.trackIds.some(id => tracks.some(track => track.id === id))), [tracks]);
  const pool = useMemo(() => family ? tracks.filter(track => familyOfTrack(track.id)?.id === family) : tracks, [tracks, family]);
  const matches = useMemo(() => q ? pool.map(track => ({ track, score: score(track, q) })).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.track.name.localeCompare(b.track.name)).map(item => item.track) : [], [pool, q]);
  const suggestions = useMemo(() => {
    if (!q || matches.length) return [];
    return tracks.map(track => ({ track, d: Math.min(distance(q, normalise(track.name)), distance(q, track.id)) })).filter(item => item.d <= Math.max(2, Math.floor(q.length / 3))).sort((a, b) => a.d - b.d).slice(0, 4).map(item => item.track);
  }, [q, matches.length, tracks]);
  const byId = (ids: string[]) => ids.map(id => pool.find(track => track.id === id)).filter((track): track is ProTrack => !!track);

  const choose = (id: string) => { onChange(id); remember(id); setOpen(false); setQuery(""); };
  const item = (track: ProTrack, prefix = "") => <CommandItem key={`${prefix}${track.id}`} value={`${prefix}${track.id}`} onSelect={() => choose(track.id)} className={styles.item} data-checked={track.id === value || undefined}>
    <span className={styles.itemIcon} aria-hidden="true"><BrandOrGlyph label={track.name} glyph={track.icon} size={18} /></span>
    <span className={styles.itemText}><b><Highlight text={track.name} query={q} /></b><small>{track.focus}</small></span>
    {track.id === value && <Check size={15} className={styles.itemCheck} aria-hidden="true" />}
  </CommandItem>;

  let list: ReactNode;
  if (q) {
    list = matches.length
      ? <CommandGroup heading={`${matches.length} ${matches.length === 1 ? "match" : "matches"}`}>{matches.map(track => item(track))}</CommandGroup>
      : <div className={styles.empty}>
          <p>No technology matches “{query}”{family ? " in this family" : ""}.</p>
          {suggestions.length > 0 && <p className={styles.didYouMean}>Did you mean {suggestions.map((track, i) => <span key={track.id}>{i > 0 && (i === suggestions.length - 1 ? " or " : ", ")}<button type="button" onClick={() => setQuery(track.name)}>{track.name}</button></span>)}?</p>}
          {family && <button type="button" className={styles.linkButton} onClick={() => setFamily(null)}>Search every family</button>}
        </div>;
  } else {
    const recentTracks = byId(recent.filter(id => id !== value)).slice(0, 4);
    const popular = byId(POPULAR.filter(id => id !== value && !recent.includes(id))).slice(0, 6);
    const grouped = families.filter(item => !family || item.id === family).map(item => ({ item, tracks: byId(item.trackIds) })).filter(group => group.tracks.length);
    list = <>
      {!family && recentTracks.length > 0 && <CommandGroup heading={<span className={styles.groupHeading}><History size={12} aria-hidden="true" />Recent</span>}>{recentTracks.map(track => item(track, "recent:"))}</CommandGroup>}
      {!family && popular.length > 0 && <CommandGroup heading={<span className={styles.groupHeading}><Sparkles size={12} aria-hidden="true" />Suggested</span>}>{popular.map(track => item(track, "popular:"))}</CommandGroup>}
      {grouped.map(group => <CommandGroup key={group.item.id} heading={<span className={styles.groupHeading}><span aria-hidden="true">{group.item.icon}</span>{group.item.name}</span>}>{group.tracks.map(track => item(track))}</CommandGroup>)}
    </>;
  }

  return <div className={styles.field}>
    <span className={styles.label}>{label}</span>
    <Popover open={open} onOpenChange={next => { setOpen(next); if (next) setRecent(readRecent()); else setQuery(""); }}>
      <PopoverTrigger className={styles.trigger} aria-label={`${label}: ${selected?.name ?? "choose a technology"}`}>
        {selected && <span className={styles.triggerIcon} aria-hidden="true"><BrandOrGlyph label={selected.name} glyph={selected.icon} size={16} /></span>}
        <span className={styles.triggerText}>{selected?.name ?? "Choose a technology"}</span>
        <ChevronsUpDown size={15} className={styles.chevron} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className={styles.popover}>
        <Command shouldFilter={false} loop className={styles.command}>
          <div className={styles.search}>
            <Search size={15} aria-hidden="true" />
            <input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${tracks.length} technologies, topics or skills…`} aria-label="Search technologies"
              onKeyDown={event => { if (event.key === "Escape" && query) { event.preventDefault(); event.stopPropagation(); setQuery(""); } }} />
            {query && <button type="button" className={styles.clear} onClick={() => setQuery("")} aria-label="Clear search"><X size={13} aria-hidden="true" />Clear</button>}
          </div>
          <div className={styles.filters} role="toolbar" aria-label="Filter by family">
            <button type="button" aria-pressed={!family} onClick={() => setFamily(null)} title="All technologies"><span aria-hidden="true">✦</span>All</button>
            {families.map(item => <button key={item.id} type="button" aria-pressed={family === item.id} onClick={() => setFamily(family === item.id ? null : item.id)} title={item.name}>
              <span aria-hidden="true">{item.icon}</span>{item.name.split(/[ &,]/)[0]}
            </button>)}
          </div>
          <CommandList className={styles.list}>{list}</CommandList>
          <p className={styles.footer}>↑ ↓ to move · Enter to choose · Esc to {query ? "clear" : "close"}</p>
        </Command>
      </PopoverContent>
    </Popover>
  </div>;
}
