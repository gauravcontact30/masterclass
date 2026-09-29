import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AnswerSearch } from "@/components/answer-search";
import { AI_MODE_KEY } from "@/lib/ai-mode";
import type { AnchorHTMLAttributes } from "react";
// prefetch is a Next-only prop; an <a> would warn about it.
jest.mock("next/link", () => ({ __esModule: true, default: ({ prefetch, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => { void prefetch; return <a {...props} />; } }));
jest.mock("@/components/code-lab", () => ({ CodeLab: ({ code }: { code: string }) => <pre>{code}</pre> }));

const answer = {
  headline: "Run next upgrade, then fix the breaking changes it reports.",
  definition: "next upgrade is the first-party codemod runner that raises Next.js and applies the mechanical rewrites a major release needs.",
  summary: "Next.js 16.1 and later ship an upgrade command. It raises the packages and applies the mechanical codemods; the rest is yours to verify.",
  steps: [
    { title: "Record a baseline", detail: "Capture versions, a passing test run and a successful build before changing anything.", code: "npm test && npm run build" },
    { title: "Run the codemod", detail: "Upgrade the packages and apply the mechanical rewrites.", code: "npx next upgrade" },
    { title: "Verify behaviour", detail: "Walk the forms, modals and streamed routes by hand.", code: "" },
  ],
  alternatives: [
    { title: "Upgrade the packages by hand", detail: "Raise each dependency yourself and apply the codemods one at a time.", when: "a monorepo pins versions centrally." },
    { title: "Stay on 15 until the next minor", detail: "Wait for the ecosystem to catch up.", when: "a critical dependency has no v16 build yet." },
  ],
  useCases: [
    { title: "A dashboard on a weekly release train", scenario: "One team owns 40 routes and cannot freeze work for a week.", example: "git switch -c upgrade/next-16" },
    { title: "A marketing site with no tests", scenario: "Nothing automated proves the pages still render.", example: "npx next build --debug" },
  ],
  files: [
    { path: "/app/layout.tsx", code: "export default function Layout({ children }) {\n  return <html><body>{children}</body></html>;\n}", note: "The root layout." },
    { path: "/app/page.tsx", code: "export default function Page() {\n  return <h1>Upgraded</h1>;\n}", note: "The home route." },
    { path: "/package.json", code: "{ \"dependencies\": { \"next\": \"16.1.0\" } }", note: "" },
  ],
  keyPoints: ["Turbopack is the default bundler in Next.js 16.", "react and react-dom must match exactly."],
  caveats: ["A green typecheck does not prove a form still submits."],
  followUps: ["What changed in next/image in v16?"],
  subjects: [],
};
const matches = [{ id: "nextjs-turbopack", title: "Turbopack", technology: "nextjs", category: "Core performance", description: "The default bundler." }];
const reply = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body });
const answerCalls = () => (global.fetch as jest.Mock).mock.calls.filter(([url]) => url === "/api/pro-learn/answer");

const PROVIDERS = {
  providers: [
    { id: "anthropic", label: "Claude", grounded: false, description: "Answers from the model, tuned for this app." },
    { id: "perplexity", label: "Perplexity", grounded: true, description: "Searches the web first, so answers cite the pages they came from." },
  ],
  default: "perplexity",
};

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue(reply({ providers: [], default: null })) as jest.Mock;
  // scrollIntoView is not implemented in jsdom; reopening an entry calls it.
  Element.prototype.scrollIntoView = jest.fn();
  window.requestAnimationFrame = (callback: FrameRequestCallback) => { callback(0); return 0; };
});

function respond(body: unknown, ok = true, status = 200, providers: unknown = { providers: [], default: null }) {
  (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
    url === "/api/pro-learn/answer" ? reply(body, ok, status) : reply(providers));
}
/** Each question gets its own headline, so history entries are told apart. */
function respondPerQuestion(providers: unknown = { providers: [], default: null }) {
  (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: RequestInit) => {
    if (url !== "/api/pro-learn/answer") return reply(providers);
    const question = JSON.parse(String(init?.body)).question as string;
    return reply({ answer: { ...answer, headline: `Answer for ${question}` }, provider: "perplexity", sources: [], matches: [] });
  });
}
/**
 * The answer reads in a modal, so the page behind it is inert while one is
 * open: asking the next question means closing the last answer first, exactly
 * as a reader would.
 */
function closeAnswer() {
  const close = screen.queryByRole("button", { name: "Close" });
  if (close) fireEvent.click(close);
}
function ask(question: string) {
  closeAnswer();
  fireEvent.change(screen.getByRole("searchbox", { name: "Ask a question" }), { target: { value: question } });
  fireEvent.click(screen.getByRole("button", { name: /Ask/ }));
}
/**
 * The catalogues are tabbed, so reaching one means opening its tab. Queries are
 * scoped to the section strip: each catalogue draws its own category tabs, and
 * an unscoped "tab" role would collect both sets.
 */
