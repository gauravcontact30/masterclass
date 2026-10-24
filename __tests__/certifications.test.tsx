import { fireEvent, render, screen, within } from "@testing-library/react";
import { Certifications } from "@/components/certifications";
import { LandingCertifications } from "@/components/landing-certifications";
import { CERTIFICATION_TRACKS } from "@/lib/certifications";
import type { StepContent, TrackContent } from "@/lib/certification-content-types";

const step = (n: number): StepContent => ({
  overview: `Overview of step ${n}`, objectives: ["Explain the idea"], concepts: [{ term: `Concept ${n}`, explanation: "What it means." }],
  keyFacts: ["Default port is 443"], example: { caption: "Example", language: "bash", code: "echo hi" }, pitfalls: ["Forgetting MFA"],
  workflow: { title: `Flow ${n}`, steps: [{ label: "Plan", detail: "Decide." }, { label: "Build", detail: "Make it." }] }, icons: ["brand:python", "aws:Amazon S3|Storage & Backup"], image: null,
  objective: [{ question: `Which option is right in step ${n}?`, options: ["Wrong one", "Right one", "Wrong two", "Wrong three"], answer: 1, explanation: "Because it is right.", difficulty: "easy" }],
  subjective: [{ question: `Explain step ${n}.`, answer: "A model answer.", keyPoints: ["Point one"], difficulty: "medium" }],
});
const content = (steps: number): TrackContent => ({ track: "aws", generatedAt: "", model: "", source: null, steps: Array.from({ length: steps }, (_, at) => step(at + 1)) });

