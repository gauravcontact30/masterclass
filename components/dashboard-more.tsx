import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import styles from "./dashboard-more.module.css";

/**
 * The landing page shows three cards per learning section; this compact link, pinned to the section's top-right
 * corner, leads to the rest, which live in the same section on /learning (components/dashboard-learning.tsx).
 * `detail` is the longer explanation, kept as the tooltip and the accessible description.
 */
export function DashboardMore({ href, title, detail, className }: Readonly<{ href: string; title: string; detail: string; className?: string }>) {
  return <Link href={href} className={className ? `${styles.more} ${className}` : styles.more} title={detail} aria-label={`${title}. ${detail}`}>
    <LayoutDashboard size={15} aria-hidden="true" className={styles.icon} />
    <span>{title}</span>
    <ArrowRight size={15} aria-hidden="true" className={styles.arrow} />
  </Link>;
}
