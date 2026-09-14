"use client";
import { useEffect, useState, useSyncExternalStore, type FocusEvent, type ReactNode } from "react";
import { ArrowLeftRight, BookOpen, Check, CodeXml, Crown, Library, ListChecks, NotebookPen, Pause, Play, Sparkles } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./auth-page.module.css";

export type AuthSlide = { id: string; title: string; body: string; art: ReactNode };
type CarouselLabels = { region: string; pause: string; play: string; goTo: (n: number) => string; position: (n: number, total: number) => string };

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
// matchMedia is missing in jsdom and some embedded browsers, so every access is guarded.
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia?.(REDUCED_MOTION);
  query?.addEventListener?.("change", onChange);
  return () => query?.removeEventListener?.("change", onChange);
}
const prefersReducedMotion = () => Boolean(window.matchMedia?.(REDUCED_MOTION)?.matches);

/**
 * Accessible autoplay carousel (WAI-ARIA APG carousel pattern). Rotation stops
 * while the pointer is over it or focus is inside it, when the visitor presses
 * the pause control, and never starts on its own under prefers-reduced-motion.
 * Slides are announced politely only while rotation is stopped, so autoplay
 * never talks over a screen reader.
 */
export function AuthCarousel({ slides, labels, intervalMs = 5000 }: { slides: AuthSlide[]; labels: CarouselLabels; intervalMs?: number }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const [index, setIndex] = useState(0);
  // null until the visitor presses play/pause; until then motion preference decides.
  const [choice, setChoice] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const playing = choice ?? !reducedMotion;
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
    setChoice(!playing);
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
            <div className={styles.art} aria-hidden="true">{slide.art}</div>
            <h2 className={styles.slideTitle}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The brand panel beside the auth form: tagline, value carousel and the seeded-library note. */
export function AuthStory() {
  const { t } = useLanguage();
  const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
  const slides: AuthSlide[] = [
    { id: "guide", title: t("authSlide1Title"), body: t("authSlide1Body"), art: (
      <div className={styles.artGuide}>
        <div className={styles.docCard}>
          <div className={styles.docHead}><span className={styles.docIcon}><BookOpen size={15} /></span><strong>Next.js 16</strong><span className={styles.docChip}>{t("beginner")}</span></div>
          {[86, 70, 78, 54].map(width => <div key={width} className={styles.docRow}><Check size={12} /><i style={{ width: `${width}%` }} /></div>)}
        </div>
        <span className={styles.docSpark}><Sparkles size={18} /></span>
      </div>
    ) },
    { id: "formats", title: t("authSlide2Title"), body: t("authSlide2Body"), art: (
      <div className={styles.artFormats}>
        <span className={styles.formatTile}><NotebookPen size={22} />{t("authFormatNotes")}</span>
        <span className={styles.formatTile}><CodeXml size={22} />Code</span>
        <span className={styles.formatTile}><ListChecks size={22} />Q&amp;A</span>
        <span className={styles.formatReader}><BookOpen size={15} />{t("learn")}</span>
      </div>
    ) },
    { id: "languages", title: t("authSlide3Title"), body: t("authSlide3Body"), art: (
      <div className={styles.artLanguages}>
        <span className={styles.glyph}>A</span>
        <span className={styles.swap}><ArrowLeftRight size={16} /></span>
        <span className={`${styles.glyph} ${styles.glyphHi}`}>अ</span>
      </div>
    ) },
    { id: "plans", title: t("authSlide4Title"), body: t("authSlide4Body"), art: (
      <div className={styles.artPlans}>
        <span className={styles.planTicket}><Sparkles size={16} />{t("monthly")}</span>
        <span className={styles.planTicket}><Crown size={16} />{t("yearly")}</span>
      </div>
    ) },
  ];
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
