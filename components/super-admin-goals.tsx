"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Target } from "lucide-react";
import styles from "./super-admin-goals.module.css";

type Goal = { name: string; total: number; today: number; people: number; daily: number[] };
type Recent = { name: string; at: string; path: string; params: Record<string, string>; signedIn: boolean };
type Data = { days: string[]; capped: boolean; generatedAt: string; goals: Goal[]; recent: Recent[] };

const n = (value: number) => new Intl.NumberFormat("en-IN").format(value);
const label = (name: string) => name.replace(/[_-]+/g, " ").replace(/^./, c => c.toUpperCase());
const time = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** Overview → Goals: the custom actions visitors completed (lib/goals.ts), last 7 days, with a bar per day. Reads once a minute. */
export function SuperAdminGoals() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<"" | "migration" | "failed">("");
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/super-admin/goals", { cache: "no-store", signal: controller.signal });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) { setError(body.error === "migration_required" ? "migration" : "failed"); return; }
        setData(body as Data); setError("");
      } catch { if (!controller.signal.aborted) setError(current => current || "failed"); }
    };
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);

  return <section className={styles.goals} aria-labelledby="ov-goals-title">
    <header><span aria-hidden="true"><Target size={17} /></span><div><h3 id="ov-goals-title">Goals</h3><p>Actions visitors completed, last 7 days. Also sent to DataFast.</p></div></header>
    {error === "migration" && <p className={styles.warn} role="status"><AlertTriangle size={14} aria-hidden="true" />Apply migration 0053_site_goals.sql to start recording goals here.</p>}
    {error === "failed" && !data && <p className={styles.warn} role="status"><AlertTriangle size={14} aria-hidden="true" />Goals are unavailable right now; retrying.</p>}
    {data && (data.goals.length ? <>
      <ul className={styles.list}>
        {data.goals.map(goal => { const peak = Math.max(1, ...goal.daily); return <li key={goal.name}>
          <div><b>{label(goal.name)}</b><code>{goal.name}</code></div>
          <div className={styles.bars} role="img" aria-label={`${label(goal.name)} per day, last 7 days: ${goal.daily.join(", ")}`}>{goal.daily.map((count, i) => <i key={data.days[i]} style={{ height: `${Math.max(6, (count / peak) * 100)}%` }} title={`${data.days[i]}: ${n(count)}`} />)}</div>
          <dl><div><dt>Today</dt><dd>{n(goal.today)}</dd></div><div><dt>7 days</dt><dd>{n(goal.total)}</dd></div><div><dt>People</dt><dd>{n(goal.people)}</dd></div></dl>
        </li>; })}
      </ul>
      <details className={styles.recent}><summary>Latest {data.recent.length} goals</summary>
        <ol>{data.recent.map((item, i) => <li key={`${item.at}-${i}`}><b>{label(item.name)}</b><span>{item.path}</span><span>{item.signedIn ? "signed in" : "guest"}</span><time dateTime={item.at}>{time(item.at)} IST</time></li>)}</ol>
      </details>
      {data.capped && <p className={styles.note}>Showing the newest 20,000 goals of the week.</p>}
    </> : <p className={styles.empty}>No goals recorded in the last 7 days yet. They appear here as visitors sign up, sign in, start checkout and open stories.</p>)}
  </section>;
}
