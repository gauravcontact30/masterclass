import type { TopicLab } from "../types";
import { alt, code, ex, syntax, task } from "./helpers";

/** Core Java labs, topics 14–17 (lambdas and streams, file I/O, threads and the JVM). */
export const LABS_3: Record<string, TopicLab> = {
  "lambdas-streams": {
    steps: [
      "A lambda is an anonymous function: (parameters) -> expression or { statements }. It implements a functional interface, an interface with exactly one abstract method.",
      "java.util.function supplies the common shapes: Predicate<T> (test), Function<T, R> (apply), Consumer<T> (accept), Supplier<T> (get), UnaryOperator, BinaryOperator and primitive variants such as IntPredicate.",
      "A method reference (String::length, System.out::println, Integer::sum) is shorthand for a lambda that only calls one method.",
      "Lambdas can capture local variables only if they are effectively final (never reassigned).",
      "A stream is a pipeline over a source (collection, array, IntStream.range): zero or more intermediate operations (filter, map, sorted, distinct, flatMap, limit) and one terminal operation (collect, forEach, reduce, count, min, max).",
      "Streams are lazy: nothing runs until the terminal operation, and elements flow through the pipeline one at a time. A stream can be consumed only once.",
      "Collectors build results: toList, toSet, joining, groupingBy, partitioningBy, counting, averagingInt, toMap. Keep lambdas free of side effects so pipelines stay correct and can be parallelised.",
    ],
    syntax: syntax("Streams.java", code`
Predicate<String> isLong = s -> s.length() > 5;      // lambda
Function<String, Integer> len = String::length;       // method reference
Comparator<String> byLen = Comparator.comparingInt(String::length);

List<String> result = names.stream()                  // source
    .filter(n -> n.startsWith("A"))                   // intermediate (lazy)
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.toList());                    // terminal: runs the pipeline

int total = numbers.stream().mapToInt(Integer::intValue).sum();
Optional<String> first = names.stream().filter(isLong).findFirst();
Map<String, List<Emp>> byDept = staff.stream().collect(Collectors.groupingBy(Emp::dept));
String csv = names.stream().collect(Collectors.joining(", "));
IntStream.rangeClosed(1, 5).map(i -> i * i).boxed().toList();   // toList(): Java 16+
`, [
      "Prefer mapToInt/sum over reduce for numeric totals: no boxing.",
      "forEach is for side effects at the end; do not use it to fill other collections.",
      "findFirst, anyMatch and limit short-circuit and can work on infinite streams.",
      "Optional.orElse, orElseGet and map handle 'maybe a value' without null checks.",
    ]),
    example: ex("Filter, map, sort and collect", "Main.java", code`
import java.util.List;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = List.of(5, 12, 8, 21, 3, 16);
        List<Integer> evenSquares = numbers.stream()
            .filter(n -> n % 2 == 0)
            .map(n -> n * n)
            .sorted()
            .collect(Collectors.toList());
        System.out.println(evenSquares);
        int sum = numbers.stream().mapToInt(Integer::intValue).sum();
        System.out.println("sum=" + sum + " max=" + numbers.stream().max(Integer::compare).get());
        System.out.println(numbers.stream().map(String::valueOf).collect(Collectors.joining(", ", "[", "]")));
    }
}
`, code`
[64, 144, 256]
sum=65 max=21
[5, 12, 8, 21, 3, 16]
`, "filter keeps 12, 8 and 16; map squares them; sorted orders them. Each terminal operation needs its own new stream, because a stream can be consumed only once."),
    simple: ex("The core functional interfaces", "Main.java", code`
import java.util.function.*;

public class Main {
    public static void main(String[] args) {
        Predicate<String> isLong = s -> s.length() > 5;
        Function<String, Integer> length = String::length;
        Supplier<String> greeting = () -> "Namaste";
        Consumer<String> printer = System.out::println;
        BinaryOperator<Integer> add = Integer::sum;
        UnaryOperator<String> shout = s -> s.toUpperCase() + "!";

        System.out.println(isLong.test("Streams") + " " + isLong.negate().test("Streams"));
        System.out.println(length.andThen(n -> n * 2).apply("Java"));
        printer.accept(greeting.get());
        System.out.println(add.apply(40, 2));
        System.out.println(shout.apply("lambda"));
    }
}
`, code`
true false
8
Namaste
42
LAMBDA!
`, "Each interface describes a shape of function: test, apply, get, accept. Default methods such as negate and andThen combine them into new functions."),
    moderate: ex("Grouping, averaging and partitioning", "Main.java", code`
import java.util.*;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<Emp> staff = List.of(
            new Emp("Asha", "Engineering", 90000), new Emp("Ravi", "Sales", 50000),
            new Emp("John", "Engineering", 75000), new Emp("Meera", "Sales", 65000), new Emp("Sara", "HR", 55000));

        Map<String, Long> countByDept = staff.stream()
            .collect(Collectors.groupingBy(e -> e.dept, TreeMap::new, Collectors.counting()));
        System.out.println(countByDept);

        Map<String, Double> avgByDept = staff.stream()
            .collect(Collectors.groupingBy(e -> e.dept, TreeMap::new, Collectors.averagingInt(e -> e.salary)));
        System.out.println(avgByDept);

        Map<Boolean, List<String>> highEarners = staff.stream()
            .collect(Collectors.partitioningBy(e -> e.salary >= 65000, Collectors.mapping(e -> e.name, Collectors.toList())));
        System.out.println(highEarners);

        String topTwo = staff.stream()
            .sorted(Comparator.comparingInt((Emp e) -> e.salary).reversed())
            .limit(2).map(e -> e.name).collect(Collectors.joining(" & "));
        System.out.println("Top two: " + topTwo);
    }
}

class Emp {
    final String name, dept;
    final int salary;
    Emp(String name, String dept, int salary) { this.name = name; this.dept = dept; this.salary = salary; }
}
`, code`
{Engineering=2, HR=1, Sales=2}
{Engineering=82500.0, HR=55000.0, Sales=57500.0}
{false=[Ravi, Sara], true=[Asha, John, Meera]}
Top two: Asha & John
`, "groupingBy takes a classifier, an optional map factory (TreeMap for sorted keys) and a downstream collector that summarises each group. partitioningBy always produces exactly two groups, false and true."),
    complex: ex("An order-analytics pipeline", "Main.java", code`
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Order> orders = List.of(
            new Order("O1", "Asha", List.of(new Item("Pen", 20, 3), new Item("Book", 250, 1))),
            new Order("O2", "Ravi", List.of(new Item("Bag", 900, 1))),
            new Order("O3", "Asha", List.of(new Item("Pen", 20, 5), new Item("Lamp", 450, 1))));

        // Revenue per customer: toMap with a merge function and sorted keys
        Map<String, Integer> revenue = orders.stream()
            .collect(Collectors.toMap(o -> o.customer, Order::total, Integer::sum, TreeMap::new));
        System.out.println("Revenue: " + revenue);

        // Units sold per product across all orders (flatMap)
        Map<String, Integer> units = orders.stream()
            .flatMap(o -> o.items.stream())
            .collect(Collectors.groupingBy(i -> i.name, TreeMap::new, Collectors.summingInt(i -> i.qty)));
        System.out.println("Units: " + units);

        // The biggest single order
        Optional<Order> biggest = orders.stream().max(Comparator.comparingInt(Order::total));
        System.out.println("Biggest: " + biggest.map(o -> o.id + "=" + o.total()).orElse("none"));

        // reduce for the grand total; IntStream for running totals
        int all = orders.stream().map(Order::total).reduce(0, Integer::sum);
        int[] totals = orders.stream().mapToInt(Order::total).toArray();
        int[] running = new int[totals.length];
        IntStream.range(0, totals.length).forEach(i -> running[i] = totals[i] + (i > 0 ? running[i - 1] : 0));
        System.out.println("All: " + all + ", running: " + Arrays.toString(running));

        // Distinct products, alphabetically, as an unmodifiable list
        List<String> products = orders.stream().flatMap(o -> o.items.stream()).map(i -> i.name)
            .distinct().sorted()
            .collect(Collectors.collectingAndThen(Collectors.toList(), Collections::unmodifiableList));
        System.out.println("Products: " + products);
    }
}

class Item {
    final String name;
    final int price, qty;
    Item(String name, int price, int qty) { this.name = name; this.price = price; this.qty = qty; }
}

class Order {
    final String id, customer;
    final List<Item> items;
    Order(String id, String customer, List<Item> items) { this.id = id; this.customer = customer; this.items = items; }
    int total() { return items.stream().mapToInt(i -> i.price * i.qty).sum(); }
}
`, code`
Revenue: {Asha=860, Ravi=900}
Units: {Bag=1, Book=1, Lamp=1, Pen=8}
Biggest: O2=900
All: 1760, running: [310, 1210, 1760]
Products: [Bag, Book, Lamp, Pen]
`, "toMap needs a merge function because Asha has two orders. flatMap turns a stream of orders into one stream of all their items. Optional.map formats the result only if there is one."),
    assignments: [
      task("From a list of names, produce the distinct names longer than three letters, upper-cased and sorted, joined by commas.", "Chain filter, map, distinct and sorted, then join.", code`
List<String> names = List.of("Ravi", "Al", "asha", "Ravi", "John");
String out = names.stream().filter(n -> n.length() > 3).map(String::toUpperCase)
    .distinct().sorted().collect(Collectors.joining(","));
System.out.println(out);   // ASHA,JOHN,RAVI
`),
      task("Count how many times each character occurs in \"mississippi\" using streams, in alphabetical order.", "chars() gives an IntStream of character codes; map them back to Character and group.", code`
Map<Character, Long> counts = "mississippi".chars().mapToObj(c -> (char) c)
    .collect(Collectors.groupingBy(c -> c, TreeMap::new, Collectors.counting()));
System.out.println(counts);   // {i=4, m=1, p=2, s=4}
`),
      task("Why does this fail to compile? int total = 0; list.forEach(x -> total += x); How should it be written?", "Lambdas may only capture local variables that are effectively final, and total is reassigned inside the lambda. Compute the value with the stream instead: int total = list.stream().mapToInt(Integer::intValue).sum(); This is also free of side effects, which keeps it correct if the stream is made parallel."),
    ],
    alternates: [
      alt("The same analytics with plain loops", "Loops are easier to debug step by step and can be faster for tiny collections; streams read more declaratively. Both are correct.", "Revenue.java", code`
Map<String, Integer> revenue = new TreeMap<>();
for (Order o : orders) revenue.merge(o.customer, o.total(), Integer::sum);
`),
      alt("Stream.toList and teeing (Java 16+/12+)", "Newer APIs shorten common patterns: toList() returns an unmodifiable list, and teeing combines two collectors in one pass.", "Modern.java", code`
List<Integer> evens = numbers.stream().filter(n -> n % 2 == 0).toList();   // Java 16+

double avg = numbers.stream().collect(Collectors.teeing(            // Java 12+
    Collectors.summingInt(n -> n), Collectors.counting(), (sum, count) -> (double) sum / count));
`),
    ],
  },

  "file-io": {
    steps: [
      "Java has two I/O styles: java.io streams (InputStream/OutputStream for bytes, Reader/Writer for characters) and the newer java.nio.file API (Path, Files) introduced in Java 7, now the preferred way to work with files.",
      "A Path is a file system location (Path.of(\"data\", \"a.txt\") or Paths.get); Files offers static methods: exists, createDirectories, readAllLines, readString, write, writeString, copy, move, delete, walk, list and size.",
      "Small files can be read or written in one call (Files.readString, Files.write). Large files should be streamed line by line with Files.lines or a BufferedReader so they never sit fully in memory.",
      "Buffered streams (BufferedReader, BufferedWriter) cut down system calls; always specify or rely on UTF-8 for text.",
      "Always close streams; try-with-resources does it automatically even when an exception is thrown.",
      "Serialization turns an object graph into bytes (ObjectOutputStream) and back (ObjectInputStream); the class must implement Serializable, transient fields are skipped, and serialVersionUID guards compatibility.",
      "Never deserialize untrusted data with ObjectInputStream; for data exchange prefer JSON, CSV or a binary format with a schema.",
    ],
    syntax: syntax("FileIo.java", code`
Path file = Path.of("data", "notes.txt");          // Java 11+ (Paths.get in Java 8)
Files.createDirectories(file.getParent());
Files.writeString(file, "hello\n");                // create or replace (UTF-8)
Files.writeString(file, "more\n", StandardOpenOption.APPEND);
String all = Files.readString(file);
List<String> lines = Files.readAllLines(file);

try (Stream<String> stream = Files.lines(file)) {  // large files: lazily, line by line
    long errors = stream.filter(l -> l.contains("ERROR")).count();
}

try (BufferedReader in = Files.newBufferedReader(file);
     BufferedWriter out = Files.newBufferedWriter(Path.of("copy.txt"))) {
    String line;
    while ((line = in.readLine()) != null) { out.write(line); out.newLine(); }
}

try (Stream<Path> paths = Files.walk(Path.of("src"))) { ... }   // recursive listing
`, [
      "Files.lines, Files.walk and Files.list hold a file handle: always use them in try-with-resources.",
      "Path.resolve joins paths; relativize computes a relative path between two.",
      "Files.copy and Files.move take options such as REPLACE_EXISTING and ATOMIC_MOVE.",
      "NoSuchFileException and AccessDeniedException are IOException subclasses you can catch specifically.",
    ]),
    example: ex("Write, append, read and delete a file with NIO.2", "Main.java", code`
import java.io.IOException;
import java.nio.file.*;
import java.util.List;

public class Main {
    public static void main(String[] args) throws IOException {
        Path dir = Files.createTempDirectory("demo");
        Path file = dir.resolve("notes.txt");
        Files.write(file, List.of("line one", "line two", "line three"));
        List<String> lines = Files.readAllLines(file);
        System.out.println(lines.size() + " lines, first: " + lines.get(0));
        Files.writeString(file, "line four\n", StandardOpenOption.APPEND);
        System.out.println(Files.readAllLines(file).get(3));
        System.out.println("exists: " + Files.exists(file) + ", name: " + file.getFileName());
        Files.delete(file);
        Files.delete(dir);
    }
}
`, code`
3 lines, first: line one
line four
exists: true, name: notes.txt
`, "Files.write writes each list element as a line; APPEND adds to the end instead of replacing the file. A temporary directory keeps the example from touching your own files."),
    simple: ex("Reading text line by line with BufferedReader", "Main.java", code`
import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;

public class Main {
    public static void main(String[] args) throws IOException {
        String csv = "name,city\nAsha,Pune\nRavi,Delhi";
        try (BufferedReader reader = new BufferedReader(new StringReader(csv))) {
            String header = reader.readLine();
            System.out.println("Header: " + header);
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                System.out.println(parts[0] + " lives in " + parts[1]);
            }
        }
    }
}
`, code`
Header: name,city
Asha lives in Pune
Ravi lives in Delhi
`, "readLine returns null at the end of the input. The same loop works unchanged for a file: replace the StringReader with Files.newBufferedReader(path)."),
    moderate: ex("Walking a directory tree, measuring and cleaning up", "Main.java", code`
import java.io.IOException;
import java.nio.file.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Main {
    public static void main(String[] args) throws IOException {
        Path root = Files.createTempDirectory("project");
        Files.createDirectories(root.resolve("src/main"));
        Files.writeString(root.resolve("src/main/App.java"), "class App {}");
        Files.writeString(root.resolve("src/main/Util.java"), "class Util { int x; }");
        Files.writeString(root.resolve("README.md"), "# Demo");

        try (Stream<Path> paths = Files.walk(root)) {
            String javaFiles = paths.filter(p -> p.toString().endsWith(".java"))
                .map(p -> root.relativize(p).toString().replace('\\', '/'))
                .sorted().collect(Collectors.joining(", "));
            System.out.println("Java files: " + javaFiles);
        }

        long bytes = 0;
        try (Stream<Path> paths = Files.walk(root)) {
            for (Path p : (Iterable<Path>) paths.filter(Files::isRegularFile)::iterator) bytes += Files.size(p);
        }
        System.out.println("Total bytes: " + bytes);

        // Delete the deepest paths first, so every directory is empty when it is deleted
        try (Stream<Path> paths = Files.walk(root)) {
            for (Path p : (Iterable<Path>) paths.sorted((a, b) -> b.getNameCount() - a.getNameCount())::iterator) Files.delete(p);
        }
        System.out.println("Cleaned up: " + !Files.exists(root));
    }
}
`, code`
Java files: src/main/App.java, src/main/Util.java
Total bytes: 39
Cleaned up: true
`, "Files.walk lists the whole tree lazily. relativize prints paths relative to the root, and the replace makes the output identical on Windows and Linux. A directory can only be deleted once it is empty, hence the deepest-first order."),
    complex: ex("Serialization with transient fields, a CSV report and error handling", "Main.java", code`
import java.io.*;
import java.nio.file.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Path dir = Files.createTempDirectory("io");
        Path data = dir.resolve("user.ser");

        User user = new User("asha", "secret123", 3);
        try (ObjectOutputStream out = new ObjectOutputStream(Files.newOutputStream(data))) {
            out.writeObject(user);
        }
        User loaded;
        try (ObjectInputStream in = new ObjectInputStream(Files.newInputStream(data))) {
            loaded = (User) in.readObject();
        }
        System.out.println("Loaded: " + loaded);   // the transient password was not saved

        // Write a CSV report and read it back as totals per region
        Path csv = dir.resolve("sales.csv");
        try (PrintWriter w = new PrintWriter(Files.newBufferedWriter(csv))) {
            w.println("region,amount");
            w.println("north,1200");
            w.println("south,800");
            w.println("north,300");
        }
        Map<String, Integer> totals = new TreeMap<>();
        try (BufferedReader r = Files.newBufferedReader(csv)) {
            r.readLine();                           // skip the header
            String line;
            while ((line = r.readLine()) != null) {
                String[] p = line.split(",");
                totals.merge(p[0], Integer.parseInt(p[1]), Integer::sum);
            }
        }
        System.out.println("Totals: " + totals);

        try {
            Files.readAllLines(dir.resolve("missing.txt"));
        } catch (NoSuchFileException e) {
            System.out.println("No such file: " + Paths.get(e.getFile()).getFileName());
        }
        for (Path p : List.of(data, csv, dir)) Files.delete(p);
    }
}

class User implements Serializable {
    private static final long serialVersionUID = 1L;
    final String name;
    transient String password;
    final int level;
    User(String name, String password, int level) { this.name = name; this.password = password; this.level = level; }
    @Override public String toString() { return name + " (level " + level + ", password=" + password + ")"; }
}
`, code`
Loaded: asha (level 3, password=null)
Totals: {north=1500, south=800}
No such file: missing.txt
`, "transient fields are skipped by serialization, so secrets never reach the file and come back as null. The CSV round trip shows writing with PrintWriter and aggregating while reading. NoSuchFileException is caught specifically and reports which file was missing."),
    assignments: [
      task("Count the lines in a log file that contain the word ERROR without loading the whole file into memory.", "Files.lines streams the file lazily; close it with try-with-resources.", code`
static long countErrors(Path log) throws IOException {
    try (Stream<String> lines = Files.lines(log)) {
        return lines.filter(line -> line.contains("ERROR")).count();
    }
}
`),
      task("Copy a text file to a new file, converting every line to upper case.", "Read and write line by line with buffered streams so it works for files of any size.", code`
static void upperCopy(Path from, Path to) throws IOException {
    try (BufferedReader in = Files.newBufferedReader(from);
         BufferedWriter out = Files.newBufferedWriter(to)) {
        String line;
        while ((line = in.readLine()) != null) {
            out.write(line.toUpperCase());
            out.newLine();
        }
    }
}
`),
      task("What is serialVersionUID, and what happens if you add a field to a Serializable class without declaring it?", "serialVersionUID is a version number stored in the serialized bytes and compared with the class when reading them back. If you do not declare one, Java computes it from the class's structure, so adding a field changes it and reading data saved by the old class fails with InvalidClassException. Declaring a fixed serialVersionUID lets compatible changes (such as adding a field, which simply gets its default value) keep working."),
    ],
    alternates: [
      alt("Read and write a whole file in one call", "For small files, Files.readString and writeString (Java 11+) are the shortest correct code.", "OneLiners.java", code`
Path p = Path.of("hello.txt");
Files.writeString(p, "Namaste\n");
String content = Files.readString(p);          // "Namaste\n"
long size = Files.size(p);                       // 8
`),
      alt("Store data as JSON or CSV instead of Java serialization", "Text formats are readable, language-neutral and safe to parse; Java serialization ties data to class versions and is a security risk with untrusted input. With a JSON library such as Jackson:", "Json.java", code`
// ObjectMapper mapper = new ObjectMapper();
// mapper.writeValue(Path.of("user.json").toFile(), user);
// User loaded = mapper.readValue(Path.of("user.json").toFile(), User.class);
`),
    ],
  },

  "multithreading-basics": {
    steps: [
      "A thread is an independent path of execution inside a process; all threads share the heap, but each has its own stack.",
      "Create a thread by passing a Runnable (usually a lambda) to new Thread(...), or by extending Thread; call start(), never run(), to begin running it concurrently.",
      "join() waits for a thread to finish; sleep() pauses the current thread; interrupt() politely asks a thread to stop.",
      "When threads update shared data, a race condition can lose updates. synchronized methods or blocks make one thread at a time hold an object's lock, giving mutual exclusion and memory visibility.",
      "volatile guarantees visibility of a single variable's latest value but not atomicity of compound actions like count++.",
      "wait() and notifyAll() let threads coordinate on a condition while holding the same lock; always call wait() in a loop that re-checks the condition.",
      "In real applications use java.util.concurrent: ExecutorService thread pools, Future and CompletableFuture for results, atomic classes, locks, latches and concurrent collections.",
    ],
    syntax: syntax("Threads.java", code`
Thread t = new Thread(() -> System.out.println("work"), "worker-1");
t.start();             // runs concurrently; run() would just call the method
t.join();              // wait for it to finish

class Counter {
    private int count;
    synchronized void increment() { count++; }   // one thread at a time
    void add(int n) {
        synchronized (this) { count += n; }        // synchronized block
    }
}

private volatile boolean running = true;          // visibility only

synchronized void await() throws InterruptedException {
    while (!ready) wait();                         // releases the lock while waiting
}
synchronized void signal() { ready = true; notifyAll(); }

ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> f = pool.submit(() -> 6 * 7);
int answer = f.get();
pool.shutdown();
`, [
      "Thread states: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED.",
      "Deadlock happens when threads wait for each other's locks; acquire locks in a fixed order.",
      "Never ignore InterruptedException: restore the flag with Thread.currentThread().interrupt().",
      "Since Java 21, virtual threads make one-thread-per-task cheap for I/O-heavy work.",
    ]),
    example: ex("Two threads, one synchronized counter", "Main.java", code`
public class Main {
    private static int counter = 0;

    private static synchronized void increment() { counter++; }

    public static void main(String[] args) throws InterruptedException {
        Runnable task = () -> {
            for (int i = 0; i < 10_000; i++) increment();
        };
        Thread t1 = new Thread(task, "worker-1");
        Thread t2 = new Thread(task, "worker-2");
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        System.out.println("Counter: " + counter);
        System.out.println(t1.getName() + " alive? " + t1.isAlive());
    }
}
`, code`
Counter: 20000
worker-1 alive? false
`, "Without synchronized, counter++ (read, add, write) from two threads would interleave and lose updates, giving a smaller, unpredictable total. join makes main wait until both workers have finished."),
    simple: ex("Thread subclass and Runnable lambda", "Main.java", code`
public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread a = new Greeter("Hello from a Thread subclass");
        Thread b = new Thread(() -> System.out.println("Hello from a Runnable lambda"));
        a.start();
        a.join();           // wait for a before starting b, so the order is fixed
        b.start();
        b.join();
        System.out.println("main finishes last");
    }
}

class Greeter extends Thread {
    private final String message;
    Greeter(String message) { this.message = message; }
    @Override public void run() { System.out.println(message); }
}
`, code`
Hello from a Thread subclass
Hello from a Runnable lambda
main finishes last
`, "Both styles run code on a new thread. Passing a Runnable is preferred because your class stays free to extend something else and the task is separate from how it is run."),
    moderate: ex("Producer and consumer with wait and notifyAll", "Main.java", code`
import java.util.LinkedList;
import java.util.Queue;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        BoundedBuffer buffer = new BoundedBuffer(2);
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 5; i++) buffer.put(i);
                buffer.put(-1);                 // poison pill: tells the consumer to stop
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        StringBuilder consumed = new StringBuilder();
        Thread consumer = new Thread(() -> {
            try {
                int value;
                while ((value = buffer.take()) != -1) consumed.append(value).append(' ');
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        producer.start();
        consumer.start();
        producer.join();
        consumer.join();
        System.out.println("Consumed in order: " + consumed.toString().trim());
    }
}

class BoundedBuffer {
    private final Queue<Integer> items = new LinkedList<>();
    private final int capacity;
    BoundedBuffer(int capacity) { this.capacity = capacity; }

    synchronized void put(int value) throws InterruptedException {
        while (items.size() == capacity) wait();     // always wait in a loop
        items.add(value);
        notifyAll();
    }

    synchronized int take() throws InterruptedException {
        while (items.isEmpty()) wait();
        int value = items.remove();
        notifyAll();
        return value;
    }
}
`, code`
Consumed in order: 1 2 3 4 5
`, "The producer blocks when the buffer holds two items and the consumer blocks when it is empty; notifyAll wakes the other side. The queue preserves order, so the consumer receives 1 to 5 in sequence however the threads are scheduled."),
    complex: ex("Thread pools, futures, atomics, latches and timeouts", "Main.java", code`
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(4);
        try {
            // 1. Split a sum across four tasks and combine their futures
            List<Callable<Long>> parts = new ArrayList<>();
            for (int p = 0; p < 4; p++) {
                final long from = p * 250_000L + 1, to = (p + 1) * 250_000L;
                parts.add(() -> { long s = 0; for (long i = from; i <= to; i++) s += i; return s; });
            }
            long total = 0;
            for (Future<Long> f : pool.invokeAll(parts)) total += f.get();
            System.out.println("Sum 1..1,000,000 = " + total);

            // 2. Many tasks bump a shared counter safely
            AtomicInteger hits = new AtomicInteger();
            CountDownLatch done = new CountDownLatch(100);
            for (int i = 0; i < 100; i++) {
                pool.submit(() -> { hits.incrementAndGet(); done.countDown(); });
            }
            done.await();
            System.out.println("Hits: " + hits.get());

            // 3. A task that takes too long is cancelled after a timeout
            Future<String> slow = pool.submit(() -> { Thread.sleep(5_000); return "late"; });
            try {
                slow.get(100, TimeUnit.MILLISECONDS);
            } catch (TimeoutException e) {
                slow.cancel(true);
                System.out.println("Timed out, cancelled: " + slow.isCancelled());
            }
        } finally {
            pool.shutdown();
            System.out.println("Terminated: " + pool.awaitTermination(1, TimeUnit.SECONDS));
        }
    }
}
`, code`
Sum 1..1,000,000 = 500000500000
Hits: 100
Timed out, cancelled: true
Terminated: true
`, "invokeAll runs the four Callables on the pool and returns their futures; get() collects each partial sum. AtomicInteger makes increments atomic without locks, and the CountDownLatch waits for all 100 tasks. cancel(true) interrupts the sleeping task so the pool can shut down cleanly."),
    assignments: [
      task("Start three threads that each print their name, and make main print 'all done' only after all three finish.", "Keep the threads in a list, start them all, then join each one.", code`
List<Thread> threads = new ArrayList<>();
for (int i = 1; i <= 3; i++) {
    Thread t = new Thread(() -> System.out.println(Thread.currentThread().getName()), "worker-" + i);
    threads.add(t);
    t.start();
}
for (Thread t : threads) t.join();
System.out.println("all done");
`),
      task("Explain why count++ is not thread-safe even if count is volatile, and give two fixes.", "count++ is three steps: read count, add one, write it back. volatile makes every read see the latest written value, but two threads can still both read 5 and both write 6, losing an update. Fixes: make the update synchronized (a synchronized method or block on a shared lock), or use AtomicInteger.incrementAndGet(), which performs the read-modify-write atomically with a compare-and-swap."),
      task("What is a deadlock? Write the classic two-lock example and show how to avoid it.", "A deadlock occurs when thread 1 holds lock A and waits for lock B while thread 2 holds B and waits for A; neither can proceed. Avoid it by always acquiring locks in the same global order (both threads take A, then B), by using tryLock with a timeout, or by designing with a single lock or lock-free structures.", code`
// Deadlock-prone: thread 1 runs transfer(a, b), thread 2 runs transfer(b, a)
void transfer(Account from, Account to, int amt) {
    synchronized (from) { synchronized (to) { from.debit(amt); to.credit(amt); } }
}
// Fix: always lock the account with the smaller id first
void safeTransfer(Account x, Account y, int amt) {
    Account first = x.id < y.id ? x : y, second = first == x ? y : x;
    synchronized (first) { synchronized (second) { x.debit(amt); y.credit(amt); } }
}
`),
    ],
    alternates: [
      alt("CompletableFuture for asynchronous pipelines", "Chain asynchronous steps and combine results without blocking threads on get().", "Async.java", code`
import java.util.concurrent.CompletableFuture;

CompletableFuture<Integer> price = CompletableFuture.supplyAsync(() -> 1200);
CompletableFuture<Integer> tax = CompletableFuture.supplyAsync(() -> 216);
int total = price.thenCombine(tax, Integer::sum).join();   // 1416
`),
      alt("Virtual threads for many blocking tasks (Java 21)", "Virtual threads are cheap enough to run one per task, even for tens of thousands of I/O-bound tasks.", "Virtual.java", code`
try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        executor.submit(() -> { Thread.sleep(100); return null; });   // blocking is fine here
    }
}   // close() waits for every task
`),
    ],
  },

  "jvm-memory-gc": {
    steps: [
      "The JVM's run-time data areas: the heap (all objects and arrays, shared by threads), one stack per thread (frames with local variables and partial results), the metaspace (class metadata, in native memory since Java 8), the program counter per thread, and native method stacks.",
      "Every method call pushes a frame on the calling thread's stack; it is popped when the method returns. Too deep recursion overflows the stack (StackOverflowError).",
      "Objects are created on the heap. An object becomes garbage when no chain of references from a GC root (local variables, static fields, active threads) reaches it.",
      "The garbage collector reclaims unreachable objects automatically. Most collectors are generational: new objects start in the young generation (most die young and are collected cheaply), survivors are promoted to the old generation.",
      "Collectors trade throughput against pause time: G1 is the default, ZGC and Shenandoah aim for sub-millisecond pauses on large heaps, Serial suits small heaps, Parallel maximises throughput.",
      "Tune with flags such as -Xms/-Xmx (heap size), -Xss (stack size) and -XX:+UseZGC, and observe with tools: jcmd, jstat, jmap, Java Flight Recorder and GC logs (-Xlog:gc).",
      "Memory leaks in Java are objects that stay reachable by mistake: ever-growing static collections or caches, listeners never removed, ThreadLocals in pools. Bound your caches and release references.",
    ],
    syntax: syntax("jvm-options.sh", code`
# Heap: initial and maximum size
java -Xms512m -Xmx2g -jar app.jar

# Stack size per thread (deep recursion)
java -Xss4m Main

# Choose a collector
java -XX:+UseG1GC ...        # default since Java 9
java -XX:+UseZGC ...         # very low pauses on big heaps

# Log every garbage collection
java -Xlog:gc*:file=gc.log -jar app.jar

# Inspect a running JVM (pid from jcmd with no arguments)
jcmd <pid> GC.heap_info
jcmd <pid> GC.class_histogram
jcmd <pid> Thread.print
jcmd <pid> JFR.start duration=60s filename=recording.jfr
`, [
      "System.gc() is only a hint; never rely on it in production code.",
      "finalize() is deprecated for removal; use try-with-resources or Cleaner for resource clean-up.",
      "OutOfMemoryError: Java heap space means live data exceeded -Xmx (or a leak); take a heap dump with -XX:+HeapDumpOnOutOfMemoryError.",
      "Strong, soft, weak and phantom references let caches cooperate with the collector.",
    ]),
    example: ex("Stack versus heap, and a stack overflow", "Main.java", code`
public class Main {
    static int depth = 0;

    static void recurse() {
        depth++;
        recurse();          // no base case: the stack keeps growing
    }

    public static void main(String[] args) {
        int local = 10;                       // lives in main's stack frame
        int[] array = new int[1000];          // the array object lives on the heap
        array[0] = local;
        System.out.println("array[0] = " + array[0]);
        try {
            recurse();
        } catch (StackOverflowError e) {
            System.out.println("StackOverflowError after more than 1000 frames: " + (depth > 1000));
        }
    }
}
`, code`
array[0] = 10
StackOverflowError after more than 1000 frames: true
`, "Each recursive call adds a frame until the thread's stack is full. The exact depth depends on the stack size (-Xss) and frame size, so the program prints a comparison rather than the number."),
    simple: ex("Asking the runtime about memory", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Runtime rt = Runtime.getRuntime();
        long max = rt.maxMemory(), total = rt.totalMemory(), free = rt.freeMemory();
        System.out.println("used <= total: " + (total - free <= total));
        System.out.println("total <= max: " + (total <= max));
        System.out.println("processors > 0: " + (rt.availableProcessors() > 0));
        // The exact numbers vary by machine and -Xmx; print them like this:
        // System.out.printf("max %d MB, total %d MB, free %d MB%n", max >> 20, total >> 20, free >> 20);
    }
}
`, code`
used <= total: true
total <= max: true
processors > 0: true
`, "maxMemory is the -Xmx limit, totalMemory what the heap has currently reserved, and freeMemory the unused part of that reservation, so used = total - free."),
    moderate: ex("A bounded LRU cache instead of a leaking one", "Main.java", code`
import java.util.LinkedHashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        // An unbounded static cache is a classic memory leak: its entries stay reachable forever.
        // A bounded LRU cache keeps memory flat by evicting the least recently used entry.
        LruCache<String, String> cache = new LruCache<>(3);
        cache.put("a", "1");
        cache.put("b", "2");
        cache.put("c", "3");
        cache.get("a");                 // touch a: now the most recently used
        cache.put("d", "4");            // evicts b, the least recently used
        System.out.println(cache.keySet());
        System.out.println("b still cached? " + cache.containsKey("b"));
    }
}

