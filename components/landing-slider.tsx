"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import { preload } from "react-dom";
import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight, Flame, Pause, Play } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./landing-home.module.css";
import { useVisiblePlayback } from "./use-visible-playback";

/** Three loops of a prolate cycloid running into a straight tail: the "TECH BUZZ - BLOGS" swirl arrow (viewBox 0 0 160 48). */
const SWIRL = "M16.0 24.0 16.9 21.7 17.3 19.4 17.3 17.3 16.9 15.5 16.2 14.0 15.2 12.9 14.0 12.2 12.8 12.0 11.6 12.2 10.4 12.9 9.4 14.0 8.7 15.5 8.3 17.3 8.3 19.4 8.7 21.7 9.6 24.0 10.9 26.3 12.7 28.6 14.9 30.7 17.5 32.5 20.4 34.0 23.6 35.1 26.9 35.8 30.4 36.0 33.8 35.8 37.2 35.1 40.4 34.0 43.3 32.5 45.9 30.7 48.1 28.6 49.9 26.3 51.2 24.0 52.1 21.7 52.5 19.4 52.5 17.3 52.1 15.5 51.4 14.0 50.4 12.9 49.2 12.2 48.0 12.0 46.7 12.2 45.6 12.9 44.6 14.0 43.9 15.5 43.5 17.3 43.5 19.4 43.9 21.7 44.8 24.0 46.1 26.3 47.9 28.6 50.1 30.7 52.7 32.5 55.6 34.0 58.8 35.1 62.1 35.8 65.6 36.0 69.0 35.8 72.4 35.1 75.5 34.0 78.5 32.5 81.1 30.7 83.3 28.6 85.0 26.3 86.4 24.0 87.2 21.7 87.7 19.4 87.6 17.3 87.3 15.5 86.5 14.0 85.6 12.9 84.4 12.2 83.2 12.0 81.9 12.2 80.8 12.9 79.8 14.0 79.1 15.5 78.7 17.3 78.7 19.4 79.1 21.7 80.0 24.0 81.3 26.3 83.1 28.6 85.3 30.7 87.9 32.5 90.8 34.0 94.0 35.1 97.3 35.8 100.8 36.0 104.2 35.8 107.6 35.1 110.7 34.0 113.6 32.5 116.2 30.7 118.4 28.6 120.2 26.3 121.6 24.0 152.0 24.0";
const POINTER_COLORS = [
  { from: "#ffd166", to: "#ff5d8f", chip: "linear-gradient(135deg, #1e1b4b, #4c1d95)" },
  { from: "#5eead4", to: "#38bdf8", chip: "linear-gradient(135deg, #0f172a, #134e4a)" },
  { from: "#f9a8d4", to: "#c4b5fd", chip: "linear-gradient(135deg, #3b0764, #831843)" },
  { from: "#bef264", to: "#22d3ee", chip: "linear-gradient(135deg, #052e16, #1e3a8a)" },
  { from: "#fdba74", to: "#f43f5e", chip: "linear-gradient(135deg, #1c1917, #7c2d12)" },
  { from: "#93c5fd", to: "#a78bfa", chip: "linear-gradient(135deg, #082f49, #312e81)" },
];
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

// Each slide stays 15 s before the next one slides in.
const INTERVAL = 15000;
type MultiLang = Record<import("@/lib/domain").Language, string>;
type SlideBase = {
  id: string;
  src: string;
  focus: string;
  tone: "clay" | "sage" | "violet" | "sky" | "honey";
  tool: MultiLang;
  alt: string;
};
/** A photograph with its own headline, copy and actions over it. */
type StorySlide = SlideBase & { infographic?: undefined; title: MultiLang; body: MultiLang; link: { label: MultiLang; href: string } };
/** An image that carries all its words itself, shown with nothing over it; `portrait` is the phone layout. */
type InfographicSlide = SlideBase & { infographic: { portrait: string } };
type Slide = StorySlide | InfographicSlide;

/**
 * An infographic slide: the landscape file on wide screens, the portrait one on phones (art direction, so each screen
 * downloads only its own), full-bleed and slowly zoomed like every other slide; its words sit inside the frame's safe
 * zone (scripts/generate-stack-infographic.ts). The first slide is the LCP image, so both candidates are preloaded for
 * their own media query.
 */
