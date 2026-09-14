import type { Lesson } from "@/lib/domain";

type JavaScriptTopic = {
  category: string;
  title: string;
  points: string[];
  code: string;
  example: string;
  practice: string;
  question: string;
  answer: string;
  mistake: string;
};

// Authored JavaScript examples, shared by the saved file and notes course.
// File markers preserve JavaScript highlighting and multi-file boundaries.
export const JAVASCRIPT_TOPICS: JavaScriptTopic[] = [
  {
    category: "Modern ECMAScript Features", title: "Set methods: union, intersection, difference and symmetricDifference",
    points: ["union combines unique values; intersection keeps shared values; difference removes the other set's values; symmetricDifference keeps values present in exactly one set.", "These operations return new sets. Object members compare by identity, not by matching properties. Check method support in your target runtime."],
    code: `const enrolled = new Set(["Ada", "Lin"]);
const completed = new Set(["Lin", "Sam"]);
console.log([...enrolled.union(completed)]);
console.log([...enrolled.intersection(completed)]);
console.log([...enrolled.difference(completed)]);
console.log([...enrolled.symmetricDifference(completed)]);`,
    example: "The results contain Ada/Lin/Sam, Lin, Ada, and Ada/Sam respectively; the input sets remain unchanged.",
    practice: "Find users who have access to either of two courses and users who have access to only one.",
    question: "Does difference behave symmetrically?", answer: "No. A.difference(B) and B.difference(A) can contain entirely different members.",
    mistake: "Two separately created objects with equal fields are still distinct set members.",
  },
  {
    category: "Modern ECMAScript Features", title: "Array grouping with Object.groupBy and Map.groupBy",
    points: ["Both static methods group an iterable using a callback. Object.groupBy returns a null-prototype object with string or symbol keys.", "Map.groupBy retains arbitrary keys, including object identities. Groups contain references to the original elements."],
    code: `const owner = { name: "Ada" };
const lessons = [
  { title: "Scope", level: "core", owner },
  { title: "Promises", level: "async", owner },
];
const byLevel = Object.groupBy(lessons, lesson => lesson.level);
const byOwner = Map.groupBy(lessons, lesson => lesson.owner);
console.log(byLevel.core[0].title, byOwner.get(owner).length);`,
    example: "The output is Scope and 2. The owner object identifies a single Map group.",
    practice: "Group orders by status, then group them by a shared customer object.",
    question: "When should Map.groupBy replace Object.groupBy?", answer: "Use Map.groupBy when key identity or non-property keys matter, such as grouping by an object.",
    mistake: "Grouping does not deep-clone items; modifying a grouped object changes that same original object.",
  },
  {
    category: "Modern ECMAScript Features", title: "Change Array by Copy: toReversed, toSorted, toSpliced and with",
    points: ["These methods create arrays without mutating the original: reverse order, sort, splice a range or replace one index.", "Copies are shallow. Supply a numeric comparator when sorting numbers; with supports negative indices and rejects out-of-range indices."],
    code: `const scores = [30, 5, 12];
console.log(scores.toReversed()); // [12, 5, 30]
console.log(scores.toSorted((a, b) => a - b)); // [5, 12, 30]
console.log(scores.toSpliced(1, 1, 8)); // [30, 8, 12]
console.log(scores.with(-1, 20)); // [30, 5, 20]
console.log(scores); // [30, 5, 12]`,
    example: "A sorted display can use toSorted while preserving the source order for another view.",
    practice: "Replace one cart item immutably, also copying that item if its nested fields change.",
    question: "Does toSorted recursively copy objects?", answer: "No. The array is new, but nested objects are shared.",
    mistake: "Default sorting compares string representations, so numeric arrays usually need a comparator.",
  },
  {
    category: "Modern ECMAScript Features", title: "Optional chaining (?.) and nullish coalescing (??)",
    points: ["Optional chaining stops a continuous property, index or call chain when its base is null or undefined.", "Nullish coalescing supplies a fallback only for null and undefined, preserving false, zero and empty strings."],
    code: `const profile = { settings: { volume: 0 } };
const volume = profile.settings?.volume ?? 50;
const city = profile.address?.city ?? "Unknown";
const callbackResult = profile.onLoad?.();
console.log(volume, city, callbackResult); // 0, Unknown, undefined`,
    example: "A volume of zero remains muted instead of being replaced by the fallback of 50.",
    practice: "Read a nested optional list item with ?. and preserve an intentionally empty label with ??.",
    question: "Does ?. protect an undeclared variable?", answer: "No. The base variable must exist. It also does not make a present, non-callable property callable.",
    mistake: "Parenthesizing part of a chain can end its short-circuit protection. Parentheses are required when mixing ?? with || or &&.",
  },
  {
    category: "Modern ECMAScript Features", title: "Logical assignment operators: ||=, &&= and ??=",
    points: ["||= assigns when the old value is falsy; &&= assigns when it is truthy; ??= assigns only when it is nullish.", "The left-hand reference is evaluated once, and the right side is evaluated only if assignment is needed."],
    code: `const settings = { label: "", retries: 0, enabled: true };
settings.label ||= "Untitled";
settings.retries ??= 3;
settings.enabled &&= false;
console.log(settings); // { label: "Untitled", retries: 0, enabled: false }`,
    example: "Using ??= preserves a deliberate zero retry count; ||= would replace it.",
    practice: "Choose appropriate defaults for an empty display name, a zero timeout and a missing theme.",
    question: "Is the right-hand expression always evaluated?", answer: "No. Logical assignments short-circuit when no assignment is needed.",
    mistake: "Falsy and missing are different requirements; choose ||= or ??= accordingly.",
  },
  {
    category: "Modern ECMAScript Features", title: "Numeric separators and the BigInt primitive type",
    points: ["Numeric separators such as 1_000_000 improve literal readability without changing value.", "BigInt represents integers beyond Number's safe integer range. BigInt arithmetic cannot directly mix with Number arithmetic, and division truncates toward zero."],
    code: `const million = 1_000_000;
const id = 9_007_199_254_740_993n;
console.log(million, id + 2n, 7n / 2n); // 1000000, 9007199254740995n, 3n
const json = JSON.stringify({ id: id.toString() });
const restored = BigInt(JSON.parse(json).id);`,
    example: "Large identifiers can travel as JSON strings and be explicitly restored to BigInt.",
    practice: "Compare adjacent large integers represented as Number and BigInt.",
    question: "Can numeric separators appear in a JSON number?", answer: "No. They are JavaScript literal syntax, not JSON numeric syntax.",
    mistake: "JSON.stringify does not serialize BigInt by default; converting a large BigInt to Number may lose precision.",
  },
  {
    category: "Modern ECMAScript Features", title: "String replaceAll()",
    points: ["replaceAll replaces every occurrence and returns a new string. String patterns are literal; regular-expression patterns must use the global flag.", "Use a replacement callback when replacement text should not interpret special replacement sequences such as $&."],
    code: `const title = "js + js";
console.log(title.replaceAll("js", "JavaScript"));
console.log("a1 b2".replaceAll(/\\d/g, "#"));
const literalReplacement = "$&";
console.log(title.replaceAll("js", () => literalReplacement));`,
    example: "The first result is JavaScript + JavaScript; the final result is the literal text $& + $&.",
    practice: "Replace all literal dots in a filename without treating them as regex wildcards.",
    question: "What happens with a non-global RegExp?", answer: "replaceAll throws a TypeError when a supplied regular expression lacks the g flag.",
    mistake: "Constructing a RegExp from unescaped user input changes its meaning; use a string pattern for literal replacement.",
  },
  {
    category: "Core & Advanced Concepts", title: "Values, variables, equality, destructuring and control flow",
    points: ["let and const are block-scoped; const prevents rebinding, not object mutation. Primitives copy as values; object variables hold references.", "Use strict equality to avoid implicit coercion. Destructuring, rest and spread simplify extracting data; if, switch and loops express control flow."],
    code: `const lesson = { title: "Scope", tags: ["core"] };
const { title, minutes = 10 } = lesson;
const [first, ...remaining] = [title, "Promises", "Modules"];
for (const name of remaining) {
  if (name !== first) console.log(name);
}
console.log(0 === false, minutes); // false, 10`,
    example: "The loop prints Promises and Modules; a missing minutes property receives the default.",
    practice: "Destructure a function argument with defaults and handle each status using switch.",
    question: "Can a const array be pushed into?", answer: "Yes. const protects the variable binding; the referenced array remains mutable.",
    mistake: "Use for...of for iterable values; for...in walks enumerable property names, including inherited ones.",
  },
  {
    category: "Core & Advanced Concepts", title: "Closures and lexical scope",
    points: ["Lexical scope resolves names from where a function was defined. A closure retains access to those bindings after the outer call finishes.", "Closures capture bindings, not frozen snapshots. Separate factory calls create independent enclosed state."],
    code: `function counter(start = 0) {
  let value = start;
  return () => ++value;
}
const next = counter();
const other = counter(10);
console.log(next(), next(), other()); // 1, 2, 11`,
    example: "Each returned function updates the state of its own counter invocation.",
    practice: "Build a closure with increment and reset methods sharing one private binding.",
    question: "Why can an event callback retain memory?", answer: "A reachable callback keeps the outer bindings it needs reachable, which can retain large objects.",
    mistake: "A var loop shares one binding; let loop bindings avoid the classic delayed-callback index problem.",
  },
  {
    category: "Core & Advanced Concepts", title: "Execution context, call stack and hoisting",
    points: ["An execution context tracks the running function's bindings and environment. Calls push contexts; returning unwinds the stack.", "Function declarations are initialized before execution. var starts as undefined; let, const and class bindings remain in the temporal dead zone until initialized."],
    code: `console.log(double(3)); // 6: declaration initialized early
console.log(count); // undefined
var count = 2;
function double(value) { return value * 2; }
function outer() { return double(count); }
console.log(outer()); // 4
// Reading a let binding before its declaration throws ReferenceError.`,
    example: "outer calls double while its own context waits on the stack, then returns double's result.",
    practice: "Trace three nested calls and compare a function declaration with a const arrow function before initialization.",
    question: "Is a function expression assigned to var callable before assignment?", answer: "No. The variable initially contains undefined; only the later assignment supplies a function.",
    mistake: "Hoisting does not physically move source lines, and deep recursion can exceed the stack limit.",
  },
  {
    category: "Core & Advanced Concepts", title: "this binding: implicit, explicit, default and arrow functions",
    points: ["Ordinary-function this depends on how it is called: object method calls provide the receiver; call, apply and bind choose it explicitly.", "A plain strict-mode call has undefined this. Arrows inherit this lexically; new creates a new instance receiver for constructible functions."],
    code: `"use strict";
function read() { return this?.title ?? "No receiver"; }
const course = { title: "JavaScript", read,
  makeReader() { return () => this.title; } };
console.log(course.read()); // JavaScript
console.log(read()); // No receiver
console.log(read.call({ title: "Modules" })); // Modules
console.log(read.apply(course, [])); // JavaScript
console.log(read.bind(course)(), course.makeReader()());`,
    example: "The bound function and returned arrow both retain the course receiver when invoked separately.",
    practice: "Detach a method, observe the lost receiver and repair it with bind.",
    question: "Can call or bind replace an arrow function's this?", answer: "No. An arrow's this comes from its surrounding lexical context.",
    mistake: "In sloppy ordinary functions, default binding can use the global object; modules and class bodies are strict.",
  },
  {
    category: "Core & Advanced Concepts", title: "Strict mode (use strict)",
    points: ["A use strict directive changes classic-script or function semantics, exposing mistakes such as assigning undeclared variables.", "Modules and class bodies are automatically strict. Strict mode also rejects some invalid syntax and makes failed writes to non-writable properties throw."],
    code: `"use strict";
const settings = Object.freeze({ theme: "dark" });
try {
  settings.theme = "light";
} catch (error) {
  console.log(error instanceof TypeError); // true
}`, 
    example: "Attempting to change the frozen theme reports a TypeError instead of silently failing.",
    practice: "Compare an undeclared assignment in a strict function with an explicitly declared local variable.",
    question: "Do ES modules need an explicit use strict directive?", answer: "No. Module code is already strict.",
    mistake: "Strict mode is not a type checker, sandbox or deep immutability mechanism.",
  },
  {
    category: "Core & Advanced Concepts", title: "Prototypes and the prototype chain",
    points: ["Property lookup checks an object's own properties before following its prototype chain to null.", "Constructor.prototype supplies the prototype for constructed instances. Class methods also use prototype-based lookup."],
    code: `const base = { describe() { return "Course: " + this.title; } };
const course = Object.create(base);
course.title = "JavaScript";
console.log(course.describe());
console.log(Object.hasOwn(course, "describe")); // false
console.log(Object.getPrototypeOf(course) === base); // true`,
    example: "describe is inherited but receives course as this when called as course.describe().",
    practice: "Shadow an inherited property, then delete the own property and observe lookup falling back to the prototype.",
    question: "Are an instance's prototype and its constructor's prototype property the same concept?", answer: "The constructor's prototype property normally becomes the new instance's internal prototype link.",
    mistake: "Avoid mutating built-in prototypes; shared changes can affect unrelated code.",
  },
  {
    category: "Core & Advanced Concepts", title: "Garbage collection, WeakMap, WeakSet and symbols as weak keys",
    points: ["Garbage collection reclaims unreachable data at implementation-chosen times. Listeners, timers and caches can keep data reachable.", "WeakMap keys and WeakSet values can be objects or non-registered symbols. Symbol.for returns registered symbols, which cannot be weak keys. Weak collections are not enumerable."],
    code: `const metadata = new WeakMap();
const visited = new WeakSet();
let course = { title: "Memory" };
metadata.set(course, { opened: 1 });
visited.add(course);
const token = Symbol("private metadata");
metadata.set(token, { kind: "symbol key" });
console.log(visited.has(course), metadata.get(token).kind);
course = null; // does not force collection`,
    example: "The metadata entry does not by itself keep the course key alive after other references disappear.",
    practice: "Attach metadata to DOM elements using a WeakMap and remove listeners during component cleanup.",
    question: "Why is there no WeakMap key iterator?", answer: "Enumeration would expose garbage-collection timing and conflict with weak-key lifetime semantics.",
    mistake: "Weak collections do not guarantee immediate cleanup or replace explicitly closing resources.",
  },
  {
    category: "Asynchronous JavaScript", title: "The event loop, macrotasks and microtasks",
    points: ["Synchronous JavaScript runs on the current call stack. Browser tasks, often called macrotasks, include timer and input callbacks.", "Promise reactions and queueMicrotask callbacks run at microtask checkpoints before the next task. Rendering opportunities are scheduled by the browser, not guaranteed after every task."],
    code: `console.log("start");
setTimeout(() => console.log("timer"), 0);
Promise.resolve().then(() => console.log("promise"));
queueMicrotask(() => console.log("microtask"));
console.log("end");
// start, end, promise, microtask, timer`,
    example: "The timer runs after the current synchronous work and queued microtasks, even with a zero delay.",
    practice: "Queue another microtask inside a microtask and predict when it runs relative to the timer.",
    question: "Does setTimeout(fn, 0) run fn immediately?", answer: "No. It schedules a later task after the delay requirement and other scheduling constraints are satisfied.",
    mistake: "A continually replenished microtask queue can starve rendering and other tasks. Node has additional scheduling details.",
  },
  {
    category: "Asynchronous JavaScript", title: "Promises: states, chaining and error handling",
    points: ["A promise is pending, fulfilled or rejected; settlement is final. Its executor runs synchronously, while reaction handlers run asynchronously.", "then returns a new promise. Return values fulfill it, thrown errors reject it, and returned promises are adopted. catch handles rejection; finally performs cleanup."],
    code: `Promise.resolve("42")
  .then(text => Number(text))
  .then(value => {
    if (!Number.isFinite(value)) throw new Error("Invalid number");
    return value * 2;
  })
  .then(value => console.log(value)) // 84
  .catch(error => console.error(error.message))
  .finally(() => console.log("finished"));`,
    example: "Returning each result keeps conversion, validation, output and cleanup in one observable chain.",
    practice: "Reject one step and compare returning a fallback from catch with throwing a new error.",
    question: "Does catch always leave the chain rejected?", answer: "No. Returning a normal value recovers the chain; throwing or returning a rejected promise keeps it rejected.",
    mistake: "Forgetting to return an asynchronous operation creates a floating promise outside the chain's error handling.",
  },
  {
    category: "Asynchronous JavaScript", title: "Promise combinators: all, race, any and allSettled",
    points: ["all waits for every fulfillment and rejects on a rejection; race follows the first settlement.", "any takes the first fulfillment and rejects with AggregateError if all reject. allSettled waits for every outcome, preserving input order."],
    code: `const jobs = [Promise.resolve("primary"), Promise.reject(new Error("offline"))];
const outcomes = await Promise.allSettled(jobs);
console.log(outcomes.map(item => item.status)); // fulfilled, rejected
console.log(await Promise.any(jobs)); // primary
console.log(await Promise.all([Promise.resolve(1), Promise.resolve(2)]));
console.log(await Promise.race([Promise.resolve("first"), Promise.resolve("second")]));`,
    example: "Run this as an ES module. allSettled keeps the successful result and the failure reason for a partial-results screen.",
    practice: "Handle AggregateError from two rejected requests and inspect its errors array.",
    question: "Does Promise.any cancel losing operations?", answer: "No. Combinators observe outcomes; cancellation requires support from the underlying operations.",
    mistake: "race chooses the first rejection or fulfillment; any specifically waits for a fulfillment.",
  },
  {
    category: "Asynchronous JavaScript", title: "Async / await syntax and top-level await",
    points: ["An async function always returns a promise. await suspends that function's continuation without blocking the thread; rejected awaits can be caught with try/catch.", "Top-level await belongs in ES modules. Dependent module evaluation waits for it, so avoid unnecessary startup waterfalls."],
    code: `// example.mjs
async function total() {
  const [price, tax] = await Promise.all([
    Promise.resolve(20), Promise.resolve(4),
  ]);
  return price + tax;
}
try {
  console.log(await total()); // 24
} catch (error) {
  console.error(error);
}`, 
    example: "Independent operations start together in Promise.all; the final await reads their combined result.",
    practice: "Compare two sequential awaits with starting both independent operations before awaiting.",
    question: "Can you use top-level await in an ordinary classic script?", answer: "No. Use a module or an async function.",
    mistake: "forEach does not await async callbacks; use for...of for sequence or Promise.all for intended concurrency.",
  },
  {
    category: "Asynchronous JavaScript", title: "Generators, iterators and async iteration",
    points: ["An iterator returns { value, done } from next; an iterable provides Symbol.iterator. Generators implement both and suspend at yield.", "Async generators expose Symbol.asyncIterator and can await between values; for await...of consumes them."],
    code: `function* range(limit) {
  for (let value = 0; value < limit; value++) yield value;
}
console.log([...range(3)]); // [0, 1, 2]
async function* pages() {
  yield await Promise.resolve(["Scope"]);
  yield await Promise.resolve(["Promises"]);
}
for await (const page of pages()) console.log(page);`,
    example: "Use an ES module for the async loop. The generator yields one page at a time instead of building every page first.",
    practice: "Add finally cleanup to a generator and break out of its consuming loop early.",
    question: "Does calling a generator execute its body immediately?", answer: "No. It returns an iterator; execution starts when the iterator is advanced.",
    mistake: "Iterators are generally consumable state; reusing an exhausted iterator does not restart it.",
  },
  {
    category: "Asynchronous JavaScript", title: "Event emitters and event-driven programming",
    points: ["Event-driven code separates event producers from subscribed listeners. Node's EventEmitter invokes listeners synchronously in registration order.", "Use on, once and off to control listener lifetime. Browser EventTarget uses addEventListener and dispatchEvent instead."],
    code: `// example.mjs
import { EventEmitter } from "node:events";
const events = new EventEmitter();
const record = title => console.log("Saved", title);
events.on("saved", record);
events.once("saved", () => console.log("First save"));
events.emit("saved", "Scope");
events.off("saved", record);`,
    example: "Run in Node.js: Saved Scope is printed before First save, both during the emit call.",
    practice: "Add a second emit and verify a once listener runs only once. Clean up long-lived subscriptions.",
    question: "Does an emitter automatically await async listeners?", answer: "No. Explicitly design promise and error handling; ordinary emit does not await returned promises.",
    mistake: "An unhandled Node error event can throw and terminate the process; establish an error-handling policy.",
  },
  {
    category: "Asynchronous JavaScript", title: "AbortController: canceling async tasks",
    points: ["An AbortController exposes a signal that cooperating operations, including fetch, can observe. abort requests cancellation; it does not forcibly stop arbitrary JavaScript.", "Signals stay aborted. Create a new controller for a new operation and clear timeout resources in finally."],
    code: `// Browser module; /api/lessons must be supplied by the application.
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);
try {
  const response = await fetch("/api/lessons", { signal: controller.signal });
  if (!response.ok) throw new Error("HTTP " + response.status);
  console.log(await response.json());
} catch (error) {
  if (controller.signal.aborted) console.log("Request canceled");
  else console.error(error);
} finally {
  clearTimeout(timeout);
}`, 
    example: "A slow request is canceled after the timer fires; successful completion clears the timer.",
    practice: "Cancel a previous search request when a new query arrives and guard against stale results.",
    question: "Can an aborted controller be reset?", answer: "No. Use a fresh controller and signal for the next request.",
    mistake: "Canceling the client request does not guarantee that a server-side operation was rolled back.",
  },
  {
    category: "Object-Oriented & Functional Programming", title: "ES6 classes: private fields #, static blocks, getters and setters",
    points: ["Classes organize constructors and prototype methods. #private fields enforce private access in the language.", "Getters and setters expose property-like access. Static members belong to the class; static blocks perform class initialization once."],
    code: `class Course {
  #progress = 0;
  static defaults;
  static { this.defaults = Object.freeze({ progress: 0 }); }
  constructor(title) { this.title = title; }
  get progress() { return this.#progress; }
  set progress(value) {
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError("0 to 100 required");
    this.#progress = value;
  }
}
const course = new Course("JavaScript");
course.progress = 50;
console.log(course.progress, Course.defaults.progress); // 50, 0`,
    example: "The setter validates assignments while keeping the stored progress private.",
    practice: "Add a method that increments progress without exceeding 100.",
    question: "Can subclasses access a parent's #private field by name?", answer: "No. Private names are scoped to the declaring class body; expose intentional methods for subclass use.",
    mistake: "Calling a private-field method with the wrong receiver can fail its private-brand check.",
  },
  {
    category: "Object-Oriented & Functional Programming", title: "Inheritance and mixins",
    points: ["extends establishes subclass relationships; super calls inherited behavior. Derived constructors must call super before accessing this.", "A mixin can be a function returning a class that extends a supplied base. Prefer small capabilities and define how naming conflicts are handled."],
    code: `class Course {
  constructor(title) { this.title = title; }
  describe() { return this.title; }
}
const Timestamped = Base => class extends Base {
  createdAt = new Date();
};
class VideoCourse extends Timestamped(Course) {
  describe() { return "Video: " + super.describe(); }
}
console.log(new VideoCourse("JavaScript").describe());`,
    example: "VideoCourse inherits title, adds timestamp behavior through a mixin and overrides describe.",
    practice: "Compose a second small capability and document conflicting method names.",
    question: "Does JavaScript directly support multiple class inheritance?", answer: "No. Classes have one base; mixins and object composition combine additional behavior.",
    mistake: "Object.assign does not copy non-enumerable class prototype methods by default.",
  },
  {
    category: "Object-Oriented & Functional Programming", title: "Pure functions, immutability and higher-order functions: map, filter, reduce",
    points: ["Pure functions depend on their inputs and avoid observable side effects. Immutable updates make changed state explicit.", "Higher-order functions accept or return functions. map transforms values, filter selects them and reduce accumulates a result."],
    code: `const lessons = [{ title: "Scope", minutes: 10 }, { title: "Async", minutes: 20 }];
const shortTitles = lessons.filter(item => item.minutes <= 10).map(item => item.title);
const total = lessons.reduce((sum, item) => sum + item.minutes, 0);
const renamed = lessons.map(item => item.title === "Scope" ? { ...item, title: "Lexical scope" } : item);
console.log(shortTitles, total, lessons[0].title, renamed[0].title);`,
    example: "The total is 30 and the original Scope title remains unchanged after creating the renamed array.",
    practice: "Write a pure function that applies a discount to a cart without mutating any original item.",
    question: "Does using map guarantee purity?", answer: "No. The callback can still mutate objects or perform side effects; purity depends on its behavior.",
    mistake: "Supply an initial accumulator when empty input is valid; reduce without one throws on an empty array.",
  },
  {
    category: "Object-Oriented & Functional Programming", title: "Currying and function composition",
    points: ["Currying represents a multi-argument operation as a sequence of one-argument functions. Partial application pre-fills some arguments.", "Composition connects one function's output to another's input. A pipe helper commonly applies functions left to right."],
    code: `const multiply = factor => value => factor * value;
const pipe = (...steps) => input => steps.reduce((value, step) => step(value), input);
const normalize = pipe(text => text.trim(), text => text.toLowerCase());
console.log(multiply(3)(4)); // 12
console.log(normalize("  JAVASCRIPT  ")); // javascript`,
    example: "multiply(3) is a reusable function, while normalize combines two small text transformations.",
    practice: "Compose a validation and formatting pipeline with a clearly documented error strategy.",
    question: "Does this pipe automatically await async functions?", answer: "No. Async composition needs promise-aware chaining or an async loop.",
    mistake: "Keep each step's input/output contract compatible; composition alone does not validate those contracts.",
  },
  {
    category: "Object-Oriented & Functional Programming", title: "Deep vs. shallow copying and the Structured Clone API",
    points: ["Spread and Object.assign make shallow copies with shared nested references. structuredClone copies supported object graphs, including cycles, Map and Date.", "Structured cloning is a host API, not a general cloning of executable behavior. Functions and DOM nodes cannot be cloned; custom prototypes and property descriptors are not preserved as-is."],
    code: `const original = { settings: { theme: "dark" }, visited: new Set(["scope"]) };
const shallow = { ...original };
const deep = structuredClone(original);
shallow.settings.theme = "light";
deep.settings.theme = "contrast";
console.log(original.settings.theme, deep.settings.theme); // light, contrast
const buffer = new ArrayBuffer(8);
const moved = structuredClone(buffer, { transfer: [buffer] });
console.log(buffer.byteLength, moved.byteLength); // 0, 8`,
    example: "Changing the shallow copy affects the original nested object; changing the deep copy does not.",
    practice: "Clone a cyclic object and a Date, then compare the result with JSON round-tripping.",
    question: "What does transferring an ArrayBuffer do?", answer: "It transfers ownership of its storage to the result and detaches the original buffer.",
    mistake: "JSON serialization is not a universal deep clone and cannot handle cycles or BigInt by default.",
  },
  {
    category: "DOM & Browser APIs", title: "Shadow DOM and Web Components",
    points: ["Custom elements define reusable browser elements with lifecycle callbacks. Shadow DOM creates a separate subtree with style encapsulation.", "Use connectedCallback and disconnectedCallback for setup and cleanup. Events that cross a shadow boundary may be retargeted; composed controls boundary crossing."],
    code: `// Browser: load once as a module.
class CourseBadge extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const label = document.createElement("span");
    label.textContent = "JavaScript course";
    root.append(label);
  }
  connectedCallback() { this.setAttribute("role", "note"); }
}
customElements.define("course-badge", CourseBadge);
document.body.append(document.createElement("course-badge"));`,
    example: "The page receives a course-badge element whose label lives inside its shadow root.",
    practice: "Add an observed title attribute and update the label in attributeChangedCallback.",
    question: "Is a closed shadow root a security boundary?", answer: "No. Shadow DOM provides encapsulation, not a trustworthy security sandbox.",
    mistake: "Register a custom-element name only once and use a hyphen in its name.",
  },
  {
    category: "DOM & Browser APIs", title: "Event bubbling, capturing and delegation",
    points: ["Events traverse capture, target and, when enabled, bubble phases. event.target identifies the originating or retargeted element; currentTarget is the active listener's element.", "Delegation handles descendants from a shared ancestor. preventDefault cancels a cancelable default action; stopPropagation affects traversal, not the default action."],
    code: `// Browser: create a small delegated button list.
const list = document.createElement("div");
const button = document.createElement("button");
button.dataset.lesson = "scope";
button.textContent = "Open Scope";
list.append(button);
document.body.append(list);
const controller = new AbortController();
list.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;
  const target = event.target.closest("button[data-lesson]");
  if (target && list.contains(target)) console.log(target.dataset.lesson);
}, { signal: controller.signal });
// Teardown: controller.abort(); list.remove();`,
    example: "Clicking the button is handled by the parent listener; newly added descendant buttons can use the same handler.",
    practice: "Add a capture listener using { capture: true } and log phase ordering.",
    question: "Does stopPropagation prevent a link from navigating?", answer: "No. Use preventDefault when cancellation of that default action is intended and permitted.",
    mistake: "Not all events bubble, and passive listeners cannot prevent default actions.",
  },
  {
    category: "DOM & Browser APIs", title: "Intersection Observer API",
    points: ["IntersectionObserver asynchronously reports threshold crossings between targets and a root viewport or element.", "Use rootMargin for early loading and threshold for required intersection ratios. Disconnect or unobserve targets when tracking is no longer needed."],
    code: `// Browser: observes this demonstration target entering the viewport.
const target = document.createElement("section");
target.textContent = "Recommended lesson";
document.body.append(target);
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      console.log("Load related content");
      observer.unobserve(entry.target);
    }
  }
}, { rootMargin: "100px", threshold: 0 });
observer.observe(target);
// Teardown: observer.disconnect(); target.remove();`,
    example: "The positive margin lets the callback request content before the target reaches the visible viewport.",
    practice: "Track when half of a card intersects by setting threshold to 0.5.",
    question: "Does intersection prove the user actually saw the target?", answer: "No. Geometric intersection alone is not proof of attention or unobscured visibility.",
    mistake: "IntersectionObserver is asynchronous and is not a pixel-by-pixel scroll event replacement.",
  },
  {
    category: "DOM & Browser APIs", title: "Mutation Observer API",
    points: ["MutationObserver watches configured DOM changes such as child lists, attributes and character data.", "Callbacks receive batches of mutation records. Restrict observation to relevant nodes and attributes; disconnect during teardown."],
    code: `// Browser example.
const panel = document.createElement("div");
document.body.append(panel);
const observer = new MutationObserver(records => {
  console.log(records.map(record => record.type));
});
observer.observe(panel, { childList: true, attributes: true, attributeFilter: ["data-state"] });
panel.append(document.createElement("p"));
panel.dataset.state = "ready";
// Teardown after observing: observer.disconnect(); panel.remove();`,
    example: "The observer reports the appended child and changed data-state attribute in mutation records.",
    practice: "Watch a third-party widget's child changes without observing the entire document.",
    question: "Does MutationObserver observe arbitrary JavaScript object changes?", answer: "No. It observes selected DOM mutations, not generic application state.",
    mistake: "Mutating observed properties from the callback can trigger repeated notifications or a feedback loop.",
  },
  {
    category: "DOM & Browser APIs", title: "Storage APIs: localStorage, sessionStorage and cookies",
    points: ["localStorage persists origin-scoped string data; sessionStorage is scoped to an origin and tab session. Both are synchronous and may fail due to policy or quota.", "Cookies participate in matching HTTP requests and have path, domain, expiry and security attributes. HttpOnly cookies must be set by the server and are not readable by JavaScript."],
    code: `// Browser: store a non-sensitive reading preference.
try {
  localStorage.setItem("reader-theme", "dark");
  sessionStorage.setItem("reader-draft", "Scope notes");
  console.log(localStorage.getItem("reader-theme"));
} catch (error) {
  console.error("Preferences could not be stored", error);
}
// On HTTPS, a non-sensitive preference cookie:
document.cookie = "readerTheme=dark; Path=/; Max-Age=86400; SameSite=Lax; Secure";`,
    example: "The theme can survive reloads and later sessions, while the draft belongs to the tab session.",
    practice: "Add safe JSON parsing with a fallback for a malformed saved preference.",
    question: "Can document.cookie create an HttpOnly cookie?", answer: "No. HttpOnly is set in a server Set-Cookie response header.",
    mistake: "Web Storage is accessible to page scripts; do not treat its values as trusted authorization evidence.",
  },
  {
    category: "DOM & Browser APIs", title: "IndexedDB: asynchronous structured storage",
    points: ["IndexedDB stores structured records in object stores with keys, indexes and transactions. Schema changes occur in version upgrades.", "Requests are asynchronous; a successful request does not mean its transaction has committed. Handle blocked upgrades, transaction errors and database closure."],
    code: `// Browser: create a local notes database.
const request = indexedDB.open("javascript-course", 1);
request.onupgradeneeded = () => {
  request.result.createObjectStore("notes", { keyPath: "id" });
};
request.onerror = () => console.error(request.error);
request.onblocked = () => console.log("Close other database tabs to upgrade");
request.onsuccess = () => {
  const db = request.result;
  db.onversionchange = () => db.close();
  const tx = db.transaction("notes", "readwrite");
  tx.objectStore("notes").put({ id: "scope", text: "Lexical bindings" });
  tx.oncomplete = () => { console.log("Committed"); db.close(); };
  tx.onabort = () => { console.error(tx.error); db.close(); };
};`,
    example: "The note is reported saved only after the readwrite transaction commits.",
    practice: "Read the note with a readonly transaction and add an index in a later schema version.",
    question: "When can you create an object store?", answer: "Inside a version-change transaction, normally in the open request's upgradeneeded handler.",
    mistake: "Awaiting unrelated asynchronous work can let a transaction become inactive before the next database request.",
  },
  {
    category: "DOM & Browser APIs", title: "Web Workers: background computation and messaging",
    points: ["Dedicated workers run JavaScript off the page's main thread and communicate using messages.", "Workers cannot directly access the DOM. Messages use structured cloning, with transferable objects available to move ownership efficiently."],
    code: `// main.js
// Browser module; serve both files from the application.
const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
worker.onmessage = event => { console.log(event.data); worker.terminate(); };
worker.onerror = event => { console.error(event.message); worker.terminate(); };
worker.postMessage([2, 3, 5]);
// worker.js
self.onmessage = event => {
  const total = event.data.reduce((sum, value) => sum + value, 0);
  self.postMessage(total);
};`,
    example: "The worker computes 10 and returns it to the main page without accessing document.",
    practice: "Move a large CPU-bound transformation into a worker and measure main-thread responsiveness.",
    question: "Does a worker share ordinary objects with the page?", answer: "No. Normal messages clone data; explicit transfer or shared-memory APIs have different ownership rules.",
    mistake: "Worker startup and serialization cost can outweigh benefits for tiny tasks; terminate unused workers.",
  },
  {
    category: "DOM & Browser APIs", title: "Service Workers: lifecycle, offline caching and fetch events",
    points: ["A service worker handles events such as install, activate and fetch for its scope. It requires a secure context, with localhost allowed for development.", "The browser can stop and restart it; persist durable state outside globals. Version caches and cache only responses suitable for offline reuse."],
    code: `// main.js
// Serve on HTTPS or localhost; offline.html is an application-provided static page.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(console.error);
}
// sw.js
const CACHE = "js-course-static-v1";
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add("/offline.html")));
});
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(async () =>
      (await caches.match("/offline.html")) ?? Response.error()));
  }
});`,
    example: "Once the worker controls the page, an offline navigation can receive the cached static fallback.",
    practice: "Add activate-time removal of old caches with your application's cache-name prefix.",
    question: "Does registering a worker immediately control the current page?", answer: "Not necessarily. Installation, activation and client control have separate lifecycle steps.",
    mistake: "Do not indiscriminately cache authenticated responses or rely on service-worker globals surviving between events.",
  },
  {
    category: "DOM & Browser APIs", title: "Fetch API and streams",
    points: ["fetch returns a Response even for HTTP error statuses; inspect ok or status. Reading json or text consumes the response body.", "ReadableStream supports incremental consumption and backpressure. Decode byte chunks with TextDecoderStream and release reader locks during cleanup."],
    code: `// Browser module; the application supplies /api/notes-text.
const response = await fetch("/api/notes-text");
if (!response.ok) throw new Error("HTTP " + response.status);
if (!response.body) throw new Error("No response body");
const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
try {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    console.log(value);
  }
} finally {
  reader.releaseLock();
}`, 
    example: "Text arrives incrementally; the reader does not wait for the complete body before processing the first chunk.",
    practice: "Parse newline-delimited JSON with a buffer for records split across chunks. Cancel the reader if stopping early.",
    question: "Does a 404 response automatically reject fetch?", answer: "No. HTTP failures normally fulfill fetch with a Response; network failures and cancellation can reject it.",
    mistake: "Network chunks are not guaranteed to align with characters, lines or JSON records; do not parse each chunk independently.",
  },
  {
    category: "Modules & Ecosystem", title: "ES Modules vs CommonJS and dynamic import()",
    points: ["ES Modules use import/export with live bindings and strict semantics. CommonJS uses require/module.exports and is a Node module system.", "Dynamic import() returns a promise for a module namespace and works for conditional loading. File extensions and package type settings determine Node's module interpretation."],
    code: `// math.mjs
export const double = value => value * 2;
// main.mjs
import { double } from "./math.mjs";
console.log(double(3));
const math = await import("./math.mjs");
console.log(math.double(4));
// math.cjs
module.exports = { double: value => value * 2 };
// main.cjs
const { double } = require("./math.cjs");
console.log(double(5));`,
    example: "Save the labeled files and run the .mjs or .cjs entry in Node. The module entry prints 6 and 8; CommonJS prints 10.",
    practice: "Lazy-load an optional feature with import() and handle a failed module download.",
    question: "Is dynamic import the same as a static import declaration?", answer: "No. It is an asynchronous expression usable conditionally; static imports establish dependencies before module evaluation.",
    mistake: "Do not assume ESM/CommonJS interop behaves identically in every runtime or bundler, especially around top-level await.",
  },
  {
    category: "Modules & Ecosystem", title: "Tree shaking compatibility",
    points: ["Tree shaking lets bundlers remove code proven unused. Static ES Module imports and exports support this analysis.", "Top-level side effects must remain observable. Package sideEffects metadata describes safe file elimination; CSS and initialization modules may need explicit exceptions."],
    code: `// utilities.js
export const double = value => value * 2;
export const triple = value => value * 3;
// main.js
import { double } from "./utilities.js";
console.log(double(5));
// package.json
{
  "type": "module",
  "sideEffects": ["**/*.css", "./register.js"]
}`, 
    example: "A production bundler may remove unused triple, while declared CSS and registration side effects remain protected.",
    practice: "Compare production bundle output before and after removing an unused import.",
    question: "Does ESM guarantee unused code disappears?", answer: "No. Elimination depends on bundler analysis, configuration and observable side effects.",
    mistake: "Incorrect sideEffects: false metadata can remove required CSS or initialization code.",
  },
  {
    category: "Modules & Ecosystem", title: "JSON modules and import attributes",
    points: ["Import attributes describe how a module should be loaded. JSON modules use with { type: 'json' } and expose a default export.", "Dynamic import accepts attributes in its options object. Confirm runtime support and, in browsers, correct JSON content types from the server."],
    code: `// settings.json
{ "title": "JavaScript ES2026", "theme": "dark" }
// main.mjs
import settings from "./settings.json" with { type: "json" };
const { default: loaded } = await import("./settings.json", { with: { type: "json" } });
console.log(settings.title, loaded.theme);`,
    example: "The default JSON object provides the title and theme; use a runtime that supports import attributes.",
    practice: "Load a local JSON configuration from both static and dynamic imports.",
    question: "Do JSON properties become named exports?", answer: "No. Read properties from the JSON module's default export.",
    mistake: "The older assert syntax is not interchangeable with current with syntax across runtimes. JSON still disallows comments and trailing commas.",
  },
];

export const JAVASCRIPT_FUNDAMENTAL_LESSONS: Lesson[] = JAVASCRIPT_TOPICS.map(topic => ({
  title: topic.title,
  explanation: topic.points.map(point => `- ${point}`).join("\n"),
  example: topic.example,
  code: /^\/\/ [\w-]+\.(?:m?js|cjs|json)\n/.test(topic.code) ? topic.code : `// example.js\n${topic.code}`,
  exercise: topic.practice,
  checkpoint: topic.question,
  mistake: topic.mistake,
  interview: [{ question: topic.question, definition: topic.points[0], answer: topic.answer, similar: [] }],
}));
