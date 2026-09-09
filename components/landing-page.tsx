"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Fraunces, Mukta } from "next/font/google";
import { ArrowUpRight, Check } from "lucide-react";
import { requestJson } from "@/lib/client";
import { useLanguage } from "./language-provider";
import { Carousel } from "./carousel";
import { Wordmark } from "./brand-mark";
import { GuideStack } from "./guide-stack";
import { HeroArt } from "./hero-art";
import { SampleLessons } from "./sample-lessons";
import { buttonVariants } from "./ui/button";

// Fraunces carries the display voice; Mukta is the working face. Mukta is here
// for a reason beyond taste: it covers Devanagari as well as Latin, so the page
// keeps one typographic personality when a visitor switches to हिन्दी.
const fraunces = Fraunces({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--font-display" });
const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: ["300", "400", "600"], variable: "--font-body" });

type Prices = { monthly: number; yearly: number; freeLimit: number; proLimit: number; perDownload: number };
const DEFAULT_PRICES: Prices = { monthly: 299, yearly: 2999, freeLimit: 3, proLimit: 50, perDownload: 49 };

// Full-bleed band under the header: four campus locations, one per scene.
// These are drawn scenes (see hero-art.tsx), deliberately not photographs — to
// swap in real photos later, replace HeroArt here with next/image and keep the
// captions, which is the only place the slider knows about its artwork.
const CAMPUS = [
  { id: "library", scene: "library", caption: "landingCampus1" },
  { id: "lawn", scene: "lawn", caption: "landingCampus2" },
  { id: "lab", scene: "lab", caption: "landingCampus3" },
  { id: "steps", scene: "steps", caption: "landingCampus4" },
] as const;

// Genuinely a sequence, which is what earns these the numbers. The campus band
// above carries the imagery, so these stay typographic rather than repeating it.
const STEPS = [
  { id: "choose", title: "landingStep1Title", body: "landingStep1Body" },
  { id: "write", title: "landingStep2Title", body: "landingStep2Body" },
  { id: "read", title: "landingStep3Title", body: "landingStep3Body" },
] as const;

// Placeholder reviews: illustrated avatars and invented quotes. Do NOT pair
// these quotes with photographs of real students — that would attribute words to
// people who never said them. To use real reviews, replace the quote and name
// keys together with the photo, and only for reviewers who gave their consent.
const TESTIMONIALS = [
  { quote: "landingTestimonial1", name: "landingTestimonialName1", avatar: "/images/avatar-1.webp" },
  { quote: "landingTestimonial2", name: "landingTestimonialName2", avatar: "/images/avatar-2.webp" },
  { quote: "landingTestimonial3", name: "landingTestimonialName3", avatar: "/images/avatar-3.webp" },
  { quote: "landingTestimonial4", name: "landingTestimonialName4", initials: "KM" },
  { quote: "landingTestimonial5", name: "landingTestimonialName5", initials: "MK" },
  { quote: "landingTestimonial6", name: "landingTestimonialName6", initials: "DP" },
] as const;

