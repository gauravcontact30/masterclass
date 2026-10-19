import { act, fireEvent, render, screen } from "@testing-library/react";
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
  for (const button of screen.getAllByRole("button")) expect(button.querySelector("svg")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Document background: Mint" }));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  expect(savedFile().background).toBe("#eff8f1");
  view.unmount();
  render(<SuperAdminNotepad userId="alice" />);
  await act(async () => {});
  expect(screen.getByRole("textbox", { name: "Document content" })).toHaveStyle({ backgroundColor: "#eff8f1" });
  expect(notepadDocument("Notes", "<p>Test</p>", "#eff8f1")).toContain("background:#eff8f1");
});
