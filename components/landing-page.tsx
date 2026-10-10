"use client";
/*
 * Direction contract (Impeccable; user-pinned brief 2026-09-24: "remove the hero, a four-image autoplay slider with arrows directly under the navbar, a more creative and professional navbar, Claude Code design system").
 * THESIS: the photographs are the hero; each slide is a real learner moment carrying its own headline and actions.
 * OWN-WORLD: the dashboard's Claude paper world (DESIGN.md): cream ground, white paper, hairlines, serif display, one clay action, warm photography.
 * STORY: see yourself studying, glimpse the breadth, pick a path, search the real library, start.
 * FIRST VIEWPORT: full-bleed slider under a transparent floating navbar; copy bottom-left; progress segments, counter and arrows along the bottom.
 * FORM: full-bleed image slider (user-pinned), subject ribbon, contents list, ledger, image-led paths.
 */
import { ExpandedText } from "@/components/expanded-text";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check } from "lucide-react";
import { requestJson } from "@/lib/client";
import { LibraryLedger } from "./library-ledger";
import { anek } from "./landing-fonts";
import { LandingOverview } from "./landing-overview";
import { LandingPractice } from "./landing-practice";
import { useReveal } from "./use-reveal";
import { LandingFooter } from "./landing-footer";
import { LandingApiDocs, LandingTechy } from "./landing-pro-sections";
import type { LandingProPreview } from "@/lib/landing-pro-preview";
import type { LandingLibrary } from "@/lib/landing-library";
import home from "./landing-home.module.css";
import { LandingSlider } from "./landing-slider";
import { LandingNavbar } from "./landing-navbar";
import { SubjectRibbon } from "./subject-ribbon";
import { LandingPaths } from "./landing-paths";
import { LandingStudyEngine } from "./landing-study-engine";
import { StudentReviews } from "./student-reviews";
import { LazyStudyGoalForm } from "./lazy-study-goal-form";
import { useLanguage } from "./language-provider";
import styles from "./learn-landing.module.css";

