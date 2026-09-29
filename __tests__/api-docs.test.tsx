import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiDocs } from "@/components/api-docs";
import { API_PACKAGES, API_TYPES, filterApiPackages } from "@/lib/api-docs";
jest.mock("@/components/api-project-workspace",()=>({ApiProjectWorkspace:()=> <div>Project workspace</div>}));
import { API_DETAILS } from "@/lib/api-docs-details";
import { catalogApiDetail, enrichApiLearning } from "@/lib/api-learning";
import { catalogReference } from "@/lib/server/api-reference-fallback";
import styles from "@/components/api-docs.module.css";

let mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({ usePathname: () => "/dashboard/api-docs", useSearchParams: () => mockSearchParams }));
beforeEach(() => { mockSearchParams = new URLSearchParams(); });

test("reference catalog has unique identifiers, supported types and HTTPS documentation", () => {
  expect(API_PACKAGES).toHaveLength(54);
  expect(API_PACKAGES.reduce((sum, pkg) => sum + pkg.entries.length, 0)).toBe(5402);
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
  expect(screen.getByRole("link", { name: "useState" })).toHaveAttribute("href", "/dashboard/api-docs/react/useState");
  await user.selectOptions(screen.getByRole("combobox", { name: "API package" }), "python");
  expect(screen.getByRole("heading", { name: "No APIs match your filters." })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Clear all filters" }));
  expect(search).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Toggle Angular" }));
  expect(screen.getByRole("link", { name: "HttpClient" })).toBeVisible();
  await user.click(within(screen.getByRole("group", { name: "API status filters" })).getByRole("button", { name: "Deprecated" }));
  expect(screen.queryByRole("link", { name: /NgFor/ })).not.toBeInTheDocument();
});

test("detail view contains a signature, parameters, usage and cross references", () => {
  mockSearchParams = new URLSearchParams("package=react&api=useState");
  render(<ApiDocs/>);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("useState");
  expect(screen.getByRole("heading", { name: "Syntax" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Example" })).toBeVisible();
  expect(screen.getByLabelText("Word 1 of 4")).toHaveTextContent("01");
  expect(screen.getByRole("img", {name:"Balancing benefits and costs"})).toHaveAttribute("src",expect.stringContaining("balance.png"));
  expect(screen.getByText("initialState", { selector: "b" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Complete code workspace" })).toBeVisible();
  expect(screen.getByRole("link", { name: "useEffect" })).toHaveAttribute("href", "/dashboard/api-docs/react/useEffect");
  expect(screen.getByRole("link", { name: "Ask the mentor" })).toHaveAttribute("href", expect.stringMatching(/^\/dashboard\/mentors\?q=/));
  for (const link of document.querySelectorAll<HTMLAnchorElement>("a[href^='http']")) { expect(link.href).toMatch(/^https:\/\//); expect(link.rel).toContain("noopener"); }
});

test("unknown API deep links recover and catalog-only entries are prepared in the app", async () => {
  mockSearchParams = new URLSearchParams("package=react&api=does-not-exist");
  const { unmount } = render(<ApiDocs/>);
  expect(screen.getByRole("heading", { name: "API entry not found" })).toBeVisible();
  unmount();
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ source: "ai", detail: { packageName: "react", description: "Cache a function definition between re-renders.", since: "", signature: "useCallback(fn, dependencies)", parameters: [{ name: "fn", type: "Function", description: "The function to cache." }], returns: "The cached function.", notes: ["Pair with memoised children."], useCases: ["Stable callbacks"], descriptionLong: "", code: "const onSave = useCallback(save, [id]);", related: ["useMemo"] } }) }) as jest.Mock;
  mockSearchParams = new URLSearchParams("package=react&api=useCallback");
  render(<ApiDocs/>);
  expect(await screen.findByText("Cache a function definition between re-renders.", {selector:"p"})).toBeVisible();
  expect(global.fetch).toHaveBeenCalledWith("/api/pro-learn/api-detail", expect.objectContaining({ method: "POST", body: JSON.stringify({ packageId: "react", name: "useCallback" }) }));
  expect(screen.getByRole("link", { name: "useMemo" })).toHaveAttribute("href", "/dashboard/api-docs/react/useMemo");
  await waitFor(() => expect(localStorage.getItem("masterclass:api-detail:v2")).toContain("useCallback"));
  for (const link of document.querySelectorAll<HTMLAnchorElement>("a[href^='http']")) { expect(link.href).toMatch(/^https:\/\//); expect(link.rel).toContain("noopener"); }
});

test("a failed in-app reference offers a retry", async () => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }) as jest.Mock;
  mockSearchParams = new URLSearchParams("package=react&api=useCallback");
  render(<ApiDocs/>);
  expect(await screen.findByRole("alert")).toHaveTextContent("could not be prepared");
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.filter(([url]) => url === "/api/pro-learn/api-detail")).toHaveLength(2));
});

test('usePathname loads complete learning content without contacting the AI service',()=>{
  global.fetch=jest.fn();
  mockSearchParams=new URLSearchParams('package=nextjs&api=usePathname');
  render(<ApiDocs/>);
  expect(screen.getByRole('heading',{level:1})).toHaveTextContent('usePathname');
  expect(screen.getByRole('heading',{name:'Complete code workspace'})).toBeVisible();
  expect(screen.getByRole('heading',{name:'Corporate English vocabulary'})).toBeVisible();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test.each([
  [401,'signin_required','Your session has expired'],
  [429,'ai_rate_limited','Wait a minute'],
  [503,'ai_provider_unavailable','provider credentials'],
  [504,'reference_timeout','took too long'],
])('reference failure %s gives an actionable message',async(status,error,message)=>{
  localStorage.clear();
  global.fetch=jest.fn().mockResolvedValue({ok:false,status,json:async()=>({error})});
  mockSearchParams=new URLSearchParams('package=react&api=useCallback');
  render(<ApiDocs/>);
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  if(status===401)expect(screen.getByRole('link',{name:'Sign in again'})).toHaveAttribute('href','/sign-in');
});

test("an identifier with no authored page renders the catalog summary instead of only an error", async () => {
  localStorage.clear();
  const pkg = API_PACKAGES.find(item => item.id === "react")!;
  const entry = pkg.entries.find(item => item.name === "useDeferredValue")!;
  const detail = enrichApiLearning(pkg, entry, catalogApiDetail(pkg, entry));
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ source: "library", reason: "ai_unavailable", detail }) }) as jest.Mock;
  mockSearchParams = new URLSearchParams("package=react&api=useDeferredValue");
  render(<ApiDocs/>);
  // KeyText chips split the sentence across elements, so read the lead itself.
  await waitFor(() => expect(document.querySelector(`.${styles.lead}`)).not.toBeNull());
  const lead = document.querySelector(`.${styles.lead}`)!;
  expect(lead.textContent).toContain("useDeferredValue is a hook in");
  expect(lead).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByText(/Showing the in-app catalog summary/)).toHaveTextContent("Reference generation is not configured");
  expect(screen.getByRole("heading", { name: "Key features" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Real use cases" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Corporate English vocabulary" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Interview questions & answers" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Prepare full learning page" })).toBeVisible();
  // A catalog summary is never cached as generated content.
  expect(localStorage.getItem("masterclass:api-detail:v2")).toBeNull();
});

