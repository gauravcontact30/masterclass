import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { OfficialDocsReader } from "@/components/official-docs-reader";
import { OFFICIAL_DOCS } from "@/lib/official-docs-data";
import { getDocsCodeExamples } from "@/lib/official-docs-examples";
import { COMPLEX_DOCS_PROJECTS } from "@/lib/official-docs-complex";
import { OfficialDocs } from "@/components/official-docs";

test("every topic has populated examples and requested topics include complete Complex projects", () => {
  for (const doc of OFFICIAL_DOCS) {
    const examples = getDocsCodeExamples(doc);
    expect(examples.map(example => example.level)).toEqual(COMPLEX_DOCS_PROJECTS[doc.id] ? ["Simple", "Medium", "Hard", "Complex"] : ["Simple", "Medium", "Hard"]);
    for (const example of examples) {
      expect(example.title.trim()).not.toBe("");
      expect(example.summary.trim()).not.toBe("");
      expect(example.files.length).toBeGreaterThan(0);
      expect(example.files.every(file => file.path && file.code.trim())).toBe(true);
      expect(example.files.some(file => /(^|\/)(\.gitignore|readme\.md)$/i.test(file.path))).toBe(false);
    }
    expect(examples[0].files[0].code.trim()).not.toBe(examples[1].files[0].code.trim());
    expect(examples[2].files.length).toBeGreaterThan(1);
  }
});

test("Complex codebase switches tabs, copies source, and includes separate run instructions", async () => {
  const user = userEvent.setup();
  render(<OfficialDocsReader selectedId="nodejs" onSelect={() => {}} />);
  const complex = screen.getByRole("region", { name: /^Complex:/ });
  const editor = within(complex).getByRole("figure", { name: "Node.js complex codebase" });
  const tabs = within(editor).getByRole("tablist");
  await user.click(within(tabs).getByRole("tab", { name: "store.js" }));
  await user.click(within(editor).getByRole("button", { name: "Copy src/store.js" }));
  expect(await navigator.clipboard.readText()).toBe(COMPLEX_DOCS_PROJECTS.nodejs.files.find(file => file.path === "src/store.js")!.code);
  expect(within(editor).queryByRole("tab", { name: "README.md" })).not.toBeInTheDocument();
  expect(within(editor).queryByRole("tab", { name: ".gitignore" })).not.toBeInTheDocument();
  expect(within(complex).getByRole("heading", { name: "Run the complete project" })).toBeVisible();
  await user.click(within(complex).getByRole("button", { name: "Copy Complex command 1" }));
  expect(await navigator.clipboard.readText()).toBe("npm test");
});

test("the Complex collection exposes the ten requested topics across pages and accepts spaced aliases", async () => {
  const user = userEvent.setup();
  render(<OfficialDocs />);
  const catalog = screen.getByRole("region", { name: "Search and filter documentation" });
  await user.click(within(catalog).getByRole("button", { name: /Complex projects/ }));
  expect(within(catalog).getByRole("status")).toHaveTextContent("of 10 technologies");
  expect(screen.getByRole("heading", { name: "Node.js", exact: true })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Next page", exact: true }));
  expect(screen.getByRole("heading", { name: "Nest.js", exact: true })).toBeVisible();
  const search = within(catalog).getByRole("textbox", { name: "Search technologies" });
  for (const [query, title] of [["Type Script", "TypeScript (5.x+)"], ["Java Script Puzzles", "JavaScript Puzzles"], ["AWS All Services", "AWS Cloud Services"]]) {
    await user.clear(search);
    await user.type(search, query);
    expect(screen.getByRole("heading", { name: title, exact: true })).toBeVisible();
    expect(within(catalog).getByRole("status")).toHaveTextContent("of 1 technologies");
  }
});

test("topic selection replaces all difficulty cards and copies the selected starter", async () => {
  function Reader() {
    const [selectedId, onSelect] = useState("react");
    return <OfficialDocsReader selectedId={selectedId} onSelect={onSelect} />;
  }
  const user = userEvent.setup();
  render(<Reader />);
  expect(screen.getByRole("figure", { name: "React 19+ simple example" })).toBeVisible();
  await user.selectOptions(screen.getByRole("combobox", { name: "Technology" }), "python");
  const section = screen.getByRole("region", { name: "Code example" });
  for (const level of ["Simple", "Medium", "Hard"]) {
    expect(within(section).getByRole("region", { name: new RegExp(`^${level}:`) })).toHaveAttribute("data-level", level);
  }
  expect(screen.queryByRole("figure", { name: "React 19+ simple example" })).not.toBeInTheDocument();
  expect(within(section).getAllByRole("figure")).toHaveLength(3);
  const simple = within(section).getByRole("region", { name: /^Simple:/ });
  await user.click(within(simple).getByRole("button", { name: "Copy lessons.py" }));
  expect(await navigator.clipboard.readText()).toContain("short_lessons = [value for value in minutes if value <= 20]");
});
