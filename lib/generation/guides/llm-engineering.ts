import type { TechnologyGuide } from "./index";
import { source } from "./shared";
import { FUNDAMENTAL_LESSONS } from "@/lib/notes-fundamentals-catalog";

/**
 * How LLM applications and agents are engineered: tokens and the Messages
 * API, tool use and MCP, context engineering, the agent loop and loop
 * engineering, and memory — grounded in platform.claude.com, code.claude.com,
 * modelcontextprotocol.io and Anthropic's engineering articles.
 */
const guide: TechnologyGuide = {
  id: "llm-context-loop-memory",
  technologyId: "ai",
  topicId: "llm-context-loop-memory",
  level: "intermediate",
  curriculum: {
    title: "LLMs, MCP, Context, Loop Engineering and Memory",
    minutes: 220,
    objectives: [
      "Explain tokens, context windows and next-token prediction, and what they mean for cost and quality.",
      "Call the Claude Messages API with system prompts, tools and the tool-use loop.",
      "Engineer context deliberately: the attention budget, just-in-time retrieval and minimal tools.",
      "Design agent loops with clear verification, stop conditions, turn limits and budgets.",
      "Give agents memory with compaction, context editing, the memory tool and structured notes.",
      "Place MCP in an agent architecture as the standard way to connect tools and data.",
    ],
    prerequisites: [
      "Programming experience in TypeScript or Python.",
      "An Anthropic API key for the code examples.",
      "Optional: the 'Claude Skills, Plugins and MCP' guide in this library.",
    ],
    lessons: [
      {
        title: "How LLMs work: tokens, context and generation",
        diagram: {
          kind: "flow",
          caption: "An LLM turns text into tokens, reads everything in its context window at once, and generates the reply one token at a time until it reaches a stop condition.",
          items: [
            { label: "Text is split into tokens", detail: "word pieces; cost and limits are counted in tokens" },
            { label: "The context window is assembled", detail: "system prompt + tools + history + new input" },
            { label: "The model predicts the next token", detail: "a probability distribution over the vocabulary" },
            { label: "One token is chosen and appended", detail: "then the prediction repeats" },
            { label: "Generation stops", detail: "end of turn, max_tokens, a stop sequence or a tool call" },
          ],
        },
        explanation: "- A large language model is trained to predict the next token given everything before it\n- Tokens are chunks of text; both input and output are billed and limited in tokens\n- The context window is everything the model can see in one request, and it is stateless between requests\n- Each response ends with a stop reason, such as end_turn, max_tokens or tool_use\n- The model has no memory beyond the context you send; persistence must be engineered",
        keyPoints: [
          { tone: "key", title: "The API is stateless", text: "A model sees only what you send in one request: system prompt, tool definitions, history and new input. A chat that 'remembers' is resending earlier messages every turn, and anything not sent is unknown to the model.", example: "messages: [...history, { role: 'user', content }]" },
          { tone: "tip", title: "Always read stop_reason", text: "Each response says why it ended: end_turn when finished, max_tokens when cut off, tool_use when a tool is requested, refusal when declined. Checking it prevents showing truncated answers as if they were complete.", example: "if (res.stop_reason === 'max_tokens') retryWithMoreTokens()" },
          { tone: "warning", title: "Fluent is not the same as true", text: "Models generate plausible text, including confident mistakes. Ground factual answers in retrieved sources or tools, ask for citations, and verify anything important before acting on it.", example: "Answer only from the provided documents; cite the section." },
        ],
        example: "- 'Explain closures' becomes a handful of tokens plus the system prompt and history\n- A reply ending with stop_reason: 'max_tokens' was truncated and needs a higher limit\n- A chat app that 'remembers' actually resends earlier messages each turn\n- A model asked about yesterday's news cannot know it without a tool or retrieved context",
        code: "import Anthropic from '@anthropic-ai/sdk';\n\nconst client = new Anthropic(); // reads ANTHROPIC_API_KEY\n\nconst response = await client.messages.create({\n  model: 'claude-sonnet-5',\n  max_tokens: 1024,\n  system: 'You are a concise tutor for college students.',\n  messages: [\n    { role: 'user', content: 'Explain a JavaScript closure in two sentences.' },\n  ],\n});\n\nfor (const block of response.content) {\n  if (block.type === 'text') console.log(block.text);\n}\nconsole.log(response.stop_reason);   // 'end_turn'\nconsole.log(response.usage);         // { input_tokens, output_tokens, ... }",
        apiReference: [
          {
            name: "messages.create",
            kind: "API",
            signature: "client.messages.create({ model, max_tokens, messages, system?, tools?, tool_choice?, stop_sequences? })",
            params: [
              { name: "model", type: "string", description: "The model ID, e.g. claude-sonnet-5 or claude-opus-5." },
              { name: "max_tokens", type: "number", description: "Upper limit on generated tokens for this response." },
              { name: "messages", type: "{ role, content }[]", description: "Alternating user and assistant turns: the full history you want the model to see." },
              { name: "system", type: "string", description: "Instructions and role that apply to the whole conversation." },
            ],
            returns: "A message with content blocks, stop_reason and token usage.",
          },
        ],
        exercise: "- Send the same question with and without a system prompt and compare\n- Force a truncation with a tiny max_tokens and detect it from stop_reason\n- Build a two-turn conversation by resending the history",
        checkpoint: "- Why does a chat app resend earlier messages?\n- What does stop_reason 'max_tokens' tell you?\n- Why does adding irrelevant context hurt quality as well as cost?",
        mistake: "- Do not assume the model remembers previous requests\n- Do not ignore stop_reason; truncated output looks complete to users\n- Do not trust unverified facts in generated text",
        interview: [
          {
            question: "What is a context window, and why does it matter when building LLM applications?",
            definition: "The context window is the maximum amount of tokens (instructions, tools, history and input) a model can consider in one request.",
            answer: "It bounds everything the model knows at that moment, because the API is stateless. Long conversations, large documents and many tool definitions all compete for it, raising cost and latency and diluting attention, an effect called context rot. Applications therefore curate what enters the window: summarising history, retrieving only relevant documents and loading tools on demand.",
            similar: [
              { question: "What is a token?", answer: "A chunk of text, often a word or word piece, that the model reads and generates; usage and limits are counted in tokens." },
            ],
          },
        ],
      },
      {
        title: "Tool use: letting the model act",
        diagram: {
          kind: "flow",
          caption: "The tool-use loop: the model asks for a tool with structured input, your code runs it, and the result goes back as the next user message until the model answers in text.",
          items: [
            { label: "Send messages + tool definitions", detail: "name, description, input_schema" },
            { label: "Model replies with tool_use", detail: "stop_reason: 'tool_use'" },
            { label: "Your code runs the tool", detail: "validate input, call the API or function" },
            { label: "Send a tool_result block", detail: "matching tool_use_id, as a user turn" },
            { label: "Model answers or calls again", detail: "loop until stop_reason: 'end_turn'" },
          ],
        },
        explanation: "- A tool is a function the model may request; you describe it with a name, description and JSON Schema\n- The model never runs code itself: it emits a tool_use block and your application executes it\n- Results return as tool_result blocks with the matching tool_use_id\n- The loop continues until the model replies without tool calls\n- SDK tool runners automate this loop; MCP standardises where tools come from",
        keyPoints: [
          { tone: "key", title: "The model requests; your code executes", text: "The model never runs anything itself. It returns a tool_use block with structured input, your application runs the function, and you send back a tool_result with the same id. The loop repeats until the model answers in text.", example: "{ type: 'tool_result', tool_use_id: block.id, content }" },
          { tone: "tip", title: "Tool descriptions are prompts", text: "Name tools precisely, say when to use them, and describe every parameter in the JSON Schema. Return failures as results with is_error: true so the model can adapt instead of guessing.", example: "description: 'Current weather for a city. Use for any weather question.'" },
          { tone: "warning", title: "Treat tool input as untrusted", text: "Arguments come from model output, which can be wrong or manipulated by content the model read. Validate inputs, never pass them straight to a shell or SQL, and require confirmation for destructive actions.", example: "const { city } = WeatherInput.parse(block.input)" },
        ],
        example: "- A get_weather tool with input_schema { location: string } answers 'Should I carry an umbrella in Pune?'\n- The model returns tool_use { name: 'get_weather', input: { location: 'Pune' } }\n- Your code calls the weather API and returns the forecast as tool_result\n- The model then writes the final answer in text",
        code: "import Anthropic from '@anthropic-ai/sdk';\nconst client = new Anthropic();\n\nconst tools = [{\n  name: 'get_weather',\n  description: 'Get the current weather for a city. Use for any question about current weather.',\n  input_schema: {\n    type: 'object',\n    properties: { location: { type: 'string', description: 'City name, e.g. Pune' } },\n    required: ['location'],\n  },\n}];\n\nconst messages = [{ role: 'user', content: 'Do I need an umbrella in Pune today?' }];\n\nwhile (true) {\n  const reply = await client.messages.create({ model: 'claude-sonnet-5', max_tokens: 1024, tools, messages });\n  messages.push({ role: 'assistant', content: reply.content });\n  if (reply.stop_reason !== 'tool_use') {\n    console.log(reply.content.find(b => b.type === 'text')?.text);\n    break;\n  }\n  const results = [];\n  for (const block of reply.content) {\n    if (block.type !== 'tool_use') continue;\n    const forecast = await getWeather(block.input.location);   // your code\n    results.push({ type: 'tool_result', tool_use_id: block.id, content: forecast });\n  }\n  messages.push({ role: 'user', content: results });\n}",
        apiReference: [
          {
            name: "Tool definition",
            kind: "object",
            signature: "{ name: string, description: string, input_schema: JSONSchema }",
            params: [
              { name: "name", type: "string", description: "Identifier the model uses in tool_use blocks." },
              { name: "description", type: "string", description: "When and why to use the tool; the model relies on it." },
              { name: "input_schema", type: "JSON Schema", description: "The shape of the input the model must produce." },
            ],
            returns: "Nothing by itself; the model emits tool_use blocks that reference it.",
          },
          {
            name: "tool_result",
            kind: "content block",
            signature: "{ type: 'tool_result', tool_use_id: string, content: string | blocks, is_error?: boolean }",
            params: [{ name: "tool_use_id", type: "string", description: "The id of the tool_use block being answered." }],
            returns: "Context for the model's next step.",
          },
        ],
        exercise: "- Add a second tool and ask a question that needs both\n- Make the tool fail and return is_error: true; watch the model adapt\n- Cap the loop at five iterations to prevent runaway calls",
        checkpoint: "- Who executes a tool: the model or your application?\n- How does the model know which result belongs to which call?\n- Why cap the number of loop iterations?",
        mistake: "- Do not give tools vague names like 'do' or 'process'\n- Do not run tool input through a shell or database without validation\n- Do not drop the assistant's tool_use message from the history before sending results",
      },
      {
        title: "Context engineering",
        diagram: {
          kind: "split",
          caption: "Prompt engineering writes good instructions once; context engineering decides, on every turn, which tokens deserve a place in the window.",
          headings: ["Prompt engineering", "Context engineering"],
          items: [
            { label: "Writing the instructions", detail: "wording, role, examples", group: 0 },
            { label: "A single, discrete task", group: 0 },
            { label: "Optimised once", group: 0 },
            { label: "Curating everything in the window", detail: "prompt, tools, history, data", group: 1 },
            { label: "Iterative, every turn of an agent", group: 1 },
            { label: "Managing a finite attention budget", group: 1 },
          ],
        },
        explanation: "- Context engineering is curating and maintaining the optimal set of tokens during inference\n- Context rot: as the window fills, the model recalls information from it less reliably\n- Write system prompts at the right altitude: specific heuristics, not brittle if-else rules or vague slogans\n- Keep toolsets minimal and non-overlapping so the model never faces an ambiguous choice\n- Prefer just-in-time retrieval: keep references (paths, URLs, IDs) and load content only when needed",
        keyPoints: [
          { tone: "key", title: "Curate a finite attention budget", text: "As context grows, recall degrades (context rot). Every token should earn its place: prefer fewer, more relevant documents and tools over dumping everything in 'just in case'.", example: "3 relevant passages > 300 pasted pages" },
          { tone: "tip", title: "Retrieve just in time", text: "Keep lightweight references such as file paths, URLs or IDs in context and let the agent load content with tools only when a step needs it, the way people use bookmarks and search instead of memorising everything.", example: "Grep -> Read the 2 files that matter" },
          { tone: "warning", title: "Overlapping tools cause bad choices", text: "Two tools with near-identical jobs (search_docs and find_docs) force the model to guess. Keep toolsets minimal, distinct and self-explanatory; merge or rename anything a human would also find ambiguous.", example: "one search_docs tool with a 'scope' parameter" },
        ],
        example: "- Instead of pasting 40 files, give the agent Glob, Grep and Read and let it find the 3 it needs\n- Replace 'always be helpful' with concrete heuristics: 'prefer existing utilities; ask before adding dependencies'\n- Store a document's path in context and read it only if the task touches it\n- Mark a long, stable system prompt with cache_control so repeated calls reuse it",
        useCase: {
          scenario: "A support agent is given the full product manual (hundreds of pages) in its system prompt and still answers questions about the wrong product version.",
          example: "Remove the manual from the prompt, add a search_manual tool that returns the top matching sections with their version, and instruct the agent to always cite the section and version it used.",
          usage: "Each answer now draws on a few relevant, versioned passages, costs far fewer tokens, and is easy to verify.",
        },
        code: "// A system prompt at the right altitude\nconst system = `You are a code-review assistant for a TypeScript monorepo.\n\n<guidelines>\n- Prefer existing helpers in packages/shared over new utilities.\n- Flag missing tests for changed logic; do not rewrite working code for style.\n- If a change touches payments/, ask for a second reviewer.\n</guidelines>\n\n<process>\nFind the relevant files with the search tools before commenting.\nQuote the exact line you are commenting on.\n</process>`;\n\n// Prompt caching for a large, stable prefix\nconst response = await client.messages.create({\n  model: 'claude-sonnet-5',\n  max_tokens: 2048,\n  system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],\n  tools,            // a small, non-overlapping set\n  messages,\n});",
        exercise: "- Rewrite a 'wall of rules' system prompt into short sections with heuristics\n- Remove one tool from an agent whose job overlaps another and compare results\n- Replace pasted documents with a retrieval tool that returns references first",
        checkpoint: "- What is context rot?\n- What does 'the right altitude' mean for a system prompt?\n- Why is just-in-time retrieval often better than pre-loading?",
        mistake: "- Do not stuff every possibly-relevant document into the prompt\n- Do not encode business logic as long, brittle rule lists\n- Do not ship overlapping tools with near-identical descriptions",
        interview: [
          {
            question: "How is context engineering different from prompt engineering?",
            definition: "Prompt engineering focuses on writing instructions; context engineering manages every token that enters the context window across an agent's run.",
            answer: "Prompt engineering optimises the wording of a system prompt for a discrete task. Context engineering treats the whole window, instructions, tools, examples, message history and retrieved data, as a finite attention budget to curate on every turn. Its techniques include minimal toolsets, just-in-time retrieval, compaction of long histories, structured note-taking and sub-agents that return condensed summaries.",
            similar: [
              { question: "What is just-in-time retrieval?", answer: "Keeping lightweight references in context and loading the actual content with tools only when the task needs it." },
            ],
          },
        ],
      },
      {
        title: "The agent loop and loop engineering",
        diagram: {
          kind: "flow",
          caption: "An agent is a model using tools in a loop. Loop engineering is designing how that loop is triggered, how it checks its own work, and exactly when it stops.",
          items: [
            { label: "Trigger", detail: "a prompt, a goal, a schedule or an event" },
            { label: "Gather context", detail: "read files, search, call tools" },
            { label: "Take action", detail: "edit, run commands, call APIs" },
            { label: "Verify", detail: "run tests, check criteria, review output" },
            { label: "Stop condition", detail: "goal met, max turns, budget, or needs a human" },
          ],
        },
        explanation: "- The agent loop: receive a prompt, reason, call tools, feed results back, repeat until no tool calls remain\n- Each full cycle is one turn; complex tasks chain dozens of turns\n- Loops are defined by their trigger, their verification step and their stop condition\n- Claude Code offers turn-based work, /goal for verifiable targets, /loop and /schedule for time-based runs, and proactive routines\n- In the Agent SDK, cap runs with maxTurns and maxBudgetUsd and check the result subtype",
        keyPoints: [
          { tone: "key", title: "Design trigger, verification and stop", text: "Every agent loop answers three questions: what starts it (prompt, goal, schedule, event), how it checks its own work (tests, criteria, review), and exactly when it stops (goal met, turn cap, budget cap, needs a human).", example: "/goal Lighthouse score >= 90, stop after 5 tries" },
          { tone: "tip", title: "Encode verification as a skill", text: "Give the agent a command or skill it must run before declaring success, such as npm test plus a type check. Unattended loops are only as trustworthy as the checks they can run on themselves.", example: "Done means: npm test && npx tsc --noEmit pass" },
          { tone: "warning", title: "Unbounded loops burn time and money", text: "Open-ended prompts with no limits can run for a long time. Set maxTurns and maxBudgetUsd in the Agent SDK, restrict tools to what the task needs, and handle error_max_turns results.", example: "options: { maxTurns: 30, maxBudgetUsd: 2 }" },
        ],
        example: "- Turn-based: 'fix the failing auth tests', Claude runs tests, reads, edits, re-runs, reports\n- Goal-based: /goal get the homepage Lighthouse score to 90 or above, stop after 5 tries\n- Time-based: /loop 10m check the deploy and report failures\n- In the SDK a run that hits maxTurns returns subtype 'error_max_turns'",
        useCase: {
          scenario: "A nightly job should upgrade one outdated dependency at a time, but an earlier script kept making broad, unverified changes.",
          example: "Schedule a routine whose goal is 'one dependency upgraded, all tests and the type check pass', with a verification skill that runs npm test and tsc, maxTurns: 40 and a budget cap.",
          usage: "Each morning there is either one small, verified pull request or a clear report of why the upgrade needs a human.",
        },
        code: "import { query } from '@anthropic-ai/claude-agent-sdk';\n\nlet sessionId: string | undefined;\n\ntry {\n  for await (const message of query({\n    prompt: 'Find and fix the bug causing test failures in the auth module. Done means npm test passes.',\n    options: {\n      allowedTools: ['Read', 'Edit', 'Bash', 'Glob', 'Grep'],\n      settingSources: ['project'],   // load CLAUDE.md, skills, hooks\n      maxTurns: 30,                  // stop condition 1\n      maxBudgetUsd: 2,               // stop condition 2\n      effort: 'high',\n    },\n  })) {\n    if (message.type === 'system' && message.subtype === 'init') sessionId = message.session_id;\n    if (message.type === 'result') {\n      if (message.subtype === 'success') console.log('Done:', message.result);\n      else console.log(`Stopped: ${message.subtype}; resume session ${sessionId}`);\n      console.log(`Cost: $${message.total_cost_usd.toFixed(4)}`);\n    }\n  }\n} catch (error) {\n  console.log('Session ended with an error:', error);\n}",
        apiReference: [
          {
            name: "Agent SDK query options",
            kind: "options",
            signature: "query({ prompt, options: { allowedTools, disallowedTools, permissionMode, maxTurns, maxBudgetUsd, effort, model, settingSources } })",
            params: [
              { name: "maxTurns", type: "number", description: "Maximum tool-use round trips before stopping." },
              { name: "maxBudgetUsd", type: "number", description: "Maximum spend before stopping; includes subagents." },
              { name: "allowedTools", type: "string[]", description: "Tools auto-approved without prompting." },
              { name: "permissionMode", type: "string", description: "How much approval tool calls need: default, acceptEdits, plan, dontAsk, auto or bypassPermissions." },
            ],
            returns: "An async stream of SystemMessage, AssistantMessage, UserMessage and a final ResultMessage.",
            notes: "Result subtypes: success, error_max_turns, error_max_budget_usd, error_during_execution.",
          },
        ],
        exercise: "- Write a /goal for a task with a measurable finish line and a retry cap\n- Run an SDK agent with maxTurns: 3 on a larger task and handle error_max_turns\n- Turn your project's test command into a verification skill the agent must run before finishing",
        checkpoint: "- What are the three design questions of loop engineering?\n- What does one 'turn' consist of?\n- Why is a verification step essential for unattended loops?",
        mistake: "- Do not start unattended loops without a turn or budget cap\n- Do not let an agent declare success without running a check\n- Do not poll a slow-changing system every minute",
        interview: [
          {
            question: "What makes an AI agent loop reliable enough to run unattended?",
            definition: "A reliable loop has a clear trigger, a self-verification step and explicit stop conditions.",
            answer: "Define success as something the agent can check itself, such as passing tests or a score threshold, and give it tools or skills to run that check. Bound the loop with maxTurns and a budget, restrict tools and permissions to what the task needs, and make it report when it needs a human instead of guessing. Keep sessions resumable and record progress so a stopped loop can continue.",
            similar: [
              { question: "What is the difference between /goal and /loop in Claude Code?", answer: "/goal runs until a verifiable goal is met or a retry limit is hit; /loop repeats a task on a time interval." },
            ],
          },
        ],
      },
      {
        title: "Memory: compaction, context editing and the memory tool",
        diagram: {
          kind: "tree",
          caption: "Agents need memory at three time scales. Keep the working context small, summarise when it fills, and write what must survive to durable memory files.",
          items: [
            { label: "Working memory", detail: "the context window of the current request" },
            { label: "Context editing", detail: "clear stale tool results client-side", depth: 1 },
            { label: "Compaction", detail: "summarise older history near the limit", depth: 1 },
            { label: "Session memory", detail: "resume or fork a saved session" },
            { label: "Long-term memory" },
            { label: "Memory tool", detail: "memory_20250818: files under /memories", depth: 1 },
            { label: "CLAUDE.md", detail: "project rules re-injected every request", depth: 1 },
            { label: "Progress notes", detail: "a log and checklist the next session reads", depth: 1 },
          ],
        },
        explanation: "- Compaction summarises older conversation when the window nears its limit; early details can be lost\n- Context editing removes specific stale content, such as old tool results, from the client side\n- The memory tool lets Claude view, create, str_replace, insert, delete and rename files under /memories\n- The memory tool is client-side: your application executes each command against storage you control\n- For multi-session work, keep a progress log and feature checklist and update them before each session ends",
        keyPoints: [
          { tone: "key", title: "Memory works at three time scales", text: "Working memory is the current context; session memory is a resumable transcript; long-term memory is durable storage the agent reads and writes, such as files under /memories. Keep the first small and the last organised.", example: "tools: [{ type: 'memory_20250818', name: 'memory' }]" },
          { tone: "tip", title: "Keep a progress log across sessions", text: "For multi-day work, an initializer session writes progress.md and a feature checklist; every later session reads them first and updates them before ending. Mark items done only after end-to-end verification.", example: "/memories/progress.md: done / in progress / next" },
          { tone: "warning", title: "Validate every memory path", text: "The memory tool is client-side: your handler performs each file operation. Reject any path outside /memories, including ../ and URL-encoded traversal, cap file sizes, and keep secrets out.", example: "reject: /memories/../../secrets.env" },
        ],
        example: "- A support agent stores each customer's preferences in /memories/customers/acme.md\n- Claude calls memory with { command: 'view', path: '/memories' } at the start of a task\n- A PreCompact hook archives the full transcript before the SDK summarises it\n- An initializer session writes progress.md and features.md; later sessions read them first",
        useCase: {
          scenario: "A coding agent works on a feature over several days, and each new session wastes the first hour re-discovering what was already done.",
          example: "The first session creates /memories/progress.md (done, in progress, next) and /memories/features.md (a checklist); every session reads both first and updates them before ending.",
          usage: "Each session resumes in minutes from a trustworthy state instead of re-exploring the codebase or repeating finished work.",
        },
        code: "import Anthropic from '@anthropic-ai/sdk';\nimport { betaMemoryTool } from '@anthropic-ai/sdk/helpers/beta/memory';\nimport { BetaLocalFilesystemMemoryTool } from '@anthropic-ai/sdk/tools/memory/node';\n\nconst client = new Anthropic();\n\n// Stores /memories/* as files under ./memory, with path checks built in\nconst backend = await BetaLocalFilesystemMemoryTool.init('./memory');\nconst memory = betaMemoryTool(backend);\n\nconst finalMessage = await client.beta.messages.toolRunner({\n  model: 'claude-opus-5',\n  max_tokens: 1024,\n  messages: [\n    { role: 'user', content: 'Remember that customer Acme Corp prefers email follow-ups.' },\n  ],\n  tools: [memory],\n  max_iterations: 10,\n});\n\nconsole.log(finalMessage.content);\n// Next week, a new conversation with the same tool and store\n// can answer: 'How does Acme like to be contacted?'",
        apiReference: [
          {
            name: "Memory tool",
            kind: "Anthropic-provided tool",
            signature: "tools: [{ type: 'memory_20250818', name: 'memory' }]",
            params: [
              { name: "view", type: "command", description: "List /memories or show a file with line numbers (optional view_range)." },
              { name: "create", type: "command", description: "Create a file with file_text." },
              { name: "str_replace / insert", type: "command", description: "Edit a file by replacing unique text or inserting after a line." },
              { name: "delete / rename", type: "command", description: "Remove or move a file or directory." },
            ],
            returns: "Your handler's text result for each command, sent back as a tool_result.",
            notes: "Available on all Claude 4 and later models. Pairs with compaction and context editing for long-running agents.",
          },
        ],
        exercise: "- Implement a view/create memory handler backed by a Map, with /memories path validation\n- Write a CLAUDE.md section telling the compactor what to preserve\n- Design the progress.md format for a multi-day project",
        checkpoint: "- What is lost, and what is kept, during compaction?\n- Why is the memory tool called 'client-side'?\n- How do you stop path traversal in a memory handler?",
        mistake: "- Do not let a memory handler read or write outside /memories\n- Do not store secrets or personal data in memory files without controls\n- Do not rely on details from early in a long conversation surviving compaction",
        interview: [
          {
            question: "How would you give an AI agent long-term memory across sessions?",
            definition: "Long-term memory is information stored outside the context window that later sessions retrieve on demand.",
            answer: "Use durable external storage the agent reads and writes through tools, such as the Claude memory tool, which maps a /memories directory onto storage your application controls. Pair it with compaction or context editing to keep the working window small, store stable rules in CLAUDE.md, and use a structured progress log so each session starts by reading state instead of rediscovering it. Validate paths and cap file sizes for safety.",
            similar: [
              { question: "What is compaction?", answer: "Summarising older conversation history when the context nears its limit, so the agent can keep working." },
              { question: "What is structured note-taking?", answer: "An agent writing notes to external memory as it works and reading them back later, like a human's notebook." },
            ],
          },
        ],
      },
      {
        title: "Putting it together: MCP in agent architecture",
        diagram: {
          kind: "tree",
          caption: "A production agent combines everything in this guide: a loop with guardrails, curated context, tools from MCP servers, sub-agents for isolated work, and memory that outlives sessions.",
          items: [
            { label: "Agent loop", detail: "Agent SDK / Claude Code: turns, maxTurns, budget" },
            { label: "Context", detail: "system prompt, CLAUDE.md, skills on demand", depth: 1 },
            { label: "Tools", detail: "built-in tools + MCP servers", depth: 1 },
            { label: "MCP servers", detail: "GitHub, database, ticketing (tools/resources/prompts)", depth: 2 },
            { label: "Tool search", detail: "defer MCP tool schemas until needed", depth: 2 },
            { label: "Sub-agents", detail: "fresh context; return condensed summaries", depth: 1 },
            { label: "Memory", detail: "memory tool, progress log, compaction", depth: 1 },
            { label: "Guardrails", detail: "permissions, hooks, verification skills", depth: 1 },
          ],
        },
        explanation: "- MCP is the standard way to plug external systems into an agent as tools, resources and prompts\n- Many MCP servers mean many tool schemas; tool search defers them to protect the context budget\n- Sub-agents take a noisy subtask, work in a fresh context and return only a summary\n- Hooks and permissions enforce safety deterministically, outside the model\n- Evaluate the whole system with realistic tasks, not just single prompts",
        keyPoints: [
          { tone: "key", title: "Define success before choosing tools", text: "Start from what 'done' means and how it is verified, then choose the minimal tools and MCP servers, then curate context, then add memory. Architecture follows the verification, not the other way round.", example: "success criteria -> tools -> context -> memory" },
          { tone: "tip", title: "Isolate noisy work in sub-agents", text: "A sub-agent runs a subtask in a fresh context with a scoped toolset and returns only a condensed summary, so the main agent's context grows by five lines instead of a whole transcript.", example: "reproducer: tools ['Read', 'Bash', 'Grep']" },
          { tone: "warning", title: "Judge agents on task sets, not lucky runs", text: "One good run proves little. Keep an evaluation set of realistic tasks with expected outcomes and rerun it after every prompt, tool or model change to catch regressions early.", example: "evals/: 20 tasks + expected results" },
        ],
        example: "- A triage agent reads new issues through a GitHub MCP server, labels them, and asks a sub-agent to reproduce bugs\n- The reproduction sub-agent returns a 5-line summary, not its full transcript\n- A PreToolUse hook blocks git push to main\n- Findings are appended to /memories/triage-log.md for the next run",
        code: "import { query } from '@anthropic-ai/claude-agent-sdk';\n\nfor await (const message of query({\n  prompt: 'Triage today\\'s new issues: label each, and reproduce any bug report.',\n  options: {\n    mcpServers: {\n      github: { type: 'http', url: 'https://api.githubcopilot.com/mcp/' },\n    },\n    agents: {\n      reproducer: {\n        description: 'Reproduces a bug report locally and summarises the result in 5 lines.',\n        prompt: 'Reproduce the bug with the smallest possible steps. Report steps, expected, actual.',\n        tools: ['Read', 'Bash', 'Grep'],   // minimal toolset\n      },\n    },\n    allowedTools: ['mcp__github__*', 'Agent', 'Read', 'Grep'],\n    maxTurns: 60,\n    maxBudgetUsd: 5,\n  },\n})) {\n  if (message.type === 'result') console.log(message.subtype, message.total_cost_usd);\n}",
        exercise: "- Sketch the architecture of an agent for a task you do weekly, labelling loop, tools, MCP, sub-agents and memory\n- Write three evaluation tasks with expected outcomes for it\n- Decide which checks become hooks and which become verification skills",
        checkpoint: "- Why use a sub-agent instead of doing the work in the main loop?\n- What problem does tool search solve?\n- Which guardrails should be deterministic rather than instructions?",
        mistake: "- Do not connect every available MCP server 'just in case'\n- Do not judge an agent from a single lucky run; evaluate on a task set\n- Do not give sub-agents the full toolset by default",
      },
    ],
    project: "Build a 'study buddy' agent with the Agent SDK: a curated system prompt, a small search_notes tool, one MCP server of your choice, a quiz sub-agent that returns five questions, and the memory tool storing which topics the student has mastered. Give the loop maxTurns and a budget, add a verification step that checks every quiz answer against the notes, and write five evaluation tasks you re-run after each change.",
    summary: "- LLMs predict tokens from a stateless context window; everything they know per request is what you send\n- Tool use is a loop: tool_use from the model, tool_result from your code, until end_turn\n- Context engineering curates a finite attention budget: right-altitude prompts, minimal tools, just-in-time retrieval, caching\n- Loop engineering designs triggers, verification and stop conditions (goals, maxTurns, budgets)\n- Memory spans compaction, context editing, the client-side memory tool, CLAUDE.md and progress notes\n- MCP supplies tools and data to agents; sub-agents, hooks and evaluations keep the system focused and safe",
    glossary: [
      { term: "Token", definition: "A chunk of text the model reads or generates; usage and limits are measured in tokens." },
      { term: "Context window", definition: "Everything the model can consider in one request: system prompt, tools, history and input." },
      { term: "Stop reason", definition: "Why generation ended: end_turn, max_tokens, stop_sequence, tool_use or refusal." },
      { term: "Tool use", definition: "The model requesting a function call with structured input that the application executes." },
      { term: "Context engineering", definition: "Curating the optimal set of tokens in the context window on every turn of an LLM application." },
      { term: "Context rot", definition: "Declining recall accuracy as the number of tokens in the context grows." },
      { term: "Agent loop", definition: "Repeatedly letting a model call tools and see results until it produces a final answer." },
      { term: "Loop engineering", definition: "Designing how an agent loop is triggered, verified and stopped." },
      { term: "Compaction", definition: "Summarising older conversation when the context window nears its limit." },
      { term: "Memory tool", definition: "An Anthropic-provided, client-side tool that lets Claude manage files under /memories across sessions." },
      { term: "Sub-agent", definition: "An agent with its own fresh context that handles a subtask and returns a condensed result." },
      { term: "Prompt caching", definition: "Reusing a previously processed, unchanged prompt prefix to cut cost and latency." },
    ],
    sources: [
      source("https://platform.claude.com/docs/en/build-with-claude/overview", "Build with Claude"),
      source("https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview", "Tool use with Claude"),
      source("https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", "Effective context engineering for AI agents"),
      source("https://platform.claude.com/docs/en/build-with-claude/prompt-caching", "Prompt caching"),
      source("https://code.claude.com/docs/en/agent-sdk/agent-loop", "How the agent loop works"),
      source("https://claude.com/blog/getting-started-with-loops", "Loop engineering: getting started with loops"),
      source("https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool", "Memory tool"),
      source("https://platform.claude.com/docs/en/build-with-claude/compaction", "Compaction"),
      source("https://platform.claude.com/docs/en/build-with-claude/context-editing", "Context editing"),
      source("https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents", "Effective harnesses for long-running agents"),
      source("https://modelcontextprotocol.io/docs/learn/architecture", "MCP architecture overview"),
    ],
  },
};

// Append to preserve existing learners' lesson indices and bookmarks.
export const LLM_CORE_LESSON_COUNT = guide.curriculum.lessons.length;
export default {
  ...guide,
  version: 3,
  curriculum: {
    ...guide.curriculum,
    minutes: guide.curriculum.minutes + FUNDAMENTAL_LESSONS.length * 5,
    objectives: [...guide.curriculum.objectives, "Explain Claude capabilities and the core AI concepts, architectures, training approaches and deployment tradeoffs."],
    lessons: [...guide.curriculum.lessons, ...FUNDAMENTAL_LESSONS],
  },
} satisfies TechnologyGuide;
