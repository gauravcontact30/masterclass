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
import { activeSale } from "@/lib/server/festive-sale";
import { officialTechDocs, previewTechDocs } from "@/lib/server/official-tech-docs";
import { organizationSchema, pageMetadata, websiteSchema } from "@/lib/seo";
import { contentOverrides } from "@/lib/server/content-overrides";
import { blogTeasers } from "@/lib/coffee-and-code";
import { previewWorkflows } from "@/lib/landing-workflows-preview";
import { LandingFeatures } from "@/components/landing-features";
import { LandingCertifications } from "@/components/landing-certifications";
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
  // A festive sale in force (lib/server/festive-sale.ts) rides along in rupees; the client hides it at its end time.
  // Independent reads share the cold-render critical path.
  const [festive, docs, overrides, fresh] = await Promise.all([activeSale().catch(() => null), officialTechDocs(), contentOverrides(), landingFresh(today)]);
  const sale = festive && { slug: festive.slug, title: festive.title, titleHi: festive.titleHi, percent: festive.percent, endsAt: festive.endsAt,
    monthly: festive.plans.monthly?.inr ?? null, yearly: festive.plans.yearly?.inr ?? null, inr: { monthly: festive.plans.monthly?.inr ?? null, yearly: festive.plans.yearly?.inr ?? null } };
  const prices = { monthly: Number(process.env.PRO_MONTHLY_PRICE_INR ?? 299), yearly: Number(process.env.PRO_YEARLY_PRICE_INR ?? 2999), enabled: billingConfigured(), currency: "INR" as const, international: internationalBilling(), sale };
  // Super Admin content edits apply to the landing previews too; a save expires both this page and the overrides.
  // Today's AI-written additions (lib/server/landing-fresh.ts); the nightly job publishes them with revalidateTag("landing").
  return <><JsonLd data={[websiteSchema(), organizationSchema({ monthly:sale?.monthly ?? prices.monthly, yearly:sale?.yearly ?? prices.yearly, endsAt:sale?.endsAt })]} /><LandingPage features={features} certifications={<LandingCertifications />} workflows={previewWorkflows(overrides)} copyrightYear={new Date().getFullYear()} pro={pro} library={previewLibrary(landingLibrary(pro), today)} prices={prices} daily={daily} techDocs={previewTechDocs(docs, featuredDoc)} featuredDoc={featuredDoc} fresh={fresh} today={today} overrides={overrides} coffee={blogTeasers(8, today)} /></>;
}
