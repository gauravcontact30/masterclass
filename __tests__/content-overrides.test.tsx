import { render, screen } from "@testing-library/react";
import { ContentProvider, Editable, useContentItem, useVisibleContent } from "@/components/content-editing";
import type { ContentOverrides } from "@/lib/content-overrides";
import { contentKey } from "@/lib/content-overrides";

jest.mock("sonner", () => ({ toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }) }));

const overrides: ContentOverrides = {
  "pulse:a": { fields: { title: "Edited title" }, deleted: false },
  "pulse:b": { fields: {}, deleted: true },
};
function Cards() {
  const cards = useVisibleContent([{ id: "a", title: "Original A" }, { id: "b", title: "Original B" }, { id: "c", title: "Original C" }], card => `pulse:${card.id}`);
  return <ul>{cards.map(card => <Card key={card.id} id={card.id} title={card.title} />)}</ul>;
}
function Card({ id, title }: { id: string; title: string }) {
  const item = useContentItem(`pulse:${id}`);
  if (item.hidden) return null;
  return <li {...item.props}>{item.toolbar}<Editable k={`pulse:${id}`} f="title">{title}</Editable></li>;
}

test("every visitor sees the Super Admin's edits and never a removed card", () => {
  render(<ContentProvider overrides={overrides}><Cards /></ContentProvider>);
  expect(screen.getByText("Edited title")).toBeInTheDocument();
  expect(screen.queryByText("Original A")).not.toBeInTheDocument();
  expect(screen.queryByText("Original B")).not.toBeInTheDocument();
  expect(screen.getByText("Original C")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /edit content/i })).not.toBeInTheDocument();
});

test("outside a provider the built-in content renders unchanged", () => {
  render(<Cards />);
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
});

test("only the Super Admin gets the edit switch, and edit mode shows removed cards with Restore", async () => {
  render(<ContentProvider overrides={overrides} canEdit><Cards /></ContentProvider>);
  screen.getByRole("button", { name: /edit content/i }).click();
  expect(await screen.findByText("Original B")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /restore/i })).toBeInTheDocument();
  expect(screen.getAllByRole("textbox")).toHaveLength(3);
  expect(screen.getAllByRole("button", { name: /delete card/i })).toHaveLength(2);
});

test("content keys stay within the database's key pattern", () => {
  expect(contentKey("word", "café au lait")).toBe("word:caf--au-lait");
  expect(contentKey("pulse", "")).toBe("pulse:item");
});
