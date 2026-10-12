import Link from "next/link";
import { Wordmark } from "@/components/brand-mark";
import { PUBLIC_PAGES } from "@/lib/seo";
import styles from "./site.module.css";

// Server-rendered chrome for the indexable pages: no client JS beyond the root providers.
const NAV = PUBLIC_PAGES.filter(page => ["/courses", "/about", "/contact"].includes(page.path));
const LEGAL = PUBLIC_PAGES.filter(page => ["/privacy", "/terms", "/refund-policy"].includes(page.path));

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>
    <a className={styles.skip} href="#main-content">Skip to content</a>
    <header className={styles.header}>
      <Link href="/" aria-label="MasterClass home"><Wordmark /></Link>
      <nav aria-label="Main navigation" className={styles.nav}>{NAV.map(page => <Link key={page.path} href={page.path}>{page.label}</Link>)}</nav>
      <div className={styles.actions}><Link href="/sign-in">Sign in</Link><Link className={styles.cta} href="/sign-up">Start learning</Link></div>
    </header>
    <main id="main-content" tabIndex={-1} className={styles.main}>{children}</main>
    <footer className={styles.footer}>
      <nav aria-label="Site pages"><ul>{PUBLIC_PAGES.filter(page => page.path !== "/" && !LEGAL.includes(page)).map(page => <li key={page.path}><Link href={page.path}>{page.label}</Link></li>)}</ul></nav>
      <nav aria-label="Legal"><ul>{LEGAL.map(page => <li key={page.path}><Link href={page.path}>{page.title}</Link></li>)}</ul></nav>
      <small>© {new Date().getFullYear()} MasterClass. All rights reserved.</small>
    </footer>
  </div>;
}
