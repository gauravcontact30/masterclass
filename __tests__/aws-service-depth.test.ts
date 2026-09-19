import { AWS_SERVICE_DEPTH, DEPTH_COVERAGE, serviceDepth } from "@/lib/generation/guides/aws-service-depth";
import { AWS_POPULARITY, popularityRank } from "@/lib/generation/guides/aws-popularity";
import { objectiveQuestionSchema } from "@/lib/domain";
import directory from "@/lib/generation/guides/aws-directory-generated.json";

const names = new Set(directory.map(service => service.name));
const entries = Object.entries(AWS_SERVICE_DEPTH);

describe("AWS service depth", () => {
  it("only covers services that exist in the catalog", () => {
    expect(Object.keys(AWS_SERVICE_DEPTH).filter(name => !names.has(name))).toEqual([]);
  });

  it("only covers services that are ranked, so depth follows the popularity order", () => {
    const unranked = Object.keys(AWS_SERVICE_DEPTH).filter(name => !AWS_POPULARITY.includes(name));
    expect(unranked).toEqual([]);
  });

  it("covers the highest-ranked services first", () => {
    const ranks = Object.keys(AWS_SERVICE_DEPTH).map(popularityRank);
    expect(Math.min(...ranks)).toBe(0); // Amazon S3 leads the ranking.
    expect(DEPTH_COVERAGE).toBe(entries.length);
  });

  it.each(entries)("%s has a use case, concepts and both question kinds", (_name, depth) => {
    expect(depth.useCase.length).toBeGreaterThan(40);
    expect(depth.concepts.length).toBeGreaterThanOrEqual(2);
    expect(depth.subjective.length).toBeGreaterThanOrEqual(2);
    expect(depth.objective.length).toBeGreaterThanOrEqual(1);
  });

  it.each(entries)("%s asks and answers substantively", (_name, depth) => {
    for (const item of depth.subjective) {
      expect(item.question.trim().endsWith("?")).toBe(true);
      // A model answer a learner can actually say out loud, not a one-liner.
      expect(item.answer.split(/\s+/).length).toBeGreaterThan(25);
    }
  });

  it.each(entries)("%s objective questions satisfy the app's question schema", (_name, depth) => {
    for (const item of depth.objective) {
      const parsed = objectiveQuestionSchema.safeParse({ ...item, shortAnswer: item.options[item.correct] });
      expect(parsed.success ? null : parsed.error.issues).toBeNull();
    }
  });

  it.each(entries)("%s marks exactly one correct option among four distinct ones", (_name, depth) => {
    for (const item of depth.objective) {
      expect(item.options).toHaveLength(4);
      expect(new Set(item.options).size).toBe(4);
      expect(item.correct).toBeGreaterThanOrEqual(0);
      expect(item.correct).toBeLessThan(4);
    }
  });

  it("returns nothing for a service without authored depth, rather than a blank shell", () => {
    expect(serviceDepth("Access Analyzer")).toBeUndefined();
    expect(serviceDepth("Amazon S3")).toBeDefined();
  });
});
