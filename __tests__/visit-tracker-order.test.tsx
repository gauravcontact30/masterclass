import { act, render } from "@testing-library/react";
import { VisitTracker } from "@/components/visit-tracker";
import { EARLY_TRACK_SCRIPT } from "@/lib/early-track";
jest.mock("next/navigation", () => ({ usePathname: () => "/" }));

test("early view finishes setting session cookies before hydrated tracking sends more events", async () => {
  jest.useFakeTimers();
  let finish!: (response: Response) => void;
  const first = new Promise<Response>(resolve => { finish = resolve; });
  global.fetch = jest.fn().mockReturnValueOnce(first).mockResolvedValue({ ok: true });
  // Execute the actual inline script before hydration; the first request remains in flight.
  window.eval(EARLY_TRACK_SCRIPT);
  await act(async () => { jest.advanceTimersByTime(1500); });
  expect(fetch).toHaveBeenCalledTimes(1);
  const view = JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(view.type).toBe("view");
  const { unmount } = render(<VisitTracker />);
  await act(async () => { jest.advanceTimersByTime(45_000); });
  expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => { finish({ ok: true } as Response); });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(JSON.parse(jest.mocked(fetch).mock.calls[1][1]!.body as string).type).toBe("ping");
  unmount();
  await act(async () => {});
  delete window.__mcEarly;
  jest.useRealTimers();
});
