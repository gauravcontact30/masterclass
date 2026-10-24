"use client";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Clock, FileText, Footprints, Inbox, LayoutGrid, RefreshCw, Users, MousePointerClick, Radio, Route, SquareMousePointer, UserRound, type LucideIcon } from "lucide-react";
import { reportDay } from "@/lib/daily-social";
import type { ActivityHours, HourDetails } from "@/lib/activity-hours";
import { Card } from "./ui/card";
import { Pager } from "./super-admin-pager";
import shell from "./super-admin-dashboard.module.css";
import styles from "./super-admin-hourly.module.css";

const time = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
const trackedTime = (value: string | null) => value ? new Date(value).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "Not recorded";
const span = (first: string, last: string) => first === last ? trackedTime(first) : `${trackedTime(first)} – ${trackedTime(last)}`;
type DetailTab = "views" | "visitors" | "users" | "routes";
/** Visit paths are long cards, so the list shows this many visitors a page. */
const PATHS_PAGE = 8;
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
  const [tab, setTab] = useState<DetailTab>("views");
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
  return <><Card className={`${shell.panel} ${styles.card} ${styles.hoursCard}`}>
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
      {snapshot.capped && <p role="status">Partial report: showing the first 20,000 page views for this day.</p>}
      <p className={styles.note}>Updated {new Date(snapshot.generatedAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST · Refreshes every 30 seconds. Visitors are unique browsers; hourly counts may overlap. Bots excluded.</p>
    </>}
  </Card>
  {/* The selected hour (the current one by default) in its own card, on the left under Daily traffic. */}
  <Card className={`${shell.panel} ${styles.card} ${styles.detailCard}`}>
    {detail && snapshot ? <section className={styles.detail} data-current={viewingCurrent || undefined} aria-label="Selected hour details">
      <div className={styles.detailHeading}><h3>{time(detail.hour)}–{time(detail.hour + 1)} IST</h3>{viewingCurrent ? <span className={styles.liveBadge}>Current hour · in progress</span> : <button type="button" onClick={() => setSelected(null)}>{isToday ? "Back to current hour" : "Back to peak hour"}</button>}</div>
      <dl className={styles.detailMetrics}>
        <div><dt>Page views</dt><dd>{detail.views}</dd></div>
        <div><dt>Unique visitors</dt><dd>{detail.visitors}</dd></div>
        <div><dt>Sessions</dt><dd>{detail.sessions}</dd></div>
        <div><dt>Signed-in users</dt><dd>{detail.signedIn}</dd></div>
        <div><dt>Routes visited</dt><dd>{detail.routes}</dd></div>
        <div><dt>Section & card clicks</dt><dd>{detail.details.clicks}</dd></div>
        <div><dt>Share of daily views</dt><dd>{snapshot.totals.views ? (detail.views / snapshot.totals.views * 100).toFixed(1) : "0"}%</dd></div>
        <div><dt>First tracked view (IST)</dt><dd>{trackedTime(detail.firstSeen)}</dd></div>
        <div><dt>Latest tracked view (IST)</dt><dd>{trackedTime(detail.lastSeen)}</dd></div>
      </dl>
      {viewingCurrent && <p className={styles.note}>Counts cover this hour so far, through the last successful refresh. They are page-view activity, not a count of people currently online.</p>}
      <HourTabs key={`${date}-${detail.hour}`} details={detail.details} views={detail.views} tab={tab} onTab={setTab} />
    </section> : <p role="status">{error || "Loading hour details…"}</p>}
  </Card></>;
}

const TABS: { id: DetailTab; label: string; icon: LucideIcon; count: (d: HourDetails, views: number) => number }[] = [
  { id: "views", label: "Page views · sections & cards", icon: MousePointerClick, count: (_, views) => views },
  { id: "visitors", label: "Unique visitors", icon: Users, count: d => d.visitors.length },
  { id: "users", label: "Signed-in users", icon: UserRound, count: d => d.users.length },
  { id: "routes", label: "Routes visited", icon: Route, count: d => d.routes.length },
];

