import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { LearningMarksProvider, LearningRegion, LearningTools } from "@/components/learning-marks";
import { anchorText, learningContentKey, locateAnchor, type LearningMark } from "@/lib/learning-marks";
import { renderPersonalText, restorePersonalText, selectionAnchor, textModel } from "@/lib/learning-text-dom";

let mockAuthChange: (event: string, session: { user: { id: string } } | null) => void;
const mockAuth = { onAuthStateChange: jest.fn(callback => { mockAuthChange = callback; return { data: { subscription: { unsubscribe: jest.fn() } } }; }) };
jest.mock("@/lib/supabase-browser", () => ({ supabaseBrowser: () => ({ auth: mockAuth }) }));
const originalFetch = global.fetch;
const key = learningContentKey("node", "Event loop");
let saved: LearningMark[];
let failSave = false;
// A signed-in browser: account calls are skipped without a Supabase session cookie.
beforeEach(() => {
  document.cookie = "sb-test-auth-token=signed-in; path=/";
  saved = []; failSave = false;
  Object.defineProperty(globalThis, "Highlight", { configurable: true, value: class extends Set<Range> { priority = 0; constructor(...ranges: Range[]) { super(ranges); } } });
  Object.defineProperty(CSS, "highlights", { configurable: true, value: new Map() });
  global.fetch = jest.fn(async (_url, init) => {
    if (init?.method && failSave) return { ok: false, status: 500 } as Response;
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body)); delete body.expectedUserId;
      const mark = { ...body, updatedAt: new Date().toISOString() };
      saved = [...saved.filter(item => item.id !== mark.id), mark];
      return { ok: true, json: async () => ({ userId: "alice", mark }) } as Response;
    }
    if (init?.method === "DELETE") { const { id } = JSON.parse(String(init.body)); saved = saved.filter(item => item.id !== id); return { ok: true, json: async () => ({ userId: "alice", id }) } as Response; }
    if (init?.method === "POST") {
      const marks = JSON.parse(String(init.body)).marks.map((mark: LearningMark) => ({ ...mark, updatedAt: new Date().toISOString() }));
      saved = [...saved.filter(item => !marks.some((mark: LearningMark) => mark.id === item.id)), ...marks];
      return { ok: true, json: async () => ({ userId: "alice", marks, failedIds: [] }) } as Response;
    }
    return { ok: true, json: async () => ({ userId: "alice", marks: [...saved], nextCursor: null }) } as Response;
  });
});
afterEach(() => { global.fetch = originalFetch; window.getSelection()?.removeAllRanges(); });
function Fixture() { return <LearningMarksProvider><LearningRegion contentKey={key} toolbar><p data-testid="prose">The event loop runs callbacks.</p></LearningRegion></LearningMarksProvider>; }
function CompactFixture() { return <LearningMarksProvider><LearningTools compact /><LearningRegion contentKey={key}><p data-testid="prose">The event loop runs callbacks.</p></LearningRegion></LearningMarksProvider>; }
function select(from = 4, to = 14) {
  const node = screen.getByTestId("prose").firstChild!;
  const range = document.createRange(); range.setStart(node, from); range.setEnd(node, to);
  const selection = window.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
  fireEvent(document, new Event("selectionchange"));
}
test("palette starts closed, opens on Highlight, preserves drag selection and saves across reopening", async () => {
  const view = render(<Fixture />);
  expect(screen.queryByRole("group", { name: "Marker colors" })).not.toBeInTheDocument();
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  fireEvent.pointerDown(screen.getByTestId("prose"));
  act(() => select());
  expect(screen.queryByText(/characters selected/)).not.toBeInTheDocument();
  fireEvent.pointerUp(screen.getByTestId("prose"));
  expect(screen.getByText(/10 characters selected/)).toBeInTheDocument();
  expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument(); // No panel shifts text during a drag.
  fireEvent.click(screen.getByRole("button", { name: "Highlight selected text" }));
  expect(within(screen.getByRole("group", { name: "Marker colors" })).getAllByRole("button")).toHaveLength(12);
  fireEvent.click(screen.getByRole("button", { name: "Highlight Teal" }));
  await screen.findByText("Highlight saved to your account.");
  expect(screen.queryByRole("group", { name: "Marker colors" })).not.toBeInTheDocument();
  expect(saved[0]).toMatchObject({ quote: "event loop", color: "teal", contentKey: key });
  expect([...CSS.highlights.values()].flatMap(mark => [...mark]).map(range => range.toString()).join("")).toBe("event loop");
  view.unmount(); expect(CSS.highlights.size).toBe(0);
  render(<Fixture />);
  await waitFor(() => expect(CSS.highlights.size).toBe(1));
  act(() => select());
  fireEvent.click(screen.getByRole("button", { name: "Unhighlight selected text" }));
  await waitFor(() => expect(saved).toHaveLength(0));
  expect(screen.getByTestId("prose")).toHaveTextContent("The event loop runs callbacks.");
});
test("deletes only selected text and survives rerender and reopening without an edits panel", async () => {
  const view = render(<Fixture />);
  await act(async () => {});
  act(() => select());
  fireEvent.click(screen.getByRole("button", { name: "Delete selected text" }));
  await waitFor(() => expect(screen.getByTestId("prose").textContent).toBe("The  runs callbacks."));
  view.rerender(<Fixture />);
  expect(screen.getByTestId("prose").textContent).toBe("The  runs callbacks.");
  view.unmount(); render(<Fixture />);
  await waitFor(() => expect(screen.getByTestId("prose").textContent).toBe("The  runs callbacks."));
  expect(screen.queryByRole("button", { name: /Saved edits/i })).not.toBeInTheDocument();
});
test("failed saves preserve the text and selection; colors remain visible when storage fails", async () => {
  render(<Fixture />); await act(async () => {});
  failSave = true; act(() => select());
  fireEvent.click(screen.getByRole("button", { name: "Delete selected text" }));
  await screen.findByText(/Couldn’t save/);
  expect(screen.getByTestId("prose").textContent).toBe("The event loop runs callbacks.");
  expect(saved).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Highlight selected text" }));
  expect(screen.getByRole("button", { name: "Highlight Cyan" })).toBeVisible();
});

