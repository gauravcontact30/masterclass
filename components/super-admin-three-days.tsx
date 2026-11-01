"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarClock, Clock, Eye, Flame, LineChart as LineIcon, Minus, MousePointerClick, Repeat, Timer, TrendingDown, UserCheck, UserPlus, Users } from "lucide-react";
import { periodSummary, type PeriodSummary } from "@/lib/live-visits";
import { countryName } from "./super-admin-audience";
import { useStreamVisitors } from "./use-stream-visitors";
import { AdminLoading } from "./super-admin-feedback";
import { PillPager } from "./pill-pager";

/** Hours per page of the hour-by-hour table (user request 2026-11-01: 8 rows a page, so 3 pages for 24 hours). */
const HOURS_PER_PAGE = 8;
import styles from "./super-admin-three-days.module.css";

// Recharts loads with this section only (as in super-admin-week.tsx), never with the console's first paint.
const HourlyCompare = dynamic(() => import("./super-admin-three-days-charts").then(module => module.HourlyCompare), { ssr: false, loading: () => <div className={styles.chartSkeleton} /> });
const Donut = dynamic(() => import("./super-admin-week-charts").then(module => module.Donut), { ssr: false, loading: () => <div className={styles.chartSkeleton} /> });

const DAY_MS = 86_400_000, IST_MS = 19_800_000;
/** 00:00 IST of the day containing ms. */
const istMidnight = (ms: number) => Math.floor((ms + IST_MS) / DAY_MS) * DAY_MS - IST_MS;
const COLOURS = ["#a8b3c4", "#2a78d6", "#eb6834"];
const n = (value: number | null | undefined) => value == null ? "—" : value.toLocaleString("en-IN");
const spent = (ms: number | null) => {
  if (ms == null) return "—";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};
const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
const hourRange = (hour: number) => `${hourLabel(hour)}–${hourLabel((hour + 1) % 24)}`;
const dateLabel = (ms: number) => new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(ms + 12 * 3600_000));
const clock = (ms: number) => new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(ms));
/** Time-of-day bands (IST), for the donuts. */
const BANDS: [string, number, number][] = [["Night 00–06", 0, 6], ["Morning 06–12", 6, 12], ["Afternoon 12–18", 12, 18], ["Evening 18–24", 18, 24]];
const peakOf = (values: number[]) => values.reduce((best, value, hour) => value > best.value ? { hour, value } : best, { hour: -1, value: 0 });

/** A change against a baseline: arrow, percentage, and "new" when the baseline was zero. */
function Change({ now, before, lowerIsBetter = false, label }: Readonly<{ now: number | null; before: number | null; lowerIsBetter?: boolean; label: string }>) {
  if (now == null || before == null) return <span className={styles.change} data-trend="flat"><Minus size={11} aria-hidden="true" />{label}: no data</span>;
  if (before === 0) return <span className={styles.change} data-trend={now ? "up" : "flat"}>{now ? <><ArrowUpRight size={11} aria-hidden="true" />{label}: up from 0</> : <><Minus size={11} aria-hidden="true" />{label}: both 0</>}</span>;
  const pct = Math.round(((now - before) / before) * 1000) / 10;
  const good = pct === 0 ? "flat" : (pct > 0) !== lowerIsBetter ? "up" : "down";
  const Icon = pct === 0 ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={styles.change} data-trend={good}><Icon size={11} aria-hidden="true" />{pct > 0 ? "+" : ""}{pct}% {label}</span>;
}

type Day = { label: string; date: string; start: number; end: number; sum: PeriodSummary; partial: boolean };
type Breakdown = "pages" | "sources" | "countries" | "devices";

/**
 * Overview → "Three days, hour by hour": the day before yesterday, yesterday and today (so far), each a full IST
 * calendar day, compared hour by hour. Counted from the Live visitor stream's visitors (lib/live-visits.ts
 * periodSummary), so every figure agrees with the command centre above: bots, automated browsers and visitors under a
 * second left out, one person per account or linked device. Today is compared with yesterday *up to the same time*,
 * which is the only fair comparison while the day is still running.
 */
