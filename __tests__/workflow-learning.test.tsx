import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingWorkflows } from "@/components/landing-workflows";
import { WORKFLOW_LESSONS } from "@/lib/workflow-learning";
import { WORKFLOW_CURRICULUM } from "@/lib/workflow-curriculum";
import { WORKFLOW_LESSON_GUIDES } from "@/lib/workflow-lesson-guides";
import { ExclusiveAccordions } from "@/components/exclusive-accordions";

jest.mock("next/dynamic", () => ({ __esModule: true, default: () => () => null }));
jest.mock("@/components/dashboard-lessons", () => ({ DashboardLessons: () => null }));

test("dashboard filters switch between new learning paths and existing diagram blueprints", () => {
  render(<LandingWorkflows expanded />);
  const filters = screen.getByRole("group", { name: "Filter workflows" });
  fireEvent.click(within(filters).getByRole("button", { name: /^React 19\+/ }));
  expect(screen.getByText("Build a form with Actions and optimistic feedback")).toBeInTheDocument();
  expect(screen.queryByRole("list", { name: "Workflow blueprints" })).not.toBeInTheDocument();
  const summary = screen.getByText("Build a form with Actions and optimistic feedback").closest("summary")!;
  expect(summary.parentElement).toHaveAttribute("open");
  fireEvent.click(screen.getByRole("tab", { name: "Learning guide" }));
  expect(screen.getByText("React: useActionState")).toBeVisible();
  expect(within(screen.getByRole("tabpanel")).queryByRole("link")).not.toBeInTheDocument();
  fireEvent.click(within(filters).getByRole("button", { name: /^System Design/ }));
  expect(screen.getByText("Review a system before scaling it")).toBeInTheDocument();
  expect(screen.getByRole("list", { name: "Workflow blueprints" })).toBeInTheDocument();
  expect(screen.queryByText("Build a form with Actions and optimistic feedback")).not.toBeInTheDocument();
  fireEvent.click(within(filters).getByRole("button", { name: /^All/ }));
  expect(screen.getByText("Connect automation, agent execution and evaluation")).toBeInTheDocument();
});

test("the landing preview keeps its existing category selection", () => {
  render(<LandingWorkflows preview />);
  expect(screen.queryByRole("region", { name: "Official documentation learning paths" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /^React 19\+/ })).not.toBeInTheDocument();
});

test("topic search reveals a matching path, answers, empty state and reset", () => {
  render(<LandingWorkflows expanded />);
  const search = screen.getByRole("searchbox", { name: "Search core features and interview topics" });
  expect(screen.getByRole("status")).toHaveTextContent("624 interview topics");
  fireEvent.change(search, { target: { value: "Reducers and concurrent updates" } });
  const title = screen.getByText("Resume a workflow from saved state");
  expect(title.closest("details")).toHaveAttribute("open");
  expect(screen.queryByText("Build a form with Actions and optimistic feedback")).not.toBeInTheDocument();
  expect(screen.getByText("Why do parallel branches need reducers?")).toBeVisible();
  fireEvent.change(search, { target: { value: "no-such-topic-xyz" } });
  expect(screen.getByText(/No topics match this search/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(search).toHaveValue("");
  expect(screen.getByRole("status")).toHaveTextContent("624 interview topics");
  fireEvent.change(search, { target: { value: "Reducers and concurrent updates" } });
  fireEvent.click(screen.getByRole("button", { name: /^React 19\+/ }));
  expect(screen.getByRole("searchbox")).toHaveValue("");
  expect(screen.getByRole("status")).toHaveTextContent("52 interview topics");
});

test("every learning category has a complete interview curriculum and official references", () => {
  for (const lesson of WORKFLOW_LESSONS) {
    const curriculum = WORKFLOW_CURRICULUM[lesson.group];
    expect(curriculum).toBeDefined();
    expect(curriculum.topics.length).toBeGreaterThanOrEqual(50);
    expect(new Set(curriculum.topics.map(topic => topic.title)).size).toBe(curriculum.topics.length);
    for (const topic of curriculum.topics) {
      expect(topic.question.endsWith("?")).toBe(true);
      expect(topic.answer.length).toBeGreaterThan(60);
    }
    for (const source of curriculum.sources) expect(new URL(source.url).protocol).toBe("https:");
  }
});

test("long topic lists reveal more entries and search includes topics beyond the first batch", () => {
  render(<LandingWorkflows expanded />);
  fireEvent.click(screen.getByRole("button", { name: /^React 19\+/ }));
  expect(screen.getByText("Showing 10 of 52 topics")).toBeVisible();
  expect(screen.queryByText("JSX and component composition")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show more topics for React 19+" }));
  expect(screen.getByText("JSX and component composition")).toBeVisible();
  expect(screen.getByText("Showing 20 of 52 topics")).toBeVisible();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "React Compiler awareness" } });
  expect(screen.getByText("Does a compiler remove the need for good state design?")).toBeVisible();
  expect(screen.getByText("Showing 1 of 1 topics")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Show more topics for React 19+" })).not.toBeInTheDocument();
});

test("dashboard immediately displays the collection summary, questions and answers", () => {
  render(<><LandingWorkflows expanded /><ExclusiveAccordions /></>);
  expect(screen.getByText("52 topics per category across all 12 categories — 624 interview questions and answers")).toBeVisible();
  for (const lesson of WORKFLOW_LESSONS) {
    const first = WORKFLOW_CURRICULUM[lesson.group].topics[0];
    expect(screen.getByText(first.question)).toBeVisible();
    expect(screen.getByText(first.answer)).toBeVisible();
  }
  fireEvent.click(screen.getByRole("button", { name: /^React 19\+/ }));
  fireEvent.click(screen.getByRole("button", { name: "Show all topics for React 19+" }));
  expect(screen.getByText("Showing 52 of 52 topics")).toBeVisible();
  expect(screen.getByText("Does a compiler remove the need for good state design?")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Show all topics for React 19+" })).not.toBeInTheDocument();
});

test.each(WORKFLOW_LESSONS)("$group has an in-app guide, image, workflow and practice panel", lesson => {
  render(<LandingWorkflows expanded />);
  const filters = screen.getByRole("group", { name: "Filter workflows" });
  const button = within(filters).getAllByRole("button").find(button => button.getAttribute("data-group") === lesson.group)!;
  fireEvent.click(button);
  fireEvent.click(screen.getByRole("tab", { name: "Learning guide" }));
  const panel = screen.getByRole("tabpanel");
  expect(within(panel).getByRole("img", { name: new RegExp(lesson.title) })).toBeVisible();
  expect(within(panel).queryByRole("link")).not.toBeInTheDocument();
  expect(within(panel).getByText(WORKFLOW_LESSON_GUIDES[lesson.id].sections[0].body)).toBeVisible();
  const guideTab = screen.getByRole("tab", { name: "Learning guide" });
  fireEvent.keyDown(guideTab, { key: "ArrowRight" });
  expect(screen.getByRole("tab", { name: "Workflow" })).toHaveFocus();
  expect(screen.getByText(lesson.steps[0])).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "Practice" }));
  expect(screen.getByText(lesson.exercise)).toBeVisible();
  expect(screen.getByText(WORKFLOW_LESSON_GUIDES[lesson.id].verify[0])).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "Interview Q&A" }));
  expect(screen.getByText(WORKFLOW_CURRICULUM[lesson.group].topics[0].answer)).toBeVisible();
});
