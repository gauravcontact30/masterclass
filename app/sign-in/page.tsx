import { Suspense } from "react";
import { AuthPage } from "@/components/auth-page";
import { authConfigured } from "@/lib/server/config";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** The request-time part: an `?email=` prefill and the proxy's `?redirect=` target. */
async function SignIn({ searchParams }: { searchParams: SearchParams }) {
  const { email, redirect } = await searchParams;
  return <AuthPage mode="signin" enabled={authConfigured()} initialEmail={typeof email === "string" ? email.slice(0, 254) : ""} redirectTo={typeof redirect === "string" ? redirect : undefined} />;
}

// Cache Components: searchParams is request data, so it sits behind Suspense. The fallback is the same form
// without the prefill, so the prerendered shell already shows a usable sign-in form.
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<AuthPage mode="signin" enabled={authConfigured()} />}><SignIn searchParams={searchParams} /></Suspense>;
}
