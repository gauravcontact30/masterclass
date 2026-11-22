import { localizeExamData, missingExamTranslations } from "@/lib/exam-locale";
test("Hindi content translates prose while preserving IDs, board scope and answer keys", () => {
  const pack = { items: [{ id: "x-q1", kind: "bank", b: "uc", q: "What is force?", a: "Mass times acceleration.", steps: ["F = ma"], marks: 2 }], mcqs: [{ options: ["One", "Two"], correct: 1 }] };
  const dictionary = { "What is force?": "बल क्या है?", "Mass times acceleration.": "द्रव्यमान और त्वरण का गुणनफल।", "F = ma": "F = ma", One: "एक", Two: "दो" };
  const translated = localizeExamData(pack, dictionary);
  expect(translated.items[0]).toMatchObject({ id: "x-q1", kind: "bank", b: "uc", q: "बल क्या है?", marks: 2 });
  expect(translated.mcqs[0]).toEqual({ options: ["एक", "दो"], correct: 1 });
  expect(pack.items[0].q).toBe("What is force?");
  expect(missingExamTranslations(pack, dictionary)).toEqual([]);
});
test("coverage detects untranslated learning text rather than counting IDs", () => {
  expect(missingExamTranslations({ id: "some-id", topic: "Algebra", q: "Find x.", a: "x = 2" }, { Algebra: "बीजगणित" })).toEqual(["Find x."]);
});
