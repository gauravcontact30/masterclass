import { JsonLd } from "@/components/json-ld";
import { PageAnswers } from "@/components/page-answers";
import { StreamsHub } from "@/components/streams-hub";
import { HUB_ANSWERS } from "@/lib/page-answers";
import { pageMetadata, siteName, siteUrl } from "@/lib/seo";
import styles from "./page.module.css";
import { QUALITY_NAME, playlist, playlistQuality, streamTotals, techInfo, techNames, techsIn } from "@/lib/streams";

export const metadata = pageMetadata("/streams");

/** MCB Streams (user request 2026-11-26): every step-by-step playlist, by category. Static: the playlist a link names
 *  (?playlist=) opens in the browser, and exam categories appear only with exam access (components/streams-hub.tsx). */
export default function StreamsPage() {
  const origin = siteUrl().href; const url = new URL("/streams", origin).href;
  // Structured data and answers name only the playlists shown to everyone that have steps today (exam playlists are
  // shown by region, so they are left out here), so search and answer engines never read about an empty playlist.
  const shared = techsIn(["tech", "ielts"]);
  const totals = streamTotals(shared);
  const answers = { ...HUB_ANSWERS["/streams"], faqs: HUB_ANSWERS["/streams"].faqs.map(item => item.question.startsWith("Which technologies")
    ? { ...item, answer: `There are ${shared.length} playlists with ${totals.lessons} steps: ${techNames("and", shared)}. New steps are added as each one is checked.` } : item) };
  const provider = { "@type": "Organization", name: siteName, url: origin };
  return <div data-full-width="true">
    <JsonLd data={[
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: origin }, { "@type": "ListItem", position: 2, name: "MCB Streams", item: url }] },
      { "@context": "https://schema.org", "@type": "CollectionPage", name: "MCB Streams", url, inLanguage: "en", description: `Step-by-step video playlists in Full HD and 4K: ${techNames("and", shared)}.`, publisher: provider },
      { "@context": "https://schema.org", "@type": "ItemList", name: "MCB Streams playlists", numberOfItems: shared.length,
        itemListElement: shared.map((id, i) => { const info = techInfo(id), list = playlist(id); return { "@type": "ListItem", position: i + 1, item: {
          "@type": "Course", name: info.playlist, description: info.tagline, url: `${url}?playlist=${id}`, provider, inLanguage: "en",
          hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${Math.max(1, Math.round(list.seconds / 3600))}H` },
          about: info.name, keywords: `${info.name}, ${info.name} video course, ${info.name} tutorial, ${QUALITY_NAME[playlistQuality(id)]}`,
        } }; }) },
    ]} />
    <StreamsHub />
    <div className={styles.answers}><PageAnswers answers={answers} /></div>
  </div>;
}
