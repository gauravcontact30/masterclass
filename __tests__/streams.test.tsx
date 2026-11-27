import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { LandingStreams } from "@/components/landing-streams";
import { StreamsDashboard } from "@/components/streams-dashboard";
import { StreamsHub } from "@/components/streams-hub";
import { StreamsSidebarNav } from "@/components/streams-sidebar-nav";
import { filterSteps, landingTechs, NO_FILTERS, playlist, quality, SAMPLE_STEPS, STREAM_COURSES, STREAM_TECHS, streamsHref, suggest, techInfo, techsIn, visibleGroups } from "@/lib/streams";
import { STREAM_VIDEOS } from "@/lib/streams-videos";
import { LESSON_TITLES } from "@/lib/streams-titles";
import { STREAM_SOURCES } from "@/lib/server/stream-sources";
import { readFileSync } from "node:fs";

let india = false;
jest.mock("@/components/audience-provider", () => ({ ...jest.requireActual("@/components/audience-provider"), useIndiaAccess: () => india }));
jest.mock("next/navigation", () => ({ ...jest.requireActual("next/navigation"), useSearchParams: () => new URLSearchParams(window.location.search), useRouter: () => ({ push: jest.fn() }) }));
/** The server, as the browser sees it: a signed-out visitor. The first step of a course plays; any other is refused (401). */
const FREE_SRC = "https://www.youtube-nocookie.com/embed/test?autoplay=1";
const FIRST_STEPS = new Set(techsIn(["tech", "board", "exams", "ielts"]).map(t => playlist(t).steps[0].id as string));
const reply = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
const fetchMock = jest.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
  const url = new URL(String(input), "http://localhost");
  if (url.pathname === "/api/streams/access") return reply({ signedIn: false, member: { tech: false, board: false, exams: false, ielts: false } });
  return FIRST_STEPS.has(url.searchParams.get("step") ?? "") ? reply({ src: FREE_SRC, free: true }) : reply({ error: "signin_required" }, 401);
});
beforeEach(() => { india = false; window.localStorage.clear(); window.history.replaceState(null, "", "/learning/streams"); global.fetch = fetchMock as unknown as typeof fetch; });

const TECH_CHANNEL: Record<string, string[]> = { nextjs: ["Vercel"], react: ["React Conf"], langchain: ["LangChain"], langgraph: ["LangChain"], langsmith: ["LangChain"], langserve: ["LangChain"], langflow: ["Langflow"],
  n8n: ["n8n"], aws: ["Amazon Web Services", "AWS Events"], sysdesign: ["ByteByteGo"] };
/** Nothing learners see may name the video host, a channel, an event or a speaker. */
const THIRD_PARTY = /youtube|youtu\.be|ytimg|re:invent|re:inforce|react conf|vercel ship \d|langchain academy|bytebytego|aws events|lydia|abramov|garman|vogels|\(\d+\/\d+\)|\b[A-Z]{3}\d{3}\b/i;
const EVERYONE = techsIn(visibleGroups(false));