const sectionStrip = () => screen.getByRole("tablist", { name: "Browse a catalogue" });
const sectionTabs = () => within(sectionStrip()).getAllByRole("tab").map(tab => tab.textContent);
function openSection(name: string) {
  closeAnswer();
  fireEvent.click(within(sectionStrip()).getByRole("tab", { name }));
  return screen.getByRole("region", { name });
}
const openAnswer = () => screen.getByRole("article");
/** Folded sections open by their title, the way a reader would open them. */
function unfold(name: string) {
  const region = screen.getByRole("region", { name });
  const details = region.querySelector("details")!;
  expect(details).not.toHaveAttribute("open");
  fireEvent.click(region.querySelector("summary")!);
  expect(details).toHaveAttribute("open");
  return region;
}
const entries = () => within(screen.getByRole("region", { name: "Earlier searches" })).getAllByRole("listitem");

test("the open answer carries the definition, steps, use cases and a multi-line code example", async () => {
  respond({ answer, provider: "perplexity", sources: ["nextjs.org", "react.dev"], matches });
  render(<AnswerSearch />);

  // Nothing asked yet: an invitation, not a wall of suggestions.
  expect(screen.getByText(/Your answers collect here\. Ask a question to start/)).toBeVisible();

  ask("How do I upgrade to Next.js 16?");
  expect(await screen.findByRole("heading", { level: 2, name: /Run next upgrade/ })).toBeVisible();
  expect(screen.getByText(/first-party codemod runner/)).toBeVisible();
  expect(screen.getByText(/Next.js 16.1 and later ship an upgrade command/)).toBeVisible();

  // The flow is an ordered list, one entry per step, with the step's code shown.
  const flow = screen.getByRole("region", { name: "Step by step" });
  const steps = flow.querySelectorAll("ol > li");
  expect(steps).toHaveLength(answer.steps.length);
  expect(steps[0].textContent).toContain("Record a baseline");
  // Both steps' code is shell, so each renders as a terminal, not an editor;
  // the third step carries no code at all.
  const terminals = within(flow).getAllByRole("figure", { name: "Terminal" });
  expect(terminals).toHaveLength(2);
  expect(terminals[0]).toHaveTextContent("$npm test && npm run build");
  expect(terminals[1]).toHaveTextContent("$npx next upgrade");
  expect(flow.querySelectorAll("pre")).toHaveLength(0);

  expect(screen.queryByRole("region", { name: "Other ways to do this" })).not.toBeInTheDocument();
  expect(screen.queryByText(/a monorepo pins versions centrally/)).not.toBeInTheDocument();

  const useCases = unfold("Where this comes up");
  expect(useCases.querySelectorAll("li")).toHaveLength(2);
  expect(within(useCases).getAllByRole("figure", { name: "Terminal" })[0]).toHaveTextContent("git switch -c upgrade/next-16");

  // Short, high-signal sections stay open.
  expect(screen.getByRole("region", { name: "Worth remembering" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Watch out for" })).toBeVisible();
  expect(screen.getByText(/Answered with/)).toBeVisible();
  // Hostnames only: generated answers never render an outbound link.
  expect(document.querySelector("a[href^='http']")).toBeNull();

  expect(answerCalls()[0][1]).toMatchObject({ method: "POST", body: JSON.stringify({ question: "How do I upgrade to Next.js 16?", aiMode: true }) });
});

test("the code example lists every file and opens the one that is clicked", async () => {
  respond({ answer, provider: "perplexity", sources: [], matches: [] });
  render(<AnswerSearch initialQuestion="How do I upgrade to Next.js 16?" />);
  await screen.findByRole("heading", { level: 2, name: /Run next upgrade/ });
  unfold("Code example");

  const tree = screen.getByRole("navigation", { name: "Example files" });
  expect(within(tree).getAllByRole("button").map(button => button.textContent)).toEqual(["layout.tsx", "page.tsx", "package.json"]);
  expect(within(tree).getByText("app")).toBeVisible();

  expect(screen.getByLabelText("/app/layout.tsx source")).toBeVisible();
  fireEvent.click(within(tree).getByRole("button", { name: "page.tsx" }));
  expect(screen.getByLabelText("/app/page.tsx source")).toBeVisible();
  expect(screen.getByText("The home route.")).toBeVisible();
});

test("one answer stays open and the earlier ones become index entries below it", async () => {
  respondPerQuestion();
  render(<AnswerSearch />);

  ask("Question one");
  await screen.findByRole("article", { name: "Question one" });
  // Closed, the one answer sits in the index rather than vanishing.
  closeAnswer();
  expect(entries()).toHaveLength(1);

  ask("Question two");
  await screen.findByRole("article", { name: "Question two" });
  expect(screen.getAllByRole("article")).toHaveLength(1);
  closeAnswer();

  // Both sit in the index once the modal is closed, newest first, each carrying
  // its own answer's headline.
  const list = entries();
  expect(list).toHaveLength(2);
  expect(list[0].textContent).toContain("Question two");
  expect(list[1].textContent).toContain("Question one");
  expect(list[1].textContent).toContain("Answer for Question one");
  expect(screen.getByText("2 saved")).toBeVisible();
});

test("reopening an entry swaps it into the document without asking the model again", async () => {
  respondPerQuestion();
  render(<AnswerSearch />);
  ask("Question one");
  await screen.findByRole("article", { name: "Question one" });
  ask("Question two");
  await screen.findByRole("article", { name: "Question two" });
  expect(answerCalls()).toHaveLength(2);

  closeAnswer();
  fireEvent.click(within(entries()[1]).getByRole("button", { name: "Open Question one" }));
  await waitFor(() => expect(openAnswer()).toHaveAccessibleName("Question one"));
  // No third request, and the two simply trade places.
  expect(answerCalls()).toHaveLength(2);
  closeAnswer();
  expect(entries()[0].textContent).toContain("Question two");
});

test("re-asking a question already answered reopens it instead of spending another request", async () => {
  respondPerQuestion();
  render(<AnswerSearch />);
  ask("Question one");
  await screen.findByRole("article", { name: "Question one" });
  ask("Question two");
  await screen.findByRole("article", { name: "Question two" });

  ask("question ONE");   // same question, different case and capitalisation
  await waitFor(() => expect(openAnswer()).toHaveAccessibleName("Question one"));
  expect(answerCalls()).toHaveLength(2);
});

test("earlier searches show one row of three, the rest behind the pager", async () => {
  respondPerQuestion();
  render(<AnswerSearch />);
  // Eight answers: with the modal closed all eight are index entries, three to
  // a page.
  for (let index = 1; index <= 8; index++) {
    ask(`Question ${index}`);
    await screen.findByRole("article", { name: `Question ${index}` });
  }

  closeAnswer();
  expect(screen.getByText("8 saved")).toBeVisible();
  expect(entries()).toHaveLength(3);

  // The index comes before the search box: a question already asked is one
  // glance away rather than one scroll past a document.
  const index = screen.getByRole("region", { name: "Earlier searches" });
  expect(index.compareDocumentPosition(screen.getByRole("search")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  // Newest first.
  expect(entries().map(entry => entry.textContent)).toEqual([
    expect.stringContaining("Question 8"), expect.stringContaining("Question 7"), expect.stringContaining("Question 6"),
  ]);

  const pager = screen.getByRole("navigation", { name: "Earlier searches pages" });
  expect(within(pager).getAllByRole("button", { name: /^Page \d$/ })).toHaveLength(3);
  expect(within(pager).getByRole("button", { name: "Previous page" })).toBeDisabled();

  fireEvent.click(within(pager).getByRole("button", { name: "Next page" }));
  expect(entries()).toHaveLength(3);
  expect(entries()[0].textContent).toContain("Question 5");

  // The last page carries the remainder and stops there.
  fireEvent.click(within(pager).getByRole("button", { name: "Page 3" }));
  expect(entries()).toHaveLength(2);
  expect(entries()[0].textContent).toContain("Question 2");
  expect(within(pager).getByRole("button", { name: "Next page" })).toBeDisabled();
  expect(within(pager).getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
});

test("an entry can be forgotten on its own, and answers survive a reload", async () => {
  respondPerQuestion();
  const { unmount } = render(<AnswerSearch />);
  ask("Question one");
  await screen.findByRole("article", { name: "Question one" });
  ask("Question two");
  await screen.findByRole("article", { name: "Question two" });

  closeAnswer();
  fireEvent.click(within(entries()[1]).getByRole("button", { name: "Forget Question one" }));
  await waitFor(() => expect(entries()).toHaveLength(1));
  expect(JSON.parse(localStorage.getItem("masterclass:ai-search:cards")!)).toHaveLength(1);

  // A reload keeps the answer, in the index rather than in an unasked-for modal.
  unmount();
  render(<AnswerSearch />);
  const restored = await within(await screen.findByRole("region", { name: "Earlier searches" })).findByRole("button", { name: "Open Question two" });
  fireEvent.click(restored);
  expect(await screen.findByRole("article", { name: "Question two" })).toBeVisible();
});

test("a follow-up asks a new question and takes over the document", async () => {
  respond({ answer, provider: "perplexity", sources: [], matches: [] });
  render(<AnswerSearch initialQuestion="How do I upgrade to Next.js 16?" />);
  await screen.findByRole("heading", { level: 2, name: /Run next upgrade/ });

  fireEvent.click(screen.getByRole("button", { name: "What changed in next/image in v16?" }));
  await waitFor(() => expect(answerCalls()).toHaveLength(2));
  await waitFor(() => expect(openAnswer()).toHaveAccessibleName("What changed in next/image in v16?"));
  closeAnswer();
  expect(screen.getByRole("searchbox", { name: "Ask a question" })).toHaveValue("What changed in next/image in v16?");
});

test("the model choice is one sliding switch between Claude and Perplexity", async () => {
  respond({ answer, provider: "perplexity", sources: [], matches: [] }, true, 200, PROVIDERS);
  render(<AnswerSearch />);

  const group = await screen.findByRole("radiogroup", { name: "Answer with" });
  const [claude, perplexity] = within(group).getAllByRole("radio");
  expect([claude.textContent, perplexity.textContent]).toEqual(["Claude", "Perplexity"]);
  // Each stop leads with the model's own mark, and the grounded one says so.
  expect(claude.querySelector("svg")).toBeInTheDocument();
  expect(within(perplexity).getByRole("img", { name: "searches the web" })).toBeInTheDocument();
  // It lives inside the search field, alongside the query it governs.
  const field = screen.getByRole("searchbox", { name: "Ask a question" }).parentElement!;
  expect(field).toContainElement(group);

  // The server-advertised default starts selected, and the thumb sits on its stop.
  expect(perplexity).toBeChecked();
  expect(group).toHaveStyle({ "--active": "1" });

  fireEvent.click(claude);
  expect(claude).toBeChecked();
  expect(group).toHaveStyle({ "--active": "0" });

  ask("How do I upgrade to Next.js 16?");
  await screen.findByRole("article", { name: "How do I upgrade to Next.js 16?" });
  expect(answerCalls()[0][1].body).toBe(JSON.stringify({ question: "How do I upgrade to Next.js 16?", provider: "anthropic", aiMode: true }));
});

test("with a single configured provider there is no choice to draw", async () => {
  respond({ answer, provider: "perplexity", sources: [], matches: [] }, true, 200, { providers: [PROVIDERS.providers[1]], default: "perplexity" });
  render(<AnswerSearch />);
  await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.some(([url]) => url === "/api/pro-learn/providers")).toBe(true));
  expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
});

test("with AI Mode off the page says so without rendering a notes section", async () => {
  localStorage.setItem(AI_MODE_KEY, "off");
  respond({ answer: null, reason: "ai_mode_off", matches });
  render(<AnswerSearch initialQuestion="What is Turbopack?" />);

  expect(await screen.findByText(/AI Mode is off, so this question was answered from your own notes only/)).toBeVisible();
  expect(answerCalls()[0][1].body).toBe(JSON.stringify({ question: "What is Turbopack?", aiMode: false }));
  expect(screen.queryByRole("link", { name: /Turbopack/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "From your notes" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Step by step" })).not.toBeInTheDocument();
});

test("with no model configured the page still answers from the library", async () => {
  respond({ answer: null, reason: "ai_unavailable", matches });
  render(<AnswerSearch initialQuestion="What is Turbopack?" />);

  expect(await screen.findByText(/Reference generation is not configured/)).toBeVisible();
  expect(screen.queryByRole("region", { name: "From your notes" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Step by step" })).not.toBeInTheDocument();
});

test("a failed search explains itself and offers a retry", async () => {
  respond({ error: "rate_limited" }, false, 429);
  render(<AnswerSearch initialQuestion="How do I upgrade to Next.js 16?" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Too many learning requests");
  respond({ answer, provider: "anthropic", sources: [], matches: [] });
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("heading", { level: 2, name: /Run next upgrade/ })).toBeVisible();
});

test("a step that mixes source with commands shows each in its own block", async () => {
  const mixed = { ...answer, steps: [
    { title: "Upgrade and render", detail: "Raise the packages, then confirm the page still renders.",
      code: [
        "npm install next@latest react@latest react-dom@latest",
        "pnpm add next@latest react@latest react-dom@latest",
        "",
        "export default function Page() {",
        "  return <h1>Upgraded</h1>;",
        "}",
      ].join("\n") },
    answer.steps[2],
  ] };
  respond({ answer: mixed, provider: "perplexity", sources: [], matches: [] });
  render(<AnswerSearch initialQuestion="How do I upgrade to Next.js 16?" />);
  await screen.findByRole("heading", { level: 2, name: /Run next upgrade/ });

  const step = within(screen.getByRole("region", { name: "Step by step" })).getAllByRole("listitem")[0];
  // The install lines went to a terminal...
  const terminal = within(step).getByRole("figure", { name: "Terminal" });
  expect(terminal).toHaveTextContent("npm install next@latest");
  expect(terminal).toHaveTextContent("pnpm add next@latest");
  expect(terminal).not.toHaveTextContent("export default");
  // ...and the component stayed in the editor, with no commands mixed in.
  const editor = step.querySelector("pre")!;
  expect(editor.textContent).toBe(["export default function Page() {", "  return <h1>Upgraded</h1>;", "}"].join("\n"));
});

test("a question naming several services gets one section per service, each with its own key points", async () => {
  const subjects = [
    { name: "Amazon S3", summary: "Object storage for files of any size.", details: ["Stores objects in buckets.", "Charged per GB stored and per request."], keyPoints: ["Durability is 11 nines.", "Versioning is off by default."] },
    { name: "Amazon EC2", summary: "Resizable virtual machines.", details: ["Instances are billed per second.", "An AMI defines the starting disk image."], keyPoints: ["Stopping an instance still bills its EBS volume."] },
    { name: "AWS Lambda", summary: "Run a function without managing a server.", details: ["Billed per millisecond of execution."], keyPoints: ["A cold start adds latency to the first call.", "The default timeout is 3 seconds."] },
  ];
  respond({ answer: { ...answer, subjects }, provider: "perplexity", sources: [], matches: [] });
  render(<AnswerSearch />);
  ask("Explain S3, EC2 and Lambda");

  const region = await screen.findByRole("region", { name: "Each one explained" });
  // One section per service, in the order asked, each named.
  const names = within(region).getAllByRole("heading", { level: 4 });
  expect(names).toHaveLength(3);
  expect(names[0]).toHaveTextContent(/Amazon S3.*Simple Storage Service/);
  expect(names[1]).toHaveTextContent(/Amazon EC2.*Elastic Compute Cloud/);
  expect(names[2]).toHaveTextContent(/AWS.*Amazon Web Services.*Lambda/);
  const sections = names.map(heading => heading.closest("li") as HTMLElement);

  // Each section carries its own detail list and its own key points, not a shared one.
  const s3 = sections[0];
  expect(within(s3).getByText(/Object storage for files/)).toBeVisible();
  expect(within(s3).getByText(/Durability is 11 nines/)).toBeVisible();
  expect(within(s3).queryByText(/cold start/)).not.toBeInTheDocument();
  expect(within(sections[2]).getByText(/cold start/)).toBeVisible();
  expect(sections.map(item => item.querySelectorAll("h5").length)).toEqual([1, 1, 1]);

  // The count in the block title says how many are inside.
  expect(within(region).getByText("3")).toBeVisible();
});

test("a single-subject answer carries no per-service sections", async () => {
  respond({ answer, provider: "perplexity", sources: [], matches: [] });
  render(<AnswerSearch initialQuestion="How do I upgrade to Next.js 16?" />);
  await screen.findByRole("heading", { level: 2, name: /Run next upgrade/ });
  expect(screen.queryByRole("region", { name: "Each one explained" })).not.toBeInTheDocument();
});

test("an answer stored before the schema grew a field still opens", async () => {
  // Exactly what localStorage holds from a build that predates `subjects`.
  const older: Partial<typeof answer> = { ...answer };
  delete older.subjects;
  localStorage.setItem("masterclass:ai-search:cards", JSON.stringify([
    { id: "what is s3", question: "What is S3", at: Date.now(), status: "ready", result: { answer: older, provider: "perplexity", sources: [], matches: [] } },
  ]));
  respond({ answer, provider: "perplexity", sources: [], matches: [] });
  render(<AnswerSearch />);

  fireEvent.click(await screen.findByRole("button", { name: "Open What is S3" }));
  expect(await screen.findByRole("article", { name: "What is S3" })).toBeVisible();
  expect(screen.getByRole("heading", { level: 2, name: /Run next upgrade/ })).toBeVisible();
  expect(screen.queryByRole("region", { name: "Each one explained" })).not.toBeInTheDocument();
});

const AWS = [
  { name: "Amazon S3", category: "Storage", summary: "Object storage built to store and retrieve any amount of data." },
  { name: "Amazon EC2", category: "Compute", summary: "Resizable compute capacity in the cloud." },
  { name: "AWS Lambda", category: "Compute", summary: "Run code without provisioning or managing servers." },
];
/** Fourteen services: three pages of six, so paging and windowing both apply. */
const MANY = Array.from({ length: 14 }, (_, index) => ({
  name: `Service ${String(index + 1).padStart(2, "0")}`,
  category: index % 2 ? "Storage" : "Compute",
  summary: `What service ${index + 1} is for.`,
}));
const serviceRegion = () => screen.getByRole("region", { name: "Popular AWS services" });
const AI_TERMS = [
  { name: "RAG", category: "Retrieval & memory", summary: "Fetch the passages first, then answer from those." },
  { name: "Tokens", category: "Model foundations", summary: "The chunks a model reads and writes." },
];
const serviceCards = () => within(serviceRegion()).getAllByRole("listitem");

test("popular AWS services are offered as cards, and picking one asks about it", async () => {
  respondPerQuestion();
  render(<AnswerSearch awsServices={AWS} />);

  const region = screen.getByRole("region", { name: "Popular AWS services" });
  const cards = within(region).getAllByRole("listitem");
  expect(cards).toHaveLength(3);
  // Each card names the service, its category and what it is for.
  expect(cards[0]).toHaveTextContent("Storage");
  expect(cards[0]).toHaveTextContent("Amazon S3");
  expect(cards[0]).toHaveTextContent(/Object storage built to store/);

  // A card opens the prepared answer in the modal rather than spending a
  // request on a topic the catalogue already explains.
  fireEvent.click(within(cards[2]).getByRole("button", { name: "Explain this: AWS Lambda" }));
  await screen.findByRole("article", { name: "AWS Lambda · Compute" });
  expect(answerCalls()).toHaveLength(0);
});

test("with no services supplied the section is absent", () => {
  render(<AnswerSearch />);
  expect(screen.queryByRole("region", { name: "Popular AWS services" })).not.toBeInTheDocument();
});

test("the services grid shows six a page and pages through the rest", async () => {
  render(<AnswerSearch awsServices={MANY} />);
  expect(serviceCards()).toHaveLength(6);
  expect(serviceCards()[0]).toHaveTextContent("Service 01");
  expect(within(serviceRegion()).getByText("14 services")).toBeVisible();

  const pager = screen.getByRole("navigation", { name: "Popular AWS services pages" });
  expect(within(pager).getAllByRole("button", { name: /^Page \d+$/ })).toHaveLength(3);
  expect(within(pager).getByRole("button", { name: "Previous page" })).toBeDisabled();

  fireEvent.click(within(pager).getByRole("button", { name: "Next page" }));
  expect(serviceCards()[0]).toHaveTextContent("Service 07");

  // The last page carries the remainder and stops there.
  fireEvent.click(within(pager).getByRole("button", { name: "Page 3" }));
  expect(serviceCards()).toHaveLength(2);
  expect(within(pager).getByRole("button", { name: "Next page" })).toBeDisabled();
});

test("searching narrows the grid by name, category or purpose, and clearing restores it", () => {
  render(<AnswerSearch awsServices={AWS} />);
  const search = screen.getByRole("searchbox", { name: "Search Popular AWS services" });

  // By name.
  fireEvent.change(search, { target: { value: "lambda" } });
  expect(serviceCards()).toHaveLength(1);
  expect(serviceCards()[0]).toHaveTextContent("AWS Lambda");
  expect(within(serviceRegion()).getByText("1 of 3")).toBeVisible();

  // By category.
  fireEvent.change(search, { target: { value: "compute" } });
  expect(serviceCards()).toHaveLength(2);

  // By what it does, not what it is called.
  fireEvent.change(search, { target: { value: "retrieve any amount" } });
  expect(serviceCards()[0]).toHaveTextContent("Amazon S3");

  // Nothing matches: say so rather than showing an empty grid.
  fireEvent.change(search, { target: { value: "kubernetes" } });
  expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  expect(screen.getByText(/Nothing here matches/)).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: /Clear filters/ }));
  expect(serviceCards()).toHaveLength(3);
  expect(search).toHaveValue("");
  // The control only exists while there is something to clear.
  expect(screen.queryByRole("button", { name: /Clear filters/ })).not.toBeInTheDocument();
});

test("filtering from a later page returns to the first page of results", () => {
  render(<AnswerSearch awsServices={MANY} />);
  fireEvent.click(within(screen.getByRole("navigation", { name: "Popular AWS services pages" })).getByRole("button", { name: "Page 3" }));
  expect(serviceCards()[0]).toHaveTextContent("Service 13");

  fireEvent.change(screen.getByRole("searchbox", { name: "Search Popular AWS services" }), { target: { value: "Storage" } });
  // Page 3 of the old list would have been empty; the filter resets to the top.
  expect(serviceCards()[0]).toHaveTextContent("Service 02");
});

test("a long run of pages collapses to a window rather than a wall of buttons", () => {
  const lots = Array.from({ length: 78 }, (_, index) => ({ name: `Svc ${index + 1}`, category: "Compute", summary: "Does a thing." }));
  render(<AnswerSearch awsServices={lots} />);
  const pager = screen.getByRole("navigation", { name: "Popular AWS services pages" });
  // Thirteen pages, but never thirteen buttons.
  expect(within(pager).getAllByRole("button", { name: /^Page \d+$/ }).length).toBeLessThanOrEqual(7);
  // The first and last are always reachable in one click.
  expect(within(pager).getByRole("button", { name: "Page 1" })).toBeVisible();
  expect(within(pager).getByRole("button", { name: "Page 13" })).toBeVisible();
});

const CATS = [{ name: "Compute", count: 2 }, { name: "Storage", count: 1 }];

test("category tabs narrow the grid, and the search box narrows within the tab", () => {
  render(<AnswerSearch awsServices={AWS} awsCategories={CATS} />);
  const tabs = within(serviceRegion()).getAllByRole("tab");
  // "All" leads, then a tab per category, each carrying its count.
  expect(tabs.map(tab => tab.textContent)).toEqual(["All3", "Compute2", "Storage1"]);
  expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  expect(serviceCards()).toHaveLength(3);

  fireEvent.click(tabs[1]);
  expect(serviceCards()).toHaveLength(2);
  expect(serviceCards()[0]).toHaveTextContent("Amazon EC2");

  // The query narrows inside the selected tab, not across the whole catalogue.
  fireEvent.change(screen.getByRole("searchbox", { name: "Search Popular AWS services" }), { target: { value: "Amazon" } });
  expect(serviceCards()).toHaveLength(1);
  expect(serviceCards()[0]).toHaveTextContent("Amazon EC2");

  // Clearing the search keeps the tab; clearing filters resets both.
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(serviceCards()).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: /Clear filters/ }));
  expect(serviceCards()).toHaveLength(3);
  expect(within(serviceRegion()).getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
});

test("switching tab returns to the first page of that category", () => {
  const many = Array.from({ length: 8 }, (_, index) => ({ name: `Net ${index + 1}`, category: "Networking & Edge", summary: "Moves packets." }));
  render(<AnswerSearch awsServices={[...MANY, ...many]} awsCategories={[{ name: "Networking & Edge", count: 8 }]} />);
  fireEvent.click(within(screen.getByRole("navigation", { name: "Popular AWS services pages" })).getByRole("button", { name: "Page 2" }));
  expect(serviceCards()[0]).toHaveTextContent("Service 07");

  fireEvent.click(within(serviceRegion()).getAllByRole("tab")[1]);
  expect(serviceCards()[0]).toHaveTextContent("Net 1");
});

test("each card carries a mark before the service name", () => {
  render(<AnswerSearch awsServices={AWS} awsCategories={CATS} />);
  for (const card of serviceCards()) {
    const svg = card.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // Decorative: the name beside it is what gets announced.
    expect(svg).toHaveAttribute("aria-hidden", "true");
  }
  // A recognised service gets its own mark rather than its category's, so two
  // services in one category do not draw the same glyph.
  const [s3, ec2] = serviceCards();
  expect(s3.querySelector(".cardIcon svg")!.outerHTML).not.toBe(ec2.querySelector(".cardIcon svg")!.outerHTML);
});

test("the category strip pages four at a time and keeps All pinned", () => {
  const cats = ["Security & Identity", "AI & Machine Learning", "Analytics & Data Engineering", "Management & Governance",
    "Networking & Edge", "Databases", "Storage & Backup", "DevOps & CI/CD"].map((name, index) => ({ name, count: index + 1 }));
  render(<AnswerSearch awsServices={AWS} awsCategories={cats} />);
  const region = serviceRegion();
  const names = () => within(region).getAllByRole("tab").map(tab => tab.textContent);

  // All plus the first four categories; eight categories means two pages.
  expect(names()).toHaveLength(5);
  expect(names()[0]).toContain("All");
  expect(names()[1]).toContain("Security & Identity");
  expect(within(region).getByText("1/2")).toBeVisible();
  expect(within(region).getByRole("button", { name: "Previous categories" })).toBeDisabled();

  fireEvent.click(within(region).getByRole("button", { name: "More categories" }));
  // All survives the page turn; the categories behind it change.
  expect(names()[0]).toContain("All");
  expect(names()[1]).toContain("Networking & Edge");
  expect(names()).toHaveLength(5);
  expect(within(region).getByRole("button", { name: "More categories" })).toBeDisabled();

  // Clearing filters brings the strip home too.
  fireEvent.click(within(region).getAllByRole("tab")[1]);
  fireEvent.click(screen.getByRole("button", { name: /Clear filters/ }));
  expect(within(region).getByText("1/2")).toBeVisible();
  expect(names()[1]).toContain("Security & Identity");
});

test("each category tab carries its own mark", () => {
  const cats = [{ name: "Networking & Edge", count: 3 }, { name: "AI & Machine Learning", count: 4 }];
  render(<AnswerSearch awsServices={AWS} awsCategories={cats} />);
  const tabs = within(serviceRegion()).getAllByRole("tab");
  for (const tab of tabs) expect(tab.querySelector("svg")).toBeInTheDocument();
  // Different categories draw different glyphs rather than one generic icon.
  expect(tabs[1].querySelector("svg")!.outerHTML).not.toBe(tabs[2].querySelector("svg")!.outerHTML);
});

test("the AI glossary is its own browser beside the services, with the same controls", () => {
  render(<AnswerSearch awsServices={AWS} awsCategories={CATS}
    aiGlossary={AI_TERMS} aiGlossaryCategories={[{ name: "Retrieval & memory", count: 1 }, { name: "Model foundations", count: 1 }]} />);

  // The strip is alphabetical, so the glossary is the tab that opens; the
  // services are the tab beside it, not a second browser stacked underneath.
  expect(sectionTabs()).toEqual(["AI terms worth knowing", "Popular AWS services"]);
  const glossary = screen.getByRole("region", { name: "AI terms worth knowing" });
  expect(within(glossary).getAllByRole("listitem")).toHaveLength(2);
  expect(within(glossary).getByText("2 terms")).toBeVisible();

  // Opening one closes the other: a tab strip, not a stack.
  expect(screen.queryByRole("region", { name: "Popular AWS services" })).not.toBeInTheDocument();
  expect(within(glossary).getByRole("searchbox", { name: "Search AI terms worth knowing" })).toBeVisible();
  // The catalogue keeps its own category tabs inside the section tab.
  expect(within(glossary).getAllByRole("tab").map(tab => tab.textContent)).toEqual(["All2", "Retrieval & memory1", "Model foundations1"]);

  // And the services are one click away, with the controls they always had.
  expect(within(openSection("Popular AWS services")).getByRole("searchbox", { name: "Search Popular AWS services" })).toBeVisible();
});

test("filtering one catalogue leaves the other alone", () => {
  render(<AnswerSearch awsServices={AWS} awsCategories={CATS}
    aiGlossary={AI_TERMS} aiGlossaryCategories={[{ name: "Retrieval & memory", count: 1 }]} />);

  const glossary = openSection("AI terms worth knowing");
  fireEvent.change(within(glossary).getByRole("searchbox", { name: "Search AI terms worth knowing" }), { target: { value: "passages" } });
  expect(within(glossary).getAllByRole("listitem")).toHaveLength(1);
  expect(within(glossary).getAllByRole("listitem")[0]).toHaveTextContent("RAG");

  // Going back leaves the services grid as it was: each catalogue filters itself.
  openSection("Popular AWS services");
  expect(serviceCards()).toHaveLength(3);
});

test("picking a term asks about it in the glossary's own words", async () => {
  respondPerQuestion();
  render(<AnswerSearch aiGlossary={AI_TERMS} aiGlossaryCategories={[{ name: "Retrieval & memory", count: 1 }]} />);
  const glossary = screen.getByRole("region", { name: "AI terms worth knowing" });

  fireEvent.click(within(within(glossary).getAllByRole("listitem")[0]).getByRole("button", { name: "Explain this: RAG" }));
  await screen.findByRole("article", { name: "RAG · Retrieval & memory" });
  expect(answerCalls()).toHaveLength(0);
});

test("each glossary card carries its own mark", () => {
  render(<AnswerSearch aiGlossary={AI_TERMS} aiGlossaryCategories={[{ name: "Retrieval & memory", count: 1 }]} />);
  const cards = within(screen.getByRole("region", { name: "AI terms worth knowing" })).getAllByRole("listitem");
  for (const card of cards) expect(card.querySelector(".cardIcon svg")).toBeInTheDocument();
  expect(cards[0].querySelector(".cardIcon svg")!.outerHTML).not.toBe(cards[1].querySelector(".cardIcon svg")!.outerHTML);
});

test("with no glossary supplied the section is absent", () => {
  render(<AnswerSearch awsServices={AWS} awsCategories={CATS} />);
  expect(screen.queryByRole("region", { name: "AI terms worth knowing" })).not.toBeInTheDocument();
});

const PY = [
  { name: "Decorators", category: "Functions", summary: "A function that wraps another and replaces it." },
  { name: "Lists", category: "Collections", summary: "Ordered, mutable sequences." },
];

test("the Python handbook is a third browser below the glossary", async () => {
  respondPerQuestion();
  render(<AnswerSearch awsServices={AWS} awsCategories={CATS}
    aiGlossary={AI_TERMS} aiGlossaryCategories={[{ name: "Retrieval & memory", count: 1 }]}
    pythonHandbook={PY} pythonCategories={[{ name: "Functions", count: 1 }, { name: "Collections", count: 1 }]} />);

  // Alphabetical, so a reader looking for one knows where to look for it.
  expect(sectionTabs()).toEqual(["AI terms worth knowing", "Popular AWS services", "Python handbook"]);

  const python = openSection("Python handbook");
  expect(within(python).getByText("2 topics")).toBeVisible();
  expect(within(python).getAllByRole("listitem")).toHaveLength(2);

  // Its own search box and tabs, independent of the other two.
  fireEvent.change(within(python).getByRole("searchbox", { name: "Search Python handbook" }), { target: { value: "wraps" } });
  expect(within(python).getAllByRole("listitem")).toHaveLength(1);
  expect(within(openSection("Popular AWS services")).getAllByRole("listitem")).toHaveLength(3);
  expect(within(openSection("AI terms worth knowing")).getAllByRole("listitem")).toHaveLength(2);

  // A card asks a Python-shaped question, not the glossary's or the services'.
  const reopened = openSection("Python handbook");
  fireEvent.click(within(within(reopened).getAllByRole("listitem")[0]).getByRole("button", { name: /^Explain this: / }));
  await screen.findByRole("article", { name: /^Decorators/ });
  expect(answerCalls()).toHaveLength(0);
});

test("with no handbook supplied the section is absent", () => {
  render(<AnswerSearch awsServices={AWS} awsCategories={CATS} />);
  expect(screen.queryByRole("region", { name: "Python handbook" })).not.toBeInTheDocument();
});
