import { act, renderHook } from "@testing-library/react";
import { useVisiblePlayback } from "@/components/use-visible-playback";

test("playback follows intersection and disconnects on unmount", () => {
  const original = globalThis.IntersectionObserver;
  let notify: IntersectionObserverCallback;
  const disconnect = jest.fn();
  globalThis.IntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
    notify = callback;
    return { observe: jest.fn(), disconnect };
  }) as unknown as typeof IntersectionObserver;
  try {
    const ref = { current: document.createElement("section") };
    const { result, unmount } = renderHook(() => useVisiblePlayback(ref));
    expect(result.current).toBe(true);
    act(() => notify([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(result.current).toBe(false);
    act(() => notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(result.current).toBe(true);
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  } finally {
    globalThis.IntersectionObserver = original;
  }
});
