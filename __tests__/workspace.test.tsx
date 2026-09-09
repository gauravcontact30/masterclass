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
const curriculum = {
  title: "React basics", objectives: ["Learn state", "Learn props"], prerequisites: [], minutes: 20,
  lessons: [{ title: "Lesson one", explanation: "- A point about state\n- A second point", example: "- A worked example point", code: "", exercise: "- Try it yourself", checkpoint: "- Check your understanding", mistake: "- Avoid this mistake" }],
  project: "Build a small component.", summary: "State drives what renders.", glossary: [{ term: "State", definition: "Data a component owns." }],
};

test("splits the library into PDF, PowerPoint and Copy notes sections", async () => {
  (requestJson as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/catalog") return Promise.resolve({ technologies: [], topics: [] });
    if (url === "/api/account") return Promise.resolve({ ...accountData, documents: [readyPdf, readyPptx] });
    return Promise.resolve({});
  });
  render(<Workspace authEnabled configured billingEnabled />);
  await waitFor(() => expect(screen.getByText("PDF guides")).toBeInTheDocument());

  const pdfSection = screen.getByText("PDF guides").closest(".library-group") as HTMLElement;
  expect(within(pdfSection).getAllByText("React basics").length).toBeGreaterThan(0);
  expect(within(pdfSection).queryAllByText("React deck").length).toBe(0);

  const pptxSection = screen.getByText("PowerPoint decks").closest(".library-group") as HTMLElement;
  expect(within(pptxSection).getAllByText("React deck").length).toBeGreaterThan(0);

  const notesSection = screen.getByRole("heading", { name: /Copy notes/ }).closest(".library-group") as HTMLElement;
  expect(within(notesSection).getByText("React basics")).toBeInTheDocument();
  expect(within(notesSection).getByText("React deck")).toBeInTheDocument();
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
  expect(screen.getByText("Delete for good?")).toBeInTheDocument();
  expect(requestJson).not.toHaveBeenCalledWith("/api/documents/doc-pdf", expect.anything());

  await user.click(screen.getByRole("button", { name: "Delete for good?" }));
  await waitFor(() => expect(requestJson).toHaveBeenCalledWith("/api/documents/doc-pdf", { method: "DELETE" }));
});

test("copies point-wise notes to the clipboard", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  (requestJson as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/catalog") return Promise.resolve({ technologies: [], topics: [] });
    if (url === "/api/account") return Promise.resolve({ ...accountData, documents: [readyPdf] });
    if (url === "/api/documents/doc-pdf") return Promise.resolve({ document: { ...readyPdf, curriculum } });
    return Promise.resolve({});
  });
  const user = userEvent.setup();
  // userEvent.setup() installs its own clipboard stub, so ours must be defined after
  // it, overriding that stub, or userEvent silently wins and this mock never fires.
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  render(<Workspace authEnabled configured billingEnabled />);
  await waitFor(() => expect(screen.getByRole("heading", { name: /Copy notes/ })).toBeInTheDocument());

  await user.click(screen.getByRole("button", { name: /Copy notes/ }));

  await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("A point about state")));
  expect(writeText.mock.calls[0][0]).toContain("React basics");
  expect(await screen.findByRole("button", { name: /Copied/ })).toBeInTheDocument();
});
