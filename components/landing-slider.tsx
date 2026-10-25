"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight, Flame, Pause, Play } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./landing-home.module.css";
import { useVisiblePlayback } from "./use-visible-playback";

const SUGGESTION_BOX_PALETTES = [
  {
    // Tone 1: Terracotta Roasted Coffee (matches Suggestion Box #3a2118 / #f0b89c)
    bg: "rgba(58, 33, 24, 0.94)",
    border: "#f0b89c",
    color: "#ffd2bd",
    badgeBg: "linear-gradient(135deg, #b5573a 0%, #e07248 100%)",
    badgeColor: "#ffffff",
    ratingColor: "#ffd2bd",
    bellColor: "#ffd2bd",
    glow: "rgba(240, 184, 156, 0.45)"
  },
  {
    // Tone 2: Forest Emerald Pine (matches Suggestion Box #15392b / #9fd4b8)
    bg: "rgba(21, 57, 43, 0.94)",
    border: "#9fd4b8",
    color: "#bff0dc",
    badgeBg: "linear-gradient(135deg, #1b6348 0%, #2e8b65 100%)",
    badgeColor: "#ffffff",
    ratingColor: "#bff0dc",
    bellColor: "#bff0dc",
    glow: "rgba(159, 212, 184, 0.45)"
  },
  {
    // Tone 3: Royal Violet Night (matches Suggestion Box #28214d / #bfb3ef)
    bg: "rgba(40, 33, 77, 0.94)",
    border: "#bfb3ef",
    color: "#dccfff",
    badgeBg: "linear-gradient(135deg, #4f3da3 0%, #705ecb 100%)",
    badgeColor: "#ffffff",
    ratingColor: "#dccfff",
    bellColor: "#dccfff",
    glow: "rgba(191, 179, 239, 0.45)"
  },
  {
    // Tone 4: Antique Amber Gold (matches Suggestion Box #3b2f08 / #e6cb6c)
    bg: "rgba(59, 47, 8, 0.94)",
    border: "#e6cb6c",
    color: "#fff0a8",
    badgeBg: "linear-gradient(135deg, #947113 0%, #c49925 100%)",
    badgeColor: "#ffffff",
    ratingColor: "#fff0a8",
    bellColor: "#fff0a8",
    glow: "rgba(230, 203, 108, 0.45)"
  },
  {
    // Tone 5: Oceanic Navy Twilight (matches Suggestion Box #12314a / #a6cdee)
    bg: "rgba(18, 49, 74, 0.94)",
    border: "#a6cdee",
    color: "#bcdcff",
    badgeBg: "linear-gradient(135deg, #205c8c 0%, #3580ba 100%)",
    badgeColor: "#ffffff",
    ratingColor: "#bcdcff",
    bellColor: "#bcdcff",
    glow: "rgba(166, 205, 238, 0.45)"
  },
  {
    // Tone 6: Velvet Plum Berry (matches Suggestion Box #3d1a2a / #eeb0c6)
    bg: "rgba(61, 26, 42, 0.94)",
    border: "#eeb0c6",
    color: "#ffc4dd",
    badgeBg: "linear-gradient(135deg, #993766 0%, #c44f88 100%)",
    badgeColor: "#ffffff",
    ratingColor: "#ffc4dd",
    bellColor: "#ffc4dd",
    glow: "rgba(238, 176, 198, 0.45)"
  }
];

const INTERVAL = 10000;
type MultiLang = Record<import("@/lib/domain").Language, string>;
type Slide = {
  id: string;
  src: string;
  focus: string;
  tone: "clay" | "sage" | "violet" | "sky" | "honey";
  tool: MultiLang;
  title: MultiLang;
  body: MultiLang;
  link: { label: MultiLang; href: string };
  alt: string;
};

