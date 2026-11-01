import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, CONTENT_UPDATED, learningPageSchema, readableDate } from "@/lib/seo";
import styles from "./library.module.css";

export type Crumb = readonly [name: string, path: `/${string}`];

/**
 * The top of every public learning page: a breadcrumb trail (also emitted as BreadcrumbList structured data),
 * the page's single <h1>, a lead paragraph, its "Last updated" date and a row of true counts. `schema` adds the page's own
 * structured data.
 */
export function LibraryIntro({ trail, eyebrow, title, lead, facts = [], schema, updated = CONTENT_UPDATED }: Readonly<{ trail: readonly Crumb[]; eyebrow: string; title: string; lead: string; facts?: readonly (readonly [string, number | string])[]; schema?: unknown; updated?: string }>) {
  const current = trail.at(-1);
  return <>
    <JsonLd data={[breadcrumbSchema(trail), ...(current ? [learningPageSchema({ path: current[1], title, description: lead, updated })] : []), ...[schema ?? []].flat()]} />
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}><ol>
      <li><Link href="/">Home</Link></li>
      {trail.map(([name, path]) => <li key={path} aria-current={path === current?.[1] ? "page" : undefined}>{path === current?.[1] ? name : <Link href={path}>{name}</Link>}</li>)}
    </ol></nav>
    <p className={styles.eyebrow}>{eyebrow}</p>
    <h1 className={styles.title}>{title}</h1>
    <p className={styles.lead}>{lead}</p>
    <p className={styles.updated}>Last updated <time dateTime={updated}>{readableDate(updated)}</time></p>
    {facts.length > 0 && <dl className={styles.facts}>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{typeof value === "number" ? value.toLocaleString("en-IN") : value}</dd></div>)}</dl>}
  </>;
}

/** Text with `inline code` in backticks, rendered on the server. */
export function InlineText({ text }: Readonly<{ text: string }>) {
  return <>{text.split("`").map((part, i) => i % 2 ? <code key={i}>{part}</code> : part)}</>;
}
