import { render, screen } from "@testing-library/react";
import { LandingStudyEngine } from "@/components/landing-study-engine";
import { LanguageProvider } from "@/components/language-provider";

const renderSection = () => render(<LanguageProvider><LandingStudyEngine /></LanguageProvider>);

test("the section explains how an answer is made, with the terminal hidden from assistive tech", () => {
  renderSection();
  const section = screen.getByRole("region", { name: /Ask once/ });
  expect(section).toHaveAttribute("id", "study-engine");
  expect(screen.getAllByRole("heading", { level: 3 }).map(item => item.textContent)).toEqual(["Your library first", "The right model for the question", "Clean, focused answers", "English or Hindi"]);
  // The terminal repeats the steps as a picture, so it is not read twice.
  expect(section.querySelector("[aria-hidden='true'] .sources, [aria-hidden='true']")).not.toBeNull();
  expect(screen.getByRole("link", { name: /Try Search/ })).toHaveAttribute("href", "/dashboard/search");
  expect(screen.getByText("OpenRouter")).toBeInTheDocument();
});

test("the FAQ is gone from the landing page", () => {
  renderSection();
  expect(screen.queryByText(/membership questions/i)).toBeNull();
});
