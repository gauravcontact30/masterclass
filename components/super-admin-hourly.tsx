"use client";
import { useEffect, useState } from "react";
import { CalendarDays, Clock, RefreshCw, Users, MousePointerClick, Radio } from "lucide-react";
import { reportDay } from "@/lib/daily-social";
import type { ActivityHours } from "@/lib/activity-hours";
import { Card } from "./ui/card";
import shell from "./super-admin-dashboard.module.css";
import styles from "./super-admin-hourly.module.css";

const time = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
const trackedTime = (value: string | null) => value ? new Date(value).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "Not recorded";
const periods = ["Night · 00–06", "Morning · 06–12", "Afternoon · 12–18", "Evening · 18–24"];

export function SuperAdminHourly() {
  const [chosen, setChosen] = useState("");
  const [now, setNow] = useState(() => new Date());
  const today = reportDay(now);
  const currentHour = new Date(now.getTime() + 19800_000).getUTCHours();
  const date = chosen || today;
  const isToday = date === today;
  const [data, setData] = useState<ActivityHours | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  // Keep the highlight accurate even if a report refresh fails or a hidden tab resumes.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") setNow(new Date()); };
    const timer = setInterval(tick, 15_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      setBusy(true);
      setError("");
      try {
        const response = await fetch(`/api/super-admin/activity/hours?date=${date}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Could not load daily hours. Try refreshing.");
        const body: ActivityHours = await response.json();
        if (!controller.signal.aborted) { setData(body); setError(""); }
      } catch (cause) {
        if (!controller.signal.aborted) { setData(null); setError(cause instanceof Error ? cause.message : "Could not load daily hours."); }
      } finally { pending = false; if (!controller.signal.aborted) setBusy(false); }
    };
    void refresh();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [date, reload]);
  const snapshot = data?.date === date ? data : null;
  const peak = snapshot ? Math.max(...snapshot.hours.map(row => row.views)) : 0;
  const peaks = snapshot?.hours.filter(row => row.views === peak && peak > 0) ?? [];
  const detail = snapshot?.hours[selected ?? (isToday ? currentHour : peaks[0]?.hour ?? 0)];
  const viewingCurrent = isToday && detail?.hour === currentHour;
  return <Card className={`${shell.panel} ${styles.card}`}>
    <header className={styles.header}><h2><Clock size={17} aria-hidden="true" />Busiest hours (IST)</h2>
      <button type="button" aria-label="Refresh daily hours" data-tooltip="Refresh daily hours" disabled={busy} onClick={() => setReload(value => value + 1)}><RefreshCw size={16} /></button></header>
    <div className={styles.date}><label><CalendarDays size={16} aria-hidden="true" /><span>Date (IST)</span><input type="date" aria-label="Busiest hours date" max={today} value={date} onChange={event => { if (event.target.value && event.target.value <= today) { setChosen(event.target.value); setSelected(null); } }} /></label><button type="button" onClick={() => { setChosen(""); setSelected(null); }}>Today</button></div>
    <p className={styles.note}>{new Date(`${date}T00:00:00+05:30`).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full" })} · 00:00–24:00 IST</p>
    {error && <p role="alert">{error}</p>}
    {!snapshot && !error && <p role="status">Loading daily hours…</p>}
    {snapshot && <>
      <div className={styles.metrics}>
        {[{ label: "Page views", value: snapshot.totals.views, icon: MousePointerClick }, { label: "Unique visitors", value: snapshot.totals.visitors, icon: Users }, { label: "Sessions", value: snapshot.totals.sessions, icon: Radio }, { label: "Signed-in users", value: snapshot.totals.signedIn, icon: Users }].map(({ label, value, icon: Icon }, index) => <div key={label} data-tone={index}><span><Icon size={14} aria-hidden="true" />{label}</span><strong>{value.toLocaleString("en-IN")}</strong></div>)}
      </div>
      <p className={styles.peak}>{peak ? <>Peak: {peaks.map(row => time(row.hour)).join(", ")} · {peak} views per peak hour ({Math.round(peak / snapshot.totals.views * 100)}% of daily views)</> : "No page views recorded for this date."}</p>
      <div className={styles.periods}>{periods.map((label, index) => <div key={label} data-tone={index}><span>{label}</span><strong>{snapshot.hours.slice(index * 6, index * 6 + 6).reduce((sum, row) => sum + row.views, 0)} views</strong></div>)}</div>
      {isToday && <div className={styles.currentBar}><span><Clock size={14} aria-hidden="true" />Current hour: <strong>{time(currentHour)}–{time(currentHour + 1)} IST</strong></span><button type="button" onClick={() => setSelected(null)}>Follow current hour</button></div>}
      <div className={styles.hours} role="group" aria-label="Select an hour for details">{snapshot.hours.map(row => {
        const current = isToday && row.hour === currentHour;
        return <button key={row.hour} type="button" data-tone={Math.floor(row.hour / 6)} data-current={current || undefined} data-peak={row.views === peak && peak > 0 || undefined} aria-current={current ? "time" : undefined} aria-pressed={detail?.hour === row.hour} aria-label={`${current ? "Current hour, " : ""}${time(row.hour)} IST, ${row.views} views, ${row.visitors} visitors`} onClick={() => setSelected(row.hour)}><span>{time(row.hour)}</span><strong>{row.views}</strong><small>{current ? "NOW" : "views"}</small></button>;
      })}</div>
      {detail && <section className={styles.detail} data-current={viewingCurrent || undefined} aria-label="Selected hour details">
        <div className={styles.detailHeading}><h3>{time(detail.hour)}–{time(detail.hour + 1)} IST</h3>{viewingCurrent && <span className={styles.liveBadge}>Current hour · in progress</span>}</div>
        <dl className={styles.detailMetrics}>
          <div><dt>Page views</dt><dd>{detail.views}</dd></div>
          <div><dt>Unique visitors</dt><dd>{detail.visitors}</dd></div>
          <div><dt>Sessions</dt><dd>{detail.sessions}</dd></div>
          <div><dt>Signed-in users</dt><dd>{detail.signedIn}</dd></div>
          <div><dt>Routes visited</dt><dd>{detail.routes}</dd></div>
          <div><dt>Share of daily views</dt><dd>{snapshot.totals.views ? (detail.views / snapshot.totals.views * 100).toFixed(1) : "0"}%</dd></div>
          <div><dt>First tracked view (IST)</dt><dd>{trackedTime(detail.firstSeen)}</dd></div>
          <div><dt>Latest tracked view (IST)</dt><dd>{trackedTime(detail.lastSeen)}</dd></div>
        </dl>
        {viewingCurrent && <p className={styles.note}>Counts cover this hour so far, through the last successful refresh. They are page-view activity, not a count of people currently online.</p>}
        <h4>Most viewed routes</h4>{detail.pages.length ? <ul><li className={styles.listHead} aria-hidden="true"><span>Route</span><strong>Views · share</strong></li>{detail.pages.map(page => <li key={page.path}><span>{page.path}</span><strong>{page.views} views · {(page.views / detail.views * 100).toFixed(0)}%</strong></li>)}</ul> : <p>No visits recorded in this hour yet.</p>}
      </section>}
      {snapshot.capped && <p role="status">Partial report: showing the first 20,000 page views for this day.</p>}
      <p className={styles.note}>Updated {new Date(snapshot.generatedAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST · Refreshes every 30 seconds. Visitors are unique browsers; hourly counts may overlap. Bots excluded.</p>
    </>}
  </Card>;
}
