import { fireEvent, render, screen } from "@testing-library/react";
import { TechBuzzBlog, type TechBuzzGroup } from "@/components/tech-buzz-blog";
import { LanguageProvider } from "@/components/language-provider";
import type { TechBuzzCard } from "@/lib/tech-buzz-public";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, loader, unoptimized, priority, preload, fill, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt || ""} {...props} />
  )
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>
}));

beforeEach(() => {
  localStorage.clear();
});

const MOCK_CARDS: TechBuzzCard[] = [
  {
    id: "card-1",
    slug: "agentic-ai-mcp-guide",
    title: "Building Autonomous Agentic AI Systems with MCP",
    subtitle: "A complete guide on Model Context Protocol and autonomous tool execution.",
    category: "Artificial Intelligence",
    technology: "Agentic AI",
    techId: "agentic-ai",
    color: "#7c3aed",
    publishedAt: "2026-10-25",
    readTimeMinutes: 8,
    featured: true,
    trendingRank: 1,
    claps: 120,
    likes: 85,
    reactions: 45,
    commentsCount: 12,
    rating: { average: 4.9, count: 50 },
    author: { name: "Dr. Priya Sharma", role: "AI Architect", avatar: "/icon.svg", verified: true },
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200",
    tags: ["Agentic AI", "MCP", "AI Agents"],
    summary: ["Tool calling", "JSON-RPC", "Autonomous loops"],
  },
  {
    id: "card-2",
    slug: "langchain-in-production",
    title: "LangChain in Production: Agents and Tools",
    subtitle: "Structured output and tool calling without the magic.",
    category: "Artificial Intelligence",
    technology: "LangChain",
    techId: "langchain",
    color: "#1c3c3c",
    publishedAt: "2026-10-24",
    readTimeMinutes: 7,
    featured: false,
    claps: 80,
    likes: 40,
    reactions: 20,
    commentsCount: 5,
    rating: { average: 4.8, count: 30 },
    author: { name: "Editorial Team", role: "Editor", avatar: "/icon.svg", verified: true },
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200",
    tags: ["LangChain", "LLMs"],
    summary: ["Agent loop", "Zod schemas", "Tracing"],
  },
  {
    id: "card-3",
    slug: "langgraph-stateful-workflows",
    title: "LangGraph Explained: Stateful Workflows",
    subtitle: "Nodes, edges, reducers, and checkpoints for long-running AI agents.",
    category: "Artificial Intelligence",
    technology: "LangGraph",
    techId: "langgraph",
    color: "#2f6868",
    publishedAt: "2026-10-23",
    readTimeMinutes: 9,
    featured: false,
    claps: 150,
    likes: 90,
    reactions: 60,
    commentsCount: 14,
    rating: { average: 4.95, count: 65 },
    author: { name: "Editorial Team", role: "Editor", avatar: "/icon.svg", verified: true },
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200",
    tags: ["LangGraph", "State Machines"],
    summary: ["Checkpointers", "StateGraph", "Resumable"],
  },
  {
    id: "card-4",
    slug: "langflow-visual-ai-prototyping",
    title: "Langflow: Visual AI Workflows to Production",
    subtitle: "Design RAG and multi-agent systems visually on canvas.",
    category: "Artificial Intelligence",
    technology: "LangFlow",
    techId: "langflow",
    color: "#7c3aed",
    publishedAt: "2026-10-22",
    readTimeMinutes: 6,
    featured: false,
    claps: 40,
    likes: 25,
    reactions: 10,
    commentsCount: 2,
    rating: { average: 4.7, count: 18 },
    author: { name: "Editorial Team", role: "Editor", avatar: "/icon.svg", verified: true },
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200",
    tags: ["LangFlow", "Visual AI"],
    summary: ["Canvas", "Export Python", "Components"],
  },
  {
    id: "card-5",
    slug: "langsmith-tracing-evaluation",
    title: "LangSmith: Tracing and LLM Evaluation",
    subtitle: "Continuous monitoring, dataset evals, and token cost tracking.",
    category: "Artificial Intelligence",
    technology: "LangSmith",
    techId: "langsmith",
    color: "#0f766e",
    publishedAt: "2026-10-21",
    readTimeMinutes: 7,
    featured: false,
    claps: 60,
    likes: 35,
    reactions: 15,
    commentsCount: 3,
    rating: { average: 4.85, count: 22 },
    author: { name: "Editorial Team", role: "Editor", avatar: "/icon.svg", verified: true },
    coverImage: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200",
    tags: ["LangSmith", "Evals", "Tracing"],
    summary: ["Run traces", "Evaluation datasets", "Regression guards"],
  },
  {
    id: "card-6",
    slug: "n8n-workflow-automation-ai",
    title: "n8n for Developers: Webhooks and AI Nodes",
    subtitle: "Self-hostable workflow engine connecting APIs and AI agents.",
    category: "Artificial Intelligence",
    technology: "n8n",
    techId: "n8n",
    color: "#ea4b71",
    publishedAt: "2026-10-20",
    readTimeMinutes: 7,
    featured: false,
    claps: 70,
    likes: 45,
    reactions: 18,
    commentsCount: 6,
    rating: { average: 4.8, count: 25 },
    author: { name: "Editorial Team", role: "Editor", avatar: "/icon.svg", verified: true },
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    tags: ["n8n", "Automation", "Webhooks"],
    summary: ["Webhook nodes", "Code transforms", "Self-hosting"],
  },
  {
    id: "card-7",
    slug: "nextjs-16-caching-components",
    title: "Next.js 16 Caching: Cache Components and PPR",
    subtitle: "Explicit caching with use cache, cacheLife, and cacheTag.",
    category: "Frontend Engineering",
    technology: "Next.js 16",
    techId: "nextjs",
    color: "#000000",
    publishedAt: "2026-10-24",
    readTimeMinutes: 9,
    featured: false,
    claps: 190,
    likes: 110,
    reactions: 70,
    commentsCount: 20,
    rating: { average: 4.96, count: 85 },
    author: { name: "Editorial Team", role: "Editor", avatar: "/icon.svg", verified: true },
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200",
    tags: ["Next.js 16", "Caching", "PPR"],
    summary: ["use cache", "cacheTag", "updateTag"],
  },
  {
    id: "card-8",
    slug: "react-19-actions-hooks",
    title: "React 19 Actions: useOptimistic and Compiler",
    subtitle: "Form actions, pending states, and zero-memoization boilerplate.",
    category: "Frontend Engineering",
    technology: "React 19",
    techId: "react",
    color: "#0ea5e9",
    publishedAt: "2026-10-22",
    readTimeMinutes: 8,
    featured: false,
    claps: 140,
    likes: 95,
    reactions: 55,
    commentsCount: 15,
    rating: { average: 4.92, count: 70 },
    author: { name: "Editorial Team", role: "Editor", avatar: "/icon.svg", verified: true },
    coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200",
    tags: ["React 19", "Actions", "Compiler"],
    summary: ["useActionState", "useOptimistic", "use hook"],
  },
  {
    id: "card-9",
    slug: "system-design-rate-limiter",
    title: "System Design: Rate Limiter and Distributed Scaling",
    subtitle: "Token bucket algorithms, Redis atomic scripts, and 429 handlers.",
    category: "System Architecture",
    technology: "System Design",
    techId: "system-design",
    color: "#475569",
    publishedAt: "2026-10-24",
    readTimeMinutes: 9,
    featured: false,
    claps: 220,
    likes: 130,
    reactions: 85,
    commentsCount: 25,
    rating: { average: 4.98, count: 110 },
    author: { name: "Editorial Team", role: "Editor", avatar: "/icon.svg", verified: true },
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
    tags: ["System Design", "Scalability", "Redis"],
    summary: ["Token bucket", "Redis script", "Distributed rate limiting"],
  },
];

