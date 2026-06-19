export type TopicSlug = string;

export interface TopicOperation {
  name: string;
  time: string;
  space: string;
}

export interface TopicMeta {
  slug: TopicSlug;
  name: string;
  category: string;
  description: string;
  overview: string;
  operations: TopicOperation[];
  commonPatterns: Array<{ name: string; slug: TopicSlug }>;
  prerequisites: TopicSlug[];
  whenToUse: string;
  whenToAvoid: string;
  maangFrequency: "Very High" | "High" | "Medium" | "Low";
  mentalModel: string;
  workedExample: string;
  commonMistakes: string[];
  quickCheck: string;
  practiceLadder: string[];
}

export const TOPICS: TopicMeta[] = [
  {
    slug: "arrays",
    name: "Arrays",
    category: "Data Structures",
    description: "Index-based storage, traversal, two pointers, and common array tradeoffs.",
    overview:
      "Arrays give constant-time index access and are the base for two pointers, sliding windows, prefix sums, and many interview patterns.",
    operations: [
      { name: "Access by index", time: "O(1)", space: "O(1)" },
      { name: "Search", time: "O(n)", space: "O(1)" },
      { name: "Insert or delete middle", time: "O(n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Two Pointers", slug: "two-pointers" },
      { name: "Sorting", slug: "sorting" },
    ],
    prerequisites: [],
    whenToUse: "Use arrays when order matters, index lookup is frequent, or scanning is cheap.",
    whenToAvoid:
      "Avoid arrays when you need many middle insertions, deletes, or key-based lookup without scanning.",
    maangFrequency: "High",
    mentalModel:
      "Think of an array as numbered boxes. Most mistakes come from moving the index too far or comparing the wrong pair of boxes.",
    workedExample:
      "In two sum, a nested loop checks every pair. A hash map turns the second lookup into a constant-time question: have I seen the complement?",
    commonMistakes: [
      "Off-by-one loop bounds",
      "Skipping empty input",
      "Using nested loops when a map or two pointers fits",
    ],
    quickCheck: "If you move from index `i` to `i + 1`, what invariant still holds?",
    practiceLadder: ["Find maximum", "Move zeros", "Two sum with a hash map"],
  },
  {
    slug: "strings",
    name: "Strings",
    category: "Data Structures",
    description: "Character sequences, parsing, matching, and frequency patterns.",
    overview:
      "String problems often reduce to arrays of characters plus hashing, two pointers, tries, or dynamic programming for matching and subsequences.",
    operations: [
      { name: "Index character", time: "O(1)", space: "O(1)" },
      { name: "Substring", time: "O(k)", space: "O(k)" },
      { name: "Repeated concatenation", time: "O(n^2)", space: "O(n)" },
    ],
    commonPatterns: [
      { name: "Two Pointers", slug: "two-pointers" },
      { name: "Hashing", slug: "hashing" },
    ],
    prerequisites: ["arrays"],
    whenToUse: "Use strings for ordered text data, tokens, encodings, and sequence matching.",
    whenToAvoid:
      "Avoid repeated immutable concatenation in loops when an array join or builder is cheaper.",
    maangFrequency: "High",
    mentalModel:
      "Treat text as an indexed sequence, then decide whether order, counts, or positions matter most.",
    workedExample:
      "For an anagram check, sorting works, but a frequency map explains the concept directly: each character count must cancel to zero.",
    commonMistakes: [
      "Ignoring case or spaces",
      "Using substring copies in loops",
      "Confusing character count with position",
    ],
    quickCheck: "Does the solution depend on character order, character counts, or both?",
    practiceLadder: ["Reverse a string", "Valid anagram", "Longest substring without repeats"],
  },
  {
    slug: "hashing",
    name: "Hashing",
    category: "Data Structures",
    description: "Key-value storage for fast lookup, counting, grouping, and duplicate detection.",
    overview:
      "Hash tables trade extra memory for average constant-time operations and power frequency maps, seen sets, memoization, and grouping.",
    operations: [
      { name: "Lookup", time: "O(1) avg", space: "O(1)" },
      { name: "Insert", time: "O(1) avg", space: "O(1)" },
      { name: "Iterate keys", time: "O(n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Frequency Map", slug: "hashing" },
      { name: "Dynamic Programming", slug: "dp" },
    ],
    prerequisites: ["arrays"],
    whenToUse:
      "Use hashing when you need fast membership checks, counts, indexes, or memoized answers.",
    whenToAvoid:
      "Avoid hashing when deterministic ordering, tiny memory use, or range queries matter more.",
    maangFrequency: "High",
    mentalModel:
      "A hash table turns a search question into a naming question: what key would let me answer this in one lookup?",
    workedExample:
      "For duplicate detection, a set stores every value already seen. The first value that is already in the set proves the duplicate.",
    commonMistakes: [
      "Using the value when the key should be a count",
      "Forgetting collision or ordering assumptions",
      "Not updating the map at the right time",
    ],
    quickCheck: "What exact key answers the next lookup in constant average time?",
    practiceLadder: ["Contains duplicate", "Two sum", "Group anagrams"],
  },
  {
    slug: "linked-lists",
    name: "Linked Lists",
    category: "Data Structures",
    description: "Node chains with pointer updates, traversal, and structural edge cases.",
    overview:
      "Linked lists test pointer discipline. Correctness depends on preserving the next node before changing links.",
    operations: [
      { name: "Visit all nodes", time: "O(n)", space: "O(1)" },
      { name: "Insert after node", time: "O(1)", space: "O(1)" },
      { name: "Find by value", time: "O(n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Two Pointers", slug: "two-pointers" },
      { name: "Stacks", slug: "stacks" },
    ],
    prerequisites: ["arrays"],
    whenToUse:
      "Use linked lists when local insertions and deletions matter and random access does not.",
    whenToAvoid:
      "Avoid linked lists when index access, cache locality, or simple scanning performance matters.",
    maangFrequency: "Medium",
    mentalModel:
      "Each node only knows the next step. Keep a handle to anything you might need after rewiring.",
    workedExample:
      "To reverse a list, store `next`, point `current.next` to `previous`, then advance both pointers.",
    commonMistakes: [
      "Losing the rest of the list",
      "Not handling empty or one-node lists",
      "Creating cycles accidentally",
    ],
    quickCheck: "After the pointer update, can you still reach every remaining node?",
    practiceLadder: ["Reverse list", "Middle node", "Detect cycle"],
  },
  {
    slug: "stacks",
    name: "Stacks",
    category: "Data Structures",
    description: "Last-in first-out storage for nested state, parsing, and backtracking.",
    overview:
      "Stacks keep the most recent unresolved item on top, which makes them natural for brackets, monotonic scans, and DFS.",
    operations: [
      { name: "Push", time: "O(1)", space: "O(1)" },
      { name: "Pop", time: "O(1)", space: "O(1)" },
      { name: "Scan with stack", time: "O(n)", space: "O(n)" },
    ],
    commonPatterns: [
      { name: "Recursion", slug: "recursion" },
      { name: "Backtracking", slug: "backtracking" },
    ],
    prerequisites: ["arrays"],
    whenToUse: "Use a stack when the newest unresolved item must be handled first.",
    whenToAvoid: "Avoid a stack when you need oldest-first processing or random access.",
    maangFrequency: "Medium",
    mentalModel:
      "A stack is a pile of pending decisions. The top item is the only one you can resolve now.",
    workedExample:
      "For valid parentheses, push opening brackets and pop only when the closing bracket matches the top.",
    commonMistakes: [
      "Popping an empty stack",
      "Not checking the stack after the scan",
      "Using a queue for nested structure",
    ],
    quickCheck: "What does the top of the stack represent at this exact point?",
    practiceLadder: ["Valid parentheses", "Min stack", "Daily temperatures"],
  },
  {
    slug: "queues",
    name: "Queues",
    category: "Data Structures",
    description: "First-in first-out storage for level order and shortest unweighted paths.",
    overview:
      "Queues process the oldest pending item first, which is why breadth-first search visits nodes by distance.",
    operations: [
      { name: "Enqueue", time: "O(1)", space: "O(1)" },
      { name: "Dequeue", time: "O(1)", space: "O(1)" },
      { name: "BFS traversal", time: "O(V+E)", space: "O(V)" },
    ],
    commonPatterns: [
      { name: "Graphs", slug: "graphs" },
      { name: "Trees", slug: "trees" },
    ],
    prerequisites: ["arrays"],
    whenToUse: "Use queues for level order, nearest target, and first-come processing.",
    whenToAvoid:
      "Avoid queues when depth-first path state or last-in first-out behavior is required.",
    maangFrequency: "Medium",
    mentalModel:
      "A queue is a line of pending work. Every item waits its turn, so distance layers stay ordered.",
    workedExample:
      "In a grid shortest path, push the start cell, then push valid neighbors once. The first time you reach a cell is its shortest distance.",
    commonMistakes: [
      "Marking visited too late",
      "Mixing levels without tracking distance",
      "Using array shift in JavaScript for large queues",
    ],
    quickCheck: "When do you mark a node visited: when enqueued or when dequeued?",
    practiceLadder: ["Binary tree level order", "Rotting oranges", "Shortest path in a grid"],
  },
  {
    slug: "recursion",
    name: "Recursion",
    category: "Foundations",
    description: "Functions that solve a problem by calling themselves on smaller inputs.",
    overview:
      "Recursive solutions need a clear base case, progress toward that base case, and a way to combine subresults.",
    operations: [
      { name: "Function call", time: "Problem dependent", space: "O(depth)" },
      { name: "Tree recursion", time: "O(branch^depth)", space: "O(depth)" },
      { name: "Memoized recursion", time: "O(states)", space: "O(states)" },
    ],
    commonPatterns: [
      { name: "Trees", slug: "trees" },
      { name: "Dynamic Programming", slug: "dp" },
    ],
    prerequisites: [],
    whenToUse:
      "Use recursion for trees, divide and conquer, backtracking, and naturally nested problems.",
    whenToAvoid: "Avoid recursion when stack depth can overflow or a simple loop is clearer.",
    maangFrequency: "High",
    mentalModel:
      "Define the smallest answer, then trust the same function to solve the smaller version.",
    workedExample:
      "For tree height, the base case returns 0 for null. Each node returns 1 plus the larger child height.",
    commonMistakes: [
      "Missing base case",
      "No progress toward the base case",
      "Combining child results incorrectly",
    ],
    quickCheck: "What smaller input is guaranteed after each call?",
    practiceLadder: ["Factorial", "Tree height", "Generate subsets"],
  },
  {
    slug: "two-pointers",
    name: "Two Pointers",
    category: "Patterns",
    description: "Paired indexes that scan, shrink windows, or avoid nested loops.",
    overview:
      "Two pointers reduce many array and string problems from nested loops to linear scans by maintaining a meaningful pair or window.",
    operations: [
      { name: "Opposite ends", time: "O(n)", space: "O(1)" },
      { name: "Same direction", time: "O(n)", space: "O(1)" },
      { name: "Window movement", time: "O(n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Arrays", slug: "arrays" },
      { name: "Strings", slug: "strings" },
    ],
    prerequisites: ["arrays"],
    whenToUse: "Use two pointers for sorted arrays, pairs, palindromes, partitions, and windows.",
    whenToAvoid: "Avoid it when unordered data needs arbitrary lookup instead.",
    maangFrequency: "High",
    mentalModel:
      "Each pointer has a job. Moving one pointer must preserve or improve the search state.",
    workedExample:
      "For a sorted two sum, move the left pointer when the sum is too small and the right pointer when it is too large.",
    commonMistakes: [
      "Moving both pointers without reason",
      "Using it on unsorted input",
      "Breaking the loop condition",
    ],
    quickCheck: "What fact justifies moving this pointer and not the other one?",
    practiceLadder: ["Valid palindrome", "Sorted two sum", "Container with most water"],
  },
  {
    slug: "sliding-window",
    name: "Sliding Window",
    category: "Patterns",
    description: "A moving range that tracks enough state to answer each position once.",
    overview:
      "Sliding window keeps a range and updates counts, sums, or constraints as the range grows and shrinks.",
    operations: [
      { name: "Expand right", time: "O(1)", space: "State dependent" },
      { name: "Shrink left", time: "O(1)", space: "State dependent" },
      { name: "Full scan", time: "O(n)", space: "State dependent" },
    ],
    commonPatterns: [
      { name: "Two Pointers", slug: "two-pointers" },
      { name: "Hashing", slug: "hashing" },
    ],
    prerequisites: ["arrays", "two-pointers"],
    whenToUse: "Use sliding window for contiguous ranges with a constraint or aggregate value.",
    whenToAvoid: "Avoid it when the chosen elements do not need to be contiguous.",
    maangFrequency: "High",
    mentalModel:
      "The window is the current candidate. Expand to include more, shrink only when the invariant breaks.",
    workedExample:
      "For longest substring without repeats, expand right, count characters, then shrink left until all counts are valid.",
    commonMistakes: [
      "Forgetting to remove left-side state",
      "Updating the answer before restoring the invariant",
      "Using it for subsequences",
    ],
    quickCheck: "What invariant must be true before you record an answer?",
    practiceLadder: [
      "Maximum subarray sum size k",
      "Longest substring without repeats",
      "Minimum window substring",
    ],
  },
  {
    slug: "binary-search",
    name: "Binary Search",
    category: "Algorithms",
    description: "Halve a sorted or monotonic search space with each comparison.",
    overview:
      "Binary search works when one side of a decision can be safely discarded after each check.",
    operations: [
      { name: "Midpoint check", time: "O(1)", space: "O(1)" },
      { name: "Search", time: "O(log n)", space: "O(1)" },
      { name: "Answer search", time: "O(log range * check)", space: "Check dependent" },
    ],
    commonPatterns: [
      { name: "Sorting", slug: "sorting" },
      { name: "Complexity Analysis", slug: "complexity" },
    ],
    prerequisites: ["arrays", "sorting"],
    whenToUse: "Use binary search when sorted data or a monotonic predicate lets you discard half.",
    whenToAvoid: "Avoid it when the predicate is not monotonic or a direct map lookup is simpler.",
    maangFrequency: "High",
    mentalModel: "Ask a yes-or-no question where all answers on one side behave the same way.",
    workedExample:
      "For first bad version, if mid is bad, the first bad version is at mid or left of it. Otherwise it is right of mid.",
    commonMistakes: [
      "Infinite loops from wrong bounds",
      "Overflowing midpoint in some languages",
      "Using it without a monotonic condition",
    ],
    quickCheck: "Which half is impossible after this comparison?",
    practiceLadder: ["Classic search", "First occurrence", "Minimum capacity to ship packages"],
  },
  {
    slug: "sorting",
    name: "Sorting",
    category: "Algorithms",
    description: "Order data to simplify search, grouping, greedy choices, and comparisons.",
    overview:
      "Sorting often unlocks simpler scans, two-pointer solutions, duplicate grouping, interval merging, and binary search.",
    operations: [
      { name: "Comparison sort", time: "O(n log n)", space: "O(log n) to O(n)" },
      { name: "Counting sort", time: "O(n+k)", space: "O(k)" },
      { name: "Merge sorted arrays", time: "O(n+m)", space: "O(1) to O(n+m)" },
    ],
    commonPatterns: [
      { name: "Two Pointers", slug: "two-pointers" },
      { name: "Binary Search", slug: "binary-search" },
    ],
    prerequisites: ["arrays"],
    whenToUse:
      "Use sorting when order helps remove nested loops, group values, or make greedy choices valid.",
    whenToAvoid:
      "Avoid sorting when original order must be preserved or hashing solves it in linear time.",
    maangFrequency: "High",
    mentalModel:
      "Sorting buys structure. After sorting, neighbors and pointer movement become meaningful.",
    workedExample:
      "For interval merging, sort by start time, then only compare the current interval with the last merged interval.",
    commonMistakes: [
      "Sorting when index order must be returned",
      "Forgetting tie breakers",
      "Assuming sort is linear",
    ],
    quickCheck: "What simpler operation becomes possible after ordering the data?",
    practiceLadder: ["Merge intervals", "Sort colors", "K closest points"],
  },
  {
    slug: "trees",
    name: "Trees",
    category: "Data Structures",
    description: "Hierarchical data with traversal, recursion, and path reasoning.",
    overview:
      "Trees model hierarchy and recursive structure. Traversal order controls whether you solve top-down, bottom-up, level-order, or path-based problems.",
    operations: [
      { name: "Visit all nodes", time: "O(n)", space: "O(h)" },
      { name: "Find height", time: "O(n)", space: "O(h)" },
      { name: "Level order", time: "O(n)", space: "O(w)" },
    ],
    commonPatterns: [
      { name: "Recursion", slug: "recursion" },
      { name: "Queues", slug: "queues" },
    ],
    prerequisites: ["recursion"],
    whenToUse:
      "Use trees for hierarchical data, divide and conquer recursion, and ancestor or subtree questions.",
    whenToAvoid:
      "Avoid plain trees for unordered lookup when hashing or balanced search trees are more direct.",
    maangFrequency: "High",
    mentalModel: "A tree problem is usually one local question repeated at every node.",
    workedExample:
      "For diameter, each node asks for left height and right height. The best path through that node is their sum.",
    commonMistakes: [
      "Confusing node height with edge count",
      "Using global state without resetting it",
      "Ignoring null children",
    ],
    quickCheck: "Is this traversal top-down, bottom-up, or level-order?",
    practiceLadder: ["Maximum depth", "Invert tree", "Lowest common ancestor"],
  },
  {
    slug: "bst",
    name: "Binary Search Trees",
    category: "Data Structures",
    description: "Binary trees where left values are smaller and right values are larger.",
    overview:
      "BSTs combine tree traversal with ordering, enabling search, insertion, and sorted traversal when the tree is balanced.",
    operations: [
      { name: "Search", time: "O(h)", space: "O(1)" },
      { name: "Insert", time: "O(h)", space: "O(1)" },
      { name: "In-order traversal", time: "O(n)", space: "O(h)" },
    ],
    commonPatterns: [
      { name: "Trees", slug: "trees" },
      { name: "Binary Search", slug: "binary-search" },
    ],
    prerequisites: ["trees", "recursion"],
    whenToUse:
      "Use BSTs when ordered lookup, predecessor, successor, or sorted traversal is required.",
    whenToAvoid: "Avoid unbalanced BSTs when worst-case guarantees are required.",
    maangFrequency: "Medium",
    mentalModel:
      "Every node splits the search space into smaller values on the left and larger values on the right.",
    workedExample:
      "To validate a BST, carry a valid low and high range into each child, not just a comparison with the parent.",
    commonMistakes: [
      "Only comparing with the parent",
      "Forgetting duplicate rules",
      "Assuming the tree is balanced",
    ],
    quickCheck: "What range of values is valid at this node?",
    practiceLadder: ["Search BST", "Validate BST", "Kth smallest in BST"],
  },
  {
    slug: "heaps",
    name: "Heaps",
    category: "Data Structures",
    description: "Priority queues that expose the smallest or largest item efficiently.",
    overview:
      "Heaps are useful when the next item must be chosen by priority but the whole collection does not need to be sorted.",
    operations: [
      { name: "Peek", time: "O(1)", space: "O(1)" },
      { name: "Push", time: "O(log n)", space: "O(1)" },
      { name: "Pop", time: "O(log n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Sorting", slug: "sorting" },
      { name: "Greedy", slug: "greedy" },
    ],
    prerequisites: ["trees", "arrays"],
    whenToUse:
      "Use heaps for top-k, scheduling, streaming medians, and repeated best-choice problems.",
    whenToAvoid:
      "Avoid heaps when you need fast arbitrary lookup or full sorted order at every step.",
    maangFrequency: "Medium",
    mentalModel: "A heap gives you the next priority item, not a sorted list.",
    workedExample:
      "For top k frequent elements, count with a hash map, then keep a heap of the k strongest candidates.",
    commonMistakes: [
      "Expecting iteration to be sorted",
      "Using max heap when min heap keeps k items smaller",
      "Forgetting custom comparator behavior",
    ],
    quickCheck: "Do you need all items sorted or only the next highest priority item?",
    practiceLadder: ["Kth largest", "Top k frequent", "Merge k sorted lists"],
  },
  {
    slug: "graphs",
    name: "Graphs",
    category: "Data Structures",
    description: "Nodes connected by directed, undirected, weighted, or unweighted edges.",
    overview:
      "Graphs model relationships. Most graph solutions start by choosing a representation, then applying queue-based or recursive traversal.",
    operations: [
      { name: "Traverse adjacency list", time: "O(V+E)", space: "O(V)" },
      { name: "Add edge", time: "O(1)", space: "O(1)" },
      { name: "Check adjacency list edge", time: "O(deg(v))", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Queues", slug: "queues" },
      { name: "Recursion", slug: "recursion" },
    ],
    prerequisites: ["hashing", "queues", "recursion"],
    whenToUse:
      "Use graphs for networks, dependencies, grids, connectivity, paths, and relationship problems.",
    whenToAvoid:
      "Avoid graph modeling when the data is naturally linear or hierarchical and simpler structures solve it.",
    maangFrequency: "High",
    mentalModel:
      "First decide what a node is, what an edge is, and how you will avoid visiting the same node twice.",
    workedExample:
      "For number of islands, each land cell is a node. A traversal marks all connected land in one island.",
    commonMistakes: [
      "No visited set",
      "Mixing row and column bounds",
      "Choosing matrix scan when adjacency list is easier",
    ],
    quickCheck: "What are the nodes, what are the edges, and when is a node marked visited?",
    practiceLadder: ["Flood fill", "Number of islands", "Course schedule"],
  },
  {
    slug: "dp",
    name: "Dynamic Programming",
    category: "Algorithms",
    description: "Reuse overlapping subproblem results for counting, optimization, and choices.",
    overview:
      "Dynamic programming works when a problem has repeated subproblems and optimal substructure. Define state, transition, base cases, and iteration order.",
    operations: [
      { name: "Memoized state", time: "O(states * transition)", space: "O(states)" },
      { name: "Tabulation", time: "O(states * transition)", space: "O(states)" },
      { name: "Space optimized DP", time: "O(states * transition)", space: "O(window)" },
    ],
    commonPatterns: [
      { name: "Recursion", slug: "recursion" },
      { name: "Hashing", slug: "hashing" },
    ],
    prerequisites: ["recursion", "arrays"],
    whenToUse:
      "Use DP for counting, optimization, subsequences, partitions, and choices with overlapping subproblems.",
    whenToAvoid:
      "Avoid DP when greedy, sorting, or one pass solves the problem without repeated states.",
    maangFrequency: "High",
    mentalModel:
      "Name the state, define the answer for that state, then reuse smaller states instead of recomputing them.",
    workedExample:
      "For climbing stairs, `dp[i]` means ways to reach step i. The transition is `dp[i - 1] + dp[i - 2]`.",
    commonMistakes: [
      "Undefined state meaning",
      "Wrong base cases",
      "Using DP when no subproblem repeats",
    ],
    quickCheck: "What exactly does one DP cell or memo key mean?",
    practiceLadder: ["Climbing stairs", "House robber", "Longest common subsequence"],
  },
  {
    slug: "greedy",
    name: "Greedy",
    category: "Algorithms",
    description: "Make the locally best valid choice when that choice can be proven safe.",
    overview: "Greedy algorithms work when a local decision never blocks an optimal global answer.",
    operations: [
      { name: "Choose candidate", time: "Problem dependent", space: "O(1)" },
      { name: "Sort then scan", time: "O(n log n)", space: "O(1) to O(n)" },
      { name: "Heap-assisted greedy", time: "O(n log n)", space: "O(n)" },
    ],
    commonPatterns: [
      { name: "Sorting", slug: "sorting" },
      { name: "Heaps", slug: "heaps" },
    ],
    prerequisites: ["sorting"],
    whenToUse:
      "Use greedy when you can justify a safe local choice with an exchange or invariant argument.",
    whenToAvoid: "Avoid greedy when current choices can block better future combinations.",
    maangFrequency: "Medium",
    mentalModel: "A greedy choice is a claim. The proof is why choosing it now cannot hurt later.",
    workedExample:
      "For activity selection, choosing the earliest finishing compatible activity leaves the most room for future activities.",
    commonMistakes: [
      "Choosing a local maximum without proof",
      "Forgetting to sort by the right key",
      "Missing counterexamples",
    ],
    quickCheck: "What proof says this local choice is safe?",
    practiceLadder: ["Assign cookies", "Non-overlapping intervals", "Jump game"],
  },
  {
    slug: "backtracking",
    name: "Backtracking",
    category: "Algorithms",
    description: "Controlled exhaustive search that builds candidates and undoes choices.",
    overview:
      "Backtracking explores decision trees with depth-first search, pruning invalid choices early and restoring state after each branch.",
    operations: [
      { name: "Generate subsets", time: "O(2^n)", space: "O(n)" },
      { name: "Generate permutations", time: "O(n!)", space: "O(n)" },
      { name: "Constraint search", time: "Exponential", space: "O(depth)" },
    ],
    commonPatterns: [
      { name: "Recursion", slug: "recursion" },
      { name: "Graphs", slug: "graphs" },
    ],
    prerequisites: ["recursion"],
    whenToUse:
      "Use backtracking for combinations, permutations, subsets, boards, and constraint satisfaction.",
    whenToAvoid: "Avoid it when greedy, DP, or graph shortest path gives polynomial guarantees.",
    maangFrequency: "Medium",
    mentalModel: "Make a choice, explore it, then undo the choice so the next branch starts clean.",
    workedExample: "For subsets, each position has two branches: include the value or skip it.",
    commonMistakes: [
      "Not undoing state",
      "Appending the same mutable object",
      "Missing pruning conditions",
    ],
    quickCheck: "What state must be restored before the next branch?",
    practiceLadder: ["Subsets", "Permutations", "N-Queens"],
  },
  {
    slug: "bit-manipulation",
    name: "Bit Manipulation",
    category: "Algorithms",
    description: "Use binary representation for flags, masks, parity, and low-level operations.",
    overview:
      "Bit manipulation uses the structure of binary numbers to compress state or answer parity and membership questions.",
    operations: [
      { name: "AND, OR, XOR", time: "O(1)", space: "O(1)" },
      { name: "Shift", time: "O(1)", space: "O(1)" },
      { name: "Mask scan", time: "O(bits)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Hashing", slug: "hashing" },
      { name: "Backtracking", slug: "backtracking" },
    ],
    prerequisites: ["arrays"],
    whenToUse: "Use bit operations for flags, parity, subsets, and compact integer state.",
    whenToAvoid:
      "Avoid bit tricks when clear arithmetic or sets make the solution easier to verify.",
    maangFrequency: "Medium",
    mentalModel:
      "Each bit is a tiny boolean. Masks let you read, set, clear, or toggle those booleans.",
    workedExample:
      "For single number, XOR cancels matching pairs because `x ^ x = 0` and `x ^ 0 = x`.",
    commonMistakes: [
      "Confusing bit index with value",
      "Forgetting signed integer limits",
      "Using clever code without a clear invariant",
    ],
    quickCheck: "What does each bit position represent?",
    practiceLadder: ["Single number", "Counting bits", "Subsets with masks"],
  },
  {
    slug: "complexity",
    name: "Complexity Analysis",
    category: "Foundations",
    description: "Reason about runtime, memory, and input-size tradeoffs.",
    overview:
      "Complexity analysis compares how algorithms scale, including time growth, auxiliary memory, recursion depth, and hidden copying costs.",
    operations: [
      { name: "Single loop", time: "O(n)", space: "O(1)" },
      { name: "Nested loops", time: "O(n^2)", space: "O(1)" },
      { name: "Divide in half", time: "O(log n)", space: "O(1)" },
    ],
    commonPatterns: [
      { name: "Sorting", slug: "sorting" },
      { name: "Dynamic Programming", slug: "dp" },
    ],
    prerequisites: [],
    whenToUse:
      "Use complexity analysis to compare approaches and predict whether a solution will pass constraints.",
    whenToAvoid:
      "Avoid relying only on Big O when constant factors, I/O, or small inputs dominate.",
    maangFrequency: "High",
    mentalModel: "Ask what happens when the input doubles. The answer reveals the growth pattern.",
    workedExample:
      "A nested loop over the same array often checks about n squared pairs, while a hash map can reduce lookup to linear time.",
    commonMistakes: [
      "Dropping a loop too early",
      "Ignoring copied slices",
      "Confusing output space and auxiliary space",
    ],
    quickCheck: "What line of code runs the most times as n grows?",
    practiceLadder: ["Classify loops", "Optimize two sum", "Compare recursion with memoization"],
  },
];

export const TOPIC_BY_SLUG = new Map(TOPICS.map((topic) => [topic.slug, topic]));

export const TOPIC_ALIASES: Record<string, TopicSlug> = {
  "hash-tables": "hashing",
  "binary-search-trees": "bst",
  "dynamic-programming": "dp",
  "time-complexity": "complexity",
  "space-complexity": "complexity",
  "breadth-first-search": "queues",
  "depth-first-search": "recursion",
};

export const CANONICAL_TOPIC_SLUGS = TOPICS.map((topic) => topic.slug);

export const VALID_TOPIC_SLUGS = new Set(CANONICAL_TOPIC_SLUGS);

export const TOPIC_CATEGORIES = Array.from(new Set(TOPICS.map((topic) => topic.category)));

export const PREREQUISITE_EDGES: Array<{ source: TopicSlug; target: TopicSlug }> = [
  { source: "arrays", target: "two-pointers" },
  { source: "arrays", target: "sliding-window" },
  { source: "arrays", target: "hashing" },
  { source: "arrays", target: "sorting" },
  { source: "sorting", target: "binary-search" },
  { source: "linked-lists", target: "stacks" },
  { source: "linked-lists", target: "queues" },
  { source: "stacks", target: "recursion" },
  { source: "recursion", target: "trees" },
  { source: "recursion", target: "backtracking" },
  { source: "recursion", target: "dp" },
  { source: "trees", target: "bst" },
  { source: "trees", target: "heaps" },
  { source: "trees", target: "graphs" },
  { source: "graphs", target: "dp" },
  { source: "greedy", target: "dp" },
  { source: "two-pointers", target: "sliding-window" },
  { source: "binary-search", target: "dp" },
  { source: "bit-manipulation", target: "hashing" },
  { source: "complexity", target: "sorting" },
];

export function normalizeTopicSlug(slug: string | null | undefined): TopicSlug | null {
  if (!slug) return null;
  return TOPIC_ALIASES[slug] ?? (VALID_TOPIC_SLUGS.has(slug) ? slug : null);
}

export function isValidTopicSlug(slug: string | null | undefined): slug is TopicSlug {
  return normalizeTopicSlug(slug) !== null;
}

export function getTopicBySlug(slug: string | null | undefined): TopicMeta | null {
  const normalized = normalizeTopicSlug(slug);
  return normalized ? (TOPIC_BY_SLUG.get(normalized) ?? null) : null;
}

export function topicDisplayName(slug: string | null | undefined): string {
  const topic = getTopicBySlug(slug);
  if (topic) return topic.name;
  if (!slug) return "Unknown Topic";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
