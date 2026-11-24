"use client";
import { useEffect, useMemo, useState } from "react";
import { History, Repeat, Activity, AppWindow, ArrowLeft, Calendar, Clock, Compass, Download, ExternalLink, Eye, Globe, Laptop, LogOut, MapPin, Megaphone, Monitor, MonitorSmartphone, MousePointerClick, Radio, RefreshCw, ShieldCheck, Smartphone, Tablet, Terminal, UserPlus, UserRound, Users } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AdminError, AdminLoading } from "./super-admin-feedback";
import { AdminTable } from "./super-admin-table";
import { SuperAdminNewUserLocations } from "./super-admin-new-user-locations";
import { locationLabel } from "@/lib/visitor-location";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";
import { countryName } from "./super-admin-audience";
import { SectionHead, SectionNav } from "./super-admin-section-head";
import { periodSummary } from "@/lib/live-visits";
import { GROUP_LABEL, uncountedBrowsers, visitorReport, type Count, type PersonRow, type VisitorGroup, type VisitRow } from "@/lib/visitor-report";
import { CountryFlag } from "./country-flag";
import { useStreamVisitors } from "./use-stream-visitors";
import { siAndroid, siApple, siBrave, siFacebook, siFirefoxbrowser, siGoogle, siGooglechrome, siInstagram, siIos, siLinux, siMacos, siOpera, siSafari, siSamsung, siUbuntu, siWhatsapp, siYoutube, type SimpleIcon } from "simple-icons";
import shell from "./super-admin-dashboard.module.css";
import styles from "./super-admin-activity.module.css";

/**
 * Page order. User activities is the reporting window and the people in it; everything live (who is here now, today,
 * the last three days) is on the Overview, so nothing here repeats it (user request 2026-11-24).
 */
const NAV = [
  { id: "ac-audience", label: "Audience", icon: Users }, { id: "ac-traffic", label: "Daily traffic", icon: Activity }, { id: "ac-new", label: "New visitors", icon: UserPlus },
  { id: "ac-sources", label: "Sources", icon: Megaphone }, { id: "ac-places", label: "Places & pages", icon: MapPin }, { id: "ac-tech", label: "Devices", icon: MonitorSmartphone },
  { id: "ac-accounts", label: "New accounts", icon: UserRound }, { id: "ac-people", label: "People & visits", icon: Users },
];
const LIGHT_TONES = ["sky", "mint", "lavender", "peach", "butter", "rose", "sage", "aqua"] as const;

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
const pct = (part: number, whole: number) => whole ? `${Math.round((part / whole) * 100)}%` : "—";
const gapText = (ms: number) => ms < 3600_000 ? `${Math.max(1, Math.round(ms / 60_000))} min` : ms < 86_400_000 ? `${Math.round(ms / 3600_000)} h` : `${Math.round(ms / 86_400_000)} d`;
/** Two count lists as one, people added per key (a person is in only one group, so nobody is counted twice). */
const merge = (a: Count[], b: Count[]): Count[] => { const map = new Map<string, Count>(); for (const c of [...a, ...b]) { const e = map.get(c.key); map.set(c.key, e ? { ...e, people: e.people + c.people, visits: e.visits + c.visits } : { ...c }); } return [...map.values()].sort((x, y) => y.people - x.people); };
const errorText = (code: string) => code === "migration_required"
  ? "User activity is not set up in the database yet. Apply supabase/migrations/0023_user_activity.sql (and 0020 for the support tools), then reload."
  : "User activity could not be loaded. Check the database connection and try again.";

/**
 * The super admin's User activities page: the reporting window and the people in it. Every visitor figure, list and
 * breakdown here is counted from the Live visitor stream's people (lib/visitor-report.ts), the same people the
 * Overview counts, read from the site_visits table; nothing is counted from the per-browser SQL report, which also
 * counted scrapers and page loads that were never on screen (user request 2026-11-24). Only "new accounts created"
 * comes from the SQL report: it counts accounts, not visits.
 */
