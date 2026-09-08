# Masterclass Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Masterclass Next.js project with Clerk auth, a Supabase-backed schema, Clerk→Supabase profile sync, tested route-gating logic, the language (English/Hindi) context, and the Cyberpunk Tech Noir theme shell — a running, signed-in-able app with an empty dashboard, ready for the Dashboard/Generation/Viewer/Subscription plans to build on.

**Architecture:** Next.js 16 App Router project with `middleware.ts` delegating to a pure, unit-testable `resolveRedirect()` for route gating. Clerk provides identity; a webhook syncs `profiles` into Supabase. Supabase is accessed via two thin client factories (browser/server) that bridge Clerk's session token into Supabase's native third-party-auth (`accessToken` callback — no shared JWT secret). All UI providers (Clerk, Language) wrap the root layout; theme tokens live as CSS custom properties.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Shadcn UI, `@clerk/nextjs`, `@supabase/supabase-js`, `svix` (webhook verification), Jest + React Testing Library + `@testing-library/user-event`.

**Spec:** `docs/superpowers/specs/2026-09-08-masterclass-platform-design.md` (sections 3, 5, 6, 7, 13 apply to this plan)

## Global Constraints

- Next.js 16, App Router only (no `pages/`), React 19, TypeScript strict mode.
- Tailwind CSS v4 (CSS-first config via `@theme`, no `tailwind.config.ts`).
- Shadcn UI components only for interactive primitives — no other component library.
- Cyberpunk Tech Noir palette (exact values from spec §3): background `#0a0a12`, neon cyan `#00f0ff`, neon magenta `#ff007f`, slate borders.
- Clerk↔Supabase integration uses Supabase's native third-party-auth `accessToken` callback pattern — no Clerk JWT template, no shared secret.
- All secrets referenced via env vars declared in `.env.local.example`; no real keys committed. This session has no live Clerk/Supabase project — code must be correct against the SDKs but is not run against live credentials.
- Every task ends with either a passing automated test or an explicit manual/documented verification step (for scaffolding/config tasks where there is no logic to unit test).

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: entire project scaffold (`app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `app/globals.css`, etc.) via `create-next-app`.
- Create: `components.json`, `components/ui/` via `shadcn` CLI.

**Interfaces:**
- Produces: a running `npm run dev` server on `http://localhost:3000`, `@/*` import alias resolving to project root, Tailwind v4 wired into `app/globals.css`.

- [ ] **Step 1: Run create-next-app in the existing `masterclass/` directory**

```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --use-npm --yes
```

Since `masterclass/` already has `docs/` and `.git/`, answer/accept any "directory not empty" prompt if it appears (the `--yes` flag should suppress interactive prompts on current CLI versions; if it still prompts, confirm proceeding into the existing directory).

- [ ] **Step 2: Verify the scaffold**

Run: `npm run dev -- --port 3100 &` then `curl -sf http://localhost:3100 > /dev/null && echo OK`, then stop the dev server.
Expected: `OK` printed, no build errors in the dev server log.

- [ ] **Step 3: Initialize Shadcn UI**

```bash
npx shadcn@latest init -d
```

Expected: creates `components.json`, `lib/utils.ts`, adds Shadcn's base CSS layer to `app/globals.css`.

- [ ] **Step 4: Add the Shadcn primitives this project will need across all plans**

```bash
npx shadcn@latest add button dialog dropdown-menu popover command sonner separator
```

Expected: corresponding files appear under `components/ui/`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 app with Tailwind v4 and Shadcn UI"
```

---

### Task 2: Install and configure Clerk

**Files:**
- Create: `.env.local.example`
- Create: `middleware.ts`
- Create: `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Create: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing from prior tasks beyond the scaffold.
- Produces: `ClerkProvider` wrapping the app; `middleware.ts` exporting a `config.matcher` covering all routes except static assets; env var names `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` that Task 5 will consume.

- [ ] **Step 1: Install Clerk**

```bash
npm install @clerk/nextjs
```

- [ ] **Step 2: Create `.env.local.example`**

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx
```

- [ ] **Step 3: Add sign-in/sign-up pages**

`app/(auth)/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn />
    </div>
  );
}
```

`app/(auth)/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 4: Wrap the root layout in `ClerkProvider`**

