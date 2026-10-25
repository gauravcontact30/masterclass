"use client";
import { useEffect, useId, useState } from "react";
import { Building2, Clock, Globe2, Home, List, Map as MapIcon, MapPin, MapPinned, Navigation, Plane, RefreshCw, Search, Timer, UserPlus, Users, X } from "lucide-react";
import type { NewUserLocation, NewUserLocationReport, Tally } from "@/lib/new-user-locations";
import { AdminTable } from "./super-admin-table";
import { Pager } from "./super-admin-pager";
import { AdminError, AdminLoading } from "./super-admin-feedback";
import styles from "./super-admin-new-user-locations.module.css";

const ist = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
const n = (value: number) => value.toLocaleString("en-IN");
const pct = (part: number, whole: number) => whole ? `${Math.round((part / whole) * 100)}%` : "—";
/** Engaged time as "1h 05m", "12m 30s" or "40s"; nothing recorded reads as a dash. */
export const duration = (ms: number) => {
  const s = Math.round(ms / 1000);
  if (!s) return "—";
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s` : `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
};
const CARD_PAGE = 5;
const SUGGESTIONS = 6;
type Filter = "all" | "india" | "abroad" | "repeat";
const FILTERS: { id: Filter; label: string; icon: typeof List }[] = [
  { id: "all", label: "All", icon: List }, { id: "india", label: "India", icon: MapPin }, { id: "abroad", label: "Abroad", icon: Plane }, { id: "repeat", label: "2+ users", icon: Users },
];

/**
 * Where new application users were when they first used the site, and how much they have used it since: a summary
 * strip, one light card each for country, state, city, village / locality (PIN area) and the nearest major city
 * (each searchable, filterable and paged five at a time), then every new user with location, time spent per day,
 * sessions and how they arrived. Shown on the Super Admin Overview and User activities pages.
 * Data: /api/super-admin/activity/new-users (IP geolocation, never GPS; time from the page-leave beacon).
 */
