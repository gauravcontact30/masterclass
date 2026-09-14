import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Library, LibraryProps } from "@/components/library";
import type { DocumentRecord, GenerationRequest, Technology, Topic } from "@/lib/domain";
import { libraryCounts, LibraryFilter, pageItems, paginate, searchDocuments, sortLibrary } from "@/lib/library";

const baseRequest: GenerationRequest = { technologyId: "react", topicId: "react-state", format: "pdf", language: "en", level: "beginner", theme: "minimal" };
function makeDoc(id: string, overrides: Partial<DocumentRecord> = {}, request: Partial<GenerationRequest> = {}): DocumentRecord {
  return { id, user_id: "u1", title: `Guide ${id}`, request: { ...baseRequest, ...request }, status: "ready", created_at: "2026-01-01T00:00:00Z", error_code: null, curriculum: null, page_titles: [], storage_path: null, preview_paths: [], ...overrides };
}

const technologies: Technology[] = [
  { id: "react", title: "React", title_hi: "रिएक्ट", category: "web" },
  { id: "python", title: "Python", title_hi: "पाइथन", category: "language" },
];
const topics: Topic[] = [
  { id: "react-state", technology_id: "react", title: "State management", title_hi: "स्टेट प्रबंधन", full_track: false, version: 1, references: [] },
  { id: "py-basics", technology_id: "python", title: "Basics", title_hi: "मूल बातें", full_track: false, version: 1, references: [] },
];

const pdf = makeDoc("pdf", { title: "Hooks in depth" });
const pptx = makeDoc("pptx", { title: "Component deck" }, { format: "pptx" });
const notes = makeDoc("notes", { title: "Python cheat sheet" }, { format: "notes", technologyId: "python", topicId: "py-basics" });
const generatingPdf = makeDoc("gen", { title: "Server components", status: "generating" });

function Harness({ initialFilter = "all", ...props }: Partial<LibraryProps> & { documents: DocumentRecord[]; initialFilter?: LibraryFilter }) {
  const [filter, setFilter] = useState<LibraryFilter>(initialFilter);
  return (
    <Library
      technologies={technologies}
      topics={topics}
      filter={filter}
      onFilterChange={setFilter}
      onLearn={jest.fn()}
      onOpenNotes={jest.fn()}
      onCopyNotes={jest.fn()}
      onRetry={jest.fn()}
      onDelete={jest.fn()}
      {...props}
    />
  );
}

const titles = () => screen.queryAllByRole("heading", { level: 3 }).map(node => node.textContent);

describe("search", () => {
  test("matches titles and shows a live result count", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf, pptx, notes]} />);
    expect(screen.getByRole("status")).toHaveTextContent("3 materials");

    await user.type(screen.getByRole("searchbox", { name: "Search your library" }), "hooks");
    expect(titles()).toEqual(["Hooks in depth"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 result for “hooks”");
  });

  test("matches the technology and topic names, not just the title", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf, pptx, notes]} />);
    const search = screen.getByRole("searchbox");

    await user.type(search, "python");
    expect(titles()).toEqual(["Python cheat sheet"]);

    await user.clear(search);
    await user.type(search, "state management");
    expect(titles()).toEqual(["Hooks in depth", "Component deck"]);
  });

  test("clears with the x button, returning focus to the input", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf, pptx, notes]} />);
    const search = screen.getByRole("searchbox");
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();

    await user.type(search, "deck");
    expect(titles()).toEqual(["Component deck"]);
    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
    expect(titles()).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });

  test("clears with the Escape key", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf, pptx, notes]} />);
    const search = screen.getByRole("searchbox");
    await user.type(search, "deck");
    await user.keyboard("{Escape}");
    expect(search).toHaveValue("");
    expect(titles()).toHaveLength(3);
  });

  test("shows an empty state with a Clear search action when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf, pptx, notes]} />);
    await user.type(screen.getByRole("searchbox"), "kubernetes");

    expect(titles()).toEqual(["Nothing matches “kubernetes”"]);
    const actions = screen.getAllByRole("button", { name: "Clear search" });
    // One in the input, one in the empty state.
    expect(actions).toHaveLength(2);
    await user.click(actions[1]);
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(titles()).toHaveLength(3);
  });

  test("offers to search all formats when only the current filter has no match", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf, pptx, notes]} initialFilter="pptx" />);
    await user.type(screen.getByRole("searchbox"), "hooks");
    await user.click(screen.getByRole("button", { name: "Search all formats" }));
    expect(screen.getByRole("tab", { name: /All/ })).toHaveAttribute("aria-selected", "true");
    expect(titles()).toEqual(["Hooks in depth"]);
  });
});

