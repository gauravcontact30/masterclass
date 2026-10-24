/*
 * Where an uploaded learning document can appear. The owner writes a document in the Super Admin Notepad, then
 * "Upload Learning" publishes it to a surface (Learning Dashboard, landing page, sign-in, sign-up, Super Admin), a
 * page on that surface and a section of the page. Client-safe on purpose: no zod or Supabase, because the landing
 * page imports the slot that renders these (see the root layout bundle rule).
 */

export type LearningSurface = "dashboard" | "landing" | "sign_in" | "sign_up" | "super_admin";
export type LearningLayout = "card" | "banner" | "full" | "accordion";
export type LearningAudience = "everyone" | "signed_out" | "signed_in" | "members";
export type LearningStatus = "draft" | "published" | "hidden";
export type LearningTone = "ivory" | "sky" | "mint" | "lavender" | "rose" | "peach" | "butter";

export type LearningDevice = "all" | "desktop" | "mobile";
export type LearningLanguage = "all" | "en" | "hi";

export type PackStatus = "none" | "generating" | "ready" | "failed";
/**
 * What the Learning Dashboard's "Read more" window shows besides the document, generated through Vercel AI Gateway
 * when an upload is published there (migration 0033). The diagram is a small directed graph the window lays out.
 */
/** What a diagram box stands for; it picks the box's colour. Packs generated before these fields existed have none. */
export const DIAGRAM_KINDS = ["client", "edge", "service", "data"] as const;
export type DiagramNode = { id: string; label: string; detail?: string; kind?: (typeof DIAGRAM_KINDS)[number] };
export type StudyPack = {
  description: string;
  interview: { question: string; answer: string }[];
  workflow: { title: string; detail: string }[];
  diagram: { title: string; nodes: DiagramNode[]; edges: { from: string; to: string; label?: string; dashed?: boolean }[] };
  images: { url: string; caption: string }[];
  model: string; generatedAt: string;
};

/** One uploaded document as the public slot receives it. */
export type LearningBlock = {
  id: string; title: string; summary: string | null; html: string; background: string; surface: LearningSurface; page: string; section: string;
  layout: LearningLayout; tone: LearningTone; position: number; showTitle: boolean; pinned: boolean;
  device: LearningDevice; language: LearningLanguage; ctaLabel: string | null; ctaUrl: string | null; tags: string[];
  /** Absent before migration 0033 and until the pack has been generated. */
  thumbnailUrl?: string | null; studyPack?: StudyPack | null; publishedAt?: string | null;
};
/** The same document with everything the owner configures, for the admin page. */
export type LearningUpload = LearningBlock & {
  status: LearningStatus; audience: LearningAudience; startsAt: string | null; endsAt: string | null; sourceFileId: string | null;
  views: number; version: number; createdAt: string; updatedAt: string; packStatus?: PackStatus; packError?: string | null;
};
/** An earlier version of an upload's content, kept on every edit that changed it. */
export type LearningRevision = { id: string; uploadId: string; version: number; title: string; summary: string | null; html: string; background: string; createdAt: string };
/** A page the owner adds to the Learning Dashboard sidebar, shown at /dashboard/learn/[slug]. */
export type LearningPage = { id: string; slug: string; title: string; description: string | null; icon: string; position: number; visible: boolean; createdAt: string; updatedAt: string };

type Option = { value: string; label: string };
export const SURFACES: (Option & { value: LearningSurface; help: string })[] = [
  { value: "dashboard", label: "Learning Dashboard", help: "Any page of the learners' dashboard, including your own new pages." },
  { value: "landing", label: "Landing page", help: "The public home page everyone sees first." },
  { value: "sign_in", label: "Sign in page", help: "Beside or under the sign-in form." },
  { value: "sign_up", label: "Sign up page", help: "Beside or under the sign-up form." },
  { value: "super_admin", label: "Super Admin dashboard", help: "A page of this admin dashboard, seen only by admins." },
];
/** A group of pages in the page picker, in the same order as the Learning Dashboard sidebar. */
export type PageGroup = "learning" | "professional" | "exams" | "account" | "custom";
export const PAGE_GROUPS: { value: PageGroup; label: string }[] = [
  { value: "learning", label: "Learning" }, { value: "professional", label: "Professional Learn" }, { value: "exams", label: "Preparation" },
  { value: "account", label: "Account" }, { value: "custom", label: "Your pages" },
];
/** A page an upload can go on; `keywords` are extra words the page picker's search matches. */
export type PageOption = Option & { group?: PageGroup; keywords?: string };
const page = (group: PageGroup, value: string, label: string, keywords = ""): PageOption => ({ value, label, group, keywords });
/**
 * Every Learning Dashboard page a learner can open from the sidebar, in sidebar order. Custom pages are added as
 * `learn:<slug>`. The exam pages are /dashboard/<category> (CATEGORY_LABELS in lib/study/preparations, which is not
 * imported here because it pulls in the catalogue).
 */
