/**
 * Which websites count as "official" for a Search tab or an API Docs package.
 *
 * A card's research is locked to these hosts (the web tools' `allowed_domains`)
 * and its source URL is checked against them again afterwards, so a card can
 * never be filled from a blog post or a tutorial site. Tabs that span many
 * projects (Node.js Packages, Python Packages, …) have no single official site:
 * they search openly but every non-documentation host on BLOCKED_HOSTS is
 * refused, and the source must be the project's own documentation.
 */
import type { ApiPackage } from "@/lib/api-docs";

export type DomainPolicy = { allowed: string[] } | { blocked: string[] };

/** Community, tutorial and Q&A sites: useful elsewhere, never an official source. */
export const BLOCKED_HOSTS = [
  "medium.com", "dev.to", "stackoverflow.com", "stackexchange.com", "w3schools.com", "geeksforgeeks.org",
  "freecodecamp.org", "tutorialspoint.com", "youtube.com", "reddit.com", "quora.com", "hashnode.dev",
  "javatpoint.com", "programiz.com", "baeldung.com", "digitalocean.com", "towardsdatascience.com", "substack.com", "wikipedia.org", "analyticsvidhya.com", "kaggle.com",
];

/** Tabs whose handbook carries no `sources`, keyed by a leading slice of the tab title. */
const SEARCH_TAB_HOSTS: [RegExp, string[]][] = [
  // Most specific first: the first matching pattern wins.
  [/^React Testing Library/, ["testing-library.com"]],
  [/^React /, ["react.dev"]],
  [/^Next\.js /, ["nextjs.org"]],
  [/^JavaScript /, ["developer.mozilla.org", "tc39.es"]],
  [/^TypeScript /, ["www.typescriptlang.org", "devblogs.microsoft.com"]],
  [/^Playwright/, ["playwright.dev"]],
  [/^Jest /, ["jestjs.io"]],
  [/^Vitest /, ["vitest.dev"]],
  [/^Cypress /, ["docs.cypress.io"]],
  [/^Node\.js — /, ["nodejs.org"]],
  [/^Nest\.js /, ["docs.nestjs.com"]],
  [/^GraphQL /, ["graphql.org", "www.apollographql.com", "the-guild.dev"]],
  [/^Authentication with Auth\.js/, ["authjs.dev", "docs.kinde.com"]],
  [/^System Design$/, ["aws.amazon.com", "docs.aws.amazon.com", "learn.microsoft.com", "cloud.google.com"]],
  [/^Agentic AI$/, ["modelcontextprotocol.io", "a2a-protocol.org", "docs.anthropic.com", "platform.claude.com", "www.anthropic.com", "platform.openai.com", "ai.google.dev", "learn.microsoft.com"]],
  [/^Webhook$/, ["www.rfc-editor.org", "docs.github.com", "docs.stripe.com", "www.standardwebhooks.com"]],
];

/** Tabs that span many projects: open search, minus the blocked hosts. */
const OPEN_SEARCH_TABS = [/^Modern Full-Stack/, /^Node\.js Packages/, /^Python Packages/, /^AI terms$/];

/** Search tabs that are not technology handbooks. */
const OTHER_TAB_HOSTS: Record<string, string[]> = { AWS: ["docs.aws.amazon.com", "aws.amazon.com"], Python: ["docs.python.org"] };

const hostOf = (url: string) => new URL(url).hostname;

export function searchDomainPolicy(technology: string, sources?: { url: string }[]): DomainPolicy {
  if (OPEN_SEARCH_TABS.some(pattern => pattern.test(technology))) return { blocked: BLOCKED_HOSTS };
  if (OTHER_TAB_HOSTS[technology]) return { allowed: OTHER_TAB_HOSTS[technology] };
  const mapped = SEARCH_TAB_HOSTS.find(([pattern]) => pattern.test(technology))?.[1] ?? [];
  const listed = (sources ?? []).map(source => hostOf(source.url));
  const allowed = [...new Set([...listed, ...mapped])];
  return allowed.length ? { allowed } : { blocked: BLOCKED_HOSTS };
}

/** Extra official hosts for packages whose catalogue `docs` link is a redirect or only one of their sites. */
const API_EXTRA_HOSTS: Record<string, string[]> = {
  ai: ["platform.openai.com", "docs.anthropic.com", "platform.claude.com"],
  aitools: ["ai-sdk.dev", "sdk.vercel.ai"],
  agents: ["docs.langchain.com", "langchain-ai.github.io"],
  react: ["react.dev"],
  javascript: ["developer.mozilla.org", "tc39.es"],
  jspuzzles: ["developer.mozilla.org", "tc39.es"],
  pytorch: ["docs.pytorch.org", "pytorch.org"],
  neon: ["neon.com", "neon.tech"],
  redux: ["redux-toolkit.js.org", "redux.js.org", "react-redux.js.org"],
  kinde: ["docs.kinde.com"],
  t3: ["create.t3.gg", "env.t3.gg"],
  devops: ["kubernetes.io", "docs.docker.com", "developer.hashicorp.com", "docs.github.com"],
  deepagents: ["reference.langchain.com", "docs.langchain.com"],
  langchain: ["reference.langchain.com", "docs.langchain.com", "python.langchain.com"],
  langgraph: ["reference.langchain.com", "docs.langchain.com", "langchain-ai.github.io"],
  integrations: ["reference.langchain.com", "docs.langchain.com", "python.langchain.com"],
  langsmith: ["reference.langchain.com", "docs.langchain.com", "docs.smith.langchain.com"],
};

/** System design has no single vendor, so it searches openly like the mixed Search tabs. */
const OPEN_API_PACKAGES = new Set(["systemdesign"]);

export function apiDomainPolicy(pkg: Pick<ApiPackage, "id" | "docs">): DomainPolicy {
  if (OPEN_API_PACKAGES.has(pkg.id)) return { blocked: BLOCKED_HOSTS };
  return { allowed: [...new Set([hostOf(pkg.docs), ...(API_EXTRA_HOSTS[pkg.id] ?? [])])] };
}

// www.example.com and example.com are the same site (better-auth.com serves its docs from both).
const apex = (host: string) => host.replace(/^www\./, "");
const matches = (host: string, domain: string) => apex(host) === apex(domain) || host.endsWith(`.${apex(domain)}`);

/** Whether a page may be a card's source under its tab's or package's policy. */
export function isOfficialUrl(url: string, policy: DomainPolicy): boolean {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return false; }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  // Archived docs for an old major version (v3.zod.dev, legacy.reactjs.org) are not current.
  if (/^(v\d+|legacy|old|archive)\./.test(host)) return false;
  if ("allowed" in policy) return policy.allowed.some(domain => matches(host, domain));
  return !policy.blocked.some(domain => matches(host, domain));
}
