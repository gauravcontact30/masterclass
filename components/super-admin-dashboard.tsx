"use client";
import dynamic from "next/dynamic";
import { AdminLoading } from "./super-admin-feedback";
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
import { MessageSquarePlus, Activity, HeartPulse, ArrowLeft, ArrowUp, Bot, Layers, Receipt, LifeBuoy, Megaphone, MousePointerClick, TrendingUp, ChevronDown, ChevronRight, CreditCard, Database, ExternalLink, Languages, LogOut, RefreshCw, PanelLeftClose, PanelLeftOpen, Server, ShieldCheck, UploadCloud, UserRound, Users } from "lucide-react";
import { SidebarTooltips } from "./sidebar-tooltips";
import { DashboardPageHeader } from "./dashboard-page-header";
import { Wordmark } from "./brand-mark";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { OverviewLive } from "./super-admin-overview-live";
import { AdminTable } from "./super-admin-table";
import { LearningSlot } from "./learning-slot";
import styles from "./super-admin-dashboard.module.css";
import side from "./super-admin-sidebar.module.css";
import { useLanguage } from "./language-provider";
import { COPILOT_META, isCopilotPage } from "@/lib/admin-pages";

const sectionLoading = () => <AdminLoading>Loading section...</AdminLoading>;
const SuperAdminSecurityCenter = dynamic(() => import("./super-admin-security").then(module => module.SuperAdminSecurityCenter), { loading: sectionLoading });
const SuperAdminUploadLearning = dynamic(() => import("./super-admin-upload-learning").then(module => module.SuperAdminUploadLearning), { loading: sectionLoading });
const SuperAdminNotepad = dynamic(() => import("./super-admin-notepad").then(module => module.SuperAdminNotepad), { loading: sectionLoading });
const SuperAdminOperations = dynamic(() => import("./super-admin-operations").then(module => module.SuperAdminOperations), { loading: sectionLoading });
const SuperAdminUsers = dynamic(() => import("./super-admin-users").then(module => module.SuperAdminUsers), { loading: sectionLoading });
const SuperAdminAuthActivity = dynamic(() => import("./super-admin-auth-activity").then(module => module.SuperAdminAuthActivity), { loading: sectionLoading });
const SuperAdminAi = dynamic(() => import("./super-admin-ai").then(module => module.SuperAdminAi), { loading: sectionLoading });
/** Logs & Health: live checks, latency, Web Vitals, AI performance and the log explorer, in its own chunk. */
const SuperAdminLogsHealth = dynamic(() => import("./super-admin-logs-health").then(module => module.SuperAdminLogsHealth), { loading: sectionLoading });
const SuperAdminBilling = dynamic(() => import("./super-admin-billing").then(module => module.SuperAdminBilling), { loading: sectionLoading });
import { SuperAdminFestiveSale } from "./super-admin-festive-sale";
const SuperAdminInfrastructure = dynamic(() => import("./super-admin-infrastructure").then(module => module.SuperAdminInfrastructure), { loading: sectionLoading });
const SuperAdminSuggestions = dynamic(() => import("./super-admin-suggestions").then(module => module.SuperAdminSuggestions), { loading: sectionLoading });
const SuperAdminTraces = dynamic(() => import("./super-admin-traces").then(module => module.SuperAdminTraces), { loading: sectionLoading });
const SuperAdminAiBriefing = dynamic(() => import("./super-admin-ai-briefing").then(module => module.SuperAdminAiBriefing), { loading: sectionLoading });
const SuperAdminAskData = dynamic(() => import("./super-admin-ask-data").then(module => module.SuperAdminAskData), { loading: sectionLoading });
const SuperAdminNewUserLocations = dynamic(() => import("./super-admin-new-user-locations").then(module => module.SuperAdminNewUserLocations), { loading: sectionLoading });
const SuperAdminActivity = dynamic(() => import("./super-admin-activity").then(module => module.SuperAdminActivity), { loading: sectionLoading });
const SuperAdminTransactions = dynamic(() => import("./super-admin-transactions").then(module => module.SuperAdminTransactions), { loading: sectionLoading });
const SuperAdminPromotions = dynamic(() => import("./super-admin-promotions").then(module => module.SuperAdminPromotions), { loading: sectionLoading });
const SuperAdminCopilot = dynamic(() => import("./super-admin-copilot").then(module => module.SuperAdminCopilot), { loading: sectionLoading });
const SuperAdminAnnouncements = dynamic(() => import("./super-admin-support").then(module => module.SuperAdminAnnouncements), { loading: sectionLoading });
const SuperAdminInsights = dynamic(() => import("./super-admin-support").then(module => module.SuperAdminInsights), { loading: sectionLoading });
const SuperAdminLearnerSupport = dynamic(() => import("./super-admin-support").then(module => module.SuperAdminLearnerSupport), { loading: sectionLoading });
const SuperAdminQueue = dynamic(() => import("./super-admin-support").then(module => module.SuperAdminQueue), { loading: sectionLoading });

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
  { label: "Content", items: [{ id: "content", label: "Content & audit", icon: Database }, { id: "queue", label: "Generation queue", icon: Layers }, { id: "notepad", label: "Notepad", icon: Receipt }, { id: "upload-learning", label: "Upload Learning", icon: UploadCloud }] },
  { label: "System", items: [{ id: "infra", label: "Infrastructure", icon: Server }, { id: "logs-health", label: "Logs & Health", icon: HeartPulse }, { id: "security", label: "Security", icon: ShieldCheck }] },
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
/** `isOwner` unlocks Upload Learning, which only the owner account may use (the API enforces it as well). */
export function SuperAdminDashboard({ userId = "admin", isOwner = false }: { userId?: string; isOwner?: boolean }) {
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
  const [notepadOpened, setNotepadOpened] = useState(false);
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
  // Writing pages have no reporting window or monitoring snapshot of their own.
  const writing = section === "notepad" || section === "upload-learning";
  return <div className={`app-shell compact-workspace ${styles.shell}${collapsed ? " sidebar-collapsed" : ""}`}><aside className={`sidebar ${styles.sidebar} ${side.sidebar}`} data-collapsed={collapsed || undefined}><SidebarTooltips collapsed={collapsed}/><div className="sidebar-brand-row"><Link href="/dashboard" className="wordmark" aria-label="Learning dashboard"><Wordmark /></Link><Button variant="ghost" className="sidebar-toggle" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}</Button></div>{!collapsed && <div className={side.badge}><span className={side.badgeMark}><ShieldCheck size={15} /></span><span><b>Super admin</b><small>Control centre</small></span></div>}<nav aria-label="Super admin" className={side.nav}>{groups.map(group => <div key={group.label} className={side.group} role="group" aria-label={group.label}>
        {!collapsed && <span className={side.groupLabel}>{group.label}</span>}
        {group.items.filter(item => item.id !== "upload-learning" || isOwner).map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-label={label} title={collapsed ? label : undefined} className={side.item} aria-current={section === id ? "page" : undefined} onClick={() => { if (id === "notepad") setNotepadOpened(true); setSection(id); setQuery(""); }}>
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
    </header><main className={styles.main}><DashboardPageHeader eyebrow={section === "upload-learning" ? "Content · Publishing" : section === "notepad" ? "Writing workspace" : section === "suggestions" ? "People · Feedback" : "Application monitoring"} title={section === "overview" ? "Your application, at a glance." : sections.find(s => s.id === section)?.label} description={section === "upload-learning" ? "Publish your Notepad documents to any page of the Learning Dashboard, the landing page, sign in, sign up or this console, and add your own Learning Dashboard pages." : section === "notepad" ? "Write, format and export documents. Drafts autosave in this browser every two minutes." : section === "suggestions" ? "Listen, triage and keep contributors informed. Replies appear in each contributor’s private tracking view." : isCopilotPage(section) ? COPILOT_META[section].description : "Keep a pulse on your learners, subscriptions, and platform."} icon={section === "suggestions" ? <MessageSquarePlus/> : section === "upload-learning" ? <UploadCloud/> : <ShieldCheck/>}/>
      <LearningSlot surface="super_admin" page={section} section="top" />
      {section !== "suggestions" && !writing && <div className={styles.toolbar}><div className={styles.reportFilter}><Label htmlFor="admin-report-window">Reporting window</Label><AdminSelect id="admin-report-window" label="Reporting window" value={String(days)} onValueChange={value=>setDays(Number(value))} options={[{value:"1",label:"Last 24 hours"},{value:"7",label:"Last 7 days"},{value:"30",label:"Last 30 days"},{value:"90",label:"Last 90 days"}]} /></div><Input aria-label="Search displayed records" placeholder="Search displayed records…" value={query} onChange={e => setQuery(e.target.value)} /></div>}
      {accountError && <Alert variant="destructive" className={styles.error}><AlertDescription>{accountError}</AlertDescription></Alert>}
      {error && !writing && <Alert variant="destructive" className={styles.error}><AlertDescription>{error}{data && " Displaying the last successful snapshot."}</AlertDescription></Alert>}
      {!data && !error && !writing && <div className={styles.loading} role="status"><span>Loading application monitoring...</span><div className={styles.metrics}>{[0,1,2,3].map(id=><Skeleton key={id} className={styles.metricSkeleton}/>)}</div></div>}
      {isCopilotPage(section) && <SuperAdminCopilot key={section} page={section} title={sections.find(s => s.id === section)?.label ?? section} days={days} query={query} />}
      {notepadOpened && <div hidden={section !== "notepad"} style={{ minWidth: 0, maxWidth: "100%", width: "100%" }}><SuperAdminNotepad userId={userId} /></div>}
      {section === "upload-learning" && isOwner && <SuperAdminUploadLearning userId={userId} />}
      {section === "logs-health" && <SuperAdminLogsHealth />}
      {section === "billing" && <><SuperAdminFestiveSale /><SuperAdminBilling /></>}
      {section === "infra" && <SuperAdminInfrastructure />}
      {section === "activity" && <SuperAdminActivity days={days} query={query} />}
      {section === "insights" && <SuperAdminInsights days={days} />}
      {section === "suggestions" && <SuperAdminSuggestions />}
      {section === "support" && <SuperAdminLearnerSupport users={data?.users ?? []} />}
      {section === "queue" && <SuperAdminQueue />}
      {section === "transactions" && <SuperAdminTransactions />}
      {section === "security" && <SuperAdminSecurityCenter days={days} />}
      {section === "announcements" && <SuperAdminAnnouncements />}
      {section === "promotions" && <SuperAdminPromotions days={days} query={query} />}
      {(section === "overview" || section === "live") && <OverviewLive snapshot={data} onRefreshSnapshot={refreshQuietly} />}
      {["overview","live","analytics","moderation","security"].includes(section)&&<SuperAdminOperations section={section} days={days} query={query}/>}
      {section==="ai"&&<SuperAdminAi days={days} query={query}/>}
      {data && <>
        {["security", "content"].includes(section) && <SuperAdminTraces key={`${section}-${days}`} events={events} query={query} initialMode={section === "content" ? "audit" : "all"} />}
        {section === "overview" && <><div className={styles.metrics}><Metric label="Registered users" value={data.counts.users} note="All application accounts" /><Metric label="Active subscriptions" value={data.counts.activeSubscriptions} note="Active, unexpired paid memberships" /><Metric label="Estimated MRR" value={money(mrr)} note="Current plan prices · annual plans ÷ 12" /><Metric label="Learning documents" value={data.counts.documents} note={`${data.counts.failedDocuments} failed generations`} /></div><SuperAdminAiBriefing days={days} /><SuperAdminAskData days={days} /><div className={styles.summary}><Card><Activity size={22} /><h2>Platform pulse</h2><p>Database responded in {data.health.databaseMs} ms. {data.requests.errors} server errors across {data.requests.count} recorded API requests in this window.</p></Card><Card><CreditCard size={22} /><h2>Subscription business</h2><p>{data.recurring.monthly} monthly and {data.recurring.yearly} annual memberships. Estimated ARR {money(mrr * 12)}.</p></Card></div><SuperAdminNewUserLocations days={days} query={query} />{table("Recent application activity", events, ["created_at", "kind", "action", "resource", "actor_id", "status"])}</>}
        {section === "users" && <><SuperAdminUsers onOpenSupport={() => setSection("support")} /><SuperAdminAuthActivity sessions={data.sessions} logins={data.logins} users={data.users} query={query} days={days} generatedAt={data.generatedAt} refreshing={busy} onRefresh={refreshQuietly} /></>}
        {section === "billing" && <><div className={styles.metrics}><Metric label="Estimated MRR" value={money(mrr)} note="Based on configured prices, excludes tax/discount adjustments" /><Metric label="Estimated ARR" value={money(mrr * 12)} note="MRR × 12" /><Metric label="Razorpay" value={data.health.billingConfigured ? "Configured" : "Not configured"} note="Configuration status, not a gateway availability probe" /></div>{data.revenue.map((r, i) => <Card className={styles.panel} key={i}><h2>{display(r.currency)} transactions</h2><p>Gross captured: {money(Number(r.gross) / 100, String(r.currency || "INR"))} · Processed refunds: {money(Number(r.refunds) / 100, String(r.currency || "INR"))} · Failed payments: {display(r.failed)}</p></Card>)}{table("Subscriptions", data.subscriptions, ["user_id", "tier", "status", "current_period_end", "cancel_at_cycle_end", "synced_at"])}{table("Billing & invoices", data.billing, ["created_at", "event", "entity_id", "subscription_ref", "amount", "currency", "invoice_id"], "Signed Razorpay events recorded after migration. Amounts are in the smallest currency unit (paise for INR). Historical transactions need backfill; invoice references appear when supplied by Razorpay.")}</>}
        {section === "content" && <>{table("Database audit trail", events.filter(e => e.kind === "audit"), ["created_at", "actor_id", "resource", "action", "details"], "Changes to public application tables existing when migration 0018 is applied. Service/database writes identify the owner separately; the initiating user is unknown when no authenticated JWT is present.")}{table("Learning content", data.documents, ["title", "user_id", "status", "created_at"])}<Card className={styles.panel}><h2>Content moderation</h2><p>Learners can report content issues from dashboard pages. Review the queue in Moderation.</p><Button variant="outline" className={styles.refresh} onClick={()=>setSection("moderation")}>Open moderation</Button></Card></>}
        {section === "security" && <>{table("Auth security events", data.logins, ["created_at", "action", "actor_id", "ip_address"], "Includes failures when recorded by Supabase Auth. Repeated login failures should also be monitored in the provider's Auth logs.")}{table("Integration connections", data.integrations, ["user_id", "provider", "expires_at"], "Credentials are never included in monitoring responses.")}{table("API & export activity", events.filter(e => e.kind === "request" || e.kind === "export" || e.kind === "integration"), ["created_at", "kind", "actor_id", "resource", "action", "status", "duration_ms", "bytes"])}<Card className={styles.panel}><h2>Monitoring coverage</h2><p className={styles.note}>Tables show the most recent 200 records per feed; totals use the full database or selected time window. Monitoring starts after migration. Auth retention follows Supabase configuration. No automatic email alerts or sensitive-data exports are enabled.</p></Card></>}
      </>}
      <LearningSlot surface="super_admin" page={section} section="bottom" />
      <footer className={styles.adminFooter}>
        <div className={styles.adminFooterInner}>
          <span>© {new Date().getFullYear()} MasterClass Super Admin Console</span>
          <button type="button" className={styles.moveTopBtn} onClick={() => {
            const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
            document.querySelector<HTMLElement>("main, [role=main]")?.focus?.({ preventScroll: true });
          }}>
            Move to top <ArrowUp size={14} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </main></div></div>;
}
