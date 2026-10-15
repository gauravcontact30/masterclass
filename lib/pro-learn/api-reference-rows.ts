import type { ApiDetail } from "@/lib/api-docs-details";
import type { AwsHighlight } from "./aws-highlights";
import { conciseFocus, emptyAnswer } from "./prepared-explanation";

/** What an API Docs entry can add on top of its reference: verified cards carry their own interview questions. */
export type ReferenceDetail = ApiDetail & { descriptionLong?: string; since?: string; subjective?: { question: string; answer: string }[] };

const EXTENSIONS: Record<string, string> = { python: "py", typescript: "ts", tsx: "tsx", javascript: "js", jsx: "jsx", bash: "sh", json: "json", yaml: "yaml", css: "css", html: "html" };

function exampleFile(name: string, language: string) {
  const base = name.toLowerCase().replace(/\{[^}]*\}/g, "id").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "example";
  return `${base}.${EXTENSIONS[language] ?? "txt"}`;
}

/**
 * One API Docs entry as a Search row, carrying the reference the API Docs page
 * shows: signature, parameters, return value, an official example, notes, use
 * cases and, when the entry has them, authored interview questions.
 */
export function apiReferenceRow(name: string, category: string, detail: ReferenceDetail, preview = false): AwsHighlight {
  const answer = emptyAnswer(name, detail.description);
  answer.summary = [detail.descriptionLong, detail.returns && `Returns: ${detail.returns}`, detail.since && `Available since ${detail.since}.`].filter(Boolean).join("\n\n");
  if (detail.signature) answer.steps.push({ title: `Signature${preview ? " (preview)" : ""}`, detail: `How ${name} is called, as documented for ${detail.packageName}.`, code: detail.signature });
  if (detail.parameters.length) answer.steps.push({ title: "Parameters", detail: detail.parameters.map(p => `${p.name} (${p.type}): ${p.description}`).join("\n\n"), code: "" });
  if (detail.code) answer.files = [{ path: exampleFile(name, detail.language), code: detail.code, note: "Example from the official documentation" }];
  answer.keyPoints = [...detail.notes];
  answer.useCases = detail.useCases.map(title => ({ title, scenario: "", example: "" }));
  answer.subjects = (detail.subjective ?? []).slice(0, 4).map(item => ({ name: item.question, summary: item.answer, details: [], keyPoints: [] }));
  return {
    name, category, summary: detail.description, points: detail.notes.slice(0, 3),
    prepared: { answer, focus: conciseFocus(detail.description), kind: "interview", sources: [{ title: `Official docs: ${name}`, url: detail.source }] },
  };
}
