import { render, screen, fireEvent } from "@testing-library/react";
import { BackToTop } from "@/components/back-to-top";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("BackToTop", () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    window.scrollTo = jest.fn();
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    jest.clearAllMocks();
  });

  test("renders move to top button on landing page", () => {
    jest.mocked(usePathname).mockReturnValue("/");
    const { container } = render(<BackToTop />);
    expect(container.querySelector('button[aria-label="Move to top"]')).toBeInTheDocument();
  });

  test("renders move to top button on learning dashboard", () => {
    jest.mocked(usePathname).mockReturnValue("/dashboard/techy");
    const { container } = render(<BackToTop />);
    expect(container.querySelector('button[aria-label="Move to top"]')).toBeInTheDocument();
  });

  test("renders move to top button on super admin dashboard", () => {
    jest.mocked(usePathname).mockReturnValue("/dashboard/super-admin");
    const { container } = render(<BackToTop />);
    expect(container.querySelector('button[aria-label="Move to top"]')).toBeInTheDocument();
  });

  test("renders move to top button on tech-buzz page and subsequent article pages", () => {
    jest.mocked(usePathname).mockReturnValue("/tech-buzz");
    const { container, rerender } = render(<BackToTop />);
    expect(container.querySelector('button[aria-label="Move to top"]')).toBeInTheDocument();

    jest.mocked(usePathname).mockReturnValue("/tech-buzz/ebpf-in-production-2026");
    rerender(<BackToTop />);
    expect(container.querySelector('button[aria-label="Move to top"]')).toBeInTheDocument();
  });

  test("smooth scrolls to top on click", () => {
    jest.mocked(usePathname).mockReturnValue("/dashboard/super-admin");
    const { container } = render(<BackToTop />);
    const button = container.querySelector('button[aria-label="Move to top"]')!;
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  test("respects prefers-reduced-motion for auto scrolling", () => {
    jest.mocked(usePathname).mockReturnValue("/dashboard/super-admin");
    jest.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });
    const { container } = render(<BackToTop />);
    const button = container.querySelector('button[aria-label="Move to top"]')!;
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });

  test("does not render on non-dashboard, non-landing pages", () => {
    jest.mocked(usePathname).mockReturnValue("/sign-in");
    const { container } = render(<BackToTop />);
    expect(container.firstChild).toBeNull();
  });
});
