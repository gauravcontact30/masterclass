"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarClock, LineChart as LineIcon, Minus, MousePointerClick, Users } from "lucide-react";
import { periodSummary, type PeriodSummary, type StreamVisitor } from "@/lib/live-visits";
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

/**
 * Overview → "Three days, hour by hour": the day before yesterday, yesterday and today (so far), each a full IST
 * calendar day, compared hour by hour. Counted from the Live visitor stream's visitors (lib/live-visits.ts
 * periodSummary), so every figure agrees with the command centre above: bots, automated browsers and visitors under a
 * second left out, one person per account or linked device. Today is compared with yesterday *up to the same time*,
 * which is the only fair comparison while the day is still running.
 */
export function SuperAdminThreeDays({ feed }: Readonly<{ feed?: { everyone: StreamVisitor[] | null; now: number; capped: boolean } }> = {}) {
  // On the Overview the section counts from the page's own live feed (one read for every panel); alone, it reads its own.
  const own = useStreamVisitors(60_000, !feed);
  const stream = feed ?? own;
  const [metric, setMetric] = useState<"views" | "people">("views");
  const [mode, setMode] = useState<"lines" | "bars">("lines");
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

  return <section className={styles.panel} aria-labelledby="three-days-title">
    <header className={styles.head}>
      <span className={styles.mark} aria-hidden="true"><CalendarClock size={18} /></span>
      <div>
        <h2 id="three-days-title">Three days, hour by hour</h2>
        <p>{dby.date} · {yesterday.date} · {today.date} (today until {clock(now)} IST). Each day runs 00:00–24:00 IST. Counted like the Live visitor stream: people only, one per account or linked device.</p>
      </div>
    </header>
    {stream.capped && <p className={styles.notice} role="status">The visitor stream hit its 20,000-event limit, so these figures are a lower bound.</p>}

    {/* Each day's totals are on User activities (Daily visitors) and today's in Today at a glance: this section compares
        the three days hour by hour only (user request 2026-11-28). */}
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

  </section>;
}
