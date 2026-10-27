import type { TopicLab } from "../types";
import { alt, code, ex, syntax, task } from "./helpers";

/** Core Java labs, topics 10–17 (exceptions, collections, generics, streams, I/O, threads and the JVM). */
export const LABS_2: Record<string, TopicLab> = {
  exceptions: {
    steps: [
      "An exception is an object describing a problem; throwing it stops normal execution and unwinds the call stack until a matching catch block is found.",
      "The hierarchy: Throwable has two branches, Error (serious JVM problems such as OutOfMemoryError, not meant to be caught) and Exception.",
      "Checked exceptions (subclasses of Exception but not RuntimeException, e.g. IOException) must be caught or declared with throws; the compiler enforces it.",
      "Unchecked exceptions (RuntimeException and its subclasses, e.g. NullPointerException, IllegalArgumentException) signal programming errors and need no declaration.",
      "try contains risky code; catch blocks are tried top to bottom, so put specific types before general ones; multi-catch (A | B) shares one handler.",
      "finally always runs (except when the JVM exits), so it is used for clean-up; try-with-resources closes AutoCloseable resources automatically, in reverse order, and records close failures as suppressed exceptions.",
      "Create custom exceptions to describe domain problems, and chain the original cause (new ServiceException(msg, cause)) so the root problem is never lost.",
    ],
    syntax: syntax("Exceptions.java", code`
try {
    riskyOperation();
} catch (FileNotFoundException e) {          // most specific first
    log(e.getMessage());
} catch (IOException | SQLException e) {     // multi-catch
    throw new ServiceException("failed", e);  // wrap and chain the cause
} finally {
    cleanUp();                                // always runs
}

try (var in = new FileInputStream("a.txt");   // try-with-resources
     var out = new FileOutputStream("b.txt")) {
    in.transferTo(out);
}                                             // closed automatically: out, then in

void read() throws IOException { ... }        // declare a checked exception
throw new IllegalArgumentException("bad input");

class InsufficientFundsException extends Exception {   // checked custom exception
    InsufficientFundsException(String message) { super(message); }
}
`, [
      "Never catch an exception just to ignore it; at least log it.",
      "Catch Exception only at the top of a request or a thread, not deep inside business code.",
      "A return in finally swallows exceptions; avoid it.",
      "Extend RuntimeException for programming errors and Exception for recoverable conditions callers must handle.",
    ]),
    example: ex("Catching different failures, with finally", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        String[] inputs = {"42", "abc", "0"};
        for (String input : inputs) {
            try {
                int n = Integer.parseInt(input);
                System.out.println("100 / " + n + " = " + (100 / n));
            } catch (NumberFormatException e) {
                System.out.println("Not a number: " + input);
            } catch (ArithmeticException e) {
                System.out.println("Math error: " + e.getMessage());
            } finally {
                System.out.println("checked " + input);
            }
        }
    }
}
`, code`
100 / 42 = 2
checked 42
Not a number: abc
checked abc
Math error: / by zero
checked 0
`, "Each input fails in a different way and lands in a different catch block, and finally runs for every input whether or not an exception occurred."),
    simple: ex("A checked custom exception with throws", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        try {
            withdraw(500, 800);
        } catch (InsufficientFundsException e) {
            System.out.println("Error: " + e.getMessage() + " (short by " + e.shortBy + ")");
        }
    }

    static void withdraw(int balance, int amount) throws InsufficientFundsException {
        if (amount > balance) throw new InsufficientFundsException(amount - balance);
        System.out.println("Withdrawn " + amount);
    }
}

class InsufficientFundsException extends Exception {
    final int shortBy;
    InsufficientFundsException(int shortBy) {
        super("Insufficient funds");
        this.shortBy = shortBy;
    }
}
`, code`
Error: Insufficient funds (short by 300)
`, "Because the exception is checked, withdraw must declare throws and every caller must handle it. The exception carries extra data (shortBy) for the handler."),
    moderate: ex("try-with-resources, close order and suppressed exceptions", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        try (Resource a = new Resource("A"); Resource b = new Resource("B")) {
            System.out.println("using " + a.name + " and " + b.name);
            throw new IllegalStateException("work failed");
        } catch (IllegalStateException e) {
            System.out.println("caught: " + e.getMessage());
            for (Throwable s : e.getSuppressed()) System.out.println("suppressed: " + s.getMessage());
        } finally {
            System.out.println("finally runs last");
        }
    }
}

class Resource implements AutoCloseable {
    final String name;
    Resource(String name) { this.name = name; System.out.println("open " + name); }
    @Override public void close() {
        System.out.println("close " + name);
        if (name.equals("B")) throw new RuntimeException("close of B failed");
    }
}
`, code`
open A
open B
using A and B
close B
close A
caught: work failed
suppressed: close of B failed
finally runs last
`, "Resources close in reverse order of opening, before the catch block runs. The failure in close() does not hide the original exception; it is attached to it as a suppressed exception."),
    complex: ex("Retries, exception chaining and multi-catch", "Main.java", code`
