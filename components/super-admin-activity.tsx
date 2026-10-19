"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppWindow, ArrowLeft, Clock, Compass, Download, Globe, Laptop, Megaphone, Monitor, MonitorSmartphone, Smartphone, Tablet, Terminal, MousePointerClick, Radio, RefreshCw, UserPlus, UserRound, Users } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AdminError, AdminLoading } from "./super-admin-feedback";
import { AdminTable } from "./super-admin-table";
import { SuperAdminHourly } from "./super-admin-hourly";
import { SuperAdminLocations } from "./super-admin-locations";
import { locationLabel } from "@/lib/visitor-location";
import { AudienceExplorer } from "./super-admin-audience";
import { siAndroid, siApple, siBrave, siFacebook, siFirefoxbrowser, siGoogle, siGooglechrome, siInstagram, siIos, siLinux, siMacos, siOpera, siSafari, siSamsung, siUbuntu, siWhatsapp, siYoutube, type SimpleIcon } from "simple-icons";
import shell from "./super-admin-dashboard.module.css";
import styles from "./super-admin-activity.module.css";

type Row = Record<string, unknown>;
type Activity = {
  generatedAt: string;
  totals: Record<"pageViews" | "visitors" | "people" | "sessions" | "signedInUsers" | "newVisitors" | "newAccounts" | "liveNow" | "liveSignedIn" | "bots", number> & { bounceRate: number | null; avgSessionSeconds: number | null; pagesPerSession: number | null };
  daily: { day: string; views: number; visitors: number; new_visitors: number; users: number }[];
  hours: { hour: number; views: number }[];
  pages: Row[]; referrers: Row[]; campaigns: Row[]; countries: Row[]; cities: Row[]; devices: Row[]; browsers: Row[]; systems: Row[];
  people: Row[]; recent: Row[];
};
type Timeline = { account: Row | null; visits: Row[]; devices: Row[]; logins: Row[]; events: Row[] };

