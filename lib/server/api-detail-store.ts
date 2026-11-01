import "server-only";
import type { ApiEntry, ApiPackage } from "@/lib/api-docs";
import { API_DETAILS } from "@/lib/api-docs-details";
import { enrichApiLearning } from "@/lib/api-learning";
import { isCatalogCourse } from "@/lib/deep-courses/catalog";
import { officialApiDetail } from "@/lib/official-content/apply";
import type { CodeLanguage } from "@/lib/code-highlight";
import type { GeneratedApiDetail } from "@/lib/pro-learn/types";
import { catalogReference, hasAuthoredReference } from "./api-reference-fallback";
import { apiQuestionBank } from "./api-question-bank";
import { cachedCourseOutline } from "./course-generator";
import { officialApiCard } from "./official-content";

/** A pill under "Learn <package> in the app". */
export type LearnTopic = { title: string; href: string; soon?: boolean };
/**
 * What an API Docs page shows. `written`: a pre-generated page. `summary`: only the catalogue's facts, because this
 * identifier's page has not been written yet. Opening a page never generates anything (user rule 2026-10-30).
 */
export type StoredApiPage = { detail: GeneratedApiDetail; language: CodeLanguage; status: "written" | "summary"; seeAlso: string[]; learn: LearnTopic[] };

const isWritten = (pkg: ApiPackage, name: string) => !!API_DETAILS[`${pkg.id}:${name}`] || !!officialApiCard(pkg.id, name) || hasAuthoredReference(pkg.id, name);

/** Packages whose lessons live in another technology's course. */
const COURSE_OF: Record<string, string> = { deepagents: "langchain", integrations: "langchain" };

/** "polars.col" and "pl.col" are the same identifier: official pages use the full path, the catalogue the short one. */
const shortName = (name: string) => name.toLowerCase().replace(/\(\)$/, "").split(".").at(-1) ?? name.toLowerCase();

/** Every other identifier of the package: related first, then the same kind, then the rest; written pages before summaries. */
function seeAlsoFor(pkg: ApiPackage, entry: ApiEntry, related: readonly string[]) {
  const wanted = related.map(shortName);
  const rank = (item: ApiEntry) => (isWritten(pkg, item.name) ? 0 : 4) + (wanted.includes(shortName(item.name)) ? 0 : item.kind === entry.kind ? 1 : 2);
  return pkg.entries.filter(item => item.name !== entry.name).map((item, at) => ({ item, at })).sort((a, b) => rank(a.item) - rank(b.item) || a.at - b.at).map(({ item }) => item.name);
}

/** The course's written lessons, its core topics (which open the course), then lessons still being written. */
async function learnTopicsFor(pkg: ApiPackage): Promise<LearnTopic[]> {
  const course = COURSE_OF[pkg.id] ?? pkg.id;
  const known = isCatalogCourse(course);
  const lessons = known ? await cachedCourseOutline(course).catch(() => []) : [];
  const seen = new Set<string>();
  const lesson = (topic: { id: string; title: string }) => ({ title: topic.title, href: `/learning/lessons/${encodeURIComponent(course)}/${encodeURIComponent(topic.id)}` });
  return [
    ...lessons.filter(topic => topic.written).map(lesson),
    ...pkg.topics.map(title => ({ title, href: known ? `/learning/lessons/${encodeURIComponent(course)}` : "/learning/lessons" })),
    ...lessons.filter(topic => !topic.written).map(topic => ({ ...lesson(topic), soon: true })),
  ].filter(topic => { const key = topic.title.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
}

export async function storedApiPage(pkg: ApiPackage, entry: ApiEntry): Promise<StoredApiPage> {
  const curated = API_DETAILS[`${pkg.id}:${entry.name}`];
  const official = curated ? undefined : officialApiCard(pkg.id, entry.name);
  const base = curated ?? (official ? officialApiDetail(official, catalogReference(pkg, entry)) : catalogReference(pkg, entry));
  const detail = enrichApiLearning(pkg, entry, base);
  const bank = apiQuestionBank(pkg, entry);
  return {
    // The package's whole bank when it has one; the page's own few questions otherwise.
    detail: { ...detail, subjective: bank.subjective.length > detail.subjective.length ? bank.subjective : detail.subjective, objective: bank.objective.length > detail.objective.length ? bank.objective : detail.objective },
    language: base.language as CodeLanguage,
    status: curated || official || hasAuthoredReference(pkg.id, entry.name) ? "written" : "summary",
    seeAlso: seeAlsoFor(pkg, entry, base.related),
    learn: await learnTopicsFor(pkg),
  };
}
