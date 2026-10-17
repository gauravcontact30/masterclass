/** @jest-environment node */
import { COMPARISONS, hasComparisonBank, loadComparisonBank } from "@/lib/comparisons";

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

test("each written bank has 50+ unique difference questions with real answers", async () => {
  const written = COMPARISONS.filter(item => hasComparisonBank(item.id));
  expect(written.length).toBeGreaterThan(0);
  for (const item of written) {
    const set = await loadComparisonBank(item.id);
    expect(set.subjective.length).toBeGreaterThanOrEqual(50);
    expect(new Set(set.subjective.map(q => q.question)).size).toBe(set.subjective.length);
    for (const q of set.subjective) expect(q.answer.length).toBeGreaterThan(80);
  }
});
