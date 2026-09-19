import type { CodeLanguage } from "./code-highlight";

/**
 * Which code blocks can honestly be executed in the browser.
 *
 * The sandbox in `javascript-sandbox.ts` evaluates a single body through
 * `new AsyncFunction(code)()` inside a worker with no DOM, no network and no
 * module loader. Anything outside that runs nowhere, so we never offer a Run
 * button we cannot honour, and we never present an authored expected output as
 * though it had been executed.
 */

export type RunSupport = { runnable: true } | { runnable: false; reason: string };

const RUNNABLE_LANGUAGES: CodeLanguage[] = ["javascript"];

/** Reasons are shown to learners, so each one says what to do instead. */
const BLOCKERS: { test: RegExp; reason: string }[] = [
  { test: /^\s*(?:import\s|export\s)/m, reason: "Part of a multi-file project — follow Set up & run to execute it." },
  { test: /\brequire\s*\(/, reason: "Needs Node.js modules — follow Set up & run to execute it." },
  { test: /\bprocess\.(?:env|argv|exit|stdout)\b/, reason: "Needs a Node.js process — follow Set up & run to execute it." },
  { test: /\b(?:document|window|localStorage|navigator)\./, reason: "Needs a browser page — follow Set up & run to execute it." },
  { test: /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/, reason: "Needs network access, which the sandbox blocks." },
];

export function runSupport(code: string, language: CodeLanguage): RunSupport {
  if (!RUNNABLE_LANGUAGES.includes(language)) {
    return { runnable: false, reason: `Runs in the browser: JavaScript only. This is ${languageLabel(language)}.` };
  }
  if (!code.trim()) return { runnable: false, reason: "Nothing to run yet." };
  if (code.length > 12000) return { runnable: false, reason: "Too long to run here (12,000 character limit)." };
  const blocker = BLOCKERS.find(item => item.test.test(code));
  return blocker ? { runnable: false, reason: blocker.reason } : { runnable: true };
}

const LABELS: Partial<Record<CodeLanguage, string>> = {
  typescript: "TypeScript",
  tsx: "TSX",
  javascript: "JavaScript",
  jsx: "JSX",
  python: "Python",
  json: "JSON",
  yaml: "YAML",
  bash: "Shell",
  css: "CSS",
  html: "HTML",
  markdown: "Markdown",
  text: "plain text",
  hcl: "HCL",
  dockerfile: "Dockerfile",
};

export const languageLabel = (language: CodeLanguage) => LABELS[language] ?? language;

/**
 * Guess a language for code that arrives without one — the note sections in
 * `notes-explorer` carry a bare string. Conservative on purpose: an unknown
 * block becomes `text` and simply never offers Run.
 */
export function inferLanguage(code: string): CodeLanguage {
  const sample = code.slice(0, 4000);
  if (/^\s*(?:def |class \w+[(:]|from \w+ import |import \w+\s*$)/m.test(sample) || /\bprint\(/.test(sample)) return "python";
  if (/^\s*(?:FROM|RUN|CMD|ENTRYPOINT|COPY)\s/m.test(sample)) return "dockerfile";
  if (/^\s*(?:\$|npm |npx |yarn |pnpm |git |docker |kubectl |aws |cd )/m.test(sample)) return "bash";
  if (/^\s*resource\s+"/m.test(sample)) return "hcl";
  if (/^\s*[\w-]+:\s*(?:$|[^/=])/m.test(sample) && !/[;{}]/.test(sample)) return "yaml";
  if (/^\s*[{[]/.test(sample.trim()) && /"\w+"\s*:/.test(sample)) return "json";
  if (/<\/?[A-Z][\w.]*[\s/>]/.test(sample)) return /\b(?:interface |type \w+ =|: (?:string|number|boolean)\b)/.test(sample) ? "tsx" : "jsx";
  if (/\b(?:interface |enum |type \w+ =|as const\b|: (?:string|number|boolean)[;,)\s])/.test(sample)) return "typescript";
  if (/[;{}()=]/.test(sample)) return "javascript";
  return "text";
}
