/** @jest-environment node */
import { lookupEnglishWord } from "@/lib/server/english-word";
import { isPhrase, wordQuerySchema } from "@/lib/english-word";
import { completeWithFallback, learningProvider } from "@/lib/server/ai-providers";
jest.mock("@/lib/server/ai-providers", () => ({ learningProvider: jest.fn(() => null), completeWithFallback: jest.fn() }));
jest.mock("@/lib/server/http", () => ({ HttpError: class extends Error { constructor(public status: number, public code: string) { super(code); } } }));

beforeEach(() => { (learningProvider as jest.Mock).mockReturnValue(null); global.fetch = jest.fn(); });

test("validates a single English headword", () => {
  expect(wordQuerySchema.parse({ word: "  well-being  " }).word).toBe("well-being");
  expect(wordQuerySchema.safeParse({ word: "https://example.com" }).success).toBe(false);
  expect(wordQuerySchema.safeParse({ word: "123" }).success).toBe(false);
});

test("known words use the local library without network access", async () => {
  const result = await lookupEnglishWord("verbose");
  expect(result.source).toBe("library");
  expect(result.entry.word).toBe("verbose");
  expect(result.entry.meaning).toBeTruthy();
  expect(global.fetch).not.toHaveBeenCalled();
});

test("unknown words fall back to dictionary data without mixing word senses", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => [{ word: "platypus", phonetic: "/ˈplætɪpəs/", meanings: [
    { definitions: [{ definition: "An egg-laying mammal.", example: "A platypus swam past." }], synonyms: [], antonyms: [] },
    { definitions: [{ definition: "A different sense." }], antonyms: ["unrelated"] },
  ] }] });
  const result = await lookupEnglishWord("platypus");
  expect(result.entry.meaning).toBe("An egg-laying mammal.");
  expect(result.entry.antonyms).toEqual([]);
  expect(result.notice).toBeTruthy();
});

test("missing words return not-found instead of an invented definition", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ status: 404 });
  await expect(lookupEnglishWord("zzzznotaword")).rejects.toMatchObject({ status: 404, code: "word_not_found" });
});

test("the configured provider supplies Hindi for the word and each related word", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ status: 404 });
  (learningProvider as jest.Mock).mockReturnValue("anthropic");
  (completeWithFallback as jest.Mock).mockResolvedValue({ text: JSON.stringify({ entry: {
    word: "testword", pronunciation: "TEST-wurd", meaning: "A test fixture.", hindi: "परीक्षण शब्द", sentence: "This is a testword.",
    sentenceHindi: "यह एक टेस्टवर्ड है।",
    synonyms: [{ word: "sample", hindi: "नमूना" }], antonyms: [],
  } }) });
  const result = await lookupEnglishWord("testword");
  expect(result.source).toBe("ai");
  expect(result.entry.synonyms[0].hindi).toBe("नमूना");
  // The card reads wholly in Hindi when the provider supplies a translated sentence.
  expect(result.entry.sentenceHindi).toBe("यह एक टेस्टवर्ड है।");
});

/**
 * A phrase is looked up because its words mean something together that their
 * definitions do not, so it never touches the headword dictionary and the reply
 * has to be about the whole phrase.
 */
test("a phrase of several words is accepted and normalised", () => {
  expect(wordQuerySchema.parse({ word: "  break   the ice " }).word).toBe("break the ice");
  expect(wordQuerySchema.parse({ word: "state of the art" }).word).toBe("state of the art");
  expect(isPhrase("break the ice")).toBe(true);
  expect(isPhrase("resilient")).toBe(false);
  // Seven words is a sentence, not a phrase to define.
  expect(wordQuerySchema.safeParse({ word: "one two three four five six seven" }).success).toBe(false);
  expect(wordQuerySchema.safeParse({ word: "break the 3rd ice" }).success).toBe(false);
});

test("a phrase skips the headword dictionary and asks the model for the combined sense", async () => {
  (learningProvider as jest.Mock).mockReturnValue("anthropic");
  (completeWithFallback as jest.Mock).mockResolvedValue({ text: JSON.stringify({ entry: {
    word: "break the ice", pronunciation: "brayk thuh ICE", meaning: "To ease the tension in a first meeting.",
    hindi: "संकोच दूर करना", sentence: "A bad joke broke the ice.",
    sentenceHindi: "एक चुटकुले ने संकोच दूर किया।",
    synonyms: [{ word: "warm up", hindi: "घुलना" }], antonyms: [],
  } }) });
  const result = await lookupEnglishWord("Break The Ice");
  expect(global.fetch).not.toHaveBeenCalled();
  expect(result.source).toBe("ai");
  expect(result.entry.word).toBe("break the ice");
  expect(result.entry.meaning).toBe("To ease the tension in a first meeting.");
  // The prompt asks about the phrase as a whole, not about any word in it.
  const [, , prompt] = (completeWithFallback as jest.Mock).mock.calls[0];
  expect(String(prompt[0].content)).toContain("English phrase as a whole");
});

test("a reply about one word of the phrase is refused rather than shown", async () => {
  (learningProvider as jest.Mock).mockReturnValue("anthropic");
  (completeWithFallback as jest.Mock).mockResolvedValue({ text: JSON.stringify({ entry: {
    word: "ice", pronunciation: "ICE", meaning: "Frozen water.", hindi: "बर्फ", sentence: "The ice melted.",
    sentenceHindi: "बर्फ पिघल गई।", synonyms: [], antonyms: [],
  } }) });
  await expect(lookupEnglishWord("break the ice")).rejects.toMatchObject({ status: 503, code: "phrase_lookup_unavailable" });
});

test("a phrase with no model configured says so instead of claiming it does not exist", async () => {
  (learningProvider as jest.Mock).mockReturnValue(null);
  await expect(lookupEnglishWord("a blessing in disguise"))
    .rejects.toMatchObject({ status: 503, code: "phrase_lookup_unavailable" });
  expect(global.fetch).not.toHaveBeenCalled();
});
