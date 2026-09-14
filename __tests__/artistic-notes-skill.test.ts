/** @jest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { exportSchemas, pdfBlockTypes, requestLimits, type ExportFormat } from "@/lib/artistic-notes/schema";

/*
 * The skill teaches Claude the exact request shapes. Every ```json block in
 * it must be tagged with the endpoint it targets and must parse against that
 * endpoint's zod schema, so the documentation cannot drift from the API.
 */
const SKILL = join(process.cwd(), ".claude/skills/artistic-notes-generator/SKILL.md");
const TAGS: Record<string, ExportFormat> = { "pdf-request": "pdf", "pptx-request": "pptx", "notebook-request": "notebook" };
const source = readFileSync(SKILL, "utf8");
const blocks = [...source.matchAll(/```json(?:[ \t]+([\w-]+))?\r?\n([\s\S]*?)```/g)].map(match => ({ tag: match[1], body: match[2] }));

test("the skill has YAML frontmatter with a name and a when-to-use description", () => {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  expect(frontmatter).not.toBeNull();
  expect(frontmatter![1]).toMatch(/^name: artistic-notes-generator$/m);
  expect(frontmatter![1]).toMatch(/^description: .*Use when/m);
});

test("every JSON example is tagged with its endpoint, and each endpoint has exactly one", () => {
  expect(blocks.map(block => block.tag).sort()).toEqual(["notebook-request", "pdf-request", "pptx-request"]);
});

test.each(Object.entries(TAGS))("the %s example is valid JSON that the schema accepts", (tag, format) => {
  const block = blocks.find(item => item.tag === tag)!;
  const payload = JSON.parse(block.body);
  const result = exportSchemas[format].safeParse(payload);
  if (!result.success) throw new Error(`${tag} example rejected:\n${JSON.stringify(result.error.issues, null, 2)}`);
});

test("the examples demonstrate the fast-learning mandates they teach", () => {
  const pdf = exportSchemas.pdf.parse(JSON.parse(blocks.find(item => item.tag === "pdf-request")!.body));
  const used = new Set(pdf.sections.flatMap(section => section.blocks.map(block => block.type)));
  expect([...used].sort()).toEqual([...pdfBlockTypes].sort());
  for (const section of pdf.sections) expect(section.blocks.some(block => block.type === "recall")).toBe(true);

  const pptx = exportSchemas.pptx.parse(JSON.parse(blocks.find(item => item.tag === "pptx-request")!.body));
  expect(pptx.slides.filter(slide => slide.recall).length * 2).toBeGreaterThanOrEqual(pptx.slides.length);
  expect(pptx.slides.every(slide => slide.points.length <= 3)).toBe(true);

  const notebook = exportSchemas.notebook.parse(JSON.parse(blocks.find(item => item.tag === "notebook-request")!.body));
  for (const section of notebook.sections) {
    expect(section.recall.length).toBeGreaterThan(0);
    expect(section.code.length).toBeGreaterThan(0);
  }
  expect(notebook.sections.some(section => section.formulas.length > 0 && /\$/.test(section.markdown))).toBe(true);
});

test("the documented body limits and endpoints match the implementation", () => {
  for (const [format, limit] of Object.entries(requestLimits)) {
    const section = source.slice(source.indexOf(`## Schema: \`POST /api/generate/${format}\``));
    expect(section.slice(0, 400)).toContain(`Body limit ${limit.toLocaleString("en-US")} bytes`);
  }
});
