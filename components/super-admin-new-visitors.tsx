"use client";
import { useMemo, useState } from "react";
import { Compass, EyeOff, Globe2, Laptop, LogOut, MapPin, Radio, Smartphone, Sparkles, Tablet, Timer, UserCheck, UserPlus, type LucideIcon } from "lucide-react";
import { Flag, countryName } from "./super-admin-audience";
import { Pager } from "./super-admin-table";
import type { StreamVisit, StreamVisitor } from "@/lib/live-visits";
import { uncountedBrowsers, visitorReport, type Count } from "@/lib/visitor-report";
import live from "./super-admin-overview-live.module.css";
import styles from "./super-admin-first-look.module.css";

/*
 * Overview → New visitors today (user request 2026-11-24): everyone whose first page view ever was today (from 00:00
 * IST), live from the same visitor list as the Live visitor stream (lib/visitor-report.ts), with where they came from,
 * where they landed, how much they read, what they use and whether they signed up. Page loads with no time on screen
 * (scrapers, prefetchers, tabs closed at once) are left out of every figure and counted separately, so the gap from
 * the database's per-browser count is explained.
 */
const PAGE_SIZE = 8;
const DEVICE_ICON: Record<string, LucideIcon> = { mobile: Smartphone, tablet: Tablet, desktop: Laptop };
const n = (value: number) => new Intl.NumberFormat("en-IN").format(value);
const spent = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`; };
const when = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
const ago = (ms: number) => { const s = Math.max(0, ms / 1000); return s < 10 ? "just now" : s < 60 ? `${Math.round(s)}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : `${Math.round(s / 3600)}h ago`; };
const pct = (part: number, whole: number) => whole ? `${Math.round((part / whole) * 100)}%` : "—";

