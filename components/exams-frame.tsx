"use client";
import { startTransition, useEffect, useState, type ReactNode } from "react";
import Link from "@/components/site-link";
import { ArrowLeftRight, ArrowUpRight, ChevronRight, GraduationCap, Languages, Laptop, Newspaper, PanelLeftClose, PanelLeftOpen, School, Trophy, Wallet, type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Wordmark } from "./brand-mark";
import { AppFootline } from "./app-footline";
import { ExamsSignOut } from "./exams-sign-out";
import { HeaderLanguageSwitch } from "./language-switch";
import { useMobileNav } from "./mobile-nav";
import { SidebarTooltips } from "./sidebar-tooltips";
import { PORTALS, type ScopedPortal } from "@/lib/portal";
import styles from "./exams-shell.module.css";

/*
 * The exam portals in the Tech Learning Dashboard's frame (components/workspace.tsx): the same dark collapsible
 * sidebar, top bar with breadcrumb, mobile drawer and paper workspace, from the shared `.app-shell.compact-workspace`
 * classes in globals.css. Only the destinations differ: each portal's own home, blog and plans, and the switch.
 */
const COLLAPSE_KEY = "masterclass:sidebar-collapsed";
export type ExamsTab = "home" | "tet" | "blog" | "plans" | "choose";
type Item = { id: ExamsTab | "boards" | "competitive"; href: string; label: string; icon: LucideIcon };

const HOME: Record<ScopedPortal, { label: string; icon: LucideIcon }> = { boards: { label: "Board Exams", icon: GraduationCap }, competitive: { label: "Competitive Exams", icon: Trophy }, ielts: { label: "IELTS Dashboard", icon: Languages } };
const portalNav = (portal: ScopedPortal): Item[] => [
  { id: "home", href: PORTALS[portal].home, label: HOME[portal].label, icon: HOME[portal].icon },
  // TET lives inside Competitive Exams; this opens it straight on its Subjects & Topics grid.
  ...(portal === "competitive" ? [{ id: "tet" as const, href: `${PORTALS.competitive.home}?exam=tet&type=topics`, label: "TET Exams", icon: School }] : []),
  { id: "blog", href: PORTALS[portal].blog, label: PORTALS[portal].blogName, icon: Newspaper },
  { id: "plans", href: PORTALS[portal].plans, label: "Plans", icon: Wallet },
];
const chooserNav: Item[] = [
  { id: "boards", href: PORTALS.boards.home, label: "Board Scholars", icon: GraduationCap },
  { id: "competitive", href: PORTALS.competitive.home, label: "Exam Aspirants", icon: Trophy },
];

function NavLink({ item, current, collapsed }: { item: Item; current: boolean; collapsed: boolean }) {
  return <Link href={item.href} aria-label={item.label} aria-current={current ? "page" : undefined} className={`sidebar-notes${current ? " active" : ""}`}>
    <item.icon size={17} aria-hidden="true" />
    {!collapsed && <>{item.label}{current && <ChevronRight size={15} aria-hidden="true" />}</>}
    {collapsed && <span className="sidebar-tooltip">{item.label}</span>}
  </Link>;
}

/** The account menu, as in the Tech dashboard's top bar: an avatar that opens the email, the portal's pages and sign out. */
function Identity({ email, nav, portal, signInTo }: { email: string; nav: Item[]; portal: ScopedPortal | null; signInTo: string }) {
  const [open, setOpen] = useState(false);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger className="profile-trigger" aria-label="Account"><span className="profile-avatar" aria-hidden="true">{email.charAt(0).toUpperCase()}</span></PopoverTrigger>
    <PopoverContent align="end" sideOffset={12} className="profile-menu">
      <span className="profile-menu-email">{email}</span>
      <span className="profile-menu-sep" role="separator" />
      {nav.map(item => <Link key={item.id} href={item.href} className="profile-menu-item" onClick={() => setOpen(false)}><item.icon size={16} aria-hidden="true" />{item.label}</Link>)}
      {portal && <Link href="/exams" className="profile-menu-item" onClick={() => setOpen(false)}><ArrowLeftRight size={16} aria-hidden="true" />Switch portal</Link>}
      <span className="profile-menu-sep" role="separator" />
      <ExamsSignOut className="profile-menu-item profile-menu-item-destructive" to={signInTo} />
    </PopoverContent>
  </Popover>;
}