const show = (value: unknown) => value === null || value === undefined || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
const when = (value: unknown) => value ? new Date(String(value)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const ago = (value: unknown) => {
  if (!value) return "—";
  const seconds = Math.max(0, (Date.now() - new Date(String(value)).getTime()) / 1000);
  return seconds < 60 ? "just now" : seconds < 3600 ? `${Math.round(seconds / 60)} min ago` : seconds < 86400 ? `${Math.round(seconds / 3600)} h ago` : `${Math.round(seconds / 86400)} d ago`;
};
const duration = (seconds: number | null | undefined) => seconds == null ? "—" : seconds < 60 ? `${Math.round(seconds)} s` : `${Math.floor(seconds / 60)} m ${Math.round(seconds % 60)} s`;
const number = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-IN").format(value);
const errorText = (code: string) => code === "migration_required"
  ? "User activity is not set up in the database yet. Apply supabase/migrations/0023_user_activity.sql (and 0020 for the support tools), then reload."
  : "User activity could not be loaded. Check the database connection and try again.";

/** The super admin's User activities page: every visit by anonymous visitors and signed-in learners, live and over time. */
export function SuperAdminActivity({ days, query }: { days: number; query: string }) {
  const [data, setData] = useState<Activity | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [person, setPerson] = useState<{ key: string; label: string } | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/super-admin/activity?days=${days}`, { cache: "no-store", signal });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) setData(null);
      if (!response.ok) throw new Error(body.error ?? "service_error");
      if (!signal?.aborted) { setData(body); setError(""); }
    } catch (e) { if (!signal?.aborted && !(e instanceof DOMException)) setError(errorText(e instanceof Error ? e.message : "")); }
    finally { if (!signal?.aborted) setBusy(false); }
  }, [days]);
  // Live figures move quickly, so this page refreshes every 30 seconds while it is visible.
  useEffect(() => {
    const controller = new AbortController(); queueMicrotask(() => { if (!controller.signal.aborted) void refresh(controller.signal); });
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(controller.signal); }, 30_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [refresh]);

  if (person) return <PersonTimeline person={person} onBack={() => setPerson(null)} />;
  if (error && !data) return <AdminError>{error}<Button variant="outline" disabled={busy} onClick={() => void refresh()}>Retry activity</Button></AdminError>;
  if (!data) return <AdminLoading>Loading user activity…</AdminLoading>;
  const t = data.totals;
  const returning = Math.max(0, t.visitors - t.newVisitors);

  return <div className={styles.activity}>
    {error && <AdminError>{error} Showing the last successful snapshot; figures may be out of date.</AdminError>}
    <div className={styles.liveBar}>
      <span className={styles.livePulse} aria-hidden="true" />
      <strong>{number(t.liveNow)}</strong> on the site now <span className={styles.liveSub}>({number(t.liveSignedIn)} signed in · active in the last 5 minutes)</span>
      <span className={styles.liveActions}>
        <span className={styles.updated}>Updated {ago(data.generatedAt)}</span>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => void refresh()}><RefreshCw size={14} />Refresh</Button>
        <a className={styles.export} href={`/api/super-admin/activity/export?days=${days}`} download><Download size={14} />Export CSV</a>
      </span>
    </div>

    <div className={styles.metrics}>
      <Stat icon={<MousePointerClick size={16} />} label="Page views" value={number(t.pageViews)} note={`${t.pagesPerSession ?? "—"} pages per session`} />
      <Stat icon={<Users size={16} />} label="Unique visitors" value={number(t.visitors)} note={`${number(t.people)} people after linking sign-ins`} />
      <Stat icon={<UserPlus size={16} />} label="New vs returning" value={`${number(t.newVisitors)} / ${number(returning)}`} note="First visit in this window vs seen before" />
      <Stat icon={<UserRound size={16} />} label="Signed-in learners" value={number(t.signedInUsers)} note={`${number(t.newAccounts)} new accounts created`} />
      <Stat icon={<Radio size={16} />} label="Sessions" value={number(t.sessions)} note="A session ends after 30 idle minutes" />
      <Stat icon={<Clock size={16} />} label="Avg. session" value={duration(t.avgSessionSeconds)} note="Time between first and last activity, or time read" />
      <Stat icon={<ArrowLeft size={16} />} label="Bounce rate" value={t.bounceRate == null ? "—" : `${t.bounceRate}%`} note="Sessions that viewed a single page" />
      <Stat icon={<MonitorSmartphone size={16} />} label="Bots filtered" value={number(t.bots)} note="Crawlers and scripts, kept out of every figure" />
    </div>

    <div className={styles.charts}>
      <Card className={`${shell.panel} ${styles.chartCard}`}>
        <div className={shell.panelHeading}><h2>Daily traffic</h2><span className={styles.legend}><i data-key="views" />Page views <i data-key="visitors" />Visitors <i data-key="new" />New</span></div>
        <DailyChart rows={data.daily} />
      </Card>
      <SuperAdminHourly />
    </div>

    <SuperAdminLocations days={days} query={query} />
    <AudienceExplorer days={days} fallback={{ countries: data.countries, cities: data.cities, pages: data.pages, referrers: data.referrers }} />

    <div className={styles.breakdowns}>
      <Breakdown title="Devices" icon={<MonitorSmartphone size={16} />} tone="sky" rows={data.devices} label="device" value="visitors" rowIcon={row => deviceIcon(show(row.device))} />
      <Breakdown title="Browsers" icon={<Compass size={16} />} tone="lavender" rows={data.browsers} label="browser" value="visitors" rowIcon={row => brandIcon(show(row.browser), BROWSER_MARKS, <Globe size={15} />)} />
      <Breakdown title="Operating systems" icon={<Terminal size={16} />} tone="mint" rows={data.systems} label="os" value="visitors" rowIcon={row => brandIcon(show(row.os), OS_MARKS, <AppWindow size={15} />)} />
      <Breakdown title="Campaigns (UTM)" icon={<Megaphone size={16} />} tone="peach" rowIcon={row => brandIcon(show(row.source), CAMPAIGN_MARKS, <Megaphone size={15} />)} rows={data.campaigns} label="source" value="views" extra={row => `${show(row.medium)} · ${show(row.campaign)}`} empty="No tagged links visited yet. Add ?utm_source=… to links you share." />
    </div>

    <People rows={data.people} query={query} onOpen={(key, label) => setPerson({ key, label })} />
    <VisitLog rows={data.recent} query={query} onOpen={(key, label) => setPerson({ key, label })} />
    <p className={shell.note}>Visits are recorded by a first-party beacon on every page (super admin pages excluded). IP addresses are stored masked; a visitor who signs in is linked to their account for their earlier visits on the same browser. Visits are kept for 180 days.</p>
  </div>;
}

function Stat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <Card className={styles.stat}><span className={styles.statLabel}>{icon}{label}</span><strong>{value}</strong><small>{note}</small></Card>;
}

function DailyChart({ rows }: { rows: Activity["daily"] }) {
  if (!rows.length) return <p className={shell.empty}>No visits recorded in this window yet.</p>;
  const max = Math.max(1, ...rows.map(row => row.views));
  return <div className={styles.daily} role="img" aria-label={`Daily page views and visitors over ${rows.length} days`}>
    {rows.map(row => <div key={row.day} className={styles.dayCol} title={`${row.day}: ${row.views} views, ${row.visitors} visitors, ${row.new_visitors} new, ${row.users} signed in`}>
      <div className={styles.bars}>
        <span data-key="views" style={{ height: `${(row.views / max) * 100}%` }} />
        <span data-key="visitors" style={{ height: `${(row.visitors / max) * 100}%` }} />
        <span data-key="new" style={{ height: `${(row.new_visitors / max) * 100}%` }} />
      </div>
      <small>{new Date(`${row.day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small>
    </div>)}
  </div>;
}



