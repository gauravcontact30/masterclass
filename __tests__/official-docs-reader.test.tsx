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

test("offers every technology and switches the single embedded website", async () => {
  const user = userEvent.setup();
  const { container } = render(<OfficialDocs />);
  expect(container.querySelector("iframe")).toBeNull();
  const picker = screen.getByRole("combobox", { name: "Technology" });
  expect(within(picker).getAllByRole("option")).toHaveLength(OFFICIAL_DOCS.length);
  await user.click(screen.getByRole("button", { name: "Browse official website" }));
  expect(screen.getByTitle("React 19+ official website")).toHaveAttribute("src", "https://react.dev");
  await user.selectOptions(picker, "python");
  await user.click(screen.getByRole("button", { name: "Browse official website" }));
  expect(screen.getByTitle("Python (3.12 / 3.13+) official website")).toHaveAttribute("src", "https://docs.python.org/3/");
  expect(container.querySelectorAll("iframe")).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Open in new tab" })).toHaveAttribute("href", "https://docs.python.org/3/");
});

test("card action opens the reader without opening the summary modal", async () => {
  const user = userEvent.setup();
  render(<OfficialDocs />);
  await user.click(screen.getByRole("button", { name: "Read React 19+ website here" }));
  expect(screen.getByRole("region", { name: "Official website reader" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Browse official website" }));
  expect(screen.getByTitle("React 19+ official website")).toHaveAttribute("src", "https://react.dev");
  expect(screen.getByRole("combobox", { name: "Technology" })).toHaveValue("react");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

});

test("keeps an external fallback and can retry a failed frame", async () => {
  const user = userEvent.setup();
  render(<OfficialDocs />);
  await user.click(screen.getByRole("button", { name: "Browse official website" }));
  expect(screen.getByText(/Some publishers block viewing/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Website not loading?" }));
  expect(within(screen.getByRole("region", { name: "Official website reader" })).getByRole("status")).toHaveTextContent("This website could not be displayed here.");
  expect(screen.getByRole("link", { name: "Open in new tab" })).toHaveAttribute("rel", "noopener noreferrer");
  await user.click(screen.getByRole("button", { name: "Reload React 19+ website" }));
  expect(screen.getByTitle("React 19+ official website")).toBeInTheDocument();
});

test("explains publisher restrictions without displaying a broken frame", async () => {
  const user = userEvent.setup();
  render(<OfficialDocs />);
  await user.selectOptions(screen.getByRole("combobox", { name: "Technology" }), "nextjs");
  await user.click(screen.getByRole("button", { name: "Browse official website" }));
  expect(within(screen.getByRole("region", { name: "Official website reader" })).getByRole("status")).toHaveTextContent("Next.js 16+ restricts embedded viewing");
  expect(screen.queryByTitle("Next.js 16+ official website")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open in new tab" })).toHaveAttribute("href", "https://nextjs.org/docs");
  await user.click(screen.getByRole("button", { name: "Try embedded view" }));
  expect(screen.getByTitle("Next.js 16+ official website")).toHaveAttribute("src", "https://nextjs.org/docs");
});
