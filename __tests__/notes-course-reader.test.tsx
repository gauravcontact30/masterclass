import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NotesCourseReader } from "@/components/notes-course-reader";
import { TopicCard } from "@/components/notes-explorer";
import { getStudyNote, NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";

const course = getStudyNote("claude-ai-concepts")!;
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test("AWS AI services card opens its modal and loads a voice-agent lesson", async () => {
  global.fetch = jest.fn(async (url: string | URL | Request) => ({ ok: true, json: async () => ({ note: getStudyNote(String(url).split("/").pop()!) }) } as Response));
  render(<TopicCard note={NOTES_SUMMARIES.find(note => note.id === "aws-ai-services-course")!} />);
  fireEvent.click(screen.getByRole("button", { name: "Learn in App" }));
  expect(await screen.findByRole("dialog", { name: "AWS AI services" })).toBeVisible();
  fireEvent.change(await screen.findByRole("combobox", { name: "Filter course category" }), { target: { value: "Generative AI & Foundation Models" } });
  fireEvent.change(screen.getByRole("searchbox", { name: "Search course lessons" }), { target: { value: "WebRTC" } });
  const chapter = getStudyNote("aws-ai-services-course")!.contents!.find(item => item.title.includes("WebRTC"))!;
  fireEvent.click(screen.getByRole("button", { name: `Read ${chapter.title}` }));
  expect(await screen.findByRole("heading", { name: chapter.title })).toBeVisible();
  expect(global.fetch).toHaveBeenCalledWith(`/api/notes/${chapter.id}`, expect.anything());
});

test("JavaScript ES2026 card opens its modal and loads a browser API lesson", async () => {
  global.fetch = jest.fn(async (url: string | URL | Request) => ({ ok: true, json: async () => ({ note: getStudyNote(String(url).split("/").pop()!) }) } as Response));
  render(<TopicCard note={NOTES_SUMMARIES.find(note => note.id === "javascript-es2026-course")!} />);
  fireEvent.click(screen.getByRole("button", { name: "Learn in App" }));
  expect(await screen.findByRole("dialog", { name: "JavaScript ES2026" })).toBeVisible();
  fireEvent.change(await screen.findByRole("combobox", { name: "Filter course category" }), { target: { value: "DOM & Browser APIs" } });
  fireEvent.change(screen.getByRole("searchbox", { name: "Search course lessons" }), { target: { value: "Intersection" } });
  const chapter = getStudyNote("javascript-es2026-course")!.contents!.find(item => item.title === "Intersection Observer API")!;
  fireEvent.click(screen.getByRole("button", { name: `Read ${chapter.title}` }));
  expect(await screen.findByRole("heading", { name: chapter.title })).toBeVisible();
  expect(global.fetch).toHaveBeenCalledWith(`/api/notes/${chapter.id}`, expect.anything());
});

test("TypeScript 7 card opens its modal and loads a utility-types lesson", async () => {
  global.fetch = jest.fn(async (url: string | URL | Request) => ({ ok: true, json: async () => ({ note: getStudyNote(String(url).split("/").pop()!) }) } as Response));
  render(<TopicCard note={NOTES_SUMMARIES.find(note => note.id === "typescript-7-course")!} />);
  fireEvent.click(screen.getByRole("button", { name: "Learn in App" }));
  expect(await screen.findByRole("dialog", { name: "TypeScript 7" })).toBeVisible();
  fireEvent.change(await screen.findByRole("combobox", { name: "Filter course category" }), { target: { value: "Utility Types" } });
  fireEvent.change(screen.getByRole("searchbox", { name: "Search course lessons" }), { target: { value: "Awaited" } });
  const chapter = getStudyNote("typescript-7-course")!.contents!.find(item => item.title.includes("Awaited<T>"))!;
  fireEvent.click(screen.getByRole("button", { name: `Read ${chapter.title}` }));
  expect(await screen.findByRole("heading", { name: chapter.title })).toBeVisible();
  expect(global.fetch).toHaveBeenCalledWith(`/api/notes/${chapter.id}`, expect.anything());
});

test("Node.js modal filters and opens an advanced lesson from the expanded course", async () => {
  global.fetch = jest.fn(async (url: string | URL | Request) => ({ ok: true, json: async () => ({ note: getStudyNote(String(url).split("/").pop()!) }) } as Response));
  render(<TopicCard note={NOTES_SUMMARIES.find(note => note.id === "node-course")!} />);
  fireEvent.click(screen.getByRole("button", { name: "Learn in App" }));
  const category = await screen.findByRole("combobox", { name: "Filter course category" });
  fireEvent.change(category, { target: { value: "Advanced Concepts & Performance" } });
  fireEvent.change(screen.getByRole("searchbox", { name: "Search course lessons" }), { target: { value: "microservices" } });
  const chapter = getStudyNote("node-course")!.contents!.find(item => item.title.startsWith("Microservices architecture"))!;
  fireEvent.click(screen.getByRole("button", { name: `Read ${chapter.title}` }));
  expect(await screen.findByRole("heading", { name: chapter.title })).toBeVisible();
  expect(global.fetch).toHaveBeenCalledWith(`/api/notes/${chapter.id}`, expect.anything());
});

test("GraphQL modal finds and loads incremental delivery within its architecture category", async () => {
  global.fetch = jest.fn(async (url: string | URL | Request) => ({ ok: true, json: async () => ({ note: getStudyNote(String(url).split("/").pop()!) }) } as Response));
  render(<TopicCard note={NOTES_SUMMARIES.find(note => note.id === "graphql-course")!} />);
  fireEvent.click(screen.getByRole("button", { name: "Learn in App" }));
  fireEvent.change(await screen.findByRole("combobox", { name: "Filter course category" }), { target: { value: "Advanced Architecture & Patterns" } });
  fireEvent.change(screen.getByRole("searchbox", { name: "Search course lessons" }), { target: { value: "@defer" } });
  const chapter = getStudyNote("graphql-course")!.contents!.find(item => item.title.includes("@defer"))!;
  fireEvent.click(screen.getByRole("button", { name: `Read ${chapter.title}` }));
  expect(await screen.findByRole("heading", { name: chapter.title })).toBeVisible();
  expect(global.fetch).toHaveBeenCalledWith(`/api/notes/${chapter.id}`, expect.anything());
});

test("Nest JS modal opens with its exact name and loads deployment notes by category", async () => {
  global.fetch = jest.fn(async (url: string | URL | Request) => ({ ok: true, json: async () => ({ note: getStudyNote(String(url).split("/").pop()!) }) } as Response));
  render(<TopicCard note={NOTES_SUMMARIES.find(note => note.id === "nestjs-course")!} />);
  fireEvent.click(screen.getByRole("button", { name: "Learn in App" }));
  expect(await screen.findByRole("dialog", { name: "Nest JS" })).toBeVisible();
  fireEvent.change(await screen.findByRole("combobox", { name: "Filter course category" }), { target: { value: "Devops & Production" } });
  fireEvent.change(screen.getByRole("searchbox", { name: "Search course lessons" }), { target: { value: "dockerization" } });
  const chapter = getStudyNote("nestjs-course")!.contents!.find(item => item.title.startsWith("Dockerization"))!;
  fireEvent.click(screen.getByRole("button", { name: `Read ${chapter.title}` }));
  expect(await screen.findByRole("heading", { name: chapter.title })).toBeVisible();
  expect(global.fetch).toHaveBeenCalledWith(`/api/notes/${chapter.id}`, expect.anything());
});

test("course contents search, filtering, paging, reading and navigation work together", async () => {
  global.fetch = jest.fn(async (url: string | URL | Request) => ({ ok: true, json: async () => ({ note: getStudyNote(String(url).split("/").pop()!) }) } as Response));
  render(<NotesCourseReader contents={course.contents!} renderLesson={note => <p>{note.questions[0].question}</p>} />);
  const contents = within(screen.getByRole("navigation", { name: "Choose a course lesson" }));
  expect(contents.getAllByRole("button")).toHaveLength(8);
  fireEvent.click(screen.getByRole("button", { name: "Next contents page" }));
  expect(contents.queryByRole("button", { name: "Read Artifacts" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox", { name: "Search course lessons" }), { target: { value: "distillation" } });
  fireEvent.click(contents.getByRole("button", { name: "Read Distillation" }));
  await screen.findByText(getStudyNote("ai-fundamentals-concept-distillation")!.questions[0].question);
  fireEvent.click(screen.getByRole("button", { name: "Next lesson", exact: true }));
  await screen.findByText(getStudyNote("ai-fundamentals-concept-quantization")!.questions[0].question);
  fireEvent.click(screen.getByRole("button", { name: "Previous lesson", exact: true }));
  expect(global.fetch).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Clear search & filters" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Filter course category" }), { target: { value: "20 AI Concepts" } });
  expect(contents.getByRole("button", { name: "Read Large Language Model (LLM)" })).toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox", { name: "Search course lessons" }), { target: { value: "no-such-topic" } });
  expect(screen.getByText(/No lessons match/)).toBeInTheDocument();
});

test("failed course lessons can retry", async () => {
  const note = getStudyNote("claude-fundamentals-artifacts")!;
  global.fetch = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ ok: true, json: async () => ({ note }) });
  render(<NotesCourseReader contents={course.contents!} renderLesson={item => <p>{item.description}</p>} />);
  fireEvent.click(screen.getByRole("button", { name: "Read Artifacts" }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Retry lesson" }));
  expect(await screen.findAllByText(note.description)).toHaveLength(2);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test.each(["node-course", "graphql-course", "nestjs-course", "claude-skills-plugins-mcp-course", "zustand-5-course", "tanstack-course", "python-314-path", "claude-ai-concepts", "complete-nextjs-16-path", "nextjs-16-hooks-course", "react-19-hooks-course"])("%s opens a named Learn in App dialog and closes back to the card", async id => {
  const course = getStudyNote(id)!;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ note: course }) });
  render(<TopicCard note={NOTES_SUMMARIES.find(note => note.id === course.id)!} />);
  expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Learn in App" }));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  await screen.findByRole("heading", { name: course.readerTitle!, level: 2 });
  expect(await screen.findByLabelText("Search course lessons")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Official reference" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Back to notes", { exact: false, selector: "button" }));
  await waitFor(() => expect(screen.queryByLabelText("Search course lessons")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Learn in App" })).toBeInTheDocument();
});
