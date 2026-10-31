"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, BookMarked, BookA, BookOpenText, CircleHelp, Code2, Coffee, FileCode2, GraduationCap, ListOrdered, MessagesSquare, NotebookPen, Search, Sparkles, Workflow, type LucideIcon } from "lucide-react";
import { ExpandedText } from "./expanded-text";
import { useLanguage } from "./language-provider";
import { HINDI_ENABLED } from "@/lib/i18n";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./landing-membership.module.css";
import { formatPrice, type Currency, type SaleInfo } from "@/lib/pricing";
import { SaleBadge, SalePrice } from "./sale-price";
import { BilledNote, CurrencyPicker } from "./currency-picker";

export type MembershipPrices = { monthly: number; yearly: number; enabled: boolean; currency?: Currency; currencies?: Currency[]; local?: Currency; inr?: { monthly: number; yearly: number }; sale?: SaleInfo | null };
type Area = { icon: LucideIcon; name: [string, string]; note: [string, string] };

/** What the membership opens, in the Learning Dashboard's own groups, names and sidebar icons (components/workspace.tsx). */
const GROUPS: { title: [string, string]; areas: Area[] }[] = [
  { title: ["Dashboard home, fresh every week", "डैशबोर्ड होम, हर हफ़्ते नया"], areas: [
    { icon: Sparkles, name: ["AI & agentic pulse", "AI और एजेंटिक हलचल"], note: ["A fresh card set across 33 technologies", "33 तकनीकों में रोज़ नया कार्ड सेट"] },
    { icon: BookA, name: ["Word power", "शब्द शक्ति"], note: ["New words every week with audio and Hindi", "ऑडियो और हिन्दी सहित हर हफ़्ते नए शब्द"] },
    { icon: Code2, name: ["Tech Topics", "टेक टॉपिक्स"], note: ["Technology comparisons with interview questions", "इंटरव्यू प्रश्नों सहित तकनीकों की तुलना"] },
    { icon: BookOpenText, name: ["Technology docs", "तकनीकी डॉक्स"], note: ["Platform guides, projects, DSA and OOPs", "प्लेटफ़ॉर्म गाइड, परियोजनाएँ, DSA और OOPs"] },
  ] },
  { title: ["Learning", "लर्निंग"], areas: [
    { icon: Search, name: ["Search with AI mode", "AI मोड के साथ खोज"], note: ["Answers from the notes, or from a model", "नोट्स से या मॉडल से उत्तर"] },
    { icon: ListOrdered, name: ["On The Go", "On The Go"], note: ["Step-by-step build guides with every command", "हर कमांड के साथ चरण-दर-चरण गाइड"] },
    { icon: NotebookPen, name: ["Notes", "नोट्स"], note: ["Revision notes for every technology", "हर तकनीक के रिवीज़न नोट्स"] },
    { icon: BookA, name: ["Vocabulary", "शब्दावली"], note: ["Workplace English words with Hindi meanings and examples", "हिन्दी अर्थ और उदाहरण सहित कामकाजी अंग्रेज़ी शब्द"] },
    { icon: Coffee, name: ["Coffee & Code", "Coffee & Code"], note: ["Short engineering articles: real code, then interview questions", "छोटे इंजीनियरिंग लेख: असली कोड, फिर इंटरव्यू प्रश्न"] },
    { icon: Bookmark, name: ["Bookmark", "बुकमार्क"], note: ["Save anything to revise later", "बाद में दोहराने के लिए सहेजें"] },
  ] },
  { title: ["Professional Learn", "Professional Learn"], areas: [
    { icon: BookMarked, name: ["Official Docs", "आधिकारिक डॉक्स"], note: ["Vendor documentation, summarised", "विक्रेता दस्तावेज़, संक्षेप में"] },
    { icon: Code2, name: ["Techy", "Techy"], note: ["Topics, code examples and puzzles", "विषय, कोड उदाहरण और पहेलियाँ"] },
    { icon: FileCode2, name: ["API Docs", "API Docs"], note: ["Every identifier, linked to its source", "हर पहचानकर्ता, स्रोत से जुड़ा"] },
    { icon: Workflow, name: ["Workflow", "वर्कफ़्लो"], note: ["System design and AI agent blueprints, step by step", "सिस्टम डिज़ाइन और AI एजेंट ब्लूप्रिंट, चरण दर चरण"] },
    { icon: BookOpenText, name: ["Lessons", "पाठ"], note: ["Published lessons for every course", "हर कोर्स के प्रकाशित पाठ"] },
    { icon: CircleHelp, name: ["Quiz", "क्विज़"], note: ["Timed practice with explanations", "व्याख्या सहित समयबद्ध अभ्यास"] },
    { icon: MessagesSquare, name: ["Interview", "इंटरव्यू"], note: ["Subjective and objective banks per technology", "हर तकनीक के विषयगत और वस्तुनिष्ठ प्रश्न"] },
  ] },
];

/**
 * One membership, shown as what it opens: the plan card (billing toggle, live price, subscribe) beside a map of the
 * dashboard areas it unlocks. Prices come from the landing page, which renders them on the server.
 */
