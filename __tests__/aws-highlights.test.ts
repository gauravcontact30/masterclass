import { awsHighlights, popularAwsHighlights } from "@/lib/pro-learn/aws-highlights";
import { AWS_POPULARITY } from "@/lib/generation/guides/aws-popularity";

test("the highlights are the curated teaching order, trimmed to what a card shows", () => {
  const list = awsHighlights(24);
  expect(list).toHaveLength(24);

  // Most-used first, and only ranked services qualify.
  expect(list[0].name).toBe("Amazon S3");
  expect(list.map(item => item.name)).toEqual(AWS_POPULARITY.slice(0, 24));

  // Every card has the three fields it draws, and nothing else crosses over.
  for (const item of list) {
    expect(Object.keys(item).sort()).toEqual(["category", "name", "summary"]);
    expect(item.category).toBeTruthy();
    expect(item.summary.length).toBeGreaterThan(10);
    expect(item.summary.length).toBeLessThanOrEqual(150);
  }
});

test("asking for fewer returns fewer, and names stay unique", () => {
  const list = awsHighlights(6);
  expect(list).toHaveLength(6);
  expect(new Set(list.map(item => item.name)).size).toBe(6);
});

test("the Search page's popular list holds only the curated services, in teaching order", () => {
  const popular = popularAwsHighlights();
  expect(popular.map(item => item.name)).toEqual(AWS_POPULARITY);
  expect(popular.length).toBeLessThan(awsHighlights().length);
});