function InfographicImage({ slide, priority, onLoad }: { slide: InfographicSlide; priority: boolean; onLoad?: () => void }) {
  const common = { alt: slide.alt, sizes: "100vw", quality: 85, loading: priority ? "eager" : "lazy", fetchPriority: priority ? "high" : undefined } as const;
  const { props: { srcSet: wide } } = getImageProps({ ...common, src: slide.src, width: 3840, height: 2160 });
  const { props: { srcSet: tall, ...rest } } = getImageProps({ ...common, src: slide.infographic.portrait, width: 2160, height: 3840 });
  if (priority) {
    preload(slide.src, { as: "image", imageSrcSet: wide, imageSizes: "100vw", media: PORTRAIT_OFF, fetchPriority: "high" });
    preload(slide.infographic.portrait, { as: "image", imageSrcSet: tall, imageSizes: "100vw", media: PORTRAIT_ON, fetchPriority: "high" });
  }
  return <picture>
    <source media={PORTRAIT_ON} srcSet={tall} sizes="100vw" />
    <source media={PORTRAIT_OFF} srcSet={wide} sizes="100vw" />
    <img {...rest} alt={slide.alt} className={`${styles.heroImage} ${styles.heroInfographic}`} style={{ "--focus": slide.focus } as React.CSSProperties} onLoad={onLoad} />
  </picture>;
}
// Phones and other tall screens get the portrait layout.
const PORTRAIT_ON = "(max-aspect-ratio: 4/5)";
const PORTRAIT_OFF = "(min-aspect-ratio: 4.001/5)";

/**
 * The landing hero: four full-HD (1920×1080) study scenes painted by scripts/generate-hero-images.ts (each file's EXIF
 * ImageDescription holds its prompt), full-bleed under the navbar. Each slide
 * carries its own headline and actions. Autoplay runs while the mouse is over it (the hero fills the screen, so a hover
 * pause meant it almost never moved); it pauses for keyboard focus inside it, with the pause button, off screen, and
 * never starts for visitors who prefer reduced motion.
 */