export function SuperAdminThreeDays() {
  const stream = useStreamVisitors(60_000);
  const [metric, setMetric] = useState<"views" | "people">("views");
  const [mode, setMode] = useState<"lines" | "bars">("lines");
  const [breakdown, setBreakdown] = useState<Breakdown>("pages");
  const [hourPage, setHourPage] = useState<number | null>(null);
  const data = useMemo(() => {
    if (!stream.everyone) return null;
    // The server's clock (refreshed every minute), so the windows match the rows' stamps.
    const now = stream.now, today = istMidnight(now);
    const days: Day[] = [["Day before yesterday", today - 2 * DAY_MS], ["Yesterday", today - DAY_MS], ["Today", today]].map(([label, start]) => {
      const from = Number(start), end = from + DAY_MS;
      return { label: String(label), date: dateLabel(from), start: from, end, sum: periodSummary(stream.everyone!, from, end), partial: end > now };
    });
    const elapsed = now - today;
    // Yesterday and the day before, cut at the same time of day as now: what today is fairly compared with.
    const sameTime = [periodSummary(stream.everyone, today - 2 * DAY_MS, today - 2 * DAY_MS + elapsed), periodSummary(stream.everyone, today - DAY_MS, today - DAY_MS + elapsed)];
    return { now, today, days, sameTime, nowHour: new Date(now + IST_MS).getUTCHours() };
  }, [stream]);

  if (!data) return <section className={styles.panel} aria-labelledby="three-days-title"><h2 id="three-days-title" className={styles.loadingTitle}>Three days, hour by hour</h2><AdminLoading>Reading the last three days of visits…</AdminLoading></section>;
  const { days, sameTime, nowHour, now } = data;
  const [dby, yesterday, today] = days;
  const series = (day: Day) => metric === "views" ? day.sum.hours : day.sum.hourPeople;
  const unit = metric === "views" ? "page views" : "visitors";
  // Hours of today that have not started yet are null: unknown, not zero.
  const rows = Array.from({ length: 24 }, (_, hour) => ({ hour: hourLabel(hour), values: days.map((day, i) => i === 2 && hour > nowHour ? null : series(day)[hour]) }));
  // Opens on the page holding the current hour; the pager takes over once used.
  const hourPages = Math.ceil(rows.length / HOURS_PER_PAGE);
  const shownHourPage = Math.min(hourPage ?? Math.floor(nowHour / HOURS_PER_PAGE), hourPages - 1);
  const peaks = days.map(day => peakOf(series(day)));
  const totals = days.map(day => series(day).reduce((sum, value) => sum + value, 0));
  const bandSlices = (day: Day, i: number) => BANDS.map(([name, from, to]) => ({ name, value: series(day).slice(from, i === 2 ? Math.min(to, nowHour + 1) : to).reduce((sum, value) => sum + value, 0) }));
  const figures: { key: string; label: string; icon: typeof Users; value: (s: PeriodSummary) => number | null; show: (s: PeriodSummary) => string; lowerIsBetter?: boolean }[] = [
    { key: "people", label: "Visitors", icon: Users, value: s => s.people, show: s => n(s.people) },
    { key: "views", label: "Page views", icon: Eye, value: s => s.views, show: s => n(s.views) },
    { key: "sessions", label: "Visits", icon: Repeat, value: s => s.sessions, show: s => n(s.sessions) },
    { key: "new", label: "New visitors", icon: UserPlus, value: s => s.newVisitors, show: s => n(s.newVisitors) },
    { key: "signed", label: "Signed in", icon: UserCheck, value: s => s.signedIn, show: s => n(s.signedIn) },
    { key: "stay", label: "Avg. visit", icon: Timer, value: s => s.avgStayMs, show: s => spent(s.avgStayMs) },
    { key: "read", label: "Reading / visitor", icon: Clock, value: s => s.readingPerPersonMs, show: s => spent(s.readingPerPersonMs) },
    { key: "bounce", label: "Bounce rate", icon: TrendingDown, value: s => s.bounceRate, show: s => s.bounceRate == null ? "—" : `${s.bounceRate}%`, lowerIsBetter: true },
  ];
  const lists: Record<Breakdown, (s: PeriodSummary) => { name: string; value: number; sub?: string }[]> = {
    pages: s => s.pages.slice(0, 6).map(p => ({ name: p.path, value: p.people, sub: `${n(p.views)} views` })),
    sources: s => s.sources.slice(0, 6).map(p => ({ name: p.source, value: p.people })),
    countries: s => s.countries.slice(0, 6).map(p => ({ name: countryName(p.country) || p.country, value: p.people })),
    devices: s => s.devices.map(p => ({ name: p.device.charAt(0).toUpperCase() + p.device.slice(1), value: p.people })),
  };

  return <section className={styles.panel} aria-labelledby="three-days-title">
    <header className={styles.head}>
      <span className={styles.mark} aria-hidden="true"><CalendarClock size={18} /></span>
      <div>
        <h2 id="three-days-title">Three days, hour by hour</h2>
        <p>{dby.date} · {yesterday.date} · {today.date} (today until {clock(now)} IST). Each day runs 00:00–24:00 IST. Counted like the Live visitor stream: people only, one per account or linked device.</p>
      </div>
    </header>
    {stream.capped && <p className={styles.notice} role="status">The visitor stream hit its 20,000-event limit, so these figures are a lower bound.</p>}

    {/* One card per day; today's changes compare with the same hours of the earlier days. */}
    <div className={styles.dayCards}>
      {days.map((day, i) => <article key={day.label} className={styles.dayCard} style={{ "--day": COLOURS[i] } as React.CSSProperties}>
        <div className={styles.dayHead}><i aria-hidden="true" /><div><h3>{day.label}</h3><small>{day.date}{day.partial ? ` · so far, to ${clock(now)}` : " · full day"}</small></div></div>
        <dl className={styles.dayFigures}>{figures.map(figure => <div key={figure.key}>
          <dt><figure.icon size={12} aria-hidden="true" />{figure.label}</dt>
          <dd>{figure.show(day.sum)}</dd>
          {i === 1 && <Change now={figure.value(yesterday.sum)} before={figure.value(dby.sum)} lowerIsBetter={figure.lowerIsBetter} label="vs day before" />}
          {i === 2 && <Change now={figure.value(today.sum)} before={figure.value(sameTime[1])} lowerIsBetter={figure.lowerIsBetter} label="vs yesterday by now" />}
        </div>)}</dl>
        <p className={styles.peak}><Flame size={13} aria-hidden="true" />{peaks[i].hour >= 0 ? <>Busiest hour <b>{hourRange(peaks[i].hour)}</b> · {n(peaks[i].value)} {unit}</> : `No ${unit} ${day.partial ? "yet" : "this day"}`}</p>
      </article>)}
    </div>

    <p className={styles.fair}><Clock size={14} aria-hidden="true" />By {clock(now)} IST: today <b>{n(today.sum.people)}</b> visitors · yesterday by then <b>{n(sameTime[1].people)}</b> · day before by then <b>{n(sameTime[0].people)}</b>. Page views: <b>{n(today.sum.views)}</b> · <b>{n(sameTime[1].views)}</b> · <b>{n(sameTime[0].views)}</b>.</p>

    <article className={styles.card}>
      <div className={styles.cardHead}>
        <h3>Hourly {unit}, IST</h3>
        <div className={styles.toggles}>
          <div role="group" aria-label="Measure">{(["views", "people"] as const).map(id => <button key={id} type="button" aria-pressed={metric === id} onClick={() => setMetric(id)}>{id === "views" ? <><MousePointerClick size={13} aria-hidden="true" />Page views</> : <><Users size={13} aria-hidden="true" />Visitors</>}</button>)}</div>
          <div role="group" aria-label="Chart style">{(["lines", "bars"] as const).map(id => <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>{id === "lines" ? <><LineIcon size={13} aria-hidden="true" />Lines</> : <><BarChart3 size={13} aria-hidden="true" />Bars</>}</button>)}</div>
        </div>
      </div>
      <HourlyCompare rows={rows} labels={days.map(day => `${day.label} (${day.date})`)} mode={mode} unit={unit} nowHour={nowHour} />
      {metric === "people" && <small className={styles.footnote}>A visitor active in several hours counts in each of them, so the hours add up to more than the day&apos;s visitors.</small>}
    </article>

    <div className={styles.donuts}>
      <Donut title={`${unit[0].toUpperCase()}${unit.slice(1)}, by day`} unit={unit} center={metric === "views" ? "page views" : "visitor-days"} empty={`No ${unit} in these three days.`} data={days.map((day, i) => ({ name: `${day.label}${i === 2 ? " (so far)" : ""}`, value: totals[i] }))} />
      {days.map((day, i) => <Donut key={day.label} title={`${day.label}: time of day`} unit={unit} empty={`No ${unit} ${i === 2 ? "yet today" : "that day"}.`} data={bandSlices(day, i)} />)}
    </div>

    <article className={styles.card}>
      <div className={styles.cardHead}><h3>Hour by hour, side by side</h3><small>{unit} · <span className={styles.peakKey}>peak hour</span> · <span className={styles.nowKey}>current hour</span></small></div>
      <div className={styles.tableWrap}><table id="three-days-hours">
        <thead><tr><th scope="col">Hour (IST)</th>{days.map((day, i) => <th scope="col" key={day.label}><i style={{ background: COLOURS[i] }} aria-hidden="true" />{day.label}<small>{day.date}</small></th>)}<th scope="col">Today vs yesterday</th></tr></thead>
        <tbody>{rows.slice(shownHourPage * HOURS_PER_PAGE, (shownHourPage + 1) * HOURS_PER_PAGE).map((row, at) => { const hour = shownHourPage * HOURS_PER_PAGE + at; return <tr key={row.hour} data-now={hour === nowHour || undefined}>
          <th scope="row">{hourRange(hour)}</th>
          {row.values.map((value, i) => <td key={i} data-peak={peaks[i].hour === hour && value ? true : undefined}>{value == null ? <span className={styles.future}>not yet</span> : n(value)}</td>)}
          <td>{row.values[2] == null ? "—" : <Change now={row.values[2]} before={row.values[1]} label="" />}</td>
        </tr>; })}</tbody>
        <tfoot><tr><th scope="row">Total</th>{totals.map((total, i) => <td key={i}>{n(total)}</td>)}<td><Change now={totals[2]} before={metric === "views" ? sameTime[1].views : sameTime[1].hourPeople.reduce((a, b) => a + b, 0)} label="vs yesterday by now" /></td></tr></tfoot>
      </table></div>
      <PillPager className={styles.hourPager} page={shownHourPage} pages={hourPages} total={rows.length} perPage={HOURS_PER_PAGE} onPage={setHourPage} label="Hours" noun="hours" controls="three-days-hours" />
    </article>

    <article className={styles.card}>
      <div className={styles.cardHead}>
        <h3>What changed between the days</h3>
        <div className={styles.toggles}><div role="group" aria-label="Compare by">{(["pages", "sources", "countries", "devices"] as Breakdown[]).map(id => <button key={id} type="button" aria-pressed={breakdown === id} onClick={() => setBreakdown(id)}>{id[0].toUpperCase() + id.slice(1)}</button>)}</div></div>
      </div>
      <div className={styles.compareGrid}>{days.map((day, i) => { const items = lists[breakdown](day.sum), top = Math.max(1, ...items.map(item => item.value)); return <div key={day.label} className={styles.compareCol} style={{ "--day": COLOURS[i] } as React.CSSProperties}>
        <h4><i aria-hidden="true" />{day.label}<small>{day.date}</small></h4>
        {items.length ? <ol>{items.map(item => <li key={item.name}>
          <span className={styles.barRow}><span title={item.name}>{item.name}</span><b>{n(item.value)}</b></span>
          <span className={styles.bar} aria-hidden="true"><i style={{ width: `${(item.value / top) * 100}%` }} /></span>
          {item.sub && <small>{item.sub}</small>}
        </li>)}</ol> : <p className={styles.empty}>No visits {i === 2 ? "yet today" : "that day"}.</p>}
      </div>; })}</div>
      <small className={styles.footnote}>Counts are visitors (people), most first. Sources are where each visit came from; your own domain counts as direct.</small>
    </article>
  </section>;
}
