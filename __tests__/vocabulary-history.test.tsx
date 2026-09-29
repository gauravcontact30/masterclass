import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import { EnglishWordSearch } from "@/components/english-word-search";
import { readWordHistory } from "@/components/vocabulary-history";

const key = "test:vocabulary";
jest.mock("sonner", () => ({ toast: jest.fn() }));
const entry = (word: string) => ({ word, pronunciation: "", meaning: `Meaning of ${word}`, hindi: "अर्थ", sentence: "Example.", synonyms: [], antonyms: [] });
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  global.fetch = jest.fn().mockImplementation(async (_url, options) => ({ ok: true, json: async () => ({ entry: entry(JSON.parse(options.body).word), source: "library" }) }));
});

test("deletes the last page's card, persists deletion, and undoes without losing newer words", async () => {
  const view = render(<EnglishWordSearch historyKey={key} />);
  for (const word of ["apple", "brave", "calm", "daring"]) await lookup(word);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete apple" }));
  expect(screen.queryByRole("article", { name: "Apple" })).toBeNull();
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(readWordHistory(key).map(card => card.entry.word)).not.toContain("apple");
  const undo = (toast as unknown as jest.Mock).mock.calls[0][1].action.onClick;
  await lookup("eager");
  act(() => undo());
  expect(readWordHistory(key).map(card => card.entry.word)).toEqual(["eager", "daring", "calm", "brave", "apple"]);
  view.unmount();
  render(<EnglishWordSearch historyKey={key} />);
  expect(screen.getAllByRole("article")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getByRole("article", { name: "Apple" })).toBeVisible();
});

test("deleting the only word clears saved history and Undo restores its preferences", async () => {
  const view = render(<EnglishWordSearch historyKey={key} />);
  await lookup("apple");
  const card = within(screen.getByRole("article", { name: "Apple" }));
  fireEvent.click(card.getByRole("checkbox"));
  fireEvent.click(card.getByRole("switch"));
  fireEvent.click(card.getByRole("button", { name: "Delete apple" }));
  expect(readWordHistory(key)).toEqual([]);
  expect(screen.getByText(/Look up your first word below/)).toBeVisible();
  const undo = (toast as unknown as jest.Mock).mock.calls[0][1].action.onClick;
  act(() => undo());
  expect(readWordHistory(key)[0]).toMatchObject({ checked: true, language: "hi" });
  fireEvent.click(screen.getByRole("button", { name: "Delete apple" }));
  view.unmount();
  render(<EnglishWordSearch historyKey={key} />);
  expect(screen.queryByRole("article")).toBeNull();
});
async function lookup(word: string) {
  fireEvent.change(screen.getByRole("searchbox", { name: "Search an English word or phrase" }), { target: { value: word } });
  fireEvent.submit(screen.getByRole("search", { name: "English word or phrase lookup" }));
  await screen.findByRole("button", { name: `Open ${word}` });
  await waitFor(() => expect(screen.queryByText(/Looking up/)).toBeNull());
}

