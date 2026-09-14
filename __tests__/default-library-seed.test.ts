/** @jest-environment node */
import { ensureDefaultLibrary, parseSeeded } from "@/lib/server/default-library";
import { db } from "@/lib/server/db";

jest.mock("server-only", () => ({}));
jest.mock("@/lib/server/db", () => ({ db: jest.fn(), check: ({ data, error }: { data: unknown; error: { message: string } | null }) => { if (error) throw new Error(error.message); return data; } }));
// Both guides rendered at the versions the code declares.
jest.mock("@/lib/generation/default-library-manifest.json", () => {
  const files = (prefix: string) => ({
    pdf: { storagePath: `${prefix}/guide.pdf`, previewPaths: [`${prefix}/pdf-page-1.png`], pageTitles: ["Cover"] },
    pptx: { storagePath: `${prefix}/guide.pptx`, previewPaths: [`${prefix}/pptx-page-1.png`], pageTitles: ["Cover"] },
    notes: { storagePath: `${prefix}/guide.txt`, previewPaths: [], pageTitles: ["Cover"] },
  });
  return { "nextjs-16": { version: 2, ...files("_defaults/nextjs-16-v2") }, "react-19": { version: 1, ...files("_defaults/react-19-v1") } };
});

type Call = { table: string; op: string; args: unknown[]; filters: [string, unknown[]][] };

/** A chainable stand-in for the Supabase query builder that records every call. */
function fakeDb(profile: { default_library_guides: string[] | null } | null, existingKeys: string[] = []) {
  const calls: Call[] = [];
  const from = (table: string) => {
    const call: Call = { table, op: "", args: [], filters: [] };
    calls.push(call);
    const builder: Record<string, unknown> = {};
    for (const op of ["select", "insert", "update"]) builder[op] = (...args: unknown[]) => { call.op = op; call.args = args; return builder; };
    for (const filter of ["eq", "in", "like"]) builder[filter] = (...args: unknown[]) => { call.filters.push([filter, args]); return builder; };
    builder.maybeSingle = () => Promise.resolve({ data: profile, error: null });
    builder.then = (resolve: (value: unknown) => void) => resolve({ data: call.op === "select" ? existingKeys.map(cache_key => ({ cache_key })) : null, error: null });
    return builder;
  };
  (db as jest.Mock).mockReturnValue({ from });
  return calls;
}

beforeEach(() => jest.clearAllMocks());

test("parses versioned seed markers", () => {
  expect([...parseSeeded(["nextjs-16@1", "react-19@3", "legacy"])]).toEqual([["nextjs-16", 1], ["react-19", 3], ["legacy", 1]]);
  expect(parseSeeded(null).size).toBe(0);
});

test("a brand-new account gets both guides, React inserted last so it sorts first", async () => {
  const calls = fakeDb({ default_library_guides: [] });
  await ensureDefaultLibrary("alice");
  const inserts = calls.filter(c => c.op === "insert").map(c => (c.args[0] as { title: string; storage_path: string }[]));
  expect(inserts.map(rows => rows[0].title)).toEqual(["Complete Next.js 16 path", "Complete React 19 path"]);
  expect(inserts[1].map(row => row.storage_path)).toEqual(["_defaults/react-19-v1/guide.pdf", "_defaults/react-19-v1/guide.pptx", "_defaults/react-19-v1/guide.txt"]);
  const stamp = calls.find(c => c.table === "profiles" && c.op === "update")!.args[0] as { default_library_guides: string[] };
  expect(stamp.default_library_guides).toEqual(["nextjs-16@2", "react-19@1"]);
});

test("an account seeded with Next.js v1 gets React added and its Next.js copies refreshed in place", async () => {
  const calls = fakeDb({ default_library_guides: ["nextjs-16@1"] });
  await ensureDefaultLibrary("bob");
  const refreshes = calls.filter(c => c.table === "documents" && c.op === "update");
  expect(refreshes).toHaveLength(3);
  for (const refresh of refreshes) {
    expect((refresh.args[0] as { storage_path: string }).storage_path).toMatch(/^_defaults\/nextjs-16-v2\//);
    // Only shared seeded copies, never the learner's own documents.
    expect(refresh.filters).toContainEqual(["like", ["storage_path", "_defaults/%"]]);
    expect(refresh.filters).toContainEqual(["eq", ["user_id", "bob"]]);
  }
  expect(calls.filter(c => c.op === "insert").map(c => (c.args[0] as { title: string }[])[0].title)).toEqual(["Complete React 19 path"]);
});

test("an up-to-date account is left alone, so deleted copies stay deleted", async () => {
  const calls = fakeDb({ default_library_guides: ["nextjs-16@2", "react-19@1"] });
  await ensureDefaultLibrary("carol");
  expect(calls.map(c => c.op)).toEqual(["select"]);
});

test("does not duplicate a guide the account already has rows for", async () => {
  const { documentKey } = await import("@/lib/domain");
  const { DEFAULT_GUIDES, DEFAULT_LIBRARY_FORMATS, defaultLibraryRequest } = await import("@/lib/generation/default-library");
  const react = DEFAULT_GUIDES.find(g => g.id === "react-19")!;
  const keys = DEFAULT_LIBRARY_FORMATS.map(f => documentKey(defaultLibraryRequest(react, f), 1));
  const calls = fakeDb({ default_library_guides: ["nextjs-16@2"] }, keys);
  await ensureDefaultLibrary("dave");
  expect(calls.filter(c => c.op === "insert")).toHaveLength(0);
  expect((calls.at(-1)!.args[0] as { default_library_guides: string[] }).default_library_guides).toEqual(["nextjs-16@2", "react-19@1"]);
});
