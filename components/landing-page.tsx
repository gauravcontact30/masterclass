"use client";
/*
 * Direction contract (Impeccable; user-pinned brief 2026-09-24: "remove the hero, a four-image autoplay slider with arrows directly under the navbar, a more creative and professional navbar, Claude Code design system").
 * THESIS: the photographs are the hero; each slide is a real learner moment carrying its own headline and actions.
 * OWN-WORLD: the dashboard's Claude paper world (DESIGN.md): cream ground, white paper, hairlines, serif display, one clay action, warm photography.
 * STORY: see yourself studying, glimpse the breadth, pick a path, search the real library, start.
 * FIRST VIEWPORT: full-bleed slider under a transparent floating navbar; copy bottom-left; progress segments, counter and arrows along the bottom.
 * FORM: full-bleed image slider (user-pinned), subject ribbon, contents list, ledger, image-led paths.
 */

import { useEffect, useState } from "react";
import { LibraryBig } from "lucide-react";
import { requestJson } from "@/lib/client";
import { LibraryLedger } from "./library-ledger";
import { landingFont } from "./landing-fonts";
import { LandingOverview } from "./landing-overview";
import { useReveal } from "./use-reveal";
import { LandingFooter } from "./landing-footer";
import { LearningSlot } from "./learning-slot";
import { LandingApiDocs, LandingTechy } from "./landing-pro-sections";
import type { LandingProPreview } from "@/lib/landing-pro-preview";
import type { LandingLibrary } from "@/lib/landing-library";
import type { DailyWord, LockedTeaser, PulseCard } from "@/lib/landing-daily-types";
import home from "./landing-home.module.css";
import { LandingSlider } from "./landing-slider";
import { LandingAiPulse } from "./landing-ai-pulse";
import { LandingVocabulary } from "./landing-vocabulary";
import { LandingNavbar } from "./landing-navbar";
import { WelcomeModal } from "./welcome-modal";
import { SubjectRibbon } from "./subject-ribbon";
import { StudentReviews } from "./student-reviews";
import { LandingWorkflows } from "./landing-workflows";
import { LandingInterview } from "./landing-interview";
import { LandingComparisons } from "./landing-comparisons";
import { LandingTechDocs } from "./landing-tech-docs";
import type { OfficialTechDocs } from "@/lib/tech-docs-official";
import { LandingMembership } from "./landing-membership";
import { LandingPathFinder } from "./landing-path-finder";
import { LandingCoffee } from "./landing-coffee";
import type { BlogTeaser } from "@/lib/coffee-and-code";
import { ContentProvider } from "./content-editing";
import type { ContentOverrides } from "@/lib/content-overrides";
import frame from "./landing-section.module.css";
import { useLanguage } from "./language-provider";
import styles from "./learn-landing.module.css";

