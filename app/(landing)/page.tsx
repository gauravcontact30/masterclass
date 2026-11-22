import { cacheLife, cacheTag } from "next/cache";
import { LandingPage } from "@/components/landing-page";
import { JsonLd } from "@/components/json-ld";
import { landingLibrary, previewLibrary } from "@/lib/landing-library";
import { landingProPreview } from "@/lib/landing-pro-preview";
import { istWeek, landingDaily } from "@/lib/server/landing-daily";
import { landingFresh } from "@/lib/server/landing-fresh";
import { pickDaily } from "@/lib/daily-rotation";
import { LANDING_TECH_DOC_IDS, TECH_DOCS } from "@/lib/tech-docs";
import { billingConfigured } from "@/lib/server/config";
import { internationalBilling } from "@/lib/server/pricing";
import { officialTechDocs, previewTechDocs } from "@/lib/server/official-tech-docs";
import { organizationSchema, pageMetadata, siteUrl, webPageSchema, websiteSchema } from "@/lib/seo";
import { weekStartDate } from "@/lib/ist-week";
import { contentOverrides } from "@/lib/server/content-overrides";
import { blogTeasers } from "@/lib/coffee-and-code";
import { landingBuzz, landingBuzzTopics } from "@/lib/server/landing-buzz";
import { previewWorkflows } from "@/lib/landing-workflows-preview";
import { LandingFeatures } from "@/components/landing-features";
import { LandingCertifications } from "@/components/landing-certifications";
import { LandingAnswers } from "@/components/landing-answers";
import { LandingTechBuzz } from "@/components/landing-tech-buzz";
export const metadata = pageMetadata("/");
/** The pulse and Word power previews show three cards each (PREVIEW_COUNT in components/landing-ai-pulse.tsx). */
const DAILY_PREVIEW = 3;
// The AI pulse and Word power carousels change every Monday at 00:00 IST, and so does what the other sections lead
// with (lib/daily-rotation.ts, fed the week number). The page is cached with an hourly lifetime, so the new week is
// picked up within the hour; revalidateTag("landing") publishes a change at once.
export default async function Home() {
  "use cache";
  cacheLife("hours");
  cacheTag("landing");
  // Refreshed chunk hashes for client dynamic imports
  // The week number (lib/ist-week.ts): every rotating section moves on one step a week.
  const today = istWeek();
  const pro = landingProPreview(today);
  // Technology docs previews one of TanStack Start, Zustand and n8n a day; the CS fundamentals stay listed under it.
  const featuredDoc = pickDaily(TECH_DOCS.filter(tech => (LANDING_TECH_DOC_IDS as readonly string[]).includes(tech.id)), today).id;
  // The same values /api/billing returns, rendered into the page instead of fetched after hydration.
  // Only the previewed cards go into the page payload (the full day's set was ~170 KB of RSC data); the totals feed
  // the "See all N" links, and /learning reads the full set itself.
  const day = landingDaily();
  const daily = { ...day, pulse: day.pulse.slice(0, DAILY_PREVIEW), words: day.words.slice(0, DAILY_PREVIEW), totals: { pulse: day.pulse.length, words: day.words.length } };
  // Sections with nothing to keep in state are rendered here, as server components: the browser shows their HTML
  // without re-rendering ~900 elements of copy and carousel cards on load (only the carousel controls and Listen
  // buttons hydrate). The client page places them. English, the only language offered (lib/i18n.ts).
  const latest = daily.pulse[0];
  const features = <LandingFeatures latest={latest ? { title: latest.title, text: latest.definition, image: latest.image, day: daily.day } : null} />;
  // Cached for everyone, so it is priced in rupees; with international billing on, the page re-prices itself for the visitor.
  // Independent reads share the cold-render critical path.
  // Tech Buzz stories (titles and links only) for the Tech Buzz section.
  const [docs, overrides, fresh, buzz, buzzTopics] = await Promise.all([officialTechDocs(), contentOverrides(), landingFresh(today), landingBuzz(), landingBuzzTopics()]);
  const prices = { monthly: Number(process.env.PRO_MONTHLY_PRICE_INR ?? 299), yearly: Number(process.env.PRO_YEARLY_PRICE_INR ?? 2999), enabled: billingConfigured(), currency: "INR" as const, international: internationalBilling() };
  // Super Admin content edits apply to the landing previews too; a save expires both this page and the overrides.
  // Today's AI-written additions (lib/server/landing-fresh.ts); the nightly job publishes them with revalidateTag("landing").
  // The page's content turns over every Monday at 00:00 IST, so that is when it last changed.
  const updated = weekStartDate(today);
  // Exam categories and their FAQs are India-only client content (components/landing-page.tsx), so the globally cached
  // HTML carries no structured data for them.
  return <><JsonLd data={[websiteSchema(), webPageSchema("/", updated), organizationSchema({ monthly:prices.monthly, yearly:prices.yearly })]} /><LandingPage features={features} answers={<LandingAnswers monthly={prices.monthly} yearly={prices.yearly} updated={updated} />} certifications={<LandingCertifications />} techBuzz={<LandingTechBuzz stories={buzz} topics={buzzTopics} week={today} />} workflows={previewWorkflows(overrides)} pro={pro} library={previewLibrary(landingLibrary(pro), today)} prices={prices} daily={daily} techDocs={previewTechDocs(docs, featuredDoc)} featuredDoc={featuredDoc} fresh={fresh} today={today} overrides={overrides} coffee={blogTeasers(8, today)} /></>;
}
