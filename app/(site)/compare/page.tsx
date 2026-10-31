import Link from "next/link";
import { COMPARISONS } from "@/lib/comparisons";
import { learningMetadata, siteUrl } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import styles from "@/components/public-learning/library.module.css";

export const metadata = learningMetadata({
  path: "/compare",
  title: "Technology comparisons and differences",
  description: "LangChain vs LangGraph, Redux vs Zustand, Next.js vs TanStack, Jest vs Vitest, Playwright vs Cypress and more, with comparison tables and difference Q&A.",
  keywords: [
    "LangChain vs LangGraph", "Redux vs Zustand", "Next.js vs TanStack", "Jest vs Vitest",
    "Playwright vs Cypress", "n8n vs LangChain", "technology comparisons",
    "frontend framework comparison", "AI agent framework comparison"
  ],
});

export default function CompareIndex() {
  const groups = [...new Set(COMPARISONS.map(item => item.group))];
  const origin = siteUrl();
  const list = { "@context": "https://schema.org", "@type": "ItemList", name: "Technology comparisons", itemListElement: COMPARISONS.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.question, url: new URL(`/compare/${item.id}`, origin).href })) };
  return <>
    <LibraryIntro trail={[["Comparisons", "/compare"]]} eyebrow="Tech Topics" title="Technology comparisons" schema={list}
      lead="The differences people ask about most, explained once and properly: what each technology is, how they compare at a glance, and the difference questions interviewers and teams actually ask, with answers."
      facts={[["Comparisons", COMPARISONS.length], ["Groups", groups.length]]} />
    {groups.map(group => <section key={group} className={styles.section} aria-labelledby={`g-${group}`}>
      <h2 id={`g-${group}`}>{group}</h2>
      <ul className={styles.grid}>{COMPARISONS.filter(item => item.group === group).map(item => <li key={item.id}><Link href={`/compare/${item.id}`}><b>{item.question}</b><span>{item.summary}</span><small>{item.techs.map(tech => tech.name).join(" · ")}</small></Link></li>)}</ul>
    </section>)}
    <div className={styles.cta}><p>Study every comparison with progress in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
