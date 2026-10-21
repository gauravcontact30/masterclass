/** Light paper tones only, so body text stays readable. The first six are the originals; saved documents keep them. */
export const PAPER_COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Ivory", value: "#fffbed" },
  { name: "Mint", value: "#eff8f1" },
  { name: "Sky", value: "#eff6ff" },
  { name: "Lavender", value: "#f5f0ff" },
  { name: "Rose", value: "#fff1f2" },
  { name: "Cream", value: "#fdf6e3" },
  { name: "Parchment", value: "#f6efdf" },
  { name: "Linen", value: "#faf0e6" },
  { name: "Sand", value: "#f5ecd9" },
  { name: "Peach", value: "#fff0e5" },
  { name: "Apricot", value: "#ffe9d6" },
  { name: "Blush", value: "#fdeef4" },
  { name: "Lilac", value: "#f3eafb" },
  { name: "Periwinkle", value: "#eceffd" },
  { name: "Ice", value: "#ecf8fc" },
  { name: "Aqua", value: "#e8f8f5" },
  { name: "Sage", value: "#eef3e8" },
  { name: "Pistachio", value: "#f1f8e4" },
  { name: "Lemon", value: "#fffbd6" },
  { name: "Butter", value: "#fff6cc" },
  { name: "Pearl", value: "#f7f7f4" },
  { name: "Mist", value: "#f1f4f6" },
  { name: "Stone", value: "#eeece6" },
  { name: "Silver", value: "#ebedf0" },
];

/** Keep imported/pasted documents inert, including documents restored from browser storage. */
export function sanitizeNotepadHtml(html: string): string {
  const source = new DOMParser().parseFromString(html, "text/html");
  const allowed = new Set("P DIV SPAN BR B STRONG I EM U S STRIKE SUB SUP H1 H2 H3 H4 H5 H6 UL OL LI BLOCKQUOTE PRE CODE HR TABLE THEAD TBODY TFOOT TR TH TD IMG A FONT".split(" "));
  const styles = new Set(["color", "background-color", "font-family", "font-size", "font-weight", "font-style", "text-decoration", "text-align", "margin-left", "line-height", "white-space", "break-before", "page-break-before"]);
  function clean(node: Node): Node {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || "");
    if (!(node instanceof HTMLElement) || !allowed.has(node.tagName)) return document.createTextNode("");
    const el = document.createElement(node.tagName.toLowerCase());
    if (["workflow", "decision"].includes(node.getAttribute("data-notepad-diagram") || "")) el.setAttribute("data-notepad-diagram", node.getAttribute("data-notepad-diagram")!);
    for (const property of styles) {
      const value = node.style.getPropertyValue(property);
      if (value && !/url\s*\(|expression|var\s*\(/i.test(value)) el.style.setProperty(property, value);
    }
    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") || "";
      if (!/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(src)) return document.createTextNode(node.getAttribute("alt") || "");
      el.setAttribute("src", src); el.setAttribute("alt", node.getAttribute("alt") || "Imported image");
    }
    if (node.tagName === "A" && /^(https?:|mailto:)/i.test(node.getAttribute("href") || "")) el.setAttribute("href", node.getAttribute("href")!);
    for (const attr of ["colspan", "rowspan"]) if (/^\d{1,2}$/.test(node.getAttribute(attr) || "")) el.setAttribute(attr, node.getAttribute(attr)!);
    if (node.tagName === "FONT") for (const attr of ["color", "face", "size"]) if (node.hasAttribute(attr)) el.setAttribute(attr, node.getAttribute(attr)!);
    node.childNodes.forEach(child => el.append(clean(child)));
    return el;
  }
  const result = document.createElement("div");
  source.body.childNodes.forEach(node => result.append(clean(node)));
  return result.innerHTML;
}

export function notepadDocument(title: string, html: string, background = "#ffffff") {
  const paper = PAPER_COLORS.some(color => color.value === background) ? background : "#ffffff";
  const escaped = title.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="notepad-paper" content="${paper}"><title>${escaped}</title><style>body{background:${paper};print-color-adjust:exact;max-width:800px;margin:40px auto;font:16px/1.6 Arial;padding:24px;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:8px;min-width:40px}img{max-width:100%;height:auto}ul{list-style:disc}ol{list-style:decimal}@media print{body{margin:0;padding:0}hr{break-after:page}}</style></head><body>${sanitizeNotepadHtml(html)}</body></html>`;
}