export type LandingPrices = { monthly: number; yearly: number; enabled: boolean };
export function LandingPage({ pro, library, prices: initialPrices, daily, techDocs, copyrightYear, overrides, coffee }: { overrides?: ContentOverrides; coffee?: BlogTeaser[]; copyrightYear?: number; pro?: LandingProPreview; library?: LandingLibrary; prices?: LandingPrices; techDocs?: OfficialTechDocs | null; daily?: { day: string; pulse: PulseCard[]; words: DailyWord[]; locked?: { pulse: LockedTeaser | null; word: LockedTeaser | null }; totals?: { pulse: number; words: number } } }) {
  const { language } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  // Prices rendered on the server arrive in the HTML, so the plan card never paints "—" and then shifts; the fetch is only the fallback.
  const [prices, setPrices] = useState<LandingPrices>(initialPrices ?? { monthly: 299, yearly: 2999, enabled: false }); const [priceState, setPriceState] = useState<"loading" | "ready" | "error">(initialPrices ? "ready" : "loading");
  const [libraryRef, libraryReveal] = useReveal<HTMLElement>();
  useEffect(() => { if (initialPrices) return; let active = true; requestJson<LandingPrices>("/api/billing").then(data => { if (active) { setPrices(data); setPriceState("ready"); } }).catch(() => { if (active) setPriceState("error"); }); return () => { active = false; }; }, [initialPrices]);
  // [section on this page, label, the section's own crawlable page]: links are real URLs for search engines and
  // new tabs, and smooth-scroll to the section here without a #fragment.
  const navigation = [["#interview-prep", text("Interview prep", "इंटरव्यू"), "/interview-questions"], ["#workflows", text("Workflows", "वर्कफ़्लो"), "/workflows"], ...(library ? [["#library", text("Library", "लाइब्रेरी"), "/library"]] : []), ...(pro ? [["#techy", "Techy", "/learn"], ["#api-docs", "API Docs", "/api-reference"]] : []), ["#pricing", text("Membership", "सदस्यता"), "/subscribe"]];
  const font = landingFont(hi);
  const format = (value: number) => new Intl.NumberFormat(hi ? "hi-IN" : "en-IN").format(value);
  return <ContentProvider overrides={overrides}><div className={`${styles.page} ${home.home} ${font.variable} ${font.className}`}><a className={styles.skip} href="#main-content">{text("Skip to content", "सामग्री पर जाएँ")}</a>
    <LandingNavbar links={navigation as [string, string, string][]} prices={priceState === "ready" ? prices : null} />
    <WelcomeModal prices={priceState === "ready" ? prices : null} />
    <main id="main-content" tabIndex={-1}>
    <h1 className={home.srOnly}>{text("MasterClass: school, exam and technology learning in English and Hindi", "MasterClass: अंग्रेज़ी और हिन्दी में स्कूल, परीक्षा और तकनीक की पढ़ाई")}</h1>
    {/* Order (2026-10-20): the promise (slider, what you get), something to try at once (Study Buddy), the highest-intent
        sections (interview prep, the daily pulse, blueprints), proof of depth (library, comparisons, docs), then social
        proof straight before the ask (reviews, membership). */}
    <LandingSlider technologies={library?.counts.technology} />
    <LearningSlot surface="landing" page="home" section="after-slider" className={styles.learningSlot} />
    <LandingOverview counts={library?.counts} />
    <LandingPathFinder />
    {library && <SubjectRibbon entries={library.entries} />}
    <LandingInterview preview />
    {daily && <LandingAiPulse cards={daily.pulse} total={daily.totals?.pulse} day={daily.day} locked={daily.locked?.pulse} preview />}
    <LandingWorkflows preview />
    {coffee && <LandingCoffee posts={coffee} />}
    <LearningSlot surface="landing" page="home" section="middle" className={styles.learningSlot} />
    {library && <section ref={libraryRef} id="library" className={`${frame.section} ${home.library}`} data-ground="paper" data-reveal={libraryReveal} aria-labelledby="library-title"><div className={`${home.inner} ${home.libraryInner}`}>
      <header className={frame.head}>
        <div>
          <p className={frame.kicker}><LibraryBig size={14} aria-hidden="true" />{text("Library", "लाइब्रेरी")}<span>{text(`${format(library.total)} sample rows`, `${format(library.total)} नमूना पंक्तियाँ`)}</span></p>
        <h2 id="library-title">{text("Explore the dashboard library ", "जुड़ने से पहले ")}<em>{text("before you join.", "डैशबोर्ड लाइब्रेरी देखें।")}</em></h2>
        </div>
        <div>
          <p className={frame.lede}>{text("Every row below is a real entry from the dashboard: technology handbooks, API references, exam and class courses, vocabulary and Techy topics. Search for your subject and see exactly where it opens once you sign up.", "नीचे की हर पंक्ति डैशबोर्ड की असली प्रविष्टि है: तकनीकी हैंडबुक, API संदर्भ, परीक्षा व कक्षा कोर्स, शब्दावली और Techy विषय। अपना विषय खोजें और देखें कि साइन अप के बाद वह कहाँ खुलता है।")}</p>
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
    <LandingComparisons preview official={techDocs} />
    <LandingTechDocs official={techDocs} preview />
    {pro && <><LandingTechy data={pro.techy} /><LandingApiDocs data={pro.api} /></>}
    {daily && <LandingVocabulary words={daily.words} total={daily.totals?.words} day={daily.day} locked={daily.locked?.word} preview />}
    <StudentReviews />
    <LearningSlot surface="landing" page="home" section="before-plans" className={styles.learningSlot} />
    <LandingMembership prices={prices} priceState={priceState} cycle={cycle} onCycle={setCycle} />
    <LearningSlot surface="landing" page="home" section="bottom" className={styles.learningSlot} />
    </main>
    <LandingFooter year={copyrightYear} />
  </div></ContentProvider>;
}
