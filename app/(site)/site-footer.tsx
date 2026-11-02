import { Suspense } from "react";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowRight, CalendarSync, ChevronDown, Flame, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/brand-mark";
import { FooterLinks } from "@/components/footer-links";
import { FooterVisibility } from "@/components/footer-visibility";
import { LandingFooterContact, LandingFooterFacts } from "@/components/landing-footer-contact";
import { DAILY_TRACKS } from "@/lib/tech-buzz-sections";
import styles from "./site-footer.module.css";

/** The copyright year, cached for a day so the prerendered shell never reads the clock at request time. */
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

/** Each Monday edition's five tracks, by their card names ("Agentic AI - LangChain, …" → "Agentic AI"). */
const TRACKS = DAILY_TRACKS.map(track => ({ id: track.id, label: track.short.split(" - ")[0], color: track.color }));

/*
 * What the platform offers today (checked 2026-11-01), one column per area. The Tech Buzz anchors are the section ids
 * in components/tech-buzz-showcase.tsx; the /learning links open the signed-in dashboard (sign-in first for guests).
 * Landing-only anchors (#pricing, #interview-prep) are deliberately not used here: these pages have no such sections.
 */
const COLUMNS: { title: string; links: [string, string][] }[] = [
  { title: "Tech Buzz", links: [["This Week's 5 Blogs", "/tech-buzz#tb-daily"], ["Fresh & Latest", "/tech-buzz#tb-fresh"], ["Star-Rated Blogs", "/tech-buzz#tb-stars"], ["Most Liked", "/tech-buzz#tb-liked"], ["n8n Workflow Blogs", "/tech-buzz#tb-n8n"], ["Blogs by Technology", "/tech-buzz#tb-groups"]] },
  { title: "Free library", links: [["Interview Questions", "/interview-questions"], ["Comparisons", "/compare"], ["Workflow Blueprints", "/workflows"], ["Technology Handbooks", "/learn"], ["API Reference", "/api-reference"], ["English Vocabulary", "/vocabulary"]] },
  { title: "Courses & paths", links: [["All Courses", "/courses"], ["System Design", "/learning/system-design"], ["Technology Courses", "/learning/technology"], ["English & IELTS", "/learning/languages"], ["Certifications", "/learning/certifications"], ["Free Library Overview", "/library"]] },
  { title: "Member tools", links: [["Learning Dashboard", "/learning"], ["Official Docs Explained", "/learning/official-docs"], ["API Docs", "/learning/api-docs"], ["Techy Code Lab", "/learning/techy"], ["Agentic Workflows", "/learning/workflow"], ["Interview Practice", "/learning/interview"]] },
  { title: "Company", links: [["About Us", "/about"], ["Contact & Support", "/contact"], ["Site Map", "/site-map"], ["Plans & Pricing", "/learning/plans"], ["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"], ["Cancellation & Refunds", "/refund-policy"]] },
];

/**
 * The shared dark footer, omitted on sign-in and sign-up by a route-aware client wrapper. Content is server-rendered;
 * interactive features include the link columns' hover pill and the cards' copy buttons. The left card introduces the platform in the
 * same form as the "Get in touch" and "Plans and payments" cards beside it (one source for contact and billing facts).
 * Moving to the top is the site-wide round button (components/back-to-top.tsx), so the footer has no link of its own.
 * Links are not prefetched: each prefetch also preloads that page's stylesheets.
 */
export function SiteFooter() {
  return <Suspense fallback={null}><FooterVisibility><footer id="site-footer" className={styles.footer}>
    <div className={styles.inner}>
      <div className={styles.intro}>
        <details className={styles.brand} data-accordion="free" aria-label="About MasterClass Buddy" suppressHydrationWarning>
          <summary className={styles.brandHead}>
            <span className={styles.brandTitle}><Wordmark /><ChevronDown className={styles.chevron} size={18} aria-hidden="true" /></span>
            <p>Interview prep, system design, AI agents and weekly tech stories for working engineers, in one place.</p>
          </summary>
          <div className={styles.brandBody}>
            <p className={styles.weekly}><span aria-hidden="true"><CalendarSync size={15} /></span>Five new Tech Buzz blogs every Monday at 00:00 IST</p>
            <ul className={styles.tracks} aria-label="This week's Tech Buzz tracks">
              {TRACKS.map(track => <li key={track.id}><Link href="/tech-buzz#tb-daily" prefetch={false} style={{ "--tone": track.color } as React.CSSProperties}>{track.label}</Link></li>)}
            </ul>
            <div className={styles.ctas}>
              <Link className={styles.primary} href="/sign-up" prefetch={false}>Start learning<ArrowRight size={15} aria-hidden="true" /></Link>
              <Link className={styles.secondary} href="/tech-buzz" prefetch={false}><Flame size={15} aria-hidden="true" />Read Tech Buzz</Link>
            </div>
          </div>
        </details>
        <div className={styles.cards}><LandingFooterContact /><LandingFooterFacts /></div>
      </div>
      <div className={styles.columns}>
        {COLUMNS.map((column, index) => <nav key={column.title} aria-label={column.title}>
          <h3>{column.title}</h3>
          <FooterLinks links={column.links} column={index} prefetch={false} />
        </nav>)}
      </div>
      <div className={styles.bottom}>
        <small>© <Suspense fallback={null}><CopyrightYear /></Suspense> MasterClass Buddy. All rights reserved.</small>
        <span className={styles.note}><Sparkles size={13} aria-hidden="true" />Members also get Study Buddy, the AI study assistant, on every page.</span>
      </div>
    </div>
  </footer></FooterVisibility></Suspense>;
}