// Brand marks (simple-icons, CC0) for the browsers and systems it covers. Windows and Edge are not in simple-icons,
// so they and anything unrecognised get a neutral Lucide icon. Black marks are drawn in ink so they read on the tint.
const BROWSER_MARKS: [RegExp, SimpleIcon][] = [[/samsung/i, siSamsung], [/opera/i, siOpera], [/brave/i, siBrave], [/firefox/i, siFirefoxbrowser], [/safari/i, siSafari], [/chrome|chromium/i, siGooglechrome]];
const OS_MARKS: [RegExp, SimpleIcon][] = [[/android/i, siAndroid], [/ios|iphone|ipad/i, siIos], [/mac/i, siMacos], [/ubuntu/i, siUbuntu], [/linux/i, siLinux], [/apple/i, siApple]];
const CAMPAIGN_MARKS: [RegExp, SimpleIcon][] = [[/^(ig|insta)/i, siInstagram], [/^(fb|facebook|meta)/i, siFacebook], [/youtube|^yt$/i, siYoutube], [/whatsapp|^wa$/i, siWhatsapp], [/google|^g$/i, siGoogle]];
function SimpleMark({ icon }: { icon: SimpleIcon }) {
  return <svg viewBox="0 0 24 24" width={15} height={15} fill={icon.hex === "000000" ? "#3d3d3a" : `#${icon.hex}`}><path d={icon.path} /></svg>;
}
function brandIcon(name: string, marks: [RegExp, SimpleIcon][], fallback: React.ReactNode) {
  const hit = marks.find(([pattern]) => pattern.test(name));
  if (hit) return <SimpleMark icon={hit[1]} />;
  if (/edge/i.test(name)) return <Globe size={15} />;
  if (/windows/i.test(name)) return <Monitor size={15} />;
  return fallback;
}
function deviceIcon(name: string) {
  const key = name.toLowerCase();
  if (key.includes("tablet")) return <Tablet size={15} />;
  if (key.includes("mobile") || key.includes("phone")) return <Smartphone size={15} />;
  return key.includes("desktop") ? <Monitor size={15} /> : <Laptop size={15} />;
}

function Breakdown({ title, icon, rows, label, value, extra, empty, rowIcon, tone }: { title: string; icon?: React.ReactNode; rows: Row[]; label: string; value: string; extra?: (row: Row) => string; empty?: string; rowIcon?: (row: Row) => React.ReactNode; tone?: string }) {
  const max = Math.max(1, ...rows.map(row => Number(row[value]) || 0));
  return <Card className={`${shell.panel} ${styles.breakdown}`} data-tone={tone}>
    <h2>{icon && <span className={styles.titleIcon} aria-hidden="true">{icon}</span>}{title}</h2>
    {rows.length ? <ol>{rows.slice(0, 10).map((row, i) => <li key={`${show(row[label])}-${i}`}>
      <span className={styles.barFill} style={{ width: `${((Number(row[value]) || 0) / max) * 100}%` }} />
      {rowIcon && <span className={styles.rowIcon} aria-hidden="true">{rowIcon(row)}</span>}
      <span className={styles.barLabel} title={show(row[label])}>{show(row[label])}{extra && <small>{extra(row)}</small>}</span>
      <strong>{number(Number(row[value]))}</strong>
    </li>)}</ol> : <p className={shell.empty}>{empty ?? "No data in this window yet."}</p>}
  </Card>;
}

