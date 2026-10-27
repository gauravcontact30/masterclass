import { INTERVIEW_BANK, PRO_TRACKS, type InterviewItem, type ProTrack } from "./types";

/**
 * Lessons, Quiz and Mentors all present the same tracks, so they share one
 * grouping. A family is a teaching neighbourhood, not a vendor category: the
 * question it answers is "what am I trying to get better at today?".
 */
export type TrackFamily = { id: string; name: string; blurb: string; icon: string; trackIds: string[] };

export const TRACK_FAMILIES: TrackFamily[] = [
  { id: "ai", name: "AI & agents", icon: "🧠", blurb: "Models, tool use and the systems built around them.", trackIds: ["ai", "aitools", "agents", "langchain", "langgraph", "langsmith", "langflow", "n8n"] },
  { id: "jvm", name: "Java, C++ & DSA", icon: "☕", blurb: "In-depth courses: Java from basics to Spring Boot, modern C++ and interview DSA.", trackIds: ["core-java", "advanced-java", "spring-boot", "java-basic-to-advanced", "cpp", "dsa"] },
  { id: "frontend", name: "Frontend frameworks", icon: "▲", blurb: "Rendering, routing and the shape of a modern app.", trackIds: ["nextjs", "react", "angular", "vue", "flutter", "t3"] },
  { id: "languages", name: "Languages & fundamentals", icon: "⌨️", blurb: "The syntax and semantics everything else is built on.", trackIds: ["typescript", "javascript", "jspuzzles", "python", "rust", "go"] },
  { id: "state", name: "State & data on the client", icon: "🔄", blurb: "Where state lives and how the server reaches the UI.", trackIds: ["tanstack", "zustand", "redux"] },
  { id: "backend", name: "Backend & APIs", icon: "🔌", blurb: "Servers, contracts and the work behind a response.", trackIds: ["node", "express", "nestjs", "fastapi", "django", "graphql"] },
  { id: "validation", name: "Validation & forms", icon: "✅", blurb: "Trusting input before it reaches your business logic.", trackIds: ["zod", "conform", "pydantic"] },
  { id: "auth", name: "Authentication", icon: "🔐", blurb: "Sessions, providers and who is allowed to do what.", trackIds: ["authjs", "clerk", "kinde", "betterauth"] },
  { id: "database", name: "Databases & storage", icon: "🗄️", blurb: "Schemas, queries, caching and serverless data.", trackIds: ["postgresql", "supabase", "drizzle", "prisma", "neon", "redis", "upstash"] },
  { id: "pythondata", name: "Python data & ML", icon: "📊", blurb: "Arrays, dataframes, models and the charts that explain them.", trackIds: ["numpy", "pandas", "polars", "scipy", "sklearn", "tensorflow", "pytorch", "keras", "seaborn", "plotly"] },
  { id: "http", name: "HTTP & scraping", icon: "🌐", blurb: "Talking to other people's services, politely and reliably.", trackIds: ["requests", "httpx", "scrapy"] },
  { id: "testing", name: "Testing & quality", icon: "🧪", blurb: "Proving it works before someone else finds out it doesn't.", trackIds: ["jest", "vitest", "rtl", "playwright", "cypress"] },
  { id: "platform", name: "Cloud, ops & architecture", icon: "☁️", blurb: "Shipping it, scaling it and keeping it standing up.", trackIds: ["aws", "devops", "docker", "kubernetes", "linux", "git", "inngest", "arcjet", "systemdesign"] },
];

const familyByTrack = new Map(TRACK_FAMILIES.flatMap(family => family.trackIds.map(id => [id, family] as const)));
export const familyOfTrack = (trackId: string | null | undefined) => (trackId ? familyByTrack.get(trackId) ?? null : null);

/** Families holding at least one of the given tracks, in taxonomy order. */
export function groupTracksByFamily(tracks: readonly ProTrack[] = PRO_TRACKS): { family: TrackFamily; tracks: ProTrack[] }[] {
  const allowed = new Set(tracks.map(track => track.id));
  return TRACK_FAMILIES
    .map(family => ({ family, tracks: family.trackIds.map(id => tracks.find(track => track.id === id)).filter((track): track is ProTrack => Boolean(track) && allowed.has(track!.id)) }))
    .filter(group => group.tracks.length > 0);
}

/**
 * Interview questions are grouped by what an interviewer is actually probing,
 * so a candidate can revise one area at a time instead of a shuffled list.
 */
export type InterviewArea = { id: string; name: string; blurb: string; categories: string[] };

export const INTERVIEW_AREAS: InterviewArea[] = [
  { id: "language", name: "Languages & the browser", blurb: "The everyday questions that open almost every front-end loop.", categories: ["JavaScript", "TypeScript", "CSS", "Web"] },
  { id: "framework", name: "Frameworks & runtime", blurb: "How the tools you list on your CV actually behave under load.", categories: ["React", "Node.js"] },
  { id: "cs", name: "Computer science", blurb: "Complexity, data structures and the reasoning behind your choice.", categories: ["Algorithms", "Data Structures"] },
  { id: "systems", name: "Systems & data", blurb: "Designing for scale, and the storage decisions underneath it.", categories: ["System Design", "Databases"] },
  { id: "behavioural", name: "Behaviour & experience", blurb: "Your judgement, your trade-offs and the way you tell the story.", categories: ["Behavioral"] },
];

const areaByCategory = new Map(INTERVIEW_AREAS.flatMap(area => area.categories.map(category => [category, area] as const)));
export const areaOfCategory = (category: string) => areaByCategory.get(category) ?? null;

/** Areas, then categories within them, keeping only what the current filters left. */
export function groupQuestionsByArea(items: readonly InterviewItem[] = INTERVIEW_BANK) {
  return INTERVIEW_AREAS
    .map(area => ({
      area,
      categories: area.categories
        .map(category => ({ category, items: items.filter(item => item.cat === category) }))
        .filter(group => group.items.length > 0),
    }))
    .filter(group => group.categories.length > 0)
    .map(group => ({ ...group, total: group.categories.reduce((sum, category) => sum + category.items.length, 0) }));
}
