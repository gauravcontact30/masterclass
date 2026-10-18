"use client";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

import { Label } from "@/components/ui/label";
import { AdminSelect } from "./super-admin-select";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Activity, ArrowLeft, Bot, Layers, Receipt, LifeBuoy, Megaphone, MousePointerClick, TrendingUp, ChevronDown, ChevronRight, CreditCard, Database, ExternalLink, Languages, LogOut, RefreshCw, PanelLeftClose, PanelLeftOpen, Server, ShieldCheck, UserRound, Users } from "lucide-react";
import {SuperAdminOperations} from "./super-admin-operations";
import {SuperAdminUsers} from "./super-admin-users";
import { SuperAdminAi } from "./super-admin-ai";
import { SuperAdminBilling } from "./super-admin-billing";
import { SuperAdminInfrastructure } from "./super-admin-infrastructure";
import { SidebarTooltips } from "./sidebar-tooltips";
import { DashboardPageHeader } from "./dashboard-page-header";
import { Wordmark } from "./brand-mark";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { SuperAdminSuggestions } from "./super-admin-suggestions";
import { OverviewLive } from "./super-admin-overview-live";
import { SuperAdminTraces } from "./super-admin-traces";
import { SuperAdminActivity } from "./super-admin-activity";
import { AdminTable } from "./super-admin-table";
import { SuperAdminTransactions } from "./super-admin-transactions";
import { SuperAdminPromotions } from "./super-admin-promotions";
import { SuperAdminAnnouncements, SuperAdminInsights, SuperAdminLearnerSupport, SuperAdminQueue } from "./super-admin-support";
import styles from "./super-admin-dashboard.module.css";
import side from "./super-admin-sidebar.module.css";
import { useLanguage } from "./language-provider";

