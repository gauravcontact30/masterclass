import "server-only";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { db } from "./db";
import { HttpError } from "./http";
import { currentUser } from "./auth";
import { account } from "./repository";
import { store } from "./learning-study-pack";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { createTechBuzzArticle, expireTechBuzzCache } from "./tech-buzz-storage";
import { INK_LIMITS, inkWords, isInkImage, writeTechnology, WRITE_TECHNOLOGIES, type InkListItem, type InkStatus, type InkStory } from "@/lib/tech-buzz-ink";
import type { TechBuzzArticle } from "@/lib/tech-buzz-data";
import { imageSources } from "@/lib/prose-markup";

/*
 * The server half of Write (lib/tech-buzz-ink.ts): members' own stories in tech_buzz_articles, owned through
 * created_by. A draft is status 'draft' and never served publicly; Publish makes it 'published' at once (the cached
 * /tech-buzz lists are expired on every write). Every read and write is scoped to the writer's own rows.
 */

/** Who is writing: the byline stored on their stories. */
export type Writer = { id: string; author: TechBuzzArticle["author"] };

const text = (max: number) => z.string().trim().max(max);
const lines = z.array(text(600)).max(INK_LIMITS.listItems);
const image = z.object({ src: z.string().refine(isInkImage, "image_not_allowed"), alt: text(200) });
const sectionSchema = z.object({
  heading: text(200),
  // Pictures placed inside the text (![…](…)) follow the same rule as section pictures.
  paragraphs: z.array(text(INK_LIMITS.paragraph).refine(paragraph => imageSources(paragraph).every(isInkImage), "image_not_allowed")).max(INK_LIMITS.paragraphs),
  steps: lines.optional(),
  bulletPoints: lines.optional(),
  codeSnippet: z.object({ files: z.array(z.object({ filename: text(120), language: text(30), code: z.string().max(INK_LIMITS.code) })).min(1).max(INK_LIMITS.codeFiles) }).optional(),
  callout: z.object({ type: z.enum(["tip", "insight", "warning"]), text: text(1200) }).optional(),
  quote: z.object({ text: text(800), attribution: text(120) }).optional(),
  image: image.optional(),
});
const storySchema = z.object({
  id: z.string().uuid().optional(),
  title: text(INK_LIMITS.title).min(1, "title_required"),
  subtitle: text(INK_LIMITS.subtitle),
  technology: z.string().refine(id => !!writeTechnology(id), "unknown_technology"),
  tags: z.array(text(30)).max(INK_LIMITS.tags),
  coverImage: z.string().refine(isInkImage, "image_not_allowed").optional().or(z.literal("")),
  summaryBullets: z.array(text(200)).max(5),
  founderTakeaway: text(600),
  sections: z.array(sectionSchema).max(INK_LIMITS.sections),
});

/** Empty parts are dropped, so a half-filled section never renders an empty list or box. */
function cleanSections(sections: InkStory["sections"]): TechBuzzArticle["contentSections"] {
  return sections.map(section => {
    const steps = section.steps?.filter(Boolean) ?? [];
    const bulletPoints = section.bulletPoints?.filter(Boolean) ?? [];
    const files = section.codeSnippet?.files?.filter(file => file.code.trim()) ?? [];
    return {
      heading: section.heading,
      paragraphs: section.paragraphs.filter(Boolean),
      ...(steps.length ? { steps } : {}),
      ...(bulletPoints.length ? { bulletPoints } : {}),
      ...(files.length ? { codeSnippet: { language: files[0].language || "text", filename: files[0].filename, code: files[0].code, files: files.map(file => ({ ...file, language: file.language || "text" })) } } : {}),
      ...(section.callout?.text ? { callout: section.callout } : {}),
      ...(section.quote?.text ? { quote: section.quote } : {}),
      ...(section.image?.src ? { image: section.image } : {}),
    };
  }).filter(section => section.heading || section.paragraphs.length || section.steps || section.bulletPoints || section.codeSnippet || section.callout || section.quote || section.image);
}

