import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { LandingPage } from "@/components/landing-page";
import { LanguageProvider } from "@/components/language-provider";
import { testimonials, testimonialAvatarGradient, testimonialInitials } from "@/lib/testimonials";

const INTERVAL = 5000;

function mockMatchMedia(matches: (query: string) => boolean) {
  window.matchMedia = jest.fn((query: string) => ({
    matches: matches(query), media: query, onchange: null,
    addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn(), dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  localStorage.clear();
  // Pricing/catalog requests never settle, so nothing but the carousel changes state during these tests.
  global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  // @ts-expect-error jsdom has no matchMedia; remove the stub a test installed
  delete window.matchMedia;
});

const carousel = () => within(screen.getByRole("region", { name: "Student reviews" }));
/** Names of the slides currently in view (off-screen slides are aria-hidden). */
const visibleSlides = () => carousel().getAllByRole("group", { name: /^Review \d of 6$/ }).map(slide => slide.getAttribute("aria-label"));
const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });

test("keeps the section heading and presents the carousel with slide semantics", () => {
  render(<LandingPage />);
  const region = screen.getByRole("region", { name: "Student reviews" });
  expect(region).toHaveAttribute("aria-roledescription", "carousel");
  expect(within(region).getByText("LOVED BY LEARNERS")).toBeInTheDocument();
  expect(within(region).getByRole("heading", { name: "Students are already learning with Masterclass" })).toBeInTheDocument();
  const first = carousel().getByRole("group", { name: "Review 1 of 6" });
  expect(first).toHaveAttribute("aria-roledescription", "slide");
  expect(first).toHaveTextContent("Aisha R.");
  expect(first).toHaveTextContent("B.Tech CSE");
  expect(within(first).getByRole("img", { name: "Rated 5 out of 5" })).toBeInTheDocument();
});

test("auto-advances one review every five seconds and wraps back to the first", () => {
  render(<LandingPage />);
  expect(visibleSlides()).toEqual(["Review 1 of 6"]);
  advance(INTERVAL - 1);
  expect(visibleSlides()).toEqual(["Review 1 of 6"]);
  advance(1);
  expect(visibleSlides()).toEqual(["Review 2 of 6"]);
  // Each slide schedules the next timer after it renders, so step one interval at a time.
  for (let step = 0; step < 4; step++) advance(INTERVAL);
  expect(visibleSlides()).toEqual(["Review 6 of 6"]);
  advance(INTERVAL);
  expect(visibleSlides()).toEqual(["Review 1 of 6"]);
});

test("pauses while the reviews are hovered and resumes with the remaining time", () => {
  render(<LandingPage />);
  advance(2000);
  const card = carousel().getByRole("group", { name: "Review 1 of 6" });
  fireEvent.mouseEnter(card);
  advance(INTERVAL * 3);
  expect(visibleSlides()).toEqual(["Review 1 of 6"]);
  fireEvent.mouseLeave(card);
  advance(2999);
  expect(visibleSlides()).toEqual(["Review 1 of 6"]);
  advance(1);
  expect(visibleSlides()).toEqual(["Review 2 of 6"]);
});

test("pauses while a carousel control has focus, but not while the pause button does", () => {
  render(<LandingPage />);
  const next = carousel().getByRole("button", { name: "Next review" });
  act(() => next.focus());
  advance(INTERVAL * 3);
  expect(visibleSlides()).toEqual(["Review 1 of 6"]);
  act(() => next.blur());
  advance(INTERVAL);
  expect(visibleSlides()).toEqual(["Review 2 of 6"]);
  act(() => carousel().getByRole("button", { name: "Pause automatic rotation" }).focus());
  advance(INTERVAL);
  expect(visibleSlides()).toEqual(["Review 3 of 6"]);
});

