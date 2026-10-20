import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ReadableStream, TextDecoderStream } from "node:stream/web";
import StudentChatPanel from "@/components/student-chat-panel";
import { LanguageProvider } from "@/components/language-provider";

jest.mock("next/navigation", () => ({ usePathname: () => "/dashboard/workflow" }));
Object.assign(globalThis, { ReadableStream, TextDecoderStream });

/** An NDJSON reply whose lines arrive one by one, released by `next()`. */
function streamedReply(lines: object[]) {
  const encoder = new TextEncoder();
  let push!: (line: object | null) => void;
  const body = new ReadableStream<Uint8Array>({ start(controller) { push = line => line ? controller.enqueue(encoder.encode(`${JSON.stringify(line)}\n`)) : controller.close(); } });
  return { response: { ok: true, body, json: async () => ({}) }, next: () => push(lines.shift() ?? null) };
}
const renderPanel = () => render(<LanguageProvider><StudentChatPanel open onOpenChange={() => undefined} /></LanguageProvider>);

beforeEach(() => { localStorage.clear(); global.fetch = jest.fn() as jest.Mock; });

test("an answer appears while it is being written, then gains copy, regenerate and follow-ups", async () => {
  const reply = streamedReply([
    { type: "meta", sources: [{ title: "Closures", href: "/dashboard/notes?note=closures" }] },
    { type: "delta", text: "A closure **keeps** its scope.\n" },
    { type: "delta", text: "- one\n- two" },
    { type: "done", answer: "A closure **keeps** its scope.\n- one\n- two", mode: "ai" },
  ]);
  (global.fetch as jest.Mock).mockResolvedValue(reply.response);
  renderPanel();
  fireEvent.change(screen.getByLabelText("Ask a study question"), { target: { value: "What is a closure?" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));

  const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
  expect(body).toMatchObject({ stream: true, mode: "study", language: "en", page: { path: "/dashboard/workflow" }, messages: [{ role: "user", content: "What is a closure?" }] });
  expect(screen.getByRole("button", { name: "Stop reply" })).toBeInTheDocument();

  await act(async () => { reply.next(); reply.next(); });
  const answer = await screen.findByRole("article", { name: "Study Buddy answer" });
  await waitFor(() => expect(within(answer).getByText("keeps").tagName).toBe("STRONG"));
  // Still writing: no actions yet.
  expect(within(answer).queryByRole("button", { name: "Copy answer" })).not.toBeInTheDocument();

  await act(async () => { reply.next(); reply.next(); reply.next(); });
  await waitFor(() => expect(within(answer).getAllByRole("listitem")).toHaveLength(2));
  expect(within(answer).getByRole("button", { name: "Copy answer" })).toBeInTheDocument();
  expect(within(answer).getByRole("button", { name: "Regenerate answer" })).toBeInTheDocument();
  expect(within(answer).getByRole("link", { name: "Closures" })).toHaveAttribute("href", "/dashboard/notes?note=closures");
  expect(within(screen.getByRole("group", { name: "Follow up on this answer" })).getByRole("button", { name: "Quiz me" })).toBeInTheDocument();
});

test("the conversation is kept for the next visit, and a new conversation clears it", async () => {
  const reply = streamedReply([{ type: "meta", sources: [] }, { type: "done", answer: "Saved answer.", mode: "ai" }]);
  (global.fetch as jest.Mock).mockResolvedValue(reply.response);
  const first = renderPanel();
  fireEvent.click(screen.getByRole("button", { name: /Explain the key ideas on this page/ }));
  await act(async () => { reply.next(); reply.next(); reply.next(); });
  await screen.findByText("Saved answer.");
  first.unmount();

  renderPanel();
  expect(screen.getByText("Saved answer.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Start a new conversation" }));
  expect(screen.queryByText("Saved answer.")).not.toBeInTheDocument();
  expect(localStorage.getItem("study-buddy:v1")).toBeNull();
});

test("a failed request explains itself and offers a retry", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, body: null, json: async () => ({ error: "rate_limited" }) });
  renderPanel();
  fireEvent.click(screen.getByRole("button", { name: /Summarize JavaScript closures/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("You are asking quickly");
  const reply = streamedReply([{ type: "meta", sources: [] }, { type: "done", answer: "Second try worked.", mode: "ai" }]);
  (global.fetch as jest.Mock).mockResolvedValueOnce(reply.response);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await act(async () => { reply.next(); reply.next(); reply.next(); });
  expect(await screen.findByText("Second try worked.")).toBeInTheDocument();
  expect(screen.getAllByRole("article", { name: "Your question" })).toHaveLength(1);
});