export type LandingPrices = { monthly: number; yearly: number; enabled: boolean };
export function LandingPage({ pro, library, prices: initialPrices }: { pro?: LandingProPreview; library?: LandingLibrary; prices?: LandingPrices }) {
  const { language } = useLanguage(); const hi = language === "hi"; const text = (en: string, hindi: string) => hi ? hindi : en;
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  // Prices rendered on the server arrive in the HTML, so the plan card never paints "—" and then shifts; the fetch is only the fallback.
  const [prices, setPrices] = useState<LandingPrices>(initialPrices ?? { monthly: 299, yearly: 2999, enabled: false }); const [priceState, setPriceState] = useState<"loading" | "ready" | "error">(initialPrices ? "ready" : "loading");
  const [libraryRef, libraryReveal] = useReveal<HTMLElement>();
  useEffect(() => { if (initialPrices) return; let active = true; requestJson<LandingPrices>("/api/billing").then(data => { if (active) { setPrices(data); setPriceState("ready"); } }).catch(() => { if (active) setPriceState("error"); }); return () => { active = false; }; }, [initialPrices]);
  const money = (value: number) => new Intl.NumberFormat(hi ? "hi-IN" : "en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  const savings = prices.monthly > 0 ? Math.max(0, Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100)) : 0;
  const navigation = [["#paths", text("Paths", "पथ")], ...(library ? [["#library", text("Library", "लाइब्रेरी")]] : []), ...(pro ? [["#techy", "Techy"], ["#api-docs", "API Docs"]] : []), ["#study-engine", text("How it answers", "उत्तर कैसे")], ["#pricing", text("Membership", "सदस्यता")]];
  const format = (value: number) => new Intl.NumberFormat(hi ? "hi-IN" : "en-IN").format(value);
  return <div className={`${styles.page} ${home.home} ${anek.variable} ${anek.className}`}><a className={styles.skip} href="#main-content">{text("Skip to content", "सामग्री पर जाएँ")}</a>
    <LandingNavbar links={navigation as [string, string][]} />
    <main id="main-content" tabIndex={-1}>
    <h1 className={home.srOnly}>{text("MasterClass: school, exam and technology learning in English and Hindi", "MasterClass: अंग्रेज़ी और हिन्दी में स्कूल, परीक्षा और तकनीक की पढ़ाई")}</h1>
    <LandingSlider technologies={library?.counts.technology} />
    {library && <SubjectRibbon entries={library.entries} />}
    <LandingOverview counts={library?.counts} />
    <LandingPaths />
    {library && <section ref={libraryRef} id="library" className={home.library} data-reveal={libraryReveal} aria-labelledby="library-title"><div className={`${home.inner} ${home.libraryInner}`}>
      <div className={home.sectionHead}>
        <h2 id="library-title">{text("Search the whole library before you join", "जुड़ने से पहले पूरी लाइब्रेरी खोजें")}</h2>
        <p>{hi
          ? <>हर पंक्ति डैशबोर्ड की असली प्रविष्टि है: <b>{format(library.counts.apiIdentifiers)}</b> API संदर्भ, <b>{format(library.counts.handbookTopics)}</b> हैंडबुक विषय और बहुत कुछ। अपना विषय खोजें और देखें कि वह कहाँ खुलता है।</>
          : <>Every row is a real entry from the dashboard: <b>{format(library.counts.apiIdentifiers)}</b> API references, <b>{format(library.counts.handbookTopics)}</b> handbook topics and more. Find your subject and see where it opens.</>}</p>
      </div>
      <LibraryLedger library={library} />
    </div></section>}
    {pro && <><LandingTechy data={pro.techy} /><LandingApiDocs data={pro.api} /></>}
    <section className={styles.container} style={{ maxWidth: 780, margin: "32px auto 0 auto" }}>
      <LazyStudyGoalForm defaultCategory="technology" />
    </section>
    <LandingPractice />
    <section id="pricing" className={styles.compactPricing}><div className={`${styles.container} ${styles.pricingLayout}`}><div className={styles.pricingCopy}><h2><ExpandedText text={text("Your goals.","आपके लक्ष्य।")} /> <em><ExpandedText text={text("One learning membership.","एक अध्ययन सदस्यता।")} /></em></h2><p><ExpandedText text={text("Every course and category in one plan: published notes, worked answers and practice in one focused space.","हर कोर्स और श्रेणी एक ही योजना में: प्रकाशित नोट्स, हल सहित उत्तर और अभ्यास एक ही जगह।")} /></p><div className={styles.billingToggle} role="group" aria-label={text("Billing period","भुगतान अवधि")}>{(["monthly","yearly"] as const).map(value=><button key={value} aria-pressed={cycle===value} onClick={()=>setCycle(value)}><ExpandedText text={value==="monthly"?text("Monthly","मासिक"):text("Yearly","वार्षिक")} />{value==="yearly"&&priceState==="ready"&&savings>0&&<span><ExpandedText text={text(`Save ${savings}%`,`${savings}% बचाएँ`)} /></span>}</button>)}</div><small><ExpandedText text={text("No course selection needed. Subscribe and start learning.","कोर्स चुनने की ज़रूरत नहीं। सदस्यता लें और सीखना शुरू करें।")} /></small></div><article className={styles.compactPlan}><div className={styles.planTop}><span><BookOpen size={17}/> LEARN IN APP</span><small><ExpandedText text={cycle==="monthly"?text("Monthly membership","मासिक सदस्यता"):text("Yearly membership","वार्षिक सदस्यता")} /></small></div><div className={styles.compactPrice}><ExpandedText text={priceState==="ready"?money(prices[cycle]):"—"} /><small><ExpandedText text={cycle==="monthly"?text("/ month","/ माह"):text("/ year","/ वर्ष")} /></small></div><p><ExpandedText text={priceState==="error"?text("Current pricing is temporarily unavailable.","वर्तमान मूल्य अभी उपलब्ध नहीं है।"):cycle==="yearly"&&priceState==="ready"?text(`${money(prices.yearly/12)}/month equivalent, billed yearly.`,`${money(prices.yearly/12)}/माह के बराबर, वार्षिक भुगतान।`):text("A steady rhythm for your learning.","आपकी पढ़ाई की नियमित गति।")} /></p><ul>{[text("Every course & category","हर कोर्स और श्रेणी"),text("Published lessons","प्रकाशित पाठ"),text("Worked answers","हल सहित उत्तर"),text("Timed practice","समयबद्ध अभ्यास"),text("Revision & bookmarks","पुनरावृत्ति और बुकमार्क"),text("English / Hindi","अंग्रेज़ी / हिन्दी")].map(item=><li key={item}><Check size={14}/><ExpandedText text={item} /></li>)}</ul><Link className={styles.primary} href={`/subscribe?plan=${cycle}`}><ExpandedText text={text("Subscribe now","अभी सदस्यता लें")} /><ArrowRight size={16}/></Link>{priceState==="ready"&&!prices.enabled&&<small className={styles.billingUnavailable}><ExpandedText text={text("Checkout is not enabled yet.","भुगतान अभी सक्षम नहीं है।")} /></small>}</article><p className={styles.compactPlanNote}><ExpandedText text={text("Access starts after payment verification. Cancel renewal in Membership; access continues through your paid period. Guide coverage varies. Revision notes and bookmarks are saved in your browser.","भुगतान सत्यापन के बाद पहुँच शुरू होती है। सदस्यता में नवीनीकरण रद्द करें; भुगतान अवधि तक पहुँच जारी रहेगी। गाइड का कवरेज अलग हो सकता है। नोट्स और बुकमार्क ब्राउज़र में सहेजे जाते हैं।")} /></p></div></section>
    <StudentReviews />
    <LandingStudyEngine />
    <section className={styles.finalCta}><h2><ExpandedText text={text("Make today", "आज से बनाएँ")} /> <em><ExpandedText text={text("chapter one.", "पहला अध्याय।")} /></em></h2><Link className={styles.primary} href="/sign-up"><ExpandedText text={text("Build my learning space", "मेरा अध्ययन क्षेत्र बनाएँ")} /><ArrowRight size={17} /></Link></section></main>
    <LandingFooter />
  </div>;
}
