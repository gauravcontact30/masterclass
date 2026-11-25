import { act, fireEvent, render, screen, within } from "@testing-library/react";
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
  // The panel title is a styled label above the accordion (components/landing-interview.tsx), not a heading.
  expect(await within(slide).findByText("LangChain questions")).toBeInTheDocument();
  expect(within(slide).getAllByRole("img", { name: /Asked often: \d of 5/ }).length).toBeGreaterThanOrEqual(30);
  fireEvent.click(within(slide).getByRole("button", { name: /Objective/ }));
  expect(slide.querySelectorAll("[data-correct='true']").length).toBeGreaterThanOrEqual(30);
  // Slides far from the current one wait to load.
  expect(within(screen.getByRole("listitem", { name: "31 / 31: Key TanStack libraries" })).getByRole("status")).toHaveTextContent("Loading questions");
});

test("the landing preview shows the 3 most asked of each kind and links to the full set in the dashboard", async () => {
  render(<LanguageProvider><LandingInterview preview /></LanguageProvider>);
  const slides = within(screen.getByRole("list", { name: "Interview questions by technology" })).getAllByRole("listitem");
  expect(slides).toHaveLength(3);
  const slide = slides[0];
  await within(slide).findByText(/ questions$/);
  expect(within(slide).getAllByRole("img", { name: /Asked often: \d of 5/ })).toHaveLength(3);
  expect(within(slide).getByRole("link", { name: /Showing the 3 most asked of \d+\. See all \d+ subjective questions in the dashboard/ })).toHaveAttribute("href", "/learning");
  fireEvent.click(within(slide).getByRole("button", { name: /Objective/ }));
  expect(slide.querySelectorAll("[data-correct='true']")).toHaveLength(3);
  expect(within(slide).getByRole("link", { name: /See all \d+ objective questions/ })).toBeInTheDocument();
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

test("the preview's Question of the week cycles Agentic AI, Next.js 16+ and AWS every 5 s and follows the arrows", () => {
  jest.useFakeTimers();
  Element.prototype.scrollTo ??= function scrollTo() {};
  try {
    render(<LanguageProvider><LandingInterview preview /></LanguageProvider>);
    const kicker = () => screen.getByText(/^Question of the week · /).textContent;
    const picks = within(screen.getByRole("group", { name: "Question of the week technology" }));
    expect(picks.getAllByRole("button").map(b => b.textContent)).toEqual(["Agentic AI", "Next.js 16+", "AWS"]);
    expect(kicker()).toBe("Question of the week · Agentic AI");
    act(() => { jest.advanceTimersByTime(5000); });
    expect(kicker()).toBe("Question of the week · Next.js 16+");
    fireEvent.click(screen.getByRole("button", { name: "Next technology" }));
    expect(kicker()).toBe("Question of the week · AWS");
    fireEvent.click(screen.getByRole("button", { name: "Previous technology" }));
    expect(kicker()).toBe("Question of the week · Next.js 16+");
    fireEvent.click(picks.getByRole("button", { name: "Agentic AI" }));
    expect(kicker()).toBe("Question of the week · Agentic AI");
  } finally {
    jest.useRealTimers();
  }
});
