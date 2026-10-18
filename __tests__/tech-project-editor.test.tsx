import { fireEvent, render, screen } from "@testing-library/react";
import { TechProjectEditor } from "@/components/tech-project-editor";
import { DashboardLessons } from "@/components/dashboard-lessons";
import { TECH_PROJECTS } from "@/lib/tech-doc-projects";
import { TECH_DOCS } from "@/lib/tech-docs";

test("every technology has a complete project with unique file paths and run instructions", () => {
  for (const tech of TECH_DOCS) {
    const project = TECH_PROJECTS[tech.id];
    expect(project).toBeDefined();
    expect(project.files.length).toBeGreaterThanOrEqual(3);
    expect(new Set(project.files.map(file => file.name)).size).toBe(project.files.length);
    expect(project.commands.length).toBeGreaterThan(15);
    expect(project.expected.length).toBeGreaterThan(30);
    for (const file of project.files) expect(file.code.trim().length).toBeGreaterThan(5);
  }
});
test("keyboard file navigation, editing and restoring the original project", () => {
  render(<TechProjectEditor project={TECH_PROJECTS.node} />);
  const tabs = screen.getAllByRole("tab");
  fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
  expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  expect(tabs[1]).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Edit main.mjs" }), { target: { value: "// local edit" } });
  fireEvent.click(tabs[0]);
  fireEvent.click(tabs[1]);
  expect(screen.getByRole("textbox")).toHaveValue("// local edit");
  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByRole("textbox")).toHaveValue(TECH_PROJECTS.node.files[1].code);
});
test("clipboard failure is visible and does not claim success", async () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) } });
  render(<TechProjectEditor project={TECH_PROJECTS.node} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy" }));
  expect(await screen.findByText(/Copy unavailable/)).toBeInTheDocument();
});
test("lesson search finds a technology and provides a clear empty state", () => {
  render(<DashboardLessons section="interview" />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "PostgreSQL" } });
  expect(screen.getByText("Explain a lost update with two sessions")).toBeInTheDocument();
  expect(screen.queryByText("Diagnose a stale search response")).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "no-such-topic" } });
  expect(screen.getByRole("status")).toHaveTextContent("No matching lessons");
});
