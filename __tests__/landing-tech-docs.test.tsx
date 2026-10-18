import { fireEvent, render, screen, within } from "@testing-library/react";
import { LandingTechDocs } from "@/components/landing-tech-docs";
import { TECH_DOCS } from "@/lib/tech-docs";
import { TECH_CONCEPTS } from "@/lib/tech-docs-concepts";

const pageButton = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}`) });

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
    expect(screen.getByRole("link", { name: /See all 8 docs & topics/ })).toHaveAttribute("href", "/dashboard#tech-docs");
  });

  test("the dashboard shows every concept, each with its key points", () => {
    render(<LandingTechDocs concepts={TECH_CONCEPTS} />);
    fireEvent.click(pageButton("OOPs"));
    const slide = screen.getByRole("article", { name: /OOPs/ });
    expect(slide.querySelectorAll("details")).toHaveLength(TECH_CONCEPTS.oops.length);
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

test("each subject's topic count matches its concept notes", () => {
  for (const id of ["dsa", "oops"]) expect(TECH_DOCS.find(t => t.id === id)!.version).toBe(`${TECH_CONCEPTS[id].length} topics`);
});
