import type { TechnologyGuide } from "./index";
import { topicLesson } from "../guide-expansions";

/** Predict, run, explain, then change one condition. These are original exercises. */
export const puzzles = [
  {
    title: "Microtasks: predict the execution order",
    code: "console.log('start')\nPromise.resolve().then(() => console.log('promise'))\nqueueMicrotask(() => console.log('microtask'))\nconsole.log('end')",
    output: "start\nend\npromise\nmicrotask",
    concept: "Synchronous statements complete before queued promise reactions and microtasks run. Within this example, the promise callback is enqueued first and the queueMicrotask callback second. Trace the current job and microtask queue separately instead of reading the file as if every line completes immediately.",
    options: ["start, promise, microtask, end", "start, end, promise, microtask", "promise, microtask, start, end", "start, end, microtask, promise"], correct: 1,
    explanation: "The first and last console calls run in the current job. Both callbacks are queued, not executed inline. After that job finishes, the queued callbacks run in insertion order: promise then microtask. This example intentionally avoids Node-specific nextTick and timer phase ordering.",
    exercise: "Move queueMicrotask above Promise.resolve. Predict the new order before running it, then explain why start and end still appear before either callback.",
    mistake: "Do not equate a resolved promise with synchronous execution of its then callback.",
    source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model",
  },
  {
    title: "Closures: one binding or one per iteration?",
    code: "const shared = []\nconst separate = []\nfor (var i = 0; i < 3; i++) shared.push(() => i)\nfor (let j = 0; j < 3; j++) separate.push(() => j)\nconsole.log(shared.map(read => read()).join(','))\nconsole.log(separate.map(read => read()).join(','))",
    output: "3,3,3\n0,1,2",
    concept: "A closure retains access to bindings, rather than freezing every value at function creation. The var loop shares one binding that ends at 3. A let declaration in this loop creates a distinct binding for each iteration, so the later callbacks observe 0, 1 and 2.",
    options: ["0,1,2 then 0,1,2", "3,3,3 then 3,3,3", "3,3,3 then 0,1,2", "A ReferenceError"], correct: 2,
    explanation: "The callbacks execute only after both loops finish. Every shared callback reads the same i binding, whose final value is 3. The separate callbacks close over different j bindings. The lesson also explains why delayed event handlers can observe a changed variable.",
    exercise: "Keep var, but pass i to a makeReader(value) function that returns a callback. Predict why the resulting values differ from the original shared loop.",
    mistake: "A closure does not automatically take a snapshot of a mutable variable.",
    source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures",
  },
  {
    title: "Array.map passes more than a value",
    code: "const result = ['10', '10', '10'].map(parseInt)\nconsole.log(result.map(String).join(','))\nconsole.log(['10', '10', '10'].map(value => parseInt(value, 10)).join(','))",
    output: "10,NaN,2\n10,10,10",
    concept: "map calls its callback with value, index and array. parseInt interprets its second argument as a radix. Passing parseInt directly therefore gives it radices 0, 1 and 2. Adapting callback signatures explicitly prevents a reusable function from receiving unintended arguments.",
    options: ["10,NaN,2 then 10,10,10", "10,10,10 then 10,10,10", "10,1,2 then 10,10,10", "An exception before any output"], correct: 0,
    explanation: "Radix 0 infers decimal for the string 10, radix 1 is invalid and produces NaN, and binary 10 is decimal 2. The wrapper supplies radix 10 every time. NaN is a numeric value, not an exception, which is why mapping continues.",
    exercise: "Replace the direct callback with Number and predict the result. Then compare Number('10px') with parseInt('10px', 10) to choose the intended validation behavior.",
    mistake: "Do not assume callback consumers pass only the first argument your function expects.",
    source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map",
  },
  {
    title: "Defaults: zero is a valid value",
    code: "const settings = { retries: 0, label: '', timeout: null }\nconsole.log(settings.retries || 3)\nconsole.log(settings.retries ?? 3)\nconsole.log(JSON.stringify(settings.label ?? 'Untitled'))\nconsole.log(settings.timeout ?? 5000)",
    output: "3\n0\n\"\"\n5000",
    concept: "Logical OR falls back for every falsy value, including 0, false and an empty string. Nullish coalescing falls back only for null and undefined. A default should reflect the domain: zero retries may mean deliberately disabled retries, not missing configuration.",
    options: ["Both retry expressions produce 3", "Both retry expressions produce 0", "The label becomes Untitled", "OR produces 3; nullish coalescing preserves 0"], correct: 3,
    explanation: "The first expression replaces falsy 0 with 3. The second retains it because it is neither null nor undefined. The empty label is also retained, while null timeout receives 5000. Deciding whether an empty label is acceptable still requires domain validation.",
    exercise: "Test false, undefined and NaN with both operators. Decide whether NaN should be accepted for timeout and add a finite-number check if it should not.",
    mistake: "Nullish coalescing supplies a default; it does not validate type, range or business meaning.",
    source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing",
  },
  {
    title: "Spread copies one level",
    code: "const original = { name: 'Course', progress: { done: 1 } }\nconst copy = { ...original }\ncopy.name = 'Workshop'\ncopy.progress.done = 2\nconsole.log(original.name)\nconsole.log(original.progress.done)\nconsole.log(original.progress === copy.progress)",
    output: "Course\n2\ntrue",
    concept: "Object spread creates a new outer object and copies its own enumerable properties. A nested object remains the same referenced object. Updating the copied top-level name does not affect the original, but mutating the shared progress object does. Immutable updates must copy each changed path.",
    options: ["Workshop, 2, false", "Course, 2, true", "Course, 1, false", "Workshop, 1, true"], correct: 1,
    explanation: "The outer objects are distinct, while their progress properties point to one object. Assigning copy.name changes only the copy. Assigning copy.progress.done reaches the shared nested object. Use { ...original, progress: { ...original.progress, done: 2 } } when producing a new state value.",
    exercise: "Rewrite the update without changing original.progress.done. Verify both the old value and reference inequality at the outer and changed nested levels.",
    mistake: "Do not treat a shallow spread as a deep clone, especially when updating React or Zustand state.",
    source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax",
  },
  {
    title: "Promise.all preserves input order",
    code: "const first = new Promise(resolve => queueMicrotask(() => resolve('first')))\nconst second = Promise.resolve('second')\nPromise.all([first, second]).then(values => console.log(values.join(',')))",
    output: "first,second",
    concept: "Promise.all produces fulfillment values in input order, regardless of the order its inputs fulfill. It rejects when an input rejects, but this does not cancel work that has already started. Ordering, error aggregation and cancellation are separate design decisions.",
    options: ["second,first", "Only second", "first,second", "A random order on every run"], correct: 2,
    explanation: "The already-fulfilled second promise does not move to the front of the result. Promise.all records each value at its input position and fulfills after all inputs fulfill. If partial outcomes are useful, allSettled can collect them; cancellation must be implemented by the underlying operations.",
    exercise: "Make one input reject and attach catch. Then use Promise.allSettled and inspect each status. Explain why the other operation is not automatically aborted.",
    mistake: "Do not assume rejection cancels the other fetches or that completion order determines the result array.",
    source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all",
  },
];

