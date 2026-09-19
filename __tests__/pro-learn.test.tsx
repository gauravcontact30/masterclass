import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import lessonsData from "@/lib/pro-learn/lessons.json";
import { INTERVIEW_BANK, PRO_TRACKS, type ProLesson } from "@/lib/pro-learn/types";
import { INTERVIEW_AREAS, TRACK_FAMILIES, groupQuestionsByArea } from "@/lib/pro-learn/families";
import { ProInterview } from "@/components/pro-interview";
import { ProLessons } from "@/components/pro-lessons";
import { ProMentor } from "@/components/pro-mentor";
import { ProQuiz } from "@/components/pro-quiz";
import { ProMarkdown } from "@/components/pro-markdown";
import { SidebarSearch, sidebarSuggestions } from "@/components/sidebar-search";

let mockParams = new URLSearchParams();
const push = jest.fn();
jest.mock("next/navigation", () => ({ useSearchParams: () => mockParams, useRouter: () => ({ push }), usePathname: () => "/dashboard" }));
const lessons = lessonsData as ProLesson[];
const json = (body: unknown, ok = true) => ({ ok, json: async () => body });
beforeEach(() => { window.scrollTo = jest.fn(); Element.prototype.scrollIntoView = jest.fn(); mockParams = new URLSearchParams(); localStorage.clear(); push.mockClear(); });

test("curated data covers every track without external links", () => {
  expect(PRO_TRACKS).toHaveLength(54);
  expect(new Set(PRO_TRACKS.map(track => track.id)).size).toBe(PRO_TRACKS.length);
  for (const lesson of lessons) {
    expect(PRO_TRACKS.some(track => track.id === lesson.track)).toBe(true);
    expect(lesson.sections.length).toBeGreaterThan(0);
  }
  expect(JSON.stringify(PRO_TRACKS)).not.toMatch(/https?:\/\//);
  for (const item of INTERVIEW_BANK) expect(["Easy", "Medium", "Hard"]).toContain(item.lvl);
});

test("lessons filter by level, open a reader and remember completion", async () => {
  const user = userEvent.setup();
  mockParams = new URLSearchParams("track=react");
  render(<ProLessons lessons={lessons} aiReady={false}/>);
  expect(screen.getByRole("heading", { level: 1, name: "React 19+" })).toBeVisible();
  const reactLessons = lessons.filter(lesson => lesson.track === "react");
  await user.click(screen.getByRole("button", { name: "Advanced" }));
  expect(screen.getAllByRole("button", { name: /^(?!Start).*/ }).length).toBeGreaterThan(0);
  await user.click(screen.getByRole("button", { name: "All" }));
  await user.click(screen.getByRole("button", { name: reactLessons[0].title }));
  expect(screen.getByRole("heading", { level: 1, name: reactLessons[0].title })).toBeVisible();
  expect(screen.getByRole("link", { name: "Ask the mentor" })).toHaveAttribute("href", expect.stringContaining("/dashboard/mentors?track=react"));
  await user.click(screen.getByRole("button", { name: "Mark complete" }));
  expect(screen.getByRole("button", { name: "Completed" })).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: "All lessons" }));
  expect(screen.getByText(`1 of ${reactLessons.length} completed`)).toBeVisible();
});

test("quiz reveals the answer, scores and records the attempt", async () => {
  const user = userEvent.setup();
  global.fetch = jest.fn().mockResolvedValue(json({ source: "library", questions: [{ q: "Which hook stores component state?", options: ["useRef", "useState", "useId", "useMemo"], answer: 1, explain: "useState returns a value and a setter that triggers a render.", vocab: [] }] })) as jest.Mock;
  render(<ProQuiz aiReady={false} libraryTracks={["react", "python"]}/>);
  expect(within(screen.getByRole("combobox", { name: "Technology" })).getAllByRole("option")).toHaveLength(2);
  await user.selectOptions(screen.getByRole("combobox", { name: "Technology" }), "react");
  await user.click(screen.getByRole("button", { name: "Start quiz" }));
  expect(await screen.findByRole("heading", { name: "Which hook stores component state?" })).toBeVisible();
  expect(screen.getByText("MasterClass library")).toBeVisible();
  await user.click(screen.getByRole("button", { name: /useState/ }));
  expect(screen.getByText("✓ Correct")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "See results" }));
  expect(screen.getByRole("region", { name: "Your score" })).toHaveTextContent("1/1");
  expect(JSON.parse(localStorage.getItem("masterclass:quiz-history")!)[0]).toMatchObject({ trackId: "react", score: 1, total: 1 });
});

