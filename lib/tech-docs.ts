/**
 * The "Technology docs" showcase on the landing page and the dashboard: six platforms, each with its current
 * release, the features worth learning first, a runnable quick start and hand-picked official learning material,
 * plus two CS fundamentals (DSA and OOPs) whose detailed concept notes live in lib/tech-docs-concepts.ts.
 *
 * Versions and links were checked on 2026-10-18 against npm, nodejs.org/dist/index.json and each vendor's docs
 * (developer.salesforce.com answers bots with 403, so its links were checked by hand). Plain data, no zod: the
 * landing page imports this.
 */
export type TechDocCategory = "frontend" | "backend" | "enterprise" | "ai" | "fundamentals";
export type MaterialLevel = "beginner" | "intermediate" | "advanced";
export type MaterialKind = "guide" | "tutorial" | "reference" | "release";
export type TechMaterial = { id: string; title: string; summary: string; level: MaterialLevel; kind: MaterialKind; minutes: number; url: string; topics: string[] };
/** One concept note for a CS fundamentals subject (lib/tech-docs-concepts.ts), shown on /dashboard only. */
export type TechConcept = { id: string; title: string; level: MaterialLevel; summary: string; points: string[]; complexity?: string; code?: { lang: string; code: string } };
export type TechDoc = {
  id: string; name: string; version: string; release: string; category: TechDocCategory;
  tone: { ink: string; tint: string; glow: string }; aliases: string[];
  tagline: string; docs: string; features: string[];
  quickStart: { file: string; code: string };
  materials: TechMaterial[];
};

export const TECH_DOC_CATEGORIES: { id: TechDocCategory; label: string }[] = [
  { id: "frontend", label: "Frontend" }, { id: "backend", label: "Runtime" }, { id: "enterprise", label: "Enterprise" }, { id: "ai", label: "AI platforms" }, { id: "fundamentals", label: "CS fundamentals" },
];
export const MATERIAL_LEVELS: { id: MaterialLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" }, { id: "intermediate", label: "Intermediate" }, { id: "advanced", label: "Advanced" },
];
export const MATERIAL_KINDS: { id: MaterialKind; label: string }[] = [
  { id: "guide", label: "Guides" }, { id: "tutorial", label: "Tutorials" }, { id: "reference", label: "Reference" }, { id: "release", label: "Release notes" },
];