export const DASHBOARD_PAGES: PageOption[] = [
  page("learning", "dashboard", "Dashboard (home)", "home start overview"), page("learning", "library", "Library", "books catalogue"),
  page("learning", "search", "Search (AI)", "ai ask find"), page("learning", "step-by-step", "On The Go", "step by step guide"),
  page("learning", "notes", "Notes", "topic cards"), page("learning", "vocabulary", "Vocabulary", "words english hindi"),
  page("learning", "coffee-and-code", "Coffee & Code", "blog articles posts"),
  page("learning", "bookmark", "Bookmark", "saved favourites"),
  page("professional", "official-docs", "Official Docs", "documentation reference"), page("professional", "techy", "Techy", "technology"),
  page("professional", "api-docs", "API Docs", "reference endpoints"), page("professional", "workflow", "Workflow", "agents langchain"),
  page("professional", "certifications", "Certifications", "exam certificate aws roadmap"),
  page("professional", "lessons", "Lessons", "course"), page("professional", "quiz", "Quiz", "test practice"),
  page("professional", "interview", "Interview", "questions answers"),
  page("exams", "languages", "IELTS & Vocabulary", "english language"),
  page("exams", "technology", "Technology & Interviews", "coding"), page("exams", "system-design", "System Design", "architecture"),
  page("account", "plans", "Plans", "membership billing subscribe"), page("account", "settings", "Settings", "connections profile"),
];
export const SUPER_ADMIN_PAGES: Option[] = [
  { value: "all", label: "Every admin page" }, { value: "overview", label: "Overview" }, { value: "activity", label: "User activities" }, { value: "users", label: "Users & access" },
  { value: "suggestions", label: "Suggestion Box" }, { value: "billing", label: "Revenue & billing" }, { value: "transactions", label: "Transactions" },
  { value: "content", label: "Content & audit" }, { value: "notepad", label: "Notepad" }, { value: "upload-learning", label: "Upload Learning" },
];
const SINGLE: Record<Exclude<LearningSurface, "dashboard" | "super_admin">, Option[]> = {
  landing: [{ value: "home", label: "Home page" }], sign_in: [{ value: "sign-in", label: "Sign in" }], sign_up: [{ value: "sign-up", label: "Sign up" }],
};
/** The sections of a page an upload can go in, per surface. */
export const SECTIONS: Record<LearningSurface, Option[]> = {
  dashboard: [{ value: "top", label: "Top of the page, above its content" }, { value: "bottom", label: "Bottom of the page, below its content" }, { value: "main", label: "Main content (custom pages)" }],
  landing: [{ value: "after-slider", label: "Under the image slider" }, { value: "middle", label: "Middle, after the learning previews" }, { value: "before-plans", label: "Just before Plans" }, { value: "bottom", label: "Bottom, above the footer" }],
  sign_in: [{ value: "above-form", label: "Above the form" }, { value: "below-form", label: "Below the form" }],
  sign_up: [{ value: "above-form", label: "Above the form" }, { value: "below-form", label: "Below the form" }],
  super_admin: [{ value: "top", label: "Top of the page" }, { value: "bottom", label: "Bottom of the page" }],
};
export const LAYOUTS: (Option & { value: LearningLayout })[] = [
  { value: "card", label: "Card" }, { value: "banner", label: "Slim banner" }, { value: "full", label: "Full-width article" }, { value: "accordion", label: "Collapsible (click to open)" },
];
export const AUDIENCES: (Option & { value: LearningAudience })[] = [
  { value: "everyone", label: "Everyone" }, { value: "signed_out", label: "Only signed-out visitors" }, { value: "signed_in", label: "Only signed-in learners" }, { value: "members", label: "Only paying members and trials" },
];
export const TONES: (Option & { value: LearningTone; fill: string; edge: string })[] = [
  { value: "ivory", label: "Ivory", fill: "#fffdf7", edge: "#ece6d2" }, { value: "sky", label: "Sky", fill: "#f1f7fe", edge: "#cfe1f6" },
  { value: "mint", label: "Mint", fill: "#eff9f3", edge: "#c8e8d5" }, { value: "lavender", label: "Lavender", fill: "#f5f2fd", edge: "#ddd4f5" },
  { value: "rose", label: "Rose", fill: "#fdf2f4", edge: "#f4d0d9" }, { value: "peach", label: "Peach", fill: "#fef5ee", edge: "#f5dac6" }, { value: "butter", label: "Butter", fill: "#fefaea", edge: "#f1e3a8" },
];
export const DEVICES: (Option & { value: LearningDevice })[] = [
  { value: "all", label: "Every device" }, { value: "desktop", label: "Desktop and tablet only" }, { value: "mobile", label: "Phones only" },
];
export const LANGUAGES: (Option & { value: LearningLanguage })[] = [
  { value: "all", label: "Both languages" }, { value: "en", label: "Only when English is chosen" }, { value: "hi", label: "Only when Hindi (हिन्दी) is chosen" },
];
/** A call-to-action address must be a path on this site or an https link. */
export const isSafeCtaUrl = (url: string) => /^(\/(?!\/)|https:\/\/)[^\s<>"']{0,499}$/.test(url);
/** Rough reading time of an HTML document, for the admin list. */
export function readingMinutes(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Icon names a custom page can use in the sidebar (resolved to lucide icons by the sidebar). */
export const PAGE_ICONS = ["BookOpen", "GraduationCap", "Lightbulb", "Sparkles", "Rocket", "Brain", "Code2", "Layers", "Star", "Compass"] as const;

/** The pages of a surface, with the owner's custom pages added to the Learning Dashboard. */
export function surfacePages(surface: LearningSurface, custom: Pick<LearningPage, "slug" | "title">[] = []): PageOption[] {
  if (surface === "dashboard") return [...DASHBOARD_PAGES, ...custom.map(page => ({ value: `learn:${page.slug}`, label: `${page.title} (your page)`, group: "custom" as const }))];
  if (surface === "super_admin") return SUPER_ADMIN_PAGES;
  return SINGLE[surface];
}
/** A URL-safe slug for a custom page title. */
export const slugify = (title: string) => title.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 60);
export const isSurface = (value: string): value is LearningSurface => SURFACES.some(surface => surface.value === value);
