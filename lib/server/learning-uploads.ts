import "server-only";
import { z } from "zod";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { db } from "./db";
import { currentUser } from "./auth";
import { account } from "./repository";
import { HttpError } from "./http";
import { isOwnerUser, isSuperAdminUser } from "@/lib/study/preparations";
import { isSafeCtaUrl, slugify, type LearningBlock, type LearningPage, type LearningRevision, type LearningSurface, type LearningUpload } from "@/lib/learning-uploads";

/*
 * Storage for Upload Learning. Only the owner account (OWNER_EMAIL) may write; anyone may read what is published,
 * filtered here by schedule and audience (device and language are applied in the browser). Every edit that
 * changes an upload's content keeps the previous content as a revision. Until migration 0029 is applied the
 * reads return nothing and the writes answer `migration_required`, so no page breaks before the tables exist.
 */

/** The owner, and only the owner: other Super Admins can see the dashboard but cannot publish learning content. */
export async function requireOwner() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "signin_required");
  if (!isOwnerUser(user)) throw new HttpError(403, "owner_only");
  return user;
}

const LEARNING_TAG = "learning-content";
const missing = (error: { code?: string; message: string }) => error.code === "42P01" || error.code === "42703" || error.code === "PGRST205" || error.code === "PGRST202" || /could not find the (table|function)|column .* does not exist/i.test(error.message);
function rows<T>({ data, error }: { data: T | null; error: { code?: string; message: string } | null }): T {
  if (error) { if (missing(error)) throw new HttpError(503, "migration_required"); throw new Error(error.message); }
  return data as T;
}

type UploadRow = {
  id: string; title: string; summary: string | null; html: string; background: string; source_file_id: string | null; surface: LearningSurface; page: string; section: string;
  layout: LearningUpload["layout"]; tone: LearningUpload["tone"]; show_title: boolean; position: number; pinned: boolean; audience: LearningUpload["audience"];
  device: LearningUpload["device"]; language: LearningUpload["language"]; cta_label: string | null; cta_url: string | null; tags: string[] | null;
  status: LearningUpload["status"]; starts_at: string | null; ends_at: string | null; views: number | string; version: number; created_at: string; updated_at: string;
};
type PageRow = { id: string; slug: string; title: string; description: string | null; icon: string; position: number; visible: boolean; created_at: string; updated_at: string };
type RevisionRow = { id: string; upload_id: string; version: number; title: string; summary: string | null; html: string; background: string; created_at: string };

const toBlock = (row: UploadRow): LearningBlock => ({
  id: row.id, title: row.title, summary: row.summary, html: row.html, background: row.background, surface: row.surface, page: row.page, section: row.section,
  layout: row.layout, tone: row.tone, position: row.position, showTitle: row.show_title, pinned: row.pinned, device: row.device, language: row.language,
  ctaLabel: row.cta_label, ctaUrl: row.cta_url, tags: row.tags ?? [],
});
const toUpload = (row: UploadRow): LearningUpload => ({
  ...toBlock(row), status: row.status, audience: row.audience, startsAt: row.starts_at, endsAt: row.ends_at, sourceFileId: row.source_file_id,
  views: Number(row.views) || 0, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at,
});
const toPage = (row: PageRow): LearningPage => ({ id: row.id, slug: row.slug, title: row.title, description: row.description, icon: row.icon, position: row.position, visible: row.visible, createdAt: row.created_at, updatedAt: row.updated_at });
const toRevision = (row: RevisionRow): LearningRevision => ({ id: row.id, uploadId: row.upload_id, version: row.version, title: row.title, summary: row.summary, html: row.html, background: row.background, createdAt: row.created_at });

/** Who is looking, for audience rules: signed out, signed in, or a member (paid, trial or admin). */
async function viewer(): Promise<"signed_out" | "signed_in" | "member"> {
  const user = await currentUser().catch(() => null);
  if (!user) return "signed_out";
  if (isSuperAdminUser(user)) return "member";
  const tier = await account(user.id).then(a => a.tier, () => "free");
  return tier === "free" ? "signed_in" : "member";
}

/**
 * Published rows for a page, shared by every visitor and cached (tag "learning-content", cleared on every owner
 * write), so a page view costs no database round trip. Schedule and audience are applied per request below.
 */
async function publishedRows(surface: LearningSurface, pages: string[]): Promise<UploadRow[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag(LEARNING_TAG);
  const result = await db().from("learning_uploads").select("*").eq("surface", surface).in("page", pages).eq("status", "published")
    .order("pinned", { ascending: false }).order("position").order("created_at");
  if (result.error) { if (missing(result.error)) return []; throw new Error(result.error.message); }
  return result.data as UploadRow[];
}
/** Clears the cached public content after the owner changes anything, on every server instance. */
const published = () => revalidateTag(LEARNING_TAG, { expire: 0 });

