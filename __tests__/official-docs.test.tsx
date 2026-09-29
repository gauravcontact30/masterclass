import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfficialDocs } from "@/components/official-docs";
import { OFFICIAL_DOCS, OFFICIAL_DOCS_CATEGORIES } from "@/lib/official-docs-data";

describe("Official Documentation Hub", () => {
  beforeAll(() => {
    window.scrollTo = jest.fn();
  });

  test("contains learning specifications for the expanded technology catalog", () => {
    expect(OFFICIAL_DOCS.length).toBe(56);

    const ids = OFFICIAL_DOCS.map((doc) => doc.id);
    expect(new Set(ids).size).toBe(OFFICIAL_DOCS.length);

    const expectedTechnologies = [
      "nextjs",
      "react",
      "tailwind",
      "zustand",
      "redux",
      "rtk",
      "tanstack",
      "graphql",
      "drizzle",
      "prisma",
      "postgresql",
      "supabase",
      "playwright",
      "vitest",
      "typescript",
      "javascript-features",
      "javascript-info",
      "python",
      "fastapi",
      "golang",
      "rust",
      "nodejs",
      "nestjs",
      "mongoose",
      "langchain",
      "langgraph",
      "langsmith",
      "docker",
      "kubernetes",
      "aws",
      "devops",
      "git",
      "cicd",
      "jest", "react-testing-library", "javascript-puzzles", "uv", "agentic-ai", "cypress",
      "inngest", "arcjet", "redis", "webhook", "upstash", "clerk", "zod", "tanstack-start",
      "tanstack-form", "react-hooks", "nextjs-hooks", "conform", "authjs", "kinde", "neon", "t3-stack", "system-design",
    ];

    for (const expectedId of expectedTechnologies) {
      expect(ids).toContain(expectedId);
    }

    for (const doc of OFFICIAL_DOCS) {
      expect(doc.title).toBeTruthy();
      expect(doc.officialUrl).toMatch(/^https?:\/\//);
      expect(doc.overview.en.length).toBeGreaterThan(30);
      expect(doc.overview.hi.length).toBeGreaterThan(20);
      expect(doc.keyPoints.length).toBeGreaterThanOrEqual(2);
      expect(doc.keyFeatures.length).toBeGreaterThanOrEqual(3);
      expect(doc.architecturePoints.length).toBeGreaterThanOrEqual(2);
      expect(doc.codeExample.code.length).toBeGreaterThan(50);
      expect(doc.bestPractices.length).toBeGreaterThanOrEqual(2);
      expect(doc.commonGotchas.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("renders documentation page and filters technologies by category", async () => {
    const user = userEvent.setup();
    render(<OfficialDocs />);

    expect(screen.getByRole("heading", { name: "Official Documentation Hub" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Next.js 16+" })).toBeInTheDocument();

    // Click "State Management" category filter
    const stateMgmtBtn = within(screen.getByRole("region", { name: "Search and filter documentation" })).getByRole("tab", { name: /State Management/i });
    await user.click(stateMgmtBtn);

    expect(screen.getAllByText("Zustand").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "Redux Core" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Redux Toolkit (RTK & RTK Query)" })).toBeInTheDocument();
  });

  test("searches technologies by name and updates active doc", async () => {
    const user = userEvent.setup();
    render(<OfficialDocs />);

    const searchInput = screen.getByPlaceholderText(/Search \d+ technologies/i);
    await user.type(searchInput, "Playwright");

    expect(screen.getByRole("heading", { name: "Playwright" })).toBeInTheDocument();
    expect(screen.getAllByText(/User-First Locators/i).length).toBeGreaterThanOrEqual(1);
  });

  test("pages through technologies using pagination controls", async () => {
    const user = userEvent.setup();
    render(<OfficialDocs />);

    // Initial page shows 1–6 (Next.js is on page 1)
    expect(screen.getByRole("heading", { name: "Next.js 16+" })).toBeInTheDocument();

    // Click Next page button
    const nextBtn = screen.getByRole("button", { name: "Next page" });
    await user.click(nextBtn);

    // Page 2 should display PostgreSQL & pgvector
    expect(screen.getByRole("heading", { name: "PostgreSQL & pgvector" })).toBeInTheDocument();

    // Click Previous page button
    const prevBtn = screen.getByRole("button", { name: "Previous page" });
    await user.click(prevBtn);

    expect(screen.getByRole("heading", { name: "Next.js 16+" })).toBeInTheDocument();
  });

  test("opens modal window with concise study questions and closes it", async () => {
    const user = userEvent.setup();
    render(<OfficialDocs />);

    // Click on Explore Documentation button for Next.js 16+
    const exploreBtn = screen.getByRole("button", { name: "Explore Next.js 16+ documentation" });
    await user.click(exploreBtn);

    // Modal dialog content should now be visible
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByRole("heading", { name: "Key information" })).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByRole("heading", { name: "Objective questions" })).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByRole("heading", { name: "Subjective questions" })).toBeInTheDocument();

    // Close button in modal footer
    const closeBtn = screen.getByRole("button", { name: "Close guide" });
    await user.click(closeBtn);

    // Modal should be closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("clears search input when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<OfficialDocs />);

    const searchInput = screen.getByPlaceholderText(/Search \d+ technologies/i) as HTMLInputElement;
    await user.type(searchInput, "Vitest");
    expect(searchInput.value).toBe("Vitest");

    // Clear search button should appear
    const clearBtn = screen.getByRole("button", { name: "Clear search query" });
    expect(clearBtn).toBeInTheDocument();
    await user.click(clearBtn);

    expect(searchInput.value).toBe("");
    expect(screen.getByRole("heading", { name: "Next.js 16+" })).toBeInTheDocument();
  });

  test("toggles advanced search drawer, changes sort order, and resets filters", async () => {
    const user = userEvent.setup();
    render(<OfficialDocs />);

    // Toggle advanced filters
    const filterToggleBtn = screen.getByRole("button", { name: "Toggle advanced filters" });
    await user.click(filterToggleBtn);

    // Advanced drawer elements should be visible
    expect(screen.getByText("Advanced Filtering & Sorting")).toBeInTheDocument();
    expect(screen.getByText("Sort Order")).toBeInTheDocument();

    // Click Alphabetical (A–Z)
    const azBtn = screen.getByRole("button", { name: "Alphabetical (A–Z)" });
    await user.click(azBtn);

    // AWS Cloud Services should appear first alphabetically
    expect(screen.getByRole("heading", { name: "AWS Cloud Services" })).toBeInTheDocument();

    // Reset filters
    const resetBtn = screen.getByRole("button", { name: "Reset Filters" });
    await user.click(resetBtn);

    // Should return to verified order (Next.js 16+ first)
    expect(screen.getByRole("heading", { name: "Next.js 16+" })).toBeInTheDocument();
  });

  test("paginates categories and expands all categories", async () => {
    const user = userEvent.setup();
    render(<OfficialDocs />);

    // Next categories button
    const nextCatBtn = screen.getByRole("button", { name: "Next categories" });
    expect(nextCatBtn).toBeInTheDocument();
    await user.click(nextCatBtn);

    // Expand all categories button
    const expandBtn = screen.getByRole("button", { name: "Expand all categories" });
    await user.click(expandBtn);

    // Now all categories should be displayed
    for (const cat of OFFICIAL_DOCS_CATEGORIES) {
      expect(within(screen.getByRole("region", { name: "Search and filter documentation" })).getByRole("tab", { name: new RegExp(cat, "i") })).toBeInTheDocument();
    }
  });
});