function slidesFor(technologies: number | undefined): Slide[] {
  const count = technologies ? String(technologies) : "60+";
  return [
    {
      id: "stack",
      src: "/images/landing/hero-stack.webp",
      infographic: { portrait: "/images/landing/hero-stack-portrait.webp" },
      focus: "50% 50%",
      tone: "sky",
      tool: {
        en: "76 technologies",
        hi: "लोकप्रिय टेक्नोलॉजी",
        es: "Tecnologías populares",
        ja: "人気のテクノロジー",
        de: "Beliebte Technologien",
        fr: "Technologies populaires",
        zh: "热门技术"
      },
      alt: "The technology universe: all 76 technologies MasterClass Buddy teaches, in 13 families. Java, C++ & DSA: Core Java, Advanced Java, Spring Boot, C++, DSA, Java Basic to Advanced. AI & agents: AI & ML, AI Tools, AI Agents, LangChain, LangGraph, LangSmith, LangFlow, n8n. Frontend frameworks: Next.js 16+, React 19+, T3 Stack, Angular, Vue.js, Flutter. Languages & fundamentals: TypeScript, JavaScript, JS Puzzles, Python, Rust, Go. State & data on the client: TanStack, Zustand, Redux Toolkit. Backend & APIs: Node.js, Express.js, FastAPI, GraphQL, Django, NestJS. Validation & forms: Pydantic, Zod, Conform. Authentication: Auth.js, Clerk, Kinde, Better Auth. Databases & storage: Drizzle ORM, Prisma, Neon, Redis, Upstash, PostgreSQL, Supabase. Python data & ML: NumPy, Pandas, Polars, SciPy, Scikit-Learn, TensorFlow, PyTorch, Keras, Seaborn, Plotly. HTTP & scraping: Requests, HTTPX, Scrapy. Testing & quality: Jest, Vitest, React Testing Library, Playwright, Cypress. Cloud, ops & architecture: Inngest, Arcjet, System Design, AWS Services, DevOps, Docker, Kubernetes, Git, Linux."
    },
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
        en: "Turn technical knowledge into working software. Build AI agents, design cloud systems and ship full-stack projects with guided practice that sharpens your skills for interviews and everyday engineering.",
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

/** The floating Tech Buzz dock on the hero. Its 5-second colour beat lives here, so it re-renders only itself, not the
 *  whole carousel. */
function TechBuzzDock() {
  const { t } = useLanguage();
  const [buzzColorIndex, setBuzzColorIndex] = useState(0);

  // Change Master Class Buddy - Tech Buzz button background color every 5 seconds (Suggestion Box palette)
  useEffect(() => {
    const timer = setInterval(() => {
      setBuzzColorIndex(prev => (prev + 1) % SUGGESTION_BOX_PALETTES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentBuzzColor = SUGGESTION_BOX_PALETTES[buzzColorIndex];
  // The "TECH BUZZ - BLOGS" swirl arrow and its words take a new vivid pair on the same 5-second beat.
  const pointerColor = POINTER_COLORS[buzzColorIndex % POINTER_COLORS.length];
  const pointerId = useId();
  // A circular button (5-second cycling Suggestion Box palette). The "TECH BUZZ - BLOGS" swirl arrow flies in from a
  // different side each round and lands pointing at it; hover or focus expands the button leftwards into its label.
  return (
    <div className={styles.buzzDock}>
      <span className={styles.buzzPointer} aria-hidden="true">
        <span className={styles.buzzPointerText} style={{ color: pointerColor.from, "--chip": pointerColor.chip } as React.CSSProperties}>TECH BUZZ - BLOGS</span>
        <svg className={styles.buzzPointerArrow} width="160" height="48" viewBox="0 0 160 48" fill="none">
          <defs>
            <linearGradient id={`${pointerId}g`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" style={{ stopColor: pointerColor.from }} />
              <stop offset="1" style={{ stopColor: pointerColor.to }} />
            </linearGradient>
            {/* A solid copy of the swirl, drawn on slowly, reveals the dashed one underneath. */}
            <mask id={`${pointerId}m`} maskUnits="userSpaceOnUse">
              <path className={styles.buzzPointerReveal} d={SWIRL} pathLength={1} stroke="#fff" strokeWidth="5" />
            </mask>
          </defs>
          <g stroke={`url(#${pointerId}g)`}>
            <path className={styles.buzzPointerDash} d={SWIRL} mask={`url(#${pointerId}m)`} />
            <path className={styles.buzzPointerHead} d="M144 16 153 24 144 32" />
          </g>
        </svg>
      </span>
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
        <span className={styles.buzzLabel}>
          <span>{t("techBuzzBadge") || "Master Class Buddy - Tech Buzz"}</span>
          <Bell size={14} className={styles.floatingTechBuzzBell} style={{ color: currentBuzzColor.bellColor }} aria-hidden="true" />
          <span className={styles.floatingTechBuzzRating} style={{ color: currentBuzzColor.ratingColor }}>
            <span className={styles.floatingTechBuzzStar}>★</span>4.9
          </span>
        </span>
        <span className={styles.buzzFace} style={{ background: currentBuzzColor.badgeBg, color: currentBuzzColor.badgeColor }}>
          <Flame size={18} className={styles.floatingTechBuzzFlame} aria-hidden="true" />
          <span className={styles.bellRingingDot} style={{ background: currentBuzzColor.bellColor }} />
        </span>
      </Link>
    </div>
  );
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


  return <section ref={regionRef} className={styles.heroSlider} aria-roledescription="carousel" aria-label={t("heroSliderLabel") || "Learning with MasterClass"}
    // Only keyboard focus holds the slide (a mouse click on an arrow or dot should not stop the show).
    onFocus={event => { if (event.target.matches(":focus-visible")) setHeld(true); }} onBlur={event => { if (!regionRef.current?.contains(event.relatedTarget as Node)) setHeld(false); }}
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
    <TechBuzzDock />
    <div className={styles.heroStage} aria-live={running ? "off" : "polite"}>
      {slides.map((slide, position) => {
        const current = position === index;
        if (slide.infographic) return <article key={slide.id} className={styles.heroSlide} data-active={current || undefined} aria-roledescription="slide"
          aria-label={`${position + 1} / ${total}`} aria-hidden={!current} inert={!current}>
          {requested.has(position) && <InfographicImage slide={slide} priority={position === 0}
            onLoad={position === 0 ? () => setRequested(previous => previous.has(1) ? previous : new Set([...previous, 1])) : undefined} />}
        </article>;
        return <article key={slide.id} className={styles.heroSlide} data-active={current || undefined} aria-roledescription="slide"
          aria-label={`${position + 1} / ${total}`} aria-hidden={!current} inert={!current}>
          {/* Only the LCP image is requested initially. Warm the next slide after it loads;
              retain visited images so cross-fades and backwards navigation stay smooth. */}
          {requested.has(position) && <Image src={slide.src} alt={slide.alt} fill sizes="100vw" quality={75} preload={position === 0}
            onLoad={position === 0 ? () => setRequested(previous => previous.has(1) ? previous : new Set([...previous, 1])) : undefined}
            className={styles.heroImage} style={{ "--focus": slide.focus } as React.CSSProperties} />}
          <div className={styles.heroShade} />
          <div className={styles.heroTint} data-tone={slide.tone} />
          <p className={styles.heroKicker} data-tone={slide.tone}><span aria-hidden="true" /><span className={styles.heroKickerText}>{pick(slide.tool)}</span></p>
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
