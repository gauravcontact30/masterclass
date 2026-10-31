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
 * The landing hero: the Diwali scene (hero-diwali.webp, supplied 2026-10-31), four Tech Buzz scenes (hero-buzz-*.webp,
 * supplied 2026-10-30), then the stack infographic and the
 * full-HD (1920×1080) study scenes painted by scripts/generate-hero-images.ts (each file's EXIF ImageDescription holds
 * its prompt), full-bleed under the navbar. Each slide
 * carries its own headline and actions. Autoplay runs while the mouse is over it (the hero fills the screen, so a hover
 * pause meant it almost never moved); it pauses for keyboard focus inside it, with the pause button, off screen, and
 * never starts for visitors who prefer reduced motion.
 */
function slidesFor(technologies: number | undefined): Slide[] {
  const count = technologies ? String(technologies) : "60+";
  return [
    {
      // Diwali celebration scene (supplied 2026-10-31), first while the festive season runs.
      id: "diwali",
      src: "/images/landing/hero-diwali.webp",
      focus: "50% 50%",
      tone: "honey",
      tool: {
        en: "Happy Diwali",
        hi: "शुभ दीपावली",
        es: "Feliz Diwali",
        ja: "ハッピー・ディワリ",
        de: "Frohes Diwali",
        fr: "Joyeux Diwali",
        zh: "排灯节快乐"
      },
      title: {
        en: "Happy Diwali from MasterClass Buddy.",
        hi: "MasterClass Buddy की ओर से दीपावली की शुभकामनाएँ।",
        es: "Feliz Diwali de parte de MasterClass Buddy.",
        ja: "MasterClass Buddy からハッピー・ディワリ。",
        de: "Frohes Diwali wünscht MasterClass Buddy.",
        fr: "Joyeux Diwali de la part de MasterClass Buddy.",
        zh: "MasterClass Buddy 祝您排灯节快乐。"
      },
      body: {
        en: "Light up your learning this festive season: LangChain, LangGraph, Next.js, System Design, DSA, n8n, FastAPI, Docker, Kubernetes and Playwright in one membership.",
        hi: "इस त्योहार अपनी पढ़ाई को रोशन करें: LangChain, LangGraph, Next.js, System Design, DSA, n8n, FastAPI, Docker, Kubernetes और Playwright, एक ही सदस्यता में।",
        es: "Ilumina tu aprendizaje esta temporada festiva: LangChain, LangGraph, Next.js, System Design, DSA, n8n, FastAPI, Docker, Kubernetes y Playwright en una sola membresía.",
        ja: "この祝祭シーズンに学びを灯そう：LangChain、LangGraph、Next.js、System Design、DSA、n8n、FastAPI、Docker、Kubernetes、Playwright をひとつのメンバーシップで。",
        de: "Bringen Sie Ihr Lernen zum Leuchten: LangChain, LangGraph, Next.js, System Design, DSA, n8n, FastAPI, Docker, Kubernetes und Playwright in einer Mitgliedschaft.",
        fr: "Illuminez votre apprentissage en cette période de fête : LangChain, LangGraph, Next.js, System Design, DSA, n8n, FastAPI, Docker, Kubernetes et Playwright dans un seul abonnement.",
        zh: "在这个节日点亮你的学习：LangChain、LangGraph、Next.js、系统设计、DSA、n8n、FastAPI、Docker、Kubernetes 和 Playwright，一个会员全部拥有。"
      },
      link: {
        label: {
          en: "See Diwali plans",
          hi: "दीपावली प्लान देखें",
          es: "Ver planes de Diwali",
          ja: "ディワリのプランを見る",
          de: "Diwali-Angebote ansehen",
          fr: "Voir les offres Diwali",
          zh: "查看排灯节方案"
        },
        href: "#pricing"
      },
      alt: "A Diwali celebration in the Master Class Buddy office: colleagues in festive clothes exchange gifts and sweets around a rangoli, under marigold garlands and Happy Diwali banners for LangChain, LangGraph, Next.js, Zustand, Docker, Kubernetes, System Design, DSA, n8n, FastAPI and Playwright, with the masterclassbuddy.com homepage on wall screens"
    },
    {
      id: "buzz-team",
      src: "/images/landing/hero-buzz-team.webp",
      focus: "50% 50%",
      tone: "clay",
      tool: {
        en: "Tech Buzz",
        hi: "Tech Buzz",
        es: "Tech Buzz",
        ja: "Tech Buzz",
        de: "Tech Buzz",
        fr: "Tech Buzz",
        zh: "Tech Buzz"
      },
      title: {
        en: "The tech news your team talks about, every week.",
        hi: "वह टेक न्यूज़, जिस पर आपकी टीम हर हफ़्ते बात करती है।",
        es: "Las noticias tecnológicas de las que habla tu equipo, cada semana.",
        ja: "チームで話題になるテックニュースを、毎週。",
        de: "Die Tech-News, über die Ihr Team jede Woche spricht.",
        fr: "L'actualité tech dont parle votre équipe, chaque semaine.",
        zh: "每周团队热议的技术新闻。"
      },
      body: {
        en: "A fresh Tech Buzz edition every week on System Design, LangGraph, Docker, Kubernetes and Redis, written for engineers.",
        hi: "हर हफ़्ते Tech Buzz का नया संस्करण: System Design, LangGraph, Docker, Kubernetes और Redis पर, इंजीनियरों के लिए लिखा गया।",
        es: "Una nueva edición de Tech Buzz cada semana sobre System Design, LangGraph, Docker, Kubernetes y Redis, escrita para ingenieros.",
        ja: "System Design、LangGraph、Docker、Kubernetes、Redis を扱う Tech Buzz の最新号を、エンジニアのために毎週お届け。",
        de: "Jede Woche eine neue Tech-Buzz-Ausgabe zu System Design, LangGraph, Docker, Kubernetes und Redis, geschrieben für Engineers.",
        fr: "Une nouvelle édition de Tech Buzz chaque semaine sur System Design, LangGraph, Docker, Kubernetes et Redis, écrite pour les ingénieurs.",
        zh: "每天早晨推出新一期 Tech Buzz，涵盖系统设计、LangGraph、Docker、Kubernetes 与 Redis，专为工程师而写。"
      },
      link: {
        label: {
          en: "Read Tech Buzz",
          hi: "Tech Buzz पढ़ें",
          es: "Leer Tech Buzz",
          ja: "Tech Buzz を読む",
          de: "Tech Buzz lesen",
          fr: "Lire Tech Buzz",
          zh: "阅读 Tech Buzz"
        },
        href: "/tech-buzz"
      },
      alt: "An engineering team around a boardroom table with Master Class Buddy mugs for LangChain, LangGraph, n8n, System Design, Redis, Playwright, Docker, Kubernetes and FastAPI, and a laptop open on the Tech Buzz landing page"
    },
    {
      id: "buzz-cafe",
      src: "/images/landing/hero-buzz-cafe.webp",
      focus: "60% 50%",
      tone: "honey",
      tool: {
        en: "AI agents",
        hi: "AI एजेंट",
        es: "Agentes de IA",
        ja: "AIエージェント",
        de: "KI-Agenten",
        fr: "Agents IA",
        zh: "AI 智能体"
      },
      title: {
        en: "LangChain, LangGraph and LangSmith over a coffee.",
        hi: "एक कप कॉफ़ी के साथ LangChain, LangGraph और LangSmith।",
        es: "LangChain, LangGraph y LangSmith con un café.",
        ja: "コーヒー片手に LangChain、LangGraph、LangSmith。",
        de: "LangChain, LangGraph und LangSmith bei einem Kaffee.",
        fr: "LangChain, LangGraph et LangSmith autour d'un café.",
        zh: "一杯咖啡的时间，掌握 LangChain、LangGraph 与 LangSmith。"
      },
      body: {
        en: "Build, orchestrate and debug AI agents with step-by-step guides, then catch up on what changed this week in the Tech Buzz blog.",
        hi: "चरण-दर-चरण गाइड से AI एजेंट बनाएँ, ऑर्केस्ट्रेट करें और डीबग करें, फिर Tech Buzz ब्लॉग में इस हफ़्ते के बदलाव पढ़ें।",
        es: "Crea, orquesta y depura agentes de IA con guías paso a paso, y ponte al día con las novedades de la semana en el blog Tech Buzz.",
        ja: "ステップバイステップのガイドで AI エージェントを構築・オーケストレーション・デバッグし、今週の変化は Tech Buzz ブログでチェック。",
        de: "KI-Agenten mit Schritt-für-Schritt-Anleitungen bauen, orchestrieren und debuggen, und im Tech-Buzz-Blog lesen, was sich diese Woche geändert hat.",
        fr: "Construisez, orchestrez et déboguez des agents IA avec des guides pas à pas, puis découvrez les nouveautés de la semaine sur le blog Tech Buzz.",
        zh: "通过逐步教程构建、编排并调试 AI 智能体，再到 Tech Buzz 博客了解本周新动态。"
      },
      link: {
        label: {
          en: "Explore AI courses",
          hi: "AI कोर्स देखें",
          es: "Explorar cursos de IA",
          ja: "AI コースを見る",
          de: "KI-Kurse entdecken",
          fr: "Explorer les cours d'IA",
          zh: "探索 AI 课程"
        },
        href: "/courses#technology"
      },
      alt: "Three cappuccinos in Master Class Buddy cups for LangChain, LangGraph and LangSmith, and a LangFlow cup, on a café table beside a laptop showing the Tech Buzz blog"
    },
    {
      id: "buzz-frontend",
      src: "/images/landing/hero-buzz-frontend.webp",
      focus: "60% 55%",
      tone: "sage",
      tool: {
        en: "Frontend stack",
        hi: "फ़्रंटएंड स्टैक",
        es: "Stack frontend",
        ja: "フロントエンドスタック",
        de: "Frontend-Stack",
        fr: "Stack frontend",
        zh: "前端技术栈"
      },
      title: {
        en: "Next.js, TanStack and Zustand, between classes.",
        hi: "क्लास के बीच Next.js, TanStack और Zustand।",
        es: "Next.js, TanStack y Zustand, entre clase y clase.",
        ja: "授業の合間に Next.js、TanStack、Zustand。",
        de: "Next.js, TanStack und Zustand, zwischen den Vorlesungen.",
        fr: "Next.js, TanStack et Zustand, entre deux cours.",
        zh: "课间时光，学透 Next.js、TanStack 与 Zustand。"
      },
      body: {
        en: "Short Tech Buzz reads and complete guides on the modern React stack, from routing and data fetching to state management.",
        hi: "आधुनिक React स्टैक पर छोटे Tech Buzz लेख और पूरे गाइड, रूटिंग और डेटा फ़ेचिंग से स्टेट मैनेजमेंट तक।",
        es: "Lecturas breves de Tech Buzz y guías completas sobre el stack moderno de React, del enrutamiento y la obtención de datos a la gestión de estado.",
        ja: "ルーティングやデータ取得から状態管理まで、モダンな React スタックを Tech Buzz の短い記事と完全ガイドで。",
        de: "Kurze Tech-Buzz-Beiträge und vollständige Anleitungen zum modernen React-Stack, von Routing und Data Fetching bis zum State Management.",
        fr: "Des lectures courtes Tech Buzz et des guides complets sur le stack React moderne, du routage et du chargement de données à la gestion d'état.",
        zh: "Tech Buzz 精短文章与完整教程，覆盖现代 React 技术栈，从路由、数据获取到状态管理。"
      },
      link: {
        label: {
          en: "Browse frontend guides",
          hi: "फ़्रंटएंड गाइड देखें",
          es: "Ver guías de frontend",
          ja: "フロントエンドガイドを見る",
          de: "Frontend-Anleitungen ansehen",
          fr: "Parcourir les guides frontend",
          zh: "浏览前端教程"
        },
        href: "/courses#technology"
      },
      alt: "Students chatting in a busy campus café behind three Master Class Buddy coffee cups for Next.js, TanStack and Zustand, next to a laptop open on the Tech Buzz blog"
    },
    {
      id: "buzz-campus",
      src: "/images/landing/hero-buzz-campus.webp",
      focus: "62% 50%",
      tone: "violet",
      tool: {
        en: "DSA, Python & AWS",
        hi: "DSA, Python और AWS",
        es: "DSA, Python y AWS",
        ja: "DSA・Python・AWS",
        de: "DSA, Python & AWS",
        fr: "DSA, Python et AWS",
        zh: "DSA、Python 与 AWS"
      },
      title: {
        en: "Crack DSA, AI with Python and AWS Cloud.",
        hi: "DSA, Python के साथ AI और AWS Cloud में महारत पाएँ।",
        es: "Domina DSA, IA con Python y AWS Cloud.",
        ja: "DSA、Python による AI、AWS クラウドを攻略。",
        de: "DSA, KI mit Python und AWS Cloud meistern.",
        fr: "Maîtrisez les DSA, l'IA avec Python et AWS Cloud.",
        zh: "攻克数据结构与算法、Python AI 与 AWS 云。"
      },
      body: {
        en: "Practise DSA, build AI projects in Python and learn AWS with guided paths, interview questions and daily Tech Buzz reads.",
        hi: "DSA का अभ्यास करें, Python में AI प्रोजेक्ट बनाएँ और गाइडेड रास्तों, इंटरव्यू प्रश्नों और रोज़ के Tech Buzz से AWS सीखें।",
        es: "Practica DSA, crea proyectos de IA en Python y aprende AWS con rutas guiadas, preguntas de entrevista y Tech Buzz cada día.",
        ja: "DSA を練習し、Python で AI プロジェクトを作り、ガイド付きパス、面接質問、毎日の Tech Buzz で AWS を学ぶ。",
        de: "DSA üben, KI-Projekte in Python bauen und AWS lernen, mit geführten Pfaden, Interviewfragen und täglichem Tech Buzz.",
        fr: "Entraînez-vous au DSA, créez des projets d'IA en Python et apprenez AWS avec des parcours guidés, des questions d'entretien et Tech Buzz.",
        zh: "练习 DSA，用 Python 构建 AI 项目，并通过引导式路径、面试题与每日 Tech Buzz 学习 AWS。"
      },
      link: {
        label: {
          en: "Start learning",
          hi: "सीखना शुरू करें",
          es: "Empezar a aprender",
          ja: "学習を始める",
          de: "Jetzt lernen",
          fr: "Commencer à apprendre",
          zh: "开始学习"
        },
        href: "/courses#technology"
      },
      alt: "A laptop showing the Tech Buzz blog on a college canteen table beside three red Master Class Buddy cups for AI with Python, DSA and AWS Cloud, with students eating and talking behind"
    },
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
        en: "Build AI agents, design cloud systems and ship full-stack projects with guided practice for interviews and everyday work.",
        hi: "AI एजेंट बनाएँ, क्लाउड सिस्टम डिज़ाइन करें और फ़ुल-स्टैक प्रोजेक्ट शिप करें, इंटरव्यू और रोज़ के काम के लिए गाइडेड अभ्यास के साथ।",
        es: "Crea agentes de IA, diseña sistemas en la nube y lanza proyectos full-stack con práctica guiada para entrevistas y el día a día.",
        ja: "AIエージェントを作り、クラウドシステムを設計し、フルスタック開発を実践。面接にも日々の仕事にも役立つガイド付き演習。",
        de: "KI-Agenten bauen, Cloud-Systeme entwerfen und Full-Stack-Projekte ausliefern, mit geführter Praxis für Interviews und Alltag.",
        fr: "Créez des agents IA, concevez des systèmes cloud et livrez des projets full-stack, avec une pratique guidée pour vos entretiens.",
        zh: "构建 AI 智能体、设计云系统、交付全栈项目，通过引导式练习，为面试与日常工作做好准备。"
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
        en: "Real interview questions, side-by-side tech comparisons, quizzes and a live code lab to get you ready for your next role.",
        hi: "असली इंटरव्यू प्रश्न, आमने-सामने तकनीकी तुलना, क्विज़ और लाइव कोड लैब, ताकि आप अपनी अगली नौकरी के लिए तैयार रहें।",
        es: "Preguntas reales de entrevistas, comparativas técnicas lado a lado, cuestionarios y un laboratorio de código en vivo para tu próximo puesto.",
        ja: "実践的な面接質問、技術の比較、クイズ、ライブコードラボで、次のキャリアへの準備を万全に。",
        de: "Echte Interviewfragen, Technologievergleiche nebeneinander, Quizze und ein Live-Codelabor, damit Sie für Ihre nächste Rolle bereit sind.",
        fr: "Questions réelles d'entretien, comparaisons techniques côte à côte, quiz et lab de code en direct pour préparer votre prochain rôle.",
        zh: "名企高频真题、技术对比、仿真测验与在线代码实验室，助你为下一份工作做好准备。"
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
        en: "Guided paths for Agentic AI, AWS, DevOps, n8n and System Design, each with 100+ practice questions and mock exams.",
        hi: "Agentic AI, AWS, DevOps, n8n और सिस्टम डिज़ाइन के गाइडेड रास्ते, हर एक में 100+ अभ्यास प्रश्न और मॉक परीक्षाएँ।",
        es: "Rutas guiadas de Agentic AI, AWS, DevOps, n8n y diseño de sistemas, cada una con más de 100 preguntas y exámenes de prueba.",
        ja: "Agentic AI、AWS、DevOps、n8n、システム設計の学習パス。各100問以上の練習問題と模擬試験付き。",
        de: "Geführte Pfade für Agentic AI, AWS, DevOps, n8n und Systemdesign, jeweils mit 100+ Übungsfragen und Probeprüfungen.",
        fr: "Des parcours guidés en IA agentique, AWS, DevOps, n8n et conception système, chacun avec 100+ questions et examens blancs.",
        zh: "Agentic AI、AWS、DevOps、n8n 与系统设计认证路径，每条含 100+ 练习题与全真模考。"
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