class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    LruCache(int capacity) {
        super(16, 0.75f, true);        // accessOrder = true: get() moves an entry to the end
        this.capacity = capacity;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) { return size() > capacity; }
}
`, code`
[c, a, d]
b still cached? false
`, "With accessOrder true, LinkedHashMap orders entries from least to most recently used, and removeEldestEntry evicts the oldest whenever the size passes the limit, so the cache can never grow without bound."),
    complex: ex("What boxing costs, and deduplicating strings", "Main.java", code`
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;

public class Main {
    // Typical sizes on a 64-bit JVM with compressed references (the default for heaps under 32 GB)
    static final int HEADER = 12, REF = 4, ALIGN = 8;

    static long align(long bytes) { return (bytes + ALIGN - 1) / ALIGN * ALIGN; }

    public static void main(String[] args) {
        int n = 1_000_000;
        long intArray = align(HEADER + 4 + 4L * n);                         // header + length + data
        long integerObject = align(HEADER + 4);                               // header + int field
        long listOfIntegers = align(HEADER + 4 + (long) REF * n) + integerObject * n;
        System.out.println("int[1,000,000]          ~ " + intArray / 1024 + " KB");
        System.out.println("Integer object          = " + integerObject + " bytes");
        System.out.println("1,000,000 Integers+refs ~ " + listOfIntegers / 1024 + " KB");
        System.out.printf("Boxing costs about %.1fx more memory%n", (double) listOfIntegers / intArray);

        // Many equal strings from input are separate objects; intern() maps them to one shared copy
        String[] source = {"Pune", "Delhi", "Pune", "Pune", "Delhi", "Mumbai"};
        String[] cities = new String[source.length];
        for (int i = 0; i < source.length; i++) cities[i] = new String(source[i]).intern();
        Set<String> distinctObjects = Collections.newSetFromMap(new IdentityHashMap<>());
        Collections.addAll(distinctObjects, cities);
        System.out.println(cities.length + " strings, " + distinctObjects.size() + " distinct objects after intern()");
    }
}
`, code`
int[1,000,000]          ~ 3906 KB
Integer object          = 16 bytes
1,000,000 Integers+refs ~ 19531 KB
Boxing costs about 5.0x more memory
6 strings, 3 distinct objects after intern()
`, "A million ints take about 4 MB as an int[], but about 20 MB as boxed Integers: each Integer is a 16-byte object plus a 4-byte reference to it. That is why primitive arrays and IntStream matter for big data. The IdentityHashMap-backed set counts objects, not values, showing intern() collapsed six strings into three shared objects."),
    assignments: [
      task("Write a recursive factorial that cannot overflow the stack for n = 100,000, and explain the fix.", "Java does not optimise tail calls, so deep recursion always risks StackOverflowError. Convert the recursion into a loop, and use BigInteger because the result is enormous.", code`
