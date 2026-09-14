import type { Lesson } from "@/lib/domain";

type Topic = {
  category: string;
  title: string;
  points: string[];
  code: string;
  practice: string;
  question: string;
  answer: string;
  mistake: string;
};

// Shared by the saved Learn in App guide and the notes course directory.
export const TYPESCRIPT_TOPICS: Topic[] = [
  {
    category: "Core Types & System", title: "Type annotations and type inference",
    points: ["Type annotations state a variable, parameter or return type after a colon. Inference derives types from initializers, return expressions and contextual callback signatures.", "Annotate public boundaries; let straightforward local expressions infer. A const primitive can retain a literal type while a mutable let usually widens."],
    code: `let attempts: number = 0;
const course = "TypeScript 7"; // literal type
function total(price: number, quantity: number): number {
  return price * quantity;
}
const totals = [10, 20].map(price => total(price, 2)); // number[]`,
    practice: "Remove total's return annotation and inspect the inferred type. Then try passing a string as quantity.",
    question: "Does omitting an annotation always produce any?", answer: "No. Initializers and contextual types frequently provide enough information for inference.",
    mistake: "An annotation checks an expression; it does not convert a string into a number.",
  },
  {
    category: "Core Types & System", title: "Primitives: string, number, boolean, symbol, null, undefined and bigint",
    points: ["Use lowercase primitive type names. number covers JavaScript numeric values; bigint represents arbitrary-size integers and needs a compatible target such as ES2020.", "symbol provides unique identities. null and undefined express absence and require explicit handling with strictNullChecks."],
    code: `const name: string = "Ada";
const score: number = 9.5;
const active: boolean = true;
const key: symbol = Symbol("lesson");
const large: bigint = 9007199254740993n;
let selected: string | null = null;
let optional: number | undefined = undefined;
console.log(name, score, active, key, large, selected, optional);`,
    practice: "Model an optional completion timestamp and handle its missing state before formatting it.",
    question: "Can number and bigint be added directly?", answer: "No. Choose a numeric representation and convert explicitly when the conversion is safe.",
    mistake: "Avoid wrapper types such as String and Number in ordinary data models.",
  },
  {
    category: "Core Types & System", title: "Special types: any, unknown, never and void",
    points: ["any bypasses checking; unknown requires evidence before use. Prefer unknown for untrusted inputs.", "void marks an ignored return value. never describes an impossible value or a function that cannot return normally."],
    code: `function describe(value: unknown): string {
  return typeof value === "string" ? value.toUpperCase() : "Not text";
}
function notify(message: string): void { console.log(message); }
function fail(message: string): never { throw new Error(message); }
function exhaustive(value: never): never { return fail(String(value)); }
const ignoredResult: () => void = () => 42; // caller ignores the result`,
    practice: "Replace an any input with unknown and add checks before reading properties.",
    question: "How do void and never differ?", answer: "A void function may finish normally; a never function cannot return normally.",
    mistake: "unknown is not runtime validation; you still need actual checks.",
  },
  {
    category: "Core Types & System", title: "Object types, arrays and structural typing",
    points: ["Object types describe required, optional and readonly properties. Compatibility generally depends on shape rather than the declared name.", "T[] and Array<T> describe arrays. readonly T[] prevents mutation through that reference; it does not freeze the runtime array."],
    code: `type Lesson = { readonly id: string; title: string; minutes?: number };
const lessons: Lesson[] = [{ id: "intro", title: "Intro" }];
const titles: Array<string> = lessons.map(item => item.title);
function count(items: readonly Lesson[]): number { return items.length; }
const detailed = { id: "types", title: "Types", author: "Ada" };
lessons.push(detailed); // compatible shape
console.log(titles, count(lessons));`,
    practice: "Add a tags array and a readonly owner object; check which nested changes remain legal.",
    question: "Must compatible objects share the same type alias name?", answer: "No. Structural compatibility compares members. Fresh object literals also receive excess-property checks.",
    mistake: "object is a broad non-primitive type, not a description of your domain fields.",
  },
  {
    category: "Core Types & System", title: "Tuples, named tuples and variadic tuple types",
    points: ["Tuples give positions distinct types. Named tuple labels document positions without creating object properties.", "Optional and rest tuple elements describe flexible argument lists. Variadic tuple types spread a generic tuple while preserving its order."],
    code: `type Coordinate = [latitude: number, longitude: number];
type Entry<T extends unknown[]> = [id: string, ...details: T];
const point: Coordinate = [28.6, 77.2];
const entry: Entry<[title: string, minutes: number]> = ["ts", "Types", 20];
type Command = [name: string, retries?: number];
const fixed = ["ready", 200] as const; // readonly tuple
console.log(point[0], entry, fixed);`,
    practice: "Create a variadic tuple that appends a boolean success flag to another tuple.",
    question: "Does a named tuple expose point.latitude?", answer: "No. Labels improve tooling; tuple values still use numeric positions.",
    mistake: "A general array does not guarantee the length or position types required by a tuple.",
  },
  {
    category: "Core Types & System", title: "Enums: numeric, string and const enum",
    points: ["Numeric enums can auto-increment and emit reverse mappings. String enums require string initializers and do not generate numeric reverse mappings.", "const enum members are generally inlined unless preservation is configured. Publishing ambient const enums can cause isolated-module and version-mismatch problems."],
    code: `enum Stage { Draft, Review, Published }
enum Action { Save = "SAVE", Publish = "PUBLISH" }
const enum Permission { Read = 1, Write = 2 }
const permission = Permission.Read | Permission.Write;
const stages = { Draft: "draft", Published: "published" } as const;
type StageName = typeof stages[keyof typeof stages];
console.log(Stage[0], Action.Save, permission);`,
    practice: "Compare emitted JavaScript for an enum and an as const object in a compiling project.",
    question: "Does a string enum provide reverse lookup automatically?", answer: "No. Numeric enums generate reverse mappings; string enums do not.",
    mistake: "Enums need runtime transformation and are not compatible with an erasableSyntaxOnly source policy.",
  },
  {
    category: "Core Types & System", title: "Literal types and const assertions",
    points: ["String, number and boolean literal types restrict a value to exact choices. Combine literals into meaningful states.", "as const retains literal values and marks object properties and array tuples readonly at the type level."],
    code: `type Mode = "read" | "edit";
type StatusCode = 200 | 404;
type Success = { ok: true; status: 200 };
const config = { mode: "read", retries: 3 } as const;
const mode: Mode = config.mode;`,
    practice: "Model a response using true and false literal discriminants with different payloads.",
    question: "Does as const call Object.freeze?", answer: "No. It changes static inference and emits no runtime freeze operation.",
    mistake: "A mutable object's string property may widen to string even when the object variable uses const.",
  },
  {
    category: "Type Composition & Modification", title: "Union types and intersection types",
    points: ["A | B accepts alternatives; safely access only shared members until narrowed. A & B requires both sets of constraints.", "Discriminated unions model mutually exclusive states; intersections compose independent capabilities."],
    code: `type Result = { ok: true; data: string } | { ok: false; error: string };
type Identified = { id: string };
type Titled = { title: string };
type Card = Identified & Titled;
function display(result: Result): string {
  return result.ok ? result.data : result.error;
}
const card: Card = { id: "ts", title: "TypeScript" };`,
    practice: "Add a loading state to Result and make display handle it explicitly.",
    question: "What happens when intersecting incompatible property types?", answer: "A property required to be both string and number becomes never, making that requirement impossible to satisfy.",
    mistake: "An intersection does not perform an object spread or merge at runtime.",
  },
  {
    category: "Type Composition & Modification", title: "Type aliases, interfaces and declaration merging",
    points: ["type can name unions, primitives, tuples and object shapes. interface describes extensible object contracts.", "Compatible interface declarations with the same name merge. Type aliases cannot be reopened in this way."],
    code: `interface Preferences { theme: "light" | "dark" }
interface Preferences { fontSize: number }
interface ReaderPreferences extends Preferences { readonly userId: string }
type PreferenceKey = keyof Preferences;
const settings: ReaderPreferences = { theme: "dark", fontSize: 16, userId: "u1" };`,
    practice: "Write a union with a type alias and extend an object contract with an interface.",
    question: "Can merging redeclare a property with an incompatible type?", answer: "No. Repeated non-function members must have compatible declarations with the same type.",
    mistake: "Declaration merging changes compile-time contracts; it does not add missing runtime properties.",
  },
  {
    category: "Type Composition & Modification", title: "Type assertions and the non-null assertion operator",
    points: ["value as Type asserts knowledge the checker lacks. The alternative <Type>value form is unavailable in TSX because it conflicts with JSX.", "value! removes null and undefined from the static type. Prefer a guard when absence is possible."],
    code: `const element = document.querySelector("#email");
if (element instanceof HTMLInputElement) {
  console.log(element.value); // runtime evidence
}
const assumed = document.querySelector("#email") as HTMLInputElement;
// assumed.value would fail if the element is absent.
const assertedLength = (value: string | null) => value!.length;`,
    practice: "Replace assertedLength's ! with explicit handling of null.",
    question: "Do as and ! validate values at runtime?", answer: "No. Both are erased; a wrong assumption can still cause a runtime error.",
    mistake: "Do not double-assert through unknown to hide a mismatch that the program needs to handle.",
  },
  {
    category: "Type Composition & Modification", title: "The satisfies operator",
    points: ["satisfies checks assignability without replacing the expression's resulting type with the target annotation. Contextual typing can still affect inference.", "Use it for configuration maps when you need both a checked contract and useful property-specific types."],
    code: `type Color = string | [number, number, number];
const palette = {
  accent: [40, 90, 180],
  background: "#ffffff",
} satisfies Record<"accent" | "background", Color>;
palette.background.toUpperCase();
palette.accent[0].toFixed();`,
    practice: "Misspell background and observe the error; compare a Record annotation with satisfies.",
    question: "Does satisfies make a value readonly?", answer: "No. Use readonly contracts or a const assertion when that constraint is desired.",
    mistake: "satisfies is a static check, not an input validator or a promise that every literal stays narrow.",
  },
  {
    category: "Type Narrowing & Guards", title: "Control-flow narrowing and custom type guards",
    points: ["typeof, instanceof, in, equality and discriminant checks narrow unions along control flow. Check null separately because typeof null is object.", "A predicate value is T communicates a custom guard. An asserts value is T function throws on failure and narrows after a successful call."],
    code: `type User = { name: string };
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null &&
    "name" in value && typeof value.name === "string";
}
function assertUser(value: unknown): asserts value is User {
  if (!isUser(value)) throw new Error("Invalid user");
}
function greet(value: unknown): string {
  assertUser(value);
  return value.name.toUpperCase();
}`,
    practice: "Add an age property and update the predicate to validate it, including malformed inputs.",
    question: "Does TypeScript prove that a custom type predicate is correct?", answer: "No. The predicate is a promise whose runtime checks you must implement and test accurately.",
    mistake: "Truthiness can discard valid values such as zero and the empty string.",
  },
  {
    category: "Functions & Classes", title: "Function type signatures, optional, default and rest parameters",
    points: ["Function types describe parameter and return contracts. Optional parameters accept undefined; defaults substitute a value when an argument is absent or undefined.", "Rest parameters collect arguments into an array; spread arguments expand an array or tuple into a call."],
    code: `type Formatter = (value: number, suffix?: string) => string;
const format: Formatter = (value, suffix = "") => value.toFixed(2) + suffix;
function sum(initial = 0, ...values: number[]): number {
  return values.reduce((total, value) => total + value, initial);
}
const args = [1, 2, 3] as const;
console.log(format(sum(...args), " points"));`,
    practice: "Add an optional prefix without confusing omission with an empty string.",
    question: "Does a default parameter replace null?", answer: "No. Default initialization is triggered by undefined, not null.",
    mistake: "Do not mark a callback parameter optional merely because a callback may ignore it.",
  },
  {
    category: "Functions & Classes", title: "Function overloads",
    points: ["Overload signatures expose supported call shapes; one implementation handles every overload.", "The implementation signature is not an extra public overload. Prefer a union parameter when return behavior does not depend on input shape."],
    code: `function normalize(value: string): string;
function normalize(value: string[]): string[];
function normalize(value: string | string[]): string | string[] {
  return typeof value === "string"
    ? value.trim()
    : value.map(item => item.trim());
}
const one = normalize(" hello "); // string
const many = normalize([" hello "]); // string[]`,
    practice: "Try calling normalize with a string | string[] variable and decide whether to add a union overload.",
    question: "Why can a union argument fail even when the implementation accepts it?", answer: "Callers must match a visible overload signature, not just the hidden implementation signature.",
    mistake: "ReturnType of an overloaded function uses its last overload signature; it does not resolve a specific call.",
  },
  {
    category: "Functions & Classes", title: "Classes, parameter properties and access modifiers",
    points: ["public is accessible anywhere; protected allows subclasses; private restricts access to the declaring class during type checking. JavaScript #private fields enforce privacy at runtime.", "Constructor parameter properties declare and initialize fields. readonly limits reassignment; override documents an inherited member and works with noImplicitOverride."],
    code: `class Course {
  private views = 0;
  protected prefix = "Course";
  constructor(public title: string, public readonly id: string) {}
  describe(): string { this.views++; return this.prefix + ": " + this.title; }
}
class FeaturedCourse extends Course {
  override describe(): string { return "Featured " + super.describe(); }
}
console.log(new FeaturedCourse("TypeScript", "ts").describe());`,
    practice: "Try changing id after construction and accessing prefix outside the class.",
    question: "Does TypeScript private provide the same runtime isolation as #private?", answer: "No. TypeScript private is a checker restriction; JavaScript private fields have runtime enforcement.",
    mistake: "Parameter properties require transformation and cannot be used under erasableSyntaxOnly.",
  },
  {
    category: "Functions & Classes", title: "Abstract classes and methods; this parameter and return types",
    points: ["Abstract classes provide shared implementation while requiring subclasses to implement abstract members.", "An explicit this parameter checks the receiver and is erased. Returning this preserves a subclass type through fluent method chains."],
    code: `abstract class Writer {
  abstract write(text: string): void;
  reset(): this { return this; }
}
class ConsoleWriter extends Writer {
  override write(text: string): void { console.log(text); }
}
function label(this: { title: string }): string { return this.title; }
const writer = new ConsoleWriter().reset();
writer.write(label.call({ title: "TypeScript" }));`,
    practice: "Add a subclass-only method and call it after reset().",
    question: "Can you instantiate Writer directly?", answer: "No. An abstract class must be concretely implemented by a subclass before instantiation.",
    mistake: "A this parameter does not bind a method at runtime; detached methods may still lose their receiver.",
  },
  {
    category: "Generics", title: "Generic functions, interfaces, type aliases and classes",
    points: ["A generic parameter preserves relationships across inputs, outputs and stored values.", "Generic interfaces and aliases describe reusable containers; generic classes keep instance data consistently typed."],
    code: `function identity<T>(value: T): T { return value; }
interface Page<T> { items: T[]; total: number }
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
class Store<T> {
  private items: T[] = [];
  add(item: T): void { this.items.push(item); }
  all(): readonly T[] { return this.items; }
}
const store = new Store<string>();
store.add(identity("Types"));
const page: Page<string> = { items: [...store.all()], total: 1 };`,
    practice: "Use Store with an object type and deliberately try adding the wrong shape.",
    question: "Why use T instead of any in identity?", answer: "T preserves the caller's input type in the result; any discards that relationship.",
    mistake: "A class static member cannot use the class's instance type parameter.",
  },
  {
    category: "Generics", title: "Generic constraints with extends and default generic parameters",
    points: ["extends places a minimum requirement on a generic argument while retaining its more specific type.", "Default type arguments apply when omitted and not otherwise inferred. Required type parameters cannot follow optional ones."],
    code: `function get<T, K extends keyof T>(value: T, key: K): T[K] {
  return value[key];
}
interface ResponseBox<T = string> { value: T }
function size<T extends { length: number }>(value: T): number {
  return value.length;
}
const response: ResponseBox = { value: "ready" };
const title = get({ title: "Types", minutes: 12 }, "title");`,
    practice: "Constrain a generic repository to objects with a string id and retain all other fields.",
    question: "Does extends require an exact object shape?", answer: "No. A constraint establishes required structure; an argument can have additional members.",
    mistake: "A default must satisfy its constraint and does not disable inference.",
  },
  {
    category: "Advanced Type Manipulation", title: "keyof, indexed access lookup types T[K] and typeof",
    points: ["keyof obtains property keys; indexed access T[K] obtains their value types.", "In type positions, typeof derives a type from a value declaration. Combine these operators to keep related models synchronized."],
    code: `const course = { title: "Types", minutes: 30, published: true };
type Course = typeof course;
type Keys = keyof Course;
type Title = Course["title"];
type Values = Course[Keys]; // string | number | boolean
const levels = ["beginner", "advanced"] as const;
type Level = typeof levels[number];`,
    practice: "Derive an array element type and a union of two selected object property types.",
    question: "How does type-position typeof differ from runtime typeof?", answer: "It produces a static type from a declaration; runtime typeof evaluates to a string such as 'object'.",
    mistake: "A string index signature can make keyof include number because JavaScript coerces numeric object keys.",
  },
  {
    category: "Advanced Type Manipulation", title: "Conditional types and the infer keyword",
    points: ["T extends U ? X : Y selects a type using assignability. A conditional with a naked type parameter distributes over union members.", "infer captures part of a matched type. Wrapping both sides in tuples prevents distributive behavior."],
    code: `type ElementOf<T> = T extends readonly (infer Item)[] ? Item : T;
type ToArray<T> = T extends unknown ? T[] : never;
type Together<T> = [T] extends [unknown] ? T[] : never;
type Element = ElementOf<readonly number[]>; // number
type Separate = ToArray<string | number>; // string[] | number[]
type Combined = Together<string | number>; // (string | number)[]`,
    practice: "Write a conditional type extracting a function's return type with infer.",
    question: "Why can ToArray and Together produce different results?", answer: "ToArray distributes over each union member; tuple wrapping in Together tests the union as a whole.",
    mistake: "Conditional types do not execute runtime branches or validate incoming data.",
  },
  {
    category: "Advanced Type Manipulation", title: "Mapped types, modifiers and key remapping via as",
    points: ["Mapped types iterate over a key union: { [K in Keys]: T }. Preserve or transform each property's value type.", "Use +readonly, -readonly, +? and -? to add or remove modifiers. An as clause renames keys or filters them by producing never."],
    code: `type MutableRequired<T> = { -readonly [K in keyof T]-?: T[K] };
type OptionalReadonly<T> = { +readonly [K in keyof T]+?: T[K] };
type WithoutId<T> = { [K in keyof T as Exclude<K, "id">]: T[K] };
type Draft = { readonly id: string; title?: string };
type Editable = MutableRequired<Draft>;
type PublicFields = WithoutId<Draft>;`,
    practice: "Create a mapped type turning each property into a boolean permission flag.",
    question: "What does remapping a key to never do?", answer: "It removes that property from the resulting mapped type.",
    mistake: "Removing readonly in a type does not unfreeze a runtime object.",
  },
  {
    category: "Advanced Type Manipulation", title: "Template literal types",
    points: ["Template literal types construct string types from literal unions using ${...}. Multiple unions produce combinations.", "Combine templates with key remapping and intrinsic string helpers such as Capitalize to derive event names and APIs."],
    code: 'type Entity = "lesson" | "course";\ntype Event = `${Entity}:${"created" | "updated"}`;\ntype Getters<T> = {\n  [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K]\n};\ntype ReaderGetters = Getters<{ title: string; minutes: number }>;\nconst event: Event = "lesson:created";',
    practice: "Derive Changed event names from an object's string keys.",
    question: "Does a template literal type generate strings at runtime?", answer: "No. It describes allowed strings; your program still creates actual values.",
    mistake: "Very large union combinations can make checking expensive; keep generated APIs focused.",
  },
  {
    category: "Utility Types", title: "Object utilities: Partial<T>, Required<T>, Readonly<T>, Record<K, T>, Pick<T, K>, Omit<T, K>",
    points: ["Partial makes fields optional; Required makes them required; Readonly prevents property reassignment through the typed reference. These transformations are shallow.", "Record defines keyed values; Pick selects fields; Omit removes fields from the type."],
    code: `type User = { id: string; name: string; email?: string };
type Patch = Partial<User>;
type Complete = Required<User>;
type Snapshot = Readonly<User>;
type ById = Record<string, User>;
type Label = Pick<User, "id" | "name">;
type Create = Omit<User, "id">;
const patch: Patch = { name: "Ada" };
const label: Label = { id: "u1", name: "Ada" };`,
    practice: "Design separate create, update and display contracts for a course record.",
    question: "Does Omit delete a property from an existing object?", answer: "No. It changes a static shape; create a new object to remove a runtime field.",
    mistake: "Partial does not recursively make nested fields optional.",
  },
  {
    category: "Utility Types", title: "Union utilities: Exclude<T, U>, Extract<T, U> and NonNullable<T>",
    points: ["Exclude removes union members assignable to U; Extract keeps them. NonNullable removes null and undefined."],
    code: `type State = "draft" | "published" | "archived";
type Active = Exclude<State, "archived">;
type Final = Extract<State, "published" | "archived">;
type Present = NonNullable<string | null | undefined>;
type Event = { kind: "save"; id: string } | { kind: "close" };
type SaveEvent = Extract<Event, { kind: "save" }>;`,
    practice: "Extract one variant from a discriminated union by its kind property.",
    question: "Does Exclude remove object fields?", answer: "No. It filters union members; Omit removes keys from object types.",
    mistake: "NonNullable does not prove that an actual nullable value is present.",
  },
  {
    category: "Utility Types", title: "Function utilities: Parameters<T>, ConstructorParameters<T>, ReturnType<T>, InstanceType<T> and Awaited<T>",
    points: ["Parameters and ConstructorParameters capture argument tuples. ReturnType and InstanceType capture function results and constructed instances.", "Awaited recursively unwraps promises and compatible thenables, matching the type behavior of await."],
    code: `function load(id: string, refresh = false): Promise<{ id: string }> {
  return Promise.resolve({ id });
}
class Reader { constructor(public name: string) {} }
type LoadArgs = Parameters<typeof load>;
type LoadResult = ReturnType<typeof load>;
type Loaded = Awaited<LoadResult>;
type ReaderArgs = ConstructorParameters<typeof Reader>;
type ReaderInstance = InstanceType<typeof Reader>;
const args: LoadArgs = ["ts", true];
const reader: ReaderInstance = new Reader("Ada");`,
    practice: "Derive a resolved service result without duplicating its declared object shape.",
    question: "Why use typeof Reader with InstanceType?", answer: "The utility expects a constructor type; typeof Reader refers to that constructor value's type.",
    mistake: "Awaited describes a result type; it does not await or execute a promise.",
  },
  {
    category: "Modules, Decorators & Compiler Safety", title: "Decorators: classes, methods, fields and metadata",
    points: ["Decorators run during class definition and can wrap methods, replace classes or supply field initialization behavior. Their context describes the decorated member.", "Standard decorators and legacy experimentalDecorators use different contracts. Legacy emitDecoratorMetadata is separate from standard decorators, which do not support parameter decorators or that legacy metadata emit."],
    code: `// Standard decorator example; experimentalDecorators is disabled.
function logged<This, Args extends unknown[], Result>(
  method: (this: This, ...args: Args) => Result,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Result>,
) {
  return function (this: This, ...args: Args): Result {
    console.log(String(context.name));
    return method.apply(this, args);
  };
}
class Reader {
  @logged
  read(title: string): string { return "Reading " + title; }
}
console.log(new Reader().read("Types"));`,
    practice: "Wrap a method while preserving its receiver, arguments and return value. Identify which decorator mode your framework expects.",
    question: "Can a legacy decorator be assumed compatible with standard decorator syntax?", answer: "No. Check the library's expected signature, compiler mode and metadata requirements.",
    mistake: "Decorators do not automatically provide runtime reflection for every TypeScript type.",
  },
  {
    category: "Modules, Decorators & Compiler Safety", title: "ES modules, import type and export type",
    points: ["Modules expose intentional boundaries with import and export. Type-only imports and exports are erased.", "Choose module and moduleResolution settings for the actual runtime or bundler. A type declaration alone never creates a runtime value."],
    code: `// models.ts
export interface Course { id: string; title: string }
export const defaultTitle = "TypeScript";
// reader.ts
import type { Course } from "./models.js";
import { defaultTitle } from "./models.js";
export function createCourse(id: string): Course {
  return { id, title: defaultTitle };
}
export type { Course } from "./models.js";`,
    practice: "Split a data model and formatter into modules, separating type imports from runtime imports.",
    question: "Why use import type with verbatimModuleSyntax?", answer: "It explicitly marks imports for erasure, keeping the distinction between type and runtime dependencies clear.",
    mistake: "A tsconfig path alias does not by itself teach the runtime how to resolve that alias.",
  },
  {
    category: "Modules, Decorators & Compiler Safety", title: "Strict compiler options: strictNullChecks and noImplicitAny",
    points: ["strict enables a family of checks including strictNullChecks and noImplicitAny. Explicitly choosing safety settings documents project intent.", "noUncheckedIndexedAccess includes possible absence in indexed reads. exactOptionalPropertyTypes distinguishes omitted fields from explicit undefined; noImplicitOverride checks overrides. These options are separate from strict."],
    code: `// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noEmit": true
  }
}`,
    practice: "Enable indexed-access checking and handle an empty array before using its first item.",
    question: "Does noImplicitAny forbid an explicit any annotation?", answer: "No. It diagnoses implicit any where inference cannot determine a type; explicit any requires separate review or lint rules.",
    mistake: "Static checking does not replace runtime validation of network responses or user input.",
  },
];

export const TYPESCRIPT_FUNDAMENTAL_LESSONS: Lesson[] = TYPESCRIPT_TOPICS.map(topic => ({
  title: topic.title,
  explanation: topic.points.map(point => `- ${point}`).join("\n"),
  example: topic.answer,
  code: topic.code,
  exercise: topic.practice,
  checkpoint: topic.question,
  mistake: topic.mistake,
  interview: [{ question: topic.question, definition: topic.points[0], answer: topic.answer, similar: [] }],
}));
