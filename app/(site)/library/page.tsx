import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, BookOpenText, Braces, GitCompareArrows, GraduationCap, Languages, MessagesSquare, Newspaper, Sparkles, Workflow, type LucideIcon } from "lucide-react";
import { apiPackages, handbookName, handbookSlug, handbooks, interviewTechs, vocabularyGroups, workflows } from "@/lib/public-learning";
import { listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";
import { pageMetadata } from "@/lib/seo";
import { COMPARISONS } from "@/lib/comparisons";
import { PageIntro } from "../page-intro";
import styles from "./library-hub.module.css";

export const metadata = pageMetadata("/library");

type Tone = { bg: string; ink: string; edge: string };
/** One light colour per card; ink and edge are the darker shades of the same hue. */
const TONES: Tone[] = [
  { bg: "#fdf0e6", ink: "#a5461f", edge: "#f3c9ad" }, { bg: "#e7f5ee", ink: "#1f6a4a", edge: "#b5dfc8" },
  { bg: "#f0ecfb", ink: "#5a3fa8", edge: "#cfc3f0" }, { bg: "#e8f2fb", ink: "#245d8f", edge: "#bcd6ee" },
  { bg: "#fdf6dc", ink: "#86610b", edge: "#ecdb9c" }, { bg: "#fcebef", ink: "#a32c4f", edge: "#f1bccb" },
  { bg: "#eef3e6", ink: "#4d6b22", edge: "#cddcb3" }, { bg: "#e4f5f5", ink: "#16696b", edge: "#b0dddd" },
  { bg: "#f5efe6", ink: "#7a5530", edge: "#e0cdb3" },
];
const tone = (index: number) => { const t = TONES[index % TONES.length]; return { "--bg": t.bg, "--ink": t.ink, "--edge": t.edge, "--i": index } as CSSProperties; };

/** Picks that exist in today's catalogues, in the order given. */
const pick = <T,>(items: T[], ids: string[], id: (item: T) => string) => ids.map(want => items.find(item => id(item) === want)).filter((item): item is T => !!item);

/**
 * The hub of the public learning library: every free section (no account needed) as a colour-coded card with its
 * true size, then a "start here" row of the most useful free pages.
 */
export default async function LibraryHub() {
  const vocabulary = vocabularyGroups();
  const articles = await listPublishedTechBuzzArticles();
  const sections: { href: string; title: string; body: string; count: string; icon: LucideIcon; image: string }[] = [
    { href: "/interview-questions", title: "Interview questions", body: "Subjective and objective questions with model answers, most-asked first.", count: `${interviewTechs().length} technologies`, icon: MessagesSquare, image: "/images/news/questions-tech.webp" },
    { href: "/compare", title: "Technology comparisons", body: "The differences explained: definitions, a comparison table and 40+ difference questions each.", count: `${COMPARISONS.length} comparisons`, icon: GitCompareArrows, image: "/images/news/trending.webp" },
    { href: "/workflows", title: "Workflow blueprints", body: "System design and AI agent architectures with diagrams, steps and interview questions.", count: `${workflows().length} blueprints`, icon: Workflow, image: "/images/news/system-design.webp" },
    { href: "/learn", title: "Technology handbooks", body: "Every topic explained with key points, syntax, a worked example and use cases.", count: `${handbooks().length} handbooks`, icon: BookOpenText, image: "/images/landing/feature-lessons.webp" },
    { href: "/api-reference", title: "API reference", body: "Hooks, classes, functions and CLI commands with syntax, parameters and examples.", count: `${apiPackages().length} technologies`, icon: Braces, image: "/images/landing/feature-search.webp" },
    { href: "/tech-buzz", title: "Tech Buzz blogs", body: "Community-rated deep dives on AI agents, frameworks, cloud and system design, with quick reads and audio.", count: `${articles.length} articles`, icon: Newspaper, image: "/images/news/frontend.webp" },
    { href: "/vocabulary", title: "English vocabulary", body: "Words for work and interviews with Hindi meanings, sentences, synonyms and antonyms.", count: `${vocabulary.reduce((sum, group) => sum + group.words.length, 0).toLocaleString("en-IN")} words`, icon: Languages, image: "/images/learning/language.webp" },
    { href: "/courses", title: "Courses & learning paths", body: "Technology, system design and language learning paths in English and Hindi.", count: "All paths", icon: GraduationCap, image: "/images/landing/feature-certifications.webp" },
  ];

  const interview = pick(interviewTechs(), ["system-design", "agentic-ai", "nextjs", "react", "tanstack", "zustand"], tech => tech.id);
  const comparisons = pick(COMPARISONS, ["nextjs-tanstack", "redux-zustand-rtk", "n8n-langchain-langgraph"], item => item.id);
  const guides = handbooks().slice(0, 3);
  const picks = [
    ...interview.map(tech => ({ href: `/interview-questions/${tech.id}`, kind: "Interview set", title: tech.title, body: tech.tagline, image: `/images/tech/${tech.id}.png` as string | null, icon: MessagesSquare })),
    ...comparisons.map(item => ({ href: `/compare/${item.id}`, kind: "Comparison", title: item.question, body: item.summary, image: null, icon: GitCompareArrows })),
    ...guides.map(item => ({ href: `/learn/${handbookSlug(item)}`, kind: "Handbook", title: handbookName(item), body: item.description, image: null, icon: BookOpenText })),
  ];

  return <>
    <PageIntro path="/library" eyebrow="Learn for free" />
    <p className={styles.free}><Sparkles size={15} aria-hidden="true" />Everything on this page is free to read. No account, no sign-up.</p>

    <section className={styles.section} aria-labelledby="sections">
      <h2 id="sections">Browse the library</h2>
      <ul className={styles.sections}>{sections.map((section, index) => {
        const Icon = section.icon;
        return <li key={section.href} style={tone(index)}><Link href={section.href} className={styles.card}>
          <span className={styles.cover}><Image src={section.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw" className={styles.coverImage} /></span>
          <span className={styles.icon} aria-hidden="true"><Icon size={20} strokeWidth={1.9} /></span>
          <b>{section.title}</b>
          <span className={styles.body}>{section.body}</span>
          <span className={styles.foot}><small>{section.count}</small><ArrowRight size={16} aria-hidden="true" className={styles.arrow} /></span>
        </Link></li>;
      })}</ul>
    </section>

    {picks.length > 0 && <section className={styles.section} aria-labelledby="picks">
      <h2 id="picks">Start here</h2>
      <p className={styles.lede}>The most-read free pages: interview sets, side-by-side comparisons and handbooks.</p>
      <ul className={styles.picks}>{picks.map((item, index) => {
        const Icon = item.icon;
        return <li key={item.href} style={tone(index + 3)}><Link href={item.href} className={styles.pick}>
          <span className={styles.pickIcon} aria-hidden="true">{item.image ? <Image src={item.image} alt="" width={28} height={28} /> : <Icon size={18} strokeWidth={1.9} />}</span>
          <span className={styles.pickText}><small>{item.kind}</small><b>{item.title}</b><span>{item.body}</span></span>
        </Link></li>;
      })}</ul>
    </section>}

    <div className={styles.cta}><p>Practise with progress, search and daily sets in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