test("an authored Hook renders every reference section: short definition, syntax, example, key features, colour-highlighted use cases", async () => {
  localStorage.clear();
  const pkg = API_PACKAGES.find(item => item.id === "react")!;
  const entry = pkg.entries.find(item => item.name === "useDeferredValue")!;
  const detail = enrichApiLearning(pkg, entry, catalogReference(pkg, entry));
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ source: "library", detail }) }) as jest.Mock;
  mockSearchParams = new URLSearchParams("package=react&api=useDeferredValue");
  render(<ApiDocs/>);

  // Every section the page promises is present and carries content.
  for (const name of ["Definition", "Syntax", "Example", "Key features", "Real use cases", "Complete code workspace"]) {
    expect(await screen.findByRole("heading", { name })).toBeVisible();
  }
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  // A short definition leads; it is not the catalog placeholder.
  // Abbreviation expansion adds the long form inline, so compare on words.
  const definition = document.querySelector(`.${styles.lead}`)!;
  expect(definition.textContent).toContain("Let a less urgent part of the UI");
  expect(definition.textContent).toContain("temporarily use an older value");
  expect(definition.textContent).not.toContain("is a hook in React 19+");

  // Syntax shows the real import and call; Example shows the runnable fragment.
  const code = [...document.querySelectorAll("pre")].map(node => node.textContent).join("\n");
  expect(code).toContain("import { useDeferredValue } from 'react'");
  expect(code).toContain("'use client'");

  // Key features and use cases are lists, with code-shaped terms given a colour chip.
  const features = document.querySelector('ol[data-tone="violet"]')!;
  const useCases = document.querySelector('ol[data-tone="sage"]')!;
  expect(features.querySelectorAll("li").length).toBeGreaterThanOrEqual(4);
  expect(useCases.querySelectorAll("li").length).toBeGreaterThanOrEqual(3);
  expect(features.querySelectorAll("code").length + useCases.querySelectorAll("code").length).toBeGreaterThan(0);

  // Learning sections below the reference.
  expect(screen.getByRole("heading", { name: "Corporate English vocabulary" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Interview questions & answers" })).toBeVisible();
  // Still no outbound links in generated study content.
  for (const link of document.querySelectorAll<HTMLAnchorElement>("a[href^='http']")) { expect(link.href).toMatch(/^https:\/\//); expect(link.rel).toContain("noopener"); }
});
