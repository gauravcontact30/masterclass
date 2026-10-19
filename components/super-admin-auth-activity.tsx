"use client";

import { History, RefreshCw, ShieldCheck } from "lucide-react";
import { AdminTable, type AdminColumn } from "./super-admin-table";
import styles from "./super-admin-auth-activity.module.css";

type Row = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" && value.trim() ? value : "";

function timestamp(value: unknown, fallback = "Not recorded") {
  const raw = text(value);
  if (!raw) return fallback;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Invalid timestamp";
  return <time dateTime={raw}>{new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium", timeStyle: "long", timeZone: "UTC",
  }).format(date)}</time>;
}

const sessionsColumns: AdminColumn[] = [
  { key: "account", label: "Account", filter: false },
  { key: "user_id", label: "User ID", filter: false },
  { key: "id", label: "Session ID", filter: false },
  { key: "ip", label: "IP address", filter: false },
  { key: "user_agent", label: "Browser / device (reported)", filter: false },
  { key: "created_at", label: "Session created", render: row => timestamp(row.created_at) },
  { key: "updated_at", label: "Last session update", render: row => timestamp(row.updated_at) },
  { key: "not_after", label: "Recorded expiry", render: row => timestamp(row.not_after, "No explicit expiry recorded") },
];
const loginColumns: AdminColumn[] = [
  { key: "action", label: "Auth event", render: row => <span className={styles.event}>{text(row.action) || "Not recorded"}</span> },
  { key: "created_at", label: "Event time", render: row => timestamp(row.created_at) },
  { key: "account", label: "Actor account", filter: false },
  { key: "actor_id", label: "Actor ID", filter: false },
  { key: "ip_address", label: "IP address", filter: false },
  { key: "id", label: "Event ID", filter: false },
];

/** Read-only inspection uses the same authorized snapshot as the dashboard. */
export function SuperAdminAuthActivity({ sessions, logins, users, query, days, generatedAt, refreshing, onRefresh }: {
  sessions: Row[]; logins: Row[]; users: Row[]; query: string; days: number;
  generatedAt: string; refreshing: boolean; onRefresh: () => void;
}) {
  const accounts = new Map(users.map(user => [text(user.id), text(user.email)]));
  const sessionRows = sessions.map(row => ({ ...row, account: accounts.get(text(row.user_id)) || "Not in loaded user directory" }));
  const loginRows = logins.map(row => ({ ...row, account: accounts.get(text(row.actor_id)) || (text(row.actor_id) ? "Not in loaded user directory" : "Actor not recorded") }));
  const refresh = (label: string) => <button type="button" className={styles.refresh} onClick={onRefresh} disabled={refreshing} title={`Refresh ${label}`} aria-label={`Refresh ${label}`}>
    <RefreshCw size={14} aria-hidden="true" />{refreshing ? "Refreshing…" : "Refresh"}
  </button>;
  return <div className={styles.stack}>
    <section className={styles.section} data-tone="sky" aria-label="Authentication session records">
      <div className={styles.overview}>
        <ShieldCheck size={22} aria-hidden="true" />
        <div><h2>Session overview</h2><p>Inspect stored sign-in sessions, device details and recorded expiry. A stored session does not establish that someone is currently online.</p></div>
      </div>
      <dl className={styles.metrics}>
        <div><dt>Sessions loaded</dt><dd>{sessions.length}</dd></div>
        <div><dt>Distinct users in snapshot</dt><dd>{new Set(sessions.map(row => text(row.user_id)).filter(Boolean)).size}</dd></div>
        <div><dt>Without explicit expiry</dt><dd>{sessions.filter(row => !text(row.not_after)).length}</dd></div>
      </dl>
      <div className={styles.records}>
        <AdminTable title="Auth sessions" rows={sessionRows} columns={sessionsColumns} query={query}
          actions={refresh("Auth sessions")} rowKey={(row, index) => text(row.id) || String(index)}
          empty="No session records match the current search or filters."
          note="Up to 200 stored sessions with no explicit expiry or an expiry after the snapshot query. Auth timeout and revocation rules still apply. Last session update is not a last-online timestamp. Dates are shown in UTC; date filters use Session created." />
      </div>
      <p className={styles.footnote}>To end a user&apos;s sessions, use their account menu in the user directory above and choose “Sign out everywhere”. Snapshot fetched: {timestamp(generatedAt)}.</p>
    </section>
    <section className={styles.section} data-tone="lavender" aria-label="Authentication audit history">
      <div className={styles.overview}>
        <History size={22} aria-hidden="true" />
        <div><h2>Sign-in audit overview</h2><p>Review recorded authentication events and the actor and IP address attached to each event. Event names are preserved as supplied by Auth.</p></div>
      </div>
      <dl className={styles.metrics}>
        <div><dt>Events loaded</dt><dd>{logins.length}</dd></div>
        <div><dt>Distinct event types</dt><dd>{new Set(logins.map(row => text(row.action)).filter(Boolean)).size}</dd></div>
        <div><dt>Requested history</dt><dd>{days} {days === 1 ? "day" : "days"}</dd></div>
      </dl>
      <div className={styles.records}>
        <AdminTable title="Login history" rows={loginRows} columns={loginColumns} query={query}
          actions={refresh("Login history")} rowKey={(row, index) => text(row.id) || String(index)}
          empty="No auth events match the current search or filters."
          note="Up to 200 recent Auth audit events within the selected dashboard period, not a count of successful logins. Coverage and retention depend on your Auth configuration. Dates are shown in UTC; date filters use Event time." />
      </div>
      <p className={styles.footnote}>Summary counts describe the loaded snapshot before filters. Account emails appear only when the actor is in the loaded user directory. Search, sort and export the records below each overview.</p>
    </section>
  </div>;
}