export function LandingPage() {
  const { t, language, setLanguage } = useLanguage();
  const [prices, setPrices] = useState<Prices>(DEFAULT_PRICES);
  useEffect(() => { void requestJson<Prices>("/api/billing").then(setPrices).catch(() => {}); }, []);
  const money = (amount: number) => new Intl.NumberFormat(language === "hi" ? "hi-IN" : "en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const campusSlides = CAMPUS.map(place => ({
    id: place.id,
    content: (
      <figure className="campus-slide">
        <HeroArt scene={place.scene} className="campus-image" />
        <figcaption>{t(place.caption)}</figcaption>
      </figure>
    ),
  }));
  const testimonialSlides = TESTIMONIALS.map(item => ({
    id: item.quote,
    content: (
      <div className="landing-testimonial-card">
        {"avatar" in item ? (
          <Image src={item.avatar} alt="" width={72} height={72} className="testimonial-avatar" />
        ) : (
          <span className="testimonial-avatar testimonial-initials">{item.initials}</span>
        )}
        <blockquote className="landing-testimonial">{t(item.quote)}</blockquote>
        <p className="testimonial-name">{t(item.name)}</p>
      </div>
    ),
  }));
  const featureCards = [
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
    <div className={`landing-page ${fraunces.variable} ${mukta.variable}`}>
      <header className="landing-nav">
        <Link href="/" className="wordmark"><Wordmark /></Link>
        <div className="landing-nav-actions">
          <label className="language-control"><span className="sr-only">{t("language")}</span>
            {/* persist=false: public visitors have no account row to write the preference to. */}
            <select aria-label={t("language")} value={language} onChange={e => setLanguage(e.target.value as "en" | "hi", false)}>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>
          <Link href="/sign-in" className="signin-link">{t("signin")}</Link>
          <Link href="/sign-up" className={buttonVariants({ variant: "default" })}>{t("signup")}</Link>
        </div>
      </header>

      <section className="landing-campus">
        <Carousel slides={campusSlides} intervalMs={5000} ariaLabel={t("landingCampusAriaLabel")} className="landing-campus-carousel" />
        <p className="landing-campus-note">{t("landingCampusNote")}</p>
      </section>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <h1>{t("landingHeroTitle")}</h1>
          <p className="landing-hero-body">{t("landingHeroBody")}</p>
          <div className="landing-hero-actions">
            <Link href="/sign-up" className={buttonVariants({ variant: "default" })}>{t("signup")}<ArrowUpRight size={17} /></Link>
            <a href="#sample" className="landing-hero-sample">{t("landingHeroSample")}</a>
          </div>
          <p className="landing-hero-note">{t("landingHeroNote")}</p>
        </div>
        <GuideStack label={t("landingGuideStackLabel")} />
      </section>

      <section className="landing-steps">
        <h2>{t("landingStepsTitle")}</h2>
        <ol className="landing-step-list">
          {STEPS.map((step, index) => (
            <li key={step.id} className="landing-step">
              <span className="landing-step-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div className="landing-step-text">
                <h3>{t(step.title)}</h3>
                <p>{t(step.body)}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="landing-catalog-note">{t("landingCatalogNote")}</p>
      </section>

      <section className="landing-features">
        <h2>{t("landingFeaturesTitle")}</h2>
        <div className="landing-feature-grid">
          {featureCards.map((card, i) => <article className={i === 0 ? "panel feature-lead" : "panel"} key={card.title}><h3>{card.title}</h3><p>{card.body}</p></article>)}
        </div>
      </section>

      <section className="landing-sample" id="sample">
        <div className="landing-sample-inner"><SampleLessons /></div>
      </section>

      <section className="landing-testimonials">
        <h2>{t("landingTestimonialsTitle")}</h2>
        <Carousel slides={testimonialSlides} intervalMs={6000} ariaLabel={t("landingTestimonialsAriaLabel")} className="landing-testimonials-carousel" />
      </section>

      <section className="landing-pricing">
        <h2>{t("landingPricingTitle")}</h2>
        <div className="pricing-grid">
          {pricingCards.map(card => (
            <article key={card.tier} className={`panel pricing-card ${card.tier === "yearly" ? "featured" : ""}`}>
              <span className="pricing-tier">{t(card.tier)}</span>
              <h3 className="pricing-amount">{money(card.amount)}</h3>
              {card.per && <p className="pricing-per">{card.per}</p>}
              <ul>
                <li><Check size={17} />{card.limit} {card.tier === "perDownload" ? t("downloadWord") : t("generations")}</li>
                <li><Check size={17} />PDF and PowerPoint</li>
                <li><Check size={17} />English and हिन्दी</li>
              </ul>
              {card.cta && <Link href="/sign-up" className={buttonVariants({ variant: "default" })}>{t("subscribe")}</Link>}
            </article>
          ))}
        </div>
      </section>

      <section className="landing-closing">
        <h2>{t("landingClosingTitle")}</h2>
        <p>{t("landingClosingBody")}</p>
        <Link href="/sign-up" className={buttonVariants({ variant: "default" })}>{t("signup")}<ArrowUpRight size={17} /></Link>
      </section>

      <footer className="landing-footer"><span className="wordmark"><Wordmark /></span><span>{t("brandLine")}</span></footer>
    </div>
  );
}
