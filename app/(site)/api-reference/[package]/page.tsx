import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiPackage, apiPackageEntries, apiPackages, apiTypes } from "@/lib/public-learning";
import { learningMetadata } from "@/lib/seo";
import { LibraryIntro, InlineText } from "@/components/public-learning/library-intro";
import { LearningLoader } from "@/components/learning-loader";
import styles from "@/components/public-learning/library.module.css";

type Props = { params: Promise<{ package: string }> };

export function generateStaticParams() {
  return apiPackages().map(pkg => ({ package: pkg.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pkg = apiPackage((await params).package);
  if (!pkg) return { title: "API reference not found", robots: { index: false } };
  return learningMetadata({
    path: `/api-reference/${pkg.id}`,
    title: `${pkg.name} API reference`,
    description: `${pkg.description} ${pkg.entries.length} ${pkg.name} identifiers with their type, status, syntax and official documentation links.`,
    keywords: [`${pkg.name} API`, `${pkg.name} reference`, `${pkg.name} functions`, ...pkg.topics.slice(0, 4)],
  });
}

export default function Page({ params }: Props) {
  return <Suspense fallback={<LearningLoader size="inline" label="Loading the reference…" />}><PackageReference params={params} /></Suspense>;
}

async function PackageReference({ params }: Props) {
  const pkg = apiPackage((await params).package);
  if (!pkg) notFound();
  const entries = await apiPackageEntries(pkg.id);
  const types = apiTypes();
  const kinds = types.filter(type => entries.some(entry => entry.kind === type.k));
  const documented = entries.filter(entry => entry.card).length;
  return <>
    <LibraryIntro trail={[["API reference", "/api-reference"], [pkg.name, `/api-reference/${pkg.id}`]]} eyebrow="API reference" title={`${pkg.name} API reference`} lead={pkg.description}
      facts={[["Identifiers", entries.length], ["With full guides", documented], ["Types", kinds.length]]} />
    {pkg.topics.length > 0 && <section className={styles.section} aria-labelledby="topics"><h2 id="topics">Topics covered</h2><ul className={styles.chips}>{pkg.topics.map(topic => <li key={topic}>{topic}</li>)}</ul></section>}
    {kinds.map(kind => <section key={kind.k} className={styles.section} aria-labelledby={`kind-${kind.k}`}>
      <h2 id={`kind-${kind.k}`}>{kind.label}</h2>
      <div className={styles.table}><table>
        <thead><tr><th scope="col">Name</th><th scope="col">What it does</th></tr></thead>
        <tbody>{entries.filter(entry => entry.kind === kind.k).map(entry => <tr key={entry.slug}>
          <td><code>{entry.card ? <Link href={`/api-reference/${pkg.id}/${entry.slug}`}>{entry.name}</Link> : entry.name}</code></td>
          <td>{entry.card ? <InlineText text={entry.card.summary} /> : <span className={styles.meta}>{kind.label}</span>}</td>
        </tr>)}</tbody>
      </table></div>
    </section>)}
    <div className={styles.cta}><p>Search across every package and filter by type in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
