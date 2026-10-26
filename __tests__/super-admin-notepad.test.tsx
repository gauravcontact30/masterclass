import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SuperAdminNotepad } from "@/components/super-admin-notepad";
import { notepadDocument, sanitizeNotepadHtml } from "@/lib/notepad";

beforeEach(() => localStorage.clear());
function savedFile() {
  const collection = JSON.parse(localStorage.getItem("masterclass:admin-notepad:alice")!);
  return collection.documents.find((file: { id: string }) => file.id === collection.activeId);
}

test("imports formatting, lists, tables and inline images without executable HTML", () => {
  const html = sanitizeNotepadHtml('<h1 onclick="alert(1)">Title</h1><p style="color:red;background-image:url(https://tracker.test)"><b>Bold</b></p><ul><li>One</li></ul><table><tr><td>Cell</td></tr></table><script>alert(1)</script><iframe src="https://tracker.test"></iframe><img src="https://tracker.test" onerror="alert(1)"><img src="data:image/png;base64,YQ=="><a href="javascript:alert(1)">Bad link</a>');
  expect(html).toContain("<h1>Title</h1>");
  expect(html).toContain("<b>Bold</b>");
  expect(html).toContain("<li>One</li>");
  expect(html).toContain("<td>Cell</td>");
  expect(html).toContain("data:image/png;base64,YQ==");
  expect(html).not.toMatch(/script|iframe|onclick|onerror|javascript:|tracker/);
});

test("exports an escaped title and sanitized document", () => {
  const html = notepadDocument('</title><script>bad</script>', '<p><i>Hello</i></p>');
  expect(html).toContain("&lt;/title&gt;");
  expect(html).toContain("<i>Hello</i>");
  expect(html).not.toContain("<script>");
});

test("autosaves the current name and rich text after two minutes and restores per user", async () => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  try {
    const view = render(<SuperAdminNotepad userId="alice" />);
    await act(async () => {});
    fireEvent.change(screen.getByLabelText("Document name"), { target: { value: "Meeting notes" } });
    const editor = screen.getByRole("textbox", { name: "Document content" });
    editor.innerHTML = "<h2>Agenda</h2><p><b>Important</b></p>";
    fireEvent.input(editor);
    act(() => jest.advanceTimersByTime(119_999));
    expect(localStorage.getItem("masterclass:admin-notepad:alice")).toBeNull();
    act(() => jest.advanceTimersByTime(1));
    expect(savedFile()).toMatchObject({ title: "Meeting notes", html: editor.innerHTML });
    view.unmount();
    const recovered = render(<SuperAdminNotepad userId="alice" />);
    await act(async () => {});
    expect(screen.getByLabelText("Document name")).toHaveValue("Meeting notes");
    expect(screen.getByRole("textbox", { name: "Document content" }).innerHTML).toContain("<b>Important</b>");
    recovered.unmount();
    render(<SuperAdminNotepad userId="bob" />);
    await act(async () => {});
    expect(screen.getByRole("textbox", { name: "Document content" })).toBeEmptyDOMElement();
  } finally { jest.useRealTimers(); }
});

test("reports failed storage writes and keeps content editable", async () => {
  render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});
  const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Draft could not be saved");
  expect(screen.getByRole("textbox", { name: "Document content" })).toHaveAttribute("contenteditable", "true");
  spy.mockRestore();
});

test("saving on unmount preserves work before the next autosave", async () => {
  const view = render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});
  const editor = screen.getByRole("textbox", { name: "Document content" });
  editor.innerHTML = "<p>Recent work</p>"; fireEvent.input(editor);
  view.unmount();
  expect(savedFile().html).toBe("<p>Recent work</p>");
});

test("icon actions are labelled and the light paper color persists and exports", async () => {
  const view = render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});
  // Numbered page buttons in the My documents pager are text by design; every other action is an icon.
  for (const button of screen.getAllByRole("button").filter(button => !button.closest("nav[aria-label='Pages']"))) expect(button.querySelector("svg")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Document background: White" }));
  expect(within(screen.getByRole("listbox", { name: "Document background color" })).getAllByRole("option")).toHaveLength(25);
  fireEvent.click(screen.getByRole("option", { name: "Mint" }));
  expect(screen.queryByRole("listbox")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  expect(savedFile().background).toBe("#eff8f1");
  view.unmount();
  render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});
  expect(screen.getByRole("textbox", { name: "Document content" })).toHaveStyle({ backgroundColor: "#eff8f1" });
  expect(screen.getByRole("button", { name: "Document background: Mint" })).toBeInTheDocument();
  expect(notepadDocument("Notes", "<p>Test</p>", "#eff8f1")).toContain("background:#eff8f1");
});

test("inserted tables carry a header row with one heading per column", async () => {
  const exec = jest.fn(() => true);
  Object.defineProperty(document, "execCommand", { value: exec, configurable: true });
  render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Insert table" }));
  fireEvent.change(screen.getByLabelText("Columns"), { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: "Add table" }));
  const html = (exec.mock.calls as unknown as [string, boolean, string][]).find(([name]) => name === "insertHTML")![2];
  const table = new DOMParser().parseFromString(html, "text/html").querySelector("table")!;
  expect([...table.querySelectorAll("thead th")].map(th => th.textContent)).toEqual(["Column 1", "Column 2", "Column 3", "Column 4"]);
  expect(table.querySelectorAll("tbody tr")).toHaveLength(3);
});

