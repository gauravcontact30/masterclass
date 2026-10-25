import type { TechBuzzArticle } from "./tech-buzz-data";

/**
 * One editorial guide per Learning Dashboard technology, so Tech Buzz covers every technology the site teaches.
 * Written by the MasterClass editorial team (not copied from anywhere). They start unrated with no claps or
 * comments: those figures come only from readers, never invented. The first section is the free preview; the rest is
 * for members (lib/tech-buzz-public.ts).
 */
type Section = TechBuzzArticle["contentSections"][number];
type Seed = {
  techId: string; technology: string; category: string; color: string; date: string; minutes: number;
  title: string; subtitle: string; tags: string[]; summary: string[]; stack: string[]; sections: Section[]; takeaway: string;
};

const COVER: Record<string, string> = {
  "Artificial Intelligence": "/images/news/agentic.webp",
  "Frontend Engineering": "/images/news/frontend.webp",
  "Backend & APIs": "/images/news/questions-tech.webp",
  "Cloud & DevOps": "/images/news/aws.webp",
  "Testing & Quality": "/images/news/trending.webp",
  "Computer Science": "/images/news/system-design.webp",
  "System Architecture": "/images/news/system-design.webp",
  "Enterprise Platforms": "/images/news/ai-labs.webp",
};

/** URL slug from the title, at most 80 characters and cut at a word boundary. */
function slugify(text: string) {
  const slug = text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug.length <= 80 ? slug : slug.slice(0, slug.lastIndexOf("-", 80));
}

