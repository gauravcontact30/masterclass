"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { OfficialScreen } from "@/lib/media/official-screens";
import styles from "./official-screens.module.css";

/** Source-linked screenshots, including local captures of public learning pages. */
export function OfficialScreens({ screens }: { screens: readonly OfficialScreen[] }) {
  return <ul className={styles.screens}>
    {screens.map(screen => <li key={screen.src}><Screen screen={screen} /></li>)}
  </ul>;
}

function Screen({ screen }: { screen: OfficialScreen }) {
  const [state, setState] = useState<"loading" | "shown" | "failed">("loading");
  return <figure className={styles.figure} data-state={state}>
    {state === "failed"
      ? <p className={styles.gone}><ImageOff size={14} aria-hidden="true" />This preview could not be loaded.</p>
      : <div className={styles.frame}>
          {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked from the owning host on purpose; see the file comment. */}
          <img src={screen.src} alt={screen.title} loading="lazy" decoding="async" referrerPolicy="no-referrer"
            onLoad={() => setState("shown")} onError={() => setState("failed")} />
        </div>}
    <figcaption>
      <strong>{screen.title}</strong>
      <span>{screen.caption}</span>
      <small className={styles.credit}>{screen.credit}</small>
    </figcaption>
  </figure>;
}
