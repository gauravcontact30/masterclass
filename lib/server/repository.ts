import "server-only";
import { db, check } from "./db";
import { quota, trialHours } from "./config";
import { DOCUMENT_FORMAT, DocumentRecord, entitlementTier, monthKey, Progress, Tier, trialEndsAt } from "@/lib/domain";
import { HttpError } from "./http";
import { preparationAccess } from "./preparations";
import { canReadTechnology } from "@/lib/study/preparations";
export async function profile(id: string) {
  check(await db().from("profiles").upsert({ id }, { onConflict: "id", ignoreDuplicates: true }));
  return check(await db().from("profiles").select("id,name,language,credit_balance,created_at").eq("id", id).single());
}
export async function account(id: string) {
  const owner = await profile(id);
  const subscription = check(await db().from("subscriptions").select("*").eq("user_id", id).maybeSingle());
  const paidTier = entitlementTier(subscription as {tier: Tier; status: string; current_period_end: string | null; grace_until: string | null} | null);
  // New accounts get full learning access for a day; afterwards the dashboard asks for a subscription.
  const trialEnds = trialEndsAt(owner?.created_at, trialHours());
  const trialActive = paidTier === "free" && !!trialEnds && Date.parse(trialEnds) > Date.now();
  const tier: Tier = trialActive ? "trial" : paidTier;
  const usage = check(await db().from("usage_periods").select("used").eq("user_id", id).eq("period", monthKey()).maybeSingle());
  return { tier, paidTier, trialEndsAt: paidTier === "free" ? trialEnds : null, used: usage?.used ?? 0, limit: quota(tier), subscription, creditBalance: owner?.credit_balance ?? 0 };
}
export async function ownedDocument(id: string, owner: string, requireSubscription = true): Promise<DocumentRecord> {
  const item = check(await db().from("documents").select("*").eq("id", id).eq("user_id", owner).maybeSingle());
  if (!item) throw new HttpError(404, "not_found");
  const access = await preparationAccess(owner);
  if (!canReadTechnology(access, item.request.technologyId)) throw new HttpError(404, "not_found");
  if (requireSubscription && !access.isSuperAdmin && (await account(owner)).tier === "free") throw new HttpError(402, "subscription_required");
  return item as DocumentRecord;
}
/** The learner's notes, newest first. Documents in the retired PDF/PPTX formats are never listed. */
export async function documents(id: string) {
  return check(await db().from("documents").select("id,user_id,title,request,status,created_at,error_code,page_titles").eq("user_id", id).eq("request->>format", DOCUMENT_FORMAT).order("created_at", { ascending: false }).limit(100)) as DocumentRecord[];
}
export async function progress(id: string) { return check(await db().from("learning_progress").select("document_id,page,completed,bookmarks,notes,updated_at").eq("user_id", id)) as Progress[]; }
