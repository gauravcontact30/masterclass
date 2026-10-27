import "server-only";
import { db } from "./db";
import { HttpError } from "./http";
import { CHECKLIST_IDS, progressKey, type ChecklistId, type ProgressMap } from "@/lib/deep-courses/progress";

/** In-depth course progress for one learner (migration 0043). Missing table → 503 migration_required. */

const missing = (error: { code?: string; message: string }) => error.code === "42P01" || error.code === "PGRST205" || /could not find the table|does not exist/i.test(error.message);

type Row = { course_id: string; topic_id: string; checklist: string[]; completed: boolean; updated_at: string };

export async function readDeepProgress(userId: string): Promise<ProgressMap> {
  const { data, error } = await db().from("deep_course_progress").select("course_id,topic_id,checklist,completed,updated_at").eq("user_id", userId);
  if (error) throw missing(error) ? new HttpError(503, "migration_required") : new Error(error.message);
  const map: ProgressMap = {};
  for (const row of data as Row[]) {
    map[progressKey(row.course_id, row.topic_id)] = {
      checklist: row.checklist.filter((id): id is ChecklistId => (CHECKLIST_IDS as string[]).includes(id)),
      completed: row.completed,
      updatedAt: Date.parse(row.updated_at),
    };
  }
  return map;
}

export async function writeDeepProgress(userId: string, entries: { courseId: string; topicId: string; checklist: ChecklistId[]; completed: boolean }[]) {
  if (!entries.length) return;
  const now = new Date().toISOString();
  const { error } = await db().from("deep_course_progress").upsert(entries.map(entry => ({
    user_id: userId, course_id: entry.courseId, topic_id: entry.topicId,
    checklist: [...new Set(entry.checklist)], completed: entry.completed, updated_at: now,
  })), { onConflict: "user_id,course_id,topic_id" });
  if (error) throw missing(error) ? new HttpError(503, "migration_required") : new Error(error.message);
}
