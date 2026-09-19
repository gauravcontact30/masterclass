/** @jest-environment node */
import { isCommand, shellTokens, splitCommands } from "@/lib/terminal-commands";

test("package-manager and tool invocations are commands", () => {
  for (const line of [
    "npm install next@latest react@latest react-dom@latest",
    "pnpm add -D vitest",
    "npx next upgrade",
    "git switch -c upgrade/next-16",
    "cd my-app",
    "docker compose up -d",
    "pip install requests",
    "./gradlew build",
    "export NODE_ENV=production",
    "$env:NODE_ENV = \"production\"",
  ]) expect(isCommand(line)).toBe(true);
});

test("a shell prompt in front of a command is accepted", () => {
  expect(isCommand("$ npm run dev")).toBe(true);
  expect(isCommand("> pnpm test")).toBe(true);
  expect(isCommand("PS C:\\app> npm ci")).toBe(true);
});

test("code that merely starts with a program's name is not a command", () => {
  for (const line of [
    "next();",                          // Express middleware
    "node.appendChild(child);",
    "code = 3",
    "open: true,",
    "export default function Page() {",  // export, but not an environment assignment
    "const npm = require('npm');",
    "    go worker(jobs)",                // indented: inside a Go function
    "  pip install inside a docstring",
    "# npm install foo",                 // a comment about a command
  ]) expect(isCommand(line)).toBe(false);
});

test("commands and source in one sample come apart into ordered runs", () => {
  const code = [
    "npm install next@latest react@latest react-dom@latest",
    "pnpm add next@latest react@latest react-dom@latest",
    "",
    "export default function Page() {",
    "  return <h1>Upgraded</h1>;",
    "}",
    "",
    "npm run build",
  ].join("\n");
  expect(splitCommands(code)).toEqual([
    { kind: "shell", lines: ["npm install next@latest react@latest react-dom@latest", "pnpm add next@latest react@latest react-dom@latest"] },
    { kind: "code", code: "export default function Page() {\n  return <h1>Upgraded</h1>;\n}" },
    { kind: "shell", lines: ["npm run build"] },
  ]);
});

test("a comment travels with the command beside it, and prompts are stripped", () => {
  expect(splitCommands("# install the scanner\n$ npm i -D sonarqube-scanner\n$ pnpm add -D sonarqube-scanner")).toEqual([
    { kind: "shell", lines: ["# install the scanner", "npm i -D sonarqube-scanner", "pnpm add -D sonarqube-scanner"] },
  ]);
  // A comment above source stays with the source.
  expect(splitCommands("// the root layout\nexport default function Layout() {}")).toEqual([
    { kind: "code", code: "// the root layout\nexport default function Layout() {}" },
  ]);
});

test("a backslash continuation stays in the terminal", () => {
  expect(splitCommands("docker run \\\n  -p 3000:3000 \\\n  my-app")).toEqual([
    { kind: "shell", lines: ["docker run \\", "-p 3000:3000 \\", "my-app"] },
  ]);
});

test("blank lines never open or close a block, and pure source is left whole", () => {
  expect(splitCommands("\n\nnpm test\n\n")).toEqual([{ kind: "shell", lines: ["npm test"] }]);
  const source = "const a = 1;\n\nconst b = 2;";
  expect(splitCommands(source)).toEqual([{ kind: "code", code: source }]);
});

test("a command is coloured by role: program, flags, strings and operators", () => {
  const tones = (line: string) => shellTokens(line).filter(token => token.tone).map(token => [token.text, token.tone]);
  expect(tones("npm install -D vitest")).toEqual([["npm", "program"], ["-D", "flag"]]);
  expect(tones("npm test && npm run build")).toEqual([["npm", "program"], ["&&", "operator"], ["npm", "program"]]);
  expect(tones('git commit -m "fix: upgrade"')).toEqual([["git", "program"], ["-m", "flag"], ['"fix: upgrade"', "string"]]);
  expect(tones("# a comment")).toEqual([["# a comment", "comment"]]);
  // Tokens always rejoin into the original line.
  const line = "pnpm add next@latest react@latest";
  expect(shellTokens(line).map(token => token.text).join("")).toBe(line);
});
