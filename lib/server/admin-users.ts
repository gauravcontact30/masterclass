import "server-only";
import type { User } from "@supabase/supabase-js";
import { db } from "./db";
import { trialHours } from "./config";
import { entitlementTier, trialEndsAt, type Tier } from "@/lib/domain";
import { isOwnerUser, isSuperAdminUser } from "@/lib/study/preparations";
import { ADMIN_USER_FILTERS, ADMIN_USERS_PAGE, type AdminUser, type AdminUserFilter, type AdminUsersPage } from "@/lib/admin-users";

const DAY = 86_400_000;
// The directory reads every Auth account in pages of 1000 (Supabase's maximum); enough for search and filters here.
const AUTH_PAGE = 1000, AUTH_PAGES_MAX = 20;

async function allAuthUsers(): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; page <= AUTH_PAGES_MAX; page++) {
    const { data, error } = await db().auth.admin.listUsers({ page, perPage: AUTH_PAGE });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < AUTH_PAGE) break;
  }
  return users;
}

const banned = (user: User) => !!user.banned_until && Date.parse(user.banned_until) > Date.now();
const name = (user: User) => String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();

function base(user: User): AdminUser {
  return {
    id: user.id, email: user.email ?? "", name: name(user), phone: user.phone || null,
    createdAt: user.created_at, lastSignInAt: user.last_sign_in_at ?? null, confirmedAt: user.email_confirmed_at ?? null,
    bannedUntil: banned(user) ? user.banned_until ?? null : null,
    providers: [...new Set((user.identities ?? []).map(identity => identity.provider))],
    role: String(user.app_metadata?.role ?? "viewer"), superAdmin: isSuperAdminUser(user), owner: isOwnerUser(user),
    access: "free", trialEndsAt: null, subscription: null, language: null, credits: 0,
    stats: { documents: 0, completed: 0, visits30d: 0, lastSeen: null, location: null, device: null },
  };
}

function matchesFilter(user: AdminUser, filter: AdminUserFilter) {
  switch (filter) {
    case "super_admin": return user.superAdmin;
    case "members": return user.access === "monthly" || user.access === "yearly";
    case "trial": return user.access === "trial";
    case "free": return user.access === "free";
    case "banned": return !!user.bannedUntil;
    case "unconfirmed": return !user.confirmedAt;
    case "new": return Date.now() - Date.parse(user.createdAt) < 7 * DAY;
    default: return true;
  }
}

/** Profiles and subscriptions for every account (small tables), so access filters work across the whole directory. */
async function withAccess(users: AdminUser[]) {
  const ids = users.map(user => user.id);
  const [profiles, subscriptions] = await Promise.all([
    db().from("profiles").select("id,name,language,credit_balance,created_at").in("id", ids),
    db().from("subscriptions").select("user_id,tier,status,current_period_end,grace_until,cancel_at_cycle_end").in("user_id", ids),
  ]);
  const profileOf = new Map((profiles.data ?? []).map(row => [String(row.id), row]));
  const subOf = new Map((subscriptions.data ?? []).map(row => [String(row.user_id), row]));
  const hours = trialHours();
  for (const user of users) {
    const profile = profileOf.get(user.id), sub = subOf.get(user.id);
    if (profile?.name && !user.name) user.name = String(profile.name);
    user.language = profile?.language ?? null;
    user.credits = Number(profile?.credit_balance ?? 0);
    const paid = entitlementTier(sub ? { tier: sub.tier as Tier, status: String(sub.status), current_period_end: sub.current_period_end, grace_until: sub.grace_until } : null);
    // The trial window starts at the first sign-in (profile creation), as in account().
    const ends = paid === "free" ? trialEndsAt(profile?.created_at ?? null, hours) : null;
    user.access = paid !== "free" ? paid : ends && Date.parse(ends) > Date.now() ? "trial" : "free";
    user.trialEndsAt = ends;
    user.subscription = sub ? { tier: String(sub.tier), status: String(sub.status), periodEnd: sub.current_period_end ?? null, cancelAtEnd: !!sub.cancel_at_cycle_end } : null;
  }
}

/** Learning and activity numbers for the rows on screen only. */
async function withStats(users: AdminUser[]) {
  if (!users.length) return;
  const ids = users.map(user => user.id), since = new Date(Date.now() - 30 * DAY).toISOString();
  const [documents, progress, visits] = await Promise.all([
    db().from("documents").select("user_id").in("user_id", ids).limit(5000),
    db().from("learning_progress").select("user_id,completed").in("user_id", ids).limit(5000),
    db().from("site_visits").select("user_id,created_at,city,country,device,browser").in("user_id", ids).eq("event", "page_view").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
  ]);
  for (const user of users) {
    user.stats.documents = (documents.data ?? []).filter(row => row.user_id === user.id).length;
    user.stats.completed = (progress.data ?? []).filter(row => row.user_id === user.id && row.completed).length;
    const mine = (visits.data ?? []).filter(row => row.user_id === user.id);
    user.stats.visits30d = mine.length;
    const latest = mine[0];
    if (latest) {
      user.stats.lastSeen = latest.created_at;
      user.stats.location = [latest.city, latest.country].filter(Boolean).join(", ") || null;
      user.stats.device = [latest.device, latest.browser].filter(Boolean).join(" · ") || null;
    }
  }
}

/** One page of the live user directory, with summary counts over every account. */
export async function adminUsersPage({ page = 1, query = "", filter = "all" }: { page?: number; query?: string; filter?: AdminUserFilter }): Promise<AdminUsersPage> {
  const all = (await allAuthUsers()).map(base);
  await withAccess(all);
  const now = Date.now();
  const counts = Object.fromEntries(ADMIN_USER_FILTERS.map(f => [f.id, all.filter(user => matchesFilter(user, f.id)).length])) as Record<AdminUserFilter, number>;
  const summary = {
    total: all.length, confirmed: all.filter(u => u.confirmedAt).length,
    active7d: all.filter(u => u.lastSignInAt && now - Date.parse(u.lastSignInAt) < 7 * DAY).length,
    new7d: counts.new, members: counts.members, trial: counts.trial, superAdmins: counts.super_admin, banned: counts.banned,
  };
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matching = all
    .filter(user => matchesFilter(user, filter))
    .filter(user => !terms.length || terms.every(term => `${user.email} ${user.name} ${user.id} ${user.role} ${user.access}`.toLowerCase().includes(term)))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const pages = Math.max(1, Math.ceil(matching.length / ADMIN_USERS_PAGE));
  const current = Math.min(Math.max(1, page), pages);
  const rows = matching.slice((current - 1) * ADMIN_USERS_PAGE, current * ADMIN_USERS_PAGE);
  await withStats(rows);
  return { users: rows, total: matching.length, page: current, pages, counts, summary, generatedAt: new Date().toISOString() };
}

/** The full profile of one account, for the View profile dialog. */
export async function adminUserDetail(id: string): Promise<AdminUser & { recentPaths: { path: string; at: string }[] }> {
  const { data, error } = await db().auth.admin.getUserById(id);
  if (error || !data.user) throw Object.assign(new Error("not_found"), { status: 404 });
  const user = base(data.user);
  await withAccess([user]);
  await withStats([user]);
  const recent = await db().from("site_visits").select("path,created_at").eq("user_id", id).eq("event", "page_view").order("created_at", { ascending: false }).limit(8);
  return { ...user, recentPaths: (recent.data ?? []).map(row => ({ path: String(row.path), at: String(row.created_at) })) };
}
