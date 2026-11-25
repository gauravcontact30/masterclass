import { render, screen } from "@testing-library/react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { ENGLISH_EXAM_VOCABULARY } from "@/lib/pro-learn/english-exam-vocabulary";

test("every word in the handbook carries a Hindi meaning written in Devanagari", () => {
  for (const entry of ENGLISH_EXAM_VOCABULARY) {
    expect(entry.hindi).toBeTruthy();
    // Devanagari rather than a romanisation: the toggle exists so a Hindi
    // reader can read Hindi.
    expect(entry.hindi).toMatch(/[ऀ-ॿ]/);
  }
});

const item = (word: string) => {
  const entry = ENGLISH_EXAM_VOCABULARY.find(row => row.word === word)!;
  return { name: entry.word, category: entry.category, summary: entry.meaning, vocabulary: entry };
};

function renderCards(words: string[]) {
  render(<CatalogBrowser id="vocab" title="Vocabulary" description="Words" noun="words"
    items={words.map(item)} categories={[]} itemIcon={() => null} categoryIcon={() => null}
    question={row => row.name} onAsk={() => {}} />);
}

// Vocabulary cards read in English only (components/catalog-browser.tsx): the per-card Hindi switch was retired,
// and the Hindi meaning stays in the data for search and for the word lookups that still use it.
test("cards show the English meaning and offer no per-card Hindi switch", () => {
  const [first, second] = [item("succinct"), item("candid")];
  renderCards(["succinct", "candid"]);
  expect(screen.getByText(first.vocabulary.meaning)).toBeVisible();
  expect(screen.getByText(second.vocabulary.meaning)).toBeVisible();
  expect(screen.queryByText(first.vocabulary.hindi!)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Hi" })).not.toBeInTheDocument();
});

test("a vocabulary card shows its word with a capital first letter", () => {
  renderCards(["succinct", "zig-zag"]);

  // Only the first letter: "zig-zag" must not become "Zig-Zag", which is why
  // this is not a `text-transform: capitalize`.
  expect(screen.getByText("Succinct")).toBeInTheDocument();
  expect(screen.getByText("Zig-zag")).toBeInTheDocument();
});
