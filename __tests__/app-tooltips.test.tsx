import { fireEvent, render, screen } from "@testing-library/react";
import { AppTooltips } from "@/components/app-tooltips";

test("nested feature icons use the control action label and Escape dismisses", () => {
  render(<><AppTooltips /><button aria-label="Save lesson"><svg data-testid="icon" className="lucide lucide-save" aria-hidden="true" /></button></>);
  fireEvent.mouseOver(screen.getByTestId("icon"));
  expect(screen.getByRole("tooltip")).toHaveTextContent("Save lesson");
  expect(screen.getByRole("button")).toHaveAttribute("aria-describedby", screen.getByRole("tooltip").id);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(screen.getByRole("button")).not.toHaveAttribute("aria-describedby");
});

test("authored descriptions and native titles are preserved", () => {
  render(<><AppTooltips /><p id="help">Saved to your library</p><button title="Bookmark this lesson" aria-describedby="help">Save</button></>);
  const button = screen.getByRole("button");
  fireEvent.focusIn(button);
  expect(screen.getByRole("tooltip")).toHaveTextContent("Bookmark this lesson");
  expect(button.getAttribute("aria-describedby")).toContain("help");
  fireEvent.focusOut(button);
  expect(button).toHaveAttribute("aria-describedby", "help");
  expect(button).toHaveAttribute("title", "Bookmark this lesson");
});

test("new options and translated labels work without remounting the provider", () => {
  const { rerender } = render(<AppTooltips />);
  rerender(<><AppTooltips /><button role="option" aria-selected={false}>LangGraph</button></>);
  fireEvent.mouseOver(screen.getByRole("option"));
  expect(screen.getByRole("tooltip")).toHaveTextContent("LangGraph");
  fireEvent.mouseOut(screen.getByRole("option"));
  rerender(<><AppTooltips /><button role="option" aria-selected={false} aria-label="वर्कफ़्लो सीखें">LangGraph</button></>);
  fireEvent.mouseOver(screen.getByRole("option"));
  expect(screen.getByRole("tooltip")).toHaveTextContent("वर्कफ़्लो सीखें");
});

test("input tooltips describe the field without revealing its value", () => {
  render(<><AppTooltips /><label htmlFor="secret">Provider API key</label><input id="secret" type="password" defaultValue="private-secret" /></>);
  fireEvent.focusIn(screen.getByLabelText("Provider API key"));
  expect(screen.getByRole("tooltip")).toHaveTextContent("Provider API key");
  expect(screen.getByRole("tooltip")).not.toHaveTextContent("private-secret");
});

test("existing collapsed sidebar tooltips are not duplicated", () => {
  render(<><AppTooltips /><div className="sidebar-collapsed"><aside className="sidebar"><button>Dashboard</button></aside></div></>);
  fireEvent.mouseOver(screen.getByRole("button"));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});
