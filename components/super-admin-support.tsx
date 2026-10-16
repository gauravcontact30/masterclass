"use client";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { BarChart3, Coins, LogOut, Megaphone, RefreshCw, RotateCcw, Search, Trash2 } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Field, FieldLabel, FieldDescription } from "./ui/field";
import { AdminError, AdminFormMessage, AdminLoading } from "./super-admin-feedback";
import { AdminSelect } from "./super-admin-select";
import { AdminTable } from "./super-admin-table";
import shell from "./super-admin-dashboard.module.css";
import styles from "./super-admin-support.module.css";

type Row = Record<string, unknown>;
const show = (value: unknown) => value === null || value === undefined || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
const when = (value: unknown) => value ? new Date(String(value)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const MESSAGES: Record<string, string> = {
  migration_required: "This tool is not set up in the database yet. Apply supabase/migrations/0020_admin_support.sql, then reload.",
  owner_protected: "The owner account is protected from this action.",
  insufficient_credits: "That would take the balance below zero.",
  not_found: "Not found — it may have been removed.",
  not_failed: "Only failed jobs can be retried.",
  duplicate_active: "The learner already has an active copy of this request.",
  invalid_window: "The end time must be after the start time.",
  rate_limited: "Too many changes in a minute. Wait a moment and try again.",
  invalid_request: "Check the fields and try again.",
};
const message = (code: string, fallback: string) => MESSAGES[code] ?? fallback;

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init, headers: init?.body ? { "Content-Type": "application/json" } : undefined });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "service_error");
  return body as T;
}

function useAdminData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setData(await call<T>(url)); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "service_error"); }
  }, [url]);
  useEffect(() => { let live = true; queueMicrotask(() => { if (live) void load(); }); return () => { live = false; }; }, [load]);
  return { data, error, reload: load };
}

