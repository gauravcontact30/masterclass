import { api, userId, jsonBody, sameOrigin } from "@/lib/server/http";
import { account, documents, profile, progress } from "@/lib/server/repository";
import { check, db } from "@/lib/server/db";
import { z } from "zod";
export async function GET() { return api(async () => {
  const id = await userId(); const user = await profile(id);
  const [subscription, items, learning] = await Promise.all([account(id), documents(id), progress(id)]);
  return Response.json({ profile: user, account: subscription, documents: items, progress: learning });
}); }
export async function PATCH(request: Request) { return api(async () => {
  sameOrigin(request); const id = await userId(); const data = z.object({ language: z.enum(["en","hi"]) }).strict().parse(await jsonBody(request));
  await profile(id); check(await db().from("profiles").update(data).eq("id", id)); return Response.json({ ok: true });
}); }
