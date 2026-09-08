import { act, render, screen, fireEvent } from "@testing-library/react";
import { Carousel } from "@/components/carousel";

const slides = [
  { id: "a", content: "Slide A" },
  { id: "b", content: "Slide B" },
  { id: "c", content: "Slide C" },
];

afterEach(() => {
  jest.useRealTimers();
  // @ts-expect-error test cleanup of a jsdom global we may have stubbed
  delete window.matchMedia;
});

test("auto-advances to the next slide after the interval elapses", () => {
  jest.useFakeTimers();
  render(<Carousel slides={slides} intervalMs={1000} ariaLabel="Features" />);
  expect(screen.getByTestId("carousel-slide-a")).toBeVisible();
  act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByTestId("carousel-slide-b")).toBeVisible();
  expect(screen.getByTestId("carousel-slide-a")).not.toBeVisible();
});

test("pauses autoplay while the pointer is over the carousel and resumes after it leaves", () => {
  jest.useFakeTimers();
  render(<Carousel slides={slides} intervalMs={1000} ariaLabel="Features" />);
  fireEvent.mouseEnter(screen.getByRole("region", { name: "Features" }));
  act(() => { jest.advanceTimersByTime(3000); });
  expect(screen.getByTestId("carousel-slide-a")).toBeVisible();
  fireEvent.mouseLeave(screen.getByRole("region", { name: "Features" }));
  act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByTestId("carousel-slide-b")).toBeVisible();
});

test("does not autoplay when the user prefers reduced motion", () => {
  jest.useFakeTimers();
  window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
  render(<Carousel slides={slides} intervalMs={1000} ariaLabel="Features" />);
  act(() => { jest.advanceTimersByTime(5000); });
  expect(screen.getByTestId("carousel-slide-a")).toBeVisible();
});

test("moves to a slide when its dot control is activated", () => {
  render(<Carousel slides={slides} intervalMs={1000} ariaLabel="Features" />);
  fireEvent.click(screen.getByRole("button", { name: "Go to slide 3" }));
  expect(screen.getByTestId("carousel-slide-c")).toBeVisible();
});

test("wraps to the last slide when the previous control is activated on the first slide", () => {
  render(<Carousel slides={slides} intervalMs={1000} ariaLabel="Features" />);
  fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
  expect(screen.getByTestId("carousel-slide-c")).toBeVisible();
});
