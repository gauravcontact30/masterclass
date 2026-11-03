import { API_CATEGORIES, API_PACKAGES, API_TYPES } from "./api-docs";
import { brandAssetFor } from "./media";
import { FIELD_GUIDES, fieldGuide } from "./api-field-guides";
import { pickDaily, rotateDaily, takeDaily } from "./daily-rotation";
import { TECHY_PUZZLES } from "./techy-additional-examples";
import { POLYGLOT, type PolyglotConcept } from "./landing-polyglot";
import { TECHY_TOPICS, TECHY_VOCABULARY } from "./techy-content";

export type LandingTechyTopic = { id: string; title: string; category: string; summary: string; feature: string; question: string; answer: string; questionNumber: number; questionCount: number };
export type LandingPuzzle = { title: string; code: string; output: string; explanation: string };
/** One technology in the landing API Docs section: five short entries to read, then disabled names of the rest. */
export type LandingApiGuide = {
  id: string; name: string; logo: string; tagline: string; version?: string; install?: string; count: number;
  free: { name: string; kind: string; summary: string; signature: string }[];
  locked: { name: string; kind: string }[];
};
/** Every technology, for choosing one. Technologies without a field guide load their entries on demand (/api/landing/api-guides). */
export type LandingApiTech = { id: string; name: string; logo: string | null; icon: string; count: number; category: string };
export type LandingProPreview = {
  techy: { topics: LandingTechyTopic[]; questionCount: number; vocabularyCount: number; puzzleCount: number; puzzles: LandingPuzzle[]; polyglot: PolyglotConcept };
  api: { guides: LandingApiGuide[]; technologies: LandingApiTech[]; categories: { id: string; label: string }[]; identifierCount: number; technologyCount: number; types: { k: string; label: string; c: string }[] };
};

/**
 * Server-only summary of the dashboard Techy and API Docs libraries. The full
 * catalogs are large, so the landing page receives only counts and samples.
 *
 * `day` (the IST week number) turns the preview over: the topic and technology shown first, each topic's feature and
 * interview question, each technology's locked names and the week's code puzzles. The default, 0, keeps the full ledger
 * stable. API Docs sends short descriptions only: in-depth pages are for subscribers, and the site does not link out.
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
      polyglot: pickDaily(POLYGLOT, day),
      puzzles: takeDaily(TECHY_PUZZLES, day, TECHY_PUZZLES.length).map(({ title, code, output, explanation }) => ({ title, code, output, explanation })),
    },
    api: {
      guides: rotateDaily(FIELD_GUIDES, day).flatMap(guide => {
        const pkg = API_PACKAGES.find(item => item.id === guide.id);
        if (!pkg) return [];
        const kinds = new Map(pkg.entries.map(entry => [entry.name, entry.kind]));
        const free = guide.essentials.filter(item => kinds.has(item.name));
        const open = new Set(free.map(item => item.name));
        return [{
          id: guide.id, name: guide.name, logo: guide.logo, tagline: guide.tagline, version: guide.version, install: guide.install, count: pkg.entries.length,
          free: free.map(item => ({ ...item, kind: kinds.get(item.name) ?? "" })),
          locked: takeDaily(pkg.entries.filter(entry => !open.has(entry.name)), day, 8).map(({ name, kind }) => ({ name, kind })),
        }];
      }),
      technologies: API_CATEGORIES.flatMap(category => category.packages.flatMap(id => {
        const pkg = API_PACKAGES.find(item => item.id === id);
        return pkg ? [{ id, name: pkg.name, logo: fieldGuide(id)?.logo ?? brandAssetFor(pkg.name)?.src ?? null, icon: pkg.icon, count: pkg.entries.length, category: category.id }] : [];
      })),
      categories: API_CATEGORIES.map(({ id, label }) => ({ id, label })),
      identifierCount: API_PACKAGES.reduce((sum, pkg) => sum + pkg.entries.length, 0),
      technologyCount: API_PACKAGES.length,
      types: API_TYPES,
    },
  };
}
