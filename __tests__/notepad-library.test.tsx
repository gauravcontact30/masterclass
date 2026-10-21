import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SuperAdminNotepad } from "@/components/super-admin-notepad";
import { readNotepadCollection, workflowHtml, type NotepadFile } from "@/lib/notepad-library";
import { notepadDocument } from "@/lib/notepad";

const key = "masterclass:admin-notepad:alice";
const file = (id: string, extra: Partial<NotepadFile> = {}): NotepadFile => ({ id, title: `Document ${id}`, html: `<p>Notes ${id}</p>`, background: "#ffffff", kind: "draft", starred: false, createdAt: "2026-10-19T00:00:00Z", updatedAt: "2026-10-19T00:00:00Z", ...extra });
function seed(documents: NotepadFile[]) { localStorage.setItem(key, JSON.stringify({ version: 2, activeId: documents[0].id, documents })); }
async function open() { const view = render(<SuperAdminNotepad userId="alice"/>); await act(async () => {}); return view; }
beforeEach(() => localStorage.clear());

test("migrates the old draft and keeps it when a new named document is created", async () => {
  localStorage.setItem(key, JSON.stringify({ title: "Old draft", html: "<p>Keep this</p>", background: "#fffbed", savedAt: "2026-10-18T12:00:00Z" }));
  await open();
  expect(screen.getByRole("tab", { name: "Old draft" })).toHaveAttribute("aria-selected", "true");
  fireEvent.click(screen.getByRole("button", { name: "New document" }));
  fireEvent.change(screen.getByLabelText("Document name"), { target: { value: "New notes" } });
  const editor = screen.getByRole("textbox", { name: "Document content" });
  editor.innerHTML = "<p>New content</p>"; fireEvent.input(editor);
  fireEvent.click(screen.getByRole("tab", { name: "Old draft" }));
  expect(editor).toHaveTextContent("Keep this");
  fireEvent.click(screen.getByRole("tab", { name: "New notes" }));
  expect(editor).toHaveTextContent("New content");
  expect(JSON.parse(localStorage.getItem(key)!).documents).toHaveLength(2);
});

test("paginates documents and supports keyboard search suggestions and media filters", async () => {
  seed(Array.from({ length: 8 }, (_, index) => file(String(index + 1), index === 7 ? { html: '<p>Unique architecture</p><img src="data:image/png;base64,YQ==">' } : {})));
  await open();
  expect(screen.getAllByRole("tab")).toHaveLength(3);
  expect(screen.getByText("Showing 1–3 of 8")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getAllByRole("tab")).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: "3" }));
  expect(screen.getAllByRole("tab")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "3" })).toHaveAttribute("aria-current", "page");
  const search = screen.getByRole("combobox", { name: "Search saved documents" });
  fireEvent.change(search, { target: { value: "Unique architecture" } });
  expect(screen.getByRole("option", { name: /Document 8/ })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /Document 8/ }).querySelector("mark")).toHaveTextContent(/unique/i);
  fireEvent.keyDown(search, { key: "ArrowDown" }); fireEvent.keyDown(search, { key: "Enter" });
  expect(screen.getByRole("textbox", { name: "Document content" })).toHaveTextContent("Unique architecture");
  fireEvent.click(screen.getByRole("button", { name: "Clear document search" }));
  fireEvent.click(screen.getByRole("button", { name: "Filter saved documents" }));
  fireEvent.change(screen.getByLabelText("Contains"), { target: { value: "images" } });
  expect(screen.getAllByRole("tab")).toHaveLength(1);
  expect(screen.getByRole("tab", { name: "Document 8" })).toBeVisible();
});

test("clear preserves a recovery copy and cancelled clear changes nothing", async () => {
  seed([file("1")]); await open();
  fireEvent.click(screen.getByRole("button", { name: "Clear document" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel clear document" }));
  expect(screen.getByRole("textbox", { name: "Document content" })).toHaveTextContent("Notes 1");
  fireEvent.click(screen.getByRole("button", { name: "Clear document" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm clear document" }));
  expect(screen.getByRole("textbox", { name: "Document content" })).toBeEmptyDOMElement();
  fireEvent.click(screen.getByRole("tab", { name: "Document 1 (before clear)" }));
  expect(screen.getByRole("textbox", { name: "Document content" })).toHaveTextContent("Notes 1");
});

test("save as keeps a separate named document and downloads it", async () => {
  seed([file("1")]); await open();
  const create = jest.fn(() => "blob:test"); URL.createObjectURL = create; URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  fireEvent.click(screen.getByRole("button", { name: "Save as a new document" }));
  fireEvent.change(screen.getByLabelText("Export document name"), { target: { value: "Published notes" } });
  fireEvent.click(screen.getByRole("button", { name: "Download file" }));
  const collection = JSON.parse(localStorage.getItem(key)!);
  expect(collection.documents).toHaveLength(2);
  expect(collection.documents.find((item: NotepadFile) => item.title === "Published notes")).toMatchObject({ kind: "saved", html: "<p>Notes 1</p>" });
  expect(create).toHaveBeenCalled(); expect(click).toHaveBeenCalled(); click.mockRestore();
});

test("imports a previously exported Notepad document as another editable tab", async () => {
  seed([file("1")]); await open();
  const imported = new File(["{}"], "previous.json", { type: "application/json" });
  Object.defineProperty(imported, "text", { value: async () => JSON.stringify({ title: "Imported diagram", html: workflowHtml("Plan\nReview"), background: "#eff8f1" }) });
  fireEvent.change(screen.getByLabelText("Import document file"), { target: { files: [imported] } });
  await waitFor(() => expect(screen.getByRole("tab", { name: "Imported diagram" })).toBeInTheDocument());
  expect(screen.getByRole("textbox", { name: "Document content" })).toHaveTextContent("Review");
  expect(JSON.parse(localStorage.getItem(key)!).documents).toHaveLength(2);
});

test("exports preserve embedded images and editable diagrams and reject injected scripts", () => {
  const html = workflowHtml('Plan\n<script>alert(1)</script>') + '<img src="data:image/png;base64,YQ==" alt="Diagram screenshot">';
  const exported = notepadDocument("Workflow", html, "#eff8f1");
  expect(exported).toContain('data-notepad-diagram="workflow"');
  expect(exported).toContain("data:image/png;base64,YQ==");
  expect(exported).toContain("&lt;script&gt;");
  expect(exported).not.toContain("<script>");
  const restored = readNotepadCollection(JSON.stringify({ version: 2, activeId: "1", documents: [file("1", { html })] }));
  expect(restored.documents[0].html).toContain('data-notepad-diagram="workflow"');
});

test("failed saves and another-tab changes do not discard current edits", async () => {
  seed([file("1"), file("2")]); await open();
  const editor = screen.getByRole("textbox", { name: "Document content" });
  editor.innerHTML = "Unsaved edits"; fireEvent.input(editor);
  const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota"); });
  fireEvent.click(screen.getByRole("tab", { name: "Document 2" }));
  expect(editor).toHaveTextContent("Unsaved edits");
  expect(screen.getByRole("tab", { name: "Document 1" })).toHaveAttribute("aria-selected", "true");
  write.mockRestore();
  localStorage.setItem(key, "changed by another tab");
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  expect(screen.getByRole("alert")).toHaveTextContent("another tab");
  expect(localStorage.getItem(key)).toBe("changed by another tab");
});
