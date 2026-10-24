/**
 * Generate the pictures for the learning cards: one per vocabulary word
 * (`--set vocabulary`), AWS service (`--set aws`), Search topic card — AI terms,
 * Python and every technology handbook (`--set topics`), API reference package
 * and entry (`--set api`), agentic workflow (`--set workflow`), Official Docs
 * technology (`--set docs`), study note (`--set notes`), Pro lesson
 * (`--set lessons`), step-by-step guide and Techy deck (`--set guides`) or
 * learning path on /courses (`--set courses`).
 *
 * Per card: Claude designs a scene whose focal moment is the meaning
 * (scripts/card-art-director.ts), the image model paints it through the Vercel
 * AI Gateway, and Claude looks at the result. A picture a learner could not read
 * the meaning from, or one with lettering in it, is redrawn from a new scene
 * that answers the critique — up to --attempts times (default 4), until one
 * scores 5/5. The best try is published only if it scores at least --min-score
 * (default 4) with no lettering; otherwise the card is left without a picture
 * (and with --replace its old one is removed), because a picture that does not
 * match its topic misteaches. A published keeper is shrunk to WebP and uploaded to the set's public Supabase Storage
 * bucket, named by slug; the cards find it through the set's NEXT_PUBLIC_* base
 * URL (lib/vocabulary-image.ts, lib/aws-service-image.ts, lib/learning-image.ts;
 * every set after those two shares one bucket, a folder each).
 *
 * The run is resumable: cards whose file is already in the bucket are skipped,
 * and so are cards the report shows were rejected (--retry-rejected retries them),
 * so a crash, a rate limit or a deliberate --limit just means running it again.
 * Every card's scenes and verdicts are appended to --report (JSON lines).
 *
 *   npm run images:vocabulary -- --dry-run --only knell,frugal   # design scenes only, no images
 *   npm run images:aws -- --only "Amazon S3,AWS Lambda"          # a couple of cards
 *   npm run images:vocabulary -- --limit 50                      # the next 50 missing
 *   npm run images:aws                                           # everything still missing
 *   npm run images:vocabulary -- --only knell --replace          # redo one that has a picture
 *   npm run images:api -- --packages langchain,langgraph         # only these API packages
 *
 * Needs AI_GATEWAY_API_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY,
 * plus ANTHROPIC_API_KEY unless VOCABULARY_DIRECTOR_VIA_GATEWAY=1. CARD_IMAGE_MODEL
 * picks the image model (default below). --rpm caps image requests per minute
 * (default 5, the gateway limit for this team); rate-limit rejections are waited
 * out, not counted as failures.
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { gateway, generateImage } from "ai";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { ENGLISH_EXAM_VOCABULARY } from "../lib/pro-learn/english-exam-vocabulary";
import { awsHighlights } from "../lib/pro-learn/aws-highlights";
import { VOCABULARY_IMAGE_BUCKET, vocabularyImageSlug, vocabularyScenePrompt } from "../lib/vocabulary-image";
import { AWS_SERVICE_IMAGE_BUCKET, awsServiceImageSlug, awsServiceScenePrompt } from "../lib/aws-service-image";
import { aiTerms } from "../lib/pro-learn/ai-glossary";
import { pythonTopics } from "../lib/pro-learn/python-handbook";
import { TECHNOLOGY_HANDBOOKS } from "../lib/pro-learn/technology-handbooks";
import { API_PACKAGES, API_TYPES } from "../lib/api-docs";
import { API_DETAILS } from "../lib/api-docs-details";
import { WORKFLOW_USECASES } from "../lib/workflow-usecases";
import { OFFICIAL_DOCS } from "../lib/official-docs-data";
import lessonsData from "../lib/pro-learn/lessons.json";
import { PRO_TRACKS } from "../lib/pro-learn/types";
import { STEP_GUIDES } from "../lib/step-by-step/guides";
import { TECHY_TOPICS } from "../lib/techy-content";
import { AI_PULSE } from "../lib/landing-ai-pulse";
import { WORKFLOWS } from "../lib/landing-workflows";
import { INTERVIEW_TECHS } from "../lib/interview-bank";
import { COMPARISONS } from "../lib/comparisons";
import { CATEGORY_LABELS, PREPARATIONS, PREPARATION_GROUPS } from "../lib/study/preparations";
import { COURSE_SUMMARIES } from "../lib/study/course-summaries";
import { LEARNING_IMAGE_BUCKET, learningImageSlug, learningScenePrompt } from "../lib/learning-image";
import { designScene, designServiceScene, designTopicScene, judgePicture, judgeServicePicture, judgeTopicPicture, type Scene, type TopicField, type Verdict } from "./card-art-director";

// gpt-image-2 draws the designed scene faithfully enough for abstract topics
// (a grounded tower beside one on a crumbling cloud) to pass the strict review;
// gpt-image-1-mini is cheaper but lost the point of most of those scenes.
const MODEL = process.env.CARD_IMAGE_MODEL || process.env.VOCABULARY_IMAGE_MODEL || "openai/gpt-image-2";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? undefined : (args[at + 1] ?? "");
};
const dryRun = args.includes("--dry-run");
const replace = args.includes("--replace");
const retryRejected = args.includes("--retry-rejected");
const limit = Number(flag("limit") ?? Infinity);
const concurrency = Math.max(1, Number(flag("concurrency") ?? 4));
// The gateway caps image requests per minute per model (5 on this team's plan
// for gpt-image-1-mini), so requests are started no faster than that; going
// over only buys rejections. Raise --rpm if the team's limit is raised.
const rpm = Math.max(1, Number(flag("rpm") ?? 5));
const attempts = Math.max(1, Number(flag("attempts") ?? 4));
// The lowest judge score a picture may go live with. Below it the card gets no
// picture at all: an empty slot teaches nothing wrong, a mismatched one does.
const minScore = Math.min(5, Math.max(1, Number(flag("min-score") ?? 4)));
const setName = flag("set") ?? "vocabulary";
const report = flag("report") ?? `${setName}-images-report.jsonl`;
// --only-file takes one label per line, for lists too long (or too comma-laden) for --only.
const onlyFile = flag("only-file");
const only = onlyFile
  ? readFileSync(onlyFile, "utf8").split(/\r?\n/).map(name => name.trim().toLowerCase()).filter(Boolean)
  : flag("only")?.split(",").map(name => name.trim().toLowerCase()).filter(Boolean);

/*
 * The interview carousel's richer briefs. A tagline alone ("Matchers, mocks, spies...") makes the painter draw a
 * generic pipeline that the judge rightly rejects as fitting any tool, so each technology names its visual identity
 * (colours, never a logo) and the mechanisms that only it has, as objects in one scene.
 */