import java.util.ArrayList;
import java.util.List;

public class Main {
    static int attempts = 0;

    public static void main(String[] args) {
        try {
            String data = withRetry(3);
            System.out.println("Got: " + data);
        } catch (ServiceException e) {
            System.out.println(e.getMessage() + " | cause: " + e.getCause().getMessage());
        }

        List<String> errors = new ArrayList<>();
        Object[] values = {"7", null, "x", 3};
        for (Object v : values) {
            try {
                String s = (String) v;
                System.out.println("parsed " + Integer.parseInt(s.trim()));
            } catch (NullPointerException | NumberFormatException e) {
                errors.add(e.getClass().getSimpleName());
            } catch (ClassCastException e) {
                errors.add("ClassCastException");
            }
        }
        System.out.println("errors: " + errors);
    }

    static String withRetry(int maxAttempts) throws ServiceException {
        for (int i = 1; i <= maxAttempts; i++) {
            try {
                return callFlakyService();
            } catch (IllegalStateException e) {
                System.out.println("attempt " + i + " failed: " + e.getMessage());
                if (i == maxAttempts) throw new ServiceException("service unavailable after " + i + " attempts", e);
            }
        }
        throw new AssertionError("unreachable");
    }

    static String callFlakyService() {
        attempts++;
        if (attempts < 5) throw new IllegalStateException("timeout #" + attempts);
        return "data";
    }
}

class ServiceException extends Exception {
    ServiceException(String message, Throwable cause) { super(message, cause); }
}
`, code`
attempt 1 failed: timeout #1
attempt 2 failed: timeout #2
attempt 3 failed: timeout #3
service unavailable after 3 attempts | cause: timeout #3
parsed 7
errors: [NullPointerException, NumberFormatException, ClassCastException]
`, "The retry loop turns a low-level IllegalStateException into a meaningful checked ServiceException and keeps the original as its cause. Casting null to String is allowed, so the null fails later at trim(); the Integer 3 fails at the cast."),
    assignments: [
      task("Write a method parseAge(String s) that returns the age, throws IllegalArgumentException with a clear message for non-numbers and for ages outside 0–150.", "Catch the NumberFormatException and rethrow with a better message and the cause; validate the range separately.", code`
static int parseAge(String s) {
    int age;
    try {
        age = Integer.parseInt(s.trim());
    } catch (NumberFormatException e) {
        throw new IllegalArgumentException("age must be a number: " + s, e);
    }
    if (age < 0 || age > 150) throw new IllegalArgumentException("age out of range: " + age);
    return age;
}
`),
      task("What does this method return, and why? static int f() { try { return 1; } finally { return 2; } }", "It returns 2. The finally block runs after the try's return value is computed but before the method actually returns, and its own return replaces the pending one. The same mechanism would silently discard an exception thrown in try, which is why returning from finally is considered a bug."),
      task("Explain checked versus unchecked exceptions and give two examples of each with when you would use them.", "Checked exceptions are verified by the compiler: the method must catch them or declare throws. Use them for recoverable conditions outside the program's control that callers are expected to handle, e.g. IOException (file missing) and SQLException (database unavailable). Unchecked exceptions extend RuntimeException and need no declaration; they indicate bugs or violated preconditions, e.g. NullPointerException and IllegalArgumentException, and are fixed by correcting the code rather than catching."),
    ],
    alternates: [
      alt("Return Optional instead of throwing for an expected 'not found'", "When absence is normal rather than exceptional, Optional makes the caller handle it without try/catch.", "Users.java", code`
import java.util.Map;
import java.util.Optional;

static Optional<String> findEmail(Map<String, String> emails, String user) {
    return Optional.ofNullable(emails.get(user));
}
// findEmail(map, "asha").orElse("no email on file")
`),
      alt("A small result type for validation errors", "Collect every problem and return them together instead of failing on the first exception, which suits form validation.", "Validation.java", code`
import java.util.ArrayList;
import java.util.List;