/**
 * The landing hero: four full-HD (1920×1080) study scenes painted by scripts/generate-hero-images.ts (each file's EXIF
 * ImageDescription holds its prompt), full-bleed under the navbar. Each slide
 * carries its own headline and actions; autoplay pauses on hover, on focus,
 * with the pause button, and never starts for visitors who prefer reduced motion.
 */
function slidesFor(technologies: number | undefined): Slide[] {
  const count = technologies ? String(technologies) : "60+";
  return [
    {
      id: "campus",
      src: "/images/landing/hero-campus-2.webp",
      focus: "68% 45%",
      tone: "clay",
      tool: {
        en: "MasterClass Buddy campus",
        hi: "MasterClass Buddy कैंपस",
        es: "Campus MasterClass Buddy",
        ja: "MasterClass Buddy キャンパス",
        de: "MasterClass Buddy Campus",
        fr: "Campus MasterClass Buddy",
        zh: "MasterClass Buddy 校园"
      },
      title: {
        en: "Your campus for the skills companies hire for.",
        hi: "उन स्किल्स का कैंपस, जिनके लिए कंपनियाँ भर्ती करती हैं।",
        es: "Tu campus para las habilidades más demandadas por las empresas.",
        ja: "企業が求めるスキルを習得できるあなたのキャンパス。",
        de: "Ihr Campus für gefragte Fähigkeiten, die Unternehmen suchen.",
        fr: "Votre campus pour les compétences recherchées par les entreprises.",
        zh: "掌握名企青睐核心技能的学习殿堂。"
      },
      body: {
        en: "Step into one place for AI agents, cloud, system design and full-stack development, with interview prep, certification paths and real projects, in English or हिन्दी.",
        hi: "AI एजेंट, क्लाउड, सिस्टम डिज़ाइन और फ़ुल-स्टैक डेवलपमेंट के लिए एक ही जगह, इंटरव्यू तैयारी, सर्टिफ़िकेशन रास्तों और असली प्रोजेक्ट्स के साथ, English या हिन्दी में।",
        es: "Un único lugar para agentes de IA, nube, diseño de sistemas y desarrollo full-stack, con preparación para entrevistas, certificaciones y proyectos reales.",
        ja: "AIエージェント、クラウド、システム設計、フルスタック開発を網羅。面接対策、認定資格パス、実践プロジェクトを一箇所で学べます。",
        de: "Ein zentraler Ort für KI-Agenten, Cloud, Systemdesign und Full-Stack-Entwicklung mit Vorbereitung auf Vorstellungsgespräche, Zertifizierungspfaden und echten Projekten.",
        fr: "Un guichet unique pour les agents IA, le cloud, la conception de systèmes et le développement full-stack, avec préparation aux entretiens et projets réels.",
        zh: "汇聚AI智能体、云计算、系统架构与全栈开发，提供全套面试通关指南、专业认证路径与实战项目。"
      },
      link: {
        label: {
          en: "Explore the free library",
          hi: "मुफ़्त लाइब्रेरी देखें",
          es: "Explorar la biblioteca gratuita",
          ja: "無料ライブラリを探索",
          de: "Kostenlose Bibliothek erkunden",
          fr: "Explorer la bibliothèque gratuite",
          zh: "探索免费知识库"
        },
        href: "/library"
      },
      alt: "A young professional with a leather laptop bag walking toward a campus building whose wall reads Master Class Buddy - www.masterclassbuddy.com, at golden morning light"
    },
    {
      id: "build",
      src: "/images/landing/hero-build.webp",
      focus: "70% 45%",
      tone: "violet",
      tool: {
        en: "Technology courses",
        hi: "तकनीकी कोर्स",
        es: "Cursos de tecnología",
        ja: "テクノロジーコース",
        de: "Technologiekurse",
        fr: "Cours de technologie",
        zh: "前沿技术课程"
      },
      title: {
        en: "Learn to code by building real projects.",
        hi: "असली प्रोजेक्ट बनाकर कोडिंग सीखें।",
        es: "Aprende a programar creando proyectos reales.",
        ja: "実践的なプロジェクトを作成してコーディングを習得。",
        de: "Programmieren lernen durch echte Projekte.",
        fr: "Apprenez à coder en réalisant des projets concrets.",
        zh: "通过构建真实项目精通代码。"
      },
      body: {
        en: `Step-by-step guides for ${count} technologies, from React and Node.js to AI agents, with every command and the complete code.`,
        hi: `React और Node.js से AI एजेंट तक, ${count} तकनीकों के चरण-दर-चरण गाइड, हर कमांड और पूरे कोड के साथ।`,
        es: `Guías paso a paso para ${count} tecnologías, desde React y Node.js hasta agentes de IA, con cada comando y código completo.`,
        ja: `React、Node.jsからAIエージェントまで、${count}以上の技術を網羅したステップバイステップのガイド。全コマンドとコード付き。`,
        de: `Schritt-für-Schritt-Anleitungen für ${count} Technologien, von React und Node.js bis zu KI-Agenten, mit allen Befehlen und vollständigem Code.`,
        fr: `Guides pas à pas pour ${count} technologies, de React et Node.js aux agents IA, avec chaque commande et le code complet.`,
        zh: `涵盖从 React、Node.js 到 AI Agent 等 ${count} 项技术的逐步实战教程，提供完整命令与源码。`
      },
      link: {
        label: {
          en: "Browse technology",
          hi: "तकनीक देखें",
          es: "Explorar tecnologías",
          ja: "テクノロジーを見る",
          de: "Technologien durchsuchen",
          fr: "Parcourir les technologies",
          zh: "浏览全部技术"
        },
        href: "/courses#technology"
      },
      alt: "A young developer at a sunlit desk with two monitors showing code and an architecture diagram"
    },
    {
      id: "career",
      src: "/images/landing/hero-career.webp",
      focus: "66% 45%",
      tone: "sky",
      tool: {
        en: "Interview prep",
        hi: "इंटरव्यू तैयारी",
        es: "Preparación de entrevistas",
        ja: "面接対策",
        de: "Interview-Vorbereitung",
        fr: "Préparation aux entretiens",
        zh: "技术面试精讲"
      },
      title: {
        en: "Walk into your interview confident and ready.",
        hi: "आत्मविश्वास और पूरी तैयारी के साथ इंटरव्यू दें।",
        es: "Llega a tu entrevista con total confianza y preparación.",
        ja: "自信と万全の準備で面接に臨む。",
        de: "Selbstbewusst und optimal vorbereitet ins Vorstellungsgespräch.",
        fr: "Abordez votre entretien avec assurance et préparation.",
        zh: "胸有成竹，从容应对每一次技术大厂面试。"
      },
      body: {
        en: "Real interview questions, tech comparisons, quizzes and a live code lab for your next role.",
        hi: "आपकी अगली नौकरी के लिए असली इंटरव्यू प्रश्न, तकनीकी तुलना, क्विज़ और लाइव कोड लैब।",
        es: "Preguntas reales de entrevistas, comparativas técnicas, cuestionarios y laboratorio de código en vivo para tu próximo puesto.",
        ja: "実践的な面接質問、技術比較、クイズ、ライブコードラボで次のキャリアをサポート。",
        de: "Echte Interviewfragen, Technologievergleiche, Quizze und ein Live-Codelabor für Ihre nächste Rolle.",
        fr: "Questions réelles d'entretien, comparaisons techniques, quiz et lab de code en direct pour votre prochain rôle.",
        zh: "名企高频真题、多维架构技术对比、仿真测试与在线代码实验室，助力斩获心仪 Offer。"
      },
      link: {
        label: {
          en: "Practise interviews",
          hi: "इंटरव्यू अभ्यास करें",
          es: "Practicar entrevistas",
          ja: "面接の練習をする",
          de: "Interviews üben",
          fr: "S'entraîner aux entretiens",
          zh: "开始模拟面试"
        },
        href: "#interview-prep"
      },
      alt: "Two young professionals practising a technical interview at a table, with a system diagram on a whiteboard behind them"
    },
    {
      id: "anywhere",
      src: "/images/landing/hero-certified-2.webp",
      focus: "62% 35%",
      tone: "honey",
      tool: {
        en: "Certifications",
        hi: "सर्टिफ़िकेशन",
        es: "Certificaciones",
        ja: "認定資格",
        de: "Zertifizierungen",
        fr: "Certifications",
        zh: "权威专业认证"
      },
      title: {
        en: "From learning to certified, on masterclassbuddy.com.",
        hi: "masterclassbuddy.com पर सीखने से सर्टिफ़ाइड होने तक।",
        es: "Del aprendizaje a la certificación en masterclassbuddy.com.",
        ja: "学習から資格取得まで、masterclassbuddy.com で。",
        de: "Vom Lernen zum Zertifikat auf masterclassbuddy.com.",
        fr: "De l'apprentissage à la certification sur masterclassbuddy.com.",
        zh: "从系统学习到认证通关，尽在 masterclassbuddy.com。"
      },
      body: {
        en: "Follow step-by-step paths for Agentic AI, AWS, DevOps, Cloud Architecture, AI Automation, n8n, Claude Code and System Design, practise 100+ questions each with mock exams, and walk into your certification ready.",
        hi: "Agentic AI, AWS, DevOps, क्लाउड आर्किटेक्चर, AI ऑटोमेशन, n8n, Claude Code और सिस्टम डिज़ाइन के चरण-दर-चरण रास्ते अपनाएँ, हर एक के 100+ प्रश्नों और मॉक परीक्षा से अभ्यास करें, और पूरी तैयारी के साथ सर्टिफ़िकेशन दें।",
        es: "Sigue rutas paso a paso para Agentic AI, AWS, DevOps, arquitectura cloud, automatización con IA, n8n, Claude Code y diseño de sistemas, practica con más de 100 preguntas por ruta y exámenes de prueba.",
        ja: "Agentic AI、AWS、DevOps、クラウドアーキテクチャ、AI自動化、n8n、Claude Code、システム設計の学習パスを提供。模擬試験と各100問以上の練習問題で万全の準備。",
        de: "Folgen Sie strukturierten Pfaden für Agentic AI, AWS, DevOps, Cloud-Architektur, KI-Automatisierung, n8n, Claude Code und Systemdesign mit je 100+ Übungsfragen und Probeprüfungen.",
        fr: "Suivez des parcours pas à pas pour l'IA Agentique, AWS, DevOps, l'architecture Cloud, l'automatisation IA, n8n, Claude Code et la conception système, avec examens blancs.",
        zh: "涵盖 Agentic AI、AWS、DevOps、云架构、AI自动化、n8n、Claude Code 与系统设计认证专项路径，含100+精选仿真题与全真模考。"
      },
      link: {
        label: {
          en: "See certification paths",
          hi: "सर्टिफ़िकेशन रास्ते देखें",
          es: "Ver rutas de certificación",
          ja: "認定資格パスを見る",
          de: "Zertifizierungspfade ansehen",
          fr: "Voir les parcours certifiants",
          zh: "查看认证通关路径"
        },
        href: "#certifications"
      },
      alt: "Two young professionals at an office reception holding framed Master Class Buddy certificates of completion in Agentic AI, AWS and n8n, pointing at the masterclassbuddy.com homepage on a large iMac"
    },
  ];
}