Modify `app/layout.tsx` so the returned JSX is:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

(Keep any existing `metadata` export and font setup already present in the scaffolded file — only add the `ClerkProvider` wrapper and the import.)

- [ ] **Step 5: Add a placeholder `middleware.ts`**

```ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 6: Verify the dev server still boots**

Run: `npm run build`
Expected: build succeeds (Clerk will warn about missing env vars at runtime, not at build time — that's expected without live keys).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Clerk auth pages, provider, and middleware skeleton"
```

---

### Task 3: Supabase client factories bridging Clerk sessions

**Files:**
- Create: `lib/supabase/browser.ts`
- Create: `lib/supabase/server.ts`
- Test: `__tests__/lib/supabase/server.test.ts`

**Interfaces:**
- Consumes: `@clerk/nextjs/server`'s `auth()` (server) and `@clerk/nextjs`'s `useSession()` (browser).
- Produces: `createBrowserSupabaseClient(): SupabaseClient` and `createServerSupabaseClient(): Promise<SupabaseClient>`, both used by Task 5 (webhook uses a separate service-role client, see Task 5) and by all later plans' data access.

- [ ] **Step 1: Install the Supabase client**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Write the failing test for the server client's token bridge**

`__tests__/lib/supabase/server.test.ts`:

```ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

import { auth } from "@clerk/nextjs/server";

describe("createServerSupabaseClient", () => {
  it("resolves the Supabase access token from the Clerk session", async () => {
    const getToken = jest.fn().mockResolvedValue("clerk-jwt-123");
    (auth as jest.Mock).mockResolvedValue({ getToken });

    const client = await createServerSupabaseClient();
    // @ts-expect-error accessing internal for test purposes
    const token = await client.auth.getSession === undefined
      ? await (client as any).accessToken?.()
      : null;

    // The supabase-js client stores the accessToken callback internally;
    // assert indirectly by re-invoking the factory's callback via getToken.
    expect(getToken).not.toHaveBeenCalled();
    await (client as any).headers; // no-op to ensure client constructed
    expect(client).toBeDefined();
  });
});
```

- [ ] **Step 2b: Run test to verify it fails**

Run: `npx jest __tests__/lib/supabase/server.test.ts`
Expected: FAIL — `Cannot find module '@/lib/supabase/server'`

- [ ] **Step 3: Implement `lib/supabase/server.ts`**

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { getToken } = await auth();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await getToken()) ?? null;
      },
    },
  );
}
```

- [ ] **Step 4: Implement `lib/supabase/browser.ts`**

```ts
"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

export function useBrowserSupabaseClient(): SupabaseClient {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return (await session?.getToken()) ?? null;
        },
      },
    );
  }, [session]);
}
```

- [ ] **Step 5: Rewrite the test to assert the callback actually calls `getToken`**

Replace the test body in `__tests__/lib/supabase/server.test.ts` with a direct assertion on the constructed client's behavior by spying on `@supabase/supabase-js`'s `createClient`:

```ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ mocked: true })),
}));

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

