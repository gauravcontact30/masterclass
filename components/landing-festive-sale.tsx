"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Gift, Sparkles } from "lucide-react";
import { formatPrice, salePrice, type Currency, type Cycle, type SaleInfo } from "@/lib/pricing";
import { useLanguage } from "./language-provider";
import styles from "./landing-festive-sale.module.css";

type Prices = { monthly: number; yearly: number; currency?: Currency; sale?: SaleInfo | null };
const pad = (value: number) => String(Math.max(0, value)).padStart(2, "0");

const FESTIVE_SLIDES = [
  {
    src: "/images/landing/diwali-sale-1.webp",
    altEn: "A young professional learning on her laptop beside a vibrant rangoli and glowing diyas on Diwali night, fireworks outside the window",
    altHi: "दिवाली की रात रंगोली और जलते दीयों के पास लैपटॉप पर सीखती एक युवा प्रोफ़ेशनल, खिड़की के बाहर आतिशबाज़ी",
  },
  {
    src: "/images/landing/diwali-sale-2.webp",
    altEn: "Two software engineers collaborating happily over a laptop on Diwali evening surrounded by warm lights and brass lamps",
    altHi: "दिवाली की शाम दीयों और रोशनी के बीच लैपटॉप पर मिलकर काम करते दो सॉफ़्टवेयर इंजीनियर",
  },
  {
    src: "/images/landing/diwali-sale-3.webp",
    altEn: "A software engineer coding on a modern workstation decorated with clay diyas and marigold flowers under a starry festive sky",
    altHi: "तारों भरी त्योहारी रात में मिट्टी के दीयों और गेंदे के फूलों से सजे आधुनिक वर्कस्टेशन पर कोडिंग करता सॉफ़्टवेयर इंजीनियर",
  },
  {
    src: "/images/landing/diwali-sale-4.webp",
    altEn: "An Indian developer smiling proudly with his laptop in a room glowing with Diwali lanterns and traditional lamps",
    altHi: "दिवाली के कंदील और पारंपरिक दीयों से जगमगाते कमरे में लैपटॉप के साथ गर्व से मुस्कुराता एक भारतीय डेवलपर",
  },
];
const AUTOPLAY_MS = 8000;

/** Days, hours, minutes and seconds to the sale's end; null before the first client tick (no hydration mismatch). */
function useCountdown(endsAt: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      setLeft(Math.max(0, Date.parse(endsAt) - Date.now()));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    const onVisibility = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [endsAt]);
  if (left == null) return null;
  const s = Math.floor(left / 1000);
  return { done: left === 0, days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60 };
}

/** The ticking clock. Kept apart from the section so each second re-renders these four numbers, not the fireworks,
 *  carousel and plans; it tells the section once the sale has ended. */
function SaleCountdown({ endsAt, ends, hi, onDone }: { endsAt: string; ends: string; hi: boolean; onDone: () => void }) {
  const clock = useCountdown(endsAt);
  const done = clock?.done ?? false;
  useEffect(() => { if (done) onDone(); }, [done, onDone]);
  const text = (en: string, hindi: string) => hi ? hindi : en;
  return <div className={styles.countdown} role="timer" aria-live="off" aria-label={text(`Offer ends ${ends} IST`, `ऑफ़र ${ends} IST पर समाप्त`)}>
    <span className={styles.countLabel}>{text("Offer ends in", "ऑफ़र समाप्त होने में")}</span>
    {([["days", text("days", "दिन")], ["hours", text("hrs", "घंटे")], ["minutes", text("min", "मिनट")], ["seconds", text("sec", "सेकंड")]] as const).map(([key, label]) =>
      <span key={key} className={styles.unit}><b>{clock ? pad(clock[key]) : "--"}</b><small>{label}</small></span>)}
  </div>;
}

/**
 * The festive sale on the landing page (Diwali 2026: 25% off the every payment of either plan). Shown only while a sale
 * is in force for at least one plan (lib/server/festive-sale.ts) and hidden in the browser the moment it ends. Its right-hand
 * side features a 4-image autoplay carousel (8s) of warm learning moments, surrounded by fireworks, flickering diyas and a turning rangoli.
 */
