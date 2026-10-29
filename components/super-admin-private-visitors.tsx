"use client";
import { useMemo, useState } from "react";
import { Clock, EyeOff, Laptop, LogOut, Radio, ScanSearch, Smartphone, Tablet, Timer, UserRound, type LucideIcon } from "lucide-react";
import { Flag, countryName } from "./super-admin-audience";
import { Pager } from "./super-admin-table";
import type { StreamVisitor } from "@/lib/live-visits";
import live from "./super-admin-overview-live.module.css";
import table from "./super-admin-first-look.module.css";
import styles from "./super-admin-private-visitors.module.css";

/*
 * The Overview's "Private-window visitors" panel: visitors who opened the site in a private (incognito) window, from the
 * same visitor list as the Live visitor stream (lib/live-visits.ts, privateSignal). A site can only see its own pages,
 * never the browser's history, so this is about visits here: "detected" when Firefox or Safari said so
 * (lib/early-track.ts, migration 0048), "likely" when a device already seen here came back with a brand-new cookie,
 * the only trace Chromium browsers leave (clearing cookies looks the same).
 */

const PAGE_SIZE = 8;
const DEVICE_ICON: Record<string, LucideIcon> = { mobile: Smartphone, tablet: Tablet, desktop: Laptop };
const n = (value: number) => new Intl.NumberFormat("en-IN").format(value);
const spent = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`; };
const when = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
const ago = (ms: number) => { const s = Math.max(0, ms / 1000); return s < 10 ? "just now" : s < 60 ? `${Math.round(s)}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`; };

export function PrivateVisitors({ everyone, now, days }: { everyone: StreamVisitor[]; now: number; days: number }) {
  const [page, setPage] = useState(1);
  const visitors = useMemo(() => everyone.filter(v => v.privateWindow).sort((a, b) => Number(b.live) - Number(a.live) || b.lastAt - a.lastAt), [everyone]);
  const stats = useMemo(() => ({
    detected: visitors.filter(v => v.privateWindow === "detected").length,
    liveNow: visitors.filter(v => v.live).length,
    signedIn: visitors.filter(v => v.signedIn).length,
    reading: visitors.length ? visitors.reduce((sum, v) => sum + v.sessionEngagedMs, 0) / visitors.length : null,
  }), [visitors]);
  const pages = Math.max(1, Math.ceil(visitors.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = visitors.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const windowLabel = days === 1 ? "24 h" : `the last ${days} days`;

  return <article className={`${live.panel} ${live.full}`} data-tone="rose" aria-labelledby="private-visitors-title">
    <h3 id="private-visitors-title"><EyeOff size={16} aria-hidden="true" />Private-window visitors<span>{n(visitors.length)} of {n(everyone.length)} visitors · incognito or private browsing in {windowLabel}</span></h3>
    <dl className={table.stats}>
      <div><dt>Private-window visitors</dt><dd>{n(visitors.length)}</dd><small>{everyone.length ? `${Math.round((visitors.length / everyone.length) * 1000) / 10}% of all visitors` : "—"}</small></div>
      <div><dt>Reported by the browser</dt><dd>{n(stats.detected)}</dd><small>{n(visitors.length - stats.detected)} likely, from a fresh cookie</small></div>
      <div data-live={stats.liveNow > 0 || undefined}><dt>On the site now</dt><dd>{n(stats.liveNow)}</dd><small>{n(stats.signedIn)} signed in</small></div>
      <div><dt>Active reading / visitor</dt><dd>{stats.reading == null ? "—" : spent(stats.reading)}</dd><small>their latest visit</small></div>
    </dl>
    {visitors.length ? <>
      <div className={table.tableWrap}>
        <table className={table.table}>
          <thead><tr><th scope="col">Visitor</th><th scope="col">Signal</th><th scope="col">Arrived (IST)</th><th scope="col">Total stay</th><th scope="col">Active reading</th><th scope="col">Status</th><th scope="col">Location</th><th scope="col">Device</th></tr></thead>
          <tbody>{rows.map(v => {
            const visit = v.current, code = visit.country ?? v.first.country ?? "";
            const Device = DEVICE_ICON[(visit.device || "desktop").toLowerCase()] ?? Laptop;
            const place = [visit.city, visit.region].filter(Boolean).join(", ");
            return <tr key={v.key} data-live={v.live || undefined}>
              <td><span className={table.who}><UserRound size={13} aria-hidden="true" /><span><strong>{v.email ?? (v.first.new_visitor ? "New visitor" : "Returning visitor")}</strong><code>{v.key.replace(/^(visitor|device):/, "").slice(0, 8)}</code></span></span></td>
              <td>{v.privateWindow === "detected"
                ? <span className={styles.detected} title="The browser refused private-window storage the way Firefox and Safari do in private browsing"><EyeOff size={11} aria-hidden="true" />Private window</span>
                : <span className={styles.likely} title="A device already seen here (same network, browser, OS and screen) arrived with a brand-new visitor cookie: a private window, or cookies were cleared"><ScanSearch size={11} aria-hidden="true" />Likely private</span>}
                <small>{v.privateWindow === "detected" ? "reported by the browser" : "fresh cookie, known device"}</small></td>
              <td><time dateTime={v.sessionArrived}>{when.format(Date.parse(v.sessionArrived))}</time><small>{ago(now - Date.parse(v.sessionArrived))}</small></td>
              <td><span className={table.time}><Clock size={12} aria-hidden="true" />{spent(v.stayDurationMs)}</span><small>{v.views} {v.views === 1 ? "page view" : "page views"}</small></td>
              <td><span className={table.time}><Timer size={12} aria-hidden="true" />{spent(v.sessionEngagedMs)}</span><small>{v.page?.open ? "still counting" : "visible time"}</small></td>
              <td>{v.live
                ? <span className={table.liveTag}><Radio size={11} aria-hidden="true" />On the site</span>
                : <span className={table.leftTag}><LogOut size={11} aria-hidden="true" />Left {v.left ? ago(now - v.left) : ""}</span>}</td>
              <td><span className={table.place}><Flag code={code} /><span>{code ? countryName(code) || code : "Not resolved"}<small>{place || "City not resolved"}</small></span></span></td>
              <td><span className={table.device}><Device size={13} aria-hidden="true" /><span>{[visit.browser, visit.os].filter(Boolean).join(" · ") || "Not reported"}<small>{visit.screen ? `${visit.screen} px` : ""}</small></span></span></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <Pager page={current} pages={pages} total={visitors.length} size={PAGE_SIZE} onPage={setPage} />
    </> : <p className={table.empty}><EyeOff size={14} aria-hidden="true" />No private-window visitors in {windowLabel} yet.</p>}
    <p className={styles.note}>Only visits to this site are visible, never a browser&rsquo;s history. Firefox and Safari report a private window directly; Chrome, Edge and other Chromium browsers hide it, so those visitors are inferred from a known device arriving with a new cookie, which clearing cookies also causes.</p>
  </article>;
}