describe("Certifications", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })) as jest.Mock;
  });

  it("covers the nine requested tracks, each with certificates and a full path", () => {
    expect(CERTIFICATION_TRACKS.map(track => track.id)).toEqual(["system-design", "claude-code", "aws", "n8n", "agentic-ai", "langchain-python", "devops", "cloud-architecture", "ai-automation-langchain"]);
    expect(CERTIFICATION_TRACKS.filter(track => track.isNew).map(track => track.category)).toEqual(["Cloud & Infrastructure", "Cloud & Infrastructure", "AI & Automation"]);
    for (const track of CERTIFICATION_TRACKS) {
      expect(track.certificates.length).toBeGreaterThan(0);
      expect(track.steps.length).toBeGreaterThanOrEqual(5);
      for (const step of track.steps) { expect(step.learn.length).toBeGreaterThan(0); expect(step.practice).not.toBe(""); expect(step.checkpoint).not.toBe(""); }
    }
  });

  it("keeps the landing cards in step with the dashboard paths", () => {
    const { container } = render(<LandingCertifications />);
    const section = container.querySelector("section#certifications")!;
    expect(section.querySelector("h2")?.id).toBe("certifications-title");
    const slides = within(section as HTMLElement).getAllByRole("article", { hidden: true });
    expect(slides).toHaveLength(CERTIFICATION_TRACKS.length);
    CERTIFICATION_TRACKS.forEach((track, at) => {
      expect(slides[at].querySelector("a")?.getAttribute("href")).toBe(`/sign-in?redirect=${encodeURIComponent(`/dashboard/certifications?track=${track.id}`)}`);
      expect(slides[at].textContent).toContain(`${track.steps.length} steps`);
    });
  });

  it("opens the requested track and remembers ticked steps", () => {
    const { unmount } = render(<Certifications initialTrack="aws" />);
    expect(screen.getByRole("heading", { level: 2, name: "AWS certifications" })).toBeInTheDocument();
    expect(screen.getByText("CLF-C02")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Official page/ })).toBeNull();
    fireEvent.click(screen.getByLabelText("Mark step 1 as done"));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(Math.round(100 / 7)));
    unmount();
    render(<Certifications initialTrack="aws" />);
    expect(screen.getByLabelText("Mark step 1 as done")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: /^n8n automation/i }));
    expect(screen.getByRole("heading", { level: 2, name: "n8n automation" })).toBeInTheDocument();
  });

  it("teaches each step and quizzes it from the generated material", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => content(7) })) as jest.Mock;
    render(<Certifications initialTrack="aws" />);
    expect(await screen.findByText("Overview of step 1")).toBeInTheDocument();
    expect(screen.getAllByText("Python")).toHaveLength(7);
    expect(screen.getAllByText("S3")).toHaveLength(7);
    expect(screen.getByText(/14 questions with answers/)).toBeInTheDocument();
    const study = within(screen.getByRole("tablist", { name: "Step 1 study material" }).parentElement as HTMLElement);
    fireEvent.click(study.getByRole("tab", { name: /Objective questions/ }));
    fireEvent.click(study.getByRole("button", { name: /Wrong one/ }));
    expect(study.getByText(/Answer: B\./)).toBeInTheDocument();
    expect(study.getByText("0 of 1 correct")).toBeInTheDocument();
    fireEvent.click(study.getByRole("tab", { name: /Subjective questions/ }));
    fireEvent.click(study.getByRole("button", { name: "Show model answer" }));
    expect(study.getByText("A model answer.")).toBeInTheDocument();
  });

  it("shows each step's sample project and question code in the Apple-style editor", async () => {
    const withProject = content(7);
    withProject.steps[0] = {
      ...withProject.steps[0],
      project: { title: "orders-api", summary: "A small orders API.", run: "npm install\nnpm start", files: [{ path: "README.md", code: "# Orders" }, { path: "src/server.ts", code: "export const port = 3000;" }, { path: "infra/main.tf", code: "resource \"aws_s3_bucket\" \"b\" {}" }] },
      objective: [{ ...withProject.steps[0].objective[0], code: { language: "python", code: "print('hi')" } }],
    };
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => withProject })) as jest.Mock;
    render(<Certifications initialTrack="aws" />);
    const project = await screen.findByRole("region", { name: "Sample project orders-api" });
    const tabs = within(project).getAllByRole("tab").map(tab => tab.textContent);
    expect(tabs.join(" ")).toMatch(/README\.md.*server\.ts.*main\.tf|main\.tf/);
    expect(within(project).getByRole("tab", { selected: true })).toHaveTextContent("server.ts");
    expect(within(project).getByText(/npm install/)).toBeInTheDocument();
    const study = within(screen.getByRole("tablist", { name: "Step 1 study material" }).parentElement as HTMLElement);
    fireEvent.click(study.getByRole("tab", { name: /Objective questions/ }));
    expect(study.getByRole("figure", { name: "Code in this question" })).toBeInTheDocument();
  });

  it("revises a step for the exam: choices, cues, a worked scenario, cheat sheet and a self-check", async () => {
    const revised = content(7);
    revised.steps[0] = { ...revised.steps[0], revision: {
      examFocus: "Domain 2 scenario questions.", compare: [{ a: "S3", b: "EBS", difference: "Object vs block.", chooseA: "Static files.", chooseB: "A boot volume." }],
      cues: [{ cue: "lowest operational overhead", pick: "A managed service", why: "No servers to run." }],
      scenario: { situation: "A team needs durable storage.", reasoning: ["Drop EC2 disks."], answer: "Use S3." },
      memoryAids: ["S3 = Simple Storage"], cheatSheet: ["Root needs MFA"], selfCheck: ["I can pick S3 or EBS", "I can secure root"],
    } };
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => revised })) as jest.Mock;
    render(<Certifications initialTrack="aws" />);
    await screen.findByText("Overview of step 1");
    expect(within(screen.getByRole("tablist", { name: "Step 2 study material" })).queryByRole("tab", { name: /Exam revision/ })).toBeNull();
    const study = within(screen.getByRole("tablist", { name: "Step 1 study material" }).parentElement as HTMLElement);
    fireEvent.click(study.getByRole("tab", { name: /Exam revision/ }));
    expect(study.getByRole("region", { name: "S3 or EBS" })).toHaveTextContent("Pick EBSA boot volume.");
    expect(study.getByText("lowest operational overhead")).toBeInTheDocument();
    expect(study.getByRole("region", { name: "Worked exam scenario" })).toHaveTextContent("Use S3.");
    fireEvent.click(study.getByLabelText("I can pick S3 or EBS"));
    fireEvent.click(study.getByLabelText("I can secure root"));
    expect(study.getByText(/Step 1 is exam-ready/)).toBeInTheDocument();
  });

  it("runs a scored mock exam across the track", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => content(7) })) as jest.Mock;
    render(<Certifications initialTrack="aws" />);
    fireEvent.click(await screen.findByRole("button", { name: "Start mock exam" }));
    for (let at = 0; at < 7; at++) fireEvent.click(within(screen.getByRole("group", { name: "Options" })).getByRole("button", { name: /Right one/ }));
    expect(screen.getByRole("heading", { name: /Passed · 100%/ })).toBeInTheDocument();
  });

  it("filters paths by area and searches titles, certificates and exam codes", () => {
    render(<Certifications />);
    expect(screen.getByRole("heading", { level: 3, name: /Cloud & Infrastructure/ })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("group", { name: "Filter paths by area" })).getByRole("button", { name: /AI & Automation/ }));
    expect(screen.queryByRole("button", { name: /^DevOps engineering/ })).toBeNull();
    expect(screen.getByRole("button", { name: /^AI Automation with LangChain/ })).toHaveTextContent("New");
    fireEvent.click(within(screen.getByRole("group", { name: "Filter paths by area" })).getByRole("button", { name: /^All/ }));
    const search = screen.getByLabelText("Search paths, certificates and exam codes");
    fireEvent.change(search, { target: { value: "ckad" } });
    expect(screen.getByText("1 path shown")).toHaveAttribute("role", "status");
    fireEvent.click(screen.getByRole("button", { name: /^DevOps engineering/ }));
    expect(screen.getByRole("heading", { level: 2, name: "DevOps engineering" })).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "no such exam" } });
    expect(screen.getByText(/No path matches/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all paths" }));
    expect(screen.getByText(`${CERTIFICATION_TRACKS.length} paths shown`)).toBeInTheDocument();
  });

  it("expands and collapses every step of the path", () => {
    const { container } = render(<Certifications initialTrack="cloud-architecture" />);
    const open = () => container.querySelectorAll("li[id^='cert-step-'] > details[open]").length;
    expect(open()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(open()).toBe(12);
    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(open()).toBe(0);
  });

  it("explains when a track's material is still being prepared", async () => {
    render(<Certifications initialTrack="n8n" />);
    expect(await screen.findByText(/being prepared/)).toBeInTheDocument();
  });
});
