import { loadPack } from "@/lib/board-exams/boards";
import { forBoard } from "@/lib/board-exams/types";
import { UP_EXTRA } from "@/lib/board-exams/up-board";

// UP Board questions (2026-11-28): every class and pack has them, they reach UP Board only, and chemistry ones land on
// the right side of the Organic / Inorganic split.
test("UP Board questions appear for UP Board only, in every class and subject", async () => {
  for (const key of ["10-math", "12-math", "10-physics", "12-physics", "10-chemistry", "12-chemistry", "10-english", "12-english"]) {
    expect(UP_EXTRA[key].items.length).toBeGreaterThanOrEqual(6);
    expect(UP_EXTRA[key].mcqs.length).toBeGreaterThanOrEqual(6);
  }
  for (const cls of ["10", "12"] as const) for (const subject of ["math", "physics", "organic", "inorganic", "english"] as const) {
    const pack = await loadPack(cls, subject);
    const up = [...pack.items, ...pack.mcqs].filter(row => row.id.includes("-up"));
    expect(up.length).toBeGreaterThan(0);
    expect(up.every(row => row.b === "u")).toBe(true);
    expect(forBoard(pack.items, "cbse").some(row => row.id.includes("-up"))).toBe(false);
    expect(forBoard(pack.mcqs, "icse").some(row => row.id.includes("-up"))).toBe(false);
    for (const m of pack.mcqs.filter(row => row.id.includes("-up"))) expect(m.correct).toBeLessThan(m.options.length);
  }
  const organic = await loadPack("12", "organic"), inorganic = await loadPack("12", "inorganic");
  expect(organic.items.some(row => row.id.includes("-up") && row.ch === "Amines")).toBe(true);
  expect(inorganic.items.some(row => row.id.includes("-up") && row.ch === "Amines")).toBe(false);
  expect(inorganic.items.some(row => row.id.includes("-up") && row.ch === "Electrochemistry")).toBe(true);
  // Translation exercises carry the Hindi sentence.
  expect((await loadPack("10", "english")).items.filter(row => row.ch === "Translation: Hindi to English" && /[ऀ-ॿ]/.test(row.q)).length).toBe(15);
});
