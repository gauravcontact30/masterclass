import type { TechnologyGuide } from "./index";
import { source } from "./shared";
import { expandGuide } from "../guide-expansions";
import { CLAUDE_EXTENSION_LESSONS, CLAUDE_EXTENSION_SEEDS } from "@/lib/notes-claude-extensions";

/**
 * Claude Code Skills, Plugins and the Model Context Protocol — grounded in
 * code.claude.com (skills, plugins, MCP) and modelcontextprotocol.io
 * (architecture, protocol version 2026-07-28, TypeScript server SDK).
 */
const guide: TechnologyGuide = {
  id: "claude-skills-plugins-mcp",
  technologyId: "claude",
  topicId: "claude-skills-plugins-mcp",
  level: "intermediate",
  curriculum: {
    title: "Claude Skills, Plugins and MCP",
    minutes: 210,
    objectives: [
      "Map Claude Code's extension points: CLAUDE.md, skills, subagents, hooks, MCP servers and plugins.",
      "Write Agent Skills with SKILL.md frontmatter, arguments, dynamic context and supporting files.",
      "Package skills, agents, hooks and MCP servers into a plugin and distribute it through a marketplace.",
      "Explain MCP's architecture: hosts, clients, servers, the data and transport layers, and its primitives.",
      "Connect MCP servers to Claude Code and build a small MCP server with the TypeScript SDK.",
    ],
    prerequisites: [
      "Claude Code installed and signed in.",
      "Comfortable with a terminal, JSON and Markdown.",
      "Basic TypeScript for the MCP server lesson.",
    ],
    lessons: [
      {
        title: "The Claude Code extension map",
        diagram: {
          kind: "tree",
          caption: "Each extension point answers a different question. Skills add knowledge and workflows, subagents isolate work, hooks enforce rules, MCP connects external systems, and plugins package all of them for sharing.",
          items: [
            { label: "CLAUDE.md", detail: "always-on project instructions, loaded every session" },
            { label: "Skills", detail: "on-demand knowledge and /commands (SKILL.md)" },
            { label: "Subagents", detail: "separate context windows for focused subtasks" },
            { label: "Hooks", detail: "scripts that run on events like PreToolUse" },
            { label: "MCP servers", detail: "tools, resources and prompts from other systems" },
            { label: "Plugins", detail: "a shareable bundle of all of the above" },
            { label: "skills/, agents/, hooks/", depth: 1 },
            { label: ".mcp.json, .lsp.json", depth: 1 },
            { label: ".claude-plugin/plugin.json", detail: "the manifest", depth: 1 },
          ],
        },
        explanation: "- CLAUDE.md is loaded into every session: keep it short and about how this project works\n- A skill is loaded only when relevant or invoked, so it can hold large reference material cheaply\n- Subagents run a task in their own context and return only a summary\n- Hooks are deterministic: they always run, unlike instructions the model may weigh\n- MCP servers bring in external tools and data; plugins package everything for reuse",
        keyPoints: [
          { tone: "key", title: "Match each need to the right extension point", text: "Always-true project facts belong in CLAUDE.md, occasional procedures and reference material become skills, work that must happen every time becomes a hook, and external systems arrive through MCP servers. Plugins bundle all of them for sharing.", example: "lint after every edit -> PostToolUse hook" },
          { tone: "tip", title: "Start standalone, package later", text: "Iterate on skills, agents and hooks in your project's .claude/ folder first. When the setup proves useful to others, move it into a plugin with a manifest so teammates install one versioned bundle instead of copying files.", example: ".claude/skills/deploy/SKILL.md -> team-tools/skills/deploy/" },
          { tone: "warning", title: "Context is a budget, not a dumping ground", text: "Everything loaded every session competes for the model's attention and costs tokens. A 900-line CLAUDE.md buries important rules; keep it short and move detailed material into on-demand skills.", example: "CLAUDE.md: build/test commands + conventions only" },
        ],
        example: "- A 'how we write migrations' checklist fits a skill, not CLAUDE.md\n- 'Run the linter after every edit' is a PostToolUse hook\n- A code-review subagent reads many files but returns a short verdict\n- A GitHub MCP server lets Claude read issues and open pull requests",
        useCase: {
          scenario: "A team's CLAUDE.md has grown to 900 lines of deploy steps, API docs and style rules, and Claude keeps missing instructions buried in the middle.",
          example: "Keep build/test commands and conventions in CLAUDE.md, move the deploy runbook into a /deploy skill with disable-model-invocation: true, move API docs into a skill's reference.md, and enforce formatting with a hook.",
          usage: "Every session starts lean, detailed material loads only when needed, and formatting is guaranteed instead of requested.",
        },
        code: "project/\n├── CLAUDE.md                      # always loaded\n└── .claude/\n    ├── settings.json              # permissions + hooks\n    ├── skills/\n    │   ├── deploy/SKILL.md        # /deploy\n    │   └── api-reference/\n    │       ├── SKILL.md\n    │       └── reference.md       # loaded only when read\n    └── agents/\n        └── reviewer.md            # a subagent definition\n\n# .mcp.json at the project root shares MCP servers with the team",
        exercise: "- List three instructions from a project and decide: CLAUDE.md, skill or hook\n- Sketch the .claude/ folder for a project you work on\n- Identify one external system you would connect through MCP",
        checkpoint: "- Why is a skill cheaper to keep around than the same text in CLAUDE.md?\n- When would you choose a hook instead of an instruction?\n- What does a plugin add on top of standalone .claude/ files?",
        mistake: "- Do not paste whole manuals into CLAUDE.md\n- Do not rely on a written instruction for something that must always happen; use a hook\n- Do not share personal secrets through project-scoped config files",
        interview: [
          {
            question: "How do CLAUDE.md, skills and hooks differ in when they take effect?",
            definition: "CLAUDE.md is persistent context, skills are loaded on demand, and hooks are programs triggered by lifecycle events.",
            answer: "CLAUDE.md content is included in every request, so it suits short, always-relevant facts. A skill's description is always visible but its body loads only when invoked or judged relevant, which suits procedures and reference material. Hooks run outside the model on events like PreToolUse or Stop, so they enforce rules deterministically, for example blocking a dangerous command or running a formatter.",
            similar: [
              { question: "What is progressive disclosure in skills?", answer: "Only a skill's name and description are always in context; its full instructions and supporting files load when needed." },
            ],
          },
        ],
      },
      {
        title: "Agent Skills: anatomy of SKILL.md",
        diagram: {
          kind: "flow",
          caption: "Progressive disclosure: descriptions are always in context, the body loads when the skill is invoked or judged relevant, and supporting files load only when the instructions point to them.",
          items: [
            { label: "Session starts", detail: "every skill's name + description enters context" },
            { label: "User types /skill-name", detail: "or Claude matches the description to the task" },
            { label: "SKILL.md body loads", detail: "the instructions Claude follows" },
            { label: "Supporting files load on demand", detail: "reference.md, examples, scripts/" },
          ],
        },
        explanation: "- A skill is a folder with a SKILL.md file: YAML frontmatter plus Markdown instructions\n- The folder name becomes the slash command, e.g. .claude/skills/deploy/ gives /deploy\n- The description is the most important field: Claude uses it to decide when to apply the skill\n- Personal skills live in ~/.claude/skills/, project skills in .claude/skills/\n- Skills replaced .claude/commands/: both still create /commands, but skills add frontmatter and supporting files",
        keyPoints: [
          { tone: "key", title: "The description decides when a skill runs", text: "Claude sees every skill's name and description on every turn and loads the body only when a request matches. Write it as what the skill does plus when to use it, naming the words a user would actually say.", example: "description: Writes commit messages. Use when the user asks for a commit message." },
          { tone: "tip", title: "Control who may invoke a skill", text: "disable-model-invocation: true makes a skill user-only, which is right for deploys or anything with side effects. user-invocable: false hides it from the / menu so only Claude uses it as background knowledge.", example: "disable-model-invocation: true  # /deploy only when typed" },
          { tone: "warning", title: "Vague descriptions make skills misfire", text: "A description like 'helps with code' either never triggers or triggers for the wrong tasks. Be specific about the task and the phrases that should activate it, then test with a few real requests.", example: "Use when the user asks what changed or wants to review a diff." },
        ],
        example: "- ~/.claude/skills/explain/SKILL.md is available in every project as /explain\n- .claude/skills/release-notes/SKILL.md is shared with the team through git\n- A plugin skill appears namespaced as /my-plugin:release-notes\n- allowed-tools: Bash(git diff *) pre-approves only that command while the skill runs",
        useCase: {
          scenario: "Developers keep asking Claude to write commit messages, each time re-explaining the team's Conventional Commits format.",
          example: "Create .claude/skills/commit-message/SKILL.md with a description mentioning commit messages, the format rules in the body, and allowed-tools for git diff.",
          usage: "Anyone who asks for a commit message gets the team format automatically, and /commit-message runs it on demand.",
        },
        code: "---\nname: summarize-changes\ndescription: Summarizes uncommitted changes and flags anything risky. Use when the user asks what changed, wants a commit message, or asks to review their diff.\nallowed-tools: Bash(git diff *), Bash(git status *)\n---\n\n## Current changes\n\n!`git diff HEAD`\n\n## Instructions\n\nSummarize the changes above in two or three bullet points, then list any\nrisks you notice such as missing error handling, hardcoded values, or\ntests that need updating.",
        apiReference: [
          {
            name: "SKILL.md frontmatter",
            kind: "YAML",
            signature: "---\nname: string\ndescription: string\ndisable-model-invocation: boolean\nuser-invocable: boolean\nallowed-tools: string\nargument-hint: string\ncontext: fork\nmodel: string\n---",
            params: [
              { name: "name", type: "string", description: "Display name; defaults to the directory name." },
              { name: "description", type: "string", description: "What the skill does and when to use it. Claude matches tasks against this." },
              { name: "disable-model-invocation", type: "boolean", description: "true: only the user can invoke it." },
              { name: "user-invocable", type: "boolean", description: "false: hidden from the / menu; only Claude uses it." },
              { name: "allowed-tools", type: "string", description: "Tools pre-approved while the skill runs, e.g. Bash(npm test)." },
              { name: "context", type: "fork", description: "Run the skill in an isolated subagent context." },
            ],
            returns: "A skill available as /<directory-name> (or /plugin:<name> inside a plugin).",
          },
        ],
        exercise: "- Create a personal skill in ~/.claude/skills/ and invoke it in two projects\n- Rewrite a vague description until Claude picks the skill automatically for the right request\n- Make one skill user-only with disable-model-invocation",
        checkpoint: "- Which field decides whether Claude applies a skill automatically?\n- Where do personal and project skills live?\n- What does allowed-tools change about permission prompts?",
        mistake: "- Do not leave the description empty or generic\n- Do not let a side-effecting skill (deploy, send email) be model-invoked\n- Do not put secrets in SKILL.md; it is plain text in your repo",
        interview: [
          {
            question: "How does Claude decide when to use a skill?",
            definition: "Claude reads every skill's description, which is always in context, and loads the full skill when a request matches it.",
            answer: "Skills use progressive disclosure. The name and description of each skill are included in context, so Claude can match a request such as 'write a commit message' against them. When it matches, or when the user types /skill-name, the SKILL.md body is loaded; supporting files are read only if the instructions reference them. disable-model-invocation turns off the automatic path.",
            similar: [
              { question: "What is the difference between a skill and an old .claude/commands file?", answer: "Both create a /command, but skills support frontmatter control, supporting files and automatic invocation." },
            ],
          },
        ],
      },
      {
        title: "Skill arguments, dynamic context and supporting files",
        diagram: {
          kind: "flow",
          caption: "What happens between typing /fix-issue 123 and Claude reading the instructions: arguments are substituted and shell commands run first, so Claude sees real data, not placeholders.",
          items: [
            { label: "/fix-issue 123", detail: "the user invokes the skill with arguments" },
            { label: "$ARGUMENTS / $0 / $issue", detail: "placeholders replaced with the arguments" },
            { label: "!`gh issue view 123`", detail: "commands run; their output replaces the line" },
            { label: "Claude reads the rendered skill", detail: "instructions plus live context" },
          ],
        },
        explanation: "- $ARGUMENTS holds everything typed after the command; $0, $1 select positions\n- Named arguments declared in frontmatter become $name placeholders\n- A line like !`command` runs before Claude sees the skill and is replaced by its output\n- ${CLAUDE_SKILL_DIR} points at the skill's own folder for scripts and references\n- Supporting files keep SKILL.md short: link reference.md or examples.md from the body",
        keyPoints: [
          { tone: "key", title: "Placeholders and !`commands` render first", text: "Before Claude reads a skill, $ARGUMENTS, positional $0/$1 and named arguments are substituted, and each !`command` line is replaced by that command's output. Claude therefore works from live project data, not a template.", example: "!`gh issue view $issue`" },
          { tone: "tip", title: "Keep SKILL.md short with supporting files", text: "Put the procedure in SKILL.md and long reference material in files beside it, linked from the body. They load only when the instructions send Claude there, and ${CLAUDE_SKILL_DIR} gives scripts a stable path.", example: "python ${CLAUDE_SKILL_DIR}/scripts/check.py" },
          { tone: "warning", title: "Dynamic context runs on your machine", text: "Every !`command` executes locally each time the skill is invoked. Keep these commands fast and read-only; a slow or destructive command in a skill runs before anyone gets a chance to review it.", example: "!`git status --short`  # safe, read-only" },
        ],
        example: "- /pr-summary injects !`gh pr diff` and !`gh pr diff --name-only`\n- /fix-issue 123 replaces $issue with 123 via arguments: [issue-number]\n- A ```! fenced block runs several commands (node --version, git status --short)\n- scripts/helper.py is called with python ${CLAUDE_SKILL_DIR}/scripts/helper.py",
        code: "---\nname: fix-issue\ndescription: Fix a GitHub issue end to end. Use when the user asks to fix or work on an issue number.\narguments: [issue]\nargument-hint: [issue-number]\nallowed-tools: Bash(gh issue view *), Bash(npm test)\n---\n\n## Issue\n\n!`gh issue view $issue`\n\n## Environment\n\n```!\nnode --version\ngit status --short\n```\n\n## Instructions\n\n1. Reproduce issue $issue with a failing test first.\n2. Fix it following the conventions in [conventions.md](conventions.md).\n3. Run `npm test` and report the result.\n\n# Folder layout\n# fix-issue/\n# ├── SKILL.md\n# ├── conventions.md\n# └── scripts/check.sh",
        apiReference: [
          {
            name: "Skill string substitutions",
            kind: "placeholders",
            signature: "$ARGUMENTS  $0  $1  $ARGUMENTS[N]  $name\n${CLAUDE_SKILL_DIR}  ${CLAUDE_PROJECT_DIR}  ${CLAUDE_SESSION_ID}",
            params: [
              { name: "$ARGUMENTS", type: "string", description: "Everything after the command name." },
              { name: "$0, $1", type: "string", description: "A single argument by position." },
              { name: "$name", type: "string", description: "A named argument from the arguments frontmatter list." },
              { name: "${CLAUDE_SKILL_DIR}", type: "path", description: "The directory containing SKILL.md." },
            ],
            returns: "The skill text with placeholders replaced before Claude reads it.",
          },
        ],
        exercise: "- Write a skill that takes a file path argument and reviews that file\n- Add a dynamic context line that injects the current branch name\n- Move a long section of a skill into reference.md and link it",
        checkpoint: "- When do !`...` commands run relative to Claude reading the skill?\n- How do you give an argument a name?\n- Why split material into supporting files?",
        mistake: "- Do not run slow or destructive commands in dynamic context\n- Do not hardcode absolute paths; use ${CLAUDE_SKILL_DIR}\n- Do not duplicate reference material in several skills; link one file",
      },
      {
        title: "Building Claude Code plugins",
        diagram: {
          kind: "tree",
          caption: "Only plugin.json goes inside .claude-plugin/. Every component directory sits at the plugin root, and plugin skills are namespaced as /plugin-name:skill-name.",
          items: [
            { label: "my-plugin/", detail: "the plugin root" },
            { label: ".claude-plugin/plugin.json", detail: "name, description, version, author", depth: 1 },
            { label: "skills/<name>/SKILL.md", detail: "becomes /my-plugin:<name>", depth: 1 },
            { label: "agents/", detail: "subagent definitions", depth: 1 },
            { label: "hooks/hooks.json", detail: "event handlers", depth: 1 },
            { label: ".mcp.json", detail: "MCP servers the plugin starts", depth: 1 },
            { label: ".lsp.json", detail: "language servers for code intelligence", depth: 1 },
            { label: "monitors/monitors.json", detail: "background watchers", depth: 1 },
            { label: "bin/", detail: "executables added to PATH", depth: 1 },
          ],
        },
        explanation: "- A plugin is a directory bundling skills, agents, hooks, MCP servers and LSP servers\n- The manifest .claude-plugin/plugin.json names the plugin; the name is also the skill namespace\n- Test locally with claude --plugin-dir ./my-plugin, then /reload-plugins after edits\n- claude plugin init my-tool scaffolds a plugin in your skills directory that loads automatically\n- claude plugin validate ./my-plugin checks the structure before you share it",
        keyPoints: [
          { tone: "key", title: "Only plugin.json lives in .claude-plugin/", text: "The manifest goes in .claude-plugin/plugin.json; skills/, agents/, hooks/, .mcp.json and .lsp.json sit at the plugin root. Nesting component folders inside .claude-plugin/ is the most common reason a plugin loads nothing.", example: "my-plugin/.claude-plugin/plugin.json + my-plugin/skills/" },
          { tone: "tip", title: "Test locally with --plugin-dir", text: "claude --plugin-dir ./my-plugin loads a plugin for one session and overrides an installed copy of the same name. Run /reload-plugins after edits, and claude plugin validate before sharing.", example: "claude --plugin-dir ./my-plugin" },
          { tone: "warning", title: "Plugin skills are always namespaced", text: "A skill named review inside a plugin named team-tools becomes /team-tools:review, so two plugins can ship skills with the same name. Update docs and habits accordingly, and remove old standalone copies to avoid duplicates.", example: "/team-tools:review" },
        ],
        example: "- mkdir -p my-plugin/.claude-plugin my-plugin/skills/hello\n- claude --plugin-dir ./my-plugin, then run /my-plugin:hello\n- A PostToolUse hook in hooks/hooks.json runs lint:fix after every Write or Edit\n- claude --plugin-dir ./plugins loads every plugin folder inside ./plugins",
        useCase: {
          scenario: "Five repositories copy the same review skill, lint hook and database MCP config, and they drift apart within weeks.",
          example: "Move them into one team-tools plugin with skills/review, hooks/hooks.json and .mcp.json, publish it in a team marketplace, and install it in each repo.",
          usage: "One version bump updates every repository, and each skill is clearly attributed as /team-tools:review.",
        },
        code: "// my-plugin/.claude-plugin/plugin.json\n{\n  \"name\": \"team-tools\",\n  \"description\": \"Review skill, lint hook and database MCP server\",\n  \"version\": \"1.2.0\",\n  \"author\": { \"name\": \"Platform team\" }\n}\n\n// my-plugin/hooks/hooks.json\n{\n  \"hooks\": {\n    \"PostToolUse\": [\n      {\n        \"matcher\": \"Write|Edit\",\n        \"hooks\": [\n          { \"type\": \"command\", \"command\": \"jq -r '.tool_input.file_path' | xargs npm run lint:fix\" }\n        ]\n      }\n    ]\n  }\n}\n\n// Terminal\n// claude --plugin-dir ./my-plugin\n// /team-tools:review\n// claude plugin validate ./my-plugin",
        apiReference: [
          {
            name: "plugin.json",
            kind: "manifest",
            signature: "{ \"name\": string, \"description\": string, \"version\"?: string, \"author\"?: { \"name\": string }, \"homepage\"?, \"repository\"?, \"license\"? }",
            params: [
              { name: "name", type: "string", description: "Unique identifier and the namespace prefix for its skills." },
              { name: "description", type: "string", description: "Shown in the plugin manager." },
              { name: "version", type: "string", description: "Optional; when set, updates arrive only when it is bumped." },
            ],
            returns: "Plugin identity used by the plugin manager and marketplaces.",
          },
          {
            name: "claude --plugin-dir",
            kind: "CLI flag",
            signature: "claude --plugin-dir ./my-plugin [--plugin-dir ./other] | --plugin-dir ./plugin.zip",
            params: [{ name: "path", type: "directory | .zip", description: "A plugin, or a folder of plugins, to load for this session." }],
            returns: "A session with the local plugin loaded; it overrides an installed plugin of the same name.",
          },
        ],
        exercise: "- Create a plugin with one skill and load it with --plugin-dir\n- Convert an existing .claude/skills folder into a plugin\n- Run claude plugin validate and fix any warnings",
        checkpoint: "- What is the only file that belongs in .claude-plugin/?\n- How is a plugin skill named in the / menu?\n- How do you pick up plugin edits without restarting?",
        mistake: "- Do not nest component folders inside .claude-plugin/\n- Do not forget to remove the original .claude/ copies after migrating, or you will have duplicates\n- Do not ship executables in bin/ for plugins distributed through organization settings",
      },
      {
        title: "Plugin marketplaces: sharing and installing",
        diagram: {
          kind: "flow",
          caption: "A marketplace is a catalog (marketplace.json) that points at plugins. Users add the catalog once, then install plugins from it by name.",
          items: [
            { label: "Author publishes a marketplace", detail: "a repo with .claude-plugin/marketplace.json" },
            { label: "/plugin marketplace add owner/repo", detail: "the user registers the catalog" },
            { label: "/plugin install name@marketplace", detail: "installs one plugin" },
            { label: "/reload-plugins", detail: "activates it in the current session" },
          ],
        },
        explanation: "- claude-plugins-official is Anthropic's curated marketplace, registered automatically\n- claude-community holds reviewed third-party plugins: /plugin marketplace add anthropics/claude-plugins-community\n- A team can host a private marketplace in a private repository\n- /plugin opens the plugin manager to browse, enable, disable and see errors\n- Approved community plugins are pinned to a commit SHA and bumped by CI",
        keyPoints: [
          { tone: "key", title: "Marketplaces are catalogs; plugins are packages", text: "Add a marketplace once with /plugin marketplace add, then install individual plugins from it as name@marketplace. Anthropic runs a curated official marketplace and a reviewed community marketplace.", example: "/plugin install team-tools@claude-community" },
          { tone: "tip", title: "Host a private marketplace for your team", text: "A marketplace is just a repository with a catalog file, so a private repo gives your organisation its own curated set of plugins, versioned and installable in one command.", example: "/plugin marketplace add my-org/claude-plugins" },
          { tone: "warning", title: "Plugins run code on your machine", text: "Hooks, MCP servers and bin/ executables inside a plugin execute locally with your permissions. Read what a plugin ships before installing it, and prefer sources you trust.", example: "/plugin  # review, disable, check the Errors tab" },
        ],
        example: "- /plugin marketplace add anthropics/claude-plugins-community\n- /plugin install my-plugin@claude-community\n- Run claude plugin validate before submitting to the community marketplace\n- claude --plugin-url https://example.com/my-plugin.zip tests a CI-built archive",
        code: "# Add Anthropic's community marketplace\n/plugin marketplace add anthropics/claude-plugins-community\n\n# Install a plugin from it\n/plugin install team-tools@claude-community\n\n# Activate without restarting\n/reload-plugins\n\n# Manage installed plugins (browse, enable/disable, errors)\n/plugin\n\n# Validate before submitting for review\nclaude plugin validate ./team-tools --strict",
        exercise: "- Add the community marketplace and browse it in /plugin\n- Install one plugin, use a skill from it, then disable it\n- Write the marketplace.json entry you would need for your own plugin",
        checkpoint: "- What is the difference between a marketplace and a plugin?\n- Why are community plugins pinned to a commit SHA?\n- What risks come with installing a plugin?",
        mistake: "- Do not install plugins from unknown sources without reading what they run\n- Do not skip validation before submitting a plugin\n- Do not assume the official marketplace accepts submissions; it is curated separately",
      },
      {
        title: "MCP architecture: hosts, clients and servers",
        diagram: {
          kind: "flow",
          caption: "One host (the AI application) creates one MCP client per server. Every message is JSON-RPC 2.0; stdio carries it for local servers and Streamable HTTP for remote ones.",
          items: [
            { label: "MCP host", detail: "the AI app, e.g. Claude Code or VS Code" },
            { label: "MCP client (one per server)", detail: "keeps a dedicated connection" },
            { label: "Transport layer", detail: "stdio (local) or Streamable HTTP (remote, OAuth)" },
            { label: "Data layer", detail: "JSON-RPC 2.0: server/discover, tools/list, tools/call" },
            { label: "MCP server", detail: "exposes tools, resources and prompts" },
          ],
        },
        explanation: "- MCP (Model Context Protocol) is an open standard for connecting AI applications to external systems\n- Servers expose three primitives: tools (actions), resources (data) and prompts (templates)\n- Clients can expose elicitation, letting a server ask the user for input\n- Protocol version 2026-07-28 is stateless: every request carries its version and capabilities in _meta\n- Clients may call server/discover to learn a server's versions, capabilities and identity",
        keyPoints: [
          { tone: "key", title: "One client per server, JSON-RPC underneath", text: "An MCP host such as Claude Code creates a dedicated client for each server. Every message is JSON-RPC 2.0, carried over stdio for local servers or Streamable HTTP for remote ones, so any host can use any server.", example: "tools/list -> tools/call { name, arguments }" },
          { tone: "tip", title: "Model capabilities as the right primitive", text: "Expose actions as tools, read-only data as resources addressed by URI, and reusable interaction templates as prompts. Clear tool names and descriptions matter: the model reads them to decide what to call.", example: "search_tickets (tool), ticket://{id} (resource)" },
          { tone: "warning", title: "Protocol 2026-07-28 changed the basics", text: "MCP is now stateless: every request carries its version and capabilities in _meta, clients may call server/discover instead of a handshake, and sampling and server logging are deprecated. Build new servers on the current spec.", example: "\"io.modelcontextprotocol/protocolVersion\": \"2026-07-28\"" },
        ],
        example: "- A database server exposes query tools, a schema resource and a few-shot prompt\n- The filesystem server runs locally over stdio for one client\n- The Sentry server runs remotely over Streamable HTTP for many clients\n- tools/call with { name: 'weather_current', arguments: { location: 'Pune' } }",
        useCase: {
          scenario: "A support team wants Claude to answer questions using live ticket data and to draft replies, without pasting tickets into chat.",
          example: "An MCP server for the ticket system exposes a search_tickets tool, a ticket://{id} resource and a draft-reply prompt; Claude Code connects to it over HTTP with OAuth.",
          usage: "Any MCP host can now use the same integration, and access is controlled by the server's authentication rather than by copy and paste.",
        },
        code: "// A tools/call request (protocol version 2026-07-28)\n{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 3,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"weather_current\",\n    \"arguments\": { \"location\": \"San Francisco\", \"units\": \"imperial\" },\n    \"_meta\": {\n      \"io.modelcontextprotocol/protocolVersion\": \"2026-07-28\",\n      \"io.modelcontextprotocol/clientInfo\": { \"name\": \"example-client\", \"version\": \"1.0.0\" },\n      \"io.modelcontextprotocol/clientCapabilities\": { \"elicitation\": {} }\n    }\n  }\n}\n\n// The response\n{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 3,\n  \"result\": {\n    \"resultType\": \"complete\",\n    \"content\": [{ \"type\": \"text\", \"text\": \"68°F, partly cloudy\" }]\n  }\n}",
        apiReference: [
          {
            name: "Server primitives",
            kind: "protocol",
            signature: "tools/list, tools/call\nresources/list, resources/read\nprompts/list, prompts/get",
            params: [
              { name: "Tools", type: "action", description: "Executable functions the model can invoke, each with a JSON Schema inputSchema." },
              { name: "Resources", type: "data", description: "Read-only context such as files, records or API responses, addressed by URI." },
              { name: "Prompts", type: "template", description: "Reusable interaction templates a user can pick." },
            ],
            returns: "JSON-RPC results; tool results return a content array of text, images or resources.",
          },
          {
            name: "server/discover",
            kind: "request",
            signature: "{ \"method\": \"server/discover\", \"params\": { \"_meta\": { protocolVersion, clientInfo, clientCapabilities } } }",
            params: [{ name: "_meta", type: "object", description: "Protocol version, client identity and capabilities, carried on every request." }],
            returns: "supportedVersions, capabilities, serverInfo and cache hints (ttlMs, cacheScope).",
          },
        ],
        exercise: "- Draw the host, clients and servers for a setup with GitHub and a local database\n- Classify five capabilities of a system you use as tool, resource or prompt\n- Write the JSON-RPC tools/call request for a tool of your own design",
        checkpoint: "- Why does a host create one client per server?\n- What is the difference between a tool and a resource?\n- Which transport would you pick for a server shared by a whole company?",
        mistake: "- Do not expose destructive tools without clear descriptions and confirmation\n- Do not write logs to stdout in a stdio server; it corrupts the protocol stream\n- Do not build new features on deprecated sampling",
        interview: [
          {
            question: "What problem does MCP solve, and what are its core server primitives?",
            definition: "MCP is an open protocol that standardises how AI applications obtain context and actions from external systems.",
            answer: "Without MCP every AI app needs a custom integration for every system. With MCP, a system builds one server and any MCP host can use it. Servers expose tools (functions the model calls, via tools/call), resources (read-only data, via resources/read) and prompts (templates, via prompts/get). Messages are JSON-RPC 2.0 over stdio for local servers or Streamable HTTP for remote ones.",
            similar: [
              { question: "Is MCP tied to a specific model?", answer: "No. It defines context exchange only; it does not dictate which LLM an application uses or how it manages context." },
              { question: "What changed in protocol version 2026-07-28?", answer: "It became stateless: every request carries its version and capabilities in _meta, server/discover replaces the handshake, and sampling and logging are deprecated." },
            ],
          },
        ],
      },
      {
        title: "MCP in practice: connect and build servers",
        diagram: {
          kind: "split",
          caption: "Two sides of the same protocol: connecting existing servers to Claude Code, and writing your own server with the official TypeScript SDK.",
          headings: ["Connect (Claude Code)", "Build (TypeScript SDK)"],
          items: [
            { label: "claude mcp add --transport http", detail: "remote server by URL", group: 0 },
            { label: "claude mcp add name -- command", detail: "local stdio process", group: 0 },
            { label: "--scope local | project | user", detail: "project scope writes .mcp.json", group: 0 },
            { label: "/mcp", detail: "status, OAuth sign-in, toggle", group: 0 },
            { label: "new McpServer({ name, version })", detail: "@modelcontextprotocol/server", group: 1 },
            { label: "server.registerTool(name, config, handler)", detail: "zod inputSchema", group: 1 },
            { label: "server.connect(new StdioServerTransport())", detail: "serve over stdio", group: 1 },
            { label: "console.error for logs", detail: "stdout is the protocol channel", group: 1 },
          ],
        },
        explanation: "- Add a remote server: claude mcp add --transport http notion https://mcp.notion.com/mcp\n- Add a local server: claude mcp add --transport stdio airtable -- npx -y airtable-mcp-server\n- Project scope stores servers in .mcp.json so the team shares them; ${VAR} expands environment variables\n- MCP prompts appear as /mcp__server__prompt commands and resources as @ mentions\n- The TypeScript SDK registers tools with a zod schema and returns content blocks",
        keyPoints: [
          { tone: "key", title: "claude mcp add connects servers in one line", text: "Remote servers take --transport http and a URL; local servers take a command after --. Choose a scope: local (just you, here), project (shared through .mcp.json) or user (all your projects).", example: "claude mcp add --transport http notion https://mcp.notion.com/mcp" },
          { tone: "tip", title: "Keep secrets out of .mcp.json", text: "Project config is committed to git, so reference credentials with ${VAR} or ${VAR:-default} expansion. Each developer supplies their own values through the environment, and /mcp handles OAuth sign-in.", example: "\"Authorization\": \"Bearer ${API_KEY}\"" },
          { tone: "warning", title: "stdout belongs to the protocol", text: "A stdio server speaks JSON-RPC over stdout, so console.log corrupts the message stream and breaks the connection. Log with console.error (stderr) or a logger that writes to a file.", example: "console.error(\"server ready\")  // never console.log" },
        ],
        example: "- claude mcp add --transport http github --scope project https://api.githubcopilot.com/mcp/\n- claude mcp list, claude mcp get github, claude mcp remove github\n- /mcp__github__create-pr runs a prompt from the GitHub server\n- npm install @modelcontextprotocol/server zod to start your own server",
        useCase: {
          scenario: "Your team wants Claude Code to look up internal feature flags, which live behind an internal HTTP API.",
          example: "Write a small stdio MCP server with a get_flag tool that calls the API, add it with claude mcp add --scope project, and commit .mcp.json with the token read from ${FLAGS_TOKEN}.",
          usage: "Every developer's Claude Code can answer 'is new-checkout enabled in staging?' directly, with credentials kept in each developer's environment.",
        },
        code: "// flags-server.ts  (npm install @modelcontextprotocol/server zod)\nimport { McpServer } from \"@modelcontextprotocol/server\";\nimport { StdioServerTransport } from \"@modelcontextprotocol/server/stdio\";\nimport { z } from \"zod\";\n\nconst server = new McpServer({ name: \"flags\", version: \"1.0.0\" });\n\nserver.registerTool(\n  \"get_flag\",\n  {\n    description: \"Get whether a feature flag is enabled in an environment\",\n    inputSchema: z.object({\n      flag: z.string().describe(\"Flag key, e.g. new-checkout\"),\n      env: z.enum([\"dev\", \"staging\", \"prod\"]),\n    }),\n  },\n  async ({ flag, env }) => {\n    const res = await fetch(`https://flags.internal/api/${env}/${flag}`, {\n      headers: { Authorization: `Bearer ${process.env.FLAGS_TOKEN}` },\n    });\n    const { enabled } = (await res.json()) as { enabled: boolean };\n    return { content: [{ type: \"text\", text: `${flag} is ${enabled ? \"ON\" : \"OFF\"} in ${env}` }] };\n  },\n);\n\nawait server.connect(new StdioServerTransport());\nconsole.error(\"flags MCP server running on stdio\"); // stderr, never stdout\n\n// Terminal:\n// claude mcp add --scope project --env FLAGS_TOKEN=... flags -- npx tsx flags-server.ts",
        apiReference: [
          {
            name: "claude mcp add",
            kind: "CLI",
            signature: "claude mcp add [--transport http|stdio] [--scope local|project|user] [--env K=V] [--header H] <name> <url | -- command args>",
            params: [
              { name: "--transport", type: "http | stdio", description: "Remote Streamable HTTP server or local process (sse is deprecated)." },
              { name: "--scope", type: "local | project | user", description: "Private to you here, shared via .mcp.json, or all your projects." },
              { name: "--env / --header", type: "string", description: "Environment variables for stdio servers; headers for HTTP servers." },
            ],
            returns: "A configured server, visible in claude mcp list and /mcp.",
          },
          {
            name: "McpServer.registerTool",
            kind: "method",
            signature: "server.registerTool(name, { title?, description, inputSchema: z.object({...}) }, async (args) => ({ content: [...] }))",
            params: [
              { name: "name", type: "string", description: "Unique tool name the model calls." },
              { name: "inputSchema", type: "zod object", description: "Validates arguments and becomes the tool's JSON Schema." },
            ],
            returns: "Registers the tool so tools/list advertises it and tools/call runs the handler.",
          },
        ],
        exercise: "- Add one remote MCP server with user scope and check it in /mcp\n- Build the flags server above with a second tool, list_flags\n- Share a server with your team through a project-scoped .mcp.json using ${VAR} expansion",
        checkpoint: "- What does the -- separator do in claude mcp add?\n- Where is a project-scoped server stored?\n- Why must a stdio server never print to stdout?",
        mistake: "- Do not commit tokens in .mcp.json; use environment variable expansion\n- Do not use the deprecated sse transport for new servers; use http\n- Do not return huge tool outputs; MCP output is capped (MAX_MCP_OUTPUT_TOKENS) and costs context",
        interview: [
          {
            question: "How would you expose an internal API to Claude Code safely through MCP?",
            definition: "By writing an MCP server that wraps the API in narrowly scoped, well-described tools and handles authentication itself.",
            answer: "Create a server with the official SDK, register tools with strict zod schemas and clear descriptions, keep them read-only unless writes are essential, and read credentials from environment variables. Serve locally over stdio for individuals or over Streamable HTTP with OAuth for teams. Register it with claude mcp add, sharing config through a project .mcp.json that uses ${VAR} expansion instead of secrets.",
            code: "{\n  \"mcpServers\": {\n    \"flags\": {\n      \"command\": \"npx\",\n      \"args\": [\"tsx\", \"flags-server.ts\"],\n      \"env\": { \"FLAGS_TOKEN\": \"${FLAGS_TOKEN}\" }\n    }\n  }\n}",
            similar: [
              { question: "How do MCP prompts show up in Claude Code?", answer: "As slash commands named /mcp__<server>__<prompt>." },
            ],
          },
        ],
      },
    ],
    project: "Build a 'release-helper' plugin: a /release-helper:changelog skill that injects git log since the last tag with dynamic context, a user-only /release-helper:tag skill with disable-model-invocation, a PostToolUse hook that runs your formatter, and a bundled stdio MCP server with a get_open_issues tool. Validate it with claude plugin validate, test it with --plugin-dir, and publish it in a private team marketplace.",
    summary: "- CLAUDE.md is always loaded; skills load on demand; hooks enforce; MCP connects; plugins package\n- A skill is a folder with SKILL.md whose description decides when Claude uses it\n- Arguments, !`command` context and supporting files make skills live and compact\n- Plugins bundle skills, agents, hooks, MCP and LSP servers behind a plugin.json manifest and a namespace\n- Marketplaces distribute plugins: /plugin marketplace add, then /plugin install name@marketplace\n- MCP hosts create one client per server; servers expose tools, resources and prompts over JSON-RPC\n- Protocol 2026-07-28 is stateless with server/discover; connect servers with claude mcp add and build them with @modelcontextprotocol/server",
    glossary: [
      { term: "Agent Skill", definition: "A folder with a SKILL.md file that adds instructions, knowledge or a /command to Claude Code." },
      { term: "Progressive disclosure", definition: "Loading only skill descriptions up front and the full content when a skill is needed." },
      { term: "Dynamic context", definition: "A !`command` line in a skill whose output replaces it before Claude reads the skill." },
      { term: "Plugin", definition: "A shareable directory of skills, agents, hooks, MCP and LSP servers with a .claude-plugin/plugin.json manifest." },
      { term: "Marketplace", definition: "A catalog of plugins that users add once and install from with name@marketplace." },
      { term: "Hook", definition: "A command Claude Code runs on a lifecycle event such as PreToolUse or PostToolUse." },
      { term: "MCP host", definition: "The AI application that manages MCP clients, such as Claude Code." },
      { term: "MCP server", definition: "A program that exposes tools, resources and prompts over the Model Context Protocol." },
      { term: "Tool (MCP)", definition: "An executable function with a JSON Schema input that the model can call via tools/call." },
      { term: "Resource (MCP)", definition: "Read-only context data addressed by URI and read via resources/read." },
      { term: "Streamable HTTP", definition: "MCP's remote transport: HTTP POST requests with optional server-sent event streams." },
      { term: "Elicitation", definition: "A client primitive that lets a server ask the user for more input or confirmation." },
    ],
    sources: [
      source("https://code.claude.com/docs/en/skills", "Extend Claude with skills"),
      source("https://code.claude.com/docs/en/plugins", "Create plugins"),
      source("https://code.claude.com/docs/en/plugins-reference", "Plugins reference"),
      source("https://code.claude.com/docs/en/plugin-marketplaces", "Create and distribute a plugin marketplace"),
      source("https://code.claude.com/docs/en/mcp", "Connect Claude Code to tools via MCP"),
      source("https://code.claude.com/docs/en/hooks", "Hooks reference"),
      source("https://modelcontextprotocol.io/docs/learn/architecture", "MCP architecture overview"),
      source("https://modelcontextprotocol.io/specification/latest", "MCP specification"),
      source("https://modelcontextprotocol.io/docs/develop/build-server", "Build an MCP server"),
    ],
  },
};

const core = expandGuide(guide.id, guide.curriculum);
export const CLAUDE_EXTENSIONS_CORE_COUNT = core.lessons.length;
export default { ...guide, version: 2, curriculum: {
  ...core,
  minutes: core.minutes + CLAUDE_EXTENSION_LESSONS.length * 5,
  lessons: [...core.lessons, ...CLAUDE_EXTENSION_LESSONS],
  objectives: [...core.objectives, "Compare built-in commands, workflow skills and community plugins, including their identity, prerequisites and limitations.", "Choose and configure MCP integrations using explicit scopes, authentication and transport settings."],
  sources: [...new Map([...(core.sources ?? []), ...CLAUDE_EXTENSION_SEEDS.flatMap(seed => seed.sources.map(url => ({ title: seed.title, url, retrievedAt: "2026-09-13T00:00:00.000Z" })))].map(item => [item.url, item])).values()],
} } satisfies TechnologyGuide;
