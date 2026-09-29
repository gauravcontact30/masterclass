"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./landing-home.module.css";

const INTERVAL = 7000;
type Pair = [string, string];
type Slide = { id: string; src: string; focus: string; tool: Pair; title: Pair; body: Pair; link: { label: Pair; href: string }; alt: string };

/**
 * The landing hero: four AI-generated study scenes (each file's EXIF
 * ImageDescription holds its prompt), full-bleed under the navbar. Each slide
 * carries its own headline and actions; autoplay pauses on hover, on focus,
 * with the pause button, and never starts for visitors who prefer reduced motion.
 */
function slidesFor(technologies: number | undefined): Slide[] {
  const count = technologies ? String(technologies) : "60+";
  return [
    { id: "school", src: "/images/landing/slide-classroom.webp", focus: "30% 45%", tool: ["School", "स्कूल"],
      title: ["Study smarter, from Class 6 to Class 12.", "कक्षा 6 से 12 तक, समझदारी से पढ़ें।"],
      body: ["Concept notes, worked answers and diagrams for CBSE, NCERT, ICSE and ISC, in English or Hindi.", "CBSE, NCERT, ICSE और ISC के लिए अवधारणा नोट्स, हल सहित उत्तर और आरेख, अंग्रेज़ी या हिन्दी में।"],
      link: { label: ["Explore school paths", "स्कूल पथ देखें"], href: "/courses#cbse" },
      alt: "A school student studying at a desk in the evening with a laptop, notebook and desk lamp" },
    { id: "exams", src: "/images/landing/slide-exams.webp", focus: "48% 40%", tool: ["Exams", "परीक्षाएँ"],
      title: ["Prepare for your exam with focused daily practice.", "रोज़ के एकाग्र अभ्यास से परीक्षा की तैयारी करें।"],
      body: ["Foundations and timed practice for SSC, banking, railways, defence, JEE and NEET.", "SSC, बैंकिंग, रेलवे, रक्षा, JEE और NEET के लिए आधार और समयबद्ध अभ्यास।"],
      link: { label: ["See exam paths", "परीक्षा पथ देखें"], href: "/courses#ssc" },
      alt: "A student preparing for a competitive exam in a library with books, notes and a tablet" },
    { id: "build", src: "/images/landing/slide-onthego.webp", focus: "68% 40%", tool: ["On The Go", "On The Go"],
      title: ["Build real projects, one clear step at a time.", "असली प्रोजेक्ट बनाएँ, एक-एक स्पष्ट कदम से।"],
      body: [`Guides for ${count} technologies with every command, the complete codebase and real use cases.`, `${count} तकनीकों के लिए गाइड: हर कमांड, पूरा कोडबेस और वास्तविक उपयोग।`],
      link: { label: ["Browse technology", "तकनीक देखें"], href: "/courses#technology" },
      alt: "A young developer working at a sunlit desk with a laptop showing code and a second screen" },
    { id: "career", src: "/images/landing/slide-interview.webp", focus: "55% 40%", tool: ["Interview", "इंटरव्यू"],
      title: ["Walk into your interview already fluent.", "इंटरव्यू में पूरी तैयारी के साथ जाएँ।"],
      body: ["Lessons, quizzes, interview practice and a live code lab for your technology career.", "आपके तकनीकी करियर के लिए पाठ, क्विज़, इंटरव्यू अभ्यास और लाइव कोड लैब।"],
      link: { label: ["How it works", "यह कैसे काम करता है"], href: "#paths" },
      alt: "Two friends practising interview answers together at a cafe table with a laptop and tea" },
  ];
}

export function LandingSlider({ technologies }: { technologies?: number }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const pick = ([en, hindi]: Pair) => hi ? hindi : en;
  const slides = slidesFor(technologies);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);
  const [reduced, setReduced] = useState(false);
  const regionRef = useRef<HTMLElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const total = slides.length;
  const running = playing && !held && !reduced;
  const go = useCallback((next: number) => setIndex((next + total) % total), [total]);
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => go(index + 1), INTERVAL);
    return () => clearTimeout(timer);
  }, [running, index, go]);

  const pad = (value: number) => String(value).padStart(2, "0");
  const text = (en: string, hindi: string) => hi ? hindi : en;

  return <section ref={regionRef} className={styles.heroSlider} aria-roledescription="carousel" aria-label={text("Learning with MasterClass", "MasterClass में पढ़ाई")}
    onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
    onFocus={() => setHeld(true)} onBlur={event => { if (!regionRef.current?.contains(event.relatedTarget as Node)) setHeld(false); }}
    onKeyDown={event => {
      if (event.key === "ArrowRight") { event.preventDefault(); go(index + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(index - 1); }
    }}
    onTouchStart={event => { touchX.current = event.touches[0]?.clientX ?? null; }}
    onTouchEnd={event => {
      const start = touchX.current, end = event.changedTouches[0]?.clientX;
      touchX.current = null;
      if (start === null || end === undefined || Math.abs(end - start) < 48) return;
      go(end < start ? index + 1 : index - 1);
    }}>
    <div className={styles.heroStage} aria-live={running ? "off" : "polite"}>
      {slides.map((slide, position) => {
        const current = position === index;
        return <article key={slide.id} className={styles.heroSlide} data-active={current || undefined} aria-roledescription="slide"
          aria-label={`${position + 1} / ${total}`} aria-hidden={!current} inert={!current}>
          <Image src={slide.src} alt={slide.alt} fill sizes="100vw" preload={position === 0} className={styles.heroImage} style={{ "--focus": slide.focus } as React.CSSProperties} />
          <div className={styles.heroShade} />
          <div className={styles.heroCopy}>
            <h2>{pick(slide.title)}</h2>
            <p className={styles.heroBody}>{pick(slide.body)}</p>
            <div className={styles.heroActions}>
              <Link className={styles.heroPrimary} href="/sign-up">{text("Start learning", "सीखना शुरू करें")}</Link>
              <Link className={styles.heroSecondary} href={slide.link.href}>{pick(slide.link.label)}</Link>
            </div>
          </div>
        </article>;
      })}
    </div>

    <div className={styles.heroControls}>
      <div className={styles.heroSegments} role="group" aria-label={text("Choose a slide", "स्लाइड चुनें")}>
        {slides.map((slide, position) => <button key={slide.id} type="button" className={styles.heroSegment} aria-current={position === index || undefined}
          aria-label={`${pick(slide.tool)} (${position + 1} / ${total})`} onClick={() => go(position)}>
          <span>{pick(slide.tool)}</span>
          <i aria-hidden="true"><b data-running={(position === index && running) || undefined} key={position === index ? `run-${index}-${running}` : "idle"} style={{ animationDuration: `${INTERVAL}ms` }} /></i>
        </button>)}
      </div>
      <div className={styles.heroNav}>
        <p className={styles.heroCount} aria-hidden="true"><b>{pad(index + 1)}</b> / {pad(total)}</p>
        <button type="button" className={styles.heroArrow} onClick={() => go(index - 1)} aria-label={text("Previous slide", "पिछली स्लाइड")}><ChevronLeft size={20} aria-hidden="true" /></button>
        <button type="button" className={styles.heroArrow} onClick={() => go(index + 1)} aria-label={text("Next slide", "अगली स्लाइड")}><ChevronRight size={20} aria-hidden="true" /></button>
        <button type="button" className={styles.heroArrow} onClick={() => setPlaying(value => !value)} aria-pressed={!playing}
          aria-label={playing ? text("Pause slides", "स्लाइड रोकें") : text("Play slides", "स्लाइड चलाएँ")}>
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  </section>;
}
