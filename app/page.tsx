import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { landingProPreview } from "@/lib/landing-pro-preview";
import { siteDescription, siteTitle, websiteSchema } from "@/lib/seo";
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: "MasterClass", title: siteTitle, description: siteDescription, locale: "en_IN", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteTitle }] },
  twitter: { card: "summary_large_image", title: siteTitle, description: siteDescription, images: ["/opengraph-image"] },
};
export default function Home() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()).replace(/</g, "\\u003c") }} /><LandingPage pro={landingProPreview()} /></>;
}
