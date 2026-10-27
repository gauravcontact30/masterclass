import type { TopicLab } from "../types";
import { alt, code, ex, syntax, task } from "./helpers";

/** Core Java labs, topics 1–9 (foundations and object-oriented programming). */
export const LABS_1: Record<string, TopicLab> = {
  "jdk-jre-jvm": {
    steps: [
      "Write your source code in a .java file. A public class must live in a file with exactly the same name, so public class Main goes in Main.java.",
      "Compile it with javac. The compiler checks types and syntax and produces platform-independent bytecode in .class files, one per class.",
      "Run it with the java launcher. It starts a Java Virtual Machine (JVM) and asks it to run the main method of the class you name.",
      "The JVM's class loaders find and load classes on demand: the bootstrap loader loads core classes such as java.lang.String, the platform and application loaders load the rest.",
      "Before any loaded class runs, the bytecode verifier checks it is well formed and type-safe, which is part of why Java is secure by default.",
      "The interpreter starts executing bytecode immediately; the JIT (just-in-time) compiler watches for hot methods and compiles them to native machine code so they run fast.",
      "Remember the layers: JVM = runs bytecode; JRE = JVM + standard libraries; JDK = JRE + tools such as javac, jar, javadoc and jshell. Since Java 11 you install a JDK, and java File.java can run a single source file without a separate compile step.",
    ],
    syntax: syntax("Main.java", code`
// The file name must match the public class: Main.java
public class Main {
    // The entry point: the JVM calls exactly this signature
    public static void main(String[] args) {
        System.out.println("statement");
    }
}

// Compile:            javac Main.java        -> produces Main.class (bytecode)
// Run the class:      java Main              -> class name, no .class extension
// Run the source:     java Main.java         -> Java 11+: compiles in memory and runs
// Package as a JAR:   jar --create --file app.jar --main-class Main Main.class
`, [
      "main must be public static void and take a String[]; the JVM finds it by that exact signature.",
      "java takes a class name (Main), not a file name (Main.class).",
      "Each top-level class compiles to its own .class file; nested classes become Outer$Inner.class.",
      "Bytecode is the same on every operating system; only the JVM is platform-specific (write once, run anywhere).",
    ]),
    example: ex("Your first program: output, arguments and a loop", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from the JVM!");
        System.out.println("Arguments received: " + args.length);
        int sum = 0;
        for (int i = 1; i <= 5; i++) sum += i;
        System.out.println("Sum 1..5 = " + sum);
    }
}
`, code`
Hello from the JVM!
Arguments received: 0
Sum 1..5 = 15
`, "The JVM calls main with the command-line arguments in args (none here). The loop runs as bytecode in the interpreter; in a long-running program the JIT would compile it to native code."),
    simple: ex("Two classes in one file, and who loads String", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Greeter greeter = new Greeter("Asha");
        System.out.println(greeter.greet());
        // Core classes are loaded by the bootstrap class loader, shown as null
        System.out.println("Bootstrap loader for String: " + String.class.getClassLoader());
    }
}

class Greeter {
    private final String name;
    Greeter(String name) { this.name = name; }
    String greet() { return "Hello, " + name + "!"; }
}
`, code`
Hello, Asha!
Bootstrap loader for String: null
`, "javac produces Main.class and Greeter.class from this one file. String comes from the bootstrap loader, which is implemented inside the JVM and so has no Java object to print."),
    moderate: ex("Classes are loaded and initialised lazily", "Main.java", code`
public class Main {
    static { System.out.println("1. Main loaded"); }

    public static void main(String[] args) {
        System.out.println("2. main() starts");
        // A static final constant is copied into Main at compile time: Config is not touched
        System.out.println("3. Config.NAME = " + Config.NAME);
        // Reading a normal static field forces Config to be initialised first
        System.out.println("4. Config.started = " + Config.started);
    }
}

class Config {
    static final String NAME = "demo";
    static long started = 42;
    static { System.out.println("   (Config class initialised)"); }
}
`, code`
1. Main loaded
2. main() starts
3. Config.NAME = demo
   (Config class initialised)
4. Config.started = 42
`, "The JVM initialises a class only when it is first actively used. Compile-time constants are inlined, so reading Config.NAME does not count; reading Config.started does, so Config's static block runs just before line 4 is printed."),
    complex: ex("The call stack and the heap at run time", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Point p = new Point(3, 4);   // the object lives on the heap; the reference p lives in main's stack frame
        System.out.println("distance = " + distance(p));
        a();
    }

    static double distance(Point p) {
        return Math.sqrt(p.x * p.x + p.y * p.y);
    }

    static void a() { b(); }
    static void b() { c(); }

    // Each method call pushes a frame on the thread's stack; print them from the top
    static void c() {
        for (StackTraceElement frame : Thread.currentThread().getStackTrace()) {
            if (frame.getMethodName().equals("getStackTrace")) continue;
            System.out.println("at " + frame.getClassName() + "." + frame.getMethodName());
            if (frame.getMethodName().equals("main")) break;
        }
    }
}

class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
}
`, code`
distance = 5.0
at Main.c
at Main.b
at Main.a
at Main.main
`, "Every thread has its own stack of frames holding local variables and references; objects such as the Point are allocated on the shared heap. The stack trace shows the frames from the most recent call (c) back down to main."),
    assignments: [
      task("Write a program that prints your name and how many command-line arguments it received, then list the exact commands to compile it and run it with the arguments hello world.", "Compile once with javac, then pass arguments after the class name. With hello world the program receives two arguments.", code`
public class Main {
    public static void main(String[] args) {
        System.out.println("My name is Asha");
        System.out.println("Arguments: " + args.length);
        for (String arg : args) System.out.println(" - " + arg);
    }
}
// javac Main.java
// java Main hello world
// My name is Asha
// Arguments: 2
//  - hello
//  - world
`),
      task("A classmate runs java Main.class and gets 'Could not find or load main class Main.class'. Explain why and give the correct command.", "The java launcher expects a fully qualified class name, not a file name. Main.class is read as a class called class inside a package called Main, which does not exist. The correct command is java Main (or java Main.java to run the source file directly on Java 11+)."),
      task("Explain the difference between the JDK, the JRE and the JVM, and say which one a developer installs and which one a server needs to run a packaged application.", "The JVM executes bytecode and manages memory, threads and JIT compilation. The JRE is the JVM plus the standard class libraries needed to run programs. The JDK is the JRE plus development tools such as javac, jar, javadoc, jdb and jshell.\n\nDevelopers install a JDK. Since Java 11 there is no separate JRE download, so servers also install a JDK, or ship a trimmed runtime built with jlink that contains only the modules the application needs."),
      task("Predict the output, then explain it: a class Logger has static { System.out.println(\"init\"); } and static final int LEVEL = 3; main prints Logger.LEVEL twice. How many times is init printed?", "init is never printed. LEVEL is a compile-time constant (static final with a constant initialiser), so javac copies the value 3 into the calling class and Logger is never initialised. If LEVEL were not final, or were initialised by a method call, init would print once, before the first use."),
    ],
    alternates: [
      alt("Run a single source file without javac", "Since Java 11 the launcher can compile a single file in memory and run it. Ideal for scripts, quick experiments and interview practice; use javac for multi-file projects.", "commands.sh", code`
# Compiles Main.java in memory and runs it; no Main.class is left behind
java Main.java hello world

# With Java 22+ the launcher can also run a program spread over several source files
java src/Main.java
`),
      alt("Experiment interactively in JShell", "JShell (Java 9+) evaluates statements one at a time with no class or main method. Best for trying an API or checking an expression's result.", "session.jsh", code`
$ jshell
jshell> int sum = 0;
sum ==> 0
jshell> for (int i = 1; i <= 5; i++) sum += i;
jshell> sum
sum ==> 15
jshell> "Hello from the JVM!".length()
$4 ==> 19
`),
      alt("Package and run as an executable JAR", "The way applications are shipped: one file with a manifest naming the main class, run the same way on every machine with a JVM.", "commands.sh", code`
javac -d out Main.java
jar --create --file app.jar --main-class Main -C out .
java -jar app.jar
`),
    ],
  },

  "data-types": {
    steps: [
      "Java is statically typed: every variable has a type that is fixed when the code is compiled, and the compiler rejects operations the type does not support.",
      "There are eight primitive types holding raw values: byte (8-bit), short (16), int (32), long (64), float (32-bit floating point), double (64), char (16-bit UTF-16 code unit) and boolean.",
      "Everything else is a reference type (String, arrays, your classes). A reference variable holds a pointer to an object on the heap, or null.",
      "Widening conversions that cannot lose information happen automatically: byte → short → int → long → float → double, and char → int.",
      "Narrowing conversions (double → int, int → byte) need an explicit cast and may truncate or overflow, so the programmer takes responsibility.",
      "Every primitive has a wrapper class (Integer, Double, Character…). Autoboxing converts a primitive to its wrapper automatically and unboxing does the reverse, which is how primitives go into collections.",
      "Integer.valueOf caches -128 to 127, so == between wrappers is unreliable; always compare wrapper values with equals(). Use BigDecimal for money and Math.addExact when overflow must be detected.",
    ],
    syntax: syntax("Types.java", code`
// type name = value;
byte    b = 100;
short   s = 30_000;
int     count = 10;
long    big = 9_000_000_000L;   // L suffix: the literal is a long
float   ratio = 0.75f;          // f suffix: the literal is a float
double  price = 99.50;
char    grade = 'A';            // single quotes: one UTF-16 character
boolean ok = true;
String  name = "Asha";          // a reference type
var     total = count * 2;      // Java 10+: the type (int) is inferred

