"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Languages, LogIn, Menu, X } from "lucide-react";
import { Wordmark } from "./brand-mark";
import { useLanguage } from "./language-provider";
import styles from "./landing-home.module.css";

type Indicator = { left: number; right: number; visible: boolean; href: string | null };
/** Each link's own light pill colour, in link order (repeats if there are more links). */
const PILL_TINTS = ["#f3dccd", "#dbe7e2", "#e3e2ee", "#f3ead6", "#dce8f3", "#e4e9d6"];

/**
 * The landing navbar. It floats transparent over the hero photography and
 * settles into a solid cream bar once the page scrolls. A soft pill follows
 * the pointer across the links and rests on the section currently in view;
 * each link has its own light pill colour, and the link under it turns dark.
 */
export function LandingNavbar({ links }: { links: [string, string][] }) {
  const { language, setLanguage } = useLanguage();
  const hi = language === "hi";
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [indicator, setIndicator] = useState<Indicator>({ left: 0, right: 0, visible: false, href: null });
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy: the section nearest the top third of the viewport is "here".
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = links.map(([href]) => document.getElementById(href.slice(1))).filter((node): node is HTMLElement => !!node);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(`#${visible[0].target.id}`);
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [links]);

  const moveTo = useCallback((href: string | null) => {
    const link = href ? navRef.current?.querySelector<HTMLAnchorElement>(`a[href="${href}"]`) : null;
    const nav = navRef.current;
    // A full-width layer revealed with clip-path moves and resizes without triggering layout.
    setIndicator(link && nav ? { left: link.offsetLeft, right: nav.clientWidth - link.offsetLeft - link.offsetWidth, visible: true, href } : current => ({ ...current, visible: false, href: null }));
  }, []);
  useLayoutEffect(() => { moveTo(active); }, [active, moveTo, language]);

  useEffect(() => {
    if (!menu) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menu]);

  return <header className={styles.navbar} data-solid={scrolled || menu || undefined}>
    <div className={styles.navbarInner}>
      <Link href="/" aria-label="MasterClass" className={styles.brand}><Wordmark /></Link>
      <nav ref={navRef} className={styles.navLinks} data-open={menu || undefined} aria-label={text("Main navigation", "मुख्य नेविगेशन")} onMouseLeave={() => moveTo(active)}>
        <span className={styles.navIndicator} aria-hidden="true" data-visible={indicator.visible || undefined} style={{ clipPath: `inset(0 ${indicator.right}px 0 ${indicator.left}px round 999px)`, backgroundColor: PILL_TINTS[Math.max(0, links.findIndex(([href]) => href === indicator.href)) % PILL_TINTS.length] }} />
        {links.map(([href, label]) => <a key={href} href={href} aria-current={active === href ? "location" : undefined} data-on={(indicator.visible && indicator.href === href) || undefined}
          onMouseEnter={() => moveTo(href)} onFocus={() => moveTo(href)} onClick={() => setMenu(false)}>{label}</a>)}
        <Link className={styles.navMobileCta} href="/sign-up" onClick={() => setMenu(false)}>{text("Start learning", "सीखना शुरू करें")}</Link>
      </nav>
      <div className={styles.navActions}>
        <div className={styles.langSwitch} role="group" aria-label={text("Language", "भाषा")}>
          <Languages size={14} className={styles.langIcon} aria-hidden="true" />
          <button type="button" aria-pressed={!hi} onClick={() => setLanguage("en", false)}>EN</button>
          <button type="button" aria-pressed={hi} onClick={() => setLanguage("hi", false)}>HI</button>
        </div>
        <Link className={styles.navSignin} href="/sign-in" aria-label={text("Sign in", "साइन इन")} title={text("Sign in", "साइन इन")}><LogIn size={18} strokeWidth={2} aria-hidden="true" /></Link>
        <Link className={styles.navCta} href="/sign-up">{text("Start learning", "सीखना शुरू करें")}</Link>
        <button type="button" className={styles.navMenu} aria-expanded={menu} aria-label={text("Toggle navigation", "नेविगेशन खोलें")} onClick={() => setMenu(value => !value)}>{menu ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}</button>
      </div>
    </div>
  </header>;
}
