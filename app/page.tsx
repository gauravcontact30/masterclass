import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LandingPage } from "@/components/landing-page";
import { authConfigured } from "@/lib/server/config";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (authConfigured()) {
    const { userId } = await auth();
    if (userId) redirect("/dashboard");
  }
  return <LandingPage />;
}
