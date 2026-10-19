"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";
import { useMemo, useState } from "react";
import { filterTraces, type TraceRow } from "@/lib/admin-traces";
import { AdminTable } from "./super-admin-table";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import styles from "./super-admin-traces.module.css";

export function SuperAdminTraces({ events, query, initialMode = "all" }: { events: TraceRow[]; query: string; initialMode?: string }) {
  const [identity, setIdentity] = useState("");
  const [mode, setMode] = useState(initialMode);
  const rows = useMemo(() => filterTraces(events, identity, mode), [events, identity, mode]);
  return <Card className={styles.explorer}>
    <div><h2>Trace explorer</h2><p>Follow an actor, owner, record or request through the loaded event history. IDs match exactly; shared IDs indicate related records, not a distributed trace.</p></div>
    <div className={styles.controls}>
      <label>Trace by ID<Input placeholder="Paste a request, user, record or event ID" value={identity} onChange={event => setIdentity(event.target.value)} /></label>
      <label>Event scope<select value={mode} onChange={event => setMode(event.target.value)}><option value="all">All events</option><option value="errors">Failed responses (400+)</option><option value="slow">Slow requests (1,000+ ms)</option><option value="audit">Database changes</option></select></label>
      <Button variant="outline" onClick={() => { setIdentity(""); setMode(initialMode); }}>Reset trace</Button>
    </div>
    <AdminTable title="Trace timeline" rows={rows} query={query} note="Latest 200 loaded events in the selected reporting window. No match does not prove an event never occurred. Request IDs are available for newly instrumented requests." columns={[
      "created_at", "kind", "resource", "action", "status", "duration_ms",
      ...["request_id", "actor_id", "owner_id", "record_id"].map(key => ({ key, filter: false, render: (row: TraceRow) => row[key] ? <button type="button" className={styles.identity} onClick={() => setIdentity(String(row[key]))} title={`Trace ${String(row[key])}`}>{String(row[key])}</button> : "—" })),
      { key: "details", sort: false, filter: false, render: row => <details><AccordionSummary>Inspect event</AccordionSummary><pre className={styles.details}>{JSON.stringify(row, null, 2)}</pre></details> },
    ]} />
  </Card>;
}
