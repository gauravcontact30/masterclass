"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ChevronLeft, ChevronRight, Clock3, Compass, GraduationCap, Languages, Pause, Play, ShieldCheck, Sparkles, Timer, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { useLanguage } from "./language-provider";
import type { LandingPrices } from "./landing-page";
import styles from "./welcome-modal.module.css";

const SLIDE_MS = 5000;
type Pair = [string, string];
type Slide = { src: string; focus: string; icon: LucideIcon; tone: string; title: Pair; text: Pair; points: Pair[] };
const SLIDES: Slide[] = [
  { src: "/images/landing/slide-classroom.webp", focus: "30% 45%", icon: GraduationCap, tone: "clay",
    title: ["Every subject, one library", "हर विषय, एक लाइब्रेरी"],
    text: ["School, competitive exams and technology courses, written as clear lessons you can finish.", "स्कूल, प्रतियोगी परीक्षाएँ और तकनीक: स्पष्ट पाठ जिन्हें आप पूरा कर सकें।"],
    points: [["Structured lessons", "क्रमबद्ध पाठ"], ["Diagrams and examples", "चित्र और उदाहरण"]] },
  { src: "/images/landing/slide-exams.webp", focus: "48% 40%", icon: Timer, tone: "sage",
    title: ["Practice like the real paper", "असली परीक्षा जैसा अभ्यास"],
    text: ["Timed tests with objective and subjective questions, full solutions and answer review.", "वस्तुनिष्ठ व विषयनिष्ठ प्रश्नों के समयबद्ध टेस्ट, पूरे हल और उत्तर समीक्षा।"],
    points: [["Timed practice", "समयबद्ध अभ्यास"], ["Worked solutions", "हल सहित"]] },
  { src: "/images/landing/slide-interview.webp", focus: "55% 40%", icon: Compass, tone: "violet",
    title: ["Interview-ready, topic by topic", "इंटरव्यू की तैयारी, विषयवार"],
    text: ["Interview questions, tech comparisons and real-world workflows for developers and analysts.", "डेवलपर और विश्लेषकों के लिए इंटरव्यू प्रश्न, तकनीकी तुलना और वास्तविक वर्कफ़्लो।"],
    points: [["Tech Topics", "टेक टॉपिक्स"], ["Workflow prep", "वर्कफ़्लो तैयारी"]] },
  { src: "/images/landing/path-tech.webp", focus: "50% 45%", icon: BookOpenCheck, tone: "sky",
    title: ["Official docs, explained", "आधिकारिक डॉक्स, सरल भाषा में"],
    text: ["API docs, code labs and step-by-step guides that follow the latest framework releases.", "API डॉक्स, कोड लैब और चरण-दर-चरण गाइड, नवीनतम संस्करणों के साथ।"],
    points: [["Code labs", "कोड लैब"], ["Step-by-step", "चरण-दर-चरण"]] },
  { src: "/images/landing/slide-onthego.webp", focus: "68% 40%", icon: Languages, tone: "honey",
    title: ["Learn anywhere, in two languages", "कहीं भी, दो भाषाओं में"],
    text: ["Switch between English and हिन्दी any time; bookmarks and revision notes keep your place.", "कभी भी English और हिन्दी बदलें; बुकमार्क और रिवीज़न नोट्स आपकी जगह याद रखते हैं।"],
    points: [["English / हिन्दी", "English / हिन्दी"], ["Bookmarks and notes", "बुकमार्क और नोट्स"]] },
];
const INCLUDES: Pair[] = [["Every course and category, one membership", "हर कोर्स और श्रेणी, एक सदस्यता"], ["Practice tests with solutions", "हल सहित अभ्यास परीक्षाएँ"], ["English and हिन्दी", "English और हिन्दी"]];

