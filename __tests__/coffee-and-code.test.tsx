import { fireEvent, render, screen, within } from "@testing-library/react";
import { CoffeeAndCode } from "@/components/coffee-and-code";
import { CoffeeArticle } from "@/components/coffee-article";
import { ContentProvider } from "@/components/content-editing";
import { articleFiles, BLOG_POSTS, BLOG_TOPICS, blogPost } from "@/lib/coffee-and-code";

jest.mock("sonner", () => ({ toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }) }));

test("lists every article as a card with its own light tone and cover, six to a page with pulse-style paging, and filters by topic and search", () => {
  render(<CoffeeAndCode posts={BLOG_POSTS} topics={BLOG_TOPICS} />);
  const tones = () => screen.getAllByRole("listitem").filter(item => item.dataset.tone);
  const first = tones();
  expect(first).toHaveLength(6);
  first.forEach(card => expect(card.querySelector("img")?.getAttribute("src")).toMatch(/^\/images\/landing\/coffee\/.+\.webp$/));
  fireEvent.click(screen.getByRole("button", { name: "Next articles" }));
  const second = tones();
  expect(second).toHaveLength(BLOG_POSTS.length - 6);
  expect(new Set([...first, ...second].map(card => card.dataset.tone)).size).toBe(BLOG_POSTS.length);
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

test("Read article opens the whole article in a modal, and Keep reading moves to the next one there", async () => {
  render(<CoffeeAndCode posts={BLOG_POSTS} topics={BLOG_TOPICS} />);
  const first = BLOG_POSTS[0];
  const card = screen.getByRole("heading", { name: first.title }).closest("li")!;
  fireEvent.click(within(card).getByRole("button", { name: /read article/i }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByRole("heading", { level: 1, name: first.title })).toBeInTheDocument();
  expect(within(dialog).queryByRole("link", { name: /all articles/i })).not.toBeInTheDocument();
  const next = within(within(dialog).getByRole("complementary", { name: "Keep reading" })).getAllByRole("button")[0];
  const title = next.lastChild?.textContent ?? "";
  fireEvent.click(next);
  expect(await within(screen.getByRole("dialog")).findByRole("heading", { level: 1, name: title })).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close article" }));
});

test("code examples open in a light editor with every file of the article as a tab, on the block's own file", () => {
  const post = blogPost("useeffect-is-not-a-lifecycle")!;
  expect(articleFiles(post).files.map(file => file.path)).toEqual(["before.tsx", "after.tsx"]);
  render(<CoffeeArticle post={post} related={[]} onOpen={() => {}} />);
  const editors = screen.getAllByRole("figure", { name: post.title });
  expect(editors).toHaveLength(2);
  editors.forEach((editor, index) => {
    const tabs = within(editor).getAllByRole("tab");
    expect(tabs.map(tab => tab.textContent)).toEqual(expect.arrayContaining(["before.tsx", "after.tsx"]));
    expect(within(editor).getByRole("tab", { selected: true })).toHaveTextContent(index ? "after.tsx" : "before.tsx");
  });
  fireEvent.click(within(editors[0]).getByRole("tab", { name: /after\.tsx/ }));
  expect(within(editors[0]).getByRole("tab", { selected: true })).toHaveTextContent("after.tsx");
});
