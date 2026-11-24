import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { LandingTechShowcase } from "@/components/landing-showcase";
import { LandingBoardShowcase, LandingGovtShowcase } from "@/components/landing-showcase-exams";
import { TECH_TRACKS } from "@/lib/landing-showcase/tech";
import { GOVT_EXAMS } from "@/lib/landing-showcase/govt";

const picker = (label: string) => within(screen.getByRole("group", { name: label }));
const picked = (label: string) => picker(label).getAllByRole("button").find(b => b.getAttribute("aria-pressed") === "true")?.textContent;

test("Tech: autoplay turns every 5 s, keeps playing after a pill is picked, and pauses when an answer is opened", () => {
  jest.useFakeTimers();
  try {
    render(<LandingTechShowcase />);
    expect(picked("Technology")).toContain(TECH_TRACKS[0].kicker);
    act(() => { jest.advanceTimersByTime(5000); });
    expect(picked("Technology")).toContain(TECH_TRACKS[1].kicker);
    // Pills are paginated three a page; the pager's › steps to the next technology and the page follows.
    fireEvent.click(picker("Technology").getByRole("button", { name: "Next technology" }));
    expect(picked("Technology")).toContain(TECH_TRACKS[2].kicker);
    fireEvent.click(picker("Technology").getByRole("button", { name: "Next technology" }));
    expect(picked("Technology")).toContain(TECH_TRACKS[3].kicker);
    expect(picker("Technology").getByText(TECH_TRACKS[3].kicker)).toBeInTheDocument();
    expect(picker("Technology").queryByText(TECH_TRACKS[0].kicker)).toBeNull();
    act(() => { jest.advanceTimersByTime(5000); });
    expect(picked("Technology")).toContain(TECH_TRACKS[4].kicker);
    // Opening an answer pauses the carousel, so the question being read stays put.
    const second = TECH_TRACKS[4].answers[1];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(second.q.replace(/[?.()]/g, ".")) }));
    expect(screen.getByText(second.points[0])).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(20000); });
    expect(picked("Technology")).toContain(TECH_TRACKS[4].kicker);
    // The mock paper is an accordion with answers too.
    fireEvent.click(screen.getByRole("tab", { name: /Mock interview paper/ }));
    expect(screen.getByText(TECH_TRACKS[4].paper.questions[0].points[0])).toBeInTheDocument();
  } finally { jest.useRealTimers(); }
});

test("Board: exam-card sample paper per board, class and subject, with worked answers and the last five years", () => {
  render(<LandingBoardShowcase />);
  expect(screen.getByRole("heading", { name: "UP Board · High School" })).toBeInTheDocument();
  expect(screen.getByText("Mathematics", { selector: "dd" })).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Show answer" })[0]);
  expect(screen.getByText("96 = 2⁵ × 3")).toBeInTheDocument();
  fireEvent.click(picker("Board").getByRole("button", { name: /ICSE/ }));
  fireEvent.click(screen.getByRole("button", { name: /Physics/ }));
  expect(screen.getByText(/500 g of water/)).toBeInTheDocument();
  expect(screen.queryByText(/concave mirror/)).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: /Previous 5 years/ }));
  expect(screen.getAllByRole("link", { name: /Official paper/ })).toHaveLength(5);
  expect(screen.getByText("Held in two semesters")).toBeInTheDocument();
});

test("Government: paginated exams, a marked mock test, and exams without an interview say so", () => {
  render(<LandingGovtShowcase />);
  expect(picker("Exam").getByText("Exam", { exact: false })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /Mock test/ }));
  const first = GOVT_EXAMS[0].mock[0];
  fireEvent.click(within(screen.getByRole("radiogroup", { name: "Answer to question 1" })).getByRole("radio", { name: new RegExp(first.options[first.correct]) }));
  expect(screen.getByText("Correct.")).toBeInTheDocument();
  expect(screen.getByText("1 of 3 answered")).toBeInTheDocument();
  fireEvent.click(picker("Exam").getByRole("button", { name: /SSC CGL/ }));
  fireEvent.click(screen.getByRole("tab", { name: /Interview prep/ }));
  expect(screen.getByText(/no interview round/)).toBeInTheDocument();
  // Pages: UPSC, SSC, IBPS on page 1; the second page dot shows RRB NTPC, NDA and UPPSC.
  fireEvent.click(picker("Exam").getByRole("button", { name: "Exam page 2 of 2" }));
  expect(picker("Exam").getByRole("button", { name: /NDA/ })).toBeInTheDocument();
});