static List<String> validate(String name, int age) {
    List<String> errors = new ArrayList<>();
    if (name == null || name.isBlank()) errors.add("name is required");
    if (age < 18) errors.add("must be 18 or older");
    return errors;   // empty list means valid
}
`),
    ],
  },

  "collections-list-set": {
    steps: [
      "The Collections Framework is a set of interfaces (Collection, List, Set, Queue, Deque, Map) with interchangeable implementations; program to the interface: List<String> names = new ArrayList<>().",
      "List keeps insertion order and allows duplicates: ArrayList (array-backed, fast random access, the default choice) and LinkedList (fast inserts at the ends, slow indexing).",
      "Set holds no duplicates: HashSet (fastest, no order), LinkedHashSet (insertion order) and TreeSet (sorted, O(log n), needs Comparable or a Comparator).",
      "Queue and Deque model FIFO and stack behaviour: ArrayDeque is the fast general-purpose stack/queue; PriorityQueue always hands out the smallest (or highest-priority) element first.",
      "Iterate with the enhanced for loop; to remove while iterating use Iterator.remove() or removeIf, never list.remove() inside a for-each, which throws ConcurrentModificationException.",
      "List.of / Set.of create unmodifiable collections; Collections provides sort, reverse, max, min, frequency, unmodifiableList and more.",
      "Choose by operation: random access → ArrayList; uniqueness → HashSet; ordering → TreeSet; FIFO/LIFO → ArrayDeque; 'next most important' → PriorityQueue.",
    ],
    syntax: syntax("Collections.java", code`
List<String> list = new ArrayList<>();          // ordered, duplicates allowed
list.add("a"); list.add(0, "b"); list.get(1); list.set(0, "c");
list.remove("a"); list.contains("c"); list.size(); list.indexOf("c");

Set<Integer> set = new HashSet<>();              // unique, no order
Set<String> sorted = new TreeSet<>(list);        // unique, sorted
Set<String> ordered = new LinkedHashSet<>(list); // unique, insertion order

Deque<Integer> stack = new ArrayDeque<>();       // push / pop / peek
Queue<Integer> queue = new ArrayDeque<>();       // offer / poll / peek
Queue<Integer> heap = new PriorityQueue<>();     // poll returns the smallest

List<String> fixed = List.of("x", "y");         // unmodifiable (Java 9+)
list.removeIf(s -> s.isEmpty());
Collections.sort(list); Collections.reverse(list);
`, [
      "ArrayList get is O(1); add at the end is amortised O(1); add/remove in the middle is O(n).",
      "HashSet add/contains/remove are O(1) on average; TreeSet's are O(log n).",
      "PriorityQueue peek is O(1), offer and poll are O(log n), and its iteration order is not sorted.",
      "Prefer ArrayDeque over the legacy Stack and Vector classes.",
    ]),
    example: ex("Lists, sets and a deque at work", "Main.java", code`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> cities = new ArrayList<>(List.of("Pune", "Delhi", "Mumbai", "Delhi"));
        cities.add(1, "Chennai");
        cities.remove("Mumbai");
        System.out.println(cities + " size=" + cities.size());

        Set<String> unique = new LinkedHashSet<>(cities);
        System.out.println(unique);

        Set<String> sorted = new TreeSet<>(cities);
        System.out.println(sorted);

        Deque<String> queue = new ArrayDeque<>(sorted);
        System.out.println(queue.pollFirst() + " then " + queue.peekFirst());
    }
}
`, code`
[Pune, Chennai, Delhi, Delhi] size=4
[Pune, Chennai, Delhi]
[Chennai, Delhi, Pune]
Chennai then Delhi
`, "The list keeps both Delhis and insertion order; LinkedHashSet drops the duplicate but keeps the order; TreeSet sorts alphabetically. pollFirst removes the head, peekFirst only looks."),
    simple: ex("Removing safely while iterating", "Main.java", code`