function People({ rows, query, onOpen }: { rows: Row[]; query: string; onOpen: (key: string, label: string) => void }) {
  // Flattened so search, suggestions and filters see what the table shows.
  const view = useMemo(() => rows.map(row => ({
    ...row, person_label: row.email ? String(row.email) : `Visitor ${String(row.person).slice(8, 16)}`,
    location: locationLabel(row), device_info: [row.device, row.browser, row.os].filter(Boolean).join(" · ") || null,
    time_on_site: duration(Number(row.engaged_seconds)),
  })), [rows]);
  return <AdminTable title="People" rows={view} query={query}
    note="Every signed-in learner and anonymous visitor in this window, most recent first. Open anyone for their full activity trail."
    rowKey={row => String(row.person)}
    columns={[
      { key: "person_label", label: "Person", render: row => <button type="button" className={styles.personLink} onClick={() => onOpen(String(row.person).startsWith("visitor:") ? String(row.person) : String(row.user_id), String(row.person_label))}>{String(row.person_label)}</button> },
      { key: "status", label: "Status", render: row => <span className={styles.status} data-status={String(row.status)}>{show(row.status)}</span> },
      { key: "last_seen", label: "Last seen", render: row => <span title={when(row.last_seen)}>{ago(row.last_seen)}</span> },
      "first_seen", { key: "views", label: "Views", filter: false }, { key: "sessions", label: "Sessions", filter: false }, { key: "time_on_site", label: "Time on site", filter: false },
      { key: "last_path", label: "Last page", filter: false, render: row => <span className={styles.path}>{show(row.last_path)}</span> },
      "location", { key: "device_info", label: "Device" },
    ]} />;
}

function VisitLog({ rows, query, onOpen }: { rows: Row[]; query: string; onOpen: (key: string, label: string) => void }) {
  const view = useMemo(() => rows.map(row => ({
    ...row, who: row.email ? String(row.email) : `Visitor ${String(row.visitor_id).slice(0, 8)}`, kind: row.event === "page_view" ? "view" : "exit",
    source: row.utm_source ?? row.referrer_host ?? null, location: locationLabel(row),
    device_info: [row.device, row.browser, row.os].filter(Boolean).join(" · ") || null, read_for: row.duration_ms == null ? null : duration(Number(row.duration_ms) / 1000),
  })), [rows]);
  return <AdminTable title="Visit log" rows={view} query={query} note="The latest 500 page views and page exits (with time read). Export CSV for the whole window."
    columns={[
      { key: "created_at", label: "Time", render: row => <span title={when(row.created_at)}>{ago(row.created_at)}</span> },
      { key: "who", label: "Who", filter: false, render: row => <><button type="button" className={styles.personLink} onClick={() => onOpen(row.user_id ? String(row.user_id) : `visitor:${String(row.visitor_id)}`, String(row.who))}>{String(row.who)}</button>{row.new_visitor ? <span className={styles.newTag}>new</span> : null}</> },
      { key: "kind", label: "Event", render: row => <span className={styles.event} data-event={String(row.event)}>{String(row.kind)}</span> },
      { key: "path", label: "Page", render: row => <span className={styles.path} title={show(row.title)}>{show(row.path)}</span> },
      "source", "location", { key: "ip_masked", label: "IP (masked)", filter: false }, { key: "device_info", label: "Device" }, { key: "screen", label: "Screen", filter: false }, "language", { key: "read_for", label: "Read for", filter: false },
    ]} />;
}


