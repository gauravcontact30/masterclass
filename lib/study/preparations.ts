import preview from "@/lib/catalog-preview.json";
import { BOARD_INFO, EXAM_COURSES } from "./catalog";
import { bi, type Bilingual, type StudyCourse } from "./types";

export const PREPARATION_GROUPS = [
  { id: "government", label: bi("Govt. Exams", "सरकारी परीक्षाएँ"), categories: ["civil-services", "ssc", "defence", "banking", "railways", "teaching", "state"] },
  { id: "entrance", label: bi("Entrance Exams", "प्रवेश परीक्षाएँ"), categories: ["engineering", "medical"] },
  { id: "boards", label: bi("Board Exams", "बोर्ड परीक्षाएँ"), categories: ["cbse", "ncert", "icse", "isc"] },
  { id: "languages", label: bi("Language Preparation", "भाषा की तैयारी"), categories: ["languages"] },
  { id: "technology", label: bi("Courses & Interviews", "कोर्स और साक्षात्कार"), categories: ["system-design", "technology"] },
] as const;
export const CATEGORY_LABELS: Record<string, Bilingual> = {
  notes: bi("Notes", "नोट्स"),
  "civil-services": bi("Civil Services", "सिविल सेवा"), ssc: bi("SSC & Recruitment", "SSC और भर्ती"), defence: bi("Defence & Security", "रक्षा और सुरक्षा"),
  banking: bi("Banking", "बैंकिंग"), railways: bi("Railways", "रेलवे"), teaching: bi("Teaching", "शिक्षण"), state: bi("State Exams", "राज्य परीक्षाएँ"),
  engineering: bi("Engineering · JEE / IIT", "इंजीनियरिंग · JEE / IIT"), medical: bi("Medical · NEET", "चिकित्सा · NEET"),
  cbse: bi("CBSE", "CBSE"), ncert: bi("NCERT", "NCERT"), icse: bi("ICSE", "ICSE"), isc: bi("ISC", "ISC"),
  languages: bi("IELTS & Vocabulary", "IELTS और शब्दावली"), technology: bi("Technology & Interviews", "तकनीक और साक्षात्कार"),
  "system-design": bi("System Design", "सिस्टम डिज़ाइन"),
};
export function courseCategory(course: StudyCourse): string {
  if (course.category === "course") return "system-design";
  if (course.board) return course.board;
  const id = course.id;
  if (id.startsWith("ssc-")) return "ssc";
  if (id.startsWith("jee-")) return "engineering";
  if (id.startsWith("ibps-")) return "banking";
  if (id.startsWith("rrb-")) return "railways";
  return ({ nda: "defence", cds: "defence", capf: "defence", neet: "medical", "upsc-cse": "civil-services", ctet: "teaching", "state-exams": "state", ielts: "languages" } as Record<string, string>)[id] ?? "state";
}
export type PreparationOption = { id: string; category: string; label: Bilingual };
export const PREPARATIONS: PreparationOption[] = [
  { id: "system-design", category: "system-design", label: bi("System Design · Apps & Architecture", "सिस्टम डिज़ाइन · ऐप और आर्किटेक्चर") },
  ...Object.entries(BOARD_INFO).flatMap(([board, info]) => info.grades.map(grade => ({ id: `${board}-${grade}`, category: board, label: bi(`${info.title} · Class ${grade}`, `${info.title} · कक्षा ${grade}`) }))),
  ...EXAM_COURSES.map(course => ({ id: course.id, category: courseCategory(course), label: course.title })),
  ...preview.technologies.map(tech => ({ id: `tech:${tech.id}`, category: "technology", label: bi(tech.title, tech.title_hi) })),
];
/** `focused` is true only when the learner saved their own subset; otherwise `selections` is every category. */
export type PreparationAccess = { selections: string[]; isSuperAdmin: boolean; focused?: boolean };
export function canReadStudy(access: PreparationAccess, course: StudyCourse) { return access.isSuperAdmin || access.selections.includes(course.category === "course" ? "system-design" : course.board ? `${course.board}-${course.grade}` : course.id); }
export function canReadTechnology(access: PreparationAccess, technologyId: string) { return access.isSuperAdmin || access.selections.includes(`tech:${technologyId}`); }
export function isSuperAdminUser(user: { email?: string; email_confirmed_at?: string | null } | null) { return Boolean(user?.email_confirmed_at && user.email?.trim().toLowerCase() === "garvcontact30@gmail.com"); }
