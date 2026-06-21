import type { TopicSlug } from "@/lib/topics";

export type MasteryBandId = "0-20" | "21-40" | "41-60" | "61-80" | "81-100";

export type CurriculumStage =
  | "foundation"
  | "core-structures"
  | "core-patterns"
  | "linear-structures"
  | "recursive-structures"
  | "advanced-patterns";

export type CurriculumDepth = "deep" | "scaffold";

export interface MasteryBand {
  id: MasteryBandId;
  min: number;
  max: number;
  label: string;
  generationRule: string;
  hintRule: string;
  promotionCriteria: string[];
}

export interface MasteryBandRules {
  band: MasteryBand;
  problemScope: string;
  visibleTestCount: number;
  hiddenTestCount: number;
  maxRecommendedHints: number;
}

export interface CurriculumProblemTemplate {
  title: string;
  objective: string;
  functionName: string;
  inputShape: string;
  expectedPattern: string;
  visibleTestThemes: string[];
  hiddenTestThemes: string[];
}

export interface CurriculumNode {
  id: string;
  stage: CurriculumStage;
  order: number;
  title: string;
  primaryTopicSlug: TopicSlug | null;
  prerequisiteNodeIds: string[];
  prerequisiteTopicSlugs: TopicSlug[];
  supportedBands: MasteryBandId[];
  depth: CurriculumDepth;
  objective: string;
  concepts: string[];
  practicePatterns: string[];
  promotionCriteria: string[];
  problemTemplates: CurriculumProblemTemplate[];
}

export const MASTERY_BANDS: MasteryBand[] = [
  {
    id: "0-20",
    min: 0,
    max: 0.2,
    label: "Concept drill",
    generationRule: "Use one idea, tiny inputs, direct names, and no trick cases.",
    hintRule: "Show a three-step hint ladder with the loop or condition named directly.",
    promotionCriteria: [
      "Passes visible tests with at most one failed run",
      "Can state the loop or condition in plain language",
      "Handles the empty or smallest input when the concept allows it",
    ],
  },
  {
    id: "21-40",
    min: 0.2,
    max: 0.4,
    label: "Guided easy",
    generationRule: "Use a standard beginner problem with the pattern named in the objective.",
    hintRule: "Start with the invariant or data shape, then reveal implementation detail.",
    promotionCriteria: [
      "Passes visible tests",
      "Explains the main branch or loop",
      "Identifies one edge case without being shown",
    ],
  },
  {
    id: "41-60",
    min: 0.4,
    max: 0.6,
    label: "Standard easy",
    generationRule: "Use common easy problems with fewer hints and explicit complexity checks.",
    hintRule: "Prefer conceptual hints before code-shaped hints.",
    promotionCriteria: [
      "Passes visible tests and most hidden tests",
      "States time and space complexity",
      "Fixes an edge-case failure without changing the full approach",
    ],
  },
  {
    id: "61-80",
    min: 0.6,
    max: 0.8,
    label: "Medium bridge",
    generationRule: "Combine the topic with one prerequisite and include mixed edge cases.",
    hintRule: "Use sparse hints that point to the missing invariant or data structure.",
    promotionCriteria: [
      "Passes visible tests and hidden-test checks",
      "Explains why the chosen pattern fits",
      "Recognizes when a simpler brute-force approach is too slow",
    ],
  },
  {
    id: "81-100",
    min: 0.8,
    max: 1,
    label: "Interview variant",
    generationRule: "Use compact variants with minimal hints and a review prompt after solving.",
    hintRule: "Offer only high-level direction unless the learner asks for more.",
    promotionCriteria: [
      "Solves with minimal hint usage",
      "Compares at least two approaches",
      "Retains the concept on a spaced review problem",
    ],
  },
];

export const MASTERY_BAND_BY_ID = new Map(MASTERY_BANDS.map((band) => [band.id, band]));

