import type { DeepCourse } from "../types";
import { DEEP_COURSES } from "../index";
import { code, file, mcq, qa } from "./helpers";

export const COURSE: DeepCourse = {
  ...DEEP_COURSES.find(course => course.id === "core-java")!,
  intro: [
    "Core Java is the part of Java every other Java technology stands on: the type system, object-oriented design, exceptions, the Collections Framework, generics, I/O, threads and the JVM that runs it all.",
    "Topics follow the order most university syllabi and OCP (Oracle Certified Professional) exams use. Each one ends with written answers and MCQs of the kind asked in campus placements and technical interviews. Examples target Java 17 or later (LTS).",
  ],
  topics: [
    {
      id: "jdk-jre-jvm", module: "Foundations", title: "JDK, JRE, JVM and how a Java program runs", level: "Beginner", minutes: 14,
      summary: "Source code becomes platform-neutral bytecode, and the JVM loads, verifies and executes it — interpreting first, then compiling hot code.",
      description: [
        "The JDK (Java Development Kit) is what developers install: the compiler javac, tools such as jar, javadoc, jshell and jdb, plus a runtime. The JRE (Java Runtime Environment) is the runtime part — the JVM and the standard class library. Since Java 11, Oracle and most vendors ship only the JDK; you can build a trimmed runtime for your app with jlink.",
        "javac compiles .java files into .class files containing bytecode, an instruction set for an abstract machine rather than for your CPU. The JVM (Java Virtual Machine) loads classes through class loaders, verifies the bytecode for safety, and executes it. The HotSpot JVM interprets bytecode first, profiles it, and compiles frequently executed methods to native code with its JIT (Just-In-Time) compilers. This is why Java is described as “write once, run anywhere”: the same .class file runs on any OS that has a JVM.",
        "A program starts at public static void main(String[] args). Since Java 11 you can run a single source file directly (java Hello.java) and Java 21+ previews a simpler instance main method, but the classic main signature is what exams expect.",
      ],
      usage: [
        "Install a JDK (Temurin, Oracle, Corretto) and set JAVA_HOME; javac and java must come from the same version.",
        "Use jshell for quick experiments with expressions and APIs without writing a class.",
        "Package compiled classes into a JAR with a Main-Class manifest entry to run with java -jar.",
        "Pass JVM options such as -Xms/-Xmx (heap size) or -XX:+UseG1GC before the class name, and program arguments after it.",
      ],
      files: [
        file("src/com/example/Hello.java", code`
package com.example;

public class Hello {
    // Entry point: the JVM looks for exactly this signature.
    public static void main(String[] args) {
        String name = args.length > 0 ? args[0] : "World";
        System.out.println("Hello, " + name + "!");
        System.out.println("Running on Java " + Runtime.version());
    }
}`),
        file("build.sh", code`
# Compile into the out/ folder, keeping the package structure
javac -d out src/com/example/Hello.java

# Run: classpath first, then the fully-qualified class name, then program arguments
java -cp out com.example.Hello Asha

# Package and run as a JAR
jar --create --file hello.jar --main-class com.example.Hello -C out .
java -jar hello.jar

# Inspect the bytecode javac produced
javap -c -cp out com.example.Hello`),
        file("jshell-session.txt", code`
jshell> int x = 7 * 6
x ==> 42

jshell> "java".toUpperCase()
$2 ==> "JAVA"

jshell> /exit`),
      ],
      tips: [
        "The file name must match the public class name: a public class Hello must live in Hello.java.",
        "“JVM is platform-independent” is a classic trap — bytecode is platform-independent; each JVM is platform-specific.",
        "Use javap -c to see bytecode when explaining what the compiler did (for example with string concatenation or autoboxing).",
        "In interviews, mention the JIT: Java is both interpreted and compiled, which is why long-running services get faster after warm-up.",
      ],
      subjective: [
        qa("Differentiate JDK, JRE and JVM.", "The JVM is the abstract machine that loads, verifies and executes bytecode; it is platform-specific. The JRE is the JVM plus the core class libraries needed to run programs. The JDK is the JRE plus development tools such as javac, jar, javadoc and jshell.\n\nIn short: JDK ⊃ JRE ⊃ JVM. Developers need the JDK; historically, end users only needed the JRE, although modern Java distributes JDKs and lets you build custom runtimes with jlink."),
        qa("Explain why Java is called platform-independent.", "javac does not produce machine code for a specific CPU. It produces bytecode, which any conforming JVM can execute. Because JVMs exist for Windows, Linux, macOS and other platforms, the same .class or .jar runs everywhere without recompilation. The JVM itself is platform-dependent; the bytecode is not."),
        qa("What is the role of the JIT compiler?", "The JIT (Just-In-Time) compiler converts frequently executed bytecode into native machine code at run time. HotSpot starts by interpreting, profiles which methods are hot, then compiles them (tiered C1 then C2 compilation) using run-time information such as which branch is usually taken, enabling optimizations like inlining and escape analysis. This gives Java near-native performance after warm-up."),
        qa("Why is main declared public static void?", "public so the JVM, outside the class, can call it; static so it can be invoked without creating an object of the class; void because it returns nothing to the JVM (use System.exit(code) to return a status). String[] args receives the command-line arguments."),
      ],
      objective: [
        mcq("Which tool converts .java source files into bytecode?", ["java", "javac", "javap", "jar"], 1, "javac is the compiler. java launches the JVM, javap disassembles class files, and jar packages them."),
        mcq("Bytecode is executed by:", ["The operating system directly", "The JVM", "The JDK compiler", "The browser"], 1, "The JVM interprets bytecode and JIT-compiles hot methods to native code."),
        mcq("Which statement is TRUE?", ["The JVM is platform-independent", "Bytecode is platform-independent", "The JRE contains javac", "A .class file contains x86 machine code"], 1, "Bytecode runs on any JVM; each JVM implementation is specific to a platform. javac ships with the JDK, not the JRE."),
        mcq("What happens if main is declared without static?", ["Compile-time error", "It runs normally", "The JVM reports that the main method is not found or not static at launch", "It runs twice"], 2, "The class compiles, but the classic launcher cannot use it as an entry point and reports an error when you run it (newer previews of instance main methods aside)."),
        mcq("Which file extension holds compiled Java bytecode?", [".java", ".class", ".exe", ".jvm"], 1, "javac writes one .class file per class, including nested classes such as Outer$Inner.class."),
      ],
    },
    {
      id: "data-types", module: "Foundations", title: "Data types, variables, wrappers and casting", level: "Beginner", minutes: 16,
      summary: "Eight primitives, reference types, widening and narrowing conversions, autoboxing and the Integer cache.",
      description: [
        "Java is statically typed: every variable has a type known at compile time. There are eight primitive types — byte (8-bit), short (16), int (32), long (64), float (32-bit IEEE 754), double (64), char (16-bit UTF-16 code unit) and boolean. Everything else is a reference type: classes, interfaces, arrays, enums and records. A reference variable stores a reference to an object on the heap, or null.",
        "Conversions from a smaller to a larger range (int to long, long to float) are widening and happen automatically. Narrowing (double to int, int to byte) needs an explicit cast and may lose information: (int) 3.99 is 3 and (byte) 200 is -56 because only the low 8 bits are kept. In arithmetic, byte, short and char are promoted to int first, so byte b = a + 1; does not compile without a cast, while b += 1 does (compound assignment includes an implicit cast).",
        "Each primitive has a wrapper class (Integer, Long, Double, Character, Boolean…) used where objects are required, such as in collections. The compiler converts automatically (autoboxing and unboxing). Integer.valueOf caches values from -128 to 127, so == between two boxed Integers may be true for small numbers and false for larger ones — always compare wrapper values with equals. Unboxing a null wrapper throws NullPointerException.",
        "Local variables have no default value and must be assigned before use; fields get defaults (0, false, '\\u0000', null). Since Java 10, var lets the compiler infer a local variable's type; the variable is still statically typed.",
      ],
      usage: [
        "Use int for counters and indexes, long for IDs and timestamps, double for scientific values.",
        "Use BigDecimal (constructed from a String) for money; float and double cannot represent 0.1 exactly.",
        "Use wrapper types only where null or an object is genuinely needed (collections, optional fields from a database).",
        "Use var when the type is obvious from the right-hand side, e.g. var users = new ArrayList<User>();",
      ],
      files: [
        file("src/TypesDemo.java", code`
import java.math.BigDecimal;

public class TypesDemo {
    public static void main(String[] args) {
        int count = 2_147_483_647;          // Integer.MAX_VALUE; underscores aid reading
        long big = count + 1L;               // widening: the 1L makes this long arithmetic
        int overflow = count + 1;            // wraps around to -2147483648, no exception

        double price = 0.1 + 0.2;            // 0.30000000000000004
        BigDecimal exact = new BigDecimal("0.1").add(new BigDecimal("0.2")); // 0.3

        int truncated = (int) 3.99;          // narrowing cast: 3
        byte wrapped = (byte) 200;           // keeps low 8 bits: -56
        char letter = 'A';
        int code = letter + 1;               // char promoted to int: 66

        byte b = 10;
        b += 5;                              // OK: compound assignment casts implicitly
        // b = b + 5;                        // compile error: int cannot be assigned to byte

        var names = new java.util.ArrayList<String>(); // inferred: ArrayList<String>
        names.add("Ravi");

        System.out.printf("%d %d %f %s %d %d %d %s%n", big, overflow, price, exact, truncated, wrapped, code, names);
    }
}`),
        file("src/BoxingDemo.java", code`
public class BoxingDemo {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println(a == b);      // true  (cached by Integer.valueOf)
        System.out.println(c == d);      // false (two different objects)
        System.out.println(c.equals(d)); // true  (compare values)

        Integer missing = null;
        try {
            int value = missing;         // auto-unboxing calls missing.intValue()
        } catch (NullPointerException e) {
            System.out.println("Unboxing null throws NPE");
        }

        int parsed = Integer.parseInt("42");          // String -> int
        Integer boxed = Integer.valueOf("42");        // String -> Integer (may use the cache)
        String text = String.valueOf(parsed);         // int -> String
        System.out.println(parsed + boxed + text);    // 84 then string concatenation: "8442"
    }
}`),
      ],
      tips: [
        "Default values apply to fields and array elements, never to local variables.",
        "Character literals use single quotes ('A'); strings use double quotes. 'A' + 'B' is 131, not \"AB\".",
        "Integer division truncates toward zero: 7 / 2 is 3 and -7 / 2 is -3. Use 7 / 2.0 for 3.5.",
        "Math.addExact and friends throw ArithmeticException on overflow when silent wrap-around would be a bug.",
      ],
      subjective: [
        qa("List the primitive data types in Java with their sizes and default values.", "byte 8-bit (0), short 16-bit (0), int 32-bit (0), long 64-bit (0L), float 32-bit (0.0f), double 64-bit (0.0d), char 16-bit unsigned UTF-16 unit ('\\u0000'), boolean (false; its size is JVM-dependent). Defaults apply to fields and array elements; local variables must be initialized explicitly."),
        qa("What is autoboxing? Explain one pitfall.", "Autoboxing is the automatic conversion of a primitive into its wrapper object (int to Integer) and unboxing is the reverse, inserted by the compiler, e.g. list.add(5) becomes list.add(Integer.valueOf(5)).\n\nPitfalls: comparing wrappers with == compares references, so it works for cached values -128..127 and fails above; unboxing null throws NullPointerException; boxing inside tight loops creates garbage and slows code."),
        qa("Differentiate widening and narrowing conversion with examples.", "Widening converts to a type with a larger range and is implicit and safe in magnitude: int i = 10; long l = i; double d = l;. Narrowing converts to a smaller range and needs an explicit cast because data may be lost: double d = 9.7; int i = (int) d; // 9. Note long to float is widening but can lose precision."),
      ],
      objective: [
        mcq("What is the output of System.out.println((byte) 130);?", ["130", "-126", "126", "Compile error"], 1, "130 in 8 bits is 1000 0010, which as signed two's complement is -126."),
        mcq("Which line fails to compile? byte b = 1;", ["b += 2;", "b = (byte)(b + 2);", "b = b + 2;", "b++;"], 2, "b + 2 is an int expression and needs an explicit cast. += and ++ include an implicit narrowing cast."),
        mcq("Integer x = 1000, y = 1000; System.out.println(x == y);", ["true", "false", "Compile error", "Depends on the OS"], 1, "1000 is outside the default Integer cache (-128..127), so valueOf creates two objects and == compares references."),
        mcq("What is the default value of a local int variable?", ["0", "null", "There is none; using it before assignment is a compile error", "-1"], 2, "Local variables must be definitely assigned before use."),
        mcq("Size of char in Java?", ["8 bits", "16 bits", "32 bits", "Platform dependent"], 1, "char is an unsigned 16-bit UTF-16 code unit."),
      ],
    },
    {
      id: "operators-control-flow", module: "Foundations", title: "Operators and control flow", level: "Beginner", minutes: 15,
      summary: "Precedence, short-circuiting, increment pitfalls, switch expressions, labelled break/continue and the enhanced for loop.",
      description: [
        "Java's operators follow fixed precedence: postfix (x++), unary (++x, !, ~), multiplicative, additive, shift, relational, equality, bitwise &, ^, |, logical && and ||, ternary, then assignment. && and || short-circuit: the right side is evaluated only if needed, which makes checks such as s != null && s.isEmpty() safe. & and | on booleans evaluate both sides.",
        "x++ returns the old value then increments; ++x increments then returns. The famous trap i = i++; leaves i unchanged. The ternary operator cond ? a : b is an expression and its result type follows numeric promotion rules.",
        "Branching uses if/else and switch. The classic switch statement falls through without break. Since Java 14, switch expressions with arrow labels (case A, B ->) do not fall through, can return a value, and must be exhaustive; yield returns a value from a block. Java 21 adds pattern matching in switch (case Integer i when i > 0 ->).",
        "Loops are while, do-while (runs at least once), the classic for, and the enhanced for (for (T item : iterable)) over arrays and Iterables. break exits the nearest loop or switch, continue skips to the next iteration, and labels (outer:) let you break or continue an outer loop.",
      ],
      usage: [
        "Prefer switch expressions for mapping one value to another; the compiler checks you handled every enum constant.",
        "Use the enhanced for loop when you do not need the index; use an Iterator when you must remove elements while looping.",
        "Use labelled break to exit nested loops instead of boolean flags.",
        "Use bitwise operators for flags and masks: (flags & READ) != 0.",
      ],
      files: [
        file("src/ControlFlow.java", code`
public class ControlFlow {
    enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }

    static String kind(Day day) {
        // Switch expression: arrow labels, no fall-through, must be exhaustive
        return switch (day) {
            case SAT, SUN -> "weekend";
            case FRI -> {
                String s = "almost weekend";
                yield s;               // yield returns a value from a block
            }
            default -> "weekday";
        };
    }

    public static void main(String[] args) {
        int i = 5;
        int a = i++;       // a = 5, i = 6
        int b = ++i;       // i = 7, b = 7
        i = i++;           // i stays 7: the old value is assigned back
        System.out.println(a + " " + b + " " + i);

        String s = null;
        if (s != null && s.isEmpty()) { }   // safe: && short-circuits
        System.out.println(kind(Day.SAT) + ", " + kind(Day.FRI));

        // Labelled break exits both loops at once
        outer:
        for (int row = 0; row < 3; row++) {
            for (int col = 0; col < 3; col++) {
                if (row * col == 2) break outer;
                System.out.print(row + "" + col + " ");
            }
        }
        System.out.println();

        int n = 0;
        do { n++; } while (n < 0);   // body runs once even though the condition is false
        System.out.println("do-while ran " + n + " time");
    }
}`),
        file("src/PatternSwitch.java", code`
// Java 21: pattern matching for switch with guards
public class PatternSwitch {
    static String describe(Object value) {
        return switch (value) {
            case null -> "null";
            case Integer i when i > 0 -> "positive int " + i;
            case Integer i -> "int " + i;
            case String str -> "string of length " + str.length();
            default -> "something else: " + value.getClass().getSimpleName();
        };
    }

    public static void main(String[] args) {
        for (Object o : new Object[]{ 42, -1, "hi", 3.14, null }) {
            System.out.println(describe(o));
        }
    }
}`),
      ],
      tips: [
        "Write a deliberate fall-through in an old-style switch with a // fall through comment; otherwise use arrow labels.",
        "Compare strings with equals, never ==; switch on strings uses equals internally.",
        "Precedence surprise: \"Sum: \" + 1 + 2 prints Sum: 12, while 1 + 2 + \" sum\" prints 3 sum.",
        "Integer overflow inside a loop condition (int i grows past MAX_VALUE) can create infinite loops.",
      ],
      subjective: [
        qa("Explain short-circuit evaluation with an example.", "With && the right operand is evaluated only if the left is true; with || only if the left is false. Example: if (user != null && user.isActive()) — when user is null the second call is skipped, avoiding a NullPointerException. The non-short-circuit operators & and | always evaluate both sides."),
        qa("Compare the traditional switch statement with the switch expression.", "The traditional statement uses case X: labels, falls through to the next case unless you break, and does not produce a value. The switch expression (Java 14+) uses case X -> labels, never falls through, can combine labels (case A, B ->), yields a value that can be assigned or returned, and must be exhaustive — for enums and sealed types the compiler checks every case is covered. Blocks return values with yield."),
        qa("What is the difference between while and do-while?", "while checks the condition before each iteration, so the body may run zero times. do-while checks after the body, so the body runs at least once. do-while is natural for menus or input validation loops where you must prompt at least once."),
      ],
      objective: [
        mcq("int x = 10; x = x++ + ++x; What is x?", ["21", "22", "20", "23"], 1, "x++ yields 10 (x becomes 11), ++x makes x 12 and yields 12; 10 + 12 = 22 is assigned."),
        mcq("Output of System.out.println(10 + 20 + \"Java\" + 10 + 20);", ["30Java30", "1020Java1020", "30Java1020", "Compile error"], 2, "Evaluated left to right: 10 + 20 = 30, then string concatenation for the rest."),
        mcq("Which loop always executes its body at least once?", ["for", "while", "do-while", "enhanced for"], 2, "The condition of do-while is tested after the body."),
        mcq("In a switch expression with arrow labels, what happens after a matching case runs?", ["Falls through to the next case", "Exits the switch", "Runs default", "Throws an exception"], 1, "Arrow labels never fall through."),
        mcq("Which operator does NOT short-circuit?", ["&&", "||", "&", "?:"], 2, "& on booleans evaluates both operands. The ternary evaluates only the selected branch."),
      ],
    },
    {
      id: "arrays-strings", module: "Foundations", title: "Arrays, String, StringBuilder and the string pool", level: "Beginner", minutes: 18,
      summary: "Fixed-size arrays, 2-D arrays, immutable Strings, interning, and when to use StringBuilder.",
      description: [
        "An array is a fixed-length, indexed object holding elements of one type. It is created with new int[5] (elements default to 0) or an initializer {1, 2, 3}, and its length is the field arr.length. Accessing an index outside 0..length-1 throws ArrayIndexOutOfBoundsException. A two-dimensional array is an array of arrays, so rows can have different lengths (jagged arrays). java.util.Arrays provides sort, binarySearch, fill, copyOf, equals and toString.",
        "String objects are immutable: methods like toUpperCase, replace and substring return new strings. Immutability makes strings thread-safe, safe as HashMap keys (their hash code is cached) and safe to share. String literals are stored in the string pool, so two identical literals refer to the same object; new String(\"a\") always creates a new object. intern() returns the pooled instance.",
        "Because strings are immutable, building a string in a loop with + creates many temporary objects. StringBuilder is a mutable, non-synchronized buffer with append, insert, reverse and deleteCharAt; StringBuffer is its older synchronized (thread-safe, slower) equivalent. The compiler already optimizes a single expression like a + b + c, so StringBuilder matters inside loops.",
      ],
      usage: [
        "Use arrays for fixed-size, performance-sensitive data and primitive storage; use ArrayList when the size changes.",
        "Use equals or equalsIgnoreCase to compare strings, and isBlank (Java 11) to test for whitespace-only input.",
        "Use StringBuilder to build strings in loops, and String.join or Collectors.joining for delimited output.",
        "Use Arrays.toString / Arrays.deepToString to print arrays — println(arr) prints a type and hash like [I@1b6d3586.",
      ],
      files: [
        file("src/ArraysDemo.java", code`
import java.util.Arrays;

public class ArraysDemo {
    public static void main(String[] args) {
        int[] marks = {72, 95, 60, 88};
        Arrays.sort(marks);                                 // [60, 72, 88, 95]
        int pos = Arrays.binarySearch(marks, 88);           // works only on sorted arrays
        int[] bigger = Arrays.copyOf(marks, 6);             // pads with 0
        System.out.println(Arrays.toString(bigger) + " index of 88 = " + pos);

        // Jagged 2-D array: each row is its own array
        int[][] triangle = new int[4][];
        for (int r = 0; r < triangle.length; r++) {
            triangle[r] = new int[r + 1];
            triangle[r][0] = triangle[r][r] = 1;
            for (int c = 1; c < r; c++) triangle[r][c] = triangle[r - 1][c - 1] + triangle[r - 1][c];
        }
        System.out.println(Arrays.deepToString(triangle));  // Pascal's triangle

        int sum = 0;
        for (int m : marks) sum += m;                       // enhanced for over an array
        System.out.println("Average: " + (double) sum / marks.length);
    }
}`),
        file("src/StringsDemo.java", code`
public class StringsDemo {
    public static void main(String[] args) {
        String a = "java";
        String b = "java";
        String c = new String("java");
        System.out.println(a == b);          // true  : same pooled literal
        System.out.println(a == c);          // false : new object on the heap
        System.out.println(a == c.intern()); // true  : intern returns the pooled one
        System.out.println(a.equals(c));     // true  : same characters

        String upper = a.toUpperCase();      // a is unchanged: strings are immutable
        System.out.println(a + " " + upper);

        String csv = " Asha, Ravi ,Meera ";
        for (String part : csv.strip().split("\\s*,\\s*")) System.out.println("[" + part + "]");

        System.out.println("level".contentEquals(new StringBuilder("level").reverse()));
        System.out.println(String.join(" | ", "a", "b", "c"));
        System.out.println("ab".repeat(3) + " " + "  ".isBlank());
    }
}`),
        file("src/BuilderDemo.java", code`
public class BuilderDemo {
    // O(n) total work: one growing buffer instead of n intermediate Strings
    static String numbers(int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= n; i++) {
            if (i > 1) sb.append(',');
            sb.append(i);
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(numbers(10));
        StringBuilder sb = new StringBuilder("hello");
        sb.insert(0, '[').append(']').setCharAt(1, 'H');
        System.out.println(sb);              // [Hello]
        System.out.println(sb.reverse());    // ]olleH[
    }
}`),
      ],
      tips: [
        "arr.length is a field; str.length() is a method; list.size() is a method — a favourite MCQ.",
        "String.split takes a regular expression, so split(\".\") splits on every character; use split(\"\\\\.\").",
        "substring(begin, end) excludes end; substring(2, 5) has length 3.",
        "char arrays are preferred over String for passwords so the contents can be wiped after use.",
      ],
      subjective: [
        qa("Why are Strings immutable in Java?", "Security (class names, file paths and URLs cannot be changed after validation), thread safety (shared without synchronization), the string pool (many references can safely share one literal), and hashing (the hash code is computed once and cached, making strings efficient HashMap keys). Any modifying method returns a new String."),
        qa("Compare String, StringBuilder and StringBuffer.", "String is immutable and thread-safe by virtue of immutability. StringBuilder is mutable and not synchronized — fastest for building strings in a single thread. StringBuffer is mutable and synchronized, so it is thread-safe but slower; it is rarely needed today. Use String for values, StringBuilder for construction."),
        qa("How many objects are created by String s = new String(\"hello\");?", "Up to two: the literal \"hello\" is placed in the string pool when the class is loaded (if not already present), and new creates a separate String object on the heap that refers to the same character data. If the literal already exists in the pool, only one new object is created by this statement."),
      ],
      objective: [
        mcq("What does int[] a = new int[3]; System.out.println(a[1]); print?", ["null", "0", "Garbage value", "Compile error"], 1, "Array elements receive default values; int defaults to 0."),
        mcq("Which is the correct way to get an array's size?", ["arr.length()", "arr.size()", "arr.length", "arr.getLength()"], 2, "length is a final field of every array."),
        mcq("String s1 = \"Hi\"; String s2 = \"H\" + \"i\"; s1 == s2 is:", ["true", "false", "Compile error", "Runtime exception"], 0, "Both operands are compile-time constants, so the compiler folds them into the literal \"Hi\", which is pooled."),
        mcq("Which class is mutable and NOT synchronized?", ["String", "StringBuffer", "StringBuilder", "All of them"], 2, "StringBuilder was added in Java 5 as an unsynchronized replacement for StringBuffer."),
        mcq("\"Java\".substring(1, 3) returns:", ["\"Jav\"", "\"av\"", "\"ava\"", "\"va\""], 1, "Characters at indexes 1 and 2: 'a' and 'v'."),
      ],
    },
    {
      id: "classes-objects", module: "Object-oriented programming", title: "Classes, objects, constructors, this and static", level: "Beginner", minutes: 18,
      summary: "How objects are created and initialized, constructor chaining, and the difference between instance and class members.",
      description: [
        "A class is a blueprint that declares fields (state) and methods (behaviour); an object is an instance created with new, which allocates memory on the heap, sets fields to defaults, runs initializers and the constructor, and returns a reference. Every object has its own copy of instance fields.",
        "A constructor has the class's name and no return type. If you write none, the compiler adds a no-argument default constructor; as soon as you write any constructor, it does not. Constructors can be overloaded, and one can call another with this(...) — which must be the first statement. The keyword this refers to the current object, commonly used to distinguish a field from a parameter with the same name.",
        "static members belong to the class rather than to any object: a static field has a single copy shared by all instances, and a static method can be called as ClassName.method() but cannot use this or access instance members directly. Static initializer blocks run once when the class is loaded; instance initializer blocks run before the constructor body each time an object is created.",
        "Java is always pass-by-value. For objects the value passed is the reference, so a method can modify the object's state but reassigning the parameter does not affect the caller's variable.",
      ],
      usage: [
        "Use constructors to establish a valid object: validate arguments and assign every required field.",
        "Use constructor chaining (this(...)) to keep one constructor as the single source of initialization logic.",
        "Use static for constants (static final), counters shared across instances, and utility methods such as Math.max.",
        "Use static factory methods (of, from, valueOf) when a name explains creation better than an overloaded constructor.",
      ],
      files: [
        file("src/bank/Account.java", code`
package bank;

public class Account {
    private static int created = 0;                 // one copy shared by all accounts
    public static final String BANK = "MC Bank";     // constant

    private final String id;
    private final String owner;
    private double balance;

    static { System.out.println("Account class loaded"); }  // runs once, at class load

    { created++; }                                   // instance initializer: before every constructor body

    public Account(String owner) {
        this(owner, 0.0);                            // chain to the main constructor; must be first
    }

    public Account(String owner, double opening) {
        if (opening < 0) throw new IllegalArgumentException("opening balance < 0");
        this.id = "AC" + created;
        this.owner = owner;                          // this.owner is the field, owner the parameter
        this.balance = opening;
    }

    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
        balance += amount;
    }

    public double getBalance() { return balance; }
    public String getId() { return id; }
    public static int created() { return created; }  // static: no 'this' available here

    @Override public String toString() { return id + " (" + owner + "): " + balance; }
}`),
        file("src/bank/Main.java", code`
package bank;

public class Main {
    static void tryToReplace(Account acc) {
        acc.deposit(100);            // changes the caller's object (same reference)
        acc = new Account("Other");  // only the local copy of the reference changes
    }

    public static void main(String[] args) {
        Account a = new Account("Asha", 500);
        Account b = new Account("Ravi");
        tryToReplace(a);
        System.out.println(a);                       // AC1 (Asha): 600.0
        System.out.println(b);
        System.out.println("Accounts created: " + Account.created() + " at " + Account.BANK);
    }
}`),
      ],
      tips: [
        "Order of initialization: static blocks (once) → instance field initializers and instance blocks (in source order) → constructor body.",
        "A constructor with a return type such as void Account() is just a method, not a constructor — a classic trick question.",
        "Static methods are not overridden; a subclass static method with the same signature hides the parent one.",
        "Prefer final fields and no setters when a value should not change after construction.",
      ],
      subjective: [
        qa("What is a constructor? How is it different from a method?", "A constructor initializes a newly created object. It has the same name as the class, no return type (not even void), is invoked automatically by new, is not inherited, and cannot be static, final or abstract. A method has a return type, any name, is called explicitly, can be inherited and overridden, and can be static."),
        qa("Is Java pass-by-value or pass-by-reference? Justify.", "Java is strictly pass-by-value. For primitives the value is copied. For objects the value of the reference is copied, so both caller and method point to the same object: changes to its fields are visible to the caller, but assigning a new object to the parameter changes only the method's copy. A swap(a, b) method on two object references therefore cannot swap the caller's variables."),
        qa("Explain the static keyword with respect to variables, methods, blocks and nested classes.", "A static variable has one copy per class, shared by all instances. A static method belongs to the class, is called without an object and cannot use this or instance members directly. A static block runs once when the class is initialized, often to set up static data. A static nested class does not hold a reference to an outer instance and can be created without one."),
      ],
      objective: [
        mcq("If a class defines only Student(String name), what does new Student() do?", ["Calls the default constructor", "Compile-time error", "Creates an object with name null", "Runtime exception"], 1, "The compiler adds a default constructor only when no constructor is declared."),
        mcq("Where must this(...) appear in a constructor?", ["Anywhere", "Last statement", "First statement", "Only in static methods"], 2, "this(...) or super(...) must be the first statement, and you can use only one of them."),
        mcq("Which of these can a static method access directly?", ["Instance variables", "this", "Static variables", "super"], 2, "Static methods have no current object."),
        mcq("When does a static initializer block run?", ["Every time an object is created", "When the class is initialized, once", "When main ends", "Never automatically"], 1, "Static blocks run once during class initialization, before any instance is created."),
        mcq("Which keyword refers to the current object?", ["super", "self", "this", "current"], 2, "this refers to the current instance; super to the parent part of it."),
      ],
    },
    {
      id: "encapsulation-packages", module: "Object-oriented programming", title: "Encapsulation, access modifiers and packages", level: "Beginner", minutes: 13,
      summary: "Hide state behind methods, choose the narrowest visibility, and organize code into packages.",
      description: [
        "Encapsulation means bundling data with the methods that operate on it and restricting direct access to the data. Fields are made private and exposed through methods that enforce rules (invariants) — for example, a balance that can never go negative. Callers depend on behaviour, not on representation, so the internals can change without breaking them.",
        "Java has four access levels. private: visible only inside the class. Package-private (no modifier, the default): visible inside the same package. protected: same package plus subclasses in other packages (through inheritance). public: visible everywhere. Top-level classes can only be public or package-private.",
        "Packages group related types and prevent name clashes; the package name mirrors the folder structure (com.example.bank → com/example/bank). import brings types into scope; java.lang is imported automatically, and static import brings in static members. Since Java 9, modules (module-info.java) add another layer that controls which packages are exported at all.",
      ],
      usage: [
        "Make every field private by default; widen access only when a real caller needs it.",
        "Expose behaviour (withdraw) rather than setters (setBalance) so the class protects its own rules.",
        "Return copies or unmodifiable views of internal collections from getters.",
        "Use reverse-domain package names (com.company.project.feature) and keep one feature per package.",
      ],
      files: [
        file("src/com/shop/model/Cart.java", code`
package com.shop.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Cart {
    private final List<String> items = new ArrayList<>();   // hidden representation
    private int maxItems = 10;                              // invariant: size <= maxItems

    public void add(String item) {
        if (item == null || item.isBlank()) throw new IllegalArgumentException("item required");
        if (items.size() >= maxItems) throw new IllegalStateException("cart is full");
        items.add(item);
    }

    // Read-only view: callers cannot bypass add()'s checks
    public List<String> items() { return Collections.unmodifiableList(items); }

    int size() { return items.size(); }                      // package-private: only com.shop.model

    protected void resize(int newMax) { this.maxItems = newMax; } // subclasses may adjust
}`),
        file("src/com/shop/model/PremiumCart.java", code`
package com.shop.model;

public class PremiumCart extends Cart {
    public PremiumCart() { resize(50); }   // protected member used by a subclass
}`),
        file("src/com/shop/App.java", code`
package com.shop;

import com.shop.model.Cart;
import com.shop.model.PremiumCart;
import static java.lang.Math.max;      // static import

public class App {
    public static void main(String[] args) {
        Cart cart = new PremiumCart();
        cart.add("Keyboard");
        // cart.items().add("Hack");   // UnsupportedOperationException at run time
        // cart.size();                // compile error: not visible outside com.shop.model
        System.out.println(cart.items() + " " + max(3, 7));
    }
}`),
      ],
      tips: [
        "Access order from most to least restrictive: private < default < protected < public.",
        "An overriding method cannot reduce visibility (a public method cannot be overridden as protected).",
        "Encapsulation is not just getters and setters for every field — that only moves the problem.",
        "protected access from another package works only through a subclass reference, not on an arbitrary parent instance.",
      ],
      subjective: [
        qa("Define encapsulation and state its benefits.", "Encapsulation is wrapping data and the methods that operate on it into a single unit (a class) while hiding the data from direct outside access, usually with private fields and public methods. Benefits: the class can validate changes and maintain invariants, internal representation can change without affecting callers, code is easier to test and maintain, and read-only or write-only properties are possible."),
        qa("Explain all access modifiers with a table of visibility.", "private — same class only. default (package-private) — same class and same package. protected — same package plus subclasses in other packages. public — everywhere. Visibility grows in that order. Classes at top level may be public or default; members may use any of the four."),
      ],
      objective: [
        mcq("A member with no access modifier is visible to:", ["Only the class", "Classes in the same package", "Subclasses anywhere", "All classes"], 1, "Default (package-private) access is limited to the package."),
        mcq("Which modifier cannot be applied to a top-level class?", ["public", "private", "final", "abstract"], 1, "Top-level classes may be public or package-private; private applies to members and nested classes."),
        mcq("Which package is imported automatically?", ["java.util", "java.io", "java.lang", "java.base"], 2, "java.lang (String, Math, Object, System…) is always in scope."),
        mcq("Overriding public void show() with protected void show() in a subclass:", ["Compiles", "Compile error: weaker access", "Runtime error", "Hides the method"], 1, "An override must have the same or wider access."),
      ],
    },
    {
      id: "inheritance-polymorphism", module: "Object-oriented programming", title: "Inheritance, overriding and polymorphism", level: "Intermediate", minutes: 20,
      summary: "extends and super, method overriding versus overloading, dynamic method dispatch and upcasting/downcasting.",
      description: [
        "Inheritance lets a subclass reuse and extend a superclass with extends. Java supports single inheritance of classes (one direct parent) but a class can implement many interfaces. Every class ultimately extends java.lang.Object. Constructors are not inherited; every constructor first calls a superclass constructor, either explicitly with super(...) or implicitly with super().",
        "Overriding means a subclass provides its own implementation of an inherited instance method with the same signature. Rules: same name and parameters, a covariant (same or subtype) return type, access not more restrictive, and no broader checked exceptions. Annotate with @Override so the compiler catches mistakes. final methods cannot be overridden, private methods are not inherited, and static methods are hidden, not overridden.",
        "Overloading means several methods in the same class with the same name but different parameter lists. It is resolved at compile time from the static types of arguments (compile-time polymorphism). Overriding is resolved at run time from the actual object type (run-time polymorphism, dynamic method dispatch).",
        "A superclass reference can point to a subclass object (upcasting, implicit). Calls go to the object's overriding methods, but only members declared on the reference type are accessible. Downcasting needs an explicit cast and throws ClassCastException if the object is not of that type; check first with instanceof, which since Java 16 supports pattern binding (if (shape instanceof Circle c)). Fields are not polymorphic — they are resolved from the reference type.",
      ],
      usage: [
        "Use inheritance for a genuine is-a relationship (a SavingsAccount is an Account); otherwise prefer composition.",
        "Program to the supertype (Shape s = new Circle()) so new subtypes plug in without changing callers.",
        "Mark classes final, or sealed (Java 17), when they are not designed for extension.",
        "Call super.method() when a subclass should extend, not replace, the parent's behaviour.",
      ],
      files: [
        file("src/shapes/Shape.java", code`
package shapes;

public abstract class Shape {
    protected final String name;

    protected Shape(String name) { this.name = name; }

    public abstract double area();                         // each subclass must provide it

    public String describe() { return name + " with area " + String.format("%.2f", area()); }
}`),
        file("src/shapes/Circle.java", code`
package shapes;

public class Circle extends Shape {
    private final double r;

    public Circle(double r) {
        super("Circle");                                   // must be the first statement
        this.r = r;
    }

    @Override public double area() { return Math.PI * r * r; }

    public double circumference() { return 2 * Math.PI * r; }   // not on Shape
}`),
        file("src/shapes/Rectangle.java", code`
package shapes;

public class Rectangle extends Shape {
    protected final double w, h;

    public Rectangle(double w, double h) { this("Rectangle", w, h); }
    protected Rectangle(String name, double w, double h) { super(name); this.w = w; this.h = h; }

    @Override public double area() { return w * h; }

    // Overloading: same name, different parameters (resolved at compile time)
    public Rectangle scale(double f) { return new Rectangle(w * f, h * f); }
    public Rectangle scale(double fw, double fh) { return new Rectangle(w * fw, h * fh); }
}

class Square extends Rectangle {
    Square(double side) { super("Square", side, side); }

    @Override public String describe() { return super.describe() + " (all sides equal)"; }
}`),
        file("src/shapes/Main.java", code`
package shapes;

import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Shape> shapes = List.of(new Circle(1), new Rectangle(2, 3), new Square(2));
        for (Shape s : shapes) {
            System.out.println(s.describe());               // dynamic dispatch picks the override
            if (s instanceof Circle c) {                    // pattern matching: safe downcast
                System.out.printf("  circumference %.2f%n", c.circumference());
            }
        }
        Shape s = new Square(3);
        Rectangle r = (Rectangle) s;                        // fine: a Square is a Rectangle
        // Circle bad = (Circle) s;                         // ClassCastException at run time
        System.out.println(r.scale(2).area());
    }
}`),
      ],
      tips: [
        "Overloading vs overriding is the single most common OOP interview question — answer with: where (same class vs subclass), signature, binding time, and return type rules.",
        "Calling an overridable method from a constructor is dangerous: the subclass override runs before the subclass's fields are initialized.",
        "Java has no multiple inheritance of classes because of the diamond problem; interfaces with default methods resolve conflicts by forcing an override.",
        "super.super.method() is not legal Java.",
      ],
      subjective: [
        qa("Differentiate method overloading and method overriding.", "Overloading: same method name, different parameter list, usually in the same class; return type may differ; resolved at compile time (static polymorphism); applies to static and instance methods.\n\nOverriding: subclass redefines an inherited instance method with the same signature and a covariant return type; access cannot be reduced and broader checked exceptions cannot be added; resolved at run time on the actual object (dynamic polymorphism). final, static and private methods cannot be overridden."),
        qa("What is dynamic method dispatch? Give an example.", "It is the mechanism by which a call to an overridden method through a superclass reference is resolved at run time based on the actual object type. Example: Shape s = new Circle(1); s.area(); calls Circle.area() even though the reference type is Shape. The JVM uses the object's class (via virtual method tables) to select the implementation."),
        qa("Why does Java not support multiple inheritance of classes?", "To avoid the diamond problem: if C extended both A and B, and both define the same method or field, it would be ambiguous which one C inherits, and constructor chaining would be unclear. Java instead allows multiple inheritance of type through interfaces; when two interfaces provide the same default method, the implementing class must override it and may call a specific one with InterfaceName.super.method()."),
        qa("What are the uses of the super keyword?", "super(...) calls a superclass constructor (first statement only); super.method() calls the superclass version of an overridden method; super.field accesses a superclass field hidden by a subclass field."),
      ],
      objective: [
        mcq("Which is resolved at compile time?", ["Method overriding", "Method overloading", "Dynamic dispatch", "Virtual calls"], 1, "Overload resolution uses the static types of the arguments."),
        mcq("class A { int x = 10; } class B extends A { int x = 20; } A obj = new B(); System.out.println(obj.x);", ["10", "20", "Compile error", "0"], 0, "Fields are not polymorphic; they are resolved by the reference type A."),
        mcq("Which methods can be overridden?", ["static", "private", "final", "public instance"], 3, "Only accessible, non-final instance methods are overridden."),
        mcq("What does instanceof return for null instanceof Object?", ["true", "false", "Throws NPE", "Compile error"], 1, "instanceof is always false for null."),
        mcq("Every class in Java implicitly extends:", ["Class", "Object", "Main", "Base"], 1, "java.lang.Object is the root of the class hierarchy."),
      ],
    },
    {
      id: "abstraction-interfaces", module: "Object-oriented programming", title: "Abstraction: abstract classes and interfaces", level: "Intermediate", minutes: 18,
      summary: "When to use an abstract class versus an interface, default/static/private interface methods, and functional interfaces.",
      description: [
        "Abstraction means exposing what an object does while hiding how. Java provides two tools. An abstract class (abstract class Payment) cannot be instantiated, may have constructors, instance fields with state, concrete methods and abstract methods; a subclass must implement every abstract method or be abstract itself.",
        "An interface defines a contract. Its fields are implicitly public static final constants; its abstract methods are implicitly public abstract. Since Java 8 interfaces can have default methods (inherited implementations) and static methods; Java 9 added private methods for sharing code between defaults. A class can implement any number of interfaces, and an interface can extend several interfaces.",
        "Choose an abstract class when related classes share state or a template of steps (Template Method pattern). Choose an interface to describe a capability that unrelated classes may have (Comparable, Runnable, AutoCloseable) or when a class needs several such capabilities. An interface with exactly one abstract method is a functional interface and can be implemented with a lambda; @FunctionalInterface makes the compiler enforce that.",
        "Java 17 sealed classes and interfaces (sealed interface Shape permits Circle, Square) restrict which types may implement them, which lets switch statements be exhaustive.",
      ],
      usage: [
        "Define service contracts as interfaces (PaymentGateway) and depend on them, so implementations can be swapped and mocked in tests.",
        "Use an abstract base class to share fields and fixed algorithm steps among close relatives.",
        "Add default methods to evolve a published interface without breaking existing implementations.",
        "Use functional interfaces for callbacks and strategies; implement them with lambdas or method references.",
      ],
      files: [
        file("src/pay/PaymentGateway.java", code`
package pay;

public interface PaymentGateway {
    double MAX_AMOUNT = 100_000;                 // implicitly public static final

    Receipt charge(String account, double amount);   // implicitly public abstract

    default Receipt chargeWithFee(String account, double amount) {
        validate(amount);
        return charge(account, amount + fee(amount));
    }

    static PaymentGateway noop() { return (acc, amt) -> new Receipt("NOOP", amt); } // lambda: one abstract method

    private void validate(double amount) {          // Java 9: shared helper for defaults
        if (amount <= 0 || amount > MAX_AMOUNT) throw new IllegalArgumentException("bad amount");
    }

    private double fee(double amount) { return Math.round(amount * 0.02 * 100) / 100.0; }
}`),
        file("src/pay/Receipt.java", code`
package pay;

public record Receipt(String reference, double amount) { }`),
        file("src/pay/AbstractGateway.java", code`
package pay;

import java.util.UUID;

// Template Method: the fixed sequence lives here, the variable step in subclasses
public abstract class AbstractGateway implements PaymentGateway {
    private int calls;                                    // shared state: not possible in an interface

    @Override
    public final Receipt charge(String account, double amount) {
        calls++;
        log("charging " + amount + " to " + account);
        String ref = send(account, amount);
        log("done: " + ref);
        return new Receipt(ref, amount);
    }

    protected abstract String send(String account, double amount);

    protected String newReference() { return UUID.randomUUID().toString().substring(0, 8); }
    private void log(String msg) { System.out.println("[" + getClass().getSimpleName() + " #" + calls + "] " + msg); }
}`),
        file("src/pay/UpiGateway.java", code`
package pay;

public class UpiGateway extends AbstractGateway {
    @Override
    protected String send(String account, double amount) { return "UPI-" + newReference(); }

    public static void main(String[] args) {
        PaymentGateway gateway = new UpiGateway();       // depend on the interface
        System.out.println(gateway.chargeWithFee("asha@upi", 500));
        System.out.println(PaymentGateway.noop().charge("x", 1));
    }
}`),
      ],
      tips: [
        "Abstract classes can have constructors (called through super); interfaces cannot.",
        "If two interfaces provide the same default method, the implementing class must override it and can call A.super.method().",
        "A class wins over an interface: an inherited superclass method beats a default method with the same signature.",
        "An abstract class may have zero abstract methods — it just cannot be instantiated.",
      ],
      subjective: [
        qa("Differentiate an abstract class and an interface (post Java 8).", "Abstract class: can have instance fields, constructors, any access modifiers, concrete and abstract methods; a class can extend only one. Interface: only constants as fields, no constructors, methods are public abstract by default, may have default, static and private methods; a class can implement many, and interfaces can extend multiple interfaces.\n\nUse an abstract class for closely related classes sharing state or an algorithm skeleton; use an interface for a capability or contract that any class may provide."),
        qa("What is a functional interface? Name four from java.util.function.", "An interface with exactly one abstract method (default and static methods do not count), which can be implemented by a lambda or method reference. Examples: Predicate<T> (test → boolean), Function<T,R> (apply), Consumer<T> (accept), Supplier<T> (get). Others: Runnable, Callable, Comparator, BiFunction, UnaryOperator."),
        qa("Why were default methods introduced?", "To let library authors add methods to existing interfaces without breaking every class that implements them. Java 8 used this to add forEach to Iterable and stream() to Collection. They also enable small reusable behaviour in interfaces, but they cannot hold state."),
      ],
      objective: [
        mcq("Variables declared in an interface are implicitly:", ["private", "public static final", "protected", "transient"], 1, "Interface fields are constants."),
        mcq("Can an abstract class have a constructor?", ["No", "Yes", "Only if it has no abstract methods", "Only a private one"], 1, "It is invoked via super(...) when a concrete subclass is instantiated."),
        mcq("Which interface method kind was added in Java 9?", ["default", "static", "private", "abstract"], 2, "private interface methods let defaults share helper code."),
        mcq("A class implements two interfaces with the same default method m(). What happens?", ["The first interface wins", "Compile error unless the class overrides m()", "Runtime error", "Both run"], 1, "The class must resolve the conflict by overriding, optionally calling X.super.m()."),
        mcq("Which is NOT a functional interface?", ["Runnable", "Comparator", "Comparable", "List"], 3, "List has many abstract methods. Comparable and Comparator each have a single abstract method."),
      ],
    },
    {
      id: "object-methods-enums", module: "Object-oriented programming", title: "Object class methods, immutability, enums and nested classes", level: "Intermediate", minutes: 20,
      summary: "The equals/hashCode contract, toString, final, immutable classes, records, enums and the four kinds of nested classes.",
      description: [
        "java.lang.Object defines methods every class inherits: equals, hashCode, toString, getClass, clone, finalize (deprecated) and the monitor methods wait/notify/notifyAll. The default equals is reference equality. When you override equals you must override hashCode so that equal objects have equal hash codes; otherwise HashMap and HashSet misbehave. equals must be reflexive, symmetric, transitive, consistent and return false for null.",
        "final has three meanings: a final variable can be assigned once, a final method cannot be overridden, a final class cannot be extended. An immutable class (like String or LocalDate) is final, has private final fields, sets them in the constructor, has no setters, and makes defensive copies of mutable inputs and outputs. Java 16 records (record Point(int x, int y)) generate the constructor, accessors, equals, hashCode and toString for immutable data carriers.",
        "An enum is a type with a fixed set of constants, each a singleton instance. Enums can have fields, constructors (implicitly private), methods and even constant-specific bodies; they get values(), valueOf() and ordinal(), work in switch, and are the safest way to implement a singleton. EnumMap and EnumSet are fast collections keyed by enums.",
        "Nested classes: a static nested class is just a class scoped inside another; an inner (non-static) class has an implicit reference to an outer instance; a local class is declared inside a method; an anonymous class is declared and instantiated in one expression. Lambdas have largely replaced anonymous classes for functional interfaces.",
      ],
      usage: [
        "Override equals and hashCode (or use a record) for value objects used as map keys or set members.",
        "Make value types immutable: they are thread-safe and cannot be corrupted by callers.",
        "Use enums instead of int or String constants for statuses, roles and states.",
        "Use a static nested Builder class when a constructor would need many parameters.",
      ],
      files: [
        file("src/model/Money.java", code`
package model;

import java.util.Objects;

// Immutable value object written by hand
public final class Money {
    private final long paise;
    private final String currency;

    public Money(long paise, String currency) {
        this.paise = paise;
        this.currency = Objects.requireNonNull(currency);
    }

    public Money plus(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("currency mismatch");
        return new Money(paise + other.paise, currency);    // returns a new object
    }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money m)) return false;
        return paise == m.paise && currency.equals(m.currency);
    }

    @Override public int hashCode() { return Objects.hash(paise, currency); }  // consistent with equals

    @Override public String toString() { return currency + " " + paise / 100 + "." + String.format("%02d", paise % 100); }
}`),
        file("src/model/Point.java", code`
package model;

// A record generates the constructor, x(), y(), equals, hashCode and toString
public record Point(int x, int y) {
    public Point {                                     // compact constructor for validation
        if (x < 0 || y < 0) throw new IllegalArgumentException("negative coordinate");
    }
    public double distanceToOrigin() { return Math.hypot(x, y); }
}`),
        file("src/model/OrderStatus.java", code`
package model;

public enum OrderStatus {
    PLACED("Order placed") {
        @Override public OrderStatus next() { return SHIPPED; }
    },
    SHIPPED("On the way") {
        @Override public OrderStatus next() { return DELIVERED; }
    },
    DELIVERED("Delivered") {
        @Override public OrderStatus next() { return this; }
    };

    private final String label;
    OrderStatus(String label) { this.label = label; }   // enum constructors are implicitly private

    public String label() { return label; }
    public abstract OrderStatus next();                  // constant-specific behaviour
}`),
        file("src/model/Pizza.java", code`
package model;

import java.util.ArrayList;
import java.util.List;

public class Pizza {
    private final String size;
    private final List<String> toppings;

    private Pizza(Builder b) { size = b.size; toppings = List.copyOf(b.toppings); }

    public static class Builder {                        // static nested class
        private final String size;
        private final List<String> toppings = new ArrayList<>();
        public Builder(String size) { this.size = size; }
        public Builder topping(String t) { toppings.add(t); return this; }
        public Pizza build() { return new Pizza(this); }
    }

    @Override public String toString() { return size + " pizza with " + toppings; }

    public static void main(String[] args) {
        System.out.println(new Pizza.Builder("Large").topping("Paneer").topping("Onion").build());
        System.out.println(new Money(12_550, "INR").plus(new Money(50, "INR")));
        System.out.println(new Point(3, 4).distanceToOrigin() + " " + OrderStatus.PLACED.next().label());
        System.out.println(java.util.Set.of(new Point(1, 2)).contains(new Point(1, 2)));  // true: equals/hashCode
    }
}`),
      ],
      tips: [
        "Equal objects must have equal hash codes; unequal objects may share a hash code (a collision).",
        "Use getClass() != o.getClass() in equals when subclasses must never equal the parent; instanceof when they may.",
        "Enum.valueOf(\"X\") throws IllegalArgumentException for an unknown name.",
        "An inner class instance is created with outer.new Inner(); a static nested one with new Outer.Nested().",
      ],
      subjective: [
        qa("Explain the contract between equals() and hashCode().", "If a.equals(b) is true, then a.hashCode() must equal b.hashCode(). The reverse is not required. hashCode must also be consistent across calls while the object's relevant fields are unchanged. Hash-based collections first use hashCode to find a bucket and then equals to find the entry; overriding equals without hashCode means two equal keys land in different buckets, so map.get returns null and sets keep duplicates."),
        qa("How do you create an immutable class in Java?", "Declare the class final (or make constructors private with factories); make all fields private final; initialize them in the constructor; provide no setters; for mutable fields (Date, List, arrays) make defensive copies in the constructor and in getters (or wrap with unmodifiable views/List.copyOf); and do not let this escape during construction. Records give most of this for free, but you still need copies of mutable components."),
        qa("What are the advantages of enums over constants?", "Type safety (a method taking OrderStatus cannot receive an arbitrary int), a fixed namespace, readable toString, built-in values()/valueOf()/ordinal(), usable in switch with exhaustiveness checks, can carry fields and behaviour, are serializable and singleton per constant, and pair with efficient EnumSet/EnumMap."),
      ],
      objective: [
        mcq("If equals is overridden but not hashCode, which is most likely to break?", ["ArrayList.contains", "HashSet.contains", "Arrays.sort", "String.valueOf"], 1, "HashSet relies on hashCode to find the bucket before calling equals."),
        mcq("A final class:", ["Cannot have final methods", "Cannot be instantiated", "Cannot be extended", "Cannot have fields"], 2, "final on a class prevents subclassing (String is final)."),
        mcq("Which method returns the position of an enum constant?", ["index()", "ordinal()", "position()", "values()"], 1, "ordinal() is zero-based by declaration order."),
        mcq("Which does a record NOT generate automatically?", ["equals", "Accessor methods", "Setters", "toString"], 2, "Record components are final; there are no setters."),
        mcq("Which nested class holds an implicit reference to an instance of its outer class?", ["Static nested class", "Inner (non-static) class", "Enum", "Record"], 1, "That reference is why inner classes can access outer instance fields — and why they can leak memory."),
      ],
    },
    {
      id: "exceptions", module: "Core APIs", title: "Exception handling", level: "Intermediate", minutes: 20,
      summary: "The Throwable hierarchy, checked vs unchecked, try/catch/finally, try-with-resources, custom exceptions and best practices.",
      description: [
        "An exception is an event that disrupts normal flow. All exceptions extend Throwable, which has two branches: Error (serious JVM problems such as OutOfMemoryError and StackOverflowError that applications should not catch) and Exception. RuntimeException and its subclasses (NullPointerException, IllegalArgumentException, ArithmeticException, IndexOutOfBoundsException) are unchecked. Every other Exception (IOException, SQLException) is checked: the compiler forces you to catch it or declare it with throws.",
        "try encloses risky code; one or more catch blocks handle specific types, most specific first; a multi-catch (catch (IOException | SQLException e)) handles several unrelated types. finally always runs whether or not an exception occurred — except when the JVM exits — and is used for cleanup. If finally contains a return, it overrides any value or exception from try, which is why returning from finally is a bad idea.",
        "try-with-resources (Java 7) closes any AutoCloseable declared in its header automatically, in reverse order, even when an exception is thrown; exceptions thrown by close are attached as suppressed exceptions. throw raises an exception object; throws in a method signature declares the checked exceptions it may propagate.",
        "Custom exceptions extend Exception (checked) or RuntimeException (unchecked) and should carry context and the original cause (exception chaining) so stack traces show the root problem.",
      ],
      usage: [
        "Validate arguments early and throw IllegalArgumentException / NullPointerException (Objects.requireNonNull) with a clear message.",
        "Use try-with-resources for files, sockets, JDBC connections, statements and result sets.",
        "Catch an exception only where you can handle it (retry, fallback, translate); otherwise let it propagate.",
        "Wrap low-level exceptions in domain exceptions while keeping the cause: throw new OrderException(\"...\", e).",
      ],
      files: [
        file("src/errors/InsufficientFundsException.java", code`
package errors;

// Checked: callers must decide what to do about it
public class InsufficientFundsException extends Exception {
    private final double shortBy;

    public InsufficientFundsException(double shortBy) {
        super("Insufficient funds: short by " + shortBy);
        this.shortBy = shortBy;
    }

    public double getShortBy() { return shortBy; }
}`),
        file("src/errors/Wallet.java", code`
package errors;

public class Wallet {
    private double balance;

    public Wallet(double balance) { this.balance = balance; }

    public void pay(double amount) throws InsufficientFundsException {
        if (amount <= 0) throw new IllegalArgumentException("amount must be > 0");  // unchecked
        if (amount > balance) throw new InsufficientFundsException(amount - balance);
        balance -= amount;
    }
}`),
        file("src/errors/Main.java", code`
package errors;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    static int firstNumber(Path path) {
        // Resources declared here are closed automatically, in reverse order
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            return Integer.parseInt(reader.readLine().trim());
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + path, e);   // chain the cause
        } catch (NumberFormatException | NullPointerException e) {      // multi-catch
            return 0;
        }
    }

    @SuppressWarnings("finally")
    static int surprising() {
        try { return 1; }
        finally { return 2; }        // overrides the try's return: avoid this
    }

    public static void main(String[] args) {
        Wallet wallet = new Wallet(100);
        try {
            wallet.pay(30);
            wallet.pay(200);
            System.out.println("not reached");
        } catch (InsufficientFundsException e) {
            System.out.println(e.getMessage() + " (" + e.getShortBy() + ")");
        } finally {
            System.out.println("finally always runs");
        }
        System.out.println(surprising());                             // 2
        System.out.println(firstNumber(Path.of("missing.txt")));      // throws UncheckedIOException
    }
}`),
      ],
      tips: [
        "Order catch blocks from subclass to superclass; catching Exception before IOException is a compile error (unreachable code).",
        "Never swallow exceptions with an empty catch block; at minimum log them with the stack trace.",
        "final, finally and finalize are unrelated — a classic viva question.",
        "Throwing exceptions for normal control flow is slow and unclear; return Optional or a result instead.",
      ],
      subjective: [
        qa("Differentiate checked and unchecked exceptions with examples.", "Checked exceptions are subclasses of Exception but not of RuntimeException; the compiler requires them to be caught or declared with throws. They represent recoverable conditions outside the program's control: IOException, SQLException, ClassNotFoundException.\n\nUnchecked exceptions are RuntimeException and its subclasses (plus Errors); the compiler does not enforce handling. They usually indicate programming bugs: NullPointerException, ArrayIndexOutOfBoundsException, IllegalArgumentException, ArithmeticException."),
        qa("Explain throw vs throws.", "throw is a statement that raises one exception object: throw new IllegalStateException(\"closed\");. throws is part of a method declaration listing the checked exceptions the method may propagate to its caller: void read() throws IOException. throw is followed by an instance; throws by one or more class names."),
        qa("What is try-with-resources and why is it better than finally?", "It is a try statement that declares resources implementing AutoCloseable; Java closes them automatically when the block exits, in reverse order of declaration. Compared with manual finally blocks it is shorter, cannot forget to close, handles null checks, and keeps the original exception while recording close failures as suppressed exceptions instead of masking the original error."),
        qa("Will finally execute if there is a return statement in try?", "Yes. The return value is computed, then finally runs, then the method returns. If finally itself returns or throws, that replaces the original result or exception. finally does not run if the JVM halts, for example via System.exit() or a crash."),
      ],
      objective: [
        mcq("Which is a checked exception?", ["NullPointerException", "ArithmeticException", "IOException", "ClassCastException"], 2, "IOException extends Exception directly, not RuntimeException."),
        mcq("The root class of all exceptions and errors is:", ["Exception", "Error", "Throwable", "Object"], 2, "Throwable has the two subclasses Exception and Error."),
        mcq("Which interface must a resource implement to be used in try-with-resources?", ["Closeable only", "AutoCloseable", "Serializable", "Runnable"], 1, "AutoCloseable (Closeable extends it)."),
        mcq("catch (Exception e) {} catch (IOException e) {} results in:", ["Fine", "Compile error: unreachable catch", "Runtime error", "Warning only"], 1, "IOException is already caught by the broader Exception block."),
        mcq("int x = 5 / 0; throws:", ["NumberFormatException", "ArithmeticException", "Nothing; x is Infinity", "IllegalStateException"], 1, "Integer division by zero throws ArithmeticException; floating-point division gives Infinity."),
      ],
    },
    {
      id: "collections-list-set", module: "Core APIs", title: "Collections Framework: List, Set, Queue and iteration", level: "Intermediate", minutes: 22,
      summary: "The Collection hierarchy, ArrayList vs LinkedList, HashSet vs LinkedHashSet vs TreeSet, Deque, and fail-fast iterators.",
      description: [
        "The Collections Framework (java.util) is a set of interfaces and implementations for groups of objects. Collection is the root for List (ordered, indexed, duplicates allowed), Set (no duplicates) and Queue/Deque (processing order). Map is separate because it stores key–value pairs. The Collections and Arrays utility classes add algorithms such as sort, shuffle, unmodifiableList and asList.",
        "ArrayList is backed by a resizable array: O(1) random access, amortized O(1) add at the end, O(n) insert/remove in the middle; it grows by about 50% when full. LinkedList is a doubly linked list: O(1) add/remove at the ends and through an iterator, O(n) get(i). In practice ArrayList is faster for almost everything because of memory locality; ArrayDeque is the preferred stack and queue.",
        "HashSet stores elements in a HashMap (O(1) average add/contains, no order). LinkedHashSet keeps insertion order. TreeSet is a red–black tree giving sorted order and O(log n) operations plus navigation methods (first, floor, ceiling, headSet). PriorityQueue is a binary heap that always removes the smallest (or comparator-first) element.",
        "Iterators of the standard collections are fail-fast: structurally modifying a collection while iterating (except through iterator.remove()) throws ConcurrentModificationException. Use iterator.remove(), removeIf, or concurrent collections (CopyOnWriteArrayList, ConcurrentHashMap) when needed. List.of, Set.of and Map.of (Java 9) create immutable collections that reject nulls.",
      ],
      usage: [
        "Default to ArrayList for lists, HashSet for uniqueness, HashMap for lookup, ArrayDeque for stack/queue.",
        "Use TreeSet/TreeMap when you need sorted iteration or range queries.",
        "Declare variables by interface type (List<String> names = new ArrayList<>()) to keep implementations swappable.",
        "Return List.copyOf(...) or unmodifiable views from APIs to prevent outside modification.",
      ],
      files: [
        file("src/coll/ListsAndSets.java", code`
package coll;

import java.util.*;

public class ListsAndSets {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(List.of("Ravi", "Asha", "Meera", "Asha"));
        names.add(1, "Kabir");                    // insert by index (shifts elements)
        names.remove("Asha");                     // removes the first occurrence only
        Collections.sort(names);                  // natural (alphabetical) order
        System.out.println(names);                // [Asha, Kabir, Meera, Ravi]

        Set<String> hash = new HashSet<>(names);           // no guaranteed order
        Set<String> linked = new LinkedHashSet<>(names);   // insertion order
        Set<String> tree = new TreeSet<>(Comparator.reverseOrder()); // sorted, descending
        tree.addAll(names);
        System.out.println(hash + " " + linked + " " + tree);

        TreeSet<Integer> scores = new TreeSet<>(List.of(40, 75, 90, 60));
        System.out.println(scores.floor(70) + " " + scores.ceiling(70) + " " + scores.headSet(75));
    }
}`),
        file("src/coll/QueuesDemo.java", code`
package coll;

import java.util.*;

public class QueuesDemo {
    record Task(String name, int priority) { }

    public static void main(String[] args) {
        Deque<Integer> stack = new ArrayDeque<>();      // LIFO
        stack.push(1); stack.push(2); stack.push(3);
        System.out.println(stack.pop());               // 3

        Queue<String> queue = new ArrayDeque<>();       // FIFO
        queue.offer("a"); queue.offer("b");
        System.out.println(queue.poll());              // a

        PriorityQueue<Task> tasks = new PriorityQueue<>(Comparator.comparingInt(Task::priority));
        tasks.add(new Task("deploy", 3));
        tasks.add(new Task("hotfix", 1));
        tasks.add(new Task("docs", 5));
        while (!tasks.isEmpty()) System.out.print(tasks.poll().name() + " ");   // hotfix deploy docs
        System.out.println();
    }
}`),
        file("src/coll/FailFast.java", code`
package coll;

import java.util.*;

public class FailFast {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
        try {
            for (Integer n : nums) if (n % 2 == 0) nums.remove(n);   // modifies during iteration
        } catch (ConcurrentModificationException e) {
            System.out.println("CME: use an iterator or removeIf");
        }

        Iterator<Integer> it = nums.iterator();
        while (it.hasNext()) if (it.next() % 2 == 0) it.remove();      // safe
        System.out.println(nums);

        List<Integer> more = new ArrayList<>(List.of(10, 15, 20));
        more.removeIf(n -> n > 12);                                    // safe and concise
        System.out.println(more);

        List<Integer> fixed = List.of(1, 2);
        // fixed.add(3);  // UnsupportedOperationException: immutable
    }
}`),
      ],
      tips: [
        "list.remove(1) on a List<Integer> removes index 1; use list.remove(Integer.valueOf(1)) to remove the value.",
        "Arrays.asList returns a fixed-size list backed by the array: set works, add/remove throw.",
        "TreeSet uses compareTo/compare, not equals, to detect duplicates — keep them consistent.",
        "HashSet allows one null; TreeSet does not (natural ordering); List.of does not allow null at all.",
      ],
      subjective: [
        qa("Compare ArrayList and LinkedList.", "ArrayList uses a dynamic array: O(1) get(index), amortized O(1) add at end, O(n) add/remove in the middle due to shifting, compact memory and good cache locality. LinkedList uses a doubly linked list: O(n) get(index), O(1) add/remove at either end or at an iterator position, higher memory per element (two references plus node object), and it also implements Deque. ArrayList is the better default; ArrayDeque usually beats LinkedList as a queue."),
        qa("Differentiate HashSet, LinkedHashSet and TreeSet.", "HashSet: backed by HashMap, no ordering guarantee, O(1) average operations, allows one null. LinkedHashSet: HashSet plus a linked list of entries, keeps insertion order, slightly more memory. TreeSet: backed by a red–black TreeMap, keeps elements sorted by natural order or a Comparator, O(log n) operations, offers navigation methods (floor, ceiling, subSet), and does not accept null with natural ordering."),
        qa("What is a fail-fast iterator? How is it different from fail-safe?", "A fail-fast iterator (ArrayList, HashMap) tracks a modification count and throws ConcurrentModificationException if the collection is structurally modified during iteration by anything other than the iterator itself. Fail-safe (weakly consistent) iterators of concurrent collections (CopyOnWriteArrayList, ConcurrentHashMap) do not throw; they iterate over a snapshot or tolerate concurrent changes, possibly not reflecting the latest updates."),
      ],
      objective: [
        mcq("Which collection does NOT allow duplicates?", ["ArrayList", "LinkedList", "HashSet", "Vector"], 2, "Set implementations reject duplicates."),
        mcq("Best class to use as a stack in modern Java?", ["Stack", "ArrayDeque", "Vector", "TreeSet"], 1, "Stack is a legacy synchronized class extending Vector; ArrayDeque is recommended."),
        mcq("Time complexity of get(index) on LinkedList:", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 2, "It must walk from the nearer end."),
        mcq("Which keeps elements in sorted order?", ["HashSet", "LinkedHashSet", "TreeSet", "ArrayList"], 2, "TreeSet is a NavigableSet backed by a red–black tree."),
        mcq("List.of(1, 2).add(3) throws:", ["IllegalStateException", "UnsupportedOperationException", "IndexOutOfBoundsException", "Nothing"], 1, "Collections from List.of are immutable."),
      ],
    },
    {
      id: "maps-hashing-comparators", module: "Core APIs", title: "Maps, HashMap internals, Comparable and Comparator", level: "Advanced", minutes: 22,
      summary: "How HashMap stores entries, load factor and resizing, treeification, TreeMap/LinkedHashMap, and sorting objects two ways.",
      description: [
        "Map stores unique keys mapped to values. HashMap keeps an array of buckets (table). put computes key.hashCode(), spreads the bits (h ^ h >>> 16), and picks a bucket with (n - 1) & hash. Entries that collide in one bucket form a linked list; since Java 8 a bucket with more than 8 entries (when the table has at least 64 buckets) is converted into a balanced red–black tree, improving worst-case lookups from O(n) to O(log n).",
        "The default capacity is 16 and the load factor 0.75: when size exceeds capacity × load factor the table doubles and entries are redistributed (rehashing). HashMap allows one null key and many null values, is not synchronized, and has no order. LinkedHashMap keeps insertion order (or access order, which makes a simple LRU cache with removeEldestEntry). TreeMap keeps keys sorted with O(log n) operations. Hashtable is the legacy synchronized map; use ConcurrentHashMap for concurrency.",
        "Mutable keys are dangerous: if a key's hashCode changes after insertion, the entry becomes unreachable. Good keys are immutable — String, Integer, records, enums.",
        "Comparable<T> defines a class's natural order with compareTo (one per class, e.g. String alphabetical). Comparator<T> defines external orders with compare, so you can have many (by name, by salary). Java 8 added fluent builders: Comparator.comparing(Employee::dept).thenComparing(Employee::salary, Comparator.reverseOrder()). Return negative/zero/positive and avoid subtraction for ints (overflow); use Integer.compare.",
      ],
      usage: [
        "Use getOrDefault, putIfAbsent, computeIfAbsent and merge instead of check-then-put code.",
        "Pre-size a HashMap when you know the count: new HashMap<>(expected * 4 / 3 + 1), or HashMap.newHashMap(n) on Java 19+.",
        "Iterate with entrySet() to get keys and values together.",
        "Use TreeMap for leaderboards, time-ordered events and range queries (headMap, tailMap, floorKey).",
      ],
      files: [
        file("src/maps/WordCount.java", code`
package maps;

import java.util.*;

public class WordCount {
    public static void main(String[] args) {
        String text = "to be or not to be that is the question";
        Map<String, Integer> counts = new HashMap<>();
        for (String w : text.split(" ")) counts.merge(w, 1, Integer::sum);   // insert or add

        Map<Character, List<String>> byFirst = new TreeMap<>();
        for (String w : counts.keySet())
            byFirst.computeIfAbsent(w.charAt(0), k -> new ArrayList<>()).add(w);

        for (Map.Entry<String, Integer> e : counts.entrySet())
            if (e.getValue() > 1) System.out.println(e.getKey() + " -> " + e.getValue());
        System.out.println(byFirst);
        System.out.println(counts.getOrDefault("java", 0));
    }
}`),
        file("src/maps/LruCache.java", code`
package maps;

import java.util.LinkedHashMap;
import java.util.Map;

// accessOrder = true: get() moves an entry to the end; the eldest is the least recently used
public class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    public LruCache(int capacity) {
        super(16, 0.75f, true);
        this.capacity = capacity;
    }

    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) { return size() > capacity; }

    public static void main(String[] args) {
        LruCache<String, Integer> cache = new LruCache<>(2);
        cache.put("a", 1); cache.put("b", 2);
        cache.get("a");                 // a is now most recently used
        cache.put("c", 3);              // evicts b
        System.out.println(cache.keySet());   // [a, c]
    }
}`),
        file("src/maps/Sorting.java", code`
package maps;

import java.util.*;

public class Sorting {
    // Natural order: by id
    record Employee(int id, String name, String dept, double salary) implements Comparable<Employee> {
        @Override public int compareTo(Employee o) { return Integer.compare(id, o.id); }
    }

    public static void main(String[] args) {
        List<Employee> staff = new ArrayList<>(List.of(
            new Employee(3, "Meera", "Eng", 120_000),
            new Employee(1, "Ravi", "Ops", 70_000),
            new Employee(2, "Asha", "Eng", 150_000)));

        Collections.sort(staff);                                   // uses compareTo
        System.out.println(staff.stream().map(Employee::name).toList());

        staff.sort(Comparator.comparing(Employee::dept)
                .thenComparing(Employee::salary, Comparator.reverseOrder()));
        staff.forEach(e -> System.out.println(e.dept() + " " + e.name() + " " + e.salary()));

        // Mutable-key bug in one line: never let a key's hashCode change while it is in a map
        Map<List<Integer>, String> bad = new HashMap<>();
        List<Integer> key = new ArrayList<>(List.of(1));
        bad.put(key, "one");
        key.add(2);
        System.out.println(bad.get(key));                          // null
    }
}`),
      ],
      tips: [
        "Interview script for HashMap.put: hash → index → empty bucket? insert : walk list/tree, equals match? replace : append → size > threshold? resize.",
        "Since Java 8, resizing preserves order within a bucket by splitting it into low and high lists.",
        "ConcurrentHashMap does not allow null keys or values; HashMap allows one null key.",
        "compareTo should be consistent with equals, or sorted sets and maps will treat distinct objects as duplicates.",
      ],
      subjective: [
        qa("Explain the internal working of HashMap.", "HashMap uses an array of Node buckets. For put(k, v): it computes hash = k.hashCode() ^ (h >>> 16), finds index = (n - 1) & hash, and if the bucket is empty stores a new node. Otherwise it walks the chain (linked list, or red–black tree once a bucket has more than 8 nodes and capacity ≥ 64) comparing hash and equals; an equal key has its value replaced, else a node is appended. After insertion, if size > capacity × loadFactor (default 16 × 0.75 = 12) the table is doubled and nodes are redistributed. get follows the same hash → bucket → equals path, giving O(1) average and O(log n) worst case with treeified buckets."),
        qa("Differentiate Comparable and Comparator.", "Comparable is implemented by the class itself (java.lang), has compareTo(T o), and defines one natural ordering used by Collections.sort(list), TreeSet and TreeMap by default. Comparator is a separate object (java.util), has compare(T a, T b), allows any number of orderings, can sort classes you cannot modify, and has combinators like comparing, thenComparing, reversed and nullsFirst."),
        qa("Compare HashMap, LinkedHashMap, TreeMap and Hashtable.", "HashMap: unordered, O(1) average, one null key, not synchronized. LinkedHashMap: HashMap plus insertion- or access-order iteration, useful for LRU caches. TreeMap: sorted by key, O(log n), navigation methods, no null key with natural ordering. Hashtable: legacy, synchronized on every method, no null keys or values — replaced by ConcurrentHashMap."),
      ],
      objective: [
        mcq("Default initial capacity and load factor of HashMap:", ["10 and 0.5", "16 and 0.75", "32 and 1.0", "16 and 0.5"], 1, "The table resizes when size exceeds 12 entries at the default capacity."),
        mcq("Since Java 8, a heavily collided HashMap bucket becomes a:", ["Skip list", "Red–black tree", "Array", "Heap"], 1, "Treeification happens when a bin exceeds 8 nodes and the table has at least 64 buckets."),
        mcq("Which map maintains insertion order?", ["HashMap", "TreeMap", "LinkedHashMap", "Hashtable"], 2, "LinkedHashMap keeps a doubly linked list through its entries."),
        mcq("Comparator is in which package?", ["java.lang", "java.util", "java.io", "java.util.function"], 1, "Comparable is in java.lang; Comparator in java.util."),
        mcq("How many null keys can a HashMap hold?", ["0", "1", "Unlimited", "Depends on capacity"], 1, "One null key (stored in bucket 0) and any number of null values."),
      ],
    },
    {
      id: "generics", module: "Core APIs", title: "Generics, wildcards and type erasure", level: "Advanced", minutes: 18,
      summary: "Type parameters for classes and methods, bounded types, ? extends / ? super (PECS), and what erasure means at run time.",
      description: [
        "Generics let classes, interfaces and methods take type parameters, so a List<String> only accepts strings and get returns a String without a cast. Errors move from run time (ClassCastException) to compile time. A generic method declares its own type parameter before the return type: static <T> T first(List<T> list).",
        "Bounded type parameters restrict what can be supplied: <T extends Number> allows Number and its subclasses and lets the method call Number methods; multiple bounds are written <T extends Number & Comparable<T>>.",
        "Generics are invariant: a List<Integer> is not a List<Number>. Wildcards add flexibility. List<? extends Number> can be read as Number but you cannot add to it (it might be a List<Double>). List<? super Integer> accepts Integer additions but reads come out as Object. The PECS rule: Producer Extends, Consumer Super. List<?> is a list of unknown type.",
        "Generics are implemented by type erasure: the compiler checks types, inserts casts, and then removes type arguments, replacing T with its bound (Object by default). Consequences: no new T(), no T.class, no instanceof List<String>, no primitive type arguments (use Integer), no generic arrays, and List<String> and List<Integer> share one runtime class. Raw types (List without <>) still compile for legacy code but bypass checks.",
      ],
      usage: [
        "Write reusable containers and utilities (Box<T>, Pair<A, B>, Result<T>) once for every type.",
        "Use ? extends T for parameters you only read from and ? super T for parameters you only write to.",
        "Pass a Class<T> or Supplier<T> when a generic method needs to create instances.",
        "Avoid raw types; fix unchecked warnings rather than suppressing them broadly.",
      ],
      files: [
        file("src/gen/Pair.java", code`
package gen;

public record Pair<A, B>(A first, B second) {
    public <C> Pair<A, C> withSecond(C value) { return new Pair<>(first, value); }   // generic method
}`),
        file("src/gen/Stats.java", code`
package gen;

import java.util.*;

public class Stats {
    // Bounded type: T must be a Number so doubleValue() is available
    static <T extends Number> double sum(Collection<T> values) {
        double total = 0;
        for (T v : values) total += v.doubleValue();
        return total;
    }

    // Multiple bounds; returns the largest element
    static <T extends Comparable<? super T>> T max(List<? extends T> list) {
        T best = list.get(0);
        for (T item : list) if (item.compareTo(best) > 0) best = item;
        return best;
    }

    // PECS: src produces T (extends), dst consumes T (super)
    static <T> void copy(List<? extends T> src, List<? super T> dst) {
        for (T item : src) dst.add(item);
    }

    public static void main(String[] args) {
        List<Integer> ints = List.of(3, 9, 4);
        List<Double> doubles = List.of(1.5, 2.5);
        System.out.println(sum(ints) + sum(doubles));    // works for any Number subtype
        System.out.println(max(ints));

        List<Number> numbers = new ArrayList<>();
        copy(ints, numbers);                             // Integer producer into Number consumer
        copy(doubles, numbers);
        System.out.println(numbers);

        // List<Number> wrong = ints;                    // compile error: generics are invariant
        List<? extends Number> readOnly = ints;          // OK, but readOnly.add(1) will not compile
        System.out.println(readOnly.get(0) + " " + new Pair<>("id", 7).withSecond(true));

        System.out.println(new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()); // true: erasure
    }
}`),
      ],
      tips: [
        "The diamond operator (new ArrayList<>()) infers type arguments from the target type.",
        "You cannot overload methods that differ only in generic parameters (void f(List<String>) and void f(List<Integer>)) — they erase to the same signature.",
        "Static fields cannot use a class's type parameter, because one static field is shared by all parameterizations.",
        "Collections.emptyList(), List.of() and Comparator.naturalOrder() are generic methods whose T is inferred from context.",
      ],
      subjective: [
        qa("What are the advantages of generics?", "Compile-time type safety (wrong types are rejected before running), elimination of explicit casts, reusable algorithms and data structures that work with any type, and clearer APIs that document what they contain (Map<String, List<Order>>)."),
        qa("Explain type erasure and its limitations.", "The compiler uses type arguments for checking, then erases them: type parameters become their bounds (Object if unbounded) and casts are inserted where needed, so bytecode contains no generic type information for instances. Limitations: cannot create new T() or new T[], cannot use primitives as type arguments, cannot do instanceof List<String> or get List<String>.class, cannot overload by type argument only, static members cannot reference the class's T, and generic exceptions are not allowed."),
        qa("Explain the PECS principle.", "Producer Extends, Consumer Super. If a parameter only produces values you read (a source), declare it as ? extends T so a List<Integer> can be used where T is Number. If it only consumes values you write (a destination), declare it as ? super T so a List<Number> or List<Object> can receive Integers. Collections.copy(List<? super T> dest, List<? extends T> src) is the classic example."),
      ],
      objective: [
        mcq("Is List<Integer> a subtype of List<Number>?", ["Yes", "No", "Only at run time", "Only with raw types"], 1, "Generic types are invariant; use List<? extends Number>."),
        mcq("Which is legal?", ["List<int> l;", "new T();", "List<? super Integer> l = new ArrayList<Number>();", "if (o instanceof List<String>)"], 2, "A List<Number> can consume Integers."),
        mcq("After erasure, an unbounded T is replaced by:", ["void", "Object", "String", "The first argument's type"], 1, "Bounded T erases to its first bound."),
        mcq("To add Integers to a parameter list, its type should be:", ["List<? extends Integer>", "List<? super Integer>", "List<?>", "List<? extends Number>"], 1, "Consumers use super."),
      ],
    },
    {
      id: "lambdas-streams", module: "Core APIs", title: "Lambdas, method references and the Stream API", level: "Intermediate", minutes: 22,
      summary: "Java 8's functional style: lambda syntax, effectively final captures, the four core functional interfaces and stream pipelines.",
      description: [
        "A lambda expression is a concise implementation of a functional interface: (a, b) -> a + b. Parameter types are usually inferred; a single parameter needs no parentheses; a block body needs braces and return. Lambdas can read local variables only if they are final or effectively final (never reassigned). this inside a lambda means the enclosing object, unlike in an anonymous class.",
        "Method references are shorthand for lambdas that call one method: static (Integer::parseInt), bound instance (System.out::println), unbound instance (String::toUpperCase, called on the argument) and constructor (ArrayList::new).",
        "A Stream is a lazy pipeline over a data source: a source (collection.stream(), Stream.of, IntStream.range), zero or more intermediate operations (filter, map, flatMap, distinct, sorted, limit, peek) that return new streams, and one terminal operation (forEach, collect, reduce, count, anyMatch, findFirst, toList) that triggers execution. Nothing runs until the terminal operation. Streams do not modify their source and can be consumed only once.",
        "Collectors produce results: toList, toSet, toMap, joining, groupingBy, partitioningBy, counting, summingInt, averagingDouble. Primitive streams (IntStream, LongStream, DoubleStream) avoid boxing and provide sum, average and summaryStatistics. Optional represents a value that may be absent and is returned by findFirst, max and min.",
      ],
      usage: [
        "Use streams for transform/filter/aggregate pipelines that read clearly as one sentence.",
        "Use loops instead when you need early exit with complex state, checked exceptions or index arithmetic.",
        "Use groupingBy for reports (orders per customer, revenue per month).",
        "Keep lambdas free of side effects; parallel streams in particular require stateless, non-interfering operations.",
      ],
      files: [
        file("src/fn/Basics.java", code`
package fn;

import java.util.*;
import java.util.function.*;

public class Basics {
    public static void main(String[] args) {
        Predicate<String> isLong = s -> s.length() > 4;          // T -> boolean
        Function<String, Integer> length = String::length;      // T -> R (method reference)
        Consumer<String> printer = System.out::println;          // T -> void
        Supplier<List<String>> fresh = ArrayList::new;           // () -> T (constructor reference)
        BinaryOperator<Integer> add = (a, b) -> a + b;

        int minimum = 3;                                         // effectively final: captured below
        Predicate<String> atLeast = s -> s.length() >= minimum;
        // minimum = 4;                                          // would make the lambda illegal

        List<String> list = fresh.get();
        list.addAll(List.of("tea", "coffee", "masala"));
        list.stream().filter(isLong.and(atLeast)).map(String::toUpperCase).forEach(printer);
        System.out.println(length.andThen(n -> n * 2).apply("java") + " " + add.apply(2, 3));

        Comparator<String> byLength = Comparator.comparingInt(String::length);
        list.sort(byLength.thenComparing(Comparator.naturalOrder()));
        System.out.println(list);
    }
}`),
        file("src/fn/Reports.java", code`
package fn;

import java.util.*;
import java.util.stream.*;

public class Reports {
    record Order(String customer, String city, double amount, List<String> items) { }

    public static void main(String[] args) {
        List<Order> orders = List.of(
            new Order("Asha", "Pune", 1200, List.of("book", "pen")),
            new Order("Ravi", "Delhi", 300, List.of("pen")),
            new Order("Asha", "Pune", 800, List.of("bag")),
            new Order("Meera", "Delhi", 2500, List.of("laptop sleeve", "pen")));

        double total = orders.stream().mapToDouble(Order::amount).sum();
        Map<String, Double> perCustomer = orders.stream()
            .collect(Collectors.groupingBy(Order::customer, TreeMap::new, Collectors.summingDouble(Order::amount)));
        Map<Boolean, Long> bigOrSmall = orders.stream()
            .collect(Collectors.partitioningBy(o -> o.amount() >= 1000, Collectors.counting()));
        Set<String> distinctItems = orders.stream()
            .flatMap(o -> o.items().stream())               // Stream<List<String>> flattened to Stream<String>
            .collect(Collectors.toCollection(TreeSet::new));
        Optional<Order> biggest = orders.stream().max(Comparator.comparingDouble(Order::amount));
        String cities = orders.stream().map(Order::city).distinct().sorted().collect(Collectors.joining(", ", "[", "]"));

        System.out.println(total + "\n" + perCustomer + "\n" + bigOrSmall + "\n" + distinctItems);
        System.out.println(biggest.map(Order::customer).orElse("none") + " " + cities);
        System.out.println(IntStream.rangeClosed(1, 5).map(n -> n * n).summaryStatistics());
    }
}`),
      ],
      tips: [
        "Intermediate operations are lazy: stream.filter(...).peek(System.out::println) without a terminal operation prints nothing.",
        "Collectors.toMap throws IllegalStateException on duplicate keys unless you pass a merge function.",
        "Stream.toList() (Java 16) returns an unmodifiable list; collect(Collectors.toList()) makes no such promise.",
        "Do not call Optional.get() without checking — prefer orElse, orElseThrow, map and ifPresent.",
      ],
      subjective: [
        qa("Differentiate intermediate and terminal operations in streams.", "Intermediate operations (filter, map, flatMap, sorted, distinct, limit) return a new Stream and are lazy — they only describe the pipeline. Terminal operations (collect, forEach, reduce, count, findFirst, anyMatch) produce a result or side effect and trigger processing of the whole pipeline; after a terminal operation the stream is consumed and cannot be reused. Short-circuiting operations like limit, findFirst and anyMatch can stop early."),
        qa("What is the difference between map and flatMap?", "map transforms each element into exactly one element (Stream<T> to Stream<R>). flatMap transforms each element into a stream and flattens those streams into one (each T to Stream<R>, combined into Stream<R>). Example: orders.stream().map(Order::items) gives Stream<List<String>>, whereas flatMap(o -> o.items().stream()) gives Stream<String>."),
        qa("Why must local variables used in a lambda be effectively final?", "A lambda may run later or on another thread, after the method's stack frame is gone, so Java captures a copy of the variable's value. Allowing reassignment would make the copy and the original diverge and create data races on stack variables. Requiring effectively final variables keeps the captured value unambiguous. Fields and objects' internal state can still be modified."),
      ],
      objective: [
        mcq("Which is a terminal operation?", ["filter", "map", "collect", "sorted"], 2, "collect produces a result and triggers the pipeline."),
        mcq("Stream.of(1, 2, 3).map(x -> x * 2).filter(x -> x > 2).count() returns:", ["1", "2", "3", "0"], 1, "Mapped to 2, 4, 6; two elements exceed 2."),
        mcq("Which functional interface represents a function that takes no arguments and returns a value?", ["Consumer", "Supplier", "Predicate", "Function"], 1, "Supplier<T>.get()."),
        mcq("What happens when a stream is reused after a terminal operation?", ["Restarts from the beginning", "IllegalStateException", "Returns empty results", "Compile error"], 1, "Streams can be consumed only once."),
        mcq("String::toUpperCase used as Function<String, String> is a reference to:", ["A static method", "An instance method of an arbitrary object of a type", "A constructor", "A bound instance method"], 1, "The first argument becomes the receiver: s -> s.toUpperCase()."),
      ],
    },
    {
      id: "file-io", module: "Core APIs", title: "File I/O, NIO.2 and serialization", level: "Intermediate", minutes: 16,
      summary: "Byte vs character streams, buffering, the Files and Path APIs, and object serialization with its risks.",
      description: [
        "java.io models data as streams. Byte streams (InputStream/OutputStream: FileInputStream, BufferedInputStream, DataOutputStream) handle raw bytes such as images. Character streams (Reader/Writer: FileReader, BufferedReader, PrintWriter) handle text and decode bytes using a charset; always specify UTF-8 rather than relying on the platform default. Buffered wrappers reduce expensive system calls; InputStreamReader bridges bytes to characters.",
        "java.nio.file (NIO.2, Java 7) is the modern API. Path represents a location; Files offers one-line helpers — readString, writeString, readAllLines, lines (a lazy Stream), copy, move, delete, createDirectories, walk and exists — and throws informative exceptions such as NoSuchFileException.",
        "Serialization converts an object graph into bytes with ObjectOutputStream; the class must implement Serializable, transient fields are skipped, and serialVersionUID guards compatibility between versions. Deserializing untrusted data is a well-known security vulnerability (gadget chains), so modern code prefers JSON (Jackson), Protocol Buffers or records with explicit formats; if you must deserialize, use ObjectInputFilter.",
      ],
      usage: [
        "Use Files.readString / writeString for small text files and Files.lines with try-with-resources for large ones.",
        "Use BufferedReader/BufferedWriter for line-by-line processing in older code bases.",
        "Mark secrets and derived fields transient if a class must be serializable.",
        "Use Path.of(\"data\", \"report.csv\") rather than string concatenation with separators.",
      ],
      files: [
        file("src/io/NioDemo.java", code`
package io;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Stream;

public class NioDemo {
    public static void main(String[] args) throws IOException {
        Path dir = Path.of("data");
        Files.createDirectories(dir);
        Path csv = dir.resolve("marks.csv");
        Files.write(csv, List.of("name,marks", "Asha,91", "Ravi,78", "Meera,85"), StandardCharsets.UTF_8);

        try (Stream<String> lines = Files.lines(csv)) {          // lazy: closes the file afterwards
            double avg = lines.skip(1).mapToInt(l -> Integer.parseInt(l.split(",")[1])).average().orElse(0);
            System.out.println("Average marks: " + avg);
        }

        Files.copy(csv, dir.resolve("backup.csv"), StandardCopyOption.REPLACE_EXISTING);
        try (Stream<Path> files = Files.walk(dir)) { files.forEach(System.out::println); }
        System.out.println(Files.size(csv) + " bytes, exists=" + Files.exists(csv));
    }
}`),
        file("src/io/ClassicIo.java", code`
package io;

import java.io.*;
import java.nio.charset.StandardCharsets;

public class ClassicIo {
    public static void main(String[] args) throws IOException {
        // Character stream with explicit charset and buffering
        try (BufferedWriter out = new BufferedWriter(new OutputStreamWriter(new FileOutputStream("notes.txt"), StandardCharsets.UTF_8))) {
            out.write("line one"); out.newLine(); out.write("line two");
        }
        try (BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream("notes.txt"), StandardCharsets.UTF_8))) {
            String line;
            int n = 0;
            while ((line = in.readLine()) != null) System.out.println(++n + ": " + line);
        }
        // Byte stream: copy any file
        try (InputStream src = new BufferedInputStream(new FileInputStream("notes.txt"));
             OutputStream dst = new BufferedOutputStream(new FileOutputStream("notes.bak"))) {
            src.transferTo(dst);                                  // Java 9
        }
    }
}`),
        file("src/io/SerializeDemo.java", code`
package io;

import java.io.*;

public class SerializeDemo {
    static class User implements Serializable {
        private static final long serialVersionUID = 1L;   // version guard
        String name;
        transient String password;                        // not written
        User(String name, String password) { this.name = name; this.password = password; }
    }

    public static void main(String[] args) throws Exception {
        try (ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("user.ser"))) {
            out.writeObject(new User("asha", "secret"));
        }
        try (ObjectInputStream in = new ObjectInputStream(new FileInputStream("user.ser"))) {
            in.setObjectInputFilter(ObjectInputFilter.Config.createFilter("io.SerializeDemo$User;!*")); // allow-list
            User u = (User) in.readObject();
            System.out.println(u.name + " / " + u.password);   // asha / null
        }
    }
}`),
      ],
      tips: [
        "Stream classes ending in Stream are byte-oriented; those ending in Reader/Writer are character-oriented.",
        "Static fields are not serialized because they belong to the class, not the object.",
        "Files.lines and Files.walk hold open file handles — always close them with try-with-resources.",
        "A missing serialVersionUID is computed from the class shape, so a harmless change can make old data unreadable (InvalidClassException).",
      ],
      subjective: [
        qa("Differentiate byte streams and character streams.", "Byte streams (InputStream/OutputStream and subclasses) read and write raw 8-bit bytes and suit binary data such as images, audio and serialized objects. Character streams (Reader/Writer) read and write 16-bit chars, translating to and from bytes with a charset, and suit text. InputStreamReader and OutputStreamWriter bridge the two."),
        qa("What is serialization? What is the purpose of transient and serialVersionUID?", "Serialization converts an object's state into a byte stream for storage or transfer; deserialization rebuilds it. A class opts in by implementing the marker interface Serializable. transient marks fields that must not be serialized (passwords, caches, non-serializable references); they get default values on deserialization. serialVersionUID is a version number checked during deserialization; if it does not match the class, InvalidClassException is thrown."),
      ],
      objective: [
        mcq("Which class reads text line by line efficiently?", ["FileInputStream", "BufferedReader", "DataInputStream", "ObjectInputStream"], 1, "BufferedReader.readLine()."),
        mcq("Fields marked transient are:", ["Serialized twice", "Not serialized", "Encrypted", "Static"], 1, "They are skipped and restored to default values."),
        mcq("Serializable is a:", ["Functional interface", "Marker interface", "Abstract class", "Annotation"], 1, "It has no methods."),
        mcq("Which NIO.2 method returns a lazily populated Stream of lines?", ["Files.readAllLines", "Files.lines", "Files.readString", "Path.lines"], 1, "readAllLines loads everything into a List."),
      ],
    },
    {
      id: "multithreading-basics", module: "JVM and concurrency", title: "Multithreading basics and synchronization", level: "Intermediate", minutes: 22,
      summary: "Creating threads, thread states, race conditions, synchronized, volatile, wait/notify and deadlock.",
      description: [
        "A thread is an independent path of execution within a process; threads share the heap but each has its own stack. Create one by extending Thread or, preferably, by passing a Runnable (or lambda) to new Thread(...). start() creates a new thread that runs run(); calling run() directly just runs it on the current thread. join() waits for a thread to finish; sleep() pauses the current thread without releasing locks.",
        "Thread states (Thread.State): NEW, RUNNABLE, BLOCKED (waiting for a monitor lock), WAITING (wait(), join() with no timeout), TIMED_WAITING (sleep, timed wait) and TERMINATED.",
        "When threads share mutable data, a race condition can corrupt it: count++ is read–modify–write, not atomic. synchronized methods or blocks acquire an object's intrinsic lock (monitor), giving mutual exclusion and visibility (happens-before) for code guarded by the same lock. Static synchronized methods lock the Class object. volatile guarantees visibility and ordering of single reads and writes but not atomicity of compound actions; AtomicInteger provides lock-free atomic updates.",
        "wait(), notify() and notifyAll() coordinate threads on a monitor and must be called while holding that monitor's lock, inside a loop that rechecks the condition (to handle spurious wakeups). Deadlock occurs when threads hold locks while waiting for each other's locks; avoid it by acquiring locks in a consistent global order or using timeouts (tryLock). Higher-level tools — ExecutorService, BlockingQueue, CompletableFuture — are covered in Advanced Java.",
      ],
      usage: [
        "Run independent slow work (I/O, network calls) concurrently to reduce total latency.",
        "Protect every access to shared mutable state with the same lock, or use atomic/concurrent classes.",
        "Use volatile for simple flags such as a running/stop signal read by another thread.",
        "Prefer an ExecutorService over creating raw threads in production code.",
      ],
      files: [
        file("src/threads/Counter.java", code`
package threads;

import java.util.concurrent.atomic.AtomicInteger;

public class Counter {
    private int unsafe = 0;
    private int safe = 0;
    private final AtomicInteger atomic = new AtomicInteger();

    void incrementUnsafe() { unsafe++; }                 // race: read, add, write
    synchronized void incrementSafe() { safe++; }        // locks 'this'
    void incrementAtomic() { atomic.incrementAndGet(); } // lock-free CAS

    public static void main(String[] args) throws InterruptedException {
        Counter c = new Counter();
        Runnable work = () -> {
            for (int i = 0; i < 100_000; i++) { c.incrementUnsafe(); c.incrementSafe(); c.incrementAtomic(); }
        };
        Thread t1 = new Thread(work, "worker-1");
        Thread t2 = new Thread(work, "worker-2");
        t1.start(); t2.start();                          // start(), not run()
        t1.join(); t2.join();                            // wait for both
        System.out.println("unsafe=" + c.unsafe + " safe=" + c.safe + " atomic=" + c.atomic);
        // unsafe is usually below 200000; the others are exactly 200000
    }
}`),
        file("src/threads/ProducerConsumer.java", code`
package threads;

import java.util.ArrayDeque;
import java.util.Queue;

// Classic wait/notify bounded buffer (for exams; production code would use ArrayBlockingQueue)
public class ProducerConsumer {
    private final Queue<Integer> buffer = new ArrayDeque<>();
    private final int capacity = 3;

    public synchronized void put(int value) throws InterruptedException {
        while (buffer.size() == capacity) wait();       // loop: re-check after waking
        buffer.add(value);
        notifyAll();
    }

    public synchronized int take() throws InterruptedException {
        while (buffer.isEmpty()) wait();
        int value = buffer.remove();
        notifyAll();
        return value;
    }

    public static void main(String[] args) {
        ProducerConsumer pc = new ProducerConsumer();
        new Thread(() -> {
            try { for (int i = 1; i <= 6; i++) { pc.put(i); System.out.println("produced " + i); } }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }).start();
        new Thread(() -> {
            try { for (int i = 1; i <= 6; i++) System.out.println("consumed " + pc.take()); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }).start();
    }
}`),
        file("src/threads/StopFlag.java", code`
package threads;

public class StopFlag {
    private static volatile boolean running = true;     // without volatile the loop may never see the change

    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> {
            long spins = 0;
            while (running) spins++;
            System.out.println("stopped after " + spins + " spins");
        });
        worker.start();
        Thread.sleep(100);
        running = false;
        worker.join();
        System.out.println(worker.getState());           // TERMINATED
    }
}`),
      ],
      tips: [
        "Calling start() twice on the same Thread throws IllegalThreadStateException.",
        "sleep() keeps held locks; wait() releases the monitor until notified.",
        "Restore the interrupt flag (Thread.currentThread().interrupt()) when you catch InterruptedException and cannot rethrow it.",
        "Four deadlock conditions: mutual exclusion, hold and wait, no preemption, circular wait — break any one.",
      ],
      subjective: [
        qa("What is the difference between start() and run()?", "start() asks the JVM to create a new thread of execution, which then invokes run() on that new thread; it can be called only once. Calling run() directly is an ordinary method call executed on the current thread, so no concurrency happens."),
        qa("Differentiate sleep() and wait().", "sleep() is a static Thread method that pauses the current thread for a time and does not release any locks; it can be called anywhere. wait() is an Object method that must be called while holding that object's monitor (inside synchronized), releases the monitor, and suspends until notify/notifyAll, a timeout or an interrupt; it is used for inter-thread communication and should be called in a loop that rechecks the condition."),
        qa("What does volatile guarantee and what does it not?", "volatile guarantees visibility (a write by one thread is seen by subsequent reads in other threads) and prevents reordering around the access (happens-before). It does not make compound operations such as count++ or check-then-act atomic; for those use synchronized, locks or atomic classes."),
        qa("What is a deadlock and how can it be prevented?", "A deadlock is a state where two or more threads are blocked forever, each waiting for a lock held by another. Example: T1 locks A then waits for B while T2 locks B then waits for A. Prevention: acquire locks in a fixed global order, hold as few locks as possible for as short as possible, use tryLock with timeouts (ReentrantLock), or use higher-level concurrency utilities. Thread dumps (jstack) reveal deadlocks."),
      ],
      objective: [
        mcq("Which method must be called to begin execution of a new thread?", ["run()", "start()", "execute()", "begin()"], 1, "start() creates the thread; run() alone does not."),
        mcq("wait() must be called from:", ["Any method", "A synchronized context on the same object", "A static method only", "The main thread only"], 1, "Otherwise IllegalMonitorStateException is thrown."),
        mcq("Which guarantees atomic increment without explicit locking?", ["volatile int", "AtomicInteger", "final int", "transient int"], 1, "AtomicInteger uses compare-and-swap."),
        mcq("A thread waiting to enter a synchronized block held by another thread is in state:", ["WAITING", "BLOCKED", "TIMED_WAITING", "NEW"], 1, "BLOCKED means waiting for a monitor lock."),
        mcq("Does Thread.sleep() release the monitor lock?", ["Yes", "No", "Only after 1 second", "Only for static methods"], 1, "Locks are kept while sleeping."),
      ],
    },
    {
      id: "jvm-memory-gc", module: "JVM and concurrency", title: "JVM architecture, memory areas and garbage collection", level: "Advanced", minutes: 20,
      summary: "Class loading, heap vs stack vs metaspace, how objects become garbage, generational GC, G1/ZGC and reference types.",
      description: [
        "The JVM has three main parts. The class loader subsystem loads classes on demand through a delegation hierarchy — the bootstrap loader (java.base), the platform loader and the application (system) loader — and links them (verify, prepare, resolve) before initializing static state. Runtime data areas store program state. The execution engine contains the interpreter, the JIT compilers and the garbage collector.",
        "Runtime data areas: the heap (shared; all objects and arrays), the method area / Metaspace (class metadata, runtime constant pool, static variables — native memory since Java 8, replacing PermGen), and per-thread areas: the JVM stack (one frame per method call with local variables and operand stack), the program counter register, and the native method stack. Deep recursion overflows the stack (StackOverflowError); too many live objects exhaust the heap (OutOfMemoryError: Java heap space).",
        "An object becomes eligible for garbage collection when it is no longer reachable from GC roots (local variables of active frames, static fields, active threads, JNI references). Cycles of unreachable objects are collected too. Most collectors are generational because most objects die young: new objects go to Eden in the young generation, survivors move between survivor spaces and are promoted to the old generation after surviving several collections.",
        "G1 is the default collector (region-based, pause-time goals). ZGC and Shenandoah are low-latency collectors with sub-millisecond pauses on large heaps; Parallel GC maximizes throughput. System.gc() is only a hint. java.lang.ref offers SoftReference (cleared under memory pressure, for caches), WeakReference (cleared at the next GC, used by WeakHashMap) and PhantomReference (post-mortem cleanup, with Cleaner).",
      ],
      usage: [
        "Set heap size with -Xms and -Xmx (often equal for servers) and pick a collector with -XX:+UseG1GC or -XX:+UseZGC.",
        "Investigate memory leaks with heap dumps (-XX:+HeapDumpOnOutOfMemoryError, jcmd GC.heap_dump) and tools such as Eclipse MAT or VisualVM.",
        "Watch GC behaviour with -Xlog:gc* and Java Flight Recorder.",
        "Avoid leaks from long-lived static collections, unbounded caches, listeners never removed and ThreadLocals in thread pools.",
      ],
      files: [
        file("src/jvm/MemoryDemo.java", code`
package jvm;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;

public class MemoryDemo {
    static final List<byte[]> LEAK = new ArrayList<>();   // static root: everything here stays reachable

    static int depth = 0;
    static void recurse() { depth++; recurse(); }          // each call adds a stack frame

    public static void main(String[] args) {
        Runtime rt = Runtime.getRuntime();
        System.out.printf("max heap %d MB, total %d MB, free %d MB%n",
            rt.maxMemory() >> 20, rt.totalMemory() >> 20, rt.freeMemory() >> 20);

        Object data = new byte[10 * 1024 * 1024];
        WeakReference<Object> weak = new WeakReference<>(data);
        data = null;                                       // no strong references remain
        System.gc();                                       // a hint, not a command
        System.out.println("weak ref cleared? " + (weak.get() == null));

        try { recurse(); } catch (StackOverflowError e) { System.out.println("stack depth reached: " + depth); }

        for (int i = 0; i < 5; i++) LEAK.add(new byte[1024 * 1024]);   // retained forever
        System.out.println("leaked MB: " + LEAK.size());
    }
}`),
        file("run-with-gc-logging.sh", code`
# 256 MB fixed heap, G1 collector, GC events to the console, heap dump on OOM
java -Xms256m -Xmx256m -XX:+UseG1GC -Xlog:gc -XX:+HeapDumpOnOutOfMemoryError -cp out jvm.MemoryDemo

# Low-latency collector on large heaps
java -Xmx8g -XX:+UseZGC -cp out jvm.MemoryDemo

# Inspect a running JVM
jcmd <pid> GC.heap_info
jcmd <pid> Thread.print`),
      ],
      tips: [
        "Primitive locals live in the stack frame; objects always live on the heap (escape analysis may optimize allocations away, but that is invisible to you).",
        "Since Java 7 the string pool lives in the heap, and since Java 8 PermGen is replaced by Metaspace.",
        "finalize() is deprecated for removal; use try-with-resources or Cleaner instead.",
        "Class loading uses parent delegation, so you cannot replace java.lang.String with your own class.",
      ],
      subjective: [
        qa("Explain the memory areas of the JVM.", "Shared by all threads: the heap, holding all objects and arrays and divided into young (Eden + survivor spaces) and old generations; and the method area (Metaspace in Java 8+), holding class metadata, method bytecode, the runtime constant pool and static variables. Per thread: the JVM stack of frames (local variables, operand stack, return address), the PC register pointing to the current instruction, and the native method stack for native code."),
        qa("How does garbage collection decide that an object is garbage?", "Modern JVMs use reachability tracing, not reference counting. Starting from GC roots — local variables and parameters in active stack frames, static fields of loaded classes, live threads, JNI references — the collector marks every object reachable by following references. Unmarked objects are unreachable and their memory can be reclaimed, so unreachable cycles are collected as well."),
        qa("Explain class loaders and the delegation model.", "Class loaders load .class bytes into the JVM. The bootstrap loader (native) loads core modules such as java.base; the platform loader loads other Java SE modules; the application loader loads classes from the classpath/module path. When asked to load a class, a loader first delegates to its parent and only loads it itself if the parent cannot. This ensures core classes are loaded once by trusted loaders and cannot be spoofed. After loading come linking (verification, preparation of static fields with defaults, resolution) and initialization (static initializers)."),
      ],
      objective: [
        mcq("Where are objects allocated?", ["Stack", "Heap", "Metaspace", "PC register"], 1, "All objects and arrays live on the heap."),
        mcq("What replaced PermGen in Java 8?", ["Eden", "Metaspace", "Code cache", "Old generation"], 1, "Metaspace stores class metadata in native memory."),
        mcq("Infinite recursion causes:", ["OutOfMemoryError: heap space", "StackOverflowError", "NullPointerException", "ClassCastException"], 1, "Each call adds a frame until the thread stack is exhausted."),
        mcq("Default garbage collector in modern HotSpot (Java 9+) on server-class machines:", ["Serial", "CMS", "G1", "Epsilon"], 2, "G1 became the default in Java 9; CMS was removed in Java 14."),
        mcq("Which reference type is cleared at the next GC when only weakly reachable?", ["SoftReference", "WeakReference", "Strong reference", "Final reference"], 1, "Soft references survive until memory is tight; weak ones go at the next collection."),
      ],
    },
  ],
};
