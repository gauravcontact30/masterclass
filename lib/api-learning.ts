import { API_STATUSES, API_TYPES, type ApiPackage, type ApiEntry } from "./api-docs";
import type { ApiDetail } from "./api-docs-details";
import type { CodeLanguage } from "./code-highlight";
import type { GeneratedApiDetail } from "./pro-learn/types";
import type { LearningProject } from "./api-learning-schema";

const glossary = [
  { word: "Deterministic", meaning: "Producing the same result for the same inputs and conditions.", sentence:"The team requested deterministic test fixtures so that a failing build could be reproduced.", synonyms: ["predictable", "repeatable"], antonyms: ["nondeterministic", "unpredictable"] },
  { word: "Idempotent", meaning: "Having the same final effect whether an operation runs once or repeatedly.", sentence:"We made the deployment step idempotent so that retrying it would not create duplicate resources.", synonyms: ["repeat-safe", "stable under repetition"], antonyms: ["non-idempotent", "cumulative"] },
  { word: "Encapsulation", meaning: "Keeping implementation details behind a clear public interface.", sentence:"Encapsulation lets our team change the implementation without requiring every consumer to change.", synonyms: ["information hiding", "containment"], antonyms: ["exposure", "unrestricted access"] },
  { word: "Trade-off", meaning: "A decision that gains one benefit while accepting a cost elsewhere.", sentence:"The design review documented the trade-off between lower latency and higher memory usage.", synonyms: ["compromise", "balancing decision"], antonyms: ["unqualified gain", "win-win"] },
];
export function authoredProject(pkg: ApiPackage, entry: ApiEntry, detail: ApiDetail): LearningProject | null {
  if (!detail.code) return null;
  const readme = `# ${entry.name} lab\n\n${detail.description}\n\n${detail.notes.map(note=>`- ${note}`).join("\n")}\n`;
  if (pkg.id === "python" || PYTHON_PACKAGES.has(pkg.id)) return { title: `${entry.name} in practice`, template:"python", entry:"/main.py", dependencies:{}, files:[{path:"/main.py",code:"from example import run_example\n\nif __name__ == '__main__':\n    run_example()\n"},{path:"/example.py",code:`def run_example():\n${detail.code.split("\n").map(line=>"    "+line).join("\n")}\n`},{path:"/README.md",code:readme}], instructions:["Click Run to execute Python in an isolated browser worker.","To run locally, save all project files and run python main.py."] };
  if (pkg.id === "javascript") return { title:`${entry.name} data transformation`,template:"vanilla-ts",entry:"/index.ts",dependencies:{},files:[
    {path:"/index.ts",code:'import { runExample } from "./src/example";\nconst output = document.querySelector("#output")!;\nconst original = console.log;\nconsole.log = (...values) => { original(...values); output.textContent += values.map(value => typeof value === "string" ? value : JSON.stringify(value)).join(" ") + "\\n"; };\nrunExample();'},
    {path:"/src/example.ts",code:`export function runExample() {\n${detail.code}\n}\n`},
    {path:"/index.html",code:'<!doctype html><html><head><title>API lab</title></head><body><h1>Live output</h1><pre id="output"></pre><script src="index.ts"></script></body></html>'},
    {path:"/README.md",code:readme}],instructions:["Click Run. The browser preview and console show the actual result.","Edit src/example.ts and run again to experiment."] };
  if (pkg.id === "react") {
    const component = detail.code.match(/export function (\w+)/)?.[1];
    if (!component) return null;
    return {title:`${entry.name} interactive example`,template:"react-ts",entry:"/App.tsx",dependencies:{react:"19.2.8","react-dom":"19.2.8"},files:[
      {path:"/App.tsx",code:`import { ${component} } from "./src/Example";\nimport "./styles.css";\nexport default function App() { return <main><h1>${entry.name}</h1><${component}/></main>; }`},
      {path:"/src/Example.tsx",code:detail.code},
      {path:"/styles.css",code:"body { font-family: system-ui; background:#faf9f5; color:#262624; padding:24px; } button,input { padding:10px 16px; margin:6px; border:1px solid #d1cfc5; border-radius:8px; background:white; } button { cursor:pointer; }"},
      {path:"/README.md",code:readme}],instructions:["Click Run, then interact with the component in Browser output.","Edit the example file to see how the API changes the UI."]};
  }
  if (pkg.id === 'zustand') return {title:'Shared counter store',template:'react-ts',entry:'/App.tsx',dependencies:{zustand:'5.0.8'},files:[{path:'/src/store.ts',code:detail.code},{path:'/App.tsx',code:'import { useCounter } from "./src/store";\nfunction Count() { const count = useCounter(s => s.count); return <p>Count: {count}</p>; }\nexport default function App() { const add = useCounter(s => s.add); return <main><h1>Shared state</h1><Count/><Count/><button onClick={add}>Add one</button></main>; }'},{path:'/README.md',code:readme}],instructions:['Click Run, then Add one. Both subscribers update from the same store.']};
  if (pkg.id === 'nextjs' && /export function (\w+)/.test(detail.code)) return {title:'App Router navigation',template:'nextjs',entry:'/app/page.tsx',dependencies:{next:'16.3.4',react:'19.2.8','react-dom':'19.2.8'},files:[{path:'/package.json',code:JSON.stringify({scripts:{dev:'next dev',build:'next build',start:'next start'},dependencies:{next:'16.3.4',react:'19.2.8','react-dom':'19.2.8'},devDependencies:{typescript:'5.9.3','@types/react':'19.2.2','@types/node':'22.18.6'}})},{path:'/app/layout.tsx',code:'export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body style={{fontFamily:"system-ui",padding:24}}>{children}</body></html>;}'},{path:'/app/page.tsx',code:detail.code+'\nexport default '+(detail.code.match(/export function (\w+)/)?.[1] ?? 'BackToTopics')+';'},{path:'/app/dashboard/techy/page.tsx',code:'import Link from "next/link";\nexport default function Topics() {return <main><h1>Topics</h1><p>The router navigated to this page.</p><Link href="/">Back to the example</Link></main>;}'},{path:'/README.md',code:readme}],instructions:['Click Run to start the Next.js runtime. The first boot can take a minute.','Click Topics to navigate to the included destination page. Locally: npm install, then npm run dev.']};
  if (pkg.id === 'angular') {
    const example = entry.name === 'HttpClient' ? `import {Component, inject} from '@angular/core';\nimport {HttpClient} from '@angular/common/http';\n@Component({selector:'app-root',standalone:true,template:'<h1>HttpClient</h1><button (click)="load()">Load users</button><pre>{{result}}</pre>'})\nexport class AppComponent { private http=inject(HttpClient); result='Click Load users'; load(){ this.http.get('/api/users').subscribe({next:users=>this.result=JSON.stringify(users,null,2),error:()=>this.result='Request failed'}); } }` : `import {Component,signal,computed} from '@angular/core';\n@Component({selector:'app-root',standalone:true,template:'<h1>Signals</h1><button (click)="add()">Count: {{count()}}</button><p>Doubled: {{doubled()}}</p>'})\nexport class AppComponent { count=signal(0); doubled=computed(()=>this.count()*2); add(){this.count.update(n=>n+1);} }`;
    return {title:`${entry.name} Angular application`,template:'angular',entry:'/src/app/app.component.ts',dependencies:{'@angular/core':'19.2.0','@angular/common':'19.2.0','@angular/compiler':'19.2.0','@angular/platform-browser':'19.2.0','@angular/platform-browser-dynamic':'19.2.0',rxjs:'7.8.2','zone.js':'0.15.1'},files:[{path:'/src/app/app.component.ts',code:example},{path:'/src/main.ts',code:"import 'zone.js';\nimport '@angular/compiler';\nimport {bootstrapApplication} from '@angular/platform-browser';\nimport {provideHttpClient,withInterceptors,HttpResponse} from '@angular/common/http';\nimport {of} from 'rxjs';\nimport {users} from './data';\nimport {AppComponent} from './app/app.component';\nbootstrapApplication(AppComponent,{providers:[provideHttpClient(withInterceptors([request=>of(new HttpResponse({body:users,status:200}))]))]}).catch(console.error);"},{path:'/src/index.html',code:'<!doctype html><html><head><title>Angular API lab</title><base href="/"></head><body><app-root></app-root></body></html>'},{path:'/src/polyfills.ts',code:"import 'zone.js';"},{path:'/src/data.ts',code:'export const users = [{id:1,name:"Ada"},{id:2,name:"Lin"}];'},{path:'/README.md',code:readme}],instructions:['Click Run to build the complete Angular example.','The HTTP example uses a fixture interceptor with the included data.ts records; the signal example updates reactive state.']};
  }
  return null;
}

// Python-ecosystem packages render their examples as Python; everything else as TypeScript.
const PYTHON_PACKAGES = new Set(["python", "numpy", "pandas", "polars", "scipy", "sklearn", "tensorflow", "pytorch", "keras", "fastapi", "seaborn", "plotly", "requests", "httpx", "scrapy", "pydantic", "deepagents", "langchain", "langgraph", "integrations", "langsmith"]);
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
