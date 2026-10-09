/** @jest-environment node */
import { checkDocumentation, documentationStatus, importDocumentation, readDocumentation } from "@/lib/server/documentation-updates";
import { fetchDocumentation } from "@/lib/generation/sources";
import { db } from "@/lib/server/db";

jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
jest.mock("@/lib/generation/sources", () => ({ fetchDocumentation: jest.fn() }));
jest.mock("@/lib/official-docs-data", () => ({ OFFICIAL_DOCS: [{ id: "react", title: "React", officialUrl: "https://react.dev/learn" }] }));
jest.mock("@/lib/server/http", () => ({ HttpError: class extends Error { constructor(public status: number, public code: string) { super(code); } } }));

const files = new Map<string, string>();
const upload = jest.fn(async (path: string, data: string) => { files.set(path, data); return { error: null }; });
beforeEach(() => {
  files.clear(); jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date("2026-10-09T12:00:00Z"));
  (db as jest.Mock).mockReturnValue({ storage: {
    getBucket: jest.fn().mockResolvedValue({ data: { public: false } }),
    from: () => ({ upload, download: async (path: string) => files.has(path)
      ? { data: { text: async () => files.get(path) }, error: null }
      : { data: null, error: { statusCode: "404", message: "Object not found" } } }),
  } });
  (fetchDocumentation as jest.Mock).mockImplementation(async () => [{ url: "https://react.dev/learn", title: "Learn React", text: "Official React documentation", retrievedAt: new Date().toISOString() }]);
});
afterEach(() => jest.useRealTimers());

test("first check is importable but does not claim an existing copy is outdated", async () => {
  expect(documentationStatus("react", null).status).toBe("unchecked");
  expect((await checkDocumentation("react")).status).toBe("available");
  expect((await readDocumentation("react"))?.published).toBeNull();
});

test("import persists source text, then a changed source awaits explicit upgrade", async () => {
  await checkDocumentation("react");
  const first = (await readDocumentation("react"))!;
  expect((await importDocumentation("react", first.pending.hash)).status).toBe("current");
  jest.advanceTimersByTime(61000);
  (fetchDocumentation as jest.Mock).mockResolvedValue([{ ...first.pending, text: "Updated official guidance", retrievedAt: new Date().toISOString() }]);
  expect((await checkDocumentation("react")).status).toBe("changed");
  const pending = (await readDocumentation("react"))!;
  expect(pending.published?.text).toBe(first.pending.text);
  await expect(importDocumentation("react", first.pending.hash)).rejects.toThrow("documentation_changed_check_again");
  await importDocumentation("react", pending.pending.hash);
  expect((await readDocumentation("react"))?.published?.text).toBe("Updated official guidance");
});

test("network failure preserves the imported copy and last successful check", async () => {
  await checkDocumentation("react");
  await importDocumentation("react", (await readDocumentation("react"))!.pending.hash);
  const before = files.get("react.json");
  jest.advanceTimersByTime(61000);
  (fetchDocumentation as jest.Mock).mockRejectedValue(new Error("timeout"));
  await expect(checkDocumentation("react")).rejects.toThrow("timeout");
  expect(files.get("react.json")).toBe(before);
});

test("normalizes whitespace and coalesces simultaneous checks", async () => {
  await Promise.all([checkDocumentation("react"), checkDocumentation("react")]);
  expect(fetchDocumentation).toHaveBeenCalledTimes(1);
  await importDocumentation("react", (await readDocumentation("react"))!.pending.hash);
  jest.advanceTimersByTime(61000);
  (fetchDocumentation as jest.Mock).mockResolvedValue([{ url: "https://react.dev/learn", title: "React", text: "Official  React\n documentation", retrievedAt: new Date().toISOString() }]);
  expect((await checkDocumentation("react")).status).toBe("current");
});

test("rejects arbitrary URLs and unknown technology identifiers before fetching", async () => {
  await expect(checkDocumentation("https://127.0.0.1/admin")).rejects.toThrow("documentation_not_found");
  expect(fetchDocumentation).not.toHaveBeenCalled();
});

test("does not report an import as successful when persistence fails", async () => {
  await checkDocumentation("react");
  upload.mockResolvedValueOnce({ error: { message: "offline" } } as never);
  await expect(importDocumentation("react", (await readDocumentation("react"))!.pending.hash)).rejects.toThrow("documentation_storage_unavailable");
  expect((await readDocumentation("react"))?.published).toBeNull();
});
