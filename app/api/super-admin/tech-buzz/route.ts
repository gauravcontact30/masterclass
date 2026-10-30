import { z } from "zod";
import { api, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireOwner } from "@/lib/server/learning-uploads";
import type { TechBuzzArticle } from "@/lib/tech-buzz-data";
import {
  createTechBuzzArticle,
  deleteTechBuzzArticle,
  listTechBuzzArticles,
  syncDefaultArticlesToSupabase,
  updateTechBuzzArticle,
} from "@/lib/server/tech-buzz-storage";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3).max(250),
  subtitle: z.string().trim().min(5).max(500),
  slug: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(80),
  technology: z.string().trim().min(1).max(80),
  techBadgeColor: z.string().default("#ea580c"),
  readTimeMinutes: z.number().int().min(1).max(120).default(5),
  featured: z.boolean().default(false),
  trendingRank: z.number().int().min(1).max(20).nullable().optional(),
  membershipTier: z.enum(["Free Preview", "Pro Member", "All-Access"]).default("Pro Member"),
  coverImage: z.string().url().or(z.string().min(5)),
  tags: z.array(z.string()).default([]),
  summaryBullets: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  founderTakeaway: z.string().optional(),
  author: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    avatar: z.string(),
    handle: z.string(),
    verified: z.boolean().optional(),
  }).optional(),
  contentSections: z.array(
    z.object({
      heading: z.string().optional(),
      paragraphs: z.array(z.string()),
      codeSnippet: z.object({
        language: z.string(),
        code: z.string(),
        filename: z.string().optional(),
      }).optional(),
      callout: z.object({
        type: z.enum(["tip", "insight", "warning"]),
        text: z.string(),
      }).optional(),
      quote: z.object({
        text: z.string(),
        attribution: z.string(),
      }).optional(),
      bulletPoints: z.array(z.string()).optional(),
    })
  ).default([]),
  status: z.enum(["draft", "published", "hidden", "archived"]).default("published"),
});

export async function GET(request: Request) {
  return api(async () => {
    await requireOwner();
    const articles = await listTechBuzzArticles(true);
    return Response.json({
      articles,
      count: articles.length,
    });
  }, request);
}

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const owner = await requireOwner();
    const body = await jsonBody(request, 4_400_000);

    // One-click seed / sync defaults
    if (body && typeof body === "object" && (body as { syncDefaults?: unknown }).syncDefaults) {
      const res = await syncDefaultArticlesToSupabase();
      return Response.json({ synced: true, count: res.count });
    }

    const validated = articleSchema.parse(body);
    const created = await createTechBuzzArticle(validated as Partial<TechBuzzArticle>, owner.id);
    return Response.json({ article: created }, { status: 201 });
  }, request);
}

export async function PUT(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireOwner();
    const body = await jsonBody(request, 4_400_000);

    const validated = articleSchema.parse(body);
    const target = validated.id || validated.slug;
    if (!target) {
      return Response.json({ error: "Missing article id or slug" }, { status: 400 });
    }

    const updated = await updateTechBuzzArticle(target, validated as Partial<TechBuzzArticle>);
    return Response.json({ article: updated });
  }, request);
}

export async function DELETE(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireOwner();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const target = id || slug;

    if (!target) {
      return Response.json({ error: "Missing id or slug" }, { status: 400 });
    }

    await deleteTechBuzzArticle(target);
    return Response.json({ ok: true, deleted: target });
  }, request);
}
