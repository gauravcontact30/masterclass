"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { requestJson } from "@/lib/client";
import { useLanguage } from "./language-provider";
import { Carousel } from "./carousel";
import { SampleLessons } from "./sample-lessons";
import { buttonVariants } from "./ui/button";

type Prices = { monthly: number; yearly: number; freeLimit: number; proLimit: number; perDownload: number };
const DEFAULT_PRICES: Prices = { monthly: 299, yearly: 2999, freeLimit: 3, proLimit: 50, perDownload: 49 };
const TESTIMONIAL_KEYS = ["landingTestimonial1", "landingTestimonial2", "landingTestimonial3", "landingTestimonial4", "landingTestimonial5", "landingTestimonial6"] as const;

export function LandingPage() {
  const { t, language, setLanguage } = useLanguage();
  const [prices, setPrices] = useState<Prices>(DEFAULT_PRICES);
  useEffect(() => { void requestJson<Prices>("/api/billing").then(setPrices).catch(() => {}); }, []);
  const money = (amount: number) => new Intl.NumberFormat(language === "hi" ? "hi-IN" : "en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const heroSlides = [
    { id: "generate", content: <div className="landing-slide"><h3>{t("landingHeroTitle1")}</h3><p>{t("landingHeroBody1")}</p></div> },
    { id: "learn", content: <div className="landing-slide"><h3>{t("landingHeroTitle2")}</h3><p>{t("landingHeroBody2")}</p></div> },
    { id: "themes", content: <div className="landing-slide"><h3>{t("landingHeroTitle3")}</h3><p>{t("landingHeroBody3")}</p></div> },
    { id: "design", content: <div className="landing-slide"><h3>{t("landingHeroTitle4")}</h3><p>{t("landingHeroBody4")}</p></div> },
  ];
  const testimonialSlides = TESTIMONIAL_KEYS.map(key => ({ id: key, content: <blockquote className="landing-testimonial">{t(key)}</blockquote> }));
  const featureCards = [
    { title: t("landingHeroTitle1"), body: t("landingHeroBody1") },
    { title: t("landingHeroTitle2"), body: t("landingHeroBody2") },
    { title: t("landingHeroTitle3"), body: t("landingHeroBody3") },
    { title: t("landingHeroTitle4"), body: t("landingHeroBody4") },
    { title: t("landingFeatureLanguagesTitle"), body: t("landingFeatureLanguagesBody") },
    { title: t("landingFeaturePricingTitle"), body: t("landingFeaturePricingBody") },
  ];
  const pricingCards = [
    { tier: "free" as const, amount: 0, per: null, limit: prices.freeLimit, cta: false },
    { tier: "monthly" as const, amount: prices.monthly, per: t("perMonth"), limit: prices.proLimit, cta: true },
    { tier: "yearly" as const, amount: prices.yearly, per: t("perYear"), limit: prices.proLimit, cta: true },
    { tier: "perDownload" as const, amount: prices.perDownload, per: t("perFile"), limit: 1, cta: true },
  ];

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link href="/" className="wordmark">masterclass<span>✦</span></Link>
        <div className="landing-nav-actions">
          <label className="language-control"><span className="sr-only">{t("language")}</span>
            <select aria-label={t("language")} value={language} onChange={e => setLanguage(e.target.value as "en" | "hi")}>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>
          <Link href="/sign-in" className="signin-link">{t("signin")}<ArrowUpRight size={15} /></Link>
          <Link href="/sign-up" className={buttonVariants({ variant: "default" })}>{t("signup")}</Link>
        </div>
      </header>

      <section className="landing-hero">
        <Carousel slides={heroSlides} intervalMs={5000} ariaLabel={t("landingHeroAriaLabel")} className="landing-hero-carousel" />
      </section>

      <section className="landing-features">
        <h2>{t("landingFeaturesTitle")}</h2>
        <div className="landing-feature-grid">
          {featureCards.map(card => <article className="panel" key={card.title}><h3>{card.title}</h3><p>{card.body}</p></article>)}
        </div>
      </section>

      <SampleLessons />

      <section className="landing-testimonials">
        <h2>{t("landingTestimonialsTitle")}</h2>
        <Carousel slides={testimonialSlides} intervalMs={6000} ariaLabel={t("landingTestimonialsAriaLabel")} className="landing-testimonials-carousel" />
      </section>

      <section className="landing-pricing">
        <h2>{t("landingPricingTitle")}</h2>
        <div className="pricing-grid">
          {pricingCards.map(card => (
            <article key={card.tier} className={`panel pricing-card ${card.tier === "yearly" ? "featured" : ""}`}>
              <span className="eyebrow">{t(card.tier)}</span>
              <h2>{money(card.amount)}</h2>
              {card.per && <p>{card.per}</p>}
              <ul>
                <li><Check size={17} />{card.limit} {card.tier === "perDownload" ? t("download") : t("generations")}</li>
                <li><Check size={17} />PDF & PPTX</li>
                <li><Check size={17} />English & हिन्दी</li>
              </ul>
              {card.cta && <Link href="/sign-up" className={buttonVariants({ variant: "default" })}>{t("subscribe")}<ArrowUpRight size={16} /></Link>}
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer"><span>✦ MASTERCLASS</span><span>{t("brandLine")}</span></footer>
    </div>
  );
}
