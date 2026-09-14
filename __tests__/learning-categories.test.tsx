import { fireEvent, render, screen, within } from "@testing-library/react";
import { Library } from "@/components/library";
import { groupLearningDocuments, learningCategoryId } from "@/lib/learning-categories";
import type { DocumentRecord } from "@/lib/domain";

const doc = (technologyId: string, id = technologyId): DocumentRecord => ({ id, user_id: "student", title: `Guide ${id}`, request: { technologyId, topicId: `${technologyId}-full`, format: "notes", language: "en", level: "beginner" }, status: "ready", created_at: "2026-09-12T00:00:00Z", error_code: null, curriculum: null, page_titles: [], storage_path: null, preview_paths: [] });

test("requested technologies belong to the right group, with testing taking precedence over React", () => {
  const expected = { react: "frontend", nextjs: "frontend", zustand: "frontend", "tanstack-start": "frontend", javascript: "javascript", typescript: "javascript", jest: "testing", "react-testing-library": "testing", vitest: "testing", playwright: "testing", cypress: "testing", "aws-services": "cloud", "devops-services": "cloud", "ai-fundamentals": "ai", python: "languages", postgresql: "backend", unknown: "other" };
  Object.entries(expected).forEach(([id, group]) => expect(learningCategoryId(id)).toBe(group));
  const documents = Object.keys(expected).map(id => doc(id));
  const grouped = groupLearningDocuments(documents);
  expect(grouped.flatMap(group => group.documents)).toHaveLength(documents.length);
  expect(new Set(grouped.flatMap(group => group.documents.map(item => item.id))).size).toBe(documents.length);
});

test("technology sections paginate independently, preserve guide actions and reset after search", () => {
  const onLearn = jest.fn();
  const documents = [...Array.from({ length: 8 }, (_, i) => doc("react", `react-${i}`)), doc("javascript"), doc("jest"), doc("aws")];
  const props = { documents, onLearn, onCopyNotes: jest.fn(), onRetry: jest.fn(), onDelete: jest.fn() };
  const { rerender } = render(<Library {...props} externalQuery="" />);
  const frontend = within(screen.getByRole("region", { name: "React & frontend frameworks" }));
  expect(frontend.getAllByRole("article")).toHaveLength(6);
  expect(screen.getByRole("region", { name: "JavaScript & TypeScript" })).toBeVisible();
  fireEvent.click(frontend.getByRole("button", { name: "Next" }));
  expect(frontend.getAllByRole("article")).toHaveLength(2);
  const testing = within(screen.getByRole("region", { name: "Testing & quality" }));
  fireEvent.click(testing.getByRole("button", { name: "Learn in App" }));
  expect(onLearn).toHaveBeenCalledWith(doc("jest"));
  rerender(<Library {...props} externalQuery="react-0" />);
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.queryByRole("region", { name: "Cloud & DevOps" })).not.toBeInTheDocument();
  rerender(<Library {...props} externalQuery="" />);
  expect(within(screen.getByRole("region", { name: "React & frontend frameworks" })).getByRole("button", { name: "Previous" })).toBeDisabled();
});
