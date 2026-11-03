import { API_STATUSES, API_TYPES, type ApiPackage, type ApiEntry } from "./api-docs";
import type { ApiDetail } from "./api-docs-details";
import type { CodeLanguage } from "./code-highlight";
import type { GeneratedApiDetail } from "./pro-learn/types";
import type { LearningProject } from "./api-learning-schema";
import { annotateCode, normalizeCode } from "./annotate-code";

const glossary = [
  { word: "Deterministic", meaning: "Producing the same result for the same inputs and conditions.", sentence:"The team requested deterministic test fixtures so that a failing build could be reproduced.", synonyms: ["predictable", "repeatable"], antonyms: ["nondeterministic", "unpredictable"] },
  { word: "Idempotent", meaning: "Having the same final effect whether an operation runs once or repeatedly.", sentence:"We made the deployment step idempotent so that retrying it would not create duplicate resources.", synonyms: ["repeat-safe", "stable under repetition"], antonyms: ["non-idempotent", "cumulative"] },
  { word: "Encapsulation", meaning: "Keeping implementation details behind a clear public interface.", sentence:"Encapsulation lets our team change the implementation without requiring every consumer to change.", synonyms: ["information hiding", "containment"], antonyms: ["exposure", "unrestricted access"] },
  { word: "Trade-off", meaning: "A decision that gains one benefit while accepting a cost elsewhere.", sentence:"The design review documented the trade-off between lower latency and higher memory usage.", synonyms: ["compromise", "balancing decision"], antonyms: ["unqualified gain", "win-win"] },
];
export function authoredProject(pkg: ApiPackage, entry: ApiEntry, detail: ApiDetail): LearningProject | null {
  if (!detail.code) return null;
  const readme = `# ${entry.name} lab\n\n${detail.description}\n\n${detail.notes.map(note=>`- ${note}`).join("\n")}\n`;
  if (PYTHON_PACKAGES.has(pkg.id)) return pythonProject(pkg, entry, detail, readme);
  if (pkg.id === "react") {
    const component = detail.code.match(/export function (\w+)/)?.[1];
    if (!component) return null;
    return {title:`${entry.name} interactive example`,template:"react-ts",entry:"/App.tsx",dependencies:{react:"19.2.8","react-dom":"19.2.8"},files:[
      {path:"/App.tsx",code:`import { ${component} } from "./src/Example";\nimport "./styles.css";\nexport default function App() { return <main><h1>${entry.name}</h1><${component}/></main>; }`},
      {path:"/src/Example.tsx",code:detail.code},
      {path:"/styles.css",code:"body { font-family: system-ui; background:#faf9f5; color:#262624; padding:24px; } button,input { padding:10px 16px; margin:6px; border:1px solid #d1cfc5; border-radius:8px; background:white; } button { cursor:pointer; }"},
      {path:"/README.md",code:readme}],instructions:["Click Run, then interact with the component in Browser output.","Edit the example file to see how the API changes the UI."]};
  }
  if (pkg.id === 'zustand' && /\buseCount/.test(detail.code)) return {title:'Shared counter store',template:'react-ts',entry:'/App.tsx',dependencies:{zustand:'5.0.8'},files:[{path:'/src/store.ts',code:detail.code},{path:'/App.tsx',code:'import { useCounter } from "./src/store";\nfunction Count() { const count = useCounter(s => s.count); return <p>Count: {count}</p>; }\nexport default function App() { const add = useCounter(s => s.add); return <main><h1>Shared state</h1><Count/><Count/><button onClick={add}>Add one</button></main>; }'},{path:'/README.md',code:readme}],instructions:['Click Run, then Add one. Both subscribers update from the same store.']};
  if (pkg.id === 'nextjs' && /export function (\w+)/.test(detail.code)) return {title:'App Router navigation',template:'nextjs',entry:'/app/page.tsx',dependencies:{next:'16.3.4',react:'19.2.8','react-dom':'19.2.8'},files:[{path:'/package.json',code:JSON.stringify({scripts:{dev:'next dev',build:'next build',start:'next start'},dependencies:{next:'16.3.4',react:'19.2.8','react-dom':'19.2.8'},devDependencies:{typescript:'5.9.3','@types/react':'19.2.2','@types/node':'22.18.6'}})},{path:'/app/layout.tsx',code:'export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body style={{fontFamily:"system-ui",padding:24}}>{children}</body></html>;}'},{path:'/app/page.tsx',code:detail.code+'\nexport default '+(detail.code.match(/export function (\w+)/)?.[1] ?? 'BackToTopics')+';'},{path:'/app/dashboard/techy/page.tsx',code:'import Link from "next/link";\nexport default function Topics() {return <main><h1>Topics</h1><p>The router navigated to this page.</p><Link href="/">Back to the example</Link></main>;}'},{path:'/README.md',code:readme}],instructions:['Click Run to start the Next.js runtime. The first boot can take a minute.','Click Topics to navigate to the included destination page. Locally: npm install, then npm run dev.']};
  if (pkg.id === 'angular') {
    const example = entry.name === 'HttpClient' ? `import {Component, inject} from '@angular/core';\nimport {HttpClient} from '@angular/common/http';\n@Component({selector:'app-root',standalone:true,template:'<h1>HttpClient</h1><button (click)="load()">Load users</button><pre>{{result}}</pre>'})\nexport class AppComponent { private http=inject(HttpClient); result='Click Load users'; load(){ this.http.get('/api/users').subscribe({next:users=>this.result=JSON.stringify(users,null,2),error:()=>this.result='Request failed'}); } }` : `import {Component,signal,computed} from '@angular/core';\n@Component({selector:'app-root',standalone:true,template:'<h1>Signals</h1><button (click)="add()">Count: {{count()}}</button><p>Doubled: {{doubled()}}</p>'})\nexport class AppComponent { count=signal(0); doubled=computed(()=>this.count()*2); add(){this.count.update(n=>n+1);} }`;
    return {title:`${entry.name} Angular application`,template:'angular',entry:'/src/app/app.component.ts',dependencies:{'@angular/core':'19.2.0','@angular/common':'19.2.0','@angular/compiler':'19.2.0','@angular/platform-browser':'19.2.0','@angular/platform-browser-dynamic':'19.2.0',rxjs:'7.8.2','zone.js':'0.15.1'},files:[{path:'/src/app/app.component.ts',code:example},{path:'/src/main.ts',code:"import 'zone.js';\nimport '@angular/compiler';\nimport {bootstrapApplication} from '@angular/platform-browser';\nimport {provideHttpClient,withInterceptors,HttpResponse} from '@angular/common/http';\nimport {of} from 'rxjs';\nimport {users} from './data';\nimport {AppComponent} from './app/app.component';\nbootstrapApplication(AppComponent,{providers:[provideHttpClient(withInterceptors([request=>of(new HttpResponse({body:users,status:200}))]))]}).catch(console.error);"},{path:'/src/index.html',code:'<!doctype html><html><head><title>Angular API lab</title><base href="/"></head><body><app-root></app-root></body></html>'},{path:'/src/polyfills.ts',code:"import 'zone.js';"},{path:'/src/data.ts',code:'export const users = [{id:1,name:"Ada"},{id:2,name:"Lin"}];'},{path:'/README.md',code:readme}],instructions:['Click Run to build the complete Angular example.','The HTTP example uses a fixture interceptor with the included data.ts records; the signal example updates reactive state.']};
  }
  return scriptProject(pkg, entry, detail, readme);
}

