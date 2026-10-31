"use client";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Image from "@/components/responsive-image";
import Link from "next/link";
import { BookOpen, CalendarCheck, CheckCircle2, Clock, Eye, Flame, Heart, Layers, LockKeyhole, MousePointerClick, Newspaper, RefreshCw, Sparkles, Star, Sunrise, Timer, Trophy, ThumbsDown, Users, UserPlus, UserRoundCheck } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { AdminLoading } from "./super-admin-feedback";
import { AdminTable } from "./super-admin-table";
import type { TechBuzzReport } from "@/lib/tech-buzz-analytics";
import { dailyTrackTechIds } from "@/lib/tech-buzz-sections";
import { nextWeekStart } from "@/lib/ist-week";
import { techLogo } from "@/lib/tech-buzz-public";
import styles from "./super-admin-tech-buzz-analytics.module.css";

/*
 * Super Admin → Tech-Buzz - Blogs: /tech-buzz traffic, every section's clicks, the weekly Monday 00:00 IST edition, the
 * Community favourites topics and each story's counters (app/api/super-admin/tech-buzz/analytics).
 */
type Data = TechBuzzReport & { retentionDays: number };
/** Light card and sticker tones, cycled so neighbours never share a colour. */
const TONES = ["mint", "peach", "lavender", "sky", "lemon", "rose", "aqua", "sand"] as const;
const num = (n: number) => n.toLocaleString("en-IN");
const pct = (n: number | null) => n === null ? "—" : `${(n * 100).toFixed(n < 0.1 ? 1 : 0)}%`;
const duration = (ms: number | null) => { if (ms === null) return "—"; const s = Math.round(ms / 1000); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`; };
const DAY = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const dayLabel = (date: string) => DAY.format(Date.parse(`${date}T00:00:00Z`));

/** The track's real technology logos (public/images/tech), shown after its name. */
function TrackLogos({ track, size = 18 }: { track: string; size?: number }) {
  const logos = dailyTrackTechIds(track).map(id => techLogo(id)).filter((src): src is string => !!src);
  return logos.length ? <span className={styles.trackLogos} aria-hidden="true">{logos.map(src => <Image key={src} src={src} alt="" width={size} height={size} />)}</span> : null;
}

function StatCard({ tone, icon, label, value, note }: { tone: string; icon: ReactNode; label: string; value: ReactNode; note: string }) {
  return <article className={styles.stat} data-tone={tone}>
    <span className={styles.statIcon} aria-hidden="true">{icon}</span>
    <span className={styles.statLabel}>{label}</span>
    <strong className={styles.statValue}>{value}</strong>
    <small className={styles.statNote}>{note}</small>
  </article>;
}

function Sticker({ tone, children, title }: { tone: string; children: ReactNode; title?: string }) {
  return <span className={styles.sticker} data-tone={tone} title={title}>{children}</span>;
}

function Panel({ icon, title, note, children, wide }: { icon: ReactNode; title: string; note?: string; children: ReactNode; wide?: boolean }) {
  return <section className={styles.panel} data-wide={wide || undefined}>
    <header className={styles.panelHead}><span aria-hidden="true">{icon}</span><div><h2>{title}</h2>{note && <p>{note}</p>}</div></header>
    {children}
  </section>;
}

/** The next Monday 00:00 IST run (cron 30 18 * * 0 UTC), as "Mon, 2 Nov". */
const nextRun = (generatedAt: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(nextWeekStart(Date.parse(generatedAt)));

/** The weekly edition: this week's five stories up front, then the last seven weeks as a week × track board. */
function EditionPanel({ daily, generatedAt }: { daily: Data["daily"]; generatedAt: string }) {
  const [today, ...earlier] = daily;
  if (!today) return null;
  const done = (day: Data["daily"][number]) => day.tracks.filter(track => track.slug).length;
  const todayDone = done(today), total = daily.length * (today.tracks.length || 5), published = daily.reduce((sum, day) => sum + done(day), 0);
  const full = (day: Data["daily"][number]) => done(day) === day.tracks.length;
  let streak = 0;
  for (const day of full(today) ? daily : earlier) { if (!full(day)) break; streak++; }
  const status = todayDone === today.tracks.length ? { tone: "mint", text: "Published" } : todayDone ? { tone: "peach", text: `Partial · ${todayDone}/${today.tracks.length}` } : { tone: "sand", text: "Waiting for Monday's 00:00 AM run" };

  return <section className={styles.editionCard} aria-labelledby="edition-title">
    <header className={styles.editionHero}>
      <span className={styles.editionSun} aria-hidden="true"><Sunrise size={26} /></span>
      <div className={styles.editionHeading}>
        <span className={styles.editionEyebrow}>Fresh every week · Monday 00:00 AM IST</span>
        <h2 id="edition-title">Weekly edition</h2>
        <p>Week of {dayLabel(today.date)}: five researched stories, one per track, written and reviewed as the week begins.</p>
      </div>
      <div className={styles.editionKpis}>
        <Sticker tone={status.tone}><CheckCircle2 size={13} aria-hidden="true" />{status.text}</Sticker>
        <Sticker tone="sky"><Timer size={13} aria-hidden="true" />Next run <b>{nextRun(generatedAt)}, 00:00 AM</b></Sticker>
        <Sticker tone="lavender"><CalendarCheck size={13} aria-hidden="true" /><b>{published}/{total}</b> in 7 weeks · {Math.round((published / total) * 100)}%</Sticker>
        <Sticker tone="lemon"><Trophy size={13} aria-hidden="true" /><b>{streak}-week</b> full streak</Sticker>
      </div>
    </header>

    <ol className={styles.todayGrid}>
      {today.tracks.map((track, index) => <li key={track.id} className={styles.todayTile} style={{ "--track": track.color } as CSSProperties} data-empty={track.slug ? undefined : "true"}>
        <span className={styles.todayTrack}><i aria-hidden="true">{index + 1}</i><span>{track.label}</span><TrackLogos track={track.id} /></span>
        {track.slug
          ? <Link href={`/tech-buzz/${track.slug}`} target="_blank" className={styles.todayTitle}>{track.title ?? track.label}</Link>
          : <span className={styles.todayTitle}>Not written yet</span>}
        <span className={styles.todayMeta}>
          {track.slug ? <><span><Star size={12} aria-hidden="true" />{track.editorScore == null ? "—" : `${track.editorScore.toFixed(1)}/5`}</span><span><Eye size={12} aria-hidden="true" />{num(track.views ?? 0)} views</span></> : <span>Fills in at the next run</span>}
        </span>
      </li>)}
    </ol>

    <div className={styles.boardScroll}>
      <table className={styles.board}>
        <caption>Last 7 weeks, by track</caption>
        <thead><tr><th scope="col">Week of</th>{today.tracks.map(track => <th key={track.id} scope="col"><span className={styles.boardDot} style={{ background: track.color }} aria-hidden="true" />{track.label}<TrackLogos track={track.id} size={14} /></th>)}<th scope="col">Done</th></tr></thead>
        <tbody>{daily.map(day => <tr key={day.date}>
          <th scope="row">{dayLabel(day.date)}</th>
          {day.tracks.map(track => <td key={track.id}>{track.slug
            ? <Link href={`/tech-buzz/${track.slug}`} target="_blank" className={styles.boardCell} style={{ "--track": track.color } as CSSProperties} title={track.title ?? track.label}>
                <CheckCircle2 size={14} aria-hidden="true" />{track.editorScore == null ? "Live" : track.editorScore.toFixed(1)}</Link>
            : <span className={styles.boardCell} data-empty="true" title="Not written for this week">–</span>}</td>)}
          <td><b className={styles.boardDone} data-full={full(day) || undefined}>{done(day)}/{day.tracks.length}</b></td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

export function SuperAdminTechBuzzAnalytics({ days, query }: Readonly<{ days: number; query: string }>) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/super-admin/tech-buzz/analytics?days=${days}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? `HTTP ${response.status}`); return response.json() as Promise<Data>; })
      .then(next => { setData(next); setError(""); })
      .catch(failure => { if (!controller.signal.aborted) setError(String(failure instanceof Error ? failure.message : failure)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [days, reload]);

  const maxDay = useMemo(() => Math.max(1, ...(data?.trend ?? []).map(day => day.views)), [data]);
  const maxSection = useMemo(() => Math.max(1, ...(data?.sections ?? []).map(section => section.clicks)), [data]);
  const rows = useMemo(() => (data?.pages ?? []).map(page => ({ ...page, read: page.avgReadMs ?? -1, ratingShown: page.ratingCount ? page.rating : 0, topicList: page.topics.join(", ") })), [data]);

  if (!data) return error ? <Alert variant="destructive"><AlertDescription>Couldn&rsquo;t load Tech Buzz analytics: {error}</AlertDescription></Alert> : <AdminLoading>Loading Tech Buzz analytics…</AdminLoading>;
  const { totals, content } = data;
  const windowLabel = days === 1 ? "last 24 hours" : `last ${days} days`;
  const visitWindow = days > data.retentionDays ? `Visits and clicks cover the last ${data.retentionDays} days (visit retention); story counters are all-time.` : `Visits and clicks for the ${windowLabel}; story counters are all-time.`;
  const todayEdition = data.daily[0];
  const todayCount = todayEdition?.tracks.filter(track => track.slug).length ?? 0;

  return <div className={styles.page}>
    <div className={styles.toolbar}>
      <div className={styles.toolbarStickers}>
        <Sticker tone="sky"><Eye size={13} aria-hidden="true" />{windowLabel}</Sticker>
        <Sticker tone={todayCount === 5 ? "mint" : "peach"}><Sunrise size={13} aria-hidden="true" />Today&rsquo;s edition {todayCount}/5</Sticker>
        <Sticker tone="lavender"><Newspaper size={13} aria-hidden="true" />{num(content.published)} stories live</Sticker>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => { setLoading(true); setReload(value => value + 1); }}><RefreshCw size={14} aria-hidden="true" />Refresh</Button>
    </div>
    <p className={styles.scope}>{visitWindow} Super Admin, bot and 0-second visits are never counted.</p>

    <div className={styles.stats}>
      <StatCard tone="sky" icon={<Eye size={18} />} label="Page views" value={num(totals.views)} note={`${num(totals.hubViews)} on /tech-buzz · ${num(totals.storyViews)} on stories`} />
      <StatCard tone="mint" icon={<Users size={18} />} label="Unique readers" value={num(totals.visitors)} note={`${num(totals.sessions)} reading sessions`} />
      <StatCard tone="lavender" icon={<Clock size={18} />} label="Avg time on page" value={duration(totals.avgReadMs)} note="Engaged time per page left" />
      <StatCard tone="peach" icon={<BookOpen size={18} />} label="Stories read" value={num(totals.storiesRead)} note={`of ${num(content.published)} published`} />
      <StatCard tone="lemon" icon={<MousePointerClick size={18} />} label="Clicks" value={num(totals.clicks)} note={`${num(totals.clickers)} people clicked`} />
      <StatCard tone="rose" icon={<Flame size={18} />} label="Stories opened from hub" value={num(totals.opens)} note={`${pct(totals.openRate)} of hub views`} />
      <StatCard tone="aqua" icon={<UserRoundCheck size={18} />} label="Signed-in readers" value={num(totals.signedIn)} note="Accounts that read Tech Buzz" />
      <StatCard tone="sand" icon={<UserPlus size={18} />} label="New visitors" value={num(totals.newVisitors)} note="First visit to the site" />
      <StatCard tone="rose" icon={<LockKeyhole size={18} />} label="Paywall clicks" value={num(totals.paywallClicks)} note="Sign in, subscribe or sign up" />
      <StatCard tone="mint" icon={<CalendarCheck size={18} />} label="Published in window" value={num(content.publishedInWindow)} note={`${num(content.published)} stories in total`} />
    </div>

    <EditionPanel daily={data.daily} generatedAt={data.generatedAt} />

    <div className={styles.grid}>
      <Panel icon={<Eye size={18} />} title="Daily views" note="Page views per IST day, with readers and clicks.">
        {data.trend.length ? <ol className={styles.trend}>
          {data.trend.map((day, index) => <li key={day.date} title={`${dayLabel(day.date)}: ${num(day.views)} views · ${num(day.visitors)} readers · ${num(day.clicks)} clicks`}>
            <span className={styles.trendBar} data-tone={TONES[index % TONES.length]} style={{ "--h": `${Math.max(4, (day.views / maxDay) * 100)}%` } as CSSProperties}><b>{num(day.views)}</b></span>
            <small>{dayLabel(day.date)}</small>
          </li>)}
        </ol> : <p className={styles.empty}>No visits in this window yet.</p>}
      </Panel>

      <Panel icon={<Heart size={18} />} title="Reader reactions" note="All-time counters across every published story.">
        <div className={styles.stickers}>
          <Sticker tone="rose"><Heart size={13} aria-hidden="true" /><b>{num(content.likes)}</b> likes</Sticker>
          <Sticker tone="sand"><ThumbsDown size={13} aria-hidden="true" /><b>{num(content.dislikes)}</b> dislikes</Sticker>
          <Sticker tone="peach"><Sparkles size={13} aria-hidden="true" /><b>{num(content.claps)}</b> claps</Sticker>
          <Sticker tone="sky"><Users size={13} aria-hidden="true" /><b>{num(content.comments)}</b> comments</Sticker>
          <Sticker tone="lemon"><Star size={13} aria-hidden="true" /><b>{content.avgRating?.toFixed(2) ?? "—"}</b> avg rating · {num(content.rated)} rated</Sticker>
          <Sticker tone="lavender"><Star size={13} aria-hidden="true" /><b>{content.avgEditor?.toFixed(1) ?? "—"}</b>/5 avg editor score</Sticker>
        </div>
      </Panel>
    </div>

    <Panel wide icon={<MousePointerClick size={18} />} title="Every section of /tech-buzz" note="Clicks inside each named section of the hub and the story pages, the people who clicked and the stories they opened.">
      {data.sections.length ? <div className={styles.sections}>
        {data.sections.map((section, index) => <article key={section.section} className={styles.section} data-tone={TONES[index % TONES.length]}>
          <div className={styles.sectionTop}>
            <strong>{section.section}</strong>
            <Sticker tone={section.where === "hub" ? "sky" : section.where === "story" ? "lavender" : "sand"}>{section.where === "hub" ? "Hub page" : section.where === "story" ? "Story page" : "Other"}</Sticker>
          </div>
          <span className={styles.sectionBar} style={{ "--w": `${Math.max(4, (section.clicks / maxSection) * 100)}%` } as CSSProperties}><i /></span>
          <div className={styles.sectionNums}><span><b>{num(section.clicks)}</b> clicks</span><span><b>{num(section.clickers)}</b> people</span><span><b>{num(section.opens)}</b> stories opened</span></div>
          {section.top.length > 0 && <div className={styles.stickers}>{section.top.map((item, i) => <Sticker key={item.label} tone={TONES[(index + i + 1) % TONES.length]} title={item.label}><span className={styles.clip}>{item.label}</span><b>{num(item.count)}</b></Sticker>)}</div>}
        </article>)}
      </div> : <p className={styles.empty}>No clicks recorded yet. Clicks on /tech-buzz and its stories are tracked from this release on.</p>}
    </Panel>

    <Panel wide icon={<Heart size={18} />} title="Community favourites topics" note="Stories, views in this window and all-time likes for each topic on /tech-buzz.">
      <div className={styles.topics}>
        {data.topics.map(topic => <article key={topic.id} className={styles.topic} style={{ "--tone": topic.color } as CSSProperties}>
          <span className={styles.topicDot} aria-hidden="true" />
          <strong>{topic.label}</strong>
          <span className={styles.topicNums}><Sticker tone="sky">{num(topic.stories)} stories</Sticker><Sticker tone="mint">{num(topic.views)} views</Sticker><Sticker tone="rose">{num(topic.likes)} likes</Sticker></span>
        </article>)}
      </div>
    </Panel>

    <div className={styles.grid} data-three>
      {([["Traffic sources", data.sources, <Layers key="s" size={18} />], ["Devices", data.devices, <Users key="d" size={18} />], ["Countries", data.countries, <Eye key="c" size={18} />]] as const).map(([title, list, icon]) =>
        <Panel key={title} icon={icon} title={title}>
          {list.length ? <ul className={styles.tally}>{list.map((item, i) => <li key={item.label}><Sticker tone={TONES[i % TONES.length]}><span className={styles.clip}>{item.label}</span><b>{num(item.count)}</b></Sticker></li>)}</ul> : <p className={styles.empty}>No visits yet.</p>}
        </Panel>)}
    </div>

    <AdminTable title="Every /tech-buzz page" query={query} rows={rows} rowKey={row => String(row.path)}
      note="The hub and every published story, with traffic for this window and all-time counters. Sort any column."
      columns={[
        { key: "title", label: "Page", render: row => <Link href={String(row.path)} target="_blank" className={styles.pageLink}>{String(row.title)}</Link> },
        { key: "kind", label: "Type", render: row => <Sticker tone={row.kind === "hub" ? "sky" : "lavender"}>{row.kind === "hub" ? "Hub" : "Story"}</Sticker> },
        { key: "views", label: "Views" }, { key: "visitors", label: "Readers" },
        { key: "read", label: "Avg time", render: row => duration(Number(row.read) < 0 ? null : Number(row.read)) },
        { key: "clicks", label: "Clicks" }, { key: "likes", label: "Likes" }, { key: "claps", label: "Claps" },
        { key: "ratingShown", label: "Rating", render: row => Number(row.ratingCount) ? `${Number(row.rating).toFixed(1)} (${row.ratingCount})` : "—" },
        { key: "editorScore", label: "Editor", render: row => row.editorScore == null ? "—" : `${Number(row.editorScore).toFixed(1)}/5` },
        { key: "comments", label: "Comments" },
        { key: "daily", label: "Daily track", render: row => row.daily ? <Sticker tone="peach">{String(row.daily)}<TrackLogos track={String(row.daily)} size={14} /></Sticker> : "—" },
        { key: "topicList", label: "Topics" },
        { key: "publishedAt", label: "Published", render: row => row.publishedAt ? new Date(String(row.publishedAt)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—" },
      ]} />
  </div>;
}