describe("type filter", () => {
  test("counts and filters PDF, PPTX and notes", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf, pptx, notes, generatingPdf]} />);
    const tablist = screen.getByRole("tablist", { name: "Filter by document type" });
    const tab = (name: RegExp) => within(tablist).getByRole("tab", { name });

    expect(tab(/All/)).toHaveTextContent("4");
    expect(tab(/PDF/)).toHaveTextContent("2");
    expect(tab(/PPTX/)).toHaveTextContent("1");
    // Only real Notebook Notes documents; a PDF or PPTX is never listed again as notes.
    expect(tab(/Notebook Notes/)).toHaveTextContent("1");

    await user.click(tab(/PDF/));
    expect(tab(/PDF/)).toHaveAttribute("aria-selected", "true");
    expect(titles()).toEqual(["Hooks in depth", "Server components"]);

    await user.click(tab(/PPTX/));
    expect(titles()).toEqual(["Component deck"]);

    await user.click(tab(/Notebook Notes/));
    expect(titles()).toEqual(["Python cheat sheet"]);
  });

  test("filter counts follow the search", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf, pptx, notes]} />);
    await user.type(screen.getByRole("searchbox"), "react");
    expect(screen.getByRole("tab", { name: /All/ })).toHaveTextContent("2");
    expect(screen.getByRole("tab", { name: /PDF/ })).toHaveTextContent("1");
    expect(screen.getByRole("tab", { name: /Notebook Notes/ })).toHaveTextContent("0");
  });

  test("supports arrow-key navigation between tabs", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf, pptx, notes]} />);
    const all = screen.getByRole("tab", { name: /All/ });
    expect(all).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: /PDF/ })).toHaveAttribute("tabindex", "-1");

    all.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /PDF/ })).toHaveFocus();
    expect(screen.getByRole("tab", { name: /PDF/ })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /Notebook Notes/ })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /All/ })).toHaveFocus();
  });

  test("shows the per-format empty message when a format has no documents", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf]} />);
    await user.click(screen.getByRole("tab", { name: /PPTX/ }));
    expect(screen.getByText("No PowerPoint decks yet.")).toBeInTheDocument();
  });
});

