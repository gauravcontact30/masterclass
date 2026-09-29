/** @jest-environment node */
import { attachment, downloadFilename, filenameFromDisposition } from "@/lib/artistic-notes/download";
import { parseInline, plainInline } from "@/lib/artistic-notes/inline";

describe("inline markup", () => {
  test("bold and code runs are recognised, everything else stays literal", () => {
    expect(parseInline("**x**")).toEqual([{ text: "x", bold: true, code: false }]);
    expect(parseInline("a `b` *c*")).toEqual([{ text: "a ", bold: false, code: false }, { text: "b", bold: false, code: true }, { text: " *c*", bold: false, code: false }]);
    expect(plainInline("**Bold** and `code`")).toBe("Bold and code");
  });
});

describe("download helpers", () => {
  test("filenames are ASCII slugs that cannot break the header", () => {
    expect(downloadFilename("Café **Notes**: \"Part 1\" / <v2>", "notebook")).toBe("cafe-notes-part-1-v2.ipynb");
    expect(downloadFilename("../../etc/passwd", "notebook")).toBe("etc-passwd.ipynb");
    expect(downloadFilename("日本語", "notebook")).toBe("artistic-notes.ipynb");
    expect(downloadFilename("x".repeat(200), "notebook")).toBe(`${"x".repeat(60)}.ipynb`);
  });

  test("attachment() sets download headers and the client can read the name back", () => {
    const response = attachment("{}", "My Notes", "notebook");
    expect(response.headers.get("content-type")).toBe("application/x-ipynb+json; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="my-notes.ipynb"');
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(filenameFromDisposition(response.headers.get("content-disposition"))).toBe("my-notes.ipynb");
    expect(filenameFromDisposition('attachment; filename="../evil.exe"')).toBeNull();
    expect(filenameFromDisposition(null)).toBeNull();
    expect(filenameFromDisposition("inline")).toBeNull();
  });
});