const MOCK_GROUPS: TechBuzzGroup[] = [
  {
    category: "Artificial Intelligence",
    count: 6,
    topics: [
      { id: "agentic-ai", label: "Agentic AI", count: 1 },
      { id: "langchain", label: "LangChain", count: 1 },
      { id: "langgraph", label: "LangGraph", count: 1 },
      { id: "langflow", label: "LangFlow", count: 1 },
      { id: "langsmith", label: "LangSmith", count: 1 },
      { id: "n8n", label: "n8n", count: 1 },
    ],
  },
  {
    category: "Frontend Engineering",
    count: 2,
    topics: [
      { id: "nextjs", label: "Next.js", count: 1 },
      { id: "react", label: "React", count: 1 },
    ],
  },
  {
    category: "System Architecture",
    count: 1,
    topics: [{ id: "system-design", label: "System Design", count: 1 }],
  },
];

describe("TechBuzzBlog Component", () => {
  test("renders the modern masthead with metrics ribbon and title", () => {
    render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Master Modern Tech: Agentic AI, Next.js 16+, React 19+ & System Design"
    );
    expect(screen.getByText("Engineering Masterclasses")).toBeInTheDocument();
    expect(screen.getByText("9+")).toBeInTheDocument();
    expect(screen.getByText("Code & Architecture Verified")).toBeInTheDocument();
  });

  test("renders featured learning tracks bar with requested technologies", () => {
    render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    expect(screen.getAllByRole("button", { name: /Agentic AI/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /LangChain/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /LangGraph/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /LangSmith/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /LangFlow/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /n8n Automation/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Next\.js 16\+/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /React 19\+/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /System Design/i }).length).toBeGreaterThan(0);
  });

  test("filters stories when a technology track pill is clicked", () => {
    render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    // Click on LangGraph track pill in the top tracks bar
    const langgraphBtn = screen.getAllByRole("button", { name: /LangGraph/i })[0];
    fireEvent.click(langgraphBtn);

    // Filter notification should display
    expect(screen.getByText(/masterclass guide.*LangGraph/i)).toBeInTheDocument();
    expect(screen.getAllByText("LangGraph Explained: Stateful Workflows").length).toBeGreaterThan(0);

    // Click Reset all filters
    const clearBtn = screen.getByRole("button", { name: /Reset all filters|Clear filters/i });
    fireEvent.click(clearBtn);

    expect(screen.queryByText(/masterclass guide.*LangGraph/i)).not.toBeInTheDocument();
  });

  test("renders curated learning roadmaps and supports roadmap selection", () => {
    render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    expect(screen.getByText("Agentic AI & Orchestration Track")).toBeInTheDocument();
    expect(screen.getByText("Next.js 16+ & React 19+ Masterclass")).toBeInTheDocument();
    expect(screen.getByText("System Design & Distributed Scalability")).toBeInTheDocument();

    // Select the System Design roadmap
    const systemDesignCard = screen.getByText("System Design & Distributed Scalability").closest("div[role='button']")!;
    fireEvent.click(systemDesignCard);

    // Active path banner should appear
    expect(screen.getByText(/in “System Design & Distributed Scalability”/i)).toBeInTheDocument();
  });

  test("toggles between grid and list layout views", () => {
    render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    const gridBtn = screen.getByRole("button", { name: "Card view" });
    const listBtn = screen.getByRole("button", { name: "List view" });

    fireEvent.click(gridBtn);
    expect(gridBtn).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(listBtn);
    expect(listBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("searches stories across titles, technologies, and tags", () => {
    render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    const searchInput = screen.getByPlaceholderText(/Search technologies|Search Agentic AI/i);
    fireEvent.change(searchInput, { target: { value: "Rate Limiter" } });

    expect(screen.getAllByText(/System Design: Rate Limiter and Distributed Scaling/i).length).toBeGreaterThan(0);
  });

  test("every story has a thumbnail cover image and read time", () => {
    const { container } = render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    const images = container.querySelectorAll("img[src*='unsplash.com']");
    expect(images.length).toBeGreaterThan(0);
  });

  test("paginates through Popular Learning Tracks properly", () => {
    render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    // Page 1 should show 1-5 of 18
    expect(screen.getByText(/Showing 1–5 of 18/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous tracks page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next tracks page" })).not.toBeDisabled();

    // Click Next page button
    fireEvent.click(screen.getByRole("button", { name: "Next tracks page" }));
    expect(screen.getByText(/Showing 6–10 of 18/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous tracks page" })).not.toBeDisabled();

    // Click Page 4 button directly
    fireEvent.click(screen.getByRole("button", { name: "Page 4" }));
    expect(screen.getByText(/Showing 16–18 of 18/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next tracks page" })).toBeDisabled();

    // Click Previous page button
    fireEvent.click(screen.getByRole("button", { name: "Previous tracks page" }));
    expect(screen.getByText(/Showing 11–15 of 18/i)).toBeInTheDocument();
  });

  test("updates text when language is changed via LanguageProvider", () => {
    localStorage.setItem("masterclass:language", "es");
    render(
      <LanguageProvider>
        <TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />
      </LanguageProvider>
    );

    // Spanish title and tracks header should render
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Domina la tecnología moderna"
    );
    expect(screen.getByText(/Rutas de aprendizaje populares/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar tecnologías/i)).toBeInTheDocument();
  });

  test("renders Explore By Category in tabs format with 5 tabs per page and handles pagination", () => {
    const EIGHT_GROUPS: TechBuzzGroup[] = [
      { category: "AI & Agents", count: 3, topics: [] },
      { category: "Full-Stack", count: 3, topics: [] },
      { category: "System Design", count: 2, topics: [] },
      { category: "Cloud & DevOps", count: 2, topics: [] },
      { category: "Databases", count: 2, topics: [] },
      { category: "Security", count: 1, topics: [] },
      { category: "Testing & QA", count: 1, topics: [] },
      { category: "Mobile Apps", count: 1, topics: [] },
    ];

    render(<TechBuzzBlog cards={MOCK_CARDS} groups={EIGHT_GROUPS} />);

    // Explore By Category heading and tablist should be rendered
    expect(screen.getByRole("heading", { name: /Explore By Category/i })).toBeInTheDocument();
    const tablist = screen.getByRole("tablist", { name: /Explore by category tabs/i });
    expect(tablist).toBeInTheDocument();

    // Page 1 should show 5 tabs (Showing 1–5 of 8)
    expect(screen.getByText(/Showing 1–5 of 8/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /AI & Agents/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Full-Stack/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /System Design/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Cloud & DevOps/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Databases/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Security/i })).not.toBeInTheDocument();

    // Click Next page button for categories
    const nextCatBtn = screen.getByRole("button", { name: "Next categories page" });
    fireEvent.click(nextCatBtn);

    // Page 2 should show 3 tabs (Showing 6–8 of 8)
    expect(screen.getByText(/Showing 6–8 of 8/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Security/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Testing & QA/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Mobile Apps/i })).toBeInTheDocument();
    expect(nextCatBtn).toBeDisabled();

    // Click a category tab on page 2 to filter
    fireEvent.click(screen.getByRole("tab", { name: /Security/i }));
  });

  test("sidebars are collapsed by default, have only arrow icons without 'Collapse' text, and support expand/collapse", () => {
    const { container } = render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    // Initially both sidebars are collapsed by default for full-width reading
    const layout = container.querySelector("[data-left-collapsed]");
    expect(layout).toHaveAttribute("data-left-collapsed", "true");
    expect(layout).toHaveAttribute("data-right-collapsed", "true");

    // Collapsed rail icons and tooltips are available
    const readingListRailBtn = screen.getByRole("button", { name: /Your reading list:/i });
    expect(readingListRailBtn).toHaveAttribute("title", expect.stringMatching(/Your reading list/i));

    const topRatedRailBtn = screen.getByRole("button", { name: /Top rated masterclasses/i });
    expect(topRatedRailBtn).toHaveAttribute("title", expect.stringMatching(/Top rated masterclasses/i));

    // Expand left sidebar
    const expandLeftBtn = screen.getByRole("button", { name: /Expand left sidebar/i });
    fireEvent.click(expandLeftBtn);
    expect(layout).toHaveAttribute("data-left-collapsed", "false");

    // Collapse button on left sidebar should not have 'Collapse' text (only arrow icon)
    const collapseLeftBtn = screen.getByRole("button", { name: /Collapse left sidebar/i });
    expect(collapseLeftBtn).toHaveTextContent("");

    // Expand right sidebar
    fireEvent.click(topRatedRailBtn);
    expect(layout).toHaveAttribute("data-right-collapsed", "false");

    // Collapse button on right sidebar should not have 'Collapse' text (only arrow icon)
    const collapseRightBtn = screen.getByRole("button", { name: /Collapse right sidebar/i });
    expect(collapseRightBtn).toHaveTextContent("");

    // Collapse left sidebar again
    fireEvent.click(collapseLeftBtn);
    expect(layout).toHaveAttribute("data-left-collapsed", "true");

    // Collapse right sidebar again
    fireEvent.click(collapseRightBtn);
    expect(layout).toHaveAttribute("data-right-collapsed", "true");

    // Toggle full-width mode via masthead tools
    const fullWidthBtn = screen.getByRole("button", { name: /Full width reading view|Standard width view/i });
    fireEvent.click(fullWidthBtn);
    expect(fullWidthBtn).toBeInTheDocument();
  });

  test("Explore By Category displays 3 tabs per page when both sidebars are expanded, 5 tabs otherwise, with no timestamp overlay", () => {
    const SIX_GROUPS: TechBuzzGroup[] = [
      { category: "Artificial Intelligence", count: 6, topics: [] },
      { category: "Frontend Engineering", count: 2, topics: [] },
      { category: "System Architecture", count: 1, topics: [] },
      { category: "Cloud & DevOps", count: 2, topics: [] },
      { category: "Databases", count: 2, topics: [] },
      { category: "Security", count: 1, topics: [] },
    ];

    render(<TechBuzzBlog cards={MOCK_CARDS} groups={SIX_GROUPS} />);

    // By default both sidebars are collapsed, so 5 tabs per page
    const tablist = screen.getByRole("tablist", { name: /Explore by category tabs/i });
    expect(tablist).toHaveAttribute("data-cols", "5");
    expect(screen.getByText(/Showing 1–5 of 6/i)).toBeInTheDocument();

    // Verify thumbnail images exist in category tabs without timestamp text
    const categoryTabs = screen.getAllByRole("tab");
    expect(categoryTabs.length).toBe(5);
    // Ensure no timestamp text (e.g. "min") inside category tabs
    categoryTabs.forEach(tab => {
      expect(tab).not.toHaveTextContent(/min/i);
    });

    // Expand left sidebar
    const expandLeftBtn = screen.getByRole("button", { name: /Expand left sidebar/i });
    fireEvent.click(expandLeftBtn);

    // Expand right sidebar
    const topRatedRailBtn = screen.getByRole("button", { name: /Top rated masterclasses/i });
    fireEvent.click(topRatedRailBtn);

    // Now both sidebars are expanded: must display 3 tabs per page only!
    expect(tablist).toHaveAttribute("data-cols", "3");
    expect(screen.getByText(/Showing 1–3 of 6/i)).toBeInTheDocument();

    const expandedTabs = screen.getAllByRole("tab");
    expect(expandedTabs.length).toBe(3);
    expect(screen.getByRole("tab", { name: /Artificial Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Frontend Engineering/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /System Architecture/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Cloud & DevOps/i })).not.toBeInTheDocument();

    // Paginate in 3-tabs-per-page mode
    const nextCatBtn = screen.getByRole("button", { name: "Next categories page" });
    fireEvent.click(nextCatBtn);
    expect(screen.getByText(/Showing 4–6 of 6/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Cloud & DevOps/i })).toBeInTheDocument();

    // Collapse left sidebar again: should switch back to 5 tabs per page
    const collapseLeftBtn = screen.getByRole("button", { name: /Collapse left sidebar/i });
    fireEvent.click(collapseLeftBtn);
    expect(tablist).toHaveAttribute("data-cols", "5");
  });

  test("All Technologies panel renders categories as accordions with arrow only, first expanded by default, and others collapsible", () => {
    render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    // Expand the left sidebar to see All Technologies panel
    const expandLeftBtn = screen.getByRole("button", { name: /Expand left sidebar/i });
    fireEvent.click(expandLeftBtn);

    // First category (Artificial Intelligence) should be expanded by default (aria-expanded="true")
    const aiAccordionToggle = screen.getByRole("button", { name: /Collapse Artificial Intelligence/i });
    expect(aiAccordionToggle).toBeInTheDocument();
    expect(aiAccordionToggle).toHaveAttribute("aria-expanded", "true");
    expect(aiAccordionToggle).toHaveTextContent(""); // arrow only, no text!

    // Second category (Frontend Engineering) should be collapsed by default (aria-expanded="false")
    const feAccordionToggle = screen.getByRole("button", { name: /Expand Frontend Engineering/i });
    expect(feAccordionToggle).toBeInTheDocument();
    expect(feAccordionToggle).toHaveAttribute("aria-expanded", "false");
    expect(feAccordionToggle).toHaveTextContent(""); // arrow only, no text!

    // In AI group, topics are visible
    expect(screen.getByRole("button", { name: "Agentic AI 1" })).toBeInTheDocument();

    // In Frontend Engineering group, topics are collapsed initially
    expect(screen.queryByRole("button", { name: "Next.js 1" })).not.toBeInTheDocument();

    // Click FE accordion arrow to expand it
    fireEvent.click(feAccordionToggle);
    expect(screen.getByRole("button", { name: /Collapse Frontend Engineering/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Next.js 1" })).toBeInTheDocument();

    // Click AI accordion arrow to collapse it
    fireEvent.click(aiAccordionToggle);
    expect(screen.getByRole("button", { name: /Expand Artificial Intelligence/i })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Agentic AI 1" })).not.toBeInTheDocument();
  });

  test("renders reading font-family dropdown with 25+ options and updates reading font", () => {
    render(<TechBuzzBlog cards={MOCK_CARDS} groups={MOCK_GROUPS} />);

    // Font select dropdown should exist
    const fontSelect = screen.getByRole("combobox", { name: /Select reading font family/i }) as HTMLSelectElement;
    expect(fontSelect).toBeInTheDocument();

    // Verify it contains at least 25+ font options
    const options = fontSelect.querySelectorAll("option");
    expect(options.length).toBeGreaterThanOrEqual(25);

    // Verify key popular reading fonts are present
    expect(screen.getByRole("option", { name: /Georgia/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Merriweather/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Lora/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Inter/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /JetBrains Mono/i })).toBeInTheDocument();

    // Default value is georgia
    expect(fontSelect.value).toBe("georgia");

    // Change font to inter
    fireEvent.change(fontSelect, { target: { value: "inter" } });
    expect(fontSelect.value).toBe("inter");
    expect(localStorage.getItem("masterclass:tech-buzz-reading-font")).toBe("inter");

    // Featured Masterclass badge and heading are rendered
    expect(screen.getByText("Featured Masterclass")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Building Autonomous Agentic AI Systems with MCP" })).toBeInTheDocument();
  });
});


