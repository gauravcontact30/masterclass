import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { ENGLISH_EXAM_VOCABULARY } from "@/lib/pro-learn/english-exam-vocabulary";

const item = (word: string) => {
  const entry = ENGLISH_EXAM_VOCABULARY.find(row => row.word === word)!;
  return { name: entry.word, category: entry.category, summary: entry.meaning, vocabulary: entry };
};
const words = ["succinct", "candid"];
function renderCards(id = "vocab") {
  render(<CatalogBrowser id={id} title="Vocabulary" description="Words" noun="words"
    items={words.map(item)} categories={[]} itemIcon={() => null} categoryIcon={() => null}
    question={row => row.name} onAsk={() => {}} />);
}
const card = (word: string) => screen.getAllByRole("listitem")
  .find(row => row.textContent?.toLowerCase().includes(word))!;

beforeEach(() => localStorage.clear());

test("each card carries a studied checkbox that starts unchecked", () => {
  renderCards();
  const ticks = screen.getAllByRole("checkbox");
  expect(ticks).toHaveLength(words.length);
  for (const tick of ticks) expect(tick).toHaveAttribute("aria-checked", "false");
});

test("ticking a card marks only that card, and the tick survives a remount", async () => {
  const { unmount } = render(<CatalogBrowser id="vocab" title="Vocabulary" description="Words" noun="words"
    items={words.map(item)} categories={[]} itemIcon={() => null} categoryIcon={() => null}
    question={row => row.name} onAsk={() => {}} />);

  fireEvent.click(screen.getByRole("checkbox", { name: /succinct/ }));
  expect(screen.getByRole("checkbox", { name: /succinct/ })).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("checkbox", { name: /candid/ })).toHaveAttribute("aria-checked", "false");
  expect(within(card("succinct")).getByRole("checkbox")).toHaveAttribute("aria-checked", "true");

  // Reload: the tick is read back from storage rather than lost. The read is
  // deferred off the first render, so this settles a microtask later.
  unmount();
  renderCards();
  await waitFor(() => expect(screen.getByRole("checkbox", { name: /succinct/ })).toHaveAttribute("aria-checked", "true"));
});

test("unticking clears the card again", () => {
  renderCards();
  const tick = () => screen.getByRole("checkbox", { name: /succinct/ });
  fireEvent.click(tick());
  expect(tick()).toHaveAttribute("aria-checked", "true");
  fireEvent.click(tick());
  expect(tick()).toHaveAttribute("aria-checked", "false");
});

test("one catalogue's ticks never show up in another", () => {
  const { unmount } = render(<CatalogBrowser id="vocab-a" title="Vocabulary" description="Words" noun="words"
    items={words.map(item)} categories={[]} itemIcon={() => null} categoryIcon={() => null}
    question={row => row.name} onAsk={() => {}} />);
  fireEvent.click(screen.getByRole("checkbox", { name: /succinct/ }));
  unmount();

  renderCards("vocab-b");
  expect(screen.getByRole("checkbox", { name: /succinct/ })).toHaveAttribute("aria-checked", "false");
});

const langSwitch = (word: string) => within(within(card(word)).getByRole("group", { name: `Language for ${word}` }));

test("each card's own header switches that card between English and Hindi", () => {
  renderCards();
  const entry = ENGLISH_EXAM_VOCABULARY.find(row => row.word === "succinct")!;

  // English is the default, and the En option shows as the pressed one.
  expect(screen.getByText(entry.meaning)).toBeVisible();
  expect(langSwitch("succinct").getByRole("button", { name: "En" })).toHaveAttribute("aria-pressed", "true");
  expect(card("succinct").textContent).toContain("synonyms");
  expect(card("succinct").textContent).toContain("Open word");

  fireEvent.click(langSwitch("succinct").getByRole("button", { name: "Hi" }));
  // The gloss replaces the English meaning, and the labels follow it over.
  expect(screen.getByText(entry.hindi!)).toBeVisible();
  expect(screen.queryByText(entry.meaning)).not.toBeInTheDocument();
  expect(card("succinct").textContent).toContain("पर्यायवाची");
  expect(card("succinct").textContent).toContain("शब्द खोलें");
  // The headword itself stays English — it is the word being learned.
  expect(card("succinct").textContent).toContain("Succinct");

  fireEvent.click(langSwitch("succinct").getByRole("button", { name: "En" }));
  expect(screen.getByText(entry.meaning)).toBeVisible();
});

test("switching one card's language leaves every other card in English", () => {
  renderCards();
  const candid = ENGLISH_EXAM_VOCABULARY.find(row => row.word === "candid")!;

  fireEvent.click(langSwitch("succinct").getByRole("button", { name: "Hi" }));
  // The neighbour is untouched: the switch is per card, not per catalogue.
  expect(screen.getByText(candid.meaning)).toBeVisible();
  expect(langSwitch("candid").getByRole("button", { name: "En" })).toHaveAttribute("aria-pressed", "true");
  expect(card("candid").textContent).toContain("Open word");
});

