import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepByStep, filterCards, CARDS_PER_PAGE, CARD_TONES, TECHNOLOGIES_PER_PAGE, type Filters, type StepCard } from "@/components/step-by-step";
import { Workspace } from "@/components/workspace";
import { STEP_GUIDES, bestGuide } from "@/lib/step-by-step/guides";
import { guideMatchesTechnology, technologyTerms } from "@/lib/step-by-step/technologies";
import { guideInterviewSchema, stepGuideSchema } from "@/lib/step-by-step/types";
import { interviewForGuide } from "@/lib/step-by-step/interview";

jest.mock("next/navigation", () => ({ usePathname: () => "/dashboard/step-by-step", useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }));
jest.mock("@/lib/client", () => ({ requestJson: jest.fn(), errorKey: () => "service_error" }));

beforeEach(() => { localStorage.clear(); });
// Each page test renders the whole page, and some open a full answer with the code viewer.
jest.setTimeout(15000);

// A slice of the Search page's list, in its order: three fixed catalogues, then handbooks.
const TECHNOLOGIES = ["Popular AWS services", "AI terms worth knowing", "Python handbook", "Docker", "Jest — Unit Testing, Mocks & Coverage",
  "Kubernetes", "Next.js 16+ — Routing, Rendering & Caching", "Node.js — Runtime, APIs, Streams & Operations"];

describe("built-in guides", () => {
  test.each(STEP_GUIDES.map(guide => [guide.id, guide] as const))("%s has valid interview questions with a single correct option", (_id, guide) => {
    expect(guideInterviewSchema.safeParse(interviewForGuide(guide)).success).toBe(true);
  });

  test("invalid generated options fall back to guide-based practice without breaking saved guides", () => {
    const interview = interviewForGuide(STEP_GUIDES[0]);
    const invalid = { ...interview, objective: [{ ...interview.objective[0], correctIndex: 4 }] };
    const parsed = stepGuideSchema.parse({ ...STEP_GUIDES[0], interview: invalid });
    expect(parsed.interview).toBeUndefined();
    expect(interviewForGuide(parsed).objective.length).toBeGreaterThan(0);
  });
  test.each(STEP_GUIDES.map(guide => [guide.id, guide] as const))("%s is complete", (_id, guide) => {
    expect(stepGuideSchema.safeParse(guide).success).toBe(true);
    expect(guide.files.length).toBeGreaterThanOrEqual(2);
    expect(guide.steps.some(step => step.commands.length)).toBe(true);
    const paths = new Set(guide.files.map(file => file.path));
    // A step that names a file must point at a tab in the codebase.
    for (const step of guide.steps) if (step.file) expect(paths).toContain(step.file);
    // Every guide contrasts two technologies, one value per side for every difference.
    expect(guide.comparison?.items).toHaveLength(2);
    for (const difference of guide.comparison!.differences) expect(difference.values).toHaveLength(2);
  });

  test("a malformed comparison drops out instead of failing the answer, and old answers without one still load", () => {
    const { comparison, ...withoutComparison } = STEP_GUIDES[0];
    void comparison;
    expect(stepGuideSchema.parse(withoutComparison).comparison).toBeNull();
    const lopsided = { ...STEP_GUIDES[0], comparison: { ...STEP_GUIDES[0].comparison!, differences: [{ aspect: "Speed", values: ["fast", "slow", "extra"] }, { aspect: "Scope", values: ["a", "b"] }] } };
    const parsed = stepGuideSchema.safeParse(lopsided);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.comparison).toBeNull();
  });

  test.each(STEP_GUIDES.map(guide => [guide.id, guide] as const))("%s teaches pointwise, with core features and real use cases in full", (_id, guide) => {
    expect(guide.definitionPoints.length).toBeGreaterThanOrEqual(3);
    expect(guide.answerPoints.length).toBeGreaterThanOrEqual(3);
    expect(guide.features.length).toBeGreaterThanOrEqual(4);
    expect(guide.useCases.length).toBeGreaterThanOrEqual(2);
    for (const useCase of guide.useCases) {
      expect(useCase.points.length).toBeGreaterThanOrEqual(2);
      for (const file of useCase.files) {
        // A full implementation: real code, nothing elided.
        expect(file.code.trim().length).toBeGreaterThan(20);
        expect(file.code).not.toMatch(/\.\.\.\s*$|\/\/ \.\.\.|TODO/m);
      }
    }
  });

  test("answers saved before pointwise content existed still load, with empty lists", () => {
    const { definitionPoints, answerPoints, features, useCases, ...old } = STEP_GUIDES[0];
    void definitionPoints; void answerPoints; void features; void useCases;
    const parsed = stepGuideSchema.parse(old);
    expect(parsed).toMatchObject({ definitionPoints: [], answerPoints: [], features: [], useCases: [] });
  });

  test("ids are unique", () => {
    expect(new Set(STEP_GUIDES.map(guide => guide.id)).size).toBe(STEP_GUIDES.length);
  });

  test("matches questions to the right guide and rejects unrelated ones", () => {
    expect(bestGuide("add JWT authentication to express with bcrypt")?.id).toBe("express-jwt-auth");
    expect(bestGuide("dockerize my node app with compose")?.id).toBe("docker-node-app");
    expect(bestGuide("fastapi crud api in python")?.id).toBe("python-fastapi-crud");
    expect(bestGuide("explain photosynthesis in plants")).toBeNull();
    expect(bestGuide("add JWT authentication to express", "Python")).toBeNull();
  });
});

