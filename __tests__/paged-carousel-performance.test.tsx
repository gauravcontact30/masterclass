import { act, render } from "@testing-library/react";
import { usePagedCarousel } from "@/components/use-paged-carousel";

test("coalesces scroll measurements and cancels pending work on unmount", () => {
  const callbacks: FrameRequestCallback[] = [];
  const request = jest.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { callbacks.push(callback); return callbacks.length; });
  const cancel = jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  function Carousel() {
    const { track, page } = usePagedCarousel<HTMLDivElement>(3, 1, 120000);
    return <div ref={track} data-testid="track">{page}</div>;
  }
  try {
    const { getByTestId, unmount } = render(<Carousel />);
    const track = getByTestId("track");
    Object.defineProperties(track, { clientWidth: { value: 100 }, scrollWidth: { value: 300 }, scrollLeft: { value: 100 } });
    act(() => { track.dispatchEvent(new Event("scroll")); track.dispatchEvent(new Event("scroll")); });
    expect(request).toHaveBeenCalledTimes(1);
    act(() => callbacks[0](0));
    expect(track.textContent).toBe("1");
    act(() => track.dispatchEvent(new Event("scroll")));
    unmount();
    expect(cancel).toHaveBeenCalledWith(2);
  } finally { request.mockRestore(); cancel.mockRestore(); }
});
