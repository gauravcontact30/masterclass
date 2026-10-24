import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { LandingNews, NEWS_AUTOPLAY_MS } from "@/components/landing-news";
import { NEWS_SLIDES, type LandingNews as LandingNewsData } from "@/lib/landing-news";
jest.mock("next/server", () => ({ after: jest.fn() }));
import { brandLogo, isIndexPage, pageKey, verifiedQuestions, verifiedStories } from "@/lib/server/landing-news";

const NOW = Date.parse("2026-10-22T03:00:00Z");
const results = [
  { url: "https://www.example.com/news/one/", date: "2026-10-21" },
  { url: "https://example.org/two", date: "2026-10-20" },
  { url: "https://example.net/old", date: "2026-08-01" },
];

describe("verifiedStories", () => {
  test("keeps only stories that link to a searched page, using the search result's date", () => {
    const stories = verifiedStories([
      { title: "First story", summary: "What happened.", source: "Example", url: "https://example.com/news/one", date: "2026-01-01", company: "Anthropic" },
      { title: "Made-up link", summary: "Not searched.", source: "Nowhere", url: "https://invented.example/story", date: "2026-10-21", company: "OpenAI" },
      { title: "Too old", summary: "Months ago.", source: "Example", url: "https://example.net/old", date: "2026-10-21", company: "other" },
      { title: "Second story", summary: "Also real [2].", source: "", url: "https://example.org/two?ref=x", date: "2026-10-20", company: "Microsoft" },
    ], results, NOW, 9);
    expect(stories.map(s => s.title)).toEqual(["First story", "Second story"]);
    expect(stories[0]).toMatchObject({ date: "2026-10-21", url: "https://www.example.com/news/one/", logo: { name: "Anthropic" } });
    expect(stories[1]).toMatchObject({ source: "example.org", summary: "Also real.", logo: { name: "Microsoft", path: null } });
  });

  test("drops a second story about the same event", () => {
    const stories = verifiedStories([
      { title: "Bedrock adds structured outputs for Claude", summary: "a", source: "A", url: "https://example.com/news/one", date: "", company: "AWS" },
      { title: "Bedrock adds structured outputs for Claude models", summary: "b", source: "B", url: "https://example.org/two", date: "", company: "AWS" },
    ], results, NOW, 9);
    expect(stories).toHaveLength(1);
  });
});

test("verifiedQuestions shows companies only when the source was searched, highest rated first", () => {
  const questions = verifiedQuestions([
    { question: "What is RAG?", answer: "Retrieval then generation.", rating: 3, companies: ["Google", "Amazon"], source: "Example", url: "https://example.org/two" },
    { question: "What is an agent?", answer: "A model that uses tools in a loop.", rating: 9, companies: ["Meta"], source: "Blog", url: "https://invented.example/q" },
  ], results);
  expect(questions.map(q => q.question)).toEqual(["What is an agent?", "What is RAG?"]);
  expect(questions[0]).toMatchObject({ rating: 5, companies: [], url: null });
  expect(questions[1].companies.map(c => c.name)).toEqual(["Google", "Amazon"]);
});

test("brandLogo and pageKey", () => {
  expect(brandLogo("amazon web services")).toMatchObject({ name: "AWS", path: null });
  expect(brandLogo("SpaceX")?.path).toBeTruthy();
  expect(brandLogo("other")).toBeNull();
  expect(pageKey("https://WWW.Example.com/a/?q=1#x")).toBe("example.com/a");
  expect(pageKey("javascript:alert(1)")).toBeNull();
  expect(isIndexPage(pageKey("https://www.anthropic.com/news?fp=1")!)).toBe(true);
  expect(isIndexPage(pageKey("https://techcrunch.com/")!)).toBe(true);
  expect(isIndexPage(pageKey("https://www.anthropic.com/news/claude-haiku-5-5")!)).toBe(false);
});

test("shows a loading state until the stories arrive", () => {
  global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
  render(<LandingNews />);
  expect(screen.getAllByRole("status", { hidden: true })[0]).toHaveTextContent("Loading this week's stories");
});