int     whole = (int) price;    // explicit narrowing cast: 99
long    wide  = count;          // automatic widening
Integer boxed = count;          // autoboxing
int     raw   = boxed;          // unboxing
`, [
      "Underscores in numeric literals (30_000) are only for readability.",
      "Integer literals are int and decimal literals are double unless suffixed with L or f.",
      "var still means static typing: the compiler infers the type once and it never changes.",
      "Fields get default values (0, false, null); local variables must be assigned before they are read.",
    ]),
    example: ex("Ranges of the primitive types", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        System.out.println("byte:  " + Byte.MIN_VALUE + " to " + Byte.MAX_VALUE);
        System.out.println("short: " + Short.MIN_VALUE + " to " + Short.MAX_VALUE);
        System.out.println("int:   " + Integer.MIN_VALUE + " to " + Integer.MAX_VALUE);
        System.out.println("long:  " + Long.MAX_VALUE);
        System.out.println("char:  " + (int) Character.MAX_VALUE);
        System.out.println("double 0.1 + 0.2 = " + (0.1 + 0.2));
    }
}
`, code`
byte:  -128 to 127
short: -32768 to 32767
int:   -2147483648 to 2147483647
long:  9223372036854775807
char:  65535
double 0.1 + 0.2 = 0.30000000000000004
`, "Each wrapper class exposes its primitive's limits. The last line shows binary floating point cannot represent 0.1 exactly, which is why money is never stored in a double."),
    simple: ex("Casting: truncation, rounding and overflow", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        double price = 99.99;
        int rupees = (int) price;            // truncates toward zero
        long rounded = Math.round(price);    // rounds to the nearest whole number
        int big = 130;
        byte small = (byte) big;             // keeps the low 8 bits: wraps around
        char letter = 'A';
        int code = letter;                   // widening: the character's code
        System.out.println(rupees);
        System.out.println(rounded);
        System.out.println(small);
        System.out.println(code + " " + (char) (code + 2));
    }
}
`, code`
99
100
-126
65 C
`, "A cast to int simply drops the fraction. 130 does not fit in a byte (max 127), so it wraps to 130 - 256 = -126. Characters are numbers underneath: 'A' is 65 and 67 is 'C'."),
    moderate: ex("Wrappers, caching and parsing", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println(a == b);          // true: both come from the cache
        System.out.println(c == d);          // false: two different objects
        System.out.println(c.equals(d));     // true: compares the values
        int parsed = Integer.parseInt("2026");
        Integer boxed = Integer.valueOf("42");
        System.out.println(parsed + boxed);  // boxed is unboxed for the addition
        System.out.println(Integer.toBinaryString(10) + " " + Integer.toHexString(255));
        System.out.println(Integer.MAX_VALUE + 1);
    }
}
`, code`
true
false
true
2068
1010 ff
-2147483648
`, "Autoboxing uses Integer.valueOf, which returns cached objects for -128..127, so == happens to work for 127 but not for 128. int arithmetic silently wraps on overflow: MAX_VALUE + 1 becomes MIN_VALUE."),
    complex: ex("Money, GST and overflow done safely", "Main.java", code`
import java.math.BigDecimal;
import java.math.RoundingMode;

public class Main {
    public static void main(String[] args) {
        // 1. Money: never use double
        double d = 0.1 + 0.2;
        BigDecimal exact = new BigDecimal("0.1").add(new BigDecimal("0.2"));
        System.out.println("double: " + d + ", BigDecimal: " + exact);

        // 2. GST at 18% on 1999.99, rounded to paise
        BigDecimal price = new BigDecimal("1999.99");
        BigDecimal gst = price.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        System.out.println("GST: " + gst + ", total: " + price.add(gst));

        // 3. Overflow detection instead of silent wrap-around
        int views = Integer.MAX_VALUE;
        try {
            Math.addExact(views, 1);
        } catch (ArithmeticException e) {
            System.out.println("Overflow caught: " + e.getMessage());
        }
        long safe = (long) views + 1;   // widen first, then add
        System.out.println("As long: " + safe);

        // 4. Integer division versus floating-point division
        System.out.println(7 / 2 + " " + 7 / 2.0 + " " + 7 % 2);
    }
}
`, code`
double: 0.30000000000000004, BigDecimal: 0.3
GST: 360.00, total: 2359.99
Overflow caught: integer overflow
As long: 2147483648
3 3.5 1
`, "BigDecimal created from strings stores decimal digits exactly, and setScale rounds 359.9982 to 360.00 with the rounding mode you choose. Math.addExact throws instead of wrapping. Casting one operand to long before the addition makes the whole expression long. Dividing two ints discards the remainder; one double operand makes it floating point."),
    assignments: [
      task("Swap the values of two int variables without using a third variable, and explain the risk of the arithmetic approach.", "The arithmetic trick can overflow for large values (although it still produces the right answer because overflow wraps symmetrically); the XOR trick has no overflow. In real code, a temporary variable is clearest.", code`
int a = 5, b = 9;
a = a + b;   // 14
b = a - b;   // 5
a = a - b;   // 9
// or with XOR
a ^= b; b ^= a; a ^= b;
`),
      task("Which of these lines compile, and why? char c = 'a' + 1;   char c2 = c + 1;   char c3 = (char) (c + 1);", "char c = 'a' + 1 compiles: 'a' + 1 is a constant expression whose value (98) fits in a char, so the compiler narrows it implicitly. char c2 = c + 1 does not compile: c is a variable, so c + 1 is an int computed at run time and needs an explicit cast. char c3 = (char) (c + 1) compiles and holds 'c'."),
      task("Write a program that converts 37.5 °C to Fahrenheit and prints it with exactly two decimal places.", "Use floating-point division (9.0 / 5) so the result is not truncated, and format with %.2f.", code`
public class Main {
    public static void main(String[] args) {
        double celsius = 37.5;
        double fahrenheit = celsius * 9.0 / 5 + 32;
        System.out.printf("%.2f F%n", fahrenheit);   // 99.50 F
    }
}
`),
      task("A loop counts page views in an int and the dashboard suddenly shows a negative number. Explain what happened and fix it.", "The int passed Integer.MAX_VALUE (2,147,483,647) and wrapped around to a large negative number, because int arithmetic overflows silently. Store the counter in a long (or an AtomicLong if several threads update it), and use Math.addExact where an overflow must be reported instead of hidden."),
    ],
    alternates: [
      alt("Convert between strings and numbers in other ways", "valueOf returns a cached wrapper, parseInt a primitive; String.valueOf and Integer.toString avoid relying on string concatenation for conversion.", "Conversions.java", code`
int n = Integer.parseInt("42");          // primitive
Integer boxed = Integer.valueOf("42");   // wrapper (cached for -128..127)
String s1 = String.valueOf(n);           // "42"
String s2 = Integer.toString(n, 2);      // "101010" in base 2
double d = Double.parseDouble("3.75");
`),
      alt("Let the compiler infer local types with var", "Shorter declarations when the type is obvious from the right-hand side; keep explicit types when they make the code clearer.", "VarDemo.java", code`
var count = 10;                          // int
var price = 99.5;                        // double
var names = new java.util.ArrayList<String>();
for (var name : names) System.out.println(name);
`),
    ],
  },

  "operators-control-flow": {
    steps: [
      "Arithmetic operators (+ - * / %) follow the usual precedence; integer division discards the remainder and % gives it.",
      "Relational operators (== != < > <= >=) produce booleans; logical && and || short-circuit, so the right side runs only when it can change the result.",
      "The ternary operator condition ? a : b picks one of two values in a single expression.",
      "Pre-increment (++i) changes the variable and then yields the new value; post-increment (i++) yields the old value and then changes it.",
      "if / else if / else choose between blocks; switch selects among constant cases (fall-through until break in the classic form, no fall-through with the Java 14+ arrow form).",
      "Loops: for when the number of iterations is known, while when it depends on a condition, do-while when the body must run at least once, and the enhanced for to visit every element of an array or collection.",
      "break leaves the innermost loop or switch and continue skips to the next iteration; labels (outer:) let you break or continue an outer loop.",
    ],
    syntax: syntax("ControlFlow.java", code`
if (condition) { ... } else if (other) { ... } else { ... }

String size = n > 100 ? "large" : "small";     // ternary

switch (day) {                                  // classic switch
    case "SAT":
    case "SUN": System.out.println("weekend"); break;
    default:    System.out.println("weekday");
}

String kind = switch (day) {                    // Java 14+ switch expression
    case "SAT", "SUN" -> "weekend";
    default -> "weekday";
};

for (int i = 0; i < n; i++) { ... }
for (String item : items) { ... }               // enhanced for
while (condition) { ... }
do { ... } while (condition);                   // runs at least once

outer:
for (...) { for (...) { if (found) break outer; } }
`, [
      "&& and || short-circuit; & and | always evaluate both sides.",
      "A classic switch falls through to the next case until it meets break.",
      "Switch works on int-like types, char, String and enums (and patterns in Java 21).",
      "Prefer the enhanced for when you do not need the index.",
    ]),
    example: ex("FizzBuzz from 1 to 15", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        StringBuilder out = new StringBuilder();
        for (int i = 1; i <= 15; i++) {
            if (i % 15 == 0) out.append("FizzBuzz");
            else if (i % 3 == 0) out.append("Fizz");
            else if (i % 5 == 0) out.append("Buzz");
            else out.append(i);
            if (i < 15) out.append(' ');
        }
        System.out.println(out);
    }
}
`, code`
1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz
`, "The order of the conditions matters: multiples of 15 are checked first, otherwise they would be caught by the multiple-of-3 branch."),
    simple: ex("Grades with if/else, switch and the ternary operator", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        int marks = 82;
        char grade;
        if (marks >= 90) grade = 'A';
        else if (marks >= 75) grade = 'B';
        else if (marks >= 60) grade = 'C';
        else grade = 'F';
        System.out.println("Grade: " + grade);

        switch (grade) {
            case 'A':
            case 'B':
                System.out.println("Eligible for scholarship");
                break;
            default:
                System.out.println("Keep going");
        }
        System.out.println(marks >= 35 ? "Pass" : "Fail");
    }
}
`, code`
Grade: B
Eligible for scholarship
Pass
`, "Cases A and B share one block because case A falls through to case B; break stops the fall-through."),
    moderate: ex("Increments, short-circuiting and bit operators", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        int i = 5;
        int a = i++ + ++i;      // 5 (then i = 6) + 7 (i becomes 7 first)
        System.out.println("a = " + a + ", i = " + i);

        int calls = 0;
        boolean result = (calls++ > 0) && (calls++ > 0);   // right side never runs
        System.out.println(result + " " + calls);
        result = (calls++ > 0) | (calls++ > 0);            // | evaluates both sides
        System.out.println(result + " " + calls);

        System.out.println(10 >> 1);      // shift right: halve
        System.out.println(-10 >>> 28);   // unsigned shift fills with zeros
        System.out.println(5 & 3);        // 101 & 011 = 001
        System.out.println(5 ^ 3);        // 101 ^ 011 = 110
    }
}
`, code`
a = 12, i = 7
false 1
true 3
5
15
1
6
`, "i++ yields 5 and then i becomes 6; ++i makes it 7 and yields 7, so a is 12. With && the false left side stops evaluation, so calls only reaches 1; the non-short-circuit | runs both increments."),
    complex: ex("Labelled loops, do-while and patterns", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        // 1. Primes below 30 with a labelled continue
        StringBuilder primes = new StringBuilder();
        outer:
        for (int n = 2; n < 30; n++) {
            for (int d = 2; d * d <= n; d++) {
                if (n % d == 0) continue outer;   // not prime: next n
            }
            primes.append(n).append(' ');
        }
        System.out.println("Primes: " + primes.toString().trim());

        // 2. First pair of neighbours summing to 10: one break leaves both loops
        int[][] grid = {{1, 4, 6}, {3, 7, 2}, {8, 5, 9}};
        search:
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c + 1 < grid[r].length; c++) {
                if (grid[r][c] + grid[r][c + 1] == 10) {
                    System.out.println("Found " + grid[r][c] + "+" + grid[r][c + 1] + " at row " + r);
                    break search;
                }
            }
        }

        // 3. do-while runs at least once: digits of a number
        int number = 9075, digits = 0, sum = 0;
        do {
            sum += number % 10;
            number /= 10;
            digits++;
        } while (number > 0);
        System.out.println("Digits: " + digits + ", digit sum: " + sum);

        // 4. A pyramid
        for (int row = 1; row <= 4; row++) {
            System.out.println(" ".repeat(4 - row) + "*".repeat(2 * row - 1));
        }
    }
}
`, code`
Primes: 2 3 5 7 11 13 17 19 23 29
Found 4+6 at row 0
Digits: 4, digit sum: 21
   *
  ***
 *****
*******
`, "continue outer jumps straight to the next candidate as soon as a divisor is found, and only divisors up to the square root are tried. break search exits both loops at the first match. The do-while would still count one digit for the number 0."),
    assignments: [
      task("Print the multiplication table of 7 from 7 x 1 to 7 x 10, one line each.", "A counted for loop is the natural fit.", code`
for (int i = 1; i <= 10; i++) {
    System.out.println("7 x " + i + " = " + (7 * i));
}
`),
      task("Reverse the digits of an integer (1234 → 4321) using a loop, without converting it to a String.", "Repeatedly take the last digit with % 10, append it to the result by multiplying the result by 10, and drop the digit with / 10.", code`
int n = 1234, reversed = 0;
while (n != 0) {
    reversed = reversed * 10 + n % 10;
    n /= 10;
}
System.out.println(reversed);   // 4321
`),
      task("Write a method isLeapYear(int year) and explain the rule it implements.", "A year is a leap year if it is divisible by 4, except century years, which must also be divisible by 400. So 2024 and 2000 are leap years; 1900 is not.", code`
static boolean isLeapYear(int year) {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}
`),
      task("What does this print, and why? int x = 0; if (x != 0 && 10 / x > 1) System.out.println(\"big\"); else System.out.println(\"safe\");", "It prints safe. Because && short-circuits, 10 / x is never evaluated when x != 0 is false, so there is no ArithmeticException. With & instead of && the division would run and throw / by zero."),
    ],
    alternates: [
      alt("A switch expression instead of an if-else ladder", "Java 14+ switch expressions return a value, have no fall-through, and the compiler checks every enum constant is covered.", "Grades.java", code`
static String result(char grade) {
    return switch (grade) {
        case 'A', 'B' -> "Eligible for scholarship";
        case 'C' -> "Pass";
        default -> "Keep going";
    };
}
`),
      alt("FizzBuzz with streams", "A declarative pipeline: map each number to its word and join them. Shorter, but a plain loop is easier to step through in a debugger.", "Main.java", code`
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        System.out.println(IntStream.rangeClosed(1, 15)
            .mapToObj(i -> i % 15 == 0 ? "FizzBuzz" : i % 3 == 0 ? "Fizz" : i % 5 == 0 ? "Buzz" : String.valueOf(i))
            .collect(Collectors.joining(" ")));
    }
}
`),
    ],
  },

  "arrays-strings": {
    steps: [
      "An array is a fixed-length, ordered block of elements of one type, created with new int[5] or an initialiser {1, 2, 3}; its length never changes.",
      "Elements are indexed from 0 to length - 1; reading outside that range throws ArrayIndexOutOfBoundsException.",
      "java.util.Arrays provides toString, sort, binarySearch, fill, copyOf, equals and deepToString for multi-dimensional arrays.",
      "A String is an immutable sequence of characters: every 'modifying' method (toUpperCase, replace, substring) returns a new String.",
      "String literals are stored once in the string pool, so two identical literals refer to the same object; new String(\"x\") always creates a new object. Compare contents with equals(), never ==.",
      "Use StringBuilder when you build a string in a loop: it appends into one growable buffer instead of creating a new String each time.",
      "Multi-dimensional arrays are arrays of arrays (int[][]), and their rows may have different lengths.",
    ],
    syntax: syntax("ArraysAndStrings.java", code`
int[] marks = new int[5];              // five zeros
int[] primes = {2, 3, 5, 7};           // initialiser
int[][] grid = new int[3][4];          // 3 rows, 4 columns
int last = primes[primes.length - 1];

String s = "Core Java";
s.length();  s.charAt(0);  s.indexOf("Java");  s.substring(5);
s.toUpperCase();  s.replace('a', '@');  s.split(" ");  s.trim();
s.equals("core java");  s.equalsIgnoreCase("core java");

StringBuilder sb = new StringBuilder();
sb.append("Hello").append(' ').append(42).reverse().toString();

java.util.Arrays.sort(primes);
java.util.Arrays.toString(primes);     // "[2, 3, 5, 7]"
`, [
      "arr.length is a field; s.length() is a method.",
      "Strings are immutable and thread-safe; StringBuilder is mutable and not thread-safe.",
      "String.join, String.repeat (Java 11) and strip (Java 11, Unicode-aware) are handy additions.",
      "Arrays.asList returns a fixed-size list backed by the array.",
    ]),
    example: ex("Array statistics and common String methods", "Main.java", code`
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] marks = {72, 88, 95, 60, 81};
        int total = 0;
        for (int m : marks) total += m;
        System.out.println("Total: " + total + ", average: " + (double) total / marks.length);
        Arrays.sort(marks);
        System.out.println("Sorted: " + Arrays.toString(marks));

        String course = "Core Java";
        System.out.println(course.length() + " " + course.toUpperCase() + " " + course.indexOf("Java"));
        System.out.println(course.substring(5) + " " + course.charAt(0) + " " + course.replace('a', '@'));
    }
}
`, code`
Total: 396, average: 79.2
Sorted: [60, 72, 81, 88, 95]
9 CORE JAVA 5
Java C Core J@v@
`, "The cast to double before dividing gives 79.2 instead of 79. Arrays.sort sorts in place. String methods return new strings; course itself is unchanged."),
    simple: ex("The string pool: == versus equals", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        String a = "java";
        String b = "java";
        String c = new String("java");
        System.out.println(a == b);           // same pooled literal
        System.out.println(a == c);           // new object on the heap
        System.out.println(a.equals(c));      // same characters
        System.out.println(a == c.intern());  // intern() returns the pooled copy
        String d = "ja" + "va";               // constant expression: pooled at compile time
        System.out.println(a == d);
    }
}
`, code`
true
false
true
true
true
`, "== compares references, equals compares characters. Literals and compile-time constant expressions share one pooled object; new String always allocates a fresh one."),
    moderate: ex("Reversing words, palindromes and letter counts", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        String text = "Madam Arora teaches malayalam";

        StringBuilder reversedWords = new StringBuilder();
        String[] words = text.split(" ");
        for (int i = words.length - 1; i >= 0; i--) {
            reversedWords.append(words[i]);
            if (i > 0) reversedWords.append(' ');
        }
        System.out.println(reversedWords);

        for (String w : words) {
            String lower = w.toLowerCase();
            boolean palindrome = new StringBuilder(lower).reverse().toString().equals(lower);
            if (palindrome) System.out.println(w + " is a palindrome");
        }

        int[] counts = new int[26];
        for (char ch : text.toLowerCase().toCharArray()) {
            if (ch >= 'a' && ch <= 'z') counts[ch - 'a']++;
        }
        System.out.println("a appears " + counts[0] + " times");
    }
}
`, code`
malayalam teaches Arora Madam
Madam is a palindrome
Arora is a palindrome
malayalam is a palindrome
a appears 9 times
`, "StringBuilder.reverse makes the palindrome check one line. An int[26] indexed by ch - 'a' is the classic constant-space way to count letters."),
    complex: ex("Matrices, run-length compression and anagrams", "Main.java", code`
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[][] a = {{1, 2}, {3, 4}};
        int[][] b = {{5, 6}, {7, 8}};
        int[][] product = new int[2][2];
        for (int i = 0; i < 2; i++)
            for (int j = 0; j < 2; j++)
                for (int k = 0; k < 2; k++)
                    product[i][j] += a[i][k] * b[k][j];
        System.out.println("A x B = " + Arrays.deepToString(product));

        int[][] matrix = {{1, 2, 3}, {4, 5, 6}};
        int[][] t = new int[3][2];
        for (int i = 0; i < 2; i++)
            for (int j = 0; j < 3; j++)
                t[j][i] = matrix[i][j];
        System.out.println("Transpose = " + Arrays.deepToString(t));

        System.out.println(compress("aaabccdddd"));
        System.out.println(isAnagram("Listen", "Silent") + " " + isAnagram("Java", "Lava"));
    }

    // Run-length encoding; keeps the original when encoding would not make it shorter
    static String compress(String s) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); ) {
            int j = i;
            while (j < s.length() && s.charAt(j) == s.charAt(i)) j++;
            sb.append(s.charAt(i)).append(j - i);
            i = j;
        }
        return sb.length() < s.length() ? sb.toString() : s;
    }

    static boolean isAnagram(String x, String y) {
        char[] p = x.toLowerCase().toCharArray(), q = y.toLowerCase().toCharArray();
        Arrays.sort(p);
        Arrays.sort(q);
        return Arrays.equals(p, q);
    }
}
`, code`
A x B = [[19, 22], [43, 50]]
Transpose = [[1, 4], [2, 5], [3, 6]]
a3b1c2d4
true false
`, "Matrix multiplication is three nested loops (row × column × shared index). deepToString prints nested arrays. Sorting both character arrays turns the anagram test into a simple array comparison."),
    assignments: [
      task("Find the second largest distinct number in an int array in a single pass.", "Track the largest and second largest as you go; update second only for values strictly between them so duplicates of the maximum are ignored.", code`
static int secondLargest(int[] a) {
    int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
    for (int x : a) {
        if (x > first) { second = first; first = x; }
        else if (x > second && x < first) second = x;
    }
    return second;   // e.g. {4, 9, 9, 7} -> 7
}
`),
      task("Count the vowels in a sentence, ignoring case.", "Lower-case the text once and test each character against a string of vowels.", code`
static int vowels(String s) {
    int count = 0;
    for (char c : s.toLowerCase().toCharArray()) if ("aeiou".indexOf(c) >= 0) count++;
    return count;   // vowels("Core Java") -> 4
}
`),
      task("Check whether one string is a rotation of another (\"javacore\" is a rotation of \"corejava\").", "If both strings have the same length, s2 is a rotation of s1 exactly when it appears inside s1 + s1.", code`
static boolean isRotation(String s1, String s2) {
    return s1.length() == s2.length() && (s1 + s1).contains(s2);
}
`),
      task("Why is building a long string with += inside a loop slow, and what should you use instead?", "Strings are immutable, so each += creates a new String and copies all the characters built so far, making the loop O(n²) in the total length. A StringBuilder appends into one growable buffer (amortised O(1) per append); call toString() once at the end. Modern compilers optimise a single + expression, but not a loop."),
    ],
    alternates: [
      alt("Sum and average with streams", "IntStream gives sum, average, min and max without a hand-written loop.", "Stats.java", code`
import java.util.Arrays;
import java.util.IntSummaryStatistics;

int[] marks = {72, 88, 95, 60, 81};
IntSummaryStatistics stats = Arrays.stream(marks).summaryStatistics();
System.out.println(stats.getSum() + " " + stats.getAverage() + " " + stats.getMax());
// 396 79.2 95
`),
      alt("Join and reverse words without manual loops", "String.join and Collections.reverse express the intent directly.", "Words.java", code`
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

List<String> words = Arrays.asList("Madam Arora teaches malayalam".split(" "));
Collections.reverse(words);
System.out.println(String.join(" ", words));   // malayalam teaches Arora Madam
`),
    ],
  },

  "classes-objects": {
    steps: [
      "A class is a blueprint: it declares fields (state) and methods (behaviour). An object is one instance of that class created with new.",
      "new allocates the object on the heap, gives every field its default value, runs instance initialisers and then the constructor.",
      "A constructor has the class's name and no return type; this refers to the current object and this(...) calls another constructor of the same class (constructor chaining).",
      "If you write no constructor, the compiler adds a no-argument default constructor; as soon as you write one, it does not.",
      "static members belong to the class, not to any object: one copy shared by all instances, accessed as ClassName.member.",
      "Override toString, equals and hashCode so objects print and compare meaningfully.",
      "Static initialiser blocks run once when the class is initialised; instance initialiser blocks run before the constructor body every time an object is created.",
    ],
    syntax: syntax("Account.java", code`
public class Account {
    private static int opened = 0;      // shared by all accounts
    private final int number;           // set once in the constructor
    private double balance;

    public Account(double opening) {   // constructor
        this.balance = opening;
        this.number = ++opened;
    }

    public Account() {                  // overloaded constructor
        this(0);                        // must be the first statement
    }

    public void deposit(double amount) { balance += amount; }   // instance method
    public static int count() { return opened; }                // static method

    @Override
    public String toString() { return "#" + number + ": " + balance; }
}

Account a = new Account(500);           // create an object
a.deposit(100);
int n = Account.count();                // call a static method on the class
`, [
      "Fields default to 0, false or null; local variables have no default.",
      "A static method cannot use this or instance fields directly.",
      "final fields must be assigned exactly once, in their declaration or in every constructor.",
      "Initialisation order: static blocks (once), then for each object: field initialisers and instance blocks, then the constructor body.",
    ]),
    example: ex("A bank account with constructors, this and a static counter", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Account a = new Account("Asha", 5000);
        Account b = new Account("Ravi");
        a.deposit(1500);
        b.deposit(800);
        a.withdraw(2000);
        System.out.println(a);
        System.out.println(b);
        System.out.println("Accounts opened: " + Account.count());
    }
}

