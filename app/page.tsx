import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { currentUser } from "@/lib/server/auth";
import { authConfigured } from "@/lib/server/config";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (authConfigured() && await currentUser()) redirect("/dashboard");
  return <LandingPage />;
}
