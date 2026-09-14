import { notFound } from "next/navigation";
import { AuthPage } from "@/components/auth-page";
export default async function AuthReview({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return <AuthPage mode={(await searchParams).mode === "signin" ? "signin" : "signup"} enabled={false}/>;
}
