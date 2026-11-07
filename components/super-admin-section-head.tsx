"use client";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./super-admin-section-head.module.css";

export type SectionTone = "mint" | "sky" | "lavender" | "peach" | "butter" | "rose" | "sage";

/**
 * A numbered heading that opens one section of a visitor page ("01 · Right now"). Each section answers one question, so
 * the Overview and User activities pages read as a short list of distinct sections instead of one long scroll.
 * `id` is the anchor the SectionNav links to.
 */
export function SectionHead({ id, index, title, question, icon: Icon, tone = "sky", live = false }: { id: string; index: number; title: string; question: string; icon: LucideIcon; tone?: SectionTone; live?: boolean }) {
  return <header id={id} className={styles.head} data-tone={tone}>
    <span className={styles.badge} aria-hidden="true"><Icon size={17} />{live && <i className={styles.ring} />}</span>
    <div className={styles.text}>
      <p className={styles.eyebrow}><span>{String(index).padStart(2, "0")}</span>{live ? "Live · refreshes by itself" : "Section"}</p>
      <h2>{title}</h2>
      <p className={styles.question}>{question}</p>
    </div>
  </header>;
}

/** Sticky pills that jump to a section and follow the reader down the page. */
export function SectionNav({ items, label }: { items: { id: string; label: string; icon: LucideIcon }[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const targets = items.map(item => document.getElementById(item.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-10% 0px -70% 0px" });
    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);
  return <nav className={styles.nav} aria-label={label}>
    {items.map(({ id, label: text, icon: Icon }) => <button key={id} type="button" className={styles.pill} aria-current={active === id ? "true" : undefined}
      onClick={() => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
      <Icon size={13} aria-hidden="true" />{text}
    </button>)}
  </nav>;
}
