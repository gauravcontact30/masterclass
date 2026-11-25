import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ExamSamplePapers } from "@/components/exam-sample-papers";
import { buildPapers, PAPER_YEARS } from "@/lib/board-exams/sample-papers";
import type { Ranked } from "@/lib/board-exams/importance";
import type { Stars } from "@/lib/board-exams/types";

Element.prototype.scrollIntoView ??= function () {};

// A small board set: 400 objective and 300 written questions over four chapters.
const CH = ["Real Numbers", "Polynomials", "Triangles", "Statistics"];
const ranked: Ranked[] = [
  ...Array.from({ length: 400 }, (_, i): Ranked => ({ type: "objective", id: `m${i}`, ch: CH[i % 4], stars: (5 - (i % 3)) as Stars, asked: "", boards: ["up"],
    mcq: { id: `m${i}`, ch: CH[i % 4], q: `Objective question ${i}`, options: [`opt${i}a`, `opt${i}b`, `opt${i}c`, `opt${i}d`], correct: i % 4, why: `Because ${i}` } })),
  ...Array.from({ length: 300 }, (_, i): Ranked => ({ type: "subjective", id: `w${i}`, ch: CH[i % 4], stars: 4, asked: "", boards: ["up"],
    item: { id: `w${i}`, kind: "bank", ch: CH[i % 4], q: `Written question ${i}`, a: `Answer ${i}`, steps: [`Step ${i}`], marks: i % 5 === 0 ? 5 : 2 } })),
];
const set = buildPapers(ranked, "up", "10", "math", marks => marks * 2, "UP High School");
const ui = () => render(<ExamSamplePapers set={set} title="UP Board · High School · Math" boardName="UP Board" officialHref="https://upmsp.edu.in/" archiveNote={() => "Usually on the official site"} />);
const questions = () => within(document.querySelector("ol[class*=list]") as HTMLElement).queryAllByText(/^Q\d+$/);

const first = set.sample[0], N = first.questions.length, OBJ = first.questions.filter(q => q.options).length;

test("builds 6 sample papers, 6 mock tests and 20 year papers, each worth exactly the board's marks, 400+ questions in all", () => {
  expect(set.sample).toHaveLength(6); expect(set.mock).toHaveLength(6); expect(set.years.map(p => p.year)).toEqual(PAPER_YEARS);
  for (const paper of [...set.sample, ...set.mock, ...set.years]) {
    expect(paper.marks).toBe(80);
    expect(paper.questions.reduce((sum, q) => sum + q.marks, 0)).toBe(80);
    expect(new Set(paper.questions.map(q => q.id)).size).toBe(paper.questions.length);
    // Objective first, then sections in letter order, each named.
    const letters = paper.questions.map(q => q.section);
    expect(letters[0]).toBe("A"); expect([...letters].sort().join("")).toBe(letters.join(""));
    for (const letter of new Set(letters)) expect(paper.sectionNames?.[letter]).toBeTruthy();
  }
  expect(set.unique).toBeGreaterThanOrEqual(400);
});

test("shows ten questions a page with paging, and reveals a worked answer", () => {
  ui();
  expect(questions()).toHaveLength(10);
  expect(screen.getByText(`Showing 1–10 of ${N} questions`)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /next page/i }));
  expect(screen.getByText(`Showing 11–20 of ${N} questions`)).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Show answer" })[0]);
  expect(screen.getByRole("button", { name: "Hide answer" })).toBeInTheDocument();
  expect(screen.getByText("Answer:")).toBeInTheDocument();
});

test("search, the filter panel and clear all work together", () => {
  ui();
  const target = first.questions[12];
  fireEvent.change(screen.getByRole("combobox"), { target: { value: target.q } });
  expect(screen.getByText("Showing 1–1 of 1 question")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
  expect(screen.getByText(`Showing 1–10 of ${N} questions`)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
  fireEvent.click(within(screen.getByRole("group", { name: "Filters" })).getByRole("button", { name: "Objective" }));
  expect(screen.getByText(`Showing 1–10 of ${OBJ} questions`)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Filters/ })).toHaveTextContent("1");
});

