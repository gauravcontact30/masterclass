import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { LandingSlider } from "@/components/landing-slider";
import { LandingNavbar } from "@/components/landing-navbar";

const slides = () => screen.getAllByRole("article", { hidden: true });
const active = () => slides().find(slide => slide.getAttribute("aria-hidden") === "false")!;
function mockMotion(reduce: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({ matches: reduce && query.includes("reduce"), addEventListener: jest.fn(), removeEventListener: jest.fn() }));
}

beforeEach(() => { jest.useFakeTimers(); mockMotion(false); });
afterEach(() => jest.useRealTimers());

// Eight full-bleed scenes (components/landing-slider.tsx): the first is an artwork poster, the others carry a headline
// and actions. Each holds 15 s; the next image is requested 4 s before it is due.
const at = () => active().getAttribute("aria-label");
describe("hero slider", () => {
  test("requests only the first image initially and warms the next shortly before it is due", () => {
    const { container } = render(<LandingSlider />);
    expect(container.querySelectorAll("img")).toHaveLength(1);
    act(() => { jest.advanceTimersByTime(11000); });
    expect(container.querySelectorAll("img")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Technology courses/ }));
    expect(within(active()).getByRole("img")).toHaveAttribute("alt", expect.stringContaining("young developer"));
  });

  test("does not autoplay while the browser tab is hidden", () => {
    render(<LandingSlider />);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    fireEvent(document, new Event("visibilitychange"));
    act(() => { jest.advanceTimersByTime(30000); });
    expect(at()).toBe("1 / 8");
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    fireEvent(document, new Event("visibilitychange"));
    act(() => { jest.advanceTimersByTime(15000); });
    expect(at()).toBe("2 / 8");
  });

  test("eight full-bleed scenes; hidden ones are inert, and a scene carries its own actions", () => {
    render(<LandingSlider technologies={61} />);
    expect(slides()).toHaveLength(8);
    expect(at()).toBe("1 / 8");
    // Hidden slides are inert, so their links can't be tabbed to.
    expect(slides().filter(slide => slide.hasAttribute("inert"))).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: /Technology courses/ }));
    expect(within(active()).getByRole("link", { name: /Start learning/ })).toHaveAttribute("href", "/sign-up");
    expect(within(active()).getByRole("link", { name: "Browse technology" })).toHaveAttribute("href", "/courses#technology");
  });

  test("the technology slide quotes the real technology count", () => {
    render(<LandingSlider technologies={61} />);
    fireEvent.click(screen.getByRole("button", { name: /Technology courses/ }));
    expect(active()).toHaveTextContent("Step-by-step guides for 61 technologies");
  });

  test("autoplays; arrows step both ways and wrap; pause stops it", () => {
    render(<LandingSlider />);
    act(() => { jest.advanceTimersByTime(14900); });
    expect(at()).toBe("1 / 8");
    act(() => { jest.advanceTimersByTime(100); });
    expect(at()).toBe("2 / 8");
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(at()).toBe("1 / 8");
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(at()).toBe("8 / 8");
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(at()).toBe("1 / 8");
    fireEvent.click(screen.getByRole("button", { name: "Pause slides" }));
    act(() => { jest.advanceTimersByTime(45000); });
    expect(at()).toBe("1 / 8");
  });

  test("keyboard and swipe navigate, and reduced motion never autoplays", () => {
    mockMotion(true);
    render(<LandingSlider />);
    act(() => { jest.advanceTimersByTime(45000); });
    expect(at()).toBe("1 / 8");
    const region = screen.getByRole("region", { name: "Learning with MasterClass" });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(at()).toBe("2 / 8");
    fireEvent.touchStart(region, { touches: [{ clientX: 300 }] });
    fireEvent.touchEnd(region, { changedTouches: [{ clientX: 120 }] });
    expect(at()).toBe("3 / 8");
  });
});

describe("navbar", () => {
  const links: [string, string][] = [["#library", "Library"], ["#workflows", "Workflows"]];
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

  test("the header carries the language switch; the account dropdown holds Sign in and Sign up", () => {
    render(<LandingNavbar links={links} />);
    // The A / अ switch sits in the header itself (components/language-switch.tsx).
    expect(screen.getByRole("switch", { name: "Hindi language" })).toHaveAttribute("aria-checked", "false");
    const trigger = screen.getByRole("button", { name: "Account" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /Sign in/ })).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("tablist", { name: "Account menu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in/ })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: /Create free account/ })).toHaveAttribute("href", "/sign-up");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("the header has section links and no Start learning button", () => {
    render(<LandingNavbar links={links} />);
    const nav = within(screen.getByRole("navigation", { name: "Main navigation" }));
    expect(nav.getByRole("link", { name: "Library" })).toHaveAttribute("href", "#library");
    expect(screen.queryByRole("link", { name: /Start learning/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation" }));
    expect(screen.queryByRole("link", { name: /Start learning/ })).not.toBeInTheDocument();
  });

  test("section links point to real pages and smooth-scroll on the landing page without a #fragment", () => {
    Element.prototype.scrollIntoView = jest.fn();
    render(<><LandingNavbar links={[["#workflows", "Workflows", "/workflows"]]} /><section id="workflows">Workflows section</section></>);
    const link = within(screen.getByRole("navigation", { name: "Main navigation" })).getByRole("link", { name: "Workflows" });
    expect(link).toHaveAttribute("href", "/workflows");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: "start" }));
    expect(location.hash).toBe("");
  });
});

describe("navbar subscribe menu", () => {
  const links: [string, string][] = [["#pricing", "Pricing"]];
  test("Monthly / Yearly tabs switch the price and the checkout link", () => {
    render(<LandingNavbar links={links} prices={{ monthly: 299, yearly: 2999 }} />);
    const trigger = screen.getByRole("button", { name: "Subscribe" });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const monthly = screen.getByRole("tab", { name: "Monthly" }), yearly = screen.getByRole("tab", { name: /Yearly/ });
    expect(monthly).toHaveAttribute("aria-selected", "true");
    expect(yearly).toHaveTextContent("Save 16%");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("₹299");
    expect(screen.getByRole("link", { name: /Subscribe monthly/ })).toHaveAttribute("href", "/subscribe?plan=monthly");
    fireEvent.keyDown(monthly, { key: "ArrowRight" });
    expect(yearly).toHaveAttribute("aria-selected", "true");
    expect(yearly).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("₹2,999");
    expect(screen.getByRole("link", { name: /Subscribe yearly/ })).toHaveAttribute("href", "/subscribe?plan=yearly");
    fireEvent.click(monthly);
    expect(screen.getByRole("link", { name: /Subscribe monthly/ })).toBeInTheDocument();
  });

  test("shows a dash until prices load and closes with Escape", () => {
    render(<LandingNavbar links={links} />);
    const trigger = screen.getByRole("button", { name: "Subscribe" });
    fireEvent.click(trigger);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("—");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  test("opening the account menu closes the plans menu", () => {
    render(<LandingNavbar links={links} />);
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    // The account menu has tabs of its own; the plans menu's billing tabs are gone.
    expect(screen.queryByRole("tablist", { name: "Billing period" })).toBeNull();
    expect(screen.getByRole("tablist", { name: "Account menu" })).toBeInTheDocument();
  });
});
