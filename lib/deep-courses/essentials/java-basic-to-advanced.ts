import type { TopicEssentials } from "../types";

/** Java Basic to Advanced topics distilled: the idea each rests on, the answer to give when asked, and what to remember. */
export const ESSENTIALS: Record<string, TopicEssentials> = {
  "setup-first-program": {
    core: "Install one JDK, write a class with a main method, and compile and run it; everything else in Java builds on that cycle.",
    answer: "Install an LTS JDK (17, 21 or 25), set JAVA_HOME, and check it with java -version and javac -version. A program is a class whose public static void main(String[] args) is the entry point; compile it with javac and run it with java, or run a single file directly with java Hello.java. Use an IDE such as IntelliJ IDEA, Eclipse or VS Code for completion and debugging. Read input with Scanner (nextInt, nextLine), and follow the naming conventions: PascalCase classes, camelCase methods and variables, UPPER_SNAKE constants.",
    keyPoints: [
      "The file name must match the public class name.",
      "After nextInt(), call nextLine() once to consume the leftover newline before reading a full line.",
      "// is a line comment, /* */ a block comment, and /** */ a Javadoc comment.",
      "Java is case-sensitive: Main and main are different names.",
      "Keep one Scanner on System.in for the whole program; closing it closes System.in.",
    ],
  },
  "methods-recursion": {
    core: "A method names one task with inputs and an output; recursion solves a task by calling the same method on a smaller input until a base case.",
    answer: "A method has a return type, a name, parameters and a body, and arguments are always passed by value (for objects, the value is the reference). Overloading reuses a name with different parameter lists. Varargs (int... nums) accept any number of arguments, must come last, and arrive as an array. Local variables live only inside their block. A recursive method needs a base case and progress toward it; every call takes a stack frame, so very deep recursion throws StackOverflowError.",
    keyPoints: [
      "Overloads are chosen at compile time by the argument types: exact match, then widening, then boxing, then varargs.",
      "A method can have only one varargs parameter, and it must be the last.",
      "Changing a parameter variable inside a method never changes the caller's variable.",
      "Naive recursive Fibonacci is exponential: memoise it or write it as a loop.",
      "Methods should do one thing and be named with verbs: calculateTotal, isValid.",
    ],
  },
  "problem-solving-arrays-strings": {
    core: "Most beginner problems are a single pass with the right helper: a counter, a frequency table, two indexes, or a swap.",
    answer: "Linear search checks each element in O(n), and binary search needs sorted data and runs in O(log n). Count with a frequency array (int[26] for lowercase letters) or a HashMap. Reverse in place by swapping from both ends. A palindrome reads the same from both ends, which two indexes check. Two strings are anagrams when their character counts match. Matrix work uses nested loops: transposing swaps [i][j] with [j][i], and rotating 90° is a transpose followed by reversing each row.",
    keyPoints: [
      "Trace your loop on a two-element input and an empty input before running it.",
      "Use charAt(i) - 'a' to index a letter array.",
      "Compare strings with equals; == compares references.",
      "Off-by-one errors live in < versus <= and in length versus length − 1.",
      "Sorting first (O(n log n)) often turns a hard problem into a single easy pass.",
    ],
  },
  "oop-project": {
    core: "Good object-oriented design gives each class one clear responsibility and puts rules next to the data they protect.",
    answer: "Start from the requirements: nouns suggest classes (Book, Member, Loan) and verbs suggest methods (borrow, returnBook). Each class guards its own invariants, for example a Book cannot be lent twice, and keeps its fields private. Use interfaces for roles that can vary, such as a fine policy, and inheritance only for true is-a relationships. A service class coordinates the workflow, and a repository or collection stores the objects, which keeps the domain model consistent and testable.",
    keyPoints: [
      "Model behaviour, not just data: avoid classes that are only getters and setters.",
      "Validate in constructors so an invalid object cannot exist.",
      "Prefer composition (a Library has Books) to deep inheritance trees.",
      "Represent fixed categories (Genre, LoanStatus) with enums, not strings.",
      "Keep input and output (Scanner, printing) out of domain classes.",
    ],
  },
  "design-patterns": {
    core: "A design pattern is a proven, named solution to a recurring design problem; learn the problem each one solves, not just its code.",
    answer: "Singleton gives one shared instance; an enum is the simplest thread-safe form. Factory hides which class is created behind a method. Builder constructs objects with many optional parameters readably. Strategy swaps algorithms behind an interface, often as lambdas. Observer notifies subscribers when state changes. Adapter makes an incompatible interface fit the one callers expect. Decorator adds behaviour by wrapping an object that has the same interface, as java.io streams do.",
    keyPoints: [
      "There are creational patterns (Singleton, Factory, Builder), structural ones (Adapter, Decorator) and behavioural ones (Strategy, Observer).",
      "Singletons are global state: prefer dependency injection in larger applications.",
      "Records plus static factory methods replace many hand-written Builders for simple data.",
      "Decorator changes behaviour at run time; inheritance fixes it at compile time.",
      "Don't force patterns where there is no problem yet: start simple, then refactor toward one.",
    ],
  },
  "solid-clean-code": {
    core: "SOLID keeps code easy to change: small focused classes that depend on abstractions, which can be extended without being edited.",
    answer: "Single responsibility: a class has one reason to change. Open/closed: extend behaviour with new code, such as new implementations, rather than editing existing code. Liskov substitution: a subtype must work wherever its parent is expected without surprises. Interface segregation: many small interfaces beat one large one. Dependency inversion: high-level code depends on interfaces, and the concrete classes are injected. Clean code adds intention-revealing names, small functions, no duplication and tests that guard refactoring.",
    keyPoints: [
      "A Square that extends Rectangle with independent setters is the classic Liskov violation.",
      "Long switch statements on types usually mean polymorphism or a strategy is missing.",
      "Constructor injection makes dependency inversion concrete and testable.",
      "Name things for what they mean (overdueDays), not for their type (int1).",
      "Refactor in small steps, with tests passing after each one.",
    ],
  },
  "collections-in-practice": {
    core: "Choose a collection by the question you will ask most often: by position (List), is it present (Set), find by key (Map), or what's next (Queue).",
    answer: "ArrayList is the default List, HashSet the default Set, HashMap the default Map and ArrayDeque the default Queue or stack. Reach for LinkedHashMap or LinkedHashSet for insertion order, TreeMap or TreeSet for sorted keys, and PriorityQueue for best-first processing. Use Iterator.remove or removeIf to delete while iterating. Collections.sort, unmodifiableList and frequency are useful utilities. List.of and Map.of make immutable collections. Java 21's SequencedCollection adds getFirst, getLast and reversed to ordered collections.",
    keyPoints: [
      "Declare variables by interface: Map<String, List<Integer>> grades = new HashMap<>();",
      "computeIfAbsent(key, k -> new ArrayList<>()).add(value) builds multimaps in one line.",
      "Collections.unmodifiableList is a read-only view; List.copyOf is a true immutable copy.",
      "Keys of hash collections need consistent equals and hashCode.",
      "Iterate a map with entrySet() when you need both keys and values.",
    ],
  },
  "exceptions-logging-optional": {
    core: "Fail loudly with meaningful exceptions, record what happened with a logger, and use Optional to make \"no result\" explicit instead of returning null.",
    answer: "Throw exceptions at the layer that detects the problem, and translate them at boundaries into domain exceptions that carry the original as their cause. Use unchecked exceptions for programming errors and checked exceptions only when the caller can realistically recover. Log through SLF4J with placeholders (log.info(\"Order {} placed\", id)) and the right level: ERROR, WARN, INFO, DEBUG or TRACE. Return Optional<T> from methods that may have no result, and consume it with map, orElse, orElseThrow or ifPresent instead of calling get().",
    keyPoints: [
      "Either log an exception or rethrow it, not both: logging and rethrowing duplicates the stack trace.",
      "Pass the exception as the last argument so the logger prints the stack trace.",
      "Never use Optional for fields, parameters or collections; return an empty collection instead.",
      "orElse evaluates its argument eagerly; use orElseGet for expensive defaults.",
      "Never log passwords, tokens or personal data.",
    ],
  },
  "functional-programming": {
    core: "Functions are values: pass behaviour as lambdas, compose small functions into bigger ones, and avoid shared mutable state.",
    answer: "java.util.function defines the standard shapes: Function<T, R>, BiFunction, Predicate<T>, Consumer<T>, Supplier<T> and UnaryOperator and BinaryOperator, with primitive variants such as IntPredicate. Compose them with andThen and compose on functions, and and, or and negate on predicates. A higher-order method takes or returns functions. Method references come in four kinds: static (Integer::parseInt), bound instance (str::length), unbound instance (String::length) and constructor (ArrayList::new). Declare your own @FunctionalInterface when no standard shape fits.",
    keyPoints: [
      "Lambdas capture only effectively final local variables.",
      "f.andThen(g) applies f first, then g; f.compose(g) applies g first.",
      "Primitive interfaces (IntFunction, ToIntFunction) avoid boxing.",
      "Pure functions (no side effects, same output for the same input) are easiest to test and parallelise.",
      "Checked exceptions don't fit the standard interfaces: wrap them or write your own interface.",
    ],
  },
  "streams-collectors": {
    core: "A stream describes a computation over data; collectors describe how its results are gathered into collections, maps or summaries.",
    answer: "Build a pipeline as source → filter/map/flatMap/sorted/distinct → terminal operation. reduce folds elements into one value. collect with Collectors aggregates them: toList, toMap (with a merge function for duplicate keys), groupingBy with downstream collectors (counting, summingInt, mapping, averagingDouble), partitioningBy, joining, and teeing to combine two collectors. flatMap flattens nested streams, and mapMulti (Java 16) emits zero or more elements imperatively. Parallel streams help only with large CPU-bound work on splittable sources.",
    keyPoints: [
      "Stream.toList() (Java 16) returns an unmodifiable list; Collectors.toList() makes no such promise.",
      "toMap throws IllegalStateException on duplicate keys unless you give a merge function.",
      "groupingBy(f, TreeMap::new, counting()) controls the map type.",
      "Never modify the source or shared state inside a pipeline.",
      "Short-circuiting operations (findFirst, anyMatch, limit) stop early, even on infinite streams.",
    ],
  },
  "date-time-api": {
    core: "java.time separates human calendar dates and times from machine timestamps, and all of its types are immutable and thread-safe.",
    answer: "LocalDate, LocalTime and LocalDateTime have no time zone and suit birthdays and schedules. Instant is a point on the UTC timeline, for logs and storage. ZonedDateTime adds a ZoneId with daylight-saving rules, and OffsetDateTime carries a fixed offset. Duration measures time-based amounts (seconds, hours) and Period measures date-based ones (days, months, years). DateTimeFormatter formats and parses text, and every method such as plusDays returns a new object.",
    keyPoints: [
      "Store and transmit instants in UTC; convert to the user's zone only for display.",
      "Use ZoneId.of(\"Asia/Kolkata\"), not fixed offsets, so daylight-saving rules apply.",
      "date.plusDays(1); on its own does nothing: assign the result.",
      "In patterns, MM is month and mm is minute; yyyy is year-of-era and YYYY is week-based year.",
      "Inject a Clock to make time-dependent code testable.",
    ],
  },
  "records-sealed-patterns": {
    core: "Records model data, sealed types fix the set of possible variants, and pattern matching takes them apart safely, with the compiler checking that every case is handled.",
    answer: "A record such as record Point(int x, int y) generates a canonical constructor, accessors, equals, hashCode and toString; its fields are final, and a compact constructor validates them. A sealed interface permits only the subtypes it names (sealed interface Shape permits Circle, Square). Pattern matching binds variables as it tests: obj instanceof String s, switch cases such as case Circle c ->, record deconstruction case Point(int x, int y) ->, and guards with when. A switch over a sealed type needs no default, and the compiler flags any missing case.",
    keyPoints: [
      "Records are shallowly immutable: copy mutable components such as lists in the constructor.",
      "A permitted subclass must be final, sealed or non-sealed.",
      "Exhaustive switches over sealed types turn a forgotten case into a compile error.",
      "Records cannot extend classes, but they can implement interfaces.",
      "Use records for DTOs, value objects and multiple return values.",
    ],
  },
  "modern-syntax-apis": {
    core: "Modern Java (10 to 21) removes boilerplate without changing the language's model: less ceremony, same static typing.",
    answer: "var infers the type of local variables (var list = new ArrayList<String>();); it is still static typing and cannot be used for fields or parameters. Text blocks (\"\"\"...\"\"\") write multi-line strings without escapes. Switch expressions return values with arrow labels and yield. Helpful NullPointerExceptions name the variable that was null. Newer APIs include String.isBlank, strip, lines and repeat, Files.readString and writeString, Collection factories (List.of), Stream.toList, and java.net.http.HttpClient.",
    keyPoints: [
      "Use var when the type is obvious from the right-hand side, not to hide it.",
      "var x = null; and var without an initializer do not compile.",
      "strip() is Unicode-aware; trim() removes only characters up to the space character.",
      "Text blocks strip common indentation; \\ at the end of a line joins it with the next.",
      "Prefer LTS releases (17, 21, 25) for production code.",
    ],
  },
  "virtual-threads": {
    core: "Virtual threads are cheap threads managed by the JVM, so blocking code can scale to huge concurrency without async callbacks.",
    answer: "Each platform thread maps to an OS thread and costs memory and scheduling overhead, which caps a thread-per-request server at a few thousand concurrent requests. Virtual threads (Java 21) are mounted on a small pool of carrier threads, and when one blocks on I/O the JVM unmounts it and frees the carrier. Create them with Thread.ofVirtual().start(...) or Executors.newVirtualThreadPerTaskExecutor(). They speed up I/O-bound work, not CPU-bound work. Structured concurrency (a preview) treats related subtasks as one unit for cancellation and errors.",
    keyPoints: [
      "Never pool virtual threads: create one per task and limit concurrency with a Semaphore.",
      "Pinning to the carrier happens on synchronized blocks (before Java 24) and native calls: prefer ReentrantLock around blocking calls.",
      "Avoid ThreadLocal caches of expensive objects; with millions of threads they multiply.",
      "Virtual threads are always daemon threads with normal priority.",
      "In Spring Boot 3.2+, enable them with spring.threads.virtual.enabled=true.",
    ],
  },
  "modules-jpms": {
    core: "A module declares which packages it exposes and which modules it needs, so encapsulation is enforced by the JVM, not just by convention.",
    answer: "module-info.java declares a module. requires names a dependency, and requires transitive passes it on to your users. exports makes a package's public types accessible, and opens allows deep reflection, which frameworks need. Packages that are not exported are inaccessible even when their types are public. Services decouple modules: a provider writes provides Api with Impl, a consumer writes uses Api, and ServiceLoader finds the implementation. jlink builds a custom runtime image containing only the modules the application needs.",
    keyPoints: [
      "Code on the classpath is in the unnamed module and can read every other module.",
      "Split packages (the same package in two modules) are not allowed.",
      "exports is enough for compile-time and public access; reflective frameworks also need opens.",
      "jdeps lists an application's module dependencies and helps with migration.",
      "Most applications still run on the classpath; JPMS matters most for libraries and small runtimes.",
    ],
  },
  "build-tools": {
    core: "A build tool turns source and declared dependencies into tested, packaged artifacts the same way on every machine.",
    answer: "Maven uses a declarative pom.xml with coordinates (groupId:artifactId:version), dependency scopes (compile, provided, runtime, test) and a fixed lifecycle: validate, compile, test, package, verify, install, deploy. Running a phase runs every phase before it. Gradle uses a Groovy or Kotlin DSL with a task graph, incremental builds and a build cache, and Java projects use implementation, api and testImplementation configurations. Commit the wrapper (mvnw or gradlew) so everyone uses the same tool version.",
    keyPoints: [
      "Standard layout: src/main/java, src/main/resources, src/test/java.",
      "mvn dependency:tree or gradle dependencies shows version conflicts.",
      "Manage versions in one place: <dependencyManagement> in Maven, version catalogs or platforms in Gradle.",
      "SNAPSHOT versions change over time; release builds must not depend on them.",
      "Multi-module builds share configuration from a parent and build modules in dependency order.",
    ],
  },
  "testing-junit-mockito": {
    core: "Automated tests prove that code works and keep it working while it changes; unit tests should be fast, isolated and focused on behaviour.",
    answer: "A JUnit 5 test is an @Test method structured as arrange, act, assert, with setup in @BeforeEach and @BeforeAll. @ParameterizedTest with @ValueSource or @CsvSource runs one test over many inputs. AssertJ gives readable fluent assertions such as assertThat(list).hasSize(3).contains(x), and assertThrows checks exceptions. Mockito replaces dependencies: mock or @Mock creates a fake, when(...).thenReturn(...) stubs it and verify checks interactions. The test pyramid puts many unit tests under fewer integration tests and very few end-to-end tests, and test-driven development cycles through red, green and refactor.",
    keyPoints: [
      "Each test checks one behaviour and is named for it: shouldRejectNegativeAmount.",
      "Mock what you don't own only through your own interfaces, and never mock the class under test.",
      "Tests must not depend on order, time or shared state: inject a Clock and reset fixtures.",
      "Too many verify calls tie tests to the implementation; prefer asserting results.",
      "Code coverage shows untested code but does not prove that the tests are good.",
    ],
  },
  "jvm-performance": {
    core: "Measure before optimising: profile to find the real hot spot, tune the garbage collector for your latency goal, and benchmark with JMH, never with a timing loop.",
    answer: "The JIT inlines, unrolls and removes dead code using run-time profiles, so code gets faster after warm-up. Choose a collector by goal: G1 (the default) for balanced throughput and latency, ZGC for sub-millisecond pauses on large heaps, Parallel for maximum batch throughput. Java Flight Recorder (JFR) with JDK Mission Control finds CPU, allocation and lock hot spots with low overhead in production. JMH handles warm-up, dead-code elimination and forking so that microbenchmarks are valid. Common mistakes include premature optimisation, excessive allocation, boxing in hot loops, string concatenation in loops and unbounded caches.",
    keyPoints: [
      "Start with an algorithmic fix: O(n²) to O(n log n) beats any JVM flag.",
      "Set -Xms equal to -Xmx in containers, or use -XX:MaxRAMPercentage.",
      "System.nanoTime around one call measures noise, not performance.",
      "Read GC logs (-Xlog:gc*) before changing GC settings.",
      "Return values from JMH benchmarks, or consume them with a Blackhole, so the JIT cannot delete the work.",
    ],
  },
};