describe("technology matching", () => {
  test("a catalogue title reduces to the words that name its technology", () => {
    expect(technologyTerms("Next.js 16+ — Routing, Rendering & Caching")).toEqual(["next.js"]);
    expect(technologyTerms("Popular AWS services")).toEqual(["aws"]);
    expect(technologyTerms("Python handbook")).toEqual(["python"]);
    expect(technologyTerms("System Design")).toEqual(["system", "design"]);
  });

  test("cards match on whole words of their question, category and tags", () => {
    const guide = (id: string) => STEP_GUIDES.find(item => item.id === id)!;
    expect(guideMatchesTechnology(guide("docker-node-app").question, guide("docker-node-app"), "Docker")).toBe(true);
    expect(guideMatchesTechnology(guide("jest-react-testing").question, guide("jest-react-testing"), "Jest — Unit Testing, Mocks & Coverage")).toBe(true);
    expect(guideMatchesTechnology(guide("nextjs-protected-routes").question, guide("nextjs-protected-routes"), "Next.js 16+ — Routing, Rendering & Caching")).toBe(true);
    expect(guideMatchesTechnology(guide("docker-node-app").question, guide("docker-node-app"), "Kubernetes")).toBe(false);
    // "ai" must not match inside "email" or "again".
    expect(guideMatchesTechnology("How do I send an email again?", undefined, "AI terms worth knowing")).toBe(false);
  });
});

describe("filterCards", () => {
  const cards: StepCard[] = STEP_GUIDES.map(({ id, ...guide }, index) => ({ id, question: guide.question, at: index, origin: "built-in", status: "ready", guide }));
  const none: Filters = { text: "", technology: "", level: "all", origin: "all", sort: "recent" };

  test("filters by technology, level, text and source", () => {
    expect(filterCards(cards, { ...none, technology: "Python handbook" }).map(card => card.id)).toEqual(["python-fastapi-crud"]);
    expect(filterCards(cards, { ...none, technology: "Kubernetes" })).toEqual([]);
    expect(filterCards(cards, { ...none, level: "advanced" }).map(card => card.id)).toEqual(["express-jwt-auth"]);
    expect(filterCards(cards, { ...none, text: "docker compose" }).map(card => card.id)).toEqual(["docker-node-app"]);
    expect(filterCards(cards, { ...none, origin: "asked" })).toEqual([]);
  });

  test("sorts A-Z", () => {
    const sorted = filterCards(cards, { ...none, sort: "az" }).map(card => card.question);
    expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)));
  });
});

