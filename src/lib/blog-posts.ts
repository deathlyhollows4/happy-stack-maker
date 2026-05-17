export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  body: string[];
  tags: string[];
  readTime: number;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "why-big-o-matters",
    title: "Why Big-O Matters More Than You Think",
    date: "2026-04-20",
    author: "CodeWise",
    excerpt:
      "Most students memorise Big-O like a fact sheet. They miss the point. Complexity analysis isn't about passing interviews — it's about developing the instinct to predict how your code scales before you even run it.",
    body: [
      "Every CS student grinds through Big-O notation before placements. They memorise that binary search is O(log n), merge sort is O(n log n), and nested loops mean O(n²). Then they walk into an interview, get asked to analyse a piece of code they've never seen, and freeze.",
      "The problem isn't memorisation. It's that most courses teach complexity as a trivia fact rather than a reasoning tool. You're told what the answer is, but never how to derive it yourself.",
      "Complexity analysis is fundamentally about counting operations that grow with input size. Every loop that iterates over n elements adds a factor of n. Every halving of the search space gives you a log factor. Nested independent loops multiply. Adjacent loops add. Recursion with branching multiplies exponentially. Once you internalise these four rules, you can analyse almost anything.",
      "Here's a concrete example. Consider two_sum with a hash map. The single pass over the array is O(n). Each hash map lookup is O(1) amortised. Total: O(n). Now contrast with the brute-force nested loop — O(n²). For an array of 100,000 elements, that's the difference between 100,000 operations and 10 billion. Your code didn't just become \"faster\" — it became fundamentally feasible.",
      "This is why we at CodeWise flag complexity issues even when the code produces correct output. Passing test cases with O(n²) when O(n) exists isn't a win — it's a gap in your CS intuition. And that intuition is what separates engineers who write code from engineers who design systems.",
      "Next time you solve a DSA problem, don't stop when the tests pass. Ask yourself: what input size would break this? What's the dominant operation? Could I do it in one pass instead of two? That's the muscle Big-O is meant to build.",
    ],
    tags: ["complexity", "beginner", "interview-prep"],
    readTime: 4,
  },
  {
    slug: "deliberate-dsa-practice",
    title: "How to Practice DSA Effectively",
    date: "2026-04-25",
    author: "CodeWise",
    excerpt:
      "Grinding 500 LeetCode problems without a system is like reading a dictionary to learn a language. Deliberate practice — targeted, feedback-driven, spaced over time — builds mastery that sticks. Here's how to apply it to DSA.",
    body: [
      "The most common advice for placement preparation is 'just grind LeetCode.' But grinding without structure leads to the illusion of progress. You solve problems by pattern-matching against recently seen solutions, not by building durable understanding. Two weeks later, the same problem feels unfamiliar.",
      "Deliberate practice — a concept from cognitive psychology — requires four things: a specific skill target, immediate feedback, progressive difficulty, and spaced repetition. Applied to DSA, this means you don't just solve random problems. You pick a topic (say, sliding window), solve problems that isolate that technique, get detailed feedback on why your approach works or doesn't, and revisit the topic days later when the memory has started to fade.",
      "This is why CodeWise organises its knowledge tracing around 20 discrete CS topics. When you submit code for review, the AI doesn't just give you a pass/fail — it maps your errors to specific concepts, updates your mastery score using a Bayesian model, and generates practice problems at your exact skill level. You can see exactly where you're weak and exactly what to work on next.",
      "A concrete routine: pick your weakest topic from the dashboard. Do 3-5 problems in that topic across a week. Submit each for review. Read every explanation, not just the fix. At the end of the week, revisit the first problem. If it feels easy now, you've built durable mastery. If not, you need more focused practice on the underlying concept, not more problems.",
      "The students who improve fastest aren't the ones who solve the most problems. They're the ones who extract the most learning from each problem. Quality over quantity, every time.",
    ],
    tags: ["practice", "learning", "methodology"],
    readTime: 5,
  },
  {
    slug: "recursion-mistakes-beginners-make",
    title: "Common Beginner Mistakes in Recursion",
    date: "2026-05-02",
    author: "CodeWise",
    excerpt:
      "Recursion is elegant, powerful, and absolutely brutal when you get it wrong. The three mistakes almost every beginner makes: missing base cases, confusing pre-order vs post-order, and ignoring stack depth limits.",
    body: [
      "Recursion is the CS concept that separates 'I can code' from 'I understand computation.' It's the gateway to trees, graphs, backtracking, and dynamic programming. And almost every student makes the same three mistakes when they first encounter it.",
      "Mistake one: the missing or incomplete base case. Every recursive function needs a condition that stops the recursion. Without it, you get infinite recursion and a stack overflow. But 'incomplete' base cases are sneakier — they handle the happy path (empty array, zero, null) but miss edge cases (single element, negative numbers, already-visited nodes). Always ask: what's the smallest possible input, and does my base case handle it?",
      "Mistake two: confusing when work happens. In pre-order recursion, you process the current node before recursing into children (think: print node, then recurse left, then right). In post-order, you recurse first and process after (think: recurse left, recurse right, then compute node value from children). In-order does work between left and right recursion. Mixing these up is the root cause of so many tree and graph bugs.",
      "Mistake three: ignoring the call stack. Every recursive call consumes stack memory. Python's default recursion limit is 1000. JavaScript engines vary. Deep recursion on unbalanced trees, long linked lists, or naive Fibonacci will overflow. The fix is either tail recursion (where the language supports it) or converting to iteration with an explicit stack. Knowing when recursion is elegant versus when it's dangerous is a core engineering skill.",
      "CodeWise's review engine specifically flags these patterns: we check if your base case handles edge inputs, if your traversal order matches what the problem demands, and if your recursive depth could exceed safe limits for the input constraints. These aren't just style notes — they're correctness issues that fail in production.",
      "Recursion isn't hard because the concept is hard. It's hard because the failure modes are invisible until the stack blows up. Get the base case right, the order right, and the depth right, and the rest follows.",
    ],
    tags: ["recursion", "debugging", "beginner"],
    readTime: 5,
  },
  {
    slug: "two-pointer-pattern",
    title: "The Two-Pointer Pattern You're Missing",
    date: "2026-05-08",
    author: "CodeWise",
    excerpt:
      "Two-pointers is one of the most versatile DSA patterns, yet students consistently miss it. If you're writing nested loops to search a sorted array, you're doing it wrong. Here's when and how to use two-pointers.",
    body: [
      "You've seen the problem: find if a sorted array contains two numbers that sum to a target. The brute force is nested loops — O(n²). The optimal solution uses two pointers, one at each end, moving inward based on whether the current sum is too high or too low. O(n) time, O(1) space. But two-pointers isn't just for two_sum.",
      "The pattern generalises to any problem where you're searching for a pair (or triplet, or subarray) in a sequence and can eliminate possibilities in a single pass. The key insight: if the array is sorted, moving a pointer in one direction monotonically changes the value in a predictable way. You can make decisions with certainty, never needing to backtrack.",
      "Variations you should know: opposite-direction pointers (start and end, for two-sum and palindrome checking), same-direction fast/slow pointers (for cycle detection, middle element, removing duplicates in-place), and sliding window (fixed or variable size, for substring and subarray problems). Each variation uses the same core idea — two indices that move through the array, never needing to reset.",
      "The most common mistake: students apply two-pointers to unsorted arrays, where the monotonic property doesn't hold. If the array isn't sorted, sort it first — but remember that sorting costs O(n log n). Sometimes that's still better than O(n²). Sometimes a hash map gives you O(n) without sorting. Knowing which tool to reach for is the skill.",
      "Practice sequence: start with two_sum on a sorted array to internalise the opposite-direction pattern. Then move to container_with_most_water, which uses the same pointer movement but a different objective. Then try three_sum, which pairs two-pointers with a fixed outer element. By the third problem, you'll start seeing the pattern everywhere.",
      "At CodeWise, we track whether your solution uses the optimal pattern for the problem constraints. If you're writing nested loops where two-pointers would work, we'll flag it — not as a syntax error, but as a concept gap. The pattern itself isn't the goal; the thinking it represents is.",
    ],
    tags: ["two-pointers", "patterns", "optimisation", "intermediate"],
    readTime: 5,
  },
  {
    slug: "brute-force-to-optimal",
    title: "From Brute Force to Optimal: A Thinking Framework",
    date: "2026-05-12",
    author: "CodeWise",
    excerpt:
      "Every optimal solution starts as a brute force idea, refined through a systematic process. Here's a framework for getting from 'it works but it's slow' to 'it works and it scales' — without relying on memorised solutions.",
    body: [
      "Interviewers love asking candidates to optimise. But 'just think of the optimal solution' is terrible advice. Optimal solutions don't appear from nowhere — they emerge from systematically questioning a working brute force approach. Here's a framework that works.",
      "Step one: state the brute force out loud. For every problem, there's a naive solution — try all combinations, check all subarrays, explore all paths. Write the time and space complexity. This gives you a baseline. If brute force is already O(n) with O(1) space, you're done. (Rare, but it happens.)",
      "Step two: identify the wasted work. Run through a small example by hand. Where is the algorithm recomputing the same thing? Where is it checking possibilities that can't possibly be correct? These are your optimisation targets.",
      "Step three: pick your weapon. Wasted work falls into predictable categories. Repeated subproblems → dynamic programming or memoisation. Unnecessary comparisons → sorting plus binary search or two-pointers. Re-traversing the entire input → sliding window or prefix sums. Exploring dead-end paths → pruning in backtracking. Checking every pair → hash maps for O(1) lookup.",
      "Step four: verify the constraints. An O(n²) solution is fine for n ≤ 1000. O(n log n) handles n ≤ 10⁵ comfortably. O(n) handles n ≤ 10⁷. Don't over-optimise for small inputs, and don't under-optimise for large ones. Read the constraints first — they tell you what complexity class you need.",
      "Step five: implement, then review. Get the optimal approach working with a small test case. Then submit it to CodeWise for a pedagogical review. The AI will confirm whether your complexity analysis is correct, identify any remaining inefficiencies, and explain which CS concepts your solution demonstrates — or which ones you're still missing.",
      "This framework works because it treats optimisation as a skill, not as magic. Every step builds on the previous one. With practice, steps one through four become automatic, and step five — the review — becomes the part where you actually learn something new.",
    ],
    tags: ["optimisation", "interview-prep", "methodology", "intermediate"],
    readTime: 6,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
