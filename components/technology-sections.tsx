"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";

import { useState } from "react";
import type { ProTrack } from "@/lib/pro-learn/types";
import { familyOfTrack, groupTracksByFamily, type TrackFamily } from "@/lib/pro-learn/families";
import styles from "./technology-sections.module.css";

/** One family. Its cards mount only while it is open, so 54 tracks never render at once. */
function Family({ family, tracks, selected, onSelect, counts, countLabel, emptyLabel, idPrefix, defaultOpen, summaryCount }: {
  family: TrackFamily; tracks: ProTrack[]; selected: string; onSelect: (trackId: string) => void;
  counts?: Record<string, number>; countLabel?: (total: number) => string; emptyLabel?: string;
  idPrefix: string; defaultOpen: boolean; summaryCount: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return <details className={styles.family} data-active={defaultOpen} open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <AccordionSummary>
      <span className={styles.familyIcon} aria-hidden="true">{family.icon}</span>
      <span className={styles.familyText}><b>{family.name}</b><small>{family.blurb}</small></span>
      <span className={styles.familyCount}>{summaryCount}</span>
    </AccordionSummary>
    {open && <div className={styles.tracks}>
      {tracks.map(track => {
        const count = counts?.[track.id] ?? 0;
        return <button key={track.id} type="button" id={`${idPrefix}-${track.id}`} className={styles.track} aria-pressed={track.id === selected} onClick={() => onSelect(track.id)}>
          <span className={styles.trackTop}><span aria-hidden="true">{track.icon}</span><b>{track.name}</b></span>
          <p>{track.focus}</p>
          {counts && countLabel && <span className={styles.trackCount} data-empty={count === 0}>{count === 0 && emptyLabel ? emptyLabel : countLabel(count)}</span>}
        </button>;
      })}
    </div>}
  </details>;
}

/**
 * The 54 tracks, grouped into teaching families. Every page that asks "which
 * technology?" uses this, so Lessons, Quiz and Mentors stay navigable in the
 * same way instead of each offering a different 54-item list.
 */
export function TechnologySections({ tracks, selected, onSelect, counts, countLabel, emptyLabel, idPrefix }: {
  tracks: readonly ProTrack[];
  selected: string;
  onSelect: (trackId: string) => void;
  /** Per-track totals, e.g. lessons available. Omit to show no count. */
  counts?: Record<string, number>;
  countLabel?: (total: number) => string;
  /** Shown instead of a count when a track has none of the thing being counted. */
  emptyLabel?: string;
  idPrefix: string;
}) {
  const groups = groupTracksByFamily(tracks);
  const active = familyOfTrack(selected)?.id ?? groups[0]?.family.id ?? "";
  const totalFor = (family: { trackIds: string[] }) => family.trackIds.reduce((sum, id) => sum + (counts?.[id] ?? 0), 0);

  return <div className={styles.browser}>
    {groups.map(({ family, tracks: familyTracks }) => <Family
      // Re-keying on the active family lets the open section follow the selection.
      key={`${family.id}-${active}`}
      family={family} tracks={familyTracks} selected={selected} onSelect={onSelect}
      counts={counts} countLabel={countLabel} emptyLabel={emptyLabel} idPrefix={idPrefix}
      defaultOpen={family.id === active}
      summaryCount={counts && countLabel ? countLabel(totalFor(family)) : `${familyTracks.length} track${familyTracks.length === 1 ? "" : "s"}`}
    />)}
  </div>;
}