export function LandingFestiveSale({ prices }: { prices: Prices }) {
  const { language } = useLanguage(); const hi = language === "hi";
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const sale = prices.sale;
  const [ended, setEnded] = useState(false);
  const markEnded = useCallback(() => setEnded(true), []);
  const [slide, setSlide] = useState(0);
  const [held, setHeld] = useState(false);
  // The festive prices stay folded away until the visitor unwraps them (user request 2026-10-30).
  const [open, setOpen] = useState(false);
  const plansId = useId();
  // Carousel photos are fetched as they are first shown, not all four on page load.
  const [shown, setShown] = useState(() => new Set([0]));
  // The sky's sixty sparks, the diyas and the rangoli animate only while the section is on screen.
  const [live, setLive] = useState(false);
  const saleRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLElement>(null);

  if (!shown.has(slide)) setShown(new Set([...shown, slide]));

  useEffect(() => {
    const node = saleRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, [ended]);

  // Autoplay after 8 seconds, pausing on hover/focus or when tab is hidden
  useEffect(() => {
    if (held) return;
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      setSlide(curr => (curr + 1) % FESTIVE_SLIDES.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(interval);
  }, [held]);

  if (!sale || ended) return null;
  const cycles = (["yearly", "monthly"] as Cycle[]).filter(cycle => salePrice(sale, cycle) != null);
  if (!cycles.length) return null;
  const money = (amount: number) => formatPrice(amount, prices.currency ?? "INR", hi);
  const ends = new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(sale.endsAt));

  return <section ref={saleRef} id="festive-sale" className={styles.sale} data-live={live || undefined} aria-labelledby="festive-sale-title">
    <div className={styles.sky} aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => <span key={i} className={styles.burst} style={{ ["--i" as string]: i }}>{Array.from({ length: 12 }, (_, k) => <i key={k} style={{ ["--k" as string]: k }} />)}</span>)}
    </div>
    <div className={styles.inner}>
      <div className={styles.copy}>
        <p className={styles.kicker}><Sparkles size={15} aria-hidden="true" />{hi ? sale.titleHi : sale.title}</p>
        <h2 id="festive-sale-title">{text("Light up your career this Diwali.", "इस दिवाली अपने करियर को रोशन करें।")} <span>{text(`${sale.percent}% off every payment.`, `हर भुगतान पर ${sale.percent}% छूट।`)}</span></h2>
        <p className={styles.lede}>{text("Every course, AI agent workflow, certification path and interview bank, in one membership. Choose Monthly or Yearly and the festive discount comes off every payment.",
          "हर कोर्स, AI एजेंट वर्कफ़्लो, सर्टिफ़िकेशन पथ और इंटरव्यू बैंक, एक ही सदस्यता में। मासिक या वार्षिक चुनें और हर भुगतान पर त्योहारी छूट पाएँ, नवीनीकरण सहित।")}</p>
        <button type="button" className={styles.unwrap} aria-expanded={open} aria-controls={plansId} onClick={() => setOpen(value => !value)}>
          <span className={styles.unwrapIcon} aria-hidden="true"><Gift size={20} /></span>
          <span className={styles.unwrapText}>
            <b>{open ? text("Your Diwali prices", "आपकी दिवाली क़ीमतें") : text("Unwrap your Diwali price", "अपनी दिवाली क़ीमत खोलें")}</b>
            <small>{open ? text("Tap to fold them away", "छिपाने के लिए टैप करें") : text(`Monthly and Yearly, ${sale.percent}% off every payment`, `मासिक और वार्षिक, हर भुगतान पर ${sale.percent}% छूट`)}</small>
          </span>
          <ChevronDown className={styles.unwrapChevron} size={18} aria-hidden="true" />
        </button>
        <div id={plansId} className={styles.reveal} data-open={open || undefined} inert={!open}>
        <div className={styles.plans}>{cycles.map(cycle => <Link key={cycle} href={`/subscribe?plan=${cycle}`} className={styles.plan} data-cycle={cycle}>
          <span className={styles.planName}>{cycle === "yearly" ? text("Yearly", "वार्षिक") : text("Monthly", "मासिक")}<em>−{sale.percent}%</em></span>
          <span className={styles.planPrice}><s>{money(prices[cycle])}</s><b>{money(salePrice(sale, cycle)!)}</b></span>
          <span className={styles.planNote}>{cycle === "yearly" ? text("every year, including renewals", "हर वर्ष, नवीनीकरण सहित") : text("every month, including renewals", "हर माह, नवीनीकरण सहित")}</span>
          <span className={styles.planCta}>{text("Claim the offer", "ऑफ़र लें")}<ArrowRight size={15} aria-hidden="true" /></span>
        </Link>)}</div>
        </div>
        <SaleCountdown endsAt={sale.endsAt} ends={ends} hi={hi} onDone={markEnded} />
        <p className={styles.fine}>{text(`The ${sale.percent}% discount applies to every payment of a membership started during this sale, including renewals. Ends ${ends} IST.`, `इस सेल में शुरू की गई सदस्यता के हर भुगतान और नवीनीकरण पर ${sale.percent}% छूट। ${ends} IST पर समाप्त।`)}</p>
      </div>
      <figure
        ref={artRef}
        className={styles.art}
        aria-roledescription="carousel"
        aria-label={text("Diwali Festive Sale highlights", "दिवाली फ़ेस्टिव सेल झलकियाँ")}
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={event => { if (!artRef.current?.contains(event.relatedTarget as Node)) setHeld(false); }}
      >
        <div className={styles.slidesWrap}>
          {FESTIVE_SLIDES.map((item, i) => {
            const active = i === slide;
            return (
              <div
                key={item.src}
                className={styles.slide}
                data-active={active || undefined}
                aria-hidden={!active}
                inert={!active ? true : undefined}
              >
                {shown.has(i) && <Image
                  src={item.src}
                  alt={text(item.altEn, item.altHi)}
                  fill
                  sizes="(max-width: 900px) 100vw, 560px"
                  quality={85}
                  className={styles.photo}
                />}
              </div>
            );
          })}
        </div>

        <div className={styles.carouselControls} aria-label={text("Carousel navigation", "स्लाइड नेविगेशन")}>
          <button
            type="button"
            className={styles.carouselNav}
            onClick={() => setSlide(curr => (curr - 1 + FESTIVE_SLIDES.length) % FESTIVE_SLIDES.length)}
            aria-label={text("Previous slide", "पिछली स्लाइड")}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <div className={styles.carouselDots} role="tablist" aria-label={text("Slides", "स्लाइड्स")}>
            {FESTIVE_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === slide}
                aria-label={text(`Slide ${i + 1} of ${FESTIVE_SLIDES.length}`, `स्लाइड ${i + 1}/${FESTIVE_SLIDES.length}`)}
                className={styles.dot}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className={styles.carouselNav}
            onClick={() => setSlide(curr => (curr + 1) % FESTIVE_SLIDES.length)}
            aria-label={text("Next slide", "अगली स्लाइड")}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        <svg className={styles.rangoli} viewBox="0 0 200 200" aria-hidden="true" style={{ transformOrigin: "100px 100px", willChange: "transform" }}>
          {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx="100" cy="52" rx="13" ry="40" transform={`rotate(${i * 30} 100 100)`} fill={["#f59e0b", "#e11d48", "#f97316", "#a21caf"][i % 4]} opacity=".85" />)}
          {Array.from({ length: 8 }, (_, i) => <circle key={i} cx="100" cy="30" r="7" transform={`rotate(${i * 45 + 22.5} 100 100)`} fill="#fde68a" />)}
          <circle cx="100" cy="100" r="24" fill="#fff7ed" /><circle cx="100" cy="100" r="12" fill="#ea580c" />
        </svg>
        <div className={styles.diyas} aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <span key={i} className={styles.diya} style={{ ["--i" as string]: i }}><i /></span>)}</div>
      </figure>
    </div>
  </section>;
}
