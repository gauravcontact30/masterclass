import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("renders a button with the default variant and size and handles clicks", async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button.className).toContain("bg-primary");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([["outline", "sm"], ["secondary", "lg"], ["ghost", "xs"], ["destructive", "icon"], ["link", "icon-sm"]] as const)("merges the %s variant, %s size and a custom class", (variant, size) => {
    render(<Button variant={variant} size={size} className="custom">Go</Button>);
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toHaveClass("custom");
    expect(button.className).toContain(buttonVariants({ variant, size }).split(" ").at(-1));
  });

  it("does not fire clicks when disabled", async () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Off</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Off" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
