import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingInterview } from "@/components/landing-interview";
import { NAV_PAGE_SIZE } from "@/components/interview-tech-nav";
import { LanguageProvider } from "@/components/language-provider";
import { INTERVIEW_TECHS } from "@/lib/interview-bank";

const renderSection = () => render(<LanguageProvider><LandingInterview /></LanguageProvider>);
const rail = () => within(screen.getByRole("group", { name: "Choose a technology" }));

test("one slide per technology; the navigator shows eight a page, the first marked current", () => {
  renderSection();
  const carousel = screen.getByRole("list", { name: "Interview questions by technology" });
  expect(within(carousel).getAllByRole("listitem", { name: /^\d+ \/ 31: / })).toHaveLength(INTERVIEW_TECHS.length);
  expect(rail().getAllByRole("button")).toHaveLength(NAV_PAGE_SIZE);
  expect(rail().getByRole("button", { name: /LangChain/ })).toHaveAttribute("aria-current", "true");
  const pager = within(screen.getByRole("navigation", { name: "Technology pages" }));
  expect(pager.getAllByRole("button", { name: /^Page \d$/ })).toHaveLength(4);
  expect(pager.getByText("Showing 1–8 of 31")).toBeInTheDocument();
});

test("the pager steps through the technologies", () => {
  renderSection();
  fireEvent.click(screen.getByRole("button", { name: "Next technologies" }));
  expect(rail().getByRole("button", { name: new RegExp(INTERVIEW_TECHS[8].title) })).toBeInTheDocument();
  expect(rail().queryByRole("button", { name: /LangChain/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Page 4" }));
  expect(rail().getAllByRole("button")).toHaveLength(31 - 3 * NAV_PAGE_SIZE);
  expect(screen.getByRole("button", { name: "Next technologies" })).toBeDisabled();
});

test("search suggests matches, filters the grid and clears", () => {
  renderSection();
  const search = screen.getByRole("combobox", { name: "Search technologies" });
  fireEvent.change(search, { target: { value: "redux" } });
  expect(within(screen.getByRole("listbox", { name: "Suggestions" })).getAllByRole("option").map(o => o.textContent)).toEqual(expect.arrayContaining([expect.stringContaining("Redux Toolkit")]));
  expect(rail().getAllByRole("button")).toHaveLength(2);
  expect(screen.getByText("2 of 31 match")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(search).toHaveValue("");
  expect(rail().getAllByRole("button")).toHaveLength(NAV_PAGE_SIZE);
});

test("category filters narrow the grid, and an empty search offers a reset", () => {
  renderSection();
  fireEvent.click(within(screen.getByRole("group", { name: "Filter by category" })).getByRole("button", { name: /Testing/ }));
  const testing = INTERVIEW_TECHS.filter(t => t.kind === "testing");
  expect(rail().getAllByRole("button")).toHaveLength(testing.length);
  fireEvent.change(screen.getByRole("combobox", { name: "Search technologies" }), { target: { value: "zzz" } });
  fireEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));
  expect(rail().getAllByRole("button")).toHaveLength(NAV_PAGE_SIZE);
});

test("the visible slide loads its questions into the accordion with star ratings", async () => {
  renderSection();
  const slide = screen.getByRole("listitem", { name: "1 / 31: LangChain" });
  expect(await within(slide).findByRole("heading", { name: "LangChain questions" })).toBeInTheDocument();
  expect(within(slide).getAllByRole("img", { name: /Asked often: \d of 5/ }).length).toBeGreaterThanOrEqual(30);
  fireEvent.click(within(slide).getByRole("button", { name: /Objective/ }));
  expect(slide.querySelectorAll("[data-correct='true']").length).toBeGreaterThanOrEqual(30);
  // Slides far from the current one wait to load.
  expect(within(screen.getByRole("listitem", { name: "31 / 31: Key TanStack libraries" })).getByRole("status")).toHaveTextContent("Loading questions");
});

test("Key TanStack libraries switches between a tab per library", async () => {
  renderSection();
  const slide = screen.getByRole("listitem", { name: "31 / 31: Key TanStack libraries" });
  const tabs = within(slide).getAllByRole("tab");
  expect(tabs.map(tab => tab.textContent)).toEqual(["Query", "Router", "Start", "Table", "Form", "DB & AI"]);
  expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  fireEvent.click(tabs[3]);
  expect(within(slide).getByRole("tab", { name: "Table" })).toHaveAttribute("aria-selected", "true");
  expect(within(slide).getByRole("tabpanel")).toHaveAttribute("aria-labelledby", tabs[3].id);
});
