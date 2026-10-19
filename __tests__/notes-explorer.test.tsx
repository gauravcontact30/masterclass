import { fireEvent, render, screen, within } from "@testing-library/react";
import { NotesExplorer, TopicCard } from "@/components/notes-explorer";
import { CodeLab } from "@/components/code-lab";
import { NOTES_SUMMARIES, NOTES_TECHNOLOGIES, STUDY_NOTES } from "@/lib/server/notes-study-catalog";
import { notesPage, type NotesSummary } from "@/lib/notes-study";
import { objectiveQuestionSchema } from "@/lib/domain";
import preview from "@/lib/catalog-preview.json";

const technologies = NOTES_TECHNOLOGIES.filter(item => ["react", "node"].includes(item.id));
// Keep the inline-card regression fixture stable as modal courses are added.
const notes = [...NOTES_SUMMARIES.filter(note => note.technology === "react" && !note.learnInApp).slice(0, 6), ...NOTES_SUMMARIES.filter(note => note.technology === "node" && !note.learnInApp).slice(0, 1)];

test("the code lab copies exact code without line numbers", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  try {
    render(<CodeLab title="Example" code={'const value = 1;\nconsole.log(value);'} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy Example code" }));
    await screen.findByText("Copied");
    expect(writeText).toHaveBeenCalledWith('const value = 1;\nconsole.log(value);');
  } finally {
    if (original) Object.defineProperty(navigator, "clipboard", original);
    else Reflect.deleteProperty(navigator, "clipboard");
  }
});

test("all catalog technologies retain study cards, source attribution and valid authored questions", () => {
  expect(NOTES_TECHNOLOGIES.map(item => item.id)).toEqual(["claude-fundamentals", "ai-fundamentals", ...preview.technologies.map(item => item.id)]);
  for (const technology of NOTES_TECHNOLOGIES) {
    expect(STUDY_NOTES.some(note => note.technology === technology.id)).toBe(true);
    expect(technology.sources.length).toBeGreaterThan(0);
    expect(technology.reading.length).toBeGreaterThan(0);
  }
  for (const note of STUDY_NOTES) {
    for (const question of note.questions) expect(objectiveQuestionSchema.safeParse(question).success).toBe(true);
  }
});

test("each technology paginates independently and section search resets the page", () => {
  render(<NotesExplorer notes={notes} technologies={technologies} />);
  const react = within(screen.getByRole("region", { name: "React 19+", exact: true }));
  const node = within(screen.getByRole("region", { name: "Node.js", exact: true }));
  expect(screen.queryByText(/, made clear/)).not.toBeInTheDocument();
  expect(react.getAllByRole("article")).toHaveLength(4);
  fireEvent.click(react.getByRole("button", { name: "Next React 19+ page" }));
  expect(react.getAllByRole("article")).toHaveLength(2);
  expect(node.getAllByRole("article")).toHaveLength(1);
  fireEvent.change(react.getByRole("searchbox"), { target: { value: "Derive totals" } });
  expect(react.getAllByRole("article")).toHaveLength(1);
  expect(react.getByRole("button", { name: "Previous React 19+ page" })).toBeDisabled();
  fireEvent.click(react.getByRole("button", { name: "Clear React 19+ search and filters" }));
  expect(react.getAllByRole("article")).toHaveLength(4);
  expect(screen.queryByText("All technology notes")).not.toBeInTheDocument();
});

