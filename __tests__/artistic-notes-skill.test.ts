/** @jest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { exportSchemas, requestLimits } from "@/lib/artistic-notes/schema";

/*
 * The skill teaches Claude the exact request shape. Every ```json block in it
 * must be tagged with the endpoint it targets and must parse against that
 * endpoint's zod schema, so the documentation cannot drift from the API.
 */
const SKILL = join(process.cwd(), ".claude/skills/artistic-notes-generator/SKILL.md");
const source = readFileSync(SKILL, "utf8");
const blocks = [...source.matchAll(/```json(?:[ \t]+([\w-]+))?\r?\n([\s\S]*?)```/g)].map(match => ({ tag: match[1], body: match[2] }));

test("the skill has YAML frontmatter with a name and a when-to-use description", () => {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  expect(frontmatter).not.toBeNull();
  expect(frontmatter![1]).toMatch(/^name: artistic-notes-generator$/m);
  expect(frontmatter![1]).toMatch(/^description: .*Use when/m);
});

test("the only JSON example is the tagged notebook request", () => {
  expect(blocks.map(block => block.tag)).toEqual(["notebook-request"]);
});

test("the notebook example is valid JSON that the schema accepts and demonstrates the fast-learning mandates", () => {
  const result = exportSchemas.notebook.safeParse(JSON.parse(blocks[0].body));
  if (!result.success) throw new Error(`notebook example rejected:\n${JSON.stringify(result.error.issues, null, 2)}`);
  for (const section of result.data.sections) {
    expect(section.recall.length).toBeGreaterThan(0);
    expect(section.code.length).toBeGreaterThan(0);
  }
  expect(result.data.sections.some(section => section.formulas.length > 0 && section.markdown.includes("$"))).toBe(true);
});

test("the documented body limit and endpoint match the implementation", () => {
  for (const [format, limit] of Object.entries(requestLimits)) {
    const section = source.slice(source.indexOf(`## Schema: \`POST /api/generate/${format}\``));
    expect(section.slice(0, 400)).toContain(`Body limit ${limit.toLocaleString("en-US")} bytes`);
  }
});
