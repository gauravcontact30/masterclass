import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiPackage, apiPackageEntries, apiPackages, apiTypes } from "@/lib/public-learning";
import { learningMetadata, siteUrl } from "@/lib/seo";
import { LibraryIntro, InlineText } from "@/components/public-learning/library-intro";
import { LearningLoader } from "@/components/learning-loader";
import styles from "@/components/public-learning/library.module.css";

type Props = { params: Promise<{ package: string; name: string }> };

/** One page per identifier that has a verified official card; the rest are listed on their package page. */
export async function generateStaticParams() {
  const params = await Promise.all(apiPackages().map(async pkg => (await apiPackageEntries(pkg.id)).filter(entry => entry.card).map(entry => ({ package: pkg.id, name: entry.slug }))));
  return params.flat();
}

async function find(params: Props["params"]) {
  const { package: packageId, name } = await params;
  const pkg = apiPackage(packageId);
  const entry = pkg ? (await apiPackageEntries(pkg.id)).find(item => item.slug === name) : undefined;
  return pkg && entry?.card ? { pkg, entry, card: entry.card } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await find(params);
  if (!found) return { title: "API entry not found", robots: { index: false } };
  const { pkg, entry, card } = found;
  return learningMetadata({
    path: `/api-reference/${pkg.id}/${entry.slug}`,
    title: `${entry.name} in ${pkg.name}: syntax, parameters and examples`,
    description: card.summary.replace(/`/g, ""),
    keywords: [`${entry.name}`, `${pkg.name} ${entry.name}`, `${entry.name} example`, `${entry.name} syntax`],
  });
}

export default function Page({ params }: Props) {
  return <Suspense fallback={<LearningLoader size="inline" label="Loading the entry…" />}><Entry params={params} /></Suspense>;
}

async function Entry({ params }: Props) {
  const found = await find(params);
  if (!found) notFound();
  const { pkg, entry, card } = found;
  const kind = apiTypes().find(type => type.k === entry.kind)?.label ?? entry.kind;
  const path = `/api-reference/${pkg.id}/${entry.slug}` as const;
  const article = {
    "@context": "https://schema.org", "@type": "TechArticle", headline: `${entry.name} in ${pkg.name}`, description: card.summary.replace(/`/g, ""),
    url: new URL(path, siteUrl()).href, dateModified: card.checkedAt, isBasedOn: card.sourceUrl, proficiencyLevel: "Beginner",
  };
  return <>
    <LibraryIntro trail={[["API reference", "/api-reference"], [pkg.name, `/api-reference/${pkg.id}`], [entry.name, path]]} eyebrow={`${pkg.name} · ${kind}`} title={entry.name} lead={card.summary.replace(/`/g, "")}
      facts={card.since ? [["Since", card.since]] : []} schema={article} />
    <section className={styles.section} aria-labelledby="explanation"><h2 id="explanation">How it works</h2><div className={styles.prose}><p><InlineText text={card.explanation} /></p></div></section>
    {card.syntax && <section className={styles.section} aria-labelledby="syntax"><h2 id="syntax">Syntax</h2><div className={styles.prose}><pre><code>{card.syntax}</code></pre></div></section>}
    {card.parameters.length > 0 && <section className={styles.section} aria-labelledby="parameters"><h2 id="parameters">Parameters</h2><div className={styles.table}><table>
      <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Description</th></tr></thead>
      <tbody>{card.parameters.map(param => <tr key={param.name}><td><code>{param.name}</code></td><td><code>{param.type}</code></td><td><InlineText text={param.description} /></td></tr>)}</tbody>
    </table></div></section>}
    {card.returns && <section className={styles.section} aria-labelledby="returns"><h2 id="returns">Returns</h2><div className={styles.prose}><p><InlineText text={card.returns} /></p></div></section>}
    <section className={styles.section} aria-labelledby="points"><h2 id="points">Key points</h2><ul className={styles.prose}>{card.keyPoints.map(point => <li key={point}><InlineText text={point} /></li>)}</ul></section>
    {card.gotchas.length > 0 && <section className={styles.section} aria-labelledby="gotchas"><h2 id="gotchas">Common mistakes</h2><ul className={styles.prose}>{card.gotchas.map(point => <li key={point}><InlineText text={point} /></li>)}</ul></section>}
    {card.example.code && <section className={styles.section} aria-labelledby="example"><h2 id="example">Example: {card.example.title}</h2><div className={styles.prose}><pre><code>{card.example.code}</code></pre>{card.example.explanation && <p><InlineText text={card.example.explanation} /></p>}</div></section>}
    {card.useCases.length > 0 && <section className={styles.section} aria-labelledby="uses"><h2 id="uses">When to use it</h2><div className={styles.cards}>{card.useCases.map(use => <article key={use.title}><h3>{use.title}</h3><p><InlineText text={use.scenario} /></p></article>)}</div></section>}
    {card.interview.length > 0 && <section className={styles.section} aria-labelledby="interview"><h2 id="interview">Interview questions</h2>{card.interview.map(item => <details key={item.question} className={styles.qa}>
      <summary><span className={styles.qNumber}>Q</span><span className={styles.qText}><InlineText text={item.question} /></span></summary>
      <div className={styles.answer}><p><InlineText text={item.answer} /></p>{item.followUp && <p><strong>Follow-up:</strong> <InlineText text={item.followUp} /></p>}</div>
    </details>)}</section>}
    {card.related.length > 0 && <section className={styles.section} aria-labelledby="related"><h2 id="related">Related</h2><ul className={styles.chips}>{card.related.map(name => <li key={name}><code>{name}</code></li>)}</ul></section>}
    <p className={styles.meta}>Source: <a href={card.sourceUrl} rel="noopener">{card.sourceTitle || card.sourceUrl}</a>. Checked {card.checkedAt.slice(0, 10)}.</p>
    <nav className={styles.next} aria-label="Back"><Link href={`/api-reference/${pkg.id}`}>← All {pkg.name} identifiers</Link></nav>
  </>;
}