test("global technology and content filters combine and Clear all restores sections", async () => {
  render(<NotesExplorer notes={notes} technologies={technologies} />);
  fireEvent.click(screen.getByRole("combobox", { name: "Technology", exact: true }));
  fireEvent.change(await screen.findByLabelText("Search Technology"), { target: { value: "Node" } });
  fireEvent.click(screen.getByRole("option", { name: /Node.js/ }));
  expect(screen.queryByRole("region", { name: "React 19+", exact: true })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox", { name: "Search all notes" }), { target: { value: "unfindable-xyz" } });
  expect(screen.getByRole("heading", { name: "No topics found" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Clear all", exact: true }));
  expect(screen.getAllByRole("article")).toHaveLength(5);
  fireEvent.click(screen.getByRole("combobox", { name: "Content type" }));
  fireEvent.click(await screen.findByRole("option", { name: /AWS.*services/ }));
  expect(screen.getByRole("heading", { name: "No topics found" })).toBeVisible();
});

test("toolbar supports keyboard search and independent removable filter chips", async () => {
  render(<NotesExplorer notes={notes} technologies={technologies} initialTechnology="react" />);
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  expect(screen.getByRole("searchbox", { name: "Search all notes" })).toHaveFocus();
  fireEvent.change(screen.getByRole("searchbox", { name: "Search all notes" }), { target: { value: "state" } });
  fireEvent.click(screen.getByRole("button", { name: "Remove Technology" }));
  expect(screen.getByRole("searchbox", { name: "Search all notes" })).toHaveValue("state");
  fireEvent.click(screen.getByRole("button", { name: "Remove search" }));
  expect(screen.getByRole("searchbox", { name: "Search all notes" })).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: "About interview priorities" }));
  expect(await screen.findByText(/not measured interview frequency or company-specific statistics/)).toBeVisible();
});

test("the reading guide contains in-app chapters instead of website links", () => {
  render(<NotesExplorer notes={notes} technologies={technologies} />);
  fireEvent.click(screen.getByText("Reading guide for Node.js", { exact: true }));
  expect(screen.getByRole("heading", { name: "Node.js: the reading guide" })).toBeVisible();
  expect(screen.getByText("Keep the event loop responsive", { selector: "h5" })).toBeVisible();
  expect(document.querySelector('a[href^="http"]')).toBeNull();
});

test("page numbers stay valid when results shrink", () => {
  expect(notesPage([1, 2, 3], 999).page).toBe(1);
  expect(notesPage([], -1)).toMatchObject({ page: 1, pages: 1, start: 0, end: 0, items: [] });
});

test("study details load on demand, support quizzes and show vocabulary and honest star labels", async () => {
  const summary = notes[0];
  const detail = STUDY_NOTES.find(note => note.id === summary.id)!;
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ note: detail }) });
  try {
    render(<TopicCard note={summary} />);
    expect(global.fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Study this topic" }));
    await screen.findByText("Syntax, meaning & examples");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Objective questions", { exact: false, selector: "summary" }));
    const question = detail.questions[0];
    fireEvent.click(screen.getAllByRole("radio")[question.correct]);
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByText("Correct. Now explore why.")).toBeVisible();
    fireEvent.click(screen.getByText("Vocabulary, synonyms & antonyms", { exact: false, selector: "summary" }));
    expect(screen.getAllByText("Meaning").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Official reference" })).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Interview priority 5 out of 5").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Close study details" }));
    fireEvent.click(screen.getByRole("button", { name: "Study this topic" }));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  } finally { global.fetch = originalFetch; }
});

test("failed detail requests offer a working retry", async () => {
  const summary: NotesSummary = notes[0];
  const detail = STUDY_NOTES.find(note => note.id === summary.id)!;
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ ok: true, json: async () => ({ note: detail }) });
  try {
    render(<TopicCard note={summary} />);
    fireEvent.click(screen.getByRole("button", { name: "Study this topic" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Syntax, meaning & examples");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  } finally { global.fetch = originalFetch; }
});

test("the Learn in App dialog opens on a compact header: short title, one meta row and no footer", async () => {
  // A card whose reader title is deliberately shorter than its card title.
  const full = STUDY_NOTES.find(note => note.readerTitle && note.readerTitle !== note.title)!;
  const summary = NOTES_SUMMARIES.find(note => note.id === full.id)!;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ note: full }) }) as jest.Mock;
  render(<TopicCard note={summary} />);

  // The card keeps its own name; only the reader uses the short one.
  expect(screen.getByRole("heading", { name: summary.title })).toBeVisible();
  expect(summary.readerTitle).toBe(full.readerTitle);

  fireEvent.click(screen.getByRole("button", { name: "Learn in App" }));
  const dialog = within(await screen.findByRole("dialog"));
  expect(dialog.getByRole("heading", { name: full.readerTitle })).toBeVisible();

  // One meta row: technology label and category, without the old "LEARN IN APP ·" prefix.
  expect(dialog.getByText(summary.category)).toBeVisible();
  expect(dialog.queryByText(/LEARN IN APP/i)).not.toBeInTheDocument();

  // The compact marker toolbar itself is covered in learning-marks.test.tsx,
  // which supplies the provider LearningTools needs to render at all.

  // No footer: the dialog's own Close button is the way back.
  expect(dialog.queryByText(/Read · Explore · Practise/)).not.toBeInTheDocument();
  expect(dialog.queryByText(/Back to notes/)).not.toBeInTheDocument();
  fireEvent.click(dialog.getByRole("button", { name: "Close" }));
  await screen.findByRole("button", { name: "Learn in App" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