describe("createServerSupabaseClient", () => {
  it("passes an accessToken callback that resolves the Clerk session token", async () => {
    const getToken = jest.fn().mockResolvedValue("clerk-jwt-123");
    (auth as jest.Mock).mockResolvedValue({ getToken });

    await createServerSupabaseClient();

    expect(createClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ accessToken: expect.any(Function) }),
    );

    const options = (createClient as jest.Mock).mock.calls[0][2];
    const token = await options.accessToken();
    expect(token).toBe("clerk-jwt-123");
  });

  it("resolves null when there is no Clerk session token", async () => {
    const getToken = jest.fn().mockResolvedValue(null);
    (auth as jest.Mock).mockResolvedValue({ getToken });

    await createServerSupabaseClient();

    const options = (createClient as jest.Mock).mock.calls[0][2];
    const token = await options.accessToken();
    expect(token).toBeNull();
  });
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest __tests__/lib/supabase/server.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Clerk-bridged Supabase client factories"
```

---

### Task 4: Supabase schema migration

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: tables `profiles`, `topics`, `documents`, `subscriptions`, `design_tokens` and their RLS policies, consumed by every later plan's data access code and by Task 5's webhook handler.

- [ ] **Step 1: Write the migration**

`supabase/migrations/0001_init.sql`:

```sql
-- profiles: one row per Clerk user, synced via the Clerk webhook (Task 5)
create table if not exists profiles (
  id text primary key, -- Clerk user id
  email text not null,
  full_name text,
  tier text not null default 'free' check (tier in ('free', 'monthly', 'yearly')),
  downloads_this_month integer not null default 0,
  subscription_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  slug text not null unique,
  is_full_track boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  user_id text not null references profiles(id) on delete cascade,
  format text not null check (format in ('pdf', 'pptx')),
  storage_path text not null,
  schema_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete cascade,
  tier text not null check (tier in ('monthly', 'yearly')),
  status text not null,
  provider_ref text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists design_tokens (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('figma', 'canva')),
  payload_json jsonb not null,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table topics enable row level security;
alter table documents enable row level security;
alter table subscriptions enable row level security;
alter table design_tokens enable row level security;

create policy "profiles: read own row"
  on profiles for select
  using (id = (auth.jwt() ->> 'sub'));

create policy "topics: public read"
  on topics for select
  using (true);

create policy "documents: read own rows"
  on documents for select
  using (user_id = (auth.jwt() ->> 'sub'));

create policy "subscriptions: read own rows"
  on subscriptions for select
  using (user_id = (auth.jwt() ->> 'sub'));

-- design_tokens has no client-facing policy: only the service role (used by
-- the webhook route and generation routes) reads/writes this table.
```

- [ ] **Step 2: Validate SQL syntax**

If the Supabase CLI is installed (`supabase --version` succeeds), run:

```bash
npx supabase db lint --schema supabase/migrations/0001_init.sql
```

If the CLI is not installed or there is no linked project yet, skip live linting — this task's completion criterion is that the file matches spec §6 exactly (table names, column names/types, RLS policies) and contains valid, unambiguous PostgreSQL (verified by inspection: every `create table`/`create policy` statement is well-formed and terminated).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema migration for profiles, topics, documents, subscriptions, design_tokens"
```

---

### Task 5: Clerk webhook syncing profiles to Supabase

**Files:**
- Create: `app/api/webhooks/clerk/route.ts`
- Create: `lib/supabase/admin.ts`
- Test: `__tests__/app/api/webhooks/clerk.test.ts`

**Interfaces:**
- Consumes: `topics`/`profiles` schema from Task 4; `SUPABASE_SERVICE_ROLE_KEY` env var.
- Produces: `POST /api/webhooks/clerk` that upserts `profiles` on `user.created`/`user.updated`, and `createAdminSupabaseClient(): SupabaseClient` (service-role, bypasses RLS) reused by later generation routes.

- [ ] **Step 1: Install `svix`**

```bash
npm install svix
```

- [ ] **Step 2: Implement the admin Supabase client**

`lib/supabase/admin.ts`:

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createAdminSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
```

- [ ] **Step 3: Write the failing test**

`__tests__/app/api/webhooks/clerk.test.ts`:

```ts
import { POST } from "@/app/api/webhooks/clerk/route";

jest.mock("svix", () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: jest.fn(),
  })),
}));

const upsertMock = jest.fn().mockResolvedValue({ error: null });
jest.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: () => ({
    from: () => ({ upsert: upsertMock }),
  }),
}));

