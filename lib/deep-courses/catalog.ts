import { DEEP_COURSES } from "./index";
import { PRO_TRACKS } from "@/lib/pro-learn/tracks";
import { familyOfTrack, TRACK_FAMILIES } from "@/lib/pro-learn/families";
import type { CourseMeta } from "./types";

/*
 * Every in-depth course on the platform: the six hand-written ones (./content) and one per remaining technology
 * track, written on first open by lib/server/course-generator.ts. Client-safe: names, glyphs, tints and families only.
 */

/** A light tint per family, so courses read as neighbourhoods in the catalogue. */
const FAMILY_TINT: Record<string, string> = {
  ai: "#f3effe", jvm: "#fdf1e7", frontend: "#eef4fd", languages: "#fbf6e6", state: "#f1eefd", backend: "#eaf7f0", validation: "#e9f6f8",
  auth: "#fdeef3", database: "#eef1fb", pythondata: "#f6f5e6", http: "#e9f6f8", testing: "#eaf7f0", platform: "#fdf3e6",
};

export type CatalogCourse = CourseMeta & { family: string; familyName: string; familyIcon: string; handwritten: boolean; focus: string; keywords: string };

const HANDWRITTEN = new Set(DEEP_COURSES.map(course => course.id));

export const COURSE_CATALOG: CatalogCourse[] = PRO_TRACKS.map(track => {
  const family = familyOfTrack(track.id);
  const own = DEEP_COURSES.find(course => course.id === track.id);
  const meta: CourseMeta = own ?? {
    id: track.id, name: track.name, glyph: track.icon, tint: FAMILY_TINT[family?.id ?? ""] ?? "#f5f5f7",
    blurb: track.focus, audience: "Learners, interview candidates and working engineers", highlights: track.syllabus.slice(0, 4),
  };
  return {
    ...meta, family: family?.id ?? "other", familyName: family?.name ?? "More", familyIcon: family?.icon ?? "✦", handwritten: HANDWRITTEN.has(track.id),
    focus: track.focus, keywords: `${track.name} ${track.id} ${track.focus} ${track.syllabus.join(" ")} ${family?.name ?? ""}`.toLowerCase(),
  };
}).sort((a, b) => Number(b.handwritten) - Number(a.handwritten) || TRACK_FAMILIES.findIndex(f => f.id === a.family) - TRACK_FAMILIES.findIndex(f => f.id === b.family));

/** The card facts of a course written on first open, or undefined for hand-written or unknown ids. */
export const generatedCourseMeta = (id: string): CourseMeta | undefined => {
  const entry = COURSE_CATALOG.find(course => course.id === id && !course.handwritten);
  return entry ? { id: entry.id, name: entry.name, glyph: entry.glyph, tint: entry.tint, blurb: entry.blurb, audience: entry.audience, highlights: entry.highlights } : undefined;
};

export const isCatalogCourse = (id: string) => COURSE_CATALOG.some(course => course.id === id);