export function SuperAdminActivity({ days, query }: { days: number; query: string }) {
  const [accounts, setAccounts] = useState<number | null>(null);
  const [person, setPerson] = useState<{ key: string; label: string } | null>(null);
  const stream = useStreamVisitors(15_000);
  // Visits are kept VISIT_RETENTION_DAYS days: a longer window can only ever show those.
  const span = Math.min(days, stream.days || VISIT_RETENTION_DAYS);
  const from = stream.now - span * 86_400_000;
  const ownHosts = useMemo(() => typeof window === "undefined" ? [] : [window.location.hostname.replace(/^www\./, "")], []);
  const sum = useMemo(() => stream.everyone ? periodSummary(stream.everyone, from, Infinity, ownHosts) : null, [stream, from, ownHosts]);
  const report = useMemo(() => stream.everyone ? visitorReport(stream.everyone, from, Infinity, ownHosts) : null, [stream, from, ownHosts]);
  const left = useMemo(() => stream.everyone ? uncountedBrowsers(stream.rows, stream.everyone, from) : 0, [stream, from]);

  // New accounts created in the window: accounts, not visits, so they come from the database report. Read once per
  // window and every minute after.
  useEffect(() => {
    const controller = new AbortController();
    const load = () => fetch(`/api/super-admin/activity?days=${days}`, { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : null).then(body => { if (body?.totals) setAccounts(Number(body.totals.newAccounts) || 0); }).catch(() => {});
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [days]);

  if (person) return <PersonTimeline person={person} onBack={() => setPerson(null)} />;
  if (stream.failed && !stream.everyone) return <AdminError>{errorText("")}<Button variant="outline" onClick={stream.reload}>Retry activity</Button></AdminError>;
  if (!sum || !report) return <AdminLoading>Loading user activity…</AdminLoading>;
  const daily = sum.daily.map(d => ({ day: d.day, views: d.views, visitors: d.people, new_visitors: d.newVisitors, users: d.signedIn }));
  const toRows = <K extends string>(list: ({ people: number } & Record<K, string>)[], key: K) => list.map(item => ({ [key]: item[key], visitors: item.people }) as Row);
  const counts = (list: Count[], label = (c: Count) => c.label) => list.map(c => ({ name: label(c), visitors: c.people, visits: c.visits }) as Row);
  const recordsStart = new Date(stream.now - stream.days * 86_400_000).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

  return <div className={styles.activity}>
    <SectionNav label="User activity sections" items={NAV} />
    {stream.failed && <AdminError>The latest read failed; showing the last successful one. Figures may be up to a minute old.</AdminError>}
    <div className={styles.liveBar}>
      <Calendar size={15} aria-hidden="true" />
      <span>{days > span
        ? <>The <b>last {span} days</b>: visits are kept for {VISIT_RETENTION_DAYS} days, so a {days}-day window has nothing older.</>
        : <>The <b>last {span === 1 ? "24 hours" : `${span} days`}</b>, live from your Supabase visit records.</>}</span>
      <span className={styles.liveActions}>
        <span className={styles.updated}>Updated {ago(new Date(stream.now).toISOString())}</span>
        <Button variant="outline" size="sm" onClick={stream.reload}><RefreshCw size={14} />Refresh</Button>
        <button type="button" className={styles.export} onClick={() => downloadVisits(report.visits, span)}><Download size={14} />Export CSV</button>
      </span>
    </div>
    {stream.capped && <AdminError>This window holds more than 20,000 page views; only the newest 20,000 are counted.</AdminError>}

    <SectionHead id="ac-audience" index={1} title="Audience" question="How many people came in this window, how long they stayed and how many were new." icon={Users} tone="lavender" />
    <div className={styles.metrics}>
      <Stat tone="lavender" index={0} icon={<Users size={16} />} label="Visitors" value={number(sum.people)} note="People: a signed-in account, or one device (cookie resets linked)" />
      <Stat tone="sky" index={1} icon={<MousePointerClick size={16} />} label="Page views" value={number(sum.views)} note={`${sum.pagesPerSession ?? "—"} pages per visit · on screen ≥ 1 s`} />
      <Stat tone="mint" index={2} icon={<UserPlus size={16} />} label="New · returning · old" value={`${number(report.groups.new.people)} · ${number(report.groups.returning.people)} · ${number(report.groups.old.people)}`} note="First visit ever here · first came earlier · known from before the records" />
      <Stat tone="peach" index={3} icon={<UserRound size={16} />} label="Signed-in learners" value={number(sum.signedIn)} note={`${accounts == null ? "—" : number(accounts)} new accounts created`} />
      <Stat tone="butter" index={4} icon={<Radio size={16} />} label="Visits" value={number(sum.sessions)} note="A visit ends after 30 minutes without activity" />
      <Stat tone="rose" index={5} icon={<Clock size={16} />} label="Avg. visit length" value={duration(sum.avgStayMs == null ? null : sum.avgStayMs / 1000)} note={sum.readingPerPersonMs != null ? `${duration(sum.readingPerPersonMs / 1000)} reading per visitor` : "Arrival to last activity"} />
      <Stat tone="sage" index={6} icon={<ArrowLeft size={16} />} label="Bounce rate" value={sum.bounceRate == null ? "—" : `${sum.bounceRate}%`} note="Visits that opened a single page" />
    </div>
    {left > 0 && <p className={styles.windowNote} role="status"><ShieldCheck size={14} aria-hidden="true" /><span><b>{number(left)}</b> more {left === 1 ? "browser" : "browsers"} loaded a page in this window but never showed it on screen (scrapers, link prefetchers, tabs closed at once). They are left out of every figure on this page and the Overview.</span></p>}

    <SectionHead id="ac-traffic" index={2} title="Daily traffic" question="Page views, visitors and new visitors on each day of the window." icon={Activity} tone="sky" />
    <Card className={`${shell.panel} ${styles.chartCard}`}>
      <div className={shell.panelHeading}><h2>Daily traffic (IST)</h2><span className={styles.legend}><i data-key="views" />Page views <i data-key="visitors" />Visitors <i data-key="new" />New</span></div>
      <DailyChart rows={daily} />
    </Card>

    <SectionHead id="ac-new" index={3} title="New, returning and old visitors" question="Who came for the first time, who came back and who has been coming from before: how often, how soon and through what." icon={UserPlus} tone="mint" />
    <div className={styles.metrics}>
      {(["new", "returning", "old"] as VisitorGroup[]).map((group, i) => { const g = report.groups[group]; return <Stat key={group} tone={["mint", "sky", "lavender"][i]} index={i} icon={group === "new" ? <UserPlus size={16} /> : group === "returning" ? <Repeat size={16} /> : <History size={16} />}
        label={`${GROUP_LABEL[group]} visitors`} value={number(g.people)}
        note={group === "new" ? `First visit ever in this window · ${number(g.signedIn)} signed up · ${pct(g.explored, g.people)} opened a second page`
          : group === "returning" ? `First came earlier in the records · back after ${g.medianGapMs == null ? "—" : gapText(g.medianGapMs)} (median) · ${g.avgVisitsBefore ?? 0} earlier visits each`
          : `Known before ${recordsStart} or signed in on their first visit · ${number(g.signedIn)} signed in`} />; })}
      <Stat tone="peach" index={3} icon={<UserRound size={16} />} label="Signed in" value={number(report.signedIn)} note="Across all three groups" />
    </div>
    <div className={styles.breakdowns}>
      <Breakdown title="Visits per person (in the records)" icon={<Repeat size={16} />} tone="sky" rows={counts(report.frequency)} label="name" value="visitors" heads={["Visits so far", "People"]} />
      <Breakdown title="How long they stayed away" icon={<History size={16} />} tone="lavender" rows={counts(report.gaps)} label="name" value="visitors" heads={["Time since last visit", "People"]} empty="No returning or old visitors in this window yet." />
      <Breakdown title="New visitors came from" icon={<Megaphone size={16} />} tone="butter" rows={counts(report.groupSources.new)} label="name" value="visitors" heads={["Source", "New visitors"]} rowIcon={row => brandIcon(show(row.name), CAMPAIGN_MARKS, <Globe size={15} />)} empty="No new visitors in this window yet." />
      <Breakdown title="Returning and old visitors came back through" icon={<Megaphone size={16} />} tone="peach" rows={counts(merge(report.groupSources.returning, report.groupSources.old))} label="name" value="visitors" heads={["Source", "People"]} rowIcon={row => brandIcon(show(row.name), CAMPAIGN_MARKS, <Globe size={15} />)} empty="No returning or old visitors in this window yet." />
      <Breakdown title="First page new visitors landed on" icon={<Compass size={16} />} tone="mint" rows={counts(report.groupLandings.new)} label="name" value="visitors" heads={["Landing page", "New visitors"]} empty="No new visitors in this window yet." />
      <Breakdown title="What returning and old visitors came back to" icon={<Compass size={16} />} tone="rose" rows={counts(merge(report.groupLandings.returning, report.groupLandings.old))} label="name" value="visitors" heads={["Page", "People"]} empty="No returning or old visitors in this window yet." />
    </div>

    <SectionHead id="ac-sources" index={4} title="Where visits came from" question="Every visit in the window by platform: search, social, AI assistants, referrals and direct." icon={Megaphone} tone="butter" />
    <div className={styles.breakdowns}>
      <Breakdown title="Sources" icon={<Megaphone size={16} />} tone="butter" rows={counts(report.sources)} label="name" value="visits" heads={["Platform", "Visits"]} extra={row => `${number(Number(row.visitors))} ${Number(row.visitors) === 1 ? "visitor" : "visitors"}`} rowIcon={row => brandIcon(show(row.name), CAMPAIGN_MARKS, <Globe size={15} />)} />
      <Breakdown title="Campaigns (UTM)" icon={<Megaphone size={16} />} tone="peach" rows={counts(report.campaigns)} label="name" value="visits" heads={["Source · campaign", "Visits"]} rowIcon={row => brandIcon(show(row.name), CAMPAIGN_MARKS, <Megaphone size={15} />)} empty="No tagged links visited yet. Add ?utm_source=… to links you share." />
    </div>

    <SectionHead id="ac-places" index={5} title="Places & pages" question="Where visitors are, the pages they entered on and the pages they read." icon={MapPin} tone="peach" />
    <div className={styles.breakdowns}>
      <Breakdown title="Countries" icon={<Globe size={16} />} tone="peach" rows={report.countries.map(c => ({ name: c.key === "Unknown" ? "Not resolved" : countryName(c.key) || c.key, code: c.key, visitors: c.people, visits: c.visits }) as Row)} label="name" value="visitors" heads={["Country", "Visitors"]} extra={row => `${number(Number(row.visits))} ${Number(row.visits) === 1 ? "visit" : "visits"}`} rowIcon={row => <CountryFlag code={String(row.code)} size={18} />} />
      <Breakdown title="Cities" icon={<MapPin size={16} />} tone="rose" rows={report.cities.map(c => { const [city, code] = c.key.split("|"); return { name: [city, code ? countryName(code) || code : ""].filter(Boolean).join(", "), code, visitors: c.people, visits: c.visits } as Row; })} label="name" value="visitors" heads={["City", "Visitors"]} rowIcon={row => <CountryFlag code={String(row.code)} size={18} />} empty="No city resolved for this window's visitors." />
      <Breakdown title="Entry pages" icon={<Compass size={16} />} tone="sky" rows={counts(report.landings)} label="name" value="visitors" heads={["First page of a visit", "Visitors"]} />
      <Breakdown title="Pages read" icon={<Eye size={16} />} tone="lavender" rows={sum.pages.map(p => ({ name: p.title || p.path, visitors: p.people, path: p.path, read: p.avgReadMs }) as Row)} label="name" value="visitors" heads={["Page", "Visitors"]} extra={row => `${show(row.path)}${row.read != null ? ` · ${duration(Number(row.read) / 1000)} avg read` : ""}`} />
    </div>

    <SectionHead id="ac-tech" index={6} title="Devices" question="What visitors browse with." icon={MonitorSmartphone} tone="mint" />
    <div className={styles.breakdowns}>
      <Breakdown title="Devices" icon={<MonitorSmartphone size={16} />} tone="sky" rows={toRows(sum.devices, "device")} label="device" value="visitors" heads={["Device", "Visitors"]} rowIcon={row => deviceIcon(show(row.device))} />
      <Breakdown title="Browsers" icon={<Compass size={16} />} tone="lavender" rows={toRows(sum.browsers, "browser")} label="browser" value="visitors" heads={["Browser", "Visitors"]} rowIcon={row => brandIcon(show(row.browser), BROWSER_MARKS, <Globe size={15} />)} />
      <Breakdown title="Operating systems" icon={<Terminal size={16} />} tone="mint" rows={toRows(sum.systems, "os")} label="os" value="visitors" heads={["Operating system", "Visitors"]} rowIcon={row => brandIcon(show(row.os), OS_MARKS, <AppWindow size={15} />)} />
    </div>

    <SectionHead id="ac-accounts" index={7} title="New accounts" question="Accounts created in this window: where each person was and how much they have used the site since." icon={UserRound} tone="lavender" />
    <SuperAdminNewUserLocations days={days} query={query} />

    <SectionHead id="ac-people" index={8} title="People & visits" question="Each person and every individual visit in the window. Open one to see their full timeline." icon={UserRound} tone="rose" />
    <People rows={report.people_} query={query} onOpen={(key, label) => setPerson({ key, label })} />
    <VisitLog rows={report.visits} query={query} onOpen={(key, label) => setPerson({ key, label })} />
    <p className={shell.note}>Visits are recorded by a first-party beacon on every page (super admin pages excluded). Crawlers, automated browsers, this site&apos;s own machines and page loads that were never on screen are left out. A visitor is one person: their signed-in account, or one device (an in-app browser that drops its cookie still counts once). IP addresses are stored masked. Visits are kept for {VISIT_RETENTION_DAYS} days, so no window reaches further back than that.</p>
  </div>;
}

/** The window's visits as a CSV file, built from the same rows the Visits table shows. */
function downloadVisits(rows: VisitRow[], span: number) {
  const cell = (value: unknown) => { const text = value == null ? "" : String(value); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; };
  const iso = (ms: number) => new Date(ms).toISOString();
  const lines = [["started_at", "ended_at", "on_site_now", "visitor", "entry_page", "exit_page", "page_views", "reading_seconds", "source", "campaign", "location", "device"].join(","),
    ...rows.map(r => [iso(r.start), iso(r.end), r.open, r.who, r.entry, r.exit ?? "", r.views, Math.round(r.readingMs / 1000), r.source, r.campaign ?? "", r.place, r.device].map(cell).join(","))];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `visits-last-${span}-days.csv` });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A headline figure on its own light tone, with its icon in a chip; `index` staggers the entrance. */
function Stat({ icon, label, value, note, tone, index }: { icon: React.ReactNode; label: string; value: string; note: string; tone: string; index: number }) {
  return <Card className={styles.stat} data-tone={tone} style={{ "--i": index } as React.CSSProperties}><span className={styles.statLabel}><span className={styles.statIcon} aria-hidden="true">{icon}</span>{label}</span><strong>{value}</strong><small>{note}</small></Card>;
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

function Breakdown({ title, icon, rows, label, value, heads, extra, empty, rowIcon, tone }: { title: string; icon?: React.ReactNode; rows: Row[]; label: string; value: string; heads: [string, string]; extra?: (row: Row) => string; empty?: string; rowIcon?: (row: Row) => React.ReactNode; tone?: string }) {
  const max = Math.max(1, ...rows.map(row => Number(row[value]) || 0));
  return <Card className={`${shell.panel} ${styles.breakdown}`} data-tone={tone}>
    <h2>{icon && <span className={styles.titleIcon} aria-hidden="true">{icon}</span>}{title}</h2>
    {rows.length ? <><div className={styles.breakdownHead} aria-hidden="true"><span>{heads[0]}</span><span>{heads[1]}</span></div><ol>{rows.slice(0, 10).map((row, i) => <li key={`${show(row[label])}-${i}`}>
      <span className={styles.barFill} style={{ width: `${((Number(row[value]) || 0) / max) * 100}%` }} />
      {rowIcon && <span className={styles.rowIcon} aria-hidden="true">{rowIcon(row)}</span>}
      <span className={styles.barLabel} title={show(row[label])}>{show(row[label])}{extra && <small>{extra(row)}</small>}</span>
      <strong>{number(Number(row[value]))}</strong>
    </li>)}</ol></> : <p className={shell.empty}>{empty ?? "No data in this window yet."}</p>}
  </Card>;
}

function People({ rows, query, onOpen }: { rows: PersonRow[]; query: string; onOpen: (key: string, label: string) => void }) {
  // Flattened so search, suggestions and filters see what the table shows.
  const view = useMemo(() => rows.map(row => ({ ...row, type: GROUP_LABEL[row.group], account: row.signedIn ? "Signed in" : "Guest", status: row.live ? "On the site" : "Left",
    last_seen: new Date(row.lastAt).toISOString(), first_seen: row.firstSeen ?? "", reading: duration(row.readingInPeriodMs / 1000),
    country_name: row.country ? countryName(row.country) || row.country : "Not resolved" }) as Row), [rows]);
  return <AdminTable title="People" rows={view} query={query}
    note="Everyone who visited in this window, most recent first: the same people every figure above counts. New: first visit ever in the window. Returning: first came earlier in the records. Old: known from before the records begin. Open anyone for their full activity trail."
    rowKey={row => String(row.key)}
    columns={[
      { key: "label", label: "Person", render: row => <button type="button" className={styles.personLink} onClick={() => onOpen(String(row.timelineKey), String(row.label))}>{String(row.label)}</button> },
      { key: "type", label: "Type", render: row => <span className={styles.status} data-status={row.group === "new" ? "new visitor" : row.group === "returning" ? "returning visitor" : "existing account"}>{show(row.type)}</span> },
      { key: "account", label: "Account", render: row => <span className={styles.status} data-status={row.signedIn ? "signed in" : "offline"}>{show(row.account)}</span> },
      { key: "status", label: "Now", render: row => <span className={styles.status} data-status={row.live ? "online" : "offline"}>{show(row.status)}</span> },
      { key: "last_seen", label: "Last seen", render: row => <span title={when(row.last_seen)}>{ago(row.last_seen)}</span> },
      { key: "first_seen", label: "First seen", render: row => row.first_seen ? <span title={when(row.first_seen)}>{when(row.first_seen)}</span> : <span>Before the records</span> },
      { key: "visitsInPeriod", label: "Visits", filter: false }, { key: "visitsBefore", label: "Earlier visits", filter: false }, { key: "viewsInPeriod", label: "Views", filter: false }, { key: "reading", label: "Reading", filter: false },
      { key: "lastPage", label: "Last page", filter: false, render: row => <span className={styles.path}>{show(row.lastPage)}</span> },
      { key: "sourceLabel", label: "Came from" },
      { key: "country_name", label: "Country", render: row => <span><CountryFlag code={row.country as string | null} size={18} />{show(row.country_name)}</span> },
      { key: "city", label: "City" }, { key: "device", label: "Device" },
    ]} />;
}

function VisitLog({ rows, query, onOpen }: { rows: VisitRow[]; query: string; onOpen: (key: string, label: string) => void }) {
  const view = useMemo(() => rows.map(row => ({ ...row, started: new Date(row.start).toISOString(), reading: duration(row.readingMs / 1000), state: row.open ? "on the site" : "ended" }) as Row), [rows]);
  return <AdminTable title="Visits" rows={view} query={query} note="Every visit in the window, newest first: entry and exit page, pages viewed and reading time. Export CSV downloads exactly these rows."
    rowKey={row => String(row.key)}
    columns={[
      { key: "started", label: "Started", render: row => <span title={when(row.started)}>{ago(row.started)}</span> },
      { key: "who", label: "Who", filter: false, render: row => <button type="button" className={styles.personLink} onClick={() => onOpen(String(row.timelineKey), String(row.who))}>{String(row.who)}</button> },
      { key: "state", label: "State", render: row => <span className={styles.event} data-event={row.open ? "page_view" : "page_leave"}>{show(row.state)}</span> },
      { key: "entry", label: "Entry page", render: row => <span className={styles.path}>{show(row.entry)}</span> },
      { key: "exit", label: "Exit page", filter: false, render: row => <span className={styles.path}>{show(row.exit)}</span> },
      { key: "views", label: "Views", filter: false }, { key: "reading", label: "Reading", filter: false },
      "source", "campaign", { key: "place", label: "Location" }, { key: "device", label: "Device" },
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
        <Card className={`${shell.panel} ${styles.journeyPanel}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionIcon}><Compass size={18} aria-hidden="true" /></span>
              <div>
                <h2>Journey</h2>
                <p className={shell.note}>Step-by-step visitor trail with duration, hardware, and acquisition touchpoints</p>
              </div>
            </div>
            <div className={styles.journeyBadgeStrip}>
              <span className={styles.journeyCountBadge}><Activity size={13} aria-hidden="true" />{data.visits.length} {data.visits.length === 1 ? "step" : "steps"}</span>
              <span className={styles.journeyCountBadge}><Clock size={13} aria-hidden="true" />{duration(read)} read</span>
            </div>
          </div>

          {data.visits.length ? (
            <div className={styles.journeyWrapper}>
              <ol className={styles.journeyList}>
                {data.visits.slice(0, 200).map((visit, i) => {
                  const tone = LIGHT_TONES[i % LIGHT_TONES.length];
                  const isView = visit.event === "page_view";
                  const durSec = Number(visit.duration_ms) / 1000;
                  const loc = locationLabel(visit);

                  return (
                    <li key={i} className={styles.journeyItem} data-tone={tone}>
                      <div className={styles.journeySpine}>
                        <span className={styles.journeyNodeDot} />
                        <span className={styles.journeyLine} />
                      </div>

                      <div className={styles.journeyCard} data-tone={tone}>
                        <div className={styles.journeyCardHeader}>
                          <div className={styles.journeyCardMetaLeft}>
                            <span className={styles.stepIndexPill}>#{i + 1}</span>
                            <span className={styles.actionPill} data-event={String(visit.event)}>
                              {isView ? <Eye size={12} aria-hidden="true" /> : <LogOut size={12} aria-hidden="true" />}
                              <span>{isView ? "Viewed Page" : "Left Page"}</span>
                            </span>
                            {!isView && durSec > 0 && (
                              <span className={styles.durationPill}>
                                <Clock size={11} aria-hidden="true" />
                                <span>{duration(durSec)}</span>
                              </span>
                            )}
                          </div>

                          <span className={styles.timePill} title={when(visit.created_at)}>
                            <Calendar size={11} aria-hidden="true" />
                            <time dateTime={String(visit.created_at)}>{when(visit.created_at)}</time>
                          </span>
                        </div>

                        <div className={styles.journeyCardBody}>
                          <div className={styles.journeyPathRow}>
                            <code className={styles.journeyPathCode} title={show(visit.path)}>{show(visit.path)}</code>
                          </div>
                          {visit.title ? <h4 className={styles.journeyPageTitle}>{show(visit.title)}</h4> : null}
                        </div>

                        <div className={styles.journeyCardFooter}>
                          {(visit.device || visit.browser) ? (
                            <span className={styles.metaChip} title="Hardware & Browser">
                              {deviceIcon(show(visit.device))}
                              <span>{[visit.device, visit.browser].filter(Boolean).map(show).join(" · ")}</span>
                            </span>
                          ) : null}
                          {loc ? (
                            <span className={styles.metaChip} title="Visitor Location">
                              <MapPin size={11} aria-hidden="true" />
                              <span>{loc}</span>
                            </span>
                          ) : null}
                          {visit.referrer_host ? (
                            <span className={styles.metaChip} title="Referrer Host">
                              <ExternalLink size={11} aria-hidden="true" />
                              <span>from {show(visit.referrer_host)}</span>
                            </span>
                          ) : null}
                          {visit.utm_source ? (
                            <span className={`${styles.metaChip} ${styles.campaignChip}`} title="Campaign Source">
                              <Megaphone size={11} aria-hidden="true" />
                              <span>campaign: {show(visit.utm_source)}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <p className={shell.empty}>No visits recorded.</p>
          )}
        </Card>

        <div className={styles.sideStack}>
          <Card className={`${shell.panel} ${styles.devicesPanel}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <span className={styles.sectionIcon}><Laptop size={18} aria-hidden="true" /></span>
                <div>
                  <h2>Devices &amp; locations</h2>
                  <p className={shell.note}>Hardware fingerprints, browsers, geolocations, and telemetry</p>
                </div>
              </div>
              <span className={styles.journeyCountBadge}>{data.devices.length} {data.devices.length === 1 ? "device" : "devices"}</span>
            </div>

            {data.devices.length ? (
              <div className={styles.deviceCardsGrid}>
                {data.devices.map((device, i) => {
                  const tone = LIGHT_TONES[i % LIGHT_TONES.length];
                  const loc = locationLabel(device);

                  return (
                    <div key={i} className={styles.deviceCard} data-tone={tone}>
                      <div className={styles.deviceCardTop}>
                        <div className={styles.deviceIconBox}>
                          {deviceIcon(show(device.device))}
                        </div>
                        <div className={styles.deviceMainInfo}>
                          <b className={styles.deviceTitle}>{[device.device, device.browser, device.os].filter(Boolean).join(" · ") || "Unknown Device"}</b>
                          <span className={styles.deviceHitsBadge}>
                            <Activity size={11} aria-hidden="true" />
                            {show(device.hits)} events
                          </span>
                        </div>
                      </div>

                      <div className={styles.deviceCardMid}>
                        {loc ? (
                          <span className={styles.deviceMetaTag} title="Location">
                            <MapPin size={12} aria-hidden="true" />
                            <span>{loc}</span>
                          </span>
                        ) : null}
                        {device.ip_masked ? (
                          <span className={styles.deviceMetaTag} title="Masked IP Address">
                            <ShieldCheck size={12} aria-hidden="true" />
                            <code>{show(device.ip_masked)}</code>
                          </span>
                        ) : null}
                        {device.screen ? (
                          <span className={styles.deviceMetaTag} title="Display Resolution">
                            <Monitor size={12} aria-hidden="true" />
                            <span>{show(device.screen)}</span>
                          </span>
                        ) : null}
                      </div>

                      <div className={styles.deviceCardBottom}>
                        <span className={styles.deviceLastSeen}>
                          <Clock size={11} aria-hidden="true" />
                          <span>Last seen {ago(device.last_seen)} ({when(device.last_seen)})</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={shell.empty}>None recorded.</p>
            )}
          </Card>

          <Card className={shell.panel}>
            <h2>Sign-ins</h2>
            {data.logins.length ? (
              <ul className={styles.sideEventList}>
                {data.logins.slice(0, 20).map((login, i) => {
                  const tone = LIGHT_TONES[i % LIGHT_TONES.length];
                  return (
                    <li key={i} className={styles.sideEventCard} data-tone={tone}>
                      <div className={styles.sideEventHeader}>
                        <b>{show(login.action)}</b>
                        <time>{ago(login.created_at)}</time>
                      </div>
                      <small>{when(login.created_at)} · {show(login.ip_address)}</small>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={shell.empty}>{account ? "No sign-in events in the Auth log." : "Not signed in."}</p>
            )}
          </Card>

          <Card className={shell.panel}>
            <h2>Account &amp; admin events</h2>
            {data.events.length ? (
              <ul className={styles.sideEventList}>
                {data.events.slice(0, 30).map((event, i) => {
                  const tone = LIGHT_TONES[i % LIGHT_TONES.length];
                  return (
                    <li key={i} className={styles.sideEventCard} data-tone={tone}>
                      <div className={styles.sideEventHeader}>
                        <b>{show(event.kind)} · {show(event.action)}</b>
                        <time>{ago(event.created_at)}</time>
                      </div>
                      <small>{when(event.created_at)} · {show(event.resource)}</small>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={shell.empty}>None recorded.</p>
            )}
          </Card>
        </div>
      </div>
    </>}
  </div>;
}