const INTERVIEW_BRIEFS: Record<string, string> = {
  nextjs: "Next.js is the React framework whose look is stark black and white. Show its mechanisms, not a generic pipeline: a project's app folder drawn as a tall building where each nested folder is a floor whose door opens onto a matching street path (file-based routing, a [slug] floor serving many doors); a server kitchen on the ground floor that cooks finished page parts before they leave (Server Components), carried out in order on a conveyor so the top of the page arrives first (streaming with Suspense); a gatekeeper at the street entrance checking every visitor before they reach any floor (proxy.ts); a shelf of pre-built pages with small timers showing when each goes stale (Cache Components); and a turbine spinning beside the building, rebuilding instantly (Turbopack). Monochrome black, white and grey with one triangular motif; no lettering or logos.",
  "tanstack-libraries": "A family of separate headless libraries for React apps; TanStack's own visual identity is a sunny tropical island with palm trees. Six huts, one per library tab, each with one unmistakable object: Query a fetch-and-cache jar refilling from a cloud, Router a signpost with branching paths, Start a rocket launch pad, Table a large data grid board, Form a clipboard with checkbox fields, DB and AI a database cylinder beside a small robot.",
  tanstack: "TanStack's visual identity is a sunny tropical island with palm trees on a turquoise sea. Show a family of headless tools: on the island, a row of plain unpainted wooden frames (headless: logic without any styling) that different builders dress in their own colours and fabrics; each frame holds one recognisable job, a jar that refills itself from a rain cloud (query caching), a branching signpost (routing), a big grid board of cells (tables), and a clipboard of checkboxes (forms). Little boats from several different harbours (frameworks) dock at the same island. Warm sand, palm green and turquoise; no lettering or logos.",
  react: "React's visual identity is a cyan atom with three elliptical orbits on a dark navy ground. Show React 19 mechanisms: a large glowing cyan atom at the centre whose orbiting electrons are small interface components snapping into a page; a form whose submit lever sends a parcel along a track while a translucent ghost copy of the result already appears on the page before the real one arrives (Actions with useOptimistic); a small hand reaching into an unopened gift box mid-render to pull out its contents (the use() hook unwrapping a promise); a server room on one side handing finished components across a counter (Server Components); and a tiny robotic compiler arm automatically placing protective glass domes over parts that do not need redrawing (the React Compiler memoising). Navy and cyan palette; no lettering or logos.",
  javascript: "JavaScript's visual identity is bright yellow with black. Show its core mechanisms in one yellow-and-black workshop: a single worker at one desk taking tasks one at a time from a looping conveyor belt that circles back (the single-threaded event loop), with a small express lane of urgent envelopes (the microtask queue for promises) cutting ahead of a slower lane of parcels (timers); a sealed glass backpack a worker carries out of a room, still holding items from that room (a closure keeping its scope); a chain of family portraits, each pointing up to its parent portrait (the prototype chain); and a stack of puzzle pieces that click together across rooms (modules importing and exporting). Yellow and black; no lettering, no code, no logos.",
  typescript: "TypeScript's visual identity is a confident mid blue with white. Show static typing as physical shapes: a blue sorting machine where every slot has an exact shaped hole and only matching shaped blocks fit, a wrong block bouncing off before anything runs (type checking at compile time); a blank stencil frame that takes on whatever shape is placed in it and then stamps copies of exactly that shape (generics); a funnel that narrows a jumbled pile of mixed shapes down to only circles as it passes branching gates (type narrowing); and a press that takes one blueprint and stamps out variants with parts made optional or read-only (utility and mapped types). Blue and white with soft grey; no lettering, no code, no logos.",
  "js-puzzles": "A playful yellow-and-black JavaScript puzzle room, like an escape room for code. Show the classic 'what does this print' tricks as objects: a variable's name tag hanging on a hook at the top of a room before its box has arrived (hoisting, the box still empty); a scale where a single number weight and a string-shaped weight balance unexpectedly (type coercion); a row of three loop doorways each handing out the same final key instead of their own (a closure in a loop capturing one shared variable); and two queues at a ticket window where a promise envelope is served before an older timer parcel (the event loop's order). A detective's magnifying glass resting on the floor; yellow and black; no lettering, no code, no logos.",
  python: "Python's visual identity is two interlocking snakes, one blue and one yellow. Show its mechanisms: a friendly blue and yellow serpent coiled around a workshop; a water tap that drips one item at a time only when a cup is held under it, never filling a tank in advance (a generator yielding lazily); a gift-wrapping station that wraps an existing box in a new decorative layer without changing what is inside (a decorator); a single golden turnstile key that only one worker thread may hold at a time while other workers wait their turn (the GIL); and one chef juggling several pots, stirring each while the others simmer (async and await). Blue, yellow and warm cream; no lettering, no code, no logos.",
  nestjs: "NestJS's visual identity is a deep crimson-red with a cat motif on dark charcoal. Show an organised server framework as a red-and-charcoal factory of separate sealed modules, each a building block with its own door; a central dispatcher who hands each worker the exact tool they asked for from a shared tool wall as they arrive (dependency injection and providers); at the entrance a guard checking badges before anyone may enter a module (guards), then a sieve that cleans and validates every incoming parcel (pipes); and a wrapping station that adds timing tags around each parcel on its way in and out (interceptors). In the distance small separate factories exchange messages by pneumatic tube (microservices). A small cat silhouette perched on the roof; no lettering or logos.",
  redis: "Redis's visual identity is a bold red with dark charcoal. Show an in-memory data store as a very fast red vault in a server room where everything sits on open shelves within arm's reach rather than in a deep basement (data in RAM): distinct containers for its data structures, a plain labelled drawer (string), a long chain (list), a bag of unique marbles (set), a podium ladder where items stand at ranked heights (sorted set) and a filing folder of fields (hash); a stopwatch on some drawers that empties them when it runs out (key expiry, a cache); a radio tower broadcasting to several listeners at once (Pub/Sub); a long ticker tape that records events in order for readers to follow (Streams); and a photograph being taken of the shelves onto a disk for safekeeping (persistence). Red and charcoal; no lettering or logos.",
  aws: "AWS's visual identity is a warm orange on deep navy blue, with a smile-like arrow curve. Show a cloud city of distinct core services on navy ground with orange accents: rows of identical rentable server rooms (EC2); bottomless storage buckets with lids (S3); tiny pop-up workers that appear only when a bell rings and vanish after the job (Lambda, serverless); a security office handing out keycards with specific door permissions (IAM); a fenced private neighbourhood with its own gates and roads (VPC); a queue of envelopes waiting in a mailbox for workers to collect (SQS); and two database towers, one a flexible key-value cabinet (DynamoDB) and one a classic table archive (RDS). Orange and navy; no lettering or logos.",
  git: "Git's visual identity is an orange-red with branching lines. Show version control as a growing tree of saved snapshots: a main trunk made of a chain of photo frames (commits), with a side branch growing off it where a worker tries an idea and later the branch rejoins the trunk in a knot (branching and merging); a gardener lifting a side branch and regrafting it neatly onto the newest tip of the trunk (rebase); a rewind lever beside the tree that moves a bookmark ribbon back to an earlier frame (reset and undo); and a safety net beneath the tree catching a fallen branch, holding a logbook of every place the bookmark has been (the reflog recovering lost work). Orange-red, white and grey; no lettering or logos.",
  "github-actions": "GitHub's visual identity is near-black and white with an octocat-like silhouette, and Actions adds blue play-button motion. Show CI automation: a doorbell on a repository house that, when pressed by a code push, starts a train of carriages leaving a station (a workflow triggered by an event); each carriage is a job with its own workers running steps in order; several identical trains run side by side, each on a different track labelled only by shape: a penguin, a window and an apple silhouette for operating systems (a matrix build on runners); a locked safe inside the carriage whose key is handed over only during the trip (secrets); a storage shed beside the track that keeps packed boxes for the next train (caching); and at the destination a cloud gate that checks a short-lived ticket instead of a stored password (OIDC). Black, white and blue; no lettering or logos.",
  jest: "Jest's visual identity is a deep crimson-red with a jester's playful character. Show a JavaScript test runner as a red-and-cream testing theatre: a jester-like referee holding up pairs of objects to compare them (matchers); a cardboard stand-in actor taking the place of a real performer on stage while recording every line said to it (mocks and spies); a large stage clock whose hands a stagehand can wind forward instantly (fake timers); a camera photographing the final stage set and comparing it with a framed earlier photo (snapshot tests); and a floodlight map showing which parts of the stage have been lit by any scene (coverage). Crimson and cream; no lettering or logos.",
  vitest: "Vitest's visual identity is a bright green and yellow lightning-fast test runner built on Vite's engine (a purple and yellow lightning theme). Show its specific mechanisms in one green-and-yellow workshop: a single lightning-powered engine that drives both the building bench and the testing bench (it reuses the Vite pipeline, the same config); an eye-shaped watcher above the workbench that, the instant one gear is edited, re-tests only that gear while untouched gears stay dim (watch mode); a cardboard stand-in gear swapped in for a real motor during a check (vi mocks); a real browser window frame placed on the bench with the part tested inside it (browser mode); and a floodlight sweeping across the parts showing which have been checked (coverage). Green, yellow and a touch of purple; no lettering or logos.",
  cypress: "Cypress's visual identity is a dark charcoal with bright teal-green. Show end-to-end browser testing: a large browser window as a stage, with a small robot tester inside it physically clicking real buttons and typing into fields in a visible step-by-step chain of footprints (chained commands); an hourglass beside the robot as it patiently keeps looking again until a slow element appears (built-in retry-ability); a railway switch operator on the network line outside the window diverting and replacing incoming parcels with prepared fake ones (cy.intercept stubbing the network); a pantry shelf of prepared sample boxes used as stand-in data (fixtures); and a single component placed alone on a test bench under a lamp (component testing). Charcoal and teal-green; no lettering or logos.",
  zustand: "Zustand's visual identity is a friendly brown bear (its name is German for state) in warm honey and forest tones. Show a tiny state store: a small wooden honey pot on a tree stump holding all the shared state, with a bear keeper; several animal readers each drinking through their own straw that only draws the one flavour they care about, so others are not disturbed (selectors re-rendering only on their slice); helpers attached around the pot like a lid that logs every change and a jar that seals the honey to keep it overnight (middleware and persistence); and the pot assembled from a few stacked separate honeycomb sections (slices). No provider wrapper: the pot sits out in the open. Honey yellow, brown and pine green; no lettering or logos.",
  "redux-toolkit": "Redux Toolkit's visual identity is purple. Show the toolkit as one purple workshop: a single glass vault store built from a ready-made kit that snaps together with one lever (configureStore); the vault made of separate drawers, each drawer a slice that comes with its own pre-written order cards (createSlice generating actions and reducers); a clerk who seems to scribble directly on a document, while a magic photocopier quietly produces a fresh copy and leaves the original untouched (Immer immutable updates); a courier who first goes out to fetch something and returns before filing it (async thunks); and a self-refilling cache jar connected by a tube to a remote server, with a timer to refresh (RTK Query). Purple, lavender and white; no lettering or logos.",
}

