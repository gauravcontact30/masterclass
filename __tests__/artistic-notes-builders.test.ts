/** @jest-environment node */
import { attachment, downloadFilename, filenameFromDisposition } from "@/lib/artistic-notes/download";
import { parseInline, plainInline } from "@/lib/artistic-notes/inline";
import { buildPdfHtml, inlineHtml, pdfFooterTemplate } from "@/lib/artistic-notes/pdf-template";
import { pdfRequestSchema } from "@/lib/artistic-notes/schema";
import { artisticThemes } from "@/lib/artistic-notes/themes";

const hostile = `<script>alert("x")</script><img src=x onerror=alert(1)>`;

describe("PDF template", () => {
  const guide = pdfRequestSchema.parse({
    title: `Guide ${hostile}`,
    subtitle: "Sub **bold** `code`",
    theme: "retro-cyberpunk",
    summary: [`Summary ${hostile}`],
    sections: [{
      heading: `Heading ${hostile}`,
      blocks: [
        { type: "text", text: `Para one ${hostile}\n\nPara two` },
        { type: "bullets", items: [hostile] },
        { type: "definition", term: hostile, meaning: hostile, example: hostile },
        { type: "takeaway", text: hostile },
        { type: "warning", text: hostile },
        { type: "recall", question: `Why ${hostile}?`, answer: `Because ${hostile}` },
        { type: "formula", expression: hostile, caption: hostile },
        { type: "code", language: "html", code: `</code></pre>${hostile}` },
      ],
    }],
  });

  test("escapes every piece of user text", () => {
    const html = buildPdfHtml(guide);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img/i);
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;/code&gt;&lt;/pre&gt;");
    expect(pdfFooterTemplate(guide)).not.toMatch(/<script/i);
  });

  test("lays out a dual-column guide with every callout, an answer key and a spaced review", () => {
    const html = buildPdfHtml(guide);
    expect(html).toContain("column-count:2");
    for (const kind of ["definition", "takeaway", "warning", "recall"]) expect(html).toContain(`class="callout c-${kind}"`);
    expect(html).toContain("Answer key");
    expect(html).toContain("Spaced review");
    expect(html).toContain("The 60-second preview");
    expect(html).toContain("<p>Para one");
    expect(html).toContain("<p>Para two</p>");
  });

  test("uses the theme's colours and embeds only a data: URI font", () => {
    const html = buildPdfHtml(guide, { fontBase64: "AAAA" });
    expect(html).toContain(`#${artisticThemes["retro-cyberpunk"].background}`);
    expect(html).toContain("src:url(data:font/ttf;base64,AAAA)");
    expect(html.match(/url\(([^)]*)\)/g)?.every(url => url.startsWith("url(data:"))).toBe(true);
    expect(html).not.toMatch(/https?:\/\//);
  });

  test("numbers recall prompts consistently between callouts and the answer key", () => {
    const html = buildPdfHtml(pdfRequestSchema.parse({ title: "T", summary: ["S"], sections: [
      { heading: "A", blocks: [{ type: "recall", question: "First?", answer: "One" }] },
      { heading: "B", blocks: [{ type: "recall", question: "Second?", answer: "Two" }] },
    ] }));
    expect(html).toContain("Active recall · Q2");
    expect(html).toMatch(/<b>Q2<\/b>Second\?/);
  });

  test("inline markup becomes strong/code, everything else stays literal", () => {
    expect(inlineHtml("a **b** `<c>` *d*")).toBe("a <strong>b</strong> <code>&lt;c&gt;</code> *d*");
    expect(parseInline("**x**")).toEqual([{ text: "x", bold: true, code: false }]);
    expect(plainInline("**Bold** and `code`")).toBe("Bold and code");
  });
});

describe("download helpers", () => {
  test("filenames are ASCII slugs that cannot break the header", () => {
    expect(downloadFilename("Café **Notes**: \"Part 1\" / <v2>", "pdf")).toBe("cafe-notes-part-1-v2.pdf");
    expect(downloadFilename("../../etc/passwd", "notebook")).toBe("etc-passwd.ipynb");
    expect(downloadFilename("日本語", "pptx")).toBe("artistic-notes.pptx");
    expect(downloadFilename("x".repeat(200), "pdf")).toBe(`${"x".repeat(60)}.pdf`);
  });

  test("attachment() sets download headers and the client can read the name back", () => {
    const response = attachment("{}", "My Notes", "notebook");
    expect(response.headers.get("content-type")).toBe("application/x-ipynb+json; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="my-notes.ipynb"');
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(filenameFromDisposition(response.headers.get("content-disposition"))).toBe("my-notes.ipynb");
    expect(filenameFromDisposition('attachment; filename="../evil.exe"')).toBeNull();
  });
});
