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

test("a card's Hindi meaning is hidden until that card's toggle is pressed", async () => {
  const user = userEvent.setup();
  const succinct = item("succinct");
  renderCards(["succinct"]);

  // The line is always in the DOM so the toggle's aria-controls has a target;
  // `hidden` is what closes it, for the eye and for a screen reader alike.
  expect(screen.getByText(succinct.vocabulary.hindi!)).not.toBeVisible();
  await user.click(screen.getByRole("button", { name: /Hindi meaning/ }));
  expect(screen.getByText(succinct.vocabulary.hindi!)).toBeVisible();

  // The same button puts it away again.
  await user.click(screen.getByRole("button", { name: /Hide Hindi meaning/ }));
  expect(screen.getByText(succinct.vocabulary.hindi!)).not.toBeVisible();
});

test("each card toggles only its own Hindi meaning", async () => {
  const user = userEvent.setup();
  const [first, second] = [item("succinct"), item("candid")];
  renderCards(["succinct", "candid"]);

  const toggles = screen.getAllByRole("button", { name: "Hindi meaning" });
  expect(toggles).toHaveLength(2);
  await user.click(toggles[0]);

  expect(screen.getByText(first.vocabulary.hindi!)).toBeVisible();
  expect(screen.getByText(second.vocabulary.hindi!)).not.toBeVisible();
});

test("a vocabulary card shows its word with a capital first letter", () => {
  renderCards(["succinct", "zig-zag"]);

  // Only the first letter: "zig-zag" must not become "Zig-Zag", which is why
  // this is not a `text-transform: capitalize`.
  expect(screen.getByText("Succinct")).toBeInTheDocument();
  expect(screen.getByText("Zig-zag")).toBeInTheDocument();
});
