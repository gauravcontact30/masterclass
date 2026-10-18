"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ExpandedText } from "@/components/expanded-text";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Languages, MailCheck, Settings2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { hardNavigate } from "@/lib/hard-navigate";
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

/** Only same-site paths are followed after sign-in (never `//host` or a full URL), and only into the app. */
export function safeRedirect(target: string | undefined) {
  return target && /^\/(dashboard|notes|subscribe)(\/|\?|$)/.test(target) && !target.startsWith("//") ? target : "/dashboard";
}
/**
 * A full navigation, not router.replace: the new session cookies then reach the proxy and server on the very
 * first request, and the client router's cache (staleTimes.dynamic is 30s) cannot replay a signed-out
 * redirect from moments earlier.
 */
const enterApp = (target: string) => hardNavigate(target);
const noSubscribe = () => () => {};

export function AuthPage({ mode, enabled, initialEmail = "", redirectTo }: { mode: "signin" | "signup"; enabled: boolean; initialEmail?: string; redirectTo?: string }) {
  const { t, language, setLanguage } = useLanguage();
  // False in the server HTML, true once React has hydrated. Until then the submit button stays disabled, so a tap
  // on a slow phone connection cannot fall through to a native form submit that silently reloads the page.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const hi = language === "hi";

  // Accounts created at guest checkout have no password until the owner sets one.
  async function sendLink() {
    if (!email.trim()) { setError("invalid_request"); return; }
    setBusy(true); setError(null);
    try {
      const { error } = await supabaseBrowser().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback` } });
      // Report success either way, so the form does not reveal which emails have accounts.
      if (error && error.status !== 400 && error.status !== 422) { setError(authErrorKey(error)); return; }
      setLinkSent(true);
    } catch { setError("service_error"); } finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null);
    let leaving = false;
    try {
      const auth = supabaseBrowser().auth;
      if (mode === "signin") {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) { setError(authErrorKey(error)); return; }
        leaving = true; enterApp(safeRedirect(redirectTo));
        return;
      } else {
        // full_name rides along in the user metadata; the on_auth_user_created
        // trigger copies it into public.profiles.name (migration 0003).
        const { data, error } = await auth.signUp({ email, password, options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) { setError(authErrorKey(error)); return; }
        // With email confirmation on, Supabase returns no session until the link is opened.
        if (data.session) { leaving = true; enterApp("/dashboard"); return; }
        setSent(true);
      }
    } catch { setError("service_error"); } finally { if (!leaving) setBusy(false); }
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
            <Languages size={14} className={styles.langIcon} aria-hidden="true" />
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
          ) : linkSent ? (
            <section className={styles.notice}>
              <span className={styles.noticeIcon}><MailCheck size={20} aria-hidden="true" /></span>
              <h1 className={styles.title}><ExpandedText text={hi ? "अपना ईमेल देखें" : "Check your email"} /></h1>
              <p className={styles.lead}><ExpandedText text={hi ? `अगर ${email.trim()} से कोई खाता है, तो हमने उस पर साइन-इन लिंक भेजा है। लिंक खोलकर साइन इन करें।` : `If an account exists for ${email.trim()}, we have sent it a sign-in link. Open the link to sign in.`} /></p>
              <button type="button" className={styles.switchLink} onClick={() => setLinkSent(false)}><ExpandedText text={hi ? "वापस जाएँ" : "Back to sign in"} /></button>
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
              {/* method="post": even before hydration a submit never puts anything in the URL. */}
              <form method="post" onSubmit={submit} className={styles.form}>
                {mode === "signup" && (
                  // The hint sits outside the label so it describes the field
                  // without becoming part of its accessible name.
                  <div className={styles.field}>
                    <Label className={styles.label} htmlFor="auth-name"><ExpandedText text={t("fullName")} /></Label>
                    <Input className={styles.input} id="auth-name" type="text" autoComplete="name" required maxLength={80} aria-describedby="auth-name-hint" value={name} onChange={e => setName(e.target.value)} />
                    <small className={styles.hint} id="auth-name-hint"><ExpandedText text={t("fullNameHint")} /></small>
                  </div>
                )}
                <div className={styles.field}>
                  <Label className={styles.label} htmlFor="auth-email"><ExpandedText text={t("email")} /></Label>
                  <Input className={styles.input} id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className={styles.field}>
                  <Label className={styles.label} htmlFor="auth-password"><ExpandedText text={t("password")} /></Label>
                  <div className={styles.passwordBox}>
                    <Input className={styles.input} id="auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={6} aria-describedby={mode === "signup" ? "auth-password-hint" : undefined} value={password} onChange={e => setPassword(e.target.value)} />
                    <Button className={styles.eye} type="button" aria-controls="auth-password" aria-pressed={showPassword} aria-label={showPassword ? t("hidePassword") : t("showPassword")} onClick={() => setShowPassword(value => !value)}>
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </Button>
                  </div>
                  {mode === "signup" && <small className={styles.hint} id="auth-password-hint"><ExpandedText text={t("authPasswordHint")} /></small>}
                </div>
                <Button className={styles.submit} type="submit" disabled={busy || !hydrated} aria-busy={busy || !hydrated}><ExpandedText text={busy || !hydrated ? t("loading") : t(mode === "signin" ? "signin" : "signup")} /></Button>
              </form>
              {mode === "signin" && <p className={styles.switchRow}><button type="button" className={styles.switchLink} disabled={busy} onClick={() => void sendLink()}><ExpandedText text={hi ? "पासवर्ड नहीं है? मुझे साइन-इन लिंक ईमेल करें" : "No password? Email me a sign-in link"} /></button></p>}
              <p className={styles.switchRow}><Link className={styles.switchLink} href={mode === "signin" ? "/sign-up" : "/sign-in"}><ExpandedText text={t(mode === "signin" ? "noAccount" : "haveAccount")} /></Link></p>
              {mode === "signup" && <p className={styles.hint}>{language === "hi"
                ? <>खाता बनाकर आप हमारे <Link href="/terms">नियम और शर्तें</Link> और <Link href="/privacy">गोपनीयता नीति</Link> स्वीकार करते हैं।</>
                : <>By creating an account you agree to our <Link href="/terms">Terms &amp; conditions</Link> and <Link href="/privacy">Privacy policy</Link>.</>}</p>}
            </section>
          )}
        </div>
      </main>
      <AuthStory />
    </div>
  );
}