export function LandingSlider({ technologies }: { technologies?: number }) {
  const { language, t } = useLanguage();
  const pick = (record: MultiLang) => record[language] ?? record.en;
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

  const [buzzColorIndex, setBuzzColorIndex] = useState(0);

  // Change Master Class Buddy - Tech Buzz button background color every 5 seconds (Suggestion Box palette)
  useEffect(() => {
    const timer = setInterval(() => {
      setBuzzColorIndex(prev => (prev + 1) % SUGGESTION_BOX_PALETTES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentBuzzColor = SUGGESTION_BOX_PALETTES[buzzColorIndex];

  return <section ref={regionRef} className={styles.heroSlider} aria-roledescription="carousel" aria-label={t("heroSliderLabel") || "Learning with MasterClass"}
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
    {/* Floating Master Class Buddy - Tech Buzz button with animated bell and 5-second cycling Suggestion Box palette background */}
    <Link
      href="/tech-buzz"
      className={styles.floatingTechBuzz}
      style={{
        background: currentBuzzColor.bg,
        borderColor: currentBuzzColor.border,
        color: currentBuzzColor.color,
        boxShadow: `0 8px 24px -4px rgba(0, 0, 0, 0.35), 0 0 16px -2px ${currentBuzzColor.glow}`
      }}
      aria-label={t("techBuzzFloatingAria") || "Master Class Buddy - Tech Buzz"}
    >
      <span
        className={styles.floatingTechBuzzBadge}
        style={{
          background: currentBuzzColor.badgeBg,
          color: currentBuzzColor.badgeColor
        }}
      >
        <Flame size={14} className={styles.floatingTechBuzzFlame} />
        <span className={styles.floatingTechBuzzText}>
          {t("techBuzzBadge") || "Master Class Buddy - Tech Buzz"}
        </span>
      </span>
      <span className={styles.floatingTechBuzzBellWrap} title="Latest updates notification">
        <Bell size={14} className={styles.floatingTechBuzzBell} style={{ color: currentBuzzColor.bellColor }} />
        <span className={styles.bellRingingDot} style={{ background: currentBuzzColor.bellColor }} />
      </span>
      <span
        className={styles.floatingTechBuzzRating}
        style={{ color: currentBuzzColor.ratingColor }}
      >
        <span className={styles.floatingTechBuzzStar}>★</span>
        <span>4.9</span>
      </span>
    </Link>
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
              <Link className={styles.heroPrimary} href="/sign-up">{t("startLearning") || "Start learning"}</Link>
              <Link className={styles.heroSecondary} href={slide.link.href}>{pick(slide.link.label)}</Link>
            </div>
          </div>
        </article>;
      })}
    </div>

    <div className={styles.heroControls}>
      <div className={styles.heroSegments} role="group" aria-label={t("chooseSlide") || "Choose a slide"}>
        {slides.map((slide, position) => <button key={slide.id} type="button" className={styles.heroSegment} aria-current={position === index || undefined}
          aria-label={`${pick(slide.tool)} (${position + 1} / ${total})`} onClick={() => go(position)}>
          <span>{pick(slide.tool)}</span>
          <i aria-hidden="true"><b data-running={(position === index && running) || undefined} key={position === index ? `run-${index}-${running}` : "idle"} style={{ animationDuration: `${INTERVAL}ms` }} /></i>
        </button>)}
      </div>
      <div className={styles.heroNav}>
        <p className={styles.heroCount} aria-hidden="true"><b>{pad(index + 1)}</b> / {pad(total)}</p>
        <button type="button" className={styles.heroArrow} onClick={() => go(index - 1)} aria-label={t("previousSlide") || "Previous slide"}><ChevronLeft size={20} aria-hidden="true" /></button>
        <button type="button" className={styles.heroArrow} onClick={() => go(index + 1)} aria-label={t("nextSlide") || "Next slide"}><ChevronRight size={20} aria-hidden="true" /></button>
        <button type="button" className={styles.heroArrow} onClick={() => setPlaying(value => !value)} aria-pressed={!playing}
          aria-label={playing ? (t("pauseSlides") || "Pause slides") : (t("playSlides") || "Play slides")}>
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  </section>;
}
