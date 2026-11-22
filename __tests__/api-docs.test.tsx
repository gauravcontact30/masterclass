import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiDocs } from "@/components/api-docs";
import { API_PACKAGES, API_TYPES, filterApiPackages, groupByCategory } from "@/lib/api-docs";
jest.mock("@/components/api-project-workspace",()=>({ApiProjectWorkspace:()=> <div>Project workspace</div>}));
import { API_DETAILS } from "@/lib/api-docs-details";
import { AGENTIC_ADDITIONS, AGENTIC_PACKAGE_IDS, agenticSection, agenticSections } from "@/lib/api-docs-agentic";

let mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({ usePathname: () => "/learning/api-docs", useSearchParams: () => mockSearchParams, useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn(), refresh: jest.fn() }) }));
beforeEach(() => { mockSearchParams = new URLSearchParams(); });

test("reference catalog has unique identifiers, supported types and HTTPS documentation", () => {
  // The catalogue grows; every package is checked below, so only a floor is pinned here.
  expect(API_PACKAGES.length).toBeGreaterThanOrEqual(59);
  expect(API_PACKAGES.reduce((sum, pkg) => sum + pkg.entries.length, 0)).toBeGreaterThanOrEqual(5698);
  const kinds = API_TYPES.map(type => type.k);
  for (const pkg of API_PACKAGES) {
    expect(pkg.docs).toMatch(/^https:\/\//);
    expect(new Set(pkg.entries.map(entry => entry.name)).size).toBe(pkg.entries.length);
    for (const entry of pkg.entries) {
      expect(kinds).toContain(entry.kind);
      expect(["s", "p", "x", "d"]).toContain(entry.status);
    }
  }
  for (const id of Object.keys(API_DETAILS)) {
    const [pkg, name] = id.split(":");
    expect(API_PACKAGES.find(item => item.id === pkg)?.entries.some(entry => entry.name === name)).toBe(true);
  }
});

test("API filters intersect package, status and identifier type", () => {
  const result = filterApiPackages("useState", "react", ["H"], ["s"]);
  expect(result).toHaveLength(1);
  expect(result[0].entries.map(entry => entry.name)).toEqual(["useState"]);
  expect(filterApiPackages("useState", "python", [], ["s"])).toEqual([]);
  expect(filterApiPackages("", "all", [], [])).toEqual([]);
});

test("search, clearing filters, grouping and deep links work", async () => {
  const user = userEvent.setup(); render(<ApiDocs/>);
  const search = screen.getByRole("searchbox", { name: "Filter APIs" });
  await user.click(search);
  await user.paste("useState");
  expect(screen.getByRole("link", { name: "useState" })).toHaveAttribute("href", "/learning/api-docs/react/useState");
  await user.selectOptions(screen.getByRole("combobox", { name: "API package" }), "python");
  expect(screen.getByRole("heading", { name: "No APIs match your filters." })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Clear all filters" }));
  expect(search).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Toggle Angular" }));
  expect(screen.getByRole("link", { name: "HttpClient" })).toBeVisible();
  await user.click(within(screen.getByRole("group", { name: "API status filters" })).getByRole("button", { name: "Deprecated" }));
  expect(screen.queryByRole("link", { name: /NgFor/ })).not.toBeInTheDocument();
});

// The in-app detail panel (client fetch, retry and error alerts) was replaced by server-rendered pages at
// /learning/api-docs/[packageId]/[name]; their content is covered by api-detail-fallback.test.ts and
// api-definition.test.tsx, so the index tests below cover only the catalogue browser.

test("every Agentic AI framework lists all of its entries, open and grouped by section", async () => {
  const user = userEvent.setup();
  render(<ApiDocs/>);
  for (const id of AGENTIC_PACKAGE_IDS) {
    const pkg = API_PACKAGES.find(item => item.id === id)!;
    const group = document.getElementById(`api-group-${id}`)!;
    expect(group).toBeVisible();
    // No "Show all" cap: every catalog entry, including each new one, is a link in the list.
    const names = new Set(pkg.entries.map(entry => entry.name));
    expect(within(group).getAllByRole("link").filter(link => names.has(link.textContent?.trim() ?? "")).length).toBe(pkg.entries.length);
    for (const added of AGENTIC_ADDITIONS[id]) {
      expect(pkg.entries.some(entry => entry.name === added.name)).toBe(true);
      expect(API_DETAILS[`${id}:${added.name}`]?.notes.length).toBeGreaterThan(0);
    }
    // Every entry still belongs to one of the framework's sections (the list no longer prints section headings).
    // Entries not yet sorted into a named section fall into the catch-all "More reference".
    for (const entry of pkg.entries) expect([...agenticSections(id)!, "More reference"]).toContain(agenticSection(id, entry.name, entry.kind));
  }
  expect(within(document.getElementById("api-group-langchain")!).getByRole("link", { name: "SummarizationMiddleware" })).toBeVisible();
  // Collapsing is remembered, and the toggle reopens it.
  await user.click(screen.getByRole("button", { name: "Toggle LangChain" }));
  expect(document.getElementById("api-group-langchain")).not.toBeVisible();
  await user.click(screen.getByRole("button", { name: "Toggle LangChain" }));
  expect(document.getElementById("api-group-langchain")).toBeVisible();
});

test("Langflow sits under Agentic AI frameworks with an authored page for every entry", () => {
  const agentic = groupByCategory(API_PACKAGES).find(category => category.id === "agentic")!;
  expect(agentic.label).toBe("Agentic AI frameworks");
  expect(agentic.packages.map(pkg => pkg.id)).toContain("langflow");
  const langflow = API_PACKAGES.find(pkg => pkg.id === "langflow")!;
  expect(langflow.docs).toBe("https://docs.langflow.org");
  // Hand-written pages cite Langflow's own docs; newer entries are written from verified official cards instead.
  const authored = langflow.entries.filter(entry => API_DETAILS[`langflow:${entry.name}`]);
  expect(authored.length).toBeGreaterThan(0);
  for (const entry of authored) {
    const detail = API_DETAILS[`langflow:${entry.name}`];
    expect(detail.source).toMatch(/^https:\/\/docs\.langflow\.org\//);
    expect(detail.notes.length).toBeGreaterThanOrEqual(1);
    expect(detail.code.length).toBeGreaterThan(0);
  }
});

test("each identifier type shows how many entries it holds, without changing its name", async () => {
  const user = userEvent.setup(); render(<ApiDocs/>);
  await user.click(screen.getByRole("button", { name: `All ${API_TYPES.length} types` }));
  // The type filter appears twice (the index's compact chips and the filter panel); the panel's buttons carry counts.
  const hook = screen.getAllByRole("group", { name: "Identifier types" }).map(group => within(group).getByRole("button", { name: "Hook" })).find(button => /\d/.test(button.textContent ?? ""))!;
  const hooks = API_PACKAGES.reduce((sum, pkg) => sum + pkg.entries.filter(entry => entry.kind === "H").length, 0);
  expect(hook).toHaveTextContent(`Hook${hooks.toLocaleString("en-US")}`);
});