import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(List.of(5, 12, 7, 20, 3, 18));
        Iterator<Integer> it = numbers.iterator();
        while (it.hasNext()) {
            if (it.next() < 10) it.remove();      // the safe way
        }
        System.out.println(numbers);

        numbers.removeIf(n -> n == 20);           // the modern way
        System.out.println(numbers);

        numbers.add(25);
        try {
            for (Integer n : numbers) numbers.remove(n);   // the wrong way
        } catch (ConcurrentModificationException e) {
            System.out.println("ConcurrentModificationException");
        }
        System.out.println(numbers);
    }
}
`, code`
[12, 20, 18]
[12, 18]
ConcurrentModificationException
[18, 25]
`, "The for-each loop uses a hidden iterator that detects the list was changed behind its back and fails fast, after the first removal has already happened."),
    moderate: ex("PriorityQueue and the Collections utilities", "Main.java", code`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>(List.of(42, 7, 19, 3, 25));
        StringBuilder order = new StringBuilder();
        while (!minHeap.isEmpty()) order.append(minHeap.poll()).append(' ');
        System.out.println("Min-heap order: " + order.toString().trim());

        List<Integer> scores = new ArrayList<>(List.of(70, 95, 82, 60));
        Collections.sort(scores, Collections.reverseOrder());
        System.out.println("Top first: " + scores);
        System.out.println("Max " + Collections.max(scores) + ", min " + Collections.min(scores));
        System.out.println("Index of 82 (binary search on ascending copy): " + Collections.binarySearch(sortedCopy(scores), 82));
        Collections.reverse(scores);
        System.out.println("Reversed: " + scores);
        System.out.println("Frequency of 95: " + Collections.frequency(scores, 95));
    }

    static List<Integer> sortedCopy(List<Integer> in) {
        List<Integer> copy = new ArrayList<>(in);
        Collections.sort(copy);
        return copy;
    }
}
`, code`
Min-heap order: 3 7 19 25 42
Top first: [95, 82, 70, 60]
Max 95, min 60
Index of 82 (binary search on ascending copy): 2
Reversed: [60, 70, 82, 95]
Frequency of 95: 1
`, "poll always returns the smallest remaining element, so draining a PriorityQueue yields sorted order. binarySearch only works on a list sorted in ascending order, hence the sorted copy."),
    complex: ex("Set algebra, recent searches and an undo stack", "Main.java", code`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Set algebra: who knows Java, Python, or both
        Set<String> java = new TreeSet<>(List.of("Asha", "Ravi", "Meera", "John"));
        Set<String> python = new TreeSet<>(List.of("Ravi", "John", "Sara"));
        Set<String> both = new TreeSet<>(java);
        both.retainAll(python);
        Set<String> either = new TreeSet<>(java);
        either.addAll(python);
        Set<String> onlyJava = new TreeSet<>(java);
        onlyJava.removeAll(python);
        System.out.println("Both: " + both + ", either: " + either + ", only Java: " + onlyJava);

        // Recent searches: most recent first, no duplicates, at most 3
        Deque<String> recent = new ArrayDeque<>();
        for (String q : List.of("hashmap", "streams", "jvm", "hashmap", "generics")) {
            recent.remove(q);
            recent.addFirst(q);
            if (recent.size() > 3) recent.removeLast();
        }
        System.out.println("Recent: " + recent);

        // Undo stack for a text editor
        Deque<String> undo = new ArrayDeque<>();
        StringBuilder doc = new StringBuilder();
        for (String word : List.of("Hello", " big", " world")) {
            undo.push(doc.toString());
            doc.append(word);
        }
        System.out.println("Doc: " + doc);
        doc = new StringBuilder(undo.pop());
        System.out.println("After undo: " + doc);
        System.out.println("Undo levels left: " + undo.size());
    }
}
`, code`
Both: [John, Ravi], either: [Asha, John, Meera, Ravi, Sara], only Java: [Asha, Meera]
Recent: [generics, hashmap, jvm]
Doc: Hello big world
After undo: Hello big
Undo levels left: 2
`, "retainAll, addAll and removeAll implement intersection, union and difference. One ArrayDeque serves both as a bounded most-recent list (addFirst/removeLast) and as a stack (push/pop)."),
    assignments: [
      task("Remove duplicates from a list of names while keeping the first occurrence order.", "Pass the list through a LinkedHashSet, which drops duplicates but remembers insertion order.", code`
List<String> names = List.of("Ravi", "Asha", "Ravi", "John", "Asha");
List<String> unique = new ArrayList<>(new LinkedHashSet<>(names));
System.out.println(unique);   // [Ravi, Asha, John]
`),
      task("Check whether a string of brackets such as \"{[()]}\" is balanced, using a Deque as a stack.", "Push opening brackets; for each closing bracket, the top of the stack must be its partner. The string is balanced if the stack is empty at the end.", code`
static boolean balanced(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if ("([{".indexOf(c) >= 0) stack.push(c);
        else if (")]}".indexOf(c) >= 0) {
            if (stack.isEmpty() || "([{".indexOf(stack.pop()) != ")]}".indexOf(c)) return false;
        }
    }
    return stack.isEmpty();
}
`),
      task("When would you choose LinkedList over ArrayList, and why is ArrayList usually still faster?", "LinkedList has O(1) insertion and removal at the ends or at an iterator's position, and implements Deque. But each element is a separate node object scattered in memory, so iteration has poor cache locality and get(i) is O(n). ArrayList stores elements contiguously, which CPUs read very quickly, so in practice it wins for almost every workload; for queue or stack use, ArrayDeque beats both."),
    ],
    alternates: [
      alt("Streams to filter and deduplicate", "A stream pipeline expresses 'filter, deduplicate, sort' in one statement.", "Cities.java", code`
import java.util.List;
import java.util.stream.Collectors;

List<String> cities = List.of("Pune", "Delhi", "Mumbai", "Delhi");
List<String> result = cities.stream().distinct().sorted().collect(Collectors.toList());
// [Delhi, Mumbai, Pune]
`),
      alt("Immutable copies and sequenced collections (Java 21)", "List.copyOf gives a safe snapshot; Java 21's SequencedCollection adds getFirst/getLast/reversed to lists and deques.", "Sequenced.java", code`
