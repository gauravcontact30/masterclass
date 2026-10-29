import type { TopicEssentials } from "../types";

/** C++ topics distilled: the idea each rests on, the answer to give when asked, and what to remember. */
export const ESSENTIALS: Record<string, TopicEssentials> = {
  "compilation-basics": {
    core: "Each .cpp file is compiled separately into an object file; the linker then joins the object files into one executable.",
    answer: "Building a C++ program takes four stages. The preprocessor expands #include and macros. The compiler turns each translation unit into assembly. The assembler produces object files. The linker resolves symbols across object files and libraries. Headers hold declarations shared between files, and source files hold definitions. The one-definition rule allows many declarations but exactly one definition of each non-inline function or variable in the whole program.",
    keyPoints: [
      "Include guards or #pragma once stop a header from being included twice in one translation unit.",
      "An \"undefined reference\" error comes from the linker: the symbol was declared but never defined or linked.",
      "Never write using namespace std; in a header.",
      "main returns int, and returning 0 (or falling off the end of main) means success.",
      "Compile with warnings and a standard: g++ -std=c++20 -Wall -Wextra -O2.",
    ],
  },
  "types-control-functions": {
    core: "C++ is statically typed with value semantics by default; passing by reference avoids copies and lets a function change the caller's object.",
    answer: "Fundamental types include bool, char, int, long long, float and double, and their sizes are implementation-defined, with minimum ranges guaranteed. auto deduces a type from its initializer, and const forbids modification. Pass large objects by const T&, pass by T& when the function must modify them, and pass small types by value. Functions can be overloaded on their parameter types and take default arguments. constexpr functions can run at compile time, and inline permits definitions in headers.",
    keyPoints: [
      "Uninitialised local variables hold indeterminate values: always initialise them.",
      "Brace initialisation (int x{3.5};) rejects narrowing conversions.",
      "Signed integer overflow is undefined behaviour; unsigned arithmetic wraps around.",
      "Default arguments belong in the declaration, not repeated in the definition.",
      "Use std::size_t for sizes and indexes, and std::int64_t when you need an exact width.",
    ],
  },
  "arrays-strings-vector": {
    core: "Prefer std::vector, std::array and std::string to raw arrays: they know their size and manage their own memory.",
    answer: "A built-in array has a fixed compile-time size and decays to a pointer to its first element when passed to a function, which loses the length. std::array<T, N> is a fixed-size array with value semantics and size(). std::vector<T> is a dynamic array with amortised O(1) push_back: when it runs out of capacity it reallocates and moves its elements. std::string manages characters with find, substr, append and comparison operators.",
    keyPoints: [
      "operator[] is unchecked; at() throws std::out_of_range.",
      "reserve(n) avoids repeated reallocations when the final size is known.",
      "Reallocation invalidates every pointer, reference and iterator into a vector.",
      "emplace_back constructs the element in place; push_back copies or moves an existing object.",
      "std::string_view gives a cheap read-only view of a string, but must not outlive it.",
    ],
  },
  "pointers-references": {
    core: "A pointer holds an address and can be null or reassigned; a reference is an alias for an existing object and is always bound.",
    answer: "&x takes an address and *p dereferences it. Pointer arithmetic moves in units of the element size. Use nullptr, never NULL or 0, for a null pointer. const int* p points to a constant int, and int* const p is a constant pointer; read the declaration from right to left. A reference must be initialised and cannot be reseated, which makes it the usual choice for parameters. A function pointer stores a callable address, though lambdas and std::function are usually clearer.",
    keyPoints: [
      "Dereferencing a null, dangling or uninitialised pointer is undefined behaviour.",
      "Never return a pointer or reference to a local variable.",
      "Prefer references for parameters that must exist, and pointers or std::optional for ones that may be absent.",
      "Raw pointers should observe objects, not own them; ownership belongs to smart pointers.",
      "sizeof applied to a pointer gives the pointer's size, not the size of the array it points into.",
    ],
  },
  "dynamic-memory": {
    core: "Stack objects die automatically at the end of their scope; heap objects live until freed, and RAII ties freeing heap resources to a stack object's lifetime.",
    answer: "Automatic (stack) storage is fast and scoped. Dynamic (heap) storage from new lasts until delete, and arrays from new[] need delete[]. Forgetting to delete leaks memory; deleting twice or reading freed memory is undefined behaviour. With RAII (Resource Acquisition Is Initialization), a constructor acquires a resource and the destructor releases it, so cleanup happens even when exceptions are thrown. std::vector, std::unique_ptr and std::lock_guard are RAII types, and modern code rarely calls new or delete directly.",
    keyPoints: [
      "Pair new with delete and new[] with delete[]; mixing them is undefined behaviour.",
      "Set a raw pointer to nullptr after deleting it, or better, avoid owning raw pointers.",
      "Find leaks and use-after-free with -fsanitize=address or Valgrind.",
      "Stack space is small (often 1–8 MB): put large buffers on the heap, for example in a vector.",
      "Destructors run in reverse order of construction.",
    ],
  },
  "classes-objects": {
    core: "A class bundles data with the functions that maintain its invariants; constructors establish those invariants and destructors release resources.",
    answer: "Members are private by default in a class and public in a struct. Constructors can be default, parameterised, copy, move or delegating, and explicit prevents implicit conversions. A member initializer list initialises members before the constructor body runs; it is required for const members, references and members without default constructors, and members are initialised in declaration order, not list order. Const member functions promise not to modify the object, static members are shared by all instances, and friend grants access to non-members.",
    keyPoints: [
      "Mark single-argument constructors explicit unless you want implicit conversion.",
      "this is a pointer to the current object, and in a const member function it points to const.",
      "In-class member initialisers (int count = 0;) set defaults that every constructor uses.",
      "Mark getters const, or they cannot be called on const objects.",
      "A static data member is defined once outside the class, or declared inline inside it (C++17).",
    ],
  },
  "copy-control": {
    core: "If a class manages a resource, copying it must copy the resource too (a deep copy); otherwise two objects free the same memory.",
    answer: "The compiler-generated copy constructor and copy assignment copy member by member, which is a shallow copy of raw pointers. Rule of three: if you need a custom destructor, copy constructor or copy assignment, you probably need all three. The rule of five adds the move constructor and move assignment. The rule of zero is the goal: hold resources in RAII members such as vector, string and unique_ptr and write none of them. Copy-and-swap gives an exception-safe assignment that also handles self-assignment.",
    keyPoints: [
      "A shallow copy of an owning pointer causes double deletes and dangling pointers.",
      "Copy assignment must handle self-assignment (a = a).",
      "Declaring a destructor suppresses the implicit move operations.",
      "= delete forbids copying (for unique owners); = default restores the generated version.",
      "Mark move operations noexcept so std::vector moves elements instead of copying them.",
    ],
  },
  "operator-overloading": {
    core: "Overloaded operators let user-defined types behave like built-in ones, and should keep the operator's usual meaning.",
    answer: "Operators can be member functions, where the left operand is *this, or non-member functions, which are needed when the left operand is another type, as with ostream << obj or 2 * vec. Implement += as a member and + as a non-member built on it. C++20's operator<=> (spaceship), defaulted with = default, generates all six comparisons. operator[] should have const and non-const versions, and operator() makes function objects. =, [], () and -> must be members.",
    keyPoints: [
      "::, ., .*, ?: and sizeof cannot be overloaded.",
      "Stream operators return the stream by reference so calls can chain.",
      "Assignment operators return *this by reference.",
      "Overloading && or || loses short-circuit evaluation: don't.",
      "A defaulted operator== compares members in declaration order.",
    ],
  },
  "inheritance-virtual": {
    core: "Virtual functions dispatch on the object's dynamic type through a vtable, which lets base-class pointers and references drive derived behaviour.",
    answer: "With public inheritance, Derived is-a Base. Construction runs from base to derived, and destruction runs in reverse. Declaring a function virtual makes calls through a Base* or Base& go to the most-derived override, typically through a per-class vtable and a per-object vptr. Mark overrides with override and stop further overriding with final. A pure virtual function (= 0) makes the class abstract. A polymorphic base needs a virtual destructor, or deleting through a base pointer is undefined behaviour. Copying a derived object into a base object slices off the derived part.",
    keyPoints: [
      "Virtual calls made inside constructors and destructors do not reach derived overrides.",
      "Pass polymorphic objects by reference or pointer, never by value, to avoid slicing.",
      "A derived function with the same name hides every base overload: bring them back with using Base::f;.",
      "Virtual inheritance solves the diamond problem by sharing one base subobject.",
      "Default arguments bind statically, by the type of the pointer, not of the object.",
    ],
  },
  templates: {
    core: "Templates are blueprints the compiler instantiates for each type used, giving generic code with no run-time cost.",
    answer: "Function templates deduce their type parameters from the arguments, and class templates (std::vector<T>) take them explicitly or through CTAD (class template argument deduction). Full specialisation provides a custom implementation for a specific type, and class templates also allow partial specialisation. Variadic templates accept any number of types (template<class... Ts>) and expand them with fold expressions. C++20 concepts constrain templates (template<std::integral T>), giving clear errors instead of pages of instantiation failures.",
    keyPoints: [
      "Template definitions normally live in headers, because the compiler needs them to instantiate.",
      "Every distinct instantiation adds code, so heavy templates can bloat binaries.",
      "Function templates cannot be partially specialised: overload them instead.",
      "typename tells the compiler that a dependent name is a type (typename T::value_type).",
      "Prefer concepts and requires clauses to SFINAE tricks in new code.",
    ],
  },
  "stl-containers": {
    core: "Pick a container by its operations' complexity and by when it invalidates iterators; std::vector is the right default.",
    answer: "Sequence containers are vector (contiguous, O(1) amortised push_back), deque (O(1) at both ends) and list (O(1) splicing, no random access). set and map are ordered red-black trees with O(log n) operations; unordered_set and unordered_map are hash tables with O(1) average and O(n) worst case. Adapters wrap other containers: stack, queue and priority_queue (a binary heap, max-first by default). Insertions can invalidate iterators: any vector reallocation invalidates all of them, while list and map iterators survive the insertion of other elements.",
    keyPoints: [
      "map[key] inserts a default value if the key is missing; use find or contains (C++20) to check.",
      "For a min-heap, use priority_queue<int, vector<int>, greater<int>>.",
      "unordered_* containers need a hash for custom keys; the ordered ones need operator<.",
      "Erase while iterating with it = c.erase(it).",
      "vector usually beats list in practice because of cache locality.",
    ],
  },
  "stl-algorithms-lambdas": {
    core: "Algorithms work on iterator ranges, separating what to do from which container holds the data; lambdas supply the custom logic inline.",
    answer: "<algorithm> and <numeric> provide sort (O(n log n)), stable_sort, find, find_if, count_if, accumulate, transform, partition, binary_search and lower_bound, each on [begin, end) ranges. Iterator categories, from input to random access and contiguous, determine which algorithms apply; std::sort needs random access. A lambda's capture list decides what it uses: [=] by copy, [&] by reference, [x, &y] specific variables, and mutable allows changes to copies. C++20 ranges (std::ranges::sort(v), views::filter, views::transform) take whole containers and compose lazily.",
    keyPoints: [
      "remove and remove_if do not shrink a container: use the erase–remove idiom or std::erase_if (C++20).",
      "binary_search and lower_bound require sorted input.",
      "Capturing by reference in a lambda that outlives its scope leaves dangling references.",
      "accumulate's initial value sets the result type: pass 0LL for long long sums.",
      "A comparator must define a strict weak ordering: use <, never <=.",
    ],
  },
  "smart-pointers": {
    core: "Smart pointers encode ownership in the type: unique_ptr has one owner, shared_ptr counts its owners, and weak_ptr observes without owning.",
    answer: "std::unique_ptr has exactly one owner, costs nothing over a raw pointer, cannot be copied, and transfers ownership with std::move. std::shared_ptr keeps a reference count in a control block and deletes the object when the last owner goes; make_shared allocates the object and the control block together. Reference cycles between shared_ptrs never free; break them with std::weak_ptr and call lock() to use the target. Create pointers with make_unique and make_shared, and pass custom deleters for non-memory resources such as FILE*.",
    keyPoints: [
      "Default to unique_ptr; reach for shared_ptr only when ownership is genuinely shared.",
      "Pass a raw pointer or reference to functions that only use an object; pass the smart pointer only to transfer or share ownership.",
      "Never create two shared_ptrs from the same raw pointer.",
      "Reference-count updates are atomic, so copying a shared_ptr has a real cost.",
      "enable_shared_from_this gives an object a safe shared_ptr to itself.",
    ],
  },
  "move-semantics": {
    core: "Moving transfers an object's resources instead of copying them, leaving the source valid but unspecified; it is a cheap pointer steal instead of a deep copy.",
    answer: "lvalues have identity and a name; rvalues are temporaries. A T&& parameter binds to rvalues, so a move constructor can take the buffer and null out the source. std::move is only a cast to an rvalue: it moves nothing by itself. A forwarding reference (T&& in a deduced template) binds to anything, and std::forward<T> preserves whether the argument was an lvalue or an rvalue when passing it on. Return local objects by value; copy elision and implicit moves make that free.",
    keyPoints: [
      "Don't use a moved-from object except to assign to it or destroy it.",
      "return std::move(local); can block copy elision: just write return local;.",
      "Moving a const object silently copies it.",
      "Move operations should be noexcept, or containers will copy instead.",
      "emplace_back and perfect forwarding build elements in place without temporaries.",
    ],
  },
  "exceptions-files": {
    core: "throw unwinds the stack, destroying local objects, until a matching catch; RAII makes that unwinding release every resource.",
    answer: "Throw by value and catch by const reference, from the most derived type to the most general (std::exception). During stack unwinding, destructors of fully constructed locals run, which is why RAII matters. noexcept promises no exceptions escape, and if one does, std::terminate is called. The exception-safety guarantees are no-throw, strong (commit or roll back) and basic (no leaks, valid state). File streams (ifstream, ofstream, fstream) are RAII types that open in their constructor and close in their destructor; check them with if (!file).",
    keyPoints: [
      "Destructors must not throw; they are implicitly noexcept.",
      "Catching by value slices derived exception types.",
      "std::runtime_error and std::logic_error are the usual bases for custom exceptions.",
      "Read a file line by line with while (std::getline(in, line)).",
      "Use exceptions for exceptional failures, not for normal control flow.",
    ],
  },
  concurrency: {
    core: "Threads share memory, so any data one thread writes while another accesses it must be protected by a mutex or made atomic; otherwise the program has undefined behaviour.",
    answer: "std::thread runs a callable and must be joined or detached before it is destroyed; std::jthread (C++20) joins automatically and supports stop tokens. A data race is undefined behaviour. Guard shared data with std::mutex through std::lock_guard, std::unique_lock or std::scoped_lock, which locks several mutexes without deadlock. A condition_variable waits for a condition with a predicate. std::atomic<T> gives lock-free operations on simple types, and std::async and std::future return results from background tasks.",
    keyPoints: [
      "Never lock and unlock mutexes manually: use RAII lock guards.",
      "Always wait on a condition variable with a predicate, to handle spurious wakeups.",
      "Lock multiple mutexes with std::scoped_lock to avoid deadlock.",
      "A destroyed std::thread that is still joinable calls std::terminate.",
      "Detect races with -fsanitize=thread.",
    ],
  },
};