/** One kind of card picture: where the subjects come from and how each is briefed, painted and stored. */
type PictureSet = {
  bucket: string;
  /** Folder inside the bucket; "" for the sets that have a bucket to themselves. */
  folder: string;
  /** Portrait for the vocabulary flashcard, landscape for the AWS card banner. */
  shape: { openai: "1024x1536" | "1536x1024"; ratio: "3:4" | "3:2"; width: number; height: number };
  subjects: { name: string; slug: string; design: (critique?: string) => Promise<Scene>; prompt: (scene: string) => string; judge: (jpeg: Buffer) => Promise<Verdict> }[];
};

async function pictureSet(name: string): Promise<PictureSet> {
  const landscape = { openai: "1536x1024", ratio: "3:2", width: 960, height: 640 } as const;
  type Topic = { name: string; context: string; summary: string; points?: string[] };
  // Every learning set is briefed, painted and judged the same way; only where
  // its topics come from and how they are named differ.
  const learningSet = (folder: string, topics: (Topic & { label: string; parts: string[] })[], field: TopicField = "tech"): PictureSet => ({
    bucket: LEARNING_IMAGE_BUCKET,
    folder,
    shape: landscape,
    subjects: topics.map(topic => ({
      name: topic.label,
      slug: learningImageSlug(...topic.parts),
      design: critique => designTopicScene(topic, critique, field),
      prompt: scene => learningScenePrompt({ subject: topic.name, scene, ...(field === "study" ? { field: "school and exam-preparation" } : {}) }),
      judge: jpeg => judgeTopicPicture(topic, jpeg, field),
    })),
  });
  // The catalogue labels are the ones components/answer-search.tsx asks with.
  // --catalogues "Redis,Next.js 16+" paints only the tabs whose title starts
  // with each prefix, prefix by prefix in that order.
  const catalogues = flag("catalogues")?.split(",").map(prefix => prefix.trim().toLowerCase()).filter(Boolean);
  if (name === "topics") return learningSet("topics", [
    // Painted tab by tab in the order the Search page lists its tabs (by tab
    // title, alphabetically), so the first tabs fill in first.
    ...((tabs: (readonly [string, string, { name: string; category: string; summary: string; points?: string[]; vocabulary?: unknown }[]])[]) => {
      tabs.sort((a, b) => a[1].localeCompare(b[1]));
      if (!catalogues) return tabs;
      return catalogues.flatMap(prefix => {
        const picked = tabs.filter(tab => tab[1].toLowerCase().startsWith(prefix));
        if (!picked.length) throw new Error(`--catalogues: no Search tab starts with "${prefix}"`);
        return picked;
      });
    })([["AI terms", "AI terms worth knowing", aiTerms()] as const, ["Python", "Python handbook", pythonTopics()] as const, ...TECHNOLOGY_HANDBOOKS.map(book => [book.title, book.title, book.topics] as const)])
      .flatMap(([catalogue, , items]) => items
        // Vocabulary rows already have their word pictures (--set vocabulary).
        .filter(item => !item.vocabulary)
        .map(item => ({ name: item.name, context: `${catalogue}, ${item.category}`, summary: item.summary, points: item.points, label: `${catalogue}: ${item.name}`, parts: [catalogue, item.name] }))),
  ]);
  // --packages deepagents,langchain paints only those API packages, in that order.
  const packages = flag("packages")?.split(",").map(id => id.trim()).filter(Boolean);
  if (name === "api") return learningSet("api", (packages ? packages.map(id => {
    const pkg = API_PACKAGES.find(item => item.id === id);
    if (!pkg) throw new Error(`--packages: no API package "${id}"`);
    return pkg;
  }) : API_PACKAGES).flatMap(pkg => [
    { name: pkg.name, context: "API reference", summary: pkg.description, points: pkg.topics, label: pkg.id, parts: [pkg.id] },
    ...pkg.entries.map(entry => {
      const detail = API_DETAILS[`${pkg.id}:${entry.name}`];
      const kind = API_TYPES.find(type => type.k === entry.kind)?.label ?? "identifier";
      return {
        name: `${entry.name} (${pkg.name})`,
        context: `${pkg.name} ${kind.toLowerCase()} — ${pkg.description}`,
        summary: detail?.description ?? `The ${entry.name} ${kind.toLowerCase()} in ${pkg.name}.`,
        points: detail ? [detail.signature, ...detail.useCases] : undefined,
        label: `${pkg.id}: ${entry.name}`,
        parts: [pkg.id, entry.name],
      };
    }),
  ]));
  if (name === "workflow") return learningSet("workflow", WORKFLOW_USECASES.map(workflow => ({
    name: workflow.title,
    context: `Agentic AI workflow, ${workflow.badge}`,
    summary: `${workflow.subtitle} ${workflow.architectureOverview}`,
    // The execution diagram is the flow the picture has to show, stage by stage.
    points: [`Execution flow: ${workflow.diagram.join(" | ")}`],
    label: workflow.id,
    parts: [workflow.id],
  })));
  // The keys below are the ones the pages ask with: components/official-docs.tsx,
  // notes-explorer.tsx, pro-lessons.tsx, step-by-step.tsx, techy.tsx and
  // app/(site)/courses/page.tsx.
  if (name === "docs") return learningSet("docs", OFFICIAL_DOCS.map(doc => ({
    name: doc.title, context: `Official documentation, ${doc.category}`, summary: `${doc.tagline}. ${doc.overview.en}`,
    points: [...doc.keyPoints, ...doc.architecturePoints], label: doc.id, parts: [doc.id],
  })));
  if (name === "notes") {
    // The notes catalogue is server-only; the npm script runs with --conditions=react-server.
    const { NOTES_SUMMARIES, NOTES_TECHNOLOGIES } = await import("../lib/server/notes-study-catalog");
    const technology = new Map(NOTES_TECHNOLOGIES.map(item => [item.id, item.title]));
    return learningSet("notes", NOTES_SUMMARIES.map(note => ({
      name: note.title, context: `${technology.get(note.technology) ?? note.technology}, ${note.category}`, summary: note.description,
      points: note.points, label: note.id, parts: [note.id],
    })));
  }
  if (name === "lessons") {
    const track = new Map(PRO_TRACKS.map(item => [item.id, item.name]));
    return learningSet("lessons", (lessonsData as { track: string; id: string; title: string; tag: string; summary: string; lead?: string }[]).map(lesson => ({
      name: lesson.title, context: `${track.get(lesson.track) ?? lesson.track} lesson, ${lesson.tag}`, summary: lesson.lead || lesson.summary,
      label: `${lesson.track}: ${lesson.id}`, parts: [lesson.track, lesson.id],
    })));
  }
  if (name === "guides") return learningSet("guides", [
    ...STEP_GUIDES.map(guide => ({
      name: guide.question, context: `Step-by-step guide, ${guide.category}`, summary: `${guide.definition} ${guide.answer}`,
      points: guide.answerPoints, label: `step-by-step: ${guide.id}`, parts: ["step-by-step", guide.id],
    })),
    ...TECHY_TOPICS.map(topic => ({
      name: topic.title, context: `Study deck, ${topic.category}`, summary: topic.summary,
      points: topic.features, label: `techy: ${topic.id}`, parts: ["techy", topic.id],
    })),
  ]);
  // The landing page's AI & agentic pulse carousel (components/landing-ai-pulse.tsx).
  // The landing page's workflow blueprints (components/landing-workflows.tsx): one picture per brief.
  if (name === "blueprints") return learningSet("topics", WORKFLOWS.map(workflow => ({
    name: workflow.title, context: `${workflow.group} workflow for ${workflow.industry}`, summary: `${workflow.summary} Problem: ${workflow.problem} Outcome: ${workflow.outcome}`,
    points: workflow.steps, label: `blueprints: ${workflow.id}`, parts: ["blueprints", workflow.id],
  })));
  // The landing page's interview carousel (components/landing-interview.tsx): one picture per technology.
  if (name === "interview") return learningSet("topics", INTERVIEW_TECHS.map(tech => ({
    name: tech.title, context: "Technical interview preparation",
    summary: INTERVIEW_BRIEFS[tech.id] ? `${tech.tagline} ${INTERVIEW_BRIEFS[tech.id]}` : tech.tagline,
    // A tabbed technology (Key TanStack libraries) briefs each library, so the scene shows them, not a generic toolkit.
    points: tech.tabs?.map(tab => `${tab.title}: ${tab.tagline}`) ?? [tech.tagline], label: `interview: ${tech.id}`, parts: ["interview", tech.id],
  })));
  // The Tech Topics comparisons (components/landing-comparisons.tsx): one picture per comparison, showing the
  // technologies side by side.
  if (name === "comparisons") return learningSet("topics", COMPARISONS.map(item => ({
    name: item.question, context: `Technology comparison: ${item.techs.map(tech => tech.name).join(" vs ")}`, summary: item.summary,
    points: item.techs.map(tech => `${tech.name}: ${tech.definition}`), label: `comparisons: ${item.id}`, parts: ["comparisons", item.id],
  })));
  if (name === "pulse") return learningSet("topics", AI_PULSE.map(item => ({
    name: item.title, context: "AI agents and agentic engineering", summary: item.definition,
    points: item.points, label: `pulse: ${item.id}`, parts: ["ai-pulse", item.id],
  })));
  if (name === "courses") return learningSet("courses", PREPARATION_GROUPS.flatMap(group => group.categories.map(category => ({
    name: CATEGORY_LABELS[category].en, context: `Learning path, ${group.label.en}`, summary: COURSE_SUMMARIES[category] ?? "",
    points: [`Includes: ${PREPARATIONS.filter(option => option.category === category).map(option => option.label.en).join(", ")}`],
    label: category, parts: [category],
  }))), "study");
  if (name === "aws") return {
    bucket: AWS_SERVICE_IMAGE_BUCKET,
    folder: "",
    shape: landscape,
    subjects: awsHighlights().map(service => ({
      name: service.name,
      slug: awsServiceImageSlug(service.name),
      design: critique => designServiceScene(service, critique),
      prompt: scene => awsServiceScenePrompt({ name: service.name, scene }),
      judge: jpeg => judgeServicePicture(service, jpeg),
    })),
  };
  if (name === "vocabulary") return {
    bucket: VOCABULARY_IMAGE_BUCKET,
    folder: "",
    shape: { openai: "1024x1536", ratio: "3:4", width: 720, height: 960 },
    subjects: ENGLISH_EXAM_VOCABULARY.map(entry => ({
      name: entry.word,
      slug: vocabularyImageSlug(entry.word),
      design: critique => designScene(entry, critique),
      prompt: scene => vocabularyScenePrompt({ word: entry.word, scene }),
      judge: jpeg => judgePicture(entry, jpeg),
    })),
  };
  throw new Error(`--set must be "vocabulary", "aws", "topics", "api", "workflow", "docs", "notes", "lessons", "guides", "courses", "pulse", "blueprints", "interview" or "comparisons", not "${name}"`);
}