export function NewVisitorsToday({ everyone, rows, dayStart, now, ownHosts }: { everyone: StreamVisitor[]; rows: StreamVisit[]; dayStart: number; now: number; ownHosts: string[] }) {
  const [page, setPage] = useState(1);
  const report = useMemo(() => visitorReport(everyone, dayStart, Infinity, ownHosts), [everyone, dayStart, ownHosts]);
  const left = useMemo(() => uncountedBrowsers(rows, everyone, dayStart), [rows, everyone, dayStart]);
  const s = report.newSummary, list = report.newVisitors;
  const countries = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of list) map.set(v.country ?? "", (map.get(v.country ?? "") ?? 0) + 1);
    return [...map].filter(([code]) => code).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([code, people]) => ({ key: code, label: countryName(code) || code, people, visits: people }));
  }, [list]);
  const devices = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of list) { const d = (v.device.split(" · ")[0] || "Desktop"); map.set(d, (map.get(d) ?? 0) + 1); }
    return [...map].sort((a, b) => b[1] - a[1]).map(([key, people]) => ({ key, label: key, people, visits: people }));
  }, [list]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return <article className={`${live.panel} ${live.full}`} data-tone="lavender" aria-labelledby="new-visitors-title">
    <h3 id="new-visitors-title"><UserPlus size={16} aria-hidden="true" />New visitors today<span>{n(s.total)} of {n(report.people)} visitors today came for the first time · since 00:00 IST · live</span></h3>
    <dl className={styles.stats}>
      <div><dt>New today</dt><dd>{n(s.total)}</dd><small>{n(s.guests)} guests · {n(s.signedUp)} signed up</small></div>
      <div data-live={s.live > 0 || undefined}><dt>On the site now</dt><dd>{n(s.live)}</dd><small>new visitors with a page open</small></div>
      <div><dt>Read more than one page</dt><dd>{pct(s.total - s.bounced, s.total)}</dd><small>{n(s.total - s.bounced)} explored · {n(s.bounced)} left after one</small></div>
      <div><dt>Reading time per new visitor</dt><dd>{s.avgReadingMs == null ? "—" : spent(s.avgReadingMs)}</dd><small>{n(s.returnedAgain)} already came back for another visit</small></div>
    </dl>
    {list.length > 0 && <div className={styles.breakdowns}>
      <Breakdown title="Came from" icon={Globe2} items={report.newSources} total={s.total} />
      <Breakdown title="Landed on" icon={Compass} items={report.newLandings} total={s.total} />
      <Breakdown title="Country" icon={MapPin} items={countries} total={s.total} />
      <Breakdown title="Device" icon={Laptop} items={devices} total={s.total} />
    </div>}
    {list.length ? <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th scope="col">Visitor</th><th scope="col">Arrived (IST)</th><th scope="col">Came from</th><th scope="col">Landed on</th><th scope="col">Read</th><th scope="col">Status</th><th scope="col">Location</th><th scope="col">Device</th></tr></thead>
          <tbody>{shown.map(v => {
            const Device = DEVICE_ICON[(v.device.split(" · ")[0] || "desktop").toLowerCase()] ?? Laptop;
            const [city] = v.place.split(", ");
            return <tr key={v.key} data-live={v.live || undefined}>
              <td><span className={styles.who}>{v.signedUp ? <UserCheck size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}<span><strong>{v.signedUp ? v.email ?? "Signed up" : "New guest"}</strong><code>{v.stage}</code></span>{v.privateWindow && <EyeOff size={12} className={styles.spark} aria-label="Private window" />}</span></td>
              <td><time dateTime={v.arrived}>{when.format(Date.parse(v.arrived))}</time><small>{ago(now - Date.parse(v.arrived))}</small></td>
              <td>{v.sourceLabel}<small>{v.campaign ? `campaign ${v.campaign}` : v.referrer ?? "no referrer"}</small></td>
              <td><span className={styles.path} title={v.landing}>{v.landingTitle}</span><small>{v.landing}</small></td>
              <td><span className={styles.time}><Timer size={12} aria-hidden="true" />{spent(v.readingMs)}</span><small>{n(v.views)} {v.views === 1 ? "page" : "pages"}{v.visits > 1 ? ` · ${n(v.visits)} visits` : ""}</small></td>
              <td>{v.live
                ? <span className={styles.liveTag}><Radio size={11} aria-hidden="true" />On the site</span>
                : <span className={styles.leftTag}><LogOut size={11} aria-hidden="true" />Left {ago(now - v.lastAt)}</span>}</td>
              <td><span className={styles.place}><Flag code={v.country ?? ""} /><span>{v.country ? countryName(v.country) || v.country : "Not resolved"}<small>{v.place.includes(",") ? city : "City not resolved"}</small></span></span></td>
              <td><span className={styles.device}><Device size={13} aria-hidden="true" /><span>{[v.browser, v.os].filter(Boolean).join(" · ") || "Not reported"}</span></span></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <Pager page={current} pages={pages} total={list.length} size={PAGE_SIZE} onPage={setPage} />
    </> : <p className={styles.empty}><Sparkles size={14} aria-hidden="true" />No new visitors yet today.</p>}
    <p className={live.note}>{left > 0 ? <>Left out today: <b>{n(left)}</b> {left === 1 ? "browser" : "browsers"} that loaded a page but never showed it on screen (scrapers, link prefetchers, tabs closed at once). They stay in the database but are not counted as visitors here or anywhere else in Super Admin.</> : "Every browser that loaded a page today also had it on screen."}</p>
  </article>;
}

function Breakdown({ title, icon: Icon, items, total }: { title: string; icon: LucideIcon; items: Count[]; total: number }) {
  return <section className={styles.breakdown} aria-label={title}>
    <h4><Icon size={13} aria-hidden="true" />{title}</h4>
    <ul>{items.slice(0, 4).map(item => <li key={item.key}><span title={item.label}>{item.label}</span><b>{n(item.people)}</b><i style={{ width: `${Math.max(6, (item.people / Math.max(1, total)) * 100)}%` }} aria-hidden="true" /></li>)}</ul>
  </section>;
}
