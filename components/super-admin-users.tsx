"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Ban, BookOpen, CalendarClock, CheckCircle2, Clock3, Copy, Crown, Ellipsis, Eye, Globe2, Hourglass, Languages, LifeBuoy, LoaderCircle, LogOut, Mail,
  MonitorSmartphone, Pencil, RefreshCw, Search, ShieldCheck, ShieldOff, Sparkles, Tag, Trash2, UserCheck, UserPlus, Users, X, type LucideIcon,
} from "lucide-react";
import { ADMIN_USER_ERRORS, ADMIN_USER_FILTERS, ADMIN_USERS_PAGE, type AdminUser, type AdminUserAction, type AdminUserFilter, type AdminUsersPage } from "@/lib/admin-users";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Pager } from "./super-admin-table";
import styles from "./super-admin-users.module.css";

type Detail = AdminUser & { recentPaths: { path: string; at: string }[] };
type Pending = { user: AdminUser; action: AdminUserAction | "revoke_sessions"; role?: string };
const ACCESS: Record<AdminUser["access"], { label: string; tone: string }> = {
  monthly: { label: "Pro monthly", tone: "green" }, yearly: { label: "Pro yearly", tone: "green" }, trial: { label: "Free trial", tone: "violet" }, free: { label: "No access", tone: "grey" },
};
const FILTER_ICON: Record<AdminUserFilter, LucideIcon> = { all: Users, members: Crown, trial: Hourglass, free: Tag, super_admin: ShieldCheck, new: UserPlus, unconfirmed: Mail, banned: Ban };
const ago = (iso: string | null) => {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(iso));
};
const date = (iso: string | null) => iso ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso)) : "—";
const initials = (user: AdminUser) => (user.name || user.email).split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "?";
const TONES = ["clay", "sage", "violet", "sky", "honey", "rose"];
const toneOf = (id: string) => TONES[[...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES.length];
const CONFIRM: Record<Pending["action"], { title: string; verb: string; danger?: boolean; help: string }> = {
  grant_super_admin: { title: "Grant Super Admin", verb: "Grant Super Admin", help: "They get full access to this Super Admin dashboard, every learner's data and these account controls." },
  revoke_super_admin: { title: "Revoke Super Admin", verb: "Revoke access", help: "They keep their learner account and membership, but lose the Super Admin dashboard." },
  ban: { title: "Ban account", verb: "Ban account", danger: true, help: "They can no longer sign in. Existing sessions end when they next refresh." },
  unban: { title: "Unban account", verb: "Unban account", help: "They can sign in again." },
  role: { title: "Change role label", verb: "Save role", help: "Role labels are audited. They do not grant Super Admin access or a membership." },
  delete: { title: "Remove account", verb: "Remove permanently", danger: true, help: "Deletes the sign-in account from Supabase Auth. Their saved notes and history stay in the database but can no longer be reached. This cannot be undone." },
  revoke_sessions: { title: "Sign out everywhere", verb: "Sign out everywhere", help: "Ends every stored session; they must sign in again on each device." },
  profile: { title: "Edit profile", verb: "Save profile", help: "" },
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(ADMIN_USER_ERRORS[(body as { error?: string }).error ?? ""] ?? (res.status === 503 && (body as { error?: string }).error === "migration_required" ? "A database migration is pending." : "The request failed. Try again."));
  return body as T;
}

/**
 * Users & access: the live account directory from Supabase Auth, joined with membership, trial, learning and
 * activity data. Each row has a ⋯ menu to view or edit the profile, grant or revoke Super Admin, change the role
 * label, ban, sign out everywhere or remove the account; every change asks for a reason and is audited.
 */
export function SuperAdminUsers({ onOpenSupport }: Readonly<{ onOpenSupport?: () => void }>) {
  const [data, setData] = useState<AdminUsersPage | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AdminUserFilter>("all");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState("");

  // Bumping `nonce` reloads the same page; "loading" means the data on screen isn't for the request asked for yet.
  const [nonce, setNonce] = useState(0);
  const key = `${page}|${search}|${filter}|${nonce}`;
  const [loadedKey, setLoadedKey] = useState("");
  const loading = loadedKey !== key;
  const load = useCallback(() => setNonce(n => n + 1), []);
  useEffect(() => {
    let alive = true;
    request<AdminUsersPage>(`/api/super-admin/users?${new URLSearchParams({ page: String(page), q: search, filter })}`)
      .then(result => { if (alive) { setData(result); setError(""); } }, e => { if (alive) setError((e as Error).message); })
      .finally(() => { if (alive) setLoadedKey(key); });
    return () => { alive = false; };
  }, [page, search, filter, key]);
  // Search as you type, a beat after the last key.
  useEffect(() => { const t = window.setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300); return () => window.clearTimeout(t); }, [query]);

  const openProfile = async (user: AdminUser) => {
    setDetail({ ...user, recentPaths: [] }); setDetailOpen(true);
    try { setDetail((await request<{ user: Detail }>(`/api/super-admin/users?id=${user.id}`)).user); } catch { /* the row data stays on screen */ }
  };
  const copy = (value: string, label: string) => { void navigator.clipboard?.writeText(value).then(() => setNotice(`${label} copied.`), () => setNotice("Copy failed.")); };

  const s = data?.summary;
  const tiles: { label: string; value: number | undefined; note: string; icon: LucideIcon; tone: string; filter?: AdminUserFilter }[] = [
    { label: "Accounts", value: s?.total, note: `${s?.confirmed ?? 0} confirmed`, icon: Users, tone: "clay", filter: "all" },
    { label: "Active · 7 days", value: s?.active7d, note: "Signed in this week", icon: UserCheck, tone: "sage" },
    { label: "New · 7 days", value: s?.new7d, note: "Joined this week", icon: UserPlus, tone: "sky", filter: "new" },
    { label: "Members", value: s?.members, note: "Paid monthly or yearly", icon: Crown, tone: "honey", filter: "members" },
    { label: "On free trial", value: s?.trial, note: "Within their first day", icon: Hourglass, tone: "violet", filter: "trial" },
    { label: "Super admins", value: s?.superAdmins, note: "Owner included", icon: ShieldCheck, tone: "rose", filter: "super_admin" },
  ];

  return <div className={styles.users}>
    <header className={styles.head}>
      <div><h2><Users size={20} aria-hidden="true" />Users &amp; access</h2><p>Every account in Supabase Auth, live, with membership, trial, learning and activity. Changes are audited.</p></div>
      <button type="button" className={styles.refresh} onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? styles.spin : undefined} aria-hidden="true" />Refresh</button>
    </header>

    <div className={styles.tiles}>{tiles.map(tile => <button key={tile.label} type="button" className={styles.tile} data-tone={tile.tone} aria-pressed={!!tile.filter && filter === tile.filter && tile.filter !== "all"} disabled={!tile.filter}
      onClick={() => { if (tile.filter) { setFilter(tile.filter); setPage(1); } }}>
      <span className={styles.tileIcon}><tile.icon size={17} aria-hidden="true" /></span><span className={styles.tileLabel}>{tile.label}</span>
      <strong>{tile.value ?? "—"}</strong><small>{tile.note}</small>
    </button>)}</div>

    <div className={styles.toolbar}>
      <div className={styles.search}>
        <Search size={16} aria-hidden="true" />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by email, name, user ID or role…" aria-label="Search users" />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}
      </div>
      <div className={styles.chips} role="group" aria-label="Filter users">{ADMIN_USER_FILTERS.map(f => { const Icon = FILTER_ICON[f.id]; return <button key={f.id} type="button" className={styles.chip} aria-pressed={filter === f.id} onClick={() => { setFilter(f.id); setPage(1); }}>
        <Icon size={14} aria-hidden="true" />{f.label}<small>{data?.counts[f.id] ?? "·"}</small></button>; })}</div>
    </div>
    {notice && <p className={styles.notice} role="status"><CheckCircle2 size={15} aria-hidden="true" />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss"><X size={13} /></button></p>}
    {error && <p className={styles.error} role="alert">{error} <button type="button" onClick={() => void load()}>Try again</button></p>}

    <div className={styles.tableWrap} aria-busy={loading}>
      <table className={styles.table}>
        <thead><tr><th>User</th><th>Access</th><th>Learning</th><th>Last seen</th><th>Joined</th><th><span className={styles.srOnly}>Actions</span></th></tr></thead>
        <tbody>{(data?.users ?? []).map(user => <tr key={user.id} data-banned={user.bannedUntil ? "" : undefined}>
          <td><div className={styles.person}>
            <span className={styles.avatar} data-tone={toneOf(user.id)}>{initials(user)}</span>
            <span className={styles.who}>
              <button type="button" className={styles.nameButton} onClick={() => void openProfile(user)}>{user.name || user.email.split("@")[0]}</button>
              <small>{user.email}</small>
              <span className={styles.badges}>
                {user.owner && <b data-tone="clay"><Crown size={11} aria-hidden="true" />Owner</b>}
                {user.superAdmin && !user.owner && <b data-tone="rose"><ShieldCheck size={11} aria-hidden="true" />Super admin</b>}
                {user.role !== "viewer" && <b data-tone="sky">{user.role}</b>}
                {!user.confirmedAt && <b data-tone="honey">Unconfirmed</b>}
                {user.bannedUntil && <b data-tone="red"><Ban size={11} aria-hidden="true" />Banned</b>}
              </span>
            </span>
          </div></td>
          <td><span className={styles.access} data-tone={ACCESS[user.access].tone}>{ACCESS[user.access].label}</span>
            <small className={styles.sub}>{user.access === "trial" && user.trialEndsAt ? `ends ${ago(user.trialEndsAt).replace(" ago", "")}`.replace("ends just now", "ending now") : user.subscription ? `${user.subscription.status}${user.subscription.periodEnd ? ` · until ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(user.subscription.periodEnd))}` : ""}` : user.trialEndsAt ? "trial used" : ""}</small></td>
          <td><span className={styles.stat}><BookOpen size={13} aria-hidden="true" />{user.stats.documents} notes</span><small className={styles.sub}>{user.stats.completed} lessons done · {user.stats.visits30d} visits / 30 d</small></td>
          <td><span className={styles.stat}><Clock3 size={13} aria-hidden="true" />{ago(user.stats.lastSeen ?? user.lastSignInAt)}</span><small className={styles.sub}>{user.stats.location ?? (user.lastSignInAt ? `signed in ${ago(user.lastSignInAt)}` : "never signed in")}</small></td>
          <td><span className={styles.stat}>{ago(user.createdAt)}</span><small className={styles.sub}>{user.providers.join(", ") || "email"}</small></td>
          <td className={styles.actionsCell}><DropdownMenu>
            <DropdownMenuTrigger className={styles.more} aria-label={`Actions for ${user.email}`}><Ellipsis size={17} /></DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end">
              <DropdownMenuGroup><DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => void openProfile(user)}><Eye size={15} />View profile</DropdownMenuItem>
                <DropdownMenuItem disabled={user.owner} onClick={() => setEditing(user)}><Pencil size={15} />Edit profile</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup><DropdownMenuLabel>Access</DropdownMenuLabel>
                {user.superAdmin
                  ? <DropdownMenuItem disabled={user.owner} onClick={() => setPending({ user, action: "revoke_super_admin" })}><ShieldOff size={15} />Revoke Super Admin</DropdownMenuItem>
                  : <DropdownMenuItem disabled={!user.confirmedAt || !!user.bannedUntil} onClick={() => setPending({ user, action: "grant_super_admin" })}><ShieldCheck size={15} />Make Super Admin</DropdownMenuItem>}
                {(["viewer", "editor", "admin"] as const).filter(r => r !== user.role).map(role => <DropdownMenuItem key={role} disabled={user.owner} onClick={() => setPending({ user, action: "role", role })}><Tag size={15} />Set role: {role}</DropdownMenuItem>)}
                <DropdownMenuItem disabled={user.owner} onClick={() => setPending({ user, action: "revoke_sessions" })}><LogOut size={15} />Sign out everywhere</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => copy(user.email, "Email")}><Mail size={15} />Copy email</DropdownMenuItem>
                <DropdownMenuItem onClick={() => copy(user.id, "User ID")}><Copy size={15} />Copy user ID</DropdownMenuItem>
                {onOpenSupport && <DropdownMenuItem onClick={onOpenSupport}><LifeBuoy size={15} />Open learner support</DropdownMenuItem>}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {user.bannedUntil
                  ? <DropdownMenuItem disabled={user.owner} onClick={() => setPending({ user, action: "unban" })}><UserCheck size={15} />Unban account</DropdownMenuItem>
                  : <DropdownMenuItem disabled={user.owner} variant="destructive" onClick={() => setPending({ user, action: "ban" })}><Ban size={15} />Ban account</DropdownMenuItem>}
                <DropdownMenuItem disabled={user.owner} variant="destructive" onClick={() => setPending({ user, action: "delete" })}><Trash2 size={15} />Remove account</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu></td>
        </tr>)}</tbody>
      </table>
      {loading && !data && <p className={styles.empty}><LoaderCircle size={18} className={styles.spin} aria-hidden="true" />Loading accounts…</p>}
      {data && !data.users.length && <p className={styles.empty}><Search size={18} aria-hidden="true" />No accounts match. <button type="button" onClick={() => { setQuery(""); setFilter("all"); }}>Clear search and filters</button></p>}
    </div>
    {data && <Pager page={data.page} pages={data.pages} total={data.total} size={ADMIN_USERS_PAGE} onPage={setPage} />}
    {data && <p className={styles.footnote}>Live from Supabase Auth · updated {ago(data.generatedAt)}. Last seen and location come from signed-in page views (bots excluded).</p>}

    <ProfileDialog user={detail} open={detailOpen} onOpenChange={setDetailOpen} onEdit={user => { setDetailOpen(false); setEditing(user); }} />
    <EditDialog key={editing?.id ?? "none"} user={editing} onClose={() => setEditing(null)} onSaved={msg => { setEditing(null); setNotice(msg); void load(); }} />
    <ConfirmDialog key={pending ? `${pending.user.id}:${pending.action}:${pending.role ?? ""}` : "none"} pending={pending} onClose={() => setPending(null)} onDone={msg => { setPending(null); setNotice(msg); void load(); }} />
  </div>;
}

