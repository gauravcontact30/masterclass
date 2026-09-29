import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { publicPage, webPageSchema, type PublicPage } from "@/lib/seo";
import styles from "./site.module.css";

/** Breadcrumb, the page's single <h1>, and its WebPage + BreadcrumbList structured data. */
export function PageIntro({ path, eyebrow, extraSchema }: { path: PublicPage["path"]; eyebrow: string; extraSchema?: unknown }) {
  const page = publicPage(path);
  return <>
    <JsonLd data={extraSchema ? [webPageSchema(path), extraSchema] : webPageSchema(path)} />
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}><ol><li><Link href="/">Home</Link></li><li aria-current="page">{page.label}</li></ol></nav>
    <p className={styles.eyebrow}>{eyebrow}</p>
    <h1 className={styles.title}>{page.title}</h1>
    <p className={styles.lead}>{page.description}</p>
  </>;
}
