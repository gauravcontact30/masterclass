import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotesExporter, REVOKE_DELAY_MS } from "@/app/components/NotesExporter";

type FakeResponse = { ok: boolean; status: number; headers: { get: (name: string) => string | null }; blob: () => Promise<Blob>; json: () => Promise<unknown> };
const fileResponse = (filename: string, bytes = "file"): FakeResponse => ({
  ok: true,
  status: 200,
  headers: { get: name => (name.toLowerCase() === "content-disposition" ? `attachment; filename="${filename}"` : null) },
  blob: async () => new Blob([bytes]),
  json: async () => { throw new Error("not json"); },
});
const errorResponse = (status: number, error: string): FakeResponse => ({ ok: false, status, headers: { get: () => null }, blob: async () => new Blob([]), json: async () => ({ error }) });

const card = (name: RegExp) => screen.getByRole("article", { name });
const sentBody = (call = 0) => JSON.parse((global.fetch as jest.Mock).mock.calls[call][1].body as string);

let click: jest.SpyInstance;
beforeEach(() => {
  jest.restoreAllMocks();
  global.fetch = jest.fn();
  URL.createObjectURL = jest.fn().mockReturnValue("blob:notes");
  URL.revokeObjectURL = jest.fn();
  click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});
afterEach(() => { jest.useRealTimers(); });

test("renders the sample notebook with its preview and summary", () => {
  render(<NotesExporter />);
  expect(screen.getByRole("heading", { level: 1, name: "Notes exporter" })).toBeInTheDocument();
  for (const [name, summary, button] of [
    [/jupyter notebook/i, /nbformat 4\.5 · Python 3 · \d+ cells · 2 runnable/, "Download .ipynb"],
  ] as const) {
    const article = card(name);
    expect(within(article).getByText(summary)).toBeInTheDocument();
    expect(within(article).getByRole("button", { name: button })).toBeEnabled();
  }
});

