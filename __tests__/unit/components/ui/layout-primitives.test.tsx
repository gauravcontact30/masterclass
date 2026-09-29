import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

describe("Separator", () => {
  it("defaults to horizontal and accepts vertical", () => {
    const { rerender } = render(<Separator className="s" />);
    expect(document.querySelector("[data-slot='separator']")).toHaveAttribute("aria-orientation", "horizontal");
    rerender(<Separator orientation="vertical" />);
    expect(document.querySelector("[data-slot='separator']")).toHaveAttribute("aria-orientation", "vertical");
  });
});

describe("Tabs", () => {
  it("switches panels when a tab is clicked", async () => {
    render(<Tabs defaultValue="a" className="t"><TabsList className="l"><TabsTab value="a">A</TabsTab><TabsTab value="b">B</TabsTab><TabsIndicator /></TabsList><TabsPanel value="a">Panel A</TabsPanel><TabsPanel value="b">Panel B</TabsPanel></Tabs>);
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Panel A")).toBeVisible();
    await userEvent.click(screen.getByRole("tab", { name: "B" }));
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Panel B")).toBeVisible();
  });
});

describe("RadioGroup", () => {
  it("selects one item at a time", async () => {
    const onValueChange = jest.fn();
    render(<RadioGroup aria-label="Tier" className="r" onValueChange={onValueChange}><RadioGroupItem value="m" aria-label="Monthly" /><RadioGroupItem value="y" aria-label="Yearly" className="i" /></RadioGroup>);
    await userEvent.click(screen.getByRole("radio", { name: "Yearly" }));
    expect(screen.getByRole("radio", { name: "Yearly" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Monthly" })).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith("y", expect.anything());
  });
});
