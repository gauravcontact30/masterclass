import { redirect } from "next/navigation";
import { GuestCheckout } from "@/components/guest-checkout";
import { headers } from "next/headers";
import { authConfigured, billingConfigured } from "@/lib/server/config";
import { visitorPrices } from "@/lib/server/pricing";
import { currentUser } from "@/lib/server/auth";
import { privateMetadata } from "@/lib/seo";

export const metadata = { ...privateMetadata, title: "Subscribe" };

/** Membership checkout for visitors without an account, priced in their country's currency; members manage plans in the dashboard. */
export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  if (authConfigured() && await currentUser()) redirect("/dashboard/plans");
  const plan = (await searchParams).plan;
  return <GuestCheckout
    initialTier={plan === "yearly" ? "yearly" : "monthly"}
    enabled={authConfigured() && billingConfigured()}
    prices={await visitorPrices(await headers())} />;
}
