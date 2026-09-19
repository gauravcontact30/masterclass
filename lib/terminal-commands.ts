/**
 * Separate what you type into a terminal from what you type into a file.
 *
 * A generated step often mixes the two — a component, then the install line
 * underneath it. Shown in one editor they read as one file, and a reader copies
 * `npm install` into their source. Split apart, each can wear the right chrome:
 * commands in a terminal, source in an editor.
 */

/** Programs whose invocation at the start of a line marks it as a shell command. */
const PROGRAMS = new Set([
  "npm", "pnpm", "npx", "pnpx", "yarn", "bun", "bunx", "corepack", "nvm", "volta",
  "node", "deno", "tsx", "ts-node", "tsc", "next", "vite", "vercel", "supabase", "prisma", "drizzle-kit",
  "eslint", "prettier", "jest", "vitest", "playwright", "cypress", "sonar-scanner",
  "git", "gh", "cd", "ls", "dir", "mkdir", "rmdir", "rm", "cp", "mv", "touch", "cat", "echo", "pwd", "chmod", "chown", "sudo",
  "curl", "wget", "ssh", "scp", "tar", "unzip", "code", "open", "start",
  "docker", "docker-compose", "kubectl", "helm", "terraform", "aws", "az", "gcloud",
  "python", "python3", "py", "pip", "pip3", "pipx", "poetry", "uv", "conda",
  "brew", "apt", "apt-get", "winget", "choco", "go", "cargo", "rustup", "dotnet", "mvn", "gradle", "java",
]);

/**
 * An optional shell prompt a model sometimes copies in front of a command.
 * Not `#`: that is a comment, and `# npm install foo` must stay one.
 */
const PROMPT = /^\s*(?:[$>%]|PS [^>]*>)\s+/;

/** The command text of a line, with any prompt taken off. */
export const stripPrompt = (line: string) => line.replace(PROMPT, "").trim();

/**
 * Whether one line is a shell command.
 *
 * The first word has to be a known program, and it has to be *used* as one:
 * followed by an argument or nothing. `next();`, `node.appendChild(el)` and
 * `code = 3` all start with a program's name and are still code.
 */
export function isCommand(line: string): boolean {
  // An indented line sits inside a block of source — `go worker()` in a Go
  // function, `pip` in a Python string. A real command starts the line, or
  // follows a prompt.
  if (/^\s/.test(line) && !PROMPT.test(line)) return false;
  const text = line.replace(PROMPT, "").trim();
  if (!text) return false;
  // Environment assignments read as code in JavaScript unless shell-shaped.
  if (/^export\s+[A-Z_][A-Z0-9_]*=/.test(text) || /^set\s+[A-Z_][A-Z0-9_]*=/i.test(text) || /^\$env:[A-Z_]+\s*=/i.test(text)) return true;
  const match = /^(\.\/)?([a-z][\w.-]*)(?=\s|$)(.*)$/i.exec(text);
  if (!match) return false;
  const [, relative, program, rest] = match;
  if (relative) return true;                              // ./gradlew, ./scripts/setup.sh
  if (!PROGRAMS.has(program.toLowerCase())) return false;
  // `next = 3`, `code: 1`, `node => …` are code wearing a program's name.
  return !/^\s*(?:[=:;,)]|=>|\+\+)/.test(rest);
}

/** A comment line, in either shell or C-family style. */
const isComment = (line: string) => /^\s*(?:#(?!!)|\/\/)/.test(line);

export type CodeSegment = { kind: "shell"; lines: string[] } | { kind: "code"; code: string };

/**
 * The code split into runs of commands and runs of source, in order.
 *
 * A comment joins a command run when it sits directly against one — `# install
 * the scanner` above `npm i -D …` belongs in the terminal. Blank lines separate
 * runs and are dropped at their edges, so neither block starts or ends empty.
 */
export function splitCommands(code: string): CodeSegment[] {
  const lines = code.replace(/\r\n?/g, "\n").split("\n");
  const shell = lines.map(isCommand);
  // A comment line is shell when the nearest non-blank line after it (or before
  // it, at the end of a block) is a command.
  const neighbour = (index: number, step: 1 | -1) => {
    for (let at = index + step; at >= 0 && at < lines.length; at += step) {
      if (!lines[at].trim()) return false;
      if (!isComment(lines[at])) return shell[at];
    }
    return false;
  };
  const kinds: ("blank" | "shell" | "code")[] = [];
  lines.forEach((line, index) => {
    // A trailing backslash continues the command onto the next, indented line.
    const continued = index > 0 && kinds[index - 1] === "shell" && lines[index - 1].trimEnd().endsWith("\\");
    if (continued) kinds.push("shell");
    else if (!line.trim()) kinds.push("blank");
    else if (shell[index]) kinds.push("shell");
    else if (isComment(line) && (neighbour(index, 1) || neighbour(index, -1))) kinds.push("shell");
    else kinds.push("code");
  });

  const segments: CodeSegment[] = [];
  let run: { kind: "shell" | "code"; lines: string[] } | null = null;
  const flush = () => {
    if (!run) return;
    // Trim blank lines off both ends of the run.
    while (run.lines.length && !run.lines[0].trim()) run.lines.shift();
    while (run.lines.length && !run.lines.at(-1)!.trim()) run.lines.pop();
    if (run.lines.length) segments.push(run.kind === "shell" ? { kind: "shell", lines: run.lines.map(stripPrompt) } : { kind: "code", code: run.lines.join("\n") });
    run = null;
  };
  kinds.forEach((kind, index) => {
    if (kind === "blank") { run?.lines.push(""); return; }
    if (run && run.kind !== kind) flush();
    run ??= { kind, lines: [] };
    run.lines.push(lines[index]);
  });
  flush();
  // Blank lines inside a terminal carry nothing; inside source they are layout.
  return segments.map(segment => segment.kind === "shell" ? { kind: "shell", lines: segment.lines.filter(Boolean) } : segment);
}

export type ShellTone = "program" | "flag" | "string" | "operator" | "comment" | "";
export type ShellToken = { text: string; tone: ShellTone };

/** A command line coloured the way a terminal reader scans it: program, flags, operators. */
export function shellTokens(line: string): ShellToken[] {
  if (isComment(line)) return [{ text: line, tone: "comment" }];
  const tokens: ShellToken[] = [];
  let expectProgram = true;
  for (const part of line.match(/"[^"]*"|'[^']*'|&&|\|\||[|;]|\s+|[^\s|;&"']+|./g) ?? []) {
    if (/^\s+$/.test(part)) { tokens.push({ text: part, tone: "" }); continue; }
    if (/^(?:&&|\|\||[|;])$/.test(part)) { tokens.push({ text: part, tone: "operator" }); expectProgram = true; continue; }
    if (/^["']/.test(part)) { tokens.push({ text: part, tone: "string" }); expectProgram = false; continue; }
    if (expectProgram) { tokens.push({ text: part, tone: "program" }); expectProgram = false; continue; }
    tokens.push({ text: part, tone: /^-{1,2}[\w-]/.test(part) ? "flag" : "" });
  }
  return tokens;
}
