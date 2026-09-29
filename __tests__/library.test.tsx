import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Library, readingState, type LibraryProps } from "@/components/library";
import { LanguageProvider } from "@/components/language-provider";
import type { DocumentRecord, Technology, Topic } from "@/lib/domain";
import { fill, LIBRARY_PAGE_SIZE, pageItems, paginate, searchDocuments, sortLibrary, uniqueLibraryDocuments } from "@/lib/library";

let seq = 0;
function doc(over: Partial<DocumentRecord> & { technologyId?: string; topicId?: string; language?: "en" | "hi" } = {}): DocumentRecord {
  const { technologyId = "react", topicId = "react-hooks", language = "en", ...rest } = over;
  seq++;
  return {
    id: `d${seq}`, user_id: "u1", title: `Guide ${seq}`, status: "ready", created_at: `2026-01-${String(10 + (seq % 18)).padStart(2, "0")}T00:00:00Z`,
    curriculum: null, error_code: null, storage_path: null, preview_paths: [], page_titles: ["One", "Two", "Three", "Four"],
    request: { technologyId, topicId, format: "notes", language, level: "beginner" },
    ...rest,
  } as DocumentRecord;
}
const technologies: Technology[] = [{ id: "react", title: "React", title_hi: "रिएक्ट", category: "frontend" }, { id: "python", title: "Python", title_hi: "", category: "languages" }];
const topics: Topic[] = [{ id: "react-hooks", technology_id: "react", title: "State management", title_hi: "स्टेट", full_track: false, version: 1, references: [] }];

/** The polite live region that announces the result count. */
const announced = () => screen.getAllByRole("status").map(node => node.textContent).join(" | ");

function setup(props: Partial<LibraryProps> = {}) {
  const handlers = { onLearn: jest.fn(), onCopyNotes: jest.fn(), onRetry: jest.fn(), onDelete: jest.fn() };
  const view = render(<LanguageProvider><Library documents={[]} technologies={technologies} topics={topics} {...handlers} {...props} /></LanguageProvider>);
  return { ...handlers, ...view };
}