static java.math.BigInteger factorial(int n) {
    java.math.BigInteger result = java.math.BigInteger.ONE;
    for (int i = 2; i <= n; i++) result = result.multiply(java.math.BigInteger.valueOf(i));
    return result;
}
`),
      task("A service's memory grows steadily until it fails with OutOfMemoryError. List the steps you would take to find the cause.", "1. Confirm the trend with GC logs or monitoring: the heap after each full GC keeps rising. 2. Take heap dumps (jcmd <pid> GC.heap_dump file.hprof, or -XX:+HeapDumpOnOutOfMemoryError) at two points in time. 3. Open them in a heap analyser such as Eclipse MAT and compare: find the classes whose instance counts grow, and follow the dominator tree and paths to GC roots to see what keeps them alive. 4. Typical culprits are static maps or caches without eviction, listeners or callbacks never unregistered, and ThreadLocal values in thread pools. 5. Fix by bounding or evicting, removing references, and verify with a load test."),
      task("Explain what the young and old generations are and why most garbage collectors split the heap this way.", "The generational hypothesis says most objects die young. New objects are allocated in the young generation (Eden plus survivor spaces), which is collected often and quickly by copying only the few live objects. Objects that survive several young collections are promoted to the old generation, which is larger and collected less often. Splitting the heap means most collections touch a small region full of garbage, giving short pauses and high throughput."),
    ],
    alternates: [
      alt("Use primitive collections or streams instead of boxed lists", "When processing large numeric data, int[] and IntStream avoid one object per value.", "Primitive.java", code`
int[] values = java.util.stream.IntStream.rangeClosed(1, 1_000_000).toArray();   // about 4 MB
long sum = java.util.Arrays.stream(values).asLongStream().sum();
`),
      alt("A cache that cooperates with the garbage collector", "SoftReference values may be cleared when memory runs low; for production caches use a library such as Caffeine with size and time limits.", "SoftCache.java", code`
import java.lang.ref.SoftReference;
import java.util.concurrent.ConcurrentHashMap;

class SoftCache<K, V> {
    private final ConcurrentHashMap<K, SoftReference<V>> map = new ConcurrentHashMap<>();
    void put(K key, V value) { map.put(key, new SoftReference<>(value)); }
    V get(K key) {
        SoftReference<V> ref = map.get(key);
        return ref == null ? null : ref.get();   // null if the GC reclaimed it
    }
}
`),
    ],
  },
};
