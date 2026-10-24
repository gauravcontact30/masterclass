import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { useCarouselHeight } from "@/components/use-carousel-height";

function Fixture() {
  const ref = useRef<HTMLUListElement>(null);
  useCarouselHeight(ref);
  return <ul ref={ref}><li>Short</li><li>Tall</li></ul>;
}

test("does not measure offscreen cards and measures them when they approach the viewport", () => {
  const original = global.IntersectionObserver;
  let notify: IntersectionObserverCallback = () => {};
  const disconnect = jest.fn();
  global.IntersectionObserver = jest.fn(callback => {
    notify = callback;
    return { observe: jest.fn(), disconnect, unobserve: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
  jest.useFakeTimers();
  try {
    const { container, unmount } = render(<Fixture />);
    const track = container.querySelector("ul")!;
    const rect = { left: 0, right: 300, width: 300, height: 240 } as DOMRect;
    track.getBoundingClientRect = jest.fn(() => rect);
    const measure = jest.fn(() => rect);
    track.querySelectorAll("li").forEach(card => { card.getBoundingClientRect = measure; });
    act(() => { jest.runOnlyPendingTimers(); });
    expect(measure).not.toHaveBeenCalled();
    act(() => { notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver); jest.runOnlyPendingTimers(); });
    expect(track.style.height).toBe("240px");
    unmount();
    expect(disconnect).toHaveBeenCalled();
  } finally {
    global.IntersectionObserver = original;
    jest.useRealTimers();
  }
});

test("fits visible cards, updates after pagination and content resizing, and cleans up", () => {
  let resize: ResizeObserverCallback = () => {};
  const original = global.ResizeObserver;
  global.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) { resize = callback; }
    observe() {} unobserve() {} disconnect() {}
  };
  jest.useFakeTimers();
  try {
    const { container, unmount } = render(<Fixture />);
    const track = container.querySelector("ul")!;
    const cards = track.querySelectorAll("li");
    let offset = 0;
    let tallHeight = 900;
    const rect = (left: number, height: number) => ({ left, right: left + 300, width: 300, height }) as DOMRect;
    track.getBoundingClientRect = () => rect(0, 900);
    cards[0].getBoundingClientRect = () => rect(-offset, 300);
    cards[1].getBoundingClientRect = () => rect(324 - offset, tallHeight);
    act(() => { jest.runOnlyPendingTimers(); });
    expect(track.style.height).toBe("300px");
    offset = 324;
    act(() => { track.dispatchEvent(new Event("scroll")); jest.runOnlyPendingTimers(); });
    expect(track.style.height).toBe("900px");
    tallHeight = 1050;
    act(() => { resize([], {} as ResizeObserver); jest.runOnlyPendingTimers(); });
    expect(track.style.height).toBe("1050px");
    offset = 0;
    act(() => { window.dispatchEvent(new Event("resize")); jest.runOnlyPendingTimers(); });
    expect(track.style.height).toBe("300px");
    unmount();
    expect(track.style.height).toBe("");
  } finally {
    global.ResizeObserver = original;
    jest.useRealTimers();
  }
});