test("unhighlight removes only the selected portion of overlapping highlights and persists both remainders", async () => {
  const prose = "The event loop runs callbacks.";
  saved = [
    { ...anchorText(prose, 4, 19), id: "wide", contentKey: key, kind: "highlight", color: "purple", updatedAt: "2026-09-13" },
    { ...anchorText(prose, 10, 14), id: "overlap", contentKey: key, kind: "highlight", color: "teal", updatedAt: "2026-09-13" },
  ];
  const view = render(<Fixture />); await act(async () => {});
  act(() => select(10, 14));
  fireEvent.click(screen.getByRole("button", { name: "Unhighlight selected text" }));
  await waitFor(() => expect(saved.map(mark => mark.quote).sort()).toEqual([" runs", "event "]));
  expect(saved.every(mark => mark.color === "purple")).toBe(true);
  view.unmount(); render(<Fixture />);
  await waitFor(() => expect([...CSS.highlights.values()].flatMap(mark => [...mark]).map(range => range.toString()).sort()).toEqual([" runs", "event "]));
  expect(screen.queryByText(/Saved edits/i)).not.toBeInTheDocument();
});

test("failed unhighlight preserves the highlight and allows retry", async () => {
  saved = [{ ...anchorText("The event loop runs callbacks.", 4, 14), id: "mark", contentKey: key, kind: "highlight", color: "blue", updatedAt: "2026-09-13" }];
  render(<Fixture />); await act(async () => {});
  failSave = true; act(() => select());
  fireEvent.click(screen.getByRole("button", { name: "Unhighlight selected text" }));
  await screen.findByText(/Couldn’t save/);
  expect(saved).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Unhighlight selected text" })).toBeEnabled();
  failSave = false;
  fireEvent.click(screen.getByRole("button", { name: "Unhighlight selected text" }));
  await waitFor(() => expect(saved).toHaveLength(0));
});
test("colors remain discoverable for signed-out users", async () => {
  global.fetch = jest.fn(async () => ({ ok: false, status: 401 } as Response));
  render(<Fixture />); await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Highlight selected text" }));
  expect(screen.getByText(/Sign in to save/)).toBeVisible();
  expect(within(screen.getByRole("group", { name: "Marker colors" })).getAllByRole("button")).toHaveLength(12);
});
test("marker paints only with the left button held, recolors and erases without a saved edits panel", async () => {
  render(<Fixture />); await act(async () => {});
  const node = screen.getByTestId("prose").firstChild!;
  Object.defineProperty(document, "caretPositionFromPoint", { configurable: true, value: () => ({ offsetNode: node, offset: 6 }) });
  const originalRects = Range.prototype.getClientRects;
  Range.prototype.getClientRects = () => [{ left: 0, right: 100, top: 0, bottom: 20 }] as unknown as DOMRectList;
  try {
    fireEvent.click(screen.getByRole("button", { name: "Highlight selected text" }));
    fireEvent.click(screen.getByRole("button", { name: "Highlight Purple" }));
    expect(document.documentElement.dataset.learningMarker).toBe("purple");
    const move = (buttons: number) => fireEvent(screen.getByTestId("prose"), new MouseEvent("pointermove", { bubbles: true, buttons, clientX: 20, clientY: 10 }));
    move(0); move(2);
    expect(CSS.highlights.size).toBe(0);
    move(1);
    await waitFor(() => expect(saved[0]).toMatchObject({ quote: "event", color: "purple" }));
    expect([...CSS.highlights.values()].flatMap(mark => [...mark]).map(range => range.toString()).join("")).toBe("event");
    fireEvent.pointerUp(screen.getByTestId("prose"));
    expect(document.documentElement.dataset.learningMarker).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "Highlight selected text" }));
    fireEvent.click(screen.getByRole("button", { name: "Highlight Blue" }));
    move(1);
    await waitFor(() => expect(saved[0]).toMatchObject({ quote: "event", color: "blue" }));
    expect(saved).toHaveLength(1);
    fireEvent.pointerUp(screen.getByTestId("prose"));
    fireEvent.click(screen.getByRole("button", { name: "Unhighlight selected text" }));
    expect(document.documentElement.dataset.learningMarker).toBe("erase");
    move(0); expect(saved).toHaveLength(1);
    move(1);
    await waitFor(() => expect(saved).toHaveLength(0));
    expect(CSS.highlights.size).toBe(0);
    fireEvent.pointerUp(screen.getByTestId("prose"));
    expect(document.documentElement.dataset.learningMarker).toBeUndefined();
    move(1);
    expect(saved).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Unhighlight selected text" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.documentElement.dataset.learningMarker).toBeUndefined();
  } finally { Range.prototype.getClientRects = originalRects; }
});
test("sign-out restores deleted text immediately and account changes cannot retain another account's edits", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test";
  try {
    render(<Fixture />); await act(async () => {});
    act(() => select()); fireEvent.click(screen.getByRole("button", { name: "Delete selected text" }));
    await waitFor(() => expect(screen.getByTestId("prose").textContent).toBe("The  runs callbacks."));
    act(() => mockAuthChange("SIGNED_OUT", null));
    expect(screen.getByTestId("prose").textContent).toBe("The event loop runs callbacks.");
    expect(CSS.highlights.size).toBe(0);
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ userId: "bob", marks: [], nextCursor: null }) } as Response));
    await act(async () => mockAuthChange("SIGNED_IN", { user: { id: "bob" } }));
    expect(screen.getByRole("button", { name: "Unhighlight selected text" })).toBeInTheDocument();
    expect(screen.getByTestId("prose").textContent).toBe("The event loop runs callbacks.");
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});

