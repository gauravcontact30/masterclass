import { act, render, waitFor } from "@testing-library/react";
import { LandingNews } from "@/components/landing-news";

test("offscreen news waits for proximity and cancels its request on unmount", async () => {
  const original = global.IntersectionObserver;
  const originalFetch = global.fetch;
  const observers: { callback: IntersectionObserverCallback; margin?: string }[] = [];
  global.IntersectionObserver = jest.fn((callback, options) => {
    observers.push({ callback, margin: options?.rootMargin });
    return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
  const fetchMock = jest.fn().mockImplementation(() => new Promise(() => {}));
  global.fetch = fetchMock;
  try {
    const view = render(<LandingNews />);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.querySelector('link[rel="preload"][href="/api/landing/news"]')).toBeNull();
    const near = observers.find(observer => observer.margin === "600px 0px")!;
    act(() => near.callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    expect(signal.aborted).toBe(false);
    view.unmount();
    expect(signal.aborted).toBe(true);
  } finally {
    global.IntersectionObserver = original;
    global.fetch = originalFetch;
  }
});
