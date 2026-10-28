import Link from "next/link";
import { cacheLife } from "next/cache";
import { interviewBanks, interviewTechs } from "@/lib/public-learning";
import { learningMetadata, siteUrl } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import styles from "@/components/public-learning/library.module.css";

export const metadata = learningMetadata({
  path: "/interview-questions",
  title: "Interview questions with answers for 31 technologies",
  description: "Most-asked subjective and objective interview questions with model answers for LangChain, LangGraph, Next.js, React, System Design, Redis, AWS, TypeScript, Node.js, testing tools and more.",
  keywords: [
    "interview questions with answers", "React 19 interview questions", "Next.js 16 interview questions", "system design interview questions",
    "LangChain interview questions", "LangGraph interview questions", "Python interview questions", "AWS interview questions",
    "TypeScript interview questions", "Node.js interview questions", "coding interview questions"
  ],
});

export default async function InterviewQuestionsIndex() {
  "use cache";
  cacheLife("days");
  const techs = interviewTechs();
  const counts = await Promise.all(techs.map(async tech => (await interviewBanks(tech)).reduce((sum, bank) => sum + bank.set.subjective.length + bank.set.objective.length, 0)));
  const total = counts.reduce((sum, count) => sum + count, 0);
  const origin = siteUrl();
  const list = { "@context": "https://schema.org", "@type": "ItemList", name: "Interview questions by technology", itemListElement: techs.map((tech, index) => ({ "@type": "ListItem", position: index + 1, name: `${tech.title} interview questions`, url: new URL(`/interview-questions/${tech.id}`, origin).href })) };
  return <>
    <LibraryIntro trail={[["Interview questions", "/interview-questions"]]} eyebrow="Interview prep" title="Interview questions with answers" schema={list}
      lead="The questions interviewers actually ask, one page per technology: subjective questions with model answers you can talk through, and multiple-choice questions with the right option and why. Every set is ordered from most-asked to least."
      facts={[["Technologies", techs.length], ["Questions with answers", total]]} />
    <section className={styles.section} aria-labelledby="techs">
      <h2 id="techs">Choose a technology</h2>
      <ul className={styles.grid}>{techs.map((tech, i) => <li key={tech.id}><Link href={`/interview-questions/${tech.id}`}><b>{tech.title}</b><span>{tech.tagline}</span><small>{counts[i]} questions with answers</small></Link></li>)}</ul>
    </section>
    <div className={styles.cta}><p>Practise them with search, filters and progress in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