export function ExamsFrame({ portal, active, email, children }: { portal: ScopedPortal | null; active: ExamsTab; email?: string | null; children: ReactNode }) {
  const info = portal ? PORTALS[portal] : null;
  // Like the Tech dashboard: collapsed by default, the choice kept for the visit under the same key, and always
  // expanded inside the phone drawer (where the labels are the whole point).
  const [savedCollapsed, setCollapsed] = useState(true);
  const mobileNav = useMobileNav(info ? `${info.name} menu` : "Exam portals menu");
  const collapsed = savedCollapsed && !mobileNav.open;
  useEffect(() => { try { if (sessionStorage.getItem(COLLAPSE_KEY) === "0") startTransition(() => setCollapsed(false)); } catch { /* storage blocked: stay collapsed */ } }, []);
  const toggleCollapsed = () => setCollapsed(previous => { const next = !previous; try { sessionStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* storage blocked */ } return next; });
  const nav = portal ? portalNav(portal) : chooserNav;
  const current = nav.find(item => item.id === active)?.label ?? (active === "choose" ? "Choose your portal" : info?.name ?? "Exams");
  return <div {...mobileNav.shellProps} className={`app-shell compact-workspace ${styles.shell}${collapsed ? " sidebar-collapsed" : ""}`} data-portal={portal ?? "exams"}>
    {mobileNav.scrim}
    <aside className="sidebar learning-sidebar" onClick={mobileNav.onAsideClick}>
      <SidebarTooltips collapsed={collapsed} />
      <div className="sidebar-brand-row">
        <Link href={info?.home ?? "/exams"} className="wordmark" aria-label={info ? `MasterClass ${info.name} home` : "MasterClass Exams home"}><Wordmark /></Link>
        <button type="button" className="sidebar-toggle" aria-expanded={!collapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggleCollapsed}>
          {collapsed ? <PanelLeftOpen size={17} aria-hidden="true" /> : <PanelLeftClose size={17} aria-hidden="true" />}
        </button>
      </div>
      <div className="sidebar-label">{info ? info.name : "Exam portals"}</div>
      {/* One options block with the portal nav first and the extras as a second, "pro" nav, as in the Tech sidebar:
          the shared tablet rules lay out only the first nav of a block as a strip. */}
      <div className="sidebar-options">
        <nav aria-label={info ? `${info.name} portal` : "Exam portals"}>
          {nav.map(item => <NavLink key={item.id} item={item} current={item.id === active} collapsed={collapsed} />)}
        </nav>
        <div className="sidebar-label">More</div>
        <nav aria-label="More" className="sidebar-pro-nav">
          {/* The /exams chooser lists the two exam portals (India); IELTS Achievers links to Tech Pro only. */}
          {portal && portal !== "ielts" && <NavLink item={{ id: "choose", href: "/exams", label: "Switch portal", icon: ArrowLeftRight }} current={active === "choose"} collapsed={collapsed} />}
          <NavLink item={{ id: "home", href: PORTALS.tech.signIn, label: "Tech Pro", icon: Laptop }} current={false} collapsed={collapsed} />
        </nav>
      </div>
    </aside>
    <div className="main-shell">
      <header className="topbar">
        {mobileNav.toggle}
        <div className="breadcrumb"><span>{info ? info.name : "MasterClass Exams"}</span><ChevronRight size={14} aria-hidden="true" /><span>{current}</span></div>
        <div className="topbar-actions">
          <HeaderLanguageSwitch classes={{ root: styles.lang, thumb: styles.langThumb, glyph: styles.langGlyph }} />
          <span className="topbar-divider" />
          {email ? <Identity email={email} nav={nav} portal={portal} signInTo={info?.signIn ?? "/exams"} />
            : info ? <><Link href={info.signIn} className="signin-link">Sign in<ArrowUpRight size={15} aria-hidden="true" /></Link><Link href={info.signUp} className={styles.primary}>Join {info.name}</Link></> : null}
        </div>
      </header>
      <main id="main-content" className="workspace">{children}</main>
      <AppFootline tagline={info ? `${info.name}: ${info.tagline}` : "Board Scholars and Exam Aspirants, for India"} />
    </div>
  </div>;
}
