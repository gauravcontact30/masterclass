import { cacheLife, cacheTag } from "next/cache";
import { LandingPage } from "@/components/landing-page";
import { JsonLd } from "@/components/json-ld";
import { landingLibrary, previewLibrary } from "@/lib/landing-library";
import { landingProPreview } from "@/lib/landing-pro-preview";
import { istDay, landingDaily } from "@/lib/server/landing-daily";
import { pickDaily } from "@/lib/daily-rotation";
import { TECH_DOCS } from "@/lib/tech-docs";
import { billingConfigured } from "@/lib/server/config";
import { internationalBilling } from "@/lib/server/pricing";
import { officialTechDocs, previewTechDocs } from "@/lib/server/official-tech-docs";
import { organizationSchema, pageMetadata, websiteSchema } from "@/lib/seo";
import { contentOverrides } from "@/lib/server/content-overrides";
import { blogTeasers } from "@/lib/coffee-and-code";
export const metadata = pageMetadata("/");
/** The pulse and Word power previews show three cards each (PREVIEW_COUNT in components/landing-ai-pulse.tsx). */
const DAILY_PREVIEW = 3;
// The AI pulse and Word power carousels change at midnight IST, and so does what the other sections lead with
// (lib/daily-rotation.ts). The page is cached with an hourly lifetime, so the new day is picked up within the hour;
// revalidateTag("landing") publishes a change at once.
export default async function Home() {
  "use cache";
  cacheLife("hours");
  cacheTag("landing");
  const today = istDay();
  const pro = landingProPreview(today);
  // Technology docs previews one platform a day; the CS fundamentals stay listed under it.
  const featuredDoc = pickDaily(TECH_DOCS.filter(tech => tech.category !== "fundamentals"), today).id;
  // The same values /api/billing returns, rendered into the page instead of fetched after hydration.
  // Only the previewed cards go into the page payload (the full day's set was ~170 KB of RSC data); the totals feed
  // the "See all N" links, and /dashboard reads the full set itself.
  const day = landingDaily();
  const daily = { ...day, pulse: day.pulse.slice(0, DAILY_PREVIEW), words: day.words.slice(0, DAILY_PREVIEW), totals: { pulse: day.pulse.length, words: day.words.length } };
  // Cached for everyone, so it is priced in rupees; with international billing on, the page re-prices itself for the visitor.
  const prices = { monthly: Number(process.env.PRO_MONTHLY_PRICE_INR ?? 299), yearly: Number(process.env.PRO_YEARLY_PRICE_INR ?? 2999), enabled: billingConfigured(), currency: "INR" as const, international: internationalBilling() };
  // Super Admin content edits apply to the landing previews too; a save expires both this page and the overrides.
  const [docs, overrides] = await Promise.all([officialTechDocs(), contentOverrides()]);
  return <><JsonLd data={[websiteSchema(), organizationSchema()]} /><LandingPage copyrightYear={new Date().getFullYear()} pro={pro} library={previewLibrary(landingLibrary(pro), today)} prices={prices} daily={daily} techDocs={previewTechDocs(docs, featuredDoc)} featuredDoc={featuredDoc} today={today} overrides={overrides} coffee={blogTeasers(8, today)} /></>;
}
