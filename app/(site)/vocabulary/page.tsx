import Link from "next/link";
import { vocabularyGroups } from "@/lib/public-learning";
import { learningMetadata } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import styles from "@/components/public-learning/library.module.css";

export const metadata = learningMetadata({
  path: "/vocabulary",
  title: "English vocabulary with Hindi meanings",
  description: "Thousands of English words for work, exams and IELTS, grouped by theme, each with its meaning, Hindi meaning, pronunciation, an example sentence, synonyms and antonyms.",
  keywords: [
    "English vocabulary with Hindi meanings", "corporate English words",
    "spoken English for software engineers", "synonyms and antonyms in Hindi", "tech industry English communication",
    "daily English words meaning in Hindi", "English vocabulary for developers"
  ],
});

export default function VocabularyIndex() {
  const groups = vocabularyGroups();
  const total = groups.reduce((sum, group) => sum + group.words.length, 0);
  return <>
    <LibraryIntro trail={[["Vocabulary", "/vocabulary"]]} eyebrow="Word power" title="English vocabulary with Hindi meanings"
      lead="Words grouped by where you will use them: meetings, writing, negotiation, exams and everyday speech. Every word has a plain-English meaning, its Hindi meaning, how to say it, a real sentence and the words around it."
      facts={[["Words", total], ["Themes", groups.length]]} />
    <section className={styles.section} aria-labelledby="themes">
      <h2 id="themes">Choose a theme</h2>
      <ul className={styles.grid}>{groups.map(group => <li key={group.slug}><Link href={`/vocabulary/${group.slug}`}><b>{group.name}</b><span>{group.words.slice(0, 4).map(word => word.word).join(", ")}…</span><small>{group.words.length} words</small></Link></li>)}</ul>
    </section>
    <div className={styles.cta}><p>Hear every word and practise daily in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