test("text remains selectable after an earlier deletion", async () => {
  render(<Fixture />); await act(async () => {});
  act(() => select());
  fireEvent.click(screen.getByRole("button", { name: "Delete selected text" }));
  await waitFor(() => expect(screen.getByTestId("prose").textContent).toBe("The  runs callbacks."));
  fireEvent.pointerDown(screen.getByTestId("prose"));
  act(() => select(5, 9));
  fireEvent.pointerUp(screen.getByTestId("prose"));
  expect(window.getSelection()?.toString()).toBe("runs");
  expect(screen.getByRole("button", { name: "Delete selected text" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Delete selected text" }));
  await waitFor(() => expect(screen.getByTestId("prose").textContent).toBe("The   callbacks."));
});

test("eraser strokes preserve unselected text and retry a failed cloud save", async () => {
  saved = [{ ...anchorText("The event loop runs callbacks.", 4, 19), id: "wide", contentKey: key, kind: "highlight", color: "purple", updatedAt: "2026-09-13" }];
  render(<Fixture />); await act(async () => {});
  let offset = 6;
  const node = screen.getByTestId("prose").firstChild!;
  Object.defineProperty(document, "caretPositionFromPoint", { configurable: true, value: () => ({ offsetNode: node, offset }) });
  const originalRects = Range.prototype.getClientRects;
  Range.prototype.getClientRects = () => [{ left: 0, right: 100, top: 0, bottom: 20 }] as unknown as DOMRectList;
  try {
    fireEvent.click(screen.getByRole("button", { name: "Unhighlight selected text" }));
    const move = () => fireEvent(screen.getByTestId("prose"), new MouseEvent("pointermove", { bubbles: true, buttons: 1, clientX: 20, clientY: 10 }));
    move(); offset = 12; move();
    await waitFor(() => expect(saved.map(mark => mark.quote)).toEqual([" runs"]));
    fireEvent.pointerUp(screen.getByTestId("prose"));
    fireEvent.click(screen.getByRole("button", { name: "Unhighlight selected text" }));
    failSave = true; offset = 17; move();
    await waitFor(() => expect(saved.map(mark => mark.quote)).toEqual([" runs"]));
    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(2));
    expect([...CSS.highlights.values()].flatMap(mark => [...mark]).map(range => range.toString()).join("")).toBe(" ");
    failSave = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
    await waitFor(() => expect(saved.map(mark => mark.quote)).toEqual([" "]));
    fireEvent.keyDown(document, { key: "Escape" });
  } finally { Range.prototype.getClientRects = originalRects; }
});
test("storage failure does not hide marker colors or prevent native selection", async () => {
  global.fetch = jest.fn(async () => ({ ok: false, status: 503 } as Response));
  render(<Fixture />); await act(async () => {}); act(() => select());
  expect(window.getSelection()!.toString()).toBe("event loop");
  expect(screen.getByRole("alert")).toHaveTextContent(/load/);
  fireEvent.click(screen.getByRole("button", { name: "Highlight selected text" }));
  expect(within(screen.getByRole("group", { name: "Marker colors" })).getAllByRole("button")).toHaveLength(12);
  fireEvent.click(screen.getByRole("button", { name: "Highlight Teal" }));
  expect(screen.getByRole("alert")).toHaveTextContent(/couldn’t load/);
});
test("anchors survive layout changes and refuse ambiguous or changed text", () => {
  const anchor = anchorText("First paragraph. event loop is responsive.", 17, 27);
  expect(locateAnchor("A new heading. First paragraph. event loop is responsive.", anchor)?.start).toBe(32);
  expect(locateAnchor("different content", anchor)).toBeNull();
  expect(locateAnchor("repeat repeat", { quote: "repeat", prefix: "", suffix: "", start: 0, end: 6 })).toBeNull();
});
test("selection and deletion span React text nodes without destroying markup or code", () => {
  const root = document.createElement("div"); root.dataset.learningContent = key;
  root.innerHTML = '<p>Hello <strong>world</strong> 🌏!</p><button>Ignore me</button><pre><code>const x = 1;</code></pre>';
  document.body.appendChild(root);
  const range = document.createRange(); range.setStart(root.querySelector("p")!.firstChild!, 3); range.setEnd(root.querySelector("strong")!.firstChild!, 3);
  const anchor = selectionAnchor(root, range)!;
  expect(anchor.quote).toBe("lo wor");
  const mark: LearningMark = { ...anchor, id: "id", contentKey: key, kind: "delete", color: "yellow", updatedAt: "now" };
  renderPersonalText(root, [mark]);
  expect(root.querySelector("p")!.textContent).toBe("Helld 🌏!");
  expect(root.querySelector("strong")).not.toBeNull();
  expect(textModel(root).text).not.toContain("Ignore me");
  expect(root.querySelector("code")!.textContent).toBe("const x = 1;");
  restorePersonalText(root); expect(root.querySelector("p")!.textContent).toBe("Hello world 🌏!"); root.remove();
});
test("fully deleted lines collapse their list items and sections, partial deletions and restores keep them", () => {
  const root = document.createElement("div"); root.dataset.learningContent = key;
  root.innerHTML = '<section id="points"><h4>Key points</h4><ul><li id="first">Alpha line</li><li id="second">Beta line</li></ul></section><p id="kept">Gamma <a href="/x">link</a></p>';
  document.body.appendChild(root);
  const text = textModel(root).text;
  const remove = (quote: string): LearningMark => { const start = text.indexOf(quote); return { ...anchorText(text, start, start + quote.length), id: quote, contentKey: key, kind: "delete", color: "yellow", updatedAt: "now" }; };
  const emptied = (id: string) => root.querySelector(`#${id}`)!.hasAttribute("data-learning-emptied");
  renderPersonalText(root, [remove("Alpha line"), remove("Beta li"), remove("Gamma ")]);
  expect(emptied("first")).toBe(true);
  expect(emptied("second")).toBe(false);
  expect(emptied("kept")).toBe(false);
  renderPersonalText(root, [remove("Key points"), remove("Alpha line"), remove("Beta line")]);
  expect(emptied("points")).toBe(true);
  expect(root.querySelector("[data-learning-emptied] [data-learning-emptied]")).not.toBeNull();
  restorePersonalText(root);
  expect(root.querySelector("[data-learning-emptied]")).toBeNull(); root.remove();
});
test("deleting a line with an abbreviation pill still collapses the line", () => {
  const root = document.createElement("div"); root.dataset.learningContent = key;
  root.innerHTML = '<ul><li id="aws">Use <abbr title="Amazon Web Services">AWS</abbr><span aria-hidden="true">Amazon Web Services</span> daily</li><li>Keep me</li></ul>';
  document.body.appendChild(root);
  const text = textModel(root).text; const quote = "Use AWS daily"; const start = text.indexOf(quote);
  renderPersonalText(root, [{ ...anchorText(text, start, start + quote.length), id: "aws", contentKey: key, kind: "delete", color: "yellow", updatedAt: "now" }]);
  expect(root.querySelector("#aws")!.hasAttribute("data-learning-emptied")).toBe(true);
  expect(root.querySelector("ul")!.hasAttribute("data-learning-emptied")).toBe(false);
  restorePersonalText(root); root.remove();
});

test("the compact toolbar keeps every marker reachable by name but shows no labels and no idle hint", async () => {
  render(<CompactFixture />); await act(async () => {});
  for (const name of ["Highlight selected text", "Unhighlight selected text", "Delete selected text"]) {
    const button = screen.getByRole("button", { name });
    expect(button).toBeVisible();
    // Icon only: the accessible name comes from aria-label, not from text.
    expect(button.textContent).toBe("");
  }
  // The idle hint is what made the dialog header tall; it is gone when compact.
  expect(screen.queryByText(/Select text to highlight, unhighlight or delete/)).not.toBeInTheDocument();
  // A real message still appears, so nothing actionable is hidden.
  fireEvent.click(screen.getByRole("button", { name: "Unhighlight selected text" }));
  expect(await screen.findByText(/Unhighlight on: hold left mouse button and drag/)).toBeVisible();
});
