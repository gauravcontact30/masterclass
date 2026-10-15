import { LANGFLOW_DETAILS, LANGFLOW_ENTRIES } from "@/lib/api-docs-langflow";
import type { AwsHighlight } from "../aws-highlights";
import { apiReferenceRow } from "../api-reference-rows";

/**
 * The Langflow API reference as Search rows.
 *
 * Generated from the same official-docs entries the API Docs page renders
 * (lib/api-docs-langflow.ts), so the two pages cannot drift apart: an entry
 * added there appears in the LangFlow tab under its reference group.
 */
const GROUPS: Record<string, string> = {
  M: "API docs: Concepts",
  CLI: "API docs: CLI & LFX",
  SVC: "API docs: REST API",
  Co: "API docs: Components",
  C: "API docs: Python & TypeScript",
  F: "API docs: Python & TypeScript",
  K: "API docs: Configuration",
};

export const LANGFLOW_API_TOPICS: AwsHighlight[] = LANGFLOW_ENTRIES.flatMap(({ name, kind, status }) => {
  const detail = LANGFLOW_DETAILS[`langflow:${name}`];
  return detail ? [apiReferenceRow(name, GROUPS[kind] ?? "API docs: Reference", detail, status === "p")] : [];
});
