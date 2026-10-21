import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SuperAdminCopilot } from "@/components/super-admin-copilot";

const signals = (page: string) => ({
  page, days: 7, generatedAt: new Date().toISOString(),
  kpis: [{ label: "Open reports", value: 4, previous: 2, note: "2 already in review", better: "down" }, { label: "Completion rate", value: 40, format: "percent", note: "n", better: "up" }],
  watch: { note: "Oldest first.", columns: [{ key: "ref", label: "Ref" }, { key: "path", label: "Page" }, { key: "reason", label: "Reason" }], rows: [{ ref: "R1", path: "/learn/a", reason: "broken" }, { ref: "R2", path: "/learn/b", reason: "inappropriate" }] },
  findings: [{ severity: "medium", title: "A report has waited 80 hours", detail: "Resolve the oldest first." }],
  facts: {},
});
const analysis = { summary: "Two open reports; one is serious.", findings: [], actions: [{ priority: "high", title: "Review R2 now", detail: "Hide the quiz text." }], triage: [{ ref: "R1", severity: "low", label: "Broken link", reason: "Minor." }, { ref: "R2", severity: "high", label: "Offensive", reason: "Harmful text." }], draft: { title: "Quiz fix underway", body: "We are correcting a quiz.", tone: "info" }, source: "ai", model: "test-model", generatedAt: new Date().toISOString() };

let calls: { url: string; init?: RequestInit }[] = [];
beforeEach(() => {
  calls = []; sessionStorage.clear();
  global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const body = url.startsWith("/api/super-admin/copilot?") ? signals(new URL(url, "http://x").searchParams.get("page")!) : url === "/api/super-admin/copilot" ? analysis : { announcement: {} };
    return { ok: true, status: 200, json: async () => body } as Response;
  }) as unknown as typeof fetch;
});

test("shows KPIs with their change, rule findings and a headed record table", async () => {
  render(<SuperAdminCopilot page="moderation" title="Moderation" days={7} />);
  await act(async () => {});
  expect(calls[0].url).toBe("/api/super-admin/copilot?page=moderation&days=7");
  expect(screen.getByText("Open reports")).toBeInTheDocument();
  expect(screen.getByTitle("Previous window: 2")).toHaveTextContent("+100%");
  expect(screen.getByTitle("Previous window: 2")).toHaveAttribute("data-tone", "bad");
  expect(screen.getByText("A report has waited 80 hours")).toBeInTheDocument();
  const table = screen.getByRole("table");
  expect(within(table).getAllByRole("columnheader").map(th => th.textContent)).toEqual(expect.arrayContaining(["Ref", "Page", "Reason"]));
});

test("AI triage ranks the reports and adds severity columns", async () => {
  render(<SuperAdminCopilot page="moderation" title="Moderation" days={7} />);
  await act(async () => {});
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Analyse & triage" })); });
  expect(JSON.parse(String(calls[1].init?.body))).toEqual({ page: "moderation", days: 7 });
  expect(screen.getByText("Two open reports; one is serious.")).toBeInTheDocument();
  expect(screen.getByText("Review R2 now")).toBeInTheDocument();
  const headers = within(screen.getByRole("table")).getAllByRole("columnheader").map(th => th.textContent);
  expect(headers).toEqual(expect.arrayContaining(["AI severity", "AI triage"]));
  const firstRow = within(screen.getByRole("table")).getAllByRole("row")[1];
  expect(firstRow).toHaveTextContent("R2");
});

test("an AI-drafted announcement publishes through the announcements API", async () => {
  const changed = jest.fn();
  window.addEventListener("admin:announcements-changed", changed);
  render(<SuperAdminCopilot page="announcements" title="Announcements" days={7} />);
  await act(async () => {});
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Analyse & draft" })); });
  expect(screen.getByText("Quiz fix underway")).toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Publish now" })); });
  const publish = calls.find(c => c.url === "/api/super-admin/announcements")!;
  expect(JSON.parse(String(publish.init?.body))).toEqual({ title: "Quiz fix underway", body: "We are correcting a quiz.", tone: "info" });
  expect(changed).toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent("Published");
});

test("suggested questions ask the page and show the answer", async () => {
  (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const body = url.startsWith("/api/super-admin/copilot?") ? signals("queue") : { ...analysis, triage: undefined, draft: undefined, answer: "Yes, the queue is healthy.", question: JSON.parse(String(init?.body)).question };
    return { ok: true, status: 200, json: async () => body } as Response;
  });
  render(<SuperAdminCopilot page="queue" title="Generation queue" days={7} />);
  await act(async () => {});
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Is the queue healthy right now?" })); });
  expect(screen.getByRole("list", { name: "Answers" })).toHaveTextContent("Yes, the queue is healthy.");
});
