import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingTechy } from "@/components/landing-pro-sections";

const data = {
  topics: Array.from({ length: 15 }, (_, index) => ({ id: `topic-${index}`, title: `Topic ${index + 1}`, category: "Technology", summary: "Summary", feature: "Feature", question: "Question", answer: "Answer", questionNumber: 1, questionCount: 1 })),
  questionCount: 15, puzzleCount: 0, vocabularyCount: 0,
};

// Six topic cards a page; the pager loops round (it also autoplays), and the open topic stays open while paging.
const cards = () => [...document.querySelectorAll("button[aria-pressed]")].filter(button => button.querySelector("strong"));
test("Techy pages six topics at a time without replacing the open topic", () => {
  render(<LandingTechy data={data} />);
  const pager = screen.getByRole("navigation", { name: "Topic pages" });
  expect(cards()).toHaveLength(6);
  expect(within(pager).getByRole("status")).toHaveTextContent("Page 1 of 3");
  fireEvent.click(within(pager).getByRole("button", { name: "Next topics" }));
  expect(cards()).toHaveLength(6);
  expect(screen.getByText("Topic 1", { selector: "div" })).toBeInTheDocument();
  fireEvent.click(cards().find(card => card.textContent?.includes("Topic 7"))!);
  expect(screen.getByText("Topic 7", { selector: "div" })).toBeInTheDocument();
  fireEvent.click(within(pager).getByRole("button", { name: "Topics page 3" }));
  expect(cards()).toHaveLength(3);
  // From the last page, Next loops back to the first.
  fireEvent.click(within(pager).getByRole("button", { name: "Next topics" }));
  expect(within(pager).getByRole("status")).toHaveTextContent("Page 1 of 3");
  fireEvent.click(within(pager).getByRole("button", { name: "Topics page 2" }));
  expect(cards().find(card => card.textContent?.includes("Topic 7"))).toHaveAttribute("aria-pressed", "true");
});