List<String> snapshot = List.copyOf(cities);     // unmodifiable copy (Java 10+)
String first = cities.getFirst();                // Java 21
List<String> backwards = cities.reversed();      // Java 21: a reversed view
`),
    ],
  },

  "maps-hashing-comparators": {
    steps: [
      "A Map stores key → value pairs with unique keys: HashMap (fast, no order), LinkedHashMap (insertion or access order) and TreeMap (sorted by key, with navigation methods).",
      "HashMap uses an array of buckets: the key's hashCode is spread ((h ^ h >>> 16)) and masked to pick a bucket, and equals finds the exact key within it.",
      "Collisions put several entries in one bucket; since Java 8 a crowded bucket turns from a linked list into a balanced tree, keeping lookups fast.",
      "When the map grows past capacity × load factor (default 0.75 of 16), the table doubles and entries are redistributed (rehashing).",
      "Keys must have consistent equals and hashCode and should be immutable; mutating a key after insertion makes it unfindable.",
      "Comparable gives a class its natural order (compareTo); Comparator defines any other order and composes with comparing, thenComparing and reversed.",
      "Useful Map methods: getOrDefault, putIfAbsent, merge, compute, computeIfAbsent, entrySet for iteration, and TreeMap's floorKey, ceilingKey, headMap and tailMap.",
    ],
    syntax: syntax("Maps.java", code`
Map<String, Integer> map = new HashMap<>();
map.put("pen", 40);  map.get("pen");  map.getOrDefault("ink", 0);
map.putIfAbsent("book", 12);
map.merge("pen", 1, Integer::sum);                 // add 1, or insert 1
map.computeIfAbsent("bags", k -> 0);
for (Map.Entry<String, Integer> e : map.entrySet()) { e.getKey(); e.getValue(); }

NavigableMap<Integer, String> tree = new TreeMap<>();
tree.floorKey(15);  tree.ceilingEntry(15);  tree.headMap(10);  tree.tailMap(10, true);

class Student implements Comparable<Student> {
    public int compareTo(Student o) { return name.compareTo(o.name); }   // natural order
}
Comparator<Student> byMarks = Comparator.comparingInt(Student::marks)
                                        .reversed()
                                        .thenComparing(Student::name);
list.sort(byMarks);
`, [
      "HashMap allows one null key and null values; TreeMap does not allow null keys.",
      "Iterating a HashMap has no defined order; use LinkedHashMap or TreeMap when order matters.",
      "compareTo should be consistent with equals for sorted sets and maps.",
      "ConcurrentHashMap is the thread-safe map; HashMap is not.",
    ]),
    example: ex("Word frequency with a sorted map", "Main.java", code`
import java.util.Map;
import java.util.TreeMap;

public class Main {
    public static void main(String[] args) {
        String text = "to be or not to be that is the question";
        Map<String, Integer> freq = new TreeMap<>();
        for (String w : text.split(" ")) freq.merge(w, 1, Integer::sum);
        System.out.println(freq);
        System.out.println("be -> " + freq.get("be") + ", xyz -> " + freq.getOrDefault("xyz", 0));
    }
}
`, code`
{be=2, is=1, not=1, or=1, question=1, that=1, the=1, to=2}
be -> 2, xyz -> 0
`, "merge inserts 1 for a new word and adds 1 to an existing count. TreeMap keeps the keys in alphabetical order."),
    simple: ex("Everyday map operations", "Main.java", code`
import java.util.LinkedHashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> stock = new LinkedHashMap<>();
        stock.put("pen", 40);
        stock.put("book", 12);
        stock.put("pen", 35);                     // same key: replaces the value
        stock.putIfAbsent("book", 99);            // ignored: the key exists
        stock.computeIfAbsent("bag", k -> 5);
        stock.computeIfPresent("book", (k, v) -> v - 2);
        for (Map.Entry<String, Integer> e : stock.entrySet()) {
            System.out.println(e.getKey() + " = " + e.getValue());
        }
        System.out.println(stock.containsKey("pen") + " " + stock.containsValue(99));
    }
}
`, code`
pen = 35
book = 10
bag = 5
true false
`, "Keys are unique, so the second put for pen replaces the value. LinkedHashMap iterates in insertion order, which makes the output predictable."),
    moderate: ex("Comparable for the natural order, Comparator for everything else", "Main.java", code`
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Student> list = new ArrayList<>(List.of(
            new Student("Ravi", 85), new Student("Asha", 92), new Student("John", 85), new Student("Meera", 78)));

        List<Student> natural = new ArrayList<>(list);
        natural.sort(null);                          // null comparator: use Comparable (by name)
        System.out.println(natural);

        list.sort(Comparator.comparingInt((Student s) -> s.marks).reversed().thenComparing(s -> s.name));
        System.out.println(list);
    }
}

