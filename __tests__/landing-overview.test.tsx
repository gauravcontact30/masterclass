import { render, screen, within } from "@testing-library/react";
import { LandingOverview } from "@/components/landing-overview";

const counts = { technology: 61, api: 54, course: 42, word: 2091, techy: 15, handbookTopics: 4649, apiIdentifiers: 5402, techyQuestions: 300 };

test("the overview states the product in three lines, names three tools with live counts, and links to sign-up", () => {
  render(<LandingOverview counts={counts} />);
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("One dashboard.Two languages.A clear next step.");
  expect(screen.getAllByRole("article").map(card => within(card).getByRole("heading", { level: 3 }).textContent)).toEqual(["Class Room", "On The Go", "Vocabulary"]);
  expect(screen.getByText(/build guides for 61 technologies/)).toBeInTheDocument();
  expect(screen.getByText(/2,091 English words/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Start learning/ })).toHaveAttribute("href", "/sign-up");
});

test("every tile is a focusable flip card with a back of points and a next step", () => {
  render(<LandingOverview counts={counts} />);
  const tiles = screen.getAllByRole("group");
  expect(tiles).toHaveLength(6);
  const tones = new Set<string>();
  for (const tile of tiles) {
    expect(tile).toHaveAttribute("tabindex", "0");
    expect(tile).toHaveAccessibleName();
    const back = tile.querySelector("[data-back]")!;
    tones.add(back.getAttribute("data-back")!);
    expect(back.querySelectorAll("li").length).toBeGreaterThanOrEqual(3);
    expect(within(back as HTMLElement).getByRole("link")).toHaveAttribute("href");
  }
  // Six tiles, six different light colours.
  expect(tones.size).toBe(6);
});
