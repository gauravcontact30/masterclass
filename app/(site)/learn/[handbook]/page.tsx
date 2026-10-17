import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { handbook, handbookName, handbookSlug, handbooks, slugify } from "@/lib/public-learning";
import { learningMetadata, siteUrl } from "@/lib/seo";
import { LibraryIntro, InlineText } from "@/components/public-learning/library-intro";
import { LearningLoader } from "@/components/learning-loader";
import styles from "@/components/public-learning/library.module.css";

type Props = { params: Promise<{ handbook: string }> };

export function generateStaticParams() {
  return handbooks().map(item => ({ handbook: handbookSlug(item) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = handbook((await params).handbook);
  if (!item) return { title: "Handbook not found", robots: { index: false } };
  const name = handbookName(item);
  return learningMetadata({
    path: `/learn/${handbookSlug(item)}`,
    title: `${name} handbook: ${item.topics.length} topics with examples`,
    description: item.description,
    keywords: [`${name} tutorial`, `${name} examples`, `${name} interview questions`, ...item.categories.slice(0, 4).map(category => `${name} ${category.name}`)],
  });
}

export default function Page({ params }: Props) {
  return <Suspense fallback={<LearningLoader size="inline" label="Loading the handbook…" />}><Handbook params={params} /></Suspense>;
}

async function Handbook({ params }: Props) {
  const item = handbook((await params).handbook);
  if (!item) notFound();
  const slug = handbookSlug(item);
  const path = `/learn/${slug}` as const;
  const name = handbookName(item);
  const course = {
    "@context": "https://schema.org", "@type": "Course", name: item.title, description: item.description, url: new URL(path, siteUrl()).href,
    provider: { "@type": "Organization", name: "MasterClass", url: siteUrl().href }, isAccessibleForFree: true, inLanguage: "en",
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `${item.topics.length} topics` },
    ...(item.sources?.length ? { citation: item.sources.map(source => source.url) } : {}),
  };
  const all = handbooks();
  const index = all.indexOf(item);
  const [previous, next] = [all[index - 1], all[index + 1]];
  return <>
    <LibraryIntro trail={[["Handbooks", "/learn"], [name, path]]} eyebrow="Technology handbook" title={item.title} lead={item.description}
      facts={[["Topics", item.topics.length], ["Sections", item.categories.length]]} schema={course} />
    <nav className={styles.section} aria-labelledby="contents"><h2 id="contents">Contents</h2><ul className={styles.chips}>{item.categories.map(category => <li key={category.name}><a href={`#${slugify(category.name)}`}>{category.name} ({category.count})</a></li>)}</ul></nav>
    {item.categories.map(category => <section key={category.name} id={slugify(category.name)} className={styles.section} aria-labelledby={`h-${slugify(category.name)}`}>
      <h2 id={`h-${slugify(category.name)}`}>{category.name}</h2>
      {item.topics.filter(topic => topic.category === category.name).map(topic => <article key={topic.name} id={`t-${slugify(topic.name)}`} className={styles.prose}>
        <h3>{topic.name}</h3>
        <p><InlineText text={topic.summary} /></p>
        {topic.points && topic.points.length > 0 && <ul>{topic.points.map(point => <li key={point}><InlineText text={point} /></li>)}</ul>}
        {topic.syntax && topic.syntax.length > 0 && <pre><code>{topic.syntax.join("\n")}</code></pre>}
        {topic.code?.[0] && <><p className={styles.meta}>Example: <code>{topic.code[0].path}</code></p><pre><code>{topic.code[0].code}</code></pre></>}
        {topic.useCase && <p><strong>{topic.useCase.title}:</strong> <InlineText text={topic.useCase.scenario} /></p>}
        {topic.interview?.map(qa => <details key={qa.question} className={styles.qa}><summary><span className={styles.qNumber}>Q</span><span className={styles.qText}><InlineText text={qa.question} /></span></summary><div className={styles.answer}><p><InlineText text={qa.answer} /></p></div></details>)}
      </article>)}
    </section>)}
    {item.sources && item.sources.length > 0 && <section className={styles.section} aria-labelledby="sources"><h2 id="sources">Sources</h2><ul className={styles.prose}>{item.sources.map(source => <li key={source.url}><a href={source.url} rel="noopener">{source.title}</a></li>)}</ul></section>}
    <nav className={styles.next} aria-label="More handbooks">
      {previous ? <Link href={`/learn/${handbookSlug(previous)}`}>← {handbookName(previous)}</Link> : <span />}
      {next && <Link href={`/learn/${handbookSlug(next)}`}>{handbookName(next)} →</Link>}
    </nav>
    <div className={styles.cta}><p>Ask follow-up questions on any topic in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
