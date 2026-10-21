"use client";
import { useId, useSyncExternalStore } from "react";
import { Loader2, Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { audioState, seekPart, serverAudioState, setSpeed, setVoice, stop, subscribe, toggle } from "@/lib/audio-lecture";
import { SPEEDS, VOICES } from "@/lib/audio-voices";
import { useLanguage } from "./language-provider";
import styles from "./audio-dock.module.css";

/*
 * The audio lecture player, docked at the bottom of every page while a lecture is open: what is playing, its part,
 * play/pause and part skipping, the voice (ten female, ten male) and the speed. The root layout mounts only the
 * host (audio-dock-host), which renders nothing and loads this player the first time a Listen button is pressed.
 */
export function AudioDock() {
  const { language } = useLanguage();
  const hi = language === "hi";
  const audio = useSyncExternalStore(subscribe, audioState, serverAudioState);
  const id = useId();
  if (!audio.id) return null;
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const busy = audio.status === "loading";
  const group = (gender: "female" | "male") => VOICES.filter(voice => voice.gender === gender).map(voice => <option key={voice.id} value={voice.id}>{voice.id} · {voice.style[hi ? 1 : 0]}</option>);
  return <section className={styles.dock} aria-label={text("Audio lecture", "ऑडियो लेक्चर")}>
    <div className={styles.head}>
      <span className={styles.mark} aria-hidden="true">{busy ? <Loader2 size={16} className={styles.spin} /> : <Volume2 size={16} />}</span>
      <div className={styles.now}>
        <strong title={audio.title}>{audio.title}</strong>
        <span aria-live="polite">{audio.status === "error" ? text("Audio is unavailable right now. Try again in a moment.", "ऑडियो अभी उपलब्ध नहीं है। थोड़ी देर में फिर कोशिश करें।")
          : `${text("Part", "भाग")} ${audio.index + 1} / ${audio.parts.length}${busy ? ` · ${text("preparing…", "तैयार हो रहा है…")}` : ""}`}</span>
      </div>
      <button type="button" className={styles.icon} onClick={stop} aria-label={text("Close the player", "प्लेयर बंद करें")}><X size={17} /></button>
    </div>
    <div className={styles.progress} aria-hidden="true"><i style={{ width: `${((audio.index + (audio.status === "idle" ? 0 : 0.5)) / Math.max(1, audio.parts.length)) * 100}%` }} /></div>
    <div className={styles.controls}>
      <div className={styles.transport}>
        <button type="button" className={styles.icon} onClick={() => seekPart(-1)} disabled={audio.index === 0 || busy} aria-label={text("Previous part", "पिछला भाग")}><SkipBack size={16} /></button>
        <button type="button" className={styles.play} onClick={toggle} disabled={busy} aria-label={audio.status === "playing" ? text("Pause", "रोकें") : text("Play", "चलाएँ")}>{audio.status === "playing" ? <Pause size={18} /> : <Play size={18} />}</button>
        <button type="button" className={styles.icon} onClick={() => seekPart(1)} disabled={audio.index + 1 >= audio.parts.length || busy} aria-label={text("Next part", "अगला भाग")}><SkipForward size={16} /></button>
      </div>
      <label className={styles.field} htmlFor={`${id}-voice`}><span>{text("Voice", "आवाज़")}</span>
        <select id={`${id}-voice`} value={audio.voice} onChange={event => setVoice(event.target.value)}>
          <optgroup label={text("Female voices", "महिला आवाज़ें")}>{group("female")}</optgroup>
          <optgroup label={text("Male voices", "पुरुष आवाज़ें")}>{group("male")}</optgroup>
        </select>
      </label>
      <div className={styles.speeds} role="radiogroup" aria-label={text("Speed", "गति")}>
        {SPEEDS.map(speed => <button type="button" role="radio" key={speed} aria-checked={audio.speed === speed} onClick={() => setSpeed(speed)}>{speed}×</button>)}
      </div>
    </div>
  </section>;
}