/** The first-visit welcome: a five-slide autoplay tour of the core features beside the free trial and the two plans. */
export default function WelcomeModalPanel({ open, onOpenChange, prices }: { open: boolean; onOpenChange: (open: boolean) => void; prices: LandingPrices | null }) {
  const { language } = useLanguage(); const hi = language === "hi"; const say = (pair: Pair) => pair[hi ? 1 : 0];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  const running = open && !paused && !hold;
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setIndex(i => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [running, index]);
  // Reduced motion: start paused; the learner can still play or step through.
  useEffect(() => { if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setPaused(true); }, []);
  const go = (step: number) => setIndex(i => (i + step + SLIDES.length) % SLIDES.length);
  const money = (amount: number) => new Intl.NumberFormat(hi ? "hi-IN" : "en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  const monthly = prices?.monthly ?? 299, yearly = prices?.yearly ?? 2999;
  const saving = Math.max(0, Math.round((1 - yearly / (monthly * 12)) * 100));
  const slide = SLIDES[index];
  const close = () => onOpenChange(false);

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={`${styles.popup} p-0 gap-0 sm:max-w-[960px]`}>
      <div className={styles.layout}>
        <section className={styles.tour} aria-roledescription="carousel" aria-label={hi ? "मुख्य सुविधाएँ" : "Core features"}
          onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
          {SLIDES.map((item, i) => <div key={item.src} className={styles.slide} data-active={i === index || undefined} aria-hidden="true">
            <Image src={item.src} alt="" fill sizes="(max-width: 760px) 100vw, 520px" className={styles.photo} style={{ objectPosition: item.focus }} preload={i === 0} />
          </div>)}
          <div className={styles.shade} aria-hidden="true" />
          <div className={styles.copy} key={index} data-tone={slide.tone} role="group" aria-roledescription="slide" aria-label={`${index + 1} / ${SLIDES.length}`} aria-live={running ? "off" : "polite"}>
            <span className={styles.badge}><slide.icon size={15} aria-hidden="true" />{`${index + 1} / ${SLIDES.length}`}</span>
            <h3>{say(slide.title)}</h3>
            <p>{say(slide.text)}</p>
            <ul>{slide.points.map(point => <li key={point[0]}><Sparkles size={12} aria-hidden="true" />{say(point)}</li>)}</ul>
          </div>
          <div className={styles.controls}>
            <button type="button" className={styles.round} onClick={() => go(-1)} aria-label={hi ? "पिछली स्लाइड" : "Previous slide"}><ChevronLeft size={16} aria-hidden="true" /></button>
            <div className={styles.dots}>
              {SLIDES.map((item, i) => <button key={item.src} type="button" aria-current={i === index || undefined} aria-label={say(item.title)} className={styles.dot} data-active={i === index || undefined} onClick={() => setIndex(i)}>
                {i === index && <i key={index} style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" }} />}
              </button>)}
            </div>
            <button type="button" className={styles.round} onClick={() => setPaused(p => !p)} aria-label={paused ? (hi ? "स्लाइड चलाएँ" : "Play slides") : (hi ? "स्लाइड रोकें" : "Pause slides")}>{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}</button>
            <button type="button" className={styles.round} onClick={() => go(1)} aria-label={hi ? "अगली स्लाइड" : "Next slide"}><ChevronRight size={16} aria-hidden="true" /></button>
          </div>
        </section>

        <section className={styles.offer}>
          <p className={styles.kicker}><Sparkles size={14} aria-hidden="true" />{hi ? "MasterClass में आपका स्वागत है" : "Welcome to MasterClass"}</p>
          <DialogTitle className={styles.title}>{hi ? <>सीखना शुरू करें, <em>आज निःशुल्क।</em></> : <>Start learning, <em>free for a day.</em></>}</DialogTitle>
          <DialogDescription className={styles.lede}>{hi ? "हर नए खाते को 24 घंटे की पूरी पहुँच मिलती है: हर पाठ, अभ्यास परीक्षा और टूल। कोई कार्ड नहीं चाहिए।" : "Every new account gets 24 hours of full access: every lesson, practice paper and tool. No card needed."}</DialogDescription>

          <div className={styles.trial}>
            <Clock3 size={18} aria-hidden="true" />
            <div><strong>{hi ? "1-दिन का निःशुल्क ट्रायल" : "1-day free trial"}</strong><span>{hi ? "पहले साइन-इन से शुरू · फिर कोई प्लान चुनें" : "Starts at your first sign-in · then pick a plan"}</span></div>
          </div>

          <div className={styles.plans} role="radiogroup" aria-label={hi ? "प्लान" : "Plans"}>
            {(["monthly", "yearly"] as const).map(value => <button key={value} type="button" role="radio" aria-checked={cycle === value} className={styles.plan} onClick={() => setCycle(value)}>
              <span className={styles.planName}>{value === "monthly" ? (hi ? "मासिक" : "Monthly") : (hi ? "वार्षिक" : "Yearly")}{value === "yearly" && saving > 0 && <b>{hi ? `${saving}% बचत` : `Save ${saving}%`}</b>}</span>
              <span className={styles.planPrice}>{money(value === "monthly" ? monthly : yearly)}<small>{value === "monthly" ? (hi ? "/ माह" : "/ month") : (hi ? "/ वर्ष" : "/ year")}</small></span>
              <span className={styles.planNote}>{value === "yearly" ? (hi ? `${money(yearly / 12)}/माह के बराबर` : `${money(yearly / 12)}/month equivalent`) : (hi ? "कभी भी रद्द करें" : "Cancel any time")}</span>
            </button>)}
          </div>
          <ul className={styles.includes}>{INCLUDES.map(item => <li key={item[0]}><ShieldCheck size={14} aria-hidden="true" />{say(item)}</li>)}</ul>

          <div className={styles.actions}>
            <Link href="/sign-up" className={styles.primary} onClick={close}>{hi ? "निःशुल्क ट्रायल शुरू करें" : "Start free trial"}<ArrowRight size={16} aria-hidden="true" /></Link>
            <Link href={`/subscribe?plan=${cycle}`} className={styles.secondary} onClick={close}>{hi ? "अभी सदस्यता लें" : "Subscribe now"}</Link>
          </div>
          <button type="button" className={styles.later} onClick={close}>{hi ? "बाद में, अभी बस देख रहे हैं" : "Maybe later, just browsing"}</button>
        </section>
      </div>
    </DialogContent>
  </Dialog>;
}
