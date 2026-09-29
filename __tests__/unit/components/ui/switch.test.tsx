import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "@/components/ui/switch";

describe("Switch", () => {
  it("renders the default size and flips when clicked", async () => {
    render(<Switch aria-label="Hindi" />);
    const toggle = screen.getByRole("switch", { name: "Hindi" });
    expect(toggle).toHaveAttribute("data-size", "default");
    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
  });

  it("accepts the small size and a class name", () => {
    render(<Switch aria-label="Small" size="sm" className="s" defaultChecked />);
    const toggle = screen.getByRole("switch", { name: "Small" });
    expect(toggle).toHaveAttribute("data-size", "sm");
    expect(toggle).toHaveClass("s");
    expect(toggle).toBeChecked();
  });
});
