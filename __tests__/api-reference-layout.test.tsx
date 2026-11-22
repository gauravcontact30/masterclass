import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiDocs } from "@/components/api-docs";
import { API_CATEGORIES, API_PACKAGES, groupByCategory } from "@/lib/api-docs";
jest.mock("@/components/api-project-workspace", () => ({ ApiProjectWorkspace: () => <div>Project workspace</div> }));
jest.mock("next/navigation", () => ({ usePathname: () => "/learning/api-docs", useSearchParams: () => new URLSearchParams(), useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn(), refresh: jest.fn() }) }));
beforeAll(() => { Element.prototype.scrollIntoView = jest.fn(); });
// Catalogue facts are read from the catalogue itself, so the tests follow it as packages and identifiers are added.
const fmt = (value: number) => new Intl.NumberFormat("en-IN").format(value);
const PACKAGES = API_PACKAGES.length;
const IDENTIFIERS = API_PACKAGES.reduce((sum, pkg) => sum + pkg.entries.length, 0);
const NEXT_IDENTIFIERS = API_PACKAGES.find(pkg => pkg.id === "nextjs")!.entries.length;
const packagesIn = (id: string) => API_CATEGORIES.find(category => category.id === id)!.packages.length;

test("every catalog package sits in exactly one category", () => {
  const placed = API_CATEGORIES.flatMap(category => category.packages);
  expect(new Set(placed).size).toBe(placed.length);
  expect([...placed].sort()).toEqual(API_PACKAGES.map(pkg => pkg.id).sort());
  const grouped = groupByCategory(API_PACKAGES);
  expect(grouped.map(group => group.id)).toEqual(API_CATEGORIES.map(category => category.id));
  expect(groupByCategory([{ id: "brand-new" }])[0].label).toBe("More technologies");
});

test("the reference is divided by category with real catalog facts", () => {
  render(<ApiDocs />);
  const facts = screen.getByLabelText("Catalog at a glance");
  expect(within(facts).getByText(fmt(PACKAGES))).toBeInTheDocument();
  expect(within(facts).getByText(fmt(IDENTIFIERS))).toBeInTheDocument();
  expect(within(facts).getByText(String(groupByCategory(API_PACKAGES).length))).toBeInTheDocument();
  for (const category of API_CATEGORIES) expect(screen.getByRole("heading", { level: 2, name: new RegExp(`^${category.label}`) })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Browse packages" })).toBeInTheDocument();
});

test("choosing a package in the index filters to it and shows its details", async () => {
  const user = userEvent.setup();
  render(<ApiDocs />);
  const index = screen.getByRole("navigation", { name: "Browse packages" });
  await user.click(within(index).getByRole("button", { name: /Next\.js 16\+/ }));
  expect(screen.getByRole("status")).toHaveTextContent(`${fmt(NEXT_IDENTIFIERS)} identifiers in 1 package`);
  expect(screen.getByRole("link", { name: "usePathname" })).toHaveAttribute("href", "/learning/api-docs/nextjs/usePathname");
  expect(screen.getAllByText("Guide").length).toBeGreaterThan(0);
  await user.click(screen.getByRole("button", { name: "Show all packages" }));
  expect(screen.getByRole("status")).toHaveTextContent(`${fmt(IDENTIFIERS)} identifiers in ${PACKAGES} packages`);
});

test("status toggles appear as removable active filters", async () => {
  const user = userEvent.setup();
  render(<ApiDocs />);
  await user.click(within(screen.getByRole("group", { name: "API status filters" })).getByRole("button", { name: "Deprecated" }));
  const active = screen.getByRole("list", { name: "Active filters" });
  await user.click(within(active).getByRole("button", { name: "Show Deprecated again" }));
  expect(screen.queryByRole("list", { name: "Active filters" })).not.toBeInTheDocument();
});

// The index is an accordion (one category open at a time, the first by default) and remembers only the icon rail.
test("the package index collapses to an icon rail with tooltips and remembers it", async () => {
  const user = userEvent.setup();
  localStorage.clear();
  const { unmount } = render(<ApiDocs />);
  const index = screen.getByRole("navigation", { name: "Browse packages" });
  const first = groupByCategory(API_PACKAGES)[0];
  const heading = within(index).getByRole("button", { name: new RegExp(`^${first.label}`) });
  expect(heading).toHaveAttribute("aria-expanded", "true");
  await user.click(heading);
  expect(heading).toHaveAttribute("aria-expanded", "false");

  await user.click(within(index).getByRole("button", { name: "Collapse package list" }));
  expect(within(index).getByRole("button", { name: "Expand package list" })).toHaveAttribute("aria-expanded", "false");
  expect(within(index).queryByRole("button", { name: /Next\.js 16\+/ })).not.toBeInTheDocument();
  // Each rail icon carries its category summary as a tooltip.
  expect(within(index).getByRole("button", { name: new RegExp(`^Testing, ${packagesIn("testing")} packages`) })).toHaveAttribute("data-tip", expect.stringContaining("Testing"));
  expect(JSON.parse(localStorage.getItem("masterclass:api-index")!)).toMatchObject({ rail: true });
  unmount();

  render(<ApiDocs />);
  const restored = screen.getByRole("navigation", { name: "Browse packages" });
  expect(within(restored).getByRole("button", { name: "Expand package list" })).toBeInTheDocument();
  await user.click(within(restored).getByRole("button", { name: new RegExp(`^Frontend & state, ${packagesIn("frontend")} packages`) }));
  expect(within(restored).getByRole("button", { name: /React 19\+/ })).toBeVisible();
});

test("filter cards show live stability counts for the chosen package", async () => {
  const user = userEvent.setup();
  render(<ApiDocs />);
  const statuses = screen.getByRole("group", { name: "API status filters" });
  const deprecated = within(statuses).getByRole("button", { name: "Deprecated" });
  const total = API_PACKAGES.flatMap(pkg => pkg.entries).filter(entry => entry.status === "d").length;
  expect(deprecated).toHaveTextContent(String(total));
  await user.selectOptions(screen.getByRole("combobox", { name: "API package" }), "nextjs");
  const nextDeprecated = API_PACKAGES.find(pkg => pkg.id === "nextjs")!.entries.filter(entry => entry.status === "d").length;
  expect(deprecated).toHaveTextContent(String(nextDeprecated));
  expect(screen.getByText(new RegExp(`${NEXT_IDENTIFIERS} identifiers · Next\.js App Router`))).toBeInTheDocument();
});
