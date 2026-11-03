"use client";
import { useId, useMemo, useState } from "react";
import { ArrowUpRight, Lock, Search } from "lucide-react";
import Link from "@/components/site-link";
import { API_TYPES } from "@/lib/api-docs";
import type { ApiMapRow } from "@/lib/server/api-previews";
import { PillPager } from "./pill-pager";
import styles from "./api-tech-guide.module.css";

const PER_PAGE = 12;
const STATUS: Record<string, string> = { p: "Preview", x: "Experimental", d: "Deprecated" };

/** The rest of a technology's APIs, filtered by type and paged. For non-members the rows are names only, and disabled. */
export function ApiGuideMap({ packageId, rows, member }: Readonly<{ packageId: string; rows: ApiMapRow[]; member: boolean }>) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [page, setPage] = useState(0);
  const kinds = useMemo(() => API_TYPES.filter(type => rows.some(row => row.kind === type.k)), [rows]);
  const needle = query.trim().toLowerCase();
  const shown = rows.filter(row => (kind === "all" || row.kind === kind) && (!needle || row.name.toLowerCase().includes(needle)));
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const at = Math.min(page, pages - 1);
  return <>
    <div className={styles.mapTools}>
      <label className={styles.mapSearch}><Search size={15} aria-hidden="true" /><input type="search" aria-label="Filter APIs by name" placeholder="Filter by name" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label>
      {kinds.length > 1 && <div className={styles.mapKinds} role="group" aria-label="API type">
        <button type="button" aria-pressed={kind === "all"} onClick={() => { setKind("all"); setPage(0); }}>All</button>
        {kinds.map(type => <button type="button" key={type.k} aria-pressed={kind === type.k} onClick={() => { setKind(type.k); setPage(0); }}><i style={{ background: type.c }} aria-hidden="true" />{type.label}</button>)}
      </div>}
    </div>
    <ul id={id} className={styles.mapList}>
      {shown.slice(at * PER_PAGE, (at + 1) * PER_PAGE).map(row => {
        const label = <><code>{row.name}</code>{STATUS[row.status] && <small data-status={row.status}>{STATUS[row.status]}</small>}{row.summary && <span>{row.summary}</span>}</>;
        return <li key={row.name}>{member
          ? <Link href={`/learning/api-docs/${encodeURIComponent(packageId)}/${encodeURIComponent(row.name)}`}>{label}<ArrowUpRight size={14} aria-hidden="true" /></Link>
          : <div aria-disabled="true" data-locked="">{label}<Lock size={14} aria-label="Subscribers only" /></div>}</li>;
      })}
    </ul>
    {!shown.length && <p className={styles.mapEmpty} role="status">No API matches that filter.</p>}
    <PillPager className={styles.mapPager} page={at} pages={pages} total={shown.length} perPage={PER_PAGE} onPage={setPage} label="More APIs" noun="APIs" controls={id} />
  </>;
}
