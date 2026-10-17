import { redirect } from "next/navigation";
import { GuestCheckout } from "@/components/guest-checkout";
import { authConfigured, billingConfigured, subscriptionPrice } from "@/lib/server/config";
import { currentUser } from "@/lib/server/auth";
import { privateMetadata } from "@/lib/seo";

export const metadata = { ...privateMetadata, title: "Subscribe" };

/** Membership checkout for visitors without an account; members manage plans in the dashboard. */
export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  if (authConfigured() && await currentUser()) redirect("/dashboard?tab=plans");
  const plan = (await searchParams).plan;
  return <GuestCheckout
    initialTier={plan === "yearly" ? "yearly" : "monthly"}
    enabled={authConfigured() && billingConfigured()}
    prices={{ monthly: subscriptionPrice("monthly"), yearly: subscriptionPrice("yearly") }} />;
}
