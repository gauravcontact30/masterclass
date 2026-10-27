import { Suspense } from "react";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { Wordmark } from "@/components/brand-mark";
import { PUBLIC_PAGES } from "@/lib/seo";
import styles from "./site.module.css";

// Server-rendered chrome shared by the (site) and (tech-buzz) route groups: no client JS beyond the root providers.
const NAV = PUBLIC_PAGES.filter(page => ["/courses", "/library", "/about", "/contact"].includes(page.path));
const LEGAL = PUBLIC_PAGES.filter(page => ["/privacy", "/terms", "/refund-policy"].includes(page.path));
/** The free learning library's sections, linked from every public page so each one is a click from anywhere. */
const LIBRARY: [string, string][] = [["/interview-questions", "Interview questions"], ["/compare", "Comparisons"], ["/workflows", "Workflow blueprints"], ["/learn", "Technology handbooks"], ["/api-reference", "API reference"], ["/vocabulary", "English vocabulary"]];

/** The copyright year, cached for a day so the prerendered shell never reads the clock at request time. */
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>
    <a className={styles.skip} href="#main-content">Skip to content</a>
    <header className={styles.header}>
      <Link href="/" aria-label="Master Class Buddy home"><Wordmark /></Link>
      <nav aria-label="Main navigation" className={styles.nav}>{NAV.map(page => <Link key={page.path} href={page.path}>{page.label}</Link>)}</nav>
      <div className={styles.actions}><Link href="/sign-in">Sign in</Link><Link className={styles.cta} href="/sign-up">Start learning</Link></div>
    </header>
    <main id="main-content" tabIndex={-1} className={styles.main}>{children}</main>
    <footer className={styles.footer}>
      <nav aria-label="Learning library"><ul>{LIBRARY.map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></nav>
      <nav aria-label="Site pages"><ul>{PUBLIC_PAGES.filter(page => page.path !== "/" && !LEGAL.includes(page)).map(page => <li key={page.path}><Link href={page.path}>{page.label}</Link></li>)}</ul></nav>
      <nav aria-label="Legal"><ul>{LEGAL.map(page => <li key={page.path}><Link href={page.path}>{page.title}</Link></li>)}</ul></nav>
      <small>© <Suspense fallback={null}><CopyrightYear /></Suspense> MasterClass. All rights reserved.</small>
    </footer>
  </div>;
}
