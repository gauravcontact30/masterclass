"use client";
/*
 * Direction contract (Impeccable; user-pinned brief 2026-09-24: "remove the hero, a four-image autoplay slider with arrows directly under the navbar, a more creative and professional navbar, Claude Code design system").
 * THESIS: the photographs are the hero; each slide is a real learner moment carrying its own headline and actions.
 * OWN-WORLD: the dashboard's Claude paper world (DESIGN.md): cream ground, white paper, hairlines, serif display, one clay action, warm photography.
 * STORY: see yourself studying, glimpse the breadth, pick a path, search the real library, start.
 * FIRST VIEWPORT: full-bleed slider under a transparent floating navbar; copy bottom-left; progress segments, counter and arrows along the bottom.
 * FORM: full-bleed image slider (user-pinned), subject ribbon, contents list, ledger, image-led paths.
 */

import { usePriceRefresh } from "./use-price-refresh";
import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { loadPrices } from "./currency-picker";
import type { Currency, SaleInfo } from "@/lib/pricing";
import { LandingFestiveSale } from "./landing-festive-sale";
import { LibraryBig } from "lucide-react";
import { landingFont } from "./landing-fonts";
import { LandingNews } from "./landing-news";
import { useReveal } from "./use-reveal";
import { LearningSlot } from "./learning-slot";
import type { LandingProPreview } from "@/lib/landing-pro-preview";
import type { LandingFresh } from "@/lib/landing-fresh-types";
import type { LandingLibrary } from "@/lib/landing-library";
import type { DailyWord, LockedTeaser, PulseCard } from "@/lib/landing-daily-types";
import home from "./landing-home.module.css";
import { LandingSlider } from "./landing-slider";
import { LandingNavbar } from "./landing-navbar";
import { WelcomeModal } from "./welcome-modal";
import { SubjectRibbon } from "./subject-ribbon";
import type { OfficialTechDocs } from "@/lib/tech-docs-official";
import { LandingMembership } from "./landing-membership";
import { LandingPathFinder } from "./landing-path-finder";
import type { BlogTeaser } from "@/lib/coffee-and-code";
import { ContentProvider } from "./content-editing";
import type { ContentOverrides } from "@/lib/content-overrides";
import type { WorkflowPreview } from "@/lib/landing-workflows-preview";
import frame from "./landing-section.module.css";
import { useLanguage } from "./language-provider";
import styles from "./learn-landing.module.css";
import { LandingWorkflows } from "./landing-workflows";
import { LandingComparisons } from "./landing-comparisons";
import { LandingInterview } from "./landing-interview";
import { LandingAiPulse } from "./landing-ai-pulse";

// Sections below the first screens are split into their own chunks. They still render on the server (the HTML and
// what search engines read are unchanged); in the browser each hydrates on its own, so no single long task blocks input.
// The interview, AI pulse and feature sections stay in the main chunk: the others share their carousel controls and
// accordions, and a shared module imported only by split chunks is copied into each of them.
const LibraryLedger = dynamic(() => import("./library-ledger").then(m => m.LibraryLedger));
const LandingFooter = dynamic(() => import("./landing-footer").then(m => m.LandingFooter));
const LandingVocabulary = dynamic(() => import("./landing-vocabulary").then(m => m.LandingVocabulary));
const StudentReviews = dynamic(() => import("./student-reviews").then(m => m.StudentReviews));
const LandingTechDocs = dynamic(() => import("./landing-tech-docs").then(m => m.LandingTechDocs));
const LandingCoffee = dynamic(() => import("./landing-coffee").then(m => m.LandingCoffee));
const LandingApiDocs = dynamic(() => import("./landing-pro-sections").then(m => m.LandingApiDocs));
const LandingTechy = dynamic(() => import("./landing-pro-sections").then(m => m.LandingTechy));

