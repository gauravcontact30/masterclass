/** @jest-environment node */
import { GET } from "@/app/api/documents/[id]/download/route";
import { ownedDocument } from "@/lib/server/repository";
import { recordEvent } from "@/lib/server/monitoring";

jest.mock("@/lib/server/http", () => ({
  userId: async () => "alice",
  HttpError: class extends Error { constructor(public status: number, message: string) { super(message); } },
  api: async (fn: () => Promise<Response>) => { try { return await fn(); } catch (error) { const e = error as { status?: number; message: string }; return Response.json({ error: e.message }, { status: e.status ?? 500 }); } },
}));
jest.mock("@/lib/server/repository", () => ({ ownedDocument: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));

const curriculum = { title: "Functions", minutes: 20, objectives: ["Understand functions"], prerequisites: [], lessons: [], project: "Create a function", summary: "Functions return values", glossary: [] };
const get = (id = "doc-1") => GET(new Request(`http://localhost/api/documents/${id}/download`), { params: Promise.resolve({ id }) });

beforeEach(() => {
  (ownedDocument as jest.Mock).mockResolvedValue({ status: "ready", title: "Functions", request: { format: "notes", language: "en" }, storage_path: null, curriculum });
});

test("exports the owned study notes as a private UTF-8 text attachment with a BOM", async () => {
  const result = await get();
  expect(ownedDocument).toHaveBeenCalledWith("doc-1", "alice");
  expect(result.status).toBe(200);
  expect(result.headers.get("content-type")).toBe("text/plain; charset=utf-8");
  expect(result.headers.get("content-disposition")).toBe('attachment; filename="masterclass-doc-1-notes.txt"');
  expect(result.headers.get("cache-control")).toBe("private, no-store");
  expect(result.headers.get("x-content-type-options")).toBe("nosniff");
  const bytes = new Uint8Array(await result.arrayBuffer());
  expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  expect(new TextDecoder().decode(bytes)).toContain("Functions return values");
  expect(recordEvent).toHaveBeenCalledWith(expect.objectContaining({ kind: "export", action: "download_notes", actor_id: "alice", resource: "doc-1", bytes: expect.any(Number) }));
});

test("strips anything but letters, digits and dashes from the filename", async () => {
  const result = await get("../doc_1\"x");
  expect(result.headers.get("content-disposition")).toBe('attachment; filename="masterclass-doc1x-notes.txt"');
});

test.each([[{ status: "generating", curriculum }], [{ status: "ready", curriculum: null }]])("refuses a document that is not ready (%o)", async document => {
  (ownedDocument as jest.Mock).mockResolvedValue({ ...document, title: "T", request: { language: "en" } });
  const result = await get();
  expect(result.status).toBe(409);
  expect(recordEvent).not.toHaveBeenCalled();
});