test("four categories of step-by-step playlists; every step is a measured video of 1080p or more with our own title and notes", () => {
  // Topic-led tech playlists appear once their topics have verified videos.
  expect(techsIn(["tech"]).slice(0, 10)).toEqual(["nextjs", "react", "langchain", "langgraph", "langsmith", "langflow", "langserve", "n8n", "aws", "sysdesign"]);
  for (const id of techsIn(["tech"]).slice(10)) expect(["typescript", "testing", "tanstack", "zustand", "playwright", "fastapi", "python", "nestjs", "modernjs", "devops-aws"]).toContain(id);
  for (const id of ["board10-maths", "board10-physics", "board10-chemistry", "board10-english", "board12-maths", "board12-physics", "board12-chemistry", "board12-english",
    "icse10-maths", "icse10-physics", "icse10-chemistry", "icse10-english", "isc12-maths", "isc12-physics", "isc12-chemistry", "isc12-english"]) expect(techInfo(id as never).group).toBe("board");
  for (const id of ["upsc", "ias", "pcs", "ssc", "nda", "bankpo", "railways", "police", "cbi", "incometax", "ctet", "ca"]) expect(techsIn(["exams"])).toContain(id);
  expect(techsIn(["ielts"])).toEqual(["ielts"]);
  const ids = STREAM_COURSES.flatMap(c => c.lessons.map(l => l.id));
  expect(new Set(ids).size).toBe(ids.length);
  expect([...ids].sort()).toEqual(Object.keys(STREAM_VIDEOS).sort());
  expect(ids.length).toBeGreaterThanOrEqual(400);
  // A playlist whose topics have no verified video yet has no steps and is not shown (techsIn).
  for (const tech of STREAM_TECHS.filter(t => playlist(t.id).steps.length > 0)) {
    const p = playlist(tech.id);
    expect(p.steps.map(s => s.step)).toEqual(p.steps.map((_, i) => i + 1));
    expect(p.steps.length).toBeGreaterThan(SAMPLE_STEPS);
    expect(`${tech.playlist} ${tech.tagline}`).not.toMatch(THIRD_PARTY);
    for (const s of p.steps) {
      expect(s.title).toBeTruthy();
      expect(s.title).not.toMatch(THIRD_PARTY);
      expect(s.points.join(" ")).not.toMatch(THIRD_PARTY);
      expect(s.points.length).toBeGreaterThanOrEqual(3);
      expect(STREAM_VIDEOS[s.id].maxHeight).toBeGreaterThanOrEqual(1080);
      // Hand-picked tech steps come from the official channel and carry our own title; topic-led steps (lib/streams-topics.ts) name the topic.
      if (tech.group === "tech" && LESSON_TITLES[s.id]) { expect(TECH_CHANNEL[tech.id]).toContain(STREAM_SOURCES[s.id].channel); expect(LESSON_TITLES[s.id]).toBe(s.title); }
    }
  }
  for (const c of STREAM_COURSES) expect(`${c.title} ${c.summary} ${c.note ?? ""}`).not.toMatch(THIRD_PARTY);
  expect(STREAM_TECHS.find(t => t.id === "langserve")!.status).toMatch(/deprecated since 18 November 2024/);
});

test("exam playlists show only with exam access; IELTS and Tech show for everyone", () => {
  expect(visibleGroups(false)).toEqual(["tech", "ielts"]);
  expect(visibleGroups(true)).toEqual(["tech", "board", "exams", "ielts"]);
  expect(landingTechs(false)).toEqual(["nextjs", "react", "ielts"]);
  expect(landingTechs(true)).toEqual(["board10-maths", "bankpo", "nextjs"]);
});

test("quality labels, suggestions and filters work on steps", () => {
  expect(quality("mcbao7wnR095g")).toBe("4K");
  expect(quality("mcbwztC8SRMcR")).toBe("1080p");
  expect(suggest("kafka", techsIn(["tech"])).some(s => s.kind === "lesson" && s.tech === "sysdesign")).toBe(true);
  expect(suggest("trigonometry", techsIn(["board", "exams"])).some(s => s.tech === "board10-maths")).toBe(true);
  expect(suggest("kafka", landingTechs(false))).toEqual([]); // the landing page searches only its three playlists
  expect(filterSteps(playlist("n8n").steps, "", { ...NO_FILTERS, quality: "4K" }).every(s => quality(s.id) === "4K")).toBe(true);
  expect(filterSteps(playlist("react").steps, "", { ...NO_FILTERS, samples: true })).toHaveLength(SAMPLE_STEPS);
  // The browser never holds a video's own id: client data files carry opaque step ids only.
  const clientData = ["lib/streams.ts", "lib/streams-videos.ts", "lib/streams-titles.ts", "lib/streams-exam-videos.ts", "lib/streams-exams.ts"].map(file => readFileSync(file, "utf8")).join("\n");
  expect(Object.values(STREAM_SOURCES).filter(source => clientData.includes(source.video))).toEqual([]);
});

test("landing: MCB covers, no third-party names or images, and the player only on play, from the server", async () => {
  const { container } = render(<LandingStreams />);
  expect(container.querySelector("img")).toBeNull(); // covers are drawn, not downloaded
  expect(container.textContent).not.toMatch(THIRD_PARTY);
  expect(container.querySelectorAll("a[href*='youtube']")).toHaveLength(0);
  expect(screen.getAllByText("MCB").length).toBeGreaterThan(3);
  expect(screen.getByRole("link", { name: /Explore every MCB course/ })).toHaveAttribute("href", "/streams");
  expect(container.querySelector("iframe")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /^Play: Next\.js 16: the big picture/ }));
  await waitFor(() => expect(container.querySelector("iframe")?.getAttribute("src")).toBe(FREE_SRC));
  expect(container.querySelector("iframe")!.getAttribute("title")).toBe("Next.js 16: the big picture");
  expect(fetchMock).toHaveBeenCalledWith(`/api/streams/play?step=${playlist("nextjs").steps[0].id}`, expect.anything());
});

