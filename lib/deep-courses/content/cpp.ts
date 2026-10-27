import type { DeepCourse } from "../types";
import { DEEP_COURSES } from "../index";
import { code, file, mcq, qa } from "./helpers";

export const COURSE: DeepCourse = {
  ...DEEP_COURSES.find(course => course.id === "cpp")!,
  intro: [
    "C++ gives you direct control over memory and performance with high-level abstractions on top: classes, templates and the Standard Library. It powers game engines, browsers, databases, trading systems, embedded devices and competitive programming.",
    "The course moves from compilation and basic syntax through pointers, OOP and copy control to templates, the STL, smart pointers, move semantics and threads. Examples use C++17/20 and compile with g++ -std=c++20 -Wall -Wextra. Every topic ends with university-exam and interview questions.",
  ],
  topics: [
    {
      id: "compilation-basics", module: "Foundations", title: "How a C++ program is built: preprocessing, compiling, linking", level: "Beginner", minutes: 15,
      summary: "Source and header files, the four build stages, main, iostream, namespaces and the one-definition rule.",
      description: [
        "C++ is compiled ahead of time to native machine code. Building a program has four stages: the preprocessor handles directives (#include copies header text, #define macros, #ifdef conditional compilation); the compiler turns each translation unit (a .cpp after preprocessing) into assembly and an object file; the assembler produces machine code; and the linker combines object files and libraries into an executable, resolving references between them.",
        "Code is split into headers (.h/.hpp) containing declarations — class definitions, function prototypes, templates — and source files (.cpp) containing definitions. Include guards (#ifndef/#define/#endif) or #pragma once stop a header from being included twice in one translation unit. The One Definition Rule says a non-inline function or variable may be defined only once in the whole program; violating it causes “multiple definition” linker errors, while a missing definition causes “undefined reference”.",
        "Execution starts at int main() (or int main(int argc, char* argv[])). Returning 0 means success. Console I/O uses std::cout and std::cin from <iostream> with the << and >> operators. Names in the standard library live in namespace std; write std::cout or a targeted using std::cout; — avoid using namespace std; in headers because it pollutes every file that includes them.",
      ],
      usage: [
        "Compile with warnings on: g++ -std=c++20 -Wall -Wextra -O2 main.cpp -o app.",
        "Split programs into a header per component and a matching .cpp; compile each separately and link.",
        "Use CMake for real projects so builds work across compilers and IDEs.",
        "Read the first compiler error first — later errors are often consequences of it.",
      ],
      files: [
        file("include/geometry.hpp", code`
#pragma once                      // include guard: safe to include many times
#include <string>

namespace geo {                   // our names do not clash with others
    constexpr double PI = 3.141592653589793;

    double circleArea(double r);  // declaration only
    std::string describe(double r);
}`),
        file("src/geometry.cpp", code`
#include "geometry.hpp"
#include <sstream>

namespace geo {
    double circleArea(double r) { return PI * r * r; }   // definition: exactly once (ODR)

    std::string describe(double r) {
        std::ostringstream out;
        out << "circle(r=" << r << ") area=" << circleArea(r);
        return out.str();
    }
}`),
        file("src/main.cpp", code`
#include <iostream>
#include "geometry.hpp"

int main(int argc, char* argv[]) {
    double r = 0;
    std::cout << "Radius: ";
    if (!(std::cin >> r) || r < 0) {          // check that input succeeded
        std::cerr << "Please enter a non-negative number\n";
        return 1;                             // non-zero: failure
    }
    std::cout << geo::describe(r) << '\n';
    std::cout << "Program name: " << argv[0] << ", args: " << argc - 1 << '\n';
    return 0;
}`),
        file("CMakeLists.txt", code`
cmake_minimum_required(VERSION 3.20)
project(Geometry CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
add_executable(app src/main.cpp src/geometry.cpp)
target_include_directories(app PRIVATE include)
target_compile_options(app PRIVATE -Wall -Wextra -Wpedantic)`),
        file("build.sh", code`
g++ -std=c++20 -E src/main.cpp -Iinclude | tail -5     # stop after preprocessing
g++ -std=c++20 -c src/geometry.cpp -Iinclude            # compile only -> geometry.o
g++ -std=c++20 -c src/main.cpp -Iinclude                # -> main.o
g++ main.o geometry.o -o app                            # link
./app`),
      ],
      tips: [
        "'\\n' is usually preferred over std::endl, which also flushes the stream and is slower in loops.",
        "“undefined reference” is a linker error (definition missing); “was not declared” is a compiler error (declaration missing).",
        "Templates and inline functions are defined in headers, because every translation unit that uses them needs the definition.",
        "C++ is case-sensitive and main must return int — void main() is not standard.",
      ],
      subjective: [
        qa("Explain the stages of compiling a C++ program.", "1. Preprocessing: handles #include (pastes header contents), #define macros and conditional compilation, producing a translation unit. 2. Compilation: parses and type-checks the translation unit and generates assembly. 3. Assembly: converts assembly to machine code in an object file (.o/.obj) containing unresolved symbol references. 4. Linking: combines object files and libraries, resolves symbols across them, and produces the executable (or reports undefined/multiple definitions)."),
        qa("What is a namespace? Why should using namespace std be avoided in headers?", "A namespace is a named scope that groups identifiers to prevent name collisions, e.g. std::vector vs mylib::vector. A using-directive in a header injects every std name into the global scope of every file that includes it, causing ambiguous calls and subtle overload changes in code you do not control. Prefer qualified names or narrow using-declarations inside functions or .cpp files."),
        qa("Differentiate declaration and definition.", "A declaration introduces a name and its type so it can be used (int add(int, int); extern int count; class Node;). A definition additionally provides the body or allocates storage (int add(int a, int b) { return a + b; } int count = 0;). A name may be declared many times but, by the One Definition Rule, defined only once in a program (with exceptions for inline functions, templates and class definitions, which must be identical across translation units)."),
      ],
      objective: [
        mcq("Which stage resolves calls between object files?", ["Preprocessor", "Compiler", "Assembler", "Linker"], 3, "The linker resolves external symbols."),
        mcq("What does #pragma once do?", ["Optimizes once", "Prevents multiple inclusion of a header in one translation unit", "Runs code once", "Declares a singleton"], 1, "Equivalent to include guards on all major compilers."),
        mcq("Which header provides std::cout?", ["<stdio.h>", "<iostream>", "<conio.h>", "<string>"], 1, "<iostream> declares the standard streams."),
        mcq("Return type of main in standard C++:", ["void", "int", "any", "bool"], 1, "Falling off the end of main returns 0."),
        mcq("“undefined reference to foo()” usually means:", ["foo was declared but its definition was not linked", "A syntax error in foo", "foo is defined twice", "A runtime crash"], 0, "Add the .cpp or library that defines foo."),
      ],
    },
    {
      id: "types-control-functions", module: "Foundations", title: "Types, control flow and functions", level: "Beginner", minutes: 18,
      summary: "Fundamental types, auto and const, references in parameters, overloading, default arguments, inline and constexpr functions.",
      description: [
        "Fundamental types: bool, char (1 byte), short, int, long, long long, float, double, long double, each with signed/unsigned variants for integers. Sizes are implementation-defined with minimums (int ≥ 16 bits; usually 32); <cstdint> gives exact widths (int32_t, uint64_t). Signed integer overflow is undefined behaviour, unsigned arithmetic wraps. Prefer brace initialization (int x{5};), which rejects narrowing conversions.",
        "auto deduces a variable's type from its initializer; const makes a value read-only; constexpr requires a compile-time constant. Control flow mirrors C: if/else (with C++17 initializers: if (auto it = m.find(k); it != m.end())), switch (falls through without break), while, do-while, for and range-based for (for (const auto& x : v)).",
        "Functions can be passed arguments by value (a copy), by reference (T&, the function can modify the caller's object) or by const reference (const T&, no copy and no modification — the default for large objects). Overloading allows several functions with the same name but different parameter lists; default arguments supply trailing parameters. inline suggests inlining and, more importantly, permits definitions in headers; constexpr functions can be evaluated at compile time. Recursion works as usual, with stack depth limits.",
      ],
      usage: [
        "Pass small types (int, double, pointers) by value and large ones (string, vector) by const reference.",
        "Use a non-const reference parameter only when the function's purpose is to modify the argument.",
        "Use std::size_t for sizes and indexes from containers.",
        "Mark values const by default; it documents intent and enables compiler checks.",
      ],
      files: [
        file("src/functions.cpp", code`
#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

// Overloads: chosen at compile time from argument types
int area(int side) { return side * side; }
double area(double w, double h) { return w * h; }

// Default argument for the trailing parameter
std::string greet(const std::string& name, const std::string& greeting = "Hello") {
    return greeting + ", " + name + "!";
}

void byValue(int x) { x = 100; }              // modifies a copy
void byReference(int& x) { x = 100; }         // modifies the caller's variable
double average(const std::vector<int>& v) {   // no copy, read-only
    if (v.empty()) return 0;
    long long sum = 0;
    for (int n : v) sum += n;
    return static_cast<double>(sum) / v.size();
}

constexpr long long factorial(int n) { return n <= 1 ? 1 : n * factorial(n - 1); }
static_assert(factorial(5) == 120);           // evaluated at compile time

int main() {
    int a{7};
    // int bad{3.5};                           // error: narrowing in brace initialization
    byValue(a);     std::cout << a << '\n';   // 7
    byReference(a); std::cout << a << '\n';   // 100

    auto big = std::int64_t{1} << 40;          // exact-width type from <cstdint>
    unsigned int u = 0; --u;                   // wraps to 4294967295 (well defined)
    std::cout << area(4) << ' ' << area(2.5, 4.0) << ' ' << greet("Asha") << ' ' << greet("Ravi", "Namaste") << '\n';
    std::cout << average({90, 75, 88}) << ' ' << big << ' ' << u << ' ' << sizeof(int) << " bytes\n";

    for (int i = 1; i <= 15; ++i) {
        if (i % 15 == 0) std::cout << "FizzBuzz ";
        else if (i % 3 == 0) std::cout << "Fizz ";
        else if (i % 5 == 0) std::cout << "Buzz ";
        else std::cout << i << ' ';
    }
    std::cout << '\n';
}`),
      ],
      tips: [
        "Comparing signed and unsigned integers converts the signed value: -1 < 1u is false. Enable -Wsign-compare.",
        "Integer division truncates toward zero; cast to double first for a fractional result.",
        "Default arguments belong in the declaration (header), not repeated in the definition.",
        "Prefer static_cast<T>(x) to C-style (T)x casts — it is explicit and searchable.",
      ],
      subjective: [
        qa("Explain call by value, call by reference and call by const reference.", "Call by value copies the argument into the parameter; changes inside the function do not affect the caller; cheap for small types, expensive for large objects. Call by reference (T&) binds the parameter to the caller's object, so changes are visible to the caller and no copy is made; used for output parameters. Call by const reference (const T&) avoids the copy while forbidding modification, and can bind to temporaries; it is the usual choice for passing large read-only objects."),
        qa("What is function overloading? How does the compiler resolve it?", "Overloading means defining multiple functions with the same name in the same scope but different parameter lists (number, types or order). Return type alone cannot distinguish overloads. At each call the compiler collects candidate functions, keeps viable ones, and ranks them by conversion sequences: exact match, then promotion (char→int, float→double), then standard conversions, then user-defined conversions. The best unique match is chosen; ties are ambiguity errors."),
        qa("Differentiate const and constexpr.", "const means the object cannot be modified after initialization, but its value may be determined at run time (const int n = readInput();). constexpr means the value (or function result, given constant arguments) must be computable at compile time, so it can be used in array sizes, template arguments and static_assert. All constexpr variables are const; not all const variables are constexpr."),
      ],
      objective: [
        mcq("Which initialization rejects narrowing conversions?", ["int x = 3.7;", "int x(3.7);", "int x{3.7};", "All of them"], 2, "Brace initialization diagnoses narrowing."),
        mcq("Can functions be overloaded on return type alone?", ["Yes", "No", "Only for templates", "Only if inline"], 1, "Parameter lists must differ."),
        mcq("Signed integer overflow in C++ is:", ["Wraps around", "Throws an exception", "Undefined behaviour", "Saturates"], 2, "Unsigned arithmetic wraps; signed overflow is UB."),
        mcq("Which parameter type avoids a copy and prevents modification?", ["T", "T&", "const T&", "T*"], 2, "const reference."),
        mcq("Where should default arguments usually be specified?", ["Only in the definition", "In the declaration", "In both", "In main"], 1, "Callers see the declaration."),
      ],
    },
    {
      id: "arrays-strings-vector", module: "Foundations", title: "Arrays, std::string, std::vector and std::array", level: "Beginner", minutes: 16,
      summary: "Built-in arrays and their decay to pointers, safe alternatives, string operations and vector growth.",
      description: [
        "A built-in array (int a[5];) has a fixed size known at compile time and is stored contiguously. Uninitialized local arrays contain garbage; int a[5]{} zero-initializes. Arrays do not know their size once passed to a function — they decay to a pointer to the first element — and indexing out of bounds is undefined behaviour, not an exception.",
        "std::array<int, 5> wraps a fixed-size array with size(), iterators, at() (bounds-checked) and value semantics (it can be copied and compared). std::vector<T> is the default dynamic array: contiguous storage, O(1) indexing, amortized O(1) push_back. When size reaches capacity, it allocates a larger buffer (typically 1.5–2×), moves elements and frees the old one, invalidating pointers, references and iterators. reserve(n) pre-allocates to avoid repeated reallocations.",
        "C-strings are char arrays ending in '\\0' manipulated with <cstring> functions (strlen, strcpy) — error-prone. std::string manages memory automatically and offers size, substr, find, replace, append/+=, comparison operators, stoi/to_string conversions and getline for reading whole lines. std::string_view (C++17) is a non-owning view for read-only string parameters.",
      ],
      usage: [
        "Default to std::vector for sequences and std::string for text.",
        "Use std::array for small fixed-size data such as RGB values or matrix rows.",
        "Use at() during development or when indexes come from input; operator[] in hot loops with validated indexes.",
        "Accept std::string_view parameters for read-only text to avoid copies.",
      ],
      files: [
        file("src/containers_basics.cpp", code`
#include <algorithm>
#include <array>
#include <cstring>
#include <iostream>
#include <string>
#include <string_view>
#include <vector>

// The array decays to int*: the size must travel separately
int sumRaw(const int* data, std::size_t n) {
    int total = 0;
    for (std::size_t i = 0; i < n; ++i) total += data[i];
    return total;
}

bool isPalindrome(std::string_view s) {             // no copy of the caller's string
    std::size_t i = 0, j = s.size();
    while (i + 1 < j) if (s[i++] != s[--j]) return false;
    return true;
}

int main() {
    int marks[5]{90, 72, 64, 88, 95};
    std::cout << sizeof(marks) / sizeof(marks[0]) << " items, sum " << sumRaw(marks, 5) << '\n';

    std::array<int, 3> rgb{255, 128, 0};
    std::cout << "green=" << rgb.at(1) << " size=" << rgb.size() << '\n';

    std::vector<int> v;
    v.reserve(4);                                     // capacity 4: no reallocation for 4 push_backs
    for (int i = 1; i <= 6; ++i) {
        v.push_back(i * i);
        std::cout << "size " << v.size() << " capacity " << v.capacity() << '\n';
    }
    v.erase(std::remove_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; }), v.end());   // erase-remove idiom
    for (int x : v) std::cout << x << ' ';
    std::cout << '\n';

    std::string name = "Masterclass";
    name += " C++";
    std::cout << name.substr(0, 6) << ' ' << name.find("C++") << ' ' << name.size() << '\n';
    std::cout << std::stoi("42") + 1 << ' ' << std::to_string(3.5) << ' ' << isPalindrome("level") << '\n';

    char legacy[16];
    std::strncpy(legacy, "hello", sizeof legacy);    // C-string: manual size management
    std::cout << legacy << " length " << std::strlen(legacy) << '\n';

    std::string line;
    std::cout << "Full name: ";
    std::getline(std::cin >> std::ws, line);         // reads spaces too
    std::cout << "Hi " << line << '\n';
}`),
      ],
      tips: [
        "sizeof(arr)/sizeof(arr[0]) works only where arr is a real array, not after it decays to a pointer inside a function — use std::size or containers.",
        "After v.push_back, previously obtained iterators and references may be invalid.",
        "Mixing cin >> x and getline leaves a newline in the buffer; use std::ws or cin.ignore.",
        "vector<bool> is a space-optimized specialization whose elements are not real bools — a known quirk.",
      ],
      subjective: [
        qa("Compare built-in arrays, std::array and std::vector.", "Built-in arrays: fixed size known at compile time, no bounds checking, decay to pointers and lose their size when passed, cannot be assigned or returned by value. std::array: same fixed-size contiguous storage with no overhead, but knows its size, has iterators, at(), and can be copied, compared and returned. std::vector: size can change at run time, stores elements on the heap, manages memory automatically, supports push_back/insert/erase, with amortized O(1) appends and reallocation when capacity is exceeded."),
        qa("Explain size versus capacity of a vector.", "size() is the number of elements currently stored. capacity() is the number of elements that fit in the currently allocated buffer without reallocation. When size would exceed capacity, the vector allocates a larger buffer (geometric growth), moves or copies the elements, and frees the old one — making push_back amortized O(1) but invalidating iterators and references. reserve(n) raises capacity in advance; shrink_to_fit requests releasing unused capacity."),
      ],
      objective: [
        mcq("Accessing arr[10] for int arr[5]:", ["Throws std::out_of_range", "Is undefined behaviour", "Returns 0", "Compile error always"], 1, "No bounds checking for built-in arrays or vector::operator[]."),
        mcq("Which vector member function performs bounds checking?", ["operator[]", "at()", "data()", "front()"], 1, "at() throws std::out_of_range."),
        mcq("A C-string ends with:", ["'\\n'", "'\\0'", "EOF", "Its length byte"], 1, "The null terminator."),
        mcq("What does v.reserve(100) change?", ["size", "capacity", "Both size and capacity", "Nothing"], 1, "No elements are created."),
      ],
    },
    {
      id: "pointers-references", module: "Memory", title: "Pointers and references", level: "Intermediate", minutes: 20,
      summary: "Addresses, dereferencing, pointer arithmetic, nullptr, const with pointers, references, and pointers to pointers and functions.",
      description: [
        "A pointer stores the memory address of an object. & takes an address, * dereferences (accesses the object at the address), and -> accesses a member through a pointer. nullptr is the typed null pointer constant (prefer it to NULL or 0). Dereferencing a null, dangling (pointing to destroyed memory) or uninitialized pointer is undefined behaviour.",
        "Pointer arithmetic moves in units of the pointed-to type: if p points into an array, p + 1 points to the next element, and p[i] means *(p + i). Subtracting two pointers into the same array gives the distance between them (ptrdiff_t).",
        "const can apply to the pointee, the pointer, or both: const int* p (pointer to const — cannot modify *p), int* const p (const pointer — cannot reseat p), const int* const p (neither). Read declarations right to left.",
        "A reference is an alias for an existing object: it must be initialized, cannot be null and cannot be reseated to refer to another object. References make function parameters and return values efficient and readable. Pointers are still needed when “no object” is valid, when reseating is required, for dynamic memory and for interacting with C APIs. Function pointers store addresses of functions (callbacks), though modern code prefers lambdas and std::function.",
      ],
      usage: [
        "Use references for parameters that must refer to an object; pointers when the argument is optional.",
        "Use raw pointers only as non-owning observers; ownership belongs to smart pointers or containers.",
        "Iterate arrays with pointers when interfacing with C libraries or writing low-level code.",
        "Initialize every pointer — to an object's address or nullptr.",
      ],
      files: [
        file("src/pointers.cpp", code`
#include <iostream>

struct Student { int roll; double cgpa; };

void raise(Student* s, double by) { if (s) s->cgpa += by; }   // optional: may be nullptr
void raise(Student& s) { s.cgpa += 0.1; }                     // must refer to an object

void swapPtr(int* a, int* b) { int t = *a; *a = *b; *b = t; }
void swapRef(int& a, int& b) { int t = a; a = b; b = t; }

int applyTwice(int (*fn)(int), int x) { return fn(fn(x)); } // function pointer parameter
int square(int x) { return x * x; }

int main() {
    int x = 10;
    int* p = &x;                 // p holds x's address
    *p = 20;                     // modifies x through p
    int& r = x;                  // r is another name for x
    r = 30;
    std::cout << x << ' ' << *p << ' ' << p << '\n';   // 30 30 0x7ff...

    int arr[] = {10, 20, 30, 40};
    int* q = arr;                // array decays to a pointer to arr[0]
    std::cout << *(q + 2) << ' ' << q[3] << ' ' << (&arr[3] - q) << '\n';   // 30 40 3

    const int* readOnly = &x;    // *readOnly = 1; would not compile
    int* const fixed = &x;       // fixed = nullptr; would not compile
    *fixed = 5;
    std::cout << *readOnly << '\n';

    int** pp = &p;               // pointer to pointer
    **pp = 99;
    std::cout << x << '\n';

    int a = 1, b = 2;
    swapPtr(&a, &b); swapRef(a, b);
    std::cout << a << ' ' << b << '\n';   // swapped twice: 1 2

    Student s{7, 8.4};
    raise(&s, 0.3); raise(s); raise(nullptr, 1.0);
    std::cout << s.cgpa << ' ' << applyTwice(square, 3) << '\n';   // 8.8 81

    int* dangling = nullptr;
    {
        int temp = 5;
        dangling = &temp;
    }                            // temp destroyed: dereferencing dangling now is undefined behaviour
}`),
      ],
      tips: [
        "int* a, b; declares one pointer and one int — declare one pointer per line.",
        "sizeof a pointer is the same regardless of the pointee type (8 bytes on 64-bit systems).",
        "Never return a pointer or reference to a local variable.",
        "Turn on AddressSanitizer (-fsanitize=address) to catch out-of-bounds and use-after-free bugs.",
      ],
      subjective: [
        qa("Differentiate pointers and references.", "A pointer is an object holding an address: it can be null, can be uninitialized, can be reseated to point elsewhere, supports arithmetic, needs explicit dereferencing (*, ->), can point to pointers, and has its own size. A reference is an alias: it must be initialized when declared, cannot be null (in valid programs), cannot be reseated, uses ordinary member syntax, has no arithmetic, and there are no references to references. Use references when an object must exist; pointers when absence or reseating is needed."),
        qa("Explain const int*, int* const and const int* const.", "const int* p (equivalently int const* p): pointer to a constant int — p can be changed to point elsewhere, but *p cannot be modified through p. int* const p: constant pointer to int — p must be initialized and cannot point elsewhere, but *p can be modified. const int* const p: neither the pointer nor the pointee can be modified. Read the declaration from right to left."),
        qa("What is a dangling pointer? How can it be avoided?", "A dangling pointer points to memory that has been freed or to an object whose lifetime ended (a local variable after its function returns, an element after vector reallocation, memory after delete). Using it is undefined behaviour. Avoid it by not returning addresses of locals, setting pointers to nullptr after delete, preferring smart pointers and containers that manage lifetime, and being careful with iterators after container modification."),
      ],
      objective: [
        mcq("Which operator gives the address of a variable?", ["*", "&", "->", "::"], 1, "Unary & is address-of."),
        mcq("int a[] = {1,2,3}; int* p = a; *(p+1) is:", ["1", "2", "3", "Address of a[1]"], 1, "p + 1 points to a[1]."),
        mcq("Which must be initialized when declared?", ["Pointer", "Reference", "Both", "Neither"], 1, "References cannot be left unbound."),
        mcq("In int* const p = &x;, which is constant?", ["The int", "The pointer", "Both", "Neither"], 1, "p cannot be reseated."),
        mcq("The modern null pointer literal is:", ["NULL", "0", "nullptr", "nil"], 2, "nullptr has type std::nullptr_t."),
      ],
    },
    {
      id: "dynamic-memory", module: "Memory", title: "Dynamic memory: stack vs heap, new/delete and RAII", level: "Intermediate", minutes: 16,
      summary: "Storage durations, new and delete (and their array forms), memory leaks, double frees, and the RAII idiom.",
      description: [
        "Objects have storage durations. Automatic objects (local variables) live on the stack and are destroyed automatically when their scope ends — fast allocation, limited size. Static objects (globals, static locals) live for the whole program. Dynamic objects are created on the heap (free store) with new and live until you destroy them with delete — flexible size and lifetime, but slower and manual.",
        "new T(args) allocates memory and calls the constructor, returning T*; delete p calls the destructor and frees memory. Arrays use new T[n] and must be released with delete[] — mixing the forms is undefined behaviour. new throws std::bad_alloc on failure (new (std::nothrow) returns nullptr instead). C's malloc/free allocate raw bytes without constructors and must not be mixed with new/delete.",
        "Manual memory management causes classic bugs: leaks (forgetting delete, or an exception skipping it), double delete, use-after-free and mismatched new[]/delete. RAII — Resource Acquisition Is Initialization — solves them: tie each resource (memory, file, lock, socket) to an object whose constructor acquires it and destructor releases it. Because destructors run automatically when scope ends, even during exception unwinding, resources cannot leak. std::vector, std::string, std::unique_ptr, std::lock_guard and std::fstream are RAII types.",
      ],
      usage: [
        "Prefer automatic objects and standard containers; reach for new only inside RAII classes.",
        "Use std::make_unique / std::make_shared instead of naked new in application code.",
        "Write a small RAII wrapper for any C resource handle (FILE*, sockets, OS handles).",
        "Detect leaks with AddressSanitizer/LeakSanitizer or Valgrind.",
      ],
      files: [
        file("src/memory.cpp", code`
#include <cstdio>
#include <iostream>
#include <new>
#include <stdexcept>

struct Sensor {
    int id;
    explicit Sensor(int id) : id(id) { std::cout << "Sensor " << id << " constructed\n"; }
    ~Sensor() { std::cout << "Sensor " << id << " destroyed\n"; }
};

// RAII wrapper around a C FILE*: the destructor always closes it
class File {
    std::FILE* handle_;
public:
    File(const char* path, const char* mode) : handle_(std::fopen(path, mode)) {
        if (!handle_) throw std::runtime_error("cannot open file");
    }
    ~File() { if (handle_) std::fclose(handle_); }
    File(const File&) = delete;                       // one owner only
    File& operator=(const File&) = delete;
    void write(const char* text) { std::fputs(text, handle_); }
};

void leaky() {
    Sensor* s = new Sensor(1);
    throw std::runtime_error("oops");                 // delete s never runs: memory leak
    delete s;
}

int main() {
    Sensor onStack(0);                                // destroyed automatically at the end of main

    Sensor* single = new Sensor(2);                   // heap: lives until delete
    delete single;                                    // destructor + free
    single = nullptr;                                 // avoid a dangling pointer

    int n = 4;
    int* scores = new int[n]{90, 80, 70, 60};        // array form
    std::cout << scores[3] << '\n';
    delete[] scores;                                  // must match new[]

    try { leaky(); } catch (const std::exception& e) { std::cout << "caught: " << e.what() << '\n'; }

    try {
        File log("app.log", "w");                     // acquired in the constructor
        log.write("started\n");
        throw std::runtime_error("failure after opening");
    } catch (const std::exception&) {
        std::cout << "file was still closed by ~File()\n";   // released during stack unwinding
    }

    int* maybe = new (std::nothrow) int[10];          // nullptr instead of std::bad_alloc on failure
    if (maybe) { maybe[0] = 1; delete[] maybe; }
}`),
      ],
      tips: [
        "delete on nullptr is safe and does nothing; deleting the same non-null pointer twice is undefined behaviour.",
        "Stack size is limited (often 1–8 MB): large local arrays can overflow it — use vector instead.",
        "Every new in your code is a question: who deletes this, and what if an exception is thrown first?",
        "RAII is the single most important C++ idiom to explain in interviews.",
      ],
      subjective: [
        qa("Differentiate stack and heap memory.", "Stack: automatic storage for local variables and function call frames; allocation and deallocation are extremely fast (moving a pointer) and automatic in LIFO order; size is limited and fixed per thread; lifetime is tied to scope. Heap (free store): dynamic storage requested with new/malloc; any size up to available memory; lifetime controlled by the program; allocation is slower and can fragment; must be released explicitly (or by RAII owners), otherwise it leaks."),
        qa("What is RAII? Give examples from the standard library.", "Resource Acquisition Is Initialization binds the lifetime of a resource to the lifetime of an object: the constructor acquires the resource and the destructor releases it. Since C++ guarantees destructors of fully constructed automatic objects run when scope exits — including during exception propagation — resources are always released and code becomes exception-safe without try/finally. Examples: std::vector and std::string (memory), std::unique_ptr/std::shared_ptr (owned objects), std::fstream (files), std::lock_guard/std::unique_lock (mutexes), std::jthread (joins on destruction)."),
        qa("Differentiate new/delete and malloc/free.", "new is an operator that allocates memory, calls the constructor and returns a typed pointer; it throws std::bad_alloc on failure; it can be overloaded per class; delete calls the destructor then frees. malloc is a C library function that allocates raw uninitialized bytes, returns void* (needs a cast in C++), returns NULL on failure, and does not call constructors; free does not call destructors. They must not be mixed: memory from new must be freed with delete, from new[] with delete[], and from malloc with free."),
      ],
      objective: [
        mcq("Memory allocated with new int[10] must be released with:", ["delete", "delete[]", "free", "Nothing"], 1, "Array new pairs with delete[]."),
        mcq("By default, new throws on allocation failure:", ["std::runtime_error", "std::bad_alloc", "Returns nullptr", "std::length_error"], 1, "Use new (std::nothrow) for a null return."),
        mcq("RAII ties resource release to:", ["Garbage collection", "Object destruction", "Program exit", "Manual calls to close()"], 1, "Destructors release resources."),
        mcq("Where are local variables of a function usually stored?", ["Heap", "Stack", "Data segment", "Registers only"], 1, "Automatic storage."),
        mcq("Forgetting to delete a heap object causes:", ["A dangling pointer", "A memory leak", "A double free", "A compile error"], 1, "The memory is never returned."),
      ],
    },
    {
      id: "classes-objects", module: "Object-oriented programming", title: "Classes, constructors, destructors and member initializer lists", level: "Beginner", minutes: 20,
      summary: "Access specifiers, constructors of every kind, initializer lists, this, const member functions, static members and friends.",
      description: [
        "A class bundles data members and member functions. Members are private by default in a class and public by default in a struct — the only difference between them. Use private data with public member functions to enforce invariants (encapsulation).",
        "Constructors initialize objects: default constructors, parameterized constructors, copy constructors, delegating constructors (calling another constructor of the same class) and explicit constructors (which prevent unintended implicit conversions). Initialize members in the member initializer list (: name_(name), balance_(0)) — members are initialized in declaration order before the constructor body runs, and const members, references and members without default constructors can only be initialized there. Default member initializers (int count_ = 0;) supply defaults.",
        "The destructor (~ClassName()) runs when the object's lifetime ends and releases resources. this is a pointer to the current object. A const member function (int balance() const) promises not to modify the object and is the only kind callable on const objects; mutable members may still change (for caches). static data members are shared by all objects (define them inline in C++17) and static member functions have no this. A friend function or class can access private members — useful for operators such as <<.",
      ],
      usage: [
        "Use member initializer lists for every member; keep constructor bodies for logic only.",
        "Mark single-argument constructors explicit unless implicit conversion is intended.",
        "Mark every non-mutating member function const.",
        "Use struct for passive data aggregates and class for types with invariants.",
      ],
      files: [
        file("include/account.hpp", code`
#pragma once
#include <iosfwd>
#include <string>

class Account {
public:
    explicit Account(std::string owner);                  // explicit: no Account a = "Asha";
    Account(std::string owner, double opening);
    ~Account();

    void deposit(double amount);
    bool withdraw(double amount);
    double balance() const { return balance_; }           // const: callable on const Account
    const std::string& owner() const { return owner_; }
    static int count() { return count_; }                 // no 'this'

    friend std::ostream& operator<<(std::ostream& out, const Account& a);

private:
    const int id_;                                        // must be set in the initializer list
    std::string owner_;
    double balance_ = 0.0;                                // default member initializer
    static inline int count_ = 0;                         // C++17 inline static: one copy for all
};`),
        file("src/account.cpp", code`
#include "account.hpp"
#include <iostream>
#include <stdexcept>
#include <utility>

Account::Account(std::string owner) : Account(std::move(owner), 0.0) { }   // delegating constructor

Account::Account(std::string owner, double opening)
    : id_(++count_), owner_(std::move(owner)), balance_(opening) {         // initializer list
    if (opening < 0) throw std::invalid_argument("negative opening balance");
}

Account::~Account() { std::cout << "closing account " << id_ << '\n'; }

void Account::deposit(double amount) {
    if (amount <= 0) throw std::invalid_argument("deposit must be positive");
    this->balance_ += amount;                             // 'this' is explicit here only for illustration
}

bool Account::withdraw(double amount) {
    if (amount <= 0 || amount > balance_) return false;
    balance_ -= amount;
    return true;
}

std::ostream& operator<<(std::ostream& out, const Account& a) {   // friend: may read private members
    return out << "#" << a.id_ << " " << a.owner_ << ": " << a.balance_;
}`),
        file("src/main.cpp", code`
#include "account.hpp"
#include <iostream>

void printBalance(const Account& a) { std::cout << a.balance() << '\n'; }   // needs a const member function

int main() {
    Account asha("Asha", 500);
    Account ravi("Ravi");
    asha.deposit(250);
    std::cout << (ravi.withdraw(10) ? "ok" : "insufficient") << '\n';
    printBalance(asha);
    std::cout << asha << '\n' << ravi << '\n';
    std::cout << "accounts: " << Account::count() << '\n';
    {
        Account temp("Temp");
    }                                                      // destructor runs here
    std::cout << "end of main\n";
}                                                          // ravi then asha destroyed (reverse order)`),
      ],
      tips: [
        "Members are initialized in declaration order, not initializer-list order — compilers warn with -Wreorder.",
        "Objects are destroyed in reverse order of construction.",
        "A class with a user-declared constructor gets no implicit default constructor; write Account() = default; if you want one.",
        "Account a(); declares a function, not an object (the most vexing parse); use Account a; or Account a{};.",
      ],
      subjective: [
        qa("What is a member initializer list and when is it mandatory?", "It is the list after a constructor's colon that initializes members and base classes before the body runs: Account(std::string o) : owner_(std::move(o)), balance_(0) {}. It initializes rather than assigns, avoiding default-construct-then-assign overhead. It is mandatory for const data members, reference members, members or base classes without a default constructor, and to call a specific base class constructor."),
        qa("Explain the types of constructors in C++.", "Default constructor: callable with no arguments, compiler-generated if no constructor is declared. Parameterized constructor: takes arguments to initialize members. Copy constructor: T(const T&), creates a copy of an existing object. Move constructor: T(T&&), transfers resources from a temporary. Delegating constructor: calls another constructor of the same class in its initializer list. Converting constructor: a non-explicit single-argument constructor enabling implicit conversion; explicit prevents it."),
        qa("What is a const member function?", "A member function declared with const after its parameter list (int size() const). Inside it, this is a pointer to const, so it cannot modify non-mutable data members or call non-const member functions. Only const member functions can be called on const objects or through const references, so marking read-only functions const is essential for const-correct code."),
      ],
      objective: [
        mcq("Default access of members in a class:", ["public", "private", "protected", "package"], 1, "In a struct the default is public."),
        mcq("Which members must be initialized in the member initializer list?", ["static members", "const and reference members", "public members", "None"], 1, "They cannot be assigned later."),
        mcq("A destructor's name is:", ["destroy()", "~ClassName()", "delete ClassName()", "finalize()"], 1, "It takes no arguments and returns nothing."),
        mcq("Which can be called on a const object?", ["Any member function", "Only const member functions", "Only static functions", "Only constructors"], 1, "Plus static members."),
        mcq("explicit on a constructor prevents:", ["Inheritance", "Implicit conversions", "Copying", "Overloading"], 1, "No accidental Account a = \"Asha\";."),
      ],
    },
    {
      id: "copy-control", module: "Object-oriented programming", title: "Copy control: rule of three, five and zero", level: "Advanced", minutes: 20,
      summary: "Copy constructor, copy assignment, destructor, shallow vs deep copy, copy-and-swap, and when to write none of them.",
      description: [
        "The compiler generates special member functions when you do not: default constructor, destructor, copy constructor, copy assignment operator, move constructor and move assignment operator. Generated copies copy each member (memberwise). For a class that owns a raw pointer, that is a shallow copy — two objects point to the same buffer, and both destructors delete it (double free).",
        "Rule of Three: if a class needs a user-defined destructor, copy constructor or copy assignment operator, it almost certainly needs all three, implementing a deep copy. Rule of Five (C++11): add the move constructor and move assignment operator so temporaries transfer ownership cheaply instead of copying. Rule of Zero: better still, hold resources in members that already manage themselves (std::vector, std::string, std::unique_ptr) and write none of the five — the compiler-generated versions are then correct.",
        "Copy assignment must handle self-assignment and be exception-safe. The copy-and-swap idiom does both: take the parameter by value (which copies or moves), swap its contents with *this, and let the parameter's destructor free the old data. Use = delete to forbid copying (non-copyable types such as a mutex wrapper) and = default to request the generated version explicitly.",
        "When is the copy constructor called? Initializing an object from another of the same type (T b = a; T b(a);), passing by value, and returning by value (often elided — since C++17 copy elision is guaranteed for prvalues).",
      ],
      usage: [
        "Prefer the Rule of Zero: compose classes from RAII members.",
        "Implement the Rule of Five only in low-level resource-owning classes.",
        "Delete copy operations for types that represent unique resources (files, sockets, threads).",
        "Mark move operations noexcept so containers like vector use them when reallocating.",
      ],
      files: [
        file("src/buffer.cpp", code`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <utility>

// Rule of Five: a class that owns a raw heap buffer
class Buffer {
    std::size_t size_ = 0;
    int* data_ = nullptr;
public:
    explicit Buffer(std::size_t n) : size_(n), data_(new int[n]{}) { }

    ~Buffer() { delete[] data_; }                                         // 1. destructor

    Buffer(const Buffer& other) : size_(other.size_), data_(new int[other.size_]) {   // 2. copy constructor (deep)
        std::copy(other.data_, other.data_ + size_, data_);
        std::cout << "copy ctor\n";
    }

    Buffer(Buffer&& other) noexcept                                        // 3. move constructor: steal
        : size_(std::exchange(other.size_, 0)), data_(std::exchange(other.data_, nullptr)) {
        std::cout << "move ctor\n";
    }

    Buffer& operator=(Buffer other) noexcept {                             // 4 + 5. copy-and-swap: by value
        swap(*this, other);                                                // handles self-assignment and exceptions
        std::cout << "assign\n";
        return *this;
    }                                                                      // old data freed with 'other'

    friend void swap(Buffer& a, Buffer& b) noexcept {
        using std::swap;
        swap(a.size_, b.size_);
        swap(a.data_, b.data_);
    }

    int& operator[](std::size_t i) { return data_[i]; }
    std::size_t size() const { return size_; }
};

// Rule of Zero: members manage themselves, so no special members are written
#include <string>
#include <vector>
struct Course {
    std::string title;
    std::vector<std::string> students;
};

Buffer makeBuffer() { Buffer b(3); b[0] = 42; return b; }   // returned without copying (elision or move)

int main() {
    Buffer a(4);
    a[0] = 7;
    Buffer b = a;                 // copy ctor: independent copy
    b[0] = 99;
    std::cout << a[0] << ' ' << b[0] << '\n';   // 7 99: deep copy

    Buffer c = std::move(a);      // move ctor: a is now empty
    std::cout << a.size() << ' ' << c.size() << '\n';   // 0 4

    b = c;                        // copy assignment via copy-and-swap
    b = makeBuffer();             // move assignment path
    Course java{"Core Java", {"Asha", "Ravi"}};
    Course copy = java;           // generated memberwise copy is correct
    std::cout << copy.students.size() << '\n';
}`),
      ],
      tips: [
        "Declaring any copy operation or destructor suppresses the implicit move operations — another reason for the Rule of Zero.",
        "A moved-from object must stay valid but unspecified; only assign to it or destroy it.",
        "Shallow vs deep copy is a favourite viva question — answer with a pointer-owning example and the double free.",
        "Copy elision means a copy constructor's side effects (like printing) may never run.",
      ],
      subjective: [
        qa("Differentiate shallow copy and deep copy.", "A shallow copy copies member values as they are, so pointer members in both objects point to the same heap memory; modifying one affects the other and both destructors free the same memory (double free, dangling pointers). A deep copy allocates new memory for the copy and duplicates the pointed-to data, so the objects are independent. The compiler-generated copy constructor performs memberwise (shallow for raw pointers) copying; deep copies require a user-defined copy constructor and assignment operator, or RAII members that copy deeply themselves."),
        qa("State the Rule of Three, Rule of Five and Rule of Zero.", "Rule of Three: a class that needs a custom destructor, copy constructor or copy assignment operator generally needs all three, because it manages a resource. Rule of Five: in C++11 and later, also define the move constructor and move assignment operator for efficient transfers. Rule of Zero: design classes so that they need none of these — delegate resource management to RAII members (smart pointers, containers) and let the compiler generate correct special members."),
        qa("When is the copy constructor invoked?", "When a new object is initialized from an existing object of the same type — T b = a; T b(a); T b{a}; — when an object is passed to a function by value, when an object is returned by value (unless elided), when an exception object is thrown or caught by value, and when containers copy elements. Assignment to an existing object (b = a) calls the copy assignment operator instead."),
      ],
      objective: [
        mcq("The copy constructor's usual signature is:", ["T(T)", "T(const T&)", "T(T&&)", "void copy(T)"], 1, "By value would recurse infinitely."),
        mcq("Buffer b; b = a; calls:", ["Copy constructor", "Copy assignment operator", "Move constructor", "Destructor only"], 1, "b already exists."),
        mcq("Main danger of the default copy for a class with a raw owning pointer:", ["Slow compilation", "Double free / shared state", "Compile error", "Stack overflow"], 1, "Both copies own the same buffer."),
        mcq("The Rule of Zero recommends:", ["Writing all five special members", "Managing resources with RAII members so no special members are needed", "Never copying objects", "Using raw pointers"], 1, "Let the compiler generate them."),
        mcq("Why mark move constructors noexcept?", ["Required by syntax", "So std::vector moves rather than copies during reallocation", "It makes them faster at compile time", "To allow inheritance"], 1, "Strong exception guarantee otherwise forces copies."),
      ],
    },
    {
      id: "operator-overloading", module: "Object-oriented programming", title: "Operator overloading", level: "Intermediate", minutes: 16,
      summary: "Member vs non-member operators, arithmetic and compound assignment, comparison (and C++20 <=>), stream operators, subscript and function-call operators.",
      description: [
        "Operator overloading lets user-defined types use natural syntax (a + b, v[i], cout << p). An overloaded operator is a function named operator@. At least one operand must be a user-defined type, you cannot invent new operators or change precedence and arity, and some operators cannot be overloaded: ::, ., .*, ?:, sizeof, typeid.",
        "Implement compound assignment (+=) as a member returning *this by reference, then binary + as a non-member in terms of it, so conversions apply to both operands. Stream operators << and >> must be non-members (the left operand is the stream), often friends. Assignment =, subscript [], function call () and member access -> must be members.",
        "C++20's three-way comparison operator <=> (spaceship) with = default generates all six relational operators from member-wise comparison; operator== can also be defaulted. Prefix ++x returns a reference to the incremented object; postfix x++ takes a dummy int parameter and returns the old value by copy. A class with operator() is a function object (functor), usable wherever a callable is expected.",
      ],
      usage: [
        "Overload operators for mathematical types: vectors, matrices, fractions, money, big integers.",
        "Provide operator<< for logging and debugging output of your types.",
        "Default <=> and == in C++20 for value types that should be sortable and comparable.",
        "Write functors (or lambdas) as custom comparators for STL containers and algorithms.",
      ],
      files: [
        file("src/fraction.cpp", code`
#include <compare>
#include <iostream>
#include <numeric>
#include <stdexcept>

class Fraction {
    long num_, den_;
    void normalize() {
        if (den_ == 0) throw std::domain_error("zero denominator");
        if (den_ < 0) { num_ = -num_; den_ = -den_; }
        long g = std::gcd(num_, den_);
        num_ /= g; den_ /= g;
    }
public:
    Fraction(long n = 0, long d = 1) : num_(n), den_(d) { normalize(); }   // implicit from long: 2 -> 2/1

    Fraction& operator+=(const Fraction& o) {               // member compound assignment
        num_ = num_ * o.den_ + o.num_ * den_;
        den_ *= o.den_;
        normalize();
        return *this;
    }
    Fraction& operator++() { return *this += 1; }            // prefix: ++f
    Fraction operator++(int) { Fraction old = *this; ++*this; return old; }   // postfix: f++

    friend Fraction operator+(Fraction a, const Fraction& b) { return a += b; }   // non-member: 1 + f works
    friend Fraction operator*(const Fraction& a, const Fraction& b) { return {a.num_ * b.num_, a.den_ * b.den_}; }

    friend bool operator==(const Fraction&, const Fraction&) = default;   // C++20
    friend std::strong_ordering operator<=>(const Fraction& a, const Fraction& b) {
        return a.num_ * b.den_ <=> b.num_ * a.den_;          // cross-multiply (dens are positive)
    }

    friend std::ostream& operator<<(std::ostream& out, const Fraction& f) {
        return f.den_ == 1 ? out << f.num_ : out << f.num_ << '/' << f.den_;
    }
    friend std::istream& operator>>(std::istream& in, Fraction& f) {
        char slash;
        if (in >> f.num_ >> slash >> f.den_) f.normalize();
        return in;
    }
};

struct Matrix2 {
    double m[2][2]{};
    double& operator()(int r, int c) { return m[r][c]; }      // function-call operator as 2-D index
};

struct ByLength {                                             // functor
    bool operator()(const std::string& a, const std::string& b) const { return a.size() < b.size(); }
};

int main() {
    Fraction a{1, 2}, b{3, 4};
    std::cout << a + b << ' ' << 1 + a << ' ' << a * b << '\n';   // 5/4 3/2 3/8
    std::cout << (a < b) << ' ' << (a == Fraction{2, 4}) << '\n'; // 1 1 (from <=> and ==)
    Fraction c = a++;
    std::cout << c << ' ' << a << ' ' << ++a << '\n';             // 1/2 3/2 5/2
    Matrix2 id; id(0, 0) = id(1, 1) = 1;
    std::cout << id(1, 1) << ' ' << ByLength{}("hi", "hello") << '\n';
}`),
      ],
      tips: [
        "Return *this by reference from assignment operators so a = b = c chains.",
        "Overloading && or || loses short-circuit evaluation — avoid it.",
        "Keep operators unsurprising: + should not modify its operands.",
        "Unary minus, binary minus, prefix and postfix ++ are four different functions.",
      ],
      subjective: [
        qa("Which operators cannot be overloaded in C++?", "Scope resolution ::, member access ., pointer-to-member access .*, the ternary conditional ?:, sizeof, alignof, typeid, and the casting operators (static_cast etc.). Preprocessor operators # and ## are also not overloadable. You also cannot create new operators or change precedence, associativity or the number of operands."),
        qa("When should an operator be a member and when a non-member?", "=, [], (), -> and conversion operators must be members. Compound assignments (+=, -=) modify the left operand and are naturally members. Symmetric binary operators (+, -, ==, <) are better as non-members (often friends) so implicit conversions apply to both operands, e.g. 1 + fraction. Stream operators << and >> must be non-members because the left operand is a std::ostream/istream you cannot modify."),
        qa("How does the compiler distinguish prefix and postfix increment overloads?", "Prefix is declared T& operator++(); postfix has an unused int parameter: T operator++(int). The compiler calls the postfix version with a dummy 0. Prefix increments and returns the object by reference; postfix saves a copy, increments, and returns the old copy by value — which is why prefix is preferred for iterators."),
      ],
      objective: [
        mcq("Which operator cannot be overloaded?", ["+", "[]", "::", "<<"], 2, "Scope resolution is not overloadable."),
        mcq("The postfix increment operator is declared as:", ["T& operator++()", "T operator++(int)", "T operator++(T)", "void operator++()"], 1, "The int parameter is a tag."),
        mcq("operator<< for output streams is usually implemented as:", ["A member of the class", "A non-member (often friend) function", "A static function", "A constructor"], 1, "The stream is the left operand."),
        mcq("In C++20, defaulting operator<=> provides:", ["Only <", "All relational operators < <= > >=", "Only ==", "Only sorting with std::sort"], 1, "== can also be defaulted."),
      ],
    },
    {
      id: "inheritance-virtual", module: "Object-oriented programming", title: "Inheritance, virtual functions and runtime polymorphism", level: "Intermediate", minutes: 22,
      summary: "Access in inheritance, constructor order, virtual dispatch and vtables, override/final, pure virtual functions, virtual destructors, object slicing and multiple/diamond inheritance.",
      description: [
        "A derived class inherits the members of its base: class Car : public Vehicle. The inheritance access specifier limits inherited access: public keeps public as public (is-a), protected makes public members protected, private makes them private (implementation inheritance). Base classes are constructed before members and the derived constructor body, and destroyed in reverse order.",
        "Polymorphism in C++ requires virtual functions called through a pointer or reference to the base. A virtual call is resolved at run time using the object's vtable (a per-class table of function pointers; each object holds a hidden vptr). Mark overrides with override so the compiler checks the signature, and use final to stop further overriding or inheritance. Non-virtual functions are bound statically by the static type.",
        "A pure virtual function (virtual double area() const = 0;) makes the class abstract — it cannot be instantiated and acts as an interface. If objects are deleted through a base pointer, the base must have a virtual destructor; otherwise only the base destructor runs (undefined behaviour, typically leaks).",
        "Object slicing happens when a derived object is copied into a base object by value: the derived part is cut off and virtual calls use the base version. Pass polymorphic objects by reference or pointer. C++ allows multiple inheritance; the diamond problem (two bases sharing a common base) is solved with virtual inheritance so only one shared base subobject exists. dynamic_cast performs checked downcasts at run time.",
      ],
      usage: [
        "Define interfaces as abstract base classes with pure virtual functions and a virtual destructor.",
        "Store polymorphic objects as std::vector<std::unique_ptr<Base>>.",
        "Prefer composition over inheritance when there is no true is-a relationship.",
        "Use override on every overriding function and final on leaf classes where appropriate.",
      ],
      files: [
        file("include/shapes.hpp", code`
#pragma once
#include <string>

class Shape {                                       // abstract base class (interface)
public:
    virtual ~Shape() = default;                     // virtual destructor: required for delete via Shape*
    virtual double area() const = 0;                // pure virtual
    virtual std::string name() const { return "shape"; }
    void print() const;                             // non-virtual: uses virtual functions internally
};

class Circle : public Shape {
    double r_;
public:
    explicit Circle(double r) : r_(r) { }
    double area() const override { return 3.14159265 * r_ * r_; }
    std::string name() const override { return "circle"; }
};

class Rectangle : public Shape {
protected:
    double w_, h_;
public:
    Rectangle(double w, double h) : w_(w), h_(h) { }
    double area() const override { return w_ * h_; }
    std::string name() const override { return "rectangle"; }
};

class Square final : public Rectangle {             // final: no further derivation
public:
    explicit Square(double s) : Rectangle(s, s) { }  // base constructor runs first
    std::string name() const override { return "square"; }
};`),
        file("src/shapes.cpp", code`
#include "shapes.hpp"
#include <iostream>

void Shape::print() const { std::cout << name() << " area " << area() << '\n'; }   // dynamic dispatch`),
        file("src/main.cpp", code`
#include "shapes.hpp"
#include <iostream>
#include <memory>
#include <vector>

struct Base { ~Base() { std::cout << "~Base\n"; } };               // NOT virtual
struct Derived : Base { ~Derived() { std::cout << "~Derived\n"; } };

// Diamond with virtual inheritance: one shared Device subobject
struct Device { int id = 1; };
struct Scanner : virtual Device { };
struct Printer : virtual Device { };
struct Copier : Scanner, Printer { };

// void byValue(Shape s);                                          // error: an abstract class cannot be passed by value
void showSliced(Rectangle r) { std::cout << "sliced: " << r.name() << '\n'; }   // copies only the Rectangle part

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(1));
    shapes.push_back(std::make_unique<Rectangle>(2, 3));
    shapes.push_back(std::make_unique<Square>(2));
    for (const auto& s : shapes) s->print();                       // circle, rectangle, square

    Square sq(3);
    showSliced(sq);                                                // prints "rectangle": object slicing
    const Rectangle& ref = sq;
    std::cout << "by reference: " << ref.name() << '\n';          // "square"

    Shape* p = shapes[0].get();
    if (auto* c = dynamic_cast<Circle*>(p)) std::cout << "it is a circle, area " << c->area() << '\n';

    Base* b = new Derived;
    delete b;                                                      // only ~Base runs: undefined behaviour

    Copier copier;
    std::cout << "one Device id: " << copier.id << '\n';           // unambiguous thanks to virtual inheritance
}`),
      ],
      tips: [
        "Calling a virtual function inside a constructor or destructor calls the version of the class currently being constructed, not the derived override.",
        "Default arguments of virtual functions are bound statically — avoid them on virtuals.",
        "A class with any virtual function should almost always have a virtual (or protected non-virtual) destructor.",
        "sizeof an object with virtual functions includes the hidden vptr.",
      ],
      subjective: [
        qa("Explain how virtual functions work internally (vtable and vptr).", "For each class with virtual functions the compiler builds a vtable: an array of pointers to the most-derived implementations of each virtual function. Each object of such a class contains a hidden pointer (vptr) to its class's vtable, set by constructors. A virtual call through a base pointer or reference loads the vptr, indexes the vtable slot for that function and calls through it, so the implementation of the object's dynamic type runs. This costs one extra indirection and prevents inlining in general. (vtables are an implementation technique, not mandated by the standard.)"),
        qa("Why must a base class destructor be virtual?", "When a derived object is deleted through a pointer to its base, a non-virtual base destructor is bound statically, so only the base destructor runs; the derived destructor and its members' destructors are skipped — formally undefined behaviour, in practice resource leaks and corruption. Declaring the base destructor virtual makes delete dispatch to the derived destructor, which then calls the base destructor, destroying the object completely."),
        qa("What is object slicing?", "Object slicing occurs when a derived-class object is assigned or copied by value into a base-class object: only the base subobject is copied, derived data members are lost and the copy's dynamic type is the base, so virtual calls use the base implementations. It happens with pass-by-value parameters, value containers like std::vector<Base>, and assignments. Avoid it by using references, pointers or smart pointers to the base."),
        qa("What is the diamond problem and how does virtual inheritance solve it?", "If class D inherits from B and C, and both inherit from A, D contains two separate A subobjects, making access to A's members ambiguous and duplicating state. Declaring B and C as inheriting virtually from A (class B : virtual public A) makes all virtual bases share a single A subobject in the most-derived class. The most-derived class is responsible for constructing the virtual base."),
      ],
      objective: [
        mcq("A class with at least one pure virtual function is:", ["Final", "Abstract", "Static", "Template"], 1, "It cannot be instantiated."),
        mcq("Runtime polymorphism in C++ requires:", ["Templates", "Virtual functions called through a base pointer/reference", "Function overloading", "Macros"], 1, "Static calls do not dispatch dynamically."),
        mcq("Which keyword makes the compiler check that a function overrides a base virtual function?", ["virtual", "override", "final", "explicit"], 1, "A mismatched signature becomes an error."),
        mcq("Copying a derived object into a base object by value causes:", ["Deep copy", "Object slicing", "Compile error always", "Dynamic dispatch"], 1, "The derived part is cut off."),
        mcq("Order of constructor calls for class D : public B with member m:", ["D, m, B", "B, m, D body", "m, B, D", "Unspecified"], 1, "Bases, then members in declaration order, then the body."),
      ],
    },
    {
      id: "templates", module: "Generic programming and the STL", title: "Templates: function, class, specialization and concepts", level: "Advanced", minutes: 20,
      summary: "Generic code with templates, type deduction, class templates, specialization, variadic templates and C++20 concepts.",
      description: [
        "Templates let you write code once for many types. A function template (template <typename T> T maxOf(T a, T b)) is instantiated by the compiler for each set of argument types used, with T usually deduced from the arguments. A class template (template <typename T> class Stack) is instantiated with explicit or deduced (CTAD, C++17) arguments: Stack<int>, std::vector v{1, 2, 3}.",
        "Templates are compiled when instantiated, so their definitions must be visible at the point of use — they live in headers. Non-type template parameters accept constants (template <typename T, std::size_t N> class FixedArray). Full specialization provides a completely different implementation for one type (template <> class Stack<bool>); partial specialization (class templates only) handles a family such as all pointer types.",
        "Variadic templates accept any number of arguments (template <typename... Args>) and are expanded with packs or C++17 fold expressions ((std::cout << ... << args)). This is how std::make_unique, std::tuple and std::format are written.",
        "C++20 concepts constrain template parameters with readable requirements: template <std::integral T>, or requires clauses and custom concepts (concept Shape = requires(T s) { s.area(); }). Errors become short and clear, and overloads can be selected by constraints. Before concepts, SFINAE and static_assert served this purpose.",
      ],
      usage: [
        "Write generic containers and algorithms that work for any element type.",
        "Constrain templates with standard concepts (std::integral, std::floating_point, std::ranges::range) or your own.",
        "Use if constexpr to branch on type properties at compile time inside templates.",
        "Keep template code in headers; explicit instantiation can reduce build times for common types.",
      ],
      files: [
        file("include/stack.hpp", code`
#pragma once
#include <cstddef>
#include <stdexcept>
#include <vector>

template <typename T>
class Stack {
    std::vector<T> items_;
public:
    void push(const T& value) { items_.push_back(value); }
    void push(T&& value) { items_.push_back(std::move(value)); }
    T pop() {
        if (items_.empty()) throw std::out_of_range("pop on empty stack");
        T top = std::move(items_.back());
        items_.pop_back();
        return top;
    }
    const T& top() const { return items_.back(); }
    bool empty() const { return items_.empty(); }
    std::size_t size() const { return items_.size(); }
};

// Non-type parameter: the capacity is part of the type
template <typename T, std::size_t N>
class FixedStack {
    T data_[N]{};
    std::size_t size_ = 0;
public:
    bool push(const T& v) { if (size_ == N) return false; data_[size_++] = v; return true; }
    static constexpr std::size_t capacity() { return N; }
};`),
        file("src/templates.cpp", code`
#include "stack.hpp"
#include <concepts>
#include <iostream>
#include <string>
#include <type_traits>

template <typename T>
T maxOf(T a, T b) { return a < b ? b : a; }                     // T deduced from the arguments

template <>                                                      // full specialization for C-strings
const char* maxOf<const char*>(const char* a, const char* b) { return std::string(a) < b ? b : a; }

template <std::integral T>                                       // C++20 constraint
T gcd(T a, T b) { while (b) { T t = a % b; a = b; b = t; } return a; }

template <typename T>
concept HasArea = requires(const T& s) { { s.area() } -> std::convertible_to<double>; };

template <HasArea S>
double totalArea(const S& a, const S& b) { return a.area() + b.area(); }

struct Square { double side; double area() const { return side * side; } };

template <typename... Args>                                      // variadic + fold expression
void log(const Args&... args) { ((std::cout << args << ' '), ...); std::cout << '\n'; }

template <typename T>
std::string kind(const T&) {
    if constexpr (std::is_integral_v<T>) return "integer";      // discarded branches are not compiled
    else if constexpr (std::is_floating_point_v<T>) return "floating";
    else return "other";
}

int main() {
    std::cout << maxOf(3, 9) << ' ' << maxOf(2.5, 1.5) << ' ' << maxOf<double>(3, 4.5) << ' ' << maxOf("apple", "mango") << '\n';
    std::cout << gcd(84, 36) << '\n';
    // gcd(2.5, 1.5);                                            // error: double does not satisfy std::integral
    std::cout << totalArea(Square{2}, Square{3}) << '\n';

    Stack<std::string> s;
    s.push("first"); s.push("second");
    std::cout << s.pop() << ' ' << s.size() << '\n';
    FixedStack<int, 4> fs;
    std::cout << FixedStack<int, 4>::capacity() << ' ' << fs.push(1) << '\n';

    log("enrolled", 3, "students at", 99.5, '%');
    std::cout << kind(1) << ' ' << kind(1.0) << ' ' << kind("x") << '\n';
}`),
      ],
      tips: [
        "maxOf(3, 4.5) fails to deduce T (int vs double); specify maxOf<double> or use two template parameters.",
        "Template errors are reported at instantiation — concepts move them to the call site with a clear message.",
        "typename is required before dependent type names inside templates: typename T::value_type.",
        "Prefer function overloading to function template specialization; specializations do not participate in overload resolution.",
      ],
      subjective: [
        qa("What are templates? Differentiate function and class templates.", "Templates are blueprints that let the compiler generate functions or classes for different types (or values) at compile time, enabling generic programming without runtime cost. A function template defines a family of functions; its template arguments are usually deduced from call arguments (maxOf(3, 9) → T = int). A class template defines a family of classes; its arguments are specified (Stack<int>) or deduced from constructor arguments in C++17 (CTAD). Class templates support partial specialization; function templates do not."),
        qa("Why are templates usually defined in header files?", "A template is not code until it is instantiated with concrete arguments, and instantiation happens in each translation unit that uses it. The compiler therefore needs the full definition, not just a declaration, wherever the template is used. Putting the definition in a .cpp file would make it invisible to other translation units, causing undefined-reference linker errors unless every needed instantiation is explicitly instantiated in that .cpp."),
        qa("What are C++20 concepts and their benefits?", "Concepts are named compile-time predicates on template arguments, e.g. std::integral<T> or a custom concept using a requires-expression to check that expressions are valid and return suitable types. Benefits: they document requirements in the interface, produce short and precise error messages at the call site instead of deep instantiation errors, enable overloading on constraints, and replace complex SFINAE and enable_if tricks."),
      ],
      objective: [
        mcq("Which keyword introduces a template parameter list?", ["generic", "template", "typename only", "class<T>"], 1, "template <typename T>."),
        mcq("Template definitions are usually placed in:", [".cpp files only", "Header files", "Makefiles", "Object files"], 1, "They must be visible at instantiation."),
        mcq("Which C++20 feature constrains template parameters?", ["Modules", "Concepts", "Coroutines", "Ranges views"], 1, "e.g. template <std::integral T>."),
        mcq("Partial specialization is allowed for:", ["Function templates", "Class templates", "Both", "Neither"], 1, "Function templates use overloading instead."),
        mcq("template <typename... Args> declares:", ["A variadic template", "A macro", "An array of types", "A concept"], 0, "Args is a parameter pack."),
      ],
    },
    {
      id: "stl-containers", module: "Generic programming and the STL", title: "STL containers and their complexities", level: "Intermediate", minutes: 22,
      summary: "Sequence containers, associative and unordered containers, container adapters, choosing the right one, and iterator invalidation.",
      description: [
        "The Standard Template Library has three pillars: containers that store data, iterators that traverse them, and algorithms that operate on iterator ranges. Sequence containers keep insertion order: vector (contiguous, fast random access and push_back), deque (fast insert/remove at both ends), list (doubly linked, O(1) splice and insert anywhere given an iterator), forward_list and array.",
        "Associative containers are sorted, balanced binary search trees (usually red–black): set (unique keys), multiset (duplicates), map (unique key → value), multimap. Operations are O(log n) and iteration is in key order; they provide lower_bound/upper_bound for range queries. Unordered containers (unordered_set, unordered_map and multi versions) are hash tables with average O(1) operations and no ordering; they need a hash function for custom keys.",
        "Container adapters provide restricted interfaces on top of other containers: stack (LIFO, default deque), queue (FIFO, default deque) and priority_queue (a max-heap on vector by default; use std::greater for a min-heap).",
        "map::operator[] inserts a default value if the key is missing — use find or contains (C++20) to test, at() to throw on missing keys, and try_emplace/insert_or_assign for controlled insertion. Iterator invalidation rules differ: vector insertions can invalidate everything on reallocation; list and map iterators stay valid except for erased elements; unordered containers may invalidate on rehash.",
      ],
      usage: [
        "vector by default; unordered_map/unordered_set for fast lookup; map/set when you need ordering or ranges.",
        "priority_queue for top-k, scheduling and Dijkstra; deque for sliding windows.",
        "Use emplace_back/try_emplace to construct elements in place.",
        "Reserve capacity (vector::reserve, unordered_map::reserve) when the size is known.",
      ],
      files: [
        file("src/containers.cpp", code`
#include <deque>
#include <functional>
#include <iostream>
#include <list>
#include <map>
#include <queue>
#include <set>
#include <stack>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

int main() {
    // Ordered map: word frequencies in alphabetical order
    std::map<std::string, int> freq;
    for (std::string w : {"to", "be", "or", "not", "to", "be"}) ++freq[w];   // [] inserts 0 if missing
    for (const auto& [word, count] : freq) std::cout << word << '=' << count << ' ';
    std::cout << '\n';
    if (auto it = freq.find("xyz"); it == freq.end()) std::cout << "xyz absent (find does not insert)\n";

    // Unordered map: O(1) average lookups
    std::unordered_map<std::string, double> price{{"tea", 15}, {"coffee", 40}};
    price.try_emplace("tea", 99);                  // no effect: key exists
    std::cout << price.at("tea") << ' ' << price.contains("juice") << '\n';

    std::set<int> s{5, 1, 9, 3};
    std::cout << *s.lower_bound(4) << ' ' << *s.begin() << ' ' << *s.rbegin() << '\n';   // 5 1 9
    std::multiset<int> ms{2, 2, 3};
    std::cout << ms.count(2) << '\n';              // duplicates allowed

    std::unordered_set<int> seen;
    for (int x : {4, 7, 4, 1, 7}) if (!seen.insert(x).second) std::cout << "duplicate " << x << '\n';

    std::stack<int> st; st.push(1); st.push(2); std::cout << st.top() << ' ';
    std::queue<int> q;  q.push(1); q.push(2);   std::cout << q.front() << ' ';
    std::priority_queue<int> maxHeap;                                    // largest on top
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;  // smallest on top
    for (int x : {5, 1, 8}) { maxHeap.push(x); minHeap.push(x); }
    std::cout << maxHeap.top() << ' ' << minHeap.top() << '\n';         // 8 1

    std::deque<int> dq{2, 3}; dq.push_front(1); dq.push_back(4);
    std::list<int> lst{1, 2, 4}; lst.insert(std::next(lst.begin(), 2), 3);   // O(1) given the iterator
    for (int x : lst) std::cout << x;
    std::cout << ' ' << dq.front() << dq.back() << '\n';

    std::vector<int> v{1, 2, 3};
    int* first = &v[0];
    v.push_back(4);                                   // may reallocate: 'first' could now dangle
    (void)first;
}`),
        file("complexity-cheatsheet.md", code`
| Container          | Access   | Search    | Insert/Erase           | Ordered |
|--------------------|----------|-----------|------------------------|---------|
| vector             | O(1)     | O(n)      | O(1)* at end, O(n) mid | insertion |
| deque              | O(1)     | O(n)      | O(1) at both ends      | insertion |
| list               | O(n)     | O(n)      | O(1) at iterator       | insertion |
| set / map          | -        | O(log n)  | O(log n)               | by key  |
| unordered_set/map  | -        | O(1) avg  | O(1) avg, O(n) worst   | none    |
| priority_queue     | top O(1) | -         | push/pop O(log n)      | heap    |
* amortized`),
      ],
      tips: [
        "Using map[key] just to check existence inserts a default element — a classic bug and MCQ.",
        "Erasing while iterating: it = container.erase(it); never erase and then increment the old iterator.",
        "std::map keys must support operator< (or a comparator); unordered_map keys need std::hash and ==.",
        "Structured bindings (auto& [k, v]) make map iteration readable.",
      ],
      subjective: [
        qa("Differentiate map and unordered_map.", "std::map is an ordered associative container implemented as a balanced BST (red–black tree): keys are kept sorted, operations are O(log n) worst case, it supports ordered iteration and range queries (lower_bound, upper_bound), and requires a strict weak ordering (operator<). std::unordered_map is a hash table: no ordering, average O(1) operations but O(n) worst case under collisions, iterators may be invalidated on rehash, and it requires a hash function and equality. Choose map when order or ranges matter; unordered_map for fastest lookups."),
        qa("What are container adapters? Name them.", "Adapters provide a restricted interface over an underlying sequence container rather than being containers themselves. std::stack (LIFO: push, pop, top; default underlying container deque), std::queue (FIFO: push, pop, front, back; default deque), and std::priority_queue (heap-ordered access to the largest element by default: push, pop, top; default vector with std::less). They do not provide iterators."),
        qa("Explain iterator invalidation with examples.", "An iterator is invalidated when the element it refers to moves or is destroyed. vector: push_back/insert invalidate all iterators if reallocation occurs, otherwise those after the insertion point; erase invalidates iterators at and after the erased element. deque: insertion at ends invalidates iterators (but not references); insertion in the middle invalidates all. list/forward_list/set/map: insertion invalidates nothing; erase invalidates only iterators to erased elements. unordered containers: rehashing invalidates iterators but not references. Using an invalidated iterator is undefined behaviour."),
      ],
      objective: [
        mcq("Which container keeps keys sorted?", ["unordered_map", "map", "vector", "queue"], 1, "Tree-based associative containers are ordered."),
        mcq("Average lookup complexity of unordered_map:", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 0, "Worst case O(n)."),
        mcq("Default std::priority_queue is a:", ["Min-heap", "Max-heap", "Sorted list", "Stack"], 1, "Use std::greater<T> for a min-heap."),
        mcq("Accessing m[\"x\"] on a std::map without key \"x\":", ["Throws", "Inserts a value-initialized element", "Returns nullptr", "Is a compile error"], 1, "Use find, contains or at."),
        mcq("Which container allows O(1) insertion in the middle given an iterator?", ["vector", "deque", "list", "array"], 2, "Linked nodes are relinked."),
      ],
    },
    {
      id: "stl-algorithms-lambdas", module: "Generic programming and the STL", title: "Iterators, algorithms and lambdas", level: "Intermediate", minutes: 20,
      summary: "Iterator categories, <algorithm> essentials (sort, find, accumulate, transform, partition…), lambda captures, and C++20 ranges.",
      description: [
        "Iterators generalize pointers: begin() points to the first element and end() one past the last. Categories describe capabilities — input, output, forward, bidirectional (list, map) and random access (vector, deque) — and algorithms require minimum categories (std::sort needs random access, which is why lists have their own sort member).",
        "<algorithm> and <numeric> provide tested building blocks over half-open ranges [first, last): sort/stable_sort/partial_sort/nth_element, find/find_if/count_if, any_of/all_of, binary_search/lower_bound/upper_bound (on sorted ranges), transform, accumulate/reduce, remove_if (with erase — the erase-remove idiom, or std::erase_if in C++20), unique, reverse, rotate, min_element/max_element, next_permutation and partition.",
        "Lambdas are inline function objects: [capture](params) -> ret { body }. Captures: [] none, [x] by value, [&x] by reference, [=] all used variables by value, [&] all by reference, [this] the current object, and init-captures [n = std::move(v)]. A lambda is const by default; mutable allows modifying its by-value copies. Generic lambdas take auto parameters. Store them in auto variables or std::function when type erasure is needed.",
        "C++20 ranges let algorithms take containers directly (std::ranges::sort(v)) and compose lazy views with pipes: v | std::views::filter(pred) | std::views::transform(f) | std::views::take(3).",
      ],
      usage: [
        "Replace hand-written loops with named algorithms; they communicate intent and avoid off-by-one errors.",
        "Sort with custom comparators (by multiple keys) using lambdas.",
        "Use lower_bound for binary search positions and nth_element for medians or top-k in O(n).",
        "Use ranges views for readable data pipelines without temporary containers.",
      ],
      files: [
        file("src/algorithms.cpp", code`
#include <algorithm>
#include <functional>
#include <iostream>
#include <numeric>
#include <ranges>
#include <string>
#include <vector>

struct Student { std::string name; int marks; std::string city; };

int main() {
    std::vector<Student> cls{{"Asha", 91, "Pune"}, {"Ravi", 78, "Delhi"}, {"Meera", 91, "Delhi"}, {"Kabir", 64, "Pune"}};

    // Sort by marks descending, then name ascending
    std::sort(cls.begin(), cls.end(), [](const Student& a, const Student& b) {
        return a.marks != b.marks ? a.marks > b.marks : a.name < b.name;
    });
    for (const auto& s : cls) std::cout << s.name << ':' << s.marks << ' ';
    std::cout << '\n';

    int threshold = 80;
    auto passed = std::count_if(cls.begin(), cls.end(), [threshold](const Student& s) { return s.marks >= threshold; }); // capture by value
    int total = std::accumulate(cls.begin(), cls.end(), 0, [](int sum, const Student& s) { return sum + s.marks; });
    auto top = std::max_element(cls.begin(), cls.end(), [](auto& a, auto& b) { return a.marks < b.marks; });   // generic lambda
    std::cout << passed << " passed, average " << total / double(cls.size()) << ", top " << top->name << '\n';

    std::vector<int> v{7, 2, 9, 4, 4, 1, 8};
    std::sort(v.begin(), v.end());                                     // 1 2 4 4 7 8 9
    auto lo = std::lower_bound(v.begin(), v.end(), 4);                 // first element >= 4
    auto hi = std::upper_bound(v.begin(), v.end(), 4);                 // first element > 4
    std::cout << "4 occurs " << (hi - lo) << " times at index " << (lo - v.begin()) << '\n';
    v.erase(std::unique(v.begin(), v.end()), v.end());                 // remove adjacent duplicates
    std::erase_if(v, [](int x) { return x % 2 == 0; });                // C++20: no erase-remove dance

    std::vector<int> squares(v.size());
    std::transform(v.begin(), v.end(), squares.begin(), [](int x) { return x * x; });

    int calls = 0;
    auto counter = [&calls]() { ++calls; };                            // capture by reference
    counter(); counter();
    auto idGen = [next = 100]() mutable { return next++; };            // init-capture + mutable
    std::cout << calls << ' ' << idGen() << ' ' << idGen() << '\n';

    std::function<int(int, int)> op = std::plus<>{};                   // type-erased callable
    std::cout << op(2, 3) << '\n';

    // C++20 ranges: lazy pipeline over the container
    auto delhiNames = cls | std::views::filter([](const Student& s) { return s.city == "Delhi"; })
                          | std::views::transform(&Student::name);
    for (const auto& n : delhiNames) std::cout << n << ' ';
    std::cout << '\n';
    std::ranges::sort(squares, std::greater<>{});
    for (int x : squares | std::views::take(2)) std::cout << x << ' ';
    std::cout << '\n';
}`),
      ],
      tips: [
        "std::remove_if does not shrink the container — it moves kept elements forward and returns the new logical end.",
        "Capturing by reference in a lambda that outlives the scope (stored callbacks, threads) creates dangling references.",
        "std::sort is not stable; use std::stable_sort when equal elements must keep their order.",
        "Comparators must implement strict weak ordering — using <= causes undefined behaviour in sort.",
      ],
      subjective: [
        qa("Explain lambda capture modes with examples.", "[] captures nothing. [x] copies x into the lambda when it is created; later changes to x are not seen, and the copy is const unless the lambda is mutable. [&x] refers to x, so changes are shared but the lambda must not outlive x. [=] captures by value every local variable used; [&] captures by reference every one used. [this] captures the current object pointer ([*this] copies the object in C++17). Mixed forms like [=, &total] and init-captures [p = std::move(ptr)] (C++14) allow moving or computing captured values."),
        qa("What is the erase-remove idiom?", "Standard algorithms cannot change a container's size, so std::remove/remove_if move the elements to keep to the front and return an iterator to the new logical end; the leftover elements past it are unspecified. Calling container.erase(new_end, container.end()) then actually removes them: v.erase(std::remove_if(v.begin(), v.end(), pred), v.end()). C++20 adds std::erase and std::erase_if to do both in one call."),
      ],
      objective: [
        mcq("std::sort requires which iterator category?", ["Input", "Forward", "Bidirectional", "Random access"], 3, "That is why std::list has list::sort."),
        mcq("lower_bound on a sorted range returns the first element:", ["Equal to the value", "Not less than the value", "Greater than the value", "Less than the value"], 1, "upper_bound returns the first greater element."),
        mcq("Which capture copies all used local variables?", ["[&]", "[=]", "[this]", "[]"], 1, "[&] captures by reference."),
        mcq("What does std::accumulate(v.begin(), v.end(), 0) compute?", ["Product", "Sum", "Maximum", "Count"], 1, "From <numeric>."),
        mcq("A lambda that modifies its by-value captures must be declared:", ["const", "mutable", "static", "inline"], 1, "Its call operator is const otherwise."),
      ],
    },
    {
      id: "smart-pointers", module: "Modern C++", title: "Smart pointers: unique_ptr, shared_ptr and weak_ptr", level: "Intermediate", minutes: 18,
      summary: "Ownership semantics, make_unique/make_shared, transferring ownership, reference counting, cycles and custom deleters.",
      description: [
        "Smart pointers are RAII wrappers that own heap objects and delete them automatically. std::unique_ptr<T> expresses exclusive ownership: it cannot be copied, only moved, has the same size as a raw pointer (with the default deleter) and zero overhead. Create it with std::make_unique<T>(args...). Transfer ownership with std::move; release() gives up ownership and reset() replaces or deletes the object. unique_ptr<T[]> manages arrays.",
        "std::shared_ptr<T> expresses shared ownership with reference counting: copies increment an atomic count in a control block, and the object is deleted when the last shared_ptr goes away. std::make_shared allocates the object and control block together (one allocation, better locality). Overheads: two pointers per shared_ptr, atomic count updates and the control block.",
        "Reference cycles (A holds a shared_ptr to B and B to A) keep counts above zero forever, leaking both. std::weak_ptr observes a shared object without owning it; lock() returns a shared_ptr if the object still exists. Typical uses: parent back-pointers, caches and observers.",
        "Raw pointers and references remain fine as non-owning parameters (void draw(const Shape&) or Shape*); pass smart pointers to functions only when the function participates in ownership (takes, shares or may reset it). Custom deleters let unique_ptr manage non-memory resources such as FILE* or OS handles.",
      ],
      usage: [
        "Use unique_ptr by default for heap-allocated objects, factories and polymorphic members.",
        "Use shared_ptr only when ownership is genuinely shared and lifetimes cannot be ordered.",
        "Break parent/child or observer cycles with weak_ptr.",
        "Never create two independent shared_ptrs from the same raw pointer — use enable_shared_from_this for shared_from_this().",
      ],
      files: [
        file("src/smart_pointers.cpp", code`
#include <cstdio>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct Node {
    std::string name;
    std::vector<std::shared_ptr<Node>> children;   // parent owns children
    std::weak_ptr<Node> parent;                    // child observes parent: no cycle
    explicit Node(std::string n) : name(std::move(n)) { }
    ~Node() { std::cout << "~Node " << name << '\n'; }
};

std::unique_ptr<std::string> makeGreeting(const std::string& who) {   // factory returns ownership
    return std::make_unique<std::string>("Hello, " + who);
}

void consume(std::unique_ptr<std::string> p) { std::cout << "consumed " << *p << '\n'; }   // takes ownership
void observe(const std::string& s) { std::cout << "observed " << s << '\n'; }             // non-owning

int main() {
    auto greeting = makeGreeting("Asha");
    observe(*greeting);
    // auto copy = greeting;                   // error: unique_ptr is not copyable
    consume(std::move(greeting));              // explicit transfer
    std::cout << "greeting is " << (greeting ? "set" : "null") << '\n';

    auto root = std::make_shared<Node>("root");
    {
        auto child = std::make_shared<Node>("child");
        child->parent = root;
        root->children.push_back(child);
        std::cout << "child use_count=" << child.use_count() << '\n';   // 2: local + vector
        if (auto p = child->parent.lock()) std::cout << "child's parent is " << p->name << '\n';
    }
    std::cout << "root use_count=" << root.use_count() << '\n';         // 1: weak_ptr does not count

    // Custom deleter: unique_ptr closing a C FILE*
    std::unique_ptr<std::FILE, decltype(&std::fclose)> file(std::fopen("log.txt", "w"), &std::fclose);
    if (file) std::fputs("written via unique_ptr\n", file.get());

    std::unique_ptr<int[]> arr = std::make_unique<int[]>(5);            // array form: delete[] used
    arr[2] = 42;
    std::cout << arr[2] << '\n';
}                                                                      // root, child, file and arr released automatically`),
      ],
      tips: [
        "auto p = std::make_unique<T>() is exception-safe; f(std::unique_ptr<T>(new T), g()) was not before C++17.",
        "shared_ptr's reference count is thread-safe; the pointed-to object is not.",
        "use_count() is for debugging only — do not build logic on it.",
        "A unique_ptr<Base> needs Base to have a virtual destructor when it holds Derived.",
      ],
      subjective: [
        qa("Compare unique_ptr, shared_ptr and weak_ptr.", "unique_ptr: sole ownership, move-only, deletes the object when it goes out of scope or is reset, zero overhead compared with a raw pointer. shared_ptr: shared ownership via a reference-counted control block, copyable, deletes the object when the last owner is destroyed, extra memory and atomic operations. weak_ptr: a non-owning observer of an object managed by shared_ptr; it does not affect the strong count, can detect expiry and must be converted with lock() to access the object; it breaks reference cycles."),
        qa("Why is make_shared preferred over shared_ptr<T>(new T)?", "make_shared performs a single allocation for both the object and the control block, improving speed and cache locality, and it is exception-safe because no raw new escapes into an expression where another argument might throw first. It also avoids repeating the type. Drawbacks: custom deleters cannot be used, and with weak_ptrs outstanding the object's memory is held until the control block is freed."),
        qa("How do reference cycles cause memory leaks with shared_ptr?", "If object A holds a shared_ptr to B and B holds a shared_ptr to A, then even after all external shared_ptrs are destroyed each object's count stays at least one because the other owns it. Neither destructor runs and the memory leaks. Fix by making one direction non-owning — usually the back-reference (child to parent, observer to subject) — with weak_ptr or a raw pointer whose lifetime is guaranteed."),
      ],
      objective: [
        mcq("Which smart pointer cannot be copied?", ["shared_ptr", "weak_ptr", "unique_ptr", "All can be copied"], 2, "It can only be moved."),
        mcq("weak_ptr is mainly used to:", ["Speed up access", "Break shared_ptr reference cycles", "Manage arrays", "Replace references"], 1, "It does not own the object."),
        mcq("Which function creates a unique_ptr safely?", ["std::new_unique", "std::make_unique", "std::unique", "std::allocate_unique"], 1, "Available since C++14."),
        mcq("When is an object managed by shared_ptr deleted?", ["When any shared_ptr is destroyed", "When the last owning shared_ptr is destroyed or reset", "At program exit only", "When weak_ptr expires"], 1, "The strong count reaches zero."),
        mcq("weak_ptr::lock() returns:", ["A raw pointer", "A shared_ptr (empty if expired)", "A bool", "A unique_ptr"], 1, "Check it before use."),
      ],
    },
    {
      id: "move-semantics", module: "Modern C++", title: "Move semantics, rvalue references and perfect forwarding", level: "Advanced", minutes: 18,
      summary: "lvalues and rvalues, T&&, std::move, move constructors in practice, forwarding references and std::forward.",
      description: [
        "Every expression is an lvalue (has identity — a named variable, *p) or an rvalue (a temporary or value about to expire — 42, a + b, a function returning by value). Rvalue references (T&&) bind to rvalues, letting a function know that its argument is a temporary whose resources can be stolen rather than copied.",
        "A move constructor/assignment transfers resources (heap pointers, file handles) from the source and leaves it valid but empty. Moving a std::vector of a million elements is a few pointer assignments instead of a million copies. Standard containers and std::string implement moves; vector uses an element's move constructor during reallocation only if it is noexcept.",
        "std::move(x) does not move anything: it is a cast to an rvalue reference that permits a move. After moving from an object, only assign to it or destroy it. Do not std::move a return value of a local (return std::move(local);) — it disables copy elision (named return value optimization).",
        "In a template, T&& with deduced T is a forwarding (universal) reference that binds to both lvalues and rvalues through reference collapsing. std::forward<T>(arg) passes the argument on with its original value category, which is how std::make_unique and emplace_back construct objects without extra copies (perfect forwarding).",
      ],
      usage: [
        "Return large objects by value — compilers elide or move them.",
        "Use std::move when handing an object you no longer need to a function or container.",
        "Take “sink” parameters by value and move from them (setName(std::string n) { name_ = std::move(n); }).",
        "Use emplace_back and std::forward in generic factories.",
      ],
      files: [
        file("src/move_semantics.cpp", code`
#include <iostream>
#include <memory>
#include <string>
#include <utility>
#include <vector>

class Track {
    std::string title_;
    std::vector<int> samples_;
public:
    Track(std::string title, std::size_t n) : title_(std::move(title)), samples_(n, 1) { }
    Track(const Track& o) : title_(o.title_), samples_(o.samples_) { std::cout << "copy " << title_ << '\n'; }
    Track(Track&& o) noexcept : title_(std::move(o.title_)), samples_(std::move(o.samples_)) {
        std::cout << "move " << title_ << '\n';
    }
    std::size_t size() const { return samples_.size(); }
};

void overload(const std::string&) { std::cout << "lvalue overload\n"; }
void overload(std::string&&) { std::cout << "rvalue overload\n"; }

// Forwarding reference + std::forward: preserves lvalue/rvalue-ness
template <typename T>
void relay(T&& arg) { overload(std::forward<T>(arg)); }

template <typename T, typename... Args>
std::unique_ptr<T> create(Args&&... args) { return std::unique_ptr<T>(new T(std::forward<Args>(args)...)); }

Track record() {
    Track t("live", 1'000'000);
    return t;                                    // NRVO or move; never write return std::move(t);
}

int main() {
    std::string name = "Asha";
    overload(name);                              // lvalue
    overload(std::string("tmp"));                // rvalue
    overload(std::move(name));                   // cast to rvalue
    relay(name);                                 // forwards as lvalue
    relay(std::string("x"));                     // forwards as rvalue

    std::vector<Track> playlist;
    playlist.reserve(4);
    Track intro("intro", 10);
    playlist.push_back(intro);                   // copy: we still use intro
    playlist.push_back(std::move(intro));        // move: intro is now empty (valid, unspecified)
    playlist.emplace_back("outro", 20);          // constructed in place: no copy, no move
    playlist.push_back(record());                // temporary: moved
    std::cout << "intro after move has " << intro.size() << " samples\n";

    auto t = create<Track>("made", 5);           // arguments perfectly forwarded to the constructor
    std::cout << t->size() << '\n';
}`),
      ],
      tips: [
        "A named rvalue reference (Track&& o inside the function) is itself an lvalue — that is why members are moved with std::move(o.x).",
        "const objects cannot be moved from: std::move on a const value silently copies.",
        "Mark move operations noexcept, or vector growth will copy instead of move.",
        "T&& is a forwarding reference only when T is deduced (template parameter or auto&&).",
      ],
      subjective: [
        qa("What is move semantics and why was it introduced?", "Move semantics (C++11) lets resources be transferred from objects that are no longer needed — temporaries or objects explicitly cast with std::move — instead of being deep-copied. Classes implement a move constructor and move assignment taking T&& that steal the source's internal pointers and leave it empty. It eliminates expensive copies when returning containers, inserting into containers, sorting, and passing ownership (unique_ptr), greatly improving performance without changing interfaces."),
        qa("Explain std::move and std::forward.", "std::move(x) unconditionally casts x to an rvalue reference (static_cast<T&&>), signalling that x may be moved from; it performs no move itself — the move happens when the result binds to a move constructor or assignment. std::forward<T>(x) conditionally casts: it yields an rvalue only if the original argument was an rvalue (T deduced as a non-reference) and an lvalue otherwise. It is used with forwarding references in templates to preserve the argument's value category (perfect forwarding)."),
        qa("Differentiate lvalues and rvalues.", "An lvalue designates an object with an identity that persists beyond a single expression — variables, dereferenced pointers, array elements, functions returning T& — and you can take its address. An rvalue is a temporary value without persistent identity — literals (except strings), results of arithmetic, functions returning by value, std::move(x). Lvalue references (T&) bind to lvalues, const T& binds to both, rvalue references (T&&) bind to rvalues."),
      ],
      objective: [
        mcq("What does std::move actually do?", ["Moves memory", "Casts its argument to an rvalue reference", "Deletes the source", "Copies faster"], 1, "The move constructor does the work."),
        mcq("Which binds to a temporary std::string?", ["std::string&", "std::string&&", "Both", "Neither"], 1, "const std::string& also binds."),
        mcq("Perfect forwarding uses:", ["std::move", "std::forward", "std::ref", "std::copy"], 1, "With forwarding references T&&."),
        mcq("Writing return std::move(localVar); typically:", ["Improves performance", "Prevents copy elision (NRVO)", "Is required", "Causes a compile error"], 1, "Return the local by name instead."),
      ],
    },
    {
      id: "exceptions-files", module: "Modern C++", title: "Exception handling and file streams", level: "Intermediate", minutes: 16,
      summary: "throw/try/catch, standard exception hierarchy, stack unwinding, noexcept, exception-safety guarantees, and fstream I/O.",
      description: [
        "C++ signals errors with throw expr; the runtime unwinds the stack — destroying automatic objects in each frame (which is why RAII guarantees cleanup) — until a matching catch handler is found. Catch by const reference (catch (const std::exception& e)) to avoid slicing and copies; order handlers from most to least specific; catch (...) catches everything. If nothing catches an exception, std::terminate is called.",
        "The standard hierarchy derives from std::exception (what() returns a message): std::logic_error (invalid_argument, out_of_range, domain_error, length_error) for programming errors, std::runtime_error (overflow_error, range_error, system_error) for conditions detectable only at run time, plus std::bad_alloc and std::bad_cast. Derive custom exceptions from these.",
        "noexcept declares that a function will not throw; if it does, std::terminate is called. Destructors are implicitly noexcept. Exception-safety guarantees describe what holds after a throw: basic (no leaks, objects valid), strong (commit-or-rollback, like vector::push_back), and nothrow. Many codebases (games, embedded) disable exceptions and use error codes or std::expected (C++23) instead.",
        "File I/O uses <fstream>: std::ifstream reads, std::ofstream writes, std::fstream does both; open modes include std::ios::app, binary, trunc. Streams are RAII objects (closed by their destructors); check state with if (!file), good(), eof() and fail(). <filesystem> (C++17) handles paths, directories, sizes and copies.",
      ],
      usage: [
        "Throw exceptions for errors the immediate caller cannot handle; catch them where recovery is possible.",
        "Catch by const reference and rethrow with plain throw; to preserve the original type.",
        "Mark move operations, swaps and destructors noexcept.",
        "Use ifstream/ofstream with std::getline for text, and read/write with binary mode for raw data.",
      ],
      files: [
        file("src/exceptions_files.cpp", code`
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

class ParseError : public std::runtime_error {             // custom exception
public:
    ParseError(const std::string& msg, int line) : std::runtime_error(msg + " at line " + std::to_string(line)), line_(line) { }
    int line() const noexcept { return line_; }
private:
    int line_;
};

struct Row { std::string name; int marks; };

std::vector<Row> load(const std::filesystem::path& path) {
    std::ifstream in(path);                                 // RAII: closed automatically
    if (!in) throw std::runtime_error("cannot open " + path.string());
    std::vector<Row> rows;
    std::string line;
    int lineNo = 0;
    while (std::getline(in, line)) {
        ++lineNo;
        if (line.empty() || line[0] == '#') continue;
        std::istringstream fields(line);
        Row r;
        if (!(std::getline(fields, r.name, ',') && fields >> r.marks)) throw ParseError("bad row '" + line + "'", lineNo);
        if (r.marks < 0 || r.marks > 100) throw std::out_of_range("marks out of range at line " + std::to_string(lineNo));
        rows.push_back(r);
    }
    return rows;
}

int main() {
    {
        std::ofstream out("marks.csv");                     // truncates by default
        out << "# name,marks\nAsha,91\nRavi,78\nMeera,abc\n";
    }
    std::ofstream("audit.log", std::ios::app) << "run started\n";   // append mode

    try {
        auto rows = load("marks.csv");
        std::cout << rows.size() << " rows\n";
    } catch (const ParseError& e) {                          // most specific first
        std::cerr << "parse error: " << e.what() << " (line " << e.line() << ")\n";
    } catch (const std::exception& e) {
        std::cerr << "error: " << e.what() << '\n';
    }

    try { load("missing.csv"); }
    catch (const std::runtime_error& e) { std::cerr << e.what() << '\n'; }

    std::cout << "size of marks.csv: " << std::filesystem::file_size("marks.csv") << " bytes\n";

    std::ofstream bin("data.bin", std::ios::binary);
    int values[3]{1, 2, 3};
    bin.write(reinterpret_cast<const char*>(values), sizeof values);   // raw bytes
}`),
      ],
      tips: [
        "Throwing from a destructor during stack unwinding calls std::terminate — destructors must not throw.",
        "Catching std::exception by value slices derived exceptions and loses their what() text.",
        "while (!in.eof()) is a classic bug that processes the last line twice; loop on the read itself.",
        "Exceptions should be exceptional — do not use them for normal control flow in hot loops.",
      ],
      subjective: [
        qa("Explain stack unwinding.", "When an exception is thrown, control leaves the current function and travels up the call stack looking for a matching catch block. As each function frame is exited, the destructors of all fully constructed automatic objects in that frame are called in reverse order of construction. This process, stack unwinding, guarantees that RAII objects release their resources. If no handler is found, std::terminate is called (whether unwinding happens then is implementation-defined)."),
        qa("What are the exception-safety guarantees?", "No-throw guarantee: the operation never throws (destructors, swap, move operations ideally). Strong guarantee: if an exception is thrown, program state is unchanged — commit or rollback (std::vector::push_back provides it when moves are noexcept or copies are used). Basic guarantee: if an exception is thrown, no resources leak and all objects remain in valid but unspecified states. No guarantee: anything may be broken — unacceptable in good code."),
      ],
      objective: [
        mcq("How should exceptions usually be caught?", ["By value", "By const reference", "By pointer", "By rvalue reference"], 1, "Avoids slicing and copying."),
        mcq("What happens if an exception is not caught anywhere?", ["It is ignored", "std::terminate is called", "main returns 1 silently", "The OS retries"], 1, "The default terminate handler calls abort."),
        mcq("Which header provides std::ifstream?", ["<iostream>", "<fstream>", "<sstream>", "<filesystem>"], 1, "File stream classes."),
        mcq("std::out_of_range derives from:", ["std::runtime_error", "std::logic_error", "std::bad_alloc", "Nothing"], 1, "It indicates a precondition violation."),
        mcq("catch (...) catches:", ["Only std::exception", "Any exception", "Only integers", "Nothing"], 1, "The catch-all handler."),
      ],
    },
    {
      id: "concurrency", module: "Modern C++", title: "Concurrency: threads, mutexes, atomics and async", level: "Advanced", minutes: 20,
      summary: "std::thread and jthread, data races, mutex and lock guards, condition variables, std::atomic, futures and async.",
      description: [
        "std::thread starts a function on a new OS thread; you must join() or detach() it before its destructor runs, or the program terminates. C++20's std::jthread joins automatically and supports cooperative cancellation through std::stop_token. Arguments are copied into the thread; pass references with std::ref.",
        "A data race — two threads accessing the same memory without synchronization, at least one writing — is undefined behaviour. Protect shared data with std::mutex using RAII locks: std::lock_guard (simple scope lock), std::unique_lock (movable, can unlock, needed for condition variables) and std::scoped_lock (locks several mutexes without deadlock). std::shared_mutex allows multiple readers.",
        "std::condition_variable lets threads wait for a condition: wait(lock, predicate) releases the mutex while sleeping and re-checks the predicate on wake-up, guarding against spurious wake-ups. std::atomic<T> provides lock-free (for small types) atomic operations such as fetch_add and compare_exchange, with memory orderings (default sequentially consistent).",
        "Higher-level tools: std::async launches a task and returns a std::future whose get() waits for the result or rethrows its exception; std::promise sets a future's value from another thread; std::packaged_task wraps a callable. C++17 parallel algorithms accept execution policies (std::execution::par) to parallelize standard algorithms.",
      ],
      usage: [
        "Parallelize CPU-bound work across cores (image processing, simulations, batch computations).",
        "Protect every shared mutable variable with a mutex or make it atomic.",
        "Use condition variables or concurrent queues for producer–consumer pipelines.",
        "Use ThreadSanitizer (-fsanitize=thread) to detect data races during testing.",
      ],
      files: [
        file("src/concurrency.cpp", code`
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <future>
#include <iostream>
#include <mutex>
#include <numeric>
#include <queue>
#include <thread>
#include <vector>

std::mutex coutMutex;

long long partialSum(const std::vector<int>& v, std::size_t from, std::size_t to) {
    return std::accumulate(v.begin() + from, v.begin() + to, 0LL);
}

// Thread-safe queue with a condition variable
class JobQueue {
    std::queue<int> jobs_;
    std::mutex m_;
    std::condition_variable cv_;
    bool closed_ = false;
public:
    void push(int job) {
        { std::lock_guard lock(m_); jobs_.push(job); }
        cv_.notify_one();
    }
    void close() { { std::lock_guard lock(m_); closed_ = true; } cv_.notify_all(); }
    bool pop(int& job) {
        std::unique_lock lock(m_);
        cv_.wait(lock, [this] { return !jobs_.empty() || closed_; });   // predicate handles spurious wake-ups
        if (jobs_.empty()) return false;
        job = jobs_.front(); jobs_.pop();
        return true;
    }
};

int main() {
    std::vector<int> data(1'000'000, 1);

    // std::async + futures: split the work in two
    auto left = std::async(std::launch::async, partialSum, std::cref(data), 0, data.size() / 2);
    auto right = std::async(std::launch::async, partialSum, std::cref(data), data.size() / 2, data.size());
    std::cout << "sum = " << left.get() + right.get() << '\n';

    // Data race fixed two ways
    int unsafe = 0;
    std::atomic<int> atomicCount{0};
    int guarded = 0;
    std::mutex m;
    {
        std::vector<std::jthread> workers;                       // jthread joins in its destructor
        for (int t = 0; t < 4; ++t)
            workers.emplace_back([&] {
                for (int i = 0; i < 10'000; ++i) {
                    ++unsafe;                                    // DATA RACE: undefined behaviour
                    atomicCount.fetch_add(1, std::memory_order_relaxed);
                    std::lock_guard lock(m);                     // RAII lock
                    ++guarded;
                }
            });
    }
    std::cout << "atomic=" << atomicCount << " guarded=" << guarded << " (unsafe=" << unsafe << ")\n";

    // Producer-consumer
    JobQueue queue;
    std::jthread consumer([&queue] {
        int job;
        while (queue.pop(job)) {
            std::lock_guard lock(coutMutex);
            std::cout << "processing job " << job << '\n';
        }
    });
    for (int j = 1; j <= 3; ++j) queue.push(j);
    queue.close();

    // Cooperative cancellation with stop_token (C++20)
    std::jthread ticker([](std::stop_token stop) {
        while (!stop.stop_requested()) std::this_thread::sleep_for(std::chrono::milliseconds(10));
    });
    ticker.request_stop();
}`),
      ],
      tips: [
        "A std::thread that is neither joined nor detached calls std::terminate in its destructor — prefer jthread.",
        "Lock multiple mutexes with std::scoped_lock(a, b) to avoid deadlocks from inconsistent ordering.",
        "volatile is not a synchronization mechanism in C++ — use std::atomic.",
        "std::async with the default policy may run the task lazily on get(); pass std::launch::async for real concurrency.",
      ],
      subjective: [
        qa("What is a data race and how do you prevent it in C++?", "A data race occurs when two or more threads access the same memory location concurrently, at least one access is a write, and the accesses are not ordered by synchronization. It is undefined behaviour — results can be torn, stale or arbitrary. Prevent it by protecting shared data with a mutex (std::lock_guard/std::scoped_lock), using std::atomic for simple shared variables, avoiding shared mutable state (message passing, thread-local data), or using thread-safe structures."),
        qa("Differentiate lock_guard, unique_lock and scoped_lock.", "std::lock_guard: the simplest RAII wrapper — locks a single mutex in its constructor and unlocks in its destructor; not movable and cannot unlock early. std::unique_lock: flexible — can defer locking, try to lock, unlock and relock, be moved, and is required by condition_variable::wait. std::scoped_lock (C++17): locks one or more mutexes at once using a deadlock-avoidance algorithm and unlocks them at scope exit."),
        qa("Why must condition_variable::wait be used with a predicate?", "Threads can wake up without a notify (spurious wake-ups), and by the time a notified thread reacquires the mutex another thread may have consumed the state change (lost or stolen wake-ups). Waiting in a loop that re-checks the shared condition — or using the wait(lock, predicate) overload, which does exactly that — guarantees the thread proceeds only when the condition is truly satisfied."),
      ],
      objective: [
        mcq("What happens if a joinable std::thread is destroyed?", ["It joins automatically", "std::terminate is called", "It detaches", "Nothing"], 1, "std::jthread joins automatically."),
        mcq("Which type provides atomic operations without explicit locks?", ["std::mutex", "std::atomic<T>", "volatile T", "std::future<T>"], 1, "Lock-free for small types on most platforms."),
        mcq("std::future::get() does what?", ["Starts the task", "Waits for and returns the result (or rethrows its exception)", "Cancels the task", "Returns immediately with a default"], 1, "It can be called only once."),
        mcq("Which lock type is required by std::condition_variable::wait?", ["std::lock_guard", "std::unique_lock<std::mutex>", "std::scoped_lock", "std::shared_lock"], 1, "wait must unlock and relock the mutex."),
      ],
    },
  ],
};
