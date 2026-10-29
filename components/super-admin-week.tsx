"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownRight, ArrowUpRight, BookOpen, CalendarRange, Clock, Eye, FileText, Layers, Minus, MousePointerClick, RefreshCw, Repeat, Trophy, UserCheck, UserPlus, Users } from "lucide-react";
import type { WeekReport, WeekTotals } from "@/lib/week-report";
import { AdminError, AdminLoading } from "./super-admin-feedback";
import styles from "./super-admin-week.module.css";

// Recharts loads with this section only, never with the console's first paint (or any public page).
const Donut = dynamic(() => import("./super-admin-week-charts").then(module => module.Donut), { ssr: false, loading: () => <div className={styles.chartSkeleton} /> });
const DayBars = dynamic(() => import("./super-admin-week-charts").then(module => module.DayBars), { ssr: false, loading: () => <div className={styles.chartSkeleton} /> });

type Report = WeekReport & { capped: boolean; generatedAt: string };
const n = (value: number) => value.toLocaleString("en-IN");
const time = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
const shortDay = (date: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00+05:30`));
const ist = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(iso));
const MEDAL = ["🥇", "🥈", "🥉"];

/** The comparison figures: what each measures, and whether a rise is good (bounce rate is the one where it is not). */
const FIGURES: { key: keyof WeekTotals; label: string; icon: typeof Users; note: string; format?: (value: number) => string; lowerIsBetter?: boolean }[] = [
  { key: "visitors", label: "Visitors", icon: Users, note: "Different browsers that opened a page" },
  { key: "newVisitors", label: "New visitors", icon: UserPlus, note: "First visit ever in this window" },
  { key: "signedIn", label: "Signed-in learners", icon: UserCheck, note: "Accounts that opened a page" },
  { key: "sessions", label: "Sessions", icon: Repeat, note: "Separate visits" },
  { key: "views", label: "Page views", icon: Eye, note: "Pages opened (≥ 1 second)" },
  { key: "engagedSeconds", label: "Time read", icon: Clock, note: "Visible reading time, all visitors", format: time },
  { key: "avgSecondsPerVisitor", label: "Avg. time per visitor", icon: Clock, note: "Time read ÷ visitors", format: time },
  { key: "pagesPerSession", label: "Pages per session", icon: Layers, note: "Depth of each visit", format: value => value.toFixed(2) },
  { key: "bounceRate", label: "Bounce rate", icon: MousePointerClick, note: "Sessions that saw one page", format: value => `${value}%`, lowerIsBetter: true },
];

function Delta({ now, before, lowerIsBetter = false }: Readonly<{ now: number; before: number; lowerIsBetter?: boolean }>) {
  if (!before && !now) return <span className={styles.delta} data-trend="flat"><Minus size={12} aria-hidden="true" />No change</span>;
  if (!before) return <span className={styles.delta} data-trend="up">New this week</span>;
  const change = Math.round(((now - before) / before) * 1000) / 10;
  const trend = change === 0 ? "flat" : (change > 0) !== lowerIsBetter ? "up" : "down";
  const Icon = change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={styles.delta} data-trend={trend}><Icon size={12} aria-hidden="true" />{change > 0 ? "+" : ""}{change}% vs previous 7 days</span>;
}

/**
 * Overview → "Last 7 days": the seven IST days ending today, compared with the seven before them. Ranks the days by
 * visitors, the learning paths and contents by page views, and splits sessions by device, source and country.
 * Data: /api/super-admin/activity/week (lib/week-report.ts).
 */
export function SuperAdminWeek() {
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setBusy(true);
      try {
        const response = await fetch("/api/super-admin/activity/week", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 503 ? "The visit table is not available yet." : "Could not load the last 7 days. Try refreshing.");
        const body: Report = await response.json();
        if (!controller.signal.aborted) { setData(body); setError(""); }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load the last 7 days.");
      } finally { if (!controller.signal.aborted) setBusy(false); }
    };
    void load();
    // A week changes slowly: refresh every five minutes while the tab is visible.
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 300_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [reload]);

  const ranked = data ? [...data.days].sort((a, b) => a.rank - b.rank) : [];
  const peak = ranked[0];
  const learningViews = data?.paths.reduce((sum, path) => sum + path.views, 0) ?? 0;

  return <section className={styles.panel} aria-labelledby="week-report-title">
    <div className={styles.head}>
      <span className={styles.mark} aria-hidden="true"><CalendarRange size={18} /></span>
      <div>
        <h2 id="week-report-title">Last 7 days</h2>
        <p>{data ? `${shortDay(data.from)} – ${shortDay(data.to)} (today so far) compared with the 7 days before · updated ${ist(data.generatedAt)} IST` : "Visitors, learning paths and contents, day by day, compared with the week before."}</p>
      </div>
      <button type="button" onClick={() => setReload(value => value + 1)} disabled={busy} aria-label="Refresh the last 7 days" title="Refresh"><RefreshCw size={15} className={busy ? styles.spin : undefined} aria-hidden="true" /></button>
    </div>
    {error && <AdminError>{error}</AdminError>}
    {!data && !error && <AdminLoading>Reading the last 14 days of visits…</AdminLoading>}
    {data && <>
      {data.capped && <p className={styles.notice} role="status">A very busy day passed the per-day reading limit, so its figures are a lower bound.</p>}

      <dl className={styles.figures}>{FIGURES.map(({ key, label, icon: Icon, note, format = n, lowerIsBetter }) => <div key={key}>
        <dt><Icon size={13} aria-hidden="true" />{label}</dt>
        <dd>{format(data.current[key])}</dd>
        <Delta now={data.current[key]} before={data.previous[key]} lowerIsBetter={lowerIsBetter} />
        <small>{note} · before: {format(data.previous[key])}</small>
      </div>)}</dl>

      <div className={styles.split}>
        <article className={styles.card}>
          <h3><Trophy size={15} aria-hidden="true" />Busiest days, ranked by visitors</h3>
          {peak && peak.visitors > 0 ? <p className={styles.callout}>Peak day: <b>{peak.weekday}</b> with <b>{n(peak.visitors)}</b> visitors and <b>{n(peak.views)}</b> page views{peak.topPath ? <>, mostly in <b>{peak.topPath.name}</b></> : null}.</p> : <p className={styles.callout}>No visits recorded in these 7 days yet.</p>}
          <DayBars data={data.days.map(day => ({ label: shortDay(day.date), visitors: day.visitors, views: day.views, rank: day.rank, partial: day.partial }))} />
          <ol className={styles.ranking}>{ranked.map(day => <li key={day.date} data-top={day.rank <= 3 || undefined}>
            <span className={styles.rank}>{day.rank <= 3 && day.visitors > 0 ? <span aria-hidden="true">{MEDAL[day.rank - 1]}</span> : null}#{day.rank}</span>
            <span className={styles.rankDay}><b>{day.weekday}</b>{day.partial && <em>today, so far</em>}<small>{day.topPath ? `Most used: ${day.topPath.name}` : "No learning pages opened"}</small></span>
            <span className={styles.rankFigures}><b>{n(day.visitors)}</b> visitors<small>{n(day.views)} views · {time(day.engagedSeconds)}</small></span>
          </li>)}</ol>
        </article>
        <Donut title="Share of the week's visitors, by day" unit="visitors" center="visitor-days" data={data.days.map(day => ({ name: shortDay(day.date) + (day.partial ? " (today)" : ""), value: day.visitors }))} />
      </div>

      <div className={styles.donuts}>
        <Donut title="Learning paths, by page views" unit="views" data={(() => {
          const top = data.paths.slice(0, 6), rest = data.paths.slice(6).reduce((sum, path) => sum + path.views, 0);
          return [...top.map(path => ({ name: path.name, value: path.views })), ...(rest ? [{ name: "Other", value: rest }] : [])];
        })()} />
        <Donut title="Devices, by sessions" unit="sessions" data={data.devices} />
        <Donut title="Traffic sources, by sessions" unit="sessions" data={data.sources} />
        <Donut title="Countries, by sessions" unit="sessions" data={data.countries} />
      </div>

      <article className={styles.card}>
        <h3><BookOpen size={15} aria-hidden="true" />Most used learning paths</h3>
        {data.paths.length ? <div className={styles.tableWrap}><table>
          <thead><tr><th scope="col">Rank</th><th scope="col">Learning path</th><th scope="col">Page views</th><th scope="col">Share</th><th scope="col">Visitors</th><th scope="col">Time read</th><th scope="col">Avg. per view</th></tr></thead>
          <tbody>{data.paths.map((path, index) => <tr key={path.name} data-top={index < 3 || undefined}>
            <td>{index < 3 ? `${MEDAL[index]} ` : ""}#{index + 1}</td><th scope="row">{path.name}</th><td>{n(path.views)}</td>
            <td><span className={styles.share} style={{ "--share": `${learningViews ? (path.views / learningViews) * 100 : 0}%` } as React.CSSProperties} aria-hidden="true" />{learningViews ? Math.round((path.views / learningViews) * 1000) / 10 : 0}%</td>
            <td>{n(path.visitors)}</td><td>{time(path.engagedSeconds)}</td><td>{time(path.views ? path.engagedSeconds / path.views : 0)}</td>
          </tr>)}</tbody>
        </table></div> : <p className={styles.empty}>No learning pages were opened in these 7 days.</p>}
      </article>

      <article className={styles.card}>
        <h3><FileText size={15} aria-hidden="true" />Most read contents</h3>
        {data.contents.length ? <div className={styles.tableWrap}><table>
          <thead><tr><th scope="col">Rank</th><th scope="col">Content</th><th scope="col">Learning path</th><th scope="col">Page views</th><th scope="col">Visitors</th><th scope="col">Avg. time</th><th scope="col">Days opened</th></tr></thead>
          <tbody>{data.contents.map((content, index) => <tr key={content.path} data-top={index < 3 || undefined}>
            <td>{index < 3 ? `${MEDAL[index]} ` : ""}#{index + 1}</td>
            <th scope="row"><a href={content.path} target="_blank" rel="noreferrer">{content.title}</a><small>{content.path}</small></th>
            <td>{content.learningPath}</td><td>{n(content.views)}</td><td>{n(content.visitors)}</td><td>{time(content.avgSeconds)}</td><td>{content.days} of 7</td>
          </tr>)}</tbody>
        </table></div> : <p className={styles.empty}>No learning content was opened in these 7 days.</p>}
      </article>

      <article className={styles.card}>
        <h3><CalendarRange size={15} aria-hidden="true" />Day by day, every metric</h3>
        <div className={styles.tableWrap}><table>
          <thead><tr><th scope="col">Day</th><th scope="col">Rank</th><th scope="col">Visitors</th><th scope="col">New</th><th scope="col">Signed in</th><th scope="col">Sessions</th><th scope="col">Views</th><th scope="col">Pages / session</th><th scope="col">Bounce</th><th scope="col">Avg. time / visitor</th><th scope="col">Time read</th><th scope="col">Most used path</th><th scope="col">Most read content</th></tr></thead>
          <tbody>{[...data.days].reverse().map(day => <tr key={day.date} data-top={(day.rank <= 3 && day.visitors > 0) || undefined}>
            <th scope="row">{day.weekday}{day.partial && <small>today, so far</small>}</th>
            <td>{day.rank <= 3 && day.visitors > 0 ? `${MEDAL[day.rank - 1]} ` : ""}#{day.rank}</td>
            <td>{n(day.visitors)}</td><td>{n(day.newVisitors)}</td><td>{n(day.signedIn)}</td><td>{n(day.sessions)}</td><td>{n(day.views)}</td>
            <td>{day.pagesPerSession.toFixed(2)}</td><td>{day.bounceRate}%</td><td>{time(day.avgSecondsPerVisitor)}</td><td>{time(day.engagedSeconds)}</td>
            <td>{day.topPath ? `${day.topPath.name} (${n(day.topPath.views)})` : "—"}</td>
            <td>{day.topContent ? <a href={day.topContent.path} target="_blank" rel="noreferrer">{day.topContent.title} ({n(day.topContent.views)})</a> : "—"}</td>
          </tr>)}</tbody>
        </table></div>
        <p className={styles.footnote}>Days are India time (IST). People only: crawlers, automated browsers and the site&apos;s own machines are left out, and a page counts once it has been visible for a second. A browser seen on several days counts once per day, so the day totals add up to more than the week&apos;s visitors.</p>
      </article>
    </>}
  </section>;
}