/** Published uploads for one page of one surface, pinned first then in order, that the current visitor may see right now. */
export async function publishedBlocks(surface: LearningSurface, page: string): Promise<LearningBlock[]> {
  // Content placed on the Super Admin console is for admins only, whatever the public endpoint is asked for.
  if (surface === "super_admin" && !isSuperAdminUser(await currentUser().catch(() => null))) return [];
  const rows = await publishedRows(surface, surface === "super_admin" ? [page, "all"] : [page]);
  if (!rows.length) return [];
  const now = Date.now();
  // Only look up who is visiting (an auth and an account read) when some upload is targeted.
  const who = rows.some(row => row.audience !== "everyone") ? await viewer() : "signed_out";
  return rows.filter(row => (!row.starts_at || Date.parse(row.starts_at) <= now) && (!row.ends_at || Date.parse(row.ends_at) > now)
    && (row.audience === "everyone" || (row.audience === "signed_out" && who === "signed_out") || (row.audience === "signed_in" && who !== "signed_out") || (row.audience === "members" && who === "member")))
    .map(toBlock);
}
/** Counts one view of a published upload (atomic, in the database). */
export async function recordView(id: string) {
  const result = await db().rpc("learning_upload_view", { p_id: id });
  if (result.error && !missing(result.error)) throw new Error(result.error.message);
}

/** Custom Learning Dashboard pages for the sidebar (visible only), or every page for the owner. */
export async function learningPages(all = false): Promise<LearningPage[]> {
  let query = db().from("learning_pages").select("*").order("position").order("title");
  if (!all) query = query.eq("visible", true);
  const result = await query;
  // The sidebar quietly shows no custom pages before the migration; the owner's admin page is told to apply it.
  if (result.error && missing(result.error) && !all) return [];
  return (rows(result) as PageRow[]).map(toPage);
}
export async function learningPage(slug: string): Promise<LearningPage | null> {
  const result = await db().from("learning_pages").select("*").eq("slug", slug).eq("visible", true).maybeSingle();
  if (result.error) { if (missing(result.error)) return null; throw new Error(result.error.message); }
  return result.data ? toPage(result.data as PageRow) : null;
}

// ----- Owner writes -----
const isoOrNull = z.string().datetime({ offset: true }).nullable().optional();
/** The fields of an upload; PATCH validates the sent subset of these. */
export const uploadFields = z.object({
  title: z.string().trim().min(1).max(160), summary: z.string().trim().max(400).nullable().optional(),
  html: z.string().min(1).max(4_000_000), background: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#ffffff"), sourceFileId: z.string().max(80).nullable().optional(),
  surface: z.enum(["dashboard", "landing", "sign_in", "sign_up", "super_admin"]), page: z.string().trim().min(1).max(80), section: z.string().trim().min(1).max(40),
  layout: z.enum(["card", "banner", "full", "accordion"]).default("card"), tone: z.enum(["ivory", "sky", "mint", "lavender", "rose", "peach", "butter"]).default("ivory"),
  showTitle: z.boolean().default(true), position: z.number().int().min(-1000).max(1000).default(0), pinned: z.boolean().default(false),
  audience: z.enum(["everyone", "signed_out", "signed_in", "members"]).default("everyone"), device: z.enum(["all", "desktop", "mobile"]).default("all"),
  language: z.enum(["all", "en", "hi"]).default("all"),
  ctaLabel: z.string().trim().max(40).nullable().optional(), ctaUrl: z.string().trim().max(500).refine(isSafeCtaUrl, "unsafe_url").nullable().optional().or(z.literal("").transform(() => null)),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10).default([]),
  status: z.enum(["draft", "published", "hidden"]).default("draft"), startsAt: isoOrNull, endsAt: isoOrNull,
});
export const uploadInput = uploadFields.refine(value => !value.startsAt || !value.endsAt || Date.parse(value.endsAt) > Date.parse(value.startsAt), { message: "ends_before_start", path: ["endsAt"] });
export type UploadInput = z.infer<typeof uploadInput>;
const toRow = (input: Partial<UploadInput>) => Object.fromEntries(Object.entries({
  title: input.title, summary: input.summary, html: input.html, background: input.background, source_file_id: input.sourceFileId, surface: input.surface, page: input.page,
  section: input.section, layout: input.layout, tone: input.tone, show_title: input.showTitle, position: input.position, pinned: input.pinned, audience: input.audience,
  device: input.device, language: input.language, cta_label: input.ctaLabel, cta_url: input.ctaUrl, tags: input.tags ? [...new Set(input.tags)] : undefined,
  status: input.status, starts_at: input.startsAt, ends_at: input.endsAt,
}).filter(([, value]) => value !== undefined));

