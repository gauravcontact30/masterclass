import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { authConfigured } from "@/lib/server/config";
import { db } from "@/lib/server/db";

export type LiveAnnouncement = { id: string; title: string; body: string; tone: "info" | "success" | "warning" | "maintenance"; starts_at: string; ends_at: string | null };

/** Live announcements, cached for a minute and refreshed at once when the super admin changes one (tag "announcements"). */
async function live(): Promise<LiveAnnouncement[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag("announcements");
  const now = new Date().toISOString();
  const { data, error } = await db().from("announcements").select("id,title,body,tone,starts_at,ends_at")
    .eq("active", true).lte("starts_at", now).or(`ends_at.is.null,ends_at.gt.${now}`).order("starts_at", { ascending: false }).limit(3);
  return error ? [] : (data ?? []) as LiveAnnouncement[];
}

export async function GET() {
  // Request time only: a build must never query the database for this.
  await connection();
  if (!authConfigured()) return Response.json({ announcements: [] });
  return Response.json({ announcements: await live() }, { headers: { "Cache-Control": "private, max-age=30" } });
}