/** Why a story cannot be published yet, or null when it can. */
function publishProblem(story: InkStory, sections: TechBuzzArticle["contentSections"]) {
  if (story.subtitle.length < 10) return "subtitle_required";
  if (!sections.some(section => section.heading && section.paragraphs.length)) return "section_required";
  if (inkWords({ ...story, sections }) < INK_LIMITS.minPublishWords) return "too_short";
  return null;
}

const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const newSlug = (title: string) => `${slugify(title).slice(0, 90).replace(/-+$/, "") || "story"}-${crypto.randomUUID().slice(0, 6)}`;

/** The byline for a signed-in user: their name, else their email's local part. */
export function writerOf(user: User): Writer {
  const name = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim() || (user.email ?? "MCB writer").split("@")[0];
  const avatar = String(user.user_metadata?.avatar_url ?? "");
  return {
    id: user.id,
    author: {
      name: name.slice(0, 80),
      role: isSuperAdminUser(user) ? "MasterClass Buddy Editor" : "MCB Member Writer",
      avatar: /^https:\/\//.test(avatar) ? avatar : "/images/brand/mcb-avatar.svg",
      handle: `@${slugify(name).replace(/-/g, "") || "writer"}`,
      verified: isSuperAdminUser(user),
    },
  };
}

/** The signed-in member allowed to write; throws 401 without a session and 403 without a membership. */
export async function requireWriter(): Promise<Writer> {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "signin_required");
  if (!(await canWrite(user))) throw new HttpError(403, "subscription_required");
  return writerOf(user);
}

/** Members (paid or in their trial) and Super Admins can write. */
export async function canWrite(user: User) {
  return isSuperAdminUser(user) || (await account(user.id)).tier !== "free";
}

type OwnRow = { id: string; slug: string; title: string; status: InkStatus; updated_at: string; published_at: string };

