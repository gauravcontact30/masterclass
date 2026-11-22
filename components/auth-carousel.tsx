"use client";
import { PORTALS, type Portal } from "@/lib/portal";
import { localImage } from "@/lib/responsive-image-loader";
import Image from "@/components/responsive-image";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import { useVisiblePlayback } from "./use-visible-playback";
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
  const [moved, setMoved] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const regionRef = useRef<HTMLElement>(null);
  const visible = useVisiblePlayback(regionRef);
  const rotating = playing && visible && !hovered && !focused && slides.length > 1;

  // A fresh timeout per slide (rather than an interval) keeps the dot's progress
  // bar and the actual advance in step after every pause and manual jump.
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => { setMoved(true); setIndex(i => (i + 1) % slides.length); }, intervalMs);
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
    <section ref={regionRef} className={styles.carousel} aria-roledescription="carousel" aria-label={labels.region} data-rotating={rotating}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={leaveFocus}>
      {/* Controls come first in reading order so keyboard users reach pause before the slides. */}
      <div className={styles.controls}>
        <button type="button" className={styles.playToggle} aria-label={playing ? labels.pause : labels.play} onClick={togglePlay}>
          {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
        </button>
        <div className={styles.dots}>
          {slides.map((slide, i) => (
            <button key={slide.id} type="button" className={styles.dot} aria-label={labels.goTo(i + 1)} aria-current={i === index ? "true" : undefined} onClick={() => { setMoved(true); setIndex(i); }}>
              {i === index && rotating && <span key={index} className={styles.dotProgress} style={{ animationDuration: `${intervalMs}ms` }} />}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.slides} aria-live={rotating ? "off" : "polite"}>
        {slides.map((slide, i) => (
          <div key={slide.id} role="group" aria-roledescription="slide" aria-label={labels.position(i + 1, slides.length)} hidden={i !== index} data-animate={(moved && i === index) || undefined} className={styles.slide}>
            <div className={styles.art} aria-hidden="true"><div className={styles.photo}>{/* The current photograph and the next, so a slide never opens on an empty frame. */}{(i === index || i === (index + 1) % slides.length) && <Image src={slide.image} alt="" fill sizes="(max-width: 899px) 100vw, 460px" priority={i === 0} unoptimized={!localImage(slide.image)} />}</div></div>
            <h2 className={styles.slideTitle}>{slide.title}</h2>
            <p className={styles.slideBody}>{slide.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Slides for the two exam portals: [id, English title, English body, Hindi title, Hindi body]. Photos: public/images/auth/<id>.webp. */
const EXAM_SLIDES: Record<"boards" | "competitive", [string, string, string, string, string][]> = {
  boards: [
    ["boards-chapters", "Every chapter, topic by topic.", "UP Board, CBSE and ICSE / ISC for Class 10 and 12: Maths, Physics, Chemistry and English, with questions and answers for every topic.", "हर अध्याय, टॉपिक दर टॉपिक।", "कक्षा 10 और 12 के लिए UP Board, CBSE और ICSE / ISC: गणित, भौतिकी, रसायन और अंग्रेज़ी, हर टॉपिक के प्रश्न-उत्तर के साथ।"],
    ["boards-practice", "Most asked, marked by year.", "See which questions keep returning, the years they were asked and a star rating for how likely they are this year.", "सबसे ज़्यादा पूछे गए, वर्ष के साथ।", "देखें कौन से प्रश्न बार-बार आते हैं, किन वर्षों में पूछे गए और इस साल उनकी संभावना की स्टार रेटिंग।"],
    ["boards-science", "Understand it, then practise it.", "Chapter pictures, worked answers and objective practice, so a topic makes sense before you write it in the exam.", "पहले समझें, फिर अभ्यास करें।", "अध्याय चित्र, हल किए गए उत्तर और वस्तुनिष्ठ अभ्यास, ताकि परीक्षा में लिखने से पहले टॉपिक समझ आ जाए।"],
    ["boards-results", "20 years of papers, and the next exam.", "Official past papers for 20 years and each subject's upcoming exam date, so you always know how much time is left.", "20 वर्षों के प्रश्नपत्र और अगली परीक्षा।", "20 वर्षों के आधिकारिक प्रश्नपत्र और हर विषय की आगामी परीक्षा तिथि, ताकि हमेशा पता रहे कितना समय बचा है।"],
  ],
  competitive: [
    ["competitive-defence", "NDA, Defence, Banks, Railways and more.", "Top ranked government exams in one place: SSC, UPSC, CBI, Income Tax, Police, Insurance and others.", "NDA, डिफेंस, बैंक, रेलवे और अधिक।", "शीर्ष सरकारी परीक्षाएँ एक जगह: SSC, UPSC, CBI, आयकर, पुलिस, बीमा और अन्य।"],
    ["competitive-study", "400+ questions for every exam.", "Objective questions with four options, the correct answer and a short explanation of why it is right.", "हर परीक्षा के लिए 400+ प्रश्न।", "चार विकल्पों वाले वस्तुनिष्ठ प्रश्न, सही उत्तर और उसकी छोटी व्याख्या।"],
    ["competitive-practice", "Practise against the clock.", "Timed tests, the year a question was asked and a star rating, so you prepare what recurs first.", "समय के साथ अभ्यास करें।", "समयबद्ध टेस्ट, प्रश्न पूछे जाने का वर्ष और स्टार रेटिंग, ताकि जो बार-बार आता है वह पहले तैयार हो।"],
    ["competitive-success", "Plan with the exam calendar.", "Each exam's conducting body, official website and how often it is held, so no notification passes you by.", "परीक्षा कैलेंडर से योजना बनाएँ।", "हर परीक्षा की संचालक संस्था, आधिकारिक वेबसाइट और आवृत्ति, ताकि कोई अधिसूचना न छूटे।"],
  ],
};

/** The brand panel beside the auth form: the portal's tagline, an autoplay photo carousel for the portal chosen under
 *  "Choose your portal", and a closing note. Tech Pro's sign-up shows its own photographs, so none repeats between its
 *  two pages; each exam portal has four photographs of its own. */
export function AuthStory({ mode = "signin", portal = "tech" }: { mode?: "signin" | "signup"; portal?: Portal }) {
  const { t, language } = useLanguage();
  const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
  const labels = {
    region: t("authCarouselLabel"), pause: t("authCarouselPause"), play: t("authCarouselPlay"),
    goTo: (n: number) => fill(t("authCarouselGoTo"), { n }), position: (n: number, total: number) => fill(t("authCarouselPosition"), { n, total }),
  };
  if (portal !== "tech") {
    const hi = language === "hi";
    const slides: AuthSlide[] = EXAM_SLIDES[portal].map(([id, title, body, hiTitle, hiBody]) => ({ id, title: hi ? hiTitle : title, body: hi ? hiBody : body, image: `/images/auth/${id}.webp` }));
    return (
      <aside className={styles.story} data-portal={portal}>
        <p className={styles.tagline}><span aria-hidden="true">✦</span>{PORTALS[portal].name} · {hi ? "परीक्षा तैयारी" : "Exam preparation"}</p>
        {/* Keyed by portal: switching portals starts the new portal's slides from the first. */}
        <AuthCarousel key={portal} slides={slides} labels={labels} />
        <p className={styles.libraryNote}><Library size={16} aria-hidden="true" />{hi ? "यह खाता Tech Pro और दूसरे परीक्षा पोर्टल से अलग है, अपने ट्रायल और सदस्यता के साथ।" : "This account is separate from Tech Pro and the other exam portal, with its own trial and membership."}</p>
      </aside>
    );
  }
  const slides: AuthSlide[] = (["guide", "formats", "languages", "plans"] as const).map((id, at) => {
    const n = at + 1 as 1 | 2 | 3 | 4;
    return { id, title: t(`authSlide${n}Title`), body: t(`authSlide${n}Body`), image: `/images/auth/${mode === "signup" ? "signup-" : ""}${id}.webp` };
  });
  return (
    <aside className={styles.story}>
      <p className={styles.tagline}><span aria-hidden="true">✦</span>{t("brandLine")}</p>
      <AuthCarousel key={portal} slides={slides} labels={labels} />
      <p className={styles.libraryNote}><Library size={16} aria-hidden="true" />{t("authLibraryNote")}</p>
    </aside>
  );
}
