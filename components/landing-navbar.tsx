"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Link from "@/components/site-link";
import { ArrowRight, BookOpen, Briefcase, ChevronRight, CodeXml, Compass, Crown, Flame, Globe2, GraduationCap, Landmark, Languages, LayoutDashboard, Layers, Library, LogIn, MapPin, Menu, NotebookPen, Palette, Sparkles, Terminal, Type, UserPlus, UserRound, X, type LucideIcon } from "lucide-react";
import { Wordmark } from "./brand-mark";
import { useAudienceGroups, type AudienceGroup } from "./audience-paths";
import { HeaderLanguageSwitch } from "./language-switch";
import { SuggestionBox } from "./suggestion-box";
import { LandingPlansMenu } from "./landing-plans-menu";
import { scrollToSection } from "./hashless-navigation";
import { useLanguage } from "./language-provider";
import { useAppFont } from "./app-font-provider";
import dynamic from "next/dynamic";
import styles from "./landing-home.module.css";

/** The typography picker lives in the account menu, which opens on click: its popover (Base UI), font list and the
 *  Google Fonts loader download then, not with the landing page. */
const FontFamilyDropdown = dynamic(() => import("./font-family-dropdown").then(module => module.FontFamilyDropdown), { ssr: false, loading: () => <span className={styles.accountTypographyLoading} aria-hidden="true" /> });
import type { Currency } from "@/lib/pricing";
import type { PlansMenuPrices } from "./landing-plans-menu";

type Indicator = { left: number; right: number; visible: boolean; href: string | null };
/** Each link's own light pill colour, in link order (repeats if there are more links). */
const PILL_TINTS = ["#f3dccd", "#dbe7e2", "#e3e2ee", "#f3ead6", "#dce8f3", "#e4e9d6", "#fed7aa"];
/** The matching deeper ink for each tint: icon colour, and the well fill when a link is active. */
const PILL_INKS = ["#a84f36", "#3f6b55", "#5b5689", "#8a6212", "#2f5f82", "#5d6a14", "#c2410c"];
/** Account dropdown tabs, in order. */
const ACCOUNT_TABS = ["account", "paths", "style"] as const;
type AccountTab = typeof ACCOUNT_TABS[number];
const PATH_ICONS: Record<AudienceGroup["id"], LucideIcon> = { tech: Briefcase, boards: GraduationCap, government: Landmark };
/** Each Learning paths destination's own icon (falls back to the group's). */
const PATH_LINK_ICONS: Record<string, LucideIcon> = { "/learning": LayoutDashboard, "/tech-buzz": Flame, "/learning/ielts": Languages, "/exams/board-exams": NotebookPen, "/exams/competitive-exams": Landmark };
const NAV_ICONS: Record<string, LucideIcon> = {
  "#workflows": Layers,
  "#library": Library,
  "#techy": Terminal,
  "#api-docs": CodeXml,
  "#interview-prep": GraduationCap,
  "#pricing": Crown,
  "/tech-buzz": Flame,
  "#tech-buzz": Flame,
};

/**
 * The landing navbar. It floats transparent over the hero photography and
 * settles into a solid cream bar once the page scrolls. A soft pill follows
 * the pointer across the links and rests on the section currently in view;
 * each link has its own light pill colour, and the link under it turns dark.
 */
