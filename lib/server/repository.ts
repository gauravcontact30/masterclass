import "server-only";
import { db, check } from "./db";
import { quota } from "./config";
import { DocumentRecord, entitlementTier, monthKey, Progress, Tier } from "@/lib/domain";
import { HttpError } from "./http";
export async function profile(id: string) {
  check(await db().from("profiles").upsert({ id }, { onConflict: "id", ignoreDuplicates: true }));
  return check(await db().from("profiles").select("id,language,credit_balance").eq("id", id).single());
}
export async function account(id: string) {
  const owner = await profile(id);
  const subscription = check(await db().from("subscriptions").select("*").eq("user_id", id).maybeSingle());
  const tier = entitlementTier(subscription as {tier: Tier; status: string; current_period_end: string | null; grace_until: string | null} | null);
  const usage = check(await db().from("usage_periods").select("used").eq("user_id", id).eq("period", monthKey()).maybeSingle());
  return { tier, used: usage?.used ?? 0, limit: quota(tier), subscription, creditBalance: owner?.credit_balance ?? 0 };
}
export async function ownedDocument(id: string, owner: string): Promise<DocumentRecord> {
  const item = check(await db().from("documents").select("*").eq("id", id).eq("user_id", owner).maybeSingle());
  if (!item) throw new HttpError(404, "not_found");
  return item as DocumentRecord;
}
export async function signedPath(path: string) {
  const result=check(await db().storage.from("generated-docs").createSignedUrl(path, 300));
  if(!result)throw new Error("Missing signed URL");return result.signedUrl;
}
export async function documents(id: string) {
  return check(await db().from("documents").select("id,user_id,title,request,status,created_at,error_code,page_titles").eq("user_id", id).order("created_at", { ascending: false }).limit(100)) as DocumentRecord[];
}
export async function progress(id: string) { return check(await db().from("learning_progress").select("document_id,page,completed,bookmarks,notes,updated_at").eq("user_id", id)) as Progress[]; }
