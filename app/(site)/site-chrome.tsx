import Link from "@/components/site-link";
import { ArrowRight, Menu } from "lucide-react";
import { Wordmark } from "@/components/brand-mark";
import { PageBack } from "@/components/page-back";
import { PUBLIC_PAGES } from "@/lib/seo";
import styles from "./site.module.css";

// Server-rendered chrome shared by the (site) and (tech-buzz) route groups: no client JS beyond the root providers.
const NAV = PUBLIC_PAGES.filter(page => ["/courses", "/library", "/about", "/contact"].includes(page.path));

/** `header` replaces the site header, for the Tech Buzz pages. */
export function SiteChrome({ children, header }: { children: React.ReactNode; header?: React.ReactNode }) {
  return <div className={styles.page}>
    <a className={styles.skip} href="#main-content">Skip to content</a>
    {header ?? <header className={styles.header}>
      {/* Home, sign-in/up and the footer links are not prefetched: each prefetch also preloads that page's stylesheets
          (the landing page's are large), which Chrome reports as "preloaded but not used" on every page here. */}
      <Link href="/" prefetch={false} aria-label="MasterClass Buddy home" className={styles.brand}><Wordmark /></Link>
      <nav aria-label="Main navigation" className={styles.nav}>{NAV.map(page => <Link key={page.path} href={page.path}>{page.label}</Link>)}</nav>
      <div className={styles.actions}>
        <Link href="/sign-in" prefetch={false} className={styles.signIn}>Sign in</Link>
        <Link className={styles.cta} href="/sign-up" prefetch={false}>Start learning<ArrowRight size={15} aria-hidden="true" /></Link>
        {/* Phones: the page links fold into a menu (no script: a details disclosure). */}
        <details className={styles.menu}>
          <summary aria-label="Menu"><Menu size={18} aria-hidden="true" /></summary>
          <nav aria-label="Menu" className={styles.menuPanel}>
            {NAV.map(page => <Link key={page.path} href={page.path}>{page.label}</Link>)}
            <Link href="/sign-in" prefetch={false} className={styles.menuSignIn}>Sign in</Link>
          </nav>
        </details>
      </div>
    </header>}
    <PageBack />
    <main id="main-content" tabIndex={-1} className={styles.main}>{children}</main>
  </div>;
}
