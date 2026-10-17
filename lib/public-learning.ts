import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { INTERVIEW_TECHS, bankIds, loadInterviewBank, type InterviewTech } from "@/lib/interview-bank";
import type { QuestionSet } from "@/lib/interview-questions";
import { WORKFLOWS, type Workflow } from "@/lib/landing-workflows";
import { WORKFLOW_PREP } from "@/lib/workflow-prep";
import { loadMoreQuestions } from "@/lib/workflow-prep/questions";
import { API_PACKAGES, API_TYPES } from "@/lib/api-docs";
import { officialApiCard } from "@/lib/server/official-content";
import type { OfficialCard } from "@/lib/official-content/card";
import { ENGLISH_EXAM_VOCABULARY } from "@/lib/pro-learn/english-exam-vocabulary";
import { TECHNOLOGY_HANDBOOKS, type TechnologyHandbook } from "@/lib/pro-learn/technology-handbooks";

/**
 * The public learning library: the dashboard's interview banks, workflow blueprints, API reference, vocabulary
 * and technology handbooks, published as indexable pages. Every route here is prerendered from these catalogues,
 * so the page list, the sitemap and generateStaticParams all read the same functions.
 *
 * Question banks are code-split modules; their loaders are cached with `use cache` (lifetime `max`, tagged), so a
 * content release can refresh them with revalidateTag("interview-bank") or revalidateTag("workflow-questions").
 */

/** URL-safe slug: lower case, accents and symbols stripped, words joined by hyphens. */
export function slugify(value: string): string {
  return value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\+/g, " plus ").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

// ---------- Interview questions ----------
export const interviewTechs = (): InterviewTech[] => INTERVIEW_TECHS;
export const interviewTech = (id: string) => INTERVIEW_TECHS.find(tech => tech.id === id);

/** Every bank behind a technology (one per tab for split technologies), with its tab title when there is one. */
export async function interviewBanks(tech: InterviewTech): Promise<{ title: string; tagline: string; set: QuestionSet }[]> {
  "use cache";
  cacheLife("max");
  cacheTag("interview-bank", `interview-bank:${tech.id}`);
  return Promise.all(bankIds(tech).map(async (id, index) => {
    const tab = tech.tabs?.[index];
    return { title: tab?.title ?? tech.title, tagline: tab?.tagline ?? tech.tagline, set: await loadInterviewBank(id) };
  }));
}

// ---------- Workflow blueprints ----------
export const workflows = (): Workflow[] => WORKFLOWS;
export const workflow = (id: string) => WORKFLOWS.find(item => item.id === id);
export const workflowPrep = (id: string) => WORKFLOW_PREP[id];

/** A blueprint's full question set: the three-and-three that ship with its detail plus its longer bank. */
export async function workflowQuestions(id: string): Promise<QuestionSet> {
  "use cache";
  cacheLife("max");
  cacheTag("workflow-questions", `workflow-questions:${id}`);
  const base = WORKFLOW_PREP[id] ?? { subjective: [], objective: [] };
  const more = await loadMoreQuestions(id);
  return { subjective: [...base.subjective, ...more.subjective], objective: [...base.objective, ...more.objective] };
}

// ---------- API reference ----------
export const apiPackages = () => API_PACKAGES;
export const apiPackage = (id: string) => API_PACKAGES.find(pkg => pkg.id === id);
export const apiTypes = () => API_TYPES;

export type ApiEntryPage = { name: string; kind: string; status: string; slug: string; card: OfficialCard | null };
/**
 * A package's identifiers, each with a URL slug unique within the package and its verified official card when one
 * exists. Only identifiers with a card get their own page; the rest are listed on the package page. Cached for a
 * day and tagged, so regenerated content can be published with revalidateTag("api-reference").
 */
export async function apiPackageEntries(packageId: string): Promise<ApiEntryPage[]> {
  "use cache";
  cacheLife("days");
  cacheTag("api-reference", `api-reference:${packageId}`);
  const pkg = apiPackage(packageId);
  if (!pkg) return [];
  const used = new Set<string>();
  return pkg.entries.map(entry => {
    const base = slugify(entry.name) || "entry";
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return { ...entry, slug, card: officialApiCard(pkg.id, entry.name) ?? null };
  });
}

// ---------- Vocabulary ----------
export type VocabularyGroup = { slug: string; name: string; words: typeof ENGLISH_EXAM_VOCABULARY };
export function vocabularyGroups(): VocabularyGroup[] {
  const groups = new Map<string, VocabularyGroup>();
  for (const word of ENGLISH_EXAM_VOCABULARY) {
    const slug = slugify(word.category);
    const group = groups.get(slug) ?? { slug, name: word.category, words: [] };
    group.words.push(word);
    groups.set(slug, group);
  }
  return [...groups.values()];
}
export const vocabularyGroup = (slug: string) => vocabularyGroups().find(group => group.slug === slug);

// ---------- Technology handbooks ----------
/** The handbook's short name: its title before the em dash, e.g. "React 19+". */
export const handbookName = (handbook: TechnologyHandbook) => handbook.title.split(" — ")[0];
export const handbookSlug = (handbook: TechnologyHandbook) => slugify(handbook.title);
/** Handbooks with a unique slug and at least one topic; the vocabulary handbook has its own section. */
export function handbooks(): TechnologyHandbook[] {
  const seen = new Set<string>();
  return TECHNOLOGY_HANDBOOKS.filter(handbook => {
    const slug = handbookSlug(handbook);
    if (!handbook.topics.length || seen.has(slug) || handbook.topics.some(topic => "vocabulary" in topic && topic.vocabulary)) return false;
    seen.add(slug);
    return true;
  });
}
export const handbook = (slug: string) => handbooks().find(item => handbookSlug(item) === slug);
