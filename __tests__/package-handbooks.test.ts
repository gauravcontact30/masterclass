import { readFileSync } from "node:fs";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import {
  NODE_PACKAGES, NEST_PACKAGES, NEXT_PACKAGES,
  PYTHON_PACKAGES, GRAPHQL_PACKAGES, PLAYWRIGHT_PACKAGES,
} from "@/lib/pro-learn/package-handbooks";

const SETS = { NODE_PACKAGES, NEST_PACKAGES, NEXT_PACKAGES, PYTHON_PACKAGES, GRAPHQL_PACKAGES, PLAYWRIGHT_PACKAGES };

const TITLES = [
  "Node.js Packages — Modules, Libraries & Middleware",
  "Nest.js Packages — Decorators, Providers & Modules",
  "Next.js 16+ APIs — Directives, Functions, Hooks & Config",
  "Python Packages — Standard Library & Ecosystem",
  "GraphQL — Schema, Servers, Clients & Tooling",
  "Playwright — API, Locators, Fixtures & Tooling",
];

test("every reference handbook is registered on the search page", () => {
  for (const title of TITLES) {
    expect(TECHNOLOGY_HANDBOOKS.find(item => item.title === title)).toBeDefined();
  }
});

test("modern full-stack catalogue covers the requested technologies and TanStack variants", () => {
  const handbook = TECHNOLOGY_HANDBOOKS.find(item => item.title.startsWith("Modern Full-Stack Technologies"));
  expect(handbook).toBeDefined();
  const names = new Set(handbook!.topics.map(topic => topic.name));
  for (const name of [
    "uv package manager", "Redis caching solutions", "Zod", "n8n Automation", "System Design",
    "TanStack Query", "TanStack Form", "TanStack Table", "TanStack Router", "TanStack Start", "TanStack Virtual",
    "Zustand", "Redux Toolkit", "Redux", "GitHub Actions", "Webhook", "Terraform", "Kubernetes",
    "Authentication with Auth.js & Kinde Auth", "Payment gateway integration", "Prisma", "Neon", "Drizzle ORM",
    "Conform - Validation libraries", "Zod validation libraries", "Arcjet", "Inngest services", "Upstash",
    "BetterAuth", "T3 environment", "Clerk user management",
  ]) expect(names.has(name)).toBe(true);
  expect(handbook!.topics.every(topic => topic.summary.length >= 30)).toBe(true);
});

test("no handbook repeats a name, and every topic carries a real summary", () => {
  for (const [label, topics] of Object.entries(SETS)) {
    const names = topics.map(topic => topic.name);
    expect(`${label}: ${names.length}`).toBe(`${label}: ${new Set(names).size}`);
    // A one-word summary teaches nothing; the card has room for a real sentence.
    expect(topics.filter(topic => topic.summary.length < 30)).toEqual([]);
    expect(topics.filter(topic => !topic.category)).toEqual([]);
  }
});

test("every category a handbook advertises is one its topics actually use", () => {
  for (const title of TITLES) {
    const handbook = TECHNOLOGY_HANDBOOKS.find(item => item.title === title)!;
    const used = new Set(handbook.topics.map(topic => topic.category));
    expect(handbook.categories.map(category => category.name).sort()).toEqual([...used].sort());
    // The count beside each tab has to match what the tab will actually show.
    for (const category of handbook.categories) {
      expect(handbook.topics.filter(topic => topic.category === category.name)).toHaveLength(category.count);
    }
  }
});

test("every category has its own icon rather than falling back to the generic one", () => {
  // Read the map as source: the icons are components, so an import would only
  // tell us a category resolved, not whether it resolved to the fallback.
  const source = readFileSync("components/technology-topic-icon.tsx", "utf8");
  const mapped = new Set([...source.matchAll(/"([^"]+)":\s*[A-Z]\w*/g)].map(match => match[1]));

  const missing = TITLES.flatMap(title => {
    const handbook = TECHNOLOGY_HANDBOOKS.find(item => item.title === title)!;
    return handbook.categories.map(category => category.name).filter(name => !mapped.has(name));
  });
  expect(missing).toEqual([]);
});
