"use client";
import { useMemo, useState } from "react";
import { CalendarClock, Compass, EyeOff, Globe2, History, Laptop, LogOut, MapPin, Radio, Repeat, Smartphone, Sparkles, Tablet, Timer, UserCheck, UserPlus, Users, type LucideIcon } from "lucide-react";
import { countryName } from "./super-admin-audience";
import { CountryFlag } from "./country-flag";
import { Pager } from "./super-admin-table";
import type { StreamVisit, StreamVisitor } from "@/lib/live-visits";
import { GROUP_LABEL, uncountedBrowsers, visitorReport, type Count, type VisitorGroup, type VisitorRow } from "@/lib/visitor-report";
import live from "./super-admin-overview-live.module.css";
import styles from "./super-admin-first-look.module.css";

/*
 * Overview → Visitors today (user request 2026-11-24): everyone with a page on screen today (from 00:00 IST), live from
 * the same visitor list as the Live visitor stream, in three groups (lib/visitor-report.ts):
 *   New       — first visit ever today;
 *   Returning — first came earlier, on a date in the records, and came back today;
 *   Old       — known from before the records begin (visits are kept a few days), or signed in on their first visit.
 * Each tab shows what matters for that group: for new visitors where they came from and what they read first; for
 * returning and old visitors how often and how recently they came, what they came back to and their favourite page.
 * Page loads with no time on screen (scrapers, prefetchers) are left out and counted separately.
 */
