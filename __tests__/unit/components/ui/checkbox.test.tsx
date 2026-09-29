import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "@/components/ui/checkbox";

describe("Checkbox", () => {
  it("toggles and reports the change", async () => {
    const onCheckedChange = jest.fn();
    render(<Checkbox aria-label="Agree" className="x" onCheckedChange={onCheckedChange} />);
    const box = screen.getByRole("checkbox", { name: "Agree" });
    expect(box).toHaveAttribute("data-slot", "checkbox");
    expect(box).toHaveClass("x");
    expect(box).not.toBeChecked();
    await userEvent.click(box);
    expect(box).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });
});
