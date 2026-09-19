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
