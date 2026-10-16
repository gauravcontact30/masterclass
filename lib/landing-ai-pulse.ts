/*
 * The "AI & agentic pulse" carousel on the landing page: what is new and widely used in the agent world.
 * Each card follows the Search page's topic-card format (picture, definition, key points, real use cases,
 * problems by industry) and links to the official source. Keep every claim checkable on the linked page;
 * replace cards as the field moves rather than piling on.
 * These hand-written cards join the agentic AI group of the daily rotation (scripts/build-landing-daily.ts, `npm run landing:daily`).
 * Pictures: `npm run images:pulse` paints them into the topics folder under ["ai-pulse", id].
 */
export type AiPulseKind = "Protocol" | "Standard" | "Pattern" | "Tooling" | "Practice" | "Safety";
/** Light card tints, defined in components/landing-ai-pulse.module.css. */
export type AiPulseTone = "peach" | "mint" | "sky" | "lavender" | "butter" | "rose" | "sage";

export type AiPulseItem = {
  id: string;
  kind: AiPulseKind;
  tone: AiPulseTone;
  title: string;
  definition: string;
  hiDefinition: string;
  points: [string, string, string];
  useCases: [string, string];
  industries: [{ industry: string; problem: string }, { industry: string; problem: string }];
  source: { label: string; href: string };
  /** For a "X vs. Y" card: each side explained on its own, in place of the key points. */
  compare?: [AiPulseSide, AiPulseSide];
};

export type AiPulseSide = { heading: string; title: string; summary: string; points: [string, string]; useWhen: string };

