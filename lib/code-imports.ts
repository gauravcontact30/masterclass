/**
 * Every package a code example uses is imported before it is used.
 *
 * The prompt asks for complete imports, but models drop them — `useState` in a
 * component with no `import` line is the usual case — and a reader who copies
 * that file gets a ReferenceError. For symbols whose source is unambiguous,
 * the missing import is added here: merged into an existing import from the
 * same module when there is one, otherwise as a new line after any directive
 * and existing imports.
 *
 * Only well-known, single-source symbols are handled. Guessing where an
 * arbitrary identifier comes from would put wrong imports in front of readers.
 */

type Source = { module: string; kind: "named" | "default" | "namespace" };

/** Symbol → the only module it comes from in idiomatic React and Next.js code. */
const SOURCES: Record<string, Source> = {
  ...Object.fromEntries([
    "useState", "useEffect", "useLayoutEffect", "useMemo", "useCallback", "useRef", "useContext", "useReducer",
    "useTransition", "useDeferredValue", "useId", "useActionState", "useOptimistic", "useSyncExternalStore",
    "useImperativeHandle", "createContext", "forwardRef", "memo", "lazy", "Suspense", "Fragment", "startTransition",
  ].map(name => [name, { module: "react", kind: "named" } as Source])),
  ...Object.fromEntries(["useRouter", "usePathname", "useSearchParams", "useParams", "redirect", "notFound", "permanentRedirect"]
    .map(name => [name, { module: "next/navigation", kind: "named" } as Source])),
  ...Object.fromEntries(["NextResponse", "NextRequest"].map(name => [name, { module: "next/server", kind: "named" } as Source])),
  Link: { module: "next/link", kind: "default" },
  Image: { module: "next/image", kind: "default" },
  z: { module: "zod", kind: "named" },
  React: { module: "react", kind: "namespace" },
};

/** How each symbol shows it is being *used*, not just mentioned. */
function used(name: string, body: string): boolean {
  switch (name) {
    // Components appear as JSX; a bare word "Link" or "Image" in prose or a type is not a use.
    case "Link": case "Image": case "Suspense": case "Fragment": return new RegExp(`<${name}[\\s/>]`).test(body);
    case "z": return /\bz\.[a-z]/.test(body);
    case "React": return /\bReact\.[A-Za-z]/.test(body);
    // Used through its static methods: NextResponse.json(), NextResponse.redirect().
    case "NextResponse": return /(?<![\w.$])NextResponse\s*\.\s*\w|new\s+NextResponse\b/.test(body);
    // Mostly a type: `request: NextRequest`, `Promise<NextRequest>`.
    case "NextRequest": return /:\s*NextRequest\b|<NextRequest>|new\s+NextRequest\b/.test(body);
    default: return new RegExp(`(?<![\\w.$])${name}\\s*[(<]`).test(body);
  }
}

const IMPORT_LINE = /^\s*import\s[\s\S]*?from\s+["'][^"']+["'];?\s*$|^\s*import\s+["'][^"']+["'];?\s*$/;
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/** Whether the file already binds `name` — imported under any alias, or declared locally. */
function bound(name: string, code: string): boolean {
  const word = escape(name);
  return new RegExp(`\\bimport\\s+(?:type\\s+)?[^;]*?\\b${word}\\b[^;]*?\\bfrom\\b`).test(code)
    || new RegExp(`\\b(?:const|let|var|function|class)\\s+${word}\\b`).test(code)
    // A parameter *named* after the symbol — not one merely typed as it (`request: NextRequest`).
    || new RegExp(`\\bfunction\\s*\\w*\\s*\\((?:[^)]*,)?\\s*${word}\\s*[:,)=?]`).test(code);
}

/** Whether a code sample reads as JavaScript or TypeScript; nothing else is touched. */
function isScript(code: string, path?: string) {
  if (path) return /\.(?:[cm]?[jt]sx?)$/.test(path);
  return /\b(?:import|export|const|let|function|return)\b|=>|<\w+[\s/>]/.test(code);
}

/** `code` with an import added for every well-known symbol it uses but never imports. */
export function withImports(code: string, path?: string): string {
  if (!code.trim() || !isScript(code, path)) return code;
  const lines = code.split("\n");
  const body = lines.filter(line => !IMPORT_LINE.test(line)).join("\n");
  const missing = Object.keys(SOURCES).filter(name => used(name, body) && !bound(name, code));
  if (!missing.length) return code;

  const byModule = new Map<string, { named: string[]; fallback?: string }>();
  for (const name of missing) {
    const source = SOURCES[name];
    const entry = byModule.get(source.module) ?? { named: [] };
    if (source.kind === "named") entry.named.push(name);
    else entry.fallback = source.kind === "default" ? `import ${name} from "${source.module}";` : `import * as ${name} from "${source.module}";`;
    byModule.set(source.module, entry);
  }

  const additions: string[] = [];
  for (const [module, { named, fallback }] of byModule) {
    if (fallback) additions.push(fallback);
    if (!named.length) continue;
    // Merge into an existing `import { … } from "module"` rather than importing the module twice.
    const at = lines.findIndex(line => new RegExp(`^\\s*import\\s+(?:[\\w$]+\\s*,\\s*)?\\{[^}]*\\}\\s*from\\s*["']${escape(module)}["']`).test(line));
    if (at >= 0) {
      lines[at] = lines[at].replace(/\{([^}]*)\}/, (_, inner: string) => {
        const names = inner.split(",").map(part => part.trim()).filter(Boolean);
        return `{ ${[...names, ...named].join(", ")} }`;
      });
    } else {
      additions.push(`import { ${named.join(", ")} } from "${module}";`);
    }
  }
  if (!additions.length) return lines.join("\n");

  // After a leading directive ("use client" must stay first) and after the last
  // import already present — including the closing line of a multi-line one.
  let insertAt = /^\s*["']use (?:client|server|strict)["'];?\s*$/.test(lines[0] ?? "") ? 1 : 0;
  lines.forEach((line, index) => {
    if (IMPORT_LINE.test(line) || /^\s*\}\s*from\s+["'][^"']+["'];?\s*$/.test(line)) insertAt = Math.max(insertAt, index + 1);
  });
  lines.splice(insertAt, 0, ...additions);
  return lines.join("\n");
}
