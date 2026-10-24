import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/app-providers";
import { ExclusiveAccordions } from "@/components/exclusive-accordions";
import { StudentChatbot } from "@/components/student-chatbot";
import { VisitTracker } from "@/components/visit-tracker";
import { ClientMonitor } from "@/components/client-monitor";
import { SiteAnalytics } from "@/components/site-analytics";
import { BackToTop } from "@/components/back-to-top";
import { HashlessNavigation } from "@/components/hashless-navigation";
import { NavigationProgress } from "@/components/navigation-progress";
import { AudioDockHost } from "@/components/audio-dock-host";
import "./globals.css";
import { isIndexable, siteDescription, siteKeywords, siteName, siteTitle, siteUrl } from "@/lib/seo";
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: siteTitle, template: `%s | ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
  keywords: siteKeywords,
  authors: [{ name: siteName, url: "/about" }],
  creator: siteName,
  publisher: siteName,
  category: "education",
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: isIndexable(), follow: true, googleBot: { index: isIndexable(), follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  // Fallbacks for any route that doesn't define its own; public pages override with full sets.
  openGraph: { type: "website", siteName, title: siteTitle, description: siteDescription, locale: "en_IN", alternateLocale: ["hi_IN"], images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", title: siteTitle, description: siteDescription, images: ["/opengraph-image"] },
  appleWebApp: { capable: true, title: siteName, statusBarStyle: "default" },
  // Search-console ownership tags, each emitted only when its environment variable is set.
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined, yandex: process.env.YANDEX_VERIFICATION || undefined, other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f5f4ed", colorScheme: "light" };
export default function RootLayout({ children }: {children: React.ReactNode}) {
  // Extensions (password managers, colour pickers, grammar tools) add their own
  // attributes to <body> before React hydrates, which React then reports as a
  // mismatch the reader can do nothing about. Suppressing it here covers this
  // element's own attributes only — a real mismatch inside the tree still warns.
  return <html lang="en-IN" className="h-full antialiased"><body className="min-h-full" suppressHydrationWarning><AppProviders>{children}{/* Both read the URL, so each streams in its own boundary instead of blocking the prerendered shell. */}<Suspense fallback={null}><StudentChatbot /></Suspense><Suspense fallback={null}><VisitTracker /></Suspense><Suspense fallback={null}><ClientMonitor /></Suspense><Suspense fallback={null}><BackToTop /></Suspense><Suspense fallback={null}><HashlessNavigation /></Suspense><Suspense fallback={null}><NavigationProgress /></Suspense><ExclusiveAccordions /><AudioDockHost /></AppProviders><SiteAnalytics /></body></html>;
}