describe("library helpers", () => {
  test("uniqueLibraryDocuments keeps the best copy of each course", () => {
    const failed = doc({ title: "Hooks", status: "failed", created_at: "2026-02-01T00:00:00Z" });
    const oldReady = doc({ title: "hooks ", created_at: "2026-01-01T00:00:00Z" });
    const newReady = doc({ title: "Hooks", created_at: "2026-01-05T00:00:00Z" });
    const other = doc({ title: "Hooks", language: "hi" });
    expect(uniqueLibraryDocuments([failed, oldReady, newReady, other]).map(item => item.id)).toEqual([newReady.id, other.id]);
  });

  test("uniqueLibraryDocuments breaks equal-status ties by the newer copy only", () => {
    const newer = doc({ title: "Same", created_at: "2026-01-09T00:00:00Z" });
    const older = doc({ title: "Same", created_at: "2026-01-02T00:00:00Z" });
    expect(uniqueLibraryDocuments([newer, older])).toEqual([newer]);
  });

  test("sortLibrary is newest first with a stable id tiebreak and tolerates bad dates", () => {
    const a = doc({ id: "a", created_at: "2026-01-01T00:00:00Z" }), b = doc({ id: "b", created_at: "2026-01-01T00:00:00Z" }), c = doc({ id: "c", created_at: "2026-03-01T00:00:00Z" }), bad = doc({ id: "z", created_at: "not a date" });
    expect(sortLibrary([bad, b, a, c]).map(item => item.id)).toEqual(["c", "a", "b", "z"]);
    expect(sortLibrary([c, a, bad]).map(item => item.id)).toEqual(["c", "a", "z"]);
  });

  test("searchDocuments needs every term somewhere in title, ids or catalogue names", () => {
    const hooks = doc({ title: "Hooks in depth" }), py = doc({ title: "Basics", technologyId: "python", topicId: "py_basics" });
    expect(searchDocuments([hooks, py], "  ")).toHaveLength(2);
    expect(searchDocuments([hooks, py], "react state", { technologies, topics })).toEqual([hooks]);
    expect(searchDocuments([hooks, py], "py basics")).toEqual([py]);
    expect(searchDocuments([hooks, py], "रिएक्ट", { technologies, topics })).toEqual([hooks]);
    expect(searchDocuments([hooks, py], "react missing")).toEqual([]);
  });

  test("paginate clamps the page and reports the visible range", () => {
    const items = Array.from({ length: 13 }, (_, i) => i);
    expect(paginate(items, 3)).toEqual({ items: [12], page: 3, pages: 3, from: 13, to: 13, total: 13 });
    expect(paginate(items, 99).page).toBe(3);
    expect(paginate(items, Number.NaN).page).toBe(1);
    expect(paginate([], 1)).toEqual({ items: [], page: 1, pages: 1, from: 0, to: 0, total: 0 });
    expect(paginate(items, 2, 5).items).toEqual([5, 6, 7, 8, 9]);
    expect(paginate(items, 1).items).toHaveLength(LIBRARY_PAGE_SIZE);
  });

  test("pageItems elides long ranges around the current page", () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(2, 10)).toEqual([1, 2, 3, 4, 5, "gap", 10]);
    expect(pageItems(9, 10)).toEqual([1, "gap", 6, 7, 8, 9, 10]);
    expect(pageItems(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
  });

  test("fill replaces known placeholders and leaves unknown ones", () => {
    expect(fill("{total} of {missing}", { total: 3 })).toBe("3 of {missing}");
  });

  test("readingState reports the saved lesson and completion", () => {
    expect(readingState(undefined, 4)).toEqual({ lesson: 0, percent: 0, completed: false });
    expect(readingState({ document_id: "x", page: 2, completed: false, bookmarks: [], notes: "" } as never, 4)).toEqual({ lesson: 2, percent: 50, completed: false });
    expect(readingState({ document_id: "x", page: 0, completed: false } as never, 1)).toEqual({ lesson: 1, percent: 0, completed: false });
    expect(readingState({ document_id: "x", page: 9, completed: true } as never, 4)).toEqual({ lesson: 4, percent: 100, completed: true });
  });
});

