/** @jest-environment node */
import { COMPARISONS, hasComparisonBank, loadComparisonBank, techPicture } from "@/lib/comparisons";
import { INTERVIEW_TECHS } from "@/lib/interview-bank";

test("every comparison has a unique id, 2+ technologies with definitions, and a well-formed table", () => {
  expect(new Set(COMPARISONS.map(item => item.id)).size).toBe(COMPARISONS.length);
  for (const item of COMPARISONS) {
    expect(item.question).toMatch(/\?$/);
    expect(item.techs.length).toBeGreaterThanOrEqual(2);
    for (const tech of item.techs) {
      expect(tech.definition.length).toBeGreaterThan(20);
      expect(tech.description.length).toBeGreaterThan(30);
    }
    expect(item.aspects.length).toBeGreaterThanOrEqual(4);
    for (const row of item.aspects) expect(row).toHaveLength(item.techs.length + 1);
  }
});

test("every comparison has a bank of 50+ unique difference questions with real answers", async () => {
  // A comparison without a bank shows an empty "being written" panel on the landing page.
  expect(COMPARISONS.filter(item => !hasComparisonBank(item.id)).map(item => item.id)).toEqual([]);
  const written = COMPARISONS;
  for (const item of written) {
    const set = await loadComparisonBank(item.id);
    expect(set.subjective.length).toBeGreaterThanOrEqual(50);
    expect(new Set(set.subjective.map(q => q.question)).size).toBe(set.subjective.length);
    for (const q of set.subjective) expect(q.answer.length).toBeGreaterThan(80);
  }
});

test("technology pictures reuse real Interview prep slides, and every comparison has one", () => {
  const ids = new Set(INTERVIEW_TECHS.map(tech => tech.id));
  const unmapped: string[] = [];
  for (const item of COMPARISONS) {
    const pictures = item.techs.map(tech => techPicture(tech.name));
    for (const [k, id] of pictures.entries()) { if (id) expect(ids.has(id)).toBe(true); else unmapped.push(item.techs[k].name); }
    expect(pictures.some(Boolean)).toBe(true);
  }
  expect(unmapped).toEqual([]);
});
