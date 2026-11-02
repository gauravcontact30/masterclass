"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Check, ChevronDown, Loader2, Pause, Play } from "lucide-react";
import { audioState, listenParts, serverAudioState, setSpeed, setVoice, subscribe, toggle } from "@/lib/audio-lecture";
import { SPEEDS, STORY_VOICES, VOICES, genderOf, type VoiceGender } from "@/lib/audio-voices";
import styles from "./tech-buzz-listen.module.css";

/*
 * The narration bar on an open story, on the audio lecture store (lib/audio-lecture.ts): real voices through /api/audio,
 * stored once per text and voice. Picking a voice with nothing playing plays a one-line sample, so a reader hears it first.
 */
const SAMPLE_ID = "tech-buzz:sample";
const SAMPLE = "This is how your story will sound. Sit back, and listen at your own pace.";
/** Spoken English at normal speed, for the time left. */
const CHARS_PER_SECOND = 14;
const GENDERS: [VoiceGender, string][] = [["female", "Female"], ["male", "Male"]];
const styleOf = (id: string) => VOICES.find(voice => voice.id === id)?.style[0] ?? "";

export function TechBuzzListen({ lectureId, title, parts, preview, onStart }: { lectureId: string; title: string; parts: string[]; preview: boolean; onStart: (part: number) => void }) {
  const audio = useSyncExternalStore(subscribe, audioState, serverAudioState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const voiceButton = useRef<HTMLButtonElement>(null);

  const mine = audio.id === lectureId;
  const sampling = audio.id === SAMPLE_ID && (audio.status === "playing" || audio.status === "loading");
  const session = mine && audio.status !== "idle";
  const playing = mine && audio.status === "playing";
  const loading = (mine || sampling) && audio.status === "loading";
  const failed = (mine || audio.id === SAMPLE_ID) && audio.status === "error";
  const position = dragging ?? (session ? audio.index : 0);
  const percent = parts.length ? ((position + (session ? 0.5 : 0)) / parts.length) * 100 : 0;
  const secondsLeft = parts.slice(position).reduce((total, part) => total + part.length, 0) / CHARS_PER_SECOND / audio.speed;
  const minutes = Math.max(1, Math.ceil(secondsLeft / 60));

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setMenuOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setMenuOpen(false); voiceButton.current?.focus(); } };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  const pickVoice = (id: string) => {
    setVoice(id);
    // During the story the store re-reads the current part in the new voice.
    if (!session) listenParts(SAMPLE_ID, "Voice sample", [SAMPLE]);
  };
  const press = () => { if (session) toggle(); else onStart(0); };
  const nextSpeed = () => setSpeed(SPEEDS[(SPEEDS.indexOf(audio.speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length]);
  // Only where the drag ends is played: every step on the way would voice a part nobody hears.
  const commitDrag = () => {
    if (dragging === null) return;
    setDragging(null);
    if (dragging !== audio.index || !session) onStart(dragging);
  };

  const status = failed ? "Narration could not start. Press play to try again."
    : loading ? "Preparing the voice…"
    : sampling ? `Sample of ${audio.voice}`
    : session ? `${minutes} min left`
    : `${minutes} min${preview ? " preview" : " listen"}`;

  return <section ref={root} className={styles.bar} aria-label="Listen to this story" data-playing={playing || undefined}>
    <button type="button" className={styles.play} style={{ "--done": `${percent}%` } as CSSProperties} onClick={press} aria-label={playing ? "Pause narration" : session ? "Resume narration" : "Play narration"} title={playing ? "Pause" : "Listen"}>
      <span>{loading ? <Loader2 size={17} className={styles.spin} aria-hidden="true" /> : playing ? <Pause size={17} fill="currentColor" aria-hidden="true" /> : <Play size={17} fill="currentColor" aria-hidden="true" />}</span>
    </button>

    <div className={styles.info}>
      <p className={styles.line}>
        <strong>{session ? title : "Listen to this story"}</strong>
        <span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /></span>
      </p>
      <div className={styles.track}>
        <input type="range" min={0} max={Math.max(0, parts.length - 1)} step={1} value={position} aria-label="Position in the story" aria-valuetext={`Part ${position + 1} of ${parts.length}`} style={{ "--fill": `${parts.length > 1 ? (position / (parts.length - 1)) * 100 : 0}%` } as CSSProperties}
          onChange={event => setDragging(Number(event.target.value))} onPointerUp={commitDrag} onKeyUp={commitDrag} onBlur={commitDrag} />
        <span className={styles.status} aria-live="polite" data-error={failed || undefined}>{status}</span>
      </div>
    </div>

    <button ref={voiceButton} type="button" className={styles.voice} aria-haspopup="true" aria-expanded={menuOpen} aria-label={`Voice: ${audio.voice}, ${styleOf(audio.voice)}. Change voice`} onClick={() => setMenuOpen(open => !open)}>
      <span className={styles.voiceDot} data-gender={genderOf(audio.voice)} aria-hidden="true">{audio.voice.charAt(0)}</span>
      <span className={styles.voiceName}>{audio.voice}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </button>
    <button type="button" className={styles.speed} onClick={nextSpeed} aria-label={`Speed ${audio.speed} times. Change speed`} title="Playback speed">{audio.speed}×</button>

    {menuOpen && <div className={styles.menu} role="group" aria-label="Choose a voice">
      <p className={styles.menuHint}>Choose a voice to hear a short sample.</p>
      <div className={styles.columns}>
        {GENDERS.map(([gender, label]) => <div key={gender} role="radiogroup" aria-label={`${label} voices`}>
          <h3>{label}</h3>
          {STORY_VOICES[gender].map(id => <button key={id} type="button" role="radio" aria-checked={audio.voice === id} className={styles.option} onClick={() => pickVoice(id)}>
            <span><b>{id}</b><small>{styleOf(id)}</small></span>
            {audio.voice === id && <Check size={15} aria-hidden="true" />}
          </button>)}
        </div>)}
      </div>
    </div>}
  </section>;
}