function Mini({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div className={styles.mini}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

function Records({ title, rows, columns, actions }: { title: string; rows: Row[]; columns: string[]; actions?: React.ReactNode }) {
  return <AdminTable title={title} rows={rows} columns={columns} actions={actions} empty="Nothing here." />;
}

/* ------------------------------------------------------------------ learner support */
type Learner = {
  account: Row; profile: Row | null; subscription: Row | null; usage: { period: string; used: number };
  documents: { byStatus: Record<string, number>; recent: Row[] }; progress: Row | null; sessions: number; reports: Row[]; history: Row[];
};

/** Find a learner, see everything about their account in one place, and act on it with an audited reason. */
export function SuperAdminLearnerSupport({ users }: { users: Row[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (q ? users.filter(user => String(user.email ?? "").toLowerCase().includes(q) || String(user.id).startsWith(q)) : users).slice(0, 12);
  }, [users, search]);
  return <div className={styles.support}>
    <Card className={shell.panel}>
      <h2>Find a learner</h2>
      <label className={styles.search}><Search size={16} aria-hidden="true" /><Input aria-label="Search learners by email or id" placeholder="Search by email or user id…" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <ul className={styles.results}>{matches.map(user => <li key={String(user.id)}><button type="button" aria-pressed={selected === user.id} onClick={() => setSelected(String(user.id))}>
        <b>{show(user.email)}</b><small>Joined {when(user.created_at)} · last sign-in {when(user.last_sign_in_at)} · {show(user.role)}</small></button></li>)}</ul>
      {!matches.length && <p className={shell.empty}>No learner matches “{search}”.</p>}
    </Card>
    {selected ? <LearnerView key={selected} id={selected} /> : <Card className={shell.panel}><p className={shell.empty}>Choose a learner to see their account, subscription, usage, documents, progress and history.</p></Card>}
  </div>;
}

function LearnerView({ id }: { id: string }) {
  const { data, error, reload } = useAdminData<Learner>(`/api/super-admin/support?user=${id}`);
  if (error) return <AdminError>{message(error, "This learner could not be loaded.")}</AdminError>;
  if (!data) return <AdminLoading>Loading learner…</AdminLoading>;
  const a = data.account;
  return <div className={styles.learner}>
    <Card className={shell.panel}>
      <div className={shell.panelHeading}><h2>{show(a.email)}</h2><Badge variant="secondary">{show(a.role)}</Badge></div>
      <p className={shell.note}>Joined {when(a.created_at)} · last sign-in {when(a.last_sign_in_at)} · {a.email_confirmed_at ? "email verified" : "email not verified"}{a.banned_until && new Date(String(a.banned_until)) > new Date() ? " · banned" : ""}</p>
      <div className={styles.miniGrid}>
        <Mini label="Credits" value={show(data.profile?.credit_balance ?? 0)} note="Download credits" />
        <Mini label="Plan" value={data.subscription ? `${show(data.subscription.tier)} · ${show(data.subscription.status)}` : "None"} note={data.subscription ? `Renews/ends ${when(data.subscription.current_period_end)}` : "No membership"} />
        <Mini label="Usage this month" value={show(data.usage.used)} note={`Period ${show(data.usage.period)}`} />
        <Mini label="Active sessions" value={data.sessions} note="Signed-in devices" />
        <Mini label="Documents" value={Object.values(data.documents.byStatus).reduce((sum, n) => sum + Number(n), 0)} note={Object.entries(data.documents.byStatus).map(([status, n]) => `${n} ${status}`).join(" · ") || "None yet"} />
        <Mini label="Guides" value={`${show(data.progress?.completed ?? 0)} / ${show(data.progress?.started ?? 0)}`} note={`Completed / started · last active ${when(data.progress?.last_active)}`} />
      </div>
    </Card>
    <SupportActions id={id} onDone={() => void reload()} />
    <Records title="Recent documents" rows={data.documents.recent} columns={["title", "status", "error_code", "attempts", "used_credit", "created_at"]} />
    <Records title="Content reports" rows={data.reports} columns={["path", "reason", "status", "created_at"]} />
    <Records title="Account history" rows={data.history} columns={["created_at", "kind", "action", "details"]} />
  </div>;
}

function SupportActions({ id, onDone }: { id: string; onDone: () => void }) {
  const formId = useId();
  const [action, setAction] = useState<"credits" | "reset_usage" | "revoke_sessions">("credits");
  const [delta, setDelta] = useState("5");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ text: string; ok: boolean }>({ text: "", ok: true });
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setResult({ text: "", ok: true });
    try {
      const body = action === "credits" ? { action, user: id, delta: Number(delta), reason } : { action, user: id, reason };
      const response = await call<{ balance?: number; previous?: number; removed?: number }>("/api/super-admin/support", { method: "POST", body: JSON.stringify(body) });
      setResult({ ok: true, text: action === "credits" ? `Credits updated. New balance: ${response.balance}.` : action === "reset_usage" ? `This month's usage reset (was ${response.previous}).` : `Signed out of ${response.removed} session(s).` });
      setReason(""); onDone();
    } catch (e) { setResult({ ok: false, text: message(e instanceof Error ? e.message : "", "The action failed. Nothing was changed.") }); }
    finally { setBusy(false); }
  }
  return <Card className={shell.panel}>
    <h2>Support actions</h2>
    <form className={shell.adminForm} onSubmit={submit}>
      <Field><FieldLabel htmlFor={`${formId}-action`}>Action</FieldLabel>
        <AdminSelect id={`${formId}-action`} label="Action" disabled={busy} value={action} onValueChange={value => setAction(value as typeof action)} options={[
          { value: "credits", label: "Grant or remove credits" }, { value: "reset_usage", label: "Reset this month's usage" }, { value: "revoke_sessions", label: "Sign out everywhere" }]} />
      </Field>
      {action === "credits" && <Field><FieldLabel htmlFor={`${formId}-delta`}>Credits (−100 to 100)</FieldLabel>
        <Input id={`${formId}-delta`} type="number" min={-100} max={100} step={1} required disabled={busy} value={delta} onChange={e => setDelta(e.target.value)} /></Field>}
      <Field className={shell.fullWidth}><FieldLabel htmlFor={`${formId}-reason`}>Reason</FieldLabel>
        <Textarea id={`${formId}-reason`} required minLength={5} maxLength={500} disabled={busy} placeholder="Why — this is recorded in the audit log with your account" value={reason} onChange={e => setReason(e.target.value)} />
        <FieldDescription>5 to 500 characters. Every action is written to the audit trail in the same transaction.</FieldDescription></Field>
      <Button type="submit" disabled={busy || reason.trim().length < 5 || (action === "credits" && (!Number(delta) || Math.abs(Number(delta)) > 100))}>
        {action === "credits" ? <Coins size={15} /> : action === "reset_usage" ? <RotateCcw size={15} /> : <LogOut size={15} />}{busy ? "Working…" : "Apply"}</Button>
    </form>
    <AdminFormMessage message={result.text} success={result.ok} />
  </Card>;
}

