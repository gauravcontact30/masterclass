import Link from "next/link";
import { apiPackages, apiTypes } from "@/lib/public-learning";
import { learningMetadata, siteUrl } from "@/lib/seo";
import { LibraryIntro } from "@/components/public-learning/library-intro";
import styles from "@/components/public-learning/library.module.css";

export const metadata = learningMetadata({
  path: "/api-reference",
  title: "API reference for 60 technologies",
  description: "Hooks, classes, functions and CLI commands from React, Next.js, LangGraph, Prisma, Zod, Redis, pandas, PyTorch and more, each with its syntax, parameters, examples and a link to the official docs.",
  keywords: [
    "API reference for developers", "React hooks reference", "Next.js API reference", "LangGraph API documentation",
    "LangChain API reference", "Redis commands reference", "pandas functions", "Prisma client API",
    "Python API reference"
  ],
});

export default function ApiReferenceIndex() {
  const packages = apiPackages();
  const total = packages.reduce((sum, pkg) => sum + pkg.entries.length, 0);
  const origin = siteUrl();
  const list = { "@context": "https://schema.org", "@type": "ItemList", name: "API reference by technology", itemListElement: packages.map((pkg, index) => ({ "@type": "ListItem", position: index + 1, name: `${pkg.name} API reference`, url: new URL(`/api-reference/${pkg.id}`, origin).href })) };
  return <>
    <LibraryIntro trail={[["API reference", "/api-reference"]]} eyebrow="Developer reference" title="API reference" schema={list}
      lead="Every identifier you reach for, organised by technology: hooks, components, classes, functions, CLI commands and config options, from AI tooling to databases, testing and data science. Each entry links to its official documentation."
      facts={[["Technologies", packages.length], ["Identifiers", total], ["Identifier types", apiTypes().length]]} />
    <section className={styles.section} aria-labelledby="packages">
      <h2 id="packages">Choose a technology</h2>
      <ul className={styles.grid}>{packages.map(pkg => <li key={pkg.id}><Link href={`/api-reference/${pkg.id}`}><b>{pkg.name}</b><span>{pkg.description}</span><small>{pkg.entries.length.toLocaleString("en-IN")} identifiers</small></Link></li>)}</ul>
    </section>
    <div className={styles.cta}><p>Search and filter the whole reference in your dashboard.</p><Link href="/sign-up">Start learning</Link></div>
  </>;
}
