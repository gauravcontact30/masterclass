import "server-only";
import type { TechConcept } from "@/lib/tech-docs";

/**
 * The detailed concept notes behind the "CS fundamentals" Technology docs slides (DSA and OOPs), shown only on
 * /dashboard. Kept out of lib/tech-docs.ts, which the landing page's client bundle imports: the landing preview
 * shows each subject's feature chips, the dashboard page passes these in as a prop.
 */
export const TECH_CONCEPTS: Record<string, TechConcept[]> = {
  dsa: [
    {
      id: "dsa-complexity", title: "Complexity analysis: Big-O, Θ and Ω", level: "beginner",
      summary: "How running time and memory grow with the input size n, so two solutions can be compared before either is written.",
      points: [
        "O gives an upper bound, Ω a lower bound and Θ a tight bound; interviews usually mean the worst-case O.",
        "Drop constants and lower-order terms: 3n² + 5n + 2 is O(n²).",
        "Common classes, fastest first: O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), O(n!).",
        "Space complexity counts the extra memory used, including the recursion stack.",
        "Amortised cost averages an occasional expensive step over many cheap ones (e.g. dynamic-array growth is O(1) amortised).",
      ],
      complexity: "Nested loops over n multiply (O(n²)); halving the input each step gives O(log n).",
    },
    {
      id: "dsa-arrays", title: "Arrays and dynamic arrays", level: "beginner",
      summary: "Contiguous memory with O(1) access by index: the base of most other structures.",
      points: [
        "Index access and update are O(1); inserting or deleting in the middle shifts elements, O(n).",
        "A dynamic array (Python list, Java ArrayList, C++ vector, JS Array) doubles its capacity when full, so append is O(1) amortised.",
        "Cache-friendly: elements sit next to each other, so scanning an array is much faster in practice than walking a linked list.",
        "2-D arrays (matrices) are stored row-major in most languages; traverse row by row for speed.",
      ],
      complexity: "Access O(1) · search O(n) · insert/delete at end O(1)* · in middle O(n)",
      code: { lang: "python", code: `nums = [4, 1, 7]
nums.append(9)        # O(1) amortised
nums.insert(0, 2)     # O(n): every element shifts right
print(nums[2])        # O(1) random access -> 1` },
    },
    {
      id: "dsa-strings", title: "Strings and pattern matching", level: "beginner",
      summary: "Arrays of characters with their own toolkit: immutability, builders, hashing and substring search.",
      points: [
        "Strings are immutable in Java, Python and JS: repeated += in a loop is O(n²); use a builder or join().",
        "Frequency counting with a map or a 26-slot array solves anagrams, palindromes and many substring problems.",
        "Naive substring search is O(n·m); KMP uses a prefix (failure) table for O(n + m).",
        "Rabin–Karp compares rolling hashes; Z-algorithm and suffix arrays handle harder pattern queries.",
      ],
      complexity: "KMP search O(n + m) · building a string with join O(n)",
    },
    {
      id: "dsa-linked-lists", title: "Linked lists: singly, doubly and circular", level: "beginner",
      summary: "Nodes linked by pointers: O(1) insertion and removal once you hold the node, but no random access.",
      points: [
        "Singly linked nodes point to the next node; doubly linked nodes also point back, enabling O(1) removal of a known node.",
        "A circular list's tail points back to the head, useful for round-robin scheduling.",
        "Classic techniques: a dummy head node, fast/slow pointers (find the middle, detect a cycle with Floyd's algorithm) and in-place reversal.",
        "An LRU cache combines a hash map with a doubly linked list for O(1) get and put.",
      ],
      complexity: "Access/search O(n) · insert/delete at a known node O(1)",
      code: { lang: "python", code: `def reverse(head):
    prev = None
    while head:
        head.next, prev, head = prev, head, head.next
    return prev   # new head, O(n) time, O(1) space` },
    },
    {
      id: "dsa-stacks", title: "Stacks", level: "beginner",
      summary: "Last in, first out: push and pop at one end in O(1).",
      points: [
        "Used for undo, back navigation, expression evaluation and the call stack itself.",
        "Balanced-bracket checking pushes openers and pops on each closer.",
        "A monotonic stack finds the next greater or smaller element for every item in O(n).",
        "Any recursion can be rewritten with an explicit stack (iterative DFS).",
      ],
      complexity: "push/pop/peek O(1)",
      code: { lang: "python", code: `def balanced(s):
    pairs, stack = {")": "(", "]": "[", "}": "{"}, []
    for ch in s:
        if ch in "([{": stack.append(ch)
        elif not stack or stack.pop() != pairs[ch]: return False
    return not stack` },
    },
    {
      id: "dsa-queues", title: "Queues, deques and circular buffers", level: "beginner",
      summary: "First in, first out: enqueue at the back, dequeue from the front, both in O(1).",
      points: [
        "Breadth-first search, task scheduling and buffering all rely on a queue.",
        "A deque allows O(1) push and pop at both ends; use collections.deque in Python, ArrayDeque in Java.",
        "A circular buffer reuses a fixed array with head and tail indices that wrap around.",
        "A monotonic deque gives the sliding-window maximum in O(n).",
      ],
      complexity: "enqueue/dequeue O(1) (list.pop(0) in Python is O(n): use deque)",
    },
    {
      id: "dsa-hashing", title: "Hash tables, hash sets and hashing", level: "beginner",
      summary: "Map keys to buckets with a hash function for O(1) average insert, lookup and delete.",
      points: [
        "Collisions are resolved by chaining (a list per bucket) or open addressing (probe for the next free slot).",
        "The load factor (items ÷ buckets) triggers a resize, usually around 0.75; resizing rehashes everything.",
        "Keys must be immutable and have consistent equals/hashCode (or __eq__/__hash__).",
        "Patterns: two-sum, frequency counting, de-duplication, grouping anagrams, caching (memoisation).",
        "Worst case degrades to O(n) when many keys collide.",
      ],
      complexity: "Average O(1) insert/lookup/delete · worst O(n)",
      code: { lang: "python", code: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return seen[target - n], i
        seen[n] = i` },
    },
    {
      id: "dsa-recursion", title: "Recursion and backtracking", level: "intermediate",
      summary: "Solve a problem by solving smaller copies of itself; backtracking explores choices and undoes them.",
      points: [
        "Every recursive function needs a base case and progress towards it, or the stack overflows.",
        "The recursion tree shows the cost: fib(n) without memoisation makes O(2ⁿ) calls.",
        "Backtracking template: choose, explore, un-choose. Used for permutations, subsets, N-Queens and Sudoku.",
        "Prune branches that can't lead to a valid answer to cut the search space.",
        "Recursion depth uses O(depth) stack space; Python's default limit is about 1,000 frames.",
      ],
      code: { lang: "python", code: `def subsets(nums):
    out, path = [], []
    def go(i):
        if i == len(nums): out.append(path[:]); return
        path.append(nums[i]); go(i + 1)   # choose
        path.pop(); go(i + 1)             # un-choose
    go(0)
    return out` },
    },
    {
      id: "dsa-sorting", title: "Sorting algorithms", level: "intermediate",
      summary: "From simple quadratic sorts to O(n log n) comparison sorts and linear-time non-comparison sorts.",
      points: [
        "Bubble, selection and insertion sort are O(n²); insertion sort is fast on small or nearly sorted data.",
        "Merge sort: divide, sort halves, merge. O(n log n) always, stable, O(n) extra space.",
        "Quick sort: partition around a pivot. O(n log n) average, O(n²) worst; in place; randomise the pivot.",
        "Heap sort: O(n log n), in place, not stable.",
        "Counting and radix sort run in O(n + k) for bounded integer keys.",
        "Stable sorts keep equal keys in their original order; Python's sorted() and Java's object sort (Timsort) are stable.",
      ],
      complexity: "Comparison sorting can't beat Ω(n log n) in the worst case.",
      code: { lang: "python", code: `def merge_sort(a):
    if len(a) <= 1: return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]: out.append(left[i]); i += 1
        else: out.append(right[j]); j += 1
    return out + left[i:] + right[j:]` },
    },
    {
      id: "dsa-binary-search", title: "Binary search and its variants", level: "intermediate",
      summary: "Halve a sorted search space each step to find a value or a boundary in O(log n).",
      points: [
        "Needs a monotonic condition: sorted data, or any yes/no predicate that flips once.",
        "Lower bound finds the first index ≥ target; upper bound the first index > target.",
        "Binary search on the answer: minimise the capacity, speed or time that still satisfies a check.",
        "Rotated sorted arrays and peak finding are standard variants.",
        "Use mid = lo + (hi - lo) // 2 to avoid overflow in fixed-width integer languages.",
      ],
      complexity: "O(log n) time · O(1) space (iterative)",
      code: { lang: "python", code: `def lower_bound(a, target):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < target: lo = mid + 1
        else: hi = mid
    return lo` },
    },
    {
      id: "dsa-two-pointers", title: "Two pointers and sliding window", level: "intermediate",
      summary: "Move two indices through an array or string to replace a nested loop with a single pass.",
      points: [
        "Opposite ends: pair sums in a sorted array, palindrome checks, container with most water.",
        "Fast and slow: remove duplicates in place, detect cycles.",
        "A fixed-size window slides one step at a time; a variable window grows right and shrinks left while a condition holds.",
        "Typical problems: longest substring without repeats, minimum window substring, maximum sum of k elements.",
      ],
      complexity: "Usually O(n) time, O(1) or O(k) space",
    },
    {
      id: "dsa-prefix-sums", title: "Prefix sums and difference arrays", level: "intermediate",
      summary: "Precompute running totals so any range sum is answered in O(1).",
      points: [
        "prefix[i] = a[0] + … + a[i-1]; then sum(l..r) = prefix[r+1] − prefix[l].",
        "Combined with a hash map, prefix sums count subarrays that sum to k in O(n).",
        "A difference array applies many range additions in O(1) each, then rebuilds with one prefix pass.",
        "2-D prefix sums answer rectangle-sum queries on a grid.",
      ],
      complexity: "Build O(n) · query O(1)",
    },
    {
      id: "dsa-trees", title: "Binary trees and traversals", level: "intermediate",
      summary: "Hierarchical nodes with up to two children; most tree problems are a traversal plus a little bookkeeping.",
      points: [
        "Depth-first traversals: pre-order (node, left, right), in-order (left, node, right) and post-order (left, right, node).",
        "Level-order traversal is a BFS with a queue.",
        "Height, diameter, lowest common ancestor and path sums are solved with post-order recursion.",
        "Full, complete, perfect and balanced trees are defined by how levels fill.",
        "Serialising a tree to a string and back is a common design question.",
      ],
      complexity: "Traversal O(n) time · O(h) space, h = height",
      code: { lang: "python", code: `def inorder(node, out):
    if node:
        inorder(node.left, out)
        out.append(node.val)
        inorder(node.right, out)
    return out` },
    },
    {
      id: "dsa-bst", title: "Binary search trees and balanced trees", level: "intermediate",
      summary: "Left < node < right, so search, insert and delete follow one path from the root.",
      points: [
        "Operations cost O(h): O(log n) when balanced, O(n) when the tree degenerates into a list.",
        "AVL trees keep heights within one by rotating; red-black trees use colour rules and fewer rotations.",
        "B-trees and B+ trees store many keys per node and back database and file-system indexes.",
        "An in-order traversal of a BST yields the keys in sorted order.",
        "Java's TreeMap and C++'s std::map are red-black trees.",
      ],
      complexity: "Balanced: search/insert/delete O(log n)",
    },
    {
      id: "dsa-heaps", title: "Heaps and priority queues", level: "intermediate",
      summary: "A complete binary tree stored in an array, keeping the smallest (or largest) item at the root.",
      points: [
        "Children of index i sit at 2i+1 and 2i+2; the parent at (i−1)//2.",
        "Push and pop are O(log n); peek is O(1); heapify builds a heap from an array in O(n).",
        "Top-k elements, merging k sorted lists, a running median (two heaps) and Dijkstra all use heaps.",
        "Python's heapq is a min-heap; push negated values for a max-heap.",
      ],
      complexity: "push/pop O(log n) · peek O(1) · heapify O(n)",
      code: { lang: "python", code: `import heapq
def top_k(nums, k):
    heap = []
    for n in nums:
        heapq.heappush(heap, n)
        if len(heap) > k: heapq.heappop(heap)
    return sorted(heap, reverse=True)` },
    },
    {
      id: "dsa-tries", title: "Tries (prefix trees)", level: "intermediate",
      summary: "A tree of characters where each path from the root spells a prefix: fast autocomplete and word search.",
      points: [
        "Insert and search cost O(L) for a word of length L, independent of how many words are stored.",
        "Each node holds a map of children and an end-of-word flag.",
        "Used for autocomplete, spell checking, IP routing (binary tries) and word search on a grid.",
        "Compressed tries (radix trees) merge single-child chains to save memory.",
      ],
      complexity: "insert/search/startsWith O(L)",
    },
    {
      id: "dsa-graphs", title: "Graphs, BFS and DFS", level: "intermediate",
      summary: "Vertices joined by edges, directed or undirected, weighted or not; most graph problems start with a traversal.",
      points: [
        "Store as an adjacency list (O(V + E) space, best for sparse graphs) or an adjacency matrix (O(V²), O(1) edge checks).",
        "BFS explores level by level with a queue and gives shortest paths in unweighted graphs.",
        "DFS goes deep with recursion or a stack: connected components, cycle detection, path finding.",
        "Grids are implicit graphs: each cell links to its 4 or 8 neighbours.",
        "Track visited nodes to avoid infinite loops.",
      ],
      complexity: "BFS/DFS O(V + E)",
      code: { lang: "python", code: `from collections import deque
def bfs(graph, start):
    dist, queue = {start: 0}, deque([start])
    while queue:
        node = queue.popleft()
        for nxt in graph[node]:
            if nxt not in dist:
                dist[nxt] = dist[node] + 1
                queue.append(nxt)
    return dist` },
    },
    {
      id: "dsa-shortest-paths", title: "Shortest paths: Dijkstra, Bellman–Ford, Floyd–Warshall", level: "advanced",
      summary: "Find the cheapest route in a weighted graph; the right algorithm depends on edge weights and how many sources you need.",
      points: [
        "Dijkstra (min-heap) handles non-negative weights in O((V + E) log V).",
        "Bellman–Ford relaxes every edge V−1 times, O(V·E), allows negative weights and detects negative cycles.",
        "Floyd–Warshall gives all-pairs shortest paths in O(V³) by dynamic programming.",
        "0-1 BFS uses a deque when weights are only 0 or 1; A* adds a heuristic for faster single-target search.",
      ],
      complexity: "Dijkstra O((V + E) log V) · Bellman–Ford O(V·E) · Floyd–Warshall O(V³)",
    },
    {
      id: "dsa-mst-dsu", title: "Union–Find, minimum spanning trees and topological sort", level: "advanced",
      summary: "Tools for connectivity and ordering: disjoint sets, cheapest connecting edges and dependency order.",
      points: [
        "Union–Find (disjoint set union) with path compression and union by rank runs in near-O(1) per operation.",
        "Kruskal's MST sorts edges and adds each one that joins two different sets; Prim's grows a tree with a min-heap.",
        "Topological sort orders a DAG so every edge points forward: Kahn's algorithm (in-degree queue) or DFS post-order.",
        "Course schedules, build systems and task pipelines are topological-sort problems.",
      ],
      complexity: "Kruskal O(E log E) · Prim O(E log V) · topological sort O(V + E)",
    },
    {
      id: "dsa-greedy", title: "Greedy algorithms", level: "intermediate",
      summary: "Take the locally best choice at every step, for problems where that provably leads to the global optimum.",
      points: [
        "Works when the problem has the greedy-choice property and optimal substructure.",
        "Classics: activity selection / interval scheduling, Huffman coding, fractional knapsack, jump game.",
        "Proving it: an exchange argument shows any optimal answer can be changed into the greedy one.",
        "When greedy fails (0/1 knapsack, coin systems like {1, 3, 4}), use dynamic programming.",
      ],
    },
    {
      id: "dsa-divide-conquer", title: "Divide and conquer", level: "intermediate",
      summary: "Split the problem into independent parts, solve each recursively and combine the results.",
      points: [
        "Merge sort, quick sort, binary search and fast exponentiation follow this pattern.",
        "The Master Theorem solves recurrences like T(n) = aT(n/b) + f(n); merge sort's T(n) = 2T(n/2) + n is O(n log n).",
        "Other examples: closest pair of points, Karatsuba multiplication, Strassen's matrix multiplication.",
        "If the subproblems overlap, switch to dynamic programming.",
      ],
    },
    {
      id: "dsa-dp", title: "Dynamic programming", level: "advanced",
      summary: "Solve overlapping subproblems once and reuse the answers: recursion plus memory.",
      points: [
        "Needs optimal substructure and overlapping subproblems.",
        "Top-down memoisation caches a recursive function; bottom-up tabulation fills a table in dependency order.",
        "Define the state, the transition, the base cases and the order; then shrink space by keeping only the rows you need.",
        "Families: 1-D (climbing stairs, house robber), 2-D grids, knapsack, LIS, LCS and edit distance, interval DP, bitmask DP, DP on trees.",
      ],
      complexity: "Time = number of states × work per state",
      code: { lang: "python", code: `def lcs(a, b):
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            dp[i][j] = dp[i-1][j-1] + 1 if a[i-1] == b[j-1] else max(dp[i-1][j], dp[i][j-1])
    return dp[-1][-1]   # O(n·m)` },
    },
    {
      id: "dsa-bits", title: "Bit manipulation", level: "intermediate",
      summary: "Work on the binary representation directly for compact sets and constant-time tricks.",
      points: [
        "AND, OR, XOR, NOT and shifts; x & (x − 1) clears the lowest set bit; x & −x isolates it.",
        "XOR of all numbers finds the single unpaired element; a ^ a = 0.",
        "Bitmasks represent subsets: iterate all 2ⁿ subsets, or use them as DP states.",
        "Check if n is a power of two with n > 0 and n & (n − 1) == 0.",
      ],
    },
    {
      id: "dsa-range-trees", title: "Segment trees and Fenwick trees", level: "advanced",
      summary: "Answer range queries (sum, min, max) while the array keeps changing.",
      points: [
        "A segment tree stores each range's aggregate: O(log n) query and point update, O(n) build.",
        "Lazy propagation adds O(log n) range updates.",
        "A Fenwick (binary indexed) tree is smaller and simpler for prefix sums: O(log n) update and query.",
        "Use them when prefix sums alone are not enough because values are updated between queries.",
      ],
      complexity: "Query/update O(log n) · build O(n)",
    },
  ],
  oops: [
    {
      id: "oop-classes-objects", title: "Classes and objects", level: "beginner",
      summary: "A class is a blueprint that bundles state (fields) and behaviour (methods); an object is one instance built from it.",
      points: [
        "Each object has its own identity, state and behaviour.",
        "Fields hold the state; methods read and change it; `this` (or `self`) refers to the current object.",
        "Many objects can come from one class, each with different field values.",
        "Model real concepts as nouns (classes) and their actions as verbs (methods).",
      ],
      code: { lang: "java", code: `class Account {
    private double balance;           // state
    void deposit(double amount) {     // behaviour
        balance += amount;
    }
    double balance() { return balance; }
}
Account a = new Account();            // an object
a.deposit(500);` },
    },
    {
      id: "oop-constructors", title: "Constructors, destructors and the object lifecycle", level: "beginner",
      summary: "Constructors put a new object into a valid state; destructors or finalisers release what it held.",
      points: [
        "Default, parameterised and copy constructors; constructors can be overloaded and can chain with this(...) or super(...).",
        "Initialise every invariant in the constructor so an object is never half-built.",
        "C++ destructors run deterministically (RAII); Java, C# and Python reclaim memory with garbage collection.",
        "Release files, sockets and locks explicitly: try-with-resources, using, or a with block.",
        "Static factory methods and builders are alternatives when constructors get too many parameters.",
      ],
      code: { lang: "python", code: `class Connection:
    def __init__(self, url):       # constructor
        self.url = url
        self.open = True
    def __enter__(self): return self
    def __exit__(self, *exc):      # deterministic cleanup
        self.open = False

with Connection("db://local") as c:
    ...` },
    },
    {
      id: "oop-encapsulation", title: "Encapsulation and access modifiers", level: "beginner",
      summary: "Hide an object's internal state and expose only the operations that keep it valid.",
      points: [
        "Make fields private and change them through methods that enforce the rules (no negative balances).",
        "Java: public, protected, package-private (default) and private. C#: adds internal. C++: public, protected, private. Python: a leading _ by convention, __ for name mangling.",
        "Getters and setters are not encapsulation by themselves; expose behaviour, not raw fields.",
        "Encapsulation lets you change the implementation without breaking callers.",
      ],
      code: { lang: "java", code: `public class Temperature {
    private double celsius;
    public void set(double c) {
        if (c < -273.15) throw new IllegalArgumentException("below absolute zero");
        celsius = c;
    }
    public double fahrenheit() { return celsius * 9 / 5 + 32; }
}` },
    },
    {
      id: "oop-abstraction", title: "Abstraction and abstract classes", level: "beginner",
      summary: "Show what an object does and hide how it does it; abstract classes capture a shared shape with some parts left to subclasses.",
      points: [
        "An abstract class can't be instantiated; it can hold fields, constructors, concrete methods and abstract methods.",
        "Subclasses must implement every abstract method (or be abstract themselves).",
        "Abstraction is about the design (a simple interface over complexity); encapsulation is about protecting the data behind it.",
        "The Template Method pattern puts the algorithm's skeleton in the abstract class and lets subclasses fill in steps.",
      ],
      code: { lang: "java", code: `abstract class Shape {
    abstract double area();               // what, not how
    String describe() { return getClass().getSimpleName() + " of area " + area(); }
}
class Circle extends Shape {
    private final double r;
    Circle(double r) { this.r = r; }
    double area() { return Math.PI * r * r; }
}` },
    },
    {
      id: "oop-interfaces", title: "Interfaces vs abstract classes", level: "intermediate",
      summary: "An interface is a pure contract of capabilities; a class can implement many interfaces but extend only one class in Java and C#.",
      points: [
        "Interfaces describe can-do relationships (Comparable, Runnable); abstract classes describe is-a with shared code.",
        "Java 8+ interfaces can have default and static methods; Java 9+ private methods.",
        "Prefer interfaces for APIs: callers depend on the contract, not on a class hierarchy.",
        "Python uses abc.ABC or typing.Protocol (structural typing); TypeScript interfaces are compile-time only.",
        "Choose an abstract class when subclasses share state or a constructor.",
      ],
      code: { lang: "typescript", code: `interface Notifier { send(to: string, msg: string): Promise<void>; }

class EmailNotifier implements Notifier {
  async send(to: string, msg: string) { /* SMTP */ }
}
class SmsNotifier implements Notifier {
  async send(to: string, msg: string) { /* SMS API */ }
}` },
    },
    {
      id: "oop-inheritance", title: "Inheritance and its types", level: "beginner",
      summary: "A subclass reuses and extends a superclass: an is-a relationship.",
      points: [
        "Types: single, multilevel (A → B → C), hierarchical (one parent, many children), multiple and hybrid.",
        "Java and C# allow single class inheritance plus many interfaces; C++ and Python allow multiple inheritance.",
        "super calls the parent's constructor or overridden method.",
        "Subclasses inherit public and protected members; private members exist but aren't directly accessible.",
        "Deep hierarchies are fragile (the fragile base class problem); keep them shallow.",
      ],
      code: { lang: "python", code: `class Animal:
    def __init__(self, name): self.name = name
    def speak(self): return "..."

class Dog(Animal):                 # Dog is-an Animal
    def speak(self): return f"{self.name}: Woof"

print(Dog("Rex").speak())` },
    },
    {
      id: "oop-multiple-inheritance", title: "Multiple inheritance, the diamond problem and mixins", level: "advanced",
      summary: "When a class inherits the same member through two paths, the language needs a rule to pick one.",
      points: [
        "The diamond: B and C both extend A, D extends B and C. Which A.method does D get?",
        "C++ solves it with virtual inheritance; Python with the C3 method resolution order (inspect it with Class.__mro__).",
        "Java avoids class diamonds; a clash between two default interface methods must be overridden explicitly.",
        "Mixins and traits add small, focused behaviour (LoggingMixin, Serializable) without a deep is-a chain.",
      ],
      code: { lang: "python", code: `class A:
    def hello(self): return "A"
class B(A):
    def hello(self): return "B"
class C(A):
    def hello(self): return "C"
class D(B, C): pass

print(D().hello())                       # "B"
print([k.__name__ for k in D.__mro__])   # D, B, C, A, object` },
    },
    {
      id: "oop-polymorphism", title: "Polymorphism: one interface, many forms", level: "beginner",
      summary: "Code written against a general type works with any of its specific types.",
      points: [
        "Compile-time (static) polymorphism: method overloading and operator overloading, resolved by the compiler.",
        "Run-time (dynamic) polymorphism: method overriding, resolved by the object's actual type.",
        "Parametric polymorphism: generics (List<T>).",
        "Ad hoc and subtype polymorphism are the formal names for overloading and overriding.",
        "Polymorphism removes long if/else or switch chains on type.",
      ],
      code: { lang: "java", code: `List<Shape> shapes = List.of(new Circle(1), new Square(2));
for (Shape s : shapes) {
    System.out.println(s.area());   // each object runs its own area()
}` },
    },
    {
      id: "oop-overloading", title: "Method overloading and operator overloading", level: "intermediate",
      summary: "Several methods share a name but differ in parameters; the compiler picks one from the call's arguments.",
      points: [
        "Overloads must differ in parameter count, types or order; the return type alone is not enough.",
        "Java and C# support method overloading; Python and JS don't (use default or variadic arguments instead).",
        "Operator overloading gives user types natural syntax: C++ operator+, C# operator +, Python __add__ and __eq__.",
        "Overload only when every version does the same conceptual thing.",
      ],
      code: { lang: "python", code: `class Vector:
    def __init__(self, x, y): self.x, self.y = x, y
    def __add__(self, other): return Vector(self.x + other.x, self.y + other.y)
    def __repr__(self): return f"Vector({self.x}, {self.y})"

print(Vector(1, 2) + Vector(3, 4))   # Vector(4, 6)` },
    },
    {
      id: "oop-overriding", title: "Method overriding and dynamic dispatch", level: "intermediate",
      summary: "A subclass replaces an inherited method; the call is bound at run time to the object's real class.",
      points: [
        "Same name, parameters and a compatible (covariant) return type; access can't be narrowed.",
        "Mark overrides with @Override (Java), override (C#, C++11, TypeScript 4.3+) so the compiler catches typos.",
        "C++ needs virtual for dynamic dispatch; Java and Python methods are virtual by default.",
        "Implemented with a virtual method table (vtable) per class.",
        "Upcasting (Dog → Animal) is implicit and safe; downcasting needs a check (instanceof, pattern matching).",
        "Static, private and final methods are not overridden.",
      ],
    },
    {
      id: "oop-static", title: "Static members, class variables and singletons", level: "intermediate",
      summary: "Static members belong to the class itself, shared by every instance, rather than to one object.",
      points: [
        "Use static for constants, counters and pure utility functions (Math.max).",
        "Static methods can't use this and can't be overridden polymorphically.",
        "Python has @staticmethod (no self) and @classmethod (receives the class: good for alternative constructors).",
        "A singleton guarantees one instance; it's global state in disguise, so prefer passing the dependency in.",
      ],
    },
    {
      id: "oop-relationships", title: "Association, aggregation and composition", level: "intermediate",
      summary: "The has-a relationships between objects, ordered by how tightly their lifetimes are tied.",
      points: [
        "Association: objects know about each other (a Teacher teaches Students); both live independently.",
        "Aggregation: a whole holds parts that can exist without it (a Team has Players).",
        "Composition: the parts live and die with the whole (a House has Rooms; an Order has OrderLines).",
        "Dependency (uses-a): a method uses another class temporarily, e.g. as a parameter.",
        "In UML: a plain line for association, a hollow diamond for aggregation, a filled diamond for composition.",
      ],
    },
    {
      id: "oop-composition", title: "Composition over inheritance", level: "intermediate",
      summary: "Build behaviour by combining small objects instead of extending a class hierarchy.",
      points: [
        "Inheritance fixes the relationship at compile time and exposes the parent's internals to the child.",
        "Composition lets you swap a part at run time and test each piece alone.",
        "Use inheritance only for a true is-a that passes the substitution test (LSP).",
        "Strategy, Decorator and dependency injection are all composition.",
      ],
      code: { lang: "typescript", code: `interface Engine { start(): void }
class ElectricEngine implements Engine { start() { console.log("hum") } }
class PetrolEngine implements Engine { start() { console.log("vroom") } }

class Car {
  constructor(private engine: Engine) {}   // has-an engine
  drive() { this.engine.start() }
}
new Car(new ElectricEngine()).drive()` },
    },
    {
      id: "oop-coupling-cohesion", title: "Coupling, cohesion and the Law of Demeter", level: "intermediate",
      summary: "Good designs have high cohesion inside a class and low coupling between classes.",
      points: [
        "Cohesion: everything in a class serves one purpose. Coupling: how much one class knows about another.",
        "Law of Demeter: talk only to your immediate collaborators; a.getB().getC().doIt() is a smell.",
        "Tell, don't ask: tell an object to do the work instead of pulling its data out and deciding for it.",
        "Depend on interfaces, not concrete classes, to loosen coupling.",
      ],
    },
    {
      id: "oop-solid", title: "SOLID principles", level: "advanced",
      summary: "Five design principles that keep object-oriented code easy to change.",
      points: [
        "S: Single Responsibility. A class has one reason to change.",
        "O: Open/Closed. Open for extension, closed for modification: add a new class instead of editing a switch.",
        "L: Liskov Substitution. A subtype must work wherever its base type is expected (a Square that breaks Rectangle's setWidth violates it).",
        "I: Interface Segregation. Many small, client-specific interfaces beat one fat interface.",
        "D: Dependency Inversion. High-level code depends on abstractions; details plug in from outside.",
      ],
      code: { lang: "typescript", code: `// Open/Closed + Dependency Inversion
interface Discount { apply(total: number): number }
class Festive implements Discount { apply(t: number) { return t * 0.9 } }
class Checkout {
  constructor(private discount: Discount) {}
  total(amount: number) { return this.discount.apply(amount) }
}` },
    },
    {
      id: "oop-di", title: "Dependency injection and inversion of control", level: "advanced",
      summary: "Give an object its collaborators from outside instead of letting it create them.",
      points: [
        "Constructor injection (preferred), setter injection and interface injection.",
        "Makes classes testable: pass a fake repository in a unit test.",
        "Inversion of control: a framework (Spring, ASP.NET Core, Angular, NestJS) creates and wires the objects.",
        "Avoid the service-locator pattern; it hides dependencies.",
      ],
    },
    {
      id: "oop-generics", title: "Generics and parametric polymorphism", level: "intermediate",
      summary: "Write a class or method once and use it type-safely with many types.",
      points: [
        "List<String> catches type errors at compile time and removes casts.",
        "Bounded type parameters: <T extends Comparable<T>>; wildcards in Java: ? extends T (read) and ? super T (write).",
        "Java erases generic types at run time; C# keeps them (reified); C++ templates generate code per type.",
        "Variance: covariance and contravariance decide when Box<Cat> can stand in for Box<Animal>.",
      ],
      code: { lang: "typescript", code: `class Stack<T> {
  private items: T[] = []
  push(item: T) { this.items.push(item) }
  pop(): T | undefined { return this.items.pop() }
}
const s = new Stack<number>()
s.push(1)        // s.push("x") is a compile error` },
    },
    {
      id: "oop-equality", title: "Object identity, equality, hashing and copying", level: "intermediate",
      summary: "Two references can point to the same object (identity) or to different objects with equal values (equality).",
      points: [
        "Java: == compares references, equals() compares values; Python: is vs ==.",
        "Override equals and hashCode together (or __eq__ and __hash__), or hash maps and sets misbehave.",
        "A shallow copy shares nested objects; a deep copy duplicates them.",
        "Value objects (Money, Date) compare by value and are best made immutable.",
      ],
    },
    {
      id: "oop-immutability", title: "Immutability, final and sealed classes", level: "intermediate",
      summary: "Objects whose state can't change after construction are simpler, thread-safe and safe to share.",
      points: [
        "Make fields final/readonly, set them in the constructor and return new objects instead of mutating.",
        "Java records, Kotlin data classes, C# records and Python frozen dataclasses give immutable value types cheaply.",
        "final (Java), sealed (C#) and final (C++) stop a class being extended; Java 17 sealed classes allow only listed subclasses.",
        "Sealed hierarchies let pattern-matching switches check that every case is handled.",
      ],
      code: { lang: "java", code: `public record Money(long paise, String currency) {
    public Money add(Money other) {
        return new Money(paise + other.paise, currency);   // new object, no mutation
    }
}` },
    },
    {
      id: "oop-exceptions", title: "Exceptions and error handling in OOP", level: "intermediate",
      summary: "Errors are objects too: a class hierarchy of exceptions lets callers catch exactly what they can handle.",
      points: [
        "Define domain exceptions (InsufficientFundsException) that extend a common base.",
        "Java separates checked exceptions (must be declared or caught) from unchecked ones.",
        "Catch specific types first; never swallow an exception silently.",
        "Keep objects valid when an exception is thrown (the strong exception guarantee).",
      ],
    },
    {
      id: "oop-patterns", title: "Design patterns: creational, structural, behavioural", level: "advanced",
      summary: "Named, reusable solutions to recurring object-oriented design problems, from the Gang of Four catalogue.",
      points: [
        "Creational: Factory Method, Abstract Factory, Builder, Prototype, Singleton.",
        "Structural: Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy.",
        "Behavioural: Strategy, Observer, Command, State, Template Method, Iterator, Chain of Responsibility, Mediator, Memento, Visitor.",
        "Learn the problem each pattern solves, not just its UML; don't force patterns into simple code.",
      ],
      code: { lang: "typescript", code: `// Observer
type Listener<T> = (value: T) => void
class Subject<T> {
  private listeners: Listener<T>[] = []
  subscribe(fn: Listener<T>) { this.listeners.push(fn) }
  emit(value: T) { this.listeners.forEach(fn => fn(value)) }
}` },
    },
    {
      id: "oop-prototypes", title: "Prototype-based OOP in JavaScript", level: "intermediate",
      summary: "JavaScript objects inherit directly from other objects through the prototype chain; class syntax sits on top of it.",
      points: [
        "Property lookup walks obj → obj.__proto__ → … → Object.prototype → null.",
        "class, extends, super and constructor are syntax over prototypes.",
        "#private fields and static blocks give real privacy and class-level setup.",
        "Object.create(proto) builds an object with a chosen prototype, no class needed.",
      ],
      code: { lang: "javascript", code: `class Person {
  #age                                 // truly private
  constructor(name, age) { this.name = name; this.#age = age }
  greet() { return \`Hi, I'm \${this.name}\` }
}
const p = new Person("Asha", 30)
Object.getPrototypeOf(p) === Person.prototype   // true` },
    },
    {
      id: "oop-uml", title: "UML class diagrams and object-oriented design", level: "advanced",
      summary: "Sketch classes, their members and relationships before coding, and practise turning requirements into objects.",
      points: [
        "A class box lists the name, attributes and methods; + public, − private, # protected.",
        "Arrows: a hollow triangle for inheritance, a dashed hollow triangle for implementing an interface, diamonds for aggregation and composition.",
        "Design approach: find the nouns (classes) and verbs (methods), assign responsibilities, then check SOLID.",
        "Classic low-level design questions: parking lot, library system, elevator, chess, splitwise, vending machine.",
      ],
    },
  ],
};
