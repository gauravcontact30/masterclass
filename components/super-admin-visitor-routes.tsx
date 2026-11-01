"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Globe2, Laptop, Layout, Link2, Radio, Route, Server, Sparkles } from "lucide-react";
import { visitorApiRoutes, visitorUiRoutes, type StreamApiCall, type StreamVisitor } from "@/lib/live-visits";
import { Flag, countryName } from "./super-admin-audience";
import { Pager } from "./super-admin-pager";
import styles from "./super-admin-visitor-routes.module.css";

const PAGE = 4;
const TONES = ["mint", "sky", "lavender", "peach", "butter", "rose"] as const;
const when = (ms: number) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(ms));
const lasted = (ms: number) => { const s = Math.round(ms / 1000); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`; };
const speed = (ms: number) => ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;

/**
 * Route activity in the Live visitor stream: one card per visitor, with who they are and, separately, the frontend
 * routes they opened and the backend API routes their browser called. Same visitors, order and numbers as the Visitor
 * Logs below, so the filter above drives both.
 */
export function VisitorRoutes({ visitors, apiCalls }: Readonly<{ visitors: StreamVisitor[]; apiCalls: StreamApiCall[] }>) {
  const [page, setPage] = useState(1);
  const bySession = useMemo(() => {
    const map = new Map<string, StreamApiCall[]>();
    for (const call of apiCalls) map.set(call.session_id, [...(map.get(call.session_id) ?? []), call]);
    return map;
  }, [apiCalls]);
  if (!visitors.length) return null;
  const pages = Math.max(1, Math.ceil(visitors.length / PAGE));
  const current = Math.min(page, pages), from = (current - 1) * PAGE;
  return <section className={styles.routes} aria-labelledby="visitor-routes-title">
    <header className={styles.head}>
      <span className={styles.mark} aria-hidden="true"><Route size={17} /></span>
      <div>
        <h4 id="visitor-routes-title">Routes by visitor</h4>
        <p>The pages each visitor opened and the API routes their browser called, over every visit in this window.</p>
      </div>
    </header>
    <ol className={styles.list}>
      {visitors.slice(from, from + PAGE).map((visitor, offset) => {
        const rank = from + offset + 1, latest = visitor.current;
        const code = latest.country ?? visitor.first.country ?? "";
        const place = [latest.city, code ? countryName(code) : ""].filter(Boolean).join(", ") || "Location unknown";
        const device = [latest.browser, latest.os].filter(Boolean).join(" on ") || "Device unknown";
        const name = visitor.email ?? (visitor.first.new_visitor ? "New visitor" : "Returning visitor");
        const ui = visitorUiRoutes(visitor), backend = visitorApiRoutes(visitor, bySession);
        const totalCalls = backend.reduce((sum, item) => sum + item.calls, 0);
        return <li key={visitor.key} className={styles.card} data-tone={TONES[(rank - 1) % TONES.length]}>
          <div className={styles.who}>
            <span className={styles.rank}>#{rank}</span>
            <strong title={name}>{name}</strong>
            {visitor.signedIn
              ? <span className={styles.pill}><CheckCircle2 size={11} aria-hidden="true" />Signed in</span>
              : visitor.first.new_visitor ? <span className={styles.pill}><Sparkles size={11} aria-hidden="true" />First time</span> : <span className={styles.pill}>Returning</span>}
            <span className={styles.pill}>{visitor.sessions} {visitor.sessions === 1 ? "visit" : "visits"}</span>
            {visitor.live && <span className={styles.live}><Radio size={11} aria-hidden="true" />On site</span>}
          </div>
          <dl className={styles.facts}>
            <div><dt><Clock size={12} aria-hidden="true" />Launched</dt><dd>{when(visitor.visit.start)} IST</dd></div>
            <div><dt><Link2 size={12} aria-hidden="true" />Came from</dt><dd title={visitor.visit.source ?? "Direct"}>{visitor.visit.source ?? "Direct"}</dd></div>
            <div><dt>{code ? <Flag code={code} /> : <Globe2 size={12} aria-hidden="true" />}Where</dt><dd title={place}>{place}</dd></div>
            <div><dt><Laptop size={12} aria-hidden="true" />Device</dt><dd title={device}>{device}</dd></div>
          </dl>
          <div className={styles.panels}>
            <section className={styles.panel} data-side="ui" aria-label={`Frontend/UI routes visited by visitor ${rank}`}>
              <h5><Layout size={14} aria-hidden="true" />Frontend/UI Routes - Visited<span>{ui.length}</span></h5>
              <ul>{ui.map(item => <li key={item.path}>
                <code title={item.path}>{item.path}</code>
                {item.entries > 0 && <em>Entry</em>}
                {item.open && <em data-open="">Open now</em>}
                <small>{item.views} {item.views === 1 ? "view" : "views"}{item.ms ? ` · ${lasted(item.ms)}` : ""}</small>
              </li>)}</ul>
            </section>
            <section className={styles.panel} data-side="api" aria-label={`Backend API routes visited by visitor ${rank}`}>
              <h5><Server size={14} aria-hidden="true" />Backend API Routes Visited<span>{totalCalls}</span></h5>
              {backend.length
                ? <ul>{backend.map(item => <li key={`${item.method} ${item.path}`}>
                  <b>{item.method}</b>
                  <code title={item.path}>{item.path}</code>
                  {item.errors > 0 && <em data-error="">{item.errors} failed</em>}
                  <small>{item.calls} {item.calls === 1 ? "call" : "calls"} · {speed(item.avgMs)} avg</small>
                </li>)}</ul>
                : <p>None recorded for this visitor. Calls are captured from this release on, and pages served entirely from cache make none.</p>}
            </section>
          </div>
        </li>;
      })}
    </ol>
    {visitors.length > PAGE && <Pager page={current} pages={pages} total={visitors.length} size={PAGE} onPage={setPage} />}
  </section>;
}
