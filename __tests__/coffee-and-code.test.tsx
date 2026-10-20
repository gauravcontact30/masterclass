import { fireEvent, render, screen, within } from "@testing-library/react";
import { CoffeeAndCode } from "@/components/coffee-and-code";
import { CoffeeArticle } from "@/components/coffee-article";
import { ContentProvider } from "@/components/content-editing";
import { BLOG_POSTS, BLOG_TOPICS, blogPost } from "@/lib/coffee-and-code";

jest.mock("sonner", () => ({ toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }) }));

test("lists every article as a card with its own light tone, and filters by topic and search", () => {
  render(<CoffeeAndCode posts={BLOG_POSTS} topics={BLOG_TOPICS} />);
  const cards = screen.getAllByRole("listitem").filter(item => item.dataset.tone);
  expect(cards).toHaveLength(BLOG_POSTS.length);
  expect(new Set(cards.map(card => card.dataset.tone)).size).toBe(BLOG_POSTS.length);
  fireEvent.click(screen.getByRole("button", { name: "Python" }));
  expect(screen.getByText("1 article in Python")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "All" }));
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "rebase" } });
  expect(screen.getByRole("heading", { name: /rebase or merge/i })).toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "no such topic" } });
  fireEvent.click(screen.getByRole("button", { name: "Show all articles" }));
  expect(screen.getByText(`${BLOG_POSTS.length} articles`)).toBeInTheDocument();
});

test("an article renders paragraphs, code, questions with answers, images and callouts", () => {
  const post = blogPost("closures-in-five-minutes")!;
  const { container } = render(<CoffeeArticle post={post} related={BLOG_POSTS.slice(0, 2)} />);
  expect(screen.getByRole("heading", { level: 1, name: post.title })).toBeInTheDocument();
  expect(container.querySelectorAll("pre code").length).toBeGreaterThanOrEqual(2);
  expect(container.querySelectorAll("details").length).toBe(post.blocks.filter(b => b.kind === "qa").length);
  expect(screen.getByText("Note")).toBeInTheDocument();
  expect(within(screen.getByRole("complementary", { name: "Keep reading" })).getAllByRole("link")).toHaveLength(2);
});

test("a post the Super Admin removed disappears for everyone else", () => {
  const removed = { [`blog:${BLOG_POSTS[0].slug}`]: { fields: {}, deleted: true } };
  render(<ContentProvider overrides={removed}><CoffeeAndCode posts={BLOG_POSTS} topics={BLOG_TOPICS} /></ContentProvider>);
  expect(screen.queryByText(BLOG_POSTS[0].title)).not.toBeInTheDocument();
  expect(screen.getByText(`${BLOG_POSTS.length - 1} articles`)).toBeInTheDocument();
});

test("every post has a unique slug, at least one code block and one question", () => {
  expect(new Set(BLOG_POSTS.map(p => p.slug)).size).toBe(BLOG_POSTS.length);
  for (const post of BLOG_POSTS) {
    expect(post.blocks.some(b => b.kind === "code")).toBe(true);
    expect(post.blocks.some(b => b.kind === "qa")).toBe(true);
  }
});
