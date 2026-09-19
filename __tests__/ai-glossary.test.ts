import { aiCategories, aiTerms } from "@/lib/pro-learn/ai-glossary";

test("every requested term is present exactly once, with a category and a definition", () => {
  const terms = aiTerms();
  expect(terms).toHaveLength(39);
  const names = terms.map(term => term.name);
  expect(new Set(names).size).toBe(names.length);

  for (const term of terms) {
    expect(Object.keys(term).sort()).toEqual(["category", "name", "summary"]);
    expect(term.category).toBeTruthy();
    // Long enough to actually define the term, short enough for a card.
    expect(term.summary.length).toBeGreaterThan(40);
    expect(term.summary.length).toBeLessThanOrEqual(190);
  }
});

test("the counts on the tabs add up to the catalogue", () => {
  const terms = aiTerms();
  const categories = aiCategories();
  expect(categories.reduce((total, category) => total + category.count, 0)).toBe(terms.length);
  // Every category named by a tab actually holds the terms it claims.
  for (const category of categories) {
    expect(terms.filter(term => term.category === category.name)).toHaveLength(category.count);
  }
});
