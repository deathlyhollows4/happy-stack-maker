import { SiteFooter } from "@/components/site-footer";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTopicBySlug } from "@/lib/codewise.functions";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  BarChart3,
  Zap,
  Target,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Link2,
  Hash,
  Clock,
  Cpu,
} from "lucide-react";

export const Route = createFileRoute("/learn/$slug")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${capitalize(params.slug)} DSA Guide — Learn, Practice, Master | CodeWise`,
      },
      {
        name: "description",
        content: `Master ${capitalize(params.slug)} with CodeWise. Learn core concepts, time complexity breakdowns, common patterns, MAANG interview frequency, and get AI-powered code reviews.`,
      },
      {
        property: "og:title",
        content: `${capitalize(params.slug)} DSA Guide — Learn, Practice, Master | CodeWise`,
      },
      {
        property: "og:description",
        content: `CodeWise helps CS students master ${capitalize(params.slug)} with AI-driven code reviews and personalised practice problems.`,
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:image",
        content: "https://happy-stack-maker.lovable.app/api/public/og/topics",
      },
      {
        name: "twitter:image",
        content: "https://happy-stack-maker.lovable.app/api/public/og/topics",
      },
    ],
  }),
  component: LearnPage,
});

function topicDisplayName(slug: string): string {
  if (slug.length <= 3 && slug === slug.toLowerCase()) return slug.toUpperCase();
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function capitalize(slug: string): string {
  return topicDisplayName(slug);
}

// ---------- Educational content for all 20 DSA topics ----------

interface TopicEducation {
  description: string;
  overview: string;
  operations: { name: string; time: string; space: string }[];
  commonPatterns: { name: string; slug: string }[];
  whenToUse: string;
  whenToAvoid: string;
  maangFrequency: "Very High" | "High" | "Medium" | "Low";
  prerequisites: string[];
}

const topicEducationMap: Record<string, TopicEducation> = {
  arrays: {
    description:
      "Arrays store elements contiguously in memory, giving O(1) indexed access. Use for random access, fixed-size collections, and sequential data. Foundational to most DSA patterns.",
    overview:
      "An array is the simplest and most fundamental data structure. Elements sit side-by-side in RAM, so accessing `arr[i]` takes constant time. This contiguous layout makes traversal fast but insertion and deletion slow — you must shift elements to make room or close gaps. Arrays are the building block for strings, hash tables, dynamic arrays (like Python lists), and most matrix/grid problems.",
    operations: [
      { name: "Access by index", time: "O(1)", space: "O(1)" },
      { name: "Linear search", time: "O(n)", space: "O(1)" },
      { name: "Insert at end", time: "O(1)*", space: "O(1)" },
      { name: "Insert at position", time: "O(n)", space: "O(1)" },
      { name: "Delete at position", time: "O(n)", space: "O(1)" },
      { name: "Traverse", time: "O(n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Two Pointers", slug: "two-pointers" },
      { name: "Sliding Window", slug: "sliding-window" },
      { name: "Binary Search", slug: "binary-search" },
      { name: "Sorting", slug: "sorting" },
    ],
    whenToUse:
      "Use arrays when you need fast indexed access, when the size is known up front, or when the problem involves sequential processing, subarrays, or range queries on static data.",
    whenToAvoid:
      "Avoid arrays when you need frequent insertions or deletions in the middle, dynamic resizing, or key-value lookups. Use linked lists, dynamic arrays, or hash maps instead.",
    maangFrequency: "Very High",
    prerequisites: [],
  },
  strings: {
    description:
      "Strings are immutable character arrays with language-specific APIs. Master parsing, sliding windows, palindrome checks, and pattern matching for interview success.",
    overview:
      "Strings are sequences of characters — essentially read-only arrays with a rich standard library. Immutability means every 'modification' creates a new string, which has performance implications. String problems test your ability to manipulate character data, handle edge cases (empty strings, Unicode, case sensitivity), and apply array patterns (two-pointer, sliding window) to text.",
    operations: [
      { name: "Access char", time: "O(1)", space: "O(1)" },
      { name: "Length", time: "O(1)", space: "O(1)" },
      { name: "Substring", time: "O(k)", space: "O(k)" },
      { name: "Concatenation", time: "O(n+m)", space: "O(n+m)" },
      { name: "Search (naive)", time: "O(n*m)", space: "O(1)" },
      { name: "Search (KMP)", time: "O(n+m)", space: "O(m)" },
    ],
    commonPatterns: [
      { name: "Two Pointers", slug: "two-pointers" },
      { name: "Sliding Window", slug: "sliding-window" },
      { name: "Hash Maps", slug: "hashing" },
      { name: "Recursion", slug: "recursion" },
    ],
    whenToUse:
      "Use string-specific techniques for text processing, pattern matching, anagram detection, palindrome checks, and problems involving character frequency or ordering.",
    whenToAvoid:
      "Avoid treating strings as mutable arrays in languages where they are immutable (Java, Python, JS). Each concatenation in a loop is O(n^2) — use StringBuilder/StringBuffer or join() instead.",
    maangFrequency: "Very High",
    prerequisites: ["arrays"],
  },
  hashing: {
    description:
      "Hash maps and sets give O(1) average lookup, insert, and delete. The most universal optimization tool — converts O(n^2) pair-search into O(n).",
    overview:
      "A hash map (dictionary, object, unordered_map) maps keys to values using a hash function. Under the hood, keys are hashed to an array index; collisions are handled by chaining (linked lists) or open addressing. The magic of O(1) average-time operations makes hashing the single most common optimization in interview problems. When you see 'find a pair,' 'count frequencies,' 'detect duplicates,' or 'two-sum,' think hash map first.",
    operations: [
      { name: "Insert / put", time: "O(1) avg", space: "O(1)" },
      { name: "Lookup / get", time: "O(1) avg", space: "O(1)" },
      { name: "Delete / remove", time: "O(1) avg", space: "O(1)" },
      { name: "Contains / has", time: "O(1) avg", space: "O(1)" },
      { name: "Iterate keys/values", time: "O(n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Two Pointers", slug: "two-pointers" },
      { name: "Sliding Window", slug: "sliding-window" },
      { name: "Arrays", slug: "arrays" },
      { name: "Graphs", slug: "graphs" },
    ],
    whenToUse:
      "Use hashing for frequency counting, duplicate detection, two-sum style pair-finding, memoization in DP, caching computed results, and adjacency list construction in graphs.",
    whenToAvoid:
      "Avoid when you need ordered traversal, range queries, or prefix/suffix operations. Use arrays (for integer keys with small range), trees, or balanced BSTs instead. Also avoid when worst-case O(n) collision time is unacceptable unless you're confident in the hash function.",
    maangFrequency: "Very High",
    prerequisites: ["arrays"],
  },
  "linked-lists": {
    description:
      "Linked lists chain nodes via pointers. Master traversal, reversal, cycle detection, and in-place manipulation — foundational for tree and graph problems.",
    overview:
      "A linked list is a linear collection of nodes, each storing data and a pointer to the next node. Unlike arrays, linked lists don't need contiguous memory, so insertion and deletion at known positions are O(1). The tradeoff is O(n) access by index and extra memory for pointers. Types: singly linked, doubly linked, and circular. Linked list problems test pointer manipulation, edge cases (empty list, single node), and the ability to track multiple references simultaneously.",
    operations: [
      { name: "Access by index", time: "O(n)", space: "O(1)" },
      { name: "Insert at head", time: "O(1)", space: "O(1)" },
      { name: "Insert at position", time: "O(n)", space: "O(1)" },
      { name: "Delete at position", time: "O(n)", space: "O(1)" },
      { name: "Reverse (in-place)", time: "O(n)", space: "O(1)" },
      { name: "Detect cycle (Floyd)", time: "O(n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Two Pointers", slug: "two-pointers" },
      { name: "Recursion", slug: "recursion" },
      { name: "Stacks", slug: "stacks" },
    ],
    whenToUse:
      "Use linked lists when you need O(1) insertions/deletions at the head, for LRU cache implementations, when implementing stacks/queues, or when the problem explicitly requires pointer-based node manipulation.",
    whenToAvoid:
      "Avoid linked lists when you need random access by index, cache-friendly sequential access (arrays are faster), or when memory overhead per element matters.",
    maangFrequency: "Medium",
    prerequisites: ["arrays"],
  },
  stacks: {
    description:
      "LIFO (Last In, First Out) structure. Use for backtracking, expression evaluation, monotonic stacks, and undo operations.",
    overview:
      "A stack follows the Last In, First Out principle — like a stack of plates. The last element pushed is the first popped. Stacks shine in problems requiring reversal, backtracking, bracket matching, or maintaining a 'recent history.' The monotonic stack variant (maintaining sorted order) is a powerful but subtle pattern for next-greater-element and histogram problems.",
    operations: [
      { name: "Push", time: "O(1)", space: "O(1)" },
      { name: "Pop", time: "O(1)", space: "O(1)" },
      { name: "Peek / Top", time: "O(1)", space: "O(1)" },
      { name: "Is Empty", time: "O(1)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Queues", slug: "queues" },
      { name: "Recursion", slug: "recursion" },
      { name: "Dynamic Programming", slug: "dp" },
    ],
    whenToUse:
      "Use stacks for parenthesis matching, expression evaluation (infix to postfix), backtracking (DFS iterative), undo/redo, function call simulation, and monotonic stack problems (next greater/smaller element, largest rectangle in histogram).",
    whenToAvoid:
      "Avoid stacks when you need FIFO ordering (use a queue), random access by index, or when the depth is unknown and could overflow (use an explicit heap-allocated structure).",
    maangFrequency: "High",
    prerequisites: ["arrays"],
  },
  queues: {
    description:
      "FIFO (First In, First Out) structure. Powering BFS, sliding windows, task scheduling, and producer-consumer patterns.",
    overview:
      "A queue follows the First In, First Out principle — like a line of people. Elements are added at the back and removed from the front. Queues are the engine behind Breadth-First Search (BFS), level-order tree traversal, and any problem involving 'processing in order of arrival.' Variants include circular queues, dequeues (double-ended), and priority queues (heaps).",
    operations: [
      { name: "Enqueue / Push", time: "O(1)", space: "O(1)" },
      { name: "Dequeue / Pop", time: "O(1)", space: "O(1)" },
      { name: "Peek / Front", time: "O(1)", space: "O(1)" },
      { name: "Is Empty", time: "O(1)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "BFS / Graphs", slug: "graphs" },
      { name: "Sliding Window", slug: "sliding-window" },
      { name: "Stacks", slug: "stacks" },
    ],
    whenToUse:
      "Use queues for BFS in trees and graphs, level-order traversal, processing tasks in arrival order, implementing caches (FIFO eviction), and sliding window maximum/minimum (dequeue).",
    whenToAvoid:
      "Avoid queues when you need LIFO ordering (use a stack), priority-based processing (use a heap), or random access by index.",
    maangFrequency: "High",
    prerequisites: ["arrays", "linked-lists"],
  },
  recursion: {
    description:
      "A function calling itself. Master base cases, the call stack, and converting iterative thinking to recursive — prerequisite for trees, graphs, DP, and backtracking.",
    overview:
      "Recursion is a problem-solving technique where a function calls itself on smaller subproblems. Every recursive solution has two parts: a base case (when to stop) and a recursive case (how to reduce the problem). Understanding the call stack — that each recursive call creates a new stack frame — is key to avoiding stack overflow and tracing execution. Recursion is the gateway to trees (naturally recursive), graphs (DFS), dynamic programming (top-down), and backtracking.",
    operations: [
      { name: "Factorial / Fibonacci", time: "O(2^n) naive", space: "O(n) stack" },
      { name: "Tree DFS traversal", time: "O(n)", space: "O(h) stack" },
      { name: "Divide & conquer", time: "O(n log n)", space: "O(log n) stack" },
    ],
    commonPatterns: [
      { name: "Trees", slug: "trees" },
      { name: "Backtracking", slug: "backtracking" },
      { name: "Dynamic Programming", slug: "dp" },
    ],
    whenToUse:
      "Use recursion when a problem naturally decomposes into identical subproblems — tree traversal, divide and conquer (merge sort, quicksort), combinatorial enumeration (backtracking), or any depth-first graph exploration.",
    whenToAvoid:
      "Avoid recursion when the depth is unbounded (risk of stack overflow), when an iterative solution is equally clear and more efficient, or when tail-call optimization is not guaranteed by your language runtime.",
    maangFrequency: "High",
    prerequisites: [],
  },
  "two-pointers": {
    description:
      "Two indices traversing a sorted structure. Covers opposite-direction pairs, fast-slow pointer, and three-way partitioning in O(n) time.",
    overview:
      "The two-pointer technique uses two indices (or references) moving through a data structure, often in opposite directions or at different speeds. It's the go-to optimization for problems involving sorted arrays, palindrome checking, pair sums, and linked list cycle detection. The key insight: by moving pointers strategically, you can often reduce O(n^2) pair-search to O(n).",
    operations: [
      { name: "Opposite ends (sorted array pair sum)", time: "O(n)", space: "O(1)" },
      { name: "Fast & slow (cycle detection)", time: "O(n)", space: "O(1)" },
      { name: "Same direction (remove duplicates)", time: "O(n)", space: "O(1)" },
      { name: "Three-way partition (Dutch flag)", time: "O(n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Arrays", slug: "arrays" },
      { name: "Linked Lists", slug: "linked-lists" },
      { name: "Strings", slug: "strings" },
    ],
    whenToUse:
      "Use two pointers for sorted array pair/triplet problems, palindrome validation, in-place array manipulation, linked list cycle detection, and partitioning problems where a pivot splits elements into categories.",
    whenToAvoid:
      "Avoid when the data isn't sorted and sorting would negate the optimization, or when the problem requires triple-nested search that can't be reduced by pointer movement alone.",
    maangFrequency: "Very High",
    prerequisites: ["arrays"],
  },
  "sliding-window": {
    description:
      "A fixed or variable window moving across arrays/strings. Optimizes substring, subarray, and K-sized window problems from O(n^2) to O(n).",
    overview:
      "The sliding window technique maintains a range [left, right] that expands and contracts across a linear structure. Instead of recomputing from scratch for every subarray, you add the new right element and remove the left element as the window slides. Fixed-size windows are simpler (just slide); variable-size windows require condition-based expansion/contraction. This pattern appears in substring search, longest subarray with constraints, and any problem where a contiguous segment's properties change incrementally.",
    operations: [
      { name: "Fixed window (size K max sum)", time: "O(n)", space: "O(1)" },
      { name: "Variable window (longest without repeating chars)", time: "O(n)", space: "O(k)" },
      { name: "At-most K distinct (fruit into baskets)", time: "O(n)", space: "O(k)" },
    ],
    commonPatterns: [
      { name: "Arrays", slug: "arrays" },
      { name: "Strings", slug: "strings" },
      { name: "Hash Maps", slug: "hashing" },
    ],
    whenToUse:
      "Use sliding window for contiguous subarray/substring problems, maximum/minimum window size with constraints, problems involving distinct elements, character frequency, or any 'longest subarray with property X.'",
    whenToAvoid:
      "Avoid sliding window when the subarray constraint isn't monotonic (expanding the window doesn't guarantee the condition stays satisfied), or when the problem involves non-contiguous subsets.",
    maangFrequency: "Very High",
    prerequisites: ["arrays", "strings", "hashing"],
  },
  "binary-search": {
    description:
      "Divide the search space in half each iteration. Applies to sorted arrays, monotonic functions, and answer-space search in O(log n) time.",
    overview:
      "Binary search is not just for finding elements in a sorted array. The core idea — eliminating half the search space each step — applies to any problem with a monotonic predicate. Once you recognize that 'if condition X is true at position i, it's true for all positions > i,' you can binary search the boundary. This unlocks advanced applications: finding square roots, searching in rotated arrays, capacity planning (ship packages in D days), and minimax problems.",
    operations: [
      { name: "Classic (sorted array search)", time: "O(log n)", space: "O(1)" },
      { name: "Lower bound / bisect_left", time: "O(log n)", space: "O(1)" },
      { name: "Rotated array search", time: "O(log n)", space: "O(1)" },
      { name: "Answer-space (allocate pages)", time: "O(n log range)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Arrays", slug: "arrays" },
      { name: "Sorting", slug: "sorting" },
      { name: "Greedy", slug: "greedy" },
    ],
    whenToUse:
      "Use binary search on sorted arrays, when searching over a monotonic numeric range (capacity, speed, time), for finding the first/last occurrence, in rotated arrays, and whenever you can phrase a decision problem as 'can we do X with capacity Y?'.",
    whenToAvoid:
      "Avoid binary search on unsorted data, when the predicate is non-monotonic, or when O(n) linear scan is simpler and n is small enough that log n doesn't matter.",
    maangFrequency: "Very High",
    prerequisites: ["arrays"],
  },
  sorting: {
    description:
      "Arranging data to unlock efficient algorithms. Know merge sort (divide & conquer), quicksort (partitioning), and when O(n log n) is the lower bound.",
    overview:
      "Sorting is often a preprocessing step that unlocks two-pointer, binary search, and greedy solutions. Understanding the tradeoffs — merge sort is stable and O(n log n) guaranteed, quicksort is in-place but O(n^2) worst-case, heapsort gives O(n log n) in-place — helps you choose the right tool. Counting sort and radix sort break the O(n log n) comparison-sort barrier for integer keys with limited range.",
    operations: [
      { name: "Merge Sort", time: "O(n log n)", space: "O(n)" },
      { name: "Quick Sort", time: "O(n log n) avg", space: "O(log n) stack" },
      { name: "Heap Sort", time: "O(n log n)", space: "O(1)" },
      { name: "Counting Sort (int keys)", time: "O(n + k)", space: "O(k)" },
    ],
    commonPatterns: [
      { name: "Two Pointers", slug: "two-pointers" },
      { name: "Binary Search", slug: "binary-search" },
      { name: "Greedy", slug: "greedy" },
    ],
    whenToUse:
      "Sort as preprocessing when it enables a greedy choice, two-pointer traversal, or binary search. Also use sorting for merge intervals, finding duplicates, and organizing data for efficient queries.",
    whenToAvoid:
      "Avoid sorting when O(n log n) is too slow and O(n) alternatives exist (hash map for duplicates, quickselect for k-th element). Also avoid if the original order carries semantic meaning you can't recover.",
    maangFrequency: "High",
    prerequisites: ["arrays"],
  },
  trees: {
    description:
      "Hierarchical data with nodes and edges. Binary trees, N-ary trees, traversal (pre/in/post/level order) — the backbone of hierarchical problem modeling.",
    overview:
      "A tree is a connected, acyclic graph — a hierarchical structure where each node has zero or more children and exactly one parent (except the root). Trees model hierarchies naturally: file systems, DOM, organization charts, decision trees. Binary trees (max 2 children) are the interview staple. Traversal order — preorder (root-left-right), inorder (left-root-right), postorder (left-right-root), level-order (BFS) — is the single most tested concept, along with recursion on subtrees.",
    operations: [
      { name: "DFS (pre/in/post order)", time: "O(n)", space: "O(h) stack" },
      { name: "BFS / Level-order", time: "O(n)", space: "O(w) queue" },
      { name: "Insert in BST", time: "O(h)", space: "O(1)" },
      { name: "Search in BST", time: "O(h)", space: "O(1)" },
      { name: "Height calculation", time: "O(n)", space: "O(h)" },
    ],
    commonPatterns: [
      { name: "Recursion", slug: "recursion" },
      { name: "Binary Search Trees", slug: "bst" },
      { name: "Graphs", slug: "graphs" },
    ],
    whenToUse:
      "Use trees for hierarchical data, binary tree problems (traversal, LCA, path sums), expression parsing (syntax trees), decision trees, and anytime the problem mentions 'parent-child' or 'nested' relationships.",
    whenToAvoid:
      "Avoid trees when the data has cycles (use graphs), when a flat structure (array/hash map) is sufficient, or when the tree can degenerate into a linked list (use a self-balancing BST or alternative).",
    maangFrequency: "Very High",
    prerequisites: ["recursion", "queues"],
  },
  bst: {
    description:
      "Binary Search Tree — left < root < right. Gives O(log n) search/insert in balanced form. Underpins TreeMap, TreeSet, and database B-trees.",
    overview:
      "A Binary Search Tree enforces the ordering property: for every node, left subtree values < node value < right subtree values. This gives O(h) search, insert, and delete where h is the tree height. In a balanced BST (AVL, Red-Black), h = O(log n), giving logarithmic operations. BSTs underpin ordered maps, sorted sets, and range queries — whenever you need 'next greater element' or 'values in range [L, R]' efficiently.",
    operations: [
      { name: "Search", time: "O(h)", space: "O(1)" },
      { name: "Insert", time: "O(h)", space: "O(1)" },
      { name: "Delete", time: "O(h)", space: "O(1)" },
      { name: "Inorder (sorted output)", time: "O(n)", space: "O(h)" },
      { name: "Min / Max", time: "O(h)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Trees", slug: "trees" },
      { name: "Recursion", slug: "recursion" },
      { name: "Binary Search", slug: "binary-search" },
    ],
    whenToUse:
      "Use BST when you need ordered operations (floor, ceiling, range queries) with better-than-O(n) performance, or when the problem involves validating or manipulating BST properties (inorder must be sorted).",
    whenToAvoid:
      "Avoid BST when you only need key-value lookups (use a hash map), when the tree can become skewed (use a self-balancing variant or alternative), or when O(n) preprocessing + O(1) queries via array is simpler.",
    maangFrequency: "Medium",
    prerequisites: ["trees", "recursion"],
  },
  heaps: {
    description:
      "Priority queues giving O(1) access to min/max element and O(log n) insertion. Essential for Top-K, Dijkstra, Huffman coding, and scheduling.",
    overview:
      "A heap is a complete binary tree satisfying the heap property: in a min-heap, every parent is smaller than its children (root is global minimum). Heaps give O(1) access to the extremum and O(log n) insert/delete. They're usually implemented as arrays for cache efficiency. Use cases: Top-K elements (maintain a K-sized heap), merging K sorted lists, Dijkstra's shortest path, median maintenance (two heaps), and task scheduling.",
    operations: [
      { name: "Peek (min/max)", time: "O(1)", space: "O(1)" },
      { name: "Push / Insert", time: "O(log n)", space: "O(1)" },
      { name: "Pop / Extract", time: "O(log n)", space: "O(1)" },
      { name: "Heapify (build)", time: "O(n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Sorting", slug: "sorting" },
      { name: "Graphs", slug: "graphs" },
      { name: "Greedy", slug: "greedy" },
    ],
    whenToUse:
      "Use heaps for Top-K problems, K-way merge, Dijkstra's and Prim's algorithms, median from data stream (two-heap pattern), task scheduling (CPU with cooldown), and whenever you need repeated access to the current minimum/maximum.",
    whenToAvoid:
      "Avoid heaps when you need full sorting (just sort the array), when you need ordered traversal of all elements, or when the problem requires searching for arbitrary elements (heaps don't support efficient search).",
    maangFrequency: "High",
    prerequisites: ["arrays", "trees"],
  },
  graphs: {
    description:
      "Nodes connected by edges. Model networks, relationships, and state spaces. BFS finds shortest paths; DFS explores connectivity and cycles.",
    overview:
      "A graph G = (V, E) consists of vertices (nodes) connected by edges. Graphs model real-world networks: social graphs, road maps, web links, dependency trees. Representations: adjacency list (O(V+E) memory, good for sparse graphs) or adjacency matrix (O(V^2), good for dense). BFS finds shortest paths in unweighted graphs; DFS detects cycles, finds connected components, and enables topological sort. Weighted graph algorithms (Dijkstra, Bellman-Ford, Floyd-Warshall) are interview staples.",
    operations: [
      { name: "BFS (shortest path, unweighted)", time: "O(V + E)", space: "O(V)" },
      { name: "DFS (cycle detection, topo sort)", time: "O(V + E)", space: "O(V)" },
      { name: "Dijkstra (weighted, non-negative)", time: "O((V+E) log V)", space: "O(V)" },
      { name: "Bellman-Ford (negative edges)", time: "O(V * E)", space: "O(V)" },
      { name: "Union-Find (DSU)", time: "O(alpha(V))", space: "O(V)" },
    ],
    commonPatterns: [
      { name: "Queues", slug: "queues" },
      { name: "Heaps", slug: "heaps" },
      { name: "Dynamic Programming", slug: "dp" },
    ],
    whenToUse:
      "Use graphs when the problem involves entities and their relationships, network flow, dependency ordering, state machines, grid traversal (BFS/DFS on 2D grid), or shortest/longest path problems.",
    whenToAvoid:
      "Avoid graph representations when the relationships can be modeled more simply (arrays, trees), when the graph is so dense that matrix representation would exceed memory, or when a non-graph algorithm (DP, greedy) solves it more efficiently.",
    maangFrequency: "Very High",
    prerequisites: ["trees", "queues", "recursion"],
  },
  dp: {
    description:
      "Dynamic Programming — solve by breaking into overlapping subproblems. Master memoization (top-down) and tabulation (bottom-up) for optimization problems.",
    overview:
      "Dynamic Programming is not a specific algorithm but a technique: solve a problem by combining solutions to overlapping subproblems, storing results to avoid recomputation. Two approaches: top-down (memoization — recursive with cache) and bottom-up (tabulation — iterative table filling). DP applies when a problem has optimal substructure (optimal solution built from optimal sub-solutions) and overlapping subproblems. Classic problems: knapsack, LCS, edit distance, coin change, matrix chain multiplication.",
    operations: [
      { name: "1D DP (Fibonacci, climbing stairs)", time: "O(n)", space: "O(1) opt" },
      { name: "2D DP (LCS, edit distance)", time: "O(n*m)", space: "O(n*m) → O(min(n,m))" },
      { name: "Knapsack (0/1)", time: "O(n*W)", space: "O(W) opt" },
      { name: "Grid DP (unique paths, min path sum)", time: "O(n*m)", space: "O(m) opt" },
    ],
    commonPatterns: [
      { name: "Recursion", slug: "recursion" },
      { name: "Backtracking", slug: "backtracking" },
      { name: "Greedy", slug: "greedy" },
    ],
    whenToUse:
      "Use DP when the problem asks for 'minimum/maximum/count of ways,' involves choices with constraints, has clearly defined states and transitions, and overlapping subproblems exist. If you find yourself solving the same subproblem multiple times in recursion, it's DP territory.",
    whenToAvoid:
      "Avoid DP when subproblems don't overlap (divide and conquer is sufficient), when the state space is too large for memoization, or when a greedy choice property lets you make optimal local decisions without exploring all options.",
    maangFrequency: "Very High",
    prerequisites: ["recursion", "arrays"],
  },
  greedy: {
    description:
      "Make the locally optimal choice at each step. Works when the problem has optimal substructure and the greedy-choice property holds.",
    overview:
      "A greedy algorithm builds a solution incrementally, always choosing the option that looks best at the moment — never reconsidering past choices. Greedy works when the problem exhibits the greedy-choice property: a locally optimal choice leads to a globally optimal solution. Classic examples: activity selection, Huffman coding, fractional knapsack, coin change (with canonical denominations), Kruskal's and Prim's for MST. The hard part is proving that greedy is correct — many problems look greedy but require DP.",
    operations: [
      { name: "Activity selection", time: "O(n log n)", space: "O(1)" },
      { name: "Interval scheduling", time: "O(n log n)", space: "O(1)" },
      { name: "Huffman coding", time: "O(n log n)", space: "O(n)" },
    ],
    commonPatterns: [
      { name: "Sorting", slug: "sorting" },
      { name: "Heaps", slug: "heaps" },
      { name: "Dynamic Programming", slug: "dp" },
    ],
    whenToUse:
      "Use greedy when you can prove the greedy-choice property (often by contradiction or exchange argument), when the problem asks for minimum/maximum with a clear ordering, or when it's a known greedy problem (interval scheduling, gas station, jump game).",
    whenToAvoid:
      "Avoid greedy when it fails for counterexamples — always test with small cases. If the greedy choice can lead to a dead end that requires backtracking, it's likely a DP problem. When in doubt, code a DP solution and check if greedy matches on test cases.",
    maangFrequency: "High",
    prerequisites: ["sorting", "arrays"],
  },
  backtracking: {
    description:
      "Systematically explore all candidates, abandoning ('backtracking') dead ends. The technique behind permutations, N-Queens, Sudoku, and combinatorial search.",
    overview:
      "Backtracking is a systematic trial-and-error search. You build candidates incrementally and abandon a partial candidate ('backtrack') as soon as you determine it cannot be completed to a valid solution. It's essentially DFS through a state space tree with pruning. The template: choose → explore → un-choose. Backtracking generates all solutions (permutations, subsets, combinations) or finds one solution that satisfies constraints (N-Queens, Sudoku, word search).",
    operations: [
      { name: "Generate all permutations", time: "O(n!)", space: "O(n)" },
      { name: "Generate all subsets", time: "O(2^n)", space: "O(n)" },
      { name: "N-Queens", time: "O(n!)", space: "O(n^2) board" },
      { name: "Sudoku solver", time: "O(9^m)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Recursion", slug: "recursion" },
      { name: "Dynamic Programming", slug: "dp" },
      { name: "Graphs", slug: "graphs" },
    ],
    whenToUse:
      "Use backtracking for combinatorial enumeration (permutations, combinations, subsets), constraint satisfaction (N-Queens, Sudoku), path finding in mazes/grids with obstacles, and anytime you need to find all valid configurations exhaustively.",
    whenToAvoid:
      "Avoid backtracking when the state space is huge and un-prunable (use DP or math), when you only need one solution and a faster heuristic exists, or when the problem has optimal substructure (DP will be exponentially faster).",
    maangFrequency: "Medium",
    prerequisites: ["recursion"],
  },
  "bit-manipulation": {
    description:
      "Operate directly on binary representations. XOR tricks, bit masks, and power-of-two checks — compact, lightning-fast, and interview favorites.",
    overview:
      "Bit manipulation leverages binary representation to achieve O(1) operations that would otherwise take O(n) or O(log n). Core operations: AND (&), OR (|), XOR (^), NOT (~), left shift (<<), right shift (>>). XOR is the star: x ^ x = 0, x ^ 0 = x, and XOR is commutative/associative — enabling single-number and swap tricks. Bit masks represent sets compactly (int can hold 32 boolean flags). Useful for subsets, permissions, and state compression in DP.",
    operations: [
      { name: "Get i-th bit", time: "O(1)", space: "O(1)" },
      { name: "Set i-th bit", time: "O(1)", space: "O(1)" },
      { name: "Count set bits (popcount)", time: "O(k) or O(1) builtin", space: "O(1)" },
      { name: "Check power of two", time: "O(1)", space: "O(1)" },
      { name: "XOR tricks (single number)", time: "O(n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Arrays", slug: "arrays" },
      { name: "Dynamic Programming", slug: "dp" },
      { name: "Hash Maps", slug: "hashing" },
    ],
    whenToUse:
      "Use bit manipulation for space optimization (packing flags), XOR-based single-number detection, power-of-two checks, subset generation via bitmask (0 to 2^n), and any problem with constraints n <= 20 (hinting at 2^n bitmask DP).",
    whenToAvoid:
      "Avoid bit manipulation when clarity matters more than micro-optimizations — readable code using booleans or sets is preferred unless performance/space is critical. Also avoid when n > 64 (bitmask outgrows integer size).",
    maangFrequency: "Medium",
    prerequisites: [],
  },
  complexity: {
    description:
      "Big-O analysis of time and space. The universal interview evaluation criterion — understand logarithmic, linearithmic, and exponential growth.",
    overview:
      "Time and space complexity analysis is how we measure algorithm efficiency independent of hardware. Big-O notation describes the upper bound of growth rate as input size n approaches infinity. Common classes: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n^2) quadratic, O(2^n) exponential. Mastering complexity analysis means you can predict which solution will pass interview constraints (n=10^6 needs O(n) or O(n log n); n=20 allows O(2^n)).",
    operations: [
      { name: "O(1) — constant", time: "Instant regardless of n", space: "Constant" },
      { name: "O(log n) — logarithmic", time: "Binary search, balanced trees", space: "Recursion depth" },
      { name: "O(n) — linear", time: "Single pass, two-pointer", space: "Input copy" },
      { name: "O(n log n) — linearithmic", time: "Sorting, divide & conquer", space: "Merge sort memory" },
      { name: "O(n^2) — quadratic", time: "Nested loops, pair-search", space: "DP table" },
      { name: "O(2^n) — exponential", time: "Brute-force subsets", space: "Recursion tree" },
    ],
    commonPatterns: [
      { name: "Sorting", slug: "sorting" },
      { name: "Binary Search", slug: "binary-search" },
      { name: "Dynamic Programming", slug: "dp" },
    ],
    whenToUse:
      "Analyze complexity for every solution. Before coding, check constraints: if n <= 10^5 and your algorithm is O(n^2), it will TLE (time limit exceeded). Use complexity analysis to choose the right algorithm before you start writing code.",
    whenToAvoid:
      "Don't obsess over complexity when n is trivially small. Don't sacrifice code clarity for minor constant-factor gains unless profiling proves it matters. Big-O ignores constants — an O(n) algorithm with large constants can be slower than O(n^2) for small n.",
    maangFrequency: "Very High",
    prerequisites: [],
  },
};

function frequencyColor(freq: string) {
  if (freq === "Very High") return "text-red-500 bg-red-500/10";
  if (freq === "High") return "text-amber-500 bg-amber-500/10";
  if (freq === "Medium") return "text-blue-500 bg-blue-500/10";
  return "text-muted-foreground bg-muted";
}

function LearnPage() {
  const { slug } = useParams({ from: "/learn/$slug" });
  const fn = useServerFn(getTopicBySlug);
  const { data, isLoading, error } = useQuery({
    queryKey: ["topicBySlug", slug],
    queryFn: () => fn({ data: { slug } }),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const topic = data?.topic ?? null;
  const related = data?.related ?? [];
  const displayName = capitalize(slug);
  const edu = topicEducationMap[slug] ?? null;

  if (error || (!isLoading && !topic)) {
    return <NotFound slug={slug} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-lg tracking-tight">CodeWise</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent bg-accent/15 px-1.5 py-0.5 rounded-sm">
              beta
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Get started <ArrowRight className="size-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {isLoading && (
          <section className="border-b border-border">
            <div className="max-w-6xl mx-auto px-8 py-24">
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-12 w-96 bg-muted rounded" />
                <div className="h-6 w-[32rem] bg-muted rounded" />
              </div>
            </div>
          </section>
        )}

        {!isLoading && topic && (
          <>
            {/* Hero */}
            <section className="border-b border-border">
              <div className="max-w-6xl mx-auto px-8 py-24">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {topic.category}
                </p>
                <h1 className="mt-4 font-display text-6xl tracking-tight md:text-7xl">
                  {topic.name}
                </h1>
                {edu && (
                  <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                    {edu.description}
                  </p>
                )}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/practice"
                    search={{ topic: slug }}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
                  >
                    <Sparkles className="size-4" /> Practice {topic.name} with CodeWise
                  </Link>
                  <Link
                    to="/login"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            </section>

            {/* Prerequisites */}
            {edu?.prerequisites && edu.prerequisites.length > 0 && (
              <section className="border-b border-border bg-card/30">
                <div className="max-w-4xl mx-auto px-8 py-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Link2 className="size-5 text-accent" />
                    <h2 className="font-display text-2xl">Prerequisites</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    These topics build the foundation for {topic.name}. Master them first for a smoother learning curve.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {edu.prerequisites.map((pre) => (
                      <Link
                        key={pre}
                        to="/learn/$slug"
                        params={{ slug: pre }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:border-accent/40 hover:text-accent transition-colors"
                      >
                        <ChevronRight className="size-3.5" />
                        {topicDisplayName(pre)}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Educational content */}
            {edu && (
              <>
                {/* Concept Overview */}
                <section className="border-b border-border">
                  <div className="max-w-4xl mx-auto px-8 py-14">
                    <div className="flex items-center gap-3 mb-6">
                      <Lightbulb className="size-5 text-accent" />
                      <h2 className="font-display text-2xl">Concept Overview</h2>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground max-w-3xl">
                      {edu.overview}
                    </p>
                  </div>
                </section>

                {/* Operations Table */}
                <section className="border-b border-border bg-card/30">
                  <div className="max-w-4xl mx-auto px-8 py-14">
                    <div className="flex items-center gap-3 mb-6">
                      <BarChart3 className="size-5 text-accent" />
                      <h2 className="font-display text-2xl">Key Operations & Complexity</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="py-3 pr-6 font-medium">Operation</th>
                            <th className="py-3 pr-6 font-medium">
                              <span className="inline-flex items-center gap-1"><Clock className="size-3" /> Time</span>
                            </th>
                            <th className="py-3 font-medium">
                              <span className="inline-flex items-center gap-1"><Cpu className="size-3" /> Space</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {edu.operations.map((op) => (
                            <tr key={op.name} className="border-b border-border/50">
                              <td className="py-3 pr-6 text-foreground">{op.name}</td>
                              <td className="py-3 pr-6 font-mono text-accent">{op.time}</td>
                              <td className="py-3 font-mono text-muted-foreground">{op.space}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* Common Patterns + When to Use/Avoid */}
                <section className="border-b border-border">
                  <div className="max-w-4xl mx-auto px-8 py-14 grid gap-10 md:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="size-5 text-accent" />
                        <h2 className="font-display text-xl">Common Patterns</h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {edu.commonPatterns.map((p) => (
                          <Link
                            key={p.slug}
                            to="/learn/$slug"
                            params={{ slug: p.slug }}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent hover:bg-accent/20 transition-colors"
                          >
                            <Hash className="size-3" />
                            {p.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="size-5 text-accent" />
                        <h2 className="font-display text-xl">MAANG Frequency</h2>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-xs ${frequencyColor(edu.maangFrequency)}`}>
                        <Target className="size-3" />
                        {edu.maangFrequency}
                      </span>
                    </div>
                  </div>
                </section>

                {/* When to Use / Avoid */}
                <section className="border-b border-border bg-card/30">
                  <div className="max-w-4xl mx-auto px-8 py-14 grid gap-10 md:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="size-5 text-green-500" />
                        <h2 className="font-display text-xl">When to Use</h2>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {edu.whenToUse}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="size-5 text-amber-500" />
                        <h2 className="font-display text-xl">When to Avoid</h2>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {edu.whenToAvoid}
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Related topics */}
            {related.length > 0 && (
              <section className="border-b border-border">
                <div className="max-w-6xl mx-auto px-8 py-16">
                  <h2 className="font-display text-3xl mb-8">Related {topic.category} topics</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((t) => (
                      <Link
                        key={t.slug}
                        to="/learn/$slug"
                        params={{ slug: t.slug }}
                        className="rounded-lg border border-border bg-card p-5 hover:border-accent/40 transition-colors group"
                      >
                        <h3 className="font-display text-xl group-hover:text-accent transition-colors">
                          {t.name}
                        </h3>
                        {t.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {t.description}
                          </p>
                        )}
                        <p className="mt-3 text-xs font-mono text-accent">
                          Learn {t.name.toLowerCase()} →
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Bottom CTA */}
            <section className="bg-card/40">
              <div className="max-w-3xl mx-auto px-8 py-24 text-center">
                <Sparkles className="mx-auto size-6 text-accent" />
                <h2 className="mt-4 font-display text-4xl">Ready to master {topic.name}?</h2>
                <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                  Your first review is free. No credit card required. Get actionable feedback that
                  actually helps you learn.
                </p>
                <Link
                  to="/signup"
                  className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
                >
                  Start your first review <ArrowRight className="size-4" />
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-lg tracking-tight">CodeWise</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent bg-accent/15 px-1.5 py-0.5 rounded-sm">
              beta
            </span>
          </Link>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-8 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Topic not found
        </p>
        <h1 className="mt-4 font-display text-4xl">{capitalize(slug)}</h1>
        <p className="mt-4 text-muted-foreground">
          We don't have a dedicated page for this topic yet. Check out the topics we do cover below.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <ArrowRight className="size-4" /> Explore CodeWise
        </Link>
      </main>
    </div>
  );
}
