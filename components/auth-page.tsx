"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ExpandedText } from "@/components/expanded-text";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { setAuthNotice } from "@/lib/auth-notice";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Languages, MailCheck, Settings2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { hardNavigate } from "@/lib/hard-navigate";
import { en, TranslationKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
import { Wordmark } from "./brand-mark";
import { AuthStory } from "./auth-carousel";
import styles from "./auth-page.module.css";
import { LearningSlot } from "./learning-slot";

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
/** Problems with an emailed link, passed back by /auth/confirm and /auth/callback as ?error=. */
export type LinkError = "link_expired" | "link_invalid" | "link_other_device";
const LINK_ERRORS: Record<LinkError, [en: string, hi: string]> = {
  link_expired: ["That confirmation link has expired. Sign in to get a new one, or send it again below.", "यह पुष्टि लिंक समाप्त हो गया है। नया लिंक पाने के लिए नीचे से फिर भेजें।"],
  link_invalid: ["That link is not valid or was already used. If your email is confirmed, just sign in.", "यह लिंक मान्य नहीं है या पहले ही उपयोग हो चुका है। ईमेल सत्यापित है तो सीधे साइन इन करें।"],
  link_other_device: ["That link was opened in a different browser from the one you signed up in. Your email may already be confirmed: try signing in.", "यह लिंक उस ब्राउज़र से अलग ब्राउज़र में खुला जिसमें आपने साइन अप किया था। आपका ईमेल शायद सत्यापित हो चुका है: साइन इन करके देखें।"],
};
/** Seconds before another confirmation email may be requested. */
const RESEND_WAIT = 60;
const noSubscribe = () => () => {};

export function AuthPage({ mode, enabled, initialEmail = "", redirectTo, linkError }: { mode: "signin" | "signup"; enabled: boolean; initialEmail?: string; redirectTo?: string; linkError?: LinkError }) {
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
  const [resendIn, setResendIn] = useState(0);
  const hi = language === "hi";
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(seconds => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  /** Sends the sign-up confirmation email again. Same message whether or not the address has an account. */
  async function resendConfirmation() {
    const address = email.trim();
    if (!address || resendIn > 0) { if (!address) setError("invalid_request"); return; }
    setBusy(true);
    try {
      const { error } = await supabaseBrowser().auth.resend({ type: "signup", email: address, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error?.code === "over_email_send_rate_limit") { setError("over_email_send_rate_limit"); return; }
      setResendIn(RESEND_WAIT);
      toast.success(hi ? "पुष्टि ईमेल फिर से भेजा गया" : "Confirmation email sent again", { description: hi ? `${address} का इनबॉक्स (और स्पैम फ़ोल्डर) देखें।` : `Check the inbox (and spam folder) of ${address}.` });
    } catch { setError("service_error"); } finally { setBusy(false); }
  }
  const resendButton = <button type="button" className={styles.switchLink} disabled={busy || resendIn > 0} onClick={() => void resendConfirmation()}>
    <ExpandedText text={resendIn > 0 ? (hi ? `${resendIn} सेकंड में फिर भेज सकते हैं` : `Resend available in ${resendIn}s`) : (hi ? "पुष्टि ईमेल फिर से भेजें" : "Resend confirmation email")} />
  </button>;

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
        const { data, error } = await auth.signInWithPassword({ email, password });
        if (error) { setError(authErrorKey(error)); return; }
        // Only a confirmed email may enter, even if the project ever issues a session before confirmation.
        if (!data.user?.email_confirmed_at) { await auth.signOut(); setError("email_not_confirmed"); return; }
        setAuthNotice("signed_in");
        leaving = true; enterApp(safeRedirect(redirectTo));
        return;
      } else {
        // full_name rides along in the user metadata; the on_auth_user_created
        // trigger copies it into public.profiles.name (migration 0003).
        const { data, error } = await auth.signUp({ email, password, options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) { setError(authErrorKey(error)); return; }
        // An already-confirmed address gets a decoy user with no identities and no email at all. Say so, instead
        // of sending the visitor to wait for a confirmation that will never arrive. (An unconfirmed address gets
        // its real user back and a fresh email, so it takes the normal path below.)
        if (data.user && data.user.identities?.length === 0) {
          setError("user_already_exists");
          toast.info(hi ? "यह ईमेल पहले से पंजीकृत है" : "This email already has an account", { description: hi ? "साइन इन करें, या पासवर्ड न हो तो साइन-इन लिंक मँगवाएँ।" : "Sign in instead, or ask for a sign-in link if you have no password." });
          return;
        }
        // With email confirmation on, Supabase returns no session until the link is opened.
        if (data.session && data.user?.email_confirmed_at) { setAuthNotice("created"); leaving = true; enterApp("/dashboard"); return; }
        if (data.session) await auth.signOut();
        setSent(true); setResendIn(RESEND_WAIT);
        toast.success(hi ? "खाता बन गया" : "Account created successfully", { description: hi ? `हमने ${email.trim()} पर पुष्टि लिंक भेजा है। साइन इन करने से पहले उसे खोलें (स्पैम फ़ोल्डर भी देखें)।` : `We sent a confirmation link to ${email.trim()}. Open it before signing in (check spam too).`, duration: 8000 });
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
              <p className={styles.lead}><ExpandedText text={hi ? `ईमेल: ${email.trim()}। ईमेल नहीं मिला? स्पैम फ़ोल्डर देखें या फिर से भेजें।` : `Sent to ${email.trim()}. Nothing arrived? Check your spam folder, or send it again.`} /></p>
              <p className={styles.switchRow}>{resendButton}</p>
              <Link className={styles.switchLink} href="/sign-in"><ExpandedText text={t("signin")} /><ArrowUpRight size={15} aria-hidden="true" /></Link>
            </section>
          ) : (
            <section>
              <h1 className={styles.title}><ExpandedText text={t(mode === "signin" ? "signinTitle" : "signupTitle")} /></h1>
              <p className={styles.lead}><ExpandedText text={t(mode === "signin" ? "signinHelp" : "signupHelp")} /></p>
              {mode === "signup" && <p className={styles.trial}><ExpandedText text={hi ? "हर नया खाता 1 दिन के निःशुल्क ट्रायल से शुरू होता है: पूरी पहुँच, कोई कार्ड नहीं।" : "Every new account starts with a 1-day free trial: full access, no card needed."} /></p>}
              <LearningSlot surface={mode === "signin" ? "sign_in" : "sign_up"} page={mode === "signin" ? "sign-in" : "sign-up"} section="above-form" />
              {!error && linkError && <p className={`error-banner ${styles.error}`} role="alert"><ExpandedText text={LINK_ERRORS[linkError][hi ? 1 : 0]} /></p>}
              {error && <p className={`error-banner ${styles.error}`} role="alert"><ExpandedText text={t(error)} /></p>}
              {(error === "email_not_confirmed" || linkError === "link_expired") && <p className={styles.switchRow}>{resendButton}</p>}
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
              {mode === "signup" && error === "user_already_exists" && <p className={styles.switchRow}><Link className={styles.switchLink} href={`/sign-in?email=${encodeURIComponent(email.trim())}`}><ExpandedText text={t("signin")} /><ArrowUpRight size={15} aria-hidden="true" /></Link></p>}
              {mode === "signin" && <p className={styles.switchRow}><button type="button" className={styles.switchLink} disabled={busy} onClick={() => void sendLink()}><ExpandedText text={hi ? "पासवर्ड नहीं है? मुझे साइन-इन लिंक ईमेल करें" : "No password? Email me a sign-in link"} /></button></p>}
              <p className={styles.switchRow}><Link className={styles.switchLink} href={mode === "signin" ? "/sign-up" : "/sign-in"}><ExpandedText text={t(mode === "signin" ? "noAccount" : "haveAccount")} /></Link></p>
              {mode === "signup" && <p className={styles.hint}>{language === "hi"
                ? <>खाता बनाकर आप हमारे <Link href="/terms">नियम और शर्तें</Link> और <Link href="/privacy">गोपनीयता नीति</Link> स्वीकार करते हैं।</>
                : <>By creating an account you agree to our <Link href="/terms">Terms &amp; conditions</Link> and <Link href="/privacy">Privacy policy</Link>.</>}</p>}
              <LearningSlot surface={mode === "signin" ? "sign_in" : "sign_up"} page={mode === "signin" ? "sign-in" : "sign-up"} section="below-form" />
            </section>
          )}
        </div>
      </main>
      <AuthStory mode={mode} />
    </div>
  );
}
