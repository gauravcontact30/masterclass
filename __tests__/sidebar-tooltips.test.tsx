import { fireEvent, render, screen } from "@testing-library/react";
import { SidebarTooltips } from "@/components/sidebar-tooltips";
test("collapsed options show a portaled tooltip for hover and focus, and Escape dismisses it", () => {
  const { container } = render(<aside><SidebarTooltips collapsed/><button aria-label="Users & access">U</button><a href="/dashboard" title="Learning dashboard">D</a></aside>);
  const button = screen.getByRole("button", {name:"Users & access"});
  fireEvent.mouseOver(button);
  expect(screen.getByRole("tooltip")).toHaveTextContent("Users & access");
  expect(container.querySelector('[role="tooltip"]')).toBeNull();
  expect(button).toHaveAttribute("aria-describedby", screen.getByRole("tooltip").id);
  fireEvent.keyDown(window,{key:"Escape"});
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  fireEvent.focusIn(screen.getByRole("link"));
  expect(screen.getByRole("tooltip")).toHaveTextContent("Learning dashboard");
  fireEvent.focusOut(screen.getByRole("link"));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});
test("expanded navigation does not show collapsed tooltips",()=>{
  render(<aside><SidebarTooltips collapsed={false}/><button aria-label="Overview">Overview</button></aside>);
  fireEvent.mouseOver(screen.getByRole("button"));
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});
