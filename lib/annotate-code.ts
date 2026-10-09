/**
 * Helpers for the Definition section of an API page: tidy code so it is
 * consistently indented, find the import that brings an identifier in, explain
 * what kind of identifier it is, and add short line comments that stay valid
 * code (Python `#`, TypeScript `//`, JSX `{/* *\/}`).
 */
import { codeLineNotes } from "./code-line-notes";

type Lang = "python" | "typescript" | "tsx" | "javascript" | "jsx" | string;

const isPython = (language: Lang) => language === "python";

/** Expand tabs, drop trailing spaces, remove shared indentation and outer blank lines. */
export function normalizeCode(code: string, language: Lang): string {
  const tab = isPython(language) ? "    " : "  ";
  let lines = code.replace(/\r\n?/g, "\n").split("\n").map(line => line.replace(/\t/g, tab).replace(/\s+$/, ""));
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indents = lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length);
  const shared = indents.length ? Math.min(...indents) : 0;
  if (shared) lines = lines.map(line => line.slice(shared));
  // Never more than one blank line in a row.
  return lines.filter((line, index) => line.trim() || lines[index - 1]?.trim()).join("\n");
}

/** The import line in an example that brings `name` into scope, if there is one. */
export function importLines(code: string, name: string): string[] {
  const lines = code.split("\n");
  const found: string[] = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!/^\s*(import\b|from\s+\S+\s+import\b)/.test(line)) continue;
    // Gather a multi-line import such as `from x import (\n a,\n b\n)`.
    let statement = line;
    while ((/\($/.test(statement.trim()) || /\{\s*$/.test(statement.trim()) || (/[({]/.test(statement) && !/[)}]/.test(statement))) && index + 1 < lines.length) {
      statement += "\n" + lines[++index];
      if (/[)}]/.test(lines[index])) break;
    }
    if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(statement)) found.push(statement.trim());
  }
  return found;
}

const BUILTIN_HINTS = /builtins|prototype|javascript \/|python \//i;

export function isBuiltIn(packageName: string) {
  return BUILTIN_HINTS.test(packageName);
}

export type KindInfo = { label: string; summary: string };

const KIND_SUMMARIES: Record<string, string> = {
  Function: "A callable you invoke with arguments; it returns a value or performs an action.",
  Method: "A function that belongs to an object or prototype and is called on an instance, like value.method().",
  Hook: "A function that starts with use and lets a component use state, effects or context. Call it at the top level of a component.",
  Class: "A blueprint you instantiate with arguments; the object it creates holds state and exposes methods.",
  Component: "A UI building block you render as an element, passing props as attributes.",
  Interface: "A type that describes the shape an object must have; it exists only at type-check time.",
  "Type Alias": "A name for another type, used to make complex types readable and reusable.",
  Const: "A named value exported for reuse; read it, do not reassign it.",
  Enum: "A fixed set of named values, used to avoid magic strings and numbers.",
  Decorator: "A function applied with @ above a function or class to add behaviour without changing its body.",
  Module: "A file or package you import to reach the functions and classes inside it.",
  Directive: "An instruction written as a string or attribute that changes how code or markup is processed.",
  Pipe: "A template transform that formats a value for display.",
  Command: "A command you run in the terminal.",
  Service: "An injectable class that holds shared logic or data for the app.",
  Property: "A value stored on an object, read or set with dot notation.",
};