/* ------------------------------------------------------------------ generation queue */
type Queue = { counts: Record<string, number>; oldestQueuedSeconds: number | null; expiredLeases: number; failuresByCode: Row[]; failed: Row[]; inFlight: Row[]; generatedAt: string };

/** The document generation queue: where jobs are, which are stuck, why they fail, and retrying failed ones. */
export function SuperAdminQueue() {
  const { data, error, reload } = useAdminData<Queue>("/api/super-admin/queue");
  useEffect(() => { const timer = setInterval(() => { if (document.visibilityState === "visible") void reload(); }, 30_000); return () => clearInterval(timer); }, [reload]);
  if (error) return <AdminError>{message(error, "The generation queue could not be loaded.")}</AdminError>;
  if (!data) return <AdminLoading>Loading the queue…</AdminLoading>;
  const age = data.oldestQueuedSeconds;
  return <div className={styles.support}>
    <div className={styles.miniGrid}>
      {["queued", "generating", "ready", "failed"].map(status => <Mini key={status} label={status[0].toUpperCase() + status.slice(1)} value={data.counts[status] ?? 0} />)}
      <Mini label="Oldest waiting" value={age == null ? "—" : age < 120 ? `${age} s` : `${Math.round(age / 60)} min`} note="Queued the longest" />
      <Mini label="Expired leases" value={data.expiredLeases} note="Workers that died mid-job; picked up again automatically" />
    </div>
    <Records title="Failures by cause (30 days)" rows={data.failuresByCode} columns={["error_code", "failures", "last_seen"]} actions={<Button variant="outline" size="sm" onClick={() => void reload()}><RefreshCw size={14} />Refresh</Button>} />
    <Card className={shell.panel}><h2>Failed jobs</h2>
      {data.failed.length ? <ul className={styles.jobs}>{data.failed.map(job => <FailedJob key={String(job.id)} job={job} onDone={() => void reload()} />)}</ul> : <p className={shell.empty}>No failed jobs.</p>}
    </Card>
    <Records title="In flight" rows={data.inFlight} columns={["title", "status", "attempts", "user_id", "lease_until", "created_at"]} />
  </div>;
}

function FailedJob({ job, onDone }: { job: Row; onDone: () => void }) {
  const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function retry() {
    setBusy(true); setError("");
    try { await call("/api/super-admin/queue", { method: "POST", body: JSON.stringify({ id: job.id, reason }) }); onDone(); }
    catch (e) { setError(message(e instanceof Error ? e.message : "", "The retry failed.")); setBusy(false); }
  }
  return <li>
    <div><b>{show(job.title)}</b><small>{show(job.error_code)} · {show(job.attempts)} attempts · {job.refunded ? "refunded" : "not refunded"} · {when(job.created_at)}</small></div>
    {open ? <div className={styles.inline}><Input aria-label="Reason for retrying" placeholder="Reason (5+ characters)" value={reason} onChange={e => setReason(e.target.value)} disabled={busy} />
      <Button size="sm" disabled={busy || reason.trim().length < 5} onClick={() => void retry()}>{busy ? "Queuing…" : "Retry"}</Button><Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
      : <Button size="sm" variant="outline" onClick={() => setOpen(true)}><RotateCcw size={14} />Retry</Button>}
    {error && <p className={styles.inlineError}>{error}</p>}
  </li>;
}

/* ------------------------------------------------------------------ announcements */
type Announcement = { id: string; title: string; body: string; tone: string; starts_at: string; ends_at: string | null; active: boolean; created_at: string };
const toIso = (local: string) => local ? new Date(local).toISOString() : null;

