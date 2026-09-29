import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group";

describe("InputGroup", () => {
  it("focuses the input when the addon is clicked, but not when its button is", async () => {
    const onClick = jest.fn();
    render(<InputGroup className="g"><InputGroupInput aria-label="Query" /><InputGroupAddon align="inline-end"><InputGroupText>@</InputGroupText><InputGroupButton onClick={onClick}>Go</InputGroupButton></InputGroupAddon></InputGroup>);
    const input = screen.getByRole("textbox", { name: "Query" });
    fireEvent.click(screen.getByText("@"));
    expect(input).toHaveFocus();
    input.blur();
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalled();
    expect(input).not.toHaveFocus();
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("data-size", "xs");
    expect(screen.getByText("@").closest("[data-slot=input-group-addon]")).toHaveAttribute("data-align", "inline-end");
  });

  it("supports a textarea control, the default addon alignment and other button sizes", () => {
    render(<InputGroup><InputGroupAddon>#</InputGroupAddon><InputGroupTextarea aria-label="Body" /><InputGroupButton size="icon-sm" variant="outline" aria-label="Send" /></InputGroup>);
    expect(screen.getByRole("textbox", { name: "Body" })).toHaveAttribute("data-slot", "input-group-control");
    expect(screen.getByText("#")).toHaveAttribute("data-align", "inline-start");
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("data-size", "icon-sm");
  });
});