class Account {
    private static int opened = 0;
    private final int number;
    private final String owner;
    private double balance;

    Account(String owner, double opening) {
        this.owner = owner;
        this.balance = opening;
        this.number = ++opened;
    }

    Account(String owner) {
        this(owner, 0);          // constructor chaining
    }

    void deposit(double amount) { balance += amount; }

    boolean withdraw(double amount) {
        if (amount > balance) return false;
        balance -= amount;
        return true;
    }

    static int count() { return opened; }

    @Override
    public String toString() { return "#" + number + " " + owner + ": " + balance; }
}
`, code`
#1 Asha: 4500.0
#2 Ravi: 800.0
Accounts opened: 2
`, "Each account has its own balance, but opened is one static field shared by the class, so it both numbers the accounts and counts them. println calls the overridden toString."),
    simple: ex("Fields, default values and a method", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Student s = new Student();
        System.out.println(s.name + " " + s.age + " " + s.active);
        s.name = "Meera";
        s.age = 20;
        s.introduce();
    }
}

class Student {
    String name;
    int age;
    boolean active;

    void introduce() {
        System.out.println("Hi, I am " + name + " and I am " + age);
    }
}
`, code`
null 0 false
Hi, I am Meera and I am 20
`, "With no constructor written, the compiler supplies a default one, and the fields start at their defaults: null, 0 and false."),
    moderate: ex("Initialisation order: static block, instance block, constructor", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        System.out.println("Creating first");
        new Widget("A");
        System.out.println("Creating second");
        new Widget("B");
        System.out.println("Total widgets: " + Widget.total);
    }
}

