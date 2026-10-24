import preview from "@/lib/catalog-preview.json";
import { LANGUAGE_COURSES } from "./catalog";
import { bi, type Bilingual, type StudyCourse } from "./types";

/*
 * What a learner can prepare for. The platform currently serves tech professionals: the government exam, entrance
 * exam and school board (Class 6–12) groups were removed on 2026-10-24 and return by adding their groups, labels and
 * courses (./catalog.ts) back.
 */
export const PREPARATION_GROUPS = [
  { id: "technology", label: bi("Courses & Interviews", "कोर्स और साक्षात्कार"), categories: ["system-design", "technology"] },
  { id: "languages", label: bi("Language Preparation", "भाषा की तैयारी"), categories: ["languages"] },
] as const;
export const CATEGORY_LABELS: Record<string, Bilingual> = {
  notes: bi("Notes", "नोट्स"),
  languages: bi("IELTS & Vocabulary", "IELTS और शब्दावली"), technology: bi("Technology & Interviews", "तकनीक और साक्षात्कार"),
  "system-design": bi("System Design", "सिस्टम डिज़ाइन"),
};
export function courseCategory(course: StudyCourse): string {
  return course.category === "course" ? "system-design" : "languages";
}
export type PreparationOption = { id: string; category: string; label: Bilingual };
export const PREPARATIONS: PreparationOption[] = [
  { id: "system-design", category: "system-design", label: bi("System Design · Apps & Architecture", "सिस्टम डिज़ाइन · ऐप और आर्किटेक्चर") },
  ...LANGUAGE_COURSES.map(course => ({ id: course.id, category: courseCategory(course), label: course.title })),
  ...preview.technologies.map(tech => ({ id: `tech:${tech.id}`, category: "technology", label: bi(tech.title, tech.title_hi) })),
];
/** `focused` is true only when the learner saved their own subset; otherwise `selections` is every category. */
export type PreparationAccess = { selections: string[]; isSuperAdmin: boolean; focused?: boolean };
export function canReadStudy(access: PreparationAccess, course: StudyCourse) { return access.isSuperAdmin || access.selections.includes(course.category === "course" ? "system-design" : course.id); }
export function canReadTechnology(access: PreparationAccess, technologyId: string) { return access.isSuperAdmin || access.selections.includes(`tech:${technologyId}`); }
export const OWNER_EMAIL = "garvcontact30@gmail.com";
export function isOwnerUser(user: { email?: string | null; email_confirmed_at?: string | null } | null) { return Boolean(user?.email_confirmed_at && user.email?.trim().toLowerCase() === OWNER_EMAIL); }
/**
 * The owner, or a confirmed account granted Super Admin from Users & access. The grant lives in Auth app_metadata,
 * which only the service role can write (a user cannot set it on themselves).
 */
export function isSuperAdminUser(user: { email?: string | null; email_confirmed_at?: string | null; app_metadata?: Record<string, unknown> | null } | null) {
  return isOwnerUser(user) || Boolean(user?.email_confirmed_at && user.app_metadata?.super_admin === true);
}