describe("pagination", () => {
  const many = Array.from({ length: 14 }, (_, i) => makeDoc(String(i + 1).padStart(2, "0"), { title: `Lesson ${String(i + 1).padStart(2, "0")}` }));

  test("shows six per page with Previous / Next and page numbers", async () => {
    const user = userEvent.setup();
    render(<Harness documents={many} />);
    const pager = screen.getByRole("navigation", { name: "Library pages" });
    expect(titles()).toHaveLength(6);
    expect(titles()[0]).toBe("Lesson 01");
    expect(screen.getByRole("status")).toHaveTextContent("Showing 1–6 of 14");
    expect(within(pager).getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    expect(within(pager).getByRole("button", { name: /Previous/ })).toBeDisabled();

    await user.click(within(pager).getByRole("button", { name: /Next/ }));
    expect(titles()[0]).toBe("Lesson 07");
    expect(within(pager).getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(within(pager).getByRole("button", { name: "Page 1" })).not.toHaveAttribute("aria-current");

    await user.click(within(pager).getByRole("button", { name: "Page 3" }));
    expect(titles()).toEqual(["Lesson 13", "Lesson 14"]);
    expect(screen.getByRole("status")).toHaveTextContent("Showing 13–14 of 14");
    expect(within(pager).getByRole("button", { name: /Next/ })).toBeDisabled();

    await user.click(within(pager).getByRole("button", { name: /Previous/ }));
    expect(titles()[0]).toBe("Lesson 07");
  });

  test("returns to page 1 when the search changes", async () => {
    const user = userEvent.setup();
    render(<Harness documents={many} />);
    await user.click(screen.getByRole("button", { name: "Page 3" }));
    await user.type(screen.getByRole("searchbox"), "lesson");
    expect(titles()[0]).toBe("Lesson 01");
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
  });

  test("returns to page 1 when the filter changes", async () => {
    const user = userEvent.setup();
    render(<Harness documents={many} />);
    await user.click(screen.getByRole("button", { name: "Page 2" }));
    await user.click(screen.getByRole("tab", { name: /PDF/ }));
    expect(titles()[0]).toBe("Lesson 01");
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
  });

  test("hides the pager when everything fits on one page", () => {
    render(<Harness documents={many.slice(0, 6)} />);
    expect(screen.queryByRole("navigation", { name: "Library pages" })).not.toBeInTheDocument();
  });
});

describe("row actions", () => {
  test("routes Learn, notes, retry and delete to the right handlers", async () => {
    const user = userEvent.setup();
    const onLearn = jest.fn(), onOpenNotes = jest.fn(), onDelete = jest.fn(), onRetry = jest.fn();
    const failed = makeDoc("failed", { title: "Broken guide", status: "failed" });
    render(<Harness documents={[pdf, notes, failed]} onLearn={onLearn} onOpenNotes={onOpenNotes} onDelete={onDelete} onRetry={onRetry} />);

    const card = (title: string) => screen.getByRole("article", { name: title });
    await user.click(within(card("Hooks in depth")).getByRole("button", { name: /Learn in App/ }));
    expect(onLearn).toHaveBeenCalledWith(pdf);
    expect(within(card("Hooks in depth")).getByRole("link", { name: "Download" })).toHaveAttribute("href", "/api/documents/pdf/download");

    await user.click(within(card("Python cheat sheet")).getByRole("button", { name: /Learn in App/ }));
    expect(onOpenNotes).toHaveBeenCalledWith(notes);
    expect(within(card("Python cheat sheet")).getByRole("link", { name: "Download" })).toHaveAttribute("href", "/api/documents/notes/download?format=notes");

    expect(within(card("Broken guide")).getByText(/Generation failed/)).toBeInTheDocument();
    await user.click(within(card("Broken guide")).getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledWith(failed.request);

    await user.click(within(card("Hooks in depth")).getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(pdf);
  });

  test("the Notebook Notes tab lists only notebook documents, each deletable", async () => {
    const user = userEvent.setup();
    render(<Harness documents={[pdf, notes]} />);
    await user.click(screen.getByRole("tab", { name: /Notebook Notes/ }));
    expect(screen.queryByRole("article", { name: "Hooks in depth" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "Python cheat sheet" })).getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  test("disables delete while a document is still generating", () => {
    render(<Harness documents={[generatingPdf]} />);
    const card = screen.getByRole("article", { name: "Server components" });
    expect(within(card).getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(within(card).getAllByText("Generating").length).toBeGreaterThan(0);
  });

  test("shows the first-run empty state when the library has no documents", () => {
    render(<Harness documents={[]} />);
    expect(screen.getByRole("heading", { name: "Your learning library starts here" })).toBeInTheDocument();
  });
});

describe("library helpers", () => {
  test("removes repeated course formats before counting and paginating", () => {
    const older = { ...pdf, id: "old-pdf", created_at: "2025-01-01T00:00:00Z" };
    const failed = { ...pdf, id: "failed-pdf", status: "failed" as const, created_at: "2026-09-01T00:00:00Z" };
    render(<Harness documents={[notes, failed, pptx, older, pdf, notes]} />);
    expect(titles()).toEqual([pdf.title, pptx.title, notes.title]);
    expect(screen.getByRole("heading", { name: "Your learning library 3" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "PDF 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "PPTX 1" })).toBeInTheDocument();
    const card = screen.getByRole("article", { name: pdf.title });
    expect(within(card).getByRole("link", { name: "Download" })).toHaveAttribute("href", "/api/documents/pdf/download");
  });

  test("shows one notebook per guide while keeping all download formats", async () => {
    const user = userEvent.setup();
    const guidePdf = makeDoc("react-pdf", { title: "Complete React 19 path" });
    const guidePptx = makeDoc("react-pptx", { title: guidePdf.title }, { format: "pptx" });
    const guideNotes = makeDoc("react-notes", { title: guidePdf.title }, { format: "notes" });
    render(<Harness documents={[guidePptx, guideNotes, guidePdf]} />);
    expect(screen.getAllByRole("article").map(node => node.getAttribute("data-kind"))).toEqual(["pdf", "pptx", "notes"]);
    expect(libraryCounts([guidePdf, guidePptx, guideNotes])).toEqual({ all: 3, pdf: 1, pptx: 1, notes: 1 });
    await user.click(screen.getByRole("tab", { name: /^Notebook Notes/ }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute("href", "/api/documents/react-notes/download?format=notes");
  });

  test("libraryCounts counts each document once, under its own type", () => {
    expect(libraryCounts([pdf, pptx, notes, generatingPdf])).toEqual({ all: 4, pdf: 2, pptx: 1, notes: 1 });
  });

  test("sortLibrary lists every PDF, then every PPTX, then every Notebook Notes, newest guide first", () => {
    const guide = (id: string, title: string, created: string) => [
      makeDoc(`${id}-notes`, { title, created_at: created }, { format: "notes" }),
      makeDoc(`${id}-pptx`, { title, created_at: created }, { format: "pptx" }),
      makeDoc(`${id}-pdf`, { title, created_at: created }, { format: "pdf" }),
    ];
    const sorted = sortLibrary([...guide("next", "Next.js path", "2026-09-10T00:00:00Z"), ...guide("react", "React path", "2026-09-11T00:00:00Z")]);
    expect(sorted.map(doc => doc.id)).toEqual(["react-pdf", "next-pdf", "react-pptx", "next-pptx", "react-notes", "next-notes"]);
  });

  test("searchDocuments requires every term and ignores case and extra spaces", () => {
    const catalog = { technologies, topics };
    expect(searchDocuments([pdf, pptx, notes], "  HOOKS   react ", catalog)).toEqual([pdf]);
    expect(searchDocuments([pdf, pptx, notes], "पाइथन", catalog)).toEqual([notes]);
    expect(searchDocuments([pdf, pptx, notes], "", catalog)).toHaveLength(3);
  });

  test("paginate clamps out-of-range pages", () => {
    const items = Array.from({ length: 13 }, (_, i) => i);
    expect(paginate(items, 1)).toMatchObject({ items: [0, 1, 2, 3, 4, 5], page: 1, pages: 3, from: 1, to: 6, total: 13 });
    expect(paginate(items, 9)).toMatchObject({ items: [12], page: 3, from: 13, to: 13 });
    expect(paginate([], 4)).toMatchObject({ items: [], page: 1, pages: 1, from: 0, to: 0 });
  });

  test("pageItems elides long runs of pages", () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(2, 12)).toEqual([1, 2, 3, 4, 5, "gap", 12]);
    expect(pageItems(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
    expect(pageItems(11, 12)).toEqual([1, "gap", 8, 9, 10, 11, 12]);
  });
});
