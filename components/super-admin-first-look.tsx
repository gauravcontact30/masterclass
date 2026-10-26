"use client";
import { useMemo, useState } from "react";
import { Clock, Compass, DoorOpen, Globe2, Laptop, LogOut, MapPin, Monitor, Radio, Smartphone, Sparkles, Tablet, Timer, UserRound, type LucideIcon } from "lucide-react";
import { Flag, countryName } from "./super-admin-audience";
import { Pager } from "./super-admin-table";
import type { StreamVisitor } from "@/lib/live-visits";
import live from "./super-admin-overview-live.module.css";
import styles from "./super-admin-first-look.module.css";

/*
 * The Overview's "Visitors who only opened the site" panel: every anonymous visitor whose whole stay in the stream's
 * window is one page view (they opened the site and left, or are still on that first page). It uses the same visitor
 * list as the Live visitor stream (lib/live-visits.ts), so its counts always agree with the stream above it, and the
 * early page-view beacon in app/layout.tsx records these visitors even when they leave before the page finishes loading.
 */

const PAGE_SIZE = 8;
const DEVICE_ICON: Record<string, LucideIcon> = { mobile: Smartphone, tablet: Tablet, desktop: Laptop };
const n = (value: number) => new Intl.NumberFormat("en-IN").format(value);
const spent = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`; };
const when = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
const ago = (ms: number) => { const s = Math.max(0, ms / 1000); return s < 10 ? "just now" : s < 60 ? `${Math.round(s)}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`; };
const median = (values: number[]) => { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const mid = sorted.length >> 1; return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };
const top = (values: string[], count = 4) => [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, count);
/** Time on the one page: the open page's clock while they are still reading, otherwise the visible time recorded. */
const timeOn = (v: StreamVisitor) => v.page?.ms ?? v.engagedMs;

export function FirstLookVisitors({ everyone, now, days }: { everyone: StreamVisitor[]; now: number; days: number }) {
  const [page, setPage] = useState(1);
  const visitors = useMemo(() => everyone.filter(v => !v.signedIn && v.views === 1).sort((a, b) => Date.parse(b.arrived) - Date.parse(a.arrived)), [everyone]);
  const stats = useMemo(() => {
    const times = visitors.map(timeOn);
    return {
      liveNow: visitors.filter(v => v.live).length,
      share: everyone.length ? Math.round((visitors.length / everyone.length) * 1000) / 10 : null,
      median: median(times),
      quick: times.filter(ms => ms < 10_000).length,
      fresh: visitors.filter(v => v.first.new_visitor).length,
      landings: top(visitors.map(v => v.first.path || "/")),
      sources: top(visitors.map(v => v.source || "Direct")),
      devices: top(visitors.map(v => (v.first.device || "desktop").toLowerCase()), 3),
      countries: top(visitors.map(v => v.first.country || "").filter(Boolean), 4),
    };
  }, [visitors, everyone]);
  const pages = Math.max(1, Math.ceil(visitors.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = visitors.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const windowLabel = days === 1 ? "24 h" : `the last ${days} days`;

  return <article className={`${live.panel} ${live.full}`} data-tone="peach" aria-labelledby="first-look-title">
    <h3 id="first-look-title"><DoorOpen size={16} aria-hidden="true" />Visitors who only opened the site<span>{n(visitors.length)} of {n(everyone.length)} visitors · one page view in {windowLabel} · not signed in</span></h3>
    <dl className={styles.stats}>
      <div><dt>Opened &amp; left</dt><dd>{n(visitors.length - stats.liveNow)}</dd><small>{stats.share == null ? "—" : `${stats.share}% of all visitors`}</small></div>
      <div data-live={stats.liveNow > 0 || undefined}><dt>On their first page now</dt><dd>{n(stats.liveNow)}</dd><small>could still explore further</small></div>
      <div><dt>Median time on page</dt><dd>{stats.median == null ? "—" : spent(stats.median)}</dd><small>{n(stats.quick)} left within 10 s</small></div>
      <div><dt>First-time visitors</dt><dd>{n(stats.fresh)}</dd><small>{n(visitors.length - stats.fresh)} returning, still one page</small></div>
    </dl>
    {visitors.length > 0 && <div className={styles.breakdowns}>
      <Breakdown title="Landing page" icon={Compass} items={stats.landings} total={visitors.length} />
      <Breakdown title="Came from" icon={Globe2} items={stats.sources} total={visitors.length} />
      <Breakdown title="Device" icon={Monitor} items={stats.devices.map(([d, c]) => [d[0].toUpperCase() + d.slice(1), c] as [string, number])} total={visitors.length} />
      <Breakdown title="Country" icon={MapPin} items={stats.countries.map(([code, c]) => [countryName(code) || code, c] as [string, number])} total={visitors.length} />
    </div>}
    {visitors.length ? <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th scope="col">Visitor</th><th scope="col">Arrived (IST)</th><th scope="col">Opened</th><th scope="col">Time on page</th><th scope="col">Status</th><th scope="col">Came from</th><th scope="col">Location</th><th scope="col">Device</th></tr></thead>
          <tbody>{rows.map(v => {
            const visit = v.first, code = visit.country ?? "";
            const Device = DEVICE_ICON[(visit.device || "desktop").toLowerCase()] ?? Laptop;
            const place = [visit.city, visit.region].filter(Boolean).join(", ");
            return <tr key={v.key} data-live={v.live || undefined}>
              <td><span className={styles.who}><UserRound size={13} aria-hidden="true" /><span><strong>{visit.new_visitor ? "New visitor" : "Returning visitor"}</strong><code>{v.key.replace(/^(visitor|device):/, "").slice(0, 8)}</code></span>{visit.new_visitor && <Sparkles size={12} className={styles.spark} aria-label="First visit" />}</span></td>
              <td><time dateTime={v.arrived}>{when.format(Date.parse(v.arrived))}</time><small>{ago(now - Date.parse(v.arrived))}</small></td>
              <td><span className={styles.path} title={visit.path}>{visit.title?.replace(/\s*\|.*$/, "") || visit.path}</span><small>{visit.path}</small></td>
              <td><span className={styles.time}><Timer size={12} aria-hidden="true" />{spent(timeOn(v))}</span><small>{v.page?.open ? "still counting" : v.beacon ? "measured" : "last activity"}</small></td>
              <td>{v.live
                ? <span className={styles.liveTag}><Radio size={11} aria-hidden="true" />On the page</span>
                : <span className={styles.leftTag}><LogOut size={11} aria-hidden="true" />Left {v.left ? ago(now - v.left) : ""}</span>}</td>
              <td>{v.source || "Direct"}{visit.utm_source && visit.utm_source !== v.source ? <small>utm: {visit.utm_source}</small> : null}</td>
              <td><span className={styles.place}><Flag code={code} /><span>{code ? countryName(code) || code : "Not resolved"}<small>{place || "City not resolved"}</small></span></span></td>
              <td><span className={styles.device}><Device size={13} aria-hidden="true" /><span>{[visit.browser, visit.os].filter(Boolean).join(" · ") || "Not reported"}<small>{visit.screen ? `${visit.screen} px` : ""}</small></span></span></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <Pager page={current} pages={pages} total={visitors.length} size={PAGE_SIZE} onPage={setPage} />
    </> : <p className={styles.empty}><Clock size={14} aria-hidden="true" />No one-page visitors in {windowLabel} yet.</p>}
  </article>;
}

function Breakdown({ title, icon: Icon, items, total }: { title: string; icon: LucideIcon; items: [string, number][]; total: number }) {
  return <section className={styles.breakdown} aria-label={title}>
    <h4><Icon size={13} aria-hidden="true" />{title}</h4>
    <ul>{items.map(([label, count]) => <li key={label}><span title={label}>{label}</span><b>{n(count)}</b><i style={{ width: `${Math.max(6, (count / total) * 100)}%` }} aria-hidden="true" /></li>)}</ul>
  </section>;
}
