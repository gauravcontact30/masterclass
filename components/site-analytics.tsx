"use client";
import Script from "next/script";
import { useReportWebVitals } from "next/web-vitals";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const valid = (id: string | undefined, pattern: RegExp) => !!id && pattern.test(id);
const gaOn = valid(GA_ID, /^G-[A-Z0-9]{4,16}$/);
const gtmOn = valid(GTM_ID, /^GTM-[A-Z0-9]{4,12}$/);

type Gtag = (...args: unknown[]) => void;

/**
 * Analytics and real-user Core Web Vitals, both opt-in through environment variables:
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID (G-…): Google Analytics 4, plus LCP/INP/CLS/FCP/TTFB sent as GA4 events.
 * - NEXT_PUBLIC_GTM_ID (GTM-…): Google Tag Manager.
 * Scripts load with `lazyOnload` (browser idle time), so they never compete with the page's LCP or first input.
 * With neither set, this renders nothing and loads nothing.
 */
export function SiteAnalytics() {
  useReportWebVitals(metric => {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    if (!gtag) return;
    // GA4 recommended shape: integers (CLS ×1000), with the metric id so values can be de-duplicated.
    gtag("event", metric.name, { value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value), metric_id: metric.id, metric_value: metric.value, metric_delta: metric.delta, metric_rating: metric.rating, non_interaction: true });
  });
  if (!gaOn && !gtmOn) return null;
  return <>
    {gaOn && <>
      <Script id="ga4" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
      <Script id="ga4-init" strategy="lazyOnload">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}</Script>
    </>}
    {gtmOn && <Script id="gtm" strategy="lazyOnload">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}</Script>}
  </>;
}
