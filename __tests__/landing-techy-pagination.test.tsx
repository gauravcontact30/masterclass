import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingTechy } from "@/components/landing-pro-sections";

const data = {
  topics: Array.from({ length: 15 }, (_, index) => ({ id: `topic-${index}`, title: `Topic ${index + 1}`, category: "Technology", summary: "Summary", feature: "Feature", question: "Question", answer: "Answer", questionCount: 1 })),
  questionCount: 15, puzzleCount: 0, vocabularyCount: 0,
};

test("Techy pages six topics at a time without replacing the open topic", () => {
  render(<LandingTechy data={data} />);
  const group = screen.getByRole("group", { name: "Choose a topic" });
  const pager = screen.getByRole("navigation", { name: "Techy topic pages" });
  expect(within(group).getAllByRole("button")).toHaveLength(6);
  expect(within(pager).getByRole("button", { name: "Previous Techy topics" })).toBeDisabled();
  fireEvent.click(within(pager).getByRole("button", { name: "Next Techy topics" }));
  expect(within(group).getAllByRole("button")).toHaveLength(6);
  expect(screen.getByRole("heading", { name: "Topic 1" })).toBeInTheDocument();
  fireEvent.click(within(group).getByRole("button", { name: "Topic 7" }));
  expect(screen.getByRole("heading", { name: "Topic 7" })).toBeInTheDocument();
  fireEvent.click(within(pager).getByRole("button", { name: "Techy topics page 3" }));
  expect(within(group).getAllByRole("button")).toHaveLength(3);
  expect(within(pager).getByRole("button", { name: "Next Techy topics" })).toBeDisabled();
  fireEvent.click(within(pager).getByRole("button", { name: "Previous Techy topics" }));
  expect(within(group).getByRole("button", { name: "Topic 7" })).toHaveAttribute("aria-pressed", "true");
});
