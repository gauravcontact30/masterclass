import { z } from "zod";
import { api, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { runAhrefs, runAiChecks, runSiteAudit, seoOverview, syncRanks } from "@/lib/server/seo-suite";

/*
 * The Super Admin "SEO Audit" page (components/super-admin-seo.tsx, migration 0049). GET returns everything the page
 * shows; POST runs one action: an audit, a rank sync, an AI-visibility check, an Ahrefs report, or a change to the
 * tracked keywords, competitors and AI questions.
 */
export const maxDuration = 300;

const country = z.string().trim().toLowerCase().regex(/^[a-z]{2}$/).default("in");
const domain = z.string().trim().toLowerCase().min(3).max(120).regex(/^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/);
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("audit") }),
  z.object({ action: z.literal("sync-ranks") }),
  z.object({ action: z.literal("ai-check") }),
  z.object({ action: z.literal("ahrefs"), tool: z.enum(["overview", "refdomains", "organic-keywords", "top-pages", "competitors", "keyword-overview", "matching-terms"]), target: domain.optional(), keywords: z.string().trim().max(1000).optional(), country }),
  z.object({ action: z.literal("add-keyword"), keyword: z.string().trim().toLowerCase().min(2).max(120), country, target_url: z.string().trim().url().max(300).optional().nullable() }),
  z.object({ action: z.literal("remove-keyword"), id: z.number().int().positive() }),
  z.object({ action: z.literal("add-competitor"), domain }),
  z.object({ action: z.literal("remove-competitor"), id: z.number().int().positive() }),
  z.object({ action: z.literal("add-prompt"), prompt: z.string().trim().min(8).max(300) }),
  z.object({ action: z.literal("remove-prompt"), id: z.number().int().positive() }),
]);

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    return Response.json(await seoOverview(), { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}

export async function POST(request: Request) {
  return api(async () => {
    const admin = await requireSuperAdmin();
    sameOrigin(request);
    const input = actionSchema.parse(await jsonBody(request, 4000));
    // Crawls and paid API calls are rarer than list edits.
    const heavy = ["audit", "sync-ranks", "ai-check", "ahrefs"].includes(input.action);
    await rateLimit(`admin-seo:${heavy ? "run" : "edit"}:${admin.id}`, heavy ? 12 : 60, heavy ? 600 : 60);
    const client = db();
    const done = (body: unknown = { ok: true }) => Response.json(body);
    switch (input.action) {
      case "audit": return done({ auditId: await runSiteAudit() });
      case "sync-ranks": return done(await syncRanks());
      case "ai-check": return done(await runAiChecks());
      case "ahrefs": return done({ snapshot: await runAhrefs(input.tool, input) });
      case "add-keyword": {
        const { error } = await client.from("seo_keywords").upsert({ keyword: input.keyword, country: input.country, target_url: input.target_url ?? null }, { onConflict: "keyword,country" });
        if (error) adminError(error);
        return done();
      }
      case "add-competitor": {
        const clean = input.domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
        const { error } = await client.from("seo_competitors").upsert({ domain: clean }, { onConflict: "domain" });
        if (error) adminError(error);
        return done();
      }
      case "add-prompt": {
        const { error } = await client.from("seo_ai_prompts").upsert({ prompt: input.prompt }, { onConflict: "prompt" });
        if (error) adminError(error);
        return done();
      }
      case "remove-keyword": case "remove-competitor": case "remove-prompt": {
        const table = input.action === "remove-keyword" ? "seo_keywords" : input.action === "remove-competitor" ? "seo_competitors" : "seo_ai_prompts";
        const { error } = await client.from(table).delete().eq("id", input.id);
        if (error) adminError(error);
        return done();
      }
    }
  }, request);
}
