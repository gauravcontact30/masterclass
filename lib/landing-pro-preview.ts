import { API_PACKAGES, API_STATUSES, API_TYPES } from "./api-docs";
import { TECHY_PUZZLES } from "./techy-additional-examples";
import { TECHY_TOPICS, TECHY_VOCABULARY } from "./techy-content";

export type LandingTechyTopic = { id: string; title: string; category: string; summary: string; feature: string; question: string; answer: string; questionCount: number };
export type LandingApiPackage = { id: string; name: string; icon: string; accent: string; count: number; sample: { name: string; kind: string }[] };
export type LandingProPreview = {
  techy: { topics: LandingTechyTopic[]; questionCount: number; vocabularyCount: number; puzzleCount: number };
  api: { packages: LandingApiPackage[]; identifierCount: number; types: { k: string; label: string; c: string }[]; statusCount: number };
};

/**
 * Server-only summary of the dashboard Techy and API Docs libraries. The full
 * catalogs are large, so the landing page receives only counts and samples.
 */
export function landingProPreview(): LandingProPreview {
  return {
    techy: {
      topics: TECHY_TOPICS.map(topic => ({ id: topic.id, title: topic.title, category: topic.category, summary: topic.summary, feature: topic.features[0] ?? "", question: topic.questions[0]?.question ?? "", answer: topic.questions[0]?.answer ?? "", questionCount: topic.questions.length })),
      questionCount: TECHY_TOPICS.reduce((sum, topic) => sum + topic.questions.length, 0),
      vocabularyCount: TECHY_VOCABULARY.length,
      puzzleCount: TECHY_PUZZLES.length,
    },
    api: {
      packages: API_PACKAGES.map(pkg => ({ id: pkg.id, name: pkg.name, icon: pkg.icon, accent: pkg.accent, count: pkg.entries.length, sample: pkg.entries.slice(0, 12).map(({ name, kind }) => ({ name, kind })) })),
      identifierCount: API_PACKAGES.reduce((sum, pkg) => sum + pkg.entries.length, 0),
      types: API_TYPES,
      statusCount: API_STATUSES.length,
    },
  };
}
