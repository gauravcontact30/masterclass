"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ChevronLeft, ChevronRight, Compass, Cpu, GraduationCap, Languages, Layers, Pause, Play, Sparkles, Timer, Workflow, CheckCircle2, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { useLanguage } from "./language-provider";
import styles from "./welcome-modal.module.css";

const SLIDE_MS = 5000;
type Pair = [string, string];
type Slide = { src: string; focus: string; icon: LucideIcon; tone: string; title: Pair; text: Pair; points: Pair[] };

const SLIDES: Slide[] = [
  {
    src: "/images/landing/hero-build.webp",
    focus: "70% 45%",
    icon: GraduationCap,
    tone: "clay",
    title: ["Every technology, one library", "हर तकनीक, एक संपूर्ण लाइब्रेरी"],
    text: ["AI agents, cloud systems, system design and full-stack engineering courses written as clear, complete lessons you can finish.", "AI एजेंट, क्लाउड सिस्टम, सिस्टम डिज़ाइन और फ़ुल-स्टैक इंजीनियरिंग के स्पष्ट, सम्पूर्ण पाठ।"],
    points: [["Structured lessons", "क्रमबद्ध पाठ"], ["Diagrams & code labs", "चित्र और कोड लैब"]],
  },
  {
    src: "/images/landing/slide-exams.webp",
    focus: "48% 40%",
    icon: Timer,
    tone: "sage",
    title: ["Practise like the real interview", "असली इंटरव्यू जैसा अभ्यास"],
    text: ["Timed quizzes and certification mock exams with objective and subjective questions, full solutions and answer reviews.", "वस्तुनिष्ठ व विषयनिष्ठ प्रश्नों वाले समयबद्ध क्विज़ और सर्टिफ़िकेशन मॉक परीक्षाएँ, पूर्ण हल सहित।"],
    points: [["Timed practice", "समयबद्ध अभ्यास"], ["Worked solutions", "हल सहित समीक्षा"]],
  },
  {
    src: "/images/landing/slide-interview.webp",
    focus: "55% 40%",
    icon: Compass,
    tone: "violet",
    title: ["Interview-ready, topic by topic", "इंटरव्यू की तैयारी, विषयवार"],
    text: ["Curated interview questions, tech comparisons and real-world workflows for developers, analysts and architects.", "डेवलपर्स और आर्किटेक्ट्स के लिए इंटरव्यू प्रश्न, तकनीकी तुलना और वास्तविक वर्कफ़्लो।"],
    points: [["Tech comparisons", "तकनीकी तुलना"], ["Workflow prep", "वर्कफ़्लो तैयारी"]],
  },
  {
    src: "/images/landing/path-tech.webp",
    focus: "50% 45%",
    icon: BookOpenCheck,
    tone: "sky",
    title: ["Official docs, clearly explained", "आधिकारिक डॉक्स, सरल भाषा में"],
    text: ["Modern API guides, interactive code labs and step-by-step blueprints aligned with the newest ecosystem releases.", "नवीनतम तकनीकों के साथ संरेखित API गाइड, हैंड्स-ऑन कोड लैब और चरणबद्ध ब्लूप्रिंट।"],
    points: [["Production blueprints", "प्रोडक्शन ब्लूप्रिंट"], ["Step-by-step build", "चरणबद्ध निर्माण"]],
  },
  {
    src: "/images/landing/slide-onthego.webp",
    focus: "68% 40%",
    icon: Languages,
    tone: "honey",
    title: ["Learn anywhere, in two languages", "कहीं भी सीखें, दो भाषाओं में"],
    text: ["Switch smoothly between English and हिन्दी any time; smart bookmarks and revision notes keep your place across devices.", "किसी भी समय English और हिन्दी के बीच स्विच करें; स्मार्ट बुकमार्क और नोट्स आपकी प्रगति याद रखते हैं।"],
    points: [["English / हिन्दी bilingual", "अंग्रेज़ी / हिन्दी द्विभाषी"], ["Notes & bookmarks", "नोट्स और बुकमार्क"]],
  },
];

type FeatureCard = {
  icon: LucideIcon;
  badge: Pair;
  title: Pair;
  desc: Pair;
  tone: string;
};