/** One person's complete trail: account, devices and locations, every visit, sign-ins and the account events about them. */
function PersonTimeline({ person, onBack }: { person: { key: string; label: string }; onBack: () => void }) {
  const [data, setData] = useState<Timeline | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/super-admin/activity?person=${encodeURIComponent(person.key)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error ?? "service_error"); setData(body); })
      .catch(e => { if (!controller.signal.aborted) setError(errorText(e instanceof Error ? e.message : "")); });
    return () => controller.abort();
  }, [person.key]);
  const account = data?.account;
  const views = data?.visits.filter(visit => visit.event === "page_view") ?? [];
  const sessions = new Set(views.map(visit => visit.session_id)).size;
  const read = (data?.visits ?? []).reduce((sum, visit) => sum + (Number(visit.duration_ms) || 0), 0) / 1000;
  return <div className={styles.activity}>
    <Button variant="outline" className={styles.back} onClick={onBack}><ArrowLeft size={15} />All activity</Button>
    {error ? <AdminError>{error}</AdminError> : !data ? <AdminLoading>Loading {person.label}…</AdminLoading> : <>
      <Card className={`${shell.panel} ${styles.profile}`}>
        <div className={styles.avatar} aria-hidden="true">{person.label.slice(0, 1).toUpperCase()}</div>
        <div>
          <h2>{person.label}</h2>
          <p className={shell.note}>{account
            ? <>Account created {when(account.created_at)} · last sign-in {when(account.last_sign_in_at)} · role {show(account.role)} · {account.email_confirmed_at ? "email verified" : "email not verified"}{account.banned_until && new Date(String(account.banned_until)) > new Date() ? " · banned" : ""}</>
            : "Anonymous visitor: no account linked to this browser yet."}</p>
        </div>
        <div className={styles.profileStats}><span><strong>{views.length}</strong>page views</span><span><strong>{sessions}</strong>sessions</span><span><strong>{duration(read)}</strong>time read</span><span><strong>{data.logins.length}</strong>sign-in events</span></div>
      </Card>
      <div className={styles.timelineGrid}>
        <Card className={shell.panel}><h2>Journey</h2>
          {data.visits.length ? <ol className={styles.timeline}>{data.visits.slice(0, 200).map((visit, i) => <li key={i} data-event={String(visit.event)}>
            <time title={when(visit.created_at)}>{when(visit.created_at)}</time>
            <span>{visit.event === "page_view" ? "Viewed" : `Left after ${duration(Number(visit.duration_ms) / 1000)}`} <b>{show(visit.path)}</b>{visit.title ? <small>{show(visit.title)}</small> : null}</span>
            <small>{[visit.device, visit.browser, locationLabel(visit)].filter(Boolean).join(" · ")}{visit.referrer_host ? ` · from ${show(visit.referrer_host)}` : ""}{visit.utm_source ? ` · campaign ${show(visit.utm_source)}` : ""}</small>
          </li>)}</ol> : <p className={shell.empty}>No visits recorded.</p>}
        </Card>
        <div className={styles.sideStack}>
          <Card className={shell.panel}><h2>Devices &amp; locations</h2>
            {data.devices.length ? <ul className={styles.deviceList}>{data.devices.map((device, i) => <li key={i}><b>{[device.device, device.browser, device.os].filter(Boolean).join(" · ")}</b><small>{locationLabel(device)} · {show(device.ip_masked)} · {show(device.screen)}</small><small>{show(device.hits)} events · last {ago(device.last_seen)}</small></li>)}</ul> : <p className={shell.empty}>None recorded.</p>}
          </Card>
          <Card className={shell.panel}><h2>Sign-ins</h2>
            {data.logins.length ? <ul className={styles.deviceList}>{data.logins.slice(0, 20).map((login, i) => <li key={i}><b>{show(login.action)}</b><small>{when(login.created_at)} · {show(login.ip_address)}</small></li>)}</ul> : <p className={shell.empty}>{account ? "No sign-in events in the Auth log." : "Not signed in."}</p>}
          </Card>
          <Card className={shell.panel}><h2>Account &amp; admin events</h2>
            {data.events.length ? <ul className={styles.deviceList}>{data.events.slice(0, 30).map((event, i) => <li key={i}><b>{show(event.kind)} · {show(event.action)}</b><small>{when(event.created_at)} · {show(event.resource)}</small></li>)}</ul> : <p className={shell.empty}>None recorded.</p>}
          </Card>
        </div>
      </div>
    </>}
  </div>;
}