class Student implements Comparable<Student> {
    final String name;
    final int marks;
    Student(String name, int marks) { this.name = name; this.marks = marks; }
    @Override public int compareTo(Student other) { return name.compareTo(other.name); }
    @Override public String toString() { return name + ":" + marks; }
}
`, code`
[Asha:92, John:85, Meera:78, Ravi:85]
[Asha:92, John:85, Ravi:85, Meera:78]
`, "The class defines one natural order; the Comparator builds a different one at the call site: highest marks first, ties broken alphabetically (John before Ravi)."),
    complex: ex("Why hashCode matters, how buckets are chosen, and TreeMap navigation", "Main.java", code`
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // 1. A key whose hashCode ignores equals: lookups fail
        Map<BadKey, String> bad = new HashMap<>();
        bad.put(new BadKey("id-1"), "value");
        System.out.println("BadKey lookup: " + bad.get(new BadKey("id-1")));

        Map<GoodKey, String> good = new HashMap<>();
        good.put(new GoodKey("id-1"), "value");
        System.out.println("GoodKey lookup: " + good.get(new GoodKey("id-1")));

        // 2. How HashMap picks a bucket in a table of 16: (h ^ (h >>> 16)) & 15
        for (String key : List.of("Aa", "BB", "java")) {
            int h = key.hashCode();
            System.out.println(key + " hash=" + h + " bucket=" + ((h ^ (h >>> 16)) & 15));
        }

        // 3. TreeMap as a sorted index: price bands
        NavigableMap<Integer, String> bands = new TreeMap<>(Map.of(0, "budget", 10000, "mid", 30000, "premium"));
        for (int price : new int[]{4999, 15000, 30000, 85000}) {
            System.out.println(price + " -> " + bands.floorEntry(price).getValue());
        }
        System.out.println("Bands from 10000: " + bands.tailMap(10000, true).values());
    }
}

class BadKey {
    final String id;
    BadKey(String id) { this.id = id; }
    @Override public boolean equals(Object o) { return o instanceof BadKey && ((BadKey) o).id.equals(id); }
    // hashCode is not overridden: two equal keys almost always land in different buckets
}

class GoodKey {
    final String id;
    GoodKey(String id) { this.id = id; }
    @Override public boolean equals(Object o) { return o instanceof GoodKey && ((GoodKey) o).id.equals(id); }
    @Override public int hashCode() { return id.hashCode(); }
}
`, code`
BadKey lookup: null
GoodKey lookup: value
Aa hash=2112 bucket=0
BB hash=2112 bucket=0
java hash=3254818 bucket=3
4999 -> budget
15000 -> mid
30000 -> premium
85000 -> premium
Bands from 10000: [mid, premium]
`, "Without hashCode the lookup key gets an identity hash and HashMap searches the wrong bucket. \"Aa\" and \"BB\" have the same hash code, a classic collision, so they share bucket 0. floorEntry finds the greatest key at or below the price, which turns a TreeMap into a range lookup table."),
    assignments: [
      task("Group a list of words by their first letter into a TreeMap<Character, List<String>>.", "computeIfAbsent creates the list the first time a letter is seen.", code`
Map<Character, List<String>> groups = new TreeMap<>();
for (String w : List.of("apple", "banana", "avocado", "blueberry", "cherry")) {
    groups.computeIfAbsent(w.charAt(0), k -> new ArrayList<>()).add(w);
}
System.out.println(groups);   // {a=[apple, avocado], b=[banana, blueberry], c=[cherry]}
`),
      task("Find the first non-repeating character in a string.", "Count with a LinkedHashMap so the counts keep the characters' order, then return the first with count 1.", code`
static Character firstUnique(String s) {
    Map<Character, Integer> counts = new LinkedHashMap<>();
    for (char c : s.toCharArray()) counts.merge(c, 1, Integer::sum);
    for (Map.Entry<Character, Integer> e : counts.entrySet()) if (e.getValue() == 1) return e.getKey();
    return null;   // firstUnique("swiss") -> 'w'
}
`),
      task("Explain what happens inside HashMap.put when two different keys have the same bucket, and what changed in Java 8.", "put computes the key's spread hash, picks the bucket, and walks the entries already there: if one has an equal hash and equals() returns true, its value is replaced; otherwise a new node is appended. Different keys in one bucket form a linked list, which degrades lookups to O(n) in that bucket. Since Java 8, once a bucket holds 8 entries (and the table has at least 64 buckets) it is converted into a red-black tree, so the worst case becomes O(log n)."),
    ],
    alternates: [
      alt("Counting with streams and groupingBy", "One pipeline replaces the manual merge loop.", "WordCount.java", code`
import java.util.Arrays;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

Map<String, Long> freq = Arrays.stream("to be or not to be".split(" "))
    .collect(Collectors.groupingBy(w -> w, TreeMap::new, Collectors.counting()));
// {be=2, not=1, or=1, to=2}
`),
      alt("A Comparator with method references and nulls handled", "Comparator.comparing with method references is the most readable form, and nullsLast copes with missing values.", "Sorting.java", code`