export const TECH_DOCS: TechDoc[] = [
  {
    id: "angular", name: "Angular", version: "22.2", release: "Angular 22 · signals-first, zoneless", category: "frontend",
    tone: { ink: "#b3123c", tint: "#fde8ee", glow: "#f7b6c8" }, aliases: ["angular 22", "ng", "typescript framework"],
    tagline: "Google's TypeScript framework, now signals-first: Signal Forms, the Resource API and zoneless change detection are production ready.",
    docs: "https://angular.dev",
    features: ["Signals & computed", "Linked signals", "Resource & httpResource", "Signal Forms", "Zoneless change detection", "@if / @for control flow", "@defer & incremental hydration", "Route-level render mode"],
    quickStart: { file: "counter.component.ts", code: `import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: \`
    <button (click)="count.update(n => n + 1)">+1</button>
    @if (count() > 0) {
      <p>Double: {{ double() }}</p>
    }
  \`,
})
export class Counter {
  count = signal(0);
  double = computed(() => this.count() * 2);
}` },
    materials: [
      { id: "ng-learn", title: "Learn Angular in your browser", summary: "The official interactive tutorial: components, templates, signals, routing and forms, one step at a time.", level: "beginner", kind: "tutorial", minutes: 90, url: "https://angular.dev/tutorials/learn-angular", topics: ["components", "templates", "routing"] },
      { id: "ng-signals", title: "Signals: state that updates itself", summary: "signal(), computed() and effect(): how Angular tracks dependencies and re-renders only what changed.", level: "beginner", kind: "guide", minutes: 20, url: "https://angular.dev/guide/signals", topics: ["signals", "computed", "effect", "reactivity"] },
      { id: "ng-linked", title: "Dependent state with linkedSignal", summary: "Writable state that resets when its source changes, e.g. a selected option that follows its list.", level: "intermediate", kind: "guide", minutes: 12, url: "https://angular.dev/guide/signals/linked-signal", topics: ["linkedSignal", "signals"] },
      { id: "ng-resource", title: "Async data with the Resource API", summary: "Load data as a signal with loading, error and reload states built in; httpResource wraps HttpClient.", level: "intermediate", kind: "guide", minutes: 18, url: "https://angular.dev/guide/signals/resource", topics: ["resource", "httpResource", "async"] },
      { id: "ng-forms", title: "Signal Forms", summary: "Model-first forms built on signals: schema validation, field state and typed values without FormGroup boilerplate.", level: "intermediate", kind: "guide", minutes: 25, url: "https://angular.dev/guide/forms/signals/overview", topics: ["forms", "validation", "signals"] },
      { id: "ng-zoneless", title: "Going zoneless", summary: "Drop zone.js: what triggers change detection without it, and how to migrate an existing app.", level: "advanced", kind: "guide", minutes: 15, url: "https://angular.dev/guide/zoneless", topics: ["zoneless", "performance", "change detection"] },
      { id: "ng-defer", title: "Deferrable views with @defer", summary: "Split heavy UI into lazy chunks that load on viewport, idle, interaction or a timer.", level: "advanced", kind: "guide", minutes: 14, url: "https://angular.dev/guide/templates/defer", topics: ["defer", "lazy loading", "performance"] },
    ],
  },
  {
    id: "vue", name: "Vue", version: "3.5", release: "Vue 3.5 · leaner reactivity", category: "frontend",
    tone: { ink: "#1f7a52", tint: "#e4f5ec", glow: "#a8dfc2" }, aliases: ["vue.js", "vuejs", "vue 3", "composition api"],
    tagline: "The progressive framework. 3.5 rebuilt reactivity for lower memory use and stabilised reactive props destructure.",
    docs: "https://vuejs.org",
    features: ["Reactive props destructure", "useTemplateRef()", "useId()", "Lazy hydration", "Deferred Teleport", "onWatcherCleanup()", "Composition API", "<script setup>"],
    quickStart: { file: "Greeting.vue", code: `<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from 'vue'

// 3.5: destructured props stay reactive, with defaults
const { title = 'Hello', count = 0 } = defineProps<{ title?: string; count?: number }>()
const double = computed(() => count * 2)

const field = useTemplateRef<HTMLInputElement>('field')
onMounted(() => field.value?.focus())
</script>

<template>
  <h2>{{ title }} · {{ double }}</h2>
  <input ref="field" />
</template>` },
    materials: [
      { id: "vue-intro", title: "Introduction to Vue", summary: "What Vue is, single-file components, and the Options vs Composition API choice, with an interactive tutorial.", level: "beginner", kind: "tutorial", minutes: 30, url: "https://vuejs.org/guide/introduction.html", topics: ["sfc", "composition api", "options api"] },
      { id: "vue-reactivity", title: "Reactivity fundamentals", summary: "ref() and reactive(), deep reactivity and DOM update timing: the core every Vue app is built on.", level: "beginner", kind: "guide", minutes: 20, url: "https://vuejs.org/guide/essentials/reactivity-fundamentals.html", topics: ["ref", "reactive", "reactivity"] },
      { id: "vue-props", title: "Props and reactive destructure", summary: "Declare typed props, give them defaults with plain destructuring, and keep them reactive in 3.5.", level: "intermediate", kind: "guide", minutes: 15, url: "https://vuejs.org/guide/components/props.html", topics: ["props", "defineProps", "typescript"] },
      { id: "vue-refs", title: "Template refs with useTemplateRef", summary: "Reach DOM elements and child components safely, including refs created inside v-for.", level: "intermediate", kind: "guide", minutes: 10, url: "https://vuejs.org/guide/essentials/template-refs.html", topics: ["refs", "useTemplateRef", "dom"] },
      { id: "vue-async", title: "Async components and lazy hydration", summary: "defineAsyncComponent with hydrateOnVisible, hydrateOnIdle and friends to ship less JavaScript up front.", level: "advanced", kind: "guide", minutes: 15, url: "https://vuejs.org/guide/components/async.html", topics: ["ssr", "hydration", "performance"] },
      { id: "vue-35", title: "Announcing Vue 3.5", summary: "Everything in 3.5: the reactivity refactor, SSR improvements, useId(), deferred Teleport and more.", level: "intermediate", kind: "release", minutes: 12, url: "https://blog.vuejs.org/posts/vue-3-5", topics: ["release", "useId", "teleport"] },
    ],
  },
  {
    id: "salesforce", name: "Salesforce", version: "API 68.0", release: "Winter '27 · API 68.0+", category: "enterprise",
    tone: { ink: "#0b5cab", tint: "#e3f0fc", glow: "#9ccaf3" }, aliases: ["sfdc", "apex", "lwc", "lightning", "agentforce", "soql", "crm"],
    tagline: "The CRM platform for developers: Lightning Web Components on the front, Apex and SOQL on the server, Agentforce for AI agents.",
    docs: "https://trailhead.salesforce.com/",
    features: ["Lightning Web Components", "Apex", "SOQL & SOSL", "Agentforce agents", "Salesforce CLI (sf)", "Flow automation", "User-mode data access", "Trailhead learning paths"],
    quickStart: { file: "accountList.js + AccountController.cls", code: `// accountList.js (Lightning Web Component)
import { LightningElement, wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';

export default class AccountList extends LightningElement {
  @wire(getAccounts) accounts;
}

// AccountController.cls (Apex)
public with sharing class AccountController {
  @AuraEnabled(cacheable=true)
  public static List<Account> getAccounts() {
    return [SELECT Id, Name FROM Account WITH USER_MODE LIMIT 10];
  }
}` },
    materials: [
      { id: "sf-trailhead", title: "Trailhead: learn Salesforce free", summary: "Guided trails and hands-on playgrounds for admins and developers, from first login to certification.", level: "beginner", kind: "tutorial", minutes: 60, url: "https://trailhead.salesforce.com/", topics: ["trailhead", "admin", "developer"] },
      { id: "sf-lwc", title: "Lightning Web Components guide", summary: "Build fast UI with standard web components: templates, wire adapters, events and testing.", level: "intermediate", kind: "guide", minutes: 40, url: "https://developer.salesforce.com/docs/platform/lwc/guide/get-started-introduction.html", topics: ["lwc", "javascript", "components"] },
      { id: "sf-apex", title: "Apex Basics & Database", summary: "Salesforce's server language on Trailhead: classes, DML, SOQL and SOSL, with hands-on challenges.", level: "intermediate", kind: "tutorial", minutes: 45, url: "https://trailhead.salesforce.com/content/learn/modules/apex_database", topics: ["apex", "dml", "testing"] },
      { id: "sf-soql", title: "SOQL query reference", summary: "Query records and relationships, aggregate results and stay inside limits with selective filters.", level: "intermediate", kind: "reference", minutes: 25, url: "https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql.htm", topics: ["soql", "queries", "data"] },
      { id: "sf-cli", title: "Salesforce CLI (sf)", summary: "Create scratch orgs, deploy metadata and run tests from your terminal and CI.", level: "advanced", kind: "reference", minutes: 20, url: "https://developer.salesforce.com/tools/salesforcecli", topics: ["cli", "devops", "deploy"] },
      { id: "sf-release", title: "Salesforce release notes", summary: "What is new in each release (Winter '27 brings API 68.0), with feature-by-feature enablement notes.", level: "beginner", kind: "release", minutes: 15, url: "https://www.salesforce.com/releases/", topics: ["release", "api 68"] },
    ],
  },
  {
    id: "node", name: "Node.js", version: "v26.12.0", release: "Node.js 26 · Current, 14 Oct 2026", category: "backend",
    tone: { ink: "#3a7d2c", tint: "#eaf5e3", glow: "#b5dca0" }, aliases: ["node", "nodejs", "javascript runtime", "npm"],
    tagline: "The JavaScript runtime. Node 26 enables the Temporal date API by default and ships V8 14.6 and Undici 8.",
    docs: "https://nodejs.org/docs/latest/api/",
    features: ["Temporal API by default", "V8 14.6 (Map.getOrInsert)", "Undici 8 fetch", "TypeScript type stripping", "node:test runner", "node:sqlite", "Permission model", "--env-file & --watch"],
    quickStart: { file: "app.mjs", code: `// Runs on Node.js 26 with no flags
const today = Temporal.Now.plainDateISO();
console.log(\`Today is \${today}\`);

// V8 14.6: upsert helpers on Map
const visits = new Map();
visits.set('ada', visits.getOrInsert('ada', 0) + 1);

// Built-in fetch (Undici 8)
const res = await fetch('https://nodejs.org/dist/index.json');
const [latest] = await res.json();
console.log('Latest Node.js:', latest.version);` },
    materials: [
      { id: "node-intro", title: "Introduction to Node.js", summary: "The official learn path: the event loop, modules, npm and building your first server.", level: "beginner", kind: "tutorial", minutes: 45, url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs", topics: ["event loop", "modules", "npm"] },
      { id: "node-ts", title: "Run TypeScript natively", summary: "Execute .ts files directly with type stripping: what works, what needs a build step, and tsconfig tips.", level: "intermediate", kind: "guide", minutes: 12, url: "https://nodejs.org/api/typescript.html", topics: ["typescript", "type stripping"] },
      { id: "node-test", title: "The built-in test runner", summary: "node:test with describe/it, mocks, snapshots, coverage and watch mode, no extra dependencies.", level: "intermediate", kind: "reference", minutes: 20, url: "https://nodejs.org/api/test.html", topics: ["testing", "node:test", "coverage"] },
      { id: "node-sqlite", title: "node:sqlite", summary: "An embedded SQLite database in the standard library: prepared statements, transactions and sessions.", level: "intermediate", kind: "reference", minutes: 15, url: "https://nodejs.org/api/sqlite.html", topics: ["sqlite", "database"] },
      { id: "node-permissions", title: "The permission model", summary: "Lock a process down to the files, child processes and workers it really needs with --permission.", level: "advanced", kind: "guide", minutes: 15, url: "https://nodejs.org/api/permissions.html", topics: ["security", "permissions"] },
      { id: "node-releases", title: "Node.js release notes", summary: "Every release with its notable changes; v26.0.0 lists Temporal, V8 14.6, Undici 8 and the removals.", level: "beginner", kind: "release", minutes: 10, url: "https://nodejs.org/en/blog/release/v26.0.0", topics: ["release", "temporal", "v8"] },
    ],
  },
  {
    id: "openrouter", name: "OpenRouter", version: "API v1", release: "OpenRouter · one API, hundreds of models", category: "ai",
    tone: { ink: "#4b4594", tint: "#ecebfa", glow: "#c3bdf0" }, aliases: ["open route", "openrouter.ai", "llm router", "model router"],
    tagline: "One OpenAI-compatible endpoint for hundreds of models, with model fallbacks, provider routing and a single bill.",
    docs: "https://openrouter.ai/docs",
    features: ["OpenAI-compatible API", "Model fallbacks", "Provider routing", "Tool calling", "Structured outputs", "Streaming", "Bring your own keys", "Usage & cost tracking"],
    quickStart: { file: "chat.ts", code: `const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    // Tried in order: if the first model fails, the next one answers
    models: ['~anthropic/claude-sonnet-latest', 'openai/gpt-4o-mini'],
    messages: [{ role: 'user', content: 'Explain recursion in one line.' }],
  }),
});
const data = await res.json();
console.log(data.model, data.choices[0].message.content);` },
    materials: [
      { id: "or-quickstart", title: "OpenRouter quickstart", summary: "Get a key and make your first request with fetch, the OpenAI SDK or Python.", level: "beginner", kind: "tutorial", minutes: 10, url: "https://openrouter.ai/docs/quickstart", topics: ["api key", "first request", "openai sdk"] },
      { id: "or-api", title: "API reference overview", summary: "Request and response shapes, streaming, errors and the parameters every model accepts.", level: "intermediate", kind: "reference", minutes: 20, url: "https://openrouter.ai/docs/api-reference/overview", topics: ["api", "streaming", "errors"] },
      { id: "or-fallbacks", title: "Model fallbacks", summary: "Pass a models array so another model answers when the first is down, rate-limited or refuses.", level: "intermediate", kind: "guide", minutes: 8, url: "https://openrouter.ai/docs/guides/routing/model-fallbacks", topics: ["fallbacks", "reliability", "routing"] },
      { id: "or-providers", title: "Provider routing", summary: "Choose, order or exclude providers and sort by price, latency or throughput for each request.", level: "advanced", kind: "guide", minutes: 15, url: "https://openrouter.ai/docs/features/provider-routing", topics: ["providers", "latency", "cost"] },
      { id: "or-tools", title: "Tool calling", summary: "Let models call your functions with one tool format that works across providers.", level: "advanced", kind: "guide", minutes: 15, url: "https://openrouter.ai/docs/guides/features/tool-calling", topics: ["tools", "function calling", "agents"] },
      { id: "or-structured", title: "Structured outputs", summary: "Ask for JSON that matches a schema, and know which models enforce it strictly.", level: "intermediate", kind: "guide", minutes: 10, url: "https://openrouter.ai/docs/guides/features/structured-outputs", topics: ["json schema", "structured output"] },
    ],
  },
  {
    id: "ai-gateway", name: "Vercel AI Gateway", version: "AI SDK 7", release: "AI Gateway · core features", category: "ai",
    tone: { ink: "#1d1d1b", tint: "#efede6", glow: "#cfccc0" }, aliases: ["vercel", "ai gateway", "ai sdk", "gateway"],
    tagline: "Vercel's unified API for many AI providers: plain \"provider/model\" strings, fallbacks, bring-your-own keys and spend observability.",
    docs: "https://vercel.com/docs/ai-gateway",
    features: ["provider/model strings", "AI SDK integration", "OpenAI-compatible API", "Provider order & fallbacks", "Bring your own key", "Observability & spend", "Zero data retention", "One API key or OIDC"],
    quickStart: { file: "summarise.ts", code: `import { generateText } from 'ai';

// Authenticates with AI_GATEWAY_API_KEY, or OIDC when deployed on Vercel
const { text } = await generateText({
  model: 'anthropic/claude-sonnet-5', // "provider/model"
  prompt: 'Summarise the AI Gateway in one sentence.',
  providerOptions: {
    gateway: { order: ['anthropic', 'bedrock'] }, // provider fallback order
  },
});
console.log(text);` },
    materials: [
      { id: "gw-overview", title: "AI Gateway overview", summary: "What the gateway does: one endpoint and key for many providers, with budgets, logs and failover.", level: "beginner", kind: "guide", minutes: 8, url: "https://vercel.com/docs/ai-gateway", topics: ["overview", "providers"] },
      { id: "gw-start", title: "Getting started", summary: "Create a key, call a model with the AI SDK, then deploy and switch to OIDC authentication.", level: "beginner", kind: "tutorial", minutes: 15, url: "https://vercel.com/docs/ai-gateway/getting-started", topics: ["api key", "oidc", "ai sdk"] },
      { id: "gw-models", title: "Models and providers", summary: "How model strings map to providers, and how to list the models available to your team.", level: "intermediate", kind: "reference", minutes: 10, url: "https://vercel.com/docs/ai-gateway/models-and-providers", topics: ["models", "providers"] },
      { id: "gw-options", title: "Provider options: order, only and sort", summary: "Route each request: preferred provider order, allow-lists, and sorting by cost, latency or throughput.", level: "intermediate", kind: "guide", minutes: 12, url: "https://vercel.com/docs/ai-gateway/provider-options", topics: ["routing", "fallbacks", "providerOptions"] },
      { id: "gw-openai", title: "OpenAI-compatible API", summary: "Point any OpenAI client at https://ai-gateway.vercel.sh/v1 and keep your existing code.", level: "intermediate", kind: "reference", minutes: 10, url: "https://vercel.com/docs/ai-gateway/openai-compat", topics: ["openai sdk", "chat completions"] },
      { id: "gw-byok", title: "Bring your own key", summary: "Use your own provider credentials through the gateway while keeping its routing and observability.", level: "advanced", kind: "guide", minutes: 8, url: "https://vercel.com/docs/ai-gateway/byok", topics: ["byok", "credentials"] },
      { id: "gw-observe", title: "Observability", summary: "Requests, tokens, latency and spend per model and project, for debugging and cost control.", level: "advanced", kind: "guide", minutes: 8, url: "https://vercel.com/docs/ai-gateway/observability", topics: ["observability", "spend", "logs"] },
    ],
  },
  {
    id: "dsa", name: "DSA", version: "24 topics", release: "Data structures & algorithms · interview core", category: "fundamentals",
    tone: { ink: "#1f5f8b", tint: "#e4f0f8", glow: "#a9cde6" }, aliases: ["data structures", "algorithms", "dsa", "leetcode", "big o", "coding interview"],
    tagline: "The data structures and algorithms behind every coding interview: complexity analysis, arrays to graphs, sorting, searching, greedy and dynamic programming.",
    docs: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
    features: ["Big-O complexity", "Arrays & strings", "Linked lists", "Stacks & queues", "Hash tables", "Recursion & backtracking", "Sorting", "Binary search", "Two pointers & sliding window", "Trees & BST", "Heaps", "Tries", "Graphs: BFS & DFS", "Shortest paths", "Union-Find & MST", "Greedy", "Dynamic programming", "Bit manipulation", "Segment & Fenwick trees"],
    quickStart: { file: "binary_search.py", code: `def binary_search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:                 # O(log n): halve the range each step
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

print(binary_search([1, 3, 5, 7, 9, 11], 7))   # 3` },
    materials: [
      { id: "dsa-mit-6006", title: "MIT 6.006 Introduction to Algorithms", summary: "MIT's full course: lectures, notes and problem sets on sorting, hashing, trees, graphs, shortest paths and dynamic programming.", level: "beginner", kind: "tutorial", minutes: 1800, url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/", topics: ["sorting", "hashing", "graphs", "dynamic programming"] },
      { id: "dsa-py-ds", title: "Python: data structures", summary: "Lists as stacks and queues, deque, comprehensions, tuples, sets and dictionaries from the official Python tutorial.", level: "beginner", kind: "guide", minutes: 25, url: "https://docs.python.org/3/tutorial/datastructures.html", topics: ["lists", "stacks", "queues", "sets", "dictionaries"] },
      { id: "dsa-py-complexity", title: "Time complexity of Python operations", summary: "The cost of every list, deque, set and dict operation in CPython, average and worst case.", level: "beginner", kind: "reference", minutes: 10, url: "https://wiki.python.org/moin/TimeComplexity", topics: ["big o", "complexity", "python"] },
      { id: "dsa-algs4", title: "Algorithms, 4th edition (Sedgewick & Wayne)", summary: "Princeton's booksite: code and explanations for sorting, searching, graphs and strings, with Java implementations.", level: "intermediate", kind: "guide", minutes: 600, url: "https://algs4.cs.princeton.edu/home/", topics: ["sorting", "searching", "graphs", "strings"] },
      { id: "dsa-ods", title: "Open Data Structures", summary: "A free textbook covering array lists, linked lists, skiplists, hash tables, binary trees, heaps, B-trees and graphs.", level: "intermediate", kind: "guide", minutes: 480, url: "https://opendatastructures.org/", topics: ["linked lists", "hash tables", "trees", "heaps"] },
      { id: "dsa-java-collections", title: "Java Collections Framework overview", summary: "Oracle's guide to List, Set, Map, Queue and Deque, and which implementation (ArrayList, HashMap, TreeMap, ArrayDeque) to pick.", level: "intermediate", kind: "reference", minutes: 15, url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/doc-files/coll-overview.html", topics: ["java", "collections", "hashmap", "treemap"] },
      { id: "dsa-cpp-containers", title: "C++ containers library", summary: "vector, deque, list, set, map, unordered_map and priority_queue, with the complexity of every operation.", level: "intermediate", kind: "reference", minutes: 20, url: "https://en.cppreference.com/w/cpp/container", topics: ["c++", "stl", "containers"] },
      { id: "dsa-heapq", title: "heapq: heap queue algorithm", summary: "Python's binary min-heap: push, pop, heapify, nlargest and nsmallest, plus priority-queue recipes.", level: "intermediate", kind: "reference", minutes: 10, url: "https://docs.python.org/3/library/heapq.html", topics: ["heaps", "priority queue"] },
      { id: "dsa-bisect", title: "bisect: binary search on sorted lists", summary: "bisect_left, bisect_right and insort: lower and upper bounds without writing the loop yourself.", level: "intermediate", kind: "reference", minutes: 8, url: "https://docs.python.org/3/library/bisect.html", topics: ["binary search", "sorted"] },
      { id: "dsa-mit-6046", title: "MIT 6.046J Design and Analysis of Algorithms", summary: "The follow-on course: divide and conquer, amortisation, randomisation, network flow, NP-completeness.", level: "advanced", kind: "tutorial", minutes: 1800, url: "https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/", topics: ["divide and conquer", "greedy", "flows", "np"] },
      { id: "dsa-erickson", title: "Algorithms by Jeff Erickson", summary: "A free, rigorous textbook on recursion, backtracking, dynamic programming, greedy algorithms and graph algorithms.", level: "advanced", kind: "guide", minutes: 900, url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", topics: ["recursion", "dynamic programming", "graphs"] },
      { id: "dsa-cp-algorithms", title: "CP-Algorithms", summary: "Competitive-programming reference: segment trees, Fenwick trees, DSU, string algorithms, shortest paths and number theory.", level: "advanced", kind: "reference", minutes: 120, url: "https://cp-algorithms.com/", topics: ["segment tree", "fenwick", "dsu", "strings"] },
    ],
  },
  {
    id: "oops", name: "OOPs", version: "23 topics", release: "Object-oriented programming · core to advanced", category: "fundamentals",
    tone: { ink: "#7a3e9d", tint: "#f2e9f8", glow: "#d3b5e6" }, aliases: ["oop", "oops", "object oriented", "object-oriented programming", "solid", "design patterns", "lld"],
    tagline: "Every object-oriented concept: classes and objects, the four pillars, interfaces, overloading and overriding, relationships, SOLID and design patterns.",
    docs: "https://docs.oracle.com/javase/tutorial/java/concepts/",
    features: ["Classes & objects", "Constructors", "Encapsulation", "Abstraction", "Inheritance", "Polymorphism", "Interfaces vs abstract classes", "Overloading & overriding", "Access modifiers", "Static members", "Composition & aggregation", "Composition over inheritance", "SOLID", "Dependency injection", "Generics", "Immutability", "Design patterns", "UML class diagrams"],
    quickStart: { file: "Shapes.java", code: `abstract class Shape {                       // abstraction
    abstract double area();
}
class Circle extends Shape {                 // inheritance
    private final double r;                  // encapsulation
    Circle(double r) { this.r = r; }
    @Override double area() { return Math.PI * r * r; }
}
class Square extends Shape {
    private final double side;
    Square(double side) { this.side = side; }
    @Override double area() { return side * side; }
}
// polymorphism: one call, each shape's own area()
for (Shape s : List.of(new Circle(1), new Square(2)))
    System.out.println(s.area());` },
    materials: [
      { id: "oop-oracle-concepts", title: "Object-oriented programming concepts", summary: "Oracle's introduction to objects, classes, inheritance, interfaces and packages, with Java examples.", level: "beginner", kind: "tutorial", minutes: 30, url: "https://docs.oracle.com/javase/tutorial/java/concepts/", topics: ["objects", "classes", "inheritance", "interfaces"] },
      { id: "oop-oracle-classes", title: "Classes and objects", summary: "Declaring classes, fields, methods and constructors; creating objects; this; access control; static and nested classes.", level: "beginner", kind: "guide", minutes: 60, url: "https://docs.oracle.com/javase/tutorial/java/javaOO/index.html", topics: ["classes", "constructors", "access modifiers", "static"] },
      { id: "oop-py-classes", title: "Python: classes", summary: "The official tutorial on Python classes: scopes, instance and class variables, inheritance, multiple inheritance and private names.", level: "beginner", kind: "tutorial", minutes: 35, url: "https://docs.python.org/3/tutorial/classes.html", topics: ["python", "classes", "inheritance", "mro"] },
      { id: "oop-csharp-oop", title: "Object-oriented programming in C#", summary: "Microsoft's tutorial on abstraction, encapsulation, inheritance and polymorphism, built around a bank-account example.", level: "beginner", kind: "tutorial", minutes: 30, url: "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/oop", topics: ["c#", "four pillars", "polymorphism"] },
      { id: "oop-oracle-inheritance", title: "Interfaces and inheritance", summary: "Defining and implementing interfaces, default methods, overriding and hiding methods, super, abstract classes and Object's methods.", level: "intermediate", kind: "guide", minutes: 60, url: "https://docs.oracle.com/javase/tutorial/java/IandI/index.html", topics: ["interfaces", "inheritance", "abstract classes", "overriding"] },
      { id: "oop-oracle-polymorphism", title: "Polymorphism", summary: "How the JVM calls the right overridden method for each object at run time (virtual method invocation).", level: "intermediate", kind: "guide", minutes: 10, url: "https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html", topics: ["polymorphism", "dynamic dispatch"] },
      { id: "oop-ts-classes", title: "TypeScript classes", summary: "Fields, constructors, getters and setters, implements, extends, member visibility, static members, abstract classes and generics.", level: "intermediate", kind: "reference", minutes: 30, url: "https://www.typescriptlang.org/docs/handbook/2/classes.html", topics: ["typescript", "classes", "visibility", "abstract"] },
      { id: "oop-mdn-prototypes", title: "Inheritance and the prototype chain", summary: "How JavaScript objects inherit from other objects, and what class syntax does underneath.", level: "intermediate", kind: "guide", minutes: 25, url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain", topics: ["javascript", "prototypes", "inheritance"] },
      { id: "oop-oracle-generics", title: "Generics", summary: "Generic types and methods, bounded type parameters, wildcards and type erasure in Java.", level: "intermediate", kind: "guide", minutes: 45, url: "https://docs.oracle.com/javase/tutorial/java/generics/index.html", topics: ["generics", "wildcards", "type erasure"] },
      { id: "oop-py-abc", title: "abc: abstract base classes", summary: "Python's ABC and @abstractmethod for declaring interfaces that subclasses must implement.", level: "intermediate", kind: "reference", minutes: 12, url: "https://docs.python.org/3/library/abc.html", topics: ["python", "abstract classes", "interfaces"] },
      { id: "oop-cpp-virtual", title: "C++ virtual functions", summary: "virtual, override and final; dynamic dispatch through a base pointer; virtual destructors.", level: "advanced", kind: "reference", minutes: 20, url: "https://en.cppreference.com/w/cpp/language/virtual", topics: ["c++", "virtual", "overriding", "vtable"] },
      { id: "oop-patterns", title: "Design patterns catalogue", summary: "All 22 classic patterns (creational, structural, behavioural) with the problem, structure and code in several languages.", level: "advanced", kind: "reference", minutes: 240, url: "https://refactoring.guru/design-patterns", topics: ["design patterns", "factory", "observer", "strategy"] },
      { id: "oop-solid", title: "SOLID relevance (Robert C. Martin)", summary: "The author of the SOLID principles on why single responsibility, open/closed, Liskov, interface segregation and dependency inversion still matter.", level: "advanced", kind: "guide", minutes: 10, url: "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html", topics: ["solid", "design principles"] },
      { id: "oop-tell-dont-ask", title: "Tell, don't ask (Martin Fowler)", summary: "Put behaviour next to the data it uses instead of pulling data out of objects to decide for them.", level: "advanced", kind: "guide", minutes: 6, url: "https://martinfowler.com/bliki/TellDontAsk.html", topics: ["encapsulation", "design"] },
    ],
  },
];