export async function listUploads(): Promise<LearningUpload[]> {
  return (rows(await db().from("learning_uploads").select("*").order("updated_at", { ascending: false })) as UploadRow[]).map(toUpload);
}
export async function createUpload(input: UploadInput, ownerId: string) {
  const created = toUpload(rows(await db().from("learning_uploads").insert({ ...toRow(input), created_by: ownerId }).select("*").single()) as UploadRow);
  published();
  return created;
}
/** Updates an upload; when its content changes, the previous content is kept as a revision and the version goes up. */
export async function updateUpload(id: string, input: Partial<UploadInput>) {
  const before = rows(await db().from("learning_uploads").select("*").eq("id", id).maybeSingle()) as UploadRow | null;
  if (!before) throw new HttpError(404, "not_found");
  const contentChanged = (input.html !== undefined && input.html !== before.html) || (input.title !== undefined && input.title !== before.title)
    || (input.summary !== undefined && input.summary !== before.summary) || (input.background !== undefined && input.background !== before.background);
  if (contentChanged) rows(await db().from("learning_upload_revisions").insert({ upload_id: id, version: before.version, title: before.title, summary: before.summary, html: before.html, background: before.background }));
  const patch = { ...toRow(input), updated_at: new Date().toISOString(), ...(contentChanged ? { version: before.version + 1 } : {}) };
  const row = rows(await db().from("learning_uploads").update(patch).eq("id", id).select("*").maybeSingle()) as UploadRow | null;
  if (!row) throw new HttpError(404, "not_found");
  published();
  return toUpload(row);
}
/** One change applied to many uploads at once (publish, hide, unpublish to draft, pin). */
export async function bulkUpdate(ids: string[], changes: Pick<Partial<UploadInput>, "status" | "pinned">) {
  rows(await db().from("learning_uploads").update({ ...toRow(changes), updated_at: new Date().toISOString() }).in("id", ids));
  published();
}
export async function deleteUploads(ids: string[]) { rows(await db().from("learning_uploads").delete().in("id", ids)); published(); }

export async function listRevisions(uploadId: string): Promise<LearningRevision[]> {
  return (rows(await db().from("learning_upload_revisions").select("*").eq("upload_id", uploadId).order("version", { ascending: false }).limit(50)) as RevisionRow[]).map(toRevision);
}
/** Puts an earlier version's content back (the current content becomes a revision itself, so nothing is lost). */
export async function restoreRevision(revisionId: string) {
  const revision = rows(await db().from("learning_upload_revisions").select("*").eq("id", revisionId).maybeSingle()) as RevisionRow | null;
  if (!revision) throw new HttpError(404, "not_found");
  return updateUpload(revision.upload_id, { title: revision.title, summary: revision.summary, html: revision.html, background: revision.background });
}

export const pageInput = z.object({
  title: z.string().trim().min(1).max(80), slug: z.string().trim().max(60).optional(), description: z.string().trim().max(300).nullable().optional(),
  icon: z.string().max(40).default("BookOpen"), position: z.number().int().min(-1000).max(1000).default(0), visible: z.boolean().default(true),
});
export async function createPage(input: z.infer<typeof pageInput>) {
  const slug = slugify(input.slug || input.title);
  if (!slug) throw new HttpError(400, "invalid_slug");
  const result = await db().from("learning_pages").insert({ slug, title: input.title, description: input.description ?? null, icon: input.icon, position: input.position, visible: input.visible }).select("*").single();
  if (result.error?.code === "23505") throw new HttpError(409, "slug_taken");
  return toPage(rows(result) as PageRow);
}
export async function updatePage(id: string, input: Partial<z.infer<typeof pageInput>>) {
  const slug = input.slug ? slugify(input.slug) : undefined;
  if (input.slug !== undefined && !slug) throw new HttpError(400, "invalid_slug");
  const patch = Object.fromEntries(Object.entries({ title: input.title, description: input.description, icon: input.icon, position: input.position, visible: input.visible, slug }).filter(([, v]) => v !== undefined));
  const before = slug ? rows(await db().from("learning_pages").select("slug").eq("id", id).maybeSingle()) as { slug: string } | null : null;
  const result = await db().from("learning_pages").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select("*").maybeSingle();
  if (result.error?.code === "23505") throw new HttpError(409, "slug_taken");
  const row = rows(result) as PageRow | null;
  if (!row) throw new HttpError(404, "not_found");
  // A new address carries the page's uploads with it.
  if (before && before.slug !== row.slug) rows(await db().from("learning_uploads").update({ page: `learn:${row.slug}` }).eq("surface", "dashboard").eq("page", `learn:${before.slug}`));
  return toPage(row);
}
/** Deletes a page and the uploads placed on it, so nothing points at a page that no longer exists. */
export async function deletePage(id: string) {
  const page = rows(await db().from("learning_pages").select("slug").eq("id", id).maybeSingle()) as { slug: string } | null;
  if (!page) throw new HttpError(404, "not_found");
  rows(await db().from("learning_uploads").delete().eq("surface", "dashboard").eq("page", `learn:${page.slug}`));
  rows(await db().from("learning_pages").delete().eq("id", id));
  published();
}