import java.util.Comparator;

list.sort(Comparator.comparing(Student::city, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(Student::name));
`),
    ],
  },

  generics: {
    steps: [
      "Generics let a class, interface or method work with any type while keeping compile-time type safety: List<String> only accepts Strings, and get() needs no cast.",
      "Declare type parameters in angle brackets: class Box<T>, interface Repository<ID, T>, or a generic method <T> T first(List<T> items).",
      "The diamond operator new ArrayList<>() lets the compiler infer the type arguments.",
      "Bounded type parameters restrict what T can be: <T extends Comparable<T>> means you can call compareTo on a T.",
      "Wildcards make method parameters flexible: List<? extends Number> can be read as Numbers (a producer); List<? super Integer> can accept Integers (a consumer). Remember PECS: Producer Extends, Consumer Super.",
      "Generics are implemented by type erasure: the type arguments are checked by the compiler and then removed, so at run time List<String> and List<Integer> are the same class.",
      "Because of erasure you cannot write new T(), T.class, instanceof List<String> or create generic arrays directly; pass a Class<T> when you need the type at run time.",
    ],
    syntax: syntax("Generics.java", code`
class Box<T> {                                   // generic class
    private final T value;
    Box(T value) { this.value = value; }
    T get() { return value; }
}
Box<String> b = new Box<>("hi");                 // diamond: type inferred

static <T> T first(List<T> items) { return items.get(0); }   // generic method

static <T extends Comparable<T>> T max(List<T> items) { ... } // bounded type

static double sum(List<? extends Number> nums) { ... }        // read: producer extends
static void fill(List<? super Integer> target) { ... }        // write: consumer super

interface Repository<ID, T> { Optional<T> findById(ID id); }  // several type parameters
`, [
      "Type parameters are conventionally single capitals: T (type), E (element), K and V (key and value), R (result).",
      "Primitives cannot be type arguments: use List<Integer>, not List<int>.",
      "A raw type (List without <...>) switches off generic checks; avoid it in new code.",
      "List<Integer> is not a subtype of List<Number>, even though Integer is a Number; wildcards bridge that gap.",
    ]),
    example: ex("A generic Box, Pair and generic method", "Main.java", code`
import java.util.List;

public class Main {
    public static void main(String[] args) {
        Box<String> name = new Box<>("Asha");
        Box<Integer> age = new Box<>(21);
        System.out.println(name.get().toUpperCase() + " " + (age.get() + 1));
        System.out.println(firstOf(List.of(3, 1, 2)) + " " + firstOf(List.of("x", "y")));
        Pair<String, Integer> p = new Pair<>("marks", 95);
        System.out.println(p);
    }

    static <T> T firstOf(List<T> items) { return items.get(0); }
}

class Box<T> {
    private final T value;
    Box(T value) { this.value = value; }
    T get() { return value; }
}

class Pair<K, V> {
    final K key;
    final V value;
    Pair(K key, V value) { this.key = key; this.value = value; }
    @Override public String toString() { return "(" + key + ", " + value + ")"; }
}
`, code`
ASHA 22
3 x
(marks, 95)
`, "The compiler knows name.get() is a String and age.get() an Integer, so no casts are needed and calling toUpperCase on the Integer would not even compile."),
    simple: ex("Type safety versus raw types", "Main.java", code`
import java.util.ArrayList;
import java.util.List;

public class Main {
    @SuppressWarnings({"rawtypes", "unchecked"})
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("Ravi");
        // names.add(42);              // compile error: int cannot be converted to String
        String first = names.get(0);   // no cast needed
        System.out.println(first.length());

        List raw = new ArrayList();     // a raw type: no type checks at all
        raw.add("text");
        raw.add(42);
        try {
            String s = (String) raw.get(1);   // fails only at run time
            System.out.println(s);
        } catch (ClassCastException e) {
            System.out.println("ClassCastException at run time");
        }
    }
}
`, code`
4
ClassCastException at run time
`, "Generics move the error from run time to compile time. The raw list accepts anything, and the mistake only shows up as a ClassCastException when the value is read."),
    moderate: ex("Bounded types and PECS wildcards", "Main.java", code`
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println(max(List.of(4, 9, 2)) + " " + max(List.of("pear", "apple", "zebra")));
        List<Integer> ints = List.of(1, 2, 3);
        List<Double> doubles = List.of(1.5, 2.5);
        System.out.println(sum(ints) + " " + sum(doubles));
        List<Number> sink = new ArrayList<>();
        addNumbers(sink);
        System.out.println(sink);
    }

    // Bounded type parameter: T must be comparable to itself
    static <T extends Comparable<T>> T max(List<T> items) {
        T best = items.get(0);
        for (T item : items) if (item.compareTo(best) > 0) best = item;
        return best;
    }

    // Producer extends: read numbers of any Number subtype
    static double sum(List<? extends Number> numbers) {
        double total = 0;
        for (Number n : numbers) total += n.doubleValue();
        return total;
    }

    // Consumer super: write Integers into a list of Integer or any supertype
    static void addNumbers(List<? super Integer> target) {
        for (int i = 1; i <= 3; i++) target.add(i * 10);
    }
}
`, code`
9 zebra
6.0 4.0
[10, 20, 30]
`, "max works for any comparable type. sum accepts both List<Integer> and List<Double> because it only reads. addNumbers accepts a List<Number> because it only writes Integers into it."),
    complex: ex("A generic repository, type erasure and a type-safe container", "Main.java", code`
