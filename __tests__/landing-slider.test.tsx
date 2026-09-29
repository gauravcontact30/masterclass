import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { LandingSlider } from "@/components/landing-slider";
import { LandingPaths } from "@/components/landing-paths";
import { LandingNavbar } from "@/components/landing-navbar";

const slides = () => screen.getAllByRole("article", { hidden: true });
const active = () => slides().find(slide => slide.getAttribute("aria-hidden") === "false")!;
function mockMotion(reduce: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({ matches: reduce && query.includes("reduce"), addEventListener: jest.fn(), removeEventListener: jest.fn() }));
}

beforeEach(() => { jest.useFakeTimers(); mockMotion(false); });
afterEach(() => jest.useRealTimers());

describe("hero slider", () => {
  test("four full-bleed scenes, each with its own headline, image and actions", () => {
    render(<LandingSlider technologies={61} />);
    expect(slides()).toHaveLength(4);
    expect(within(active()).getByRole("heading", { level: 2 })).toHaveTextContent("Study smarter, from Class 6 to Class 12.");
    expect(within(active()).getByRole("img")).toHaveAttribute("alt", expect.stringContaining("school student"));
    expect(within(active()).getByRole("link", { name: /Start learning/ })).toHaveAttribute("href", "/sign-up");
    expect(within(active()).getByRole("link", { name: "Explore school paths" })).toHaveAttribute("href", "/courses#cbse");
    // Hidden slides are inert, so their links can't be tabbed to.
    expect(slides().filter(slide => slide.hasAttribute("inert"))).toHaveLength(3);
  });

  test("the technology slide quotes the real technology count", () => {
    render(<LandingSlider technologies={61} />);
    fireEvent.click(screen.getByRole("button", { name: /On The Go/ }));
    expect(active()).toHaveTextContent("Guides for 61 technologies");
  });

  test("autoplays; arrows step both ways and wrap; pause stops it", () => {
    render(<LandingSlider />);
    act(() => { jest.advanceTimersByTime(7000); });
    expect(active()).toHaveTextContent("Prepare for your exam");
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(active()).toHaveTextContent("Study smarter");
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(active()).toHaveTextContent("Walk into your interview");
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(active()).toHaveTextContent("Study smarter");
    fireEvent.click(screen.getByRole("button", { name: "Pause slides" }));
    act(() => { jest.advanceTimersByTime(30000); });
    expect(active()).toHaveTextContent("Study smarter");
  });

  test("keyboard and swipe navigate, and reduced motion never autoplays", () => {
    mockMotion(true);
    render(<LandingSlider />);
    act(() => { jest.advanceTimersByTime(30000); });
    expect(active()).toHaveTextContent("Study smarter");
    const region = screen.getByRole("region", { name: "Learning with MasterClass" });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(active()).toHaveTextContent("Prepare for your exam");
    fireEvent.touchStart(region, { touches: [{ clientX: 300 }] });
    fireEvent.touchEnd(region, { changedTouches: [{ clientX: 120 }] });
    expect(active()).toHaveTextContent("Build real projects");
  });
});

describe("navbar", () => {
  const links: [string, string][] = [["#library", "Library"], ["#paths", "Paths"]];
  test("starts transparent and turns solid once the page scrolls", () => {
    const { container } = render(<LandingNavbar links={links} />);
    const bar = container.querySelector("header")!;
    expect(bar).not.toHaveAttribute("data-solid");
    act(() => { Object.defineProperty(window, "scrollY", { value: 200, configurable: true }); window.dispatchEvent(new Event("scroll")); });
    expect(bar).toHaveAttribute("data-solid");
    act(() => { Object.defineProperty(window, "scrollY", { value: 0, configurable: true }); window.dispatchEvent(new Event("scroll")); });
  });

  test("the menu opens, turns the bar solid and closes with Escape", () => {
    const { container } = render(<LandingNavbar links={links} />);
    const toggle = screen.getByRole("button", { name: "Toggle navigation" });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(container.querySelector("header")).toHaveAttribute("data-solid");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("links, language switch and calls to action", () => {
    render(<LandingNavbar links={links} />);
    const nav = within(screen.getByRole("navigation", { name: "Main navigation" }));
    expect(nav.getByRole("link", { name: "Library" })).toHaveAttribute("href", "#library");
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("link", { name: /Start learning/ })[0]).toHaveAttribute("href", "/sign-up");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  });
});

test("the three learning paths link to the matching part of the courses page", () => {
  render(<LandingPaths />);
  const links: (string | null)[] = [];
  for (const tab of screen.getAllByRole("tab")) {
    fireEvent.click(tab);
    links.push(screen.getByRole("tabpanel").querySelector("a")!.getAttribute("href"));
  }
  expect(links).toEqual(["/courses#cbse", "/courses#ssc", "/courses#technology"]);
  expect([...document.querySelectorAll("img")].every(image => image.getAttribute("alt"))).toBe(true);
});
