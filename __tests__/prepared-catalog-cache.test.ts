import { prepareSearchTopics } from "@/lib/server/prepared-catalog";

test("an updated topic replaces its cached card and explanation", () => {
  const original = { name: "Release cache fixture", category: "Delivery foundations", summary: "Prepare a release." };
  const [before] = prepareSearchTopics([original], "DevOps with AWS CI/CD");
  expect(prepareSearchTopics([original], "DevOps with AWS CI/CD")[0]).toBe(before);

  const updated = { ...original, points: ["Promote the tested artifact by digest."] };
  const [after] = prepareSearchTopics([updated], "DevOps with AWS CI/CD");
  expect(after).not.toBe(before);
  expect(after.points).toEqual(updated.points);
  expect(after.prepared?.answer.keyPoints).toContain(updated.points[0]);
});