export function SuperAdminNewUserLocations({ days, query = "" }: Readonly<{ days: number; query?: string }>) {
  const span = [1, 7, 30, 90].includes(days) ? days : 7;
  const [data, setData] = useState<NewUserLocationReport | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/super-admin/activity/new-users?days=${span}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error ?? "service_error"); return body; })
      .then(body => { if (!controller.signal.aborted) { setData(body); setError(""); } })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "service_error"); });
    return () => controller.abort();
  }, [span, refresh]);
  const current = data?.days === span ? data : null;

  return <section className={styles.panel} aria-labelledby="new-user-locations">
    <header className={styles.head}>
      <span className={styles.mark} aria-hidden="true"><UserPlus size={18} /></span>
      <div><h2 id="new-user-locations">New user locations</h2><p>Where each account created in the last {span} day{span === 1 ? "" : "s"} was when it first used the site (IP-based location), and how much time it has spent on the site each day since.</p></div>
      <button type="button" aria-label="Refresh new user locations" onClick={() => setRefresh(value => value + 1)}><RefreshCw size={15} aria-hidden="true" /></button>
    </header>
    {error && <AdminError>{error === "migration_required" ? "Location data needs the site_visits migrations (0023 and 0030)." : "New user locations could not be loaded. Try Refresh."}</AdminError>}
    {!current && !error && <AdminLoading>Loading new user locations…</AdminLoading>}
    {current && <>
      <dl className={styles.stats}>
        <div data-tone="mint"><dt><UserPlus size={13} aria-hidden="true" />New users</dt><dd>{n(current.total)}</dd><small>{n(current.located)} located ({pct(current.located, current.total)})</small></div>
        <div data-tone="sky"><dt><Timer size={13} aria-hidden="true" />Time today (IST)</dt><dd>{duration(current.time?.todayMs ?? 0)}</dd><small>{n(current.time?.activeToday ?? 0)} active today</small></div>
        <div data-tone="lavender"><dt><Clock size={13} aria-hidden="true" />Avg. per user per day</dt><dd>{duration(current.time?.avgPerUserDayMs ?? 0)}</dd><small>on days they used the site</small></div>
        <div data-tone="butter"><dt><Home size={13} aria-hidden="true" />PIN area known</dt><dd>{pct(current.coverage?.postal ?? 0, current.total)}</dd><small>{n(current.coverage?.postal ?? 0)} of {n(current.total)} users</small></div>
        <div data-tone="peach"><dt><Navigation size={13} aria-hidden="true" />Nearby city known</dt><dd>{pct(current.coverage?.nearby ?? 0, current.total)}</dd><small>from network coordinates</small></div>
      </dl>
      <p className={styles.summary}>Updated {ist(current.generatedAt)} IST · total engaged time in the window <b>{duration(current.time?.totalMs ?? 0)}</b></p>
      <div className={styles.cards}>
        <Card tone="sky" icon={Globe2} title="Country" purpose="Which countries new learners come from." rows={current.countries} total={current.total} empty="No country recorded yet." />
        <Card tone="lavender" icon={MapIcon} title="State / region" purpose="State or union territory, with its country." rows={current.states} total={current.total} empty="No state recorded yet." />
        <Card tone="mint" icon={Building2} title="City" purpose="The city the network is registered in, with its state." rows={current.cities} total={current.total} empty="No city recorded yet." />
        <Card tone="butter" icon={Home} title="Village / locality" purpose="The postal (PIN) area of the most precise visit, including the same browser's visits before sign-up. Localities come first; a city's head post office PIN (e.g. 110001) only says which city, so it is listed as city level and not counted as a locality."
          rows={[...current.postalAreas, ...(current.cityPins ?? [])]} total={current.total}
          empty={!current.coordinates ? "Apply migration 0030 to record PIN areas." : current.total ? "No PIN recorded for these users: their networks resolve only to a country or region." : "No new users in this window."} />
        <Card tone="peach" icon={Navigation} title="Nearby city" purpose="Nearest major city to the network’s position (other than the user’s own), with its state and the average distance."
          rows={current.nearby} total={current.total} empty={current.coordinates ? "No coordinates recorded yet. They appear for visits after migration 0030." : "Apply migration 0030 to record coordinates."} />
      </div>
      <AdminTable title="New users and where they were first seen" query={query} rows={current.users.map(user => ({ ...user, location: [user.city, user.state, user.country].filter(Boolean).join(", "), nearbyCity: user.nearby ? `${user.nearby.name} (${user.nearby.km} km)` : null, todayMs: user.activity?.todayMs ?? 0, avgMs: user.activity?.avgPerDayMs ?? 0, totalMs: user.activity?.totalMs ?? 0 }))}
        rowKey={row => String(row.id)}
        columns={[
          "name",
          { key: "joinedAt", label: "Joined (IST)", render: row => ist(String(row.joinedAt)) },
          { key: "location", label: "City, state, country", render: row => String(row.location || "Not available") },
          { key: "postalCode", label: "Village / PIN area", render: row => row.postalCode ? `PIN ${row.postalCode}` : row.cityLevelPin ? "City-level only (exact PIN not known)" : "Not available from IP" },
          { key: "nearbyCity", label: "Nearby city", render: row => String(row.nearbyCity ?? "Not available") },
          { key: "firstSeenAt", label: "First seen (IST)", render: row => row.firstSeenAt ? ist(String(row.firstSeenAt)) : "No visit recorded" },
          { key: "todayMs", label: "Time today", render: row => duration(Number(row.todayMs)) },
          { key: "avgMs", label: "Avg. per active day", render: row => duration(Number(row.avgMs)) },
          { key: "totalMs", label: "Time per day (IST)", sort: false, filter: false, render: row => <DayBars activity={(row as unknown as NewUserLocation).activity} /> },
          { key: "sessions", label: "Sessions · pages", sort: false, filter: false, render: row => { const a = (row as unknown as NewUserLocation).activity; return a ? `${a.sessions} · ${a.pages}` : "—"; } },
          { key: "device", label: "Device", render: row => [row.device, row.browser].filter(Boolean).join(" · ") || "Unknown" },
          { key: "firstPage", label: "Arrived at", render: row => [row.firstPage, row.referrer ? `from ${row.referrer}` : "direct"].filter(Boolean).join(" · ") },
        ]}
        note="IP-based and approximate: VPNs, office networks and mobile carriers can place a user in another city. Locations are never inferred when the platform does not supply them. Time is engaged reading time from the page-leave beacon, grouped by India-calendar day; a page still open is counted when it is left." />
    </>}
  </section>;
}

