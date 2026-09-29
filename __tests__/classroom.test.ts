import { CLASSROOM_CATALOGUES } from "@/lib/pro-learn/classroom";

test("every classroom catalogue is populated and internally consistent", () => {
  expect(CLASSROOM_CATALOGUES).toHaveLength(15);
  let total = 0;
  for (const item of CLASSROOM_CATALOGUES) {
    expect(item.topics.length).toBeGreaterThan(0);
    expect(item.categories.length).toBeGreaterThan(0);
    // Every topic's category is one the tab strip advertises.
    const advertised = new Set(item.categories.map(category => category.name));
    expect(item.topics.every(topic => advertised.has(topic.category))).toBe(true);
    // The counts add up to the topic list.
    expect(item.categories.reduce((sum, category) => sum + category.count, 0)).toBe(item.topics.length);
    // No card is repeated inside one category.
    const keys = item.topics.map(topic => `${topic.category}::${topic.name}`);
    expect(new Set(keys).size).toBe(keys.length);
    total += item.topics.length;
  }
  console.log("classroom cards:", total);
  expect(total).toBeGreaterThan(900);
});

test("the four school subjects each cover Class 6 to Class 12", () => {
  const classes = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
  for (const id of ["maths", "physics", "chemistry", "english"]) {
    const subject = CLASSROOM_CATALOGUES.find(item => item.id === id)!;
    expect(subject.categories.map(category => category.name)).toEqual(classes);
  }
});

test("every exam carries an at-a-glance overview card ahead of its topics", () => {
  const examGroups = CLASSROOM_CATALOGUES.filter(item => !["maths", "physics", "chemistry", "english"].includes(item.id));
  expect(examGroups).toHaveLength(11);
  for (const group of examGroups) {
    for (const category of group.categories) {
      const cards = group.topics.filter(topic => topic.category === category.name);
      expect(cards[0].name).toBe(`${category.name} at a glance`);
      // An overview alone is not a study surface; each exam carries topics too.
      expect(cards.length).toBeGreaterThan(1);
    }
  }
});
