import { fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { AnswerSearch } from "@/components/answer-search";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { awsHighlights } from "@/lib/pro-learn/aws-highlights";
import { CLASSROOM_CATALOGUES } from "@/lib/pro-learn/classroom";
import { classroomExplanation } from "@/lib/pro-learn/classroom/lessons";
import { TECHNOLOGY_ESSENTIALS, ESSENTIAL_TECHNOLOGIES, essentialPoints } from "@/lib/pro-learn/essentials";
import { ALL_OFFICIAL_SCREENS, SCREEN_TECHNOLOGIES, screensFor } from "@/lib/media/official-screens";

jest.mock("next/link", () => ({ __esModule: true, default: ({ prefetch, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => { void prefetch; return <a {...props} />; } }));
jest.mock("@/components/code-lab", () => ({ CodeLab: ({ code }: { code: string }) => <pre>{code}</pre> }));

/** Vocabulary cards open the word dialog, not the answer, so they have no essentials. */
const VOCABULARY_HANDBOOK = "English Corporate & Speaking Words — Workplace Vocabulary";

beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = jest.fn();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ providers: [], default: null }) }) as jest.Mock;
});

// ---- The authored content ----

test("every handbook a reader can open an answer from has authored key points", () => {
  const missing = TECHNOLOGY_HANDBOOKS
    .map(handbook => handbook.title)
    .filter(title => title !== VOCABULARY_HANDBOOK && !ESSENTIAL_TECHNOLOGIES.includes(title));
  expect(missing).toEqual([]);
});

test("the three standalone catalogues are covered too", () => {
  for (const catalogue of ["AWS", "AI terms", "Python"]) {
    expect(essentialPoints(catalogue, "any category").length).toBeGreaterThan(2);
  }
});

/**
 * A category key that matches nothing is authored content nobody will ever see,
 * and a typo is the only way it happens. Each entry's keys have to name a real
 * category of at least one of the technologies it covers — "at least one",
 * because the two Playwright handbooks share an entry and split its categories.
 */
test("every category of key points names a real category", () => {
  const known = new Map(TECHNOLOGY_HANDBOOKS.map(handbook => [handbook.title, new Set(handbook.categories.map(category => category.name))]));
  const orphans: string[] = [];
  for (const entry of TECHNOLOGY_ESSENTIALS) {
    if (!entry.technologies.some(technology => known.has(technology))) continue;
    for (const category of Object.keys(entry.categories ?? {})) {
      if (!entry.technologies.some(technology => known.get(technology)?.has(category))) orphans.push(`${entry.technologies[0]} → ${category}`);
    }
  }
  expect(orphans).toEqual([]);
});

test("key points are specific: category points lead, and nothing is a duplicate", () => {
  for (const entry of TECHNOLOGY_ESSENTIALS) {
    expect(entry.points.length).toBeGreaterThanOrEqual(3);
    for (const point of entry.points) expect(point.length).toBeGreaterThan(60);
    const [technology] = entry.technologies;
    const category = Object.keys(entry.categories ?? {})[0];
    if (!category) continue;
    const points = essentialPoints(technology, category);
    expect(points.slice(0, entry.categories![category].length)).toEqual(entry.categories![category]);
    expect(new Set(points).size).toBe(points.length);
  }
});

// ---- The screenshots ----

/**
 * These pictures are hotlinked, so the registry cannot promise they still
 * resolve — only that each row is addressed to the host that owns it, credits
 * it, links the page it came from, and records when it was last checked. The
 * network is deliberately not touched here: a test that fails when a vendor's
 * CDN hiccups is a test nobody trusts.
 */
