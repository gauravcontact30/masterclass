import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { slugify, vocabularyGroup, vocabularyGroups } from "@/lib/public-learning";
import { learningMetadata, siteUrl } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import styles from "@/components/public-learning/library.module.css";

// Renders only once its content is ready: no loading screen is ever shown in its place (no loading.tsx, no fallback).
export const instant = false;

type Props = { params: Promise<{ group: string }> };

export function generateStaticParams() {
  return vocabularyGroups().map(group => ({ group: group.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const group = vocabularyGroup((await params).group);
  if (!group) return { title: "Vocabulary not found", robots: { index: false } };
  return learningMetadata({
    path: `/vocabulary/${group.slug}`,
    title: `${group.name} vocabulary: meanings, Hindi meanings and examples`,
    description: `${group.words.length} ${group.name.toLowerCase()} words such as ${group.words.slice(0, 5).map(word => word.word).join(", ")}, each with its meaning, Hindi meaning, pronunciation, an example sentence, synonyms and antonyms.`,
    keywords: group.words.slice(0, 8).map(word => `${word.word} meaning`),
  });
}

export default function Page({ params }: Props) {
  return <Words params={params} />;
}

async function Words({ params }: Props) {
  const group = vocabularyGroup((await params).group);
  if (!group) notFound();
  const path = `/vocabulary/${group.slug}` as const;
  const url = new URL(path, siteUrl()).href;
  const terms = {
    "@context": "https://schema.org", "@type": "DefinedTermSet", "@id": url, name: `${group.name} vocabulary`,
    hasDefinedTerm: group.words.map(word => ({ "@type": "DefinedTerm", name: word.word, description: word.meaning, url: `${url}#${slugify(word.word)}`, inDefinedTermSet: url })),
  };
  const groups = vocabularyGroups();
  const index = groups.findIndex(item => item.slug === group.slug);
  const [previous, next] = [groups[index - 1], groups[index + 1]];
  return <>
    <LibraryIntro trail={[["Vocabulary", "/vocabulary"], [group.name, path]]} eyebrow="Word power" title={`${group.name} vocabulary`}
      lead={`Words for ${group.name.toLowerCase()}, each with its meaning in English and Hindi, how to say it, a sentence that shows it in use, and what to say instead or the opposite.`}
      facts={[["Words", group.words.length]]} schema={terms} />
    <div className={`${styles.section} ${styles.cards}`}>{group.words.map(word => <article key={word.word} id={slugify(word.word)}>
      <h2 className={styles.wordTitle}>{word.word}</h2>
      {word.pronunciation && <p className={styles.meta}>/{word.pronunciation}/</p>}
      <p>{word.meaning}</p>
      {word.hindi && <p lang="hi">{word.hindi}</p>}
      <p><em>“{word.sentence}”</em></p>
      {word.synonyms.length > 0 && <p className={styles.meta}><strong>Synonyms:</strong> {word.synonyms.join(", ")}</p>}
      {word.antonyms.length > 0 && <p className={styles.meta}><strong>Antonyms:</strong> {word.antonyms.join(", ")}</p>}
    </article>)}</div>
    <nav className={styles.next} aria-label="More vocabulary">
      {previous ? <Link href={`/vocabulary/${previous.slug}`}>← {previous.name}</Link> : <span />}
      {next && <Link href={`/vocabulary/${next.slug}`}>{next.name} →</Link>}
    </nav>
    <div className={styles.cta}><p>Hear each word and get twelve new ones every day in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
