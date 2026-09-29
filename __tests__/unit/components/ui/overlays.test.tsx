import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";

jest.mock("next-themes", () => ({ useTheme: jest.fn(() => ({})) }));

describe("Popover", () => {
  it("opens its content from the trigger", async () => {
    render(<Popover><PopoverTrigger>Open</PopoverTrigger><PopoverContent className="p"><PopoverHeader><PopoverTitle>Heading</PopoverTitle><PopoverDescription>More</PopoverDescription></PopoverHeader></PopoverContent></Popover>);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("Heading")).toHaveAttribute("data-slot", "popover-title");
    expect(screen.getByText("More")).toHaveAttribute("data-slot", "popover-description");
    expect(document.querySelector("[data-slot='popover-content']")).toHaveClass("p");
  });
});

describe("Dialog", () => {
  it("opens, shows the built-in close buttons and closes", async () => {
    render(<Dialog><DialogTrigger>Show</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Title</DialogTitle><DialogDescription>Details</DialogDescription></DialogHeader><DialogFooter showCloseButton>footer</DialogFooter></DialogContent></Dialog>);
    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    const dialog = await screen.findByRole("dialog", { name: "Title" });
    expect(dialog).toHaveAccessibleDescription("Details");
    expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(2);
    await userEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("can hide the close button and close from a custom control", async () => {
    render(<Dialog defaultOpen><DialogContent showCloseButton={false}><DialogTitle>Plain</DialogTitle><DialogClose>Done</DialogClose></DialogContent></Dialog>);
    expect(await screen.findByRole("dialog", { name: "Plain" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Toaster", () => {
  it("renders the toast region with the theme fallback", () => {
    render(<Toaster position="bottom-right" />);
    expect(document.querySelector("section[aria-label]")).toBeInTheDocument();
  });
});