test("every official screenshot is credited, dated and addressed to a host that owns it", () => {
  const hosts = ["raw.githubusercontent.com", "docs.nestjs.com", "kubernetes.io"];
  for (const screen of ALL_OFFICIAL_SCREENS) {
    const source = new URL(screen.src);
    expect(source.protocol).toBe("https:");
    expect(hosts).toContain(source.hostname);
    expect(new URL(screen.page).protocol).toBe("https:");
    expect(screen.credit).not.toBe("");
    expect(screen.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // The caption teaches something rather than repeating the title.
    expect(screen.caption.length).toBeGreaterThan(80);
    expect(screen.caption).not.toBe(screen.title);
  }
  expect(new Set(ALL_OFFICIAL_SCREENS.map(screen => screen.src)).size).toBe(ALL_OFFICIAL_SCREENS.length);
  expect(ALL_OFFICIAL_SCREENS.length).toBeGreaterThan(25);
});

test("a screen shows on the service or topic it depicts, and nowhere else", () => {
  const aws = awsHighlights();
  const service = (name: string) => aws.find(item => item.name === name)!;
  const titles = (name: string) => screensFor("AWS", service(name).category, name).map(screen => screen.title);

  expect(titles("AWS Lambda")).toContain("An X-Ray trace of one request");
  expect(titles("AWS X-Ray")).toContain("The service map");
  // Same catalogue, same category in some cases — and no picture, because none
  // of these screens is of them.
  expect(titles("Amazon S3")).toContain("Amazon S3: buckets and objects");
  for (const name of ["Amazon EC2", "AWS KMS", "Amazon Cognito"]) expect(titles(name)).toEqual([]);

  // A topic name is required: without one, only a category a picture explains
  // as a whole can bring it in.
  expect(screensFor("Cypress — End-to-End Testing & Network Control", "Network control").length).toBeGreaterThan(0);
  expect(screensFor("Cypress — End-to-End Testing & Network Control", "Fixtures and test data")).toEqual([]);
  expect(screensFor("Zod validation libraries", "Zod foundations", "Object schemas")).toEqual([]);
});

/**
 * A screen scoped to a topic fragment or category that matches nothing is a
 * picture nobody will ever see, and a typo is the only way it happens.
 */
test("every screen is reachable from a real topic or category", () => {
  const rows = (technology: string) => technology === "AWS"
    ? awsHighlights().map(item => ({ name: item.name, category: item.category }))
    : (TECHNOLOGY_HANDBOOKS.find(entry => entry.title === technology)?.topics ?? []).map(item => ({ name: item.name, category: item.category }));
  const seen = new Set<string>();
  for (const technology of SCREEN_TECHNOLOGIES) {
    const topics = rows(technology);
    expect(topics.length).toBeGreaterThan(0);
    for (const topic of topics) for (const screen of screensFor(technology, topic.category, topic.name)) seen.add(screen.src);
  }
  const unreachable = ALL_OFFICIAL_SCREENS.filter(screen => !seen.has(screen.src)).map(screen => screen.title);
  expect(unreachable).toEqual([]);
});

test("every screen says which topics or categories it belongs to", () => {
  for (const screen of ALL_OFFICIAL_SCREENS) {
    expect((screen.topics?.length ?? 0) + (screen.categories?.length ?? 0)).toBeGreaterThan(0);
    for (const fragment of screen.topics ?? []) expect(fragment).toBe(fragment.toLowerCase());
  }
});

// ---- The modal ----

const handbook = (title: string) => TECHNOLOGY_HANDBOOKS.find(entry => entry.title === title)!;
const PRISMA = handbook("Prisma");

/** Open one topic by filtering to it first: a handbook shows six cards a page. */
const openTopic = (title: string, name: string) => {
  render(<AnswerSearch technologyHandbooks={[handbook(title)]} />);
  fireEvent.change(screen.getByRole("searchbox", { name: `Search ${title}` }), { target: { value: name } });
  fireEvent.click(screen.getAllByRole("button", { name: new RegExp(`Explain this: ${name}`) })[0]);
};
const openPrismaTopic = (name: string) => openTopic("Prisma", name);

test("the modal opens on the topic's own title, left of everything, with a mark beside it", async () => {
  openPrismaTopic("Relations");
  const dialog = await screen.findByRole("dialog");
  const heading = within(dialog).getByRole("heading", { name: "Relations" });
  const header = heading.closest("header")!;
  // The mark comes first in the header, then the title, then the close button:
  // the title starts at the same place on every answer.
  const order = [...header.children].map(child => child.className);
  expect(order[0]).toContain("answerMark");
  expect(order[1]).toContain("answerTitles");
  // A real mark, not a letter: Prisma has a logo, so the header shows it.
  expect(header.querySelector("[class*='answerMark'] img, [class*='answerMark'] svg")).not.toBeNull();
  // The handbook and the category read under the title rather than in it.
  expect(within(header).getByText("Prisma · Schema & modelling")).toBeVisible();
});

test("the answer carries the technology's key points as well as the topic's own", async () => {
  openPrismaTopic("Relations");
  const remember = within(await screen.findByRole("dialog")).getByRole("region", { name: "Worth remembering" });
  expect(within(remember).getAllByRole("listitem").length).toBeGreaterThan(3);
  expect(remember).toHaveTextContent(/The schema file is the source of truth/);
});

test("a topic in a category with its own points gets those first", async () => {
  openPrismaTopic("migrate dev");
  const remember = within(await screen.findByRole("dialog")).getByRole("region", { name: "Worth remembering" });
  const points = within(remember).getAllByRole("listitem").map(item => item.textContent ?? "");
  expect(points.some(point => /no longer matches the migration history/.test(point))).toBe(true);
});

test("real screens from the official docs are shown, each linked to the page it came from", async () => {
  openTopic("Docker", "Images, containers and layers");
  const dialog = await screen.findByRole("dialog");
  const block = within(dialog).getByRole("region", { name: "Screens & learning resources" });
  const figure = within(block).getAllByRole("figure")[0];
  const image = within(figure).getByRole("img");
  expect(image).toHaveAttribute("src", expect.stringContaining("docker/docs"));
  // Hotlinked: no referrer is sent, and the picture is not fetched until it scrolls in.
  expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(image).toHaveAttribute("loading", "lazy");
  expect(within(figure).getAllByRole("link")[0]).toHaveAttribute("href", expect.stringContaining("docs.docker.com"));
});

test("a screenshot that no longer resolves leaves the caption and the official link", async () => {
  openTopic("Docker", "Images, containers and layers");
  const dialog = await screen.findByRole("dialog");
  const figure = within(dialog).getAllByRole("figure")[0];
  fireEvent.error(within(figure).getByRole("img"));

  expect(within(figure).queryByRole("img")).toBeNull();
  expect(figure).toHaveTextContent(/This preview could not be loaded/);
  expect(within(figure).getByRole("link")).toHaveAttribute("href", expect.stringContaining("docs.docker.com"));
});

// ---- Related topics ----

test("a card stays a card: the category's other topics are named in the answer, not on it", () => {
  render(<AnswerSearch technologyHandbooks={[PRISMA]} />);
  const card = screen.getAllByRole("listitem").find(row => row.textContent?.includes("Relations"))!;
  // The card carries its own title, category and summary, and nothing about
  // its neighbours.
  expect(card).not.toHaveTextContent("Also in this group");
  expect(card).not.toHaveTextContent("Datasource and generator");
});

test("the answer lists the rest of the group, and opening one swaps the answer", async () => {
  openPrismaTopic("Relations");
  const related = within(await screen.findByRole("dialog")).getByRole("region", { name: /Core features in Schema & modelling/ });
  // The group is folded behind its own title — a category can hold thirty
  // topics, and the answer should open on the answer.
  fireEvent.click(within(related).getByText(/Core features in Schema & modelling/));
  expect(within(related).getByText("Indexes")).toBeVisible();
  expect(related).toHaveTextContent(/Add indexes for the queries a feature actually runs/);

  fireEvent.click(within(related).getByRole("button", { name: /^Indexes/ }));
  expect(await screen.findByRole("heading", { name: "Indexes" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Relations" })).toBeNull();
});

/**
 * Class Room mounts the same browser with school catalogues, so the group and
 * the modal's title come from the same code. Pinned because the page passes
 * different props — no question box, `catalogues` instead of handbooks — and a
 * change that only checked the Search page would not notice it regressing.
 */
test("Class Room answers carry the same group and titled header", async () => {
  const subject = CLASSROOM_CATALOGUES[0];
  const topic = subject.topics[0];
  render(<AnswerSearch search={false} heading="Class Room" catalogues={[subject]} />);

  const card = screen.getAllByRole("listitem").find(row => row.textContent?.includes(topic.name))!;

  fireEvent.click(within(card).getByRole("button", { name: new RegExp(`Explain this: ${topic.name}`) }));
  const dialog = await screen.findByRole("dialog");
  const heading = within(dialog).getByRole("heading", { name: topic.name, level: 2 });
  expect(heading.className).toContain("answerTitle");
  expect(within(heading.closest("header")!).getByText(`${subject.id} · ${topic.category}`)).toBeVisible();
  expect(within(dialog).getByRole("region", { name: new RegExp(`Core features in ${topic.category}`) })).toBeInTheDocument();
});

/**
 * A prepared explanation draws nothing. The boxed statements joined by arrows
 * that these used to carry only restated the working steps printed directly
 * below them, so the answer says it once, in words.
 */
test("a prepared classroom explanation carries no drawn diagram", () => {
  for (const subject of CLASSROOM_CATALOGUES) {
    for (const topic of subject.topics.slice(0, 12)) {
      expect(classroomExplanation(subject.id, topic).answer.diagrams).toEqual([]);
    }
  }
});

/**
 * The working is a numbered list, so a heading that only repeats the number is
 * furniture. Matched at render time as well as at the source, because answers
 * also arrive from the model and from localStorage.
 */
test("a step is never headed by its own number", async () => {
  const subject = CLASSROOM_CATALOGUES.find(entry => entry.id === "maths")!;
  const topic = subject.topics.find(item => /round/i.test(item.name)) ?? subject.topics[0];
  render(<AnswerSearch search={false} heading="Class Room" catalogues={[subject]} />);
  fireEvent.click(screen.getAllByRole("button", { name: new RegExp(`Explain this: ${topic.name}`) })[0]);

  const steps = within(await screen.findByRole("dialog")).getByRole("region", { name: "Step by step" });
  expect(within(steps).getAllByRole("listitem").length).toBeGreaterThan(0);
  expect(within(steps).queryByRole("heading", { name: /^Step \d+$/ })).toBeNull();
  expect(within(steps).queryByRole("heading", { name: /^Key idea \d+$/ })).toBeNull();
  for (const heading of within(steps).queryAllByRole("heading")) expect(heading.textContent?.trim()).not.toBe("");
});
