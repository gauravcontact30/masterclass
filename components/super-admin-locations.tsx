"use client";
import { useEffect, useState } from "react";
import { Globe2, MapPin, RefreshCw } from "lucide-react";
import type { LocationReport } from "@/lib/visitor-location";
import { AdminTable } from "./super-admin-table";
import { AdminError, AdminLoading } from "./super-admin-feedback";
import styles from "./super-admin-locations.module.css";

export function SuperAdminLocations({ days, query }: { days: number; query: string }) {
  const [data, setData] = useState<LocationReport | null>(null);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [level, setLevel] = useState<"countries" | "regions" | "cities">("regions");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/super-admin/activity/locations?days=${days}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(body => { if (!controller.signal.aborted) { setData(body); setError(false); } })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [days, refresh]);
  const current = data?.days === days ? data : null;
  return <section className={styles.panel} aria-label="Visitor locations">
    <header><div><h2><MapPin size={18} aria-hidden="true" />Visitor locations</h2><p>Approximate IP-based location supplied by the hosting platform. State/region may be an ISO code. VPNs and mobile networks can affect accuracy; missing locations are not inferred.</p></div><button type="button" aria-label="Refresh visitor locations" onClick={() => setRefresh(value => value + 1)}><RefreshCw size={16}/></button></header>
    <div className={styles.tabs} role="group" aria-label="Group visitor locations">{([ ["countries", "Country"], ["regions", "State / region"], ["cities", "City"] ] as const).map(([id,label]) => <button key={id} type="button" aria-pressed={id === level} onClick={() => setLevel(id)}><Globe2 size={14} aria-hidden="true"/>{label}</button>)}</div>
    {error && <AdminError>Visitor locations could not be refreshed. Try again.</AdminError>}
    {!current && !error && <AdminLoading>Loading visitor locations…</AdminLoading>}
    {current && <><p>{current.locatedViews.toLocaleString()} of {current.views.toLocaleString()} recorded page views have location information · Last {days} days · Updated {new Date(current.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>{current.capped && <p role="alert">Limited to the latest 20,000 page views. Counts are partial.</p>}<AdminTable title={`Visitors by ${level === "regions" ? "state / region" : level === "cities" ? "city" : "country"}`} rows={current[level]} query={query} columns={[...(level === "cities" ? ["city"] : []), ...(level !== "countries" ? [{ key: "region", label: "State / region" }] : []), "country", "visitors", "views", "sessions", { key: "signedIn", label: "Signed-in users" }, { key: "lastSeen", label: "Last seen (IST)", render: row => new Date(String(row.lastSeen)).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) }]} note="Unique browsers and sessions are deduplicated within each location; a visitor can appear in multiple locations." /></>}
  </section>;
}
