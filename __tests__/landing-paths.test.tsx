import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingPaths } from "@/components/landing-paths";

test("three tabs switch one path view, by click and by arrow keys", async () => {
  const user = userEvent.setup();
  render(<LandingPaths />);
  const tabs = within(screen.getByRole("tablist", { name: "Learning paths" })).getAllByRole("tab");
  expect(tabs.map(tab => tab.textContent)).toEqual(["School", "Exams", "Technology"]);
  expect(within(screen.getByRole("tabpanel")).getByRole("heading", { name: "School & boards" })).toBeInTheDocument();
  await user.click(tabs[1]);
  const exams = screen.getByRole("tabpanel");
  expect(within(exams).getByRole("heading", { name: "Government & entrance exams" })).toBeInTheDocument();
  expect(within(within(exams).getByRole("list", { name: "Includes" })).getAllByRole("listitem").map(item => item.textContent)).toEqual(["SSC", "UPSC", "JEE", "NEET"]);
  await user.keyboard("{ArrowRight}");
  expect(tabs[2]).toHaveAttribute("aria-selected", "true");
  expect(tabs[2]).toHaveFocus();
  expect(within(screen.getByRole("tabpanel")).getByRole("link", { name: /See what’s covered/ })).toHaveAttribute("href", "/courses#technology");
});

test("a footer anchor such as #exams opens its tab", () => {
  window.location.hash = "#exams";
  render(<LandingPaths />);
  expect(screen.getByRole("tab", { name: "Exams" })).toHaveAttribute("aria-selected", "true");
  window.location.hash = "";
});

test("the tablet's screen follows the selected path", async () => {
  const user = userEvent.setup();
  const { container } = render(<LandingPaths />);
  const screenText = () => container.querySelector("div[aria-hidden='true']")?.textContent ?? "";
  expect(screenText()).toContain("/dashboard/cbse");
  expect(screenText()).toContain("Why does a pencil look bent in water?");
  await user.click(screen.getByRole("tab", { name: "Exams" }));
  expect(screenText()).toContain("/dashboard/ssc");
  expect(screenText()).toContain("If 3x + 5 = 20, what is the value of x?");
  await user.click(screen.getByRole("tab", { name: "Technology" }));
  expect(screenText()).toContain("npx create-next-app@latest my-blog");
});
