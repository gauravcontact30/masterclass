import Link from "next/link";
import styles from "./app-footline.module.css";

/**
 * The signed-in dashboards' one-line footer (Learning Dashboard and Super Admin, user request 2026-11-02): a thin rule
 * with the name and three links, at the bottom of the main column. FooterVisibility keeps the full site footer off them.
 */
export function AppFootline() {
  return <footer className={`app-footline ${styles.line}`}>
    <span className={styles.about}><b>MasterClass Buddy</b><span className={styles.tagline}> · Interview prep, system design and AI agents for working engineers</span></span>
    <nav aria-label="Help and policies" className={styles.links}>
      <Link href="/contact" prefetch={false}>Support</Link>
      <Link href="/privacy" prefetch={false}>Privacy</Link>
      <Link href="/terms" prefetch={false}>Terms</Link>
    </nav>
  </footer>;
}
