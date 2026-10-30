import { Suspense } from "react";
import { AuthPage, type LinkError } from "@/components/auth-page";

const LINK_ERRORS: LinkError[] = ["link_expired", "link_invalid", "link_other_device", "oauth_failed", "oauth_unavailable"];
import { authConfigured } from "@/lib/server/config";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** The request-time part: an `?email=` prefill and the proxy's `?redirect=` target. */
async function SignIn({ searchParams }: { searchParams: SearchParams }) {
  const { email, redirect, error } = await searchParams;
  // Only known link problems from /auth/confirm and /auth/callback are shown; anything else is ignored.
  const linkError = LINK_ERRORS.find(known => known === error);
  return <AuthPage mode="signin" enabled={authConfigured()} initialEmail={typeof email === "string" ? email.slice(0, 254) : ""} redirectTo={typeof redirect === "string" ? redirect : undefined} linkError={linkError} />;
}

// Cache Components: searchParams is request data, so it sits behind Suspense. The fallback is the same form
// without the prefill, so the prerendered shell already shows a usable sign-in form.
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<AuthPage mode="signin" enabled={authConfigured()} />}><SignIn searchParams={searchParams} /></Suspense>;
}