export const AI_PULSE: AiPulseItem[] = [
  {
    id: "mcp", kind: "Protocol", tone: "peach",
    title: "Model Context Protocol (MCP)",
    definition: "The open standard for plugging AI apps into tools and data: write one server and every MCP client can use it.",
    hiDefinition: "AI ऐप्स को टूल्स और डेटा से जोड़ने का खुला मानक: एक सर्वर लिखें, हर MCP क्लाइंट उसे इस्तेमाल कर सकता है।",
    points: [
      "Servers expose tools (actions), resources (data) and prompts (templates).",
      "Runs locally over stdio or remotely over Streamable HTTP with OAuth.",
      "Supported by Claude, ChatGPT, VS Code, Cursor and most agent frameworks.",
    ],
    useCases: ["Let an assistant query your database or tickets", "Give a coding agent access to docs and issue trackers"],
    industries: [
      { industry: "SaaS", problem: "One integration instead of a custom plugin per AI client" },
      { industry: "Enterprise IT", problem: "Governed, auditable access to internal systems" },
    ],
    source: { label: "modelcontextprotocol.io", href: "https://modelcontextprotocol.io/docs/getting-started/intro" },
  },
  {
    id: "agent-skills", kind: "Standard", tone: "mint",
    title: "Agent Skills",
    definition: "Folders of instructions, scripts and references that an agent loads only when a task needs them.",
    hiDefinition: "निर्देशों, स्क्रिप्ट और संदर्भों के फ़ोल्डर, जिन्हें एजेंट तभी लोड करता है जब काम को उनकी ज़रूरत हो।",
    points: [
      "Each skill is a SKILL.md with a name and description; the body loads on demand.",
      "Progressive disclosure keeps context small even with many skills installed.",
      "An open format, so one skill works across compatible agents.",
    ],
    useCases: ["Package your team's release checklist for an agent", "Teach an agent to fill company document templates"],
    industries: [
      { industry: "Finance", problem: "Repeatable report formats without re-prompting each time" },
      { industry: "Engineering", problem: "House conventions applied the same way by every agent" },
    ],
    source: { label: "agentskills.io", href: "https://agentskills.io" },
  },
  {
    id: "agents-md", kind: "Standard", tone: "sky",
    title: "AGENTS.md",
    definition: "A README written for coding agents: build commands, conventions and rules in one predictable file.",
    hiDefinition: "कोडिंग एजेंटों के लिए README: बिल्ड कमांड, नियम और परंपराएँ एक तय फ़ाइल में।",
    points: [
      "Plain Markdown at the repo root; nested files override it for sub-packages.",
      "Holds what a new teammate needs: setup, tests, style and gotchas.",
      "Read by many coding agents, so one file serves all of them.",
    ],
    useCases: ["Tell agents which test command proves a change", "Warn agents off generated or vendored folders"],
    industries: [
      { industry: "Open source", problem: "Consistent agent contributions across many maintainers" },
      { industry: "Monorepos", problem: "Per-package rules without one giant prompt" },
    ],
    source: { label: "agents.md", href: "https://agents.md" },
  },
  {
    id: "a2a", kind: "Protocol", tone: "lavender",
    title: "A2A vs. MCP",
    definition: "A protocol for agents built by different teams and frameworks to discover each other and hand off work.",
    hiDefinition: "अलग-अलग टीमों और फ़्रेमवर्क से बने एजेंटों को एक-दूसरे को खोजने और काम सौंपने का प्रोटोकॉल।",
    points: [
      "Agents publish an Agent Card describing skills, endpoint and auth.",
      "Work is modelled as tasks with states, messages and artifacts.",
      "Complements MCP: MCP links agents to tools, A2A links agents to agents.",
    ],
    useCases: ["A travel agent delegating payment to a billing agent", "Vendor agents cooperating inside one workflow"],
    industries: [
      { industry: "Retail", problem: "Partner agents coordinate orders without bespoke APIs" },
      { industry: "Enterprise", problem: "Agents from different vendors interoperate" },
    ],
    source: { label: "a2a-protocol.org", href: "https://a2a-protocol.org" },
    compare: [
      {
        heading: "MCP", title: "Agent ↔ tools & data",
        summary: "Connects one agent to the tools, resources and prompts it needs.",
        points: ["Client–server: the agent calls the server's tools.", "The server is a capability, not a peer that plans."],
        useWhen: "An agent needs an API, database or file system.",
      },
      {
        heading: "A2A", title: "Agent ↔ agent",
        summary: "Lets independent agents discover each other and delegate whole tasks.",
        points: ["Agent Cards advertise skills; work flows as tasks with states.", "Each agent stays opaque: it shares results, not internals."],
        useWhen: "Work must be handed to another team's or vendor's agent.",
      },
    ],
  },
  {
    id: "building-agents", kind: "Pattern", tone: "butter",
    title: "Workflows vs. agents",
    definition: "Start with the simplest pattern that works; use an autonomous agent only when the steps can't be predicted.",
    hiDefinition: "सबसे सरल पैटर्न से शुरू करें; स्वायत्त एजेंट तभी चुनें जब कदम पहले से तय न हो सकें।",
    points: [
      "Workflows follow fixed paths: prompt chaining, routing, parallelization.",
      "Orchestrator–workers and evaluator–optimizer handle open-ended subtasks.",
      "Agents loop on tool results from the environment until the goal is met.",
    ],
    useCases: ["Route support tickets to the right specialised prompt", "Let an agent fix a bug across unknown files"],
    industries: [
      { industry: "Support", problem: "Predictable cost and quality on high-volume queues" },
      { industry: "Software", problem: "Open-ended tasks that no fixed script can cover" },
    ],
    source: { label: "Anthropic: Building effective agents", href: "https://www.anthropic.com/engineering/building-effective-agents" },
    compare: [
      {
        heading: "Workflows", title: "Predefined code paths",
        summary: "Models and tools orchestrated through steps you write in code.",
        points: ["Prompt chaining, routing, parallelization, orchestrator–workers.", "Predictable cost, latency and output; easy to test."],
        useWhen: "The steps are known ahead of time.",
      },
      {
        heading: "Agents", title: "Model-directed process",
        summary: "The model chooses its own steps and tools, looping on feedback from the environment.",
        points: ["Plans, acts, checks results, repeats until done or stopped.", "Flexible but costlier; errors compound, so sandbox and add guardrails."],
        useWhen: "Open-ended problems where the steps can't be predicted.",
      },
    ],
  },
  {
    id: "context-engineering", kind: "Practice", tone: "rose",
    title: "Context engineering",
    definition: "The successor to prompt engineering: deciding which tokens an agent sees at every step of a long task.",
    hiDefinition: "प्रॉम्प्ट इंजीनियरिंग का अगला कदम: लंबे काम के हर चरण में एजेंट कौन-से टोकन देखे, यह तय करना।",
    points: [
      "Context is finite: more tokens can mean worse recall, not better answers.",
      "Load data just in time with tools instead of stuffing it in up front.",
      "Use compaction, structured notes and sub-agents for long-horizon work.",
    ],
    useCases: ["Keep a multi-hour coding session on track", "Answer from a large codebase without loading all of it"],
    industries: [
      { industry: "Legal", problem: "Long documents reviewed without losing earlier facts" },
      { industry: "Research", problem: "Multi-step investigations that outgrow one window" },
    ],
    source: { label: "Anthropic: Effective context engineering", href: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
  },
  {
    id: "coding-agents", kind: "Tooling", tone: "sage",
    title: "Coding agents in the terminal",
    definition: "Agents such as Claude Code read your repo, edit files, run commands and tests, then show you the diff.",
    hiDefinition: "Claude Code जैसे एजेंट आपकी रिपॉज़िटरी पढ़ते हैं, फ़ाइलें बदलते हैं, कमांड और टेस्ट चलाते हैं और बदलाव दिखाते हैं।",
    points: [
      "Permission modes decide what runs without asking you first.",
      "Hooks, skills, sub-agents and MCP servers extend what it can do.",
      "The same agent loop runs in CI and in your apps via the Agent SDK.",
    ],
    useCases: ["Migrate a codebase to a new framework version", "Write and run tests for an untested module"],
    industries: [
      { industry: "Startups", problem: "Small teams ship and maintain more surface area" },
      { industry: "Enterprise", problem: "Large legacy migrations done in reviewable steps" },
    ],
    source: { label: "Claude Code docs", href: "https://docs.claude.com/en/docs/claude-code/overview" },
  },
  {
    id: "ai-sdk-agents", kind: "Tooling", tone: "sky",
    title: "Agents with the AI SDK",
    definition: "A TypeScript toolkit for tool-calling loops that works with any model provider and streams to React.",
    hiDefinition: "किसी भी मॉडल प्रदाता के साथ टूल-कॉलिंग लूप बनाने का TypeScript टूलकिट, जो React तक स्ट्रीम करता है।",
    points: [
      "Define tools with a schema and an execute function.",
      "Loop controls stop the agent after a step count or a condition.",
      "Typed tool results render as UI with the useChat hook.",
    ],
    useCases: ["A chat assistant that books meetings via tools", "Swap model providers without rewriting the app"],
    industries: [
      { industry: "E-commerce", problem: "Shopping assistants that call live inventory" },
      { industry: "SaaS", problem: "In-app copilots streaming answers into the UI" },
    ],
    source: { label: "ai-sdk.dev", href: "https://ai-sdk.dev/docs/agents/overview" },
  },
  {
    id: "computer-use", kind: "Tooling", tone: "lavender",
    title: "Computer use & browser agents",
    definition: "Models that see screenshots and drive a mouse and keyboard, for software that has no API.",
    hiDefinition: "मॉडल जो स्क्रीनशॉट देखकर माउस और कीबोर्ड चलाते हैं, उन सॉफ़्टवेयर के लिए जिनका कोई API नहीं।",
    points: [
      "The model returns actions (click, type, scroll); your code executes them.",
      "Run it in a sandboxed VM or container, never your own desktop session.",
      "Prefer an API or MCP tool when one exists: faster and more reliable.",
    ],
    useCases: ["Fill forms in a legacy portal with no API", "Test a web app the way a user clicks through it"],
    industries: [
      { industry: "Insurance", problem: "Data entry across old systems without integrations" },
      { industry: "QA", problem: "End-to-end checks of flows that change often" },
    ],
    source: { label: "Computer use tool docs", href: "https://docs.claude.com/en/docs/agents-and-tools/tool-use/computer-use-tool" },
  },
  {
    id: "evals", kind: "Practice", tone: "mint",
    title: "Evals for agents",
    definition: "Tests for non-deterministic systems: a dataset of tasks, a grader, and a score you track on every change.",
    hiDefinition: "अनिश्चित सिस्टम के टेस्ट: कामों का डेटासेट, एक जाँचकर्ता और हर बदलाव पर देखा जाने वाला स्कोर।",
    points: [
      "Write success criteria first: specific, measurable, tied to real use.",
      "Mix code-based checks with model-graded rubrics where judgement is needed.",
      "Grade the outcome; check the trajectory when tools have side effects.",
    ],
    useCases: ["Catch regressions before a prompt change ships", "Compare two models on your own tasks"],
    industries: [
      { industry: "Healthcare", problem: "Evidence that answers stay safe after every update" },
      { industry: "Fintech", problem: "Measured accuracy before automating decisions" },
    ],
    source: { label: "Claude docs: Define success & build evals", href: "https://docs.claude.com/en/docs/test-and-evaluate/develop-tests" },
  },
  {
    id: "agent-security", kind: "Safety", tone: "peach",
    title: "Prompt injection & agent security",
    definition: "Anything an agent reads can contain instructions. Design so a hijacked agent still can't do much damage.",
    hiDefinition: "एजेंट जो कुछ भी पढ़ता है उसमें निर्देश छिपे हो सकते हैं। ऐसा डिज़ाइन करें कि बहका हुआ एजेंट भी ज़्यादा नुकसान न कर सके।",
    points: [
      "Prompt injection tops the OWASP Top 10 for LLM applications.",
      "Grant least privilege: scoped tokens, allow-listed tools, sandboxes.",
      "Require human approval for irreversible or outward-facing actions.",
    ],
    useCases: ["An email agent that must not forward data on request", "A browsing agent reading untrusted web pages"],
    industries: [
      { industry: "Banking", problem: "No unauthorised transfers from manipulated inputs" },
      { industry: "Any SaaS", problem: "Customer data kept out of attacker-controlled channels" },
    ],
    source: { label: "OWASP GenAI Top 10", href: "https://genai.owasp.org/llm-top-10/" },
  },
];
