import type { ExportFormat } from "./schema";
import { plainInline } from "./inline";

export const exportFiles: Record<ExportFormat, { extension: string; contentType: string }> = {
  notebook: { extension: "ipynb", contentType: "application/x-ipynb+json" },
};

/**
 * An ASCII-only, header-safe filename derived from the document title:
 * lowercase letters, digits and single hyphens, at most 60 characters, never
 * empty. Accents are folded ("Café" -> "cafe"); anything else — quotes,
 * slashes, CR/LF, path segments — is dropped, so the value can be embedded in
 * a quoted Content-Disposition parameter without further escaping.
 */
export function downloadFilename(title: string, format: ExportFormat): string {
  const slug = plainInline(title)
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `${slug || "artistic-notes"}.${exportFiles[format].extension}`;
}

/** The download response every export endpoint returns. */
export function attachment(body: BodyInit, title: string, format: ExportFormat): Response {
  const { contentType } = exportFiles[format];
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${downloadFilename(title, format)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Reads the filename back out of a Content-Disposition header (client side), if it is one we produced. */
export function filenameFromDisposition(header: string | null): string | null {
  const match = header?.match(/filename="([a-z0-9-]+\.ipynb)"/);
  return match ? match[1] : null;
}
