import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MembershipFaq } from "@/components/membership-faq";

test("FAQ topics show the matching answers and reset the expanded question", async () => {
  const user = userEvent.setup();
  render(<MembershipFaq />);
  expect(screen.getByRole("region", { name: "How do I choose my learning path?" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Can I learn in Hindi?" }));
  expect(screen.getByRole("region", { name: "Can I learn in Hindi?" })).toBeVisible();
  expect(screen.queryByRole("region", { name: "How do I choose my learning path?" })).not.toBeInTheDocument();
  const topics = screen.getByRole("group", { name: "Question topics" });
  await user.click(within(topics).getByRole("button", { name: "Membership" }));
  expect(within(topics).getByRole("button", { name: "Membership" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("region", { name: "When does my membership access begin?" })).toHaveTextContent("payment verification");
  expect(screen.queryByRole("button", { name: "Can I learn in Hindi?" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Can I cancel my renewal?" }));
  expect(screen.getByRole("region", { name: "Can I cancel my renewal?" })).toHaveTextContent("period you have already paid for");
});

test("FAQ questions support keyboard expansion and expose their answer relationship", async () => {
  const user = userEvent.setup();
  render(<MembershipFaq />);
  const question = screen.getByRole("button", { name: "Can I learn in Hindi?" });
  question.focus();
  await user.keyboard("{Enter}");
  const answer = screen.getByRole("region", { name: "Can I learn in Hindi?" });
  expect(question).toHaveAttribute("aria-expanded", "true");
  expect(question).toHaveAttribute("aria-controls", answer.id);
  await user.keyboard(" ");
  expect(question).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("link", { name: "Explore membership" })).toHaveAttribute("href", "/dashboard?tab=plans");
});