test("quiz shows a readable error when generation fails", async () => {
  global.fetch = jest.fn().mockResolvedValue(json({ error: "ai_unavailable" }, false)) as jest.Mock;
  render(<ProQuiz aiReady libraryTracks={[]}/>);
  await userEvent.setup().click(screen.getByRole("button", { name: "Start quiz" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("need AI generation");
});

test("interview bank filters by company, level and search", async () => {
  const user = userEvent.setup();
  render(<ProInterview aiReady={false}/>);
  await user.click(within(screen.getByRole("group", { name: "Filter by company" })).getByRole("button", { name: "Netflix" }));
  const netflix = INTERVIEW_BANK.filter(item => item.co.includes("Netflix")).length;
  expect(screen.getByText(`${netflix} question${netflix === 1 ? "" : "s"}`)).toBeVisible();
  await user.type(screen.getByRole("searchbox"), "zzz-no-match");
  expect(screen.getByRole("heading", { name: "No questions match these filters" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Reset filters" }));
  expect(screen.getByText(`${INTERVIEW_BANK.length} questions`)).toBeVisible();
});

test("mentor sends the conversation and renders the reply", async () => {
  const user = userEvent.setup();
  global.fetch = jest.fn().mockResolvedValue(json({ source: "ai", answer: "Use **useMemo** for expensive values.\n\n```ts\nconst total = useMemo(() => sum(items), [items]);\n```" })) as jest.Mock;
  mockParams = new URLSearchParams("track=react&q=When%20should%20I%20memoise%3F");
  render(<ProMentor aiReady/>);
  expect(screen.getByRole("textbox", { name: "Message the mentor" })).toHaveValue("When should I memoise?");
  await user.click(screen.getByRole("button", { name: "Send message" }));
  expect(await screen.findByText("useMemo", { selector: "strong" })).toBeVisible();
  const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
  expect(body).toMatchObject({ trackId: "react", messages: [{ role: "user", content: "When should I memoise?" }] });
});

test("markdown renderer keeps code as text", () => {
  render(<ProMarkdown text={"- one `<b>`\n- two\n\n<script>alert(1)</script>"}/>);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(document.querySelector("script")).toBeNull();
  expect(screen.getByText("<script>alert(1)</script>")).toBeVisible();
});

test("sidebar search suggests destinations, filters by icon scope, clears and navigates", async () => {
  const user = userEvent.setup();
  const onTab = jest.fn();
  function Harness() {
    const [query, setQuery] = useState("");
    return <SidebarSearch query={query} onQueryChange={setQuery} access={{ selections: [], isSuperAdmin: true }} hi={false} collapsed={false} onExpand={() => {}} onNavigateTab={onTab}/>;
  }
  render(<Harness/>);
  const search = screen.getByRole("searchbox", { name: "Search sidebar" });
  await user.type(search, "quiz");
  expect(within(screen.getByRole("listbox", { name: "Search suggestions" })).getAllByRole("option")[0]).toHaveTextContent("Quiz");
  await user.click(screen.getByRole("button", { name: "Technology tracks" }));
  expect(screen.getByRole("button", { name: "Technology tracks" })).toHaveAttribute("aria-pressed", "true");
  await user.clear(search); await user.type(search, "python");
  expect(screen.getAllByRole("option").every(option => option.textContent?.includes("Lesson track"))).toBe(true);
  await user.keyboard("{Enter}");
  expect(push).toHaveBeenCalledWith("/dashboard/lessons?track=python");
  await user.type(search, "library");
  await user.click(screen.getByRole("button", { name: "All results" }));
  await user.click(screen.getByRole("button", { name: "Clear sidebar search" }));
  expect(search).toHaveValue("");
  expect(sidebarSuggestions({ selections: [], isSuperAdmin: false }, false).some(item => item.scope === "preparation")).toBe(false);
});

test("lesson flashcards reveal takeaways and track recall without marking lessons complete", async () => {
  const user = userEvent.setup();
  render(<ProLessons lessons={lessons} aiReady={false}/>);
  const deck = within(screen.getByRole("region", { name: "Lesson flashcards" }));
  await user.click(deck.getByRole("button", { name: "Reveal takeaways" }));
  expect(deck.getByText("KEY TAKEAWAYS")).toBeVisible();
  await user.click(deck.getByRole("button", { name: "Got it" }));
  expect(deck.getByText(/1 of .* recalled this session/)).toBeVisible();
  expect(deck.getByText("RECALL PROMPT")).toBeVisible();
  expect(localStorage.getItem("masterclass:lessons-done")).toBeNull();
});

test("quiz practice modes configure the requested session length", async () => {
  const user = userEvent.setup();
  global.fetch = jest.fn().mockResolvedValue(json({ error: "unavailable" }, false)) as jest.Mock;
  render(<ProQuiz aiReady={false} libraryTracks={["react"]}/>);
  await user.click(screen.getByRole("button", { name: /Quick warm-up/ }));
  expect(screen.getByRole("combobox", { name: "Questions" })).toHaveValue("3");
  await user.click(screen.getByRole("button", { name: "Start quiz" }));
  expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toMatchObject({ count: 3 });
  await screen.findByRole("alert");
});

test("a card sent back for more practice reappears before the deck is finished", async () => {
  const user = userEvent.setup();
  render(<ProLessons lessons={lessons} aiReady={false}/>);
  const deck = within(screen.getByRole("region", { name: "Lesson flashcards" }));
  const total = Number(deck.getByText(/RECALL PROMPT/).closest("article")!.textContent!.match(/1 \/ (\d+)/)![1]);
  await user.click(deck.getByRole("button", { name: "Reveal takeaways" }));
  await user.click(deck.getByRole("button", { name: "Practise again" }));
  expect(deck.getByText(`0 of ${total} recalled this session`)).toBeVisible();
  expect(deck.getByText("Repeated").parentElement).toHaveTextContent("Repeated 1");
  // Every card still has to be recalled once, so the queue never shrinks on a repeat.
  expect(deck.getByText("Left").parentElement).toHaveTextContent(`Left ${total}`);
  for (let index = 0; index < total; index += 1) {
    await user.click(deck.getByRole("button", { name: "Reveal takeaways" }));
    await user.click(deck.getByRole("button", { name: "Got it" }));
  }
  expect(deck.getByRole("heading", { name: "Deck complete." })).toBeVisible();
  await user.click(deck.getByRole("button", { name: "Same order" }));
  expect(deck.getByText(`0 of ${total} recalled this session`)).toBeVisible();
}, 30_000); // Walks the whole deck one card at a time, so it needs more than the 5s default.

test("finishing a quiz builds a review deck from the questions that were missed", async () => {
  const user = userEvent.setup();
  const questions = [
    { q: "Which hook stores component state?", options: ["useRef", "useState", "useId", "useMemo"], answer: 1, explain: "useState returns a value and a setter.", vocab: [] },
    { q: "Which hook memoises a value?", options: ["useMemo", "useEffect", "useId", "useRef"], answer: 0, explain: "useMemo caches a computed value between renders.", vocab: [] },
  ];
  global.fetch = jest.fn().mockResolvedValue(json({ source: "library", questions })) as jest.Mock;
  render(<ProQuiz aiReady={false} libraryTracks={["react"]}/>);
  await user.click(screen.getByRole("button", { name: "Start quiz" }));
  await user.click(await screen.findByRole("button", { name: /useState/ }));
  await user.click(screen.getByRole("button", { name: "Next question" }));
  await user.click(await screen.findByRole("button", { name: /useEffect/ }));
  await user.click(screen.getByRole("button", { name: "See results" }));

  expect(screen.getByRole("region", { name: "Your score" })).toHaveTextContent("1/2");
  const review = within(screen.getByRole("region", { name: "Quiz review flashcards" }));
  expect(review.getByText("0 of 1 re-answered from memory")).toBeVisible();
  expect(review.getByRole("heading", { name: "Which hook memoises a value?" })).toBeVisible();
  // The meta pills sit on both faces of the card, so the answer you gave stays visible either way.
  expect(review.getAllByText("You chose B. useEffect")).toHaveLength(2);
  await user.click(review.getByRole("button", { name: "Reveal the answer" }));
  expect(review.getByText("useMemo caches a computed value between renders.")).toBeVisible();
});

test("the interview drill deck follows the bank filters", async () => {
  const user = userEvent.setup();
  render(<ProInterview aiReady={false}/>);
  const drill = () => within(screen.getByRole("region", { name: "Interview drill flashcards" }));
  expect(drill().getByText(/drawn from the full bank/)).toBeVisible();
  await user.click(within(screen.getByRole("group", { name: "Filter by company" })).getByRole("button", { name: "Netflix" }));
  const netflix = INTERVIEW_BANK.filter(item => item.co.includes("Netflix"));
  expect(drill().getByText(/drawn from your current filters/)).toBeVisible();
  expect(drill().getByRole("heading", { name: netflix[0].q })).toBeVisible();
});

test("every track and interview category belongs to exactly one section", () => {
  const mapped = TRACK_FAMILIES.flatMap(family => family.trackIds);
  expect(new Set(mapped).size).toBe(mapped.length);
  expect([...mapped].sort()).toEqual(PRO_TRACKS.map(track => track.id).sort());

  const categories = [...new Set(INTERVIEW_BANK.map(item => item.cat))];
  const mappedCategories = INTERVIEW_AREAS.flatMap(area => area.categories);
  expect(new Set(mappedCategories).size).toBe(mappedCategories.length);
  expect(categories.every(category => mappedCategories.includes(category))).toBe(true);
  // Totals must survive the grouping, or questions would quietly disappear from the bank.
  expect(groupQuestionsByArea(INTERVIEW_BANK).reduce((sum, group) => sum + group.total, 0)).toBe(INTERVIEW_BANK.length);
});

test("interview questions are grouped into areas and topics that follow the filters", async () => {
  const user = userEvent.setup();
  render(<ProInterview aiReady={false}/>);
  const languages = screen.getByRole("region", { name: "Languages & the browser interview questions" });
  expect(within(languages).getByRole("heading", { name: "JavaScript" })).toBeVisible();
  const javascript = INTERVIEW_BANK.filter(item => item.cat === "JavaScript").length;
  expect(within(languages).getByText(`${javascript} questions`)).toBeVisible();
  expect(screen.getByRole("region", { name: "Behaviour & experience interview questions" })).toBeVisible();

  await user.click(within(screen.getByRole("group", { name: "Filter by topic" })).getByRole("button", { name: "Behavioral" }));
  expect(screen.queryByRole("region", { name: "Languages & the browser interview questions" })).toBeNull();
  expect(screen.getByRole("region", { name: "Behaviour & experience interview questions" })).toBeVisible();
});

test("the technology browser opens the selected track's family and can switch track", async () => {
  const user = userEvent.setup();
  mockParams = new URLSearchParams("track=react");
  render(<ProLessons lessons={lessons} aiReady={false}/>);
  const frontend = screen.getByText("Frontend frameworks").closest("details")!;
  expect(frontend.open).toBe(true);
  expect(within(frontend).getByRole("button", { name: /React 19\+/ })).toHaveAttribute("aria-pressed", "true");
  // A family the learner is not in stays closed, so 54 tracks never arrive at once.
  expect(screen.getByText("Testing & quality").closest("details")!.open).toBe(false);

  await user.click(within(frontend).getByRole("button", { name: /Next\.js 16\+/ }));
  expect(screen.getByRole("heading", { level: 1, name: "Next.js 16+" })).toBeVisible();
});