export const MASTERY_BAND_RULES: Record<MasteryBandId, Omit<MasteryBandRules, "band">> = {
  "0-20": {
    problemScope: "one concept, one branch or loop, tiny input size",
    visibleTestCount: 2,
    hiddenTestCount: 2,
    maxRecommendedHints: 3,
  },
  "21-40": {
    problemScope: "one named pattern with examples and a small edge case",
    visibleTestCount: 3,
    hiddenTestCount: 2,
    maxRecommendedHints: 3,
  },
  "41-60": {
    problemScope: "standard easy problem with explicit complexity expectation",
    visibleTestCount: 3,
    hiddenTestCount: 3,
    maxRecommendedHints: 2,
  },
  "61-80": {
    problemScope: "medium bridge problem with one prerequisite concept mixed in",
    visibleTestCount: 4,
    hiddenTestCount: 4,
    maxRecommendedHints: 2,
  },
  "81-100": {
    problemScope: "interview-style variant with minimal scaffolding",
    visibleTestCount: 4,
    hiddenTestCount: 5,
    maxRecommendedHints: 1,
  },
};

export const CODEWISE_DSA_LADDER: CurriculumNode[] = [
  {
    id: "foundation-io",
    stage: "foundation",
    order: 10,
    title: "Input, Output, And Values",
    primaryTopicSlug: null,
    prerequisiteNodeIds: [],
    prerequisiteTopicSlugs: [],
    supportedBands: ["0-20", "21-40"],
    depth: "deep",
    objective: "Read small values, store them in variables, and return or print a direct result.",
    concepts: ["input", "output", "variables", "types", "return values"],
    practicePatterns: ["read one value", "combine two values", "format a result"],
    promotionCriteria: [
      "Uses variables with clear names",
      "Returns the expected value instead of printing when a function signature is provided",
      "Handles one example with zero or an empty string when relevant",
    ],
    problemTemplates: [
      {
        title: "Return The Sum",
        objective: "Use parameters and return their sum.",
        functionName: "sum_two",
        inputShape: "Two integers",
        expectedPattern: "Direct arithmetic expression",
        visibleTestThemes: ["positive numbers", "zero"],
        hiddenTestThemes: ["negative number", "large number"],
      },
      {
        title: "Build A Greeting",
        objective: "Combine a string input with fixed text.",
        functionName: "build_greeting",
        inputShape: "One string",
        expectedPattern: "String concatenation or interpolation",
        visibleTestThemes: ["short name", "single-letter name"],
        hiddenTestThemes: ["name with space", "empty string"],
      },
    ],
  },
  {
    id: "foundation-conditions",
    stage: "foundation",
    order: 20,
    title: "Conditionals And Decisions",
    primaryTopicSlug: null,
    prerequisiteNodeIds: ["foundation-io"],
    prerequisiteTopicSlugs: [],
    supportedBands: ["0-20", "21-40", "41-60"],
    depth: "deep",
    objective: "Choose the correct branch with if, else if, and else for small decision problems.",
    concepts: ["boolean expressions", "comparison", "branch order", "edge cases"],
    practicePatterns: ["classify a number", "choose a label", "handle boundary values"],
    promotionCriteria: [
      "Checks equality and boundary cases correctly",
      "Orders branches from specific to general when needed",
      "Avoids duplicate branches for the same outcome",
    ],
    problemTemplates: [
      {
        title: "Classify Temperature",
        objective: "Return a label based on numeric ranges.",
        functionName: "classify_temperature",
        inputShape: "One integer",
        expectedPattern: "Ordered conditional branches",
        visibleTestThemes: ["below range", "inside range", "above range"],
        hiddenTestThemes: ["exact lower boundary", "exact upper boundary"],
      },
      {
        title: "Is Even",
        objective: "Use modulo to decide whether a number is even.",
        functionName: "is_even",
        inputShape: "One integer",
        expectedPattern: "Modulo comparison",
        visibleTestThemes: ["even positive", "odd positive"],
        hiddenTestThemes: ["zero", "negative odd"],
      },
    ],
  },
  {
    id: "foundation-loops",
    stage: "foundation",
    order: 30,
    title: "Loops And Accumulators",
    primaryTopicSlug: null,
    prerequisiteNodeIds: ["foundation-conditions"],
    prerequisiteTopicSlugs: [],
    supportedBands: ["0-20", "21-40", "41-60"],
    depth: "deep",
    objective: "Repeat work over a known range or collection while maintaining one accumulator.",
    concepts: ["for loops", "while loops", "accumulators", "loop bounds", "invariants"],
    practicePatterns: ["sum a range", "count matches", "find a running value"],
    promotionCriteria: [
      "Initializes the accumulator before the loop",
      "Updates the accumulator inside the loop",
      "Uses loop bounds that include every intended item exactly once",
    ],
    problemTemplates: [
      {
        title: "Sum From One To N",
        objective: "Accumulate a sum across a numeric range.",
        functionName: "sum_to_n",
        inputShape: "One non-negative integer",
        expectedPattern: "Loop with numeric accumulator",
        visibleTestThemes: ["n equals 1", "small n"],
        hiddenTestThemes: ["n equals 0", "larger n"],
      },
      {
        title: "Count Positive Numbers",
        objective: "Count values that satisfy a condition.",
        functionName: "count_positive",
        inputShape: "List of integers",
        expectedPattern: "Loop with conditional increment",
        visibleTestThemes: ["mixed signs", "all positive"],
        hiddenTestThemes: ["empty list", "all non-positive"],
      },
    ],
  },
  {
    id: "foundation-functions",
    stage: "foundation",
    order: 40,
    title: "Functions And Contracts",
    primaryTopicSlug: null,
    prerequisiteNodeIds: ["foundation-loops"],
    prerequisiteTopicSlugs: [],
    supportedBands: ["0-20", "21-40", "41-60"],
    depth: "deep",
    objective:
      "Implement a function from a signature, examples, and constraints without changing the contract.",
    concepts: ["function signature", "parameters", "return type", "pure function", "tests"],
    practicePatterns: ["fill a function body", "return a computed value", "preserve input"],
    promotionCriteria: [
      "Keeps the expected function name and parameter order",
      "Returns the value instead of using unrelated I/O",
      "Uses examples to confirm the function contract",
    ],
    problemTemplates: [
      {
        title: "Apply Discount",
        objective: "Return a computed number from two parameters.",
        functionName: "apply_discount",
        inputShape: "Price and percent",
        expectedPattern: "Pure function with arithmetic",
        visibleTestThemes: ["normal discount", "zero discount"],
        hiddenTestThemes: ["full discount", "decimal price"],
      },
    ],
  },
  {
    id: "foundation-simple-math",
    stage: "foundation",
    order: 50,
    title: "Simple Math And Remainders",
    primaryTopicSlug: null,
    prerequisiteNodeIds: ["foundation-functions"],
    prerequisiteTopicSlugs: [],
    supportedBands: ["0-20", "21-40", "41-60"],
    depth: "deep",
    objective:
      "Use arithmetic, division, modulo, and rounding rules in small deterministic problems.",
    concepts: ["integer arithmetic", "modulo", "rounding", "absolute value"],
    practicePatterns: ["divisibility", "last digit", "bounded arithmetic"],
    promotionCriteria: [
      "Chooses integer or decimal arithmetic intentionally",
      "Handles zero when division is not required",
      "Explains why modulo gives the needed remainder",
    ],
    problemTemplates: [
      {
        title: "Last Digit",
        objective: "Use modulo to get the final digit of a non-negative number.",
        functionName: "last_digit",
        inputShape: "One non-negative integer",
        expectedPattern: "Modulo by 10",
        visibleTestThemes: ["single digit", "multi-digit"],
        hiddenTestThemes: ["zero", "number ending in zero"],
      },
    ],
  },
  {
    id: "foundation-dry-runs",
    stage: "foundation",
    order: 60,
    title: "Dry Runs And Trace Tables",
    primaryTopicSlug: null,
    prerequisiteNodeIds: ["foundation-simple-math"],
    prerequisiteTopicSlugs: [],
    supportedBands: ["0-20", "21-40", "41-60"],
    depth: "deep",
    objective: "Trace variable changes through a short loop or branch before writing code.",
    concepts: ["trace table", "state change", "index", "accumulator"],
    practicePatterns: ["fill missing state", "predict output", "repair one wrong update"],
    promotionCriteria: [
      "Can trace at least three loop iterations",
      "Names the variable that changes each iteration",
      "Uses the trace to explain a failed test",
    ],
    problemTemplates: [
      {
        title: "Trace The Counter",
        objective: "Predict and implement a counter update across a small list.",
        functionName: "count_matches",
        inputShape: "List of integers and one target",
        expectedPattern: "Trace a conditional counter",
        visibleTestThemes: ["target appears once", "target appears multiple times"],
        hiddenTestThemes: ["target absent", "empty list"],
      },
    ],
  },
  {
    id: "foundation-complexity",
    stage: "foundation",
    order: 70,
    title: "Basic Time And Space Complexity",
    primaryTopicSlug: "complexity",
    prerequisiteNodeIds: ["foundation-dry-runs"],
    prerequisiteTopicSlugs: [],
    supportedBands: ["0-20", "21-40", "41-60"],
    depth: "deep",
    objective: "Explain the cost of one loop, nested loops, and simple extra storage.",
    concepts: ["O(1)", "O(n)", "O(n^2)", "extra space", "input size"],
    practicePatterns: ["classify loop cost", "compare two solutions", "count operations"],
    promotionCriteria: [
      "Identifies the input size",
      "Classifies a single loop as O(n)",
      "Explains why nested loops are usually O(n^2)",
    ],
    problemTemplates: [
      {
        title: "Pick The Faster Count",
        objective: "Implement a linear count and explain why it is O(n).",
        functionName: "count_greater_than",
        inputShape: "List of integers and one threshold",
        expectedPattern: "Single scan",
        visibleTestThemes: ["mixed values", "all above threshold"],
        hiddenTestThemes: ["empty list", "all below threshold"],
      },
    ],
  },
  {
    id: "arrays-basics",
    stage: "core-structures",
    order: 100,
    title: "Array Traversal Basics",
    primaryTopicSlug: "arrays",
    prerequisiteNodeIds: ["foundation-complexity"],
    prerequisiteTopicSlugs: ["complexity"],
    supportedBands: ["0-20", "21-40", "41-60", "61-80"],
    depth: "deep",
    objective: "Traverse arrays safely to find, count, transform, or compare values.",
    concepts: ["index", "length", "empty array", "single pass", "sentinel value"],
    practicePatterns: ["find maximum", "count frequency", "reverse copy", "move matching items"],
    promotionCriteria: [
      "Handles empty and one-item arrays",
      "Uses one pass when a single pass is enough",
      "Explains the loop invariant for the current best or count",
    ],
    problemTemplates: [
      {
        title: "Find Maximum Value",
        objective: "Track the largest value while scanning the array once.",
        functionName: "find_maximum",
        inputShape: "Non-empty list of integers",
        expectedPattern: "Initialize from the first item, then scan",
        visibleTestThemes: ["maximum at end", "maximum at start"],
        hiddenTestThemes: ["single item", "negative numbers"],
      },
      {
        title: "Count A Target",
        objective: "Count how many times one value appears.",
        functionName: "count_target",
        inputShape: "List of integers and one target",
        expectedPattern: "Single loop with conditional counter",
        visibleTestThemes: ["multiple matches", "no matches"],
        hiddenTestThemes: ["empty list", "all values match"],
      },
    ],
  },
  {
    id: "strings-basics",
    stage: "core-structures",
    order: 110,
    title: "String Traversal Basics",
    primaryTopicSlug: "strings",
    prerequisiteNodeIds: ["arrays-basics"],
    prerequisiteTopicSlugs: ["arrays"],
    supportedBands: ["0-20", "21-40", "41-60", "61-80"],
    depth: "deep",
    objective: "Treat strings as indexed sequences and solve basic character problems.",
    concepts: ["character", "index", "case", "palindrome", "frequency"],
    practicePatterns: ["count a character", "reverse text", "check palindrome", "normalize text"],
    promotionCriteria: [
      "Handles empty and one-character strings",
      "Uses two pointers when comparing both ends",
      "Separates normalization from the main check when needed",
    ],
    problemTemplates: [
      {
        title: "Count Character",
        objective: "Count how many times one character appears in a string.",
        functionName: "count_character",
        inputShape: "String and one character",
        expectedPattern: "Loop through characters with a counter",
        visibleTestThemes: ["character appears", "character absent"],
        hiddenTestThemes: ["empty string", "case difference"],
      },
      {
        title: "Simple Palindrome",
        objective: "Check whether a string reads the same forward and backward.",
        functionName: "is_palindrome",
        inputShape: "One lowercase string",
        expectedPattern: "Two pointers or reversed comparison",
        visibleTestThemes: ["odd length palindrome", "not a palindrome"],
        hiddenTestThemes: ["empty string", "single character"],
      },
    ],
  },
  {
    id: "hashing-basics",
    stage: "core-structures",
    order: 120,
    title: "Hashing And Frequency Maps",
    primaryTopicSlug: "hashing",
    prerequisiteNodeIds: ["arrays-basics", "strings-basics"],
    prerequisiteTopicSlugs: ["arrays", "strings"],
    supportedBands: ["0-20", "21-40", "41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Use a map or set to track seen values, counts, and quick membership checks.",
    concepts: ["set", "map", "frequency", "membership", "complement"],
    practicePatterns: ["contains duplicate", "two sum", "valid anagram"],
    promotionCriteria: [
      "Chooses set or map based on whether counts are needed",
      "Explains the lookup key",
      "Handles duplicate values intentionally",
    ],
    problemTemplates: [],
  },
  {
    id: "two-pointers-basics",
    stage: "core-patterns",
    order: 130,
    title: "Two Pointers",
    primaryTopicSlug: "two-pointers",
    prerequisiteNodeIds: ["arrays-basics", "strings-basics"],
    prerequisiteTopicSlugs: ["arrays", "strings"],
    supportedBands: ["21-40", "41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Move two indexes through an array or string while preserving a simple invariant.",
    concepts: ["left pointer", "right pointer", "sorted input", "converging scan"],
    practicePatterns: ["reverse array", "sorted two sum", "valid palindrome"],
    promotionCriteria: [
      "Updates the correct pointer",
      "Explains why the scan stops",
      "Avoids checking pairs that the invariant already excludes",
    ],
    problemTemplates: [],
  },
  {
    id: "sliding-window-basics",
    stage: "core-patterns",
    order: 140,
    title: "Sliding Window",
    primaryTopicSlug: "sliding-window",
    prerequisiteNodeIds: ["arrays-basics", "hashing-basics"],
    prerequisiteTopicSlugs: ["arrays", "hashing"],
    supportedBands: ["21-40", "41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Maintain a moving range and update its state without recomputing from scratch.",
    concepts: ["window bounds", "fixed window", "variable window", "frequency inside window"],
    practicePatterns: ["max sum of size k", "longest substring without repeats"],
    promotionCriteria: [
      "Updates window state when left or right moves",
      "Knows whether the window size is fixed or variable",
      "Avoids nested recomputation for each window",
    ],
    problemTemplates: [],
  },
  {
    id: "binary-search-basics",
    stage: "core-patterns",
    order: 150,
    title: "Binary Search",
    primaryTopicSlug: "binary-search",
    prerequisiteNodeIds: ["arrays-basics", "foundation-complexity"],
    prerequisiteTopicSlugs: ["arrays", "complexity"],
    supportedBands: ["21-40", "41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Search a sorted range by discarding half of the remaining candidates each step.",
    concepts: ["sorted input", "midpoint", "left bound", "right bound", "termination"],
    practicePatterns: ["classic search", "first occurrence", "lower bound"],
    promotionCriteria: [
      "Keeps bounds valid after each update",
      "Handles absent targets",
      "Explains why each step removes half the search space",
    ],
    problemTemplates: [],
  },
  {
    id: "sorting-basics",
    stage: "core-patterns",
    order: 160,
    title: "Sorting Foundations",
    primaryTopicSlug: "sorting",
    prerequisiteNodeIds: ["arrays-basics", "foundation-complexity"],
    prerequisiteTopicSlugs: ["arrays", "complexity"],
    supportedBands: ["21-40", "41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Use sorted order to simplify comparison, grouping, or scanning problems.",
    concepts: ["order", "comparison", "stable grouping", "sort cost"],
    practicePatterns: ["sort colors", "merge intervals", "min difference pair"],
    promotionCriteria: [
      "Accounts for sort cost",
      "Uses sorted order in the follow-up scan",
      "Does not sort when order must be preserved",
    ],
    problemTemplates: [],
  },
  {
    id: "linked-lists-basics",
    stage: "linear-structures",
    order: 200,
    title: "Linked Lists",
    primaryTopicSlug: "linked-lists",
    prerequisiteNodeIds: ["two-pointers-basics"],
    prerequisiteTopicSlugs: ["two-pointers"],
    supportedBands: ["21-40", "41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Use node references to traverse, reverse, and reconnect linked structures.",
    concepts: ["node", "next pointer", "head", "dummy node", "cycle"],
    practicePatterns: ["reverse list", "middle node", "detect cycle"],
    promotionCriteria: [
      "Preserves the next pointer before rewiring",
      "Handles empty and one-node lists",
      "Uses fast and slow pointers when appropriate",
    ],
    problemTemplates: [],
  },
  {
    id: "stacks-basics",
    stage: "linear-structures",
    order: 210,
    title: "Stacks",
    primaryTopicSlug: "stacks",
    prerequisiteNodeIds: ["arrays-basics"],
    prerequisiteTopicSlugs: ["arrays"],
    supportedBands: ["21-40", "41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Use last-in first-out state for matching, undoing, or monotonic comparisons.",
    concepts: ["push", "pop", "top", "matching pairs", "monotonic stack"],
    practicePatterns: ["valid parentheses", "min stack", "daily temperatures"],
    promotionCriteria: [
      "Checks empty stack before reading the top",
      "Matches closing tokens with the latest opening token",
      "Explains what each stack entry represents",
    ],
    problemTemplates: [],
  },
  {
    id: "queues-basics",
    stage: "linear-structures",
    order: 220,
    title: "Queues",
    primaryTopicSlug: "queues",
    prerequisiteNodeIds: ["arrays-basics"],
    prerequisiteTopicSlugs: ["arrays"],
    supportedBands: ["21-40", "41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective:
      "Use first-in first-out state for level-by-level processing and breadth-first traversal.",
    concepts: ["enqueue", "dequeue", "front", "level order", "breadth-first search"],
    practicePatterns: ["level order traversal", "rotting oranges", "shortest path in grid"],
    promotionCriteria: [
      "Processes each queued item once",
      "Tracks level boundaries when distance matters",
      "Avoids adding the same state repeatedly",
    ],
    problemTemplates: [],
  },
  {
    id: "recursion-basics",
    stage: "recursive-structures",
    order: 300,
    title: "Recursion",
    primaryTopicSlug: "recursion",
    prerequisiteNodeIds: ["foundation-functions"],
    prerequisiteTopicSlugs: [],
    supportedBands: ["0-20", "21-40", "41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Define a base case, make progress toward it, and combine the recursive result.",
    concepts: ["base case", "recursive case", "call stack", "subproblem"],
    practicePatterns: ["factorial", "tree height", "generate subsets"],
    promotionCriteria: [
      "Has a reachable base case",
      "Passes a smaller or simpler subproblem",
      "Combines subresults correctly",
    ],
    problemTemplates: [],
  },
  {
    id: "trees-basics",
    stage: "recursive-structures",
    order: 310,
    title: "Trees",
    primaryTopicSlug: "trees",
    prerequisiteNodeIds: ["recursion-basics", "queues-basics"],
    prerequisiteTopicSlugs: ["recursion", "queues"],
    supportedBands: ["21-40", "41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective:
      "Traverse hierarchical data with recursion or a queue, depending on the required order.",
    concepts: ["root", "child", "leaf", "depth", "traversal"],
    practicePatterns: ["max depth", "invert tree", "level order"],
    promotionCriteria: [
      "Handles null child references",
      "Chooses DFS or BFS based on the task",
      "Explains the traversal order",
    ],
    problemTemplates: [],
  },
  {
    id: "bst-basics",
    stage: "recursive-structures",
    order: 320,
    title: "Binary Search Trees",
    primaryTopicSlug: "bst",
    prerequisiteNodeIds: ["trees-basics", "binary-search-basics"],
    prerequisiteTopicSlugs: ["trees", "binary-search"],
    supportedBands: ["41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Use the BST ordering rule to search, validate, and traverse sorted tree data.",
    concepts: ["left less than root", "right greater than root", "inorder traversal"],
    practicePatterns: ["search BST", "validate BST", "kth smallest"],
    promotionCriteria: [
      "Carries valid bounds through recursion",
      "Uses inorder traversal when sorted order is useful",
      "Does not apply BST logic to a plain binary tree",
    ],
    problemTemplates: [],
  },
  {
    id: "heaps-basics",
    stage: "advanced-patterns",
    order: 400,
    title: "Heaps",
    primaryTopicSlug: "heaps",
    prerequisiteNodeIds: ["arrays-basics", "sorting-basics"],
    prerequisiteTopicSlugs: ["arrays", "sorting"],
    supportedBands: ["41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Use priority ordering when repeatedly asking for the smallest or largest item.",
    concepts: ["priority queue", "min heap", "max heap", "top k"],
    practicePatterns: ["kth largest", "top k frequent", "merge k sorted lists"],
    promotionCriteria: [
      "Chooses heap when repeated best-item access is needed",
      "Explains heap size and update cost",
      "Maintains the intended heap size",
    ],
    problemTemplates: [],
  },
  {
    id: "graphs-basics",
    stage: "advanced-patterns",
    order: 410,
    title: "Graphs",
    primaryTopicSlug: "graphs",
    prerequisiteNodeIds: ["queues-basics", "recursion-basics"],
    prerequisiteTopicSlugs: ["queues", "recursion"],
    supportedBands: ["41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective:
      "Model relationships as nodes and edges, then traverse with BFS, DFS, or shortest-path tools.",
    concepts: ["node", "edge", "adjacency list", "visited set", "component"],
    practicePatterns: ["flood fill", "number of islands", "course schedule"],
    promotionCriteria: [
      "Builds or reads adjacency correctly",
      "Tracks visited states",
      "Chooses BFS for shortest unweighted distance when needed",
    ],
    problemTemplates: [],
  },
  {
    id: "dp-basics",
    stage: "advanced-patterns",
    order: 420,
    title: "Dynamic Programming",
    primaryTopicSlug: "dp",
    prerequisiteNodeIds: ["recursion-basics", "hashing-basics"],
    prerequisiteTopicSlugs: ["recursion", "hashing"],
    supportedBands: ["41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Reuse overlapping subproblem results with memoization or tabulation.",
    concepts: ["state", "transition", "memoization", "tabulation", "base case"],
    practicePatterns: ["climbing stairs", "house robber", "longest common subsequence"],
    promotionCriteria: [
      "Defines the state in one sentence",
      "Writes a recurrence or transition",
      "Explains what is cached and why",
    ],
    problemTemplates: [],
  },
  {
    id: "greedy-basics",
    stage: "advanced-patterns",
    order: 430,
    title: "Greedy",
    primaryTopicSlug: "greedy",
    prerequisiteNodeIds: ["sorting-basics"],
    prerequisiteTopicSlugs: ["sorting"],
    supportedBands: ["41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Make a local choice that can be justified as part of a globally good solution.",
    concepts: ["local choice", "exchange argument", "sorting by key", "invariant"],
    practicePatterns: ["assign cookies", "non-overlapping intervals", "jump game"],
    promotionCriteria: [
      "States the greedy choice",
      "Explains why delaying that choice does not help",
      "Recognizes when greedy needs proof or a counterexample",
    ],
    problemTemplates: [],
  },
  {
    id: "backtracking-basics",
    stage: "advanced-patterns",
    order: 440,
    title: "Backtracking",
    primaryTopicSlug: "backtracking",
    prerequisiteNodeIds: ["recursion-basics"],
    prerequisiteTopicSlugs: ["recursion"],
    supportedBands: ["41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Explore choices recursively, undo state, and prune invalid partial solutions.",
    concepts: ["choice", "constraint", "undo", "pruning", "search tree"],
    practicePatterns: ["subsets", "permutations", "N-Queens"],
    promotionCriteria: [
      "Separates choose, explore, and unchoose steps",
      "Stops when a complete solution is formed",
      "Prunes invalid choices early",
    ],
    problemTemplates: [],
  },
  {
    id: "bit-manipulation-basics",
    stage: "advanced-patterns",
    order: 450,
    title: "Bit Manipulation",
    primaryTopicSlug: "bit-manipulation",
    prerequisiteNodeIds: ["foundation-simple-math"],
    prerequisiteTopicSlugs: [],
    supportedBands: ["41-60", "61-80", "81-100"],
    depth: "scaffold",
    objective: "Use binary representation and bit operators for compact numeric state.",
    concepts: ["binary", "and", "or", "xor", "shift", "mask"],
    practicePatterns: ["single number", "counting bits", "subsets with masks"],
    promotionCriteria: [
      "Explains the relevant bit operation",
      "Handles zero and one-bit values",
      "Uses masks without changing unrelated bits",
    ],
    problemTemplates: [],
  },
];

export const CURRICULUM_NODE_BY_ID = new Map(CODEWISE_DSA_LADDER.map((node) => [node.id, node]));

export function getMasteryBandForScore(score: number | null | undefined): MasteryBand {
  const normalized = Math.max(0, Math.min(1, score ?? 0));
  if (normalized <= 0.2) return MASTERY_BAND_BY_ID.get("0-20") ?? MASTERY_BANDS[0];
  if (normalized <= 0.4) return MASTERY_BAND_BY_ID.get("21-40") ?? MASTERY_BANDS[1];
  if (normalized <= 0.6) return MASTERY_BAND_BY_ID.get("41-60") ?? MASTERY_BANDS[2];
  if (normalized <= 0.8) return MASTERY_BAND_BY_ID.get("61-80") ?? MASTERY_BANDS[3];
  return MASTERY_BAND_BY_ID.get("81-100") ?? MASTERY_BANDS[4];
}

export function isMasteryBandId(value: string): value is MasteryBandId {
  return MASTERY_BAND_BY_ID.has(value as MasteryBandId);
}

export function getMasteryBandById(bandId: MasteryBandId): MasteryBand {
  return MASTERY_BAND_BY_ID.get(bandId) ?? MASTERY_BANDS[0];
}

export function getMasteryBandRules(bandId: MasteryBandId): MasteryBandRules {
  return {
    band: getMasteryBandById(bandId),
    ...MASTERY_BAND_RULES[bandId],
  };
}

export function getCurriculumNodeById(nodeId: string): CurriculumNode | null {
  return CURRICULUM_NODE_BY_ID.get(nodeId) ?? null;
}

export function getCurriculumNodesForTopic(topicSlug: TopicSlug): CurriculumNode[] {
  return CODEWISE_DSA_LADDER.filter((node) => node.primaryTopicSlug === topicSlug);
}

export function getFirstCurriculumNode(): CurriculumNode {
  return CODEWISE_DSA_LADDER[0];
}

export function isSupportedBandForNode(node: CurriculumNode, bandId: MasteryBandId): boolean {
  return node.supportedBands.includes(bandId);
}
