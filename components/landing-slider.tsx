"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./landing-home.module.css";
import { useVisiblePlayback } from "./use-visible-playback";

const INTERVAL = 7000;
type Pair = [string, string];
type Slide = { id: string; src: string; focus: string; tone: "clay" | "sage" | "violet" | "sky" | "honey"; tool: Pair; title: Pair; body: Pair; link: { label: Pair; href: string }; alt: string };

/**
 * The landing hero: five full-HD (1920×1080) study scenes painted by scripts/generate-hero-images.ts (each file's EXIF
 * ImageDescription holds its prompt), full-bleed under the navbar. Each slide
 * carries its own headline and actions; autoplay pauses on hover, on focus,
 * with the pause button, and never starts for visitors who prefer reduced motion.
 */
function slidesFor(technologies: number | undefined): Slide[] {
  const count = technologies ? String(technologies) : "60+";
  return [
    { id: "school", src: "/images/landing/hero-school.webp", focus: "68% 45%", tone: "clay", tool: ["School · Class 6–12", "स्कूल · कक्षा 6–12"],
      title: ["Understand every chapter, not just memorise it.", "हर अध्याय समझें, सिर्फ़ रटें नहीं।"],
      body: ["Concept notes, solved NCERT answers and clear diagrams for CBSE, ICSE and state boards, in English or हिन्दी.", "CBSE, ICSE और राज्य बोर्ड के लिए अवधारणा नोट्स, हल किए NCERT उत्तर और स्पष्ट आरेख, English या हिन्दी में।"],
      link: { label: ["Explore school courses", "स्कूल कोर्स देखें"], href: "/courses#cbse" },
      alt: "A school student in uniform writing notes beside a laptop showing a cell diagram, in warm evening light" },
    { id: "exams", src: "/images/landing/hero-exams.webp", focus: "66% 40%", tone: "sage", tool: ["Competitive exams", "प्रतियोगी परीक्षाएँ"],
      title: ["Crack your exam with timed, real-pattern practice.", "समयबद्ध, असली पैटर्न के अभ्यास से परीक्षा पास करें।"],
      body: ["SSC, banking, railways, defence, JEE and NEET: foundations, practice papers, full solutions and answer review.", "SSC, बैंकिंग, रेलवे, रक्षा, JEE और NEET: आधार, अभ्यास पत्र, पूरे हल और उत्तर समीक्षा।"],
      link: { label: ["See exam preparation", "परीक्षा तैयारी देखें"], href: "/courses#ssc" },
      alt: "A student preparing for a competitive exam in a library, with a timer on a tablet, sticky notes and a stack of books" },
    { id: "build", src: "/images/landing/hero-build.webp", focus: "70% 45%", tone: "violet", tool: ["Technology courses", "तकनीकी कोर्स"],
      title: ["Learn to code by building real projects.", "असली प्रोजेक्ट बनाकर कोडिंग सीखें।"],
      body: [`Step-by-step guides for ${count} technologies, from React and Node.js to AI agents, with every command and the complete code.`, `React और Node.js से AI एजेंट तक, ${count} तकनीकों के चरण-दर-चरण गाइड, हर कमांड और पूरे कोड के साथ।`],
      link: { label: ["Browse technology", "तकनीक देखें"], href: "/courses#technology" },
      alt: "A young developer at a sunlit desk with two monitors showing code and an architecture diagram" },
    { id: "career", src: "/images/landing/hero-career.webp", focus: "66% 45%", tone: "sky", tool: ["Interview prep", "इंटरव्यू तैयारी"],
      title: ["Walk into your interview confident and ready.", "आत्मविश्वास और पूरी तैयारी के साथ इंटरव्यू दें।"],
      body: ["Real interview questions, tech comparisons, quizzes and a live code lab for your next role.", "आपकी अगली नौकरी के लिए असली इंटरव्यू प्रश्न, तकनीकी तुलना, क्विज़ और लाइव कोड लैब।"],
      link: { label: ["Practise interviews", "इंटरव्यू अभ्यास करें"], href: "#interview-prep" },
      alt: "Two young professionals practising a technical interview at a table, with a system diagram on a whiteboard behind them" },
    { id: "anywhere", src: "/images/landing/hero-anywhere.webp", focus: "62% 35%", tone: "honey", tool: ["Learn anywhere", "कहीं भी सीखें"],
      title: ["Turn every commute into a study session.", "हर सफ़र को पढ़ाई का समय बनाएँ।"],
      body: ["Bite-size lessons, daily vocabulary and revision notes on your phone, with bookmarks that keep your place.", "फ़ोन पर छोटे पाठ, रोज़ की शब्दावली और रिवीज़न नोट्स, बुकमार्क के साथ जो आपकी जगह याद रखें।"],
      link: { label: ["How it works", "यह कैसे काम करता है"], href: "#workflows" },
      alt: "A student with wireless earbuds learning on a phone by a metro window at sunrise, the city skyline behind" },
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
  const visible = useVisiblePlayback(regionRef);
  const [requested, setRequested] = useState(() => new Set([0]));
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
  const running = playing && !held && !reduced && visible;
  const go = useCallback((next: number) => {
    const target = (next + total) % total;
    setRequested(previous => new Set([...previous, target, (target + 1) % total]));
    setIndex(target);
  }, [total]);
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
          {/* Only the LCP image is requested initially. Warm the next slide after it loads;
              retain visited images so cross-fades and backwards navigation stay smooth. */}
          {requested.has(position) && <Image src={slide.src} alt={slide.alt} fill sizes="100vw" quality={75} preload={position === 0}
            onLoad={position === 0 ? () => setRequested(previous => previous.has(1) ? previous : new Set([...previous, 1])) : undefined}
            className={styles.heroImage} style={{ "--focus": slide.focus } as React.CSSProperties} />}
          <div className={styles.heroShade} />
          <div className={styles.heroTint} data-tone={slide.tone} />
          <p className={styles.heroKicker} data-tone={slide.tone}><span aria-hidden="true" />{pick(slide.tool)}</p>
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
