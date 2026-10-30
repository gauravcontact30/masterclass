"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ExpandedText } from "./expanded-text";
import { useLanguage } from "./language-provider";
import { buttonVariants } from "./ui/button";

const LABELS: Record<string, string> = { email: "Email", google: "Google" };

/** Settings → how this account signs in (its Supabase identities) and a way to set or change the password.
 *  A Google-only account has no password until it sets one here; /reset-password works for any signed-in reader. */
export function AccountSecurity() {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [methods, setMethods] = useState<string[] | null>(null);
  useEffect(() => {
    let live = true;
    supabaseBrowser().auth.getUser().then(({ data }) => {
      // Google sign-in is run by the app (lib/server/google-auth.ts), which marks the account with user_metadata.google_sub.
      const providers = (data.user?.identities ?? []).map(identity => identity.provider);
      if (data.user?.user_metadata?.google_sub) providers.push("google");
      if (live) setMethods([...new Set(providers)]);
    }).catch(() => { if (live) setMethods([]); });
    return () => { live = false; };
  }, []);
    return <div className="connections-grid" style={{ marginBottom: 20 }}><article className="panel">
    <h2><ExpandedText text={hi ? "साइन-इन और सुरक्षा" : "Sign-in and security"} /></h2>
    <p><ExpandedText text={methods === null ? (hi ? "लोड हो रहा है…" : "Loading…") : methods.length
      ? `${hi ? "साइन-इन के तरीके" : "Sign-in methods"}: ${methods.map(method => LABELS[method] ?? method).join(", ")}`
      : (hi ? "साइन-इन के तरीके नहीं मिले।" : "No sign-in methods found.")} /></p>
    <Link className={buttonVariants()} href="/reset-password"><KeyRound size={15} aria-hidden="true" /> <ExpandedText text={hi ? "पासवर्ड बदलें या सेट करें" : "Change or set password"} /></Link>
  </article></div>;
}