test("landing: the course library pages through every course, by category and by search", () => {
  india = true;
  render(<LandingStreams />);
  const all = techsIn(visibleGroups(true));
  const cards = () => screen.getAllByRole("button").filter(b => / steps$/.test(b.getAttribute("aria-label") ?? ""));
  expect(cards()).toHaveLength(8);
  fireEvent.click(screen.getByRole("button", { name: "Courses page 2" }));
  expect(cards()[0]).toHaveAttribute("aria-label", `${playlist(all[8]).info.playlist}: ${playlist(all[8]).steps.length} steps`);
  fireEvent.click(screen.getByRole("button", { name: /^Board Exams/ }));
  expect(cards()).toHaveLength(Math.min(8, techsIn(["board"]).length));
  fireEvent.change(screen.getByRole("searchbox", { name: "Find a course" }), { target: { value: "physics" } });
  expect(cards().map(b => b.getAttribute("aria-label"))).toEqual(techsIn(["board"]).filter(id => /physics/.test(id)).slice(0, 8).map(id => `${playlist(id).info.playlist}: ${playlist(id).steps.length} steps`));
});

test("landing: complete courses in pages, each with three sample steps that play here and the rest on /streams", () => {
  render(<LandingStreams />);
  const sections = () => screen.getAllByRole("heading", { level: 3 }).filter(h => h.id.startsWith("course-title-"));
  expect(sections().map(h => h.id)).toEqual(landingTechs(false).map(t => `course-title-${t}`));
  const react = playlist("react").steps;
  const row = screen.getByRole("list", { name: `${playlist("react").info.playlist}: sample steps` });
  expect(within(row).getAllByRole("button")).toHaveLength(SAMPLE_STEPS);
  expect(within(row).getByRole("link", { name: new RegExp(`^${react.length - SAMPLE_STEPS} more steps`) })).toHaveAttribute("href", `/streams?playlist=react&step=${react[SAMPLE_STEPS].id}`);
  fireEvent.click(within(row).getByRole("button", { name: `Step 2: ${react[1].title}` }));
  expect(screen.getByRole("heading", { level: 3, name: react[1].title })).toBeInTheDocument();
  // Numbered pages, not a sideways scroll: page 2 shows the next three courses.
  const ordered = [...new Set([...landingTechs(false), ...techsIn(visibleGroups(false))])];
  fireEvent.click(screen.getByRole("button", { name: "Complete courses page 2" }));
  expect(sections().map(h => h.id)).toEqual(ordered.slice(3, 6).map(t => `course-title-${t}`));
});

test("landing: choosing a course in the library puts its section first and its first step in the player", () => {
  render(<LandingStreams />);
  fireEvent.change(screen.getByRole("searchbox", { name: "Find a course" }), { target: { value: "system design" } });
  fireEvent.click(screen.getByRole("button", { name: `${playlist("sysdesign").info.playlist}: ${playlist("sysdesign").steps.length} steps` }));
  expect(screen.getAllByRole("heading", { level: 3 }).filter(h => h.id.startsWith("course-title-"))[0]).toHaveAttribute("id", "course-title-sysdesign");
  expect(screen.getByRole("button", { name: new RegExp(`^Play: ${playlist("sysdesign").steps[0].title}`) })).toBeInTheDocument();
});

test("dashboard: playlists by category, a playlist page, a step with next and progress, and continue watching", () => {
  const first = render(<StreamsDashboard />);
  expect(within(screen.getByRole("list", { name: "Tech" })).getAllByRole("button")).toHaveLength(techsIn(["tech"]).length);
  expect(screen.queryByRole("list", { name: "Board Exams" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /LangServe: legacy APIs and migration/ }));
  expect(screen.getByText(/deprecated since 18 November 2024/)).toBeInTheDocument();
  expect(window.location.search).toBe("?tech=langserve");
  first.unmount();

  const langgraph = playlist("langgraph").steps;
  const view = render(<StreamsDashboard initialTech="langgraph" initialLesson={langgraph[2].id} />);
  expect(screen.getByRole("heading", { name: langgraph[2].title })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Next step/ }));
  expect(screen.getByRole("heading", { name: langgraph[3].title })).toBeInTheDocument();
  expect(window.location.search).toBe(`?tech=langgraph&lesson=${langgraph[3].id}`);
  expect(JSON.parse(window.localStorage.getItem("mc:streams:progress:v1")!).done).toEqual({ [langgraph[2].id]: true });
  expect(view.container.textContent).not.toMatch(THIRD_PARTY);
  view.unmount();

  render(<StreamsDashboard />);
  expect(within(screen.getByRole("button", { name: /Continue watching/ })).getAllByText(langgraph[3].title).length).toBeGreaterThan(0);
});