function ProfileDialog({ user, open, onOpenChange, onEdit }: { user: Detail | null; open: boolean; onOpenChange: (open: boolean) => void; onEdit: (user: AdminUser) => void }) {
  if (!user) return null;
  const rows: [LucideIcon, string, string][] = [
    [Mail, "Email", `${user.email}${user.confirmedAt ? " · confirmed" : " · not confirmed"}`], [Tag, "User ID", user.id],
    [CalendarClock, "Joined", date(user.createdAt)], [Clock3, "Last sign-in", date(user.lastSignInAt)],
    [Crown, "Access", `${ACCESS[user.access].label}${user.subscription ? ` · ${user.subscription.tier} ${user.subscription.status}${user.subscription.cancelAtEnd ? " (cancels at period end)" : ""}` : ""}`],
    [Hourglass, "Trial", user.trialEndsAt ? `${user.access === "trial" ? "ends" : "ended"} ${date(user.trialEndsAt)}` : "—"],
    [ShieldCheck, "Admin", user.owner ? "Owner (Super Admin)" : user.superAdmin ? "Super Admin" : `Role label: ${user.role}`],
    [Globe2, "Location", user.stats.location ?? "—"], [MonitorSmartphone, "Device", user.stats.device ?? "—"],
    [BookOpen, "Learning", `${user.stats.documents} notes · ${user.stats.completed} lessons completed · ${user.credits} download credits`],
    [Sparkles, "Activity", `${user.stats.visits30d} page views in 30 days · last seen ${ago(user.stats.lastSeen)}`],
    [Languages, "Language", user.language === "hi" ? "हिन्दी" : user.language === "en" ? "English" : "—"],
  ];
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <div className={styles.profileHead}><span className={styles.avatar} data-tone={toneOf(user.id)} data-size="lg">{initials(user)}</span>
          <div><DialogTitle>{user.name || user.email}</DialogTitle><DialogDescription>{user.providers.join(", ") || "email"} sign-in{user.bannedUntil ? " · banned" : ""}</DialogDescription></div></div>
      </DialogHeader>
      <dl className={styles.profile}>{rows.map(([Icon, label, value]) => <div key={label}><dt><Icon size={14} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>)}</dl>
      {user.recentPaths.length > 0 && <div className={styles.recent}><h4>Recent pages</h4><ul>{user.recentPaths.map((p, i) => <li key={`${p.path}-${i}`}><code>{p.path}</code><span>{ago(p.at)}</span></li>)}</ul></div>}
      {!user.owner && <div className={styles.dialogActions}><Button variant="outline" onClick={() => onEdit(user)}><Pencil size={15} />Edit profile</Button></div>}
    </DialogContent>
  </Dialog>;
}