class Widget {
    static int total;
    static { System.out.println("static block (once)"); }
    { total++; System.out.println("instance block #" + total); }
    Widget(String label) { System.out.println("constructor " + label); }
}
`, code`
Creating first
static block (once)
instance block #1
constructor A
Creating second
instance block #2
constructor B
Total widgets: 2
`, "The static block runs once, when Widget is first used. For every new object the instance block runs before the constructor body."),
    complex: ex("An immutable Fraction with a static factory, equals and hashCode", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Fraction half = Fraction.of(1, 2);
        Fraction third = Fraction.of(1, 3);
        Fraction sum = half.plus(third);
        System.out.println(half + " + " + third + " = " + sum);
        System.out.println("times: " + half.times(third));
        System.out.println("simplified 6/8 = " + Fraction.of(6, 8));
        System.out.println("equal? " + Fraction.of(2, 4).equals(half));
        System.out.println("as decimal: " + sum.toDouble());
        System.out.println("created: " + Fraction.created());
    }
}

final class Fraction {
    private static int created;
    private final int num, den;

    private Fraction(int num, int den) {
        if (den == 0) throw new IllegalArgumentException("denominator is zero");
        int g = gcd(Math.abs(num), Math.abs(den));
        int sign = den < 0 ? -1 : 1;
        this.num = sign * num / g;
        this.den = sign * den / g;
        created++;
    }

    static Fraction of(int num, int den) { return new Fraction(num, den); }
    static int created() { return created; }

    Fraction plus(Fraction o) { return new Fraction(num * o.den + o.num * den, den * o.den); }
    Fraction times(Fraction o) { return new Fraction(num * o.num, den * o.den); }
    double toDouble() { return (double) num / den; }

    private static int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }

    @Override public boolean equals(Object o) {
        return o instanceof Fraction && ((Fraction) o).num == num && ((Fraction) o).den == den;
    }
    @Override public int hashCode() { return 31 * num + den; }
    @Override public String toString() { return num + "/" + den; }
}
`, code`
1/2 + 1/3 = 5/6
times: 1/6
simplified 6/8 = 3/4
equal? true
as decimal: 0.8333333333333334
created: 6
`, "The private constructor forces callers through Fraction.of and always stores the fraction in lowest terms, which is what makes equals work (2/4 becomes 1/2). The class is final with final fields, so every operation returns a new object instead of changing an existing one."),
    assignments: [
      task("Write a Rectangle class with width and height, a constructor that rejects non-positive sizes, and area() and perimeter() methods.", "Validate in the constructor so an invalid Rectangle can never exist.", code`
class Rectangle {
    private final double width, height;
    Rectangle(double width, double height) {
        if (width <= 0 || height <= 0) throw new IllegalArgumentException("sizes must be positive");
        this.width = width;
        this.height = height;
    }
    double area() { return width * height; }
    double perimeter() { return 2 * (width + height); }
}
`),
      task("Explain the difference between this.name = name and this(name) inside a constructor.", "this.name = name assigns the constructor parameter to the object's field; this distinguishes the field from the parameter of the same name. this(name) calls another constructor of the same class, which must be the first statement in the constructor; it is used to avoid repeating initialisation code (constructor chaining)."),
      task("Why can a static method not access an instance field directly? Give an example of the compile error and a fix.", "A static method belongs to the class and runs without any object, so there is no this whose field it could read. static void show() { System.out.println(balance); } fails with 'non-static variable balance cannot be referenced from a static context'. Either make the method an instance method, or pass the object in: static void show(Account a) { System.out.println(a.balance); }."),
    ],
    alternates: [
      alt("A record for a simple data carrier (Java 16+)", "Records generate the constructor, accessors, equals, hashCode and toString for immutable data, removing all the boilerplate of the Fraction-style class when you do not need custom logic.", "Point.java", code`
public record Point(int x, int y) {
    public Point {                         // compact constructor for validation
        if (x < 0 || y < 0) throw new IllegalArgumentException("negative");
    }
    public double distance() { return Math.sqrt(x * x + y * y); }
}
// new Point(3, 4).distance() -> 5.0, and new Point(3, 4).equals(new Point(3, 4)) -> true
`),
      alt("A builder for objects with many optional fields", "When a constructor would need many parameters, a builder makes calls readable and lets you set only what you need.", "Pizza.java", code`
class Pizza {
    private final String size; private final boolean cheese, olives;
    private Pizza(Builder b) { size = b.size; cheese = b.cheese; olives = b.olives; }
    static Builder builder(String size) { return new Builder(size); }
    static class Builder {
        private final String size; private boolean cheese, olives;
        Builder(String size) { this.size = size; }
        Builder cheese() { cheese = true; return this; }
        Builder olives() { olives = true; return this; }
        Pizza build() { return new Pizza(this); }
    }
}
// Pizza p = Pizza.builder("large").cheese().build();
`),
    ],
  },

  "encapsulation-packages": {
    steps: [
      "Encapsulation means hiding an object's internal state and exposing only the operations that keep it valid.",
      "Make fields private, and expose behaviour through public methods; add getters only for what callers need, and setters only when a field may legitimately change.",
      "Validate inside the class (constructor and setters), so an object can never enter an invalid state no matter who calls it.",
      "Return copies or unmodifiable views of internal collections (defensive copying), otherwise callers can change your state behind your back.",
      "Java has four access levels: private (this class only), package-private (no modifier: same package), protected (same package plus subclasses) and public (everyone).",
      "Packages group related classes and form namespaces: package com.shop.billing; at the top of the file, matching folders com/shop/billing on disk.",
      "import brings classes from other packages into scope; java.lang is imported automatically. Since Java 9, modules can additionally hide whole packages from other modules.",
    ],
    syntax: syntax("Employee.java", code`
package com.example.hr;                 // must be the first statement; folder com/example/hr

import java.util.ArrayList;             // one class
import java.util.*;                     // every class in java.util (not sub-packages)
import static java.lang.Math.max;       // static import

public class Employee {
    private double salary;              // hidden state

    public double getSalary() { return salary; }        // read access

    public void setSalary(double salary) {               // controlled write access
        if (salary < 0) throw new IllegalArgumentException("negative salary");
        this.salary = salary;
    }

    void auditLog() { }                 // package-private: only com.example.hr
    protected void onPromotion() { }    // package + subclasses
}
`, [
      "Access levels from most to least restrictive: private, package-private, protected, public.",
      "A top-level class can only be public or package-private.",
      "Fully qualified names (java.util.List) avoid imports and resolve name clashes.",
      "Reverse-domain package names (com.company.project) keep names globally unique.",
    ]),
    example: ex("Private state with validated setters", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Employee e = new Employee("Kiran", 50000);
        e.raiseSalary(10);
        System.out.println(e.getName() + " earns " + e.getSalary());
        try {
            e.setSalary(-5);
        } catch (IllegalArgumentException ex) {
            System.out.println("Rejected: " + ex.getMessage());
        }
        System.out.println("Still " + e.getSalary());
    }
}

