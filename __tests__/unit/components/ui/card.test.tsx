import { render, screen } from "@testing-library/react";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

describe("Card", () => {
  it("renders every part with its slot and forwards class names", () => {
    render(<Card size="sm" className="c"><CardHeader className="h"><CardTitle>Title</CardTitle><CardDescription>Desc</CardDescription><CardAction>Act</CardAction></CardHeader><CardContent>Body</CardContent><CardFooter>Foot</CardFooter></Card>);
    const slots: [string, string][] = [["Title", "card-title"], ["Desc", "card-description"], ["Act", "card-action"], ["Body", "card-content"], ["Foot", "card-footer"]];
    for (const [text, slot] of slots) expect(screen.getByText(text)).toHaveAttribute("data-slot", slot);
    const card = screen.getByText("Body").closest("[data-slot='card']");
    expect(card).toHaveAttribute("data-size", "sm");
    expect(card).toHaveClass("c");
    expect(screen.getByText("Title").parentElement).toHaveClass("h");
  });

  it("defaults to the regular size", () => {
    render(<Card>Plain</Card>);
    expect(screen.getByText("Plain")).toHaveAttribute("data-size", "default");
  });
});
