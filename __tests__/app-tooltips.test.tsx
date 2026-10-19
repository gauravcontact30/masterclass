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
  render(<><AppTooltips /><p id="help">Saved to your library</p><button title="Bookmark this lesson" aria-describedby="help"><svg className="lucide lucide-save" /></button></>);
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
  rerender(<><AppTooltips /><button role="option" aria-selected={false} aria-label="LangGraph"><svg className="lucide lucide-book" /></button></>);
  fireEvent.mouseOver(screen.getByRole("option"));
  expect(screen.getByRole("tooltip")).toHaveTextContent("LangGraph");
  fireEvent.mouseOut(screen.getByRole("option"));
  rerender(<><AppTooltips /><button role="option" aria-selected={false} aria-label="वर्कफ़्लो सीखें"><svg className="lucide lucide-book" /></button></>);
  fireEvent.mouseOver(screen.getByRole("option"));
  expect(screen.getByRole("tooltip")).toHaveTextContent("वर्कफ़्लो सीखें");
});

test("fields do not receive icon tooltips", () => {
  render(<><AppTooltips /><label htmlFor="secret">Provider API key</label><input id="secret" type="password" defaultValue="private-secret" /></>);
  fireEvent.focusIn(screen.getByLabelText("Provider API key"));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

test("existing collapsed sidebar tooltips are not duplicated", () => {
  render(<><AppTooltips /><div className="sidebar-collapsed"><aside className="sidebar"><button>Dashboard</button></aside></div></>);
  fireEvent.mouseOver(screen.getByRole("button"));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});


test("text buttons and decorative icons do not show tooltips", () => {
  render(<><AppTooltips /><button title="Save document">Save</button><svg data-testid="decoration" className="lucide lucide-star" aria-label="Decoration" /></>);
  const button = screen.getByRole("button");
  fireEvent.mouseOver(button);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(button).not.toHaveAttribute("title");
  fireEvent.mouseOut(button);
  expect(button).toHaveAttribute("title", "Save document");
  fireEvent.mouseOver(screen.getByTestId("decoration"));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

test("a labelled button shows its tooltip only over its functional icon", () => {
  render(<><AppTooltips /><button><svg data-testid="icon" className="lucide lucide-save" />Save document</button></>);
  fireEvent.mouseOver(screen.getByRole("button"));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  fireEvent.mouseOver(screen.getByTestId("icon"));
  expect(screen.getByRole("tooltip")).toHaveTextContent("Save document");
});
