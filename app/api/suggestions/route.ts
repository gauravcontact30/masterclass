import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { rateLimit } from "@/lib/server/rate-limit";
import { suggestionSchema } from "@/lib/suggestions-schema";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const client = (request: Request) => hash(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown");
const fields = "id,name,category,title,body,status,version,created_at,updated_at";

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await rateLimit(`suggestions:submit:${client(request)}`, 5, 3600);
    const { website: _honeypot, ...input } = suggestionSchema.parse(await jsonBody(request, 24000));
    void _honeypot;
    const secret = randomBytes(32).toString("hex");
    const { data, error } = await db().from("suggestions").insert({ ...input, email: input.email || null, access_hash: hash(secret) }).select(fields).single();
    if (error) adminError(error);
    return Response.json({ suggestion: data, trackingCode: `${data.id}.${secret}` }, { status: 201 });
  }, request);
}

export async function GET(request: Request) {
  return api(async () => {
    await rateLimit(`suggestions:read:${client(request)}`, 30, 60);
    const code = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
    const [id, secret, extra] = code.split(".");
    if (extra || !z.uuid().safeParse(id).success || !/^[a-f0-9]{64}$/.test(secret ?? "")) throw new HttpError(404, "not_found");
    const { data, error } = await db().from("suggestions").select(fields).eq("id", id).eq("access_hash", hash(secret)).maybeSingle();
    if (error) adminError(error);
    if (!data) throw new HttpError(404, "not_found");
    const updates = await db().from("suggestion_updates").select("id,status,reply,created_at").eq("suggestion_id", id).order("created_at", { ascending: true });
    if (updates.error) adminError(updates.error);
    return Response.json({ suggestion: data, updates: updates.data });
  }, request);
}
