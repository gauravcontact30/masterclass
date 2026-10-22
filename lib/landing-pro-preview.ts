import { API_PACKAGES, API_STATUSES, API_TYPES } from "./api-docs";
import { pickDaily, rotateDaily, takeDaily } from "./daily-rotation";
import { TECHY_PUZZLES } from "./techy-additional-examples";
import { TECHY_TOPICS, TECHY_VOCABULARY } from "./techy-content";

export type LandingTechyTopic = { id: string; title: string; category: string; summary: string; feature: string; question: string; answer: string; questionNumber: number; questionCount: number };
export type LandingApiPackage = { id: string; name: string; icon: string; accent: string; count: number; sample: { name: string; kind: string }[] };
export type LandingProPreview = {
  techy: { topics: LandingTechyTopic[]; questionCount: number; vocabularyCount: number; puzzleCount: number };
  api: { packages: LandingApiPackage[]; identifierCount: number; types: { k: string; label: string; c: string }[]; statusCount: number };
};

/**
 * Server-only summary of the dashboard Techy and API Docs libraries. The full
 * catalogs are large, so the landing page receives only counts and samples.
 *
 * `day` (istDay) turns the preview over daily: the topic and technology shown first, each topic's feature and
 * interview question, and each technology's sample identifiers. The default, 0, keeps the full ledger stable.
 */
export function landingProPreview(day = 0): LandingProPreview {
  return {
    techy: {
      topics: rotateDaily(TECHY_TOPICS, day).map(topic => {
        const index = topic.questions.length ? day % topic.questions.length : 0;
        return { id: topic.id, title: topic.title, category: topic.category, summary: topic.summary, feature: topic.features.length ? pickDaily(topic.features, day) : "", question: topic.questions[index]?.question ?? "", answer: topic.questions[index]?.answer ?? "", questionNumber: index + 1, questionCount: topic.questions.length };
      }),
      questionCount: TECHY_TOPICS.reduce((sum, topic) => sum + topic.questions.length, 0),
      vocabularyCount: TECHY_VOCABULARY.length,
      puzzleCount: TECHY_PUZZLES.length,
    },
    api: {
      packages: rotateDaily(API_PACKAGES, day).map(pkg => ({ id: pkg.id, name: pkg.name, icon: pkg.icon, accent: pkg.accent, count: pkg.entries.length, sample: takeDaily(pkg.entries, day, 12).map(({ name, kind }) => ({ name, kind })) })),
      identifierCount: API_PACKAGES.reduce((sum, pkg) => sum + pkg.entries.length, 0),
      types: API_TYPES,
      statusCount: API_STATUSES.length,
    },
  };
}
