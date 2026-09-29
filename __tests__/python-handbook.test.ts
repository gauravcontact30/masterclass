import { pythonCategories, pythonTopics } from "@/lib/pro-learn/python-handbook";
import { pythonTopicIcon } from "@/components/python-topic-icon";

test("every topic has a category and a definition, and none repeats", () => {
  const topics = pythonTopics();
  expect(topics.length).toBeGreaterThan(50);
  const names = topics.map(topic => topic.name);
  expect(new Set(names).size).toBe(names.length);

  for (const topic of topics) {
    // `points` is optional: a short bullet list shown under the summary when present.
    expect(Object.keys(topic).filter(key => key !== "points").sort()).toEqual(["category", "name", "summary"]);
    for (const point of (topic as { points?: string[] }).points ?? []) expect(point.trim()).not.toBe("");
    expect(topic.summary.length).toBeGreaterThan(40);
    expect(topic.summary.length).toBeLessThanOrEqual(190);
  }
});

test("the counts on the tabs add up to the handbook", () => {
  const topics = pythonTopics();
  const categories = pythonCategories();
  expect(categories.reduce((total, category) => total + category.count, 0)).toBe(topics.length);
  for (const category of categories) {
    expect(topics.filter(topic => topic.category === category.name)).toHaveLength(category.count);
  }
});

test("neighbouring topics do not draw the same mark", () => {
  // Lists and Tuples share a category; the card has to tell them apart.
  expect(pythonTopicIcon("Lists", "Collections")).not.toBe(pythonTopicIcon("Tuples", "Collections"));
  expect(pythonTopicIcon("Dictionaries", "Collections")).not.toBe(pythonTopicIcon("Sets", "Collections"));
  // An unmapped topic still gets its category's mark rather than nothing.
  expect(pythonTopicIcon("Some future topic", "Typing")).toBe(pythonTopicIcon("Type hints", "Typing"));
});
