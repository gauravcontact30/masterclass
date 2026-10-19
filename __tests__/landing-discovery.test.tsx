import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingHero, CourseMarquee } from "@/components/landing-discovery";
test("hero rotates through four slides and stops on pause", () => {
  jest.useFakeTimers(); render(<LandingHero/>);
  expect(screen.getAllByRole("button", { name: /^Go to slide/ })).toHaveLength(4);
  act(() => jest.advanceTimersByTime(6500)); expect(screen.getByRole("heading", { name: "One ambition. A clearer direction." })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" })); act(() => jest.advanceTimersByTime(20000));
  expect(screen.getByRole("heading", { name: "One ambition. A clearer direction." })).toBeVisible(); jest.useRealTimers();
});
test("a category opens its key points and Escape closes the modal", async () => {
  const user = userEvent.setup(); render(<CourseMarquee/>);
  await user.click(screen.getByRole("button", { name: "System Design" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("WhatsApp · Instagram · E-commerce · Payments · AI automation");
  expect(screen.getByRole("heading", { name: "Key points" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Choose monthly / yearly membership" })).toHaveAttribute("href", "/dashboard/plans");
  await user.keyboard("{Escape}"); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Pause categories" })); expect(screen.getByRole("button", { name: "Play categories" })).toHaveAttribute("aria-pressed", "true");
});
