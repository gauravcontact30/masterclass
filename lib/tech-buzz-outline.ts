"use client";
import { useSyncExternalStore } from "react";

/*
 * What the open story tells the Tech Buzz side menu: its contents, and how the reader unlocks the rest. The menu is in
 * two places (the rail beside the story and the header's drawer), and the drawer sits in the layout, outside the story.
 */
export type OutlineItem = { id: string; label: string; locked?: boolean };
export type StoryOutline = { items: OutlineItem[]; member: boolean; unlock: { href: string; label: string } | null };

/** "off" while the reader has folded the rail beside the story away. */
export const RAIL_KEY = "mcb:tb-rail";

const EMPTY: StoryOutline = { items: [], member: false, unlock: null };
let outline = EMPTY;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

export function publishOutline(next: StoryOutline | null) {
  outline = next ?? EMPTY;
  listeners.forEach(listener => listener());
}
export const useOutline = () => useSyncExternalStore(subscribe, () => outline, () => EMPTY);
