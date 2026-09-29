import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";

describe("DropdownMenu", () => {
  it("renders every item kind and reports selections", async () => {
    const onSelect = jest.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent className="c">
          <DropdownMenuGroup>
            <DropdownMenuLabel inset>Account</DropdownMenuLabel>
            <DropdownMenuItem inset onClick={onSelect}>Profile<DropdownMenuShortcut>⌘P</DropdownMenuShortcut></DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked inset>Hindi</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="m"><DropdownMenuRadioItem value="m" inset>Monthly</DropdownMenuRadioItem></DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>More</DropdownMenuSubTrigger>
            <DropdownMenuPortal><DropdownMenuSubContent><DropdownMenuItem>Nested</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Account")).toHaveAttribute("data-inset", "true");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-variant", "destructive");
    expect(screen.getByRole("menuitemcheckbox", { name: "Hindi" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "Monthly" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("⌘P")).toHaveAttribute("data-slot", "dropdown-menu-shortcut");
    await userEvent.click(screen.getByRole("menuitem", { name: /Profile/ }));
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("Command", () => {
  it("filters items and shows the empty state", async () => {
    render(<Command><CommandInput placeholder="Find" /><CommandList><CommandEmpty>None</CommandEmpty><CommandGroup heading="Tools"><CommandItem>Search<CommandShortcut>S</CommandShortcut></CommandItem></CommandGroup><CommandSeparator /></CommandList></Command>);
    expect(screen.getByRole("option", { name: /Search/ })).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText("Find"), "qqq");
    expect(await screen.findByText("None")).toBeInTheDocument();
  });

  it("renders inside a dialog with a title and optional close button", async () => {
    render(<CommandDialog open title="Palette" description="Jump anywhere" showCloseButton><CommandInput placeholder="Go to" /><CommandList><CommandItem>Home</CommandItem></CommandList></CommandDialog>);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Palette")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