/** Name the kind as a learner would say it, refining "Function" to "Method" for prototype members. */
export function kindInfo(kindLabel: string, packageName: string, signature: string): KindInfo {
  let label = kindLabel;
  if (label === "Function" && /prototype/i.test(packageName)) label = "Method";
  if (label === "Function" && /^\s*\w+\.\w+\(/.test(signature) && /prototype/i.test(packageName)) label = "Method";
  if (label === "Const" && /^\s*\w+\.\w+\s*$/.test(signature)) label = "Property";
  return { label, summary: KIND_SUMMARIES[label] ?? "A named part of this package's public API." };
}

/* ----------------------------------------------------------------- */
/* Short line notes                                                   */
/* ----------------------------------------------------------------- */

const MAX_NOTE = 60;

const METHOD_NOTES: Record<string, string> = {
  add_node: "Register a node in the graph",
  add_edge: "Connect two nodes",
  add_conditional_edges: "Branch to the next node by condition",
  set_entry_point: "Choose the first node",
  compile: "Build the runnable graph",
  invoke: "Run once and wait for the result",
  ainvoke: "Run once asynchronously",
  stream: "Stream results as they arrive",
  batch: "Run several inputs together",
  bind_tools: "Attach tool schemas to the model",
  with_structured_output: "Make the model return a typed object",
  get_state: "Read the saved thread state",
  update_state: "Edit the saved thread state",
  create_dataset: "Create a dataset in LangSmith",
  create_examples: "Add examples to the dataset",
  push: "Add an item to the end",
  append: "Add an item to the end",
  map: "Transform each item into a new array",
  filter: "Keep only the items that pass the test",
  reduce: "Combine all items into one value",
  subscribe: "Listen for emitted values",
  pipe: "Chain operators on the stream",
  get: "Send a GET request",
  post: "Send a POST request",
  fetch: "Request data over HTTP",
  json: "Parse the response body as JSON",
  set: "Update the stored value",
  update: "Update the value from the previous one",
  then: "Continue when the promise resolves",
  sort: "Sort the items in place",
  close: "Close the connection",
};

function shorten(text: string, max = 26) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** Describe a value by its shape instead of echoing long code. */
function describeValue(value: string) {
  const v = value.trim().replace(/;$/, "");
  if (v.length <= 24) return v;
  if (v.startsWith("{")) return "an object of updates";
  if (v.startsWith("[")) return "a list";
  if (v.startsWith("(") || v.startsWith("<")) return "the rendered markup";
  if (/^["'`]/.test(v)) return "a string";
  const call = v.match(/^(?:await\s+)?([\w.]+)\(/);
  if (call) return `the result of ${shorten(call[1], 24)}()`;
  return shorten(v, 24);
}

function firstSentence(note: string) {
  const sentence = note.split(/(?<=[.!?])\s/)[0].replace(/\.$/, "");
  return sentence.length > MAX_NOTE ? undefined : sentence;
}

/** A short, specific note for one line, or undefined when the line explains itself. */
export function conciseNote(line: string, language: Lang, fallback?: string): string | undefined {
  const t = line.trim();
  if (!t || /^[)\]};,]+;?$/.test(t) || /^<\/[\w.]+>\s*[;)]*$/.test(t) || /^\)\s*[;}]*$/.test(t)) return undefined;
  if (/^(#|\/\/|\/\*|\*)/.test(t)) return undefined;
  if (/^["']use (client|server)["'];?$/.test(t)) return t.includes("client") ? "Runs this module in the browser" : "Runs these functions on the server";

  let match: RegExpMatchArray | null;
  // Imports
  if ((match = t.match(/^import\s+type\s+\{([^}]*)\}\s+from\s+["']([^"']+)["']/))) return `Import types ${shorten(match[1], 22)} from ${match[2]}`;
  if ((match = t.match(/^import\s+\{([^}]*)\}\s+from\s+["']([^"']+)["']/))) return `Import ${shorten(match[1], 26)} from ${match[2]}`;
  if ((match = t.match(/^import\s+\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["']/))) return `Import all of ${match[2]} as ${match[1]}`;
  if ((match = t.match(/^import\s+(\w+)(?:\s*,\s*\{([^}]*)\})?\s+from\s+["']([^"']+)["']/))) return `Import ${match[1]} from ${match[3]}`;
  if ((match = t.match(/^from\s+([\w.]+)\s+import\s+\(?\s*(.*?)\)?$/))) return match[2] ? `Import ${shorten(match[2], 24)} from ${match[1]}` : `Import from ${match[1]}`;
  if ((match = t.match(/^import\s+([\w.]+)(?:\s+as\s+(\w+))?$/))) return match[2] ? `Import ${match[1]} as ${match[2]}` : `Import the ${match[1]} module`;

  // Declarations
  if ((match = t.match(/^@(\w[\w.]*)/))) return `Decorate the next definition with @${match[1]}`;
  if ((match = t.match(/^(async\s+)?def\s+(\w+)\s*\(/))) return `Define ${match[1] ? "async " : ""}function ${match[2]}()`;
  if ((match = t.match(/^class\s+(\w+)\s*\(\s*([\w.]+)/))) return `Define class ${match[1]}, based on ${match[2]}`;
  if ((match = t.match(/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+([\w.]+))?/))) return match[2] ? `Define class ${match[1]}, extending ${match[2]}` : `Define class ${match[1]}`;
  if ((match = t.match(/^(?:export\s+)?interface\s+(\w+)/))) return `Declare the ${match[1]} interface`;
  if ((match = t.match(/^(?:export\s+)?type\s+(\w+)\s*(?:<[^>]*>)?\s*=/))) return `Type alias ${match[1]}`;
  if ((match = t.match(/^(?:export\s+)?(?:default\s+)?(async\s+)?function\s*(\w*)\s*\(/))) return match[2] ? `Define ${match[1] ? "async " : ""}function ${match[2]}()` : "Define the default export";
  if ((match = t.match(/^(?:export\s+)?const\s+(\w+)\s*=\s*(async\s*)?\([^)]*\)\s*(?::[^=]+)?=>/))) return `Define ${match[1]} as an arrow function`;

  // Control flow
  if (/^return\s*\(?\s*<[A-Za-z]/.test(t)) return "Return the rendered markup";
  if ((match = t.match(/^return\s+(.+?);?$/))) return `Return ${describeValue(match[1])}`;
  if (/^(if|elif)\b/.test(t)) return "Check a condition";
  if (/^else\b/.test(t)) return "Otherwise";
  if ((match = t.match(/^for\s*\(?\s*(?:const|let)?\s*(.+?)\s+(?:in|of)\s+(.+?)\)?\s*[:{]?$/))) return `Loop over ${shorten(match[2], 22)}`;
  if (/^while\b/.test(t)) return "Repeat while the condition holds";
  if (/^try\b/.test(t)) return "Run code that might fail";
  if (/^(except|catch)\b/.test(t)) return "Handle the error";
  if (/^with\b/.test(t)) return "Open a resource that closes itself";
  if (/^(print|console\.(log|info))\s*\(/.test(t)) return "Print the result";
  if (/^await\s+/.test(t) && !/=/.test(t)) return `Wait for ${shorten(t.replace(/^await\s+/, "").replace(/\(.*$/, "()"), 28)}`;

  // JSX
  if ((match = t.match(/^<([A-Za-z][\w.]*)/))) return `Render <${match[1]}>`;
  if (/^\{.*\}$/.test(t)) return undefined;

  // Assignments
  if ((match = t.match(/^(?:const|let|var)?\s*(\[[^\]]+\]|\{[^}]+\}|[\w.]+)\s*(?::\s*[^=]+)?=\s*(await\s+)?(new\s+)?([\w.]+)\s*(\(|<)/))) {
    const target = shorten(match[1], 20);
    const callee = match[4];
    const method = callee.includes(".") ? callee.split(".").pop()! : "";
    if (/^use[A-Z]/.test(callee)) return `Call ${callee}() and keep ${target}`;
    if (method && METHOD_NOTES[method]) return `${METHOD_NOTES[method]}: ${target}`;
    if (match[3] || /^[A-Z]/.test(callee.split(".").pop()!)) return `Create a ${shorten(callee.split(".").pop()!, 24)} as ${target}`;
    return `${match[2] ? "Await" : "Call"} ${shorten(callee, 26)}() into ${target}`;
  }
  if ((match = t.match(/^(?:const|let|var)\s+([\w[\]{}, ]+?)\s*(?::[^=]+)?=\s*(.+?);?$/))) return `Set ${shorten(match[1], 18)} to ${describeValue(match[2])}`;
  if ((match = t.match(/^([\w.[\]"']+)\s*=\s*(.+)$/)) && !t.startsWith("==")) return `Set ${shorten(match[1], 18)} to ${describeValue(match[2])}`;

  // Method calls
  if ((match = t.match(/^(?:await\s+)?([\w.]+)\.(\w+)\s*\(/))) return METHOD_NOTES[match[2]] ?? `Call ${shorten(`${match[1]}.${match[2]}`, 30)}()`;
  if ((match = t.match(/^(\w+)\s*\(/))) return `Call ${match[1]}()`;

  // Object or dict fields and keyword arguments
  if ((match = t.match(/^["']?(\w+)["']?\s*[:=]\s*(.+?),?$/))) {
    if (isPython(language) && /^[A-Z_a-z]\w*\s*:/.test(t) && !/,$/.test(t)) return `Field ${match[1]} of type ${match[2].split("[")[0]}`;
    return `Set the ${match[1]} option`;
  }

  return fallback ? firstSentence(fallback) : undefined;
}

/** One note per line (undefined where none is useful). */
export function lineNotes(code: string, language: Lang): (string | undefined)[] {
  const generated = codeLineNotes(code, "", language as never);
  const lines = code.split("\n");
  let inTriple = false;
  let inTemplate = false;
  return lines.map((line, index) => {
    const triples = (line.match(/"""|'''/g) ?? []).length;
    const ticks = (line.match(/`/g) ?? []).length;
    const wasInside = inTriple || inTemplate;
    if (isPython(language) && triples % 2 === 1) inTriple = !inTriple;
    if (!isPython(language) && ticks % 2 === 1) inTemplate = !inTemplate;
    // A comment inside a multi-line string would become part of the string.
    if (wasInside || inTriple || inTemplate) return undefined;
    // A comment after a line continuation backslash is a syntax error.
    if (line.endsWith("\\")) return undefined;
    if (/(#|\/\/)\s*\S/.test(line.replace(/(["'`]).*?\1/g, ""))) return undefined;
    return conciseNote(line, language, generated[index] ?? undefined);
  });
}

const looksLikeJsx = (code: string) => /return\s*\(?\s*<[A-Za-z]/.test(code) || /<\/[A-Za-z][\w.]*>/.test(code);

/**
 * The same code with a short comment on each meaningful line. Comments line up
 * in one column; a line too long for the column gets its comment on the line
 * above, at the same indentation. JSX children use {/* *\/} so the code stays valid.
 */
export function annotateCode(code: string, language: Lang, column = 46): string {
  const lines = code.split("\n");
  const notes = lineNotes(code, language);
  const jsx = !isPython(language) && looksLikeJsx(code);
  const fits = lines.filter((line, index) => notes[index] && line.length <= column).map(line => line.length);
  const align = Math.min(column, Math.max(0, ...fits)) + 2;
  const out: string[] = [];
  lines.forEach((line, index) => {
    const note = notes[index];
    if (!note) {
      out.push(line);
      return;
    }
    const trimmed = line.trim();
    const inMarkup = jsx && (/^<[A-Za-z/]/.test(trimmed) || /^return\s*\(?\s*<[A-Za-z]/.test(trimmed));
    // Attribute lines inside a multi-line tag cannot hold any comment.
    if (jsx && /^[\w-]+=/.test(trimmed)) {
      out.push(line);
      return;
    }
    const comment = isPython(language) ? `# ${note}` : inMarkup ? `{/* ${note} */}` : `// ${note}`;
    if (line.length <= column) {
      out.push(`${line.padEnd(align)}${comment}`);
    } else if (inMarkup) {
      out.push(line);
    } else {
      out.push(`${line.match(/^ */)![0]}${comment}`, line);
    }
  });
  return out.join("\n");
}