describe("StepByStep page", () => {
  const cardsRegion = () => screen.getByRole("region", { name: "Your step-by-step cards" });
  const cardsIn = () => within(cardsRegion()).queryAllByRole("article");
  const techTabs = () => within(screen.getByRole("tablist", { name: "Filter cards by technology" })).getAllByRole("tab");

  test("cards and pagination sit above the search panel, and every control is a shadcn component", () => {
    const { container } = render(<StepByStep technologies={TECHNOLOGIES} />);
    const search = screen.getByRole("region", { name: "Ask anything. Build it step by step." });
    expect(cardsRegion().compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(cardsRegion()).getByRole("navigation", { name: "Step by step result pages" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /^AI Mode (on|off)$/ })).toHaveAttribute("data-slot", "switch");
    for (const name of ["Filter by level", "Filter by card type", "Sort cards"]) expect(screen.getByRole("combobox", { name })).toHaveAttribute("data-slot", "native-select");
    expect(screen.getByRole("textbox", { name: "Your question" })).toHaveAttribute("data-slot", "input-group-control");
    expect(screen.getByRole("textbox", { name: "Search cards" }).closest("[data-slot=input-group]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Get steps" })).toHaveAttribute("data-slot", "button");
    expect(techTabs()[0]).toHaveAttribute("data-slot", "tabs-tab");
    expect(container.querySelectorAll("[data-slot=card]")).toHaveLength(CARDS_PER_PAGE);
    // No raw, unstyled form controls slip onto the page (Base UI's hidden form inputs aside).
    container.querySelectorAll("button, input:not([aria-hidden=true]), select, textarea").forEach(element => {
      expect(element.closest("[data-slot]")).not.toBeNull();
    });
  });

  test("shows two cards per page with pagination", async () => {
    const user = userEvent.setup();
    render(<StepByStep technologies={TECHNOLOGIES} />);
    expect(CARDS_PER_PAGE).toBe(2);
    expect(cardsIn()).toHaveLength(2);
    const pager = screen.getByRole("navigation", { name: "Step by step result pages" });
    await user.click(within(pager).getByRole("button", { name: "Page 2" }));
    expect(within(pager).getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(cardsIn()).toHaveLength(2);
  });

  test("lists the Search page technologies as tabs, three per page", async () => {
    const user = userEvent.setup();
    render(<StepByStep technologies={TECHNOLOGIES} />);
    expect(TECHNOLOGIES_PER_PAGE).toBe(3);
    expect(techTabs().map(tab => tab.textContent)).toEqual(TECHNOLOGIES.slice(0, 3));
    expect(screen.getByText("1/3")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "More technologies" }));
    expect(techTabs().map(tab => tab.textContent)).toEqual(TECHNOLOGIES.slice(3, 6));
    await user.click(screen.getByRole("button", { name: "More technologies" }));
    expect(techTabs().map(tab => tab.textContent)).toEqual(TECHNOLOGIES.slice(6));
    expect(screen.getByRole("button", { name: "More technologies" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Previous technologies" }));
    expect(screen.getByText("2/3")).toBeVisible();
  });

  test("a technology tab narrows the cards, and All brings them back", async () => {
    const user = userEvent.setup();
    render(<StepByStep technologies={TECHNOLOGIES} />);
    await user.click(screen.getByRole("tab", { name: "Python handbook" }));
    expect(screen.getByRole("tab", { name: "Python handbook" })).toHaveAttribute("aria-selected", "true");
    expect(cardsIn().map(card => card.getAttribute("aria-label"))).toEqual([expect.stringMatching(/FastAPI/)]);
    await user.click(screen.getByRole("button", { name: "All" }));
    expect(cardsIn()).toHaveLength(CARDS_PER_PAGE);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  test("a technology with no cards offers to ask about it, and the question carries that technology", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ guide: null, source: "library", reason: "ai_unavailable" }) });
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<StepByStep technologies={TECHNOLOGIES} />);
    await user.click(screen.getByRole("button", { name: "More technologies" }));
    await user.click(screen.getByRole("tab", { name: "Kubernetes" }));
    expect(cardsIn()).toHaveLength(0);
    expect(within(cardsRegion()).getByText(/No step-by-step cards for/)).toHaveTextContent("Kubernetes");
    await user.click(screen.getByRole("button", { name: "Ask about Kubernetes" }));
    expect(screen.getByRole("textbox", { name: "Your question" })).toHaveValue("How do I get started with Kubernetes, step by step?");
    expect(screen.getByText("About Kubernetes")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Get steps" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).options).toMatchObject({ technology: "Kubernetes" });
  });

  test("the card search filters the cards", async () => {
    const user = userEvent.setup();
    render(<StepByStep technologies={TECHNOLOGIES} />);
    await user.type(screen.getByRole("textbox", { name: "Search cards" }), "jwt");
    expect(cardsIn()).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(cardsIn()).toHaveLength(CARDS_PER_PAGE);
  });

  test("every card on a page has its own light colour", async () => {
    const user = userEvent.setup();
    render(<StepByStep technologies={TECHNOLOGIES} />);
    const tints = () => cardsIn().map(card => card.style.getPropertyValue("--tone"));
    expect(new Set(tints()).size).toBe(CARDS_PER_PAGE);
    const firstPage = tints();
    await user.click(screen.getByRole("button", { name: "Page 2" }));
    expect(new Set(tints()).size).toBe(CARDS_PER_PAGE);
    expect(tints().some(tint => firstPage.includes(tint))).toBe(false);
    expect(CARD_TONES.map(tone => tone.bg)).toEqual(expect.arrayContaining(firstPage));
  });

  test("opening a card shows definition, steps with commands, codebase tabs and key information", async () => {
    const user = userEvent.setup();
    render(<StepByStep technologies={TECHNOLOGIES} />);
    await user.type(screen.getByRole("textbox", { name: "Search cards" }), "multi-stage");
    await user.click(screen.getByRole("button", { name: "View steps" }));
    const detail = screen.getByRole("article", { name: /^Step by step answer: .*dockerize a Node.js app/ });
    expect(within(detail).getByRole("heading", { name: /Definition & answer/ })).toBeVisible();
    expect(within(detail).getByRole("heading", { name: /How to implement it, step by step/ })).toBeVisible();
    expect(within(detail).getByText("docker build -t node-app .")).toBeVisible();
    expect(within(detail).getByText("Builds the image from the Dockerfile in this folder.")).toBeVisible();
    const tabs = within(detail).getByRole("tablist", { name: "Complete codebase files" });
    expect(within(tabs).getByRole("tab", { name: "Dockerfile" })).toBeVisible();
    expect(within(detail).getByRole("heading", { name: /Key information/ })).toBeVisible();
  });

  test("features have distinct tints and objective answers appear only after selecting an option", async () => {
    const user = userEvent.setup();
    render(<StepByStep technologies={TECHNOLOGIES} />);
    await user.type(screen.getByRole("textbox", { name: "Search cards" }), "multi-stage");
    await user.click(screen.getByRole("button", { name: "View steps" }));
    const features = screen.getByRole("region", { name: /Key features/ });
    const cards = within(features).getAllByRole("listitem");
    expect(new Set(cards.map(card => card.style.getPropertyValue('--tone'))).size).toBe(cards.length);
    expect(cards.every(card => card.querySelector('mark'))).toBe(true);
    const subjective = screen.getByRole("region", { name: /Most asked in interviews: Subjective/ });
    await user.click(subjective.querySelector('summary')!);
    expect(within(subjective.querySelector('details')!).getByRole('list', { name: 'Subjective answer key points' })).toBeVisible();
    const objective = screen.getByRole("region", { name: /Most asked in interviews: Objective/ }).querySelector('details')!;
    await user.click(objective.querySelector('summary')!);
    expect(within(objective).queryByText('Answer & key points')).not.toBeInTheDocument();
    const question = interviewForGuide(STEP_GUIDES.find(guide => guide.id === 'docker-node-app')!).objective[0];
    const options = within(objective).getAllByRole('radio');
    const incorrect = (question.correctIndex + 1) % options.length;
    await user.click(options[incorrect]);
    expect(within(objective).getByRole('status')).toHaveTextContent('Not quite. Correct answer:');
    expect(within(objective).getByRole('list', { name: 'Objective answer key points' })).toBeVisible();
    await user.click(within(objective).getByText('Answer & key points'));
    expect(within(objective).getByRole('list', { name: 'Objective answer key points' })).not.toBeVisible();
    await user.click(options[question.correctIndex]);
    expect(within(objective).getByRole('status')).toHaveTextContent(/^Correct\./);
    expect(within(objective).getByRole('list', { name: 'Objective answer key points' })).toBeVisible();
  });

  test("the answer teaches point by point, lists key features and shows real use cases with their full code, all justified", async () => {
    const user = userEvent.setup();
    render(<StepByStep technologies={TECHNOLOGIES} />);
    await user.type(screen.getByRole("textbox", { name: "Search cards" }), "multi-stage");
    await user.click(screen.getByRole("button", { name: "View steps" }));
    const detail = screen.getByRole("article", { name: /^Step by step answer: .*dockerize a Node.js app/ });
    const guide = STEP_GUIDES.find(item => item.id === "docker-node-app")!;
    expect(within(within(detail).getByRole("list", { name: "Definition, point by point" })).getAllByRole("listitem")).toHaveLength(guide.definitionPoints.length);
    expect(within(detail).getByRole("list", { name: "Answer, point by point" })).toBeVisible();
    expect(within(detail).getByRole("heading", { name: /Key features/ })).toBeVisible();
    expect(within(detail).getByRole("heading", { name: "Layer caching" })).toBeVisible();
    expect(within(detail).getByRole("heading", { name: /Real use cases with full code/ })).toBeVisible();
    const useCase = within(detail).getByRole("article", { name: "Use case: App and PostgreSQL with a health-gated start" });
    expect(within(useCase).getByRole("tab", { name: "compose.yaml" })).toBeVisible();
    // Sections are numbered in reading order.
    expect(within(detail).getAllByRole("heading", { level: 3 }).map(heading => heading.textContent)).toEqual([
      "1Definition & answer", "2Key features", "3How to implement it, step by step", "4Complete codebase", "5Real use cases with full code", expect.stringMatching(/^6Differences/), "7Key information", "8Most asked in interviews: Subjective questions", "9Most asked in interviews: Objective questions",
    ]);
    expect(within(detail).getByText(guide.definition).closest("p")).toHaveClass("prose");
  });

  test("Steps at a glance is a bulleted list with one point per step", async () => {
    const user = userEvent.setup();
    render(<StepByStep technologies={TECHNOLOGIES} />);
    await user.type(screen.getByRole("textbox", { name: "Search cards" }), "multi-stage");
    await user.click(screen.getByRole("button", { name: "View steps" }));
    const glance = screen.getByRole("list", { name: "Steps at a glance" });
    expect(glance.tagName).toBe("UL");
    const docker = STEP_GUIDES.find(guide => guide.id === "docker-node-app")!;
    expect(within(glance).getAllByRole("listitem").map(item => item.textContent)).toEqual(docker.steps.map(step => step.title));
  });

  test("differences show each technology on its own card and each point of difference on its own card", async () => {
    const user = userEvent.setup();
    render(<StepByStep technologies={TECHNOLOGIES} />);
    await user.type(screen.getByRole("textbox", { name: "Search cards" }), "multi-stage");
    await user.click(screen.getByRole("button", { name: "View steps" }));
    const section = screen.getByRole("region", { name: /Differences: Docker Compose vs Kubernetes/ });
    const compose = within(section).getByRole("article", { name: "Docker Compose" });
    const kubernetes = within(section).getByRole("article", { name: "Kubernetes" });
    expect(within(compose).getByText("Local development and small single-server deployments.")).toBeVisible();
    expect(within(kubernetes).getAllByRole("listitem").length).toBeGreaterThanOrEqual(2);
    // The two technology cards are tinted differently.
    expect(compose.style.getPropertyValue("--tone")).not.toBe(kubernetes.style.getPropertyValue("--tone"));
    const scaling = within(section).getByRole("article", { name: "Difference: Scaling" });
    // Backticked identifiers render as inline code, not as literal backticks.
    expect(scaling).toHaveTextContent("Manual, --scale on one host");
    expect(within(scaling).getByText("--scale").tagName).toBe("CODE");
    expect(scaling.textContent).not.toContain("`");
    expect(within(scaling).getByText("Declarative replicas and autoscaling")).toBeVisible();
    const docker = STEP_GUIDES.find(guide => guide.id === "docker-node-app")!;
    expect(within(section).getAllByRole("article", { name: /^Difference: / })).toHaveLength(docker.comparison!.differences.length);
    // Sections renumber around the new one: Differences is 6th, Key information 7th.
    expect(within(section).getByRole("heading", { level: 3 })).toHaveTextContent(/^6Differences/);
    expect(screen.getByRole("heading", { level: 3, name: /Key information/ })).toHaveTextContent(/^7/);
  });

  test("Enter in the composer asks the question, which becomes the first card; Clear search empties it", async () => {
    const user = userEvent.setup();
    const guide = STEP_GUIDES[0];
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ guide: { ...guide, question: "How do I guard admin pages?" }, source: "ai" }) });
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<StepByStep technologies={TECHNOLOGIES} />);
    await user.click(screen.getByRole("button", { name: /Advanced search/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Level" }), "advanced");
    const input = screen.getByRole("textbox", { name: "Your question" });
    await user.click(input);
    await user.paste("How do I guard admin pages?");
    await user.keyboard("{Enter}");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ question: "How do I guard admin pages?", options: { level: "advanced" } });
    expect(await screen.findByRole("heading", { level: 2, name: "How do I guard admin pages?" }, { timeout: 4000 })).toBeVisible();
    expect(cardsIn()[0]).toHaveAccessibleName("How do I guard admin pages?");
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input).toHaveValue("");
  });

  test("Shift+Enter adds a line instead of asking", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<StepByStep technologies={TECHNOLOGIES} />);
    const input = screen.getByRole("textbox", { name: "Your question" });
    await user.click(input);
    await user.paste("First line");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(input).toHaveValue("First line\n");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("an unanswerable question shows why on its card", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ guide: null, source: "library", reason: "ai_unavailable" }) }) as unknown as typeof fetch;
    render(<StepByStep technologies={TECHNOLOGIES} />);
    await user.click(screen.getByRole("textbox", { name: "Your question" }));
    await user.paste("explain photosynthesis");
    await user.click(screen.getByRole("button", { name: "Get steps" }));
    expect(await screen.findByRole("alert", {}, { timeout: 4000 })).toHaveTextContent("No AI provider is configured");
  });

  test("each card provides Edit question and Regenerate answer options to update and regenerate", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ guide: STEP_GUIDES[0], source: "library" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<StepByStep technologies={TECHNOLOGIES} />);
    const firstCard = cardsIn()[0];
    expect(firstCard).toBeInTheDocument();

    const editButton = within(firstCard).getByRole("button", { name: "Edit question" });
    const regenerateButton = within(firstCard).getByRole("button", { name: "Regenerate answer" });
    expect(editButton).toBeVisible();
    expect(regenerateButton).toBeVisible();

    // Clicking Edit question enables inline question editing
    await user.click(editButton);
    const editTextarea = within(firstCard).getByRole("textbox", { name: "Edit question" });
    expect(editTextarea).toBeVisible();
    expect(within(firstCard).getByRole("button", { name: "Cancel" })).toBeVisible();

    // Modifying the question and regenerating
    await user.clear(editTextarea);
    await user.paste("How do I configure role based routes in Next.js?");
    const saveRegenerateBtn = within(firstCard).getByRole("button", { name: "Regenerate answer" });
    await user.click(saveRegenerateBtn);

    expect(fetchMock).toHaveBeenCalled();
    const lastCallBody = JSON.parse(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][1].body);
    expect(lastCallBody.question).toBe("How do I configure role based routes in Next.js?");

    // Clicking direct Regenerate answer on a card triggers answer generation for that card
    fetchMock.mockClear();
    const directRegenerate = screen.getAllByRole("button", { name: "Regenerate answer" })[0];
    await user.click(directRegenerate);
    expect(fetchMock).toHaveBeenCalled();
  });
});

test("the dashboard sidebar links to On The Go", () => {
  render(<Workspace authEnabled={false} configured={false} billingEnabled={false} initialCategory="step-by-step" notesContent={<section aria-label="Step content">Steps</section>} />);
  const link = screen.getByRole("link", { name: "On The Go" });
  expect(link).toHaveAttribute("href", "/dashboard/step-by-step");
  expect(link).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("region", { name: "Step content" })).toBeVisible();
});
