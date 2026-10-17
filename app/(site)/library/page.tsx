import Link from "next/link";
import { apiPackages, handbooks, interviewTechs, vocabularyGroups, workflows } from "@/lib/public-learning";
import { pageMetadata } from "@/lib/seo";
import { COMPARISONS } from "@/lib/comparisons";
import { PageIntro } from "../page-intro";
import styles from "@/components/public-learning/library.module.css";

export const metadata = pageMetadata("/library");

/** The hub of the public learning library: one card per section, each with its true size. */
export default function LibraryHub() {
  const vocabulary = vocabularyGroups();
  const sections = [
    { href: "/interview-questions", title: "Interview questions", body: "Subjective and objective questions with model answers, most-asked first.", count: `${interviewTechs().length} technologies` },
    { href: "/compare", title: "Technology comparisons", body: "The differences explained: definitions, a comparison table and 40+ difference questions each.", count: `${COMPARISONS.length} comparisons` },
    { href: "/workflows", title: "Workflow blueprints", body: "System design and AI agent architectures with diagrams, steps and interview questions.", count: `${workflows().length} blueprints` },
    { href: "/learn", title: "Technology handbooks", body: "Every topic explained with key points, syntax, a worked example and use cases.", count: `${handbooks().length} handbooks` },
    { href: "/api-reference", title: "API reference", body: "Hooks, classes, functions and CLI commands with syntax, parameters and examples.", count: `${apiPackages().length} technologies` },
    { href: "/vocabulary", title: "English vocabulary", body: "Words for work and exams with Hindi meanings, sentences, synonyms and antonyms.", count: `${vocabulary.reduce((sum, group) => sum + group.words.length, 0).toLocaleString("en-IN")} words` },
    { href: "/courses", title: "Courses & learning paths", body: "School, competitive exam and technology learning paths in English and Hindi.", count: "All paths" },
  ];
  return <>
    <PageIntro path="/library" eyebrow="Learn for free" />
    <section className={styles.section} aria-labelledby="sections">
      <h2 id="sections">Browse the library</h2>
      <ul className={styles.grid}>{sections.map(section => <li key={section.href}><Link href={section.href}><b>{section.title}</b><span>{section.body}</span><small>{section.count}</small></Link></li>)}</ul>
    </section>
    <div className={styles.cta}><p>Practise with progress, search and daily sets in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