const CORE_FEATURES: FeatureCard[] = [
  {
    icon: Workflow,
    badge: ["System Architecture", "सिस्टम आर्किटेक्चर"],
    title: ["Agentic AI & System Design", "एजेंटिक AI और सिस्टम डिज़ाइन"],
    desc: ["Production blueprints, LLM agents, event-driven pipelines, and distributed architectures.", "प्रोडक्शन ब्लूप्रिंट, LLM एजेंट, इवेंट-ड्रिवन पाइपलाइन और डिस्ट्रीब्यूटेड आर्किटेक्चर।"],
    tone: "clay",
  },
  {
    icon: Compass,
    badge: ["Career & Coding", "करियर व कोडिंग"],
    title: ["300+ Tech Interview Question Bank", "300+ टेक इंटरव्यू प्रश्न बैंक"],
    desc: ["Real-world subjective and objective challenges with comprehensive step-by-step solutions.", "विस्तृत चरण-दर-चरण समाधानों के साथ वास्तविक दुनिया की वस्तुनिष्ठ व विषयगत चुनौतियाँ।"],
    tone: "violet",
  },
  {
    icon: Cpu,
    badge: ["Hands-On Labs", "प्रैक्टिकल लैब"],
    title: ["Full-Stack Guides & Tech Docs", "फ़ुल-स्टैक गाइड और टेक डॉक्स"],
    desc: ["Deep dives across 33+ modern technologies with copy-paste runnable commands and code.", "33+ आधुनिक तकनीकों में सीधे चलने योग्य कोड और कमांड्स के साथ संपूर्ण व्यावहारिक अध्ययन।"],
    tone: "sky",
  },
  {
    icon: Timer,
    badge: ["Certification Prep", "सर्टिफ़िकेशन तैयारी"],
    title: ["Timed Mock Exams & Quizzes", "समयबद्ध मॉक परीक्षाएँ और क्विज़"],
    desc: ["Simulate authentic exam environments with instant score analytics and rationale breakdowns.", "तत्काल स्कोर विश्लेषण और विस्तृत व्याख्याओं के साथ वास्तविक परीक्षा जैसा अनुभव।"],
    tone: "sage",
  },
];

const HIGHLIGHTS: Pair[] = [
  ["English & हिन्दी Bilingual", "English और हिन्दी द्विभाषी"],
  ["33+ Modern Tech Stacks", "33+ आधुनिक टेक स्टैक"],
  ["Coffee & Code Daily Insights", "कॉफ़ी और कोड दैनिक इनसाइट्स"],
  ["Interactive Revision Notes", "इंटरैक्टिव रिवीज़न नोट्स"],
];

/**
 * The first-visit welcome: an autoplay visual tour on the left, beside a creative and professional
 * showcase of MasterClass's core superpowers and learning ecosystem on the right.
 * No plan or pricing information is displayed.
 */
