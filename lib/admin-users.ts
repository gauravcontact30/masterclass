/** Users & access: shared, zod-free types and constants (the server module and the admin UI both import these). */
export const ADMIN_USERS_PAGE = 10;
export type AdminUserFilter = "all" | "super_admin" | "members" | "trial" | "free" | "banned" | "unconfirmed" | "new";
export const ADMIN_USER_FILTERS: { id: AdminUserFilter; label: string }[] = [
  { id: "all", label: "All" }, { id: "members", label: "Members" }, { id: "trial", label: "On trial" }, { id: "free", label: "No access" },
  { id: "super_admin", label: "Super admins" }, { id: "new", label: "New this week" }, { id: "unconfirmed", label: "Unconfirmed" }, { id: "banned", label: "Banned" },
];
export type AdminUser = {
  id: string; email: string; name: string; phone: string | null;
  createdAt: string; lastSignInAt: string | null; confirmedAt: string | null; bannedUntil: string | null;
  providers: string[]; role: string; superAdmin: boolean; owner: boolean;
  access: "free" | "trial" | "monthly" | "yearly"; trialEndsAt: string | null;
  subscription: { tier: string; status: string; periodEnd: string | null; cancelAtEnd: boolean } | null;
  language: string | null; credits: number;
  stats: { documents: number; completed: number; visits30d: number; lastSeen: string | null; location: string | null; device: string | null };
};
export type AdminUsersPage = {
  users: AdminUser[]; total: number; page: number; pages: number; generatedAt: string;
  counts: Record<AdminUserFilter, number>;
  summary: { total: number; confirmed: number; active7d: number; new7d: number; members: number; trial: number; superAdmins: number; banned: number };
};
export type AdminUserAction = "role" | "ban" | "unban" | "grant_super_admin" | "revoke_super_admin" | "profile" | "delete";
export const ADMIN_USER_ERRORS: Record<string, string> = {
  owner_protected: "The owner account and your own account can't be changed here.",
  active_subscription: "This account has an active paid membership. Cancel it in Billing before removing the account.",
  unconfirmed_email: "Super Admin can only be granted to an account with a confirmed email.",
  not_found: "That account no longer exists.",
  audit_unavailable: "The audit log is unavailable, so no change was made.",
  account_update_failed: "Supabase Auth rejected the change. Try again.",
  rate_limited: "Too many account changes. Wait a minute and try again.",
  forbidden: "Only a Super Admin can do this.",
};