class Employee {
    private final String name;
    private double salary;

    Employee(String name, double salary) {
        this.name = name;
        setSalary(salary);              // reuse the validation
    }

    public String getName() { return name; }
    public double getSalary() { return salary; }

    public void setSalary(double salary) {
        if (salary < 0) throw new IllegalArgumentException("salary cannot be negative");
        this.salary = salary;
    }

    public void raiseSalary(double percent) {
        setSalary(salary + salary * percent / 100);
    }
}
`, code`
Kiran earns 55000.0
Rejected: salary cannot be negative
Still 55000.0
`, "Every change to salary goes through setSalary, so the rule 'never negative' lives in one place. name has a getter but no setter because it must never change."),
    simple: ex("private hides the field; methods expose behaviour", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Counter c = new Counter();
        c.increment();
        c.increment();
        System.out.println(c.value());
        // c.count = 100;   // compile error: count has private access in Counter
    }
}

class Counter {
    private int count;
    public void increment() { count++; }
    public int value() { return count; }
}
`, code`
2
`, "Outside code can only increment and read the counter; it cannot set it to an arbitrary number."),
    moderate: ex("Defensive copies and read-only views", "Main.java", code`
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(List.of("Asha", "Ravi"));
        Team team = new Team(names);
        names.add("Intruder");                 // does not affect the team: it was copied in
        System.out.println(team.members());
        try {
            team.members().add("Hacker");      // read-only view
        } catch (UnsupportedOperationException e) {
            System.out.println("Cannot modify members from outside");
        }
        team.join("Meera");
        System.out.println(team.members());
    }
}

class Team {
    private final List<String> members;
    Team(List<String> initial) { this.members = new ArrayList<>(initial); }
    List<String> members() { return Collections.unmodifiableList(members); }
    void join(String name) { if (!members.contains(name)) members.add(name); }
}
`, code`
[Asha, Ravi]
Cannot modify members from outside
[Asha, Ravi, Meera]
`, "A final reference to a mutable list is not enough: the class copies the list it receives and hands out an unmodifiable view, so only join can change the team."),
    complex: ex("An encapsulated shopping cart with rules", "Main.java", code`
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        Cart cart = new Cart();
        cart.add("Keyboard", 1499, 1);
        cart.add("Mouse", 599, 2);
        cart.add("Mouse", 599, 1);
        System.out.println(cart.lines());
        System.out.println("Subtotal: " + cart.subtotal());
        cart.applyCoupon("SAVE10");
        System.out.println("Total after coupon: " + cart.total());
        cart.applyCoupon("BOGUS");
        System.out.println("Items: " + cart.itemCount());
    }
}

class Cart {
    private final List<Line> lines = new ArrayList<>();
    private int discountPercent;

    void add(String product, int price, int qty) {
        if (qty <= 0) throw new IllegalArgumentException("qty must be positive");
        for (Line line : lines) {
            if (line.product.equals(product)) { line.qty += qty; return; }
        }
        lines.add(new Line(product, price, qty));
    }

    void applyCoupon(String code) {
        if ("SAVE10".equals(code)) discountPercent = 10;
        else System.out.println("Unknown coupon " + code + " ignored");
    }

    int subtotal() {
        int sum = 0;
        for (Line line : lines) sum += line.price * line.qty;
        return sum;
    }

    int total() { return subtotal() - subtotal() * discountPercent / 100; }

    int itemCount() {
        int n = 0;
        for (Line line : lines) n += line.qty;
        return n;
    }

    List<String> lines() {
        List<String> out = new ArrayList<>();
        for (Line line : lines) out.add(line.qty + " x " + line.product);
        return Collections.unmodifiableList(out);
    }

    // A private nested class: no one outside Cart even knows lines exist
    private static final class Line {
        final String product;
        final int price;
        int qty;
        Line(String product, int price, int qty) { this.product = product; this.price = price; this.qty = qty; }
    }
}
`, code`
[1 x Keyboard, 3 x Mouse]
Subtotal: 3296
Total after coupon: 2967
Unknown coupon BOGUS ignored
Items: 4
`, "Callers can add items and apply coupons but cannot touch the lines, the prices or the discount directly. Totals are always computed from the current state, so they can never get out of sync."),
    assignments: [
      task("Design a Temperature class that stores degrees Celsius privately, rejects values below absolute zero (-273.15), and offers getCelsius() and getFahrenheit().", "Store one source of truth (Celsius) and derive Fahrenheit, so the two can never disagree.", code`
class Temperature {
    private double celsius;
    Temperature(double celsius) { setCelsius(celsius); }
    double getCelsius() { return celsius; }
    double getFahrenheit() { return celsius * 9 / 5 + 32; }
    void setCelsius(double value) {
        if (value < -273.15) throw new IllegalArgumentException("below absolute zero");
        celsius = value;
    }
}
`),
      task("Class A is in package app.core with a protected method m(). Class B in package app.web extends A. Can B call m()? Can unrelated class C in app.web call new A().m()?", "B can call m() on itself (or on a B), because protected grants access to subclasses in any package. C cannot: it is neither in app.core nor a subclass of A, so new A().m() is a compile error."),
      task("A class returns its private List directly from getItems(). Describe the bug and two ways to fix it.", "Callers receive the same list object and can add, remove or clear items, bypassing every rule the class enforces. Fix 1: return Collections.unmodifiableList(items) (a read-only view). Fix 2: return List.copyOf(items) or new ArrayList<>(items) (a snapshot). Also copy lists received in constructors, for the same reason."),
    ],
    alternates: [
      alt("An immutable class instead of setters", "If an object never changes, there is nothing to protect: no setters, final fields, and 'changes' return new objects. Immutable objects are automatically thread-safe.", "Money.java", code`
public final class Money {
    private final long paise;
    public Money(long paise) {
        if (paise < 0) throw new IllegalArgumentException("negative");
        this.paise = paise;
    }
    public Money plus(Money other) { return new Money(paise + other.paise); }
    public long paise() { return paise; }
}
`),
      alt("Hide whole packages with the module system", "Since Java 9, a module exports only chosen packages; even public classes in other packages are inaccessible to other modules.", "module-info.java", code`
module com.shop.billing {
    exports com.shop.billing.api;        // visible to other modules
    // com.shop.billing.internal is not exported: hidden even though its classes are public
}
`),
    ],
  },

  "inheritance-polymorphism": {
    steps: [
      "Inheritance (class B extends A) lets B reuse and specialise A's fields and methods; Java allows one superclass per class, and every class ultimately extends Object.",
      "A subclass constructor must call a superclass constructor first, explicitly with super(...) or implicitly with the no-argument one.",
      "Overriding replaces an inherited instance method with the same signature; annotate it with @Override so the compiler checks it really overrides something.",
      "Polymorphism: a variable of the superclass type can refer to any subclass object, and the method that runs is chosen at run time from the object's actual class (dynamic dispatch).",
      "Overloading is different: methods with the same name but different parameters, chosen at compile time from the argument types.",
      "Fields and static methods are not polymorphic: they are resolved from the declared type of the variable (static methods are hidden, not overridden).",
      "super.method() calls the parent's version from an override; use instanceof (or pattern matching) before downcasting, and prefer composition when the relationship is not truly 'is-a'.",
    ],
    syntax: syntax("Inheritance.java", code`
class Animal {
    protected final String name;
    Animal(String name) { this.name = name; }
    void speak() { System.out.println(name + " makes a sound"); }
}

class Dog extends Animal {                 // Dog is-an Animal
    Dog(String name) { super(name); }      // call the parent constructor first
    @Override
    void speak() {                          // overriding: same signature
        super.speak();                      // optionally reuse the parent's version
        System.out.println(name + " barks");
    }
}

Animal pet = new Dog("Bruno");             // upcast: always allowed
pet.speak();                               // runs Dog.speak (dynamic dispatch)
if (pet instanceof Dog) {
    Dog d = (Dog) pet;                     // downcast after a check
}
`, [
      "An override cannot reduce visibility or throw broader checked exceptions.",
      "An override may return a subtype of the original return type (covariant return).",
      "final methods cannot be overridden; final classes cannot be extended.",
      "private and static methods are not overridden.",
    ]),
    example: ex("Shapes and dynamic dispatch", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Shape[] shapes = {new Circle(1), new Rectangle(2, 3), new Square(2)};
        for (Shape s : shapes) {
            System.out.printf("%s area = %.2f%n", s.name(), s.area());
        }
    }
}