export function LandingMembership({ prices, priceState, cycle, onCycle, onCurrency }: Readonly<{ prices: MembershipPrices; priceState: "loading" | "ready" | "error"; cycle: "monthly" | "yearly"; onCycle: (cycle: "monthly" | "yearly") => void; onCurrency?: (currency: Currency) => void }>) {
  const { language } = useLanguage(); const hi = language === "hi"; const lang = hi ? 1 : 0;
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const money = (value: number) => formatPrice(value, prices.currency, hi);
  const savings = prices.monthly > 0 ? Math.max(0, Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100)) : 0;
  const areaCount = GROUPS.reduce((sum, group) => sum + group.areas.length, 0);
  return <section id="pricing" className={frame.section} data-ground="wash" aria-labelledby="membership-title"><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><GraduationCap size={14} aria-hidden="true" />{text("Membership", "सदस्यता")}<span>{text(`${areaCount} dashboard areas`, `${areaCount} डैशबोर्ड क्षेत्र`)}</span></p>
        <h2 id="membership-title"><ExpandedText text={text("Your goals. ", "आपके लक्ष्य। ")} /><em><ExpandedText text={text("One learning membership.", "एक अध्ययन सदस्यता।")} /></em></h2>
      </div>
      <p className={frame.lede}><ExpandedText text={text(`Every course and category in one plan, exactly as the Learning Dashboard is laid out: the daily home, Learning (including every Coffee & Code article in full) and Professional Learn. No course to choose and nothing behind a second tier${HINDI_ENABLED ? "; it all opens in English and Hindi" : ""}.`, "हर कोर्स और श्रेणी एक ही योजना में, ठीक वैसे ही जैसे Learning Dashboard में है: रोज़ का होम, लर्निंग (हर Coffee & Code लेख पूरा) और Professional Learn। कोई कोर्स चुनना नहीं, कोई दूसरा स्तर नहीं; सब अंग्रेज़ी और हिन्दी में खुलता है।")} /></p>
    </header>
    <div className={styles.layout}>
      <article className={styles.plan} aria-label={text("Membership plan", "सदस्यता योजना")}>
        <div className={styles.toggle} role="group" aria-label={text("Billing period", "भुगतान अवधि")}>
          {(["monthly", "yearly"] as const).map(value => <button type="button" key={value} aria-pressed={cycle === value} onClick={() => onCycle(value)}>
            <ExpandedText text={value === "monthly" ? text("Monthly", "मासिक") : text("Yearly", "वार्षिक")} />
            {prices.sale && prices.sale.percent && <span className={styles.discountTag}>-{prices.sale.percent}%</span>}
            {value === "yearly" && priceState === "ready" && savings > 0 && !prices.sale && <span><ExpandedText text={text(`Save ${savings}%`, `${savings}% बचाएँ`)} /></span>}
          </button>)}
        </div>
        {priceState === "ready" && <SaleBadge sale={prices.sale} hi={hi} />}
        {onCurrency && prices.currency && <CurrencyPicker value={prices.currency} options={prices.currencies} local={prices.local} onChange={onCurrency} hi={hi} />}
        {priceState === "ready" && prices.sale
          ? <p className={styles.price}><SalePrice sale={prices.sale} cycle={cycle} full={prices[cycle]} currency={prices.currency} hi={hi} per={cycle === "monthly" ? text(" / month", " / माह") : text(" / year", " / वर्ष")} /></p>
          : <p className={styles.price}><b><ExpandedText text={priceState === "ready" ? money(prices[cycle]) : "—"} /></b><small><ExpandedText text={cycle === "monthly" ? text("/ month", "/ माह") : text("/ year", "/ वर्ष")} /></small></p>}
        <p className={styles.priceNote}><ExpandedText text={priceState === "error" ? text("Current pricing is temporarily unavailable.", "वर्तमान मूल्य अभी उपलब्ध नहीं है।") : cycle === "yearly" && priceState === "ready" ? text(`${money((prices.sale?.yearly ?? prices.yearly) / 12)}/month equivalent, billed yearly.`, `${money((prices.sale?.yearly ?? prices.yearly) / 12)}/माह के बराबर, वार्षिक भुगतान।`) : text("Billed monthly. Cancel renewal any time.", "मासिक भुगतान। नवीनीकरण कभी भी रद्द करें।")} /></p>
        <BilledNote prices={prices} cycle={cycle} hi={hi} />
        <Link className={`${frame.cta} ${styles.subscribe}`} href={`/subscribe?plan=${cycle}`}><ExpandedText text={text("Subscribe now", "अभी सदस्यता लें")} /><ArrowRight size={16} aria-hidden="true" /></Link>
        <p className={styles.trial}><ExpandedText text={text("New here? ", "नए हैं? ")} /><Link href="/sign-up"><ExpandedText text={text("Start a 1-day free trial", "1 दिन का निःशुल्क ट्रायल शुरू करें")} /></Link><ExpandedText text={text(": full access, no card needed.", ": पूरी पहुँच, कोई कार्ड नहीं।")} /></p>
        {priceState === "ready" && !prices.enabled && <small className={styles.unavailable}><ExpandedText text={text("Checkout is not enabled yet.", "भुगतान अभी सक्षम नहीं है।")} /></small>}
        <p className={styles.fine}><ExpandedText text={text("Access starts after payment verification. Cancel renewal in Membership; access continues through your paid period. Revision notes and bookmarks are saved in your browser.", "भुगतान सत्यापन के बाद पहुँच शुरू होती है। सदस्यता में नवीनीकरण रद्द करें; भुगतान अवधि तक पहुँच जारी रहेगी। नोट्स और बुकमार्क ब्राउज़र में सहेजे जाते हैं।")} /></p>
      </article>
      <div className={styles.map}>
        {GROUPS.map(group => <div key={group.title[0]} className={styles.group}>
          <h3>{group.title[lang]}</h3>
          <ul>{group.areas.map(area => <li key={area.name[0]}><span aria-hidden="true"><area.icon size={16} /></span><div><b>{area.name[lang]}</b><small>{area.note[lang]}</small></div></li>)}</ul>
        </div>)}
      </div>
    </div>
  </div></section>;
}