/** `links`: [section key ("#workflows"), label, the section's own page for crawlers and new tabs]. */
export function LandingNavbar({ links, prices = null, onCurrency }: { links: [string, string, string?][]; prices?: PlansMenuPrices | null; onCurrency?: (currency: Currency) => void }) {
  const { language, t } = useLanguage();
  const text = (en: string, hindi: string) => {
    if (language === "hi") return hindi;
    if (language === "es") {
      if (en === "Account") return "Cuenta";
      if (en === "Language") return "Idioma";
      if (en === "Sign in") return "Iniciar sesión";
      if (en === "Welcome back") return "Bienvenido de nuevo";
      if (en === "Sign up") return "Registrarse";
      if (en === "Create a free account") return "Crea una cuenta gratis";
      if (en === "Main navigation") return "Navegación principal";
      if (en === "Toggle navigation") return "Alternar navegación";
    }
    if (language === "ja") {
      if (en === "Account") return "アカウント";
      if (en === "Language") return "言語";
      if (en === "Sign in") return "ログイン";
      if (en === "Welcome back") return "おかえりなさい";
      if (en === "Sign up") return "新規登録";
      if (en === "Create a free account") return "無料アカウントを作成";
      if (en === "Main navigation") return "メインナビゲーション";
      if (en === "Toggle navigation") return "ナビゲーション切り替え";
    }
    if (language === "de") {
      if (en === "Account") return "Konto";
      if (en === "Language") return "Sprache";
      if (en === "Sign in") return "Anmelden";
      if (en === "Welcome back") return "Willkommen zurück";
      if (en === "Sign up") return "Registrieren";
      if (en === "Create a free account") return "Kostenloses Konto erstellen";
      if (en === "Main navigation") return "Hauptnavigation";
      if (en === "Toggle navigation") return "Navigation umschalten";
    }
    if (language === "fr") {
      if (en === "Account") return "Compte";
      if (en === "Language") return "Langue";
      if (en === "Sign in") return "Connexion";
      if (en === "Welcome back") return "Bon retour";
      if (en === "Sign up") return "S'inscrire";
      if (en === "Create a free account") return "Créer un compte gratuit";
      if (en === "Main navigation") return "Navigation principale";
      if (en === "Toggle navigation") return "Basculer la navigation";
    }
    if (language === "zh") {
      if (en === "Account") return "账户";
      if (en === "Language") return "语言";
      if (en === "Sign in") return "登录";
      if (en === "Welcome back") return "欢迎回来";
      if (en === "Sign up") return "注册";
      if (en === "Create a free account") return "创建免费账户";
      if (en === "Main navigation") return "主导航";
      if (en === "Toggle navigation") return "切换导航";
    }
    return en;
  };
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [account, setAccount] = useState(false);
  const [accountTab, setAccountTab] = useState<AccountTab>("account");
  const audienceGroups = useAudienceGroups();
  const [plans, setPlans] = useState(false);
  const { appFontId, setAppFont, resetAppFont } = useAppFont();
  const openPlans = useCallback((value: boolean) => { setPlans(value); if (value) { setAccount(false); setMenu(false); } }, []);
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
    const sections = links.filter(([href]) => href.startsWith("#")).map(([href]) => document.getElementById(href.slice(1))).filter((node): node is HTMLElement => !!node);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(`#${visible[0].target.id}`);
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [links]);

  const moveTo = useCallback((href: string | null) => {
    const link = href ? navRef.current?.querySelector<HTMLAnchorElement>(`a[data-section="${href.slice(1)}"]`) : null;
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
    // The font picker's list is portalled to <body>, outside this menu: a press there must not close the menu, or the
    // picker unmounts before its click lands and the font is never selected.
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (accountRef.current?.contains(target) || target?.closest?.('[data-slot="popover-content"]')) return;
      setAccount(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [account]);

  return <header aria-label="Site header" className={styles.navbar} data-solid={scrolled || menu || plans || undefined}>
    <div className={styles.navbarInner}>
      <Link href="/" aria-label="MasterClass Buddy home" className={styles.brand}><Wordmark /></Link>
      <nav ref={navRef} className={styles.navLinks} data-open={menu || undefined} aria-label={text("Main navigation", "मुख्य नेविगेशन")} onMouseLeave={() => moveTo(active)}>
        <span className={styles.navIndicator} aria-hidden="true" data-visible={indicator.visible || undefined} style={{ clipPath: `inset(0 ${indicator.right}px 0 ${indicator.left}px round 999px)`, backgroundColor: PILL_TINTS[Math.max(0, links.findIndex(([href]) => href === indicator.href)) % PILL_TINTS.length] }} />
        {links.map(([href, label, page], index) => {
          const Icon = NAV_ICONS[href] ?? BookOpen;
          const tone = { "--tint": PILL_TINTS[index % PILL_TINTS.length], "--tint-ink": PILL_INKS[index % PILL_INKS.length] } as CSSProperties;
          // The href is the section's own crawlable page; on this page a plain click smooth-scrolls to the section
          // instead, leaving the address bar as it is (no #fragment routes). New-tab clicks still open the page.
          return <a key={href} href={page ?? href} data-section={href.slice(1)} style={tone} aria-current={active === href ? "location" : undefined} data-on={(indicator.visible && indicator.href === href) || undefined}
            onMouseEnter={() => moveTo(href)} onFocus={() => moveTo(href)} onClick={event => {
              setMenu(false);
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              if (href.startsWith("#") && scrollToSection(href.slice(1))) { event.preventDefault(); setActive(href); }
            }}>
            <span className={styles.navIconWell} aria-hidden="true"><Icon size={13} strokeWidth={2} className={styles.navIcon} /></span>
            <span>{label}</span>
          </a>;
        })}
      </nav>
      <div className={styles.navActions}>
        <HeaderLanguageSwitch classes={{ root: styles.langSwitch, thumb: styles.langThumb, glyph: styles.langGlyph }} /><span className={styles.headerSuggestion}><SuggestionBox label={t("suggestionBox")} iconOnly /></span>
        <LandingPlansMenu prices={prices} open={plans} onOpenChange={openPlans} onCurrency={onCurrency} />
        <div ref={accountRef} className={styles.account}>
          <button type="button" className={styles.accountButton} aria-label={text("Account", "खाता")} aria-expanded={account} aria-controls="landing-account-menu" onClick={() => { if (!account) setAccountTab("account"); setAccount(value => !value); setMenu(false); setPlans(false); }}>
            <UserRound size={19} strokeWidth={1.9} aria-hidden="true" />
          </button>
          {account && <div id="landing-account-menu" className={styles.accountMenu}>
            {/* Welcome band: who this menu is for, above the tabs. */}
            <div className={styles.accountHero}>
              <span className={styles.accountAvatar} aria-hidden="true"><UserRound size={20} strokeWidth={1.9} /><Sparkles size={11} strokeWidth={2.4} className={styles.accountAvatarSpark} /></span>
              <span className={styles.accountHeroText}>
                <strong>{text("Welcome to MasterClass Buddy", "MasterClass Buddy में स्वागत है")}</strong>
                <small>{text("Save progress, pick a path, make it yours", "प्रगति सहेजें, मार्ग चुनें, अपने अनुसार बनाएँ")}</small>
              </span>
            </div>
            {/* Tabs: Account (sign up / sign in), Learning paths (who the site serves), Appearance (app typography). */}
            <div className={styles.accountTabs} role="tablist" aria-label={text("Account menu", "खाता मेनू")} onKeyDown={event => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") return;
              event.preventDefault();
              const at = ACCOUNT_TABS.indexOf(accountTab);
              const next = event.key === "Home" ? 0 : event.key === "End" ? ACCOUNT_TABS.length - 1 : (at + (event.key === "ArrowRight" ? 1 : -1) + ACCOUNT_TABS.length) % ACCOUNT_TABS.length;
              setAccountTab(ACCOUNT_TABS[next]);
              document.getElementById(`landing-account-tab-${ACCOUNT_TABS[next]}`)?.focus();
            }}>
              {ACCOUNT_TABS.map(tab => {
                const Icon = tab === "account" ? UserRound : tab === "paths" ? Compass : Palette;
                const label = tab === "account" ? text("Account", "खाता") : tab === "paths" ? text("Learning paths", "अध्ययन मार्ग") : text("Appearance", "रूप-रंग");
                return <button key={tab} id={`landing-account-tab-${tab}`} type="button" role="tab" aria-selected={accountTab === tab} aria-controls="landing-account-panel" tabIndex={accountTab === tab ? 0 : -1} onClick={() => setAccountTab(tab)}>
                  <Icon size={13} strokeWidth={2} aria-hidden="true" /><span>{label}</span>
                </button>;
              })}
            </div>
            <div id="landing-account-panel" className={styles.accountPanel} role="tabpanel" aria-labelledby={`landing-account-tab-${accountTab}`}>
              {accountTab === "account" && <div className={styles.accountActions}>
                <Link className={styles.accountPrimary} href="/sign-up" onClick={() => setAccount(false)}>
                  <UserPlus size={16} strokeWidth={2} aria-hidden="true" />{text("Create free account", "मुफ़्त खाता बनाएँ")}<ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                </Link>
                <Link className={styles.accountItem} href="/sign-in" onClick={() => setAccount(false)}>
                  <span className={styles.accountIcon} aria-hidden="true"><LogIn size={16} strokeWidth={1.9} /></span>
                  <span><strong>{text("Sign in", "साइन इन")}</strong><small aria-hidden="true">{text("Already have an account? Welcome back", "पहले से खाता है? फिर से स्वागत है")}</small></span>
                  <ArrowRight size={15} strokeWidth={2} className={styles.accountItemArrow} aria-hidden="true" />
                </Link>
              </div>}
              {/* Learning paths: a short intro, then one card per audience. Each card has a header (icon, who it is for,
                  where it is available) over full-width destination rows with an icon, a one-line hint and a chevron. */}
              {accountTab === "paths" && <div className={styles.accountPaths}>
                <p className={styles.accountPathsIntro}>{text("Pick where you want to start. You can switch any time.", "जहाँ से शुरू करना है वह चुनें। आप कभी भी बदल सकते हैं।")}</p>
                {audienceGroups.map(group => {
                  const Icon = PATH_ICONS[group.id];
                  const headingId = `landing-path-${group.id}`;
                  return <section key={group.id} className={styles.accountPath} data-tone={group.id} aria-labelledby={headingId}>
                    <header className={styles.accountPathHead}>
                      <span className={styles.accountPathIcon} aria-hidden="true"><Icon size={17} strokeWidth={2} /></span>
                      <span className={styles.accountPathTitle}>
                        <strong id={headingId}>{group.title}</strong>
                        <small>{group.note}</small>
                      </span>
                      <span className={styles.accountPathScope} data-scope={group.scope}>
                        {group.scope === "world" ? <Globe2 size={11} strokeWidth={2.2} aria-hidden="true" /> : <MapPin size={11} strokeWidth={2.2} aria-hidden="true" />}
                        {group.scope === "world" ? text("Worldwide", "दुनिया भर") : text("India", "भारत")}
                      </span>
                    </header>
                    <ul className={styles.accountPathLinks}>
                      {group.links.map(link => {
                        const LinkIcon = PATH_LINK_ICONS[link.href] ?? Icon;
                        return <li key={link.href}>
                          <Link href={link.href} prefetch={link.prefetch} onClick={() => setAccount(false)}>
                            <span className={styles.accountPathLinkIcon} aria-hidden="true"><LinkIcon size={15} strokeWidth={2} /></span>
                            <span className={styles.accountPathLinkText}><b>{link.label}</b><small>{link.hint}</small></span>
                            <ChevronRight size={16} strokeWidth={2.2} className={styles.accountPathChevron} aria-hidden="true" />
                          </Link>
                        </li>;
                      })}
                    </ul>
                  </section>;
                })}
              </div>}
              {/* Google font-family dropdown as shadcn ui: changes font-family of entire application */}
              {accountTab === "style" && <div className={styles.accountTypography}>
                <div className={styles.accountTypographyHead}>
                  <span className={styles.accountTypographyIcon} aria-hidden="true">
                    <Type size={15} strokeWidth={2.2} />
                  </span>
                  <div className={styles.accountTypographyMeta}>
                    <strong>{text("Application Typography", "एप्लिकेशन फ़ॉन्ट")}</strong>
                    <small>{text("Google fonts for Landing, Dashboards & Blogs", "पूरे ऐप (लैंडिंग, डैशबोर्ड और ब्लॉग्स) का फ़ॉन्ट")}</small>
                  </div>
                </div>
                <div className={styles.accountTypographyPicker}>
                  <FontFamilyDropdown
                    value={appFontId}
                    onChange={setAppFont}
                    onReset={resetAppFont}
                    ariaLabel="Application font family"
                    variant="pill"
                    valueType="id"
                    defaultVal="inter"
                    matchTriggerWidth={true}
                  />
                </div>
              </div>}
            </div>
            {/* Bottom band: a no-commitment way in, on every tab. */}
            <Link className={styles.accountBrowse} href="/library" onClick={() => setAccount(false)}>
              <span className={styles.accountBrowseIcon} aria-hidden="true"><Library size={15} strokeWidth={2} /></span>
              <span><strong>{text("Just browsing?", "बस देख रहे हैं?")}</strong><small>{text("Read the free library, no account needed", "फ़्री लाइब्रेरी पढ़ें, खाते की ज़रूरत नहीं")}</small></span>
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>}
        </div>
        <button type="button" className={styles.navMenu} aria-expanded={menu} aria-label={text("Toggle navigation", "नेविगेशन खोलें")} onClick={() => { setMenu(value => !value); setAccount(false); setPlans(false); }}>{menu ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}</button>
      </div>
    </div>
  </header>;
}