test("the tools panel collapses and expands while words, zoom and save status stay visible", async () => {
  render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});
  const toggle = screen.getByRole("button", { name: "Tools" });
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("button", { name: "Insert table" })).toBeNull();
  expect(screen.getByRole("button", { name: "Zoom in" })).toBeVisible();
  expect(screen.getByText(/\d+ words/)).toBeVisible();
  expect(localStorage.getItem("masterclass:notepad-tools")).toBe("closed");
  fireEvent.click(toggle);
  expect(screen.getByRole("button", { name: "Insert table" })).toBeVisible();
});

test("supports font styling, family, font size increment/decrement, and line spacing", async () => {
  const exec = jest.fn(() => true);
  Object.defineProperty(document, "execCommand", { value: exec, configurable: true });
  render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});

  // Font family
  const fontSelect = screen.getByLabelText("Font family");
  fireEvent.change(fontSelect, { target: { value: "Inter" } });
  expect(exec).toHaveBeenCalledWith("fontName", false, "Inter");

  // Font style
  const styleSelect = screen.getByLabelText("Font style");
  fireEvent.change(styleSelect, { target: { value: "italic" } });
  expect(exec).toHaveBeenCalledWith("italic", false, undefined);

  // Increase / decrease text size
  fireEvent.click(screen.getByRole("button", { name: "Increase text size" }));
  expect(screen.getByText(/Font size: 18px/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Decrease text size" }));
  expect(screen.getByText(/Font size: 16px/)).toBeInTheDocument();

  // Font size dropdown
  const sizeSelect = screen.getByLabelText("Font size");
  fireEvent.change(sizeSelect, { target: { value: "24" } });
  expect(sizeSelect).toHaveValue("24");

  // Line spacing
  const spacingSelect = screen.getByLabelText("Line spacing");
  fireEvent.change(spacingSelect, { target: { value: "1.8" } });
  expect(spacingSelect).toHaveValue("1.8");
});

test("supports rich elements: checklists, code blocks, callouts, and symbols", async () => {
  const exec = jest.fn(() => true);
  Object.defineProperty(document, "execCommand", { value: exec, configurable: true });
  render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});

  // Checklist
  fireEvent.click(screen.getByRole("button", { name: "Task checklist" }));
  expect(exec).toHaveBeenCalledWith("insertHTML", false, expect.stringContaining('data-notepad-checklist="true"'));

  // Code block
  fireEvent.click(screen.getByRole("button", { name: "Insert code block" }));
  expect(exec).toHaveBeenCalledWith("insertHTML", false, expect.stringContaining("<pre"));

  // Inline code
  fireEvent.click(screen.getByRole("button", { name: "Inline code" }));
  expect(exec).toHaveBeenCalledWith("insertHTML", false, expect.stringContaining("<code"));

  // Date and time
  fireEvent.click(screen.getByRole("button", { name: "Insert current date and time" }));
  expect(exec).toHaveBeenCalledWith("insertHTML", false, expect.stringMatching(/<span>.*<\/span>&nbsp;/));

  // Callout box
  fireEvent.click(screen.getByRole("button", { name: "Insert callout box" }));
  fireEvent.change(screen.getByLabelText("Callout title"), { target: { value: "Warning Note" } });
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Check this carefully" } });
  fireEvent.click(screen.getByRole("button", { name: "Add callout box" }));
  expect(exec).toHaveBeenCalledWith("insertHTML", false, expect.stringContaining('data-notepad-callout="info"'));
  expect(exec).toHaveBeenCalledWith("insertHTML", false, expect.stringContaining("Warning Note"));

  // Symbols palette
  fireEvent.click(screen.getByRole("button", { name: "Insert special symbol" }));
  expect(screen.getByRole("region", { name: "Insert special symbol" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Insert symbol Checkmark" }));
  expect(exec).toHaveBeenCalledWith("insertHTML", false, "<span>✓</span>");
});

test("provides functional find and replace across document text", async () => {
  render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});

  const editor = screen.getByRole("textbox", { name: "Document content" });
  editor.innerHTML = "<p>The quick brown fox jumps over the lazy dog.</p>";
  fireEvent.input(editor);

  fireEvent.click(screen.getByRole("button", { name: "Find and replace" }));
  expect(screen.getByRole("search", { name: "Find and replace" })).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText("Find in document…"), { target: { value: "fox" } });
  fireEvent.change(screen.getByPlaceholderText("Replace with…"), { target: { value: "cat" } });

  fireEvent.click(screen.getByRole("button", { name: "Replace all" }));
  expect(editor.innerHTML).toContain("quick brown cat jumps");
  expect(screen.getByText(/Replaced 1 occurrence/)).toBeInTheDocument();
});

test("computes and displays detailed document statistics", async () => {
  render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});

  const editor = screen.getByRole("textbox", { name: "Document content" });
  editor.innerHTML = "<p>First paragraph with words.</p><p>Second paragraph with more words.</p>";
  fireEvent.input(editor);

  const wordBadge = screen.getByText(/9 words/);
  expect(wordBadge).toBeInTheDocument();
  fireEvent.click(wordBadge);
  const statsDialog = screen.getByRole("dialog", { name: "Document statistics" });
  expect(statsDialog).toHaveTextContent("Words:9");
  expect(statsDialog).toHaveTextContent("Paragraphs:2");
});