import java.util.*;
import java.util.function.Function;

public class Main {
    public static void main(String[] args) {
        Repository<Integer, Book> books = new Repository<>(b -> b.id);
        books.save(new Book(1, "Clean Code"));
        books.save(new Book(2, "Effective Java"));
        System.out.println(books.findById(2).map(b -> b.title).orElse("missing"));
        System.out.println(books.findById(9).map(b -> b.title).orElse("missing"));
        System.out.println(books.count());

        // Type erasure: both lists have the same run-time class
        List<String> a = new ArrayList<>();
        List<Integer> b = new ArrayList<>();
        System.out.println(a.getClass() == b.getClass());

        // Type-safe heterogeneous container: Class objects as keys
        Favorites f = new Favorites();
        f.put(String.class, "Java");
        f.put(Integer.class, 21);
        String lang = f.get(String.class);
        int version = f.get(Integer.class);
        System.out.println(lang + " " + version);
    }
}

class Repository<ID, T> {
    private final Map<ID, T> store = new LinkedHashMap<>();
    private final Function<T, ID> idOf;
    Repository(Function<T, ID> idOf) { this.idOf = idOf; }
    void save(T entity) { store.put(idOf.apply(entity), entity); }
    Optional<T> findById(ID id) { return Optional.ofNullable(store.get(id)); }
    int count() { return store.size(); }
}

class Book {
    final int id;
    final String title;
    Book(int id, String title) { this.id = id; this.title = title; }
}

class Favorites {
    private final Map<Class<?>, Object> values = new HashMap<>();
    <T> void put(Class<T> type, T value) { values.put(type, type.cast(value)); }
    <T> T get(Class<T> type) { return type.cast(values.get(type)); }
}
`, code`
Effective Java
missing
2
true
Java 21
`, "One Repository class serves any entity and id type; the function tells it how to read an entity's id. Erasure means the JVM sees only ArrayList, so the Favorites class passes Class objects to keep the type information at run time."),
    assignments: [
      task("Write a generic method swap(T[] array, int i, int j) and use it on a String array and an Integer array.", "A generic method works on any reference element type.", code`
static <T> void swap(T[] array, int i, int j) {
    T tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
}
String[] s = {"a", "b"};   swap(s, 0, 1);   // [b, a]
Integer[] n = {1, 2, 3};   swap(n, 0, 2);   // [3, 2, 1]
`),
      task("Why does this not compile, and how do you fix it? List<Integer> ints = new ArrayList<>(); List<Number> nums = ints;", "Generics are invariant: List<Integer> is not a List<Number>. If it were, nums.add(3.14) would put a Double into a list of Integers. Use a wildcard when you only need to read: List<? extends Number> nums = ints;"),
      task("Write a generic class Stack<E> backed by an ArrayList with push, pop (throwing on empty) and isEmpty.", "The element type parameter flows through every method, so a Stack<String> can only hold Strings.", code`
class Stack<E> {
    private final List<E> items = new ArrayList<>();
    void push(E item) { items.add(item); }
    E pop() {
        if (items.isEmpty()) throw new IllegalStateException("empty stack");
        return items.remove(items.size() - 1);
    }
    boolean isEmpty() { return items.isEmpty(); }
}
`),
    ],
    alternates: [
      alt("Comparator-based max instead of a bounded type", "Passing a Comparator works for types that are not Comparable, or when you want a different order.", "Max.java", code`
import java.util.Comparator;
import java.util.List;

static <T> T max(List<T> items, Comparator<? super T> order) {
    T best = items.get(0);
    for (T item : items) if (order.compare(item, best) > 0) best = item;
    return best;
}
// max(List.of("pear", "fig", "banana"), Comparator.comparingInt(String::length)) -> "banana"
`),
      alt("Use the library: Collections.max and Optional", "The standard library already has generic, bounded utilities.", "Library.java", code`
import java.util.Collections;
import java.util.List;

int biggest = Collections.max(List.of(4, 9, 2));            // 9
String longest = Collections.max(List.of("pear", "zebra"));  // "zebra"
`),
    ],
  },
};