/** A ranked list with a bar per row, its width the share of the top row. */
function Bars({ rows }: { rows: { key: string; label: string; value: number; note: string }[] }) {
  const top = Math.max(1, ...rows.map(row => row.value));
  return <ol className={styles.bars}>{rows.map((row, index) => <li key={row.key}>
    <span className={styles.rank} aria-hidden="true">{index + 1}</span>
    <span className={styles.barText}><b title={row.label}>{row.label}</b><small title={row.note}>{row.note}</small><i style={{ width: `${Math.max(6, (row.value / top) * 100)}%` }} aria-hidden="true" /></span>
    <strong>{row.value}<small>{row.value === 1 ? "click" : "clicks"}</small></strong>
  </li>)}</ol>;
}

function Empty({ icon: Icon, text, hint }: { icon: LucideIcon; text: string; hint?: string }) {
  return <div className={styles.empty}><span aria-hidden="true"><Icon size={16} /></span><p><b>{text}</b>{hint && <small>{hint}</small>}</p></div>;
}

/** The four detail views of one hour, one tab each; every table scrolls sideways on its own when narrow. */
function HourTabs({ details, views, tab, onTab }: { details: HourDetails; views: number; tab: DetailTab; onTab: (tab: DetailTab) => void }) {
  // Keyed by day and hour, so choosing another hour starts its visit paths on page 1.
  const [pathsPage, setPathsPage] = useState(1);
  const pathPages = Math.max(1, Math.ceil(details.journeys.length / PATHS_PAGE));
  const pathAt = Math.min(pathsPage, pathPages);
  const empty = (text: string) => <Empty icon={Inbox} text={text} />;
  return <div>
    <div className={styles.tabs} role="tablist" aria-label="Hour details">{TABS.map(({ id, label, icon: Icon, count }) => <button key={id} type="button" role="tab" id={`hour-tab-${id}`} aria-controls="hour-tab-panel" aria-selected={tab === id} onClick={() => onTab(id)}><Icon size={13} aria-hidden="true" />{label}<b>{count(details, views)}</b></button>)}</div>
    <div className={styles.tabPanel} role="tabpanel" id="hour-tab-panel" aria-labelledby={`hour-tab-${tab}`}>
      {tab === "views" && <>
        <div className={styles.insights}>
          <section className={styles.insight} data-tone="sections" aria-labelledby="hour-sections">
            <h4 id="hour-sections"><LayoutGrid size={14} aria-hidden="true" />Sections clicked</h4>
            {details.sections.length ? <Bars rows={details.sections.slice(0, 8).map(row => ({ key: row.section, label: row.section, value: row.clicks, note: `${row.visitors} ${row.visitors === 1 ? "visitor" : "visitors"}` }))} />
              : <Empty icon={LayoutGrid} text="No section clicks in this hour" hint="Clicks inside a landing or dashboard section appear here." />}
          </section>
          <section className={styles.insight} data-tone="cards" aria-labelledby="hour-cards">
            <h4 id="hour-cards"><SquareMousePointer size={14} aria-hidden="true" />Cards & options opened</h4>
            {details.cards.length ? <Bars rows={details.cards.slice(0, 8).map(row => ({ key: `${row.path}|${row.section}|${row.card}`, label: row.card, value: row.clicks, note: `${row.section} · ${row.path}${row.target ? ` → ${row.target}` : ""}` }))} />
              : <Empty icon={SquareMousePointer} text="No card clicks in this hour" hint="Cards, buttons and links opened show here with where they lead." />}
          </section>
        </div>
        <h4 className={styles.pathsHeading}><Footprints size={14} aria-hidden="true" />Visit paths <small>{details.journeys.length} {details.journeys.length === 1 ? "visitor" : "visitors"} · most recent first</small></h4>
        {details.journeys.length ? <><ol className={styles.journeys}>{details.journeys.slice((pathAt - 1) * PATHS_PAGE, pathAt * PATHS_PAGE).map(journey => <li key={journey.visitor} className={styles.journey}>
          <header>
            <span className={styles.avatar} data-signed={journey.signedIn || undefined} aria-hidden="true">{journey.email ? journey.email[0].toUpperCase() : <UserRound size={15} />}</span>
            <span className={styles.journeyWho}><b>{journey.email ?? `${journey.newVisitor ? "New" : "Returning"} visitor`}</b><small>{journey.signedIn ? "Signed in" : "Anonymous"} · #{journey.visitor}</small></span>
            <span className={styles.journeyMeta}><span>{journey.views} {journey.views === 1 ? "page" : "pages"}</span><span>{journey.clicks} {journey.clicks === 1 ? "click" : "clicks"}</span><time dateTime={journey.first}>{span(journey.first, journey.last)}</time></span>
          </header>
          {journey.total > journey.steps.length && <p className={styles.earlier}>{journey.total - journey.steps.length} earlier steps not shown</p>}
          <ol className={styles.path}>{journey.steps.map((step, index) => {
            const gap = index ? Date.parse(step.at) - Date.parse(journey.steps[index - 1].at) : 0;
            return <li key={`${step.at}-${index}`} data-kind={step.kind}>
              <span className={styles.node} aria-hidden="true">{step.kind === "view" ? <FileText size={12} /> : <MousePointerClick size={11} />}</span>
              <div className={styles.stepBody}>
                {step.kind === "view"
                  ? <><span className={styles.stepLine}><span className={styles.stepVerb}>{index ? "Opened" : "Landed on"}</span><code>{step.path}</code></span>{step.title && <small>{step.title}</small>}</>
                  : <><span className={styles.stepLine}><span className={styles.stepVerb}>Clicked</span><b>{step.card}</b>{step.target && <><ArrowRight size={11} aria-hidden="true" /><code>{step.target}</code></>}</span><small>in {step.section} · {step.path}</small></>}
              </div>
              <span className={styles.stepTime}><time dateTime={step.at}>{trackedTime(step.at)}</time>{gap > 0 && <small>+{gap < 60_000 ? `${Math.round(gap / 1000)}s` : `${Math.floor(gap / 60_000)}m ${Math.round((gap % 60_000) / 1000)}s`}</small>}</span>
            </li>;
          })}</ol>
        </li>)}</ol>
        {details.journeys.length > PATHS_PAGE && <Pager page={pathAt} pages={pathPages} total={details.journeys.length} size={PATHS_PAGE} onPage={setPathsPage} />}</> : <Empty icon={Footprints} text="No visits in this hour yet" hint="Each visitor's pages and clicks will line up here as a path." />}
        <p className={styles.note}>Sections and cards come from clicks on the landing page and the Learning Dashboard: the section heading and the card or button label, never typed text.</p>
      </>}
      {tab === "visitors" && (details.visitors.length ? <div className={styles.table}><table><thead><tr><th>Visitor</th><th>Location</th><th>Device</th><th>Views</th><th>Routes</th><th>Clicks</th><th>Last page</th><th>Seen (IST)</th></tr></thead><tbody>{details.visitors.map(row => <tr key={row.visitor}><td><b>{row.email ?? `${row.newVisitor ? "New" : "Returning"} visitor`}</b><small>{row.signedIn ? "Signed in" : "Anonymous"} · {row.visitor}</small></td><td>{row.place ?? "Unknown"}</td><td>{row.device ?? "Unknown"}</td><td>{row.views}</td><td>{row.routes}</td><td>{row.clicks}</td><td><code>{row.lastPath}</code></td><td>{span(row.first, row.last)}</td></tr>)}</tbody></table></div> : empty("No visitors in this hour yet."))}
      {tab === "users" && (details.users.length ? <div className={styles.table}><table><thead><tr><th>Learner</th><th>Views</th><th>Sessions</th><th>Routes</th><th>Most viewed</th><th>Clicks</th><th>Seen (IST)</th></tr></thead><tbody>{details.users.map(row => <tr key={row.user}><td><b>{row.email ?? "Email unavailable"}</b><small>User {row.user}</small></td><td>{row.views}</td><td>{row.sessions}</td><td>{row.routes}</td><td><code>{row.topRoute}</code></td><td>{row.clicks}</td><td>{span(row.first, row.last)}</td></tr>)}</tbody></table></div> : empty("No signed-in learners in this hour."))}
      {tab === "routes" && (details.routes.length ? <div className={styles.table}><table><thead><tr><th>Route</th><th>Views</th><th>Share</th><th>Visitors</th><th>Signed in</th><th>Clicks</th><th>Seen (IST)</th></tr></thead><tbody>{details.routes.map(row => <tr key={row.path}><td><code>{row.path}</code>{row.title && <small>{row.title}</small>}</td><td>{row.views}</td><td>{views ? `${(row.views / views * 100).toFixed(0)}%` : "—"}</td><td>{row.visitors}</td><td>{row.signedIn}</td><td>{row.clicks}</td><td>{span(row.first, row.last)}</td></tr>)}</tbody></table></div> : empty("No routes visited in this hour yet."))}
    </div>
  </div>;
}