describe("Library", () => {
  test("shows skeletons while loading and an empty state with no documents", () => {
    const { rerender } = setup({ loading: true });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    rerender(<LanguageProvider><Library documents={[]} onLearn={jest.fn()} onCopyNotes={jest.fn()} onRetry={jest.fn()} onDelete={jest.fn()} /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "Your learning library starts here" })).toBeInTheDocument();
  });

  test("groups guides by category and counts them", () => {
    setup({ documents: [doc({ title: "Hooks" }), doc({ title: "Loops", technologyId: "python", topicId: "py-loops" })] });
    expect(announced()).toContain("2 guides");
    expect(screen.getByRole("heading", { name: "Hooks" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Loops" })).toBeInTheDocument();
  });

  test("searching filters, announces results, clears with the button or Escape, and shows a no-match state", async () => {
    setup({ documents: [doc({ title: "Hooks" }), doc({ title: "Loops", technologyId: "python", topicId: "py-loops" })] });
    const input = screen.getByRole("searchbox", { name: "Search your library" });
    await userEvent.type(input, "hooks");
    expect(announced()).toContain("1 result for “hooks”");
    expect(screen.queryByRole("heading", { name: "Loops" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    await userEvent.type(input, "o");
    expect(announced()).toContain("2 results for “o”");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("");
    fireEvent.keyDown(input, { key: "Escape" });
    await userEvent.type(input, "zzz");
    expect(screen.getByRole("heading", { name: "Nothing matches “zzz”" })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Clear search" }).at(-1)!);
    expect(input).toHaveValue("");
  });

  test("an external query hides the search box and clears through the parent", async () => {
    const onQueryChange = jest.fn();
    setup({ documents: [doc({ title: "Hooks" })], externalQuery: "nothing", onQueryChange });
    expect(screen.queryByRole("searchbox")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onQueryChange).toHaveBeenCalledWith("");
  });

  test("a ready guide offers learn, copy, download and delete; progress switches Learn to Continue", async () => {
    const ready = doc({ title: "Hooks" });
    const { onLearn, onCopyNotes, onDelete } = setup({ documents: [ready], progress: [{ document_id: ready.id, page: 2, completed: false, bookmarks: [], notes: "" } as never] });
    const card = screen.getByRole("heading", { name: "Hooks" }).closest("li")!;
    expect(within(card).getByText("Lesson 2 of 4")).toBeInTheDocument();
    expect(within(card).getByText("4 lessons")).toBeInTheDocument();
    await userEvent.click(within(card).getByRole("button", { name: /Continue learning/ }));
    expect(onLearn).toHaveBeenCalledWith(ready);
    await userEvent.click(within(card).getByRole("button", { name: /Copy notes/ }));
    expect(onCopyNotes).toHaveBeenCalledWith(ready);
    await userEvent.click(within(card).getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(ready);
    expect(within(card).getByRole("link")).toHaveAttribute("href", `/api/documents/${ready.id}/download`);
  });

  test("a completed guide and a copied guide show their states, in Hindi too", () => {
    const done = doc({ title: "Done", language: "hi", page_titles: ["Only"] });
    setup({ documents: [done], copiedId: done.id, progress: [{ document_id: done.id, page: 1, completed: true } as never] });
    const card = screen.getByRole("heading", { name: "Done" }).closest("li")!;
    expect(within(card).getAllByText("Completed").length).toBeGreaterThan(0);
    expect(within(card).getByText("Copied")).toBeInTheDocument();
    expect(within(card).getByText("हिन्दी")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /Learn in App/ })).toBeInTheDocument();
  });

  test("failed guides can be retried and pending guides cannot be deleted", async () => {
    const failed = doc({ title: "Broken", status: "failed", technologyId: "unknown-tech" });
    const pending = doc({ title: "Brewing", status: "generating", technologyId: "unknown-tech" });
    const { onRetry } = setup({ documents: [failed, pending] });
    const failedCard = screen.getByRole("heading", { name: "Broken" }).closest("li")!;
    expect(within(failedCard).getByText(/Generation failed/)).toBeInTheDocument();
    expect(within(failedCard).getAllByText("Unknown tech").length).toBeGreaterThan(0);
    await userEvent.click(within(failedCard).getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledWith(failed.request);
    const pendingCard = screen.getByRole("heading", { name: "Brewing" }).closest("li")!;
    expect(within(pendingCard).getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(within(pendingCard).queryByRole("button", { name: "Try again" })).toBeNull();
  });

  test("busy disables retry and delete", () => {
    setup({ busy: true, documents: [doc({ title: "Broken", status: "failed" })] });
    expect(screen.getByRole("button", { name: "Try again" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  test("a category pages six guides at a time", async () => {
    setup({ documents: Array.from({ length: 8 }, (_, i) => doc({ title: `React ${i}`, created_at: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z` })) });
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(6);
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(2);
  });

  test("renders Hindi technology names and dates when the language is Hindi", () => {
    localStorage.setItem("masterclass:language", "hi");
    try {
      setup({ documents: [doc({ title: "Hooks", page_titles: undefined as never }), doc({ title: "Odd", technologyId: "--" }), doc({ title: "Loops", technologyId: "python", topicId: "py-loops" })] });
      expect(screen.getAllByText("रिएक्ट").length).toBeGreaterThan(0);
      // No Hindi title: the English one is used.
      expect(within(screen.getByRole("heading", { name: "Loops" }).closest("li")!).getAllByText("Python").length).toBeGreaterThan(0);
      const odd = screen.getByRole("heading", { name: "Odd" }).closest("li")!;
      expect(within(odd).getAllByText("--").length).toBeGreaterThan(0);
      expect(screen.getByRole("heading", { name: "Hooks" }).closest("li")!.textContent).not.toMatch(/lessons|पाठ/);
    } finally { localStorage.removeItem("masterclass:language"); }
  });
});
