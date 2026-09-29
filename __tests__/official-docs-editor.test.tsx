import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodeFiles } from "@/components/code-files";
import { DOCS_PROJECTS } from "@/lib/official-docs-projects";
import { OfficialDocsLearning } from "@/components/official-docs-learning";
import { OFFICIAL_DOCS } from "@/lib/official-docs-data";
import { codeLineNotes } from "@/lib/code-line-notes";

test("every supplied project file is selectable and displayed without truncation", async () => {
  const user = userEvent.setup();
  const files = DOCS_PROJECTS.react.files;
  render(<CodeFiles files={files} />);
  const tabs = screen.getByRole("tablist");
  expect(within(tabs).getAllByRole("tab")).toHaveLength(files.length);
  for (const file of files) {
    await user.click(within(tabs).getByRole("tab", { name: file.path.split("/").at(-1), exact: true }));
    const source = screen.getByLabelText(`${file.path} source`);
    const lines = Array.from(source.querySelector("code")!.children);
    expect(lines).toHaveLength(file.code.split("\n").length);
    const displayed = lines.map(line => {
      const content = line.lastElementChild!.cloneNode(true) as HTMLElement;
      content.querySelectorAll("[data-line-comment]").forEach(note => note.remove());
      return content.textContent;
    }).join("");
    expect(displayed).toBe(file.code + "\n");
    expect(source.querySelectorAll("[data-line-comment]")).toHaveLength(codeLineNotes(file.code, file.path).filter(Boolean).length);
  }
});

test.each(["config.cjs", "config.mts", "schema.sql", "main.go", "main.rs", "settings.toml", "App.vue", "App.svelte", "theme.scss", "README.md", ".env.example", ".gitignore", "Dockerfile"])("%s receives a note for every line", path => {
  const notes = codeLineNotes("first line\nsecond line\n", path);
  expect(notes).toHaveLength(3);
  expect(notes.every(note => Boolean(note))).toBe(true);
});

test("HTML and CSS filename exceptions take precedence over a supplied language", () => {
  for (const path of ["index.HTML", "index.htm", "styles.module.css"]) {
    expect(codeLineNotes("first line\nsecond line", path, "javascript")).toEqual([null, null]);
  }
  expect(codeLineNotes("<template>\n</template>", "App.vue", "html").every(Boolean)).toBe(true);
});

test("project file editor remains available independently of the concise study guide", async () => {
  const user = userEvent.setup();
  const project = DOCS_PROJECTS.react;
  render(<CodeFiles annotate={false} label="React 19+ code example" files={project.files} />);
  const tabs = screen.getByRole("tablist", { name: "React 19+ code example files" });
  await user.click(within(tabs).getByRole("tab", { name: "App.jsx" }));
  await user.keyboard("{ArrowRight}");
  expect(within(tabs).getByRole("tab", { name: "Counter.jsx" })).toHaveFocus();
  expect(screen.getByLabelText("src/Counter.jsx source")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "package.json", exact: true }));
  await user.click(screen.getByRole("button", { name: "Copy package.json" }));
  expect(await navigator.clipboard.readText()).toBe(project.files.find(file => file.path === "package.json")!.code);
});

