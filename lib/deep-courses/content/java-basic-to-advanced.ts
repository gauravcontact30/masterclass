import type { DeepCourse } from "../types";
import { DEEP_COURSES } from "../index";
import { code, file, mcq, qa } from "./helpers";

export const COURSE: DeepCourse = {
  ...DEEP_COURSES.find(course => course.id === "java-basic-to-advanced")!,
  intro: [
    "A guided path for complete beginners who want to become job-ready Java developers. Each stage builds on the last: first programs and problem solving, object-oriented design through small projects, the intermediate APIs used daily at work, the modern language features of Java 17 and 21, and finally the professional toolkit — builds, tests, design patterns and performance.",
    "Where the Core Java course explains the language rules in depth, this path focuses on applying them: every topic includes a runnable multi-file example and interview/exam questions. Use Java 21 (LTS) to run everything here.",
  ],
  topics: [
    {
      id: "setup-first-program", module: "Stage 1 · Getting started", title: "Setting up Java and writing your first programs", level: "Beginner", minutes: 14,
      summary: "Installing a JDK, choosing an IDE, project layout, comments and naming conventions, and reading input with Scanner.",
      description: [
        "Install a Java Development Kit — Eclipse Temurin, Oracle JDK or Amazon Corretto, version 21 — then check it with java -version and javac -version. An IDE such as IntelliJ IDEA Community, VS Code with the Java extension pack, or Eclipse compiles as you type, highlights errors and runs programs with one click. Beginners benefit from also compiling once on the command line to understand what the IDE does.",
        "A Java program is made of classes; execution starts in public static void main(String[] args). Statements end with semicolons and blocks use braces. Comments are // single line, /* multi-line */ and /** Javadoc */ which generates documentation.",
        "Naming conventions are not enforced by the compiler but are universal: classes in PascalCase (StudentRecord), methods and variables in camelCase (totalMarks), constants in UPPER_SNAKE_CASE (MAX_SIZE), packages in lowercase reverse-domain form (com.example.school).",
        "java.util.Scanner reads keyboard input: nextInt, nextDouble, next (one word) and nextLine (whole line). Mixing nextInt with nextLine leaves the newline in the buffer — call an extra nextLine() after numbers. For output, System.out.println prints a line and System.out.printf / String.format produce formatted text (%d, %.2f, %s, %n).",
      ],
      usage: [
        "Set up one folder per project with src/ for code; later Maven or Gradle will standardize this.",
        "Use jshell to try out single statements while learning.",
        "Write small console programs (calculators, unit converters, grade calculators) to practise input and output.",
        "Commit your practice code to Git from day one.",
      ],
      files: [
        file("src/Welcome.java", code`
/**
 * First program: reads a name and an age, then prints a formatted message.
 */
import java.util.Scanner;

public class Welcome {
    static final int VOTING_AGE = 18;          // constant: UPPER_SNAKE_CASE

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);

        System.out.print("Your name: ");
        String fullName = in.nextLine();       // reads the whole line, spaces included

        System.out.print("Your age: ");
        int age = in.nextInt();
        in.nextLine();                         // consume the leftover newline

        System.out.print("Your city: ");
        String city = in.nextLine();

        // printf: %s string, %d integer, %n platform newline
        System.out.printf("Hello %s from %s!%n", fullName, city);
        System.out.println(age >= VOTING_AGE ? "You can vote." : "You can vote in " + (VOTING_AGE - age) + " year(s).");
        in.close();
    }
}`),
        file("src/TemperatureConverter.java", code`
import java.util.Scanner;

public class TemperatureConverter {
    public static void main(String[] args) {
        try (Scanner in = new Scanner(System.in)) {          // closes automatically
            System.out.print("Temperature in Celsius: ");
            double celsius = in.nextDouble();
            double fahrenheit = celsius * 9 / 5 + 32;
            double kelvin = celsius + 273.15;
            System.out.printf("%.1f °C = %.1f °F = %.2f K%n", celsius, fahrenheit, kelvin);
        }
    }
}`),
        file("terminal.txt", code`
$ java -version
openjdk version "21.0.5" 2024-10-15 LTS

$ javac -d out src/Welcome.java
$ java -cp out Welcome
Your name: Asha Verma
Your age: 17
Your city: Pune
Hello Asha Verma from Pune!
You can vote in 1 year(s).

$ java src/TemperatureConverter.java      # Java 11+: run a single file without javac
Temperature in Celsius: 37
37.0 °C = 98.6 °F = 310.15 K`),
      ],
      tips: [
        "Read compiler errors from the first one; “cannot find symbol” usually means a typo or a missing import.",
        "Java is case-sensitive: String and string are different (only the first exists).",
        "Prefer printf with %.2f over printing raw doubles when showing money or measurements.",
        "Keep one public class per file, named exactly like the file.",
      ],
      subjective: [
        qa("What are Java naming conventions? Why follow them?", "Classes and interfaces: PascalCase nouns (BankAccount, Comparable). Methods: camelCase verbs (calculateTotal). Variables: camelCase nouns (studentCount). Constants: UPPER_SNAKE_CASE (MAX_USERS). Packages: all lowercase, reverse domain (com.company.app). Following them makes code readable to every Java developer, lets tools and frameworks rely on patterns (JavaBean getters), and avoids confusion between types and variables."),
        qa("What is the problem when nextLine() is called after nextInt()?", "nextInt() reads only the digits and leaves the newline character typed by the user in the input buffer. The following nextLine() immediately consumes that leftover newline and returns an empty string, so the program seems to skip the input. Fix it by calling an extra in.nextLine() after nextInt(), or by reading every line with nextLine() and parsing it with Integer.parseInt."),
      ],
      objective: [
        mcq("Which command shows the installed Java compiler version?", ["java -v", "javac -version", "jdk --version", "jvm -version"], 1, "javac -version (java -version shows the runtime)."),
        mcq("Which Scanner method reads an entire line including spaces?", ["next()", "nextLine()", "nextWord()", "read()"], 1, "next() stops at whitespace."),
        mcq("Correct naming for a constant:", ["maxSize", "MaxSize", "MAX_SIZE", "max_size"], 2, "UPPER_SNAKE_CASE."),
        mcq("Which comment style is used to generate API documentation?", ["//", "/* */", "/** */", "#"], 2, "Javadoc comments."),
      ],
    },
    {
      id: "methods-recursion", module: "Stage 1 · Getting started", title: "Methods, parameters, varargs and recursion", level: "Beginner", minutes: 16,
      summary: "Breaking programs into methods, return values, overloading, varargs, variable scope, and thinking recursively.",
      description: [
        "A method is a named block of code that performs one task: modifiers, return type, name, parameters and body — static int square(int n) { return n * n; }. Methods make code reusable, testable and readable. A void method returns nothing; any other method must return a value of its declared type on every path.",
        "Parameters receive copies of the arguments (Java is pass-by-value). Overloading lets methods share a name with different parameter lists. Varargs (int... numbers) accept zero or more arguments and behave as an array inside the method; a varargs parameter must be last.",
        "Scope: a local variable exists from its declaration to the end of its block; parameters are local to the method; fields belong to the object or class. Two variables with the same name cannot coexist in overlapping local scopes.",
        "Recursion is a method calling itself on a smaller input until a base case. Classic beginner examples are factorial, Fibonacci, sum of digits, power, binary search and reversing a string. Every recursive call uses stack space, so a missing base case ends in StackOverflowError; very deep recursion is better written with a loop.",
      ],
      usage: [
        "Extract a method whenever a block has a clear name or is repeated.",
        "Keep methods short (often under 20 lines) and focused on one job.",
        "Use varargs for convenience APIs like max(int... values) or String.format.",
        "Use recursion for naturally recursive problems: trees, divide and conquer, backtracking.",
      ],
      files: [
        file("src/MathUtils.java", code`
public final class MathUtils {
    private MathUtils() { }                         // utility class: no instances

    public static int max(int first, int... rest) { // varargs: at least one argument required by design
        int best = first;
        for (int x : rest) best = Math.max(best, x);
        return best;
    }

    public static double average(double... values) {
        if (values.length == 0) return 0;
        double sum = 0;
        for (double v : values) sum += v;
        return sum / values.length;
    }

    // Overloads
    public static int area(int side) { return side * side; }
    public static int area(int length, int width) { return length * width; }

    public static boolean isPrime(int n) {
        if (n < 2) return false;
        for (int d = 2; (long) d * d <= n; d++) if (n % d == 0) return false;   // only up to sqrt(n)
        return true;
    }
}`),
        file("src/Recursion.java", code`
public class Recursion {
    static long factorial(int n) {
        if (n <= 1) return 1;                // base case
        return n * factorial(n - 1);         // recursive case: smaller input
    }

    static int sumDigits(int n) { return n < 10 ? n : n % 10 + sumDigits(n / 10); }

    static long power(long base, int exp) {  // fast exponentiation: O(log exp)
        if (exp == 0) return 1;
        long half = power(base, exp / 2);
        return exp % 2 == 0 ? half * half : half * half * base;
    }

    static String reverse(String s) { return s.isEmpty() ? s : reverse(s.substring(1)) + s.charAt(0); }

    static void hanoi(int n, char from, char to, char via) {
        if (n == 0) return;
        hanoi(n - 1, from, via, to);
        System.out.println("Move disk " + n + " " + from + " -> " + to);
        hanoi(n - 1, via, to, from);
    }

    public static void main(String[] args) {
        System.out.println(factorial(10) + " " + sumDigits(9875) + " " + power(2, 30) + " " + reverse("recursion"));
        hanoi(3, 'A', 'C', 'B');             // 2^3 - 1 = 7 moves
        System.out.println(MathUtils.max(4, 9, 2) + " " + MathUtils.average(90, 80, 70) + " " + MathUtils.isPrime(97));
    }
}`),
      ],
      tips: [
        "A method should either do something (command) or answer something (query) — not both.",
        "Write the base case first when coding recursion.",
        "factorial(21) overflows long; use BigInteger for very large results.",
        "Static methods can be called without objects; instance methods need an object — the classic “non-static method cannot be referenced from a static context” error.",
      ],
      subjective: [
        qa("What are varargs? State their rules.", "Varargs (variable-length arguments), written as Type... name, let a method accept zero or more arguments of a type; inside the method the parameter is an array. Rules: only one varargs parameter per method, it must be the last parameter, and overloads with varargs are considered only after fixed-arity matches fail, which can cause ambiguity. Examples: String.format(String, Object...), Arrays.asList(T...)."),
        qa("Write a recursive method to compute the n-th Fibonacci number and comment on its efficiency.", "long fib(int n) { if (n < 2) return n; return fib(n - 1) + fib(n - 2); } It is correct but exponential, O(2ⁿ), because the same values are recomputed repeatedly (fib(n−2) is computed by both fib(n) and fib(n−1)). Memoization (caching results in an array) or an iterative loop with two variables reduces it to O(n) time; the iterative version uses O(1) space."),
      ],
      objective: [
        mcq("Where must a varargs parameter appear?", ["First", "Last", "Anywhere", "Only alone"], 1, "It must be the last parameter."),
        mcq("A recursive method with no base case leads to:", ["Compile error", "StackOverflowError", "OutOfMemoryError: heap", "It returns 0"], 1, "The call stack is exhausted."),
        mcq("Which is a valid overload of int add(int a, int b)?", ["long add(int a, int b)", "int add(int x, int y)", "int add(int a, int b, int c)", "void add(int a, int b)"], 2, "Parameter lists must differ."),
        mcq("Number of moves to solve Tower of Hanoi with n disks:", ["n²", "2ⁿ − 1", "n!", "2n"], 1, "Minimum moves."),
      ],
    },
    {
      id: "problem-solving-arrays-strings", module: "Stage 1 · Getting started", title: "Problem solving with arrays, strings and matrices", level: "Beginner", minutes: 18,
      summary: "Practice patterns every beginner needs: searching, counting, reversing, frequency tables, palindromes, anagrams and 2-D matrix operations.",
      description: [
        "Most beginner programming exercises and many campus coding tests reduce to a few patterns on arrays and strings: traverse and accumulate (sum, min, max, average), search (linear search, second largest), count (frequency of each element or character using an int[26] or a HashMap), transform in place (reverse, rotate, move zeros to the end) and compare (palindrome, anagram).",
        "Strings are immutable; convert to char[] (toCharArray) when you need to modify characters, then build a new String. StringBuilder.reverse(), Character.isLetterOrDigit, Character.toLowerCase and String.chars() are useful helpers.",
        "Two-dimensional arrays model grids and matrices: int[rows][cols]. Typical exercises: matrix addition and multiplication (the inner dimension must match; three nested loops), transpose, row and column sums, diagonal sums, spiral traversal and searching a sorted matrix.",
        "Approach for any problem: restate it with an example, write the brute-force solution, check edge cases (empty input, one element, duplicates, negatives), then improve. Dry-run your code on paper with a small input before running it.",
      ],
      usage: [
        "Warm-up for placement tests (HackerRank, CodeChef, LeetCode easy problems).",
        "Text processing: word counts, validating passwords, cleaning input.",
        "Matrix code appears in image processing, games (tic-tac-toe boards) and scientific computing.",
        "Build confidence before data structures and algorithms.",
      ],
      files: [
        file("src/ArrayPractice.java", code`
import java.util.Arrays;

public class ArrayPractice {
    static int secondLargest(int[] a) {
        int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
        for (int x : a) {
            if (x > first) { second = first; first = x; }
            else if (x > second && x != first) second = x;
        }
        return second;
    }

    static void moveZerosToEnd(int[] a) {          // keeps the order of non-zeros
        int write = 0;
        for (int x : a) if (x != 0) a[write++] = x;
        while (write < a.length) a[write++] = 0;
    }

    static void reverse(int[] a) {
        for (int i = 0, j = a.length - 1; i < j; i++, j--) { int t = a[i]; a[i] = a[j]; a[j] = t; }
    }

    static int[] frequency(int[] a, int maxValue) {
        int[] count = new int[maxValue + 1];
        for (int x : a) count[x]++;
        return count;
    }

    public static void main(String[] args) {
        int[] marks = {45, 92, 78, 92, 60, 0, 85, 0};
        System.out.println("Second largest: " + secondLargest(marks));          // 85
        moveZerosToEnd(marks);
        System.out.println(Arrays.toString(marks));
        reverse(marks);
        System.out.println(Arrays.toString(marks));
        System.out.println(Arrays.toString(frequency(new int[]{1, 3, 3, 0, 1, 3}, 3)));   // [1, 2, 0, 3]
    }
}`),
        file("src/StringPractice.java", code`
import java.util.Arrays;

public class StringPractice {
    static boolean isPalindrome(String s) {         // ignores case and non-alphanumerics
        int i = 0, j = s.length() - 1;
        while (i < j) {
            while (i < j && !Character.isLetterOrDigit(s.charAt(i))) i++;
            while (i < j && !Character.isLetterOrDigit(s.charAt(j))) j--;
            if (Character.toLowerCase(s.charAt(i++)) != Character.toLowerCase(s.charAt(j--))) return false;
        }
        return true;
    }

    static boolean isAnagram(String a, String b) {
        if (a.length() != b.length()) return false;
        int[] count = new int[26];
        for (int k = 0; k < a.length(); k++) { count[a.charAt(k) - 'a']++; count[b.charAt(k) - 'a']--; }
        for (int c : count) if (c != 0) return false;
        return true;
    }

    static String capitalizeWords(String sentence) {
        StringBuilder sb = new StringBuilder();
        for (String word : sentence.trim().split("\\s+"))
            sb.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1).toLowerCase()).append(' ');
        return sb.toString().trim();
    }

    static int vowels(String s) { return (int) s.toLowerCase().chars().filter(c -> "aeiou".indexOf(c) >= 0).count(); }

    public static void main(String[] args) {
        System.out.println(isPalindrome("A man, a plan, a canal: Panama"));   // true
        System.out.println(isAnagram("listen", "silent"));                     // true
        System.out.println(capitalizeWords("  java   is FUN  "));              // Java Is Fun
        System.out.println(vowels("Programming in Java"));                     // 6
        char[] letters = "dcba".toCharArray();
        Arrays.sort(letters);
        System.out.println(new String(letters));                               // abcd
    }
}`),
        file("src/MatrixPractice.java", code`
public class MatrixPractice {
    static int[][] multiply(int[][] a, int[][] b) {
        if (a[0].length != b.length) throw new IllegalArgumentException("columns of A must equal rows of B");
        int[][] c = new int[a.length][b[0].length];
        for (int i = 0; i < a.length; i++)
            for (int j = 0; j < b[0].length; j++)
                for (int k = 0; k < b.length; k++)
                    c[i][j] += a[i][k] * b[k][j];
        return c;
    }

    static int[][] transpose(int[][] m) {
        int[][] t = new int[m[0].length][m.length];
        for (int i = 0; i < m.length; i++) for (int j = 0; j < m[0].length; j++) t[j][i] = m[i][j];
        return t;
    }

    static void printSpiral(int[][] m) {
        int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; j++) System.out.print(m[top][j] + " ");
            top++;
            for (int i = top; i <= bottom; i++) System.out.print(m[i][right] + " ");
            right--;
            if (top <= bottom) { for (int j = right; j >= left; j--) System.out.print(m[bottom][j] + " "); bottom--; }
            if (left <= right) { for (int i = bottom; i >= top; i--) System.out.print(m[i][left] + " "); left++; }
        }
        System.out.println();
    }

    public static void main(String[] args) {
        int[][] a = {{1, 2, 3}, {4, 5, 6}};
        int[][] b = {{7, 8}, {9, 10}, {11, 12}};
        System.out.println(java.util.Arrays.deepToString(multiply(a, b)));   // [[58, 64], [139, 154]]
        System.out.println(java.util.Arrays.deepToString(transpose(a)));
        printSpiral(new int[][]{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}});           // 1 2 3 6 9 8 7 4 5
    }
}`),
      ],
      tips: [
        "Initialize max with the first element (or Integer.MIN_VALUE), never with 0 — inputs can be negative.",
        "Use char - 'a' to map lowercase letters to indexes 0–25.",
        "Matrix multiplication of (m×n) by (n×p) gives (m×p) and costs O(m·n·p).",
        "Always test the empty array and single-element cases.",
      ],
      subjective: [
        qa("Write logic to check whether two strings are anagrams and give its complexity.", "Two strings are anagrams if they contain the same characters with the same frequencies. If lengths differ, return false. Otherwise use an int[26] counter (for lowercase letters): increment for each character of the first string and decrement for each of the second; finally, all counts must be zero. Time O(n), space O(1) for a fixed alphabet. Alternatively sort both character arrays and compare them — O(n log n)."),
        qa("What is the condition for multiplying two matrices and how many multiplications are required?", "Matrix A (m × n) can be multiplied by B (p × q) only if n = p, i.e. the number of columns of A equals the number of rows of B. The result is m × q, and each of its m·q elements needs n multiplications, so m·n·q multiplications in total — O(n³) for square matrices with the naive algorithm."),
      ],
      objective: [
        mcq("Result dimensions of multiplying a 2×3 matrix by a 3×4 matrix:", ["3×3", "2×4", "4×2", "Not possible"], 1, "Rows of A by columns of B."),
        mcq("'c' - 'a' evaluates to:", ["'c'", "2", "99", "Compile error"], 1, "Characters are numeric (UTF-16 code units)."),
        mcq("Best initial value for finding the maximum of an int array that may contain negatives:", ["0", "-1", "The first element", "100"], 2, "Integer.MIN_VALUE also works."),
        mcq("Which method converts a String into a modifiable character array?", ["getChars()", "toCharArray()", "split(\"\")", "chars()"], 1, "Returns a new char[]."),
      ],
    },
    {
      id: "oop-project", module: "Stage 2 · Object-oriented programming in practice", title: "Designing a small application with OOP: library management", level: "Intermediate", minutes: 22,
      summary: "Turning requirements into classes, choosing responsibilities, using inheritance and interfaces, and keeping the domain consistent.",
      description: [
        "Object-oriented design starts from the problem, not the syntax. Underline the nouns in the requirements (book, member, loan, library) as candidate classes and the verbs (borrow, return, search, charge fine) as candidate methods. Give each class one responsibility and let objects collaborate by calling each other's methods.",
        "Encapsulation keeps the rules close to the data: a Book knows whether it is available; a Library is the only place that creates loans, so it can enforce the borrowing limit. Inheritance captures genuine is-a relationships (StudentMember and FacultyMember are Members with different limits and fine rates) and polymorphism lets the library treat them uniformly. Interfaces describe capabilities (Searchable, FinePolicy) that unrelated classes can implement.",
        "Composition — objects holding other objects — is the most common relationship: a Library has a collection of books and members; a Loan has a book, a member and dates. Prefer it over inheritance when the relationship is has-a. Records are ideal for small immutable values such as a Loan receipt.",
        "This topic's code is a complete multi-file console project. Read Library.java first, then follow how Member subclasses and the FinePolicy interface plug into it.",
      ],
      usage: [
        "Mini projects for practice and portfolios: library, banking, hotel booking, student result system, inventory.",
        "Model the domain in plain Java first; frameworks (Spring, JPA) can be added later.",
        "Write the main flow as a few method calls that read like the requirements.",
        "Use enums for fixed categories (Genre, MemberType) and records for value objects.",
      ],
      files: [
        file("src/library/Book.java", code`
package library;

public class Book {
    public enum Genre { FICTION, SCIENCE, TECHNOLOGY, HISTORY }

    private final String isbn;
    private final String title;
    private final String author;
    private final Genre genre;
    private boolean available = true;

    public Book(String isbn, String title, String author, Genre genre) {
        this.isbn = isbn; this.title = title; this.author = author; this.genre = genre;
    }

    void markBorrowed() {                                   // package-private: only Library changes availability
        if (!available) throw new IllegalStateException(title + " is already borrowed");
        available = false;
    }
    void markReturned() { available = true; }

    public String isbn() { return isbn; }
    public String title() { return title; }
    public String author() { return author; }
    public Genre genre() { return genre; }
    public boolean isAvailable() { return available; }

    @Override public String toString() { return title + " by " + author + (available ? "" : " (on loan)"); }
}`),
        file("src/library/Member.java", code`
package library;

public abstract class Member {
    private final String id;
    private final String name;

    protected Member(String id, String name) { this.id = id; this.name = name; }

    public abstract int maxBooks();                         // each kind of member has its own limit
    public abstract int loanDays();
    public FinePolicy finePolicy() { return FinePolicy.perDay(5); }   // default: ₹5/day

    public String id() { return id; }
    public String name() { return name; }
    @Override public String toString() { return getClass().getSimpleName() + " " + name; }
}

class StudentMember extends Member {
    StudentMember(String id, String name) { super(id, name); }
    @Override public int maxBooks() { return 3; }
    @Override public int loanDays() { return 14; }
}

class FacultyMember extends Member {
    FacultyMember(String id, String name) { super(id, name); }
    @Override public int maxBooks() { return 10; }
    @Override public int loanDays() { return 60; }
    @Override public FinePolicy finePolicy() { return FinePolicy.capped(2, 100); }   // gentler policy
}`),
        file("src/library/FinePolicy.java", code`
package library;

@FunctionalInterface
public interface FinePolicy {
    int fineFor(long daysLate);

    static FinePolicy perDay(int rupees) { return days -> (int) Math.max(0, days) * rupees; }
    static FinePolicy capped(int rupees, int cap) { return days -> Math.min(cap, perDay(rupees).fineFor(days)); }
}`),
        file("src/library/Library.java", code`
package library;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class Library {
    public record Loan(Book book, Member member, LocalDate borrowedOn, LocalDate dueOn) { }

    private final Map<String, Book> books = new LinkedHashMap<>();       // composition: the library HAS books
    private final Map<String, Member> members = new HashMap<>();
    private final List<Loan> activeLoans = new ArrayList<>();

    public void addBook(Book b) { books.put(b.isbn(), b); }
    public void addMember(Member m) { members.put(m.id(), m); }

    public List<Book> search(String text) {
        String q = text.toLowerCase();
        return books.values().stream()
            .filter(b -> b.title().toLowerCase().contains(q) || b.author().toLowerCase().contains(q))
            .toList();
    }

    public Loan borrow(String memberId, String isbn, LocalDate today) {
        Member m = Objects.requireNonNull(members.get(memberId), "unknown member");
        Book b = Objects.requireNonNull(books.get(isbn), "unknown book");
        long current = activeLoans.stream().filter(l -> l.member() == m).count();
        if (current >= m.maxBooks()) throw new IllegalStateException(m.name() + " has reached the limit of " + m.maxBooks());
        b.markBorrowed();                                                   // throws if already on loan
        Loan loan = new Loan(b, m, today, today.plusDays(m.loanDays()));    // polymorphic loanDays()
        activeLoans.add(loan);
        return loan;
    }

    public int giveBack(String isbn, LocalDate today) {
        Loan loan = activeLoans.stream().filter(l -> l.book().isbn().equals(isbn)).findFirst()
            .orElseThrow(() -> new IllegalStateException("no active loan for " + isbn));
        activeLoans.remove(loan);
        loan.book().markReturned();
        long late = ChronoUnit.DAYS.between(loan.dueOn(), today);
        return loan.member().finePolicy().fineFor(late);                    // polymorphic fine policy
    }
}`),
        file("src/library/App.java", code`
package library;

import java.time.LocalDate;

public class App {
    public static void main(String[] args) {
        Library lib = new Library();
        lib.addBook(new Book("111", "Clean Code", "Robert Martin", Book.Genre.TECHNOLOGY));
        lib.addBook(new Book("222", "Sapiens", "Yuval Harari", Book.Genre.HISTORY));
        lib.addBook(new Book("333", "Effective Java", "Joshua Bloch", Book.Genre.TECHNOLOGY));
        lib.addMember(new StudentMember("S1", "Asha"));
        lib.addMember(new FacultyMember("F1", "Dr. Rao"));

        LocalDate day1 = LocalDate.of(2026, 1, 1);
        System.out.println(lib.borrow("S1", "111", day1));
        System.out.println(lib.borrow("F1", "333", day1));
        System.out.println("Search 'java': " + lib.search("java"));

        System.out.println("Student fine: ₹" + lib.giveBack("111", day1.plusDays(20)));   // 6 days late x ₹5 = 30
        System.out.println("Faculty fine: ₹" + lib.giveBack("333", day1.plusDays(200)));  // capped at ₹100
    }
}`),
      ],
      tips: [
        "If a class name ends in Manager, Helper or Util and does everything, split it.",
        "Make state changes go through one place (Library.borrow) so the rules cannot be bypassed.",
        "Favour composition: Member has a FinePolicy rather than five subclasses for five fine rules.",
        "Draw a quick UML class diagram (boxes and arrows) before coding a larger project.",
      ],
      subjective: [
        qa("Explain the four pillars of OOP using the library example.", "Encapsulation: Book hides its available flag; only Library can change it through markBorrowed/markReturned, so a book cannot be double-loaned. Abstraction: Member is abstract and exposes maxBooks() and loanDays() without saying how each member type decides them; callers use the FinePolicy interface without knowing the formula. Inheritance: StudentMember and FacultyMember extend Member and reuse its id/name handling. Polymorphism: Library.borrow calls m.loanDays() and giveBack calls finePolicy() — the actual subclass decides at run time, so a new member type needs no change to Library."),
        qa("Differentiate composition and inheritance. When do you prefer composition?", "Inheritance models an is-a relationship: the subclass inherits the parent's interface and implementation and is tightly coupled to it. Composition models has-a: a class holds references to other objects and delegates work to them. Prefer composition when behaviour varies independently (fine policies, payment methods), when you need to change behaviour at run time, when the relationship is not truly is-a, or to avoid deep fragile hierarchies. Use inheritance for genuine subtypes that should be usable wherever the parent is expected (Liskov substitution)."),
      ],
      objective: [
        mcq("“A Library has many Books” is an example of:", ["Inheritance", "Composition/aggregation", "Polymorphism", "Overloading"], 1, "A has-a relationship."),
        mcq("Calling member.loanDays() on a Member reference that holds a FacultyMember runs:", ["Member's version", "FacultyMember's override", "Both", "A compile error"], 1, "Dynamic dispatch."),
        mcq("Which is the best candidate for a record?", ["Library", "Loan receipt with fixed data", "Abstract Member", "A service with state"], 1, "Immutable data carrier."),
        mcq("Why is markBorrowed package-private?", ["Performance", "So only classes in the package (Library) can change availability", "Required by records", "To allow overriding"], 1, "It protects the invariant."),
      ],
    },
    {
      id: "design-patterns", module: "Stage 2 · Object-oriented programming in practice", title: "Essential design patterns in Java", level: "Intermediate", minutes: 22,
      summary: "Singleton, Factory, Builder, Strategy, Observer, Adapter and Decorator — the problem each solves and a modern Java implementation.",
      description: [
        "Design patterns are named, reusable solutions to recurring design problems, catalogued by the “Gang of Four” in three groups: creational (how objects are created), structural (how they are composed) and behavioural (how they interact). Knowing them gives teams a shared vocabulary and is a staple of interviews.",
        "Creational: Singleton ensures one instance (prefer an enum or a holder class; in Spring, beans are singletons by default). Factory Method / static factories hide which concrete class is created (List.of, Notification.of(type)). Builder constructs complex objects step by step with readable, validated code (HttpRequest.newBuilder(), StringBuilder).",
        "Structural: Adapter converts one interface into another expected by clients (Arrays.asList adapts an array to List; InputStreamReader adapts bytes to characters). Decorator adds behaviour by wrapping an object with the same interface (BufferedInputStream wraps an InputStream; Collections.unmodifiableList). Facade offers a simple interface over a complex subsystem.",
        "Behavioural: Strategy encapsulates interchangeable algorithms behind an interface — with lambdas it is often just a Function or Comparator. Observer lets subjects notify subscribers of events (listeners, event buses, reactive streams). Template Method fixes an algorithm's skeleton in a base class. Overusing patterns adds needless complexity; apply them when the problem appears.",
      ],
      usage: [
        "Builder for classes with many optional parameters.",
        "Strategy for pricing rules, sorting orders, payment or discount calculations.",
        "Observer for UI events, domain events and notifications.",
        "Decorator for adding logging, caching or retries around an existing implementation.",
      ],
      files: [
        file("src/patterns/creational/Creational.java", code`
package patterns.creational;

import java.util.ArrayList;
import java.util.List;

// Singleton: an enum is thread-safe, serialization-safe and reflection-safe
enum AppConfig {
    INSTANCE;
    private final String env = System.getProperty("env", "dev");
    public String env() { return env; }
}

// Factory: callers ask for a type, not a concrete class
sealed interface Notification permits Email, Sms, Push {
    String send(String to, String msg);
    static Notification of(String channel) {
        return switch (channel.toLowerCase()) {
            case "email" -> new Email();
            case "sms" -> new Sms();
            case "push" -> new Push();
            default -> throw new IllegalArgumentException("unknown channel " + channel);
        };
    }
}
final class Email implements Notification { public String send(String to, String m) { return "email to " + to + ": " + m; } }
final class Sms implements Notification { public String send(String to, String m) { return "sms to " + to + ": " + m; } }
final class Push implements Notification { public String send(String to, String m) { return "push to " + to + ": " + m; } }

// Builder: readable construction with validation
final class Pizza {
    private final String size; private final boolean extraCheese; private final List<String> toppings;
    private Pizza(Builder b) { size = b.size; extraCheese = b.extraCheese; toppings = List.copyOf(b.toppings); }
    static Builder builder(String size) { return new Builder(size); }
    static final class Builder {
        private final String size; private boolean extraCheese; private final List<String> toppings = new ArrayList<>();
        private Builder(String size) { this.size = size; }
        Builder extraCheese() { extraCheese = true; return this; }
        Builder topping(String t) { toppings.add(t); return this; }
        Pizza build() {
            if (toppings.size() > 5) throw new IllegalStateException("max 5 toppings");
            return new Pizza(this);
        }
    }
    @Override public String toString() { return size + (extraCheese ? " + cheese " : " ") + toppings; }
}

public class Creational {
    public static void main(String[] args) {
        System.out.println(AppConfig.INSTANCE.env() + " " + (AppConfig.INSTANCE == AppConfig.valueOf("INSTANCE")));
        System.out.println(Notification.of("sms").send("98xxxxxx01", "OTP 4821"));
        System.out.println(Pizza.builder("Large").extraCheese().topping("Paneer").topping("Capsicum").build());
    }
}`),
        file("src/patterns/behavioural/Behavioural.java", code`
package patterns.behavioural;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.UnaryOperator;

public class Behavioural {
    // Strategy: interchangeable pricing rules (a lambda is a strategy)
    interface Discount extends UnaryOperator<Double> {
        static Discount none() { return p -> p; }
        static Discount percent(double pct) { return p -> p * (1 - pct / 100); }
        static Discount flat(double off) { return p -> Math.max(0, p - off); }
    }

    record Checkout(double price, Discount discount) {
        double total() { return Math.round(discount.apply(price) * 100) / 100.0; }
    }

    // Observer: subscribers are notified when an order is placed
    static class OrderEvents {
        private final List<Consumer<String>> listeners = new ArrayList<>();
        void subscribe(Consumer<String> l) { listeners.add(l); }
        void placed(String orderId) { listeners.forEach(l -> l.accept(orderId)); }
    }

    public static void main(String[] args) {
        System.out.println(new Checkout(999, Discount.percent(10)).total());   // 899.1
        System.out.println(new Checkout(999, Discount.flat(150)).total());     // 849.0
        System.out.println(new Checkout(999, Discount.none()).total());

        OrderEvents events = new OrderEvents();
        events.subscribe(id -> System.out.println("Email receipt for " + id));
        events.subscribe(id -> System.out.println("Update inventory for " + id));
        events.placed("ORD-42");
    }
}`),
        file("src/patterns/structural/Structural.java", code`
package patterns.structural;

import java.util.HashMap;
import java.util.Map;

public class Structural {
    interface WeatherService { double tempCelsius(String city); }

    // Adapter: a third-party API with a different shape
    static class LegacyFahrenheitApi { double getTempF(String cityCode) { return 98.6; } }
    static class FahrenheitAdapter implements WeatherService {
        private final LegacyFahrenheitApi api = new LegacyFahrenheitApi();
        public double tempCelsius(String city) { return (api.getTempF(city.toUpperCase()) - 32) * 5 / 9; }
    }

    // Decorators: same interface, extra behaviour, stackable
    static class Logging implements WeatherService {
        private final WeatherService inner;
        Logging(WeatherService inner) { this.inner = inner; }
        public double tempCelsius(String city) {
            long t = System.nanoTime();
            double v = inner.tempCelsius(city);
            System.out.println("tempCelsius(" + city + ") took " + (System.nanoTime() - t) / 1000 + " µs");
            return v;
        }
    }
    static class Caching implements WeatherService {
        private final WeatherService inner;
        private final Map<String, Double> cache = new HashMap<>();
        Caching(WeatherService inner) { this.inner = inner; }
        public double tempCelsius(String city) { return cache.computeIfAbsent(city, inner::tempCelsius); }
    }

    public static void main(String[] args) {
        WeatherService service = new Caching(new Logging(new FahrenheitAdapter()));
        System.out.printf("%.1f%n", service.tempCelsius("pune"));   // logs once
        System.out.printf("%.1f%n", service.tempCelsius("pune"));   // served from cache, no log
    }
}`),
      ],
      tips: [
        "Explain a pattern in interviews as problem → solution → JDK/Spring example → trade-off.",
        "Double-checked locking singletons need a volatile field; the enum or holder idiom avoids the subtlety.",
        "Strategy and Command are often just lambdas in modern Java.",
        "java.io streams are the textbook Decorator; Spring AOP proxies are Decorator/Proxy in action.",
      ],
      subjective: [
        qa("What are the ways to implement Singleton in Java? Which is best?", "1) Eager initialization: private static final INSTANCE = new X(); simple and thread-safe but created even if unused. 2) Lazy with synchronized getInstance(): thread-safe but synchronizes every call. 3) Double-checked locking with a volatile field: lazy and fast, but subtle. 4) Bill Pugh holder: a private static nested class holds the instance; lazy and thread-safe through class-loading guarantees. 5) Enum singleton: enum X { INSTANCE; } — concise, thread-safe, and protected against reflection and serialization creating second instances; recommended by Effective Java unless you must extend a class."),
        qa("Explain the Builder pattern and when to use it.", "Builder separates the construction of a complex object from its representation: a nested Builder collects parameters through fluent, named methods and a build() method validates them and creates an (often immutable) object. Use it when a constructor would have many parameters, especially optional ones (telescoping constructors are unreadable and error-prone), when you want immutability without huge constructors, or when construction needs validation across fields. JDK examples: StringBuilder, HttpRequest.newBuilder(), Stream.builder(); Lombok's @Builder generates it."),
        qa("Differentiate Strategy and Template Method.", "Both vary parts of an algorithm. Template Method uses inheritance: a base class defines the fixed skeleton in a final method and subclasses override hook steps; the variation is chosen at compile time by subclassing. Strategy uses composition: the varying algorithm is an object (or lambda) implementing an interface, injected into the context and swappable at run time. Strategy is generally more flexible and testable; Template Method suits frameworks with a fixed flow."),
      ],
      objective: [
        mcq("Which pattern does java.io.BufferedReader wrapping a FileReader illustrate?", ["Singleton", "Decorator", "Factory", "Observer"], 1, "It adds buffering with the same Reader interface."),
        mcq("Which pattern is best for objects with many optional parameters?", ["Adapter", "Builder", "Observer", "Prototype"], 1, "Fluent, readable construction."),
        mcq("Recommended thread-safe singleton implementation in Java:", ["Public constructor", "Enum with one constant", "Static method returning new instance", "Cloning"], 1, "Reflection- and serialization-safe."),
        mcq("Comparator passed to sort is an example of:", ["Strategy", "Singleton", "Facade", "Builder"], 0, "An interchangeable algorithm."),
        mcq("Arrays.asList(array) is an example of:", ["Decorator", "Adapter", "Observer", "Proxy"], 1, "Adapts an array to the List interface."),
      ],
    },
    {
      id: "solid-clean-code", module: "Stage 2 · Object-oriented programming in practice", title: "SOLID principles and clean code", level: "Intermediate", minutes: 16,
      summary: "Single responsibility, open/closed, Liskov substitution, interface segregation and dependency inversion, with before/after refactoring.",
      description: [
        "SOLID is a set of five design principles that keep object-oriented code easy to change. S — Single Responsibility: a class should have one reason to change (separate invoice calculation from PDF rendering and emailing). O — Open/Closed: modules should be open for extension but closed for modification (add a new discount type by adding a class, not by editing a growing switch).",
        "L — Liskov Substitution: subtypes must be usable wherever their base type is expected without breaking behaviour; a Square that extends a mutable Rectangle and changes both sides on setWidth violates it. I — Interface Segregation: prefer several small, focused interfaces over one fat interface that forces implementers to stub methods they do not need. D — Dependency Inversion: high-level policy should depend on abstractions, not concrete details — inject a PaymentGateway interface instead of constructing RazorpayClient inside the service; dependency injection frameworks such as Spring are built on this idea.",
        "Clean-code habits complement SOLID: meaningful names, small functions that do one thing, no magic numbers, early returns instead of deep nesting, comments that explain why rather than what, consistent formatting, and tests that make refactoring safe. Tools like SonarLint, Checkstyle and IDE inspections catch many issues automatically.",
      ],
      usage: [
        "Apply SRP and DIP when a class becomes hard to test or keeps changing for unrelated reasons.",
        "Replace type-checking switches with polymorphism (OCP).",
        "Split fat interfaces when implementers throw UnsupportedOperationException (ISP).",
        "Refactor in small steps, running tests after each.",
      ],
      files: [
        file("src/solid/before/InvoiceService.java", code`
package solid.before;

// Violates SRP (calculates, formats AND sends), OCP (switch grows with every customer type)
// and DIP (creates its own SMTP client).
public class InvoiceService {
    public void process(String customerType, double amount, String email) {
        double total;
        switch (customerType) {
            case "REGULAR" -> total = amount;
            case "PREMIUM" -> total = amount * 0.9;
            case "STAFF" -> total = amount * 0.7;
            default -> throw new IllegalArgumentException(customerType);
        }
        String text = "Invoice total: " + total;
        new SmtpClient("smtp.example.com").send(email, text);
    }

    static class SmtpClient {
        SmtpClient(String host) { }
        void send(String to, String body) { System.out.println("SMTP -> " + to + ": " + body); }
    }
}`),
        file("src/solid/after/Pricing.java", code`
package solid.after;

// OCP: a new customer type is a new implementation, no edits to existing code
public interface Pricing {
    double total(double amount);

    static Pricing regular() { return a -> a; }
    static Pricing premium() { return a -> a * 0.9; }
    static Pricing staff() { return a -> a * 0.7; }
}`),
        file("src/solid/after/Notifier.java", code`
package solid.after;

// ISP: a small interface; DIP: the service depends on this abstraction
public interface Notifier {
    void send(String to, String body);
}

class EmailNotifier implements Notifier {
    @Override public void send(String to, String body) { System.out.println("EMAIL -> " + to + ": " + body); }
}`),
        file("src/solid/after/InvoiceService.java", code`
package solid.after;

// SRP: orchestrates only; formatting and delivery live elsewhere. Dependencies are injected.
public class InvoiceService {
    private final Notifier notifier;
    private final InvoiceFormatter formatter;

    public InvoiceService(Notifier notifier, InvoiceFormatter formatter) {
        this.notifier = notifier;
        this.formatter = formatter;
    }

    public double process(Pricing pricing, double amount, String email) {
        double total = pricing.total(amount);
        notifier.send(email, formatter.format(total));
        return total;
    }

    public static void main(String[] args) {
        InvoiceService service = new InvoiceService(new EmailNotifier(), new InvoiceFormatter());
        service.process(Pricing.premium(), 1000, "asha@example.com");

        // In a unit test, a fake notifier needs no SMTP server:
        java.util.List<String> sent = new java.util.ArrayList<>();
        new InvoiceService((to, body) -> sent.add(body), new InvoiceFormatter()).process(Pricing.staff(), 1000, "x@y");
        System.out.println("captured: " + sent);
    }
}

class InvoiceFormatter {
    String format(double total) { return String.format("Invoice total: ₹%,.2f", total); }
}`),
      ],
      tips: [
        "SOLID is a guide, not a rule set — apply it where change is likely.",
        "LSP check: can every test written for the parent pass with the subclass?",
        "A constructor with many dependencies is a smell that SRP is being violated.",
        "Name things for what they mean in the domain (invoiceTotal), not their type (doubleValue).",
      ],
      subjective: [
        qa("Explain each SOLID principle with a one-line example.", "S — Single Responsibility: a ReportService should not also send emails; move emailing to a Notifier. O — Open/Closed: add a new discount by writing a new Pricing implementation rather than editing a switch. L — Liskov Substitution: a ReadOnlyList subtype that throws on add() breaks code expecting a modifiable List. I — Interface Segregation: split a Worker interface with work() and eat() so Robot need not implement eat(). D — Dependency Inversion: OrderService depends on a PaymentGateway interface injected from outside, not on new RazorpayClient()."),
        qa("What is dependency inversion and how does it relate to dependency injection?", "Dependency Inversion is a design principle: high-level modules should not depend on low-level modules; both should depend on abstractions, and abstractions should not depend on details. Dependency Injection is a technique to achieve it: an object receives its dependencies (typically interfaces) from the outside — through its constructor, setters or a framework container such as Spring — instead of creating them itself. DI makes classes loosely coupled and easy to unit test with fakes."),
      ],
      objective: [
        mcq("Which principle says a class should have only one reason to change?", ["Open/Closed", "Single Responsibility", "Liskov Substitution", "Interface Segregation"], 1, "SRP."),
        mcq("Replacing a growing switch on types with polymorphism mainly supports:", ["OCP", "ISP", "DRY only", "LSP"], 0, "Extend without modifying."),
        mcq("A subclass that throws UnsupportedOperationException for an inherited method most likely violates:", ["SRP", "LSP", "DIP", "KISS"], 1, "It cannot substitute for its parent."),
        mcq("Injecting an interface into a constructor applies:", ["Dependency Inversion", "Singleton", "Template Method", "Encapsulation only"], 0, "Depend on abstractions."),
      ],
    },
    {
      id: "collections-in-practice", module: "Stage 3 · Intermediate Java", title: "Collections in practice: choosing and using the right one", level: "Intermediate", minutes: 18,
      summary: "A decision guide for List, Set, Map and Queue, real-world usage in a grade book, Iterator, Collections utilities, SequencedCollection and immutability.",
      description: [
        "Choosing a collection starts with questions: Do I need order? Duplicates? Lookup by key? Sorted iteration? FIFO/LIFO processing? Thread safety? The defaults that cover most code: ArrayList for ordered lists, HashMap for key lookup, HashSet for uniqueness, ArrayDeque for stacks and queues, TreeMap/TreeSet for sorting and ranges, LinkedHashMap/LinkedHashSet for predictable iteration order, and PriorityQueue for “next most important”.",
        "Program to interfaces (List, Map, Set), iterate with the enhanced for loop or forEach, and use the Iterator directly only when removing during iteration (or removeIf). Map methods getOrDefault, putIfAbsent, computeIfAbsent and merge replace verbose check-then-act code. The Collections class adds sort, reverse, shuffle, frequency, max/min, nCopies, unmodifiable and synchronized wrappers.",
        "Java 21 introduced Sequenced Collections: List, Deque, LinkedHashSet, LinkedHashMap and sorted collections implement SequencedCollection/SequencedMap with getFirst, getLast, addFirst, addLast, removeFirst and reversed() — no more list.get(list.size() - 1).",
        "Immutability: List.of, Set.of, Map.of and copyOf create unmodifiable collections that reject nulls and modification; Collections.unmodifiableList is only a read-only view of a list that can still change underneath. Return immutable copies from public APIs.",
      ],
      usage: [
        "Grade books, shopping carts, leaderboards, caches, adjacency lists — all built from these collections.",
        "Group with computeIfAbsent(key, k -> new ArrayList<>()).add(value).",
        "Count with merge(key, 1, Integer::sum).",
        "Keep top-N with a PriorityQueue or a TreeMap.",
      ],
      files: [
        file("src/grades/GradeBook.java", code`
package grades;

import java.util.*;

public class GradeBook {
    private final Map<String, List<Integer>> marksByStudent = new TreeMap<>();      // sorted by name
    private final Map<String, Set<String>> studentsBySubject = new LinkedHashMap<>(); // insertion order
    private final Deque<String> recentActivity = new ArrayDeque<>();                // newest first

    public void record(String student, String subject, int marks) {
        marksByStudent.computeIfAbsent(student, k -> new ArrayList<>()).add(marks);
        studentsBySubject.computeIfAbsent(subject, k -> new TreeSet<>()).add(student);
        recentActivity.addFirst(student + " scored " + marks + " in " + subject);
        if (recentActivity.size() > 3) recentActivity.removeLast();                 // keep the last 3 only
    }

    public double average(String student) {
        return marksByStudent.getOrDefault(student, List.of()).stream().mapToInt(Integer::intValue).average().orElse(0);
    }

    public List<String> topStudents(int n) {
        PriorityQueue<String> heap = new PriorityQueue<>(Comparator.comparingDouble(this::average));
        for (String s : marksByStudent.keySet()) {
            heap.offer(s);
            if (heap.size() > n) heap.poll();                                      // drop the weakest
        }
        List<String> result = new ArrayList<>(heap);
        result.sort(Comparator.comparingDouble(this::average).reversed());
        return List.copyOf(result);                                                // immutable to callers
    }

    public Map<String, Set<String>> bySubject() { return Collections.unmodifiableMap(studentsBySubject); }
    public List<String> recent() { return List.copyOf(recentActivity); }
}`),
        file("src/grades/Main.java", code`
package grades;

import java.util.*;

public class Main {
    public static void main(String[] args) {
        GradeBook book = new GradeBook();
        book.record("Ravi", "Maths", 78);
        book.record("Asha", "Maths", 95);
        book.record("Asha", "Physics", 88);
        book.record("Meera", "Physics", 91);
        book.record("Kabir", "Maths", 64);

        System.out.println("Top 2: " + book.topStudents(2));
        System.out.println("By subject: " + book.bySubject());
        System.out.println("Recent: " + book.recent());

        // Java 21 sequenced collections
        List<String> names = new ArrayList<>(List.of("Asha", "Kabir", "Meera"));
        names.addFirst("Aarav");
        System.out.println(names.getFirst() + " ... " + names.getLast() + " reversed " + names.reversed());

        // Safe removal while iterating
        Iterator<String> it = names.iterator();
        while (it.hasNext()) if (it.next().startsWith("K")) it.remove();
        System.out.println(names + " max=" + Collections.max(names) + " freq(A*)=" + names.stream().filter(n -> n.startsWith("A")).count());
    }
}`),
        file("choosing-a-collection.md", code`
Need key -> value lookup?            Map  (HashMap; TreeMap if sorted; LinkedHashMap if insertion order)
Need uniqueness?                     Set  (HashSet; TreeSet if sorted; LinkedHashSet if insertion order)
Need order + index + duplicates?     List (ArrayList)
Need FIFO / LIFO?                    Deque (ArrayDeque)
Need "smallest/largest next"?        PriorityQueue
Shared between threads?              ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue
Never changes after creation?        List.of / Set.of / Map.of / copyOf`),
      ],
      tips: [
        "Map.of supports up to 10 pairs; use Map.ofEntries(Map.entry(...)) for more.",
        "Collections.unmodifiableList reflects later changes to the backing list; List.copyOf does not.",
        "Sorting a list by a derived value repeatedly? Precompute it into a record to avoid repeated work.",
        "Do not use a mutable object as a HashMap key or HashSet element if its fields may change.",
      ],
      subjective: [
        qa("How do you decide which collection to use?", "Ask what operations dominate. Indexed, ordered data with duplicates → ArrayList. Fast membership tests, no duplicates → HashSet (TreeSet for sorted, LinkedHashSet for insertion order). Lookup by key → HashMap (TreeMap for sorted keys or range queries, LinkedHashMap for predictable order or LRU caches). FIFO/LIFO processing → ArrayDeque. Priority-based processing → PriorityQueue. Concurrent access → java.util.concurrent collections. Fixed data → immutable List.of/Set.of/Map.of."),
        qa("Differentiate Collections.unmodifiableList and List.copyOf.", "Collections.unmodifiableList(list) returns a read-only view: callers cannot modify it, but changes made to the original list are visible through the view, and it allows nulls. List.copyOf(list) returns an independent immutable copy (unless the argument is already such an immutable list): later changes to the original do not affect it, and it rejects null elements with NullPointerException."),
      ],
      objective: [
        mcq("Which Java 21 method returns the last element of a List?", ["last()", "getLast()", "peekLast()", "tail()"], 1, "From SequencedCollection."),
        mcq("Best collection for counting word frequencies with sorted output:", ["ArrayList", "TreeMap<String, Integer>", "HashSet", "ArrayDeque"], 1, "Keys are kept sorted."),
        mcq("Map.of(\"a\", 1, \"a\", 2) results in:", ["{a=2}", "{a=1}", "IllegalArgumentException", "Compile error"], 2, "Duplicate keys are rejected."),
        mcq("Which method groups values in a map without explicit null checks?", ["putAll", "computeIfAbsent", "replace", "keySet"], 1, "Creates the list on first use."),
      ],
    },
    {
      id: "exceptions-logging-optional", module: "Stage 3 · Intermediate Java", title: "Robust code: exceptions, logging and Optional", level: "Intermediate", minutes: 18,
      summary: "Designing an exception strategy, translating and chaining exceptions, logging with SLF4J, and using Optional instead of null returns.",
      description: [
        "Robust programs separate expected outcomes from failures. Validate input early and fail fast with clear exceptions (IllegalArgumentException, IllegalStateException). Use checked exceptions sparingly — for recoverable conditions the caller must handle — and unchecked ones for programming errors and most application failures. Translate low-level exceptions (SQLException, IOException) into meaningful domain exceptions at layer boundaries, always passing the cause so the stack trace keeps the root problem.",
        "Never swallow exceptions. Either handle them (retry, fallback, user message) or let them propagate to a central handler that logs and responds. Clean up with try-with-resources. Avoid catching Exception broadly in the middle of business logic.",
        "Logging records what the application did for later diagnosis. SLF4J is the standard facade with Logback or Log4j 2 as the implementation (java.util.logging is built in but less flexible). Use levels deliberately — ERROR (needs attention), WARN (recoverable problem), INFO (business events), DEBUG/TRACE (diagnostics) — and parameterized messages log.info(\"Order {} placed\", id) so strings are built only if the level is enabled. Log an exception once, with the exception object as the last argument to get the stack trace, and never log secrets.",
        "Optional<T> (Java 8) is a return type that makes “no result” explicit, preventing NullPointerException at call sites. Create with Optional.of, ofNullable or empty; consume with map, flatMap, filter, orElse, orElseGet, orElseThrow, ifPresent and ifPresentOrElse. Do not use Optional for fields, parameters or collections (return an empty collection instead), and avoid calling get() without a check.",
      ],
      usage: [
        "Repository lookups return Optional<User>; services decide whether absence is an error.",
        "Wrap I/O failures in a domain exception with context (file name, record id).",
        "Log at INFO for business milestones and ERROR once where an exception is finally handled.",
        "Use orElseThrow to convert “not found” into a meaningful exception at the right layer.",
      ],
      files: [
        file("src/robust/UserRepository.java", code`
package robust;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class UserRepository {
    public record User(String id, String email, String referrerId) { }
    private final Map<String, User> store = new ConcurrentHashMap<>(Map.of(
        "u1", new User("u1", "asha@mc.dev", null),
        "u2", new User("u2", "ravi@mc.dev", "u1")));

    public Optional<User> findById(String id) { return Optional.ofNullable(store.get(id)); }   // absence is explicit
}`),
        file("src/robust/ReportException.java", code`
package robust;

public class ReportException extends RuntimeException {
    public ReportException(String message, Throwable cause) { super(message, cause); }   // keep the root cause
}`),
        file("src/robust/ReportService.java", code`
package robust;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.NoSuchElementException;

public class ReportService {
    private static final Logger log = LoggerFactory.getLogger(ReportService.class);
    private final UserRepository users;
    public ReportService(UserRepository users) { this.users = users; }

    public String referrerEmail(String userId) {
        return users.findById(userId)
            .map(UserRepository.User::referrerId)            // Optional<String>; empty if referrerId is null
            .flatMap(users::findById)                         // Optional<User>
            .map(UserRepository.User::email)
            .orElse("no referrer");
    }

    public String emailOrFail(String userId) {
        return users.findById(userId).map(UserRepository.User::email)
            .orElseThrow(() -> new NoSuchElementException("user " + userId + " not found"));
    }

    public Path export(String userId, Path dir) {
        if (userId == null || userId.isBlank()) throw new IllegalArgumentException("userId is required");   // fail fast
        Path file = dir.resolve(userId + ".txt");
        try {
            Files.writeString(file, "email=" + emailOrFail(userId));
            log.info("Exported report for user {} to {}", userId, file);                 // parameterized
            return file;
        } catch (IOException e) {
            throw new ReportException("could not write report for " + userId, new UncheckedIOException(e));
        }
    }
}`),
        file("src/robust/Main.java", code`
package robust;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.file.Path;

public class Main {
    private static final Logger log = LoggerFactory.getLogger(Main.class);

    public static void main(String[] args) {
        ReportService reports = new ReportService(new UserRepository());
        System.out.println(reports.referrerEmail("u2") + " / " + reports.referrerEmail("u1"));   // asha@mc.dev / no referrer
        try {
            reports.export("u2", Path.of("missing-folder"));
        } catch (ReportException e) {
            log.error("Report export failed", e);              // logged once, with stack trace and cause
        }
    }
}`),
        file("src/main/resources/logback.xml", code`
<configuration>
  <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <encoder><pattern>%d{HH:mm:ss.SSS} %-5level [%thread] %logger{20} - %msg%n</pattern></encoder>
  </appender>
  <logger name="robust" level="DEBUG"/>
  <root level="INFO"><appender-ref ref="CONSOLE"/></root>
</configuration>`),
      ],
      tips: [
        "orElse(expensiveCall()) always evaluates the argument; use orElseGet(() -> expensiveCall()).",
        "Log and rethrow is an anti-pattern — the same failure gets logged several times.",
        "Use Objects.requireNonNull(param, \"param\") at the start of public methods.",
        "Return List.of() rather than null or Optional<List<...>> for “no results”.",
      ],
      subjective: [
        qa("What is Optional and what are best practices for using it?", "Optional<T> is a container that may or may not hold a non-null value, introduced in Java 8 to represent “no result” explicitly in return types. Best practices: use it as a method return type when absence is a normal outcome; never return null from a method declared to return Optional; consume it with map/flatMap/filter and terminal methods orElse, orElseGet, orElseThrow or ifPresent rather than isPresent() + get(); do not use it for fields, method parameters, or collection elements; return empty collections instead of Optional<Collection>; use primitive variants (OptionalInt) for primitives."),
        qa("Why should exceptions be chained, and how?", "When a low-level exception is translated into a higher-level one, the original exception explains the real cause (disk full, connection refused). Chaining keeps it: pass it as the cause argument — new ReportException(\"could not write report\", e) — or call initCause. Stack traces then show “Caused by: …” sections, which makes debugging possible while still presenting a meaningful abstraction to callers."),
      ],
      objective: [
        mcq("Which method should replace optional.get() in most code?", ["isPresent()", "orElseThrow()", "toString()", "hashCode()"], 1, "Makes the failure explicit."),
        mcq("Optional.ofNullable(null) returns:", ["null", "Optional.empty()", "Throws NPE", "Optional.of(null)"], 1, "Optional.of(null) throws."),
        mcq("Correct SLF4J usage:", ["log.info(\"user \" + id)", "log.info(\"user {}\", id)", "System.out.println(id)", "log.info(id, \"user\")"], 1, "Parameterized messages."),
        mcq("Which log level suits a recoverable problem that does not stop the operation?", ["ERROR", "WARN", "TRACE", "OFF"], 1, "WARN."),
      ],
    },
    {
      id: "functional-programming", module: "Stage 3 · Intermediate Java", title: "Functional programming: lambdas, functional interfaces and composition", level: "Intermediate", minutes: 18,
      summary: "The java.util.function catalogue, composing functions, higher-order methods, method references, and writing your own functional APIs.",
      description: [
        "Functional programming treats behaviour as values. In Java a lambda or method reference implements a functional interface (one abstract method). The java.util.function package provides the standard shapes: Supplier<T> (() → T), Consumer<T> (T → void), Function<T,R> (T → R), Predicate<T> (T → boolean), UnaryOperator<T> and BinaryOperator<T>, two-argument versions (BiFunction, BiConsumer, BiPredicate) and primitive specializations (IntPredicate, ToIntFunction, IntBinaryOperator) that avoid boxing.",
        "Functional interfaces have default methods for composition: Function.andThen and compose, Predicate.and, or, negate and Predicate.not (Java 11), Comparator.comparing, thenComparing and reversed, Consumer.andThen. Small behaviours combine into larger ones without new classes.",
        "Higher-order functions take or return functions: a retry(Supplier<T>, attempts) helper, a memoize(Function<T,R>) cache, validators built from predicates, or event handlers passed as Consumers. Prefer pure functions — the same input always gives the same output and nothing outside changes — because they are easy to test and safe to run in parallel.",
        "Method references come in four forms: static (Integer::parseInt), bound instance (logger::info), unbound instance (String::trim — the first argument becomes the receiver) and constructor (ArrayList::new, int[]::new). Lambdas capture effectively final local variables and see this as the enclosing instance.",
      ],
      usage: [
        "Pass behaviour into reusable utilities: retries, timing, validation, caching.",
        "Build complex comparators and filters from small composable pieces.",
        "Design APIs that accept functional interfaces so callers can use lambdas.",
        "Combine with streams for declarative data processing (next topic).",
      ],
      files: [
        file("src/fp/Functions.java", code`
package fp;

import java.util.*;
import java.util.function.*;

public class Functions {
    // Higher-order: takes a function, returns a function with caching
    static <T, R> Function<T, R> memoize(Function<T, R> fn) {
        Map<T, R> cache = new HashMap<>();
        return input -> cache.computeIfAbsent(input, fn);
    }

    // Higher-order: retry any operation
    static <T> T retry(Supplier<T> action, int attempts) {
        RuntimeException last = null;
        for (int i = 1; i <= attempts; i++) {
            try { return action.get(); }
            catch (RuntimeException e) { last = e; System.out.println("attempt " + i + " failed: " + e.getMessage()); }
        }
        throw last;
    }

    record Student(String name, int marks, String city) { }

    public static void main(String[] args) {
        Function<Integer, Integer> doubleIt = x -> x * 2;
        Function<Integer, Integer> plusTen = x -> x + 10;
        System.out.println(doubleIt.andThen(plusTen).apply(5) + " " + doubleIt.compose(plusTen).apply(5));   // 20 30

        Predicate<String> notBlank = Predicate.not(String::isBlank);
        Predicate<String> shortWord = s -> s.length() <= 5;
        List<String> words = List.of("java", " ", "lambda", "fun", "");
        System.out.println(words.stream().filter(notBlank.and(shortWord)).toList());               // [java, fun]

        BinaryOperator<Integer> max = BinaryOperator.maxBy(Comparator.naturalOrder());
        UnaryOperator<String> shout = s -> s.toUpperCase() + "!";
        Supplier<List<String>> listFactory = ArrayList::new;                                      // constructor ref
        BiFunction<String, Integer, String> repeat = String::repeat;                              // unbound instance ref
        System.out.println(max.apply(3, 9) + " " + shout.apply("hi") + " " + repeat.apply("ab", 3) + " " + listFactory.get());

        Comparator<Student> ranking = Comparator.comparingInt(Student::marks).reversed()
            .thenComparing(Student::city).thenComparing(Student::name);
        List<Student> cls = new ArrayList<>(List.of(new Student("Ravi", 88, "Pune"), new Student("Asha", 92, "Delhi"),
            new Student("Meera", 88, "Delhi")));
        cls.sort(ranking);
        System.out.println(cls.stream().map(Student::name).toList());                               // [Asha, Meera, Ravi]

        Function<Integer, Long> slowSquare = memoize(n -> { System.out.println("computing " + n); return (long) n * n; });
        System.out.println(slowSquare.apply(12) + " " + slowSquare.apply(12));                    // computes once

        int[] calls = {0};
        System.out.println(retry(() -> { if (++calls[0] < 3) throw new IllegalStateException("flaky"); return "ok"; }, 5));
    }
}`),
        file("src/fp/Validation.java", code`
package fp;

import java.util.*;
import java.util.function.Predicate;

// A tiny validation DSL built from predicates
public class Validation<T> {
    private final List<Map.Entry<Predicate<T>, String>> rules = new ArrayList<>();

    public Validation<T> rule(Predicate<T> check, String message) { rules.add(Map.entry(check, message)); return this; }

    public List<String> validate(T value) {
        return rules.stream().filter(r -> !r.getKey().test(value)).map(Map.Entry::getValue).toList();
    }

    public static void main(String[] args) {
        Validation<String> password = new Validation<String>()
            .rule(p -> p.length() >= 8, "at least 8 characters")
            .rule(p -> p.chars().anyMatch(Character::isDigit), "a digit")
            .rule(p -> p.chars().anyMatch(Character::isUpperCase), "an uppercase letter")
            .rule(Predicate.not(p -> p.toLowerCase().contains("password")), "must not contain 'password'");
        System.out.println(password.validate("secret"));       // three failures
        System.out.println(password.validate("Mango2026"));    // []
    }
}`),
      ],
      tips: [
        "Use primitive specializations (IntStream, ToIntFunction) in hot paths to avoid boxing.",
        "Checked exceptions do not fit java.util.function interfaces — wrap them or write your own functional interface that throws.",
        "A memoize cache built with a plain HashMap is not thread-safe; use ConcurrentHashMap if shared (and avoid recursive computeIfAbsent).",
        "Name complex lambdas as methods and use method references for readability.",
      ],
      subjective: [
        qa("Name the main functional interfaces in java.util.function with their method signatures.", "Supplier<T>: T get(). Consumer<T>: void accept(T t). Function<T,R>: R apply(T t). Predicate<T>: boolean test(T t). UnaryOperator<T> extends Function<T,T>. BinaryOperator<T> extends BiFunction<T,T,T>: T apply(T a, T b). BiFunction<T,U,R>: R apply(T t, U u). BiConsumer<T,U>: void accept(T t, U u). BiPredicate<T,U>: boolean test(T t, U u). Primitive variants such as IntPredicate, IntFunction<R>, ToIntFunction<T>, IntUnaryOperator and IntBinaryOperator avoid boxing."),
        qa("Differentiate Function.andThen and Function.compose.", "f.andThen(g) returns a function that applies f first and then g to the result: x → g(f(x)). f.compose(g) applies g first and then f: x → f(g(x)). With f = x * 2 and g = x + 10, f.andThen(g).apply(5) = 20 while f.compose(g).apply(5) = 30."),
      ],
      objective: [
        mcq("Which interface takes an argument and returns nothing?", ["Supplier", "Consumer", "Function", "Predicate"], 1, "accept(T)."),
        mcq("Predicate.not(String::isBlank) tests whether a string is:", ["Blank", "Not blank", "Null", "Uppercase"], 1, "Negation of isBlank."),
        mcq("ArrayList::new used as Supplier<List<String>> is a:", ["Static method reference", "Constructor reference", "Bound reference", "Lambda block"], 1, "Creates a new ArrayList each call."),
        mcq("f.andThen(g).apply(x) equals:", ["f(g(x))", "g(f(x))", "f(x) + g(x)", "g(x)"], 1, "f runs first."),
      ],
    },
    {
      id: "streams-collectors", module: "Stage 3 · Intermediate Java", title: "Streams and collectors in depth", level: "Advanced", minutes: 22,
      summary: "Building pipelines, reduce, multi-level groupingBy, downstream collectors, teeing, flatMap, mapMulti, custom collectors and parallel streams.",
      description: [
        "A stream pipeline is source → intermediate operations → terminal operation, evaluated lazily and element by element (vertical processing), which lets short-circuiting operations such as findFirst, anyMatch and limit stop early. Sources include collections, arrays, Stream.of, Stream.iterate, Stream.generate, IntStream.range, Files.lines and String.chars.",
        "reduce combines elements into one value: reduce(identity, accumulator) or, for parallel use with a different result type, reduce(identity, accumulator, combiner). Prefer specialized terminals when they exist: sum, count, max, min, average, summaryStatistics and collect.",
        "Collectors are where streams become reports. groupingBy(classifier, downstream) groups elements, and downstream collectors summarize each group: counting, summingInt, averagingDouble, mapping, filtering, flatMapping, maxBy, toSet, joining and collectingAndThen. Groupings nest (city → branch → students) and accept a map factory (TreeMap::new) for sorted keys. partitioningBy splits into true/false. toMap needs a merge function when keys can repeat. teeing (Java 12) feeds two collectors and merges their results. You can write custom collectors with Collector.of.",
        "flatMap flattens nested structures; mapMulti (Java 16) is an imperative alternative. Stream.toList() (Java 16) returns an unmodifiable list. Parallel streams (parallelStream()) split work across the common ForkJoinPool; they help only for large, CPU-bound, stateless workloads with cheap-to-split sources (arrays, ArrayList) and can be slower otherwise. Never mutate shared state from stream operations.",
      ],
      usage: [
        "Reports and dashboards: revenue by month, top products per category, pass rates per branch.",
        "Data cleaning: parsing CSV lines, filtering invalid records, normalizing values.",
        "Building lookup maps from lists with toMap or groupingBy.",
        "Use loops instead when logic needs complex control flow, checked exceptions or early returns with state.",
      ],
      files: [
        file("src/streams/Sales.java", code`
package streams;

import java.time.LocalDate;
import java.time.Month;
import java.util.*;
import java.util.stream.*;

public class Sales {
    record Order(String id, String customer, String city, String category, double amount, LocalDate date, List<String> items) { }

    static final List<Order> ORDERS = List.of(
        new Order("o1", "Asha", "Pune", "Books", 1200, LocalDate.of(2026, 1, 5), List.of("Clean Code", "Refactoring")),
        new Order("o2", "Ravi", "Delhi", "Electronics", 18500, LocalDate.of(2026, 1, 9), List.of("Headphones")),
        new Order("o3", "Asha", "Pune", "Electronics", 2300, LocalDate.of(2026, 2, 2), List.of("Mouse", "Keyboard")),
        new Order("o4", "Meera", "Delhi", "Books", 650, LocalDate.of(2026, 2, 14), List.of("Sapiens")),
        new Order("o5", "Kabir", "Mumbai", "Books", 900, LocalDate.of(2026, 2, 20), List.of("Clean Code")));

    public static void main(String[] args) {
        // Multi-level grouping with a sorted outer map
        Map<String, Map<String, Double>> revenueByCityAndCategory = ORDERS.stream().collect(
            Collectors.groupingBy(Order::city, TreeMap::new,
                Collectors.groupingBy(Order::category, Collectors.summingDouble(Order::amount))));
        System.out.println(revenueByCityAndCategory);

        // Downstream collectors: customers per city as a sorted set, biggest order per category
        Map<String, Set<String>> customersByCity = ORDERS.stream()
            .collect(Collectors.groupingBy(Order::city, Collectors.mapping(Order::customer, Collectors.toCollection(TreeSet::new))));
        Map<String, String> biggestPerCategory = ORDERS.stream().collect(Collectors.groupingBy(Order::category,
            Collectors.collectingAndThen(Collectors.maxBy(Comparator.comparingDouble(Order::amount)), o -> o.orElseThrow().id())));
        System.out.println(customersByCity + " " + biggestPerCategory);

        // Revenue per month in calendar order
        Map<Month, Double> perMonth = ORDERS.stream()
            .collect(Collectors.groupingBy(o -> o.date().getMonth(), () -> new EnumMap<>(Month.class), Collectors.summingDouble(Order::amount)));
        System.out.println(perMonth);

        // flatMap + counting: most popular items
        Map<String, Long> itemCounts = ORDERS.stream().flatMap(o -> o.items().stream())
            .collect(Collectors.groupingBy(i -> i, Collectors.counting()));
        String bestSeller = itemCounts.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("none");
        System.out.println(itemCounts + " best seller: " + bestSeller);

        // teeing: two results in one pass
        record Range(double min, double max) { }
        Range range = ORDERS.stream().map(Order::amount).collect(Collectors.teeing(
            Collectors.minBy(Comparator.naturalOrder()), Collectors.maxBy(Comparator.naturalOrder()),
            (min, max) -> new Range(min.orElse(0.0), max.orElse(0.0))));
        System.out.println(range);

        // partitioningBy and toMap with a merge function
        Map<Boolean, Long> bigOrders = ORDERS.stream().collect(Collectors.partitioningBy(o -> o.amount() > 2000, Collectors.counting()));
        Map<String, Double> spendByCustomer = ORDERS.stream().collect(Collectors.toMap(Order::customer, Order::amount, Double::sum, LinkedHashMap::new));
        System.out.println(bigOrders + " " + spendByCustomer);

        // reduce and statistics
        double total = ORDERS.stream().map(Order::amount).reduce(0.0, Double::sum);
        DoubleSummaryStatistics stats = ORDERS.stream().mapToDouble(Order::amount).summaryStatistics();
        System.out.printf("total %.0f, avg %.1f, max %.0f%n", total, stats.getAverage(), stats.getMax());
    }
}`),
        file("src/streams/CustomCollector.java", code`
package streams;

import java.util.StringJoiner;
import java.util.stream.Collector;
import java.util.stream.IntStream;
import java.util.stream.Stream;

public class CustomCollector {
    // A collector that builds an HTML list: supplier, accumulator, combiner, finisher
    static Collector<String, StringJoiner, String> toHtmlList() {
        return Collector.of(
            () -> new StringJoiner("", "<ul>", "</ul>"),
            (joiner, item) -> joiner.add("<li>" + item + "</li>"),
            StringJoiner::merge,                         // used by parallel streams
            StringJoiner::toString);
    }

    public static void main(String[] args) {
        System.out.println(Stream.of("Java", "Streams", "Collectors").collect(toHtmlList()));

        // Laziness: only as many elements as needed are processed
        Stream.iterate(1, n -> n + 1)
            .peek(n -> System.out.print("[" + n + "]"))
            .filter(n -> n % 7 == 0)
            .findFirst()
            .ifPresent(n -> System.out.println(" first multiple of 7: " + n));

        // Parallel stream: worthwhile for large CPU-bound work on splittable sources
        long primes = IntStream.rangeClosed(2, 2_000_000).parallel()
            .filter(n -> IntStream.rangeClosed(2, (int) Math.sqrt(n)).noneMatch(d -> n % d == 0))
            .count();
        System.out.println("primes below 2 million: " + primes);
    }
}`),
      ],
      tips: [
        "groupingBy returns a HashMap by default — pass TreeMap::new or EnumMap for ordered keys.",
        "toMap without a merge function throws IllegalStateException on duplicate keys.",
        "peek is for debugging; do not rely on it for side effects.",
        "Measure before using parallel streams; for I/O-bound work use virtual threads instead.",
      ],
      subjective: [
        qa("Explain groupingBy with downstream collectors with an example.", "Collectors.groupingBy(classifier) groups stream elements into a Map<K, List<T>> by the key the classifier returns. A second argument, a downstream collector, transforms each group instead of collecting it into a list: groupingBy(Order::city, counting()) gives orders per city; groupingBy(Order::city, summingDouble(Order::amount)) gives revenue per city; groupingBy(Order::city, mapping(Order::customer, toSet())) gives distinct customers per city. A three-argument form supplies the map type (TreeMap::new for sorted keys). Groupings can be nested: groupingBy(Order::city, groupingBy(Order::category, counting()))."),
        qa("When should you use parallel streams?", "Only when the workload is large, CPU-bound and stateless, the source splits efficiently (arrays, ArrayList, IntStream.range — not LinkedList or iterate), operations are independent and associative, and measurements show a speed-up. Avoid them for small data, I/O-bound or blocking work (they share the common ForkJoinPool), operations with side effects or ordering requirements (forEachOrdered, findFirst cost extra), and inside servers where the common pool is shared by all requests."),
      ],
      objective: [
        mcq("Collectors.partitioningBy returns a map keyed by:", ["String", "Boolean", "Integer", "Enum"], 1, "true and false groups."),
        mcq("Which collector combines two collectors' results in one pass?", ["joining", "teeing", "reducing", "flatMapping"], 1, "Added in Java 12."),
        mcq("Stream.toList() returns:", ["A mutable ArrayList", "An unmodifiable list", "A LinkedList", "An array"], 1, "Java 16+."),
        mcq("Stream.iterate(1, n -> n + 1).filter(n -> n > 5).findFirst() processes how many elements?", ["Infinite", "5", "6", "1"], 2, "Lazy evaluation stops at 6."),
      ],
    },
    {
      id: "date-time-api", module: "Stage 3 · Intermediate Java", title: "Dates and times with java.time", level: "Intermediate", minutes: 14,
      summary: "LocalDate, LocalDateTime, Instant, ZonedDateTime, Duration and Period, formatting and parsing, and time-zone pitfalls.",
      description: [
        "java.time (Java 8, JSR-310) replaced the error-prone Date and Calendar classes. Its types are immutable and thread-safe. LocalDate (a date without time or zone — birthdays, due dates), LocalTime, LocalDateTime (date and time without zone — avoid for timestamps of events), Instant (a point on the UTC timeline — machine timestamps), ZonedDateTime (date-time with a time-zone region such as Asia/Kolkata, handling daylight-saving changes) and OffsetDateTime (with a fixed offset, common in APIs and databases).",
        "Amounts of time: Duration measures time-based amounts (hours, minutes, seconds, nanos) and Period measures date-based amounts (years, months, days). ChronoUnit.DAYS.between(a, b) counts units. Arithmetic methods (plusDays, minusMonths, withDayOfMonth) return new objects; TemporalAdjusters find the next Monday or the last day of the month.",
        "DateTimeFormatter formats and parses: ISO formats are the default for toString/parse; custom patterns such as dd-MM-yyyy and hh:mm a use letters (y year, M month, d day, H 0–23 hour, h 1–12 hour, m minute, s second, a AM/PM). Note that mm is minutes and MM is months.",
        "Store timestamps as Instant (or UTC) and convert to the user's zone only for display. Inject a Clock into code that reads the current time so tests can control it.",
      ],
      usage: [
        "Due dates, age calculation, subscription renewals and EMI schedules → LocalDate and Period.",
        "Event timestamps, logs and database audit columns → Instant.",
        "Scheduling meetings across countries → ZonedDateTime with ZoneId.",
        "Measuring elapsed time → Duration or System.nanoTime.",
      ],
      files: [
        file("src/time/DatesDemo.java", code`
package time;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.Locale;

public class DatesDemo {
    static int age(LocalDate birth, Clock clock) { return Period.between(birth, LocalDate.now(clock)).getYears(); }

    public static void main(String[] args) {
        Clock clock = Clock.fixed(Instant.parse("2026-03-15T06:30:00Z"), ZoneId.of("Asia/Kolkata"));   // testable "now"

        LocalDate today = LocalDate.now(clock);
        LocalDate birth = LocalDate.of(2004, Month.AUGUST, 20);
        System.out.println("Age: " + age(birth, clock));                                           // 21

        LocalDate due = today.plusDays(30);
        LocalDate lastOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());
        LocalDate nextMonday = today.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        System.out.println(due + " " + lastOfMonth + " " + nextMonday + " days left: " + ChronoUnit.DAYS.between(today, due));

        Period loan = Period.ofMonths(18);
        System.out.println("Loan ends " + today.plus(loan) + " (" + loan + ")");                    // P18M

        Instant start = Instant.now(clock);
        Duration meeting = Duration.ofMinutes(95);
        System.out.println("Meeting ends at " + start.plus(meeting) + " lasting " + meeting.toHoursPart() + "h " + meeting.toMinutesPart() + "m");

        ZonedDateTime callInIndia = ZonedDateTime.of(2026, 3, 20, 19, 0, 0, 0, ZoneId.of("Asia/Kolkata"));
        ZonedDateTime callInNewYork = callInIndia.withZoneSameInstant(ZoneId.of("America/New_York"));
        System.out.println("India 7 PM = New York " + callInNewYork.toLocalTime());                  // 09:30 (EDT)

        DateTimeFormatter indian = DateTimeFormatter.ofPattern("dd-MM-yyyy hh:mm a", Locale.ENGLISH);
        LocalDateTime parsed = LocalDateTime.parse("15-08-2026 09:05 AM", indian);
        System.out.println(parsed + " -> " + parsed.format(DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy", Locale.ENGLISH)));
    }
}`),
      ],
      tips: [
        "java.time objects are immutable — date.plusDays(1) on its own line does nothing useful; assign the result.",
        "Month numbering in java.time starts at 1 (unlike old Calendar's 0).",
        "Use ZoneId names (Asia/Kolkata), not fixed abbreviations like IST, which are ambiguous.",
        "Map Instant/OffsetDateTime to TIMESTAMP WITH TIME ZONE columns in databases.",
      ],
      subjective: [
        qa("Differentiate LocalDateTime, ZonedDateTime and Instant.", "LocalDateTime is a date and time without any time zone or offset — it does not represent a specific moment (\"2026-03-20T19:00\" happens at different moments around the world); suitable for wall-clock values like store opening times. ZonedDateTime adds a ZoneId, identifying an exact moment and handling daylight-saving rules; suitable for scheduling across regions and display. Instant is an exact point on the UTC timeline (seconds and nanoseconds since the epoch) with no human calendar fields; suitable for timestamps, logs and storage."),
        qa("Differentiate Period and Duration.", "Period is a date-based amount in years, months and days (P1Y2M10D), used with LocalDate; adding a month respects calendar month lengths. Duration is a time-based amount in seconds and nanoseconds (PT1H30M), used with Instant, LocalTime and LocalDateTime; a day in Duration is always exactly 24 hours, whereas Period.ofDays(1) across a daylight-saving change may be 23 or 25 hours of elapsed time."),
      ],
      objective: [
        mcq("Which class represents a date without time and zone?", ["Instant", "LocalDate", "ZonedDateTime", "Date"], 1, "e.g. a birthday."),
        mcq("In DateTimeFormatter patterns, MM means:", ["Minutes", "Month", "Milliseconds", "Meridiem"], 1, "mm is minutes."),
        mcq("Which type is best for storing an event timestamp?", ["LocalDateTime", "Instant", "LocalTime", "Period"], 1, "An exact UTC moment."),
        mcq("java.time classes are:", ["Mutable and thread-unsafe", "Immutable and thread-safe", "Deprecated", "Only for Android"], 1, "Unlike java.util.Date."),
      ],
    },
    {
      id: "records-sealed-patterns", module: "Stage 4 · Modern Java (17–21)", title: "Records, sealed types and pattern matching", level: "Advanced", minutes: 20,
      summary: "Modelling data with records, closed hierarchies with sealed interfaces, and pattern matching with instanceof, switch and record deconstruction.",
      description: [
        "Records (Java 16) are transparent, immutable data carriers: record Money(long paise, String currency) generates a canonical constructor, accessors (paise(), not getPaise()), equals, hashCode and toString. Compact constructors validate or normalize arguments; records can implement interfaces, have static factories and instance methods, but cannot extend classes or declare extra instance fields.",
        "Sealed classes and interfaces (Java 17) list exactly which types may extend them: sealed interface Shape permits Circle, Square, Rectangle. Permitted subclasses must be final, sealed or non-sealed. Together with records they model algebraic data types — a value is one of a fixed set of shapes — and let the compiler check exhaustiveness.",
        "Pattern matching removes casts. instanceof patterns (Java 16): if (obj instanceof String s && !s.isEmpty()). Switch patterns (Java 21): case Circle c -> …, guards with when, case null, and exhaustive switches over sealed types with no default needed. Record patterns (Java 21) deconstruct records directly, even nested: case Line(Point(var x1, var y1), Point(var x2, var y2)) ->. Unnamed variables and patterns (_ ) are final in Java 22 for ignoring components.",
        "This trio enables data-oriented programming: describe data with records, constrain alternatives with sealed types, and write operations as exhaustive switches. When a new variant is added, the compiler flags every switch that must handle it.",
      ],
      usage: [
        "DTOs, API responses, events, configuration values and map keys → records.",
        "Result types (Success | Failure), commands, payment methods, expression trees → sealed interfaces + records.",
        "Parsing heterogeneous JSON or messages → pattern matching switch.",
        "Replace visitor-pattern boilerplate with exhaustive switches.",
      ],
      files: [
        file("src/modern/Shapes.java", code`
package modern;

public class Shapes {
    sealed interface Shape permits Circle, Rectangle, Triangle { }
    record Circle(double radius) implements Shape {
        Circle {                                                    // compact constructor
            if (radius <= 0) throw new IllegalArgumentException("radius must be positive");
        }
    }
    record Rectangle(double width, double height) implements Shape {
        static Rectangle square(double side) { return new Rectangle(side, side); }
    }
    record Triangle(double a, double b, double c) implements Shape { }

    // Exhaustive switch: no default needed; adding a new Shape breaks compilation here
    static double area(Shape shape) {
        return switch (shape) {
            case Circle c -> Math.PI * c.radius() * c.radius();
            case Rectangle(double w, double h) -> w * h;                   // record pattern
            case Triangle(var a, var b, var c) -> {
                double s = (a + b + c) / 2;
                yield Math.sqrt(s * (s - a) * (s - b) * (s - c));          // Heron's formula
            }
        };
    }

    static String describe(Object o) {
        return switch (o) {
            case null -> "nothing";
            case Rectangle(double w, double h) when w == h -> "square of side " + w;   // guard
            case Shape s -> s.getClass().getSimpleName() + " with area " + String.format("%.2f", area(s));
            case Integer i when i < 0 -> "negative number";
            case String str -> "text: " + str;
            default -> "unknown " + o;
        };
    }

    public static void main(String[] args) {
        Object[] things = { new Circle(1), Rectangle.square(3), new Rectangle(2, 5), new Triangle(3, 4, 5), -7, "hi", null };
        for (Object t : things) System.out.println(describe(t));
        System.out.println(new Rectangle(2, 5).equals(new Rectangle(2, 5)) + " " + new Circle(2));   // true Circle[radius=2.0]
    }
}`),
        file("src/modern/Results.java", code`
package modern;

import java.util.List;

// A sealed Result type: callers must handle both outcomes
public class Results {
    sealed interface Result<T> permits Ok, Err { }
    record Ok<T>(T value) implements Result<T> { }
    record Err<T>(String message, Throwable cause) implements Result<T> { }

    record Point(int x, int y) { }
    record Line(Point from, Point to) { }

    static Result<Integer> parsePort(String text) {
        try {
            int port = Integer.parseInt(text.trim());
            return port > 0 && port < 65_536 ? new Ok<>(port) : new Err<>("out of range: " + port, null);
        } catch (NumberFormatException e) {
            return new Err<>("not a number: " + text, e);
        }
    }

    static int lengthSquared(Object o) {
        // Nested record patterns deconstruct in one step
        if (o instanceof Line(Point(var x1, var y1), Point(var x2, var y2))) {
            return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        }
        return -1;
    }

    public static void main(String[] args) {
        for (String input : List.of("8080", "abc", "70000")) {
            String message = switch (parsePort(input)) {
                case Ok<Integer>(Integer port) -> "listening on " + port;
                case Err<Integer>(String msg, Throwable cause) -> "error: " + msg;
            };
            System.out.println(message);
        }
        System.out.println(lengthSquared(new Line(new Point(0, 0), new Point(3, 4))));   // 25
    }
}`),
      ],
      tips: [
        "Record accessors are name(), not getName() — some older libraries expecting JavaBeans need configuration.",
        "Records are shallowly immutable: wrap list components with List.copyOf in the compact constructor.",
        "Order switch cases from specific to general; a dominating earlier case is a compile error.",
        "Sealed hierarchies in the same file can omit permits — the compiler infers it.",
      ],
      subjective: [
        qa("What are records and how do they differ from regular classes?", "Records are a concise way to declare immutable data carriers. From record Point(int x, int y) the compiler generates private final fields, a canonical constructor, accessor methods x() and y(), and equals, hashCode and toString based on all components. Differences from classes: records are implicitly final and cannot extend other classes (they extend java.lang.Record); they cannot declare additional instance fields; component fields are final; they can still implement interfaces, declare static members, compact or custom constructors and methods. They express intent — “this is just data” — and eliminate boilerplate."),
        qa("What problem do sealed classes solve?", "They give control over inheritance. Without sealing, any class can implement a public interface, so code that switches over subtypes must always have a default case and can silently miss new subtypes. A sealed type declares its complete set of permitted subtypes, so the compiler knows all possibilities: switches can be exhaustive without default, adding a new subtype causes compile errors where it must be handled, and library authors can expose a type without allowing arbitrary implementations."),
        qa("Explain pattern matching for switch with an example.", "Since Java 21, switch can test the type and structure of its selector: case Circle c -> uses a type pattern binding c; case Rectangle(double w, double h) -> deconstructs a record; when adds a guard condition (case Integer i when i > 0); case null handles null instead of throwing. Over a sealed hierarchy the switch is checked for exhaustiveness. Example: return switch (shape) { case Circle c -> Math.PI * c.radius() * c.radius(); case Rectangle(double w, double h) -> w * h; };"),
      ],
      objective: [
        mcq("Accessor generated for record Point(int x, int y):", ["getX()", "x()", "X()", "fieldX()"], 1, "Records use component names."),
        mcq("A class permitted by a sealed interface must be declared:", ["abstract", "final, sealed or non-sealed", "static", "public"], 1, "One of the three modifiers (records are implicitly final)."),
        mcq("Can a record extend another class?", ["Yes", "No", "Only abstract classes", "Only Object explicitly"], 1, "Records implicitly extend java.lang.Record."),
        mcq("Which keyword adds a condition to a switch pattern case?", ["if", "where", "when", "guard"], 2, "case Integer i when i > 0 ->."),
        mcq("A switch over a sealed interface covering all permitted types:", ["Still needs default", "Is exhaustive without default", "Is a compile error", "Cannot use patterns"], 1, "The compiler verifies exhaustiveness."),
      ],
    },
    {
      id: "modern-syntax-apis", module: "Stage 4 · Modern Java (17–21)", title: "Modern syntax and APIs: var, text blocks, switch expressions and more", level: "Intermediate", minutes: 14,
      summary: "A tour of the everyday improvements from Java 10 to 21: var, text blocks, switch expressions, helpful NPEs, new String/Files/Collection methods and HttpClient.",
      description: [
        "Local variable type inference (Java 10): var lets the compiler infer the type of a local variable from its initializer (var orders = new ArrayList<Order>();). The variable is still statically typed. Use it when the type is obvious from the right-hand side; avoid it when it hides important information (var result = service.process();). var cannot be used for fields, parameters or without an initializer.",
        "Text blocks (Java 15) write multi-line strings between triple quotes, preserving line breaks and stripping incidental indentation — ideal for SQL, JSON, HTML and test data. formatted() fills placeholders, and \\ at a line end avoids a newline.",
        "Switch expressions (Java 14) return values, use arrow labels without fall-through, combine labels and use yield for blocks. Helpful NullPointerExceptions (Java 14+) name exactly which reference was null. Small API additions make daily code shorter: String.isBlank, strip, lines, repeat, indent, formatted; Files.readString/writeString; Collectors.teeing; Stream.toList; Math.clamp (Java 21); StringBuilder.repeat (Java 21); and Sequenced Collections' getFirst/getLast/reversed (Java 21).",
        "java.net.http.HttpClient (Java 11) supports HTTP/2, synchronous and asynchronous calls. jshell (Java 9) and single-file source launch (Java 11; multi-file in Java 22) make experimentation easy.",
      ],
      usage: [
        "Use text blocks for embedded SQL queries and JSON in tests.",
        "Use switch expressions for mapping enums or codes to values.",
        "Use var in loops and with long generic types to reduce noise.",
        "Upgrade old code gradually: these features are syntax-level and safe to adopt.",
      ],
      files: [
        file("src/modern/ModernSyntax.java", code`
package modern;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

public class ModernSyntax {
    enum Plan { FREE, PRO, TEAM, ENTERPRISE }

    static int seats(Plan plan) {
        return switch (plan) {                           // switch expression
            case FREE -> 1;
            case PRO -> 3;
            case TEAM, ENTERPRISE -> {
                int base = plan == Plan.TEAM ? 25 : 500;
                yield base;
            }
        };
    }

    public static void main(String[] args) throws Exception {
        var students = new HashMap<String, List<Integer>>();          // var: type inferred from the right side
        students.put("Asha", List.of(91, 88));
        for (var entry : students.entrySet()) System.out.println(entry.getKey() + " " + entry.getValue());

        String sql = """
            SELECT name, marks
            FROM student
            WHERE city = '%s'
              AND marks >= %d
            ORDER BY marks DESC
            """.formatted("Pune", 75);                                  // text block + formatted
        System.out.print(sql);

        String json = """
            {"plan": "%s", "seats": %d}\
            """.formatted(Plan.TEAM, seats(Plan.TEAM));                 // trailing \ joins the next line
        System.out.println(json);

        System.out.println("  ".isBlank() + " [" + "  hi  ".strip() + "] " + "ab".repeat(3) + " " + "a\nb\nc".lines().count());
        System.out.println(Math.clamp(150, 0, 100) + " " + new StringBuilder().repeat("-", 10));   // Java 21

        Path tmp = Files.createTempFile("demo", ".txt");
        Files.writeString(tmp, "written in one line");
        System.out.println(Files.readString(tmp));

        List<String> names = new ArrayList<>(List.of("Ravi", "Asha", "Meera"));
        System.out.println(names.getFirst() + " " + names.getLast() + " " + names.reversed());    // Java 21

        record Customer(String name, Address address) { }
        record Address(String city) { }
        try {
            Customer c = new Customer("Kabir", null);
            System.out.println(c.address().city().length());
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());   // Cannot invoke "Address.city()" because the return value of "Customer.address()" is null
        }
    }
}`),
        file("versions.md", code`
| Java | Year | Highlights you will use                                                     |
|------|------|-----------------------------------------------------------------------------|
| 8    | 2014 | Lambdas, streams, Optional, java.time, default methods                     |
| 9    | 2017 | Modules (JPMS), jshell, List.of/Set.of/Map.of                               |
| 10   | 2018 | var                                                                         |
| 11   | 2018 | HttpClient, String.isBlank/strip/lines/repeat, run single-file source (LTS) |
| 14   | 2020 | Switch expressions, helpful NullPointerExceptions                          |
| 15   | 2020 | Text blocks                                                                 |
| 16   | 2021 | Records, instanceof patterns, Stream.toList                                 |
| 17   | 2021 | Sealed classes (LTS)                                                        |
| 21   | 2023 | Virtual threads, pattern matching for switch, record patterns, sequenced collections (LTS) |
| 25   | 2025 | Next LTS: compact source files and instance main methods finalized          |`),
      ],
      tips: [
        "var with the diamond operator (var list = new ArrayList<>();) infers ArrayList<Object> — give the type argument.",
        "Text block indentation is measured from the closing delimiter's position.",
        "Switch expressions over enums must be exhaustive; a missing constant is a compile error.",
        "Target an LTS release (17, 21, 25) for production applications.",
      ],
      subjective: [
        qa("What are the rules and best practices for var?", "var can be used only for local variables with an initializer, enhanced for loop variables, traditional for loop indexes, try-with-resources variables and lambda parameters (Java 11). It cannot be used for fields, method parameters, return types, without an initializer, with null alone, or with array initializers without new. The variable remains statically typed. Best practice: use it when the type is evident from the right-hand side or the variable name, prefer it to reduce long generic noise, and avoid it when it hides the type a reader needs."),
        qa("What are text blocks and their advantages?", "Text blocks (Java 15) are multi-line string literals delimited by triple double quotes. They preserve line breaks, remove incidental leading indentation based on the least-indented line (including the closing delimiter), need almost no escaping of quotes, and support \\ (no newline) and \\s (explicit space). They make embedded SQL, JSON, HTML and XML readable and less error-prone than concatenated strings with \\n."),
      ],
      objective: [
        mcq("Which is NOT a valid use of var?", ["var list = new ArrayList<String>();", "for (var x : items)", "private var count = 0; (field)", "var stream = list.stream();"], 2, "Fields cannot use var."),
        mcq("Text blocks were finalized in Java:", ["11", "13", "15", "17"], 2, "Previewed in 13 and 14."),
        mcq("Which keyword returns a value from a block inside a switch expression?", ["return", "break", "yield", "give"], 2, "yield."),
        mcq("Which Java version is an LTS release?", ["19", "20", "21", "22"], 2, "17, 21 and 25 are LTS."),
      ],
    },
    {
      id: "virtual-threads", module: "Stage 4 · Modern Java (17–21)", title: "Virtual threads and modern concurrency", level: "Advanced", minutes: 18,
      summary: "Why platform threads limit servers, how virtual threads work, structured concurrency, and pitfalls such as pinning and pooling.",
      description: [
        "Traditionally each Java thread was a platform thread wrapping an operating-system thread — about 1 MB of stack and expensive to create — so thread-per-request servers topped out at a few thousand concurrent requests, pushing developers toward complex asynchronous code. Virtual threads (final in Java 21) are lightweight threads managed by the JVM: millions can exist, and when one blocks on I/O (socket read, JDBC call, sleep) the JVM unmounts it from its carrier platform thread so the carrier can run another virtual thread.",
        "Create them with Thread.ofVirtual().start(task), Thread.startVirtualThread(task) or, most commonly, Executors.newVirtualThreadPerTaskExecutor(), which starts one new virtual thread per submitted task. Code stays simple and blocking — no callbacks or reactive chains — while scaling like asynchronous code. Spring Boot enables them for request handling with spring.threads.virtual.enabled=true.",
        "Guidelines: do not pool virtual threads (they are cheap; create one per task); limit concurrency to scarce resources with a Semaphore; avoid ThreadLocal caches of expensive objects (there may be millions of threads); and know about pinning — a virtual thread blocking inside a synchronized block was pinned to its carrier until Java 24 removed most such cases (JEP 491); ReentrantLock never pinned. Virtual threads do not make CPU-bound work faster.",
        "Structured concurrency (StructuredTaskScope, preview in Java 21–24, evolving in later releases) treats a group of related subtasks as one unit: if one fails the others are cancelled, and the scope waits for all before returning. Scoped values (ScopedValue) are a lighter alternative to ThreadLocal for sharing immutable context across threads.",
      ],
      usage: [
        "Servers and clients doing lots of blocking I/O: REST calls, database queries, file access.",
        "Fan-out: call several services in parallel and combine results with simple code.",
        "Replace complex CompletableFuture chains where blocking style is clearer.",
        "Keep a fixed-size platform pool for CPU-heavy computation.",
      ],
      files: [
        file("src/vt/VirtualThreadsDemo.java", code`
package vt;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.*;
import java.util.stream.IntStream;

public class VirtualThreadsDemo {
    static String fetch(int id) {
        try { Thread.sleep(Duration.ofMillis(200)); }      // simulated blocking I/O: the virtual thread unmounts
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        return "result-" + id;
    }

    public static void main(String[] args) throws Exception {
        Instant start = Instant.now();
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {   // one virtual thread per task
            List<Future<String>> futures = IntStream.range(0, 10_000)
                .mapToObj(i -> executor.submit(() -> fetch(i)))
                .toList();
            long done = 0;
            for (Future<String> f : futures) if (f.get() != null) done++;
            System.out.println(done + " blocking tasks finished in " + Duration.between(start, Instant.now()).toMillis() + " ms");
        }   // ~200-400 ms instead of 10,000 x 200 ms sequentially, without a 10,000-thread platform pool

        Thread vt = Thread.ofVirtual().name("worker-", 0).start(() ->
            System.out.println(Thread.currentThread() + " isVirtual=" + Thread.currentThread().isVirtual()));
        vt.join();

        // Limit access to a scarce resource (e.g. 20 database connections) with a Semaphore, not a pool
        Semaphore dbPermits = new Semaphore(20);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 200; i++) {
                executor.submit(() -> {
                    dbPermits.acquire();
                    try { return fetch(0); } finally { dbPermits.release(); }
                });
            }
        }
        System.out.println("bounded work complete");
    }
}`),
        file("src/vt/FanOut.java", code`
package vt;

import java.util.concurrent.*;

// Fan-out with plain blocking code on virtual threads; the first failure cancels the rest
public class FanOut {
    record Profile(String user, String orders, String recommendations) { }

    static String call(String service, long ms, boolean fail) throws InterruptedException {
        Thread.sleep(ms);
        if (fail) throw new IllegalStateException(service + " unavailable");
        return service + " ok";
    }

    static Profile load(String user, boolean recommendationsDown) throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            Future<String> userF = executor.submit(() -> call("users", 120, false));
            Future<String> ordersF = executor.submit(() -> call("orders", 200, false));
            Future<String> recsF = executor.submit(() -> call("recommendations", 80, recommendationsDown));
            try {
                return new Profile(userF.get(), ordersF.get(), recsF.get());
            } catch (ExecutionException e) {
                userF.cancel(true); ordersF.cancel(true);                    // do not leave siblings running
                return new Profile(userF.state() == Future.State.SUCCESS ? userF.resultNow() : "n/a", "n/a", "fallback: popular items");
            }
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println(load("asha", false));
        System.out.println(load("asha", true));
        // StructuredTaskScope (preview) expresses the same "all succeed or cancel the rest" idea as a language-level scope.
    }
}`),
      ],
      tips: [
        "Thread.sleep, socket I/O and modern JDBC drivers all unmount virtual threads correctly.",
        "Use jcmd <pid> Thread.dump_to_file -format=json to see virtual threads in thread dumps.",
        "Do not wrap virtual threads in a fixed thread pool — that recreates the old limit.",
        "Measure: CPU-bound workloads gain nothing from virtual threads.",
      ],
      subjective: [
        qa("Differentiate platform threads and virtual threads.", "A platform thread is a thin wrapper over an OS thread: it has a large fixed stack, is costly to create and context-switch, and the OS can run only so many — usually thousands. A virtual thread is a JVM-managed thread whose stack lives on the heap and grows as needed; many virtual threads are multiplexed onto a small pool of carrier platform threads. When a virtual thread blocks on supported I/O, the JVM unmounts it and the carrier runs another one. Millions of virtual threads are practical, so simple thread-per-request blocking code scales to high concurrency. Virtual threads do not speed up CPU-bound tasks."),
        qa("Why should virtual threads not be pooled, and how do you limit concurrency instead?", "Pools exist to amortize the cost of expensive platform threads and to cap their number. Virtual threads are cheap to create and are meant to represent individual tasks, so pooling them adds complexity with no benefit and reintroduces artificial limits. When concurrency must be limited — for instance to protect a database with 20 connections or a rate-limited API — use a Semaphore (or a bounded resource pool such as a connection pool) around the protected operation."),
      ],
      objective: [
        mcq("Virtual threads became a final feature in Java:", ["17", "19", "21", "23"], 2, "Previewed in 19 and 20."),
        mcq("Which executor creates a new virtual thread for each task?", ["newFixedThreadPool", "newVirtualThreadPerTaskExecutor", "newCachedThreadPool", "newWorkStealingPool"], 1, "Executors.newVirtualThreadPerTaskExecutor()."),
        mcq("Virtual threads mainly improve:", ["CPU-bound computation speed", "Scalability of blocking I/O-bound workloads", "Garbage collection", "Startup time"], 1, "More concurrent blocking tasks."),
        mcq("Recommended way to limit concurrent database calls from virtual threads:", ["A fixed pool of virtual threads", "A Semaphore or connection pool", "synchronized on a global lock", "Thread priorities"], 1, "Limit the resource, not the threads."),
      ],
    },
    {
      id: "modules-jpms", module: "Stage 4 · Modern Java (17–21)", title: "The module system (JPMS) and jlink", level: "Advanced", minutes: 14,
      summary: "module-info.java, requires/exports/opens, strong encapsulation, services with uses/provides, and building small runtimes with jlink.",
      description: [
        "The Java Platform Module System (Java 9) groups packages into named modules with explicit dependencies and boundaries. A module is described by module-info.java at the root of its source tree: requires declares dependencies, exports makes packages accessible to other modules, opens allows deep reflection (needed by frameworks like Hibernate and Jackson), and uses/provides wire services through ServiceLoader.",
        "Benefits: reliable configuration (missing modules are detected at startup instead of as NoClassDefFoundError later), strong encapsulation (non-exported packages are inaccessible even if public), a modular JDK (java.base, java.sql, java.net.http…), and jlink, which builds a custom runtime image containing only the modules your application needs — useful for small Docker images and desktop apps.",
        "Most applications still run on the classpath (the unnamed module) and that works fine; many libraries are automatic modules (plain JARs on the module path get a name derived from the JAR). Strong encapsulation of JDK internals affects everyone, though: code that reflects into JDK internals needs --add-opens. Large frameworks such as Spring Boot typically run on the classpath.",
      ],
      usage: [
        "Libraries that want an enforced public API.",
        "Desktop and CLI tools shipped with a minimal jlink runtime.",
        "Plug-in architectures with ServiceLoader (uses/provides).",
        "Understanding --add-opens errors when upgrading old applications.",
      ],
      files: [
        file("greeter.api/src/module-info.java", code`
module greeter.api {
    exports com.mc.greeter.api;          // the only package others may use
}`),
        file("greeter.api/src/com/mc/greeter/api/Greeter.java", code`
package com.mc.greeter.api;

public interface Greeter {
    String greet(String name);
    String language();
}`),
        file("greeter.hindi/src/module-info.java", code`
module greeter.hindi {
    requires greeter.api;
    provides com.mc.greeter.api.Greeter with com.mc.greeter.hindi.HindiGreeter;   // service implementation
}`),
        file("greeter.hindi/src/com/mc/greeter/hindi/HindiGreeter.java", code`
package com.mc.greeter.hindi;

import com.mc.greeter.api.Greeter;

public class HindiGreeter implements Greeter {          // package not exported: only reachable as a service
    public String greet(String name) { return "Namaste, " + name; }
    public String language() { return "hi"; }
}`),
        file("app/src/module-info.java", code`
module app {
    requires greeter.api;
    uses com.mc.greeter.api.Greeter;      // discovers implementations at run time
}`),
        file("app/src/com/mc/app/Main.java", code`
package com.mc.app;

import com.mc.greeter.api.Greeter;
import java.util.ServiceLoader;

public class Main {
    public static void main(String[] args) {
        for (Greeter g : ServiceLoader.load(Greeter.class)) {
            System.out.println(g.language() + ": " + g.greet("Asha"));
        }
        // new com.mc.greeter.hindi.HindiGreeter();   // compile error: package not exported
    }
}`),
        file("build.sh", code`
javac -d out --module-source-path "./*/src" -m greeter.api,greeter.hindi,app
java --module-path out -m app/com.mc.app.Main

# Custom runtime with only the modules we need (~40 MB instead of a full JDK)
jlink --module-path "$JAVA_HOME/jmods:out" --add-modules app,greeter.hindi \
      --launcher greet=app/com.mc.app.Main --strip-debug --no-header-files --no-man-pages --output dist
./dist/bin/greet

jdeps --list-deps out/app       # which JDK modules does the code use?`),
      ],
      tips: [
        "Public no longer means accessible to everyone — only to modules that read yours and only for exported packages.",
        "requires transitive re-exports a dependency to your module's consumers.",
        "Split packages (the same package in two modules) are not allowed on the module path.",
        "Use jdeps to find dependencies on JDK internals before migrating.",
      ],
      subjective: [
        qa("Explain the main directives of module-info.java.", "module name { … } declares a module. requires M — this module depends on module M (requires transitive M also exposes M to readers; requires static M is compile-time only). exports p — makes package p's public types accessible to other modules (exports p to M qualifies it). opens p — allows deep reflection on package p at run time (open module opens all). uses S — this module consumes service interface S via ServiceLoader. provides S with Impl — this module supplies Impl as an implementation of S."),
        qa("What are the benefits of the Java Platform Module System?", "Reliable configuration: the module graph is checked at startup, so missing or duplicate modules fail fast. Strong encapsulation: only exported packages are accessible, protecting internal APIs. Scalable platform: the JDK itself is split into modules, enabling smaller runtimes with jlink for containers and devices. Improved security and maintainability: smaller attack surface and explicit dependencies. Services: decoupled plug-ins through uses/provides."),
      ],
      objective: [
        mcq("Which file describes a module?", ["module.xml", "module-info.java", "pom.xml", "MANIFEST.MF"], 1, "At the root of the module's sources."),
        mcq("Which directive allows deep reflection at run time?", ["exports", "opens", "requires", "provides"], 1, "Needed by many frameworks."),
        mcq("Which tool creates a custom runtime image?", ["jar", "jlink", "jdeps", "javap"], 1, "jdeps analyses dependencies."),
        mcq("Code on the classpath runs in:", ["java.base", "The unnamed module", "An automatic module", "No module"], 1, "It can read every other module."),
      ],
    },
    {
      id: "build-tools", module: "Stage 5 · Professional Java", title: "Build tools: Maven and Gradle", level: "Intermediate", minutes: 16,
      summary: "Project layout, coordinates and dependencies, scopes, the Maven lifecycle, Gradle tasks, wrappers and multi-module builds.",
      description: [
        "Real projects use build tools to compile, test, package and manage dependencies reproducibly. Both Maven and Gradle use the standard layout: src/main/java, src/main/resources, src/test/java, src/test/resources. Libraries are identified by coordinates — groupId:artifactId:version — and downloaded from Maven Central (or a company repository), including their transitive dependencies.",
        "Maven is declarative XML (pom.xml) with a fixed lifecycle: validate → compile → test → package → verify → install → deploy. Running a phase runs all earlier phases (mvn package compiles and tests first). Plugins bind goals to phases. Dependency scopes: compile (default), provided (supplied at run time, e.g. servlet API), runtime (JDBC drivers), test (JUnit). dependencyManagement and BOMs (such as Spring Boot's) align versions.",
        "Gradle uses a Kotlin or Groovy DSL (build.gradle.kts) and a task graph with incremental builds and a build cache, making it faster for large projects; Android uses it. Configurations: implementation, api (libraries), compileOnly, runtimeOnly, testImplementation. Common tasks: build, test, run, jar, dependencies.",
        "Always commit the wrapper (mvnw / gradlew) so everyone and CI use the same build tool version. Multi-module builds split large applications into modules (domain, persistence, web) with explicit dependencies between them.",
      ],
      usage: [
        "Every professional Java project: CI pipelines run ./mvnw verify or ./gradlew build.",
        "Inspect conflicts with mvn dependency:tree or gradle dependencies.",
        "Pin plugin and dependency versions; update them deliberately (Dependabot/Renovate).",
        "Use profiles/flags for environment-specific builds sparingly; prefer runtime configuration.",
      ],
      files: [
        file("pom.xml", code`
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mc</groupId>
  <artifactId>gradebook</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>jar</packaging>

  <properties>
    <maven.compiler.release>21</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencyManagement>
    <dependencies>
      <dependency>                               <!-- BOM: aligned JUnit versions -->
        <groupId>org.junit</groupId><artifactId>junit-bom</artifactId><version>5.11.3</version>
        <type>pom</type><scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <dependencies>
    <dependency><groupId>org.slf4j</groupId><artifactId>slf4j-api</artifactId><version>2.0.16</version></dependency>
    <dependency><groupId>ch.qos.logback</groupId><artifactId>logback-classic</artifactId><version>1.5.12</version><scope>runtime</scope></dependency>
    <dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><version>42.7.4</version><scope>runtime</scope></dependency>
    <dependency><groupId>org.junit.jupiter</groupId><artifactId>junit-jupiter</artifactId><scope>test</scope></dependency>
    <dependency><groupId>org.mockito</groupId><artifactId>mockito-junit-jupiter</artifactId><version>5.14.2</version><scope>test</scope></dependency>
    <dependency><groupId>org.assertj</groupId><artifactId>assertj-core</artifactId><version>3.26.3</version><scope>test</scope></dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-surefire-plugin</artifactId><version>3.5.2</version></plugin>
    </plugins>
  </build>
</project>`),
        file("build.gradle.kts", code`
plugins {
    java
    application
}

group = "com.mc"
version = "1.0.0-SNAPSHOT"

java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }   // Gradle downloads JDK 21 if needed

repositories { mavenCentral() }

dependencies {
    implementation("org.slf4j:slf4j-api:2.0.16")
    runtimeOnly("ch.qos.logback:logback-classic:1.5.12")
    runtimeOnly("org.postgresql:postgresql:42.7.4")
    testImplementation(platform("org.junit:junit-bom:5.11.3"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testImplementation("org.assertj:assertj-core:3.26.3")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

application { mainClass = "grades.Main" }

tasks.test { useJUnitPlatform() }`),
        file("commands.sh", code`
# Maven (wrapper pins the Maven version)
./mvnw clean verify              # compile, test, package, run checks
./mvnw dependency:tree           # find transitive dependencies and conflicts
./mvnw -q -DskipTests package    # quick package without tests (not for CI)
./mvnw versions:display-dependency-updates

# Gradle
./gradlew build                  # compile, test, assemble
./gradlew run                    # application plugin
./gradlew dependencies --configuration runtimeClasspath
./gradlew test --tests "grades.*"

# Standard layout used by both
# src/main/java  src/main/resources  src/test/java  src/test/resources`),
      ],
      tips: [
        "SNAPSHOT versions change over time; releases are immutable.",
        "“Nearest wins” in Maven dependency mediation can pick an unexpected version — check dependency:tree.",
        "Never commit target/ or build/ directories.",
        "Use maven.compiler.release (not source/target) so the JDK API matches the target version.",
      ],
      subjective: [
        qa("Explain the Maven build lifecycle.", "Maven's default lifecycle is an ordered sequence of phases: validate (project is correct), compile (main sources), test (run unit tests with Surefire), package (create JAR/WAR), verify (integration tests and quality checks), install (copy the artifact into the local repository ~/.m2) and deploy (upload to a remote repository). Invoking a phase executes all preceding phases. Plugins bind goals to phases (compiler:compile to compile, surefire:test to test). Separate lifecycles exist for clean and site."),
        qa("Compare Maven and Gradle.", "Maven uses declarative XML with a rigid, convention-based lifecycle; it is predictable, widely understood, and has excellent IDE support, but customization requires plugins and builds can be slower. Gradle uses a programmable Kotlin/Groovy DSL and a task graph with incremental compilation, a build cache and a daemon, making large builds faster and custom logic easier; it is the Android standard, but scripts can become complex and harder to read. Both use Maven repositories and the same project layout."),
      ],
      objective: [
        mcq("Which Maven scope is used for a JDBC driver needed only at run time?", ["compile", "provided", "runtime", "test"], 2, "Not needed to compile your code."),
        mcq("Running mvn package also runs:", ["Only package", "compile and test first", "deploy", "install"], 1, "Phases run in order."),
        mcq("Gradle configuration for test-only libraries:", ["implementation", "api", "testImplementation", "compileOnly"], 2, "Available to test compilation and execution."),
        mcq("Why commit mvnw/gradlew?", ["Faster compile", "Everyone uses the same build tool version", "Required by Java", "To skip tests"], 1, "Reproducible builds."),
      ],
    },
    {
      id: "testing-junit-mockito", module: "Stage 5 · Professional Java", title: "Testing with JUnit 5, AssertJ and Mockito", level: "Intermediate", minutes: 20,
      summary: "Writing unit tests, the test pyramid, lifecycle annotations, parameterized tests, assertions, mocking dependencies and test-driven development.",
      description: [
        "Automated tests prove that code works and keep it working as it changes. The test pyramid suggests many fast unit tests (one class, dependencies faked), fewer integration tests (real database, HTTP) and a few end-to-end tests. A good unit test follows Arrange–Act–Assert, tests one behaviour, has a descriptive name, and is fast, isolated and repeatable.",
        "JUnit 5 (Jupiter) basics: @Test, @DisplayName, lifecycle hooks @BeforeEach/@AfterEach/@BeforeAll/@AfterAll, @Nested for grouping, @Disabled, assertThrows and assertAll, and @ParameterizedTest with sources (@ValueSource, @CsvSource, @MethodSource) to run one test with many inputs. AssertJ offers fluent, readable assertions (assertThat(list).hasSize(3).contains(\"Asha\")).",
        "Mockito replaces collaborators with mocks: mock(Repository.class) or @Mock with @ExtendWith(MockitoExtension.class), stub with when(...).thenReturn(...) or thenThrow, verify interactions with verify(mock).save(any()), and capture arguments with ArgumentCaptor. Mock only what you own and what is slow or external; prefer real value objects. Over-mocking produces tests that mirror implementation details and break on every refactor.",
        "Test-driven development (TDD) cycles red → green → refactor: write a failing test, make it pass with the simplest code, then clean up. Code coverage tools (JaCoCo) show untested lines but coverage percentage alone does not prove quality.",
      ],
      usage: [
        "Unit-test business rules (pricing, validation, state transitions) thoroughly.",
        "Use parameterized tests for boundary values and tables of examples.",
        "Mock repositories, gateways and clocks; keep domain objects real.",
        "Run tests in CI on every push; fix flaky tests immediately.",
      ],
      files: [
        file("src/main/java/shop/PriceCalculator.java", code`
package shop;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class PriceCalculator {
    public interface CouponRepository { java.util.Optional<Integer> percentFor(String code); }

    private final CouponRepository coupons;
    public PriceCalculator(CouponRepository coupons) { this.coupons = coupons; }

    public BigDecimal finalPrice(BigDecimal base, int quantity, String couponCode) {
        if (base.signum() < 0) throw new IllegalArgumentException("price must not be negative");
        if (quantity <= 0) throw new IllegalArgumentException("quantity must be positive");
        BigDecimal subtotal = base.multiply(BigDecimal.valueOf(quantity));
        if (quantity >= 10) subtotal = subtotal.multiply(new BigDecimal("0.95"));          // 5% bulk discount
        int percent = couponCode == null ? 0 : coupons.percentFor(couponCode).orElse(0);
        BigDecimal afterCoupon = subtotal.multiply(BigDecimal.valueOf(100 - percent)).divide(BigDecimal.valueOf(100));
        return afterCoupon.setScale(2, RoundingMode.HALF_UP);
    }
}`),
        file("src/test/java/shop/PriceCalculatorTest.java", code`
package shop;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriceCalculatorTest {
    @Mock PriceCalculator.CouponRepository coupons;          // collaborator replaced by a mock
    PriceCalculator calculator;

    @BeforeEach
    void setUp() { calculator = new PriceCalculator(coupons); }

    @Test
    @DisplayName("no coupon and small quantity: plain multiplication")
    void plainPrice() {
        assertThat(calculator.finalPrice(new BigDecimal("99.99"), 2, null)).isEqualByComparingTo("199.98");
        verifyNoInteractions(coupons);                        // no lookup without a code
    }

    @ParameterizedTest(name = "{1} x {0} = {2}")
    @CsvSource({ "100, 9, 900.00", "100, 10, 950.00", "100, 20, 1900.00" })   // boundary at 10
    void bulkDiscountStartsAtTen(String price, int qty, String expected) {
        assertThat(calculator.finalPrice(new BigDecimal(price), qty, null)).isEqualByComparingTo(expected);
    }

    @Test
    void appliesCouponFromRepository() {
        when(coupons.percentFor("DIWALI20")).thenReturn(Optional.of(20));      // stub
        assertThat(calculator.finalPrice(new BigDecimal("500"), 1, "DIWALI20")).isEqualByComparingTo("400.00");
        verify(coupons).percentFor("DIWALI20");                              // interaction check
    }

    @Test
    void unknownCouponIsIgnored() {
        when(coupons.percentFor(anyString())).thenReturn(Optional.empty());
        assertThat(calculator.finalPrice(new BigDecimal("500"), 1, "FAKE")).isEqualByComparingTo("500.00");
    }

    @Nested
    class InvalidInput {
        @Test
        void rejectsNegativePrice() {
            assertThatThrownBy(() -> calculator.finalPrice(new BigDecimal("-1"), 1, null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("negative");
        }

        @Test
        void rejectsZeroQuantity() {
            assertThrows(IllegalArgumentException.class, () -> calculator.finalPrice(BigDecimal.TEN, 0, null));
        }
    }
}`),
      ],
      tips: [
        "Compare BigDecimal with isEqualByComparingTo — equals also compares scale (2.0 ≠ 2.00).",
        "Name tests after behaviour: rejectsZeroQuantity, not testMethod2.",
        "Mockito's strict stubs fail tests with unused stubbings — remove them rather than suppressing.",
        "A test that never fails is useless: break the code once to see it go red.",
      ],
      subjective: [
        qa("What is the difference between a mock, a stub and a spy?", "A stub provides canned answers to calls made during the test (when(repo.find(1)).thenReturn(user)), letting you control indirect inputs. A mock is an object on which you also verify interactions — that certain methods were called with certain arguments (verify(mailer).send(...)); in Mockito, the same mock object can be used as both. A spy wraps a real object, delegating to real methods unless specific ones are stubbed, and records interactions — useful for partial mocking of legacy code, but a sign the design may need improvement."),
        qa("Explain TDD and its benefits.", "Test-Driven Development repeats a short cycle: Red — write a small failing test for the next behaviour; Green — write the minimum code to make it pass; Refactor — improve the code and tests while keeping all tests green. Benefits: requirements are clarified before coding, code is designed to be testable (small units, injected dependencies), a regression safety net grows continuously, and refactoring becomes safe. Costs: discipline and time up front, and it fits poorly with highly exploratory work."),
        qa("What makes a good unit test?", "FIRST: Fast (milliseconds), Isolated/Independent (no shared state or ordering between tests), Repeatable (same result anywhere, no real clock/network), Self-validating (passes or fails automatically through assertions), Timely (written with or before the code). It also tests one behaviour, has a descriptive name, follows Arrange–Act–Assert, uses realistic but minimal data, and asserts outcomes rather than internal implementation details."),
      ],
      objective: [
        mcq("Which JUnit 5 annotation runs a test with multiple inputs?", ["@RepeatedTest", "@ParameterizedTest", "@TestFactory only", "@Multiple"], 1, "Combined with a source like @CsvSource."),
        mcq("Which annotation runs before each test method?", ["@BeforeAll", "@BeforeEach", "@Before", "@Setup"], 1, "@Before was JUnit 4."),
        mcq("Mockito method to check that a method was called:", ["check()", "verify()", "assertCalled()", "expect()"], 1, "verify(mock).method(args)."),
        mcq("In TDD, the first step is to:", ["Write production code", "Write a failing test", "Refactor", "Deploy"], 1, "Red, green, refactor."),
        mcq("Which assertion verifies an exception in JUnit 5?", ["assertException", "assertThrows", "expectThrow", "@Test(expected=...)"], 1, "The expected attribute was JUnit 4."),
      ],
    },
    {
      id: "jvm-performance", module: "Stage 5 · Professional Java", title: "JVM performance: profiling, GC tuning and benchmarking", level: "Advanced", minutes: 18,
      summary: "How the JIT optimizes code, choosing a garbage collector, finding hot spots with JFR, writing correct microbenchmarks with JMH, and common performance mistakes.",
      description: [
        "Performance work starts with measurement, not guessing. Define the goal (latency percentile, throughput, memory), measure in a production-like environment, find the bottleneck, change one thing, and measure again. Most real bottlenecks are I/O, database queries, contention or allocation churn — not the speed of a for loop.",
        "The JVM optimizes at run time: tiered JIT compilation (C1 then C2) uses profiling data for inlining, escape analysis (allocations that never escape may be removed), loop unrolling and dead-code elimination. Code must therefore warm up before measurements are meaningful, which is why naïve System.nanoTime microbenchmarks lie. JMH (Java Microbenchmark Harness) handles warm-up, forking, dead-code elimination and statistics correctly.",
        "Garbage collectors: G1 (default) balances throughput and pause times; ZGC (generational since Java 21) and Shenandoah keep pauses under a millisecond for large heaps; Parallel GC maximizes throughput for batch jobs; Serial suits tiny heaps. Start with defaults, set -Xmx appropriately (or MaxRAMPercentage in containers), and tune only with GC logs as evidence.",
        "Java Flight Recorder (JFR) is a low-overhead profiler built into the JVM — start with -XX:StartFlightRecording or jcmd JFR.start — and JDK Mission Control visualizes hot methods, allocations, locks, GC and I/O. Common fixes: use StringBuilder in loops, avoid boxing in hot paths, pre-size collections, cache expensive objects (DateTimeFormatter, compiled Pattern), batch database calls and fix N+1 queries, use appropriate data structures, and reduce lock contention.",
      ],
      usage: [
        "Investigate latency spikes with GC logs and JFR recordings.",
        "Compare implementations with JMH before choosing a “faster” approach.",
        "Right-size heaps and choose ZGC for latency-sensitive services with large heaps.",
        "Profile allocations when CPU is high and GC runs frequently.",
      ],
      files: [
        file("src/jmh/StringJoinBenchmark.java", code`
package jmh;

import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@Warmup(iterations = 3, time = 1)          // let the JIT compile and optimize first
@Measurement(iterations = 5, time = 1)
@Fork(1)                                   // fresh JVM for isolation
@State(Scope.Thread)
public class StringJoinBenchmark {
    @Param({ "100", "10000" }) int size;

    @Benchmark
    public String concatInLoop() {
        String s = "";
        for (int i = 0; i < size; i++) s += i;           // creates a new String each iteration: O(n^2) copying
        return s;
    }

    @Benchmark
    public String stringBuilder() {
        StringBuilder sb = new StringBuilder(size * 5);  // pre-sized buffer
        for (int i = 0; i < size; i++) sb.append(i);
        return sb.toString();
    }

    @Benchmark
    public void streamJoining(Blackhole bh) {            // Blackhole prevents dead-code elimination
        bh.consume(IntStream.range(0, size).mapToObj(Integer::toString).collect(Collectors.joining()));
    }
}`),
        file("src/perf/HotPathFixes.java", code`
package perf;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

public class HotPathFixes {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd-MM-yyyy");  // immutable: create once
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");     // compile once

    static long sumBoxed(List<Integer> values) {           // unboxing on every iteration
        Long total = 0L;
        for (Integer v : values) total += v;               // also boxes a new Long each time
        return total;
    }

    static long sumPrimitive(int[] values) {
        long total = 0;
        for (int v : values) total += v;
        return total;
    }

    static boolean validEmail(String s) { return EMAIL.matcher(s).matches(); }   // not s.matches(regex) per call

    static List<String> format(List<LocalDate> dates) {
        List<String> out = new ArrayList<>(dates.size());  // pre-size: no repeated growth
        for (LocalDate d : dates) out.add(d.format(DATE));
        return out;
    }

    public static void main(String[] args) {
        int[] nums = java.util.stream.IntStream.rangeClosed(1, 1_000_000).toArray();
        System.out.println(sumPrimitive(nums) + " " + sumBoxed(java.util.Arrays.stream(nums).boxed().toList()));
        System.out.println(validEmail("asha@mc.dev") + " " + format(List.of(LocalDate.of(2026, 8, 15))));
    }
}`),
        file("profiling.sh", code`
# GC logging and a flight recording from startup
java -Xmx2g -XX:+UseZGC -Xlog:gc*:file=gc.log:time,uptime \
     -XX:StartFlightRecording=duration=120s,filename=app.jfr,settings=profile \
     -jar app.jar

# On a running JVM
jcmd <pid> JFR.start duration=60s filename=live.jfr
jcmd <pid> GC.heap_info
jcmd <pid> Thread.print          # look for BLOCKED threads and lock contention

# Open app.jfr in JDK Mission Control: Method Profiling, Allocations, Lock Instances, GC pauses

# Run JMH benchmarks (Maven archetype project)
mvn clean package && java -jar target/benchmarks.jar StringJoinBenchmark`),
      ],
      tips: [
        "Never benchmark with a single System.nanoTime around one run — use JMH.",
        "Optimize algorithms and I/O before micro-optimizing code.",
        "Watch the p99 latency, not just the average.",
        "Regex Pattern and DateTimeFormatter are thread-safe and should be static constants; SimpleDateFormat is not thread-safe.",
      ],
      subjective: [
        qa("Why are naïve microbenchmarks in Java unreliable?", "The JVM interprets code first and JIT-compiles it later, so early iterations measure the interpreter. The JIT may eliminate code whose result is unused (dead-code elimination), hoist or constant-fold computations, and optimize differently depending on profiling from earlier code in the same JVM. Garbage collection pauses, CPU frequency scaling and OS noise add variance. JMH addresses these with warm-up iterations, multiple forks, Blackhole consumption of results, and statistical reporting."),
        qa("How would you investigate a Java service that has become slow?", "1. Quantify: which endpoints, latency percentiles, since when, correlated with deploys or traffic. 2. Check resources and dependencies: CPU, memory, GC logs (long or frequent pauses), database slow queries, downstream latency, thread pool or connection pool exhaustion. 3. Capture evidence: thread dumps (jcmd Thread.print) for blocked threads and contention; a JFR recording for hot methods, allocations, locks and I/O; heap dumps for leaks. 4. Form a hypothesis, fix one thing (an index, an N+1 query, a lock, a cache, heap size), and verify with the same measurements. 5. Add monitoring or a load test so the regression is caught next time."),
      ],
      objective: [
        mcq("Which tool is the standard for Java microbenchmarks?", ["JUnit", "JMH", "JConsole", "javap"], 1, "Java Microbenchmark Harness."),
        mcq("Low-latency garbage collector with sub-millisecond pauses:", ["Serial", "Parallel", "ZGC", "CMS"], 2, "Shenandoah is another option."),
        mcq("Built-in low-overhead JVM profiler:", ["JFR (Java Flight Recorder)", "jdb", "jlink", "jstatd only"], 0, "Analyse recordings in JDK Mission Control."),
        mcq("Which is thread-safe and can be a static constant?", ["SimpleDateFormat", "DateTimeFormatter", "StringBuilder", "ArrayList"], 1, "java.time formatters are immutable."),
      ],
    },
  ],
};
