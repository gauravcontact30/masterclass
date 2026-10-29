import type { TopicEssentials } from "../types";

/** DSA topics distilled: the idea each rests on, the answer to give when asked, and what to remember. */
export const ESSENTIALS: Record<string, TopicEssentials> = {
  complexity: {
    core: "Complexity describes how running time or memory grows with input size n, ignoring constants and lower-order terms.",
    answer: "Big-O is an upper bound, Ω a lower bound, and Θ a tight bound (both at once). Count the dominant operations as n grows: one loop over n is O(n), two nested loops are O(n²), and halving the input each step is O(log n). Amortised analysis averages occasional expensive steps over many cheap ones, which is why dynamic-array append is O(1) amortised. The master theorem solves divide-and-conquer recurrences T(n) = aT(n/b) + f(n); for merge sort, T(n) = 2T(n/2) + n gives Θ(n log n).",
    keyPoints: [
      "Growth order: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!).",
      "Roughly 10⁸ simple operations run per second: n = 10⁵ needs O(n log n) or better.",
      "Recursion depth counts toward space complexity: the call stack uses memory.",
      "Sequential steps add (O(n) + O(n) = O(n)); nested steps multiply.",
      "Worst, average and best case are separate questions: quicksort is O(n log n) on average and O(n²) in the worst case.",
    ],
  },
  "arrays-two-pointers": {
    core: "Arrays give O(1) access by index; prefix sums and two pointers turn many O(n²) scans into O(n).",
    answer: "A prefix sum array pre[i] holds the sum of the first i elements, so the sum of a range [l, r] is pre[r + 1] − pre[l] in O(1). Two pointers move inward from both ends of a sorted array (pair sum, container with most water), or one slow and one fast pointer moves through the array (removing duplicates in place). Kadane's algorithm finds the maximum subarray sum in O(n) by keeping the best sum ending at each index: cur = max(x, cur + x).",
    keyPoints: [
      "Inserting or deleting in the middle of an array is O(n), because elements must shift.",
      "Two pointers on a sorted array: if the sum is too small move left forward; if too large move right back.",
      "A difference array applies range updates in O(1) each and rebuilds the values with one prefix pass.",
      "Initialise Kadane's best with the first element, not 0, so all-negative arrays work.",
      "Reverse an array in place by swapping from both ends toward the middle.",
    ],
  },
  "sliding-window-hashing": {
    core: "A sliding window keeps a running state of a contiguous range and updates it as the window moves, instead of recomputing it for every range.",
    answer: "A fixed window of size k adds the element entering and removes the one leaving, so each step costs O(1). A variable window expands its right edge and shrinks its left edge while a condition is violated, for example the longest substring without repeating characters. Each element enters and leaves once, so the whole scan is O(n). Hash maps hold frequency counts or last-seen indexes in O(1) on average, which powers anagram search and duplicate detection. A hash table maps a key's hash to a bucket and handles collisions by chaining or open addressing.",
    keyPoints: [
      "Windows work for contiguous subarrays and substrings, not for subsequences.",
      "A variable window needs a monotonic condition: growing the window only makes the condition harder to satisfy.",
      "For a 26-letter alphabet, an int[26] array is faster than a hash map.",
      "Counting subarrays with sum k uses prefix sums plus a hash map of counts, and handles negative numbers.",
      "Hash operations are O(1) on average but O(n) in the worst case, under adversarial collisions.",
    ],
  },
  "recursion-backtracking": {
    core: "Recursion solves a problem through smaller instances of itself; backtracking explores choices recursively and undoes each one before trying the next.",
    answer: "Every recursive function needs a base case that stops it and a recursive case that moves toward that base. Each call adds a stack frame, so the depth determines the space used. Backtracking builds a candidate step by step (choose, explore, unchoose) to generate subsets (2ⁿ), permutations (n!) or placements such as N-Queens. Pruning skips branches that cannot lead to a valid answer, which is what makes exhaustive search practical.",
    keyPoints: [
      "A missing or unreachable base case causes a stack overflow.",
      "Undo state changes after the recursive call returns, or later branches see stale state.",
      "Sort the input and skip equal neighbours to avoid duplicate subsets or permutations.",
      "Overlapping subproblems in a recursion suggest memoisation, which turns it into dynamic programming.",
      "Subsets cost O(n·2ⁿ) and permutations O(n·n!), including the cost of copying each result.",
    ],
  },
  "linked-lists": {
    core: "A linked list is a chain of nodes joined by pointers: O(1) insertion and deletion at a known node, but O(n) access by position.",
    answer: "A singly linked node stores a value and next; a doubly linked node adds prev, which allows O(1) removal of a given node. A dummy (sentinel) head removes special cases at the front of the list. Reverse a list iteratively with three pointers (prev, cur, next). Fast and slow pointers find the middle and detect cycles with Floyd's algorithm: if they meet, there is a cycle, and resetting one pointer to the head and moving both by one step finds where the cycle starts. Merge two sorted lists by repeatedly linking the smaller head.",
    keyPoints: [
      "Draw the pointers before writing code, and save next before you overwrite it.",
      "Check for null before following .next, especially when the fast pointer moves two steps.",
      "To remove the n-th node from the end, move one pointer n steps ahead, then move both together.",
      "Linked lists lose to arrays on cache locality, so they are rarely faster in practice.",
      "An LRU cache combines a hash map with a doubly linked list for O(1) get and put.",
    ],
  },
  "stacks-queues": {
    core: "A stack is last-in first-out and a queue first-in first-out; monotonic stacks and deques answer \"next greater\" and \"window maximum\" questions in O(n).",
    answer: "Push and pop on a stack are O(1); it matches brackets, evaluates expressions and replaces recursion. A queue serves BFS and scheduling, and a deque allows O(1) operations at both ends. A monotonic stack keeps elements in increasing or decreasing order: each element pops the smaller ones before it, so every element's next greater element is found in one O(n) pass. A monotonic deque of indexes holds the current window's candidates and gives the sliding window maximum in O(n).",
    keyPoints: [
      "Each element is pushed and popped at most once, which is why monotonic stacks are O(n).",
      "Store indexes, not values, when you need distances or to expire window entries.",
      "Brackets are balanced when every closer matches the top of the stack and the stack ends empty.",
      "Two stacks make a queue with O(1) amortised operations.",
      "In Java use ArrayDeque, and in C++ std::stack or std::deque.",
    ],
  },
  "binary-search": {
    core: "Binary search halves a sorted or monotonic search space at every step, finding the answer in O(log n).",
    answer: "Keep an invariant on [lo, hi], compare the middle element, and discard the half that cannot contain the answer. lower_bound finds the first index with a[i] ≥ x and upper_bound the first with a[i] > x, and their difference counts the occurrences of x. In a rotated sorted array, one half is always sorted; check whether the target lies in it. Searching on the answer applies when a feasibility check is monotonic: binary-search the smallest answer that works, such as the minimum speed or capacity.",
    keyPoints: [
      "Compute mid = lo + (hi − lo) / 2 to avoid integer overflow.",
      "Choose one convention, closed [lo, hi] or half-open [lo, hi), and keep its loop condition consistent.",
      "Infinite loops come from an update that does not shrink the range.",
      "On the answer: low = the smallest possible answer, high = the largest, and check(mid) is monotonic.",
      "Binary search needs a sorted array or a monotonic predicate; on unsorted data it is wrong.",
    ],
  },
  sorting: {
    core: "Comparison sorts cannot beat O(n log n); merge sort guarantees it, quicksort is fastest on average, and counting-based sorts beat it on small integer keys.",
    answer: "Bubble, selection and insertion sort are O(n²); insertion sort is O(n) on nearly sorted data and is the base case inside hybrid sorts. Merge sort is O(n log n) in every case, stable, and uses O(n) extra space. Quicksort partitions around a pivot: O(n log n) on average, O(n²) in the worst case, in place. Heap sort is O(n log n), in place, and not stable. Counting and radix sort run in O(n + k) on integer keys. A sort is stable if equal keys keep their original order.",
    keyPoints: [
      "Java sorts objects with TimSort (stable) and primitives with dual-pivot quicksort.",
      "C++ std::sort is introsort (not stable); use std::stable_sort when order matters.",
      "A random or median-of-three pivot avoids quicksort's sorted-input worst case.",
      "Merge sort is the choice for linked lists and external sorting.",
      "Count inversions by adding counts during the merge step of merge sort.",
    ],
  },
  "binary-trees": {
    core: "A binary tree is a recursive structure: most tree problems are \"solve for the left subtree, solve for the right, then combine at the node\".",
    answer: "Depth-first traversals visit nodes in preorder (node, left, right), inorder (left, node, right) or postorder (left, right, node), recursively or with an explicit stack. Level-order traversal is BFS with a queue, processed one level at a time. Height is 1 + max(height(left), height(right)). The diameter is the longest path through any node, left height plus right height, tracked during the same pass. The lowest common ancestor is the node where the two targets split into different subtrees.",
    keyPoints: [
      "Every traversal is O(n) time and O(h) space, where h is the height: O(log n) if balanced, O(n) if skewed.",
      "Preorder plus inorder uniquely rebuilds a tree; preorder plus postorder does not, in general.",
      "Post-order recursion that returns a value up the tree solves height, diameter and balance checks.",
      "Morris traversal does inorder in O(1) extra space by threading the tree temporarily.",
      "Read the problem for \"node\" versus \"edge\" counts: height and diameter differ by one between them.",
    ],
  },
  bst: {
    core: "In a BST, every key in a node's left subtree is smaller and every key in its right subtree is larger, so a search follows a single path.",
    answer: "Search, insert and delete take O(h): O(log n) when the tree is balanced, O(n) when it degenerates into a list. An inorder traversal visits keys in sorted order, which makes k-th smallest, floor and ceiling queries easy. Deleting a node with two children replaces it with its inorder successor (or predecessor). Validate a BST by passing down (min, max) bounds, not by comparing each node with its children only. AVL and red-black trees rebalance with rotations to guarantee O(log n).",
    keyPoints: [
      "Comparing a node with its immediate children only is the classic wrong validation.",
      "Inserting keys in sorted order makes an unbalanced BST a linked list.",
      "AVL trees are more strictly balanced (faster lookup); red-black trees rotate less (faster updates).",
      "Java's TreeMap and C++'s std::map are red-black trees.",
      "Floor means the largest key ≤ x; ceiling means the smallest key ≥ x.",
    ],
  },
  heaps: {
    core: "A binary heap keeps the minimum (or maximum) at the root of an array-backed complete tree, giving O(1) peek and O(log n) insert and remove.",
    answer: "In the array, the children of index i are at 2i + 1 and 2i + 2, and its parent at (i − 1) / 2. Insert appends and sifts up; removing the root moves the last element to the top and sifts down. Building a heap from n elements with bottom-up heapify takes O(n), not O(n log n). The top k elements come from a min-heap of size k in O(n log k). Merging k sorted lists uses a heap of the k list heads. A running median keeps a max-heap for the lower half and a min-heap for the upper half.",
    keyPoints: [
      "Java's PriorityQueue is a min-heap; C++'s priority_queue is a max-heap.",
      "A heap is not sorted: only the root is guaranteed to be the minimum.",
      "Decrease-key is not supported directly: push a new entry and skip stale ones (lazy deletion).",
      "For the k largest elements use a min-heap of size k; for the k smallest use a max-heap.",
      "Dijkstra's algorithm and the top-k pattern are the heap's most common interview uses.",
    ],
  },
  tries: {
    core: "A trie stores strings character by character along shared prefixes, so lookup costs O(length of the word), whatever the number of words stored.",
    answer: "Each node holds children (an array of 26, or a map) and an end-of-word flag. Insert and search walk one node per character, and startsWith stops without checking the flag. Autocomplete walks to the prefix node and then runs a DFS to collect words, and Word Search II puts the dictionary in a trie to prune the grid search. A binary trie over the bits of numbers, from the highest bit down, finds the maximum XOR pair by preferring the opposite bit at each level.",
    keyPoints: [
      "The end-of-word flag separates the word \"app\" from the prefix of \"apple\".",
      "Children arrays are fast but memory-heavy; maps save space for large alphabets.",
      "Space is O(total characters stored), times the alphabet size for arrays.",
      "Store a count at each node to answer \"how many words have this prefix\".",
      "Tries power autocomplete, spell checking and IP routing (longest prefix match).",
    ],
  },
  "graphs-bfs-dfs": {
    core: "A graph is vertices joined by edges; BFS explores level by level and finds shortest paths by edge count, while DFS goes deep and reveals structure.",
    answer: "Adjacency lists use O(V + E) space and suit sparse graphs; an adjacency matrix uses O(V²) and answers \"is there an edge\" in O(1). BFS uses a queue and a visited set and gives the shortest path in an unweighted graph. DFS, recursive or with a stack, finds connected components, cycles and topological orders. In an undirected graph, a cycle is a visited neighbour that is not the parent; in a directed graph, it is a neighbour still on the recursion stack. A graph is bipartite if two-colouring it with BFS or DFS never puts the same colour on both ends of an edge.",
    keyPoints: [
      "Both BFS and DFS run in O(V + E) time.",
      "Mark a node visited when you enqueue it, not when you dequeue it, or it can be added many times.",
      "A grid is an implicit graph: neighbours are the 4 (or 8) directions within bounds.",
      "Multi-source BFS starts with every source in the queue, as in rotting oranges or distance to the nearest exit.",
      "Count connected components by starting a DFS from each node that has not been visited.",
    ],
  },
  "shortest-paths-topo": {
    core: "Pick the shortest-path algorithm by the edge weights: BFS for unweighted, Dijkstra for non-negative, Bellman–Ford for negative, Floyd–Warshall for all pairs.",
    answer: "Topological sort orders a DAG so that every edge points forward, either with Kahn's algorithm (repeatedly remove nodes with in-degree 0 using a queue) or with DFS post-order reversed; if Kahn's algorithm processes fewer than V nodes, the graph has a cycle. Dijkstra relaxes edges from the closest unsettled node using a priority queue, in O((V + E) log V). Bellman–Ford relaxes all edges V − 1 times in O(VE), and a further improvement proves a negative cycle. Floyd–Warshall computes all pairs in O(V³) with DP over intermediate vertices.",
    keyPoints: [
      "Dijkstra gives wrong answers when there are negative edge weights.",
      "In lazy Dijkstra, skip a popped entry whose distance is larger than the best known one.",
      "0-1 BFS with a deque solves graphs whose weights are only 0 and 1 in O(V + E).",
      "On a DAG, relaxing edges in topological order gives shortest paths in O(V + E), even with negative weights.",
      "Course schedule questions are cycle detection plus topological sort.",
    ],
  },
  "union-find-mst": {
    core: "Union-Find tracks which elements are in the same group with near-constant-time union and find; Kruskal's algorithm uses it to build a minimum spanning tree.",
    answer: "Each set has a representative root. find follows parent links with path compression, and union attaches the smaller (or lower-rank) tree under the larger one. Together these give O(α(n)) amortised per operation, where α is the inverse Ackermann function and effectively constant. A minimum spanning tree connects all V vertices with V − 1 edges of minimum total weight. Kruskal's algorithm sorts the edges and adds each one that joins two different components, in O(E log E). Prim's algorithm grows one tree from a start vertex with a priority queue, in O(E log V).",
    keyPoints: [
      "If find(u) == find(v) before you union them, the edge creates a cycle.",
      "Union-Find answers dynamic connectivity, such as the number of provinces or redundant connections.",
      "Kruskal's algorithm suits sparse graphs given as edge lists; Prim's suits dense graphs.",
      "An MST is unique when all edge weights are distinct.",
      "An MST does not give shortest paths between vertices: those are different problems.",
    ],
  },
  "dynamic-programming": {
    core: "Dynamic programming solves overlapping subproblems once and reuses their answers, building the optimal solution from optimal sub-solutions.",
    answer: "DP applies when a problem has optimal substructure and overlapping subproblems. First define the state (what dp[i] or dp[i][j] means), then the recurrence (how a state is built from smaller ones), the base cases and the answer cell. Memoisation is top-down recursion plus a cache; tabulation fills a table bottom-up and often reduces to O(1) or O(n) space with rolling arrays. The classic families are 1-D (climbing stairs, house robber), knapsack, string DP (LCS, edit distance), LIS (O(n log n) with binary search) and grid paths.",
    keyPoints: [
      "Write the state definition in words first; most DP bugs are a vague state.",
      "Time = number of states × cost of each transition.",
      "0/1 knapsack loops capacity downward in 1-D; unbounded knapsack loops it upward.",
      "Edit distance: dp[i][j] = min(insert, delete, replace) + 1, or the diagonal value when the characters match.",
      "If a greedy choice cannot be proven safe, DP is usually the answer.",
    ],
  },
  greedy: {
    core: "A greedy algorithm makes the locally best choice at each step and never revisits it; it is correct only when you can prove that choice is safe.",
    answer: "Greedy works when the problem has the greedy-choice property (some optimal solution includes the greedy choice) and optimal substructure. Prove it with an exchange argument: swapping any optimal solution's choice for the greedy one never makes it worse. Activity selection sorts by end time and picks each compatible interval. Merging intervals sorts by start time. Fractional knapsack takes the best value-to-weight ratio first. Jump game tracks the farthest index reachable. Huffman coding repeatedly merges the two least frequent symbols.",
    keyPoints: [
      "Sorting is usually the first step, and choosing the sort key is the whole insight.",
      "0/1 knapsack and coin change with arbitrary coins break greedy: use DP.",
      "Minimum meeting rooms: sort starts and ends separately, or use a min-heap of end times.",
      "A counterexample of two or three items quickly disproves a wrong greedy rule.",
      "Greedy algorithms are typically O(n log n) because of the sort.",
    ],
  },
};