/** Packages Pyodide ships (or that need nothing beyond it) whose examples print real results in the browser. */
const BROWSER_PYTHON = new Set(["python", "numpy", "pandas", "polars", "scipy", "sklearn", "pydantic"]);
/** Pure JavaScript packages that run in the browser bundler. Others need a server, a database or an account. */
const BROWSER_SCRIPT = new Set(["javascript", "jspuzzles", "typescript", "zod", "zustand", "redux", "tanstack", "conform", "graphql"]);
const PIP_NAME: Record<string, string> = { sklearn: "scikit-learn", PIL: "pillow", yaml: "pyyaml", bs4: "beautifulsoup4", cv2: "opencv-python" };
const PYTHON_STANDARD = /^(?:abc|argparse|array|ast|asyncio|base64|bisect|calendar|collections|contextlib|copy|csv|dataclasses|datetime|decimal|enum|fractions|functools|glob|hashlib|heapq|html|http|inspect|io|itertools|json|logging|math|operator|os|pathlib|pickle|queue|random|re|secrets|shutil|signal|sqlite3|statistics|string|struct|subprocess|sys|tempfile|textwrap|threading|time|timeit|traceback|types|typing|unittest|urllib|uuid|warnings|weakref|zipfile|__future__)$/;

function pythonRequirements(code: string) {
  const roots = [...code.matchAll(/^\s*(?:from|import)\s+([A-Za-z_]\w*)/gm)].map(match => match[1]);
  return [...new Set(roots)].filter(root => !PYTHON_STANDARD.test(root)).map(root => PIP_NAME[root] ?? root.replaceAll("_", "-"));
}