test("dashboard: with exam access, a Board Exams category and its playlists", () => {
  india = true;
  render(<StreamsDashboard initialGroup="board" />);
  expect(within(screen.getByRole("list", { name: "Board Exams" })).getAllByRole("button")).toHaveLength(techsIn(["board"]).length);
  expect(screen.queryByRole("list", { name: "Tech" })).toBeNull();
});

test("dashboard: icon filters narrow a playlist's steps", () => {
  render(<StreamsDashboard initialTech="n8n" />);
  fireEvent.click(screen.getByRole("button", { name: "4K Ultra HD" }));
  const uhd = playlist("n8n").steps.filter(s => quality(s.id) === "4K").length;
  expect(screen.getByText(`Showing 1–${uhd} of ${uhd} steps`)).toBeInTheDocument();
});

test("sidebar: categories, with the open playlist's category listed and the open playlist marked", () => {
  window.history.replaceState(null, "", `/learning/streams?tech=aws`);
  render(<StreamsSidebarNav />);
  expect(screen.getByRole("link", { name: /^Tech/ })).toHaveAttribute("href", "/learning/streams?group=tech");
  expect(screen.getByRole("link", { current: "page" })).toHaveAttribute("href", streamsHref("aws"));
  expect(screen.queryByRole("link", { name: /Board Exams/ })).toBeNull();
});

test("/streams: categories as separate sections; a course whose first step is free and the rest for members", async () => {
  window.history.replaceState(null, "", "/streams");
  const { container } = render(<StreamsHub />);
  expect(screen.getByRole("heading", { level: 2, name: "Tech" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "IELTS" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { level: 2, name: "Board Exams" })).toBeNull();
  expect(container.textContent).not.toMatch(THIRD_PARTY);
  fireEvent.click(screen.getByRole("button", { name: /^IELTS: all four skills/ }));
  expect(window.location.search).toBe("?playlist=ielts");
  expect(screen.getByRole("heading", { level: 1, name: playlist("ielts").info.playlist })).toBeInTheDocument();
  expect(EVERYONE).toContain("ielts");
  const steps = playlist("ielts").steps;
  // A step past the samples plays here too.
  fireEvent.click(screen.getByRole("button", { name: `Step 5: ${steps[4].title}` }));
  expect(screen.getByRole("heading", { level: 2, name: steps[4].title })).toBeInTheDocument();
  expect(window.location.search).toBe(`?playlist=ielts&step=${steps[4].id}`);
  // Only the first step is free: the server refuses step 5 for a signed-out visitor, and the player says how to continue.
  const { container: page } = { container: document.body };
  await waitFor(() => expect(page.querySelector("iframe")).toBeNull());
  expect(await screen.findByText("Sign in to keep watching")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", `/sign-in?redirect=${encodeURIComponent(`/streams?playlist=ielts&step=${steps[4].id}`)}`);
  expect(screen.getByRole("link", { name: "See membership plans" })).toHaveAttribute("href", "/subscribe");
  fireEvent.click(screen.getByRole("button", { name: "Next step" }));
  expect(screen.getByRole("heading", { level: 2, name: steps[5].title })).toBeInTheDocument();
  // Every step, by chapter, in pages of eight.
  fireEvent.click(screen.getByRole("button", { name: "Steps page 2" }));
  expect(screen.getByRole("button", { name: `Step 9: ${steps[8].title}` })).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole("group", { name: "Chapters" })).getByRole("button", { name: /Speaking/ }));
  expect(screen.queryByRole("navigation", { name: "Step pages" })).toBeNull();
});

test("the pager shows the first, last and nearby pages, with gaps", async () => {
  const { pageWindow } = await import("@/components/streams-explorer");
  expect(pageWindow(0, 5)).toEqual([0, 1, 2, 3, 4]);
  expect(pageWindow(0, 10)).toEqual([0, 1, 2, 3, -1, 9]);
  expect(pageWindow(5, 10)).toEqual([0, -1, 4, 5, 6, -1, 9]);
  expect(pageWindow(9, 10)).toEqual([0, -1, 6, 7, 8, 9]);
});
