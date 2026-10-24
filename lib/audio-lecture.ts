"use client";
import { DEFAULT_VOICE, DEFAULT_VOICES, SPEEDS, genderOf, isVoice, lectureParts, type VoiceGender } from "./audio-voices";

/*
 * The one audio lecture playing on the page. Any Listen button starts a lecture (pressing it again pauses or
 * resumes); the dock (components/audio-dock) shows it with voice, speed and part controls. A lecture is read part
 * by part: each part's MP3 comes from /api/audio, the next part is fetched while the current one plays, and the
 * voice and speed are remembered in this browser, with the last voice of each gender so the Female/Male switch
 * returns to it. Speed is the audio element's playback rate, so changing it is
 * instant and needs no new audio.
 */
export type LectureStatus = "idle" | "loading" | "playing" | "paused" | "error";
export type AudioState = { id: string | null; title: string; parts: string[]; index: number; status: LectureStatus; voice: string; speed: number; error: string | null; picked: Record<VoiceGender, string> };

const PREFS = "masterclass:audio";
function saved(): Pick<AudioState, "voice" | "speed" | "picked"> {
  try {
    const value = JSON.parse(localStorage.getItem(PREFS) ?? "{}") as { voice?: unknown; speed?: unknown; picked?: Partial<Record<VoiceGender, unknown>> };
    const pick = (gender: VoiceGender) => { const id = value.picked?.[gender]; return isVoice(id) && genderOf(id) === gender ? id : DEFAULT_VOICES[gender]; };
    return { voice: isVoice(value.voice) ? value.voice : DEFAULT_VOICE, speed: SPEEDS.includes(value.speed as never) ? value.speed as number : 1, picked: { female: pick("female"), male: pick("male") } };
  } catch { return { voice: DEFAULT_VOICE, speed: 1, picked: DEFAULT_VOICES }; }
}
const IDLE: AudioState = { id: null, title: "", parts: [], index: 0, status: "idle", voice: DEFAULT_VOICE, speed: 1, error: null, picked: DEFAULT_VOICES };
let state: AudioState = IDLE;
let loadedPrefs = false;
const listeners = new Set<() => void>();
const set = (patch: Partial<AudioState>) => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };

export function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function audioState() {
  if (!loadedPrefs && typeof window !== "undefined") { loadedPrefs = true; state = { ...state, ...saved() }; }
  return state;
}
export const serverAudioState = () => IDLE;

let element: HTMLAudioElement | null = null;
function audio() {
  if (!element) {
    element = new Audio();
    element.preload = "auto";
    element.addEventListener("ended", () => { if (state.index + 1 < state.parts.length) void playPart(state.index + 1); else set({ status: "idle", index: 0 }); });
    element.addEventListener("pause", () => { if (state.status === "playing" && !element!.ended) set({ status: "paused" }); });
    element.addEventListener("play", () => { if (state.status === "paused") set({ status: "playing" }); });
  }
  return element;
}

const urls = new Map<string, Promise<string>>();
function partUrl(voice: string, text: string) {
  const key = `${voice}\n${text}`;
  let url = urls.get(key);
  if (!url) {
    url = fetch("/api/audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voice, text }) })
      .then(async response => { const body = await response.json().catch(() => ({})); if (!response.ok || !body.url) throw new Error(body.error ?? "audio_unavailable"); return body.url as string; });
    url.catch(() => urls.delete(key));
    urls.set(key, url);
  }
  return url;
}

let ticket = 0;
async function playPart(index: number) {
  const mine = ++ticket;
  const { voice, parts } = state;
  set({ index, status: "loading", error: null });
  try {
    const url = await partUrl(voice, parts[index]);
    if (mine !== ticket) return;
    const player = audio();
    player.src = url;
    player.playbackRate = state.speed;
    await player.play();
    if (mine !== ticket) return;
    set({ status: "playing" });
    // Ready the next part while this one plays, so the lecture runs on without a gap.
    if (index + 1 < parts.length) void partUrl(voice, parts[index + 1]).catch(() => {});
  } catch (error) {
    if (mine !== ticket) return;
    set({ status: "error", error: error instanceof Error ? error.message : "audio_unavailable" });
  }
}

/** Starts a lecture, or pauses/resumes it when it is the one already playing. */
export function listen(id: string, title: string, text: string) {
  audioState();
  if (state.id === id && state.status !== "idle" && state.status !== "error") { toggle(); return; }
  const parts = lectureParts(text);
  if (!parts.length) return;
  set({ id, title, parts, index: 0 });
  void playPart(0);
}
export function toggle() {
  const player = audio();
  if (state.status === "playing") { player.pause(); set({ status: "paused" }); }
  else if (state.status === "paused") { void player.play(); set({ status: "playing" }); }
  else if (state.id) void playPart(state.index);
}
export function seekPart(step: number) {
  const next = Math.min(Math.max(state.index + step, 0), state.parts.length - 1);
  if (state.id) void playPart(next);
}
export function stop() { ticket++; element?.pause(); set({ ...IDLE, voice: state.voice, speed: state.speed, picked: state.picked }); }
function remember() { try { localStorage.setItem(PREFS, JSON.stringify({ voice: state.voice, speed: state.speed, picked: state.picked })); } catch { /* storage unavailable */ } }
export function setSpeed(speed: number) { set({ speed }); if (element) element.playbackRate = speed; remember(); }
/** A new voice re-reads the current part in that voice. */
export function setVoice(voice: string) {
  if (!isVoice(voice) || voice === state.voice) return;
  set({ voice, picked: { ...state.picked, [genderOf(voice)]: voice } }); remember();
  if (state.id && state.status !== "idle") void playPart(state.index);
}
/** The Female/Male switch: the last voice used of that gender, or its default narrator. */
export function setGender(gender: VoiceGender) { setVoice(state.picked[gender] ?? DEFAULT_VOICES[gender]); }