/** Full example, runner, requirements and notes. The example runs exactly as written, not wrapped in a function. */
function pythonProject(pkg: ApiPackage, entry: ApiEntry, detail: ApiDetail, readme: string): LearningProject {
  const code = normalizeCode(detail.code, "python");
  const requirements = pythonRequirements(code);
  const runs = BROWSER_PYTHON.has(pkg.id) && detail.language !== "bash" && !/\b(?:requests|httpx|urllib\.request|socket)\b/.test(code);
  return {
    title: `${entry.name} in practice`, template: runs ? "python" : "local", entry: "/main.py", dependencies: {},
    files: [
      { path: "/main.py", code: 'import runpy\n\n# Runs example.py as a script, so its prints appear in the console.\nrunpy.run_path("example.py", run_name="__main__")\n' },
      { path: "/example.py", code },
      { path: "/example_explained.py", code: annotateCode(code, "python") },
      { path: "/requirements.txt", code: requirements.length ? `${requirements.join("\n")}\n` : "# Standard library only\n" },
      { path: "/README.md", code: readme },
    ],
    instructions: runs
      ? ["Press Run: the code executes in an isolated browser worker and the console shows its real output.", "The first run downloads the Python runtime and packages, which can take up to a minute.", `To run it on your machine: ${requirements.length ? "pip install -r requirements.txt, then " : ""}python main.py`]
      : [`${pkg.name} needs a native runtime, a network or a server, so this example runs on your machine, not in the browser.`, `${requirements.length ? "pip install -r requirements.txt" : "No packages to install"}, then python main.py`],
  };
}

const CONSOLE_CAPTURE = `const output = document.querySelector("#output")!;
const show = (value: unknown) => typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? String(value);
for (const level of ["log", "info", "warn", "error"] as const) {
  const original = console[level].bind(console);
  console[level] = (...values: unknown[]) => { original(...values); output.textContent += values.map(show).join(" ") + "\\n"; };
}
window.addEventListener("error", event => { output.textContent += \`Error: \${event.message}\\n\`; });
window.addEventListener("unhandledrejection", event => { output.textContent += \`Error: \${event.reason}\\n\`; });
setTimeout(() => { if (!output.textContent) output.textContent = "Finished. This example prints nothing."; }, 1500);
`;