/** The user's engaged time on each of their most recent days, newest first, with the total. */
function DayBars({ activity }: Readonly<{ activity?: NewUserLocation["activity"] }>) {
  if (!activity?.days.length) return <span className={styles.none}>No time recorded</span>;
  const shown = activity.days.slice(0, 7), top = Math.max(1, ...shown.map(d => d.ms));
  return <span className={styles.days} title={shown.map(d => `${d.day}: ${duration(d.ms)}`).join("\n")}>
    <span className={styles.bars} aria-hidden="true">{[...shown].reverse().map(d => <i key={d.day} style={{ height: `${Math.max(12, (d.ms / top) * 100)}%` }} />)}</span>
    <span>{duration(activity.totalMs)} · {activity.activeDays} day{activity.activeDays === 1 ? "" : "s"}</span>
  </span>;
}

function Card({ tone, icon: Icon, title, purpose, rows, total, empty }: Readonly<{ tone: string; icon: typeof MapPinned; title: string; purpose: string; rows: Tally[]; total: number; empty: string }>) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const term = search.trim().toLowerCase();
  const matches = (row: Tally) => !term || `${row.name} ${row.detail ?? ""}`.toLowerCase().includes(term);
  const passes = (row: Tally) => filter === "all" || (filter === "repeat" ? row.count >= 2 : filter === "india" ? row.country === "IN" : !!row.country && row.country !== "IN");
  const shown = rows.filter(row => passes(row) && matches(row));
  const pages = Math.max(1, Math.ceil(shown.length / CARD_PAGE)), at = Math.min(page, pages);
  const suggestions = term ? rows.filter(row => row.name.toLowerCase().includes(term) && row.name.toLowerCase() !== term).slice(0, SUGGESTIONS) : [];
  const top = Math.max(1, ...rows.map(row => row.count));
  const choose = (value: string) => { setSearch(value); setPage(1); setFocused(false); };
  return <section className={styles.card} data-tone={tone} aria-label={`New users by ${title.toLowerCase()}`}>
    <h3><span aria-hidden="true"><Icon size={15} /></span>{title}<small title={`${rows.length} places`}>{rows.length}</small></h3>
    <p className={styles.purpose}>{purpose}</p>
    {rows.length ? <>
      <div className={styles.search}>
        <Search size={13} aria-hidden="true" />
        <input type="search" role="combobox" aria-expanded={focused && suggestions.length > 0} aria-controls={`${id}-list`} aria-autocomplete="list" aria-label={`Search ${title.toLowerCase()}`} placeholder={`Search ${title.toLowerCase()}…`}
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={e => { if (e.key === "Enter" && suggestions[0]) { e.preventDefault(); choose(suggestions[0].name); } if (e.key === "Escape") setFocused(false); }} />
        {search && <button type="button" aria-label={`Clear ${title.toLowerCase()} search`} onClick={() => choose("")}><X size={13} aria-hidden="true" /></button>}
        {focused && suggestions.length > 0 && <ul id={`${id}-list`} role="listbox" className={styles.suggest}>{suggestions.map(row => <li key={row.name} role="option" aria-selected={false}>
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => choose(row.name)}><span>{row.name}</span><small>{row.count}</small></button>
        </li>)}</ul>}
      </div>
      <div className={styles.filters} role="group" aria-label={`Filter ${title.toLowerCase()}`}>{FILTERS.map(f => <button key={f.id} type="button" aria-pressed={filter === f.id} title={f.label} onClick={() => { setFilter(f.id); setPage(1); }}><f.icon size={12} aria-hidden="true" />{f.label}</button>)}</div>
      {shown.length ? <><div className={styles.listHead} aria-hidden="true"><span>{title}</span><span>Share</span><span>Users</span></div><ol className={styles.list}>{shown.slice((at - 1) * CARD_PAGE, at * CARD_PAGE).map(row => <li key={row.name}>
        <span title={row.name}>{row.name}{row.detail && <small>{row.detail}</small>}</span><i aria-hidden="true"><b style={{ width: `${(row.count / top) * 100}%` }} /></i><strong>{row.count}<small>{pct(row.count, total)}</small></strong>
      </li>)}</ol>
      <Pager page={at} pages={pages} total={shown.length} size={CARD_PAGE} onPage={setPage} /></> : <p className={styles.empty} role="status">Nothing matches this search or filter.</p>}
    </> : <p className={styles.empty}>{empty}</p>}
  </section>;
}
