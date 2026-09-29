import { CLASSROOM_CATALOGUES } from "@/lib/pro-learn/classroom";
import { classroomTopicIcon } from "@/components/classroom-topic-icon";

const SUBJECTS = ["maths", "physics", "chemistry", "english"];
const subject = (id: string) => CLASSROOM_CATALOGUES.find(item => item.id === id)!;
const exams = () => CLASSROOM_CATALOGUES.filter(item => !SUBJECTS.includes(item.id));

/**
 * The resolver falls back rather than failing, so "it returned something"
 * proves nothing at all. What is worth pinning is the opposite: that a card
 * lands on the *right* mark, especially where two subjects use the same word
 * for different things, and where a rule sits above another one on purpose.
 *
 * The share landing on the default is measured too, but loosely — the default
 * is often the correct answer (a nuclear physics card really is an atom), so it
 * is a smoke alarm for a table that has stopped matching, not a score.
 */
const DEFAULT_ICON = { maths: "Calculator", physics: "Atom", chemistry: "FlaskConical", english: "BookText" } as const;

test("every classroom topic resolves to an icon, and few fall back to the subject default", () => {
  for (const id of SUBJECTS) {
    const topics = subject(id).topics;
    const fell = topics.filter(topic =>
      classroomTopicIcon(id, topic.name, topic.summary).displayName === DEFAULT_ICON[id as keyof typeof DEFAULT_ICON]);
    expect(fell.length / topics.length).toBeLessThan(0.15);
  }
});

test("every exam topic resolves to an icon from the exam table", () => {
  for (const group of exams()) {
    for (const topic of group.topics) {
      expect(classroomTopicIcon(group.id, topic.name, topic.summary)).toBeTruthy();
    }
  }
  // The overview card is the one every exam has, and it has its own mark.
  const overview = exams()[0].topics.find(topic => topic.name.endsWith("at a glance"))!;
  expect(classroomTopicIcon(exams()[0].id, overview.name, overview.summary).displayName).toBe("ClipboardList");
});

/** The collisions that made per-subject tables necessary in the first place. */
test("a word that means different things in different rooms resolves per subject", () => {
  expect(classroomTopicIcon("physics", "Reflection from a mirror", "").displayName).toBe("Eye");
  expect(classroomTopicIcon("chemistry", "Solutions and solubility", "").displayName).toBe("Beaker");
  expect(classroomTopicIcon("maths", "Solving a linear equation", "").displayName).toBe("Sigma");
  expect(classroomTopicIcon("english", "Reported speech", "").displayName).toBe("Quote");
});

/** Rules deliberately ordered above rules that would otherwise swallow them. */
test("the orderings that were got wrong once stay right", () => {
  // A semiconductor chapter is "Semiconductor Electronics", and "electron"
  // inside "Electronics" used to hand every card in it the atom.
  expect(classroomTopicIcon("physics", "p-n junction and diode", "Semiconductor Electronics · How a junction conducts.").displayName).toBe("Binary");
  expect(classroomTopicIcon("physics", "Radioactivity", "Nuclei · Alpha, beta and gamma decay.").displayName).toBe("Atom");
  // Combustion is a flame, not a reaction vessel.
  expect(classroomTopicIcon("chemistry", "Structure of a flame", "Combustion and Flame · The three zones.").displayName).toBe("Flame");
  // Atomic structure must survive the periodic-table rule sitting above it.
  expect(classroomTopicIcon("chemistry", "Shapes of orbitals", "Structure of Atom · s, p and d shapes.").displayName).toBe("Atom");
  expect(classroomTopicIcon("chemistry", "Group 17 elements", "The p-Block Elements · The halogens.").displayName).toBe("Grid3x3");
});

/**
 * A table with one mark per broad area gives fifty cards the same glyph, which
 * tells a reader nothing about the card they are looking at. These bounds are
 * what keep the tables grained to the chapter a topic actually names: a cone, a
 * cylinder and a sphere are three marks, not three "solids".
 */
test("no single mark dominates a subject, and each subject draws on a wide set", () => {
  const spread: Record<string, { distinct: number; commonest: number }> = {};
  for (const id of SUBJECTS) {
    const topics = subject(id).topics;
    const counts = new Map<string, number>();
    for (const topic of topics) {
      const name = classroomTopicIcon(id, topic.name, topic.summary).displayName ?? "?";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    spread[id] = { distinct: counts.size, commonest: Math.max(...counts.values()) / topics.length };
  }
  for (const id of SUBJECTS) {
    expect(spread[id].distinct).toBeGreaterThanOrEqual(15);
    expect(spread[id].commonest).toBeLessThan(0.2);
  }
  // Maths is the largest room and the one that most needs the grain.
  expect(spread.maths.distinct).toBeGreaterThanOrEqual(40);
});

test("an exam topic lands on a mark that matches what the paper is about", () => {
  const cases: [subject: string, topic: string, icon: string][] = [
    ["govt-defence", "LCM, HCF and simplification", "Calculator"],
    ["professional-services", "Mains: Essay paper", "NotebookPen"],
    ["professional-services", "Clinical: medicine and allied", "Stethoscope"],
    ["design-architecture", "Studio test and model making", "Baseline"],
    ["navodaya", "Mental ability: odd one out", "Puzzle"],
  ];
  for (const [id, topic, icon] of cases) {
    expect(classroomTopicIcon(id, topic, "").displayName).toBe(icon);
  }
});

/** The grained maths rules, each of which a coarser table used to swallow. */
test("maths topics that share an area still get their own mark", () => {
  const cases: [topic: string, icon: string][] = [
    ["Surface area of a cone", "Cone"],
    ["Volume of a cylinder", "Cylinder"],
    ["Surface area of a sphere", "Globe"],
    ["Quadratic equations by factorisation", "SquareFunction"],
    ["Zeroes of a polynomial", "Variable"],
    ["Linear inequalities", "EqualNot"],
    ["Laws of logarithms", "TrendingUp"],
    ["Compound interest", "Banknote"],
    ["Profit and loss", "Coins"],
    ["Lines and angles", "Diameter"],
  ];
  for (const [topic, icon] of cases) expect(classroomTopicIcon("maths", topic, "").displayName).toBe(icon);
});
