import { cacheLife, cacheTag } from "next/cache";
import { LandingPage } from "@/components/landing-page";
import { JsonLd } from "@/components/json-ld";
import { landingLibrary } from "@/lib/landing-library";
import { landingProPreview } from "@/lib/landing-pro-preview";
import { landingDaily } from "@/lib/server/landing-daily";
import { billingConfigured } from "@/lib/server/config";
import { officialTechDocs, previewTechDocs } from "@/lib/server/official-tech-docs";
import { organizationSchema, pageMetadata, websiteSchema } from "@/lib/seo";
export const metadata = pageMetadata("/");
// The AI pulse and Word power carousels change at midnight IST. The page is cached with an hourly lifetime, so the
// new day is picked up within the hour; revalidateTag("landing") publishes a change at once.
export default async function Home() {
  "use cache";
  cacheLife("hours");
  cacheTag("landing");
  const pro = landingProPreview();
  // The same values /api/billing returns, rendered into the page instead of fetched after hydration.
  const prices = { monthly: Number(process.env.PRO_MONTHLY_PRICE_INR ?? 299), yearly: Number(process.env.PRO_YEARLY_PRICE_INR ?? 2999), enabled: billingConfigured() };
  return <><JsonLd data={[websiteSchema(), organizationSchema()]} /><LandingPage pro={pro} library={landingLibrary(pro)} prices={prices} daily={landingDaily()} techDocs={previewTechDocs(await officialTechDocs())} /></>;
}
