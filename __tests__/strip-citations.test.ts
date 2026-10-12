import { stripCitations, stripCitationsDeep, stripCompletionCitations } from "@/lib/strip-citations";

test.each([
  ["Next.js 16 ships Turbopack by default.[1][5]", "Next.js 16 ships Turbopack by default."],
  ["React is a UI library[1].", "React is a UI library."],
  ["Use a session ID[2] to keep context[3][4].", "Use a session ID to keep context."],
  ["Footnote style[^1] also goes.", "Footnote style also goes."],
  ["Line one[1]\nLine two[12]", "Line one\nLine two"],
])("removes citation markers: %s", (input, expected) => {
  expect(stripCitations(input)).toBe(expected);
});

test.each([
  "const first = arr[0];",
  "Read `items[1]` for the second item.",
  "```js\nconst second = parts[1];\nconsole.log(matrix[2][3]);\n```",
  'const ip = header.split(",")[1];',
  "const name = match?.[1];",
  "rows[1].length",
  "values[2](x)",
  "grid[1][2] = 5",
  "It returns [1, 2, 3] for that input.",
  "A one-item list [1] is still a list.",
  "Index with arr[0] first.",
  "NumPy slices like a[1, 2] are code.",
])("leaves code and literals alone: %s", text => {
  expect(stripCitations(text)).toBe(text);
});

test("structured answers keep code fields and JSON arrays intact", () => {
  const answer = { summary: "Langflow runs flows.[1][2]", code: "print(results[1])", ids: [1, 2], steps: ["Install it[3]", "Run it."] };
  expect(stripCitationsDeep(answer)).toEqual({ summary: "Langflow runs flows.", code: "print(results[1])", ids: [1, 2], steps: ["Install it", "Run it."] });
});

test("raw completions are cleaned as JSON when they are JSON, and as text otherwise", () => {
  expect(JSON.parse(stripCompletionCitations('```json\n{"answer":"Fast.[1]","example":"x = a[1]"}\n```'))).toEqual({ answer: "Fast.", example: "x = a[1]" });
  expect(stripCompletionCitations("Plain answer.[3]")).toBe("Plain answer.");
  // Broken JSON goes back untouched so the caller's repair attempt sees the original.
  expect(stripCompletionCitations('{"answer": "Fast.[1]"')).toBe('{"answer": "Fast.[1]"');
});
