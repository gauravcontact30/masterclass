import { render } from "@testing-library/react";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { MODERN_STACK_HANDBOOK } from "@/lib/pro-learn/modern-stack-handbook";
import { SearchSectionIcon } from "@/components/search-section-icon";

/**
 * The technologies the Search page was asked to cover in full.
 *
 * Each of these began as a single row inside the Modern Full-Stack handbook —
 * one name and one sentence. This pins the promotion: every one now has its own
 * browsable catalogue with real categories behind it, so a regression that
 * dropped a handbook back to a summary row would fail here rather than quietly
 * shrinking the page.
 *
 * "Zod" and "Zod validation libraries" were both requested and are one
 * handbook; the six TanStack libraries were requested as "all variations" and
 * are listed individually because each is a separate catalogue.
 */
const REQUESTED = [
  "uv package manager", "Redis caching solutions", "Zod validation libraries", "System Design",
  "TanStack Query", "TanStack Form", "TanStack Table", "TanStack Router", "TanStack Start", "TanStack Virtual",
  "Zustand", "Redux Toolkit", "Redux", "GitHub Actions", "Webhook", "Terraform", "Kubernetes",
  "Authentication with Auth.js & Kinde Auth", "Payment gateway integration", "Prisma", "Neon",
  "Drizzle ORM", "Conform - Validation libraries", "Arcjet", "Inngest services", "Upstash",
  "BetterAuth", "T3 environment", "Clerk user management",
];

/** The smallest catalogue worth browsing: fewer rows than this is still a stub. */
const MIN_TOPICS = 15;
const MIN_CATEGORIES = 3;

const byTitle = new Map(TECHNOLOGY_HANDBOOKS.map(handbook => [handbook.title, handbook]));

test.each(REQUESTED)("%s is a full handbook, not a summary row", title => {
  const handbook = byTitle.get(title);
  expect(handbook).toBeDefined();
  expect(handbook!.topics.length).toBeGreaterThanOrEqual(MIN_TOPICS);
  expect(handbook!.categories.length).toBeGreaterThanOrEqual(MIN_CATEGORIES);
});

test("every requested handbook cites an official source", () => {
  for (const title of REQUESTED) {
    const sources = byTitle.get(title)!.sources ?? [];
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) expect(() => new URL(source.url)).not.toThrow();
  }
});

test("every topic carries a category and a summary a card can render", () => {
  for (const title of REQUESTED) {
    for (const topic of byTitle.get(title)!.topics) {
      expect(topic.name.trim()).not.toBe("");
      expect(topic.category.trim()).not.toBe("");
      expect(topic.summary.trim().length).toBeGreaterThan(20);
    }
  }
});

/**
 * The tab strip resolves its mark from the title, and an unmatched title falls
 * back to the generic Layers glyph. A whole row of identical default marks is
 * the visible symptom of a rule table that never learned about these
 * handbooks, so the default is what this test forbids.
 */
test.each(REQUESTED)("the %s tab resolves to its own mark, not the default", title => {
  const { container } = render(<SearchSectionIcon title={title} />);
  expect(container.querySelector("svg")).not.toHaveClass("lucide-layers");
});

test("no two handbooks share a title, since the tab strip keys on it", () => {
  const titles = TECHNOLOGY_HANDBOOKS.map(handbook => handbook.title);
  expect(new Set(titles).size).toBe(titles.length);
});

/**
 * The combined handbook stays as the overview tab, so its rows have to keep
 * naming things that now exist on their own. A row whose full handbook was
 * renamed would leave the summary pointing at nothing.
 */
test("every Modern Full-Stack row that was promoted matches a handbook title", () => {
  const promoted = MODERN_STACK_HANDBOOK.topics
    .map(topic => topic.name)
    .filter(name => byTitle.has(name));
  expect(promoted.length).toBeGreaterThanOrEqual(20);
});
