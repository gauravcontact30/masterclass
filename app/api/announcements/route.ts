import { unstable_cache } from "next/cache";
import { authConfigured } from "@/lib/server/config";
import { db } from "@/lib/server/db";

export type LiveAnnouncement = { id: string; title: string; body: string; tone: "info" | "success" | "warning" | "maintenance"; starts_at: string; ends_at: string | null };

/** Live announcements, cached for a minute and refreshed at once when the super admin changes one (tag "announcements"). */
const live = unstable_cache(async (): Promise<LiveAnnouncement[]> => {
  const now = new Date().toISOString();
  const { data, error } = await db().from("announcements").select("id,title,body,tone,starts_at,ends_at")
    .eq("active", true).lte("starts_at", now).or(`ends_at.is.null,ends_at.gt.${now}`).order("starts_at", { ascending: false }).limit(3);
  return error ? [] : (data ?? []) as LiveAnnouncement[];
}, ["announcements-live"], { revalidate: 60, tags: ["announcements"] });

export async function GET() {
  if (!authConfigured()) return Response.json({ announcements: [] });
  return Response.json({ announcements: await live() }, { headers: { "Cache-Control": "private, max-age=30" } });
}