class Shape {
    String name() { return "Shape"; }
    double area() { return 0; }
}

class Circle extends Shape {
    private final double r;
    Circle(double r) { this.r = r; }
    @Override String name() { return "Circle"; }
    @Override double area() { return Math.PI * r * r; }
}

class Rectangle extends Shape {
    protected final double w, h;
    Rectangle(double w, double h) { this.w = w; this.h = h; }
    @Override String name() { return "Rectangle"; }
    @Override double area() { return w * h; }
}

class Square extends Rectangle {
    Square(double side) { super(side, side); }
    @Override String name() { return "Square"; }
}
`, code`
Circle area = 3.14
Rectangle area = 6.00
Square area = 4.00
`, "The loop only knows it has Shapes, yet each call runs the method of the object's real class. Square inherits Rectangle's area and only overrides name."),
    simple: ex("super(...) and super.method()", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Dog d = new Dog("Bruno");
        d.speak();
    }
}

class Animal {
    protected final String name;
    Animal(String name) {
        this.name = name;
        System.out.println("Animal constructor for " + name);
    }
    void speak() { System.out.println(name + " makes a sound"); }
}

class Dog extends Animal {
    Dog(String name) {
        super(name);
        System.out.println("Dog constructor");
    }
    @Override void speak() {
        super.speak();
        System.out.println(name + " barks");
    }
}
`, code`
Animal constructor for Bruno
Dog constructor
Bruno makes a sound
Bruno barks
`, "Construction runs from the top of the hierarchy down: the Animal part is built before the Dog part."),
    moderate: ex("Overriding versus hiding versus overloading", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.describe());     // overridden: Child's version runs
        System.out.println(p.label);          // fields are not polymorphic
        System.out.println(Parent.kind());    // static methods are hidden, not overridden

        Printer printer = new Printer();
        printer.print(5);
        printer.print(5L);
        printer.print("five");
        printer.print('5');                   // char widens to int
    }
}

class Parent {
    String label = "parent field";
    String describe() { return "Parent.describe"; }
    static String kind() { return "Parent.kind"; }
}

class Child extends Parent {
    String label = "child field";
    @Override String describe() { return "Child.describe"; }
    static String kind() { return "Child.kind"; }
}

class Printer {
    void print(int x) { System.out.println("int " + x); }
    void print(long x) { System.out.println("long " + x); }
    void print(Object x) { System.out.println("Object " + x); }
}
`, code`
Child.describe
parent field
Parent.kind
int 5
long 5
Object five
int 53
`, "Only instance methods use the object's run-time class. The field label and the static method are chosen from the declared type Parent. Overloads are chosen at compile time: '5' is a char, which widens to int (code 53) before it would ever box to Object."),
    complex: ex("A polymorphic payroll with a covariant return", "Main.java", code`
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Employee> staff = new ArrayList<>();
        staff.add(new Employee("Asha", 40000));
        staff.add(new Manager("Ravi", 60000, 15000));
        staff.add(new Intern("Meera", 120, 80));

        int total = 0;
        for (Employee e : staff) {
            System.out.println(e.name + " (" + e.role() + "): " + e.monthlyPay());
            total += e.monthlyPay();
            if (e instanceof Manager) {
                Manager m = (Manager) e;
                System.out.println("  manages a team, bonus " + m.bonus);
            }
        }
        System.out.println("Payroll total: " + total);

        Employee copy = staff.get(1).copy();
        System.out.println("Copy is a " + copy.role() + " named " + copy.name);
    }
}

class Employee {
    final String name;
    final int salary;
    Employee(String name, int salary) { this.name = name; this.salary = salary; }
    String role() { return "Employee"; }
    int monthlyPay() { return salary; }
    Employee copy() { return new Employee(name, salary); }
}

class Manager extends Employee {
    final int bonus;
    Manager(String name, int salary, int bonus) { super(name, salary); this.bonus = bonus; }
    @Override String role() { return "Manager"; }
    @Override int monthlyPay() { return super.monthlyPay() + bonus; }
    @Override Manager copy() { return new Manager(name, salary, bonus); }   // covariant return type
}

class Intern extends Employee {
    final int hours, rate;
    Intern(String name, int hours, int rate) { super(name, 0); this.hours = hours; this.rate = rate; }
    @Override String role() { return "Intern"; }
    @Override int monthlyPay() { return hours * rate; }
}
`, code`
Asha (Employee): 40000
Ravi (Manager): 75000
  manages a team, bonus 15000
Meera (Intern): 9600
Payroll total: 124600
Copy is a Manager named Ravi
`, "The payroll loop never asks what kind of employee it has; each class supplies its own pay rule. Manager.copy may return Manager because a narrower return type still satisfies the parent's contract, and calling copy() through an Employee reference still produces a Manager."),
    assignments: [
      task("Create a Vehicle base class with a method wheels() returning 0, and Car and Bike subclasses overriding it. Print the wheels of an array of vehicles.", "Store the subclasses in a Vehicle[] and let dynamic dispatch pick each override.", code`
class Vehicle { int wheels() { return 0; } }
class Car extends Vehicle { @Override int wheels() { return 4; } }
class Bike extends Vehicle { @Override int wheels() { return 2; } }

