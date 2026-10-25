import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingTechDocs } from "@/components/landing-tech-docs";
import { TECH_DOCS } from "@/lib/tech-docs";
import { TECH_CONCEPTS } from "@/lib/tech-docs-concepts";

const pageButton = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}`) });

test("pastel category cards paginate independently and keep the selected filter", () => {
  render(<LandingTechDocs />);
  const group = screen.getByRole("group", { name: "Platform type" });
  const pager = screen.getByRole("navigation", { name: "Category filter pages" });
  expect(within(group).getAllByRole("button")).toHaveLength(3);
  expect(within(pager).getByRole("button", { name: "Previous categories" })).toBeDisabled();
  fireEvent.click(within(pager).getByRole("button", { name: "Next categories" }));
  expect(within(group).getAllByRole("button")).toHaveLength(3);
  expect(within(pager).getByRole("button", { name: "Next categories" })).toBeDisabled();
  fireEvent.click(within(group).getByRole("button", { name: /^Enterprise/ }));
  expect(screen.getByRole("article", { name: /Salesforce/ })).toBeInTheDocument();
  fireEvent.click(within(pager).getByRole("button", { name: "Category page 1" }));
  expect(pager).toHaveTextContent("Selected: Enterprise");
  expect(screen.getByRole("article", { name: /Salesforce/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
  expect(within(group).getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");
  expect(within(pager).getByRole("button", { name: "Category page 1" })).toHaveAttribute("aria-current", "page");
});

describe("Technology docs: CS fundamentals", () => {
  test("the landing preview lists a few DSA and OOPs topics and links to the rest", () => {
    render(<LandingTechDocs preview />);
    const dsa = screen.getByRole("list", { name: "DSA topics" });
    const oops = screen.getByRole("list", { name: "OOPs topics" });
    expect(within(dsa).getAllByRole("listitem")).toHaveLength(7);   // six topics and "+N more"
    expect(dsa).toHaveTextContent(`+${TECH_DOCS.find(t => t.id === "dsa")!.features.length - 6} more`);
    expect(oops).toHaveTextContent("Encapsulation");
    // The detailed notes stay on the dashboard.
    expect(screen.queryByText("Concepts")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(`See all ${TECH_DOCS.length} docs & topics`) })).toHaveAttribute("href", "/learning");
  });

  test("the dashboard shows every concept, each with its key points", () => {
    render(<LandingTechDocs concepts={TECH_CONCEPTS} />);
    fireEvent.click(screen.getByRole("button", { name: "Next technology tabs" }));
    fireEvent.click(pageButton("OOPs"));
    const slide = screen.getByRole("article", { name: /OOPs/ });
    expect(slide.querySelectorAll("details summary strong")).toHaveLength(TECH_CONCEPTS.oops.length);
    for (const title of ["Encapsulation and access modifiers", "Method overriding and dynamic dispatch", "SOLID principles", "Design patterns: creational, structural, behavioural"])
      expect(within(slide).getByText(title)).toBeInTheDocument();
    expect(within(slide).getByText(/S: Single Responsibility/)).toBeInTheDocument();
  });

  test("search narrows the concept notes", () => {
    render(<LandingTechDocs concepts={TECH_CONCEPTS} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "dijkstra" } });
    const slide = screen.getByRole("article", { name: /DSA/ });
    // The shortest-paths note, and the heaps note that mentions Dijkstra; nothing else.
    expect([...slide.querySelectorAll("details strong")].map(s => s.textContent)).toEqual(["Heaps and priority queues", "Shortest paths: Dijkstra, Bellman–Ford, Floyd–Warshall"]);
  });

  test("every concept has a unique id and at least three key points", () => {
    const all = Object.values(TECH_CONCEPTS).flat();
    expect(new Set(all.map(c => c.id)).size).toBe(all.length);
    for (const c of all) expect(c.points.length).toBeGreaterThanOrEqual(3);
  });
});

test("technology tabs paginate six at a time and follow platform navigation and filters", () => {
  render(<LandingTechDocs concepts={TECH_CONCEPTS} />);
  const nav = screen.getByRole("navigation", { name: "Technology docs pages" });
  const tabs = () => within(nav).getAllByRole("listitem");
  expect(tabs()).toHaveLength(6);
  expect(within(nav).getByRole("button", { name: "Previous technology tabs" })).toBeDisabled();
  fireEvent.click(within(nav).getByRole("button", { name: "Next technology tabs" }));
  expect(tabs()).toHaveLength(Math.min(6, TECH_DOCS.length - 6));
  expect(tabs()[0]).toHaveTextContent(TECH_DOCS[6].name);
  // Paging the tab list keeps the open document and its height unchanged.
  expect(screen.getByRole("article", { name: new RegExp(TECH_DOCS[0].name) })).toBeInTheDocument();
  expect(within(nav).getByRole("button", { name: "Next technology tabs" })).toBeDisabled();
  fireEvent.click(within(nav).getByRole("button", { name: "Technology tabs page 1" }));
  expect(tabs()).toHaveLength(6);
  fireEvent.click(within(nav).getByRole("button", { name: "Next technology tabs" }));
  fireEvent.click(within(nav).getByRole("button", { name: new RegExp(`^${TECH_DOCS[6].name}`) }));
  expect(screen.getByRole("article", { name: new RegExp(TECH_DOCS[6].name) })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Previous platform" }));
  expect(tabs()).toHaveLength(6);
  expect(within(nav).getByRole("button", { name: "Previous technology tabs" })).toBeDisabled();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "dijkstra" } });
  expect(tabs().length).toBeLessThanOrEqual(6);
  expect(within(nav).queryByRole("button", { name: "Next technology tabs" })).not.toBeInTheDocument();
});

test("each subject's topic count matches its concept notes", () => {
  for (const id of ["dsa", "oops"]) expect(TECH_DOCS.find(t => t.id === id)!.version).toBe(`${TECH_CONCEPTS[id].length} topics`);
});
