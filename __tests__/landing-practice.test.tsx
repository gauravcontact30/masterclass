import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingPractice } from "@/components/landing-practice";

test("an answer locks the options, explains the working and offers the next topic", async () => {
  const user = userEvent.setup();
  render(<LandingPractice />);
  await user.click(screen.getByRole("button", { name: /17/ }));
  expect(screen.getByRole("status")).toHaveTextContent("Let’s work through it.");
  expect(screen.getByRole("status")).toHaveTextContent("Count the four gaps, not five.");
  expect(screen.getByRole("button", { name: /19/ })).toBeDisabled();

  await user.click(screen.getByRole("button", { name: "Try again" }));
  await user.click(screen.getByRole("button", { name: /19/ }));
  expect(screen.getByRole("status")).toHaveTextContent("That’s right.");

  await user.click(screen.getByRole("button", { name: /Next: Science/ }));
  const topics = within(screen.getByRole("group", { name: "Sample topic" }));
  expect(topics.getByRole("button", { name: /Science/ })).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /1 mol/ })).toBeEnabled();
});
