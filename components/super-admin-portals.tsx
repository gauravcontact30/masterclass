"use client";
import { useEffect, useState } from "react";
import Link from "@/components/site-link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { Portal } from "@/lib/portal";
import styles from "./super-admin-dashboard.module.css";

/*
 * Super Admin → Portals: one page per audience (Tech Pro, Board Scholars, Exam Aspirants), each a separate account
 * type. Shows accounts and sign-ups, active memberships, traffic to the portal and its blog in the reporting window,
 * what the portal holds, and the newest accounts. Reads /api/super-admin/portals once a minute.
 */
type Report = {
  portal: Portal; name: string; audience: string; home: string; blogName: string;
  accounts: number | null; new7: number | null; new30: number | null; paying: number | null; views7: number | null; blogViews7: number | null;
  content: { label: string; value: string }[]; recent: { name: string | null; created_at: string }[];
};
type Data = { portals: Report[]; legacyExams: number | null; windowDays: number; generatedAt: string };
const n = (value: number | null) => value === null ? "—" : new Intl.NumberFormat("en-IN").format(value);
const when = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(iso));

export function SuperAdminPortal({ portal, days }: { portal: Portal; days: number }) {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`/api/super-admin/portals?days=${days}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("failed");
        setData(await response.json() as Data); setFailed(false);
      } catch { if (!controller.signal.aborted) setFailed(true); }
    };
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [days]);

  const report = data?.portals.find(item => item.portal === portal);
  if (failed && !data) return <p className={styles.error} role="status"><AlertTriangle size={14} aria-hidden="true" /> Portal reports are unavailable right now; retrying every minute.</p>;
  if (!report) return <p className={styles.empty} aria-busy="true">Loading portal report…</p>;
  const exam = portal !== "tech";
  return <>
    <div className={styles.panel}>
      <div className={styles.panelHeading}><h2>{report.name}</h2><span>{report.audience}</span></div>
      <p>A separate account type with its own sign-in, dashboard, blog ({report.blogName}), free trial and membership. <Link href={report.home}>Open {report.name} <ExternalLink size={11} aria-hidden="true" /></Link></p>
      {report.accounts === null && <p className={styles.note}><AlertTriangle size={13} aria-hidden="true" /> Account counts need migrations 0054_portal_accounts.sql and 0055_three_portals.sql.</p>}
    </div>
    <div className={styles.metrics}>
      <div className={styles.metric}><span>Accounts</span><strong>{n(report.accounts)}</strong><small>{exam && data?.legacyExams ? `Plus ${n(data.legacyExams)} legacy Exams accounts that open both exam portals` : "All time"}</small></div>
      <div className={styles.metric}><span>New accounts</span><strong>{n(report.new7)}</strong><small>Last 7 days · {n(report.new30)} in 30 days</small></div>
      <div className={styles.metric}><span>Active memberships</span><strong>{n(report.paying)}</strong><small>Paid subscriptions held by {report.name} accounts</small></div>
      <div className={styles.metric}><span>Page views</span><strong>{n(report.views7)}</strong><small>Portal pages, last {data?.windowDays} days (bots excluded)</small></div>
      <div className={styles.metric}><span>{report.blogName} views</span><strong>{n(report.blogViews7)}</strong><small>Blog pages, last {data?.windowDays} days</small></div>
    </div>
    <div className={styles.panel}>
      <h2>What the portal holds</h2>
      <div className={styles.metrics}>{report.content.map(item => <div key={item.label} className={styles.metric}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
    </div>
    <div className={styles.panel}>
      <div className={styles.panelHeading}><h2>Newest {report.name} accounts</h2><span>Updated {data ? when(data.generatedAt) : ""}</span></div>
      {report.recent.length ? <div className={styles.tableWrap}><table>
        <thead><tr><th scope="col">Name</th><th scope="col">Joined</th></tr></thead>
        <tbody>{report.recent.map((row, index) => <tr key={`${row.created_at}-${index}`}><td>{row.name ?? "—"}</td><td>{when(row.created_at)}</td></tr>)}</tbody>
      </table></div> : <p className={styles.empty}>No {report.name} accounts yet.</p>}
    </div>
  </>;
}
