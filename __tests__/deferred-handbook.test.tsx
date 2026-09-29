import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DeferredHandbook } from "@/components/deferred-handbook";

const book = (title: string) => ({ title, description: "", questionPrefix: "", topics: [], categories: [] });

test("loads an opened catalogue and reuses it when revisited", async () => {
  const fetcher = jest.fn().mockResolvedValue({ ok: true, json: async () => book("Cached handbook") });
  global.fetch = fetcher;
  const view = render(<DeferredHandbook title="Cached handbook">{data => <p>{data.title} ready</p>}</DeferredHandbook>);
  expect(screen.getByRole("status")).toHaveTextContent("Loading topics");
  expect(await screen.findByText("Cached handbook ready")).toBeVisible();
  view.unmount();
  render(<DeferredHandbook title="Cached handbook">{data => <p>{data.title} ready</p>}</DeferredHandbook>);
  expect(screen.getByText("Cached handbook ready")).toBeVisible();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test("failed requests can be retried", async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => book("Retry handbook") });
  render(<DeferredHandbook title="Retry handbook">{data => <p>{data.title} ready</p>}</DeferredHandbook>);
  expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Retry handbook ready")).toBeVisible();
});

test("leaving a catalogue aborts its request", async () => {
  let signal: AbortSignal | undefined;
  global.fetch = jest.fn((_url, options) => {
    signal = options?.signal as AbortSignal;
    return new Promise<Response>(() => {});
  });
  const view = render(<DeferredHandbook title="Aborted handbook">{data => <p>{data.title}</p>}</DeferredHandbook>);
  await waitFor(() => expect(signal).toBeDefined());
  act(() => view.unmount());
  expect(signal?.aborted).toBe(true);
});
