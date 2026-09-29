import type { GuideFeature, GuideUseCase } from "./types";

/**
 * The pointwise learning content of each built-in On The Go guide: the
 * definition and answer broken into points, the subject's core features, and
 * real use cases, each with a complete implementation (every file it imports
 * is included and nothing is elided). Kept apart from `guides.ts` so the
 * step-by-step sources stay readable; the two are merged by guide id.
 */
export type GuideExtras = { definitionPoints: string[]; answerPoints: string[]; features: GuideFeature[]; useCases: GuideUseCase[] };

export const GUIDE_EXTRAS: Record<string, GuideExtras> = {
  "nextjs-protected-routes": {
    definitionPoints: [
      "`proxy.ts` sits at the project root and runs before any matched route renders.",
      "It receives a `NextRequest` and may continue, redirect or rewrite the request.",
      "It can read cookies and headers, but it should not run slow database queries.",
      "Next.js 16 renamed `middleware.ts` to `proxy.ts`; the exported function is now `proxy`.",
    ],
    answerPoints: [
      "Keep the cookie name and the validity check in a single `lib/session.ts` module.",
      "In `proxy.ts`, redirect to `/login?from=<path>` when the session cookie is missing.",
      "Scope the proxy with `config.matcher` so it never runs for static assets.",
      "Check the session again in the page or data layer: the proxy is an optimistic gate, not the last line of defence.",
    ],
    features: [
      { name: "Runs before rendering", detail: "A redirect issued in the proxy happens before any Server Component work, so a signed-out visitor never triggers private data fetching." },
      { name: "Path matching", detail: "`config.matcher` accepts path patterns such as `/dashboard/:path*`, so one file protects a whole area of the app." },
      { name: "Cookie and header access", detail: "`request.cookies.get()` and `request.headers` expose everything needed for a fast, stateless session check." },
      { name: "Redirects and rewrites", detail: "`NextResponse.redirect()` sends the visitor elsewhere; `NextResponse.rewrite()` serves another route while keeping the URL." },
      { name: "Response headers", detail: "The proxy can set headers such as `Cache-Control: private` on protected responses so a CDN never caches them." },
    ],
    useCases: [
      {
        title: "Admin area limited to one role",
        scenario: "An internal dashboard where every signed-in user can open `/dashboard`, but only users whose session carries the `admin` role can open `/admin`.",
        points: ["Encode the role in the session value you issue at sign-in.", "Redirect non-admins to a friendly 403 page instead of the login page.", "Re-check the role in the admin page itself before reading data."],
        files: [
          { path: "/proxy.ts", note: "Routes by session and role.", code: `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, readSession } from "./lib/session";

export function proxy(request: NextRequest) {
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }
  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
` },
          { path: "/lib/session.ts", note: "Parses the role-bearing session value.", code: `export const SESSION_COOKIE = "session";

export type Session = { userId: string; role: "member" | "admin" };

// Demo format "userId:role". In production, store an opaque id and look it up,
// or verify a signed token, so the role cannot be edited in the browser.
export function readSession(value?: string): Session | null {
  if (!value) return null;
  const [userId, role] = value.split(":");
  if (!userId || (role !== "member" && role !== "admin")) return null;
  return { userId, role };
}
` },
          { path: "/app/forbidden/page.tsx", note: "Shown to signed-in non-admins.", code: `import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main>
      <h1>Admins only</h1>
      <p>Your account can use the dashboard, but not the admin area.</p>
      <Link href="/dashboard">Back to the dashboard</Link>
    </main>
  );
}
` },
        ],
      },
      {
        title: "Maintenance mode without a redeploy",
        scenario: "During a database migration, every public page should show a maintenance notice while the team can still reach the site with a bypass cookie.",
        points: ["Drive the switch from an environment variable so it flips without code changes.", "`rewrite` keeps the visitor's URL, so they can simply refresh when the site is back.", "Exclude `/_next` and static files so the notice page itself can load its CSS."],
        files: [
          { path: "/proxy.ts", note: "Rewrites everything to /maintenance when enabled.", code: `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const enabled = process.env.MAINTENANCE_MODE === "true";
  const bypass = request.cookies.get("team_bypass")?.value === process.env.MAINTENANCE_BYPASS;
  if (!enabled || bypass || request.nextUrl.pathname === "/maintenance") return NextResponse.next();
  return NextResponse.rewrite(new URL("/maintenance", request.url));
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
` },
          { path: "/app/maintenance/page.tsx", note: "The notice every visitor sees.", code: `export const metadata = { title: "Back soon", robots: { index: false } };

export default function MaintenancePage() {
  return (
    <main>
      <h1>We'll be back shortly</h1>
      <p>We're upgrading our database. Please refresh in a few minutes.</p>
    </main>
  );
}
` },
        ],
      },
    ],
  },

  "nextjs-server-action-form": {
    definitionPoints: [
      "A Server Action is an async function marked with the `\"use server\"` directive.",
      "Pass it to `<form action>` and React posts the form to it; you design no API route.",
      "`useActionState(action, initialState)` returns `[state, formAction, pending]` for the client.",
      "Because the action runs only on the server, secrets and database access stay there.",
    ],
    answerPoints: [
      "Use the signature `(prevState, formData)` when the action is wrapped by `useActionState`.",
      "Validate fields with Zod's `safeParse` and return `error.flatten().fieldErrors`.",
      "Return errors as data rather than throwing, so the form can render them next to each field.",
      "Disable the submit button with `pending`, and keep the page itself a Server Component.",
    ],
    features: [
      { name: "Progressive enhancement", detail: "A form with a Server Action as its `action` submits even before JavaScript loads, then upgrades to a client-side transition." },
      { name: "Built-in pending state", detail: "`useActionState` exposes `pending`, and `useFormStatus` reads it from any child of the form, with no manual loading flags." },
      { name: "Type-safe results", detail: "The action's return type is the state type, so TypeScript checks every error and success message the form renders." },
      { name: "Cache revalidation", detail: "Call `revalidatePath` or `revalidateTag` inside the action so the updated data shows on the next render." },
      { name: "Server-only execution", detail: "The function body never ships to the browser; only a reference id does, so keys and queries stay private." },
    ],
    useCases: [
      {
        title: "Newsletter signup that saves and refreshes a count",
        scenario: "A marketing page shows how many readers have subscribed. Submitting the form stores the email and updates the count without a full reload.",
        points: ["Normalise the email (trim, lowercase) before saving so duplicates are caught.", "`revalidatePath(\"/\")` refreshes the server-rendered count after a signup.", "`useFormStatus` lets a separate submit button read the pending state."],
        files: [
          { path: "/app/newsletter/store.ts", note: "In-memory store; swap for your database.", code: `const subscribers = new Set<string>();

export async function addSubscriber(email: string): Promise<boolean> {
  if (subscribers.has(email)) return false;
  subscribers.add(email);
  return true;
}

export async function subscriberCount(): Promise<number> {
  return subscribers.size;
}
` },
          { path: "/app/newsletter/actions.ts", note: "Validates, saves and revalidates.", code: `"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addSubscriber } from "./store";

export type SignupState = { ok: boolean; message: string };

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email") });

export async function subscribe(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const added = await addSubscriber(parsed.data.email);
  if (!added) return { ok: false, message: "You're already subscribed." };
  revalidatePath("/");
  return { ok: true, message: "Thanks! Check your inbox." };
}
` },
          { path: "/app/newsletter/signup-form.tsx", note: "Client form with a pending-aware button.", code: `"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { subscribe, type SignupState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Joining…" : "Subscribe"}</button>;
}

const initial: SignupState = { ok: false, message: "" };

export function SignupForm() {
  const [state, formAction] = useActionState(subscribe, initial);
  return (
    <form action={formAction}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required />
      <SubmitButton />
      {state.message && <p role={state.ok ? "status" : "alert"}>{state.message}</p>}
    </form>
  );
}
` },
          { path: "/app/page.tsx", note: "Server Component showing the live count.", code: `import { SignupForm } from "./newsletter/signup-form";
import { subscriberCount } from "./newsletter/store";

export default async function Home() {
  const count = await subscriberCount();
  return (
    <main>
      <h1>Join {count} readers</h1>
      <SignupForm />
    </main>
  );
}
` },
        ],
      },
      {
        title: "Profile settings with per-field errors",
        scenario: "A settings page edits a display name and a website URL. Each invalid field shows its own message, and the user's input is kept after an error.",
        points: ["Return the submitted values in state so fields keep their input after a failed submit.", "`fieldErrors` from Zod maps straight to each input's error message.", "Use `aria-describedby` so screen readers announce each field's error."],
        files: [
          { path: "/app/settings/actions.ts", note: "Returns field errors and echoed values.", code: `"use server";

import { z } from "zod";

export type ProfileState = {
  values: { name: string; website: string };
  errors: Partial<Record<"name" | "website", string[]>>;
  saved: boolean;
};

const schema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(40, "At most 40 characters"),
  website: z.union([z.literal(""), z.string().url("Must be a full URL, e.g. https://…")]),
});

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const values = { name: String(formData.get("name") ?? ""), website: String(formData.get("website") ?? "") };
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { values, errors: parsed.error.flatten().fieldErrors, saved: false };
  // Persist parsed.data to your database here.
  return { values, errors: {}, saved: true };
}
` },
          { path: "/app/settings/profile-form.tsx", note: "Accessible per-field errors.", code: `"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "./actions";

const initial: ProfileState = { values: { name: "", website: "" }, errors: {}, saved: false };

export function ProfileForm() {
  const [state, formAction, pending] = useActionState(saveProfile, initial);
  return (
    <form action={formAction}>
      <label htmlFor="name">Display name</label>
      <input id="name" name="name" defaultValue={state.values.name} aria-describedby="name-error" />
      <p id="name-error">{state.errors.name?.[0]}</p>

      <label htmlFor="website">Website</label>
      <input id="website" name="website" defaultValue={state.values.website} aria-describedby="website-error" />
      <p id="website-error">{state.errors.website?.[0]}</p>

      <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
      {state.saved && <p role="status">Profile saved.</p>}
    </form>
  );
}
` },
        ],
      },
    ],
  },

  "react-debounced-search": {
    definitionPoints: [
      "Debouncing waits until the input has been quiet for a set delay before acting on it.",
      "In search boxes it turns one request per keystroke into one request per pause.",
      "A custom hook packages the timer logic so any component can reuse it.",
      "Cancelling stale requests with `AbortController` stops old responses overwriting new ones.",
    ],
    answerPoints: [
      "Write `useDebouncedValue(value, delay)` that sets a timeout and clears it on every change.",
      "Feed the debounced value, not the raw input, into the effect that fetches.",
      "Abort the previous `fetch` in the effect's cleanup so only the latest query wins.",
      "Keep the input controlled and instant; only the network work is delayed.",
    ],
    features: [
      { name: "Timer cleanup", detail: "Returning `clearTimeout` from the effect cancels the pending update whenever the value changes again before the delay ends." },
      { name: "Request cancellation", detail: "An `AbortController` per effect run aborts the previous request, and the aborted promise's error is ignored." },
      { name: "Reusable hook", detail: "The debounce logic depends only on a value and a delay, so the same hook serves search, autosave and resize handlers." },
      { name: "Responsive typing", detail: "The input's own state updates on every keystroke, so typing never lags even though fetching waits." },
      { name: "Loading and empty states", detail: "The hook can expose `loading` and `error` so the UI can show a spinner, a message or a 'no results' note." },
    ],
    useCases: [
      {
        title: "Autosaving a note while the user types",
        scenario: "A notes editor saves the draft to the server one second after the user stops typing, and shows 'Saving…' then 'Saved'.",
        points: ["Debounce the text, then save whenever the debounced value changes.", "Skip the save on first render so opening a note doesn't write it back.", "Show a status line so the user trusts their work is stored."],
        files: [
          { path: "/src/hooks/useDebouncedValue.ts", note: "Generic debounce hook.", code: `import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
` },
          { path: "/src/NoteEditor.tsx", note: "Saves one second after typing stops.", code: `import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "./hooks/useDebouncedValue";

type Status = "idle" | "saving" | "saved" | "error";

export function NoteEditor({ noteId, initialText }: { noteId: string; initialText: string }) {
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<Status>("idle");
  const draft = useDebouncedValue(text, 1000);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const controller = new AbortController();
    setStatus("saving");
    fetch("/api/notes/" + noteId, { method: "PUT", body: JSON.stringify({ text: draft }), headers: { "Content-Type": "application/json" }, signal: controller.signal })
      .then(response => setStatus(response.ok ? "saved" : "error"))
      .catch(error => { if (error.name !== "AbortError") setStatus("error"); });
    return () => controller.abort();
  }, [draft, noteId]);

  return (
    <div>
      <textarea value={text} onChange={event => setText(event.target.value)} rows={10} aria-label="Note" />
      <p role="status">{status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Couldn't save" : ""}</p>
    </div>
  );
}
` },
        ],
      },
      {
        title: "Country picker with live suggestions",
        scenario: "A checkout form suggests countries from an API as the user types, without hammering the API or showing results for an old query.",
        points: ["Wait for at least two characters before searching.", "Abort the previous request so fast typists see only the newest results.", "Render suggestions as a proper listbox for keyboard users."],
        files: [
          { path: "/src/hooks/useDebouncedValue.ts", note: "Same generic debounce hook.", code: `import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
` },
          { path: "/src/CountryPicker.tsx", note: "Debounced, cancellable suggestions.", code: `import { useEffect, useState } from "react";
import { useDebouncedValue } from "./hooks/useDebouncedValue";

export function CountryPicker({ onPick }: { onPick: (country: string) => void }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const debounced = useDebouncedValue(query.trim(), 300);

  useEffect(() => {
    if (debounced.length < 2) { setOptions([]); return; }
    const controller = new AbortController();
    fetch("/api/countries?q=" + encodeURIComponent(debounced), { signal: controller.signal })
      .then(response => response.json() as Promise<string[]>)
      .then(setOptions)
      .catch(error => { if (error.name !== "AbortError") setOptions([]); });
    return () => controller.abort();
  }, [debounced]);

  return (
    <div>
      <label htmlFor="country">Country</label>
      <input id="country" value={query} onChange={event => setQuery(event.target.value)} role="combobox" aria-expanded={options.length > 0} aria-controls="country-list" autoComplete="off" />
      <ul id="country-list" role="listbox">
        {options.map(option => (
          <li key={option} role="option" aria-selected={false} onClick={() => { setQuery(option); setOptions([]); onPick(option); }}>{option}</li>
        ))}
      </ul>
    </div>
  );
}
` },
        ],
      },
    ],
  },

  "node-express-rest-api": {
    definitionPoints: [
      "Express is a minimal web framework for Node.js built from routes and middleware.",
      "A REST API maps resources to URLs and uses HTTP verbs (GET, POST, PATCH, DELETE) for actions.",
      "Middleware are functions that run in order and can read, change or end a request.",
      "Request validation rejects bad input with a 400 before it reaches your business logic.",
    ],
    answerPoints: [
      "Create the app with `express()` and add `express.json()` to parse JSON bodies.",
      "Group each resource's handlers in an `express.Router()` and mount it at a path.",
      "Validate `req.body` with a Zod schema and answer 400 with the issues when it fails.",
      "Finish with a 404 handler and an error-handling middleware with four arguments.",
    ],
    features: [
      { name: "Composable middleware", detail: "Logging, auth, parsing and validation are each small functions chained with `app.use` or per route." },
      { name: "Routers", detail: "`express.Router()` groups related endpoints so each resource lives in its own module." },
      { name: "Route parameters", detail: "Paths like `/todos/:id` expose `req.params.id`, and query strings arrive in `req.query`." },
      { name: "Central error handling", detail: "A middleware with the signature `(err, req, res, next)` catches errors from any route in one place." },
      { name: "Status codes", detail: "`res.status(201).json(...)` makes intent explicit: 201 created, 204 no content, 400 bad input, 404 not found." },
    ],
    useCases: [
      {
        title: "Product catalogue with filtering and pagination",
        scenario: "A shop's frontend lists products by category, 10 per page, and needs the total so it can draw a pager.",
        points: ["Parse and cap `limit` so a client cannot request a million rows.", "Return `{ items, total, page }` so the client can draw a pager.", "Validate query parameters just like bodies."],
        files: [
          { path: "/src/products.js", note: "Filterable, paginated listing.", code: `import { Router } from "express";
import { z } from "zod";

const products = [
  { id: 1, name: "Notebook", category: "stationery", price: 120 },
  { id: 2, name: "Gel pen", category: "stationery", price: 30 },
  { id: 3, name: "Backpack", category: "bags", price: 1450 },
];

const query = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const productsRouter = Router();

productsRouter.get("/", (req, res) => {
  const parsed = query.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues });
  const { category, page, limit } = parsed.data;
  const matching = category ? products.filter(p => p.category === category) : products;
  const items = matching.slice((page - 1) * limit, page * limit);
  res.json({ items, total: matching.length, page });
});
` },
          { path: "/src/server.js", note: "Mounts the router.", code: `import express from "express";
import { productsRouter } from "./products.js";

const app = express();
app.use(express.json());
app.use("/products", productsRouter);
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(3000, () => console.log("API on http://localhost:3000"));
` },
        ],
      },
      {
        title: "Request logging and timing middleware",
        scenario: "Operations wants every request logged with its method, path, status and duration, to spot slow endpoints.",
        points: ["Record the start time, then log on the response's `finish` event.", "`process.hrtime.bigint()` gives nanosecond precision.", "Register it first so it times every later middleware too."],
        files: [
          { path: "/src/logger.js", note: "Times each request.", code: `export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(JSON.stringify({ method: req.method, path: req.originalUrl, status: res.statusCode, ms: Math.round(ms) }));
  });
  next();
}
` },
          { path: "/src/server.js", note: "Registers the logger first.", code: `import express from "express";
import { requestLogger } from "./logger.js";

const app = express();
app.use(requestLogger);
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(3000);
` },
        ],
      },
    ],
  },

  "node-postgres-queries": {
    definitionPoints: [
      "`pg` (node-postgres) is the standard PostgreSQL client for Node.js.",
      "A `Pool` keeps a set of open connections and lends one out per query.",
      "Parameterized queries send values separately from the SQL text as `$1, $2…`.",
      "Keeping values out of the SQL text prevents SQL injection by construction.",
    ],
    answerPoints: [
      "Create one shared `Pool` from `DATABASE_URL` and export a `query` helper.",
      "Always pass user input in the values array, never by concatenating strings.",
      "Use `pool.connect()` with `BEGIN`/`COMMIT`/`ROLLBACK` when several writes must succeed together.",
      "Release every client you check out in a `finally` block.",
    ],
    features: [
      { name: "Connection pooling", detail: "Reusing connections avoids a TCP and auth handshake on every query and caps load on the database." },
      { name: "Parameter binding", detail: "`$1`-style placeholders let PostgreSQL treat input strictly as data, whatever characters it contains." },
      { name: "Transactions", detail: "A checked-out client can run `BEGIN … COMMIT` so related writes are all-or-nothing." },
      { name: "Typed rows", detail: "`pool.query<Row>()` in TypeScript types `result.rows` without an ORM." },
      { name: "RETURNING clause", detail: "`INSERT … RETURNING *` gives back the created row, including generated ids, in one round trip." },
    ],
    useCases: [
      {
        title: "Transferring credits between two accounts",
        scenario: "A learning app lets a user gift study credits to a friend. The debit and the credit must both happen or neither.",
        points: ["Lock both rows with `SELECT … FOR UPDATE` to stop concurrent transfers racing.", "Check the balance inside the transaction, not before it.", "Roll back on any error, then release the client."],
        files: [
          { path: "/src/db.js", note: "Shared pool.", code: `import pg from "pg";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
` },
          { path: "/src/transfer.js", note: "All-or-nothing transfer.", code: `import { pool } from "./db.js";

export async function transferCredits(fromId, toId, amount) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Amount must be a positive whole number");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT id, credits FROM accounts WHERE id = ANY($1) ORDER BY id FOR UPDATE",
      [[fromId, toId]],
    );
    const from = rows.find(row => row.id === fromId);
    if (!from || rows.length !== 2) throw new Error("Account not found");
    if (from.credits < amount) throw new Error("Not enough credits");
    await client.query("UPDATE accounts SET credits = credits - $1 WHERE id = $2", [amount, fromId]);
    await client.query("UPDATE accounts SET credits = credits + $1 WHERE id = $2", [amount, toId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
` },
        ],
      },
      {
        title: "Safe search with a user-supplied filter",
        scenario: "An admin screen searches users by name fragment and optional role. The inputs come straight from a text box.",
        points: ["Build the WHERE clause from fixed fragments; only values are dynamic.", "Escape `%` and `_` so they are matched literally in `ILIKE`.", "Cap results with a bound `LIMIT`."],
        files: [
          { path: "/src/db.js", note: "Shared pool.", code: `import pg from "pg";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
` },
          { path: "/src/search-users.js", note: "Composes a parameterized query.", code: `import { pool } from "./db.js";

const ROLES = new Set(["student", "mentor", "admin"]);

export async function searchUsers({ name = "", role, limit = 20 }) {
  const conditions = [];
  const values = [];
  if (name) {
    const pattern = "%" + name.replace(/[\\\\%_]/g, char => "\\\\" + char) + "%";
    values.push(pattern);
    conditions.push("name ILIKE $" + values.length);
  }
  if (role && ROLES.has(role)) {
    values.push(role);
    conditions.push("role = $" + values.length);
  }
  values.push(Math.min(Math.max(limit, 1), 100));
  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const sql = "SELECT id, name, role FROM users " + where + " ORDER BY name LIMIT $" + values.length;
  const { rows } = await pool.query(sql, values);
  return rows;
}
` },
        ],
      },
    ],
  },

  "jest-react-testing": {
    definitionPoints: [
      "Jest is the test runner: it finds tests, runs them and reports assertions.",
      "React Testing Library renders components into a DOM and queries it as a user would.",
      "Queries by role and label (`getByRole`, `getByLabelText`) keep tests tied to accessible behaviour.",
      "`@testing-library/user-event` simulates real typing and clicking, including focus and keyboard.",
    ],
    answerPoints: [
      "Configure Jest with the `jsdom` environment and a setup file that imports `@testing-library/jest-dom`.",
      "Render the component, then find elements the way a user would: by role, label or text.",
      "Drive interactions with `userEvent.setup()` and `await` every call.",
      "Assert on what the user sees (`toBeVisible`, `toHaveTextContent`), not on internal state.",
    ],
    features: [
      { name: "Accessible queries", detail: "`getByRole(\"button\", { name: \"Save\" })` fails when a control is unlabeled, so tests double as accessibility checks." },
      { name: "Async utilities", detail: "`findBy…` queries and `waitFor` wait for UI that appears after a promise resolves." },
      { name: "Module mocking", detail: "`jest.mock()` and `jest.fn()` replace network calls and modules with controllable fakes." },
      { name: "Custom matchers", detail: "`jest-dom` adds matchers like `toBeDisabled` and `toHaveAccessibleName` for readable assertions." },
      { name: "Watch mode", detail: "`jest --watch` reruns only the tests affected by the files you change." },
    ],
    useCases: [
      {
        title: "Testing a login form that calls an API",
        scenario: "A login form posts credentials and shows either a welcome message or an error. The test must not hit a real server.",
        points: ["Mock `fetch` with `jest.fn()` and choose its response per test.", "Assert the request body, not just the UI.", "Use `findByRole` to wait for the async result."],
        files: [
          { path: "/src/LoginForm.tsx", note: "Component under test.", code: `import { useState, type FormEvent } from "react";

export function LoginForm() {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/login", { method: "POST", body: JSON.stringify(Object.fromEntries(data)) });
    setMessage(response.ok ? "Welcome back!" : "Wrong email or password");
  }
  return (
    <form onSubmit={submit}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" />
      <button type="submit">Sign in</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
` },
          { path: "/src/LoginForm.test.tsx", note: "Mocked fetch, user-like interactions.", code: `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

beforeEach(() => { global.fetch = jest.fn(); });

test("signs in with the typed credentials", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  const user = userEvent.setup();
  render(<LoginForm />);
  await user.type(screen.getByLabelText("Email"), "asha@example.com");
  await user.type(screen.getByLabelText("Password"), "s3cret!");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Welcome back!");
  expect(global.fetch).toHaveBeenCalledWith("/api/login", expect.objectContaining({ body: JSON.stringify({ email: "asha@example.com", password: "s3cret!" }) }));
});

test("shows an error when the server rejects the login", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
  const user = userEvent.setup();
  render(<LoginForm />);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Wrong email or password");
});
` },
        ],
      },
      {
        title: "Testing a custom hook's timing",
        scenario: "A `useCountdown` hook drives an exam timer. The test must check it ticks and stops at zero without waiting real seconds.",
        points: ["`jest.useFakeTimers()` lets the test advance time instantly.", "Wrap timer advances in `act` so React applies the state updates.", "`renderHook` tests a hook without writing a wrapper component."],
        files: [
          { path: "/src/useCountdown.ts", note: "Hook under test.", code: `import { useEffect, useState } from "react";

export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return left;
}
` },
          { path: "/src/useCountdown.test.ts", note: "Fake timers make it instant.", code: `import { act, renderHook } from "@testing-library/react";
import { useCountdown } from "./useCountdown";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("counts down once per second and stops at zero", () => {
  const { result } = renderHook(() => useCountdown(3));
  expect(result.current).toBe(3);
  act(() => { jest.advanceTimersByTime(1000); });
  expect(result.current).toBe(2);
  act(() => { jest.advanceTimersByTime(5000); });
  expect(result.current).toBe(0);
});
` },
        ],
      },
    ],
  },

  "docker-node-app": {
    definitionPoints: [
      "Docker packages an app and everything it needs to run into an image.",
      "A container is a running instance of that image, isolated from the host.",
      "A multi-stage Dockerfile builds in one stage and copies only the output into a slim final stage.",
      "Docker Compose describes several containers (app, database) and how they connect, in one YAML file.",
    ],
    answerPoints: [
      "Use a `build` stage to install all dependencies and compile the app.",
      "Use a `runtime` stage that installs production dependencies only and copies the build output.",
      "Run as the non-root `node` user and expose a single port.",
      "Describe the app and its database in `compose.yaml` and start both with `docker compose up`.",
    ],
    features: [
      { name: "Layer caching", detail: "Copying `package*.json` before the source means `npm ci` reruns only when dependencies change." },
      { name: "Small final images", detail: "Multi-stage builds leave compilers, dev dependencies and source maps behind, shrinking the image and its attack surface." },
      { name: ".dockerignore", detail: "Excluding `node_modules`, `.git` and `.env` keeps the build context fast and secrets out of the image." },
      { name: "Health checks", detail: "`HEALTHCHECK` or Compose `healthcheck` lets orchestrators restart an app that is running but not responding." },
      { name: "Service networking", detail: "Compose services reach each other by service name, e.g. `postgres://db:5432`." },
    ],
    useCases: [
      {
        title: "App and PostgreSQL with a health-gated start",
        scenario: "A Node API must not start until its PostgreSQL database accepts connections, both locally and in CI.",
        points: ["`depends_on` with `condition: service_healthy` waits for the database's health check.", "A named volume keeps database data between restarts.", "Secrets come from an `.env` file that is never baked into the image."],
        files: [
          { path: "/compose.yaml", note: "App waits for a healthy database.", code: `services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: app
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:\${POSTGRES_PASSWORD}@db:5432/app
    depends_on:
      db:
        condition: service_healthy

volumes:
  db-data:
` },
          { path: "/.env", note: "Local secret, listed in .gitignore and .dockerignore.", code: `POSTGRES_PASSWORD=change-me-locally
` },
        ],
      },
      {
        title: "Production image with a health check",
        scenario: "The platform restarts containers that stop answering. The image must expose a health endpoint and declare how to probe it.",
        points: ["Node 18+ has `fetch`, so the check needs no curl in the image.", "Keep the check fast and dependency-free.", "Run as the unprivileged `node` user."],
        files: [
          { path: "/Dockerfile", note: "Multi-stage build with HEALTHCHECK.", code: `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/server.js"]
` },
          { path: "/src/server.ts", note: "Exposes /health.", code: `import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello from the container");
});

server.listen(3000, () => console.log("Listening on 3000"));
` },
        ],
      },
    ],
  },

  "python-fastapi-crud": {
    definitionPoints: [
      "FastAPI is a Python web framework for building APIs from type-hinted functions.",
      "Pydantic models declare the shape of request and response data and validate it.",
      "CRUD means Create, Read, Update and Delete, mapped to POST, GET, PUT/PATCH and DELETE.",
      "FastAPI generates interactive OpenAPI docs at `/docs` from the same type hints.",
    ],
    answerPoints: [
      "Define `BookIn` (input) and `Book` (output) Pydantic models with field constraints.",
      "Write one path operation per verb, declaring path parameters and body types in the signature.",
      "Raise `HTTPException(status_code=404)` when an id does not exist.",
      "Run it with `uvicorn app.main:app --reload` and try every endpoint from `/docs`.",
    ],
    features: [
      { name: "Validation from type hints", detail: "A parameter typed `BookIn` is parsed and validated automatically; invalid bodies get a detailed 422 response." },
      { name: "Automatic docs", detail: "Swagger UI at `/docs` and ReDoc at `/redoc` are generated from your models and routes." },
      { name: "Dependency injection", detail: "`Depends()` supplies shared resources such as a database session or the current user to any route." },
      { name: "Async support", detail: "`async def` routes handle many concurrent I/O-bound requests on one worker." },
      { name: "Response models", detail: "`response_model=` filters the output, so internal fields like password hashes never leak." },
    ],
    useCases: [
      {
        title: "Protecting write routes with an API key dependency",
        scenario: "Anyone may read the book list, but only the admin tool, which holds an API key, may create or delete books.",
        points: ["A dependency reads the `X-API-Key` header and raises 401 when it's wrong.", "Attach it only to write routes with `dependencies=[Depends(...)]`.", "Compare secrets with `secrets.compare_digest` to avoid timing leaks."],
        files: [
          { path: "/app/security.py", note: "Reusable API-key dependency.", code: `import os
import secrets

from fastapi import Header, HTTPException, status


def require_api_key(x_api_key: str = Header(default="")) -> None:
    expected = os.environ.get("ADMIN_API_KEY", "")
    if not expected or not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
` },
          { path: "/app/main.py", note: "Public reads, protected writes.", code: `from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from app.security import require_api_key

app = FastAPI(title="Library")


class BookIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    author: str = Field(min_length=1, max_length=120)


class Book(BookIn):
    id: int


books: dict[int, Book] = {}


@app.get("/books", response_model=list[Book])
def list_books() -> list[Book]:
    return list(books.values())


@app.post("/books", response_model=Book, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_api_key)])
def create_book(payload: BookIn) -> Book:
    book = Book(id=max(books, default=0) + 1, **payload.model_dump())
    books[book.id] = book
    return book


@app.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_api_key)])
def delete_book(book_id: int) -> None:
    if books.pop(book_id, None) is None:
        raise HTTPException(status_code=404, detail="Book not found")
` },
        ],
      },
      {
        title: "Testing the API with TestClient",
        scenario: "The team wants every endpoint covered in CI without starting a server.",
        points: ["`TestClient` calls the app in-process, so tests are fast.", "Test the unhappy paths (404, 422) as well as success.", "Run with `pytest -q`."],
        files: [
          { path: "/app/main.py", note: "Minimal app under test.", code: `from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI()


class BookIn(BaseModel):
    title: str = Field(min_length=1)


class Book(BookIn):
    id: int


books: dict[int, Book] = {}


@app.post("/books", response_model=Book, status_code=status.HTTP_201_CREATED)
def create_book(payload: BookIn) -> Book:
    book = Book(id=len(books) + 1, **payload.model_dump())
    books[book.id] = book
    return book


@app.get("/books/{book_id}", response_model=Book)
def get_book(book_id: int) -> Book:
    if book_id not in books:
        raise HTTPException(status_code=404, detail="Book not found")
    return books[book_id]
` },
          { path: "/tests/test_books.py", note: "Happy and unhappy paths.", code: `from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_then_read():
    created = client.post("/books", json={"title": "Clean Code"})
    assert created.status_code == 201
    book_id = created.json()["id"]
    assert client.get(f"/books/{book_id}").json()["title"] == "Clean Code"


def test_missing_book_is_404():
    assert client.get("/books/9999").status_code == 404


def test_empty_title_is_rejected():
    assert client.post("/books", json={"title": ""}).status_code == 422
` },
        ],
      },
    ],
  },

  "express-jwt-auth": {
    definitionPoints: [
      "A JSON Web Token (JWT) is a signed string carrying claims such as the user's id and an expiry.",
      "The server signs it with a secret, so any tampering breaks the signature.",
      "bcrypt hashes passwords slowly with a per-password salt, so leaked hashes resist cracking.",
      "Stateless auth: the API trusts a valid token without a session lookup on every request.",
    ],
    answerPoints: [
      "On register, hash the password with `bcrypt.hash(password, 12)` and store only the hash.",
      "On login, `bcrypt.compare` the password, then `jwt.sign({ sub: user.id }, secret, { expiresIn: \"15m\" })`.",
      "Protect routes with middleware that verifies the `Authorization: Bearer` token.",
      "Keep the secret in an environment variable and use short expiries.",
    ],
    features: [
      { name: "Signed claims", detail: "`jwt.verify` rejects any token whose payload was changed or which was signed with another secret." },
      { name: "Expiry", detail: "The `exp` claim (`expiresIn`) limits how long a stolen token is useful." },
      { name: "Adaptive hashing", detail: "bcrypt's cost factor can be raised over time as hardware gets faster." },
      { name: "Stateless verification", detail: "Any API instance can verify a token with the shared secret, with no shared session store." },
      { name: "Role claims", detail: "Tokens can carry a role so middleware can authorize admin-only routes without a database hit." },
    ],
    useCases: [
      {
        title: "Role-based access for admin routes",
        scenario: "Students and admins use the same API. Only admins may publish lessons.",
        points: ["Put the role in the token at login.", "Chain `authenticate` then `requireRole(\"admin\")` on protected routes.", "Answer 401 for no or invalid token, 403 for the wrong role."],
        files: [
          { path: "/src/middleware/auth.js", note: "Authenticate and authorize.", code: `import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(role) {
  return (req, res, next) => (req.user?.role === role ? next() : res.status(403).json({ error: "Forbidden" }));
}
` },
          { path: "/src/lessons.js", note: "Admin-only publishing.", code: `import { Router } from "express";
import { authenticate, requireRole } from "./middleware/auth.js";

const lessons = [];
export const lessonsRouter = Router();

lessonsRouter.get("/", authenticate, (req, res) => res.json(lessons));

lessonsRouter.post("/", authenticate, requireRole("admin"), (req, res) => {
  const lesson = { id: lessons.length + 1, title: String(req.body.title ?? "").trim(), publishedBy: req.user.sub };
  if (!lesson.title) return res.status(400).json({ error: "Title is required" });
  lessons.push(lesson);
  res.status(201).json(lesson);
});
` },
        ],
      },
      {
        title: "Short-lived access token with a refresh cookie",
        scenario: "A web app keeps users signed in for a week, but access tokens should only live 15 minutes to limit damage if one leaks.",
        points: ["Issue a 15-minute access token in the JSON body and a 7-day refresh token in an httpOnly cookie.", "Sign refresh tokens with a different secret from access tokens.", "`/refresh` verifies the cookie and issues a new access token."],
        files: [
          { path: "/src/tokens.js", note: "Two token types, two secrets.", code: `import jwt from "jsonwebtoken";

export const accessToken = user => jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
export const refreshToken = user => jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
export const verifyRefresh = token => jwt.verify(token, process.env.JWT_REFRESH_SECRET);
` },
          { path: "/src/refresh.js", note: "Rotates access tokens from the cookie.", code: `import { Router } from "express";
import cookieParser from "cookie-parser";
import { accessToken, refreshToken, verifyRefresh } from "./tokens.js";

export const refreshRouter = Router();
refreshRouter.use(cookieParser());

const cookieOptions = { httpOnly: true, secure: true, sameSite: "strict", path: "/auth", maxAge: 7 * 24 * 60 * 60 * 1000 };

export function startSession(res, user) {
  res.cookie("refresh", refreshToken(user), cookieOptions);
  return { accessToken: accessToken(user) };
}

refreshRouter.post("/refresh", (req, res) => {
  try {
    const claims = verifyRefresh(req.cookies.refresh ?? "");
    const user = { id: claims.sub, role: claims.role };
    res.json(startSession(res, user));
  } catch {
    res.clearCookie("refresh", { path: "/auth" });
    res.status(401).json({ error: "Please sign in again" });
  }
});
` },
        ],
      },
    ],
  },
};
