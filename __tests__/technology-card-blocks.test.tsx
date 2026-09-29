import { cleanup, render, screen, within } from "@testing-library/react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { INDUSTRY_IMPACT, industryProblems } from "@/lib/pro-learn/essentials";
import { prepareSearchTopics } from "@/lib/server/prepared-catalog";

/**
 * A card says only what is its own.
 *
 * Key points, real uses and industry problems are authored at several levels —
 * on the row, on its category, on the whole technology — and the wider ones are
 * the same sentence for every topic beneath them. Printed on a card they fill a
 * grid of six with one repeated line, so the catalogue measures every line
 * across the whole of itself and a card drops anything a sibling would also
 * say. A block with nothing left is dropped, not padded.
 */

const handbook = (title: string) => TECHNOLOGY_HANDBOOKS.find(book => book.title === title)!;
const BLOCKS = ["Core features & key points", "Real use cases", "Real problems it solves, by industry"] as const;

function renderCatalogue(title: string, technology = title) {
  const book = handbook(title);
  render(<CatalogBrowser id="cards" title={title} technology={technology} description={book.description} noun="topics"
    items={book.topics} categories={book.categories} itemIcon={() => null} categoryIcon={() => null}
    question={row => row.name} onAsk={() => {}} />);
  return screen.getAllByRole("listitem");
}

/** Every line drawn inside one card's labelled blocks, block by block. */
function blockLines(card: HTMLElement): Record<string, string[]> {
  const lines: Record<string, string[]> = {};
  for (const label of BLOCKS) {
    const heading = within(card).queryByText(label);
    lines[label] = heading ? [...heading.parentElement!.children].slice(1).map(node => node.textContent!.trim()) : [];
  }
  return lines;
}

test.each([
  "Next.js 16+ — Routing, Rendering & Caching",
  "Prisma",
  "Docker",
  "Vitest — Fast Unit Testing & Mocks",
])("no line is repeated on two cards in %s", title => {
  const cards = renderCatalogue(title);
  expect(cards.length).toBeGreaterThan(0);
  const owner = new Map<string, number>();
  const repeated: string[] = [];
  cards.forEach((card, index) => {
    const lines = blockLines(card);
    for (const label of BLOCKS) {
      for (const line of lines[label]) {
        const first = owner.get(line);
        if (first !== undefined && first !== index) repeated.push(`${label}: ${line}`);
        else owner.set(line, index);
      }
    }
  });
  expect(repeated).toEqual([]);
});

test("a card never repeats its own definition inside its lists", () => {
  for (const card of renderCatalogue("Zod validation libraries")) {
    const definition = [...within(card).getByText("Definition").parentElement!.children][1]?.textContent?.trim();
    const lines = Object.values(blockLines(card)).flat();
    expect(lines).not.toContain(definition);
    expect(new Set(lines).size).toBe(lines.length);
  }
});

test("a row authored one by one keeps its own blocks", () => {
  // Next.js routing rows are written individually in `row-details.ts`, so their
  // points and use cases belong to the row and survive the filter.
  const cards = renderCatalogue("Next.js 16+ — Routing, Rendering & Caching");
  expect(cards.filter(card => within(card).queryByText("Core features & key points"))).toHaveLength(cards.length);
  expect(cards.filter(card => within(card).queryByText("Real use cases"))).toHaveLength(cards.length);
});

test.each(["Docker", "Prisma", "LangGraph"])("in %s a rendered block always has lines under it", title => {
  for (const card of renderCatalogue(title)) {
    const lines = blockLines(card);
    for (const label of BLOCKS) {
      if (within(card).queryByText(label)) expect(lines[label].length).toBeGreaterThan(0);
    }
  }
});

test.each(["Docker", "Prisma", "Next.js 16+ — Routing, Rendering & Caching"])(
  "%s draws no industry block, because that writing is technology-wide", title => {
    for (const card of renderCatalogue(title)) {
      expect(within(card).queryByText("Real problems it solves, by industry")).toBeNull();
    }
  });

test("the writing behind the industry block is still authored and reachable", () => {
  // Dropped from the cards, shown in the Explain this answer instead.
  expect(industryProblems("Docker", "Container foundations").length).toBeGreaterThan(0);
  expect(industryProblems("AWS", "Storage").length).toBeGreaterThan(0);
  // "Popular AWS services" is the heading; "AWS" is what the writing is filed under.
  expect(industryProblems("Popular AWS services", "Storage")).toEqual([]);
});

test("every authored industry entry names a sector and a real problem", () => {
  const thin = INDUSTRY_IMPACT.flatMap(entry => [
    ...(entry.industries.length < 3 ? [`${entry.technologies[0]}: fewer than three industries`] : []),
    ...entry.industries
      .filter(industry => industry.industry.length < 4 || industry.problem.length < 60 || !/[.!]$/.test(industry.problem))
      .map(industry => `${entry.technologies[0]} / ${industry.industry}`),
  ]);
  expect(thin).toEqual([]);
});

test("the server's prepared explanations do not reintroduce shared lines", () => {
  cleanup();
  const book = handbook("Redis caching solutions");
  render(<CatalogBrowser id="prepared" title={book.title} description={book.description} noun="topics"
    items={prepareSearchTopics(book.topics, book.title)} categories={book.categories}
    itemIcon={() => null} categoryIcon={() => null} question={row => row.name} onAsk={() => {}} />);
  const seen = new Set<string>();
  const repeated: string[] = [];
  for (const card of screen.getAllByRole("listitem")) {
    for (const line of Object.values(blockLines(card)).flat()) {
      if (seen.has(line)) repeated.push(line);
      seen.add(line);
    }
  }
  expect(repeated).toEqual([]);
});
