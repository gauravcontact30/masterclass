"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { ListenButton } from "./listen-button";
import { useLanguage } from "./language-provider";
import styles from "./landing-carousel.module.css";

/*
 * A card carousel for the landing feature sections (Featured lessons, Coffee & Code): one card at a time with its
 * cover, kicker, title, a line of description, when or how long, Read more and Listen. It moves on by itself every
 * `interval` ms; hovering, focusing inside it, a hidden tab or the pause button stop it (WCAG 2.2.2), and the arrows
 * and dots move it by hand. Slides fade unless the visitor prefers reduced motion.
 */
export type CarouselSlide = {
  id: string; image?: string | null; tone?: string; kicker: string; title: string; text: string; meta?: string;
  href: string; cta: string; listen?: string;
};

export function CoverCarousel({ slides, label, interval = 15_000 }: { slides: CarouselSlide[]; label: string; interval?: number }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const count = slides.length;
  const go = useCallback((step: number) => setIndex(current => (current + step + count) % count), [count]);
  useEffect(() => {
    if (paused || held || count < 2) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") go(1); }, interval);
    return () => window.clearInterval(timer);
  }, [paused, held, count, interval, go, index]);
  if (!count) return null;
  return <div ref={root} className={styles.carousel} role="region" aria-roledescription="carousel" aria-label={label}
    onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
    onFocus={() => setHeld(true)} onBlur={event => { if (!root.current?.contains(event.relatedTarget as Node)) setHeld(false); }}>
    <div className={styles.viewport} aria-live={paused || held ? "polite" : "off"}>
      {slides.map((item, at) => <article key={item.id} id={`${id}-${at}`} className={styles.slide} data-active={at === index || undefined} inert={at !== index} aria-roledescription="slide" aria-label={`${at + 1} / ${count}: ${item.title}`}>
        <div className={styles.cover} style={item.tone ? { background: item.tone } : undefined}>
          {item.image && <Image src={item.image} alt="" fill sizes="(max-width: 560px) 90vw, 360px" loading={at === 0 ? undefined : "lazy"} />}
          <span className={styles.kicker}>{item.kicker}</span>
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{item.title}</h3>
          <p className={styles.text}>{item.text}</p>
          <div className={styles.foot}>
            {item.meta && <span className={styles.meta}>{item.meta}</span>}
            <div className={styles.actions}>
              <ListenButton id={`carousel:${item.id}`} title={item.title} text={item.listen ?? `${item.title}. ${item.text}`} compact />
              <Link className={styles.readMore} href={item.href}><b aria-hidden="true">✻</b>{item.cta}<ArrowRight size={13} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </article>)}
    </div>
    {count > 1 && <div className={styles.controls}>
      <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? (hi ? "चलाएँ" : "Play slideshow") : (hi ? "रोकें" : "Pause slideshow")}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
      <button type="button" onClick={() => go(-1)} aria-label={hi ? "पिछला" : "Previous"}><ChevronLeft size={16} /></button>
      <div className={styles.dots}>{slides.map((item, at) => <button type="button" key={item.id} aria-label={`${at + 1} / ${count}: ${item.title}`} aria-current={at === index || undefined} aria-controls={`${id}-${at}`} onClick={() => setIndex(at)} />)}</div>
      <button type="button" onClick={() => go(1)} aria-label={hi ? "अगला" : "Next"}><ChevronRight size={16} /></button>
    </div>}
  </div>;
}
