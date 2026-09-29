import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AnswerSearch } from "@/components/answer-search";
import { CLASSROOM_CATALOGUES } from "@/lib/pro-learn/classroom";
import type { AnchorHTMLAttributes } from "react";
jest.mock("next/link", () => ({ __esModule: true, default: ({ prefetch, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => { void prefetch; return <a {...props} />; } }));
jest.mock("@/components/code-lab", () => ({ CodeLab: ({ code }: { code: string }) => <pre>{code}</pre> }));

const answer = {
  headline: "A prime number has exactly two factors.", definition: "", summary: "One and itself.",
  steps: [{ title: "Divide", detail: "Try every number below it.", code: "" }],
  alternatives: [], useCases: [], subjects: [], files: [], keyPoints: [], caveats: [], followUps: [],
};
const reply = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = jest.fn();
  window.requestAnimationFrame = (callback: FrameRequestCallback) => { callback(0); return 0; };
  global.fetch = jest.fn().mockImplementation(async (url: string) =>
    url === "/api/pro-learn/answer"
      ? reply({ answer, provider: "perplexity", sources: [], matches: [] })
      : reply({ providers: [], default: null })) as jest.Mock;
});

/** Class Room as the route mounts it: catalogues only, nothing to ask in. */
const classroom = () => render(<AnswerSearch search={false} heading="Class Room" emptyNoun="topic"
  intro="Every subject from Class 6 to Class 12." catalogues={CLASSROOM_CATALOGUES} />);

test("Class Room offers no question box and no earlier-searches index", () => {
  classroom();
  expect(screen.getByRole("heading", { name: "Class Room", level: 1 })).toBeVisible();
  // The page's own search row, the Ask button, and the history strip.
  expect(screen.queryByLabelText("Ask a question")).toBeNull();
  expect(screen.queryByRole("button", { name: /^Ask/ })).toBeNull();
  expect(screen.queryByText("Earlier searches")).toBeNull();
  // The "your answers collect here" prompt goes with the box it pointed at.
  expect(screen.queryByText(/Your answers collect here/)).toBeNull();
});

test("the search page keeps its question box", () => {
  render(<AnswerSearch heading="Search" catalogues={[]} />);
  expect(screen.getByLabelText("Ask a question")).toBeVisible();
});

/**
 * Topic cards open their prepared lessons without an extra AI request.
 */
test("a topic card still opens its answer, with no question box on the page", async () => {
  classroom();
  const card = screen.getAllByRole("button", { name: /Comparing numbers/ })[0];
  fireEvent.click(card);
  expect(await screen.findByRole("dialog")).toBeVisible();
  expect(screen.getByRole("dialog")).toHaveTextContent("Which is greater: 58,742 or 58,927?");
  expect((global.fetch as jest.Mock).mock.calls.some(([url]) => url === "/api/pro-learn/answer")).toBe(false);
});

/** Closing the answer leaves the reader on the catalogue, not on a history list. */
test("closing an answer does not reveal an earlier-searches section", async () => {
  classroom();
  fireEvent.click(screen.getAllByRole("button", { name: /Comparing numbers/ })[0]);
  await screen.findByRole("dialog");
  expect(screen.getByRole("dialog")).toHaveTextContent("Which is greater: 58,742 or 58,927?");
  fireEvent.keyDown(document.body, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.queryByText("Earlier searches")).toBeNull();
});

test("each card carries a topic icon, and a page of cards is not one icon six times", () => {
  const { container } = classroom();
  const cards = [...container.querySelectorAll(".card")];
  expect(cards.length).toBeGreaterThan(0);
  for (const card of cards) expect(card.querySelector(".cardIcon svg")).not.toBeNull();
  // Class Room cards are categorised by class, not by topic, so before the
  // per-topic resolver every card on the page carried the same generic mark.
  const marks = cards.map(card => card.querySelector(".cardIcon svg")?.getAttribute("class"));
  expect(new Set(marks).size).toBeGreaterThan(1);
});

/** The abstract line-art strips are gone; nothing should reserve space for one. */
test("no card draws a decorative diagram", () => {
  const { container } = classroom();
  expect(container.querySelector(".cardFigure")).toBeNull();
});

test("a prepared explanation contains the place-value formula and complete worked answer", async () => {
  classroom();
  fireEvent.click(screen.getAllByRole("button", { name: /Comparing numbers/ })[0]);
  const dialog=await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("58,742 = 50,000 + 8,000 + 700 + 40 + 2");
  expect(dialog).toHaveTextContent("Which is greater: 58,742 or 58,927?");
  expect(dialog).toHaveTextContent("Both numbers have five digits.");
  expect(dialog).toHaveTextContent("58,927 > 58,742");
  expect((global.fetch as jest.Mock).mock.calls.some(([url]) => url === "/api/pro-learn/answer")).toBe(false);
});