/** A picture is done when its meaning is unmistakable from the picture alone and it carries no lettering. */
const passes = (verdict: Verdict) => verdict.score === 5 && !verdict.has_text;
/** Short of that, the best try may still go live if it clearly reads as its topic. */
const publishable = (verdict: Verdict) => verdict.score >= minScore && !verdict.has_text;
/** Lettering costs more than a weaker reading: a clear picture with text in it is the worse keeper. */
const merit = (verdict: Verdict) => verdict.score - Number(verdict.has_text) * 3;

async function main() {
  const set = await pictureSet(setName);
  // One file per slug: a word listed twice under two categories gets one picture.
  const seen = new Set<string>();
  let subjects = set.subjects.filter(subject => {
    if (!subject.slug || seen.has(subject.slug)) return false;
    seen.add(subject.slug);
    return !only || only.includes(subject.name.toLowerCase());
  });

  if (dryRun) {
    for (const subject of subjects.slice(0, Number.isFinite(limit) ? limit : 3)) {
      const scene = await subject.design();
      console.log(`── ${subject.slug}.webp  [cue: ${scene.focal_cue}]${scene.distinct ? "" : " [not distinct: would be skipped]"}\n${subject.prompt(scene.scene)}\n`);
    }
    console.log(`${subjects.length} ${setName} cards would be considered. Image model: ${MODEL}. No images were generated.`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  // Every storage call gets a deadline: a connection dropped mid-upload (the
  // machine sleeping, a network blip) otherwise hangs the whole run for good.
  const storage = createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(60_000) }) },
  }).storage;

  const { data: bucket } = await storage.getBucket(set.bucket);
  if (!bucket) {
    const { error } = await storage.createBucket(set.bucket, { public: true, allowedMimeTypes: ["image/webp"], fileSizeLimit: "2MB" });
    if (error) throw error;
    console.log(`Created public bucket "${set.bucket}".`);
  }

  const existing = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.from(set.bucket).list(set.folder, { limit: 1000, offset });
    if (error) throw error;
    for (const file of data) existing.add(file.name);
    if (data.length < 1000) break;
  }

  if (!replace) subjects = subjects.filter(subject => !existing.has(`${subject.slug}.webp`));
  // A card the review already turned down after every attempt is not retried
  // on each restart (that is the full cost again for the same odds), unless
  // asked for with --retry-rejected or named with --only.
  if (!retryRejected && !only && existsSync(report)) {
    const rejected = new Set<string>();
    for (const line of readFileSync(report, "utf8").split("\n").filter(Boolean)) {
      const { name, attempts: tries, rejected: wasRejected } = JSON.parse(line) as { name: string; attempts: { verdict: Verdict }[]; rejected?: boolean };
      // Older report lines carry no flag: every attempt used and none publishable.
      if (wasRejected ?? (tries.length >= attempts && !tries.some(attempt => publishable(attempt.verdict)))) rejected.add(name);
      else rejected.delete(name);
    }
    subjects = subjects.filter(subject => existing.has(`${subject.slug}.webp`) || !rejected.has(subject.name));
  }
  subjects = subjects.slice(0, limit);
  console.log(`${existing.size} already in "${set.bucket}"; generating ${subjects.length} with ${MODEL}, ${concurrency} at a time, at most ${rpm} images a minute, up to ${attempts} attempts each.`);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  // The SDKs' own timeouts have still let a stalled connection hang a card
  // (and so, one worker at a time, the whole run) for good. A hard deadline
  // turns that into an ordinary failure the attempt loop can recover from.
  const deadline = <T,>(work: Promise<T>, ms: number, step: string) => {
    let timer: NodeJS.Timeout | undefined;
    return Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`${step} timed out after ${ms / 1000}s`)), ms); })])
      .finally(() => clearTimeout(timer));
  };
  // Each image request waits for the next free slot, spaced evenly across the minute.
  let nextSlot = Date.now();
  const takeSlot = async () => {
    const at = Math.max(nextSlot, Date.now());
    nextSlot = at + 60_000 / rpm;
    await sleep(at - Date.now());
  };
  // A dropped connection never settles on its own, so each painting gets a
  // deadline; a timed-out request is retried like a rate-limited one.
  const rateLimited = (error: unknown) => /rate limit|timeout|timed out|aborted|fetch failed/i.test(error instanceof Error ? `${error.name} ${error.message}` : String(error));

  async function paint(prompt: string) {
    // A rate-limit rejection is not the card's fault: wait out the window and
    // try the same prompt again rather than recording the card as failed.
    for (let tries = 1; ; tries++) {
      await takeSlot();
      try {
        const { image } = await deadline(generateImage({
          model: gateway.image(MODEL),
          prompt,
          // OpenAI's image models take a fixed size; the rest take a ratio.
          ...(MODEL.startsWith("openai/") ? { size: set.shape.openai } : { aspectRatio: set.shape.ratio }),
          maxRetries: 1,
          abortSignal: AbortSignal.timeout(180_000),
        }), 240_000, "painting");
        return image.uint8Array;
      } catch (error) {
        if (!rateLimited(error) || tries >= 4) throw error;
        console.log(`  (painting retry ${tries}: ${error instanceof Error ? error.message : String(error)})`);
        nextSlot = Math.max(nextSlot, Date.now() + 61_000);
      }
    }
  }

  const failures: string[] = [], rejected: string[] = [];
  let done = 0;
  const queue = [...subjects];
  async function worker() {
    for (let subject = queue.shift(); subject; subject = queue.shift()) {
      const file = `${subject.slug}.webp`;
      const path = set.folder ? `${set.folder}/${file}` : file;
      const log: { scene: string; cue: string; verdict: Verdict }[] = [];
      let cardRejected = false;
      try {
        let best: { webp: Buffer; verdict: Verdict } | undefined;
        let critique: string | undefined;
        let unpicturable = false;
        for (let attempt = 1; attempt <= attempts; attempt++) {
          const scene = await deadline(subject.design(critique), 480_000, "scene design");
          // A setting or a naming difference no picture can tell apart from its
          // neighbours would only burn every attempt and be rejected anyway.
          if (attempt === 1 && !scene.distinct) { unpicturable = true; break; }
          let raw: Uint8Array;
          try {
            raw = await paint(subject.prompt(scene.scene));
          } catch (error) {
            // The image model's safety filter sometimes balks at an innocent
            // scene; that is a reason to design a gentler one, not to drop the card.
            if (!/safety system/i.test(error instanceof Error ? error.message : String(error)) || attempt === attempts) throw error;
            critique = "The image model's safety filter rejected that scene. Design a gentler, clearly harmless everyday scene with no danger, injury, weapons, children at risk or anything that could read as unsafe.";
            continue;
          }
          const webp = await sharp(raw).resize(set.shape.width, set.shape.height, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toBuffer();
          const verdict = await deadline(subject.judge(await sharp(webp).resize(480).jpeg({ quality: 80 }).toBuffer()), 480_000, "review");
          log.push({ scene: scene.scene, cue: scene.focal_cue, verdict });
          if (!best || merit(verdict) > merit(best.verdict)) best = { webp, verdict };
          if (passes(verdict)) break;
          // Two tries that missed the point entirely have never recovered; stop paying for more.
          if (attempt === 2 && log.every(entry => entry.verdict.score <= 2)) break;
          // Hand back the scene with its critique, so the next try fixes what
          // fell short instead of starting over and losing what worked.
          critique = `The scene was: ${scene.scene}
${verdict.has_text ? "It contained visible lettering or a logo. " : ""}It scored ${verdict.score}/5: ${verdict.problem}
Keep what worked and fix this; if the metaphor itself cannot show the idea, choose a clearer one.`;
        }
        if (!best || !publishable(best.verdict)) {
          // Never publish a picture that does not match its topic; with --replace,
          // also take down the earlier one it was meant to improve on.
          if (existing.has(file)) {
            const { error } = await storage.from(set.bucket).remove([path]);
            if (error) throw error;
          }
          rejected.push(subject.name);
          cardRejected = true;
          console.log(`[${++done}/${subjects.length}] ${file} rejected: ${unpicturable || !best ? "no distinct picture possible, not painted" : `best ${best.verdict.score}/5${best.verdict.has_text ? " with lettering" : ""} after ${log.length} tries, no picture published`}`);
        } else {
          const { error } = await storage.from(set.bucket).upload(path, best.webp, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
          if (error) throw error;
          console.log(`[${++done}/${subjects.length}] ${file} score ${best.verdict.score}/5 after ${log.length} ${log.length === 1 ? "try" : "tries"}`);
        }
      } catch (error) {
        failures.push(subject.name);
        console.error(`[failed] ${subject.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
      appendFileSync(report, `${JSON.stringify({ name: subject.name, attempts: log, rejected: cardRejected })}\n`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  console.log(`\nDone: ${done - rejected.length} published, ${rejected.length} rejected (below ${minScore}/5 after ${attempts} tries), ${failures.length} failed.`);
  if (rejected.length) console.log(`No picture for: ${rejected.join(", ")}`);
  if (failures.length) console.log(`Retry with: npm run images:${setName} -- --only "${failures.join(",")}"`);
  console.log(`Card base URL: ${url.replace(/\/+$/, "")}/storage/v1/object/public/${set.bucket}${set.folder ? ` (folder "${set.folder}")` : ""}`);
  if (failures.length) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exit(1); });
