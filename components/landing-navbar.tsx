"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { BookOpen, CodeXml, Crown, Languages, Library, LogIn, Menu, MessageCircle, Route, Terminal, UserPlus, UserRound, X, type LucideIcon } from "lucide-react";
import { Wordmark } from "./brand-mark";
import { useLanguage } from "./language-provider";
import styles from "./landing-home.module.css";

type Indicator = { left: number; right: number; visible: boolean; href: string | null };
/** Each link's own light pill colour, in link order (repeats if there are more links). */
const PILL_TINTS = ["#f3dccd", "#dbe7e2", "#e3e2ee", "#f3ead6", "#dce8f3", "#e4e9d6"];
/** The matching deeper ink for each tint: icon colour, and the well fill when a link is active. */
const PILL_INKS = ["#a84f36", "#3f6b55", "#5b5689", "#8a6212", "#2f5f82", "#5d6a14"];
const NAV_ICONS: Record<string, LucideIcon> = {
  "#paths": Route,
  "#library": Library,
  "#techy": Terminal,
  "#api-docs": CodeXml,
  "#study-engine": MessageCircle,
  "#pricing": Crown,
};

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
  const [account, setAccount] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
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

  // The account dropdown closes on Escape (returning focus to its button) and on any click outside it.
  useEffect(() => {
    if (!account) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setAccount(false); accountRef.current?.querySelector("button")?.focus(); } };
    const onPointer = (event: PointerEvent) => { if (!accountRef.current?.contains(event.target as Node)) setAccount(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [account]);

  return <header className={styles.navbar} data-solid={scrolled || menu || undefined}>
    <div className={styles.navbarInner}>
      <Link href="/" aria-label="MasterClass" className={styles.brand}><Wordmark /></Link>
      <nav ref={navRef} className={styles.navLinks} data-open={menu || undefined} aria-label={text("Main navigation", "मुख्य नेविगेशन")} onMouseLeave={() => moveTo(active)}>
        <span className={styles.navIndicator} aria-hidden="true" data-visible={indicator.visible || undefined} style={{ clipPath: `inset(0 ${indicator.right}px 0 ${indicator.left}px round 999px)`, backgroundColor: PILL_TINTS[Math.max(0, links.findIndex(([href]) => href === indicator.href)) % PILL_TINTS.length] }} />
        {links.map(([href, label], index) => {
          const Icon = NAV_ICONS[href] ?? BookOpen;
          const tone = { "--tint": PILL_TINTS[index % PILL_TINTS.length], "--tint-ink": PILL_INKS[index % PILL_INKS.length] } as CSSProperties;
          return <a key={href} href={href} style={tone} aria-current={active === href ? "location" : undefined} data-on={(indicator.visible && indicator.href === href) || undefined}
            onMouseEnter={() => moveTo(href)} onFocus={() => moveTo(href)} onClick={() => setMenu(false)}>
            <span className={styles.navIconWell} aria-hidden="true"><Icon size={13} strokeWidth={2} className={styles.navIcon} /></span>
            <span>{label}</span>
          </a>;
        })}
      </nav>
      <div className={styles.navActions}>
        <div ref={accountRef} className={styles.account}>
          <button type="button" className={styles.accountButton} aria-label={text("Account", "खाता")} aria-expanded={account} aria-controls="landing-account-menu" onClick={() => { setAccount(value => !value); setMenu(false); }}>
            <UserRound size={19} strokeWidth={1.9} aria-hidden="true" />
          </button>
          {account && <div id="landing-account-menu" className={styles.accountMenu}>
            <div className={styles.accountLang} role="group" aria-label={text("Language", "भाषा")}>
              <span><Languages size={15} strokeWidth={1.9} aria-hidden="true" />{text("Language", "भाषा")}</span>
              <div>
                <button type="button" aria-pressed={!hi} onClick={() => setLanguage("en", false)}>EN</button>
                <button type="button" lang="hi" aria-pressed={hi} onClick={() => setLanguage("hi", false)}>हिन्दी</button>
              </div>
            </div>
            <Link className={styles.accountItem} href="/sign-in" onClick={() => setAccount(false)}>
              <span className={styles.accountIcon} aria-hidden="true"><LogIn size={16} strokeWidth={1.9} /></span>
              <span><strong>{text("Sign in", "साइन इन")}</strong><small aria-hidden="true">{text("Welcome back", "फिर से स्वागत है")}</small></span>
            </Link>
            <Link className={styles.accountItem} href="/sign-up" onClick={() => setAccount(false)}>
              <span className={`${styles.accountIcon} ${styles.accountIconNew}`} aria-hidden="true"><UserPlus size={16} strokeWidth={1.9} /></span>
              <span><strong>{text("Sign up", "साइन अप")}</strong><small aria-hidden="true">{text("Create a free account", "मुफ़्त खाता बनाएँ")}</small></span>
            </Link>
          </div>}
        </div>
        <button type="button" className={styles.navMenu} aria-expanded={menu} aria-label={text("Toggle navigation", "नेविगेशन खोलें")} onClick={() => { setMenu(value => !value); setAccount(false); }}>{menu ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}</button>
      </div>
    </div>
  </header>;
}