test("the pause button stops rotation until visitors start it again", () => {
  render(<LandingPage />);
  fireEvent.click(carousel().getByRole("button", { name: "Pause automatic rotation" }));
  advance(INTERVAL * 3);
  expect(visibleSlides()).toEqual(["Review 1 of 6"]);
  fireEvent.click(carousel().getByRole("button", { name: "Start automatic rotation" }));
  advance(INTERVAL);
  expect(visibleSlides()).toEqual(["Review 2 of 6"]);
});

test("does not autoplay under prefers-reduced-motion unless the visitor opts in", () => {
  mockMatchMedia(query => query.includes("prefers-reduced-motion"));
  render(<LandingPage />);
  expect(carousel().getByRole("button", { name: "Start automatic rotation" })).toBeInTheDocument();
  advance(INTERVAL * 4);
  expect(visibleSlides()).toEqual(["Review 1 of 6"]);
  fireEvent.click(carousel().getByRole("button", { name: "Next review" }));
  expect(visibleSlides()).toEqual(["Review 2 of 6"]);
  fireEvent.click(carousel().getByRole("button", { name: "Start automatic rotation" }));
  advance(INTERVAL);
  expect(visibleSlides()).toEqual(["Review 3 of 6"]);
});

test("shows three reviews at a time on wide screens with one dot per position", () => {
  mockMatchMedia(query => query.startsWith("(min-width"));
  render(<LandingPage />);
  expect(visibleSlides()).toEqual(["Review 1 of 6", "Review 2 of 6", "Review 3 of 6"]);
  const dots = within(carousel().getByRole("group", { name: "Choose reviews" })).getAllByRole("button");
  expect(dots).toHaveLength(4);
  expect(dots[0]).toHaveAttribute("aria-current", "true");
  fireEvent.click(dots[3]);
  expect(visibleSlides()).toEqual(["Review 4 of 6", "Review 5 of 6", "Review 6 of 6"]);
  fireEvent.click(carousel().getByRole("button", { name: "Next review" }));
  expect(visibleSlides()).toEqual(["Review 1 of 6", "Review 2 of 6", "Review 3 of 6"]);
  fireEvent.click(carousel().getByRole("button", { name: "Previous review" }));
  expect(visibleSlides()).toEqual(["Review 4 of 6", "Review 5 of 6", "Review 6 of 6"]);
});

test("renders the reviews and controls in Hindi", () => {
  localStorage.setItem("masterclass:language", "hi");
  render(<LanguageProvider><LandingPage /></LanguageProvider>);
  const region = screen.getByRole("region", { name: "छात्रों की समीक्षाएँ" });
  expect(within(region).getByText("सीखने वालों की पसंद")).toBeInTheDocument();
  const first = within(region).getByRole("group", { name: "6 में से समीक्षा 1" });
  expect(first).toHaveTextContent("आयशा आर.");
  expect(first).toHaveTextContent("बी.टेक सीएसई");
  expect(within(region).getByRole("button", { name: "अगली समीक्षा" })).toBeInTheDocument();
});

describe("testimonial data", () => {
  test("every entry is complete in both languages with a unique id", () => {
    expect(new Set(testimonials.map(item => item.id)).size).toBe(testimonials.length);
    for (const item of testimonials) {
      for (const field of [item.quote, item.name, item.program]) {
        expect(field.en.trim()).not.toBe("");
        expect(field.hi.trim()).not.toBe("");
      }
      if (item.rating !== undefined) expect([1, 2, 3, 4, 5]).toContain(item.rating);
    }
  });

  test("generated avatars use initials and a stable, name-derived gradient", () => {
    expect(testimonialInitials("Aisha R.")).toBe("AR");
    expect(testimonialInitials("आयशा आर.")).toBe("आआ");
    expect(testimonialAvatarGradient("aisha-r")).toBe(testimonialAvatarGradient("aisha-r"));
    expect(testimonialAvatarGradient("aisha-r")).toMatch(/^linear-gradient\(\d+deg, #[0-9a-f]{6}, #[0-9a-f]{6}\)$/);
    const gradients = new Set(testimonials.map(item => testimonialAvatarGradient(item.id)));
    expect(gradients.size).toBeGreaterThan(1);
  });
});
