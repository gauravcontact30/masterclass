import Link from "next/link";
import { handbookName, handbookSlug, handbooks } from "@/lib/public-learning";
import { learningMetadata, siteUrl } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import styles from "@/components/public-learning/library.module.css";

export const metadata = learningMetadata({
  path: "/learn",
  title: "Technology handbooks: tutorials with examples",
  description: "Free technology handbooks for React, Next.js, Node.js, Python, AWS, Git, Docker, TanStack, testing, system design and more: every topic explained with key points, syntax, worked code examples, use cases and interview questions.",
  keywords: [
    "technology handbooks", "React 19 tutorial", "Next.js 16 tutorial", "Python 3.12 tutorial", "AWS services explained",
    "Git commands and workflows", "Docker tutorial for developers", "system design handbook", "Zustand guide",
    "TanStack Query tutorial", "learn coding in Hindi", "bilingual programming tutorials"
  ],
});

export default function HandbooksIndex() {
  const all = handbooks();
  const topics = all.reduce((sum, item) => sum + item.topics.length, 0);
  const origin = siteUrl();
  const list = { "@context": "https://schema.org", "@type": "ItemList", name: "Technology handbooks", itemListElement: all.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: new URL(`/learn/${handbookSlug(item)}`, origin).href })) };
  return <>
    <LibraryIntro trail={[["Handbooks", "/learn"]]} eyebrow="Learn" title="Technology handbooks" schema={list}
      lead="One handbook per technology, organised the way you learn it: each topic explained in plain words with its key points, the syntax, a worked code example, where it is used in practice and the interview questions it leads to."
      facts={[["Handbooks", all.length], ["Topics", topics]]} />
    <section className={styles.section} aria-labelledby="handbooks">
      <h2 id="handbooks">Choose a handbook</h2>
      <ul className={styles.grid}>{all.map(item => <li key={handbookSlug(item)}><Link href={`/learn/${handbookSlug(item)}`}><b>{handbookName(item)}</b><span>{item.description}</span><small>{item.topics.length} topics</small></Link></li>)}</ul>
    </section>
    <div className={styles.cta}><p>Ask questions about any topic and save your place in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
