import { act, render } from "@testing-library/react";
import { VisitTracker } from "@/components/visit-tracker";
import { EARLY_TRACK_SCRIPT } from "@/lib/early-track";
jest.mock("next/navigation", () => ({ usePathname: () => "/" }));

const bodies = () => jest.mocked(fetch).mock.calls.map(([, options]) => JSON.parse(options!.body as string));
const visibility = async (state: "hidden" | "visible") => {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
};
afterEach(() => {
  if (window.__mcEarly) window.__mcEarly.taken = true;
  delete window.__mcEarly;
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  jest.useRealTimers();
});

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

test("an early hidden page must become continuously visible for a second before recording", async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  await visibility("hidden");
  window.eval(EARLY_TRACK_SCRIPT);
  await act(async () => { jest.advanceTimersByTime(60_000); });
  expect(fetch).not.toHaveBeenCalled();
  await visibility("visible");
  await act(async () => { jest.advanceTimersByTime(999); });
  expect(fetch).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(1); });
  expect(bodies().map(b => b.type)).toEqual(["view"]);
  await visibility("hidden");
  expect(bodies().at(-1)).toMatchObject({ type: "leave", duration: 1000 });
});

test("hydration adopts only the current visible stretch and pagehide never sends a duplicate leave", async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  window.eval(EARLY_TRACK_SCRIPT);
  await act(async () => { jest.advanceTimersByTime(2000); });
  await visibility("hidden");
  await act(async () => { jest.advanceTimersByTime(60_000); });
  await visibility("visible");
  const { unmount } = render(<VisitTracker />);
  await act(async () => { jest.advanceTimersByTime(3000); });
  await act(async () => { window.dispatchEvent(new Event("pagehide")); });
  expect(bodies().filter(b => b.type === "leave").map(b => b.duration)).toEqual([2000, 3000]);
  await visibility("hidden");
  unmount();
  await act(async () => {});
  expect(bodies().filter(b => b.type === "leave")).toHaveLength(2);
});

test("hiding before the hydrated tracker records a view resets the visible-time minimum", async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  const { unmount } = render(<VisitTracker />);
  await act(async () => { jest.advanceTimersByTime(500); });
  await visibility("hidden");
  await act(async () => { jest.advanceTimersByTime(60_000); });
  await visibility("visible");
  await act(async () => { jest.advanceTimersByTime(999); });
  expect(fetch).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(1); });
  expect(bodies().find(b => b.type === "ping")).toMatchObject({ duration: 1000 });
  unmount();
  await act(async () => {});
});
