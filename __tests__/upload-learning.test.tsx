import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SuperAdminUploadLearning, placementHref } from "@/components/super-admin-upload-learning";
import { LearningSlot } from "@/components/learning-slot";
import { SECTIONS, slugify, surfacePages } from "@/lib/learning-uploads";

const USER = "owner-1";
const notepad = {
  version: 2, activeId: "f1",
  documents: [
    { id: "f1", title: "React hooks cheat sheet", html: "<h2>Hooks</h2><p>useState keeps state.</p><script>alert(1)</script>", background: "#eff6ff", kind: "saved", starred: false, createdAt: "2026-10-18T10:00:00Z", updatedAt: "2026-10-19T10:00:00Z" },
    { id: "f2", title: "Empty draft", html: "", background: "#ffffff", kind: "draft", starred: false, createdAt: "2026-10-18T10:00:00Z", updatedAt: "2026-10-18T10:00:00Z" },
  ],
};
const upload = {
  id: "11111111-1111-4111-8111-111111111111", title: "Existing card", summary: null, html: "<p>Hello</p>", background: "#ffffff", surface: "landing", page: "home", section: "middle",
  layout: "card", tone: "sky", position: 0, showTitle: true, pinned: false, device: "all", language: "all", ctaLabel: null, ctaUrl: null, tags: ["react"], views: 5, version: 1, status: "published", audience: "everyone", startsAt: null, endsAt: null, sourceFileId: null,
  createdAt: "2026-10-18T10:00:00Z", updatedAt: "2026-10-18T10:00:00Z",
};
const page = { id: "22222222-2222-4222-8222-222222222222", slug: "deep-dives", title: "Deep dives", description: null, icon: "Brain", position: 0, visible: true, createdAt: "2026-10-18T10:00:00Z", updatedAt: "2026-10-18T10:00:00Z" };

describe("placement catalog", () => {
  it("adds custom pages to the Learning Dashboard page list", () => {
    expect(surfacePages("dashboard", [page]).at(-1)).toEqual({ value: "learn:deep-dives", label: "Deep dives (your page)", group: "custom" });
    expect(surfacePages("sign_in")).toEqual([{ value: "sign-in", label: "Sign in" }]);
    expect(SECTIONS.landing.map(s => s.value)).toContain("before-plans");
  });
  it("makes URL-safe slugs and resolves where a placement is visible", () => {
    expect(slugify("  Weekly Deep-Dives: React!  ")).toBe("weekly-deep-dives-react");
    expect(placementHref("dashboard", "learn:deep-dives")).toBe("/dashboard/learn/deep-dives");
    expect(placementHref("dashboard", "techy")).toBe("/dashboard/techy");
    expect(placementHref("sign_up", "sign-up")).toBe("/sign-up");
  });
});

describe("SuperAdminUploadLearning", () => {
  beforeEach(() => {
    localStorage.setItem(`masterclass:admin-notepad:${USER}`, JSON.stringify(notepad));
    global.fetch = jest.fn().mockImplementation((_url: string, init?: RequestInit) => Promise.resolve({
      ok: true, status: init?.method === "POST" ? 201 : 200,
      json: async () => init?.method === "POST" ? { upload } : { uploads: [upload], pages: [page] },
    }));
  });
  afterEach(() => localStorage.clear());

  it("lists saved Notepad files, previews one and publishes it sanitised to the chosen placement", async () => {
    render(<SuperAdminUploadLearning userId={USER} />);
    const files = await screen.findByRole("list", { name: "Notepad files" });
    expect(within(files).getAllByRole("button")).toHaveLength(1); // the empty draft is left out
    fireEvent.click(within(files).getByRole("button", { name: /react hooks cheat sheet/i }));
    expect(screen.getByLabelText("Title")).toHaveValue("React hooks cheat sheet");
    expect(await screen.findByRole("heading", { name: "Hooks" })).toBeInTheDocument(); // live preview
    fireEvent.click(screen.getByRole("button", { name: /publish now/i }));
    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.some(([, init]) => init?.method === "POST")).toBe(true));
    const [, init] = (global.fetch as jest.Mock).mock.calls.find(([, i]) => i?.method === "POST");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ title: "React hooks cheat sheet", surface: "dashboard", page: "dashboard", section: "top", status: "published", sourceFileId: "f1", background: "#eff6ff" });
    expect(body.html).not.toContain("<script");
    expect(await screen.findByText(/Published: “React hooks cheat sheet”/)).toBeInTheDocument();
  });

  it("shows uploads with their placement and custom pages", async () => {
    render(<SuperAdminUploadLearning userId={USER} />);
    fireEvent.click(await screen.findByRole("tab", { name: /library/i }));
    expect(screen.getByText("Existing card")).toBeInTheDocument();
    expect(screen.getByText(/Landing page › Home page › Middle/)).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /learning pages/i }));
    expect(screen.getByText(/\/dashboard\/learn\/deep-dives/)).toBeInTheDocument();
  });

  it("selects uploads and applies one change to all of them", async () => {
    render(<SuperAdminUploadLearning userId={USER} />);
    fireEvent.click(await screen.findByRole("tab", { name: /library/i }));
    fireEvent.click(screen.getByLabelText("Select Existing card"));
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.some(([, init]) => init?.method === "PATCH")).toBe(true));
    const [, init] = (global.fetch as jest.Mock).mock.calls.find(([, i]) => i?.method === "PATCH");
    expect(JSON.parse(init.body)).toEqual({ ids: [upload.id], changes: { status: "hidden" } });
  });

  it("places content by clicking a section on the page picture", async () => {
    render(<SuperAdminUploadLearning userId={USER} />);
    fireEvent.click(await screen.findByRole("radio", { name: /landing page/i }));
    const picture = screen.getByRole("radiogroup", { name: "Section of the page" });
    expect(within(picture).getByText("Navigation bar")).toBeInTheDocument();
    fireEvent.click(within(picture).getByRole("radio", { name: /just before plans/i }));
    expect(within(picture).getByRole("radio", { name: /just before plans/i })).toHaveAttribute("aria-checked", "true");
  });

  it("explains a missing migration", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: "migration_required" }) });
    render(<SuperAdminUploadLearning userId={USER} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/0029_learning_uploads\.sql/);
  });
});

describe("LearningSlot", () => {
  it("renders only its section's published blocks, sanitised", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ blocks: [
      { ...upload, id: "a", title: "Shown", section: "top", html: '<p>Safe</p><img src="x" onerror="alert(1)">' },
      { ...upload, id: "b", title: "Other section", section: "bottom" },
    ] }) });
    const { container } = render(<LearningSlot surface="dashboard" page="techy" section="top" />);
    expect(await screen.findByRole("heading", { name: "Shown" })).toBeInTheDocument();
    expect(screen.queryByText("Other section")).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain("onerror");
  });
  it("renders the fallback when the section is empty", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ blocks: [] }) });
    render(<LearningSlot surface="dashboard" page="learn:empty" section="main" fallback={<p>Nothing yet</p>} />);
    expect(await screen.findByText("Nothing yet")).toBeInTheDocument();
  });
});
