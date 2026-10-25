import { Suspense } from "react";
import { AuthPage } from "@/components/auth-page";
import { authConfigured } from "@/lib/server/config";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function SignUp({ searchParams }: { searchParams: SearchParams }) {
  const { email, redirect } = await searchParams;
  return (
    <AuthPage
      mode="signup"
      enabled={authConfigured()}
      initialEmail={typeof email === "string" ? email.slice(0, 254) : ""}
      redirectTo={typeof redirect === "string" ? redirect : undefined}
    />
  );
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AuthPage mode="signup" enabled={authConfigured()} />}>
      <SignUp searchParams={searchParams} />
    </Suspense>
  );
}
