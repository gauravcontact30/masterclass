"use client";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Bot, CheckCircle2, Clock, Eye, FileText, Globe2, Hourglass, Link2, Minus, MousePointerClick, Radio, ShieldCheck, Sparkles, UserPlus, Users, type LucideIcon } from "lucide-react";
import styles from "./super-admin-glance.module.css";

/*
 * Overview → "At a glance" (user request 2026-11-07): what a super admin wants from the first screen. One live headline
 * (who is here, with the day's hourly pulse), the day measured against the same time yesterday, the audience split into
 * new / returning / signed in, how engaged they are, what the day is turning into (sign-ups, best source and page), how
 * far to trust the figures, and a short list of things worth a look. Every number arrives already counted by
 * OverviewLive from the visitor stream, so this file only lays them out.
 */

export type GlanceProps = {
  day: string;
  exact: boolean;
  live: { now: number; signed: number; last30: number; last30Signed: number; viewsLastHour: number; peopleLastHour: number };
  today: { people: number | null | undefined; views: number | null | undefined; sessions: number | null | undefined; signedIn: number | null | undefined; newVisitors: number | null | undefined; returning: number | null; bounceRate: number | null | undefined; avgVisitSeconds: number | null | undefined; pagesPerVisit: number | null | undefined; readingPerPersonSeconds: number | null | undefined };
  /** Everything above, for the same stretch of yesterday (00:00 IST up to this time of day). Null before the stream holds it. */
  yesterday: { people: number; views: number; sessions: number } | null;
  hours: number[];
  hourNow: number;
  devices: { device: string; people: number }[];
  topSource: { name: string; people: number } | null;
  topPage: { path: string; views: number; people: number } | null;
  topCountry: { country: string; people: number } | null;
  newAccounts: number | null | undefined;
  bots: number | null | undefined;
  verified: { passed: number; total: number } | null;
  paused: boolean;
  updatedAt: string | null;
};

const n = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-IN").format(value);
const spent = (seconds: number | null | undefined) => {
  if (seconds == null) return "—";
  const s = Math.max(0, Math.round(seconds));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};
const share = (part: number, whole: number) => whole > 0 ? Math.round((part / whole) * 100) : 0;
const hourName = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
const DEVICE_COLOR: Record<string, string> = { mobile: "#2f6b55", desktop: "#2f5f82", tablet: "#9a4a2c" };

/** "▲ 18%" against the same time yesterday; flat inside ±2%, "new" when yesterday had none. */
function Delta({ now, before }: { now: number | null | undefined; before: number | undefined }) {
  if (now == null || before == null) return <span className={styles.delta} data-trend="none">no comparison yet</span>;
  if (before === 0) return <span className={styles.delta} data-trend={now > 0 ? "up" : "flat"}>{now > 0 ? <><ArrowUpRight size={13} aria-hidden="true" />new today</> : <><Minus size={13} aria-hidden="true" />same as yesterday</>}</span>;
  const change = Math.round(((now - before) / before) * 100);
  if (Math.abs(change) <= 2) return <span className={styles.delta} data-trend="flat"><Minus size={13} aria-hidden="true" />level with yesterday</span>;
  return <span className={styles.delta} data-trend={change > 0 ? "up" : "down"}>{change > 0 ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}{Math.abs(change)}% {change > 0 ? "above" : "below"} yesterday</span>;
}

type Insight = { tone: "good" | "watch" | "info"; icon: LucideIcon; title: string; detail: string };