function EditDialog({ user, onClose, onSaved }: { user: AdminUser | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!user) return null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await request("/api/super-admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, action: "profile", name: String(form.get("name") ?? ""), language: String(form.get("language") ?? "en"), reason: String(form.get("reason") ?? "") }) });
      onSaved(`Profile updated for ${user.email}.`);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Edit profile</DialogTitle><DialogDescription>{user.email}</DialogDescription></DialogHeader>
      <form className={styles.form} onSubmit={submit}>
        <label>Display name<Input name="name" defaultValue={user.name} required maxLength={80} /></label>
        <label>App language<select name="language" defaultValue={user.language ?? "en"} className={styles.select}><option value="en">English</option><option value="hi">हिन्दी</option></select></label>
        <label>Reason (saved in the audit log)<Textarea name="reason" required minLength={5} maxLength={500} placeholder="Why does this profile need changing?" /></label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.dialogActions}><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

function ConfirmDialog({ pending, onClose, onDone }: { pending: Pending | null; onClose: () => void; onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [typed, setTyped] = useState("");
  if (!pending) return null;
  const meta = CONFIRM[pending.action];
  const needsTyping = pending.action === "delete" || pending.action === "grant_super_admin";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
    setBusy(true); setError("");
    try {
      if (pending.action === "revoke_sessions") await request("/api/super-admin/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke_sessions", user: pending.user.id, reason }) });
      else await request("/api/super-admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pending.user.id, action: pending.action, ...(pending.action === "role" ? { role: pending.role } : {}), reason }) });
      onDone(`${meta.title}: done for ${pending.user.email}.`);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open) { setTyped(""); onClose(); } }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>{meta.title}{pending.role ? `: ${pending.role}` : ""}</DialogTitle><DialogDescription>{pending.user.email}</DialogDescription></DialogHeader>
      <form className={styles.form} onSubmit={submit}>
        <p className={styles.help} data-danger={meta.danger || undefined}>{meta.help}</p>
        <label>Reason (saved in the audit log)<Textarea name="reason" required minLength={5} maxLength={500} placeholder="Explain why" /></label>
        {needsTyping && <label>Type the email to confirm<Input value={typed} onChange={e => setTyped(e.target.value)} placeholder={pending.user.email} autoComplete="off" /></label>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.dialogActions}><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={meta.danger ? "destructive" : "default"} disabled={busy || (needsTyping && typed.trim().toLowerCase() !== pending.user.email.toLowerCase())}>{busy ? "Working…" : meta.verb}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