test("adds unique newest-first cards, pages two at a time, and restores history", async () => {
  const view = render(<EnglishWordSearch historyKey={key} />);
  for (const word of ["apple", "brave", "calm", "daring"]) await lookup(word);
  const history = screen.getByRole("region", { name: "Your vocabulary" });
  expect(within(history).getAllByRole("listitem")).toHaveLength(2);
  expect(within(history).getAllByRole("listitem")[0]).toHaveTextContent("daring");
  fireEvent.click(within(history).getByRole("button", { name: "Next page" }));
  expect(within(history).getAllByRole("listitem")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Open apple" }));
  expect(within(screen.getByRole("region", { name: "Apple" })).getByRole("heading", { name: "Apple" })).toBeVisible();
  expect(global.fetch).toHaveBeenCalledTimes(4);
  await lookup("apple");
  expect(readWordHistory(key)).toHaveLength(4);
  expect(screen.getByRole("region", { name: "Your vocabulary" }).querySelector("li")).toHaveTextContent("apple");
  view.unmount();
  render(<EnglishWordSearch historyKey={key} />);
  expect(await screen.findByRole("button", { name: "Open apple" })).toBeVisible();
});

test("searches and clears cards, filters details, and sorts words", async () => {
  render(<EnglishWordSearch historyKey={key} />);
  await lookup("apple"); await lookup("brave");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search cards" }), { target: { value: "apple" } });
  expect(screen.queryByRole("button", { name: "Open brave" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(screen.getByRole("button", { name: "Open brave" })).toBeVisible();
  expect(screen.queryByLabelText("Word details")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Filters", exact: true }));
  await screen.findByLabelText("Word details");
  fireEvent.change(screen.getByLabelText("Word details"), { target: { value: "synonyms" } });
  expect(screen.getByText(/No words match/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "az" } });
  expect(screen.getByRole("region", { name: "Your vocabulary" }).querySelector("li")).toHaveTextContent("apple");
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  await waitFor(() => expect(screen.queryByLabelText("Word details")).toBeNull());
});

test("ignores malformed saved data and does not save failed lookups", async () => {
  localStorage.setItem(key, '[{"entry":null}]');
  expect(readWordHistory(key)).toEqual([]);
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: "word_not_found" }) });
  render(<EnglishWordSearch historyKey={key} />);
  fireEvent.change(screen.getByRole("searchbox", { name: "Search an English word or phrase" }), { target: { value: "unknown" } });
  fireEvent.submit(screen.getByRole("search", { name: "English word or phrase lookup" }));
  await screen.findByRole("alert");
  expect(screen.queryByRole("button", { name: "Open unknown" })).toBeNull();
});

test("cards show complete word details and preserve their language and learned state", async () => {
  const rich = { ...entry("resilient"), pronunciation: "ri-ZIL-yuhnt", synonyms: [{ word: "strong", hindi: "मजबूत" }, { word: "adaptable", hindi: "अनुकूलनीय" }], antonyms: [{ word: "fragile", hindi: "नाज़ुक" }] };
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ entry: rich, source: "library" }) });
  const speak = jest.fn();
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak, cancel: jest.fn() } });
  Object.defineProperty(global, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(public text: string) {} } });
  const view = render(<EnglishWordSearch historyKey={key} />);
  await lookup("resilient");
  const card = within(screen.getByRole("article", { name: "Resilient" }));
  expect(card.getByRole("heading", { name: "Resilient" })).toBeVisible();
  expect(card.getByText(rich.meaning)).toBeVisible();
  expect(card.getByText(rich.sentence)).toBeVisible();
  expect(card.getByText(rich.pronunciation)).toBeVisible();
  expect(card.getByRole("heading", { name: "Synonyms 2" })).toBeVisible();
  expect(card.getByRole("heading", { name: "Antonyms 1" })).toBeVisible();
  for (const pair of [...rich.synonyms, ...rich.antonyms]) expect(card.getByText(pair.word.charAt(0).toUpperCase() + pair.word.slice(1))).toBeVisible();
  fireEvent.click(card.getByRole("button", { name: "Hear it: resilient" }));
  expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: "resilient", lang: "en-US" }));
  fireEvent.click(card.getByRole("switch", { name: "Hindi for resilient" }));
  expect(card.getByText(rich.hindi, { selector: "p" })).toBeVisible();
  for (const pair of [...rich.synonyms, ...rich.antonyms]) expect(card.getByText(pair.hindi)).toBeVisible();
  fireEvent.click(card.getByRole("checkbox"));
  expect(readWordHistory(key)[0]).toMatchObject({ checked: true, language: "hi" });
  await lookup("resilient");
  expect(readWordHistory(key)[0]).toMatchObject({ checked: true, language: "hi" });
  view.unmount();
  render(<EnglishWordSearch historyKey={key} />);
  const restored = within(await screen.findByRole("article", { name: "Resilient" }));
  expect(restored.getByRole("checkbox")).toBeChecked();
  expect(restored.getByRole("switch")).toBeChecked();
  fireEvent.click(restored.getByRole("checkbox"));
  fireEvent.click(restored.getByRole("switch"));
  expect(readWordHistory(key)[0]).toMatchObject({ checked: false, language: "en" });
});
