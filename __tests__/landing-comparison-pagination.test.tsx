import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingComparisons } from "@/components/landing-comparisons";
import { LanguageProvider } from "@/components/language-provider";
import { COMPARISONS } from "@/lib/comparisons";
jest.mock("@/components/use-paged-carousel", () => {
  const React = jest.requireActual("react");
  return { usePagedCarousel: (count: number) => {
    const [page, goTo] = React.useState(0);
    return { track: React.useRef(null), page, pages: count, playing: false, setPlaying: jest.fn(), running: false, goTo, holdProps: {} };
  } };
});
jest.mock("@/lib/comparisons", () => ({ ...jest.requireActual("@/lib/comparisons"), loadComparisonBank: () => new Promise(() => {}) }));

test("illustrated picker shows five per page, switches its selected comparison, and handles the last page", () => {
  render(<LanguageProvider><LandingComparisons /></LanguageProvider>);
  const picker = within(screen.getByRole("navigation", { name: "Browse illustrated comparisons" }));
  const pager = within(screen.getByRole("navigation", { name: "Pages" }));
  expect(picker.getAllByRole("button")).toHaveLength(5);
  expect(pager.getByText(`Showing 1–5 of ${COMPARISONS.length}`)).toBeInTheDocument();
  fireEvent.click(pager.getByRole("button", { name: "Next page" }));
  expect(picker.getAllByRole("button")).toHaveLength(5);
  expect(picker.getAllByRole("button")[0]).toHaveAttribute("aria-current", "true");
  expect(pager.getByText(`Showing 6–10 of ${COMPARISONS.length}`)).toBeInTheDocument();
  fireEvent.click(pager.getByRole("button", { name: String(Math.ceil(COMPARISONS.length / 5)), exact: true }));
  expect(picker.getAllByRole("button")).toHaveLength(COMPARISONS.length % 5 || 5);
  expect(pager.getByRole("button", { name: "Next page" })).toBeDisabled();
});
