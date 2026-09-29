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
  { name: "Variables & assignment", category: "Language basics", summary: "Names bound to objects. Assignment never copies — it points another name at the same object, which is why mutating through one name is visible through the other.", points: [
      "A name is bound to an object; it is not a box holding a value.",
      "Two names can bind the same object, so mutating through one is visible through the other.",
      "Rebinding a name never affects the object it used to point at.",
    ] },
  { name: "Numbers", category: "Language basics", summary: "int is arbitrary precision, float is IEEE 754 with its usual surprises, and Decimal exists for money. Division with / always returns a float; // floors.", points: [
      "Integers have no width limit, so they never silently overflow.",
      "Floats are binary, which is why a tenth plus two tenths is not exactly three tenths.",
      "Decimal exists for money, where binary rounding is not acceptable.",
    ] },
  { name: "Strings", category: "Language basics", summary: "Immutable sequences of Unicode. f-strings interpolate, .join beats repeated +, and bytes are a separate type you must encode into and decode out of.", points: [
      "Strings are immutable, so every edit produces a new object.",
      "Building one in a loop by concatenation is quadratic; joining a list is not.",
      "Indexing yields characters, but the underlying code points are what length counts.",
    ] },
  { name: "Booleans & truthiness", category: "Language basics", summary: "Empty collections, 0 and None are falsy; almost everything else is truthy. `is` compares identity and `==` compares value — they are not interchangeable.", points: [
      "Empty containers, zero and None are falsy without being False.",
      "Testing a container directly is idiomatic; comparing its length is not.",
      "An identity check against True is stricter than truthiness and usually wrong.",
    ] },
  { name: "None", category: "Language basics", summary: "The single null object, used for absence and as a default. Test it with `is None`, never `== None`, and never as a default for a mutable argument.", points: [
      "None is the single object meaning absence, not zero and not empty.",
      "It is compared with is, because there is exactly one of it.",
      "A mutable default argument is the classic reason a function needs None instead.",
    ] },
  { name: "Operators", category: "Language basics", summary: "Arithmetic, comparison, membership with `in`, identity with `is`, and boolean operators that short-circuit and return an operand rather than a bool.", points: [
      "Arithmetic, comparison and membership operators dispatch on the operand types.",
      "Division always yields a float; floor division is a separate operator.",
      "Chained comparisons read as mathematics and evaluate the middle term once.",
    ] },
  { name: "Input & output", category: "Language basics", summary: "input() always returns a string, so convert before arithmetic. print() takes sep, end and file, which covers most formatting before you reach for anything else.", points: [
      "input always returns a string, whatever the user typed.",
      "print joins with spaces and adds a newline unless told otherwise.",
      "Converting input without handling a bad value raises rather than returning a default.",
    ] },

  { name: "Lists", category: "Collections", summary: "Ordered, mutable sequences. Append and pop from the end are cheap; inserting at the front is not, which is what collections.deque is for.", points: [
      "A list is an ordered, mutable sequence that can hold mixed types.",
      "Appending is cheap; inserting at the front shifts every element.",
      "Copying is shallow, so nested objects are still shared.",
    ] },
  { name: "Tuples", category: "Collections", summary: "Ordered and immutable, so they can be dictionary keys and set members. Unpacking makes them the natural way to return several values at once.", points: [
      "A tuple is an ordered, immutable sequence.",
      "Immutability is what lets it be a dictionary key when a list cannot.",
      "A one-element tuple needs a trailing comma or it is just parentheses.",
    ] },
  { name: "Dictionaries", category: "Collections", summary: "Hash maps from keys to values, insertion-ordered since 3.7. .get and .setdefault avoid the KeyError dance; dict comprehensions build them in one expression.", points: [
      "Keys map to values with average constant-time lookup.",
      "Insertion order is preserved, which is guaranteed and not incidental.",
      "Keys must be hashable, which rules out lists and dictionaries.",
    ] },
  { name: "Sets", category: "Collections", summary: "Unordered collections of unique hashable values, with union, intersection and difference as operators. Membership is O(1), which is the usual reason to reach for one.", points: [
      "A set holds unique, unordered, hashable members.",
      "Membership is constant time, which is why it beats a list for lookups.",
      "Union, intersection and difference express set logic directly.",
    ] },
  { name: "Slicing", category: "Collections", summary: "seq[start:stop:step] on any sequence, with stop exclusive. A negative step reverses, and a bare [:] copies one level deep.", points: [
      "A slice takes a start, a stop and a step, and the stop is excluded.",
      "Out-of-range bounds clamp rather than raise, unlike indexing.",
      "Slicing a list copies it; slicing a string makes a new string.",
    ] },
  { name: "Comprehensions", category: "Collections", summary: "List, dict, set and generator comprehensions build a collection from an iterable in one expression. Past two clauses, a loop reads better.", points: [
      "A new list, set or dictionary is built from an expression over an iterable.",
      "It reads as a single expression, which is why it beats an append loop.",
      "Nesting more than two levels is usually less readable than the loop.",
    ] },
  { name: "Iterators & iterables", category: "Collections", summary: "An iterable produces an iterator; an iterator yields items once and is then spent. This is why a generator can be looped over exactly one time.", points: [
      "An iterable produces an iterator; the iterator is what is consumed.",
      "An exhausted iterator stays exhausted, which surprises code that loops twice.",
      "Most builtins take any iterable, not specifically a list.",
    ] },

  { name: "if / elif / else", category: "Control flow", summary: "Branching on truthiness, with no switch needed. Conditional expressions (`a if cond else b`) cover the small cases inline.", points: [
      "Branches are tested in order and the first match wins.",
      "Indentation is the block structure, so it is syntax rather than style.",
      "A conditional expression is the one-line form for choosing a value.",
    ] },
  { name: "for loops", category: "Control flow", summary: "Iterates over any iterable rather than counting indices. enumerate gives you the index when you genuinely need it; zip walks several sequences together.", points: [
      "A for loop iterates over an iterable rather than over an index.",
      "Iterating directly avoids the off-by-one that index arithmetic invites.",
      "Mutating the sequence while looping over it skips elements.",
    ] },
  { name: "while loops", category: "Control flow", summary: "Repeats while a condition holds. Reach for it when the number of iterations is not known in advance — otherwise a for loop says more.", points: [
      "The body repeats while a condition stays true.",
      "It is the right loop when the number of iterations is not known in advance.",
      "A condition that never changes inside the body never terminates.",
    ] },
  { name: "break, continue & else", category: "Control flow", summary: "break leaves the loop, continue skips to the next round, and a loop's else clause runs only when no break happened — useful for search-and-not-found.", points: [
      "break exits the loop, continue skips to the next iteration.",
      "A loop's else runs only when the loop finished without breaking.",
      "That else is a search idiom, not an error branch.",
    ] },
  { name: "match statements", category: "Control flow", summary: "Structural pattern matching: destructure sequences, mappings and classes in the branch itself. More than a switch, and worth it only when shapes vary.", points: [
      "A value is matched structurally against patterns rather than compared.",
      "Patterns can destructure sequences and objects while they match.",
      "A bare name in a pattern captures instead of comparing, which is easy to miss.",
    ] },

  { name: "Functions", category: "Functions", summary: "def creates a function object you can pass around. Return early, keep them small, and give them docstrings — the help() output is the first documentation.", points: [
      "A function groups behaviour behind a name and returns a value.",
      "A function without an explicit return returns None.",
      "Defining one binds a name like any other assignment.",
    ] },
  { name: "Arguments & defaults", category: "Functions", summary: "Positional, keyword, and defaults evaluated once at definition time — which is why a mutable default is the classic Python bug.", points: [
      "Parameters may be positional or keyword, with defaults evaluated once.",
      "A mutable default is shared by every call, which is rarely intended.",
      "Keyword arguments make a long signature readable at the call site.",
    ] },
  { name: "*args & **kwargs", category: "Functions", summary: "Collect extra positional and keyword arguments, and spread them back out at a call site. Useful for wrappers; costly to readability everywhere else.", points: [
      "Extra positional and keyword arguments are collected into a tuple and a dict.",
      "They are how a wrapper forwards arguments it does not need to know about.",
      "Unpacking at the call site is the same syntax working in reverse.",
    ] },
  { name: "Lambda", category: "Functions", summary: "A single-expression anonymous function, mostly for a key= or a callback. If it needs a name or a statement, write a def.", points: [
      "A lambda is a single-expression function without a name.",
      "It cannot contain statements, which bounds how complex it can get.",
      "Assigning one to a name is just a worse way of writing def.",
    ] },
  { name: "Scope & closures", category: "Functions", summary: "Names resolve local, enclosing, global, built-in. A nested function closes over the enclosing variable itself, not a snapshot of its value.", points: [
      "Names resolve local, enclosing, global then builtin, in that order.",
      "A closure captures the variable, not the value it had when defined.",
      "Assigning to a name makes it local for the whole function, not from that line.",
    ] },
  { name: "Decorators", category: "Functions", summary: "A function that wraps another and replaces it. functools.wraps keeps the name and docstring; without it the wrapped function loses its identity.", points: [
      "A decorator wraps a function and returns a replacement.",
      "It is applied at definition time, so the wrapping happens once.",
      "Without functools.wraps the wrapper loses the original name and docstring.",
    ] },
  { name: "Generators", category: "Functions", summary: "yield produces values lazily, one at a time, so a pipeline can process more data than fits in memory. The function resumes where it left off.", points: [
      "yield produces values lazily, one at a time, keeping state between them.",
      "Nothing runs until the generator is iterated.",
      "Memory stays constant regardless of how many values are produced.",
    ] },
  { name: "Recursion", category: "Functions", summary: "A function calling itself, bounded by a base case. Python has no tail-call optimisation and a default limit near 1000 frames, so prefer a loop when you can.", points: [
      "A function calls itself on a smaller version of the problem.",
      "A base case is what stops it, and its absence is a recursion error.",
      "Python has a recursion limit and does not optimise tail calls.",
    ] },

  { name: "Classes & instances", category: "Objects & classes", summary: "class defines a type; __init__ initialises an instance. Attributes on the class are shared, attributes on self are per-instance — a common source of surprise.", points: [
      "A class defines behaviour; instances hold the state.",
      "self is the instance and is passed explicitly, not implicitly.",
      "Class attributes are shared by every instance until one shadows them.",
    ] },
  { name: "Inheritance & MRO", category: "Objects & classes", summary: "Subclasses extend behaviour, super() delegates along the method resolution order. Composition is usually the better answer to reuse.", points: [
      "A subclass extends a base, and the method resolution order decides what wins.",
      "super follows the resolution order rather than naming a parent directly.",
      "Multiple inheritance makes that order the thing that must be understood.",
    ] },
  { name: "Dunder methods", category: "Objects & classes", summary: "__repr__, __eq__, __len__, __iter__ and friends let your type work with built-in syntax. Implement __repr__ first — it pays for itself in debugging.", points: [
      "Special methods hook a class into the language's own operators.",
      "Implementing them is how a class behaves like a builtin.",
      "Defining equality without hashing makes the object unhashable.",
    ] },
  { name: "Dataclasses", category: "Objects & classes", summary: "@dataclass generates __init__, __repr__ and __eq__ from annotations. frozen=True makes instances hashable and immutable.", points: [
      "A decorator generates init, repr and comparison from annotated fields.",
      "The declaration is the schema, so there is no constructor to keep in step.",
      "A mutable default needs a factory rather than a literal.",
    ] },
  { name: "Properties", category: "Objects & classes", summary: "@property exposes a method as an attribute, so you can add validation or computation later without changing every call site.", points: [
      "An attribute access is backed by a method.",
      "It lets a plain attribute gain validation without changing its callers.",
      "Expensive work inside one hides a cost where readers expect none.",
    ] },
  { name: "Class & static methods", category: "Objects & classes", summary: "@classmethod receives the class and is the usual way to write alternative constructors; @staticmethod is a plain function that lives in the namespace.", points: [
      "A class method receives the class; a static method receives neither.",
      "A class method is the idiomatic alternative constructor.",
      "A static method is a plain function that lives in the class's namespace.",
    ] },

  { name: "Exceptions", category: "Errors & testing", summary: "Raise on failure rather than returning error codes. Catch the narrowest type that you can actually handle, and never a bare except.", points: [
      "Errors are raised as objects and caught by type.",
      "Exceptions are for exceptional flow, not for ordinary branching.",
      "Catching a broad type hides the errors nobody anticipated.",
    ] },
  { name: "try / except / finally", category: "Errors & testing", summary: "else runs when nothing raised, finally always runs. Python asks forgiveness rather than permission, so try/except often beats a pre-check.", points: [
      "except handles, else runs on success, finally always runs.",
      "finally runs even when the block returns or re-raises.",
      "Catching bare Exception also catches the bugs you wanted to see.",
    ] },
  { name: "Custom exceptions", category: "Errors & testing", summary: "Subclass Exception to give callers something specific to catch. One base class per package keeps a library's failures distinguishable from everything else.", points: [
      "A project-specific exception type carries its own meaning.",
      "Callers can catch precisely rather than by message matching.",
      "Inheriting from Exception rather than BaseException keeps it catchable normally.",
    ] },
  { name: "pytest", category: "Errors & testing", summary: "Plain assert statements, fixtures for setup, parametrize for tables of cases. The default test runner for almost every modern Python project.", points: [
      "Tests are plain functions using plain assert statements.",
      "Fixtures provide setup by parameter name rather than by inheritance.",
      "Parametrisation turns one test into a table of cases.",
    ] },
  { name: "Debugging", category: "Errors & testing", summary: "breakpoint() drops into the debugger, and a traceback is read bottom-up: the last frame is where it broke, the ones above say how it got there.", points: [
      "breakpoint drops into an interactive debugger at that line.",
      "Stepping through beats guessing from added print statements.",
      "A post-mortem debugger inspects the frame where the exception was raised.",
    ] },

  { name: "File I/O", category: "Files & data", summary: "open() with an explicit mode and encoding. Always specify encoding='utf-8' — the platform default differs and will bite you across machines.", points: [
      "Files are opened in text or binary mode and must be closed.",
      "Text mode decodes bytes, so an encoding is always involved.",
      "A file left open leaks a descriptor and may not be flushed.",
    ] },
  { name: "Context managers", category: "Files & data", summary: "The with statement guarantees cleanup even when an exception unwinds. contextlib.contextmanager turns a generator into one in a few lines.", points: [
      "with acquires a resource and releases it however the block exits.",
      "Release happens on an exception too, which try alone does not guarantee.",
      "contextlib turns a generator into a context manager with little code.",
    ] },
  { name: "pathlib", category: "Files & data", summary: "Path objects with / as the join operator, plus read_text, glob and mkdir. Replaces almost all string path manipulation and os.path.", points: [
      "Paths are objects with methods rather than strings to concatenate.",
      "The slash operator joins correctly on every platform.",
      "It replaces most of os.path with something readable.",
    ] },
  { name: "JSON", category: "Files & data", summary: "json.loads and json.dumps move between text and dicts. Anything beyond the built-in types needs a custom encoder or a conversion step.", points: [
      "Data converts between Python objects and JSON text.",
      "Only a few types map directly, so dates need a custom encoder.",
      "Loading untrusted JSON is safe; loading untrusted pickle is not.",
    ] },
  { name: "CSV", category: "Files & data", summary: "The csv module handles quoting and embedded newlines that a naive split(',') gets wrong. DictReader gives rows as dicts keyed by header.", points: [
      "Rows are read and written with quoting and delimiters handled.",
      "Splitting on commas by hand breaks on the first quoted field.",
      "DictReader keys rows by header, which survives a column moving.",
    ] },

  { name: "Type hints", category: "Typing", summary: "Annotations describing expected types. Ignored at runtime, but they drive editor completion and catch whole classes of mistake before you run anything.", points: [
      "Annotations declare intended types without affecting runtime behaviour.",
      "They are documentation the checker can verify and the reader can trust.",
      "Nothing is enforced at runtime unless a library chooses to.",
    ] },
  { name: "mypy", category: "Typing", summary: "The static checker that makes annotations enforceable. Adopt it incrementally with per-module strictness rather than turning everything on at once.", points: [
      "A static checker verifies annotations across the codebase.",
      "It catches a whole class of errors before anything runs.",
      "Strictness is configurable, so adoption can be gradual.",
    ] },
  { name: "Generics & Protocols", category: "Typing", summary: "Generics parameterise a container by its element type; Protocols describe structural typing — what a value can do rather than what it inherits from.", points: [
      "Generics parameterise a type; protocols describe a shape.",
      "A protocol is structural, so a class satisfies it without inheriting.",
      "That is how duck typing becomes checkable.",
    ] },

  { name: "async / await", category: "Async & concurrency", summary: "Coroutines that suspend at await instead of blocking. It buys concurrency for I/O-bound work and nothing at all for CPU-bound work.", points: [
      "A coroutine runs only when awaited or scheduled, never by being called.",
      "Calling a coroutine function returns a coroutine object and warns if it is never awaited.",
      "`asyncio.run()` is the documented entry point for the top-level coroutine.",
    ] },
  { name: "asyncio", category: "Async & concurrency", summary: "The event loop, tasks and gather. One blocking call anywhere in a coroutine stalls the entire loop, which is the usual cause of async that is not faster.", points: [
      "An event loop schedules coroutines, tasks and timers.",
      "Concurrency comes from tasks, which is what makes waits overlap.",
      "One blocking call inside the loop stalls everything on it.",
    ] },
  { name: "Threads & the GIL", category: "Async & concurrency", summary: "The global interpreter lock means threads help with I/O and not with CPU work. Free-threaded builds are changing this, but the default still applies.", points: [
      "Threads share memory, and one lock governs bytecode execution.",
      "I/O releases that lock, which is why threads still help I/O-bound work.",
      "`asyncio.to_thread` is the documented way to run a blocking call off the loop.",
    ] },
  { name: "Multiprocessing", category: "Async & concurrency", summary: "Separate processes sidestep the GIL for CPU-bound work, at the cost of pickling everything that crosses a process boundary.", points: [
      "Separate processes each get their own interpreter and memory.",
      "That is how CPU-bound work uses more than one core.",
      "Arguments are pickled, so unpicklable objects cannot cross.",
    ] },

  { name: "Modules & imports", category: "Modules & packaging", summary: "Every file is a module and every import runs it once, cached in sys.modules. Prefer absolute imports; the __main__ guard keeps a script importable.", points: [
      "A module is a file; a package is a directory of them.",
      "Imports execute the module once and cache it.",
      "A circular import fails on the half-initialised module, not at the cycle.",
    ] },
  { name: "Virtual environments", category: "Modules & packaging", summary: "python -m venv gives a project its own interpreter and packages, so two projects cannot fight over one dependency version. Never install into the system Python.", points: [
      "An isolated interpreter and package set lives per project.",
      "Isolation is what stops two projects fighting over one version.",
      "The environment is disposable and should not be committed.",
    ] },
  { name: "pip & dependencies", category: "Modules & packaging", summary: "Install and pin. A lockfile is what makes a build reproducible; a loose requirements.txt is a description of what worked once.", points: [
      "Packages install from an index into the active environment.",
      "Pinning is what makes an install reproducible later.",
      "Installing without an active environment writes to the system Python.",
    ] },
  { name: "pyproject.toml", category: "Modules & packaging", summary: "The single declarative file for build backend, metadata, dependencies and tool configuration. It replaced setup.py for new projects.", points: [
      "Project metadata, dependencies and tool configuration live in one file.",
      "It is the standard replacing setup.py and scattered config files.",
      "Most modern tools read their settings from it.",
    ] },

  { name: "collections", category: "Standard library", summary: "Counter, defaultdict, deque and namedtuple. Most hand-rolled counting and grouping loops are one of these in a single line.", points: [
      "Specialised containers cover counting, defaults, ordering and queues.",
      "Counter and defaultdict remove the most common dictionary boilerplate.",
      "deque appends and pops at both ends in constant time.",
    ] },
  { name: "itertools", category: "Standard library", summary: "Lazy building blocks for iteration — chain, groupby, product, islice — that compose pipelines without materialising the intermediate lists.", points: [
      "Iterator building blocks compose lazily over any iterable.",
      "Nothing is materialised, so infinite sequences are usable.",
      "chain, groupby and islice replace a lot of manual loop bookkeeping.",
    ] },
  { name: "datetime", category: "Standard library", summary: "Dates, times and deltas. Store and compute in timezone-aware UTC and convert only at the edges; naive datetimes are where the bugs live.", points: [
      "Dates, times, durations and time zones are represented as objects.",
      "A naive datetime has no zone, which is where most bugs start.",
      "Arithmetic yields timedelta, not a number.",
    ] },
  { name: "re", category: "Standard library", summary: "Regular expressions. Compile a pattern you reuse, use raw strings, and prefer a real parser once the pattern stops fitting on one line.", points: [
      "Regular expressions search, match, split and substitute text.",
      "Compiling once is worthwhile when a pattern is used repeatedly.",
      "Raw strings avoid escaping every backslash twice.",
    ] },

  { name: "NumPy", category: "Data & scientific", summary: "N-dimensional arrays with vectorised operations that run in C. The foundation nearly every other scientific Python library is built on.", points: [
      "Arrays hold uniform types and operate element-wise without loops.",
      "Vectorised operations run in compiled code, which is the speed.",
      "A slice is a view, so writing through it changes the original.",
    ] },
  { name: "pandas", category: "Data & scientific", summary: "DataFrames for labelled tabular data — loading, joining, grouping and reshaping. Chained assignment and silent copies are the things to learn early.", points: [
      "Tabular data is loaded, reshaped, grouped and aggregated.",
      "The index is what alignment is done on, not row position.",
      "Chained assignment may write to a copy rather than the frame.",
    ] },
  { name: "matplotlib", category: "Data & scientific", summary: "The plotting foundation. Use the object-oriented figure and axes interface rather than the stateful pyplot one for anything you intend to keep.", points: [
      "Plots are built from figures and axes with explicit control.",
      "The object-oriented interface scales where the stateful one does not.",
      "Rendering headless requires a non-interactive backend.",
    ] },
  { name: "Jupyter", category: "Data & scientific", summary: "Notebooks interleaving code, output and prose. Excellent for exploring and explaining; run order is hidden state, so move settled code into modules.", points: [
      "Code, output and prose live together in an executable notebook.",
      "Interleaved output is what makes exploration and explanation one artifact.",
      "Cells can run out of order, so a notebook can pass in a state no rerun reproduces.",
    ] },
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