for (Vehicle v : new Vehicle[]{new Car(), new Bike()}) System.out.println(v.wheels());
// 4
// 2
`),
      task("Why does Java not allow a class to extend two classes, and how do you get similar reuse?", "With two superclasses, the same method or field could be inherited along two paths (the diamond problem), making behaviour ambiguous. Java allows one superclass but many interfaces; interfaces can carry default methods, and the compiler forces a class to resolve any conflict explicitly. Composition (holding instances of other classes and delegating to them) is the usual alternative."),
      task("What is printed? class A { void hi() { System.out.println(\"A\"); } } class B extends A { void hi() { System.out.println(\"B\"); } }  A a = new B(); a.hi(); ((A) a).hi();", "B is printed twice. Casting a reference does not change the object; dynamic dispatch always calls the override of the object's actual class (B). Only fields and static methods depend on the declared type."),
    ],
    alternates: [
      alt("Composition instead of inheritance", "When the relationship is 'has-a' rather than 'is-a', hold a collaborator and delegate to it. It avoids fragile hierarchies and lets you swap behaviour at run time.", "Car.java", code`
interface Engine { String start(); }
class PetrolEngine implements Engine { public String start() { return "vroom"; } }
class ElectricEngine implements Engine { public String start() { return "hum"; } }

class Car {
    private final Engine engine;                 // has-an Engine
    Car(Engine engine) { this.engine = engine; }
    String start() { return "Car: " + engine.start(); }
}
// new Car(new ElectricEngine()).start() -> "Car: hum"
`),
      alt("Pattern matching for instanceof (Java 16+)", "Test and cast in one step, with the variable in scope only where the test succeeded.", "Payroll.java", code`
for (Employee e : staff) {
    if (e instanceof Manager m) {           // no separate cast line
        System.out.println("bonus " + m.bonus);
    }
}
`),
    ],
  },

  "abstraction-interfaces": {
    steps: [
      "Abstraction exposes what an object does and hides how it does it, so callers depend on a stable contract instead of details.",
      "An abstract class cannot be instantiated; it may hold state, constructors, concrete methods and abstract methods that subclasses must implement.",
      "An interface is a pure contract of methods; a class can implement many interfaces. Interface fields are implicitly public static final constants.",
      "Since Java 8 interfaces can have default methods (with a body, inherited by implementers) and static methods; since Java 9, private helper methods.",
      "If a class inherits the same default method from two interfaces, it must override it and may pick one with InterfaceName.super.method().",
      "A functional interface has exactly one abstract method, so it can be implemented with a lambda or a method reference (@FunctionalInterface checks this).",
      "Choose an abstract class to share state and code among closely related classes; choose an interface to define a capability that unrelated classes can have.",
    ],
    syntax: syntax("Abstraction.java", code`
abstract class Payment {                       // cannot be instantiated
    protected final int amount;
    Payment(int amount) { this.amount = amount; }
    abstract void pay();                        // no body: subclasses must implement
    int fee() { return 0; }                     // concrete method, may be overridden
}

interface Refundable {
    int MAX_DAYS = 30;                          // public static final
    void refund();                              // public abstract
    default String policy() { return "Refund within " + MAX_DAYS + " days"; }
    static boolean allowed(int days) { return days <= MAX_DAYS; }
}

class CardPayment extends Payment implements Refundable {
    CardPayment(int amount) { super(amount); }
    @Override void pay() { System.out.println("card"); }
    @Override public void refund() { System.out.println("refunded"); }
}

@FunctionalInterface
interface Discount { int apply(int price); }    // implementable with a lambda
Discount half = price -> price / 2;
`, [
      "Interface methods are public; implementations must be declared public.",
      "An abstract class may have constructors; an interface may not.",
      "A class extends one class but may implement any number of interfaces.",
      "Make template steps final in the abstract class so subclasses cannot reorder them.",
    ]),
    example: ex("An abstract Payment with a template method", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Payment[] payments = {new UpiPayment(499), new CardPayment(1299)};
        for (Payment p : payments) p.process();
    }
}

abstract class Payment {
    protected final int amount;
    Payment(int amount) { this.amount = amount; }

    // Template method: the steps are fixed here, the details are left to subclasses
    final void process() {
        System.out.println("Validating Rs " + amount);
        pay();
        System.out.println("Receipt sent (" + fee() + " fee)");
    }

    abstract void pay();
    int fee() { return 0; }
}

class UpiPayment extends Payment {
    UpiPayment(int amount) { super(amount); }
    @Override void pay() { System.out.println("Paid via UPI"); }
}

class CardPayment extends Payment {
    CardPayment(int amount) { super(amount); }
    @Override void pay() { System.out.println("Paid by card"); }
    @Override int fee() { return amount * 2 / 100; }
}
`, code`
Validating Rs 499
Paid via UPI
Receipt sent (0 fee)
Validating Rs 1299
Paid by card
Receipt sent (25 fee)
`, "process() is final, so every payment follows the same validate → pay → receipt order; subclasses fill in pay() and optionally fee(). Integer arithmetic gives a 2% fee of 25 on 1299."),
    simple: ex("One class, two interfaces", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        Duck duck = new Duck();
        duck.fly();
        duck.swim();
        System.out.println("Max altitude: " + Flyer.MAX_ALTITUDE);
    }
}

interface Flyer {
    int MAX_ALTITUDE = 1000;        // implicitly public static final
    void fly();
}

interface Swimmer {
    void swim();
}

class Duck implements Flyer, Swimmer {
    public void fly() { System.out.println("Duck flies"); }
    public void swim() { System.out.println("Duck swims"); }
}
`, code`
Duck flies
Duck swims
Max altitude: 1000
`, "Duck takes on two capabilities through two interfaces, something single class inheritance cannot express."),
    moderate: ex("Default and static interface methods, and resolving a conflict", "Main.java", code`
public class Main {
    public static void main(String[] args) {
        SmartLight light = new SmartLight();
        light.turnOn();
        System.out.println(light.status());
        System.out.println(Switchable.describe(light));
    }
}

interface Switchable {
    void turnOn();
    default String status() { return "switchable device"; }
    static String describe(Switchable s) { return "Device: " + s.status(); }
}

interface Connected {
    default String status() { return "connected device"; }
}

class SmartLight implements Switchable, Connected {
    public void turnOn() { System.out.println("Light on"); }

    // Both interfaces supply status(): the class must resolve the conflict
    @Override public String status() {
        return Switchable.super.status() + " + " + Connected.super.status();
    }
}
`, code`
Light on
switchable device + connected device
Device: switchable device + connected device
`, "Without the override the class would not compile. Interface.super.method() calls a specific interface's default implementation."),
    complex: ex("Strategies with functional interfaces and default composition", "Main.java", code`
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, DiscountRule> rules = new LinkedHashMap<>();
        rules.put("none", price -> price);
        rules.put("flat100", price -> Math.max(0, price - 100));
        rules.put("festive", new PercentOff(20));
        rules.put("festive+flat", rules.get("festive").andThen(rules.get("flat100")));

        int price = 2500;
        for (Map.Entry<String, DiscountRule> e : rules.entrySet()) {
            System.out.println(e.getKey() + " -> " + e.getValue().apply(price));
        }

        List<Notifier> channels = new ArrayList<>();
        channels.add(new EmailNotifier());
        channels.add(message -> System.out.println("SMS: " + message));   // a lambda is a Notifier too
        for (Notifier n : channels) n.send("Order shipped");
    }
}

@FunctionalInterface
interface DiscountRule {
    int apply(int price);

    default DiscountRule andThen(DiscountRule next) {
        return price -> next.apply(apply(price));
    }
}

class PercentOff implements DiscountRule {
    private final int percent;
    PercentOff(int percent) { this.percent = percent; }
    public int apply(int price) { return price - price * percent / 100; }
}

interface Notifier { void send(String message); }

class EmailNotifier implements Notifier {
    public void send(String message) { System.out.println("Email: " + message); }
}
`, code`
none -> 2500
flat100 -> 2400
festive -> 2000
festive+flat -> 1900
Email: Order shipped
SMS: Order shipped
`, "Rules are interchangeable strategies behind one interface, written as lambdas or classes. The default andThen method composes two rules into a new one without either rule knowing about the other."),
    assignments: [
      task("Create an abstract class Shape with an abstract area() and a concrete describe() that prints the area. Implement Circle and Square.", "describe() can call area() even though it is abstract: the subclass supplies the body at run time.", code`
abstract class Shape {
    abstract double area();
    void describe() { System.out.printf("%s with area %.1f%n", getClass().getSimpleName(), area()); }
}
class Circle extends Shape { double r = 1; double area() { return Math.PI * r * r; } }
class Square extends Shape { double s = 2; double area() { return s * s; } }
// new Circle().describe() -> Circle with area 3.1
// new Square().describe() -> Square with area 4.0
`),
      task("List four differences between an abstract class and an interface in modern Java.", "1. A class extends one abstract class but can implement many interfaces. 2. Abstract classes can have instance fields and constructors; interfaces can only have constants. 3. Abstract class members can have any access level; interface methods are public (private helpers aside). 4. Abstract classes model an 'is-a' family sharing code and state; interfaces model a capability ('can-do') that unrelated classes can share."),
      task("Write a functional interface Validator with boolean validate(String s) and a default method and(Validator other). Use it to check that a username is not empty and at most 12 characters.", "The default method returns a new lambda that requires both validators to pass.", code`
@FunctionalInterface
interface Validator {
    boolean validate(String s);
    default Validator and(Validator other) { return s -> validate(s) && other.validate(s); }
}
Validator notEmpty = s -> !s.isEmpty();
Validator shortEnough = s -> s.length() <= 12;
Validator username = notEmpty.and(shortEnough);
System.out.println(username.validate("asha_dev"));   // true
System.out.println(username.validate(""));           // false
`),
    ],
    alternates: [
      alt("Sealed interfaces to close the hierarchy (Java 17+)", "When only known implementations should exist, sealed lists them; the compiler can then check that a switch covers every case.", "Payment.java", code`
