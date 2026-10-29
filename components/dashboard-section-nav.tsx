"use client";
import { useEffect, useRef, useState } from "react";
import { BookOpenText, Compass, GraduationCap, Layers, Library, MessagesSquare, Newspaper, Scale, Workflow } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./dashboard-section-nav.module.css";

/** In page order. "your-guides" is the reader's own study catalog under the sheet (components/workspace.tsx). */
const SECTIONS = [
  { id: "dashboard-deep-courses", en: "Courses", hi: "कोर्स", icon: GraduationCap },
  { id: "ai-pulse", en: "Today's pulse", hi: "आज का पल्स", icon: Newspaper },
  { id: "interview-prep", en: "Interview prep", hi: "इंटरव्यू तैयारी", icon: MessagesSquare },
  { id: "workflows", en: "Blueprints", hi: "ब्लूप्रिंट", icon: Workflow },
  { id: "tech-comparisons", en: "Comparisons", hi: "तुलनाएँ", icon: Scale },
  { id: "tech-docs", en: "Tech docs", hi: "टेक डॉक्स", icon: Library },
  { id: "vocabulary", en: "Word power", hi: "शब्द शक्ति", icon: BookOpenText },
  { id: "your-guides", en: "Your guides", hi: "आपकी गाइड", icon: Compass },
  { id: "dashboard-plans", en: "Membership", hi: "सदस्यता", icon: Layers },
] as const;

/**
 * The dashboard's learning sheet is seven long sections: this bar, pinned under the top bar, names them all and
 * marks the one being read, so a section further down is one click away instead of a long scroll. The links are
 * plain fragments; components/hashless-navigation.tsx scrolls to them without touching the address bar.
 */
export function DashboardSectionNav() {
  const hi = useLanguage().language === "hi";
  // Every link renders on the server; after mount, sections that are not on the page (hidden by the Super Admin,
  // or the plans when the reader is a member) drop out.
  const [present, setPresent] = useState<string[] | null>(null);
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  useEffect(() => {
    const found = SECTIONS.map(section => document.getElementById(section.id)).filter((element): element is HTMLElement => element !== null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reads the rendered page after mount; the server renders every link.
    setPresent(found.map(element => element.id));
    // The current section is the last one whose top has passed the band just under the pinned bars.
    let frame = 0;
    const update = () => {
      frame = 0;
      // At the very bottom the last sections can never reach the top: the last one in view is current then.
      const bottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      const current = (bottom && found.findLast(element => element.getBoundingClientRect().top < innerHeight)) || found.findLast(element => element.getBoundingClientRect().top <= 140) || found[0];
      if (current) setActive(current.id);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    // Capture: the dashboard may scroll its main column rather than the window.
    addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => { cancelAnimationFrame(frame); removeEventListener("scroll", onScroll, { capture: true }); };
  }, []);
  // On a phone the row scrolls sideways: keep the current section's link in it (by hand: scrollIntoView could move the page).
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const row = list.current; const link = row?.querySelector<HTMLElement>("a[aria-current]");
    if (!row || !link) return;
    const left = link.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + link.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollTo({ left: left - 12, behavior: "smooth" });
  }, [active, present]);
  const shown = present ? SECTIONS.filter(section => present.includes(section.id)) : SECTIONS;
  return <nav className={styles.nav} aria-label={hi ? "डैशबोर्ड अनुभाग" : "Dashboard sections"}>
    <span className={styles.label}>{hi ? "सीधे जाएँ" : "Jump to"}</span>
    <ul ref={list}>{shown.map(({ id, en, hi: hindi, icon: Icon }) => <li key={id}>
      <a href={`#${id}`} aria-current={active === id ? "location" : undefined}><Icon size={14} aria-hidden="true" />{hi ? hindi : en}</a>
    </li>)}</ul>
  </nav>;
}
