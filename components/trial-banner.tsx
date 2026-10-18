"use client";
import { useEffect, useState } from "react";
import { Clock3, Sparkles } from "lucide-react";
import type { Tier } from "@/lib/domain";
import styles from "./trial-banner.module.css";

const left = (ms: number, hi: boolean) => {
  const minutes = Math.max(0, Math.ceil(ms / 60_000)), h = Math.floor(minutes / 60), m = minutes % 60;
  return hi ? (h ? `${h} घंटे ${m} मिनट` : `${m} मिनट`) : (h ? `${h}h ${m}m` : `${m}m`);
};

/**
 * The one-day trial, as the learner sees it: a countdown with a "Choose plan" action while it runs, and a
 * plain notice once it has ended (the plans screen below it takes over). Paid members never see it.
 */
export function TrialBanner({ tier, endsAt, hi, onPlans, onExpired }: { tier: Tier; endsAt: string | null | undefined; hi: boolean; onPlans: () => void; onExpired: () => void }) {
  const end = Date.parse(endsAt ?? "");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (tier !== "trial" || !Number.isFinite(end)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    // Re-check access the moment the trial runs out, so content locks without a manual refresh.
    const expiry = window.setTimeout(onExpired, Math.max(0, Math.min(end - Date.now() + 1_000, 2 ** 31 - 1)));
    return () => { window.clearInterval(timer); window.clearTimeout(expiry); };
  }, [tier, end, onExpired]);
  if (!Number.isFinite(end) || (tier !== "trial" && tier !== "free")) return null;
  if (tier === "free") return <div className={styles.banner} data-state="ended" role="status">
    <Clock3 size={18} aria-hidden="true" />
    <p><strong>{hi ? "आपका 1-दिन का निःशुल्क ट्रायल समाप्त हो गया है।" : "Your 1-day free trial has ended."}</strong> {hi ? "सीखना जारी रखने के लिए मासिक या वार्षिक सदस्यता चुनें।" : "Choose a monthly or yearly membership to keep learning."}</p>
  </div>;
  const remaining = end - now, share = Math.min(1, Math.max(0, remaining / 86_400_000));
  return <div className={styles.banner} data-state="active" role="status">
    <Sparkles size={18} aria-hidden="true" />
    <p><strong>{hi ? "निःशुल्क ट्रायल चालू है" : "Free trial active"}</strong> · {hi ? `पूरी पहुँच, ${left(remaining, true)} शेष` : `full access, ${left(remaining, false)} left`}</p>
    <span className={styles.meter} aria-hidden="true"><i style={{ width: `${share * 100}%` }} /></span>
    <button type="button" className={styles.cta} onClick={onPlans}>{hi ? "प्लान चुनें" : "Choose plan"}</button>
  </div>;
}
