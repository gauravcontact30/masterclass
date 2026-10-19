import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotesModal } from "@/components/notes-modal";
import { LessonCodeExamples } from "@/components/lesson-code-examples";
import { TOPIC_PROJECTS } from "@/lib/generation/topic-projects";
import type { DocumentRecord } from "@/lib/domain";

const document: DocumentRecord = {
  id: "reader-test", user_id: "sample", title: "Learning reader", status: "ready", created_at: "2026-09-12T00:00:00Z", error_code: null,
  request: { technologyId: "python", topicId: "python-notes", format: "notes", language: "en", level: "beginner" },
  page_titles: [], storage_path: null, preview_paths: [], curriculum: {
    title: "Learning reader", minutes: 20, objectives: ["Learn values", "Apply functions"], prerequisites: [],
    lessons: [1, 2].map(index => ({ title: `Topic ${index}`, explanation: `Explanation for topic ${index}`, example: "Worked example", code: "", exercise: "Try the exercise", checkpoint: "Check the result", mistake: "Avoid mutation" })),
    project: "Build a small project", summary: "Remember the concept", glossary: [],
  },
};
beforeEach(() => localStorage.clear());

test("header owns icon navigation, contents collapse and expansion preserve reading position", async () => {
  const user = userEvent.setup();
  render(<NotesModal sample document={document} onClose={jest.fn()} />);
  const next = screen.getByRole("button", { name: "Next lesson" });
  expect(next.closest("header")).not.toBeNull();
  const previous = screen.getByRole("button", { name: "Previous lesson" });
  expect(previous).toBeDisabled();
  const collapse = screen.getByRole("button", { name: "Collapse contents" });
  expect(collapse).toHaveAttribute("aria-expanded", "true");
  await user.click(collapse);
  expect(screen.queryByRole("navigation", { name: "Contents" })).not.toBeInTheDocument();
  await user.click(next);
  expect(screen.getByRole("heading", { name: "Topic 1" }).closest("section")).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Expand contents" }));
  const contents = screen.getByRole("navigation", { name: "Contents" });
  expect(within(contents).getByRole("button", { name: /Topic 1/ })).toHaveAttribute("aria-current", "location");
  expect(previous).toBeEnabled();
});

test("each example is its own accordion, with a tab per file", async () => {
  const user = userEvent.setup();
  const { container } = render(<LessonCodeExamples examples={TOPIC_PROJECTS.python} hi={false} />);
  const accordions = container.querySelectorAll("section > details");
  expect(accordions).toHaveLength(TOPIC_PROJECTS.python.length);
  // The first example is open; the rest start collapsed.
  expect(accordions[0]).toHaveAttribute("open");
  expect(accordions[1]).not.toHaveAttribute("open");

  const first = within(accordions[0] as HTMLElement);
  expect(first.getByText("Core concept")).toBeInTheDocument();
  // Files are reachable both as tabs and in the project tree.
  await user.click(first.getAllByRole("tab", { name: "main.py" })[0]);
  expect(first.getByText("project/src/main.py")).toBeInTheDocument();
  await user.click(first.getByRole("button", { name: "Copy file" }));
  expect(await navigator.clipboard.readText()).toContain("from values import copy_scores, total");

  const second = within(accordions[1] as HTMLElement);
  expect(second.getByText("Applied example")).toBeInTheDocument();
  expect(second.getByRole("heading", { name: "A receipt with typed line items" })).toBeInTheDocument();
  expect(second.getByText("Return type & value", { exact: false })).toBeInTheDocument();
});

test("clipboard failure is visible and does not report success", async () => {
  const user = userEvent.setup();
  jest.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("Denied"));
  const { container } = render(<LessonCodeExamples examples={TOPIC_PROJECTS.python} hi={false} />);
  const first = within(container.querySelector("section > details") as HTMLElement);
  await user.click(first.getByRole("button", { name: "Copy file" }));
    expect(await first.findByText("Copy failed. Select the code to copy it.")).toHaveAttribute("role", "status");
});

test("completion and personal notes survive closing and reopening the sample", async () => {
  const user = userEvent.setup();
  const close = jest.fn();
  const { unmount } = render(<NotesModal sample document={document} onClose={close} />);
  await user.click(screen.getByText("Your notes", { selector: "summary" }));
  await user.type(screen.getByRole("textbox", { name: "Your notes" }), "Practice later");
  await user.click(screen.getByRole("button", { name: "Mark complete" }));
  await user.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() => expect(close).toHaveBeenCalled());
  unmount();
  render(<NotesModal sample document={document} onClose={jest.fn()} />);
  expect(screen.getByRole("textbox", { name: "Your notes" })).toHaveValue("Practice later");
  expect(screen.getByRole("button", { name: "Completed" })).toHaveAttribute("aria-pressed", "true");
});
