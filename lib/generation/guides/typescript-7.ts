import type { TechnologyGuide } from "./index";
import { source } from "./shared";
import { TYPESCRIPT_FUNDAMENTAL_LESSONS } from "./typescript-fundamentals";

/**
 * TypeScript 7 — the native (Go) compiler released 8 July 2026 — plus the
 * core type system it checks. Grounded in typescriptlang.org and the
 * TypeScript 6.0 / 7.0 announcements on the official TypeScript blog.
 */
const guide: TechnologyGuide = {
  id: "typescript-7",
  technologyId: "typescript",
  topicId: "typescript-7",
  level: "intermediate",
  version: 2,
  curriculum: {
    title: "TypeScript 7",
    minutes: 190 + TYPESCRIPT_FUNDAMENTAL_LESSONS.length * 8,
    objectives: [
      "Master core types, composition, functions, classes, generics, advanced type manipulation and all fourteen essential utility types.",
      "Use decorators, ES modules, type guards and strict compiler checks with practical examples.",
      "Explain what changed in TypeScript 7 and why it is about ten times faster.",
      "Use the core type system well: unions, narrowing, generics, utility types, satisfies and as const.",
      "Configure a modern tsconfig with TypeScript 7's new defaults.",
      "Migrate from deprecated options such as baseUrl, target es5 and node10 resolution.",
      "Set up modules correctly for Node.js and bundlers, including #/ subpath imports.",
      "Tune builds with TypeScript 7's parallelism flags and understand its tooling and API status.",
    ],
    prerequisites: [
      "JavaScript (ES2020+), modules and npm.",
      "Node.js 20+ for #/ subpath imports.",
    ],
    lessons: [
      {
        title: "What TypeScript 7 is",
        diagram: {
          kind: "split",
          caption: "Same language, same checker logic, new engine. TypeScript 7 is a methodical port of the compiler from TypeScript to Go, and TypeScript 6.0 was the bridge release that prepared projects for it.",
          headings: ["TypeScript 6.0 (JavaScript engine)", "TypeScript 7.0 (native Go)"],
          items: [
            { label: "Compiler written in TypeScript", group: 0 },
            { label: "Single-threaded type checking", group: 0 },
            { label: "Deprecates legacy options", detail: "ignoreDeprecations: '6.0' to defer", group: 0 },
            { label: "Native binary, same tsc command", group: 1 },
            { label: "Shared-memory parallelism", detail: "typically 8-12x faster builds", group: 1 },
            { label: "Legacy options removed; API arrives in 7.1", group: 1 },
          ],
        },
        explanation: "- TypeScript 7.0 was released on 8 July 2026 as a native port of the compiler to Go\n- It installs as usual (npm install -D typescript) and still runs as tsc\n- Type-checking logic is structurally identical to 6.0, so errors are the same, found much faster\n- Builds are typically 8-12x faster, memory use drops, and editor errors appear far sooner\n- 7.0 ships no programmatic API; @typescript/typescript6 provides tsc6 and the 6.0 API for tools that need it",
        keyPoints: [
          { tone: "key", text: "Upgrade path: move to TypeScript 6.0 first, fix every deprecation warning, then switch to 7.0." },
          { tone: "tip", text: "Tools built on the compiler API (some linters and framework plugins) may keep using TypeScript 6 until 7.1 ships an API." },
          { tone: "warning", text: "Vue, Svelte, Astro, MDX and Angular template checking cannot use TypeScript 7 yet, pending the API." },
        ],
        example: "- vscode's codebase builds 11.9x faster; sentry's 8.9x faster\n- Editor error detection in the vscode project dropped from 17.5s to 1.3s\n- npm install -D typescript@next installs nightly builds\n- npm install -D @typescript/typescript6 keeps tsc6 alongside for API-based tools",
        code: "# Upgrade in two steps\nnpm install -D typescript@6     # 1. fix all deprecation warnings\nnpx tsc --noEmit\n\nnpm install -D typescript@7     # 2. switch to the native compiler\nnpx tsc --noEmit                # same command, much faster\n\n# Tools that still need the JavaScript API\nnpm install -D @typescript/typescript6\nnpx tsc6 --version\n\n# package.json\n# \"scripts\": { \"typecheck\": \"tsc --noEmit\" }",
        exercise: "- Time tsc --noEmit on a project with TypeScript 6 and then 7\n- List the tools in your project that depend on the TypeScript API\n- Read your editor's TypeScript version indicator and switch it to the workspace version",
        checkpoint: "- Why are TypeScript 7's type errors the same as 6.0's?\n- What is the recommended upgrade path?\n- Why might a linter still need TypeScript 6?",
        mistake: "- Do not jump from 5.x straight to 7.0 without clearing 6.0 deprecations\n- Do not assume every framework tool supports 7.0 on day one\n- Do not uninstall TypeScript 6 if a tool still needs its API",
        interview: [
          {
            question: "Why is TypeScript 7 so much faster than TypeScript 6?",
            definition: "TypeScript 7 is a native Go port of the compiler rather than a compiler written in TypeScript and run on a JavaScript engine.",
            answer: "Native code avoids JavaScript engine overhead, and Go's shared-memory concurrency lets TypeScript 7 parse and type-check with several checker workers in parallel. Combined with new optimisations this gives typical 8-12x faster full builds, lower memory use and much faster editor feedback, while the type-checking logic was ported methodically so results match 6.0.",
            similar: [
              { question: "Does TypeScript 7 change the TypeScript language?", answer: "Barely: the type system is the same; the changes are defaults, removed legacy options and some JSDoc strictness." },
            ],
          },
        ],
      },
      {
        title: "Core types: unions, narrowing and generics",
        diagram: {
          kind: "flow",
          caption: "Narrowing: TypeScript follows your control flow and shrinks a union to the specific member each branch can only be.",
          items: [
            { label: "type Result = { ok: true; data: User } | { ok: false; error: string }", detail: "a discriminated union" },
            { label: "if (result.ok)", detail: "check the discriminant" },
            { label: "Branch 1: result.data is available", detail: "narrowed to the success member" },
            { label: "Branch 2: result.error is available", detail: "narrowed to the failure member" },
            { label: "Default: assertNever(result)", detail: "compile error if a case is missed" },
          ],
        },
        explanation: "- Annotate function parameters and public APIs; let TypeScript infer local variables\n- Union types (A | B) describe values that can be one of several shapes\n- Narrowing with typeof, in, instanceof, equality and discriminant checks refines unions safely\n- Generics (<T>) keep the relationship between inputs and outputs\n- Utility types transform existing types: Partial, Pick, Omit, Record, ReturnType, Awaited",
        keyPoints: [
          { tone: "key", text: "Model states as discriminated unions ({ status: 'loading' } | { status: 'done'; data }) instead of many optional fields." },
          { tone: "tip", text: "satisfies checks a value against a type without widening it, keeping precise literal types." },
          { tone: "tip", text: "as const freezes a literal into readonly, exact types: ['a', 'b'] as const is readonly ['a', 'b']." },
          { tone: "warning", text: "any switches checking off; prefer unknown and narrow it." },
        ],
        example: "- function first<T>(items: T[]): T | undefined keeps the element type\n- type Config = Record<'dev' | 'prod', { url: string }>\n- const routes = { home: '/', about: '/about' } satisfies Record<string, string>\n- type Status = (typeof STATUSES)[number] derives a union from an as const array",
        code: "type User = { id: number; name: string };\ntype Result<T> = { ok: true; data: T } | { ok: false; error: string };\n\nfunction assertNever(value: never): never {\n  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);\n}\n\nfunction render(result: Result<User>): string {\n  if (result.ok) return `Hello ${result.data.name}`;   // narrowed: data exists\n  return `Error: ${result.error}`;                     // narrowed: error exists\n}\n\n// Generics keep input and output related\nfunction groupBy<T, K extends PropertyKey>(items: T[], key: (item: T) => K): Record<K, T[]> {\n  const out = {} as Record<K, T[]>;\n  for (const item of items) (out[key(item)] ??= []).push(item);\n  return out;\n}\n\n// as const + satisfies: exact types, still checked\nconst STATUSES = ['draft', 'published', 'archived'] as const;\ntype Status = (typeof STATUSES)[number];               // 'draft' | 'published' | 'archived'\n\nconst labels = { draft: 'Draft', published: 'Live', archived: 'Old' } satisfies Record<Status, string>;\n\nfunction label(status: Status) {\n  switch (status) {\n    case 'draft': case 'published': case 'archived': return labels[status];\n    default: return assertNever(status);\n  }\n}",
        apiReference: [
          {
            name: "satisfies",
            kind: "operator",
            signature: "expression satisfies Type",
            params: [{ name: "Type", type: "type", description: "The type the value must conform to." }],
            returns: "The expression with its own (narrower) inferred type, after checking it against Type.",
          },
          {
            name: "Utility types",
            kind: "built-in types",
            signature: "Partial<T> Required<T> Readonly<T> Pick<T, K> Omit<T, K> Record<K, V> ReturnType<F> Parameters<F> Awaited<P> NonNullable<T>",
            params: [],
            returns: "New types derived from existing ones.",
          },
        ],
        exercise: "- Model a fetch state machine as a discriminated union and render each state\n- Write a generic pick<T, K extends keyof T>(obj, keys) function\n- Replace an any-typed parameter with unknown and narrow it",
        checkpoint: "- What makes a union 'discriminated'?\n- How does satisfies differ from a type annotation?\n- Why is unknown safer than any?",
        mistake: "- Do not use optional fields for states that cannot coexist\n- Do not cast with as to silence errors you do not understand\n- Do not annotate everything; let inference work for locals",
      },
      {
        title: "TypeScript 7's new defaults",
        diagram: {
          kind: "tree",
          caption: "A tsconfig with no options now behaves like a modern, strict, ESM project. Knowing the defaults tells you which settings you can delete and which you must now add.",
          items: [
            { label: "strict: true", detail: "all strict checks on by default" },
            { label: "module: esnext", detail: "ESM is the default output" },
            { label: "target: current stable ECMAScript", detail: "e.g. es2025, not es5" },
            { label: "types: []", detail: "no more auto-including every @types package" },
            { label: "rootDir: ./", detail: "the folder containing tsconfig.json" },
            { label: "noUncheckedSideEffectImports: true", detail: "side-effect imports must resolve" },
            { label: "stableTypeOrdering: true", detail: "deterministic; cannot be disabled" },
          ],
        },
        explanation: "- strict is on by default, so new projects start with the safest checks\n- types defaults to [], so list the global type packages you need, e.g. ['node', 'jest']\n- rootDir defaults to the tsconfig folder; set it to ./src if your sources live there\n- module defaults to esnext and target to the current stable ECMAScript edition\n- noUncheckedSideEffectImports catches typos in imports like import './styles.css' that resolve to nothing",
        keyPoints: [
          { tone: "key", text: "The most common migration fix is adding \"types\": [\"node\"] (and test globals) now that types defaults to []." },
          { tone: "tip", text: "Delete options that now match the defaults; a shorter tsconfig is easier to reason about." },
          { tone: "warning", text: "If output appears in unexpected folders after upgrading, set rootDir explicitly." },
        ],
        example: "- \"types\": [\"node\", \"jest\"] restores Node and Jest globals\n- \"rootDir\": \"./src\" keeps dist/ laid out as before\n- Removing \"strict\": true changes nothing, because it is the default\n- import './setup-polyfills' now errors if the file does not exist",
        code: "// tsconfig.json for a TypeScript 7 Node service\n{\n  \"compilerOptions\": {\n    // Now defaults: strict: true, module: esnext, target: current ES\n    \"module\": \"nodenext\",          // Node's ESM/CJS rules\n    \"rootDir\": \"./src\",            // default would be ./\n    \"outDir\": \"./dist\",\n    \"types\": [\"node\"],             // default is now []\n    \"noUncheckedIndexedAccess\": true,\n    \"verbatimModuleSyntax\": true,\n    \"skipLibCheck\": true\n  },\n  \"include\": [\"src\"]\n}\n\n// tsconfig.json for a Vite/Next.js app (bundler-resolved)\n// { \"compilerOptions\": { \"module\": \"esnext\", \"moduleResolution\": \"bundler\",\n//   \"jsx\": \"react-jsx\", \"noEmit\": true, \"types\": [\"vite/client\"] } }",
        exercise: "- Remove every option from your tsconfig that equals a TypeScript 7 default\n- Fix 'Cannot find name process' errors by adding the right types entry\n- Set rootDir and confirm the output layout",
        checkpoint: "- What does types: [] change compared with older versions?\n- Why might output paths change after upgrading?\n- Which strict checks are on by default?",
        mistake: "- Do not re-enable implicit any to silence errors after upgrading\n- Do not forget test framework types in test tsconfigs\n- Do not leave rootDir implicit in projects with tsconfig outside src",
      },
      {
        title: "Removed options and migration",
        diagram: {
          kind: "split",
          caption: "Every option TypeScript 6.0 deprecated is gone in 7.0. Each has a modern replacement.",
          headings: ["Removed in TypeScript 7", "Use instead"],
          items: [
            { label: "target: es5, downlevelIteration", group: 0 },
            { label: "moduleResolution: node / node10 / classic", group: 0 },
            { label: "module: amd, umd, systemjs, none; outFile", group: 0 },
            { label: "baseUrl", group: 0 },
            { label: "target es2015+ (a bundler for old browsers)", group: 1 },
            { label: "nodenext or bundler", group: 1 },
            { label: "ESM output and a bundler", group: 1 },
            { label: "paths relative to tsconfig, or #/ subpath imports", group: 1 },
          ],
        },
        explanation: "- TypeScript 6.0 deprecated legacy options; 7.0 removed them\n- In 6.0, ignoreDeprecations: \"6.0\" temporarily silenced the warnings while you migrated\n- esModuleInterop and allowSyntheticDefaultImports can no longer be false; alwaysStrict can no longer be false\n- Import assertions (assert { type: 'json' }) must become import attributes (with { type: 'json' })\n- The module keyword for namespaces is prohibited; write namespace instead",
        keyPoints: [
          { tone: "key", text: "baseUrl removal: keep paths, but make each target relative to the tsconfig (\"@/*\": [\"./src/*\"])." },
          { tone: "tip", text: "Node.js #/ subpath imports (\"imports\": { \"#/*\": \"./src/*\" }) replace path aliases at runtime and in TypeScript." },
          { tone: "warning", text: "ignoreDeprecations was a 6.0 bridge only; it cannot keep removed options working in 7.0." },
        ],
        example: "- \"baseUrl\": \".\", \"paths\": { \"@/*\": [\"src/*\"] } becomes \"paths\": { \"@/*\": [\"./src/*\"] }\n- import data from './data.json' assert { type: 'json' } becomes with { type: 'json' }\n- module Utils { } becomes namespace Utils { }\n- \"moduleResolution\": \"node\" becomes \"nodenext\" (Node) or \"bundler\" (Vite, Next.js)",
        code: "// Before (TypeScript 5.x)\n{\n  \"compilerOptions\": {\n    \"target\": \"es5\",\n    \"downlevelIteration\": true,\n    \"moduleResolution\": \"node\",\n    \"baseUrl\": \".\",\n    \"paths\": { \"@/*\": [\"src/*\"] },\n    \"esModuleInterop\": false\n  }\n}\n\n// After (TypeScript 7)\n{\n  \"compilerOptions\": {\n    \"target\": \"es2022\",\n    \"module\": \"esnext\",\n    \"moduleResolution\": \"bundler\",\n    \"paths\": { \"@/*\": [\"./src/*\"] }   // relative to this tsconfig\n  }\n}\n\n// Or use Node's subpath imports (package.json), understood by TypeScript and Node 20+\n// \"imports\": { \"#/*\": \"./src/*\" }\n// import { db } from '#/lib/db.js';",
        exercise: "- Upgrade a project to TypeScript 6.0 and list every deprecation warning\n- Replace baseUrl-dependent paths with tsconfig-relative paths\n- Convert import assertions to import attributes",
        checkpoint: "- What replaced ignoreDeprecations' role in 7.0?\n- How do you keep @/ aliases without baseUrl?\n- Which module formats were removed?",
        mistake: "- Do not target es5 and expect TypeScript to downlevel; use a bundler if you must support old browsers\n- Do not keep assert in import statements\n- Do not rely on node10 resolution quirks",
      },
      {
        title: "Modules: nodenext, bundler and verbatim syntax",
        diagram: {
          kind: "flow",
          caption: "Pick module settings by who runs your output: Node.js itself, or a bundler. The choice decides how imports are resolved and what must be written in import paths.",
          items: [
            { label: "Who consumes the output?", detail: "Node.js directly, or a bundler" },
            { label: "Node.js: module nodenext", detail: "package.json type decides ESM or CJS" },
            { label: "Relative imports need extensions", detail: "import './db.js' even from .ts" },
            { label: "Bundler: moduleResolution bundler", detail: "Vite, Next.js, webpack; extensionless OK" },
            { label: "verbatimModuleSyntax", detail: "import type for types; what you write is what ships" },
          ],
        },
        explanation: "- nodenext follows Node's real rules: ESM or CommonJS per package.json type and file extension\n- In Node ESM, relative imports need the runtime extension: import './db.js' from a .ts file\n- bundler resolution matches tools like Vite and Next.js and allows extensionless imports\n- verbatimModuleSyntax keeps imports exactly as written, so type-only imports must say import type\n- erasableSyntaxOnly restricts code to syntax Node can strip natively (no enums or namespaces with runtime code)",
        keyPoints: [
          { tone: "key", text: "Libraries published to npm should use nodenext so they work for every consumer." },
          { tone: "tip", text: "Node.js can run .ts files directly by stripping types; erasableSyntaxOnly guarantees your code is compatible." },
          { tone: "warning", text: "Mixing default and named imports from CommonJS packages behaves differently in ESM; test the built output." },
        ],
        example: "- \"type\": \"module\" in package.json makes .js files ESM under nodenext\n- import type { User } from './types.js' is erased completely\n- const enum and enum are not erasable; use as const objects instead\n- node --experimental-strip-types src/index.ts (or plain node in newer releases) runs TypeScript",
        code: "// package.json\n// { \"type\": \"module\", \"imports\": { \"#/*\": \"./src/*\" } }\n\n// tsconfig.json\n// { \"compilerOptions\": { \"module\": \"nodenext\", \"verbatimModuleSyntax\": true, \"erasableSyntaxOnly\": true } }\n\n// src/users.ts\nimport type { User } from '#/types.js';     // type-only: erased\nimport { db } from '#/db.js';               // runtime import with extension\n\n// Instead of an enum (not erasable), use an as const object\nexport const Role = { Admin: 'admin', Member: 'member' } as const;\nexport type Role = (typeof Role)[keyof typeof Role];\n\nexport async function findUser(id: number): Promise<User | undefined> {\n  return db.users.find((u) => u.id === id);\n}",
        exercise: "- Configure a Node ESM project with nodenext and fix the import extensions\n- Enable verbatimModuleSyntax and convert type imports to import type\n- Replace an enum with an as const object and a derived union type",
        checkpoint: "- When should you use nodenext versus bundler?\n- Why must Node ESM imports include .js?\n- What does erasableSyntaxOnly forbid?",
        mistake: "- Do not use bundler resolution for code that Node runs directly\n- Do not omit import type under verbatimModuleSyntax\n- Do not use enums in code meant for native type stripping",
      },
      {
        title: "Speed, tooling and JSDoc in TypeScript 7",
        diagram: {
          kind: "tree",
          caption: "TypeScript 7's new performance controls and ecosystem notes.",
          items: [
            { label: "Parallelism flags" },
            { label: "--checkers N", detail: "type-checker workers (default 4)", depth: 1 },
            { label: "--builders N", detail: "build project references in parallel", depth: 1 },
            { label: "--singleThreaded", detail: "turn parallelism off", depth: 1 },
            { label: "Watch mode", detail: "Parcel's watcher ported to Go" },
            { label: "Editors", detail: "LSP-based; VS Code extension, Visual Studio" },
            { label: "JS + JSDoc", detail: "stricter: no @enum, no postfix !, use @typedef" },
          ],
        },
        explanation: "- --checkers controls how many type-checking workers run; more can help big projects on many-core machines\n- --builders parallelises builds of project references in monorepos\n- --singleThreaded disables parallelism, useful for constrained CI machines or debugging\n- The language service speaks the Language Server Protocol, so any LSP editor can use it\n- JavaScript checked via JSDoc follows TypeScript rules more strictly: @enum and Closure-style function types are gone",
        keyPoints: [
          { tone: "key", text: "Project references plus --builders give the biggest wins in large monorepos." },
          { tone: "tip", text: "Measure with --extendedDiagnostics before and after changing --checkers." },
          { tone: "warning", text: "In JSDoc, values cannot stand in for types any more; write typeof value." },
        ],
        example: "- npx tsc -b --builders 4 builds four referenced projects at once\n- npx tsc --noEmit --checkers 8 on a 16-core CI runner\n- /** @typedef {{ id: number }} User */ replaces ad-hoc JSDoc types\n- Template literal types now split '😀abc' into ['😀', 'abc'] by code point",
        code: "// Monorepo root tsconfig.json with project references\n{\n  \"files\": [],\n  \"references\": [\n    { \"path\": \"./packages/shared\" },\n    { \"path\": \"./packages/api\" },\n    { \"path\": \"./packages/web\" }\n  ]\n}\n\n// packages/shared/tsconfig.json\n// { \"compilerOptions\": { \"composite\": true, \"rootDir\": \"./src\", \"outDir\": \"./dist\" } }\n\n// Terminal\n// npx tsc -b --builders 3                 build references in parallel\n// npx tsc --noEmit --checkers 8           more checker workers\n// npx tsc --noEmit --singleThreaded       constrained CI machines\n// npx tsc --noEmit --extendedDiagnostics  measure\n\n// JSDoc in a .js file (checkJs)\n/** @typedef {{ id: number, name: string }} User */\n/** @param {User} user */\nexport function greet(user) {\n  return `Hi ${user.name}`;\n}",
        apiReference: [
          {
            name: "tsc parallelism flags",
            kind: "CLI (TypeScript 7)",
            signature: "tsc [--checkers <n>] [--builders <n>] [--singleThreaded]",
            params: [
              { name: "--checkers", type: "number", description: "Type-checker workers; default 4." },
              { name: "--builders", type: "number", description: "Parallel builds of project references (with -b)." },
              { name: "--singleThreaded", type: "flag", description: "Disable all parallelism." },
            ],
            returns: "The same diagnostics and output, produced with the chosen concurrency.",
          },
        ],
        exercise: "- Split a large project into two referenced projects and build with -b\n- Compare build times with --checkers 2, 4 and 8\n- Convert an @enum JSDoc pattern to an as const object with @typedef",
        checkpoint: "- What does --checkers control?\n- When would you use --singleThreaded?\n- Which JSDoc features were removed?",
        mistake: "- Do not assume more checkers is always faster; measure\n- Do not rely on Closure-style JSDoc types in TypeScript 7\n- Do not skip composite: true in referenced projects",
      },
    ],
    project: "Migrate a small Node.js + React monorepo to TypeScript 7: upgrade through TypeScript 6.0 and clear every deprecation; replace baseUrl aliases with tsconfig-relative paths and #/ subpath imports; switch the API package to nodenext with verbatimModuleSyntax and erasableSyntaxOnly; model API responses as discriminated unions with an assertNever exhaustiveness check; add project references and measure build time with --builders and --checkers; keep @typescript/typescript6 only for tools that still need the API.",
    summary: "- TypeScript 7 (8 July 2026) is a native Go compiler: same tsc and type errors, typically 8-12x faster\n- Upgrade via 6.0; tools needing the compiler API can use @typescript/typescript6 until 7.1\n- Core skills stay the same: unions, narrowing, generics, utility types, satisfies, as const\n- New defaults: strict, esnext modules, current ES target, types [], rootDir ./\n- Removed: es5, node10/classic resolution, AMD/UMD/System, outFile and baseUrl\n- Use nodenext for Node, bundler for Vite/Next.js, verbatimModuleSyntax and #/ subpath imports\n- --checkers, --builders and --singleThreaded tune the new parallel compiler",
    glossary: [
      { term: "Native port", definition: "TypeScript 7's rewrite of the compiler in Go, preserving the original's checking logic." },
      { term: "Discriminated union", definition: "A union whose members share a literal property that narrowing can switch on." },
      { term: "Narrowing", definition: "TypeScript refining a union to a specific member based on control flow checks." },
      { term: "Generic", definition: "A type parameter such as <T> that relates the types of inputs and outputs." },
      { term: "satisfies", definition: "An operator that checks a value against a type while keeping its inferred type." },
      { term: "moduleResolution", definition: "How TypeScript finds the file an import refers to: nodenext or bundler in modern projects." },
      { term: "Subpath imports", definition: "Node.js package.json imports starting with #, such as #/*, used as internal aliases." },
      { term: "verbatimModuleSyntax", definition: "An option that keeps imports as written, requiring import type for type-only imports." },
      { term: "Project references", definition: "Splitting a codebase into composite projects that build independently and incrementally." },
      { term: "LSP", definition: "Language Server Protocol, the standard TypeScript 7's editor tooling uses." },
    ],
    sources: [
      source("https://www.typescriptlang.org/docs/handbook/2/everyday-types.html", "Handbook: Everyday Types"),
      source("https://www.typescriptlang.org/docs/handbook/2/functions.html", "Handbook: Functions"),
      source("https://www.typescriptlang.org/docs/handbook/2/classes.html", "Handbook: Classes"),
      source("https://www.typescriptlang.org/docs/handbook/2/mapped-types.html", "Handbook: Mapped Types"),
      source("https://www.typescriptlang.org/docs/handbook/2/conditional-types.html", "Handbook: Conditional Types"),
      source("https://www.typescriptlang.org/docs/handbook/enums.html", "Handbook: Enums"),
      source("https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html", "Standard Decorators"),
      source("https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/", "Announcing TypeScript 7.0"),
      source("https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/", "Announcing TypeScript 6.0"),
      source("https://devblogs.microsoft.com/typescript/typescript-native-port/", "A 10x Faster TypeScript"),
      source("https://www.typescriptlang.org/docs/handbook/2/narrowing.html", "Handbook: Narrowing"),
      source("https://www.typescriptlang.org/docs/handbook/2/generics.html", "Handbook: Generics"),
      source("https://www.typescriptlang.org/docs/handbook/utility-types.html", "Utility Types"),
      source("https://www.typescriptlang.org/tsconfig/", "TSConfig Reference"),
      source("https://www.typescriptlang.org/docs/handbook/modules/theory.html", "Modules: Theory"),
      source("https://www.typescriptlang.org/docs/handbook/project-references.html", "Project References"),
      source("https://github.com/microsoft/typescript-go", "microsoft/typescript-go"),
    ],
  },
};

export const TYPESCRIPT_CORE_LESSON_COUNT = guide.curriculum.lessons.length;
guide.curriculum.lessons.push(...TYPESCRIPT_FUNDAMENTAL_LESSONS);

export default guide;
