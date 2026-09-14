import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Workspace } from "@/components/workspace";
import { requestJson } from "@/lib/client";

jest.mock("@/lib/client", () => ({ requestJson: jest.fn(), errorKey: jest.requireActual("@/lib/client").errorKey }));
jest.mock("@/lib/supabase-browser", () => ({ supabaseBrowser: () => ({ auth: { signOut: jest.fn() } }) }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }));
jest.mock("@/components/generation-form", () => ({ GenerationForm: () => null }));
jest.mock("@/components/learn-modal", () => ({ LearnModal: () => null }));
jest.mock("@/components/membership", () => ({ Membership: () => null }));
jest.mock("@/components/connections", () => ({ Connections: () => null }));
jest.mock("@/components/sample-lessons", () => ({ SampleLessons: () => null }));

const accountData = {
  profile: { language: "en" },
  account: { tier: "free", used: 1, limit: 3, subscription: null, creditBalance: 2 },
  documents: [],
  progress: [],
};

beforeEach(() => {
  (requestJson as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/catalog") return Promise.resolve({ technologies: [], topics: [] });
    if (url === "/api/account") return Promise.resolve(accountData);
    return Promise.resolve({});
  });
});

test("shows the purchased download-credit balance as a dashboard stat", async () => {
  render(<Workspace authEnabled configured billingEnabled />);
  await waitFor(() => expect(screen.getByText("Download credits").closest(".stat")!.textContent).toContain("2"));
});

const baseRequest = { technologyId: "react", topicId: "react-state", format: "pdf" as const, language: "en" as const, level: "beginner" as const, theme: "minimal" as const };
const readyPdf = { id: "doc-pdf", user_id: "u1", title: "React basics", request: baseRequest, status: "ready" as const, created_at: "2026-01-01T00:00:00Z", error_code: null, curriculum: null, page_titles: ["Cover"], storage_path: "path", preview_paths: [] };
const readyPptx = { ...readyPdf, id: "doc-pptx", title: "React deck", request: { ...baseRequest, format: "pptx" as const } };
const readyNotes = { ...readyPdf, id: "doc-notes", storage_path: null, request: { ...baseRequest, format: "notes" as const } };
const curriculum = {
  title: "React basics", objectives: ["Learn state", "Learn props"], prerequisites: [], minutes: 20,
  lessons: [{ title: "Lesson one", explanation: "- A point about state\n- A second point", example: "- A worked example point", code: "", exercise: "- Try it yourself", checkpoint: "- Check your understanding", mistake: "- Avoid this mistake" }],
  project: "Build a small component.", summary: "State drives what renders.", glossary: [{ term: "State", definition: "Data a component owns." }],
};

test("filters the library by PDF, PowerPoint and notes", async () => {
  (requestJson as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/catalog") return Promise.resolve({ technologies: [], topics: [] });
    if (url === "/api/account") return Promise.resolve({ ...accountData, documents: [readyPdf, readyPptx] });
    return Promise.resolve({});
  });
  const user = userEvent.setup();
  render(<Workspace authEnabled configured billingEnabled />);
  await waitFor(() => expect(screen.getByRole("heading", { name: "React basics" })).toBeInTheDocument());

  const tabs = screen.getByRole("tablist", { name: "Filter by document type" });
  expect(within(tabs).getByRole("tab", { name: /All/ })).toHaveAttribute("aria-selected", "true");
  // Only Notebook Notes documents count: a PDF or PPTX is never listed again as notes.
  expect(within(tabs).getByRole("tab", { name: /Notebook Notes/ })).toHaveTextContent("0");
  expect(screen.getByRole("heading", { name: "React deck" })).toBeInTheDocument();

  await user.click(within(tabs).getByRole("tab", { name: /PDF/ }));
  const panel = screen.getByRole("tabpanel");
  expect(within(panel).getByRole("heading", { name: "React basics" })).toBeInTheDocument();
  expect(within(panel).queryByRole("heading", { name: "React deck" })).not.toBeInTheDocument();

  await user.click(within(tabs).getByRole("tab", { name: /PPTX/ }));
  expect(screen.getByRole("heading", { name: "React deck" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "React basics" })).not.toBeInTheDocument();

  await user.click(within(tabs).getByRole("tab", { name: /Notebook Notes/ }));
  expect(screen.queryByRole("heading", { name: "React basics" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "React deck" })).not.toBeInTheDocument();
  expect(screen.getByText("Generate a guide to get notes here.")).toBeInTheDocument();
});

test("shows the same library list on the My library tab", async () => {
  (requestJson as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/catalog") return Promise.resolve({ technologies: [], topics: [] });
    if (url === "/api/account") return Promise.resolve({ ...accountData, documents: [readyPdf, readyPptx] });
    return Promise.resolve({});
  });
  render(<Workspace authEnabled configured billingEnabled initialTab="library" />);
  await waitFor(() => expect(screen.getByRole("heading", { name: "React basics" })).toBeInTheDocument());
  expect(screen.getByRole("searchbox", { name: "Search your library" })).toBeInTheDocument();
  expect(screen.getByRole("tablist", { name: "Filter by document type" })).toBeInTheDocument();
});

test("deletes a document only after the user confirms", async () => {
  (requestJson as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/catalog") return Promise.resolve({ technologies: [], topics: [] });
    if (url === "/api/account") return Promise.resolve({ ...accountData, documents: [readyPdf] });
    return Promise.resolve({ ok: true });
  });
  render(<Workspace authEnabled configured billingEnabled />);
  await waitFor(() => expect(screen.getAllByText("React basics").length).toBeGreaterThan(0));

  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(screen.getByRole("heading", { name: "Delete for good?" })).toBeInTheDocument();
  expect(requestJson).not.toHaveBeenCalledWith("/api/documents/doc-pdf", expect.anything());

  await user.click(screen.getByRole("button", { name: "Delete for good?" }));
  await waitFor(() => expect(requestJson).toHaveBeenCalledWith("/api/documents/doc-pdf", { method: "DELETE" }));
});

test("copies point-wise notes to the clipboard", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  (requestJson as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/catalog") return Promise.resolve({ technologies: [], topics: [] });
    if (url === "/api/account") return Promise.resolve({ ...accountData, documents: [readyPdf, readyNotes] });
    if (url === "/api/documents/doc-notes") return Promise.resolve({ document: { ...readyNotes, curriculum } });
    return Promise.resolve({});
  });
  const user = userEvent.setup();
  // userEvent.setup() installs its own clipboard stub, so ours must be defined after
  // it, overriding that stub, or userEvent silently wins and this mock never fires.
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  render(<Workspace authEnabled configured billingEnabled />);
  await waitFor(() => expect(screen.getAllByRole("heading", { name: "React basics" })).toHaveLength(2));

  await user.click(screen.getByRole("tab", { name: /Notebook Notes/ }));
  await user.click(screen.getByRole("button", { name: /Copy notes/ }));

  await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("A point about state")));
  expect(writeText.mock.calls[0][0]).toContain("React basics");
  expect(await screen.findByRole("button", { name: /Copied/ })).toBeInTheDocument();
});
