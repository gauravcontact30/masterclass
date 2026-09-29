import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";

describe("form fields", () => {
  it("Input and Label render with their slots and accept typing", async () => {
    render(<><Label htmlFor="name" className="l">Name</Label><Input id="name" type="email" className="i" /></>);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("data-slot", "input");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveClass("i");
    expect(screen.getByText("Name")).toHaveAttribute("data-slot", "label");
    await userEvent.type(input, "a@b.co");
    expect(input).toHaveValue("a@b.co");
  });

  it("Textarea accepts typing", async () => {
    render(<Textarea aria-label="Notes" className="t" />);
    const area = screen.getByRole("textbox", { name: "Notes" });
    expect(area).toHaveAttribute("data-slot", "textarea");
    await userEvent.type(area, "hello");
    expect(area).toHaveValue("hello");
  });

  it("NativeSelect renders options, groups and changes value", async () => {
    render(<NativeSelect aria-label="Plan" className="n" size="sm"><NativeSelectOption value="m">Monthly</NativeSelectOption><NativeSelectOptGroup label="Long"><NativeSelectOption value="y">Yearly</NativeSelectOption></NativeSelectOptGroup></NativeSelect>);
    const select = screen.getByRole("combobox", { name: "Plan" });
    expect(select).toHaveAttribute("data-slot", "native-select");
    expect(screen.getByRole("group", { name: "Long" })).toHaveAttribute("data-slot", "native-select-optgroup");
    await userEvent.selectOptions(select, "y");
    expect(select).toHaveValue("y");
  });
});
