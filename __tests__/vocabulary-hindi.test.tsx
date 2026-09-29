import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

test("a card's Hindi meaning replaces its English one when the card is switched", async () => {
  const user = userEvent.setup();
  const succinct = item("succinct");
  renderCards(["succinct"]);

  // The gloss is swapped in, not revealed below: an appended panel grew the
  // card and, through the grid's equal-height rows, every card beside it.
  expect(screen.queryByText(succinct.vocabulary.hindi!)).not.toBeInTheDocument();
  expect(screen.getByText(succinct.vocabulary.meaning)).toBeVisible();

  await user.click(screen.getByRole("button", { name: "Hi" }));
  expect(screen.getByText(succinct.vocabulary.hindi!)).toBeVisible();
  expect(screen.queryByText(succinct.vocabulary.meaning)).not.toBeInTheDocument();

  // The same switch puts it back.
  await user.click(screen.getByRole("button", { name: "En" }));
  expect(screen.getByText(succinct.vocabulary.meaning)).toBeVisible();
});

test("each card switches only its own language", async () => {
  const user = userEvent.setup();
  const [first, second] = [item("succinct"), item("candid")];
  renderCards(["succinct", "candid"]);

  const switches = screen.getAllByRole("button", { name: "Hi" });
  expect(switches).toHaveLength(2);
  await user.click(switches[0]);

  expect(screen.getByText(first.vocabulary.hindi!)).toBeVisible();
  // Its neighbour is untouched, still showing the English meaning.
  expect(screen.queryByText(second.vocabulary.hindi!)).not.toBeInTheDocument();
  expect(screen.getByText(second.vocabulary.meaning)).toBeVisible();
});

test("a vocabulary card shows its word with a capital first letter", () => {
  renderCards(["succinct", "zig-zag"]);

  // Only the first letter: "zig-zag" must not become "Zig-Zag", which is why
  // this is not a `text-transform: capitalize`.
  expect(screen.getByText("Succinct")).toBeInTheDocument();
  expect(screen.getByText("Zig-zag")).toBeInTheDocument();
});
