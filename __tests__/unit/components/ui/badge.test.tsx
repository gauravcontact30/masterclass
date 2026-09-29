import { render, screen } from "@testing-library/react";
import { Badge, badgeVariants } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders its children with the default variant", () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText("New");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge.className).toContain(badgeVariants({ variant: "default" }).split(" ")[0]);
  });

  it.each(["secondary", "destructive", "outline", "ghost"] as const)("applies the %s variant and a custom class", variant => {
    render(<Badge variant={variant} className="extra">Tag</Badge>);
    expect(screen.getByText("Tag")).toHaveClass("extra");
    expect(screen.getByText("Tag")).toHaveAttribute("data-variant", variant);
  });
});