describe("LandingNews carousel", () => {
  const news: LandingNewsData = {
    updatedAt: "2026-10-22T03:20:00Z",
    slides: NEWS_SLIDES.map(slide => slide.id === "ai-labs"
      ? { id: slide.id, kind: "news", fresh: true, stories: [{ title: "Claude Code ships a thing", summary: "Details.", source: "Anthropic", url: "https://www.anthropic.com/news/x", date: "2026-10-21", logo: brandLogo("Anthropic"), points: ["It runs in the terminal."], why: "Faster reviews.", concept: { term: "Agent loop", explain: "A model calling tools until done." } }] }
      : slide.id === "questions-agentic"
        ? { id: slide.id, kind: "questions", fresh: true, questions: [{ question: "What is MCP?", answer: "An open protocol for tools.", rating: 4, companies: [brandLogo("Google")!], url: "https://example.org/q", source: "Example" }] }
        : slide.kind === "news" ? { id: slide.id, kind: "news", fresh: false, stories: [] } : { id: slide.id, kind: "questions", fresh: false, questions: [] }),
  };
  const shown = () => screen.getAllByRole("article", { hidden: true }).filter(article => !article.hidden);

  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(news) }) as unknown as typeof fetch;
  });
  afterEach(() => { jest.useRealTimers(); });
  // findBy* would advance the fake clock while it polls, and with it the slideshow; flushing the fetch keeps slide 1.
  const renderLoaded = async () => { render(<LandingNews />); await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };

  test("lists stories beyond the four cards as More headlines, with their concepts and the slide's basics", async () => {
    const story = (n: number) => ({ title: `Story number ${n}`, summary: `Summary ${n}.`, source: "Anthropic", url: `https://www.anthropic.com/news/s${n}`, date: "2026-10-20", logo: null, points: [], why: null, concept: { term: `Term ${n}`, explain: `Explained ${n}.` } });
    const many: LandingNewsData = { ...news, slides: news.slides.map(slide => slide.id === "ai-labs" ? { id: slide.id, kind: "news", fresh: true, stories: [1, 2, 3, 4, 5, 6].map(story) } : slide) };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(many) }) as unknown as typeof fetch;
    await renderLoaded();
    const slide = within(shown()[0]);
    expect(slide.getAllByText("Story number 4").length).toBeGreaterThan(0);
    expect(slide.queryByRole("link", { name: /Story number/ })).toBeNull();
    const headlines = slide.getByText("More headlines").parentElement as HTMLElement;
    expect(within(headlines).getByText("Story number 5")).toBeInTheDocument();
    expect(within(headlines).getByText("Story number 6")).toBeInTheDocument();
    expect(slide.getByText("Term 5")).toBeInTheDocument();
    expect(slide.getByText("Learn the basics")).toBeInTheDocument();
    expect(slide.getByText("Quick check")).toBeInTheDocument();
    expect(slide.getByText("Why does a longer prompt cost more?")).toBeInTheDocument();
    expect(slide.getByText("Context window")).toBeInTheDocument();
  });

  test("shows one slide at a time with its learning notes, and moves on every two minutes", async () => {
    await renderLoaded();
    expect(screen.getByText("It runs in the terminal.")).toBeInTheDocument();
    expect(screen.getByText(/Learn: Agent loop/)).toBeInTheDocument();
    expect(within(shown()[0]).getByText("In this slide")).toBeInTheDocument();
    expect(screen.getByText("Updated 22 Oct, 8:50 am IST")).toBeInTheDocument();
    expect(shown()).toHaveLength(1);
    expect(screen.getAllByText("Claude Code ships a thing").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Claude Code ships a thing" })).toBeNull();
    act(() => { jest.advanceTimersByTime(NEWS_AUTOPLAY_MS - 1); });
    expect(shown()[0]).toHaveAccessibleName(/^1 \/ 10/);
    act(() => { jest.advanceTimersByTime(1); });
    expect(shown()[0]).toHaveAccessibleName(/^2 \/ 10/);
    expect(within(shown()[0]).getByText(/Fresh stories are being refreshed/)).toBeInTheDocument();
  });

  test("next moves to the interview slide, named in place of tabs, with ratings and companies; pause stops rotation", async () => {
    await renderLoaded();
    fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
    expect(screen.queryByRole("group", { name: "Choose a slide" })).not.toBeInTheDocument();
    for (let k = 0; k < 8; k++) fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByText("Most-asked agentic AI interview questions", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What is MCP?" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Asked often: 4 of 5" })).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(NEWS_AUTOPLAY_MS * 3); });
    expect(shown()[0]).toHaveAccessibleName(/^9 \/ 10/);
  });
});
