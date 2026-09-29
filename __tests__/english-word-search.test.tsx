import { fireEvent, render, screen, within } from "@testing-library/react";
import { EnglishWordSearch } from "@/components/english-word-search";

const entry = { word: "resilient", pronunciation: "ri-ZIL-yuhnt", meaning: "Able to recover after difficulties.", hindi: "कठिनाइयों से उबरने में सक्षम", sentence: "Our resilient team recovered quickly.", synonyms: [{ word: "adaptable", hindi: "अनुकूलनीय" }], antonyms: [{ word: "fragile", hindi: "नाज़ुक" }] };
const submit = (word: string) => {
  fireEvent.change(screen.getByRole("searchbox", { name: "Search an English word or phrase" }), { target: { value: word } });
  fireEvent.submit(screen.getByRole("search", { name: "English word or phrase lookup" }));
};
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ entry, source: "ai" }) }); });

test("looks up a word and renders bilingual meaning, sentence and separate related-word sections", async () => {
  render(<EnglishWordSearch />); submit("resilient");
  expect(await screen.findByText(entry.meaning)).toBeVisible();
  expect(screen.getByText(entry.hindi)).toHaveAttribute("lang", "hi");
  expect(screen.getByText(entry.pronunciation)).toBeVisible();
  expect(screen.getByText(entry.sentence)).toBeVisible();
  const synonyms = screen.getByRole("heading", { name: /Synonyms/ }).closest("section")!;
  const antonyms = screen.getByRole("heading", { name: /Antonyms/ }).closest("section")!;
  expect(within(synonyms).getByText("अनुकूलनीय")).toBeVisible();
  expect(within(antonyms).getByText("नाज़ुक")).toBeVisible();
  expect(global.fetch).toHaveBeenCalledWith("/api/pro-learn/word", expect.objectContaining({ method: "POST", body: JSON.stringify({ word: "resilient" }) }));
});

test("rejects a sentence without making a lookup request", () => {
  render(<EnglishWordSearch />); submit("explain all of these words for me please");
  expect(screen.getByRole("alert")).toHaveTextContent("phrase of up to 6 words");
  expect(global.fetch).not.toHaveBeenCalled();
});

/** Several words are looked up together, for what they mean as one thing. */
test("looks up a phrase and labels the meaning as the words together", async () => {
  const phrase = { ...entry, word: "break the ice", meaning: "To ease the tension in a first meeting.", sentence: "A bad joke broke the ice." };
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ entry: phrase, source: "ai" }) });
  render(<EnglishWordSearch />); submit("  Break   the ice ");
  expect(await screen.findByRole("heading", { name: "Break the ice" })).toBeVisible();
  expect(screen.getByText("Meaning of these words together")).toBeVisible();
  expect(screen.getByText(phrase.meaning)).toBeVisible();
  // The spacing typed is not the query sent: runs of whitespace collapse first.
  expect(global.fetch).toHaveBeenCalledWith("/api/pro-learn/word", expect.objectContaining({ body: JSON.stringify({ word: "Break the ice" }) }));
});

test("a single word is not labelled as a phrase", async () => {
  render(<EnglishWordSearch />); submit("resilient");
  expect(await screen.findByText(entry.meaning)).toBeVisible();
  expect(screen.queryByText("Meaning of these words together")).not.toBeInTheDocument();
});

test("a phrase that cannot be looked up says so rather than that it does not exist", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ error: "phrase_lookup_unavailable" }) });
  render(<EnglishWordSearch />); submit("a blessing in disguise");
  expect(await screen.findByRole("alert")).toHaveTextContent("Phrase meanings are unavailable right now");
});

test("shows a useful not-found message and permits another lookup", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ error: "word_not_found" }) });
  render(<EnglishWordSearch />); submit("zzzznotaword");
  expect(await screen.findByRole("alert")).toHaveTextContent("Check the spelling");
  submit("resilient");
  expect(await screen.findByText(entry.meaning)).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("Hear it speaks the English headword", async () => {
  const speak = jest.fn();
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak, cancel: jest.fn() } });
  Object.defineProperty(global, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(public text: string) {} } });
  render(<EnglishWordSearch />); submit("resilient");
  fireEvent.click(await screen.findByRole("button", { name: "Hear it: resilient" }));
  expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: "resilient", lang: "en-US" }));
});

test("a superseded request cannot overwrite the latest word", async () => {
  let resolveFirst!: (value: unknown) => void;
  (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
  render(<EnglishWordSearch />); submit("old"); submit("resilient");
  expect(await screen.findByText(entry.meaning)).toBeVisible();
  resolveFirst({ ok: true, json: async () => ({ entry: { ...entry, word: "old" }, source: "ai" }) });
  expect(screen.getByRole("heading", { name: "Resilient", exact: true })).toBeVisible();
});
