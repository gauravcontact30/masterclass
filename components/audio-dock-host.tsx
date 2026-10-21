"use client";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { audioState, subscribe } from "@/lib/audio-lecture";

// The player loads on demand: pages that never play a lecture download only this host and the small store.
const LazyDock = dynamic(() => import("./audio-dock").then(module => module.AudioDock), { ssr: false });
/** Mounted once in the root layout: nothing until a lecture starts, then the docked player. */
export function AudioDockHost() {
  const active = useSyncExternalStore(subscribe, () => audioState().id !== null, () => false);
  return active ? <LazyDock /> : null;
}
