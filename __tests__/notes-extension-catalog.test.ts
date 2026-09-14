/** @jest-environment node */
import { curriculumSchema, objectiveQuestionSchema } from "@/lib/domain";
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { CLAUDE_EXTENSIONS_CORE_COUNT } from "@/lib/generation/guides/claude-ecosystem";
import { CLAUDE_EXTENSION_NOTES, CLAUDE_EXTENSION_SEEDS } from "@/lib/notes-claude-extensions";
import { TANSTACK_CATEGORY_ORDER } from "@/lib/notes-tanstack-ecosystem";
import { getStudyNote, NOTES_SUMMARIES, STUDY_NOTES } from "@/lib/server/notes-study-catalog";

test("Claude extension course refreshes the library and resolves every chapter", () => {
  const guide = DEFAULT_GUIDES.find(item => item.id === "claude-skills-plugins-mcp")!;
  const course = getStudyNote("claude-skills-plugins-mcp-course")!;
  expect(course.title).toBe("Claude Skills, Plugins and MCP");
  expect(course.learnInApp).toBe(true);
  expect(course.contents).toHaveLength(CLAUDE_EXTENSIONS_CORE_COUNT + CLAUDE_EXTENSION_NOTES.length);
  expect(guide.version).toBeGreaterThan(2);
  expect(curriculumSchema.safeParse(guide.curriculum).success).toBe(true);
  expect(guide.curriculum.lessons.slice(CLAUDE_EXTENSIONS_CORE_COUNT).map(item => item.title)).toEqual(CLAUDE_EXTENSION_NOTES.map(item => item.title));
  for (const chapter of course.contents!) expect(getStudyNote(chapter.id)?.title).toBe(chapter.title);
  for (const note of CLAUDE_EXTENSION_NOTES) {
    expect(note.points).toHaveLength(3);
    expect(note.sections[0].code).toBeTruthy();
    expect(note.examples[0].points[0]).toBeTruthy();
    expect(note.interview[0].points.length).toBeGreaterThan(1);
    expect(note.vocabulary.length).toBeGreaterThan(0);
    const question = note.questions[0];
    expect(objectiveQuestionSchema.safeParse(question).success).toBe(true);
    expect(new Set(question.options).size).toBe(4);
    expect(question.options[question.correct]).toBe(question.shortAnswer);
  }
});

test("requested Claude names are searchable and uncertain identities are explicit", () => {
  const summary = NOTES_SUMMARIES.find(item => item.id === "claude-skills-plugins-mcp-course")!;
  for (const term of ["/doctor", "/code-review", "/batch", "/debug", "/loop", "/claude-api", "/verify", "/review", "/ultra", "slides", "xls", "figma-generate-design", "remotion", "pm-skills", "codex", "backend", "karpathy", "browser", "reviewer", "gws", "prd", "architecture", "piv", "creator", "superpowers", "gsd", "context", "claudemem", "setup", "omniroute", "find", "stricks", "reach", "planning", "grill", "caveman", "context7", "mindstudio", "artifacts-builder", "agentlint", "devtools", "lsp", "github", "playwright", "semgrep", "linear", "vercel", "graphify", "obsidian", "impeccable", "higsfield", "lmpi", "nan", "claude-mem", "local-review", "plannotator", "ralph", "shipyard", "dev-browser", "agent-peer-review", "postgres", "exa", "sentry", "slack", "sequential", "stdio", "sse", "mcpservers"]) expect(summary.searchText).toContain(term);
  expect(getStudyNote("claude-ultra-review")!.sections[0].code).toBe("/code-review ultra");
  expect(getStudyNote("claude-mcp-scopes")!.points.join(" ")).toContain("repository root, not inside .claude");
  for (const id of ["stricks", "nan-mcp"]) expect(getStudyNote(`claude-${id}`)!.sections[0].code).toContain("unconfirmed");
  expect(CLAUDE_EXTENSION_SEEDS.every(seed => seed.sources.every(url => url.startsWith("https://")))).toBe(true);
});

test("TanStack course groups all 19 libraries under the requested five categories", () => {
  const course = getStudyNote("tanstack-course")!;
  expect(course.contents).toHaveLength(84);
  expect([...new Set(course.contents!.map(item => item.category))]).toEqual(TANSTACK_CATEGORY_ORDER);
  const expected = {
    Frameworks: ["start-overview", "router-overview"],
    "Data & State": ["query-overview", "db-overview", "ai-overview", "store-overview"],
    "UI & UX": ["table-overview", "charts-overview", "form-overview", "hotkeys-overview", "markdown-overview", "highlight-overview", "ranger-overview"],
    Performance: ["virtual-overview", "pacer-overview"],
    Tooling: ["intent-overview", "devtools-overview", "config-overview", "cli-overview"],
  };
  for (const [category, ids] of Object.entries(expected)) for (const id of ids) {
    expect(course.contents!.find(item => item.id === `tanstack-start-${id}`)?.category).toBe(category);
    expect(getStudyNote(`tanstack-start-${id}`)?.category).toBe(category);
  }
  expect(STUDY_NOTES.filter(item => item.id === "tanstack-course")).toHaveLength(1);
  expect(new Set(STUDY_NOTES.map(item => item.id)).size).toBe(STUDY_NOTES.length);
});

test("large researched courses retain bounded, validated source metadata", () => {
  const curriculum = DEFAULT_GUIDES.find(item => item.id === "tanstack-start")!.curriculum;
  const source = { title: "Research", url: "https://tanstack.com/libraries", retrievedAt: "2026-09-13T00:00:00.000Z" };
  expect(curriculumSchema.safeParse({ ...curriculum, sources: Array(128).fill(source) }).success).toBe(true);
  expect(curriculumSchema.safeParse({ ...curriculum, sources: Array(129).fill(source) }).success).toBe(false);
  expect(curriculumSchema.safeParse({ ...curriculum, sources: [{ ...source, url: "not-a-url" }] }).success).toBe(false);
});
