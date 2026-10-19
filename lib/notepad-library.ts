import { PAPER_COLORS, sanitizeNotepadHtml } from "./notepad";

export type NotepadFile = { id: string; title: string; html: string; background: string; kind: "draft" | "saved" | "imported"; starred: boolean; createdAt: string; updatedAt: string };
export type NotepadCollection = { version: 2; activeId: string; documents: NotepadFile[] };
export const newNotepadFile = (title = "Untitled document", html = "", background = "#ffffff", kind: NotepadFile["kind"] = "draft"): NotepadFile => ({ id: crypto.randomUUID(), title, html, background, kind, starred: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

/** Accept the old single-draft format without dropping that draft during upgrade. */
export function readNotepadCollection(raw: string | null): NotepadCollection {
  if (!raw) { const file = newNotepadFile(); return { version: 2, activeId: file.id, documents: [file] }; }
  const data = JSON.parse(raw);
  const inputs = data.version === 2 ? data.documents : [{ ...data, id: "recovered-draft", updatedAt: data.savedAt, createdAt: data.savedAt, kind: "draft" }];
  if (!Array.isArray(inputs) || !inputs.length) throw new Error("Invalid document library");
  const ids = new Set<string>();
  const documents = inputs.map((input): NotepadFile => {
    if (!input || typeof input.id !== "string" || ids.has(input.id) || typeof input.title !== "string" || typeof input.html !== "string") throw new Error("Invalid saved document");
    ids.add(input.id);
    const validDate = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : new Date().toISOString();
    return { id: input.id, title: input.title, html: sanitizeNotepadHtml(input.html), background: PAPER_COLORS.some(color => color.value === input.background) ? input.background : "#ffffff", kind: input.kind === "saved" || input.kind === "imported" ? input.kind : "draft", starred: input.starred === true, createdAt: validDate(input.createdAt), updatedAt: validDate(input.updatedAt) };
  });
  return { version: 2, documents, activeId: ids.has(data.activeId) ? data.activeId : documents[0].id };
}

export function documentText(html: string) {
  return new DOMParser().parseFromString(html, "text/html").body.textContent || "";
}

export function workflowHtml(text: string, decision = false) {
  const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  const steps = text.split("\n").map(step => step.trim()).filter(Boolean).slice(0, 12).map(escape);
  if (decision) {
    const [question = "Decision", yes = "Yes outcome", no = "No outcome"] = steps;
    return `<div data-notepad-diagram="decision"><table><tbody><tr><th colspan="2" style="background-color:#eff6ff;text-align:center">${question}</th></tr><tr><td style="text-align:center">Yes ↓</td><td style="text-align:center">No ↓</td></tr><tr><td style="background-color:#eff8f1">${yes}</td><td style="background-color:#fff1f2">${no}</td></tr></tbody></table></div><p><br></p>`;
  }
  return `<div data-notepad-diagram="workflow"><table><tbody>${steps.map((step, index) => `${index ? '<tr><td style="text-align:center">↓</td></tr>' : ""}<tr><td style="background-color:#eff6ff;text-align:center">${step}</td></tr>`).join("")}</tbody></table></div><p><br></p>`;
}
