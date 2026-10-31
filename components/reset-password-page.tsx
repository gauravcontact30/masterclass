"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ExpandedText } from "@/components/expanded-text";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { setAuthNotice } from "@/lib/auth-notice";
import { browserAuth } from "@/lib/supabase-browser-lazy";
import { hardNavigate } from "@/lib/hard-navigate";
import type { TranslationKey } from "@/lib/i18n";
import { authErrorKey } from "./auth-page";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
import { Wordmark } from "./brand-mark";
import { AuthStory } from "./auth-carousel";
import styles from "./auth-page.module.css";

/**
 * Where password-reset links land (via /auth/callback or /auth/confirm, which have already signed the reader in), and
 * where Settings sends a signed-in reader to change or first set a password (Google-only accounts have none).
 * Without a session the link was expired, reused or opened in another browser, so this page asks for a new one.
 */
export function ResetPasswordPage() {
  const { t, language } = useLanguage();
  const hi = language === "hi";
  const [status, setStatus] = useState<"checking" | "ready" | "missing">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    browserAuth().then(auth => auth.getUser())
      .then(({ data }) => { if (live) setStatus(data.user ? "ready" : "missing"); })
      .catch(() => { if (live) setStatus("missing"); });
    return () => { live = false; };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null); setMessage(null);
    if (password !== confirm) { setMessage(hi ? "दोनों पासवर्ड एक जैसे नहीं हैं।" : "The two passwords do not match."); return; }
    setBusy(true);
    let leaving = false;
    try {
      const { error } = await (await browserAuth()).updateUser({ password });
      if (error?.code === "same_password") { setMessage(hi ? "नया पासवर्ड पुराने से अलग होना चाहिए।" : "Choose a password different from your current one."); return; }
      if (error) { setError(authErrorKey(error)); return; }
      setAuthNotice("password_updated");
      leaving = true; hardNavigate("/learning");
    } catch { setError("service_error"); } finally { if (!leaving) setBusy(false); }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.topBar}>
          <Link className={styles.back} href="/"><ArrowLeft size={15} aria-hidden="true" /><ExpandedText text={t("authBackHome")} /></Link>
        </div>
        <div className={styles.formWrap}>
          <div className={styles.brand}><Wordmark /></div>
          {status === "missing" ? (
            <section className={styles.notice}>
              <span className={styles.noticeIcon}><KeyRound size={20} aria-hidden="true" /></span>
              <h1 className={styles.title}><ExpandedText text={hi ? "रीसेट लिंक काम नहीं कर रहा" : "This reset link is not active"} /></h1>
              <p className={styles.lead}><ExpandedText text={hi ? "लिंक समाप्त हो गया है, पहले उपयोग हो चुका है, या किसी दूसरे ब्राउज़र में खोला गया है। साइन-इन पेज पर “पासवर्ड भूल गए?” से नया लिंक मँगवाएँ।" : "It has expired, was already used, or was opened in a different browser. Ask for a new one with “Forgot password?” on the sign-in page."} /></p>
              <Link className={styles.switchLink} href="/sign-in"><ExpandedText text={t("signin")} /><ArrowUpRight size={15} aria-hidden="true" /></Link>
            </section>
          ) : (
            <section>
              <h1 className={styles.title}><ExpandedText text={hi ? "नया पासवर्ड चुनें" : "Choose a new password"} /></h1>
              <p className={styles.lead}><ExpandedText text={hi ? "वह पासवर्ड सेट करें जिससे आप आगे अपने ईमेल के साथ साइन इन करेंगे।" : "Set the password you will use with your email to sign in from now on."} /></p>
              {message && <p className={`error-banner ${styles.error}`} role="alert"><ExpandedText text={message} /></p>}
              {error && <p className={`error-banner ${styles.error}`} role="alert"><ExpandedText text={t(error)} /></p>}
              <form method="post" onSubmit={submit} className={styles.form}>
                <div className={styles.field}>
                  <Label className={styles.label} htmlFor="reset-password"><ExpandedText text={hi ? "नया पासवर्ड" : "New password"} /></Label>
                  <div className={styles.passwordBox}>
                    <Input className={styles.input} id="reset-password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={6} aria-describedby="reset-password-hint" value={password} onChange={e => setPassword(e.target.value)} />
                    <Button className={styles.eye} type="button" aria-controls="reset-password reset-confirm" aria-pressed={showPassword} aria-label={showPassword ? t("hidePassword") : t("showPassword")} onClick={() => setShowPassword(value => !value)}>
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </Button>
                  </div>
                  <small className={styles.hint} id="reset-password-hint"><ExpandedText text={t("authPasswordHint")} /></small>
                </div>
                <div className={styles.field}>
                  <Label className={styles.label} htmlFor="reset-confirm"><ExpandedText text={hi ? "पासवर्ड दोबारा लिखें" : "Confirm new password"} /></Label>
                  <Input className={styles.input} id="reset-confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)} />
                </div>
                <Button className={styles.submit} type="submit" disabled={busy || status !== "ready"} aria-busy={busy || status === "checking"}>
                  <ExpandedText text={busy || status === "checking" ? t("loading") : (hi ? "पासवर्ड सेव करें" : "Save new password")} />
                </Button>
              </form>
            </section>
          )}
        </div>
      </main>
      <AuthStory mode="signin" />
    </div>
  );
}
