"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, MailCheck } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { en, TranslationKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
import { Wordmark } from "./brand-mark";

// Supabase reports failures with a stable `code`; fall back to a generic message
// so an unmapped code never surfaces raw English from the API.
function authErrorKey(error: { code?: string; message?: string }): TranslationKey {
  const code = error.code ?? "";
  return code in en ? code as TranslationKey : "service_error";
}

export function AuthPage({ mode, enabled }: { mode: "signin" | "signup"; enabled: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null);
    try {
      const auth = supabaseBrowser().auth;
      if (mode === "signin") {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) { setError(authErrorKey(error)); return; }
        router.replace("/dashboard");
      } else {
        // full_name rides along in the user metadata; the on_auth_user_created
        // trigger copies it into public.profiles.name (migration 0003).
        const { data, error } = await auth.signUp({ email, password, options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) { setError(authErrorKey(error)); return; }
        // With email confirmation on, Supabase returns no session until the link is opened.
        if (data.session) router.replace("/dashboard"); else setSent(true);
      }
    } catch { setError("service_error"); } finally { setBusy(false); }
  }

  return (
    <main className="auth-page">
      <Link className="wordmark" href="/"><Wordmark /></Link>
      {!enabled ? (
        <section className="panel"><h1>{t("setupTitle")}</h1><p>{t("setupHelp")}</p><Link href="/">{t("dashboard")}</Link></section>
      ) : sent ? (
        <section className="panel auth-confirm">
          <span className="section-icon"><MailCheck size={22} /></span>
          <h1>{t("confirmTitle")}</h1>
          <p>{t("confirmBody")}</p>
          <Link className="auth-switch" href="/sign-in">{t("signin")}<ArrowUpRight size={15} /></Link>
        </section>
      ) : (
        <section className="panel">
          <h1>{t(mode === "signin" ? "signinTitle" : "signupTitle")}</h1>
          <p>{t(mode === "signin" ? "signinHelp" : "signupHelp")}</p>
          {error && <p className="error-banner" role="alert">{t(error)}</p>}
          <form onSubmit={submit} className="auth-form">
            {mode === "signup" && (
              // The hint sits outside the label so it describes the field
              // without becoming part of its accessible name.
              <div className="auth-field">
                <label htmlFor="auth-name">{t("fullName")}
                  <input id="auth-name" type="text" autoComplete="name" required maxLength={80} aria-describedby="auth-name-hint" value={name} onChange={e => setName(e.target.value)} />
                </label>
                <small id="auth-name-hint">{t("fullNameHint")}</small>
              </div>
            )}
            <label htmlFor="auth-email">{t("email")}
              <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label htmlFor="auth-password">{t("password")}
              <input id="auth-password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
            </label>
            <Button type="submit" disabled={busy}>{busy ? t("loading") : t(mode === "signin" ? "signin" : "signup")}</Button>
          </form>
          <Link className="auth-switch" href={mode === "signin" ? "/sign-up" : "/sign-in"}>{t(mode === "signin" ? "noAccount" : "haveAccount")}</Link>
        </section>
      )}
    </main>
  );
}