/** The npm packages a script imports, for the bundler and package.json. */
function scriptPackages(code: string) {
  const names = [...code.matchAll(/(?:\bfrom\s+|\bimport\s+|\brequire\()["']([^"'.\/][^"']*)["']/g)].map(match => match[1]);
  return [...new Set(names.filter(name => !name.startsWith("node:")).map(name => name.split("/").slice(0, name.startsWith("@") ? 2 : 1).join("/")))];
}

/** A TypeScript or JavaScript example as a complete project: runs in the browser where that is possible, else on the learner's machine. */
function scriptProject(pkg: ApiPackage, entry: ApiEntry, detail: ApiDetail, readme: string): LearningProject | null {
  const language = detail.language === "javascript" ? "javascript" : detail.language === "typescript" ? "typescript" : null;
  if (!language) {
    if (detail.language === "tsx" || detail.language === "jsx") {
      const extension = detail.language;
      return { title: `${entry.name} in practice`, template: "local", entry: `/src/example.${extension}`, dependencies: {}, files: [
        { path: `/src/example.${extension}`, code: normalizeCode(detail.code, detail.language) },
        { path: "/package.json", code: `${JSON.stringify({ name: "api-lab", private: true, dependencies: Object.fromEntries(scriptPackages(detail.code).map(name => [name, "latest"])) }, null, 2)}\n` },
        { path: "/README.md", code: readme },
      ], instructions: ["This component renders inside your own app, so it runs on your machine, not in this page.", "Install the packages in package.json, then import the component from a page of your project."] };
    }
    return null;
  }
  const code = normalizeCode(detail.code, language);
  const packages = scriptPackages(code);
  const dependencies = Object.fromEntries(packages.map(name => [name, "latest"]));
  const extension = language === "javascript" ? "js" : "ts";
  const browser = BROWSER_SCRIPT.has(pkg.id) && !/\bprocess\.|\bnode:|\brequire\(/.test(code) && !packages.includes("react");
  const shared = [
    { path: `/src/example.${extension}`, code },
    { path: `/src/example_explained.${extension}`, code: annotateCode(code, language) },
    { path: "/README.md", code: readme },
  ];
  if (browser) return {
    title: `${entry.name} in practice`, template: "vanilla-ts", entry: "/index.ts", dependencies,
    files: [
      { path: "/index.ts", code: 'import "./src/console";\nimport "./src/example";\n' },
      ...shared,
      { path: "/src/console.ts", code: CONSOLE_CAPTURE },
      { path: "/index.html", code: '<!doctype html><html><head><meta charset="utf-8"><title>Output</title><style>body{margin:0;background:#fff}pre{margin:0;padding:14px;font:13px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;color:#1d1d1f;white-space:pre-wrap}</style></head><body><pre id="output"></pre><script src="index.ts"></script></body></html>' },
    ],
    instructions: ["Press Run: the code builds in the browser and its real console output appears below.", "Edit src/example, press Save, and the output updates."],
  };
  // A Playwright example is a test file: its runner starts the browsers and provides `test` and `page`.
  if (pkg.id === "playwright") return {
    title: `${entry.name} in practice`, template: "local", entry: `/tests/example.spec.${extension}`, dependencies: {},
    files: [{ path: `/tests/example.spec.${extension}`, code }, { path: `/tests/example_explained.spec.${extension}`, code: annotateCode(code, language) }, { path: "/README.md", code: readme }],
    instructions: ["Playwright drives real browsers, so this test runs on your machine, not in this page.", "npm init playwright@latest, copy this file into tests/, then npx playwright test"],
  };
  return {
    title: `${entry.name} in practice`, template: "local", entry: `/src/example.${extension}`, dependencies,
    files: [...shared, { path: "/package.json", code: `${JSON.stringify({ name: "api-lab", private: true, type: "module", dependencies }, null, 2)}\n` }],
    instructions: [`${pkg.name} needs a server, a database or an account, so this example runs on your machine, not in the browser.`, `npm install, then npx tsx src/example.${extension}`],
  };
}

// Python-ecosystem packages render their examples as Python; everything else as TypeScript.
const PYTHON_PACKAGES = new Set(["python", "numpy", "pandas", "polars", "scipy", "sklearn", "tensorflow", "pytorch", "keras", "fastapi", "seaborn", "plotly", "requests", "httpx", "scrapy", "pydantic", "deepagents", "langchain", "langgraph", "integrations", "langsmith", "langflow"]);
export const apiCodeLanguage = (packageId: string): CodeLanguage => PYTHON_PACKAGES.has(packageId) ? "python" : "typescript";

/**
 * The reference every identifier can always show: only the facts the catalog
 * actually holds — package, kind, status, official docs and surrounding topics.
 * Hand-authored pages (API_DETAILS) and AI generation both take precedence, so
 * this is what keeps the learning sections on the page when neither is
 * available. It deliberately invents no signature, parameters or example.
 */
export function catalogApiDetail(pkg: ApiPackage, entry: ApiEntry): ApiDetail {
  const kind = (API_TYPES.find(type => type.k === entry.kind)?.label ?? "identifier").toLowerCase();
  const status = API_STATUSES.find(item => item.id === entry.status)?.label ?? "Reference entry";
  const topics = pkg.topics.slice(0, 4);
  return {
    packageName: pkg.name,
    description: `${entry.name} is a ${kind} in ${pkg.name}, the package covering ${pkg.description}.`,
    signature: "", parameters: [], returns: "",
    notes: [
      `Classified as a ${kind}: the badge beside the name uses the same identifier types across the whole reference.`,
      `Catalog status: ${status}. A status describes this catalog snapshot, so confirm it against the version installed in your project.`,
      `Official documentation for ${pkg.name}: ${pkg.docs}`,
      ...(topics.length ? [`Study it beside the concepts it belongs with: ${topics.join(", ")}.`] : []),
      "This summary states no signature, parameters or example, because the catalog does not hold them. Read the official page above, or prepare the full learning page, before relying on an exact API shape.",
    ],
    useCases: pkg.topics.slice(0, 5).map(topic => `${topic}: where ${entry.name} is likely to come up in ${pkg.name} work`),
    code: "", language: apiCodeLanguage(pkg.id), source: pkg.docs, related: [],
  };
}

/** Curated reference facts drive practice questions; no interview-frequency claims. */
export function enrichApiLearning(pkg: ApiPackage, entry: ApiEntry, base: ApiDetail | GeneratedApiDetail): GeneratedApiDetail {
  const detail = base as Partial<GeneratedApiDetail> & ApiDetail;
  const vocabulary = detail.vocabulary?.length ? detail.vocabulary : glossary.map(item=>({...item,examples:[]}));
  return {
    ...base, since: detail.since ?? "", descriptionLong: detail.descriptionLong ?? "", related: detail.related ?? [], vocabulary,
    project: detail.project ?? authoredProject(pkg,entry,base as ApiDetail),
    subjective: detail.subjective?.length ? detail.subjective : [
      {question:`What does ${entry.name} do, and when would you choose it?`,answer:`${detail.description} ${detail.useCases.length ? `Practical uses include ${detail.useCases.join(", ")}.` : "Explain its role in the package before choosing an implementation."}`,followUp:`How would you test ${entry.name}? Assert the expected result for a normal input and an edge case, then check: ${detail.notes[0]}`},
      {question:`What should you check when reviewing code that uses ${entry.name}?`,answer:detail.notes.join(" "),followUp:`Which behavior is easy to overlook? ${detail.notes.at(-1)} Write a regression test that makes this behavior explicit.`},
      {question:`How would you explain the result of ${entry.name} to a teammate?`,answer:detail.returns ? `${entry.name} returns ${detail.returns}` : detail.description,followUp:`When should you choose it? ${detail.useCases.join("; ")}. Compare its return value and lifecycle with a related API before switching.`},
    ],
    objective: detail.objective?.length ? detail.objective : [{question:`Which statement correctly describes ${entry.name}?`,options:[detail.description,"It automatically validates every business rule in an application.","It removes the need to handle failures and edge cases.","It always requires storing application state on a remote server."],answer:0,explanation:detail.notes[0] || detail.description}],
  };
}
