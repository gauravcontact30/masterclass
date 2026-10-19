"use client";
import Script from "next/script";
import { useReportWebVitals } from "next/web-vitals";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const valid = (id: string | undefined, pattern: RegExp) => !!id && pattern.test(id);
const gaOn = valid(GA_ID, /^G-[A-Z0-9]{4,16}$/);
const gtmOn = valid(GTM_ID, /^GTM-[A-Z0-9]{4,12}$/);

type Gtag = (...args: unknown[]) => void;
type Vital = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];
// A stable callback avoids duplicate subscriptions on rerender. Keep early
// measurements until lazyOnload installs gtag instead of silently losing them.
const pending = new Map<string, Vital>();
function reportVital(metric: Vital) {
  if (!gaOn) return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (!gtag) { pending.set(metric.id, metric); return; }
  gtag("event", metric.name, { value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value), metric_id: metric.id, metric_value: metric.value, metric_delta: metric.delta, metric_rating: metric.rating, non_interaction: true });
}
function flushVitals() {
  pending.forEach(reportVital);
  pending.clear();
}

/**
 * Analytics and real-user Core Web Vitals, both opt-in through environment variables:
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID (G-…): Google Analytics 4, plus LCP/INP/CLS/FCP/TTFB sent as GA4 events.
 * - NEXT_PUBLIC_GTM_ID (GTM-…): Google Tag Manager.
 * Scripts load with `lazyOnload` (browser idle time), so they never compete with the page's LCP or first input.
 * With neither set, this renders nothing and loads nothing.
 */
export function SiteAnalytics() {
  useReportWebVitals(reportVital);
  if (!gaOn && !gtmOn) return null;
  return <>
    {gaOn && <>
      <Script id="ga4" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
      <Script id="ga4-init" strategy="lazyOnload" onReady={flushVitals}>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}</Script>
    </>}
    {gtmOn && <Script id="gtm" strategy="lazyOnload">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}</Script>}
  </>;
}