/** `international`: other currencies are offered, so the page re-prices itself where the visitor is (it is cached in rupees). */
export type LandingPrices = { monthly: number; yearly: number; enabled: boolean; currency?: Currency; currencies?: Currency[]; local?: Currency; inr?: { monthly: number; yearly: number }; international?: boolean; sale?: SaleInfo | null };
/** `today`: the India-calendar day number (istDay); the sections that turn over daily pick their content from it. */
export function LandingPage({ features, certifications, workflows, pro, library, prices: initialPrices, daily, techDocs, copyrightYear, overrides, coffee, today = 0, featuredDoc, fresh = null }: { features?: ReactNode; certifications?: ReactNode; workflows: WorkflowPreview; fresh?: LandingFresh | null; today?: number; featuredDoc?: string; overrides?: ContentOverrides; coffee?: BlogTeaser[]; copyrightYear?: number; pro?: LandingProPreview; library?: LandingLibrary; prices?: LandingPrices; techDocs?: OfficialTechDocs | null; daily?: { day: string; pulse: PulseCard[]; words: DailyWord[]; locked?: { pulse: LockedTeaser | null; word: LockedTeaser | null }; totals?: { pulse: number; words: number } } }) {
  const { language, t } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  // Prices rendered on the server arrive in the HTML, so the plan card never paints "—" and then shifts; the fetch is only the fallback.
  // A failed re-price (to the visitor's currency) keeps the server's rupee prices rather than blanking the card.
  const [prices, setPrices] = useState<LandingPrices>(initialPrices ?? { monthly: 299, yearly: 2999, enabled: false }); const [priceState, setPriceState] = useState<"loading" | "ready" | "error">(initialPrices ? "ready" : "loading");
  usePriceRefresh(prices, setPrices);
  const [libraryRef, libraryReveal] = useReveal<HTMLElement>();
  useEffect(() => { if (initialPrices && !initialPrices.international) return; let active = true; loadPrices().then(data => { if (active) { setPrices(current => ({ ...current, ...data })); setPriceState("ready"); } }).catch(() => { if (active && !initialPrices) setPriceState("error"); }); return () => { active = false; }; }, [initialPrices]);
  // The picker's choice re-prices every price on the page (membership, Plans menu, welcome window) at once.
  const reprice = (currency: Currency) => { void loadPrices(currency).then(data => setPrices(current => ({ ...current, ...data }))).catch(() => {}); };
  // [section on this page, label, the section's own crawlable page]: links are real URLs for search engines and
  // new tabs, and smooth-scroll to the section here without a #fragment.
  const navigation = [
    ["#interview-prep", t("interviewPrep") || "Interview prep", "/interview-questions"],
    ["#workflows", t("workflows") || "Workflows", "/workflows"],
    ...(library ? [["#library", t("library") || "Library", "/library"]] : []),
    ...(pro ? [["#techy", "Techy", "/learn"], ["#api-docs", "API Docs", "/api-reference"]] : []),
    ["#pricing", t("membership") || "Membership", "/subscribe"]
  ];
  const font = landingFont(hi);
  const format = (value: number) => new Intl.NumberFormat(hi ? "hi-IN" : "en-IN").format(value);
  return <ContentProvider overrides={overrides}><div className={`${styles.page} ${home.home} ${font.variable} ${font.className}`}><a className={styles.skip} href="#main-content">{t("skipToContent") || "Skip to content"}</a>
    <LandingNavbar links={navigation as [string, string, string][]} prices={priceState === "ready" ? prices : null} onCurrency={reprice} />
    <WelcomeModal prices={priceState === "ready" ? prices : null} onCurrency={reprice} />
    <main id="main-content" tabIndex={-1}>
    <h1 className={home.srOnly}>{t("siteHeadline") || "MasterClass Buddy: technology learning for professionals, in English and Hindi"}</h1>
    {/* Order (2026-10-20): the promise (slider, what you get), something to try at once (Study Buddy), the highest-intent
        sections (interview prep, the daily pulse, blueprints, certification paths), a section each for AI Search, featured lessons and notes, proof of depth (library, comparisons,
        docs), then social proof straight before the ask (reviews, membership). */}
    <LandingSlider technologies={library?.counts.technology} />
    {/* A festive sale in force (lib/server/festive-sale.ts) leads straight after the hero; it renders nothing otherwise. */}
    {priceState === "ready" && prices.sale && <LandingFestiveSale prices={prices} />}
    <LearningSlot surface="landing" page="home" section="after-slider" className={styles.learningSlot} />
    <LandingNews />
    <LandingPathFinder day={today} fresh={fresh?.goals} />
    {library && <SubjectRibbon entries={library.entries} />}
    <LandingInterview preview day={today} fresh={fresh?.interview} />
    {daily && <LandingAiPulse cards={daily.pulse} total={daily.totals?.pulse} day={daily.day} locked={daily.locked?.pulse} preview />}
    <LandingWorkflows {...workflows} preview />
    {certifications}
    {coffee && <LandingCoffee posts={coffee} />}
    <LearningSlot surface="landing" page="home" section="middle" className={styles.learningSlot} />
    {features}
    {library && <section ref={libraryRef} id="library" className={`${frame.section} ${home.library}`} data-ground="paper" data-reveal={libraryReveal} aria-labelledby="library-title"><div className={`${home.inner} ${home.libraryInner}`}>
      <header className={frame.head}>
        <div>
          <p className={frame.kicker}><LibraryBig size={14} aria-hidden="true" />{text("Library", "लाइब्रेरी")}<span>{text(`${format(library.total)} sample rows`, `${format(library.total)} नमूना पंक्तियाँ`)}</span></p>
        <h2 id="library-title">{text("Explore the dashboard library ", "जुड़ने से पहले ")}<em>{text("before you join.", "डैशबोर्ड लाइब्रेरी देखें।")}</em></h2>
        </div>
        <div>
          <p className={frame.lede}>{text("Every row below is a real entry from the dashboard: technology handbooks, API references, System Design courses, vocabulary and Techy topics. Search for your subject and see exactly where it opens once you sign up.", "नीचे की हर पंक्ति डैशबोर्ड की असली प्रविष्टि है: तकनीकी हैंडबुक, API संदर्भ, सिस्टम डिज़ाइन कोर्स, शब्दावली और Techy विषय। अपना विषय खोजें और देखें कि साइन अप के बाद वह कहाँ खुलता है।")}</p>
          <dl className={frame.facts}>
            <div><dt>{text("Handbook topics", "हैंडबुक विषय")}</dt><dd>{format(library.counts.handbookTopics)}</dd></div>
            <div><dt>{text("API references", "API संदर्भ")}</dt><dd>{format(library.counts.apiIdentifiers)}</dd></div>
            <div><dt>{text("Words", "शब्द")}</dt><dd>{format(library.counts.word)}</dd></div>
            <div><dt>{text("Courses", "कोर्स")}</dt><dd>{format(library.counts.course)}</dd></div>
          </dl>
        </div>
      </header>
      <LibraryLedger library={library} />
    </div></section>}
    <LandingComparisons preview official={techDocs} day={today} fresh={fresh?.difference} />
    <LandingTechDocs official={techDocs} preview featured={featuredDoc} fresh={fresh?.doc} />
    {pro && <><LandingTechy data={pro.techy} /><LandingApiDocs data={pro.api} /></>}
    {daily && <LandingVocabulary words={daily.words} total={daily.totals?.words} day={daily.day} locked={daily.locked?.word} preview />}
    <StudentReviews />
    <LearningSlot surface="landing" page="home" section="before-plans" className={styles.learningSlot} />
    <LandingMembership prices={prices} priceState={priceState} cycle={cycle} onCycle={setCycle} onCurrency={reprice} />
    <LearningSlot surface="landing" page="home" section="bottom" className={styles.learningSlot} />
    </main>
    <LandingFooter year={copyrightYear} />
  </div></ContentProvider>;
}
