"use client";
import { ExpandedText } from "@/components/expanded-text";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, MailCheck, Settings2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { en, TranslationKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
import { Wordmark } from "./brand-mark";
import { AuthStory } from "./auth-carousel";
import styles from "./auth-page.module.css";

// Supabase reports failures with a stable `code`; fall back to a generic message
// so an unmapped code never surfaces raw English from the API.
function authErrorKey(error: { code?: string; message?: string }): TranslationKey {
  const code = error.code ?? "";
  return code in en ? code as TranslationKey : "service_error";
}

export function AuthPage({ mode, enabled }: { mode: "signin" | "signup"; enabled: boolean }) {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className={styles.page}>
      {/* The form comes first in the DOM so keyboard and mobile visitors reach it
          before the brand panel; on wide screens CSS places the panel on the left. */}
      <main className={styles.main}>
        <div className={styles.topBar}>
          <Link className={styles.back} href="/"><ArrowLeft size={15} aria-hidden="true" /><ExpandedText text={t("authBackHome")} /></Link>
          {/* Signed-out visitors have no account to save the choice to, so it stays local (persist=false). */}
          <div className={styles.langToggle} role="group" aria-label={t("language")}>
            <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en", false)}>EN</button>
            <button type="button" lang="hi" aria-pressed={language === "hi"} onClick={() => setLanguage("hi", false)}>Hi</button>
          </div>
        </div>
        <div className={styles.formWrap}>
          <div className={styles.brand}><Wordmark /></div>
          {!enabled ? (
            <section className={styles.notice}>
              <span className={styles.noticeIcon}><Settings2 size={20} aria-hidden="true" /></span>
              <h1 className={styles.title}><ExpandedText text={t("setupTitle")} /></h1>
              <p className={styles.lead}><ExpandedText text={t("setupHelp")} /></p>
              <Link className={styles.switchLink} href="/"><ExpandedText text={t("dashboard")} /></Link>
            </section>
          ) : sent ? (
            <section className={styles.notice}>
              <span className={styles.noticeIcon}><MailCheck size={20} aria-hidden="true" /></span>
              <h1 className={styles.title}><ExpandedText text={t("confirmTitle")} /></h1>
              <p className={styles.lead}><ExpandedText text={t("confirmBody")} /></p>
              <Link className={styles.switchLink} href="/sign-in"><ExpandedText text={t("signin")} /><ArrowUpRight size={15} aria-hidden="true" /></Link>
            </section>
          ) : (
            <section>
              <h1 className={styles.title}><ExpandedText text={t(mode === "signin" ? "signinTitle" : "signupTitle")} /></h1>
              <p className={styles.lead}><ExpandedText text={t(mode === "signin" ? "signinHelp" : "signupHelp")} /></p>
              {error && <p className={`error-banner ${styles.error}`} role="alert"><ExpandedText text={t(error)} /></p>}
              <form onSubmit={submit} className={styles.form}>
                {mode === "signup" && (
                  // The hint sits outside the label so it describes the field
                  // without becoming part of its accessible name.
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="auth-name"><ExpandedText text={t("fullName")} /></label>
                    <input className={styles.input} id="auth-name" type="text" autoComplete="name" required maxLength={80} aria-describedby="auth-name-hint" value={name} onChange={e => setName(e.target.value)} />
                    <small className={styles.hint} id="auth-name-hint"><ExpandedText text={t("fullNameHint")} /></small>
                  </div>
                )}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="auth-email"><ExpandedText text={t("email")} /></label>
                  <input className={styles.input} id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="auth-password"><ExpandedText text={t("password")} /></label>
                  <div className={styles.passwordBox}>
                    <input className={styles.input} id="auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={6} aria-describedby={mode === "signup" ? "auth-password-hint" : undefined} value={password} onChange={e => setPassword(e.target.value)} />
                    <button className={styles.eye} type="button" aria-controls="auth-password" aria-pressed={showPassword} aria-label={showPassword ? t("hidePassword") : t("showPassword")} onClick={() => setShowPassword(value => !value)}>
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  {mode === "signup" && <small className={styles.hint} id="auth-password-hint"><ExpandedText text={t("authPasswordHint")} /></small>}
                </div>
                <Button className={styles.submit} type="submit" disabled={busy}><ExpandedText text={busy ? t("loading") : t(mode === "signin" ? "signin" : "signup")} /></Button>
              </form>
              <p className={styles.switchRow}><Link className={styles.switchLink} href={mode === "signin" ? "/sign-up" : "/sign-in"}><ExpandedText text={t(mode === "signin" ? "noAccount" : "haveAccount")} /></Link></p>
            </section>
          )}
        </div>
      </main>
      <AuthStory />
    </div>
  );
}