test("a catalogue with no Hindi glosses offers no language switch", () => {
  render(<CatalogBrowser id="aws" title="Services" description="Cloud" noun="services"
    items={[{ name: "Lambda", category: "Compute", summary: "Run code without servers." }]}
    categories={[]} itemIcon={() => null} categoryIcon={() => null}
    question={row => row.name} onAsk={() => {}} />);
  expect(screen.queryByRole("group", { name: /^Language for/ })).not.toBeInTheDocument();
  // The tick is offered on every catalogue, not only vocabulary.
  expect(screen.getAllByRole("checkbox")).toHaveLength(1);
});

test("the word dialog carries its own En/Hi switch for the whole card", () => {
  renderCards();
  const entry = ENGLISH_EXAM_VOCABULARY.find(row => row.word === "succinct")!;

  fireEvent.click(within(card("succinct")).getByRole("button", { name: /Succinct/ }));
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByText(entry.meaning)).toBeVisible();
  expect(dialog.getByText("In a sentence")).toBeVisible();
  expect(dialog.getByText("Synonyms")).toBeVisible();

  const header = within(dialog.getByRole("group", { name: "Word language" }));
  fireEvent.click(header.getByRole("button", { name: "Hi" }));
  // Meaning, captions and group headings all cross over together.
  expect(dialog.getByText(entry.hindi!)).toBeVisible();
  expect(dialog.queryByText(entry.meaning)).not.toBeInTheDocument();
  expect(dialog.getByText("वाक्य में")).toBeVisible();
  expect(dialog.getByText("पर्यायवाची")).toBeVisible();
  // The headword and the words it lists stay English — they are the content.
  // The headword is capitalised when drawn, as it is on the card.
  expect(dialog.getByText("Succinct")).toBeVisible();
  expect(dialog.getByText("concise")).toBeVisible();

  fireEvent.click(header.getByRole("button", { name: "En" }));
  expect(dialog.getByText(entry.meaning)).toBeVisible();
});

test("the dialog's language does not leak to the next word opened", () => {
  renderCards();
  fireEvent.click(within(card("succinct")).getByRole("button", { name: /Succinct/ }));
  const open = within(screen.getByRole("dialog"));
  fireEvent.click(within(open.getByRole("group", { name: "Word language" })).getByRole("button", { name: "Hi" }));
  fireEvent.click(open.getByRole("button", { name: "Close" }));

  fireEvent.click(within(card("candid")).getByRole("button", { name: /Candid/ }));
  const candid = ENGLISH_EXAM_VOCABULARY.find(row => row.word === "candid")!;
  expect(within(screen.getByRole("dialog")).getByText(candid.meaning)).toBeVisible();
});

test("the synonym and antonym lists each switch language on their own", async () => {
  renderCards();
  fireEvent.click(within(card("succinct")).getByRole("button", { name: /Succinct/ }));
  const dialog = within(screen.getByRole("dialog"));

  // Both lists start in English.
  expect(dialog.getByText("concise")).toBeVisible();
  expect(dialog.getByText("verbose")).toBeVisible();

  const synonyms = within(dialog.getByRole("group", { name: "Synonyms language" }));
  fireEvent.click(synonyms.getByRole("button", { name: "Hi" }));

  // "concise" is itself a headword, so it has a gloss to switch to. The gloss
  // table is fetched on this first switch rather than loaded with the page, so
  // the pill keeps its English spelling until it arrives.
  await waitFor(() => expect(dialog.queryByText("concise")).not.toBeInTheDocument());
  // The antonym list is untouched: the two switch independently.
  expect(dialog.getByText("verbose")).toBeVisible();

  fireEvent.click(synonyms.getByRole("button", { name: "En" }));
  expect(dialog.getByText("concise")).toBeVisible();
});

test("a related word with no gloss keeps its English spelling when switched", () => {
  renderCards();
  fireEvent.click(within(card("succinct")).getByRole("button", { name: /Succinct/ }));
  const dialog = within(screen.getByRole("dialog"));
  const antonyms = within(dialog.getByRole("group", { name: "Antonyms language" }));

  fireEvent.click(antonyms.getByRole("button", { name: "Hi" }));
  // Most synonyms and antonyms are not headwords, so they have no gloss. Every
  // pill must still show a word rather than going blank.
  for (const pill of screen.getByRole("dialog").querySelectorAll(".pillWord")) {
    expect(pill.textContent?.trim().length).toBeGreaterThan(0);
  }
});