const PAGE_SIZE = 8;
const DEVICE_ICON: Record<string, LucideIcon> = { mobile: Smartphone, tablet: Tablet, desktop: Laptop };
const n = (value: number) => new Intl.NumberFormat("en-IN").format(value);
const spent = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`; };
const time = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const dateTime = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
const ago = (ms: number) => { const s = Math.max(0, ms / 1000); return s < 10 ? "just now" : s < 60 ? `${Math.round(s)}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`; };
const gap = (ms: number) => ms < 3600_000 ? `${Math.max(1, Math.round(ms / 60_000))} min` : ms < 86_400_000 ? `${Math.round(ms / 3600_000)} h` : `${Math.round(ms / 86_400_000)} d`;
const pct = (part: number, whole: number) => whole ? `${Math.round((part / whole) * 100)}%` : "—";
const GROUP_ICON: Record<VisitorGroup, LucideIcon> = { new: UserPlus, returning: Repeat, old: History };

export function NewVisitorsToday({ everyone, rows, dayStart, now, ownHosts, recordsFrom }: { everyone: StreamVisitor[]; rows: StreamVisit[]; dayStart: number; now: number; ownHosts: string[]; recordsFrom: number }) {
  const [group, setGroup] = useState<VisitorGroup>("new");
  const [page, setPage] = useState(1);
  const report = useMemo(() => visitorReport(everyone, dayStart, Infinity, ownHosts), [everyone, dayStart, ownHosts]);
  const left = useMemo(() => uncountedBrowsers(rows, everyone, dayStart), [rows, everyone, dayStart]);
  const g = report.groups[group];
  const list = useMemo(() => report.rows.filter(r => r.group === group).sort((a, b) => group === "new" ? Date.parse(b.arrived) - Date.parse(a.arrived) : b.lastAt - a.lastAt), [report, group]);
  const countries = useMemo(() => tally(list, r => r.country, code => countryName(code) || code), [list]);
  const devices = useMemo(() => tally(list, r => r.device.split(" · ")[0] || "Desktop", d => d), [list]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const records = date.format(recordsFrom);
  const pick = (next: VisitorGroup) => { setGroup(next); setPage(1); };

  return <article className={`${live.panel} ${live.full}`} data-tone="lavender" aria-labelledby="visitors-today-title">
    <h3 id="visitors-today-title"><Users size={16} aria-hidden="true" />Visitors today<span>{n(report.people)} people since 00:00 IST · {n(report.groups.new.people)} new · {n(report.groups.returning.people)} returning · {n(report.groups.old.people)} old · {n(report.signedIn)} signed in · live</span></h3>
    <div className={styles.groupTabs} role="tablist" aria-label="Visitor group">
      {(["new", "returning", "old"] as VisitorGroup[]).map(id => { const Icon = GROUP_ICON[id]; return <button key={id} type="button" role="tab" aria-selected={group === id} onClick={() => pick(id)}>
        <Icon size={14} aria-hidden="true" />{GROUP_LABEL[id]}<b>{n(report.groups[id].people)}</b>
        <small>{id === "new" ? "first visit ever today" : id === "returning" ? "first came earlier this week" : `known from before ${records}`}</small>
      </button>; })}
    </div>
    <dl className={styles.stats}>
      <div><dt>{GROUP_LABEL[group]} today</dt><dd>{n(g.people)}</dd><small>{n(g.people - g.signedIn)} guests · {n(g.signedIn)} signed in</small></div>
      <div data-live={g.live > 0 || undefined}><dt>On the site now</dt><dd>{n(g.live)}</dd><small>with a page open</small></div>
      <div><dt>Read more than one page</dt><dd>{pct(g.explored, g.people)}</dd><small>{n(g.explored)} explored · {n(g.bounced)} left after one</small></div>
      {group === "new"
        ? <div><dt>Reading time each</dt><dd>{g.avgReadingMs == null ? "—" : spent(g.avgReadingMs)}</dd><small>{n(g.cameBack)} already came back for another visit</small></div>
        : <div><dt>Came back after</dt><dd>{g.medianGapMs == null ? "—" : gap(g.medianGapMs)}</dd><small>{g.medianGapMs == null ? "first visit in the records today" : `median time away · ${g.avgVisitsBefore ?? 0} earlier visits each`}</small></div>}
    </dl>
    {list.length > 0 && <div className={styles.breakdowns}>
      <Breakdown title={group === "new" ? "Came from" : "Came back through"} icon={Globe2} items={report.groupSources[group]} total={g.people} />
      <Breakdown title={group === "new" ? "Landed on" : "Came back to"} icon={Compass} items={report.groupLandings[group]} total={g.people} />
      <Breakdown title="Country" icon={MapPin} items={countries} total={g.people} flags />
      <Breakdown title="Device" icon={Laptop} items={devices} total={g.people} />
    </div>}
    {list.length ? <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th scope="col">Visitor</th>{group === "new" ? <th scope="col">Arrived (IST)</th> : <><th scope="col">First seen</th><th scope="col">Last time</th></>}<th scope="col">{group === "new" ? "Came from" : "Today via"}</th><th scope="col">{group === "new" ? "Landed on" : "Came back to"}</th><th scope="col">Read today</th>{group !== "new" && <th scope="col">Favourite page</th>}<th scope="col">Status</th><th scope="col">Location</th><th scope="col">Device</th></tr></thead>
          <tbody>{shown.map(r => <Row key={r.key} r={r} now={now} records={records} />)}</tbody>
        </table>
      </div>
      <Pager page={current} pages={pages} total={list.length} size={PAGE_SIZE} onPage={setPage} />
    </> : <p className={styles.empty}><Sparkles size={14} aria-hidden="true" />No {GROUP_LABEL[group].toLowerCase()} visitors yet today.</p>}
    <p className={live.note}>{left > 0 ? <>Left out today: <b>{n(left)}</b> {left === 1 ? "browser" : "browsers"} that loaded a page but never showed it on screen (scrapers, link prefetchers, tabs closed at once). They stay in the database but are not counted as visitors here or anywhere else in Super Admin. </> : null}Visits are kept from {records}, so an old visitor&apos;s first visit is before that date and is not guessed.</p>
  </article>;
}

function Row({ r, now, records }: { r: VisitorRow; now: number; records: string }) {
  const Device = DEVICE_ICON[(r.device.split(" · ")[0] || "desktop").toLowerCase()] ?? Laptop;
  const isNew = r.group === "new";
  return <tr data-live={r.live || undefined}>
    <td><span className={styles.who}>{r.signedIn ? <UserCheck size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}<span><strong>{r.email ?? (r.signedIn ? "Signed in" : `${GROUP_LABEL[r.group]} guest`)}</strong><code>{r.stage}</code></span>{r.privateWindow && <EyeOff size={12} className={styles.spark} aria-label="Private window" />}</span></td>
    {isNew
      ? <td><time dateTime={r.arrived}>{time.format(Date.parse(r.arrived))}</time><small>{ago(now - Date.parse(r.arrived))}</small></td>
      : <>
        <td>{r.firstSeen ? <><time dateTime={r.firstSeen}>{date.format(Date.parse(r.firstSeen))}</time><small>{ago(now - Date.parse(r.firstSeen))}</small></> : <>Before {records}<small>known browser</small></>}</td>
        <td>{r.lastVisitBefore != null ? <><span className={styles.time}><CalendarClock size={12} aria-hidden="true" />{dateTime.format(r.lastVisitBefore)}</span><small>{gap(Date.parse(r.arrived) - r.lastVisitBefore)} before today&apos;s visit · {n(r.visitsBefore)} earlier {r.visitsBefore === 1 ? "visit" : "visits"}</small></> : <>Not in the records<small>first visit since {records}</small></>}</td>
      </>}
    <td>{r.sourceLabel}<small>{r.campaign ? `campaign ${r.campaign}` : r.referrer ?? "no referrer"}</small></td>
    <td><span className={styles.path} title={r.landing}>{r.landingTitle}</span><small>{r.landing}</small></td>
    <td><span className={styles.time}><Timer size={12} aria-hidden="true" />{spent(r.readingInPeriodMs)}</span><small>{n(r.viewsInPeriod)} {r.viewsInPeriod === 1 ? "page" : "pages"}{r.visitsInPeriod > 1 ? ` · ${n(r.visitsInPeriod)} visits` : ""}</small></td>
    {!isNew && <td>{r.favourite ? <><span className={styles.path} title={r.favourite.path}>{r.favourite.title}</span><small>{spent(r.favourite.ms)} in all · {n(r.activeDays)} {r.activeDays === 1 ? "day" : "days"} active</small></> : "—"}</td>}
    <td>{r.live
      ? <span className={styles.liveTag}><Radio size={11} aria-hidden="true" />On the site</span>
      : <span className={styles.leftTag}><LogOut size={11} aria-hidden="true" />Left {ago(now - r.lastAt)}</span>}</td>
    <td><span className={styles.place}><CountryFlag code={r.country} /><span>{r.country ? countryName(r.country) || r.country : "Not resolved"}<small>{r.city ?? "City not resolved"}</small></span></span></td>
    <td><span className={styles.device}><Device size={13} aria-hidden="true" /><span>{[r.browser, r.os].filter(Boolean).join(" · ") || "Not reported"}</span></span></td>
  </tr>;
}

function tally(list: VisitorRow[], key: (r: VisitorRow) => string | null, label: (key: string) => string): Count[] {
  const map = new Map<string, number>();
  for (const r of list) { const k = key(r); if (k) map.set(k, (map.get(k) ?? 0) + 1); }
  return [...map].sort((a, b) => b[1] - a[1]).map(([k, people]) => ({ key: k, label: label(k), people, visits: people }));
}

function Breakdown({ title, icon: Icon, items, total, flags = false }: { title: string; icon: LucideIcon; items: Count[]; total: number; flags?: boolean }) {
  return <section className={styles.breakdown} aria-label={title}>
    <h4><Icon size={13} aria-hidden="true" />{title}</h4>
    <ul>{items.slice(0, 4).map(item => <li key={item.key}><span title={item.label}>{flags && <CountryFlag code={item.key} />}{item.label}</span><b>{n(item.people)}</b><i style={{ width: `${Math.max(6, (item.people / Math.max(1, total)) * 100)}%` }} aria-hidden="true" /></li>)}</ul>
  </section>;
}
