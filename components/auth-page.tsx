"use client";
import { AuthAudiencePicker } from "./auth-audience-picker";
import { useIndiaAccess } from "./audience-provider";
import { GOALS, trackGoal } from "@/lib/goals";
import { RouteH1 } from "@/components/route-heading";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExpandedText } from "@/components/expanded-text";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "@/components/site-link";
import { toast } from "sonner";
import { setAuthNotice } from "@/lib/auth-notice";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Globe2, MailCheck, Settings2, Sparkles } from "lucide-react";
import { browserAuth, preloadSupabaseBrowser } from "@/lib/supabase-browser-lazy";
import { hardNavigate } from "@/lib/hard-navigate";
import { isSafeRedirect } from "@/lib/safe-redirect";
import { PORTALS, isExamPortal, isScopedPortal, otherPortals, type Portal } from "@/lib/portal";
import { en, TranslationKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
import { Wordmark } from "./brand-mark";
import { AuthStory } from "./auth-carousel";
import styles from "./auth-page.module.css";
import { LearningSlot } from "./learning-slot";

// Supabase reports failures with a stable `code`; fall back to a generic message
// so an unmapped code never surfaces raw English from the API.
export function authErrorKey(error: { code?: string; message?: string; reasons?: string[] }): TranslationKey {
  const code = error.code ?? "";
  // Supabase says why a password is weak: "pwned" (it is in public breach lists: leaked-password protection),
  // "characters" (missing a required kind of character) or "length". All three used to show "at least 6 characters",
  // which made no sense for a long password that was simply too common.
  if (code === "weak_password" && error.reasons?.includes("pwned")) return "weak_password_pwned";
  if (code === "weak_password" && error.reasons?.includes("characters")) return "weak_password_rules";
  return code in en ? code as TranslationKey : "service_error";
}

export function safeRedirect(target: string | undefined) {
  return isSafeRedirect(target) ? target : "/learning";
}
/**
 * A full navigation, not router.replace: the new session cookies then reach the proxy and server on the very
 * first request, and the client router's cache (staleTimes.dynamic is 30s) cannot replay a signed-out
 * redirect from moments earlier.
 */
const enterApp = (target: string) => hardNavigate(target);
/** Problems with an emailed link, passed back by /auth/confirm and /auth/callback as ?error=. */
export type LinkError = "link_expired" | "reset_expired" | "link_invalid" | "link_other_device" | "oauth_failed" | "oauth_unavailable" | "no_portal_account" | "portal_unavailable";
const LINK_ERRORS: Record<LinkError, [en: string, hi: string]> = {
  link_expired: ["That email link has expired or was already used. Sign in, or send a new one below.", "यह ईमेल लिंक समाप्त हो गया है या पहले ही उपयोग हो चुका है। साइन इन करें, या नीचे से नया लिंक भेजें।"],
  reset_expired: ["That password-reset link has expired or was already used. Enter your email to get a new one.", "यह पासवर्ड-रीसेट लिंक समाप्त हो गया है या पहले ही उपयोग हो चुका है। नया लिंक पाने के लिए अपना ईमेल लिखें।"],
  link_invalid: ["That link is not valid or was already used. If your email is confirmed, just sign in.", "यह लिंक मान्य नहीं है या पहले ही उपयोग हो चुका है। ईमेल सत्यापित है तो सीधे साइन इन करें।"],
  link_other_device: ["That link was opened in a different browser from the one you signed up in. Your email may already be confirmed: try signing in.", "यह लिंक उस ब्राउज़र से अलग ब्राउज़र में खुला जिसमें आपने साइन अप किया था। आपका ईमेल शायद सत्यापित हो चुका है: साइन इन करके देखें।"],
  oauth_failed: ["Google sign-in was cancelled or did not finish. Try again, or use your email and password.", "Google साइन-इन रद्द हुआ या पूरा नहीं हुआ। फिर कोशिश करें, या ईमेल और पासवर्ड से साइन इन करें।"],
  no_portal_account: ["You are signed in, but you do not have an account in this portal yet. Create one below.", "You are signed in, but you do not have an account in this portal yet. Create one below."],
  portal_unavailable: ["This portal is not available right now. Please try again shortly.", "This portal is not available right now. Please try again shortly."],
  oauth_unavailable: ["Google sign-in is not available right now. Please use your email and password.", "Google साइन-इन अभी उपलब्ध नहीं है। कृपया ईमेल और पासवर्ड से साइन इन करें।"],
};
/** The callback URL for emailed links, carrying the page to return to. */
const callbackFor = (redirectTo?: string) => `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(safeRedirect(redirectTo))}` : ""}`;
const GoogleMark = () => <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
  <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
</svg>;
/** Seconds before another confirmation email may be requested. */
const RESEND_WAIT = 60;
const noSubscribe = () => () => {};

/** Opens `portal` for the session Supabase just issued (app/api/portal/enter): sign-up creates the portal account, sign-in needs one. */
async function openPortal(portal: Portal, intent: "signin" | "signup"): Promise<{ ok: true } | { ok: false; error: TranslationKey; hasOther: boolean }> {
  const response = await fetch("/api/portal/enter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ portal, intent }) });
  if (response.ok) return { ok: true };
  const body = await response.json().catch(() => ({})) as { error?: string; hasOther?: boolean };
  return { ok: false, error: body.error === "no_portal_account" ? (isScopedPortal(portal) ? "no_exams_account" : "no_tech_account") : body.error === "portal_unavailable" ? "portal_unavailable" : "service_error", hasOther: Boolean(body.hasOther) };
}

/**
 * `portal`: which of the site's three portals this form signs in to (lib/portal.ts): Tech Pro, Board Scholars or
 * Exam Aspirants. Each has its own pages, its own account and its own membership; an account in one opens no other.
 */
export function AuthPage({ mode, enabled, initialEmail = "", redirectTo, linkError, portal = "tech" }: { mode: "signin" | "signup"; enabled: boolean; initialEmail?: string; redirectTo?: string; linkError?: LinkError; portal?: Portal }) {
  const india = useIndiaAccess();
  // `exam`: an India-only exam portal. `scoped`: any portal with its own account (the exam portals and IELTS Achievers).
  const here = PORTALS[portal]; const exam = isExamPortal(portal); const scoped = isScopedPortal(portal);
  // The other portals offered at the foot of the form: the exam portals only where they are available (India).
  const others = otherPortals(portal).filter(other => india || exam || !isExamPortal(other));
  /** Where a finished sign-in lands: the page that asked for it, else this portal's dashboard. */
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const destination = selectedDestination ?? (isSafeRedirect(redirectTo) ? redirectTo : here.home);
  /** Where emailed links and Google return. An exam portal goes through /portal/enter, which opens that portal first. */
  const returnTo = (intent: "signin" | "signup") => scoped ? `/portal/enter?portal=${portal}&intent=${intent}&next=${encodeURIComponent(destination)}` : destination;
  const query = `?redirect=${encodeURIComponent(destination)}`;
  const { t, language } = useLanguage();
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
  // Which emailed link the "Check your email" screen is about: a magic sign-in link or a password reset.
  const [linkSent, setLinkSent] = useState<"signin" | "reset" | null>(null);
  // "Forgot password?" opens its own small form, so the reset never depends on the sign-in form's email being filled.
  // A dead reset link lands here with ?error=reset_expired and opens that form straight away.
  const [forgot, setForgot] = useState(linkError === "reset_expired");
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
      const { error } = await (await browserAuth()).resend({ type: "signup", email: address, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error?.code === "over_email_send_rate_limit") { setError("over_email_send_rate_limit"); return; }
      setResendIn(RESEND_WAIT);
      toast.success(hi ? "पुष्टि ईमेल फिर से भेजा गया" : "Confirmation email sent again", { description: hi ? `${address} का इनबॉक्स (और स्पैम फ़ोल्डर) देखें।` : `Check the inbox (and spam folder) of ${address}.` });
    } catch { setError("service_error"); } finally { setBusy(false); }
  }
  const resendButton = <Button type="button" variant="link" className={styles.switchLink} disabled={busy || resendIn > 0} onClick={() => void resendConfirmation()}>
    <ExpandedText text={resendIn > 0 ? (hi ? `${resendIn} सेकंड में फिर भेज सकते हैं` : `Resend available in ${resendIn}s`) : (hi ? "पुष्टि ईमेल फिर से भेजें" : "Resend confirmation email")} />
  </Button>;

  // Accounts created at guest checkout have no password until the owner sets one.
  async function sendLink() {
    if (!email.trim()) { setError("invalid_request"); return; }
    setBusy(true); setError(null);
    try {
      const { error } = await (await browserAuth()).signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: callbackFor(returnTo("signin")) } });
      // Report success either way, so the form does not reveal which emails have accounts.
      if (error && error.status !== 400 && error.status !== 422) { setError(authErrorKey(error)); return; }
      setLinkSent("signin");
    } catch { setError("service_error"); } finally { setBusy(false); }
  }

  /** Emails a password-reset link; opening it signs the reader in on /reset-password to choose a new password. */
  async function sendReset() {
    if (!email.trim()) { setError("invalid_request"); return; }
    setBusy(true); setError(null);
    try {
      const { error } = await (await browserAuth()).resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}` });
      if (error?.code === "over_email_send_rate_limit") { setError("over_email_send_rate_limit"); return; }
      // Same screen whether or not the address has an account.
      if (error && error.status !== 400 && error.status !== 422) { setError(authErrorKey(error)); return; }
      setForgot(false); setLinkSent("reset");
    } catch { setError("service_error"); } finally { setBusy(false); }
  }

  /** Leaves for Google's consent screen via app/api/auth/google, which signs the account in (creating it on a first
   *  visit) when Google returns. A full navigation: the OAuth redirects must happen at the top level. */
  function continueWithGoogle() {
    setBusy(true); setError(null);
    try { sessionStorage.removeItem("masterclass:sidebar-collapsed"); } catch {}
    trackGoal(GOALS.googleSignIn, { mode });
    const back = returnTo(mode === "signup" ? "signup" : "signin");
    hardNavigate(`/api/auth/google${back ? `?next=${encodeURIComponent(safeRedirect(back))}` : ""}`);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null);
    let leaving = false;
    try {
      const auth = await browserAuth();
      if (mode === "signin") {
        const { data, error } = await auth.signInWithPassword({ email, password });
        if (error) { setError(authErrorKey(error)); return; }
        // Only a confirmed email may enter, even if the project ever issues a session before confirmation.
        if (!data.user?.email_confirmed_at) { await auth.signOut(); setError("email_not_confirmed"); return; }
        // The login is right; now this portal must hold an account for it. No account opens another portal.
        if (scoped) {
          const opened = await openPortal(portal, "signin");
          if (!opened.ok) { if (!opened.hasOther) await auth.signOut(); setError(opened.error); return; }
        }
        trackGoal(GOALS.signIn, { method: "password" });
        setAuthNotice("signed_in");
        // Dashboards open with the sidebar collapsed on every sign-in.
        try { sessionStorage.removeItem("masterclass:sidebar-collapsed"); } catch {}
        leaving = true; enterApp(destination);
        return;
      } else {
        // full_name rides along in the user metadata; the on_auth_user_created
        // trigger copies it into public.profiles.name (migration 0003).
        const { data, error } = await auth.signUp({ email, password, options: { data: { full_name: name.trim(), portal, learning_path: destination, preferred_language: language }, emailRedirectTo: callbackFor(returnTo("signup")) } });
        if (error) { setError(authErrorKey(error)); return; }
        // An already-confirmed address gets a decoy user with no identities and no email at all. Say so, instead
        // of sending the visitor to wait for a confirmation that will never arrive. (An unconfirmed address gets
        // its real user back and a fresh email, so it takes the normal path below.)
        if (data.user && data.user.identities?.length === 0) {
          // The email already has a login, perhaps from the other portal. The same password proves ownership, and
          // then this portal's own account is created for it. A wrong password says how to proceed.
          const existing = await auth.signInWithPassword({ email, password });
          if (!existing.error && existing.data.user?.email_confirmed_at) {
            const opened = await openPortal(portal, "signup");
            if (opened.ok) { trackGoal(GOALS.signUp, { method: "password" }); setAuthNotice("created"); leaving = true; enterApp(destination); return; }
            setError(opened.error); return;
          }
          if (!existing.error) await auth.signOut();
          setError("portal_existing_login");
          toast.info(hi ? "यह ईमेल पहले से पंजीकृत है" : "This email already has an account", { description: hi ? "साइन इन करें, या पासवर्ड न हो तो साइन-इन लिंक मँगवाएँ।" : "Sign in instead, or ask for a sign-in link if you have no password." });
          return;
        }
        // With email confirmation on, Supabase returns no session until the link is opened.
        trackGoal(GOALS.signUp, { method: "password" });
        if (data.session && data.user?.email_confirmed_at) {
          const opened = await openPortal(portal, "signup");
          if (!opened.ok) { setError(opened.error); return; }
          setAuthNotice("created"); leaving = true; enterApp(destination); return;
        }
        if (data.session) await auth.signOut();
        setSent(true); setResendIn(RESEND_WAIT);
        toast.success(hi ? "खाता बन गया" : "Account created successfully", { description: hi ? `हमने ${email.trim()} पर पुष्टि लिंक भेजा है। साइन इन करने से पहले उसे खोलें (स्पैम फ़ोल्डर भी देखें)।` : `We sent a confirmation link to ${email.trim()}. Open it before signing in (check spam too).`, duration: 8000 });
      }
    } catch { setError("service_error"); } finally { if (!leaving) setBusy(false); }
  }

  return (
    <div className={styles.page} onFocusCapture={() => void preloadSupabaseBrowser()}>
      {/* The form comes first in the DOM so keyboard and mobile visitors reach it
          before the brand panel; on wide screens CSS places the panel on the left. */}
      <main className={styles.main}>
        <div className={styles.topBar}>
          <Link className={styles.back} href="/"><ArrowLeft size={15} aria-hidden="true" /><ExpandedText text={t("authBackHome")} /></Link>
          {/* Signed-out visitors have no account to save the choice to, so it stays local (persist=false). */}
        </div>
        <div className={styles.formWrap}>
          <div className={styles.brand}><Wordmark /></div>
          {!enabled ? (
            <section className={styles.notice}>
              <span className={styles.noticeIcon}><Settings2 size={20} aria-hidden="true" /></span>
              <RouteH1 className={styles.title}><ExpandedText text={t("setupTitle")} /></RouteH1>
              <p className={styles.lead}><ExpandedText text={t("setupHelp")} /></p>
              <Link className={styles.switchLink} href="/"><ExpandedText text={t("dashboard")} /></Link>
            </section>
          ) : linkSent ? (
            <section className={styles.notice}>
              <span className={styles.noticeIcon}><MailCheck size={20} aria-hidden="true" /></span>
              <RouteH1 className={styles.title}><ExpandedText text={hi ? "अपना ईमेल देखें" : "Check your email"} /></RouteH1>
              <p className={styles.lead}><ExpandedText text={linkSent === "reset"
                ? (hi ? `अगर ${email.trim()} से कोई खाता है, तो हमने उस पर पासवर्ड रीसेट लिंक भेजा है। उसी ब्राउज़र में लिंक खोलें और नया पासवर्ड चुनें (स्पैम फ़ोल्डर भी देखें)।` : `If an account exists for ${email.trim()}, we have sent it a password reset link. Open it in this browser to choose a new password (check spam too).`)
                : (hi ? `अगर ${email.trim()} से कोई खाता है, तो हमने उस पर साइन-इन लिंक भेजा है। लिंक खोलकर साइन इन करें।` : `If an account exists for ${email.trim()}, we have sent it a sign-in link. Open the link to sign in.`)} /></p>
              <Button type="button" variant="link" className={styles.switchLink} onClick={() => setLinkSent(null)}><ExpandedText text={hi ? "वापस जाएँ" : "Back to sign in"} /></Button>
            </section>
          ) : forgot ? (
            <section>
              <RouteH1 className={styles.title}><ExpandedText text={hi ? "पासवर्ड रीसेट करें" : "Reset your password"} /></RouteH1>
              <p className={styles.lead}><ExpandedText text={hi ? "अपने खाते का ईमेल लिखें। हम उस पर एक लिंक भेजेंगे जिससे आप नया पासवर्ड चुन सकेंगे।" : "Enter the email for your account and we will send you a link to choose a new password."} /></p>
              {!error && linkError === "reset_expired" && <Alert variant="destructive" className={`error-banner ${styles.error}`}><AlertDescription><ExpandedText text={LINK_ERRORS.reset_expired[hi ? 1 : 0]} /></AlertDescription></Alert>}
              {error && <Alert variant="destructive" className={`error-banner ${styles.error}`}><AlertDescription><ExpandedText text={t(error)} /></AlertDescription></Alert>}
              <form method="post" onSubmit={event => { event.preventDefault(); void sendReset(); }} className={styles.form}>
                <Field className={styles.field}>
                  <FieldLabel className={styles.label} htmlFor="reset-email"><ExpandedText text={t("email")} /></FieldLabel>
                  <Input className={styles.input} id="reset-email" type="email" autoComplete="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} />
                </Field>
                <Button className={styles.submit} type="submit" disabled={busy || !hydrated} aria-busy={busy}><ExpandedText text={busy ? t("loading") : (hi ? "रीसेट लिंक भेजें" : "Send reset link")} /></Button>
              </form>
              <p className={styles.switchRow}><Button type="button" variant="link" className={styles.switchLink} disabled={busy} onClick={() => { setForgot(false); setError(null); }}><ExpandedText text={hi ? "वापस जाएँ" : "Back to sign in"} /></Button></p>
            </section>
          ) : sent ? (
            <section className={styles.notice}>
              <span className={styles.noticeIcon}><MailCheck size={20} aria-hidden="true" /></span>
              <RouteH1 className={styles.title}><ExpandedText text={t("confirmTitle")} /></RouteH1>
              <p className={styles.lead}><ExpandedText text={t("confirmBody")} /></p>
              <p className={styles.lead}><ExpandedText text={hi ? `ईमेल: ${email.trim()}। ईमेल नहीं मिला? स्पैम फ़ोल्डर देखें या फिर से भेजें।` : `Sent to ${email.trim()}. Nothing arrived? Check your spam folder, or send it again.`} /></p>
              <p className={styles.switchRow}>{resendButton}</p>
              <Link className={styles.switchLink} href={here.signIn}><ExpandedText text={t("signin")} /><ArrowUpRight size={15} aria-hidden="true" /></Link>
            </section>
          ) : (
            <section>
              {/* One framed intro above the title: which portal this is and where it is available, the learning
                  path cards, then what the portal includes (wraps instead of truncating). */}
              <div className={styles.intro} data-portal={portal}>
                <div className={styles.introHead}>
                  <p className={styles.portal}><span className={styles.portalDot} aria-hidden="true" /><b>{hi ? `${here.name} पोर्टल` : `${here.name} portal`}</b></p>
                  <span className={styles.scope}><Globe2 size={12} strokeWidth={2.2} aria-hidden="true" />{exam ? (hi ? "परीक्षा तैयारी" : "Exam prep") : (hi ? "दुनिया भर" : "Worldwide")}</span>
                </div>
                <AuthAudiencePicker mode={mode} portal={portal} destination={destination} onDestination={setSelectedDestination} />
                <p className={styles.introFoot}><Sparkles size={13} strokeWidth={2.2} aria-hidden="true" /><span>{hi ? "शामिल: " : "Includes "}<b>{here.tagline.split(" · ")[0]}</b></span></p>
              </div>
              <RouteH1 className={styles.title}><ExpandedText text={t(mode === "signin" ? "signinTitle" : "signupTitle")} /></RouteH1>
              <p className={styles.lead}><ExpandedText text={portal === "boards" ? (mode === "signin" ? (hi ? "अपनी बोर्ड परीक्षा की तैयारी जारी रखने के लिए साइन इन करें।" : "Sign in to continue your Class 10 or 12 board preparation.") : (hi ? "अपना बोर्ड और कक्षा चुनें, फिर Board Scholars खाता बनाएँ।" : "Choose your board and class, then create your Board Scholars account."))
                : portal === "ielts" ? (mode === "signin" ? (hi ? "अपनी IELTS तैयारी जारी रखने के लिए साइन इन करें।" : "Sign in to continue your IELTS preparation.") : (hi ? "Academic या General Training: सैंपल पेपर, मॉक टेस्ट और हर प्रश्न के उत्तर के लिए अपना IELTS Achievers खाता बनाएँ।" : "Academic or General Training: create your IELTS Achievers account for sample papers, mock tests and an answer to every question."))
                : portal === "competitive" ? (mode === "signin" ? (hi ? "अपनी प्रतियोगी परीक्षा की तैयारी जारी रखने के लिए साइन इन करें।" : "Sign in to continue your government and competitive exam preparation.") : (hi ? "अपनी लक्ष्य परीक्षा चुनें, फिर Exam Aspirants खाता बनाएँ।" : "Choose your target exam, then create your Exam Aspirants account."))
                : t(mode === "signin" ? "signinHelp" : "signupHelp")} /></p>
              {mode === "signup" && <p className={styles.trial}><ExpandedText text={hi ? "हर नया खाता 1 दिन के निःशुल्क ट्रायल से शुरू होता है: पूरी पहुँच, कोई कार्ड नहीं।" : "Every new account starts with a 1-day free trial: full access, no card needed."} /></p>}
              <LearningSlot surface={mode === "signin" ? "sign_in" : "sign_up"} page={mode === "signin" ? "sign-in" : "sign-up"} section="above-form" />
              {!error && linkError && <Alert variant="destructive" className={`error-banner ${styles.error}`}><AlertDescription><ExpandedText text={LINK_ERRORS[linkError][hi ? 1 : 0]} /></AlertDescription></Alert>}
              {error && <Alert variant="destructive" className={`error-banner ${styles.error}`}><AlertDescription><ExpandedText text={t(error)} /></AlertDescription></Alert>}
              {(error === "email_not_confirmed" || linkError === "link_expired") && <p className={styles.switchRow}>{resendButton}</p>}
              <Button type="button" variant="outline" className={styles.google} disabled={busy || !hydrated} onClick={continueWithGoogle}>
                <GoogleMark /><ExpandedText text={mode === "signin" ? (hi ? "Google से साइन इन करें" : "Sign in with Google") : (hi ? "Google से साइन अप करें" : "Sign up with Google")} />
              </Button>
              <p className={styles.divider}><ExpandedText text={hi ? "या ईमेल से" : "or with email"} /></p>
              {/* method="post": even before hydration a submit never puts anything in the URL. */}
              <form method="post" onSubmit={submit} className={styles.form}>
                {mode === "signup" && (
                  // The hint sits outside the label so it describes the field
                  // without becoming part of its accessible name.
                  <Field className={styles.field}>
                    <FieldLabel className={styles.label} htmlFor="auth-name"><ExpandedText text={t("fullName")} /></FieldLabel>
                    <Input className={styles.input} id="auth-name" type="text" autoComplete="name" required maxLength={80} aria-describedby="auth-name-hint" value={name} onChange={e => setName(e.target.value)} />
                    <FieldDescription className={styles.hint} id="auth-name-hint"><ExpandedText text={t("fullNameHint")} /></FieldDescription>
                  </Field>
                )}
                <Field className={styles.field}>
                  <FieldLabel className={styles.label} htmlFor="auth-email"><ExpandedText text={t("email")} /></FieldLabel>
                  <Input className={styles.input} id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </Field>
                <Field className={styles.field}>
                  <FieldLabel className={styles.label} htmlFor="auth-password"><ExpandedText text={t("password")} /></FieldLabel>
                  <InputGroup className={styles.passwordBox}>
                    <InputGroupInput className={styles.passwordInput} id="auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={6} aria-describedby={mode === "signup" ? "auth-password-hint" : undefined} value={password} onChange={e => setPassword(e.target.value)} />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton className={styles.eye} size="icon-sm" aria-controls="auth-password" aria-pressed={showPassword} aria-label={showPassword ? t("hidePassword") : t("showPassword")} onClick={() => setShowPassword(value => !value)}>
                        {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {mode === "signup" && <FieldDescription className={styles.hint} id="auth-password-hint"><ExpandedText text={t("authPasswordHint")} /></FieldDescription>}
                </Field>
                {mode === "signin" && <Button type="button" variant="link" className={`${styles.switchLink} ${styles.forgot}`} disabled={busy} onClick={() => { setError(null); setForgot(true); }}><ExpandedText text={hi ? "पासवर्ड भूल गए?" : "Forgot password?"} /></Button>}
                <Button className={styles.submit} type="submit" disabled={busy || !hydrated} aria-busy={busy || !hydrated}><ExpandedText text={busy || !hydrated ? t("loading") : t(mode === "signin" ? "signin" : "signup")} /></Button>
              </form>
              {mode === "signup" && (error === "user_already_exists" || error === "portal_existing_login") && <p className={styles.switchRow}><Link className={styles.switchLink} href={`${here.signIn}?email=${encodeURIComponent(email.trim())}${`&redirect=${encodeURIComponent(destination)}`}`}><ExpandedText text={t("signin")} /><ArrowUpRight size={15} aria-hidden="true" /></Link></p>}
              {mode === "signin" && <p className={styles.switchRow}><Button type="button" variant="link" className={styles.switchLink} disabled={busy} onClick={() => void sendLink()}><ExpandedText text={hi ? "पासवर्ड नहीं है? मुझे साइन-इन लिंक ईमेल करें" : "No password? Email me a sign-in link"} /></Button></p>}
              <p className={styles.switchRow}><Link className={styles.switchLink} href={`${mode === "signin" ? here.signUp : here.signIn}${query}`}><ExpandedText text={t(mode === "signin" ? "noAccount" : "haveAccount")} /></Link></p>
              {(error === "no_exams_account" || error === "no_tech_account") && <p className={styles.switchRow}><Link className={styles.switchLink} href={`${here.signUp}?email=${encodeURIComponent(email.trim())}`}>Create your {here.name} account<ArrowUpRight size={15} aria-hidden="true" /></Link></p>}
              {others.length > 0 && <p className={styles.otherPortal}>{others.map((other, index) => <span key={other}>{index > 0 && " "}Looking for {PORTALS[other].tagline.split(" · ")[0]}? <Link href={mode === "signin" ? PORTALS[other].signIn : PORTALS[other].signUp}>Go to {PORTALS[other].name}</Link>.</span>)} {others.length > 1 ? "Each portal uses a separate account." : "The portals use separate accounts."}</p>}
              {mode === "signup" && <p className={styles.hint}>{language === "hi"
                ? <>खाता बनाकर आप हमारे <Link href="/terms">नियम और शर्तें</Link> और <Link href="/privacy">गोपनीयता नीति</Link> स्वीकार करते हैं।</>
                : <>By creating an account you agree to our <Link href="/terms">Terms &amp; conditions</Link> and <Link href="/privacy">Privacy policy</Link>.</>}</p>}
              <LearningSlot surface={mode === "signin" ? "sign_in" : "sign_up"} page={mode === "signin" ? "sign-in" : "sign-up"} section="below-form" />
            </section>
          )}
        </div>
      </main>
      <AuthStory mode={mode} portal={portal} />
    </div>
  );
}
