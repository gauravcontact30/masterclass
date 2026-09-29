"use client";

import { useState } from "react";
import { ExternalLink, ImageOff } from "lucide-react";
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
      ? <p className={styles.gone}><ImageOff size={14} aria-hidden="true" />This preview could not be loaded. Open the source page below to continue learning.</p>
      : <a className={styles.frame} href={screen.page} target="_blank" rel="noopener noreferrer" aria-label={`${screen.title} — open ${screen.credit} in a new tab`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked from the owning host on purpose; see the file comment. */}
          <img src={screen.src} alt={screen.title} loading="lazy" decoding="async" referrerPolicy="no-referrer"
            onLoad={() => setState("shown")} onError={() => setState("failed")} />
        </a>}
    <figcaption>
      <strong>{screen.title}</strong>
      <span>{screen.caption}</span>
      <a href={screen.page} target="_blank" rel="noopener noreferrer">
        {screen.credit}<ExternalLink size={11} aria-hidden="true" />
      </a>
    </figcaption>
  </figure>;
}
