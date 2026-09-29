import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogBrowser } from "@/components/catalog-browser";

const WORD = {
  name: "verbose",
  category: "Workplace speaking",
  summary: "Using far more words than the point needs.",
  vocabulary: {
    word: "verbose",
    pronunciation: "vur-BOHSS",
    meaning: "Using far more words than the point needs, so the point is buried.",
    sentence: "His verbose status update hid one decision inside four paragraphs.",
    synonyms: ["wordy", "long-winded", "rambling", "prolix"],
    antonyms: ["concise", "terse", "succinct", "pithy"],
  },
};

function browser(onAsk = jest.fn()) {
  render(<CatalogBrowser id="words" title="Words" description="Words." noun="words"
    items={[WORD]} categories={[{ name: WORD.category, count: 1 }]}
    itemIcon={() => null} categoryIcon={() => null}
    question={item => `Explain ${item.name}`} onAsk={onAsk} />);
  return onAsk;
}

test("a vocabulary card opens the word dialog instead of asking the question", async () => {
  const onAsk = browser();
  await userEvent.click(screen.getByRole("button", { name: "Open word: Verbose" }));

  const dialog = await screen.findByRole("dialog");
  expect(onAsk).not.toHaveBeenCalled();
  expect(within(dialog).getByRole("searchbox", { name: "Search an English word or phrase" })).toBeInTheDocument();
  expect(within(dialog).getByText("vur-BOHSS")).toBeInTheDocument();
  expect(within(dialog).getByText(/one decision inside four paragraphs/)).toBeInTheDocument();
  // The lists are shown in full in the dialog, not truncated as on the card.
  for (const word of [...WORD.vocabulary.synonyms, ...WORD.vocabulary.antonyms]) {
    expect(within(dialog).getByText(word)).toBeInTheDocument();
  }
  expect(within(dialog).queryByRole("button", { name: /explain this/i })).not.toBeInTheDocument();
});

test("every synonym and antonym carries its own working pronounce button", async () => {
  const speak = jest.fn();
  Object.defineProperty(window, "speechSynthesis", { value: { speak, cancel: jest.fn() }, configurable: true });
  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    value: class { constructor(public text: string) {} },
    configurable: true,
  });

  browser();
  await userEvent.click(screen.getByRole("button", { name: "Open word: Verbose" }));
  const dialog = await screen.findByRole("dialog");

  for (const word of [...WORD.vocabulary.synonyms, ...WORD.vocabulary.antonyms]) {
    expect(within(dialog).getByRole("button", { name: `Pronounce ${word}` })).toBeInTheDocument();
  }
  await userEvent.click(within(dialog).getByRole("button", { name: "Pronounce pithy" }));
  expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: "pithy" }));
});