type Row = Record<string, unknown>;
type Snapshot = {
  generatedAt: string; counts: { users: number; documents: number; activeSubscriptions: number; failedDocuments: number };
  users: Row[]; sessions: Row[]; logins: Row[]; subscriptions: Row[]; billing: Row[]; revenue: Row[]; events: Row[]; documents: Row[]; integrations: Row[];
  recurring: { monthly: number; yearly: number }; prices: { monthly: number; yearly: number };
  requests: { count: number; errors: number; p95: number | null };
  health: { databaseMs: number; processUptime: number; processMemory: number; hostMemory: number; hostUsedMemory: number; cpuCores: number; cpuSeconds: number; cpuPercent?:number|null; storage?:{total:number;available:number}|null; environment?:string; nodeVersion?:string; billingConfigured: boolean };
};
// Grouped by the question an administrator arrives with; the flat list keeps the existing section ids.
const groups = [
  { label: "Monitor", items: [{ id: "overview", label: "Overview", icon: Activity }, { id: "activity", label: "User activities", icon: MousePointerClick }, { id: "live", label: "Live learners", icon: Users }, { id: "analytics", label: "Learning analytics", icon: Activity }, { id: "ai", label: "AI analytics", icon: Bot }, { id: "insights", label: "Growth insights", icon: TrendingUp }] },
  { label: "People", items: [{ id: "users", label: "Users & access", icon: Users }, { id: "suggestions", label: "Suggestion Box", icon: MessageSquarePlus }, { id: "support", label: "Learner support", icon: LifeBuoy }, { id: "moderation", label: "Moderation", icon: ShieldCheck }, { id: "announcements", label: "Announcements", icon: Megaphone }] },
  { label: "Growth", items: [{ id: "promotions", label: "Promotional Tracking", icon: TrendingUp }] },
  { label: "Revenue", items: [{ id: "billing", label: "Revenue & billing", icon: CreditCard }, { id: "transactions", label: "Transactions", icon: Receipt }] },
  { label: "Content", items: [{ id: "content", label: "Content & audit", icon: Database }, { id: "queue", label: "Generation queue", icon: Layers }] },
  { label: "System", items: [{ id: "infra", label: "Infrastructure", icon: Server }, { id: "health", label: "System health", icon: Activity }, { id: "logs", label: "Application logs", icon: Database }, { id: "security", label: "Security", icon: ShieldCheck }] },
] as const;
type SectionItem = (typeof groups)[number]["items"][number];
const sections: readonly SectionItem[] = groups.flatMap((group): readonly SectionItem[] => group.items);
type Section = typeof sections[number]["id"];
const money = (n: number, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function Table({ title, rows, columns, query, note }: { title: string; rows: Row[]; columns: string[]; query: string; note?: string }) {
  return <AdminTable title={title} rows={rows} columns={columns} query={query} note={note} />;
}
function Metric({ label, value, note }: { label: string; value: string | number; note: string }) { return <Card className={styles.metric}><span>{label}</span><strong>{value}</strong><small>{note}</small></Card>; }
export function SuperAdminDashboard() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [signingOut, setSigningOut] = useState(false);
  const [accountError, setAccountError] = useState("");
  async function signOut() {
    setSigningOut(true);
    setAccountError("");
    try {
      const { supabaseBrowser } = await import("@/lib/supabase-browser");
      const { error } = await supabaseBrowser().auth.signOut();
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch {
      setAccountError("Unable to sign out. Please try again.");
      setSigningOut(false);
    }
  }
  const [collapsed, setCollapsed] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const [days, setDays] = useState(30); const [query, setQuery] = useState("");
  const [data, setData] = useState<Snapshot | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(true);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/super-admin?days=${days}`, { cache: "no-store", signal });
      if (response.status === 401 || response.status === 403) setData(null);
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Your session does not have super admin access. Sign in with the authorized account." : "Monitoring is unavailable. Check the database connection and apply migration 0018.");
      const snapshot: Snapshot = await response.json();
      if (!signal?.aborted) { setData(snapshot); setError(""); }
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : "Unable to load monitoring."); }
    finally { if (!signal?.aborted) setBusy(false); }
  }, [days]);
  // The Overview live panels re-read the snapshot on their own 15-second rhythm.
  const refreshQuietly = useCallback(() => { void refresh(); }, [refresh]);
  useEffect(() => { const controller = new AbortController(); queueMicrotask(() => { if (!controller.signal.aborted) void refresh(controller.signal); }); const interval = setInterval(() => { if (document.visibilityState === "visible") void refresh(controller.signal); }, 60000); return () => { controller.abort(); clearInterval(interval); }; }, [refresh]);
  const table = (title: string, rows: Row[], columns: string[], note?: string) => <Table key={`${title}-${days}`} title={title} rows={rows} columns={columns} query={query} note={note} />;
  const mrr = data ? data.recurring.monthly * data.prices.monthly + data.recurring.yearly * data.prices.yearly / 12 : 0;
  const events = data?.events ?? [];
  return <div className={`app-shell compact-workspace ${styles.shell}${collapsed ? " sidebar-collapsed" : ""}`}><aside className={`sidebar ${styles.sidebar} ${side.sidebar}`} data-collapsed={collapsed || undefined}><SidebarTooltips collapsed={collapsed}/><div className="sidebar-brand-row"><Link href="/dashboard" className="wordmark" aria-label="Learning dashboard"><Wordmark /></Link><Button variant="ghost" className="sidebar-toggle" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}</Button></div>{!collapsed && <div className={side.badge}><span className={side.badgeMark}><ShieldCheck size={15} /></span><span><b>Super admin</b><small>Control centre</small></span></div>}<nav aria-label="Super admin" className={side.nav}>{groups.map(group => <div key={group.label} className={side.group} role="group" aria-label={group.label}>
        {!collapsed && <span className={side.groupLabel}>{group.label}</span>}
        {group.items.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-label={label} title={collapsed ? label : undefined} className={side.item} aria-current={section === id ? "page" : undefined} onClick={() => { setSection(id); setQuery(""); }}>
          <span className={side.icon}><Icon size={16} /></span>{!collapsed && <span className={side.label}>{label}</span>}
        </button>)}
      </div>)}</nav><Link className={side.back} href="/dashboard" aria-label="Learning dashboard"><span className={side.icon}><ArrowLeft size={16} /></span>{!collapsed && "Learning dashboard"}</Link></aside>
    <div className="main-shell"><header className={`topbar ${styles.adminHeader}`}>
      <div className={styles.headerIdentity}>
        <span className={styles.headerMark} aria-hidden="true"><ShieldCheck size={21} /></span>
        <div className={styles.headerLocation}>
          <span className={styles.consoleName}>Admin console</span>
          <ChevronRight size={14} aria-hidden="true" />
          <span className={styles.currentSection}>{sections.find(s => s.id === section)?.label}</span>
        </div>
      </div>
      <div className={styles.headerActions}>
        <span className={styles.syncStatus} data-state={error ? "error" : busy ? "busy" : "ready"} aria-live="polite">
          <span className={styles.statusDot} aria-hidden="true" />
          {busy ? "Refreshing..." : error ? "Refresh unavailable" : data ? `Updated ${new Date(data.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Awaiting data"}
        </span>
        <Button variant="outline" type="button" className={styles.headerRefresh} disabled={busy} onClick={() => void refresh()} aria-label="Refresh monitoring" title="Refresh monitoring">
          <RefreshCw size={16} className={busy ? "spin" : ""} aria-hidden="true" />
        </Button>
        <div className="language-toggle" role="group" aria-label="Language">
          <Languages size={14} className="lang-icon" aria-hidden="true"/>
          <button type="button" aria-pressed={language==="en"} onClick={()=>setLanguage("en")}>EN</button>
          <button type="button" aria-pressed={language==="hi"} onClick={()=>setLanguage("hi")}>Hi</button>
        </div>
        <Separator orientation="vertical" className={styles.headerDivider} />
        <DropdownMenu>
          <DropdownMenuTrigger className={styles.profileTrigger} aria-label="Super admin profile" disabled={signingOut}>
            <span className={styles.profileAvatar} aria-hidden="true"><UserRound size={18} /></span>
            <ChevronDown size={13} className={styles.profileChevron} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={10} className={styles.profileMenu}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Super admin account</DropdownMenuLabel>
              <DropdownMenuItem render={<Link href="/" />}><ExternalLink size={16} />View website</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={signingOut} onClick={() => void signOut()}><LogOut size={16} />Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header><main className={styles.main}><DashboardPageHeader eyebrow={section === "suggestions" ? "People · Feedback" : "Application monitoring"} title={section === "overview" ? "Your application, at a glance." : sections.find(s => s.id === section)?.label} description={section === "suggestions" ? "Listen, triage and keep contributors informed. Replies appear in each contributor’s private tracking view." : "Keep a pulse on your learners, subscriptions, and platform."} icon={section === "suggestions" ? <MessageSquarePlus/> : <ShieldCheck/>}/>
      {section !== "suggestions" && <div className={styles.toolbar}><div className={styles.reportFilter}><Label htmlFor="admin-report-window">Reporting window</Label><AdminSelect id="admin-report-window" label="Reporting window" value={String(days)} onValueChange={value=>setDays(Number(value))} options={[{value:"1",label:"Last 24 hours"},{value:"7",label:"Last 7 days"},{value:"30",label:"Last 30 days"},{value:"90",label:"Last 90 days"}]} /></div><Input aria-label="Search displayed records" placeholder="Search displayed records…" value={query} onChange={e => setQuery(e.target.value)} /></div>}
      {accountError && <Alert variant="destructive" className={styles.error}><AlertDescription>{accountError}</AlertDescription></Alert>}
      {error && <Alert variant="destructive" className={styles.error}><AlertDescription>{error}{data && " Displaying the last successful snapshot."}</AlertDescription></Alert>}
      {!data && !error && <div className={styles.loading} role="status"><span>Loading application monitoring...</span><div className={styles.metrics}>{[0,1,2,3].map(id=><Skeleton key={id} className={styles.metricSkeleton}/>)}</div></div>}
      {section === "billing" && <SuperAdminBilling />}
      {section === "infra" && <SuperAdminInfrastructure />}
      {section === "activity" && <SuperAdminActivity days={days} query={query} />}
      {section === "insights" && <SuperAdminInsights days={days} />}
      {section === "suggestions" && <SuperAdminSuggestions />}
      {section === "support" && <SuperAdminLearnerSupport users={data?.users ?? []} />}
      {section === "queue" && <SuperAdminQueue />}
      {section === "transactions" && <SuperAdminTransactions />}
      {section === "announcements" && <SuperAdminAnnouncements />}
      {section === "promotions" && <SuperAdminPromotions days={days} query={query} />}
      {(section === "overview" || section === "live") && <OverviewLive snapshot={data} onRefreshSnapshot={refreshQuietly} />}
      {["overview","live","analytics","moderation","security"].includes(section)&&<SuperAdminOperations section={section} days={days} query={query}/>}
      {section==="ai"&&<SuperAdminAi days={days} query={query}/>}
      {data && <>
        {["logs", "health", "security", "content"].includes(section) && <SuperAdminTraces key={`${section}-${days}`} events={events} query={query} initialMode={section === "health" ? "errors" : section === "content" ? "audit" : "all"} />}
        {section === "overview" && <><div className={styles.metrics}><Metric label="Registered users" value={data.counts.users} note="All application accounts" /><Metric label="Active subscriptions" value={data.counts.activeSubscriptions} note="Active, unexpired paid memberships" /><Metric label="Estimated MRR" value={money(mrr)} note="Current plan prices · annual plans ÷ 12" /><Metric label="Learning documents" value={data.counts.documents} note={`${data.counts.failedDocuments} failed generations`} /></div><div className={styles.summary}><Card><Activity size={22} /><h2>Platform pulse</h2><p>Database responded in {data.health.databaseMs} ms. {data.requests.errors} server errors across {data.requests.count} recorded API requests in this window.</p></Card><Card><CreditCard size={22} /><h2>Subscription business</h2><p>{data.recurring.monthly} monthly and {data.recurring.yearly} annual memberships. Estimated ARR {money(mrr * 12)}.</p></Card></div>{table("Recent application activity", events, ["created_at", "kind", "action", "resource", "actor_id", "status"])}</>}
        {section === "users" && <><SuperAdminUsers onOpenSupport={() => setSection("support")} />{table("Auth sessions", data.sessions, ["user_id", "ip", "user_agent", "created_at", "updated_at", "not_after"], "Unexpired stored sessions; presence here does not mean the user is online. Supabase session timeout settings also apply.")}{table("Login history", data.logins, ["created_at", "action", "actor_id", "ip_address"], "Supabase Auth audit events. Coverage and retention depend on your Auth configuration.")}</>}
        {section === "health" && <><div className={styles.metrics}><Metric label="Database latency" value={`${data.health.databaseMs} ms`} note="Current monitoring query round trip" /><Metric label="API p95 latency" value={data.requests.p95 === null ? "No samples" : `${Math.round(data.requests.p95)} ms`} note="95% of recorded requests completed within this time" /><Metric label="Process memory" value={`${Math.round(data.health.processMemory / 1048576)} MB`} note="Current application process RSS" /><Metric label="Process uptime" value={`${Math.floor(data.health.processUptime / 60)} min`} note="Since this instance started, not website availability" /></div><div className={styles.metrics}><Metric label="Process CPU" value={data.health.cpuPercent == null ? "Collecting interval" : `${data.health.cpuPercent.toFixed(1)}%`} note="CPU time since this instance?s previous snapshot"/><Metric label="Filesystem available" value={data.health.storage ? `${(data.health.storage.available/1073741824).toFixed(1)} GB` : "Unavailable"} note={data.health.storage ? `${(data.health.storage.total/1073741824).toFixed(1)} GB capacity on this filesystem` : "Not exposed by this host"}/></div><Card className={styles.panel}><h2>Runtime resources</h2><p>Host memory: {Math.round(data.health.hostUsedMemory / 1048576)} / {Math.round(data.health.hostMemory / 1048576)} MB · {data.health.cpuCores} logical CPUs · {data.health.cpuSeconds.toFixed(1)} cumulative process CPU seconds.</p><p className={styles.note}>Host metrics may reflect a shared container. CPU uses the interval between snapshots on this instance; 100% means one CPU core. Filesystem capacity may be temporary storage on Vercel. External availability and deployment-wide bandwidth require the hosting integration.</p></Card>{table("Errors & failed requests", events.filter(e => Number(e.status) >= 400), ["created_at", "resource", "action", "status", "duration_ms", "details"], "Instrumented API responses, including 404 and 500 errors. Fatal process crashes require hosting logs.")}{table("Failed generation jobs", data.documents.filter(d => d.status === "failed"), ["id", "title", "user_id", "error_code", "created_at"])}</>}
        {section === "billing" && <><div className={styles.metrics}><Metric label="Estimated MRR" value={money(mrr)} note="Based on configured prices, excludes tax/discount adjustments" /><Metric label="Estimated ARR" value={money(mrr * 12)} note="MRR × 12" /><Metric label="Razorpay" value={data.health.billingConfigured ? "Configured" : "Not configured"} note="Configuration status, not a gateway availability probe" /></div>{data.revenue.map((r, i) => <Card className={styles.panel} key={i}><h2>{display(r.currency)} transactions</h2><p>Gross captured: {money(Number(r.gross) / 100, String(r.currency || "INR"))} · Processed refunds: {money(Number(r.refunds) / 100, String(r.currency || "INR"))} · Failed payments: {display(r.failed)}</p></Card>)}{table("Subscriptions", data.subscriptions, ["user_id", "tier", "status", "current_period_end", "cancel_at_cycle_end", "synced_at"])}{table("Billing & invoices", data.billing, ["created_at", "event", "entity_id", "subscription_ref", "amount", "currency", "invoice_id"], "Signed Razorpay events recorded after migration. Amounts are in the smallest currency unit (paise for INR). Historical transactions need backfill; invoice references appear when supplied by Razorpay.")}</>}
        {section === "content" && <>{table("Database audit trail", events.filter(e => e.kind === "audit"), ["created_at", "actor_id", "resource", "action", "details"], "Changes to public application tables existing when migration 0018 is applied. Service/database writes identify the owner separately; the initiating user is unknown when no authenticated JWT is present.")}{table("Learning content", data.documents, ["title", "user_id", "status", "created_at"])}<Card className={styles.panel}><h2>Content moderation</h2><p>Learners can report content issues from dashboard pages. Review the queue in Moderation.</p><Button variant="outline" className={styles.refresh} onClick={()=>setSection("moderation")}>Open moderation</Button></Card></>}
        {section === "logs" && <>{table("Application event log",events,["created_at","kind","resource","action","actor_id","status","duration_ms","details"],"Recent 200 events. Request paths exclude query strings; prompts and credentials are never included.")}</>}
        {section === "security" && <>{table("Auth security events", data.logins, ["created_at", "action", "actor_id", "ip_address"], "Includes failures when recorded by Supabase Auth. Repeated login failures should also be monitored in the provider's Auth logs.")}{table("Integration connections", data.integrations, ["user_id", "provider", "expires_at"], "Credentials are never included in monitoring responses.")}{table("API & export activity", events.filter(e => e.kind === "request" || e.kind === "export" || e.kind === "integration"), ["created_at", "kind", "actor_id", "resource", "action", "status", "duration_ms", "bytes"])}<Card className={styles.panel}><h2>Monitoring coverage</h2><p className={styles.note}>Tables show the most recent 200 records per feed; totals use the full database or selected time window. Monitoring starts after migration. Auth retention follows Supabase configuration. No automatic email alerts or sensitive-data exports are enabled.</p></Card></>}
      </>}
    </main></div></div>;
}