/** Write, schedule, pause and end the announcements learners see at the top of their dashboard. */
export function SuperAdminAnnouncements() {
  const formId = useId();
  const { data, error, reload } = useAdminData<{ announcements: Announcement[] }>("/api/super-admin/announcements");
  const [form, setForm] = useState({ title: "", body: "", tone: "info", starts: "", ends: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ text: string; ok: boolean }>({ text: "", ok: true });
  const [now] = useState(() => Date.now());
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setResult({ text: "", ok: true });
    try {
      await call("/api/super-admin/announcements", { method: "POST", body: JSON.stringify({ title: form.title, body: form.body, tone: form.tone, starts_at: toIso(form.starts), ends_at: toIso(form.ends) }) });
      setForm({ title: "", body: "", tone: "info", starts: "", ends: "" }); setResult({ text: "Published. Learners see it on their next dashboard load.", ok: true }); void reload();
    } catch (e) { setResult({ text: message(e instanceof Error ? e.message : "", "The announcement could not be published."), ok: false }); }
    finally { setBusy(false); }
  }
  async function change(id: string, init: RequestInit, url = "/api/super-admin/announcements") {
    try { await call(url, init); void reload(); } catch (e) { setResult({ text: message(e instanceof Error ? e.message : "", "The change failed."), ok: false }); }
  }
  if (error) return <AdminError>{message(error, "Announcements could not be loaded.")}</AdminError>;
  const state = (item: Announcement) => !item.active ? "paused" : new Date(item.starts_at).getTime() > now ? "scheduled" : item.ends_at && new Date(item.ends_at).getTime() <= now ? "ended" : "live";
  return <div className={styles.support}>
    <Card className={shell.panel}>
      <h2><Megaphone size={17} /> New announcement</h2>
      <form className={shell.adminForm} onSubmit={create}>
        <Field><FieldLabel htmlFor={`${formId}-title`}>Title</FieldLabel><Input id={`${formId}-title`} required minLength={3} maxLength={120} disabled={busy} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field><FieldLabel htmlFor={`${formId}-tone`}>Type</FieldLabel><AdminSelect id={`${formId}-tone`} label="Type" disabled={busy} value={form.tone} onValueChange={tone => setForm({ ...form, tone })} options={[{ value: "info", label: "Information" }, { value: "success", label: "Good news" }, { value: "warning", label: "Warning" }, { value: "maintenance", label: "Maintenance" }]} /></Field>
        <Field className={shell.fullWidth}><FieldLabel htmlFor={`${formId}-body`}>Message</FieldLabel><Textarea id={`${formId}-body`} required minLength={3} maxLength={600} disabled={busy} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /><FieldDescription>Up to 600 characters. Shown at the top of every learner&apos;s dashboard while live.</FieldDescription></Field>
        <Field><FieldLabel htmlFor={`${formId}-starts`}>Starts (optional)</FieldLabel><Input id={`${formId}-starts`} type="datetime-local" disabled={busy} value={form.starts} onChange={e => setForm({ ...form, starts: e.target.value })} /></Field>
        <Field><FieldLabel htmlFor={`${formId}-ends`}>Ends (optional)</FieldLabel><Input id={`${formId}-ends`} type="datetime-local" disabled={busy} value={form.ends} onChange={e => setForm({ ...form, ends: e.target.value })} /></Field>
        <Button type="submit" disabled={busy || form.title.trim().length < 3 || form.body.trim().length < 3}>{busy ? "Publishing…" : "Publish"}</Button>
      </form>
      <AdminFormMessage message={result.text} success={result.ok} />
    </Card>
    <Card className={shell.panel}><h2>All announcements</h2>
      {!data ? <AdminLoading>Loading…</AdminLoading> : data.announcements.length ? <ul className={styles.announcements}>{data.announcements.map(item => <li key={item.id} data-tone={item.tone}>
        <div><span className={styles.state} data-state={state(item)}>{state(item)}</span><b>{item.title}</b><p>{item.body}</p>
          <small>{item.tone} · from {when(item.starts_at)}{item.ends_at ? ` to ${when(item.ends_at)}` : ", no end"}</small></div>
        <div className={styles.inline}>
          <Button size="sm" variant="outline" onClick={() => void change(item.id, { method: "PATCH", body: JSON.stringify({ id: item.id, active: !item.active }) })}>{item.active ? "Pause" : "Resume"}</Button>
          {state(item) === "live" && <Button size="sm" variant="outline" onClick={() => void change(item.id, { method: "PATCH", body: JSON.stringify({ id: item.id, ends_at: new Date().toISOString() }) })}>End now</Button>}
          <DeleteButton onConfirm={() => void change(item.id, { method: "DELETE" }, `/api/super-admin/announcements?id=${item.id}`)} />
        </div>
      </li>)}</ul> : <p className={shell.empty}>No announcements yet.</p>}
    </Card>
  </div>;
}

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const timer = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(timer); }, [armed]);
  return <Button size="sm" variant={armed ? "destructive" : "ghost"} onClick={() => armed ? onConfirm() : setArmed(true)}><Trash2 size={14} />{armed ? "Confirm delete" : "Delete"}</Button>;
}

