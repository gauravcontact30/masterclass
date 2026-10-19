import { act, renderHook } from "@testing-library/react";
import { useNearViewport } from "@/components/use-near-viewport";

test("optional content waits until near the viewport and stays loaded", () => {
  const original = globalThis.IntersectionObserver;
  let notify: IntersectionObserverCallback;
  const disconnect = jest.fn();
  const observe = jest.fn();
  globalThis.IntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
    notify = callback;
    return { observe, disconnect };
  }) as unknown as typeof IntersectionObserver;
  try {
    const ref = { current: document.createElement("section") };
    const { result, unmount } = renderHook(() => useNearViewport(ref));
    expect(result.current).toBe(false);
    expect(observe).toHaveBeenCalledWith(ref.current);
    expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), { rootMargin: "600px 0px" });
    act(() => notify([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(result.current).toBe(false);
    act(() => notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(result.current).toBe(true);
    act(() => notify([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(result.current).toBe(true);
    expect(disconnect).toHaveBeenCalled();
    unmount();
  } finally { globalThis.IntersectionObserver = original; }
});