function article(seed: Seed, index: number): TechBuzzArticle {
  const slug = slugify(seed.title);
  return {
    id: `tb-tech-${seed.techId}`,
    slug,
    title: seed.title,
    subtitle: seed.subtitle,
    category: seed.category,
    technology: seed.technology,
    techId: seed.techId,
    techBadgeColor: seed.color,
    publishedAt: seed.date,
    readTimeMinutes: seed.minutes,
    likes: 0,
    dislikes: 0,
    upvotes: 0,
    claps: 0,
    rating: { average: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    author: { name: "MasterClass Buddy Editorial", role: "Engineering editorial team", avatar: "/icon.svg", handle: "@masterclassbuddy", verified: true },
    coverImage: COVER[seed.category] ?? "/images/news/trending.webp",
    tags: seed.tags,
    rankingScore: 90 - index * 0.1,
    source: { name: "MasterClass Buddy", domain: "masterclass", trustScore: "" },
    summaryBullets: seed.summary,
    reactions: { heart: 0, unicorn: 0, rocket: 0, mindblown: 0 },
    commentsCount: 0,
    comments: [],
    techStack: seed.stack,
    audioVoiceover: { durationMinutes: seed.minutes, narrator: "Your browser's voice", waveformSeed: [40, 70, 55, 80, 62, 90, 58, 74, 66, 50] },
    membershipTier: "Pro Member",
    builderMetrics: { metricLabel: "Practise it next", metricValue: `${seed.technology} interview questions, quiz and handbook in your Learning Dashboard` },
    founderTakeaway: seed.takeaway,
    contentSections: seed.sections,
  };
}

const SEEDS: Seed[] = [
  // ── Artificial Intelligence ─────────────────────────────────────────────────────────────────────────────
  {
    techId: "langchain", technology: "LangChain", category: "Artificial Intelligence", color: "#1c3c3c", date: "2026-10-24", minutes: 8,
    title: "LangChain in Production: Agents, Tools and Structured Output Without the Magic",
    subtitle: "What createAgent actually does, how tools are described to the model, and the three habits that keep a LangChain app debuggable.",
    tags: ["LangChain", "AI Agents", "Tool Calling", "LLM Apps"], stack: ["LangChain", "TypeScript", "Zod"],
    summary: ["An agent is a loop: the model picks a tool, your code runs it, the result goes back to the model.", "Tool names, descriptions and schemas are the prompt; write them like an API contract.", "Structured output and tracing turn a demo into something you can ship."],
    sections: [
      { heading: "Why LangChain still matters", paragraphs: [
        "Every LLM application ends up rebuilding the same plumbing: a prompt, a model call, a few tools, some memory and a way to see what happened. LangChain packages that plumbing behind one interface, so swapping a model provider is a string change rather than a rewrite.",
        "The modern API is deliberately small. You create an agent with a model and a list of tools, invoke it with messages, and get messages back. Everything else (middleware, memory, streaming) layers on top of that loop.",
      ] },
      { heading: "The agent loop, demystified", paragraphs: [
        "An agent call is a while-loop. The model receives the conversation plus a description of each tool. If it answers with a tool call, LangChain runs your function, appends the result as a tool message and calls the model again. The loop ends when the model answers in plain text.",
        "That means the quality of your tools decides the quality of your agent. A vague description produces wrong calls; a strict schema produces arguments you can trust.",
      ], bulletPoints: ["Name tools as verbs: search_orders, not orders.", "Describe when to use a tool, not just what it does.", "Validate arguments with a schema so bad calls fail loudly."] },
      { heading: "A minimal agent with a typed tool", paragraphs: ["The tool's Zod schema becomes the JSON schema the model sees, and LangChain validates the model's arguments against it before your code runs."],
        codeSnippet: { language: "typescript", filename: "agent.ts", code: `import { createAgent, tool } from "langchain";
import * as z from "zod";

const getOrder = tool(
  async ({ orderId }) => JSON.stringify(await db.orders.find(orderId)),
  {
    name: "get_order",
    description: "Look up one order by id. Use it when the user asks about an order's status.",
    schema: z.object({ orderId: z.string().describe("The order id, e.g. ORD-1042") }),
  },
);

const agent = createAgent({ model: "anthropic:claude-sonnet-4-5", tools: [getOrder] });
const result = await agent.invoke({ messages: [{ role: "user", content: "Where is ORD-1042?" }] });
console.log(result.messages.at(-1)?.content);` } },
      { heading: "Habits that keep it debuggable", paragraphs: ["Most LangChain bugs are invisible without a trace: the model saw a different prompt than you thought, or a tool returned an error string the model then summarised confidently."],
        bulletPoints: ["Turn on tracing (LangSmith) from day one, not after the first incident.", "Return errors from tools as clear text the model can act on.", "Cap the loop with a recursion or step limit so a confused agent cannot spin forever.", "Ask for structured output when another program consumes the answer."] },
    ],
    takeaway: "Treat tools as a public API for the model: clear names, strict schemas and honest errors do more for agent quality than any prompt trick.",
  },
  {
    techId: "langgraph", technology: "LangGraph", category: "Artificial Intelligence", color: "#2f6868", date: "2026-10-23", minutes: 9,
    title: "LangGraph Explained: Stateful Agent Workflows You Can Pause, Resume and Test",
    subtitle: "Nodes, edges, reducers and checkpointers: the four ideas behind long-running agents that survive restarts and human approvals.",
    tags: ["LangGraph", "Agent Orchestration", "State Machines", "Human in the Loop"], stack: ["LangGraph", "TypeScript"],
    summary: ["A graph makes an agent's control flow explicit instead of hiding it in a prompt.", "Checkpointers persist state after every step, enabling resume and time travel.", "Interrupts let a human approve a step before the graph continues."],
    sections: [
      { heading: "When a simple agent loop is not enough", paragraphs: [
        "A single agent loop is fine for chat. Real workflows need more: retry one step, branch on a classifier, wait for a manager's approval, or resume tomorrow after a deploy. LangGraph models that as a graph of nodes sharing one state object.",
        "Because the flow is code rather than prompt, you can unit-test each node, draw the graph, and reason about every path the agent can take.",
      ] },
      { heading: "State, reducers and edges", paragraphs: [
        "Each node receives the current state and returns a partial update. Reducers decide how updates merge: messages append, a status field overwrites. Edges connect nodes, and conditional edges pick the next node from the state.",
        "Compile the graph with a checkpointer and every step is saved under a thread id. Invoke again with the same thread and the graph continues where it stopped.",
      ], bulletPoints: ["Keep state small and serialisable.", "Put branching logic in conditional edges, not inside nodes.", "Use a thread id per conversation or job."] },
      { heading: "A draft → review → publish graph", paragraphs: ["The review node routes back to drafting until the critique passes, and the checkpointer makes the whole run resumable."],
        codeSnippet: { language: "typescript", filename: "graph.ts", code: `import { Annotation, StateGraph, START, END, MemorySaver } from "@langchain/langgraph";

const State = Annotation.Root({
  topic: Annotation<string>,
  draft: Annotation<string>,
  approved: Annotation<boolean>,
});

const graph = new StateGraph(State)
  .addNode("write", async s => ({ draft: await writeDraft(s.topic, s.draft) }))
  .addNode("review", async s => ({ approved: await critique(s.draft) }))
  .addEdge(START, "write")
  .addEdge("write", "review")
  .addConditionalEdges("review", s => (s.approved ? END : "write"))
  .compile({ checkpointer: new MemorySaver() });

await graph.invoke({ topic: "Caching in Next.js 16" }, { configurable: { thread_id: "post-42" } });` } },
      { heading: "Production checklist", paragraphs: ["MemorySaver is for development; production graphs need a durable checkpointer such as Postgres so runs survive restarts."],
        bulletPoints: ["Use a database-backed checkpointer in production.", "Add interrupts before irreversible actions (payments, emails).", "Set a recursion limit to stop runaway cycles.", "Stream node updates to the UI so users see progress."] },
    ],
    takeaway: "LangGraph's value is not more AI; it is making an agent's control flow explicit, persistent and testable like any other workflow engine.",
  },
  {
    techId: "langflow", technology: "Langflow", category: "Artificial Intelligence", color: "#7c3aed", date: "2026-10-20", minutes: 7,
    title: "Langflow: Prototyping AI Workflows Visually, Then Shipping Them as an API",
    subtitle: "How to use a drag-and-drop canvas for RAG and agents without trapping your product inside a demo tool.",
    tags: ["Langflow", "Low-code AI", "RAG", "AI Prototyping"], stack: ["Langflow", "Python", "REST"],
    summary: ["Langflow turns components (models, prompts, vector stores) into a visual flow.", "Every flow is callable over HTTP, so the canvas becomes your backend.", "Version flows as JSON and test them like code."],
    sections: [
      { heading: "From whiteboard to working flow", paragraphs: [
        "Most AI ideas start as boxes and arrows on a whiteboard. Langflow lets you build exactly that picture: drop in a chat input, a prompt, a model and a vector store, wire them up, and talk to the result in the playground minutes later.",
        "That speed is its superpower for discovery. Product managers and engineers can explore a retrieval pipeline together before anyone writes glue code.",
      ] },
      { heading: "Components and flows", paragraphs: [
        "Each node is a Python component with typed inputs and outputs. Built-in components cover models, embeddings, splitters, retrievers and tools; custom components are plain Python classes when you need your own logic.",
        "A flow is saved as JSON. Export it, commit it, and import it into another environment so dev, staging and production run the same graph.",
      ], bulletPoints: ["Start from a template (basic prompting, vector store RAG, agent).", "Name components clearly; the names show up in logs.", "Keep secrets in global variables, never inside the flow JSON."] },
      { heading: "Calling a flow from your app", paragraphs: ["Every flow has a run endpoint. Your product calls it like any other API and never needs to know the canvas exists."],
        codeSnippet: { language: "typescript", filename: "run-flow.ts", code: `const response = await fetch(\`\${process.env.LANGFLOW_URL}/api/v1/run/\${flowId}\`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": process.env.LANGFLOW_API_KEY! },
  body: JSON.stringify({ input_value: question, input_type: "chat", output_type: "chat" }),
});
const data = await response.json();
const answer = data.outputs?.[0]?.outputs?.[0]?.results?.message?.text;` } },
      { heading: "Avoiding the prototype trap", paragraphs: ["Visual tools fail in production when nobody owns versioning, evaluation and limits."],
        bulletPoints: ["Commit exported flow JSON and review changes like code.", "Add an evaluation set before changing prompts or models.", "Put rate limits and auth in front of the run endpoint.", "Move hot paths into code once the design settles."] },
    ],
    takeaway: "Use Langflow to find the right pipeline fast, then treat the flow as a versioned, tested service rather than a canvas someone edits live.",
  },
  {
    techId: "langsmith", technology: "LangSmith", category: "Artificial Intelligence", color: "#0f766e", date: "2026-10-19", minutes: 7,
    title: "LangSmith for Real Teams: Tracing, Datasets and Evals That Catch Regressions",
    subtitle: "Why every LLM feature needs a trace and a test set, and how to wire both in an afternoon.",
    tags: ["LangSmith", "LLM Observability", "Evaluations", "Tracing"], stack: ["LangSmith", "TypeScript"],
    summary: ["A trace shows every prompt, tool call, token count and latency in one tree.", "Datasets turn real failures into permanent regression tests.", "Evaluators score outputs automatically before you ship a prompt change."],
    sections: [
      { heading: "You cannot fix what you cannot see", paragraphs: [
        "LLM bugs rarely throw exceptions. The model quietly receives the wrong context, a tool returns an empty list, or a prompt edit makes answers longer and vaguer. Without traces, the team argues from screenshots.",
        "LangSmith records each run as a tree: the chain, every model call with its exact input and output, tool calls, timings and token usage. Debugging becomes reading, not guessing.",
      ] },
      { heading: "Tracing in two lines", paragraphs: [
        "LangChain and LangGraph trace automatically once the environment variables are set. For your own functions, wrap them with traceable so they appear as spans in the same tree.",
        "Add metadata such as user id, feature flag and prompt version, so you can filter traces later.",
      ], bulletPoints: ["LANGSMITH_TRACING=true and LANGSMITH_API_KEY enable tracing.", "Separate projects per environment.", "Tag runs with the prompt version you deployed."] },
      { heading: "Tracing your own code", paragraphs: ["traceable wraps any async function; nested calls become child runs automatically."],
        codeSnippet: { language: "typescript", filename: "retrieve.ts", code: `import { traceable } from "langsmith/traceable";

export const retrieve = traceable(
  async (question: string) => {
    const hits = await vectorStore.similaritySearch(question, 4);
    return hits.map(hit => hit.pageContent);
  },
  { name: "retrieve_context", run_type: "retriever", metadata: { index: "docs-v3" } },
);` } },
      { heading: "From traces to evals", paragraphs: ["The habit that pays off: whenever a user reports a bad answer, add that trace's input to a dataset with the answer you expected."],
        bulletPoints: ["Build a dataset of 30 to 100 real questions.", "Score with simple checks first (contains, JSON valid), then LLM-as-judge.", "Run the eval on every prompt or model change.", "Watch cost and latency alongside quality."] },
    ],
    takeaway: "Traces explain today's failure; datasets and evals stop it from coming back. You need both before an LLM feature is production-ready.",
  },
  {
    techId: "openrouter", technology: "OpenRouter", category: "Artificial Intelligence", color: "#6366f1", date: "2026-10-18", minutes: 6,
    title: "OpenRouter: One API for Hundreds of Models, Fallbacks and Cost Control",
    subtitle: "Using an OpenAI-compatible router to compare models, survive provider outages and keep spend predictable.",
    tags: ["OpenRouter", "LLM Routing", "Model Fallbacks", "AI Cost"], stack: ["OpenRouter", "TypeScript", "REST"],
    summary: ["OpenRouter exposes many providers behind one OpenAI-compatible endpoint.", "Model fallbacks keep requests working when one provider is down.", "Per-key credit limits make spend predictable."],
    sections: [
      { heading: "Why route instead of integrate", paragraphs: [
        "Integrating every model provider separately means different SDKs, keys, error formats and billing dashboards. A router puts them behind one endpoint, so trying a new model is a one-word change.",
        "That matters because the best model for your task changes every few months. Teams that can switch quickly ship better quality for less money.",
      ] },
      { heading: "How requests are routed", paragraphs: [
        "You name a model as provider/model. OpenRouter picks a healthy provider for it, and you can pass a list of fallback models that are tried in order if the first fails or is rate limited.",
        "Responses use the familiar chat-completions shape, so existing OpenAI-style client code usually works by changing the base URL and key.",
      ], bulletPoints: ["Use fallbacks for user-facing features.", "Pin exact models for evals so results are comparable.", "Set a credit limit per API key and per environment."] },
      { heading: "A request with fallbacks", paragraphs: ["The models array is tried in order; the response reports which model actually answered."],
        codeSnippet: { language: "typescript", filename: "chat.ts", code: `const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: \`Bearer \${process.env.OPENROUTER_API_KEY}\`, "Content-Type": "application/json" },
  body: JSON.stringify({
    models: ["anthropic/claude-sonnet-4.5", "openai/gpt-5-mini"],
    messages: [{ role: "user", content: "Summarise this changelog in three bullets." }],
  }),
});
const data = await res.json();
console.log(data.model, data.choices[0].message.content);` } },
      { heading: "Things to watch", paragraphs: ["A router adds one more party to your data path, so read the data policies of the providers it may use."],
        bulletPoints: ["Restrict providers when data residency matters.", "Log which model answered each request.", "Compare price per million tokens, not per request.", "Keep a direct-provider path for critical workloads."] },
    ],
    takeaway: "A model router turns 'which model?' from an architecture decision into a configuration choice you can revisit every month.",
  },
  {
    techId: "ai-gateway", technology: "Vercel AI Gateway", category: "Artificial Intelligence", color: "#111827", date: "2026-10-17", minutes: 6,
    title: "Vercel AI Gateway with the AI SDK: Model Strings, Fallbacks and Observability",
    subtitle: "How a single 'provider/model' string gives you every major model, usage tracking and failover on Vercel.",
    tags: ["Vercel AI Gateway", "AI SDK", "LLM Ops", "Next.js AI"], stack: ["AI SDK", "Vercel", "TypeScript"],
    summary: ["With the AI SDK, a plain 'provider/model' string routes through the gateway.", "One key and one bill cover many providers.", "Usage, latency and errors are visible per model."],
    sections: [
      { heading: "The problem with one SDK per provider", paragraphs: [
        "Shipping AI features usually starts with one provider's SDK. Then you want a cheaper model for summaries, a faster one for autocomplete, and a backup during an outage, and suddenly you maintain three integrations.",
        "The AI Gateway sits between your app and the providers. The AI SDK talks to it by default when you pass a model as a string, so switching models is editing that string.",
      ] },
      { heading: "What the gateway adds", paragraphs: [
        "Requests are authenticated with one gateway key (or OIDC on Vercel deployments), routed to the provider, and recorded with tokens, cost and latency. Provider options let you order or restrict providers per request.",
        "Because the AI SDK API is the same for every model, streaming, tool calling and structured output keep working when you switch.",
      ], bulletPoints: ["Use generateText for one-shot answers and streamText for chat UIs.", "Use generateObject with a schema for structured data.", "Keep model ids in configuration, not scattered in code."] },
      { heading: "Streaming a reply in a route handler", paragraphs: ["The model string is all the routing the code needs."],
        codeSnippet: { language: "typescript", filename: "app/api/chat/route.ts", code: `import { streamText, convertToModelMessages, type UIMessage } from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    system: "You are a concise study assistant.",
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}` } },
      { heading: "Operating it well", paragraphs: ["Treat model choice as a product decision you measure, not a one-time pick."],
        bulletPoints: ["Track cost per feature, not just per model.", "Set budgets and alerts on the gateway key.", "Test a fallback model with your eval set before relying on it.", "Never expose the gateway key to the browser."] },
    ],
    takeaway: "Routing through a gateway makes models interchangeable parts, which is exactly what you want in a market that changes every quarter.",
  },
  {
    techId: "n8n", technology: "n8n", category: "Artificial Intelligence", color: "#ea4b71", date: "2026-10-16", minutes: 7,
    title: "n8n for Developers: Webhooks, Code Nodes and AI Agents in One Workflow",
    subtitle: "When a self-hostable workflow tool beats writing another integration service, and how to keep it maintainable.",
    tags: ["n8n", "Workflow Automation", "AI Agents", "Webhooks"], stack: ["n8n", "JavaScript", "Webhooks"],
    summary: ["n8n connects APIs with triggers, nodes and credentials, self-hosted or in the cloud.", "Code nodes run JavaScript or Python when built-in nodes are not enough.", "AI Agent nodes add LLM reasoning with tools and memory."],
    sections: [
      { heading: "Glue code is still code", paragraphs: [
        "Every product accumulates integrations: send a Slack alert when a payment fails, sync new sign-ups to a CRM, summarise support tickets every morning. Writing each as a microservice is slow; scripts on a laptop are fragile.",
        "n8n gives those jobs a home: a visual workflow with retries, credentials management, execution history and the option to self-host, so data stays on your servers.",
      ] },
      { heading: "Triggers, items and expressions", paragraphs: [
        "A workflow starts from a trigger (webhook, schedule, app event). Data flows between nodes as a list of items, each with a json payload. Expressions like {{ $json.email }} read fields from the current item.",
        "Understanding items is the key to n8n: most nodes run once per item, so a node that receives 50 items makes 50 calls unless you batch.",
      ], bulletPoints: ["Use the Webhook node for inbound events.", "Use Split in Batches (Loop Over Items) for large lists.", "Store secrets as credentials, never in node parameters."] },
      { heading: "A Code node that cleans incoming items", paragraphs: ["Code nodes receive all items and must return items in the same { json } shape."],
        codeSnippet: { language: "javascript", filename: "Code node", code: `// Normalise sign-ups before they reach the CRM node.
return $input.all()
  .filter(item => item.json.email)
  .map(item => ({
    json: {
      email: item.json.email.trim().toLowerCase(),
      name: (item.json.name ?? "").trim(),
      plan: item.json.plan ?? "free",
      receivedAt: new Date().toISOString(),
    },
  }));` } },
      { heading: "Keeping workflows maintainable", paragraphs: ["Workflows rot like code when nobody reviews them."],
        bulletPoints: ["Add an Error Trigger workflow that alerts on failures.", "Export workflows to Git for review and backup.", "Use sub-workflows for logic shared by several flows.", "Give AI Agent nodes narrow tools and a step limit."] },
    ],
    takeaway: "n8n shines for integration glue and AI automations; treat each workflow as a small service with alerts, versioning and an owner.",
  },
  // ── Frontend Engineering ────────────────────────────────────────────────────────────────────────────────
  {
    techId: "nextjs", technology: "Next.js 16", category: "Frontend Engineering", color: "#000000", date: "2026-10-24", minutes: 9,
    title: "Next.js 16 Caching Finally Makes Sense: Cache Components, use cache and Tags",
    subtitle: "A practical model of what is static, what is dynamic and how to update cached data the moment it changes.",
    tags: ["Next.js 16", "Cache Components", "React Server Components", "Performance"], stack: ["Next.js 16", "React 19", "TypeScript"],
    summary: ["With Cache Components, pages ship a static shell and stream dynamic parts inside Suspense.", "'use cache' with cacheLife and cacheTag caches any async function or component.", "updateTag and revalidateTag expire cached data right after a write."],
    sections: [
      { heading: "The old confusion", paragraphs: [
        "Earlier App Router versions cached aggressively by default, and many teams spent weeks discovering why a page showed stale data. Next.js 16 flips the model: nothing is cached unless you say so, and you say so explicitly.",
        "With cacheComponents enabled, each route prerenders a static shell. Anything that reads request data (cookies, headers, search params) or uncached I/O must sit inside a Suspense boundary and streams in at request time.",
      ] },
      { heading: "Three building blocks", paragraphs: [
        "'use cache' marks a function or component whose result can be reused. cacheLife sets how long ('minutes', 'hours', 'days' or a custom profile). cacheTag labels the entry so a write can expire exactly the data it changed.",
        "Request-time APIs like cookies() cannot be read inside a cached scope; read them outside and pass plain values in as arguments, which also become part of the cache key.",
      ], bulletPoints: ["Cache data reads close to the database call.", "Tag by entity: 'product:42' and 'products'.", "Keep personalised UI in small dynamic islands."] },
      { heading: "Cache a read, expire it on write", paragraphs: ["The server action expires the tag, so the next request reads fresh data without waiting for the cache life to end."],
        codeSnippet: { language: "typescript", filename: "lib/products.ts", code: `import { cacheLife, cacheTag, updateTag } from "next/cache";

export async function getProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return db.product.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createProduct(formData: FormData) {
  "use server";
  await db.product.create({ data: { name: String(formData.get("name")) } });
  updateTag("products"); // read-your-own-writes for this user
}` } },
      { heading: "Migration tips", paragraphs: ["Turn on cacheComponents in a branch and let the build tell you which components read dynamic data outside Suspense."],
        bulletPoints: ["Rename middleware.ts to proxy.ts.", "Wrap request-time components in Suspense with a real fallback.", "Use revalidateTag(tag, profile) from route handlers, updateTag from server actions.", "Measure LCP before and after; the static shell should paint first."] },
    ],
    takeaway: "In Next.js 16, caching is opt-in and explicit: cache the reads, tag them, expire tags on writes, and stream everything personal.",
  },
  {
    techId: "react", technology: "React 19", category: "Frontend Engineering", color: "#0ea5e9", date: "2026-10-22", minutes: 8,
    title: "React 19 Actions: Forms, Pending States and Optimistic UI Without Boilerplate",
    subtitle: "useActionState, useOptimistic, use and the React Compiler: what changed and how it removes code you used to write by hand.",
    tags: ["React 19", "Actions", "useOptimistic", "React Compiler"], stack: ["React 19", "TypeScript"],
    summary: ["Actions handle pending state, errors and form resets for async transitions.", "useOptimistic shows the expected result instantly and rolls back on failure.", "The React Compiler memoises components automatically."],
    sections: [
      { heading: "The form code nobody enjoyed", paragraphs: [
        "A typical React form used to need four pieces of state: the input values, a loading flag, an error message and a success flag, plus effects to reset them. Every team wrote the same code slightly differently.",
        "React 19 makes async work a first-class concept called an Action. Pass an async function to a form's action prop or to useActionState, and React tracks pending state and results for you.",
      ] },
      { heading: "The new hooks in one picture", paragraphs: [
        "useActionState returns the latest result, a wrapped action and an isPending flag. useFormStatus lets a submit button read its parent form's pending state. useOptimistic shows a temporary value while the action runs.",
        "use reads a promise or context during render, suspending until the promise resolves, which pairs naturally with Server Components passing promises down.",
      ], bulletPoints: ["Forms reset automatically after a successful action.", "ref is now a regular prop; forwardRef is rarely needed.", "Document metadata tags can be rendered from any component."] },
      { heading: "A comment form with optimistic UI", paragraphs: ["The new comment appears instantly; if the server rejects it, React reverts to the real list."],
        codeSnippet: { language: "tsx", filename: "Comments.tsx", code: `"use client";
import { useActionState, useOptimistic } from "react";

export function Comments({ initial, save }: { initial: string[]; save: (text: string) => Promise<string[]> }) {
  const [comments, submit, isPending] = useActionState(
    async (current: string[], form: FormData) => {
      const text = String(form.get("text"));
      addOptimistic(text);
      return save(text);
    },
    initial,
  );
  const [shown, addOptimistic] = useOptimistic(comments, (list, text: string) => [...list, text]);

  return <form action={submit}>
    <ul>{shown.map((c, i) => <li key={i}>{c}</li>)}</ul>
    <input name="text" required />
    <button disabled={isPending}>{isPending ? "Posting…" : "Post"}</button>
  </form>;
}` } },
      { heading: "Upgrade notes", paragraphs: ["Most apps upgrade smoothly; the breaking changes are mostly removals of long-deprecated APIs."],
        bulletPoints: ["Remove propTypes and string refs.", "Replace ReactDOM.render with createRoot.", "Try the React Compiler on one route and delete manual useMemo only where it is proven redundant.", "Keep keys stable in optimistic lists."] },
    ],
    takeaway: "React 19 turns pending, error and optimistic states into framework features; the less of that you hand-write, the fewer bugs you ship.",
  },
  {
    techId: "angular", technology: "Angular", category: "Frontend Engineering", color: "#dd0031", date: "2026-10-15", minutes: 8,
    title: "Modern Angular: Signals, Standalone Components and the New Control Flow",
    subtitle: "Why today's Angular feels lighter, and how signals replace much of the RxJS and zone.js you used for UI state.",
    tags: ["Angular", "Signals", "Standalone Components", "Zoneless"], stack: ["Angular", "TypeScript", "RxJS"],
    summary: ["Standalone components remove the need for NgModules in most apps.", "Signals give fine-grained reactivity with signal, computed and effect.", "@if, @for and @defer replace structural directives and add lazy loading."],
    sections: [
      { heading: "Angular changed more than its reputation", paragraphs: [
        "Many developers remember Angular as NgModules, zone.js magic and RxJS for everything. Recent versions keep the batteries-included framework but drop much of that ceremony.",
        "Components are standalone by default, templates have built-in control flow, and signals provide a simple reactive primitive that Angular can track precisely.",
      ] },
      { heading: "Signals in practice", paragraphs: [
        "A signal holds a value; reading it inside a template or computed registers a dependency. computed derives values lazily, and effect runs side effects when dependencies change.",
        "RxJS still shines for streams over time (websockets, debounced search). Use toSignal to bring an observable into a template and keep simple state as plain signals.",
      ], bulletPoints: ["Prefer computed over effect for derived state.", "Use input() and output() signal APIs for component I/O.", "@for requires a track expression; pick a stable id."] },
      { heading: "A standalone counter with signals", paragraphs: ["No module, no subscription management, and the template only re-renders what depends on count."],
        codeSnippet: { language: "typescript", filename: "counter.component.ts", code: `import { Component, computed, signal } from "@angular/core";

@Component({
  selector: "app-counter",
  template: \`
    <button (click)="increment()">Clicked {{ count() }} times</button>
    @if (isHigh()) { <p>That is a lot of clicks.</p> }
    @for (step of history(); track $index) { <span>{{ step }}</span> }
  \`,
})
export class CounterComponent {
  count = signal(0);
  history = signal<number[]>([]);
  isHigh = computed(() => this.count() > 10);

  increment() {
    this.count.update(c => c + 1);
    this.history.update(h => [...h, this.count()]);
  }
}` } },
      { heading: "Migration path", paragraphs: ["Angular ships schematics for most of these changes, so migration can be incremental."],
        bulletPoints: ["Run the standalone and control-flow migrations.", "Convert simple BehaviorSubjects to signals first.", "Use @defer to lazy-load heavy sections.", "Test zoneless change detection on a new feature before enabling it app-wide."] },
    ],
    takeaway: "Signals and standalone components make Angular simpler without giving up its strengths: strong conventions, DI and a complete toolkit.",
  },
  {
    techId: "vue", technology: "Vue 3", category: "Frontend Engineering", color: "#41b883", date: "2026-10-14", minutes: 7,
    title: "Vue 3 Composition API: Composables, Reactivity Pitfalls and Pinia",
    subtitle: "How to structure a growing Vue app with script setup, reusable composables and a store that stays small.",
    tags: ["Vue 3", "Composition API", "Pinia", "Composables"], stack: ["Vue 3", "Pinia", "TypeScript"],
    summary: ["script setup makes components concise and type-friendly.", "Composables share stateful logic the way hooks do in React.", "Pinia stores are typed, modular and devtools-friendly."],
    sections: [
      { heading: "Why the Composition API won", paragraphs: [
        "The Options API organised code by type: data here, methods there, watchers somewhere else. In large components a single feature was scattered across all of them.",
        "The Composition API organises code by feature. With script setup, everything declared at the top level is available in the template, and logic can be extracted into composables.",
      ] },
      { heading: "Reactivity rules worth memorising", paragraphs: [
        "ref wraps any value and is read with .value in script (auto-unwrapped in templates). reactive makes an object deeply reactive but loses reactivity if you destructure it; use toRefs when you must.",
        "computed caches derived values; watch reacts to changes with access to old and new values.",
      ], bulletPoints: ["Prefer ref for most state; it is predictable.", "Never destructure reactive() without toRefs.", "Return refs from composables, not raw values."] },
      { heading: "A reusable fetch composable", paragraphs: ["The composable owns loading and error state, so every component that needs data stays tiny."],
        codeSnippet: { language: "typescript", filename: "useFetch.ts", code: `import { ref, watchEffect, toValue, type MaybeRefOrGetter } from "vue";

export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  watchEffect(async onCleanup => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(toValue(url), { signal: controller.signal });
      data.value = await res.json();
    } catch (e) {
      if (!controller.signal.aborted) error.value = String(e);
    } finally {
      loading.value = false;
    }
  });
  return { data, error, loading };
}` } },
      { heading: "Scaling with Pinia", paragraphs: ["Keep stores for truly shared state; local UI state belongs in components."],
        bulletPoints: ["One store per domain (cart, user), not one global store.", "Use setup stores for full Composition API power.", "Use storeToRefs when destructuring a store.", "Keep server data in a fetching layer, not copied into stores."] },
    ],
    takeaway: "Organise Vue code by feature with composables, respect the reactivity rules, and keep Pinia for genuinely shared state.",
  },
  {
    techId: "tanstack", technology: "TanStack Query", category: "Frontend Engineering", color: "#ff4154", date: "2026-10-21", minutes: 8,
    title: "TanStack Query: Server State Is Not Client State",
    subtitle: "Query keys, stale time, invalidation and optimistic updates: the mental model that removes most data-fetching bugs.",
    tags: ["TanStack Query", "React Query", "Data Fetching", "Caching"], stack: ["TanStack Query", "React", "TypeScript"],
    summary: ["Server state is a cache of data you do not own; treat it that way.", "Query keys identify cache entries; invalidation refetches them.", "staleTime and gcTime control freshness and memory."],
    sections: [
      { heading: "The bug class it removes", paragraphs: [
        "Fetching in useEffect looks simple until you need caching, deduplication, retries, background refresh, pagination and race-condition handling. Most apps implement half of that badly.",
        "TanStack Query treats data from the server as a cache keyed by query keys. Components ask for data; the library decides whether to serve the cache, refetch or wait.",
      ] },
      { heading: "Freshness, explained", paragraphs: [
        "Data is fresh for staleTime (0 by default). Stale data is still shown instantly, but refetched in the background on mount, window focus or reconnect. Unused cache entries are garbage-collected after gcTime.",
        "After a mutation, invalidate the affected keys and every component using them refetches automatically.",
      ], bulletPoints: ["Put every variable the query depends on into its key.", "Raise staleTime for data that rarely changes.", "Use query key factories to avoid typos."] },
      { heading: "A mutation that keeps lists in sync", paragraphs: ["Invalidating by prefix refreshes every todo list variant (filters, pages) at once."],
        codeSnippet: { language: "tsx", filename: "todos.tsx", code: `import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const todoKeys = { all: ["todos"] as const, list: (filter: string) => ["todos", "list", filter] as const };

export function useTodos(filter: string) {
  return useQuery({ queryKey: todoKeys.list(filter), queryFn: () => api.todos(filter), staleTime: 30_000 });
}

export function useAddTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });
}` } },
      { heading: "Common mistakes", paragraphs: ["Most Query bugs come from fighting the cache rather than describing it."],
        bulletPoints: ["Copying query data into useState (it goes stale).", "Missing variables in the query key.", "Using refetch() instead of invalidation after mutations.", "Disabling retries globally instead of per query."] },
    ],
    takeaway: "Describe your data with keys and freshness rules, invalidate on writes, and let the cache do the rest.",
  },
  {
    techId: "tanstack-start", technology: "TanStack Start", category: "Frontend Engineering", color: "#0f766e", date: "2026-10-23", minutes: 8,
    title: "TanStack Start: Type-Safe Full-Stack React with Server Functions",
    subtitle: "File routes, loaders and createServerFn: how TanStack Start keeps types flowing from the database to the component.",
    tags: ["TanStack Start", "TanStack Router", "Server Functions", "Full-Stack React"], stack: ["TanStack Start", "TanStack Router", "Vite"],
    summary: ["Built on TanStack Router, every route, param and search param is typed.", "createServerFn defines server-only code callable from anywhere.", "Loaders fetch data before render, with SSR and streaming."],
    sections: [
      { heading: "A router-first framework", paragraphs: [
        "TanStack Start starts from TanStack Router, which is known for end-to-end type safety: links, params and search params are checked by TypeScript. Start adds server rendering, streaming and server functions on top, built with Vite.",
        "The result feels close to a client-side app with server superpowers rather than a server framework with client islands.",
      ] },
      { heading: "Server functions and loaders", paragraphs: [
        "createServerFn defines a function that always runs on the server. Calling it from a loader or a component makes a typed RPC call; inputs can be validated and the return type flows back to the caller.",
        "Route loaders run before the route renders, on the server for the first request and on the client during navigation, and their data is read with Route.useLoaderData().",
      ], bulletPoints: ["Validate server function inputs.", "Keep secrets and database access inside server functions only.", "Use search-param schemas for filters and pagination."] },
      { heading: "A typed posts route", paragraphs: ["The component knows the exact shape of posts without any manual typing."],
        codeSnippet: { language: "tsx", filename: "src/routes/posts.tsx", code: `import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getPosts = createServerFn({ method: "GET" }).handler(async () => {
  return db.post.findMany({ select: { id: true, title: true }, take: 20 });
});

export const Route = createFileRoute("/posts")({
  loader: () => getPosts(),
  component: Posts,
});

function Posts() {
  const posts = Route.useLoaderData();
  return <ul>{posts.map(post => <li key={post.id}>{post.title}</li>)}</ul>;
}` } },
      { heading: "When to choose it", paragraphs: ["Start suits teams that value type-safe routing and a Vite toolchain, and that prefer explicit data loading."],
        bulletPoints: ["Great for dashboards and apps with heavy search-param state.", "Pair with TanStack Query for cached client data.", "Check your hosting adapter before committing.", "Compare with Next.js on SEO-heavy, mostly static sites."] },
    ],
    takeaway: "TanStack Start's edge is types that never break between route, loader, server function and component.",
  },
  {
    techId: "zustand", technology: "Zustand", category: "Frontend Engineering", color: "#7c5c3b", date: "2026-10-22", minutes: 6,
    title: "Zustand: Small Global State, Selectors and Avoiding Re-renders",
    subtitle: "A store in ten lines, why selectors matter, and the middleware that covers persistence and devtools.",
    tags: ["Zustand", "State Management", "React Performance"], stack: ["Zustand", "React", "TypeScript"],
    summary: ["A Zustand store is a hook; no provider is required.", "Selecting small slices prevents unnecessary re-renders.", "persist and devtools middleware cover common needs."],
    sections: [
      { heading: "State without ceremony", paragraphs: [
        "Zustand stores are plain functions returning state and actions. You call create once and get a hook any component can use, with no context provider and almost no boilerplate.",
        "That simplicity makes it a popular choice for UI state shared across distant components: sidebars, carts, editors, multi-step forms.",
      ] },
      { heading: "Selectors are the performance model", paragraphs: [
        "A component re-renders when the value its selector returns changes. Select the smallest slice you need. Returning a new object from a selector on every call causes re-renders; useShallow compares the fields instead.",
        "Actions live in the store, so components call cart.add(item) instead of reaching into state.",
      ], bulletPoints: ["Select primitives or stable references.", "Use useShallow for multiple fields.", "Keep server data in a fetching library, not in Zustand."] },
      { heading: "A typed cart store", paragraphs: ["persist saves the cart to localStorage and restores it on reload."],
        codeSnippet: { language: "typescript", filename: "cart-store.ts", code: `import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

type Item = { id: string; price: number; qty: number };
type Cart = { items: Item[]; add: (item: Item) => void; clear: () => void };

export const useCart = create<Cart>()(
  persist(
    set => ({
      items: [],
      add: item => set(state => ({ items: [...state.items, item] })),
      clear: () => set({ items: [] }),
    }),
    { name: "cart" },
  ),
);

// Re-renders only when the count or the total changes.
export const useCartSummary = () =>
  useCart(useShallow(s => ({ count: s.items.length, total: s.items.reduce((t, i) => t + i.price * i.qty, 0) })));` } },
      { heading: "Patterns that scale", paragraphs: ["Zustand stays pleasant if stores stay focused."],
        bulletPoints: ["Split large stores into slices.", "Reset stores between tests.", "Avoid storing derived values; compute them in selectors.", "Use the vanilla store for non-React code."] },
    ],
    takeaway: "Zustand is fast when you let selectors do their job: select little, keep actions in the store, and leave server data elsewhere.",
  },
  {
    techId: "redux-toolkit", technology: "Redux Toolkit", category: "Frontend Engineering", color: "#764abc", date: "2026-10-13", minutes: 8,
    title: "Redux Toolkit and RTK Query: Modern Redux Without the Boilerplate",
    subtitle: "createSlice, configureStore and RTK Query: when Redux is still the right tool and how to write it today.",
    tags: ["Redux Toolkit", "RTK Query", "Redux", "State Management"], stack: ["Redux Toolkit", "React Redux", "TypeScript"],
    summary: ["createSlice writes actions and reducers together with safe mutation syntax.", "RTK Query handles fetching, caching and invalidation.", "Redux fits large apps that need predictable, inspectable state changes."],
    sections: [
      { heading: "Redux, rewritten", paragraphs: [
        "Classic Redux meant action constants, action creators, switch statements and immutable updates by hand. Redux Toolkit is the official way to write Redux now, and it removes almost all of that.",
        "It remains a strong choice when many features share complex state, when you want time-travel debugging, or when a team values strict, predictable update flows.",
      ] },
      { heading: "Slices and the store", paragraphs: [
        "createSlice takes a name, initial state and reducers; it generates action creators and uses Immer so you can write state.items.push(x) safely. configureStore wires reducers, devtools and sensible middleware.",
        "RTK Query defines API endpoints once and generates hooks with caching and tag-based invalidation.",
      ], bulletPoints: ["Type RootState and AppDispatch once and reuse them.", "Keep slices per feature.", "Prefer RTK Query over hand-written thunks for server data."] },
      { heading: "A slice and an API in one file", paragraphs: ["Mutations invalidate the 'Todo' tag, so lists refetch automatically."],
        codeSnippet: { language: "typescript", filename: "store.ts", code: `import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const ui = createSlice({
  name: "ui",
  initialState: { sidebarOpen: true },
  reducers: { toggleSidebar: state => { state.sidebarOpen = !state.sidebarOpen; } },
});

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Todo"],
  endpoints: build => ({
    todos: build.query<{ id: string; title: string }[], void>({ query: () => "todos", providesTags: ["Todo"] }),
    addTodo: build.mutation<void, string>({ query: title => ({ url: "todos", method: "POST", body: { title } }), invalidatesTags: ["Todo"] }),
  }),
});

export const store = configureStore({
  reducer: { ui: ui.reducer, [api.reducerPath]: api.reducer },
  middleware: getDefault => getDefault().concat(api.middleware),
});
export const { toggleSidebar } = ui.actions;
export const { useTodosQuery, useAddTodoMutation } = api;` } },
      { heading: "Choosing between Redux and lighter stores", paragraphs: ["Redux is not the default answer anymore, but it is still the right one in some places."],
        bulletPoints: ["Choose Redux for large, shared, frequently-changing state.", "Choose Zustand or context for small UI state.", "Never put non-serialisable values in the store.", "Use selectors with createSelector for derived data."] },
    ],
    takeaway: "Write Redux with Redux Toolkit or not at all; with RTK Query, it covers both app state and server state cleanly.",
  },
  {
    techId: "javascript", technology: "JavaScript", category: "Frontend Engineering", color: "#d4a20b", date: "2026-10-12", minutes: 7,
    title: "The JavaScript Event Loop, Finally Clear: Tasks, Microtasks and Rendering",
    subtitle: "Predict the output of any async puzzle by knowing which queue each callback joins.",
    tags: ["JavaScript", "Event Loop", "Promises", "Interview Prep"], stack: ["JavaScript", "Browser", "Node.js"],
    summary: ["Synchronous code runs first, then all microtasks, then one task.", "Promise callbacks and queueMicrotask are microtasks; timers are tasks.", "Long microtask chains can starve rendering."],
    sections: [
      { heading: "One thread, many queues", paragraphs: [
        "JavaScript runs your code on a single thread. Asynchronous APIs do not run code in parallel; they schedule callbacks into queues, and the event loop decides what runs next.",
        "Interviewers love event-loop puzzles because the answer reveals whether you understand those queues or only memorised examples.",
      ] },
      { heading: "The order of operations", paragraphs: [
        "After the current script finishes, the engine drains the microtask queue completely: promise reactions, queueMicrotask callbacks and await continuations. Only then does it take the next task (a timer, an event, a message) and, in browsers, possibly render.",
        "Because microtasks run until the queue is empty, a microtask that schedules another microtask runs before any timer, however short.",
      ], bulletPoints: ["await pauses the function and resumes it as a microtask.", "setTimeout(fn, 0) is at least one task later.", "requestAnimationFrame runs before the next paint."] },
      { heading: "Predict the output", paragraphs: ["Read it as: sync first (1, 5), then microtasks in order (3, 4), then the timer task (2)."],
        codeSnippet: { language: "javascript", filename: "event-loop.js", code: `console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3));
queueMicrotask(() => console.log(4));
console.log(5);
// Output: 1 5 3 4 2

async function run() {
  console.log("a");
  await null;          // the rest becomes a microtask
  console.log("b");
}
run();
console.log("c");
// Output: a c b` } },
      { heading: "Practical consequences", paragraphs: ["The event loop explains real performance bugs, not just puzzles."],
        bulletPoints: ["Break long work into chunks so the page can render.", "Do not loop microtasks recursively.", "Use AbortController to cancel stale requests.", "Measure long tasks with the Performance panel."] },
    ],
    takeaway: "Sync code, then every microtask, then one task: with that rule you can predict async behaviour instead of guessing.",
  },
  // ── Backend & APIs ──────────────────────────────────────────────────────────────────────────────────────
  {
    techId: "nodejs", technology: "Node.js", category: "Backend & APIs", color: "#5fa04e", date: "2026-10-21", minutes: 7,
    title: "Modern Node.js Without Extra Dependencies: Test Runner, Watch Mode, Fetch and TypeScript",
    subtitle: "Features now built into Node that replace packages most projects still install.",
    tags: ["Node.js", "node:test", "TypeScript", "Backend"], stack: ["Node.js", "TypeScript"],
    summary: ["node:test and node --watch cover many testing and dev-loop needs.", "fetch, AbortSignal.timeout and web streams are global.", "Current LTS releases can run TypeScript by stripping types."],
    sections: [
      { heading: "Node grew a standard library", paragraphs: [
        "For years a Node project began with installing a test runner, a file watcher, an HTTP client and dotenv. Recent releases build in equivalents for many of those, which means fewer dependencies to audit and update.",
        "Fewer dependencies also means faster installs, smaller containers and a smaller supply-chain attack surface.",
      ] },
      { heading: "What is built in now", paragraphs: [
        "node --test runs tests written with node:test, including mocks and coverage. node --watch restarts on file changes. --env-file loads environment files. fetch, Response, AbortController and web streams are globals.",
        "Recent LTS lines run .ts files by stripping type annotations, which suits scripts and simple services; full type checking still needs tsc.",
      ], bulletPoints: ["Use --env-file instead of dotenv for simple setups.", "Use AbortSignal.timeout for every outbound request.", "Keep tsc for type checking in CI."] },
      { heading: "A test with a timeout-safe fetch", paragraphs: ["No test framework or HTTP library installed."],
        codeSnippet: { language: "typescript", filename: "health.test.ts", code: `import { test } from "node:test";
import assert from "node:assert/strict";

async function health(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(2_000) });
  return { ok: res.ok, status: res.status };
}

test("health endpoint answers within two seconds", async () => {
  const result = await health("http://localhost:3000/api/health");
  assert.equal(result.ok, true);
});

// Run: node --test --env-file=.env` } },
      { heading: "Production habits", paragraphs: ["Node services fail in predictable ways; guard against them up front."],
        bulletPoints: ["Handle SIGTERM and close servers gracefully.", "Never block the event loop with sync file or crypto calls on hot paths.", "Stream large responses instead of buffering.", "Pin the Node major version in CI and production."] },
    ],
    takeaway: "Before installing a package, check whether Node already ships it; the standard library now covers more than most projects realise.",
  },
  {
    techId: "express", technology: "Express 5", category: "Backend & APIs", color: "#353535", date: "2026-10-11", minutes: 6,
    title: "Express 5 Upgrade Guide: Async Errors, New Path Syntax and Safer Defaults",
    subtitle: "What actually breaks when moving from Express 4, and the patterns that keep an Express API tidy.",
    tags: ["Express", "Node.js", "REST API", "Middleware"], stack: ["Express 5", "Node.js", "TypeScript"],
    summary: ["Rejected promises in handlers now reach the error middleware automatically.", "Route path syntax changed: wildcards must be named.", "Validation and central error handling keep handlers small."],
    sections: [
      { heading: "The minimal framework grows up", paragraphs: [
        "Express remains the most widely used Node web framework because it is small and predictable. Version 5 modernises it without changing that character.",
        "The headline change removes the most common Express bug: an async handler that throws and leaves the request hanging.",
      ] },
      { heading: "What changed", paragraphs: [
        "In Express 5, if a handler returns a rejected promise, Express calls next(err) for you. Path matching moved to a newer path-to-regexp, so a bare * must become a named wildcard such as /*splat, and optional segments use braces.",
        "Some long-deprecated methods were removed, and req.body is undefined unless a body parser runs.",
      ], bulletPoints: ["Search your routes for * and ? before upgrading.", "Remove try/catch wrappers that only call next(err).", "Add express.json() explicitly where you read bodies."] },
      { heading: "Handlers with validation and one error handler", paragraphs: ["The async handler can simply throw; the error middleware formats every failure the same way."],
        codeSnippet: { language: "typescript", filename: "server.ts", code: `import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "100kb" }));

const CreateUser = z.object({ email: z.email(), name: z.string().min(1) });

app.post("/users", async (req, res) => {
  const input = CreateUser.parse(req.body);   // throws on bad input
  const user = await db.user.create({ data: input });
  res.status(201).json(user);
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err instanceof z.ZodError ? 400 : 500;
  res.status(status).json({ error: status === 400 ? "invalid_input" : "server_error" });
});

app.listen(3000);` } },
      { heading: "Keeping an Express API healthy", paragraphs: ["Express gives you freedom; these conventions keep it from becoming chaos."],
        bulletPoints: ["Validate every input at the edge.", "Set body size limits.", "Use helmet-style security headers.", "Split routers per resource and keep business logic out of handlers."] },
    ],
    takeaway: "Express 5 removes the async-error footgun; pair it with input validation and one error handler and handlers stay three lines long.",
  },
  {
    techId: "nestjs", technology: "NestJS", category: "Backend & APIs", color: "#e0234e", date: "2026-10-10", minutes: 8,
    title: "NestJS Architecture: Modules, Providers, Guards and Pipes Explained",
    subtitle: "How Nest's dependency injection and request pipeline organise large Node backends.",
    tags: ["NestJS", "Dependency Injection", "Node.js", "Backend Architecture"], stack: ["NestJS", "TypeScript", "class-validator"],
    summary: ["Modules group controllers and providers into features.", "Dependency injection makes services easy to swap and test.", "Guards, pipes and interceptors form a clear request pipeline."],
    sections: [
      { heading: "Structure for big teams", paragraphs: [
        "Express leaves architecture to you, and large codebases drift into inconsistency. NestJS provides the structure up front: modules, controllers, providers and a dependency injection container, inspired by Angular.",
        "New developers find code where they expect it, and cross-cutting concerns like auth and validation live in one place.",
      ] },
      { heading: "The request pipeline", paragraphs: [
        "A request passes through middleware, then guards (may this user call this route?), interceptors (before and after logic such as logging), pipes (validate and transform input), the controller method, and finally exception filters.",
        "Each stage is a class you can apply globally, per controller or per route.",
      ], bulletPoints: ["Use guards for authorization.", "Use the global ValidationPipe with whitelist enabled.", "Keep controllers thin; logic goes in providers."] },
      { heading: "A validated, guarded controller", paragraphs: ["The DTO validates input, the guard checks roles, and the service is injected."],
        codeSnippet: { language: "typescript", filename: "courses.controller.ts", code: `import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { IsInt, IsString, Min } from "class-validator";
import { RolesGuard, Roles } from "../auth/roles";
import { CoursesService } from "./courses.service";

class CreateCourseDto {
  @IsString() title!: string;
  @IsInt() @Min(0) priceInr!: number;
}

@Controller("courses")
@UseGuards(RolesGuard)
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Post()
  @Roles("admin")
  create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }
}` } },
      { heading: "Pitfalls", paragraphs: ["Nest's power comes with some sharp edges."],
        bulletPoints: ["Circular module imports: use forwardRef sparingly and fix the design.", "Request-scoped providers are slower; prefer singletons.", "Remember to enable ValidationPipe globally.", "Test services with the testing module and mocked providers."] },
    ],
    takeaway: "NestJS trades a little ceremony for consistency; in large teams that trade is usually worth it.",
  },
  {
    techId: "graphql", technology: "GraphQL", category: "Backend & APIs", color: "#e10098", date: "2026-10-09", minutes: 8,
    title: "GraphQL in Production: Schema Design, N+1 Queries and DataLoader",
    subtitle: "The performance problem every GraphQL API hits, and the batching pattern that fixes it.",
    tags: ["GraphQL", "DataLoader", "API Design", "Performance"], stack: ["GraphQL", "Node.js", "DataLoader"],
    summary: ["Clients ask for exactly the fields they need in one request.", "Naive resolvers cause N+1 database queries.", "DataLoader batches and caches loads per request."],
    sections: [
      { heading: "Why teams adopt GraphQL", paragraphs: [
        "REST endpoints often return too much or too little, so clients make several calls and discard fields. GraphQL exposes one typed schema; each client asks for exactly the shape it needs.",
        "The schema doubles as documentation and a contract, and tools generate types for the client automatically.",
      ] },
      { heading: "The N+1 trap", paragraphs: [
        "Resolvers run per field. Fetch 50 posts and resolve each post's author naively, and you run 1 query for posts plus 50 for authors. Nested lists multiply the damage.",
        "DataLoader collects all keys requested in one tick of the event loop and loads them with a single batched query, caching results for the rest of the request.",
      ], bulletPoints: ["Create loaders per request, never globally.", "Return results in the same order as the keys.", "Add query depth and complexity limits."] },
      { heading: "Batching authors with DataLoader", paragraphs: ["Fifty author lookups become one query with an IN list."],
        codeSnippet: { language: "typescript", filename: "loaders.ts", code: `import DataLoader from "dataloader";

export function createLoaders() {
  return {
    user: new DataLoader<string, User | null>(async ids => {
      const users = await db.user.findMany({ where: { id: { in: [...ids] } } });
      const byId = new Map(users.map(u => [u.id, u]));
      return ids.map(id => byId.get(id) ?? null); // same order as ids
    }),
  };
}

export const resolvers = {
  Post: {
    author: (post: Post, _args: unknown, ctx: { loaders: ReturnType<typeof createLoaders> }) =>
      ctx.loaders.user.load(post.authorId),
  },
};` } },
      { heading: "Production checklist", paragraphs: ["GraphQL's flexibility needs guard rails."],
        bulletPoints: ["Limit query depth and cost.", "Use persisted queries for public clients.", "Authorise in resolvers or a shared layer, field by field.", "Monitor resolver timings, not just request totals."] },
    ],
    takeaway: "GraphQL is fast only with batching: a per-request DataLoader is not optional once your schema has relationships.",
  },
  {
    techId: "python", technology: "Python", category: "Backend & APIs", color: "#3776ab", date: "2026-10-20", minutes: 7,
    title: "Modern Python for Backend Developers: Type Hints, Dataclasses and asyncio TaskGroups",
    subtitle: "The language features that make Python services safer and faster to reason about.",
    tags: ["Python", "asyncio", "Type Hints", "Backend"], stack: ["Python", "asyncio", "mypy"],
    summary: ["Type hints plus a checker catch bugs before runtime.", "Dataclasses replace boilerplate classes for data.", "asyncio.TaskGroup runs concurrent work with safe cancellation."],
    sections: [
      { heading: "Python is not just for scripts", paragraphs: [
        "Python powers APIs, data pipelines and nearly every AI stack. The language has quietly gained features that make large Python codebases far more maintainable than they were a decade ago.",
        "Used together, type hints, dataclasses and structured concurrency make code read clearly and fail early.",
      ] },
      { heading: "Types and data", paragraphs: [
        "Type hints are optional annotations that tools such as mypy or pyright check. They make refactors safe and editors smarter. Dataclasses generate __init__, __repr__ and comparisons from annotated fields.",
        "For external input, a validation library such as Pydantic turns untrusted JSON into typed objects with clear errors.",
      ], bulletPoints: ["Annotate function boundaries first.", "Use frozen dataclasses for value objects.", "Validate input at the edge, then trust types inside."] },
      { heading: "Concurrent requests with TaskGroup", paragraphs: ["If one task fails, the group cancels the others and raises, so no work is left running in the background."],
        codeSnippet: { language: "python", filename: "fetch_all.py", code: `import asyncio
from dataclasses import dataclass

@dataclass(frozen=True)
class Price:
    symbol: str
    value: float

async def fetch_price(symbol: str) -> Price:
    await asyncio.sleep(0.1)  # stand-in for an HTTP call
    return Price(symbol, 100.0)

async def main() -> list[Price]:
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch_price(s)) for s in ("INFY", "TCS", "HDFC")]
    return [t.result() for t in tasks]

print(asyncio.run(main()))` } },
      { heading: "Habits for production Python", paragraphs: ["Tooling matters as much as language features."],
        bulletPoints: ["Use a lockfile-based tool for reproducible environments.", "Run a type checker and linter in CI.", "Never block the event loop with sync I/O in async code.", "Set timeouts on every network call."] },
    ],
    takeaway: "Type hints, dataclasses and TaskGroups make Python code explicit about data and concurrency, which is what large services need.",
  },
  {
    techId: "redis", technology: "Redis", category: "Backend & APIs", color: "#dc382d", date: "2026-10-19", minutes: 8,
    title: "Redis Patterns Every Backend Engineer Should Know: Caching, Locks and Rate Limits",
    subtitle: "Cache-aside with TTLs, SET NX for locks, and counters for rate limiting, with the failure modes of each.",
    tags: ["Redis", "Caching", "Rate Limiting", "Distributed Locks"], stack: ["Redis", "Node.js"],
    summary: ["Cache-aside with TTLs is the default caching pattern.", "SET with NX and an expiry gives a simple lock.", "INCR with EXPIRE implements fixed-window rate limits."],
    sections: [
      { heading: "More than a cache", paragraphs: [
        "Redis is an in-memory data store with rich data structures: strings, hashes, lists, sets, sorted sets and streams. That makes it useful far beyond caching: sessions, leaderboards, queues, locks and rate limits.",
        "Its speed comes from memory and simple operations, so the design question is always what happens when Redis is unavailable or the data is lost.",
      ] },
      { heading: "Three core patterns", paragraphs: [
        "Cache-aside: read from Redis, on a miss read the database and store the result with a TTL. Locks: SET key value NX PX 30000 succeeds only if the key does not exist. Rate limits: INCR a per-user key and set an expiry on the first increment.",
        "Each pattern needs an expiry; keys without TTLs are the most common cause of Redis memory incidents.",
      ], bulletPoints: ["Always set TTLs on cache keys.", "Add jitter to TTLs to avoid stampedes.", "Release locks only if you still own them."] },
      { heading: "Cache-aside with a stampede guard", paragraphs: ["Only one caller rebuilds an expired entry; others briefly wait and retry."],
        codeSnippet: { language: "typescript", filename: "cache.ts", code: `import { createClient } from "redis";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;

  const lock = await redis.set(\`lock:\${key}\`, "1", { NX: true, PX: 5_000 });
  if (!lock) {
    await new Promise(r => setTimeout(r, 100));
    return cached(key, ttlSeconds, load);
  }
  try {
    const value = await load();
    const jitter = Math.floor(Math.random() * 30);
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds + jitter });
    return value;
  } finally {
    await redis.del(\`lock:\${key}\`);
  }
}` } },
      { heading: "Failure modes to plan for", paragraphs: ["Redis is fast, not magic."],
        bulletPoints: ["Decide whether to fail open or closed when Redis is down.", "Avoid KEYS in production; use SCAN.", "Watch memory and eviction policy.", "Do not treat a single-node lock as safe for money movement."] },
    ],
    takeaway: "Every Redis key needs an owner, a TTL and a plan for when Redis is down.",
  },
  {
    techId: "salesforce", technology: "Salesforce", category: "Enterprise Platforms", color: "#00a1e0", date: "2026-10-08", minutes: 7,
    title: "Salesforce Development Basics: Apex Triggers, SOQL and Governor Limits",
    subtitle: "Writing bulk-safe Apex and understanding the limits that shape every Salesforce design.",
    tags: ["Salesforce", "Apex", "SOQL", "Lightning Web Components"], stack: ["Apex", "SOQL", "LWC"],
    summary: ["Governor limits cap queries, DML and CPU per transaction.", "Triggers must handle up to 200 records at once.", "One trigger per object with a handler class keeps logic testable."],
    sections: [
      { heading: "Programming on a shared platform", paragraphs: [
        "Salesforce runs many customers on shared infrastructure, so it enforces governor limits per transaction: a maximum number of SOQL queries, DML statements, CPU time and heap. Code that ignores them fails the moment real data arrives.",
        "Good Salesforce development is therefore bulk-first: assume every trigger receives a list of records, never a single one.",
      ] },
      { heading: "Bulkification in practice", paragraphs: [
        "Never put SOQL or DML inside a loop. Collect ids first, query once, build maps, then update in one DML call. Keep a single trigger per object that delegates to a handler class.",
        "Tests must cover at least 75% of Apex for deployment, but the real goal is testing bulk scenarios of 200 records.",
      ], bulletPoints: ["Query outside loops; use maps for lookups.", "One DML per object type per transaction where possible.", "Use Queueable or Batch Apex for heavy work."] },
      { heading: "A bulk-safe trigger", paragraphs: ["One query and one update, whether one or two hundred opportunities changed."],
        codeSnippet: { language: "java", filename: "OpportunityTrigger.trigger", code: `trigger OpportunityTrigger on Opportunity (after update) {
    Set<Id> accountIds = new Set<Id>();
    for (Opportunity opp : Trigger.new) {
        if (opp.StageName == 'Closed Won' && Trigger.oldMap.get(opp.Id).StageName != 'Closed Won') {
            accountIds.add(opp.AccountId);
        }
    }
    if (accountIds.isEmpty()) return;

    List<Account> accounts = [SELECT Id, Customer_Since__c FROM Account WHERE Id IN :accountIds];
    for (Account acc : accounts) {
        if (acc.Customer_Since__c == null) acc.Customer_Since__c = Date.today();
    }
    update accounts;
}` } },
      { heading: "Beyond Apex", paragraphs: ["Choose the lightest tool that solves the problem."],
        bulletPoints: ["Prefer Flows for simple automation admins can maintain.", "Use Lightning Web Components for modern UI.", "Respect sharing rules with 'with sharing'.", "Use named credentials for callouts."] },
    ],
    takeaway: "On Salesforce, design for 200 records and the governor limits from the first line of code.",
  },
  // ── Cloud & DevOps ──────────────────────────────────────────────────────────────────────────────────────
  {
    techId: "docker", technology: "Docker", category: "Cloud & DevOps", color: "#2496ed", date: "2026-10-18", minutes: 7,
    title: "Docker Images That Are Small, Fast to Build and Safe to Run",
    subtitle: "Multi-stage builds, layer caching and non-root users for production containers.",
    tags: ["Docker", "Containers", "DevOps", "Security"], stack: ["Docker", "Node.js"],
    summary: ["Multi-stage builds keep compilers out of the final image.", "Ordering layers well makes rebuilds take seconds.", "Running as a non-root user limits damage from a breach."],
    sections: [
      { heading: "Why image quality matters", paragraphs: [
        "A bloated image slows every deploy, costs storage and ships tools an attacker can use. A badly ordered Dockerfile reinstalls dependencies on every code change, turning a one-line fix into a ten-minute build.",
        "A few habits fix both problems and make containers predictable across laptops, CI and production.",
      ] },
      { heading: "Layers and stages", paragraphs: [
        "Each instruction creates a cached layer. Copy dependency manifests and install before copying source, so code changes reuse the dependency layer. Multi-stage builds compile in one stage and copy only the output into a slim runtime stage.",
        "A .dockerignore keeps node_modules, .git and secrets out of the build context.",
      ], bulletPoints: ["Pin base image versions.", "Use npm ci for reproducible installs.", "Copy only build output into the runtime stage."] },
      { heading: "A production Node image", paragraphs: ["Build tools never reach the final image, and the app runs as an unprivileged user."],
        codeSnippet: { language: "dockerfile", filename: "Dockerfile", code: `FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1))"
CMD ["node", "dist/server.js"]` } },
      { heading: "Operational checklist", paragraphs: ["Containers are only as secure as their contents."],
        bulletPoints: ["Scan images for vulnerabilities in CI.", "Never bake secrets into images; inject at runtime.", "Handle SIGTERM for graceful shutdown.", "Set memory and CPU limits."] },
    ],
    takeaway: "Order layers for cache hits, ship only runtime files, and never run as root: that covers most of Docker in production.",
  },
  {
    techId: "aws", technology: "AWS", category: "Cloud & DevOps", color: "#ff9900", date: "2026-10-17", minutes: 8,
    title: "AWS Essentials for Application Developers: IAM, S3 Presigned URLs and Lambda",
    subtitle: "The handful of services and security rules most web apps actually need on AWS.",
    tags: ["AWS", "S3", "IAM", "Serverless"], stack: ["AWS SDK v3", "S3", "Lambda", "IAM"],
    summary: ["IAM least privilege is the foundation of AWS security.", "Presigned URLs let browsers upload to S3 without your server proxying bytes.", "Lambda suits event-driven work with clear time limits."],
    sections: [
      { heading: "Two hundred services, a few that matter", paragraphs: [
        "AWS can feel overwhelming, but most web applications use a small core: IAM for access, S3 for files, a database, a compute option such as Lambda or containers, CloudWatch for logs and a CDN.",
        "Learning those well, especially IAM, prevents the expensive mistakes: public buckets, leaked keys and runaway bills.",
      ] },
      { heading: "IAM, the real foundation", paragraphs: [
        "Every request to AWS is authorised by IAM policies. Grant roles only the actions and resources they need, use roles instead of long-lived access keys, and turn on MFA for humans.",
        "For uploads, do not route files through your server. Generate a short-lived presigned URL that allows exactly one PUT to one key.",
      ], bulletPoints: ["Block public access on buckets by default.", "Scope policies to specific bucket prefixes.", "Set billing alarms on day one."] },
      { heading: "A presigned upload URL", paragraphs: ["The browser uploads straight to S3; the URL expires in five minutes and works for one object key only."],
        codeSnippet: { language: "typescript", filename: "upload-url.ts", code: `import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "ap-south-1" });

export async function uploadUrl(userId: string, fileName: string, contentType: string) {
  const key = \`uploads/\${userId}/\${crypto.randomUUID()}-\${fileName.replace(/[^\\w.-]/g, "_")}\`;
  const command = new PutObjectCommand({ Bucket: process.env.UPLOAD_BUCKET, Key: key, ContentType: contentType });
  return { key, url: await getSignedUrl(s3, command, { expiresIn: 300 }) };
}` } },
      { heading: "Cost and reliability habits", paragraphs: ["Most AWS surprises are billing surprises."],
        bulletPoints: ["Tag every resource with an owner and environment.", "Set log retention; CloudWatch logs grow forever by default.", "Use lifecycle rules to move old S3 objects to cheaper storage.", "Deploy across availability zones for anything user-facing."] },
    ],
    takeaway: "Master IAM and a few core services before reaching for more; least privilege and billing alarms prevent most AWS incidents.",
  },
  {
    techId: "git", technology: "Git", category: "Cloud & DevOps", color: "#f05032", date: "2026-10-16", minutes: 6,
    title: "Git Beyond Commit and Push: Rebase, Bisect, Reflog and Worktrees",
    subtitle: "The commands that rescue lost work, find the commit that broke the build and keep history readable.",
    tags: ["Git", "Version Control", "Developer Productivity"], stack: ["Git"],
    summary: ["Interactive rebase cleans up local history before review.", "git bisect finds the breaking commit with a binary search.", "The reflog recovers almost anything you think you lost."],
    sections: [
      { heading: "Git knowledge compounds", paragraphs: [
        "Most developers use five Git commands and fear the rest. The next five, rebase, bisect, reflog, worktree and restore, save hours every month and turn scary situations into routine ones.",
        "Underneath, Git is simple: commits are snapshots, branches are movable pointers, and almost nothing is truly deleted for weeks.",
      ] },
      { heading: "Merge versus rebase", paragraphs: [
        "Merging preserves exactly what happened, including merge commits. Rebasing replays your commits on top of another branch for a linear history. Rebase your own unpublished work freely; never rewrite history others have pulled.",
        "Interactive rebase lets you squash fixups, reword messages and reorder commits before opening a pull request.",
      ], bulletPoints: ["Use git pull --rebase for local branches.", "Use --force-with-lease, never --force.", "Commit small, focused changes."] },
      { heading: "Rescue and investigation commands", paragraphs: ["bisect turns 'something broke in the last 200 commits' into about eight test runs."],
        codeSnippet: { language: "bash", filename: "git-cheatsheet.sh", code: `# Clean up the last 4 commits before review
git rebase -i HEAD~4

# Find the commit that broke the tests
git bisect start
git bisect bad              # current commit is broken
git bisect good v2.3.0      # this tag was fine
git bisect run npm test     # Git tests the midpoints for you
git bisect reset

# Recover a branch you deleted or a reset you regret
git reflog
git switch -c rescued HEAD@{3}

# Work on a hotfix without stashing your current branch
git worktree add ../hotfix main` } },
      { heading: "Team conventions", paragraphs: ["Consistency matters more than which convention you pick."],
        bulletPoints: ["Write commit messages that explain why.", "Protect the main branch and require reviews.", "Keep pull requests small.", "Never commit secrets; rotate them if you do."] },
    ],
    takeaway: "Commits are snapshots and branches are pointers; once that clicks, rebase, bisect and reflog stop being scary.",
  },
  {
    techId: "github-actions", technology: "GitHub Actions", category: "Cloud & DevOps", color: "#2088ff", date: "2026-10-15", minutes: 7,
    title: "GitHub Actions CI That Is Fast and Secure: Caching, Matrices and Least Privilege",
    subtitle: "A workflow template with dependency caching, cancellation of stale runs and locked-down permissions.",
    tags: ["GitHub Actions", "CI/CD", "DevOps", "Supply Chain Security"], stack: ["GitHub Actions", "Node.js"],
    summary: ["Dependency caching and concurrency groups cut CI time.", "Matrices test several versions in parallel.", "Minimal permissions and pinned actions reduce supply-chain risk."],
    sections: [
      { heading: "CI is a product your team uses daily", paragraphs: [
        "Slow CI changes behaviour: people batch changes, skip tests locally and merge riskier code. Insecure CI is worse, because workflows hold tokens that can push code and publish packages.",
        "A good workflow is fast by default and grants only the permissions each job needs.",
      ] },
      { heading: "Speed and safety settings", paragraphs: [
        "setup-node can cache the npm cache keyed by the lockfile. A concurrency group cancels older runs when a new commit lands on the same branch. A matrix runs the same job across versions in parallel.",
        "Set permissions at the top to read-only and grant write scopes only to the job that needs them. Pin third-party actions to a full commit SHA.",
      ], bulletPoints: ["Use OIDC to cloud providers instead of long-lived secrets.", "Avoid pull_request_target with untrusted code.", "Upload test reports as artifacts."] },
      { heading: "A lean Node CI workflow", paragraphs: ["Read-only token, cached installs and stale runs cancelled automatically."],
        codeSnippet: { language: "yaml", filename: ".github/workflows/ci.yml", code: `name: CI
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm run lint && npx tsc --noEmit
      - run: npm test -- --ci` } },
      { heading: "Maintenance habits", paragraphs: ["Workflows need upkeep like any code."],
        bulletPoints: ["Let a bot update pinned action versions.", "Fail fast on lint before slow tests.", "Keep secrets in environments with required reviewers for deploys.", "Watch workflow run minutes monthly."] },
    ],
    takeaway: "Cache dependencies, cancel stale runs, start from read-only permissions and pin actions: fast and safe CI in one template.",
  },
  // ── Testing & Quality ───────────────────────────────────────────────────────────────────────────────────
  {
    techId: "playwright", technology: "Playwright", category: "Testing & Quality", color: "#2ead33", date: "2026-10-22", minutes: 7,
    title: "Playwright Tests That Do Not Flake: Locators, Web-First Assertions and Traces",
    subtitle: "Why role-based locators and auto-waiting assertions beat sleeps and CSS selectors.",
    tags: ["Playwright", "End-to-End Testing", "Test Automation", "QA"], stack: ["Playwright", "TypeScript"],
    summary: ["getByRole locators match what users see and survive refactors.", "Web-first assertions wait and retry automatically.", "Traces show every step, DOM snapshot and network call of a failure."],
    sections: [
      { heading: "Flaky tests are a design problem", paragraphs: [
        "End-to-end suites earn a bad reputation when tests fail randomly. Almost always the cause is the test, not the tool: fixed sleeps, brittle CSS selectors, or assertions that check once instead of waiting for the UI to settle.",
        "Playwright is built around avoiding those mistakes, if you use its intended APIs.",
      ] },
      { heading: "Locators and assertions", paragraphs: [
        "Locators such as getByRole('button', { name: 'Save' }) find elements the way assistive technology and users do. Actions auto-wait for elements to be visible, enabled and stable.",
        "Assertions like expect(locator).toBeVisible() and toHaveText() retry until they pass or time out, so you never need waitForTimeout.",
      ], bulletPoints: ["Prefer getByRole, getByLabel and getByText.", "Use test ids only when no accessible name exists.", "Never use page.waitForTimeout in tests."] },
      { heading: "A sign-in test with storage reuse", paragraphs: ["Assertions wait for the dashboard instead of sleeping."],
        codeSnippet: { language: "typescript", filename: "sign-in.spec.ts", code: `import { test, expect } from "@playwright/test";

test("a learner signs in and reaches the dashboard", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("learner@example.com");
  await page.getByLabel("Password").fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\\/learning/);
  await expect(page.getByRole("heading", { name: /your preparation/i })).toBeVisible();
  await page.context().storageState({ path: "playwright/.auth/learner.json" });
});` } },
      { heading: "Running suites at scale", paragraphs: ["Configuration matters as much as test code."],
        bulletPoints: ["Record traces on first retry and open them for failures.", "Reuse authentication state instead of logging in per test.", "Run tests in parallel with isolated data.", "Mock third-party services with route()."] },
    ],
    takeaway: "Use accessible locators and web-first assertions, and flakiness mostly disappears; traces explain the rest.",
  },
  {
    techId: "cypress", technology: "Cypress", category: "Testing & Quality", color: "#3a4b5c", date: "2026-10-12", minutes: 6,
    title: "Cypress Best Practices: Retry-ability, cy.intercept and Stable Selectors",
    subtitle: "How Cypress commands queue and retry, and how to stub the network for fast, deterministic tests.",
    tags: ["Cypress", "End-to-End Testing", "Component Testing"], stack: ["Cypress", "TypeScript"],
    summary: ["Cypress commands are queued and queries retry until assertions pass.", "cy.intercept stubs or waits on network calls.", "data-cy attributes keep selectors stable."],
    sections: [
      { heading: "How Cypress thinks", paragraphs: [
        "Cypress commands do not run immediately; they are queued and executed in order. Queries like cy.get retry, together with the assertions chained after them, until they pass or time out.",
        "Understanding that model explains most beginner confusion, such as why you cannot assign a cy.get result to a variable.",
      ] },
      { heading: "Network control", paragraphs: [
        "cy.intercept matches requests and can stub responses from fixtures or simply alias them so the test can wait for them. Waiting on an aliased request is far more reliable than waiting a fixed time.",
        "Stubbing third-party and slow endpoints keeps tests fast; keep a few full-stack tests unstubbed to catch integration problems.",
      ], bulletPoints: ["Alias requests and cy.wait('@alias').", "Use fixtures for stable data.", "Reset state through APIs, not the UI."] },
      { heading: "Stubbing and waiting on an API", paragraphs: ["The test controls the data and waits for the exact request."],
        codeSnippet: { language: "typescript", filename: "courses.cy.ts", code: `describe("course list", () => {
  it("shows courses from the API", () => {
    cy.intercept("GET", "/api/courses", { fixture: "courses.json" }).as("courses");
    cy.visit("/courses");
    cy.wait("@courses");
    cy.get("[data-cy=course-card]").should("have.length", 3).first().should("contain.text", "Next.js");
  });
});` } },
      { heading: "Avoid these", paragraphs: ["Common anti-patterns from the Cypress docs and real projects."],
        bulletPoints: ["cy.wait(3000) with a number.", "Selectors tied to CSS classes.", "Tests that depend on each other's state.", "Logging in through the UI in every test; use cy.session."] },
    ],
    takeaway: "Work with Cypress's retrying command queue, control the network with intercepts, and select by data-cy.",
  },
  {
    techId: "jest", technology: "Jest", category: "Testing & Quality", color: "#c21325", date: "2026-10-11", minutes: 6,
    title: "Jest Mocks Without Tears: jest.fn, jest.mock and Fake Timers",
    subtitle: "When to mock, what to mock, and how to keep mocks from hiding real bugs.",
    tags: ["Jest", "Unit Testing", "Mocking", "JavaScript Testing"], stack: ["Jest", "TypeScript"],
    summary: ["jest.fn records calls and can return controlled values.", "jest.mock replaces whole modules; mock at boundaries only.", "Fake timers make time-based code deterministic."],
    sections: [
      { heading: "Mocks are a scalpel", paragraphs: [
        "Mocking makes tests fast and deterministic by replacing slow or unpredictable dependencies. Overused, it produces tests that pass while the real code is broken, because the test only checks your assumptions about the mock.",
        "The rule of thumb: mock at system boundaries (network, clock, randomness, third-party SDKs), not your own logic.",
      ] },
      { heading: "The three tools", paragraphs: [
        "jest.fn creates a spy whose calls you can assert and whose return values you control. jest.mock('module') swaps a module's exports for the whole test file. jest.useFakeTimers lets you advance time instantly.",
        "Reset mocks between tests so one test's setup never leaks into another.",
      ], bulletPoints: ["Use mockResolvedValue for async functions.", "Assert on behaviour users see, not internal calls, when possible.", "Restore real timers after each test."] },
      { heading: "Testing a retry with fake timers", paragraphs: ["The test runs in milliseconds even though the code waits a second between attempts."],
        codeSnippet: { language: "typescript", filename: "retry.test.ts", code: `import { retry } from "./retry";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("retries once after a failure, then succeeds", async () => {
  const call = jest.fn().mockRejectedValueOnce(new Error("busy")).mockResolvedValueOnce("ok");

  const promise = retry(call, { attempts: 2, delayMs: 1000 });
  await jest.advanceTimersByTimeAsync(1000);

  await expect(promise).resolves.toBe("ok");
  expect(call).toHaveBeenCalledTimes(2);
});` } },
      { heading: "Keeping a suite healthy", paragraphs: ["Fast, honest tests are a team asset."],
        bulletPoints: ["Enable clearMocks or restoreMocks in config.", "Avoid large snapshots nobody reads.", "Test error paths, not just happy paths.", "Run tests in CI with --ci to fail on missing snapshots."] },
    ],
    takeaway: "Mock the boundaries, keep your own logic real, and control time with fake timers.",
  },
  {
    techId: "vitest", technology: "Vitest", category: "Testing & Quality", color: "#6e9f18", date: "2026-10-10", minutes: 6,
    title: "Vitest: Fast Unit Tests That Share Your Vite Config",
    subtitle: "Why Vitest feels instant, how vi.mock differs from jest.mock, and when to use browser mode.",
    tags: ["Vitest", "Vite", "Unit Testing", "TypeScript"], stack: ["Vitest", "Vite", "TypeScript"],
    summary: ["Vitest reuses Vite's transform pipeline, so TypeScript and JSX need no extra setup.", "Its API is largely Jest-compatible.", "Watch mode reruns only affected tests."],
    sections: [
      { heading: "One config for app and tests", paragraphs: [
        "Projects built with Vite used to need a separate Babel or ts-jest setup for Jest, with aliases and plugins configured twice. Vitest runs tests through Vite itself, so the same config works for both.",
        "Combined with smart watch mode, feedback after a save is usually near-instant.",
      ] },
      { heading: "Familiar API, small differences", paragraphs: [
        "describe, it, expect and most matchers match Jest. Mocks use vi instead of jest: vi.fn, vi.spyOn, vi.mock and vi.useFakeTimers. vi.mock calls are hoisted, and vi.hoisted helps share values with mock factories.",
        "Environments such as jsdom or happy-dom are set per project or per file; browser mode runs tests in a real browser when DOM fidelity matters.",
      ], bulletPoints: ["Set globals: true only if you want Jest-style globals.", "Use vi.mocked for typed mocks.", "Use in-source tests sparingly for tiny utilities."] },
      { heading: "A typed mock in Vitest", paragraphs: ["vi.mocked gives the mock full TypeScript types."],
        codeSnippet: { language: "typescript", filename: "price.test.ts", code: `import { describe, expect, it, vi } from "vitest";
import { getRate } from "./rates";
import { toInr } from "./price";

vi.mock("./rates", () => ({ getRate: vi.fn() }));

describe("toInr", () => {
  it("converts using the current rate", async () => {
    vi.mocked(getRate).mockResolvedValue(83.2);
    await expect(toInr(10, "USD")).resolves.toBe(832);
    expect(getRate).toHaveBeenCalledWith("USD");
  });
});` } },
      { heading: "Migrating from Jest", paragraphs: ["Most suites migrate with search and replace plus a few config changes."],
        bulletPoints: ["Replace jest. with vi. in mocks and timers.", "Move moduleNameMapper aliases into Vite resolve.alias.", "Check snapshot formats once.", "Keep coverage thresholds in CI."] },
    ],
    takeaway: "If your app is built with Vite, Vitest gives you Jest's API with zero duplicate configuration and faster feedback.",
  },
  {
    techId: "rtl", technology: "React Testing Library", category: "Testing & Quality", color: "#e33332", date: "2026-10-09", minutes: 6,
    title: "React Testing Library: Test What Users Do, Not How Components Work",
    subtitle: "Query priorities, user-event and async utilities for component tests that survive refactors.",
    tags: ["React Testing Library", "Component Testing", "Accessibility", "React"], stack: ["React Testing Library", "user-event", "Jest or Vitest"],
    summary: ["Query by role and label first, the way users and screen readers find things.", "userEvent simulates real interactions, including focus and typing.", "findBy queries wait for async UI."],
    sections: [
      { heading: "The guiding principle", paragraphs: [
        "Tests that inspect state or internal methods break whenever you refactor, even when users notice nothing. React Testing Library pushes you to test through the rendered DOM, the way a user interacts.",
        "A useful side effect: if an element is hard to query by role or label, it is probably not accessible either.",
      ] },
      { heading: "Queries and interactions", paragraphs: [
        "Prefer getByRole with an accessible name, then getByLabelText, then getByText; use test ids as a last resort. getBy throws if missing, queryBy returns null for absence checks, and findBy waits for elements that appear later.",
        "userEvent.setup() simulates full interactions (pointer, keyboard, focus), which catches bugs fireEvent misses.",
      ], bulletPoints: ["Use screen for queries.", "Await userEvent calls.", "Use findBy instead of waitFor around getBy."] },
      { heading: "Testing a search box", paragraphs: ["The test types like a user and waits for results to appear."],
        codeSnippet: { language: "tsx", filename: "Search.test.tsx", code: `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Search } from "./Search";

test("shows matching courses as the user types", async () => {
  const user = userEvent.setup();
  render(<Search />);

  await user.type(screen.getByRole("searchbox", { name: /search courses/i }), "next");

  expect(await screen.findByRole("link", { name: /next\\.js 16/i })).toBeInTheDocument();
  expect(screen.queryByText(/no results/i)).not.toBeInTheDocument();
});` } },
      { heading: "Common mistakes", paragraphs: ["Kent C. Dodds' list of common mistakes is still the best checklist; these are the frequent ones."],
        bulletPoints: ["Wrapping things in act() unnecessarily.", "Using container.querySelector.", "Asserting on class names instead of visible behaviour.", "Forgetting to await async user events."] },
    ],
    takeaway: "Query like a user, interact like a user, and assert what a user would see.",
  },
  // ── Computer Science & Architecture ─────────────────────────────────────────────────────────────────────
  {
    techId: "system-design", technology: "System Design", category: "System Architecture", color: "#475569", date: "2026-10-24", minutes: 9,
    title: "System Design Interviews: A Repeatable Framework and a Rate Limiter Walkthrough",
    subtitle: "Requirements, estimates, APIs, data and scaling, applied to one classic question end to end.",
    tags: ["System Design", "Interview Prep", "Rate Limiting", "Scalability"], stack: ["System Design", "Redis", "TypeScript"],
    summary: ["Clarify requirements and estimate load before drawing boxes.", "Design the API and data model, then scale the bottleneck.", "Discuss trade-offs explicitly; there is no single right answer."],
    sections: [
      { heading: "What interviewers actually assess", paragraphs: [
        "System design interviews are not about naming every technology. Interviewers want to see you turn a vague prompt into requirements, make reasonable estimates, pick a simple design and evolve it as constraints appear.",
        "A repeatable framework keeps you calm and makes sure you cover the parts they score.",
      ] },
      { heading: "The five-step framework", paragraphs: [
        "1) Requirements: functional and non-functional (latency, availability, consistency). 2) Estimates: requests per second, storage, bandwidth. 3) API and data model. 4) High-level design. 5) Deep dives and trade-offs: caching, sharding, queues, failure handling.",
        "Spend the first five minutes on requirements. Designs fail most often because they solve the wrong problem.",
      ], bulletPoints: ["State assumptions out loud.", "Start simple, then scale the measured bottleneck.", "Name the trade-off of every choice."] },
      { heading: "Rate limiter: token bucket", paragraphs: ["Each client has a bucket that refills at a steady rate; a request spends one token. Bursts are allowed up to the bucket size. In production the state lives in Redis, updated atomically with a script."],
        codeSnippet: { language: "typescript", filename: "token-bucket.ts", code: `type Bucket = { tokens: number; updatedAt: number };

export function allow(bucket: Bucket, capacity: number, refillPerSecond: number, now = Date.now()) {
  const elapsed = (now - bucket.updatedAt) / 1000;
  const tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerSecond);
  if (tokens < 1) return { allowed: false, bucket: { tokens, updatedAt: now } };
  return { allowed: true, bucket: { tokens: tokens - 1, updatedAt: now } };
}

// 100 requests per minute with bursts of 20:
// capacity = 20, refillPerSecond = 100 / 60` } },
      { heading: "Deep-dive talking points", paragraphs: ["Raise these yourself; it shows senior judgement."],
        bulletPoints: ["Fail open or closed when the limiter's store is down?", "Per user, per IP or per API key limits?", "Return 429 with a Retry-After header.", "Sliding window versus token bucket accuracy trade-offs."] },
    ],
    takeaway: "Requirements, estimates, API, design, trade-offs: follow the same five steps every time and adapt the depth to the question.",
  },
  {
    techId: "dsa", technology: "DSA", category: "Computer Science", color: "#0891b2", date: "2026-10-13", minutes: 8,
    title: "Eight DSA Patterns That Solve Most Coding Interview Problems",
    subtitle: "Recognise the pattern first, then write the code: two pointers, sliding window, hashing and more.",
    tags: ["DSA", "Algorithms", "Coding Interview", "Big O"], stack: ["Algorithms", "TypeScript"],
    summary: ["Most interview problems are variations of a small set of patterns.", "State the brute force and its complexity before optimising.", "Sliding window turns many O(n²) substring problems into O(n)."],
    sections: [
      { heading: "Patterns beat memorisation", paragraphs: [
        "Solving hundreds of random problems is slow and forgettable. Interview problems cluster around a few patterns, and recognising the pattern is most of the work.",
        "Always start by stating a brute-force solution and its time and space complexity; then look for the pattern that removes the repeated work.",
      ] },
      { heading: "The eight patterns", paragraphs: [
        "Two pointers (sorted arrays, pairs). Sliding window (contiguous subarrays and substrings). Hash maps (counting, lookups in O(1)). Binary search (sorted data or monotonic answers). BFS and DFS (graphs, trees, grids). Heaps (top-k, scheduling). Dynamic programming (overlapping subproblems). Backtracking (generate all combinations).",
        "Each has signal words: 'contiguous' suggests sliding window; 'shortest path in an unweighted graph' suggests BFS; 'k largest' suggests a heap.",
      ], bulletPoints: ["Say the complexity of every solution.", "Test with edge cases: empty, one element, duplicates.", "Name variables for what they mean."] },
      { heading: "Sliding window in practice", paragraphs: ["Longest substring without repeating characters in O(n): the window only moves forward."],
        codeSnippet: { language: "typescript", filename: "longest-unique.ts", code: `export function longestUnique(s: string): number {
  const lastSeen = new Map<string, number>();
  let start = 0;
  let best = 0;
  for (let end = 0; end < s.length; end++) {
    const ch = s[end];
    const seen = lastSeen.get(ch);
    if (seen !== undefined && seen >= start) start = seen + 1; // shrink past the duplicate
    lastSeen.set(ch, end);
    best = Math.max(best, end - start + 1);
  }
  return best;
}

longestUnique("abcabcbb"); // 3 ("abc")` } },
      { heading: "How to practise", paragraphs: ["Deliberate practice beats volume."],
        bulletPoints: ["Do five problems per pattern before mixing.", "Re-solve problems a week later without notes.", "Explain your approach aloud as in an interview.", "Time-box: 25 minutes, then study the solution."] },
    ],
    takeaway: "Identify the pattern, state the brute force, then optimise: that sequence is what interviewers want to see.",
  },
  {
    techId: "oops", technology: "OOPs", category: "Computer Science", color: "#9333ea", date: "2026-10-08", minutes: 7,
    title: "Object-Oriented Design That Ages Well: Encapsulation, Polymorphism and SOLID",
    subtitle: "The four pillars in practical terms, and why composition usually beats inheritance.",
    tags: ["OOPs", "SOLID", "Design Patterns", "Interview Prep"], stack: ["TypeScript", "Design Patterns"],
    summary: ["Encapsulation protects invariants; abstraction hides details.", "Polymorphism lets new behaviour plug in without editing callers.", "Prefer composition to deep inheritance trees."],
    sections: [
      { heading: "Pillars, translated", paragraphs: [
        "Encapsulation means an object guards its own rules: a BankAccount never lets the balance go negative because only its methods change it. Abstraction exposes what an object does, not how. Inheritance reuses behaviour; polymorphism lets different objects answer the same message in their own way.",
        "Interviewers rarely want textbook definitions; they want examples of how these ideas keep code changeable.",
      ] },
      { heading: "SOLID in one paragraph each", paragraphs: [
        "Single responsibility: one reason to change. Open/closed: add behaviour by adding code, not editing working code. Liskov substitution: subclasses must honour the parent's promises. Interface segregation: small, focused interfaces. Dependency inversion: depend on abstractions so implementations can be swapped.",
        "Applied together, they make adding a feature a matter of writing a new class rather than editing ten files.",
      ], bulletPoints: ["Favour small interfaces.", "Inject dependencies through constructors.", "Avoid inheritance deeper than two levels."] },
      { heading: "Strategy pattern: polymorphism over if-else", paragraphs: ["Adding a new payment method means adding one class; checkout never changes."],
        codeSnippet: { language: "typescript", filename: "payments.ts", code: `interface PaymentMethod {
  readonly name: string;
  charge(amountInr: number): Promise<string>; // returns a receipt id
}

class UpiPayment implements PaymentMethod {
  readonly name = "UPI";
  constructor(private readonly vpa: string) {}
  async charge(amountInr: number) { return \`upi-\${this.vpa}-\${amountInr}\`; }
}

class CardPayment implements PaymentMethod {
  readonly name = "Card";
  constructor(private readonly token: string) {}
  async charge(amountInr: number) { return \`card-\${this.token.slice(-4)}-\${amountInr}\`; }
}

export async function checkout(method: PaymentMethod, amountInr: number) {
  if (amountInr <= 0) throw new Error("Amount must be positive");
  return method.charge(amountInr);
}` } },
      { heading: "Interview tips", paragraphs: ["Show judgement, not vocabulary."],
        bulletPoints: ["Explain a real refactor where SOLID helped.", "Know when OOP is overkill (simple scripts, data pipelines).", "Discuss composition versus inheritance trade-offs.", "Name one design pattern you used and why."] },
    ],
    takeaway: "Good object-oriented design is about protecting invariants and making change cheap, not about class hierarchies.",
  },
];

export const TECHNOLOGY_ARTICLES: TechBuzzArticle[] = SEEDS.map(article);
