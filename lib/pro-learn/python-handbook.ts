import type { AwsCategory, AwsHighlight } from "./aws-highlights";

/** The handbook reuses the catalogue row shape, so one browser renders all three. */
export type PythonTopic = AwsHighlight;

/**
 * A Python handbook, ordered the way the language is usually taught: what a
 * value is, how you group values, how you branch, how you factor work out, how
 * you model things, and then the surrounding craft — errors, files, types,
 * concurrency, packaging and the data stack.
 *
 * The category is what the tabs group by. Topics sit under the question they
 * answer rather than under the module they happen to live in, so `pathlib` is
 * filed with files and not with the standard library at large.
 */
const TOPICS: PythonTopic[] = [
  { name: "Variables & assignment", category: "Language basics", summary: "Names bound to objects. Assignment never copies — it points another name at the same object, which is why mutating through one name is visible through the other." },
  { name: "Numbers", category: "Language basics", summary: "int is arbitrary precision, float is IEEE 754 with its usual surprises, and Decimal exists for money. Division with / always returns a float; // floors." },
  { name: "Strings", category: "Language basics", summary: "Immutable sequences of Unicode. f-strings interpolate, .join beats repeated +, and bytes are a separate type you must encode into and decode out of." },
  { name: "Booleans & truthiness", category: "Language basics", summary: "Empty collections, 0 and None are falsy; almost everything else is truthy. `is` compares identity and `==` compares value — they are not interchangeable." },
  { name: "None", category: "Language basics", summary: "The single null object, used for absence and as a default. Test it with `is None`, never `== None`, and never as a default for a mutable argument." },
  { name: "Operators", category: "Language basics", summary: "Arithmetic, comparison, membership with `in`, identity with `is`, and boolean operators that short-circuit and return an operand rather than a bool." },
  { name: "Input & output", category: "Language basics", summary: "input() always returns a string, so convert before arithmetic. print() takes sep, end and file, which covers most formatting before you reach for anything else." },

  { name: "Lists", category: "Collections", summary: "Ordered, mutable sequences. Append and pop from the end are cheap; inserting at the front is not, which is what collections.deque is for." },
  { name: "Tuples", category: "Collections", summary: "Ordered and immutable, so they can be dictionary keys and set members. Unpacking makes them the natural way to return several values at once." },
  { name: "Dictionaries", category: "Collections", summary: "Hash maps from keys to values, insertion-ordered since 3.7. .get and .setdefault avoid the KeyError dance; dict comprehensions build them in one expression." },
  { name: "Sets", category: "Collections", summary: "Unordered collections of unique hashable values, with union, intersection and difference as operators. Membership is O(1), which is the usual reason to reach for one." },
  { name: "Slicing", category: "Collections", summary: "seq[start:stop:step] on any sequence, with stop exclusive. A negative step reverses, and a bare [:] copies one level deep." },
  { name: "Comprehensions", category: "Collections", summary: "List, dict, set and generator comprehensions build a collection from an iterable in one expression. Past two clauses, a loop reads better." },
  { name: "Iterators & iterables", category: "Collections", summary: "An iterable produces an iterator; an iterator yields items once and is then spent. This is why a generator can be looped over exactly one time." },

  { name: "if / elif / else", category: "Control flow", summary: "Branching on truthiness, with no switch needed. Conditional expressions (`a if cond else b`) cover the small cases inline." },
  { name: "for loops", category: "Control flow", summary: "Iterates over any iterable rather than counting indices. enumerate gives you the index when you genuinely need it; zip walks several sequences together." },
  { name: "while loops", category: "Control flow", summary: "Repeats while a condition holds. Reach for it when the number of iterations is not known in advance — otherwise a for loop says more." },
  { name: "break, continue & else", category: "Control flow", summary: "break leaves the loop, continue skips to the next round, and a loop's else clause runs only when no break happened — useful for search-and-not-found." },
  { name: "match statements", category: "Control flow", summary: "Structural pattern matching: destructure sequences, mappings and classes in the branch itself. More than a switch, and worth it only when shapes vary." },

  { name: "Functions", category: "Functions", summary: "def creates a function object you can pass around. Return early, keep them small, and give them docstrings — the help() output is the first documentation." },
  { name: "Arguments & defaults", category: "Functions", summary: "Positional, keyword, and defaults evaluated once at definition time — which is why a mutable default is the classic Python bug." },
  { name: "*args & **kwargs", category: "Functions", summary: "Collect extra positional and keyword arguments, and spread them back out at a call site. Useful for wrappers; costly to readability everywhere else." },
  { name: "Lambda", category: "Functions", summary: "A single-expression anonymous function, mostly for a key= or a callback. If it needs a name or a statement, write a def." },
  { name: "Scope & closures", category: "Functions", summary: "Names resolve local, enclosing, global, built-in. A nested function closes over the enclosing variable itself, not a snapshot of its value." },
  { name: "Decorators", category: "Functions", summary: "A function that wraps another and replaces it. functools.wraps keeps the name and docstring; without it the wrapped function loses its identity." },
  { name: "Generators", category: "Functions", summary: "yield produces values lazily, one at a time, so a pipeline can process more data than fits in memory. The function resumes where it left off." },
  { name: "Recursion", category: "Functions", summary: "A function calling itself, bounded by a base case. Python has no tail-call optimisation and a default limit near 1000 frames, so prefer a loop when you can." },

  { name: "Classes & instances", category: "Objects & classes", summary: "class defines a type; __init__ initialises an instance. Attributes on the class are shared, attributes on self are per-instance — a common source of surprise." },
  { name: "Inheritance & MRO", category: "Objects & classes", summary: "Subclasses extend behaviour, super() delegates along the method resolution order. Composition is usually the better answer to reuse." },
  { name: "Dunder methods", category: "Objects & classes", summary: "__repr__, __eq__, __len__, __iter__ and friends let your type work with built-in syntax. Implement __repr__ first — it pays for itself in debugging." },
  { name: "Dataclasses", category: "Objects & classes", summary: "@dataclass generates __init__, __repr__ and __eq__ from annotations. frozen=True makes instances hashable and immutable." },
  { name: "Properties", category: "Objects & classes", summary: "@property exposes a method as an attribute, so you can add validation or computation later without changing every call site." },
  { name: "Class & static methods", category: "Objects & classes", summary: "@classmethod receives the class and is the usual way to write alternative constructors; @staticmethod is a plain function that lives in the namespace." },

  { name: "Exceptions", category: "Errors & testing", summary: "Raise on failure rather than returning error codes. Catch the narrowest type that you can actually handle, and never a bare except." },
  { name: "try / except / finally", category: "Errors & testing", summary: "else runs when nothing raised, finally always runs. Python asks forgiveness rather than permission, so try/except often beats a pre-check." },
  { name: "Custom exceptions", category: "Errors & testing", summary: "Subclass Exception to give callers something specific to catch. One base class per package keeps a library's failures distinguishable from everything else." },
  { name: "pytest", category: "Errors & testing", summary: "Plain assert statements, fixtures for setup, parametrize for tables of cases. The default test runner for almost every modern Python project." },
  { name: "Debugging", category: "Errors & testing", summary: "breakpoint() drops into the debugger, and a traceback is read bottom-up: the last frame is where it broke, the ones above say how it got there." },

  { name: "File I/O", category: "Files & data", summary: "open() with an explicit mode and encoding. Always specify encoding='utf-8' — the platform default differs and will bite you across machines." },
  { name: "Context managers", category: "Files & data", summary: "The with statement guarantees cleanup even when an exception unwinds. contextlib.contextmanager turns a generator into one in a few lines." },
  { name: "pathlib", category: "Files & data", summary: "Path objects with / as the join operator, plus read_text, glob and mkdir. Replaces almost all string path manipulation and os.path." },
  { name: "JSON", category: "Files & data", summary: "json.loads and json.dumps move between text and dicts. Anything beyond the built-in types needs a custom encoder or a conversion step." },
  { name: "CSV", category: "Files & data", summary: "The csv module handles quoting and embedded newlines that a naive split(',') gets wrong. DictReader gives rows as dicts keyed by header." },

  { name: "Type hints", category: "Typing", summary: "Annotations describing expected types. Ignored at runtime, but they drive editor completion and catch whole classes of mistake before you run anything." },
  { name: "mypy", category: "Typing", summary: "The static checker that makes annotations enforceable. Adopt it incrementally with per-module strictness rather than turning everything on at once." },
  { name: "Generics & Protocols", category: "Typing", summary: "Generics parameterise a container by its element type; Protocols describe structural typing — what a value can do rather than what it inherits from." },

  { name: "async / await", category: "Async & concurrency", summary: "Coroutines that suspend at await instead of blocking. It buys concurrency for I/O-bound work and nothing at all for CPU-bound work." },
  { name: "asyncio", category: "Async & concurrency", summary: "The event loop, tasks and gather. One blocking call anywhere in a coroutine stalls the entire loop, which is the usual cause of async that is not faster." },
  { name: "Threads & the GIL", category: "Async & concurrency", summary: "The global interpreter lock means threads help with I/O and not with CPU work. Free-threaded builds are changing this, but the default still applies." },
  { name: "Multiprocessing", category: "Async & concurrency", summary: "Separate processes sidestep the GIL for CPU-bound work, at the cost of pickling everything that crosses a process boundary." },

  { name: "Modules & imports", category: "Modules & packaging", summary: "Every file is a module and every import runs it once, cached in sys.modules. Prefer absolute imports; the __main__ guard keeps a script importable." },
  { name: "Virtual environments", category: "Modules & packaging", summary: "python -m venv gives a project its own interpreter and packages, so two projects cannot fight over one dependency version. Never install into the system Python." },
  { name: "pip & dependencies", category: "Modules & packaging", summary: "Install and pin. A lockfile is what makes a build reproducible; a loose requirements.txt is a description of what worked once." },
  { name: "pyproject.toml", category: "Modules & packaging", summary: "The single declarative file for build backend, metadata, dependencies and tool configuration. It replaced setup.py for new projects." },

  { name: "collections", category: "Standard library", summary: "Counter, defaultdict, deque and namedtuple. Most hand-rolled counting and grouping loops are one of these in a single line." },
  { name: "itertools", category: "Standard library", summary: "Lazy building blocks for iteration — chain, groupby, product, islice — that compose pipelines without materialising the intermediate lists." },
  { name: "datetime", category: "Standard library", summary: "Dates, times and deltas. Store and compute in timezone-aware UTC and convert only at the edges; naive datetimes are where the bugs live." },
  { name: "re", category: "Standard library", summary: "Regular expressions. Compile a pattern you reuse, use raw strings, and prefer a real parser once the pattern stops fitting on one line." },

  { name: "NumPy", category: "Data & scientific", summary: "N-dimensional arrays with vectorised operations that run in C. The foundation nearly every other scientific Python library is built on." },
  { name: "pandas", category: "Data & scientific", summary: "DataFrames for labelled tabular data — loading, joining, grouping and reshaping. Chained assignment and silent copies are the things to learn early." },
  { name: "matplotlib", category: "Data & scientific", summary: "The plotting foundation. Use the object-oriented figure and axes interface rather than the stateful pyplot one for anything you intend to keep." },
  { name: "Jupyter", category: "Data & scientific", summary: "Notebooks interleaving code, output and prose. Excellent for exploring and explaining; run order is hidden state, so move settled code into modules." },
];

export function pythonTopics(): PythonTopic[] {
  return TOPICS;
}

/** Categories in the order the handbook introduces them, which is the teaching order. */
export function pythonCategories(): AwsCategory[] {
  const counts = new Map<string, number>();
  for (const topic of TOPICS) counts.set(topic.category, (counts.get(topic.category) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count }));
}