test("a mock test is timed: answers are locked until it starts, marked only on submit, and time running out submits it", () => {
  jest.useFakeTimers();
  try {
    ui();
    fireEvent.click(screen.getByRole("tab", { name: /Mock tests/ }));
    const paper = set.mock[0], q = paper.questions[0], objective = paper.questions.filter(x => x.options).length;
    const options = () => within(screen.getByRole("group", { name: "Options for question 1" }));
    expect(options().getAllByRole("button").every(b => (b as HTMLButtonElement).disabled)).toBe(true);
    expect(screen.queryByRole("button", { name: "Show answer" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Start test" }));
    const wrong = (q.correct! + 1) % 4;
    fireEvent.click(options().getByRole("button", { name: new RegExp(`\(${"abcd"[wrong]}\)`) }));
    // Picked, not marked: no score and no answer yet.
    expect(screen.queryByText(`0/${objective}`)).toBeNull();
    expect(screen.queryByText("Answer:")).toBeNull();
    act(() => { jest.advanceTimersByTime(paper.minutes * 60_000 + 1000); });
    expect(screen.getByText(`0/${objective}`)).toBeInTheDocument();
    expect(screen.getAllByText("Answer:").length).toBeGreaterThan(0);
    expect(options().getAllByRole("button").every(b => (b as HTMLButtonElement).disabled)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Retake" }));
    expect(screen.getByRole("button", { name: "Start test" })).toBeInTheDocument();
  } finally { jest.useRealTimers(); }
});

test("year papers say they are practice papers and page through 20 years", () => {
  ui();
  fireEvent.click(screen.getByRole("tab", { name: /Previous 20 years/ }));
  expect(screen.getByRole("heading", { name: "UP High School 2025 practice paper" })).toBeInTheDocument();
  expect(screen.getByText(/not the board's own 2025 paper/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Older years" }));
  fireEvent.click(screen.getByRole("button", { name: "2006" }));
  expect(screen.getByRole("heading", { name: "UP High School 2006 practice paper" })).toBeInTheDocument();
});

/* ---- Official papers (lib/board-exams/official-papers). Test-only data, not a real paper. ---- */
import { checkPaper, officialYears, toPaper, type OfficialPaper } from "@/lib/board-exams/official-papers";

const testPaper: OfficialPaper = {
  board: "up", cls: "10", subjects: ["math"], year: 2024, paper: "Test Paper 999", set: "Set T", marks: 3, minutes: 30,
  source: { label: "test fixture", file: "fixture.pdf", entered: "2026-11-24" },
  questions: [
    { no: "1", section: "A", marks: 1, q: "Fixture objective", options: ["one", "two", "three", "four"], correct: 1, answer: "two", answerBy: "board" },
    { no: "2", section: "B", marks: 2, q: "Fixture written", steps: ["Step"], answer: "Fixture answer", answerBy: "ours" },
  ],
};

test("the checker refuses papers with missing answers, bad options, placeholders or too many marks", () => {
  expect(checkPaper(testPaper)).toEqual([]);
  const broken = { ...testPaper, marks: 1, questions: [{ ...testPaper.questions[0], correct: 7, answer: " " }, { ...testPaper.questions[1], answerBy: "x" as never, q: "<question>" }] };
  const errors = checkPaper(broken).join(" | ");
  expect(errors).toMatch(/answer is missing/); expect(errors).toMatch(/correct must point/); expect(errors).toMatch(/answerBy/);
  expect(errors).toMatch(/placeholder/); expect(errors).toMatch(/more than the paper's 1/);
  expect(officialYears("up", "10", "math", { "up-10-math-2024": 0, "up-10-math-2019": 0, "cbse-10-math-2023": 0 })).toEqual([2024, 2019]);
});

test("a year with the board's own paper shows it, marked official, with each answer's source; practice stays one click away", async () => {
  render(<ExamSamplePapers set={set} title="t" boardName="UP Board" officialHref="https://upmsp.edu.in/" archiveNote={() => "x"}
    officialYears={[2024]} loadOfficial={async () => toPaper(testPaper, "UP High School 2024 board paper")} />);
  fireEvent.click(screen.getByRole("tab", { name: /Previous 20 years/ }));
  fireEvent.click(screen.getByRole("button", { name: /2024/ }));
  await act(async () => {});
  expect(screen.getByRole("heading", { name: /UP High School 2024 board paper\s*Official paper/ })).toBeInTheDocument();
  expect(screen.getByText(/Test Paper 999 · Set T/)).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Show answer" })[1]);
  expect(screen.getByText(/^Answer written by us/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Open our 2024 practice paper instead" }));
  expect(screen.getByRole("heading", { name: "UP High School 2024 practice paper" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Back to the official 2024 paper" }));
  expect(screen.getByRole("heading", { name: /Official paper/ })).toBeInTheDocument();
});
