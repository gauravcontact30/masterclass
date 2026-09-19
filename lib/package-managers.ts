/**
 * Answer cards standardise on npm and pnpm.
 *
 * The prompt asks for those two, but a model reaching for yarn out of habit
 * must not put a third package manager in front of the reader, so every command
 * block is rewritten before it renders. A yarn line becomes its npm and pnpm
 * equivalents, or is dropped when the block already shows one of them — a
 * "here are three ways to say it" list is the thing we are trying to avoid.
 *
 * Only a line that *runs* yarn is touched. A comment about yarn, or a real
 * reference to `yarn.lock`, says something the reader needs and is left alone.
 */

/** Indentation, an optional shell prompt, then the yarn command's arguments. */
const YARN_COMMAND = /^(\s*)(?:[$>]\s+)?yarn(?:\s+(.*))?$/;
const DEV_FLAG = /(?:^|\s)(?:-D|--dev|--save-dev)(?=\s|$)/;

const join = (...parts: string[]) => parts.filter(Boolean).join(" ").trim();

/** The npm and pnpm forms of one yarn command. */
function equivalents(argv: string): { npm: string; pnpm: string } {
  const args = argv.trim();
  // Bare `yarn` installs the lockfile's dependencies.
  if (!args || args === "install") return { npm: "npm install", pnpm: "pnpm install" };
  const [command, ...rest] = args.split(/\s+/);
  const tail = rest.join(" ");
  switch (command) {
    case "add": {
      const packages = tail.replace(DEV_FLAG, " ").replace(/\s+/g, " ").trim();
      return DEV_FLAG.test(tail)
        ? { npm: join("npm install -D", packages), pnpm: join("pnpm add -D", packages) }
        : { npm: join("npm install", packages), pnpm: join("pnpm add", packages) };
    }
    case "remove": return { npm: join("npm uninstall", tail), pnpm: join("pnpm remove", tail) };
    case "dlx": return { npm: join("npx", tail), pnpm: join("pnpm dlx", tail) };
    case "create": return { npm: join("npm create", tail), pnpm: join("pnpm create", tail) };
    case "init": return { npm: join("npm init", tail), pnpm: join("pnpm init", tail) };
    case "upgrade": case "up": return { npm: join("npm update", tail), pnpm: join("pnpm update", tail) };
    case "run": return { npm: join("npm run", tail), pnpm: join("pnpm run", tail) };
    case "test": return { npm: join("npm test", tail), pnpm: join("pnpm test", tail) };
    // `yarn build` and friends: a script, which npm and pnpm both spell with `run`.
    default: return { npm: join("npm run", args), pnpm: join("pnpm run", args) };
  }
}

/** Every yarn command in `code` replaced by its npm and pnpm equivalents. */
export function withoutYarn(code: string): string {
  if (!code || !/(^|\s)yarn(\s|$)/m.test(code)) return code;
  const lines = code.split("\n");
  const written: string[] = [];
  const command = (line: string) => line.replace(/^\s*(?:[$>]\s+)?/, "").trim();
  // Only what is already above counts as shown. An equivalent further down is
  // left to the dedupe below instead, so the pair always reads npm then pnpm
  // however the model happened to order the block.
  const shown = (candidate: string) => written.some(line => command(line) === candidate);

  // What the yarn lines produced, so a copy of it further down the block is not
  // printed twice. Only these exact commands are dropped: every other repeated
  // line, blank ones included, is the author's and stays.
  const generated = new Set<string>();

  for (const line of lines) {
    const match = YARN_COMMAND.exec(line);
    if (!match) {
      if (!generated.has(command(line))) written.push(line);
      continue;
    }
    const [, indent, argv = ""] = match;
    const { npm, pnpm } = equivalents(argv);
    for (const replacement of [npm, pnpm]) {
      if (shown(replacement)) continue;
      written.push(indent + replacement);
      generated.add(replacement);
    }
  }
  return written.join("\n");
}
