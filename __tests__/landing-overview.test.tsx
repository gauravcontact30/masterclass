import { render, screen } from "@testing-library/react";
import { LandingOverview } from "@/components/landing-overview";


test("the overview states the product in three lines, names three tools with live counts, and links to sign-up", () => {
  render(<LandingOverview counts={{ technology: 61, api: 54, course: 42, word: 2091, techy: 15, handbookTopics: 4649, apiIdentifiers: 5402, techyQuestions: 300 }} />);
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("One dashboard.Two languages.A clear next step.");
  expect(screen.getAllByRole("heading", { level: 3 }).map(heading => heading.textContent)).toEqual(["Class Room", "On The Go", "Vocabulary"]);
  expect(screen.getByText(/build guides for 61 technologies/)).toBeInTheDocument();
  expect(screen.getByText(/2,091 English words/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Start learning/ })).toHaveAttribute("href", "/sign-up");
});
