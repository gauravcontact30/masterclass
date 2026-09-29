/** @jest-environment node */
import { fakeSupabase, check } from "../../helpers/supabase";

const fake = fakeSupabase();
jest.mock("@/lib/server/db", () => ({ db: () => fake.client, check: (result: never) => check(result) }));

import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { dueGuides, ensureDefaultLibrary, isSharedLibraryPath, parseSeeded, seedCacheKey, seedRows, SHARED_LIBRARY_PREFIX } from "@/lib/server/default-library";

const [first, second] = DEFAULT_GUIDES;
const allSeeded = () => DEFAULT_GUIDES.map(guide => `${guide.id}@${guide.version}`);

beforeEach(() => { fake.calls.length = 0; });

describe("pure helpers", () => {
  test("shared paths and cache keys", () => {
    expect(isSharedLibraryPath(`${SHARED_LIBRARY_PREFIX}x.pdf`)).toBe(true);
    expect(isSharedLibraryPath("user/x.pdf")).toBe(false);
    expect(seedCacheKey(first)).toBe(`default-library:${first.id}`);
  });

  test("parseSeeded reads id@version markers, defaulting a missing or bad version to 1", () => {
    expect([...parseSeeded(["a@3", "b", "c@x", "@2"])]).toEqual([["a", 3], ["b", 1], ["c", 1]]);
    expect(parseSeeded(null).size).toBe(0);
    expect(parseSeeded(undefined).size).toBe(0);
  });

  test("dueGuides returns guides that are new or behind their current version", () => {
    expect(dueGuides(new Map())).toHaveLength(DEFAULT_GUIDES.length);
    const seeded = parseSeeded(allSeeded());
    expect(dueGuides(seeded)).toEqual([]);
    seeded.set(first.id, first.version - 1);
    expect(dueGuides(seeded)).toEqual([first]);
  });

  test("seedRows builds ready notes rows that keep library order", () => {
    const rows = seedRows("u1", [first, second], 1_000_000);
    expect(rows[0]).toMatchObject({ user_id: "u1", status: "ready", cache_key: seedCacheKey(first), storage_path: null, preview_paths: [], title: first.curriculum.title });
    expect(Date.parse(rows[0].created_at)).toBeGreaterThan(Date.parse(rows[1].created_at));
    expect(seedRows("u1", [first])[0].created_at).toEqual(expect.any(String));
  });
});

describe("ensureDefaultLibrary", () => {
  test("an up-to-date account is left alone, so deleted copies stay deleted", async () => {
    fake.respond("profiles", { data: { default_library_guides: allSeeded() } });
    await ensureDefaultLibrary("u1");
    expect(fake.methods("documents")).toEqual([]);
    expect(fake.argsOf("profiles", "update")).toEqual([]);
  });

  test("a brand-new account gets every guide seeded and the list stamped", async () => {
    fake.respond("profiles", { data: null });
    fake.respond("documents", { data: [] }, { data: null, error: null });
    await ensureDefaultLibrary("u1");
    const inserted = fake.argsOf("documents", "insert")[0][0] as { cache_key: string }[];
    expect(inserted).toHaveLength(DEFAULT_GUIDES.length);
    const stamp = fake.argsOf("profiles", "update")[0][0] as { default_library_guides: string[] };
    expect(stamp.default_library_guides).toEqual(allSeeded());
  });

  test("guides the account already has rows for are not inserted twice", async () => {
    fake.respond("profiles", { data: { default_library_guides: allSeeded().filter(item => !item.startsWith(`${first.id}@`)) } });
    fake.respond("documents", { data: [{ cache_key: seedCacheKey(first) }] });
    await ensureDefaultLibrary("u1");
    expect(fake.argsOf("documents", "insert")).toEqual([]);
    expect(fake.argsOf("profiles", "update")).toHaveLength(1);
  });

  test("an outdated guide is refreshed in place, including copies on the shared prefix", async () => {
    const stale = allSeeded().map(item => item.startsWith(`${first.id}@`) ? `${first.id}@0` : item);
    fake.respond("profiles", { data: { default_library_guides: stale } });
    await ensureDefaultLibrary("u1");
    const updates = fake.argsOf("documents", "update");
    expect(updates).toHaveLength(2);
    expect(updates[0][0]).toMatchObject({ title: first.curriculum.title });
    expect(fake.argsOf("documents", "like")).toEqual([["storage_path", `${SHARED_LIBRARY_PREFIX}%`]]);
    expect(fake.argsOf("documents", "insert")).toEqual([]);
  });

  test("a concurrent seed that wins the race is a no-op, other insert errors are raised", async () => {
    fake.respond("profiles", { data: null });
    fake.respond("documents", { data: [] }, { error: { message: "duplicate key value violates unique constraint" } });
    await expect(ensureDefaultLibrary("u1")).resolves.toBeUndefined();

    fake.respond("profiles", { data: null });
    fake.respond("documents", { data: [] }, { error: { message: "permission denied" } });
    await expect(ensureDefaultLibrary("u1")).rejects.toThrow("permission denied");
  });
});