/** The few things on today's numbers that a super admin would act on or want to know, most urgent first. */
function insightsFor(p: GlanceProps): Insight[] {
  const out: Insight[] = [];
  const { today: t, yesterday: y } = p;
  if (p.verified && p.verified.passed < p.verified.total) out.push({ tone: "watch", icon: AlertTriangle, title: "Some figures failed their checks", detail: `${p.verified.total - p.verified.passed} of ${p.verified.total} checks did not pass. Open "See the checks" above before quoting today's numbers.` });
  if (y && y.views >= 20 && t.views != null) {
    const change = Math.round(((t.views - y.views) / y.views) * 100);
    if (change <= -30) out.push({ tone: "watch", icon: ArrowDownRight, title: `Traffic is ${Math.abs(change)}% below this time yesterday`, detail: `${n(t.views)} page views so far against ${n(y.views)}. Check whether a campaign ended, a page broke or it is simply a quieter day.` });
    else if (change >= 30) out.push({ tone: "good", icon: ArrowUpRight, title: `Traffic is ${change}% above this time yesterday`, detail: `${n(t.views)} page views so far against ${n(y.views)}${p.topSource ? `; most visitors came from ${p.topSource.name}` : ""}.` });
  }
  if (t.bounceRate != null && (t.sessions ?? 0) >= 10 && t.bounceRate >= 70) out.push({ tone: "watch", icon: MousePointerClick, title: `${t.bounceRate}% of visits ended on the first page`, detail: "Most people looked at one page and left. Look at the top entry page and where those visitors came from." });
  if ((t.people ?? 0) >= 20 && (p.newAccounts ?? 0) === 0) out.push({ tone: "watch", icon: UserPlus, title: `No new accounts from ${n(t.people)} visitors`, detail: "Nobody has signed up yet today. Check the sign-up page and the Google sign-in." });
  else if ((p.newAccounts ?? 0) > 0 && (t.people ?? 0) > 0) out.push({ tone: "good", icon: UserPlus, title: `${n(p.newAccounts)} new ${p.newAccounts === 1 ? "account" : "accounts"} ${p.day === "today" ? "today" : "in 24 h"}`, detail: `${share(p.newAccounts ?? 0, t.people ?? 0)}% of visitors signed up.` });
  if ((p.bots ?? 0) > 0 && (p.bots ?? 0) > (t.people ?? 0)) out.push({ tone: "info", icon: Bot, title: "Bots outnumber real visitors", detail: `${n(p.bots)} automated sessions were filtered out against ${n(t.people)} people. They are excluded from every figure here.` });
  if (p.live.now === 0) out.push({ tone: "info", icon: Radio, title: "Nobody has a page open right now", detail: p.live.last30 ? `${n(p.live.last30)} ${p.live.last30 === 1 ? "person was" : "people were"} active in the last 30 minutes.` : "No activity in the last 30 minutes." });
  if (p.topPage && t.views) out.push({ tone: "info", icon: FileText, title: `${p.topPage.path} is today's most visited page`, detail: `${n(p.topPage.people)} ${p.topPage.people === 1 ? "person" : "people"}, ${n(p.topPage.views)} views (${share(p.topPage.views, t.views)}% of all page views).` });
  if (!out.length) out.push({ tone: "good", icon: CheckCircle2, title: "Nothing needs attention", detail: "Traffic, engagement and the figure checks are all within their usual range." });
  return out.slice(0, 5);
}

