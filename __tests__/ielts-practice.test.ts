import { buildIeltsPracticeTests, ieltsPracticeBank } from "@/lib/ielts/practice";
import { chartImage, TASK1_CHARTS } from "@/lib/ielts/charts";
import { ieltsBank } from "@/lib/ielts/bank";

const bank = ieltsPracticeBank();
const set = buildIeltsPracticeTests(bank);

test("380+ practice questions with answers, objective and written, unique ids, one right option among distinct options", () => {
  expect(bank.length).toBeGreaterThanOrEqual(380);
  expect(new Set(bank.map(q => q.id)).size).toBe(bank.length);
  const objective = bank.filter(q => q.options), written = bank.filter(q => !q.options);
  expect(objective.length).toBeGreaterThanOrEqual(250);
  expect(written.length).toBeGreaterThanOrEqual(70);
  for (const q of bank) {
    expect(q.answer.trim()).not.toBe("");
    if (q.options) { expect(new Set(q.options).size).toBe(q.options.length); expect(q.options.length).toBeGreaterThanOrEqual(3); expect(q.answer).toContain(q.options[q.correct!]); }
  }
  // Both banks together are what the dashboard advertises as 860+.
  expect(bank.length + ieltsBank().length).toBeGreaterThanOrEqual(860);
});

test("every chart is a valid SVG picture, and chart questions carry it", () => {
  for (const c of TASK1_CHARTS) {
    const svg = decodeURIComponent(chartImage(c).replace("data:image/svg+xml;charset=utf-8,", ""));
    expect(svg.startsWith("<svg")).toBe(true); expect(svg).not.toMatch(/NaN|undefined/);
  }
  const charted = bank.filter(q => q.skill === "Task 1 data" || q.skill === "Writing Task 1" || q.skill === "Listening");
  expect(charted.every(q => q.figure?.src.startsWith("data:image/svg+xml"))).toBe(true);
  expect(bank.filter(q => q.figure).length).toBeGreaterThanOrEqual(60);
});

test("computed chart answers match the data", () => {
  const net = TASK1_CHARTS.find(c => c.id === "internet")!;
  const first = bank.find(q => q.id === "ip-c-internet-0")!; expect(first.options![first.correct!]).toBe("Country C");
  const last = bank.find(q => q.id === "ip-c-internet-1")!; expect(last.options![last.correct!]).toBe("Country A");
  const change = bank.find(q => q.id === "ip-c-internet-2")!; expect(change.options![change.correct!]).toBe("+77");
  expect(net.kind).toBe("line");
  const food = bank.find(q => q.id === "ip-c-spending-2")!; expect(food.options![food.correct!]).toBe("−14");
});

test("15 tests in order A–F, each group (transcript, passage, chart) kept together, no years tab", () => {
  const papers = [...set.sample, ...set.mock];
  expect(papers).toHaveLength(15); expect(set.years).toHaveLength(0);
  for (const p of papers) {
    expect(p.questions.map(q => q.section).join("")).toMatch(/^A+B+C+D+E+F+$/);
    expect(new Set(p.questions.map(q => q.id)).size).toBe(p.questions.length);
    for (const s of "ABC") expect(new Set(p.questions.filter(q => q.section === s).map(q => (q as { group?: string }).group)).size).toBe(1);
    expect(p.questions.length).toBeGreaterThanOrEqual(22);
  }
  expect(set.unique).toBeGreaterThanOrEqual(200);
});
