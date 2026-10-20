import { Suspense } from "react";
import { AuthPage } from "@/components/auth-page";
import { authConfigured } from "@/lib/server/config";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** The request-time part: a `?goal=` carried over from the landing page's path finder. */
async function SignUp({ searchParams }: { searchParams: SearchParams }) {
  const { goal } = await searchParams;
  return <AuthPage mode="signup" enabled={authConfigured()} initialGoal={typeof goal === "string" ? goal.slice(0, 300) : ""} />;
}

// Cache Components: searchParams is request data, so it sits behind Suspense. The fallback is the same form without
// the prefill, so the prerendered shell already shows a usable sign-up form.
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<AuthPage mode="signup" enabled={authConfigured()} />}><SignUp searchParams={searchParams} /></Suspense>;
}
