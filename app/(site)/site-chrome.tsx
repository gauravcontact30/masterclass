import Link from "next/link";
import { ArrowRight, Flame, Menu } from "lucide-react";
import { Wordmark } from "@/components/brand-mark";
import { PUBLIC_PAGES } from "@/lib/seo";
import { SiteFooter } from "./site-footer";
import styles from "./site.module.css";

// Server-rendered chrome shared by the (site) and (tech-buzz) route groups: no client JS beyond the root providers.
const NAV = PUBLIC_PAGES.filter(page => ["/courses", "/library", "/about", "/contact"].includes(page.path));

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>
    <a className={styles.skip} href="#main-content">Skip to content</a>
    <header className={styles.header}>
      {/* Home, sign-in/up and the footer links are not prefetched: each prefetch also preloads that page's stylesheets
          (the landing page's are large), which Chrome reports as "preloaded but not used" on every page here. */}
      <Link href="/" prefetch={false} aria-label="MasterClass Buddy home" className={styles.brand}><Wordmark /></Link>
      {/* Shown on /tech-buzz pages only (site.module.css): where the reader is, and what arrives every week. */}
      <Link href="/tech-buzz" className={styles.buzzPill} aria-label="Tech Buzz: 5 fresh blogs every Monday at 00:00 AM IST"><Flame size={14} aria-hidden="true" /><span className={styles.buzzLabel}>Tech Buzz</span><small>5 fresh blogs · every Monday</small></Link>
      <nav aria-label="Main navigation" className={styles.nav}>{NAV.map(page => <Link key={page.path} href={page.path}>{page.label}</Link>)}</nav>
      <div className={styles.actions}>
        <Link href="/sign-in" prefetch={false} className={styles.signIn}>Sign in</Link>
        <Link className={styles.cta} href="/sign-up" prefetch={false}>Start learning<ArrowRight size={15} aria-hidden="true" /></Link>
        {/* Phones: the page links fold into a menu (no script: a details disclosure). */}
        <details className={styles.menu}>
          <summary aria-label="Menu"><Menu size={18} aria-hidden="true" /></summary>
          <nav aria-label="Menu" className={styles.menuPanel}>
            <Link href="/tech-buzz"><Flame size={14} aria-hidden="true" />Tech Buzz blogs</Link>
            {NAV.map(page => <Link key={page.path} href={page.path}>{page.label}</Link>)}
            <Link href="/sign-in" prefetch={false} className={styles.menuSignIn}>Sign in</Link>
          </nav>
        </details>
      </div>
    </header>
    <main id="main-content" tabIndex={-1} className={styles.main}>{children}</main>
    <SiteFooter />
  </div>;
}
