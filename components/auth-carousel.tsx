"use client";
import Image from "next/image";
import { useEffect, useState, type FocusEvent } from "react";
import { Library, Pause, Play } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./auth-page.module.css";

/** `image`: the slide's photograph, painted through the AI Gateway (scripts/generate-auth-images.ts). */
export type AuthSlide = { id: string; title: string; body: string; image: string };
type CarouselLabels = { region: string; pause: string; play: string; goTo: (n: number) => string; position: (n: number, total: number) => string };

/**
 * Accessible autoplay carousel (WAI-ARIA APG carousel pattern). Every slide shows
 * for `intervalMs` (5 s); rotation stops while the pointer is over it or focus is
 * inside it, and when the visitor presses the pause control. Under
 * prefers-reduced-motion it still rotates, only without the slide-in animation.
 * Slides are announced politely only while rotation is stopped, so autoplay
 * never talks over a screen reader.
 */
export function AuthCarousel({ slides, labels, intervalMs = 5000 }: { slides: AuthSlide[]; labels: CarouselLabels; intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rotating = playing && !hovered && !focused && slides.length > 1;

  // A fresh timeout per slide (rather than an interval) keeps the dot's progress
  // bar and the actual advance in step after every pause and manual jump.
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setIndex(i => (i + 1) % slides.length), intervalMs);
    return () => window.clearTimeout(timer);
  }, [rotating, index, intervalMs, slides.length]);

  function leaveFocus(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  }
  function togglePlay() {
    // Pressing play is an explicit request, so it overrides the focus pause the press itself caused.
    if (!playing) setFocused(false);
    setPlaying(!playing);
  }

  return (
    <section className={styles.carousel} aria-roledescription="carousel" aria-label={labels.region} data-rotating={rotating}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={leaveFocus}>
      {/* Controls come first in reading order so keyboard users reach pause before the slides. */}
      <div className={styles.controls}>
        <button type="button" className={styles.playToggle} aria-label={playing ? labels.pause : labels.play} onClick={togglePlay}>
          {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
        </button>
        <div className={styles.dots}>
          {slides.map((slide, i) => (
            <button key={slide.id} type="button" className={styles.dot} aria-label={labels.goTo(i + 1)} aria-current={i === index ? "true" : undefined} onClick={() => setIndex(i)}>
              {i === index && rotating && <span key={index} className={styles.dotProgress} style={{ animationDuration: `${intervalMs}ms` }} />}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.slides} aria-live={rotating ? "off" : "polite"}>
        {slides.map((slide, i) => (
          <div key={slide.id} role="group" aria-roledescription="slide" aria-label={labels.position(i + 1, slides.length)} hidden={i !== index} className={styles.slide}>
            <div className={styles.art} aria-hidden="true"><div className={styles.photo}><Image src={slide.image} alt="" fill sizes="(max-width: 899px) 100vw, 460px" priority={i === 0} loading={i === 0 ? "eager" : "lazy"} /></div></div>
            <h2 className={styles.slideTitle}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The brand panel beside the auth form: tagline, value carousel and the seeded-library note. Sign-up shows its own
 *  photographs, so none repeats between the two pages. */
export function AuthStory({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const { t } = useLanguage();
  const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
  const slides: AuthSlide[] = (["guide", "formats", "languages", "plans"] as const).map((id, at) => {
    const n = at + 1 as 1 | 2 | 3 | 4;
    return { id, title: t(`authSlide${n}Title`), body: t(`authSlide${n}Body`), image: `/images/auth/${mode === "signup" ? "signup-" : ""}${id}.webp` };
  });
  return (
    <aside className={styles.story}>
      <p className={styles.tagline}><span aria-hidden="true">✦</span>{t("brandLine")}</p>
      <AuthCarousel slides={slides} labels={{
        region: t("authCarouselLabel"), pause: t("authCarouselPause"), play: t("authCarouselPlay"),
        goTo: n => fill(t("authCarouselGoTo"), { n }), position: (n, total) => fill(t("authCarouselPosition"), { n, total }),
      }} />
      <p className={styles.libraryNote}><Library size={16} aria-hidden="true" />{t("authLibraryNote")}</p>
    </aside>
  );
}
