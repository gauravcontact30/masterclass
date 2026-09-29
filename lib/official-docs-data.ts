/**
 * Official source links and learning projects for the expanded technology catalog.
 * Grounded in official documentation from Next.js, React, Tailwind CSS, Zustand, Redux,
 * RTK, TanStack, GraphQL, Drizzle, Prisma, PostgreSQL, Supabase, Playwright, Vitest,
 * TypeScript, TC39/MDN, JavaScript.info, Python, FastAPI, Go, Rust, Node.js,
 * LangChain, LangGraph, LangSmith, Docker, Kubernetes, AWS, DevOps, Git, CI/CD,
 * and Redis/Inngest/Arcjet/Upstash.
 */

import { additionalDocumentation } from "./official-docs-additions";
import { DOCS_PROJECTS } from "./official-docs-projects";
import { BACKEND_DOCS } from "./official-docs-backend";

export interface DocCodeSnippet {
  filename: string;
  language: string;
  code: string;
  explanation: string;
}

export const OFFICIAL_DOCS_CATEGORIES = [
  "All",
  "Frontend Frameworks",
  "State Management",
  "State & Data Libraries",
  "Databases & Storage",
  "Testing & Quality",
  "Languages & Fundamentals",
  "AI & Agents",
  "DevOps & Cloud",
  "Tooling & CI/CD",
  "Security & Infrastructure",
  "Backend & APIs",
] as const;

export type OfficialDocsCategory = typeof OFFICIAL_DOCS_CATEGORIES[number];

export interface OfficialTechnologyDoc {
  id: string;
  title: string;
  category: OfficialDocsCategory;
  tagline: string;
  officialUrl: string;
  githubUrl?: string;
  version: string;
  badge: string;
  overview: {
    en: string;
    hi: string;
  };
  keyPoints: string[];
  keyFeatures: {
    title: string;
    description: string;
  }[];
  architecturePoints: string[];
  cliCommands: {
    command: string;
    description: string;
  }[];
  codeExample: DocCodeSnippet;
  bestPractices: string[];
  commonGotchas: string[];
}

