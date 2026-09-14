/** @jest-environment node */
import { POST as pdfPOST, runtime as pdfRuntime } from "@/app/api/generate/pdf/route";
import { POST as pptxPOST, runtime as pptxRuntime } from "@/app/api/generate/pptx/route";
import { renderPdf } from "@/lib/artistic-notes/pdf";
import { buildPptx } from "@/lib/artistic-notes/pptx";
import { chromiumPath } from "@/lib/server/config";
import { userId } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";

// Route wiring for the two binary exports. The builders are replaced (the PDF
// one needs a real Chromium; both are covered by their own tests), the HTTP
// helpers are real apart from the session lookup.
jest.mock("@/lib/server/auth", () => ({ supabaseServer: jest.fn() }));
jest.mock("@/lib/server/http", () => ({ ...jest.requireActual("@/lib/server/http"), userId: jest.fn() }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/server/config", () => ({ ...jest.requireActual("@/lib/server/config"), chromiumPath: jest.fn(), documentFontPath: jest.fn() }));
jest.mock("@/lib/artistic-notes/pdf", () => ({ renderPdf: jest.fn() }));
jest.mock("@/lib/artistic-notes/pptx", () => ({ buildPptx: jest.fn() }));

const request = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost" }, body: JSON.stringify(body) });
const pdfBody = { title: "Sorting <algorithms>", summary: ["Merge sort is O(n log n)"], sections: [{ heading: "Merge", blocks: [{ type: "takeaway", text: "Split, sort, merge." }] }] };
const pptxBody = { title: "Sorting", slides: [{ concept: "Merge sort", headline: "Split, sort, merge." }] };

beforeEach(() => {
  jest.clearAllMocks();
  (userId as jest.Mock).mockResolvedValue("alice");
  (rateLimit as jest.Mock).mockResolvedValue(undefined);
  (chromiumPath as jest.Mock).mockReturnValue("/usr/bin/chromium");
  (renderPdf as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.7 test"));
  (buildPptx as jest.Mock).mockResolvedValue(Buffer.from("PK test"));
});

test("both routes run on the Node.js runtime (puppeteer needs Node)", () => {
  expect(pdfRuntime).toBe("nodejs");
  expect(pptxRuntime).toBe("nodejs");
});

test("PDF: validated input goes to the renderer and comes back as a private attachment", async () => {
  const response = await pdfPOST(request("/api/generate/pdf", pdfBody));
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(response.headers.get("content-disposition")).toBe('attachment; filename="sorting-algorithms.pdf"');
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("%PDF-1.7 test");
  expect(renderPdf).toHaveBeenCalledWith(expect.objectContaining({ title: "Sorting <algorithms>", theme: "high-contrast-light" }));
  expect(rateLimit).toHaveBeenCalledWith("artistic-notes:pdf:alice", 6);
});

test("PDF: 503 setup_required when no Chromium is available, without using a rate-limit slot", async () => {
  (chromiumPath as jest.Mock).mockImplementation(() => { throw new Error("CONFIG:CHROMIUM_EXECUTABLE_PATH"); });
  const response = await pdfPOST(request("/api/generate/pdf", pdfBody));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "setup_required" });
  expect(rateLimit).not.toHaveBeenCalled();
  expect(renderPdf).not.toHaveBeenCalled();
});

test("PDF: 400 on invalid input, never reaching the renderer", async () => {
  const response = await pdfPOST(request("/api/generate/pdf", { ...pdfBody, sections: [{ heading: "Merge", blocks: [{ type: "iframe", src: "https://x" }] }] }));
  expect(response.status).toBe(400);
  expect(renderPdf).not.toHaveBeenCalled();
});

test("PDF: a renderer failure is a generic 500 that leaks nothing", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  (renderPdf as jest.Mock).mockRejectedValue(new Error("Navigation timeout at C:/secret/path"));
  const response = await pdfPOST(request("/api/generate/pdf", pdfBody));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "service_error" });
});

test("PPTX: returns the deck with the OOXML content type", async () => {
  const response = await pptxPOST(request("/api/generate/pptx", pptxBody));
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/vnd.openxmlformats-officedocument.presentationml.presentation");
  expect(response.headers.get("content-disposition")).toBe('attachment; filename="sorting.pptx"');
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(rateLimit).toHaveBeenCalledWith("artistic-notes:pptx:alice", 10);
});

test("PPTX: enforces one concept per slide at the API boundary", async () => {
  const response = await pptxPOST(request("/api/generate/pptx", { ...pptxBody, slides: [{ ...pptxBody.slides[0], points: ["a", "b", "c", "d"] }] }));
  expect(response.status).toBe(400);
  expect(buildPptx).not.toHaveBeenCalled();
});