export async function listInkStories(userId: string): Promise<InkListItem[]> {
  const { data, error } = await db().from("tech_buzz_articles").select("id,slug,title,status,updated_at,published_at")
    .eq("created_by", userId).in("status", ["draft", "published"]).order("updated_at", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return (data as OwnRow[]).map(row => ({ id: row.id, slug: row.slug, title: row.title, status: row.status, updatedAt: row.updated_at, publishedAt: row.published_at }));
}

/** One of the writer's own stories, as the editor edits it. */
export async function getInkStory(userId: string, id: string): Promise<(InkStory & { id: string; slug: string; status: InkStatus }) | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const { data, error } = await db().from("tech_buzz_articles").select("id,slug,status,title,subtitle,technology,tags,cover_image,summary_bullets,founder_takeaway,content_sections")
    .eq("id", id).eq("created_by", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const tech = WRITE_TECHNOLOGIES.find(item => item.label === data.technology) ?? WRITE_TECHNOLOGIES[0];
  return {
    id: data.id, slug: data.slug, status: data.status as InkStatus,
    title: data.title, subtitle: data.subtitle === data.title ? "" : data.subtitle, technology: tech.id, tags: data.tags ?? [],
    coverImage: data.cover_image?.startsWith("/images/tech/") ? "" : data.cover_image ?? "",
    summaryBullets: data.summary_bullets ?? [], founderTakeaway: data.founder_takeaway ?? "", sections: data.content_sections ?? [],
  };
}

/**
 * Saves a story: creates its row on the first save, then updates it. `publish` makes it live (published_at is set
 * the first time); an already published story stays published and its edits show at once.
 */
export async function saveInkStory(writer: Writer, input: unknown, publish: boolean): Promise<{ id: string; slug: string; status: InkStatus }> {
  const parsed = storySchema.safeParse(input);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message.match(/^[a-z_]+$/) ? parsed.error.issues[0].message : "invalid_story");
  const story = parsed.data as InkStory;
  const tech = writeTechnology(story.technology)!;
  const sections = cleanSections(story.sections);
  const existing = story.id
    ? (await db().from("tech_buzz_articles").select("id,slug,status").eq("id", story.id).eq("created_by", writer.id).maybeSingle()).data as Pick<OwnRow, "id" | "slug" | "status"> | null
    : null;
  if (story.id && !existing) throw new HttpError(404, "not_found");
  const live = publish || existing?.status === "published";
  if (live) {
    const problem = publishProblem(story, sections);
    if (problem) throw new HttpError(422, problem);
  }
  const fields = {
    title: story.title,
    // The table requires a subtitle; a draft without one borrows its title until it is written.
    subtitle: story.subtitle || story.title,
    category: tech.category,
    technology: tech.label,
    tech_badge_color: tech.color,
    read_time_minutes: Math.max(1, Math.min(60, Math.round(inkWords({ ...story, sections }) / 220))),
    cover_image: story.coverImage || `/images/tech/${tech.id}.png`,
    tags: [...new Set(story.tags.filter(Boolean))],
    summary_bullets: story.summaryBullets.filter(Boolean),
    tech_stack: [tech.label],
    founder_takeaway: story.founderTakeaway || null,
    content_sections: sections,
    status: live ? "published" : "draft",
  };

  if (existing) {
    const goingLive = live && existing.status !== "published";
    const { error } = await db().from("tech_buzz_articles").update({ ...fields, updated_at: new Date().toISOString(), ...(goingLive ? { published_at: new Date().toISOString() } : {}) })
      .eq("id", existing.id).eq("created_by", writer.id);
    if (error) throw new Error(error.message);
    if (live) expireTechBuzzCache();
    return { id: existing.id, slug: existing.slug, status: fields.status as InkStatus };
  }

  const created = await createTechBuzzArticle({
    slug: newSlug(story.title),
    title: fields.title, subtitle: fields.subtitle, category: fields.category, technology: fields.technology, techBadgeColor: fields.tech_badge_color,
    readTimeMinutes: fields.read_time_minutes, coverImage: fields.cover_image, tags: fields.tags, summaryBullets: fields.summary_bullets,
    techStack: fields.tech_stack, founderTakeaway: story.founderTakeaway, contentSections: sections,
    featured: false, likes: 0, dislikes: 0, upvotes: 0, claps: 0,
    // Not rated yet: the page shows "New" until readers rate it.
    rating: { average: 5, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    author: writer.author,
    rankingScore: 90,
    source: { name: "MasterClass Buddy", domain: "masterclass", trustScore: "" },
    reactions: { heart: 0, unicorn: 0, rocket: 0, mindblown: 0 },
    commentsCount: 0, comments: [],
    membershipTier: "Free Preview",
    ...({ status: fields.status } as object),
  }, writer.id);
  return { id: created.id, slug: created.slug, status: fields.status as InkStatus };
}

export async function deleteInkStory(userId: string, id: string) {
  const { data, error } = await db().from("tech_buzz_articles").delete().eq("id", id).eq("created_by", userId).select("status");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new HttpError(404, "not_found");
  if (data.some(row => row.status === "published")) expireTechBuzzCache();
}

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);
export const MAX_INK_IMAGE_BYTES = 6 * 1024 * 1024;

/** A cover or in-story picture: resized to at most 1600 px wide, stored as WebP in Supabase Storage. */
export async function storeInkImage(userId: string, file: File): Promise<string> {
  if (!IMAGE_TYPES.has(file.type)) throw new HttpError(415, "unsupported_image");
  if (file.size > MAX_INK_IMAGE_BYTES) throw new HttpError(413, "request_too_large");
  const { default: sharp } = await import("sharp");
  const webp = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
    .catch(() => { throw new HttpError(415, "unsupported_image"); });
  return store(`tech-buzz/ink/${userId}/${crypto.randomUUID()}.webp`, webp);
}
