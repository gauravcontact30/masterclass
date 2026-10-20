import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { AdminPagePicker, pageScore } from "@/components/super-admin-page-picker";
import { DASHBOARD_PAGES, surfacePages } from "@/lib/learning-uploads";

describe("Learning Dashboard page list", () => {
  it("offers every page the sidebar links to", () => {
    const sidebar = readFileSync("components/workspace.tsx", "utf8");
    const linked = [...sidebar.matchAll(/href="\/dashboard\/([a-z-]+)"/g)].map(m => m[1]).filter(p => p !== "super-admin");
    const values = DASHBOARD_PAGES.map(p => p.value);
    for (const page of [...linked, "dashboard", "library", "official-docs", "techy", "api-docs", "workflow", "lessons", "quiz", "interview"]) expect(values).toContain(page);
    expect(values).toContain("coffee-and-code");
    expect(new Set(values).size).toBe(values.length);
  });

  it("ranks label starts above contains above typo-tolerant matches", () => {
    const coffee = DASHBOARD_PAGES.find(p => p.value === "coffee-and-code")!;
    expect(pageScore(coffee, "coff")).toBeGreaterThan(pageScore(coffee, "code"));
    expect(pageScore(coffee, "blog")).toBeGreaterThan(0);
    expect(pageScore(coffee, "cfc")).toBeGreaterThan(0);
    expect(pageScore(coffee, "zzz")).toBe(0);
  });
});

describe("AdminPagePicker", () => {
  const options = surfacePages("dashboard", [{ slug: "deep-dives", title: "Deep dives" }]);

  it("searches, filters by group, clears and picks with the keyboard", () => {
    const onChange = jest.fn();
    render(<AdminPagePicker value="dashboard" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Page: Dashboard \(home\)/ }));
    const search = screen.getByRole("combobox", { name: "Search pages" });

    fireEvent.change(search, { target: { value: "coffee" } });
    expect(within(screen.getByRole("listbox")).getAllByRole("option")[0]).toHaveTextContent("Coffee & Code");

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(search).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: /Professional Learn/ }));
    const professional = within(screen.getByRole("listbox")).getAllByRole("option").map(o => o.textContent);
    expect(professional.some(t => t?.includes("Techy"))).toBe(true);
    expect(professional.some(t => t?.includes("Vocabulary"))).toBe(false);

    fireEvent.change(search, { target: { value: "vocab" } });
    expect(screen.getByRole("status")).toHaveTextContent("No page matches");
    fireEvent.click(screen.getByRole("button", { name: "Search every group" }));
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("vocabulary");
  });

  it("lists the owner's own pages under Your pages", () => {
    render(<AdminPagePicker value="dashboard" options={options} onChange={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: /Page:/ }));
    fireEvent.click(screen.getByRole("button", { name: /Your pages/ }));
    expect(within(screen.getByRole("listbox")).getByRole("option")).toHaveTextContent("Deep dives (your page)");
  });
});
