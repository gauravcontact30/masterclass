import { ENGLISH_EXAM_VOCABULARY } from "@/lib/pro-learn/english-exam-vocabulary";

// The handbook grows as word lists are imported, so the tests assert the floor
// and the quality bar rather than an exact count that every import would break.
const MINIMUM = 300;

test("exam vocabulary keeps only advanced words carrying at least three synonyms and three antonyms", () => {
  expect(ENGLISH_EXAM_VOCABULARY.length).toBeGreaterThanOrEqual(MINIMUM);
  // No word may appear twice, however many lists it was imported from.
  expect(new Set(ENGLISH_EXAM_VOCABULARY.map(entry => entry.word)).size).toBe(ENGLISH_EXAM_VOCABULARY.length);

  for (const entry of ENGLISH_EXAM_VOCABULARY) {
    expect(entry.synonyms.length).toBeGreaterThanOrEqual(3);
    expect(entry.antonyms.length).toBeGreaterThanOrEqual(3);
    // A word cannot be its own opposite: the two lists must stay disjoint.
    expect(entry.synonyms.filter(word => entry.antonyms.includes(word))).toEqual([]);
  }
});

/** Enough of a word to recognise it through its usual inflections. */
const stem = (word: string) => word.toLowerCase().slice(0, Math.max(4, word.length - 3));

test("every entry carries a word-specific definition and a sentence that uses the word", () => {
  expect(ENGLISH_EXAM_VOCABULARY.every(entry =>
    entry.meaning.length > 20
    // An inflection counts: "promulgation" still teaches "promulgate".
    && entry.sentence.toLowerCase().includes(stem(entry.word))
    && !entry.meaning.startsWith("An advanced English word for")
    && !entry.sentence.startsWith("The team used"),
  )).toBe(true);
});

test("every word carries a spelled-out pronunciation with a stressed syllable", () => {
  for (const entry of ENGLISH_EXAM_VOCABULARY) {
    expect(entry.pronunciation).toBeTruthy();
    // Exactly one syllable is capitalised, which is what marks the stress.
    const syllables = entry.pronunciation!.split("-");
    expect(syllables.filter(part => part === part.toUpperCase())).toHaveLength(1);
  }
});
