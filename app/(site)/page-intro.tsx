import { RouteH1 } from "@/components/route-heading";
import Link from "@/components/site-link";
import { JsonLd } from "@/components/json-ld";
import { CONTENT_UPDATED, publicPage, readableDate, webPageSchema, type PublicPage } from "@/lib/seo";
import styles from "./site.module.css";

/** Breadcrumb, the page's single <h1>, its "Last updated" date, and its WebPage + BreadcrumbList structured data. */
export function PageIntro({ path, eyebrow, extraSchema, updated = CONTENT_UPDATED }: { path: PublicPage["path"]; eyebrow: string; extraSchema?: unknown; updated?: string }) {
  const page = publicPage(path);
  return <>
    <JsonLd data={extraSchema ? [webPageSchema(path, updated), extraSchema] : webPageSchema(path, updated)} />
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}><ol><li><Link href="/">Home</Link></li><li aria-current="page">{page.label}</li></ol></nav>
    <p className={styles.eyebrow}>{eyebrow}</p>
    <RouteH1 className={styles.title}>{page.title}</RouteH1>
    <p className={styles.lead}>{page.description}</p>
    <p className={styles.updated}>Last updated <time dateTime={updated}>{readableDate(updated)}</time></p>
  </>;
}
