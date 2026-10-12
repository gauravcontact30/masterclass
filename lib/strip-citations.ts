/**
 * Search-grounded models (Perplexity, OpenRouter ":online") mark claims with
 * numbered references such as "fast.[1][5]" or "claim[^2]". The app never shows
 * the numbered source list, so the markers are noise and are removed from all
 * AI text before it is displayed, cached or stored.
 *
 * Code must survive untouched: `arr[1]` inside fenced or inline code is never
 * changed, and a bracket after ":", ",", "[", "{", "(" or "=" is a JSON or
 * code array (`"ids": [1]`), not a citation.
 */
// Citations count from 1, so "[0]" is always an index. Only markers attached to the
// preceding word are citations: "returns [1, 2]" in a coding answer is a real array.
const MARKER = String.raw`\[\^?[1-9]\d?\]`;
// After ")", "]", a quote or "?." it is indexing (`split(",")[1]`, `match?.[1]`), and
// followed by ".name", "(", "[", a word character or an operator (`grid[1][2] = 5`) it is an index expression.
const CITATIONS = new RegExp(String.raw`(?<!\?\.)(?<=[^\s:,\[\]{}()=<"'\x60])(?:${MARKER})+(?!\.\w|[(=\w\[]|\s*(?:[=+*/%]|[<>!]=))`, "g");
const CODE = /(```[\s\S]*?```|`[^`\n]*`)/;

export function stripCitations(text: string): string {
  if (!text.includes("[")) return text;
  return text.split(CODE).map((part, index) => index % 2 ? part : part.replace(CITATIONS, "")).join("");
}

/** Fields that hold code or literal values in structured answers; they are left exactly as generated. */
const LITERAL_KEY = /(code|command|snippet|signature|syntax|regex|pattern|query|expression|example|sql|script|cli|path|url|json|yaml|output|input)s?$/i;

/** Strip markers from every prose string in a structured answer, skipping code-like fields. */
export function stripCitationsDeep<T>(value: T, key = ""): T {
  if (typeof value === "string") return (LITERAL_KEY.test(key) ? value : stripCitations(value)) as T;
  if (Array.isArray(value)) return value.map(item => stripCitationsDeep(item, key)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, stripCitationsDeep(item, name)])) as T;
  }
  return value;
}

/**
 * Clean a raw model completion. JSON answers are parsed so only prose fields
 * change; anything that doesn't parse is returned as is for the caller's own
 * validation and repair. Plain answers are stripped outside code.
 */
export function stripCompletionCitations(text: string): string {
  const body = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  if (body.startsWith("{") || body.startsWith("[")) {
    try { return JSON.stringify(stripCitationsDeep(JSON.parse(body))); } catch { return text; }
  }
  return stripCitations(text);
}