export const OFFICIAL_DOCS: OfficialTechnologyDoc[] = [
  {
    id: "nextjs",
    title: "Next.js 16+",
    category: "Frontend Frameworks",
    tagline: "The Native React Framework for Full-Stack Production Web Applications",
    officialUrl: "https://nextjs.org/docs",
    githubUrl: "https://github.com/vercel/next.js",
    version: "v16.0+",
    badge: "Official",
    overview: {
      en: "Next.js enables developers to build high-performance React web applications with hybrid static & server rendering, React Server Components (RSC), asynchronous request lifecycles, Turbopack, and automated font/image optimizations.",
      hi: "Next.js रिएक्ट आधारित प्रोडक्शन-ग्रेड फ्रेमवर्क है जो सर्वर कॉम्पोनेंट्स, हाइब्रिड रेंडरिंग और टर्बोपैक के साथ आधुनिक वेब अनुभव प्रदान करता है।",
    },
    keyPoints: [
          "React Server Components (RSC) render on the server by default to reduce client JavaScript bundles to near-zero for static pages.",
          "Turbopack provides up to 10x faster local dev compilations, incremental bundling, and fast-refresh feedback.",
          "Async request lifecycles for cookies(), headers(), params, and searchParams prevent blocking hydration cascades.",
          "Streaming SSR with Suspense allows progressive server-side page hydration without waiting for slow API data.",
          "Server Actions provide type-safe RPC mutations directly from client forms with automatic revalidatePath/revalidateTag.",
          "Route Handlers support Web standard Request and Response objects for RESTful edge and node endpoints.",
          "Built-in font and image optimization automatically converts assets to AVIF/WebP with responsive srcset.",
          "Incremental Static Regeneration (ISR) re-generates individual static pages in the background without a full redeploy."
    ],
    keyFeatures: [
      { title: "App Router & Server Components", description: "Default server-first architecture streaming UI directly from the node runtime with zero client-side JavaScript overhead for static nodes." },
      { title: "Turbopack Bundler Engine", description: "Rust-powered bundler providing instant Fast Refresh and incremental compilation for massive production codebases." },
      { title: "Async Request APIs", description: "Async access patterns for cookies(), headers(), params, and searchParams ensuring future-proof caching isolation." },
      { title: "Server Actions & Mutation Pipeline", description: "RPC-style asynchronous functions executed securely on the server with automatic cache revalidation." },
      { title: "Incremental Static Regeneration (ISR)", description: "Update static pages in the background without rebuilding the entire website." },
    ],
    architecturePoints: [
      "Nested layouts preserve client component state across route transitions while re-rendering dynamic subtrees.",
      "Parallel and Intercepting routes enable modal routes and simultaneous multi-panel navigation in a single URL space.",
      "Edge and Node.js runtimes can be selected per route segment for optimal latency and database driver support.",
    ],
    cliCommands: [
      { command: "npx create-next-app@latest my-app --typescript --tailwind --app", description: "Bootstrap a modern Next.js project with App Router and TypeScript." },
      { command: "npm run dev -- --turbo", description: "Start the local development server with Turbopack acceleration." },
      { command: "npm run build && npm run start", description: "Generate the optimized production bundle and launch the Node.js production server." },
    ],
    codeExample: {
      filename: "app/dashboard/analytics/page.tsx",
      language: "typescript",
      code: `import { Suspense } from 'react';
import { headers } from 'next/headers';

async function RevenueMetrics() {
  const headerList = await headers();
  const userAgent = headerList.get('user-agent') || 'Unknown';
  const res = await fetch('https://api.example.com/revenue', { next: { revalidate: 60 } });
  const data = await res.json();
  return <div className="p-4 rounded-xl bg-card"><h3>Revenue: \${data.total}</h3><p className="text-xs text-muted-foreground">User Agent: {userAgent}</p></div>;
}

export default async function AnalyticsPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Live System Metrics</h1>
      <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded-xl" />}>
        <RevenueMetrics />
      </Suspense>
    </main>
  );
}`,
      explanation: "Next.js App Router Page showcasing React Server Component data fetching, async headers() resolution, and streaming Suspense fallback UI.",
    },
    bestPractices: [
      "Keep data fetching close to the component that consumes it rather than lifting it to root layouts.",
      "Use Server Actions for form submissions to achieve progressive enhancement without client JS dependencies.",
    ],
    commonGotchas: [
      "Avoid using 'use client' at the top of entire pages; push client boundaries to the leaves of your component tree.",
    ],
  },
  {
    id: "react",
    title: "React 19+",
    category: "Frontend Frameworks",
    tagline: "The Library for Web and Native User Interfaces",
    officialUrl: "https://react.dev",
    githubUrl: "https://github.com/facebook/react",
    version: "v19.0+",
    badge: "Official",
    overview: {
      en: "React 19 introduces native Actions, useActionState, useOptimistic, the use() hook for reading promises and contexts in render, Document Metadata tags, and asset preloading directly in JSX.",
      hi: "React 19 नए हुक्स (useActionState, useOptimistic, use) और नेटिव एक्शन्स के ज़रिए स्टेट मैनेजमेंट और एसिंक्रोनस कोड को बेहद सरल बनाता है।",
    },
    keyPoints: [
          "useActionState natively binds form submission states with pending status and returned action data.",
          "useOptimistic enables instant sub-millisecond UI updates before asynchronous mutations resolve.",
          "The use() hook unwraps Promises and Contexts dynamically during render inside Suspense boundaries.",
          "Document metadata tags (<title>, <meta>, <link>) can be rendered directly within leaf components with head hoisting.",
          "Native asset preloading functions (preload, preinit, prefetchDNS) ensure critical fonts and stylesheets load before render.",
          "ref is now a standard prop on function components, deprecating the need for forwardRef in new codebases.",
          "Automated memoization via the React Compiler eliminates boilerplate useMemo, useCallback, and React.memo calls.",
          "Server Functions allow calling server-side logic from client components with end-to-end type safety."
    ],
    keyFeatures: [
      { title: "Native Actions & useActionState", description: "Built-in support for async transitions handling pending states, errors, and form resets automatically." },
      { title: "useOptimistic Hook", description: "Presents optimistic UI updates immediately while an async mutation is in-flight and rolls back on failure." },
      { title: "The use() API", description: "Unwraps promises and Context conditionally during render, suspending until the underlying data is resolved." },
      { title: "First-Class Document Metadata", description: "Declare <title>, <meta>, and link tags inside leaf components with automatic hoisting to document head." },
      { title: "Server Components & Server Functions", description: "Standardized primitives for running code ahead of time on servers and exposing secure RPC endpoints." },
    ],
    architecturePoints: [
      "Transitions coordinate CPU and I/O tasks so long-running computations do not block typing or urgent user inputs.",
      "The use() hook triggers Suspense boundaries when a promise is pending and resumes automatically when resolved.",
    ],
    cliCommands: [
      { command: "npm install react@latest react-dom@latest", description: "Install or upgrade to the official React 19 release." },
      { command: "npm install -D @types/react@latest @types/react-dom@latest", description: "Install the latest official TypeScript definitions." },
    ],
    codeExample: {
      filename: "components/like-button.tsx",
      language: "typescript",
      code: `'use client';
import { useActionState, useOptimistic, startTransition } from 'react';

async function incrementLikes(currentLikes: number, formData: FormData) {
  const response = await fetch('/api/likes', { method: 'POST', body: formData });
  if (!response.ok) throw new Error('Failed to update likes');
  const data = await response.json();
  return data.totalLikes;
}

export function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, formAction, isPending] = useActionState(incrementLikes, initialLikes);
  const [optimisticLikes, setOptimisticLikes] = useOptimistic(likes, (state, update: number) => state + update);

  return (
    <form action={async (formData) => {
      startTransition(() => setOptimisticLikes(1));
      await formAction(formData);
    }}>
      <button type="submit" disabled={isPending}>
        👍 {optimisticLikes} {isPending ? '(Saving...)' : ''}
      </button>
    </form>
  );
}`,
      explanation: "React 19 component leveraging useActionState and useOptimistic for instant user feedback and resilient async submission.",
    },
    bestPractices: [
      "Prefer useActionState over manual useState + useEffect for handling form submission loading and error states.",
      "Use useOptimistic for small interactive actions (likes, toggles, upvotes) to give a sub-millisecond feel.",
    ],
    commonGotchas: [
      "Do not call use() inside try/catch blocks; Suspense relies on uncaught thrown promises to trigger loading fallbacks.",
    ],
  },
  {
    id: "tailwind",
    title: "Tailwind CSS (v4+)",
    category: "Frontend Frameworks",
    tagline: "High-Performance, CSS-First Utility Framework Powered by LightningCSS",
    officialUrl: "https://tailwindcss.com/docs",
    githubUrl: "https://github.com/tailwindlabs/tailwindcss",
    version: "v4.0+",
    badge: "Official",
    overview: {
      en: "Tailwind CSS v4 is an ultra-fast, CSS-first redesign that configures entirely in CSS using the @theme directive. Powered by LightningCSS, it eliminates JavaScript configuration files and delivers up to 10x faster build speeds.",
      hi: "Tailwind CSS v4 पूरी तरह से CSS-फर्स्ट आर्किटेक्चर पर बना है जो बिना किसी कॉन्फ़िग फ़ाइल के सीधे @theme डायरेक्टिव से बिजली जैसी तेज़ स्टाइलिंग प्रदान करता है।",
    },
    keyPoints: [
          "Unified CSS-first configuration replaces tailwind.config.js with pure @theme CSS custom properties.",
          "Oxide Rust-powered engine delivers up to 10x faster compilation and sub-millisecond incremental builds.",
          "Automatic content detection discovers class names across your entire workspace without manual content path globs.",
          "3D transform utilities, container queries, and native CSS color-mix() are available out of the box.",
          "Modern cascade layers (@layer theme, base, components, utilities) preserve intuitive style precedence.",
          "Modern color gamuts (OKLCH, Display P3) provide richer, more vibrant gradients and contrast-safe hues.",
          "Zero-configuration setup requires only a single @import \"tailwindcss\"; statement in your root stylesheet."
    ],
    keyFeatures: [
      { title: "Pure CSS Configuration", description: "Design tokens, fonts, and colors are defined directly in CSS using standard @theme blocks rather than tailwind.config.js." },
      { title: "LightningCSS Engine", description: "Rust-powered compilation pipeline executing in microseconds with automatic CSS minification and vendor prefixing." },
      { title: "Dynamic Utility Generation", description: "Arbitrary values and custom properties work out of the box without manual JIT safelists." },
      { title: "Container Queries Built-in", description: "First-class container utility classes (@sm, @md, @lg) enabling component-driven responsive layouts." },
    ],
    architecturePoints: [
      "Eliminates PostCSS overhead by operating as a standalone CSS parser and transformer.",
      "CSS variables defined in @theme are automatically registered and scoped to standard CSS custom properties.",
    ],
    cliCommands: [
      { command: "npm install tailwindcss @tailwindcss/postcss", description: "Install Tailwind CSS v4 and the PostCSS integration plugin." },
      { command: "npx @tailwindcss/upgrade", description: "Automated codemod to upgrade existing v3 projects to v4 CSS syntax." },
    ],
    codeExample: {
      filename: "app/globals.css",
      language: "css",
      code: `@import "tailwindcss";

@theme {
  --color-brand-primary: oklch(0.62 0.22 260);
  --color-brand-accent: oklch(0.75 0.18 150);
  --font-display: "Outfit", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --radius-card: 18px;
}

@layer components {
  .hero-card {
    background: color-mix(in srgb, var(--color-brand-primary) 8%, white);
    border: 1px solid color-mix(in srgb, var(--color-brand-primary) 20%, transparent);
    border-radius: var(--radius-card);
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }
}`,
      explanation: "Tailwind CSS v4 CSS-first configuration using @import 'tailwindcss' and the native @theme design token block.",
    },
    bestPractices: [
      "Use modern OKLCH color palettes in @theme for perceptually uniform gradients and high-contrast dark modes.",
      "Leverage native container queries (@container) for self-contained reusable component widgets.",
    ],
    commonGotchas: [
      "Do not import legacy tailwind.config.js plugins in v4; migrate custom rules to standard CSS @utility blocks.",
    ],
  },
  {
    id: "zustand",
    title: "Zustand",
    category: "State Management",
    tagline: "Bearbones, Scalable & Unopinionated State Management for React",
    officialUrl: "https://zustand.docs.pmnd.rs",
    githubUrl: "https://github.com/pmndrs/zustand",
    version: "v5.0+",
    badge: "Official",
    overview: {
      en: "Zustand is a lightweight, ergonomic state management library using simplified Flux principles. It requires no boilerplate or Context Providers, and uses atomic selector subscriptions to prevent unnecessary re-renders.",
      hi: "Zustand एक हल्का और तेज़ स्टेट मैनेजमेंट समाधान है जिसमें शून्य बॉयलरप्लेट और डायरेक्ट सिलेक्टर सब्सक्रिप्शन होता है।",
    },
    keyPoints: [
          "Minimalist boilerplate-free state management created via a single create() store definition.",
          "Selective subscription model: components only re-render when their specific selected slice of state changes.",
          "Transient state updates allow reading or updating state outside of React render cycles without triggering re-renders.",
          "Built-in middleware ecosystem includes persist (localStorage/sessionStorage), devtools (Redux DevTools), and immer.",
          "Supports multiple independent isolated stores, preventing unnecessary monolithic global state synchronization.",
          "First-class TypeScript type inference without complex generic wrappers or action creators.",
          "Native React 18+ useSyncExternalStore implementation prevents UI tearing during concurrent rendering transitions."
    ],
    keyFeatures: [
      { title: "No Context Wrappers", description: "Stores are created as standalone hooks and can be consumed anywhere without wrapping component trees in Providers." },
      { title: "Atomic Selector Subscriptions", description: "Components re-render only when their selected slice of state changes, eliminating blanket re-render cascades." },
      { title: "Vanilla JavaScript Access", description: "Access store methods and state outside React components (e.g. inside network interceptors or web workers) via getState() and setState()." },
      { title: "Extensible Middleware Ecosystem", description: "Official devtools, persist, immer, and subscribeWithSelector middleware available out of the box." },
    ],
    architecturePoints: [
      "Uses useSyncExternalStore internally for concurrent-safe tearing-free state subscriptions.",
      "Implements transient updates where state mutations bypass React render cycles for high-frequency events.",
    ],
    cliCommands: [
      { command: "npm install zustand", description: "Install Zustand state management core library." },
      { command: "npm install immer", description: "Install Immer if using mutable draft state mutations." },
    ],
    codeExample: {
      filename: "stores/cart-store.ts",
      language: "typescript",
      code: `import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'masterclass-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);`,
      explanation: "Production Zustand store demonstrating TypeScript types, immutable array operations, and localStorage persistence middleware.",
    },
    bestPractices: [
      "Always use fine-grained selectors: useCartStore((s) => s.items.length) instead of destructuring the whole store.",
      "Colocate actions with state within the store slice rather than writing external dispatchers.",
    ],
    commonGotchas: [
      "Returning a new object literal from a selector without useShallow will trigger re-renders on every store tick.",
    ],
  },
  {
    id: "redux",
    title: "Redux Core",
    category: "State Management",
    tagline: "Predictable, Centralized State Container for JavaScript Apps",
    officialUrl: "https://redux.js.org",
    githubUrl: "https://github.com/reduxjs/redux",
    version: "v5.0+",
    badge: "Official",
    overview: {
      en: "Redux provides a predictable state container with strict unidirectional data flow. The entire application state is stored in a single immutable tree, mutated only by dispatching actions to pure reducer functions.",
      hi: "Redux एक पूर्वानुमानित स्टेट कंटेनर है जो एक्शन और रिड्यूसर के ज़रिए अनिडायरेक्शनल डेटा फ्लो सुनिश्चित करता है।",
    },
    keyPoints: [
          "Single source of truth: the entire global application state is stored in an object tree inside a single store.",
          "State is read-only: the only way to change state is to dispatch an action object describing what happened.",
          "Changes are made with pure reducer functions that return a new immutable state object without side effects.",
          "Predictable time-travel debugging and state serialization powered by unidirectional data flow.",
          "Middleware pipeline (thunk, saga, custom) intercepts dispatched actions for asynchronous I/O and logging.",
          "Strict immutability guarantees allow deterministic undo/redo, caching, and state synchronization across sessions.",
          "Higher-order store enhancers (compose, applyMiddleware) allow deep runtime store customization."
    ],
    keyFeatures: [
      { title: "Single Source of Truth", description: "Entire global application state is kept inside a single store tree for auditability and serialization." },
      { title: "State is Read-Only", description: "Direct state mutations are prohibited; mutations must be represented as dispatched plain action objects." },
      { title: "Changes are Made with Pure Reducers", description: "Pure functions compute the next state without side effects, ensuring deterministic replayability." },
      { title: "Middleware Pipeline", description: "Intercept and enrich dispatched actions for asynchronous APIs, logging, analytics, and telemetry." },
    ],
    architecturePoints: [
      "Unidirectional data flow: View dispatches Action -> Middleware intercepts -> Reducer updates Store -> Subscribers notify View.",
      "Redux 5.0 enforces native ES modules and TypeScript 5+ typing standards.",
    ],
    cliCommands: [
      { command: "npm install redux", description: "Install Redux core library." },
      { command: "npm install react-redux", description: "Install official React bindings for Redux." },
    ],
    codeExample: {
      filename: "lib/redux-core.ts",
      language: "typescript",
      code: `import { createStore, applyMiddleware, Action } from 'redux';

interface AppState {
  count: number;
}

type AppAction =
  | { type: 'INCREMENT'; payload: number }
  | { type: 'DECREMENT'; payload: number };

function counterReducer(state: AppState = { count: 0 }, action: Action): AppState {
  const act = action as AppAction;
  switch (act.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + act.payload };
    case 'DECREMENT':
      return { ...state, count: state.count - act.payload };
    default:
      return state;
  }
}

export const store = createStore(counterReducer);`,
      explanation: "Classic Redux architecture featuring strict TypeScript action union typing and an immutable pure reducer function.",
    },
    bestPractices: [
      "Keep reducers pure and deterministic; never perform random number generation, Date.now(), or HTTP calls in reducers.",
      "For modern production applications, use Redux Toolkit (RTK) instead of manually writing legacy createStore code.",
    ],
    commonGotchas: [
      "Mutating existing state references directly inside a reducer causes React-Redux selector memoization to miss updates.",
    ],
  },
  {
    id: "rtk",
    title: "Redux Toolkit (RTK & RTK Query)",
    category: "State Management",
    tagline: "The Official, Opinionated, Battery-Included Toolset for Efficient Redux",
    officialUrl: "https://redux-toolkit.js.org",
    githubUrl: "https://github.com/reduxjs/redux-toolkit",
    version: "v2.3+",
    badge: "Official",
    overview: {
      en: "Redux Toolkit (RTK) eliminates Redux boilerplate with createSlice, Immer-powered mutable syntax, and RTK Query for automatic server-state fetching, caching, deduplication, and polling.",
      hi: "Redux Toolkit (RTK) बॉयलरप्लेट को हटाता है और RTK Query के ज़रिए कैशिंग और डेटा फेचिंग को बेहद आसान बनाता है।",
    },
    keyPoints: [
          "configureStore automatically sets up Redux DevTools, redux-thunk, and immutability/serializability invariant checks.",
          "createSlice combines reducer logic and auto-generated action creators using Immer for intuitive mutable-like code.",
          "RTK Query eliminates manual data fetching by providing automated caching, deduplication, polling, and optimistic updates.",
          "Automatic cache invalidation uses declarative cache tag relationships (providesTags, invalidatesTags).",
          "createEntityAdapter provides normalized CRUD operations (selectIds, selectEntities, addOne, updateMany) with O(1) lookups.",
          "createAsyncThunk abstracts promise lifecycles into pending, fulfilled, and rejected action types automatically.",
          "Full TypeScript inference with auto-generated typed hooks (useGetPostsQuery, useAddPostMutation)."
    ],
    keyFeatures: [
      { title: "createSlice() Abstraction", description: "Generates action types and action creators automatically from a single reducer definition object." },
      { title: "Immer-Powered Reducers", description: "Write simple mutating code (state.val = 42) safely converted into immutable copies behind the scenes." },
      { title: "RTK Query Data Fetching", description: "Comprehensive data fetching and caching layer eliminating the need to write custom async thunks and reducers." },
      { title: "Normalized Cache Management", description: "Provides createEntityAdapter for performant O(1) CRUD lookups on collections." },
    ],
    architecturePoints: [
      "RTK Query endpoints act as decoupled hooks (useGetUserQuery) with automated cache lifetimes based on subscriber reference counts.",
      "Tag invalidation ('providesTags' and 'invalidatesTags') coordinates automated surgical refetches after mutations.",
    ],
    cliCommands: [
      { command: "npm install @reduxjs/toolkit react-redux", description: "Install Redux Toolkit and React-Redux." },
    ],
    codeExample: {
      filename: "services/api-slice.ts",
      language: "typescript",
      code: `import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface Article {
  id: string;
  title: string;
  views: number;
}

export const blogApi = createApi({
  reducerPath: 'blogApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Articles'],
  endpoints: (builder) => ({
    getArticles: builder.query<Article[], void>({
      query: () => 'articles',
      providesTags: ['Articles'],
    }),
    incrementViews: builder.mutation<Article, string>({
      query: (id) => ({ url: \`articles/\${id}/view\`, method: 'POST' }),
      invalidatesTags: ['Articles'],
    }),
  }),
});

export const { useGetArticlesQuery, useIncrementViewsMutation } = blogApi;`,
      explanation: "RTK Query service definition with tag-based cache invalidation and auto-generated React query/mutation hooks.",
    },
    bestPractices: [
      "Use RTK Query tag types for clean cache invalidation instead of manually tracking fetch status in state.",
      "Organize features into dedicated feature folders containing their slice, components, and selectors.",
    ],
    commonGotchas: [
      "Forgetting to mount the RTK Query middleware in configureStore will disable cache invalidation and refetching.",
    ],
  },
  {
    id: "tanstack",
    title: "TanStack (Query, Table, Form, Router)",
    category: "State & Data Libraries",
    tagline: "High-Quality, Type-Safe Headless Software for Modern Web Apps",
    officialUrl: "https://tanstack.com",
    githubUrl: "https://github.com/tanstack",
    version: "v5.x+",
    badge: "Official",
    overview: {
      en: "TanStack offers powerful headless utilities: TanStack Query (async state management & caching), TanStack Table (headless data grids), TanStack Form (form validation), and TanStack Router (100% type-safe routing).",
      hi: "TanStack आधुनिक वेब के लिए टाइप-सेफ हेडलेस लाइब्रेरीज़ (Query, Table, Form, Router) का प्रीमियम संग्रह है।",
    },
    keyPoints: [
          "TanStack Query provides declarative server-state management with background caching, garbage collection, and stale-while-revalidate.",
          "Automatic query deduplication ensures identical network requests across multiple components trigger only a single fetch.",
          "TanStack Table is a headless, framework-agnostic data table engine with sorting, filtering, grouping, and virtualization.",
          "TanStack Form handles high-performance, deeply-nested form validation with zero unnecessary re-renders.",
          "TanStack Router delivers 100% type-safe routing, search params validation with Zod, and parallel data preloading.",
          "TanStack Start powers full-stack SSR and streaming apps with full RSC and server function parity.",
          "Optimistic mutations with onMutate context allow instant rollbacks if network requests fail."
    ],
    keyFeatures: [
      { title: "Query: Server-State Sync", description: "Declarative fetching, caching, background polling, and optimistic mutations with garbage collection." },
      { title: "Table: Headless Data Grids", description: "Sort, filter, group, paginate, and virtualize massive datasets without dictating CSS or DOM structure." },
      { title: "Form: Reactive Validation", description: "Type-safe form state engine supporting schema validators like Zod, Valibot, and Yup." },
      { title: "Router: 100% Type-Safe Routing", description: "Compile-time verified paths, search parameters, and route loaders preventing broken navigation links." },
    ],
    architecturePoints: [
      "Server-state (remote APIs) is kept strictly separated from client-state (modals, UI toggles).",
      "Query keys act as deterministic dependency arrays for caching, revalidation, and optimistic updates.",
    ],
    cliCommands: [
      { command: "npm install @tanstack/react-query @tanstack/react-table @tanstack/react-form", description: "Install TanStack React libraries." },
      { command: "npm install -D @tanstack/react-query-devtools", description: "Install official TanStack Query interactive browser devtools." },
    ],
    codeExample: {
      filename: "components/data-table.tsx",
      language: "typescript",
      code: `'use client';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';

interface User {
  id: string;
  name: string;
  role: string;
}

const columnHelper = createColumnHelper<User>();
const columns = [
  columnHelper.accessor('name', { header: 'Name', cell: info => info.getValue() }),
  columnHelper.accessor('role', { header: 'Role', cell: info => <strong>{info.getValue()}</strong> }),
];

export function UserList() {
  const { data = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      return res.json();
    },
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>Loading records...</div>;

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(group => (
          <tr key={group.id}>
            {group.headers.map(header => (
              <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}`,
      explanation: "Production TanStack Query data fetching paired with headless TanStack Table row model rendering.",
    },
    bestPractices: [
      "Use descriptive queryKey arrays (e.g. ['users', userId, { filter }]) for surgical cache invalidation.",
      "Prefer queryClient.invalidateQueries() over manual refetching after mutations.",
    ],
    commonGotchas: [
      "Omitting stable query functions or memoized column definitions can trigger table recalculation cycles.",
    ],
  },
  {
    id: "graphql",
    title: "GraphQL & Apollo Client",
    category: "State & Data Libraries",
    tagline: "Precise Data Fetching, Strongly-Typed Schemas & Normalized Caching",
    officialUrl: "https://graphql.org/learn/",
    githubUrl: "https://github.com/apollographql/apollo-client",
    version: "v3.11+",
    badge: "Official",
    overview: {
      en: "GraphQL provides a complete, strongly-typed query language and runtime for APIs. Apollo Client pairs with GraphQL to provide automated normalized caching, declarative React hooks, and zero over-fetching.",
      hi: "GraphQL एक सटीक क्वेरी भाषा है जिसमें क्लाइंट वही डेटा मांगता है जिसकी उसे ज़रूरत होती है, और Apollo Client इसका नॉर्मलाइज्ड कैश संभालता है।",
    },
    keyPoints: [
          "Declarative data fetching: clients request exactly the fields they need, eliminating over-fetching and under-fetching.",
          "Strongly typed schema definition (SDL) serves as an authoritative contract between frontend and backend services.",
          "Normalized Apollo Client cache automatically normalizes records by __typename and id across queries and mutations.",
          "Real-time GraphQL Subscriptions over WebSockets or SSE for reactive live data streaming.",
          "Single endpoint architecture consolidates multiple microservices into a unified federated supergraph.",
          "Schema stitching and Apollo Federation enable cross-team microservice composition without monolithic bottlenecks.",
          "Reactive variables (makeVar) allow storing local client-side state directly within Apollo Client cache."
    ],
    keyFeatures: [
      { title: "Declarative Queries", description: "Describe the exact data requirements inside UI components using standard gql query strings." },
      { title: "Normalized InMemoryCache", description: "Deconstructs query payloads into individual normalized entities for automatic instant UI synchronizations." },
      { title: "Optimistic UI Mutations", description: "Renders tentative mutation results immediately while waiting for server confirmation." },
      { title: "Strong Type Introspection", description: "Tools can auto-generate TypeScript types directly from the schema and client queries." },
    ],
    architecturePoints: [
      "Apollo Client's link chain provides a composable middleware pipeline for auth headers, batching, and error logging.",
      "Field policies and read/merge functions handle pagination without writing manual state mergers.",
    ],
    cliCommands: [
      { command: "npm install @apollo/client graphql", description: "Install Apollo Client and core GraphQL package." },
      { command: "npx get-graphql-schema http://localhost:4000/graphql > schema.graphql", description: "Extract current GraphQL schema from a running server." },
    ],
    codeExample: {
      filename: "lib/apollo-client.ts",
      language: "typescript",
      code: `import { ApolloClient, InMemoryCache, gql, useQuery } from '@apollo/client';

export const apolloClient = new ApolloClient({
  uri: 'https://api.example.com/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
});

const GET_POSTS = gql\`
  query GetPosts($limit: Int!) {
    posts(limit: $limit) {
      id
      title
      author {
        name
      }
    }
  }
\`;

export function PostList() {
  const { data, loading, error } = useQuery(GET_POSTS, { variables: { limit: 10 } });
  if (loading) return <p>Loading articles...</p>;
  if (error) return <p>Error loading posts.</p>;
  return (
    <ul>
      {data?.posts.map((post: any) => (
        <li key={post.id}>{post.title} — {post.author.name}</li>
      ))}
    </ul>
  );
}`,
      explanation: "Apollo Client setup with InMemoryCache field merge policy and typed useQuery invocation.",
    },
    bestPractices: [
      "Always query the id and __typename fields so Apollo Client can identify and normalize records in cache.",
      "Use fragment colocation to couple component data requirements directly with their presentation code.",
    ],
    commonGotchas: [
      "Failing to supply unique id fields causes Apollo Client to fallback to caching records under parent queries, breaking updates.",
    ],
  },
  {
    id: "drizzle",
    title: "Drizzle ORM",
    category: "State & Data Libraries",
    tagline: "Zero-Overhead, Edge-Ready TypeScript ORM with Pure SQL Semantics",
    officialUrl: "https://orm.drizzle.team",
    githubUrl: "https://github.com/drizzle-team/drizzle-orm",
    version: "v0.34+",
    badge: "Official",
    overview: {
      en: "Drizzle ORM is a lightweight, type-safe TypeScript ORM that mirrors pure SQL semantics. With zero runtime overhead and instant edge/serverless compatibility, it ensures that if you know SQL, you know Drizzle.",
      hi: "Drizzle ORM एक सुपर-फास्ट और टाइप-सेफ ORM है जो बिना किसी ओवरहेड के शुद्ध SQL सिद्धांतों पर काम करता है और सर्वरलेस में बेहतरीन परफॉर्म करता है।",
    },
    keyPoints: [
          "TypeScript-first schema definitions where database schemas double as single source of truth for runtime validation.",
          "Zero-dependency runtime overhead: compiles directly to parameterized SQL with zero query generation bloat.",
          "Relational query API delivers Prisma-like nested querying while generating a single, highly-optimized SQL query.",
          "Automatic migration generator (drizzle-kit) inspects schema diffs to produce safe, predictable SQL migrations.",
          "First-class support for SQL expressions (sql template tag) with type-safe parameterized bindings.",
          "Universal driver support: works seamlessly with PostgreSQL, MySQL, SQLite, Cloudflare D1, Turso, and Supabase.",
          "End-to-end type safety: query results are automatically typed based on selected columns and table relations."
    ],
    keyFeatures: [
      { title: "Direct SQL Syntax", description: "Write queries using familiar SQL expressions (select, from, where, leftJoin) with full TypeScript auto-completion." },
      { title: "Zero Dependencies Runtime", description: "Extremely lightweight driver layer that runs seamlessly in Node.js, Cloudflare Workers, and Vercel Edge." },
      { title: "Automated Migrations (Drizzle Kit)", description: "Diffs TypeScript schema files against live databases to generate clean SQL migration files." },
      { title: "Relational Query API", description: "Perform nested relation lookups without manual joins when clean nested objects are preferred." },
    ],
    architecturePoints: [
      "Prepares and parameterizes all SQL queries automatically, preventing SQL injection vulnerabilities.",
      "Schema definitions are plain JavaScript objects that can be shared between frontend and backend code.",
    ],
    cliCommands: [
      { command: "npm install drizzle-orm pg", description: "Install Drizzle ORM and PostgreSQL database driver." },
      { command: "npm install -D drizzle-kit @types/pg", description: "Install Drizzle Kit CLI for migration and schema management." },
      { command: "npx drizzle-kit push", description: "Push local TypeScript schema directly to database during development." },
    ],
    codeExample: {
      filename: "db/schema.ts",
      language: "typescript",
      code: `import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, desc } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export async function getTopUsersWithPosts() {
  return await db
    .select({
      userName: users.name,
      postTitle: posts.title,
    })
    .from(users)
    .leftJoin(posts, eq(users.id, posts.userId))
    .orderBy(desc(users.createdAt))
    .limit(10);
}`,
      explanation: "Drizzle ORM PostgreSQL schema definition with foreign key references and a typed leftJoin query.",
    },
    bestPractices: [
      "Use drizzle-kit generate for production CI/CD migrations and drizzle-kit push only during early dev prototyping.",
      "Export InferSelectModel and InferInsertModel from your schema for robust, reusable DTO types.",
    ],
    commonGotchas: [
      "Forgetting to supply connection pooling in serverless environments can exhaust database connection slots.",
    ],
  },
  {
    id: "prisma",
    title: "Prisma ORM",
    category: "State & Data Libraries",
    tagline: "Next-Generation Declarative Schema Modeling & Type-Safe Query Engine",
    officialUrl: "https://www.prisma.io/docs",
    githubUrl: "https://github.com/prisma/prisma",
    version: "v5.20+",
    badge: "Official",
    overview: {
      en: "Prisma is an intuitive, type-safe ORM featuring a human-readable schema modeling DSL, automated SQL migrations, and an auto-generated query client with comprehensive nested relation support.",
      hi: "Prisma एक आधुनिक ORM है जो schema.prisma में सरल डेटाबेस मॉडलिंग और टाइप-सेफ क्लाइंट क्वेरीज़ प्रदान करता है।",
    },
    keyPoints: [
          "Declarative schema modeling in schema.prisma defines tables, relationships, indexes, and database providers.",
          "Prisma Client generates type-safe database queries automatically tailored to your unique schema structure.",
          "Prisma Migrate tracks schema changes over time with human-readable, reversible SQL migration files.",
          "Prisma Studio provides a visual data browser GUI for inspecting and editing database records locally.",
          "Connection pooling and edge acceleration through Prisma Accelerate and Prisma Pulse for serverless databases.",
          "Strict relationship modeling enforces referential integrity with cascade deletes and composite foreign keys.",
          "Interactive transactions ($transaction) guarantee atomic execution across multiple interdependent operations."
    ],
    keyFeatures: [
      { title: "Declarative Schema DSL", description: "Intuitive schema.prisma modeling language describing tables, enums, relations, and indices." },
      { title: "Auto-Generated Prisma Client", description: "Generates tailored TypeScript definitions providing compile-time safety on every database call." },
      { title: "Prisma Migrate", description: "Declarative migration tool syncing schema models with physical PostgreSQL, MySQL, and SQLite databases." },
      { title: "Prisma Studio", description: "Visual web-based admin GUI to inspect, filter, and edit database records locally." },
    ],
    architecturePoints: [
      "Uses a high-performance query engine binary to optimize, batch, and execute SQL queries.",
      "Connection pooling can be delegated to Prisma Accelerate for ultra-low latency edge serverless execution.",
    ],
    cliCommands: [
      { command: "npm install @prisma/client", description: "Install the Prisma Client runtime package." },
      { command: "npm install -D prisma", description: "Install the Prisma CLI for migrations and code generation." },
      { command: "npx prisma migrate dev --name init", description: "Create and apply a migration from your schema.prisma file." },
    ],
    codeExample: {
      filename: "prisma/service.ts",
      language: "typescript",
      code: `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function createUserWithProfile(email: string, name: string, bio: string) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        profile: {
          create: { bio },
        },
      },
      include: {
        profile: true,
      },
    });
    return user;
  });
}`,
      explanation: "Prisma singleton client initialization with interactive multi-table $transaction write.",
    },
    bestPractices: [
      "Prevent client exhaustion during local Next.js hot reloading by assigning PrismaClient to globalThis.",
      "Use select to fetch only required fields when querying large tables with multiple relationships.",
    ],
    commonGotchas: [
      "Omitting indices on foreign key fields can lead to full table scans during deep relation queries.",
    ],
  },
  {
    id: "postgresql",
    title: "PostgreSQL & pgvector",
    category: "Databases & Storage",
    tagline: "Enterprise Open-Source Relational Database with Native Vector AI Search",
    officialUrl: "https://www.postgresql.org/docs/",
    githubUrl: "https://github.com/pgvector/pgvector",
    version: "v16 / v17",
    badge: "Official",
    overview: {
      en: "PostgreSQL is the world's most advanced open-source relational database. Paired with the pgvector extension, it natively stores high-dimensional embeddings and performs lightning-fast vector similarity search for AI applications.",
      hi: "PostgreSQL एक शक्तिशाली रिलेशनल डेटाबेस है जो pgvector के साथ AI एम्बेडिंग्स और सिमिलैरिटी सर्च को नेटिव रूप से सपोर्ट करता है।",
    },
    keyPoints: [
          "Advanced ACID-compliant relational engine with Multi-Version Concurrency Control (MVCC) for high-write workloads.",
          "pgvector extension enables high-dimensional embedding storage and rapid similarity search (HNSW, IVFFlat).",
          "Native JSONB support provides binary-encoded document storage with GIN indexing for hybrid relational-document queries.",
          "Row-Level Security (RLS) policies enforce multi-tenant authorization at the database kernel level.",
          "Window functions, Common Table Expressions (CTEs), and recursive queries handle complex analytical aggregations.",
          "Generated columns, table partitioning, and partial indexes maximize throughput on multi-terabyte datasets.",
          "Listen/Notify protocol allows low-latency publish/subscribe event broadcasting to connected backend services."
    ],
    keyFeatures: [
      { title: "pgvector HNSW Indexing", description: "Performs high-recall vector search using cosine distance, L2 distance, and inner product." },
      { title: "JSONB & GIN Indexes", description: "Store unstructured payloads and query deep JSON keys with indexed performance." },
      { title: "Row-Level Security (RLS)", description: "Define security access policies directly inside the database engine to enforce multi-tenancy." },
      { title: "Full-Text Search Engine", description: "Built-in tsvector and tsquery data types for linguistic stemming, ranking, and search." },
    ],
    architecturePoints: [
      "WAL (Write-Ahead Logging) ensures zero data loss during sudden server failover or reboot.",
      "HNSW indexes construct multi-layer graphs in memory for logarithmic search time complexity.",
    ],
    cliCommands: [
      { command: "psql -U postgres -d masterclass_db", description: "Connect to local PostgreSQL database shell." },
      { command: "CREATE EXTENSION IF NOT EXISTS vector;", description: "Enable pgvector extension inside current database." },
    ],
    codeExample: {
      filename: "db/vector-search.sql",
      language: "sql",
      code: `-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge documents table with 1536-dimensional embeddings (e.g. OpenAI ada-002)
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(1536) NOT NULL
);

-- Build an HNSW index for ultra-fast cosine similarity lookups
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Query the top 5 most relevant documents for a given query embedding
SELECT id, content, 1 - (embedding <=> '[0.012, -0.024, 0.045, ...]'::vector) AS similarity
FROM documents
ORDER BY embedding <=> '[0.012, -0.024, 0.045, ...]'::vector
LIMIT 5;`,
      explanation: "PostgreSQL DDL creating an embedding table with HNSW cosine distance indexing and vector similarity search.",
    },
    bestPractices: [
      "Always create an HNSW index (or IVFFlat for memory-constrained setups) to avoid linear brute-force table scans.",
      "Tune work_mem and maintenance_work_mem when building vector indexes on datasets over 100,000 rows.",
    ],
    commonGotchas: [
      "Attempting to query vector distance with <=> without casting the string payload to ::vector will result in a syntax error.",
    ],
  },
  {
    id: "supabase",
    title: "Supabase",
    category: "Databases & Storage",
    tagline: "The Open-Source Backend Platform: Postgres, Auth, Realtime & Edge Functions",
    officialUrl: "https://supabase.com/docs",
    githubUrl: "https://github.com/supabase/supabase",
    version: "v2.45+",
    badge: "Official",
    overview: {
      en: "Supabase is an open-source Firebase alternative built on dedicated PostgreSQL. It provides instant REST/GraphQL APIs, user authentication with Row-Level Security, Realtime WebSocket synchronization, and S3-compatible storage.",
      hi: "Supabase एक ओपन-सोर्स बैकएंड समाधान है जो पोस्टग्रेस, ऑथेंटिकेशन, रियल-टाइम डेटा और स्टोरेज को बिना किसी लॉक-इन के उपलब्ध कराता है।",
    },
    keyPoints: [
          "Full PostgreSQL database with instant auto-generated RESTful (PostgREST) and GraphQL APIs.",
          "Realtime CDC (Change Data Capture) engine streams database inserts, updates, and deletes over WebSockets.",
          "Supabase Auth provides multi-provider authentication (OAuth, magic links, passwords) integrated with Postgres RLS.",
          "Deno-powered Edge Functions run globally distributed serverless TypeScript handlers with sub-50ms cold starts.",
          "Storage engine provides S3-compatible file storage with image transformations and row-level access control.",
          "pgvector integration enables turnkey vector databases for semantic search and retrieval-augmented generation (RAG).",
          "Database webhooks trigger external HTTP endpoints automatically upon specified database table mutations."
    ],
    keyFeatures: [
      { title: "PostgreSQL Database Engine", description: "Direct SQL access with support for extensions including pgvector, PostGIS, and pg_cron." },
      { title: "Row-Level Security (RLS)", description: "Secure your data at the row level using SQL policies based on auth.uid()." },
      { title: "Realtime CDC Engine", description: "Subscribe to database changes (INSERT, UPDATE, DELETE) via WebSockets in real time." },
      { title: "Supabase Storage", description: "Manage user uploads, avatars, and media files with integrated RLS authorization." },
    ],
    architecturePoints: [
      "PostgREST automatically inspects database schemas to generate instant OpenAPI-compliant REST APIs.",
      "Realtime broadcasts Postgres Write-Ahead Log (WAL) events to authorized subscribers.",
    ],
    cliCommands: [
      { command: "npm install @supabase/supabase-js @supabase/ssr", description: "Install Supabase client and Server-Side Rendering helper." },
      { command: "npx supabase init && npx supabase start", description: "Initialize and boot a complete Supabase local development stack via Docker." },
    ],
    codeExample: {
      filename: "lib/supabase-client.ts",
      language: "typescript",
      code: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function subscribeToLiveOrders(onNewOrder: (order: any) => void) {
  const channel = supabase
    .channel('live-orders')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => {
        onNewOrder(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}`,
      explanation: "Supabase client initialization and real-time PostgreSQL change subscription over WebSockets.",
    },
    bestPractices: [
      "Always enable Row-Level Security (ALTER TABLE table_name ENABLE ROW LEVEL SECURITY) on all public tables.",
      "Use @supabase/ssr for Next.js App Router applications to securely manage auth tokens in HttpOnly cookies.",
    ],
    commonGotchas: [
      "Never expose SUPABASE_SERVICE_ROLE_KEY in client bundles; it bypasses Row-Level Security completely.",
    ],
  },
  {
    id: "playwright",
    title: "Playwright",
    category: "Testing & Quality",
    tagline: "Reliable End-to-End Testing and Cross-Browser Automation",
    officialUrl: "https://playwright.dev",
    githubUrl: "https://github.com/microsoft/playwright",
    version: "v1.48+",
    badge: "Official",
    overview: {
      en: "Playwright by Microsoft provides reliable cross-browser end-to-end testing across Chromium, Firefox, and WebKit on Windows, Linux, and macOS. Features auto-waiting, visual regression, network mocking, and rich trace recordings.",
      hi: "Playwright आधुनिक वेब ऐप्स के लिए तेज़ और विश्वसनीय एंड-टू-एंड टेस्टिंग फ्रेमवर्क है जो क्रोम, फायरफॉक्स और वेबकिट को सपोर्ट करता है।",
    },
    keyPoints: [
          "User-first locators (getByRole, getByText, getByTestId) mirror real user interactions and accessibility standards.",
          "Auto-waiting mechanism automatically waits for elements to be visible, enabled, and stable before dispatching actions.",
          "Cross-browser automation executes identically across Chromium, Firefox, WebKit, and mobile browser viewports.",
          "Isolated BrowserContexts provide lightning-fast, sandboxed test execution without clearing browser profiles or cookies.",
          "Network interception and mocking (page.route) allow simulating slow networks, 500 errors, and offline states.",
          "Playwright Trace Viewer records DOM snapshots, network logs, console messages, and screencasts for every test run.",
          "Component testing enables testing React, Vue, and Svelte components in real browser environments."
    ],
    keyFeatures: [
      { title: "User-First Locators", description: "Locates elements by user-perceivable attributes (getByRole, getByText, getByLabel) ensuring accessibility-compliant tests." },
      { title: "Automatic Waiting", description: "Waits automatically for elements to be actionable, visible, and stable before clicks or keystrokes, eliminating arbitrary sleep delays." },
      { title: "Trace Viewer", description: "Captures full DOM snapshots, action screencasts, console logs, and network traffic for post-run forensic debugging." },
      { title: "Network Mocking & HAR Replay", description: "Intercepts and stubs HTTP requests, alters headers, and tests offline modes seamlessly." },
      { title: "Parallelism & Multi-Tab Isolation", description: "Executes test files in parallel across isolated BrowserContexts for sub-minute test suite runs." },
    ],
    architecturePoints: [
      "BrowserContexts provide lightweight, incognito-like sandbox instances that eliminate test pollution without restarting browser binaries.",
      "WebSocket-based direct DevTools protocol communication guarantees rock-solid execution without Selenium flakiness.",
    ],
    cliCommands: [
      { command: "npm init playwright@latest", description: "Initialize Playwright test suite and download browser binaries." },
      { command: "npx playwright test", description: "Run all end-to-end tests across configured browser engines." },
      { command: "npx playwright show-trace trace.zip", description: "Open the interactive GUI trace viewer to inspect test execution step-by-step." },
    ],
    codeExample: {
      filename: "tests/auth.spec.ts",
      language: "typescript",
      code: `import { test, expect } from '@playwright/test';

test.describe('Authentication & Dashboard Flow', () => {
  test('User successfully logs in and views account metrics', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email address').fill('student@masterclass.dev');
    await page.getByLabel('Password').fill('SuperSecret123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    const metricsCard = page.getByTestId('metric-completed-lessons');
    await expect(metricsCard).toContainText('12');
  });
});`,
      explanation: "Playwright E2E test utilizing user-facing accessibility locators and auto-waiting assertions.",
    },
    bestPractices: [
      "Rely on getByRole and getByText locators rather than brittle CSS or XPath selectors.",
      "Always configure the Playwright Trace Viewer on CI runs to debug flakiness with video and network traces.",
    ],
    commonGotchas: [
      "Never insert page.waitForTimeout(5000); use web-first assertions like await expect(locator).toBeVisible() instead.",
    ],
  },
  {
    id: "vitest",
    title: "Vitest",
    category: "Testing & Quality",
    tagline: "Next-Generation, Blazing Fast Unit Testing Powered by Vite",
    officialUrl: "https://vitest.dev",
    githubUrl: "https://github.com/vitest-dev/vitest",
    version: "v2.1+",
    badge: "Official",
    overview: {
      en: "Vitest is an ultra-fast, Vite-native testing framework with out-of-the-box Jest compatibility, ESM first architecture, worker thread execution, and instant HMR-like watch mode.",
      hi: "Vitest एक बेहद तेज़ यूनिट टेस्टिंग फ्रेमवर्क है जो Vite के कंपाइलर और ES मॉड्यूल्स का उपयोग करता है।",
    },
    keyPoints: [
          "Native Vite integration shares the exact same plugins, resolve aliases, and transform pipeline as your app.",
          "Instant HMR (Hot Module Replacement) watch mode re-runs only the specific test files impacted by source changes.",
          "Jest-compatible API (describe, it, expect, vi.fn, vi.spyOn) allows seamless migration with zero code changes.",
          "Multi-threading and worker pool execution using Tinypool provide blistering parallel test speeds.",
          "In-source testing allows co-locating unit tests directly inside implementation files for modular utilities.",
          "Native ESM, TypeScript, and JSX support out of the box with zero Babel or ts-jest pre-processing.",
          "Integrated Istanbul and v8 code coverage reporting with interactive HTML dashboards."
    ],
    keyFeatures: [
      { title: "Vite Configuration Sharing", description: "Shares Vite plugins, path aliases, and CSS transforms directly without maintaining two build configurations." },
      { title: "Drop-in Jest Compatibility", description: "Features identical describe, it, expect, and mocking APIs for immediate migration from Jest." },
      { title: "Multi-Threaded Parallel Execution", description: "Utilizes Tinypool worker threads for instant test execution across multi-core CPUs." },
      { title: "Interactive Vitest UI", description: "Web-based graphical dashboard displaying test execution status, module graph dependencies, and coverage reports." },
    ],
    architecturePoints: [
      "Leverages Vite's transform graph so test files only re-execute when their exact imported dependencies change.",
      "Runs on Node.js with native ESM support, bypassing costly CJS bundling steps.",
    ],
    cliCommands: [
      { command: "npm install -D vitest @vitest/ui", description: "Install Vitest runner and interactive UI dashboard." },
      { command: "npx vitest", description: "Run tests in watch mode with instant file-change re-execution." },
      { command: "npx vitest run --coverage", description: "Execute test suite once and generate code coverage report." },
    ],
    codeExample: {
      filename: "lib/math.test.ts",
      language: "typescript",
      code: `import { describe, it, expect, vi, beforeEach } from 'vitest';

export function calculateDiscount(price: number, percent: number): number {
  if (percent < 0 || percent > 100) throw new Error('Invalid discount percentage');
  return price - (price * (percent / 100));
}

describe('calculateDiscount Unit Tests', () => {
  it('correctly calculates 20% discount on $100', () => {
    const result = calculateDiscount(100, 20);
    expect(result).toBe(80);
  });

  it('throws an error when discount percentage exceeds 100', () => {
    expect(() => calculateDiscount(50, 105)).toThrowError('Invalid discount percentage');
  });
});`,
      explanation: "Vitest unit test file validating numeric calculations and exception handling with type safety.",
    },
    bestPractices: [
      "Use vi.mock() with dynamic imports for clean mock resets across tests.",
      "Enable coverage-v8 for near-zero overhead code coverage generation.",
    ],
    commonGotchas: [
      "Mocking browser APIs without configuring a jsdom or happy-dom environment will trigger undefined window errors.",
    ],
  },
  {
    id: "typescript",
    title: "TypeScript (5.x+)",
    category: "Languages & Fundamentals",
    tagline: "JavaScript with Syntax for Types",
    officialUrl: "https://www.typescriptlang.org/docs",
    githubUrl: "https://github.com/microsoft/TypeScript",
    version: "v5.6+",
    badge: "Official",
    overview: {
      en: "TypeScript adds optional static typing to JavaScript, catching errors at compile time and enabling powerful IDE refactoring, type narrowing, conditional types, template literals, and decorators.",
      hi: "TypeScript जावास्क्रिप्ट पर स्टैटिक टाइपिंग जोड़ता है जिससे कोड अधिक सुरक्षित, बग-मुक्त और मेंटेन करने में आसान हो जाता है।",
    },
    keyPoints: [
          "Structural type system (duck typing) checks compatibility based on object shapes rather than declared nominal types.",
          "Type narrowing and control flow analysis dynamically refine union types using typeof, instanceof, and in operators.",
          "Advanced mapped and conditional types (T extends U ? X : Y) allow expressing complex generic transformations.",
          "const type parameters and template literal types enable precise literal string and tuple inference.",
          "IsolatedDeclarations flag drastically speeds up monorepo build tools by enforcing explicit return types on exports.",
          "Satisfies operator validates that an expression matches a type without widening its specific inferred type.",
          "ECMAScript decorators support provides standardized class and method metadata annotations."
    ],
    keyFeatures: [
      { title: "satisfies Operator", description: "Validates that an expression matches a type contract without widening the inferred type shape." },
      { title: "Template Literal Types", description: "Construct new string types via template literal combinations for strict domain validation." },
      { title: "Discriminated Unions", description: "Pattern-match on shared literal tag fields to narrow union types safely with 100% compiler verification." },
      { title: "ECMAScript Stage 3 Decorators", description: "Standardized decorators for class methods, fields, and accessors." },
    ],
    architecturePoints: [
      "Erased types: All TypeScript annotations are completely erased during compilation, emitting clean JavaScript with zero runtime bloat.",
      "Structural subtyping: Types are evaluated by their shape and members rather than their declared class name.",
    ],
    cliCommands: [
      { command: "npm install -D typescript @types/node", description: "Install TypeScript compiler and Node.js definitions." },
      { command: "npx tsc --init", description: "Generate a recommended tsconfig.json configuration file." },
      { command: "npx tsc --noEmit", description: "Run full static type check across the project without emitting files." },
    ],
    codeExample: {
      filename: "types/result.ts",
      language: "typescript",
      code: `export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export function parseConfig(rawJson: string): Result<{ port: number; host: string }> {
  try {
    const parsed = JSON.parse(rawJson);
    if (typeof parsed.port !== 'number') {
      return { success: false, error: new Error('Invalid or missing port number') };
    }
    return { success: true, data: { port: parsed.port, host: parsed.host || 'localhost' } };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}

// Pattern match with discriminated union
const res = parseConfig('{"port": 8080}');
if (res.success) {
  console.log('Server bound to:', res.data.port);
} else {
  console.error('Failed to parse config:', res.error.message);
}`,
      explanation: "Idiomatic TypeScript utilizing generic discriminated unions for bulletproof functional error handling.",
    },
    bestPractices: [
      "Always set strict: true in tsconfig.json to prevent implicit any and ensure strict null checks.",
      "Prefer unknown over any when dealing with dynamic external input, and narrow types with type guards.",
    ],
    commonGotchas: [
      "Using the 'as' type assertion disables compiler checking; prefer type guards (is) or zod runtime parsers.",
    ],
  },
  {
    id: "javascript-features",
    title: "JavaScript (Modern ECMAScript)",
    category: "Languages & Fundamentals",
    tagline: "Modern Features, Asynchronous Patterns & ESNext Standards",
    officialUrl: "https://tc39.es",
    githubUrl: "https://github.com/tc39",
    version: "ES2024+",
    badge: "Official",
    overview: {
      en: "Modern JavaScript standardized by TC39 features structuredClone, Object.groupBy, Promise.withResolvers, Temporal API proposals, top-level await, optional chaining, and Array immutability methods.",
      hi: "आधुनिक ECMAScript में structuredClone, Object.groupBy, और Promise.withResolvers जैसी उन्नत सुविधाएं शामिल हैं।",
    },
    keyPoints: [
          "Object.groupBy and Map.groupBy provide native, zero-dependency collection grouping into arrays and maps.",
          "Array immutability methods (toSorted, toReversed, toSpliced, with) produce new arrays without mutating originals.",
          "Promise.withResolvers simplifies promise construction by returning resolve and reject functions alongside the promise.",
          "Temporal API provides type-safe, timezone-aware date and time manipulation without legacy Date mutation bugs.",
          "String.isWellFormed and toWellFormed prevent malformed lone surrogate unicode corruption during serialization.",
          "Top-level await enables asynchronous initialization and module loading directly at module root scope.",
          "WeakMap and WeakSet allow garbage-collectible association of metadata with object instances."
    ],
    keyFeatures: [
      { title: "Object.groupBy()", description: "Natively group array items by a key returning a clean grouped object dictionary." },
      { title: "Promise.withResolvers()", description: "Extracts promise, resolve, and reject into an object, simplifying custom asynchronous managers." },
      { title: "Immutable Array Methods", description: "toSorted(), toReversed(), toSpliced(), and with() return new arrays without mutating the source." },
      { title: "structuredClone()", description: "Deeply copies circular references, Dates, RegExps, and TypedArrays natively." },
    ],
    architecturePoints: [
      "The JavaScript Event Loop coordinates the Call Stack, Microtask Queue (Promises), and Macrotask Queue (setTimeout/I/O).",
      "Modules (ESM) load asynchronously with static dependency graphs, enabling deterministic tree-shaking.",
    ],
    cliCommands: [
      { command: "node --version", description: "Check installed Node.js runtime supporting latest ECMAScript features." },
    ],
    codeExample: {
      filename: "lib/modern-js.mjs",
      language: "javascript",
      code: `// 1. Grouping array items natively
const inventory = [
  { name: 'Apple', category: 'Fruit', qty: 10 },
  { name: 'Carrot', category: 'Vegetable', qty: 5 },
  { name: 'Banana', category: 'Fruit', qty: 15 },
];

const grouped = Object.groupBy(inventory, item => item.category);
console.log('Grouped:', grouped.Fruit.length); // 2

// 2. Promise.withResolvers for external deferred execution
const { promise, resolve, reject } = Promise.withResolvers();
setTimeout(() => resolve('Task complete!'), 100);
console.log(await promise);

// 3. Immutable Array Updates
const original = [3, 1, 2];
const sorted = original.toSorted();
console.log('Original remains unchanged:', original); // [3, 1, 2]
console.log('New sorted copy:', sorted); // [1, 2, 3]`,
      explanation: "Practical demonstration of Object.groupBy, Promise.withResolvers, and toSorted from recent ECMAScript specifications.",
    },
    bestPractices: [
      "Use structuredClone() instead of JSON.parse(JSON.stringify()) to safely clone complex objects.",
      "Prefer immutable array methods (toSorted, toSpliced) in UI state stores to prevent accidental mutations.",
    ],
    commonGotchas: [
      "structuredClone cannot clone DOM nodes, functions, or Symbol properties; it will throw a DataCloneError.",
    ],
  },
  {
    id: "javascript-info",
    title: "JavaScript.info Deep Engine",
    category: "Languages & Fundamentals",
    tagline: "In-Depth JavaScript Engine Internals, Prototype Chains & Event Loops",
    officialUrl: "https://javascript.info",
    githubUrl: "https://github.com/javascript-tutorial/en.javascript.info",
    version: "2026 Core",
    badge: "Official",
    overview: {
      en: "Authoritative deep dives into V8 engine mechanics, execution contexts, lexical environments, closures, prototype inheritance, event loops, microtasks vs macrotasks, and garbage collection algorithms.",
      hi: "JavaScript.info इंजन के अंदरूनी कार्यप्रणाली जैसे क्लोजर, प्रोटोटाइप इनहेरिटेंस, और इवेंट लूप को गहराई से सिखाता है।",
    },
    keyPoints: [
          "Prototypal inheritance links objects through hidden [[Prototype]] references for efficient memory reuse.",
          "Closures retain lexical environment references, allowing inner functions to access outer variables after execution.",
          "The Event Loop coordinates the Call Stack, Microtask Queue (Promises, queueMicrotask), and Macrotask Queue (setTimeout, I/O).",
          "Event bubbling and capturing phases enable event delegation by handling events on common ancestor containers.",
          "Primitive wrapper objects (String, Number, Boolean) provide methods while maintaining immutable primitive value semantics.",
          "Property descriptors (writable, enumerable, configurable) and Object.freeze enable fine-grained object immutability.",
          "Custom iterators and Generators (function*) allow custom lazy data streams and cooperative multitasking."
    ],
    keyFeatures: [
      { title: "Lexical Environments & Closures", description: "How internal [[Environment]] hidden slots preserve variable references across scope boundaries." },
      { title: "Prototypal Inheritance", description: "Traversing __proto__ references and delegating property lookups through the prototype chain." },
      { title: "Event Loop & Macrotask/Microtask Queues", description: "Order of execution between call stack frames, microtasks (Promises), rendering passes, and macrotasks." },
      { title: "Generators & Async Iteration", description: "Pausing execution with yield and consuming asynchronous data streams with for await...of." },
    ],
    architecturePoints: [
      "V8 JIT compilation: Ignition bytecode interpreter coupled with TurboFan optimizing compiler using hidden classes.",
      "Generational Garbage Collection: New space (Scavenger) for ephemeral allocations and Old space (Mark-Sweep-Compact).",
    ],
    cliCommands: [
      { command: "node --expose-gc", description: "Launch Node.js with manual garbage collection control enabled." },
    ],
    codeExample: {
      filename: "lib/engine-internals.js",
      language: "javascript",
      code: `// Microtask vs Macrotask Event Loop Execution Order
console.log('1. Synchronous script start');

setTimeout(() => {
  console.log('4. Macrotask: setTimeout executed');
}, 0);

Promise.resolve().then(() => {
  console.log('2. Microtask 1: Promise resolution');
}).then(() => {
  console.log('3. Microtask 2: Chained microtask');
});

queueMicrotask(() => {
  console.log('2.5. Microtask: queueMicrotask executed');
});

console.log('1.5. Synchronous script end');
// Output Order:
// 1. Synchronous script start
// 1.5. Synchronous script end
// 2. Microtask 1: Promise resolution
// 2.5. Microtask: queueMicrotask executed
// 3. Microtask 2: Chained microtask
// 4. Macrotask: setTimeout executed`,
      explanation: "Demonstration of the Event Loop order of operations between Call Stack, Microtasks, and Macrotasks.",
    },
    bestPractices: [
      "Avoid blocking the Call Stack with synchronous loops; yield control using queueMicrotask or scheduler.yield().",
      "Do not modify native prototypes (Array.prototype, Object.prototype) to prevent de-optimizing JIT hidden classes.",
    ],
    commonGotchas: [
      "Unbounded microtask loops (recursively queueing microtasks) will starve the browser rendering thread and freeze the UI.",
    ],
  },
  {
    id: "python",
    title: "Python (3.12 / 3.13+)",
    category: "Languages & Fundamentals",
    tagline: "Modern Python: Free-Threaded No-GIL, Pattern Matching, AsyncIO & Typing",
    officialUrl: "https://docs.python.org/3/",
    githubUrl: "https://github.com/python/cpython",
    version: "v3.12 / v3.13+",
    badge: "Official",
    overview: {
      en: "Modern Python brings experimental free-threaded execution (no-GIL), structural pattern matching, improved tracebacks, native type parameter syntax, task groups in asyncio, and faster JIT compiler execution.",
      hi: "Python 3.12 और 3.13 में नो-GIL मल्टी-थ्रेडिंग, स्ट्रक्चरल पैटर्न मैचिंग और बेहतर परफॉरमेंस शामिल हैं।",
    },
    keyPoints: [
          "Structural Pattern Matching (match/case) enables expressive unpacking of sequences, mappings, and class instances.",
          "Type hints with generic syntax (type Alias = list[int]) and PEP 695 type parameter syntax for classes and functions.",
          "Per-interpreter GIL in sub-interpreters enables true multi-core parallel CPU execution within a single Python process.",
          "Asyncio event loop with async/await provides high-concurrency non-blocking I/O for network services.",
          "Context managers (with statement) guarantee deterministic cleanup of file handles, database sessions, and locks.",
          "Dataclasses provide boilerplate-free value objects with auto-generated __init__, __repr__, and __eq__ methods.",
          "Comprehensions (list, dict, set) and generator expressions provide expressive, memory-efficient data transformations."
    ],
    keyFeatures: [
      { title: "Structural Pattern Matching", description: "match/case statements with sequence, mapping, and class patterns plus guard clauses." },
      { title: "Asyncio Task Groups", description: "Structured concurrency pattern guaranteeing child coroutines are cleanly awaited or canceled." },
      { title: "Type Parameter Syntax", description: "New native generic syntax: class Box[T] and def func[T](val: T) eliminating TypeVar boilerplate." },
      { title: "JIT Compiler & Free-Threading", description: "Copy-on-write tier-2 JIT compiler and experimental build removing the Global Interpreter Lock (GIL)." },
    ],
    architecturePoints: [
      "Specializing Adaptive Interpreter dynamically replaces generic opcodes with specialized inline cache instructions.",
      "Structured concurrency prevents orphaned background tasks from leaking exceptions.",
    ],
    cliCommands: [
      { command: "python --version", description: "Check current Python interpreter version." },
      { command: "python -m venv .venv && source .venv/bin/activate", description: "Create and activate an isolated virtual environment." },
      { command: "pytest -v", description: "Run test suite with pytest runner." },
    ],
    codeExample: {
      filename: "server/async_pipeline.py",
      language: "python",
      code: `import asyncio
from dataclasses import dataclass

@dataclass
class Job[T]:
    id: str
    payload: T

async def process_task(job_id: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return f"Job {job_id} processed"

async def main():
    # Structured concurrency with TaskGroup
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(process_task("A", 0.1))
        task2 = tg.create_task(process_task("B", 0.05))

    print(f"Results: {task1.result()}, {task2.result()}")

if __name__ == "__main__":
    asyncio.run(main())`,
      explanation: "Modern Python 3.12+ script showcasing native generic type parameters and asyncio.TaskGroup structured concurrency.",
    },
    bestPractices: [
      "Always use asyncio.TaskGroup instead of asyncio.gather for safe structured concurrency error handling.",
      "Use pyproject.toml and modern package tools like uv for lightning-fast dependency management.",
    ],
    commonGotchas: [
      "Mutable default arguments in functions (def add(item, items=[])) are evaluated once at module load time; use None.",
    ],
  },
  {
    id: "fastapi",
    title: "FastAPI",
    category: "Languages & Fundamentals",
    tagline: "High-Performance, Async Python Web Framework with Pydantic v2",
    officialUrl: "https://fastapi.tiangolo.com",
    githubUrl: "https://github.com/fastapi/fastapi",
    version: "v0.115+",
    badge: "Official",
    overview: {
      en: "FastAPI is a modern, high-performance web framework for building APIs with Python based on standard Python type hints. Built on Starlette and Pydantic v2, it features automated OpenAPI/Swagger documentation and native async I/O.",
      hi: "FastAPI एक अत्यंत तेज़ पायथन वेब फ्रेमवर्क है जो टाइप हिंट्स और Pydantic v2 के ज़रिए आटोमेटिक Swagger डॉक्यूमेंटेशन और हाई-परफॉरमेंस APIs प्रदान करता है।",
    },
    keyPoints: [
          "Asynchronous request handling built on Starlette and Uvicorn matches NodeJS and Go throughput benchmarks.",
          "Pydantic v2 data validation parses, validates, and serializes request bodies, query params, and headers automatically.",
          "Automated OpenAPI (Swagger UI and ReDoc) documentation generated dynamically from Python type signatures.",
          "Dependency Injection system (Depends) provides clean, composable sharing of database sessions, auth, and services.",
          "BackgroundTasks queue allows scheduling non-blocking asynchronous jobs after sending HTTP responses.",
          "Native WebSocket and Server-Sent Events (SSE) support for real-time bidirectional communication.",
          "Middleware pipeline for CORS, GZip compression, request timing, and distributed tracing headers."
    ],
    keyFeatures: [
      { title: "Pydantic v2 Schema Validation", description: "Rust-powered validation engine serializing and parsing JSON payloads with ultra-low latency." },
      { title: "Interactive OpenAPI Auto-Docs", description: "Instant Swagger UI and ReDoc endpoints generated directly from route definitions with zero extra effort." },
      { title: "Async/Await Concurrency", description: "Native async route handlers running on ASGI servers (Uvicorn) handling thousands of concurrent connections." },
      { title: "Dependency Injection System", description: "Modular Depends() mechanism for clean database session management, authentication, and permissions." },
    ],
    architecturePoints: [
      "Built on top of ASGI (Asynchronous Server Gateway Interface) standard implemented by Uvicorn.",
      "Synchronous endpoints are automatically offloaded to an internal threadpool to avoid blocking the event loop.",
    ],
    cliCommands: [
      { command: "pip install \"fastapi[standard]\"", description: "Install FastAPI, Uvicorn, and standard production tools." },
      { command: "fastapi dev main.py", description: "Start local development server with auto-reload and interactive docs." },
    ],
    codeExample: {
      filename: "main.py",
      language: "python",
      code: `from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

app = FastAPI(title="Masterclass API", version="1.0.0")

class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    email: EmailStr
    age: int = Field(ge=18, le=120)

async def verify_auth_token(token: str = "valid-token"):
    if token != "valid-token":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return {"user_id": "usr_9921"}

@app.post("/api/users", status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserRegister, auth: dict = Depends(verify_auth_token)):
    return {
        "status": "created",
        "user": payload.model_dump(),
        "registered_by": auth["user_id"]
    }`,
      explanation: "FastAPI endpoint with Pydantic v2 request body validation and async Dependency Injection authorization.",
    },
    bestPractices: [
      "Use def instead of async def for endpoints performing synchronous blocking I/O (e.g. traditional SQL queries).",
      "Organize large APIs using APIRouter into modular feature packages.",
    ],
    commonGotchas: [
      "Executing heavy blocking operations inside an async def endpoint blocks the entire event loop for all users.",
    ],
  },
  {
    id: "golang",
    title: "Go (Golang)",
    category: "Languages & Fundamentals",
    tagline: "Statically Typed, Compiled Language Built for Simplicity & High Concurrency",
    officialUrl: "https://go.dev/doc/",
    githubUrl: "https://github.com/golang/go",
    version: "v1.23+",
    badge: "Official",
    overview: {
      en: "Go is an open-source programming language created by Google for building simple, fast, and reliable software. Featuring lightweight Goroutines, CSP channels, fast compilation, and standalone static binaries.",
      hi: "Go (Golang) गूगल द्वारा निर्मित एक सरल और शक्तिशाली प्रोग्रामिंग भाषा है जो गो-रूटीन्स के ज़रिए हाई-कॉन्करेंसी बैकएंड और माइक्रो-सर्विसेज के लिए प्रसिद्ध है।",
    },
    keyPoints: [
          "Goroutines provide ultra-lightweight concurrent threads with initial 2KB stack sizes managed by Go runtime.",
          "Typed Channels provide thread-safe communication and synchronization between goroutines without shared memory locks.",
          "Range over function iterators (Go 1.23+) enables clean, idiomatic custom collection traversal without slice allocation.",
          "Structural interfaces are satisfied implicitly without explicit implements keywords, enabling decoupled composition.",
          "Garbage collector is engineered for sub-millisecond STW (Stop-The-World) pause times even under multi-gigabyte heaps.",
          "Defer statement guarantees execution of cleanup functions (file.Close, mutex.Unlock) upon function return.",
          "Single static binary compilation produces zero-dependency executables for containerization and edge deployment."
    ],
    keyFeatures: [
      { title: "Lightweight Goroutines", description: "M:N scheduler multiplexes thousands of lightweight goroutines over OS threads seamlessly." },
      { title: "Channels & Select", description: "Communicating Sequential Processes (CSP) concurrency model for thread-safe message passing." },
      { title: "Interface-Driven Design", description: "Implicit structural subtyping: any type implementing interface methods satisfies the contract." },
      { title: "Standard Library net/http", description: "Production-ready HTTP/2 and HTTP/3 server and client built directly into the language runtime." },
    ],
    architecturePoints: [
      "Go runtime includes an efficient non-generational concurrent tri-color mark-and-sweep garbage collector.",
      "Static single-binary output simplifies Docker deployment into tiny scratch or distroless containers.",
    ],
    cliCommands: [
      { command: "go mod init myapp", description: "Initialize a new Go module." },
      { command: "go run main.go", description: "Compile and execute Go source code directly." },
      { command: "go build -ldflags=\"-s -w\" -o server main.go", description: "Build stripped, optimized production binary." },
    ],
    codeExample: {
      filename: "main.go",
      language: "go",
      code: `package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type StatusResponse struct {
	Service string \`json:"service"\`
	Uptime  string \`json:"uptime"\`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	resp := StatusResponse{
		Service: "Masterclass Core Service",
		Uptime:  "99.99%",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	fmt.Println("Server running on :8080")
	server.ListenAndServe()
}`,
      explanation: "Production Go HTTP service using the enhanced Go 1.22+ ServeMux with method routing and JSON encoding.",
    },
    bestPractices: [
      "Always propagate and check context.Context for network timeouts and graceful cancellation.",
      "Check every returned error explicitly; never ignore errors with blank identifier _ without justification.",
    ],
    commonGotchas: [
      "Goroutine leaks occur when goroutines write to unbuffered channels without an active listener; always ensure a termination path.",
    ],
  },
  {
    id: "rust",
    title: "Rust (Systems & Web)",
    category: "Languages & Fundamentals",
    tagline: "Memory-Safe, Blazingly Fast Systems Programming with Zero Garbage Collection",
    officialUrl: "https://doc.rust-lang.org/book/",
    githubUrl: "https://github.com/rust-lang/rust",
    version: "v1.81+",
    badge: "Official",
    overview: {
      en: "Rust empowers developers to build reliable, memory-safe software without garbage collection. Its ownership and borrow checker prevent data races, null pointer dereferences, and buffer overflows at compile time.",
      hi: "Rust एक अत्याधुनिक सिस्टम प्रोग्रामिंग भाषा है जो बिना किसी गारबेज कलेक्टर के 100% मेमोरी सेफ्टी और अधिकतम गति सुनिश्चित करती है।",
    },
    keyPoints: [
          "Ownership, borrowing, and lifetime rules guarantee compile-time memory safety with zero garbage collection overhead.",
          "Concurrency without data races: the Send and Sync traits prevent thread-safety bugs at compile time.",
          "Pattern matching with exhaustive enum variants ensures every error condition and edge case is handled.",
          "Zero-cost abstractions: high-level constructs (iterators, closures) compile to machine code as fast as hand-written C.",
          "Cargo package manager handles dependency resolution, unit/integration testing, benchmarking, and documentation.",
          "Traits and trait bounds provide polymorphic behavior and generic code without runtime virtual method table overhead.",
          "RAII (Resource Acquisition Is Initialization) automatically deallocates memory and closes handles when variables leave scope."
    ],
    keyFeatures: [
      { title: "Ownership & Borrow Checker", description: "Compile-time safety model eliminating use-after-free, double-free, and data races." },
      { title: "Zero-Cost Abstractions", description: "Iterators, closures, and generics execute without runtime performance penalty." },
      { title: "Result & Option Enums", description: "Explicit type-level representation of possible errors and absent values." },
      { title: "Fearless Concurrency", description: "Send and Sync traits ensure types can only be shared across threads when completely safe." },
    ],
    architecturePoints: [
      "RAII (Resource Acquisition Is Initialization): Values are cleanly dropped and freed when their owning scope exits.",
      "Monomorphization compiles generic types into specialized machine code for each concrete type.",
    ],
    cliCommands: [
      { command: "cargo new web_service --bin", description: "Create a new binary application project using Cargo." },
      { command: "cargo check", description: "Quickly verify code compiles without generating binaries." },
      { command: "cargo run --release", description: "Compile and execute with all optimizations enabled." },
    ],
    codeExample: {
      filename: "src/main.rs",
      language: "rust",
      code: `use axum::{routing::get, response::Json, Router};
use serde::Serialize;
use std::net::SocketAddr;

#[derive(Serialize)]
struct HealthStatus {
    status: &'static str,
    version: &'static str,
}

async fn health_check() -> Json<HealthStatus> {
    Json(HealthStatus {
        status: "healthy",
        version: "v1.0.0",
    })
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/health", get(health_check));
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}`,
      explanation: "Rust Axum web service utilizing Tokio asynchronous runtime and Serde JSON serialization.",
    },
    bestPractices: [
      "Embrace the type system: use the newtype pattern to enforce domain validation rules at compile time.",
      "Avoid .unwrap() in production code; use the ? operator to propagate errors ergonomically.",
    ],
    commonGotchas: [
      "Fighting the borrow checker often indicates an over-complicated object graph; consider using IDs or arena allocators.",
    ],
  },
  {
    id: "nodejs",
    title: "Node.js",
    category: "Backend & APIs",
    tagline: "V8-Powered Asynchronous Event-Driven JavaScript Runtime Environment",
    officialUrl: "https://nodejs.org/en/docs",
    githubUrl: "https://github.com/nodejs/node",
    version: "22.12+ example",
    badge: "Official",
    overview: {
      en: "Node.js runs JavaScript outside the browser using V8. Its asynchronous I/O model supports HTTP servers and other network applications without blocking JavaScript while waiting for I/O.",
      hi: "Node.js 22 LTS में नेटिव वेब सॉकेट्स, टेस्ट रनर, और अनुमति मॉडल के साथ हाई-स्पीड बैकएंड जावास्क्रिप्ट निष्पादन मिलता है।",
    },
    keyPoints: [
          "Single-threaded event loop with libuv threadpool offloads asynchronous file system and DNS operations.",
          "Native fetch, WebSocket, and FormData APIs align Node.js directly with browser standards without third-party libraries.",
          "Native test runner (node:test) and assertion library (node:assert) eliminate external test framework dependencies.",
          "Native Watch Mode (node --watch) automatically restarts processes when monitored files change.",
          "Dual CommonJS and ES Modules support with package.json exports field and subpath imports (#internal).",
          "Worker Threads enable parallel CPU-intensive computing without spawning full standalone processes.",
          "Diagnostic reporting and v8 heap profiling tools diagnose memory leaks and event loop lag in production."
    ],
    keyFeatures: [
      { title: "Native node:test Runner", description: "Comprehensive test runner supporting mocks, coverage, watch mode, and TAP output." },
      { title: "Native Web Standards", description: "Global fetch, WebSocket, AbortController, and Web Streams matching browser standards." },
      { title: "Worker Threads Module", description: "Execute CPU-heavy algorithms in parallel worker threads without stalling event loop I/O." },
      { title: "Watch Mode (--watch)", description: "Automatically reboots applications upon source code changes without nodemon." },
    ],
    architecturePoints: [
      "libuv provides the cross-platform abstraction for the event loop, thread pool, and non-blocking asynchronous I/O.",
      "V8 engine compiles JavaScript directly to native machine code with inline caching.",
    ],
    cliCommands: [
      { command: "node --version", description: "Verify Node.js version." },
      { command: "node --test", description: "Execute test suite using native built-in test runner." },
      { command: "node --watch app.js", description: "Run application with native file watcher." },
    ],
    codeExample: {
      filename: "server.mjs",
      language: "javascript",
      code: `import { createServer } from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';

export function createApiServer() {
  return createServer((req, res) => {
    if (req.url === '/api/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'pong', timestamp: Date.now() }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
}

// Built-in node:test execution
test('API responds with pong on /api/ping', async () => {
  const server = createApiServer().listen(0);
  const port = server.address().port;
  const res = await fetch(\`http://localhost:\${port}/api/ping\`);
  const data = await res.json();
  assert.equal(data.message, 'pong');
  server.close();
});`,
      explanation: "Native Node.js HTTP server paired with the built-in node:test and node:assert/strict test suite.",
    },
    bestPractices: [
      "Always handle unhandledRejection and uncaughtException to log critical errors before graceful shutdown.",
      "Use worker_threads for intensive calculations (encryption, image resizing) to prevent blocking the event loop.",
    ],
    commonGotchas: [
      "Synchronous filesystem calls (fs.readFileSync) block the entire Node.js process; always use fs/promises.",
    ],
  },
  {
    id: "langchain",
    title: "LangChain",
    category: "AI & Agents",
    tagline: "Framework for Developing Applications Powered by Large Language Models",
    officialUrl: "https://js.langchain.com/docs",
    githubUrl: "https://github.com/langchain-ai/langchainjs",
    version: "v0.3+",
    badge: "Official",
    overview: {
      en: "LangChain provides composable primitives for building LLM applications. Featuring LangChain Expression Language (LCEL), tool calling, vector store retrievers, prompt templates, and streaming output.",
      hi: "LangChain LLM आधारित एप्लिकेशन्स और ऑटोमेटेड टूल्स को आपस में जोड़कर AI पाइपलाइन्स बनाने का फ्रेमवर्क है।",
    },
    keyPoints: [
          "LangChain Expression Language (LCEL) provides declarative, composable composition of prompt templates, models, and parsers.",
          "Built-in streaming and async execution across all LCEL runnable chains for responsive AI interfaces.",
          "Vector store abstractions and document loaders streamline ingestion and retrieval for RAG architectures.",
          "Output parsers convert raw LLM text into validated, type-safe JSON, Pydantic models, or typed objects.",
          "Memory management strategies maintain multi-turn chat history, summarization, and vector store session context.",
          "Fallbacks and model retries handle rate limits and transient upstream API provider outages automatically.",
          "Native LangSmith instrumentation traces inputs, token usage, latency, and intermediate reasoning steps."
    ],
    keyFeatures: [
      { title: "LangChain Expression Language (LCEL)", description: "Declarative composition of components with unified streaming, async, and parallel execution." },
      { title: "Tool Calling & Agents", description: "Bind schemas and functions for LLMs to invoke external calculations, databases, and APIs." },
      { title: "RAG & Vector Retrieval", description: "Modular text splitters, embedding models, and vector database integrations for semantic search." },
      { title: "Output Parsers", description: "Structure model responses into validated JSON, Zod schemas, or typed objects." },
    ],
    architecturePoints: [
      "Runnable protocol implements invoke, stream, batch, and astream_events uniformly across all components.",
      "Callbacks provide telemetry hooks for token counting, latency tracking, and LangSmith tracing.",
    ],
    cliCommands: [
      { command: "npm install langchain @langchain/core @langchain/openai", description: "Install LangChain core and OpenAI integration." },
    ],
    codeExample: {
      filename: "ai/rag-chain.ts",
      language: "typescript",
      code: `import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.2 });

const prompt = PromptTemplate.fromTemplate(
  'You are an expert tutor. Explain the core concept of {topic} concisely in 2 sentences.'
);

// LCEL pipeline
export const tutorChain = RunnableSequence.from([
  prompt,
  model,
  new StringOutputParser(),
]);

export async function explainTopic(topic: string) {
  const result = await tutorChain.invoke({ topic });
  return result;
}`,
      explanation: "LangChain Expression Language (LCEL) pipeline combining a PromptTemplate, Chat Model, and StringOutputParser.",
    },
    bestPractices: [
      "Always stream responses using chain.stream() in web apps to reduce time-to-first-token (TTFT).",
      "Use Zod schemas with StructuredOutputParser to guarantee structured JSON output from models.",
    ],
    commonGotchas: [
      "Neglecting temperature settings can lead to non-deterministic, hallucinatory tool calls.",
    ],
  },
  {
    id: "langgraph",
    title: "LangGraph",
    category: "AI & Agents",
    tagline: "Build Resilient, Stateful Multi-Agent Applications with Cycles",
    officialUrl: "https://langchain-ai.github.io/langgraphjs/",
    githubUrl: "https://github.com/langchain-ai/langgraphjs",
    version: "v0.2+",
    badge: "Official",
    overview: {
      en: "LangGraph enables the creation of cyclical, stateful multi-agent workflows. It models agent decisions as graphs with nodes (actions), edges (conditional branching), checkpointing, and human-in-the-loop approvals.",
      hi: "LangGraph चक्रीय और स्टेटफुल मल्टी-एजेंट सिस्टम बनाने के लिए ग्राफ-आधारित फ्रेमवर्क है जिसमें ह्यूमन-इन-द-लूप सपोर्ट है।",
    },
    keyPoints: [
          "Cyclic state machine graph architecture handles loops, conditional routing, and multi-agent coordination.",
          "Centralized StateGraph passes structured state dictionaries across nodes with configurable reduction functions.",
          "Human-in-the-Loop workflows allow pausing execution at checkpoints for human approval, input, and time-travel debugging.",
          "Durable persistence backends (PostgreSQL, SQLite, Memory) store complete execution checkpoint histories.",
          "Streaming mode outputs graph state updates token-by-token and node-by-node in real time.",
          "Subgraph composition enables hierarchical multi-agent teams where agents act as subgraphs with private states.",
          "Fault-tolerant resumption allows restarting failed agent runs from the exact last successful node checkpoint."
    ],
    keyFeatures: [
      { title: "Cyclical Agent Workflows", description: "Unlike linear DAGs, LangGraph allows loops and cycles essential for iterative code generation and validation." },
      { title: "State Management & Reducers", description: "Define custom state schemas where nodes return updates merged via reducer channels." },
      { title: "Time Travel & Checkpointing", description: "Inspect, rewind, and branch from any previous step of an agent's execution history." },
      { title: "Human-in-the-Loop Interrupts", description: "Pause execution before high-risk actions to request manual human approval or clarification." },
    ],
    architecturePoints: [
      "State channels determine how updates from concurrent nodes are accumulated or overwritten.",
      "Checkpointer interface persists full graph snapshots to PostgreSQL, Redis, or memory after every step.",
    ],
    cliCommands: [
      { command: "npm install @langchain/langgraph @langchain/core", description: "Install LangGraph and LangChain Core." },
    ],
    codeExample: {
      filename: "ai/agent-graph.ts",
      language: "typescript",
      code: `import { StateGraph, END, START, Annotation } from '@langchain/langgraph';

// Define the state schema
const AgentState = Annotation.Root({
  query: Annotation<string>,
  attempts: Annotation<number>({ reducer: (x, y) => x + y, default: () => 0 }),
  isResolved: Annotation<boolean>,
});

async function evaluateAnswer(state: typeof AgentState.State) {
  const isResolved = state.query.includes('verified');
  return { attempts: 1, isResolved };
}

function shouldContinue(state: typeof AgentState.State) {
  if (state.isResolved || state.attempts >= 3) return END;
  return 'evaluator';
}

const workflow = new StateGraph(AgentState)
  .addNode('evaluator', evaluateAnswer)
  .addEdge(START, 'evaluator')
  .addConditionalEdges('evaluator', shouldContinue);

export const appGraph = workflow.compile();`,
      explanation: "LangGraph stateful workflow featuring cyclical conditional edges and state reducers.",
    },
    bestPractices: [
      "Set sensible max-iterations limits in conditional edges to prevent infinite agent loop runaways.",
      "Use persistent checkpointers (PostgresSaver) in production to survive server restarts.",
    ],
    commonGotchas: [
      "Mutating state directly inside a node without returning an update dictionary breaks time-travel checkpointing.",
    ],
  },
  {
    id: "langsmith",
    title: "LangSmith",
    category: "AI & Agents",
    tagline: "The DevOps Platform for LLMs: Observability, Evaluation & Monitoring",
    officialUrl: "https://docs.smith.langchain.com",
    githubUrl: "https://github.com/langchain-ai/langsmith-sdk",
    version: "v0.1+",
    badge: "Official",
    overview: {
      en: "LangSmith provides complete observability and telemetry for LLM applications. Track exact input/output tokens, latency, cost per trace, debug agent step failures, and run automated regression evaluation datasets.",
      hi: "LangSmith LLMs और AI एजेंट्स के लिए मॉनिटरिंग, टोकन ट्रैकिंग, डिबगिंग और इवैल्यूएशन का प्रमुख प्लेटफॉर्म है।",
    },
    keyPoints: [
          "Full-visibility execution tracing logs every LLM call, prompt, output, latency, and token cost in real time.",
          "Automated datasets and benchmark evaluation suites evaluate agent performance against golden test cases.",
          "LLM-as-a-judge evaluators grade response accuracy, hallucination rate, conciseness, and toxicity automatically.",
          "Production monitoring dashboards track prompt token inflation, error spikes, and p99 latency regressions.",
          "Online evaluation queues route real user interactions to human annotators for continuous feedback loops.",
          "Prompt playground allows iterating on prompt variations and comparing outputs side-by-side across models.",
          "End-to-end tracing seamlessly integrates with LangChain, LangGraph, and native OpenAI/Anthropic/Gemini SDKs."
    ],
    keyFeatures: [
      { title: "End-to-End Distributed Tracing", description: "Inspect every nested LLM call, prompt formatting step, and tool execution in a timeline view." },
      { title: "Dataset Evaluation & Benchmarks", description: "Run automated evaluation suites across model versions to detect accuracy regressions before deployment." },
      { title: "Token & Cost Analytics", description: "Monitor token expenditures and latency percentiles (p50, p95, p99) per model and prompt version." },
      { title: "Human Feedback Annotation", description: "Capture user ratings, thumbs up/down, and corrections linked directly to the underlying trace." },
    ],
    architecturePoints: [
      "Background worker threads upload telemetry traces asynchronously without blocking the user-facing request latency.",
      "Hierarchical Run trees link parent agent decisions to child tool invocations.",
    ],
    cliCommands: [
      { command: "npm install langsmith", description: "Install LangSmith SDK." },
    ],
    codeExample: {
      filename: "lib/langsmith-tracer.ts",
      language: "typescript",
      code: `import { Client } from 'langsmith';
import { traceable } from 'langsmith/traceable';

const client = new Client({ apiKey: process.env.LANGSMITH_API_KEY });

// Wrap functions with traceable for automatic telemetry
export const runModelPipeline = traceable(
  async function runModelPipeline(input: string) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: input }],
      }),
    });
    return await response.json();
  },
  { name: 'OpenAI Chat Pipeline' }
);`,
      explanation: "Using the LangSmith traceable wrapper to capture execution traces, latency, and tokens automatically.",
    },
    bestPractices: [
      "Tag traces with user identifiers, environments (production/staging), and feature flags for easy filtering.",
      "Build regression evaluation datasets from production failure traces to guard against prompt degradation.",
    ],
    commonGotchas: [
      "Leaving debug traces enabled in local test suites without project tags can pollute production metrics.",
    ],
  },
  {
    id: "docker",
    title: "Docker & Containers",
    category: "DevOps & Cloud",
    tagline: "Standardized Lightweight Containerization and Multi-Stage Image Builds",
    officialUrl: "https://docs.docker.com",
    githubUrl: "https://github.com/docker/cli",
    version: "v27.x+",
    badge: "Official",
    overview: {
      en: "Docker packages applications and their complete runtime dependencies into isolated containers. Features BuildKit acceleration, multi-stage Dockerfiles for minimal production images, and Docker Compose for multi-service orchestration.",
      hi: "Docker एप्लिकेशन्स और उनकी सभी डिपेंडेंसियों को कंटेनर्स में पैक करता है ताकि वे किसी भी सर्वर पर बिना किसी अंतर के चल सकें।",
    },
    keyPoints: [
          "OS-level virtualization packages applications and all runtime dependencies into immutable, portable OCI images.",
          "Multi-stage builds dramatically reduce production image footprints by isolating build toolchains from final artifacts.",
          "Layer caching accelerates build cycles by reusing unchanged filesystem layers during consecutive docker builds.",
          "Docker Compose orchestrates multi-container applications (web app, database, redis, worker) with declarative YAML.",
          "Non-root user execution and read-only filesystems harden container security against privilege escalation.",
          "Healthchecks (HEALTHCHECK directive) allow container runtimes to detect hung or unhealthy application processes.",
          "Bridge and overlay networks provide isolated container-to-container communication with integrated internal DNS."
    ],
    keyFeatures: [
      { title: "Multi-Stage Dockerfiles", description: "Separate build and production environments to produce tiny, unprivileged images with minimal attack surfaces." },
      { title: "BuildKit Build Engine", description: "Parallelized build graph execution, cache mounts, and secure secret injection during builds." },
      { title: "Docker Compose v2", description: "Declarative YAML definitions for multi-container development and integration testing." },
      { title: "Container Healthchecks", description: "Automated container liveness checks restarting unhealthy processes before customer impact." },
    ],
    architecturePoints: [
      "Uses container storage drivers (overlay2) for copy-on-write image layer sharing.",
      "Bridge networks isolate container communication from the host network.",
    ],
    cliCommands: [
      { command: "docker buildx build -t masterclass-app:latest --target runner .", description: "Build an optimized multi-stage production container image." },
      { command: "docker compose up -d", description: "Launch multi-container environment in the background." },
      { command: "docker system prune -af --volumes", description: "Clean up unused images, stopped containers, and dangling volumes." },
    ],
    codeExample: {
      filename: "Dockerfile",
      language: "dockerfile",
      code: `# Multi-stage production Next.js Dockerfile
FROM node:22-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Stage 2: Build source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Minimal runner image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]`,
      explanation: "Production 3-stage Dockerfile for Next.js standalone mode with non-root user execution and minimal image size.",
    },
    bestPractices: [
      "Always run containers as a non-root user (USER nextjs) to mitigate container breakout vulnerabilities.",
      "Use .dockerignore to exclude .git, node_modules, and environment files from the build context.",
    ],
    commonGotchas: [
      "Baking sensitive environment variables (.env) directly into Docker layers exposes secrets publicly.",
    ],
  },
  {
    id: "kubernetes",
    title: "Kubernetes (K8s)",
    category: "DevOps & Cloud",
    tagline: "Automated Container Deployment, Scaling & Resilient Cloud Orchestration",
    officialUrl: "https://kubernetes.io/docs/",
    githubUrl: "https://github.com/kubernetes/kubernetes",
    version: "v1.31+",
    badge: "Official",
    overview: {
      en: "Kubernetes is the industry-standard open-source container orchestration engine. It automates container deployment, horizontal scaling, self-healing, rolling updates, and service discovery across server clusters.",
      hi: "Kubernetes बड़े पैमाने पर कंटेनर्स के डिप्लॉयमेंट, ऑटो-स्केलिंग और सेल्फ-हीलिंग को प्रबंधित करने का वैश्विक मानक है।",
    },
    keyPoints: [
          "Declarative desired-state reconciliation: controllers continuously align live cluster state with YAML manifests.",
          "Deployments manage ReplicaSets for zero-downtime rolling updates, canary releases, and instant rollbacks.",
          "Services provide stable internal IP addresses and DNS records across dynamically ephemeral Pod IP addresses.",
          "Horizontal Pod Autoscaler (HPA) automatically adjusts replica counts based on live CPU, memory, and custom metrics.",
          "ConfigMaps and Secrets decouple configuration artifacts and sensitive credentials from container binaries.",
          "Liveness and readiness probes prevent routing user traffic to booting or hung application containers.",
          "Ingress controllers manage HTTP/HTTPS routing, SSL termination, and host-based traffic splitting into cluster services."
    ],
    keyFeatures: [
      { title: "Declarative Deployments & Rollouts", description: "Zero-downtime rolling updates with configurable maxSurge and maxUnavailable thresholds." },
      { title: "Service Discovery & Load Balancing", description: "Expose Pods through ClusterIP, NodePort, and Ingress with integrated round-robin balancing." },
      { title: "Horizontal Pod Autoscaler (HPA)", description: "Scale replicas dynamically between min and max bounds based on live CPU and memory telemetry." },
      { title: "ConfigMaps & Secrets", description: "Decouple configuration artifacts and credentials from container image binaries." },
    ],
    architecturePoints: [
      "Control Plane consists of kube-apiserver, etcd (distributed state), kube-scheduler, and controller-manager.",
      "Node components include kubelet (node agent), kube-proxy (network rules), and the container runtime (containerd).",
    ],
    cliCommands: [
      { command: "kubectl apply -f deployment.yaml", description: "Apply declarative resource configuration to cluster." },
      { command: "kubectl get pods -A -o wide", description: "List all pods across all namespaces with node allocations." },
      { command: "kubectl rollout status deployment/web-api", description: "Monitor the progress of a rolling deployment." },
    ],
    codeExample: {
      filename: "k8s/deployment.yaml",
      language: "yaml",
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: masterclass-api
  labels:
    app: masterclass-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: masterclass-api
  template:
    metadata:
      labels:
        app: masterclass-api
    spec:
      containers:
      - name: api
        image: masterclass-api:v1.2.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5`,
      explanation: "Production Kubernetes Deployment manifest with resource requests, limits, and liveness/readiness probes.",
    },
    bestPractices: [
      "Always define both resource requests and limits to enable predictable scheduling and prevent noisy-neighbor node starvation.",
      "Configure distinct liveness and readiness probes to avoid routing traffic to booting containers.",
    ],
    commonGotchas: [
      "Using imageTag: latest prevents deterministic rollouts and can cause nodes to pull conflicting container versions.",
    ],
  },
  {
    id: "aws",
    title: "AWS Cloud Services",
    category: "DevOps & Cloud",
    tagline: "Global Cloud Infrastructure: Compute, Storage, Networking & Serverless",
    officialUrl: "https://docs.aws.amazon.com",
    githubUrl: "https://github.com/aws/aws-sdk-js-v3",
    version: "v3 SDK",
    badge: "Official",
    overview: {
      en: "Amazon Web Services (AWS) provides world-leading on-demand cloud computing. Core architecture revolves around S3 (object storage), Lambda (serverless compute), DynamoDB (NoSQL), CloudFront (CDN), and ECS/EKS (containers).",
      hi: "AWS दुनिया का अग्रणी क्लाउड प्लेटफॉर्म है जो S3, लैम्ब्डा, डायनेमोDB और क्लाउडफ्रंट के ज़रिए सुरक्षित और स्केलेबल इंफ्रास्ट्रक्चर देता है।",
    },
    keyPoints: [
          "Amazon S3 provides 99.999999999% (11 9s) of data durability with automated lifecycle storage class tiering.",
          "AWS Lambda executes event-driven code with sub-second billing, automated scaling, and zero idle server costs.",
          "DynamoDB provides single-digit millisecond latency at any scale with global secondary indexes and ACID transactions.",
          "Amazon CloudFront global CDN caches static assets and runs Edge functions closer to end users worldwide.",
          "IAM roles and policies enforce least-privilege access across microservices without hardcoded credentials.",
          "VPC (Virtual Private Cloud) separates public ingress subnets from isolated private database and worker subnets.",
          "CloudWatch and X-Ray provide centralized logging, real-time alerting, and distributed microservice tracing."
    ],
    keyFeatures: [
      { title: "S3 Object Storage", description: "Scalable storage with bucket policies, pre-signed URLs, lifecycle tiering, and versioning." },
      { title: "Lambda Serverless Functions", description: "Event-driven compute scaling instantly from zero to thousands of concurrent requests." },
      { title: "DynamoDB NoSQL Database", description: "Fully managed key-value and document database delivering single-digit millisecond responses." },
      { title: "CloudFront Global CDN", description: "Global edge network caching static assets and executing Edge functions closer to end users." },
    ],
    architecturePoints: [
      "VPC (Virtual Private Cloud) separates public ingress subnets from private database and worker subnets.",
      "IAM roles allow EC2, Lambda, and ECS to assume temporary credentials without hardcoded API keys.",
    ],
    cliCommands: [
      { command: "aws s3 sync ./dist s3://my-app-bucket --delete", description: "Synchronize local build directory to S3 bucket." },
      { command: "aws lambda update-function-code --function-name api --zip-file fileb://build.zip", description: "Deploy new code bundle to AWS Lambda." },
    ],
    codeExample: {
      filename: "lib/aws-s3.ts",
      language: "typescript",
      code: `import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

export async function generateUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // Pre-signed URL valid for 15 minutes
  return await getSignedUrl(s3, command, { expiresIn: 900 });
}`,
      explanation: "AWS SDK v3 modular S3 client generating secure pre-signed upload URLs for direct client uploads.",
    },
    bestPractices: [
      "Use pre-signed S3 URLs so clients upload media directly to S3 rather than routing multi-megabyte payloads through your server.",
      "Enforce least-privilege IAM policies granting only the specific S3 action on the specific ARN resource.",
    ],
    commonGotchas: [
      "Leaving S3 buckets without 'Block Public Access' can inadvertently expose private customer assets publicly.",
    ],
  },
  {
    id: "devops",
    title: "Modern DevOps & Site Reliability",
    category: "DevOps & Cloud",
    tagline: "Infrastructure as Code, Continuous Observability & Production Reliability",
    officialUrl: "https://sre.google",
    githubUrl: "https://github.com/open-telemetry/opentelemetry-specification",
    version: "SRE Standard",
    badge: "Official",
    overview: {
      en: "DevOps practices combine software development and IT operations to shorten the development lifecycle. Built around Infrastructure as Code (Terraform), OpenTelemetry observability, SLO/SLA reliability engineering, and automated rollouts.",
      hi: "आधुनिक DevOps और SRE इंफ्रास्ट्रक्चर एज़ कोड, ऑटोमेशन और ओपन-टेलीमेट्री के ज़रिए 99.99% अपटाइम सुनिश्चित करते हैं।",
    },
    keyPoints: [
          "Infrastructure as Code (Terraform, Pulumi) ensures cloud infrastructure is version-controlled, auditable, and reproducible.",
          "Service Level Objectives (SLOs) and Error Budgets balance new feature velocity against production stability.",
          "OpenTelemetry standardizes telemetry collection (distributed traces, metrics, logs) across all application services.",
          "Blue/Green and Canary deployment strategies minimize risk by routing small percentages of live traffic to new versions.",
          "Automated incident runbooks and blameless postmortems foster systemic reliability improvements.",
          "Chaos engineering tests system resilience by proactively injecting network latency, pod failures, and disk full states.",
          "GitOps (ArgoCD, Flux) continuously synchronizes live cluster state with version-controlled Git repositories."
    ],
    keyFeatures: [
      { title: "Infrastructure as Code (IaC)", description: "Define cloud resources declaratively using Terraform, OpenTofu, or Pulumi." },
      { title: "OpenTelemetry Standards", description: "Vendor-neutral collection of distributed traces, metrics, and logs across microservices." },
      { title: "SLO & Error Budgeting", description: "Define measurable reliability targets (e.g. 99.95% successful requests) to drive release velocity." },
      { title: "Chaos Engineering & Health Probes", description: "Proactively test resilience against network latency, node restarts, and regional outages." },
    ],
    architecturePoints: [
      "Golden Signals of monitoring: Latency, Traffic (requests/sec), Errors (5xx rate), and Saturation (CPU/memory capacity).",
      "GitOps: Git repository acts as the authoritative source of truth for all deployed infrastructure state.",
    ],
    cliCommands: [
      { command: "terraform init && terraform plan", description: "Initialize Terraform working directory and preview execution plan." },
      { command: "terraform apply -auto-approve", description: "Apply changes to target cloud infrastructure." },
    ],
    codeExample: {
      filename: "infra/main.tf",
      language: "hcl",
      code: `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "app_storage" {
  bucket = "masterclass-prod-assets-2026"

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = aws_s3_bucket.app_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`,
      explanation: "Terraform HCL configuration creating a secure, locked-down AWS S3 bucket with public access blocked.",
    },
    bestPractices: [
      "Store Terraform state files in a remote backend (S3 + DynamoDB locking) to prevent team state corruption.",
      "Use structured JSON logging across all backend services to enable instant querying in Datadog/CloudWatch.",
    ],
    commonGotchas: [
      "Hardcoding credentials or static IPs inside Terraform manifests violates security and portability requirements.",
    ],
  },
  {
    id: "git",
    title: "Git Version Control",
    category: "Tooling & CI/CD",
    tagline: "Distributed Version Control System & Collaborative Git Workflows",
    officialUrl: "https://git-scm.com/doc",
    githubUrl: "https://github.com/git/git",
    version: "v2.46+",
    badge: "Official",
    overview: {
      en: "Git is a distributed version control system designed to handle everything from small to large projects with speed and efficiency. Core workflows include branching, rebasing, bisecting, cherry-picking, and worktree isolation.",
      hi: "Git एक वितरित वर्ज़न कंट्रोल सिस्टम है जो कोड के इतिहास, ब्रांचिंग, रिबेसिंग और टीम सहयोग को सटीक रूप से संभालता है।",
    },
    keyPoints: [
          "Distributed content-addressable storage models history as an immutable directed acyclic graph (DAG) of commit objects.",
          "Interactive rebasing (git rebase -i) cleans up commit histories, squashes intermediate WIPs, and clarifies intent.",
          "Git Bisect performs binary searches across commit history to rapidly identify the exact commit that introduced a bug.",
          "Git Worktree allows checking out multiple branches simultaneously into separate directories without stashing.",
          "Three-tree architecture (Working Directory, Staging Index, Commit History) provides complete control over changes.",
          "Merge vs. Rebase workflows balance preserving historical branch context against maintaining linear git histories.",
          "Cherry-pick allows porting specific bug fixes or features across release branches without merging entire branches."
    ],
    keyFeatures: [
      { title: "Interactive Rebase (rebase -i)", description: "Clean up, squash, reword, and reorder commits before merging into main branches." },
      { title: "Binary Search Debugging (git bisect)", description: "Automated binary search locating the exact commit introducing a regression." },
      { title: "Git Worktrees", description: "Check out multiple branches simultaneously into separate folders without stashing changes." },
      { title: "Cryptographic Commit Signing", description: "Verify commit authenticity using SSH or GPG signatures ensuring trust." },
    ],
    architecturePoints: [
      "Object database: Blobs (file contents), Trees (directories), Commits (metadata + tree pointer), and Annotated Tags.",
      "All objects are addressed immutably via their SHA-1/SHA-256 cryptographic hashes.",
    ],
    cliCommands: [
      { command: "git checkout -b feature/auth-flow", description: "Create and switch to a new feature branch." },
      { command: "git rebase -i HEAD~4", description: "Launch interactive rebase to squash or edit the last 4 commits." },
      { command: "git bisect start && git bisect bad && git bisect good v1.0.0", description: "Initiate automated binary search for bug identification." },
    ],
    codeExample: {
      filename: "scripts/git-workflow.sh",
      language: "bash",
      code: `#!/usr/bin/env bash
set -euo pipefail

# 1. Fetch latest changes from upstream
git fetch origin main

# 2. Rebase feature branch on top of main
git rebase origin/main

# 3. Verify clean working tree and tests pass
npm run typecheck
npm test

# 4. Push verified branch with lease protection
git push origin feature/auth-flow --force-with-lease`,
      explanation: "Best-practice feature branch synchronization script using rebase and force-with-lease.",
    },
    bestPractices: [
      "Always use git push --force-with-lease instead of --force to avoid overwriting teammates' commits.",
      "Write atomic commits with descriptive imperative mood summaries ('Fix race condition in token refresher').",
    ],
    commonGotchas: [
      "Never rebase public shared branches (like main); rebase only private feature branches before merging.",
    ],
  },
  {
    id: "cicd",
    title: "GitHub Actions & CI/CD",
    category: "Tooling & CI/CD",
    tagline: "Automated Pipelines: GitHub Actions, Quality Gates & Zero-Downtime Releases",
    officialUrl: "https://docs.github.com/en/actions",
    githubUrl: "https://github.com/actions",
    version: "GitHub Actions v4",
    badge: "Official",
    overview: {
      en: "Continuous Integration and Continuous Deployment (CI/CD) automates building, linting, testing, security vulnerability scanning, and multi-environment deployment upon every git push or pull request.",
      hi: "CI/CD ऑटोमेशन हर कोड बदलाव पर स्वचालित टेस्टिंग, सुरक्षा जांच और प्रोडक्शन डिप्लॉयमेंट करता है।",
    },
    keyPoints: [
          "Automated pull request validation runs linting, typechecking, and test suites before code is merged into main.",
          "Matrix strategy builds and tests across multiple operating systems and runtime versions concurrently.",
          "OIDC (OpenID Connect) enables passwordless, keyless cloud deployment authentication without storing long-lived cloud secrets.",
          "Dependency caching (npm, pip, cargo) drastically accelerates CI pipeline runtimes by avoiding redundant downloads.",
          "Concurrency groups automatically cancel outdated in-flight builds when new commits are pushed to the same branch.",
          "Protected environments and manual approvals enforce compliance before promoting builds from staging to production.",
          "Automated release pipelines publish semantic version tags, changelogs, and container images upon merge to release branches."
    ],
    keyFeatures: [
      { title: "Matrix Build Strategies", description: "Execute test suites across multiple operating systems and language runtimes simultaneously." },
      { title: "Dependency Caching", description: "Cache node_modules, pip wheels, and compiler caches to reduce pipeline runtimes by up to 80%." },
      { title: "OIDC Cloud Authentication", description: "Authenticate to AWS, GCP, and Azure using short-lived tokens without long-lived secret keys." },
      { title: "Automated Release Tagging", description: "Generate semantic versioning tags and GitHub Releases based on conventional commits." },
    ],
    architecturePoints: [
      "Workflows consist of Jobs running on isolated virtual runner environments (Ubuntu, macOS, Windows).",
      "Artifact passing transfers built assets from build jobs to downstream deployment jobs.",
    ],
    cliCommands: [
      { command: "gh workflow run deploy.yml --ref main", description: "Manually trigger a GitHub Actions deployment workflow via the GitHub CLI." },
    ],
    codeExample: {
      filename: ".github/workflows/ci.yml",
      language: "yaml",
      code: `name: Production CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js runtime
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Typecheck
        run: npm run typecheck

      - name: Run Test Suite
        run: npm test

      - name: Build Production Bundle
        run: npm run build`,
      explanation: "GitHub Actions workflow validating dependencies, type safety, test suites, and production builds.",
    },
    bestPractices: [
      "Pin third-party GitHub Actions to immutable full commit SHAs for supply chain security.",
      "Use concurrency groups with cancel-in-progress: true to cancel outdated pull request builds.",
    ],
    commonGotchas: [
      "Running npm install instead of npm ci in CI pipelines can install unvetted package versions.",
    ],
  },
  ...additionalDocumentation(DOCS_PROJECTS),
  ...BACKEND_DOCS,
];