test("Official Docs comments explain logic, exclude HTML and CSS, and preserve original source", async () => {
  const user = userEvent.setup();
  const doc = OFFICIAL_DOCS.find(doc => doc.id === "react")!;
  render(<OfficialDocsLearning doc={doc} />);
  const editor = screen.getByRole("figure", { name: "React 19+ codebase" });
  const tabs = within(editor).getByRole("tablist");
  expect(within(tabs).queryByRole("tab", { name: ".gitignore" })).not.toBeInTheDocument();
  expect(within(tabs).queryByRole("tab", { name: "README.md" })).not.toBeInTheDocument();
  await user.click(within(tabs).getByRole("tab", { name: "App.jsx" }));
  await user.keyboard("{ArrowRight}");
  expect(within(tabs).getByRole("tab", { name: "Counter.jsx" })).toHaveFocus();
  const file = DOCS_PROJECTS.react.files.find(file => file.path === "src/Counter.jsx")!;
  const source = within(editor).getByLabelText("src/Counter.jsx source");
  expect(source.querySelectorAll("[data-line-comment]").length).toBeGreaterThan(0);
  for (let line = 3; line <= 8; line++) expect(source.querySelector(`[data-line-comment="${line}"]`)).toBeNull();
  expect(source.querySelector('[data-line-comment="1"]')).not.toBeNull();
  expect(source).not.toHaveTextContent("Close the current block, collection, or function call.");
  expect(source).not.toHaveTextContent("Blank line separates related steps for readability.");
  await user.click(within(editor).getByRole("button", { name: "Copy src/Counter.jsx" }));
  expect(await navigator.clipboard.readText()).toBe(file.code);
  await user.click(within(tabs).getByRole("tab", { name: "package.json" }));
  const config = DOCS_PROJECTS.react.files.find(file => file.path === "package.json")!;
  expect(editor.querySelectorAll("[data-line-comment]")).toHaveLength(config.code.split("\n").filter(line => line.trim() && !/^[}\])]+[,;]?$/.test(line.trim())).length);
  expect(editor).not.toHaveTextContent("Close the current block, collection, or function call.");
  expect(editor).not.toHaveTextContent("Blank line separates related steps for readability.");
  for (const filename of ["index.html", "style.css"]) {
    await user.click(within(tabs).getByRole("tab", { name: filename }));
    expect(editor.querySelectorAll("[data-line-comment]")).toHaveLength(0);
    const selectedFile = DOCS_PROJECTS.react.files.find(file => file.path.endsWith(filename))!;
    await user.click(within(editor).getByRole("button", { name: `Copy ${selectedFile.path}` }));
    expect(await navigator.clipboard.readText()).toBe(selectedFile.code);
  }
  await user.click(within(tabs).getByRole("tab", { name: "main.jsx" }));
  expect(editor.querySelectorAll("[data-line-comment]").length).toBeGreaterThan(0);
  await user.click(screen.getByRole("button", { name: "Copy command 1" }));
  expect(await navigator.clipboard.readText()).toBe(DOCS_PROJECTS.react.commands[0].command);
});

test("line comments cover every technology file without modifying the original source", () => {
  for (const project of Object.values(DOCS_PROJECTS)) {
    for (const file of project.files) {
      const original = file.code;
      const notes = codeLineNotes(file.code, file.path);
      expect(notes).toHaveLength(file.code.split("\n").length);
      expect(notes.every(note => note === null || note.trim().length > 0)).toBe(true);
      if (/\.(html?|css)$/i.test(file.path)) expect(notes.every(note => note === null)).toBe(true);
      else expect(notes.some(note => typeof note === "string" && note.length > 0)).toBe(true);
      expect(file.code).toBe(original);
    }
  }
  expect(codeLineNotes('"name": "example",', "package.json")[0]).toContain("Set name");
  expect(codeLineNotes("def hello():", "main.py")[0]).toContain("hello");
});

test("JSX return sections omit explanations while component logic retains them", () => {
  const code = [
    "import React from 'react';",
    "const count = 1;",
    "const styles = css`",
    "  color: red;",
    "`;",
    "function App() {",
    "  return (",
    "    <section",
    '      className="card"',
    "    >",
    "      <p>{count}</p>",
    "    </section>",
    "  );",
    "}",
  ].join("\n");
  const notes = codeLineNotes(code, "App.tsx");
  expect(notes[0]).toBeTruthy();
  expect(notes[1]).toBeTruthy();
  expect(notes.slice(6, 13)).toEqual(Array(7).fill(null));
  expect(notes[13]).toBeTruthy();
});
