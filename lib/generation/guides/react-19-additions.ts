import type { Lesson } from "@/lib/domain";

/**
 * Two lessons appended to the React 19 path, covering the parts of the modern
 * React story the main guide only mentions in passing: the React Compiler as a
 * build step you configure and verify, and React 19's error reporting — the
 * deduplicated logs, the three root error callbacks, hydration diffs and owner
 * stacks.
 *
 * Everything else in the React 19 feature list — Server Components, Server
 * Functions (Server Actions), Actions with useActionState, useFormStatus,
 * useOptimistic, `use`, ref as a prop, document metadata, stylesheet precedence
 * and the preloading APIs — already has a lesson of its own in
 * ../react-19-guide.ts and ./react-hooks.ts.
 */
export const REACT_19_ADDITIONS: Lesson[] = [
  {
    title: "The React Compiler: automatic memoization as a build step",
    diagram: {
      kind: "flow",
      caption: "The compiler runs at build time. It reads components that follow the Rules of React and emits the memoisation you would otherwise write by hand — which is why rule violations, not performance, are what stop it working.",
      items: [
        { label: "Your component source", detail: "no useMemo, no useCallback, no memo()" },
        { label: "Compiler analyses it", detail: "does this code follow the Rules of React?" },
        { label: "Violation found", detail: "the component is skipped, and the lint rule tells you why" },
        { label: "Compliant code", detail: "values and JSX get memoisation slots" },
        { label: "Emits compiler-runtime calls", detail: "import { c as _c } from 'react/compiler-runtime'" },
        { label: "Runtime", detail: "cascading re-renders stop at unchanged subtrees" },
        { label: "Verify in DevTools", detail: "a Memo ✨ badge on optimised components" },
        { label: "Escape hatch", detail: "\"use no memo\" to skip one component" },
      ],
    },
    explanation: "- React Compiler is a build-time tool that memoises components and the expensive calculations inside them, removing most hand-written useMemo, useCallback and memo()\n- It is stable and production-ready, supports React 17, 18 and 19, and plugs into Babel, Vite, Metro, Rsbuild and Next.js 15.3.1 and later\n- Install `babel-plugin-react-compiler` and `eslint-plugin-react-hooks`, and enable the `recommended-latest` preset — the compiler rules ship with that plugin\n- In Babel, the plugin must run first; in Next.js it is a config flag, because Next runs the compiler through SWC rather than Babel\n- It optimises two things: it skips cascading re-renders when a parent updates but a child's inputs did not change, and it caches expensive calculations inside components and hooks\n- It does not memoise standalone utility functions outside components, and memoisation is not shared between components that call the same function\n- It can only optimise code that follows the Rules of React. A component that mutates props, writes to a module-level variable during render, or reads a ref while rendering is skipped rather than mis-compiled\n- That is why the lint rule matters more than the compiler flag: it tells you which components were skipped and why, and fixing those violations is what expands the compiler's coverage\n- Verify rather than assume: React DevTools shows a Memo ✨ badge beside optimised components, and compiled output imports `c` from `react/compiler-runtime`\n- `\"use no memo\"` at the top of a function body opts that component out temporarily — useful to bisect a suspected miscompilation, not as a permanent fix\n- Keep useMemo or useCallback deliberately in two cases: when a value is an Effect dependency and must stay referentially stable, and where you need precise control over the dependency list\n- Adopt incrementally: turn it on, ship, then delete manual memoisation as you touch components — and measure, because the win is usually in re-render count rather than in raw render time",
    keyPoints: [
      { tone: "key", title: "Rules of React are the contract", text: "The compiler optimises only code it can prove is compliant. A skipped component is a rule violation to fix, not a compiler bug to work around." },
      { tone: "key", title: "The lint rule is the interface", text: "eslint-plugin-react-hooks with recommended-latest reports what the compiler could not optimise, which is the actionable half of adoption." },
      { tone: "key", title: "Verify with the DevTools badge", text: "A Memo ✨ badge next to a component is proof it was optimised. Without checking, teams often run a compiler that silently skipped half the tree." },
      { tone: "tip", title: "Delete manual memoisation as you touch code", text: "Removing useMemo and useCallback wholesale in one commit makes regressions hard to attribute; do it file by file with measurements." },
      { tone: "tip", title: "Keep memoisation that feeds an Effect", text: "When a value is an Effect dependency, a stable identity is behaviour rather than performance, so the explicit Hook still earns its place." },
      { tone: "warning", title: "\"use no memo\" is a bisect tool", text: "It silences the compiler for one component. Leaving it in place hides the rule violation that caused the problem." },
      { tone: "warning", title: "It does not fix an architectural problem", text: "The compiler removes re-render cost, not work that should never have been in render, and not fetching patterns that waterfall." },
    ],
    example: "- `const rows = filterAndSort(data, query)` needs no useMemo; the compiler caches it by its inputs\n- A parent re-render no longer re-renders an unchanged child list, with no memo() wrapper anywhere\n- The lint rule flags a component that mutates props, and fixing it brings that subtree under optimisation\n- DevTools shows Memo ✨ on 214 of 230 components; the remaining 16 are the work list\n- A component with \"use no memo\" is bisected, the ref-during-render violation is fixed, and the directive is deleted",
    code: "// 1. Install the compiler and the lint rules that tell you what it skipped.\n// npm install -D babel-plugin-react-compiler@latest eslint-plugin-react-hooks@latest\n\n// babel.config.js — the plugin must run first.\nmodule.exports = {\n  plugins: [\n    'babel-plugin-react-compiler',\n    // ...other plugins after it\n  ],\n};\n\n// eslint.config.mjs — the compiler rules ship with the hooks plugin.\nimport reactHooks from 'eslint-plugin-react-hooks';\n\nexport default [\n  reactHooks.configs['recommended-latest'],   // reports what the compiler cannot optimise\n];\n\n// 2. What you stop writing.\n// Before: manual memoisation, and a dependency array to keep correct.\nfunction ReportBefore({ rows, query }) {\n  const visible = useMemo(() => rows.filter(r => r.name.includes(query)).sort(byName), [rows, query]);\n  const onPick = useCallback(id => select(id), []);\n  return <Table rows={visible} onPick={onPick} />;\n}\n\n// After: the compiler inserts the same memoisation, keyed by real dependencies.\nfunction ReportAfter({ rows, query }) {\n  const visible = rows.filter(r => r.name.includes(query)).sort(byName);\n  const onPick = id => select(id);\n  return <Table rows={visible} onPick={onPick} />;\n}\n\n// 3. Why a component gets skipped: a Rules of React violation, not a performance problem.\nlet renderCount = 0;                  // module-level mutation during render\nfunction Skipped({ items, cache }) {\n  renderCount++;                      // side effect in render\n  items.sort();                       // mutating a prop\n  return <List items={items} count={renderCount} />;\n}\n\n// Fixed: pure render, mutation moved out, sorting on a copy.\nfunction Optimised({ items }) {\n  const sorted = [...items].sort(byName);\n  return <List items={sorted} />;\n}\n\n// 4. Temporary opt-out while you bisect a suspected miscompilation.\nfunction ProblematicComponent() {\n  'use no memo';\n  // ...\n}\n\n// 5. Proof it ran: compiled output imports the runtime.\n// import { c as _c } from \"react/compiler-runtime\";",
    apiReference: [
      {
        name: "babel-plugin-react-compiler",
        kind: "build plugin",
        signature: "plugins: ['babel-plugin-react-compiler', ...] — must be listed first",
        params: [
          { name: "target", type: "'17' | '18' | '19'", description: "React version to compile for; 17 and 18 need the runtime package." },
          { name: "sources", type: "(filename) => boolean", description: "Limits which files are compiled, for incremental adoption." },
        ],
        returns: "Components and hooks with memoisation inserted at build time.",
        notes: "Next.js 15.3.1+ runs the compiler through SWC via a config flag rather than Babel.",
      },
      {
        name: "\"use no memo\"",
        kind: "directive",
        signature: "function Component() { 'use no memo'; ... }",
        params: [{ name: "placement", type: "first statement", description: "At the top of the function body, like 'use client'." }],
        returns: "That component is left untouched by the compiler.",
        notes: "Intended for bisecting a problem, not as a permanent exclusion.",
      },
      {
        name: "Verification",
        kind: "practice",
        signature: "React DevTools 'Memo ✨' badge · compiled output imports { c as _c } from 'react/compiler-runtime'",
        params: [
          { name: "DevTools badge", type: "signal", description: "Appears beside components the compiler optimised, in development." },
          { name: "lint report", type: "signal", description: "Names components skipped for rule violations." },
        ],
        returns: "Evidence that the compiler ran and how much of the tree it covered.",
      },
    ],
    vocabulary: [
      { word: "Memoization", meaning: "Caching a computed value or a rendered subtree keyed by its inputs.", example: "Reusing a filtered list until rows or query change.", synonyms: ["caching", "result reuse", "value caching", "render skipping", "cached computation", "reuse of prior work"], antonyms: ["recomputation", "re-render", "recalculation", "repeated work", "fresh calculation", "no caching"] },
      { word: "Cascading re-render", meaning: "A parent's update causing children to re-render although their inputs are unchanged.", example: "A clock tick re-rendering a whole table.", synonyms: ["render cascade", "downstream re-render", "propagated render", "chain re-render", "unnecessary subtree update"], antonyms: ["bailout", "skipped render", "stable subtree", "contained update", "isolated render", "memoised child"] },
      { word: "Rules of React", meaning: "The purity and Hook constraints components must follow to be optimisable.", example: "No mutation of props during render.", synonyms: ["purity rules", "component contract", "React invariants", "render purity", "hook rules"], antonyms: ["side effects in render", "rule violation", "mutation in render", "conditional hooks", "impure component"] },
      { word: "Compiler runtime", meaning: "The small React module that stores the compiler's memoisation slots.", example: "import { c as _c } from 'react/compiler-runtime'", synonyms: ["memo cache", "runtime helper", "generated cache", "memo slots", "compiler helper"], antonyms: ["hand-written Hook", "manual cache", "manual useMemo", "hand-rolled cache", "no memoisation"] },
      { word: "Referential stability", meaning: "A value keeping the same identity between renders.", example: "A callback that does not re-trigger an Effect.", synonyms: ["identity stability", "stable reference", "unchanged identity", "same reference", "preserved identity"], antonyms: ["new object each render", "identity churn", "fresh object per render", "unstable dependency", "changing identity"] },
      { word: "Incremental adoption", meaning: "Enabling an optimisation for part of a codebase and expanding it.", example: "Compiling one directory first via sources.", synonyms: ["gradual rollout", "phased adoption", "staged migration", "file-by-file rollout", "opt-in migration"], antonyms: ["big-bang migration", "all-at-once switch", "flag day", "rewrite everything", "forced cutover"] },
    ],
    useCase: {
      scenario: "A dashboard re-renders a 400-row table on every keystroke in an unrelated filter box. The codebase has 180 useMemo and useCallback calls, several with stale dependency arrays, and two bugs traced to a missing dependency.",
      example: "React Compiler is enabled with the hooks lint plugin on recommended-latest. The lint report names 14 components it cannot optimise — mostly props mutated during render and a ref read while rendering — and those are fixed first. Manual memoisation is deleted directory by directory as files are touched, except where a value feeds an Effect dependency. Coverage is verified by the Memo ✨ badge in DevTools.",
      usage: "Typing no longer re-renders the table, 160 hand-written memo Hooks and their dependency arrays disappear, and the two dependency bugs cannot recur because nobody maintains those arrays any more.",
    },
    exercise: "- Install the compiler and the hooks lint plugin, and read the list of components it cannot optimise\n- Fix one rule violation and confirm the component gains the Memo ✨ badge in DevTools\n- Delete manual memoisation in one file and measure re-render counts before and after with the Profiler\n- Find a useMemo that exists to keep an Effect dependency stable, and keep it deliberately",
    checkpoint: "- What stops the compiler from optimising a component?\n- How do you prove the compiler actually optimised your components?\n- Which manual memoisation is still worth keeping?",
    mistake: "- Do not leave \"use no memo\" in place instead of fixing the rule violation behind it\n- Do not delete every useMemo at once; some exist for identity, not speed\n- Do not assume the compiler ran; check the DevTools badge and the compiled output",
    interview: [
      {
        question: "What does React Compiler do, and what stops it working?",
        definition: "It inserts memoisation at build time for components and hooks that follow the Rules of React.",
            answer: "The compiler analyses your components and emits the caching you would otherwise write with useMemo, useCallback and memo: cascading re-renders stop where inputs are unchanged, and expensive calculations inside components and hooks are cached. It cannot optimise code that breaks the Rules of React — mutating props or state during render, writing to module-level variables while rendering, reading refs during render — and rather than risk a miscompilation it skips those components. That is why adoption is mostly a lint exercise: eslint-plugin-react-hooks reports what was skipped, and fixing those violations is what grows the optimised surface.",
        similar: [
          { question: "Does it replace memo() entirely?", answer: "For performance, largely yes; keep manual memoisation where a stable identity is needed as an Effect dependency." },
          { question: "Which build tools support it?", answer: "Babel, Vite, Metro, Rsbuild, and Next.js 15.3.1 and later through SWC." },
        ],
      },
      {
        question: "How would you adopt React Compiler in an existing codebase?",
        definition: "Enable it with the lint rules, fix what it reports, verify coverage, then remove manual memoisation gradually.",
        answer: "Install the plugin and eslint-plugin-react-hooks on recommended-latest, and treat the lint output as the work list: each reported component is a Rules of React violation keeping a subtree unoptimised. Verify with the DevTools Memo badge that the compiler is actually running and how much of the tree it covers. Then delete manual useMemo and useCallback as you touch files rather than in one sweep, keeping those that provide referential stability for Effect dependencies, and measure with the Profiler so the improvement is a number rather than a belief. If a component misbehaves, bisect with \"use no memo\", find the rule violation, fix it, and remove the directive.",
        similar: [
          { question: "Can you compile only part of the codebase?", answer: "Yes — the sources option limits which files are compiled, which suits a staged rollout." },
          { question: "Does it help with data fetching waterfalls?", answer: "No. It removes re-render cost; fetching architecture and work that does not belong in render are separate problems." },
        ],
      },
    ],
    objectiveQuestions: [
      {
        question: "A component is not optimised by React Compiler. What is the most likely reason?",
        options: ["It renders too many elements", "It violates the Rules of React, so the compiler skips it", "It uses Server Components", "It has no useMemo calls to replace"],
        correct: 1,
        shortAnswer: "It breaks the Rules of React and is skipped",
        explanation: "The compiler only transforms code it can prove is compliant; mutating props during render, writing to module scope while rendering or reading a ref in render all cause it to skip the component rather than risk incorrect output. Size, Server Components and the absence of manual memoisation have nothing to do with it — and the lint rule names the violation.",
      },
      {
        question: "Which memoisation is still worth writing by hand with the compiler enabled?",
        options: ["Memoising a list render", "A value whose stable identity is required as an Effect dependency", "A callback passed to a child component", "An expensive calculation inside a component"],
        correct: 1,
        shortAnswer: "A value needed as a stable Effect dependency",
        explanation: "When identity stability is behaviour rather than performance — preventing an Effect from re-running — expressing it explicitly keeps the intent visible and guaranteed. The other three cases are exactly what the compiler now handles automatically inside components and hooks.",
      },
      {
        question: "How do you confirm the compiler optimised a given component?",
        options: ["Check the bundle size", "Look for the Memo ✨ badge in React DevTools", "Count the useMemo calls removed", "Run the app in production mode"],
        correct: 1,
        shortAnswer: "The Memo ✨ badge in React DevTools",
        explanation: "React DevTools marks optimised components with a Memo badge in development, and the compiled output imports c from react/compiler-runtime. Bundle size, removed Hook calls and production mode tell you nothing about which components the compiler actually covered.",
      },
    ],
  },
  {
    title: "Error reporting: root callbacks, hydration diffs and owner stacks",
    diagram: {
      kind: "flow",
      caption: "Where an error goes in React 19. The root decides how it is reported, an Error Boundary decides what the user sees, and the owner stack tells you which component rendered the one that failed.",
      items: [
        { label: "A component throws", detail: "during render, in an Effect, or in an event handler" },
        { label: "Nearest Error Boundary?", detail: "class boundary with getDerivedStateFromError" },
        { label: "Caught", detail: "onCaughtError fires; the boundary's fallback renders" },
        { label: "Uncaught", detail: "onUncaughtError fires; the tree unmounts" },
        { label: "Recovered automatically", detail: "onRecoverableError, e.g. a hydration mismatch" },
        { label: "One log, not three", detail: "React 19 merged the duplicate reports" },
        { label: "Hydration mismatch", detail: "a single message with a server/client diff" },
        { label: "captureOwnerStack()", detail: "development: which component rendered this one" },
      ],
    },
    explanation: "- Before React 19, one caught error produced three console entries: the original throw, a duplicate after recovery failed, and a console.error with component context. React 19 logs one error containing all of it\n- `createRoot` and `hydrateRoot` accept three error callbacks: `onCaughtError` when an Error Boundary catches, `onUncaughtError` when nothing catches, and `onRecoverableError` when React recovered by itself\n- That split is what makes error reporting useful in production: caught errors are handled degradation, uncaught errors are outages, and recoverable errors are usually hydration problems worth fixing but not worth paging for\n- Route each to your monitoring with different severity, and include the component stack React supplies in the second argument\n- Hydration mismatches now produce a single message with a diff showing exactly which server-rendered markup disagreed with the client render, instead of a series of near-identical warnings\n- The usual causes are the same handful: values that differ between server and client (Date.now(), Math.random(), locale or timezone formatting), browser-only APIs read during render, invalid HTML nesting the browser silently repairs, and extensions injecting markup\n- Error Boundaries are still class components with `getDerivedStateFromError` and `componentDidCatch`, and they still do not catch errors in event handlers, in asynchronous callbacks, or during server rendering\n- For errors in event handlers and async code, catch them yourself and put the failure in state, or surface them through an Action's error state\n- `captureOwnerStack()` is a development-only API that returns the owner stack — which component rendered the failing one — as opposed to the call stack, which is usually the framework's internals\n- Owner stacks are what make a message like 'a <div> cannot appear inside a <p>' actionable, because they name the component that produced the markup\n- Design the boundary tree deliberately: one boundary per meaningful region, so a failing widget does not blank the page, with a reset path the user can take",
    keyPoints: [
      { tone: "key", title: "Three callbacks, three severities", text: "Uncaught means the tree unmounted; caught means a fallback rendered; recoverable usually means hydration. Reporting them identically wastes the distinction." },
      { tone: "key", title: "Hydration mismatches now come with a diff", text: "One message showing server versus client markup replaces the old wall of warnings, so the offending node is visible immediately." },
      { tone: "key", title: "Owner stacks name the responsible component", text: "captureOwnerStack tells you which component rendered the failing element — the question a call stack full of React internals cannot answer." },
      { tone: "tip", title: "Boundaries per region, not per app", text: "A single boundary around the whole app turns any failure into a blank page. One per panel keeps the rest of the UI alive." },
      { tone: "tip", title: "Event-handler errors need your own try/catch", text: "Boundaries do not catch them. Put the failure into state, or let an Action's error state carry it." },
      { tone: "warning", title: "suppressHydrationWarning hides, it does not fix", text: "It is correct only for genuinely non-deterministic content such as a timestamp, and wrong as a general silencer." },
      { tone: "warning", title: "Invalid nesting is a mismatch generator", text: "A <div> inside a <p> is repaired by the browser, so the client DOM stops matching the server HTML." },
    ],
    example: "- onUncaughtError pages on-call; onCaughtError files a ticket; onRecoverableError feeds a weekly report\n- A hydration diff shows the server rendered '12:04 PM' and the client rendered '9:34 AM' — a timezone bug\n- captureOwnerStack names <PriceTag> as the component that rendered a <div> inside a <p>\n- A failing recommendations panel shows a fallback while the rest of the page keeps working\n- A fetch error in an onClick handler is caught explicitly and rendered as an inline message",
    code: "// main.tsx — the root decides how errors are reported, with severity per kind.\nimport { createRoot } from 'react-dom/client';\nimport { captureOwnerStack } from 'react';\n\nconst root = createRoot(document.getElementById('root')!, {\n  // Nothing caught it: the tree unmounted. This is an outage.\n  onUncaughtError(error, errorInfo) {\n    report({ level: 'fatal', error, componentStack: errorInfo.componentStack, ownerStack: devOwnerStack() });\n  },\n  // A boundary caught it: the user saw a fallback, not a blank page.\n  onCaughtError(error, errorInfo) {\n    report({ level: 'error', error, componentStack: errorInfo.componentStack });\n  },\n  // React recovered by itself — most often a hydration mismatch.\n  onRecoverableError(error, errorInfo) {\n    report({ level: 'warning', error, componentStack: errorInfo.componentStack });\n  },\n});\n\n// Owner stacks are development-only: which component rendered the failing one.\nfunction devOwnerStack() {\n  return process.env.NODE_ENV !== 'production' ? captureOwnerStack() : null;\n}\n\n// ErrorBoundary.tsx — still a class, still scoped per region.\nimport { Component, type ReactNode } from 'react';\n\nexport class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {\n  state = { failed: false };\n  static getDerivedStateFromError() { return { failed: true }; }\n  render() { return this.state.failed ? this.props.fallback : this.props.children; }\n}\n\n// One boundary per meaningful region, so one failure does not blank the page.\nfunction Dashboard() {\n  return (\n    <main>\n      <ErrorBoundary fallback={<p>Orders are unavailable.</p>}><Orders /></ErrorBoundary>\n      <ErrorBoundary fallback={<p>Recommendations are unavailable.</p>}><Recommendations /></ErrorBoundary>\n    </main>\n  );\n}\n\n// Hydration: the four usual causes, and the one correct use of suppressHydrationWarning.\nfunction Mismatches({ user }) {\n  const now = new Date().toLocaleTimeString();          // differs server vs client: suppress deliberately\n  const width = typeof window !== 'undefined' ? window.innerWidth : 0;  // browser-only: move to an Effect\n  return (\n    <>\n      <time suppressHydrationWarning>{now}</time>       {/* genuinely non-deterministic */}\n      <p>{user.bio}</p>                                  {/* if bio contains a <div>, the browser repairs it */}\n      <span>{width}</span>\n    </>\n  );\n}\n\n// Event handlers are NOT covered by boundaries: catch them yourself.\nfunction SaveButton({ onSave }) {\n  const [error, setError] = useState<string | null>(null);\n  return (\n    <>\n      <button onClick={async () => {\n        try { setError(null); await onSave(); }\n        catch (e) { setError(e instanceof Error ? e.message : 'Could not save'); }\n      }}>Save</button>\n      {error && <p role=\"alert\">{error}</p>}\n    </>\n  );\n}",
    apiReference: [
      {
        name: "createRoot error options",
        kind: "API",
        signature: "createRoot(container, { onCaughtError?, onUncaughtError?, onRecoverableError? })",
        params: [
          { name: "onCaughtError", type: "(error, errorInfo) => void", description: "An Error Boundary caught the error; a fallback rendered." },
          { name: "onUncaughtError", type: "(error, errorInfo) => void", description: "Nothing caught it; the tree unmounted." },
          { name: "onRecoverableError", type: "(error, errorInfo) => void", description: "React recovered automatically, typically from a hydration mismatch." },
          { name: "errorInfo", type: "{ componentStack }", description: "The component stack to attach to the report." },
        ],
        returns: "A root whose error reporting you control centrally.",
        notes: "hydrateRoot accepts the same three options.",
      },
      {
        name: "captureOwnerStack",
        kind: "API",
        signature: "captureOwnerStack(): string | null — development builds only",
        params: [{ name: "return", type: "string | null", description: "The chain of components that rendered the current one, or null outside development." }],
        returns: "The owner stack, which answers 'who rendered this?' rather than 'what called this function?'.",
        notes: "Returns null in production builds, so guard the call before reporting.",
      },
      {
        name: "Error Boundary",
        kind: "component",
        signature: "class extends Component { static getDerivedStateFromError(error) {} componentDidCatch(error, errorInfo) {} }",
        params: [
          { name: "getDerivedStateFromError", type: "static", description: "Returns the state that renders the fallback." },
          { name: "componentDidCatch", type: "method", description: "Side-effectful reporting with the component stack." },
        ],
        returns: "A fallback UI for its subtree.",
        notes: "Does not catch errors in event handlers, asynchronous callbacks or server rendering.",
      },
    ],
    vocabulary: [
      { word: "Error Boundary", meaning: "A class component that renders a fallback when its subtree throws during rendering.", example: "A panel showing 'unavailable' instead of blanking the page.", synonyms: ["fallback boundary", "failure container", "catch component", "isolation wrapper", "recovery boundary"], antonyms: ["uncaught error", "whole-page crash", "unprotected tree", "propagated crash", "full unmount"] },
      { word: "Hydration mismatch", meaning: "A difference between server-rendered HTML and the client's first render.", example: "A timestamp formatted in two timezones.", synonyms: ["server/client divergence", "markup mismatch", "render disagreement", "HTML/DOM difference", "SSR mismatch"], antonyms: ["matching render", "stable output", "consistent markup", "deterministic render", "clean hydration"] },
      { word: "Owner stack", meaning: "The chain of components that rendered the current component.", example: "Dashboard rendered PriceTag, which rendered the invalid div.", synonyms: ["render ancestry", "component lineage", "rendering chain", "component provenance", "who-rendered-this"], antonyms: ["call stack", "framework internals", "JavaScript trace", "internal frames", "minified stack"] },
      { word: "Recoverable error", meaning: "An error React handled itself, usually by re-rendering on the client.", example: "A hydration mismatch repaired at runtime.", synonyms: ["auto-recovered error", "non-fatal error", "self-corrected failure", "warning-level error", "handled internally"], antonyms: ["uncaught error", "fatal failure", "fatal crash", "unmounted tree", "unrecovered failure"] },
      { word: "Component stack", meaning: "The React component path attached to an error report.", example: "App > Dashboard > Orders > Row.", synonyms: ["React stack", "element path", "render path", "element hierarchy", "React trace"], antonyms: ["JavaScript stack trace", "function call stack", "bundler frames", "native trace", "minified trace"] },
      { word: "Fallback UI", meaning: "What a boundary renders in place of the failed subtree.", example: "'Recommendations are unavailable.'", synonyms: ["error state", "degraded view", "placeholder", "failure view", "safe replacement"], antonyms: ["blank page", "crashed tree", "white screen", "broken layout", "unhandled crash"] },
    ],
    useCase: {
      scenario: "Production error reports are a wall of duplicated messages with stack traces pointing into React internals. A hydration warning appears on every page load, nobody knows which component causes it, and one failing widget occasionally blanks the entire dashboard.",
      example: "The root is configured with all three callbacks, reporting uncaught errors as fatal, caught errors as errors and recoverable errors as warnings, each with the component stack and, in development, an owner stack. The hydration diff names a timestamp formatted with the server's timezone; it is moved into an Effect, with suppressHydrationWarning left only on the genuinely non-deterministic clock. Boundaries are added per dashboard region.",
      usage: "Alert volume drops because severity now reflects impact, the hydration warning disappears, and a failing widget degrades to a small fallback instead of taking the page down.",
    },
    exercise: "- Configure all three root error callbacks and give each a different severity in your reporting\n- Reproduce a hydration mismatch deliberately and read the diff React prints\n- Add captureOwnerStack to your development reporting and confirm it names the rendering component\n- Split one page-level Error Boundary into per-region boundaries and verify the page survives a failure",
    checkpoint: "- What is the difference between onCaughtError, onUncaughtError and onRecoverableError?\n- Which errors do Error Boundaries not catch, and what should you do instead?\n- What does an owner stack tell you that a call stack does not?",
    mistake: "- Do not report all three error kinds at one severity; they mean different things to users\n- Do not sprinkle suppressHydrationWarning to silence mismatches you have not diagnosed\n- Do not rely on a boundary to catch an event-handler error; catch it and put it in state",
    interview: [
      {
        question: "How does React 19 improve error reporting?",
        definition: "It deduplicates the logs and adds three root-level callbacks that distinguish caught, uncaught and recovered errors.",
        answer: "Previously a single caught error produced three console entries — the throw, a duplicate after recovery failed, and a separate console.error with component context — which made production reporting noisy and duplicated. React 19 emits one log with all the information, and createRoot and hydrateRoot now accept onCaughtError, onUncaughtError and onRecoverableError so you can route each kind to monitoring with appropriate severity. Hydration problems also changed: instead of a run of similar warnings, React prints one message with a diff of the server and client markup, which usually identifies the offending node immediately.",
        similar: [
          { question: "What is onRecoverableError usually telling you?", answer: "Most often a hydration mismatch that React repaired on the client — worth fixing, but not an outage." },
          { question: "Do boundaries catch async errors?", answer: "No. Errors in event handlers and asynchronous callbacks must be caught explicitly and put into state." },
        ],
      },
      {
        question: "You see a hydration mismatch warning in production. How do you diagnose it?",
        definition: "Read React's single diff message, then check the small set of causes that make server and client render differently.",
        answer: "The diff names the mismatching markup, which usually points straight at the cause: a value that differs between environments such as Date.now, Math.random, or locale and timezone formatting; a browser-only API read during render instead of in an Effect; invalid HTML nesting that the browser silently repairs so the client DOM no longer matches; or an extension injecting nodes. In development, captureOwnerStack names the component that rendered the element, which is the fastest route from the diff to the file. suppressHydrationWarning is only appropriate for content that is genuinely non-deterministic, such as a rendered timestamp — using it more broadly hides real divergence.",
        similar: [
          { question: "Why is invalid nesting a mismatch?", answer: "The browser repairs invalid HTML while parsing the server output, so the resulting DOM differs from what React renders on the client." },
          { question: "How do you handle browser-only values?", answer: "Render a deterministic placeholder and set the real value in an Effect after mount." },
        ],
      },
    ],
    objectiveQuestions: [
      {
        question: "Which root callback fires when an Error Boundary renders its fallback?",
        options: ["onUncaughtError", "onCaughtError", "onRecoverableError", "componentDidCatch on the root"],
        correct: 1,
        shortAnswer: "onCaughtError",
        explanation: "onCaughtError is invoked when a boundary catches an error and renders a fallback — degraded but handled. onUncaughtError fires when nothing catches it and the tree unmounts, and onRecoverableError fires when React recovered on its own, most often after a hydration mismatch.",
      },
      {
        question: "Which error will an Error Boundary NOT catch?",
        options: ["An error thrown while rendering a child", "An error thrown inside an onClick handler", "An error thrown in a child's render during an update", "An error thrown by a component that reads a rejected promise with use"],
        correct: 1,
        shortAnswer: "An error thrown inside an event handler",
        explanation: "Boundaries catch errors thrown during rendering, in lifecycle methods and in constructors of their subtree. Event handlers run outside that rendering flow, so their errors must be caught with try/catch and put into state — or surfaced through an Action's error state.",
      },
      {
        question: "What does captureOwnerStack() provide that a JavaScript stack trace does not?",
        options: ["The list of functions on the call stack", "Which component rendered the failing component", "The network requests in flight", "The props of the failing component"],
            correct: 1,
        shortAnswer: "The component that rendered the failing one",
        explanation: "A call stack during rendering is mostly React internals, which rarely identifies the source of bad markup. The owner stack is the chain of components that rendered each other, so a message such as 'a div cannot appear inside a p' becomes attributable to a specific component. It is available in development builds only.",
      },
    ],
  },
];
