import { fireEvent, render, screen, within } from "@testing-library/react";
import { NotesLibrary } from "@/components/notes-library";
import type { DocumentRecord } from "@/lib/domain";
jest.mock("@/lib/client", () => ({ requestJson: jest.fn().mockRejectedValue(new Error("offline")) }));

const technologies = [
  { id: "react", title: "React", title_hi: "रिएक्ट", category: "web" },
  { id: "python", title: "Python", title_hi: "पाइथन", category: "language" },
  { id: "aws", title: "AWS", title_hi: "AWS", category: "cloud" },
];
const doc = (technologyId: string): DocumentRecord => ({
  id: technologyId, user_id: "student", title: `${technologyId} fundamentals`,
  request: { technologyId, topicId: `${technologyId}-full`, format: "notes", language: "en", level: "beginner" },
  status: "ready", created_at: "2026-09-12T00:00:00Z", error_code: null,
  curriculum: null, page_titles: [], storage_path: null, preview_paths: [],
});
const props = { technologies, documents: [doc("react"), doc("aws")], onLearn: jest.fn(), onCopyNotes: jest.fn(), onRetry: jest.fn(), onDelete: jest.fn() };

test("lists every catalog technology including those without saved notes, and searches by translated name and category", () => {
  render(<NotesLibrary {...props} />);
  expect(screen.getAllByRole("article")).toHaveLength(3);
  expect(within(screen.getByRole("article", { name: "Python" })).getByText("No notes in your library yet.")).toBeVisible();
  const search = screen.getByRole("searchbox", { name: "Search technologies" });
  fireEvent.change(search, { target: { value: "रिएक्ट" } });
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByRole("article", { name: "React" })).toBeVisible();
  fireEvent.change(search, { target: { value: "cloud" } });
  expect(screen.getByRole("article", { name: "AWS" })).toBeVisible();
  fireEvent.change(search, { target: { value: "no-such-technology" } });
  expect(screen.getByText("No technologies found")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(screen.getAllByRole("article")).toHaveLength(3);
});

test("opens only the selected technology's guides with working reader actions and returns to all cards", async () => {
  render(<NotesLibrary {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "View React notes" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("heading", { name: "react fundamentals" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "aws fundamentals" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Learn in App" }));
  expect(props.onLearn).toHaveBeenCalledWith(props.documents[0]);
  fireEvent.click(screen.getByRole("button", { name: "Copy notes" }));
  expect(props.onCopyNotes).toHaveBeenCalledWith(props.documents[0]);
  fireEvent.click(screen.getByRole("button", { name: "All technologies" }));
  expect(screen.getAllByRole("article")).toHaveLength(3);
});

test("keeps saved technology notes discoverable when catalog data is unavailable", async () => {
  render(<NotesLibrary {...props} technologies={[]} />);
  expect(screen.getAllByRole("article")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "View React 19+ notes" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("heading", { name: "react fundamentals" })).toBeVisible();
});
