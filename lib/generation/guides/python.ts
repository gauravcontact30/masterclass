import type { TechnologyGuide } from "./index";
import { source } from "./shared";
import { PYTHON_LESSONS } from "@/lib/notes-python-fundamentals";

/**
 * Python, from first principles to what's new in 3.14 — grounded in the
 * official tutorial, library reference and "What's New in Python 3.14"
 * (released 7 October 2025) on docs.python.org.
 */
const guide: TechnologyGuide = {
  id: "python",
  technologyId: "python",
  topicId: "python-notes",
  level: "beginner",
  curriculum: {
    title: "Python: from first steps to Python 3.14",
    minutes: 240,
    objectives: [
      "Write readable Python with the right built-in types, f-strings and comprehensions.",
      "Design functions with defaults, keyword-only arguments and type hints.",
      "Handle errors with try/except/finally, context managers and the match statement.",
      "Model data with classes and dataclasses, and organise code into modules and packages.",
      "Use generators and asyncio for lazy and concurrent work.",
      "Explain and use the headline features of Python 3.14: t-strings, deferred annotations and free threading.",
    ],
    prerequisites: [
      "Python 3.14 installed from python.org (or 3.12+ for everything except the 3.14 lesson).",
      "A terminal and a code editor.",
    ],
    lessons: [
      {
        title: "Values, names and the core types",
        diagram: {
          kind: "tree",
          caption: "Everything in Python is an object with a type. Names are labels bound to objects, so two names can point at the same list — which is why mutability matters.",
          items: [
            { label: "Immutable", detail: "a new object is created on every 'change'" },
            { label: "int, float, complex", detail: "arbitrary-precision integers", depth: 1 },
            { label: "str", detail: "Unicode text", depth: 1 },
            { label: "tuple, frozenset, bytes", depth: 1 },
            { label: "bool, None", detail: "True/False and the absence of a value", depth: 1 },
            { label: "Mutable", detail: "changed in place; shared by every name bound to it" },
            { label: "list", detail: "ordered, growable", depth: 1 },
            { label: "dict", detail: "key-value, insertion-ordered", depth: 1 },
            { label: "set, bytearray", depth: 1 },
          ],
        },
        explanation: "- A variable is a name bound to an object; assignment never copies\n- Every object has a type: check it with type(x) or isinstance(x, int)\n- Immutable objects (int, str, tuple) cannot change; mutable ones (list, dict, set) can\n- Indentation is syntax: a block is the lines indented under a colon\n- f-strings format text inline: f\"{name} has {count} items\"",
        keyPoints: [
          { tone: "key", title: "Assignment binds names; it never copies", text: "A variable is a label attached to an object. Writing b = a attaches a second label to the same object, so changing a mutable object through b is visible through a as well. Use list(a), a.copy() or copy.deepcopy(a) when you need an independent copy.", example: "b = a; b.append(4)  # a changed too" },
          { tone: "tip", title: "Debug with self-documenting f-strings", text: "Adding = after an expression inside an f-string prints both the expression and its value, and format specs control precision, width and thousands separators without extra code.", example: "f\"{total=:,.2f}\"  # total=1,234.50" },
          { tone: "warning", title: "Floats are binary approximations", text: "0.1 + 0.2 is 0.30000000000000004 because most decimal fractions cannot be stored exactly in binary. Compare floats with math.isclose(), and use decimal.Decimal (or integer paise) for money.", example: "Decimal(\"0.1\") + Decimal(\"0.2\") == Decimal(\"0.3\")" },
        ],
        example: "- total = 3 binds the name total to the int object 3\n- items = [1, 2]; alias = items; alias.append(3) changes items too\n- name = 'Asha'; name.upper() returns a new string, name is unchanged\n- f\"{price:.2f}\" formats 3.14159 as 3.14",
        useCase: {
          scenario: "A script reads prices from a CSV and prints a receipt, but totals come out as 10.299999999999999.",
          example: "Parse each price with Decimal(row['price']) instead of float(...), sum the Decimals, and print with f\"{total:.2f}\".",
          usage: "Decimal keeps exact base-10 arithmetic, so every rupee and paisa adds up the way an accountant expects.",
        },
        code: "from decimal import Decimal\n\nname = \"Asha\"\nscores = [88, 92, 79]          # list: mutable\npoint = (3, 4)                 # tuple: immutable\nprofile = {\"name\": name, \"city\": \"Pune\"}\n\nalias = scores\nalias.append(95)\nprint(scores)                  # [88, 92, 79, 95] - same object\n\naverage = sum(scores) / len(scores)\nprint(f\"{name} averages {average:.1f}\")\nprint(f\"{len(scores)=}\")        # len(scores)=4\n\nprint(0.1 + 0.2 == 0.3)                             # False\nprint(Decimal(\"0.1\") + Decimal(\"0.2\") == Decimal(\"0.3\"))  # True",
        apiReference: [
          {
            name: "f-string",
            kind: "syntax",
            signature: "f\"text {expression!conversion:format_spec} text\"",
            params: [
              { name: "expression", type: "any expression", description: "Evaluated at runtime and inserted into the string." },
              { name: "!r / !s", type: "conversion", description: "Use repr() or str() of the value." },
              { name: "format_spec", type: "mini-language", description: "Width, precision and type, e.g. :>8, :.2f, :,d." },
            ],
            returns: "A str with every replacement field filled in.",
            notes: "Add = after the expression (f\"{x=}\") to print both the source text and the value.",
          },
        ],
        exercise: "- Bind two names to one list and prove they share it with 'is'\n- Format 1234567.891 as 1,234,567.89 with an f-string\n- Show that a tuple cannot be changed but a list inside it can",
        checkpoint: "- What does b = a do when a is a list?\n- Why should you write x is None rather than x == None?\n- Which types would you use for money, and why?",
        mistake: "- Do not use a mutable object as a default you expect to be fresh each time\n- Do not rely on float equality; compare with math.isclose or use Decimal\n- Do not mix tabs and spaces for indentation",
        interview: [
          {
            question: "What is the difference between 'is' and '==' in Python?",
            definition: "'==' compares values using __eq__; 'is' checks whether two names refer to the very same object.",
            answer: "Two separate lists with the same items are == but not 'is'. Use 'is' only for identity checks such as x is None or sentinels. Small ints and interned strings may appear to be the same object, but that is an implementation detail you must not rely on.",
            syntax: "a == b   # equal values\na is b   # same object",
            code: "a = [1, 2]\nb = [1, 2]\nc = a\nprint(a == b)  # True: same contents\nprint(a is b)  # False: different objects\nprint(a is c)  # True: same object",
            similar: [
              { question: "Is a Python variable a box that holds a value?", answer: "No. It is a name bound to an object; several names can be bound to one object." },
              { question: "Which built-in types are immutable?", answer: "int, float, complex, bool, str, tuple, frozenset, bytes and None." },
            ],
          },
        ],
      },
      {
        title: "Collections and comprehensions",
        diagram: {
          kind: "split",
          caption: "Pick the collection by how you will use it: order and duplicates, lookup by key, or fast membership tests.",
          headings: ["Ordered sequences", "Lookup and membership"],
          items: [
            { label: "list", detail: "ordered, mutable; append, sort, slice", group: 0 },
            { label: "tuple", detail: "ordered, immutable; records and dict keys", group: 0 },
            { label: "str", detail: "an immutable sequence of characters", group: 0 },
            { label: "dict", detail: "key -> value, average O(1) lookup", group: 1 },
            { label: "set", detail: "unique items, fast 'in', set algebra", group: 1 },
            { label: "collections.Counter", detail: "a dict that counts things", group: 1 },
          ],
        },
        explanation: "- Sequences support indexing and slicing: items[0], items[-1], items[1:3]\n- A dict maps hashable keys to values and preserves insertion order\n- A set stores unique items and answers 'x in s' in constant time on average\n- Comprehensions build collections in one readable expression\n- Unpacking assigns several names at once: first, *rest = items",
        keyPoints: [
          { tone: "key", title: "Pick the collection by how you will read it", text: "Use a list for ordered items you index or sort, a tuple for fixed records, a dict for lookup by key, and a set for uniqueness and fast membership. Membership in a set or dict is O(1) on average, while a list is O(n).", example: "if user_id in allowed_ids:  # make allowed_ids a set" },
          { tone: "tip", title: "Comprehensions say what, not how", text: "A comprehension builds a list, set or dict in one readable expression with an optional filter. Switch the brackets to parentheses to get a lazy generator that never builds the whole collection in memory.", example: "{w: len(w) for w in words if w.isalpha()}" },
          { tone: "warning", title: "Only hashable values can be keys", text: "Dict keys and set members must be immutable (hashable): str, int, tuple and frozenset work, but list, dict and set raise TypeError. Convert a list to a tuple when you need it as a key.", example: "counts[tuple(coords)] += 1" },
        ],
        example: "- words = ['to', 'be', 'or', 'not', 'to', 'be']\n- unique = set(words) gives {'to', 'be', 'or', 'not'}\n- lengths = {w: len(w) for w in unique} is a dict comprehension\n- Counter(words).most_common(1) returns [('to', 2)]",
        useCase: {
          scenario: "You need the three most common error codes in a log file with thousands of lines.",
          example: "Extract each code with a comprehension, then Counter(codes).most_common(3) returns the top three with their counts.",
          usage: "The standard library does the counting and sorting, so the whole report is three readable lines.",
        },
        code: "from collections import Counter\n\nlines = [\n    \"ERROR 500 /checkout\",\n    \"INFO 200 /home\",\n    \"ERROR 404 /old-page\",\n    \"ERROR 500 /checkout\",\n]\n\n# list comprehension with a filter\nerrors = [line.split()[1] for line in lines if line.startswith(\"ERROR\")]\nprint(errors)                     # ['500', '404', '500']\n\n# dict and set comprehensions\nby_path = {line.split()[2]: line.split()[1] for line in lines}\nstatuses = {line.split()[1] for line in lines}\n\nprint(Counter(errors).most_common(1))   # [('500', 2)]\n\nfirst, *rest = errors             # unpacking\nfor index, code in enumerate(errors, start=1):\n    print(index, code)",
        apiReference: [
          {
            name: "dict.get",
            kind: "method",
            signature: "d.get(key, default=None)",
            params: [
              { name: "key", type: "hashable", description: "The key to look up." },
              { name: "default", type: "any", description: "Returned when the key is missing (None by default)." },
            ],
            returns: "The value for key, or default. Never raises KeyError.",
          },
          {
            name: "zip",
            kind: "built-in",
            signature: "zip(*iterables, strict=False)",
            params: [{ name: "strict", type: "bool", description: "Raise ValueError if the iterables have different lengths." }],
            returns: "An iterator of tuples pairing items position by position.",
          },
        ],
        exercise: "- Count word frequencies in a sentence with Counter\n- Build a dict of squares for 1-10 with a comprehension\n- Find the words two lists share using set intersection (&)",
        checkpoint: "- When would you choose a set over a list?\n- What is the difference between [x for x in data] and (x for x in data)?\n- Why can a tuple be a dict key but a list cannot?",
        mistake: "- Do not modify a list while iterating over it; build a new list instead\n- Do not test membership in a large list in a loop; convert it to a set first\n- Do not nest comprehensions so deeply that a plain loop would read better",
        interview: [
          {
            question: "What is the time complexity of 'x in collection' for a list, a set and a dict?",
            definition: "Membership in a list scans items one by one; sets and dicts use a hash table.",
            answer: "For a list it is O(n) because every element may be compared. For a set, and for keys of a dict, it is O(1) on average because the hash of x selects a bucket directly. This is why converting a list to a set before many lookups is a common optimisation.",
            code: "allowed = set(load_allowed_ids())   # O(n) once\nfor order in orders:\n    if order.user_id in allowed:      # O(1) each time\n        process(order)",
            similar: [
              { question: "What makes an object hashable?", answer: "It has a __hash__ that never changes during its lifetime and an __eq__ consistent with it; built-in immutable types qualify." },
            ],
          },
        ],
      },
      {
        title: "Functions, arguments and type hints",
        diagram: {
          kind: "flow",
          caption: "How Python binds call arguments to parameters, left to right. Parameters after * must be passed by keyword; parameters before / must be positional.",
          items: [
            { label: "Positional-only (before /)", detail: "def f(a, b, /) - callers cannot use names" },
            { label: "Positional-or-keyword", detail: "the default kind of parameter" },
            { label: "*args", detail: "collects extra positional arguments as a tuple" },
            { label: "Keyword-only (after * or *args)", detail: "must be named at the call site" },
            { label: "**kwargs", detail: "collects extra keyword arguments as a dict" },
          ],
        },
        explanation: "- def defines a function; return sends a value back (None if omitted)\n- Defaults make parameters optional, and keyword arguments make calls self-documenting\n- *args and **kwargs accept any number of extra arguments\n- Type hints document intent and let tools like mypy or Pyright check your code\n- Functions are objects: pass them around, return them, store them in dicts",
        keyPoints: [
          { tone: "key", title: "Defaults are evaluated once, at def time", text: "A default value is created when the function is defined, not on each call. A mutable default such as [] is therefore shared by every call, leaking data between them. Use None and create the object inside the function.", example: "def add(item, bucket=None):\n    bucket = [] if bucket is None else bucket" },
          { tone: "tip", title: "Keyword-only flags make call sites readable", text: "Parameters placed after a bare * must be passed by name. That turns cryptic calls like notify(u, True, False) into self-explanatory ones and lets you add new options later without breaking callers.", example: "def notify(user, *, email=True, sms=False): ..." },
          { tone: "warning", title: "Type hints are not runtime checks", text: "Python does not enforce annotations when the program runs; they document intent and are checked by tools such as mypy, Pyright or your IDE. Validate untrusted input explicitly, for example with pydantic or manual checks.", example: "def area(r: float) -> float: ...  # area('3') still runs" },
        ],
        example: "- def area(width: float, height: float = 1.0) -> float: return width * height\n- area(3) returns 3.0, area(3, height=2) returns 6.0\n- def total(*prices): return sum(prices) accepts total(1, 2, 3)\n- sorted(users, key=lambda u: u.age) passes a small function as an argument",
        useCase: {
          scenario: "A shared helper that sends notifications keeps growing boolean flags, and calls like notify(user, True, False) are unreadable.",
          example: "Change the signature to def notify(user, *, email=True, sms=False) so every call reads notify(user, sms=True).",
          usage: "Keyword-only flags make call sites self-explanatory and let you add options later without breaking positional callers.",
        },
        code: "from collections.abc import Callable\n\ndef add_item(item: str, bucket: list[str] | None = None) -> list[str]:\n    \"\"\"Return a new bucket (or the given one) with item appended.\"\"\"\n    if bucket is None:          # fresh list on every call\n        bucket = []\n    bucket.append(item)\n    return bucket\n\ndef notify(user: str, *, email: bool = True, sms: bool = False) -> str:\n    channels = [name for name, on in ((\"email\", email), (\"sms\", sms)) if on]\n    return f\"{user} via {', '.join(channels)}\"\n\ndef apply_twice(fn: Callable[[int], int], value: int) -> int:\n    return fn(fn(value))\n\nprint(add_item(\"a\"), add_item(\"b\"))     # ['a'] ['b']\nprint(notify(\"asha\", sms=True))         # asha via email, sms\nprint(apply_twice(lambda n: n * 3, 2))  # 18",
        apiReference: [
          {
            name: "def",
            kind: "statement",
            signature: "def name(pos_only, /, normal, *args, kw_only, **kwargs) -> ReturnType:",
            params: [
              { name: "/", type: "marker", description: "Parameters before it are positional-only." },
              { name: "*args", type: "tuple", description: "Extra positional arguments." },
              { name: "*", type: "marker", description: "Parameters after a bare * are keyword-only." },
              { name: "**kwargs", type: "dict", description: "Extra keyword arguments." },
            ],
            returns: "A function object bound to name.",
            notes: "Annotations are stored on the function and, since Python 3.14, evaluated lazily (see the 3.14 lesson).",
          },
        ],
        exercise: "- Write a function with a keyword-only flag and call it both correctly and incorrectly\n- Fix the mutable default bug in def log(msg, history=[])\n- Sort a list of dicts by two keys using key=lambda",
        checkpoint: "- When is a default value evaluated?\n- What does a bare * in a parameter list do?\n- Are type hints checked when the program runs?",
        mistake: "- Do not use mutable defaults; use None and create the object inside\n- Do not hide real errors with a broad **kwargs that silently ignores typos\n- Do not write long lambdas; name the function with def instead",
        interview: [
          {
            question: "Explain *args and **kwargs with an example.",
            definition: "*args collects extra positional arguments into a tuple; **kwargs collects extra keyword arguments into a dict.",
            answer: "They let a function accept a variable number of arguments, and the same * and ** operators unpack sequences and dicts at a call site. A common use is a wrapper or decorator that forwards whatever it receives to the wrapped function.",
            syntax: "def f(*args, **kwargs): ...\nf(*items, **options)",
            code: "import functools\n\ndef logged(fn):\n    @functools.wraps(fn)\n    def wrapper(*args, **kwargs):\n        print(f\"calling {fn.__name__} {args} {kwargs}\")\n        return fn(*args, **kwargs)\n    return wrapper\n\n@logged\ndef greet(name, *, punctuation=\"!\"):\n    return f\"Hello {name}{punctuation}\"\n\ngreet(\"Ravi\", punctuation=\"?\")",
            similar: [
              { question: "What does functools.wraps do in a decorator?", answer: "It copies the wrapped function's name, docstring and other metadata onto the wrapper." },
              { question: "What is the mutable default argument pitfall?", answer: "A default like [] is created once and shared by every call, so changes leak between calls." },
            ],
          },
        ],
      },
      {
        title: "Control flow, errors and context managers",
        diagram: {
          kind: "flow",
          caption: "try/except/else/finally: else runs only when nothing was raised, and finally always runs, making it the place for cleanup.",
          items: [
            { label: "try", detail: "the code that might fail" },
            { label: "except SomeError as err", detail: "handle the specific failure you expect" },
            { label: "else", detail: "runs only if try raised nothing" },
            { label: "finally", detail: "always runs: release resources here" },
          ],
        },
        explanation: "- if/elif/else, for and while cover most flow; for loops iterate any iterable\n- match compares a value against patterns and destructures it (structural pattern matching)\n- Raise exceptions for errors; catch the specific type you can handle\n- A with block uses a context manager that guarantees cleanup, such as closing a file\n- Python 3.14 lets except list several types without brackets when there is no 'as'",
        keyPoints: [
          { tone: "key", title: "Catch the exceptions you can actually handle", text: "Name specific exception types in except clauses and let everything else propagate. A bare except also swallows KeyboardInterrupt and real bugs, making failures silent and hard to trace. Chain context with raise ... from err.", example: "except FileNotFoundError, PermissionError:  # 3.14 syntax" },
          { tone: "tip", title: "Let with blocks own cleanup", text: "A context manager guarantees cleanup even when the block raises: files close, locks release, transactions roll back. Write your own with contextlib.contextmanager, putting teardown in a finally block after yield.", example: "with open(path, encoding=\"utf-8\") as f:\n    data = f.read()" },
          { tone: "warning", title: "Never return from a finally block", text: "return, break or continue inside finally silently discard any exception that is propagating. Python 3.14 (PEP 765) now emits a SyntaxWarning for it; keep finally for cleanup only.", example: "finally:\n    conn.close()  # cleanup, no return" },
        ],
        example: "- match command.split(): case ['go', direction]: move(direction)\n- case ['quit' | 'exit']: stop() matches either word\n- try: port = int(value) / except ValueError: port = 8080\n- with open('notes.txt', encoding='utf-8') as f: text = f.read()",
        useCase: {
          scenario: "A CLI tool must parse commands like 'add milk 2' or 'remove milk' and reject anything else with a helpful message.",
          example: "match words: case ['add', item, qty] if qty.isdigit(): ... / case ['remove', item]: ... / case _: print('Unknown command').",
          usage: "Patterns both check the shape and bind the parts, replacing a tangle of len() checks and index lookups.",
        },
        code: "def handle(command: str) -> str:\n    match command.split():\n        case [\"add\", item, qty] if qty.isdigit():\n            return f\"added {qty} x {item}\"\n        case [\"remove\", item]:\n            return f\"removed {item}\"\n        case [\"quit\" | \"exit\"]:\n            return \"bye\"\n        case _:\n            return \"unknown command\"\n\ndef read_port(path: str) -> int:\n    try:\n        with open(path, encoding=\"utf-8\") as f:\n            value = f.read().strip()\n        port = int(value)\n    except FileNotFoundError, PermissionError:   # Python 3.14+ syntax\n        port = 8080\n    except ValueError as err:\n        raise ValueError(f\"bad port in {path}\") from err\n    else:\n        print(\"read port from file\")\n    finally:\n        print(\"done reading config\")\n    return port\n\nprint(handle(\"add milk 2\"))",
        apiReference: [
          {
            name: "match",
            kind: "statement",
            signature: "match subject:\n    case pattern if guard:\n        ...\n    case _:\n        ...",
            params: [
              { name: "pattern", type: "literal | capture | sequence | mapping | class", description: "Checks the shape of the subject and binds names." },
              { name: "guard", type: "if expression", description: "An extra condition that must be true for the case to match." },
            ],
            returns: "Runs the first matching case block; nothing happens if no case matches and there is no case _.",
          },
        ],
        exercise: "- Write a match statement that handles dicts like {'type': 'circle', 'r': 2}\n- Wrap int(input()) so a bad value prints a friendly message and retries\n- Write your own context manager with contextlib.contextmanager that times a block",
        checkpoint: "- When does the else block of a try statement run?\n- What does case _ do?\n- Why does 'raise ... from err' help when debugging?",
        mistake: "- Do not use bare except: or except Exception: pass to hide failures\n- Do not return from a finally block; it discards the active exception\n- Do not open files without a with block or an explicit close",
        interview: [
          {
            question: "What is a context manager and how do you write one?",
            definition: "An object with __enter__ and __exit__ methods that a with statement uses to set up and reliably tear down a resource.",
            answer: "The with statement calls __enter__ at the start and __exit__ at the end, even if the block raises. You can write a class with those methods, or decorate a generator with contextlib.contextmanager: code before yield is setup, code after it is cleanup, ideally in a finally block.",
            code: "import time\nfrom contextlib import contextmanager\n\n@contextmanager\ndef timer(label: str):\n    start = time.perf_counter()\n    try:\n        yield\n    finally:\n        elapsed = time.perf_counter() - start\n        print(f\"{label}: {elapsed:.3f}s\")\n\nwith timer(\"load\"):\n    data = [n * n for n in range(1_000_000)]",
            similar: [
              { question: "What does __exit__ returning True mean?", answer: "It tells Python the exception was handled, so it is suppressed. Return False or None to let it propagate." },
            ],
          },
        ],
      },
      {
        title: "Classes, dataclasses and protocols",
        diagram: {
          kind: "split",
          caption: "Write a plain class when behaviour matters most; reach for a dataclass when the object is mainly a bundle of typed fields.",
          headings: ["Plain class", "@dataclass"],
          items: [
            { label: "You write __init__", detail: "full control over construction", group: 0 },
            { label: "Add __repr__ / __eq__ yourself", detail: "or inherit object's defaults", group: 0 },
            { label: "Best for rich behaviour", detail: "services, stateful objects", group: 0 },
            { label: "__init__, __repr__, __eq__ generated", detail: "from the annotated fields", group: 1 },
            { label: "frozen=True, slots=True", detail: "immutability and lower memory", group: 1 },
            { label: "Best for records", detail: "DTOs, config, value objects", group: 1 },
          ],
        },
        explanation: "- A class bundles data (attributes) and behaviour (methods); self is the instance\n- Dunder methods like __repr__, __eq__ and __len__ plug objects into Python's syntax\n- @property exposes computed values as attributes\n- @dataclass generates the boilerplate for classes that mostly hold data\n- typing.Protocol describes behaviour structurally: any object with the right methods fits",
        keyPoints: [
          { tone: "key", title: "Dataclasses remove record boilerplate", text: "@dataclass generates __init__, __repr__ and __eq__ from annotated fields. Add frozen=True for immutable, hashable value objects and slots=True for faster attribute access and lower memory.", example: "@dataclass(frozen=True, slots=True)\nclass Point:\n    x: float\n    y: float" },
          { tone: "tip", title: "Protocols describe behaviour, not ancestry", text: "A typing.Protocol lists the methods an object must have. Any class with those methods fits, no inheritance required, which keeps code loosely coupled while type checkers still verify it.", example: "class Priced(Protocol):\n    def total(self) -> float: ..." },
          { tone: "warning", title: "Mutable field defaults need default_factory", text: "A dataclass field like items: list = [] would be shared across instances, so dataclasses reject it. Use field(default_factory=list) so every instance gets its own fresh list.", example: "items: list[str] = field(default_factory=list)" },
        ],
        example: "- @dataclass class Point: x: float; y: float gives Point(1, 2) with a readable repr\n- Point(1, 2) == Point(1, 2) is True because __eq__ compares fields\n- @property def area(self): return self.w * self.h reads as shape.area\n- class Drawable(Protocol): def draw(self) -> None: ...",
        useCase: {
          scenario: "An order service passes orders around as dicts, and a typo like order['totl'] only fails at runtime in production.",
          example: "Define @dataclass(frozen=True, slots=True) class Order with typed fields and a total property; construct it once when parsing input.",
          usage: "Editors autocomplete fields, type checkers catch typos, and frozen instances cannot be changed by accident as they move through the system.",
        },
        code: "from dataclasses import dataclass, field\nfrom typing import Protocol\n\n@dataclass(frozen=True, slots=True)\nclass LineItem:\n    name: str\n    price: float\n    qty: int = 1\n\n    @property\n    def subtotal(self) -> float:\n        return self.price * self.qty\n\n@dataclass\nclass Order:\n    id: str\n    items: list[LineItem] = field(default_factory=list)\n\n    def total(self) -> float:\n        return sum(item.subtotal for item in self.items)\n\nclass Priced(Protocol):\n    def total(self) -> float: ...\n\ndef invoice(thing: Priced) -> str:          # any object with total()\n    return f\"Amount due: {thing.total():.2f}\"\n\norder = Order(\"A1\", [LineItem(\"pen\", 20.0, 3), LineItem(\"book\", 250.0)])\nprint(order)\nprint(invoice(order))                        # Amount due: 310.00",
        apiReference: [
          {
            name: "@dataclass",
            kind: "decorator",
            signature: "@dataclass(*, init=True, repr=True, eq=True, order=False, frozen=False, slots=False, kw_only=False)",
            params: [
              { name: "frozen", type: "bool", description: "Make instances immutable (assignment raises FrozenInstanceError)." },
              { name: "slots", type: "bool", description: "Generate __slots__ for faster attribute access and less memory." },
              { name: "order", type: "bool", description: "Generate <, <=, >, >= comparing fields as tuples." },
              { name: "kw_only", type: "bool", description: "Make every field keyword-only in __init__." },
            ],
            returns: "The same class with generated dunder methods.",
          },
        ],
        exercise: "- Model a BankAccount class with deposit/withdraw that refuses overdrafts\n- Convert a dict-based record to a frozen dataclass\n- Write a Protocol with one method and two unrelated classes that satisfy it",
        checkpoint: "- What methods does @dataclass generate for you?\n- Why does a mutable dataclass default need default_factory?\n- How does a Protocol differ from an abstract base class?",
        mistake: "- Do not build deep inheritance trees for code reuse; compose objects\n- Do not mutate a frozen dataclass; use dataclasses.replace() to copy with changes\n- Do not forget self as the first parameter of an instance method",
        interview: [
          {
            question: "What is the difference between @staticmethod, @classmethod and a regular method?",
            definition: "A regular method receives the instance (self), a classmethod receives the class (cls), and a staticmethod receives neither.",
            answer: "Use a regular method for behaviour that needs instance state. Use @classmethod for alternative constructors such as from_dict, because cls also works correctly for subclasses. Use @staticmethod for a helper that logically belongs to the class but needs no instance or class data.",
            code: "from dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    age: int\n\n    @classmethod\n    def from_dict(cls, data: dict) -> \"User\":\n        return cls(data[\"name\"], int(data[\"age\"]))\n\n    @staticmethod\n    def is_adult(age: int) -> bool:\n        return age >= 18\n\n    def greeting(self) -> str:\n        return f\"Hi {self.name}\"",
            similar: [
              { question: "What does __slots__ do?", answer: "It declares a fixed set of attributes, removing the per-instance __dict__ to save memory and speed up access." },
            ],
          },
        ],
      },
      {
        title: "Modules, packages and virtual environments",
        diagram: {
          kind: "tree",
          caption: "A modern Python project: an isolated virtual environment, a pyproject.toml describing the package, and a src/ layout that keeps imports honest.",
          items: [
            { label: "my-app/" },
            { label: ".venv/", detail: "python -m venv .venv (never committed)", depth: 1 },
            { label: "pyproject.toml", detail: "name, version, dependencies, tools", depth: 1 },
            { label: "src/my_app/", detail: "the importable package", depth: 1 },
            { label: "__init__.py", detail: "marks a regular package", depth: 2 },
            { label: "__main__.py", detail: "runs with python -m my_app", depth: 2 },
            { label: "prices.py", detail: "a module: import my_app.prices", depth: 2 },
            { label: "tests/", detail: "test_prices.py for pytest", depth: 1 },
          ],
        },
        explanation: "- A module is a .py file; a package is a directory of modules with __init__.py\n- import runs a module once and caches it in sys.modules\n- A virtual environment isolates each project's dependencies from the system Python\n- pyproject.toml is the standard place for project metadata and tool settings\n- if __name__ == '__main__': runs code only when the file is executed directly",
        keyPoints: [
          { tone: "key", title: "One virtual environment per project", text: "A venv isolates a project's interpreter and packages from the system and from other projects, so two projects can depend on different versions safely. Create it once, activate it, and declare dependencies in pyproject.toml.", example: "python -m venv .venv && .venv\\Scripts\\activate" },
          { tone: "tip", title: "Run tools through python -m", text: "python -m pip, python -m pytest and python -m venv always use the interpreter you are running, avoiding the classic 'installed it but import fails' mismatch between several Pythons on one machine.", example: "python -m pip install -e ." },
          { tone: "warning", title: "Do not shadow standard library modules", text: "A local file named random.py, json.py or email.py is imported instead of the real module and breaks code in confusing ways. Give your modules distinctive names and keep sources in a src/ package.", example: "src/my_app/prices.py  # not random.py" },
        ],
        example: "- python -m venv .venv creates an isolated environment\n- python -m pip install requests adds a dependency to it\n- from my_app.prices import total imports one name from a module\n- python -m my_app runs src/my_app/__main__.py",
        useCase: {
          scenario: "Two projects on one laptop need different versions of the same library, and installing one breaks the other.",
          example: "Give each project its own .venv and declare dependencies in pyproject.toml; activate the right environment before running either.",
          usage: "Each project gets exactly the versions it was tested with, and a teammate can recreate the environment from the file.",
        },
        code: "# pyproject.toml\n# [project]\n# name = \"my-app\"\n# version = \"0.1.0\"\n# requires-python = \">=3.14\"\n# dependencies = [\"httpx>=0.28\"]\n\n# src/my_app/prices.py\nTAX_RATE = 0.18\n\ndef with_tax(amount: float) -> float:\n    return round(amount * (1 + TAX_RATE), 2)\n\n# src/my_app/__main__.py\nimport sys\nfrom my_app.prices import with_tax\n\ndef main(argv: list[str]) -> int:\n    for value in argv:\n        print(value, \"->\", with_tax(float(value)))\n    return 0\n\nif __name__ == \"__main__\":\n    raise SystemExit(main(sys.argv[1:]))\n\n# Terminal:\n#   python -m venv .venv\n#   .venv\\Scripts\\activate      (Windows)\n#   python -m pip install -e .\n#   python -m my_app 100 250",
        apiReference: [
          {
            name: "python -m venv",
            kind: "command",
            signature: "python -m venv [--prompt NAME] [--upgrade-deps] ENV_DIR",
            params: [
              { name: "ENV_DIR", type: "path", description: "Where to create the environment, conventionally .venv." },
              { name: "--upgrade-deps", type: "flag", description: "Upgrade pip to the latest version inside the new environment." },
            ],
            returns: "A directory with its own interpreter, site-packages and activation scripts.",
          },
        ],
        exercise: "- Create a venv, install one package, and list it with python -m pip list\n- Split a script into a package with two modules and import between them\n- Add an if __name__ == '__main__' block and run the module both ways",
        checkpoint: "- What is the difference between a module and a package?\n- Why use python -m pip instead of plain pip?\n- What does the __name__ == '__main__' check protect against?",
        mistake: "- Do not install project packages into the system Python\n- Do not commit the .venv folder; commit pyproject.toml (and a lock file) instead\n- Do not rely on the current directory for imports; install the package in editable mode",
      },
      {
        title: "Iterators, generators and asyncio",
        diagram: {
          kind: "flow",
          caption: "A generator is paused at each yield and resumed on the next request, so it produces one value at a time without building the whole sequence in memory.",
          items: [
            { label: "Call the generator function", detail: "returns a generator object; no code runs yet" },
            { label: "next() / for loop asks for a value", detail: "code runs until the next yield" },
            { label: "yield value", detail: "hands one value out and pauses, keeping local state" },
            { label: "Resume on the next request", detail: "continues right after the yield" },
            { label: "Function returns", detail: "StopIteration ends the loop" },
          ],
        },
        explanation: "- An iterable produces an iterator; for loops call next() until StopIteration\n- A function with yield is a generator: it produces values lazily\n- Generator expressions (x * x for x in data) are lazy comprehensions\n- async def defines a coroutine; await pauses it until the awaited work finishes\n- asyncio runs many I/O-bound coroutines concurrently on one thread",
        keyPoints: [
          { tone: "key", title: "Generators produce values lazily", text: "A function containing yield returns a generator that computes one value per request and pauses in between. Memory stays flat no matter how large the sequence, which makes streaming files or infinite sequences practical.", example: "total = sum(x * x for x in range(10**8))" },
          { tone: "tip", title: "Use TaskGroup for concurrent I/O", text: "asyncio.TaskGroup (3.11+) starts several coroutines together and waits for all of them; if one fails the rest are cancelled and the errors surface as an ExceptionGroup. Overlapping waits turns 50 sequential requests into roughly one.", example: "async with asyncio.TaskGroup() as tg:\n    tg.create_task(fetch(url))" },
          { tone: "warning", title: "asyncio does not speed up CPU work", text: "async code runs on one thread and only helps while tasks wait on the network or disk. For CPU-bound work use processes, InterpreterPoolExecutor or the free-threaded build, and never call blocking time.sleep in async code.", example: "await asyncio.sleep(1)  # not time.sleep(1)" },
        ],
        example: "- def countdown(n): while n: yield n; n -= 1\n- list(countdown(3)) is [3, 2, 1]\n- sum(x * x for x in range(10**6)) streams values without a list\n- async with asyncio.TaskGroup() as tg: tg.create_task(fetch(url))",
        useCase: {
          scenario: "A script checks the status of 50 URLs one after another and takes 50 seconds because each request waits on the network.",
          example: "Make fetch an async def, create one task per URL inside an asyncio.TaskGroup, and gather the results.",
          usage: "The waits overlap, so the whole batch finishes in roughly the time of the slowest request.",
        },
        code: "import asyncio\n\ndef read_batches(rows: list[int], size: int):\n    \"\"\"Yield rows in chunks without copying the whole list.\"\"\"\n    for start in range(0, len(rows), size):\n        yield rows[start:start + size]\n\nfor batch in read_batches(list(range(7)), 3):\n    print(batch)            # [0, 1, 2] [3, 4, 5] [6]\n\nasync def fetch(name: str, delay: float) -> str:\n    await asyncio.sleep(delay)          # stands in for a network call\n    return f\"{name} done in {delay}s\"\n\nasync def main() -> None:\n    async with asyncio.TaskGroup() as tg:\n        tasks = [tg.create_task(fetch(f\"job{i}\", 0.5)) for i in range(5)]\n    print([task.result() for task in tasks])   # ~0.5s total, not 2.5s\n\nasyncio.run(main())",
        apiReference: [
          {
            name: "asyncio.TaskGroup",
            kind: "async context manager",
            signature: "async with asyncio.TaskGroup() as tg:\n    task = tg.create_task(coro)",
            params: [{ name: "coro", type: "Coroutine", description: "The coroutine to schedule as a task." }],
            returns: "On exit, waits for every task; if one fails the others are cancelled and the errors raise as an ExceptionGroup.",
            notes: "Python 3.14 adds python -m asyncio ps PID and pstree PID to inspect running tasks.",
          },
        ],
        exercise: "- Write a generator that yields Fibonacci numbers forever and take the first 10 with itertools.islice\n- Rewrite a list comprehension as a generator expression and compare memory with sys.getsizeof\n- Run three asyncio.sleep calls concurrently and time the total",
        checkpoint: "- What is the difference between an iterable and an iterator?\n- Why is a generator expression better than a list for sum()?\n- When does asyncio make a program faster, and when does it not?",
        mistake: "- Do not iterate the same generator twice; it is exhausted after one pass\n- Do not call blocking functions like time.sleep inside async code; use await asyncio.sleep\n- Do not forget to await a coroutine",
        interview: [
          {
            question: "What is the difference between a generator and a list comprehension?",
            definition: "A list comprehension builds every element immediately; a generator produces elements lazily, one per request.",
            answer: "A list stores all results in memory and can be iterated many times. A generator stores only its current state, so memory stays constant, but it can be consumed only once. Use a generator for large or infinite streams and a list when you need indexing, len() or repeated passes.",
            code: "squares_list = [n * n for n in range(5)]   # built now\nsquares_gen = (n * n for n in range(5))    # built on demand\nprint(sum(squares_gen))   # 30\nprint(sum(squares_gen))   # 0 - already exhausted",
            similar: [
              { question: "What does yield from do?", answer: "It delegates to a sub-iterator, yielding each of its values as if they came from the outer generator." },
            ],
          },
        ],
      },
      {
        title: "What's new in Python 3.14",
        diagram: {
          kind: "tree",
          caption: "The headline changes in Python 3.14, released on 7 October 2025, with their PEP numbers.",
          items: [
            { label: "Language" },
            { label: "t-strings (PEP 750)", detail: "t'...' returns a Template, not a str", depth: 1 },
            { label: "Deferred annotations (PEP 649/749)", detail: "evaluated lazily; new annotationlib", depth: 1 },
            { label: "except A, B: (PEP 758)", detail: "no brackets needed without 'as'", depth: 1 },
            { label: "Concurrency" },
            { label: "Free-threaded build supported (PEP 779)", detail: "no GIL; ~5-10% single-thread cost", depth: 1 },
            { label: "concurrent.interpreters (PEP 734)", detail: "multiple interpreters in the stdlib", depth: 1 },
            { label: "Standard library" },
            { label: "compression.zstd (PEP 784)", detail: "Zstandard compression built in", depth: 1 },
            { label: "sys.remote_exec (PEP 768)", detail: "attach debuggers: pdb -p PID", depth: 1 },
          ],
        },
        explanation: "- Template strings (t-strings) keep the static text and interpolated values separate\n- Annotations are no longer evaluated when a function or class is defined, so forward references just work\n- The free-threaded (no-GIL) build is officially supported, and InterpreterPoolExecutor offers true parallelism\n- compression.zstd adds fast Zstandard compression to the standard library\n- The REPL gains syntax highlighting and import auto-completion, and error messages suggest fixes",
        keyPoints: [
          { tone: "key", title: "t-strings return a Template, not a str", text: "A t-string (PEP 750) keeps static text and interpolated values separate, so a library can escape HTML, parameterise SQL or structure logs before combining them. The syntax matches f-strings; only the result type differs.", example: "render(t\"<p>Hello {name}</p>\")  # values escaped" },
          { tone: "tip", title: "Annotations are now evaluated lazily", text: "With PEP 649/749, annotations are computed only when requested, so forward references need no quotes and startup is cheaper. Read them with annotationlib.get_annotations, choosing VALUE, FORWARDREF or STRING format.", example: "get_annotations(fn, format=Format.STRING)" },
          { tone: "warning", title: "Free threading is a separate build", text: "The no-GIL build is officially supported in 3.14 but is a different interpreter with a small single-thread cost, and C extensions must declare support or the GIL is re-enabled. Measure before switching production workloads.", example: "python3.14t -c \"import sys; print(sys._is_gil_enabled())\"" },
        ],
        example: "- template = t'Try some {variety} cheese!' produces a Template object\n- list(template) gives ['Try some ', Interpolation('Stilton', 'variety', None, ''), ' cheese!']\n- from compression import zstd; zstd.compress(data) compresses bytes\n- whille True: now reports \"Did you mean 'while'?\"",
        useCase: {
          scenario: "A web app builds HTML snippets from user input with f-strings, and one crafted name injects a <script> tag.",
          example: "Accept a Template instead of a str in the render helper, so callers write render(t'<p>Hello {name}</p>') and the helper escapes every Interpolation's value before joining.",
          usage: "Escaping becomes impossible to forget, because the helper, not every caller, decides how interpolated values are treated.",
        },
        code: "from html import escape\nfrom string.templatelib import Template, Interpolation\n\ndef render(template: Template) -> str:\n    parts = []\n    for part in template:\n        if isinstance(part, Interpolation):\n            parts.append(escape(str(part.value)))   # escape values only\n        else:\n            parts.append(part)                      # trusted static text\n    return \"\".join(parts)\n\nname = \"<script>alert(1)</script>\"\nprint(render(t\"<p>Hello {name}</p>\"))\n# <p>Hello &lt;script&gt;alert(1)&lt;/script&gt;</p>\n\n# Deferred annotations: Node can be used before it is defined\ndef first_child(node: Node) -> Node | None:\n    return node.children[0] if node.children else None\n\nclass Node:\n    def __init__(self) -> None:\n        self.children: list[Node] = []\n\nfrom annotationlib import get_annotations, Format\nprint(get_annotations(first_child, format=Format.STRING))",
        apiReference: [
          {
            name: "string.templatelib.Template",
            kind: "class",
            signature: "t\"text {value}\"  ->  Template\ntemplate.strings, template.interpolations, iter(template)",
            params: [
              { name: "strings", type: "tuple[str, ...]", description: "The static text segments." },
              { name: "interpolations", type: "tuple[Interpolation, ...]", description: "Each has .value, .expression, .conversion and .format_spec." },
            ],
            returns: "A Template object; it is not a str until your code combines the parts.",
          },
          {
            name: "annotationlib.get_annotations",
            kind: "function",
            signature: "get_annotations(obj, *, globals=None, locals=None, eval_str=False, format=Format.VALUE)",
            params: [{ name: "format", type: "Format", description: "VALUE evaluates, FORWARDREF marks undefined names, STRING returns source text." }],
            returns: "A dict mapping names to annotations in the requested format.",
          },
        ],
        exercise: "- Write a t-string helper that upper-cases every interpolated value\n- Define a function annotated with a class declared later and read its annotations as strings\n- Compress and decompress some bytes with compression.zstd and compare sizes",
        checkpoint: "- What type does a t-string evaluate to, and why is that safer than an f-string?\n- What problem do deferred annotations solve?\n- What is the trade-off of the free-threaded build?",
        mistake: "- Do not pass a Template where a str is expected; combine it first\n- Do not assume every C extension supports free threading\n- Do not read __annotations__ directly in library code; use annotationlib.get_annotations",
        interview: [
          {
            question: "What are template strings (t-strings) in Python 3.14 and how do they differ from f-strings?",
            definition: "A t-string (PEP 750) is written t'...' and evaluates to a string.templatelib.Template object instead of a str.",
            answer: "An f-string immediately produces the final text. A t-string keeps the static strings and each interpolated value (with its expression and format spec) separate, so a function can process values before combining them: escaping HTML, parameterising SQL, or structured logging. The syntax is the same as f-strings; only the result type differs.",
            syntax: "template = t\"Hello {name}!\"\ntemplate.strings        # ('Hello ', '!')\ntemplate.interpolations # (Interpolation(...),)",
            similar: [
              { question: "What is the GIL, and what changes with free-threaded Python?", answer: "The Global Interpreter Lock lets only one thread run Python bytecode at a time. The free-threaded build removes it so threads run in parallel on many cores, at a small single-thread cost." },
              { question: "What does PEP 649 change about annotations?", answer: "Annotations are stored in lazily called annotate functions and evaluated only when requested, so forward references no longer need quotes." },
            ],
          },
        ],
      },
    ],
    project: "Build a command-line expense tracker: a package with a frozen Expense dataclass, a JSON file store opened with a context manager, a match-based command parser (add, list, total, export), a generator that streams expenses by month, and a render helper that formats the monthly report from a t-string. Ship it with a pyproject.toml, a virtual environment and one pytest test per command.",
    summary: "- Python names are bound to objects; know which types are mutable\n- Choose list, tuple, dict or set by how you will access the data, and build them with comprehensions\n- Design functions with keyword-only flags and None defaults, and document them with type hints\n- Catch specific exceptions, clean up with with/finally, and destructure input with match\n- Use dataclasses for records, protocols for behaviour, and a venv plus pyproject.toml for every project\n- Stream data with generators and overlap I/O with asyncio\n- Python 3.14 adds t-strings, lazy annotations, supported free threading and compression.zstd",
    glossary: [
      { term: "Binding", definition: "Attaching a name to an object; assignment creates bindings and never copies objects." },
      { term: "Mutable", definition: "An object whose value can change in place, such as a list, dict or set." },
      { term: "Comprehension", definition: "A concise expression that builds a list, set, dict or generator from an iterable." },
      { term: "Keyword-only argument", definition: "A parameter after * in a def that callers must pass by name." },
      { term: "Context manager", definition: "An object used by a with statement to set up and reliably clean up a resource." },
      { term: "Dataclass", definition: "A class decorated with @dataclass whose __init__, __repr__ and __eq__ are generated from annotated fields." },
      { term: "Protocol", definition: "A typing construct that describes required methods structurally, without inheritance." },
      { term: "Virtual environment", definition: "An isolated Python installation per project, created with python -m venv." },
      { term: "Generator", definition: "A function using yield that produces values lazily and can be consumed once." },
      { term: "Coroutine", definition: "An async def function's result; it runs when awaited or scheduled on the asyncio event loop." },
      { term: "Template string", definition: "A Python 3.14 t-string literal that evaluates to a Template of static strings and interpolations." },
      { term: "GIL", definition: "The Global Interpreter Lock, which the free-threaded build removes to allow parallel threads." },
    ],
    sources: [
      source("https://docs.python.org/3/tutorial/index.html", "The Python Tutorial"),
      source("https://docs.python.org/3/tutorial/datastructures.html", "Data Structures"),
      source("https://docs.python.org/3/tutorial/controlflow.html", "More Control Flow Tools"),
      source("https://docs.python.org/3/tutorial/errors.html", "Errors and Exceptions"),
      source("https://docs.python.org/3/library/dataclasses.html", "dataclasses — Data Classes"),
      source("https://docs.python.org/3/library/venv.html", "venv — Creation of virtual environments"),
      source("https://docs.python.org/3/library/asyncio-task.html", "Coroutines and Tasks"),
      source("https://docs.python.org/3/whatsnew/3.14.html", "What's New In Python 3.14"),
      source("https://docs.python.org/3/library/string.templatelib.html", "string.templatelib — Template strings"),
    ],
  },
};

export const PYTHON_CORE_LESSON_COUNT = guide.curriculum.lessons.length;
export default { ...guide, version: 2, curriculum: { ...guide.curriculum, minutes: guide.curriculum.minutes + PYTHON_LESSONS.length * 5, lessons: [...guide.curriculum.lessons, ...PYTHON_LESSONS] } } satisfies TechnologyGuide;