export default function WelcomeModalPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prices?: unknown;
  onCurrency?: unknown;
}) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const say = (pair: Pair) => pair[hi ? 1 : 0];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(() => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const [hold, setHold] = useState(false);
  const running = open && !paused && !hold;

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setIndex(i => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [running, index]);

  const go = (step: number) => setIndex(i => (i + step + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[index];
  const close = () => onOpenChange(false);
  const start = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent initialFocus={start} className={`${styles.popup} p-0 gap-0 sm:max-w-240`}>
        <div ref={start} tabIndex={-1} className={styles.layout}>
          {/* Left Column: Visual Interactive Tour */}
          <section
            className={styles.tour}
            aria-roledescription="carousel"
            aria-label={hi ? "मुख्य सुविधाएँ" : "Core features"}
            onPointerEnter={() => setHold(true)}
            onPointerLeave={() => setHold(false)}
            onFocus={() => setHold(true)}
            onBlur={() => setHold(false)}
          >
            {SLIDES.map((item, i) => (
              <div key={item.src} className={styles.slide} data-active={i === index || undefined} aria-hidden="true">
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="(max-width: 760px) 100vw, 520px"
                  className={styles.photo}
                  style={{ objectPosition: item.focus }}
                  priority={i === 0}
                />
              </div>
            ))}
            <div className={styles.shade} aria-hidden="true" />
            <div
              className={styles.copy}
              key={index}
              data-tone={slide.tone}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${SLIDES.length}`}
              aria-live={running ? "off" : "polite"}
            >
              <span className={styles.badge}>
                <slide.icon size={15} aria-hidden="true" />
                {`${index + 1} / ${SLIDES.length}`}
              </span>
              <h3>{say(slide.title)}</h3>
              <p>{say(slide.text)}</p>
              <ul>
                {slide.points.map(point => (
                  <li key={point[0]}>
                    <Sparkles size={12} aria-hidden="true" />
                    {say(point)}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.round}
                onClick={() => go(-1)}
                aria-label={hi ? "पिछली स्लाइड" : "Previous slide"}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <div className={styles.dots}>
                {SLIDES.map((item, i) => (
                  <button
                    key={item.src}
                    type="button"
                    aria-current={i === index || undefined}
                    aria-label={say(item.title)}
                    className={styles.dot}
                    data-active={i === index || undefined}
                    onClick={() => setIndex(i)}
                  >
                    {i === index && (
                      <i
                        key={index}
                        style={{
                          animationDuration: `${SLIDE_MS}ms`,
                          animationPlayState: running ? "running" : "paused",
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.round}
                onClick={() => setPaused(p => !p)}
                aria-label={paused ? (hi ? "स्लाइड चलाएँ" : "Play slides") : (hi ? "स्लाइड रोकें" : "Pause slides")}
              >
                {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className={styles.round}
                onClick={() => go(1)}
                aria-label={hi ? "अगली स्लाइड" : "Next slide"}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </section>

          {/* Right Column: Creative & Professional Core Features Showcase */}
          <section className={styles.showcase} aria-labelledby="welcome-modal-title">
            <div className={styles.header}>
              <p className={styles.kicker}>
                <Sparkles size={14} aria-hidden="true" />
                {hi ? "MasterClass में आपका स्वागत है" : "Welcome to MasterClass"}
              </p>
              <DialogTitle id="welcome-modal-title" className={styles.title}>
                {hi ? (
                  <>आधुनिक तकनीक में <em>महारत हासिल करें।</em></>
                ) : (
                  <>Everything you need to <em>master modern tech.</em></>
                )}
              </DialogTitle>
              <DialogDescription className={styles.lede}>
                {hi
                  ? "सॉफ़्टवेयर डेवलपर्स, आर्किटेक्ट्स और टेक लीडर्स के लिए तैयार किया गया उच्च-गुणवत्ता वाला संपूर्ण लर्निंग इकोसिस्टम।"
                  : "A unified, production-grade learning platform built specifically for software engineers, systems architects, and modern developers."}
              </DialogDescription>
            </div>

            {/* Core Features Grid */}
            <div className={styles.featureGrid}>
              {CORE_FEATURES.map(feat => (
                <div key={feat.title[0]} className={styles.featureCard} data-tone={feat.tone}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon}>
                      <feat.icon size={17} aria-hidden="true" />
                    </span>
                    <span className={styles.cardBadge}>{say(feat.badge)}</span>
                  </div>
                  <h4>{say(feat.title)}</h4>
                  <p>{say(feat.desc)}</p>
                </div>
              ))}
            </div>

            {/* Highlights Chips Bar */}
            <div className={styles.highlightsBar} aria-label={hi ? "प्लेटफ़ॉर्म विशेषताएँ" : "Platform highlights"}>
              {HIGHLIGHTS.map(item => (
                <span key={item[0]} className={styles.chip}>
                  <CheckCircle2 size={13} aria-hidden="true" />
                  {say(item)}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
              <Link href="/sign-up" className={styles.primary} onClick={close}>
                {hi ? "सीखना शुरू करें" : "Start Learning Now"}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/#tech-docs" className={styles.secondary} onClick={close}>
                <Layers size={16} aria-hidden="true" />
                {hi ? "पाठ्यक्रम देखें" : "Explore Curriculum"}
              </Link>
            </div>

            <button type="button" className={styles.later} onClick={close}>
              {hi ? "बंद करें और ब्राउज़ करें" : "Dismiss and browse"}
            </button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