export function SuperAdminGlance(props: GlanceProps) {
  const { today: t, live, yesterday, hours, hourNow, devices } = props;
  const peak = Math.max(1, ...hours);
  const peakHour = hours.indexOf(Math.max(...hours));
  const people = t.people ?? 0;
  const guests = t.newVisitors ?? 0, signed = t.signedIn ?? 0, returning = t.returning ?? Math.max(0, people - guests - signed);
  const deviceTotal = devices.reduce((sum, d) => sum + d.people, 0);
  const insights = insightsFor(props);
  const bounceTone = t.bounceRate == null ? "none" : t.bounceRate >= 70 ? "bad" : t.bounceRate >= 50 ? "mid" : "good";

  return <div className={styles.glance}>
    {/* 1. Right now, with the day's pulse */}
    <article className={styles.hero} data-tone="mint">
      <header><span className={styles.pulseIcon} aria-hidden="true"><i /><Radio size={17} /></span><h3>On the site right now</h3></header>
      <div className={styles.heroBody}>
        <div className={styles.heroNumber}><strong>{n(live.now)}</strong><span>{live.now === 1 ? "visitor" : "visitors"}</span></div>
        <ul className={styles.heroFacts}>
          <li><b>{n(live.signed)}</b> signed in, <b>{n(Math.max(0, live.now - live.signed))}</b> guests</li>
          <li><b>{n(live.last30)}</b> active in the last 30 minutes</li>
          <li><b>{n(live.viewsLastHour)}</b> page views in the last hour, by {n(live.peopleLastHour)} {live.peopleLastHour === 1 ? "person" : "people"}</li>
        </ul>
      </div>
      <figure className={styles.pulse}>
        <div className={styles.bars} role="img" aria-label={`Page views by hour (IST) ${props.day === "today" ? "today" : "in the last 24 hours"}. Busiest hour ${hourName(peakHour)} with ${n(hours[peakHour])} views.`}>
          {hours.map((views, hour) => <i key={hour} style={{ height: `${Math.max(4, (views / peak) * 100)}%` }} data-now={hour === hourNow || undefined} data-peak={(views > 0 && hour === peakHour) || undefined} title={`${hourName(hour)}–${hourName((hour + 1) % 24)} IST: ${n(views)} page views`} />)}
        </div>
        <figcaption><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00 IST</span></figcaption>
      </figure>
      <p className={styles.note}>{hours[peakHour] > 0 ? `Busiest hour so far: ${hourName(peakHour)} with ${n(hours[peakHour])} page views. The outlined bar is this hour.` : "No page views recorded yet."}</p>
    </article>

    {/* 2. Today against yesterday at the same time */}
    <article className={styles.compare} data-tone="sky">
      <header><span className={styles.cardIcon} aria-hidden="true"><Clock size={16} /></span><h3>Today vs yesterday, same time</h3></header>
      <div className={styles.compareRows}>
        {([["Visitors", t.people, yesterday?.people], ["Page views", t.views, yesterday?.views], ["Visits", t.sessions, yesterday?.sessions]] as const).map(([label, now, before]) => {
          const top = Math.max(1, now ?? 0, before ?? 0);
          return <div key={label} className={styles.compareRow}>
            <div className={styles.compareHead}><span>{label}</span><Delta now={now} before={before} /></div>
            <div className={styles.versus}>
              <span><small>Today</small><i style={{ width: `${Math.max(2, ((now ?? 0) / top) * 100)}%` }} data-bar="now" /><b>{n(now)}</b></span>
              <span><small>Yesterday</small><i style={{ width: `${Math.max(2, ((before ?? 0) / top) * 100)}%` }} data-bar="before" /><b>{yesterday ? n(before) : "—"}</b></span>
            </div>
          </div>;
        })}
      </div>
      <p className={styles.note}>{props.exact ? "Yesterday is counted only up to this time of day, so the two are the same length." : "Comparison appears once the visitor stream has loaded the whole day."}</p>
    </article>

    {/* 3. Audience */}
    <article className={styles.card} data-tone="lavender">
      <header><span className={styles.cardIcon} aria-hidden="true"><Users size={16} /></span><h3>Audience, {props.day}</h3></header>
      <p className={styles.big}><strong>{n(t.people)}</strong><span>{t.people === 1 ? "visitor" : "visitors"}</span></p>
      <div className={styles.split} role="img" aria-label={`${n(guests)} new guests, ${n(returning)} returning, ${n(signed)} signed in`}>
        <i style={{ flexGrow: guests }} data-part="new" /><i style={{ flexGrow: returning }} data-part="returning" /><i style={{ flexGrow: signed }} data-part="signed" />
      </div>
      <ul className={styles.legend}>
        <li data-part="new"><i />{n(guests)} new guests <small>{share(guests, people)}%</small></li>
        <li data-part="returning"><i />{n(returning)} returning <small>{share(returning, people)}%</small></li>
        <li data-part="signed"><i />{n(signed)} signed in <small>{share(signed, people)}%</small></li>
      </ul>
      {deviceTotal > 0 && <>
        <div className={styles.split} role="img" aria-label={`Devices: ${devices.map(d => `${d.people} ${d.device}`).join(", ")}`}>{devices.map(d => <i key={d.device} style={{ flexGrow: d.people, background: DEVICE_COLOR[d.device] ?? "#9b978a" }} />)}</div>
        <ul className={styles.legend}>{devices.slice(0, 3).map(d => <li key={d.device}><i style={{ background: DEVICE_COLOR[d.device] ?? "#9b978a" }} />{share(d.people, deviceTotal)}% {d.device}</li>)}</ul>
      </>}
      {props.topCountry && <p className={styles.line}><Globe2 size={13} aria-hidden="true" />Most visitors from <b>{props.topCountry.country}</b> ({n(props.topCountry.people)})</p>}
    </article>

    {/* 4. Engagement */}
    <article className={styles.card} data-tone="peach">
      <header><span className={styles.cardIcon} aria-hidden="true"><Hourglass size={16} /></span><h3>Engagement, {props.day}</h3></header>
      <dl className={styles.stats}>
        <div><dt>Reading time per visitor</dt><dd>{spent(t.readingPerPersonSeconds)}</dd></div>
        <div><dt>Average visit</dt><dd>{spent(t.avgVisitSeconds)}</dd></div>
        <div><dt>Pages per visit</dt><dd>{t.pagesPerVisit ?? "—"}</dd></div>
        <div><dt>Page views</dt><dd>{n(t.views)}</dd></div>
      </dl>
      <div className={styles.gauge} data-tone={bounceTone}>
        <div className={styles.gaugeHead}><span>Bounce rate</span><b>{t.bounceRate == null ? "—" : `${t.bounceRate}%`}</b></div>
        <div className={styles.gaugeTrack} role="img" aria-label={t.bounceRate == null ? "No visits yet" : `${t.bounceRate}% of visits opened one page`}><i style={{ width: `${t.bounceRate ?? 0}%` }} /></div>
        <small>{bounceTone === "none" ? "Visits that opened one page" : bounceTone === "bad" ? "High: most visits opened one page" : bounceTone === "mid" ? "Typical for a content site" : "Healthy: people keep exploring"}</small>
      </div>
    </article>

    {/* 5. Growth */}
    <article className={styles.card} data-tone="sage">
      <header><span className={styles.cardIcon} aria-hidden="true"><UserPlus size={16} /></span><h3>Growth, {props.day === "today" ? "today" : "24 h"}</h3></header>
      <p className={styles.big}><strong>{n(props.newAccounts)}</strong><span>new {props.newAccounts === 1 ? "account" : "accounts"}</span></p>
      <p className={styles.line}><Sparkles size={13} aria-hidden="true" />{people ? `${share(props.newAccounts ?? 0, people)}% of visitors signed up` : "Waiting for the first visitor"}</p>
      <ul className={styles.tops}>
        <li><Link2 size={14} aria-hidden="true" /><span>Top source</span><b title={props.topSource?.name}>{props.topSource ? props.topSource.name : "—"}</b><small>{props.topSource ? `${n(props.topSource.people)} ${props.topSource.people === 1 ? "person" : "people"}` : ""}</small></li>
        <li><FileText size={14} aria-hidden="true" /><span>Top page</span><b title={props.topPage?.path}>{props.topPage ? props.topPage.path : "—"}</b><small>{props.topPage ? `${n(props.topPage.people)} ${props.topPage.people === 1 ? "person" : "people"}` : ""}</small></li>
      </ul>
    </article>

    {/* 6. Can the numbers be trusted */}
    <article className={styles.card} data-tone="butter">
      <header><span className={styles.cardIcon} aria-hidden="true"><ShieldCheck size={16} /></span><h3>Data quality</h3></header>
      <p className={styles.big}><strong>{props.verified ? `${props.verified.passed}/${props.verified.total}` : "—"}</strong><span>checks passed</span></p>
      <p className={styles.line} data-ok={props.verified && props.verified.passed === props.verified.total ? "" : undefined}>{props.paused ? <><Eye size={13} aria-hidden="true" />Live updates paused</> : props.verified ? (props.verified.passed === props.verified.total ? <><CheckCircle2 size={13} aria-hidden="true" />Figures cross-checked on every refresh</> : <><AlertTriangle size={13} aria-hidden="true" />Review the failed checks above</>) : <><Eye size={13} aria-hidden="true" />Waiting for the visitor stream</>}</p>
      <ul className={styles.tops}>
        <li><Bot size={14} aria-hidden="true" /><span>Bot sessions filtered</span><b>{n(props.bots)}</b><small>never counted</small></li>
        <li><Clock size={14} aria-hidden="true" /><span>Last read</span><b>{props.updatedAt ?? "—"}</b><small>IST</small></li>
      </ul>
    </article>

    {/* 7. What needs a look */}
    <article className={styles.insights} data-tone="rose">
      <header><span className={styles.cardIcon} aria-hidden="true"><Sparkles size={16} /></span><h3>What needs your eye</h3><small>Worked out from today&apos;s numbers</small></header>
      <ul>{insights.map(item => <li key={item.title} data-insight={item.tone}><span aria-hidden="true"><item.icon size={16} /></span><div><b>{item.title}</b><p>{item.detail}</p></div></li>)}</ul>
    </article>
  </div>;
}
