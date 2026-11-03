import type { Metadata } from "next";
import Link from "@/components/site-link";
import { notFound } from "next/navigation";
import { apiPackage, apiPackageEntries, apiPackages, apiTypes } from "@/lib/public-learning";
import { learningMetadata, siteUrl } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import styles from "@/components/public-learning/library.module.css";

// Renders only once its content is ready: no loading screen is ever shown in its place (no loading.tsx, no fallback).
export const instant = false;

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
    title: `${entry.name} in ${pkg.name}: what it does and its syntax`,
    description: card.summary.replace(/`/g, ""),
    keywords: [`${entry.name}`, `${pkg.name} ${entry.name}`, `${entry.name} example`, `${entry.name} syntax`],
  });
}

export default function Page({ params }: Props) {
  return <Entry params={params} />;
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
    {card.syntax && <section className={styles.section} aria-labelledby="syntax"><h2 id="syntax">Syntax</h2><div className={styles.prose}><pre><code>{card.syntax}</code></pre></div></section>}
    <div className={styles.cta}><p>In-depth API docs are only for subscribers: parameters, examples, common mistakes and interview practice.</p><Link href="/subscribe">Subscribe</Link></div>
    {card.related.length > 0 && <section className={styles.section} aria-labelledby="related"><h2 id="related">Related</h2><ul className={styles.chips}>{card.related.map(name => <li key={name}><code>{name}</code></li>)}</ul></section>}
    <p className={styles.meta}>Source: {card.sourceTitle || card.sourceUrl}. Checked {card.checkedAt.slice(0, 10)}.</p>
    <nav className={styles.next} aria-label="Back"><Link href={`/api-reference/${pkg.id}`}>← All {pkg.name} identifiers</Link></nav>
  </>;
}
