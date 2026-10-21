import { render, screen } from "@testing-library/react";
import { LandingFeatures } from "@/components/landing-features";

describe("LandingFeatures", () => {
  it("gives every dashboard feature its own titled section with a way in", () => {
    const { container } = render(<LandingFeatures />);
    const sections = container.querySelectorAll("section");
    expect(sections).toHaveLength(3);
    for (const section of sections) {
      expect(section.querySelector("h2")?.id).toBe(`${section.id}-title`);
      expect(section.querySelector("a[href]")).not.toBeNull();
    }
    expect(screen.getByRole("heading", { name: /ask anything/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /interview questions built in/i })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/super ?admin|admin/i);
  });
});
