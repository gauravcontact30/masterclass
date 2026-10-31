import { act, render } from "@testing-library/react";
import { ClientMonitor } from "@/components/client-monitor";
import { useReportWebVitals } from "next/web-vitals";

let path = "/";
jest.mock("next/navigation", () => ({ usePathname: () => path }));
jest.mock("next/web-vitals", () => ({ useReportWebVitals: jest.fn() }));
type Callback = Parameters<typeof useReportWebVitals>[0];
const report = (name: string, value: number) => {
  const callback = jest.mocked(useReportWebVitals).mock.calls.at(-1)![0];
  act(() => callback({ name, value } as Parameters<Callback>[0]));
};
beforeEach(() => {
  path = "/";
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: undefined });
});

test("document vitals retain the original URL after soft navigation and are not flushed during mount", () => {
  const view = render(<ClientMonitor />);
  const firstCallback = jest.mocked(useReportWebVitals).mock.calls.at(-1)![0];
  report("FCP", 500); report("TTFB", 90);
  expect(fetch).not.toHaveBeenCalled();
  path = "/learn";
  view.rerender(<ClientMonitor />);
  expect(jest.mocked(useReportWebVitals).mock.calls.at(-1)![0]).toBe(firstCallback);
  report("LCP", 1200); report("INP", 64);
  act(() => window.dispatchEvent(new Event("pagehide")));
  const body = JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(body).toMatchObject({ path: "/", vitals: { FCP: 500, TTFB: 90, LCP: 1200, INP: 64 } });
  act(() => window.dispatchEvent(new Event("pagehide")));
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("route errors keep their own attribution, and admin visits are excluded", () => {
  const view = render(<ClientMonitor />);
  act(() => window.dispatchEvent(new ErrorEvent("error", { message: "Example failure" })));
  path = "/super-admin";
  view.rerender(<ClientMonitor />);
  expect(JSON.parse(jest.mocked(fetch).mock.calls[0][1]!.body as string)).toMatchObject({ path: "/", errors: [expect.objectContaining({ message: "Example failure" })] });
  act(() => window.dispatchEvent(new ErrorEvent("error", { message: "Admin error" })));
  act(() => window.dispatchEvent(new Event("pagehide")));
  expect(fetch).toHaveBeenCalledTimes(1);
});
