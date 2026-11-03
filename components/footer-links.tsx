"use client";
import { useCallback, useRef, useState } from "react";
import Link from "@/components/site-link";
import styles from "./footer-links.module.css";
import navigationStyles from "./navigation-link.module.css";

type Pill = { top: number; right: number; bottom: number; left: number; visible: boolean; tone: string };
/** Each link has its own hover colour; all keep the light link text at 4.5:1 or better. */
const TONES = ["#bb5834", "#2f7a4f", "#5b45a8", "#1d5a85", "#9a2f55", "#11706a", "#8a5a00"];

/**
 * A dark footer column's links with the header's hover effect: one pill, in a different colour for each link, that
 * slides to the hovered or focused link (a full-size layer revealed with clip-path, so it moves without layout) and
 * fades out when the pointer leaves. Shared by the landing footer and the public pages' footer (app/(site)/site-footer.tsx),
 * so both behave identically. `prefetch={false}` there: each prefetch also preloads that page's stylesheets.
 */
export function FooterLinks({ links, column = 0, prefetch }: { links: string[][]; column?: number; prefetch?: false }) {
  const pillRef = useRef<HTMLSpanElement>(null);
  const [pill, setPill] = useState<Pill>({ top: 0, right: 0, bottom: 0, left: 0, visible: false, tone: TONES[0] });
  const moveTo = useCallback((link: HTMLElement | null, index = 0) => {
    const layer = pillRef.current;
    if (!link || !layer) { setPill(current => ({ ...current, visible: false })); return; }
    // Measured against the pill's own layer, which overhangs the list so no pill is ever cut off.
    const box = layer.getBoundingClientRect(), at = link.getBoundingClientRect();
    setPill({ top: at.top - box.top, left: at.left - box.left, right: box.right - at.right, bottom: box.bottom - at.bottom, visible: true, tone: TONES[(column * 3 + index) % TONES.length] });
  }, [column]);
  return <ul className={styles.links} onMouseLeave={() => moveTo(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) moveTo(null); }}>
    <span ref={pillRef} className={styles.pill} aria-hidden="true" data-visible={pill.visible || undefined}
      style={{ clipPath: `inset(${pill.top}px ${pill.right}px ${pill.bottom}px ${pill.left}px round 999px)`, backgroundColor: pill.tone }} />
    {links.map(([label, href], index) => <li key={label}><Link className={`${navigationStyles.link} ${styles.link}`} href={href} prefetch={prefetch}
      onMouseEnter={event => moveTo(event.currentTarget, index)} onFocus={event => moveTo(event.currentTarget, index)}>{label}</Link></li>)}
  </ul>;
}
