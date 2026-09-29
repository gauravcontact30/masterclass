import { fireEvent, render, screen, within } from "@testing-library/react";
import { CatalogBrowser } from "@/components/catalog-browser";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { prepareSearchTopics } from "@/lib/server/prepared-catalog";

const titles = [
  "Agentic AI", "Arcjet", "Inngest services",
  "JavaScript (ECMAScript 2026) — Language & Runtime",
  "Jest — Unit Testing, Mocks & Coverage",
  "React Testing Library — User-Centered UI Tests",
  "Redux", "Redis caching solutions", "Redux Toolkit", "System Design",
  "TypeScript 7 — Types, Compiler & Migration", "Upstash", "Zustand", "Webhook",
  "T3 environment", "TanStack Form", "TanStack Query", "TanStack Table", "TanStack Router",
  "TanStack Start", "TanStack Virtual", "Terraform", "uv package manager",
  "Vitest — Fast Unit Testing & Mocks", "Zod validation libraries",
];

test.each(titles)("every page in %s shows three points inside each card's own panel", title => {
  const book = TECHNOLOGY_HANDBOOKS.find(entry => entry.title === title)!;
  const items = prepareSearchTopics(book.topics, title, book.sources);
  render(<CatalogBrowser id="requested-details" title={title} technology={title}
    description={book.description} noun="topics" items={items} categories={book.categories}
    itemIcon={() => null} categoryIcon={() => null} question={row => row.name} onAsk={() => {}} />);

  const visited = new Set<string>();
  const allPoints = new Set<string>();
  const next = within(screen.getByRole("navigation", { name: `${title} pages` })).getByRole("button", { name: "Next page" });
  do {
    for (const card of screen.getAllByRole("listitem")) {
      const action = within(card).getByRole("button", { name: /^Explain this:/ });
      const name = action.getAttribute("aria-label")!.replace("Explain this: ", "");
      expect(visited.has(name)).toBe(false);
      visited.add(name);
      const label = within(card).getByText("Core features & key points");
      expect(label.parentElement).toHaveClass("pointsBlock");
      const lines = Array.from(label.parentElement!.children).slice(1).map(line => line.textContent!);
      expect(lines).toHaveLength(3);
      for (const line of lines) {
        expect(line.length).toBeGreaterThan(15);
        expect(allPoints.has(line)).toBe(false);
        allPoints.add(line);
      }
    }
    if ((next as HTMLButtonElement).disabled) break;
    fireEvent.click(next);
  } while (visited.size <= items.length);
  expect(visited.size).toBe(items.length);
}, 15000);
