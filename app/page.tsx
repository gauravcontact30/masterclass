import { LandingPage } from "@/components/landing-page";
import { JsonLd } from "@/components/json-ld";
import { landingLibrary } from "@/lib/landing-library";
import { landingProPreview } from "@/lib/landing-pro-preview";
import { landingDaily } from "@/lib/server/landing-daily";
import { billingConfigured } from "@/lib/server/config";
import { organizationSchema, pageMetadata, websiteSchema } from "@/lib/seo";
export const metadata = pageMetadata("/");
// The AI pulse and Word power carousels change at midnight IST; hourly regeneration picks the new day up within the hour.
export const revalidate = 3600;
export default function Home() {
  const pro = landingProPreview();
  // The same values /api/billing returns, rendered into the page instead of fetched after hydration.
  const prices = { monthly: Number(process.env.PRO_MONTHLY_PRICE_INR ?? 299), yearly: Number(process.env.PRO_YEARLY_PRICE_INR ?? 2999), enabled: billingConfigured() };
  return <><JsonLd data={[websiteSchema(), organizationSchema()]} /><LandingPage pro={pro} library={landingLibrary(pro)} prices={prices} daily={landingDaily()} /></>;
}
