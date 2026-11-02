"use client";

import { useEffect, useState, useSyncExternalStore, type MouseEvent } from "react";
import Link from "next/link";
import { Bookmark, CheckCircle2, Lock, PenLine, Repeat2, Sparkles, UserCheck } from "lucide-react";
import { useMarks } from "@/lib/tech-buzz-marks";
import { useOutline, type OutlineItem } from "@/lib/tech-buzz-outline";
import { openFeedView, subscribeUrl } from "@/lib/tech-buzz-url";
import styles from "./tech-buzz-side-nav.module.css";

/*
 * The Tech Buzz menu: the reader's views, the open story's contents and how to unlock the rest. It is the rail beside an
 * open story on wide screens and the header's drawer everywhere else.
 */
const VIEWS = [
  { href: "/tech-buzz", label: "For you", icon: Sparkles },
  { href: "/tech-buzz?feed=following", label: "Following", icon: UserCheck },
  { href: "/tech-buzz?feed=saved", label: "Reading list", icon: Bookmark },
  { href: "/tech-buzz?feed=reposts", label: "Your reposts", icon: Repeat2 },
];
const readPath = () => window.location.pathname + window.location.search;

/** Marks the section being read: the last heading to pass the top third of the screen. */
function useActiveSection(items: OutlineItem[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const targets = items.filter(item => !item.locked).map(item => document.getElementById(item.id)).filter((node): node is HTMLElement => !!node);
    if (!targets.length) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-72px 0px -66% 0px" });
    targets.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);
  return active;
}

export function TechBuzzSideNav({ onNavigate }: { onNavigate?: () => void }) {
  const outline = useOutline();
  const active = useActiveSection(outline.items);
  const path = useSyncExternalStore(subscribeUrl, readPath, () => "");
  const savedCount = Object.keys(useMarks("save")).length;

  const openView = (event: MouseEvent, href: string) => {
    if (openFeedView(href)) event.preventDefault();
    onNavigate?.();
  };
  const jump = (item: OutlineItem) => {
    onNavigate?.();
    const target = item.locked ? document.querySelector(".paywalled-story") : document.getElementById(item.id);
    target?.scrollIntoView({ behavior: "smooth", block: item.locked ? "center" : "start" });
  };

  return <div className={styles.nav}>
    <nav aria-label="Tech Buzz">
      <ul className={styles.views}>
        {VIEWS.map(({ href, label, icon: Icon }) => <li key={href}>
          <Link href={href} className={styles.view} aria-current={path === href ? "page" : undefined} onClick={event => openView(event, href)}>
            <Icon size={18} aria-hidden="true" /><span>{label}</span>
            {label === "Reading list" && savedCount > 0 && <small>{savedCount}</small>}
          </Link>
        </li>)}
        <li><Link href="/tech-buzz/write" prefetch={false} className={styles.view} onClick={onNavigate}><PenLine size={18} aria-hidden="true" /><span>Slate - Ink</span></Link></li>
      </ul>
    </nav>

    {outline.items.length > 0 && <nav className={styles.outline} aria-label="In this story">
      <h2>In this story</h2>
      <ol>
        {outline.items.map(item => <li key={item.id}>
          <button type="button" aria-current={active === item.id ? "location" : undefined} data-locked={item.locked || undefined} onClick={() => jump(item)}>
            <span>{item.label}</span>
            {item.locked && <Lock size={12} aria-label="For members" />}
          </button>
        </li>)}
      </ol>
    </nav>}

    {outline.member
      ? <p className={styles.member}><CheckCircle2 size={15} aria-hidden="true" />Member access</p>
      : outline.unlock && <Link href={outline.unlock.href} prefetch={false} className={styles.unlock} onClick={onNavigate}>{outline.unlock.label}</Link>}
  </div>;
}
