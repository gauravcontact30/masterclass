import type { DeepCourse } from "../types";
import { DEEP_COURSES } from "../index";
import { code, file, mcq, qa } from "./helpers";

export const COURSE: DeepCourse = {
  ...DEEP_COURSES.find(course => course.id === "dsa")!,
  intro: [
    "Data structures organize data so that the operations you need are fast; algorithms are step-by-step procedures that use them. Together they decide whether a program handles ten items or ten million, and they are the core of placement tests and coding interviews.",
    "Each topic explains the idea, its complexity and the interview patterns it unlocks, with working implementations in both Java and C++ in separate editor tabs. Practise by re-deriving the code from the description before reading it.",
  ],
  topics: [
    {
      id: "complexity", module: "Foundations", title: "Time and space complexity: Big-O, Ω and Θ", level: "Beginner", minutes: 18,
      summary: "Counting operations as input grows, asymptotic notations, common growth rates, amortized analysis and the master theorem.",
      description: [
        "Complexity analysis estimates how an algorithm's running time (time complexity) and extra memory (space complexity) grow as the input size n grows, ignoring constant factors and hardware. Big-O gives an upper bound (the algorithm takes at most c·f(n) steps for large n), Big-Omega (Ω) a lower bound, and Big-Theta (Θ) a tight bound when both match. In interviews “O” usually means the tight worst case.",
        "Common growth rates, from fastest to slowest: O(1) constant (array index), O(log n) logarithmic (binary search), O(n) linear (single loop), O(n log n) (merge sort), O(n²) quadratic (nested loops over the input), O(2ⁿ) exponential (all subsets) and O(n!) factorial (all permutations). For n = 10⁶, an O(n log n) algorithm does about 2×10⁷ steps while O(n²) does 10¹² — the difference between milliseconds and hours. A rough budget: ~10⁸ simple operations per second.",
        "Rules: drop constants (O(2n) = O(n)) and lower-order terms (O(n² + n) = O(n²)); sequential steps add, nested steps multiply; different inputs keep separate variables (O(a + b), O(a·b)). Best, average and worst cases can differ — quicksort is O(n log n) on average but O(n²) in the worst case.",
        "Amortized analysis averages cost over a sequence: appending to a dynamic array is O(1) amortized even though an occasional resize costs O(n). Recursive algorithms are analysed with recurrences; the master theorem solves T(n) = aT(n/b) + O(n^d): if d > log_b a the cost is O(n^d), if equal O(n^d log n), if smaller O(n^(log_b a)). Space complexity includes the recursion stack.",
      ],
      usage: [
        "Read constraints first: n ≤ 10⁵ usually demands O(n log n) or better; n ≤ 20 allows O(2ⁿ).",
        "State the time and space complexity of every solution you present in an interview.",
        "Use amortized reasoning for dynamic arrays, hash tables and union-find.",
        "Trade space for time with hash maps and precomputation (prefix sums).",
      ],
      files: [
        file("java/Complexity.java", code`
import java.util.HashSet;
import java.util.Set;

public class Complexity {
    // O(1): one operation regardless of n
    static int first(int[] a) { return a[0]; }

    // O(n) time, O(1) space
    static long sum(int[] a) { long s = 0; for (int x : a) s += x; return s; }

    // O(n^2): nested loops over the same input
    static boolean hasDuplicateSlow(int[] a) {
        for (int i = 0; i < a.length; i++)
            for (int j = i + 1; j < a.length; j++)
                if (a[i] == a[j]) return true;
        return false;
    }

    // O(n) time, O(n) space: trade memory for speed
    static boolean hasDuplicateFast(int[] a) {
        Set<Integer> seen = new HashSet<>();
        for (int x : a) if (!seen.add(x)) return true;
        return false;
    }

    // O(log n): the search space halves each step
    static int halvings(int n) { int steps = 0; while (n > 1) { n /= 2; steps++; } return steps; }

    // O(2^n): two recursive calls per level (naive Fibonacci); O(n) stack space
    static long fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }

    public static void main(String[] args) {
        int[] a = {4, 8, 15, 16, 23, 42, 8};
        System.out.println(first(a) + " " + sum(a) + " " + hasDuplicateSlow(a) + " " + hasDuplicateFast(a));
        System.out.println(halvings(1_000_000) + " halvings for a million");   // ~19
        long t = System.nanoTime(); fib(35); System.out.println("fib(35) took " + (System.nanoTime() - t) / 1_000_000 + " ms");
    }
}`),
        file("cpp/complexity.cpp", code`
#include <chrono>
#include <iostream>
#include <unordered_set>
#include <vector>

// O(n log n) is typical of sorting; here: O(n * log n) via doubling inner loop
long long nLogN(int n) {
    long long ops = 0;
    for (int i = 0; i < n; ++i)
        for (int j = 1; j < n; j *= 2) ++ops;    // inner loop runs log2(n) times
    return ops;
}

bool hasDuplicate(const std::vector<int>& a) {   // O(n) average with a hash set
    std::unordered_set<int> seen;
    for (int x : a) if (!seen.insert(x).second) return true;
    return false;
}

long long fibMemo(int n, std::vector<long long>& memo) {   // O(n) after memoization
    if (n < 2) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
}

int main() {
    std::cout << nLogN(1024) << " operations for n=1024\n";   // 1024 * 10
    std::cout << hasDuplicate({1, 2, 3, 2}) << '\n';
    std::vector<long long> memo(91, -1);
    auto t0 = std::chrono::steady_clock::now();
    std::cout << fibMemo(90, memo) << '\n';
    auto us = std::chrono::duration_cast<std::chrono::microseconds>(std::chrono::steady_clock::now() - t0).count();
    std::cout << "took " << us << " us\n";
}`),
        file("cheatsheet.md", code`
| n (max)   | Feasible complexity         |
|-----------|-----------------------------|
| <= 12     | O(n!)                       |
| <= 25     | O(2^n)                      |
| <= 500    | O(n^3)                      |
| <= 5000   | O(n^2)                      |
| <= 10^6   | O(n log n)                  |
| <= 10^8   | O(n)                        |
| larger    | O(log n) or O(1)            |

Master theorem: T(n) = a T(n/b) + O(n^d)
  d >  log_b(a) -> O(n^d)
  d == log_b(a) -> O(n^d log n)     e.g. merge sort: a=2, b=2, d=1 -> O(n log n)
  d <  log_b(a) -> O(n^(log_b a))   e.g. naive recursion a=3, b=2, d=0 -> O(n^1.58)`),
      ],
      tips: [
        "Two separate loops over n are O(n), not O(n²).",
        "A loop that multiplies or divides its counter by a constant is O(log n).",
        "Hash map operations are O(1) average but O(n) worst case — mention it when asked about guarantees.",
        "Recursion depth counts toward space complexity (O(depth) stack).",
      ],
      subjective: [
        qa("Define Big-O, Big-Omega and Big-Theta.", "f(n) = O(g(n)) if there exist constants c > 0 and n₀ such that f(n) ≤ c·g(n) for all n ≥ n₀ — an asymptotic upper bound. f(n) = Ω(g(n)) if f(n) ≥ c·g(n) for all n ≥ n₀ — a lower bound. f(n) = Θ(g(n)) if both hold (with possibly different constants) — a tight bound. Example: 3n² + 5n + 2 is Θ(n²), hence also O(n³) (a loose upper bound) and Ω(n)."),
        qa("What is amortized analysis? Explain with dynamic arrays.", "Amortized analysis bounds the average cost per operation over a worst-case sequence of operations, rather than the cost of each operation in isolation. A dynamic array doubles its capacity when full: most appends cost O(1), but an append that triggers a resize copies all k elements. Over n appends the total copying is at most 1 + 2 + 4 + … + n < 2n, so the total cost is O(n) and the amortized cost per append is O(1)."),
        qa("Find the time complexity of: for (i = 1; i <= n; i *= 2) for (j = 1; j <= i; j++) work();", "The inner loop runs i times, where i takes values 1, 2, 4, …, up to n. The total is 1 + 2 + 4 + … + 2^k with 2^k ≤ n, a geometric series summing to less than 2n. Therefore the complexity is O(n), not O(n log n)."),
      ],
      objective: [
        mcq("Time complexity of binary search:", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1, "The search interval halves each step."),
        mcq("O(3n² + 10n + 100) simplifies to:", ["O(n)", "O(n²)", "O(3n²)", "O(n³)"], 1, "Drop constants and lower-order terms."),
        mcq("Which grows fastest?", ["O(n log n)", "O(n²)", "O(2ⁿ)", "O(n³)"], 2, "Exponential beats any polynomial."),
        mcq("Amortized cost of push_back on a dynamic array:", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 0, "Occasional O(n) resizes average out."),
        mcq("Merge sort's recurrence T(n) = 2T(n/2) + O(n) solves to:", ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], 1, "Master theorem case d = log_b a."),
      ],
    },
    {
      id: "arrays-two-pointers", module: "Foundations", title: "Arrays, prefix sums and the two-pointer technique", level: "Beginner", minutes: 18,
      summary: "Array operations and costs, prefix sums for range queries, two pointers on sorted data, Kadane's algorithm and in-place tricks.",
      description: [
        "An array stores elements contiguously, giving O(1) access by index and excellent cache performance. Inserting or deleting in the middle costs O(n) because elements shift. Many interview problems are array problems in disguise, solved by a handful of patterns.",
        "Prefix sums precompute pre[i] = a[0] + … + a[i-1] in O(n), after which any range sum a[l..r] is pre[r+1] − pre[l] in O(1). Combined with a hash map of prefix sums seen so far, they count subarrays with a given sum in O(n), even with negative numbers. Difference arrays do the reverse: apply many range increments in O(1) each.",
        "Two pointers move two indexes through the data instead of using nested loops. Opposite ends on a sorted array solve pair-sum, container-with-most-water and 3Sum (sort + fix one + two pointers, O(n²)). Same-direction (slow/fast) pointers remove duplicates or partition in place (Dutch national flag).",
        "Kadane's algorithm finds the maximum subarray sum in O(n): at each element either extend the best subarray ending at the previous index or start fresh. Other in-place tricks: reverse to rotate an array, use indexes as hash keys for values in 1..n, and boyer–moore voting for a majority element.",
      ],
      usage: [
        "Range-sum queries on a static array → prefix sums.",
        "Pair/triplet with a target in sorted data → two pointers.",
        "Maximum/minimum contiguous subarray → Kadane.",
        "Remove or partition in place with O(1) extra space → slow/fast pointers.",
      ],
      files: [
        file("java/ArrayPatterns.java", code`
import java.util.*;

public class ArrayPatterns {
    // Prefix sums: O(n) build, O(1) per range query
    static long[] prefix(int[] a) {
        long[] pre = new long[a.length + 1];
        for (int i = 0; i < a.length; i++) pre[i + 1] = pre[i] + a[i];
        return pre;
    }

    // Count subarrays summing to k (works with negatives): O(n)
    static int subarraySum(int[] a, int k) {
        Map<Long, Integer> seen = new HashMap<>(Map.of(0L, 1));
        long running = 0; int count = 0;
        for (int x : a) {
            running += x;
            count += seen.getOrDefault(running - k, 0);   // earlier prefix that makes the gap k
            seen.merge(running, 1, Integer::sum);
        }
        return count;
    }

    // Two pointers on a sorted array: O(n)
    static int[] pairWithSum(int[] sorted, int target) {
        int l = 0, r = sorted.length - 1;
        while (l < r) {
            int s = sorted[l] + sorted[r];
            if (s == target) return new int[]{l, r};
            if (s < target) l++; else r--;
        }
        return new int[0];
    }

    // Kadane: maximum subarray sum, O(n)
    static int maxSubarray(int[] a) {
        int best = a[0], cur = a[0];
        for (int i = 1; i < a.length; i++) {
            cur = Math.max(a[i], cur + a[i]);   // extend or restart
            best = Math.max(best, cur);
        }
        return best;
    }

    // Remove duplicates from a sorted array in place: returns new length
    static int dedupe(int[] a) {
        int slow = 0;
        for (int fast = 0; fast < a.length; fast++)
            if (fast == 0 || a[fast] != a[fast - 1]) a[slow++] = a[fast];
        return slow;
    }

    public static void main(String[] args) {
        long[] pre = prefix(new int[]{3, 1, 4, 1, 5, 9});
        System.out.println("sum[1..4] = " + (pre[5] - pre[1]));          // 1+4+1+5 = 11
        System.out.println(subarraySum(new int[]{1, 2, -1, 2, 1}, 3));   // 3
        System.out.println(Arrays.toString(pairWithSum(new int[]{1, 3, 5, 8, 11}, 13)));
        System.out.println(maxSubarray(new int[]{-2, 1, -3, 4, -1, 2, 1, -5, 4}));   // 6
        int[] d = {1, 1, 2, 3, 3, 3, 4};
        System.out.println(dedupe(d) + " " + Arrays.toString(d));
    }
}`),
        file("cpp/array_patterns.cpp", code`
#include <algorithm>
#include <iostream>
#include <vector>

// 3Sum: all unique triplets summing to zero. Sort + two pointers: O(n^2)
std::vector<std::vector<int>> threeSum(std::vector<int> a) {
    std::sort(a.begin(), a.end());
    std::vector<std::vector<int>> out;
    for (int i = 0; i + 2 < (int)a.size(); ++i) {
        if (i > 0 && a[i] == a[i - 1]) continue;          // skip duplicate anchors
        int l = i + 1, r = (int)a.size() - 1;
        while (l < r) {
            int s = a[i] + a[l] + a[r];
            if (s < 0) ++l;
            else if (s > 0) --r;
            else {
                out.push_back({a[i], a[l], a[r]});
                while (l < r && a[l] == a[l + 1]) ++l;    // skip duplicates
                while (l < r && a[r] == a[r - 1]) --r;
                ++l; --r;
            }
        }
    }
    return out;
}

// Dutch national flag: sort 0s, 1s and 2s in one pass, O(1) space
void sortColors(std::vector<int>& a) {
    int low = 0, mid = 0, high = (int)a.size() - 1;
    while (mid <= high) {
        if (a[mid] == 0) std::swap(a[low++], a[mid++]);
        else if (a[mid] == 1) ++mid;
        else std::swap(a[mid], a[high--]);
    }
}

// Rotate right by k using three reversals: O(n), O(1) space
void rotate(std::vector<int>& a, int k) {
    k %= (int)a.size();
    std::reverse(a.begin(), a.end());
    std::reverse(a.begin(), a.begin() + k);
    std::reverse(a.begin() + k, a.end());
}

int main() {
    for (auto& t : threeSum({-1, 0, 1, 2, -1, -4})) std::cout << t[0] << ',' << t[1] << ',' << t[2] << "  ";
    std::cout << '\n';
    std::vector<int> c{2, 0, 2, 1, 1, 0};
    sortColors(c);
    std::vector<int> r{1, 2, 3, 4, 5, 6, 7};
    rotate(r, 3);
    for (int x : c) std::cout << x;
    std::cout << "  ";
    for (int x : r) std::cout << x;
    std::cout << '\n';
}`),
      ],
      tips: [
        "Use long for running sums to avoid integer overflow on large inputs.",
        "Two pointers on unsorted data usually needs sorting first (O(n log n)) — or a hash map instead.",
        "Kadane with all-negative arrays: initialize with a[0], not 0.",
        "Write the loop invariant for each pointer (“everything left of slow is unique”) before coding.",
      ],
      subjective: [
        qa("Explain Kadane's algorithm and its complexity.", "Kadane's algorithm finds the maximum sum of a contiguous subarray. It scans the array once, keeping cur = the maximum sum of a subarray ending at the current index and best = the maximum seen so far. For each element x: cur = max(x, cur + x) — either extend the previous subarray or start a new one at x — and best = max(best, cur). It runs in O(n) time and O(1) space. It is a simple dynamic programming solution: dp[i] = max(a[i], dp[i-1] + a[i])."),
        qa("How do prefix sums answer range-sum queries in O(1)?", "Precompute pre[0] = 0 and pre[i+1] = pre[i] + a[i] for every i, in O(n) time and O(n) space. pre[i] is the sum of the first i elements. The sum of a[l..r] inclusive equals pre[r+1] − pre[l], because the common prefix a[0..l-1] cancels. Each query is then O(1) — ideal when there are many queries on an unchanging array (for updates use a Fenwick or segment tree)."),
      ],
      objective: [
        mcq("Range-sum queries on a static array are best answered with:", ["Sorting", "Prefix sums", "Binary search", "Recursion"], 1, "O(1) per query after O(n) preprocessing."),
        mcq("Kadane's algorithm runs in:", ["O(n²)", "O(n log n)", "O(n)", "O(log n)"], 2, "Single pass."),
        mcq("The two-pointer pair-sum technique requires the array to be:", ["Unsorted", "Sorted", "Of even length", "Without negatives"], 1, "Moving pointers relies on order."),
        mcq("Time complexity of 3Sum using sort + two pointers:", ["O(n)", "O(n log n)", "O(n²)", "O(n³)"], 2, "n anchors × O(n) scan."),
      ],
    },
    {
      id: "sliding-window-hashing", module: "Foundations", title: "Sliding window and hashing patterns", level: "Intermediate", minutes: 18,
      summary: "Fixed and variable windows, frequency maps, longest substring without repeats, anagram search, and how hash tables work.",
      description: [
        "A sliding window maintains a contiguous range [left, right] while scanning, updating its state incrementally instead of recomputing it. Fixed-size windows (maximum sum of k consecutive elements) add the incoming element and remove the outgoing one. Variable-size windows expand right until a condition breaks, then shrink left until it holds again — each index enters and leaves once, so the total is O(n).",
        "Classic variable-window problems: longest substring without repeating characters, smallest subarray with sum ≥ target (positive numbers), longest substring with at most k distinct characters, minimum window substring containing all characters of a pattern, and finding all anagrams of a pattern in a text.",
        "Hashing gives O(1) average insert and lookup. A hash table maps keys to bucket indexes with a hash function; collisions are handled by chaining (lists or trees per bucket) or open addressing (probing for a free slot). The table resizes when the load factor grows. Frequency maps (character counts), seen-sets for duplicates, and value → index maps (Two Sum) are the most common interview uses. For lowercase letters, an int[26] array is a faster “hash map”.",
      ],
      usage: [
        "Contiguous subarray/substring with a constraint → sliding window.",
        "Need to know whether a value was seen, or its count/index → hash set/map.",
        "Anagram, permutation-in-string, character-count problems → frequency arrays.",
        "Two Sum on unsorted data → map from value to index, O(n).",
      ],
      files: [
        file("java/SlidingWindow.java", code`
import java.util.*;

public class SlidingWindow {
    // Two Sum: value -> index map, O(n)
    static int[] twoSum(int[] a, int target) {
        Map<Integer, Integer> index = new HashMap<>();
        for (int i = 0; i < a.length; i++) {
            Integer j = index.get(target - a[i]);
            if (j != null) return new int[]{j, i};
            index.put(a[i], i);
        }
        return new int[0];
    }

    // Longest substring without repeating characters: variable window, O(n)
    static int longestUnique(String s) {
        Map<Character, Integer> last = new HashMap<>();
        int best = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (last.containsKey(c) && last.get(c) >= left) left = last.get(c) + 1;   // jump past the repeat
            last.put(c, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    // Smallest subarray with sum >= target (positive numbers): shrink while valid
    static int minWindowSum(int[] a, int target) {
        int left = 0, sum = 0, best = Integer.MAX_VALUE;
        for (int right = 0; right < a.length; right++) {
            sum += a[right];
            while (sum >= target) {
                best = Math.min(best, right - left + 1);
                sum -= a[left++];
            }
        }
        return best == Integer.MAX_VALUE ? 0 : best;
    }

    // Maximum sum of any k consecutive elements: fixed window
    static int maxSumK(int[] a, int k) {
        int window = 0;
        for (int i = 0; i < k; i++) window += a[i];
        int best = window;
        for (int i = k; i < a.length; i++) { window += a[i] - a[i - k]; best = Math.max(best, window); }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9)));
        System.out.println(longestUnique("abcabcbb") + " " + longestUnique("pwwkew"));   // 3 3
        System.out.println(minWindowSum(new int[]{2, 3, 1, 2, 4, 3}, 7));               // 2
        System.out.println(maxSumK(new int[]{1, 4, 2, 10, 2, 3, 1, 0, 20}, 4));         // 24
    }
}`),
        file("cpp/anagrams.cpp", code`
#include <array>
#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

// All start indexes of anagrams of p in s: fixed window + frequency arrays, O(n)
std::vector<int> findAnagrams(const std::string& s, const std::string& p) {
    std::vector<int> out;
    if (p.size() > s.size()) return out;
    std::array<int, 26> need{}, have{};
    for (char c : p) ++need[c - 'a'];
    for (std::size_t i = 0; i < s.size(); ++i) {
        ++have[s[i] - 'a'];                                   // add incoming character
        if (i >= p.size()) --have[s[i - p.size()] - 'a'];     // remove outgoing character
        if (have == need) out.push_back(int(i + 1 - p.size()));
    }
    return out;
}

// Minimum window in s containing all characters of t (with multiplicity), O(|s| + |t|)
std::string minWindow(const std::string& s, const std::string& t) {
    std::array<int, 128> need{};
    for (char c : t) ++need[c];
    int missing = (int)t.size(), left = 0, bestStart = 0, bestLen = INT32_MAX;
    for (int right = 0; right < (int)s.size(); ++right) {
        if (need[s[right]]-- > 0) --missing;                  // a needed char entered
        while (missing == 0) {                                // window valid: try to shrink
            if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestStart = left; }
            if (++need[s[left++]] > 0) ++missing;             // a needed char left
        }
    }
    return bestLen == INT32_MAX ? "" : s.substr(bestStart, bestLen);
}

int main() {
    for (int i : findAnagrams("cbaebabacd", "abc")) std::cout << i << ' ';   // 0 6
    std::cout << '\n' << minWindow("ADOBECODEBANC", "ABC") << '\n';          // BANC
}`),
      ],
      tips: [
        "Shrinking windows work for “sum ≥ target” only with non-negative numbers; with negatives use prefix sums + hash map.",
        "Template: expand right → update state → while (invalid) shrink left → record answer.",
        "Use getOrDefault/merge in Java and operator[] in C++ for counting.",
        "Mention worst-case O(n) hash operations and the possibility of adversarial collisions.",
      ],
      subjective: [
        qa("When can the sliding window technique be applied?", "When the problem asks about a contiguous subarray or substring and the window's validity changes monotonically as it grows or shrinks — e.g. adding elements can only increase the sum (non-negative values) or the number of distinct characters. Then once a window becomes invalid, any larger window with the same left end is also invalid, so the left pointer never moves backwards. Each element enters and leaves the window at most once, giving O(n)."),
        qa("How does a hash table handle collisions?", "Separate chaining: each bucket stores a list (or a balanced tree, as in Java 8 HashMap for long chains) of entries with the same bucket index; lookups scan that chain. Open addressing: all entries live in the array itself; on collision the table probes other slots (linear probing, quadratic probing, double hashing) until it finds the key or an empty slot; deletions need tombstones. Both rely on a good hash function and resizing when the load factor exceeds a threshold to keep average O(1)."),
      ],
      objective: [
        mcq("Longest substring without repeating characters can be solved in:", ["O(n³)", "O(n²) only", "O(n) with a sliding window", "O(log n)"], 2, "Each character is visited at most twice."),
        mcq("Two Sum on an unsorted array in O(n) uses:", ["Sorting", "A hash map", "Binary search", "Recursion"], 1, "Store value → index."),
        mcq("Average time for hash map lookup:", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 0, "Worst case O(n)."),
        mcq("Fixed window of size k: moving one step costs:", ["O(k)", "O(1)", "O(n)", "O(log k)"], 1, "Add the new element, remove the old one."),
      ],
    },
    {
      id: "recursion-backtracking", module: "Foundations", title: "Recursion and backtracking", level: "Intermediate", minutes: 20,
      summary: "Base cases and recursive cases, the call stack, subsets and permutations, N-Queens, pruning and complexity of exhaustive search.",
      description: [
        "A recursive function solves a problem by calling itself on smaller instances. It needs a base case that stops recursion and a recursive case that makes progress toward it. Each call gets a stack frame; too deep recursion overflows the stack, so very deep linear recursions are often converted to loops. Thinking recursively: trust that the call solves the smaller problem, then combine.",
        "Backtracking builds candidate solutions incrementally and abandons (backtracks from) a partial candidate as soon as it cannot lead to a valid solution. The template is choose → explore → un-choose: add an option to the current path, recurse, then remove it to restore state for the next option.",
        "Classic problems: generating all subsets (2ⁿ), permutations (n!), combinations (n choose k), combination sum, N-Queens, Sudoku, word search in a grid and generating balanced parentheses. Pruning — skipping branches that cannot succeed (sorting and breaking early when the sum exceeds the target, checking column/diagonal conflicts) — makes exhaustive search practical.",
        "Complexity of backtracking is usually (number of nodes in the search tree) × (work per node), e.g. O(n·2ⁿ) for subsets because each of 2ⁿ subsets is copied in O(n). If subproblems repeat, add memoization — that turns recursion into dynamic programming.",
      ],
      usage: [
        "“Generate all …”, “find every combination/arrangement” → backtracking.",
        "Constraint satisfaction (Sudoku, N-Queens, scheduling) → backtracking with pruning.",
        "Tree and graph traversals are naturally recursive.",
        "Divide and conquer (merge sort, quick sort, binary search) is recursion on halves.",
      ],
      files: [
        file("java/Backtracking.java", code`
import java.util.*;

public class Backtracking {
    // Subsets: each element is either in or out -> 2^n subsets
    static void subsets(int[] a, int i, Deque<Integer> path, List<List<Integer>> out) {
        if (i == a.length) { out.add(new ArrayList<>(path)); return; }   // base case: copy the path
        subsets(a, i + 1, path, out);              // exclude a[i]
        path.addLast(a[i]);                        // choose
        subsets(a, i + 1, path, out);              // explore
        path.removeLast();                         // un-choose (backtrack)
    }

    // Permutations using a 'used' array -> n! results
    static void permute(int[] a, boolean[] used, List<Integer> path, List<List<Integer>> out) {
        if (path.size() == a.length) { out.add(new ArrayList<>(path)); return; }
        for (int i = 0; i < a.length; i++) {
            if (used[i]) continue;
            used[i] = true; path.add(a[i]);
            permute(a, used, path, out);
            used[i] = false; path.remove(path.size() - 1);
        }
    }

    // Combination sum (reuse allowed) with pruning on a sorted array
    static void combinationSum(int[] c, int start, int remaining, Deque<Integer> path, List<List<Integer>> out) {
        if (remaining == 0) { out.add(new ArrayList<>(path)); return; }
        for (int i = start; i < c.length; i++) {
            if (c[i] > remaining) break;           // prune: later values are even larger
            path.addLast(c[i]);
            combinationSum(c, i, remaining - c[i], path, out);
            path.removeLast();
        }
    }

    public static void main(String[] args) {
        List<List<Integer>> s = new ArrayList<>();
        subsets(new int[]{1, 2, 3}, 0, new ArrayDeque<>(), s);
        System.out.println(s.size() + " subsets: " + s);
        List<List<Integer>> p = new ArrayList<>();
        permute(new int[]{1, 2, 3}, new boolean[3], new ArrayList<>(), p);
        System.out.println(p.size() + " permutations: " + p);
        List<List<Integer>> c = new ArrayList<>();
        int[] coins = {2, 3, 6, 7};
        Arrays.sort(coins);
        combinationSum(coins, 0, 7, new ArrayDeque<>(), c);
        System.out.println(c);                     // [[2, 2, 3], [7]]
    }
}`),
        file("cpp/n_queens.cpp", code`
#include <iostream>
#include <string>
#include <vector>

// N-Queens: place n queens so none attack each other. O(n!) worst case, pruned heavily.
class NQueens {
    int n_;
    std::vector<bool> col_, diag_, anti_;    // occupied columns and diagonals
    std::vector<std::string> board_;
    int solutions_ = 0;

    void place(int row) {
        if (row == n_) {                                     // base case: all rows filled
            if (++solutions_ == 1) for (auto& line : board_) std::cout << line << '\n';
            return;
        }
        for (int c = 0; c < n_; ++c) {
            if (col_[c] || diag_[row + c] || anti_[row - c + n_ - 1]) continue;   // prune conflicts
            col_[c] = diag_[row + c] = anti_[row - c + n_ - 1] = true;           // choose
            board_[row][c] = 'Q';
            place(row + 1);                                                       // explore
            board_[row][c] = '.';                                                 // un-choose
            col_[c] = diag_[row + c] = anti_[row - c + n_ - 1] = false;
        }
    }
public:
    explicit NQueens(int n) : n_(n), col_(n), diag_(2 * n - 1), anti_(2 * n - 1), board_(n, std::string(n, '.')) { }
    int solve() { place(0); return solutions_; }
};

// Balanced parentheses: only add ')' when it keeps the string valid
void parens(int open, int close, int n, std::string& cur, std::vector<std::string>& out) {
    if ((int)cur.size() == 2 * n) { out.push_back(cur); return; }
    if (open < n) { cur.push_back('('); parens(open + 1, close, n, cur, out); cur.pop_back(); }
    if (close < open) { cur.push_back(')'); parens(open, close + 1, n, cur, out); cur.pop_back(); }
}

int main() {
    std::cout << "solutions for 8 queens: " << NQueens(8).solve() << '\n';   // 92
    std::vector<std::string> out; std::string cur;
    parens(0, 0, 3, cur, out);
    for (auto& s : out) std::cout << s << ' ';                               // 5 strings (Catalan number)
    std::cout << '\n';
}`),
      ],
      tips: [
        "Always copy the path when recording a result (new ArrayList<>(path)); otherwise every result is the same mutated list.",
        "Draw the recursion tree for small input — it reveals both the logic and the complexity.",
        "For duplicates in input (subsets II, permutations II), sort first and skip equal siblings.",
        "If the same (index, remaining) state repeats, memoize: that is dynamic programming.",
      ],
      subjective: [
        qa("What is backtracking? Write its general template.", "Backtracking is a systematic search that builds a solution step by step and abandons a partial solution as soon as it violates a constraint, returning to the previous decision point to try another option. Template: solve(state): if state is a complete solution, record it and return; for each choice available in state: if the choice is valid, apply it (choose), call solve(new state) (explore), then undo it (un-choose). Pruning invalid choices early is what makes it efficient compared with brute-force enumeration."),
        qa("Differentiate recursion and iteration.", "Recursion solves a problem through functions calling themselves on smaller subproblems; it expresses tree-shaped and divide-and-conquer problems naturally but uses a stack frame per call (O(depth) space, risk of stack overflow) and has call overhead. Iteration repeats a block with loops, using constant extra space unless an explicit stack is kept. Any recursion can be converted to iteration with an explicit stack; tail recursion can become a simple loop."),
      ],
      objective: [
        mcq("Number of subsets of a set with n elements:", ["n", "n²", "2ⁿ", "n!"], 2, "Each element is in or out."),
        mcq("A recursive function without a reachable base case causes:", ["Faster execution", "Stack overflow", "Compile error always", "An infinite loop without memory use"], 1, "Frames accumulate."),
        mcq("Number of solutions to the 8-Queens problem:", ["8", "64", "92", "40320"], 2, "12 fundamentally distinct, 92 in total."),
        mcq("The “un-choose” step in backtracking:", ["Records the answer", "Restores state for the next choice", "Sorts the input", "Memoizes the result"], 1, "Undo the last decision."),
      ],
    },
    {
      id: "linked-lists", module: "Linear data structures", title: "Linked lists", level: "Beginner", minutes: 20,
      summary: "Singly and doubly linked lists, insert/delete, reversal, fast and slow pointers, cycle detection, merging and the dummy node trick.",
      description: [
        "A linked list stores elements in nodes that point to the next node (singly linked) or to both neighbours (doubly linked); a circular list links the tail back to the head. Nodes need not be contiguous, so insertion and deletion at a known position are O(1) pointer changes, but access by index is O(n) and each node carries pointer overhead.",
        "Core operations: insert at head O(1), insert at tail O(1) with a tail pointer, delete a node given its predecessor O(1), search O(n). A dummy (sentinel) head node removes special cases when the head itself may change.",
        "Interview patterns: reverse a list iteratively with three pointers (prev, cur, next) in O(n) time and O(1) space; fast and slow pointers find the middle, detect a cycle (Floyd's tortoise and hare) and find the cycle's start; a gap of k between two pointers finds the k-th node from the end; merging two sorted lists builds the result behind a dummy node; LRU caches combine a doubly linked list with a hash map.",
      ],
      usage: [
        "Implement queues, deques and LRU caches where O(1) insert/remove at known positions matters.",
        "Use a dummy node whenever the head may be deleted or replaced.",
        "Use fast/slow pointers for middle, cycle and palindrome checks.",
        "In real code, prefer ArrayList/ArrayDeque or std::vector unless you need stable node splicing.",
      ],
      files: [
        file("java/LinkedListOps.java", code`
public class LinkedListOps {
    static class Node {
        int val; Node next;
        Node(int val) { this.val = val; }
    }

    static Node build(int... values) {
        Node dummy = new Node(0), tail = dummy;
        for (int v : values) { tail.next = new Node(v); tail = tail.next; }
        return dummy.next;
    }

    static String show(Node head) {
        StringBuilder sb = new StringBuilder();
        for (Node n = head; n != null; n = n.next) sb.append(n.val).append(n.next != null ? " -> " : "");
        return sb.toString();
    }

    // Iterative reversal: O(n) time, O(1) space
    static Node reverse(Node head) {
        Node prev = null, cur = head;
        while (cur != null) {
            Node next = cur.next;   // save
            cur.next = prev;        // reverse the link
            prev = cur;             // advance
            cur = next;
        }
        return prev;
    }

    // Middle node: slow moves 1, fast moves 2
    static Node middle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
        return slow;
    }

    // Floyd's cycle detection; returns the node where the cycle starts, or null
    static Node cycleStart(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next; fast = fast.next.next;
            if (slow == fast) {                        // they meet inside the cycle
                Node p = head;
                while (p != slow) { p = p.next; slow = slow.next; }
                return p;                              // distance math: both reach the start together
            }
        }
        return null;
    }

    // Remove the k-th node from the end in one pass using a gap of k
    static Node removeKthFromEnd(Node head, int k) {
        Node dummy = new Node(0); dummy.next = head;
        Node lead = dummy, trail = dummy;
        for (int i = 0; i <= k; i++) lead = lead.next;
        while (lead != null) { lead = lead.next; trail = trail.next; }
        trail.next = trail.next.next;
        return dummy.next;
    }

    public static void main(String[] args) {
        Node list = build(1, 2, 3, 4, 5);
        System.out.println(show(list) + " | middle " + middle(list).val);
        list = reverse(list);
        System.out.println(show(list));
        System.out.println(show(removeKthFromEnd(list, 2)));

        Node cyc = build(3, 2, 0, -4);
        cyc.next.next.next.next = cyc.next;            // tail -> node with value 2
        System.out.println("cycle starts at " + cycleStart(cyc).val);
    }
}`),
        file("cpp/merge_lists.cpp", code`
#include <iostream>

struct Node {
    int val;
    Node* next;
    explicit Node(int v, Node* n = nullptr) : val(v), next(n) { }
};

// Merge two sorted lists by relinking nodes: O(n + m) time, O(1) extra space
Node* merge(Node* a, Node* b) {
    Node dummy(0);
    Node* tail = &dummy;
    while (a && b) {
        Node*& smaller = (a->val <= b->val) ? a : b;   // reference to the pointer we advance
        tail->next = smaller;
        tail = smaller;
        smaller = smaller->next;
    }
    tail->next = a ? a : b;                         // append the remainder
    return dummy.next;
}

// Doubly linked list insertion after a node: O(1)
struct DNode { int val; DNode* prev = nullptr; DNode* next = nullptr; };
void insertAfter(DNode* node, DNode* fresh) {
    fresh->prev = node;
    fresh->next = node->next;
    if (node->next) node->next->prev = fresh;
    node->next = fresh;
}

void freeList(Node* n) { while (n) { Node* next = n->next; delete n; n = next; } }

int main() {
    Node* a = new Node(1, new Node(4, new Node(7)));
    Node* b = new Node(2, new Node(3, new Node(8)));
    Node* m = merge(a, b);
    for (Node* p = m; p; p = p->next) std::cout << p->val << ' ';   // 1 2 3 4 7 8
    std::cout << '\n';
    freeList(m);

    DNode x{1}, z{3}, y{2};
    x.next = &z; z.prev = &x;
    insertAfter(&x, &y);
    for (DNode* p = &x; p; p = p->next) std::cout << p->val << ' ';  // 1 2 3
    std::cout << '\n';
}`),
      ],
      tips: [
        "Draw boxes and arrows; most linked-list bugs are lost references when you overwrite next too early.",
        "Check null before fast.next.next — test with 0, 1 and 2 nodes.",
        "Reversing a sublist (between positions m and n) is the same three-pointer loop with a dummy node.",
        "Deleting a node when only that node is given: copy the next node's value into it and skip the next node (not possible for the tail).",
      ],
      subjective: [
        qa("Compare arrays and linked lists.", "Arrays: contiguous memory, O(1) random access, O(n) insertion/deletion in the middle due to shifting, fixed size (or amortized resizing), excellent cache locality, no per-element pointer overhead. Linked lists: nodes scattered in memory, O(n) access by position, O(1) insertion/deletion when the node (or its predecessor) is known, grow and shrink one node at a time, extra memory for pointers, poor cache locality. Arrays win for indexing and iteration; linked lists for frequent splicing at known positions."),
        qa("Explain Floyd's cycle detection algorithm.", "Use two pointers starting at the head: slow advances one node per step, fast advances two. If the list has no cycle, fast reaches null. If it has a cycle, fast eventually laps slow and they meet inside the cycle. To find the cycle's entry, move one pointer back to the head and advance both one step at a time; they meet at the start of the cycle, because the distance from head to the entry equals the distance from the meeting point to the entry (mod the cycle length). Time O(n), space O(1)."),
      ],
      objective: [
        mcq("Time to access the k-th element of a singly linked list:", ["O(1)", "O(log n)", "O(k)", "O(n²)"], 2, "You must walk k nodes."),
        mcq("Space complexity of iterative linked-list reversal:", ["O(1)", "O(n)", "O(log n)", "O(n²)"], 0, "Three pointers."),
        mcq("Fast/slow pointers can find:", ["The middle node", "A cycle", "The k-th node from the end (with a gap)", "All of these"], 3, "Variations of the same idea."),
        mcq("Main purpose of a dummy head node:", ["Save memory", "Avoid special cases when the head changes", "Make the list circular", "Speed up search"], 1, "Uniform insertion/deletion logic."),
      ],
    },
    {
      id: "stacks-queues", module: "Linear data structures", title: "Stacks, queues, deques and monotonic structures", level: "Intermediate", minutes: 20,
      summary: "LIFO and FIFO, balanced brackets, expression evaluation, next greater element with a monotonic stack, sliding window maximum with a deque.",
      description: [
        "A stack is Last-In-First-Out: push and pop at the top in O(1). Uses: function calls, undo, DFS, matching brackets, evaluating postfix expressions and converting infix to postfix (shunting-yard). A queue is First-In-First-Out: enqueue at the back, dequeue from the front in O(1). Uses: BFS, scheduling, buffering. A deque supports both ends. Circular buffers implement fixed-size queues in an array.",
        "A monotonic stack keeps elements in increasing or decreasing order by popping those that violate the order before pushing. Each element is pushed and popped at most once, so it solves “next greater/smaller element”, daily temperatures, stock span and largest rectangle in a histogram in O(n).",
        "A monotonic deque keeps candidate indexes in decreasing order of value: the front is always the maximum of the current window. It solves sliding window maximum in O(n). Other classic exercises: implement a queue with two stacks (amortized O(1)), a stack with O(1) getMin, and evaluate expressions.",
      ],
      usage: [
        "Matching/nesting problems (brackets, HTML tags, undo history) → stack.",
        "Level-by-level processing and shortest paths in unweighted graphs → queue (BFS).",
        "“Next greater/smaller”, spans and histogram areas → monotonic stack.",
        "Window maximum/minimum → monotonic deque.",
      ],
      files: [
        file("java/StackPatterns.java", code`
import java.util.*;

public class StackPatterns {
    static boolean balanced(String s) {
        Deque<Character> st = new ArrayDeque<>();
        Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
        for (char c : s.toCharArray()) {
            if (pairs.containsValue(c)) st.push(c);
            else if (pairs.containsKey(c) && (st.isEmpty() || st.pop() != pairs.get(c))) return false;
        }
        return st.isEmpty();
    }

    // Evaluate postfix (Reverse Polish Notation): "3 4 + 2 *" = 14
    static int evalRpn(String expr) {
        Deque<Integer> st = new ArrayDeque<>();
        for (String tok : expr.split(" ")) {
            switch (tok) {
                case "+" -> st.push(st.pop() + st.pop());
                case "*" -> st.push(st.pop() * st.pop());
                case "-" -> { int b = st.pop(), a = st.pop(); st.push(a - b); }   // order matters
                case "/" -> { int b = st.pop(), a = st.pop(); st.push(a / b); }
                default -> st.push(Integer.parseInt(tok));
            }
        }
        return st.pop();
    }

    // Next greater element to the right: monotonic decreasing stack of indexes, O(n)
    static int[] nextGreater(int[] a) {
        int[] ans = new int[a.length];
        Arrays.fill(ans, -1);
        Deque<Integer> st = new ArrayDeque<>();
        for (int i = 0; i < a.length; i++) {
            while (!st.isEmpty() && a[st.peek()] < a[i]) ans[st.pop()] = a[i];   // a[i] answers them
            st.push(i);
        }
        return ans;
    }

    // Stack with O(1) getMin
    static class MinStack {
        private final Deque<int[]> st = new ArrayDeque<>();      // {value, min so far}
        void push(int x) { st.push(new int[]{x, st.isEmpty() ? x : Math.min(x, st.peek()[1])}); }
        int pop() { return st.pop()[0]; }
        int min() { return st.peek()[1]; }
    }

    public static void main(String[] args) {
        System.out.println(balanced("{[()()]}") + " " + balanced("([)]"));
        System.out.println(evalRpn("3 4 + 2 *") + " " + evalRpn("10 2 8 * + 3 -"));   // 14 23
        System.out.println(Arrays.toString(nextGreater(new int[]{2, 1, 2, 4, 3})));   // [4, 2, 4, -1, -1]
        MinStack ms = new MinStack(); ms.push(5); ms.push(2); ms.push(7);
        System.out.println(ms.min()); ms.pop(); ms.pop(); System.out.println(ms.min());   // 2 5
    }
}`),
        file("cpp/deque_patterns.cpp", code`
#include <deque>
#include <iostream>
#include <stack>
#include <vector>

// Sliding window maximum: deque of indexes with decreasing values, O(n)
std::vector<int> windowMax(const std::vector<int>& a, int k) {
    std::deque<int> dq;
    std::vector<int> out;
    for (int i = 0; i < (int)a.size(); ++i) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();           // index left the window
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();        // smaller values can never be max
        dq.push_back(i);
        if (i >= k - 1) out.push_back(a[dq.front()]);
    }
    return out;
}

// Largest rectangle in a histogram: monotonic increasing stack, O(n)
long long largestRectangle(const std::vector<int>& h) {
    std::stack<int> st;
    long long best = 0;
    for (int i = 0; i <= (int)h.size(); ++i) {
        int cur = i == (int)h.size() ? 0 : h[i];                         // sentinel flushes the stack
        while (!st.empty() && h[st.top()] >= cur) {
            int height = h[st.top()]; st.pop();
            int left = st.empty() ? -1 : st.top();
            best = std::max(best, (long long)height * (i - left - 1));
        }
        st.push(i);
    }
    return best;
}

// Queue using two stacks: amortized O(1) per operation
class TwoStackQueue {
    std::stack<int> in_, out_;
public:
    void push(int x) { in_.push(x); }
    int pop() {
        if (out_.empty()) while (!in_.empty()) { out_.push(in_.top()); in_.pop(); }
        int x = out_.top(); out_.pop();
        return x;
    }
};

int main() {
    for (int x : windowMax({1, 3, -1, -3, 5, 3, 6, 7}, 3)) std::cout << x << ' ';   // 3 3 5 5 6 7
    std::cout << '\n' << largestRectangle({2, 1, 5, 6, 2, 3}) << '\n';             // 10
    TwoStackQueue q; q.push(1); q.push(2); q.push(3);
    std::cout << q.pop() << q.pop() << '\n';                                      // 12
}`),
      ],
      tips: [
        "In Java use ArrayDeque for stacks and queues; Stack and LinkedList are slower legacy choices.",
        "Store indexes, not values, in monotonic stacks — you often need distances.",
        "Postfix evaluation: the second pop is the left operand.",
        "A circular queue in an array uses (rear + 1) % capacity and distinguishes full from empty with a count.",
      ],
      subjective: [
        qa("Convert the infix expression A + B * (C - D) / E to postfix and explain the algorithm.", "Using the shunting-yard algorithm: scan left to right; output operands immediately; push '(' onto the stack; on ')' pop operators to the output until '('; on an operator, pop operators of higher or equal precedence (for left-associative operators) before pushing it; at the end pop everything. Result: A B C D - * E / +. Evaluate postfix with a stack: push operands, and for each operator pop two operands, apply it (second popped is the left operand) and push the result."),
        qa("What is a monotonic stack and why is it O(n)?", "A monotonic stack maintains its elements in strictly increasing or decreasing order. Before pushing a new element, it pops all elements that would violate the order; those popped elements have just found their answer (e.g. their next greater element is the new element). Although there is a nested while loop, each element is pushed once and popped at most once across the entire scan, so total work is O(n)."),
      ],
      objective: [
        mcq("Which data structure is used for BFS?", ["Stack", "Queue", "Heap", "Tree"], 1, "FIFO processes nodes level by level."),
        mcq("Postfix of (A + B) * C:", ["A B C * +", "A B + C *", "+ A B * C", "A + B C *"], 1, "Parentheses force + first."),
        mcq("Sliding window maximum in O(n) uses:", ["A min-heap only", "A monotonic deque", "Sorting each window", "A stack of values"], 1, "The front holds the current maximum."),
        mcq("Amortized cost of dequeue in a queue built from two stacks:", ["O(1)", "O(n)", "O(log n)", "O(n²)"], 0, "Each element moves between stacks once."),
      ],
    },
    {
      id: "binary-search", module: "Searching and sorting", title: "Binary search and searching on the answer", level: "Intermediate", minutes: 18,
      summary: "Iterative binary search, lower/upper bounds, rotated arrays, and binary search over a monotonic answer space.",
      description: [
        "Binary search finds a target in a sorted array in O(log n) by comparing with the middle element and discarding half of the range each step. Compute mid as lo + (hi - lo) / 2 to avoid overflow, and keep a clear invariant for whether hi is inclusive or exclusive — most bugs are off-by-one errors.",
        "Variants find boundaries rather than any match: lower bound (first index with a[i] ≥ x), upper bound (first index with a[i] > x), first/last occurrence, the insertion position, and the count of x (upper − lower). In a rotated sorted array, one half is always sorted; check whether the target lies in that half. Peak finding and searching a 2-D sorted matrix are further variants.",
        "The most powerful form is binary search on the answer: when a predicate “can we achieve the goal with value v?” is monotonic (false…false, true…true), binary search the smallest v that makes it true. Examples: minimum eating speed (Koko bananas), minimum capacity to ship packages in D days, allocate books / split array largest sum, aggressive cows, and the integer square root. Complexity is O(log(range) × cost of the check).",
      ],
      usage: [
        "Sorted data and a lookup → binary search instead of a linear scan.",
        "“Minimum maximum” or “maximum minimum” wording → binary search on the answer.",
        "Find boundaries (first/last occurrence) for counting in sorted data.",
        "Use library functions (Arrays.binarySearch, Collections.binarySearch, std::lower_bound) when they fit.",
      ],
      files: [
        file("java/BinarySearch.java", code`
public class BinarySearch {
    static int search(int[] a, int x) {
        int lo = 0, hi = a.length - 1;                    // inclusive range [lo, hi]
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;                 // no overflow
            if (a[mid] == x) return mid;
            if (a[mid] < x) lo = mid + 1; else hi = mid - 1;
        }
        return -1;
    }

    // First index with a[i] >= x (insertion point); returns a.length if none
    static int lowerBound(int[] a, int x) {
        int lo = 0, hi = a.length;                        // half-open [lo, hi)
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] < x) lo = mid + 1; else hi = mid;
        }
        return lo;
    }

    // Search in a rotated sorted array (distinct values)
    static int searchRotated(int[] a, int x) {
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) >>> 1;
            if (a[mid] == x) return mid;
            if (a[lo] <= a[mid]) {                        // left half sorted
                if (a[lo] <= x && x < a[mid]) hi = mid - 1; else lo = mid + 1;
            } else {                                      // right half sorted
                if (a[mid] < x && x <= a[hi]) lo = mid + 1; else hi = mid - 1;
            }
        }
        return -1;
    }

    // Binary search on the answer: minimum speed to eat all piles within h hours
    static int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);
        while (lo < hi) {
            int speed = lo + (hi - lo) / 2;
            long hours = 0;
            for (int p : piles) hours += (p + speed - 1) / speed;   // ceil(p / speed)
            if (hours <= h) hi = speed; else lo = speed + 1;      // feasible -> try slower
        }
        return lo;
    }

    public static void main(String[] args) {
        int[] a = {1, 3, 3, 3, 7, 9, 12};
        System.out.println(search(a, 7) + " " + lowerBound(a, 3) + " " + (lowerBound(a, 4) - lowerBound(a, 3)) + " threes");
        System.out.println(searchRotated(new int[]{4, 5, 6, 7, 0, 1, 2}, 0));   // 4
        System.out.println(minEatingSpeed(new int[]{3, 6, 7, 11}, 8));          // 4
    }
}`),
        file("cpp/answer_search.cpp", code`
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

// Split array into k parts minimizing the largest part sum (also "allocate books")
bool canSplit(const std::vector<int>& a, int k, long long limit) {
    int parts = 1; long long cur = 0;
    for (int x : a) {
        if (x > limit) return false;
        if (cur + x > limit) { ++parts; cur = 0; }
        cur += x;
    }
    return parts <= k;                                 // monotonic: larger limits are always feasible
}

long long splitArray(const std::vector<int>& a, int k) {
    long long lo = *std::max_element(a.begin(), a.end());
    long long hi = std::accumulate(a.begin(), a.end(), 0LL);
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (canSplit(a, k, mid)) hi = mid; else lo = mid + 1;
    }
    return lo;
}

int isqrt(int n) {                                     // largest r with r*r <= n
    long long lo = 0, hi = n;
    while (lo < hi) {
        long long mid = (lo + hi + 1) / 2;             // upper mid to avoid an infinite loop
        if (mid * mid <= n) lo = mid; else hi = mid - 1;
    }
    return (int)lo;
}

int main() {
    std::cout << splitArray({7, 2, 5, 10, 8}, 2) << '\n';   // 18
    std::cout << isqrt(99) << ' ' << isqrt(100) << '\n';     // 9 10
    std::vector<int> v{1, 2, 4, 4, 5};
    std::cout << (std::upper_bound(v.begin(), v.end(), 4) - std::lower_bound(v.begin(), v.end(), 4)) << '\n';   // 2
}`),
      ],
      tips: [
        "Pick one convention (inclusive [lo, hi] or half-open [lo, hi)) and never mix them in one function.",
        "When the update is lo = mid, use the upper middle ((lo + hi + 1) / 2) to guarantee progress.",
        "Test with arrays of size 0, 1 and 2, and targets smaller/larger than all elements.",
        "Binary search on the answer needs a monotonic feasibility check — prove it before coding.",
      ],
      subjective: [
        qa("Write the binary search algorithm and derive its complexity.", "Given a sorted array a[0..n-1] and target x: set lo = 0, hi = n − 1. While lo ≤ hi: mid = lo + (hi − lo)/2; if a[mid] == x return mid; if a[mid] < x set lo = mid + 1, else set hi = mid − 1. Return −1 if the loop ends. Each iteration halves the search interval, so after k iterations at most n/2^k elements remain; the loop ends when this falls below 1, i.e. k ≈ log₂ n. Time O(log n), space O(1) iteratively (O(log n) recursively)."),
        qa("What is “binary search on the answer”? Give an example.", "Instead of searching an array, we search the range of possible answers for the smallest (or largest) value satisfying a condition, which works when the condition is monotonic — once true, it stays true for larger values. Example: the minimum ship capacity to deliver packages within D days. If capacity C works, any larger capacity also works. Binary search C between max(weight) and sum(weights), checking each candidate greedily in O(n), for O(n log(sum)) total."),
      ],
      objective: [
        mcq("Binary search requires the data to be:", ["Unique", "Sorted (or monotonic)", "Stored in a linked list", "Of power-of-two length"], 1, "Order lets us discard halves."),
        mcq("Why compute mid as lo + (hi - lo) / 2?", ["Faster", "Avoids integer overflow", "Rounds up", "Required by Java"], 1, "lo + hi can overflow."),
        mcq("Maximum comparisons to search 1,000,000 sorted items:", ["~10", "~20", "~1000", "~500000"], 1, "log₂(10⁶) ≈ 20."),
        mcq("std::lower_bound returns an iterator to the first element:", ["> value", ">= value", "== value only", "< value"], 1, "upper_bound gives > value."),
      ],
    },
    {
      id: "sorting", module: "Searching and sorting", title: "Sorting algorithms", level: "Intermediate", minutes: 24,
      summary: "Bubble, selection and insertion sort; merge sort and quick sort; heap sort; counting sort; stability and what libraries actually use.",
      description: [
        "Elementary O(n²) sorts: bubble sort repeatedly swaps adjacent out-of-order pairs (with an early exit if no swaps, best case O(n)); selection sort selects the minimum of the unsorted part each pass (always O(n²), minimal swaps, not stable); insertion sort inserts each element into the sorted prefix (O(n) on nearly sorted data, stable, great for small arrays).",
        "Merge sort divides the array in halves, sorts them recursively and merges the sorted halves: always O(n log n), stable, but needs O(n) extra memory; it is ideal for linked lists and external sorting. Quick sort picks a pivot, partitions elements smaller and larger than it (Lomuto or Hoare scheme) and recurses: O(n log n) on average, O(n²) worst case (bad pivots on sorted input — mitigated by random or median-of-three pivots), in place, not stable, and very fast in practice. Heap sort builds a max-heap then repeatedly extracts the maximum: O(n log n) worst case, in place, not stable.",
        "Comparison sorts cannot beat Ω(n log n) in the worst case. Non-comparison sorts can when keys are bounded: counting sort O(n + k) for integers in [0, k), radix sort O(d·(n + k)) digit by digit, and bucket sort for uniformly distributed values.",
        "A sort is stable if equal keys keep their relative order — essential when sorting by multiple keys in passes. Libraries: Java's Arrays.sort uses dual-pivot quicksort for primitives and TimSort (stable merge/insertion hybrid) for objects; C++ std::sort uses introsort (quicksort switching to heap sort, with insertion sort for small ranges) and std::stable_sort a merge sort.",
      ],
      usage: [
        "Use the library sort in real code; know the algorithms for interviews and exams.",
        "Insertion sort for tiny or nearly sorted arrays; merge sort when stability or linked lists matter.",
        "Counting/radix sort for large arrays of small integers (ages, grades, digits).",
        "Quickselect (partition-based) finds the k-th smallest element in O(n) average.",
      ],
      files: [
        file("java/Sorts.java", code`
import java.util.Arrays;
import java.util.concurrent.ThreadLocalRandom;

public class Sorts {
    static void insertionSort(int[] a) {                 // O(n^2), O(n) if nearly sorted, stable
        for (int i = 1; i < a.length; i++) {
            int key = a[i], j = i - 1;
            while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }   // shift larger elements right
            a[j + 1] = key;
        }
    }

    static void mergeSort(int[] a, int[] tmp, int lo, int hi) {   // sorts a[lo..hi), O(n log n), stable
        if (hi - lo < 2) return;
        int mid = (lo + hi) >>> 1;
        mergeSort(a, tmp, lo, mid);
        mergeSort(a, tmp, mid, hi);
        int i = lo, j = mid, k = lo;
        while (i < mid && j < hi) tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];   // <= keeps it stable
        while (i < mid) tmp[k++] = a[i++];
        while (j < hi) tmp[k++] = a[j++];
        System.arraycopy(tmp, lo, a, lo, hi - lo);
    }

    static void quickSort(int[] a, int lo, int hi) {     // sorts a[lo..hi], average O(n log n)
        if (lo >= hi) return;
        int p = partition(a, lo, hi);
        quickSort(a, lo, p - 1);
        quickSort(a, p + 1, hi);
    }

    // Lomuto partition with a random pivot to avoid the O(n^2) sorted-input case
    static int partition(int[] a, int lo, int hi) {
        swap(a, ThreadLocalRandom.current().nextInt(lo, hi + 1), hi);
        int pivot = a[hi], i = lo;
        for (int j = lo; j < hi; j++) if (a[j] < pivot) swap(a, i++, j);
        swap(a, i, hi);                                   // pivot lands in its final position
        return i;
    }

    static void countingSort(int[] a, int maxValue) {    // O(n + k) for values in [0, maxValue]
        int[] count = new int[maxValue + 1];
        for (int x : a) count[x]++;
        int k = 0;
        for (int v = 0; v <= maxValue; v++) while (count[v]-- > 0) a[k++] = v;
    }

    static void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }

    public static void main(String[] args) {
        int[] a = {38, 27, 43, 3, 9, 82, 10};
        int[] b = a.clone(), c = a.clone(), d = {4, 1, 3, 4, 0, 2, 1};
        insertionSort(a);
        mergeSort(b, new int[b.length], 0, b.length);
        quickSort(c, 0, c.length - 1);
        countingSort(d, 4);
        System.out.println(Arrays.toString(a) + "\n" + Arrays.toString(b) + "\n" + Arrays.toString(c) + "\n" + Arrays.toString(d));
    }
}`),
        file("cpp/heap_quickselect.cpp", code`
#include <iostream>
#include <random>
#include <utility>
#include <vector>

// Heap sort: build a max-heap, then move the max to the end repeatedly. O(n log n), in place.
void siftDown(std::vector<int>& a, int i, int n) {
    while (true) {
        int largest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && a[l] > a[largest]) largest = l;
        if (r < n && a[r] > a[largest]) largest = r;
        if (largest == i) return;
        std::swap(a[i], a[largest]);
        i = largest;
    }
}

void heapSort(std::vector<int>& a) {
    int n = (int)a.size();
    for (int i = n / 2 - 1; i >= 0; --i) siftDown(a, i, n);   // O(n) heap construction
    for (int end = n - 1; end > 0; --end) {
        std::swap(a[0], a[end]);
        siftDown(a, 0, end);
    }
}

// Quickselect: k-th smallest (0-based) in O(n) average
int quickselect(std::vector<int> a, int k) {
    std::mt19937 rng(42);
    int lo = 0, hi = (int)a.size() - 1;
    while (true) {
        std::swap(a[std::uniform_int_distribution<int>(lo, hi)(rng)], a[hi]);
        int pivot = a[hi], i = lo;
        for (int j = lo; j < hi; ++j) if (a[j] < pivot) std::swap(a[i++], a[j]);
        std::swap(a[i], a[hi]);
        if (i == k) return a[i];
        if (i < k) lo = i + 1; else hi = i - 1;           // recurse into one side only
    }
}

int main() {
    std::vector<int> v{12, 11, 13, 5, 6, 7};
    heapSort(v);
    for (int x : v) std::cout << x << ' ';
    std::cout << "\nmedian = " << quickselect({7, 10, 4, 3, 20, 15}, 2) << '\n';   // 3rd smallest = 7
}`),
        file("comparison.md", code`
| Algorithm      | Best       | Average    | Worst      | Space    | Stable |
|----------------|------------|------------|------------|----------|--------|
| Bubble         | O(n)       | O(n^2)     | O(n^2)     | O(1)     | Yes    |
| Selection      | O(n^2)     | O(n^2)     | O(n^2)     | O(1)     | No     |
| Insertion      | O(n)       | O(n^2)     | O(n^2)     | O(1)     | Yes    |
| Merge          | O(n log n) | O(n log n) | O(n log n) | O(n)     | Yes    |
| Quick          | O(n log n) | O(n log n) | O(n^2)     | O(log n) | No     |
| Heap           | O(n log n) | O(n log n) | O(n log n) | O(1)     | No     |
| Counting       | O(n + k)   | O(n + k)   | O(n + k)   | O(k)     | Yes*   |
* when implemented with prefix counts`),
      ],
      tips: [
        "Know one partition scheme by heart and trace it on paper for [3, 1, 2].",
        "Quick sort's recursion depth is O(log n) on average; recurse on the smaller side first to bound it.",
        "Merge sort is the standard answer for “count inversions” — count during the merge.",
        "Selection sort makes at most n − 1 swaps — useful when writes are expensive.",
      ],
      subjective: [
        qa("Compare merge sort and quick sort.", "Both are divide-and-conquer O(n log n) average algorithms. Merge sort splits the array evenly, does the work while merging, guarantees O(n log n) in all cases, is stable, but needs O(n) auxiliary space (except for linked lists); it suits external sorting and linked lists. Quick sort does the work while partitioning around a pivot, sorts in place with O(log n) stack space, has excellent cache behaviour and small constants, but degrades to O(n²) with bad pivots (mitigated by randomization/median-of-three/introsort) and is not stable. In practice quick sort is often faster for arrays in memory."),
        qa("What is a stable sort? Why does it matter?", "A sorting algorithm is stable if records with equal keys appear in the output in the same relative order as in the input. It matters when sorting by multiple criteria in successive passes (sort by name, then stably by department, giving department order with names alphabetical inside) and when equal elements carry other data that should keep its order. Stable: insertion, bubble, merge, counting (prefix version), TimSort. Unstable: selection, quick, heap."),
        qa("Why is the lower bound for comparison sorting Ω(n log n)?", "A comparison sort can be modelled as a binary decision tree where each internal node is a comparison and each leaf is one permutation of the input. To sort all inputs correctly the tree needs at least n! leaves. A binary tree with n! leaves has height at least log₂(n!), which by Stirling's approximation is Θ(n log n). The height is the worst-case number of comparisons, so any comparison sort needs Ω(n log n) comparisons in the worst case."),
      ],
      objective: [
        mcq("Worst-case time of quick sort:", ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], 1, "Consistently bad pivots."),
        mcq("Which sort is stable and guaranteed O(n log n)?", ["Quick sort", "Heap sort", "Merge sort", "Selection sort"], 2, "At the cost of O(n) memory."),
        mcq("Best sort for an almost sorted array:", ["Selection sort", "Insertion sort", "Heap sort", "Quick sort with first-element pivot"], 1, "Approaches O(n)."),
        mcq("Counting sort runs in:", ["O(n log n)", "O(n + k)", "O(n²)", "O(k log n)"], 1, "k is the range of key values."),
        mcq("C++ std::sort is typically implemented as:", ["Bubble sort", "Introsort", "Merge sort", "Radix sort"], 1, "Quicksort + heapsort fallback + insertion sort."),
      ],
    },
    {
      id: "binary-trees", module: "Trees", title: "Binary trees and traversals", level: "Intermediate", minutes: 22,
      summary: "Terminology, recursive and iterative DFS traversals, level-order BFS, height, diameter, lowest common ancestor and tree construction.",
      description: [
        "A tree is a connected acyclic hierarchy of nodes; a binary tree gives each node at most two children (left and right). Terms: root, parent, child, leaf, sibling, depth (edges from the root), height (longest path down to a leaf), subtree. A full binary tree has 0 or 2 children per node; a complete tree fills every level except possibly the last, from the left (how heaps are stored in arrays); a perfect tree has all leaves at the same depth (2^(h+1) − 1 nodes); a balanced tree keeps heights of subtrees close, giving O(log n) height.",
        "Depth-first traversals: preorder (node, left, right — copying/serializing a tree), inorder (left, node, right — sorted order for BSTs) and postorder (left, right, node — deleting a tree, evaluating expressions). They are naturally recursive and can be done iteratively with an explicit stack. Breadth-first (level-order) traversal uses a queue and processes the tree level by level (right side view, zigzag order, minimum depth).",
        "Many tree problems are a single postorder recursion returning information to the parent: height = 1 + max(left, right); diameter = max over nodes of left height + right height; balanced check; path sums; lowest common ancestor (LCA) — the node where p and q are found in different subtrees, or a node that is one of them. A tree can be reconstructed uniquely from preorder + inorder (or postorder + inorder) sequences.",
      ],
      usage: [
        "Hierarchies: file systems, organization charts, DOM, expression and syntax trees.",
        "Postorder recursion for any “compute something about every subtree” problem.",
        "Level-order BFS for per-level answers and shortest depth.",
        "Serialize/deserialize trees with preorder plus null markers.",
      ],
      files: [
        file("java/TreeTraversals.java", code`
import java.util.*;

public class TreeTraversals {
    static class Node {
        int val; Node left, right;
        Node(int val) { this.val = val; }
        Node(int val, Node left, Node right) { this.val = val; this.left = left; this.right = right; }
    }

    static void preorder(Node n, List<Integer> out) { if (n == null) return; out.add(n.val); preorder(n.left, out); preorder(n.right, out); }
    static void inorder(Node n, List<Integer> out) { if (n == null) return; inorder(n.left, out); out.add(n.val); inorder(n.right, out); }
    static void postorder(Node n, List<Integer> out) { if (n == null) return; postorder(n.left, out); postorder(n.right, out); out.add(n.val); }

    // Iterative inorder with an explicit stack
    static List<Integer> inorderIterative(Node root) {
        List<Integer> out = new ArrayList<>();
        Deque<Node> st = new ArrayDeque<>();
        Node cur = root;
        while (cur != null || !st.isEmpty()) {
            while (cur != null) { st.push(cur); cur = cur.left; }   // go as far left as possible
            cur = st.pop();
            out.add(cur.val);
            cur = cur.right;
        }
        return out;
    }

    // Level order (BFS), one list per level
    static List<List<Integer>> levels(Node root) {
        List<List<Integer>> out = new ArrayList<>();
        Queue<Node> q = new ArrayDeque<>();
        if (root != null) q.add(root);
        while (!q.isEmpty()) {
            int size = q.size();                       // nodes on the current level
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                Node n = q.poll();
                level.add(n.val);
                if (n.left != null) q.add(n.left);
                if (n.right != null) q.add(n.right);
            }
            out.add(level);
        }
        return out;
    }

    static int height(Node n) { return n == null ? 0 : 1 + Math.max(height(n.left), height(n.right)); }

    public static void main(String[] args) {
        //        1
        //      /   \
        //     2     3
        //    / \     \
        //   4   5     6
        Node root = new Node(1, new Node(2, new Node(4), new Node(5)), new Node(3, null, new Node(6)));
        List<Integer> pre = new ArrayList<>(), in = new ArrayList<>(), post = new ArrayList<>();
        preorder(root, pre); inorder(root, in); postorder(root, post);
        System.out.println("pre " + pre + " in " + in + " post " + post);   // [1,2,4,5,3,6] [4,2,5,1,3,6] [4,5,2,6,3,1]
        System.out.println(inorderIterative(root) + " levels " + levels(root) + " height " + height(root));
    }
}`),
        file("cpp/tree_problems.cpp", code`
#include <algorithm>
#include <iostream>
#include <unordered_map>
#include <vector>

struct Node {
    int val; Node* left = nullptr; Node* right = nullptr;
    explicit Node(int v) : val(v) { }
};

// Diameter: longest path (in edges) between any two nodes. One postorder pass, O(n).
int depthAndDiameter(Node* n, int& best) {
    if (!n) return 0;
    int l = depthAndDiameter(n->left, best), r = depthAndDiameter(n->right, best);
    best = std::max(best, l + r);              // path through n
    return 1 + std::max(l, r);                 // height returned to the parent
}

// Lowest common ancestor in a binary tree (not necessarily a BST)
Node* lca(Node* root, Node* p, Node* q) {
    if (!root || root == p || root == q) return root;
    Node* l = lca(root->left, p, q);
    Node* r = lca(root->right, p, q);
    if (l && r) return root;                   // p and q on different sides
    return l ? l : r;
}

// Build a tree from preorder + inorder in O(n) using an index map
Node* build(const std::vector<int>& pre, int& pi, int lo, int hi, const std::unordered_map<int, int>& pos) {
    if (lo > hi) return nullptr;
    Node* root = new Node(pre[pi++]);          // next preorder value is the subtree root
    int mid = pos.at(root->val);
    root->left = build(pre, pi, lo, mid - 1, pos);
    root->right = build(pre, pi, mid + 1, hi, pos);
    return root;
}

bool isBalanced(Node* n, int& h) {             // heights differ by at most 1 everywhere
    if (!n) { h = 0; return true; }
    int lh, rh;
    bool ok = isBalanced(n->left, lh) && isBalanced(n->right, rh) && std::abs(lh - rh) <= 1;
    h = 1 + std::max(lh, rh);
    return ok;
}

int main() {
    std::vector<int> pre{3, 9, 20, 15, 7}, in{9, 3, 15, 20, 7};
    std::unordered_map<int, int> pos;
    for (int i = 0; i < (int)in.size(); ++i) pos[in[i]] = i;
    int pi = 0;
    Node* root = build(pre, pi, 0, (int)in.size() - 1, pos);
    int diameter = 0;
    std::cout << "height " << depthAndDiameter(root, diameter) << ", diameter " << diameter << '\n';   // 3, 3
    std::cout << "LCA(15, 7) = " << lca(root, root->right->left, root->right->right)->val << '\n';     // 20
    int h;
    std::cout << "balanced: " << isBalanced(root, h) << '\n';
}`),
      ],
      tips: [
        "Inorder of a BST is sorted — the basis of many BST questions.",
        "BFS level size: snapshot q.size() before the inner loop.",
        "Return multiple values from recursion with a small class/struct or a reference parameter.",
        "Recursion depth equals tree height: a skewed tree of 10⁵ nodes may overflow the stack; go iterative.",
      ],
      subjective: [
        qa("Explain preorder, inorder and postorder traversals with an example.", "For the tree with root 1, left child 2 (children 4, 5) and right child 3 (right child 6): Preorder visits node, then left subtree, then right subtree: 1 2 4 5 3 6 — used to copy or serialize a tree. Inorder visits left, node, right: 4 2 5 1 3 6 — gives sorted order in a BST. Postorder visits left, right, node: 4 5 2 6 3 1 — used to delete trees or evaluate expression trees. Level order (BFS) visits by depth: 1 2 3 4 5 6. Each traversal is O(n) time and O(h) stack space."),
        qa("What are the properties of a complete binary tree and why are heaps stored as arrays?", "A complete binary tree has every level fully filled except possibly the last, which is filled from left to right. Its height is ⌊log₂ n⌋. Because there are no gaps, nodes can be stored level by level in an array: for index i (0-based), the left child is at 2i + 1, the right child at 2i + 2 and the parent at (i − 1)/2. No pointers are needed, memory is compact and cache-friendly, which is why binary heaps use this representation."),
      ],
      objective: [
        mcq("Which traversal of a BST yields sorted order?", ["Preorder", "Inorder", "Postorder", "Level order"], 1, "Left, node, right."),
        mcq("Level-order traversal uses a:", ["Stack", "Queue", "Heap", "Hash set"], 1, "Breadth-first."),
        mcq("Maximum number of nodes in a binary tree of height h (root at height 0):", ["2h", "2^h", "2^(h+1) − 1", "h²"], 2, "A perfect binary tree."),
        mcq("Which pair of traversals uniquely identifies a binary tree (distinct values)?", ["Preorder + postorder", "Inorder + preorder", "Only inorder", "Only level order"], 1, "Inorder is needed together with pre- or postorder."),
        mcq("In array representation (0-based), the left child of index i is at:", ["i + 1", "2i", "2i + 1", "i / 2"], 2, "Right child at 2i + 2."),
      ],
    },
    {
      id: "bst", module: "Trees", title: "Binary search trees and balanced trees", level: "Intermediate", minutes: 18,
      summary: "BST property, search/insert/delete, validation, k-th smallest, floor/ceiling, and why AVL and red–black trees exist.",
      description: [
        "A binary search tree keeps the invariant that every key in a node's left subtree is smaller than the node's key and every key in the right subtree is larger. Search, insert and delete follow one root-to-leaf path, so they cost O(h): O(log n) when the tree is balanced, but O(n) when keys arrive in sorted order and the tree degenerates into a linked list.",
        "Deletion has three cases: a leaf is simply removed; a node with one child is replaced by that child; a node with two children takes the value of its inorder successor (the minimum of the right subtree), which is then deleted from the right subtree.",
        "Validating a BST requires passing down allowed (min, max) ranges — checking only a node against its children is wrong. Other classic problems: k-th smallest element (inorder with a counter), floor/ceiling of a key, converting a sorted array to a balanced BST (pick the middle as root), and LCA in a BST (the first node whose value lies between p and q).",
        "Self-balancing BSTs keep height O(log n) automatically. AVL trees keep the heights of sibling subtrees within 1, rebalancing with rotations (LL, RR, LR, RL) — stricter balance, faster lookups. Red–black trees use node colours and looser rules, needing fewer rotations on updates; Java's TreeMap/TreeSet and C++ std::map/std::set use them. B-trees generalize the idea to wide nodes for disks and database indexes.",
      ],
      usage: [
        "Ordered maps and sets with range queries: TreeMap/std::map.",
        "Floor/ceiling, predecessor/successor lookups, leaderboards.",
        "Database indexes use B+ trees (the disk-friendly cousin).",
        "Implement a BST by hand only for learning; use library balanced trees in production.",
      ],
      files: [
        file("java/Bst.java", code`
public class Bst {
    static class Node { int key; Node left, right; Node(int k) { key = k; } }
    private Node root;

    public void insert(int key) { root = insert(root, key); }
    private Node insert(Node n, int key) {
        if (n == null) return new Node(key);
        if (key < n.key) n.left = insert(n.left, key);
        else if (key > n.key) n.right = insert(n.right, key);   // duplicates ignored
        return n;
    }

    public boolean contains(int key) {
        Node n = root;
        while (n != null) { if (key == n.key) return true; n = key < n.key ? n.left : n.right; }
        return false;
    }

    public void delete(int key) { root = delete(root, key); }
    private Node delete(Node n, int key) {
        if (n == null) return null;
        if (key < n.key) n.left = delete(n.left, key);
        else if (key > n.key) n.right = delete(n.right, key);
        else {
            if (n.left == null) return n.right;                  // 0 or 1 child
            if (n.right == null) return n.left;
            Node succ = n.right;                                  // 2 children: inorder successor
            while (succ.left != null) succ = succ.left;
            n.key = succ.key;
            n.right = delete(n.right, succ.key);
        }
        return n;
    }

    // Floor: largest key <= x
    public Integer floor(int x) {
        Node n = root; Integer best = null;
        while (n != null) {
            if (n.key == x) return x;
            if (n.key < x) { best = n.key; n = n.right; } else n = n.left;
        }
        return best;
    }

    // Validate using ranges, not just parent-child comparisons
    static boolean isValid(Node n, long lo, long hi) {
        if (n == null) return true;
        if (n.key <= lo || n.key >= hi) return false;
        return isValid(n.left, lo, n.key) && isValid(n.right, n.key, hi);
    }

    // k-th smallest via inorder traversal
    private int count;
    public int kthSmallest(int k) { count = 0; return kth(root, k).key; }
    private Node kth(Node n, int k) {
        if (n == null) return null;
        Node left = kth(n.left, k);
        if (left != null) return left;
        if (++count == k) return n;
        return kth(n.right, k);
    }

    public static void main(String[] args) {
        Bst t = new Bst();
        for (int k : new int[]{50, 30, 70, 20, 40, 60, 80}) t.insert(k);
        System.out.println(t.contains(60) + " floor(65)=" + t.floor(65) + " 3rd=" + t.kthSmallest(3));
        t.delete(30);                                             // two children
        System.out.println(t.contains(30) + " valid=" + isValid(t.root, Long.MIN_VALUE, Long.MAX_VALUE));
    }
}`),
        file("cpp/avl_rotations.cpp", code`
#include <algorithm>
#include <iostream>

// AVL tree insertion with rotations: height stays O(log n)
struct Node {
    int key, height = 1;
    Node* left = nullptr; Node* right = nullptr;
    explicit Node(int k) : key(k) { }
};

int h(Node* n) { return n ? n->height : 0; }
void update(Node* n) { n->height = 1 + std::max(h(n->left), h(n->right)); }
int balance(Node* n) { return h(n->left) - h(n->right); }

/*  Right rotation around y:
 *        y              x
 *       /              / \
 *      x      ->      a   y
 *     / \                /
 *    a   b              b
 */
Node* rotateRight(Node* y) {
    Node* x = y->left;
    y->left = x->right;               // b moves under y
    x->right = y;
    update(y); update(x);             // y is now lower: update it first
    return x;
}

Node* rotateLeft(Node* x) {
    Node* y = x->right;
    x->right = y->left;
    y->left = x;
    update(x); update(y);
    return y;
}

Node* insert(Node* n, int key) {
    if (!n) return new Node(key);
    if (key < n->key) n->left = insert(n->left, key);
    else if (key > n->key) n->right = insert(n->right, key);
    else return n;
    update(n);
    int b = balance(n);
    if (b > 1 && key < n->left->key) return rotateRight(n);                                    // LL
    if (b < -1 && key > n->right->key) return rotateLeft(n);                                   // RR
    if (b > 1 && key > n->left->key) { n->left = rotateLeft(n->left); return rotateRight(n); } // LR
    if (b < -1 && key < n->right->key) { n->right = rotateRight(n->right); return rotateLeft(n); } // RL
    return n;
}

void inorder(Node* n) { if (!n) return; inorder(n->left); std::cout << n->key << ' '; inorder(n->right); }

int main() {
    Node* root = nullptr;
    for (int k = 1; k <= 7; ++k) root = insert(root, k);   // sorted input: a plain BST would be a chain of height 7
    inorder(root);
    std::cout << "\nroot=" << root->key << " height=" << root->height << '\n';   // root=4 height=3
}`),
      ],
      tips: [
        "Validate with long bounds (or nullable bounds) so Integer.MIN_VALUE/MAX_VALUE keys work.",
        "Inserting sorted keys into a plain BST is the worst case — the reason balanced trees exist.",
        "Rotation questions: identify the case (LL, RR, LR, RL) from the path to the inserted node.",
        "In a BST, LCA is found iteratively in O(h) without recursion.",
      ],
      subjective: [
        qa("Explain deletion in a binary search tree.", "First search for the node. Case 1 — leaf: remove it by setting the parent's pointer to null. Case 2 — one child: link the parent directly to that child. Case 3 — two children: find the inorder successor (minimum node in the right subtree) or the inorder predecessor (maximum in the left subtree), copy its key into the node, then delete the successor from the right subtree, which falls into case 1 or 2 since the successor has no left child. Complexity O(h)."),
        qa("Why do we need balanced BSTs? Compare AVL and red–black trees.", "A plain BST's operations cost O(h), and h can reach n for sorted insertions, making them O(n). Balanced BSTs maintain h = O(log n). AVL trees require the height difference of each node's subtrees to be at most 1; they are more rigidly balanced (height ≤ ~1.44 log n), so lookups are slightly faster, but insertions/deletions may need more rotations. Red–black trees colour nodes with rules (no two consecutive reds, equal black height on all paths), guaranteeing height ≤ 2 log(n+1); they need at most 2 rotations per insertion and 3 per deletion, making updates cheaper — hence their use in TreeMap and std::map."),
      ],
      objective: [
        mcq("Worst-case search time in an unbalanced BST:", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 2, "A degenerate (skewed) tree."),
        mcq("When deleting a node with two children, it is replaced by its:", ["Parent", "Inorder successor (or predecessor)", "Left child always", "Root"], 1, "Preserves the BST property."),
        mcq("Java's TreeMap is implemented as a:", ["AVL tree", "Red–black tree", "B-tree", "Skip list"], 1, "Same as std::map in common C++ libraries."),
        mcq("Inserting 1, 2, 3 into an AVL tree triggers which rotation?", ["LL (right rotation)", "RR (left rotation)", "LR", "None"], 1, "Right-right imbalance at 1 → left rotation."),
        mcq("Checking only node.left.key < node.key < node.right.key at every node:", ["Correctly validates a BST", "Can accept invalid BSTs", "Is O(log n)", "Rejects all valid BSTs"], 1, "Ranges must be inherited from ancestors."),
      ],
    },
    {
      id: "heaps", module: "Trees", title: "Heaps and priority queues", level: "Intermediate", minutes: 18,
      summary: "Binary heap operations, heapify in O(n), top-k elements, merging k sorted lists and the two-heap running median.",
      description: [
        "A binary heap is a complete binary tree stored in an array that satisfies the heap property: in a min-heap every parent is ≤ its children (the minimum is at the root); in a max-heap every parent is ≥ its children. It supports peek in O(1), insert (append then sift up) and extract (move the last element to the root then sift down) in O(log n).",
        "Building a heap from n elements by sifting down from the last internal node to the root takes O(n), not O(n log n), because most nodes are near the bottom and move only a little. Heap sort uses this followed by n extractions.",
        "Priority queues are usually heaps: Java's PriorityQueue is a min-heap by default; C++'s std::priority_queue is a max-heap by default. Patterns: top-k largest elements with a min-heap of size k (O(n log k)); k-th largest; merge k sorted lists by repeatedly taking the smallest head (O(N log k)); running median with a max-heap for the lower half and a min-heap for the upper half; task scheduling; and Dijkstra's and Prim's algorithms.",
      ],
      usage: [
        "Top-k / k-th largest / k closest points → heap of size k.",
        "Repeatedly need the current minimum or maximum while inserting → priority queue.",
        "Merging k sorted streams (logs, lists, files) → min-heap of heads.",
        "Streaming median → two heaps balanced in size.",
      ],
      files: [
        file("java/HeapPatterns.java", code`
import java.util.*;

public class HeapPatterns {
    // Top-k largest with a min-heap of size k: O(n log k)
    static List<Integer> topK(int[] a, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int x : a) {
            minHeap.offer(x);
            if (minHeap.size() > k) minHeap.poll();          // drop the smallest of the k+1
        }
        List<Integer> out = new ArrayList<>(minHeap);
        out.sort(Comparator.reverseOrder());
        return out;
    }

    // Merge k sorted arrays: O(N log k)
    static List<Integer> mergeK(int[][] arrays) {
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(e -> e[0]));   // {value, array, index}
        for (int i = 0; i < arrays.length; i++) if (arrays[i].length > 0) pq.add(new int[]{arrays[i][0], i, 0});
        List<Integer> out = new ArrayList<>();
        while (!pq.isEmpty()) {
            int[] top = pq.poll();
            out.add(top[0]);
            int next = top[2] + 1;
            if (next < arrays[top[1]].length) pq.add(new int[]{arrays[top[1]][next], top[1], next});
        }
        return out;
    }

    // Running median with two heaps
    static class MedianFinder {
        private final PriorityQueue<Integer> low = new PriorityQueue<>(Comparator.reverseOrder()); // max-heap
        private final PriorityQueue<Integer> high = new PriorityQueue<>();                          // min-heap
        void add(int x) {
            low.offer(x);
            high.offer(low.poll());                          // keep every low <= every high
            if (high.size() > low.size()) low.offer(high.poll());   // low may hold one extra
        }
        double median() { return low.size() > high.size() ? low.peek() : (low.peek() + high.peek()) / 2.0; }
    }

    public static void main(String[] args) {
        System.out.println(topK(new int[]{3, 2, 1, 5, 6, 4}, 2));                       // [6, 5]
        System.out.println(mergeK(new int[][]{{1, 4, 5}, {1, 3, 4}, {2, 6}}));
        MedianFinder mf = new MedianFinder();
        for (int x : new int[]{5, 15, 1, 3}) { mf.add(x); System.out.print(mf.median() + " "); }   // 5 10 5 4
        System.out.println();
    }
}`),
        file("cpp/min_heap.cpp", code`
#include <iostream>
#include <stdexcept>
#include <utility>
#include <vector>

// A min-heap from scratch, array-backed
class MinHeap {
    std::vector<int> a_;
    void siftUp(int i) {
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (a_[parent] <= a_[i]) break;
            std::swap(a_[parent], a_[i]);
            i = parent;
        }
    }
    void siftDown(int i) {
        int n = (int)a_.size();
        while (true) {
            int smallest = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && a_[l] < a_[smallest]) smallest = l;
            if (r < n && a_[r] < a_[smallest]) smallest = r;
            if (smallest == i) return;
            std::swap(a_[i], a_[smallest]);
            i = smallest;
        }
    }
public:
    MinHeap() = default;
    explicit MinHeap(std::vector<int> values) : a_(std::move(values)) {    // heapify in O(n)
        for (int i = (int)a_.size() / 2 - 1; i >= 0; --i) siftDown(i);
    }
    void push(int x) { a_.push_back(x); siftUp((int)a_.size() - 1); }       // O(log n)
    int top() const { if (a_.empty()) throw std::out_of_range("empty"); return a_[0]; }
    int pop() {                                                              // O(log n)
        int root = top();
        a_[0] = a_.back();
        a_.pop_back();
        if (!a_.empty()) siftDown(0);
        return root;
    }
    bool empty() const { return a_.empty(); }
};

int main() {
    MinHeap h({9, 4, 7, 1, 8, 2});
    h.push(3);
    while (!h.empty()) std::cout << h.pop() << ' ';   // 1 2 3 4 7 8 9
    std::cout << '\n';
}`),
      ],
      tips: [
        "Top-k largest → min-heap of size k (counter-intuitive but correct); top-k smallest → max-heap of size k.",
        "Java PriorityQueue iteration order is not sorted — only poll() returns elements in order.",
        "Avoid (a, b) -> a - b comparators for large ints (overflow); use Integer.compare.",
        "For Dijkstra with lazy deletion, skip stale entries when popped instead of decreasing keys.",
      ],
      subjective: [
        qa("Explain insertion and deletion in a binary heap.", "Insertion: append the new element at the end of the array (the next free position of the complete tree), then sift it up — while it is smaller than its parent (in a min-heap), swap them. Deletion of the root (extract-min): save the root, move the last element to the root, shrink the array, then sift it down — swap with the smaller child while it is larger than that child. Both operations follow one root-to-leaf path, so they take O(log n)."),
        qa("Why does building a heap take O(n)?", "Bottom-up heapify calls siftDown for every internal node, from the last one up to the root. A node at height h needs at most h swaps. There are about n/2^(h+1) nodes at height h, so total work is Σ (n/2^(h+1))·h = n·Σ h/2^(h+1), and the series Σ h/2^h converges to 2. Hence the total is O(n), even though a single siftDown can cost O(log n)."),
      ],
      objective: [
        mcq("Time to find the minimum in a min-heap:", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 0, "It is at the root."),
        mcq("Building a heap from n elements bottom-up takes:", ["O(n)", "O(n log n)", "O(log n)", "O(n²)"], 0, "A classic result."),
        mcq("To find the k largest elements efficiently, keep a:", ["Max-heap of all elements", "Min-heap of size k", "Sorted array", "Stack"], 1, "O(n log k)."),
        mcq("Java's PriorityQueue by default is a:", ["Max-heap", "Min-heap", "Balanced BST", "Stack"], 1, "C++ priority_queue defaults to a max-heap."),
      ],
    },
    {
      id: "tries", module: "Trees", title: "Tries (prefix trees)", level: "Intermediate", minutes: 14,
      summary: "Insert and search in O(word length), prefix queries, autocomplete, word search and XOR maximization with a binary trie.",
      description: [
        "A trie stores strings character by character along paths from the root; each node has children for the next characters and a flag marking the end of a word. Insert, search and startsWith run in O(L) for a word of length L, independent of how many words are stored, and all words sharing a prefix share the nodes for it.",
        "Children are stored in a fixed array (26 entries for lowercase letters — fastest) or a hash map (any alphabet — less memory when sparse). Storing a count of words passing through each node supports “how many words start with this prefix”.",
        "Uses: autocomplete and search suggestions, spell checking, IP routing (longest prefix match), word games (Boggle/word search II, where a trie of dictionary words prunes the grid DFS) and, with bits instead of characters, the maximum XOR of two numbers in O(n × 32).",
      ],
      usage: [
        "Many prefix queries over a fixed dictionary → trie.",
        "Grid word search for many words at once → trie + DFS backtracking.",
        "Maximum XOR pair → binary trie on bits.",
        "Single lookups only → a hash set is simpler.",
      ],
      files: [
        file("java/Trie.java", code`
import java.util.*;

public class Trie {
    private static class Node {
        Node[] next = new Node[26];
        boolean word;
        int prefixCount;                       // words passing through this node
    }
    private final Node root = new Node();

    public void insert(String w) {
        Node n = root;
        for (char c : w.toCharArray()) {
            int i = c - 'a';
            if (n.next[i] == null) n.next[i] = new Node();
            n = n.next[i];
            n.prefixCount++;
        }
        n.word = true;
    }

    private Node walk(String s) {
        Node n = root;
        for (char c : s.toCharArray()) { n = n.next[c - 'a']; if (n == null) return null; }
        return n;
    }

    public boolean contains(String w) { Node n = walk(w); return n != null && n.word; }
    public int countPrefix(String p) { Node n = walk(p); return n == null ? 0 : n.prefixCount; }

    // Autocomplete: up to 'limit' words with the given prefix, in alphabetical order
    public List<String> suggest(String prefix, int limit) {
        List<String> out = new ArrayList<>();
        Node n = walk(prefix);
        if (n != null) collect(n, new StringBuilder(prefix), out, limit);
        return out;
    }
    private void collect(Node n, StringBuilder sb, List<String> out, int limit) {
        if (out.size() >= limit) return;
        if (n.word) out.add(sb.toString());
        for (int i = 0; i < 26; i++) if (n.next[i] != null) {
            sb.append((char) ('a' + i));
            collect(n.next[i], sb, out, limit);
            sb.deleteCharAt(sb.length() - 1);
        }
    }

    public static void main(String[] args) {
        Trie t = new Trie();
        for (String w : List.of("java", "javascript", "jar", "jvm", "kotlin", "jazz")) t.insert(w);
        System.out.println(t.contains("jar") + " " + t.contains("ja") + " " + t.countPrefix("ja"));   // true false 4
        System.out.println(t.suggest("jav", 5));                                                     // [java, javascript]
    }
}`),
        file("cpp/xor_trie.cpp", code`
#include <array>
#include <iostream>
#include <memory>
#include <vector>

// Maximum XOR of any two numbers using a binary trie over 31 bits: O(n * 31)
class BitTrie {
    struct Node { std::array<std::unique_ptr<Node>, 2> child; };
    Node root_;
public:
    void insert(int x) {
        Node* n = &root_;
        for (int b = 30; b >= 0; --b) {
            int bit = (x >> b) & 1;
            if (!n->child[bit]) n->child[bit] = std::make_unique<Node>();
            n = n->child[bit].get();
        }
    }
    int bestXor(int x) const {                        // greedily take the opposite bit when possible
        const Node* n = &root_;
        int result = 0;
        for (int b = 30; b >= 0; --b) {
            int want = 1 - ((x >> b) & 1);
            if (n->child[want]) { result |= 1 << b; n = n->child[want].get(); }
            else n = n->child[1 - want].get();
        }
        return result;
    }
};

int main() {
    std::vector<int> nums{3, 10, 5, 25, 2, 8};
    BitTrie t;
    for (int x : nums) t.insert(x);
    int best = 0;
    for (int x : nums) best = std::max(best, t.bestXor(x));
    std::cout << best << '\n';                        // 28 (5 ^ 25)
}`),
      ],
      tips: [
        "Memory is the trie's cost: 26 pointers per node add up — use maps for sparse alphabets.",
        "Mark the end of word separately: “ja” being a prefix does not mean it is a word.",
        "For Word Search II, delete found words from the trie to avoid duplicates and speed up pruning.",
        "Compressed tries (radix trees) merge single-child chains to save space.",
      ],
      subjective: [
        qa("What is a trie? Compare it with a hash set for storing words.", "A trie is a tree where each edge represents a character and each node represents the prefix formed by the path from the root; nodes are flagged when a complete word ends there. Insert and lookup cost O(L) for word length L. Compared with a hash set: both give fast exact lookups, but a trie also answers prefix queries (all words starting with “ja”, count of such words, autocomplete, longest common prefix) efficiently and returns words in lexicographic order, while a hash set cannot. Tries often use more memory because of per-node child pointers."),
      ],
      objective: [
        mcq("Time to search a word of length L in a trie with n words:", ["O(n)", "O(L)", "O(log n)", "O(n·L)"], 1, "Independent of n."),
        mcq("Which operation is a trie especially good at compared with a hash table?", ["Exact lookup", "Prefix search", "Deletion", "Random access"], 1, "Prefixes share paths."),
        mcq("The “end of word” flag is needed because:", ["Nodes are reused", "A prefix of a word may not itself be a word", "Children are arrays", "Tries are balanced"], 1, "e.g. “jav” in a trie containing “java”."),
      ],
    },
    {
      id: "graphs-bfs-dfs", module: "Graphs", title: "Graphs: representation, BFS, DFS and connectivity", level: "Intermediate", minutes: 22,
      summary: "Adjacency lists and matrices, BFS shortest paths in unweighted graphs, DFS, connected components, cycle detection, grids and bipartite checks.",
      description: [
        "A graph G = (V, E) has vertices and edges, which may be directed or undirected and weighted or unweighted. An adjacency list (list of neighbours per vertex) uses O(V + E) space and suits sparse graphs; an adjacency matrix uses O(V²) space but answers “is there an edge u–v?” in O(1) — good for dense graphs. Grids are implicit graphs where each cell connects to its 4 (or 8) neighbours.",
        "Breadth-first search explores in layers from a source using a queue, marking vertices visited when they are enqueued. In an unweighted graph it finds shortest paths (fewest edges). Multi-source BFS starts from several sources at once (rotting oranges, distance to nearest exit). Depth-first search goes as deep as possible before backtracking, recursively or with a stack; it is the basis for connected components, cycle detection, topological sort, bridges and articulation points. Both run in O(V + E).",
        "Cycle detection: in an undirected graph, a visited neighbour that is not the parent indicates a cycle (or use union-find); in a directed graph, a back edge to a vertex currently on the recursion stack (colour GRAY in the white/gray/black scheme) indicates a cycle. A graph is bipartite if it can be 2-coloured so every edge joins different colours — check with BFS/DFS colouring; it fails exactly when there is an odd cycle.",
      ],
      usage: [
        "Shortest path with equal edge costs (moves in a maze, word ladder, social degrees) → BFS.",
        "Counting islands/regions/friend circles → DFS/BFS or union-find.",
        "Dependency cycles → directed DFS with colours.",
        "Two-group assignments (teams, matching) → bipartite check.",
      ],
      files: [
        file("java/GraphTraversal.java", code`
import java.util.*;

public class GraphTraversal {
    // Adjacency list for an undirected graph
    static List<List<Integer>> graph(int n, int[][] edges) {
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] e : edges) { g.get(e[0]).add(e[1]); g.get(e[1]).add(e[0]); }
        return g;
    }

    // BFS shortest distances (edges) from src; -1 = unreachable
    static int[] bfs(List<List<Integer>> g, int src) {
        int[] dist = new int[g.size()];
        Arrays.fill(dist, -1);
        Queue<Integer> q = new ArrayDeque<>();
        dist[src] = 0; q.add(src);
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int v : g.get(u)) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.add(v); }   // mark when enqueued
        }
        return dist;
    }

    // Connected components with iterative DFS
    static int components(List<List<Integer>> g) {
        boolean[] seen = new boolean[g.size()];
        int count = 0;
        for (int s = 0; s < g.size(); s++) {
            if (seen[s]) continue;
            count++;
            Deque<Integer> st = new ArrayDeque<>(List.of(s));
            seen[s] = true;
            while (!st.isEmpty()) for (int v : g.get(st.pop())) if (!seen[v]) { seen[v] = true; st.push(v); }
        }
        return count;
    }

    // Number of islands in a grid ('1' = land), DFS flood fill
    static int islands(char[][] grid) {
        int count = 0;
        for (int r = 0; r < grid.length; r++)
            for (int c = 0; c < grid[0].length; c++)
                if (grid[r][c] == '1') { count++; sink(grid, r, c); }
        return count;
    }
    static void sink(char[][] g, int r, int c) {
        if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;
        g[r][c] = '0';                                        // mark visited
        sink(g, r + 1, c); sink(g, r - 1, c); sink(g, r, c + 1); sink(g, r, c - 1);
    }

    // Bipartite check by BFS 2-colouring
    static boolean bipartite(List<List<Integer>> g) {
        int[] color = new int[g.size()];                       // 0 = uncoloured, 1 / -1 = sides
        for (int s = 0; s < g.size(); s++) {
            if (color[s] != 0) continue;
            Queue<Integer> q = new ArrayDeque<>(List.of(s));
            color[s] = 1;
            while (!q.isEmpty()) {
                int u = q.poll();
                for (int v : g.get(u)) {
                    if (color[v] == color[u]) return false;      // same side: odd cycle
                    if (color[v] == 0) { color[v] = -color[u]; q.add(v); }
                }
            }
        }
        return true;
    }

    public static void main(String[] args) {
        List<List<Integer>> g = graph(7, new int[][]{{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}, {5, 6}});
        System.out.println(Arrays.toString(bfs(g, 0)) + " components=" + components(g) + " bipartite=" + bipartite(g));
        char[][] grid = {"11000".toCharArray(), "11000".toCharArray(), "00100".toCharArray(), "00011".toCharArray()};
        System.out.println("islands=" + islands(grid));        // 3
    }
}`),
        file("cpp/directed_cycle.cpp", code`
#include <iostream>
#include <vector>

// Directed cycle detection with white/gray/black colouring, O(V + E)
enum Color { WHITE, GRAY, BLACK };

bool dfsCycle(int u, const std::vector<std::vector<int>>& g, std::vector<Color>& color) {
    color[u] = GRAY;                                    // on the current recursion path
    for (int v : g[u]) {
        if (color[v] == GRAY) return true;              // back edge: cycle
        if (color[v] == WHITE && dfsCycle(v, g, color)) return true;
    }
    color[u] = BLACK;                                   // fully explored
    return false;
}

bool hasCycle(const std::vector<std::vector<int>>& g) {
    std::vector<Color> color(g.size(), WHITE);
    for (int u = 0; u < (int)g.size(); ++u)
        if (color[u] == WHITE && dfsCycle(u, g, color)) return true;
    return false;
}

// Multi-source BFS on a grid: minutes until all oranges rot (2 = rotten, 1 = fresh)
int orangesRotting(std::vector<std::vector<int>> grid) {
    int rows = (int)grid.size(), cols = (int)grid[0].size(), fresh = 0, minutes = 0;
    std::vector<std::pair<int, int>> frontier;
    for (int r = 0; r < rows; ++r) for (int c = 0; c < cols; ++c) {
        if (grid[r][c] == 2) frontier.push_back({r, c});
        if (grid[r][c] == 1) ++fresh;
    }
    const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!frontier.empty() && fresh > 0) {
        std::vector<std::pair<int, int>> next;
        for (auto [r, c] : frontier)
            for (int d = 0; d < 4; ++d) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] != 1) continue;
                grid[nr][nc] = 2; --fresh; next.push_back({nr, nc});
            }
        frontier = std::move(next);
        ++minutes;
    }
    return fresh == 0 ? minutes : -1;
}

int main() {
    std::vector<std::vector<int>> dag{{1}, {2}, {}}, cyclic{{1}, {2}, {0}};
    std::cout << hasCycle(dag) << ' ' << hasCycle(cyclic) << '\n';                 // 0 1
    std::cout << orangesRotting({{2, 1, 1}, {1, 1, 0}, {0, 1, 1}}) << '\n';         // 4
}`),
      ],
      tips: [
        "Mark nodes visited when enqueuing in BFS, not when dequeuing — otherwise nodes are queued many times.",
        "BFS gives shortest paths only when all edges have equal weight; use Dijkstra or 0-1 BFS otherwise.",
        "Recursive DFS on large grids (10⁶ cells) can overflow the stack — use an explicit stack.",
        "For directed graphs, a visited (BLACK) neighbour is not a cycle; only GRAY ones are.",
      ],
      subjective: [
        qa("Compare BFS and DFS.", "BFS explores the graph level by level from the source using a queue; it finds shortest paths in unweighted graphs, uses memory proportional to the widest level, and is used for shortest paths, level order and multi-source spreading. DFS explores as deep as possible along each branch before backtracking using recursion or a stack; it uses memory proportional to the depth, and is used for connectivity, cycle detection, topological sort, strongly connected components, path existence and backtracking. Both are O(V + E) with adjacency lists."),
        qa("Compare adjacency matrix and adjacency list representations.", "Adjacency matrix: V×V array; O(V²) space regardless of edges; O(1) edge lookup; iterating neighbours costs O(V); good for dense graphs and Floyd–Warshall. Adjacency list: an array of neighbour lists; O(V + E) space; edge lookup O(degree); iterating neighbours costs O(degree); good for sparse graphs, which most real graphs are, and for BFS/DFS/Dijkstra in O(V + E)-style bounds."),
      ],
      objective: [
        mcq("Shortest path in an unweighted graph is found by:", ["DFS", "BFS", "Prim's algorithm", "Binary search"], 1, "Layers correspond to distances."),
        mcq("Time complexity of BFS with adjacency lists:", ["O(V)", "O(E)", "O(V + E)", "O(V·E)"], 2, "Each vertex and edge processed once."),
        mcq("Space of an adjacency matrix:", ["O(V)", "O(E)", "O(V + E)", "O(V²)"], 3, "One cell per vertex pair."),
        mcq("A graph is bipartite if and only if it has no:", ["Even cycle", "Odd cycle", "Self loops", "Leaves"], 1, "Odd cycles cannot be 2-coloured."),
        mcq("In directed DFS, an edge to a GRAY vertex indicates:", ["A tree edge", "A cross edge", "A back edge (cycle)", "Nothing"], 2, "The vertex is on the current path."),
      ],
    },
    {
      id: "shortest-paths-topo", module: "Graphs", title: "Topological sort and shortest paths: Dijkstra, Bellman–Ford, Floyd–Warshall", level: "Advanced", minutes: 24,
      summary: "Kahn's algorithm and DFS ordering for DAGs, Dijkstra with a priority queue, negative edges with Bellman–Ford, and all-pairs Floyd–Warshall.",
      description: [
        "A topological order of a directed acyclic graph (DAG) lists vertices so that every edge goes from earlier to later — the order to take courses, build modules or run tasks. Kahn's algorithm repeatedly removes vertices with in-degree 0 using a queue; if not all vertices are removed, the graph has a cycle. Alternatively, record vertices in reverse DFS finishing order. Both are O(V + E).",
        "Dijkstra's algorithm finds single-source shortest paths when all edge weights are non-negative. It keeps tentative distances, repeatedly settles the unsettled vertex with the smallest distance (a min-heap), and relaxes its outgoing edges: if dist[u] + w < dist[v], update dist[v]. With a binary heap it runs in O((V + E) log V). It fails with negative edges because a settled vertex could later get a shorter path.",
        "Bellman–Ford relaxes all edges V − 1 times, handling negative weights in O(V·E); a further improvement on the V-th pass reveals a negative cycle reachable from the source. On DAGs, relaxing edges in topological order gives shortest (or longest) paths in O(V + E). Floyd–Warshall computes all-pairs shortest paths in O(V³) with dynamic programming over intermediate vertices k: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]). 0-1 BFS with a deque handles edge weights of 0 and 1 in O(V + E).",
      ],
      usage: [
        "Course schedules, build order, task dependencies → topological sort.",
        "Road networks, network latency, cheapest routes with non-negative costs → Dijkstra.",
        "Currency arbitrage and graphs with negative edges → Bellman–Ford.",
        "Small dense graphs with all-pairs queries → Floyd–Warshall.",
      ],
      files: [
        file("java/TopoAndDijkstra.java", code`
import java.util.*;

public class TopoAndDijkstra {
    // Kahn's algorithm: returns an order, or an empty list if there is a cycle
    static List<Integer> topoSort(int n, int[][] edges) {
        List<List<Integer>> g = new ArrayList<>();
        int[] indeg = new int[n];
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] e : edges) { g.get(e[0]).add(e[1]); indeg[e[1]]++; }
        Queue<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.add(i);
        List<Integer> order = new ArrayList<>();
        while (!q.isEmpty()) {
            int u = q.poll();
            order.add(u);
            for (int v : g.get(u)) if (--indeg[v] == 0) q.add(v);
        }
        return order.size() == n ? order : List.of();      // leftover vertices lie on a cycle
    }

    record Edge(int to, int w) { }

    // Dijkstra with a min-heap and lazy deletion: O((V + E) log V)
    static long[] dijkstra(List<List<Edge>> g, int src) {
        long[] dist = new long[g.size()];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[src] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[1]));   // {vertex, dist}
        pq.add(new long[]{src, 0});
        while (!pq.isEmpty()) {
            long[] top = pq.poll();
            int u = (int) top[0];
            if (top[1] > dist[u]) continue;                  // stale entry
            for (Edge e : g.get(u)) {
                long nd = dist[u] + e.w();
                if (nd < dist[e.to()]) { dist[e.to()] = nd; pq.add(new long[]{e.to(), nd}); }   // relax
            }
        }
        return dist;
    }

    public static void main(String[] args) {
        // Courses: 0 -> 1 -> 3, 0 -> 2 -> 3
        System.out.println(topoSort(4, new int[][]{{0, 1}, {0, 2}, {1, 3}, {2, 3}}));     // [0, 1, 2, 3]
        System.out.println(topoSort(2, new int[][]{{0, 1}, {1, 0}}));                     // [] (cycle)

        int n = 5;
        List<List<Edge>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        int[][] roads = {{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 1}, {2, 3, 5}, {3, 4, 3}};
        for (int[] r : roads) { g.get(r[0]).add(new Edge(r[1], r[2])); g.get(r[1]).add(new Edge(r[0], r[2])); }
        System.out.println(Arrays.toString(dijkstra(g, 0)));                             // [0, 3, 1, 4, 7]
    }
}`),
        file("cpp/bellman_floyd.cpp", code`
#include <algorithm>
#include <iostream>
#include <limits>
#include <vector>

const long long INF = std::numeric_limits<long long>::max() / 4;
struct Edge { int u, v; long long w; };

// Bellman-Ford: handles negative edges, detects negative cycles. O(V * E)
bool bellmanFord(int n, const std::vector<Edge>& edges, int src, std::vector<long long>& dist) {
    dist.assign(n, INF);
    dist[src] = 0;
    for (int i = 0; i < n - 1; ++i)                      // V - 1 rounds of relaxation
        for (const auto& e : edges)
            if (dist[e.u] != INF && dist[e.u] + e.w < dist[e.v]) dist[e.v] = dist[e.u] + e.w;
    for (const auto& e : edges)                          // one more round: any improvement = negative cycle
        if (dist[e.u] != INF && dist[e.u] + e.w < dist[e.v]) return false;
    return true;
}

// Floyd-Warshall: all-pairs shortest paths. O(V^3)
std::vector<std::vector<long long>> floyd(std::vector<std::vector<long long>> d) {
    int n = (int)d.size();
    for (int k = 0; k < n; ++k)                          // allow vertex k as an intermediate
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                if (d[i][k] < INF && d[k][j] < INF) d[i][j] = std::min(d[i][j], d[i][k] + d[k][j]);
    return d;
}

int main() {
    std::vector<Edge> edges{{0, 1, 4}, {0, 2, 5}, {1, 2, -3}, {2, 3, 4}, {3, 1, 2}};
    std::vector<long long> dist;
    if (bellmanFord(4, edges, 0, dist)) for (long long d : dist) std::cout << d << ' ';   // 0 4 1 5
    std::cout << '\n';

    std::vector<std::vector<long long>> w{{0, 3, INF, 7}, {8, 0, 2, INF}, {5, INF, 0, 1}, {2, INF, INF, 0}};
    for (auto& row : floyd(w)) { for (long long x : row) std::cout << x << ' '; std::cout << '\n'; }
}`),
      ],
      tips: [
        "Dijkstra with negative edges gives wrong answers silently — check the constraints.",
        "Use long distances and a safe INF (max/4) to avoid overflow when adding weights.",
        "Topological order is not unique; Kahn's algorithm with a min-heap gives the lexicographically smallest one.",
        "Floyd–Warshall's k loop must be the outermost loop.",
      ],
      subjective: [
        qa("Explain Dijkstra's algorithm and its limitation.", "Initialize dist[src] = 0 and all other distances to infinity; push src into a min-priority queue. Repeatedly extract the vertex u with the smallest tentative distance (skipping stale entries); its distance is now final. For each edge u → v with weight w, relax it: if dist[u] + w < dist[v], set dist[v] = dist[u] + w and push v. With a binary heap the complexity is O((V + E) log V). Limitation: all edge weights must be non-negative — with a negative edge, a vertex already finalized could later be reached more cheaply, so the greedy choice is no longer safe; use Bellman–Ford instead."),
        qa("Describe Kahn's algorithm for topological sorting.", "Compute the in-degree of every vertex. Put all vertices with in-degree 0 into a queue. While the queue is not empty: remove a vertex u, append it to the output, and for each edge u → v decrement in-degree[v]; if it becomes 0, enqueue v. If the output contains all V vertices, it is a valid topological order; otherwise the remaining vertices are part of a cycle, so no topological order exists. Time O(V + E)."),
        qa("Compare Dijkstra, Bellman–Ford and Floyd–Warshall.", "Dijkstra: single source, non-negative weights, greedy with a priority queue, O((V + E) log V). Bellman–Ford: single source, allows negative weights, detects negative cycles, dynamic relaxation of all edges V − 1 times, O(V·E). Floyd–Warshall: all pairs, allows negative edges (no negative cycles), dynamic programming over intermediate vertices, O(V³) time and O(V²) space, simple to implement for small V."),
      ],
      objective: [
        mcq("Dijkstra's algorithm fails with:", ["Cycles", "Negative edge weights", "Undirected graphs", "Disconnected graphs"], 1, "Use Bellman–Ford."),
        mcq("Topological sorting is possible only for:", ["Undirected graphs", "Directed acyclic graphs", "Complete graphs", "Trees only"], 1, "A cycle has no valid order."),
        mcq("Time complexity of Floyd–Warshall:", ["O(V²)", "O(V³)", "O(E log V)", "O(V·E)"], 1, "Three nested loops over V."),
        mcq("How many relaxation rounds does Bellman–Ford perform before the negative-cycle check?", ["1", "log V", "V − 1", "E"], 2, "Shortest paths have at most V − 1 edges."),
        mcq("In Kahn's algorithm, which vertices start in the queue?", ["Highest out-degree", "In-degree zero", "Leaves", "Random vertices"], 1, "They have no prerequisites."),
      ],
    },
    {
      id: "union-find-mst", module: "Graphs", title: "Union-Find and minimum spanning trees", level: "Advanced", minutes: 18,
      summary: "Disjoint set union with path compression and union by rank, Kruskal's and Prim's algorithms for MSTs.",
      description: [
        "Union-Find (Disjoint Set Union, DSU) maintains a partition of elements into sets with two operations: find(x) returns the representative of x's set, and union(a, b) merges two sets. Each set is a tree of parent pointers. Path compression (point nodes directly at the root during find) and union by rank/size (attach the smaller tree under the larger) together give an amortized cost of O(α(n)) per operation — effectively constant (α is the inverse Ackermann function).",
        "Uses: counting connected components as edges arrive, detecting cycles in undirected graphs (an edge whose endpoints already share a root closes a cycle), grouping accounts or synonyms, percolation, and Kruskal's algorithm.",
        "A minimum spanning tree of a connected, weighted, undirected graph connects all V vertices with V − 1 edges of minimum total weight. Kruskal's algorithm sorts edges by weight and adds each edge that does not form a cycle (checked with DSU): O(E log E). Prim's algorithm grows the tree from a start vertex, always adding the cheapest edge leaving the tree (min-heap): O(E log V). Both rely on the cut property: the lightest edge crossing any cut belongs to some MST.",
      ],
      usage: [
        "Dynamic connectivity — “are these two in the same group?” after many merges → DSU.",
        "Network design: cheapest way to connect cities, offices or circuit pins → MST.",
        "Clustering: remove the k − 1 heaviest MST edges to form k clusters.",
        "Cycle detection in undirected graphs while adding edges → DSU.",
      ],
      files: [
        file("java/UnionFind.java", code`
import java.util.*;

public class UnionFind {
    private final int[] parent, size;
    private int components;

    public UnionFind(int n) {
        parent = new int[n]; size = new int[n]; components = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }

    public int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];       // path halving (a form of path compression)
            x = parent[x];
        }
        return x;
    }

    public boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;              // already connected: this edge would form a cycle
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;                         // union by size
        size[ra] += size[rb];
        components--;
        return true;
    }

    public int components() { return components; }

    // Kruskal's MST: sort edges, add those that join different components. O(E log E)
    static long kruskal(int n, int[][] edges, List<int[]> chosen) {
        Arrays.sort(edges, Comparator.comparingInt(e -> e[2]));
        UnionFind uf = new UnionFind(n);
        long total = 0;
        for (int[] e : edges)
            if (uf.union(e[0], e[1])) { total += e[2]; chosen.add(e); if (chosen.size() == n - 1) break; }
        return total;
    }

    public static void main(String[] args) {
        UnionFind uf = new UnionFind(6);
        uf.union(0, 1); uf.union(1, 2); uf.union(3, 4);
        System.out.println(uf.components() + " " + (uf.find(0) == uf.find(2)) + " " + uf.union(2, 0));   // 3 true false

        int[][] edges = {{0, 1, 7}, {0, 3, 5}, {1, 2, 8}, {1, 3, 9}, {1, 4, 7}, {2, 4, 5}, {3, 4, 15}, {3, 5, 6}, {4, 5, 8}, {4, 6, 9}, {5, 6, 11}};
        List<int[]> mst = new ArrayList<>();
        System.out.println("MST weight " + kruskal(7, edges, mst));        // 39
        mst.forEach(e -> System.out.print(e[0] + "-" + e[1] + "(" + e[2] + ") "));
        System.out.println();
    }
}`),
        file("cpp/prim.cpp", code`
#include <functional>
#include <iostream>
#include <queue>
#include <vector>

// Prim's MST with a min-heap: O(E log V)
long long prim(int n, const std::vector<std::vector<std::pair<int, int>>>& g) {   // g[u] = {v, w}
    std::vector<bool> inTree(n, false);
    using Item = std::pair<int, int>;                                                  // {weight, vertex}
    std::priority_queue<Item, std::vector<Item>, std::greater<Item>> pq;
    pq.push({0, 0});
    long long total = 0;
    int added = 0;
    while (!pq.empty() && added < n) {
        auto [w, u] = pq.top(); pq.pop();
        if (inTree[u]) continue;                    // a cheaper edge already brought u in
        inTree[u] = true; total += w; ++added;
        for (auto [v, wt] : g[u]) if (!inTree[v]) pq.push({wt, v});
    }
    return added == n ? total : -1;                // -1: graph is disconnected
}

int main() {
    int n = 5;
    std::vector<std::vector<std::pair<int, int>>> g(n);
    auto add = [&](int u, int v, int w) { g[u].push_back({v, w}); g[v].push_back({u, w}); };
    add(0, 1, 2); add(0, 3, 6); add(1, 2, 3); add(1, 3, 8); add(1, 4, 5); add(2, 4, 7); add(3, 4, 9);
    std::cout << "MST weight " << prim(n, g) << '\n';   // 16
}`),
      ],
      tips: [
        "Union by size plus path compression is the version to write in interviews — both lines matter.",
        "An MST has exactly V − 1 edges; if Kruskal adds fewer, the graph is disconnected.",
        "MSTs apply to undirected graphs; the directed version (arborescence) needs different algorithms.",
        "If all edge weights are distinct, the MST is unique.",
      ],
      subjective: [
        qa("Explain Union-Find with path compression and union by rank.", "Each element points to a parent; the root of a tree represents the set. find(x) follows parents to the root; path compression makes every visited node point directly (or closer) to the root so later finds are faster. union(a, b) finds both roots and, if different, links one under the other; union by rank (or size) attaches the shorter/smaller tree under the taller/larger one to keep trees shallow. With both optimizations, any sequence of m operations on n elements runs in O(m·α(n)), where α is the inverse Ackermann function, below 5 for all practical n."),
        qa("Compare Kruskal's and Prim's algorithms.", "Both are greedy algorithms producing a minimum spanning tree, justified by the cut property. Kruskal's is edge-centric: sort all edges by weight and add the next lightest edge that does not create a cycle (Union-Find check); O(E log E); natural for sparse graphs and edge lists, and it can build a forest for disconnected graphs. Prim's is vertex-centric: start from any vertex and repeatedly add the lightest edge connecting the tree to a new vertex using a priority queue; O(E log V) with a binary heap (O(V²) with an array, good for dense graphs)."),
      ],
      objective: [
        mcq("Number of edges in an MST of a connected graph with V vertices:", ["V", "V − 1", "E − 1", "V + 1"], 1, "A spanning tree."),
        mcq("Kruskal's algorithm uses which structure to detect cycles?", ["Stack", "Union-Find", "Trie", "Segment tree"], 1, "Same root → cycle."),
        mcq("Amortized complexity of DSU operations with both optimizations:", ["O(log n)", "O(α(n))", "O(n)", "O(1) worst case"], 1, "Inverse Ackermann."),
        mcq("Prim's algorithm grows the MST by:", ["Adding the globally lightest edge", "Adding the lightest edge leaving the current tree", "Removing heavy edges", "BFS order"], 1, "Vertex-by-vertex growth."),
      ],
    },
    {
      id: "dynamic-programming", module: "Algorithm design", title: "Dynamic programming", level: "Advanced", minutes: 28,
      summary: "Overlapping subproblems and optimal substructure, memoization vs tabulation, 1-D, knapsack, LCS/edit distance, LIS and grid DP.",
      description: [
        "Dynamic programming solves problems that have optimal substructure (an optimal solution is built from optimal solutions of subproblems) and overlapping subproblems (the same subproblems recur). Instead of recomputing, it stores each subproblem's answer once. Top-down memoization adds a cache to the natural recursion; bottom-up tabulation fills a table in dependency order and often allows space optimization to one or two rows.",
        "A reliable recipe: 1) define the state — what dp[i] (or dp[i][j]) means in words; 2) write the transition (recurrence) from smaller states; 3) set base cases; 4) choose the computation order; 5) read the answer; 6) optimize space. Complexity is (number of states) × (work per transition).",
        "Families to master: 1-D (climbing stairs, house robber, decode ways, coin change — minimum coins and number of ways); 0/1 knapsack (dp[w] over items, iterating capacity downward so each item is used once) and unbounded knapsack (iterate upward); two-sequence DP (longest common subsequence, edit distance, interleaving strings); longest increasing subsequence (O(n²) DP or O(n log n) with patience sorting); grid paths and minimum path sum; interval DP (matrix chain multiplication, burst balloons); and DP on trees and bitmasks.",
        "Greedy is a special case where a local choice is always safe; when greedy fails (coin systems like {1, 3, 4} for amount 6), DP is the fallback.",
      ],
      usage: [
        "“Number of ways”, “minimum/maximum cost”, “is it possible” over sequences or grids → think DP.",
        "Start with a recursive brute force, add memoization, then convert to tabulation if needed.",
        "Reduce O(n·m) memory to O(m) when each row depends only on the previous one.",
        "Reconstruct the actual solution by storing choices or walking the table backwards.",
      ],
      files: [
        file("java/DpClassics.java", code`
import java.util.*;

public class DpClassics {
    // Coin change (minimum coins): dp[a] = min over coins of dp[a - c] + 1
    static int minCoins(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a && dp[a - c] != Integer.MAX_VALUE) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
    }

    // 0/1 knapsack with a 1-D table: capacity loop goes DOWN so each item is used at most once
    static int knapsack(int[] weight, int[] value, int capacity) {
        int[] dp = new int[capacity + 1];
        for (int i = 0; i < weight.length; i++)
            for (int w = capacity; w >= weight[i]; w--)
                dp[w] = Math.max(dp[w], dp[w - weight[i]] + value[i]);
        return dp[capacity];
    }

    // House robber: cannot take two adjacent houses; O(1) space
    static int rob(int[] houses) {
        int take = 0, skip = 0;
        for (int h : houses) { int newTake = skip + h; skip = Math.max(skip, take); take = newTake; }
        return Math.max(take, skip);
    }

    // LIS in O(n log n): tails[k] = smallest tail of an increasing subsequence of length k+1
    static int lis(int[] a) {
        int[] tails = new int[a.length];
        int len = 0;
        for (int x : a) {
            int i = Arrays.binarySearch(tails, 0, len, x);
            if (i < 0) i = -(i + 1);
            tails[i] = x;
            if (i == len) len++;
        }
        return len;
    }

    // Memoized top-down: unique grid paths with obstacles
    static long paths(int[][] grid, int r, int c, Long[][] memo) {
        if (r >= grid.length || c >= grid[0].length || grid[r][c] == 1) return 0;
        if (r == grid.length - 1 && c == grid[0].length - 1) return 1;
        if (memo[r][c] != null) return memo[r][c];
        return memo[r][c] = paths(grid, r + 1, c, memo) + paths(grid, r, c + 1, memo);
    }

    public static void main(String[] args) {
        System.out.println(minCoins(new int[]{1, 3, 4}, 6));                                  // 2 (3+3); greedy would give 3
        System.out.println(knapsack(new int[]{1, 3, 4, 5}, new int[]{1, 4, 5, 7}, 7));       // 9
        System.out.println(rob(new int[]{2, 7, 9, 3, 1}));                                    // 12
        System.out.println(lis(new int[]{10, 9, 2, 5, 3, 7, 101, 18}));                       // 4
        int[][] grid = {{0, 0, 0}, {0, 1, 0}, {0, 0, 0}};
        System.out.println(paths(grid, 0, 0, new Long[3][3]));                                // 2
    }
}`),
        file("cpp/string_dp.cpp", code`
#include <algorithm>
#include <climits>
#include <iostream>
#include <string>
#include <vector>

// Longest common subsequence with reconstruction: O(n*m)
std::string lcs(const std::string& a, const std::string& b) {
    int n = (int)a.size(), m = (int)b.size();
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(m + 1, 0));   // dp[i][j]: LCS of a[0..i) and b[0..j)
    for (int i = 1; i <= n; ++i)
        for (int j = 1; j <= m; ++j)
            dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] + 1 : std::max(dp[i - 1][j], dp[i][j - 1]);
    std::string out;                                                         // walk back through the table
    for (int i = n, j = m; i > 0 && j > 0;) {
        if (a[i - 1] == b[j - 1]) { out += a[i - 1]; --i; --j; }
        else if (dp[i - 1][j] >= dp[i][j - 1]) --i;
        else --j;
    }
    std::reverse(out.begin(), out.end());
    return out;
}

// Edit distance (Levenshtein) with two rows: O(n*m) time, O(m) space
int editDistance(const std::string& a, const std::string& b) {
    std::vector<int> prev(b.size() + 1), cur(b.size() + 1);
    for (int j = 0; j <= (int)b.size(); ++j) prev[j] = j;                  // insert j characters
    for (int i = 1; i <= (int)a.size(); ++i) {
        cur[0] = i;                                                          // delete i characters
        for (int j = 1; j <= (int)b.size(); ++j)
            cur[j] = a[i - 1] == b[j - 1] ? prev[j - 1]
                   : 1 + std::min({prev[j - 1], prev[j], cur[j - 1]});      // replace, delete, insert
        std::swap(prev, cur);
    }
    return prev[b.size()];
}

// Matrix chain multiplication: interval DP, O(n^3)
long long matrixChain(const std::vector<int>& dims) {                       // matrix i is dims[i] x dims[i+1]
    int n = (int)dims.size() - 1;
    std::vector<std::vector<long long>> dp(n, std::vector<long long>(n, 0));
    for (int len = 2; len <= n; ++len)
        for (int i = 0; i + len - 1 < n; ++i) {
            int j = i + len - 1;
            dp[i][j] = LLONG_MAX;
            for (int k = i; k < j; ++k)
                dp[i][j] = std::min(dp[i][j], dp[i][k] + dp[k + 1][j] + 1LL * dims[i] * dims[k + 1] * dims[j + 1]);
        }
    return dp[0][n - 1];
}

int main() {
    std::cout << lcs("ABCBDAB", "BDCABA") << '\n';            // a length-4 LCS such as BCBA
    std::cout << editDistance("kitten", "sitting") << '\n';   // 3
    std::cout << matrixChain({10, 30, 5, 60}) << '\n';         // 4500
}`),
        file("dp-recipe.md", code`
1. State      : dp[i][j] = <meaning in plain words>
2. Transition : dp[i][j] = f(smaller states)
3. Base cases : dp[0][*], dp[*][0], ...
4. Order      : make sure dependencies are computed first
5. Answer     : dp[n][m] (or max over a row)
6. Space      : keep only the rows you still read

Knapsack loops:
  0/1       -> for item: for w = W down to wt   (each item once)
  unbounded -> for item: for w = wt up to W     (item reusable)`),
      ],
      tips: [
        "If you cannot state dp[i] in one sentence, the state is not defined yet.",
        "Count of ways problems: decide whether order matters (combinations: items outer loop; permutations: amount outer loop).",
        "Memoization with recursion is fine in interviews; mention the stack-depth risk and tabulation alternative.",
        "Use long or modulo arithmetic (1e9+7) for counting problems with large answers.",
      ],
      subjective: [
        qa("What are the two properties required for dynamic programming?", "Optimal substructure: an optimal solution to the problem can be constructed from optimal solutions of its subproblems (e.g. the shortest path from A to C via B contains the shortest path from A to B). Overlapping subproblems: a naive recursive solution solves the same subproblems repeatedly (e.g. fib(n − 2) is computed by both fib(n) and fib(n − 1)). DP stores each subproblem's result once, turning exponential recursion into polynomial time."),
        qa("Differentiate memoization and tabulation.", "Memoization (top-down) keeps the natural recursive formulation and caches results in a map/array the first time each state is computed; it only computes states that are actually needed and is easy to write, but uses recursion stack space and has call overhead. Tabulation (bottom-up) iteratively fills a table from base cases in an order where dependencies are already computed; it avoids recursion, allows space optimization (rolling arrays), and is usually faster, but computes all states and requires figuring out the order."),
        qa("Solve 0/1 knapsack using DP and state its complexity.", "Let dp[i][w] be the maximum value using the first i items with capacity w. Transition: dp[i][w] = dp[i−1][w] (skip item i) or, if weight[i] ≤ w, max with dp[i−1][w − weight[i]] + value[i] (take it). Base: dp[0][w] = 0. Answer dp[n][W]. Time O(n·W) and space O(n·W), reducible to O(W) by using one array and iterating w from W down to weight[i] so each item is counted at most once. It is pseudo-polynomial because W is a numeric value, not an input size."),
        qa("Why does a greedy approach fail for coin change with coins {1, 3, 4} and amount 6?", "Greedy takes the largest coin first: 4, then 1, then 1 — three coins. The optimal answer is 3 + 3 — two coins. Greedy is only correct for canonical coin systems (such as Indian or US denominations). DP checks every last coin: dp[6] = 1 + min(dp[5], dp[3], dp[2]) = 1 + min(2, 1, 2) = 2."),
      ],
      objective: [
        mcq("Dynamic programming is applicable when a problem has:", ["Only greedy choice", "Optimal substructure and overlapping subproblems", "No recursion", "Sorted input"], 1, "Both properties."),
        mcq("Time complexity of LCS for strings of lengths n and m:", ["O(n + m)", "O(n·m)", "O(2ⁿ)", "O(n log m)"], 1, "One cell per pair of prefixes."),
        mcq("In 1-D 0/1 knapsack, the capacity loop runs:", ["Upward", "Downward", "Either way", "Twice"], 1, "Upward would reuse items (unbounded knapsack)."),
        mcq("Edit distance between “kitten” and “sitting”:", ["2", "3", "4", "5"], 1, "k→s, e→i, insert g."),
        mcq("LIS can be computed in:", ["O(n) always", "O(n log n)", "Only O(n³)", "O(2ⁿ) only"], 1, "Patience sorting with binary search."),
      ],
    },
    {
      id: "greedy", module: "Algorithm design", title: "Greedy algorithms", level: "Intermediate", minutes: 16,
      summary: "Locally optimal choices with proofs: activity selection, interval scheduling and merging, fractional knapsack, jump game and Huffman coding.",
      description: [
        "A greedy algorithm builds a solution step by step, always taking the choice that looks best right now and never revisiting it. It is correct only when the problem has the greedy-choice property (some optimal solution starts with the greedy choice) and optimal substructure. Proofs usually use an exchange argument: take any optimal solution and show it can be modified to include the greedy choice without becoming worse.",
        "Classic correct greedies: activity selection (sort by end time, take every activity that starts after the last chosen one ends), minimum meeting rooms (sort starts and ends, or a min-heap of end times), merging overlapping intervals (sort by start), fractional knapsack (by value/weight ratio — the 0/1 version needs DP), jump game (track the farthest reachable index), gas station, minimum platforms, assigning cookies, Huffman coding (repeatedly merge the two least frequent symbols with a min-heap) and Dijkstra/Prim/Kruskal.",
        "Greedy usually means sorting plus a single pass: O(n log n). When you cannot prove the greedy choice is safe, test small counterexamples — many plausible greedies (largest coin first, shortest job first for some objectives) fail.",
      ],
      usage: [
        "Scheduling, interval and resource allocation problems → sort by the right key, then sweep.",
        "Compression → Huffman coding.",
        "Reachability with maximum jumps → farthest-reach greedy.",
        "If a quick counterexample exists, switch to DP.",
      ],
      files: [
        file("java/Greedy.java", code`
import java.util.*;

public class Greedy {
    // Activity selection: maximum number of non-overlapping meetings
    static int maxMeetings(int[][] meetings) {
        Arrays.sort(meetings, Comparator.comparingInt(m -> m[1]));   // earliest end first
        int count = 0, lastEnd = Integer.MIN_VALUE;
        for (int[] m : meetings) if (m[0] >= lastEnd) { count++; lastEnd = m[1]; }
        return count;
    }

    // Merge overlapping intervals
    static List<int[]> merge(int[][] intervals) {
        Arrays.sort(intervals, Comparator.comparingInt(iv -> iv[0]));
        List<int[]> out = new ArrayList<>();
        for (int[] iv : intervals) {
            if (!out.isEmpty() && iv[0] <= out.get(out.size() - 1)[1])
                out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], iv[1]);
            else out.add(iv.clone());
        }
        return out;
    }

    // Minimum meeting rooms: min-heap of end times
    static int minRooms(int[][] meetings) {
        Arrays.sort(meetings, Comparator.comparingInt(m -> m[0]));
        PriorityQueue<Integer> ends = new PriorityQueue<>();
        for (int[] m : meetings) {
            if (!ends.isEmpty() && ends.peek() <= m[0]) ends.poll();   // reuse a freed room
            ends.add(m[1]);
        }
        return ends.size();
    }

    // Fractional knapsack: best value per unit weight first
    static double fractionalKnapsack(int[] w, int[] v, int cap) {
        Integer[] idx = new Integer[w.length];
        for (int i = 0; i < idx.length; i++) idx[i] = i;
        Arrays.sort(idx, (a, b) -> Double.compare((double) v[b] / w[b], (double) v[a] / w[a]));
        double total = 0;
        for (int i : idx) {
            if (cap == 0) break;
            int take = Math.min(cap, w[i]);
            total += take * (double) v[i] / w[i];
            cap -= take;
        }
        return total;
    }

    // Jump game: can we reach the last index?
    static boolean canJump(int[] nums) {
        int far = 0;
        for (int i = 0; i < nums.length; i++) { if (i > far) return false; far = Math.max(far, i + nums[i]); }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(maxMeetings(new int[][]{{1, 2}, {3, 4}, {0, 6}, {5, 7}, {8, 9}, {5, 9}}));   // 4
        merge(new int[][]{{1, 3}, {2, 6}, {8, 10}, {15, 18}}).forEach(iv -> System.out.print(Arrays.toString(iv)));
        System.out.println("\n" + minRooms(new int[][]{{0, 30}, {5, 10}, {15, 20}}));                    // 2
        System.out.println(fractionalKnapsack(new int[]{10, 20, 30}, new int[]{60, 100, 120}, 50));      // 240.0
        System.out.println(canJump(new int[]{2, 3, 1, 1, 4}) + " " + canJump(new int[]{3, 2, 1, 0, 4}));
    }
}`),
        file("cpp/huffman.cpp", code`
#include <iostream>
#include <map>
#include <memory>
#include <queue>
#include <string>
#include <vector>

// Huffman coding: always merge the two least frequent trees. O(k log k) for k symbols.
struct Node {
    char ch; int freq;
    std::shared_ptr<Node> left, right;
};

struct ByFreq {
    bool operator()(const std::shared_ptr<Node>& a, const std::shared_ptr<Node>& b) const { return a->freq > b->freq; }
};

void codes(const std::shared_ptr<Node>& n, const std::string& prefix, std::map<char, std::string>& out) {
    if (!n) return;
    if (!n->left && !n->right) { out[n->ch] = prefix.empty() ? "0" : prefix; return; }
    codes(n->left, prefix + "0", out);
    codes(n->right, prefix + "1", out);
}

int main() {
    std::vector<std::pair<char, int>> freq{{'a', 5}, {'b', 9}, {'c', 12}, {'d', 13}, {'e', 16}, {'f', 45}};
    std::priority_queue<std::shared_ptr<Node>, std::vector<std::shared_ptr<Node>>, ByFreq> pq;
    for (auto [c, f] : freq) pq.push(std::make_shared<Node>(Node{c, f, nullptr, nullptr}));
    while (pq.size() > 1) {
        auto a = pq.top(); pq.pop();
        auto b = pq.top(); pq.pop();
        pq.push(std::make_shared<Node>(Node{'\0', a->freq + b->freq, a, b}));   // greedy merge
    }
    std::map<char, std::string> table;
    codes(pq.top(), "", table);
    for (auto& [c, code] : table) std::cout << c << ": " << code << '\n';     // f gets the shortest code
}`),
      ],
      tips: [
        "Activity selection sorts by END time; sorting by start or duration gives wrong answers.",
        "Explain why the greedy choice is safe — interviewers value the argument as much as the code.",
        "Interval problems: decide whether touching endpoints ([1,2] and [2,3]) count as overlapping.",
        "Huffman codes are prefix-free: no code is a prefix of another, so decoding is unambiguous.",
      ],
      subjective: [
        qa("Differentiate greedy algorithms and dynamic programming.", "Greedy makes one locally optimal choice at each step and never reconsiders it; it is simple and fast (often O(n log n)) but correct only when the greedy-choice property holds. DP considers all relevant choices for each subproblem and combines their optimal answers, guaranteeing optimality whenever optimal substructure holds, at the cost of more time and memory. Example: fractional knapsack is solved greedily by value/weight ratio, but 0/1 knapsack needs DP; coin change with canonical coins works greedily, arbitrary coin sets need DP."),
        qa("Prove that choosing the activity with the earliest finish time is optimal.", "Let g be the activity with the earliest finish time and let O be any optimal schedule whose first activity is o. Since g finishes no later than o, replacing o with g in O keeps all other activities compatible (they start after o ends, hence after g ends) and keeps the same count. So some optimal schedule begins with g. Removing g and the activities overlapping it leaves a smaller instance of the same problem, to which the same argument applies (optimal substructure). By induction, the greedy schedule is optimal."),
      ],
      objective: [
        mcq("For activity selection, sort activities by:", ["Start time", "Finish time", "Duration", "Profit"], 1, "Earliest finish first."),
        mcq("Which knapsack variant is solved optimally by greedy?", ["0/1 knapsack", "Fractional knapsack", "Bounded knapsack", "None"], 1, "Items can be split."),
        mcq("Huffman coding uses which data structure?", ["Stack", "Min-heap (priority queue)", "Hash set", "Queue"], 1, "Merge the two smallest frequencies."),
        mcq("Which is NOT a greedy algorithm?", ["Kruskal", "Dijkstra", "Floyd–Warshall", "Prim"], 2, "Floyd–Warshall is dynamic programming."),
      ],
    },
  ],
};
