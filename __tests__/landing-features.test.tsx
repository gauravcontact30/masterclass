import { render, screen } from "@testing-library/react";
import { LandingFeatures } from "@/components/landing-features";

describe("LandingFeatures", () => {
  it("gives every dashboard feature its own titled section with a way in", () => {
    const { container } = render(<LandingFeatures />);
    const sections = container.querySelectorAll("section");
    expect(sections).toHaveLength(3);
    for (const section of sections) {
      // The title is an h2, or an h3 marked data-h2 where the page outline needs it (components/landing-features.tsx).
      expect(section.getAttribute("aria-labelledby")).toBe(`${section.id}-title`);
      expect(section.querySelector(`#${section.id}-title`)?.matches("h2, h3[data-h2]")).toBe(true);
      expect(section.querySelector("a[href]")).not.toBeNull();
    }
    expect(screen.getByRole("heading", { name: /ask anything/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /interview questions built in/i })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/super ?admin|admin/i);
  });
});
