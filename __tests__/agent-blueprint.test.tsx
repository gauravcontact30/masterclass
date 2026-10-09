import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentBlueprint } from "@/components/agent-blueprint";
import { BLUEPRINTS, fileCode } from "@/lib/agent-blueprint";
import { API_PACKAGES } from "@/lib/api-docs";

test("each blueprint is a complete codebase with a note on every code line", () => {
  for (const blueprint of Object.values(BLUEPRINTS)) {
    expect(blueprint.steps).toHaveLength(5);
    for (const step of blueprint.steps) expect(blueprint.files.some(file => file.path === step.file && file.step === step.num)).toBe(true);
    expect(blueprint.files.map(file => file.path)).toEqual(expect.arrayContaining(["requirements.txt", ".env.example", "run.py"]));
    for (const file of blueprint.files) {
      for (const [code, note] of file.lines) {
        if (code.trim()) expect(note && note.length <= 70).toBeTruthy();
      }
      expect(fileCode(file)).not.toMatch(/TODO|\t/);
    }
  }
});

test("step chips link only to identifiers that exist in the catalog", () => {
  render(<AgentBlueprint />);
  for (const link of screen.getAllByRole("link").filter(a => a.getAttribute("href")?.startsWith("/dashboard/api-docs/"))) {
    const [, , , pkg, name] = link.getAttribute("href")!.split("/");
    expect(API_PACKAGES.find(item => item.id === pkg)?.entries.some(entry => entry.name === name)).toBe(true);
  }
});

test("steps, explorer and tabs stay in sync, and notes can be hidden", async () => {
  const user = userEvent.setup();
  render(<AgentBlueprint />);
  const tabs = screen.getByRole("tablist", { name: "Open files" });
  expect(within(tabs).getByRole("tab", { name: "config.py" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("Records this helper as its own span in the trace.")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Cyclic StateGraph/ }));
  expect(within(tabs).getByRole("tab", { name: "graph.py" })).toHaveAttribute("aria-selected", "true");
  expect(within(screen.getByRole("navigation", { name: "Project files" })).getByRole("button", { name: /graph\.py/ })).toHaveAttribute("aria-current", "true");

  within(tabs).getByRole("tab", { name: "graph.py" }).focus();
  await user.keyboard("{ArrowRight}");
  expect(within(tabs).getByRole("tab", { name: "sandbox.py" })).toHaveFocus();
  expect(screen.getByRole("button", { name: /Sandboxed Filesystem/ })).toHaveAttribute("aria-expanded", "true");

  await user.click(screen.getByRole("button", { name: "Notes" }));
  expect(screen.queryByText("Pause for a human before any file change.")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Multi-agent/ }));
  expect(within(tabs).getByRole("tab", { name: "state.py" })).toHaveAttribute("aria-selected", "true");
});
