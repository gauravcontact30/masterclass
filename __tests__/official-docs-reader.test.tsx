import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfficialDocs } from "@/components/official-docs";
import { OFFICIAL_DOCS } from "@/lib/official-docs-data";

test("replaces the reference sidebar with three paginated category tabs", async () => {
  const user = userEvent.setup();
  render(<OfficialDocs />);
  expect(screen.queryByRole("complementary", { name: "Technology reference index" })).not.toBeInTheDocument();
  const tabs = screen.getByRole("tablist", { name: "Reference categories" });
  expect(within(tabs).getAllByRole("tab")).toHaveLength(3);
  expect(screen.getByRole("button", { name: "Previous reference categories" })).toBeDisabled();
  await user.click(within(tabs).getByRole("tab", { name: /State Management/ }));
  expect(screen.getByRole("combobox", { name: "Technology" })).toHaveValue("zustand");
  await user.keyboard("{ArrowRight}");
  expect(within(tabs).getByRole("tab", { name: /State & Data Libraries/ })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Next reference categories" }));
  expect(within(tabs).getAllByRole("tab")).toHaveLength(3);
  expect(within(tabs).getByRole("tab", { name: /Databases & Storage/ })).toHaveAttribute("aria-selected", "true");
  await user.selectOptions(screen.getByRole("combobox", { name: "Technology" }), "react");
  expect(within(tabs).getByRole("tab", { name: /Frontend Frameworks/ })).toHaveAttribute("aria-selected", "true");
});

test("offers every technology and never embeds or links to an official website", async () => {
  const user = userEvent.setup();
  const { container } = render(<OfficialDocs />);
  const picker = screen.getByRole("combobox", { name: "Technology" });
  expect(within(picker).getAllByRole("option")).toHaveLength(OFFICIAL_DOCS.length);
  await user.selectOptions(picker, "python");
  expect(screen.getByRole("article", { name: "Python (3.12 / 3.13+) learning notes" })).toBeInTheDocument();
  expect(container.querySelector("iframe")).toBeNull();
  expect(screen.queryByRole("button", { name: /official website/i })).toBeNull();
  expect(screen.queryByRole("link", { name: /official|Open in new tab/i })).toBeNull();
});

test("card action opens the reader without opening the summary modal", async () => {
  const user = userEvent.setup();
  render(<OfficialDocs />);
  await user.click(screen.getByRole("button", { name: "Study React 19+ in the reader" }));
  expect(screen.getByRole("region", { name: "Documentation reader" })).toHaveFocus();
  expect(screen.getByRole("combobox", { name: "Technology" })).toHaveValue("react");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
