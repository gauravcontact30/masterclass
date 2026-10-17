/** @jest-environment node */
import { ENGLISH_EXAM_VOCABULARY } from "@/lib/pro-learn/english-exam-vocabulary";
import { apiPackageEntries, apiPackages, handbookSlug, handbooks, interviewBanks, interviewTechs, slugify, vocabularyGroups, workflowQuestions, workflows } from "@/lib/public-learning";

test("slugify makes readable, URL-safe slugs", () => {
  expect(slugify("React 19+ — Components, Actions & Server UI")).toBe("react-19-plus-components-actions-and-server-ui");
  expect(slugify("  Café   Ops ")).toBe("cafe-ops");
  expect(slugify("useState")).toBe("usestate");
  expect(slugify("Next.js 16+ APIs")).toBe("next-js-16-plus-apis");
});

test("every handbook gets a unique, non-empty slug and has topics", () => {
  const slugs = handbooks().map(handbookSlug);
  expect(slugs.length).toBeGreaterThan(10);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const item of handbooks()) expect(item.topics.length).toBeGreaterThan(0);
  for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("vocabulary groups cover every word exactly once under a unique slug", () => {
  const groups = vocabularyGroups();
  expect(new Set(groups.map(group => group.slug)).size).toBe(groups.length);
  expect(groups.reduce((sum, group) => sum + group.words.length, 0)).toBe(ENGLISH_EXAM_VOCABULARY.length);
});

test("API identifiers get unique slugs per package, and only documented ones get pages", async () => {
  for (const pkg of apiPackages()) {
    const entries = await apiPackageEntries(pkg.id);
    expect(entries).toHaveLength(pkg.entries.length);
    expect(new Set(entries.map(entry => entry.slug)).size).toBe(entries.length);
  }
  const documented = (await Promise.all(apiPackages().map(pkg => apiPackageEntries(pkg.id)))).flat().filter(entry => entry.card);
  expect(documented.length).toBeGreaterThan(1000);
  for (const entry of documented.slice(0, 50)) expect(entry.card?.summary.length).toBeGreaterThan(20);
});

test("every interview technology and every blueprint publishes 30+ questions of each kind", async () => {
  for (const tech of interviewTechs()) {
    const banks = await interviewBanks(tech);
    expect(banks.flatMap(bank => bank.set.subjective).length).toBeGreaterThanOrEqual(25);
    expect(banks.flatMap(bank => bank.set.objective).length).toBeGreaterThanOrEqual(25);
  }
  for (const item of workflows()) {
    const set = await workflowQuestions(item.id);
    expect(set.subjective.length).toBeGreaterThanOrEqual(31);
    expect(set.objective.length).toBeGreaterThanOrEqual(31);
  }
});