sealed interface Payment permits Upi, Card {}
record Upi(int amount) implements Payment {}
record Card(int amount, int fee) implements Payment {}

static String describe(Payment p) {
    return switch (p) {
        case Upi u -> "UPI " + u.amount();
        case Card c -> "Card " + c.amount() + " + fee " + c.fee();
    };
}
`),
      alt("Built-in functional interfaces instead of custom ones", "java.util.function already has Function, Predicate, Supplier and more, with composition methods built in.", "Discounts.java", code`
import java.util.function.UnaryOperator;

UnaryOperator<Integer> festive = price -> price - price * 20 / 100;
UnaryOperator<Integer> flat100 = price -> Math.max(0, price - 100);
System.out.println(festive.andThen(flat100).apply(2500));   // 1900
`),
    ],
  },

  "object-methods-enums": {
    steps: [
      "Every class inherits from java.lang.Object, which provides equals, hashCode, toString, getClass, clone, finalize (deprecated) and the wait/notify methods.",
      "toString should return a readable description; println and string concatenation call it automatically.",
      "equals defines logical equality; it must be reflexive, symmetric, transitive, consistent and return false for null.",
      "If you override equals you must override hashCode so that equal objects have equal hash codes; otherwise HashMap and HashSet lose your objects.",
      "An immutable class is final, has private final fields, no setters, and copies any mutable data it receives or returns.",
      "An enum is a type with a fixed set of constants; each constant is a singleton object that can carry fields, constructors and even per-constant method bodies. values(), valueOf(), ordinal() and name() come for free.",
      "Nested classes: a static nested class does not need an outer instance; an inner class does (outer.new Inner()); local and anonymous classes are declared inside a method and can capture effectively final variables.",
    ],
    syntax: syntax("ObjectMethods.java", code`
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Point)) return false;
    Point p = (Point) o;
    return x == p.x && y == p.y;
}
@Override public int hashCode() { return java.util.Objects.hash(x, y); }
@Override public String toString() { return "Point(" + x + ", " + y + ")"; }

enum Planet {
    MERCURY(3.303e+23), EARTH(5.976e+24);       // constants call the constructor
    private final double mass;
    Planet(double mass) { this.mass = mass; }   // implicitly private
    double mass() { return mass; }
}

class Outer {
    static class Nested { }                      // new Outer.Nested()
    class Inner { }                              // outer.new Inner()
}
Runnable r = new Runnable() {                    // anonymous class
    public void run() { System.out.println("run"); }
};
`, [
      "Use Objects.equals and Objects.hash to handle nulls safely.",
      "Enums can be used in switch, and EnumMap and EnumSet are the fastest maps and sets for enum keys.",
      "Compare enums with ==; each constant is a single instance.",
      "Records (Java 16+) generate equals, hashCode and toString for you.",
    ]),
    example: ex("equals and hashCode make HashSet work", "Main.java", code`
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class Main {
    public static void main(String[] args) {
        Set<Point> points = new HashSet<>();
        points.add(new Point(1, 2));
        points.add(new Point(1, 2));      // equal to the first: not added again
        points.add(new Point(3, 4));
        System.out.println(points.size());
        System.out.println(new Point(1, 2).equals(new Point(1, 2)));
        System.out.println(new Point(5, 6));
    }
}

final class Point {
    private final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }

    @Override public int hashCode() { return Objects.hash(x, y); }
    @Override public String toString() { return "Point(" + x + ", " + y + ")"; }
}
`, code`
2
true
Point(5, 6)
`, "HashSet first compares hash codes and then calls equals; because both are based on x and y, the duplicate point is recognised and the set keeps only two elements."),
    simple: ex("Enum basics", "Main.java", code`
public class Main {
    enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }

    public static void main(String[] args) {
        Day today = Day.SAT;
        System.out.println(today + " is day number " + (today.ordinal() + 1));
        System.out.println(Day.valueOf("FRI").compareTo(Day.MON));
        switch (today) {
            case SAT:
            case SUN:
                System.out.println("Weekend");
                break;
            default:
                System.out.println("Weekday");
        }
        System.out.println(Day.values().length + " days");
    }
}
`, code`
SAT is day number 6
4
Weekend
7 days
`, "ordinal() is the zero-based position, and enums compare by declaration order. Inside a switch on an enum, the cases use the bare constant names."),
    moderate: ex("An enum with fields and per-constant behaviour", "Main.java", code`
public class Main {
    enum Operation {
        ADD("+") { int apply(int a, int b) { return a + b; } },
        SUBTRACT("-") { int apply(int a, int b) { return a - b; } },
        MULTIPLY("*") { int apply(int a, int b) { return a * b; } };

        private final String symbol;
        Operation(String symbol) { this.symbol = symbol; }
        abstract int apply(int a, int b);
        String symbol() { return symbol; }
    }

    public static void main(String[] args) {
        for (Operation op : Operation.values()) {
            System.out.println("12 " + op.symbol() + " 4 = " + op.apply(12, 4));
        }
    }
}
`, code`
12 + 4 = 16
12 - 4 = 8
12 * 4 = 48
`, "Each constant is an object with its own symbol and its own body for the abstract apply method, which replaces a switch statement on the operation."),
    complex: ex("Immutable objects, inner and anonymous classes, and EnumMap", "Main.java", code`
import java.util.EnumMap;
import java.util.Map;

public class Main {
    enum Status { PLACED, PACKED, SHIPPED, DELIVERED }

    // Immutable value class: final class, final fields, no setters; changes return new objects
    static final class Order {
        private final int id;
        private final Status status;
        Order(int id, Status status) { this.id = id; this.status = status; }
        Order advance() {
            Status[] all = Status.values();
            return status.ordinal() + 1 < all.length ? new Order(id, all[status.ordinal() + 1]) : this;
        }
        @Override public String toString() { return "Order#" + id + "[" + status + "]"; }
    }

    // Inner (non-static) class: each Tracker belongs to a Main instance
    class Tracker {
        int updates;
        void log(Order o) { updates++; System.out.println("update " + updates + ": " + o); }
    }

    public static void main(String[] args) {
        Order order = new Order(7, Status.PLACED);
        Tracker tracker = new Main().new Tracker();
        Map<Status, Integer> seen = new EnumMap<>(Status.class);
        for (int i = 0; i < 4; i++) {
            tracker.log(order);
            seen.merge(order.status, 1, Integer::sum);
            order = order.advance();
        }
        System.out.println(seen);

        Runnable done = new Runnable() {          // anonymous class
            @Override public void run() { System.out.println("Anonymous class says: delivered!"); }
        };
        done.run();
    }
}
`, code`
update 1: Order#7[PLACED]
update 2: Order#7[PACKED]
update 3: Order#7[SHIPPED]
update 4: Order#7[DELIVERED]
{PLACED=1, PACKED=1, SHIPPED=1, DELIVERED=1}
Anonymous class says: delivered!
`, "advance() never modifies an Order; it returns a new one (or the same one at the final state). An inner class needs an instance of its outer class, hence new Main().new Tracker(). EnumMap keeps keys in declaration order."),
    assignments: [
      task("Write a class Book(isbn, title) where two books are equal when their ISBNs match, and prove it works as a HashMap key.", "Base both equals and hashCode on the ISBN only.", code`
final class Book {
    final String isbn, title;
    Book(String isbn, String title) { this.isbn = isbn; this.title = title; }
    @Override public boolean equals(Object o) { return o instanceof Book && ((Book) o).isbn.equals(isbn); }
    @Override public int hashCode() { return isbn.hashCode(); }
}
java.util.Map<Book, Integer> stock = new java.util.HashMap<>();
stock.put(new Book("978-1", "Java"), 5);
System.out.println(stock.get(new Book("978-1", "Java, 2nd print")));   // 5
`),
      task("Create an enum TrafficLight with RED, GREEN and YELLOW, each knowing its duration in seconds and the next light.", "Store the duration in a field; compute the next light from the ordinal so the cycle wraps around.", code`
enum TrafficLight {
    RED(30), GREEN(25), YELLOW(5);
    final int seconds;
    TrafficLight(int seconds) { this.seconds = seconds; }
    TrafficLight next() { return values()[(ordinal() + 1) % values().length]; }
}
// TrafficLight.YELLOW.next() -> RED
`),
      task("What goes wrong if a class overrides equals but not hashCode, and how would you notice it?", "Two equal objects will usually have different (identity-based) hash codes, so a HashMap or HashSet looks in the wrong bucket: contains() returns false for an equal object, get() returns null and duplicates appear in sets. You notice it as 'missing' entries that you can see when printing the collection."),
    ],
    alternates: [
      alt("A record generates equals, hashCode and toString", "For immutable data classes, a record (Java 16+) replaces all the hand-written methods.", "Point.java", code`
record Point(int x, int y) {}
// new Point(1, 2).equals(new Point(1, 2)) -> true
// new Point(5, 6).toString()             -> "Point[x=5, y=6]"
`),
      alt("Map an enum to behaviour with a lambda field", "Instead of constant-specific bodies, pass a lambda to each constant's constructor.", "Operation.java", code`
import java.util.function.IntBinaryOperator;

enum Operation {
    ADD("+", (a, b) -> a + b), MULTIPLY("*", (a, b) -> a * b);
    final String symbol;
    private final IntBinaryOperator op;
    Operation(String symbol, IntBinaryOperator op) { this.symbol = symbol; this.op = op; }
    int apply(int a, int b) { return op.applyAsInt(a, b); }
}
`),
    ],
  },
};