const guide: TechnologyGuide = {
  id: "javascript-puzzles", technologyId: "javascript", topicId: "javascript-puzzles", level: "intermediate",
  curriculum: {
    title: "JavaScript Puzzles: predict, explain and debug", minutes: 90,
    objectives: ["Trace execution and closure bindings before running code.", "Explain callback arguments, defaults and shared references.", "Separate promise ordering, rejection and cancellation.", "Turn each prediction into a small regression check."],
    prerequisites: ["Read JavaScript functions, arrays and objects.", "Run snippets in a current browser console or Node.js."],
    lessons: puzzles.map(puzzle => topicLesson({ ...puzzle, example: "Predict the output below before running the snippet. Explain the relevant language rule, then change one input and test your prediction.", check: { question: "What does this snippet print, and which rule explains it?", options: puzzle.options, correct: puzzle.correct, shortAnswer: puzzle.output, explanation: puzzle.explanation } })),
    project: "Create a prediction notebook with six small programs. Record your predicted output, actual output, the rule involved and a changed-input experiment. Add assertions for the synchronous cases and await promise completion before checking asynchronous output.",
    summary: "Trace bindings, callback arguments, references and queues explicitly. A correct answer is useful only when you can explain the rule and predict a nearby variation. Use small executable examples to replace guesses with evidence.",
    glossary: [{ term: "Binding", definition: "The association between a name and its value in a scope; closures retain access to bindings." }, { term: "Microtask", definition: "A queued callback, such as a promise reaction, processed after the current job completes." }, { term: "Shallow copy", definition: "A new outer container that still shares references to nested objects." }],
    sources: [...new Set(puzzles.map(puzzle => puzzle.source))].map(url => ({ url, title: "MDN JavaScript reference", retrievedAt: "2026-09-12T00:00:00.000Z" })),
  },
};
export default guide;
