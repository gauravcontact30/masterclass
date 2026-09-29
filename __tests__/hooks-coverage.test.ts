import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";

/**
 * The twenty technologies the Search page was asked to cover for hooks, with
 * the category each one files them under.
 *
 * "Hooks" means different things in different rooms, and the group name says
 * which one applies. React, Next.js, the TanStack family, Zustand, Redux,
 * Clerk, BetterAuth, Inngest and the GraphQL clients have React hooks. Vitest
 * and Playwright have test lifecycle hooks. LangChain, LangGraph, LangSmith and
 * n8n have middleware, callback and external hooks.
 *
 * Redis, Upstash, Webhook and Arcjet have no hooks in any of those senses, and
 * inventing hook names for them would put APIs that do not exist in front of
 * someone trying to learn. They carry their real extension points instead —
 * client events, delivery callbacks, a receiver pipeline, custom rules — under
 * a group name that says so.
 */
const REQUIRED: [handbook: string, group: string][] = [
  ["React 19+ Hooks — State, Effects & Actions", "Hook patterns"],
  ["Next.js 16+ Hooks — App Router Navigation", "Hook patterns"],
  ["Redis caching solutions", "Client hooks & events"],
  ["Zustand", "Hooks"],
  ["TanStack Query", "Hooks"],
  ["TanStack Form", "Hooks"],
  ["TanStack Table", "Table hooks & state"],
  ["TanStack Router", "Hooks"],
  ["TanStack Start", "Hooks"],
  ["TanStack Virtual", "Hooks"],
  ["Upstash", "Callbacks & lifecycle"],
  ["Playwright Automation — Browser Testing & Debugging", "Test hooks"],
  ["Redux", "Hooks"],
  ["Redux Toolkit", "Hooks"],
  ["Clerk user management", "Hooks"],
  ["BetterAuth", "Hooks"],
  ["Webhook", "Receiver pipeline"],
  ["Inngest services", "Hooks"],
  ["Arcjet", "Extension points"],
  ["Vitest — Fast Unit Testing & Mocks", "Test hooks"],
  ["GraphQL — Schema, Servers, Clients & Tooling", "Client hooks"],
  ["LangChain", "Hooks & callbacks"],
  ["LangGraph", "Hooks"],
  ["LangSmith", "Hooks & automations"],
  ["n8n", "Hooks"],
];

const handbook = (title: string) => TECHNOLOGY_HANDBOOKS.find(entry => entry.title === title);

test("every requested technology carries its hooks group", () => {
  const missing: string[] = [];
  for (const [title, group] of REQUIRED) {
    const entry = handbook(title);
    if (!entry) { missing.push(`${title} (handbook absent)`); continue; }
    if (!entry.categories.some(category => category.name === group)) missing.push(`${title} → ${group}`);
  }
  expect(missing).toEqual([]);
});

test("each hooks group holds enough topics to be worth opening", () => {
  for (const [title, group] of REQUIRED) {
    const topics = handbook(title)!.topics.filter(topic => topic.category === group);
    expect(topics.length).toBeGreaterThanOrEqual(6);
    for (const topic of topics) {
      expect(topic.name.trim()).not.toBe("");
      // A summary says what the hook is for, not just what it is called.
      expect(topic.summary.length).toBeGreaterThan(40);
    }
  }
});

test("no hooks group repeats a topic name it already had elsewhere", () => {
  for (const [title] of REQUIRED) {
    const names = handbook(title)!.topics.map(topic => topic.name.toLowerCase());
    const duplicated = names.filter((name, index) => names.indexOf(name) !== index);
    expect(duplicated).toEqual([]);
  }
});

test("the category count beside each tab matches the topics behind it", () => {
  for (const entry of TECHNOLOGY_HANDBOOKS) {
    for (const category of entry.categories) {
      expect(entry.topics.filter(topic => topic.category === category.name)).toHaveLength(category.count);
    }
  }
});