/* ------------------------------------------------------------------ growth insights */
type Insights = {
  learners: { total: number; new: number; active7: number; active30: number }; plans: { monthly: number; yearly: number };
  credits: { outstanding: number; holders: number }; progress: { started: number; completed: number };
  signups: { day: string; signups: number }[]; generations: { day: string; requested: number; ready: number; failed: number }[]; technologies: Row[];
};

/** Learner growth and engagement across the reporting window. */
export function SuperAdminInsights({ days }: { days: number }) {
  const { data, error } = useAdminData<Insights>(`/api/super-admin/insights?days=${days}`);
  if (error) return <AdminError>{message(error, "Insights could not be loaded.")}</AdminError>;
  if (!data) return <AdminLoading>Loading insights…</AdminLoading>;
  const l = data.learners;
  const stickiness = l.active30 ? Math.round((l.active7 / l.active30) * 100) : 0;
  const completion = data.progress.started ? Math.round((data.progress.completed / data.progress.started) * 100) : 0;
  const maxSignups = Math.max(1, ...data.signups.map(row => row.signups));
  const maxGen = Math.max(1, ...data.generations.map(row => row.requested));
  return <div className={styles.support}>
    <div className={styles.miniGrid}>
      <Mini label="Learners" value={l.total} note={`${l.new} joined in this window`} />
      <Mini label="Active (7 days)" value={l.active7} note={`${l.active30} in 30 days · ${stickiness}% stickiness`} />
      <Mini label="Paying members" value={data.plans.monthly + data.plans.yearly} note={`${data.plans.monthly} monthly · ${data.plans.yearly} yearly`} />
      <Mini label="Paid conversion" value={l.total ? `${(((data.plans.monthly + data.plans.yearly) / l.total) * 100).toFixed(1)}%` : "—"} note="Members ÷ all learners" />
      <Mini label="Guide completion" value={`${completion}%`} note={`${data.progress.completed} of ${data.progress.started} started`} />
      <Mini label="Outstanding credits" value={data.credits.outstanding} note={`Held by ${data.credits.holders} learners`} />
    </div>
    <div className={styles.twoCol}>
      <Card className={shell.panel}><h2><BarChart3 size={16} /> Sign-ups per day</h2>
        {data.signups.length ? <div className={styles.columns}>{data.signups.map(row => <span key={row.day} title={`${row.day}: ${row.signups}`} style={{ height: `${(row.signups / maxSignups) * 100}%` }} />)}</div> : <p className={shell.empty}>No sign-ups in this window.</p>}
      </Card>
      <Card className={shell.panel}><h2><BarChart3 size={16} /> Generations per day</h2>
        {data.generations.length ? <div className={styles.columns}>{data.generations.map(row => <span key={row.day} data-failed={row.failed > 0} title={`${row.day}: ${row.requested} requested, ${row.ready} ready, ${row.failed} failed`} style={{ height: `${(row.requested / maxGen) * 100}%` }} />)}</div> : <p className={shell.empty}>No generations in this window.</p>}
      </Card>
    </div>
    <Records title="Most requested technologies" rows={data.technologies} columns={["technology", "documents", "learners"]} />
  </div>;
}
