import { API_PACKAGES, API_STATUSES, API_TYPES } from "./api-docs";
import { API_DETAILS } from "./api-docs-details";
import { pickDaily, rotateDaily, takeDaily } from "./daily-rotation";
import { TECHY_PUZZLES } from "./techy-additional-examples";
import { POLYGLOT, type PolyglotConcept } from "./landing-polyglot";
import { TECHY_TOPICS, TECHY_VOCABULARY } from "./techy-content";

export type LandingTechyTopic = { id: string; title: string; category: string; summary: string; feature: string; question: string; answer: string; questionNumber: number; questionCount: number };
export type LandingPuzzle = { title: string; code: string; output: string; explanation: string };
export type LandingApiPackage = { id: string; name: string; icon: string; accent: string; count: number; sample: { name: string; kind: string; status: string }[] };
/** One identifier from the dashboard's API Docs, in full: what the landing "API of the week" card shows. */
export type LandingApiSpotlight = {
  name: string; packageName: string; description: string; signature: string; parameters: { name: string; type: string; description: string }[];
  returns: string; notes: string[]; code: string; language: string; related: string[];
};
export type LandingProPreview = {
  techy: { topics: LandingTechyTopic[]; questionCount: number; vocabularyCount: number; puzzleCount: number; puzzles: LandingPuzzle[]; polyglot: PolyglotConcept };
  api: { packages: LandingApiPackage[]; identifierCount: number; types: { k: string; label: string; c: string }[]; statusCount: number; statuses: { id: string; label: string }[]; spotlight: LandingApiSpotlight | null };
};

/** Identifiers with a complete entry (signature, parameters and example), so the weekly spotlight is never thin. */
const SPOTLIGHTS = Object.entries(API_DETAILS).filter(([, detail]) => detail.signature && detail.code && detail.code.length < 900 && detail.parameters.length);

/**
 * Server-only summary of the dashboard Techy and API Docs libraries. The full
 * catalogs are large, so the landing page receives only counts and samples.
 *
 * `day` (the IST week number) turns the preview over: the topic and technology shown first, each topic's feature and
 * interview question, each technology's sample identifiers, the API of the week and the week's code puzzles.
 * The default, 0, keeps the full ledger stable. Official-site links (`source`) are never sent: the site does not link out.
 */
export function landingProPreview(day = 0): LandingProPreview {
  const spotlight = SPOTLIGHTS.length ? pickDaily(SPOTLIGHTS, day) : null;
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
      packages: rotateDaily(API_PACKAGES, day).map(pkg => ({ id: pkg.id, name: pkg.name, icon: pkg.icon, accent: pkg.accent, count: pkg.entries.length, sample: takeDaily(pkg.entries, day, 12).map(({ name, kind, status }) => ({ name, kind, status })) })),
      identifierCount: API_PACKAGES.reduce((sum, pkg) => sum + pkg.entries.length, 0),
      types: API_TYPES,
      statusCount: API_STATUSES.length,
      statuses: API_STATUSES,
      spotlight: spotlight && {
        name: spotlight[0], packageName: spotlight[1].packageName, description: spotlight[1].description, signature: spotlight[1].signature,
        parameters: spotlight[1].parameters.slice(0, 4), returns: spotlight[1].returns, notes: spotlight[1].notes.slice(0, 3),
        code: spotlight[1].code, language: spotlight[1].language, related: spotlight[1].related.slice(0, 5),
      },
    },
  };
}
