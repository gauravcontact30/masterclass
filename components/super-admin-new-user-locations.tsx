"use client";
import { useEffect, useState } from "react";
import { Building2, Globe2, Home, Map as MapIcon, MapPinned, Navigation, RefreshCw, UserPlus } from "lucide-react";
import type { NewUserLocationReport, Tally } from "@/lib/new-user-locations";
import { AdminTable } from "./super-admin-table";
import { AdminError, AdminLoading } from "./super-admin-feedback";
import styles from "./super-admin-new-user-locations.module.css";

const ist = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

/**
 * Where new application users were when they first used the site: one light card each for country, state, city,
 * village / locality and the nearest major city, then every new user with all five. Shown on the Super Admin Overview
 * and User activities pages. Data: /api/super-admin/activity/new-users (IP geolocation, never GPS).
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
      <div><h2 id="new-user-locations">New user locations</h2><p>Where each account created in the last {span} day{span === 1 ? "" : "s"} was when it first used the site, from IP-based location.</p></div>
      <button type="button" aria-label="Refresh new user locations" onClick={() => setRefresh(value => value + 1)}><RefreshCw size={15} aria-hidden="true" /></button>
    </header>
    {error && <AdminError>{error === "migration_required" ? "Location data needs the site_visits migrations (0023 and 0030)." : "New user locations could not be loaded. Try Refresh."}</AdminError>}
    {!current && !error && <AdminLoading>Loading new user locations…</AdminLoading>}
    {current && <>
      <p className={styles.summary}><b>{current.total.toLocaleString("en-IN")}</b> new user{current.total === 1 ? "" : "s"} · <b>{current.located.toLocaleString("en-IN")}</b> with a location · updated {ist(current.generatedAt)} IST</p>
      <div className={styles.cards}>
        <Card tone="sky" icon={Globe2} title="Country" purpose="Which countries new learners come from." rows={current.countries} empty="No country recorded yet." />
        <Card tone="lavender" icon={MapIcon} title="State / region" purpose="State or union territory (Indian ISO codes shown by name)." rows={current.states} empty="No state recorded yet." />
        <Card tone="mint" icon={Building2} title="City" purpose="The city the network is registered in." rows={current.cities} empty="No city recorded yet." />
        <Card tone="butter" icon={Home} title="Village / locality" purpose="Village names cannot be read from an IP address. The postal (PIN) area is the finest level available."
          rows={current.postalAreas} empty={current.coordinates ? "No PIN area recorded yet. It appears for visits after migration 0030." : "Apply migration 0030 to record PIN areas."} />
        <Card tone="peach" icon={Navigation} title="Nearby city" purpose="Nearest major city to the network’s approximate position, other than the user’s own city."
          rows={current.nearby} empty={current.coordinates ? "No coordinates recorded yet. They appear for visits after migration 0030." : "Apply migration 0030 to record coordinates."} />
      </div>
      <AdminTable title="New users and where they were first seen" query={query} rows={current.users.map(user => ({ ...user, nearbyCity: user.nearby ? `${user.nearby.name} (${user.nearby.km} km)` : null }))}
        rowKey={row => String(row.id)}
        columns={[
          "name",
          { key: "joinedAt", label: "Joined (IST)", render: row => ist(String(row.joinedAt)) },
          { key: "country", label: "Country", render: row => String(row.country ?? "Not available") },
          { key: "state", label: "State", render: row => String(row.state ?? "Not available") },
          { key: "city", label: "City", render: row => String(row.city ?? "Not available") },
          { key: "postalCode", label: "Village / PIN area", render: row => row.postalCode ? `PIN ${row.postalCode}` : "Not available from IP" },
          { key: "nearbyCity", label: "Nearby city", render: row => String(row.nearbyCity ?? "Not available") },
          { key: "firstSeenAt", label: "First seen (IST)", render: row => row.firstSeenAt ? ist(String(row.firstSeenAt)) : "No visit recorded" },
        ]}
        note="IP-based and approximate: VPNs, office networks and mobile carriers can place a user in another city. Locations are never inferred when the platform does not supply them." />
    </>}
  </section>;
}

function Card({ tone, icon: Icon, title, purpose, rows, empty }: Readonly<{ tone: string; icon: typeof MapPinned; title: string; purpose: string; rows: Tally[]; empty: string }>) {
  const top = Math.max(1, ...rows.map(row => row.count));
  return <section className={styles.card} data-tone={tone} aria-label={`New users by ${title.toLowerCase()}`}>
    <h3><span aria-hidden="true"><Icon size={15} /></span>{title}<small>{rows.length}</small></h3>
    <p className={styles.purpose}>{purpose}</p>
    {rows.length ? <><div className={styles.listHead} aria-hidden="true"><span>{title}</span><span>Share</span><span>Users</span></div><ol className={styles.list}>{rows.slice(0, 8).map(row => <li key={row.name}>
      <span title={row.name}>{row.name}</span><i aria-hidden="true"><b style={{ width: `${(row.count / top) * 100}%` }} /></i><strong>{row.count}</strong>
    </li>)}</ol></> : <p className={styles.empty}>{empty}</p>}
  </section>;
}
