import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BookmarkButton, BookmarkPoint, BookmarkScope, BookmarksProvider } from "@/components/bookmarks";
import { BookmarkPage } from "@/components/bookmark-page";
import { bookmarkText, type SavedBookmark } from "@/lib/bookmarks";
jest.mock("@/lib/supabase-browser", () => ({ supabaseBrowser: () => ({ auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }) } }) }));
const source = { sourceKey: "agentic-ai-lesson-6", title: "Agentic AI essentials", technology: "agentic-ai", href: "/dashboard/notes?note=agentic-ai-lesson-6" };
const saved: SavedBookmark = { ...source, points: ["Use bounded tool loops."], id: "a".repeat(64), savedAt: "2026-09-14T12:00:00.000Z" };
const json = (data: unknown, ok = true) => Promise.resolve({ ok, status: ok ? 200 : 500, json: async () => data });
let records: SavedBookmark[];
beforeEach(() => {
  records = [];
  global.fetch = jest.fn((_url, init) => {
    if (init?.method === "PUT") { records = [saved]; return json({ userId: "alice", bookmark: saved }); }
    if (init?.method === "DELETE") { records = []; return json({ userId: "alice" }); }
    return json({ userId: "alice", bookmarks: records, nextCursor: null });
  }) as jest.Mock;
});
function App() { return <BookmarksProvider><BookmarkScope value={source}><BookmarkPoint text={saved.points[0]}>{saved.points[0]}</BookmarkPoint><BookmarkButton points={["Complete note summary"]} /></BookmarkScope><BookmarkPage technologies={[{ id: "agentic-ai", title: "Agentic AI" }]} /></BookmarksProvider>; }
test("saving a key point displays its title, technology and source; removing updates both surfaces", async () => {
  render(<App />);
  const button = screen.getByRole("button", { name: "Bookmark key point" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  const heading = await screen.findByRole("heading", { name: source.title });
  const group = heading.closest("section")!;
  expect(within(group).getByText("Agentic AI")).toBeVisible();
  expect(within(group).getByRole("link", { name: `Open source: ${source.title}` })).toHaveAttribute("href", source.href);
  expect(screen.getByRole("button", { name: "Remove bookmark" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: `Remove bookmark: ${source.title}` }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: source.title })).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Bookmark key point" })).toHaveAttribute("aria-pressed", "false");
});
test("saved records survive remount, search can be cleared, and exports keep attribution", async () => {
  records = [saved];
  const first = render(<App />);
  await screen.findByRole("heading", { name: source.title });
  first.unmount(); render(<App />);
  await screen.findByRole("heading", { name: source.title });
  fireEvent.change(screen.getByRole("textbox", { name: "Search bookmarks" }), { target: { value: "no-such-note" } });
  expect(screen.getByRole("heading", { name: "No matching bookmarks" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByRole("heading", { name: source.title })).toBeVisible();
  expect(bookmarkText([saved])).toContain(`- ${saved.points[0]}\nSource: ${source.href}`);
});
test("bookmark buttons are icon-only with an accessible name", async () => {
  render(<App />);
  const buttons = [screen.getByRole("button", { name: "Bookmark key point" }), screen.getByRole("button", { name: "Bookmark note" })];
  for (const button of buttons) { expect(button).toHaveTextContent(/^$/); expect(button.querySelector("svg")).not.toBeNull(); }
  await waitFor(() => expect(buttons[1]).toBeEnabled());
  (global.fetch as jest.Mock).mockImplementation((_url, init) => init?.method === "PUT" ? json({ userId: "alice", bookmark: { ...JSON.parse(init.body).bookmark, id: "b".repeat(64), savedAt: saved.savedAt } }) : json({ userId: "alice", bookmarks: [], nextCursor: null }));
  fireEvent.click(buttons[1]);
  await waitFor(() => expect(buttons[1]).toHaveAttribute("aria-pressed", "true"));
  expect(buttons[1]).toHaveTextContent(/^$/);
});
test("a failed save never shows the note as bookmarked", async () => {
  (global.fetch as jest.Mock).mockImplementation((_url, init) => init?.method === "PUT" ? json({}, false) : json({ userId: "alice", bookmarks: [], nextCursor: null }));
  render(<App />);
  const button = screen.getByRole("button", { name: "Bookmark key point" });
  await waitFor(() => expect(button).toBeEnabled()); fireEvent.click(button);
  await waitFor(() => expect(button).toBeEnabled());
  expect(button).toHaveAttribute("aria-pressed", "false");
  expect(screen.queryByRole("heading", { name: source.title })).not.toBeInTheDocument();
});
