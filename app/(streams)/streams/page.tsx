import { JsonLd } from "@/components/json-ld";
import { StreamsHub } from "@/components/streams-hub";
import { pageMetadata, siteName, siteUrl } from "@/lib/seo";

export const metadata = pageMetadata("/streams");

/** MCB Streams (user request 2026-11-26): every step-by-step playlist, by category. Static: the playlist a link names
 *  (?playlist=) opens in the browser, and exam categories appear only with exam access (components/streams-hub.tsx). */
export default function StreamsPage() {
  const origin = siteUrl().href; const url = new URL("/streams", origin).href;
  return <div data-full-width="true">
    <JsonLd data={[
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: origin }, { "@type": "ListItem", position: 2, name: "MCB Streams", item: url }] },
      { "@context": "https://schema.org", "@type": "CollectionPage", name: "MCB Streams", url, inLanguage: "en", publisher: { "@type": "Organization", name: siteName, url: origin } },
    ]} />
    <StreamsHub />
  </div>;
}
