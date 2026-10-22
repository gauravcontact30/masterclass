import { act, fireEvent, render, screen } from "@testing-library/react";
import { AuthStory } from "@/components/auth-carousel";

const FIRST = "Choose a goal. Make steady progress.";
const SECOND = "In-app notes, lesson by lesson";

// Hidden slides are excluded from role queries, so the only level-2 heading
// found is the slide currently on show.
const shownTitle = () => screen.getByRole("heading", { level: 2 }).textContent;
const region = () => screen.getByRole("region", { name: "What you get with MasterClass" });
const liveRegion = () => screen.getByRole("group", { name: /of 4$/ }).parentElement!;
const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });

function preferReducedMotion() {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() }) as unknown as typeof window.matchMedia;
}

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => {
  jest.useRealTimers();
  // @ts-expect-error cleanup of a jsdom global some tests stub
  delete window.matchMedia;
});

test("is announced as a carousel of four labelled slides", () => {
  render(<AuthStory />);
  expect(region()).toHaveAttribute("aria-roledescription", "carousel");
  const slide = screen.getByRole("group", { name: "1 of 4" });
  expect(slide).toHaveAttribute("aria-roledescription", "slide");
  expect(screen.getAllByRole("button", { name: /^Go to slide \d$/ })).toHaveLength(4);
});

test("autoplays every five seconds and stays silent to screen readers while it rotates", () => {
  render(<AuthStory />);
  expect(shownTitle()).toBe(FIRST);
  expect(liveRegion()).toHaveAttribute("aria-live", "off");
  advance(4999);
  expect(shownTitle()).toBe(FIRST);
  advance(1);
  expect(shownTitle()).toBe(SECOND);
});

test("pauses while the pointer is over it and resumes when it leaves", () => {
  render(<AuthStory />);
  fireEvent.mouseEnter(region());
  advance(15000);
  expect(shownTitle()).toBe(FIRST);
  expect(liveRegion()).toHaveAttribute("aria-live", "polite");
  fireEvent.mouseLeave(region());
  advance(5000);
  expect(shownTitle()).toBe(SECOND);
});

test("pauses while keyboard focus is inside it and resumes once focus leaves", () => {
  render(<AuthStory />);
  act(() => { screen.getByRole("button", { name: "Go to slide 1" }).focus(); });
  advance(15000);
  expect(shownTitle()).toBe(FIRST);
  act(() => { (document.activeElement as HTMLElement).blur(); });
  advance(5000);
  expect(shownTitle()).toBe(SECOND);
});

test("the pause button stops rotation until the visitor presses play", () => {
  render(<AuthStory />);
  fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
  advance(15000);
  expect(shownTitle()).toBe(FIRST);
  expect(liveRegion()).toHaveAttribute("aria-live", "polite");

  fireEvent.click(screen.getByRole("button", { name: "Play slideshow" }));
  advance(5000);
  expect(shownTitle()).toBe(SECOND);
  expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeInTheDocument();
});

test("autoplays every 5 seconds even when the visitor prefers reduced motion", () => {
  preferReducedMotion();
  render(<AuthStory />);
  expect(shownTitle()).toBe(FIRST);
  advance(4999);
  expect(shownTitle()).toBe(FIRST);
  advance(1);
  expect(shownTitle()).toBe(SECOND);
});

test("dot navigation jumps straight to a slide and marks it current", () => {
  render(<AuthStory />);
  const dot = screen.getByRole("button", { name: "Go to slide 4" });
  fireEvent.click(dot);
  expect(shownTitle()).toBe("Your preparation. Your membership.");
  expect(dot).toHaveAttribute("aria-current", "true");
  expect(screen.getByRole("button", { name: "Go to slide 1" })).not.toHaveAttribute("aria-current");
});

test("fourth slide offers only monthly and yearly subscriptions", () => {
 render(<AuthStory />); fireEvent.click(screen.getByRole("button", {name:"Go to slide 4"}));
 expect(screen.getByText(/subscribe monthly or yearly/i)).toBeVisible();
 expect(screen.queryByText(/free|per download/i)).not.toBeInTheDocument();
});

test("every slide has its own photograph", () => {
 const { container } = render(<AuthStory />);
 const sources = [...container.querySelectorAll("img")].map(img => img.getAttribute("src") ?? "");
 expect(sources).toHaveLength(4);
 expect(new Set(sources).size).toBe(4);
 sources.forEach(src => expect(decodeURIComponent(src)).toMatch(/\/images\/auth\/(guide|formats|languages|plans)\.webp/));
});

test("shows only the current slide's photograph, and sign-up never repeats a sign-in one", () => {
  const photos = (container: HTMLElement) => [...container.querySelectorAll("[aria-roledescription=slide]")].map(slide => ({ hidden: (slide as HTMLElement).hidden, src: decodeURIComponent(slide.querySelector("img")!.getAttribute("src")!) }));
  const signin = photos(render(<AuthStory />).container);
  expect(signin.filter(p => !p.hidden)).toHaveLength(1);
  const signup = photos(render(<AuthStory mode="signup" />).container);
  expect(new Set([...signin, ...signup].map(p => p.src)).size).toBe(8);
});
