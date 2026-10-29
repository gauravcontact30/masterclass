"use client";
import { createContext, useContext } from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, Lock } from "lucide-react";
import styles from "./dashboard-more.module.css";

/**
 * Set by the Learning dashboard for an account whose trial has ended: the sections there show the landing preview,
 * and their "see all" link leads to the plans instead of back to the page the reader is already on.
 */
export const LockedMoreContext = createContext(false);

/**
 * The landing page shows three cards per learning section; this compact link, pinned to the section's top-right
 * corner, leads to the rest, which live in the same section on /learning (components/dashboard-learning.tsx).
 * `detail` is the longer explanation, kept as the tooltip and the accessible description.
 */
export function DashboardMore({ href, title, detail, className }: Readonly<{ href: string; title: string; detail: string; className?: string }>) {
  const locked = useContext(LockedMoreContext);
  const Icon = locked ? Lock : LayoutDashboard;
  const description = locked ? `${detail} Membership opens all of it.` : detail;
  return <Link href={locked ? "/learning/plans" : href} className={className ? `${styles.more} ${className}` : styles.more} title={description} aria-label={`${title}. ${description}`}>
    <Icon size={15} aria-hidden="true" className={styles.icon} />
    <span>{title}</span>
    <ArrowRight size={15} aria-hidden="true" className={styles.arrow} />
  </Link>;
}
