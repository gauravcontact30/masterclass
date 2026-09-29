import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";

const TITLE = "English Corporate & Speaking Words — Workplace Vocabulary";
/** The hand-curated workplace categories, which every import must leave intact. */
const CURATED = [
  "Workplace speaking", "Corporate vocabulary", "Professional tone", "Leadership & strategy",
  "Meetings & negotiation", "Writing & presentations", "People & culture", "Business analysis",
  "Synonyms & precision", "Antonyms & contrast",
];

test("the curated workplace categories each keep their 30 unique words", () => {
  const handbook = TECHNOLOGY_HANDBOOKS.find(item => item.title === TITLE);
  expect(handbook).toBeDefined();
  expect(handbook!.topics.length).toBeGreaterThanOrEqual(300);

  for (const category of CURATED) {
    const words = handbook!.topics.filter(item => item.category === category).map(item => item.name);
    expect(words).toHaveLength(30);
    expect(new Set(words).size).toBe(words.length);
  }
});

test("imported words are filed under their own categories and never duplicate a word", () => {
  const handbook = TECHNOLOGY_HANDBOOKS.find(item => item.title === TITLE);
  const names = handbook!.topics.map(item => item.name);
  expect(new Set(names).size).toBe(names.length);
  // Every topic belongs to a category the handbook actually advertises.
  const advertised = new Set(handbook!.categories.map(category => category.name));
  expect(handbook!.topics.every(item => advertised.has(item.category))).toBe(true);
});

test("every vocabulary card can show at least three synonyms and three antonyms", () => {
  const handbook = TECHNOLOGY_HANDBOOKS.find(item => item.title === TITLE);
  expect(handbook?.topics.every(topic =>
    (topic.vocabulary?.synonyms.length ?? 0) >= 3 && (topic.vocabulary?.antonyms.length ?? 0) >= 3,
  )).toBe(true);
});

test("the IELTS Exam Prep handbook is gone from the search page catalogue", () => {
  expect(TECHNOLOGY_HANDBOOKS.some(item => item.title.includes("IELTS"))).toBe(false);
});

/** The corporate-communication categories added as a second set of ten, held to 30 each like the originals. */
const CORPORATE = [
  "Email & written etiquette", "Client relations", "Project delivery", "Performance & feedback",
  "Conflict & diplomacy", "Innovation & change", "Decision-making & judgement", "Teamwork & collaboration",
  "Sales & persuasion", "Ethics & governance",
];

test("the corporate-communication categories each keep their 30 unique words", () => {
  const handbook = TECHNOLOGY_HANDBOOKS.find(item => item.title === TITLE);
  for (const category of CORPORATE) {
    const words = handbook!.topics.filter(item => item.category === category).map(item => item.name);
    expect(words).toHaveLength(30);
    expect(new Set(words).size).toBe(words.length);
  }
});

/**
 * The B2B glossary imported from preply.com's business-English guide.
 *
 * Filed under its own categories rather than folded into the curated thirties
 * above, so an import can grow without disturbing a hand-built set — and so a
 * reader looking for corporate terms finds a tab, not a scattering.
 */
const B2B = [
  "B2B business essentials", "Corporate finance & metrics", "Hiring & people operations",
  "Marketing & digital growth", "Planning & product delivery",
];

test("the B2B business categories are present and carry the terms they name", () => {
  const handbook = TECHNOLOGY_HANDBOOKS.find(item => item.title === TITLE)!;
  const advertised = new Set(handbook.categories.map(category => category.name));
  for (const category of B2B) expect(advertised.has(category)).toBe(true);

  const words = new Set(handbook.topics.filter(item => B2B.includes(item.category)).map(item => item.name));
  expect(words.size).toBe(47);
  // An acronym keeps its own capitals, so a card shows "KPI" and not "Kpi".
  for (const acronym of ["B2B", "B2C", "HR", "IPO", "KPI", "ROI", "PPC"]) expect(words.has(acronym)).toBe(true);
  // A term of several words is one entry, looked up and studied as one thing.
  for (const phrase of ["market share", "business model", "job description", "senior management team",
    "social media marketing", "risk management", "strategic planning"]) expect(words.has(phrase)).toBe(true);
});

test("the imported terms leave the curated thirties untouched", () => {
  const handbook = TECHNOLOGY_HANDBOOKS.find(item => item.title === TITLE)!;
  for (const category of [...CURATED, ...CORPORATE]) {
    expect(handbook.topics.filter(item => item.category === category)).toHaveLength(30);
  }
});