test("downloads through fetch + a temporary object URL, then revokes it", async () => {
  jest.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  (global.fetch as jest.Mock).mockResolvedValue(fileResponse("gradient-descent-in-10-minutes.ipynb"));
  render(<NotesExporter />);

  await user.click(within(card(/jupyter notebook/i)).getByRole("button", { name: "Download .ipynb" }));

  expect(await within(card(/jupyter notebook/i)).findByText("Saved gradient-descent-in-10-minutes.ipynb")).toBeInTheDocument();
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
  expect(url).toBe("/api/generate/notebook");
  expect(init).toMatchObject({ method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" } });
  expect(sentBody()).toMatchObject({ title: "Gradient descent in 10 minutes", theme: "retro-cyberpunk" });
  expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  expect(click).toHaveBeenCalledTimes(1);
  const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
  expect(anchor.download).toBe("gradient-descent-in-10-minutes.ipynb");
  expect(anchor.isConnected).toBe(false); // the temporary anchor is removed again

  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  act(() => { jest.advanceTimersByTime(REVOKE_DELAY_MS); });
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:notes");
});

test("shows a loading state while the server renders", async () => {
  let resolve!: (response: FakeResponse) => void;
  (global.fetch as jest.Mock).mockReturnValue(new Promise(done => { resolve = done; }));
  render(<NotesExporter />);
  const article = card(/jupyter notebook/i);
  await userEvent.click(within(article).getByRole("button", { name: "Download .ipynb" }));
  const busy = within(article).getByRole("button", { name: "Rendering…" });
  expect(busy).toBeDisabled();
  expect(busy).toHaveAttribute("aria-busy", "true");
  await act(async () => { resolve(fileResponse("gradient-descent-in-10-minutes.ipynb")); });
  expect(await within(article).findByText("Saved gradient-descent-in-10-minutes.ipynb")).toBeInTheDocument();
});

test("maps server error codes to actionable messages", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse(429, "rate_limited")).mockResolvedValueOnce(errorResponse(401, "signin_required"));
  render(<NotesExporter />);
  const deck = card(/jupyter notebook/i);
  await userEvent.click(within(deck).getByRole("button", { name: "Download .ipynb" }));
  expect(await within(deck).findByRole("alert")).toHaveTextContent(/Too many exports/);
  await userEvent.click(within(deck).getByRole("button", { name: "Download .ipynb" }));
  expect(await within(deck).findByRole("alert")).toHaveTextContent(/Sign in first/);
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

test("reports a network failure", async () => {
  (global.fetch as jest.Mock).mockRejectedValue(new TypeError("Failed to fetch"));
  render(<NotesExporter />);
  const article = card(/jupyter notebook/i);
  await userEvent.click(within(article).getByRole("button", { name: "Download .ipynb" }));
  expect(await within(article).findByRole("alert")).toHaveTextContent(/Network error/);
});

test("the theme picker is a keyboard-operable radio group that changes every payload", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(fileResponse("notes.ipynb"));
  render(<NotesExporter />);
  const cyberpunk = screen.getByRole("radio", { name: /Retro cyberpunk/ });
  expect(cyberpunk).toBeChecked();
  cyberpunk.focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(screen.getByRole("radio", { name: /Warm academic/ })).toBeChecked();
  await userEvent.click(within(card(/jupyter notebook/i)).getByRole("button", { name: "Download .ipynb" }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(sentBody().theme).toBe("warm-academic");
});

test("invalid content disables the export and explains why", async () => {
  render(<NotesExporter />);
  await userEvent.click(screen.getByRole("button", { name: "Clear" }));
  const pdf = card(/jupyter notebook/i);
  expect(within(pdf).getByRole("button", { name: "Download .ipynb" })).toBeDisabled();
  expect(within(pdf).getByText(/Fix these before exporting/)).toBeInTheDocument();
  expect(within(pdf).getByText(/sections: needs at least 1/)).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test("input-format tabs follow the ARIA tabs pattern and prefill the JSON bundle", async () => {
  render(<NotesExporter />);
  const markupTab = screen.getByRole("tab", { name: "Quick markup" });
  expect(markupTab).toHaveAttribute("aria-selected", "true");
  markupTab.focus();
  await userEvent.keyboard("{ArrowRight}");
  const jsonTab = screen.getByRole("tab", { name: /JSON.*payloads/ });
  expect(jsonTab).toHaveAttribute("aria-selected", "true");
  expect(jsonTab).toHaveFocus();
  const bundle = JSON.parse((screen.getByLabelText(/JSON.*bundle/) as HTMLTextAreaElement).value);
  expect(Object.keys(bundle).sort()).toEqual(["notebook"]);
  expect(within(card(/jupyter notebook/i)).getByRole("button", { name: "Download .ipynb" })).toBeEnabled();
});

test("a pasted notebook bundle validates content and rejects missing notebook data", async () => {
  render(<NotesExporter />);
  await userEvent.click(screen.getByRole("tab", { name: /JSON.*payloads/ }));
  const textarea = screen.getByLabelText(/JSON.*bundle/);
  await userEvent.clear(textarea);
  await userEvent.click(textarea);
  await userEvent.paste(JSON.stringify({ notebook: { title: "Notebook", sections: [] } }));
  expect(within(card(/jupyter notebook/i)).getByText(/sections: needs at least 1/)).toBeInTheDocument();
  expect(within(card(/jupyter notebook/i)).getByRole("button", { name: "Download .ipynb" })).toBeDisabled();

  await userEvent.clear(textarea);
  await userEvent.click(textarea);
  await userEvent.paste(JSON.stringify({ unknown: {} }));
  expect(screen.getByRole("alert")).toHaveTextContent(/no notebook key/);

  await userEvent.clear(textarea);
  await userEvent.click(textarea);
  await userEvent.paste("{ not json");
  expect(screen.getByRole("alert")).toHaveTextContent(/Invalid JSON/);
});