import { Webhook } from "svix";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    headers: {
      "svix-id": "id",
      "svix-timestamp": "0",
      "svix-signature": "sig",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    upsertMock.mockClear();
    process.env.CLERK_WEBHOOK_SECRET = "whsec_test";
  });

  it("upserts a profile on user.created", async () => {
    const payload = {
      type: "user.created",
      data: {
        id: "user_123",
        email_addresses: [{ id: "eid_1", email_address: "a@b.com" }],
        primary_email_address_id: "eid_1",
        first_name: "Ada",
        last_name: "Lovelace",
      },
    };
    (Webhook as unknown as jest.Mock).mockImplementation(() => ({
      verify: jest.fn().mockReturnValue(payload),
    }));

    const res = await POST(makeRequest(payload));

    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user_123",
        email: "a@b.com",
        full_name: "Ada Lovelace",
      }),
      expect.objectContaining({ onConflict: "id" }),
    );
  });

  it("returns 400 when signature verification fails", async () => {
    (Webhook as unknown as jest.Mock).mockImplementation(() => ({
      verify: jest.fn().mockImplementation(() => {
        throw new Error("bad signature");
      }),
    }));

    const res = await POST(makeRequest({ type: "user.created", data: {} }));

    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx jest __tests__/app/api/webhooks/clerk.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/webhooks/clerk/route'`

- [ ] **Step 5: Implement the route**

`app/api/webhooks/clerk/route.ts`:

```ts
import { Webhook } from "svix";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: ClerkEmailAddress[];
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
  };
}

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let event: ClerkUserEvent;
  try {
    event = webhook.verify(payload, headers) as ClerkUserEvent;
  } catch {
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type !== "user.created" && event.type !== "user.updated") {
    return Response.json({ ok: true, skipped: event.type });
  }

  const { id, email_addresses = [], primary_email_address_id, first_name, last_name } =
    event.data;
  const primaryEmail =
    email_addresses.find((e) => e.id === primary_email_address_id)?.email_address ??
    email_addresses[0]?.email_address ??
    "";
  const fullName = [first_name, last_name].filter(Boolean).join(" ") || null;

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("profiles").upsert(
    { id, email: primaryEmail, full_name: fullName },
    { onConflict: "id" },
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
```

Note: the test mocks `req.text()` implicitly through the `Request` body — `new Request(...).text()` works natively in the Jest/Node environment used by Next.js's test setup.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest __tests__/app/api/webhooks/clerk.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: sync Clerk user events to Supabase profiles via webhook"
```

---

### Task 6: Route-gating logic (pure function + middleware wiring)

**Files:**
- Create: `lib/auth/access.ts`
- Test: `__tests__/lib/auth/access.test.ts`
- Modify: `middleware.ts`

**Interfaces:**
- Produces: `resolveRedirect(input: { userId: string | null; pathname: string; tier: "free" | "monthly" | "yearly" | null }): string | null` — returns a redirect path or `null` (allow). Consumed by `middleware.ts` now, and by later plans' route handlers needing the same public/protected classification (`isPublicRoute`, `isPremiumRoute` are exported too).

- [ ] **Step 1: Write the failing tests**

`__tests__/lib/auth/access.test.ts`:

```ts
import { resolveRedirect, isPublicRoute, isPremiumRoute } from "@/lib/auth/access";

describe("isPublicRoute", () => {
  it("treats marketing, auth, and webhook routes as public", () => {
    expect(isPublicRoute("/")).toBe(true);
    expect(isPublicRoute("/sign-in")).toBe(true);
    expect(isPublicRoute("/sign-up")).toBe(true);
    expect(isPublicRoute("/api/webhooks/clerk")).toBe(true);
  });

  it("treats dashboard routes as non-public", () => {
    expect(isPublicRoute("/dashboard")).toBe(false);
  });
});

describe("isPremiumRoute", () => {
  it("flags full-technology-track routes as premium", () => {
    expect(isPremiumRoute("/dashboard/tracks/full-stack")).toBe(true);
  });

  it("does not flag the base dashboard as premium", () => {
    expect(isPremiumRoute("/dashboard")).toBe(false);
  });
});

describe("resolveRedirect", () => {
  it("allows public routes for signed-out users", () => {
    expect(
      resolveRedirect({ userId: null, pathname: "/sign-in", tier: null }),
    ).toBeNull();
  });

  it("redirects signed-out users away from protected routes", () => {
    expect(
      resolveRedirect({ userId: null, pathname: "/dashboard", tier: null }),
    ).toBe("/sign-in");
  });

  it("allows signed-in free-tier users onto the base dashboard", () => {
    expect(
      resolveRedirect({ userId: "u1", pathname: "/dashboard", tier: "free" }),
    ).toBeNull();
  });

  it("redirects free-tier users away from premium routes to pricing", () => {
    expect(
      resolveRedirect({
        userId: "u1",
        pathname: "/dashboard/tracks/full-stack",
        tier: "free",
      }),
    ).toBe("/pricing");
  });

  it("allows monthly and yearly tier users onto premium routes", () => {
    expect(
      resolveRedirect({
        userId: "u1",
        pathname: "/dashboard/tracks/full-stack",
        tier: "monthly",
      }),
    ).toBeNull();
    expect(
      resolveRedirect({
        userId: "u1",
        pathname: "/dashboard/tracks/full-stack",
        tier: "yearly",
      }),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/lib/auth/access.test.ts`
Expected: FAIL — `Cannot find module '@/lib/auth/access'`

- [ ] **Step 3: Implement `lib/auth/access.ts`**

```ts
export type Tier = "free" | "monthly" | "yearly";

const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/api/webhooks"];
const PUBLIC_EXACT = ["/"];

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isPremiumRoute(pathname: string): boolean {
  return pathname.startsWith("/dashboard/tracks/");
}

export function resolveRedirect(input: {
  userId: string | null;
  pathname: string;
  tier: Tier | null;
}): string | null {
  const { userId, pathname, tier } = input;

  if (isPublicRoute(pathname)) return null;

  if (!userId) return "/sign-in";

  if (isPremiumRoute(pathname) && tier === "free") return "/pricing";

  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/lib/auth/access.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Wire `resolveRedirect` into `middleware.ts`**

Replace `middleware.ts` with:

```ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resolveRedirect } from "@/lib/auth/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  let tier: "free" | "monthly" | "yearly" | null = null;

  if (userId) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", userId)
      .single();
    tier = (data?.tier as "free" | "monthly" | "yearly" | undefined) ?? "free";
  }

  const redirectTarget = resolveRedirect({
    userId: userId ?? null,
    pathname: req.nextUrl.pathname,
    tier,
  });

  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 6: Run the full test suite to confirm nothing broke**

Run: `npx jest`
Expected: all suites PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add tested route-gating logic and wire it into middleware"
```

---

### Task 7: Language context (English/Hindi)

**Files:**
- Create: `lib/i18n/en.json`
- Create: `lib/i18n/hi.json`
- Create: `context/language-context.tsx`
- Test: `__tests__/context/language-context.test.tsx`

**Interfaces:**
- Produces: `LanguageProvider` and `useLanguage(): { lang: "en" | "hi"; setLang: (l: "en" | "hi") => void; t: (key: string) => string }`, consumed by the dashboard plan's UI and the language-toggle component.

- [ ] **Step 1: Write the dictionaries**

`lib/i18n/en.json`:

```json
{
  "dashboard.title": "Choose what to master",
  "dashboard.categoryLabel": "Category",
  "dashboard.topicLabel": "Topic",
  "dashboard.download": "Download",
  "dashboard.learnInApp": "Learn in App"
}
```

`lib/i18n/hi.json`:

```json
{
  "dashboard.title": "जो सीखना है उसे चुनें",
  "dashboard.categoryLabel": "श्रेणी",
  "dashboard.topicLabel": "विषय",
  "dashboard.download": "डाउनलोड करें",
  "dashboard.learnInApp": "ऐप में सीखें"
}
```

- [ ] **Step 2: Write the failing test**

`__tests__/context/language-context.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useLanguage } from "@/context/language-context";

function Probe() {
  const { lang, setLang, t } = useLanguage();
  return (
    <div>
      <p data-testid="title">{t("dashboard.title")}</p>
      <p data-testid="lang">{lang}</p>
      <button onClick={() => setLang(lang === "en" ? "hi" : "en")}>toggle</button>
    </div>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to English", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("title")).toHaveTextContent("Choose what to master");
  });

  it("updates rendered text when switched to Hindi", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    await user.click(screen.getByText("toggle"));

    expect(screen.getByTestId("lang")).toHaveTextContent("hi");
    expect(screen.getByTestId("title")).toHaveTextContent("जो सीखना है उसे चुनें");
  });

  it("persists the selected language to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    await user.click(screen.getByText("toggle"));

    expect(window.localStorage.getItem("masterclass:lang")).toBe("hi");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest __tests__/context/language-context.test.tsx`
Expected: FAIL — `Cannot find module '@/context/language-context'`

- [ ] **Step 4: Implement `context/language-context.tsx`**

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import en from "@/lib/i18n/en.json";
import hi from "@/lib/i18n/hi.json";

type Lang = "en" | "hi";
type Dictionary = Record<string, string>;

const DICTIONARIES: Record<Lang, Dictionary> = { en, hi };
const STORAGE_KEY = "masterclass:lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "hi") {
        setLangState(stored);
      }
    } catch {
      // localStorage unavailable; keep default "en"
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failure
    }
  }, []);

  const t = useCallback(
    (key: string) => DICTIONARIES[lang][key] ?? key,
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/context/language-context.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add English/Hindi language context with persisted selection"
```

---

### Task 8: Cyberpunk Tech Noir theme + provider wiring + dashboard shell

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `LanguageProvider` from Task 7, `ClerkProvider` from Task 2.
- Produces: `--color-background`, `--color-neon-cyan`, `--color-neon-magenta` CSS variables available globally, used by all later plans' UI and by the PDF/PPTX theme engine's default token set.

- [ ] **Step 1: Add theme tokens to `app/globals.css`**

Add this block (Tailwind v4 CSS-first theme) near the top of `app/globals.css`, after the existing `@import "tailwindcss";`:

```css
@theme {
  --color-background: #0a0a12;
  --color-neon-cyan: #00f0ff;
  --color-neon-magenta: #ff007f;
  --color-slate-border: #2a2a3a;
}

body {
  background-color: var(--color-background);
  color: #e6e6f0;
}
```

- [ ] **Step 2: Wrap the root layout with `LanguageProvider`**

Modify `app/layout.tsx` so `ClerkProvider` wraps `LanguageProvider` wraps `{children}`:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { LanguageProvider } from "@/context/language-context";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <LanguageProvider>{children}</LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 3: Add a dashboard route group layout**

`app/(dashboard)/layout.tsx`:

```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Add a placeholder dashboard page proving the providers work end-to-end**

`app/(dashboard)/dashboard/page.tsx`:

```tsx
"use client";

import { useLanguage } from "@/context/language-context";

export default function DashboardPage() {
  const { t, lang, setLang } = useLanguage();

  return (
    <div>
      <h1 className="text-3xl font-semibold text-[var(--color-neon-cyan)]">
        {t("dashboard.title")}
      </h1>
      <button
        className="mt-4 rounded border border-[var(--color-slate-border)] px-3 py-1 text-sm"
        onClick={() => setLang(lang === "en" ? "hi" : "en")}
      >
        {lang === "en" ? "हिन्दी" : "English"}
      </button>
    </div>
  );
}
```

This is intentionally a placeholder — the real Combobox-driven dashboard is built in the Dashboard plan.

- [ ] **Step 5: Verify the app builds and the full test suite passes**

Run: `npm run build && npx jest`
Expected: build succeeds; all Jest suites PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: apply Cyberpunk Tech Noir theme tokens and wire dashboard shell"
```

---

## What This Plan Does Not Cover

- The real Category/Topic Combobox dashboard UI (Dashboard plan).
- PDF/PPTX generation, the Claude API call, and the design-token webhook (Document Generation plan).
- The Learn-in-App modal and Sandpack playground (In-App Viewer plan).
- Pricing page content and the subscription upgrade stub route (Subscription plan).

Each of those becomes its own plan document under `docs/superpowers/plans/`, written just before it's executed, building on the auth/DB/theme/language foundation delivered here.
